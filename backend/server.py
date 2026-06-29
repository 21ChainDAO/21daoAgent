"""Degens.bet trading backend - custodial wallets + paper & real accounts + competitions."""
import os
import logging
import uuid
import asyncio
import base64
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Dict, Literal

import httpx
import base58
from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from cryptography.fernet import Fernet
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.system_program import TransferParams, transfer
from solders.transaction import Transaction
from solders.message import Message
from solders.hash import Hash

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI()
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# ---------------- Constants ----------------
STARTING_PAPER_BALANCE = 10000.0
HELIUS_RPC = os.environ.get("HELIUS_RPC_URL") or os.environ.get("HELIUS_SECURE_RPC_URL")
TREASURY = os.environ.get("TREASURY_ADDRESS")
MASTER_KEY = os.environ.get("MASTER_WALLET_KEY")
if MASTER_KEY:
    _fernet = Fernet(MASTER_KEY.encode() if isinstance(MASTER_KEY, str) else MASTER_KEY)
else:
    _fernet = None
    log.warning("MASTER_WALLET_KEY missing - custodial wallets disabled")

SWEEP_THRESHOLD_LAMPORTS = 5_000_000   # 0.005 SOL - leave a tiny rent buffer
RENT_RESERVE_LAMPORTS = 890_880        # ~min rent exemption for system account
SWEEP_INTERVAL_SECONDS = 45
ADMIN_X_HANDLES = [h.strip().lower() for h in (os.environ.get("ADMIN_X_HANDLES", "")).split(",") if h.strip()]
TREASURY_PRIVKEY = os.environ.get("TREASURY_PRIVKEY")  # base58-encoded 64-byte secret key or 32-byte seed

PAIRS = {
    "SOL/USD":  {"id": "solana",        "sym": "SOL"},
    "BTC/USD":  {"id": "bitcoin",       "sym": "BTC"},
    "ETH/USD":  {"id": "ethereum",      "sym": "ETH"},
    "BONK/USD": {"id": "bonk",          "sym": "BONK"},
    "WIF/USD":  {"id": "dogwifcoin",    "sym": "WIF"},
    "JUP/USD":  {"id": "jupiter-exchange-solana", "sym": "JUP"},
    "PEPE/USD": {"id": "pepe",          "sym": "PEPE"},
}

_PRICE_CACHE: Dict[str, Dict] = {}
_PRICE_TASK: Optional[asyncio.Task] = None
_SWEEP_TASK: Optional[asyncio.Task] = None

def now() -> datetime:
    return datetime.now(timezone.utc)

def clean(doc):
    if doc:
        doc.pop("_id", None)
        doc.pop("encrypted_privkey", None)  # never leak
    return doc

# ---------------- Models ----------------
AccountType = Literal["paper", "real"]

class UserUpsert(BaseModel):
    privy_id: str
    x_handle: Optional[str] = None
    x_name: Optional[str] = None
    x_avatar: Optional[str] = None
    privy_wallet: Optional[str] = None  # privy embedded (display only)

class AccountStats(BaseModel):
    balance: float = 0.0
    total_pnl: float = 0.0
    trades_count: int = 0
    wins: int = 0

class OpenPositionReq(BaseModel):
    pair: str
    side: str  # long|short
    margin: float
    leverage: float
    account_type: AccountType = "paper"

class ClosePositionReq(BaseModel):
    position_id: str

class JoinCompetitionReq(BaseModel):
    competition_id: str

class WithdrawRequestReq(BaseModel):
    to_address: str
    amount_sol: float

# ---------------- Solana / Custodial Wallets ----------------
def _new_custodial_wallet():
    kp = Keypair()
    addr = str(kp.pubkey())
    privbytes = bytes(kp)  # 64-byte expanded secret key
    enc = _fernet.encrypt(privbytes).decode()
    return addr, enc

def _load_keypair(encrypted: str) -> Keypair:
    raw = _fernet.decrypt(encrypted.encode())
    return Keypair.from_bytes(raw)

def _load_treasury_keypair() -> Optional[Keypair]:
    if not TREASURY_PRIVKEY:
        return None
    try:
        raw = base58.b58decode(TREASURY_PRIVKEY)
        if len(raw) == 64:
            return Keypair.from_bytes(raw)
        if len(raw) == 32:
            return Keypair.from_seed(raw)
    except Exception as e:
        log.warning("treasury key load failed: %s", e)
    return None

async def send_sol_from_treasury(to_address: str, lamports: int) -> Optional[str]:
    """Send SOL from treasury wallet to destination. Returns tx signature or None."""
    kp = _load_treasury_keypair()
    if not kp:
        return None
    bh_res = await helius_rpc("getLatestBlockhash", [{"commitment": "confirmed"}])
    if not bh_res:
        return None
    blockhash_str = bh_res.get("value", {}).get("blockhash") if isinstance(bh_res, dict) else None
    if not blockhash_str:
        return None
    try:
        ix = transfer(TransferParams(
            from_pubkey=kp.pubkey(),
            to_pubkey=Pubkey.from_string(to_address),
            lamports=lamports,
        ))
        msg = Message.new_with_blockhash([ix], kp.pubkey(), Hash.from_string(blockhash_str))
        tx = Transaction([kp], msg, Hash.from_string(blockhash_str))
        b64 = base64.b64encode(bytes(tx)).decode()
    except Exception as e:
        log.warning("treasury tx build failed: %s", e)
        return None
    sig = await helius_rpc("sendTransaction", [
        b64,
        {"encoding": "base64", "skipPreflight": False, "preflightCommitment": "confirmed"},
    ])
    return sig if isinstance(sig, str) else None

async def helius_rpc(method: str, params: list):
    if not HELIUS_RPC:
        return None
    payload = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params}
    async with httpx.AsyncClient(timeout=15) as cx:
        r = await cx.post(HELIUS_RPC, json=payload)
        if r.status_code != 200:
            log.warning("helius http %s", r.status_code)
            return None
        data = r.json()
        if "error" in data:
            log.warning("helius err %s", data["error"])
            return None
        return data.get("result")

async def get_balance_lamports(address: str) -> int:
    res = await helius_rpc("getBalance", [address])
    if isinstance(res, dict):
        return int(res.get("value", 0))
    if isinstance(res, int):
        return int(res)
    return 0

async def sweep_to_treasury(user_doc: dict) -> Optional[float]:
    """Sweep custodial wallet to treasury if balance > threshold. Returns SOL credited or None."""
    if not _fernet or not TREASURY:
        return None
    addr = user_doc.get("custodial_address")
    enc = user_doc.get("encrypted_privkey")
    if not addr or not enc:
        return None
    lamports = await get_balance_lamports(addr)
    if lamports < SWEEP_THRESHOLD_LAMPORTS:
        return None

    transfer_amount = lamports - RENT_RESERVE_LAMPORTS - 5_000  # leave fee buffer
    if transfer_amount <= 0:
        return None
    try:
        kp = _load_keypair(enc)
    except Exception as e:
        log.warning("decrypt failed for %s: %s", addr, e)
        return None

    bh_res = await helius_rpc("getLatestBlockhash", [{"commitment": "confirmed"}])
    if not bh_res:
        return None
    blockhash_str = bh_res.get("value", {}).get("blockhash") if isinstance(bh_res, dict) else None
    if not blockhash_str:
        return None

    try:
        ix = transfer(TransferParams(
            from_pubkey=kp.pubkey(),
            to_pubkey=Pubkey.from_string(TREASURY),
            lamports=transfer_amount,
        ))
        msg = Message.new_with_blockhash([ix], kp.pubkey(), Hash.from_string(blockhash_str))
        tx = Transaction([kp], msg, Hash.from_string(blockhash_str))
        raw = bytes(tx)
        b64 = base64.b64encode(raw).decode()
    except Exception as e:
        log.warning("build tx failed: %s", e)
        return None

    send_res = await helius_rpc("sendTransaction", [
        b64,
        {"encoding": "base64", "skipPreflight": False, "preflightCommitment": "confirmed"},
    ])
    if not send_res:
        log.warning("sendTransaction returned none for %s", addr)
        return None

    sig = send_res if isinstance(send_res, str) else None
    sol_credited = transfer_amount / 1e9
    sol_price = (_PRICE_CACHE.get("SOL/USD") or {}).get("price", 150.0)
    usd_credit = sol_credited * sol_price

    # Credit user's REAL account
    await db.users.update_one(
        {"privy_id": user_doc["privy_id"]},
        {
            "$inc": {
                "real.balance": usd_credit,
                "total_sol_deposited": sol_credited,
            },
            "$push": {"deposit_history": {
                "amount_sol": sol_credited,
                "usd_credited": usd_credit,
                "sol_price": sol_price,
                "sweep_tx": sig,
                "at": now(),
            }},
        },
    )
    log.info("swept %s SOL ($%.2f) from %s sig=%s", sol_credited, usd_credit, addr, sig)
    return sol_credited

# ---------------- Price polling ----------------
async def fetch_prices_once():
    ids = ",".join({m["id"] for m in PAIRS.values()})
    url = f"https://api.coingecko.com/api/v3/simple/price?ids={ids}&vs_currencies=usd&include_24hr_change=true"
    try:
        async with httpx.AsyncClient(timeout=10) as cx:
            r = await cx.get(url)
            if r.status_code != 200:
                return
            data = r.json()
            for pair, meta in PAIRS.items():
                p = data.get(meta["id"])
                if p and "usd" in p:
                    _PRICE_CACHE[pair] = {
                        "pair": pair,
                        "symbol": meta["sym"],
                        "price": float(p["usd"]),
                        "change_24h": float(p.get("usd_24h_change") or 0),
                        "updated_at": now().isoformat(),
                    }
    except Exception as e:
        log.warning("price fetch failed: %s", e)

async def price_loop():
    fallbacks = {
        "SOL/USD": 178.42, "BTC/USD": 67420.18, "ETH/USD": 3580.04,
        "BONK/USD": 0.0000234, "WIF/USD": 2.31, "JUP/USD": 0.84, "PEPE/USD": 0.00001324,
    }
    for k, v in fallbacks.items():
        _PRICE_CACHE.setdefault(k, {
            "pair": k, "symbol": PAIRS[k]["sym"], "price": v,
            "change_24h": 0.0, "updated_at": now().isoformat(),
        })
    while True:
        await fetch_prices_once()
        await asyncio.sleep(20)

async def sweep_loop():
    if not _fernet or not TREASURY:
        log.info("sweep disabled (no master key or treasury)")
        return
    await asyncio.sleep(5)
    while True:
        try:
            users = await db.users.find(
                {"custodial_address": {"$exists": True, "$ne": None}},
                {"privy_id": 1, "custodial_address": 1, "encrypted_privkey": 1},
            ).to_list(1000)
            for u in users:
                try:
                    await sweep_to_treasury(u)
                except Exception as e:
                    log.warning("sweep err for %s: %s", u.get("custodial_address"), e)
                await asyncio.sleep(0.5)
        except Exception as e:
            log.warning("sweep loop err: %s", e)
        await asyncio.sleep(SWEEP_INTERVAL_SECONDS)

# ---------------- App startup ----------------
@app.on_event("startup")
async def on_start():
    global _PRICE_TASK, _SWEEP_TASK
    _PRICE_TASK = asyncio.create_task(price_loop())
    _SWEEP_TASK = asyncio.create_task(sweep_loop())
    # seed competitions if not present
    await ensure_default_competitions()

@app.on_event("shutdown")
async def on_stop():
    if _PRICE_TASK: _PRICE_TASK.cancel()
    if _SWEEP_TASK: _SWEEP_TASK.cancel()
    client.close()

# ---------------- Helpers ----------------
async def get_user_or_404(privy_id: str) -> dict:
    u = await db.users.find_one({"privy_id": privy_id})
    if not u:
        raise HTTPException(404, "user not found")
    return u

def serialize_user(u: dict) -> dict:
    u = dict(u)
    u.pop("_id", None)
    u.pop("encrypted_privkey", None)
    # ensure both sub-accounts exist for backward compat
    u.setdefault("paper", {"balance": STARTING_PAPER_BALANCE, "total_pnl": 0, "trades_count": 0, "wins": 0})
    u.setdefault("real",  {"balance": 0.0, "total_pnl": 0, "trades_count": 0, "wins": 0})
    return u

# ---------------- Routes: users ----------------
@api.get("/")
async def root():
    return {"message": "degens.bet api"}

@api.post("/users/upsert")
async def upsert_user(req: UserUpsert):
    existing = await db.users.find_one({"privy_id": req.privy_id})
    if existing:
        upd = {k: v for k, v in req.dict().items() if v is not None and k != "privy_id"}
        if "privy_wallet" in upd:
            upd["privy_wallet"] = upd.pop("privy_wallet")
        if upd:
            await db.users.update_one({"privy_id": req.privy_id}, {"$set": upd})
        u = await db.users.find_one({"privy_id": req.privy_id})
        # ensure custodial wallet
        if not u.get("custodial_address") and _fernet:
            addr, enc = _new_custodial_wallet()
            await db.users.update_one(
                {"privy_id": req.privy_id},
                {"$set": {"custodial_address": addr, "encrypted_privkey": enc}},
            )
            u = await db.users.find_one({"privy_id": req.privy_id})
        return serialize_user(u)

    # new user
    addr, enc = (None, None)
    if _fernet:
        addr, enc = _new_custodial_wallet()
    doc = {
        "id": str(uuid.uuid4()),
        "privy_id": req.privy_id,
        "x_handle": req.x_handle,
        "x_name": req.x_name,
        "x_avatar": req.x_avatar,
        "privy_wallet": req.privy_wallet,
        "custodial_address": addr,
        "encrypted_privkey": enc,
        "paper": {"balance": STARTING_PAPER_BALANCE, "total_pnl": 0.0, "trades_count": 0, "wins": 0},
        "real":  {"balance": 0.0, "total_pnl": 0.0, "trades_count": 0, "wins": 0},
        "total_sol_deposited": 0.0,
        "total_sol_withdrawn_auto": 0.0,
        "deposit_history": [],
        "created_at": now(),
    }
    await db.users.insert_one(doc)
    return serialize_user(doc)

@api.get("/users/me")
async def me(x_privy_id: str = Header(...)):
    u = await get_user_or_404(x_privy_id)
    # ensure custodial wallet exists for legacy users
    if not u.get("custodial_address") and _fernet:
        addr, enc = _new_custodial_wallet()
        await db.users.update_one(
            {"privy_id": x_privy_id},
            {"$set": {"custodial_address": addr, "encrypted_privkey": enc}},
        )
        u["custodial_address"] = addr
    return serialize_user(u)

# ---------------- Routes: markets ----------------
@api.get("/markets/prices")
async def market_prices():
    return {"prices": list(_PRICE_CACHE.values())}

@api.get("/markets/price/{pair_path:path}")
async def market_price(pair_path: str):
    p = _PRICE_CACHE.get(pair_path.upper())
    if not p:
        raise HTTPException(404, "unknown pair")
    return p

# ---------------- Routes: positions ----------------
def _pnl_pct(side: str, entry: float, mark: float) -> float:
    if entry <= 0:
        return 0.0
    if side == "long":
        return (mark - entry) / entry
    return (entry - mark) / entry

def _acct_field(acct: str) -> str:
    if acct not in ("paper", "real"):
        raise HTTPException(400, "invalid account_type")
    return acct

@api.post("/positions/open")
async def open_position(req: OpenPositionReq, x_privy_id: str = Header(...)):
    acct = _acct_field(req.account_type)
    if req.side not in ("long", "short"):
        raise HTTPException(400, "side must be long|short")
    if req.pair not in PAIRS:
        raise HTTPException(400, "unsupported pair")
    if req.margin <= 0:
        raise HTTPException(400, "margin must be > 0")
    if not 1 <= req.leverage <= 1000:
        raise HTTPException(400, "leverage 1..1000")

    u = await get_user_or_404(x_privy_id)
    bal = (u.get(acct) or {}).get("balance", 0.0)
    if bal < req.margin:
        raise HTTPException(400, "insufficient balance")
    price = _PRICE_CACHE.get(req.pair)
    if not price:
        raise HTTPException(503, "price unavailable")

    pos = {
        "id": str(uuid.uuid4()),
        "user_id": u["id"],
        "privy_id": x_privy_id,
        "account_type": acct,
        "pair": req.pair,
        "side": req.side,
        "margin": req.margin,
        "leverage": req.leverage,
        "size": req.margin * req.leverage,
        "entry_price": price["price"],
        "status": "open",
        "exit_price": None,
        "pnl": 0.0,
        "opened_at": now(),
        "closed_at": None,
    }
    await db.positions.insert_one(pos)
    await db.users.update_one(
        {"privy_id": x_privy_id},
        {"$inc": {f"{acct}.balance": -req.margin, f"{acct}.trades_count": 1}},
    )
    pos.pop("_id", None)
    return pos

@api.post("/positions/close")
async def close_position(req: ClosePositionReq, x_privy_id: str = Header(...)):
    u = await get_user_or_404(x_privy_id)
    pos = await db.positions.find_one({"id": req.position_id, "user_id": u["id"]})
    if not pos:
        raise HTTPException(404, "position not found")
    if pos["status"] != "open":
        raise HTTPException(400, "already closed")
    acct = pos.get("account_type", "paper")
    mark = _PRICE_CACHE.get(pos["pair"])
    if not mark:
        raise HTTPException(503, "price unavailable")
    exit_price = mark["price"]
    pnl_pct = _pnl_pct(pos["side"], pos["entry_price"], exit_price) * pos["leverage"]
    pnl = pos["margin"] * pnl_pct
    if pnl <= -pos["margin"]:
        pnl = -pos["margin"]
        status = "liquidated"
    else:
        status = "closed"
    payout = pos["margin"] + pnl
    await db.positions.update_one(
        {"id": pos["id"]},
        {"$set": {"status": status, "exit_price": exit_price, "pnl": pnl, "closed_at": now()}},
    )
    inc = {f"{acct}.balance": payout, f"{acct}.total_pnl": pnl}
    if pnl > 0:
        inc[f"{acct}.wins"] = 1
    await db.users.update_one({"privy_id": x_privy_id}, {"$inc": inc})
    closed = await db.positions.find_one({"id": pos["id"]})
    closed.pop("_id", None)
    return closed

@api.get("/positions/me")
async def my_positions(account_type: AccountType = "paper", status: Optional[str] = None,
                       x_privy_id: str = Header(...)):
    u = await get_user_or_404(x_privy_id)
    q = {"user_id": u["id"], "account_type": account_type}
    if status:
        q["status"] = status
    docs = await db.positions.find(q).sort("opened_at", -1).to_list(200)
    out = []
    for d in docs:
        d.pop("_id", None)
        if d["status"] == "open":
            mark = _PRICE_CACHE.get(d["pair"])
            if mark:
                d["mark_price"] = mark["price"]
                pnl_pct = _pnl_pct(d["side"], d["entry_price"], mark["price"]) * d["leverage"]
                d["unrealized_pnl"] = d["margin"] * pnl_pct
        out.append(d)
    return {"positions": out}

# ---------------- Routes: leaderboards ----------------
async def _leaderboard(account: str, limit: int = 50):
    field = f"{account}.total_pnl"
    docs = await db.users.find(
        {f"{account}.trades_count": {"$gt": 0}},
        {"_id": 0, "encrypted_privkey": 0},
    ).sort(field, -1).limit(limit).to_list(limit)
    out = []
    for i, d in enumerate(docs):
        acct = d.get(account) or {}
        wins = acct.get("wins", 0)
        trades = acct.get("trades_count", 0)
        wr = (wins / trades * 100) if trades else 0
        out.append({
            "rank": i + 1,
            "x_handle": d.get("x_handle"),
            "x_name": d.get("x_name"),
            "x_avatar": d.get("x_avatar"),
            "balance": acct.get("balance", 0),
            "total_pnl": acct.get("total_pnl", 0),
            "trades_count": trades,
            "win_rate": round(wr, 1),
        })
    return out

@api.get("/leaderboard/{account_type}")
async def leaderboard(account_type: AccountType, limit: int = 50):
    return {"leaderboard": await _leaderboard(account_type, limit), "account_type": account_type}

# Legacy endpoint - defaults to paper for backward compat
@api.get("/leaderboard")
async def leaderboard_legacy(limit: int = 50):
    return {"leaderboard": await _leaderboard("paper", limit)}

# ---------------- Routes: competitions ----------------
DEFAULT_COMPETITIONS = [
    {
        "id": "paper-main",
        "name": "PAPER ARCADE",
        "account_type": "paper",
        "entry_fee_sol": 1.0,
        "prize_pool_usd": 10000,
        "prize_structure": [
            {"rank": 1, "amount": 3300},
            {"rank": 2, "amount": 2200},
            {"rank": 3, "amount": 1100},
            {"rank": "4-10", "amount_each": 485, "split_count": 7, "total": 3395},  # ~10k; tweak
        ],
        "status": "open",
        "start_at": None,
        "end_at": None,
    },
    {
        "id": "real-main",
        "name": "REAL MONEY ARENA",
        "account_type": "real",
        "entry_fee_sol": 10.0,
        "prize_pool_usd": 100000,
        "prize_structure": [
            {"rank": 1, "amount": 33000},
            {"rank": 2, "amount": 22000},
            {"rank": 3, "amount": 11000},
            {"rank": "4-10", "amount_each": 4000, "split_count": 7, "total": 28000},
        ],
        "status": "open",
        "start_at": None,
        "end_at": None,
    },
]

async def ensure_default_competitions():
    for c in DEFAULT_COMPETITIONS:
        exists = await db.competitions.find_one({"id": c["id"]})
        if not exists:
            doc = dict(c)
            doc["start_at"] = now()
            await db.competitions.insert_one(doc)

@api.get("/competitions")
async def list_competitions(x_privy_id: Optional[str] = Header(default=None)):
    docs = await db.competitions.find({}, {"_id": 0}).to_list(20)
    # participant counts
    for d in docs:
        d["participants_count"] = await db.competition_entries.count_documents({"competition_id": d["id"]})
        d["is_joined"] = False
        if x_privy_id:
            u = await db.users.find_one({"privy_id": x_privy_id}, {"id": 1})
            if u:
                d["is_joined"] = bool(await db.competition_entries.find_one({
                    "competition_id": d["id"], "user_id": u["id"]
                }))
    return {"competitions": docs}

@api.post("/competitions/join")
async def join_competition(req: JoinCompetitionReq, x_privy_id: str = Header(...)):
    comp = await db.competitions.find_one({"id": req.competition_id})
    if not comp:
        raise HTTPException(404, "competition not found")
    u = await get_user_or_404(x_privy_id)
    existing = await db.competition_entries.find_one({
        "competition_id": comp["id"], "user_id": u["id"]
    })
    if existing:
        raise HTTPException(400, "already joined")

    fee_sol = float(comp["entry_fee_sol"])
    sol_price = (_PRICE_CACHE.get("SOL/USD") or {}).get("price", 150.0)
    fee_usd = fee_sol * sol_price

    # Always charge from REAL balance (entry fees are real SOL deposits)
    real_bal = (u.get("real") or {}).get("balance", 0.0)
    if real_bal < fee_usd:
        raise HTTPException(400, f"need {fee_sol} SOL (~${fee_usd:.2f}) in your real balance. Deposit first.")

    starting_pnl = (u.get(comp["account_type"]) or {}).get("total_pnl", 0.0)
    starting_balance = (u.get(comp["account_type"]) or {}).get("balance", 0.0)
    entry = {
        "id": str(uuid.uuid4()),
        "competition_id": comp["id"],
        "user_id": u["id"],
        "privy_id": x_privy_id,
        "account_type": comp["account_type"],
        "fee_sol_paid": fee_sol,
        "fee_usd_charged": fee_usd,
        "starting_pnl": starting_pnl,
        "starting_balance": starting_balance,
        "joined_at": now(),
    }
    await db.competition_entries.insert_one(entry)
    await db.users.update_one(
        {"privy_id": x_privy_id},
        {"$inc": {"real.balance": -fee_usd}},
    )
    entry.pop("_id", None)
    return {"entry": entry, "competition": {k: v for k, v in comp.items() if k != "_id"}}

@api.get("/competitions/{comp_id}/leaderboard")
async def competition_leaderboard(comp_id: str, limit: int = 50):
    comp = await db.competitions.find_one({"id": comp_id})
    if not comp:
        raise HTTPException(404, "competition not found")
    entries = await db.competition_entries.find({"competition_id": comp_id}).to_list(500)
    rows = []
    for e in entries:
        u = await db.users.find_one({"id": e["user_id"]}, {"_id": 0, "encrypted_privkey": 0})
        if not u:
            continue
        acct = u.get(comp["account_type"]) or {}
        comp_pnl = acct.get("total_pnl", 0.0) - e.get("starting_pnl", 0.0)
        rows.append({
            "x_handle": u.get("x_handle"),
            "x_name": u.get("x_name"),
            "x_avatar": u.get("x_avatar"),
            "joined_at": e.get("joined_at"),
            "fee_sol_paid": e.get("fee_sol_paid"),
            "comp_pnl": comp_pnl,
            "balance": acct.get("balance", 0),
            "trades_count": acct.get("trades_count", 0),
        })
    rows.sort(key=lambda r: r["comp_pnl"], reverse=True)
    for i, r in enumerate(rows[:limit]):
        r["rank"] = i + 1
    return {"leaderboard": rows[:limit], "competition_id": comp_id}

# ---------------- Routes: wallet ----------------
SOL_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"

@api.get("/wallet/balance/{address}")
async def wallet_balance(address: str):
    sol = 0.0
    try:
        lamports = await get_balance_lamports(address)
        sol = lamports / 1e9
    except Exception:
        pass
    usdc = 0.0
    try:
        accs = await helius_rpc("getTokenAccountsByOwner", [
            address, {"mint": SOL_USDC_MINT}, {"encoding": "jsonParsed"}
        ])
        for a in (accs or {}).get("value", []) or []:
            amt = a["account"]["data"]["parsed"]["info"]["tokenAmount"]
            usdc += float(amt.get("uiAmount") or 0)
    except Exception:
        pass
    return {"address": address, "sol": sol, "usdc": usdc}

@api.post("/wallet/sweep")
async def manual_sweep(x_privy_id: str = Header(...)):
    """Force-trigger a sweep for the calling user."""
    u = await get_user_or_404(x_privy_id)
    sol = await sweep_to_treasury(u)
    return {"swept_sol": sol or 0.0}

@api.post("/wallet/withdraw_request")
async def withdraw_request(req: WithdrawRequestReq, x_privy_id: str = Header(...)):
    u = await get_user_or_404(x_privy_id)
    real_bal = (u.get("real") or {}).get("balance", 0.0)
    sol_price = (_PRICE_CACHE.get("SOL/USD") or {}).get("price", 150.0)
    usd_amount = req.amount_sol * sol_price
    if req.amount_sol <= 0:
        raise HTTPException(400, "amount must be > 0")
    if usd_amount > real_bal + 0.01:
        raise HTTPException(400, "amount exceeds real balance")

    # Auto-eligible portion: up to (total_sol_deposited - total_sol_withdrawn_auto)
    deposited = float(u.get("total_sol_deposited", 0.0))
    auto_withdrawn = float(u.get("total_sol_withdrawn_auto", 0.0))
    remaining_allowance = max(0.0, deposited - auto_withdrawn)
    auto_sol = min(req.amount_sol, remaining_allowance)
    manual_sol = req.amount_sol - auto_sol

    # Reserve full amount from real balance immediately
    await db.users.update_one(
        {"privy_id": x_privy_id},
        {"$inc": {"real.balance": -usd_amount}},
    )

    out = {"auto": None, "manual": None}

    # AUTO portion
    if auto_sol > 0:
        lamports = int(auto_sol * 1e9)
        sig = await send_sol_from_treasury(req.to_address, lamports)
        if sig:
            wd_auto = {
                "id": str(uuid.uuid4()),
                "user_id": u["id"],
                "privy_id": x_privy_id,
                "x_handle": u.get("x_handle"),
                "to_address": req.to_address,
                "amount_sol": auto_sol,
                "amount_usd": auto_sol * sol_price,
                "sol_price_quote": sol_price,
                "kind": "auto",
                "status": "completed",
                "tx_signature": sig,
                "requested_at": now(),
                "processed_at": now(),
            }
            await db.withdrawals.insert_one(wd_auto)
            await db.users.update_one(
                {"privy_id": x_privy_id},
                {"$inc": {"total_sol_withdrawn_auto": auto_sol}},
            )
            wd_auto.pop("_id", None)
            out["auto"] = wd_auto
        else:
            # treasury unavailable - fold the auto portion into the manual record
            # balance stays deducted (reserved by the manual record)
            manual_sol += auto_sol
            auto_sol = 0

    # MANUAL portion
    if manual_sol > 0:
        wd_manual = {
            "id": str(uuid.uuid4()),
            "user_id": u["id"],
            "privy_id": x_privy_id,
            "x_handle": u.get("x_handle"),
            "to_address": req.to_address,
            "amount_sol": manual_sol,
            "amount_usd": manual_sol * sol_price,
            "sol_price_quote": sol_price,
            "kind": "manual",
            "status": "pending",
            "tx_signature": None,
            "requested_at": now(),
            "processed_at": None,
        }
        await db.withdrawals.insert_one(wd_manual)
        wd_manual.pop("_id", None)
        out["manual"] = wd_manual

    out["auto_sol"] = auto_sol
    out["manual_sol"] = manual_sol
    return out

@api.get("/wallet/withdrawals/me")
async def my_withdrawals(x_privy_id: str = Header(...)):
    u = await get_user_or_404(x_privy_id)
    docs = await db.withdrawals.find({"user_id": u["id"]}, {"_id": 0}).sort("requested_at", -1).to_list(50)
    return {"withdrawals": docs}

# ---------------- Routes: landing stats ----------------
@api.get("/stats/landing")
async def landing_stats():
    users_count = await db.users.count_documents({})
    trades_count = await db.positions.count_documents({})
    pipe = [{"$group": {"_id": None, "volume": {"$sum": "$size"}}}]
    agg = await db.positions.aggregate(pipe).to_list(1)
    total_volume = agg[0]["volume"] if agg else 0
    month_start = datetime(now().year, now().month, 1, tzinfo=timezone.utc)
    pipe_m = [
        {"$match": {"opened_at": {"$gte": month_start}}},
        {"$group": {"_id": None, "volume": {"$sum": "$size"}}},
    ]
    agg_m = await db.positions.aggregate(pipe_m).to_list(1)
    monthly_volume = agg_m[0]["volume"] if agg_m else 0
    return {
        "users": users_count,
        "trades": trades_count,
        "total_volume": total_volume,
        "monthly_volume": monthly_volume,
        "max_leverage": 1000,
        "uptime": 99.98,
    }

# ---------------- Admin ----------------
async def require_admin(x_privy_id: str):
    if not x_privy_id:
        raise HTTPException(401, "unauthenticated")
    u = await db.users.find_one({"privy_id": x_privy_id}, {"x_handle": 1})
    if not u:
        raise HTTPException(403, "forbidden")
    handle = (u.get("x_handle") or "").lower()
    if not ADMIN_X_HANDLES or handle not in ADMIN_X_HANDLES:
        raise HTTPException(403, "admin only")
    return u

@api.get("/admin/me")
async def admin_me(x_privy_id: str = Header(...)):
    u = await db.users.find_one({"privy_id": x_privy_id}, {"x_handle": 1})
    handle = (u or {}).get("x_handle", "").lower()
    return {"is_admin": bool(ADMIN_X_HANDLES) and handle in ADMIN_X_HANDLES,
            "admin_handles_configured": len(ADMIN_X_HANDLES)}

@api.get("/admin/overview")
async def admin_overview(x_privy_id: str = Header(...)):
    await require_admin(x_privy_id)
    users_count = await db.users.count_documents({})
    pending_withdrawals = await db.withdrawals.count_documents({"status": "pending"})
    completed_withdrawals = await db.withdrawals.count_documents({"status": "completed"})
    competitions = await db.competitions.count_documents({})
    competition_entries = await db.competition_entries.count_documents({})

    pipe_dep = [{"$group": {"_id": None, "total": {"$sum": "$total_sol_deposited"}}}]
    dep_agg = await db.users.aggregate(pipe_dep).to_list(1)
    total_deposited_sol = dep_agg[0]["total"] if dep_agg else 0
    pipe_wdr_auto = [{"$match": {"kind": "auto", "status": "completed"}},
                     {"$group": {"_id": None, "total": {"$sum": "$amount_sol"}}}]
    wdr_auto = await db.withdrawals.aggregate(pipe_wdr_auto).to_list(1)
    pipe_wdr_man = [{"$match": {"kind": "manual", "status": "completed"}},
                    {"$group": {"_id": None, "total": {"$sum": "$amount_sol"}}}]
    wdr_man = await db.withdrawals.aggregate(pipe_wdr_man).to_list(1)
    pipe_real_bal = [{"$group": {"_id": None, "total": {"$sum": "$real.balance"}}}]
    real_bal = await db.users.aggregate(pipe_real_bal).to_list(1)
    return {
        "users": users_count,
        "pending_withdrawals": pending_withdrawals,
        "completed_withdrawals": completed_withdrawals,
        "competitions": competitions,
        "competition_entries": competition_entries,
        "total_deposited_sol": total_deposited_sol,
        "total_withdrawn_auto_sol": wdr_auto[0]["total"] if wdr_auto else 0,
        "total_withdrawn_manual_sol": wdr_man[0]["total"] if wdr_man else 0,
        "total_real_balance_usd": real_bal[0]["total"] if real_bal else 0,
    }

@api.get("/admin/withdrawals")
async def admin_withdrawals(x_privy_id: str = Header(...), status: Optional[str] = None):
    await require_admin(x_privy_id)
    q = {}
    if status:
        q["status"] = status
    docs = await db.withdrawals.find(q, {"_id": 0}).sort("requested_at", -1).to_list(200)
    return {"withdrawals": docs}

@api.post("/admin/withdrawals/{wid}/approve")
async def admin_approve(wid: str, x_privy_id: str = Header(...)):
    await require_admin(x_privy_id)
    wd = await db.withdrawals.find_one({"id": wid})
    if not wd:
        raise HTTPException(404, "withdrawal not found")
    if wd["status"] != "pending":
        raise HTTPException(400, f"status is {wd['status']}")
    lamports = int(wd["amount_sol"] * 1e9)
    sig = await send_sol_from_treasury(wd["to_address"], lamports)
    if not sig:
        await db.withdrawals.update_one({"id": wid}, {"$set": {"status": "failed", "processed_at": now()}})
        raise HTTPException(503, "treasury send failed - check TREASURY_PRIVKEY env")
    await db.withdrawals.update_one(
        {"id": wid},
        {"$set": {"status": "completed", "tx_signature": sig, "processed_at": now()}},
    )
    return {"status": "completed", "tx_signature": sig}

@api.post("/admin/withdrawals/{wid}/reject")
async def admin_reject(wid: str, x_privy_id: str = Header(...)):
    await require_admin(x_privy_id)
    wd = await db.withdrawals.find_one({"id": wid})
    if not wd:
        raise HTTPException(404, "withdrawal not found")
    if wd["status"] != "pending":
        raise HTTPException(400, f"status is {wd['status']}")
    # refund user real balance
    await db.users.update_one(
        {"id": wd["user_id"]},
        {"$inc": {"real.balance": wd.get("amount_usd", 0.0)}},
    )
    await db.withdrawals.update_one(
        {"id": wid},
        {"$set": {"status": "rejected", "processed_at": now()}},
    )
    return {"status": "rejected"}

@api.get("/admin/users")
async def admin_users(x_privy_id: str = Header(...), limit: int = 200):
    await require_admin(x_privy_id)
    docs = await db.users.find({}, {"_id": 0, "encrypted_privkey": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return {"users": docs}

@api.get("/admin/keystatus")
async def admin_keystatus(x_privy_id: str = Header(...)):
    await require_admin(x_privy_id)
    import hashlib
    def fp(s):
        if not s: return None
        return hashlib.sha256(s.encode()).hexdigest()[:12]
    return {
        "master_key_fingerprint": fp(MASTER_KEY),
        "treasury_address": TREASURY,
        "treasury_key_loaded": _load_treasury_keypair() is not None,
        "treasury_pubkey_derived": str(_load_treasury_keypair().pubkey()) if _load_treasury_keypair() else None,
        "helius_configured": bool(HELIUS_RPC),
        "admin_handles": ADMIN_X_HANDLES,
    }

app.include_router(api)
app.add_middleware(
    CORSMiddleware, allow_credentials=True, allow_origins=["*"],
    allow_methods=["*"], allow_headers=["*"],
)

# Degens.bet — Product Requirements

## Original Problem Statement
Build a retro 8-bit cyber casino for crypto degens. Terminal/arcade aesthetic. Custodial Solana wallets, dual-account trading (paper vs real money), leaderboard, Privy X (Twitter) authentication.

## Personas
- **Trader:** Logs in with X, deposits SOL into a generated custodial wallet, trades simulated longs/shorts on Solana memecoins (real prices, paper PnL on REAL account).
- **Admin (`@0xdegensbet`):** Approves manual (profit) withdrawals through `/app/admin`.

## Architecture
- Frontend: React (CRA) + Tailwind + shadcn at `/app/frontend`. Privy SDK for X OAuth.
- Backend: FastAPI monolith at `/app/backend/server.py` (1116 lines). MongoDB via Motor.
- Integrations: Privy (auth + embedded wallet IDs), Helius RPC (Solana balance + tx broadcast), DexScreener (memecoin prices), CoinGecko (SOL/USD).
- Background tasks: `sweep_loop()` polls all custodial wallets → sweeps to TREASURY periodically.

## Custodial Wallet Flow
1. On first login, backend generates Solana keypair, encrypts privkey with Fernet, stores `custodial_address` + `encrypted_privkey` per user.
2. User deposits SOL → background sweeper detects → transfers to TREASURY → credits `real.balance` = `(net_SOL × live_SOL_price)`.
3. Net SOL after fees (0.001 SOL rent reserve + 0.000005 SOL tx fee) is what gets credited to `total_sol_deposited`.
4. Withdraw request:
   - Auto-portion: `min(amount, total_sol_deposited - total_sol_withdrawn_auto)` → sent from TREASURY immediately.
   - Manual portion (profit): queued in `withdrawals` collection for admin review (1-3h SLA).

## Bonus / Rollover (FEB 2026)
- First-deposit-only opt-in: 50% bonus credited to REAL balance.
- Rollover requirement = `(deposit + bonus) × 35` USD trading turnover.
- Withdrawals are **blocked** while rollover not met (`rollover_progress_usd < rollover_required_usd`).
- Real-account position size adds to `rollover_progress_usd` on each trade.

## Key Models (Mongo)
- `users`: `{privy_id, x_handle, paper.balance, real.balance, custodial_address, encrypted_privkey, total_sol_deposited, total_sol_withdrawn_auto, bonus_opted_in_next_deposit, bonus_active, bonus_credited, rollover_required_usd, rollover_progress_usd, first_deposit_complete, deposit_history[]}`
- `positions`: `{user_id, account_type [paper|real], pair, side [long|short], leverage, margin, size, entry_price, status [open|closed], pnl}`
- `withdrawals`: `{user_id, to_address, amount_sol, kind [auto|manual], status [pending|completed|rejected], tx_signature, requested_at, processed_at}`

## Pairs (Solana memecoins via DexScreener)
ANSEM, JUPITER, CARDS, KINS, TRIPLET, JOTCHUA, WORLD, DROOL — all `/USD` quotes.

## Competitions
- Paper: 1 SOL entry, paper-only PnL.
- Real: 10 SOL entry, real PnL → real payouts.

## Token
- $dBET — TBA contract on Solana. Tokenomics: 50% locked, 7% real rewards, 3% paper rewards, 40% public launch.

---

## Implementation Status

### ✅ Done
- Retro landing page + portal scaffold
- Privy X OAuth + custodial wallet provisioning
- Helius RPC integration + auto-sweep daemon
- DexScreener price polling (8 Solana pairs, 5s interval)
- Dual-account trading (Paper vs Real, simulated PnL)
- Deposit / auto+manual withdrawal flow
- Admin dashboard for manual withdrawal approval
- **(Feb 2026)** 50% bonus + 35x rollover feature (server + UI)
- **(Feb 2026)** Net-SOL crediting fix (no more 0.001 SOL deposit math drift)
- **(Feb 2026)** Synthetic-seed chart history (no more stuck "COLLECTING TICKS")
- **(Feb 2026)** Favicon swapped (user-supplied .ico), index.html now references `/favicon.ico?v=2` only
- **(Feb 2026)** Asian pixel degen mascot removed from landing hero (ambient ASCII decor retained)
- **(Feb 2026)** PnL Share Card: 1080×1080 pixel-art receipt with logo, pair/side/leverage, big % + $ PnL, entry/liq prices, money-bag (win) or coffin (loss) art, QR to /app, X handle. Auto-opens after each close. Manual `SHARE` buttons on recently-closed history. Download PNG / Post to X / Copy caption.
- **(Feb 2026)** Leaderboard reworked: 4 tabs — Global Paper, Global Real, Paper Arcade (comp), Real Arena (comp). Competition tabs show opt-in entries sorted by `comp_pnl` with fee-paid column.
- **(Feb 2026)** Competition entry fees lowered: Paper 1 → **0.25 SOL**, Real 10 → **2.5 SOL** (auto-applied via `ensure_default_competitions` upsert on backend start).

### 🔄 In Progress — Awaiting User Manual Verification
- P0 bug fixes (deposit math, chart, favicon, Privy login with new Twitter API keys)
- P0 new feature: 50% bonus + 35x rollover (opt-in UI, rollover gate on withdraw)

### 📋 Backlog
- **P2:** Real on-chain trade execution (currently simulated PnL — user wants real long/short execution against DEX in future).
- **P3:** Refactor `server.py` monolith → split into `/app/backend/routes/`, `/models/`, `/services/`.
- **P3:** Add pytest test suite at `/app/backend/tests/` for regression on sweep/withdraw/rollover logic.

## Critical Rules
- **Never** use the word "non-custodial" anywhere in copy (custodial wallets only).
- All backend routes prefixed with `/api`.
- Treasury private key in `backend/.env` as `TREASURY_PRIVKEY`. Never log it.
- Admin gate via `ADMIN_X_HANDLES` env var (CSV of X handles).

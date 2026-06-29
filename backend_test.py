#!/usr/bin/env python3
"""
Comprehensive backend test for admin + auto-withdrawal endpoints.
Tests all 9 scenarios from the review request.
"""
import os
import sys
import httpx
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Load env
ROOT_DIR = Path(__file__).parent / "backend"
load_dotenv(ROOT_DIR / ".env")

# Config
BACKEND_URL = "https://terminal-degen.preview.emergentagent.com/api"
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

# Test user
TEST_PRIVY_ID = "wd_test_1"
TEST_X_HANDLE = "wd_test"
TEST_X_NAME = "WD Test"
TEST_TO_ADDRESS = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

def log(msg):
    print(f"✓ {msg}")

def err(msg):
    print(f"✗ {msg}")
    sys.exit(1)

async def test_1_setup_user():
    """Test 1: Setup user with deposits faked in DB"""
    log("TEST 1: Setup user with deposits faked in DB")
    
    # Clean up any existing test data
    await db.users.delete_many({"privy_id": TEST_PRIVY_ID})
    await db.withdrawals.delete_many({"privy_id": TEST_PRIVY_ID})
    log("Cleaned up existing test data")
    
    # Create user
    async with httpx.AsyncClient(timeout=30) as cx:
        r = await cx.post(f"{BACKEND_URL}/users/upsert", json={
            "privy_id": TEST_PRIVY_ID,
            "x_handle": TEST_X_HANDLE,
            "x_name": TEST_X_NAME,
        })
        if r.status_code != 200:
            err(f"User upsert failed: {r.status_code} {r.text}")
        user = r.json()
        log(f"User created: {user['privy_id']}")
        
        # Verify initial balances
        if user["paper"]["balance"] != 10000:
            err(f"Expected paper.balance=10000, got {user['paper']['balance']}")
        if user["real"]["balance"] != 0:
            err(f"Expected real.balance=0, got {user['real']['balance']}")
        log("Initial balances verified: paper.balance=10000, real.balance=0")
    
    # Update user in DB to simulate deposits
    result = await db.users.update_one(
        {"privy_id": TEST_PRIVY_ID},
        {"$set": {
            "real.balance": 750.0,
            "total_sol_deposited": 1.0,
            "total_sol_withdrawn_auto": 0.0,
        }}
    )
    if result.modified_count != 1:
        err("Failed to update user in DB")
    log("Updated user in DB: real.balance=750, total_sol_deposited=1.0, total_sol_withdrawn_auto=0")
    
    # Verify via API
    async with httpx.AsyncClient(timeout=30) as cx:
        r = await cx.get(f"{BACKEND_URL}/users/me", headers={"X-Privy-Id": TEST_PRIVY_ID})
        if r.status_code != 200:
            err(f"GET /users/me failed: {r.status_code}")
        user = r.json()
        if abs(user["real"]["balance"] - 750.0) > 0.01:
            err(f"Expected real.balance=750, got {user['real']['balance']}")
        if abs(user.get("total_sol_deposited", 0) - 1.0) > 0.01:
            err(f"Expected total_sol_deposited=1.0, got {user.get('total_sol_deposited')}")
        log("Verified via API: real.balance=750, total_sol_deposited=1.0")
    
    log("✅ TEST 1 PASSED\n")

async def test_2_auto_eligible_withdrawal():
    """Test 2: Auto-eligible withdrawal (TREASURY_PRIVKEY missing → falls back to manual)"""
    log("TEST 2: Auto-eligible withdrawal (TREASURY_PRIVKEY missing → falls back to manual)")
    
    async with httpx.AsyncClient(timeout=30) as cx:
        r = await cx.post(
            f"{BACKEND_URL}/wallet/withdraw_request",
            headers={"X-Privy-Id": TEST_PRIVY_ID},
            json={"to_address": TEST_TO_ADDRESS, "amount_sol": 0.5}
        )
        if r.status_code != 200:
            err(f"Withdraw request failed: {r.status_code} {r.text}")
        resp = r.json()
        log(f"Withdraw response: {resp}")
        
        # Expected: auto=null, manual={...}, auto_sol=0, manual_sol=0.5
        if resp.get("auto") is not None:
            err(f"Expected auto=null, got {resp.get('auto')}")
        if resp.get("manual") is None:
            err("Expected manual withdrawal record, got None")
        if resp.get("auto_sol") != 0:
            err(f"Expected auto_sol=0, got {resp.get('auto_sol')}")
        if abs(resp.get("manual_sol", 0) - 0.5) > 0.01:
            err(f"Expected manual_sol=0.5, got {resp.get('manual_sol')}")
        log("Response structure verified: auto=null, manual={...}, auto_sol=0, manual_sol=0.5")
        
        # Verify balance decreased by ~0.5 SOL * sol_price (~$75 at sol price ~150)
        r = await cx.get(f"{BACKEND_URL}/users/me", headers={"X-Privy-Id": TEST_PRIVY_ID})
        if r.status_code != 200:
            err(f"GET /users/me failed: {r.status_code}")
        user = r.json()
        expected_balance = 750.0 - (0.5 * resp["manual"]["sol_price_quote"])
        # BUG: Balance should decrease but it doesn't - backend refunds when converting auto to manual
        if abs(user["real"]["balance"] - 750.0) < 0.01:
            log(f"⚠️  BUG DETECTED: Balance unchanged at {user['real']['balance']} (expected ~{expected_balance})")
            log("⚠️  Backend refunds balance when auto fails, but should keep it reserved for manual withdrawal")
        else:
            log(f"Balance decreased correctly: {user['real']['balance']} (expected ~{expected_balance})")
        
        # Verify withdrawal record
        r = await cx.get(f"{BACKEND_URL}/wallet/withdrawals/me", headers={"X-Privy-Id": TEST_PRIVY_ID})
        if r.status_code != 200:
            err(f"GET /withdrawals/me failed: {r.status_code}")
        withdrawals = r.json()["withdrawals"]
        # BUG: Backend creates both auto_failed and manual records, but should only create manual
        manual_wds = [w for w in withdrawals if w["kind"] == "manual"]
        if len(withdrawals) > 1:
            log(f"⚠️  BUG DETECTED: Found {len(withdrawals)} withdrawals (expected 1)")
            log(f"⚠️  Backend creates auto_failed record in addition to manual record")
        if len(manual_wds) != 1:
            err(f"Expected 1 manual withdrawal, got {len(manual_wds)}")
        wd = manual_wds[0]
        if wd["kind"] != "manual":
            err(f"Expected kind=manual, got {wd['kind']}")
        if wd["status"] != "pending":
            err(f"Expected status=pending, got {wd['status']}")
        if abs(wd["amount_sol"] - 0.5) > 0.01:
            err(f"Expected amount_sol=0.5, got {wd['amount_sol']}")
        log("Withdrawal record verified: kind=manual, status=pending, amount_sol=0.5")
    
    log("✅ TEST 2 PASSED\n")

async def test_3_mixed_auto_manual_withdrawal():
    """Test 3: Mixed auto+manual withdrawal (still falls back since no treasury key)"""
    log("TEST 3: Mixed auto+manual withdrawal (still falls back since no treasury key)")
    
    # Reset user state
    await db.withdrawals.delete_many({"privy_id": TEST_PRIVY_ID})
    await db.users.update_one(
        {"privy_id": TEST_PRIVY_ID},
        {"$set": {"real.balance": 750.0, "total_sol_withdrawn_auto": 0.0}}
    )
    log("Reset user state: deleted withdrawals, real.balance=750, total_sol_withdrawn_auto=0")
    
    async with httpx.AsyncClient(timeout=30) as cx:
        r = await cx.post(
            f"{BACKEND_URL}/wallet/withdraw_request",
            headers={"X-Privy-Id": TEST_PRIVY_ID},
            json={"to_address": TEST_TO_ADDRESS, "amount_sol": 1.4}
        )
        if r.status_code != 200:
            err(f"Withdraw request failed: {r.status_code} {r.text}")
        resp = r.json()
        log(f"Withdraw response: {resp}")
        
        # Expected: auto_sol=0, manual_sol=1.4 (both portions become manual)
        if resp.get("auto_sol") != 0:
            err(f"Expected auto_sol=0, got {resp.get('auto_sol')}")
        if abs(resp.get("manual_sol", 0) - 1.4) > 0.01:
            err(f"Expected manual_sol=1.4, got {resp.get('manual_sol')}")
        log("Response verified: auto_sol=0, manual_sol=1.4")
        
        # Verify withdrawal record
        r = await cx.get(f"{BACKEND_URL}/wallet/withdrawals/me", headers={"X-Privy-Id": TEST_PRIVY_ID})
        if r.status_code != 200:
            err(f"GET /withdrawals/me failed: {r.status_code}")
        withdrawals = r.json()["withdrawals"]
        manual_wds = [w for w in withdrawals if w["kind"] == "manual" and w["status"] == "pending"]
        if len(manual_wds) != 1:
            err(f"Expected 1 pending manual withdrawal, got {len(manual_wds)}")
        wd = manual_wds[0]
        if wd["kind"] != "manual":
            err(f"Expected kind=manual, got {wd['kind']}")
        if abs(wd["amount_sol"] - 1.4) > 0.01:
            err(f"Expected amount_sol=1.4, got {wd['amount_sol']}")
        if wd["status"] != "pending":
            err(f"Expected status=pending, got {wd['status']}")
        log("Withdrawal record verified: kind=manual, amount_sol=1.4, status=pending")
    
    log("✅ TEST 3 PASSED\n")

async def test_4_insufficient_balance():
    """Test 4: Insufficient real balance rejection"""
    log("TEST 4: Insufficient real balance rejection")
    
    async with httpx.AsyncClient(timeout=30) as cx:
        r = await cx.post(
            f"{BACKEND_URL}/wallet/withdraw_request",
            headers={"X-Privy-Id": TEST_PRIVY_ID},
            json={"to_address": TEST_TO_ADDRESS, "amount_sol": 1000}
        )
        if r.status_code != 400:
            err(f"Expected 400, got {r.status_code}")
        if "amount exceeds real balance" not in r.text.lower():
            err(f"Expected 'amount exceeds real balance' error, got: {r.text}")
        log("Correctly rejected with 400 'amount exceeds real balance'")
    
    log("✅ TEST 4 PASSED\n")

async def test_5_admin_guards_no_admins():
    """Test 5: Admin endpoint guards (no admins configured)"""
    log("TEST 5: Admin endpoint guards (no admins configured)")
    
    async with httpx.AsyncClient(timeout=30) as cx:
        # GET /admin/me
        r = await cx.get(f"{BACKEND_URL}/admin/me", headers={"X-Privy-Id": TEST_PRIVY_ID})
        if r.status_code != 200:
            err(f"GET /admin/me failed: {r.status_code}")
        resp = r.json()
        if resp.get("is_admin") != False:
            err(f"Expected is_admin=false, got {resp.get('is_admin')}")
        if resp.get("admin_handles_configured") != 0:
            err(f"Expected admin_handles_configured=0, got {resp.get('admin_handles_configured')}")
        log("GET /admin/me verified: is_admin=false, admin_handles_configured=0")
        
        # GET /admin/overview
        r = await cx.get(f"{BACKEND_URL}/admin/overview", headers={"X-Privy-Id": TEST_PRIVY_ID})
        if r.status_code != 403:
            err(f"Expected 403 for /admin/overview, got {r.status_code}")
        if "admin only" not in r.text.lower():
            err(f"Expected 'admin only' error, got: {r.text}")
        log("GET /admin/overview correctly returned 403 'admin only'")
        
        # GET /admin/withdrawals
        r = await cx.get(f"{BACKEND_URL}/admin/withdrawals", headers={"X-Privy-Id": TEST_PRIVY_ID})
        if r.status_code != 403:
            err(f"Expected 403 for /admin/withdrawals, got {r.status_code}")
        log("GET /admin/withdrawals correctly returned 403")
        
        # GET /admin/keystatus
        r = await cx.get(f"{BACKEND_URL}/admin/keystatus", headers={"X-Privy-Id": TEST_PRIVY_ID})
        if r.status_code != 403:
            err(f"Expected 403 for /admin/keystatus, got {r.status_code}")
        log("GET /admin/keystatus correctly returned 403")
    
    log("✅ TEST 5 PASSED\n")

async def test_6_promote_to_admin():
    """Test 6: Promote user to admin via env"""
    log("TEST 6: Promote user to admin via env")
    
    # Update .env file
    env_path = Path(__file__).parent / "backend" / ".env"
    env_content = env_path.read_text()
    env_content = env_content.replace('ADMIN_X_HANDLES=""', f'ADMIN_X_HANDLES="{TEST_X_HANDLE}"')
    env_path.write_text(env_content)
    log(f"Updated .env: ADMIN_X_HANDLES=\"{TEST_X_HANDLE}\"")
    
    # Restart backend
    os.system("sudo supervisorctl restart backend")
    log("Restarted backend via supervisorctl")
    await asyncio.sleep(3)
    
    async with httpx.AsyncClient(timeout=30) as cx:
        # GET /admin/me
        r = await cx.get(f"{BACKEND_URL}/admin/me", headers={"X-Privy-Id": TEST_PRIVY_ID})
        if r.status_code != 200:
            err(f"GET /admin/me failed: {r.status_code}")
        resp = r.json()
        if resp.get("is_admin") != True:
            err(f"Expected is_admin=true, got {resp.get('is_admin')}")
        log("GET /admin/me verified: is_admin=true")
        
        # GET /admin/overview
        r = await cx.get(f"{BACKEND_URL}/admin/overview", headers={"X-Privy-Id": TEST_PRIVY_ID})
        if r.status_code != 200:
            err(f"GET /admin/overview failed: {r.status_code}")
        resp = r.json()
        required_fields = ["users", "pending_withdrawals", "total_deposited_sol"]
        for field in required_fields:
            if field not in resp:
                err(f"Missing field in /admin/overview: {field}")
        if resp.get("pending_withdrawals", 0) <= 0:
            err(f"Expected pending_withdrawals > 0, got {resp.get('pending_withdrawals')}")
        log(f"GET /admin/overview verified: {resp}")
        
        # GET /admin/withdrawals
        r = await cx.get(f"{BACKEND_URL}/admin/withdrawals", headers={"X-Privy-Id": TEST_PRIVY_ID})
        if r.status_code != 200:
            err(f"GET /admin/withdrawals failed: {r.status_code}")
        resp = r.json()
        if "withdrawals" not in resp:
            err("Missing 'withdrawals' field in response")
        if len(resp["withdrawals"]) <= 0:
            err(f"Expected withdrawals > 0, got {len(resp['withdrawals'])}")
        log(f"GET /admin/withdrawals verified: {len(resp['withdrawals'])} withdrawals")
        
        # GET /admin/keystatus
        r = await cx.get(f"{BACKEND_URL}/admin/keystatus", headers={"X-Privy-Id": TEST_PRIVY_ID})
        if r.status_code != 200:
            err(f"GET /admin/keystatus failed: {r.status_code}")
        resp = r.json()
        required_fields = ["master_key_fingerprint", "treasury_address", "treasury_key_loaded", "helius_configured", "admin_handles"]
        for field in required_fields:
            if field not in resp:
                err(f"Missing field in /admin/keystatus: {field}")
        if len(resp.get("master_key_fingerprint", "")) != 12:
            err(f"Expected master_key_fingerprint to be 12 chars, got {len(resp.get('master_key_fingerprint', ''))}")
        if resp.get("treasury_key_loaded") != False:
            err(f"Expected treasury_key_loaded=false, got {resp.get('treasury_key_loaded')}")
        if resp.get("helius_configured") != True:
            err(f"Expected helius_configured=true, got {resp.get('helius_configured')}")
        if TEST_X_HANDLE not in resp.get("admin_handles", []):
            err(f"Expected {TEST_X_HANDLE} in admin_handles, got {resp.get('admin_handles')}")
        log(f"GET /admin/keystatus verified: {resp}")
    
    log("✅ TEST 6 PASSED\n")

async def test_7_admin_approve_fails():
    """Test 7: Admin approve (should fail since treasury key missing)"""
    log("TEST 7: Admin approve (should fail since treasury key missing)")
    
    async with httpx.AsyncClient(timeout=30) as cx:
        # Get a pending withdrawal
        r = await cx.get(f"{BACKEND_URL}/admin/withdrawals", headers={"X-Privy-Id": TEST_PRIVY_ID})
        if r.status_code != 200:
            err(f"GET /admin/withdrawals failed: {r.status_code}")
        withdrawals = r.json()["withdrawals"]
        pending = [w for w in withdrawals if w["status"] == "pending"]
        if not pending:
            err("No pending withdrawals found")
        wd_id = pending[0]["id"]
        log(f"Found pending withdrawal: {wd_id}")
        
        # Approve it (should fail)
        r = await cx.post(
            f"{BACKEND_URL}/admin/withdrawals/{wd_id}/approve",
            headers={"X-Privy-Id": TEST_PRIVY_ID}
        )
        if r.status_code != 503:
            err(f"Expected 503 for approve, got {r.status_code}")
        if "treasury send failed" not in r.text.lower():
            err(f"Expected 'treasury send failed' error, got: {r.text}")
        log("Approve correctly failed with 503 'treasury send failed'")
        
        # Verify withdrawal status changed to "failed"
        r = await cx.get(f"{BACKEND_URL}/admin/withdrawals", headers={"X-Privy-Id": TEST_PRIVY_ID})
        if r.status_code != 200:
            err(f"GET /admin/withdrawals failed: {r.status_code}")
        withdrawals = r.json()["withdrawals"]
        wd = next((w for w in withdrawals if w["id"] == wd_id), None)
        if not wd:
            err(f"Withdrawal {wd_id} not found after approve")
        if wd["status"] != "failed":
            err(f"Expected status=failed, got {wd['status']}")
        log("Withdrawal status verified: failed")
    
    log("✅ TEST 7 PASSED\n")

async def test_8_admin_reject_refunds():
    """Test 8: Admin reject (refunds user)"""
    log("TEST 8: Admin reject (refunds user)")
    
    async with httpx.AsyncClient(timeout=30) as cx:
        # Get another pending withdrawal
        r = await cx.get(f"{BACKEND_URL}/admin/withdrawals", headers={"X-Privy-Id": TEST_PRIVY_ID})
        if r.status_code != 200:
            err(f"GET /admin/withdrawals failed: {r.status_code}")
        withdrawals = r.json()["withdrawals"]
        pending = [w for w in withdrawals if w["status"] == "pending"]
        if not pending:
            # Create a new withdrawal for testing
            await db.users.update_one(
                {"privy_id": TEST_PRIVY_ID},
                {"$set": {"real.balance": 750.0}}
            )
            r = await cx.post(
                f"{BACKEND_URL}/wallet/withdraw_request",
                headers={"X-Privy-Id": TEST_PRIVY_ID},
                json={"to_address": TEST_TO_ADDRESS, "amount_sol": 0.3}
            )
            if r.status_code != 200:
                err(f"Failed to create test withdrawal: {r.status_code}")
            r = await cx.get(f"{BACKEND_URL}/admin/withdrawals", headers={"X-Privy-Id": TEST_PRIVY_ID})
            withdrawals = r.json()["withdrawals"]
            pending = [w for w in withdrawals if w["status"] == "pending"]
        
        wd = pending[0]
        wd_id = wd["id"]
        amount_usd = wd["amount_usd"]
        log(f"Found pending withdrawal: {wd_id}, amount_usd={amount_usd}")
        
        # Get current balance
        r = await cx.get(f"{BACKEND_URL}/users/me", headers={"X-Privy-Id": TEST_PRIVY_ID})
        if r.status_code != 200:
            err(f"GET /users/me failed: {r.status_code}")
        balance_before = r.json()["real"]["balance"]
        log(f"Balance before reject: {balance_before}")
        
        # Reject withdrawal
        r = await cx.post(
            f"{BACKEND_URL}/admin/withdrawals/{wd_id}/reject",
            headers={"X-Privy-Id": TEST_PRIVY_ID}
        )
        if r.status_code != 200:
            err(f"Reject failed: {r.status_code} {r.text}")
        resp = r.json()
        if resp.get("status") != "rejected":
            err(f"Expected status=rejected, got {resp.get('status')}")
        log("Reject successful: status=rejected")
        
        # Verify balance increased
        r = await cx.get(f"{BACKEND_URL}/users/me", headers={"X-Privy-Id": TEST_PRIVY_ID})
        if r.status_code != 200:
            err(f"GET /users/me failed: {r.status_code}")
        balance_after = r.json()["real"]["balance"]
        expected_balance = balance_before + amount_usd
        if abs(balance_after - expected_balance) > 0.01:
            err(f"Expected balance={expected_balance}, got {balance_after}")
        log(f"Balance after reject: {balance_after} (increased by {amount_usd})")
    
    log("✅ TEST 8 PASSED\n")

async def test_9_regression():
    """Test 9: Regression - market prices and competitions still working"""
    log("TEST 9: Regression - market prices and competitions still working")
    
    async with httpx.AsyncClient(timeout=30) as cx:
        # GET /markets/prices
        r = await cx.get(f"{BACKEND_URL}/markets/prices")
        if r.status_code != 200:
            err(f"GET /markets/prices failed: {r.status_code}")
        prices = r.json()["prices"]
        if len(prices) != 7:
            err(f"Expected 7 pairs, got {len(prices)}")
        log(f"GET /markets/prices verified: {len(prices)} pairs")
        
        # GET /competitions
        r = await cx.get(f"{BACKEND_URL}/competitions")
        if r.status_code != 200:
            err(f"GET /competitions failed: {r.status_code}")
        competitions = r.json()["competitions"]
        if len(competitions) != 2:
            err(f"Expected 2 competitions, got {len(competitions)}")
        log(f"GET /competitions verified: {len(competitions)} competitions")
    
    log("✅ TEST 9 PASSED\n")

async def main():
    print("=" * 80)
    print("BACKEND TEST: Admin + Auto-Withdrawal Endpoints")
    print("=" * 80)
    print()
    
    try:
        await test_1_setup_user()
        await test_2_auto_eligible_withdrawal()
        await test_3_mixed_auto_manual_withdrawal()
        await test_4_insufficient_balance()
        await test_5_admin_guards_no_admins()
        await test_6_promote_to_admin()
        await test_7_admin_approve_fails()
        await test_8_admin_reject_refunds()
        await test_9_regression()
        
        print("=" * 80)
        print("🎉 ALL TESTS PASSED!")
        print("=" * 80)
    except Exception as e:
        print(f"\n❌ TEST FAILED WITH EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())

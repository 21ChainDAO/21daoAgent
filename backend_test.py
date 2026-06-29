#!/usr/bin/env python3
"""
Comprehensive backend test for Degens.bet withdrawal fix verification
Tests auto-to-manual withdrawal fallback when TREASURY_PRIVKEY is empty
"""

import requests
import json
from pymongo import MongoClient

# Configuration
BACKEND_URL = "https://terminal-degen.preview.emergentagent.com/api"
TEST_PRIVY_ID = "wd_test_1"
TEST_WALLET_ADDRESS = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"

# MongoDB client
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

def print_section(title):
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")

def print_result(test_name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} - {test_name}")
    if details:
        print(f"    {details}")

def reset_test_user():
    """Reset test user in MongoDB"""
    print_section("STEP 1: Reset Test User in MongoDB")
    
    # Find user
    user = db.users.find_one({"privy_id": TEST_PRIVY_ID})
    if not user:
        print(f"❌ User with privy_id={TEST_PRIVY_ID} not found in database")
        return False
    
    user_id = user["id"]
    print(f"Found user: {user.get('x_handle', 'N/A')} (id={user_id})")
    
    # Delete all withdrawals for this user
    result = db.withdrawals.delete_many({"user_id": user_id})
    print(f"Deleted {result.deleted_count} withdrawal records")
    
    # Update user fields
    db.users.update_one(
        {"privy_id": TEST_PRIVY_ID},
        {"$set": {
            "real.balance": 750.0,
            "total_sol_deposited": 1.0,
            "total_sol_withdrawn_auto": 0
        }}
    )
    print(f"Set real.balance=750.0, total_sol_deposited=1.0, total_sol_withdrawn_auto=0")
    
    # Verify via API
    headers = {"X-Privy-Id": TEST_PRIVY_ID}
    resp = requests.get(f"{BACKEND_URL}/users/me", headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        real_balance = data.get("real", {}).get("balance", 0)
        total_deposited = data.get("total_sol_deposited", 0)
        total_withdrawn = data.get("total_sol_withdrawn_auto", 0)
        print(f"\nVerified via GET /api/users/me:")
        print(f"  real.balance: {real_balance}")
        print(f"  total_sol_deposited: {total_deposited}")
        print(f"  total_sol_withdrawn_auto: {total_withdrawn}")
        return True
    else:
        print(f"❌ Failed to verify user via API: {resp.status_code}")
        return False

def test_auto_eligible_withdrawal():
    """Test auto-eligible withdrawal (0.5 SOL) - should convert cleanly to manual"""
    print_section("STEP 2: Auto-Eligible Withdrawal (0.5 SOL)")
    
    headers = {"X-Privy-Id": TEST_PRIVY_ID}
    
    # Get initial balance
    resp = requests.get(f"{BACKEND_URL}/users/me", headers=headers)
    initial_balance = resp.json().get("real", {}).get("balance", 0)
    print(f"Initial real.balance: ${initial_balance:.2f}")
    
    # Get SOL price
    resp = requests.get(f"{BACKEND_URL}/markets/price/SOL/USD")
    sol_price = resp.json().get("price", 150)
    print(f"Current SOL price: ${sol_price:.2f}")
    
    expected_deduction = 0.5 * sol_price
    expected_balance = initial_balance - expected_deduction
    print(f"Expected balance after 0.5 SOL withdrawal: ${expected_balance:.2f} (±$5)")
    
    # Make withdrawal request
    payload = {
        "to_address": TEST_WALLET_ADDRESS,
        "amount_sol": 0.5
    }
    resp = requests.post(f"{BACKEND_URL}/wallet/withdraw_request", headers=headers, json=payload)
    
    if resp.status_code != 200:
        print_result("Withdrawal request", False, f"Status {resp.status_code}: {resp.text}")
        return False
    
    data = resp.json()
    print(f"\nWithdrawal response:")
    print(json.dumps(data, indent=2))
    
    # Verify response structure
    tests_passed = []
    
    # Check auto is null
    if data.get("auto") is None:
        print_result("auto field is null", True)
        tests_passed.append(True)
    else:
        print_result("auto field is null", False, f"Expected null, got {data.get('auto')}")
        tests_passed.append(False)
    
    # Check manual exists
    manual = data.get("manual")
    if manual and manual.get("kind") == "manual" and manual.get("status") == "pending" and manual.get("amount_sol") == 0.5:
        print_result("manual field correct", True, f"kind=manual, status=pending, amount_sol=0.5")
        tests_passed.append(True)
    else:
        print_result("manual field correct", False, f"Got: {manual}")
        tests_passed.append(False)
    
    # Check auto_sol and manual_sol
    if data.get("auto_sol") == 0 and data.get("manual_sol") == 0.5:
        print_result("auto_sol=0, manual_sol=0.5", True)
        tests_passed.append(True)
    else:
        print_result("auto_sol=0, manual_sol=0.5", False, f"Got auto_sol={data.get('auto_sol')}, manual_sol={data.get('manual_sol')}")
        tests_passed.append(False)
    
    # Check balance deduction
    resp = requests.get(f"{BACKEND_URL}/users/me", headers=headers)
    new_balance = resp.json().get("real", {}).get("balance", 0)
    print(f"\nNew real.balance: ${new_balance:.2f}")
    
    balance_diff = abs(new_balance - expected_balance)
    if balance_diff <= 5:
        print_result("Balance deducted correctly", True, f"Expected ~${expected_balance:.2f}, got ${new_balance:.2f} (diff: ${balance_diff:.2f})")
        tests_passed.append(True)
    else:
        print_result("Balance deducted correctly", False, f"Expected ~${expected_balance:.2f}, got ${new_balance:.2f} (diff: ${balance_diff:.2f})")
        tests_passed.append(False)
    
    # Check withdrawal records
    resp = requests.get(f"{BACKEND_URL}/wallet/withdrawals/me", headers=headers)
    withdrawals = resp.json().get("withdrawals", [])
    print(f"\nWithdrawal records count: {len(withdrawals)}")
    
    if len(withdrawals) == 1:
        wd = withdrawals[0]
        if wd.get("kind") == "manual" and wd.get("status") == "pending" and wd.get("amount_sol") == 0.5:
            print_result("Exactly 1 manual withdrawal record", True, f"kind=manual, status=pending, amount_sol=0.5")
            tests_passed.append(True)
        else:
            print_result("Exactly 1 manual withdrawal record", False, f"Record: {wd}")
            tests_passed.append(False)
    else:
        print_result("Exactly 1 manual withdrawal record", False, f"Found {len(withdrawals)} records")
        tests_passed.append(False)
        if withdrawals:
            print("Records found:")
            for wd in withdrawals:
                print(f"  - kind={wd.get('kind')}, status={wd.get('status')}, amount_sol={wd.get('amount_sol')}")
    
    # Check no auto_failed records
    auto_failed = [w for w in withdrawals if w.get("kind") == "auto" and w.get("status") == "failed"]
    if len(auto_failed) == 0:
        print_result("No auto_failed records", True)
        tests_passed.append(True)
    else:
        print_result("No auto_failed records", False, f"Found {len(auto_failed)} auto_failed records")
        tests_passed.append(False)
    
    return all(tests_passed)

def test_mixed_withdrawal():
    """Test mixed withdrawal (1.4 SOL = 1 auto + 0.4 profit)"""
    print_section("STEP 3: Mixed Withdrawal (1.4 SOL)")
    
    # Reset user first
    user = db.users.find_one({"privy_id": TEST_PRIVY_ID})
    user_id = user["id"]
    db.withdrawals.delete_many({"user_id": user_id})
    db.users.update_one(
        {"privy_id": TEST_PRIVY_ID},
        {"$set": {
            "real.balance": 750.0,
            "total_sol_withdrawn_auto": 0
        }}
    )
    print("Reset: deleted withdrawals, set real.balance=750, total_sol_withdrawn_auto=0")
    
    headers = {"X-Privy-Id": TEST_PRIVY_ID}
    
    # Get initial balance
    resp = requests.get(f"{BACKEND_URL}/users/me", headers=headers)
    initial_balance = resp.json().get("real", {}).get("balance", 0)
    print(f"Initial real.balance: ${initial_balance:.2f}")
    
    # Get SOL price
    resp = requests.get(f"{BACKEND_URL}/markets/price/SOL/USD")
    sol_price = resp.json().get("price", 150)
    print(f"Current SOL price: ${sol_price:.2f}")
    
    expected_deduction = 1.4 * sol_price
    expected_balance = initial_balance - expected_deduction
    print(f"Expected balance after 1.4 SOL withdrawal: ${expected_balance:.2f}")
    
    # Make withdrawal request
    payload = {
        "to_address": TEST_WALLET_ADDRESS,
        "amount_sol": 1.4
    }
    resp = requests.post(f"{BACKEND_URL}/wallet/withdraw_request", headers=headers, json=payload)
    
    if resp.status_code != 200:
        print_result("Withdrawal request", False, f"Status {resp.status_code}: {resp.text}")
        return False
    
    data = resp.json()
    print(f"\nWithdrawal response:")
    print(json.dumps(data, indent=2))
    
    tests_passed = []
    
    # Check auto_sol=0, manual_sol=1.4
    if data.get("auto_sol") == 0 and data.get("manual_sol") == 1.4:
        print_result("auto_sol=0, manual_sol=1.4", True)
        tests_passed.append(True)
    else:
        print_result("auto_sol=0, manual_sol=1.4", False, f"Got auto_sol={data.get('auto_sol')}, manual_sol={data.get('manual_sol')}")
        tests_passed.append(False)
    
    # Check balance deduction
    resp = requests.get(f"{BACKEND_URL}/users/me", headers=headers)
    new_balance = resp.json().get("real", {}).get("balance", 0)
    print(f"\nNew real.balance: ${new_balance:.2f}")
    
    balance_diff = abs(new_balance - expected_balance)
    if balance_diff <= 5:
        print_result("Balance deducted by 1.4*sol_price", True, f"Expected ~${expected_balance:.2f}, got ${new_balance:.2f}")
        tests_passed.append(True)
    else:
        print_result("Balance deducted by 1.4*sol_price", False, f"Expected ~${expected_balance:.2f}, got ${new_balance:.2f}")
        tests_passed.append(False)
    
    # Check exactly 1 withdrawal record
    resp = requests.get(f"{BACKEND_URL}/wallet/withdrawals/me", headers=headers)
    withdrawals = resp.json().get("withdrawals", [])
    
    if len(withdrawals) == 1:
        wd = withdrawals[0]
        if wd.get("kind") == "manual" and wd.get("amount_sol") == 1.4:
            print_result("Exactly 1 manual withdrawal (1.4 SOL)", True)
            tests_passed.append(True)
        else:
            print_result("Exactly 1 manual withdrawal (1.4 SOL)", False, f"Record: {wd}")
            tests_passed.append(False)
    else:
        print_result("Exactly 1 manual withdrawal (1.4 SOL)", False, f"Found {len(withdrawals)} records")
        tests_passed.append(False)
    
    return all(tests_passed)

def test_admin_reject_refund():
    """Test admin reject refunds correctly"""
    print_section("STEP 4: Admin Reject Refund")
    
    headers = {"X-Privy-Id": TEST_PRIVY_ID}
    # Admin user has x_handle=wd_test (matches ADMIN_X_HANDLES), privy_id=wd_test_1
    admin_headers = {"X-Privy-Id": TEST_PRIVY_ID}
    
    # Get pending withdrawal
    resp = requests.get(f"{BACKEND_URL}/wallet/withdrawals/me", headers=headers)
    withdrawals = resp.json().get("withdrawals", [])
    pending = [w for w in withdrawals if w.get("status") == "pending"]
    
    if not pending:
        print_result("Find pending withdrawal", False, "No pending withdrawals found")
        return False
    
    withdrawal_id = pending[0]["id"]
    amount_usd = pending[0]["amount_usd"]
    print(f"Found pending withdrawal: id={withdrawal_id}, amount_usd=${amount_usd:.2f}")
    
    # Get balance before reject
    resp = requests.get(f"{BACKEND_URL}/users/me", headers=headers)
    balance_before = resp.json().get("real", {}).get("balance", 0)
    print(f"Balance before reject: ${balance_before:.2f}")
    
    # Admin reject
    resp = requests.post(f"{BACKEND_URL}/admin/withdrawals/{withdrawal_id}/reject", headers=admin_headers)
    
    if resp.status_code != 200:
        print_result("Admin reject request", False, f"Status {resp.status_code}: {resp.text}")
        return False
    
    print(f"Admin reject response: {resp.json()}")
    
    # Check balance increased
    resp = requests.get(f"{BACKEND_URL}/users/me", headers=headers)
    balance_after = resp.json().get("real", {}).get("balance", 0)
    print(f"Balance after reject: ${balance_after:.2f}")
    
    refund_amount = balance_after - balance_before
    print(f"Refund amount: ${refund_amount:.2f}")
    
    if abs(refund_amount - amount_usd) < 0.01:
        print_result("Balance refunded correctly", True, f"Refunded ${refund_amount:.2f}")
        return True
    else:
        print_result("Balance refunded correctly", False, f"Expected ${amount_usd:.2f}, got ${refund_amount:.2f}")
        return False

def test_regression_market_prices():
    """Regression test: GET /api/markets/prices returns 7 pairs"""
    print_section("STEP 5: Regression - Market Prices")
    
    resp = requests.get(f"{BACKEND_URL}/markets/prices")
    
    if resp.status_code != 200:
        print_result("Market prices endpoint", False, f"Status {resp.status_code}")
        return False
    
    data = resp.json()
    pairs = data.get("prices", [])
    
    if len(pairs) == 7:
        print_result("Returns 7 pairs", True, f"Pairs: {[p['pair'] for p in pairs]}")
        return True
    else:
        print_result("Returns 7 pairs", False, f"Found {len(pairs)} pairs")
        return False

def main():
    print("\n" + "="*80)
    print("  DEGENS.BET WITHDRAWAL FIX VERIFICATION TEST")
    print("  Testing auto-to-manual fallback when TREASURY_PRIVKEY is empty")
    print("="*80)
    
    results = {}
    
    # Step 1: Reset test user
    results["reset"] = reset_test_user()
    
    # Step 2: Auto-eligible withdrawal
    if results["reset"]:
        results["auto_eligible"] = test_auto_eligible_withdrawal()
    else:
        results["auto_eligible"] = False
        print("\n⚠️  Skipping auto-eligible test due to reset failure")
    
    # Step 3: Mixed withdrawal
    results["mixed"] = test_mixed_withdrawal()
    
    # Step 4: Admin reject refund
    results["admin_reject"] = test_admin_reject_refund()
    
    # Step 5: Regression
    results["regression"] = test_regression_market_prices()
    
    # Summary
    print_section("TEST SUMMARY")
    print(f"{'Test':<40} {'Result':<10}")
    print("-" * 50)
    print(f"{'1. Reset test user':<40} {'✅ PASS' if results['reset'] else '❌ FAIL':<10}")
    print(f"{'2. Auto-eligible withdrawal (0.5 SOL)':<40} {'✅ PASS' if results['auto_eligible'] else '❌ FAIL':<10}")
    print(f"{'3. Mixed withdrawal (1.4 SOL)':<40} {'✅ PASS' if results['mixed'] else '❌ FAIL':<10}")
    print(f"{'4. Admin reject refund':<40} {'✅ PASS' if results['admin_reject'] else '❌ FAIL':<10}")
    print(f"{'5. Regression - Market prices':<40} {'✅ PASS' if results['regression'] else '❌ FAIL':<10}")
    print("-" * 50)
    
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if all(results.values()):
        print("\n🎉 ALL TESTS PASSED! Withdrawal fix verified successfully.")
        return 0
    else:
        print("\n❌ SOME TESTS FAILED. Review details above.")
        return 1

if __name__ == "__main__":
    exit(main())

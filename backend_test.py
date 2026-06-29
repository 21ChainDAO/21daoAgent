"""
Comprehensive backend test for Degens.bet upgraded backend.
Tests dual account system (paper/real), custodial wallets, competitions, and new endpoints.
"""
import requests
import json
import time

BASE_URL = "https://terminal-degen.preview.emergentagent.com/api"

def log_test(test_num, description):
    print(f"\n{'='*80}")
    print(f"TEST {test_num}: {description}")
    print('='*80)

def log_result(success, message, response=None):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")
    if response:
        print(f"Status: {response.status_code}")
        try:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        except:
            print(f"Response text: {response.text[:500]}")
    print()

def test_1_root_endpoint():
    log_test(1, "GET /api/ — returns {'message': 'degens.bet api'}")
    try:
        r = requests.get(f"{BASE_URL}/")
        if r.status_code == 200 and r.json().get("message") == "degens.bet api":
            log_result(True, "Root endpoint working correctly", r)
            return True
        else:
            log_result(False, f"Unexpected response", r)
            return False
    except Exception as e:
        log_result(False, f"Exception: {e}")
        return False

def test_2_user_creation_with_custodial_wallet():
    log_test(2, "User creation with custodial wallet auto-generation")
    try:
        # Create new user
        payload = {
            "privy_id": "qa_dual_1",
            "x_handle": "qa_dual",
            "x_name": "QA Dual",
            "x_avatar": None,
            "privy_wallet": None
        }
        r = requests.post(f"{BASE_URL}/users/upsert", json=payload)
        
        if r.status_code != 200:
            log_result(False, f"Failed to create user", r)
            return False, None
        
        data = r.json()
        
        # Verify paper account
        if not data.get("paper"):
            log_result(False, "Missing 'paper' sub-account", r)
            return False, None
        
        if data["paper"].get("balance") != 10000:
            log_result(False, f"Paper balance should be 10000, got {data['paper'].get('balance')}", r)
            return False, None
        
        # Verify real account
        if not data.get("real"):
            log_result(False, "Missing 'real' sub-account", r)
            return False, None
        
        if data["real"].get("balance") != 0:
            log_result(False, f"Real balance should be 0, got {data['real'].get('balance')}", r)
            return False, None
        
        # Verify custodial wallet
        custodial_addr = data.get("custodial_address")
        if not custodial_addr or not isinstance(custodial_addr, str):
            log_result(False, "Missing or invalid custodial_address", r)
            return False, None
        
        if len(custodial_addr) < 32 or len(custodial_addr) > 44:
            log_result(False, f"Custodial address length {len(custodial_addr)} not in range 32-44", r)
            return False, None
        
        # Verify encrypted_privkey is NOT returned
        if "encrypted_privkey" in data:
            log_result(False, "encrypted_privkey should NOT be in response", r)
            return False, None
        
        log_result(True, f"User created with paper.balance=10000, real.balance=0, custodial_address={custodial_addr[:8]}...", r)
        
        # Test idempotency - call upsert again
        r2 = requests.post(f"{BASE_URL}/users/upsert", json=payload)
        if r2.status_code != 200:
            log_result(False, "Second upsert failed", r2)
            return False, custodial_addr
        
        data2 = r2.json()
        custodial_addr2 = data2.get("custodial_address")
        
        if custodial_addr != custodial_addr2:
            log_result(False, f"Custodial address changed on second upsert: {custodial_addr} -> {custodial_addr2}", r2)
            return False, custodial_addr
        
        log_result(True, "Second upsert preserved custodial_address (idempotent)", r2)
        return True, custodial_addr
        
    except Exception as e:
        log_result(False, f"Exception: {e}")
        return False, None

def test_3_get_users_me(custodial_addr):
    log_test(3, "GET /api/users/me with X-Privy-Id header")
    try:
        headers = {"X-Privy-Id": "qa_dual_1"}
        r = requests.get(f"{BASE_URL}/users/me", headers=headers)
        
        if r.status_code != 200:
            log_result(False, "Failed to get user", r)
            return False
        
        data = r.json()
        
        # Verify both sub-accounts
        if not data.get("paper") or not data.get("real"):
            log_result(False, "Missing paper or real sub-account", r)
            return False
        
        # Verify custodial address matches
        if data.get("custodial_address") != custodial_addr:
            log_result(False, f"Custodial address mismatch: expected {custodial_addr}, got {data.get('custodial_address')}", r)
            return False
        
        log_result(True, f"GET /users/me returns user with both sub-accounts and custodial_address", r)
        return True
        
    except Exception as e:
        log_result(False, f"Exception: {e}")
        return False

def test_4_open_position_paper():
    log_test(4, "Open position on PAPER account")
    try:
        headers = {"X-Privy-Id": "qa_dual_1"}
        payload = {
            "pair": "SOL/USD",
            "side": "long",
            "margin": 500,
            "leverage": 20,
            "account_type": "paper"
        }
        r = requests.post(f"{BASE_URL}/positions/open", json=payload, headers=headers)
        
        if r.status_code != 200:
            log_result(False, "Failed to open position", r)
            return False, None
        
        data = r.json()
        position_id = data.get("id")
        
        # Verify position created
        if not position_id:
            log_result(False, "No position ID returned", r)
            return False, None
        
        log_result(True, f"Position opened: {position_id}", r)
        
        # Verify user balance updated
        headers = {"X-Privy-Id": "qa_dual_1"}
        r2 = requests.get(f"{BASE_URL}/users/me", headers=headers)
        
        if r2.status_code != 200:
            log_result(False, "Failed to get user after opening position", r2)
            return False, position_id
        
        user = r2.json()
        paper_balance = user.get("paper", {}).get("balance", 0)
        paper_trades = user.get("paper", {}).get("trades_count", 0)
        real_balance = user.get("real", {}).get("balance", 0)
        
        if paper_balance != 9500:
            log_result(False, f"Paper balance should be 9500 (10000-500), got {paper_balance}", r2)
            return False, position_id
        
        if paper_trades != 1:
            log_result(False, f"Paper trades_count should be 1, got {paper_trades}", r2)
            return False, position_id
        
        if real_balance != 0:
            log_result(False, f"Real balance should still be 0, got {real_balance}", r2)
            return False, position_id
        
        log_result(True, f"User balances updated correctly: paper.balance=9500, paper.trades_count=1, real.balance=0", r2)
        return True, position_id
        
    except Exception as e:
        log_result(False, f"Exception: {e}")
        return False, None

def test_5_open_position_real_insufficient():
    log_test(5, "Open position on REAL account with insufficient balance")
    try:
        headers = {"X-Privy-Id": "qa_dual_1"}
        payload = {
            "pair": "SOL/USD",
            "side": "short",
            "margin": 100,
            "leverage": 5,
            "account_type": "real"
        }
        r = requests.post(f"{BASE_URL}/positions/open", json=payload, headers=headers)
        
        if r.status_code == 400:
            error_msg = r.json().get("detail", "")
            if "insufficient balance" in error_msg.lower():
                log_result(True, f"Correctly rejected with 400: {error_msg}", r)
                return True
            else:
                log_result(False, f"Got 400 but wrong error message: {error_msg}", r)
                return False
        else:
            log_result(False, f"Expected 400, got {r.status_code}", r)
            return False
        
    except Exception as e:
        log_result(False, f"Exception: {e}")
        return False

def test_6_position_listing_filtered(position_id):
    log_test(6, "Position listing filtered by account_type")
    try:
        headers = {"X-Privy-Id": "qa_dual_1"}
        
        # Test paper positions
        r1 = requests.get(f"{BASE_URL}/positions/me?account_type=paper&status=open", headers=headers)
        if r1.status_code != 200:
            log_result(False, "Failed to get paper positions", r1)
            return False
        
        paper_positions = r1.json().get("positions", [])
        if len(paper_positions) != 1:
            log_result(False, f"Expected 1 paper position, got {len(paper_positions)}", r1)
            return False
        
        if paper_positions[0].get("id") != position_id:
            log_result(False, f"Paper position ID mismatch", r1)
            return False
        
        log_result(True, f"Paper positions query returned 1 position", r1)
        
        # Test real positions (should be empty)
        r2 = requests.get(f"{BASE_URL}/positions/me?account_type=real&status=open", headers=headers)
        if r2.status_code != 200:
            log_result(False, "Failed to get real positions", r2)
            return False
        
        real_positions = r2.json().get("positions", [])
        if len(real_positions) != 0:
            log_result(False, f"Expected 0 real positions, got {len(real_positions)}", r2)
            return False
        
        log_result(True, f"Real positions query returned empty array", r2)
        return True
        
    except Exception as e:
        log_result(False, f"Exception: {e}")
        return False

def test_7_close_paper_position(position_id):
    log_test(7, "Close paper position")
    try:
        headers = {"X-Privy-Id": "qa_dual_1"}
        
        # Get balance before closing
        r_before = requests.get(f"{BASE_URL}/users/me", headers=headers)
        if r_before.status_code != 200:
            log_result(False, "Failed to get user before closing", r_before)
            return False
        
        balance_before = r_before.json().get("paper", {}).get("balance", 0)
        
        # Close position
        payload = {"position_id": position_id}
        r = requests.post(f"{BASE_URL}/positions/close", json=payload, headers=headers)
        
        if r.status_code != 200:
            log_result(False, "Failed to close position", r)
            return False
        
        data = r.json()
        pnl = data.get("pnl", 0)
        
        log_result(True, f"Position closed with pnl={pnl}", r)
        
        # Verify balance updated
        r_after = requests.get(f"{BASE_URL}/users/me", headers=headers)
        if r_after.status_code != 200:
            log_result(False, "Failed to get user after closing", r_after)
            return False
        
        user_after = r_after.json()
        balance_after = user_after.get("paper", {}).get("balance", 0)
        real_balance_after = user_after.get("real", {}).get("balance", 0)
        
        # Balance should have changed (margin + pnl returned)
        if balance_after == balance_before:
            log_result(False, f"Paper balance unchanged after close: {balance_after}", r_after)
            return False
        
        # Real balance should still be 0
        if real_balance_after != 0:
            log_result(False, f"Real balance should still be 0, got {real_balance_after}", r_after)
            return False
        
        log_result(True, f"Balances updated: paper.balance changed from {balance_before} to {balance_after}, real.balance still 0", r_after)
        return True
        
    except Exception as e:
        log_result(False, f"Exception: {e}")
        return False

def test_8_leaderboards_by_account():
    log_test(8, "Leaderboards by account type")
    try:
        # Test paper leaderboard
        r1 = requests.get(f"{BASE_URL}/leaderboard/paper")
        if r1.status_code != 200:
            log_result(False, "Failed to get paper leaderboard", r1)
            return False
        
        paper_lb = r1.json().get("leaderboard", [])
        
        # Check if qa_dual_1 is in paper leaderboard
        qa_in_paper = any(u.get("x_handle") == "qa_dual" for u in paper_lb)
        if not qa_in_paper:
            log_result(False, "qa_dual_1 not found in paper leaderboard", r1)
            return False
        
        log_result(True, f"Paper leaderboard includes qa_dual_1 user ({len(paper_lb)} total users)", r1)
        
        # Test real leaderboard
        r2 = requests.get(f"{BASE_URL}/leaderboard/real")
        if r2.status_code != 200:
            log_result(False, "Failed to get real leaderboard", r2)
            return False
        
        real_lb = r2.json().get("leaderboard", [])
        
        # qa_dual_1 should NOT be in real leaderboard (no real trades)
        qa_in_real = any(u.get("x_handle") == "qa_dual" for u in real_lb)
        if qa_in_real:
            log_result(False, "qa_dual_1 should NOT be in real leaderboard (no real trades)", r2)
            return False
        
        log_result(True, f"Real leaderboard does NOT include qa_dual_1 (correct)", r2)
        
        # Test legacy leaderboard (should still work, defaults to paper)
        r3 = requests.get(f"{BASE_URL}/leaderboard")
        if r3.status_code != 200:
            log_result(False, "Failed to get legacy leaderboard", r3)
            return False
        
        log_result(True, "Legacy /leaderboard endpoint still works", r3)
        return True
        
    except Exception as e:
        log_result(False, f"Exception: {e}")
        return False

def test_9_competitions():
    log_test(9, "GET /api/competitions")
    try:
        r = requests.get(f"{BASE_URL}/competitions")
        if r.status_code != 200:
            log_result(False, "Failed to get competitions", r)
            return False
        
        data = r.json()
        competitions = data.get("competitions", [])
        
        if len(competitions) < 2:
            log_result(False, f"Expected at least 2 competitions, got {len(competitions)}", r)
            return False
        
        # Find paper-main and real-main
        paper_comp = next((c for c in competitions if c.get("id") == "paper-main"), None)
        real_comp = next((c for c in competitions if c.get("id") == "real-main"), None)
        
        if not paper_comp:
            log_result(False, "paper-main competition not found", r)
            return False
        
        if not real_comp:
            log_result(False, "real-main competition not found", r)
            return False
        
        # Verify paper-main
        if paper_comp.get("entry_fee_sol") != 1.0:
            log_result(False, f"paper-main entry_fee_sol should be 1, got {paper_comp.get('entry_fee_sol')}", r)
            return False
        
        if paper_comp.get("prize_pool_usd") != 10000:
            log_result(False, f"paper-main prize_pool_usd should be 10000, got {paper_comp.get('prize_pool_usd')}", r)
            return False
        
        if paper_comp.get("status") != "open":
            log_result(False, f"paper-main status should be 'open', got {paper_comp.get('status')}", r)
            return False
        
        if not isinstance(paper_comp.get("participants_count"), int):
            log_result(False, f"paper-main participants_count should be int, got {type(paper_comp.get('participants_count'))}", r)
            return False
        
        if not isinstance(paper_comp.get("prize_structure"), list):
            log_result(False, f"paper-main prize_structure should be list", r)
            return False
        
        log_result(True, f"paper-main verified: entry_fee_sol=1, prize_pool_usd=10000, status=open, participants_count={paper_comp.get('participants_count')}", r)
        
        # Verify real-main
        if real_comp.get("entry_fee_sol") != 10.0:
            log_result(False, f"real-main entry_fee_sol should be 10, got {real_comp.get('entry_fee_sol')}", r)
            return False
        
        if real_comp.get("prize_pool_usd") != 100000:
            log_result(False, f"real-main prize_pool_usd should be 100000, got {real_comp.get('prize_pool_usd')}", r)
            return False
        
        if real_comp.get("status") != "open":
            log_result(False, f"real-main status should be 'open', got {real_comp.get('status')}", r)
            return False
        
        log_result(True, f"real-main verified: entry_fee_sol=10, prize_pool_usd=100000, status=open, participants_count={real_comp.get('participants_count')}", r)
        return True
        
    except Exception as e:
        log_result(False, f"Exception: {e}")
        return False

def test_10_join_competition():
    log_test(10, "Join competition (should fail without real balance)")
    try:
        headers = {"X-Privy-Id": "qa_dual_1"}
        payload = {"competition_id": "paper-main"}
        r = requests.post(f"{BASE_URL}/competitions/join", json=payload, headers=headers)
        
        if r.status_code == 400:
            error_msg = r.json().get("detail", "")
            # Should mention needing SOL or balance
            if "sol" in error_msg.lower() or "balance" in error_msg.lower():
                log_result(True, f"Correctly rejected with 400: {error_msg}", r)
                return True
            else:
                log_result(False, f"Got 400 but unexpected error message: {error_msg}", r)
                return False
        else:
            log_result(False, f"Expected 400, got {r.status_code}", r)
            return False
        
    except Exception as e:
        log_result(False, f"Exception: {e}")
        return False

def test_11_withdraw_request():
    log_test(11, "Withdraw request flow")
    try:
        headers = {"X-Privy-Id": "qa_dual_1"}
        
        # Test withdraw request (should fail - insufficient balance)
        payload = {
            "to_address": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
            "amount_sol": 0.1
        }
        r1 = requests.post(f"{BASE_URL}/wallet/withdraw_request", json=payload, headers=headers)
        
        if r1.status_code == 400:
            error_msg = r1.json().get("detail", "")
            if "balance" in error_msg.lower():
                log_result(True, f"Withdraw request correctly rejected with 400: {error_msg}", r1)
            else:
                log_result(False, f"Got 400 but unexpected error: {error_msg}", r1)
                return False
        else:
            log_result(False, f"Expected 400, got {r1.status_code}", r1)
            return False
        
        # Test get withdrawals (should be empty)
        r2 = requests.get(f"{BASE_URL}/wallet/withdrawals/me", headers=headers)
        
        if r2.status_code != 200:
            log_result(False, "Failed to get withdrawals", r2)
            return False
        
        withdrawals = r2.json().get("withdrawals", [])
        if len(withdrawals) != 0:
            log_result(False, f"Expected 0 withdrawals, got {len(withdrawals)}", r2)
            return False
        
        log_result(True, "GET /wallet/withdrawals/me returns empty array", r2)
        return True
        
    except Exception as e:
        log_result(False, f"Exception: {e}")
        return False

def test_12_force_sweep():
    log_test(12, "Force sweep (no funds expected)")
    try:
        headers = {"X-Privy-Id": "qa_dual_1"}
        r = requests.post(f"{BASE_URL}/wallet/sweep", headers=headers)
        
        if r.status_code != 200:
            log_result(False, "Sweep endpoint failed", r)
            return False
        
        data = r.json()
        swept_sol = data.get("swept_sol")
        
        if swept_sol is None:
            log_result(False, "No swept_sol field in response", r)
            return False
        
        # Should be 0 or None (no funds on chain)
        if swept_sol == 0 or swept_sol is None:
            log_result(True, f"Sweep returned swept_sol={swept_sol} (no funds to sweep)", r)
            return True
        else:
            log_result(True, f"Sweep returned swept_sol={swept_sol} (unexpected but not an error)", r)
            return True
        
    except Exception as e:
        log_result(False, f"Exception: {e}")
        return False

def test_13_competition_leaderboard():
    log_test(13, "Competition leaderboard")
    try:
        r = requests.get(f"{BASE_URL}/competitions/paper-main/leaderboard")
        
        if r.status_code != 200:
            log_result(False, "Failed to get competition leaderboard", r)
            return False
        
        data = r.json()
        
        if data.get("competition_id") != "paper-main":
            log_result(False, f"Expected competition_id='paper-main', got {data.get('competition_id')}", r)
            return False
        
        leaderboard = data.get("leaderboard", [])
        
        # Should be empty (no entries yet)
        if len(leaderboard) != 0:
            log_result(False, f"Expected empty leaderboard (no entries), got {len(leaderboard)} entries", r)
            return False
        
        log_result(True, "Competition leaderboard returns empty array (no entries yet)", r)
        return True
        
    except Exception as e:
        log_result(False, f"Exception: {e}")
        return False

def test_14_regression():
    log_test(14, "Regression tests")
    try:
        # Test market prices
        r1 = requests.get(f"{BASE_URL}/markets/prices")
        if r1.status_code != 200:
            log_result(False, "GET /markets/prices failed", r1)
            return False
        
        prices = r1.json().get("prices", [])
        if len(prices) != 7:
            log_result(False, f"Expected 7 pairs, got {len(prices)}", r1)
            return False
        
        log_result(True, f"GET /markets/prices returns 7 pairs", r1)
        
        # Test landing stats
        r2 = requests.get(f"{BASE_URL}/stats/landing")
        if r2.status_code != 200:
            log_result(False, "GET /stats/landing failed", r2)
            return False
        
        stats = r2.json()
        required_fields = ["users", "trades", "total_volume", "monthly_volume", "max_leverage", "uptime"]
        for field in required_fields:
            if field not in stats:
                log_result(False, f"Missing field '{field}' in landing stats", r2)
                return False
        
        log_result(True, "GET /stats/landing returns all required fields", r2)
        return True
        
    except Exception as e:
        log_result(False, f"Exception: {e}")
        return False

def main():
    print("\n" + "="*80)
    print("DEGENS.BET BACKEND COMPREHENSIVE TEST SUITE")
    print("Testing upgraded backend with dual accounts, custodial wallets, and competitions")
    print("="*80)
    
    results = {}
    
    # Test 1: Root endpoint
    results["test_1"] = test_1_root_endpoint()
    
    # Test 2: User creation with custodial wallet
    test_2_result, custodial_addr = test_2_user_creation_with_custodial_wallet()
    results["test_2"] = test_2_result
    
    if not test_2_result:
        print("\n❌ Test 2 failed - cannot continue with remaining tests")
        return
    
    # Test 3: Get users/me
    results["test_3"] = test_3_get_users_me(custodial_addr)
    
    # Test 4: Open position on paper
    test_4_result, position_id = test_4_open_position_paper()
    results["test_4"] = test_4_result
    
    # Test 5: Open position on real (insufficient balance)
    results["test_5"] = test_5_open_position_real_insufficient()
    
    # Test 6: Position listing filtered
    if position_id:
        results["test_6"] = test_6_position_listing_filtered(position_id)
    else:
        results["test_6"] = False
        print("⚠️  Skipping test 6 - no position_id from test 4")
    
    # Test 7: Close paper position
    if position_id:
        results["test_7"] = test_7_close_paper_position(position_id)
    else:
        results["test_7"] = False
        print("⚠️  Skipping test 7 - no position_id from test 4")
    
    # Test 8: Leaderboards by account
    results["test_8"] = test_8_leaderboards_by_account()
    
    # Test 9: Competitions
    results["test_9"] = test_9_competitions()
    
    # Test 10: Join competition
    results["test_10"] = test_10_join_competition()
    
    # Test 11: Withdraw request
    results["test_11"] = test_11_withdraw_request()
    
    # Test 12: Force sweep
    results["test_12"] = test_12_force_sweep()
    
    # Test 13: Competition leaderboard
    results["test_13"] = test_13_competition_leaderboard()
    
    # Test 14: Regression
    results["test_14"] = test_14_regression()
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")

if __name__ == "__main__":
    main()

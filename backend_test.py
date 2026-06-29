"""
Comprehensive backend API tests for Degens.bet trading platform
Tests all endpoints with real API calls to the production URL
"""
import requests
import json
from typing import Dict, Any

# Backend URL from frontend/.env
BASE_URL = "https://terminal-degen.preview.emergentagent.com/api"

# Test user data
TEST_USER = {
    "privy_id": "test_user_qa_1",
    "x_handle": "qa_degen",
    "x_name": "QA Degen",
    "x_avatar": "https://example.com/a.png",
    "wallet_address": "So1aNaTestAddr111111111111111111111111111111"
}

def print_test(test_name: str):
    """Print test header"""
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print('='*80)

def print_result(success: bool, message: str, response: Any = None):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")
    if response is not None:
        print(f"Response: {json.dumps(response, indent=2)}")
    return success

def test_1_root_endpoint():
    """Test 1: GET /api/ - should return welcome message"""
    print_test("1. Root Endpoint")
    try:
        response = requests.get(f"{BASE_URL}/")
        data = response.json()
        
        if response.status_code == 200 and data.get("message") == "degens.bet api":
            return print_result(True, "Root endpoint returned correct message", data)
        else:
            return print_result(False, f"Unexpected response: {response.status_code}", data)
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_2_market_prices():
    """Test 2: GET /api/markets/prices - should return 7 pairs"""
    print_test("2. Market Prices")
    try:
        response = requests.get(f"{BASE_URL}/markets/prices")
        data = response.json()
        
        if response.status_code != 200:
            return print_result(False, f"Status code: {response.status_code}", data)
        
        prices = data.get("prices", [])
        if len(prices) != 7:
            return print_result(False, f"Expected 7 pairs, got {len(prices)}", data)
        
        # Check required pairs
        expected_pairs = ["SOL/USD", "BTC/USD", "ETH/USD", "BONK/USD", "WIF/USD", "JUP/USD", "PEPE/USD"]
        found_pairs = [p.get("pair") for p in prices]
        
        missing = set(expected_pairs) - set(found_pairs)
        if missing:
            return print_result(False, f"Missing pairs: {missing}", data)
        
        # Validate structure of each price
        for price in prices:
            required_fields = ["pair", "symbol", "price", "change_24h", "updated_at"]
            for field in required_fields:
                if field not in price:
                    return print_result(False, f"Missing field '{field}' in price object", price)
            
            if price["price"] <= 0:
                return print_result(False, f"Invalid price for {price['pair']}: {price['price']}", price)
        
        return print_result(True, f"All 7 pairs returned with valid data", {"pair_count": len(prices)})
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_3_single_price():
    """Test 3: GET /api/markets/price/SOL/USD - should return single price"""
    print_test("3. Single Price (SOL/USD)")
    try:
        response = requests.get(f"{BASE_URL}/markets/price/SOL/USD")
        data = response.json()
        
        if response.status_code != 200:
            return print_result(False, f"Status code: {response.status_code}", data)
        
        required_fields = ["pair", "symbol", "price", "change_24h", "updated_at"]
        for field in required_fields:
            if field not in data:
                return print_result(False, f"Missing field: {field}", data)
        
        if data["pair"] != "SOL/USD":
            return print_result(False, f"Wrong pair: {data['pair']}", data)
        
        if data["price"] <= 0:
            return print_result(False, f"Invalid price: {data['price']}", data)
        
        return print_result(True, "SOL/USD price returned correctly", data)
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_4_user_upsert():
    """Test 4: POST /api/users/upsert - create and update user"""
    print_test("4. User Upsert (Create & Update)")
    try:
        # First call - create user
        response1 = requests.post(f"{BASE_URL}/users/upsert", json=TEST_USER)
        data1 = response1.json()
        
        if response1.status_code != 200:
            return print_result(False, f"Create failed with status: {response1.status_code}", data1)
        
        # Verify initial values
        if data1.get("balance") != 10000:
            return print_result(False, f"Initial balance should be 10000, got {data1.get('balance')}", data1)
        
        if data1.get("total_pnl") != 0:
            return print_result(False, f"Initial total_pnl should be 0, got {data1.get('total_pnl')}", data1)
        
        if data1.get("trades_count") != 0:
            return print_result(False, f"Initial trades_count should be 0, got {data1.get('trades_count')}", data1)
        
        user_id_1 = data1.get("id")
        
        # Second call - update (should not duplicate)
        response2 = requests.post(f"{BASE_URL}/users/upsert", json=TEST_USER)
        data2 = response2.json()
        
        if response2.status_code != 200:
            return print_result(False, f"Update failed with status: {response2.status_code}", data2)
        
        # Verify balance is still 10000 (not reset)
        if data2.get("balance") != 10000:
            return print_result(False, f"Balance changed on update: {data2.get('balance')}", data2)
        
        user_id_2 = data2.get("id")
        if user_id_1 != user_id_2:
            return print_result(False, f"User ID changed (duplicate created): {user_id_1} vs {user_id_2}", data2)
        
        return print_result(True, "User created and updated correctly (no duplication)", data2)
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_5_get_user_me():
    """Test 5: GET /api/users/me - get current user"""
    print_test("5. Get Current User")
    try:
        headers = {"X-Privy-Id": TEST_USER["privy_id"]}
        response = requests.get(f"{BASE_URL}/users/me", headers=headers)
        data = response.json()
        
        if response.status_code != 200:
            return print_result(False, f"Status code: {response.status_code}", data)
        
        if data.get("privy_id") != TEST_USER["privy_id"]:
            return print_result(False, f"Wrong user returned", data)
        
        if data.get("x_handle") != TEST_USER["x_handle"]:
            return print_result(False, f"User data mismatch", data)
        
        return print_result(True, "User retrieved successfully", data)
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_6_open_position():
    """Test 6: POST /api/positions/open - open a position"""
    print_test("6. Open Position")
    try:
        headers = {"X-Privy-Id": TEST_USER["privy_id"]}
        position_data = {
            "pair": "SOL/USD",
            "side": "long",
            "margin": 100,
            "leverage": 10
        }
        
        response = requests.post(f"{BASE_URL}/positions/open", json=position_data, headers=headers)
        data = response.json()
        
        if response.status_code != 200:
            return print_result(False, f"Status code: {response.status_code}", data)
        
        # Verify position fields
        if data.get("size") != 1000:  # margin * leverage
            return print_result(False, f"Size should be 1000, got {data.get('size')}", data)
        
        if data.get("entry_price", 0) <= 0:
            return print_result(False, f"Invalid entry_price: {data.get('entry_price')}", data)
        
        if data.get("status") != "open":
            return print_result(False, f"Status should be 'open', got {data.get('status')}", data)
        
        # Verify user balance decreased
        user_response = requests.get(f"{BASE_URL}/users/me", headers=headers)
        user_data = user_response.json()
        
        if user_data.get("balance") != 9900:  # 10000 - 100
            return print_result(False, f"Balance should be 9900, got {user_data.get('balance')}", user_data)
        
        if user_data.get("trades_count") != 1:
            return print_result(False, f"Trades count should be 1, got {user_data.get('trades_count')}", user_data)
        
        # Store position ID for later tests
        global POSITION_ID
        POSITION_ID = data.get("id")
        
        return print_result(True, f"Position opened successfully, ID: {POSITION_ID}", data)
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_7_get_open_positions():
    """Test 7: GET /api/positions/me?status=open - get open positions"""
    print_test("7. Get Open Positions")
    try:
        headers = {"X-Privy-Id": TEST_USER["privy_id"]}
        response = requests.get(f"{BASE_URL}/positions/me?status=open", headers=headers)
        data = response.json()
        
        if response.status_code != 200:
            return print_result(False, f"Status code: {response.status_code}", data)
        
        positions = data.get("positions", [])
        if len(positions) == 0:
            return print_result(False, "No open positions found", data)
        
        # Check first position has mark_price and unrealized_pnl
        pos = positions[0]
        if "mark_price" not in pos:
            return print_result(False, "Missing mark_price field", pos)
        
        if "unrealized_pnl" not in pos:
            return print_result(False, "Missing unrealized_pnl field", pos)
        
        return print_result(True, f"Found {len(positions)} open position(s) with mark_price and unrealized_pnl", data)
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_8_close_position():
    """Test 8: POST /api/positions/close - close a position"""
    print_test("8. Close Position")
    try:
        headers = {"X-Privy-Id": TEST_USER["privy_id"]}
        
        # Get user balance before closing
        user_before = requests.get(f"{BASE_URL}/users/me", headers=headers).json()
        balance_before = user_before.get("balance")
        
        close_data = {"position_id": POSITION_ID}
        response = requests.post(f"{BASE_URL}/positions/close", json=close_data, headers=headers)
        data = response.json()
        
        if response.status_code != 200:
            return print_result(False, f"Status code: {response.status_code}", data)
        
        # Verify position is closed
        status = data.get("status")
        if status not in ["closed", "liquidated"]:
            return print_result(False, f"Status should be 'closed' or 'liquidated', got {status}", data)
        
        if data.get("exit_price") is None or data.get("exit_price") <= 0:
            return print_result(False, f"Invalid exit_price: {data.get('exit_price')}", data)
        
        if "pnl" not in data:
            return print_result(False, "Missing pnl field", data)
        
        # Verify user balance changed
        user_after = requests.get(f"{BASE_URL}/users/me", headers=headers).json()
        balance_after = user_after.get("balance")
        
        pnl = data.get("pnl")
        expected_balance = balance_before + 100 + pnl  # margin + pnl
        
        # Allow small floating point differences
        if abs(balance_after - expected_balance) > 0.01:
            return print_result(False, f"Balance mismatch. Expected ~{expected_balance}, got {balance_after}", 
                              {"balance_before": balance_before, "balance_after": balance_after, "pnl": pnl})
        
        return print_result(True, f"Position closed with status '{status}', PnL: {pnl:.2f}", data)
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_9_validations():
    """Test 9: Validation tests"""
    print_test("9. Validation Tests")
    all_passed = True
    
    headers = {"X-Privy-Id": TEST_USER["privy_id"]}
    
    # Test 9a: Insufficient balance
    try:
        response = requests.post(f"{BASE_URL}/positions/open", 
                                json={"pair": "SOL/USD", "side": "long", "margin": 999999, "leverage": 10},
                                headers=headers)
        if response.status_code == 400 and "insufficient balance" in response.text.lower():
            print_result(True, "9a. Insufficient balance validation works")
        else:
            print_result(False, f"9a. Expected 400 with 'insufficient balance', got {response.status_code}: {response.text}")
            all_passed = False
    except Exception as e:
        print_result(False, f"9a. Exception: {str(e)}")
        all_passed = False
    
    # Test 9b: Invalid leverage
    try:
        response = requests.post(f"{BASE_URL}/positions/open",
                                json={"pair": "SOL/USD", "side": "long", "margin": 10, "leverage": 2000},
                                headers=headers)
        if response.status_code == 400:
            print_result(True, "9b. Invalid leverage (2000) validation works")
        else:
            print_result(False, f"9b. Expected 400 for leverage=2000, got {response.status_code}: {response.text}")
            all_passed = False
    except Exception as e:
        print_result(False, f"9b. Exception: {str(e)}")
        all_passed = False
    
    # Test 9c: Invalid side
    try:
        response = requests.post(f"{BASE_URL}/positions/open",
                                json={"pair": "SOL/USD", "side": "sideways", "margin": 10, "leverage": 10},
                                headers=headers)
        if response.status_code == 400:
            print_result(True, "9c. Invalid side ('sideways') validation works")
        else:
            print_result(False, f"9c. Expected 400 for side='sideways', got {response.status_code}: {response.text}")
            all_passed = False
    except Exception as e:
        print_result(False, f"9c. Exception: {str(e)}")
        all_passed = False
    
    # Test 9d: Non-existent user
    try:
        response = requests.get(f"{BASE_URL}/users/me", 
                               headers={"X-Privy-Id": "nonexistent_user_12345"})
        if response.status_code == 404:
            print_result(True, "9d. Non-existent user returns 404")
        else:
            print_result(False, f"9d. Expected 404 for non-existent user, got {response.status_code}: {response.text}")
            all_passed = False
    except Exception as e:
        print_result(False, f"9d. Exception: {str(e)}")
        all_passed = False
    
    return all_passed

def test_10_leaderboard():
    """Test 10: GET /api/leaderboard - get leaderboard"""
    print_test("10. Leaderboard")
    try:
        response = requests.get(f"{BASE_URL}/leaderboard")
        data = response.json()
        
        if response.status_code != 200:
            return print_result(False, f"Status code: {response.status_code}", data)
        
        leaderboard = data.get("leaderboard", [])
        if len(leaderboard) == 0:
            return print_result(False, "Leaderboard is empty", data)
        
        # Check structure of first entry
        entry = leaderboard[0]
        required_fields = ["rank", "x_handle", "x_name", "x_avatar", "balance", "total_pnl", "trades_count", "win_rate"]
        for field in required_fields:
            if field not in entry:
                return print_result(False, f"Missing field '{field}' in leaderboard entry", entry)
        
        # Verify sorted by total_pnl desc
        if len(leaderboard) > 1:
            for i in range(len(leaderboard) - 1):
                if leaderboard[i]["total_pnl"] < leaderboard[i+1]["total_pnl"]:
                    return print_result(False, "Leaderboard not sorted by total_pnl desc", leaderboard)
        
        # Check if our QA user appears
        qa_user_found = any(e.get("x_handle") == TEST_USER["x_handle"] for e in leaderboard)
        if not qa_user_found:
            print(f"⚠️  WARNING: QA user '{TEST_USER['x_handle']}' not found in leaderboard")
        
        return print_result(True, f"Leaderboard returned with {len(leaderboard)} entries, sorted correctly", 
                          {"entry_count": len(leaderboard), "qa_user_found": qa_user_found})
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_11_landing_stats():
    """Test 11: GET /api/stats/landing - get landing page stats"""
    print_test("11. Landing Stats")
    try:
        response = requests.get(f"{BASE_URL}/stats/landing")
        data = response.json()
        
        if response.status_code != 200:
            return print_result(False, f"Status code: {response.status_code}", data)
        
        required_fields = {
            "users": int,
            "trades": int,
            "total_volume": (int, float),
            "monthly_volume": (int, float),
            "max_leverage": int,
            "uptime": (int, float)
        }
        
        for field, expected_type in required_fields.items():
            if field not in data:
                return print_result(False, f"Missing field: {field}", data)
            
            value = data[field]
            if isinstance(expected_type, tuple):
                if not isinstance(value, expected_type):
                    return print_result(False, f"Field '{field}' should be {expected_type}, got {type(value)}", data)
            else:
                if not isinstance(value, expected_type):
                    return print_result(False, f"Field '{field}' should be {expected_type}, got {type(value)}", data)
        
        # Verify specific values
        if data["max_leverage"] != 1000:
            return print_result(False, f"max_leverage should be 1000, got {data['max_leverage']}", data)
        
        if data["uptime"] != 99.98:
            return print_result(False, f"uptime should be 99.98, got {data['uptime']}", data)
        
        return print_result(True, "Landing stats returned with all required fields", data)
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_12_wallet_balance_wrapped_sol():
    """Test 12: GET /api/wallet/balance/{address} - wrapped SOL mint"""
    print_test("12. Wallet Balance - Wrapped SOL Mint")
    try:
        # Wrapped SOL mint address
        address = "So11111111111111111111111111111111111111112"
        response = requests.get(f"{BASE_URL}/wallet/balance/{address}")
        data = response.json()
        
        if response.status_code != 200:
            return print_result(False, f"Status code: {response.status_code}", data)
        
        # Check required fields
        if "address" not in data or "sol" not in data or "usdc" not in data:
            return print_result(False, "Missing required fields (address, sol, usdc)", data)
        
        if data["address"] != address:
            return print_result(False, f"Address mismatch: expected {address}, got {data['address']}", data)
        
        # SOL and USDC should be numeric and >= 0
        if not isinstance(data["sol"], (int, float)) or data["sol"] < 0:
            return print_result(False, f"Invalid SOL value: {data['sol']}", data)
        
        if not isinstance(data["usdc"], (int, float)) or data["usdc"] < 0:
            return print_result(False, f"Invalid USDC value: {data['usdc']}", data)
        
        return print_result(True, f"Wrapped SOL mint balance returned: SOL={data['sol']}, USDC={data['usdc']}", data)
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_13_wallet_balance_funded_address():
    """Test 13: GET /api/wallet/balance/{address} - real funded mainnet address"""
    print_test("13. Wallet Balance - Funded Mainnet Address")
    try:
        # Known phantom dev wallet
        address = "B1aLAAe4vW8nSQCetXnYqJfRxzTjnbooczwkUJAr7yMS"
        response = requests.get(f"{BASE_URL}/wallet/balance/{address}")
        data = response.json()
        
        if response.status_code != 200:
            return print_result(False, f"Status code: {response.status_code}", data)
        
        # Check required fields
        if "address" not in data or "sol" not in data or "usdc" not in data:
            return print_result(False, "Missing required fields (address, sol, usdc)", data)
        
        if data["address"] != address:
            return print_result(False, f"Address mismatch: expected {address}, got {data['address']}", data)
        
        # SOL and USDC should be numeric
        if not isinstance(data["sol"], (int, float)):
            return print_result(False, f"Invalid SOL type: {type(data['sol'])}", data)
        
        if not isinstance(data["usdc"], (int, float)):
            return print_result(False, f"Invalid USDC type: {type(data['usdc'])}", data)
        
        return print_result(True, f"Funded address balance returned: SOL={data['sol']}, USDC={data['usdc']}", data)
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_14_wallet_balance_invalid_address():
    """Test 14: GET /api/wallet/balance/{address} - invalid address"""
    print_test("14. Wallet Balance - Invalid Address")
    try:
        address = "notavalidaddress"
        response = requests.get(f"{BASE_URL}/wallet/balance/{address}")
        
        # Should either return 0/0 gracefully or 5xx error (not crash)
        if response.status_code == 200:
            data = response.json()
            if "address" in data and "sol" in data and "usdc" in data:
                # Graceful handling - returns 0/0
                return print_result(True, f"Invalid address handled gracefully: SOL={data['sol']}, USDC={data['usdc']}", data)
            else:
                return print_result(False, "Response missing required fields", data)
        elif response.status_code >= 500:
            # Server error is acceptable for invalid address
            return print_result(True, f"Invalid address returned {response.status_code} error (acceptable)", {"status": response.status_code})
        else:
            return print_result(False, f"Unexpected status code: {response.status_code}", response.text)
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_15_deposit_scan_valid_user():
    """Test 15: POST /api/wallet/deposit/scan - valid user with wallet"""
    print_test("15. Deposit Scan - Valid User")
    try:
        # Create test user with wallet address
        test_user_helius = {
            "privy_id": "helius_test_user",
            "x_handle": "helius_qa",
            "wallet_address": "So11111111111111111111111111111111111111112"
        }
        
        # First create the user
        create_response = requests.post(f"{BASE_URL}/users/upsert", json=test_user_helius)
        if create_response.status_code != 200:
            return print_result(False, f"Failed to create test user: {create_response.status_code}", create_response.json())
        
        # Now scan for deposits
        headers = {"X-Privy-Id": "helius_test_user"}
        response = requests.post(f"{BASE_URL}/wallet/deposit/scan", headers=headers)
        data = response.json()
        
        if response.status_code != 200:
            return print_result(False, f"Status code: {response.status_code}", data)
        
        # Check required fields
        if "credited" not in data or "scanned" not in data:
            return print_result(False, "Missing required fields (credited, scanned)", data)
        
        # Values should be numeric
        if not isinstance(data["credited"], (int, float)):
            return print_result(False, f"Invalid credited type: {type(data['credited'])}", data)
        
        if not isinstance(data["scanned"], (int, float)):
            return print_result(False, f"Invalid scanned type: {type(data['scanned'])}", data)
        
        return print_result(True, f"Deposit scan successful: credited={data['credited']}, scanned={data['scanned']}", data)
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_16_deposit_scan_nonexistent_user():
    """Test 16: POST /api/wallet/deposit/scan - nonexistent user"""
    print_test("16. Deposit Scan - Nonexistent User")
    try:
        headers = {"X-Privy-Id": "nonexistent_user_xyz"}
        response = requests.post(f"{BASE_URL}/wallet/deposit/scan", headers=headers)
        
        if response.status_code == 404:
            return print_result(True, "Nonexistent user correctly returns 404", {"status": response.status_code})
        else:
            data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
            return print_result(False, f"Expected 404, got {response.status_code}", data)
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_17_deposit_scan_no_wallet():
    """Test 17: POST /api/wallet/deposit/scan - user without wallet_address"""
    print_test("17. Deposit Scan - User Without Wallet")
    try:
        # Create user without wallet_address
        test_user_no_wallet = {
            "privy_id": "no_wallet_user",
            "x_handle": "nw"
        }
        
        create_response = requests.post(f"{BASE_URL}/users/upsert", json=test_user_no_wallet)
        if create_response.status_code != 200:
            return print_result(False, f"Failed to create test user: {create_response.status_code}", create_response.json())
        
        # Try to scan deposits
        headers = {"X-Privy-Id": "no_wallet_user"}
        response = requests.post(f"{BASE_URL}/wallet/deposit/scan", headers=headers)
        
        if response.status_code == 400:
            data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
            if "no wallet" in str(data).lower():
                return print_result(True, "User without wallet correctly returns 400 'no wallet'", data)
            else:
                return print_result(False, f"Expected 'no wallet' message, got: {data}", data)
        else:
            data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
            return print_result(False, f"Expected 400, got {response.status_code}", data)
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_18_regression_market_prices():
    """Test 18: Regression - GET /api/markets/prices still returns 7 pairs"""
    print_test("18. Regression - Market Prices (7 pairs)")
    try:
        response = requests.get(f"{BASE_URL}/markets/prices")
        data = response.json()
        
        if response.status_code != 200:
            return print_result(False, f"Status code: {response.status_code}", data)
        
        prices = data.get("prices", [])
        if len(prices) != 7:
            return print_result(False, f"Expected 7 pairs, got {len(prices)}", data)
        
        return print_result(True, f"Market prices still returns 7 pairs", {"pair_count": len(prices)})
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_19_regression_landing_stats():
    """Test 19: Regression - GET /api/stats/landing still works"""
    print_test("19. Regression - Landing Stats")
    try:
        response = requests.get(f"{BASE_URL}/stats/landing")
        data = response.json()
        
        if response.status_code != 200:
            return print_result(False, f"Status code: {response.status_code}", data)
        
        required_fields = ["users", "trades", "total_volume", "monthly_volume", "max_leverage", "uptime"]
        for field in required_fields:
            if field not in data:
                return print_result(False, f"Missing field: {field}", data)
        
        return print_result(True, "Landing stats still works with all required fields", data)
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def run_all_tests():
    """Run all tests in sequence"""
    print("\n" + "="*80)
    print("DEGENS.BET BACKEND API TEST SUITE")
    print(f"Testing: {BASE_URL}")
    print("="*80)
    
    results = []
    
    # Run tests in order
    results.append(("Test 1: Root Endpoint", test_1_root_endpoint()))
    results.append(("Test 2: Market Prices", test_2_market_prices()))
    results.append(("Test 3: Single Price", test_3_single_price()))
    results.append(("Test 4: User Upsert", test_4_user_upsert()))
    results.append(("Test 5: Get User Me", test_5_get_user_me()))
    results.append(("Test 6: Open Position", test_6_open_position()))
    results.append(("Test 7: Get Open Positions", test_7_get_open_positions()))
    results.append(("Test 8: Close Position", test_8_close_position()))
    results.append(("Test 9: Validations", test_9_validations()))
    results.append(("Test 10: Leaderboard", test_10_leaderboard()))
    results.append(("Test 11: Landing Stats", test_11_landing_stats()))
    
    # New Helius wallet tests
    results.append(("Test 12: Wallet Balance - Wrapped SOL", test_12_wallet_balance_wrapped_sol()))
    results.append(("Test 13: Wallet Balance - Funded Address", test_13_wallet_balance_funded_address()))
    results.append(("Test 14: Wallet Balance - Invalid Address", test_14_wallet_balance_invalid_address()))
    results.append(("Test 15: Deposit Scan - Valid User", test_15_deposit_scan_valid_user()))
    results.append(("Test 16: Deposit Scan - Nonexistent User", test_16_deposit_scan_nonexistent_user()))
    results.append(("Test 17: Deposit Scan - No Wallet", test_17_deposit_scan_no_wallet()))
    
    # Regression tests
    results.append(("Test 18: Regression - Market Prices", test_18_regression_market_prices()))
    results.append(("Test 19: Regression - Landing Stats", test_19_regression_landing_stats()))
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    print("="*80)
    
    return passed == total

if __name__ == "__main__":
    # Global variable to store position ID
    POSITION_ID = None
    
    success = run_all_tests()
    exit(0 if success else 1)

"""
Backend API tests for Degens.bet - Trading Pairs Swap Testing
Tests the new 8 Solana memecoin pairs (DexScreener) vs old 7 majors (CoinGecko)
"""
import httpx
import os
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")
BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://terminal-degen.preview.emergentagent.com")
API_URL = f"{BASE_URL}/api"

# Expected new pairs
EXPECTED_PAIRS = ["ANSEM/USD", "JUPITER/USD", "CARDS/USD", "KINS/USD", 
                  "TRIPLET/USD", "JOTCHUA/USD", "WORLD/USD", "DROOL/USD"]

# Expected mint addresses
EXPECTED_MINTS = {
    "ANSEM": "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump",
    "JUPITER": "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    "CARDS": "CARDSccUMFKoPRZxt5vt3ksUbxEFEcnZ3H2pd3dKxYjp",
    "KINS": "Tqj8yFmagrg7oorpQkVGYR52r96RFTamvWfth9bpump",
    "TRIPLET": "J8PSdNP3QewKq2Z1JJJFDMaqF7KcaiJhR7gbr5KZpump",
    "JOTCHUA": "BcHEaaTCvycPwwsJ9yQTXdHP9X2gCLkznDbZ8VySpump",
    "WORLD": "FMqh9mqR6drPZqqW6wPqLHxX4rqNDWGhYLaMfoaJpump",
    "DROOL": "B6f27ETGcjgGNB1fqULJbXVmw9FnL8HgBp7R83hmpump",
}

def test_1_pairs_list_and_live_data():
    """Test 1: GET /api/markets/prices returns EXACTLY 8 pairs with correct structure"""
    print("\n=== TEST 1: Pairs list & live data ===")
    r = httpx.get(f"{API_URL}/markets/prices", timeout=30)
    print(f"Status: {r.status_code}")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    
    data = r.json()
    assert "prices" in data, "Response missing 'prices' key"
    prices = data["prices"]
    
    # Must be EXACTLY 8 pairs
    print(f"Number of pairs: {len(prices)}")
    assert len(prices) == 8, f"Expected EXACTLY 8 pairs, got {len(prices)}"
    
    # Check each pair
    found_pairs = []
    for p in prices:
        print(f"\nPair: {p.get('pair')}")
        print(f"  Symbol: {p.get('symbol')}")
        print(f"  Mint: {p.get('mint')}")
        print(f"  Price: {p.get('price')}")
        print(f"  Change 24h: {p.get('change_24h')}")
        print(f"  Updated at: {p.get('updated_at')}")
        
        # Required fields
        assert "pair" in p, "Missing 'pair' field"
        assert "symbol" in p, "Missing 'symbol' field"
        assert "mint" in p, "Missing 'mint' field"
        assert "price" in p, "Missing 'price' field"
        assert "change_24h" in p, "Missing 'change_24h' field"
        assert "updated_at" in p, "Missing 'updated_at' field"
        
        # Price validation (>= 0, ideally > 0)
        assert isinstance(p["price"], (int, float)), f"Price must be numeric, got {type(p['price'])}"
        assert p["price"] >= 0, f"Price must be >= 0, got {p['price']}"
        
        # Change validation
        assert isinstance(p["change_24h"], (int, float)), f"Change must be numeric, got {type(p['change_24h'])}"
        
        # Verify mint address matches expected
        symbol = p["symbol"]
        if symbol in EXPECTED_MINTS:
            expected_mint = EXPECTED_MINTS[symbol]
            assert p["mint"] == expected_mint, f"Mint mismatch for {symbol}: expected {expected_mint}, got {p['mint']}"
        
        found_pairs.append(p["pair"])
    
    # Verify all expected pairs are present
    for expected in EXPECTED_PAIRS:
        assert expected in found_pairs, f"Missing expected pair: {expected}"
    
    # CRITICAL: SOL/USD must NOT be in the list
    assert "SOL/USD" not in found_pairs, "SOL/USD should NOT appear in /api/markets/prices (internal only)"
    
    print("\n✅ TEST 1 PASSED: All 8 pairs present with correct structure, SOL/USD not in list")
    return True

def test_2_single_pair_lookup():
    """Test 2: Single pair lookup for ANSEM/USD and SOL/USD"""
    print("\n=== TEST 2: Single pair lookup ===")
    
    # Test ANSEM/USD
    print("\nTesting GET /api/markets/price/ANSEM/USD")
    r = httpx.get(f"{API_URL}/markets/price/ANSEM/USD", timeout=30)
    print(f"Status: {r.status_code}")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    
    data = r.json()
    print(f"Response: {data}")
    assert data["pair"] == "ANSEM/USD", f"Expected pair ANSEM/USD, got {data.get('pair')}"
    assert data["symbol"] == "ANSEM", f"Expected symbol ANSEM, got {data.get('symbol')}"
    assert data["mint"] == EXPECTED_MINTS["ANSEM"], f"Mint mismatch"
    assert "price" in data and isinstance(data["price"], (int, float)), "Missing or invalid price"
    
    # Test SOL/USD (must still work for internal use)
    print("\nTesting GET /api/markets/price/SOL/USD (internal)")
    r = httpx.get(f"{API_URL}/markets/price/SOL/USD", timeout=30)
    print(f"Status: {r.status_code}")
    assert r.status_code == 200, f"SOL/USD must still work for internal use, got {r.status_code}"
    
    data = r.json()
    print(f"Response: {data}")
    assert data["pair"] == "SOL/USD", f"Expected pair SOL/USD, got {data.get('pair')}"
    assert data["symbol"] == "SOL", f"Expected symbol SOL, got {data.get('symbol')}"
    assert "price" in data and isinstance(data["price"], (int, float)), "Missing or invalid price"
    assert data["price"] > 50, f"SOL price sanity check failed: {data['price']} (expected > $50)"
    
    print("\n✅ TEST 2 PASSED: Single pair lookup works for ANSEM/USD and SOL/USD")
    return True

def test_3_trade_flow_on_new_pairs():
    """Test 3: Trade flow on new pairs (ANSEM/USD)"""
    print("\n=== TEST 3: Trade flow on new pairs ===")
    
    # Create test user
    print("\nCreating test user...")
    user_data = {
        "privy_id": "pair_test_1",
        "x_handle": "pair_test",
        "x_name": "Pair Test User",
    }
    r = httpx.post(f"{API_URL}/users/upsert", json=user_data, timeout=30)
    print(f"Status: {r.status_code}")
    assert r.status_code == 200, f"User creation failed: {r.status_code}"
    user = r.json()
    print(f"User created: {user.get('privy_id')}")
    
    # Get current ANSEM price for validation
    r = httpx.get(f"{API_URL}/markets/price/ANSEM/USD", timeout=30)
    ansem_price = r.json()["price"]
    print(f"Current ANSEM price: ${ansem_price}")
    
    # Open paper position on ANSEM/USD
    print("\nOpening paper position on ANSEM/USD...")
    position_data = {
        "pair": "ANSEM/USD",
        "side": "long",
        "margin": 200,
        "leverage": 5,
        "account_type": "paper"
    }
    headers = {"X-Privy-Id": "pair_test_1"}
    r = httpx.post(f"{API_URL}/positions/open", json=position_data, headers=headers, timeout=30)
    print(f"Status: {r.status_code}")
    assert r.status_code == 200, f"Position open failed: {r.status_code}"
    
    pos = r.json()
    print(f"Position opened: {pos.get('id')}")
    print(f"  Pair: {pos.get('pair')}")
    print(f"  Side: {pos.get('side')}")
    print(f"  Margin: {pos.get('margin')}")
    print(f"  Leverage: {pos.get('leverage')}")
    print(f"  Size: {pos.get('size')}")
    print(f"  Entry price: {pos.get('entry_price')}")
    print(f"  Status: {pos.get('status')}")
    
    # Verify position
    assert pos["pair"] == "ANSEM/USD", f"Expected pair ANSEM/USD, got {pos.get('pair')}"
    assert pos["side"] == "long", f"Expected side long, got {pos.get('side')}"
    assert pos["margin"] == 200, f"Expected margin 200, got {pos.get('margin')}"
    assert pos["leverage"] == 5, f"Expected leverage 5, got {pos.get('leverage')}"
    assert pos["size"] == 1000, f"Expected size 1000 (200*5), got {pos.get('size')}"
    assert pos["status"] == "open", f"Expected status open, got {pos.get('status')}"
    
    # Verify entry price is close to current ANSEM price (±5%)
    entry_price = pos["entry_price"]
    assert entry_price > 0, f"Entry price must be > 0, got {entry_price}"
    price_diff_pct = abs(entry_price - ansem_price) / ansem_price * 100
    print(f"  Price difference: {price_diff_pct:.2f}%")
    assert price_diff_pct <= 5, f"Entry price {entry_price} differs from current price {ansem_price} by {price_diff_pct:.2f}% (expected ±5%)"
    
    # Get open positions
    print("\nGetting open positions...")
    r = httpx.get(f"{API_URL}/positions/me?account_type=paper&status=open", headers=headers, timeout=30)
    print(f"Status: {r.status_code}")
    assert r.status_code == 200, f"Get positions failed: {r.status_code}"
    
    data = r.json()
    positions = data.get("positions", [])
    print(f"Open positions: {len(positions)}")
    assert len(positions) > 0, "Expected at least 1 open position"
    
    # Find our position
    our_pos = next((p for p in positions if p["id"] == pos["id"]), None)
    assert our_pos is not None, "Our position not found in open positions"
    
    # Verify mark_price and unrealized_pnl are populated
    print(f"  Mark price: {our_pos.get('mark_price')}")
    print(f"  Unrealized PnL: {our_pos.get('unrealized_pnl')}")
    assert "mark_price" in our_pos, "Missing mark_price"
    assert "unrealized_pnl" in our_pos, "Missing unrealized_pnl"
    assert isinstance(our_pos["mark_price"], (int, float)), "mark_price must be numeric"
    assert isinstance(our_pos["unrealized_pnl"], (int, float)), "unrealized_pnl must be numeric"
    
    print("\n✅ TEST 3 PASSED: Trade flow on ANSEM/USD works correctly")
    return True

def test_4_old_pair_rejection():
    """Test 4: Opening position on old pair (BTC/USD) must fail"""
    print("\n=== TEST 4: Old pair rejection ===")
    
    print("\nAttempting to open position on BTC/USD (old pair)...")
    position_data = {
        "pair": "BTC/USD",
        "side": "long",
        "margin": 100,
        "leverage": 10,
        "account_type": "paper"
    }
    headers = {"X-Privy-Id": "pair_test_1"}
    r = httpx.post(f"{API_URL}/positions/open", json=position_data, headers=headers, timeout=30)
    print(f"Status: {r.status_code}")
    
    # Must return 400
    assert r.status_code == 400, f"Expected 400 for unsupported pair, got {r.status_code}"
    
    error = r.json()
    print(f"Error response: {error}")
    assert "detail" in error, "Missing error detail"
    assert "unsupported pair" in error["detail"].lower(), f"Expected 'unsupported pair' error, got: {error['detail']}"
    
    print("\n✅ TEST 4 PASSED: Old pair BTC/USD correctly rejected with 400")
    return True

def test_5_token_endpoint_new_tokenomics():
    """Test 5: Token endpoint with new tokenomics (4 entries)"""
    print("\n=== TEST 5: Token endpoint with new tokenomics ===")
    
    r = httpx.get(f"{API_URL}/token", timeout=30)
    print(f"Status: {r.status_code}")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    
    data = r.json()
    print(f"Response: {data}")
    
    # Verify basic fields
    assert data["symbol"] == "dBET", f"Expected symbol dBET, got {data.get('symbol')}"
    assert data["total_supply"] == 1_000_000_000, f"Expected total_supply 1B, got {data.get('total_supply')}"
    
    # Verify tokenomics
    assert "tokenomics" in data, "Missing tokenomics"
    tokenomics = data["tokenomics"]
    
    # Must be EXACTLY 4 entries (not 5)
    print(f"\nTokenomics entries: {len(tokenomics)}")
    assert len(tokenomics) == 4, f"Expected EXACTLY 4 tokenomics entries, got {len(tokenomics)}"
    
    # Expected entries
    expected = [
        {"label": "LOCKED", "pct": 50, "amount": 500_000_000},
        {"label": "REAL REWARDS", "pct": 7, "amount": 70_000_000},
        {"label": "PAPER REWARDS", "pct": 3, "amount": 30_000_000},
        {"label": "PUBLIC LAUNCH", "pct": 40, "amount": 400_000_000},
    ]
    
    total_pct = 0
    total_amount = 0
    
    for i, entry in enumerate(tokenomics):
        print(f"\nEntry {i+1}:")
        print(f"  Label: {entry.get('label')}")
        print(f"  Percentage: {entry.get('pct')}%")
        print(f"  Amount: {entry.get('amount'):,}")
        
        # Verify against expected
        exp = expected[i]
        assert entry["label"] == exp["label"], f"Expected label {exp['label']}, got {entry.get('label')}"
        assert entry["pct"] == exp["pct"], f"Expected pct {exp['pct']}, got {entry.get('pct')}"
        assert entry["amount"] == exp["amount"], f"Expected amount {exp['amount']}, got {entry.get('amount')}"
        
        total_pct += entry["pct"]
        total_amount += entry["amount"]
    
    # Verify totals
    print(f"\nTotal percentage: {total_pct}%")
    print(f"Total amount: {total_amount:,}")
    assert total_pct == 100, f"Total percentage must be 100%, got {total_pct}%"
    assert total_amount == 1_000_000_000, f"Total amount must be 1B, got {total_amount:,}"
    
    print("\n✅ TEST 5 PASSED: Token endpoint returns 4 tokenomics entries with correct values")
    return True

def test_6_competitions_prizes_intact():
    """Test 6: Competition prizes still intact"""
    print("\n=== TEST 6: Competition prizes still intact ===")
    
    r = httpx.get(f"{API_URL}/competitions", timeout=30)
    print(f"Status: {r.status_code}")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    
    data = r.json()
    assert "competitions" in data, "Missing competitions"
    competitions = data["competitions"]
    
    print(f"Number of competitions: {len(competitions)}")
    assert len(competitions) >= 2, f"Expected at least 2 competitions, got {len(competitions)}"
    
    # Find paper-main and real-main
    paper_comp = next((c for c in competitions if c["id"] == "paper-main"), None)
    real_comp = next((c for c in competitions if c["id"] == "real-main"), None)
    
    assert paper_comp is not None, "paper-main competition not found"
    assert real_comp is not None, "real-main competition not found"
    
    # Verify paper-main
    print("\nPaper competition:")
    print(f"  ID: {paper_comp['id']}")
    print(f"  Entry fee: {paper_comp.get('entry_fee_sol')} SOL")
    print(f"  Prize pool USD: ${paper_comp.get('prize_pool_usd'):,}")
    print(f"  Prize pool dBET: {paper_comp.get('prize_pool_dbet'):,}")
    print(f"  Status: {paper_comp.get('status')}")
    
    assert paper_comp["entry_fee_sol"] == 1.0, f"Expected entry_fee_sol 1.0, got {paper_comp.get('entry_fee_sol')}"
    assert paper_comp["prize_pool_usd"] == 10000, f"Expected prize_pool_usd 10000, got {paper_comp.get('prize_pool_usd')}"
    assert paper_comp["prize_pool_dbet"] == 30_000_000, f"Expected prize_pool_dbet 30M, got {paper_comp.get('prize_pool_dbet')}"
    assert paper_comp["status"] == "open", f"Expected status open, got {paper_comp.get('status')}"
    assert "prize_structure" in paper_comp, "Missing prize_structure"
    
    # Verify real-main
    print("\nReal competition:")
    print(f"  ID: {real_comp['id']}")
    print(f"  Entry fee: {real_comp.get('entry_fee_sol')} SOL")
    print(f"  Prize pool USD: ${real_comp.get('prize_pool_usd'):,}")
    print(f"  Prize pool dBET: {real_comp.get('prize_pool_dbet'):,}")
    print(f"  Status: {real_comp.get('status')}")
    
    assert real_comp["entry_fee_sol"] == 10.0, f"Expected entry_fee_sol 10.0, got {real_comp.get('entry_fee_sol')}"
    assert real_comp["prize_pool_usd"] == 100000, f"Expected prize_pool_usd 100000, got {real_comp.get('prize_pool_usd')}"
    assert real_comp["prize_pool_dbet"] == 70_000_000, f"Expected prize_pool_dbet 70M, got {real_comp.get('prize_pool_dbet')}"
    assert real_comp["status"] == "open", f"Expected status open, got {real_comp.get('status')}"
    assert "prize_structure" in real_comp, "Missing prize_structure"
    
    print("\n✅ TEST 6 PASSED: Both competitions present with correct dBET prizes (30M/70M)")
    return True

def test_7_deposit_conversion_works():
    """Test 7: Deposit conversion still works (needs SOL/USD internally)"""
    print("\n=== TEST 7: Deposit conversion still works ===")
    
    # Create user with custodial address
    print("\nCreating user for deposit test...")
    user_data = {
        "privy_id": "deposit_test_1",
        "x_handle": "deposit_test",
    }
    r = httpx.post(f"{API_URL}/users/upsert", json=user_data, timeout=30)
    print(f"Status: {r.status_code}")
    assert r.status_code == 200, f"User creation failed: {r.status_code}"
    
    user = r.json()
    print(f"User created: {user.get('privy_id')}")
    print(f"Custodial address: {user.get('custodial_address')}")
    assert "custodial_address" in user, "Missing custodial_address"
    assert user["custodial_address"] is not None, "custodial_address is None"
    
    # Verify SOL/USD price is available internally
    print("\nVerifying SOL/USD price for deposit conversion...")
    r = httpx.get(f"{API_URL}/markets/price/SOL/USD", timeout=30)
    print(f"Status: {r.status_code}")
    assert r.status_code == 200, f"SOL/USD price not available: {r.status_code}"
    
    sol_data = r.json()
    sol_price = sol_data["price"]
    print(f"SOL/USD price: ${sol_price}")
    
    # Sanity check: SOL price should be > $50
    assert sol_price > 50, f"SOL price sanity check failed: ${sol_price} (expected > $50)"
    
    print("\n✅ TEST 7 PASSED: Deposit conversion infrastructure works (SOL/USD available internally)")
    return True

def test_8_regression_tests():
    """Test 8: Regression tests"""
    print("\n=== TEST 8: Regression tests ===")
    
    # Test landing stats
    print("\nTesting GET /api/stats/landing...")
    r = httpx.get(f"{API_URL}/stats/landing", timeout=30)
    print(f"Status: {r.status_code}")
    assert r.status_code == 200, f"Landing stats failed: {r.status_code}"
    
    data = r.json()
    print(f"Response: {data}")
    
    # Verify all required fields are numeric
    required_fields = ["users", "trades", "total_volume", "monthly_volume", "max_leverage", "uptime"]
    for field in required_fields:
        assert field in data, f"Missing field: {field}"
        assert isinstance(data[field], (int, float)), f"Field {field} must be numeric, got {type(data[field])}"
    
    print("✅ Landing stats working")
    
    # Test leaderboard
    print("\nTesting GET /api/leaderboard/paper...")
    r = httpx.get(f"{API_URL}/leaderboard/paper", timeout=30)
    print(f"Status: {r.status_code}")
    assert r.status_code == 200, f"Leaderboard failed: {r.status_code}"
    
    data = r.json()
    assert "leaderboard" in data, "Missing leaderboard"
    assert isinstance(data["leaderboard"], list), "Leaderboard must be array"
    print(f"Leaderboard entries: {len(data['leaderboard'])}")
    print("✅ Leaderboard working")
    
    # Test user upsert idempotency
    print("\nTesting POST /api/users/upsert idempotency...")
    user_data = {
        "privy_id": "regression_test_1",
        "x_handle": "regression_test",
    }
    r1 = httpx.post(f"{API_URL}/users/upsert", json=user_data, timeout=30)
    assert r1.status_code == 200, f"First upsert failed: {r1.status_code}"
    user1 = r1.json()
    
    r2 = httpx.post(f"{API_URL}/users/upsert", json=user_data, timeout=30)
    assert r2.status_code == 200, f"Second upsert failed: {r2.status_code}"
    user2 = r2.json()
    
    # Should return same user
    assert user1["privy_id"] == user2["privy_id"], "User privy_id changed"
    assert user1.get("custodial_address") == user2.get("custodial_address"), "Custodial address changed"
    print("✅ User upsert idempotent")
    
    # Test wallet balance endpoint
    print("\nTesting GET /api/wallet/balance/{address}...")
    test_address = "So11111111111111111111111111111111111111112"  # Wrapped SOL mint
    r = httpx.get(f"{API_URL}/wallet/balance/{test_address}", timeout=30)
    print(f"Status: {r.status_code}")
    assert r.status_code == 200, f"Wallet balance failed: {r.status_code}"
    
    data = r.json()
    print(f"Response: {data}")
    assert "address" in data, "Missing address"
    assert "sol" in data, "Missing sol"
    assert "usdc" in data, "Missing usdc"
    print("✅ Wallet balance working")
    
    print("\n✅ TEST 8 PASSED: All regression tests passed")
    return True

def run_all_tests():
    """Run all tests and report results"""
    print("=" * 80)
    print("DEGENS.BET BACKEND TESTING - TRADING PAIRS SWAP")
    print("=" * 80)
    print(f"API URL: {API_URL}")
    print(f"Expected pairs: {', '.join(EXPECTED_PAIRS)}")
    print("=" * 80)
    
    tests = [
        ("Pairs list & live data", test_1_pairs_list_and_live_data),
        ("Single pair lookup", test_2_single_pair_lookup),
        ("Trade flow on new pairs", test_3_trade_flow_on_new_pairs),
        ("Old pair rejection", test_4_old_pair_rejection),
        ("Token endpoint new tokenomics", test_5_token_endpoint_new_tokenomics),
        ("Competition prizes intact", test_6_competitions_prizes_intact),
        ("Deposit conversion works", test_7_deposit_conversion_works),
        ("Regression tests", test_8_regression_tests),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            test_func()
            results.append((name, "PASSED", None))
        except AssertionError as e:
            results.append((name, "FAILED", str(e)))
        except Exception as e:
            results.append((name, "ERROR", str(e)))
    
    # Print summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    passed = 0
    failed = 0
    errors = 0
    
    for name, status, error in results:
        if status == "PASSED":
            print(f"✅ {name}: {status}")
            passed += 1
        elif status == "FAILED":
            print(f"❌ {name}: {status}")
            print(f"   Error: {error}")
            failed += 1
        else:
            print(f"⚠️  {name}: {status}")
            print(f"   Error: {error}")
            errors += 1
    
    print("=" * 80)
    print(f"Total: {len(tests)} tests")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Errors: {errors}")
    print("=" * 80)
    
    return failed == 0 and errors == 0

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)

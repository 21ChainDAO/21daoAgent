"""Tests for /api/token endpoint after $dBET -> $DEGEN rename."""
import os
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://terminal-degen.preview.emergentagent.com").rstrip("/")
LIVE_CA = "BkEqYRg7CqHwuEeUk1eyvAurcaUMzT9R1Xi3ZByspump"


def test_token_endpoint_symbol_and_contract():
    r = requests.get(f"{BASE_URL}/api/token", timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["symbol"] == "DEGEN"
    assert data["contract"] == LIVE_CA, f"Expected live CA, got {data.get('contract')}"
    assert data["contract"] != "TBA"
    assert data["chain"] == "Solana"
    assert data["total_supply"] == 1_000_000_000


def test_token_endpoint_tokenomics_4_buckets():
    r = requests.get(f"{BASE_URL}/api/token", timeout=15)
    assert r.status_code == 200
    data = r.json()
    buckets = {t["label"]: t["pct"] for t in data["tokenomics"]}
    assert len(data["tokenomics"]) == 4
    assert buckets == {
        "LOCKED": 50,
        "REAL REWARDS": 7,
        "PAPER REWARDS": 3,
        "PUBLIC LAUNCH": 40,
    }
    # Amounts
    amounts = {t["label"]: t["amount"] for t in data["tokenomics"]}
    assert amounts["LOCKED"] == 500_000_000
    assert amounts["REAL REWARDS"] == 70_000_000
    assert amounts["PAPER REWARDS"] == 30_000_000
    assert amounts["PUBLIC LAUNCH"] == 400_000_000


def test_token_endpoint_no_auth_required():
    # No auth headers, should still return 200
    r = requests.get(f"{BASE_URL}/api/token", timeout=15, headers={})
    assert r.status_code == 200

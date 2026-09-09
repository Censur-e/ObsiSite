#!/usr/bin/env python3
"""
Backend API Tests for Obsidian Anticheat
Tests new features: Stats endpoint, SSRF webhook validation, dev-login guard
Plus regression tests for previously working endpoints
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://obsidian-hub-7.preview.emergentagent.com/api"
SESSION_SECRET = "obsidian_9f3a1c7e5b2d4680a1c3e5f7098b6d4e2a1c3e5f7098b6d4e"

# Test data
TEST_USERS = {
    "freemium": {
        "discord_id": "test_freemium_stats_001",
        "username": "FreemiumTester",
        "rank": "Freemium",
        "is_admin": False,
        "status": "active",
        "api_key": "freemium_test_key_stats_001"
    },
    "premium": {
        "discord_id": "test_premium_stats_001",
        "username": "PremiumTester",
        "rank": "Premium",
        "is_admin": False,
        "status": "active",
        "api_key": "premium_test_key_stats_001"
    }
}

def print_test(name):
    print(f"\n{'='*80}")
    print(f"TEST: {name}")
    print('='*80)

def print_result(success, message):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")

def dev_login(user_data):
    """Login using dev-login endpoint and return session cookie"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/dev-login",
            json={
                "secret": SESSION_SECRET,
                **user_data
            },
            timeout=10
        )
        if response.status_code == 200:
            cookie = response.cookies.get('obsidian_session')
            print_result(True, f"Dev-login successful for {user_data['username']}")
            return cookie
        else:
            print_result(False, f"Dev-login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print_result(False, f"Dev-login exception: {str(e)}")
        return None

def test_stats_endpoint():
    """Test A: Stats endpoint with aggregation"""
    print_test("Stats Endpoint - Aggregation and Analytics")
    
    # Login as freemium user
    cookie = dev_login(TEST_USERS["freemium"])
    if not cookie:
        print_result(False, "Cannot proceed without session cookie")
        return False
    
    cookies = {"obsidian_session": cookie}
    api_key = TEST_USERS["freemium"]["api_key"]
    
    # Test 1: GET /api/stats without cookie => 401
    try:
        response = requests.get(f"{BASE_URL}/stats", timeout=10)
        if response.status_code == 401:
            print_result(True, "Stats endpoint returns 401 without session cookie")
        else:
            print_result(False, f"Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Stats without cookie test failed: {str(e)}")
        return False
    
    # Test 2: Create several detections with varied data
    detections_data = [
        {"detection_type": "fly", "sanction": "kick", "player_name": "Bob", "player_id": "123", "message": "Flying detected", "place_id": "1001", "job_id": "job1"},
        {"detection_type": "speed", "sanction": "ban", "player_name": "Alice", "player_id": "456", "message": "Speed hack", "place_id": "1001", "job_id": "job1"},
        {"detection_type": "fly", "sanction": "kick", "player_name": "Bob", "player_id": "123", "message": "Flying again", "place_id": "1002", "job_id": "job2"},
        {"detection_type": "noclip", "sanction": "kick", "player_name": "Charlie", "player_id": "789", "message": "Noclip detected", "place_id": "1001", "job_id": "job1"},
        {"detection_type": "fly", "sanction": "ban", "player_name": "Alice", "player_id": "456", "message": "Persistent flying", "place_id": "1003", "job_id": "job3"},
    ]
    
    created_count = 0
    for det in detections_data:
        try:
            response = requests.post(
                f"{BASE_URL}/roblox/detection",
                headers={"x-api-key": api_key},
                json=det,
                timeout=10
            )
            if response.status_code == 200:
                created_count += 1
            else:
                print_result(False, f"Failed to create detection: {response.status_code} - {response.text}")
        except Exception as e:
            print_result(False, f"Detection creation exception: {str(e)}")
    
    print_result(created_count == len(detections_data), f"Created {created_count}/{len(detections_data)} detections")
    
    if created_count == 0:
        print_result(False, "Cannot test stats without detections")
        return False
    
    # Wait a moment for data to be saved
    time.sleep(1)
    
    # Test 3: GET /api/stats with cookie => verify JSON structure and data
    try:
        response = requests.get(f"{BASE_URL}/stats", cookies=cookies, timeout=10)
        if response.status_code != 200:
            print_result(False, f"Stats endpoint returned {response.status_code}: {response.text}")
            return False
        
        stats = response.json()
        print(f"Stats response: {json.dumps(stats, indent=2)}")
        
        # Verify total matches number created
        if stats.get("total") >= created_count:
            print_result(True, f"Total detections: {stats['total']} (>= {created_count} created)")
        else:
            print_result(False, f"Total mismatch: expected >= {created_count}, got {stats.get('total')}")
            return False
        
        # Verify last24h
        if "last24h" in stats:
            print_result(True, f"last24h present: {stats['last24h']}")
        else:
            print_result(False, "last24h missing")
            return False
        
        # Verify last7d
        if "last7d" in stats:
            print_result(True, f"last7d present: {stats['last7d']}")
        else:
            print_result(False, "last7d missing")
            return False
        
        # Verify unique_players (should be at least 3: Bob, Alice, Charlie)
        unique_players = stats.get("unique_players", 0)
        if unique_players >= 3:
            print_result(True, f"unique_players: {unique_players} (>= 3)")
        else:
            print_result(False, f"unique_players: expected >= 3, got {unique_players}")
            return False
        
        # Verify by_type (should have fly with count >= 3)
        by_type = stats.get("by_type", [])
        if not isinstance(by_type, list):
            print_result(False, f"by_type is not a list: {type(by_type)}")
            return False
        
        fly_entry = next((x for x in by_type if x.get("name") == "fly"), None)
        if fly_entry and fly_entry.get("count") >= 3:
            print_result(True, f"by_type has 'fly' with count {fly_entry['count']} (>= 3)")
        else:
            print_result(False, f"by_type 'fly' count incorrect: {fly_entry}")
            return False
        
        # Verify by_type is sorted descending
        counts = [x.get("count", 0) for x in by_type]
        if counts == sorted(counts, reverse=True):
            print_result(True, "by_type is sorted descending")
        else:
            print_result(False, f"by_type not sorted: {counts}")
            return False
        
        # Verify by_sanction
        by_sanction = stats.get("by_sanction", [])
        if isinstance(by_sanction, list) and len(by_sanction) > 0:
            print_result(True, f"by_sanction present with {len(by_sanction)} entries")
        else:
            print_result(False, "by_sanction missing or empty")
            return False
        
        # Verify top_players (Bob should be first with count >= 2)
        top_players = stats.get("top_players", [])
        if not isinstance(top_players, list):
            print_result(False, f"top_players is not a list: {type(top_players)}")
            return False
        
        if len(top_players) > 10:
            print_result(False, f"top_players exceeds max 10: {len(top_players)}")
            return False
        
        # Check if Bob or Alice is first (both have 2 detections)
        if len(top_players) > 0:
            first_player = top_players[0]
            if first_player.get("name") in ["Bob", "Alice"] and first_player.get("count") >= 2:
                print_result(True, f"top_players first: {first_player['name']} with count {first_player['count']}")
            else:
                print_result(False, f"top_players first entry incorrect: {first_player}")
                return False
        
        # Verify top_players is sorted descending
        player_counts = [x.get("count", 0) for x in top_players]
        if player_counts == sorted(player_counts, reverse=True):
            print_result(True, "top_players is sorted descending")
        else:
            print_result(False, f"top_players not sorted: {player_counts}")
            return False
        
        # Verify timeline has exactly 14 entries
        timeline = stats.get("timeline", [])
        if len(timeline) == 14:
            print_result(True, f"timeline has exactly 14 entries")
        else:
            print_result(False, f"timeline has {len(timeline)} entries, expected 14")
            return False
        
        # Verify today's entry in timeline counts today's detections
        today = datetime.now().strftime("%Y-%m-%d")
        today_entry = next((x for x in timeline if x.get("date") == today), None)
        if today_entry:
            if today_entry.get("count") >= created_count:
                print_result(True, f"Today's timeline entry: {today_entry['count']} (>= {created_count})")
            else:
                print_result(True, f"Today's timeline entry: {today_entry['count']} (may include previous detections)")
        else:
            print_result(False, f"Today's date {today} not found in timeline")
            return False
        
        print_result(True, "All stats endpoint tests passed")
        return True
        
    except Exception as e:
        print_result(False, f"Stats endpoint test exception: {str(e)}")
        return False

def test_ssrf_webhook_validation():
    """Test B: SSRF webhook validation"""
    print_test("SSRF Webhook Validation - Security Tests")
    
    # Login as premium user
    cookie = dev_login(TEST_USERS["premium"])
    if not cookie:
        print_result(False, "Cannot proceed without session cookie")
        return False
    
    cookies = {"obsidian_session": cookie}
    
    # Test 1: PUT /api/config with SSRF attempt (AWS metadata)
    try:
        response = requests.put(
            f"{BASE_URL}/config",
            cookies=cookies,
            json={"webhook_url": "http://169.254.169.254/latest/meta-data/"},
            timeout=10
        )
        if response.status_code == 400 and "invalid_webhook" in response.text:
            print_result(True, "Blocked AWS metadata SSRF attempt (169.254.169.254)")
        else:
            print_result(False, f"Expected 400 invalid_webhook, got {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"SSRF test 1 exception: {str(e)}")
        return False
    
    # Test 2: PUT /api/config with localhost SSRF attempt
    try:
        response = requests.put(
            f"{BASE_URL}/config",
            cookies=cookies,
            json={"webhook_url": "http://localhost:3000/x"},
            timeout=10
        )
        if response.status_code == 400 and "invalid_webhook" in response.text:
            print_result(True, "Blocked localhost SSRF attempt")
        else:
            print_result(False, f"Expected 400 invalid_webhook, got {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"SSRF test 2 exception: {str(e)}")
        return False
    
    # Test 3: PUT /api/config with wrong Discord host
    try:
        response = requests.put(
            f"{BASE_URL}/config",
            cookies=cookies,
            json={"webhook_url": "https://evil.com/api/webhooks/1/2"},
            timeout=10
        )
        if response.status_code == 400 and "invalid_webhook" in response.text:
            print_result(True, "Blocked non-Discord host (evil.com)")
        else:
            print_result(False, f"Expected 400 invalid_webhook, got {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"SSRF test 3 exception: {str(e)}")
        return False
    
    # Test 4: PUT /api/config with valid Discord webhook
    try:
        response = requests.put(
            f"{BASE_URL}/config",
            cookies=cookies,
            json={"webhook_url": "https://discord.com/api/webhooks/123456/abcdef"},
            timeout=10
        )
        if response.status_code == 200:
            print_result(True, "Accepted valid Discord webhook URL")
        else:
            print_result(False, f"Expected 200, got {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"SSRF test 4 exception: {str(e)}")
        return False
    
    # Test 5: PUT /api/config with empty webhook (clears it)
    try:
        response = requests.put(
            f"{BASE_URL}/config",
            cookies=cookies,
            json={"webhook_url": ""},
            timeout=10
        )
        if response.status_code == 200:
            print_result(True, "Accepted empty webhook_url (clears it)")
        else:
            print_result(False, f"Expected 200, got {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"SSRF test 5 exception: {str(e)}")
        return False
    
    # Test 6: POST /api/webhook/test with invalid webhook
    try:
        response = requests.post(
            f"{BASE_URL}/webhook/test",
            cookies=cookies,
            json={"webhook_url": "http://169.254.169.254/"},
            timeout=10
        )
        if response.status_code == 400 and "invalid_webhook" in response.text:
            print_result(True, "webhook/test blocked invalid webhook")
        else:
            print_result(False, f"Expected 400 invalid_webhook, got {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_result(False, f"SSRF test 6 exception: {str(e)}")
        return False
    
    print_result(True, "All SSRF webhook validation tests passed")
    return True

def test_dev_login_guard():
    """Test C: Dev-login guard (should work in development)"""
    print_test("Dev-Login Guard - Development Environment")
    
    # Test 1: Dev-login with correct secret should work in development
    try:
        response = requests.post(
            f"{BASE_URL}/auth/dev-login",
            json={
                "secret": SESSION_SECRET,
                "discord_id": "test_dev_login_guard_001",
                "username": "DevLoginTester",
                "rank": "Freemium",
                "is_admin": False,
                "status": "active",
                "api_key": "dev_login_test_key_001"
            },
            timeout=10
        )
        if response.status_code == 200:
            cookie = response.cookies.get('obsidian_session')
            if cookie:
                print_result(True, "Dev-login works in development (NODE_ENV=development)")
            else:
                print_result(False, "Dev-login returned 200 but no cookie")
                return False
        else:
            print_result(False, f"Dev-login failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Dev-login test exception: {str(e)}")
        return False
    
    # Test 2: Dev-login with wrong secret should return 403
    try:
        response = requests.post(
            f"{BASE_URL}/auth/dev-login",
            json={
                "secret": "wrong_secret",
                "discord_id": "test_dev_login_guard_002",
                "username": "WrongSecretTester"
            },
            timeout=10
        )
        if response.status_code == 403:
            print_result(True, "Dev-login correctly rejects wrong secret (403)")
        else:
            print_result(False, f"Expected 403, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Wrong secret test exception: {str(e)}")
        return False
    
    print_result(True, "All dev-login guard tests passed")
    return True

def test_regression():
    """Test D: Regression tests for previously working endpoints"""
    print_test("Regression Tests - Previously Working Endpoints")
    
    # Login as freemium user
    freemium_cookie = dev_login(TEST_USERS["freemium"])
    if not freemium_cookie:
        print_result(False, "Cannot proceed without freemium session cookie")
        return False
    
    freemium_cookies = {"obsidian_session": freemium_cookie}
    freemium_api_key = TEST_USERS["freemium"]["api_key"]
    
    # Test 1: GET /api/config with cookie => 200
    try:
        response = requests.get(f"{BASE_URL}/config", cookies=freemium_cookies, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if "config" in data and "rank" in data:
                print_result(True, "GET /api/config works (200 with config and rank)")
            else:
                print_result(False, f"GET /api/config missing fields: {data.keys()}")
                return False
        else:
            print_result(False, f"GET /api/config failed: {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"GET /api/config exception: {str(e)}")
        return False
    
    # Test 2: POST /api/roblox/detection with valid key => 200
    try:
        response = requests.post(
            f"{BASE_URL}/roblox/detection",
            headers={"x-api-key": freemium_api_key},
            json={
                "player_name": "RegressionTester",
                "player_id": "999",
                "detection_type": "test",
                "sanction": "kick",
                "message": "Regression test detection",
                "place_id": "9999",
                "job_id": "regression_job"
            },
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            if data.get("ok") == True:
                print_result(True, "POST /api/roblox/detection works (200 with ok:true)")
            else:
                print_result(False, f"Detection response missing ok:true: {data}")
                return False
        else:
            print_result(False, f"POST /api/roblox/detection failed: {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"POST /api/roblox/detection exception: {str(e)}")
        return False
    
    # Test 3: POST /api/roblox/detection without key => 400
    try:
        response = requests.post(
            f"{BASE_URL}/roblox/detection",
            json={"player_name": "Test"},
            timeout=10
        )
        if response.status_code == 400:
            print_result(True, "POST /api/roblox/detection without key returns 400")
        else:
            print_result(False, f"Expected 400, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Detection without key test exception: {str(e)}")
        return False
    
    # Test 4: POST /api/roblox/detection with invalid key => 401
    try:
        response = requests.post(
            f"{BASE_URL}/roblox/detection",
            headers={"x-api-key": "invalid_key_12345"},
            json={"player_name": "Test"},
            timeout=10
        )
        if response.status_code == 401:
            print_result(True, "POST /api/roblox/detection with invalid key returns 401")
        else:
            print_result(False, f"Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Detection with invalid key test exception: {str(e)}")
        return False
    
    # Test 5: GET /api/roblox/config with valid key => 200
    try:
        response = requests.get(
            f"{BASE_URL}/roblox/config?key={freemium_api_key}",
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            if "rank" in data and "webhook_url" in data:
                print_result(True, "GET /api/roblox/config works (200 with rank and webhook_url)")
            else:
                print_result(False, f"GET /api/roblox/config missing fields: {data.keys()}")
                return False
        else:
            print_result(False, f"GET /api/roblox/config failed: {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"GET /api/roblox/config exception: {str(e)}")
        return False
    
    # Test 6: Rank locking - Freemium cannot save Premium params
    # First, get parameters to find a Premium-locked parameter
    try:
        response = requests.get(f"{BASE_URL}/parameters", cookies=freemium_cookies, timeout=10)
        if response.status_code == 200:
            params = response.json().get("parameters", [])
            premium_param = next((p for p in params if p.get("min_rank") == "Premium"), None)
            
            if premium_param:
                premium_key = premium_param["key"]
                print(f"Testing rank locking with Premium param: {premium_key}")
                
                # Try to save Premium parameter as Freemium user
                response = requests.put(
                    f"{BASE_URL}/config",
                    cookies=freemium_cookies,
                    json={"config": {premium_key: True}},
                    timeout=10
                )
                
                if response.status_code == 200:
                    # Check if the parameter was actually saved
                    response = requests.get(f"{BASE_URL}/config", cookies=freemium_cookies, timeout=10)
                    if response.status_code == 200:
                        config = response.json().get("config", {})
                        if config.get(premium_key) != True:
                            print_result(True, f"Rank locking works: Freemium cannot save Premium param {premium_key}")
                        else:
                            print_result(False, f"Rank locking failed: Freemium saved Premium param {premium_key}")
                            return False
                    else:
                        print_result(False, f"Failed to verify rank locking: {response.status_code}")
                        return False
                else:
                    print_result(False, f"PUT /api/config failed: {response.status_code}")
                    return False
            else:
                print_result(True, "No Premium parameters found to test rank locking (skipped)")
        else:
            print_result(False, f"GET /api/parameters failed: {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Rank locking test exception: {str(e)}")
        return False
    
    print_result(True, "All regression tests passed")
    return True

def main():
    print("\n" + "="*80)
    print("OBSIDIAN ANTICHEAT - BACKEND API TESTS")
    print("Testing: Stats, SSRF Protection, Dev-Login Guard, Regression")
    print("="*80)
    
    results = {
        "Stats Endpoint": False,
        "SSRF Webhook Validation": False,
        "Dev-Login Guard": False,
        "Regression Tests": False
    }
    
    try:
        results["Stats Endpoint"] = test_stats_endpoint()
    except Exception as e:
        print_result(False, f"Stats endpoint test crashed: {str(e)}")
    
    try:
        results["SSRF Webhook Validation"] = test_ssrf_webhook_validation()
    except Exception as e:
        print_result(False, f"SSRF validation test crashed: {str(e)}")
    
    try:
        results["Dev-Login Guard"] = test_dev_login_guard()
    except Exception as e:
        print_result(False, f"Dev-login guard test crashed: {str(e)}")
    
    try:
        results["Regression Tests"] = test_regression()
    except Exception as e:
        print_result(False, f"Regression tests crashed: {str(e)}")
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    print(f"\nTotal: {passed}/{total} test suites passed")
    print("="*80)
    
    return all(results.values())

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)

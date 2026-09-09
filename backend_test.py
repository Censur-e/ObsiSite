#!/usr/bin/env python3
"""
Backend API tests for Obsidian Anticheat
Tests NEW features: Live Status, Detections, Embed Customization
"""
import requests
import time
import json
from datetime import datetime

# Configuration
BASE_URL = "https://obsidian-hub-7.preview.emergentagent.com/api"
SESSION_SECRET = "obsidian_9f3a1c7e5b2d4680a1c3e5f7098b6d4e2a1c3e5f7098b6d4e"

# Test users
FREEMIUM_USER = {
    "discord_id": "test_freemium_999001",
    "username": "FreemiumTester",
    "rank": "Freemium",
    "status": "active",
    "api_key": "freemium_test_key_abc123xyz"
}

PREMIUM_USER = {
    "discord_id": "test_premium_999002",
    "username": "PremiumTester",
    "rank": "Premium",
    "status": "active",
    "api_key": "premium_test_key_def456uvw"
}

def print_test(name):
    print(f"\n{'='*60}")
    print(f"TEST: {name}")
    print('='*60)

def print_result(success, message):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")

def create_test_user(user_data):
    """Create a test user via dev-login"""
    print_test(f"Creating test user: {user_data['username']}")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/dev-login",
            json={
                "secret": SESSION_SECRET,
                "discord_id": user_data["discord_id"],
                "username": user_data["username"],
                "rank": user_data["rank"],
                "status": user_data["status"],
                "api_key": user_data["api_key"],
                "is_admin": False
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            cookies = response.cookies
            session_cookie = cookies.get("obsidian_session")
            print_result(True, f"User created: {data.get('user', {}).get('username')}")
            print(f"   API Key: {user_data['api_key']}")
            print(f"   Session Cookie: {session_cookie[:20]}..." if session_cookie else "   No session cookie")
            return session_cookie
        else:
            print_result(False, f"Failed to create user: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return None

def test_live_status(api_key, session_cookie, user_name):
    """Test 1: Live Status Tracking"""
    print_test(f"Live Status Tracking - {user_name}")
    
    # Step 1: Call roblox/config with place_id and job_id
    print("\n[Step 1] Calling GET /api/roblox/config with place_id=123 & job_id=abc")
    try:
        response = requests.get(
            f"{BASE_URL}/roblox/config",
            params={"key": api_key, "place_id": "123", "job_id": "abc"},
            timeout=10
        )
        
        if response.status_code == 200:
            print_result(True, "Roblox config endpoint responded successfully")
            config_data = response.json()
            print(f"   Rank: {config_data.get('rank')}")
        else:
            print_result(False, f"Roblox config failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Exception calling roblox/config: {str(e)}")
        return False
    
    # Step 2: Verify via GET /api/config
    print("\n[Step 2] Verifying via GET /api/config with session cookie")
    try:
        response = requests.get(
            f"{BASE_URL}/config",
            cookies={"obsidian_session": session_cookie},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            last_sync = data.get("last_sync")
            last_place_id = data.get("last_place_id")
            last_job_id = data.get("last_job_id")
            online = data.get("online")
            
            print(f"   last_sync: {last_sync}")
            print(f"   last_place_id: {last_place_id}")
            print(f"   last_job_id: {last_job_id}")
            print(f"   online: {online}")
            
            # Verify values
            all_good = True
            if last_place_id != "123":
                print_result(False, f"last_place_id mismatch: expected '123', got '{last_place_id}'")
                all_good = False
            else:
                print_result(True, "last_place_id is correct (123)")
            
            if last_job_id != "abc":
                print_result(False, f"last_job_id mismatch: expected 'abc', got '{last_job_id}'")
                all_good = False
            else:
                print_result(True, "last_job_id is correct (abc)")
            
            if not last_sync:
                print_result(False, "last_sync is null or missing")
                all_good = False
            else:
                # Check if last_sync is recent (within last 10 seconds)
                try:
                    sync_time = datetime.fromisoformat(last_sync.replace('Z', '+00:00'))
                    now = datetime.now(sync_time.tzinfo)
                    diff_seconds = (now - sync_time).total_seconds()
                    if diff_seconds < 10:
                        print_result(True, f"last_sync is recent ({diff_seconds:.1f}s ago)")
                    else:
                        print_result(False, f"last_sync is too old ({diff_seconds:.1f}s ago)")
                        all_good = False
                except Exception as e:
                    print_result(False, f"Could not parse last_sync: {str(e)}")
                    all_good = False
            
            if online != True:
                print_result(False, f"online status is not True: {online}")
                all_good = False
            else:
                print_result(True, "online status is True")
            
            return all_good
        else:
            print_result(False, f"GET /api/config failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_detections(api_key, session_cookie, user_name):
    """Test 2: Detections - Log, List, Filters"""
    print_test(f"Detections - {user_name}")
    
    # Step 1: POST a detection
    print("\n[Step 1] POST /api/roblox/detection")
    detection_data = {
        "player_name": "CheaterPlayer123",
        "player_id": "987654321",
        "detection": "fly",
        "message": "Player was flying at high speed",
        "sanction": "kick",
        "place_id": "456789",
        "job_id": "xyz789"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/roblox/detection",
            headers={"x-api-key": api_key},
            json=detection_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Detection posted successfully")
            print(f"   Response: {json.dumps(data, indent=2)}")
            
            # Verify response structure
            if data.get("ok") != True:
                print_result(False, f"Expected ok=true, got {data.get('ok')}")
                return False
            else:
                print_result(True, "Response has ok=true")
            
            if data.get("webhook_sent") != False:
                print_result(False, f"Expected webhook_sent=false (no webhook set), got {data.get('webhook_sent')}")
                # Not a critical failure, continue
            else:
                print_result(True, "webhook_sent=false (no webhook configured)")
            
            detection_id = data.get("id")
            if detection_id:
                print(f"   Detection ID: {detection_id}")
        else:
            print_result(False, f"POST detection failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False
    
    # Step 2: GET detections list
    print("\n[Step 2] GET /api/detections (list all)")
    try:
        response = requests.get(
            f"{BASE_URL}/detections",
            cookies={"obsidian_session": session_cookie},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            detections = data.get("detections", [])
            print_result(True, f"Retrieved {len(detections)} detection(s)")
            
            # Find our detection
            found = False
            for d in detections:
                if d.get("player_name") == "CheaterPlayer123":
                    found = True
                    print(f"   Found detection: {d.get('detection_type')} - {d.get('player_name')}")
                    break
            
            if found:
                print_result(True, "Our detection is in the list")
            else:
                print_result(False, "Our detection was not found in the list")
                return False
        else:
            print_result(False, f"GET detections failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False
    
    # Step 3: Test filter by type
    print("\n[Step 3] GET /api/detections?type=fly")
    try:
        response = requests.get(
            f"{BASE_URL}/detections",
            params={"type": "fly"},
            cookies={"obsidian_session": session_cookie},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            detections = data.get("detections", [])
            print_result(True, f"Filter by type=fly returned {len(detections)} detection(s)")
            
            # Verify all are fly type
            all_fly = all(d.get("detection_type") == "fly" for d in detections)
            if all_fly:
                print_result(True, "All detections are type 'fly'")
            else:
                print_result(False, "Some detections are not type 'fly'")
        else:
            print_result(False, f"GET detections with filter failed: {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False
    
    # Step 4: Test filter by player
    print("\n[Step 4] GET /api/detections?player=CheaterPlayer123")
    try:
        response = requests.get(
            f"{BASE_URL}/detections",
            params={"player": "CheaterPlayer123"},
            cookies={"obsidian_session": session_cookie},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            detections = data.get("detections", [])
            print_result(True, f"Filter by player returned {len(detections)} detection(s)")
            
            # Verify all match player name
            all_match = all("CheaterPlayer123" in (d.get("player_name") or "") for d in detections)
            if all_match:
                print_result(True, "All detections match player name")
            else:
                print_result(False, "Some detections don't match player name")
        else:
            print_result(False, f"GET detections with filter failed: {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False
    
    return True

def test_embed_customization(session_cookie, user_name):
    """Test 3: Embed Customization"""
    print_test(f"Embed Customization - {user_name}")
    
    # Step 1: PUT custom embed config
    print("\n[Step 1] PUT /api/config with custom embed_config")
    custom_embed = {
        "title": "X {detection}",
        "color": 255,
        "footer": "F",
        "show_reason": False
    }
    
    try:
        response = requests.put(
            f"{BASE_URL}/config",
            cookies={"obsidian_session": session_cookie},
            json={"embed_config": custom_embed},
            timeout=10
        )
        
        if response.status_code == 200:
            print_result(True, "Embed config updated successfully")
            data = response.json()
            print(f"   Response: {json.dumps(data.get('embed_config', {}), indent=2)}")
        else:
            print_result(False, f"PUT config failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False
    
    # Step 2: GET config and verify merge
    print("\n[Step 2] GET /api/config to verify merged embed_config")
    try:
        response = requests.get(
            f"{BASE_URL}/config",
            cookies={"obsidian_session": session_cookie},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            embed_config = data.get("embed_config", {})
            print(f"   Merged embed_config: {json.dumps(embed_config, indent=2)}")
            
            # Verify custom values
            all_good = True
            if embed_config.get("title") != "X {detection}":
                print_result(False, f"title mismatch: expected 'X {{detection}}', got '{embed_config.get('title')}'")
                all_good = False
            else:
                print_result(True, "title is correct")
            
            if embed_config.get("color") != 255:
                print_result(False, f"color mismatch: expected 255, got {embed_config.get('color')}")
                all_good = False
            else:
                print_result(True, "color is correct")
            
            if embed_config.get("footer") != "F":
                print_result(False, f"footer mismatch: expected 'F', got '{embed_config.get('footer')}'")
                all_good = False
            else:
                print_result(True, "footer is correct")
            
            if embed_config.get("show_reason") != False:
                print_result(False, f"show_reason mismatch: expected False, got {embed_config.get('show_reason')}")
                all_good = False
            else:
                print_result(True, "show_reason is False")
            
            # Verify defaults are preserved
            if embed_config.get("show_player") != True:
                print_result(False, f"show_player should default to True, got {embed_config.get('show_player')}")
                all_good = False
            else:
                print_result(True, "show_player defaults to True")
            
            if embed_config.get("show_server") != True:
                print_result(False, f"show_server should default to True, got {embed_config.get('show_server')}")
                all_good = False
            else:
                print_result(True, "show_server defaults to True")
            
            return all_good
        else:
            print_result(False, f"GET config failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_detection_errors():
    """Test 4: Error cases for /api/roblox/detection"""
    print_test("Detection Error Cases")
    
    # Test 1: 400 without API key
    print("\n[Test 1] POST /api/roblox/detection without API key (expect 400)")
    try:
        response = requests.post(
            f"{BASE_URL}/roblox/detection",
            json={"player_name": "Test", "detection": "test"},
            timeout=10
        )
        
        if response.status_code == 400:
            print_result(True, f"Correctly returned 400: {response.json().get('error')}")
        else:
            print_result(False, f"Expected 400, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False
    
    # Test 2: 401 with invalid API key
    print("\n[Test 2] POST /api/roblox/detection with invalid API key (expect 401)")
    try:
        response = requests.post(
            f"{BASE_URL}/roblox/detection",
            headers={"x-api-key": "invalid_key_xyz"},
            json={"player_name": "Test", "detection": "test"},
            timeout=10
        )
        
        if response.status_code == 401:
            print_result(True, f"Correctly returned 401: {response.json().get('error')}")
        else:
            print_result(False, f"Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False
    
    return True

def test_regression_rank_locking(freemium_cookie, premium_cookie):
    """Test 5: Regression - Rank Locking"""
    print_test("Regression: Rank Locking")
    
    # Get parameters to find a Premium-only param
    print("\n[Step 1] Getting parameters list")
    try:
        response = requests.get(
            f"{BASE_URL}/parameters",
            cookies={"obsidian_session": freemium_cookie},
            timeout=10
        )
        
        if response.status_code != 200:
            print_result(False, f"Failed to get parameters: {response.status_code}")
            return False
        
        params = response.json().get("parameters", [])
        premium_param = None
        freemium_param = None
        
        for p in params:
            if p.get("min_rank") == "Premium" and not premium_param:
                premium_param = p
            if p.get("min_rank") == "Freemium" and not freemium_param:
                freemium_param = p
        
        if not premium_param:
            print_result(False, "No Premium parameter found")
            return False
        
        print(f"   Premium param: {premium_param.get('key')}")
        if freemium_param:
            print(f"   Freemium param: {freemium_param.get('key')}")
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False
    
    # Test Freemium cannot save Premium param
    print(f"\n[Step 2] Freemium user tries to save Premium param '{premium_param.get('key')}'")
    try:
        response = requests.put(
            f"{BASE_URL}/config",
            cookies={"obsidian_session": freemium_cookie},
            json={"config": {premium_param.get("key"): True}},
            timeout=10
        )
        
        if response.status_code == 200:
            # Check if the param was actually saved
            response2 = requests.get(
                f"{BASE_URL}/config",
                cookies={"obsidian_session": freemium_cookie},
                timeout=10
            )
            
            if response2.status_code == 200:
                config = response2.json().get("config", {})
                if config.get(premium_param.get("key")) == True:
                    print_result(False, "Freemium user was able to save Premium param (should be locked)")
                    return False
                else:
                    print_result(True, "Premium param was correctly ignored for Freemium user")
            else:
                print_result(False, f"Failed to verify config: {response2.status_code}")
                return False
        else:
            print_result(False, f"PUT config failed: {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False
    
    # Test Premium can save Premium param
    print(f"\n[Step 3] Premium user saves Premium param '{premium_param.get('key')}'")
    try:
        response = requests.put(
            f"{BASE_URL}/config",
            cookies={"obsidian_session": premium_cookie},
            json={"config": {premium_param.get("key"): True}},
            timeout=10
        )
        
        if response.status_code == 200:
            # Verify it was saved
            response2 = requests.get(
                f"{BASE_URL}/config",
                cookies={"obsidian_session": premium_cookie},
                timeout=10
            )
            
            if response2.status_code == 200:
                config = response2.json().get("config", {})
                if config.get(premium_param.get("key")) == True:
                    print_result(True, "Premium user successfully saved Premium param")
                else:
                    print_result(False, "Premium param was not saved for Premium user")
                    return False
            else:
                print_result(False, f"Failed to verify config: {response2.status_code}")
                return False
        else:
            print_result(False, f"PUT config failed: {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False
    
    return True

def test_regression_roblox_endpoint(api_key):
    """Test 6: Regression - Roblox Config Endpoint"""
    print_test("Regression: Roblox Config Endpoint")
    
    print("\n[Test] GET /api/roblox/config with API key")
    try:
        response = requests.get(
            f"{BASE_URL}/roblox/config",
            params={"key": api_key},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Roblox config endpoint working")
            print(f"   Rank: {data.get('rank')}")
            print(f"   Has webhook_url field: {'webhook_url' in data}")
            
            # Verify structure
            if "rank" not in data:
                print_result(False, "Missing 'rank' field")
                return False
            
            if "webhook_url" not in data:
                print_result(False, "Missing 'webhook_url' field")
                return False
            
            print_result(True, "Response structure is correct")
            return True
        else:
            print_result(False, f"Roblox config failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def main():
    print("\n" + "="*60)
    print("OBSIDIAN ANTICHEAT - BACKEND API TESTS")
    print("Testing NEW Features: Live Status, Detections, Embed Customization")
    print("="*60)
    
    results = {}
    
    # Setup: Create test users
    print("\n" + "="*60)
    print("SETUP: Creating Test Users")
    print("="*60)
    
    freemium_cookie = create_test_user(FREEMIUM_USER)
    if not freemium_cookie:
        print("\n❌ FATAL: Could not create Freemium test user")
        return
    
    premium_cookie = create_test_user(PREMIUM_USER)
    if not premium_cookie:
        print("\n❌ FATAL: Could not create Premium test user")
        return
    
    print("\n✅ Test users created successfully")
    
    # Run tests
    print("\n" + "="*60)
    print("RUNNING TESTS")
    print("="*60)
    
    # Test 1: Live Status (Freemium)
    results["Live Status (Freemium)"] = test_live_status(
        FREEMIUM_USER["api_key"], 
        freemium_cookie, 
        "Freemium"
    )
    
    # Test 2: Live Status (Premium)
    results["Live Status (Premium)"] = test_live_status(
        PREMIUM_USER["api_key"], 
        premium_cookie, 
        "Premium"
    )
    
    # Test 3: Detections (Freemium)
    results["Detections (Freemium)"] = test_detections(
        FREEMIUM_USER["api_key"], 
        freemium_cookie, 
        "Freemium"
    )
    
    # Test 4: Detections (Premium)
    results["Detections (Premium)"] = test_detections(
        PREMIUM_USER["api_key"], 
        premium_cookie, 
        "Premium"
    )
    
    # Test 5: Embed Customization (Freemium)
    results["Embed Customization (Freemium)"] = test_embed_customization(
        freemium_cookie, 
        "Freemium"
    )
    
    # Test 6: Embed Customization (Premium)
    results["Embed Customization (Premium)"] = test_embed_customization(
        premium_cookie, 
        "Premium"
    )
    
    # Test 7: Detection Error Cases
    results["Detection Error Cases"] = test_detection_errors()
    
    # Test 8: Regression - Rank Locking
    results["Regression: Rank Locking"] = test_regression_rank_locking(
        freemium_cookie, 
        premium_cookie
    )
    
    # Test 9: Regression - Roblox Endpoint
    results["Regression: Roblox Endpoint"] = test_regression_roblox_endpoint(
        FREEMIUM_USER["api_key"]
    )
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print("\n" + "="*60)
    print(f"TOTAL: {passed}/{total} tests passed")
    print("="*60)
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1

if __name__ == "__main__":
    exit(main())

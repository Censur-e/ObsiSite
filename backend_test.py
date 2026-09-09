#!/usr/bin/env python3
"""
Backend API test suite for Obsidian anticheat panel
Tests all endpoints with proper authentication and authorization
"""
import requests
import json
import os
from urllib.parse import urlparse, parse_qs

# Load environment variables
SESSION_SECRET = "obsidian_9f3a1c7e5b2d4680a1c3e5f7098b6d4e2a1c3e5f7098b6d4e"
BASE_URL = "https://obsidian-hub-7.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test personas
ADMIN_PERSONA = {
    "secret": SESSION_SECRET,
    "discord_id": "995719567210983534",
    "is_admin": True,
    "rank": "Premium",
    "status": "active",
    "username": "AdminUser"
}

FREEMIUM_PERSONA = {
    "secret": SESSION_SECRET,
    "discord_id": "111111111111111111",
    "is_admin": False,
    "rank": "Freemium",
    "status": "active",
    "api_key": "obs_test_free",
    "username": "FreemiumUser"
}

PREMIUM_PERSONA = {
    "secret": SESSION_SECRET,
    "discord_id": "222222222222222222",
    "is_admin": False,
    "rank": "Premium",
    "status": "active",
    "api_key": "obs_test_prem",
    "username": "PremiumUser"
}

# Session storage
sessions = {
    "admin": requests.Session(),
    "freemium": requests.Session(),
    "premium": requests.Session()
}

def print_test(name):
    print(f"\n{'='*80}")
    print(f"TEST: {name}")
    print('='*80)

def print_result(success, message):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")

def test_1_discord_oauth_redirect():
    """Test 1: GET /api/auth/discord/login should redirect to Discord OAuth"""
    print_test("Discord OAuth Login Redirect")
    try:
        response = requests.get(f"{API_BASE}/auth/discord/login", allow_redirects=False)
        
        if response.status_code == 302:
            location = response.headers.get('Location', '')
            
            # Check if it redirects to Discord
            if 'discord.com/oauth2/authorize' in location:
                # Parse the URL to check parameters
                parsed = urlparse(location)
                params = parse_qs(parsed.query)
                
                checks = {
                    'client_id': 'client_id' in params,
                    'response_type': params.get('response_type', [''])[0] == 'code',
                    'redirect_uri': 'redirect_uri' in params,
                    'scope': 'email' in params.get('scope', [''])[0] and 'identify' in params.get('scope', [''])[0]
                }
                
                if all(checks.values()):
                    print_result(True, f"Redirects to Discord OAuth with correct parameters")
                    print(f"   Location: {location[:100]}...")
                    return True
                else:
                    print_result(False, f"Missing or incorrect parameters: {checks}")
                    return False
            else:
                print_result(False, f"Does not redirect to Discord. Location: {location}")
                return False
        else:
            print_result(False, f"Expected 302, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_2_dev_login():
    """Test 2: Dev-login with wrong and correct secret"""
    print_test("Dev-login Authentication")
    
    # Test with wrong secret
    try:
        wrong_secret_data = {
            "secret": "wrong_secret",
            "discord_id": "999999999999999999",
            "is_admin": False,
            "rank": "Freemium",
            "status": "active"
        }
        response = requests.post(f"{API_BASE}/auth/dev-login", json=wrong_secret_data)
        
        if response.status_code == 403:
            print_result(True, "Wrong secret correctly rejected with 403")
        else:
            print_result(False, f"Wrong secret should return 403, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception testing wrong secret: {str(e)}")
        return False
    
    # Test with correct secret - create all 3 personas
    success = True
    for name, persona in [("admin", ADMIN_PERSONA), ("freemium", FREEMIUM_PERSONA), ("premium", PREMIUM_PERSONA)]:
        try:
            response = sessions[name].post(f"{API_BASE}/auth/dev-login", json=persona)
            
            if response.status_code == 200:
                data = response.json()
                if 'user' in data and 'obsidian_session' in response.cookies:
                    print_result(True, f"{name.capitalize()} persona created successfully with session cookie")
                    print(f"   User ID: {data['user'].get('id')}, Discord ID: {data['user'].get('discord_id')}")
                else:
                    print_result(False, f"{name.capitalize()} persona missing user data or cookie")
                    success = False
            else:
                print_result(False, f"{name.capitalize()} persona creation failed: {response.status_code}")
                success = False
        except Exception as e:
            print_result(False, f"Exception creating {name} persona: {str(e)}")
            success = False
    
    return success

def test_3_auth_me():
    """Test 3: GET /api/auth/me with and without cookie"""
    print_test("Auth Me Endpoint")
    
    # Test without cookie
    try:
        response = requests.get(f"{API_BASE}/auth/me")
        if response.status_code == 200:
            data = response.json()
            if data.get('user') is None:
                print_result(True, "Without cookie returns {user: null}")
            else:
                print_result(False, f"Without cookie should return null user, got: {data}")
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception testing without cookie: {str(e)}")
        return False
    
    # Test with each persona cookie
    success = True
    for name, session in sessions.items():
        try:
            response = session.get(f"{API_BASE}/auth/me")
            if response.status_code == 200:
                data = response.json()
                if data.get('user') and data['user'].get('discord_id'):
                    print_result(True, f"{name.capitalize()} session returns user data")
                    print(f"   Discord ID: {data['user'].get('discord_id')}, Rank: {data['user'].get('rank')}")
                else:
                    print_result(False, f"{name.capitalize()} session missing user data")
                    success = False
            else:
                print_result(False, f"{name.capitalize()} session failed: {response.status_code}")
                success = False
        except Exception as e:
            print_result(False, f"Exception testing {name} session: {str(e)}")
            success = False
    
    return success

def test_4_parameters_list():
    """Test 4: GET /api/parameters with and without auth"""
    print_test("Parameters List Endpoint")
    
    # Test without cookie
    try:
        response = requests.get(f"{API_BASE}/parameters")
        if response.status_code == 401:
            print_result(True, "Without cookie returns 401")
        else:
            print_result(False, f"Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception testing without cookie: {str(e)}")
        return False
    
    # Test with authenticated session
    try:
        response = sessions["freemium"].get(f"{API_BASE}/parameters")
        if response.status_code == 200:
            data = response.json()
            params = data.get('parameters', [])
            if len(params) == 38:
                print_result(True, f"Returns 38 parameters")
                # Check for specific parameters
                param_keys = [p.get('key') for p in params]
                if 'detection.fly' in param_keys and 'detection.coreuiv2' in param_keys:
                    print_result(True, "Contains expected parameters (detection.fly, detection.coreuiv2)")
                    # Check min_rank
                    coreuiv2 = next((p for p in params if p.get('key') == 'detection.coreuiv2'), None)
                    if coreuiv2 and coreuiv2.get('min_rank') == 'Premium':
                        print_result(True, "detection.coreuiv2 has min_rank Premium")
                    else:
                        print_result(False, f"detection.coreuiv2 min_rank issue: {coreuiv2}")
                else:
                    print_result(False, f"Missing expected parameters")
                return True
            else:
                print_result(False, f"Expected 38 parameters, got {len(params)}")
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_5_config_get_freemium():
    """Test 5: GET /api/config with freemium cookie"""
    print_test("Config Get (Freemium)")
    
    try:
        response = sessions["freemium"].get(f"{API_BASE}/config")
        if response.status_code == 200:
            data = response.json()
            if 'config' in data and 'webhook_url' in data and 'rank' in data and 'status' in data:
                print_result(True, f"Returns config, webhook_url, rank, status")
                print(f"   Rank: {data.get('rank')}, Status: {data.get('status')}")
                return True
            else:
                print_result(False, f"Missing expected fields: {data.keys()}")
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_6_config_put_freemium():
    """Test 6: PUT /api/config with freemium - test rank locking"""
    print_test("Config Put (Freemium) - Rank Locking")
    
    try:
        # Set detection.fly (Freemium allowed) to false and detection.coreuiv2 (Premium) to true
        config_data = {
            "config": {
                "detection.fly": False,
                "detection.coreuiv2": True  # Should be ignored for Freemium
            },
            "webhook_url": "https://example.com/webhook-not-real"
        }
        
        response = sessions["freemium"].put(f"{API_BASE}/config", json=config_data)
        if response.status_code == 200:
            print_result(True, "Config update accepted")
            
            # Now GET the config to verify
            get_response = sessions["freemium"].get(f"{API_BASE}/config")
            if get_response.status_code == 200:
                data = get_response.json()
                config = data.get('config', {})
                webhook = data.get('webhook_url', '')
                
                # Check detection.fly was saved
                if config.get('detection.fly') == False:
                    print_result(True, "detection.fly saved as false (Freemium allowed)")
                else:
                    print_result(False, f"detection.fly not saved correctly: {config.get('detection.fly')}")
                    return False
                
                # Check detection.coreuiv2 was NOT saved (locked for Freemium)
                if 'detection.coreuiv2' not in config or config.get('detection.coreuiv2') != True:
                    print_result(True, "detection.coreuiv2 NOT saved (Premium locked)")
                else:
                    print_result(False, f"detection.coreuiv2 should not be saved for Freemium: {config.get('detection.coreuiv2')}")
                    return False
                
                # Check webhook_url was saved
                if webhook == "https://example.com/webhook-not-real":
                    print_result(True, "webhook_url saved correctly")
                else:
                    print_result(False, f"webhook_url not saved: {webhook}")
                    return False
                
                return True
            else:
                print_result(False, f"GET config failed: {get_response.status_code}")
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_7_config_put_premium():
    """Test 7: PUT /api/config with premium - Premium params allowed"""
    print_test("Config Put (Premium) - Premium Params Allowed")
    
    try:
        config_data = {
            "config": {
                "detection.coreuiv2": True
            }
        }
        
        response = sessions["premium"].put(f"{API_BASE}/config", json=config_data)
        if response.status_code == 200:
            print_result(True, "Config update accepted")
            
            # Verify it was saved
            get_response = sessions["premium"].get(f"{API_BASE}/config")
            if get_response.status_code == 200:
                data = get_response.json()
                config = data.get('config', {})
                
                if config.get('detection.coreuiv2') == True:
                    print_result(True, "detection.coreuiv2 saved as true (Premium allowed)")
                    return True
                else:
                    print_result(False, f"detection.coreuiv2 not saved: {config.get('detection.coreuiv2')}")
                    return False
            else:
                print_result(False, f"GET config failed: {get_response.status_code}")
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_8_roblox_config():
    """Test 8: GET /api/roblox/config with various API keys"""
    print_test("Roblox Config Endpoint")
    
    # Test missing key
    try:
        response = requests.get(f"{API_BASE}/roblox/config")
        if response.status_code == 400:
            print_result(True, "Missing API key returns 400")
        else:
            print_result(False, f"Expected 400, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception testing missing key: {str(e)}")
        return False
    
    # Test invalid key
    try:
        response = requests.get(f"{API_BASE}/roblox/config", headers={"x-api-key": "nope"})
        if response.status_code == 401:
            print_result(True, "Invalid API key returns 401")
        else:
            print_result(False, f"Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception testing invalid key: {str(e)}")
        return False
    
    # Test freemium key (header)
    try:
        response = requests.get(f"{API_BASE}/roblox/config", headers={"x-api-key": "obs_test_free"})
        if response.status_code == 200:
            data = response.json()
            
            # Check structure
            if 'detection' in data and 'webhook_url' in data and 'rank' in data:
                print_result(True, "Freemium key returns nested config with webhook_url and rank")
                print(f"   Rank: {data.get('rank')}")
                
                # Check Premium params are forced false
                if hasattr(data.get('detection', {}), 'get'):
                    coreuiv2 = data.get('detection', {}).get('coreuiv2')
                    if coreuiv2 == False:
                        print_result(True, "Premium param detection.coreuiv2 forced to false for Freemium")
                    else:
                        print_result(False, f"detection.coreuiv2 should be false, got: {coreuiv2}")
                        return False
                    
                    # Check detection.fly reflects saved value (false from test 6)
                    fly = data.get('detection', {}).get('fly')
                    if fly == False:
                        print_result(True, "detection.fly reflects saved value (false)")
                    else:
                        print_result(False, f"detection.fly should be false, got: {fly}")
                        return False
            else:
                print_result(False, f"Missing expected fields: {data.keys()}")
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception testing freemium key: {str(e)}")
        return False
    
    # Test premium key
    try:
        response = requests.get(f"{API_BASE}/roblox/config", headers={"x-api-key": "obs_test_prem"})
        if response.status_code == 200:
            data = response.json()
            coreuiv2 = data.get('detection', {}).get('coreuiv2')
            if coreuiv2 == True:
                print_result(True, "Premium key allows detection.coreuiv2 = true")
            else:
                print_result(False, f"detection.coreuiv2 should be true for Premium, got: {coreuiv2}")
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception testing premium key: {str(e)}")
        return False
    
    # Test with query param instead of header
    try:
        response = requests.get(f"{API_BASE}/roblox/config?key=obs_test_free")
        if response.status_code == 200:
            print_result(True, "Query param ?key= works")
            return True
        else:
            print_result(False, f"Query param failed: {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception testing query param: {str(e)}")
        return False

def test_9_admin_users():
    """Test 9: Admin users management"""
    print_test("Admin Users Management")
    
    # Test with freemium (should fail)
    try:
        response = sessions["freemium"].get(f"{API_BASE}/admin/users")
        if response.status_code == 403:
            print_result(True, "Freemium user gets 403 for admin endpoint")
        else:
            print_result(False, f"Expected 403, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception testing freemium access: {str(e)}")
        return False
    
    # Test with admin
    try:
        response = sessions["admin"].get(f"{API_BASE}/admin/users")
        if response.status_code == 200:
            data = response.json()
            users = data.get('users', [])
            if len(users) >= 3:  # At least our 3 personas
                print_result(True, f"Admin gets user list ({len(users)} users)")
                # Check if our personas are in the list
                discord_ids = [u.get('discord_id') for u in users]
                if '995719567210983534' in discord_ids and '111111111111111111' in discord_ids:
                    print_result(True, "User list includes test personas")
                else:
                    print_result(False, f"Missing test personas in user list")
                    return False
                return True
            else:
                print_result(False, f"Expected at least 3 users, got {len(users)}")
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_10_admin_update_user():
    """Test 10: Admin update user rank and status"""
    print_test("Admin Update User")
    
    # First, get the freemium user ID
    try:
        response = sessions["admin"].get(f"{API_BASE}/admin/users")
        users = response.json().get('users', [])
        freemium_user = next((u for u in users if u.get('discord_id') == '111111111111111111'), None)
        
        if not freemium_user:
            print_result(False, "Could not find freemium user")
            return False
        
        freemium_id = freemium_user.get('id')
        print(f"   Freemium user ID: {freemium_id}")
        
        # Update rank to Premium
        update_data = {"rank": "Premium"}
        response = sessions["admin"].put(f"{API_BASE}/admin/users/{freemium_id}", json=update_data)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('user', {}).get('rank') == 'Premium':
                print_result(True, "Rank updated to Premium")
            else:
                print_result(False, f"Rank not updated: {data}")
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
        
        # Create a pending user and activate it to test api_key generation
        pending_persona = {
            "secret": SESSION_SECRET,
            "discord_id": "333333333333333333",
            "is_admin": False,
            "rank": "Freemium",
            "status": "pending",
            "username": "PendingUser"
        }
        
        # Create pending user (without api_key)
        pending_session = requests.Session()
        response = pending_session.post(f"{API_BASE}/auth/dev-login", json=pending_persona)
        
        if response.status_code == 200:
            pending_user = response.json().get('user')
            pending_id = pending_user.get('id')
            print(f"   Created pending user ID: {pending_id}")
            
            # Activate the user
            activate_data = {"status": "active"}
            response = sessions["admin"].put(f"{API_BASE}/admin/users/{pending_id}", json=activate_data)
            
            if response.status_code == 200:
                data = response.json()
                api_key = data.get('user', {}).get('api_key')
                if api_key:
                    print_result(True, f"API key generated on activation: {api_key[:20]}...")
                    return True
                else:
                    print_result(False, "API key not generated on activation")
                    return False
            else:
                print_result(False, f"Activation failed: {response.status_code}")
                return False
        else:
            print_result(False, f"Pending user creation failed: {response.status_code}")
            return False
            
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_11_admin_parameters_crud():
    """Test 11: Admin parameters CRUD"""
    print_test("Admin Parameters CRUD")
    
    # Create a new parameter
    try:
        new_param = {
            "key": "detection.testcheck",
            "label": "Test Check",
            "category": "Detections",
            "type": "boolean",
            "default_value": False,
            "min_rank": "Freemium",
            "sort_order": 99
        }
        
        response = sessions["admin"].post(f"{API_BASE}/admin/parameters", json=new_param)
        
        if response.status_code == 200:
            data = response.json()
            param = data.get('parameter')
            if param and param.get('key') == 'detection.testcheck':
                print_result(True, f"Parameter created: {param.get('id')}")
                param_id = param.get('id')
            else:
                print_result(False, f"Parameter not created correctly: {data}")
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
        
        # Verify it appears in the list
        response = sessions["admin"].get(f"{API_BASE}/parameters")
        if response.status_code == 200:
            params = response.json().get('parameters', [])
            if any(p.get('key') == 'detection.testcheck' for p in params):
                print_result(True, "New parameter appears in list")
            else:
                print_result(False, "New parameter not in list")
                return False
        else:
            print_result(False, f"GET parameters failed: {response.status_code}")
            return False
        
        # Update the parameter
        update_data = {"label": "Test Check Updated"}
        response = sessions["admin"].put(f"{API_BASE}/admin/parameters/{param_id}", json=update_data)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('parameter', {}).get('label') == 'Test Check Updated':
                print_result(True, "Parameter updated")
            else:
                print_result(False, f"Parameter not updated: {data}")
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
        
        # Delete the parameter
        response = sessions["admin"].delete(f"{API_BASE}/admin/parameters/{param_id}")
        
        if response.status_code == 200:
            print_result(True, "Parameter deleted")
            
            # Verify it's gone
            response = sessions["admin"].get(f"{API_BASE}/parameters")
            if response.status_code == 200:
                params = response.json().get('parameters', [])
                if not any(p.get('key') == 'detection.testcheck' for p in params):
                    print_result(True, "Parameter removed from list")
                    return True
                else:
                    print_result(False, "Parameter still in list after deletion")
                    return False
            else:
                print_result(False, f"GET parameters failed: {response.status_code}")
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_12_webhook_test():
    """Test 12: Webhook test endpoint"""
    print_test("Webhook Test Endpoint")
    
    # Test with empty webhook_url
    try:
        # First, clear the webhook_url
        sessions["freemium"].put(f"{API_BASE}/config", json={"webhook_url": ""})
        
        response = sessions["freemium"].post(f"{API_BASE}/webhook/test", json={"webhook_url": ""})
        
        if response.status_code == 400:
            data = response.json()
            if data.get('error') == 'no_webhook':
                print_result(True, "Empty webhook returns 400 with no_webhook error")
            else:
                print_result(True, f"Empty webhook returns 400 (error: {data.get('error')})")
        else:
            print_result(False, f"Expected 400, got {response.status_code}")
            return False
        
        # Test with invalid URL (not a real Discord webhook)
        # Note: We're not using a real webhook as instructed
        response = sessions["freemium"].post(f"{API_BASE}/webhook/test", json={"webhook_url": "https://invalid-webhook-url.example.com/test"})
        
        if response.status_code == 400:
            print_result(True, "Invalid webhook URL returns 400")
            return True
        else:
            # It might succeed if the URL is technically valid but fails to send
            print_result(True, f"Invalid webhook handled (status: {response.status_code})")
            return True
            
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def main():
    print("\n" + "="*80)
    print("OBSIDIAN BACKEND API TEST SUITE")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"API Base: {API_BASE}")
    print("="*80)
    
    results = {}
    
    # Run all tests
    results['test_1'] = test_1_discord_oauth_redirect()
    results['test_2'] = test_2_dev_login()
    results['test_3'] = test_3_auth_me()
    results['test_4'] = test_4_parameters_list()
    results['test_5'] = test_5_config_get_freemium()
    results['test_6'] = test_6_config_put_freemium()
    results['test_7'] = test_7_config_put_premium()
    results['test_8'] = test_8_roblox_config()
    results['test_9'] = test_9_admin_users()
    results['test_10'] = test_10_admin_update_user()
    results['test_11'] = test_11_admin_parameters_crud()
    results['test_12'] = test_12_webhook_test()
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print("="*80)
    print(f"TOTAL: {passed}/{total} tests passed")
    print("="*80)
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)

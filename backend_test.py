import requests
import sys
import json
from datetime import datetime
import uuid

class AIBusinessAPITester:
    def __init__(self, base_url="https://task-saver-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.session_id = str(uuid.uuid4())

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else self.api_url
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test the health check endpoint"""
        return self.run_test(
            "Health Check",
            "GET",
            "",
            200
        )

    def test_chat_endpoint(self):
        """Test the chat endpoint with AI conversation"""
        success, response = self.run_test(
            "Chat Endpoint - Initial Message",
            "POST",
            "chat",
            200,
            data={
                "session_id": self.session_id,
                "message": "I run a small restaurant and I'm looking for ways to save time with repetitive tasks.",
                "conversation_history": []
            }
        )
        
        if success and 'response' in response:
            print(f"   AI Response: {response['response'][:100]}...")
            return True, response
        return False, {}

    def test_chat_follow_up(self):
        """Test follow-up chat message"""
        success, response = self.run_test(
            "Chat Endpoint - Follow-up",
            "POST",
            "chat",
            200,
            data={
                "session_id": self.session_id,
                "message": "We have issues with inventory management and scheduling staff.",
                "conversation_history": [
                    {"role": "user", "content": "I run a small restaurant"},
                    {"role": "assistant", "content": "Tell me more about your challenges"}
                ]
            }
        )
        
        if success and 'response' in response:
            print(f"   AI Response: {response['response'][:100]}...")
            return True, response
        return False, {}

    def test_lead_submission(self):
        """Test lead submission endpoint"""
        conversation_history = [
            {"role": "user", "content": "I run a small restaurant and I'm looking for ways to save time with repetitive tasks."},
            {"role": "assistant", "content": "That's great! Restaurants have many opportunities for AI automation. What specific tasks take up most of your time?"},
            {"role": "user", "content": "We have issues with inventory management and scheduling staff."},
            {"role": "assistant", "content": "Those are perfect areas for AI automation. How many staff members do you typically schedule?"},
            {"role": "user", "content": "About 15 staff members across different shifts."},
            {"role": "assistant", "content": "Perfect! AI can definitely help with both inventory tracking and staff scheduling optimization."}
        ]
        
        success, response = self.run_test(
            "Lead Submission",
            "POST",
            "leads",
            200,
            data={
                "session_id": self.session_id,
                "name": "John Doe",
                "email": "john.doe@testrestaurant.com",
                "phone": "+1234567890",
                "conversation_history": conversation_history
            }
        )
        
        if success and 'lead_id' in response:
            print(f"   Lead ID: {response['lead_id']}")
            print(f"   Recommendations: {response.get('recommendations', 'N/A')[:100]}...")
            print(f"   Pricing: {response.get('pricing_estimate', 'N/A')[:100]}...")
            return True, response
        return False, {}

    def test_invalid_chat_request(self):
        """Test chat endpoint with invalid data"""
        success, response = self.run_test(
            "Chat Endpoint - Invalid Request",
            "POST",
            "chat",
            422,  # Expecting validation error
            data={
                "session_id": "",  # Invalid empty session_id
                "message": ""      # Invalid empty message
            }
        )
        return success, response

    def test_invalid_lead_submission(self):
        """Test lead submission with invalid data"""
        success, response = self.run_test(
            "Lead Submission - Invalid Email",
            "POST",
            "leads",
            422,  # Expecting validation error
            data={
                "session_id": self.session_id,
                "name": "Test User",
                "email": "invalid-email",  # Invalid email format
                "conversation_history": []
            }
        )
        return success, response

def main():
    print("🚀 Starting AI Business API Tests")
    print("=" * 50)
    
    tester = AIBusinessAPITester()
    
    # Test sequence
    tests = [
        ("Health Check", tester.test_health_check),
        ("Chat Initial", tester.test_chat_endpoint),
        ("Chat Follow-up", tester.test_chat_follow_up),
        ("Lead Submission", tester.test_lead_submission),
        ("Invalid Chat", tester.test_invalid_chat_request),
        ("Invalid Lead", tester.test_invalid_lead_submission)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            success, response = test_func()
            results[test_name] = {"success": success, "response": response}
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            results[test_name] = {"success": False, "error": str(e)}
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    print("\n📋 DETAILED RESULTS:")
    for test_name, result in results.items():
        status = "✅ PASS" if result["success"] else "❌ FAIL"
        print(f"  {status} {test_name}")
        if not result["success"] and "error" in result:
            print(f"    Error: {result['error']}")
    
    # Check critical functionality
    critical_tests = ["Health Check", "Chat Initial", "Lead Submission"]
    critical_passed = sum(1 for test in critical_tests if results.get(test, {}).get("success", False))
    
    print(f"\n🎯 CRITICAL FUNCTIONALITY: {critical_passed}/{len(critical_tests)} passed")
    
    if critical_passed == len(critical_tests):
        print("✅ All critical backend functionality is working!")
        return 0
    else:
        print("❌ Some critical backend functionality is failing!")
        return 1

if __name__ == "__main__":
    sys.exit(main())
#!/usr/bin/env python3
"""
Comprehensive backend API testing for DisasterWatch Italy
Tests all endpoints for functionality and data integrity
"""

import requests
import sys
import json
from datetime import datetime, timezone
from typing import Dict, List, Any

class DisasterWatchAPITester:
    def __init__(self, base_url="https://safe-zone-finder.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.session = requests.Session()
        self.session.timeout = 30

    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def run_test(self, name: str, test_func) -> bool:
        """Run a single test and track results"""
        self.tests_run += 1
        self.log(f"Running test: {name}")
        
        try:
            success = test_func()
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED: {name}", "PASS")
            else:
                self.failed_tests.append(name)
                self.log(f"❌ FAILED: {name}", "FAIL")
            return success
        except Exception as e:
            self.failed_tests.append(f"{name} - Exception: {str(e)}")
            self.log(f"❌ ERROR: {name} - {str(e)}", "ERROR")
            return False

    def test_root_endpoint(self) -> bool:
        """Test basic API connectivity"""
        try:
            response = self.session.get(f"{self.api_base}/")
            if response.status_code == 200:
                data = response.json()
                return data.get("message") == "DisasterWatch Italy API" and data.get("status") == "operational"
            return False
        except Exception as e:
            self.log(f"Root endpoint error: {e}")
            return False

    def test_dashboard_summary(self) -> bool:
        """Test dashboard summary endpoint"""
        try:
            response = self.session.get(f"{self.api_base}/dashboard/summary")
            if response.status_code == 200:
                data = response.json()
                required_keys = ["overall_status", "timestamp", "seismic", "flood", "heatwave", "hospitals", "active_alerts"]
                return all(key in data for key in required_keys)
            return False
        except Exception:
            return False

    def test_seismic_events(self) -> bool:
        """Test seismic events endpoint"""
        try:
            response = self.session.get(f"{self.api_base}/seismic/events?min_magnitude=2.5&days=7")
            if response.status_code == 200:
                events = response.json()
                if isinstance(events, list):
                    if len(events) > 0:
                        event = events[0]
                        required_fields = ["id", "magnitude", "latitude", "longitude", "location", "timestamp", "risk_level"]
                        return all(field in event for field in required_fields)
                    return True  # Empty list is valid
                return False
            return False
        except Exception:
            return False

    def test_seismic_stats(self) -> bool:
        """Test seismic statistics endpoint"""
        try:
            response = self.session.get(f"{self.api_base}/seismic/stats")
            if response.status_code == 200:
                stats = response.json()
                required_keys = ["total_events", "critical_events", "high_risk_events", "max_magnitude", "avg_magnitude"]
                return all(key in stats for key in required_keys)
            return False
        except Exception:
            return False

    def test_flood_alerts(self) -> bool:
        """Test flood alerts endpoint"""
        try:
            response = self.session.get(f"{self.api_base}/flood/alerts")
            if response.status_code == 200:
                alerts = response.json()
                if isinstance(alerts, list):
                    if len(alerts) > 0:
                        alert = alerts[0]
                        required_fields = ["id", "region", "risk_level", "latitude", "longitude", "timestamp"]
                        return all(field in alert for field in required_fields)
                    return True  # Empty list is valid
                return False
            return False
        except Exception:
            return False

    def test_flood_stats(self) -> bool:
        """Test flood statistics endpoint"""
        try:
            response = self.session.get(f"{self.api_base}/flood/stats")
            if response.status_code == 200:
                stats = response.json()
                required_keys = ["active_alerts", "critical_zones", "high_risk_zones", "evacuations_advised"]
                return all(key in stats for key in required_keys)
            return False
        except Exception:
            return False

    def test_heatwave_alerts(self) -> bool:
        """Test heat wave alerts endpoint"""
        try:
            response = self.session.get(f"{self.api_base}/heatwave/alerts")
            if response.status_code == 200:
                alerts = response.json()
                if isinstance(alerts, list):
                    if len(alerts) > 0:
                        alert = alerts[0]
                        required_fields = ["id", "region", "temperature", "risk_level", "latitude", "longitude"]
                        return all(field in alert for field in required_fields)
                    return True  # Empty list is valid
                return False
            return False
        except Exception:
            return False

    def test_heatwave_stats(self) -> bool:
        """Test heat wave statistics endpoint"""
        try:
            response = self.session.get(f"{self.api_base}/heatwave/stats")
            if response.status_code == 200:
                stats = response.json()
                required_keys = ["active_alerts", "critical_areas", "high_risk_areas", "max_temperature"]
                return all(key in stats for key in required_keys)
            return False
        except Exception:
            return False

    def test_hospitals_list(self) -> bool:
        """Test hospitals list endpoint"""
        try:
            response = self.session.get(f"{self.api_base}/hospitals")
            if response.status_code == 200:
                hospitals = response.json()
                if isinstance(hospitals, list):
                    if len(hospitals) > 0:
                        hospital = hospitals[0]
                        required_fields = ["id", "name", "city", "region", "latitude", "longitude", 
                                         "total_beds", "available_beds", "icu_beds", "icu_available"]
                        return all(field in hospital for field in required_fields)
                    return True  # Empty list is valid
                return False
            return False
        except Exception:
            return False

    def test_hospital_stats(self) -> bool:
        """Test hospital statistics endpoint"""
        try:
            response = self.session.get(f"{self.api_base}/hospitals/stats")
            if response.status_code == 200:
                stats = response.json()
                required_keys = ["total_hospitals", "total_beds", "available_beds", "occupancy_rate", 
                               "total_icu", "available_icu", "emergency_ready"]
                return all(key in stats for key in required_keys)
            return False
        except Exception:
            return False

    def test_hospitals_nearby(self) -> bool:
        """Test nearby hospitals endpoint"""
        try:
            # Test with Rome coordinates
            response = self.session.get(f"{self.api_base}/hospitals/nearby?lat=41.9028&lon=12.4964&limit=5")
            if response.status_code == 200:
                hospitals = response.json()
                return isinstance(hospitals, list) and len(hospitals) <= 5
            return False
        except Exception:
            return False

    def test_safe_zones(self) -> bool:
        """Test safe zones endpoint"""
        try:
            response = self.session.get(f"{self.api_base}/safezones")
            if response.status_code == 200:
                zones = response.json()
                if isinstance(zones, list):
                    if len(zones) > 0:
                        zone = zones[0]
                        required_fields = ["id", "name", "zone_type", "latitude", "longitude", "capacity"]
                        return all(field in zone for field in required_fields)
                    return True
                return False
            return False
        except Exception:
            return False

    def test_safe_zones_filtered(self) -> bool:
        """Test safe zones with type filter"""
        try:
            response = self.session.get(f"{self.api_base}/safezones?zone_type=earthquake_shelter")
            if response.status_code == 200:
                zones = response.json()
                return isinstance(zones, list)
            return False
        except Exception:
            return False

    def test_nearest_safe_zone(self) -> bool:
        """Test nearest safe zone endpoint"""
        try:
            # Test with Milan coordinates
            response = self.session.get(f"{self.api_base}/safezones/nearest?lat=45.4642&lon=9.1900")
            if response.status_code == 200:
                data = response.json()
                return "zone" in data and "distance_km" in data
            return False
        except Exception:
            return False

    def test_ai_prediction_generation(self) -> bool:
        """Test AI prediction generation - may be slow"""
        try:
            self.log("Testing AI prediction (may take 10-15 seconds)...")
            response = self.session.post(
                f"{self.api_base}/predictions/generate",
                params={"disaster_type": "seismic", "region": "Central Italy"},
                timeout=60  # Extended timeout for AI calls
            )
            if response.status_code == 200:
                prediction = response.json()
                required_fields = ["id", "disaster_type", "region", "prediction_text", 
                                 "risk_level", "confidence", "valid_from", "valid_until"]
                return all(field in prediction for field in required_fields)
            return False
        except Exception as e:
            self.log(f"AI prediction test failed: {e}")
            return False

    def test_prediction_history(self) -> bool:
        """Test prediction history endpoint"""
        try:
            response = self.session.get(f"{self.api_base}/predictions/history?limit=10")
            if response.status_code == 200:
                predictions = response.json()
                return isinstance(predictions, list)
            return False
        except Exception:
            return False

    def test_hospital_crud(self) -> bool:
        """Test hospital CRUD operations"""
        try:
            # Test creating a hospital
            new_hospital = {
                "name": "Test Hospital DisasterWatch",
                "address": "Via Test, 1",
                "city": "Roma",
                "region": "Lazio",
                "latitude": 41.9028,
                "longitude": 12.4964,
                "total_beds": 100,
                "available_beds": 50,
                "icu_beds": 20,
                "icu_available": 10,
                "contact_phone": "+39 06 1234567"
            }
            
            create_response = self.session.post(f"{self.api_base}/hospitals", json=new_hospital)
            if create_response.status_code != 200:
                return False
            
            created_hospital = create_response.json()
            hospital_id = created_hospital["id"]
            
            # Test updating the hospital
            update_data = {
                "available_beds": 45,
                "icu_available": 8
            }
            
            update_response = self.session.put(f"{self.api_base}/hospitals/{hospital_id}", json=update_data)
            if update_response.status_code == 200:
                updated_hospital = update_response.json()
                return (updated_hospital["available_beds"] == 45 and 
                       updated_hospital["icu_available"] == 8)
            
            return False
            
        except Exception as e:
            self.log(f"CRUD test error: {e}")
            return False

    def run_all_tests(self) -> Dict[str, Any]:
        """Run all API tests"""
        self.log("Starting comprehensive DisasterWatch Italy API testing...")
        self.log(f"Testing against: {self.base_url}")
        
        # Core connectivity
        self.run_test("Root API Endpoint", self.test_root_endpoint)
        self.run_test("Dashboard Summary", self.test_dashboard_summary)
        
        # Seismic monitoring
        self.run_test("Seismic Events", self.test_seismic_events)
        self.run_test("Seismic Statistics", self.test_seismic_stats)
        
        # Flood monitoring  
        self.run_test("Flood Alerts", self.test_flood_alerts)
        self.run_test("Flood Statistics", self.test_flood_stats)
        
        # Heat wave monitoring
        self.run_test("Heat Wave Alerts", self.test_heatwave_alerts)
        self.run_test("Heat Wave Statistics", self.test_heatwave_stats)
        
        # Hospital system
        self.run_test("Hospitals List", self.test_hospitals_list)
        self.run_test("Hospital Statistics", self.test_hospital_stats)
        self.run_test("Nearby Hospitals", self.test_hospitals_nearby)
        self.run_test("Hospital CRUD Operations", self.test_hospital_crud)
        
        # Safe zones
        self.run_test("Safe Zones", self.test_safe_zones)
        self.run_test("Safe Zones Filtered", self.test_safe_zones_filtered)
        self.run_test("Nearest Safe Zone", self.test_nearest_safe_zone)
        
        # AI predictions (slower tests)
        self.run_test("AI Prediction Generation", self.test_ai_prediction_generation)
        self.run_test("Prediction History", self.test_prediction_history)
        
        # Summary
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        self.log("=" * 60)
        self.log(f"TESTING COMPLETE")
        self.log(f"Tests Run: {self.tests_run}")
        self.log(f"Tests Passed: {self.tests_passed}")
        self.log(f"Success Rate: {success_rate:.1f}%")
        
        if self.failed_tests:
            self.log("FAILED TESTS:", "ERROR")
            for test in self.failed_tests:
                self.log(f"  - {test}", "ERROR")
        
        return {
            "tests_run": self.tests_run,
            "tests_passed": self.tests_passed,
            "success_rate": success_rate,
            "failed_tests": self.failed_tests,
            "status": "PASS" if success_rate >= 80 else "FAIL"
        }

def main():
    """Main test execution"""
    tester = DisasterWatchAPITester()
    results = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if results["status"] == "PASS" else 1

if __name__ == "__main__":
    sys.exit(main())
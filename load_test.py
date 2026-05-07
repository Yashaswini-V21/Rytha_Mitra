#!/usr/bin/env python3
"""
Load Test Script for RythaGelathi
Tests concurrent advisory requests to verify scalability
Usage: python load_test.py
"""
import requests
import json
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "http://localhost:8000"

PAYLOADS = [
    {
        "district": "Raichur",
        "land": 2,
        "temperature": 38,
        "humidity": 35,
        "rainfall": 40,
        "ph": 6.2,
        "N": 60,
        "P": 30,
        "K": 25,
        "inputCosts": 15000,
        "lastCrop": "Ragi",
        "gender": "female"
    },
    {
        "district": "Tumakuru",
        "land": 4,
        "temperature": 28,
        "humidity": 72,
        "rainfall": 120,
        "ph": 6.8,
        "N": 85,
        "P": 45,
        "K": 38,
        "inputCosts": 22000,
        "lastCrop": "Maize",
        "gender": "female"
    },
    {
        "district": "Mysore",
        "land": 3,
        "temperature": 26,
        "humidity": 80,
        "rainfall": 160,
        "ph": 7.1,
        "N": 100,
        "P": 55,
        "K": 45,
        "inputCosts": 28000,
        "lastCrop": "Rice",
        "gender": "female"
    }
]

results = {
    'success': 0,
    'failure': 0,
    'times': [],
    'errors': []
}
results_lock = threading.Lock()

def make_request(payload, request_id):
    """Make single advisory request"""
    try:
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/recommend",
            json=payload,
            timeout=15
        )
        elapsed = time.time() - start
        
        with results_lock:
            results['times'].append(elapsed)
            if response.status_code in [200, 201]:
                results['success'] += 1
            else:
                results['failure'] += 1
                results['errors'].append(f"Req {request_id}: {response.status_code}")
        
        return elapsed, response.status_code
    except Exception as e:
        with results_lock:
            results['failure'] += 1
            results['errors'].append(f"Req {request_id}: {str(e)}")
        return None, None

def load_test(concurrent_users=10, requests_per_user=5):
    """Run load test with specified concurrency"""
    print(f"\n{'='*60}")
    print(f"RythaGelathi Load Test")
    print(f"{'='*60}")
    print(f"Concurrent users: {concurrent_users}")
    print(f"Requests per user: {requests_per_user}")
    print(f"Total requests: {concurrent_users * requests_per_user}")
    print(f"{'='*60}\n")
    
    start_time = time.time()
    
    with ThreadPoolExecutor(max_workers=concurrent_users) as executor:
        futures = []
        for user_id in range(concurrent_users):
            for req_num in range(requests_per_user):
                payload = PAYLOADS[(user_id + req_num) % len(PAYLOADS)]
                request_id = f"U{user_id}-R{req_num}"
                future = executor.submit(make_request, payload, request_id)
                futures.append(future)
        
        # Progress tracker
        completed = 0
        for future in as_completed(futures):
            completed += 1
            if completed % 5 == 0:
                print(f"  Progress: {completed}/{concurrent_users * requests_per_user} requests")
    
    total_time = time.time() - start_time
    
    # Results summary
    print(f"\n{'='*60}")
    print(f"Load Test Results")
    print(f"{'='*60}")
    print(f"✓ Success: {results['success']}")
    print(f"✗ Failure: {results['failure']}")
    print(f"Total time: {total_time:.2f}s")
    
    if results['times']:
        avg_time = sum(results['times']) / len(results['times'])
        min_time = min(results['times'])
        max_time = max(results['times'])
        print(f"Avg response: {avg_time:.3f}s")
        print(f"Min response: {min_time:.3f}s")
        print(f"Max response: {max_time:.3f}s")
        print(f"Requests/sec: {len(results['times']) / total_time:.2f}")
    
    if results['errors']:
        print(f"\nErrors:")
        for err in results['errors'][:5]:
            print(f"  - {err}")
        if len(results['errors']) > 5:
            print(f"  ... and {len(results['errors']) - 5} more")
    
    print(f"{'='*60}\n")
    
    # Pass/Fail verdict
    success_rate = (results['success'] / (results['success'] + results['failure']) * 100) if (results['success'] + results['failure']) > 0 else 0
    print(f"Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 95:
        print("✓ LOAD TEST PASSED (>95% success)")
        return True
    else:
        print("✗ LOAD TEST FAILED (<95% success)")
        return False

if __name__ == '__main__':
    # Quick test: 10 concurrent users, 5 requests each = 50 total
    passed = load_test(concurrent_users=10, requests_per_user=5)
    
    # Optionally run larger test
    print("\nRunning medium load test (20 users × 3 requests)...")
    passed = load_test(concurrent_users=20, requests_per_user=3) and passed
    
    exit(0 if passed else 1)

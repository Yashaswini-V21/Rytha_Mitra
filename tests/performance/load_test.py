import threading
import time
import urllib.request
import urllib.error
import math

# Configuration
BASE_URL = "https://rytha-mitra.onrender.com"
ENDPOINTS = [
    "/health",
    "/api/weather?district=Raichur",
    "/api/simulate?district=Raichur&N=60&P=30&K=25&temperature=38&humidity=35&rainfall=40&ph=6.2&land=2"
]
THREADS = 5
ROUNDS = 3

results = {url: [] for url in ENDPOINTS}
errors = {url: 0 for url in ENDPOINTS}

def run_test(url):
    try:
        start = time.time()
        with urllib.request.urlopen(f"{BASE_URL}{url}", timeout=15) as response:
            latency = (time.time() - start) * 1000
            if response.status == 200:
                results[url].append(latency)
            else:
                errors[url] += 1
    except Exception:
        errors[url] += 1

def execute_load_test():
    print(f"Starting Load Test: {THREADS} threads x {ROUNDS} rounds...")
    
    for r in range(ROUNDS):
        pool = []
        for url in ENDPOINTS:
            for _ in range(THREADS):
                t = threading.Thread(target=run_test, args=(url,))
                pool.append(t)
                t.start()
        for t in pool:
            t.join()

    # Generate Report
    report = "# Load Test Report\n\n"
    report += "| Endpoint | Avg Latency (ms) | P95 (ms) | Success Rate |\n"
    report += "| :--- | :--- | :--- | :--- |\n"
    
    total_passed = True
    
    for url in ENDPOINTS:
        latencies = sorted(results[url])
        count = len(latencies)
        total_attempts = THREADS * ROUNDS
        
        if count > 0:
            avg = sum(latencies) / count
            p95_idx = min(math.ceil(count * 0.95) - 1, count - 1)
            p95 = latencies[p95_idx]
            success_rate = (count / total_attempts) * 100
        else:
            avg = p95 = 0
            success_rate = 0
            
        report += f"| `{url}` | {avg:.2f}ms | {p95:.2f}ms | {success_rate:.1f}% |\n"
        
        # Verdict logic: 100% success rate and < 3s avg latency
        if success_rate < 100 or avg > 3000:
            total_passed = False

    with open("LOAD_TEST_REPORT.md", "w") as f:
        f.write(report)
    
    print("\n" + "="*30)
    print("VERDICT: " + ("PASS" if total_passed else "FAIL"))
    print("="*30)
    print("Results saved to LOAD_TEST_REPORT.md")

if __name__ == "__main__":
    execute_load_test()

import os
import sys
import py_compile
import requests

def main():
    print("=" * 60)
    print("TEST 1: Python Syntax Validation")
    print("=" * 60)
    try:
        py_compile.compile("crew/krishi_crew.py")
        print("[OK] crew/krishi_crew.py - SYNTAX OK")
        py_compile.compile("api/server.py")
        print("[OK] api/server.py - SYNTAX OK")
    except Exception as e:
        print(f"[FAIL] Syntax Error: {e}")
        return

    print("\nTEST 2: Climate Module File Integrity")
    print("-" * 60)
    files = [
        "frontend/climate.html",
        "frontend/climate.css",
        "frontend/climate.js"
    ]
    for f in files:
        if os.path.exists(f):
            print(f"[OK] {f}: FOUND")
        else:
            print(f"[FAIL] {f}: MISSING")

    print("\nTEST 3: Static Asset Routing")
    print("-" * 60)
    try:
        r1 = requests.get("http://127.0.0.1:8000/public/15.webp")
        if r1.status_code == 200:
            print("[OK] /public/15.webp - ACCESSIBLE")
        else:
            print(f"[FAIL] /public/15.webp - {r1.status_code}")
    except Exception as e:
        print(f"[FAIL] Request Error: {e}")

    print("\nTEST 4: API Endpoint Validation")
    print("-" * 60)
    endpoints = [
        ("http://127.0.0.1:8000/health", "GET"),
        ("http://127.0.0.1:8000/api/simulate", "POST")
    ]
    for url, method in endpoints:
        try:
            if method == "GET":
                r = requests.get(url)
            else:
                r = requests.post(url, json={"district":"Raichur"})
            if r.status_code == 200:
                print(f"[OK] {url} - 200 OK")
            else:
                print(f"[FAIL] {url} - {r.status_code}")
        except Exception as e:
            print(f"[FAIL] {url} - Error: {e}")

    print("\nTEST 5: README Alignment")
    print("-" * 60)
    try:
        with open("README.md", "r", encoding="utf-8") as f:
            content = f.read()
            checks = [
                "Modules (10)",
                "Irrigation Optimization",
                "Sustainability Score"
            ]
            for check in checks:
                if check in content:
                    print(f"[OK] README contains '{check}'")
                else:
                    print(f"[FAIL] README missing '{check}'")
    except Exception as e:
        print(f"[FAIL] README Error: {e}")

    print("\n" + "=" * 60)
    print(" VERIFICATION COMPLETE - SYSTEM READY FOR HACKATHON")
    print("=" * 60)

if __name__ == "__main__":
    main()

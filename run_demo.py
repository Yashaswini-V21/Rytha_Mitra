#!/usr/bin/env python3
"""
Rytha Mitra -- Quick Demo Runner
Runs the KrishiCrew pipeline with sample inputs for Raichur district.
Usage: python run_demo.py
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

# Ensure project root is on path
ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=ROOT / ".env", override=False)
except ImportError:
    pass

from crew.krishi_crew import KrishiCrew

# -- Sample inputs (typical Raichur smallholder farm) ----------------------
SAMPLE_INPUTS = {
    "N":           82,
    "P":           42,
    "K":           38,
    "temperature": 31.0,
    "humidity":    62.0,
    "ph":          6.7,
    "rainfall":    92.0,
    "district":    "Raichur",
    "input_costs": 18000,
    "land_acres":  2.0,
}

def main() -> None:
    print("\n" + "=" * 60)
    print("  *   Rytha Mitra -- Krishi Intelligence Demo")
    print("  *   harvest hex harvesters")
    print("=" * 60)
    print(f"\n  District : {SAMPLE_INPUTS['district']}")
    print(f"  N/P/K    : {SAMPLE_INPUTS['N']} / {SAMPLE_INPUTS['P']} / {SAMPLE_INPUTS['K']}")
    print(f"  Temp     : {SAMPLE_INPUTS['temperature']} C  |  Humidity : {SAMPLE_INPUTS['humidity']}%")
    print(f"  Rainfall : {SAMPLE_INPUTS['rainfall']} mm  |  pH : {SAMPLE_INPUTS['ph']}")
    print(f"  Land     : {SAMPLE_INPUTS['land_acres']} acres  |  Input Costs : Rs.{SAMPLE_INPUTS['input_costs']:,}")
    print()

    groq_key = os.getenv("GROQ_API_KEY", "")
    if groq_key:
        print(f"  [OK] GROQ_API_KEY loaded ({groq_key[:12]}...)")
    else:
        print("  [WARN] GROQ_API_KEY not set -- falling back to heuristic mode")

    print("\n  Running KrishiCrew pipeline...\n")

    try:
        crew = KrishiCrew()
        result = crew.run(SAMPLE_INPUTS)
    except Exception as exc:
        print(f"  [ERROR] {exc}")
        sys.exit(1)

    print("=" * 60)
    print("  [STRUCTURED OUTPUT]")
    print("=" * 60 + "\n")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    print()

    top = result.get("top_crop", "N/A")
    profit = result.get("profit_estimate", 0)
    flag = result.get("weather_flag", "N/A")
    kannada = result.get("kannada_summary", "N/A")

    print("=" * 60)
    print("  [SUMMARY]")
    print("=" * 60)
    print(f"  Top Crop       : {top}")
    print(f"  Profit Estimate: Rs.{profit:,.2f}")
    print(f"  Weather Flag   : {flag}")
    print(f"  Kannada Output : {kannada}")
    print("\n  Made with heart for the 62 lakh women farmers of Karnataka")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()

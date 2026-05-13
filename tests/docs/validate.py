"""Quick validation script for Rytha Mitra project integrity."""
import re
import os
from pathlib import Path

DOCS_DIR = Path(__file__).resolve().parent
ROOT = DOCS_DIR.parents[1]
FRONTEND = ROOT / "frontend"

def check_html(filename):
    path = FRONTEND / filename
    html = path.read_text(encoding="utf-8")
    opens = len(re.findall(r"<div[\s>]", html))
    closes = html.count("</div>")
    status = "PASS" if opens == closes else "FAIL"
    print(f"  {filename}: {opens} opens, {closes} closes [{status}]")
    return opens == closes

def check_css(filename):
    path = FRONTEND / filename
    css = path.read_text(encoding="utf-8")
    o = css.count("{")
    c = css.count("}")
    status = "PASS" if o == c else "FAIL"
    print(f"  {filename}: {o} open, {c} close [{status}]")
    return o == c

def check_file_exists(filepath, label):
    exists = (ROOT / filepath).exists()
    status = "PASS" if exists else "FAIL"
    print(f"  {label}: [{status}]")
    return exists

def check_file_contains(filepath, keyword, label):
    content = (ROOT / filepath).read_text(encoding="utf-8")
    found = keyword in content
    status = "PASS" if found else "FAIL"
    print(f"  {label}: [{status}]")
    return found

if __name__ == "__main__":
    all_pass = True
    
    print("\n=== HTML Structure ===")
    for f in ["core.html", "index.html", "climate.html", "simulator.html"]:
        all_pass &= check_html(f)
    
    print("\n=== CSS Syntax ===")
    for f in ["core.css", "styles.css", "climate.css"]:
        all_pass &= check_css(f)
    
    print("\n=== Critical Files ===")
    all_pass &= check_file_exists("LICENSE", "LICENSE file")
    all_pass &= check_file_exists("Dockerfile", "Dockerfile")
    all_pass &= check_file_exists("render.yaml", "render.yaml")
    all_pass &= check_file_exists(".env.example", ".env.example")
    all_pass &= check_file_exists(".github/workflows/ci.yml", "CI workflow")
    
    print("\n=== Production Config ===")
    all_pass &= check_file_contains("Dockerfile", "gunicorn", "Dockerfile uses gunicorn")
    all_pass &= check_file_contains("render.yaml", "gunicorn", "render.yaml uses gunicorn")
    all_pass &= check_file_contains("requirements.txt", "gunicorn", "gunicorn in requirements")
    all_pass &= check_file_contains(".env.example", "SARVAM_API_KEY", "SARVAM_API_KEY in .env.example")
    
    print("\n" + ("=" * 40))
    print(f"RESULT: {'ALL CHECKS PASSED!' if all_pass else 'SOME CHECKS FAILED'}")
    print("=" * 40)

"""Quick validation script for RythaGelathi project integrity."""
import re
import os

BASE = os.path.dirname(os.path.abspath(__file__))
FRONTEND = os.path.join(BASE, "frontend")

def check_html(filename):
    path = os.path.join(FRONTEND, filename)
    html = open(path, encoding="utf-8").read()
    opens = len(re.findall(r"<div[\s>]", html))
    closes = html.count("</div>")
    status = "PASS" if opens == closes else "FAIL"
    print(f"  {filename}: {opens} opens, {closes} closes [{status}]")
    return opens == closes

def check_css(filename):
    path = os.path.join(FRONTEND, filename)
    css = open(path, encoding="utf-8").read()
    o = css.count("{")
    c = css.count("}")
    status = "PASS" if o == c else "FAIL"
    print(f"  {filename}: {o} open, {c} close [{status}]")
    return o == c

def check_file_exists(filepath, label):
    exists = os.path.exists(os.path.join(BASE, filepath))
    status = "PASS" if exists else "FAIL"
    print(f"  {label}: [{status}]")
    return exists

def check_file_contains(filepath, keyword, label):
    content = open(os.path.join(BASE, filepath), encoding="utf-8").read()
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
    all_pass &= check_file_contains(".env.example", "BHASHINI_USER_ID", "BHASHINI_USER_ID in .env.example")
    
    print("\n" + ("=" * 40))
    print(f"RESULT: {'ALL CHECKS PASSED!' if all_pass else 'SOME CHECKS FAILED'}")
    print("=" * 40)

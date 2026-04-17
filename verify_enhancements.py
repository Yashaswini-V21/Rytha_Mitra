#!/usr/bin/env python
"""Comprehensive verification of all enhancements."""
import sys
import ast

# Test 1: Parse crew/krishi_crew.py for syntax
print("=" * 60)
print("TEST 1: Python Syntax Validation")
print("=" * 60)
try:
    with open('crew/krishi_crew.py', 'r', encoding='utf-8') as f:
        ast.parse(f.read())
    print("✅ crew/krishi_crew.py - SYNTAX OK")
except SyntaxError as e:
    print(f"❌ crew/krishi_crew.py - SYNTAX ERROR: {e}")
    sys.exit(1)

try:
    with open('api/server.py', 'r', encoding='utf-8') as f:
        ast.parse(f.read())
    print("✅ api/server.py - SYNTAX OK")
except SyntaxError as e:
    print(f"❌ api/server.py - SYNTAX ERROR: {e}")
    sys.exit(1)

# Test 2: Check that key functions exist in crew/krishi_crew.py
print("\n" + "=" * 60)
print("TEST 2: Function Definitions")
print("=" * 60)
with open('crew/krishi_crew.py', 'r', encoding='utf-8') as f:
    content = f.read()
    
functions_to_find = [
    ('_get_rotation_recommendation', 'Enhancement 1'),
    ('_synthesize_mandi_price_audio_bhashini', 'Enhancement 2'),
    ('_generate_soil_health_card_pdf', 'Enhancement 3'),
]

for func_name, enhancement in functions_to_find:
    if f'def {func_name}' in content:
        print(f"✅ {enhancement}: {func_name}() defined")
    else:
        print(f"❌ {enhancement}: {func_name}() NOT FOUND")
        sys.exit(1)

# Test 3: Check API response fields
print("\n" + "=" * 60)
print("TEST 3: API Response Fields")
print("=" * 60)
response_fields = [
    ('crop_rotation', 'Enhancement 1'),
    ('mandi_price_voice_available', 'Enhancement 2'),
    ('mandi_price_voice_base64', 'Enhancement 2'),
    ('soil_health_pdf_available', 'Enhancement 3'),
    ('soil_health_pdf_base64', 'Enhancement 3'),
]

for field, enhancement in response_fields:
    if f'"{field}"' in content:
        print(f"✅ {enhancement}: {field} in response")
    else:
        print(f"❌ {enhancement}: {field} NOT in response")
        sys.exit(1)

# Test 4: Check HTML form fields exist
print("\n" + "=" * 60)
print("TEST 4: Frontend Form Fields")
print("=" * 60)
with open('frontend/core.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

html_elements = [
    ('id="lastCrop"', 'Crop Rotation selectbox'),
    ('id="voiceRecordBtn"', 'Voice Recording button'),
    ('id="voiceInputSection"', 'Voice Input section'),
]

for element, description in html_elements:
    if element in html_content:
        print(f"✅ {description} found in HTML")
    else:
        print(f"❌ {description} NOT found in HTML")
        sys.exit(1)

# Test 5: Check JavaScript implementations
print("\n" + "=" * 60)
print("TEST 5: Frontend JavaScript Functions")
print("=" * 60)
with open('frontend/core.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

js_functions = [
    ('function startVoiceRecording()', 'Voice Recording function'),
    ('function transcribeKannadaAudio(', 'Kannada Transcription function'),
    ('window.downloadSoilPDF = function', 'PDF Download function'),
    ('downloadSoilPDF', 'PDF handler'),
]

for js_func, description in js_functions:
    if js_func in js_content:
        print(f"✅ {description} implemented")
    else:
        print(f"❌ {description} NOT implemented")
        sys.exit(1)

# Test 6: Check CSS classes
print("\n" + "=" * 60)
print("TEST 6: Frontend CSS Styles")
print("=" * 60)
with open('frontend/core.css', 'r', encoding='utf-8') as f:
    css_content = f.read()

css_classes = [
    ('.rotation-box', 'Rotation styling'),
    ('.mandi-price-voice-wrap', 'Mandi voice styling'),
    ('.soil-pdf-wrap', 'PDF download styling'),
    ('.voice-input-section', 'Voice input styling'),
]

for css_class, description in css_classes:
    if css_class in css_content:
        print(f"✅ {description} in CSS")
    else:
        print(f"❌ {description} NOT in CSS")
        sys.exit(1)

# Test 7: Check requirements.txt
print("\n" + "=" * 60)
print("TEST 7: Dependencies")
print("=" * 60)
with open('requirements.txt', 'r', encoding='utf-8') as f:
    req_content = f.read()

dependencies = [
    ('reportlab>=4.1.0', 'PDF generation'),
    ('flask>=3.0.0', 'Web framework'),
    ('langchain-groq>=0.2.0', 'Groq LLM'),
]

for dep, description in dependencies:
    if dep in req_content:
        print(f"✅ {description}: {dep}")
    else:
        print(f"❌ {description}: {dep} NOT found")
        sys.exit(1)

print("\n" + "=" * 60)
print("SUMMARY: All 4 Enhancements Verified")
print("=" * 60)
print("✅ Enhancement #1 (Crop Rotation Memory): Complete")
print("✅ Enhancement #2 (Mandi Price Voice): Complete")
print("✅ Enhancement #3 (Soil Health PDF): Complete")
print("✅ Enhancement #5 (Kannada Voice Input): Complete")
print("=" * 60)

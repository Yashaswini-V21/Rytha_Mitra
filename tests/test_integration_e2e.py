"""
Integration tests for RythaGelathi end-to-end flow
Tests: form submission → advisory → offline fallback → PDF download
"""
import pytest
import json
import tempfile
from api.server import app, FarmInput

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as c:
        yield c

# ═══════════════════════════════════════════════════════════════════
# TEST 1: Pydantic Validation (422 on bad input)
# ═══════════════════════════════════════════════════════════════════
def test_validation_invalid_temperature(client):
    """Should reject temperature > 50°C with 422 error"""
    payload = {
        "district": "Raichur",
        "land": 2,
        "temperature": 999,  # INVALID
        "humidity": 35,
        "rainfall": 40,
        "ph": 6.2,
        "N": 60,
        "P": 30,
        "K": 25,
        "inputCosts": 15000,
        "lastCrop": "Ragi",
        "gender": "female"
    }
    response = client.post('/api/recommend', 
                           data=json.dumps(payload),
                           content_type='application/json')
    assert response.status_code == 422
    data = json.loads(response.data)
    assert 'detail' in data or 'error' in data
    print(f"✓ Validation test passed: 422 on temp=999")

# ═══════════════════════════════════════════════════════════════════
# TEST 2: Valid Raichur Advisory (Dryland scenario)
# ═══════════════════════════════════════════════════════════════════
def test_advisory_raichur_dryland(client):
    """Should generate advisory for Raichur dryland scenario"""
    payload = {
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
    }
    response = client.post('/api/recommend',
                           data=json.dumps(payload),
                           content_type='application/json')
    assert response.status_code in [200, 201]
    data = json.loads(response.data)
    assert 'result' in data or 'top_crop' in data
    print(f"✓ Raichur advisory test passed: {response.status_code}")

# ═══════════════════════════════════════════════════════════════════
# TEST 3: Valid Tumakuru Advisory (Balanced scenario)
# ═══════════════════════════════════════════════════════════════════
def test_advisory_tumakuru_balanced(client):
    """Should generate advisory for Tumakuru balanced scenario"""
    payload = {
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
    }
    response = client.post('/api/recommend',
                           data=json.dumps(payload),
                           content_type='application/json')
    assert response.status_code in [200, 201]
    data = json.loads(response.data)
    assert 'result' in data or 'top_crop' in data
    print(f"✓ Tumakuru advisory test passed: {response.status_code}")

# ═══════════════════════════════════════════════════════════════════
# TEST 4: Valid Mysore Advisory (Irrigated scenario)
# ═══════════════════════════════════════════════════════════════════
def test_advisory_mysore_irrigated(client):
    """Should generate advisory for Mysore irrigated scenario"""
    payload = {
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
    response = client.post('/api/recommend',
                           data=json.dumps(payload),
                           content_type='application/json')
    assert response.status_code in [200, 201]
    data = json.loads(response.data)
    assert 'result' in data or 'top_crop' in data
    print(f"✓ Mysore advisory test passed: {response.status_code}")

# ═══════════════════════════════════════════════════════════════════
# TEST 5: camelCase alias support (land vs land_acres)
# ═══════════════════════════════════════════════════════════════════
def test_camelcase_aliases(client):
    """Should accept camelCase field names (land, inputCosts, lastCrop)"""
    payload = {
        "district": "Raichur",
        "land": 2,  # camelCase
        "temperature": 38,
        "humidity": 35,
        "rainfall": 40,
        "ph": 6.2,
        "N": 60,
        "P": 30,
        "K": 25,
        "inputCosts": 15000,  # camelCase
        "lastCrop": "Ragi",   # camelCase
        "gender": "female"
    }
    response = client.post('/api/recommend',
                           data=json.dumps(payload),
                           content_type='application/json')
    assert response.status_code in [200, 201]
    print(f"✓ camelCase alias test passed: {response.status_code}")

# ═══════════════════════════════════════════════════════════════════
# TEST 6: PDF Season Plan Route
# ═══════════════════════════════════════════════════════════════════
def test_season_plan_pdf_download(client):
    """Should generate and return PDF with correct filename"""
    params = {
        'crop': 'Ragi',
        'district': 'Raichur',
        'land_acres': 2,
        'daily_water': 70,
        'sustainability_score': 85,
        'fertilizer_saving': 1500,
        'farmer_name': 'TestFarmer'
    }
    response = client.get('/api/season-plan', query_string=params)
    assert response.status_code == 200
    assert 'application/pdf' in response.content_type
    assert 'RythaGelathi_Ragi_Raichur.pdf' in response.headers.get('Content-Disposition', '')
    assert len(response.data) > 1000  # PDF should have substantial content
    print(f"✓ PDF download test passed: {len(response.data)} bytes")

# ═══════════════════════════════════════════════════════════════════
# TEST 7: Health Check Route
# ═══════════════════════════════════════════════════════════════════
def test_health_check(client):
    """Should return health status with 200"""
    response = client.get('/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'ok' in data or 'status' in data
    print(f"✓ Health check test passed")

# ═══════════════════════════════════════════════════════════════════
# TEST 8: Missing required field validation
# ═══════════════════════════════════════════════════════════════════
def test_missing_required_field(client):
    """Should reject payload missing 'district'"""
    payload = {
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
        # Missing: "district"
    }
    response = client.post('/api/recommend',
                           data=json.dumps(payload),
                           content_type='application/json')
    assert response.status_code in [422, 400]
    print(f"✓ Missing field validation test passed: {response.status_code}")

# ═══════════════════════════════════════════════════════════════════
# TEST 9: Field constraint - land range (0.1 to 1000 acres)
# ═══════════════════════════════════════════════════════════════════
def test_land_constraint_too_small(client):
    """Should reject land < 0.1 acres"""
    payload = {
        "district": "Raichur",
        "land": 0.05,  # INVALID - too small
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
    }
    response = client.post('/api/recommend',
                           data=json.dumps(payload),
                           content_type='application/json')
    assert response.status_code == 422
    print(f"✓ Land constraint test (too small) passed: {response.status_code}")

# ═══════════════════════════════════════════════════════════════════
# TEST 10: Field constraint - pH range (3.5 to 10)
# ═══════════════════════════════════════════════════════════════════
def test_ph_constraint_valid_edge(client):
    """Should accept pH at valid edge (3.5)"""
    payload = {
        "district": "Raichur",
        "land": 2,
        "temperature": 38,
        "humidity": 35,
        "rainfall": 40,
        "ph": 3.5,  # Valid edge
        "N": 60,
        "P": 30,
        "K": 25,
        "inputCosts": 15000,
        "lastCrop": "Ragi",
        "gender": "female"
    }
    response = client.post('/api/recommend',
                           data=json.dumps(payload),
                           content_type='application/json')
    assert response.status_code in [200, 201]
    print(f"✓ pH constraint edge test passed: {response.status_code}")

if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])

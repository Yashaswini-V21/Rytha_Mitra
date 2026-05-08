import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from api.server import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as c:
        yield c

# ═══════════════════════════════════════════════════════════
# TEST 1: Weather route returns valid structure
# ═══════════════════════════════════════════════════════════
def test_weather_route_raichur(client):
    """
    Test that GET /api/weather?district=Raichur returns valid weather data.
    Validates structure: temp, drought_risk, etc.
    """
    r = client.get('/api/weather?district=Raichur')
    assert r.status_code == 200, "Weather endpoint should return 200"
    data = r.get_json()
    assert 'temp' in data, "Response should contain 'temp'"
    assert 'drought_risk' in data, "Response should contain 'drought_risk'"
    assert 'humidity' in data, "Response should contain 'humidity'"
    assert 'wind_speed' in data, "Response should contain 'wind_speed'"
    assert data['drought_risk'] in ['High', 'Medium', 'Low'], "Drought risk must be valid"
    assert isinstance(data['temp'], (int, float)), "Temp should be numeric"
    assert 0 <= data['temp'] <= 60, "Temperature should be reasonable (0-60°C)"

# ═══════════════════════════════════════════════════════════
# TEST 2: Weather route handles unknown district gracefully
# ═══════════════════════════════════════════════════════════
def test_weather_route_unknown_district(client):
    """
    Test that GET /api/weather with unknown district returns fallback (no 500 error).
    Should return default/cached weather data instead of crashing.
    """
    r = client.get('/api/weather?district=UnknownPlace123')
    assert r.status_code == 200, "Should not crash on unknown district"
    data = r.get_json()
    assert 'temp' in data, "Should still return weather structure (fallback)"
    assert 'drought_risk' in data, "Should still have drought_risk in fallback"

# ═══════════════════════════════════════════════════════════
# TEST 3: Season plan route returns PDF with real content
# ═══════════════════════════════════════════════════════════
def test_season_plan_returns_pdf(client):
    """
    Test that GET /api/season-plan returns a valid PDF file.
    Validates: status 200, content-type is PDF, has real content (>1000 bytes).
    """
    r = client.get(
        '/api/season-plan?crop=Rice&district=Raichur'
        '&land_acres=2&daily_water=70'
        '&sustainability_score=75&fertilizer_saving=1500'
    )
    assert r.status_code == 200, "Season plan endpoint should return 200"
    assert r.content_type == 'application/pdf', f"Should return PDF, got {r.content_type}"
    assert len(r.data) > 1000, "PDF should have real content (>1000 bytes)"
    assert r.data.startswith(b'%PDF'), "Should be valid PDF (starts with %PDF)"

# ═══════════════════════════════════════════════════════════
# TEST 4: Season plan works for all major crops (parametrized)
# ═══════════════════════════════════════════════════════════
@pytest.mark.parametrize("crop", [
    "Rice", "Wheat", "Maize", "Ragi", "Cotton", "Toor Dal", "Sugarcane", "Groundnut"
])
def test_season_plan_all_crops(client, crop):
    """
    Test that season plan PDF generation works for all major crops.
    Uses parametrize to run test 8 times (one per crop).
    """
    r = client.get(
        f'/api/season-plan?crop={crop}&district=Mysore'
        '&land_acres=2&daily_water=70'
        '&sustainability_score=75&fertilizer_saving=1500'
    )
    assert r.status_code == 200, f"Season plan should work for {crop}"
    assert r.content_type == 'application/pdf', f"PDF generation failed for {crop}"
    assert len(r.data) > 800, f"PDF too small for {crop} (expected >800 bytes)"

# ═══════════════════════════════════════════════════════════
# TEST 5: Pydantic validation rejects invalid input (422)
# ═══════════════════════════════════════════════════════════
def test_recommend_rejects_invalid_temperature(client):
    """
    Test that POST /api/recommend rejects invalid data (temperature=999).
    Should return 422 (Unprocessable Entity) with error message, not 200.
    """
    r = client.post('/api/recommend',
        json={
            'district': 'Raichur',
            'temperature': 999,  # Invalid: way too high
            'humidity': 50,
            'rainfall': 100,
            'ph': 6.5,
            'N': 60,
            'P': 30,
            'K': 25,
            'land': 2,
            'inputCosts': 15000,
            'gender': 'female',
            'lastCrop': 'Rice'
        },
        content_type='application/json'
    )
    assert r.status_code == 422, "Should reject invalid temperature with 422"
    data = r.get_json()
    assert 'error' in data or 'detail' in data, "Should include error message"

# ═══════════════════════════════════════════════════════════
# TEST 6: Health check endpoint always works
# ═══════════════════════════════════════════════════════════
def test_health_check(client):
    """
    Test that GET /health returns valid health status.
    Should always work, even if dependencies are down.
    """
    r = client.get('/health')
    assert r.status_code in [200, 503], "Health endpoint should return 200 or 503"
    data = r.get_json()
    assert 'status' in data, "Response should include 'status' field"
    assert data.get('status') in ['ok', 'healthy', 'degraded', 'running'], \
        f"Status should be valid, got: {data.get('status')}"
    assert 'service' in data, "Response should include 'service' field"

# ═══════════════════════════════════════════════════════════
# BONUS TEST 7: Weather route returns all required fields
# ═══════════════════════════════════════════════════════════
def test_weather_response_completeness(client):
    """
    Test that weather response has all required fields for frontend.
    Frontend expects: temp, humidity, rainfall_7day, condition, wind_speed,
    drought_risk, flood_risk, advisory
    """
    required_fields = [
        'temp', 'humidity', 'rainfall_7day', 'condition', 
        'wind_speed', 'drought_risk', 'flood_risk', 'advisory'
    ]
    r = client.get('/api/weather?district=Tumakuru')
    assert r.status_code == 200
    data = r.get_json()
    for field in required_fields:
        assert field in data, f"Weather response missing required field: {field}"

# ═══════════════════════════════════════════════════════════
# BONUS TEST 8: Season plan accepts all valid parameters
# ═══════════════════════════════════════════════════════════
@pytest.mark.parametrize("district", [
    "Raichur", "Tumakuru", "Mysore", "Dharwad", "Hassan"
])
def test_season_plan_all_districts(client, district):
    """
    Test that season plan works across all major districts.
    """
    r = client.get(
        f'/api/season-plan?crop=Rice&district={district}'
        '&land_acres=3&daily_water=80'
        '&sustainability_score=80&fertilizer_saving=2000'
    )
    assert r.status_code == 200, f"Season plan should work for {district}"
    assert r.content_type == 'application/pdf'

# ═══════════════════════════════════════════════════════════
# BONUS TEST 9: Weather endpoint with all districts
# ═══════════════════════════════════════════════════════════
@pytest.mark.parametrize("district", [
    "Raichur", "Tumakuru", "Mysore", "Dharwad", 
    "Belagavi", "Kalaburagi", "Hassan", "Shivamogga", "Mandya"
])
def test_weather_all_districts(client, district):
    """
    Test that weather API works for all 9 mapped districts.
    """
    r = client.get(f'/api/weather?district={district}')
    assert r.status_code == 200, f"Weather should work for {district}"
    data = r.get_json()
    assert data['drought_risk'] in ['High', 'Medium', 'Low']
    assert isinstance(data['temp'], (int, float))

# ═══════════════════════════════════════════════════════════
# BONUS TEST 10: Invalid parameter in season plan
# ═══════════════════════════════════════════════════════════
def test_season_plan_missing_required_param(client):
    """
    Test that season plan fails gracefully if required params are missing.
    """
    r = client.get('/api/season-plan?crop=Rice')  # Missing district, land_acres, etc.
    # Should either return 400 or a default value (depends on implementation)
    assert r.status_code in [200, 400, 422], "Should handle missing params gracefully"

import pytest
import sys
import os

# Add parent directory to path to import api.server
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.server import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_endpoint(client):
    """Tests /health returns status and dependency info"""
    response = client.get('/health')
    assert response.status_code in (200, 503)
    data = response.get_json()
    assert 'status' in data
    assert 'dependencies' in data


def test_ready_endpoint(client):
    """Tests /ready returns readiness status and dependency info"""
    response = client.get('/ready')
    assert response.status_code in (200, 503)
    data = response.get_json()
    assert 'status' in data
    assert 'dependencies' in data

def test_weather_endpoint(client):
    """Tests /api/weather returns 200 with temp and drought_risk fields"""
    response = client.get('/api/weather?district=Raichur')
    assert response.status_code == 200
    data = response.get_json()
    assert 'temp' in data
    assert 'drought_risk' in data

def test_season_plan_pdf(client):
    """Tests /api/season-plan returns PDF"""
    response = client.get('/api/season-plan?district=Raichur')
    assert response.status_code == 200
    assert response.content_type == 'application/pdf'

def test_recommend_validation_error(client):
    """Tests /api/recommend returns 422 when temperature is invalid (999)"""
    # Tests Pydantic validation: temperature=999 should trigger validation error
    response = client.post('/api/recommend', json={
        "district": "Raichur",
        "temperature": 999,
        "humidity": 50,
        "rainfall": 100,
        "ph": 6,
        "land": 1,
        "N": 50, "P": 50, "K": 50,
        "inputCosts": 1000
    })
    assert response.status_code == 422

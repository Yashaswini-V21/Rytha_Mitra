import os
import requests
from flask import Blueprint, jsonify
from pathlib import Path

health_bp = Blueprint("health", __name__)

@health_bp.get("/health")
def health():
    """
    Enterprise Health Check
    ---
    responses:
      200:
        description: System status and dependency health
    """
    ROOT_DIR = Path(__file__).resolve().parents[3]
    
    # Check Model
    model_exists = (ROOT_DIR / "src" / "model" / "crop_model.pkl").exists()
    
    # Check Environment
    groq_key = os.getenv("GROQ_API_KEY")
    sarvam_key = os.getenv("SARVAM_API_KEY")
    
    status = {
        "status": "healthy" if model_exists and groq_key else "degraded",
        "service": "rytha-mitra-api",
        "version": "1.1.0",
        "dependencies": {
            "model_file": "ready" if model_exists else "missing",
            "groq_api": "configured" if groq_key else "missing",
            "sarvam_ai": "configured" if sarvam_key else "missing",
            "weather_api": "configured" if os.getenv("OPENWEATHER_API_KEY") else "missing"
        }
    }
    
    return jsonify(status), 200 if status["status"] == "healthy" else 503


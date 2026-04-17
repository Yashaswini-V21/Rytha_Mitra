from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any, Dict

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

ROOT_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIR = ROOT_DIR / "frontend"

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from crew.krishi_crew import KrishiCrew

if load_dotenv is not None:
    load_dotenv(dotenv_path=ROOT_DIR / ".env", override=False)

app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")
CORS(app)

# Serve public assets
PUBLIC_DIR = ROOT_DIR / "public"

@app.route("/public/<path:filename>")
def public_files(filename):
    return send_from_directory(str(PUBLIC_DIR), filename)



def _payload_to_inputs(payload: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "N": payload.get("N", 82),
        "P": payload.get("P", 42),
        "K": payload.get("K", 38),
        "temperature": payload.get("temperature", 31.0),
        "humidity": payload.get("humidity", 62.0),
        "ph": payload.get("ph", 6.7),
        "rainfall": payload.get("rainfall", 92.0),
        "district": payload.get("district", "Raichur"),
        "input_costs": payload.get("input_costs", payload.get("inputCosts", 18000)),
        "land_acres": payload.get("land_acres", payload.get("land", 2.0)),
        "last_crop": payload.get("last_crop", ""),
        "gender": payload.get("gender", ""),
    }


@app.get("/")
def root() -> Any:
    return send_from_directory(str(FRONTEND_DIR), "index.html")


@app.get("/health")
def health() -> Any:
    return jsonify({"status": "ok", "service": "rythagelathi-api"})


@app.post("/api/recommend")
def recommend() -> Any:
    payload = request.get_json(silent=True) or {}
    inputs = _payload_to_inputs(payload)
    try:
        crew = KrishiCrew()
        result = crew.run(inputs)
        return jsonify({
            "ok": True,
            "inputs": inputs,
            "result": result,
        })
    except Exception as exc:
        return jsonify({
            "ok": False,
            "inputs": inputs,
            "error": str(exc),
        }), 500


if __name__ == "__main__":
    host = os.getenv("API_HOST", "127.0.0.1")
    port = int(os.getenv("API_PORT", "8000"))
    app.run(host=host, port=port, debug=False, use_reloader=False)

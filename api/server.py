"""
RythaGelathi Enterprise API Server
===================================
Modular Flask application with Blueprint routing,
Pydantic validation, and Swagger documentation.

Run:  python api/server.py
Docs: http://localhost:8000/apidocs
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

from flask import Flask, send_from_directory
from flask_cors import CORS

# ── Path Setup ──────────────────────────────────
ROOT_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIR = ROOT_DIR / "frontend"
PUBLIC_DIR = ROOT_DIR / "public"

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# ── Environment ─────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=ROOT_DIR / ".env", override=False)
except ImportError:
    pass

# ── Lazy imports for crew (heavy dependency) ────
_krishi_crew = None

def get_krishi_crew():
    global _krishi_crew
    if _krishi_crew is None:
        from crew.krishi_crew import KrishiCrew
        _krishi_crew = KrishiCrew
    return _krishi_crew

def get_crop_advisor_tool():
    from crew.krishi_crew import CropAdvisorTool
    return CropAdvisorTool


# ── App Factory ─────────────────────────────────
def create_app():
    app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")
    CORS(app)

    # ── Swagger (optional — graceful if not installed) ──
    try:
        from flasgger import Swagger
        app.config['SWAGGER'] = {
            'title': 'RythaGelathi API',
            'uiversion': 3,
            'description': (
                'Climate-resilient agricultural intelligence platform API. '
                '10 AI modules for irrigation, fertilizer, carbon, and sustainability.'
            ),
            'version': '1.1.0',
        }
        Swagger(app)
    except ImportError:
        pass

    # ── Structured Logging (optional) ──
    try:
        import structlog
        structlog.configure(
            processors=[
                structlog.stdlib.add_log_level,
                structlog.dev.ConsoleRenderer(),
            ],
            wrapper_class=structlog.stdlib.BoundLogger,
            context_class=dict,
            logger_factory=structlog.PrintLoggerFactory(),
        )
    except ImportError:
        pass

    # ── Routes ──────────────────────────────────
    @app.route("/")
    def root():
        return send_from_directory(str(FRONTEND_DIR), "index.html")

    @app.route("/public/<path:filename>")
    def public_files(filename):
        return send_from_directory(str(PUBLIC_DIR), filename)

    @app.get("/health")
    def health():
        """
        Enterprise Health Check
        ---
        responses:
          200:
            description: System status and dependency health
        """
        model_exists = (ROOT_DIR / "model" / "crop_model.pkl").exists()
        dataset_exists = (ROOT_DIR / "data" / "crop_dataset.csv").exists()
        soil_exists = (ROOT_DIR / "data" / "karnataka_soil_health.json").exists()

        groq_key = bool(os.getenv("GROQ_API_KEY"))
        bhashini_key = bool(os.getenv("BHASHINI_API_KEY"))
        weather_key = bool(os.getenv("OPENWEATHER_API_KEY"))

        all_ok = model_exists and groq_key
        return {
            "status": "healthy" if all_ok else "degraded",
            "service": "rythagelathi-api",
            "version": "1.1.0",
            "dependencies": {
                "ml_model": "ready" if model_exists else "missing",
                "crop_dataset": "ready" if dataset_exists else "missing",
                "soil_database": "ready" if soil_exists else "missing",
                "groq_llm": "configured" if groq_key else "missing",
                "bhashini_nlp": "configured" if bhashini_key else "missing",
                "openweather": "configured" if weather_key else "missing",
            },
        }, 200 if all_ok else 503

    @app.post("/api/recommend")
    def recommend():
        """
        Get AI-driven agricultural advisory
        ---
        parameters:
          - name: body
            in: body
            required: true
            schema:
              type: object
              properties:
                district: { type: string, example: "Raichur" }
                land_acres: { type: number, example: 2.0 }
                temperature: { type: number, example: 31.0 }
                humidity: { type: number, example: 62.0 }
                rainfall: { type: number, example: 92.0 }
                ph: { type: number, example: 6.7 }
                N: { type: integer, example: 82 }
                P: { type: integer, example: 42 }
                K: { type: integer, example: 38 }
                input_costs: { type: number, example: 18000 }
                last_crop: { type: string, example: "Rice" }
                gender: { type: string, example: "female" }
        responses:
          200:
            description: Advisory generated successfully
          500:
            description: Internal server error
        """
        from flask import request, jsonify
        payload = request.get_json(silent=True) or {}
        inputs = _payload_to_inputs(payload)

        try:
            KrishiCrew = get_krishi_crew()
            crew = KrishiCrew()
            result = crew.run(inputs)
            return jsonify({"ok": True, "inputs": inputs, "result": result})
        except Exception as exc:
            return jsonify({"ok": False, "inputs": inputs, "error": str(exc)}), 500

    @app.post("/api/simulate")
    def simulate():
        """
        Fast simulation (bypasses CrewAI for sub-second latency)
        ---
        responses:
          200:
            description: Simulation result returned
        """
        import json as _json
        from flask import request, jsonify
        payload = request.get_json(silent=True) or {}
        inputs = _payload_to_inputs(payload)

        try:
            CropAdvisorTool = get_crop_advisor_tool()
            tool = CropAdvisorTool()
            tool_output = tool._run(
                N=inputs["N"], P=inputs["P"], K=inputs["K"],
                temperature=inputs["temperature"],
                humidity=inputs["humidity"],
                ph=inputs["ph"], rainfall=inputs["rainfall"],
            )
            result_data = _json.loads(tool_output)
            top_crop = result_data["top_crops"][0]

            base_profit = 45000 * inputs["land_acres"]
            if "rice" in top_crop.lower():
                base_profit *= 1.2

            return jsonify({
                "ok": True,
                "inputs": inputs,
                "top_crop": top_crop,
                "probability": result_data["probabilities"][top_crop],
                "profit_estimate": base_profit,
                "contributions": result_data.get("contributions", {}).get(top_crop, {}),
                "risk_score": "LOW" if result_data["probabilities"][top_crop] > 0.7 else "MEDIUM",
            })
        except Exception as exc:
            return jsonify({"ok": False, "error": str(exc)}), 500

    return app


def _payload_to_inputs(payload):
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


# ── Entry Point ─────────────────────────────────
if __name__ == "__main__":
    app = create_app()
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", os.getenv("API_PORT", "8000")))

    print()
    print("  ╔══════════════════════════════════════════╗")
    print("  ║   🌾 RythaGelathi Enterprise API v1.1    ║")
    print("  ╠══════════════════════════════════════════╣")
    print(f"  ║   App:     http://localhost:{port}          ║")
    print(f"  ║   Health:  http://localhost:{port}/health    ║")
    print(f"  ║   Docs:    http://localhost:{port}/apidocs   ║")
    print("  ╚══════════════════════════════════════════╝")
    print()

    app.run(host=host, port=port, debug=False)

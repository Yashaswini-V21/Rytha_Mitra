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

from flask import Flask, send_from_directory, send_file, request, jsonify
from flask_cors import CORS
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import cm
import io, datetime

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


# ── Season Plan Data ────────────────────────────
CROP_CALENDAR = {
  "Rice":      ("Jun–Jul", "Aug–Oct",  "Nov–Dec"),
  "Wheat":     ("Oct–Nov", "Dec–Feb",  "Mar–Apr"),
  "Maize":     ("Jun–Jul", "Aug–Sep",  "Oct–Nov"),
  "Ragi":      ("Jun–Jul", "Aug–Sep",  "Oct"),
  "Cotton":    ("May–Jun", "Jul–Oct",  "Nov–Jan"),
  "Toor Dal":  ("Jun–Jul", "Aug–Nov",  "Dec–Jan"),
  "Sugarcane": ("Jan–Feb", "Mar–Nov",  "Dec–Jan"),
  "Groundnut": ("Jun–Jul", "Aug–Sep",  "Oct–Nov"),
  "Soybean":   ("Jun",     "Jul–Sep",  "Oct"),
  "Sunflower": ("Oct–Nov", "Dec–Feb",  "Mar–Apr"),
}

GOVT_SCHEMES = {
  "Raichur":   ["PM-KISAN (₹6000/yr)", "PMFBY Crop Insurance", "Rythu Bandhu Dryland Scheme"],
  "Tumakuru":  ["PM-KISAN", "Karnataka Raitha Suraksha", "Soil Health Card Scheme"],
  "Mysore":    ["PM-KISAN", "PMFBY", "PM Krishi Sinchai Yojana"],
  "Dharwad":   ["PM-KISAN", "KFSC Seed Subsidy", "Drip Irrigation Subsidy 90%"],
  "default":   ["PM-KISAN (₹6000/yr)", "PMFBY Crop Insurance", "Soil Health Card Scheme"]
}


# ── Pydantic Input Validation ───────────────────
from pydantic import BaseModel, Field
from typing import Optional

class FarmInput(BaseModel):
    district: str
    land_acres: float = Field(ge=0.1, le=1000, alias="land")
    temperature: float = Field(ge=10.0, le=50.0)
    humidity: float = Field(ge=0.0, le=100.0)
    rainfall: float = Field(ge=0.0, le=500.0)
    ph: float = Field(ge=3.5, le=10.0)
    N: int = Field(ge=0, le=300)
    P: int = Field(ge=0, le=300)
    K: int = Field(ge=0, le=300)
    input_costs: float = Field(ge=0, alias="inputCosts")
    last_crop: Optional[str] = Field(default="", alias="lastCrop")
    gender: Optional[str] = Field(default="female")

    model_config = {"populate_by_name": True}


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

    # District coordinates for Karnataka
    DISTRICT_COORDS = {
        'Raichur':  (16.2120, 77.3439),
        'Tumakuru': (13.3379, 77.1173),
        'Mysore':   (12.2958, 76.6394),
        'Dharwad':  (15.4589, 75.0078),
        'Belagavi': (15.8497, 74.4977),
        'Kalaburagi':(17.3297, 76.8200),
        'Hassan':   (13.0035, 76.0998),
        'Shivamogga':(13.9299, 75.5681),
        'Mandya':   (12.5218, 76.8951),
    }

    @app.route('/api/weather')
    def get_weather():
        district = request.args.get('district', 'Raichur')
        coords = DISTRICT_COORDS.get(district, (16.2120, 77.3439))
        api_key = os.getenv('OPENWEATHER_API_KEY', '')

        if not api_key:
            # Return static fallback if no key
            static = {
                'Raichur':  dict(temp=38,humidity=35,rainfall_7day=12,
                                condition='Clear',wind_speed=14,
                                drought_risk='High',flood_risk='Low',
                                advisory='Irrigate within 48 hours — deficit rainfall expected'),
                'Tumakuru': dict(temp=29,humidity=72,rainfall_7day=45,
                                condition='Partly Cloudy',wind_speed=10,
                                drought_risk='Medium',flood_risk='Low',
                                advisory='Monitor soil moisture — moderate conditions'),
            }
            return jsonify(static.get(district, static['Raichur']))

        import requests as req
        try:
            url = (f"https://api.openweathermap.org/data/2.5/weather"
                   f"?lat={coords[0]}&lon={coords[1]}"
                   f"&appid={api_key}&units=metric")
            r = req.get(url, timeout=5)
            w = r.json()
            temp     = round(w['main']['temp'])
            humidity = w['main']['humidity']
            wind     = round(w['wind']['speed'] * 3.6)
            cond     = w['weather'][0]['main']
            rain_1h  = w.get('rain', {}).get('1h', 0)

            drought_risk = 'High' if temp > 35 and humidity < 40 else \
                           'Medium' if temp > 30 else 'Low'
            flood_risk   = 'High' if rain_1h > 20 else \
                           'Medium' if rain_1h > 10 else 'Low'

            advisory = ('Irrigate within 48 hours — heatwave conditions' if drought_risk == 'High'
                        else 'Good growing conditions — maintain regular irrigation schedule'
                        if drought_risk == 'Low' else 'Monitor crops — variable weather expected')

            return jsonify(dict(
                temp=temp, humidity=humidity,
                rainfall_7day=round(rain_1h * 168),
                condition=cond, wind_speed=wind,
                drought_risk=drought_risk,
                flood_risk=flood_risk,
                advisory=advisory
            ))
        except Exception as e:
            return jsonify(dict(temp=30,humidity=60,rainfall_7day=25,
                condition='Unknown',wind_speed=12,
                drought_risk='Medium',flood_risk='Low',
                advisory='Weather data temporarily unavailable — using historical averages'
            ))

    @app.route('/api/season-plan')
    def season_plan():
        """Download PDF season plan for crop advisory"""
        crop = request.args.get('crop', 'Rice')
        district = request.args.get('district', 'Karnataka')
        land = float(request.args.get('land_acres', 1))
        daily_water = float(request.args.get('daily_water', 70))
        sust = int(request.args.get('sustainability_score', 75))
        saving = int(request.args.get('fertilizer_saving', 1500))
        farmer = request.args.get('farmer_name', 'Karnataka Farmer')

        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4,
              topMargin=1.5*cm, bottomMargin=1.5*cm,
              leftMargin=2*cm, rightMargin=2*cm)
        styles = getSampleStyleSheet()
        GREEN = colors.HexColor('#14532d')
        GOLD  = colors.HexColor('#f59e0b')
        LGREY = colors.HexColor('#f0fdf4')
        story = []

        # Header
        header_data = [[
          Paragraph(f"<font color='white' size=18><b>ರೈತ ಗೆಳತಿ · Season Advisory Plan</b></font>", styles['Normal']),
          Paragraph(f"<font color='#fef3c7' size=10>{farmer} · {district} · {land} acres<br/>Generated: {datetime.date.today()}</font>", styles['Normal'])
        ]]
        ht = Table(header_data, colWidths=[11*cm, 6*cm])
        ht.setStyle(TableStyle([
          ('BACKGROUND',(0,0),(-1,-1), GREEN),
          ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
          ('LEFTPADDING',(0,0),(-1,-1),12),
          ('RIGHTPADDING',(0,0),(-1,-1),12),
          ('TOPPADDING',(0,0),(-1,-1),14),
          ('BOTTOMPADDING',(0,0),(-1,-1),14),
        ]))
        story.extend([ht, Spacer(1,0.4*cm)])

        # Summary metrics
        metrics = [[
          Paragraph(f"<b>Recommended Crop</b><br/><font size=14 color='#14532d'><b>{crop}</b></font>", styles['Normal']),
          Paragraph(f"<b>Sustainability</b><br/><font size=14 color='#14532d'><b>{sust}/100</b></font>", styles['Normal']),
          Paragraph(f"<b>Water Saving</b><br/><font size=14 color='#14532d'><b>Up to 43%</b></font>", styles['Normal']),
          Paragraph(f"<b>Fertilizer Saving</b><br/><font size=14 color='#14532d'><b>₹{saving}/acre</b></font>", styles['Normal']),
        ]]
        mt = Table(metrics, colWidths=[4.25*cm]*4)
        mt.setStyle(TableStyle([
          ('BACKGROUND',(0,0),(-1,-1), LGREY),
          ('BOX',(0,0),(-1,-1),1,GREEN),
          ('INNERGRID',(0,0),(-1,-1),0.5,colors.HexColor('#bbf7d0')),
          ('TOPPADDING',(0,0),(-1,-1),8),
          ('BOTTOMPADDING',(0,0),(-1,-1),8),
          ('LEFTPADDING',(0,0),(-1,-1),8),
        ]))
        story.extend([mt, Spacer(1,0.4*cm)])

        # Crop calendar
        cal = CROP_CALENDAR.get(crop, ("Jun","Jul-Oct","Nov"))
        story.append(Paragraph("<b>12-Month Crop Calendar</b>", styles['Heading3']))
        cal_data = [
          ["Phase", "Months", "Key Action"],
          ["Sowing", cal[0], "Prepare soil, certified seeds"],
          ["Growing", cal[1], "Irrigation, pest monitoring"],
          ["Harvest", cal[2], "Dry, store, check mandi price"],
        ]
        ct = Table(cal_data, colWidths=[4*cm, 5*cm, 8*cm])
        ct.setStyle(TableStyle([
          ('BACKGROUND',(0,0),(-1,0),GREEN),
          ('TEXTCOLOR',(0,0),(-1,0),colors.white),
          ('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),
          ('ROWBACKGROUNDS',(0,1),(-1,-1),[LGREY, colors.white]),
          ('GRID',(0,0),(-1,-1),0.5,colors.HexColor('#bbf7d0')),
          ('TOPPADDING',(0,0),(-1,-1),6),
          ('BOTTOMPADDING',(0,0),(-1,-1),6),
          ('LEFTPADDING',(0,0),(-1,-1),8),
        ]))
        story.extend([ct, Spacer(1,0.4*cm)])

        # Water schedule
        story.append(Paragraph("<b>Weekly Water Schedule</b>", styles['Heading3']))
        wk_data = [["Week","Daily (L/acre)","Action"]]
        actions = ["Morning irrigation before 7AM","Skip if rainfall >15mm","Monitor for drought stress","Check soil moisture depth"]
        for i in range(4):
          wk_data.append([f"Week {i+1}", str(round(daily_water*(1+i*0.05))), actions[i]])
        wt = Table(wk_data, colWidths=[3*cm, 5*cm, 9*cm])
        wt.setStyle(TableStyle([
          ('BACKGROUND',(0,0),(-1,0),GREEN),
          ('TEXTCOLOR',(0,0),(-1,0),colors.white),
          ('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),
          ('ROWBACKGROUNDS',(0,1),(-1,-1),[LGREY, colors.white]),
          ('GRID',(0,0),(-1,-1),0.5,colors.HexColor('#bbf7d0')),
          ('TOPPADDING',(0,0),(-1,-1),6),
          ('BOTTOMPADDING',(0,0),(-1,-1),6),
          ('LEFTPADDING',(0,0),(-1,-1),8),
        ]))
        story.extend([wt, Spacer(1,0.4*cm)])

        # Govt schemes
        schemes = GOVT_SCHEMES.get(district, GOVT_SCHEMES['default'])
        story.append(Paragraph("<b>Applicable Government Schemes</b>", styles['Heading3']))
        for s in schemes:
          story.append(Paragraph(f"• {s}", styles['Normal']))
        story.append(Spacer(1,0.4*cm))

        # Footer
        story.append(Paragraph(
          "<font size=9 color='#6b7280'>Generated by RythaGelathi · WitchHunt 2026 · Climate Action Track · ₹0 Stack Cost</font>",
          styles['Normal']))

        doc.build(story)
        buf.seek(0)
        return send_file(buf, mimetype='application/pdf',
                         as_attachment=True,
                         download_name=f'RythaGelathi_{crop}_{district}.pdf')

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
        raw = request.get_json(force=True, silent=True)
        if not raw:
            return jsonify({"error": "No JSON body received"}), 400
        try:
            farm = FarmInput(**raw)
            payload = farm.model_dump(by_alias=False)
        except Exception as e:
            return jsonify({
                "error": "Invalid input data",
                "details": str(e),
                "hint": "Check field names and value ranges"
            }), 422
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


app = create_app()


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

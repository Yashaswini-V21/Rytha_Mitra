<!-- FARMING STYLE HEADER -->
<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,6,11,20&height=280&section=header&text=RythaGelathi&fontSize=64&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=AI%20Crop%20Advisory%20for%20Women%20Farmers%20of%20Karnataka&descAlignY=62&descSize=18" width="100%"/>

<h3>ರೈತ ಗೆಳತಿ · Farmer-first, explainable, Kannada-ready advisory</h3>

<p><strong>One platform for crop, climate, soil, and market intelligence.</strong></p>

<p>
Built for field-level decision making across soil health, forecast risk, mandi prices,
and practical seasonal planning.
</p>

[![Star](https://img.shields.io/badge/⭐_Star_This_Repo-111827?style=for-the-badge&logo=github)](https://github.com/Yashaswini-V21/Rytha_Gelathi)
[![Kannada First](https://img.shields.io/badge/Kannada-Voice_First-15803d?style=for-the-badge)](.)
[![Offline Core](https://img.shields.io/badge/Offline-Core_Ready-166534?style=for-the-badge)](.)

[![Hackathon Ready](https://img.shields.io/badge/Hackathon_Ready-2026-f97316?style=for-the-badge)](.)
[![Track](https://img.shields.io/badge/Track-Climate_Action-16a34a?style=for-the-badge)](.)
[![Status](https://img.shields.io/badge/Status-Hackathon_Ready-22c55e?style=for-the-badge)](.)
[![Python](https://img.shields.io/badge/Python-3.10%2B-2563eb?style=for-the-badge&logo=python&logoColor=white)](.)

[![CrewAI](https://img.shields.io/badge/CrewAI-Orchestration-7c3aed?style=flat-square)](https://www.crewai.com/)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-111827?style=flat-square)](https://console.groq.com/)
[![SHAP](https://img.shields.io/badge/SHAP-Explainability-ef4444?style=flat-square)](https://shap.readthedocs.io/)
[![Bhashini](https://img.shields.io/badge/Bhashini-Kannada-f59e0b?style=flat-square)](https://bhashini.gov.in/)
[![OpenWeatherMap](https://img.shields.io/badge/OpenWeatherMap-Forecast-0284c7?style=flat-square)](https://openweathermap.org/)
[![Agmarknet](https://img.shields.io/badge/Agmarknet-Mandi_Data-f97316?style=flat-square)](https://agmarknet.gov.in/)
[![Offline Core](https://img.shields.io/badge/Offline-Core_Ready-166534?style=flat-square)](.)

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=6,11,20&height=85&section=header&text=Climate-Smart%20%7C%20Explainable%20AI%20%7C%20Kannada%20Voice&fontSize=22&fontColor=ffffff&animation=fadeIn" width="100%"/>

</div>

---

## Table of Contents

- [Project Summary](#project-summary)
- [Why This Matters](#why-this-matters)
- [Design Highlights](#design-highlights)
- [At A Glance](#at-a-glance)
- [What The Platform Delivers](#what-the-platform-delivers)
- [System Architecture](#system-architecture)
- [Data Flow Diagram](#data-flow-diagram)
- [How It Works](#how-it-works)
- [Technology Stack](#technology-stack)
- [API Contract](#api-contract)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Validation and Testing](#validation-and-testing)
- [Roadmap](#roadmap)
- [Team](#team)
- [License](#license)

---

## Project Summary

RythaGelathi is an AI crop advisory platform built for women farmers in Karnataka.

It converts practical farm inputs into clear recommendations:

- Top crop recommendation
- Profit estimate from mandi prices
- Weather compatibility and drought risk
- Soil health alerts
- SHAP explainability for trust
- Kannada text and voice output

The workflow supports graceful fallback so the core decision path remains usable even when external APIs are unavailable.

---

## Why This Matters

Farmers often receive one-size-fits-all advisories that do not reflect district climate and soil conditions.

Primary gaps this project addresses:

- Generic recommendations without field context
- Low explainability of model output
- Fragmented tools for weather, market, and soil
- Language accessibility barriers for Kannada users

RythaGelathi brings those layers into one farmer-friendly flow.

## Design Highlights

<table>
  <tr>
    <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:16px;vertical-align:top;">
      <strong>Farmer-first clarity</strong><br/>
      The flow stays short, readable, and practical so the advisory can be understood quickly in the field.
    </td>
    <td style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:16px;vertical-align:top;">
      <strong>Color-coded intelligence</strong><br/>
      Layered Mermaid diagrams, section breaks, and badges make the system easy to explain in a demo.
    </td>
    <td style="background:#fffbeb;border:1px solid #fde68a;border-radius:14px;padding:16px;vertical-align:top;">
      <strong>Trust and action</strong><br/>
      SHAP explanations, mandi prices, drought signals, and Kannada voice turn data into decisions.
    </td>
  </tr>
</table>

---

## At A Glance

| Focus | Value |
|------|-------|
| Primary Users | Women farmers in Karnataka |
| Intelligence Core | Random Forest + SHAP |
| Market Layer | Agmarknet + offline fallback |
| Climate Layer | OpenWeatherMap + drought scoring |
| Language Layer | Bhashini Kannada translation + voice |
| Output Style | Explainable, practical, actionable |

---

## What The Platform Delivers

Core capabilities in the current implementation:

1. Random Forest crop recommendation with model accuracy reporting
2. SHAP reasons for why a crop is selected
3. Mandi price ingestion with fallback support
4. Weather compatibility flags and drought risk scoring
5. Soil nutrient alerts from district-level data
6. Kannada translation and TTS payload via Bhashini

Enhancement modules included:

1. Crop Rotation Memory
2. Live Mandi Price Kannada Voice
3. Soil Health Card PDF
4. Drought Risk Early Warning with crop-switch logic
5. Kannada Voice Input flow (frontend module)
6. Season Profitability Comparison
7. Government Scheme Matcher

---

## System Architecture

The architecture is intentionally layered so the story stays clean on slides, in the demo, and in the README.

```mermaid
flowchart LR
  classDef farm fill:#14532d,stroke:#86efac,color:#ffffff,stroke-width:2px;
  classDef api fill:#1d4ed8,stroke:#93c5fd,color:#ffffff,stroke-width:2px;
  classDef crew fill:#7c3aed,stroke:#d8b4fe,color:#ffffff,stroke-width:2px;
  classDef data fill:#b45309,stroke:#fcd34d,color:#ffffff,stroke-width:2px;
  classDef output fill:#047857,stroke:#6ee7b7,color:#ffffff,stroke-width:2px;

  A[Farmer on Mobile]:::farm --> B[Core Advisory UI]:::farm
  B --> C[Flask API]:::api
  C --> D[KrishiCrew Orchestrator]:::crew

  D --> E[CropAdvisorTool<br/>Random Forest + SHAP]:::crew
  D --> F[MarketAnalystTool<br/>Agmarknet + Fallback]:::data
  D --> G[WeatherIntelTool<br/>Forecast + Drought Risk]:::data
  D --> H[SoilExpertTool<br/>District Soil Alerts]:::data

  E --> I[Final Advisory Composer]:::output
  F --> I
  G --> I
  H --> I

  I --> J[Bhashini Translation + TTS]:::output
  J --> K[Kannada Result Cards<br/>Voice + PDF + Scheme Match]:::farm
```

### Layer View

| Layer | What It Does | Why It Matters |
|------|---------------|-----------------|
| Experience Layer | Collects inputs and renders results | Simple for farmers to use on mobile |
| API Layer | Validates and routes requests | Keeps the interface clean and controlled |
| Intelligence Layer | Runs ML, market, weather, soil and language tools | Turns raw data into farm advice |
| Output Layer | Shows text, voice, PDF, and scheme guidance | Makes the advice usable in the field |

---

## Data Flow Diagram

```mermaid
flowchart TD
  classDef input fill:#0f766e,stroke:#5eead4,color:#ffffff,stroke-width:2px;
  classDef api fill:#1d4ed8,stroke:#bfdbfe,color:#ffffff,stroke-width:2px;
  classDef ml fill:#7c3aed,stroke:#ddd6fe,color:#ffffff,stroke-width:2px;
  classDef env fill:#b45309,stroke:#fde68a,color:#ffffff,stroke-width:2px;
  classDef out fill:#15803d,stroke:#bbf7d0,color:#ffffff,stroke-width:2px;

  A[Farmer Inputs<br/>district NPK weather land budget]:::input --> B[POST /api/recommend]:::api
  B --> C[Flask API Input Mapping]:::api
  C --> D[CropAdvisorTool<br/>RF + SHAP]:::ml
  D --> E[MarketAnalystTool<br/>Mandi + Profit]:::env
  D --> F[WeatherIntelTool<br/>Weather Flags + Drought]:::env
  D --> G[SoilExpertTool<br/>NPK Alerts]:::env
  E --> H[Compose Final Advisory]:::out
  F --> H
  G --> H
  H --> I[Bhashini Translation + TTS]:::out
  I --> J[Frontend Result Cards + Voice + PDF]:::out
```

---

## How It Works

1. Farmer enters district, NPK, climate values, land size, budget, and optional previous crop.
2. Backend maps payload and executes crew tools in sequence or fallback mode.
3. CropAdvisor predicts top crops and computes SHAP explanations.
4. Market tool fetches mandi prices and calculates profit projections.
5. Weather layer computes compatibility and drought-risk classification.
6. Soil layer flags nutrient deficiencies and supports soil-card PDF generation.
7. Final advisory is translated to Kannada and optionally converted to audio.
8. Frontend renders recommendation cards, tables, and downloadable assets.

---

## Technology Stack

| Layer | Stack | Purpose |
|------|-------|---------|
| Frontend | HTML, CSS, Vanilla JS | Form capture, result rendering, voice UI |
| Backend | Flask, Flask-CORS | API + static hosting |
| Orchestration | CrewAI | Multi-step agent workflow |
| LLM Runtime | Groq LLaMA 3.3 70B | Language reasoning and advisory framing |
| ML | scikit-learn Random Forest | Crop prediction |
| Explainability | SHAP | Feature-level decision transparency |
| Weather Data | OpenWeatherMap | Forecast and risk context |
| Market Data | Agmarknet + fallback JSON | Price and profitability |
| Translation and Voice | Bhashini | Kannada translation and TTS |
| Utility | numpy, pandas, requests, dotenv | Data and integration helpers |
| PDF | reportlab | Soil health card generation |

---

## API Contract

### Endpoint

POST /api/recommend

### Request Example

```json
{
  "district": "Raichur",
  "land_acres": 2,
  "temperature": 31,
  "humidity": 62,
  "rainfall": 92,
  "ph": 6.7,
  "N": 82,
  "P": 42,
  "K": 38,
  "input_costs": 18000,
  "last_crop": "Ragi",
  "gender": "female"
}
```

### Response Highlights

```json
{
  "ok": true,
  "result": {
    "top_crop": "Ragi",
    "profit_estimate": 36000,
    "weather_flag": "AMBER",
    "drought_risk": {
      "level": "WATCH",
      "switch_recommended": false
    },
    "profitability_comparison": [],
    "government_schemes": [],
    "soil_alerts": [],
    "shap_reasons": [],
    "kannada_summary": "...",
    "crop_rotation": {},
    "soil_health_pdf_available": false,
    "mandi_price_voice_available": false,
    "details": {}
  }
}
```

### Other Endpoints

- GET /
- GET /health
- GET /public/<path>

---

## Project Structure

```text
Rytha_Gelathi/
├── api/
│   └── server.py
├── crew/
│   └── krishi_crew.py
├── frontend/
│   ├── index.html
│   ├── core.html
│   ├── styles.css
│   ├── core.css
│   ├── app.js
│   └── core.js
├── tools/
│   ├── market_price_tool.py
│   └── Karnataka_mandi_prices.json
├── public/
├── run_demo.py
├── verify_enhancements.py
├── requirements.txt
├── PROJECT_PLAN.md
├── ENHANCEMENTS_SUMMARY.md
└── README.md
```

---

## Quick Start

### 1) Clone

```bash
git clone https://github.com/Yashaswini-V21/Rytha_Gelathi.git
cd Rytha_Gelathi
```

### 2) Create Environment

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
python -m venv .venv
source .venv/bin/activate
```

### 3) Install Dependencies

```bash
pip install -r requirements.txt
```

### 4) Configure Keys

Windows:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

### 5) Run API

```bash
python api/server.py
```

Open:

- Landing: http://127.0.0.1:8000
- Advisory: http://127.0.0.1:8000/core.html
- Health: http://127.0.0.1:8000/health

---

## Environment Variables

Required:

- GROQ_API_KEY
- OPENWEATHER_API_KEY
- BHASHINI_API_KEY

Optional:

- AGMARKNET_API_KEY
- AGMARKNET_API_URL
- AGMARKNET_API_TOKEN
- AGMARKNET_AUTH_HEADER
- AGMARKNET_STATIC_PATH
- CROP_DATASET_PATH
- KARNATAKA_SOIL_JSON_PATH
- API_HOST
- API_PORT

---

## Validation and Testing

Primary checks:

- python -m py_compile crew/krishi_crew.py api/server.py
- python verify_enhancements.py

Notes:

- Python 3.10 to 3.12 is recommended for strongest ecosystem compatibility.
- External API availability and key configuration affect live behavior.

---

## Roadmap

1. Add persistent farmer profile and recommendation history
2. Improve STT production path with secure backend relay
3. Add integration tests for API response schema
4. Add district-level analytics and monitoring dashboard

---

## Future Enhancements

Six next-step upgrades that would make the platform even stronger:

1. Add farmer profile memory so each advisory learns from past seasons and saved soil history.
2. Add district-level historical weather datasets to improve drought prediction beyond forecast-only signals.
3. Add multilingual voice support beyond Kannada so more regional users can use the same flow.
4. Add offline cached advisory packs for low-connectivity villages and repeated farm visits.
5. Add photo-based crop stress detection for leaf and disease symptoms using lightweight vision models.
6. Add a district dashboard for extension officers to monitor crop patterns, alerts, and scheme uptake.

---

## Team

- Yashaswini V - Data Science and AI/ML
- Darshini K.H - Full Stack Developer

Team: harvest hex harvesters

---

## License

Open-source under MIT License.
See LICENSE for complete terms.

---

<!-- FARMING STYLE FOOTER -->
<div align="center">

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=0,2,6,11,20&height=160&section=header&text=Built%20for%20Farmers%20of%20Karnataka&fontSize=34&fontColor=ffffff&animation=fadeIn" width="100%"/>

[![Focus](https://img.shields.io/badge/Focus-Women_Farmers-15803d?style=for-the-badge)](.)
[![Language](https://img.shields.io/badge/Language-Kannada-f59e0b?style=for-the-badge)](.)
[![Stack Cost](https://img.shields.io/badge/Stack_Cost-Zero_Cost_Optimized-166534?style=for-the-badge)](.)
[![Explainable](https://img.shields.io/badge/Trust-SHAP_Explainable-1d4ed8?style=for-the-badge)](.)

### If this project helped you, please star the repository

[![Star RythaGelathi](https://img.shields.io/badge/Star-RythaGelathi-111827?style=for-the-badge&logo=github)](https://github.com/Yashaswini-V21/Rytha_Gelathi)

Built with care for women farmers in Karnataka.

ಕೃಷಿಗೆ ಸ್ಪಷ್ಟತೆ · ರೈತನಿಗೆ ಶಕ್ತಿ

<p><strong>From uncertainty to confident sowing decisions.</strong></p>

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=110&section=footer&animation=fadeIn" width="100%"/>

</div>

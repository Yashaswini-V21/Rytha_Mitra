# RythaGelathi - Project Plan and Architecture Reference

Created: March 30, 2026  
Last Updated: April 2, 2026  
Status: Active Development  
Owner: Team Harvest Hex Harvesters  
Repository: Rytha_Gelathi

## Table of Contents

1. Executive Summary
2. Current State Audit
3. Problem and User Need
4. Solution Flow
5. What Makes RythaGelathi Different
6. Technical Architecture
7. Technology Stack
8. Folder Structure
9. API Contract
10. Phase-by-Phase Plan
11. Technical Decisions
12. Risks and Mitigations
13. Deployment Plan
14. Demo Checklist

---

## 1) Executive Summary

RythaGelathi is an AI crop advisory platform built for women farmers in Karnataka.

It converts practical farm inputs into a clear, explainable recommendation and returns guidance in Kannada. The system is designed for low-connectivity scenarios using an offline-capable core and graceful fallback around external APIs.

### What is implemented now

**Core Features:**
- Random Forest crop recommendation
- Measured model accuracy returned in API output
- SHAP explainability per recommendation
- Market signal from Agmarknet-compatible source with static fallback
- Weather compatibility signal from OpenWeatherMap (7-day aggregation)
- Advisory generation via Groq LLaMA
- Kannada translation via Bhashini
- Kannada audio payload support for in-app playback

**New Enhancements (April 2, 2026):**
- ✨ **Crop Rotation Memory**: Recommends rotation partner for last season's crop with agronomy reasoning
- ✨ **Live Mandi Price Voice**: Generates Kannada audio alert for current market prices
- ✨ **Soil Health Card PDF**: Downloads Kannada-labeled soil health report with color-coded NPK status
- ✨ **Kannada Voice Input (STT)**: Farmers speak farm conditions in Kannada; system auto-fills form fields

### Intended impact

- Better crop decisions for underserved women farmers
- Higher trust through explanation, not black-box output
- Accessible local-language guidance with voice support

---

## 2) Current State Audit

### Repository-verified implementation

| Layer | Status | Notes |
|------|--------|-------|
| Frontend experience | Done | Landing + advisory UI in HTML/CSS/JS |
| Backend API | Done | Flask API with recommendation endpoint |
| Orchestration | Done | CrewAI-based multi-step flow |
| Crop recommendation | Done | Random Forest integrated |
| Accuracy reporting | Done | RF accuracy returned in response |
| Explainability | Done | SHAP reason extraction integrated |
| Market signal | Done | Tool + static JSON fallback |
| Weather signal | Done | OpenWeatherMap integration path |
| Kannada output | Done (API dependent) | Bhashini translation + TTS payload support |
| LLM advisory narrative | Done (API dependent) | Groq LLaMA integrated |
| **Crop Rotation Memory** | **Done** | **8-crop rotation database + recommendation function** |
| **Mandi Price Voice** | **Done** | **Bhashini TTS integration for Kannada audio alerts** |
| **Soil Health PDF** | **Done** | **ReportLab PDF generation with color-coded NPK status** |
| **Voice Input (STT)** | **Done** | **Bhashini ASR + form auto-fill from Kannada speech** |

### Pending capabilities

| Capability | Status | Notes |
|-----------|--------|-------|
| Persistent database | Pending | No Supabase/PostgreSQL layer yet |
| Multi-user auth/history | Pending | No tenant-level auth yet |
| IoT ingestion endpoint | Pending | No Raspberry Pi upload API yet |
| Automated tests | Partial | Needs unit + integration coverage |

---

## 3) Problem and User Need

Existing crop advisories are often generic, hard to trust, and not accessible in local language.

For women farmers in Karnataka, common issues are:

- Advice not available in Kannada
- Text-only output that assumes literacy
- Black-box suggestions without explanation
- Weather and market context split across multiple apps

RythaGelathi addresses this with one explainable, local-language advisory flow.

---

## 4) Solution Flow

1. Farmer enters district and farm conditions.
2. Random Forest predicts top crop options.
3. SHAP explains key drivers of the recommendation.
4. Market and weather layers add practical risk/profit context.
5. Groq generates concise advisory language.
6. Bhashini returns Kannada translation and audio payload.

### User-facing output

- Top crop recommendation
- SHAP reason list
- Weather compatibility flag
- Profit estimate and market context
- Kannada text summary
- Kannada audio playback (if TTS response is available)

---

## 5) What Makes RythaGelathi Different

RythaGelathi combines seven capabilities in one flow that most crop advisory apps do not provide together.

### 1. Kannada Voice Output via Bhashini

- Voice-ready Kannada advisory for low-literacy usage
- Bhashini translation + TTS payload integrated

### 2. SHAP Explainability Per Recommendation

- Explains why a crop is recommended
- Reason list is returned for each recommendation

### 3. Offline-First Core

- Core recommendation path can run without external APIs
- External services enrich output when available

### 4. Built for Women Farmers in Karnataka

- Product narrative and UX are designed for this primary beneficiary

### 5. Weather-Crop Compatibility in Same Screen

- Weather risk signal is part of advisory, not a separate tool

### 6. Zero-Cost-Oriented Stack

- Architecture is optimized for low recurring cost in MVP stage

### 7. External Validation Signal

- Climate-action competition positioning supports credibility

---

## 6) Technical Architecture

```text
Frontend (HTML/CSS/JS)
   -> Flask API (/api/recommend)
      -> KrishiCrew orchestration
         -> Random Forest recommendation
         -> SHAP explanation
         -> Market tool
         -> Weather tool
         -> Groq narrative layer
         -> Bhashini translation + TTS payload
   -> Structured JSON rendered in UI
```

### Design principles

- Deterministic decision core
- Explainability by default
- Graceful API degradation
- Single-screen advisory experience

---

## 7) Technology Stack

### Backend

- Python 3.10+
- Flask, Flask-CORS
- CrewAI

### AI and data

- scikit-learn (Random Forest)
- SHAP
- pandas, numpy

### Integrations

- Groq LLaMA
- Bhashini API
- OpenWeatherMap API
- Agmarknet-compatible source + local JSON fallback

### Frontend

- HTML, CSS, vanilla JavaScript

---

## 8) Folder Structure

```text
Rytha_Gelathi/
|-- api/
|   `-- server.py
|-- crew/
|   `-- krishi_crew.py
|-- frontend/
|   |-- index.html
|   |-- core.html
|   |-- styles.css
|   |-- core.css
|   |-- app.js
|   `-- core.js
|-- tools/
|   |-- market_price_tool.py
|   `-- Karnataka_mandi_prices.json
|-- public/
|-- requirements.txt
|-- run_demo.py
|-- README.md
`-- PROJECT_PLAN.md
```

---

## 9) API Contract

### POST /api/recommend

Request example:

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
  "input_costs": 18000
}
```

Response shape (important fields):

```json
{
  "ok": true,
  "inputs": {},
  "result": {
    "top_crop": "",
    "profit_estimate": 0,
    "model_accuracy": 0.0,
    "weather_flag": "GREEN|AMBER|RED",
    "soil_alerts": [],
    "shap_reasons": [],
    "kannada_summary": "",
    "kannada_audio_available": false,
    "kannada_audio_base64": "",
    "kannada_audio_mime": "",
    "details": {}
  }
}
```

Other endpoints:

- GET /
- GET /health
- GET /public/<path>

---

## 10) Phase-by-Phase Plan

Legend: [x] complete, [ ] pending.

### Phase 1: Core Platform

- [x] Flask API foundation
- [x] Advisory endpoint input mapping
- [x] Frontend landing and advisory screens
- [x] Crew orchestration baseline

### Phase 2: Intelligence Core

- [x] Random Forest integration
- [x] SHAP explanation integration
- [x] Market signal integration
- [x] Weather signal integration
- [x] Groq advisory layer
- [x] Bhashini translation and TTS payload support
- [x] RF accuracy reporting in API output

### Phase 3: Reliability Hardening

- [ ] Standardize retries and timeouts for all external APIs
- [ ] Add structured logging and trace IDs
- [ ] Add smoke tests for /health and /api/recommend
- [ ] Add explicit fallback status in response payload

### Phase 4: Product Maturity

- [ ] Recommendation history persistence
- [ ] User/farm profiles and authentication
- [ ] Offline cache for recent advisory outputs
- [ ] Basic analytics dashboard

---

## 11) Technical Decisions

### Why model-first and LLM-assisted

- Deterministic recommendation behavior
- Explainability via SHAP
- LLM used for language clarity, not numeric decision truth

### Why Flask at this stage

- Lower complexity for hackathon delivery
- Faster integration/debug cycle
- Straightforward future migration path

### Why hardware is optional in MVP

- Manual mode keeps adoption barrier low
- Core value is decision support, not mandatory IoT

---

## 12) Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| External API downtime | Partial feature loss | Retries, timeouts, and fallback responses |
| Dataset drift | Recommendation quality drop | Dataset checks and periodic validation |
| Low test coverage | Regression risk | Unit and integration test suite |
| No persistence | Weak learning loop | Add recommendation logging storage |

---

## 13) Deployment Plan

### Local

- Run: python api/server.py
- Required env keys for full feature path:
  - GROQ_API_KEY
  - OPENWEATHER_API_KEY
  - BHASHINI_API_KEY

### Hosted path

1. Containerize Flask app
2. Deploy API to Railway or Render
3. Serve frontend via API static hosting or separate static host
4. Monitor /health uptime

---

## 14) Demo Checklist

- [ ] Complete run from input to final advisory
- [ ] SHAP explanation visible
- [ ] Kannada summary visible
- [ ] Kannada audio playback demonstrated
- [ ] Weather flag shown
- [ ] Market/profit signal shown
- [ ] Offline-core behavior explained clearly
- [ ] README and PROJECT_PLAN are consistent

---

This document is the single source of truth for project plan and project summary.
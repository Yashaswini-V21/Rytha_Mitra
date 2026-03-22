# RythaGelathi — ರೈತ ಗೆಳತಿ

<div align="center">

<img src="https://img.shields.io/badge/RythaGelathi-ರೈತ%20ಗೆಳತಿ-2d6a4f?style=for-the-badge" />

### AI Climate Advisor for Women Farmers of Karnataka

**Now powered with Groq LLaMA + CrewAI orchestration for climate-aware farm decisions.**

[![WitchHunt 2026](https://img.shields.io/badge/WitchHunt-2026-orange?style=flat-square)](.)
[![Climate Action](https://img.shields.io/badge/Theme-Climate%20Action%20%232-2d6a4f?style=flat-square)](.)
[![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square&logo=python)](.)
[![Streamlit](https://img.shields.io/badge/Streamlit-App-red?style=flat-square&logo=streamlit)](.)
[![Free Stack](https://img.shields.io/badge/Cost-₹0%20Free%20Stack-brightgreen?style=flat-square)](.)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](.)

**Team: harvest hex harvesters 🌾**

</div>

---

## 🌾 The Problem

> **287 farmer suicides** in Karnataka in 2024. Most caused by crop failure from unpredictable rainfall.

| Stat | Reality |
|------|---------|
| 62 lakh women | do the majority of farm work in Karnataka |
| 73% | receive zero personalised farming advisory |
| 0 | AI tools exist specifically built for them |

The government SMS they receive? The **same generic bulletin** for every farmer in the district — whether you have 2 acres of rain-fed land in Raichur or 20 acres with drip irrigation in Bengaluru.

**RythaGelathi changes that.**

---

## 💡 What RythaGelathi Does

A woman farmer opens RythaGelathi on her phone.
She selects her **district**, **current crop**, **land size**, and **water source**.
That is all.

She receives — **in Kannada** — four things:

| Feature | What it does |
|---------|--------------|
| 🌱 **Crop Recommender** | ML model recommends top 3 crops most likely to survive *this season's* rainfall — with SHAP explanation, not generic advice |
| 💧 **Irrigation Scheduler** | 7-day forecast → exact daily irrigation window, litres per acre, days to skip |
| 🐛 **Pest Risk Alert** | Temperature + humidity → pest probability this week with organic intervention advice |
| ⚗️ **Fertilizer Optimizer** | Soil + crop + growth stage → exact NPK in kg/acre and money saved vs typical overuse |

**Plus:** KVK centre map · KSSC subsidy scheme links · WhatsApp share button

---

## 🧠 Agentic Intelligence (CrewAI)

RythaGelathi runs a **4-agent CrewAI pipeline** that mirrors real advisory workflow:

| Agent | Role | Output |
|------|------|--------|
| **CropAdvisor** | Random Forest (100 trees, max depth 10) + SHAP | Top 3 crops + explainability reasons |
| **MarketAnalyst** | Agmarknet mandi price intelligence | Price + profit projection |
| **WeatherIntel** | OpenWeatherMap 7-day forecast | GREEN / AMBER / RED compatibility |
| **SoilExpert** | Karnataka soil health checks | Nutrient deficiency alerts |

Final recommendation is translated to **Kannada** using Bhashini API.

---

## 🎯 Proposal Snapshot (Hackathon)

This project addresses the Climate Action challenge by solving one clear gap:

- Women farmers in Karnataka receive generic advisories not tailored to land size, crop, water source, or district weather risk.
- A bad crop choice in drought-prone districts directly leads to debt stress and income loss.
- RythaGelathi provides district-level personalized, explainable, and local-language recommendations designed for real field decisions.

Target geography: Raichur, Kalaburagi, Vijayapura, Bidar, Koppal, Davanagere, Chitradurga, Tumakuru.

---

## 🔬 How the ML Works

```
User Input  →  district + crop + land size + water source
                            ↓
          OpenWeatherMap API — live weather + 7-day forecast
                            ↓
        Rainfall Anomaly Feature — this season vs historical avg
                            ↓
         Random Forest Model — trained on 2,200 crop samples
                            ↓
       SHAP Explainer — "rainfall deficit matters 3× more than temperature"
                            ↓
            Bhashini API — full Kannada translation
                            ↓
     Output: Crop + Irrigation + Pest + Fertilizer advice in Kannada
```

---

## 🏗️ System Design Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FARMER (Mobile Browser)                      │
│           Selects: District · Crop · Land Size · Water Source       │
└─────────────────────────┬───────────────────────────────────────────┘
                          │  HTTP Request
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     STREAMLIT FRONTEND (app.py)                     │
│                  Kannada UI · Mobile-first design                   │
└────┬──────────────┬──────────────┬──────────────┬───────────────────┘
     │              │              │              │
     ▼              ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ WEATHER  │  │    ML    │  │   MAPS   │  │TRANSLATE │
│ MODULE   │  │  ENGINE  │  │  MODULE  │  │  MODULE  │
│weather.py│  │train_    │  │kvk_      │  │translate │
│          │  │model.py  │  │centres.py│  │  .py     │
│OpenWeath-│  │          │  │          │  │          │
│erMap API │  │ Random   │  │  Folium  │  │ Bhashini │
│7-day fore│  │ Forest   │  │ KVK map  │  │   API    │
│cast+live │  │  +SHAP   │  │ KSSC     │  │ (Kannada)│
│  weather │  │explainer │  │  links   │  │          │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │              │
     ▼             ▼             │              │
┌──────────┐  ┌──────────┐      │              │
│live temp │  │crop_model│      │              │
│humidity  │  │  .pkl    │      │              │
│rainfall  │  │shap_     │      │              │
│anomaly   │  │explainer │      │              │
│7-day     │  │  .pkl    │      │              │
│forecast  │  └────┬─────┘      │              │
└────┬─────┘       │            │              │
     │             ▼            │              │
     │    ┌─────────────────┐   │              │
     │    │   4 ENGINES     │   │              │
     │    │─────────────────│   │              │
     ├───▶│ 🌱 Crop Rec     │   │              │
     ├───▶│ 💧 Irrigation   │   │              │
     ├───▶│ 🐛 Pest Risk    │   │              │
     └───▶│ ⚗️  Fertilizer  │   │              │
          └──────┬──────────┘   │              │
                 │              │              │
                 └──────┬───────┘              │
                        │                     │
                        ▼                     │
              ┌──────────────────┐            │
              │   RAW OUTPUT     │            │
              │  (English JSON)  │            │
              └────────┬─────────┘            │
                       │                      │
                       └──────────────────────┘
                                  │
                                  ▼  Bhashini translates everything
                       ┌──────────────────────┐
                       │    FINAL OUTPUT      │
                       │    in Kannada 🇮🇳    │
                       │──────────────────────│
                       │ ✅ Top 3 crop advice  │
                       │ ✅ Daily irrigation   │
                       │ ✅ Pest risk alert    │
                       │ ✅ Fertilizer guide   │
                       │ ✅ KVK centre map     │
                       │ ✅ KSSC subsidy link  │
                       │ ✅ WhatsApp share btn │
                       └──────────────────────┘
```

### Layer-by-Layer Breakdown

| Layer | File(s) | What it does |
|-------|---------|--------------|
| **Input** | `app.py` | Streamlit UI — collects district, crop, land size, water source |
| **Weather** | `modules/weather.py` | Calls OpenWeatherMap → live temp, humidity, 7-day forecast, rainfall anomaly |
| **ML Engine** | `model/train_model.py` + `.pkl` files | Random Forest predicts top 3 crops · SHAP explains why |
| **Irrigation** | `modules/irrigation.py` | Weather forecast → daily watering schedule (time + litres) |
| **Pest Risk** | `modules/pest.py` | Temp + humidity → pest probability + organic intervention |
| **Fertilizer** | `modules/fertilizer.py` | Crop + growth stage → exact NPK kg/acre + savings vs overuse |
| **Maps** | `maps/kvk_centres.py` | Folium map → nearest KVK centre + KSSC subsidy links |
| **Translation** | `modules/translate.py` | Bhashini API → all outputs in natural Kannada |
| **Output** | `app.py` | Displays full advice + WhatsApp share button |

---

## 🛠️ Tech Stack

> 💰 Total cost: **₹0** — 100% free tools

| Layer | Tool | Why |
|-------|------|-----|
| ML Model | `Scikit-learn` Random Forest | Accurate, explainable, runs locally |
| Explainability | `SHAP` | Farmer sees *why* — not just *what* |
| Weather | OpenWeatherMap API | 1,000 free calls/day, 7-day forecast |
| Frontend | `Streamlit` | Mobile browser, no app install needed |
| Maps | `Folium` | KVK centre locator with directions |
| Translation | Bhashini API | Government of India — best Kannada accuracy |
| Dataset | Kaggle Crop Dataset | 2,200 samples, N-P-K + weather + labels |
| Deployment | Streamlit Cloud | Free live public URL |

---

## 🗺️ Districts Covered

```
High Risk    →  Raichur · Kalaburagi · Vijayapura · Bidar · Koppal
Medium Risk  →  Davanagere · Chitradurga · Tumkur
```

Karnataka's 8 most drought-prone districts — the ones that appear on the state drought declaration list every single year.

---

## 📸 Demo

> 🚧 Prototype in progress — demo link coming March 2026

**Example output for Lakshmi, Raichur district:**

```
📍 District   : Raichur
🌡️ Weather    : 39°C · 18% humidity · 31% rainfall deficit this season

🌱 Crop       : Switch from cotton (84% failure risk)
                → toor dal (74% success) — drought-resistant
                → jowar   (71% success) — low water requirement

💧 Irrigation : Water 5:30am–7am tomorrow
                Skip Day 3 — rain forecast (4.2mm expected)

🐛 Pest       : Aphid risk 62% this week
                Check undersides of leaves on Day 4

⚗️ Fertilizer : Apply 35 kg Urea/acre  (not 65 kg)
                Save ₹840/acre this cycle
```

---

## 🚀 Run Locally

```bash
# Clone the repo
git clone https://github.com/Yashaswini-V21/Rytha_Gelathi.git
cd Rytha_Gelathi

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Fill keys in .env: GROQ, OpenWeather, Bhashini, Agmarknet

# Run CrewAI demo pipeline
python run_demo.py

# Start web app (Flask + static frontend)
python api/server.py
```

Open:

- Landing page: `http://127.0.0.1:8000`
- Core advisory page: `http://127.0.0.1:8000/core.html`

Current frontend includes:

- Modern landing page with climate-story sections
- Dedicated core advisory page with tabbed workflow
- Flask API integration for `/api/recommend`
- Responsive layout and animations for demo/judging flow

### Judge Quick Test

```bash
python run_demo.py
```

This prints a structured JSON with:

- `top_crop`
- `profit_estimate`
- `weather_flag`
- `soil_alerts`
- `shap_reasons`
- `kannada_summary`

---

## 📁 Project Structure

```
Rytha_Gelathi/
│
├── crew/
│   └── krishi_crew.py            # 4-agent CrewAI pipeline
│
├── tools/
│   ├── market_price_tool.py      # Agmarknet mandi price tool with fallback cache
│   └── Karnataka_mandi_prices.json
│
├── api/
│   └── server.py                 # Flask server, routes, static serving, /api/recommend
├── crew/
│   └── krishi_crew.py            # CrewAI orchestration and recommendation logic
├── frontend/
│   ├── index.html                # Landing page
│   ├── core.html                 # Main advisory UI page
│   ├── styles.css                # Shared styles
│   └── app.js                    # Shared frontend behavior + API integration
├── public/
│   └── ...                       # Images and static media
├── tools/
│   ├── market_price_tool.py      # Mandi price tool
│   └── Karnataka_mandi_prices.json
├── run_demo.py                   # One-command end-to-end demo
├── requirements.txt              # Python dependencies
└── README.md
```

---

## 👩‍💻 Team

<div align="center">

| | Name | Role |
|---|---|---|
| 🌟 | **Yashaswini V** | Data Science & AI/ML · BCA |
| 🌟 | **Darshini K.H** | Full Stack & Cloud · BE |

**Team Name: harvest hex harvesters 🌾**

</div>

---

## 🏆 Built For

<div align="center">

**WitchHunt 2026** · HopeWorks Foundation · AI4India

Theme: **Climate Action — Problem Statement #2**

*"Leverage AI to help farmers in climate-vulnerable regions by optimizing irrigation, reducing fertilizer use, and recommending climate-resilient crops."*

</div>

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Made with 💚 for the 62 lakh women farmers of Karnataka**

*ರೈತ ಗೆಳತಿ — The Farmer's Friend*

</div>

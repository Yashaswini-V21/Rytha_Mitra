# RythaGelathi — ರೈತ ಗೆಳತಿ

<div align="center">

<img src="https://img.shields.io/badge/RythaGelathi-ರೈತ%20ಗೆಳತಿ-2d6a4f?style=for-the-badge" />

### AI Climate Advisor for Women Farmers of Karnataka

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

# Add your API key
cp .env.example .env
# Add OPENWEATHER_API_KEY=your_key_here in .env

# Run the app
streamlit run app.py
```

---

## 📁 Project Structure

```
Rytha_Gelathi/
│
├── app.py                        # Main Streamlit app — entry point
│
├── model/
│   ├── train_model.py            # Random Forest training script
│   ├── crop_model.pkl            # Saved trained model
│   └── shap_explainer.pkl        # SHAP explainer object
│
├── modules/
│   ├── weather.py                # OpenWeatherMap API integration
│   ├── irrigation.py             # Irrigation scheduler logic
│   ├── pest.py                   # Pest risk calculator
│   ├── fertilizer.py             # Fertilizer optimizer (NPK)
│   └── translate.py              # Bhashini Kannada translation
│
├── data/
│   └── crop_dataset.csv          # Kaggle crop recommendation dataset
│
├── maps/
│   └── kvk_centres.py            # KVK centre Folium map generator
│
├── .env.example                  # API key template
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

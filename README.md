# RythaGelathi — ರೈತ ಗೆಳತಿ

<div align="center">

![RythaGelathi Banner](https://img.shields.io/badge/RythaGelathi-ರೈತ%20ಗೆಳತಿ-green?style=for-the-badge&logo=leaf)

**AI Climate Advisor for Women Farmers of Karnataka**

[![WitchHunt 2026](https://img.shields.io/badge/WitchHunt-2026-orange?style=flat-square)](.)
[![Climate Action](https://img.shields.io/badge/Theme-Climate%20Action-green?style=flat-square)](.)
[![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square&logo=python)](.)
[![Streamlit](https://img.shields.io/badge/Streamlit-App-red?style=flat-square&logo=streamlit)](.)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](.)
[![Free Tools](https://img.shields.io/badge/Cost-₹0%20Free%20Stack-brightgreen?style=flat-square)](.)

</div>

---

## 🌾 The Problem

> **287 farmer suicides** in Karnataka in 2024. Most caused by crop failure from unpredictable rainfall.

**62 lakh women** do the majority of farm work in Karnataka.  
**73%** receive no personalised farming advisory.  
**0** AI tools exist specifically built for them.

The government SMS they receive? Same generic bulletin for every farmer in the district — whether you have 2 acres of rain-fed land in Raichur or 20 acres with drip irrigation in Bengaluru.

**RythaGelathi changes that.**

---

## 💡 What RythaGelathi Does

A woman farmer opens RythaGelathi on her phone.  
She selects her **district**, **current crop**, **land size**, and **water source**.  
That is all.

She receives — **in Kannada** — four things:

| Feature | What it does |
|---|---|
| 🌱 **Crop Recommender** | ML model recommends top 3 crops most likely to survive *this season's* rainfall with SHAP explanation — not generic advice |
| 💧 **Irrigation Scheduler** | 7-day forecast → exact daily irrigation window, litres per acre, days to skip |
| 🐛 **Pest Risk Alert** | Temperature + humidity → pest probability this week with organic intervention advice |
| ⚗️ **Fertilizer Optimizer** | Soil + crop + growth stage → exact NPK in kg/acre and money saved vs typical overuse |

**Plus:** KVK centre map · KSSC subsidy scheme links · WhatsApp share button

---

## 🛠️ Tech Stack

> 💰 Total cost: **₹0** — 100% free tools

| Layer | Tool | Why |
|---|---|---|
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
High Risk    → Raichur · Kalaburagi · Vijayapura · Bidar · Koppal
Medium Risk  → Davanagere · Chitradurga · Tumkur
```

These are Karnataka's 8 most drought-prone districts — the ones that appear on Karnataka's drought declaration list every year.

---

## 🔬 How the ML Works

```
User Input (district + crop + land + water)
        ↓
OpenWeatherMap API → live weather + 7-day forecast
        ↓
Rainfall Anomaly Feature → this season vs historical average
        ↓
Random Forest Model → trained on 2,200 crop samples
        ↓
SHAP Explainer → "rainfall deficit matters 3× more than temperature"
        ↓
Bhashini API → full Kannada translation
        ↓
Output: Crop + Irrigation + Pest + Fertilizer advice
```

---

## 📸 Demo

> 🚧 Prototype in progress — demo link coming March 2026

**Example output for Lakshmi, Raichur district:**
- Weather: 39°C · 18% humidity · 31% rainfall deficit this season
- Recommendation: Switch from cotton (84% failure risk) → toor dal (74% success)
- Irrigation: Water 5:30am–7am tomorrow. Skip Day 3 — rain forecast.
- Pest: Aphid risk 62% this week — check leaves on Day 4
- Fertilizer: Apply 35 kg Urea/acre (not 65 kg) — save ₹840/acre

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
# Add OPENWEATHER_API_KEY in .env

# Run the app
streamlit run app.py
```

---

## 📁 Project Structure

```
Rytha_Gelathi/
├── app.py                  # Main Streamlit app
├── model/
│   ├── train_model.py      # Random Forest training
│   ├── crop_model.pkl      # Saved model
│   └── shap_explainer.pkl  # SHAP explainer
├── modules/
│   ├── weather.py          # OpenWeatherMap integration
│   ├── irrigation.py       # Irrigation scheduler
│   ├── pest.py             # Pest risk calculator
│   ├── fertilizer.py       # Fertilizer optimizer
│   └── translate.py        # Bhashini Kannada translation
├── data/
│   └── crop_dataset.csv    # Kaggle crop dataset
├── maps/
│   └── kvk_centres.py      # KVK centre Folium map
├── requirements.txt
└── README.md
```

---

## 👩‍💻 Team

| Name
|---
| **Yashaswini V** 
| **Darshini KH** 
---

## 🏆 Built For

**WitchHunt 2026** · HopeWorks Foundation  
Theme: **Climate Action — Problem Statement #2**  
*"Leverage AI to help farmers in climate-vulnerable regions by optimizing irrigation, reducing fertilizer use, and recommending climate-resilient crops."*

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Made with 💚 for the women farmers of Karnataka**

*ರೈತ ಗೆಳತಿ — The Farmer's Female Companion*

</div>

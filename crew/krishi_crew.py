from __future__ import annotations

import base64
import json
import os
import re
from io import StringIO
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests

try:
    import numpy as np
except ImportError:  # pragma: no cover
    np = None  # type: ignore[assignment]

try:
    import pandas as pd
except ImportError:  # pragma: no cover
    pd = None  # type: ignore[assignment]

try:
    import shap
except ImportError:  # pragma: no cover
    shap = None  # type: ignore[assignment]

try:
    from sklearn.ensemble import RandomForestClassifier
except ImportError:  # pragma: no cover
    RandomForestClassifier = None  # type: ignore[assignment]

try:
    from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
    from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
except ImportError:  # pragma: no cover
    accuracy_score = None  # type: ignore[assignment]
    classification_report = None  # type: ignore[assignment]
    confusion_matrix = None  # type: ignore[assignment]
    StratifiedKFold = None  # type: ignore[assignment]
    cross_val_score = None  # type: ignore[assignment]
    train_test_split = None  # type: ignore[assignment]

try:
    from langchain_groq import ChatGroq
except ImportError:  # pragma: no cover
    ChatGroq = None  # type: ignore[assignment]

try:
    from crewai import Agent, Crew, Process, Task
    from crewai.tools import BaseTool
    CREWAI_AVAILABLE = True
except ImportError:
    CREWAI_AVAILABLE = False
    Agent = Any  # type: ignore[assignment]
    Crew = Any  # type: ignore[assignment]
    Process = Any  # type: ignore[assignment]
    Task = Any  # type: ignore[assignment]

    class BaseTool:  # pragma: no cover - local fallback when CrewAI is unavailable
        name: str = ""
        description: str = ""

        def _run(self, *args: Any, **kwargs: Any) -> str:
            raise NotImplementedError

from tools.market_price_tool import AgmarknetPriceTool


FEATURE_COLUMNS = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
DEFAULT_MODEL_PATH = Path("model/crop_model.pkl")
DEFAULT_DATA_PATH = Path("data/crop_dataset.csv")
DEFAULT_SOIL_PATH = Path("data/karnataka_soil_health.json")

DEFAULT_YIELD_PER_ACRE = {
    "rice": 22.0,
    "ragi": 12.0,
    "maize": 20.0,
    "jowar": 10.0,
    "toor dal": 7.0,
    "cotton": 8.0,
}

CROP_ROTATION_MAP = {
    "rice": {"rotation": "groundnut", "reason_en": "Rice depletes nitrogen; groundnut fixes it", "reason_kn": "ಅರಿಶಿನ ನಂತರ ಮುಂಗಾರಿ ಉತ್ತಮ - ನೈಟ್ರೋಜನ್ ಸುಧಾರಕ"},
    "ragi": {"rotation": "groundnut", "reason_en": "Ragi depletes nitrogen; groundnut restores soil", "reason_kn": "ರಾಗಿ ನಂತರ ಮುಂಗಾರಿ - ಮಣ್ಣು ಸುಧಾರ"},
    "maize": {"rotation": "soybean", "reason_en": "Maize depletes nitrogen; soybean adds nitrogen", "reason_kn": "ಮೆಕ್ಕೆಜೋಳ ನಂತರ ಸೋಯಾ - ನೈಟ್ರೋಜನ್ ಸೇರಿಸುತ್ತದೆ"},
    "jowar": {"rotation": "bengalgram", "reason_en": "Sorghum is nitrogen-depleting; pulse fixes nitrogen", "reason_kn": "ಜೋವಾರಿ ನಂತರ ಬೇಳೆ - ನೈಟ್ರೋಜನ್ ಸ್ಥಿರತೆ"},
    "wheat": {"rotation": "mustard", "reason_en": "Wheat depletes nitrogen; mustard is nitrogen-fixing", "reason_kn": "ಗೋದಿ ನಂತರ ಸಾಸೆ - ಭೂಮಿ ಸಮೃದ್ಧಿ"},
    "groundnut": {"rotation": "ragi", "reason_en": "After nitrogen-fixing crop, grow nitrogen-demanding cereal", "reason_kn": "ಮುಂಗಾರಿ ನಂತರ ರಾಗಿ - ಸುಸಂಪನ್ನ ಮಣ್ಣಿನಿಂದ ಲಾಭ"},
    "soybean": {"rotation": "rice", "reason_en": "After soybean, nitrogen-rich soil supports rice well", "reason_kn": "ಸೋಯಾ ನಂತರ ಅರಿಶಿ - ಉತ್ತಮ ಇಳುವರಿ"},
    "bengalgram": {"rotation": "jowar", "reason_en": "Pulse followed by sorghum is a stable rotation", "reason_kn": "ಬೇಳೆ ನಂತರ ಜೋವಾರಿ - ರೈತ ಸುಖ"},
}

CROP_PROFITABILITY_FACTORS = {
    "rice": {"cultivation_cost": 25000, "yield_variance": 0.15},
    "ragi": {"cultivation_cost": 18000, "yield_variance": 0.12},
    "maize": {"cultivation_cost": 20000, "yield_variance": 0.18},
    "jowar": {"cultivation_cost": 16000, "yield_variance": 0.10},
    "groundnut": {"cultivation_cost": 22000, "yield_variance": 0.20},
    "soybean": {"cultivation_cost": 19000, "yield_variance": 0.16},
    "bengalgram": {"cultivation_cost": 17000, "yield_variance": 0.14},
    "wheat": {"cultivation_cost": 21000, "yield_variance": 0.11},
}

DROUGHT_TOLERANT_CROPS = {
    "ragi",
    "jowar",
    "toor dal",
    "groundnut",
    "bengalgram",
    "millet",
}

# Approximate 15-day historical rainfall normals (mm) used for drought risk context.
DISTRICT_RAINFALL_NORMAL_15D = {
    "raichur": 38.0,
    "kalaburagi": 42.0,
    "vijayapura": 35.0,
    "bidar": 48.0,
    "koppal": 40.0,
    "davanagere": 58.0,
    "chitradurga": 52.0,
    "tumakuru": 62.0,
    "dharwad": 72.0,
    "hassan": 82.0,
    "shimoga": 95.0,
    "mysore": 68.0,
    "bangalore": 56.0,
    "belgaum": 84.0,
}


def _project_rainfall_15d(daily_rows: List[Dict[str, Any]]) -> float:
    """Project 15-day rainfall from available daily forecast rows."""
    if not daily_rows:
        return 0.0

    observed = [float(row.get("rain", 0.0) or 0.0) for row in daily_rows]
    observed_total = float(sum(observed))

    if len(observed) >= 15:
        return float(sum(observed[:15]))

    remaining_days = 15 - len(observed)
    tail = observed[-3:] if len(observed) >= 3 else observed
    projected_daily = float(sum(tail) / max(len(tail), 1))
    return observed_total + (projected_daily * remaining_days)


def _classify_drought_risk(
    district: str,
    avg_temp: float,
    rain_15d_projected: float,
    dry_day_ratio: float,
) -> Dict[str, Any]:
    """Enhancement 4: classify drought risk using 15-day projection + district historical normal."""
    district_norm = _normalize_text(district)
    historical_15d = DISTRICT_RAINFALL_NORMAL_15D.get(district_norm, 60.0)
    deficit_ratio = 0.0
    if historical_15d > 0:
        deficit_ratio = max(0.0, (historical_15d - rain_15d_projected) / historical_15d)

    temp_penalty = max(0.0, (avg_temp - 33.0) / 7.0)
    dryness_penalty = max(0.0, dry_day_ratio)
    drought_score = (deficit_ratio * 0.65) + (temp_penalty * 0.2) + (dryness_penalty * 0.15)

    if drought_score >= 0.8:
        level = "EMERGENCY"
    elif drought_score >= 0.6:
        level = "WARNING"
    elif drought_score >= 0.35:
        level = "WATCH"
    else:
        level = "NORMAL"

    return {
        "level": level,
        "score": round(drought_score, 3),
        "projected_rainfall_15d": round(rain_15d_projected, 2),
        "historical_rainfall_15d": round(historical_15d, 2),
        "deficit_pct": round(deficit_ratio * 100.0, 1),
        "dry_day_ratio": round(dry_day_ratio, 3),
    }


def _pick_drought_tolerant_crop(top_crops: List[str], market_rows: List[Dict[str, Any]]) -> Optional[str]:
    """Pick the best drought-tolerant crop prioritizing profitability ranking when possible."""
    for row in market_rows:
        crop_name = str(row.get("crop", ""))
        if _normalize_text(crop_name) in DROUGHT_TOLERANT_CROPS:
            return crop_name

    for crop in top_crops:
        if _normalize_text(str(crop)) in DROUGHT_TOLERANT_CROPS:
            return str(crop)

    return None


def _build_profitability_comparison(market_rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Enhancement 6: build side-by-side profitability for top 3 crops."""
    comparison: List[Dict[str, Any]] = []
    for row in market_rows[:3]:
        crop_name = str(row.get("crop", ""))
        crop_key = _normalize_text(crop_name)
        crop_factor = CROP_PROFITABILITY_FACTORS.get(crop_key, {"cultivation_cost": 19000})

        price = _safe_float(row.get("price_per_quintal"), 0.0)
        yield_per_acre = _safe_float(row.get("yield_per_acre"), 0.0)
        cultivation_cost = _safe_float(crop_factor.get("cultivation_cost"), 19000.0)
        net_profit_per_acre = (yield_per_acre * price) - cultivation_cost

        comparison.append(
            {
                "crop": crop_name,
                "expected_yield_per_acre": round(yield_per_acre, 2),
                "mandi_price_per_quintal": round(price, 2),
                "cultivation_cost_per_acre": round(cultivation_cost, 2),
                "net_profit_per_acre": round(net_profit_per_acre, 2),
            }
        )

    return comparison


def _build_profitability_voice_text(rows: List[Dict[str, Any]]) -> str:
    if not rows:
        return ""
    parts = []
    for row in rows[:3]:
        crop = str(row.get("crop", "Crop"))
        net = _safe_float(row.get("net_profit_per_acre"), 0.0)
        parts.append(f"{crop} gives Rs {int(net)} per acre")
    joined = "; ".join(parts)
    return f"Profitability comparison. {joined}."


def _match_government_schemes(inputs: Dict[str, Any], top_crop: Optional[str]) -> List[Dict[str, Any]]:
    """Enhancement 7: simple personalized scheme matcher for Karnataka farmers."""
    district = str(inputs.get("district", "Karnataka"))
    land_acres = _safe_float(inputs.get("land_acres"), 0.0)
    gender = _normalize_text(str(inputs.get("gender", "")))

    matches: List[Dict[str, Any]] = []

    matches.append(
        {
            "name": "PM-KISAN",
            "eligibility": "All eligible landholding farmer families",
            "why_matched": f"Land record present for {district}",
            "documents": ["Aadhaar", "Bank passbook", "Land RTC"],
            "nearest_center": f"Raitha Samparka Kendra, {district}",
        }
    )

    if land_acres > 0:
        matches.append(
            {
                "name": "KCC Loan (Kisan Credit Card)",
                "eligibility": "Cultivating farmers with land details",
                "why_matched": f"Operational land size: {round(land_acres, 2)} acres",
                "documents": ["Aadhaar", "Land record", "Bank account", "Passport photo"],
                "nearest_center": f"Primary Agriculture Credit Society / Bank, {district}",
            }
        )

    if top_crop:
        matches.append(
            {
                "name": "PMFBY Crop Insurance",
                "eligibility": "Farmers growing notified crops",
                "why_matched": f"Recommended crop: {top_crop}",
                "documents": ["Sowing proof", "Land details", "Bank account", "Aadhaar"],
                "nearest_center": f"Taluk Agriculture Office, {district}",
            }
        )

    if gender in {"female", "woman", "women"}:
        matches.append(
            {
                "name": "Raitha Siri Support (Karnataka)",
                "eligibility": "Women farmers and SHG-linked applicants",
                "why_matched": "Applicant marked as woman farmer",
                "documents": ["Aadhaar", "Land/lease proof", "SHG card (if available)", "Bank account"],
                "nearest_center": f"Women & Child / Agriculture help desk, {district}",
            }
        )

    return matches[:4]


def _get_rotation_recommendation(last_crop: str) -> Optional[Dict[str, Any]]:
    """Get crop rotation recommendation based on previous season's crop."""
    last_crop_norm = _normalize_text(last_crop)
    for crop, info in CROP_ROTATION_MAP.items():
        if _normalize_text(crop) == last_crop_norm:
            return {
                "last_crop": crop,
                "rotation_crop": info["rotation"],
                "reason_en": info["reason_en"],
                "reason_kn": info["reason_kn"],
            }
    return None


def _generate_kalasa_mandi_voice_text(crop: str, modal_price: float) -> str:
    """Generate Kannada voice text for mandi price."""
    price_str = f"₹{int(modal_price)}"
    return f"{crop} ದ ಬೆಲೆ {price_str} ರೂಪಾಯಿ ಪ್ರತಿ ಕ್ವಿಂಟ್. {crop} ತರುವ ಸಿದ್ಧತೆ ಮಾಡಿ."


def _synthesize_mandi_price_audio_sarvam(crop: str, district: str, modal_price: float) -> Dict[str, Any]:
    """
    Enhancement 2: Synthesize Kannada voice for current mandi price.
    Returns audio payload ready for frontend playback.
    """
    try:
        kannada_text = _generate_kalasa_mandi_voice_text(crop, modal_price)
        return _synthesize_kannada_audio_sarvam(kannada_text)
    except Exception:
        return {"available": False, "error": "Mandi price voice synthesis failed", "audio_base64": "", "audio_mime": ""}


def _generate_soil_health_card_pdf(
    n_value: float, p_value: float, k_value: float, ph_value: float, top_crop: str
) -> Dict[str, Any]:
    """
    Enhancement 3: Generate Kannada-labeled soil health card PDF.
    Returns base64-encoded PDF for frontend download.
    """
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.colors import HexColor, white, black
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas
        from reportlab.lib.styles import ParagraphStyle
        from io import BytesIO
        import base64

        # Create PDF buffer
        pdf_buffer = BytesIO()
        width, height = A4
        c = canvas.Canvas(pdf_buffer, pagesize=A4)

        # Colors for status indicators
        color_ok = HexColor("#10B981")
        color_warn = HexColor("#F59E0B")
        color_alert = HexColor("#EF4444")

        # Helper to determine status
        def get_status(value: float, ideal_min: float, ideal_max: float):
            if ideal_min <= value <= ideal_max:
                return "OK", color_ok
            elif value < ideal_min:
                return "LOW", color_warn
            else:
                return "HIGH", color_alert

        # Header
        c.setFont("Helvetica-Bold", 24)
        c.drawString(2 * mm, height - 2 * mm - 24, "ಮಡಿ ಆರೋಗ್ಯ ಕಾರ್ಡ್")  # "Soil Health Card" in Kannada
        c.setFont("Helvetica", 12)
        c.drawString(2 * mm, height - 3.5 * mm - 24, "Soil Health Card")

        # Crop recommendation
        c.setFont("Helvetica-Bold", 12)
        c.drawString(2 * mm, height - 5 * mm - 24, f"ಶಿಫಾರಸುಪಡಿಸಿದ ಸಸ್ಯ: {top_crop}")
        c.setFont("Helvetica", 10)
        c.drawString(2 * mm, height - 5.8 * mm - 24, "Recommended Crop: " + top_crop)

        # NPK Status with indicators
        y_pos = height - 8 * mm - 24
        c.setFont("Helvetica-Bold", 11)
        c.drawString(2 * mm, y_pos, "ಪೋಷಕ ಸ್ಥಿತಿ (Nutrient Status)")

        # N Status
        y_pos -= 1.5 * mm
        n_status, n_color = get_status(n_value, 40, 200)
        c.setFillColor(n_color)
        c.rect(2 * mm, y_pos - 2 * mm, 3 * mm, 3 * mm, fill=True)
        c.setFillColor(black)
        c.setFont("Helvetica", 10)
        c.drawString(6 * mm, y_pos - 1 * mm, f"N (ನೈಟ್ರೋಜನ್): {n_value:.0f} kg/ha [{n_status}]")

        # P Status
        y_pos -= 1.5 * mm
        p_status, p_color = get_status(p_value, 10, 80)
        c.setFillColor(p_color)
        c.rect(2 * mm, y_pos - 2 * mm, 3 * mm, 3 * mm, fill=True)
        c.setFillColor(black)
        c.drawString(6 * mm, y_pos - 1 * mm, f"P (ಫಾಸ್ಫರಸ್): {p_value:.0f} kg/ha [{p_status}]")

        # K Status
        y_pos -= 1.5 * mm
        k_status, k_color = get_status(k_value, 100, 300)
        c.setFillColor(k_color)
        c.rect(2 * mm, y_pos - 2 * mm, 3 * mm, 3 * mm, fill=True)
        c.setFillColor(black)
        c.drawString(6 * mm, y_pos - 1 * mm, f"K (ಪೊಟಾಶ್): {k_value:.0f} kg/ha [{k_status}]")

        # pH Status
        y_pos -= 1.5 * mm
        ph_status, ph_color = get_status(ph_value, 6.0, 7.5)
        c.setFillColor(ph_color)
        c.rect(2 * mm, y_pos - 2 * mm, 3 * mm, 3 * mm, fill=True)
        c.setFillColor(black)
        c.drawString(6 * mm, y_pos - 1 * mm, f"pH (ಆಮ್ಲತೆ): {ph_value:.1f} [{ph_status}]")

        # Summary
        y_pos -= 3 * mm
        c.setFont("Helvetica-Bold", 10)
        c.drawString(2 * mm, y_pos, "ಸಾರಾಂಶ (Summary):")
        y_pos -= 1.2 * mm
        c.setFont("Helvetica", 9)
        issues = []
        if n_status != "OK":
            issues.append(f"N is {n_status}")
        if p_status != "OK":
            issues.append(f"P is {p_status}")
        if k_status != "OK":
            issues.append(f"K is {k_status}")
        if ph_status != "OK":
            issues.append(f"pH is {ph_status}")

        if issues:
            summary_text = "Issues found: " + ", ".join(issues)
        else:
            summary_text = "All nutrients within ideal range. Soil is healthy for crop cultivation."

        # Wrap text
        c.drawString(2 * mm, y_pos, summary_text[:60])
        if len(summary_text) > 60:
            c.drawString(2 * mm, y_pos - 1 * mm, summary_text[60:])

        # Footer
        c.setFont("Helvetica", 8)
        c.drawString(2 * mm, 1.5 * mm, "Rytha Mitra • AI-Powered Soil Health Card • April 2026")

        # Save PDF
        c.save()

        # Encode to base64
        pdf_buffer.seek(0)
        pdf_base64 = base64.b64encode(pdf_buffer.read()).decode("utf-8")

        return {
            "available": True,
            "pdf_base64": pdf_base64,
            "filename": f"soil_health_{top_crop.lower()}.pdf",
        }

    except Exception as e:
        return {
            "available": False,
            "error": f"PDF generation failed: {str(e)}",
            "pdf_base64": "",
            "filename": "",
        }


CROP_WEATHER_BANDS = {
    "rice": {"temp": (20, 36), "humidity": (60, 95), "rainfall_7d": (20, 180)},
    "ragi": {"temp": (18, 34), "humidity": (40, 85), "rainfall_7d": (5, 70)},
    "maize": {"temp": (18, 35), "humidity": (40, 85), "rainfall_7d": (10, 90)},
    "jowar": {"temp": (20, 38), "humidity": (25, 70), "rainfall_7d": (5, 45)},
    "toor dal": {"temp": (20, 36), "humidity": (30, 80), "rainfall_7d": (5, 60)},
    "cotton": {"temp": (20, 37), "humidity": (35, 85), "rainfall_7d": (5, 55)},
}


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _normalize_text(value: str) -> str:
    return (value or "").strip().lower()


def _format_rs(value: float) -> str:
    return f"Rs{value:,.0f}"


def _build_default_llm() -> Any:
    """Build a Groq LLaMA client when env vars are available.

    Required:
    - GROQ_API_KEY
    Optional:
    - GROQ_MODEL (default: llama-3.3-70b-versatile)
    - GROQ_TEMPERATURE (default: 0.2)
    """
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key or ChatGroq is None:
        return None

    model_name = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
    temperature = _safe_float(os.getenv("GROQ_TEMPERATURE", "0.2"), default=0.2)

    try:
        return ChatGroq(
            api_key=api_key,
            model=model_name,
            temperature=temperature,
        )
    except Exception:
        return None


def _load_crop_dataframe() -> pd.DataFrame:
    if pd is None:
        raise RuntimeError("pandas is required for crop recommendation.")

    data_path = Path(os.getenv("CROP_DATASET_PATH", str(DEFAULT_DATA_PATH)))
    if data_path.exists():
        df = pd.read_csv(data_path)
        columns_map = {c.lower(): c for c in df.columns}
        if "label" not in columns_map:
            raise ValueError("Crop dataset must include a 'label' column.")
        for col in FEATURE_COLUMNS:
            if col.lower() not in columns_map:
                raise ValueError(f"Crop dataset missing required feature: {col}")

        normalized = pd.DataFrame()
        for col in FEATURE_COLUMNS:
            normalized[col] = pd.to_numeric(df[columns_map[col.lower()]], errors="coerce")
        normalized["label"] = df[columns_map["label"]].astype(str)
        normalized = normalized.dropna(subset=FEATURE_COLUMNS + ["label"])
        if normalized.empty:
            raise ValueError("Crop dataset has no valid rows after cleaning.")
        return normalized

    # Synthetic fallback keeps local development unblocked when CSV is not present yet.
    synthetic_rows = [
        [90, 40, 40, 28, 80, 6.5, 180, "Rice"],
        [80, 35, 35, 27, 75, 6.4, 150, "Rice"],
        [50, 20, 20, 24, 60, 6.8, 80, "Ragi"],
        [45, 18, 22, 23, 58, 6.7, 70, "Ragi"],
        [60, 25, 25, 26, 65, 6.6, 100, "Maize"],
        [58, 23, 24, 27, 62, 6.5, 95, "Maize"],
        [40, 18, 18, 30, 45, 7.1, 40, "Jowar"],
        [38, 16, 17, 31, 42, 7.2, 35, "Jowar"],
        [30, 15, 20, 29, 50, 6.9, 55, "Toor Dal"],
        [32, 14, 19, 28, 48, 6.8, 52, "Toor Dal"],
    ]
    return pd.DataFrame(synthetic_rows, columns=FEATURE_COLUMNS + ["label"])


def _build_or_load_model() -> Tuple[RandomForestClassifier, shap.TreeExplainer, List[str], Optional[float]]:
    if RandomForestClassifier is None:
        raise RuntimeError("scikit-learn is required for crop recommendation.")
    if shap is None:
        raise RuntimeError("shap is required for SHAP explanations.")

    model_path = Path(os.getenv("MODEL_PATH", str(DEFAULT_MODEL_PATH)))

    # Try loading pre-trained model first (fast path: <200ms)
    try:
        import joblib
        if model_path.exists():
            cached = joblib.load(model_path)
            model = cached["model"]
            model_accuracy = cached.get("accuracy")
            explainer = shap.TreeExplainer(model)
            classes = [str(c) for c in model.classes_]
            return model, explainer, classes, model_accuracy
    except Exception:
        pass  # Fall through to training

    # Train from dataset (cold start — first request only)
    df = _load_crop_dataframe()
    X = df[FEATURE_COLUMNS]
    y = df["label"]

    # MODEL EVALUATION — 70/30 stratified split + 5-fold CV
    # Changed from 80/20 per mentor review — reduces overfitting bias
    # class_weight='balanced' handles synthetic equal-class distribution
    from sklearn.model_selection import StratifiedKFold, cross_val_score
    import numpy as np
    import logging

    logger = logging.getLogger(__name__)

    # class_weight='balanced' handles the equal-per-class synthetic distribution
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        class_weight='balanced'
    )
    model_accuracy: Optional[float] = None
    cv_accuracy: Optional[float] = None
    cv_std: Optional[float] = None

    if train_test_split is not None and accuracy_score is not None and len(df) >= 30:
        try:
            # FIX 1: Changed from 0.2 to 0.3 (70/30 split) — mentor recommendation
            X_train, X_test, y_train, y_test = train_test_split(
                X, y,
                test_size=0.30,
                random_state=42,
                stratify=y   # ensures each crop class proportionally represented
            )
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            model_accuracy = float(accuracy_score(y_test, y_pred))

            # FIX 2: 5-fold stratified cross-validation — most honest metric
            # Refit on full data after evaluation (standard practice)
            cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
            cv_scores = cross_val_score(model, X, y, cv=cv, scoring='accuracy')
            cv_accuracy = float(np.mean(cv_scores))
            cv_std = float(np.std(cv_scores))

            # Refit on ALL data for production use (after honest evaluation)
            model.fit(X, y)

            logger.info(
                f"Model evaluation — "
                f"70/30 test accuracy: {model_accuracy:.4f} | "
                f"5-fold CV: {cv_accuracy:.4f} (+/- {cv_std*2:.4f})"
            )

        except Exception as e:
            logger.warning(f"Model evaluation failed: {e}")
            model.fit(X, y)
            # FIX 3: Never score on training data — use None instead
            model_accuracy = None
            cv_accuracy = None
    else:
        model.fit(X, y)
        model_accuracy = None  # FIX 3: honest — no evaluation possible

    # Persist trained model for fast subsequent loads
    try:
        import joblib
        model_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump({"model": model, "accuracy": model_accuracy}, str(model_path))
    except Exception:
        pass  # Non-critical — training will repeat next time

    explainer = shap.TreeExplainer(model)
    classes = [str(c) for c in model.classes_]
    return model, explainer, classes, model_accuracy


def _find_audio_base64(payload: Any) -> Optional[str]:
    if isinstance(payload, dict):
        for key in ("audioContent", "audio_base64", "audioBase64", "audio"):
            value = payload.get(key)
            if isinstance(value, str) and value and not value.lower().startswith("http"):
                return value.strip()
            if isinstance(value, dict):
                nested = _find_audio_base64(value)
                if nested:
                    return nested

        for value in payload.values():
            nested = _find_audio_base64(value)
            if nested:
                return nested

    if isinstance(payload, list):
        for item in payload:
            nested = _find_audio_base64(item)
            if nested:
                return nested

    return None


def _infer_audio_mime(audio_base64: str) -> str:
    try:
        decoded = base64.b64decode(audio_base64[:256] + "===", validate=False)
    except Exception:
        return "audio/wav"

    if decoded.startswith(b"RIFF"):
        return "audio/wav"
    if decoded.startswith(b"ID3") or decoded[:2] == b"\xff\xfb":
        return "audio/mpeg"
    return "audio/wav"


def _force_plot_html(base_value: Any, shap_values: np.ndarray, features_row: pd.DataFrame) -> str:
    if shap is None:
        return ""

    try:
        force_plot_obj = shap.force_plot(base_value, shap_values, features_row, matplotlib=False)
        stream = StringIO()
        shap.save_html(stream, force_plot_obj)
        return stream.getvalue()
    except Exception:
        return ""


def _top_feature_reasons(values: np.ndarray, feature_names: List[str], top_n: int = 3) -> List[str]:
    impacts = np.abs(values)
    ranked_idx = np.argsort(impacts)[::-1][:top_n]
    reasons = []
    for idx in ranked_idx:
        direction = "increased" if values[idx] >= 0 else "decreased"
        reasons.append(f"{feature_names[idx]} {direction} confidence")
    return reasons


def _extract_json_from_text(value: str, default_obj: Any) -> Any:
    value = (value or "").strip()
    if not value:
        return default_obj
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}|\[.*\]", value, flags=re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                return default_obj
        return default_obj


def _translate_to_kannada_sarvam(text: str) -> str:
    """Translate English text to Kannada using Sarvam AI Translate API."""
    api_key = os.getenv("SARVAM_API_KEY", "").strip()
    if not api_key:
        return "Kannada translation unavailable: SARVAM_API_KEY not set."

    url = "https://api.sarvam.ai/translate"
    payload = {
        "input": text[:1500],  # Sarvam limit
        "source_language_code": "en-IN",
        "target_language_code": "kn-IN",
        "speaker_gender": "Female",
        "mode": "formal",
        "model": "mayura:v1",
        "enable_preprocessing": True,
    }
    headers = {
        "Content-Type": "application/json",
        "api-subscription-key": api_key,
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
    except (requests.RequestException, ValueError) as e:
        return f"Kannada translation unavailable: Sarvam AI request failed ({e})."

    translated = data.get("translated_text", "")
    if translated:
        return str(translated)

    return "Kannada translation unavailable: unexpected Sarvam AI response."


def _synthesize_kannada_audio_sarvam(text: str) -> Dict[str, Any]:
    """Synthesize Kannada speech using Sarvam AI Text-to-Speech (Bulbul)."""
    api_key = os.getenv("SARVAM_API_KEY", "").strip()
    if not api_key:
        return {"available": False, "error": "SARVAM_API_KEY not set."}

    url = "https://api.sarvam.ai/text-to-speech"
    payload = {
        "inputs": [text[:500]],  # Sarvam TTS limit
        "target_language_code": "kn-IN",
        "speaker": "meera",  # Female Kannada speaker
        "model": "bulbul:v1",
        "enable_preprocessing": True,
    }
    headers = {
        "Content-Type": "application/json",
        "api-subscription-key": api_key,
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        response.raise_for_status()
        data = response.json()
    except (requests.RequestException, ValueError):
        return {"available": False, "error": "Sarvam AI TTS request failed."}

    # Sarvam returns audios array with base64 wav
    audios = data.get("audios", [])
    if audios and len(audios) > 0:
        return {
            "available": True,
            "audio_base64": audios[0],
            "audio_mime": "audio/wav",
        }

    return {"available": False, "error": "No audio payload in Sarvam AI response."}


def _parse_price_from_line(line: str) -> float:
    match = re.search(r"Rs([\d,]+)", line)
    if not match:
        return 0.0
    return float(match.group(1).replace(",", ""))


def _heuristic_crop_output(
    N: float,
    P: float,
    K: float,
    temperature: float,
    humidity: float,
    ph: float,
    rainfall: float,
) -> Dict[str, Any]:
    candidates = [
        {
            "crop": "Rice",
            "score": rainfall * 0.35 + humidity * 0.25 + N * 0.1 + max(0, 100 - abs(ph - 6.5) * 30) * 0.3,
        },
        {
            "crop": "Ragi",
            "score": max(0, 120 - rainfall) * 0.3 + K * 0.25 + P * 0.2 + max(0, 100 - abs(temperature - 26) * 7) * 0.25,
        },
        {
            "crop": "Maize",
            "score": N * 0.28 + P * 0.2 + rainfall * 0.2 + max(0, 100 - abs(temperature - 27) * 7) * 0.32,
        },
        {
            "crop": "Jowar",
            "score": max(0, 130 - rainfall) * 0.3 + K * 0.2 + max(0, 100 - abs(temperature - 31) * 7) * 0.3 + max(0, 100 - humidity) * 0.2,
        },
        {
            "crop": "Toor Dal",
            "score": max(0, 120 - rainfall) * 0.35 + P * 0.2 + K * 0.2 + max(0, 100 - abs(temperature - 29) * 7) * 0.25,
        },
    ]
    ranked = sorted(candidates, key=lambda item: item["score"], reverse=True)[:3]
    total = sum(max(item["score"], 0.1) for item in ranked)

    top_crops = [item["crop"] for item in ranked]
    probabilities = {item["crop"]: round(max(item["score"], 0.1) / total, 4) for item in ranked}

    reasons = {
        crop: [
            f"Rainfall profile supports {crop}",
            f"Temperature suitability is favorable for {crop}",
            f"NPK balance aligns with {crop} needs",
        ]
        for crop in top_crops
    }

    return {
        "top_crops": top_crops,
        "probabilities": probabilities,
        "shap_reasons": reasons,
        "shap_force_plot_html": {crop: "" for crop in top_crops},
        "input_features": {
            "N": N,
            "P": P,
            "K": K,
            "temperature": temperature,
            "humidity": humidity,
            "ph": ph,
            "rainfall": rainfall,
        },
    }


class CropAdvisorTool(BaseTool):
    name: str = "crop_advisor_tool"
    description: str = (
        "Recommend top 3 crops using Random Forest and explain with SHAP top 3 reasons "
        "for user features N,P,K,temperature,humidity,ph,rainfall"
    )

    def __init__(self) -> None:
        self._init_error: Optional[str] = None
        self.model = None
        self.explainer = None
        self.classes: List[str] = []
        self.model_accuracy: Optional[float] = None
        try:
            self.model, self.explainer, self.classes, self.model_accuracy = _build_or_load_model()
        except Exception as exc:
            self._init_error = str(exc)

    def _run(
        self,
        N: float,
        P: float,
        K: float,
        temperature: float,
        humidity: float,
        ph: float,
        rainfall: float,
    ) -> str:
        if self._init_error:
            result = _heuristic_crop_output(N, P, K, temperature, humidity, ph, rainfall)
            result["model_accuracy"] = self.model_accuracy
            result["warning"] = f"CropAdvisorTool initialization fallback used: {self._init_error}"
            return json.dumps(result, ensure_ascii=True)

        if pd is None or np is None or self.model is None or self.explainer is None:
            result = _heuristic_crop_output(N, P, K, temperature, humidity, ph, rainfall)
            result["model_accuracy"] = self.model_accuracy
            result["warning"] = "Heuristic fallback used because ML dependencies are unavailable."
            return json.dumps(result, ensure_ascii=True)

        sample_df = pd.DataFrame(
            [[N, P, K, temperature, humidity, ph, rainfall]],
            columns=FEATURE_COLUMNS,
        )

        probabilities = self.model.predict_proba(sample_df)[0]
        top_indices = np.argsort(probabilities)[::-1][:3]
        top_crops = [self.classes[idx] for idx in top_indices]

        shap_values = self.explainer.shap_values(sample_df)
        reasons_by_crop: Dict[str, List[str]] = {}
        force_plot_by_crop: Dict[str, str] = {}

        for idx in top_indices:
            crop = self.classes[idx]

            class_shap = shap_values
            if isinstance(shap_values, list):
                class_shap = shap_values[idx]
            class_values = np.array(class_shap)
            if class_values.ndim == 3:
                sample_values = class_values[0, :, idx]
            elif class_values.ndim == 2:
                sample_values = class_values[0]
            else:
                sample_values = class_values.flatten()

            reasons_by_crop[crop] = _top_feature_reasons(sample_values, FEATURE_COLUMNS, top_n=3)

            # Enterprise Enhancement: Feature Contribution Map (SHAP)
            contribution_map = {}
            for i, feat in enumerate(FEATURE_COLUMNS):
                contribution_map[feat] = {
                    "value": float(sample_df.iloc[0][feat]),
                    "impact": float(sample_values[i]),
                    "percentage": 0.0 # Will calculate in frontend or here
                }
            
            base_value = self.explainer.expected_value
            if isinstance(base_value, list):
                base_value = base_value[idx]
            
            # Sum of impacts + base_value approx = probability in logit space or directly if tree
            # For simplicity, we'll provide the raw impacts for the stunning UI
            
            force_plot_by_crop[crop] = _force_plot_html(base_value, sample_values, sample_df)
            
            # Store full contribution for the dashboard
            if idx == top_indices[0]:
                top_crop_contribution = contribution_map

        result = {
            "top_crops": top_crops,
            "probabilities": {
                self.classes[i]: round(float(probabilities[i]), 4)
                for i in top_indices
            },
            "shap_reasons": reasons_by_crop,
            "shap_force_plot_html": force_plot_by_crop,
            "contributions": {top_crops[0]: top_crop_contribution} if top_crops else {},
            "input_features": {
                "N": N,
                "P": P,
                "K": K,
                "temperature": temperature,
                "humidity": humidity,
                "ph": ph,
                "rainfall": rainfall,
            },
            "model_accuracy": round(self.model_accuracy, 4) if self.model_accuracy is not None else None,
        }
        return json.dumps(result, ensure_ascii=True)


class MarketAnalystTool(BaseTool):
    name: str = "market_analyst_tool"
    description: str = (
        "Get live mandi prices for recommended crops and estimate expected profit using "
        "(yield_per_acre * price) - input_costs"
    )

    def __init__(self) -> None:
        self.mandi_tool = AgmarknetPriceTool()

    def _load_yield_map(self) -> Dict[str, float]:
        custom_path = os.getenv("CROP_YIELD_MAP_PATH", "").strip()
        if custom_path:
            path_obj = Path(custom_path)
            if path_obj.exists():
                try:
                    payload = json.loads(path_obj.read_text(encoding="utf-8"))
                    return {str(k).lower(): float(v) for k, v in payload.items()}
                except (ValueError, OSError, TypeError):
                    pass
        return DEFAULT_YIELD_PER_ACRE.copy()

    def _run(
        self,
        recommended_crops_json: str,
        district: str,
        input_costs: float,
        land_acres: float = 1.0,
    ) -> str:
        payload = _extract_json_from_text(recommended_crops_json, default_obj={})
        crops = payload.get("top_crops", []) if isinstance(payload, dict) else []
        if not crops:
            return json.dumps({"market": [], "top_crop": None, "profit_estimate": 0.0})

        yield_map = self._load_yield_map()
        rows: List[Dict[str, Any]] = []

        for crop in crops:
            crop_name = str(crop)
            output = self.mandi_tool._run(crop_name, district)
            first_line = output.splitlines()[0] if output else ""
            price = _parse_price_from_line(first_line)

            yield_per_acre = yield_map.get(crop_name.lower(), 10.0)
            profit_per_acre = (yield_per_acre * price) - _safe_float(input_costs)
            total_profit = profit_per_acre * max(_safe_float(land_acres, 1.0), 0.0)

            rows.append(
                {
                    "crop": crop_name,
                    "district": district,
                    "price_per_quintal": price,
                    "yield_per_acre": yield_per_acre,
                    "profit_per_acre": round(profit_per_acre, 2),
                    "total_profit": round(total_profit, 2),
                    "market_details": output,
                }
            )

        ranked = sorted(rows, key=lambda item: item["total_profit"], reverse=True)
        top_crop = ranked[0]["crop"] if ranked else None
        top_profit = ranked[0]["total_profit"] if ranked else 0.0

        result = {
            "market": ranked,
            "top_crop": top_crop,
            "profit_estimate": top_profit,
        }
        return json.dumps(result, ensure_ascii=True)


class WeatherIntelTool(BaseTool):
    name: str = "weather_intel_tool"
    description: str = "Fetch OpenWeatherMap forecast, return crop compatibility and drought risk classification"

    def _fetch_weather(self, district: str) -> Optional[Dict[str, Any]]:
        api_key = os.getenv("OPENWEATHER_API_KEY", "").strip()
        if not api_key:
            return None

        geo_url = os.getenv("OPENWEATHER_GEO_URL", "https://api.openweathermap.org/geo/1.0/direct")
        onecall_url = os.getenv("OPENWEATHER_ONECALL_URL", "https://api.openweathermap.org/data/3.0/onecall")

        try:
            geo_resp = requests.get(
                geo_url,
                params={"q": f"{district},Karnataka,IN", "limit": 1, "appid": api_key},
                timeout=5,
            )
            geo_resp.raise_for_status()
            geo_data = geo_resp.json()
            if not geo_data:
                return None

            lat = geo_data[0]["lat"]
            lon = geo_data[0]["lon"]

            weather_resp = requests.get(
                onecall_url,
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": api_key,
                    "units": "metric",
                    "exclude": "minutely,hourly,alerts,current",
                },
                timeout=5,
            )
            weather_resp.raise_for_status()
            return weather_resp.json()
        except (requests.RequestException, KeyError, IndexError, TypeError, ValueError):
            return None

    def _compatibility_flag(self, crop: str, avg_temp: float, avg_humidity: float, rain_7d: float) -> str:
        profile = CROP_WEATHER_BANDS.get(_normalize_text(crop))
        if not profile:
            return "AMBER"

        score = 0
        t_min, t_max = profile["temp"]
        h_min, h_max = profile["humidity"]
        r_min, r_max = profile["rainfall_7d"]

        if t_min <= avg_temp <= t_max:
            score += 1
        if h_min <= avg_humidity <= h_max:
            score += 1
        if r_min <= rain_7d <= r_max:
            score += 1

        if score >= 3:
            return "GREEN"
        if score == 2:
            return "AMBER"
        return "RED"

    def _run(self, recommended_crops_json: str, district: str) -> str:
        if np is None:
            return json.dumps(
                {
                    "district": district,
                    "avg_temp": None,
                    "avg_humidity": None,
                    "rainfall_7d": None,
                    "rainfall_15d_projected": None,
                    "historical_rainfall_15d": None,
                    "drought_risk": "WATCH",
                    "weather_flags": {},
                    "error": "numpy is required for weather aggregation.",
                },
                ensure_ascii=True,
            )

        payload = _extract_json_from_text(recommended_crops_json, default_obj={})
        crops = payload.get("top_crops", []) if isinstance(payload, dict) else []

        weather = self._fetch_weather(district)
        if not weather or not crops:
            return json.dumps(
                {
                    "district": district,
                    "avg_temp": None,
                    "avg_humidity": None,
                    "rainfall_7d": None,
                    "rainfall_15d_projected": None,
                    "historical_rainfall_15d": DISTRICT_RAINFALL_NORMAL_15D.get(_normalize_text(district), 60.0),
                    "drought_risk": "WATCH",
                    "weather_flags": {crop: "AMBER" for crop in crops},
                },
                ensure_ascii=True,
            )

        daily = weather.get("daily", [])[:7]
        if not daily:
            return json.dumps(
                {
                    "district": district,
                    "avg_temp": None,
                    "avg_humidity": None,
                    "rainfall_7d": None,
                    "rainfall_15d_projected": None,
                    "historical_rainfall_15d": DISTRICT_RAINFALL_NORMAL_15D.get(_normalize_text(district), 60.0),
                    "drought_risk": "WATCH",
                    "weather_flags": {crop: "AMBER" for crop in crops},
                },
                ensure_ascii=True,
            )

        avg_temp = float(np.mean([d.get("temp", {}).get("day", 0.0) for d in daily]))
        avg_humidity = float(np.mean([d.get("humidity", 0.0) for d in daily]))
        rain_7d = float(np.sum([d.get("rain", 0.0) for d in daily]))

        daily_15d = weather.get("daily", [])[:15]
        if not daily_15d:
            daily_15d = daily
        rain_15d_projected = _project_rainfall_15d(daily_15d)
        dry_days = [row for row in daily_15d if _safe_float(row.get("rain"), 0.0) < 1.0]
        dry_day_ratio = float(len(dry_days) / max(len(daily_15d), 1))
        drought_meta = _classify_drought_risk(
            district=district,
            avg_temp=avg_temp,
            rain_15d_projected=rain_15d_projected,
            dry_day_ratio=dry_day_ratio,
        )

        flags = {
            crop: self._compatibility_flag(crop, avg_temp=avg_temp, avg_humidity=avg_humidity, rain_7d=rain_7d)
            for crop in crops
        }

        return json.dumps(
            {
                "district": district,
                "avg_temp": round(avg_temp, 2),
                "avg_humidity": round(avg_humidity, 2),
                "rainfall_7d": round(rain_7d, 2),
                "rainfall_15d_projected": drought_meta["projected_rainfall_15d"],
                "historical_rainfall_15d": drought_meta["historical_rainfall_15d"],
                "drought_risk": drought_meta["level"],
                "drought_risk_score": drought_meta["score"],
                "drought_deficit_pct": drought_meta["deficit_pct"],
                "weather_flags": flags,
            },
            ensure_ascii=True,
        )


class SoilExpertTool(BaseTool):
    name: str = "soil_expert_tool"
    description: str = "Check Karnataka soil health data and flag nutrient deficiencies for recommended crops"

    def _load_soil_data(self) -> Dict[str, Any]:
        path = Path(os.getenv("KARNATAKA_SOIL_JSON_PATH", str(DEFAULT_SOIL_PATH)))
        if not path.exists():
            return {}
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return {}

    def _district_entry(self, payload: Dict[str, Any], district: str) -> Dict[str, Any]:
        district_norm = _normalize_text(district)
        if "districts" in payload and isinstance(payload["districts"], dict):
            for name, entry in payload["districts"].items():
                if _normalize_text(name) == district_norm and isinstance(entry, dict):
                    return entry

        if isinstance(payload.get("districts"), list):
            for entry in payload["districts"]:
                if isinstance(entry, dict) and _normalize_text(str(entry.get("district", ""))) == district_norm:
                    return entry
        return {}

    def _run(self, recommended_crops_json: str, district: str) -> str:
        payload = _extract_json_from_text(recommended_crops_json, default_obj={})
        crops = payload.get("top_crops", []) if isinstance(payload, dict) else []

        soil_payload = self._load_soil_data()
        entry = self._district_entry(soil_payload, district)

        n_status = _normalize_text(str(entry.get("N_status", entry.get("n_status", "unknown"))))
        p_status = _normalize_text(str(entry.get("P_status", entry.get("p_status", "unknown"))))
        k_status = _normalize_text(str(entry.get("K_status", entry.get("k_status", "unknown"))))

        deficiencies = []
        if n_status in {"low", "deficient"}:
            deficiencies.append("N")
        if p_status in {"low", "deficient"}:
            deficiencies.append("P")
        if k_status in {"low", "deficient"}:
            deficiencies.append("K")

        crop_alerts: Dict[str, List[str]] = {}
        for crop in crops:
            crop_alerts[str(crop)] = deficiencies or ["No major NPK deficiency flagged"]

        return json.dumps(
            {
                "district": district,
                "soil_deficiencies": deficiencies,
                "soil_alerts": crop_alerts,
            },
            ensure_ascii=True,
        )


class KrishiCrew:
    def __init__(self, llm: Any = None) -> None:
        self.llm = llm if llm is not None else _build_default_llm()

        self.crop_tool = CropAdvisorTool()
        self.market_tool = MarketAnalystTool()
        self.weather_tool = WeatherIntelTool()
        self.soil_tool = SoilExpertTool()

    def _build_agents(self) -> Dict[str, Agent]:
        crop_advisor = Agent(
            role="CropAdvisor",
            goal=(
                "Recommend the best top 3 crops from NPK and weather-like inputs and explain predictions with SHAP"
            ),
            backstory="Agronomy ML specialist using Random Forest and explainability for Karnataka crop decisions.",
            tools=[self.crop_tool],
            verbose=True,
            allow_delegation=False,
            llm=self.llm,
        )

        market_analyst = Agent(
            role="MarketAnalyst",
            goal="Fetch mandi prices for recommended crops and compute profit projections",
            backstory="Agri-economics analyst focused on Karnataka mandi trends and profitability.",
            tools=[self.market_tool, AgmarknetPriceTool()],
            verbose=True,
            allow_delegation=False,
            llm=self.llm,
        )

        weather_intel = Agent(
            role="WeatherIntel",
            goal="Use 7-day OpenWeatherMap forecast to produce crop compatibility flags",
            backstory="Climate intelligence specialist tracking district weather risk for farming decisions.",
            tools=[self.weather_tool],
            verbose=True,
            allow_delegation=False,
            llm=self.llm,
        )

        soil_expert = Agent(
            role="SoilExpert",
            goal="Check district soil health data and identify nutrient deficiencies",
            backstory="Soil scientist for Karnataka district nutrient diagnostics.",
            tools=[self.soil_tool],
            verbose=True,
            allow_delegation=False,
            llm=self.llm,
        )

        return {
            "crop_advisor": crop_advisor,
            "market_analyst": market_analyst,
            "weather_intel": weather_intel,
            "soil_expert": soil_expert,
        }

    def _build_tasks(self, agents: Dict[str, Agent]) -> List[Task]:
        task1 = Task(
            description=(
                "Use crop_advisor_tool with inputs N={N}, P={P}, K={K}, temperature={temperature}, "
                "humidity={humidity}, ph={ph}, rainfall={rainfall}. "
                "Return JSON with keys: top_crops, shap_reasons, shap_force_plot_html, probabilities."
            ),
            expected_output="JSON containing top 3 crops and SHAP explanations",
            agent=agents["crop_advisor"],
        )

        task2 = Task(
            description=(
                "Take task1 output as recommended_crops_json. Use market_analyst_tool with district={district}, "
                "input_costs={input_costs}, land_acres={land_acres}. "
                "Return JSON with market list, top_crop, profit_estimate."
            ),
            expected_output="JSON containing mandi prices and expected profit",
            agent=agents["market_analyst"],
            context=[task1],
        )

        task3 = Task(
            description=(
                "Take task1 output as recommended_crops_json. Use weather_intel_tool with district={district}. "
                "Return JSON with weather_flags per crop and district weather aggregates."
            ),
            expected_output="JSON containing weather compatibility GREEN/AMBER/RED for each recommended crop",
            agent=agents["weather_intel"],
            context=[task1],
        )

        task4 = Task(
            description=(
                "Take task1 output as recommended_crops_json. Use soil_expert_tool with district={district}. "
                "Then produce final structured JSON with keys: top_crop, profit_estimate, weather_flag, "
                "soil_alerts, shap_reasons, kannada_summary. "
                "kannada_summary should be left as English placeholder text ONLY: TRANSLATE_ME"
            ),
            expected_output="Final JSON summary structure excluding translation step",
            agent=agents["soil_expert"],
            context=[task1, task2, task3],
        )

        return [task1, task2, task3, task4]

    def build_crew(self) -> Crew:
        if not CREWAI_AVAILABLE:
            raise RuntimeError("CrewAI is not available in this environment.")

        agents = self._build_agents()
        tasks = self._build_tasks(agents)

        return Crew(
            agents=list(agents.values()),
            tasks=tasks,
            process=Process.sequential,
            verbose=True,
        )

    def _compose_final_output(
        self,
        task1_obj: Dict[str, Any],
        task2_obj: Dict[str, Any],
        task3_obj: Dict[str, Any],
        task4_obj: Dict[str, Any],
        inputs: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:

        top_crops = task1_obj.get("top_crops", []) if isinstance(task1_obj.get("top_crops", []), list) else []
        original_top_crop = task2_obj.get("top_crop") or (top_crops[0] if top_crops else None)
        top_crop = original_top_crop
        profit_estimate = task2_obj.get("profit_estimate", 0.0)

        weather_flags = task3_obj.get("weather_flags", {})
        weather_flag = weather_flags.get(top_crop, "AMBER") if isinstance(weather_flags, dict) else "AMBER"

        market_rows = task2_obj.get("market", []) if isinstance(task2_obj.get("market", []), list) else []
        drought_level = str(task3_obj.get("drought_risk", "WATCH"))
        drought_switch_recommended = drought_level in {"WARNING", "EMERGENCY"}
        drought_switched_to: Optional[str] = None

        if drought_switch_recommended:
            tolerant = _pick_drought_tolerant_crop(top_crops=top_crops, market_rows=market_rows)
            if tolerant and _normalize_text(str(tolerant)) != _normalize_text(str(top_crop)):
                drought_switched_to = tolerant
                top_crop = tolerant
                weather_flag = weather_flags.get(top_crop, weather_flag) if isinstance(weather_flags, dict) else weather_flag

                for row in market_rows:
                    if _normalize_text(str(row.get("crop", ""))) == _normalize_text(top_crop):
                        profit_estimate = _safe_float(row.get("total_profit"), profit_estimate)
                        break

        soil_alerts_all = task4_obj.get("soil_alerts", {})
        if not isinstance(soil_alerts_all, dict):
            soil_alerts_all = {}
        soil_alerts = soil_alerts_all.get(top_crop, soil_alerts_all)

        shap_reasons = task1_obj.get("shap_reasons", {})
        top_crop_reasons = shap_reasons.get(top_crop, []) if isinstance(shap_reasons, dict) else []

        english_summary = (
            f"Top crop: {top_crop}. Expected profit: {_format_rs(_safe_float(profit_estimate))}. "
            f"Weather flag: {weather_flag}. Soil alerts: {soil_alerts}. "
            f"SHAP reasons: {top_crop_reasons}."
        )
        kannada_summary = _translate_to_kannada_sarvam(english_summary)
        
        tts_payload: Dict[str, Any] = {"available": False, "error": "Skipped"}
        if kannada_summary and "unavailable" not in kannada_summary.lower():
            tts_payload = _synthesize_kannada_audio_sarvam(kannada_summary)

        model_accuracy = task1_obj.get("model_accuracy")

        # Enhancement 1: Crop Rotation Recommendation
        rotation_recommendation: Optional[Dict[str, Any]] = None
        if inputs and inputs.get("last_crop"):
            rotation_recommendation = _get_rotation_recommendation(inputs["last_crop"])

        # Enhancement 2: Mandi Price Voice
        mandi_price_voice: Dict[str, Any] = {"available": False, "error": "No market data"}
        market_data = market_rows
        if market_data and isinstance(market_data, list) and len(market_data) > 0:
            top_market = market_data[0] if isinstance(market_data[0], dict) else {}
            modal_price = _safe_float(top_market.get("today_price") or top_market.get("modal_price"), 0.0)
            if modal_price > 0:
                district = str(inputs.get("district", "Karnataka")) if inputs else "Karnataka"
                mandi_price_voice = _synthesize_mandi_price_audio_sarvam(top_crop, district, modal_price)

        # Enhancement 6: Top-3 profitability comparison + Kannada voice summary
        profitability_comparison = _build_profitability_comparison(market_rows)
        profitability_voice = {"available": False, "audio_base64": "", "audio_mime": "", "error": "No comparison rows"}
        profitability_voice_text = _build_profitability_voice_text(profitability_comparison)
        if profitability_voice_text:
            profitability_voice = _synthesize_kannada_audio_sarvam(profitability_voice_text)

        # Enhancement 7: personalized government scheme matcher
        scheme_matches = _match_government_schemes(inputs or {}, top_crop)

        # Enhancement 3: Soil Health Card PDF
        soil_pdf_payload: Dict[str, Any] = {"available": False, "error": "PDF generation skipped"}
        if top_crop and inputs:
            n_value = _safe_float(inputs.get("N"), 50.0)
            p_value = _safe_float(inputs.get("P"), 25.0)
            k_value = _safe_float(inputs.get("K"), 30.0)
            ph_value = _safe_float(inputs.get("ph"), 6.7)
            soil_pdf_payload = _generate_soil_health_card_pdf(n_value, p_value, k_value, ph_value, top_crop)

        final_output = {
            "top_crop": top_crop,
            "original_top_crop": original_top_crop,
            "profit_estimate": round(_safe_float(profit_estimate), 2),
            "model_accuracy": model_accuracy,
            "weather_flag": weather_flag,
            "soil_alerts": soil_alerts,
            "shap_reasons": top_crop_reasons,
            "kannada_summary": kannada_summary,
            "kannada_audio_available": bool(tts_payload.get("available")),
            "kannada_audio_base64": str(tts_payload.get("audio_base64", "")),
            "kannada_audio_mime": str(tts_payload.get("audio_mime", "")),
            "crop_rotation": rotation_recommendation,
            "mandi_price_voice_available": bool(mandi_price_voice.get("available")),
            "mandi_price_voice_base64": str(mandi_price_voice.get("audio_base64", "")),
            "mandi_price_voice_mime": str(mandi_price_voice.get("audio_mime", "")),
            "soil_health_pdf_available": bool(soil_pdf_payload.get("available")),
            "soil_health_pdf_base64": str(soil_pdf_payload.get("pdf_base64", "")),
            "soil_health_pdf_filename": str(soil_pdf_payload.get("filename", "")),
            "drought_risk": {
                "level": drought_level,
                "score": _safe_float(task3_obj.get("drought_risk_score"), 0.0),
                "rainfall_15d_projected": _safe_float(task3_obj.get("rainfall_15d_projected"), 0.0),
                "historical_rainfall_15d": _safe_float(task3_obj.get("historical_rainfall_15d"), 0.0),
                "deficit_pct": _safe_float(task3_obj.get("drought_deficit_pct"), 0.0),
                "switch_recommended": drought_switch_recommended,
                "switched_to": drought_switched_to,
            },
            "profitability_comparison": profitability_comparison,
            "profitability_voice_available": bool(profitability_voice.get("available")),
            "profitability_voice_base64": str(profitability_voice.get("audio_base64", "")),
            "profitability_voice_mime": str(profitability_voice.get("audio_mime", "")),
            "government_schemes": scheme_matches,
            "details": {
                "top_crops": task1_obj.get("top_crops", []),
                "probabilities": task1_obj.get("probabilities", {}),
                "model_accuracy": model_accuracy,
                "shap_reasons_by_crop": task1_obj.get("shap_reasons", {}),
                "shap_force_plot_html": task1_obj.get("shap_force_plot_html", {}),
                "market": market_rows,
                "weather_flags": task3_obj.get("weather_flags", {}),
                "soil_alerts_by_crop": task4_obj.get("soil_alerts", {}),
                "kannada_tts_error": str(tts_payload.get("error", "")),
            },
        }
        return final_output

    def _run_tools_fallback(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        task1_raw = self.crop_tool._run(
            _safe_float(inputs.get("N")),
            _safe_float(inputs.get("P")),
            _safe_float(inputs.get("K")),
            _safe_float(inputs.get("temperature")),
            _safe_float(inputs.get("humidity")),
            _safe_float(inputs.get("ph"), 6.5),
            _safe_float(inputs.get("rainfall")),
        )
        task1_obj = _extract_json_from_text(task1_raw, {})

        recommended_crops_json = json.dumps(task1_obj, ensure_ascii=True)

        task2_raw = self.market_tool._run(
            recommended_crops_json,
            str(inputs.get("district", "Bangalore")),
            _safe_float(inputs.get("input_costs")),
            _safe_float(inputs.get("land_acres"), 1.0),
        )
        task2_obj = _extract_json_from_text(task2_raw, {})

        task3_raw = self.weather_tool._run(
            recommended_crops_json,
            str(inputs.get("district", "Bangalore")),
        )
        task3_obj = _extract_json_from_text(task3_raw, {})

        task4_raw = self.soil_tool._run(
            recommended_crops_json,
            str(inputs.get("district", "Bangalore")),
        )
        task4_obj = _extract_json_from_text(task4_raw, {})

        return self._compose_final_output(task1_obj, task2_obj, task3_obj, task4_obj, inputs)

    def run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        if CREWAI_AVAILABLE:
            try:
                crew = self.build_crew()
                crew_output = crew.kickoff(inputs=inputs)

                task_outputs = getattr(crew_output, "tasks_output", []) if crew_output is not None else []

                task1_obj = _extract_json_from_text(str(task_outputs[0]) if len(task_outputs) > 0 else "", {})
                task2_obj = _extract_json_from_text(str(task_outputs[1]) if len(task_outputs) > 1 else "", {})
                task3_obj = _extract_json_from_text(str(task_outputs[2]) if len(task_outputs) > 2 else "", {})
                task4_obj = _extract_json_from_text(str(task_outputs[3]) if len(task_outputs) > 3 else "", {})
                return self._compose_final_output(task1_obj, task2_obj, task3_obj, task4_obj, inputs)
            except Exception:
                return self._run_tools_fallback(inputs)

        return self._run_tools_fallback(inputs)


__all__ = ["KrishiCrew"]

from __future__ import annotations

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


def _build_or_load_model() -> Tuple[RandomForestClassifier, shap.TreeExplainer, List[str]]:
    if RandomForestClassifier is None:
        raise RuntimeError("scikit-learn is required for crop recommendation.")
    if shap is None:
        raise RuntimeError("shap is required for SHAP explanations.")

    # Train from dataset each run to keep this file self-contained without requiring joblib artifacts.
    df = _load_crop_dataframe()
    X = df[FEATURE_COLUMNS]
    y = df["label"]

    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X, y)

    explainer = shap.TreeExplainer(model)
    classes = [str(c) for c in model.classes_]
    return model, explainer, classes


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


def _translate_to_kannada_bhashini(text: str) -> str:
    url = os.getenv("BHASHINI_API_URL", "").strip()
    if not url:
        return "Kannada translation unavailable: BHASHINI_API_URL not set."

    payload = {
        "pipelineTasks": [
            {
                "taskType": "translation",
                "config": {
                    "language": {
                        "sourceLanguage": "en",
                        "targetLanguage": "kn",
                    }
                },
            }
        ],
        "inputData": {"input": [{"source": text}]},
    }

    headers = {"Content-Type": "application/json"}
    api_key = os.getenv("BHASHINI_API_KEY", "").strip()
    if api_key:
        headers["Authorization"] = api_key

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=8)
        response.raise_for_status()
        data = response.json()
    except (requests.RequestException, ValueError):
        return "Kannada translation unavailable: Bhashini request failed."

    try:
        translated = data["pipelineResponse"][0]["output"][0]["target"]
        if translated:
            return str(translated)
    except (KeyError, IndexError, TypeError):
        pass

    return "Kannada translation unavailable: unexpected Bhashini response."


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
        try:
            self.model, self.explainer, self.classes = _build_or_load_model()
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
            result["warning"] = f"CropAdvisorTool initialization fallback used: {self._init_error}"
            return json.dumps(result, ensure_ascii=True)

        if pd is None or np is None or self.model is None or self.explainer is None:
            result = _heuristic_crop_output(N, P, K, temperature, humidity, ph, rainfall)
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

            base_value = self.explainer.expected_value
            if isinstance(base_value, list):
                base_value = base_value[idx]
            force_plot_by_crop[crop] = _force_plot_html(base_value, sample_values, sample_df)

        result = {
            "top_crops": top_crops,
            "probabilities": {
                self.classes[i]: round(float(probabilities[i]), 4)
                for i in top_indices
            },
            "shap_reasons": reasons_by_crop,
            "shap_force_plot_html": force_plot_by_crop,
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
    description: str = "Fetch OpenWeatherMap 7-day forecast and return GREEN/AMBER/RED crop compatibility"

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
                    "weather_flags": {crop: "AMBER" for crop in crops},
                },
                ensure_ascii=True,
            )

        avg_temp = float(np.mean([d.get("temp", {}).get("day", 0.0) for d in daily]))
        avg_humidity = float(np.mean([d.get("humidity", 0.0) for d in daily]))
        rain_7d = float(np.sum([d.get("rain", 0.0) for d in daily]))

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
    ) -> Dict[str, Any]:

        top_crops = task1_obj.get("top_crops", []) if isinstance(task1_obj.get("top_crops", []), list) else []
        top_crop = task2_obj.get("top_crop") or (top_crops[0] if top_crops else None)
        profit_estimate = task2_obj.get("profit_estimate", 0.0)

        weather_flags = task3_obj.get("weather_flags", {})
        weather_flag = weather_flags.get(top_crop, "AMBER") if isinstance(weather_flags, dict) else "AMBER"

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
        kannada_summary = _translate_to_kannada_bhashini(english_summary)

        final_output = {
            "top_crop": top_crop,
            "profit_estimate": round(_safe_float(profit_estimate), 2),
            "weather_flag": weather_flag,
            "soil_alerts": soil_alerts,
            "shap_reasons": top_crop_reasons,
            "kannada_summary": kannada_summary,
            "details": {
                "top_crops": task1_obj.get("top_crops", []),
                "probabilities": task1_obj.get("probabilities", {}),
                "shap_reasons_by_crop": task1_obj.get("shap_reasons", {}),
                "shap_force_plot_html": task1_obj.get("shap_force_plot_html", {}),
                "market": task2_obj.get("market", []),
                "weather_flags": task3_obj.get("weather_flags", {}),
                "soil_alerts_by_crop": task4_obj.get("soil_alerts", {}),
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

        return self._compose_final_output(task1_obj, task2_obj, task3_obj, task4_obj)

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
                return self._compose_final_output(task1_obj, task2_obj, task3_obj, task4_obj)
            except Exception:
                return self._run_tools_fallback(inputs)

        return self._run_tools_fallback(inputs)


__all__ = ["KrishiCrew"]

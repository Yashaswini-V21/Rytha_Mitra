import json
import os
import time
from functools import lru_cache
from statistics import mean
from typing import Any, Dict, List

import requests

try:
    from crewai.tools import BaseTool
except ImportError:
    class BaseTool:  # pragma: no cover - dev fallback when CrewAI is unavailable
        name: str = ""
        description: str = ""

        def _run(self, *args: Any, **kwargs: Any) -> str:
            raise NotImplementedError


CACHE_TTL_SECONDS = 6 * 60 * 60
TREND_STABLE_THRESHOLD = 0.5
DEFAULT_STATIC_PATH = os.path.join("tools", "Karnataka_mandi_prices.json")


def _cache_bucket() -> int:
    return int(time.time() // CACHE_TTL_SECONDS)


def _normalize_text(value: str) -> str:
    return (value or "").strip().lower()


def _to_float(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if number <= 0:
        return None
    return number


def _extract_history(entry: Dict[str, Any]) -> List[float]:
    raw_history = entry.get("history_30d") or entry.get("history") or entry.get("prices") or []
    values: List[float] = []

    if isinstance(raw_history, list):
        for point in raw_history:
            candidate = point
            if isinstance(point, dict):
                candidate = point.get("price") or point.get("modal_price") or point.get("value")
            numeric = _to_float(candidate)
            if numeric is not None:
                values.append(numeric)

    if not values:
        fallback_price = _to_float(entry.get("today_price") or entry.get("modal_price") or entry.get("price"))
        if fallback_price is not None:
            values.append(fallback_price)

    return values[-30:]


def _build_row(district: str, history_30d: List[float]) -> Dict[str, Any]:
    recent = history_30d[-30:]
    week = recent[-7:]

    today_price = recent[-1]
    avg_7d = mean(week)

    first = recent[0]
    if first <= 0:
        trend_pct = 0.0
    else:
        trend_pct = ((today_price - first) / first) * 100

    if trend_pct > TREND_STABLE_THRESHOLD:
        trend_label = "UP"
    elif trend_pct < -TREND_STABLE_THRESHOLD:
        trend_label = "DOWN"
    else:
        trend_label = "STABLE"

    return {
        "district": district,
        "today_price": today_price,
        "avg_7d": avg_7d,
        "trend_pct": trend_pct,
        "trend_label": trend_label,
    }


def _normalize_payload(payload: Any, crop_norm: str) -> List[Dict[str, Any]]:
    if isinstance(payload, dict):
        records = payload.get("data") or payload.get("prices") or []
    elif isinstance(payload, list):
        records = payload
    else:
        records = []

    normalized: List[Dict[str, Any]] = []

    for item in records:
        if not isinstance(item, dict):
            continue

        item_crop = _normalize_text(str(item.get("crop") or item.get("commodity") or ""))
        if crop_norm and item_crop and item_crop != crop_norm:
            continue

        district = str(item.get("district") or item.get("market") or item.get("district_name") or "").strip()
        if not district:
            continue

        history = _extract_history(item)
        if not history:
            continue

        normalized.append(_build_row(district=district, history_30d=history))

    return normalized


def _fetch_from_agmarknet(crop_norm: str) -> List[Dict[str, Any]]:
    api_url = os.getenv("AGMARKNET_API_URL", "").strip()
    if not api_url:
        return []

    params = {
        "crop": crop_norm,
        "state": "Karnataka",
    }

    api_key = os.getenv("AGMARKNET_API_KEY", "").strip()
    if api_key:
        params["api_key"] = api_key

    headers = {"Accept": "application/json"}
    api_token = os.getenv("AGMARKNET_API_TOKEN", "").strip()
    auth_header = os.getenv("AGMARKNET_AUTH_HEADER", "Authorization").strip() or "Authorization"
    if api_token:
        headers[auth_header] = api_token

    try:
        response = requests.get(api_url, params=params, headers=headers, timeout=3)
        response.raise_for_status()
        payload = response.json()
    except (requests.Timeout, requests.RequestException, ValueError, json.JSONDecodeError):
        return []

    return _normalize_payload(payload, crop_norm=crop_norm)


def _load_static_fallback(crop_norm: str) -> List[Dict[str, Any]]:
    static_path = os.getenv("AGMARKNET_STATIC_PATH", DEFAULT_STATIC_PATH)

    try:
        with open(static_path, "r", encoding="utf-8") as file_obj:
            payload = json.load(file_obj)
    except (OSError, ValueError, json.JSONDecodeError):
        return []

    return _normalize_payload(payload, crop_norm=crop_norm)


@lru_cache(maxsize=128)
def _get_market_rows(crop_norm: str, ttl_bucket: int) -> tuple[Dict[str, Any], ...]:
    del ttl_bucket

    rows = _fetch_from_agmarknet(crop_norm=crop_norm)
    if not rows:
        rows = _load_static_fallback(crop_norm=crop_norm)

    return tuple(rows)


def _format_rupees(value: float) -> str:
    return f"Rs{value:,.0f}"


def _format_line(crop_label: str, row: Dict[str, Any]) -> str:
    return (
        f"{crop_label} in {row['district']}: {_format_rupees(row['today_price'])}/quintal "
        f"(7-day avg: {_format_rupees(row['avg_7d'])}, trend: {row['trend_label']} {row['trend_pct']:+.1f}%)"
    )


def _select_top_three(rows: List[Dict[str, Any]], district_norm: str) -> List[Dict[str, Any]]:
    ranked = sorted(rows, key=lambda item: item["today_price"], reverse=True)

    if not ranked:
        return []

    prioritized: List[Dict[str, Any]] = []
    for row in ranked:
        if _normalize_text(str(row["district"])) == district_norm:
            prioritized.append(row)
            break

    for row in ranked:
        if row in prioritized:
            continue
        prioritized.append(row)
        if len(prioritized) == 3:
            break

    return prioritized[:3]


class AgmarknetPriceTool(BaseTool):
    name: str = "get_mandi_prices"
    description: str = "Get live mandi prices for a crop in Karnataka districts"

    def _run(self, crop: str, district: str = "Bangalore") -> str:
        crop_label = (crop or "").strip()
        if not crop_label:
            return "Please provide a crop name."

        crop_norm = _normalize_text(crop_label)
        district_norm = _normalize_text(district or "Bangalore")

        rows = list(_get_market_rows(crop_norm=crop_norm, ttl_bucket=_cache_bucket()))
        if not rows:
            return f"No mandi price data available for {crop_label.title()} in Karnataka."

        selected = _select_top_three(rows=rows, district_norm=district_norm)
        if not selected:
            return f"No mandi price data available for {crop_label.title()} in Karnataka."

        return "\n".join(_format_line(crop_label.title(), row) for row in selected)

"""
Rytha Mitra — Unit Tests
=========================
Tests for data loading, model training, API endpoints,
and scheme matching logic.

NOTE: Heavy tests (model training, SHAP) are marked @pytest.mark.slow
and excluded from PR CI/CD checks for speed. Run with:
  pytest tests/ -m slow  # Only slow tests
  pytest tests/ -m "not slow"  # Skip slow tests (CI default)
"""
import os
import sys
import json
import pytest
from pathlib import Path

# Add project root to path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


class TestDataset:
    """Tests for crop dataset integrity."""

    @pytest.mark.slow
    def test_dataset_exists(self):
        csv_path = ROOT / "data" / "crop_dataset.csv"
        assert csv_path.exists(), "crop_dataset.csv must exist in data/"

    @pytest.mark.slow
    def test_dataset_has_minimum_rows(self):
        import pandas as pd
        df = pd.read_csv(ROOT / "data" / "crop_dataset.csv")
        assert len(df) >= 1000, f"Dataset should have 1000+ rows, got {len(df)}"

    @pytest.mark.slow
    def test_dataset_has_required_columns(self):
        import pandas as pd
        df = pd.read_csv(ROOT / "data" / "crop_dataset.csv")
        required = {"N", "P", "K", "temperature", "humidity", "ph", "rainfall", "label"}
        assert required.issubset(set(df.columns)), f"Missing columns: {required - set(df.columns)}"

    @pytest.mark.slow
    def test_dataset_has_multiple_crops(self):
        import pandas as pd
        df = pd.read_csv(ROOT / "data" / "crop_dataset.csv")
        n_crops = df["label"].nunique()
        assert n_crops >= 10, f"Should have 10+ crops, got {n_crops}"


class TestModel:
    """Tests for ML model training and prediction."""

    @pytest.mark.slow
    def test_model_trains_successfully(self):
        from crew.krishi_crew import _build_or_load_model
        model, explainer, classes, accuracy = _build_or_load_model()
        assert model is not None
        assert len(classes) >= 10

    @pytest.mark.slow
    def test_model_accuracy_above_threshold(self):
        from crew.krishi_crew import _build_or_load_model
        _, _, _, accuracy = _build_or_load_model()
        assert accuracy is not None
        assert accuracy > 0.70, f"Model accuracy {accuracy} is too low"

    @pytest.mark.slow
    def test_prediction_returns_top_crops(self):
        from crew.krishi_crew import _build_or_load_model, FEATURE_COLUMNS
        import numpy as np
        model, _, classes, _ = _build_or_load_model()
        sample = np.array([[82, 42, 38, 31, 62, 6.7, 92]])
        probs = model.predict_proba(sample)[0]
        assert len(probs) == len(classes)
        assert max(probs) > 0, "At least one crop should have >0 probability"

    @pytest.mark.slow
    def test_shap_explainer_works(self):
        from crew.krishi_crew import _build_or_load_model, FEATURE_COLUMNS
        import numpy as np
        import pandas as pd
        _, explainer, classes, _ = _build_or_load_model()
        sample = pd.DataFrame([[82, 42, 38, 31, 62, 6.7, 92]], columns=FEATURE_COLUMNS)
        shap_values = explainer.shap_values(sample)
        assert shap_values is not None


class TestSchemes:
    """Tests for government scheme matching."""

    def test_female_farmer_gets_raitha_siri(self):
        from crew.krishi_crew import _match_government_schemes
        schemes = _match_government_schemes(
            {"district": "Raichur", "land_acres": 2, "gender": "female"},
            "Rice"
        )
        names = [s["name"] for s in schemes]
        assert "Raitha Siri Support (Karnataka)" in names

    def test_all_farmers_get_pm_kisan(self):
        from crew.krishi_crew import _match_government_schemes
        schemes = _match_government_schemes(
            {"district": "Raichur", "land_acres": 2, "gender": "male"},
            "Rice"
        )
        names = [s["name"] for s in schemes]
        assert "PM-KISAN" in names

    def test_crop_insurance_matched(self):
        from crew.krishi_crew import _match_government_schemes
        schemes = _match_government_schemes(
            {"district": "Tumakuru", "land_acres": 3, "gender": ""},
            "Ragi"
        )
        names = [s["name"] for s in schemes]
        assert "PMFBY Crop Insurance" in names


class TestCropRotation:
    """Tests for crop rotation recommendations."""

    def test_rice_rotation(self):
        from crew.krishi_crew import _get_rotation_recommendation
        result = _get_rotation_recommendation("Rice")
        assert result is not None
        assert result["rotation_crop"] == "groundnut"

    def test_unknown_crop_returns_none(self):
        from crew.krishi_crew import _get_rotation_recommendation
        result = _get_rotation_recommendation("Dragonfruit")
        assert result is None


class TestDroughtRisk:
    """Tests for drought risk classification."""

    def test_normal_conditions(self):
        from crew.krishi_crew import _classify_drought_risk
        result = _classify_drought_risk("raichur", 28.0, 40.0, 0.2)
        assert result["level"] in ("NORMAL", "WATCH")

    def test_extreme_drought(self):
        from crew.krishi_crew import _classify_drought_risk
        result = _classify_drought_risk("raichur", 42.0, 2.0, 0.95)
        assert result["level"] in ("WARNING", "EMERGENCY")


class TestHelpers:
    """Tests for utility functions."""

    def test_safe_float(self):
        from crew.krishi_crew import _safe_float
        assert _safe_float("3.14") == 3.14
        assert _safe_float(None) == 0.0
        assert _safe_float("invalid", 5.0) == 5.0

    def test_normalize_text(self):
        from crew.krishi_crew import _normalize_text
        assert _normalize_text("  Rice  ") == "rice"
        assert _normalize_text("") == ""

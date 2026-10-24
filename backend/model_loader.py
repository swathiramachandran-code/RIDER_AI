"""
ML model and artifacts loader for inference.
"""

import json
from pathlib import Path
from typing import Dict, Any, Tuple
import joblib
import pandas as pd

# Paths relative to project root
BASE_DIR = Path(__file__).resolve().parent.parent
ARTIFACTS_DIR = BASE_DIR / "ml" / "artifacts"


class ModelManager:
    def __init__(self):
        self.model = None
        self.metrics: Dict[str, Any] = {}
        self.metadata: Dict[str, Any] = {}
        self.mae: float = 0.0
        self.current_year: int = 2026
        self.year_min: int = 2000
        self.year_max: int = 2026
        self.km_max: int = 300000

    def load(self):
        """Load artifacts once on startup."""
        model_file = ARTIFACTS_DIR / "model.joblib"
        metrics_file = ARTIFACTS_DIR / "metrics.json"
        metadata_file = ARTIFACTS_DIR / "metadata.json"

        if not model_file.exists() or not metrics_file.exists() or not metadata_file.exists():
            raise FileNotFoundError(
                f"Artifacts missing in {ARTIFACTS_DIR}. Please run 'python ml/train.py' first."
            )

        self.model = joblib.load(model_file)

        with open(metrics_file, "r", encoding="utf-8") as f:
            self.metrics = json.load(f)

        with open(metadata_file, "r", encoding="utf-8") as f:
            self.metadata = json.load(f)

        self.mae = float(self.metrics.get("mae", 25000.0))
        self.current_year = int(self.metadata.get("current_year", 2026))
        self.year_min = int(self.metadata.get("year_min", 2005))
        self.year_max = int(self.metadata.get("year_max", 2026))
        self.km_max = int(self.metadata.get("km_max", 300000))

    def validate_input(self, brand: str, year: int, km_driven: int, fuel: str, transmission: str, owner: str):
        """Validate input parameters against metadata bounds."""
        errors = []

        if year < self.year_min or year > self.current_year:
            errors.append(
                f"Year must be between {self.year_min} and {self.current_year}. Received: {year}"
            )

        if km_driven < 0 or km_driven > self.km_max:
            errors.append(
                f"Kilometers driven must be between 0 and {self.km_max:,}. Received: {km_driven}"
            )

        valid_brands = set(self.metadata.get("brands", []))
        if brand not in valid_brands:
            errors.append(
                f"Invalid brand '{brand}'. Must be one of: {sorted(list(valid_brands))}"
            )

        valid_fuels = set(self.metadata.get("fuels", []))
        if fuel not in valid_fuels:
            errors.append(
                f"Invalid fuel '{fuel}'. Must be one of: {sorted(list(valid_fuels))}"
            )

        valid_transmissions = set(self.metadata.get("transmissions", []))
        if transmission not in valid_transmissions:
            errors.append(
                f"Invalid transmission '{transmission}'. Must be one of: {sorted(list(valid_transmissions))}"
            )

        valid_owners = set(self.metadata.get("owners", []))
        if owner not in valid_owners:
            errors.append(
                f"Invalid owner type '{owner}'. Must be one of: {sorted(list(valid_owners))}"
            )

        return errors

    def predict(
        self,
        brand: str,
        year: int,
        km_driven: int,
        fuel: str,
        transmission: str,
        owner: str
    ) -> Tuple[float, float, float, int]:
        """
        Run inference using the trained pipeline.
        Returns: (predicted_price, price_low, price_high, car_age)
        """
        car_age = self.current_year - year

        input_df = pd.DataFrame([{
            "brand": brand,
            "car_age": car_age,
            "km_driven": km_driven,
            "fuel": fuel,
            "transmission": transmission,
            "owner": owner
        }])

        raw_price = float(self.model.predict(input_df)[0])
        predicted_price = max(10000.0, round(raw_price, 2))
        price_low = max(0.0, round(predicted_price - self.mae, 2))
        price_high = round(predicted_price + self.mae, 2)

        return predicted_price, price_low, price_high, car_age

    def predict_raw_age(
        self,
        brand: str,
        car_age: int,
        km_driven: int,
        fuel: str,
        transmission: str,
        owner: str
    ) -> float:
        """Raw model prediction directly from computed car_age and km_driven."""
        input_df = pd.DataFrame([{
            "brand": brand,
            "car_age": car_age,
            "km_driven": km_driven,
            "fuel": fuel,
            "transmission": transmission,
            "owner": owner
        }])
        raw_price = float(self.model.predict(input_df)[0])
        return max(10000.0, round(raw_price, 2))


# Singleton instance
model_manager = ModelManager()

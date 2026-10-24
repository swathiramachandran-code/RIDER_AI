"""
Vehicle Resale Price Predictor - Training Pipeline
Trains regression models to predict used car resale prices in INR (₹).
"""

import json
import os
import sys
import random
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, PolynomialFeatures
from sklearn.pipeline import Pipeline
from sklearn.compose import TransformedTargetRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

# Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
ARTIFACTS_DIR = BASE_DIR / "artifacts"
DATA_FILE = DATA_DIR / "cars.csv"
CURRENT_YEAR = 2026


def generate_synthetic_data(num_samples: int = 3000) -> pd.DataFrame:
    """Generate realistic synthetic used-car data mirroring CarDekho dataset."""
    np.random.seed(42)
    random.seed(42)

    brands_models = {
        "Maruti": ["Swift", "Dzire", "Alto 800", "Baleno", "Wagon R", "Ertiga", "Vitara Brezza"],
        "Hyundai": ["i20", "Creta", "Grand i10", "Verna", "Venue", "Santro"],
        "Honda": ["City", "Amaze", "Civic", "Jazz", "WR-V"],
        "Toyota": ["Innova", "Fortuner", "Corolla Altis", "Etios", "Yaris", "Glanza"],
        "Mahindra": ["Scorpio", "XUV500", "Thar", "Bolero", "XUV300"],
        "Tata": ["Nexon", "Harrier", "Tiago", "Altroz", "Safari", "Punch"],
        "Ford": ["EcoSport", "Endeavour", "Figo", "Aspire"],
        "Volkswagen": ["Polo", "Vento", "Taigun"],
        "Renault": ["Kwid", "Duster", "Triber", "Kiger"],
        "Skoda": ["Octavia", "Rapid", "Superb", "Kushaq"],
        "BMW": ["3 Series", "5 Series", "X1", "X3", "X5"],
        "Mercedes-Benz": ["C-Class", "E-Class", "GLA", "GLC"],
        "Audi": ["A4", "A6", "Q3", "Q5"],
        "Kia": ["Seltos", "Sonet", "Carnival"],
        "MG": ["Hector", "ZS EV", "Astor"],
        "Nissan": ["Micra", "Magnite", "Sunny"],
        "Chevrolet": ["Beat", "Cruze", "Spark"],
        "Datsun": ["GO", "redi-GO"],
    }

    base_prices = {
        "Maruti": 650000,
        "Hyundai": 850000,
        "Honda": 1150000,
        "Toyota": 1750000,
        "Mahindra": 1350000,
        "Tata": 1050000,
        "Ford": 1100000,
        "Volkswagen": 1150000,
        "Renault": 680000,
        "Skoda": 1450000,
        "BMW": 4400000,
        "Mercedes-Benz": 4900000,
        "Audi": 4300000,
        "Kia": 1400000,
        "MG": 1650000,
        "Nissan": 720000,
        "Chevrolet": 550000,
        "Datsun": 420000,
    }

    fuels = ["Petrol", "Diesel", "CNG", "LPG", "Electric"]
    fuel_weights = [0.55, 0.38, 0.05, 0.01, 0.01]

    seller_types = ["Individual", "Dealer", "Trustmark Dealer"]
    seller_weights = [0.65, 0.30, 0.05]

    transmissions = ["Manual", "Automatic"]
    transmission_weights = [0.78, 0.22]

    owners = ["First Owner", "Second Owner", "Third Owner", "Fourth & Above Owner", "Test Drive Car"]
    owner_weights = [0.62, 0.26, 0.08, 0.03, 0.01]

    all_brands = list(brands_models.keys())
    # Frequency weights: popular brands have higher frequency
    brand_weights = [
        0.28, 0.18, 0.09, 0.08, 0.07, 0.07, 0.04, 0.03, 0.03, 0.02,
        0.02, 0.02, 0.015, 0.02, 0.01, 0.01, 0.01, 0.005
    ]
    # Normalize weights
    brand_weights = [w / sum(brand_weights) for w in brand_weights]

    records = []
    for _ in range(num_samples):
        brand = np.random.choice(all_brands, p=brand_weights)
        model = random.choice(brands_models[brand])
        name = f"{brand} {model}"

        # Year distribution: 2006 to 2024
        year = int(np.random.choice(range(2006, 2025), p=[
            0.01, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08,
            0.09, 0.10, 0.10, 0.09, 0.08, 0.07, 0.05, 0.03, 0.01, 0.01
        ]))
        car_age = CURRENT_YEAR - year

        # km_driven depends somewhat on age
        avg_km_per_year = np.random.normal(12000, 3500)
        km_driven = int(max(2000, avg_km_per_year * car_age + np.random.normal(0, 8000)))

        fuel = np.random.choice(fuels, p=fuel_weights)
        seller = np.random.choice(seller_types, p=seller_weights)
        trans = np.random.choice(transmissions, p=transmission_weights)
        owner = np.random.choice(owners, p=owner_weights)

        # Price calculation with realistic depreciation curve
        base = base_prices[brand]
        # Annual depreciation: ~8.5% per year
        depreciation = (1 - 0.088) ** car_age
        # KM impact: 100k km causes ~15% reduction
        km_factor = max(0.45, 1.0 - (km_driven / 250000) * 0.3)
        # Transmission impact: Automatic is 18% pricier
        trans_factor = 1.18 if trans == "Automatic" else 1.0
        # Fuel factor: Diesel +10%, Electric +15%, CNG/LPG -5%
        fuel_factors = {"Diesel": 1.10, "Petrol": 1.0, "CNG": 0.95, "LPG": 0.90, "Electric": 1.15}
        fuel_factor = fuel_factors.get(fuel, 1.0)
        # Owner factor
        owner_factors = {
            "First Owner": 1.0,
            "Second Owner": 0.84,
            "Third Owner": 0.72,
            "Fourth & Above Owner": 0.60,
            "Test Drive Car": 1.05
        }
        owner_factor = owner_factors.get(owner, 1.0)

        # Base resale estimate
        estimated_price = base * depreciation * km_factor * trans_factor * fuel_factor * owner_factor
        # Add realistic market noise (+/- 7%)
        noise = np.random.normal(1.0, 0.07)
        selling_price = max(25000, int(round(estimated_price * noise, -2)))

        records.append({
            "name": name,
            "year": year,
            "selling_price": selling_price,
            "km_driven": km_driven,
            "fuel": fuel,
            "seller_type": seller,
            "transmission": trans,
            "owner": owner
        })

    df = pd.DataFrame(records)
    return df


def load_and_clean_data() -> pd.DataFrame:
    """Load dataset or generate synthetic if missing, clean data per requirements."""
    if not DATA_FILE.exists():
        print(f"\n[WARNING] Dataset not found at '{DATA_FILE}'. Generating 3,000 realistic synthetic rows...")
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        raw_df = generate_synthetic_data(num_samples=3000)
        raw_df.to_csv(DATA_FILE, index=False)
        print(f"[INFO] Synthetic dataset successfully saved to '{DATA_FILE}'.")
    else:
        print(f"[INFO] Loading dataset from '{DATA_FILE}'...")
        raw_df = pd.read_csv(DATA_FILE)

    print(f"Initial raw rows: {len(raw_df)}")

    # Clean: drop duplicates and nulls
    df = raw_df.drop_duplicates().dropna().copy()
    print(f"After dropping duplicates & nulls: {len(df)}")

    # Remove owner == 'Test Drive Car'
    df = df[df["owner"] != "Test Drive Car"].copy()

    # Keep selling_price > 10000 and km_driven > 0
    df = df[(df["selling_price"] > 10000) & (df["km_driven"] > 0)].copy()

    # Outliers removal with IQR rule (k=3) on price and km
    for col in ["selling_price", "km_driven"]:
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        lower_bound = q1 - 3.0 * iqr
        upper_bound = q3 + 3.0 * iqr
        df = df[(df[col] >= lower_bound) & (df[col] <= upper_bound)].copy()

    print(f"After IQR outlier filtering (k=3): {len(df)}")

    # Feature Engineering
    # brand = first word of name (title case; brands with fewer than 20 rows become "Other")
    df["brand"] = df["name"].astype(str).apply(lambda x: x.strip().split()[0].title())
    brand_counts = df["brand"].value_counts()
    frequent_brands = brand_counts[brand_counts >= 20].index
    df["brand"] = df["brand"].apply(lambda b: b if b in frequent_brands else "Other")

    # car_age = 2026 - year
    df["car_age"] = CURRENT_YEAR - df["year"]

    print(f"Brands count ({len(df['brand'].unique())}): {sorted(df['brand'].unique())}")
    return df


def train_models():
    """Train regression models, select the best, refit, and save artifacts."""
    df = load_and_clean_data()

    numeric_features = ["car_age", "km_driven"]
    categorical_features = ["brand", "fuel", "transmission", "owner"]
    feature_cols = ["brand", "car_age", "km_driven", "fuel", "transmission", "owner"]

    X = df[feature_cols]
    y = df["selling_price"]

    # Preprocessing
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numeric_features),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features),
        ]
    )

    # Polynomial feature preprocessor for numeric features
    poly_preprocessor = ColumnTransformer(
        transformers=[
            ("num", Pipeline([
                ("scaler", StandardScaler()),
                ("poly", PolynomialFeatures(degree=2, include_bias=False))
            ]), numeric_features),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features),
        ]
    )

    # 80/20 train/test split with random_state=42
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Candidate models wrapped in TransformedTargetRegressor with np.log1p / np.expm1
    models = {
        "Linear Regression": TransformedTargetRegressor(
            regressor=Pipeline([
                ("preprocessor", preprocessor),
                ("regressor", LinearRegression())
            ]),
            func=np.log1p,
            inverse_func=np.expm1
        ),
        "Polynomial + Ridge": TransformedTargetRegressor(
            regressor=Pipeline([
                ("preprocessor", poly_preprocessor),
                ("regressor", Ridge(alpha=1.0))
            ]),
            func=np.log1p,
            inverse_func=np.expm1
        ),
        "Random Forest Regressor": TransformedTargetRegressor(
            regressor=Pipeline([
                ("preprocessor", preprocessor),
                ("regressor", RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1))
            ]),
            func=np.log1p,
            inverse_func=np.expm1
        )
    }

    cv = KFold(n_splits=5, shuffle=True, random_state=42)
    evaluation_results = []
    fitted_models = {}

    print("\n" + "=" * 75)
    print("MODEL EVALUATION BENCHMARK")
    print("=" * 75)
    print(f"{'Model':<26} | {'Test R2':<8} | {'MAE (INR)':<10} | {'RMSE (INR)':<11} | {'5-Fold CV R2':<12}")
    print("-" * 75)

    for name, model in models.items():
        # Fit on training data
        model.fit(X_train, y_train)
        fitted_models[name] = model

        # Predict on test
        preds = model.predict(X_test)
        r2 = float(r2_score(y_test, preds))
        mae = float(mean_absolute_error(y_test, preds))
        rmse = float(np.sqrt(mean_squared_error(y_test, preds)))

        # 5-fold CV R² on training set (or full dataset)
        cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="r2", n_jobs=-1)
        cv_r2 = float(np.mean(cv_scores))
        cv_r2_std = float(np.std(cv_scores))

        evaluation_results.append({
            "name": name,
            "r2": round(r2, 4),
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "cv_r2": round(cv_r2, 4),
            "cv_r2_std": round(cv_r2_std, 4)
        })

        print(f"{name:<26} | {r2:<8.4f} | {mae:<10.0f} | {rmse:<11.0f} | {cv_r2:.4f} (±{cv_r2_std:.3f})")

    print("=" * 70)

    # Pick the best by test R²
    best_result = max(evaluation_results, key=lambda x: x["r2"])
    best_model_name = best_result["name"]
    print(f"\n[WINNER] Best Model: {best_model_name} with Test R² = {best_result['r2']}")

    # Refit the best model on all data
    best_model = models[best_model_name]
    print(f"[INFO] Refitting '{best_model_name}' on all {len(X)} samples...")
    best_model.fit(X, y)

    # Create artifacts directory
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    # Save artifacts/model.joblib
    model_path = ARTIFACTS_DIR / "model.joblib"
    joblib.dump(best_model, model_path)
    print(f"[INFO] Saved pipeline artifact to '{model_path}'.")

    # Generate test predictions for actual_vs_predicted chart (200 samples)
    test_sample_indices = np.random.RandomState(42).choice(len(X_test), size=min(200, len(X_test)), replace=False)
    X_sample = X_test.iloc[test_sample_indices]
    y_sample_actual = y_test.iloc[test_sample_indices].values
    y_sample_predicted = fitted_models[best_model_name].predict(X_sample)

    actual_vs_predicted = [
        {"actual": round(float(act), 0), "predicted": round(float(pred), 0)}
        for act, pred in zip(y_sample_actual, y_sample_predicted)
    ]

    # Insights: Price vs Age
    price_vs_age_df = df.groupby("car_age")["selling_price"].mean().reset_index()
    price_vs_age = [
        {"car_age": int(row["car_age"]), "avg_price": round(float(row["selling_price"]), 0)}
        for _, row in price_vs_age_df.sort_values("car_age").iterrows()
    ]

    # Insights: Price by Brand
    price_by_brand_df = df.groupby("brand")["selling_price"].mean().reset_index()
    price_by_brand = [
        {"brand": str(row["brand"]), "avg_price": round(float(row["selling_price"]), 0)}
        for _, row in price_by_brand_df.sort_values("selling_price", ascending=False).iterrows()
    ]

    # Insights: Price by Fuel
    price_by_fuel_df = df.groupby("fuel")["selling_price"].mean().reset_index()
    price_by_fuel = [
        {"fuel": str(row["fuel"]), "avg_price": round(float(row["selling_price"]), 0)}
        for _, row in price_by_fuel_df.sort_values("selling_price", ascending=False).iterrows()
    ]

    # Save artifacts/metrics.json
    metrics_path = ARTIFACTS_DIR / "metrics.json"
    metrics_data = {
        "best_model": best_model_name,
        "r2": best_result["r2"],
        "mae": best_result["mae"],
        "rmse": best_result["rmse"],
        "all_models": evaluation_results,
        "actual_vs_predicted": actual_vs_predicted,
        "price_vs_age": price_vs_age,
        "price_by_brand": price_by_brand,
        "price_by_fuel": price_by_fuel
    }
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=2)
    print(f"[INFO] Saved metrics artifact to '{metrics_path}'.")

    # Metadata for frontend and validation
    metadata_path = ARTIFACTS_DIR / "metadata.json"
    brands_list = sorted([str(b) for b in df["brand"].unique() if b != "Other"])
    if "Other" in df["brand"].values:
        brands_list.append("Other")

    metadata_data = {
        "brands": brands_list,
        "fuels": sorted(df["fuel"].unique().tolist()),
        "transmissions": sorted(df["transmission"].unique().tolist()),
        "owners": [
            "First Owner",
            "Second Owner",
            "Third Owner",
            "Fourth & Above Owner"
        ],
        "year_min": int(df["year"].min()),
        "year_max": int(df["year"].max()),
        "current_year": CURRENT_YEAR,
        "km_max": int(min(300000, df["km_driven"].max() + 20000))
    }
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata_data, f, indent=2)
    print(f"[INFO] Saved metadata artifact to '{metadata_path}'.")
    print("\n[SUCCESS] ML training finished successfully!")


if __name__ == "__main__":
    train_models()

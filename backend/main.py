"""
FastAPI application for RIDER_AI - Vehicle Resale Price Predictor.
"""

import json
import logging
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any

from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.db import init_db, get_db, Prediction
from backend.schemas import (
    PredictRequest,
    PredictResponse,
    HistoryItem,
    HealthResponse,
    MessageResponse,
    ForecastRequest,
    ForecastResponse,
    ForecastItem,
    CompareRequest,
    CompareResponse,
    CompareCarResult,
    RecommendationItem,
)
from backend.model_loader import model_manager
from backend.adjustments import (
    calculate_price_adjustments,
    calculate_health_score,
    ADJUSTMENT_CONFIG,
)

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("backend.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize database and load ML model."""
    logger.info("Initializing database tables & migrations...")
    init_db()

    logger.info("Loading ML artifacts and model pipeline...")
    try:
        model_manager.load()
        logger.info(
            f"Model loaded successfully! Best model: {model_manager.metrics.get('best_model')}"
        )
    except Exception as e:
        logger.error(f"Error loading model artifacts: {e}", exc_info=True)
        raise e

    yield
    logger.info("Application shutting down...")


# Immediate init for standalone usage
init_db()
try:
    model_manager.load()
except Exception as e:
    logger.warning(f"Initial model load note: {e}")

app = FastAPI(
    title="RIDER_AI API",
    description="High-performance machine learning backend for used car resale valuation.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["System"])
def get_health():
    """Health check endpoint indicating model readiness."""
    best_model_name = model_manager.metrics.get("best_model", "Unknown")
    return {"status": "ok", "model": best_model_name}


@app.get("/metadata", tags=["Model"])
def get_metadata():
    """Retrieve metadata including categorical options and input limits."""
    return model_manager.metadata


@app.get("/model-info", tags=["Model"])
def get_model_info():
    """Retrieve model training metrics, comparisons, and charts data."""
    return model_manager.metrics


@app.post(
    "/predict",
    response_model=PredictResponse,
    status_code=status.HTTP_200_OK,
    tags=["Prediction"]
)
def predict_resale_price(payload: PredictRequest, db: Session = Depends(get_db)):
    """
    Predict vehicle resale price given specification and condition modifiers.
    Applies empirical base ML prediction followed by rule-based condition adjustments.
    Saves the record into the SQLite database.
    """
    validation_errors = model_manager.validate_input(
        brand=payload.brand,
        year=payload.year,
        km_driven=payload.km_driven,
        fuel=payload.fuel,
        transmission=payload.transmission,
        owner=payload.owner
    )

    if validation_errors:
        logger.warning(f"Validation failed for request: {payload.dict()} -> {validation_errors}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"errors": validation_errors, "message": "Input validation failed."}
        )

    try:
        # 1. Base ML Model prediction
        base_price, _, _, car_age = model_manager.predict(
            brand=payload.brand,
            year=payload.year,
            km_driven=payload.km_driven,
            fuel=payload.fuel,
            transmission=payload.transmission,
            owner=payload.owner
        )

        # 2. Rule-based condition, working status, and history adjustments
        extras_dict = payload.extras.dict() if payload.extras else {}
        condition_val = payload.condition or "Good"
        working_val = payload.working_status or "Fully working"
        accident_val = payload.accident_history or "None"
        service_val = payload.service_history or "Partial"

        adjusted_price, price_low, price_high, breakdown, health_score = calculate_price_adjustments(
            base_price=base_price,
            condition=condition_val,
            working_status=working_val,
            accident_history=accident_val,
            service_history=service_val,
            extras=extras_dict,
            mae=model_manager.mae
        )

        # 3. Persist to database
        db_record = Prediction(
            brand=payload.brand,
            year=payload.year,
            km_driven=payload.km_driven,
            fuel=payload.fuel,
            transmission=payload.transmission,
            owner=payload.owner,
            predicted_price=adjusted_price,
            price_low=price_low,
            price_high=price_high,
            base_price=base_price,
            condition=condition_val,
            working_status=working_val,
            accident_history=accident_val,
            service_history=service_val,
            extras=json.dumps(extras_dict),
            health_score=health_score
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)

        logger.info(
            f"Prediction [ID: {db_record.id}]: {payload.brand} ({payload.year}) -> Base: ₹{base_price:,.0f} | Adjusted: ₹{adjusted_price:,.0f} (Health: {health_score}/100)"
        )

        return PredictResponse(
            id=db_record.id,
            base_price=base_price,
            predicted_price=adjusted_price,
            price_low=price_low,
            price_high=price_high,
            car_age=car_age,
            breakdown=breakdown,
            health_score=health_score,
            created_at=db_record.created_at.isoformat() if db_record.created_at else None
        )

    except Exception as e:
        logger.error(f"Inference error: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction inference failed: {str(e)}"
        )


@app.post("/forecast", response_model=ForecastResponse, tags=["Forecast"])
def forecast_vehicle_value(payload: ForecastRequest):
    """
    Forecast depreciation trajectory over the next N years based on annual mileage
    and condition degradation scenario ('well_maintained' vs 'neglected').
    """
    validation_errors = model_manager.validate_input(
        brand=payload.brand,
        year=payload.year,
        km_driven=payload.km_driven,
        fuel=payload.fuel,
        transmission=payload.transmission,
        owner=payload.owner
    )
    if validation_errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"errors": validation_errors, "message": "Input validation failed."}
        )

    current_age = model_manager.current_year - payload.year
    condition_val = payload.condition or "Good"
    working_val = payload.working_status or "Fully working"
    accident_val = payload.accident_history or "None"
    service_val = payload.service_history or "Partial"
    extras_dict = payload.extras.dict() if payload.extras else {}

    # Annual condition multiplier degradation rate
    if payload.scenario == "neglected":
        deg_rate = 0.015 if condition_val in ["Excellent", "Good"] else 0.025
    else:
        deg_rate = 0.005 if condition_val in ["Excellent", "Good"] else 0.010

    m_cond_base = ADJUSTMENT_CONFIG["condition"].get(condition_val, 1.0)
    m_work = ADJUSTMENT_CONFIG["working_status"].get(working_val, 1.0)
    m_acc = ADJUSTMENT_CONFIG["accident_history"].get(accident_val, 1.0)
    m_serv = ADJUSTMENT_CONFIG["service_history"].get(service_val, 1.0)

    extras_delta = (
        (0.02 if extras_dict.get("ac_working") else 0)
        + (0.02 if extras_dict.get("new_tyres") else 0)
        + (0.01 if extras_dict.get("insurance_valid") else 0)
    )

    forecast_items: List[ForecastItem] = []

    for i in range(payload.years + 1):
        future_year = model_manager.current_year + i
        car_age_i = current_age + i
        km_i = min(350000, payload.km_driven + i * payload.yearly_km)

        # 1. Base ML model at future age & km
        base_price_i = model_manager.predict_raw_age(
            brand=payload.brand,
            car_age=car_age_i,
            km_driven=km_i,
            fuel=payload.fuel,
            transmission=payload.transmission,
            owner=payload.owner
        )

        # 2. Condition multiplier degraded over future years
        deg_factor = max(0.50, 1.0 - (i * deg_rate))
        m_cond_i = 1.0 + (m_cond_base - 1.0) * deg_factor

        combined_mult = max(
            ADJUSTMENT_CONFIG["clamp_min"],
            min(ADJUSTMENT_CONFIG["clamp_max"], (m_cond_i * m_work * m_acc * m_serv) + extras_delta)
        )

        adjusted_price_i = max(10000.0, round(base_price_i * combined_mult, 2))
        price_low_i = max(0.0, round(adjusted_price_i - model_manager.mae, 2))
        price_high_i = round(adjusted_price_i + model_manager.mae, 2)

        forecast_items.append(
            ForecastItem(
                year_index=i,
                future_year=future_year,
                car_age=car_age_i,
                km_driven=km_i,
                base_price=base_price_i,
                adjusted_price=adjusted_price_i,
                price_low=price_low_i,
                price_high=price_high_i,
            )
        )

    initial_price = forecast_items[0].adjusted_price
    final_price = forecast_items[-1].adjusted_price
    retention_pct = round((final_price / initial_price) * 100, 1) if initial_price > 0 else 0.0
    depreciation_pct = round(100.0 - retention_pct, 1)

    return ForecastResponse(
        forecast=forecast_items,
        value_retained_percent=retention_pct,
        depreciation_percent=depreciation_pct,
    )


@app.post("/compare", response_model=CompareResponse, tags=["Compare"])
def compare_vehicles(payload: CompareRequest):
    """
    Compare 2 to 3 vehicle specifications side-by-side with 3-year value retention
    and determine category champions (Best Price, Best Health, Best Retention).
    """
    results: List[CompareCarResult] = []

    for car in payload.cars:
        base_price, _, _, car_age = model_manager.predict(
            brand=car.brand,
            year=car.year,
            km_driven=car.km_driven,
            fuel=car.fuel,
            transmission=car.transmission,
            owner=car.owner
        )

        extras_dict = car.extras.dict() if car.extras else {}
        condition_val = car.condition or "Good"
        working_val = car.working_status or "Fully working"
        accident_val = car.accident_history or "None"
        service_val = car.service_history or "Partial"

        adj_price, p_low, p_high, _, health_score = calculate_price_adjustments(
            base_price=base_price,
            condition=condition_val,
            working_status=working_val,
            accident_history=accident_val,
            service_history=service_val,
            extras=extras_dict,
            mae=model_manager.mae
        )

        # 3-year projection
        car_age_3 = car_age + 3
        km_3 = min(350000, car.km_driven + 36000)
        base_3 = model_manager.predict_raw_age(
            brand=car.brand,
            car_age=car_age_3,
            km_driven=km_3,
            fuel=car.fuel,
            transmission=car.transmission,
            owner=car.owner
        )
        adj_3, _, _, _, _ = calculate_price_adjustments(
            base_price=base_3,
            condition=condition_val,
            working_status=working_val,
            accident_history=accident_val,
            service_history=service_val,
            extras=extras_dict,
            mae=model_manager.mae
        )

        retention_pct = round((adj_3 / adj_price) * 100, 1) if adj_price > 0 else 0.0

        results.append(
            CompareCarResult(
                brand=car.brand,
                year=car.year,
                km_driven=car.km_driven,
                fuel=car.fuel,
                transmission=car.transmission,
                owner=car.owner,
                condition=condition_val,
                working_status=working_val,
                base_price=base_price,
                predicted_price=adj_price,
                price_low=p_low,
                price_high=p_high,
                car_age=car_age,
                health_score=health_score,
                three_year_price=adj_3,
                value_retained_percent=retention_pct,
            )
        )

    # Winners
    best_price_car = max(results, key=lambda c: c.predicted_price)
    best_health_car = max(results, key=lambda c: c.health_score)
    best_retention_car = max(results, key=lambda c: c.value_retained_percent)

    verdict = (
        f"{best_price_car.brand} ({best_price_car.year}) commands the highest market valuation, "
        f"while {best_retention_car.brand} offers the best 3-year value retention ({best_retention_car.value_retained_percent}%)."
    )

    return CompareResponse(
        cars=results,
        winner_price=f"{best_price_car.brand} ({best_price_car.year})",
        winner_health=f"{best_health_car.brand} ({best_health_car.health_score}/100)",
        winner_retention=f"{best_retention_car.brand} ({best_retention_car.value_retained_percent}%)",
        verdict=verdict,
    )


@app.get("/recommendations", response_model=List[RecommendationItem], tags=["Recommendations"])
def get_brand_recommendations(
    brand: str = Query("Maruti"),
    year: int = Query(2020),
    km_driven: int = Query(45000),
    fuel: str = Query("Petrol"),
    transmission: str = Query("Manual"),
    owner: str = Query("First Owner"),
):
    """
    Returns alternative brands for the same age and km specifications,
    ranked by 3-year resale value retention.
    """
    all_brands = model_manager.metadata.get("brands", [])
    car_age = model_manager.current_year - year
    car_age_3 = car_age + 3
    km_3 = min(350000, km_driven + 36000)

    items = []
    badges = [
        "Holds Value Best",
        "Strong Resale Retention",
        "High Market Demand",
        "Low Depreciation",
        "Reliable Value"
    ]

    for b in all_brands:
        if b == "Other" or b.lower() == brand.lower():
            continue
        try:
            price_now = model_manager.predict_raw_age(b, car_age, km_driven, fuel, transmission, owner)
            price_3 = model_manager.predict_raw_age(b, car_age_3, km_3, fuel, transmission, owner)
            retention = round((price_3 / price_now) * 100, 1) if price_now > 0 else 0.0

            items.append({
                "brand": b,
                "current_price": price_now,
                "three_year_price": price_3,
                "retention_percent": retention
            })
        except Exception:
            continue

    # Sort by retention descending
    items.sort(key=lambda x: x["retention_percent"], reverse=True)
    top_5 = items[:5]

    response = []
    for idx, item in enumerate(top_5):
        badge = badges[idx] if idx < len(badges) else "Recommended"
        response.append(
            RecommendationItem(
                brand=item["brand"],
                current_price=item["current_price"],
                three_year_price=item["three_year_price"],
                retention_percent=item["retention_percent"],
                badge=badge
            )
        )

    return response


@app.get("/history", response_model=List[HistoryItem], tags=["History"])
def get_history(
    search: Optional[str] = Query(None, description="Search term across brand, fuel, transmission, or owner"),
    limit: Optional[int] = Query(100, ge=1, le=500, description="Max records to return"),
    db: Session = Depends(get_db)
):
    """Retrieve historical prediction records, ordered newest first."""
    query = db.query(Prediction)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Prediction.brand.ilike(search_pattern),
                Prediction.fuel.ilike(search_pattern),
                Prediction.transmission.ilike(search_pattern),
                Prediction.owner.ilike(search_pattern),
                Prediction.condition.ilike(search_pattern),
                Prediction.working_status.ilike(search_pattern),
            )
        )

    records = query.order_by(Prediction.created_at.desc(), Prediction.id.desc()).limit(limit).all()
    return records


@app.delete("/history/{record_id}", response_model=MessageResponse, tags=["History"])
def delete_history_record(record_id: int, db: Session = Depends(get_db)):
    """Delete a single prediction record by ID."""
    record = db.query(Prediction).filter(Prediction.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction with ID {record_id} not found."
        )

    db.delete(record)
    db.commit()
    logger.info(f"Deleted history item {record_id}")
    return MessageResponse(message=f"Prediction record {record_id} deleted successfully.", id=record_id)


@app.delete("/history", response_model=MessageResponse, tags=["History"])
def clear_all_history(db: Session = Depends(get_db)):
    """Clear all historical prediction records."""
    count = db.query(Prediction).delete()
    db.commit()
    logger.info(f"Cleared all history records ({count} rows deleted)")
    return MessageResponse(message="All prediction history cleared successfully.", count=count)


# Mount static assets and serve SPA frontend when built (e.g. Render production deployment)
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/", include_in_schema=False)
    async def serve_root():
        return FileResponse(FRONTEND_DIST / "index.html")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Do not intercept API docs or existing endpoints
        api_prefixes = (
            "docs", "redoc", "openapi.json", "health", "metadata",
            "model-info", "predict", "forecast", "compare", "recommendations", "history"
        )
        if full_path and any(full_path == prefix or full_path.startswith(f"{prefix}/") for prefix in api_prefixes):
            raise HTTPException(status_code=404, detail="Not Found")

        file_path = FRONTEND_DIST / full_path
        if full_path and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")

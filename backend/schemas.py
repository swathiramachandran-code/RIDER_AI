"""
Pydantic schemas for request, response, forecast, and compare validations.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ExtrasSchema(BaseModel):
    ac_working: bool = False
    new_tyres: bool = False
    insurance_valid: bool = False


class BreakdownItem(BaseModel):
    factor: str
    impact: float
    multiplier: Optional[float] = None


class PredictRequest(BaseModel):
    brand: str = Field(..., description="Vehicle brand name (e.g., Maruti, Hyundai)")
    year: int = Field(..., description="Manufacturing year")
    km_driven: int = Field(..., ge=0, description="Odometer reading in kilometers")
    fuel: str = Field(..., description="Fuel type (e.g., Petrol, Diesel, CNG)")
    transmission: str = Field(..., description="Transmission type (Manual or Automatic)")
    owner: str = Field(..., description="Ownership status (e.g., First Owner)")

    # Extended condition parameters (all optional with defaults for backwards-compatibility)
    condition: Optional[str] = Field("Good", description="Overall condition: Excellent, Good, Fair, Poor")
    working_status: Optional[str] = Field("Fully working", description="Working status: Fully working, Minor issues, Major repairs needed, Not running")
    accident_history: Optional[str] = Field("None", description="Accident history: None, Minor, Major")
    service_history: Optional[str] = Field("Partial", description="Service records: Full records, Partial, None")
    extras: Optional[ExtrasSchema] = Field(default_factory=ExtrasSchema, description="Optional equipment extras")


class PredictResponse(BaseModel):
    id: int
    base_price: float
    predicted_price: float
    price_low: float
    price_high: float
    car_age: int
    breakdown: List[BreakdownItem] = []
    health_score: int
    created_at: Optional[str] = None


class HistoryItem(BaseModel):
    id: int
    created_at: datetime
    brand: str
    year: int
    km_driven: int
    fuel: str
    transmission: str
    owner: str
    predicted_price: float
    price_low: float
    price_high: float
    base_price: Optional[float] = None
    condition: Optional[str] = "Good"
    working_status: Optional[str] = "Fully working"
    accident_history: Optional[str] = "None"
    service_history: Optional[str] = "Partial"
    extras: Optional[str] = "{}"
    health_score: Optional[int] = 80

    class Config:
        from_attributes = True


class ForecastRequest(BaseModel):
    brand: str
    year: int
    km_driven: int
    fuel: str
    transmission: str
    owner: str
    condition: Optional[str] = "Good"
    working_status: Optional[str] = "Fully working"
    accident_history: Optional[str] = "None"
    service_history: Optional[str] = "Partial"
    extras: Optional[ExtrasSchema] = Field(default_factory=ExtrasSchema)
    years: int = Field(5, ge=1, le=10, description="Years to forecast ahead")
    yearly_km: int = Field(12000, ge=1000, le=60000, description="Expected annual mileage")
    scenario: Optional[str] = Field("well_maintained", description="'well_maintained' or 'neglected'")


class ForecastItem(BaseModel):
    year_index: int
    future_year: int
    car_age: int
    km_driven: int
    base_price: float
    adjusted_price: float
    price_low: float
    price_high: float


class ForecastResponse(BaseModel):
    forecast: List[ForecastItem]
    value_retained_percent: float
    depreciation_percent: float


class CompareRequest(BaseModel):
    cars: List[PredictRequest] = Field(..., min_length=2, max_length=3, description="2 to 3 cars to evaluate")


class CompareCarResult(BaseModel):
    id: Optional[int] = None
    brand: str
    year: int
    km_driven: int
    fuel: str
    transmission: str
    owner: str
    condition: str
    working_status: str
    base_price: float
    predicted_price: float
    price_low: float
    price_high: float
    car_age: int
    health_score: int
    three_year_price: float
    value_retained_percent: float


class CompareResponse(BaseModel):
    cars: List[CompareCarResult]
    winner_price: str
    winner_health: str
    winner_retention: str
    verdict: str


class RecommendationItem(BaseModel):
    brand: str
    current_price: float
    three_year_price: float
    retention_percent: float
    badge: str


class HealthResponse(BaseModel):
    status: str
    model: str


class MessageResponse(BaseModel):
    message: str
    count: Optional[int] = None
    id: Optional[int] = None

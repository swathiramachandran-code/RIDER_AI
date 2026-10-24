# 🏎️ RIDER_AI | Vehicle Resale Price Predictor

> A complete, production-grade automotive resale price valuation platform. Enter vehicle specifications (brand, year, mileage, powertrain, transmission, ownership, mechanical condition, working status) and immediately receive an empirical resale price in Indian Rupees (₹) with dynamic confidence boundaries, predictive analytics, value forecasting, side-by-side comparison, and historical tracking.

---

## 📸 Overview & Architecture

RIDER_AI merges machine learning regression with an automotive cyber-dashboard. The system continuously models vehicle depreciation curves, brand prestige multipliers, usage wear, and rule-based physical condition modifiers.

```
                           ┌───────────────────────────────────────────────┐
                           │            CLIENT / USER INTERFACE            │
                           │   React 18 + Vite + Tailwind CSS + Recharts   │
                           └──────────────────────┬────────────────────────┘
                                                  │
                                   HTTP / REST (Axios Requests)
                                                  │
                                                  ▼
                           ┌───────────────────────────────────────────────┐
                           │               FASTAPI BACKEND                 │
                           │        Pydantic v2 Validation Schemas         │
                           └──────────────┬─────────────────┬──────────────┘
                                          │                 │
                            Joblib Pipeline                 SQLAlchemy 2.0 ORM
                                          │                 │
                                          ▼                 ▼
             ┌───────────────────────────────────┐    ┌───────────────────────────┐
             │       SCIKIT-LEARN ML ENGINE      │    │    SQLITE LOCAL DATABASE  │
             │  • Log1p Transformed Regressor    │    │  • Prediction Records     │
             │  • Robust StandardScaler & OHE    │    │  • Condition & Health     │
             │  • 5-Fold Cross Validated (~0.98) │    │  • Filtering & CSV Export │
             └───────────────────────────────────┘    └───────────────────────────┘
```

---

## 🛠️ Tech Stack & Philosophy

| Component | Technology | Role & Justification |
| :--- | :--- | :--- |
| **ML Engine** | **Python 3.11 / 3.12** | Core environment for numerical computation and data transformations |
| **Data Cleaning** | **Pandas & NumPy** | Ingestion, IQR outlier filtering (k=3), brand aggregation, log transformations |
| **Model Pipelines** | **Scikit-Learn** | ColumnTransformer, TransformedTargetRegressor, Ridge, LinearRegression, Random Forest |
| **Condition Engine**| **Rule-Based Adjustments** | Deterministic economic modifiers for condition, working status, accidents, and extras |
| **Persistence** | **Joblib** | Serialization and loading of the trained regression inference pipeline |
| **Backend API** | **FastAPI & Uvicorn** | High-throughput asynchronous ASGI web framework with OpenAPI /docs integration |
| **Validation** | **Pydantic v2** | Strict payload schema enforcement and helpful HTTP 422 boundary diagnostics |
| **Database** | **SQLAlchemy 2 + SQLite** | Relational prediction history storage with automated migration |
| **Frontend UI** | **React 18 + Vite** | Blazing-fast component rendering with lightning-fast Hot Module Replacement |
| **Styling** | **Tailwind CSS** | Automotive dashboard aesthetic (`#0b0f1a` dark glassmorphism, neon blue/orange) |
| **Visualizations**| **Recharts** | Interactive SVG charts (Depreciation area bands, Grouped bars, Multi-radar, Timeline) |
| **Animations** | **Framer Motion** | Speedometer needle sweeps, animated tab bars, and count-up numeric counters |
| **Icons** | **Lucide React** | Consistent automotive, powertrain, and navigation iconography |

---

## 🚀 Setup & Execution Guide

### 1. Prerequisites
Ensure you have **Python 3.11+** and **Node.js 18+** installed on your system.

### 2. Environment & Python Dependencies
```bash
# Optional: Create and activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install all backend and ML requirements
pip install -r requirements.txt
```

### 3. Run ML Pipeline & Artifact Generation
```bash
python ml/train.py
```
> *Note: If `ml/data/cars.csv` does not exist, `train.py` automatically generates a realistic 3,000-row synthetic CarDekho dataset and executes IQR outlier filtering, model cross-validation, and saves `model.joblib`, `metrics.json`, and `metadata.json` into `ml/artifacts/`.*

### 4. Start the FastAPI Backend
```bash
uvicorn backend.main:app --reload --port 8000
```
Interactive Swagger documentation is available at: **[http://localhost:8000/docs](http://localhost:8000/docs)**

### 5. Launch the React Frontend
Open a second terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🔌 REST API Specification

| Method | Endpoint | Description | Request Body / Query | Success Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Live system health and winning model name | None | `{"status": "ok", "model": "Linear Regression"}` |
| `GET` | `/metadata` | Dropdown brands, fuels, year and km boundaries | None | JSON containing arrays for brands, fuels, bounds |
| `GET` | `/model-info`| Evaluation metrics, holdout points, chart data | None | Metrics JSON with R², MAE, RMSE, charts data |
| `POST` | `/predict` | Predict resale value with condition adjustments | `{brand, year, km_driven, fuel, transmission, owner, condition?, working_status?, accident_history?, service_history?, extras?}` | `{id, base_price, predicted_price, price_low, price_high, car_age, breakdown[], health_score}` |
| `POST` | `/forecast` | Forecast depreciation over 1 to 10 years | `{brand, year, km_driven, fuel, transmission, owner, condition?, working_status?, years?, yearly_km?, scenario?}` | `{forecast: [{year_index, future_year, car_age, km_driven, base_price, adjusted_price, price_low, price_high}], value_retained_percent, depreciation_percent}` |
| `POST` | `/compare` | Side-by-side evaluation of 2–3 cars | `{cars: [car1, car2, car3]}` | `{cars: [{...CompareCarResult}], winner_price, winner_health, winner_retention, verdict}` |
| `GET` | `/recommendations` | Top 5 brand alternatives by 3-yr retention | `?brand=Maruti&year=2020&km_driven=45000&fuel=Petrol&transmission=Manual&owner=First%20Owner` | Array of 5 brands with retention %, prices, and badges |
| `GET` | `/history` | Query saved valuations (newest first) | `?search=Maruti&limit=100` | Array of historical records including condition, health score, and base price |
| `DELETE`| `/history/{id}`| Delete single appraisal record | None (path ID) | `{"message": "Prediction record deleted", "id": 1}` |
| `DELETE`| `/history` | Clear entire prediction history database | None | `{"message": "All history cleared", "count": 25}` |

---

## 📑 Application Pages

1. **Predictor (`/`)**:
   - Hero banner with inline SVG car silhouette and glowing neon beams.
   - Interactive glassmorphism form with synchronized sliders and number inputs.
   - **Extended Physical Inputs**: Overall Condition (segmented), Mechanical Working Status (select), Accident History (toggle), Service Records (toggle), and Equipment Extras (AC working, New tyres, Valid insurance).
   - Speedometer Gauge animated to the adjusted price.
   - Model Price vs. Adjusted Price mini comparison row.
   - Circular **Vehicle Health Score** ring (Green >75, Orange 50–75, Red <50).
   - Factor impact breakdown list with green/red up-down arrows.
   - Action buttons: "Add to Compare", "Forecast this car", and "Predict another".
2. **Dashboard (`/dashboard`)**:
   - **Tab 1: Recommended**: Identifies optimal 24-month selling window, price boost action checklist with rupee gains, and top 5 better-value alternative brands via `GET /recommendations`.
   - **Tab 2: Past**: User prediction history with brand/date filters, timeline line chart, brand frequency bar chart, stat cards, and table with Re-run and Add to Compare actions.
   - **Tab 3: Future**: Multi-year depreciation forecasting (1 to 10 years) with shaded range confidence bands, annual mileage slider, maintenance scenario toggle (Well Maintained vs. Neglected), and yearly valuation schedule.
   - **Tab 4: Compare**: Side-by-side comparison of 2–3 vehicles, grouped bar chart (Now vs. 3-Year value), multi-dimensional radar chart (Price, Health, Retention, Low Mileage, Modern Age), winner category badges, and verdict summary.
3. **History (`/history`)**:
   - Tabular view of all historical valuations sorted newest first.
   - Real-time search filter across brand, fuel, transmission, or owner.
   - In-place single item deletion and "Clear All" with modal confirmation.
   - "Export CSV" feature to download structured appraisal data.
   - Custom automotive empty state when no records exist.
4. **Settings (`/settings`)**:
   - Dark Automotive Dashboard vs. Light Daylight theme switcher.
   - Localization: Toggle currency between ₹ (INR) and $ (USD) with an editable exchange rate.
   - Distance unit toggle: Kilometers (km) vs. Miles (mi).
   - Pre-fill defaults for brand and fuel.
   - Table density control (Comfortable vs. Compact rows).
   - Database purge and factory settings reset.
5. **Profile (`/profile`)**:
   - User identity card with initials avatar circle, full name, and email badge.
   - Editable driver and contact information (full name, email, phone, city, preferred brand) with client validation and localStorage persistence.
   - Real-time user appraisal metrics: total predictions, average predicted price, most predicted marque, and last appraisal date.
   - Recent 5 valuations list with direct link to the History page.
   - Fast navigation to Settings and profile reset controls.

---

## 🔧 How Condition Adjustments Work (Rule-Based)

> **Important**: Physical condition and working status adjustments are deterministic **rule-based estimates**, not directly learned from the historical dataset (which does not record physical wear or repair history).

1. **Base Prediction**: The machine learning model first predicts `base_price` from mechanical specifications (`brand`, `year`, `km_driven`, `fuel`, `transmission`, `owner`).
2. **Economic Modifiers**: Multiplicative coefficients are applied from `backend/adjustments.py`:
   - **Overall Condition**: Excellent ($\times 1.05$), Good ($\times 1.00$), Fair ($\times 0.92$), Poor ($\times 0.80$)
   - **Working Status**: Fully working ($\times 1.00$), Minor issues ($\times 0.95$), Major repairs needed ($\times 0.80$), Not running ($\times 0.60$)
   - **Accident History**: None ($\times 1.00$), Minor ($\times 0.95$), Major ($\times 0.85$)
   - **Service Records**: Full records ($\times 1.03$), Partial ($\times 1.00$), None ($\times 0.95$)
   - **Extras**: AC working ($+2\%$), New tyres ($+2\%$), Insurance valid ($+1\%$)
3. **Clamping & Bounds**: The combined multiplier is safely bounded between $0.40$ and $1.10$.
4. **Health Score Calculation**: A weighted 0–100 index derived from Condition (40%), Working Status (30%), Accident History (15%), and Service History (15%).

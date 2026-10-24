"""
Vehicle Condition, Working Status, and History Adjustments.
Applies rule-based economic adjustments and computes health score.
"""

from typing import Dict, Any, List, Tuple


ADJUSTMENT_CONFIG = {
    # 1. Overall Condition Multipliers (baseline = Good @ 1.00)
    "condition": {
        "Excellent": 1.05,
        "Good": 1.00,
        "Fair": 0.92,
        "Poor": 0.80,
    },
    # 2. Mechanical Working Status (baseline = Fully working @ 1.00)
    "working_status": {
        "Fully working": 1.00,
        "Minor issues": 0.95,
        "Major repairs needed": 0.80,
        "Major repairs": 0.80,
        "Not running": 0.60,
    },
    # 3. Accident History (baseline = None @ 1.00)
    "accident_history": {
        "None": 1.00,
        "Minor": 0.95,
        "Major": 0.85,
    },
    # 4. Service History (baseline = Partial @ 1.00)
    "service_history": {
        "Full records": 1.03,
        "Full": 1.03,
        "Partial": 1.00,
        "None": 0.95,
    },
    # 5. Extras (% additions)
    "extras": {
        "ac_working": 0.02,     # +2%
        "new_tyres": 0.02,      # +2%
        "insurance_valid": 0.01 # +1%
    },
    # Bounds for combined multiplier
    "clamp_min": 0.40,
    "clamp_max": 1.10,

    # Health score component scores (0 to 100 scale)
    "health_scores": {
        "condition": {
            "Excellent": 100,
            "Good": 80,
            "Fair": 50,
            "Poor": 20,
        },
        "working_status": {
            "Fully working": 100,
            "Minor issues": 75,
            "Major repairs needed": 40,
            "Major repairs": 40,
            "Not running": 0,
        },
        "accident_history": {
            "None": 100,
            "Minor": 60,
            "Major": 20,
        },
        "service_history": {
            "Full records": 100,
            "Full": 100,
            "Partial": 70,
            "None": 30,
        }
    },
    # Component weights summing to 1.0
    "health_weights": {
        "condition": 0.40,
        "working_status": 0.30,
        "accident_history": 0.15,
        "service_history": 0.15,
    }
}


def calculate_health_score(
    condition: str = "Good",
    working_status: str = "Fully working",
    accident_history: str = "None",
    service_history: str = "Partial",
) -> int:
    """
    Compute vehicle health score (0 to 100):
    condition 40%, working 30%, accident 15%, service 15%.
    """
    hs_map = ADJUSTMENT_CONFIG["health_scores"]
    weights = ADJUSTMENT_CONFIG["health_weights"]

    c_score = hs_map["condition"].get(condition, 80)
    w_score = hs_map["working_status"].get(working_status, 100)
    a_score = hs_map["accident_history"].get(accident_history, 100)
    s_score = hs_map["service_history"].get(service_history, 70)

    score = (
        c_score * weights["condition"]
        + w_score * weights["working_status"]
        + a_score * weights["accident_history"]
        + s_score * weights["service_history"]
    )
    return int(round(max(0, min(100, score))))


def calculate_price_adjustments(
    base_price: float,
    condition: str = "Good",
    working_status: str = "Fully working",
    accident_history: str = "None",
    service_history: str = "Partial",
    extras: Dict[str, bool] = None,
    mae: float = 25000.0,
) -> Tuple[float, float, float, List[Dict[str, Any]], int]:
    """
    Apply rule-based adjustments to the base ML model prediction.
    Returns:
    (adjusted_price, price_low, price_high, breakdown_list, health_score)
    """
    if extras is None:
        extras = {}

    m_cond = ADJUSTMENT_CONFIG["condition"].get(condition, 1.00)
    m_work = ADJUSTMENT_CONFIG["working_status"].get(working_status, 1.00)
    m_acc = ADJUSTMENT_CONFIG["accident_history"].get(accident_history, 1.00)
    m_serv = ADJUSTMENT_CONFIG["service_history"].get(service_history, 1.00)

    extras_delta = 0.0
    if extras.get("ac_working"):
        extras_delta += ADJUSTMENT_CONFIG["extras"]["ac_working"]
    if extras.get("new_tyres"):
        extras_delta += ADJUSTMENT_CONFIG["extras"]["new_tyres"]
    if extras.get("insurance_valid"):
        extras_delta += ADJUSTMENT_CONFIG["extras"]["insurance_valid"]

    # Raw combined multiplier
    raw_multiplier = (m_cond * m_work * m_acc * m_serv) + extras_delta
    # Clamp between 0.40 and 1.10
    clamped_multiplier = max(
        ADJUSTMENT_CONFIG["clamp_min"],
        min(ADJUSTMENT_CONFIG["clamp_max"], raw_multiplier)
    )

    adjusted_price = max(10000.0, round(base_price * clamped_multiplier, 2))
    price_low = max(0.0, round(adjusted_price - mae, 2))
    price_high = round(adjusted_price + mae, 2)

    # Detailed impact breakdown list
    breakdown = []
    if m_cond != 1.0:
        impact = round(base_price * (m_cond - 1.0), 2)
        breakdown.append({
            "factor": f"Condition: {condition}",
            "impact": impact,
            "multiplier": m_cond
        })

    if m_work != 1.0:
        impact = round(base_price * (m_work - 1.0), 2)
        breakdown.append({
            "factor": f"Working Status: {working_status}",
            "impact": impact,
            "multiplier": m_work
        })

    if m_acc != 1.0:
        impact = round(base_price * (m_acc - 1.0), 2)
        breakdown.append({
            "factor": f"Accident: {accident_history}",
            "impact": impact,
            "multiplier": m_acc
        })

    if m_serv != 1.0:
        impact = round(base_price * (m_serv - 1.0), 2)
        breakdown.append({
            "factor": f"Service History: {service_history}",
            "impact": impact,
            "multiplier": m_serv
        })

    if extras.get("ac_working"):
        impact = round(base_price * ADJUSTMENT_CONFIG["extras"]["ac_working"], 2)
        breakdown.append({
            "factor": "AC Working (+2%)",
            "impact": impact,
            "multiplier": 1.02
        })

    if extras.get("new_tyres"):
        impact = round(base_price * ADJUSTMENT_CONFIG["extras"]["new_tyres"], 2)
        breakdown.append({
            "factor": "New Tyres (+2%)",
            "impact": impact,
            "multiplier": 1.02
        })

    if extras.get("insurance_valid"):
        impact = round(base_price * ADJUSTMENT_CONFIG["extras"]["insurance_valid"], 2)
        breakdown.append({
            "factor": "Valid Insurance (+1%)",
            "impact": impact,
            "multiplier": 1.01
        })

    health_score = calculate_health_score(
        condition=condition,
        working_status=working_status,
        accident_history=accident_history,
        service_history=service_history,
    )

    return adjusted_price, price_low, price_high, breakdown, health_score

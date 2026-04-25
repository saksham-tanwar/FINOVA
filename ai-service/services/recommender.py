import os
from typing import Any

import requests
from dotenv import load_dotenv


load_dotenv()

NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://localhost:5000")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")

mutual_fund_catalog = [
    {
        "id": "mf-001",
        "name": "SBI Bluechip Fund",
        "category": "Large Cap",
        "riskLevel": "medium",
        "oneYearReturn": 18.4,
        "nav": 78.52,
        "minSIP": 500,
    },
    {
        "id": "mf-002",
        "name": "HDFC Top 100 Fund",
        "category": "Large Cap",
        "riskLevel": "medium",
        "oneYearReturn": 16.9,
        "nav": 912.35,
        "minSIP": 500,
    },
    {
        "id": "mf-003",
        "name": "ICICI Prudential Bluechip Fund",
        "category": "Large Cap",
        "riskLevel": "medium",
        "oneYearReturn": 17.8,
        "nav": 101.24,
        "minSIP": 100,
    },
    {
        "id": "mf-004",
        "name": "Kotak Emerging Equity Fund",
        "category": "Mid Cap",
        "riskLevel": "high",
        "oneYearReturn": 24.1,
        "nav": 82.14,
        "minSIP": 500,
    },
    {
        "id": "mf-005",
        "name": "Nippon India Growth Fund",
        "category": "Mid Cap",
        "riskLevel": "high",
        "oneYearReturn": 26.3,
        "nav": 3421.67,
        "minSIP": 100,
    },
    {
        "id": "mf-006",
        "name": "Axis Midcap Fund",
        "category": "Mid Cap",
        "riskLevel": "high",
        "oneYearReturn": 21.7,
        "nav": 89.41,
        "minSIP": 500,
    },
    {
        "id": "mf-007",
        "name": "Mirae Asset Tax Saver Fund",
        "category": "ELSS",
        "riskLevel": "high",
        "oneYearReturn": 19.6,
        "nav": 39.76,
        "minSIP": 500,
    },
    {
        "id": "mf-008",
        "name": "Canara Robeco ELSS Tax Saver",
        "category": "ELSS",
        "riskLevel": "medium",
        "oneYearReturn": 20.8,
        "nav": 153.84,
        "minSIP": 500,
    },
    {
        "id": "mf-009",
        "name": "HDFC Short Term Debt Fund",
        "category": "Debt",
        "riskLevel": "low",
        "oneYearReturn": 7.1,
        "nav": 29.33,
        "minSIP": 1000,
    },
    {
        "id": "mf-010",
        "name": "ICICI Prudential Corporate Bond Fund",
        "category": "Debt",
        "riskLevel": "low",
        "oneYearReturn": 7.6,
        "nav": 44.92,
        "minSIP": 100,
    },
]


def generate_recommendations(user_id: str, risk_profile: str, amount: float) -> dict[str, Any]:
    held_funds = set()

    try:
        response = requests.get(
            f"{NODE_BACKEND_URL}/api/investments/internal/portfolio",
            params={"userId": user_id},
            headers=(
                {"x-internal-api-key": INTERNAL_API_KEY}
                if INTERNAL_API_KEY
                else None
            ),
            timeout=10,
        )
        if response.ok:
            portfolio = response.json()
            held_funds = {
                investment["instrumentName"]
                for investment in portfolio.get("byType", {}).get("mutual_fund", [])
            }
    except requests.RequestException:
        pass

    recommendations = []

    for fund in mutual_fund_catalog:
        score = 0.0

        if fund["riskLevel"] == risk_profile:
            score += 40

        if fund["name"] not in held_funds:
            score += 30

        score += min((fund["oneYearReturn"] / 15) * 30, 30)

        reason_parts = []

        if fund["riskLevel"] == risk_profile:
            reason_parts.append("matches your selected risk profile")
        if fund["name"] not in held_funds:
            reason_parts.append("improves diversification because you do not already hold it")
        reason_parts.append(
            f"has a strong 1-year return of {fund['oneYearReturn']}%"
        )
        reason_parts.append(f"fits an investment ticket of around INR {amount:,.0f}")

        recommendations.append(
            {
                "fund": fund,
                "score": round(score, 2),
                "reason": f"{fund['name']} was recommended because it "
                + ", ".join(reason_parts)
                + ".",
            }
        )

    recommendations.sort(key=lambda item: item["score"], reverse=True)

    return {"recommendations": recommendations[:3]}

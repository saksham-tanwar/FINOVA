import os
import re
from typing import Any

import requests
import spacy
from dotenv import load_dotenv


load_dotenv()

NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://localhost:5000")
EMAIL_LABELS = [
    "file insurance claim",
    "fund transfer request",
    "investment query",
    "policy update",
    "complaint",
    "general inquiry",
]

nlp = spacy.load("en_core_web_sm")

INTENT_KEYWORDS = {
    "file insurance claim": [
        "claim",
        "insurance",
        "accident",
        "hospital",
        "damage",
        "policy",
        "reimbursement",
    ],
    "fund transfer request": [
        "transfer",
        "send money",
        "pay",
        "beneficiary",
        "imps",
        "neft",
        "rtgs",
    ],
    "investment query": [
        "invest",
        "mutual fund",
        "stock",
        "sip",
        "fd",
        "portfolio",
        "return",
    ],
    "policy update": [
        "policy update",
        "renewal",
        "premium",
        "coverage",
        "update policy",
    ],
    "complaint": [
        "complaint",
        "issue",
        "problem",
        "delay",
        "failed",
        "angry",
    ],
}


def _extract_entities(email_text: str) -> dict[str, Any]:
    doc = nlp(email_text)

    policy_match = re.search(r"POL-\d+", email_text)
    amount_match = re.search(r"(?:₹|Rs\.?)\s*[\d,]+", email_text)
    person_match = next((ent.text for ent in doc.ents if ent.label_ == "PERSON"), None)

    return {
      "policy_number": policy_match.group(0) if policy_match else None,
      "amount": amount_match.group(0) if amount_match else None,
      "name": person_match,
    }


def _log_ai_activity(payload: dict[str, Any]) -> None:
    try:
        requests.post(f"{NODE_BACKEND_URL}/api/ai/log", json=payload, timeout=10)
    except requests.RequestException:
        pass


def _classify_intent(email_text: str) -> tuple[str, float]:
    lowered = email_text.lower()
    best_label = "general inquiry"
    best_score = 0.0

    for label in EMAIL_LABELS:
        keywords = INTENT_KEYWORDS.get(label, [])
        score = sum(1 for keyword in keywords if keyword in lowered)
        if score > best_score:
            best_label = label
            best_score = float(score)

    if best_score == 0:
        return "general inquiry", 0.35

    confidence = min(0.55 + best_score * 0.1, 0.95)
    return best_label, confidence


def process_email(email_text: str, user_id: str) -> dict[str, Any]:
    intent, confidence = _classify_intent(email_text)
    entities = _extract_entities(email_text)
    action_taken = "Guidance provided"
    message = "No backend action required. A response draft has been prepared."

    if intent == "file insurance claim":
        claim_payload = {
            "policyId": entities.get("policy_number"),
            "claimType": "Email initiated claim",
            "description": email_text,
            "userId": user_id,
        }
        try:
            response = requests.post(
                f"{NODE_BACKEND_URL}/api/insurance/internal/claims",
                json=claim_payload,
                timeout=10,
            )
            action_taken = "Insurance claim request forwarded"
            message = (
                "Claim request has been forwarded for review."
                if response.ok
                else "Claim intent detected. Manual review is required before filing."
            )
        except requests.RequestException:
            action_taken = "Insurance claim suggested"
            message = "Claim intent detected. Manual filing is recommended."
    elif intent == "fund transfer request":
        action_taken = "Transfer suggestion generated"
        message = (
            "A transfer request was detected. Review the Transfer dashboard before moving funds."
        )
    elif intent == "investment query":
        action_taken = "Investment guidance provided"
        message = "This appears to be an investment query. Review the Investments dashboard for details."
    elif intent == "policy update":
        action_taken = "Policy update guidance provided"
        message = "This appears related to a policy update. Check the Insurance dashboard for active policies."
    elif intent == "complaint":
        action_taken = "Complaint guidance provided"
        message = "A complaint was detected. Route this to support or admin review."

    _log_ai_activity(
        {
            "userId": user_id,
            "agentType": "email",
            "inputSummary": email_text[:250],
            "outputSummary": f"{intent} ({confidence:.2f})",
            "actionTaken": action_taken,
        }
    )

    return {
        "intent": intent,
        "confidence": confidence,
        "entities": entities,
        "action_taken": action_taken,
        "message": message,
    }

import os
import re
from typing import Any

import requests
import spacy
from dotenv import load_dotenv
from transformers import pipeline


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

classifier = pipeline(
    "zero-shot-classification", model="facebook/bart-large-mnli"
)
nlp = spacy.load("en_core_web_sm")


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


def process_email(email_text: str, user_id: str) -> dict[str, Any]:
    result = classifier(email_text, EMAIL_LABELS)
    intent = result["labels"][0]
    confidence = float(result["scores"][0])
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

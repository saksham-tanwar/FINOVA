import re
import tempfile
from typing import Any

import fitz
import pytesseract
import spacy
from PIL import Image


nlp = spacy.load("en_core_web_sm")


def extract_document_data(file_bytes: bytes, content_type: str) -> dict[str, Any]:
    extracted_text = ""

    if content_type == "application/pdf":
        with fitz.open(stream=file_bytes, filetype="pdf") as document:
            extracted_text = "\n".join(page.get_text() for page in document)
    elif content_type in {"image/jpeg", "image/png"}:
        suffix = ".jpg" if content_type == "image/jpeg" else ".png"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp_file:
            temp_file.write(file_bytes)
            temp_path = temp_file.name
        extracted_text = pytesseract.image_to_string(Image.open(temp_path))
    else:
        raise ValueError("Unsupported file type")

    doc = nlp(extracted_text)

    person = next((ent.text for ent in doc.ents if ent.label_ == "PERSON"), None)
    date = next((ent.text for ent in doc.ents if ent.label_ == "DATE"), None)
    money = next((ent.text for ent in doc.ents if ent.label_ == "MONEY"), None)

    policy_number = re.search(r"POL-\d+", extracted_text)
    phone = re.search(r"(?:\+91[-\s]?)?[6-9]\d{9}", extracted_text)
    email = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", extracted_text)
    claim_amount = re.search(r"(?:₹|Rs\.?)\s*[\d,]+", extracted_text)

    populated_fields = [
        value
        for value in [person, date, money, policy_number.group(0) if policy_number else None]
        if value
    ]
    confidence = min(0.99, 0.45 + len(populated_fields) * 0.12)

    return {
        "extracted_text": extracted_text[:500],
        "fields": {
            "name": person,
            "date": date,
            "amount": money or (claim_amount.group(0) if claim_amount else None),
            "policy_number": policy_number.group(0) if policy_number else None,
            "phone": phone.group(0) if phone else None,
            "email": email.group(0) if email else None,
        },
        "confidence": confidence,
    }

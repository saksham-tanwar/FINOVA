from typing import Any

import numpy as np
from sentence_transformers import SentenceTransformer


qa_pairs = [
    {"question": "How do I check my balance?", "answer": "Open the Banking dashboard to view your live account balance and account details."},
    {"question": "Where can I see my account balance?", "answer": "Your balance is shown on the Banking tab inside the dashboard."},
    {"question": "How do I transfer money?", "answer": "Use the Transfer tab, choose IMPS, NEFT, or RTGS, confirm the recipient, and submit."},
    {"question": "Can I transfer to a new account?", "answer": "Yes. In Transfer, choose New Transfer and enter the receiver account manually."},
    {"question": "How do I use saved beneficiaries?", "answer": "Open the Transfer tab and switch to Saved Beneficiaries to pick an existing recipient."},
    {"question": "What are current FD rates?", "answer": "The Fixed Deposits section lists available tenures and rates before you create an FD."},
    {"question": "How do I create a fixed deposit?", "answer": "Go to Investments, open Fixed Deposits, enter amount and tenure, then create the FD."},
    {"question": "Can I break my FD early?", "answer": "Yes. In My FDs you can break an active FD, and the system calculates penalty-adjusted returns."},
    {"question": "What is SIP?", "answer": "SIP is a recurring mutual fund investment that invests a fixed amount on a chosen day each month."},
    {"question": "How do I enable SIP?", "answer": "When investing in a mutual fund, enable the SIP toggle and set the SIP amount and SIP day."},
    {"question": "How do I invest in mutual funds?", "answer": "Open Investments, choose Mutual Funds, select a fund, and confirm the investment amount."},
    {"question": "How do I redeem a mutual fund?", "answer": "In My Mutual Funds, choose an active holding and click Redeem."},
    {"question": "How do I search for stocks?", "answer": "Use the Stocks tab in Investments to search by company or symbol."},
    {"question": "How do I buy a stock?", "answer": "Search the stock, enter the number of units, and click Buy from the Stocks tab."},
    {"question": "How do I sell a stock?", "answer": "In My Holdings, choose an active stock position and click Sell."},
    {"question": "Where can I see my portfolio?", "answer": "The Investments dashboard shows your holdings, total invested value, and portfolio chart."},
    {"question": "How do I file an insurance claim?", "answer": "Go to Insurance, click File New Claim, choose a policy, add details, and upload your documents."},
    {"question": "Where can I see my insurance policies?", "answer": "The Insurance dashboard shows all your active and past policies in My Policies."},
    {"question": "How do I purchase insurance?", "answer": "Browse plans in the Insurance dashboard and confirm the first premium deduction to purchase a plan."},
    {"question": "What documents can I upload for a claim?", "answer": "Claims accept PDF, JPG, and PNG files up to five files per submission."},
    {"question": "How do I track my claims?", "answer": "Your Insurance dashboard shows all claims and a timeline for their current status."},
    {"question": "What does under review mean?", "answer": "Under review means the insurer or admin is currently evaluating your claim documents."},
    {"question": "How do I check my transactions?", "answer": "Open the Transactions tab to view debits, credits, filters, and pagination."},
    {"question": "How do I add a beneficiary?", "answer": "Use the Beneficiaries tab to save a recipient with account number, IFSC, and bank name."},
    {"question": "How do I delete a beneficiary?", "answer": "In Beneficiaries, select the beneficiary card and confirm deletion."},
    {"question": "My OTP is not working", "answer": "Try requesting a fresh OTP. If it still fails, re-register or contact support for verification help."},
    {"question": "I did not receive OTP", "answer": "Check your inbox and spam folder, then retry registration if the OTP has expired."},
    {"question": "How do I reset my password?", "answer": "Use Forgot Password on the login page to receive a reset link by email."},
    {"question": "My account is frozen", "answer": "If your account is frozen, contact admin support immediately and avoid initiating transfers until resolved."},
    {"question": "Why was my transfer rejected?", "answer": "Transfers can fail due to insufficient balance, invalid accounts, or manual restrictions."},
    {"question": "What is NEFT?", "answer": "NEFT is a bank transfer method typically used for standard scheduled transfers."},
    {"question": "What is RTGS?", "answer": "RTGS is generally used for higher-value real-time transfers through the banking network."},
    {"question": "What is IMPS?", "answer": "IMPS is an instant payment method designed for quick account-to-account transfers."},
    {"question": "Can I get investment recommendations?", "answer": "Yes. Use the AI recommendations tab and provide your risk profile and investment amount."},
    {"question": "How do stock prices update?", "answer": "Stock prices are fetched live when possible and cached briefly to reduce repeated API calls."},
    {"question": "How do mutual fund recommendations work?", "answer": "Recommendations consider your risk profile, diversification needs, and recent fund returns."},
    {"question": "Where do I see insurance claim status?", "answer": "Claim status is visible in My Claims along with the claim timeline."},
    {"question": "How do I scan a document?", "answer": "Use the Document Scanner tab to upload a PDF or image and extract key fields."},
    {"question": "What can the email agent do?", "answer": "The Email Agent classifies email intent, extracts entities, and suggests or triggers follow-up actions."},
    {"question": "What can the chatbot help with?", "answer": "The chatbot can guide you on banking, investments, claims, transfers, and account issues."},
]

embedding_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
encoded_questions = None


def initialize_chatbot() -> None:
    global encoded_questions
    questions = [pair["question"] for pair in qa_pairs]
    encoded_questions = embedding_model.encode(questions, convert_to_numpy=True)


def _cosine_similarity(vector_a: np.ndarray, vector_b: np.ndarray) -> float:
    denominator = np.linalg.norm(vector_a) * np.linalg.norm(vector_b)
    if denominator == 0:
        return 0.0
    return float(np.dot(vector_a, vector_b) / denominator)


def get_chat_response(message: str) -> dict[str, Any]:
    if encoded_questions is None:
        initialize_chatbot()

    query_embedding = embedding_model.encode(message, convert_to_numpy=True)
    scores = np.array(
        [_cosine_similarity(query_embedding, question) for question in encoded_questions]
    )

    best_index = int(scores.argmax())
    best_score = float(scores[best_index])

    if best_score <= 0.45:
        return {
            "response": "I’m not fully sure about that yet. Try the relevant dashboard tab or ask a more specific banking question.",
            "confidence": best_score,
            "suggestions": ["Banking dashboard", "Investments dashboard", "Insurance dashboard"],
        }

    answer = qa_pairs[best_index]["answer"]
    lower_message = message.lower()
    suggestions = ["Transfer help", "View transactions", "Insurance claims"]

    if any(keyword in lower_message for keyword in ["balance", "portfolio", "holding", "investment"]):
        suggestions = ["Check Banking dashboard", "Check Investments dashboard", "View portfolio"]

    return {
        "response": answer,
        "confidence": best_score,
        "suggestions": suggestions,
    }

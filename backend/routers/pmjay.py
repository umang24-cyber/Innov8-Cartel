"""
Ayushman Bharat PM-JAY (NAFU) — TMS Pre-Authorization Router
============================================================
National Anti-Fraud Unit (NAFU) endpoint for Ayushman Bharat claim auditing.
Rule-based Heuristic Engine + LLM. No ML model or dataset required.
"""

import logging
from fastapi import APIRouter
from pydantic import BaseModel, Field

log = logging.getLogger(__name__)

router = APIRouter()


# ── Pydantic Models ─────────────────────────────────────────────────────────
class AyushmanClaimRequest(BaseModel):
    """Request body for NAFU TMS Pre-authorization audit."""
    ABHA_ID: str = Field(..., description="Ayushman Bharat Health Account ID")
    PMJAY_Package_Code: str = Field(..., description="PM-JAY HBP Package Code")
    Diagnosis_Code: str = Field(..., description="ICD-10 Diagnosis Code")
    Procedure_Code: str = Field(..., description="Procedure Code")
    Total_Claim_Amount: float = Field(..., gt=0, description="Claim amount in INR")
    Unstructured_Notes: str = Field(..., description="Clinical notes")


class AyushmanResponse(BaseModel):
    """NAFU TMS Pre-authorization audit response."""
    abha_verified: bool
    risk_score: int
    risk_label: str  # "CRITICAL" | "HIGH" | "LOW"
    nafu_audit_finding: str


def _simulate_bis_ekyc(abha_id: str) -> bool:
    """Simulate BIS e-KYC: verified if ABHA ID starts with '91'."""
    normalized = abha_id.replace("-", "").replace(" ", "").strip()
    return normalized.startswith("91")


def _get_risk_thresholds() -> tuple[int, int]:
    """Read Critical and High thresholds from backend settings if available."""
    try:
        from main import app_settings_store
        critical = int(app_settings_store.get("criticalRiskThreshold", 65))
        high = int(app_settings_store.get("highRiskThreshold", 40))
        return critical, high
    except Exception:
        return 65, 40


def _rule_based_risk_engine(amount: float, notes: str) -> tuple[int, str]:
    """
    Rule-Based Risk Engine (NO ML MODEL).
    Base=15. Wallet>450k +45, >100k +25. OPD-to-IPD keywords +35. Cap at 98.
    Risk labels use thresholds from admin settings.
    """
    risk_score = 15

    if amount > 450_000:
        risk_score += 45  # Wallet Depletion Risk
    elif amount > 100_000:
        risk_score += 25

    notes_lower = notes.lower()
    if any(w in notes_lower for w in ("mild", "routine", "normal")):
        risk_score += 35  # OPD-to-IPD Risk

    risk_score = min(98, risk_score)

    critical_th, high_th = _get_risk_thresholds()
    if risk_score >= critical_th:
        risk_label = "CRITICAL"
    elif risk_score >= high_th:
        risk_label = "HIGH"
    else:
        risk_label = "LOW"

    return risk_score, risk_label


def _run_llm_audit(abha_id: str, billed_amount: float, package_code: str, clinical_notes: str) -> str:
    """Uses Groq LLM as NAFU Medical Auditor with safe content extraction."""
    from main import app_state

    if not app_state.groq_client:
        return "LLM analysis unavailable — GROQ_API_KEY not configured."

    system_prompt = (
        "You are a strict National Anti-Fraud Unit (NAFU) Medical Auditor for AB-PMJAY. "
        "Protect the ₹5 Lakh family limit. Look for: 1. OPD-to-IPD Conversion. 2. Upcoding. "
        "Respond in exactly 3 sentences citing PM-JAY guidelines."
    )

    user_prompt = (
        f"ABHA ID: {abha_id}\n"
        f"Billed Amount: ₹{billed_amount:,.2f}\n"
        f"Package Code: {package_code}\n"
        f"Clinical Notes: {clinical_notes}\n\n"
        "Provide NAFU clinical audit findings."
    )

    try:
        response = app_state.groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,
            max_tokens=250,
        )
        content = response.choices[0].message.content
        audit_finding = content.strip() if content else "API Error: Blank response received from LLM."
        return audit_finding
    except Exception as exc:
        log.error(f"Groq NAFU audit error: {exc}")
        return f"LLM analysis unavailable: {str(exc)[:200]}"


@router.post("/audit", response_model=AyushmanResponse)
async def audit_claim(req: AyushmanClaimRequest):
    """
    NAFU TMS Pre-authorization check.
    Flow: 1) Simulate BIS e-KYC, 2) Rule-based risk engine, 3) LLM audit.
    """
    abha_verified = _simulate_bis_ekyc(req.ABHA_ID)
    risk_score, risk_label = _rule_based_risk_engine(req.Total_Claim_Amount, req.Unstructured_Notes)

    nafu_audit_finding = _run_llm_audit(
        abha_id=req.ABHA_ID,
        billed_amount=req.Total_Claim_Amount,
        package_code=req.PMJAY_Package_Code,
        clinical_notes=req.Unstructured_Notes,
    )

    return AyushmanResponse(
        abha_verified=abha_verified,
        risk_score=risk_score,
        risk_label=risk_label,
        nafu_audit_finding=nafu_audit_finding,
    )

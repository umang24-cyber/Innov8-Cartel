"""
Ayushman Bharat PM-JAY (NAFU) — TMS Pre-Authorization Router
============================================================
National Anti-Fraud Unit (NAFU) endpoint for Ayushman Bharat claim auditing.
Provides BIS (ABHA) validation, Wallet Depletion check, and Groq LLM clinical audit.
"""

import logging
from fastapi import APIRouter, HTTPException
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
    bis_verified: bool
    wallet_depletion_flag: bool
    risk_score: int
    clinical_findings: str
    advisory_note: str


def _validate_abha_bis(abha_id: str) -> bool:
    """
    BIS (ABHA ID) validation — simulate True if ABHA ID starts with '91'.
    In production, this would call the ABHA/Health Repository.
    """
    # Normalize: remove dashes/spaces for check
    normalized = abha_id.replace("-", "").replace(" ", "")
    return normalized.startswith("91")


def _check_wallet_depletion(amount: float) -> bool:
    """Flag if Total_Claim_Amount exceeds ₹5,00,000 (family floater limit)."""
    return amount > 500_000


def _run_clinical_audit(
    abha_id: str,
    billed_amount: float,
    package_code: str,
    clinical_notes: str,
) -> str:
    """
    Uses Groq LLM as NAFU Medical Auditor.
    System prompt and user prompt per NAFU requirements.
    """
    # Import here to avoid circular import at module load
    from main import app_state

    if not app_state.groq_client:
        return "LLM analysis unavailable — GROQ_API_KEY not configured."

    system_prompt = (
        "You are a strict National Anti-Fraud Unit (NAFU) Medical Auditor for the Ayushman Bharat PM-JAY scheme. "
        "Protect the ₹5 Lakh family floater limit. Look strictly for: "
        "1. OPD-to-IPD Conversion (Admitting for minor issues). "
        "2. Upcoding (Billing high-tier HBP codes for minor procedures). "
        "3. Phantom Billing. "
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
        if content:
            return content.strip()
        return "Groq returned a blank response."
    except Exception as exc:
        log.error(f"Groq NAFU audit error: {exc}")
        return f"LLM analysis unavailable: {str(exc)[:200]}"


@router.post("/audit", response_model=AyushmanResponse)
async def audit_claim(req: AyushmanClaimRequest):
    """
    NAFU TMS Pre-authorization check.
    Flow: 1) Validate ABHA (BIS), 2) Check Wallet Depletion, 3) Groq Clinical Audit.
    """
    bis_verified = _validate_abha_bis(req.ABHA_ID)
    wallet_depletion_flag = _check_wallet_depletion(req.Total_Claim_Amount)

    clinical_findings = _run_clinical_audit(
        abha_id=req.ABHA_ID,
        billed_amount=req.Total_Claim_Amount,
        package_code=req.PMJAY_Package_Code,
        clinical_notes=req.Unstructured_Notes,
    )

    # Simulated risk score (0–100) — higher if wallet depletion or BIS failure
    risk_score = 25
    if not bis_verified:
        risk_score += 50
    if wallet_depletion_flag:
        risk_score += 30
    risk_score = min(100, risk_score)

    return AyushmanResponse(
        bis_verified=bis_verified,
        wallet_depletion_flag=wallet_depletion_flag,
        risk_score=risk_score,
        clinical_findings=clinical_findings,
        advisory_note=(
            "⚠️ ADVISORY TOOL ONLY — NAFU flags anomalies for human review. "
            "No claim is automatically approved or rejected. "
            "All final decisions must be made by a qualified PM-JAY investigator."
        ),
    )

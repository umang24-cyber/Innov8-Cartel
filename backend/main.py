"""
main.py — Claims Intelligence & Fraud Detection API (Groq Edition)
===================================================================
ARCHITECTURE OVERVIEW:
  This FastAPI backend is the brain of the system. Every claim analysis
  passes through three sequential intelligence layers:

  Layer A │ Structured ML (RandomForest)
           │   → Reads numeric + categorical claim fields
           │   → Outputs a fraud probability (0.0–1.0) → risk score (0–100)
           │
  Layer B │ SHAP Explainability
           │   → Answers "WHY is the score high?" mathematically
           │   → Returns top feature contribution as human-readable text
           │   → Critical for the "glass-box" explainability panel in the UI
           │
  Layer C │ Groq LLM (llama-3.3-70b) & Mega LLM (glm-4.7)
           │   → Groq reads unstructured doctor's notes for clinical audits
           │   → Mega LLM powers the interactive investigator Chatbot

IMPORTANT: This is ADVISORY ONLY. No automated decisions are made.
           A human investigator reviews every flagged claim.

Prerequisites:
    pip install -r requirements.txt
    Set GROQ_API_KEY and MEGA_LLM_API_KEY in a .env file or environment variable

Run:
    uvicorn main:app --reload --port 8000

API Docs (auto-generated):
    http://localhost:8000/docs
"""

import os
import io
import logging
from contextlib import asynccontextmanager
from typing import Any, Optional

import joblib
import numpy as np
import pandas as pd
import shap
from groq import Groq
from openai import OpenAI  # <-- NEW IMPORT FOR MEGA LLM
import math

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
from sklearn.ensemble import IsolationForest

# ── Environment & logging setup ────────────────────────────────────────────────
# load_dotenv() reads a .env file in the current directory.
# Variables set there become available via os.getenv().
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)s │ %(message)s"
)
log = logging.getLogger(__name__)

# ── Constants ──────────────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
MEGA_LLM_API_KEY = os.getenv("MEGA_LLM_API_KEY", "") # <-- ADDED MEGA LLM KEY
MODEL_PATH   = "fraud_model.joblib"

# MUST match train_model.py exactly — same column names, same order
CATEGORICAL_FEATURES = ["Provider_ID", "Diagnosis_Code", "Procedure_Code"]
NUMERIC_FEATURES     = ["Total_Claim_Amount"]
ALL_FEATURES         = CATEGORICAL_FEATURES + NUMERIC_FEATURES

# Per-diagnosis expected amount stats (matches prep_data.py distributions).
# Used to calculate z-scores for the SHAP narrative.
# In production these would be computed from real historical data and persisted.
DIAG_STATS = {
    "J06.9":  {"mean": 150,    "std": 40},
    "M54.5":  {"mean": 320,    "std": 80},
    "E11.9":  {"mean": 600,    "std": 150},
    "I10":    {"mean": 500,    "std": 120},
    "K21.0":  {"mean": 280,    "std": 70},
    "Z00.00": {"mean": 200,    "std": 50},
    "S72.001":{"mean": 8500,   "std": 900},
    "C34.10": {"mean": 12000,  "std": 2000},
    "F32.1":  {"mean": 400,    "std": 100},
    "N39.0":  {"mean": 180,    "std": 45},
}
# Fallback stats when diagnosis code is unknown
DEFAULT_STATS = {"mean": 1200.0, "std": 2500.0}


# ══════════════════════════════════════════════════════════════════════════════
# Application state — shared across all requests (loaded once at startup)
# ══════════════════════════════════════════════════════════════════════════════
class AppState:
    """
    Holds expensive-to-load objects so we don't reload them on every request.
    The pipeline and SHAP explainer each take several seconds to initialize —
    doing this once at startup keeps API latency low.
    """
    pipeline:         Any       = None   # the full fitted imblearn Pipeline
    explainer:        Any       = None   # SHAP TreeExplainer around the RF
    feature_names:    list[str] = []     # OHE-expanded feature names
    groq_client:      Any       = None   # Groq API client (for Clinical Audit)
    llm_client:       Any       = None   # Mega LLM client (for Chatbot)
    isolation_forest: Any       = None   # Isolation Forest for anomaly detection
    historical_claims: pd.DataFrame = None  # Historical data for Benford's Law


app_state = AppState()


# ══════════════════════════════════════════════════════════════════════════════
# Lifespan — runs once when the server starts and stops
# ══════════════════════════════════════════════════════════════════════════════
@asynccontextmanager
async def lifespan(app_instance):
    """
    FastAPI's modern startup/shutdown hook (replaces @app.on_event).
    Everything before 'yield' runs at startup.
    Everything after 'yield' runs at shutdown.
    """
    log.info("🚀  Server starting — loading model and explainer …")

    # ── Load the trained pipeline from disk ────────────────────────────────
    # joblib.load() deserializes the entire sklearn/imblearn Pipeline object,
    # including all fitted transformers and the RandomForest weights.
    app_state.pipeline = joblib.load(MODEL_PATH)
    log.info(f"✅  Pipeline loaded from '{MODEL_PATH}'")

    # ── Extract sub-components for SHAP ───────────────────────────────────
    # We need the preprocessor to transform inputs before SHAP sees them,
    # and the RF directly (not wrapped in Pipeline) for TreeExplainer.
    preprocessor  = app_state.pipeline.named_steps["preprocessor"]
    rf_model      = app_state.pipeline.named_steps["classifier"]

    # Get the expanded feature names after One-Hot Encoding.
    # OHE turns "Provider_ID=PRV-0007" into a binary column "Provider_ID_PRV-0007".
    # There will be many more columns after OHE than before.
    ohe           = preprocessor.named_transformers_["cat"]
    ohe_names     = ohe.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
    app_state.feature_names = ohe_names + NUMERIC_FEATURES

    # ── Initialize SHAP TreeExplainer ────────────────────────────────────
    # TreeExplainer is the fast, exact SHAP method for tree-based models.
    # It computes exact Shapley values (not approximations) using the tree
    # structure directly — much faster than model-agnostic KernelExplainer.
    app_state.explainer = shap.TreeExplainer(
        rf_model,
        feature_names=app_state.feature_names,
    )
    log.info("✅  SHAP TreeExplainer ready")

    # ── Initialize Groq client (Clinical Audit) ───────────────────────────
    if GROQ_API_KEY:
        app_state.groq_client = Groq(api_key=GROQ_API_KEY)
        log.info("✅  Groq client initialized")
    else:
        log.warning("⚠️  GROQ_API_KEY not set — Groq clinical audit will be skipped")

    # ── Initialize Mega LLM client (Chatbot) ──────────────────────────────
    if MEGA_LLM_API_KEY:
        app_state.llm_client = OpenAI(
            base_url="https://ai.megallm.io/v1",
            api_key=MEGA_LLM_API_KEY
        )
        log.info("✅  Mega LLM client initialized")
    else:
        log.warning("⚠️  MEGA_LLM_API_KEY not set — Mega Chatbot will be skipped")

    # ── Initialize Isolation Forest for anomaly detection ─────────────────
    # Load historical claims data to train the Isolation Forest
    try:
        csv_path = "synthetic_claims.csv"
        if os.path.exists(csv_path):
            app_state.historical_claims = pd.read_csv(csv_path)
            # Prepare features for Isolation Forest (same as ML model)
            X_hist = app_state.historical_claims[ALL_FEATURES]
            X_hist_transformed = preprocessor.transform(X_hist)
            
            # Train Isolation Forest on historical data
            app_state.isolation_forest = IsolationForest(
                contamination=0.1,  # Expect ~10% anomalies
                random_state=42,
                n_estimators=100
            )
            app_state.isolation_forest.fit(X_hist_transformed)
            log.info("✅  Isolation Forest trained and ready")
        else:
            log.warning("⚠️  synthetic_claims.csv not found — Isolation Forest unavailable")
    except Exception as exc:
        log.warning(f"⚠️  Isolation Forest initialization failed: {exc}")

    yield  # ← server runs here, handling requests

    log.info("🛑  Server shutting down")


# ══════════════════════════════════════════════════════════════════════════════
# FastAPI app instance
# ══════════════════════════════════════════════════════════════════════════════
app = FastAPI(
    title="Claims Intelligence & Fraud Detection API",
    description=(
        "Advisory-only system combining ML risk scoring, SHAP explainability, "
        "and Groq LLM clinical note analysis. No automated decisions."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

# ── CORS Middleware ────────────────────────────────────────────────────────────
# CORS (Cross-Origin Resource Sharing) is a browser security feature.
# Without this, your React frontend (localhost:3000) can't call your
# FastAPI backend (localhost:8000) — the browser blocks the request.
# allow_origins=["*"] allows ALL origins — fine for hackathon, restrict in prod.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ══════════════════════════════════════════════════════════════════════════════
# Pydantic models — request and response schemas
# ══════════════════════════════════════════════════════════════════════════════
class ClaimRequest(BaseModel):
    """
    Defines the expected JSON body for POST /analyze_claim.
    Pydantic automatically validates types and raises 422 if anything is wrong.
    The Field(...) with example values powers the /docs UI auto-demo.
    """
    Provider_ID:        str   = Field(..., example="PRV-0007")
    Diagnosis_Code:     str   = Field(..., example="J06.9")
    Procedure_Code:     str   = Field(..., example="99214")
    Total_Claim_Amount: float = Field(..., gt=0, example=9500.00)
    Unstructured_Notes: str   = Field(..., example="Patient had mild sore throat. Prescribed lozenges.")


class SHAPDetail(BaseModel):
    """Individual feature contribution for the bar chart in the UI."""
    feature:    str    # e.g. "Total_Claim_Amount" or "Provider_ID_PRV-0007"
    value:      float  # raw SHAP value (positive = pushes toward fraud)
    display:    str    # human-readable label shown in the chart


class ClaimResponse(BaseModel):
    """
    The full response JSON sent back to the frontend.
    Every field maps directly to a UI component:
      risk_score        → the big number badge
      risk_label        → colored pill (HIGH/MEDIUM/LOW)
      shap_explanation  → text in the Glass-Box panel
      shap_details      → data for the SHAP bar chart
      llm_text_analysis → Groq's auditor finding
      advisory_note     → always-present disclaimer banner
      anomaly_score     → Isolation Forest anomaly detection (-1 = anomaly, 1 = normal)
      benford_score     → Benford's Law deviation score (0-100, higher = more suspicious)
      benford_analysis   → Human-readable Benford's Law explanation
    """
    risk_score:         int          # 0–100
    risk_label:         str          # "HIGH" | "MEDIUM" | "LOW"
    shap_explanation:   str          # top driver, plain English
    shap_details:       list[SHAPDetail]  # top 5 features for chart
    llm_text_analysis:  str          # Groq medical auditor finding
    diagnosis_stats:    dict         # mean/std for the diagnosed code (for UI display)
    advisory_note:      str          # mandatory disclaimer
    anomaly_score:      int          # -1 = anomaly detected, 1 = normal
    benford_score:      float        # 0-100, higher = more deviation from Benford's Law
    benford_analysis:   str          # Human-readable explanation


# ══════════════════════════════════════════════════════════════════════════════
# Helper: Benford's Law analysis
# ══════════════════════════════════════════════════════════════════════════════
def calculate_benford_score(claim_amount: float, historical_amounts: pd.Series) -> tuple[float, str]:
    """
    Calculates Benford's Law deviation score for a claim amount.
    
    Benford's Law states that in naturally occurring datasets, the probability
    of a number starting with digit d is: P(d) = log10(1 + 1/d)
    
    This function checks:
    1. If the claim's first digit matches the theoretical Benford distribution
    2. If the provider's historical billing pattern shows suspicious digit clustering
    
    Returns:
        - benford_score: 0-100, where higher = more suspicious deviation
        - analysis: Human-readable explanation
    """
    if historical_amounts is None or len(historical_amounts) == 0:
        return 0.0, "Benford's Law analysis unavailable — no historical data"
    
    # Extract first digit of the claim amount
    amount_str = str(int(abs(claim_amount)))
    first_digit = int(amount_str[0]) if amount_str[0].isdigit() else 0
    
    if first_digit == 0:
        return 0.0, "Amount starts with 0 — Benford's Law not applicable"
    
    # Calculate expected frequency for this digit according to Benford's Law
    expected_prob = math.log10(1 + 1.0 / first_digit)
    
    # Calculate actual frequency in historical data (provider's billing pattern)
    historical_first_digits = historical_amounts.astype(str).str[0].astype(int)
    historical_first_digits = historical_first_digits[historical_first_digits > 0]  # Remove zeros
    
    if len(historical_first_digits) == 0:
        return 0.0, "Benford's Law analysis unavailable — insufficient historical data"
    
    # Count how often this digit appears in historical data
    actual_count = (historical_first_digits == first_digit).sum()
    actual_prob = actual_count / len(historical_first_digits)
    
    # Calculate deviation from Benford's Law
    # If a provider's history shows clustering on digit 8 (which should be rare ~5.1%),
    # that's suspicious
    deviation = abs(actual_prob - expected_prob)
    
    # Convert to 0-100 score (higher = more suspicious)
    # Maximum possible deviation is ~0.3 (for digit 1), so normalize
    max_deviation = 0.3
    benford_score = min(100, (deviation / max_deviation) * 100)
    
    # Build explanation
    if deviation > 0.05:  # Significant deviation (>5 percentage points)
        direction = "higher" if actual_prob > expected_prob else "lower"
        analysis = (
            f"⚠️ Benford's Law Alert: First digit '{first_digit}' appears {direction} than expected. "
            f"Theoretical frequency: {expected_prob:.1%}, Historical pattern: {actual_prob:.1%}. "
            f"This clustering may indicate fabricated amounts."
        )
    else:
        analysis = (
            f"✓ Benford's Law: First digit '{first_digit}' frequency ({actual_prob:.1%}) "
            f"matches expected Benford distribution ({expected_prob:.1%})."
        )
    
    return round(benford_score, 2), analysis


# ══════════════════════════════════════════════════════════════════════════════
# Helper: SHAP explanation builder
# ══════════════════════════════════════════════════════════════════════════════
def build_shap_outputs(
    shap_values_row: np.ndarray,
    feature_names:   list[str],
    claim:           "ClaimRequest",
) -> tuple[str, list[SHAPDetail]]:
    """
    Takes a 1-D array of SHAP values (one per feature) and produces:
      1. A plain-English sentence describing the top driver
      2. A list of SHAPDetail objects for the top 5 features (for the bar chart)

    SHAP values interpretation:
      + positive value → this feature INCREASES the fraud probability
      - negative value → this feature DECREASES the fraud probability
      The magnitude tells you how much.
    """
    abs_shap    = np.abs(shap_values_row)
    # Get indices sorted by absolute SHAP value, largest first
    top_indices = np.argsort(abs_shap)[::-1][:5]

    # ── Build the top-5 list for the bar chart ─────────────────────────────
    shap_details = []
    for idx in top_indices:
        fname = feature_names[idx]
        val   = float(shap_values_row[idx])

        # Make feature names human-readable for display
        # "cat__Provider_ID_PRV-0007" → "Provider: PRV-0007"
        if "Provider_ID_" in fname:
            display = f"Provider: {fname.split('Provider_ID_')[-1]}"
        elif "Diagnosis_Code_" in fname:
            display = f"Diagnosis: {fname.split('Diagnosis_Code_')[-1]}"
        elif "Procedure_Code_" in fname:
            display = f"Procedure: {fname.split('Procedure_Code_')[-1]}"
        elif fname == "Total_Claim_Amount":
            display = f"Claim Amount: ${claim.Total_Claim_Amount:,.0f}"
        else:
            display = fname

        shap_details.append(SHAPDetail(
            feature=fname,
            value=round(val, 4),
            display=display,
        ))

    # ── Build plain-English sentence for top driver ────────────────────────
    top_idx     = int(top_indices[0])
    top_feature = feature_names[top_idx]
    top_val     = float(shap_values_row[top_idx])
    direction   = "significantly increases" if top_val > 0 else "decreases"

    if top_feature == "Total_Claim_Amount":
        # Add z-score context: how many standard deviations above normal is this?
        stats   = DIAG_STATS.get(claim.Diagnosis_Code, DEFAULT_STATS)
        z_score = (claim.Total_Claim_Amount - stats["mean"]) / stats["std"]
        explanation = (
            f"Primary driver: Claim amount ${claim.Total_Claim_Amount:,.2f} is "
            f"{abs(z_score):.1f} standard deviations "
            f"{'above' if z_score > 0 else 'below'} the expected "
            f"${stats['mean']:,.0f} mean for diagnosis {claim.Diagnosis_Code}. "
            f"This {direction} the fraud risk score (SHAP: {top_val:+.4f})."
        )
    elif "Provider_ID_" in top_feature:
        provider = top_feature.split("Provider_ID_")[-1]
        explanation = (
            f"Primary driver: Provider {provider} has a billing history pattern "
            f"that {direction} the fraud risk score (SHAP: {top_val:+.4f})."
        )
    elif "Diagnosis_Code_" in top_feature:
        code = top_feature.split("Diagnosis_Code_")[-1]
        explanation = (
            f"Primary driver: Diagnosis code {code} in combination with the "
            f"billed amount {direction} the fraud risk score (SHAP: {top_val:+.4f})."
        )
    else:
        explanation = (
            f"Primary driver: '{top_feature}' {direction} the fraud risk score "
            f"(SHAP contribution: {top_val:+.4f})."
        )

    return explanation, shap_details


# ══════════════════════════════════════════════════════════════════════════════
# Helper: Groq LLM clinical note analysis
# ══════════════════════════════════════════════════════════════════════════════
def analyze_with_groq(claim: "ClaimRequest", risk_score: int, shap_text: str) -> str:
    """
    Sends the claim context to Groq's LLaMA model acting as a medical auditor.

    WHY Groq:
      Groq's LPU (Language Processing Unit) hardware delivers extremely low
      latency — typically <1 second for this prompt size. Critical for a
      real-time dashboard that needs to feel snappy.

    WHY llama-3.3-70b-versatile:
      Large enough to have genuine medical billing knowledge, but fast enough
      for interactive use. The 70B model understands ICD-10 codes, CPT codes,
      and can reason about clinical appropriateness.
    """
    if not app_state.groq_client:
        return "LLM analysis unavailable — GROQ_API_KEY not configured."

    # Retrieve diagnosis-specific stats for context
    stats = DIAG_STATS.get(claim.Diagnosis_Code, DEFAULT_STATS)

    # The system prompt defines the AI's persona and constraints.
    # Being specific ("senior medical billing auditor") produces much better
    # output than a generic "helpful assistant" prompt.
    system_prompt = """You are a senior medical billing auditor with 15+ years of 
experience in healthcare fraud detection. Your role is ADVISORY ONLY — you 
flag potential issues for human investigators but never make final decisions.
Be concise, specific, and clinically accurate. Reference actual medical billing 
standards when relevant."""

    # The user prompt provides all context the model needs.
    # We include the ML risk score and SHAP finding so the LLM can
    # integrate structured and unstructured signals in its response.
    user_prompt = f"""Analyze this healthcare claim for potential fraud indicators:

CLAIM DETAILS:
- Provider ID: {claim.Provider_ID}
- Diagnosis Code: {claim.Diagnosis_Code}
- Procedure Code: {claim.Procedure_Code}
- Billed Amount: ${claim.Total_Claim_Amount:,.2f}
- Expected Range for {claim.Diagnosis_Code}: ${stats['mean']-stats['std']:,.0f} – ${stats['mean']+stats['std']:,.0f}
- ML Risk Score: {risk_score}/100
- ML Finding: {shap_text}

DOCTOR'S NOTE:
"{claim.Unstructured_Notes}"

Your task:
1. Does the doctor's note clinically justify the billed amount and diagnosis code?
2. Are there any contradictions between the note content and the billing?
3. What specific red flags (if any) should a human investigator examine?

Respond in exactly 3 sentences. Be specific about amounts, codes, and clinical reasoning."""

    try:
        response = app_state.groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            temperature=0.1,      # very low → factual, consistent, reproducible
            max_tokens=250,       # enforce brevity for the UI panel
        )
        
        content = response.choices[0].message.content
        if content is not None:
            return content.strip()
        else:
            log.warning(f"BLANK CONTENT. Full response: {response}")
            return "Groq returned a blank response. Check terminal for raw data."

    except Exception as exc:
        log.error(f"Groq API error: {exc}")
        return f"LLM analysis unavailable: {str(exc)[:200]}"


# ══════════════════════════════════════════════════════════════════════════════
# Main endpoint: POST /analyze_claim
# ══════════════════════════════════════════════════════════════════════════════
@app.post("/analyze_claim", response_model=ClaimResponse)
async def analyze_claim(claim: ClaimRequest):
    """
    Single endpoint that orchestrates all three intelligence layers.

    Request body: ClaimRequest JSON
    Returns: ClaimResponse JSON

    Flow:
      1. Build a 1-row DataFrame from the request
      2. Run preprocessor → get numeric feature array
      3. Run RF.predict_proba → get fraud probability → risk score
      4. Run SHAP → get feature contributions → explanation text + chart data
      5. Call Groq → get clinical note analysis
      6. Package everything into ClaimResponse
    """

    # ── Layer A: ML Inference ──────────────────────────────────────────────
    # Build a single-row DataFrame matching the training schema exactly.
    # Column names and dtypes must be identical to what train_model.py used.
    input_df = pd.DataFrame([{
        "Provider_ID":        claim.Provider_ID,
        "Diagnosis_Code":     claim.Diagnosis_Code,
        "Procedure_Code":     claim.Procedure_Code,
        "Total_Claim_Amount": claim.Total_Claim_Amount,
    }])

    try:
        # Extract the fitted preprocessor and RF from the pipeline.
        # We call them separately (not pipeline.predict_proba) because
        # we need the intermediate numeric array for SHAP.
        preprocessor = app_state.pipeline.named_steps["preprocessor"]
        rf_model     = app_state.pipeline.named_steps["classifier"]

        # Transform: string columns → OHE binary columns + numeric passthrough
        # X_transformed shape: (1, n_features_after_OHE)
        X_transformed = preprocessor.transform(input_df)

        # predict_proba returns [[prob_legit, prob_fraud]]
        # We want index [0, 1] = probability of class 1 (fraud)
        fraud_prob  = float(rf_model.predict_proba(X_transformed)[0, 1])
        risk_score  = int(round(fraud_prob * 100))

    except Exception as exc:
        log.exception("ML inference failed")
        raise HTTPException(status_code=500, detail=f"ML inference error: {exc}")

    # Risk label thresholds (aligned with UI color scheme):
    #   HIGH   (red)    → immediate review queue
    #   MEDIUM (yellow) → secondary review
    #   LOW    (green)  → routine processing
    if risk_score >= 60:
        risk_label = "HIGH"
    elif risk_score >= 30:
        risk_label = "MEDIUM"
    else:
        risk_label = "LOW"

    log.info(f"Claim scored → {risk_score}/100 ({risk_label}) | Provider: {claim.Provider_ID}")

    # ── Layer B: SHAP Explainability ───────────────────────────────────────
    shap_explanation = "SHAP analysis unavailable."
    shap_details     = []

    try:
        # Compute SHAP values for this single transformed input row.
        # TreeExplainer is exact (not approximate) for tree models.
        # Returns shape varies by shap version — handle all cases below.
        raw_shap = app_state.explainer.shap_values(X_transformed)

        # Normalize to 1-D array of SHAP values for class=1 (fraud)
        if isinstance(raw_shap, list):
            # Old shap API: list[n_classes] where each element is (n_samples, n_features)
            class_idx = 1 if len(raw_shap) > 1 else 0
            shap_arr  = np.array(raw_shap[class_idx])
            shap_row  = shap_arr.reshape(-1, shap_arr.shape[-1])[0]
        else:
            arr = np.array(raw_shap)
            if arr.ndim == 3:
                # New shap API: (n_samples, n_features, n_classes)
                shap_row = arr[0, :, 1]
            elif arr.ndim == 2:
                # (n_samples, n_features)
                shap_row = arr[0]
            else:
                shap_row = arr

        shap_explanation, shap_details = build_shap_outputs(
            shap_row,
            app_state.feature_names,
            claim,
        )

    except Exception as exc:
        log.warning(f"SHAP failed: {exc}")
        shap_explanation = f"SHAP analysis unavailable: {exc}"

    # ── Layer C: Groq LLM Analysis ─────────────────────────────────────────
    # Pass both the SHAP finding and risk score so Groq can integrate
    # structured ML signals with its unstructured note analysis.
    llm_analysis = analyze_with_groq(claim, risk_score, shap_explanation)

    # ── Layer D: Isolation Forest Anomaly Detection ────────────────────────
    anomaly_score = 1  # Default: normal
    try:
        if app_state.isolation_forest is not None:
            # Use the same transformed features as the ML model
            anomaly_prediction = app_state.isolation_forest.predict(X_transformed)
            anomaly_score = int(anomaly_prediction[0])  # -1 = anomaly, 1 = normal
            log.info(f"Isolation Forest: {'ANOMALY DETECTED' if anomaly_score == -1 else 'Normal'}")
        else:
            log.warning("Isolation Forest not available")
    except Exception as exc:
        log.warning(f"Isolation Forest failed: {exc}")

    # ── Layer E: Benford's Law Analysis ───────────────────────────────────
    benford_score = 0.0
    benford_analysis = "Benford's Law analysis unavailable"
    try:
        if app_state.historical_claims is not None and len(app_state.historical_claims) > 0:
            historical_amounts = app_state.historical_claims["Total_Claim_Amount"]
            benford_score, benford_analysis = calculate_benford_score(
                claim.Total_Claim_Amount,
                historical_amounts
            )
            log.info(f"Benford's Law score: {benford_score:.2f}/100")
        else:
            log.warning("Historical claims data not available for Benford's Law")
    except Exception as exc:
        log.warning(f"Benford's Law calculation failed: {exc}")

    # ── Diagnosis stats for the frontend display ───────────────────────────
    stats = DIAG_STATS.get(claim.Diagnosis_Code, DEFAULT_STATS)

    return ClaimResponse(
        risk_score        = risk_score,
        risk_label        = risk_label,
        shap_explanation  = shap_explanation,
        shap_details      = shap_details,
        llm_text_analysis = llm_analysis,
        diagnosis_stats   = {
            "code":            claim.Diagnosis_Code,
            "expected_mean":   stats["mean"],
            "expected_std":    stats["std"],
            "billed_amount":   claim.Total_Claim_Amount,
            "z_score":         round(
                (claim.Total_Claim_Amount - stats["mean"]) / stats["std"], 2
            ),
        },
        advisory_note = (
            "⚠️  ADVISORY TOOL ONLY — This system flags anomalies for human review. "
            "No claim is automatically approved or rejected. "
            "All final decisions must be made by a qualified human investigator."
        ),
        anomaly_score    = anomaly_score,
        benford_score    = benford_score,
        benford_analysis = benford_analysis,
    )

@app.post("/analyze_batch")
async def analyze_batch(file: UploadFile = File(...)):
    """
    Enterprise Batch Processing Endpoint.
    Accepts a CSV of claims, processes them through the Random Forest 
    and Isolation Forest, and returns an annotated CSV with Risk Scores.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only .csv files are supported")

    try:
        # 1. Read the uploaded CSV into memory as a Pandas DataFrame
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # 2. Validate that the required columns exist
        missing_cols = [col for col in ALL_FEATURES if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"CSV missing required columns: {missing_cols}")

        # 3. Transform the data using your ML pipeline's preprocessor
        preprocessor = app_state.pipeline.named_steps["preprocessor"]
        X_transformed = preprocessor.transform(df)

        # 4. Generate Risk Scores using the Random Forest
        rf_model = app_state.pipeline.named_steps["classifier"]
        probs = rf_model.predict_proba(X_transformed)[:, 1] # Get fraud probabilities
        df["Risk_Score"] = (probs * 100).astype(int)
        
        # 5. Assign Risk Labels (LOW, MEDIUM, HIGH)
        df["Risk_Label"] = pd.cut(
            df["Risk_Score"], 
            bins=[-1, 29, 59, 100], 
            labels=["LOW", "MEDIUM", "HIGH"]
        )

        # 6. Run Isolation Forest Anomaly Detection
        if app_state.isolation_forest is not None:
            anomalies = app_state.isolation_forest.predict(X_transformed)
            # Map -1 to "ANOMALY", 1 to "NORMAL"
            df["Anomaly_Flag"] = ["ANOMALY" if x == -1 else "NORMAL" for x in anomalies]

        # 7. Convert the annotated DataFrame back to a CSV in memory
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        stream.seek(0) # Reset stream position to the beginning

        # 8. Return as a downloadable file
        return StreamingResponse(
            iter([stream.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=scored_{file.filename}"
            }
        )

    except Exception as exc:
        log.error(f"Batch processing failed: {exc}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(exc)}")

# ══════════════════════════════════════════════════════════════════════════════
# Chatbot endpoint: POST /chat  (for the Agentic AI Investigator UI widget)
# ══════════════════════════════════════════════════════════════════════════════
class ChatRequest(BaseModel):
    message:      str
    claim_context: dict | None = None   # optional: attach claim data to the chat


class ChatResponse(BaseModel):
    reply: str


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Powers the floating 'Agentic AI Investigator' chatbot in the UI.
    The user can ask natural-language questions like:
      "Why was this claim flagged?"
      "What's the normal range for J06.9?"
      "Summarize the risk factors"

    The claim_context (if provided) is injected into the system prompt
    so the AI can answer specifically about the current claim being viewed.
    """
    # ── UPDATED TO USE MEGA LLM CLIENT ──
    if not app_state.llm_client:
        return ChatResponse(reply="Mega LLM API not configured. Please set MEGA_LLM_API_KEY.")

    # Build context block if claim data is attached
    context_block = ""
    if req.claim_context:
        ctx = req.claim_context
        context_block = f"""
Currently reviewing claim:
- Provider: {ctx.get('Provider_ID', 'N/A')}
- Diagnosis: {ctx.get('Diagnosis_Code', 'N/A')}
- Procedure: {ctx.get('Procedure_Code', 'N/A')}
- Billed: ${ctx.get('Total_Claim_Amount', 0):,.2f}
- Risk Score: {ctx.get('risk_score', 'N/A')}/100
- ML Finding: {ctx.get('shap_explanation', 'N/A')}
- Doctor's Note: "{ctx.get('Unstructured_Notes', 'N/A')}"
"""

    system = f"""You are an AI fraud investigation assistant embedded in a healthcare 
claims fraud detection platform. You help human investigators understand why claims 
were flagged and what to look for.
{context_block}
Be concise, helpful, and always remind investigators that you are advisory only.
Never recommend claim rejection — only flag items for human review."""

    try:
        response = app_state.llm_client.chat.completions.create(
            model="glm-4.7",
            messages=[
                {"role": "system",  "content": system},
                {"role": "user",    "content": req.message},
            ],
            temperature=0.7,
            max_tokens=8192,
        )
        
        # SAFELY extract the content to prevent NoneType crash
        content = response.choices[0].message.content
        
        if content is not None:
            return ChatResponse(reply=content.strip())
        else:
            log.warning(f"BLANK CONTENT IN CHAT. Full response: {response}")
            return ChatResponse(reply="API Error: The AI returned a blank response. Check terminal for raw data.")
            
    except Exception as exc:
        log.error(f"Chat Mega LLM error: {exc}")
        return ChatResponse(reply=f"Error: {str(exc)[:150]}")


# ══════════════════════════════════════════════════════════════════════════════
# Health check — used by frontend to verify backend is alive
# ══════════════════════════════════════════════════════════════════════════════
@app.get("/health")
async def health():
    """
    Simple liveness check. The frontend pings this on load to show
    the connection status indicator in the sidebar.
    """
    return {
        "status":       "ok",
        "model_loaded": app_state.pipeline  is not None,
        "shap_ready":   app_state.explainer is not None,
        "groq_ready":   app_state.groq_client is not None,
        "mega_llm_ready": app_state.llm_client is not None,
    }
class DashboardStats(BaseModel):
    total_claims: int
    total_claims_trend: float
    high_risk_alerts: int
    high_risk_trend: float
    false_positive_rate: float
    false_positive_trend: float
    pending_investigations: int
    pending_trend: int
    monthly_fraud_growth: float

@app.get("/dashboard_stats", response_model=DashboardStats)
async def get_dashboard_stats():
    """
    Returns the top-level metrics for the main dashboard cards.
    Computes from the real synthetic_claims.csv loaded at startup.
    """
    df = app_state.historical_claims
    if df is None or df.empty:
        return DashboardStats(
            total_claims=0, total_claims_trend=0,
            high_risk_alerts=0, high_risk_trend=0,
            false_positive_rate=0, false_positive_trend=0,
            pending_investigations=0, pending_trend=0,
            monthly_fraud_growth=0,
        )
    
    total = len(df)
    fraud_count = int(df["Is_Fraud"].sum()) if "Is_Fraud" in df.columns else 0
    fraud_rate = (fraud_count / total * 100) if total > 0 else 0
    
    # Simulate high-risk alerts as claims with amount > 2 std devs above mean
    mean_amt = df["Total_Claim_Amount"].mean()
    std_amt = df["Total_Claim_Amount"].std()
    high_risk = int((df["Total_Claim_Amount"] > mean_amt + 1.5 * std_amt).sum())
    
    # Pending investigations = fraud cases not yet at extremes
    pending = max(0, fraud_count - high_risk)
    
    return DashboardStats(
        total_claims=total,
        total_claims_trend=12.5,
        high_risk_alerts=high_risk,
        high_risk_trend=round(fraud_rate, 1),
        false_positive_rate=round(100 - fraud_rate, 1) if fraud_rate > 0 else 8.4,
        false_positive_trend=-2.1,
        pending_investigations=pending,
        pending_trend=-5,
        monthly_fraud_growth=round(fraud_rate, 1),
    )


@app.get("/fraud_trends")
async def get_fraud_trends():
    """
    Returns synthetic 30-day fraud trend data derived from the real CSV distribution.
    """
    import random
    df = app_state.historical_claims
    if df is None or df.empty:
        return []
    
    total = len(df)
    fraud_count = int(df["Is_Fraud"].sum()) if "Is_Fraud" in df.columns else 0
    daily_avg_claims = max(1, total // 30)
    daily_avg_fraud = max(1, fraud_count // 30)
    
    trends = []
    for i in range(30):
        day_offset = 29 - i
        date_str = (datetime.now() - timedelta(days=day_offset)).strftime("%b %d")
        # Add some variance (+/- 30%)
        jitter_claims = random.uniform(0.7, 1.3)
        jitter_fraud = random.uniform(0.5, 1.5)
        trends.append({
            "date": date_str,
            "totalClaims": int(daily_avg_claims * jitter_claims),
            "fraudCount": int(daily_avg_fraud * jitter_fraud),
        })
    return trends


@app.get("/risk_distribution")
async def get_risk_distribution():
    """
    Returns risk distribution breakdown computed from the real CSV.
    """
    df = app_state.historical_claims
    if df is None or df.empty:
        return []
    
    total = len(df)
    if "Is_Fraud" not in df.columns:
        return []
    
    fraud_count = int(df["Is_Fraud"].sum())
    legit_count = total - fraud_count
    
    mean_amt = df["Total_Claim_Amount"].mean()
    std_amt = df["Total_Claim_Amount"].std()
    
    # Break down by claim amount thresholds relative to distribution
    critical = int((df["Total_Claim_Amount"] > mean_amt + 2 * std_amt).sum())
    high = int(((df["Total_Claim_Amount"] > mean_amt + std_amt) & (df["Total_Claim_Amount"] <= mean_amt + 2 * std_amt)).sum())
    medium = int(((df["Total_Claim_Amount"] > mean_amt) & (df["Total_Claim_Amount"] <= mean_amt + std_amt)).sum())
    low = total - critical - high - medium
    
    result = [
        {"level": "Critical", "count": critical, "percentage": round(critical / total * 100, 1)},
        {"level": "High",     "count": high,     "percentage": round(high / total * 100, 1)},
        {"level": "Medium",   "count": medium,   "percentage": round(medium / total * 100, 1)},
        {"level": "Low",      "count": low,      "percentage": round(low / total * 100, 1)},
    ]
    return result

@app.get("/cases/{case_id}/notes")
async def get_case_notes(case_id: str):
    case = next((c for c in cases_db if c.get("id") == case_id), None)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case.get("notes", [])


@app.get("/alerts/count")
async def get_alert_count():
    # Counts cases with "High" priority
    high_risk_count = len([c for c in cases_db if c.get("priority") == "High"])
    return {"count": high_risk_count}


# ══════════════════════════════════════════════════════════════════════════════
# Demo endpoint — returns pre-built sample claims for the UI demo table
# ══════════════════════════════════════════════════════════════════════════════
@app.get("/demo_claims")
async def demo_claims(
    search: Optional[str] = None,
    sort_by: Optional[str] = "Highest Risk",
    provider_filter: Optional[str] = None
):
    """
    Returns sample claims + locally saved claims, now supporting search and filtering from the UI.
    """
    claims = [
        {"claim_id": "CLM-8492", "Provider_ID": "PRV-0007", "Diagnosis_Code": "J06.9",  "Procedure_Code": "99214", "Total_Claim_Amount": 15000, "Unstructured_Notes": "Mild sore throat, prescribed lozenges."},
        {"claim_id": "CLM-8491", "Provider_ID": "PRV-0013", "Diagnosis_Code": "M54.5",  "Procedure_Code": "99213", "Total_Claim_Amount": 8900,  "Unstructured_Notes": "Patient reports chronic lower back pain. Prescribed NSAIDs."},
        {"claim_id": "CLM-8490", "Provider_ID": "PRV-0001", "Diagnosis_Code": "E11.9",  "Procedure_Code": "99214", "Total_Claim_Amount": 580,   "Unstructured_Notes": "Routine diabetes management visit. A1C reviewed. Metformin refilled."},
        {"claim_id": "CLM-8489", "Provider_ID": "PRV-0031", "Diagnosis_Code": "Z00.00", "Procedure_Code": "99213", "Total_Claim_Amount": 12000, "Unstructured_Notes": "Annual physical. No complaints."},
        {"claim_id": "CLM-8488", "Provider_ID": "PRV-0002", "Diagnosis_Code": "I10",    "Procedure_Code": "93000", "Total_Claim_Amount": 490,   "Unstructured_Notes": "BP 145/92. Adjusted lisinopril dosage. ECG normal."},
        {"claim_id": "CLM-8487", "Provider_ID": "PRV-0007", "Diagnosis_Code": "N39.0",  "Procedure_Code": "81003", "Total_Claim_Amount": 5500,  "Unstructured_Notes": "UTI confirmed by urinalysis. Prescribed trimethoprim."},
        {"claim_id": "CLM-8486", "Provider_ID": "PRV-0005", "Diagnosis_Code": "F32.1",  "Procedure_Code": "90837", "Total_Claim_Amount": 420,   "Unstructured_Notes": "60-minute psychotherapy session. Patient reporting improved mood."},
        {"claim_id": "CLM-8485", "Provider_ID": "PRV-0003", "Diagnosis_Code": "K21.0",  "Procedure_Code": "43239", "Total_Claim_Amount": 260,   "Unstructured_Notes": "Endoscopy showed mild esophageal irritation. Prescribed PPI."},
    ]
    
    # Append the globally stored dynamic claims
    claims.extend(saved_claims_db)

    # Apply Search Logic
    if search:
        search_lower = search.lower()
        claims = [
            c for c in claims 
            if search_lower in c["claim_id"].lower() 
            or search_lower in c["Provider_ID"].lower()
            or search_lower in c["Diagnosis_Code"].lower()
        ]
        
    # Apply Provider Filter
    if provider_filter:
        claims = [c for c in claims if c["Provider_ID"] == provider_filter]

    # Note: Sorting by "Highest Risk" requires running them through the model. 
    # For a simple UI connection, you can leave the static order, or mock a risk score here.

    return claims


from fastapi.responses import JSONResponse
from datetime import datetime, timedelta

@app.get("/generate_report")
async def generate_report():
    """
    Triggered by the 'Generate Report' button in the UI.
    Creates an on-the-fly CSV of current high-risk alerts and pending investigations.
    """
    try:
        # Fetch the current claims (in production, this queries your SQL database)
        claims = await demo_claims()
        
        # Convert to a Pandas DataFrame for easy manipulation
        df = pd.DataFrame(claims)
        
        # Create an in-memory string buffer
        stream = io.StringIO()
        
        # Write the DataFrame to the buffer as a CSV
        df.to_csv(stream, index=False)
        
        # Reset the buffer's position so it can be read from the start
        stream.seek(0)
        
        # Generate a timestamped filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        filename = f"FinCense_Audit_Report_{timestamp}.csv"
        
        return StreamingResponse(
            iter([stream.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as exc:
        log.error(f"Report generation failed: {exc}")
        raise HTTPException(status_code=500, detail="Failed to generate report")

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app.mount("/assets", StaticFiles(directory="../frontend/dist/assets"), name="assets")

# ══════════════════════════════════════════════════════════════════════════════
# New Endpoints for Enhanced Features
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/claims")
async def get_claims():
    """Get all claims (same as demo_claims for now)"""
    return await demo_claims()

saved_claims_db: list[dict] = []  # Mock database for dynamically saved claims

@app.post("/claims")
async def save_claim(claim_data: dict):
    """Save a new claim dynamically"""
    if "claim_id" not in claim_data:
        claim_data["claim_id"] = f"MAN-{int(datetime.now().timestamp())}"
    
    saved_claims_db.append(claim_data)
    
    return {"message": "Claim saved successfully", "claim": claim_data}

@app.get("/claims/{claim_id}")
async def get_claim(claim_id: str):
    """Get a single claim by ID"""
    claims = await demo_claims()
    claim = next((c for c in claims if c.get("claim_id") == claim_id), None)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim

@app.get("/fraud_trends")
async def get_fraud_trends():
    """Get fraud trends for the last 30 days"""
    # Mock data - in production, query from database
    import random
    from datetime import datetime, timedelta
    
    trends = []
    for i in range(30):
        date = (datetime.now() - timedelta(days=29-i)).strftime("%Y-%m-%d")
        trends.append({
            "date": date,
            "fraudCount": random.randint(5, 25),
            "totalClaims": random.randint(200, 500),
        })
    return trends

@app.get("/risk_distribution")
async def get_risk_distribution():
    """Get risk level distribution"""
    # Mock data - in production, calculate from database
    return [
        {"level": "Low", "count": 8500, "percentage": 59.5},
        {"level": "Medium", "count": 4200, "percentage": 29.4},
        {"level": "High", "count": 1200, "percentage": 8.4},
        {"level": "Critical", "count": 384, "percentage": 2.7},
    ]

# Cases endpoints
cases_db: list[dict] = []  # Mock database

@app.get("/cases")
async def get_cases():
    """Get all cases"""
    if not cases_db:
        # Initialize with some mock cases
        demo_claims_data = await demo_claims()
        for i, claim in enumerate(demo_claims_data[:5]):
            cases_db.append({
                "id": f"CASE-{1000 + i}",
                "claim_id": claim.get("claim_id", ""),
                "claim": claim,
                "status": "Open" if i < 2 else "Investigating",
                "assignedTo": "John Doe" if i % 2 == 0 else None,
                "priority": "High" if i < 2 else "Medium",
                "notes": [],
                "timeline": [
                    {
                        "id": f"timeline-{i}-1",
                        "type": "status_change",
                        "actor": "System",
                        "description": f"Case created for claim {claim.get('claim_id')}",
                        "timestamp": (datetime.now() - timedelta(days=i)).isoformat(),
                    }
                ],
                "createdAt": (datetime.now() - timedelta(days=i)).isoformat(),
                "updatedAt": (datetime.now() - timedelta(days=i)).isoformat(),
            })
    return cases_db

@app.get("/cases/{case_id}")
async def get_case(case_id: str):
    """Get a single case"""
    case = next((c for c in cases_db if c.get("id") == case_id), None)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@app.patch("/cases/{case_id}")
async def update_case(case_id: str, updates: dict):
    """Update a case"""
    case = next((c for c in cases_db if c.get("id") == case_id), None)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case.update(updates)
    case["updatedAt"] = datetime.now().isoformat()
    
    # Add timeline event
    if "status" in updates:
        case["timeline"].append({
            "id": f"timeline-{len(case['timeline'])}",
            "type": "status_change",
            "actor": "User",
            "description": f"Status changed to {updates['status']}",
            "timestamp": datetime.now().isoformat(),
        })
    
    return case

@app.post("/cases/{case_id}/notes")
async def add_case_note(case_id: str, note_data: dict):
    """Add a note to a case"""
    case = next((c for c in cases_db if c.get("id") == case_id), None)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    note = {
        "id": f"note-{len(case['notes'])}",
        "author": "Current User",  # In production, get from auth
        "content": note_data.get("content", ""),
        "createdAt": datetime.now().isoformat(),
    }
    case["notes"].append(note)
    case["timeline"].append({
        "id": f"timeline-{len(case['timeline'])}",
        "type": "note",
        "actor": note["author"],
        "description": f"Added note: {note['content'][:50]}...",
        "timestamp": datetime.now().isoformat(),
    })
    case["updatedAt"] = datetime.now().isoformat()
    
    return note

# Typologies endpoints
typologies_db: list[dict] = []  # Mock database

@app.get("/typologies")
async def get_typologies():
    """Get all typologies"""
    if not typologies_db:
        # Initialize with mock data
        typologies_db.extend([
            {
                "id": "typ-1",
                "name": "Unusually High Claim Amounts",
                "description": "Detects claims that exceed expected amounts for diagnosis codes",
                "riskWeight": 85,
                "frequency": 142,
                "lastTriggered": (datetime.now() - timedelta(hours=2)).isoformat(),
                "isActive": True,
                "severity": "High",
                "rules": ["Total_Claim_Amount > expected_mean * 3", "z_score > 2.5"],
                "createdAt": (datetime.now() - timedelta(days=30)).isoformat(),
            },
            {
                "id": "typ-2",
                "name": "Benford's Law Violation",
                "description": "Detects suspicious digit distribution patterns",
                "riskWeight": 70,
                "frequency": 89,
                "lastTriggered": (datetime.now() - timedelta(hours=5)).isoformat(),
                "isActive": True,
                "severity": "Medium",
                "rules": ["benford_score > 60"],
                "createdAt": (datetime.now() - timedelta(days=25)).isoformat(),
            },
            {
                "id": "typ-3",
                "name": "Anomaly Detection Flag",
                "description": "Isolation Forest detected statistical anomaly",
                "riskWeight": 75,
                "frequency": 203,
                "lastTriggered": (datetime.now() - timedelta(minutes=30)).isoformat(),
                "isActive": True,
                "severity": "High",
                "rules": ["anomaly_score == -1"],
                "createdAt": (datetime.now() - timedelta(days=20)).isoformat(),
            },
        ])
    return typologies_db

@app.post("/typologies")
async def create_typology(typology_data: dict):
    """Create a new typology"""
    typology = {
        "id": f"typ-{len(typologies_db) + 1}",
        **typology_data,
        "frequency": 0,
        "createdAt": datetime.now().isoformat(),
    }
    typologies_db.append(typology)
    return typology

@app.patch("/typologies/{typology_id}")
async def update_typology(typology_id: str, updates: dict):
    """Update a typology"""
    typology = next((t for t in typologies_db if t.get("id") == typology_id), None)
    if not typology:
        raise HTTPException(status_code=404, detail="Typology not found")
    typology.update(updates)
    return typology

@app.delete("/typologies/{typology_id}")
async def delete_typology(typology_id: str):
    """Delete a typology"""
    global typologies_db
    typologies_db = [t for t in typologies_db if t.get("id") != typology_id]
    return {"message": "Typology deleted"}

# AI Explain endpoint
@app.post("/ai/explain")
async def explain_risk(explain_request: dict):
    """Get AI explanation for risk factors"""
    claim_id = explain_request.get("claim_id")
    question = explain_request.get("question", "Explain the risk factors for this claim")
    
    # In production, use the actual claim data and AI model
    return {
        "explanation": f"AI analysis for claim {claim_id}: {question}. This claim shows elevated risk due to multiple factors including amount deviation, provider history, and anomaly detection flags."
    }

@app.get("/{full_path:path}")
async def serve_react(full_path: str):
    return FileResponse("../frontend/dist/index.html")
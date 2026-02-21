"""
prep_data.py — Synthetic Healthcare Claims Data Generator
==========================================================
Generates 5,000 synthetic healthcare claims with a realistic ~5% fraud rate.
Key design principle: fraud claims have LOGICALLY higher amounts for their
specific diagnosis code, making the ML signal meaningful, not random noise.

Run:
    python prep_data.py
Output:
    synthetic_claims.csv
"""

import numpy as np
import pandas as pd

# ── Reproducibility ────────────────────────────────────────────────────────────
SEED = 42
rng  = np.random.default_rng(SEED)

# ── Dataset size & fraud rate ──────────────────────────────────────────────────
N_CLAIMS    = 5_000
FRAUD_RATE  = 0.05          # 5 % → ~250 fraud rows
N_FRAUD     = int(N_CLAIMS * FRAUD_RATE)
N_LEGIT     = N_CLAIMS - N_FRAUD

# ── Realistic provider pool ────────────────────────────────────────────────────
# Mix of large (high-volume) and small (low-volume) providers.
# A handful of "bad actors" are seeded into fraudulent claims later.
PROVIDERS = [f"PRV-{str(i).zfill(4)}" for i in range(1, 51)]   # 50 providers
FRAUD_PROVIDERS = ["PRV-0007", "PRV-0013", "PRV-0031"]          # 3 bad actors

# ── Diagnosis codes and their NORMAL claim-amount distributions ────────────────
# Format: { ICD_code: (mean_usd, std_usd) }
# These represent typical reimbursement ranges per diagnosis.
DIAG_DISTRIBUTIONS = {
    "J06.9":  (150,   40),    # Upper respiratory infection — cheap
    "M54.5":  (320,   80),    # Low back pain
    "E11.9":  (600,  150),    # Type 2 diabetes management
    "I10":    (500,  120),    # Essential hypertension
    "K21.0":  (280,   70),    # GERD with oesophagitis
    "Z00.00": (200,   50),    # Routine general exam
    "S72.001":(8_500, 900),   # Femur fracture — legitimately expensive
    "C34.10": (12_000,2_000), # Lung cancer — legitimately expensive
    "F32.1":  (400,  100),    # Major depressive disorder
    "N39.0":  (180,   45),    # UTI
}
DIAG_CODES = list(DIAG_DISTRIBUTIONS.keys())

# ── Procedure codes (CPT-style) ────────────────────────────────────────────────
PROC_CODES = [
    "99213",  # Office visit, established patient, low complexity
    "99214",  # Office visit, established patient, moderate complexity
    "99232",  # Subsequent hospital care
    "27447",  # Total knee arthroplasty
    "43239",  # Upper GI endoscopy with biopsy
    "71046",  # Chest X-ray, 2 views
    "93000",  # ECG with interpretation
    "96413",  # Chemotherapy administration
    "90837",  # Psychotherapy, 60 min
    "81003",  # Urinalysis, automated
]


# ══════════════════════════════════════════════════════════════════════════════
# Helper: draw a claim amount for a given diagnosis
# ══════════════════════════════════════════════════════════════════════════════
def sample_legit_amount(diag_code: str) -> float:
    """Return a realistic (non-fraud) claim amount for this diagnosis."""
    mean, std = DIAG_DISTRIBUTIONS[diag_code]
    # Use a log-normal draw so amounts are always positive and right-skewed
    # (claim amounts in the real world follow this distribution).
    mu    = np.log(mean)
    sigma = std / mean          # approximate log-normal σ from normal σ
    amount = rng.lognormal(mu, sigma)
    return round(float(np.clip(amount, mean * 0.3, mean * 3.0)), 2)


def sample_fraud_amount(diag_code: str) -> float:
    """
    Return an anomalously HIGH claim amount for this diagnosis.
    Fraud pattern: bill 3–8× the typical mean for the code.
    This creates a strong, learnable signal for the Random Forest.
    """
    mean, std = DIAG_DISTRIBUTIONS[diag_code]
    multiplier = rng.uniform(3.0, 8.0)
    amount = mean * multiplier + rng.normal(0, std * 0.5)
    return round(float(max(amount, mean * 2.5)), 2)


# ══════════════════════════════════════════════════════════════════════════════
# Build LEGITIMATE claims
# ══════════════════════════════════════════════════════════════════════════════
legit_diag  = rng.choice(DIAG_CODES,  size=N_LEGIT)
legit_proc  = rng.choice(PROC_CODES,  size=N_LEGIT)
legit_prov  = rng.choice(PROVIDERS,   size=N_LEGIT)
legit_amounts = np.array([sample_legit_amount(d) for d in legit_diag])

df_legit = pd.DataFrame({
    "Provider_ID":        legit_prov,
    "Diagnosis_Code":     legit_diag,
    "Procedure_Code":     legit_proc,
    "Total_Claim_Amount": legit_amounts,
    "Is_Fraud":           0,
})

# ══════════════════════════════════════════════════════════════════════════════
# Build FRAUD claims
# ══════════════════════════════════════════════════════════════════════════════
# Fraud providers appear more often in the fraud set (but not exclusively —
# some fraudulent claims come from otherwise clean providers to avoid naive
# "just block the provider" detection).
fraud_prov_weights = np.where(
    np.isin(PROVIDERS, FRAUD_PROVIDERS), 10.0, 1.0   # bad actors 10× more likely
)
fraud_prov_weights = fraud_prov_weights / fraud_prov_weights.sum()

fraud_diag   = rng.choice(DIAG_CODES, size=N_FRAUD)
fraud_proc   = rng.choice(PROC_CODES, size=N_FRAUD)
fraud_prov   = rng.choice(PROVIDERS,  size=N_FRAUD, p=fraud_prov_weights)
fraud_amounts = np.array([sample_fraud_amount(d) for d in fraud_diag])

df_fraud = pd.DataFrame({
    "Provider_ID":        fraud_prov,
    "Diagnosis_Code":     fraud_diag,
    "Procedure_Code":     fraud_proc,
    "Total_Claim_Amount": fraud_amounts,
    "Is_Fraud":           1,
})

# ══════════════════════════════════════════════════════════════════════════════
# Combine, shuffle, save
# ══════════════════════════════════════════════════════════════════════════════
df = (
    pd.concat([df_legit, df_fraud], ignore_index=True)
    .sample(frac=1, random_state=SEED)   # shuffle rows
    .reset_index(drop=True)
)

# Sanity checks
assert len(df) == N_CLAIMS, "Row count mismatch"
fraud_pct = df["Is_Fraud"].mean() * 100
print(f"✅  Dataset shape   : {df.shape}")
print(f"✅  Fraud rate      : {fraud_pct:.1f}%")
print(f"✅  Avg legit $     : ${df.loc[df.Is_Fraud==0,'Total_Claim_Amount'].mean():,.2f}")
print(f"✅  Avg fraud $     : ${df.loc[df.Is_Fraud==1,'Total_Claim_Amount'].mean():,.2f}")
print(df.head())

df.to_csv("synthetic_claims.csv", index=False)
print("\n💾  Saved → synthetic_claims.csv")

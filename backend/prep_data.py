"""
prep_data.py — PM-JAY Synthetic Claims Data Generator
=====================================================
Generates 5,000 rows of Ayushman Bharat PM-JAY synthetic claims.
93% Legitimate / 7% Fraud. All amounts in Indian Rupees (₹).
"""

import numpy as np
import pandas as pd

# ── Reproducibility ────────────────────────────────────────────────────────────
SEED = 42
rng = np.random.default_rng(SEED)

# ── Dataset size & fraud rate ──────────────────────────────────────────────────
N_CLAIMS = 5_000
FRAUD_RATE = 0.07  # 7% fraud → 350 fraud rows
N_FRAUD = int(N_CLAIMS * FRAUD_RATE)
N_LEGIT = N_CLAIMS - N_FRAUD

# ── PM-JAY Package Codes and Rupee ranges ──────────────────────────────────────
# Format: (min_inr, max_inr) for legitimate claims
PMJAY_PACKAGES = {
    "BM001A": (1_500, 3_000),    # Gen Med
    "BM002B": (2_000, 4_000),    # Gen Med extended
    "MC012A": (10_000, 15_000),  # Delivery (normal)
    "MC013B": (15_000, 22_000),  # Caesarean
    "SG001B": (20_000, 25_000),  # Appendectomy
    "SG002C": (25_000, 35_000),  # Cholecystectomy
    "CV045C": (120_000, 150_000),  # CABG
    "CV046D": (80_000, 100_000),  # Valve repair
    "OR001A": (8_000, 12_000),   # Ortho minor
    "OR002B": (35_000, 45_000),  # Hip/Knee replacement
}
PACKAGE_CODES = list(PMJAY_PACKAGES.keys())

# Diagnosis codes (ICD-10) mapped to typical packages
DIAG_TO_PACKAGE = {
    "J06.9": ["BM001A"],           # Acute URI
    "M54.5": ["BM001A", "BM002B"], # Low back pain
    "E11.9": ["BM001A", "BM002B"], # Type 2 diabetes
    "I10": ["BM001A"],             # Hypertension
    "K21.0": ["BM001A"],           # GERD
    "Z00.00": ["BM001A"],          # Routine exam
    "O80": ["MC012A"],             # Normal delivery
    "O82": ["MC013B"],             # Caesarean
    "K35.80": ["SG001B"],          # Appendicitis
    "K80.20": ["SG002C"],          # Gallstones
    "I25.10": ["CV045C"],          # CAD
    "I35.0": ["CV046D"],          # Aortic stenosis
    "S72.001": ["OR001A", "OR002B"],  # Femur fracture
    "M17.11": ["OR002B"],         # Knee OA
    "N39.0": ["BM001A"],          # UTI
}
DIAG_CODES = list(DIAG_TO_PACKAGE.keys())

# Procedure codes
PROC_CODES = ["99213", "99214", "99232", "27447", "43239", "71046", "93000", "96413", "90837", "81003"]

# Provider pool
PROVIDERS = [f"PRV-{str(i).zfill(4)}" for i in range(1, 51)]
FRAUD_PROVIDERS = ["PRV-0007", "PRV-0013", "PRV-0031"]


def generate_abha_id() -> str:
    """Generate a fake 14-digit ABHA ID in format 91-XXXX-XXXX-XXXX."""
    part1 = rng.integers(1000, 9999)
    part2 = rng.integers(1000, 9999)
    part3 = rng.integers(1000, 9999)
    return f"91-{part1}-{part2}-{part3}"


def sample_legit_claim() -> dict:
    """Generate one legitimate claim with amount within package range."""
    diag = rng.choice(DIAG_CODES)
    package = rng.choice(DIAG_TO_PACKAGE[diag])
    min_r, max_r = PMJAY_PACKAGES[package]
    amount = round(float(rng.uniform(min_r, max_r)), 2)
    return {
        "Provider_ID": rng.choice(PROVIDERS),
        "ABHA_ID": generate_abha_id(),
        "PMJAY_Package_Code": package,
        "Diagnosis_Code": diag,
        "Procedure_Code": rng.choice(PROC_CODES),
        "Total_Claim_Amount": amount,
        "Is_Fraud": 0,
    }


def sample_wallet_depletion_fraud() -> dict:
    """Fraud pattern 1: Wallet Depletion — spike amounts ₹4,50,000–₹4,99,000."""
    amount = round(float(rng.uniform(450_000, 499_000)), 2)
    diag = rng.choice(DIAG_CODES)
    package = rng.choice(DIAG_TO_PACKAGE[diag])
    return {
        "Provider_ID": rng.choice(PROVIDERS, p=_fraud_provider_weights()),
        "ABHA_ID": generate_abha_id(),
        "PMJAY_Package_Code": package,
        "Diagnosis_Code": diag,
        "Procedure_Code": rng.choice(PROC_CODES),
        "Total_Claim_Amount": amount,
        "Is_Fraud": 1,
    }


def sample_upcoding_fraud() -> dict:
    """Fraud pattern 2: Upcoding — cheap BM001A but bill > ₹50,000."""
    amount = round(float(rng.uniform(50_001, 120_000)), 2)
    return {
        "Provider_ID": rng.choice(PROVIDERS, p=_fraud_provider_weights()),
        "ABHA_ID": generate_abha_id(),
        "PMJAY_Package_Code": "BM001A",
        "Diagnosis_Code": rng.choice(["J06.9", "M54.5", "Z00.00", "N39.0"]),
        "Procedure_Code": rng.choice(PROC_CODES),
        "Total_Claim_Amount": amount,
        "Is_Fraud": 1,
    }


def _fraud_provider_weights() -> np.ndarray:
    """Bad actors more likely in fraud set."""
    w = np.array([10.0 if p in FRAUD_PROVIDERS else 1.0 for p in PROVIDERS])
    return w / w.sum()


# ── Build LEGITIMATE claims ────────────────────────────────────────────────────
legit_rows = [sample_legit_claim() for _ in range(N_LEGIT)]
df_legit = pd.DataFrame(legit_rows)

# ── Build FRAUD claims (50% Wallet Depletion, 50% Upcoding) ────────────────────
n_wallet = N_FRAUD // 2
n_upcode = N_FRAUD - n_wallet
fraud_rows = (
    [sample_wallet_depletion_fraud() for _ in range(n_wallet)] +
    [sample_upcoding_fraud() for _ in range(n_upcode)]
)
df_fraud = pd.DataFrame(fraud_rows)

# ── Combine, shuffle, save ─────────────────────────────────────────────────────
df = (
    pd.concat([df_legit, df_fraud], ignore_index=True)
    .sample(frac=1, random_state=SEED)
    .reset_index(drop=True)
)

assert len(df) == N_CLAIMS, "Row count mismatch"
fraud_pct = df["Is_Fraud"].mean() * 100
print(f"✅  Dataset shape     : {df.shape}")
print(f"✅  Fraud rate        : {fraud_pct:.1f}%")
print(f"✅  Avg legit ₹       : ₹{df.loc[df.Is_Fraud == 0, 'Total_Claim_Amount'].mean():,.2f}")
print(f"✅  Avg fraud ₹       : ₹{df.loc[df.Is_Fraud == 1, 'Total_Claim_Amount'].mean():,.2f}")
print(df.head())

df.to_csv("synthetic_claims.csv", index=False)
print("\n💾  Saved → synthetic_claims.csv")

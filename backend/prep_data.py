import numpy as np
import pandas as pd

# ── Reproducibility ────────────────────────────────────────────────────────────
SEED = 42
rng  = np.random.default_rng(SEED)

# ── Dataset size & fraud rate ──────────────────────────────────────────────────
N_CLAIMS    = 5_000
FRAUD_RATE  = 0.05      # 5 % → ~250 fraud rows
N_FRAUD     = int(N_CLAIMS * FRAUD_RATE)
N_LEGIT     = N_CLAIMS - N_FRAUD

# ── Realistic provider pool ────────────────────────────────────────────────────
PROVIDERS = [f"PRV-{str(i).zfill(4)}" for i in range(1, 51)]
FRAUD_PROVIDERS = ["PRV-0007", "PRV-0013", "PRV-0031"]

# ── Diagnosis codes and NORMAL claim-amount distributions (in INR) ─────────────
# Values adjusted for Indian Healthcare context (Private Sector Estimates)
DIAG_DISTRIBUTIONS = {
    "J06.9":  (1200,   300),    # Upper respiratory infection (Consultation + Meds)
    "M54.5":  (2500,   600),    # Low back pain (Physio/Consult)
    "E11.9":  (4500,  1200),    # Type 2 diabetes management (Labs + Consultation)
    "I10":    (3500,   800),    # Essential hypertension
    "K21.0":  (2200,   500),    # GERD
    "Z00.00": (800,    200),    # Routine general exam
    "S72.001":(180000, 30000),  # Femur fracture (Surgery + Stay)
    "C34.10": (250000, 50000),  # Lung cancer (Chemo/Surgical intervention)
    "F32.1":  (3000,   700),    # Major depressive disorder (Therapy session)
    "N39.0":  (1500,   400),    # UTI
}
DIAG_CODES = list(DIAG_DISTRIBUTIONS.keys())

# ── Procedure codes (CPT-style) ────────────────────────────────────────────────
PROC_CODES = ["99213", "99214", "99232", "27447", "43239", "71046", "93000", "96413", "90837", "81003"]

# ══════════════════════════════════════════════════════════════════════════════
# Helpers
# ══════════════════════════════════════════════════════════════════════════════
def sample_legit_amount(diag_code: str) -> float:
    mean, std = DIAG_DISTRIBUTIONS[diag_code]
    mu    = np.log(mean)
    sigma = std / mean
    amount = rng.lognormal(mu, sigma)
    # Return as rounded integer for Rupee simplicity, or 2 decimal places
    return round(float(np.clip(amount, mean * 0.4, mean * 2.5)), 0)

def sample_fraud_amount(diag_code: str) -> float:
    mean, std = DIAG_DISTRIBUTIONS[diag_code]
    multiplier = rng.uniform(3.5, 10.0) # Fraud in INR often involves massive upscaling
    amount = mean * multiplier + rng.normal(0, std * 0.5)
    return round(float(max(amount, mean * 3.0)), 0)

# ══════════════════════════════════════════════════════════════════════════════
# Build Dataframes
# ══════════════════════════════════════════════════════════════════════════════
# Legit
legit_diag = rng.choice(DIAG_CODES, size=N_LEGIT)
legit_amounts = np.array([sample_legit_amount(d) for d in legit_diag])

df_legit = pd.DataFrame({
    "Provider_ID": rng.choice(PROVIDERS, size=N_LEGIT),
    "Diagnosis_Code": legit_diag,
    "Procedure_Code": rng.choice(PROC_CODES, size=N_LEGIT),
    "Total_Claim_Amount": legit_amounts,
    "Is_Fraud": 0,
})

# Fraud
fraud_prov_weights = np.where(np.isin(PROVIDERS, FRAUD_PROVIDERS), 10.0, 1.0)
fraud_prov_weights /= fraud_prov_weights.sum()

fraud_diag = rng.choice(DIAG_CODES, size=N_FRAUD)
fraud_amounts = np.array([sample_fraud_amount(d) for d in fraud_diag])

df_fraud = pd.DataFrame({
    "Provider_ID": rng.choice(PROVIDERS, size=N_FRAUD, p=fraud_prov_weights),
    "Diagnosis_Code": fraud_diag,
    "Procedure_Code": rng.choice(PROC_CODES, size=N_FRAUD),
    "Total_Claim_Amount": fraud_amounts,
    "Is_Fraud": 1,
})

# ── Combine & Save ─────────────────────────────────────────────────────────────
df = pd.concat([df_legit, df_fraud], ignore_index=True).sample(frac=1, random_state=SEED).reset_index(drop=True)

# Formatting the output for Rupee
print(f"✅  Dataset shape   : {df.shape}")
print(f"✅  Fraud rate      : {df['Is_Fraud'].mean()*100:.1f}%")
print(f"✅  Avg legit amt   : ₹{df.loc[df.Is_Fraud==0,'Total_Claim_Amount'].mean():,.2f}")
print(f"✅  Avg fraud amt   : ₹{df.loc[df.Is_Fraud==1,'Total_Claim_Amount'].mean():,.2f}")
print("\n--- Preview ---")
print(df.head())

df.to_csv("synthetic_healthcare_india.csv", index=False)
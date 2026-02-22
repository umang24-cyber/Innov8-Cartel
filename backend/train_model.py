"""
train_model.py — ML Training Pipeline (PM-JAY Fraud Detection)
"""

import joblib
import numpy as np
import pandas as pd

from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report,
    roc_auc_score,
    confusion_matrix,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder

# ── Config ──────────────────────────────────────────────────────────────
CSV_PATH = "synthetic_claims.csv"
MODEL_PATH = "fraud_model.joblib"
SEED = 42

# ── Features (ABHA_ID excluded to prevent overfitting) ───────────────────
CATEGORICAL_FEATURES = ["Provider_ID", "PMJAY_Package_Code", "Diagnosis_Code", "Procedure_Code"]
NUMERIC_FEATURES = ["Total_Claim_Amount"]
ALL_FEATURES = CATEGORICAL_FEATURES + NUMERIC_FEATURES

# ════════════════════════════════════════════════════════════════════════
# 1. Load data
# ════════════════════════════════════════════════════════════════════════
print("📂 Loading data …")
df = pd.read_csv(CSV_PATH)
print(f"Shape: {df.shape} | Fraud rate: {df['Is_Fraud'].mean()*100:.1f}%")

X = df[ALL_FEATURES]  # ABHA_ID dropped
y = df["Is_Fraud"]

# ════════════════════════════════════════════════════════════════════════
# 2. Train/Test Split (Stratified, 93% train / 7% test)
# ════════════════════════════════════════════════════════════════════════
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.07,
    random_state=SEED,
    stratify=y,
)

print(f"Train: {len(X_train)} | Test: {len(X_test)}")

# ════════════════════════════════════════════════════════════════════════
# 3. Preprocessing
# ════════════════════════════════════════════════════════════════════════
categorical_transformer = OneHotEncoder(
    handle_unknown="ignore",
    sparse_output=False,
)

preprocessor = ColumnTransformer(
    transformers=[
        ("cat", categorical_transformer, CATEGORICAL_FEATURES),
        ("num", "passthrough", NUMERIC_FEATURES),
    ],
)

# ════════════════════════════════════════════════════════════════════════
# 4. Pipeline (SMOTE + RandomForest)
# ════════════════════════════════════════════════════════════════════════
pipeline = ImbPipeline(steps=[
    ("preprocessor", preprocessor),
    ("smote", SMOTE(
        sampling_strategy="auto",
        random_state=SEED,
        k_neighbors=5,
    )),
    ("classifier", RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        min_samples_leaf=2,
        random_state=SEED,
        n_jobs=-1,
    )),
])

# ════════════════════════════════════════════════════════════════════════
# 5. Train
# ════════════════════════════════════════════════════════════════════════
print("\n🏋️ Training model...")
pipeline.fit(X_train, y_train)
print("Training complete.")

# ════════════════════════════════════════════════════════════════════════
# 6. Evaluation
# ════════════════════════════════════════════════════════════════════════
y_pred = pipeline.predict(X_test)
y_prob = pipeline.predict_proba(X_test)[:, 1]

print("\n📊 Classification Report:")
print(classification_report(y_test, y_pred, target_names=["Legit", "Fraud"]))

roc = roc_auc_score(y_test, y_prob)
print(f"\nROC-AUC: {roc:.4f}")

tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
print("\nConfusion Matrix:")
print(f"TN: {tn}  FP: {fp}")
print(f"FN: {fn}  TP: {tp}")

fpr = fp / (fp + tn)
print(f"\nFalse Positive Rate: {fpr:.4f}")

# ════════════════════════════════════════════════════════════════════════
# 7. Threshold Testing
# ════════════════════════════════════════════════════════════════════════
print("\n🎯 Threshold Testing:")
for t in [0.5, 0.6, 0.7, 0.8]:
    preds = (y_prob >= t).astype(int)
    tn_t, fp_t, fn_t, tp_t = confusion_matrix(y_test, preds).ravel()
    fpr_t = fp_t / (fp_t + tn_t)
    print(f"\nThreshold = {t}")
    print(classification_report(y_test, preds, target_names=["Legit", "Fraud"]))
    print(f"FPR: {fpr_t:.4f}")

# ════════════════════════════════════════════════════════════════════════
# 8. Feature Importances
# ════════════════════════════════════════════════════════════════════════
rf = pipeline.named_steps["classifier"]
ohe = pipeline.named_steps["preprocessor"].named_transformers_["cat"]
ohe_names = ohe.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
feature_names = ohe_names + NUMERIC_FEATURES
importances = pd.Series(rf.feature_importances_, index=feature_names)
print("\n🔍 Top 10 Important Features:")
print(importances.sort_values(ascending=False).head(10))

# ════════════════════════════════════════════════════════════════════════
# 9. Save Model
# ════════════════════════════════════════════════════════════════════════
joblib.dump(pipeline, MODEL_PATH)
print(f"\n💾 Model saved to {MODEL_PATH}")

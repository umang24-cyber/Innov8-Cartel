# FinGuard AI — Claims Intelligence & Fraud Detection

> AI-assisted claims intelligence system using ML + SHAP explainability + Groq LLM.
> **Advisory tool only — no automated decisions.**

---

## Project Structure

```
claims-fraud/
├── prep_data.py        # Generates synthetic_claims.csv (5,000 claims, ~5% fraud)
├── train_model.py      # Trains RandomForest + SMOTE → saves fraud_model.joblib
├── main.py             # FastAPI backend (ML + SHAP + Groq LLM)
├── dashboard.html      # Single-file React frontend (no npm needed)
├── requirements.txt    # Python dependencies
├── .env                # Your API keys (never commit this)
└── .gitignore
```

---

## Setup & Run (Step by Step)

### 1. Get a Groq API Key (Free)
1. Go to https://console.groq.com
2. Sign up → Create API Key → copy it

### 2. Init Git Repo

```powershell
git init claims-fraud
cd claims-fraud
# copy all project files here, then:
git add prep_data.py train_model.py main.py dashboard.html requirements.txt .gitignore README.md
git commit -m "feat: initial Claims Intelligence system"

# push to GitHub (create empty repo on github.com first)
git remote add origin https://github.com/YOUR_USERNAME/claims-fraud.git
git push -u origin main
```

### 3. Create Virtual Environment

```powershell
python -m venv venv
.\venv\Scripts\activate        # Windows PowerShell
# source venv/bin/activate     # Mac / Linux
```

### 4. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 5. Create .env File

Create a file called `.env` in the project root:
```
GROQ_API_KEY=your_actual_groq_key_here
```

### 6. Generate Synthetic Dataset

```powershell
python prep_data.py
```

Expected output:
```
✅  Dataset shape   : (5000, 5)
✅  Fraud rate      : 5.0%
✅  Avg legit $     : $1,180.42
✅  Avg fraud $     : $6,340.17
💾  Saved → synthetic_claims.csv
```

### 7. Train the Model

```powershell
python train_model.py
```

Expected output:
```
🏋️  Training pipeline (SMOTE + RandomForest) …
    ROC-AUC: 0.9987
💾  Model saved → fraud_model.joblib
```

### 8. Start the Backend API

```powershell
uvicorn main:app --reload --port 8000
```

You should see:
```
✅  Pipeline loaded from 'fraud_model.joblib'
✅  SHAP TreeExplainer ready
✅  Groq client ready (llama-3.3-70b-versatile)
INFO: Application startup complete.
```

### 9. Open the Frontend

Double-click `dashboard.html` — open it in Chrome/Edge/Firefox.
The table auto-populates with 6 pre-analyzed sample claims in ~10 seconds.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analyze_claim` | Full 3-layer analysis (ML + SHAP + Groq) |
| POST | `/chat` | AI Investigator chatbot |
| GET | `/sample_claims` | 6 pre-analyzed sample claims for the table |
| GET | `/health` | API connectivity check |
| GET | `/docs` | Interactive Swagger UI |

### Test with curl (PowerShell)

```powershell
curl -X POST http://localhost:8000/analyze_claim `
     -H "Content-Type: application/json" `
     -d '{"Provider_ID":"PRV-0007","Diagnosis_Code":"J06.9","Procedure_Code":"99214","Total_Claim_Amount":9500,"Unstructured_Notes":"Patient had mild sore throat. Prescribed lozenges."}'
```

---

## Frontend Component Guide

`dashboard.html` is a **single self-contained file** — no npm, no build step.
Uses React 18 + Recharts from CDN.

### Component Map

| Component | Purpose |
|-----------|---------|
| `<App />` | Root — fetches sample claims, manages selected row state |
| `<RiskBadge />` | Colour-coded pill: CRITICAL/HIGH/MEDIUM/LOW |
| `<ShapChart />` | Horizontal bar chart — red = fraud signal, green = legit signal |
| `<DetailPanel />` | Slides open on row click — shows SHAP, notes, Groq audit |
| `<AnalyzeForm />` | POSTs a new claim to the API, adds result to table |
| `<Chatbot />` | Floating chat powered by /chat endpoint (Groq Llama 3.3) |

### How the Detail Panel Works
1. User clicks a table row
2. `setSelected(claim)` triggers `<DetailPanel>` to render
3. Panel shows: risk score hero → structured data → SHAP chart → doctor notes → Groq LLM opinion → action buttons

### How the Chatbot Works
1. User opens floating chat (bottom-right button)
2. Types a question (e.g. "Why was this claim flagged?")
3. Frontend POSTs to `/chat` with the message + the currently selected claim as JSON context
4. Groq Llama 3.3 responds with a 3-sentence explanation
5. "Add to Case Report" button appears after each AI response

---

## Architecture

```
dashboard.html  →  POST /analyze_claim  →  main.py
                                               │
                                  ┌────────────┼────────────┐
                                  ▼            ▼            ▼
                             RandomForest    SHAP        Groq LLM
                             risk_score   shap_features  llm_text_analysis
                             (0-100)      (bar chart)    (audit opinion)
```

---

## Git Workflow for Hackathon

```powershell
# After each working milestone:
git add -A
git commit -m "feat: description of what you added"
git push

# Useful commands:
git status          # see what changed
git log --oneline   # see commit history
git diff            # see exact line changes
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError` | Run `.\venv\Scripts\activate` first |
| `fraud_model.joblib not found` | Run `python train_model.py` first |
| API offline in dashboard | Start `uvicorn main:app --reload --port 8000` |
| Table is empty for 10-15s | Normal — `/sample_claims` runs 6 full ML+LLM calls on startup |
| Groq 401 Unauthorized | Check GROQ_API_KEY in your .env file |
| SHAP unavailable error | `pip install shap>=0.45.0` |
| CORS error in browser | Confirm uvicorn is running; CORS middleware is already in main.py |

---

## Problem Statement Alignment

| Requirement | Implementation |
|-------------|----------------|
| Structured billing data analysis | RandomForest on Provider / Diagnosis / Procedure / Amount |
| Unstructured clinical notes | Groq Llama 3.3 70B acts as medical auditor |
| Anomaly / fraud detection | SMOTE-balanced RF trained on 5% fraud rate dataset |
| Explainable reasoning | SHAP values + plain-English narrative + bar chart |
| Advisory tool only | Every response has advisory disclaimer; no auto-reject |
| Synthetic / public dataset | prep_data.py generates 5,000 rows with logical fraud signal |

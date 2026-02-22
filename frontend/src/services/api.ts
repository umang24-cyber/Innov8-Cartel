import type { Claim, Case, Typology, DashboardStats, FraudTrend, RiskDistribution } from '../types';

const API_BASE = 'http://localhost:8000';

export const api = {
    // 1. Fetch initial demo claims
    getDemoClaims: async (search?: string, provider?: string): Promise<Claim[]> => {
        try {
            const url = new URL(`${API_BASE}/demo_claims`);
            if (search) url.searchParams.append('search', search);
            if (provider) url.searchParams.append('provider_filter', provider);

            const res = await fetch(url.toString());
            if (!res.ok) throw new Error('Failed to fetch claims');
            return await res.json();
        } catch (error) {
            console.error('API Error:', error);
            return []; // Return empty array on failure so UI doesn't crash
        }
    },

    // Get all claims
    getClaims: async (): Promise<Claim[]> => {
        try {
            const res = await fetch(`${API_BASE}/claims`);
            if (!res.ok) throw new Error('Failed to fetch claims');
            return await res.json();
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    // Get single claim
    getClaim: async (id: string): Promise<Claim | null> => {
        try {
            const res = await fetch(`${API_BASE}/claims/${id}`);
            if (!res.ok) throw new Error('Failed to fetch claim');
            return await res.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    // 2. Analyze a single claim (ML + SHAP + Groq)
    analyzeClaim: async (claim: Claim) => {
        try {
            const res = await fetch(`${API_BASE}/analyze_claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Provider_ID: claim.Provider_ID,
                    ABHA_ID: claim.ABHA_ID ?? "91-0000-0000-0000",
                    PMJAY_Package_Code: claim.PMJAY_Package_Code ?? "BM001A",
                    Diagnosis_Code: claim.Diagnosis_Code,
                    Procedure_Code: claim.Procedure_Code,
                    Total_Claim_Amount: claim.Total_Claim_Amount,
                    Unstructured_Notes: claim.Unstructured_Notes,
                }),
            });
            if (!res.ok) throw new Error('Failed to analyze claim');
            return await res.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Save a new dynamic claim to the backend
    saveClaim: async (claimData: any) => {
        try {
            const res = await fetch(`${API_BASE}/claims`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(claimData),
            });
            if (!res.ok) throw new Error('Failed to save claim');
            return await res.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // 3. Chat with Groq Agentic LLM
    chat: async (message: string, claimContext: Claim | null) => {
        try {
            // Map frontend claim object back to backend dict expectation if present
            const context = claimContext ? {
                Provider_ID: claimContext.Provider_ID,
                ABHA_ID: claimContext.ABHA_ID,
                PMJAY_Package_Code: claimContext.PMJAY_Package_Code,
                Diagnosis_Code: claimContext.Diagnosis_Code,
                Procedure_Code: claimContext.Procedure_Code,
                Total_Claim_Amount: claimContext.Total_Claim_Amount,
                Unstructured_Notes: claimContext.Unstructured_Notes,
                risk_score: claimContext.riskScore,
                shap_explanation: claimContext.shapValues?.[0]?.display || "N/A"
            } : null;

            const res = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    claim_context: context,
                }),
            });
            if (!res.ok) throw new Error('Failed to send message');
            return await res.json();
        } catch (error) {
            console.error('API Error:', error);
            return { reply: "Connection to AI Investigator lost. Ensure backend is running." };
        }
    },

    // 4. Get Dashboard Stats
    getStats: async (): Promise<DashboardStats | null> => {
        try {
            const res = await fetch(`${API_BASE}/dashboard_stats`);
            if (!res.ok) throw new Error('Failed to fetch stats');
            const data = await res.json();
            // Map backend snake_case to frontend camelCase
            return {
                totalClaims: data.total_claims ?? 0,
                totalClaimsTrend: data.total_claims_trend ?? 0,
                highRiskAlerts: data.high_risk_alerts ?? 0,
                highRiskTrend: data.high_risk_trend ?? 0,
                falsePositiveRate: data.false_positive_rate ?? 0,
                falsePositiveTrend: data.false_positive_trend ?? 0,
                pendingInvestigations: data.pending_investigations ?? 0,
                pendingTrend: data.pending_trend ?? 0,
                monthlyFraudGrowth: data.monthly_fraud_growth ?? 0,
            } as DashboardStats;
        } catch (error) {
            console.error("API Error:", error);
            return null;
        }
    },

    // 5. Get Fraud Trends
    getFraudTrends: async (): Promise<FraudTrend[]> => {
        try {
            const res = await fetch(`${API_BASE}/fraud_trends`);
            if (!res.ok) throw new Error('Failed to fetch trends');
            return await res.json();
        } catch (error) {
            console.error("API Error:", error);
            return [];
        }
    },

    // 6. Get Risk Distribution
    getRiskDistribution: async (): Promise<RiskDistribution[]> => {
        try {
            const res = await fetch(`${API_BASE}/risk_distribution`);
            if (!res.ok) throw new Error('Failed to fetch distribution');
            return await res.json();
        } catch (error) {
            console.error("API Error:", error);
            return [];
        }
    },

    // 7. Cases
    getCases: async (): Promise<Case[]> => {
        try {
            const res = await fetch(`${API_BASE}/cases`);
            if (!res.ok) throw new Error('Failed to fetch cases');
            return await res.json();
        } catch (error) {
            console.error("API Error:", error);
            return [];
        }
    },

    getCase: async (id: string): Promise<Case | null> => {
        try {
            const res = await fetch(`${API_BASE}/cases/${id}`);
            if (!res.ok) throw new Error('Failed to fetch case');
            return await res.json();
        } catch (error) {
            console.error("API Error:", error);
            return null;
        }
    },

    updateCase: async (id: string, updates: Partial<Case>): Promise<Case> => {
        try {
            const res = await fetch(`${API_BASE}/cases/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!res.ok) throw new Error('Failed to update case');
            return await res.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    addCaseNote: async (id: string, content: string): Promise<void> => {
        try {
            const res = await fetch(`${API_BASE}/cases/${id}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });
            if (!res.ok) throw new Error('Failed to add note');
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    // 8. Typologies
    getTypologies: async (): Promise<Typology[]> => {
        try {
            const res = await fetch(`${API_BASE}/typologies`);
            if (!res.ok) throw new Error('Failed to fetch typologies');
            return await res.json();
        } catch (error) {
            console.error("API Error:", error);
            return [];
        }
    },

    createTypology: async (data: Partial<Typology>): Promise<Typology> => {
        try {
            const res = await fetch(`${API_BASE}/typologies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create typology');
            return await res.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    updateTypology: async (id: string, data: Partial<Typology>): Promise<Typology> => {
        try {
            const res = await fetch(`${API_BASE}/typologies/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update typology');
            return await res.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    deleteTypology: async (id: string): Promise<void> => {
        try {
            const res = await fetch(`${API_BASE}/typologies/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete typology');
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    // 9. AI Explain
    explainRisk: async (claimId: string, question?: string): Promise<string> => {
        try {
            const res = await fetch(`${API_BASE}/ai/explain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ claim_id: claimId, question }),
            });
            if (!res.ok) throw new Error('Failed to get explanation');
            const data = await res.json();
            return data.explanation || '';
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    // 10. Settings (NAFU admin)
    getSettings: async () => {
        try {
            const res = await fetch(`${API_BASE}/api/settings`);
            if (!res.ok) return null;
            return await res.json();
        } catch (error) {
            console.error("API Error:", error);
            return null;
        }
    },
    saveSettings: async (payload: Record<string, unknown>) => {
        try {
            const res = await fetch(`${API_BASE}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Failed to save settings');
            return await res.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },
};

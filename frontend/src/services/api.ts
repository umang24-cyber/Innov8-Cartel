import type { Claim } from '../types';

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

    // 2. Analyze a single claim (ML + SHAP + Groq)
    analyzeClaim: async (claim: Claim) => {
        try {
            const res = await fetch(`${API_BASE}/analyze_claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Provider_ID: claim.Provider_ID,
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

    // 3. Chat with Groq Agentic LLM
    chat: async (message: string, claimContext: Claim | null) => {
        try {
            // Map frontend claim object back to backend dict expectation if present
            const context = claimContext ? {
                Provider_ID: claimContext.Provider_ID,
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
    getStats: async () => {
        try {
            const res = await fetch(`${API_BASE}/dashboard_stats`);
            if (!res.ok) throw new Error('Failed to fetch stats');
            return await res.json();
        } catch (error) {
            console.error("API Error:", error);
            return null;
        }
    }
};

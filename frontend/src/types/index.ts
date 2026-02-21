export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Claim {
  claim_id: string; // From backend
  Provider_ID: string;
  Diagnosis_Code: string;
  Procedure_Code: string;
  Total_Claim_Amount: number;
  Unstructured_Notes: string;

  // Enriched fields from ML Backend
  riskScore?: number;
  riskLevel?: RiskLevel;
  shapValues?: { feature: string; impact: number; display: string }[];
  llmAnalysis?: string;
  diagnosisStats?: {
    expected_mean: number;
    expected_std: number;
    z_score: number;
  };
  status?: 'Pending' | 'Investigating' | 'Cleared' | 'Rejected';
}

export interface Metric {
  label: string;
  value: string;
  trend: string;
  trendDirection: 'up' | 'down';
  isGood: boolean;
  icon?: React.ReactNode;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export type ViewState = 'overview' | 'queue' | 'case_manager' | 'typology' | 'settings';

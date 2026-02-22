export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Claim {
  claim_id: string;
  Provider_ID: string;
  ABHA_ID?: string;
  PMJAY_Package_Code?: string;
  Diagnosis_Code: string;
  Procedure_Code: string;
  Total_Claim_Amount: number;
  Unstructured_Notes: string;
  createdAt?: string;

  // Enriched fields from ML Backend
  riskScore?: number;
  riskLevel?: RiskLevel;
  shapValues?: { feature: string; value: number; display: string }[];
  llmAnalysis?: string;
  diagnosisStats?: {
    expected_mean: number;
    expected_std: number;
    z_score: number;
  };
  status?: 'Pending' | 'Investigating' | 'Investigated' | 'Done' | 'Cleared' | 'Rejected';

  // New features: Anomaly Detection & Benford's Law
  anomalyScore?: number;
  benfordScore?: number;
  benfordAnalysis?: string;
}

export interface Case {
  id: string;
  claim_id: string;
  claim?: Claim;
  status: 'Open' | 'Investigating' | 'Escalated' | 'Closed';
  assignedTo?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  notes: CaseNote[];
  timeline: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface CaseNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  type: 'status_change' | 'assignment' | 'note' | 'evidence';
  actor: string;
  description: string;
  timestamp: string;
}

export interface Typology {
  id: string;
  name: string;
  description: string;
  riskWeight: number;
  frequency: number;
  lastTriggered?: string;
  isActive: boolean;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  rules: string[];
  createdAt: string;
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
  isLoading?: boolean;
}

export interface DashboardStats {
  totalClaims: number;
  totalClaimsTrend: number;
  highRiskAlerts: number;
  highRiskTrend: number;
  falsePositiveRate: number;
  falsePositiveTrend: number;
  pendingInvestigations: number;
  pendingTrend: number;
  monthlyFraudGrowth: number;
}

export interface FraudTrend {
  date: string;
  fraudCount: number;
  totalClaims: number;
}

export interface RiskDistribution {
  level: RiskLevel;
  count: number;
  percentage: number;
}

export type ViewState = 'overview' | 'queue' | 'case_manager' | 'typology' | 'settings' | 'new_claim' | 'ayushman_portal';

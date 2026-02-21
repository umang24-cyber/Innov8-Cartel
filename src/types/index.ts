export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Claim {
  id: string;
  provider: string;
  diagnosisCode: string;
  billedAmount: number;
  riskScore: number;
  riskLevel: RiskLevel;
  date: string;
  status: 'Pending' | 'Investigating' | 'Cleared' | 'Rejected';
  doctorsNote?: string;
  shapValues?: { feature: string; impact: number }[];
}

export interface Metric {
  label: string;
  value: string;
  trend: string;
  trendDirection: 'up' | 'down';
  isGood: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

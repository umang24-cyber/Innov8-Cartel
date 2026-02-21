import { useState } from 'react';
import Sidebar from './components/Sidebar';
import HeaderKPIs from './components/HeaderKPIs';
import AlertQueue from './components/AlertQueue';
import ExplainabilityPanel from './components/ExplainabilityPanel';
import AIChatbot from './components/AIChatbot';
import type { Claim } from './types';

// Mock Data
const mockClaims: Claim[] = [
    {
        id: 'CLM-8492',
        provider: 'Mercy General Hospital',
        diagnosisCode: 'J00',
        billedAmount: 15000,
        riskScore: 92,
        riskLevel: 'Critical',
        date: '2023-10-24',
        status: 'Pending',
        doctorsNote: "Patient presented with mild congestion and a low-grade fever. Diagnosed with a common cold. Recommended rest and over-the-counter medication. Monitored for 30 minutes. No complications observed.",
        shapValues: [
            { feature: 'Billed Amount vs Avg', impact: 0.45 },
            { feature: 'Provider History', impact: 0.22 },
            { feature: 'Diagnosis Mismatch', impact: 0.18 },
            { feature: 'Patient Demographics', impact: -0.05 },
            { feature: 'Time to File', impact: 0.12 },
        ]
    },
    {
        id: 'CLM-8488',
        provider: 'Dr. Sarah Jenkins Clinic',
        diagnosisCode: 'M54.5',
        billedAmount: 3200,
        riskScore: 78,
        riskLevel: 'High',
        date: '2023-10-24',
        status: 'Pending',
        doctorsNote: "Patient complains of lower back pain lasting 2 weeks. Ordered MRI and prescribed muscle relaxants.",
        shapValues: [
            { feature: 'Unnecessary MRI', impact: 0.35 },
            { feature: 'Provider History', impact: 0.12 },
            { feature: 'Billed Amount vs Avg', impact: 0.28 },
        ]
    },
    {
        id: 'CLM-8475',
        provider: 'City Walk-in Express',
        diagnosisCode: 'R05',
        billedAmount: 450,
        riskScore: 42,
        riskLevel: 'Medium',
        date: '2023-10-23',
        status: 'Investigating',
        doctorsNote: "Persistent cough. Prescribed antibiotics.",
    },
    {
        id: 'CLM-8461',
        provider: 'Westside Orthopedics',
        diagnosisCode: 'S82.0',
        billedAmount: 12500,
        riskScore: 12,
        riskLevel: 'Low',
        date: '2023-10-23',
        status: 'Pending',
        doctorsNote: "Fracture of patella. Surgery performed successfully.",
    }
];

function App() {
    const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

    const selectedClaim = mockClaims.find(c => c.id === selectedClaimId) || null;

    return (
        <div className="flex bg-slate-950 min-h-screen text-slate-300 font-sans selection:bg-emerald-500/30">
            <Sidebar />

            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Header Section */}
                <header className="px-8 py-6 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md z-10 sticky top-0">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Case Manager</h1>
                            <p className="text-slate-400 text-sm mt-1">Real-time anomaly detection and investigation.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-full px-4 py-1.5 focus-within:ring-1 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
                                <span className="text-slate-500 text-sm mr-2">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Search claims, IDs..."
                                    className="bg-transparent border-none text-sm text-white focus:outline-none w-48 placeholder:text-slate-500"
                                />
                            </div>
                            <button className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                Generate Report
                            </button>
                        </div>
                    </div>
                    <HeaderKPIs />
                </header>

                {/* Main Content Area */}
                <div className="flex-1 flex overflow-hidden p-8 gap-8 relative bg-slate-950">
                    {/* Main Table Container */}
                    <div className={`flex-1 transition-all duration-300 ease-in-out`}>
                        <AlertQueue
                            claims={mockClaims}
                            selectedClaimId={selectedClaimId}
                            onSelectClaim={(id) => setSelectedClaimId(id === selectedClaimId ? null : id)}
                        />
                    </div>

                    {/* Slide-out Panel */}
                    {selectedClaimId && (
                        <ExplainabilityPanel
                            claim={selectedClaim}
                            onClose={() => setSelectedClaimId(null)}
                        />
                    )}
                </div>
            </main>

            <AIChatbot />
        </div>
    );
}

export default App;

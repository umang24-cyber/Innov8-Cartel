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
        <div className="flex bg-[#030614] min-h-screen text-slate-300 font-sans selection:bg-cyan-500/30 selection:text-cyan-50 overflow-hidden">
            <Sidebar />

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Background ambient glow matching Tookitaki design */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none"></div>

                {/* Top Header Section */}
                <header className="px-8 py-6 border-b border-slate-800/60 bg-[#070b19]/80 backdrop-blur-xl z-10 sticky top-0 shadow-sm shadow-cyan-900/5">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">Case Manager</h1>
                            <p className="text-cyan-400/80 text-sm mt-1.5 font-medium tracking-wide">Real-time anomaly detection and investigation.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center bg-[#0a1024] border border-slate-700/80 rounded-full px-4 py-2 focus-within:ring-1 focus-within:ring-cyan-500/50 focus-within:border-cyan-500/50 transition-all shadow-inner">
                                <span className="text-slate-500 text-sm mr-2 opacity-80">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Search claims, IDs..."
                                    className="bg-transparent border-none text-sm text-white focus:outline-none w-56 placeholder:text-slate-600 font-medium"
                                />
                            </div>
                            <button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(34,211,238,0.25)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] transform hover:-translate-y-0.5 border border-cyan-400/20">
                                Generate Report
                            </button>
                        </div>
                    </div>
                    <HeaderKPIs />
                </header>

                {/* Main Content Area */}
                <div className="flex-1 flex overflow-hidden p-8 gap-8 relative z-10">
                    {/* Main Table Container */}
                    <div className={`flex-1 transition-all duration-500 ease-in-out`}>
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

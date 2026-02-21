import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import HeaderKPIs from './components/HeaderKPIs';
import AlertQueue from './components/AlertQueue';
import ExplainabilityPanel from './components/ExplainabilityPanel';
import AIChatbot from './components/AIChatbot';
import type { Claim, ViewState } from './types';
import { api } from './services/api';
import { Loader2, Activity, RefreshCw } from 'lucide-react';

function App() {
    const [currentView, setCurrentView] = useState<ViewState>('queue');
    const [claims, setClaims] = useState<Claim[]>([]);
    const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
    const [isLoadingInit, setIsLoadingInit] = useState(true);
    const [analyzingClaimId, setAnalyzingClaimId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initial Fetch
    const fetchClaims = async () => {
        setIsLoadingInit(true);
        setError(null);
        try {
            const data = await api.getDemoClaims();
            if (data && data.length > 0) {
                setClaims(data);
            } else {
                // Don't set error if we get empty array - just show empty state
                setClaims([]);
            }
        } catch (err) {
            console.error("Failed to load claims", err);
            // Set error but don't prevent UI from rendering
            setError("Cannot connect to VeriClaim AI Core (localhost:8000). Please start the backend server.");
            setClaims([]); // Set empty array so UI can still render
        } finally {
            setIsLoadingInit(false);
        }
    };

    useEffect(() => {
        fetchClaims();
    }, []);

    const handleSelectClaim = async (id: string) => {
        if (selectedClaimId === id) {
            setSelectedClaimId(null);
            return;
        }

        const claim = claims.find(c => c.claim_id === id);
        if (!claim) return;

        setSelectedClaimId(id);

        // If the claim hasn't been scored by the ML yet, trigger the API
        if (claim.riskScore === undefined && !analyzingClaimId) {
            setAnalyzingClaimId(id);
            try {
                const result = await api.analyzeClaim(claim);

                // Update the claim in state with ML results
                setClaims(prev => prev.map(c =>
                    c.claim_id === id
                        ? {
                            ...c,
                            riskScore: result.risk_score,
                            riskLevel: result.risk_label === 'HIGH' ? 'High' : 
                                      result.risk_label === 'MEDIUM' ? 'Medium' : 
                                      result.risk_label === 'LOW' ? 'Low' : 'Low',
                            shapValues: result.shap_details,
                            llmAnalysis: result.llm_text_analysis,
                            diagnosisStats: result.diagnosis_stats,
                            anomalyScore: result.anomaly_score,
                            benfordScore: result.benford_score,
                            benfordAnalysis: result.benford_analysis,
                            status: result.risk_score > 60 ? 'Investigating' : 'Pending'
                        }
                        : c
                ));
            } catch (err) {
                console.error("Failed to analyze claim", err);
            } finally {
                setAnalyzingClaimId(null);
            }
        }
    };

    const selectedClaim = claims.find(c => c.claim_id === selectedClaimId) || null;

    return (
        <div className="flex bg-slate-100 min-h-screen text-slate-800 font-sans selection:bg-teal-500/30 selection:text-teal-900 overflow-hidden relative">

            <Sidebar currentView={currentView} onViewChange={setCurrentView} />

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
                {/* Medical Theme Abstract Background Elements */}
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-teal-100/40 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none"></div>

                {/* Top Header Section */}
                <header className="px-8 py-6 border-b border-white/40 bg-white/60 backdrop-blur-xl z-10 sticky top-0 shadow-sm shadow-slate-200/50">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-cyan-600 tracking-tight">
                                {currentView === 'overview' && 'System Overview'}
                                {currentView === 'queue' && 'Live Alert Queue'}
                                {currentView === 'case_manager' && 'Case Manager'}
                                {currentView === 'typology' && 'Typology Studio'}
                                {currentView === 'settings' && 'System Settings'}
                            </h1>
                            <p className="text-slate-500 text-sm mt-1.5 font-semibold tracking-wide flex items-center">
                                <Activity size={14} className="mr-1.5 text-teal-500" />
                                Real-time clinical anomaly detection
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center bg-white border border-slate-200 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-teal-100 focus-within:border-teal-400 transition-all shadow-sm">
                                <span className="text-teal-600 text-sm mr-2 font-black">⚲</span>
                                <input
                                    type="text"
                                    placeholder="Search Claim ID, Provider..."
                                    className="bg-transparent border-none text-sm text-slate-800 focus:outline-none w-64 placeholder:text-slate-400 font-medium"
                                />
                            </div>
                            <button className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-md shadow-teal-500/20 hover:shadow-lg transform hover:-translate-y-0.5 border border-teal-400/20 flex items-center">
                                <RefreshCw size={14} className="mr-2" />
                                Generate Report
                            </button>
                        </div>
                    </div>
                    {currentView === 'overview' && <HeaderKPIs />}
                </header>

                {/* Main Content Area */}
                <div className="flex-1 flex overflow-hidden p-8 gap-8 relative z-10">

                    {error && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-100/80 backdrop-blur-sm">
                            <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 max-w-md text-center">
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Activity size={32} />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 mb-2">Connection Error</h2>
                                <p className="text-slate-600 font-medium mb-6">{error}</p>
                                <div className="flex gap-3 justify-center">
                                    <button onClick={fetchClaims} className="bg-teal-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-teal-500 transition-colors">
                                        Retry Connection
                                    </button>
                                    <button onClick={() => setError(null)} className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-bold hover:bg-slate-300 transition-colors">
                                        Continue Anyway
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Routing Logic based on Sidebar State */}
                    {['queue', 'case_manager'].includes(currentView) && (
                        <>
                            <div className={`flex-1 transition-all duration-500 ease-in-out`}>
                                <AlertQueue
                                    claims={claims}
                                    selectedClaimId={selectedClaimId}
                                    onSelectClaim={handleSelectClaim}
                                    isLoadingId={analyzingClaimId}
                                />
                            </div>

                            {/* Slide-out SHAP Panel */}
                            {selectedClaimId && (
                                <ExplainabilityPanel
                                    claim={selectedClaim}
                                    onClose={() => setSelectedClaimId(null)}
                                />
                            )}
                        </>
                    )}

                    {currentView === 'overview' && (
                        <div className="flex-1 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col items-center justify-center text-slate-400">
                            <Activity size={64} className="text-teal-200 mb-4" />
                            <h2 className="text-2xl font-bold text-slate-700">VeriClaim Analytics Dashboard</h2>
                            <p className="font-medium mt-2">Select "Alert Queue" to view live claim streaming.</p>
                        </div>
                    )}

                    {['typology', 'settings'].includes(currentView) && (
                        <div className="flex-1 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col items-center justify-center text-slate-400">
                            <p className="font-bold text-lg text-slate-500">This module is under construction.</p>
                        </div>
                    )}

                </div>
            </main>

            {/* Global Chatbot */}
            <AIChatbot currentClaim={selectedClaim} />

            {/* Initial Loader overlay */}
            {isLoadingInit && !error && (
                <div className="fixed inset-0 z-[100] bg-slate-50/90 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Loader2 size={48} className="text-teal-600 animate-spin mb-4" />
                    <h2 className="text-xl font-extrabold text-slate-800 tracking-wide">Initializing VeriClaim AI Core...</h2>
                    <p className="text-slate-500 font-medium mt-2">Connecting to FastAPI and ML inference cluster.</p>
                </div>
            )}
        </div>
    );
}

export default App;

import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import AlertQueue from './components/AlertQueue';
import ExplainabilityPanel from './components/ExplainabilityPanel';
import AIChatbot from './components/AIChatbot';
import DisclaimerModal from './components/DisclaimerModal';
import { Overview } from './pages/Overview';
import { TypologyStudio } from './pages/TypologyStudio';
import { CaseManager } from './pages/CaseManager';
import { NewClaimPage } from './pages/NewClaimPage';
import { AyushmanPortal } from './pages/AyushmanPortal';
import { Settings } from './pages/Settings';
import { LandingPage } from './components/LandingPage';
import { ProfileSettings } from './components/ProfileSettings';
import type { Claim, ViewState } from './types';
import { api } from './services/api';
import { Loader2, Activity, RefreshCw, Moon, Sun, Bell } from 'lucide-react';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { toast } from './utils/toast';

function App() {
    const { theme, toggleTheme } = useTheme();
    const { user, isAuthenticated, signUp, login, logout, updateProfile, deleteAccount } = useAuth();
    const [currentView, setCurrentView] = useState<ViewState>('overview');
    const [prevView, setPrevView] = useState<ViewState>('overview');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [claims, setClaims] = useState<Claim[]>([]);
    const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
    const [isLoadingInit, setIsLoadingInit] = useState(true);
    const [analyzingClaimId, setAnalyzingClaimId] = useState<string | null>(null);
    const [isInvestigatingAll, setIsInvestigatingAll] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileSettings, setShowProfileSettings] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    // Smooth tab transition handler
    const handleViewChange = (view: ViewState) => {
        if (view === currentView) return;
        setIsTransitioning(true);
        setPrevView(currentView);
        setTimeout(() => {
            setCurrentView(view);
            setSelectedClaimId(null);
            setTimeout(() => setIsTransitioning(false), 50);
        }, 200);
    };

    // Initial Fetch
    const fetchClaims = async () => {
        setIsLoadingInit(true);
        setError(null);
        try {
            const data = await api.getDemoClaims();
            if (data && data.length > 0) {
                setClaims(data);
            } else {
                setClaims([]);
            }
        } catch (err) {
            console.error("Failed to load claims", err);
            setError("Cannot connect to VeriClaim AI Core (localhost:8000). Please start the backend server.");
            setClaims([]);
        } finally {
            setIsLoadingInit(false);
        }
    };

    useEffect(() => {
        fetchClaims();
    }, []);

    // Close notification dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // FIXED: Only opens the detail panel — does NOT auto-trigger /analyze_claim
    const handleSelectClaim = (id: string) => {
        if (selectedClaimId === id) {
            setSelectedClaimId(null);
            return;
        }
        setSelectedClaimId(id);
    };

    // Called explicitly by the "Investigate" button
    const handleInvestigateClaim = async (id: string) => {
        const claim = claims.find(c => c.claim_id === id);
        if (!claim || analyzingClaimId) return;

        setAnalyzingClaimId(id);
        try {
            const result = await api.analyzeClaim(claim);
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
                        gaussianScore: result.gaussian_score,
                        gaussianAnalysis: result.gaussian_analysis,
                        triggeredTypologies: result.triggered_typologies,
                        status: 'Investigated'
                    }
                    : c
            ));
            toast.success(`Claim ${id} analyzed successfully`);
        } catch (err) {
            console.error("Failed to analyze claim", err);
            toast.error("Failed to analyze claim. Is the backend running?");
        } finally {
            setAnalyzingClaimId(null);
        }
    };

    // Called by the "Clear Claim" button
    const handleClearClaim = (id: string) => {
        setClaims(prev => prev.map(c =>
            c.claim_id === id
                ? {
                    ...c,
                    riskScore: undefined,
                    riskLevel: undefined,
                    shapValues: undefined,
                    llmAnalysis: undefined,
                    diagnosisStats: undefined,
                    anomalyScore: undefined,
                    gaussianScore: undefined,
                    gaussianAnalysis: undefined,
                    triggeredTypologies: undefined,
                    status: 'Cleared'
                }
                : c
        ));
        setSelectedClaimId(null);
        toast.info(`Claim ${id} cleared`);
    };

    // Investigate all unscored claims sequentially
    const handleInvestigateAll = async () => {
        const unscoredClaims = claims.filter(c => c.riskScore === undefined && c.status !== 'Done');
        if (unscoredClaims.length === 0) {
            toast.info('All claims have already been investigated');
            return;
        }
        setIsInvestigatingAll(true);
        for (const claim of unscoredClaims) {
            await handleInvestigateClaim(claim.claim_id);
        }
        setIsInvestigatingAll(false);
        toast.success(`All ${unscoredClaims.length} claims investigated`);
    };

    // Mark claim as done
    const handleMarkDone = (id: string) => {
        setClaims(prev => prev.map(c =>
            c.claim_id === id ? { ...c, status: 'Done' as const } : c
        ));
        toast.success(`Claim ${id} marked as done`);
    };

    const selectedClaim = claims.find(c => c.claim_id === selectedClaimId) || null;

    // Compute notification stats from claims
    const highRiskClaims = claims.filter(c => c.riskScore !== undefined && c.riskScore > 60);
    const investigatingClaims = claims.filter(c => c.status === 'Investigating');
    const totalFlagged = claims.filter(c => c.riskScore !== undefined && c.riskScore > 40).length;

    const handleLogout = () => {
        logout();
        setShowProfileSettings(false);
    };

    const handleDeleteAccount = () => {
        deleteAccount();
        setShowProfileSettings(false);
    };

    const handleClaimSaved = (claim: any) => {
        setClaims((prev: any) => [...prev, claim]);
    };

    if (!isAuthenticated) {
        return <LandingPage onSignUp={signUp} onLogin={login} />;
    }

    return (
        <div className="flex bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-900 dark:text-slate-100 font-sans selection:bg-teal-500/30 selection:text-teal-900 overflow-hidden relative transition-colors duration-200">

            {/* Legal Disclaimer Popup */}
            <DisclaimerModal />

            <Sidebar currentView={currentView} onViewChange={handleViewChange} user={user} onProfileClick={() => setShowProfileSettings(true)} />

            {/* Profile Settings Modal */}
            {showProfileSettings && user && (
                <ProfileSettings
                    user={user}
                    onClose={() => setShowProfileSettings(false)}
                    onUpdateProfile={updateProfile}
                    onDeleteAccount={handleDeleteAccount}
                    onLogout={handleLogout}
                />
            )}

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
                {/* Background Elements */}
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-teal-100/30 dark:bg-teal-900/20 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/30 dark:bg-blue-900/20 rounded-full blur-[100px] pointer-events-none"></div>

                {/* Top Header Section */}
                <header className="px-8 py-6 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl z-50 sticky top-0 shadow-sm">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 tracking-tight transition-all duration-300">
                                {currentView === 'overview' && 'Dashboard Overview'}
                                {currentView === 'queue' && 'Live Alert Queue'}
                                {currentView === 'case_manager' && 'Case Manager'}
                                {currentView === 'typology' && 'Typology Studio'}
                                {currentView === 'settings' && 'System Settings'}
                                {currentView === 'new_claim' && 'New Claim Analysis'}
                                {currentView === 'ayushman_portal' && 'AB-PMJAY Portal'}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 font-semibold tracking-wide flex items-center">
                                <Activity size={14} className="mr-1.5 text-teal-500" />
                                Real-time AI-powered fraud detection
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Notification Bell */}
                            <div className="relative z-[9999]" ref={notifRef}>
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 relative"
                                    aria-label="Notifications"
                                >
                                    <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                    {totalFlagged > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm min-w-[18px] min-h-[18px] animate-pulse">
                                            {totalFlagged}
                                        </span>
                                    )}
                                </button>

                                {/* Notification Dropdown */}
                                {showNotifications && (
                                    <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Risk Notifications</h3>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold mt-1">Alert Queue Summary</p>
                                        </div>
                                        <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                                            <div className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                                                    <span className="text-sm font-bold text-rose-700 dark:text-rose-300">High Risk Claims</span>
                                                </div>
                                                <span className="text-lg font-black text-rose-600 dark:text-rose-400">{highRiskClaims.length}</span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                    <span className="text-sm font-bold text-amber-700 dark:text-amber-300">Under Investigation</span>
                                                </div>
                                                <span className="text-lg font-black text-amber-600 dark:text-amber-400">{investigatingClaims.length}</span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                                                    <span className="text-sm font-bold text-teal-700 dark:text-teal-300">Total Flagged</span>
                                                </div>
                                                <span className="text-lg font-black text-teal-600 dark:text-teal-400">{totalFlagged}</span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Total Claims Loaded</span>
                                                </div>
                                                <span className="text-lg font-black text-slate-700 dark:text-slate-200">{claims.length}</span>
                                            </div>
                                        </div>
                                        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                                            <button
                                                onClick={() => { setShowNotifications(false); handleViewChange('queue'); }}
                                                className="w-full text-center text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 py-1.5 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-all"
                                            >
                                                View Alert Queue →
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={toggleTheme}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? (
                                    <Sun className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                ) : (
                                    <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    fetchClaims();
                                    toast.success('Data refreshed');
                                }}
                                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-md shadow-teal-500/20 hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                            >
                                <RefreshCw size={14} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content Area with smooth transitions */}
                <div className={`flex-1 overflow-y-auto p-6 relative z-10 transition-all duration-300 ease-in-out ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                    {error && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-red-100 dark:border-red-900 max-w-md text-center transform animate-in zoom-in-95 duration-300">
                                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Activity size={32} />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Connection Error</h2>
                                <p className="text-slate-600 dark:text-slate-400 font-medium mb-6">{error}</p>
                                <div className="flex gap-3 justify-center">
                                    <button onClick={fetchClaims} className="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold shadow-md hover:bg-teal-500 transition-all active:scale-95">
                                        Retry Connection
                                    </button>
                                    <button onClick={() => setError(null)} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-2 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all active:scale-95">
                                        Continue Anyway
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Page Routing */}
                    {currentView === 'overview' && <Overview userEmail={user?.email} />}

                    {currentView === 'queue' && (
                        <div className="flex gap-6 h-full">
                            <div className={`transition-all duration-400 ease-in-out ${selectedClaimId ? 'flex-1' : 'flex-1'}`}>
                                <AlertQueue
                                    claims={claims}
                                    selectedClaimId={selectedClaimId}
                                    onSelectClaim={handleSelectClaim}
                                    isLoadingId={analyzingClaimId}
                                    onInvestigateAll={handleInvestigateAll}
                                    onMarkDone={handleMarkDone}
                                    isInvestigatingAll={isInvestigatingAll}
                                />
                            </div>
                            <div className={`transition-all duration-400 ease-in-out transform ${selectedClaimId ? 'translate-x-0 opacity-100 w-[400px]' : 'translate-x-8 opacity-0 w-0 overflow-hidden'}`}>
                                {selectedClaimId && (
                                    <ExplainabilityPanel
                                        claim={selectedClaim}
                                        onClose={() => setSelectedClaimId(null)}
                                        onInvestigate={handleInvestigateClaim}
                                        onClear={handleClearClaim}
                                        isAnalyzing={analyzingClaimId === selectedClaimId}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {currentView === 'case_manager' && <CaseManager investigatedClaims={claims.filter(c => c.status === 'Investigated' || c.status === 'Done')} />}
                    {currentView === 'typology' && <TypologyStudio />}
                    {currentView === 'new_claim' && <NewClaimPage userEmail={user?.email} onClaimSaved={handleClaimSaved} onNavigate={(view: string) => setCurrentView(view)} />}
                    {currentView === 'ayushman_portal' && <AyushmanPortal />}

                    {currentView === 'settings' && <Settings />}
                </div>
            </main>

            {/* Global Chatbot */}
            <AIChatbot currentClaim={selectedClaim} />

            {/* Initial Loader overlay */}
            {isLoadingInit && !error && (
                <div className="fixed inset-0 z-[100] bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Loader2 size={48} className="text-teal-600 dark:text-teal-400 animate-spin mb-4" />
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-wide">Preparing your health claims dashboard...</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Syncing patient records and claim data.</p>
                </div>
            )}
        </div>
    );
}

export default App;

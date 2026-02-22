import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Activity, Brain, Layers, BarChart3, ChevronDown, Fingerprint, Search, FileText, X, LogIn } from 'lucide-react';

interface LandingPageProps {
    onSignUp: (email: string, password: string) => { success: boolean; error?: string };
    onLogin: (email: string, password: string) => { success: boolean; error?: string };
}

/* ── shared text-shadow style for contrast ── */
const textShadow = { textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 0 2px rgba(0,0,0,0.4)' };
const subtleShadow = { textShadow: '0 1px 4px rgba(0,0,0,0.5)' };

export const LandingPage: React.FC<LandingPageProps> = ({ onSignUp, onLogin }) => {
    /* ── auth form state ── */
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [fadeOut, setFadeOut] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);

    /* ── section visibility ── */
    const [heroVisible, setHeroVisible] = useState(false);
    const [aboutVisible, setAboutVisible] = useState(false);
    const [modelVisible, setModelVisible] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const aboutRef = useRef<HTMLDivElement>(null);
    const modelRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Hero entrance
    useEffect(() => {
        const t = setTimeout(() => setHeroVisible(true), 200);
        return () => clearTimeout(t);
    }, []);

    // Scroll detection for nav bar background + hiding scroll indicator
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const handleScroll = () => setScrolled(container.scrollTop > 100);
        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    // Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('data-section');
                        if (id === 'about') setAboutVisible(true);
                        if (id === 'model') setModelVisible(true);
                    }
                });
            },
            { threshold: 0.15 }
        );
        if (aboutRef.current) observer.observe(aboutRef.current);
        if (modelRef.current) observer.observe(modelRef.current);
        return () => observer.disconnect();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email.trim() || !password.trim()) { setError('Please fill in all fields.'); return; }
        if (isSignUp && password !== confirmPassword) { setError('Passwords do not match.'); return; }
        if (password.length < 4) { setError('Password must be at least 4 characters.'); return; }

        setIsLoading(true);
        await new Promise(r => setTimeout(r, 800));
        const result = isSignUp ? onSignUp(email, password) : onLogin(email, password);
        setIsLoading(false);
        if (!result.success) { setError(result.error || 'Authentication failed.'); return; }
        setShowAuthModal(false);
        setFadeOut(true);
    };

    const scrollToTop = () => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const openAuth = () => {
        setError('');
        setShowAuthModal(true);
    };

    return (
        <div className={`fixed inset-0 z-[9998] transition-all duration-700 ${fadeOut ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}>

            {/* ── FIXED TOP NAV BAR ── */}
            <nav className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between px-8 py-4 transition-all duration-500 ${scrolled ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/[0.06] shadow-lg' : 'bg-transparent'}`}>
                <div className="flex items-center gap-3 cursor-pointer" onClick={scrollToTop}>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20 animate-[logoFloat_3s_ease-in-out_infinite]">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-black text-white tracking-tight" style={subtleShadow}>
                        Veri<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">Claim</span>
                    </span>
                </div>
                <button
                    onClick={openAuth}
                    className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-bold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden relative group"
                >
                    <div className="absolute inset-0 overflow-hidden rounded-full"><div className="glint-sweep-fast" /></div>
                    <LogIn size={16} className="relative z-10" />
                    <span className="relative z-10">Sign In</span>
                </button>
            </nav>


            {/* ── SCROLLABLE CONTENT ── */}
            <div ref={scrollContainerRef} className="h-full overflow-y-auto overflow-x-hidden" style={{ scrollBehavior: 'smooth' }}>

                {/* Global dark background */}
                <div className="fixed inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 -z-20" />

                {/* Ambient orbs */}
                <div className="fixed top-[10%] left-[10%] w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[150px] animate-pulse -z-10" />
                <div className="fixed bottom-[10%] right-[5%] w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[130px] animate-pulse -z-10" style={{ animationDelay: '1.5s' }} />
                <div className="fixed top-[60%] left-[50%] w-[400px] h-[400px] bg-indigo-500/6 rounded-full blur-[100px] animate-pulse -z-10" style={{ animationDelay: '3s' }} />

                {/* Dot grid */}
                <div className="fixed inset-0 opacity-[0.02] -z-10" style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                }} />


                {/* ═══════ SECTION 1: HERO ═══════ */}
                <section className="min-h-screen flex flex-col items-center justify-center relative px-6 pt-20">
                    <div className={`text-center max-w-4xl mx-auto transition-all duration-1000 ease-out ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>

                        {/* Bouncy Logo */}
                        <div className="flex items-center justify-center gap-4 mb-5">
                            <div className="relative animate-[logoFloat_3s_ease-in-out_infinite]">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-2xl shadow-teal-500/30 animate-[logoPulse_2s_ease-in-out_infinite]">
                                    <ShieldCheck className="w-10 h-10 text-white drop-shadow-lg" />
                                </div>
                                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                                    <div className="glint-sweep" />
                                </div>
                                {/* Glow ring */}
                                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-teal-400/20 to-cyan-400/20 blur-md -z-10 animate-pulse" />
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight" style={textShadow}>
                                Veri<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">Claim</span>
                            </h1>
                        </div>

                        {/* Advisory badge right under logo */}
                        <div className={`mb-8 transition-all duration-1000 delay-200 ease-out ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-full px-5 py-1.5 text-amber-400 text-[11px] font-bold uppercase tracking-wider shadow-lg shadow-amber-500/5">
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                ⚠ Advisory Only — No Automated Decisions
                            </div>
                        </div>

                        {/* Main Quote */}
                        <div className="overflow-hidden mb-8">
                            <h2
                                className={`text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-teal-200 tracking-tight transition-all duration-1000 delay-300 ease-out ${heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
                                style={{ lineHeight: '1.2', filter: 'drop-shadow(0 2px 8px rgba(20,184,166,0.3))' }}
                            >
                                "Claiming ain't gonna cut it."
                            </h2>
                        </div>

                        {/* Subtitle */}
                        <div className={`transition-all duration-1000 delay-700 ease-out ${heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                            <div className="flex items-center justify-center gap-3 mb-5">
                                <Activity className="w-6 h-6 text-teal-400 animate-pulse" />
                                <div className="h-px w-12 bg-teal-500/50" />
                                <span className="text-lg font-bold tracking-widest text-slate-200 uppercase" style={subtleShadow}>AI-Powered Fraud Intelligence</span>
                                <div className="h-px w-12 bg-teal-500/50" />
                            </div>
                            <p className="text-slate-300 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed" style={subtleShadow}>
                                Intelligent pattern recognition layered with deep semantic analysis.
                                <br />Welcome to the future of healthcare auditing.
                            </p>
                        </div>
                    </div>

                    {/* Scroll indicator — hides once scrolled */}
                    <button
                        onClick={() => aboutRef.current?.scrollIntoView({ behavior: 'smooth' })}
                        className={`absolute bottom-10 flex flex-col items-center gap-2 text-teal-400 hover:text-teal-300 transition-all duration-500 cursor-pointer ${heroVisible && !scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={subtleShadow}>Explore</span>
                        <ChevronDown size={22} className="animate-bounce drop-shadow-lg" />
                    </button>
                </section>


                {/* ═══════ ROUNDED SECTION DIVIDER ═══════ */}
                <div className="relative h-24 -mb-12 z-10">
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-slate-900/50 rounded-t-[3rem]" />
                </div>


                {/* ═══════ SECTION 2: ABOUT US ═══════ */}
                <section ref={aboutRef} data-section="about" className="min-h-screen flex items-center justify-center px-6 py-24 relative bg-slate-900/30 backdrop-blur-sm">
                    <div className={`max-w-5xl mx-auto transition-all duration-1000 ease-out ${aboutVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>

                        <div className="text-center mb-16">
                            <span className="text-[11px] font-black text-teal-400 uppercase tracking-[0.4em] mb-4 block" style={subtleShadow}>Who We Are</span>
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight" style={textShadow}>
                                Fighting Fraud with <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">Intelligence</span>
                            </h2>
                            <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed" style={subtleShadow}>
                                VeriClaim is an AI-powered advisory platform built for healthcare fraud investigators.
                                We combine machine learning, anomaly detection, and clinical NLP to flag suspicious claims — while keeping humans in the loop.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { icon: <Fingerprint className="w-7 h-7" />, title: 'Anomaly Detection', desc: 'Isolation Forest algorithms identify statistical outliers in billing patterns that deviate from provider norms.' },
                                { icon: <Search className="w-7 h-7" />, title: 'Explainable AI', desc: 'Every flag comes with SHAP-powered explanations so investigators understand exactly why a claim was flagged.' },
                                { icon: <FileText className="w-7 h-7" />, title: 'Clinical NLP Audit', desc: "LLM reads doctor's notes and cross-references them against billed procedures to catch semantic mismatches." },
                            ].map((card, i) => (
                                <div
                                    key={i}
                                    className="relative group bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 transition-all duration-700 hover:border-teal-500/30 hover:bg-white/[0.08] hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/5"
                                    style={{ transitionDelay: `${i * 150}ms` }}
                                >
                                    <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none"><div className="glint-sweep-slow" /></div>
                                    <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-teal-400/20 to-transparent" />
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4 group-hover:shadow-lg group-hover:shadow-teal-500/10 transition-shadow">
                                        {card.icon}
                                    </div>
                                    <h3 className="text-white font-bold text-lg mb-2" style={subtleShadow}>{card.title}</h3>
                                    <p className="text-slate-300 text-sm leading-relaxed" style={subtleShadow}>{card.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>


                {/* ═══════ ROUNDED SECTION DIVIDER ═══════ */}
                <div className="relative h-24 -mb-12 z-10">
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-slate-800/40 rounded-t-[3rem]" />
                </div>


                {/* ═══════ SECTION 3: ABOUT OUR MODEL ═══════ */}
                <section ref={modelRef} data-section="model" className="min-h-screen flex items-center justify-center px-6 py-24 relative bg-slate-800/20">
                    <div className={`max-w-5xl mx-auto transition-all duration-1000 ease-out ${modelVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>

                        <div className="text-center mb-16">
                            <span className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-4 block" style={subtleShadow}>Under the Hood</span>
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight" style={textShadow}>
                                A <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">Three-Layer</span> Pipeline
                            </h2>
                            <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed" style={subtleShadow}>
                                Claims flow through three independent analysis layers. Each layer produces its own verdict, and the combined signal drives the final risk score.
                            </p>
                        </div>

                        <div className="space-y-6">
                            {[
                                { icon: <Brain className="w-6 h-6" />, layer: 'Layer A', title: 'Random Forest Classifier', desc: 'Trained on historical claims data with SMOTE oversampling. Outputs fraud probability 0-100%. SHAP TreeExplainer provides per-feature attribution.', color: 'from-teal-500 to-emerald-500', glow: 'shadow-teal-500/20' },
                                { icon: <Layers className="w-6 h-6" />, layer: 'Layer B', title: 'Isolation Forest (Anomaly Detection)', desc: 'Unsupervised model scoring how "anomalous" each claim is relative to historical distribution using claim amount and severity features.', color: 'from-cyan-500 to-blue-500', glow: 'shadow-cyan-500/20' },
                                { icon: <BarChart3 className="w-6 h-6" />, layer: 'Layer C', title: 'LLM Clinical Audit (Groq + Mega)', desc: "Groq reads unstructured doctor's notes to verify clinical documentation justifies billed procedures. Mega LLM powers the investigator chatbot.", color: 'from-indigo-500 to-purple-500', glow: 'shadow-indigo-500/20' },
                            ].map((layer, i) => (
                                <div
                                    key={i}
                                    className="relative flex gap-6 items-start bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 transition-all duration-700 hover:border-white/[0.14] hover:bg-white/[0.08] group"
                                    style={{ transitionDelay: `${i * 200}ms` }}
                                >
                                    <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none"><div className="glint-sweep-slow" /></div>
                                    <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${layer.color} flex items-center justify-center text-white shadow-lg ${layer.glow} group-hover:scale-110 transition-transform`}>
                                        {layer.icon}
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]" style={subtleShadow}>{layer.layer}</span>
                                        <h3 className="text-white font-bold text-lg mb-1" style={subtleShadow}>{layer.title}</h3>
                                        <p className="text-slate-300 text-sm leading-relaxed" style={subtleShadow}>{layer.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>


                {/* ═══════ QUOTE + GET STARTED FOOTER ═══════ */}
                <section className="py-24 px-6 relative">
                    <div className="max-w-2xl mx-auto text-center">
                        <p className="text-xl text-slate-300 font-medium italic leading-relaxed mb-3" style={subtleShadow}>
                            "Every satisfactory explanation must be <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300 font-bold not-italic">
                                an elimination of the improbable.
                            </span>"
                        </p>
                        <p className="text-xs text-slate-500 tracking-widest uppercase font-bold mb-10" style={subtleShadow}>— Arthur Conan Doyle</p>

                        {/* GET STARTED button */}
                        <button
                            onClick={() => { scrollToTop(); setTimeout(openAuth, 600); }}
                            className="relative inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-white font-extrabold text-base tracking-wide transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 bg-[length:200%_100%] group-hover:bg-[position:100%_0] transition-[background-position] duration-500 rounded-2xl" />
                            <div className="absolute inset-0 overflow-hidden rounded-2xl"><div className="glint-sweep-fast" /></div>
                            <div className="absolute inset-0 shadow-2xl shadow-teal-600/30 group-hover:shadow-teal-500/40 rounded-2xl transition-shadow duration-300" />
                            <Sparkles size={18} className="relative z-10" />
                            <span className="relative z-10">Get Started</span>
                            <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </section>


                {/* Footer */}
                <footer className="py-8 text-center border-t border-white/[0.04]">
                    <p className="text-slate-500 text-xs font-medium" style={subtleShadow}>© 2026 VeriClaim AI · Advisory Only · Innov8 Cartel</p>
                </footer>
            </div>


            {/* ═══════════════════════════════════════════════════════════ */}
            {/* AUTH MODAL POPUP                                            */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {showAuthModal && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[10000] animate-[fadeIn_0.2s_ease-out]" onClick={() => setShowAuthModal(false)} />

                    {/* Modal */}
                    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
                        <div className="relative w-full max-w-md animate-[slideIn_0.3s_ease-out]">
                            {/* Close button */}
                            <button
                                onClick={() => setShowAuthModal(false)}
                                className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all shadow-lg"
                            >
                                <X size={14} />
                            </button>

                            <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500/25 via-cyan-500/25 to-teal-500/25 rounded-3xl blur-sm" />
                            <div className="relative bg-slate-900/95 backdrop-blur-2xl border border-white/[0.12] rounded-3xl p-8 shadow-2xl overflow-hidden">
                                <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none"><div className="glint-sweep-slow" /></div>
                                <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-teal-400/40 to-transparent" />

                                {/* Tabs */}
                                <div className="flex mb-8 bg-white/[0.05] rounded-2xl p-1 border border-white/[0.08]">
                                    <button
                                        onClick={() => { setIsSignUp(false); setError(''); }}
                                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${!isSignUp ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25' : 'text-slate-400 hover:text-slate-300'}`}
                                    >Sign In</button>
                                    <button
                                        onClick={() => { setIsSignUp(true); setError(''); }}
                                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${isSignUp ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25' : 'text-slate-400 hover:text-slate-300'}`}
                                    >Sign Up</button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="group">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                                placeholder="analyst@vericlaim.ai"
                                                className="w-full pl-11 pr-4 py-3.5 bg-white/[0.06] border border-white/[0.12] rounded-xl text-white placeholder-slate-400 text-sm font-medium transition-all duration-300 focus:outline-none focus:border-teal-500/50 focus:bg-white/[0.08] focus:shadow-[0_0_20px_rgba(20,184,166,0.1)] hover:border-white/[0.2]"
                                            />
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                                            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Enter your password"
                                                className="w-full pl-11 pr-12 py-3.5 bg-white/[0.06] border border-white/[0.12] rounded-xl text-white placeholder-slate-400 text-sm font-medium transition-all duration-300 focus:outline-none focus:border-teal-500/50 focus:bg-white/[0.08] focus:shadow-[0_0_20px_rgba(20,184,166,0.1)] hover:border-white/[0.2]"
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isSignUp ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="group">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Confirm Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                                                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="Confirm your password"
                                                    className="w-full pl-11 pr-12 py-3.5 bg-white/[0.06] border border-white/[0.12] rounded-xl text-white placeholder-slate-400 text-sm font-medium transition-all duration-300 focus:outline-none focus:border-teal-500/50 focus:bg-white/[0.08] focus:shadow-[0_0_20px_rgba(20,184,166,0.1)] hover:border-white/[0.2]"
                                                />
                                                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <p className="text-rose-400 text-xs font-bold bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-2.5 animate-[slideIn_0.3s_ease-out]">
                                            ⚠ {error}
                                        </p>
                                    )}

                                    <button type="submit" disabled={isLoading}
                                        className="relative w-full py-4 rounded-xl text-white font-extrabold text-sm tracking-wide transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 bg-[length:200%_100%] group-hover:bg-[position:100%_0] transition-[background-position] duration-500" />
                                        <div className="absolute inset-0 overflow-hidden"><div className="glint-sweep-fast" /></div>
                                        <div className="absolute inset-0 shadow-xl shadow-teal-600/30 group-hover:shadow-teal-500/40 rounded-xl transition-shadow duration-300" />
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {isLoading ? (
                                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Authenticating...</>
                                            ) : (
                                                <><Sparkles size={16} />{isSignUp ? 'Create Account' : 'Get Started'}<ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                                            )}
                                        </span>
                                    </button>
                                </form>

                                <div className="flex items-center gap-3 mt-6">
                                    <div className="flex-1 h-px bg-white/[0.06]" />
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">secured by AI</span>
                                    <div className="flex-1 h-px bg-white/[0.06]" />
                                </div>
                                <p className="text-center text-[11px] text-slate-500 mt-3 font-medium">Protected by enterprise-grade encryption</p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

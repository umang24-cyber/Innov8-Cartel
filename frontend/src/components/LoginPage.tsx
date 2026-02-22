import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';

interface LoginPageProps {
    onAuthenticated: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onAuthenticated }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [fadeOut, setFadeOut] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Please fill in all fields.');
            return;
        }
        if (isSignUp && password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        // Simulate auth delay for smooth UX
        await new Promise(r => setTimeout(r, 1200));
        setIsLoading(false);

        // Trigger fade out → then unmount
        setFadeOut(true);
        setTimeout(() => {
            onAuthenticated();
        }, 600);
    };

    return (
        <div className={`fixed inset-0 z-[9998] flex items-center justify-center overflow-hidden transition-all duration-700 ease-in-out ${fadeOut ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}>

            {/* Rich dark background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

            {/* Animated ambient orbs */}
            <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-teal-600/15 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-[50%] left-[60%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />

            {/* Subtle grid pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
            }} />

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">

                {/* Logo + Quote section */}
                <div className="text-center mb-10 animate-[fadeIn_1s_ease-out]">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-xl shadow-teal-500/30">
                                <ShieldCheck className="w-7 h-7 text-white" />
                            </div>
                            {/* Glint sweep on logo */}
                            <div className="absolute inset-0 rounded-2xl overflow-hidden">
                                <div className="glint-sweep" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">
                            Veri<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">Claim</span>
                        </h1>
                    </div>

                    <p className="text-lg text-slate-400 font-medium italic leading-relaxed">
                        "Every satisfactory explanation must be <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300 font-bold not-italic">
                            an elimination of the improbable.
                        </span>"
                    </p>
                    <p className="text-xs text-slate-600 mt-2 tracking-widest uppercase font-bold">— Arthur Conan Doyle</p>
                </div>

                {/* Glassmorphism card */}
                <div className="relative w-full animate-[slideIn_0.8s_ease-out_0.3s_both]">
                    {/* Card outer glow */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500/20 via-cyan-500/20 to-teal-500/20 rounded-3xl blur-sm" />

                    <div className="relative bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl overflow-hidden">

                        {/* Glint sweep across card */}
                        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                            <div className="glint-sweep-slow" />
                        </div>

                        {/* Inner top glow line */}
                        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-teal-400/40 to-transparent" />

                        {/* Tab toggle */}
                        <div className="flex mb-8 bg-white/[0.04] rounded-2xl p-1 border border-white/[0.06]">
                            <button
                                onClick={() => { setIsSignUp(false); setError(''); }}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${!isSignUp
                                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25'
                                        : 'text-slate-400 hover:text-slate-300'
                                    }`}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => { setIsSignUp(true); setError(''); }}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${isSignUp
                                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25'
                                        : 'text-slate-400 hover:text-slate-300'
                                    }`}
                            >
                                Sign Up
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email */}
                            <div className="group">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="analyst@vericlaim.ai"
                                        className="w-full pl-11 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-slate-600 text-sm font-medium transition-all duration-300 focus:outline-none focus:border-teal-500/50 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(20,184,166,0.1)] hover:border-white/[0.15]"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="group">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••••"
                                        className="w-full pl-11 pr-12 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-slate-600 text-sm font-medium transition-all duration-300 focus:outline-none focus:border-teal-500/50 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(20,184,166,0.1)] hover:border-white/[0.15]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password (Sign Up only) */}
                            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isSignUp ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="group">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••••"
                                            className="w-full pl-11 pr-12 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-slate-600 text-sm font-medium transition-all duration-300 focus:outline-none focus:border-teal-500/50 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(20,184,166,0.1)] hover:border-white/[0.15]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                        >
                                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Error message */}
                            {error && (
                                <p className="text-rose-400 text-xs font-bold bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-2 animate-[slideIn_0.3s_ease-out]">
                                    {error}
                                </p>
                            )}

                            {/* Submit button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="relative w-full py-4 rounded-xl text-white font-extrabold text-sm tracking-wide transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group"
                            >
                                {/* Button gradient bg */}
                                <div className="absolute inset-0 bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 bg-[length:200%_100%] group-hover:bg-[position:100%_0] transition-[background-position] duration-500" />

                                {/* Glint across button */}
                                <div className="absolute inset-0 overflow-hidden">
                                    <div className="glint-sweep-fast" />
                                </div>

                                {/* Button shadow */}
                                <div className="absolute inset-0 shadow-xl shadow-teal-600/30 group-hover:shadow-teal-500/40 rounded-xl transition-shadow duration-300" />

                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Authenticating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} />
                                            {isSignUp ? 'Create Account' : 'Get Started'}
                                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3 mt-6">
                            <div className="flex-1 h-px bg-white/[0.06]" />
                            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">secured by AI</span>
                            <div className="flex-1 h-px bg-white/[0.06]" />
                        </div>

                        <p className="text-center text-[11px] text-slate-600 mt-4 font-medium">
                            Protected by enterprise-grade encryption
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

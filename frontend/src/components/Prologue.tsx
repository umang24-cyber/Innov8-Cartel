import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

interface PrologueProps {
    onComplete: () => void;
}

export const Prologue: React.FC<PrologueProps> = ({ onComplete }) => {
    const [step, setStep] = useState(0);

    // Sequence timing
    useEffect(() => {
        // Step 1: Show main text after a tiny delay
        const t1 = setTimeout(() => setStep(1), 500);

        // Step 2: Show subtext
        const t2 = setTimeout(() => setStep(2), 2500);

        // Step 3: Trigger exit animation
        const t3 = setTimeout(() => setStep(3), 5500);

        // Step 4: Unmount component
        const t4 = setTimeout(() => onComplete(), 6000);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
        };
    }, [onComplete]);

    return (
        <div className={`fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ease-in-out ${step === 3 ? 'opacity-0' : 'opacity-100'}`}>

            {/* Ambient Background Glows */}
            <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-teal-600/20 rounded-full blur-[100px] transition-all duration-3000 ease-in-out ${step >= 1 ? 'scale-150 opacity-100' : 'scale-50 opacity-0'}`} />
            <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[100px] transition-all duration-3000 delay-500 ease-in-out ${step >= 1 ? 'scale-125 opacity-100' : 'scale-50 opacity-0'}`} />

            <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                {/* Main Quote */}
                <div className="overflow-hidden mb-6">
                    <h1
                        className={`text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-teal-200 tracking-tight transform transition-all duration-1000 ease-out ${step >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
                            }`}
                        style={{ lineHeight: '1.2' }}
                    >
                        "Claiming ain't gonna cut it."
                    </h1>
                </div>

                {/* Subtext */}
                <div className="overflow-hidden mt-8">
                    <div
                        className={`flex flex-col items-center transform transition-all duration-1000 ease-out delay-300 ${step >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <Activity className="w-8 h-8 text-teal-400 animate-pulse" />
                            <div className="h-px w-12 bg-teal-500/50" />
                            <span className="text-xl font-bold tracking-widest text-slate-300 uppercase">
                                VeriClaim AI
                            </span>
                            <div className="h-px w-12 bg-teal-500/50" />
                        </div>
                        <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl">
                            Intelligent pattern recognition layered with deep semantic analysis.
                            <br />Welcome to the future of healthcare auditing.
                        </p>
                    </div>
                </div>
            </div>

            {/* Loading Progress Bar at bottom */}
            <div className={`absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-teal-500 to-cyan-400 transition-all ease-linear duraton-1000 ${step === 0 ? 'w-0' :
                    step === 1 ? 'w-1/3 duration-[2000ms]' :
                        step === 2 ? 'w-full duration-[3000ms]' : 'w-full opacity-0'
                }`} />
        </div>
    );
};

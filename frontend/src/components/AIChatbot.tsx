import { useState } from 'react';
import { X, Send, Bot, FilePlus, Sparkles } from 'lucide-react';

const initialMessages = [
    {
        id: '1',
        sender: 'user',
        text: 'Why was Claim #8492 flagged?',
        timestamp: '10:24 AM'
    },
    {
        id: '2',
        sender: 'ai',
        text: 'Claim #8492 was flagged because the billed amount ($15,000) is 4 standard deviations above the historical average for Diagnosis J00 (Common Cold). Additionally, the doctor\'s notes do not mention any complications justifying this cost.',
        timestamp: '10:24 AM'
    }
];

const AIChatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<any[]>(initialMessages);
    const [input, setInput] = useState('');

    const toggleChat = () => setIsOpen(!isOpen);

    if (!isOpen) {
        return (
            <button
                onClick={toggleChat}
                className="fixed bottom-8 right-8 p-4 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-full shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:scale-110 transition-all z-50 flex items-center group ring-2 ring-cyan-400/30 border border-white/10"
            >
                <Sparkles size={24} className="group-hover:animate-pulse" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-[#0a1024]"></span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-8 right-8 w-[400px] bg-[#0a1024]/95 backdrop-blur-3xl border border-cyan-900/40 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-8 duration-300">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-[#070b19] to-[#0a1024] border-b border-cyan-900/40 flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-cyan-400/0 via-cyan-400 to-blue-500/0"></div>
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center border-2 border-[#0a1024] shadow-[0_0_15px_rgba(34,211,238,0.5)] relative">
                        <Bot size={18} className="text-[#070b19]" />
                        <div className="absolute top-0 -right-0.5 w-2.5 h-2.5 bg-cyan-300 rounded-full border border-[#0a1024] shadow-[0_0_5px_#67e8f9]"></div>
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm tracking-wide">Copilot Investigator</h3>
                        <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-semibold flex items-center mt-0.5">
                            AI Active
                        </p>
                    </div>
                </div>
                <button onClick={toggleChat} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800/80 border border-transparent hover:border-slate-700/50 z-10">
                    <X size={18} />
                </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 h-[350px] overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-cyan-900/50 scrollbar-track-transparent bg-[#070b19]/40 relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

                {messages.map((msg, idx) => (
                    <div key={msg.id} className={`flex flex-col relative z-10 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3.5 shadow-md ${msg.sender === 'user'
                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-sm'
                            : 'bg-[#0a1024] border border-cyan-900/50 text-slate-200 rounded-tl-sm shadow-inner'
                            }`}>
                            <p className="text-[13px] leading-relaxed tracking-wide">{msg.text}</p>
                        </div>

                        {/* Show Add to Case Report button only on AI's latest relevant message */}
                        {msg.sender === 'ai' && idx === messages.length - 1 && (
                            <button className="mt-2.5 ml-1 flex items-center text-[11px] text-blue-400 hover:text-cyan-300 bg-blue-950/40 hover:bg-cyan-900/40 px-3 py-1.5 rounded-full border border-blue-900/50 hover:border-cyan-500/50 transition-all font-semibold uppercase tracking-wider shadow-sm">
                                <FilePlus size={12} className="mr-1.5" />
                                Add to Case Report
                            </button>
                        )}

                        <span className="text-[9px] text-slate-500 mt-1.5 px-1 uppercase tracking-widest font-mono">{msg.timestamp}</span>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#0a1024] border-t border-cyan-900/30">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Message Copilot..."
                        className="w-full bg-[#070b19] text-white text-sm rounded-xl pl-4 pr-12 py-3 border border-slate-700/80 focus:outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/50 shadow-inner transition-all placeholder:text-slate-600 font-medium"
                    />
                    <button className="absolute right-2 p-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all transform hover:scale-105">
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIChatbot;

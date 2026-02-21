import React, { useState } from 'react';
import { MessageSquare, X, Send, Bot, User, FilePlus } from 'lucide-react';

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
                className="fixed bottom-6 right-6 p-4 bg-emerald-500 text-white rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-105 hover:bg-emerald-400 transition-all z-50 flex items-center group"
            >
                <Bot size={24} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center border border-emerald-500/50 relative">
                        <Bot size={16} className="text-emerald-400" />
                        <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-slate-800"></div>
                    </div>
                    <div>
                        <h3 className="text-white font-medium text-sm">Agentic AI Investigator</h3>
                        <p className="text-xs text-emerald-400">Online</p>
                    </div>
                </div>
                <button onClick={toggleChat} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-slate-700">
                    <X size={18} />
                </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 h-80 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {messages.map((msg, idx) => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3 ${msg.sender === 'user'
                                ? 'bg-slate-700 text-white rounded-tr-sm'
                                : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm'
                            }`}>
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                        </div>

                        {/* Show Add to Case Report button only on AI's latest relevant message */}
                        {msg.sender === 'ai' && idx === messages.length - 1 && (
                            <button className="mt-2 ml-1 flex items-center text-xs text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-1.5 rounded-full border border-amber-400/20 transition-colors">
                                <FilePlus size={12} className="mr-1.5" />
                                Add to Case Report
                            </button>
                        )}

                        <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-800 border-t border-slate-700">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask AI Investigator..."
                        className="w-full bg-slate-900 text-white text-sm rounded-full pl-4 pr-12 py-2.5 border border-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-500"
                    />
                    <button className="absolute right-1.5 p-1.5 bg-emerald-500 text-white rounded-full hover:bg-emerald-400 transition-colors">
                        <Send size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIChatbot;

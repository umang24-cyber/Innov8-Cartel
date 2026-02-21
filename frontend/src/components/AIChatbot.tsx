import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, FilePlus, Sparkles, Loader2 } from 'lucide-react';
import type { Claim } from '../types';
import { api } from '../services/api';

interface AIChatbotProps {
    currentClaim: Claim | null;
}

const initialMessages = [
    {
        id: 'init-1',
        sender: 'ai',
        text: 'Hello! I am your AI auditing copilot. Select a claim from the queue, and I can answer questions about its risk profile, SHAP values, and clinical history.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
];

const AIChatbot: React.FC<AIChatbotProps> = ({ currentClaim }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<any[]>(initialMessages);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const toggleChat = () => setIsOpen(!isOpen);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = {
            id: Date.now().toString(),
            sender: 'user',
            text: input,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await api.chat(userMsg.text, currentClaim);

            const aiMsg = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: response.reply,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            const errorMsg = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: "I'm having trouble connecting to the audit servers right now.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={toggleChat}
                className="fixed bottom-8 right-8 p-4 bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-full shadow-lg hover:shadow-teal-500/30 hover:scale-110 transition-all z-50 flex items-center group ring-4 ring-white"
            >
                <Sparkles size={24} className="group-hover:animate-pulse" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-8 right-8 w-[400px] bg-white backdrop-blur-3xl border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-8 duration-300">
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500"></div>
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center border-2 border-white shadow-sm relative">
                        <Bot size={18} className="text-white" />
                        <div className="absolute top-0 -right-0.5 w-2.5 h-2.5 bg-teal-400 rounded-full border-2 border-white shadow-[0_0_5px_#14b8a6]"></div>
                    </div>
                    <div>
                        <h3 className="text-slate-800 font-bold text-sm tracking-wide">AI Auditor</h3>
                        <p className="text-[10px] text-teal-600 uppercase tracking-widest font-black flex items-center mt-0.5">
                            Online
                        </p>
                    </div>
                </div>
                <button onClick={toggleChat} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-200 border border-transparent z-10">
                    <X size={18} />
                </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 h-[350px] overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-teal-200/50 scrollbar-track-transparent bg-slate-50 relative">

                {messages.map((msg, idx) => (
                    <div key={msg.id} className={`flex flex-col relative z-10 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm text-sm ${msg.sender === 'user'
                            ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-tr-sm'
                            : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm font-medium'
                            }`}>
                            <p className="leading-relaxed tracking-wide">{msg.text}</p>
                        </div>

                        {/* Show Add to Case Report button only on AI's latest relevant message */}
                        {msg.sender === 'ai' && idx === messages.length - 1 && idx !== 0 && (
                            <button className="mt-2.5 ml-1 flex items-center text-[11px] text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-full border border-teal-200 transition-all font-bold uppercase tracking-wider shadow-sm">
                                <FilePlus size={12} className="mr-1.5" />
                                Save to File
                            </button>
                        )}

                        <span className="text-[9px] text-slate-400 mt-1.5 px-1 uppercase tracking-widest font-mono font-bold">{msg.timestamp}</span>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex flex-col relative z-10 items-start">
                        <div className="max-w-[85%] rounded-2xl p-3.5 shadow-sm text-sm bg-white border border-slate-200 text-slate-700 rounded-tl-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={currentClaim ? "Ask about Claim " + currentClaim.claim_id : "Select a claim to ask about it..."}
                        disabled={isTyping}
                        className="w-full bg-slate-50 text-slate-800 text-sm rounded-xl pl-4 pr-12 py-3 border border-slate-200 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 shadow-inner transition-all placeholder:text-slate-400 font-medium disabled:opacity-50"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isTyping || !input.trim()}
                        className="absolute right-2 p-2 focus:outline-none bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:shadow-md transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIChatbot;

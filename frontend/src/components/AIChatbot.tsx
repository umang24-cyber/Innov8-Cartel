import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, FilePlus, Sparkles, Loader2, FileText, BarChart3, AlertTriangle, Trash2, Download } from 'lucide-react';
import type { Claim, ChatMessage } from '../types';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { toast } from '../utils/toast';

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
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [streamingText, setStreamingText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const toggleChat = () => setIsOpen(!isOpen);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const simulateStreaming = async (fullText: string, onUpdate: (text: string) => void) => {
        const words = fullText.split(' ');
        let currentText = '';
        for (let i = 0; i < words.length; i++) {
            currentText += (i > 0 ? ' ' : '') + words[i];
            onUpdate(currentText);
            await new Promise(resolve => setTimeout(resolve, 30));
        }
    };

    const handleSend = async (customMessage?: string) => {
        const messageText = customMessage || input.trim();
        if (!messageText) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: 'user',
            text: messageText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        if (!customMessage) setInput('');
        setIsTyping(true);
        setStreamingText('');

        try {
            const response = await api.chat(messageText, currentClaim);
            const fullReply = response.reply;

            // Simulate streaming
            await simulateStreaming(fullReply, (text) => {
                setStreamingText(text);
            });

            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: fullReply,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMsg]);
            setStreamingText('');
        } catch (error) {
            const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: "I'm having trouble connecting to the audit servers right now.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
            setStreamingText('');
        }
    };

    const handleQuickAction = (action: string) => {
        const prompts: Record<string, string> = {
            summary: 'Generate a comprehensive case summary for this claim.',
            compare: 'Compare this claim with similar historical claims.',
            explain: 'Explain all the risk factors for this claim in detail.',
        };
        handleSend(prompts[action] || action);
    };

    const handleClearChat = () => {
        if (confirm('Clear all messages?')) {
            setMessages(initialMessages);
            toast.info('Chat cleared');
        }
    };

    const handleExportReport = () => {
        const report = messages.map(m => `[${m.sender.toUpperCase()}] ${m.timestamp}\n${m.text}\n\n`).join('');
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-audit-report-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Report exported');
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
        <div className="fixed bottom-8 right-8 w-[400px] max-h-[80vh] bg-white dark:bg-slate-800 backdrop-blur-3xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-8 duration-300">
            {/* Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500"></div>
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center border-2 border-white shadow-sm relative">
                        <Bot size={18} className="text-white" />
                        <div className="absolute top-0 -right-0.5 w-2.5 h-2.5 bg-teal-400 rounded-full border-2 border-white shadow-[0_0_5px_#14b8a6] animate-pulse"></div>
                    </div>
                    <div>
                        <h3 className="text-slate-800 dark:text-slate-100 font-bold text-sm tracking-wide">AI Auditor</h3>
                        <p className="text-[10px] text-teal-600 dark:text-teal-400 uppercase tracking-widest font-black flex items-center mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-1.5 animate-pulse"></span>
                            Online • Happy to help!
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportReport}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                        title="Export report"
                    >
                        <Download size={16} />
                    </button>
                    <button
                        onClick={handleClearChat}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                        title="Clear chat"
                    >
                        <Trash2 size={16} />
                    </button>
                    <button onClick={toggleChat} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent z-10">
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Quick Actions */}
            {currentClaim && (
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 overflow-x-auto">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">Quick Actions:</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAction('summary')}
                        disabled={isTyping}
                    >
                        <FileText className="w-3 h-3" />
                        Case Summary
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAction('compare')}
                        disabled={isTyping}
                    >
                        <BarChart3 className="w-3 h-3" />
                        Compare Claims
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAction('explain')}
                        disabled={isTyping}
                    >
                        <AlertTriangle className="w-3 h-3" />
                        Explain Risks
                    </Button>
                </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 h-[350px] overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-teal-200/50 scrollbar-track-transparent bg-slate-50 dark:bg-slate-900 relative">

                {messages.map((msg, idx) => (
                    <div key={msg.id} className={`flex flex-col relative z-10 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm text-sm ${msg.sender === 'user'
                            ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-tr-sm'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-tl-sm font-medium'
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

                {isTyping && streamingText && (
                    <div className="flex flex-col relative z-10 items-start">
                        <div className="max-w-[85%] rounded-2xl p-3.5 shadow-sm text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-tl-sm font-medium">
                            <p className="leading-relaxed tracking-wide">{streamingText}</p>
                            <span className="inline-block w-2 h-4 bg-teal-500 ml-1 animate-pulse"></span>
                        </div>
                    </div>
                )}
                {isTyping && !streamingText && (
                    <div className="flex flex-col relative z-10 items-start">
                        <div className="max-w-[85%] rounded-2xl p-3.5 shadow-sm text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-tl-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={currentClaim ? "Ask about Claim " + currentClaim.claim_id : "Select a claim to ask about it..."}
                        disabled={isTyping}
                        className="w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-xl pl-4 pr-12 py-3 border border-slate-200 dark:border-slate-600 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 shadow-inner transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium disabled:opacity-50"
                    />
                    <button
                        onClick={() => handleSend()}
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

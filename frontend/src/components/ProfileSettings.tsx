import React, { useState } from 'react';
import { X, User, Mail, Lock, Trash2, LogOut, Check, AlertTriangle } from 'lucide-react';
import type { UserProfile } from '../hooks/useAuth';

interface ProfileSettingsProps {
    user: UserProfile;
    onClose: () => void;
    onUpdateProfile: (updates: Partial<Pick<UserProfile, 'username' | 'email' | 'password'>>) => { success: boolean; error?: string };
    onDeleteAccount: () => void;
    onLogout: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
    user,
    onClose,
    onUpdateProfile,
    onDeleteAccount,
    onLogout,
}) => {
    const [username, setUsername] = useState(user.username);
    const [email, setEmail] = useState(user.email);
    const [newPassword, setNewPassword] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSave = (field: string, value: string) => {
        if (!value.trim()) return;
        const updates: any = {};
        if (field === 'username') updates.username = value;
        if (field === 'email') updates.email = value;
        if (field === 'password') {
            if (value.length < 4) {
                setMessage({ type: 'error', text: 'Password must be at least 4 characters.' });
                return;
            }
            updates.password = value;
        }
        const result = onUpdateProfile(updates);
        if (result.success) {
            setMessage({ type: 'success', text: `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully.` });
            if (field === 'password') setNewPassword('');
        } else {
            setMessage({ type: 'error', text: result.error || 'Update failed.' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handleDelete = () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        onDeleteAccount();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9990] animate-[fadeIn_0.2s_ease-out]"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[9991] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-[slideIn_0.3s_ease-out]">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-slate-800 dark:to-slate-800">
                        <div>
                            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Profile Settings</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{user.email}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <X size={18} className="text-slate-500" />
                        </button>
                    </div>

                    {/* Status message */}
                    {message && (
                        <div className={`mx-6 mt-4 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-[slideIn_0.2s_ease-out] ${message.type === 'success'
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700'
                                : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-700'
                            }`}>
                            {message.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
                            {message.text}
                        </div>
                    )}

                    {/* Form fields */}
                    <div className="p-6 space-y-5">
                        {/* Username */}
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Display Name</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => handleSave('username', username)}
                                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                                >
                                    Save
                                </button>
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Email Address</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => handleSave('email', email)}
                                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                                >
                                    Save
                                </button>
                            </div>
                        </div>

                        {/* Change Password */}
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">New Password</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => handleSave('password', newPassword)}
                                    disabled={!newPassword}
                                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Danger zone */}
                    <div className="px-6 pb-6 pt-2 space-y-3 border-t border-slate-200 dark:border-slate-700 mt-2">
                        <div className="flex gap-3">
                            <button
                                onClick={onLogout}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                            >
                                <LogOut size={16} />
                                Log Out
                            </button>
                            <button
                                onClick={handleDelete}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${confirmDelete
                                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30 hover:bg-rose-700'
                                        : 'border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                                    }`}
                            >
                                <Trash2 size={16} />
                                {confirmDelete ? 'Confirm Delete' : 'Delete Account'}
                            </button>
                        </div>
                        {confirmDelete && (
                            <p className="text-xs text-rose-500 text-center font-medium animate-[slideIn_0.2s_ease-out]">
                                Click again to permanently delete your account and all data.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

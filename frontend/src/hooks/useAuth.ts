import { useState, useCallback } from 'react';

export interface UserProfile {
    email: string;
    username: string;
    password: string;
}

interface AuthState {
    user: UserProfile | null;
    isAuthenticated: boolean;
}

const USERS_KEY = 'vericlaim_users';
const SESSION_KEY = 'vericlaim_authenticated';
const CURRENT_USER_KEY = 'vericlaim_current_user';

function getStoredUsers(): UserProfile[] {
    try {
        const raw = localStorage.getItem(USERS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveUsers(users: UserProfile[]) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser(): UserProfile | null {
    try {
        const raw = sessionStorage.getItem(CURRENT_USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>(() => {
        const isAuth = !!sessionStorage.getItem(SESSION_KEY);
        const user = getCurrentUser();
        return { user: isAuth ? user : null, isAuthenticated: isAuth && !!user };
    });

    const signUp = useCallback((email: string, password: string): { success: boolean; error?: string } => {
        const users = getStoredUsers();
        const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (exists) {
            return { success: false, error: 'An account with this email already exists.' };
        }
        const username = email.split('@')[0];
        const newUser: UserProfile = { email, username, password };
        users.push(newUser);
        saveUsers(users);
        // Auto-login after signup
        sessionStorage.setItem(SESSION_KEY, 'true');
        sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
        setAuthState({ user: newUser, isAuthenticated: true });
        return { success: true };
    }, []);

    const login = useCallback((email: string, password: string): { success: boolean; error?: string } => {
        const users = getStoredUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
            return { success: false, error: 'No account found with this email. Please sign up first.' };
        }
        if (user.password !== password) {
            return { success: false, error: 'Incorrect password. Please try again.' };
        }
        sessionStorage.setItem(SESSION_KEY, 'true');
        sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        setAuthState({ user, isAuthenticated: true });
        return { success: true };
    }, []);

    const logout = useCallback(() => {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(CURRENT_USER_KEY);
        sessionStorage.removeItem('vericlaim_prologue_seen');
        setAuthState({ user: null, isAuthenticated: false });
    }, []);

    const updateProfile = useCallback((updates: Partial<Pick<UserProfile, 'username' | 'email' | 'password'>>) => {
        if (!authState.user) return { success: false, error: 'Not authenticated.' };

        const users = getStoredUsers();
        const idx = users.findIndex(u => u.email.toLowerCase() === authState.user!.email.toLowerCase());
        if (idx === -1) return { success: false, error: 'User not found.' };

        // If changing email, check for conflicts
        if (updates.email && updates.email.toLowerCase() !== authState.user.email.toLowerCase()) {
            const conflict = users.find(u => u.email.toLowerCase() === updates.email!.toLowerCase());
            if (conflict) return { success: false, error: 'Email already in use.' };
        }

        const updated = { ...users[idx], ...updates };
        users[idx] = updated;
        saveUsers(users);
        sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
        setAuthState({ user: updated, isAuthenticated: true });
        return { success: true };
    }, [authState.user]);

    const deleteAccount = useCallback(() => {
        if (!authState.user) return;
        const users = getStoredUsers().filter(u => u.email.toLowerCase() !== authState.user!.email.toLowerCase());
        saveUsers(users);
        // Clean up user-specific data
        localStorage.removeItem(`vericlaim_cases_${authState.user.email}`);
        logout();
    }, [authState.user, logout]);

    return {
        user: authState.user,
        isAuthenticated: authState.isAuthenticated,
        signUp,
        login,
        logout,
        updateProfile,
        deleteAccount,
    };
}

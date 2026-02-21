import React from 'react';
import ReactDOM from 'react-dom/client';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

class ToastManager {
  private toasts: Toast[] = [];
  private listeners: Set<() => void> = new Set();
  private container: HTMLElement | null = null;
  private root: ReactDOM.Root | null = null;

  init() {
    if (typeof document === 'undefined') return;
    
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2';
    document.body.appendChild(this.container);
    
    this.root = ReactDOM.createRoot(this.container);
    this.render();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
    this.render();
  }

  private render() {
    if (!this.root || !this.container) return;
    
    this.root.render(
      <div className="flex flex-col gap-2">
        {this.toasts.map(toast => (
          <div
            key={toast.id}
            className={`min-w-[320px] max-w-md px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md animate-in slide-in-from-right ${
              toast.type === 'success' ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800' :
              toast.type === 'error' ? 'bg-rose-50/90 border-rose-200 text-rose-800' :
              toast.type === 'warning' ? 'bg-amber-50/90 border-amber-200 text-amber-800' :
              'bg-blue-50/90 border-blue-200 text-blue-800'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">{toast.message}</p>
              <button
                onClick={() => this.remove(toast.id)}
                className="text-current opacity-60 hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  show(message: string, type: ToastType = 'info', duration = 5000) {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = { id, message, type, duration };
    
    this.toasts.push(toast);
    this.notify();

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }

  success(message: string, duration?: number) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number) {
    this.show(message, 'error', duration);
  }

  info(message: string, duration?: number) {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration?: number) {
    this.show(message, 'warning', duration);
  }
}

export const toast = new ToastManager();

// Initialize on import
if (typeof window !== 'undefined') {
  toast.init();
}


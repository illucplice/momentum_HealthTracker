import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2 } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'info';
}

let toastFn: ((message: string, type?: 'success' | 'info') => void) | null = null;

export function showToast(message: string, type: 'success' | 'info' = 'success') {
  toastFn?.(message, type);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    toastFn = (message: string, type: 'success' | 'info' = 'success') => {
      const id = Math.random().toString(36).slice(2);
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 2500);
    };
    return () => { toastFn = null; };
  }, []);

  return createPortal(
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="glass rounded-xl px-4 py-3 flex items-center gap-2.5 shadow-xl animate-slide-up pointer-events-auto"
        >
          {t.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
          <span className="text-sm text-zinc-200">{t.message}</span>
        </div>
      ))}
    </div>,
    document.body,
  );
}

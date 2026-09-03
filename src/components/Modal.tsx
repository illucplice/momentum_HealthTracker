import { createContext, useContext, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null;

  const maxWidth = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-3xl' : 'max-w-xl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto glass rounded-2xl shadow-2xl animate-scale-in`}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-subtle glass rounded-t-2xl">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}

interface ConfirmContextValue {
  confirm: (opts: { title: string; message: string; confirmText?: string; onConfirm: () => void }) => void;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<{ title: string; message: string; confirmText: string; onConfirm: () => void } | null>(null);

  const confirm = (o: { title: string; message: string; confirmText?: string; onConfirm: () => void }) => {
    setOpts({ title: o.title, message: o.message, confirmText: o.confirmText || 'Confirm', onConfirm: o.onConfirm });
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Modal open={!!opts} onClose={() => setOpts(null)} title={opts?.title || ''} size="sm">
        <p className="text-zinc-400 text-sm mb-6">{opts?.message}</p>
        <div className="flex justify-end gap-3">
          <button className="btn-ghost" onClick={() => setOpts(null)}>Cancel</button>
          <button
            className="btn-primary !bg-rose-600 hover:!bg-rose-500"
            onClick={() => { opts?.onConfirm(); setOpts(null); }}
          >
            {opts?.confirmText}
          </button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

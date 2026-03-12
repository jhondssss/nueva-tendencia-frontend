import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen:          boolean;
    onClose:         () => void;
    onConfirm:       () => void;
    title?:          string;
    message:         string;
    warningMessage?: string;
}

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title   = '¿Eliminar registro?',
    message,
    warningMessage,
}: ConfirmDialogProps) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => { onConfirm(); onClose(); };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-panel w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-6 space-y-5">

                    {/* Icono + texto */}
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-800/50
                                        flex items-center justify-center flex-shrink-0">
                            <AlertTriangle size={18} className="text-red-400" />
                        </div>
                        <div>
                            <h2 className="font-display text-base font-semibold text-cream">{title}</h2>
                            <p className="text-sm text-ink-100 mt-1 leading-relaxed">{message}</p>
                        </div>
                    </div>

                    {/* Advertencia opcional */}
                    {warningMessage && (
                        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-600/40 px-3 py-2.5">
                            <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-300 leading-relaxed">{warningMessage}</p>
                        </div>
                    )}

                    {/* Acciones */}
                    <div className="flex justify-end gap-2 pt-1 border-t border-ink-600">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="px-4 py-2 text-sm font-medium rounded-lg
                                       bg-red-700 hover:bg-red-600 active:bg-red-800
                                       text-white border border-red-600/80 transition-colors">
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useEffect } from 'react';
import { AlertTriangle, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
    isOpen:          boolean;
    onClose:         () => void;
    onConfirm:       () => void;
    title?:          string;
    message:         string;
    warningMessage?: string;
    confirmLabel?:   string;
    confirmVariant?: 'destructive' | 'default';
    icon?:           LucideIcon;
}

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title   = '¿Eliminar registro?',
    message,
    warningMessage,
    confirmLabel   = 'Eliminar',
    confirmVariant = 'destructive',
    icon: Icon      = AlertTriangle,
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

    const isDestructive = confirmVariant === 'destructive';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-panel w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-6 space-y-5">

                    {/* Icono + texto */}
                    <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            isDestructive
                                ? 'bg-destructive/10 border-destructive/30'
                                : 'bg-primary/10 border-primary/30'
                        }`}>
                            <Icon size={18} className={isDestructive ? 'text-destructive' : 'text-primary'} />
                        </div>
                        <div>
                            <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{message}</p>
                        </div>
                    </div>

                    {/* Advertencia opcional */}
                    {warningMessage && (
                        <div className="flex items-start gap-2 rounded-lg bg-chart-3/10 border border-chart-3/30 px-3 py-2.5">
                            <AlertTriangle size={14} className="text-chart-3 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-chart-3 leading-relaxed">{warningMessage}</p>
                        </div>
                    )}

                    {/* Acciones */}
                    <div className="flex justify-end gap-2 pt-1 border-t border-border">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="button" variant={confirmVariant} onClick={handleConfirm}>
                            {confirmLabel}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

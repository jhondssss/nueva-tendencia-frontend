import { useState, useEffect } from 'react';
import { Loader2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import type { SolicitudPedido } from '@/types';

interface Props {
    isOpen:    boolean;
    onClose:   () => void;
    onConfirm: (id: number, motivo: string) => Promise<void>;
    solicitud: SolicitudPedido | null;
}

export default function RechazarSolicitudModal({ isOpen, onClose, onConfirm, solicitud }: Props) {
    const [motivo, setMotivo]     = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setMotivo('');
    }, [isOpen]);

    if (!solicitud) return null;

    const handleConfirm = async () => {
        if (!motivo.trim()) { toast.error('Indica el motivo del rechazo'); return; }
        setSubmitting(true);
        try {
            await onConfirm(solicitud.id_solicitud, motivo.trim());
            onClose();
        } finally { setSubmitting(false); }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}
               title="Rechazar solicitud"
               subtitle={`Solicitud #${solicitud.id_solicitud} — ${solicitud.cliente.nombre} ${solicitud.cliente.apellido ?? ''}`}
               size="sm">
            <div className="space-y-4">
                <div>
                    <label className="label">Motivo del rechazo *</label>
                    <textarea
                        value={motivo}
                        onChange={e => setMotivo(e.target.value)}
                        rows={3}
                        placeholder="Explica por qué se rechaza esta solicitud..."
                        className="input h-auto resize-none"
                        autoFocus
                    />
                    <p className="text-2xs text-muted-foreground mt-1">Se enviará este motivo al cliente por correo.</p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="button" variant="destructive" disabled={submitting} onClick={handleConfirm}>
                        {submitting
                            ? <><Loader2 size={14} className="animate-spin" /> Rechazando...</>
                            : <><XCircle size={14} /> Rechazar solicitud</>}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

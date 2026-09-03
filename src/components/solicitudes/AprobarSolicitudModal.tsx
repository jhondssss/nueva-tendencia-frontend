import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, CheckCircle2, PartyPopper } from 'lucide-react';
import type { Resolver } from 'react-hook-form';
import Modal from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import TipoCueroSelect from '@/components/shared/TipoCueroSelect';
import TallaInfoBox, { CATEGORIA_INFO } from '@/components/pedidos/TallaInfoBox';
import type { SolicitudPedido, AprobarSolicitudDto, Insumo } from '@/types';

const schema = z.object({
    total:         z.number({ error: 'Ingresa el total' }).positive('Debe ser mayor a 0'),
    fecha_entrega: z.string()
                    .min(1, 'Selecciona una fecha')
                    .refine(
                        val => new Date(val + 'T12:00:00') >= new Date(new Date().toDateString()),
                        'La fecha de entrega no puede ser en el pasado',
                    ),
    cuero_insumo_id: z.number().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
    isOpen:    boolean;
    onClose:   () => void;
    onConfirm: (id: number, dto: AprobarSolicitudDto) => Promise<SolicitudPedido>;
    solicitud: SolicitudPedido | null;
    insumos:   Insumo[];
}

export default function AprobarSolicitudModal({ isOpen, onClose, onConfirm, solicitud, insumos }: Props) {
    const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as Resolver<FormData>,
    });
    const [pedidoGenerado, setPedidoGenerado] = useState<number | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        reset();
        // eslint-disable-next-line react-hooks/set-state-in-effect -- resetea el estado de éxito al reabrir el modal
        setPedidoGenerado(null);
    }, [isOpen, reset]);

    if (!solicitud) return null;

    const handleClose = () => { onClose(); reset(); setPedidoGenerado(null); };

    const onFormSubmit = async (data: FormData) => {
        const actualizada = await onConfirm(solicitud.id_solicitud, {
            total: data.total,
            fecha_entrega: data.fecha_entrega,
            cuero_insumo_id: data.cuero_insumo_id,
        });
        setPedidoGenerado(actualizada.pedido_creado?.id_pedido ?? null);
    };

    if (pedidoGenerado) {
        return (
            <Modal isOpen={isOpen} onClose={handleClose} title="Solicitud aprobada" size="sm">
                <div className="flex flex-col items-center text-center gap-3 py-4">
                    <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                        <PartyPopper size={26} className="text-secondary-foreground" />
                    </div>
                    <div>
                        <p className="text-foreground font-semibold">Se generó el pedido #{pedidoGenerado}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            El cliente fue notificado por correo y ya puede ver el pedido en su portal.
                        </p>
                    </div>
                    <Button onClick={handleClose} className="mt-2">Cerrar</Button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose}
               title="Aprobar solicitud"
               subtitle={`Solicitud #${solicitud.id_solicitud} — ${solicitud.cliente.nombre} ${solicitud.cliente.apellido ?? ''}`}
               size="md">
            <div className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                    <p className="text-sm font-semibold text-foreground">{solicitud.producto?.nombre_modelo}</p>
                    <p className="text-xs text-muted-foreground">
                        {CATEGORIA_INFO[solicitud.categoria].label} — {solicitud.cantidad_pares} pares
                    </p>
                </div>

                <TallaInfoBox categoria={solicitud.categoria} value={solicitud.tallas} />

                {solicitud.comentario_cliente && (
                    <p className="text-xs text-muted-foreground italic">&ldquo;{solicitud.comentario_cliente}&rdquo;</p>
                )}

                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Total (Bs.) *</label>
                            <input type="number" step="0.01"
                                   {...register('total', { valueAsNumber: true })}
                                   placeholder="0.00"
                                   className={`input ${errors.total ? 'input-error' : ''}`} />
                            {errors.total && <p className="text-destructive text-xs mt-1">{errors.total.message}</p>}
                        </div>
                        <div>
                            <label className="label">Fecha de entrega *</label>
                            <input type="date" {...register('fecha_entrega')}
                                   defaultValue={solicitud.fecha_entrega_deseada ?? undefined}
                                   className={`input ${errors.fecha_entrega ? 'input-error' : ''}`} />
                            {errors.fecha_entrega && <p className="text-destructive text-xs mt-1">{errors.fecha_entrega.message}</p>}
                        </div>
                    </div>

                    <TipoCueroSelect
                        insumos={insumos}
                        value={watch('cuero_insumo_id')}
                        onChange={id => setValue('cuero_insumo_id', id, { shouldValidate: true })} />

                    <div className="flex justify-end gap-2 pt-2 border-t border-border">
                        <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting
                                ? <><Loader2 size={14} className="animate-spin" /> Aprobando...</>
                                : <><CheckCircle2 size={14} /> Aprobar y generar pedido</>}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}

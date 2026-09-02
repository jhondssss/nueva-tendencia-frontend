import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Resolver } from 'react-hook-form';
import Modal from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import StarRating from '@/components/shared/StarRating';
import TallaInfoBox, { defaultTallas } from './TallaInfoBox';
import type { TallaItem } from './TallaInfoBox';
import type { Pedido, Cliente, Producto, Insumo, CategoriaCalzado, UnidadPedido, CreatePedidoDto } from '@/types';

function formatFechaCalificacion(fechaIso: string): string {
    return new Date(fechaIso).toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' });
}

const schema = z.object({
    cliente_id:    z.number({ error: 'Selecciona un cliente' }).min(1, 'Selecciona un cliente'),
    producto_id:   z.number({ error: 'Selecciona un producto' }).min(1, 'Selecciona un producto'),
    cantidad:      z.number({ error: 'Ingresa una cantidad' }).int('Debe ser un número entero').min(1, 'Mínimo 1'),
    unidad:        z.enum(['docena', 'media_docena', 'par']),
    total:         z.number().positive('Debe ser mayor a 0'),
    fecha_entrega: z.string()
                    .min(1, 'Selecciona una fecha')
                    .refine(
                        val => new Date(val + 'T12:00:00') >= new Date(new Date().toDateString()),
                        'La fecha de entrega no puede ser en el pasado',
                    ),
    categoria:     z.enum(['nino', 'juvenil', 'adulto']).optional(),
    cuero_insumo_id: z.number().optional(),
});

export type PedidoFormData = z.infer<typeof schema>;

const DEFAULT_VALUES: Partial<PedidoFormData> = { cantidad: 1, unidad: 'par', categoria: undefined };

function buildDefaultValues(pedido: Pedido | null | undefined): Partial<PedidoFormData> {
    if (!pedido) return DEFAULT_VALUES;
    return {
        cliente_id:    pedido.cliente.id_cliente,
        producto_id:   pedido.producto?.id_producto ?? 0,
        cantidad:      pedido.cantidad ?? 1,
        unidad:        pedido.unidad   ?? 'par',
        total:         Number(pedido.total),
        fecha_entrega: pedido.fecha_entrega.split('T')[0],
        categoria:     pedido.categoria,
        cuero_insumo_id: pedido.cuero_insumo_id ?? undefined,
    };
}

function buildInitialTallas(pedido: Pedido | null | undefined): TallaItem[] | null {
    if (!pedido?.talles?.length || !pedido.categoria) return null;
    return pedido.talles.map(t => ({ talla: t.talla, cantidad_pares: t.cantidad_pares }));
}

const PARES: Record<UnidadPedido, number> = { docena: 12, media_docena: 6, par: 1 };

interface Props {
    isOpen:    boolean;
    onClose:   () => void;
    onSubmit:  (data: CreatePedidoDto) => Promise<void>;
    pedido?:   Pedido | null;
    clientes:  Cliente[];
    productos: Producto[];
    insumos:   Insumo[];
}

export default function PedidoModal({ isOpen, onClose, onSubmit, pedido, clientes, productos, insumos }: Props) {
    const isEditing = !!pedido;

    // defaultValues se inicializa desde pedido en el primer render.
    // El key={id ?? 'nuevo'} en el padre garantiza remount completo al cambiar
    // de pedido, por lo que defaultValues siempre refleja el pedido correcto.
    const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<PedidoFormData>({
        resolver: zodResolver(schema) as Resolver<PedidoFormData>,
        defaultValues: buildDefaultValues(pedido),
    });

    const cantidad  = watch('cantidad')  ?? 1;
    const unidad    = watch('unidad')    ?? 'par';
    const categoria = watch('categoria');

    // Lazy initializer — corre una sola vez en el mount, no en cada render
    const [tallasPersonalizadas, setTallasPersonalizadas] = useState<TallaItem[] | null>(
        () => buildInitialTallas(pedido)
    );

    // Cuando el mismo pedido se edita dos veces (misma key, sin remount),
    // isOpen pasa de false→true y necesitamos restaurar sus valores.
    useEffect(() => {
        if (!isOpen) return;
        reset(buildDefaultValues(pedido));
        setTallasPersonalizadas(buildInitialTallas(pedido));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleCategoriaChange = (val: CategoriaCalzado | '') => {
        setValue('categoria', val || undefined);
        // Resetear tallas al cambiar categoría
        setTallasPersonalizadas(null);
        if (val) setValue('unidad', 'docena', { shouldValidate: true });
    };

    const handleClose = () => { onClose(); reset(DEFAULT_VALUES); setTallasPersonalizadas(null); };

    const onFormSubmit = async (data: PedidoFormData) => {
        if (tallasPersonalizadas && data.categoria) {
            const sumTallas = tallasPersonalizadas.reduce((s, t) => s + t.cantidad_pares, 0);
            if (sumTallas !== 12) {
                toast.error(`La suma de tallas debe ser 12 pares por docena (actual: ${sumTallas})`);
                return;
            }
        }
        const dto: CreatePedidoDto = { ...data, cuero_insumo_id: data.cuero_insumo_id ?? null } as CreatePedidoDto;
        // Incluir tallas personalizadas solo si difieren del estándar
        if (tallasPersonalizadas && data.categoria) {
            const std = defaultTallas(data.categoria);
            const difiere = tallasPersonalizadas.some(t => {
                const s = std.find(d => d.talla === t.talla);
                return !s || s.cantidad_pares !== t.cantidad_pares;
            });
            if (difiere) dto.tallas_personalizadas = tallasPersonalizadas;
        }
        await onSubmit(dto);
        handleClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose}
               title={isEditing ? 'Editar Pedido' : 'Nuevo Pedido'}
               subtitle={isEditing ? `Pedido #${pedido!.id_pedido}` : 'Registra una nueva orden de producción'}
               size="md">
            <div className="space-y-4">

                {pedido?.calificacion && (
                    <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1.5">
                        <div className="flex items-center gap-2">
                            <Star size={14} className="text-muted-foreground" />
                            <p className="label mb-0">Calificación del cliente</p>
                        </div>
                        <StarRating value={pedido.calificacion.puntuacion} readOnly size={16} />
                        {pedido.calificacion.comentario && (
                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                                &ldquo;{pedido.calificacion.comentario}&rdquo;
                            </p>
                        )}
                        <p className="text-2xs text-muted-foreground">
                            Calificado el {formatFechaCalificacion(pedido.calificacion.fecha_creacion)}
                        </p>
                    </div>
                )}

            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">

                <div>
                    <label className="label">Cliente *</label>
                    <select className={`select ${errors.cliente_id ? 'input-error' : ''}`}
                            value={watch('cliente_id') ?? ''}
                            onChange={e => setValue('cliente_id', Number(e.target.value), { shouldValidate: true })}>
                        <option value="" disabled>Selecciona un cliente</option>
                        {clientes.map(c => (
                            <option key={c.id_cliente} value={c.id_cliente}>
                                {c.nombre} {c.apellido}
                            </option>
                        ))}
                    </select>
                    {errors.cliente_id && <p className="text-destructive text-xs mt-1">{errors.cliente_id.message}</p>}
                </div>

                <div>
                    <label className="label">Producto *</label>
                    <select className={`select ${errors.producto_id ? 'input-error' : ''}`}
                            value={watch('producto_id') ?? ''}
                            onChange={e => setValue('producto_id', Number(e.target.value), { shouldValidate: true })}>
                        <option value="" disabled>Selecciona un producto</option>
                        {productos.map(p => (
                            <option key={p.id_producto} value={p.id_producto}>
                                {p.nombre_modelo} — {p.marca}
                            </option>
                        ))}
                    </select>
                    {errors.producto_id && <p className="text-destructive text-xs mt-1">{errors.producto_id.message}</p>}
                </div>

                <div>
                    <label className="label">Tipo de Cuero</label>
                    <select className="select"
                            value={watch('cuero_insumo_id') ?? ''}
                            onChange={e => setValue('cuero_insumo_id', e.target.value ? Number(e.target.value) : undefined, { shouldValidate: true })}>
                        <option value="">Sin especificar</option>
                        {insumos.map(i => (
                            <option key={i.id_insumo} value={i.id_insumo}>
                                {i.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="label">Categoría de tallas</label>
                    <select className="select"
                            value={categoria ?? ''}
                            onChange={e => handleCategoriaChange(e.target.value as CategoriaCalzado | '')}>
                        <option value="">Sin categoría</option>
                        <option value="nino">Niño (Tallas 27–32)</option>
                        <option value="juvenil">Juvenil (Tallas 33–36)</option>
                        <option value="adulto">Adulto (Tallas 37–42)</option>
                    </select>
                </div>

                {categoria && (
                    <TallaInfoBox
                        categoria={categoria}
                        editable
                        value={tallasPersonalizadas ?? undefined}
                        onChange={setTallasPersonalizadas}
                        cantidad={unidad === 'docena' ? (cantidad || 1) : 1}
                    />
                )}

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="label">Cantidad *</label>
                        <input type="number" min={1}
                               {...register('cantidad', { valueAsNumber: true })}
                               placeholder="1"
                               className={`input ${errors.cantidad ? 'input-error' : ''}`} />
                        {errors.cantidad && <p className="text-destructive text-xs mt-1">{errors.cantidad.message}</p>}
                    </div>
                    <div>
                        <label className="label">Unidad *</label>
                        <select value={unidad}
                                onChange={e => setValue('unidad', e.target.value as UnidadPedido, { shouldValidate: true })}
                                className="select">
                            <option value="docena">Docena (12 pares)</option>
                            <option value="media_docena">Media Docena (6 pares)</option>
                            <option value="par">Par</option>
                        </select>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground -mt-2">
                    = <span className="font-mono text-primary font-medium">{(cantidad || 1) * PARES[unidad]} pares</span> en total
                </p>

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
                               className={`input ${errors.fecha_entrega ? 'input-error' : ''}`} />
                        {errors.fecha_entrega && <p className="text-destructive text-xs mt-1">{errors.fecha_entrega.message}</p>}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting} className="hover:scale-[1.02] transition-transform">
                        {isSubmitting
                            ? <><Loader2 size={14} className="animate-spin" /> {isEditing ? 'Guardando...' : 'Creando...'}</>
                            : isEditing ? 'Guardar cambios' : 'Crear pedido'}
                    </Button>
                </div>
            </form>
            </div>
        </Modal>
    );
}

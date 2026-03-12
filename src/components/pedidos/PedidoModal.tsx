import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import type { Resolver } from 'react-hook-form';
import Modal from '@/components/shared/Modal';
import TallaInfoBox, { defaultTallas } from './TallaInfoBox';
import type { TallaItem } from './TallaInfoBox';
import type { Pedido, Cliente, Producto, CategoriaCalzado, UnidadPedido, CreatePedidoDto } from '@/types';

const schema = z.object({
    clienteId:     z.number({ error: 'Selecciona un cliente' }),
    productoId:    z.number({ error: 'Selecciona un producto' }),
    cantidad:      z.number({ error: 'Ingresa una cantidad' }).int('Debe ser un número entero').min(1, 'Mínimo 1'),
    unidad:        z.enum(['docena', 'media_docena', 'par']),
    total:         z.number().positive('Debe ser mayor a 0'),
    fecha_entrega: z.string().min(1, 'Selecciona una fecha'),
    categoria:     z.enum(['nino', 'juvenil', 'adulto']).optional(),
});

export type PedidoFormData = z.infer<typeof schema>;

const DEFAULT_VALUES: Partial<PedidoFormData> = { cantidad: 1, unidad: 'par', categoria: undefined };

function buildDefaultValues(pedido: Pedido | null | undefined): Partial<PedidoFormData> {
    if (!pedido) return DEFAULT_VALUES;
    return {
        clienteId:     pedido.cliente.id_cliente,
        productoId:    pedido.producto?.id_producto ?? 0,
        cantidad:      pedido.cantidad ?? 1,
        unidad:        pedido.unidad   ?? 'par',
        total:         Number(pedido.total),
        fecha_entrega: pedido.fecha_entrega.split('T')[0],
        categoria:     pedido.categoria,
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
}

export default function PedidoModal({ isOpen, onClose, onSubmit, pedido, clientes, productos }: Props) {
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

    const handleCategoriaChange = (val: CategoriaCalzado | '') => {
        setValue('categoria', val || undefined);
        // Resetear tallas al cambiar categoría
        setTallasPersonalizadas(null);
        if (val) setValue('unidad', 'docena', { shouldValidate: true });
    };

    const handleClose = () => { onClose(); reset(DEFAULT_VALUES); setTallasPersonalizadas(null); };

    const onFormSubmit = async (data: PedidoFormData) => {
        const dto: CreatePedidoDto = { ...data } as CreatePedidoDto;
        // Incluir tallas personalizadas solo si difieren del estándar
        if (tallasPersonalizadas && data.categoria) {
            const std = defaultTallas(data.categoria);
            const difiere = tallasPersonalizadas.some(t => {
                const s = std.find(d => d.talla === t.talla);
                return !s || s.cantidad_pares !== t.cantidad_pares;
            });
            if (difiere) dto.tallas_personalizadas = tallasPersonalizadas;
        }
        console.log('1. MODAL SUBMIT:', JSON.stringify(dto));
        await onSubmit(dto);
        handleClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose}
               title={isEditing ? 'Editar Pedido' : 'Nuevo Pedido'}
               subtitle={isEditing ? `Pedido #${pedido!.id_pedido}` : 'Registra una nueva orden de producción'}
               size="md">
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">

                <div>
                    <label className="label">Cliente *</label>
                    <select className={`select ${errors.clienteId ? 'input-error' : ''}`}
                            value={watch('clienteId') ?? ''}
                            onChange={e => setValue('clienteId', Number(e.target.value), { shouldValidate: true })}>
                        <option value="" disabled>Selecciona un cliente</option>
                        {clientes.map(c => (
                            <option key={c.id_cliente} value={c.id_cliente}>
                                {c.nombre} {c.apellido}
                            </option>
                        ))}
                    </select>
                    {errors.clienteId && <p className="text-red-400 text-xs mt-1">{errors.clienteId.message}</p>}
                </div>

                <div>
                    <label className="label">Producto *</label>
                    <select className={`select ${errors.productoId ? 'input-error' : ''}`}
                            value={watch('productoId') ?? ''}
                            onChange={e => setValue('productoId', Number(e.target.value), { shouldValidate: true })}>
                        <option value="" disabled>Selecciona un producto</option>
                        {productos.map(p => (
                            <option key={p.id_producto} value={p.id_producto}>
                                {p.nombre_modelo} — {p.marca}
                            </option>
                        ))}
                    </select>
                    {errors.productoId && <p className="text-red-400 text-xs mt-1">{errors.productoId.message}</p>}
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
                        {errors.cantidad && <p className="text-red-400 text-xs mt-1">{errors.cantidad.message}</p>}
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
                <p className="text-xs text-ink-200 -mt-2">
                    = <span className="font-mono text-amber-400">{(cantidad || 1) * PARES[unidad]} pares</span> en total
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="label">Total (Bs.) *</label>
                        <input type="number" step="0.01"
                               {...register('total', { valueAsNumber: true })}
                               placeholder="0.00"
                               className={`input ${errors.total ? 'input-error' : ''}`} />
                        {errors.total && <p className="text-red-400 text-xs mt-1">{errors.total.message}</p>}
                    </div>
                    <div>
                        <label className="label">Fecha de entrega *</label>
                        <input type="date" {...register('fecha_entrega')}
                               className={`input ${errors.fecha_entrega ? 'input-error' : ''}`} />
                        {errors.fecha_entrega && <p className="text-red-400 text-xs mt-1">{errors.fecha_entrega.message}</p>}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-ink-600">
                    <button type="button" onClick={handleClose} className="btn-secondary">Cancelar</button>
                    <button type="submit" disabled={isSubmitting} className="btn-primary">
                        {isSubmitting
                            ? <><Loader2 size={14} className="animate-spin" /> {isEditing ? 'Guardando...' : 'Creando...'}</>
                            : isEditing ? 'Guardar cambios' : 'Crear pedido'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

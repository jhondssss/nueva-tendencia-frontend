import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ShoppingBag, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Resolver } from 'react-hook-form';
import { useCatalogoStore, useMisSolicitudesStore } from '@/stores/index';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EmptyState from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/shared/Skeleton';
import TallaInfoBox, { defaultTallas, CATEGORIA_INFO } from '@/components/pedidos/TallaInfoBox';
import type { TallaItem } from '@/components/pedidos/TallaInfoBox';
import type { ProductoCatalogo } from '@/types';

function formatPrecio(precio: string) {
    return `Bs. ${Number(precio).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const schema = z.object({
    producto_id:            z.number({ error: 'Selecciona un producto' }).min(1, 'Selecciona un producto'),
    fecha_entrega_deseada:  z.string().optional(),
    comentario_cliente:     z.string().max(500, 'Máximo 500 caracteres').optional(),
});

type FormData = z.infer<typeof schema>;

const hoy = new Date().toISOString().split('T')[0];

export default function SolicitarPedidoView() {
    const navigate = useNavigate();

    const productos      = useCatalogoStore(s => s.productos);
    const catalogoLoading = useCatalogoStore(s => s.isLoading);
    const fetchCatalogo  = useCatalogoStore(s => s.fetchAll);
    const crearSolicitud = useMisSolicitudesStore(s => s.create);

    useEffect(() => { fetchCatalogo(); }, [fetchCatalogo]);

    const [seleccionado, setSeleccionado] = useState<ProductoCatalogo | null>(null);
    const [tallas, setTallas] = useState<TallaItem[] | null>(null);

    const { handleSubmit, setValue, register, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as Resolver<FormData>,
        defaultValues: { producto_id: 0 },
    });

    const handleSelect = (producto: ProductoCatalogo) => {
        setSeleccionado(producto);
        setValue('producto_id', producto.id_producto, { shouldValidate: true });
        setTallas(defaultTallas(producto.categoria));
    };

    const onFormSubmit = async (data: FormData) => {
        if (!seleccionado) return;
        const tallasValidas = (tallas ?? []).filter(t => t.cantidad_pares > 0);
        if (tallasValidas.length === 0) {
            toast.error('Indica al menos un par en alguna talla');
            return;
        }
        await crearSolicitud({
            producto_id: seleccionado.id_producto,
            categoria: seleccionado.categoria,
            tallas: tallasValidas,
            comentario_cliente: data.comentario_cliente || undefined,
            fecha_entrega_deseada: data.fecha_entrega_deseada || undefined,
        });
        reset();
        setSeleccionado(null);
        setTallas(null);
        navigate('/mis-solicitudes');
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-2xl font-semibold text-foreground">Solicitar pedido nuevo</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Elige un modelo del catálogo y arma tu pedido. Revisaremos tu solicitud y te avisaremos por correo.
                </p>
            </div>

            <div className="space-y-3">
                <p className="label mb-0">1. Elige un producto</p>

                {catalogoLoading && productos.length === 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Card key={i} className="border-border/50 bg-card/50 backdrop-blur overflow-hidden">
                                <Skeleton className="h-32 w-full rounded-none" />
                                <CardContent className="p-3 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {!catalogoLoading && productos.length === 0 && (
                    <EmptyState
                        icon={ShoppingBag}
                        title="Aún no hay productos en el catálogo"
                        description="Vuelve más tarde para poder armar tu solicitud de pedido."
                    />
                )}

                {productos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {productos.map((producto, i) => {
                            const isSelected = seleccionado?.id_producto === producto.id_producto;
                            return (
                                <Card
                                    key={`${producto.id_producto}-${i}`}
                                    onClick={() => handleSelect(producto)}
                                    className={`relative border-border/50 bg-card/50 backdrop-blur overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md ${
                                        isSelected ? 'ring-2 ring-primary border-primary/50' : ''
                                    }`}
                                >
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground rounded-full p-0.5">
                                            <CheckCircle2 size={16} />
                                        </div>
                                    )}
                                    <div className="relative h-28 w-full bg-muted flex items-center justify-center">
                                        {producto.imagen ? (
                                            <img src={producto.imagen} alt={producto.nombre} className="h-full w-full object-cover" />
                                        ) : (
                                            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                                        )}
                                    </div>
                                    <CardContent className="p-3 space-y-1">
                                        <p className="text-foreground font-semibold text-sm leading-tight truncate">{producto.nombre}</p>
                                        <p className="text-2xs text-muted-foreground">{CATEGORIA_INFO[producto.categoria].label}</p>
                                        <p className="text-foreground font-bold text-sm pt-0.5">{formatPrecio(producto.precio)}</p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
                {errors.producto_id && <p className="text-destructive text-xs">{errors.producto_id.message}</p>}
            </div>

            {seleccionado && (
                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 pt-2 border-t border-border">
                    <p className="label mb-0 pt-4">2. Cantidad de pares por talla</p>
                    <TallaInfoBox
                        categoria={seleccionado.categoria}
                        editable
                        value={tallas ?? undefined}
                        onChange={setTallas}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="label">Fecha de entrega deseada (opcional)</label>
                            <Input type="date" min={hoy} {...register('fecha_entrega_deseada')} />
                        </div>
                    </div>

                    <div>
                        <label className="label">Comentario (opcional)</label>
                        <textarea
                            {...register('comentario_cliente')}
                            rows={3}
                            placeholder="Detalles adicionales sobre tu pedido..."
                            className={`input h-auto resize-none ${errors.comentario_cliente ? 'input-error' : ''}`}
                        />
                        {errors.comentario_cliente && <p className="text-destructive text-xs mt-1">{errors.comentario_cliente.message}</p>}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => { setSeleccionado(null); setTallas(null); reset(); }}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="hover:scale-[1.02] transition-transform">
                            {isSubmitting
                                ? <><Loader2 size={14} className="animate-spin" /> Enviando...</>
                                : 'Enviar solicitud'}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}

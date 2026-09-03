import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Package, Calendar, Ruler, Loader2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMisPedidosStore } from '@/stores/index';
import { formatFechaLarga } from '@/utils/dates';
import { getImagenEstandarizada } from '@/utils/cloudinary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LeatherSeal from '@/components/shared/LeatherSeal';
import ProductImageZoom from '@/components/shared/ProductImageZoom';
import StatusBadge from '@/components/shared/StatusBadge';
import PedidoStepper from '@/components/shared/PedidoStepper';
import StarRating from '@/components/shared/StarRating';
import type { Pedido, UnidadPedido } from '@/types';

const UNIDAD_LABELS: Record<UnidadPedido, string> = {
    docena:       'Docena',
    media_docena: 'Media Docena',
    par:          'Par',
};

function formatFechaCalificacion(fechaIso: string): string {
    return new Date(fechaIso).toLocaleDateString('es-HN', { day: '2-digit', month: 'long', year: 'numeric' });
}

function CalificarForm({ onSubmit }: { onSubmit: (puntuacion: number, comentario: string) => Promise<void> }) {
    const [puntuacion, setPuntuacion] = useState(0);
    const [comentario, setComentario] = useState('');
    const [enviando, setEnviando]     = useState(false);

    const handleSubmit = async () => {
        if (puntuacion === 0) { toast.error('Selecciona una calificación de 1 a 5 estrellas.'); return; }
        setEnviando(true);
        try {
            await onSubmit(puntuacion, comentario.trim());
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="space-y-3">
            <StarRating value={puntuacion} onChange={setPuntuacion} />
            <textarea
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                placeholder="Cuéntanos tu experiencia (opcional)"
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
            <Button onClick={handleSubmit} disabled={enviando} size="sm">
                {enviando ? <><Loader2 size={14} className="animate-spin" /> Enviando...</> : 'Enviar calificación'}
            </Button>
        </div>
    );
}

export default function MisPedidoDetalleView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const pedidosCargados = useMisPedidosStore(s => s.pedidos);
    const fetchOne         = useMisPedidosStore(s => s.fetchOne);
    const calificar         = useMisPedidosStore(s => s.calificar);

    const [pedido, setPedido]   = useState<Pedido | null>(
        () => pedidosCargados.find(p => p.id_pedido === Number(id)) ?? null,
    );
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);

    useEffect(() => {
        if (!id) { setError('Pedido inválido.'); setLoading(false); return; }

        fetchOne(Number(id))
            .then(setPedido)
            .catch(err => {
                const status = err?.response?.status;
                setError(status === 404
                    ? 'No encontramos ese pedido en tu cuenta.'
                    : 'No pudimos cargar el pedido. Intenta nuevamente más tarde.');
            })
            .finally(() => setLoading(false));
    }, [id, fetchOne]);

    const handleCalificar = async (puntuacion: number, comentario: string) => {
        if (!pedido) return;
        try {
            const calificacion = await calificar(pedido.id_pedido, {
                puntuacion,
                comentario: comentario || undefined,
            });
            setPedido(p => p ? { ...p, calificacion } : p);
            toast.success('¡Gracias por tu calificación!');
        } catch {
            toast.error('No pudimos registrar tu calificación. Intenta nuevamente.');
        }
    };

    return (
        <div className="space-y-6">
            <Button
                variant="ghost"
                onClick={() => navigate('/mis-pedidos')}
                className="-ml-2 text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft size={16} /> Volver a mis pedidos
            </Button>

            {loading && !pedido && (
                <Card className="border-border/50 bg-card/50 backdrop-blur">
                    <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
                        <LeatherSeal size="md" pulse />
                        <p className="text-muted-foreground text-sm">Cargando información del pedido…</p>
                    </CardContent>
                </Card>
            )}

            {!loading && error && !pedido && (
                <Card className="border-border/50 bg-card/50 backdrop-blur">
                    <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
                        <AlertCircle className="w-12 h-12 text-destructive" />
                        <p className="text-muted-foreground text-sm">{error}</p>
                    </CardContent>
                </Card>
            )}

            {pedido && (
                <>
                    {/* ID + Estado */}
                    <Card className="border-border/50 bg-card/50 backdrop-blur">
                        <CardContent className="p-5 flex items-start justify-between gap-4 flex-wrap">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">Pedido</p>
                                <p className="text-2xl font-bold text-foreground">#{pedido.id_pedido}</p>
                            </div>
                            <StatusBadge estado={pedido.estado} />
                        </CardContent>
                    </Card>

                    {/* Barra de progreso */}
                    <PedidoStepper estado={pedido.estado} />

                    {/* Fecha estimada */}
                    <Card className="border-border/50 bg-card/50 backdrop-blur">
                        <CardContent className="p-4 flex gap-3">
                            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                                <p className="label">Fecha estimada de entrega</p>
                                <p className="text-foreground font-medium text-sm">{formatFechaLarga(pedido.fecha_entrega)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Producto */}
                    <Card className="border-border/50 bg-card/50 backdrop-blur overflow-hidden">
                        {pedido.producto?.imagen_url ? (
                            <ProductImageZoom
                                src={getImagenEstandarizada(pedido.producto.imagen_url, 600)!}
                                alt={pedido.producto.nombre_modelo}
                                fit="contain"
                                className="w-full h-48 bg-muted"
                            />
                        ) : (
                            <div className="w-full h-48 bg-gradient-to-br from-muted to-accent flex flex-col items-center justify-center gap-3">
                                <div className="w-16 h-16 rounded-full bg-card/60 flex items-center justify-center">
                                    <Package className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <span className="text-muted-foreground text-xs tracking-wide">Sin imagen disponible</span>
                            </div>
                        )}
                        <CardContent className="p-4 space-y-3">
                            <div>
                                <p className="text-2xs text-muted-foreground uppercase tracking-widest">Producto</p>
                                <p className="text-foreground font-bold text-xl leading-tight mt-0.5">
                                    {pedido.producto?.nombre_modelo ?? 'N/D'}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center bg-primary/10 text-primary border border-primary/30 text-xs font-semibold px-3 py-1.5 rounded-full">
                                    {pedido.cantidad} {UNIDAD_LABELS[pedido.unidad] ?? pedido.unidad}
                                </span>
                                <span className="inline-flex items-center bg-secondary/10 text-secondary border border-secondary/30 text-xs font-semibold px-3 py-1.5 rounded-full">
                                    {pedido.cantidad_pares} pares
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tallas */}
                    {pedido.talles && pedido.talles.length > 0 && (
                        <Card className="border-border/50 bg-card/50 backdrop-blur">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Ruler className="w-4 h-4 text-muted-foreground" />
                                    <p className="label mb-0">Tallas</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {pedido.talles.map((t, i) => (
                                        <div
                                            key={i}
                                            className="flex flex-col items-center bg-muted border border-border rounded px-3 py-1.5 min-w-[52px]"
                                        >
                                            <span className="text-foreground font-semibold text-sm">{t.talla}</span>
                                            <span className="text-muted-foreground text-2xs">{t.cantidad_pares} par{t.cantidad_pares !== 1 ? 'es' : ''}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Calificación */}
                    {pedido.estado === 'Terminado' && (
                        <Card className="border-border/50 bg-card/50 backdrop-blur">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Star className="w-4 h-4 text-muted-foreground" />
                                    <p className="label mb-0">Tu calificación</p>
                                </div>

                                {pedido.calificacion ? (
                                    <div className="space-y-2">
                                        <StarRating value={pedido.calificacion.puntuacion} readOnly />
                                        {pedido.calificacion.comentario && (
                                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                                                &ldquo;{pedido.calificacion.comentario}&rdquo;
                                            </p>
                                        )}
                                        <p className="text-2xs text-muted-foreground">
                                            Calificado el {formatFechaCalificacion(pedido.calificacion.fecha_creacion)}
                                        </p>
                                    </div>
                                ) : (
                                    <CalificarForm onSubmit={handleCalificar} />
                                )}
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import { AlertCircle, Package, User, Calendar, Ruler } from 'lucide-react';
import type { EstadoPedido } from '@/types';
import { formatFechaLarga } from '@/utils/dates';
import { getImagenEstandarizada } from '@/utils/cloudinary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LeatherSeal from '@/components/shared/LeatherSeal';
import ProductImageZoom from '@/components/shared/ProductImageZoom';
import StatusBadge from '@/components/shared/StatusBadge';
import PedidoStepper from '@/components/shared/PedidoStepper';

interface PedidoPublico {
    id_pedido:      number;
    cliente:        string;
    producto:       string;
    imagen?:        string;
    cantidad:       number;
    unidad:         string;
    cantidad_pares: number;
    fecha_entrega:  string;
    estado:         EstadoPedido;
    talles?:        { talla: number; cantidad_pares: number }[];
}


const UNIDAD_LABELS: Record<string, string> = {
    docena:       'Docena',
    media_docena: 'Media Docena',
    par:          'Par',
};

export default function SeguimientoView() {
    const { id, token } = useParams<{ id?: string; token?: string }>();
    const navigate = useNavigate();

    const [pedido, setPedido]   = useState<PedidoPublico | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);

    useEffect(() => {
        const endpoint = token
            ? `/publico/pedido/token/${token}`
            : id
                ? `/publico/pedido/${id}`
                : null;

        if (!endpoint) { setError('Enlace de seguimiento inválido.'); setLoading(false); return; }

        api
            .get<PedidoPublico>(endpoint)
            .then(res => setPedido(res.data))
            .catch(err => {
                const status = err?.response?.status;
                if (status === 404) setError('No encontramos un pedido con ese código. Verifica el enlace.');
                else setError('No pudimos cargar el pedido. Intenta nuevamente más tarde.');
            })
            .finally(() => setLoading(false));
    }, [id, token]);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="relative bg-cafe-gradient shadow-md overflow-hidden">
                <div className="absolute inset-0 bg-texture-stitch text-dorado-100 opacity-[0.04] pointer-events-none" />
                <div className="relative max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
                    <LeatherSeal size="sm" />
                    <div>
                        <p className="text-sidebar-foreground font-display font-semibold text-sm leading-tight tracking-wide">
                            Calzados Nueva Tendencia
                        </p>
                        <p className="text-sidebar-foreground/60 text-xs">Seguimiento de pedido</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">

                {/* Loading */}
                {loading && (
                    <Card className="border-border/50 bg-card/50 backdrop-blur">
                        <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
                            <LeatherSeal size="md" pulse />
                            <p className="text-muted-foreground text-sm">Cargando información del pedido…</p>
                        </CardContent>
                    </Card>
                )}

                {/* Error */}
                {!loading && error && (
                    <Card className="border-border/50 bg-card/50 backdrop-blur">
                        <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
                            <AlertCircle className="w-12 h-12 text-destructive" />
                            <div>
                                <p className="font-semibold text-foreground mb-1">Pedido no encontrado</p>
                                <p className="text-muted-foreground text-sm">{error}</p>
                            </div>
                            <Button variant="outline" onClick={() => navigate(-1)} className="mt-2">
                                Volver
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Pedido */}
                {!loading && pedido && (
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

                        {/* Detalles */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            {/* Cliente */}
                            <Card className="border-border/50 bg-card/50 backdrop-blur">
                                <CardContent className="p-4 flex gap-3">
                                    <User className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                                    <div>
                                        <p className="label">Cliente</p>
                                        <p className="text-foreground font-medium text-sm">
                                            {pedido.cliente || 'N/D'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Fecha estimada */}
                            <Card className="border-border/50 bg-card/50 backdrop-blur">
                                <CardContent className="p-4 flex gap-3">
                                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                                    <div>
                                        <p className="label">Fecha estimada de entrega</p>
                                        <p className="text-foreground font-medium text-sm">
                                            {formatFechaLarga(pedido.fecha_entrega)}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Producto */}
                        <Card className="border-border/50 bg-card/50 backdrop-blur overflow-hidden">
                            {pedido.imagen ? (
                                <ProductImageZoom
                                    src={getImagenEstandarizada(pedido.imagen, 600)!}
                                    alt={pedido.producto}
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
                                        {pedido.producto || 'N/D'}
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
                    </>
                )}
            </main>

            <footer className="text-center py-4 text-2xs text-muted-foreground/70">
                Calzados Nueva Tendencia &copy; {new Date().getFullYear()}
            </footer>
        </div>
    );
}

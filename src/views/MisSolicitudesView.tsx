import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Package, Calendar, XCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { useMisSolicitudesStore } from '@/stores/index';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/shared/Skeleton';
import AdvancedPagination, { PAGE_SIZES } from '@/components/shared/AdvancedPagination';
import type { PageSize } from '@/components/shared/AdvancedPagination';
import type { EstadoSolicitud, SolicitudPedido } from '@/types';
import { getImagenEstandarizada } from '@/utils/cloudinary';

const LS_KEY = 'mis-solicitudes-page-size';

function readPageSize(): PageSize {
    const saved = localStorage.getItem(LS_KEY);
    return (PAGE_SIZES as readonly number[]).includes(Number(saved))
        ? (Number(saved) as PageSize)
        : 10;
}

function formatFecha(iso: string): string {
    return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' });
}

const ESTADO_CONFIG: Record<EstadoSolicitud, { class: string; dot: string }> = {
    Pendiente: { class: 'bg-chart-3/10 text-chart-3 border border-chart-3/30', dot: 'bg-chart-3' },
    Aprobada:  { class: 'bg-secondary text-secondary-foreground border border-secondary', dot: 'bg-secondary-foreground' },
    Rechazada: { class: 'bg-destructive/10 text-destructive border border-destructive/30', dot: 'bg-destructive' },
};

function EstadoSolicitudBadge({ estado }: { estado: EstadoSolicitud }) {
    const cfg = ESTADO_CONFIG[estado];
    return (
        <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-medium uppercase tracking-wider', cfg.class)}>
            <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
            {estado}
        </span>
    );
}

function SolicitudCard({ solicitud }: { solicitud: SolicitudPedido }) {
    const navigate = useNavigate();
    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
                        {solicitud.producto?.imagen_url ? (
                            <img src={getImagenEstandarizada(solicitud.producto.imagen_url, 200)!} alt={solicitud.producto.nombre_modelo} className="h-full w-full object-cover" />
                        ) : (
                            <Package className="w-6 h-6 text-muted-foreground" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-2xs text-muted-foreground uppercase tracking-widest">#{solicitud.id_solicitud}</p>
                        <p className="text-foreground font-semibold text-sm truncate">
                            {solicitud.producto?.nombre_modelo ?? 'Producto'} — {solicitud.cantidad_pares} pares
                        </p>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-2xs mt-0.5">
                            <Calendar size={11} />
                            Solicitado el {formatFecha(solicitud.fecha_creacion)}
                        </div>
                    </div>
                    <div className="shrink-0">
                        <EstadoSolicitudBadge estado={solicitud.estado} />
                    </div>
                </div>

                {solicitud.estado === 'Rechazada' && solicitud.motivo_rechazo && (
                    <div className="flex items-start gap-2 rounded-lg bg-destructive/5 border border-destructive/20 px-3 py-2">
                        <XCircle size={14} className="text-destructive shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                            <span className="text-destructive font-medium">Motivo: </span>
                            {solicitud.motivo_rechazo}
                        </p>
                    </div>
                )}

                {solicitud.estado === 'Aprobada' && solicitud.pedido_creado && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-between"
                        onClick={() => navigate(`/mis-pedidos/${solicitud.pedido_creado!.id_pedido}`)}
                    >
                        Ver pedido #{solicitud.pedido_creado.id_pedido}
                        <ArrowRight size={14} />
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

export default function MisSolicitudesView() {
    const solicitudes = useMisSolicitudesStore(s => s.solicitudes);
    const isLoading    = useMisSolicitudesStore(s => s.isLoading);
    const error        = useMisSolicitudesStore(s => s.error);
    const fetchAll     = useMisSolicitudesStore(s => s.fetchAll);

    const [page, setPage]         = useState(1);
    const [pageSize, setPageSize] = useState<PageSize>(readPageSize);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const totalPages = Math.max(1, Math.ceil(solicitudes.length / pageSize));
    const paginated  = solicitudes.slice((page - 1) * pageSize, page * pageSize);

    const handlePageSizeChange = (s: PageSize) => {
        localStorage.setItem(LS_KEY, String(s));
        setPageSize(s);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-2xl font-semibold text-foreground">Mis solicitudes</h1>
                <p className="text-sm text-muted-foreground mt-1">Seguimiento de tus solicitudes de pedido enviadas a Nueva Tendencia.</p>
            </div>

            {isLoading && solicitudes.length === 0 && (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="border-border/50 bg-card/50 backdrop-blur">
                            <CardContent className="p-4 flex items-center gap-4">
                                <Skeleton className="h-14 w-14 rounded-lg shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {!isLoading && solicitudes.length === 0 && error && (
                <EmptyState
                    icon={AlertTriangle}
                    title="No se pudo cargar la información"
                    description="Ocurrió un error al obtener tus solicitudes. Intentá de nuevo."
                    actionLabel="Reintentar"
                    onAction={() => fetchAll()}
                />
            )}

            {!isLoading && solicitudes.length === 0 && !error && (
                <EmptyState
                    icon={ClipboardList}
                    title="Aún no tienes solicitudes"
                    description="Cuando pidas un producto nuevo desde el Catálogo, aparecerá aquí con su estado."
                />
            )}

            {solicitudes.length > 0 && (
                <div className="space-y-3">
                    {paginated.map(s => <SolicitudCard key={s.id_solicitud} solicitud={s} />)}
                </div>
            )}

            {!isLoading && solicitudes.length > 0 && (
                <AdvancedPagination
                    page={page}
                    totalPages={totalPages}
                    total={solicitudes.length}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={handlePageSizeChange}
                    noun="solicitudes"
                />
            )}
        </div>
    );
}

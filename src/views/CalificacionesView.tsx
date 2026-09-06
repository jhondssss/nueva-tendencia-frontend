import { useState, useEffect } from 'react';
import { Star, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { calificacionApi } from '@/api/services';
import type { CalificacionAdmin } from '@/types';
import AdvancedPagination, { PAGE_SIZES } from '@/components/shared/AdvancedPagination';
import type { PageSize } from '@/components/shared/AdvancedPagination';
import { TableSkeleton } from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import StarRating from '@/components/shared/StarRating';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

const LS_KEY = 'calificaciones-page-size';

function readPageSize(): PageSize {
    const saved = localStorage.getItem(LS_KEY);
    return (PAGE_SIZES as readonly number[]).includes(Number(saved))
        ? (Number(saved) as PageSize)
        : 25;
}

function formatFecha(iso: string): string {
    return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function CalificacionesView() {
    const [calificaciones, setCalificaciones] = useState<CalificacionAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const [puntuacion, setPuntuacion] = useState<string>('todas');
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<PageSize>(readPageSize);

    const hayFiltros = puntuacion !== 'todas' || !!desde || !!hasta;

    useEffect(() => { document.title = 'Calificaciones | NT'; }, []);

    const loadCalificaciones = () => {
        setLoading(true);
        setLoadError(false);
        calificacionApi.getAll({
            puntuacion: puntuacion === 'todas' ? undefined : Number(puntuacion),
            desde: desde || undefined,
            hasta: hasta || undefined,
        })
            .then(res => setCalificaciones(res.data))
            .catch(() => { toast.error('Error al cargar las calificaciones'); setLoadError(true); })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadCalificaciones();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [puntuacion, desde, hasta]);

    const totalPages = Math.max(1, Math.ceil(calificaciones.length / pageSize));
    const paginated = calificaciones.slice((page - 1) * pageSize, page * pageSize);

    const handlePageSizeChange = (s: PageSize) => {
        localStorage.setItem(LS_KEY, String(s));
        setPageSize(s);
    };

    const limpiarFiltros = () => { setPuntuacion('todas'); setDesde(''); setHasta(''); setPage(1); };

    return (
        <div className="space-y-8 animate-fade-in">

            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title section-title">Calificaciones</h1>
                    <p className="page-subtitle">Opiniones de clientes sobre pedidos entregados</p>
                </div>
            </div>

            {/* Filtros */}
            <section className="space-y-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-1 h-5 rounded-full bg-primary" />
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                        Filtros
                    </h2>
                </div>

                <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Puntuación</label>
                        <Select value={puntuacion} onValueChange={v => { setPuntuacion(v); setPage(1); }}>
                            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todas">Todas</SelectItem>
                                {[5, 4, 3, 2, 1].map(n => (
                                    <SelectItem key={n} value={String(n)}>{n} {n > 1 ? 'estrellas' : 'estrella'}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Desde</label>
                        <Input type="date" value={desde} onChange={e => { setDesde(e.target.value); setPage(1); }} className="w-40" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Hasta</label>
                        <Input type="date" value={hasta} onChange={e => { setHasta(e.target.value); setPage(1); }} className="w-40" />
                    </div>

                    {hayFiltros && (
                        <Button variant="outline" onClick={limpiarFiltros} className="h-9 self-end text-xs">
                            <X size={12} />
                            Limpiar
                        </Button>
                    )}
                </div>
            </section>

            {/* Tabla */}
            <section className="space-y-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-1 h-5 rounded-full bg-secondary" />
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                        Registros
                    </h2>
                    {!loading && (
                        <span className="ml-1 text-xs text-muted-foreground/70">
                            ({calificaciones.length} {calificaciones.length === 1 ? 'calificación' : 'calificaciones'})
                        </span>
                    )}
                </div>

                <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden
                                transition-all duration-300 hover:shadow-lg">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Cliente</TableHead>
                                <TableHead>Pedido</TableHead>
                                <TableHead>Puntuación</TableHead>
                                <TableHead>Comentario</TableHead>
                                <TableHead>Fecha</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={5}><TableSkeleton rows={8} /></TableCell>
                                </TableRow>
                            ) : loadError && paginated.length === 0 ? (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={5}>
                                        <EmptyState
                                            icon={AlertTriangle}
                                            title="No se pudo cargar la información"
                                            description="Ocurrió un error al obtener las calificaciones. Intentá de nuevo."
                                            actionLabel="Reintentar"
                                            onAction={loadCalificaciones}
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : paginated.length === 0 ? (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={5}>
                                        <EmptyState
                                            icon={Star}
                                            title="Sin calificaciones"
                                            description="No se encontraron calificaciones para los filtros aplicados."
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginated.map(c => (
                                    <TableRow key={c.id_calificacion}>
                                        <TableCell className="text-sm font-medium text-foreground">
                                            {c.pedido.cliente.nombre} {c.pedido.cliente.apellido}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            #{c.pedido.id_pedido} — {c.pedido.producto?.nombre_modelo ?? 'N/D'}
                                        </TableCell>
                                        <TableCell>
                                            <StarRating value={c.puntuacion} readOnly size={16} />
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                            {c.comentario || <span className="text-muted-foreground/50">—</span>}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                                            {formatFecha(c.fecha_creacion)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {!loading && (
                        <AdvancedPagination
                            page={page}
                            totalPages={totalPages}
                            total={calificaciones.length}
                            pageSize={pageSize}
                            onPageChange={setPage}
                            onPageSizeChange={handlePageSizeChange}
                            noun="calificaciones"
                        />
                    )}
                </div>
            </section>
        </div>
    );
}

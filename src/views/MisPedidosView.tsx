import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ChevronRight, Calendar, X } from 'lucide-react';
import { useMisPedidosStore } from '@/stores/index';
import { formatFechaLarga } from '@/utils/dates';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/shared/Skeleton';
import AdvancedPagination, { PAGE_SIZES } from '@/components/shared/AdvancedPagination';
import type { PageSize } from '@/components/shared/AdvancedPagination';
import type { EstadoPedido } from '@/types';

const ESTADOS: EstadoPedido[] = ['Pendiente', 'Cortado', 'Aparado', 'Solado', 'Empaque', 'Terminado'];

const LS_KEY = 'mis-pedidos-page-size';

function readPageSize(): PageSize {
    const saved = localStorage.getItem(LS_KEY);
    return (PAGE_SIZES as readonly number[]).includes(Number(saved))
        ? (Number(saved) as PageSize)
        : 10;
}

export default function MisPedidosView() {
    const navigate = useNavigate();

    const pedidos   = useMisPedidosStore(s => s.pedidos);
    const isLoading = useMisPedidosStore(s => s.isLoading);
    const fetchAll  = useMisPedidosStore(s => s.fetchAll);

    const [desde, setDesde]   = useState('');
    const [hasta, setHasta]   = useState('');
    const [estado, setEstado] = useState<EstadoPedido | 'todos'>('todos');
    const [page, setPage]         = useState(1);
    const [pageSize, setPageSize] = useState<PageSize>(readPageSize);

    const hayFiltros = !!desde || !!hasta || estado !== 'todos';

    useEffect(() => {
        fetchAll({
            desde:  desde || undefined,
            hasta:  hasta || undefined,
            estado: estado === 'todos' ? undefined : estado,
        });
        setPage(1);
    }, [fetchAll, desde, hasta, estado]);

    const limpiarFiltros = () => { setDesde(''); setHasta(''); setEstado('todos'); };

    const totalPages = Math.max(1, Math.ceil(pedidos.length / pageSize));
    const paginated  = pedidos.slice((page - 1) * pageSize, page * pageSize);

    const handlePageSizeChange = (s: PageSize) => {
        localStorage.setItem(LS_KEY, String(s));
        setPageSize(s);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-2xl font-semibold text-foreground">Mis pedidos</h1>
                <p className="text-sm text-muted-foreground mt-1">Consulta el estado de tus pedidos con Nueva Tendencia.</p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                    <label className="text-2xs text-muted-foreground uppercase tracking-widest">Desde</label>
                    <Input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="w-40" />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-2xs text-muted-foreground uppercase tracking-widest">Hasta</label>
                    <Input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="w-40" />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-2xs text-muted-foreground uppercase tracking-widest">Estado</label>
                    <Select value={estado} onValueChange={v => setEstado(v as EstadoPedido | 'todos')}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos los estados</SelectItem>
                            {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                {hayFiltros && (
                    <Button variant="ghost" size="sm" onClick={limpiarFiltros} className="text-muted-foreground">
                        <X size={14} /> Limpiar filtros
                    </Button>
                )}
            </div>

            {isLoading && pedidos.length === 0 && (
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

            {!isLoading && pedidos.length === 0 && hayFiltros && (
                <EmptyState
                    icon={Package}
                    title="Sin resultados"
                    description="No encontramos pedidos que coincidan con los filtros seleccionados."
                />
            )}

            {!isLoading && pedidos.length === 0 && !hayFiltros && (
                <EmptyState
                    icon={Package}
                    title="Aún no tienes pedidos"
                    description="Cuando realices un pedido con nosotros, aparecerá aquí para que puedas seguir su estado."
                />
            )}

            {pedidos.length > 0 && (
                <div className="space-y-3">
                    {paginated.map(pedido => (
                        <button
                            key={pedido.id_pedido}
                            onClick={() => navigate(`/mis-pedidos/${pedido.id_pedido}`)}
                            className="w-full text-left group"
                        >
                            <Card className="border-border/50 bg-card/50 backdrop-blur transition-all duration-200 hover:border-secondary/40 hover:shadow-md">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
                                        {pedido.producto?.imagen_url ? (
                                            <img
                                                src={pedido.producto.imagen_url}
                                                alt={pedido.producto.nombre_modelo}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <Package className="w-6 h-6 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-2xs text-muted-foreground uppercase tracking-widest">#{pedido.id_pedido}</p>
                                        <p className="text-foreground font-semibold text-sm truncate">
                                            {pedido.producto?.nombre_modelo ?? 'Producto'}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-muted-foreground text-2xs mt-0.5">
                                            <Calendar size={11} />
                                            {formatFechaLarga(pedido.fecha_entrega)}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <StatusBadge estado={pedido.estado} size="sm" />
                                        <ChevronRight size={16} className="text-muted-foreground group-hover:text-secondary transition-colors" />
                                    </div>
                                </CardContent>
                            </Card>
                        </button>
                    ))}
                </div>
            )}

            {!isLoading && pedidos.length > 0 && (
                <AdvancedPagination
                    page={page}
                    totalPages={totalPages}
                    total={pedidos.length}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={handlePageSizeChange}
                    noun="pedidos"
                />
            )}
        </div>
    );
}

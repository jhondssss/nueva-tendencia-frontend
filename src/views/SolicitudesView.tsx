import { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { useSolicitudesAdminStore, useInsumoStore } from '@/stores/index';
import { Button } from '@/components/ui/button';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { TableSkeleton } from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import AprobarSolicitudModal from '@/components/solicitudes/AprobarSolicitudModal';
import RechazarSolicitudModal from '@/components/solicitudes/RechazarSolicitudModal';
import { CATEGORIA_INFO } from '@/components/pedidos/TallaInfoBox';
import type { AprobarSolicitudDto, EstadoSolicitud, SolicitudPedido } from '@/types';

function formatFecha(iso: string): string {
    return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ESTADOS: EstadoSolicitud[] = ['Pendiente', 'Aprobada', 'Rechazada'];

const ESTADO_CONFIG: Record<EstadoSolicitud, string> = {
    Pendiente: 'bg-chart-3/10 text-chart-3 border border-chart-3/30',
    Aprobada:  'bg-secondary text-secondary-foreground border border-secondary',
    Rechazada: 'bg-destructive/10 text-destructive border border-destructive/30',
};

export default function SolicitudesView() {
    const solicitudes = useSolicitudesAdminStore(s => s.solicitudes);
    const isLoading    = useSolicitudesAdminStore(s => s.isLoading);
    const error        = useSolicitudesAdminStore(s => s.error);
    const fetchAll     = useSolicitudesAdminStore(s => s.fetchAll);
    const aprobar      = useSolicitudesAdminStore(s => s.aprobar);
    const rechazar     = useSolicitudesAdminStore(s => s.rechazar);
    const insumos      = useInsumoStore(s => s.insumos);
    const fetchInsumos = useInsumoStore(s => s.fetchAll);

    const [estado, setEstado] = useState<EstadoSolicitud | 'todos'>('Pendiente');
    const [aAprobar, setAAprobar]   = useState<SolicitudPedido | null>(null);
    const [aRechazar, setARechazar] = useState<SolicitudPedido | null>(null);

    const refetch = () => fetchAll(estado === 'todos' ? undefined : estado);

    useEffect(() => { document.title = 'Solicitudes | NT'; }, []);
    useEffect(() => { refetch(); }, [fetchAll, estado]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { fetchInsumos(); }, [fetchInsumos]);

    const handleAprobar = async (id: number, dto: AprobarSolicitudDto) => {
        const actualizada = await aprobar(id, dto);
        return actualizada;
    };
    const handleRechazar = async (id: number, motivo: string) => {
        await rechazar(id, { motivo_rechazo: motivo });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title section-title">Solicitudes de pedido</h1>
                    <p className="page-subtitle">Pedidos que los clientes solicitan desde el portal — revisa y aprueba o rechaza.</p>
                </div>
                <Select value={estado} onValueChange={v => setEstado(v as EstadoSolicitud | 'todos')}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                        <SelectItem value="todos">Todos los estados</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden transition-all duration-300 hover:shadow-lg">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>Cliente</TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead>Tallas</TableHead>
                            <TableHead>Entrega deseada</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Solicitada</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={7}><TableSkeleton rows={6} /></TableCell>
                            </TableRow>
                        ) : error && solicitudes.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={7}>
                                    <EmptyState
                                        icon={AlertTriangle}
                                        title="No se pudo cargar la información"
                                        description="Ocurrió un error al obtener las solicitudes. Intentá de nuevo."
                                        actionLabel="Reintentar"
                                        onAction={refetch}
                                    />
                                </TableCell>
                            </TableRow>
                        ) : solicitudes.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={7}>
                                    <EmptyState
                                        icon={ClipboardList}
                                        title="Sin solicitudes"
                                        description="No hay solicitudes de pedido para el filtro seleccionado."
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            solicitudes.map(s => (
                                <TableRow key={s.id_solicitud}>
                                    <TableCell className="text-sm font-medium text-foreground whitespace-nowrap">
                                        {s.cliente.nombre} {s.cliente.apellido}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {s.producto?.nombre_modelo ?? 'N/D'}
                                        <span className="block text-2xs text-muted-foreground/70">
                                            {CATEGORIA_INFO[s.categoria].label} — {s.cantidad_pares} pares
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {s.tallas.map(t => `T${t.talla}×${t.cantidad_pares}`).join(', ')}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                        {s.fecha_entrega_deseada ? formatFecha(s.fecha_entrega_deseada) : '—'}
                                    </TableCell>
                                    <TableCell>
                                        <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-medium uppercase tracking-wider', ESTADO_CONFIG[s.estado])}>
                                            {s.estado}
                                        </span>
                                        {s.estado === 'Rechazada' && s.motivo_rechazo && (
                                            <span className="block text-2xs text-muted-foreground mt-1 max-w-[16rem] truncate" title={s.motivo_rechazo}>
                                                {s.motivo_rechazo}
                                            </span>
                                        )}
                                        {s.estado === 'Aprobada' && s.pedido_creado && (
                                            <span className="block text-2xs text-muted-foreground mt-1">
                                                → Pedido #{s.pedido_creado.id_pedido}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                                        {formatFecha(s.fecha_creacion)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {s.estado === 'Pendiente' && (
                                            <div className="flex justify-end gap-1.5">
                                                <Button size="sm" variant="outline" onClick={() => setARechazar(s)}>
                                                    <XCircle size={13} /> Rechazar
                                                </Button>
                                                <Button size="sm" onClick={() => setAAprobar(s)}>
                                                    <CheckCircle2 size={13} /> Aprobar
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AprobarSolicitudModal
                isOpen={!!aAprobar}
                onClose={() => setAAprobar(null)}
                onConfirm={handleAprobar}
                solicitud={aAprobar}
                insumos={insumos}
            />
            <RechazarSolicitudModal
                isOpen={!!aRechazar}
                onClose={() => setARechazar(null)}
                onConfirm={handleRechazar}
                solicitud={aRechazar}
            />
        </div>
    );
}

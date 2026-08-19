import { useState, useEffect, useCallback } from 'react';
import {
    PlusCircle, ArrowRight, DollarSign, ArrowLeftRight,
    AlertTriangle, FileText, FileSpreadsheet, Loader2,
    CalendarCheck, ChevronLeft, ChevronRight, RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { reportesApi } from '@/api/services';
import { useRole } from '@/hooks/useRole';
import EmptyState from '@/components/shared/EmptyState';
import { KpiSkeleton, TableSkeleton } from '@/components/shared/Skeleton';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import type {
    ReporteDiario, ReporteDiarioPedido, ReporteDiarioAlertaItem,
    TipoMovimiento, ModuloAuditoria, AccionAuditoria,
} from '@/types';

// ─── Constantes ───────────────────────────────────────────────────────────────

const REFRESH_MS = 5 * 60 * 1000; // 5 minutos
const LOG_PAGE   = 10;

// ─── Badge helpers ────────────────────────────────────────────────────────────

const KARDEX_BADGE: Record<TipoMovimiento, string> = {
    entrada: 'bg-secondary/10 text-secondary border-secondary/30',
    salida:  'bg-destructive/10 text-destructive border-destructive/30',
    ajuste:  'bg-chart-3/10 text-chart-3 border-chart-3/30',
};

const MODULO_BADGE: Record<ModuloAuditoria, string> = {
    auth:      'bg-chart-4/10 text-chart-4 border-chart-4/30',
    pedidos:   'bg-primary/10 text-primary border-primary/30',
    clientes:  'bg-secondary/10 text-secondary border-secondary/30',
    productos: 'bg-chart-3/10 text-chart-3 border-chart-3/30',
};

const ACCION_BADGE: Record<AccionAuditoria, string> = {
    CREATE: 'bg-secondary/10 text-secondary border-secondary/30',
    UPDATE: 'bg-chart-3/10 text-chart-3 border-chart-3/30',
    DELETE: 'bg-destructive/10 text-destructive border-destructive/30',
    LOGIN:  'bg-chart-4/10 text-chart-4 border-chart-4/30',
};

const ACCENT: Record<string, { text: string; bg: string; border: string }> = {
    primary:      { text: 'text-primary',      bg: 'bg-primary/10',      border: 'border-t-primary' },
    secondary:    { text: 'text-secondary',    bg: 'bg-secondary/10',    border: 'border-t-secondary' },
    'chart-3':    { text: 'text-chart-3',      bg: 'bg-chart-3/10',      border: 'border-t-chart-3' },
    'chart-4':    { text: 'text-chart-4',      bg: 'bg-chart-4/10',      border: 'border-t-chart-4' },
    destructive:  { text: 'text-destructive',  bg: 'bg-destructive/10',  border: 'border-t-destructive' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label, color = 'bg-primary' }: { label: string; color?: string }) {
    return (
        <div className="flex items-center gap-2.5">
            <div className={clsx('w-1 h-5 rounded-full', color)} />
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{label}</h2>
        </div>
    );
}

function KpiCard({
    icon: Icon, label, value, sub, accent,
}: {
    icon: React.ElementType; label: string; value: string | number;
    sub?: string; accent: keyof typeof ACCENT;
}) {
    const a = ACCENT[accent];
    return (
        <div className={clsx(
            'relative overflow-hidden rounded-xl border border-t-2 border-border/50 bg-card/50 p-4',
            'flex items-start gap-3 backdrop-blur transition-all duration-200 hover:scale-[1.01]',
            a.border,
        )}>
            <div className={clsx('p-2.5 rounded-lg flex-shrink-0', a.bg)}>
                <Icon size={18} className={a.text} />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground leading-tight">{label}</p>
                <p className="text-2xl font-bold text-foreground leading-tight mt-0.5">{value}</p>
                {sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                'px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
                active
                    ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                    : 'bg-card/50 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground hover:scale-[1.02]',
            )}
        >
            {children}
        </button>
    );
}

function PedidosTable({ pedidos }: { pedidos: ReporteDiarioPedido[] }) {
    if (pedidos.length === 0) {
        return (
            <EmptyState
                icon={CalendarCheck}
                title="Sin pedidos"
                description="No hay pedidos en esta categoría para hoy."
            />
        );
    }
    return (
        <Table>
            <TableHeader>
                <TableRow className="hover:bg-transparent">
                    <TableHead>#</TableHead><TableHead>Cliente</TableHead><TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead><TableHead>Estado</TableHead><TableHead>Hora</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {pedidos.map(p => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const raw = p as any;
                    const clienteNombre = typeof raw.cliente === 'object'
                        ? `${raw.cliente?.nombre ?? ''} ${raw.cliente?.apellido ?? ''}`.trim()
                        : (raw.cliente ?? '—');
                    const productoNombre = typeof raw.producto === 'object'
                        ? (raw.producto?.nombre_modelo ?? '—')
                        : (raw.producto ?? '—');
                    return (
                        <TableRow key={`${raw.id_pedido}-${raw.hora ?? raw.fecha_entrega}`}>
                            <TableCell className="font-mono text-muted-foreground">#{raw.id_pedido}</TableCell>
                            <TableCell className="font-medium text-foreground">{clienteNombre}</TableCell>
                            <TableCell className="text-muted-foreground">{productoNombre}</TableCell>
                            <TableCell className="text-xs text-muted-foreground capitalize">{raw.categoria ?? '—'}</TableCell>
                            <TableCell><StatusBadge estado={raw.estado} size="sm" /></TableCell>
                            <TableCell className="text-xs text-muted-foreground/70 tabular-nums">{formatHora(raw.hora ?? raw.fecha_entrega)}</TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

function AlertasList({ items, label }: { items: ReporteDiarioAlertaItem[]; label: string }) {
    if (items.length === 0) {
        return (
            <div className="text-sm text-muted-foreground py-4 text-center">
                Sin alertas de {label.toLowerCase()}
            </div>
        );
    }
    return (
        <ul className="space-y-2">
            {items.map(item => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const ri = item as any;
                const key      = ri.id ?? ri.id_producto ?? ri.id_insumo ?? ri.nombre;
                const nombre   = ri.nombre_modelo ?? ri.nombre ?? '—';
                const stock    = ri.stock ?? ri.stock_actual ?? 0;
                const minimo   = ri.nivel_minimo ?? ri.nivelMinimo ?? ri.stock_minimo ?? 0;
                const critico  = ri.critico ?? ri.esCritico ?? stock <= minimo;
                return (
                <li
                    key={key}
                    className={clsx(
                        'flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm',
                        critico ? 'bg-destructive/10 border-destructive/30' : 'bg-chart-3/10 border-chart-3/30',
                    )}
                >
                    <span className={clsx('font-medium', critico ? 'text-destructive' : 'text-chart-3')}>
                        {nombre}
                    </span>
                    <span className={clsx('text-xs font-mono', critico ? 'text-destructive' : 'text-chart-3')}>
                        {stock} / {minimo} mín.
                    </span>
                </li>
                ); })}
        </ul>
    );
}

// ─── View ─────────────────────────────────────────────────────────────────────

export default function ReporteDiarioView() {
    const { isAdmin } = useRole();

    const [data,        setData]        = useState<ReporteDiario | null>(null);
    const [loading,     setLoading]     = useState(true);
    const [tabPedidos,  setTabPedidos]  = useState<'creados' | 'movidos'>('creados');
    const [logPage,     setLogPage]     = useState(1);
    const [loadingPdf,  setLoadingPdf]  = useState(false);
    const [loadingXls,  setLoadingXls]  = useState(false);

    const fechaHoy = new Date().toLocaleDateString('es-BO', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    // Capitalizar primera letra
    const fechaLabel = fechaHoy.charAt(0).toUpperCase() + fechaHoy.slice(1);

    const cargar = useCallback(async (silencioso = false) => {
        if (!silencioso) setLoading(true);
        try {
            const res = await reportesApi.getDiario();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const d = res.data as any; // backend devuelve camelCase sin objeto "resumen"
            console.log('DATOS DIARIO FRONTEND:', JSON.stringify(d));

            const pedidosCreados    = Array.isArray(d.pedidosCreados)    ? d.pedidosCreados    : [];
            const pedidosMovidos    = Array.isArray(d.pedidosMovidos)    ? d.pedidosMovidos    : [];
            const pedidosTerminados = Array.isArray(d.pedidosTerminados) ? d.pedidosTerminados : [];

            setData({
                resumen: {
                    pedidos_creados:    pedidosCreados.length,
                    pedidos_movidos:    pedidosMovidos.length,
                    ventas_total:       pedidosTerminados.reduce((s: number, v: any) => s + Number(v.total ?? 0), 0),
                    movimientos_kardex: Array.isArray(d.movimientosKardex) ? d.movimientosKardex.length : 0,
                    alertas_criticas:   (d.alertasStock?.length ?? 0) + (d.alertasInsumos?.length ?? 0),
                },
                pedidos_creados:    pedidosCreados,
                pedidos_movidos:    pedidosMovidos,
                ventas:             pedidosTerminados,
                movimientos_kardex: Array.isArray(d.movimientosKardex) ? d.movimientosKardex : [],
                alertas: {
                    productos: d.alertasStock   ?? [],
                    insumos:   d.alertasInsumos ?? [],
                },
                actividad: d.accionesAuditoria ?? [],
            });
        } catch {
            if (!silencioso) toast.error('Error al cargar el reporte diario');
        } finally {
            if (!silencioso) setLoading(false);
        }
    }, []);

    useEffect(() => {
        document.title = 'Reporte Diario | NT';
        void cargar();
        const id = setInterval(() => void cargar(true), REFRESH_MS);
        return () => clearInterval(id);
    }, [cargar]);

    // ── Download helpers ──────────────────────────────────────────────────────

    function triggerDownload(blob: Blob, filename: string) {
        const href = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = href; a.download = filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(href);
    }

    const descargarPdf = async () => {
        setLoadingPdf(true);
        try {
            const res = await reportesApi.getPdfDiario();
            triggerDownload(res.data, `reporte-diario-${today()}.pdf`);
            toast.success('PDF descargado');
        } catch {
            toast.error('Error al generar el PDF');
        } finally {
            setLoadingPdf(false);
        }
    };

    const descargarExcel = async () => {
        setLoadingXls(true);
        try {
            const res = await reportesApi.getExcelDiario();
            triggerDownload(res.data, `reporte-diario-${today()}.xlsx`);
            toast.success('Excel descargado');
        } catch {
            toast.error('Error al generar el Excel');
        } finally {
            setLoadingXls(false);
        }
    };

    // ── Access guard ──────────────────────────────────────────────────────────

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-64">
                <EmptyState
                    icon={CalendarCheck}
                    title="Acceso restringido"
                    description="Solo los administradores pueden ver el reporte diario."
                />
            </div>
        );
    }

    // ── Pagination helpers (log actividad) ────────────────────────────────────

    const actividad   = data?.actividad ?? [];
    const logTotal    = actividad.length;
    const logPages    = Math.max(1, Math.ceil(logTotal / LOG_PAGE));
    const logSlice    = actividad.slice((logPage - 1) * LOG_PAGE, logPage * LOG_PAGE);

    // ── KPI skeleton ──────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="h-8 bg-muted rounded w-64" />
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, i) => <KpiSkeleton key={i} />)}
                </div>
                <TableSkeleton rows={6} />
                <TableSkeleton rows={4} />
            </div>
        );
    }

    const r = data?.resumen;
    const pedidosMostrar = tabPedidos === 'creados'
        ? (data?.pedidos_creados ?? [])
        : (data?.pedidos_movidos ?? []);

    return (
        <div className="space-y-8 animate-fade-in">

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Reporte Diario</h1>
                    <p className="page-subtitle">Resumen de actividad del día — {fechaLabel}</p>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                    <Button variant="ghost" size="icon" onClick={() => void cargar()} title="Actualizar"
                            className="text-muted-foreground hover:text-foreground">
                        <RefreshCw size={15} />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => void descargarPdf()} disabled={loadingPdf}
                            className="hover:scale-[1.02] transition-transform">
                        {loadingPdf
                            ? <><Loader2 size={12} className="animate-spin" /> Generando...</>
                            : <><FileText size={12} /> Descargar PDF</>
                        }
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => void descargarExcel()} disabled={loadingXls}
                            className="hover:scale-[1.02] transition-transform">
                        {loadingXls
                            ? <><Loader2 size={12} className="animate-spin" /> Exportando...</>
                            : <><FileSpreadsheet size={12} /> Descargar Excel</>
                        }
                    </Button>
                </div>
            </div>

            {/* ── SECCIÓN 1 — KPIs ───────────────────────────────────────────── */}
            <section className="space-y-3">
                <SectionHeader label="Resumen del día" />
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <KpiCard
                        icon={PlusCircle}
                        label="Pedidos creados"
                        value={r?.pedidos_creados ?? 0}
                        accent="primary"
                    />
                    <KpiCard
                        icon={ArrowRight}
                        label="Pedidos movidos"
                        value={r?.pedidos_movidos ?? 0}
                        accent="chart-3"
                    />
                    <KpiCard
                        icon={DollarSign}
                        label="Ventas del día"
                        value={`Bs. ${(r?.ventas_total ?? 0).toFixed(2)}`}
                        accent="secondary"
                    />
                    <KpiCard
                        icon={ArrowLeftRight}
                        label="Mov. Kardex"
                        value={r?.movimientos_kardex ?? 0}
                        accent="chart-4"
                    />
                    <KpiCard
                        icon={AlertTriangle}
                        label="Alertas críticas"
                        value={r?.alertas_criticas ?? 0}
                        accent={(r?.alertas_criticas ?? 0) > 0 ? 'destructive' : 'chart-4'}
                    />
                </div>
            </section>

            {/* ── SECCIÓN 2 — Pedidos del día ────────────────────────────────── */}
            <section className="space-y-3">
                <SectionHeader label="Pedidos del día" color="bg-primary" />
                <div className="flex gap-2">
                    <TabBtn active={tabPedidos === 'creados'} onClick={() => setTabPedidos('creados')}>
                        Creados ({data?.pedidos_creados.length ?? 0})
                    </TabBtn>
                    <TabBtn active={tabPedidos === 'movidos'} onClick={() => setTabPedidos('movidos')}>
                        Movidos ({data?.pedidos_movidos.length ?? 0})
                    </TabBtn>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden transition-all duration-300 hover:shadow-lg">
                    <PedidosTable pedidos={pedidosMostrar} />
                </div>
            </section>

            {/* ── SECCIÓN 3 — Ventas del día ─────────────────────────────────── */}
            <section className="space-y-3">
                <SectionHeader label="Ventas del día" color="bg-secondary" />
                <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden transition-all duration-300 hover:shadow-lg">
                    {(data?.ventas.length ?? 0) === 0 ? (
                        <EmptyState
                            icon={DollarSign}
                            title="Sin ventas registradas"
                            description="No se registraron ventas completadas hoy."
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>Cliente</TableHead><TableHead>Producto</TableHead>
                                    <TableHead>Cantidad</TableHead><TableHead>Total Bs.</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data!.ventas.map(v => {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const rv = v as any;
                                    const vCliente = typeof rv.cliente === 'object'
                                        ? `${rv.cliente?.nombre ?? ''} ${rv.cliente?.apellido ?? ''}`.trim()
                                        : (rv.cliente ?? '—');
                                    const vProducto = typeof rv.producto === 'object'
                                        ? (rv.producto?.nombre_modelo ?? '—')
                                        : (rv.producto ?? '—');
                                    return (
                                        <TableRow key={rv.id_pedido}>
                                            <TableCell className="font-medium text-foreground">{vCliente}</TableCell>
                                            <TableCell className="text-muted-foreground">{vProducto}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {rv.cantidad} {String(rv.unidad ?? '').replace('_', ' ')}
                                            </TableCell>
                                            <TableCell className="font-mono text-primary font-semibold">
                                                {Number(rv.total).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {/* Fila total */}
                                <TableRow className="border-t-2 border-border bg-muted/50 hover:bg-muted/50">
                                    <TableCell colSpan={3} className="font-bold text-foreground text-right pr-4">
                                        Total del día
                                    </TableCell>
                                    <TableCell className="font-mono font-bold text-foreground">
                                        {data!.ventas.reduce((s, v) => s + Number(v.total), 0).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    )}
                </div>
            </section>

            {/* ── SECCIÓN 4 — Movimientos Kardex ─────────────────────────────── */}
            <section className="space-y-3">
                <SectionHeader label="Movimientos de Kardex" color="bg-chart-4" />
                <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden transition-all duration-300 hover:shadow-lg">
                    {(data?.movimientos_kardex.length ?? 0) === 0 ? (
                        <EmptyState
                            icon={ArrowLeftRight}
                            title="Sin movimientos"
                            description="No hubo movimientos de stock hoy."
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>Producto / Insumo</TableHead><TableHead>Tipo</TableHead>
                                    <TableHead>Cantidad</TableHead><TableHead>Motivo</TableHead><TableHead>Hora</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data!.movimientos_kardex.map(m => {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const rm = m as any;
                                    const nombre = rm.producto?.nombre_modelo ?? rm.insumo?.nombre ?? rm.nombre ?? '—';
                                    const horaStr = new Date(rm.fecha ?? rm.hora).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
                                    return (
                                        <TableRow key={rm.id_kardex ?? rm.id}>
                                            <TableCell className="font-medium text-foreground">{nombre}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={clsx('font-medium capitalize', KARDEX_BADGE[rm.tipo as TipoMovimiento])}>
                                                    {rm.tipo}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-foreground">{rm.cantidad}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{rm.motivo ?? '—'}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground/70 tabular-nums">{horaStr}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </section>

            {/* ── SECCIÓN 5 — Alertas críticas ───────────────────────────────── */}
            <section className="space-y-3">
                <SectionHeader label="Alertas críticas" color="bg-destructive" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur p-4 space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Productos
                        </p>
                        <AlertasList items={data?.alertas.productos ?? []} label="Productos" />
                    </div>
                    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur p-4 space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Insumos
                        </p>
                        <AlertasList items={data?.alertas.insumos ?? []} label="Insumos" />
                    </div>
                </div>
            </section>

            {/* ── SECCIÓN 6 — Log de actividad ───────────────────────────────── */}
            <section className="space-y-3">
                <SectionHeader label="Log de actividad" color="bg-muted-foreground" />
                <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden transition-all duration-300 hover:shadow-lg">
                    {actividad.length === 0 ? (
                        <EmptyState
                            icon={CalendarCheck}
                            title="Sin actividad"
                            description="No se registró actividad hoy."
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>Hora</TableHead><TableHead>Usuario</TableHead><TableHead>Módulo</TableHead>
                                    <TableHead>Acción</TableHead><TableHead>Descripción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logSlice.map((log, idx) => {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const rl = log as any;
                                    const horaLog = new Date(rl.fecha).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
                                    const usuario = rl.usuario?.nombre ?? rl.usuario?.email ?? 'Sistema';
                                    return (
                                        <TableRow key={rl.id ?? rl.id_auditoria ?? idx}>
                                            <TableCell className="text-xs text-muted-foreground/70 tabular-nums whitespace-nowrap">
                                                {horaLog}
                                            </TableCell>
                                            <TableCell className="text-sm font-medium text-foreground">
                                                {usuario}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={clsx('font-medium capitalize', MODULO_BADGE[rl.modulo as ModuloAuditoria] ?? 'bg-muted text-muted-foreground border-border')}>
                                                    {rl.modulo}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={clsx('font-semibold', ACCION_BADGE[rl.accion as AccionAuditoria] ?? 'bg-muted text-muted-foreground border-border')}>
                                                    {rl.accion}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{rl.descripcion}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}

                    {/* Paginación log */}
                    {logTotal > LOG_PAGE && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 text-xs text-muted-foreground">
                            <span>
                                {(logPage - 1) * LOG_PAGE + 1}–{Math.min(logPage * LOG_PAGE, logTotal)} de {logTotal}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7"
                                        onClick={() => setLogPage(p => Math.max(1, p - 1))} disabled={logPage === 1}>
                                    <ChevronLeft size={14} />
                                </Button>
                                <span className="px-2">{logPage} / {logPages}</span>
                                <Button variant="ghost" size="icon" className="h-7 w-7"
                                        onClick={() => setLogPage(p => Math.min(logPages, p + 1))} disabled={logPage === logPages}>
                                    <ChevronRight size={14} />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatHora(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function today(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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
import type {
    ReporteDiario, ReporteDiarioPedido, ReporteDiarioAlertaItem,
    TipoMovimiento, ModuloAuditoria, AccionAuditoria,
} from '@/types';

// ─── Constantes ───────────────────────────────────────────────────────────────

const REFRESH_MS = 5 * 60 * 1000; // 5 minutos
const LOG_PAGE   = 10;

// ─── Badge helpers ────────────────────────────────────────────────────────────

const KARDEX_BADGE: Record<TipoMovimiento, string> = {
    entrada: 'bg-green-100 text-green-700 border border-green-200',
    salida:  'bg-red-100   text-red-700   border border-red-200',
    ajuste:  'bg-yellow-100 text-yellow-700 border border-yellow-200',
};

const MODULO_BADGE: Record<ModuloAuditoria, string> = {
    auth:      'bg-purple-100 text-purple-700 border border-purple-200',
    pedidos:   'bg-blue-100   text-blue-700   border border-blue-200',
    clientes:  'bg-green-100  text-green-700  border border-green-200',
    productos: 'bg-orange-100 text-orange-700 border border-orange-200',
};

const ACCION_BADGE: Record<AccionAuditoria, string> = {
    CREATE: 'bg-green-100  text-green-700  border border-green-200',
    UPDATE: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    DELETE: 'bg-red-100    text-red-700    border border-red-200',
    LOGIN:  'bg-purple-100 text-purple-700 border border-purple-200',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label, color = 'bg-dorado-500' }: { label: string; color?: string }) {
    return (
        <div className="flex items-center gap-2.5">
            <div className={clsx('w-1 h-5 rounded-full', color)} />
            <h2 className="text-xs font-semibold text-cafe-700 uppercase tracking-widest">{label}</h2>
        </div>
    );
}

function KpiCard({
    icon: Icon, label, value, sub, colorIcon, colorBg,
}: {
    icon: React.ElementType; label: string; value: string | number;
    sub?: string; colorIcon: string; colorBg: string;
}) {
    return (
        <div className="card p-4 flex items-start gap-3">
            <div className={clsx('p-2.5 rounded-lg border flex-shrink-0', colorBg)}>
                <Icon size={18} className={colorIcon} />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-cafe-500 leading-tight">{label}</p>
                <p className="text-2xl font-bold text-cafe-900 leading-tight mt-0.5">{value}</p>
                {sub && <p className="text-xs text-cafe-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                'px-4 py-1.5 rounded-full text-xs font-medium border transition-colors',
                active
                    ? 'bg-cafe-800 text-white border-cafe-800'
                    : 'bg-white text-cafe-600 border-surface-border hover:border-cafe-400',
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
        <table className="table w-full">
            <thead>
                <tr>
                    <th>#</th><th>Cliente</th><th>Producto</th><th>Categoría</th><th>Estado</th><th>Hora</th>
                </tr>
            </thead>
            <tbody>
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
                        <tr key={`${raw.id_pedido}-${raw.hora ?? raw.fecha_entrega}`}>
                            <td className="font-mono text-cafe-500">#{raw.id_pedido}</td>
                            <td className="font-medium text-cafe-800">{clienteNombre}</td>
                            <td className="text-cafe-600">{productoNombre}</td>
                            <td className="text-xs text-cafe-500 capitalize">{raw.categoria ?? '—'}</td>
                            <td><StatusBadge estado={raw.estado} size="sm" /></td>
                            <td className="text-xs text-cafe-400 tabular-nums">{formatHora(raw.hora ?? raw.fecha_entrega)}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

function AlertasList({ items, label }: { items: ReporteDiarioAlertaItem[]; label: string }) {
    if (items.length === 0) {
        return (
            <div className="text-sm text-cafe-400 py-4 text-center">
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
                        critico ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200',
                    )}
                >
                    <span className={clsx('font-medium', critico ? 'text-red-800' : 'text-amber-800')}>
                        {nombre}
                    </span>
                    <span className={clsx('text-xs font-mono', critico ? 'text-red-600' : 'text-amber-600')}>
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
                <div className="h-8 bg-crema-dark rounded w-64" />
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
                    <button
                        onClick={() => void cargar()}
                        className="p-1.5 rounded text-cafe-500 hover:text-cafe-900 hover:bg-crema-dark transition-colors"
                        title="Actualizar"
                    >
                        <RefreshCw size={15} />
                    </button>
                    <button
                        onClick={() => void descargarPdf()}
                        disabled={loadingPdf}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500
                                   text-white text-xs font-medium disabled:opacity-60 transition-colors"
                    >
                        {loadingPdf
                            ? <><Loader2 size={12} className="animate-spin" /> Generando...</>
                            : <><FileText size={12} /> Descargar PDF</>
                        }
                    </button>
                    <button
                        onClick={() => void descargarExcel()}
                        disabled={loadingXls}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-700 hover:bg-green-600
                                   text-white text-xs font-medium disabled:opacity-60 transition-colors"
                    >
                        {loadingXls
                            ? <><Loader2 size={12} className="animate-spin" /> Exportando...</>
                            : <><FileSpreadsheet size={12} /> Descargar Excel</>
                        }
                    </button>
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
                        colorIcon="text-blue-600"
                        colorBg="bg-blue-50 border-blue-100"
                    />
                    <KpiCard
                        icon={ArrowRight}
                        label="Pedidos movidos"
                        value={r?.pedidos_movidos ?? 0}
                        colorIcon="text-orange-600"
                        colorBg="bg-orange-50 border-orange-100"
                    />
                    <KpiCard
                        icon={DollarSign}
                        label="Ventas del día"
                        value={`Bs. ${(r?.ventas_total ?? 0).toFixed(2)}`}
                        colorIcon="text-green-600"
                        colorBg="bg-green-50 border-green-100"
                    />
                    <KpiCard
                        icon={ArrowLeftRight}
                        label="Mov. Kardex"
                        value={r?.movimientos_kardex ?? 0}
                        colorIcon="text-purple-600"
                        colorBg="bg-purple-50 border-purple-100"
                    />
                    <KpiCard
                        icon={AlertTriangle}
                        label="Alertas críticas"
                        value={r?.alertas_criticas ?? 0}
                        colorIcon="text-red-600"
                        colorBg="bg-red-50 border-red-100"
                    />
                </div>
            </section>

            {/* ── SECCIÓN 2 — Pedidos del día ────────────────────────────────── */}
            <section className="space-y-3">
                <SectionHeader label="Pedidos del día" color="bg-blue-500" />
                <div className="flex gap-2">
                    <TabBtn active={tabPedidos === 'creados'} onClick={() => setTabPedidos('creados')}>
                        Creados ({data?.pedidos_creados.length ?? 0})
                    </TabBtn>
                    <TabBtn active={tabPedidos === 'movidos'} onClick={() => setTabPedidos('movidos')}>
                        Movidos ({data?.pedidos_movidos.length ?? 0})
                    </TabBtn>
                </div>
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <PedidosTable pedidos={pedidosMostrar} />
                    </div>
                </div>
            </section>

            {/* ── SECCIÓN 3 — Ventas del día ─────────────────────────────────── */}
            <section className="space-y-3">
                <SectionHeader label="Ventas del día" color="bg-green-500" />
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        {(data?.ventas.length ?? 0) === 0 ? (
                            <EmptyState
                                icon={DollarSign}
                                title="Sin ventas registradas"
                                description="No se registraron ventas completadas hoy."
                            />
                        ) : (
                            <table className="table w-full">
                                <thead>
                                    <tr>
                                        <th>Cliente</th><th>Producto</th><th>Cantidad</th><th>Total Bs.</th>
                                    </tr>
                                </thead>
                                <tbody>
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
                                            <tr key={rv.id_pedido}>
                                                <td className="font-medium text-cafe-800">{vCliente}</td>
                                                <td className="text-cafe-600">{vProducto}</td>
                                                <td className="text-cafe-600 text-sm">
                                                    {rv.cantidad} {String(rv.unidad ?? '').replace('_', ' ')}
                                                </td>
                                                <td className="font-mono text-amber-600 font-semibold">
                                                    {Number(rv.total).toFixed(2)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {/* Fila total */}
                                    <tr className="border-t-2 border-cafe-200 bg-cafe-50">
                                        <td colSpan={3} className="font-bold text-cafe-900 text-right pr-4">
                                            Total del día
                                        </td>
                                        <td className="font-mono font-bold text-cafe-900">
                                            {data!.ventas.reduce((s, v) => s + Number(v.total), 0).toFixed(2)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </section>

            {/* ── SECCIÓN 4 — Movimientos Kardex ─────────────────────────────── */}
            <section className="space-y-3">
                <SectionHeader label="Movimientos de Kardex" color="bg-purple-500" />
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        {(data?.movimientos_kardex.length ?? 0) === 0 ? (
                            <EmptyState
                                icon={ArrowLeftRight}
                                title="Sin movimientos"
                                description="No hubo movimientos de stock hoy."
                            />
                        ) : (
                            <table className="table w-full">
                                <thead>
                                    <tr>
                                        <th>Producto / Insumo</th><th>Tipo</th><th>Cantidad</th><th>Motivo</th><th>Hora</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data!.movimientos_kardex.map(m => {
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        const rm = m as any;
                                        const nombre = rm.producto?.nombre_modelo ?? rm.insumo?.nombre ?? rm.nombre ?? '—';
                                        const horaStr = new Date(rm.fecha ?? rm.hora).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
                                        return (
                                            <tr key={rm.id_kardex ?? rm.id}>
                                                <td className="font-medium text-cafe-800">{nombre}</td>
                                                <td>
                                                    <span className={clsx(
                                                        'inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize',
                                                        KARDEX_BADGE[rm.tipo as TipoMovimiento],
                                                    )}>
                                                        {rm.tipo}
                                                    </span>
                                                </td>
                                                <td className="font-mono text-cafe-700">{rm.cantidad}</td>
                                                <td className="text-cafe-500 text-sm max-w-xs truncate">{rm.motivo ?? '—'}</td>
                                                <td className="text-xs text-cafe-400 tabular-nums">{horaStr}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </section>

            {/* ── SECCIÓN 5 — Alertas críticas ───────────────────────────────── */}
            <section className="space-y-3">
                <SectionHeader label="Alertas críticas" color="bg-red-500" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card p-4 space-y-3">
                        <p className="text-xs font-semibold text-cafe-700 uppercase tracking-wide">
                            Productos
                        </p>
                        <AlertasList items={data?.alertas.productos ?? []} label="Productos" />
                    </div>
                    <div className="card p-4 space-y-3">
                        <p className="text-xs font-semibold text-cafe-700 uppercase tracking-wide">
                            Insumos
                        </p>
                        <AlertasList items={data?.alertas.insumos ?? []} label="Insumos" />
                    </div>
                </div>
            </section>

            {/* ── SECCIÓN 6 — Log de actividad ───────────────────────────────── */}
            <section className="space-y-3">
                <SectionHeader label="Log de actividad" color="bg-cafe-500" />
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        {actividad.length === 0 ? (
                            <EmptyState
                                icon={CalendarCheck}
                                title="Sin actividad"
                                description="No se registró actividad hoy."
                            />
                        ) : (
                            <table className="table w-full">
                                <thead>
                                    <tr>
                                        <th>Hora</th><th>Usuario</th><th>Módulo</th><th>Acción</th><th>Descripción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logSlice.map((log, idx) => {
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        const rl = log as any;
                                        const horaLog = new Date(rl.fecha).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
                                        const usuario = rl.usuario?.nombre ?? rl.usuario?.email ?? 'Sistema';
                                        return (
                                            <tr key={rl.id ?? rl.id_auditoria ?? idx}>
                                                <td className="text-xs text-cafe-400 tabular-nums whitespace-nowrap">
                                                    {horaLog}
                                                </td>
                                                <td className="text-sm font-medium text-cafe-800">
                                                    {usuario}
                                                </td>
                                                <td>
                                                    <span className={clsx(
                                                        'inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize',
                                                        MODULO_BADGE[rl.modulo as ModuloAuditoria] ?? 'bg-gray-100 text-gray-600 border border-gray-200',
                                                    )}>
                                                        {rl.modulo}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={clsx(
                                                        'inline-block text-xs font-semibold px-2 py-0.5 rounded-full',
                                                        ACCION_BADGE[rl.accion as AccionAuditoria] ?? 'bg-gray-100 text-gray-600 border border-gray-200',
                                                    )}>
                                                        {rl.accion}
                                                    </span>
                                                </td>
                                                <td className="text-sm text-cafe-700 max-w-xs truncate">{rl.descripcion}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Paginación log */}
                    {logTotal > LOG_PAGE && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border text-xs text-cafe-500">
                            <span>
                                {(logPage - 1) * LOG_PAGE + 1}–{Math.min(logPage * LOG_PAGE, logTotal)} de {logTotal}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setLogPage(p => Math.max(1, p - 1))}
                                    disabled={logPage === 1}
                                    className="p-1 rounded hover:bg-crema-dark disabled:opacity-40 transition-colors"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <span className="px-2">{logPage} / {logPages}</span>
                                <button
                                    onClick={() => setLogPage(p => Math.min(logPages, p + 1))}
                                    disabled={logPage === logPages}
                                    className="p-1 rounded hover:bg-crema-dark disabled:opacity-40 transition-colors"
                                >
                                    <ChevronRight size={14} />
                                </button>
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

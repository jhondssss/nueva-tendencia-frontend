import { useEffect, useState } from 'react';
import {
    PlusCircle, ArrowRight, DollarSign, ArrowLeftRight,
    AlertTriangle, FileText, FileSpreadsheet, Loader2,
    CalendarCheck, RefreshCw,
} from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import { useReporteDiario } from '@/hooks/useReporteDiario';
import EmptyState from '@/components/shared/EmptyState';
import { KpiSkeleton, TableSkeleton } from '@/components/shared/Skeleton';
import { Button } from '@/components/ui/button';
import {
    SectionHeader, KpiCard, TabBtn,
    PedidosTable, VentasTable, KardexTable, AlertasList, ActividadLog,
} from '@/components/reportes/ReporteDiarioWidgets';

export default function ReporteDiarioView() {
    const { isAdmin } = useRole();
    const { data, loading, cargar, loadingPdf, loadingXls, descargarPdf, descargarExcel } = useReporteDiario();
    const [tabPedidos, setTabPedidos] = useState<'creados' | 'movidos'>('creados');

    useEffect(() => {
        document.title = 'Reporte Diario | NT';
    }, []);

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

    const fechaHoy = new Date().toLocaleDateString('es-BO', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    const fechaLabel = fechaHoy.charAt(0).toUpperCase() + fechaHoy.slice(1);

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
                    <VentasTable ventas={data?.ventas ?? []} />
                </div>
            </section>

            {/* ── SECCIÓN 4 — Movimientos Kardex ─────────────────────────────── */}
            <section className="space-y-3">
                <SectionHeader label="Movimientos de Kardex" color="bg-chart-4" />
                <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden transition-all duration-300 hover:shadow-lg">
                    <KardexTable movimientos={data?.movimientos_kardex ?? []} />
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
                    <ActividadLog actividad={data?.actividad ?? []} />
                </div>
            </section>

        </div>
    );
}

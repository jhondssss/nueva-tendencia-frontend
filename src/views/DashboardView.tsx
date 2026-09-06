import React, { useEffect, useMemo, useState } from 'react';
import {
    ResponsiveContainer, Tooltip, Cell,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Legend,
} from 'recharts';
import { isToday, isThisWeek, isThisMonth } from 'date-fns';
import { Clock, Scissors, Hammer, Layers, Package, CheckCircle, PieChart as PieChartIcon, GitBranch, Inbox, AlertTriangle } from 'lucide-react';
import { useDashboardStore, usePedidoStore, useInsumoStore } from '@/stores/index';
import { useRole } from '@/hooks/useRole';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { clsx } from 'clsx';
import StatusBadge from '@/components/shared/StatusBadge';
import type { EstadoPedido } from '@/types';
import KpiCards from '@/components/dashboard/KpiCards';
import GraficoVentas from '@/components/dashboard/GraficoVentas';
import TopProductos from '@/components/dashboard/TopProductos';
import PrediccionStock from '@/components/dashboard/PrediccionStock';
import PedidosVencidos from '@/components/dashboard/PedidosVencidos';
import StageBarChart from '@/components/dashboard/StageBarChart';
import ProduccionActivaOperario from '@/components/dashboard/ProduccionActivaOperario';
import { InsumosAlertBanner } from '@/components/insumos/InsumosAlertBanner';

// ── Actividad reciente ──────────────────────────────────────────────────────
const ACTIVITY_ICON: Record<string, { icon: React.ElementType; text: string; bg: string }> = {
    Pendiente: { icon: Clock,       text: 'text-chart-3',   bg: 'bg-chart-3/10 border-chart-3/30'     },
    Cortado:   { icon: Scissors,    text: 'text-chart-4',   bg: 'bg-chart-4/10 border-chart-4/30'     },
    Aparado:   { icon: Hammer,      text: 'text-chart-1',   bg: 'bg-chart-1/10 border-chart-1/30'     },
    Solado:    { icon: Layers,      text: 'text-chart-5',   bg: 'bg-chart-5/10 border-chart-5/30'     },
    Empaque:   { icon: Package,     text: 'text-chart-2',   bg: 'bg-chart-2/10 border-chart-2/30'     },
    Terminado: { icon: CheckCircle, text: 'text-secondary', bg: 'bg-secondary/10 border-secondary/30' },
};
function formatFechaBO(iso: string) {
    return new Date(iso).toLocaleString('es-BO', {
        timeZone: 'America/La_Paz',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// Colores atados a los CSS custom properties del tema (--chart-1..5, --secondary)
// para que el pipeline Pendiente→Terminado use la misma paleta en todo el dashboard.
const STATUS_COLORS: Record<string, string> = {
    Pendiente: 'hsl(var(--chart-3))', Cortado: 'hsl(var(--chart-4))', Aparado: 'hsl(var(--chart-1))',
    Solado: 'hsl(var(--chart-5))', Empaque: 'hsl(var(--chart-2))', Terminado: 'hsl(var(--secondary))',
};
const MESES_ABR_DASH = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const CAT_COLORS     = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];
const CAT_LABELS: Record<string, string> = { adulto: 'Adulto', juvenil: 'Juvenil', nino: 'Niño' };
const TOOLTIP_STYLE = {
    contentStyle: { background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 6 },
    labelStyle:   { color: 'hsl(var(--popover-foreground))', fontSize: 12 },
    itemStyle:    { color: 'hsl(var(--muted-foreground))', fontSize: 12 },
};
const GRID_STROKE = 'hsl(var(--border))';
const AXIS_TICK   = 'hsl(var(--muted-foreground))';

// ── SVG Donut puro ──────────────────────────────────────────────────────────
const CX = 90, CY = 90, R_OUT = 80, R_IN = 50;

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(startAngle: number, endAngle: number): string {
    const gap = 1.5;
    const s = startAngle + gap / 2;
    const e = endAngle - gap / 2;
    if (e - s <= 0) return '';
    const largeArc = e - s > 180 ? 1 : 0;
    const p1 = polarToXY(CX, CY, R_OUT, s);
    const p2 = polarToXY(CX, CY, R_OUT, e);
    const p3 = polarToXY(CX, CY, R_IN,  e);
    const p4 = polarToXY(CX, CY, R_IN,  s);
    return [
        `M ${p1.x.toFixed(3)} ${p1.y.toFixed(3)}`,
        `A ${R_OUT} ${R_OUT} 0 ${largeArc} 1 ${p2.x.toFixed(3)} ${p2.y.toFixed(3)}`,
        `L ${p3.x.toFixed(3)} ${p3.y.toFixed(3)}`,
        `A ${R_IN} ${R_IN} 0 ${largeArc} 0 ${p4.x.toFixed(3)} ${p4.y.toFixed(3)}`,
        'Z',
    ].join(' ');
}

function DonutChart({ data }: { data: { estado: string; cantidad: number }[] }) {
    const total = data.reduce((s, d) => s + d.cantidad, 0);
    if (total === 0) return null;

    let currentAngle = 0;
    const slices = data.map(d => {
        const sweep = (d.cantidad / total) * 360;
        const path = slicePath(currentAngle, currentAngle + sweep);
        const result = { ...d, path, color: STATUS_COLORS[d.estado] ?? STATUS_COLORS.Pendiente };
        currentAngle += sweep;
        return result;
    });

    return (
        <svg width={180} height={180} viewBox="0 0 180 180">
            {slices.map(s => (
                <path key={s.estado} d={s.path} fill={s.color} />
            ))}
            <text x={CX} y={CY - 6} textAnchor="middle" fontSize={22} fontWeight={600}
                  fontFamily="'Playfair Display', Georgia, serif" className="fill-foreground">
                {total}
            </text>
            <text x={CX} y={CY + 12} textAnchor="middle" fontSize={9} fontFamily="'DM Sans', system-ui, sans-serif"
                  className="fill-muted-foreground" letterSpacing="0.08em">
                PEDIDOS
            </text>
        </svg>
    );
}

function EmptyChartState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
            <Icon size={26} className="text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">{message}</p>
        </div>
    );
}

// ── Filtro de rango para Actividad reciente ─────────────────────────────────
type FiltroActividad = 'hoy' | 'semana' | 'mes' | 'todo';
const FILTROS_ACTIVIDAD: { value: FiltroActividad; label: string }[] = [
    { value: 'hoy',    label: 'Hoy' },
    { value: 'semana', label: 'Esta semana' },
    { value: 'mes',    label: 'Este mes' },
    { value: 'todo',   label: 'Todo' },
];
function filtrarPorRango<T extends { fecha: string }>(items: T[], filtro: FiltroActividad): T[] {
    if (filtro === 'todo') return items;
    return items.filter(item => {
        const fecha = new Date(item.fecha);
        if (filtro === 'hoy')    return isToday(fecha);
        if (filtro === 'semana') return isThisWeek(fecha, { weekStartsOn: 1 });
        return isThisMonth(fecha);
    });
}

export default function DashboardView() {
    const { kpis, ordersStatus, productionFunnel: produccionPorEtapa, recentActivity,
            topProductos, ventasPorMes, prediccionStock, proximosAEntregar, isLoading, error, fetchAll } = useDashboardStore();

    const { isAdmin, isOperario } = useRole();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [filtroActividad, setFiltroActividad] = useState<FiltroActividad>('todo');

    const pedidos       = usePedidoStore(s => s.pedidos);
    const fetchPedidos  = usePedidoStore(s => s.fetchAll);

    const insumoAlertas      = useInsumoStore(s => s.alertas);
    const fetchInsumoAlertas = useInsumoStore(s => s.fetchAlertas);

    useEffect(() => { fetchAll(); fetchPedidos(); }, [fetchAll, fetchPedidos]);
    useEffect(() => { if (isOperario) fetchInsumoAlertas(); }, [isOperario, fetchInsumoAlertas]);

    const barData = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const base = MESES_ABR_DASH.map(m => ({ mes: m, total: 0 }));
        ventasPorMes.forEach(item => {
            const s     = String(item.mes);
            const yearM = s.match(/\b(20\d{2})\b/);
            const year  = yearM ? parseInt(yearM[1]) : null;
            if (year !== null && year !== currentYear) return;
            const isoM  = s.match(/(\d{4})-(\d{1,2})/);
            const month = isoM ? parseInt(isoM[2]) : parseInt(s);
            if (month >= 1 && month <= 12) base[month - 1].total = Number(item.total);
        });
        return base;
    }, [ventasPorMes]);

    const categoriasData = useMemo(() => {
        const counts: Record<string, number> = { adulto: 0, juvenil: 0, nino: 0 };
        pedidos.forEach(p => { if (p.categoria) counts[p.categoria] = (counts[p.categoria] ?? 0) + 1; });
        return (['adulto', 'juvenil', 'nino'] as const)
            .map(cat => ({ name: CAT_LABELS[cat], value: counts[cat] }))
            .filter(d => d.value > 0);
    }, [pedidos]);

    const totalCategorias = useMemo(() =>
        categoriasData.reduce((s, d) => s + d.value, 0),
    [categoriasData]);

    const actividadFiltrada = useMemo(() =>
        filtrarPorRango(recentActivity, filtroActividad),
    [recentActivity, filtroActividad]);

    useEffect(() => { document.title = 'Dashboard | NT'; }, []);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Centro de Mando</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Resumen operativo en tiempo real</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                    Sistema activo
                </div>
            </div>

            {error && !isLoading && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertTriangle size={16} className="flex-shrink-0" />
                        <span>No se pudo cargar la información del dashboard. Intentá de nuevo.</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => fetchAll()}>Reintentar</Button>
                </div>
            )}

            <KpiCards kpis={kpis} isLoading={isLoading} />

            {!isLoading && <PedidosVencidos pedidosVencidos={proximosAEntregar} />}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur">
                    <h3 className="font-display text-base font-semibold tracking-tight text-foreground mb-4">Estado de Pedidos</h3>
                    {isLoading ? (
                        <Skeleton className="h-48 w-full rounded-lg" />
                    ) : ordersStatus.length === 0 ? (
                        <EmptyChartState icon={PieChartIcon} message="Sin datos disponibles" />
                    ) : (
                        <div className="flex items-center gap-4">
                            <div style={{ flexShrink: 0 }}>
                                <DonutChart data={ordersStatus} />
                            </div>
                            <div className="flex-1 space-y-2">
                                {ordersStatus.map(({ estado, cantidad }) => (
                                    <div key={estado} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                                                style={{ background: STATUS_COLORS[estado] ?? STATUS_COLORS.Pendiente }}
                                            />
                                            <span className="text-muted-foreground">{estado}</span>
                                        </div>
                                        <span className="font-mono font-medium text-foreground">{cantidad}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur">
                    <h3 className="font-display text-base font-semibold tracking-tight text-foreground mb-4">Producción por Etapa</h3>
                    {isLoading ? <Skeleton className="h-48 w-full rounded-lg" /> : produccionPorEtapa.length === 0 ? (
                        <EmptyChartState icon={GitBranch} message="Sin datos disponibles" />
                    ) : (
                        <StageBarChart data={produccionPorEtapa} />
                    )}
                </div>
            </div>

            {isOperario && (
                <>
                    <InsumosAlertBanner alertas={insumoAlertas} />
                    <ProduccionActivaOperario pedidos={pedidos} isLoading={isLoading} />
                </>
            )}

            {isAdmin && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* BarChart — Pedidos por mes */}
                    <div className="rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur">
                        <h3 className="font-display text-base font-semibold tracking-tight text-foreground mb-4">Pedidos por Mes</h3>
                        {isLoading ? (
                            <Skeleton className="h-52 w-full rounded-lg" />
                        ) : barData.every(d => d.total === 0) ? (
                            <EmptyChartState icon={Package} message="Sin datos disponibles" />
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                                    <XAxis dataKey="mes" tick={{ fill: AXIS_TICK, fontSize: 11 }}
                                           axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: AXIS_TICK, fontSize: 11 }}
                                           axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip
                                        {...TOOLTIP_STYLE}
                                        formatter={(v) => [v, 'Pedidos']}
                                    />
                                    <Bar dataKey="total" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} maxBarSize={36} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* PieChart — Producción por categoría */}
                    <div className="rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur">
                        <h3 className="font-display text-base font-semibold tracking-tight text-foreground mb-4">Producción por Categoría</h3>
                        {isLoading ? (
                            <Skeleton className="h-52 w-full rounded-lg" />
                        ) : categoriasData.length === 0 ? (
                            <EmptyChartState icon={PieChartIcon} message="Sin datos disponibles" />
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={categoriasData} dataKey="value" nameKey="name"
                                         cx="50%" cy="45%" outerRadius={72} paddingAngle={2}>
                                        {categoriasData.map((entry, i) => (
                                            <Cell key={entry.name} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        {...TOOLTIP_STYLE}
                                        formatter={(value, name) => {
                                            const pct = totalCategorias > 0
                                                ? ((Number(value) / totalCategorias) * 100).toFixed(1)
                                                : '0';
                                            return [`${value} (${pct}%)`, name];
                                        }}
                                    />
                                    <Legend
                                        iconSize={10}
                                        iconType="circle"
                                        formatter={(value) => {
                                            const item = categoriasData.find(d => d.name === value);
                                            const pct  = item && totalCategorias > 0
                                                ? ((item.value / totalCategorias) * 100).toFixed(1)
                                                : '0';
                                            return `${value}  ${pct}%`;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            )}

            <TopProductos topProductos={topProductos} isLoading={isLoading} />

            <GraficoVentas ventasPorMes={ventasPorMes} selectedYear={selectedYear}
                           onYearChange={setSelectedYear} isLoading={isLoading} />

            <PrediccionStock prediccionStock={prediccionStock} isLoading={isLoading} />

            {!isOperario && (
                <div className="rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <h3 className="font-display text-base font-semibold tracking-tight text-foreground">Actividad Reciente</h3>
                        <div className="flex items-center gap-1.5">
                            {FILTROS_ACTIVIDAD.map(({ value, label }) => (
                                <Button
                                    key={value}
                                    size="sm"
                                    variant={filtroActividad === value ? 'default' : 'outline'}
                                    onClick={() => setFiltroActividad(value)}
                                    className={clsx('h-7 px-2.5 text-xs transition-all duration-200 hover:scale-[1.01]')}
                                >
                                    {label}
                                </Button>
                            ))}
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex gap-3">
                                    <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-3 w-3/4" />
                                        <Skeleton className="h-3 w-1/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : actividadFiltrada.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                            <Inbox size={26} className="text-muted-foreground/50" />
                            <p className="text-muted-foreground text-sm">
                                {recentActivity.length === 0
                                    ? 'No hay actividad reciente'
                                    : 'No hay actividad en el rango seleccionado'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {actividadFiltrada.map(act => {
                                const cfg = ACTIVITY_ICON[act.estado] ?? ACTIVITY_ICON['Pendiente'];
                                const IconComp = cfg.icon;
                                return (
                                    <div key={act.id} className="flex items-start gap-3">
                                        <div className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                                            <IconComp size={13} className={cfg.text} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-foreground leading-snug">{act.descripcion}</p>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <StatusBadge estado={act.estado as EstadoPedido} size="sm" />
                                                {act.cliente && (
                                                    <span className="text-xs text-muted-foreground truncate">{act.cliente}</span>
                                                )}
                                                <span className="text-xs text-muted-foreground/70 ml-auto">{formatFechaBO(act.fecha)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

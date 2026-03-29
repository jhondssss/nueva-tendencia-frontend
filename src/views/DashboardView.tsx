import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, Tooltip, FunnelChart, Funnel, LabelList, Cell } from 'recharts';
import { Clock, Scissors, Hammer, Layers, Package, CheckCircle } from 'lucide-react';
import { useDashboardStore } from '@/stores/index';
import { useRole } from '@/hooks/useRole';
import { Skeleton } from '@/components/shared/Skeleton';
import KpiCards from '@/components/dashboard/KpiCards';
import GraficoVentas from '@/components/dashboard/GraficoVentas';
import TopProductos from '@/components/dashboard/TopProductos';
import PrediccionStock from '@/components/dashboard/PrediccionStock';
import PedidosVencidos from '@/components/dashboard/PedidosVencidos';

// ── Actividad reciente ──────────────────────────────────────────────────────
const ACTIVITY_ICON: Record<string, { icon: React.ElementType; iconClass: string; bgClass: string }> = {
    Pendiente: { icon: Clock,        iconClass: 'text-dorado-600',  bgClass: 'bg-dorado-500/10 border-dorado-300' },
    Cortado:   { icon: Scissors,     iconClass: 'text-cafe-600',    bgClass: 'bg-cafe-100 border-cafe-300'        },
    Aparado:   { icon: Hammer,       iconClass: 'text-cafe-700',    bgClass: 'bg-cafe-200/60 border-cafe-300'     },
    Solado:    { icon: Layers,       iconClass: 'text-cafe-800',    bgClass: 'bg-cafe-200 border-cafe-400'        },
    Empaque:   { icon: Package,      iconClass: 'text-dorado-700',  bgClass: 'bg-dorado-500/10 border-dorado-300' },
    Terminado: { icon: CheckCircle,  iconClass: 'text-cafe-900',    bgClass: 'bg-cafe-100 border-cafe-400'        },
};
const ACTIVITY_BADGE: Record<string, string> = {
    Pendiente: 'bg-dorado-500/10 text-dorado-700 border-dorado-300',
    Cortado:   'bg-cafe-100 text-cafe-700 border-cafe-300',
    Aparado:   'bg-cafe-200/60 text-cafe-800 border-cafe-300',
    Solado:    'bg-cafe-200 text-cafe-900 border-cafe-400',
    Empaque:   'bg-dorado-500/10 text-dorado-800 border-dorado-400',
    Terminado: 'bg-cafe-800 text-crema border-cafe-900',
};
function formatFechaBO(iso: string) {
    const d = new Date(new Date(iso).getTime() - 4 * 60 * 60 * 1000);
    return d.toLocaleString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const STATUS_COLORS: Record<string, string> = {
    Pendiente: '#C6A75E', Cortado: '#9A6B1A', Aparado: '#8B5E3C', Solado: '#6B4020', Empaque: '#4A2810', Terminado: '#2C1810',
};
const FUNNEL_COLORS = ['#C6A75E', '#9A6B1A', '#8B5E3C', '#6B4020', '#4A2810', '#2C1810'];
const TOOLTIP_STYLE = {
    contentStyle: { background: '#FFFFFF', border: '1px solid #E8DDD4', borderRadius: 6 },
    labelStyle:   { color: '#1C1008', fontSize: 12 },
    itemStyle:    { color: '#4E3020', fontSize: 12 },
};

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

function DonutChart({ data }: { data: { estado: string; count: number }[] }) {
    const total = data.reduce((s, d) => s + d.count, 0);
    if (total === 0) return null;

    let currentAngle = 0;
    const slices = data.map(d => {
        const sweep = (d.count / total) * 360;
        const path = slicePath(currentAngle, currentAngle + sweep);
        const result = { ...d, path, color: STATUS_COLORS[d.estado] ?? '#C6A75E' };
        currentAngle += sweep;
        return result;
    });

    return (
        <svg width={180} height={180} viewBox="0 0 180 180">
            {slices.map(s => (
                <path key={s.estado} d={s.path} fill={s.color} />
            ))}
            <text x={CX} y={CY - 6} textAnchor="middle" fontSize={22} fontWeight={600}
                  fontFamily="'Playfair Display', Georgia, serif" fill="#1C1008">
                {total}
            </text>
            <text x={CX} y={CY + 12} textAnchor="middle" fontSize={9} fontFamily="'DM Sans', system-ui, sans-serif"
                  fill="#8B5E3C" letterSpacing="0.08em">
                PEDIDOS
            </text>
        </svg>
    );
}

export default function DashboardView() {
    const { kpis, ordersStatus, productionFunnel, recentActivity,
            topProductos, ventasPorMes, prediccionStock, proximosAEntregar, isLoading, fetchAll } = useDashboardStore();

    const { isOperario } = useRole();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => { fetchAll(); }, [fetchAll]);
    useEffect(() => { document.title = 'Dashboard | NT'; }, []);
    useEffect(() => { console.log('[Dashboard] ordersStatus:', ordersStatus); }, [ordersStatus]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Centro de Mando</h1>
                    <p className="page-subtitle">Resumen operativo en tiempo real</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-cafe-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Sistema activo
                </div>
            </div>

            <KpiCards kpis={kpis} isLoading={isLoading} />

            {!isLoading && <PedidosVencidos pedidosVencidos={proximosAEntregar} />}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="card p-5">
                    <h3 className="font-display text-base font-medium text-cafe-950 mb-4">Estado de Pedidos</h3>
                    {isLoading ? (
                        <Skeleton className="h-48 w-full rounded-lg" />
                    ) : ordersStatus.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-cafe-400 text-sm">Sin datos disponibles</div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div style={{ flexShrink: 0 }}>
                                <DonutChart data={ordersStatus} />
                            </div>
                            <div className="flex-1 space-y-2">
                                {ordersStatus.map(({ estado, count }) => (
                                    <div key={estado} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                                                style={{ background: STATUS_COLORS[estado] ?? '#C6A75E' }}
                                            />
                                            <span className="text-cafe-700">{estado}</span>
                                        </div>
                                        <span className="font-mono font-medium text-cafe-950">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="card p-5">
                    <h3 className="font-display text-base font-medium text-cafe-950 mb-4">Embudo de Producción</h3>
                    {isLoading ? <Skeleton className="h-48 w-full rounded-lg" /> : productionFunnel.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-cafe-400 text-sm">Sin datos disponibles</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={180}>
                            <FunnelChart>
                                <Tooltip {...TOOLTIP_STYLE} />
                                <Funnel dataKey="cantidad" data={productionFunnel} isAnimationActive>
                                    {productionFunnel.map((_, i) => (
                                        <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                                    ))}
                                    <LabelList position="center" fill="#F7EDE4" stroke="none" dataKey="etapa"
                                               style={{ fontSize: 11, fontFamily: 'DM Sans', fontWeight: 500 }} />
                                </Funnel>
                            </FunnelChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <TopProductos topProductos={topProductos} isLoading={isLoading} />

            <GraficoVentas ventasPorMes={ventasPorMes} selectedYear={selectedYear}
                           onYearChange={setSelectedYear} isLoading={isLoading} />

            <PrediccionStock prediccionStock={prediccionStock} isLoading={isLoading} />

            {!isOperario && <div className="card p-5">
                <h3 className="font-display text-base font-medium text-cafe-950 mb-4">Actividad Reciente</h3>
                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-crema-dark animate-pulse" />
                                <div className="flex-1 space-y-1">
                                    <div className="h-3 w-3/4 bg-crema-dark rounded animate-pulse" />
                                    <div className="h-3 w-1/3 bg-crema-dark rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : recentActivity.length === 0 ? (
                    <p className="text-cafe-400 text-sm">No hay actividad reciente</p>
                ) : (
                    <div className="space-y-3">
                        {recentActivity.map(act => {
                            const cfg = ACTIVITY_ICON[act.estado] ?? ACTIVITY_ICON['Pendiente'];
                            const IconComp = cfg.icon;
                            const badgeCls = ACTIVITY_BADGE[act.estado] ?? ACTIVITY_BADGE['Pendiente'];
                            return (
                                <div key={act.id} className="flex items-start gap-3">
                                    <div className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bgClass}`}>
                                        <IconComp size={13} className={cfg.iconClass} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-cafe-900 leading-snug">{act.descripcion}</p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border ${badgeCls}`}>
                                                {act.estado}
                                            </span>
                                            {act.cliente && (
                                                <span className="text-xs text-cafe-500 truncate">{act.cliente}</span>
                                            )}
                                            <span className="text-xs text-cafe-400 ml-auto">{formatFechaBO(act.fecha)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>}
        </div>
    );
}

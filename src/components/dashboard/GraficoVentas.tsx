import { useMemo } from 'react';
import {
    ResponsiveContainer, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Skeleton } from '@/components/shared/Skeleton';
import { useRole } from '@/hooks/useRole';
import { clsx } from 'clsx';
import type { VentaMes } from '@/types';

const MESES_ABR  = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MESES_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function extractYear(mes: string): number | null {
    const m = mes.match(/\b(20\d{2})\b/);
    return m ? parseInt(m[1]) : null;
}

function extractMonthNum(mes: string): number {
    const iso = mes.match(/(\d{4})-(\d{1,2})/);
    if (iso) return parseInt(iso[2]);
    if (/^\d{1,2}$/.test(mes)) return parseInt(mes);
    const idx = MESES_FULL.findIndex(name =>
        mes.toLowerCase().startsWith(name.substring(0, 3).toLowerCase()),
    );
    return idx >= 0 ? idx + 1 : 0;
}

interface Props {
    ventasPorMes: VentaMes[];
    selectedYear: number;
    onYearChange: (year: number) => void;
    isLoading:    boolean;
}

export default function GraficoVentas({ ventasPorMes, selectedYear, onYearChange, isLoading }: Props) {
    const { isOperario } = useRole();

    const availableYears = useMemo(() => {
        const set = new Set<number>([new Date().getFullYear()]);
        ventasPorMes.forEach(item => {
            const y = extractYear(String(item.mes));
            if (y) set.add(y);
        });
        return Array.from(set).sort((a, b) => b - a);
    }, [ventasPorMes]);

    const chartData = useMemo(() => {
        const base = MESES_ABR.map(label => ({ mes: label, total: 0 }));
        ventasPorMes.forEach(item => {
            const y = extractYear(String(item.mes));
            if (y !== null && y !== selectedYear) return;
            const m = extractMonthNum(String(item.mes));
            if (m >= 1 && m <= 12) base[m - 1].total = Number(item.total);
        });
        return base;
    }, [ventasPorMes, selectedYear]);

    const mejorMes = useMemo(() =>
        chartData.reduce((best, cur) => cur.total > best.total ? cur : best, chartData[0])
    , [chartData]);

    const promedioMensual = useMemo(() => {
        const conDatos = chartData.filter(m => m.total > 0);
        return conDatos.length > 0
            ? conDatos.reduce((s, m) => s + m.total, 0) / conDatos.length
            : 0;
    }, [chartData]);

    const tendencia = useMemo(() => {
        const conDatos = chartData.filter(m => m.total > 0);
        if (conDatos.length < 2) return null;
        const ultimo    = conDatos[conDatos.length - 1];
        const penultimo = conDatos[conDatos.length - 2];
        const pct = penultimo.total > 0
            ? ((ultimo.total - penultimo.total) / penultimo.total) * 100
            : null;
        return { sube: ultimo.total >= penultimo.total, pct, mes: ultimo.mes };
    }, [chartData]);

    if (isOperario) return null;

    return (
        <div className="card p-5">
            <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-base font-medium text-cafe-950">
                    Tendencia de Ventas por Mes
                </h3>
                <div className="flex items-center gap-1.5">
                    {availableYears.length > 1
                        ? availableYears.map(y => (
                            <button key={y} onClick={() => onYearChange(y)}
                                    className={clsx(
                                        'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                                        selectedYear === y
                                            ? 'bg-cafe-800 text-white'
                                            : 'bg-crema text-cafe-600 hover:bg-crema-dark border border-surface-border',
                                    )}>
                                {y}
                            </button>
                        ))
                        : <span className="text-xs text-cafe-400 font-mono">{selectedYear}</span>
                    }
                </div>
            </div>

            {isLoading ? <Skeleton className="h-[300px] w-full rounded-lg" /> : (
                <>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradDorado" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="#C6A75E" stopOpacity={0.22} />
                                    <stop offset="95%" stopColor="#C6A75E" stopOpacity={0}    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E8DDD4" vertical={false} />
                            <XAxis dataKey="mes"
                                   tick={{ fill: '#8B5E3C', fontSize: 11 }}
                                   axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#8B5E3C', fontSize: 11 }}
                                   axisLine={false} tickLine={false}
                                   tickFormatter={v => `Bs. ${Number(v).toLocaleString('en-US')}`}
                                   width={92} />
                            <Tooltip
                                contentStyle={{ background: '#FFFFFF', border: '1px solid #E8DDD4', borderRadius: 6 }}
                                labelStyle={{ color: '#1C1008', fontSize: 12, fontWeight: 600 }}
                                itemStyle={{ color: '#4E3020', fontSize: 12 }}
                                labelFormatter={label => {
                                    const idx = MESES_ABR.indexOf(String(label));
                                    return idx >= 0 ? `${MESES_FULL[idx]} ${selectedYear}` : String(label);
                                }}
                                formatter={value => [
                                    `Bs. ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                                    'Ventas',
                                ]}
                            />
                            <Area type="monotone" dataKey="total"
                                  stroke="#C6A75E" strokeWidth={2}
                                  fill="url(#gradDorado)"
                                  dot={{ fill: '#C6A75E', stroke: '#fff', strokeWidth: 2, r: 4 }}
                                  activeDot={{ fill: '#8B5E3C', r: 6, strokeWidth: 0 }} />
                        </AreaChart>
                    </ResponsiveContainer>

                    <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-surface-border">
                        <div className="text-center">
                            <p className="text-2xs text-cafe-400 uppercase tracking-wider mb-1.5">Mejor mes</p>
                            {mejorMes.total > 0 ? (
                                <>
                                    <p className="text-sm font-semibold text-cafe-900">
                                        {MESES_FULL[MESES_ABR.indexOf(mejorMes.mes)]}
                                    </p>
                                    <p className="text-xs font-mono text-dorado-600">
                                        Bs. {mejorMes.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </>
                            ) : (
                                <p className="text-xs text-cafe-400">Sin datos</p>
                            )}
                        </div>

                        <div className="text-center border-x border-surface-border">
                            <p className="text-2xs text-cafe-400 uppercase tracking-wider mb-1.5">Promedio mensual</p>
                            {promedioMensual > 0 ? (
                                <p className="text-sm font-mono font-semibold text-cafe-900">
                                    Bs. {promedioMensual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            ) : (
                                <p className="text-xs text-cafe-400">Sin datos</p>
                            )}
                        </div>

                        <div className="text-center">
                            <p className="text-2xs text-cafe-400 uppercase tracking-wider mb-1.5">Tendencia</p>
                            {tendencia ? (
                                <div>
                                    <p className={clsx('text-lg font-bold leading-none',
                                        tendencia.sube ? 'text-green-600' : 'text-red-500')}>
                                        {tendencia.sube ? '↑' : '↓'}
                                        {tendencia.pct !== null && (
                                            <span className="text-sm ml-0.5">
                                                {Math.abs(tendencia.pct).toFixed(1)}%
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-2xs text-cafe-400 mt-0.5">vs mes anterior</p>
                                </div>
                            ) : (
                                <p className="text-xs text-cafe-400">Sin comparativa</p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

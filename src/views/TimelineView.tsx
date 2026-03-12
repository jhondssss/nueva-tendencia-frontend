import { useEffect, useState } from 'react';
import { Check, CalendarX } from 'lucide-react';
import { usePedidoStore } from '@/stores/index';
import PageLoader from '@/components/shared/PageLoader';
import type { EstadoPedido, UnidadPedido, Pedido } from '@/types';
import { clsx } from 'clsx';

const PARES_POR_UNIDAD: Record<UnidadPedido, number> = {
    docena:       12,
    media_docena:  6,
    par:           1,
};

function formatCantidad(cantidad: number, unidad: UnidadPedido, cantidadPares?: number): string {
    const pares = cantidadPares ?? cantidad * PARES_POR_UNIDAD[unidad];
    switch (unidad) {
        case 'docena':
            return `${cantidad} ${cantidad === 1 ? 'docena' : 'docenas'} (${pares} pares)`;
        case 'media_docena':
            return `${cantidad} ${cantidad === 1 ? 'media docena' : 'medias docenas'} (${pares} pares)`;
        case 'par':
            return `${cantidad} ${cantidad === 1 ? 'par' : 'pares'}`;
    }
}

const ESTADOS: EstadoPedido[] = ['Pendiente', 'Cortado', 'Aparado', 'Solado', 'Empaque', 'Terminado'];

const MESES = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

function buildYears(): number[] {
    const current = new Date().getFullYear();
    const years: number[] = [];
    for (let y = 2024; y <= current; y++) years.push(y);
    return years;
}

// ─── Tarjeta individual ────────────────────────────────────────────────────────

function PedidoCard({ p }: { p: Pedido }) {
    const currentIdx = ESTADOS.indexOf(p.estado);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaEntrega = new Date(p.fecha_entrega);
    fechaEntrega.setHours(0, 0, 0, 0);
    const vencido = fechaEntrega < hoy && p.estado !== 'Terminado';

    return (
        <div className={clsx('card p-4', vencido && 'border-red-300')}>

            {/* Cabecera */}
            <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-xs text-cafe-400 flex-shrink-0">
                        #{p.id_pedido}
                    </span>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-cafe-950 truncate">
                            {p.cliente.nombre} {p.cliente.apellido ?? ''}
                        </p>
                        <p className="text-xs text-cafe-500 truncate">{p.producto?.nombre_modelo ?? '—'}</p>
                        {p.cantidad != null && p.unidad && (
                            <p className="text-xs text-cafe-400 font-mono mt-0.5">
                                {formatCantidad(p.cantidad, p.unidad, p.cantidad_pares)}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <span className={clsx(
                        'text-xs font-mono flex items-center gap-1',
                        vencido ? 'text-red-500 font-semibold' : 'text-cafe-400',
                    )}>
                        {vencido && <CalendarX size={11} />}
                        {fechaEntrega.toLocaleDateString('es-BO')}
                    </span>
                    <span className="text-xs font-mono text-dorado-600">
                        Bs. {Number(p.total).toFixed(2)}
                    </span>
                </div>
            </div>

            {/* ── Stepper timeline ─────────────────────────────────────────── */}
            {/*
             * Usa grid-cols-5: cada columna ocupa el 20% del contenedor.
             * El centro de la columna i está en: 10% + i*20%.
             * — Línea de fondo: left-[10%] right-[10%]   (de centro col-0 a col-4)
             * — Línea progreso: left-[10%] width=(idx*20)%
             */}
            <div className="relative">
                {/* Línea de fondo */}
                <div className="absolute top-[10px] left-[10%] right-[10%] h-px bg-cafe-200" />

                {/* Línea de progreso */}
                {currentIdx > 0 && (
                    <div
                        className="absolute top-[10px] left-[10%] h-px bg-cafe-700 transition-all duration-500"
                        style={{ width: `${(currentIdx / (ESTADOS.length - 1)) * 80}%` }}
                    />
                )}

                {/* Pasos */}
                <div className="grid grid-cols-6 relative z-10">
                    {ESTADOS.map((estado, i) => {
                        const done   = i < currentIdx;
                        const active = i === currentIdx;
                        return (
                            <div key={estado} className="flex flex-col items-center gap-1.5">
                                <div className={clsx(
                                    'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                                    done   && 'bg-cafe-700 text-white',
                                    active && 'bg-dorado-500 text-white shadow-[0_0_0_4px_rgba(198,167,94,0.18)]',
                                    !done && !active && 'bg-crema border-2 border-cafe-200',
                                )}>
                                    {done   && <Check size={10} strokeWidth={3} />}
                                    {active && <span className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                                <span className={clsx(
                                    'text-2xs text-center leading-tight',
                                    done            && 'text-cafe-500',
                                    active          && 'text-dorado-600 font-semibold',
                                    !done && !active && 'text-cafe-300',
                                )}>
                                    {estado}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Vista principal ───────────────────────────────────────────────────────────

export default function TimelineView() {
    const [filterEstado, setFilterEstado] = useState<EstadoPedido | ''>('');
    const [filterAnioTimeline, setFilterAnioTimeline] = useState<number>(0);
    const [filterMesTimeline,  setFilterMesTimeline]  = useState<number>(0);
    const { pedidos, isLoading, fetchAll } = usePedidoStore();

    useEffect(() => { fetchAll(); }, [fetchAll]);
    useEffect(() => { document.title = 'Timeline | NT'; }, []);

    const YEARS = buildYears();

    const filtered = pedidos.filter(p => {
        if (filterEstado && p.estado !== filterEstado) return false;
        if (filterAnioTimeline !== 0 || filterMesTimeline !== 0) {
            const d = new Date(p.fecha_entrega + 'T12:00:00');
            if (filterAnioTimeline !== 0 && d.getFullYear() !== filterAnioTimeline) return false;
            if (filterMesTimeline  !== 0 && d.getMonth() + 1 !== filterMesTimeline)  return false;
        }
        return true;
    });

    return (
        <div className="space-y-5 animate-fade-in">

            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Timeline de Producción</h1>
                    <p className="page-subtitle">{pedidos.length} pedidos en seguimiento</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-end gap-3">

            {/* Selectores de Año y Mes */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-cafe-700">Año</label>
                <select
                    value={filterAnioTimeline}
                    onChange={e => setFilterAnioTimeline(Number(e.target.value))}
                    className="select w-28"
                >
                    <option value={0}>Todos</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-cafe-700">Mes</label>
                <select
                    value={filterMesTimeline}
                    onChange={e => setFilterMesTimeline(Number(e.target.value))}
                    className="select w-36"
                >
                    <option value={0}>Todos</option>
                    {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
            </div>

            </div>

            {/* Filtros de estado */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setFilterEstado('')}
                    className={clsx(
                        'px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
                        filterEstado === ''
                            ? 'bg-cafe-800 border-cafe-700 text-white'
                            : 'bg-white border-surface-border text-cafe-500 hover:border-cafe-400',
                    )}>
                    Todos · {pedidos.length}
                </button>
                {ESTADOS.map(estado => {
                    const count = pedidos.filter(p => p.estado === estado).length;
                    if (count === 0) return null;
                    return (
                        <button key={estado}
                                onClick={() => setFilterEstado(f => f === estado ? '' : estado)}
                                className={clsx(
                                    'px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
                                    filterEstado === estado
                                        ? 'bg-cafe-700 border-cafe-700 text-white'
                                        : 'bg-white border-surface-border text-cafe-500 hover:border-cafe-400',
                                )}>
                            {estado} · {count}
                        </button>
                    );
                })}
            </div>

            {/* Grid de tarjetas */}
            {isLoading ? (
                <div className="card">
                    <PageLoader />
                </div>
            ) : filtered.length === 0 ? (
                <div className="card p-12 text-center">
                    <p className="text-cafe-400 text-sm">No hay pedidos en este estado</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filtered.map(p => <PedidoCard key={p.id_pedido} p={p} />)}
                </div>
            )}
        </div>
    );
}

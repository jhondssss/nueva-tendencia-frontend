import { useEffect, useState } from 'react';
import { CalendarX, Check, Workflow } from 'lucide-react';
import { usePedidoStore } from '@/stores/index';
import EmptyState from '@/components/shared/EmptyState';
import { TimelineCardSkeleton } from '@/components/shared/Skeleton';
import Pagination from '@/components/shared/Pagination';
import { usePagination } from '@/hooks/usePagination';
import type { EstadoPedido, UnidadPedido, Pedido } from '@/types';
import { clsx } from 'clsx';
import { parseLocalDate } from '@/utils/dates';

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

// Color por etapa: usado en el paso activo del stepper y en el label debajo del círculo activo.
// Clases completas (no interpoladas) para que Tailwind las detecte al compilar.
const ESTADO_COLOR: Record<EstadoPedido, { dot: string; text: string }> = {
    Pendiente: { dot: 'bg-chart-3', text: 'text-chart-3' },
    Cortado:   { dot: 'bg-chart-4', text: 'text-chart-4' },
    Aparado:   { dot: 'bg-chart-1', text: 'text-chart-1' },
    Solado:    { dot: 'bg-chart-5', text: 'text-chart-5' },
    Empaque:   { dot: 'bg-chart-2', text: 'text-chart-2' },
    Terminado: { dot: 'bg-secondary', text: 'text-secondary' },
};

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
    const fechaEntrega = parseLocalDate(p.fecha_entrega);
    const vencido = fechaEntrega < hoy && p.estado !== 'Terminado';

    return (
        <div className={clsx(
            'rounded-xl border bg-card/50 backdrop-blur p-4',
            'transition-all duration-200 hover:shadow-lg hover:scale-[1.01]',
            vencido ? 'border-destructive/40' : 'border-border/50',
        )}>

            {/* Cabecera */}
            <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-xs text-muted-foreground flex-shrink-0">
                        #{p.id_pedido}
                    </span>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                            {p.cliente.nombre} {p.cliente.apellido ?? ''}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{p.producto?.nombre_modelo ?? '—'}</p>
                        {p.cantidad != null && p.unidad && (
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                {formatCantidad(p.cantidad, p.unidad, p.cantidad_pares)}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={clsx(
                        'text-xs font-mono flex items-center gap-1',
                        vencido ? 'text-destructive font-semibold' : 'text-muted-foreground',
                    )}>
                        {vencido && <CalendarX size={11} />}
                        {fechaEntrega.toLocaleDateString('es-BO')}
                    </span>
                    <span className="text-xs font-mono text-primary">
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
            <div className="relative pt-1">
                {/* Línea de fondo */}
                <div className="absolute top-[14px] left-[10%] right-[10%] h-px bg-border" />

                {/* Línea de progreso */}
                {currentIdx > 0 && (
                    <div
                        className="absolute top-[14px] left-[10%] h-px bg-muted-foreground/30 transition-all duration-500"
                        style={{ width: `${(currentIdx / (ESTADOS.length - 1)) * 80}%` }}
                    />
                )}

                {/* Pasos */}
                <div className="grid grid-cols-6 relative z-10">
                    {ESTADOS.map((estado, i) => {
                        const done   = i < currentIdx;
                        const active = i === currentIdx;
                        const color  = ESTADO_COLOR[estado];
                        return (
                            <div key={estado} className="flex flex-col items-center gap-1.5">
                                <div className={clsx(
                                    'rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200',
                                    done   && 'w-5 h-5 bg-transparent border-2 border-muted-foreground/50',
                                    active && clsx('w-7 h-7 text-white', color.dot),
                                    !done && !active && 'w-5 h-5 bg-muted border-2 border-border',
                                )}>
                                    {done && <Check size={12} strokeWidth={3} className="text-muted-foreground" />}
                                    {active && <span className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                                <span className={clsx(
                                    'text-2xs text-center leading-tight',
                                    done            && 'text-muted-foreground/70',
                                    active          && clsx('font-semibold', color.text),
                                    !done && !active && 'text-muted-foreground/50',
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
            const d = parseLocalDate(p.fecha_entrega);
            if (filterAnioTimeline !== 0 && d.getFullYear() !== filterAnioTimeline) return false;
            if (filterMesTimeline  !== 0 && d.getMonth() + 1 !== filterMesTimeline)  return false;
        }
        return true;
    });

    const pagination = usePagination(filtered, 10);

    return (
        <div className="space-y-5 animate-fade-in">

            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title section-title">Timeline de Producción</h1>
                    <p className="page-subtitle">{pedidos.length} pedidos en seguimiento</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-end gap-3">

            {/* Selectores de Año y Mes */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Año</label>
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
                <label className="text-xs font-medium text-muted-foreground">Mes</label>
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
                        'px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200',
                        filterEstado === ''
                            ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                            : 'bg-card/50 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground hover:scale-[1.02]',
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
                                    'px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200',
                                    filterEstado === estado
                                        ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                                        : 'bg-card/50 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground hover:scale-[1.02]',
                                )}>
                            {estado} · {count}
                        </button>
                    );
                })}
            </div>

            {/* Grid de tarjetas */}
            {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => <TimelineCardSkeleton key={i} />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur">
                    <EmptyState
                        icon={Workflow}
                        title="No hay pedidos en este estado"
                        description="Ajusta los filtros o crea un nuevo pedido desde el módulo de Pedidos."
                    />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {pagination.pageData.map(p => <PedidoCard key={p.id_pedido} p={p} />)}
                    </div>
                    <Pagination
                        page={pagination.page}
                        totalPages={pagination.totalPages}
                        total={filtered.length}
                        goToPage={pagination.goToPage}
                        nextPage={pagination.nextPage}
                        prevPage={pagination.prevPage}
                    />
                </>
            )}
        </div>
    );
}

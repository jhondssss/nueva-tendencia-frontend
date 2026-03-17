import { useState } from 'react';
import { Edit2, Trash2, ClipboardList, ChevronDown, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '@/components/shared/StatusBadge';
import Pagination from '@/components/shared/Pagination';
import PageLoader from '@/components/shared/PageLoader';
import EmptyState from '@/components/shared/EmptyState';
import { clsx } from 'clsx';
import type { Pedido, EstadoPedido, CategoriaCalzado, UnidadPedido } from '@/types';
import type { PaginationResult } from '@/hooks/usePagination';
import { TALLAS_POR_CATEGORIA, CATEGORIA_INFO, defaultTallas } from './TallaInfoBox';

const ESTADOS: EstadoPedido[] = ['Pendiente', 'Cortado', 'Aparado', 'Solado', 'Empaque', 'Terminado'];

const PARES_POR_UNIDAD: Record<UnidadPedido, number> = {
    docena: 12, media_docena: 6, par: 1,
};

function calcularPares(cantidad: number, unidad: UnidadPedido): number {
    return cantidad * PARES_POR_UNIDAD[unidad];
}

function formatCantidad(cantidad: number, unidad: UnidadPedido, cantidadPares?: number): string {
    const pares = cantidadPares ?? calcularPares(cantidad, unidad);
    switch (unidad) {
        case 'docena':       return `${cantidad} ${cantidad === 1 ? 'docena' : 'docenas'} (${pares} pares)`;
        case 'media_docena': return `${cantidad} ${cantidad === 1 ? 'media docena' : 'medias docenas'} (${pares} pares)`;
        case 'par':          return `${cantidad} ${cantidad === 1 ? 'par' : 'pares'}`;
    }
}

function CategoriaBadge({ categoria }: { categoria: CategoriaCalzado }) {
    const cls: Record<CategoriaCalzado, string> = {
        nino:    'bg-blue-100  text-blue-700  border-blue-200',
        juvenil: 'bg-green-100 text-green-700 border-green-200',
        adulto:  'bg-amber-100 text-amber-700 border-amber-200',
    };
    return (
        <span className={clsx('inline-flex text-xs font-medium px-2 py-0.5 rounded-full border', cls[categoria])}>
            {CATEGORIA_INFO[categoria].label}
        </span>
    );
}

function isArchivedPedido(p: Pedido): boolean {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return p.estado === 'Terminado' && new Date(p.fecha_entrega) < oneYearAgo;
}

function isPersonalizado(p: Pedido): boolean {
    if (!p.talles?.length || !p.categoria) return false;
    const std = defaultTallas(p.categoria);
    return p.talles.some(t => {
        const s = std.find(d => d.talla === t.talla);
        return !s || s.cantidad_pares !== t.cantidad_pares;
    });
}

function getTallasParaPedido(p: Pedido) {
    if (p.talles && p.talles.length > 0)
        return p.talles.map(t => ({ talla: t.talla, pares: t.cantidad_pares }));
    if (p.categoria) return TALLAS_POR_CATEGORIA[p.categoria];
    return null;
}

interface Props {
    onEdit:      (p: Pedido) => void;
    onDelete:    (p: Pedido) => void;
    onMover:     (id: number, estado: EstadoPedido) => void;
    canEdit:     boolean;
    canDelete:   boolean;
    hideTotals?: boolean;
    isLoading:   boolean;
    pagination:  PaginationResult<Pedido>;
    total:       number;
}

const BASE_TRACKING_URL = 'https://nueva-tendencia-frontend.vercel.app/seguimiento/token';

function copiarLink(token: string) {
    navigator.clipboard.writeText(`${BASE_TRACKING_URL}/${token}`)
        .then(() => toast.success('¡Link copiado!'))
        .catch(() => toast.error('No se pudo copiar el link'));
}

export default function PedidosTable({ onEdit, onDelete, onMover, canEdit, canDelete, hideTotals = false, isLoading, pagination, total }: Props) {
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    return (
        <div className="card overflow-hidden">
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>#</th><th>Cliente</th><th>Producto</th><th>Categoría</th>
                            <th>Cantidad</th>{!hideTotals && <th>Total</th>}<th>Entrega</th><th>Estado</th>
                            <th>Siguiente etapa</th><th />
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={hideTotals ? 9 : 10}><PageLoader /></td></tr>
                        ) : pagination.pageData.length === 0 ? (
                            <tr>
                                <td colSpan={hideTotals ? 9 : 10}>
                                    <EmptyState icon={ClipboardList}
                                                title="Sin pedidos registrados"
                                                description="Crea el primer pedido con el botón 'Nuevo pedido'." />
                                </td>
                            </tr>
                        ) : (
                            pagination.pageData.flatMap(p => {
                                const idx      = ESTADOS.indexOf(p.estado);
                                const next     = ESTADOS[idx + 1];
                                const isOpen   = expandedRow === p.id_pedido;
                                const tallas   = getTallasParaPedido(p);
                                const hasDetail = tallas !== null;

                                return [
                                    <tr key={p.id_pedido}
                                        onClick={() => hasDetail && setExpandedRow(isOpen ? null : p.id_pedido)}
                                        className={clsx(hasDetail && 'cursor-pointer')}>
                                        <td className="font-mono text-ink-100">#{p.id_pedido}</td>
                                        <td className="font-medium">{p.cliente.nombre} {p.cliente.apellido}</td>
                                        <td className="text-ink-50">{p.producto?.nombre_modelo ?? '—'}</td>
                                        <td>
                                            {p.categoria
                                                ? <CategoriaBadge categoria={p.categoria} />
                                                : <span className="text-ink-400 text-xs">—</span>}
                                            {hasDetail && (
                                                <ChevronDown size={12}
                                                    className={clsx('inline ml-1 text-ink-400 transition-transform', isOpen && 'rotate-180')} />
                                            )}
                                        </td>
                                        <td className="text-ink-100 text-xs whitespace-nowrap">
                                            {p.cantidad != null && p.unidad
                                                ? formatCantidad(p.cantidad, p.unidad, p.cantidad_pares)
                                                : '—'}
                                        </td>
                                        {!hideTotals && <td className="font-mono text-amber-400">Bs. {Number(p.total).toFixed(2)}</td>}
                                        <td className="text-ink-100">
                                            {new Date(p.fecha_entrega + 'T12:00:00').toLocaleDateString('es-BO')}
                                        </td>
                                        <td>
                                            <div className="flex flex-wrap items-center gap-1">
                                                <StatusBadge estado={p.estado} />
                                                {isArchivedPedido(p) && (
                                                    <span className="text-2xs px-1.5 py-0.5 rounded bg-cafe-100 text-cafe-600 border border-cafe-200 font-medium leading-none">
                                                        Archivado
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            {next ? (
                                                <button onClick={e => { e.stopPropagation(); onMover(p.id_pedido, next); }}
                                                        className="text-xs px-2 py-1 rounded bg-ink-700 border border-ink-500
                                                                   text-cream hover:bg-ink-600 transition-colors">
                                                    → {next}
                                                </button>
                                            ) : (
                                                <span className="text-green-400 text-xs font-medium">✓ Completado</span>
                                            )}
                                        </td>
                                        <td onClick={e => e.stopPropagation()}>
                                            <div className="flex gap-1">
                                                {canEdit && (
                                                    <button onClick={() => onEdit(p)}
                                                            className="p-1.5 rounded text-ink-300 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                                                        <Edit2 size={13} />
                                                    </button>
                                                )}
                                                {canDelete && p.estado !== 'Terminado' && (
                                                    <button onClick={() => onDelete(p)}
                                                            className="p-1.5 rounded text-ink-300 hover:text-red-400 hover:bg-red-950/40 transition-colors">
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                                {p.token_seguimiento ? (
                                                    <button
                                                        onClick={() => copiarLink(p.token_seguimiento!)}
                                                        title="Copiar link de seguimiento"
                                                        className="p-1.5 rounded text-ink-300 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                                                        <Link2 size={13} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        disabled
                                                        title="Sin token generado"
                                                        className="p-1.5 rounded text-ink-600 cursor-not-allowed opacity-50">
                                                        <Link2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>,

                                    isOpen && tallas ? (
                                        <tr key={`${p.id_pedido}-tallas`} className="bg-ink-800/60">
                                            <td colSpan={hideTotals ? 9 : 10} className="px-6 py-4">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-xs font-semibold text-ink-300 uppercase tracking-wide">
                                                            Distribución de tallas
                                                            {p.categoria && (
                                                                <span className="ml-2 normal-case font-normal text-amber-400">
                                                                    — {CATEGORIA_INFO[p.categoria].label} ({CATEGORIA_INFO[p.categoria].rango})
                                                                </span>
                                                            )}
                                                        </p>
                                                        {p.categoria && (
                                                            isPersonalizado(p) ? (
                                                                <span className="text-xs px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400 font-medium">
                                                                    Personalizado
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs px-2 py-0.5 rounded-full border border-ink-500 bg-ink-700 text-ink-400 font-medium">
                                                                    Estándar
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-3">
                                                        {tallas.map(({ talla, pares }) => (
                                                            <div key={talla} className="text-center">
                                                                <div className="text-sm font-mono font-bold text-amber-300
                                                                               bg-ink-700 border border-ink-500 rounded-lg
                                                                               px-3 py-2 min-w-[3rem]">
                                                                    {talla}
                                                                </div>
                                                                <div className="text-xs text-ink-400 mt-1">
                                                                    {pares} {pares === 1 ? 'par' : 'pares'}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-ink-400">
                                                        {tallas.reduce((s, t) => s + t.pares, 0)} pares/docena
                                                        {p.cantidad > 1 && (
                                                            <span className="ml-2 text-amber-400 font-mono">
                                                                × {p.cantidad} docenas = {tallas.reduce((s, t) => s + t.pares, 0) * p.cantidad} pares totales
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : null,
                                ];
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {!isLoading && (
                <div className="px-4 pb-4">
                    <Pagination
                        page={pagination.page}
                        totalPages={pagination.totalPages}
                        total={total}
                        goToPage={pagination.goToPage}
                        nextPage={pagination.nextPage}
                        prevPage={pagination.prevPage}
                    />
                </div>
            )}
        </div>
    );
}

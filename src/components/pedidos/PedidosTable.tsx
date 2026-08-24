import { useState } from 'react';
import { Edit2, Trash2, ClipboardList, ChevronDown, Link2, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '@/components/shared/StatusBadge';
import Pagination from '@/components/shared/Pagination';
import PageLoader from '@/components/shared/PageLoader';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { clsx } from 'clsx';
import type { Pedido, EstadoPedido, CategoriaCalzado, UnidadPedido } from '@/types';
import type { PaginationResult } from '@/hooks/usePagination';
import { TALLAS_POR_CATEGORIA, CATEGORIA_INFO, CATEGORIA_ACCENT_TEXT, CATEGORIA_ACCENT_BADGE, defaultTallas } from './TallaInfoBox';
import { parseLocalDate } from '@/utils/dates';

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
    return (
        <Badge
            variant="outline"
            className={clsx('font-medium', CATEGORIA_ACCENT_BADGE[categoria])}>
            {CATEGORIA_INFO[categoria].label}
        </Badge>
    );
}

function isArchivedPedido(p: Pedido): boolean {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return p.estado === 'Terminado' && parseLocalDate(p.fecha_entrega) < oneYearAgo;
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
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden
                         transition-all duration-300 hover:shadow-lg">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead>#</TableHead><TableHead>Cliente</TableHead><TableHead>Producto</TableHead><TableHead>Categoría</TableHead>
                        <TableHead>Cantidad</TableHead>{!hideTotals && <TableHead>Total</TableHead>}<TableHead>Entrega</TableHead><TableHead>Estado</TableHead>
                        <TableHead>Siguiente etapa</TableHead><TableHead />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={hideTotals ? 9 : 10}><PageLoader /></TableCell>
                        </TableRow>
                    ) : pagination.pageData.length === 0 ? (
                        <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={hideTotals ? 9 : 10}>
                                <EmptyState icon={ClipboardList}
                                            title="Sin pedidos registrados"
                                            description="Crea el primer pedido con el botón 'Nuevo pedido'." />
                            </TableCell>
                        </TableRow>
                    ) : (
                        pagination.pageData.flatMap(p => {
                            const idx      = ESTADOS.indexOf(p.estado);
                            const next     = ESTADOS[idx + 1];
                            const isOpen   = expandedRow === p.id_pedido;
                            const tallas   = getTallasParaPedido(p);
                            const hasDetail = tallas !== null;

                            return [
                                <TableRow key={p.id_pedido}
                                    onClick={() => hasDetail && setExpandedRow(isOpen ? null : p.id_pedido)}
                                    className={clsx(hasDetail && 'cursor-pointer')}>
                                    <TableCell className="font-mono text-muted-foreground">#{p.id_pedido}</TableCell>
                                    <TableCell className="font-medium text-foreground">{p.cliente.nombre} {p.cliente.apellido}</TableCell>
                                    <TableCell className="text-muted-foreground">{p.producto?.nombre_modelo ?? '—'}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            {p.categoria
                                                ? <CategoriaBadge categoria={p.categoria} />
                                                : <span className="text-muted-foreground text-xs">—</span>}
                                            {hasDetail && (
                                                <ChevronDown size={12}
                                                    className={clsx('text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                                        {p.cantidad != null && p.unidad
                                            ? formatCantidad(p.cantidad, p.unidad, p.cantidad_pares)
                                            : '—'}
                                    </TableCell>
                                    {!hideTotals && <TableCell className="font-mono text-primary">Bs. {Number(p.total).toFixed(2)}</TableCell>}
                                    <TableCell className="text-muted-foreground">
                                        {parseLocalDate(p.fecha_entrega).toLocaleDateString('es-BO')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap items-center gap-1">
                                            <StatusBadge estado={p.estado} />
                                            {isArchivedPedido(p) && (
                                                <Badge variant="outline" className="text-2xs px-1.5 py-0 text-muted-foreground border-border font-medium">
                                                    Archivado
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {next ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={e => { e.stopPropagation(); onMover(p.id_pedido, next); }}
                                                className="h-7 px-2 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary hover:scale-[1.02] transition-all">
                                                {next} <ArrowRight size={12} />
                                            </Button>
                                        ) : (
                                            <span className="flex items-center gap-1 text-chart-2 text-xs font-medium">
                                                <CheckCircle2 size={13} /> Completado
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell onClick={e => e.stopPropagation()}>
                                        <div className="flex gap-2">
                                            {canEdit && (
                                                <Button variant="ghost" size="icon" onClick={() => onEdit(p)}
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                                                    <Edit2 size={14} />
                                                </Button>
                                            )}
                                            {canDelete && p.estado !== 'Terminado' && (
                                                <Button variant="ghost" size="icon" onClick={() => onDelete(p)}
                                                        className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10">
                                                    <Trash2 size={14} />
                                                </Button>
                                            )}
                                            {p.token_seguimiento ? (
                                                <Button
                                                    variant="ghost" size="icon"
                                                    onClick={() => copiarLink(p.token_seguimiento!)}
                                                    title="Copiar link de seguimiento"
                                                    className="h-7 w-7 text-muted-foreground hover:text-chart-2 hover:bg-chart-2/10">
                                                    <Link2 size={13} />
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost" size="icon"
                                                    disabled
                                                    title="Sin token generado"
                                                    className="h-7 w-7 text-muted-foreground/40">
                                                    <Link2 size={13} />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>,

                                isOpen && tallas ? (
                                    <TableRow key={`${p.id_pedido}-tallas`} className="bg-muted/30 hover:bg-muted/30">
                                        <TableCell colSpan={hideTotals ? 9 : 10} className="px-6 py-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                        Distribución de tallas
                                                        {p.categoria && (
                                                            <span className={clsx('ml-2 normal-case font-normal', CATEGORIA_ACCENT_TEXT[p.categoria])}>
                                                                — {CATEGORIA_INFO[p.categoria].label} ({CATEGORIA_INFO[p.categoria].rango})
                                                            </span>
                                                        )}
                                                    </p>
                                                    {p.categoria && (
                                                        isPersonalizado(p) ? (
                                                            <Badge variant="outline" className="text-xs bg-chart-3/10 border-chart-3/40 text-chart-3 font-medium">
                                                                Personalizado
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-xs bg-muted border-border text-muted-foreground font-medium">
                                                                Estándar
                                                            </Badge>
                                                        )
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-3">
                                                    {tallas.map(({ talla, pares }) => (
                                                        <div key={talla} className="text-center">
                                                            <div className="text-sm font-mono font-bold text-primary
                                                                           bg-card border border-border rounded-lg
                                                                           px-3 py-2 min-w-[3rem]">
                                                                {talla}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                {pares} {pares === 1 ? 'par' : 'pares'}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {tallas.reduce((s, t) => s + t.pares, 0)} pares/docena
                                                    {p.cantidad > 1 && (
                                                        <span className="ml-2 text-primary font-mono">
                                                            × {p.cantidad} docenas = {tallas.reduce((s, t) => s + t.pares, 0) * p.cantidad} pares totales
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : null,
                            ];
                        })
                    )}
                </TableBody>
            </Table>

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

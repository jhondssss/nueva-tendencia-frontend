import { useState } from 'react';
import { CalendarCheck, DollarSign, ArrowLeftRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import EmptyState from '@/components/shared/EmptyState';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import type {
    ReporteDiarioPedidoRaw, ReporteDiarioKardexRaw, ReporteDiarioAuditoriaRaw,
    ReporteDiarioProductoRef, ReporteDiarioInsumoRef,
    TipoMovimiento, ModuloAuditoria, AccionAuditoria,
} from '@/types';

const LOG_PAGE = 10;

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

function formatHora(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

export function SectionHeader({ label, color = 'bg-primary' }: { label: string; color?: string }) {
    return (
        <div className="flex items-center gap-2.5">
            <div className={clsx('w-1 h-5 rounded-full', color)} />
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{label}</h2>
        </div>
    );
}

export function KpiCard({
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

export function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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

// ─── Pedidos del día ──────────────────────────────────────────────────────────

export function PedidosTable({ pedidos }: { pedidos: ReporteDiarioPedidoRaw[] }) {
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
                    const clienteNombre = `${p.cliente?.nombre ?? ''} ${p.cliente?.apellido ?? ''}`.trim() || '—';
                    const productoNombre = p.producto?.nombre_modelo ?? '—';
                    const hora = p.fecha_actualizacion ?? p.fecha_creacion;
                    return (
                        <TableRow key={`${p.id_pedido}-${hora}`}>
                            <TableCell className="font-mono text-muted-foreground">#{p.id_pedido}</TableCell>
                            <TableCell className="font-medium text-foreground">{clienteNombre}</TableCell>
                            <TableCell className="text-muted-foreground">{productoNombre}</TableCell>
                            <TableCell className="text-xs text-muted-foreground capitalize">{p.categoria ?? '—'}</TableCell>
                            <TableCell><StatusBadge estado={p.estado} size="sm" /></TableCell>
                            <TableCell className="text-xs text-muted-foreground/70 tabular-nums">{formatHora(hora)}</TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

// ─── Ventas del día ───────────────────────────────────────────────────────────

export function VentasTable({ ventas }: { ventas: ReporteDiarioPedidoRaw[] }) {
    if (ventas.length === 0) {
        return (
            <EmptyState
                icon={DollarSign}
                title="Sin ventas registradas"
                description="No se registraron ventas completadas hoy."
            />
        );
    }
    return (
        <Table>
            <TableHeader>
                <TableRow className="hover:bg-transparent">
                    <TableHead>Cliente</TableHead><TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead><TableHead>Total Bs.</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {ventas.map(v => {
                    const vCliente = `${v.cliente?.nombre ?? ''} ${v.cliente?.apellido ?? ''}`.trim() || '—';
                    const vProducto = v.producto?.nombre_modelo ?? '—';
                    return (
                        <TableRow key={v.id_pedido}>
                            <TableCell className="font-medium text-foreground">{vCliente}</TableCell>
                            <TableCell className="text-muted-foreground">{vProducto}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {v.cantidad} {String(v.unidad ?? '').replace('_', ' ')}
                            </TableCell>
                            <TableCell className="font-mono text-primary font-semibold">
                                {Number(v.total).toFixed(2)}
                            </TableCell>
                        </TableRow>
                    );
                })}
                <TableRow className="border-t-2 border-border bg-muted/50 hover:bg-muted/50">
                    <TableCell colSpan={3} className="font-bold text-foreground text-right pr-4">
                        Total del día
                    </TableCell>
                    <TableCell className="font-mono font-bold text-foreground">
                        {ventas.reduce((s, v) => s + Number(v.total), 0).toFixed(2)}
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
}

// ─── Movimientos de Kardex ────────────────────────────────────────────────────

export function KardexTable({ movimientos }: { movimientos: ReporteDiarioKardexRaw[] }) {
    if (movimientos.length === 0) {
        return (
            <EmptyState
                icon={ArrowLeftRight}
                title="Sin movimientos"
                description="No hubo movimientos de stock hoy."
            />
        );
    }
    return (
        <Table>
            <TableHeader>
                <TableRow className="hover:bg-transparent">
                    <TableHead>Producto / Insumo</TableHead><TableHead>Tipo</TableHead>
                    <TableHead>Cantidad</TableHead><TableHead>Motivo</TableHead><TableHead>Hora</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {movimientos.map(m => {
                    const nombre = m.producto?.nombre_modelo ?? m.insumo?.nombre ?? '—';
                    const horaStr = new Date(m.fecha).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
                    return (
                        <TableRow key={m.id_movimiento}>
                            <TableCell className="font-medium text-foreground">{nombre}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={clsx('font-medium capitalize', KARDEX_BADGE[m.tipo])}>
                                    {m.tipo}
                                </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-foreground">{m.cantidad}</TableCell>
                            <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{m.motivo ?? '—'}</TableCell>
                            <TableCell className="text-xs text-muted-foreground/70 tabular-nums">{horaStr}</TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

// ─── Alertas críticas ─────────────────────────────────────────────────────────

export function AlertasList({ items, label }: { items: (ReporteDiarioProductoRef | ReporteDiarioInsumoRef)[]; label: string }) {
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
                const esProducto = 'id_producto' in item;
                const key      = esProducto ? item.id_producto : item.id_insumo;
                const nombre   = esProducto ? item.nombre_modelo : item.nombre;
                const stock    = item.stock;
                const minimo   = item.nivel_minimo;
                const critico  = stock <= minimo;
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

// ─── Log de actividad (con paginación propia) ─────────────────────────────────

export function ActividadLog({ actividad }: { actividad: ReporteDiarioAuditoriaRaw[] }) {
    const [logPage, setLogPage] = useState(1);

    const logTotal = actividad.length;
    const logPages = Math.max(1, Math.ceil(logTotal / LOG_PAGE));
    const logSlice = actividad.slice((logPage - 1) * LOG_PAGE, logPage * LOG_PAGE);

    if (logTotal === 0) {
        return (
            <EmptyState
                icon={CalendarCheck}
                title="Sin actividad"
                description="No se registró actividad hoy."
            />
        );
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead>Hora</TableHead><TableHead>Usuario</TableHead><TableHead>Módulo</TableHead>
                        <TableHead>Acción</TableHead><TableHead>Descripción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logSlice.map((log, idx) => {
                        const horaLog = new Date(log.fecha).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
                        const usuario = log.usuario?.nombre ?? log.usuario?.email ?? 'Sistema';
                        return (
                            <TableRow key={log.id_auditoria ?? idx}>
                                <TableCell className="text-xs text-muted-foreground/70 tabular-nums whitespace-nowrap">
                                    {horaLog}
                                </TableCell>
                                <TableCell className="text-sm font-medium text-foreground">
                                    {usuario}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={clsx('font-medium capitalize', MODULO_BADGE[log.modulo as ModuloAuditoria] ?? 'bg-muted text-muted-foreground border-border')}>
                                        {log.modulo}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={clsx('font-semibold', ACCION_BADGE[log.accion as AccionAuditoria] ?? 'bg-muted text-muted-foreground border-border')}>
                                        {log.accion}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{log.descripcion}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

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
        </>
    );
}

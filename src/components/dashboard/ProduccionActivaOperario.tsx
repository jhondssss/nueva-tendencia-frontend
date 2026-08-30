import { Scissors, Hammer, Layers, Package, CalendarX, Inbox } from 'lucide-react';
import { clsx } from 'clsx';
import { Skeleton } from '@/components/ui/skeleton';
import StatusBadge from '@/components/shared/StatusBadge';
import type { EstadoPedido, Pedido } from '@/types';
import { parseLocalDate } from '@/utils/dates';

const ETAPAS: { estado: EstadoPedido; icon: React.ElementType; accent: string }[] = [
    { estado: 'Cortado', icon: Scissors, accent: 'chart-4' },
    { estado: 'Aparado', icon: Hammer,   accent: 'chart-1' },
    { estado: 'Solado',  icon: Layers,   accent: 'chart-5' },
    { estado: 'Empaque', icon: Package,  accent: 'chart-2' },
];

interface Props {
    pedidos:   Pedido[];
    isLoading: boolean;
}

function PedidoRow({ p }: { p: Pedido }) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaEntrega = parseLocalDate(p.fecha_entrega);
    const vencido = fechaEntrega < hoy;

    return (
        <div className={clsx(
            'rounded-lg border bg-background/40 p-2.5',
            vencido ? 'border-destructive/40' : 'border-border/50',
        )}>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                        #{p.id_pedido} · {p.cliente.nombre} {p.cliente.apellido ?? ''}
                    </p>
                    <p className="text-2xs text-muted-foreground truncate">{p.producto?.nombre_modelo ?? '—'}</p>
                </div>
                <span className={clsx(
                    'text-2xs font-mono flex items-center gap-1 flex-shrink-0',
                    vencido ? 'text-destructive font-semibold' : 'text-muted-foreground',
                )}>
                    {vencido && <CalendarX size={10} />}
                    {fechaEntrega.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })}
                </span>
            </div>
        </div>
    );
}

function EtapaColumnSkeleton() {
    return (
        <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
        </div>
    );
}

export default function ProduccionActivaOperario({ pedidos, isLoading }: Props) {
    const grupos = ETAPAS.map(({ estado, icon, accent }) => ({
        estado, icon, accent,
        pedidos: pedidos
            .filter(p => p.estado === estado)
            .sort((a, b) => parseLocalDate(a.fecha_entrega).getTime() - parseLocalDate(b.fecha_entrega).getTime()),
    }));

    const totalActivos = grupos.reduce((s, g) => s + g.pedidos.length, 0);

    return (
        <div className="rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-semibold tracking-tight text-foreground">
                    Producción activa
                </h3>
                {!isLoading && (
                    <span className="text-xs font-mono text-muted-foreground">{totalActivos} pedidos en proceso</span>
                )}
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <EtapaColumnSkeleton key={i} />)}
                </div>
            ) : totalActivos === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                    <Inbox size={26} className="text-muted-foreground/50" />
                    <p className="text-muted-foreground text-sm">No hay pedidos en producción activa</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {grupos.map(g => (
                        <div key={g.estado} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <g.icon size={13} className={`text-${g.accent}`} />
                                <StatusBadge estado={g.estado} size="sm" />
                                <span className="text-2xs font-mono text-muted-foreground ml-auto">{g.pedidos.length}</span>
                            </div>
                            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-0.5">
                                {g.pedidos.length === 0 ? (
                                    <p className="text-2xs text-muted-foreground/60 italic py-2">Sin pedidos</p>
                                ) : (
                                    g.pedidos.map(p => <PedidoRow key={p.id_pedido} p={p} />)
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

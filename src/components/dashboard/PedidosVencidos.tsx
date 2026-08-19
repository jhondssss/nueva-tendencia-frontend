import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import StatusBadge from '@/components/shared/StatusBadge';
import type { ProximoPedido } from '@/types';
import { parseLocalDate } from '@/utils/dates';

interface Props {
    pedidosVencidos: ProximoPedido[];
}

export default function PedidosVencidos({ pedidosVencidos }: Props) {
    if (pedidosVencidos.length === 0) return null;

    return (
        <div className="rounded-xl border border-t-2 border-chart-3 border-border/50 bg-card/50 p-6 backdrop-blur">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-chart-3/10">
                    <Clock size={15} className="text-chart-3" />
                </div>
                <h3 className="font-display text-base font-semibold tracking-tight text-foreground">
                    Próximos a entregar (próximos 7 días)
                </h3>
                <Badge variant="outline" className="ml-auto font-mono text-chart-3 border-chart-3/40 bg-chart-3/10">
                    {pedidosVencidos.length}
                </Badge>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Fecha entrega</TableHead>
                        <TableHead>Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pedidosVencidos.map(p => (
                        <TableRow key={p.id}>
                            <TableCell className="font-mono text-muted-foreground">#{p.id}</TableCell>
                            <TableCell className="font-medium text-foreground">{p.cliente}</TableCell>
                            <TableCell className="text-muted-foreground">{p.producto ?? '—'}</TableCell>
                            <TableCell className="font-mono text-chart-3 text-xs">
                                {parseLocalDate(p.fecha_entrega).toLocaleDateString('es-BO')}
                            </TableCell>
                            <TableCell><StatusBadge estado={p.estado} /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

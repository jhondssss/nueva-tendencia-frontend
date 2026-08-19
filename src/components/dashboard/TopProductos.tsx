import { PackageSearch } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useRole } from '@/hooks/useRole';
import type { TopProducto } from '@/types';

interface Props {
    topProductos: TopProducto[];
    isLoading:    boolean;
}

export default function TopProductos({ topProductos, isLoading }: Props) {
    const { isOperario } = useRole();

    return (
        <div className="rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur">
            <h3 className="font-display text-base font-semibold tracking-tight text-foreground mb-4">Productos más vendidos</h3>
            {isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-md" />)}
                </div>
            ) : topProductos.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                    <PackageSearch size={28} className="text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">Sin datos disponibles</p>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>Mes</TableHead>
                            <TableHead className="text-right">Cantidad</TableHead>
                            {!isOperario && <TableHead className="text-right">Total (Bs.)</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {topProductos.map((p, i) => (
                            <TableRow key={i}>
                                <TableCell className="text-foreground">{p.nombre}</TableCell>
                                <TableCell className="text-muted-foreground">{p.mes}</TableCell>
                                <TableCell className="text-right font-mono text-foreground">{p.cantidad}</TableCell>
                                {!isOperario && (
                                    <TableCell className="text-right font-mono text-chart-1">
                                        {Number(p.total).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}

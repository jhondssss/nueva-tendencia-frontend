import { ShieldCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import type { PrediccionStock as PrediccionStockItem } from '@/types';

interface Props {
    prediccionStock: PrediccionStockItem[];
    isLoading:       boolean;
}

function SemanasBar({ semanas }: { semanas: number | null }) {
    if (semanas === null) {
        return <span className="text-muted-foreground/60 font-mono text-xs">Sin historial</span>;
    }
    const n = Number(semanas);
    const pct = Math.min((n / 20) * 100, 100);
    const barColor = n <= 2 ? 'bg-destructive' : n <= 4 ? 'bg-chart-3' : 'bg-chart-2';
    return (
        <div className="flex items-center gap-2 justify-end">
            <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="font-mono text-xs text-muted-foreground min-w-[44px] text-right">
                {n.toFixed(1)} sem
            </span>
        </div>
    );
}

function EstadoBadge({ semanas }: { semanas: number | null }) {
    if (semanas === null) {
        return <Badge variant="outline" className="text-muted-foreground border-border font-medium">Sin historial</Badge>;
    }
    const n = Number(semanas);
    if (n <= 2) {
        return (
            <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10 font-medium animate-pulse">
                Crítico
            </Badge>
        );
    }
    if (n <= 4) {
        return (
            <Badge variant="outline" className="text-chart-3 border-chart-3/30 bg-chart-3/10 font-medium">
                Bajo
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="text-chart-2 border-chart-2/30 bg-chart-2/10 font-medium">
            Normal
        </Badge>
    );
}

export default function PrediccionStock({ prediccionStock, isLoading }: Props) {
    return (
        <div className="rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur">
            <h3 className="font-display text-base font-semibold tracking-tight text-foreground mb-4">Predicción de Stock</h3>

            {isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-full rounded-md" />
                    ))}
                </div>
            ) : prediccionStock.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                    <ShieldCheck size={28} className="text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">Todos los productos tienen stock saludable.</p>
                </div>
            ) : (
                <>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead className="text-right">Stock actual</TableHead>
                                <TableHead className="text-right">Nivel mínimo</TableHead>
                                <TableHead className="text-right">Demanda mensual</TableHead>
                                <TableHead className="text-right">Semanas restantes</TableHead>
                                <TableHead className="text-center">Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {prediccionStock.map(p => {
                                const critico = p.semanas_restantes !== null && Number(p.semanas_restantes) <= 2;
                                return (
                                    <TableRow key={p.id} className={critico ? 'bg-destructive/5' : undefined}>
                                        <TableCell className="text-foreground font-medium">{p.nombre}</TableCell>
                                        <TableCell className="text-right font-mono text-foreground">{p.stock}</TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground">{p.nivel_minimo}</TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground">{p.demanda_mensual}</TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground">
                                            <SemanasBar semanas={p.semanas_restantes} />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <EstadoBadge semanas={p.semanas_restantes} />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>

                    <p className="mt-3 text-xs text-muted-foreground italic">
                        La predicción se calcula en base al historial de pedidos.
                        Productos sin pedidos muestran "Sin historial".
                    </p>
                </>
            )}
        </div>
    );
}

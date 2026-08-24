import { AlertTriangle } from 'lucide-react';
import type { Insumo } from '@/types';
import { UNIDAD_SHORT } from './insumoHelpers';

export function InsumosAlertBanner({ alertas }: { alertas: Insumo[] }) {
    if (alertas.length === 0) return null;

    return (
        <div className="rounded-xl border border-destructive/30 bg-card/50 backdrop-blur p-4">
            <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-destructive/10 flex-shrink-0">
                    <AlertTriangle size={14} className="text-destructive" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                    {alertas.length} insumo{alertas.length !== 1 ? 's' : ''} bajo nivel mínimo
                </h3>
                <span className="ml-auto text-xs font-mono font-semibold px-2 py-0.5 rounded
                                 bg-destructive/10 text-destructive border border-destructive/20">
                    {alertas.length}
                </span>
            </div>
            <div className="flex flex-wrap gap-2">
                {alertas.map(a => (
                    <span key={a.id_insumo}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs
                                     bg-destructive/10 text-destructive border border-destructive/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse flex-shrink-0" />
                        {a.nombre} — {a.stock} / {a.nivel_minimo} {UNIDAD_SHORT[a.unidad_medida]}
                    </span>
                ))}
            </div>
        </div>
    );
}

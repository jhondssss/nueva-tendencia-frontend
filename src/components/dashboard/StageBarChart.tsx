import type { ProductionFunnel } from '@/types';

/** Barras horizontales de producción por etapa. */
export default function StageBarChart({ data }: { data: ProductionFunnel[] }) {
    const max = Math.max(...data.map(d => d.cantidad), 1);
    const lastIndex = data.length - 1;

    return (
        <div className="space-y-3">
            {data.map((d, i) => {
                const pct = Math.max((d.cantidad / max) * 100, d.cantidad > 0 ? 2 : 0);
                const isLast = i === lastIndex;
                return (
                    <div key={d.etapa} className="flex items-center gap-3">
                        <span className="w-16 flex-shrink-0 text-xs text-muted-foreground truncate" title={d.etapa}>
                            {d.etapa}
                        </span>
                        <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                            <div
                                className={`h-full rounded-full ${isLast ? 'bg-success' : 'bg-primary'}`}
                                style={{ width: `${pct}%`, transition: 'width 0.3s ease' }}
                            />
                        </div>
                        <span className="w-6 flex-shrink-0 text-right font-mono text-xs font-medium text-foreground">
                            {d.cantidad}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

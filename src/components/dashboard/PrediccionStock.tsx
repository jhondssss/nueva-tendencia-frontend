import { Skeleton } from '@/components/shared/Skeleton';
import type { PrediccionStock as PrediccionStockItem } from '@/types';

interface Props {
    prediccionStock: PrediccionStockItem[];
    isLoading:       boolean;
}

function EstadoBadge({ semanas }: { semanas: number | null }) {
    if (semanas === null) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-cafe-100 text-cafe-400 border border-cafe-200">
                Sin historial
            </span>
        );
    }
    if (semanas <= 2) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-300 animate-pulse">
                🔴 Crítico
            </span>
        );
    }
    if (semanas <= 4) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700 border border-orange-300">
                ⚠️ Bajo
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-300">
            ✅ Normal
        </span>
    );
}

export default function PrediccionStock({ prediccionStock, isLoading }: Props) {
    return (
        <div className="card p-5">
            <h3 className="font-display text-base font-medium text-cafe-950 mb-4">Predicción de Stock</h3>

            {isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-full rounded" />
                    ))}
                </div>
            ) : prediccionStock.length === 0 ? (
                <p className="text-cafe-400 text-sm">Todos los productos tienen stock saludable.</p>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    <th className="text-left">Producto</th>
                                    <th className="text-right">Stock actual</th>
                                    <th className="text-right">Nivel mínimo</th>
                                    <th className="text-right">Demanda mensual</th>
                                    <th className="text-right">Semanas restantes</th>
                                    <th className="text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prediccionStock.map(p => {
                                    const critico = p.semanas_restantes !== null && p.semanas_restantes <= 2;
                                    return (
                                        <tr
                                            key={p.id}
                                            className={critico ? 'bg-red-50' : undefined}
                                        >
                                            <td className="text-cafe-950 font-medium">{p.nombre}</td>
                                            <td className="text-right font-mono text-cafe-950">{p.stock}</td>
                                            <td className="text-right font-mono text-cafe-500">{p.nivel_minimo}</td>
                                            <td className="text-right font-mono text-cafe-600">{p.demanda_mensual}</td>
                                            <td className="text-right font-mono text-cafe-600">
                                                {p.semanas_restantes !== null
                                                    ? `${p.semanas_restantes.toFixed(1)} sem`
                                                    : <span className="text-cafe-300">Sin historial</span>
                                                }
                                            </td>
                                            <td className="text-center">
                                                <EstadoBadge semanas={p.semanas_restantes} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <p className="mt-3 text-xs text-cafe-400">
                        La predicción se calcula en base al historial de pedidos. Productos sin pedidos muestran "Sin historial".
                    </p>
                </>
            )}
        </div>
    );
}

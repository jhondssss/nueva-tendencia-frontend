import { Skeleton } from '@/components/shared/Skeleton';
import { useRole } from '@/hooks/useRole';
import type { TopProducto } from '@/types';

interface Props {
    topProductos: TopProducto[];
    isLoading:    boolean;
}

export default function TopProductos({ topProductos, isLoading }: Props) {
    const { isOperario } = useRole();

    return (
        <div className="card p-5">
            <h3 className="font-display text-base font-medium text-cafe-950 mb-4">Productos más vendidos</h3>
            {isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded" />)}
                </div>
            ) : topProductos.length === 0 ? (
                <p className="text-cafe-400 text-sm">Sin datos disponibles</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Mes</th>
                                <th className="text-right">Cantidad</th>
                                {!isOperario && <th className="text-right">Total (Bs.)</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {topProductos.map((p, i) => (
                                <tr key={i}>
                                    <td className="text-cafe-950">{p.nombre}</td>
                                    <td className="text-cafe-600">{p.mes}</td>
                                    <td className="text-right font-mono text-cafe-950">{p.cantidad}</td>
                                    {!isOperario && (
                                        <td className="text-right font-mono text-dorado-600">
                                            {Number(p.total).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

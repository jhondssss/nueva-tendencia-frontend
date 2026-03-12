import { Clock } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import type { ProximoPedido } from '@/types';

interface Props {
    pedidosVencidos: ProximoPedido[];
}

export default function PedidosVencidos({ pedidosVencidos }: Props) {
    if (pedidosVencidos.length === 0) return null;

    return (
        <div className="card p-5 border-amber-200">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-amber-500/10">
                    <Clock size={15} className="text-amber-600" />
                </div>
                <h3 className="font-display text-base font-medium text-cafe-950">
                    ⏰ Próximos a entregar (próximos 7 días)
                </h3>
                <span className="ml-auto text-xs font-mono font-semibold px-2 py-0.5 rounded
                                 bg-amber-100 text-amber-700 border border-amber-200">
                    {pedidosVencidos.length}
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Cliente</th>
                            <th>Producto</th>
                            <th>Fecha entrega</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pedidosVencidos.map(p => (
                            <tr key={p.id}>
                                <td className="font-mono text-ink-100">#{p.id}</td>
                                <td className="font-medium text-cafe-950">{p.cliente}</td>
                                <td className="text-cafe-700">{p.producto ?? '—'}</td>
                                <td className="font-mono text-amber-600 text-xs">
                                    {new Date(p.fecha_entrega).toLocaleDateString('es-BO')}
                                </td>
                                <td><StatusBadge estado={p.estado} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

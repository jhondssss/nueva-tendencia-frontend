import { clsx } from 'clsx';
import type { EstadoPedido } from '@/types';

interface Props { estado: EstadoPedido; size?: 'sm' | 'md'; }

const CONFIG: Record<EstadoPedido, { class: string; dot: string }> = {
    Pendiente: { class: 'bg-dorado-500/10 text-dorado-700 border border-dorado-300', dot: 'bg-dorado-400' },
    Cortado:   { class: 'bg-cafe-100 text-cafe-700 border border-cafe-300',          dot: 'bg-cafe-400'   },
    Aparado:   { class: 'bg-cafe-200/60 text-cafe-800 border border-cafe-300',       dot: 'bg-cafe-500'   },
    Solado:    { class: 'bg-cafe-200 text-cafe-900 border border-cafe-400',          dot: 'bg-cafe-600'   },
    Empaque:   { class: 'bg-dorado-500/10 text-dorado-800 border border-dorado-400', dot: 'bg-dorado-600' },
    Terminado: { class: 'bg-cafe-800 text-crema border border-cafe-900',             dot: 'bg-cafe-800'   },
};

export default function StatusBadge({ estado, size = 'md' }: Props) {
    const cfg = CONFIG[estado] ?? CONFIG['Pendiente'];
    return (
        <span className={clsx(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-medium uppercase tracking-wider',
            cfg.class,
            size === 'sm' && 'text-2xs px-1.5',
        )}>
            <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
            {estado}
        </span>
    );
}

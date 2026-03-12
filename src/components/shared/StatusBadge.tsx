import { clsx } from 'clsx';
import type { EstadoPedido } from '@/types';

interface Props { estado: EstadoPedido; size?: 'sm' | 'md'; }

const CONFIG: Record<EstadoPedido, { class: string; dot: string }> = {
    Pendiente: { class: 'badge-pendiente', dot: 'bg-amber-400'  },
    Cortado:   { class: 'badge-cortado',   dot: 'bg-orange-400' },
    Aparado:   { class: 'badge-aparado',   dot: 'bg-blue-400'   },
    Solado:    { class: 'badge-solado',    dot: 'bg-purple-400' },
    Empaque:   { class: 'badge-empaque',   dot: 'bg-teal-400'   },
    Terminado: { class: 'badge-terminado', dot: 'bg-green-400'  },
};

export default function StatusBadge({ estado, size = 'md' }: Props) {
    const cfg = CONFIG[estado] ?? CONFIG['Pendiente'];
    return (
        <span className={clsx('badge', cfg.class, size === 'sm' && 'text-2xs px-1.5')}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
            {estado}
    </span>
    );
}

import { clsx } from 'clsx';
import type { EstadoPedido } from '@/types';

interface Props { estado: EstadoPedido; size?: 'sm' | 'md'; }

const CONFIG: Record<EstadoPedido, { class: string; dot: string }> = {
    Pendiente: { class: 'bg-chart-3/10 text-chart-3 border border-chart-3/30',                dot: 'bg-chart-3' },
    Cortado:   { class: 'bg-chart-4/10 text-chart-4 border border-chart-4/30',                dot: 'bg-chart-4' },
    Aparado:   { class: 'bg-chart-1/10 text-chart-1 border border-chart-1/30',                dot: 'bg-chart-1' },
    Solado:    { class: 'bg-chart-5/10 text-chart-5 border border-chart-5/30',                dot: 'bg-chart-5' },
    Empaque:   { class: 'bg-chart-2/10 text-chart-2 border border-chart-2/30',                dot: 'bg-chart-2' },
    Terminado: { class: 'bg-secondary text-secondary-foreground border border-secondary',     dot: 'bg-secondary-foreground' },
};

export default function StatusBadge({ estado, size = 'md' }: Props) {
    const cfg = CONFIG[estado] ?? CONFIG['Pendiente'];
    return (
        <span className={clsx(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-medium uppercase tracking-wider',
            cfg.class,
            size === 'sm' && 'text-2xs px-1.5',
        )}>
            <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
            {estado}
        </span>
    );
}

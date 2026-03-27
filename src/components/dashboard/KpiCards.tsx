import { TrendingUp, Package, Package2, AlertTriangle, Users } from 'lucide-react';
import { KpiSkeleton } from '@/components/shared/Skeleton';
import { useRole } from '@/hooks/useRole';
import { clsx } from 'clsx';
import type { DashboardKpis } from '@/types';

interface KpiCardProps {
    label:       string;
    value:       string | number;
    icon:        React.ElementType;
    color:       string;
    bg:          string;
    trend:       string;
    alert?:      boolean;
    sub?:        string;
    valueColor?: string;
    financiero?: boolean;
    className?:  string;
}

function KpiCard({ label, value, icon: Icon, color, bg, trend, alert, sub, valueColor, className }: KpiCardProps) {
    return (
        <div className={clsx('kpi-card', alert && 'border-red-300', className)}>
            <div className="flex items-center justify-between">
                <span className="text-xs text-cafe-500 uppercase tracking-wider">{label}</span>
                <div className={clsx('p-2 rounded-lg', bg)}>
                    <Icon size={15} className={color} />
                </div>
            </div>
            <div>
                <p className={clsx('font-display text-2xl font-semibold',
                    valueColor ?? (alert ? 'text-red-600' : 'text-cafe-950'))}>
                    {value}
                </p>
                {sub && <p className="text-xs text-cafe-400 mt-0.5">{sub}</p>}
            </div>
            <div className="flex items-center gap-1 text-xs text-cafe-500">
                <TrendingUp size={11} className="text-dorado-600" />
                {trend}
            </div>
        </div>
    );
}

interface Props {
    kpis:      DashboardKpis | null;
    isLoading: boolean;
}

export default function KpiCards({ kpis, isLoading }: Props) {
    const { isOperario } = useRole();
    const alertasStock = kpis?.alertasStock ?? 0;
    const allCards: KpiCardProps[] = kpis ? [
        {
            label: 'Ventas Totales',
            value: `Bs. ${Number(kpis.totalVentas ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: TrendingUp, color: 'text-dorado-600', bg: 'bg-dorado-500/10', trend: 'Ventas del mes',
            financiero: true,
        },
        {
            label: 'Total Pedidos',
            value: kpis.totalPedidos ?? 0,
            icon: Users, color: 'text-blue-600', bg: 'bg-blue-500/10', trend: 'Con entrega este mes',
        },
        {
            label: 'Ítems Inventario',
            value: kpis.itemsInventario ?? 0,
            icon: Package, color: 'text-teal-600', bg: 'bg-teal-500/10', trend: 'Productos activos',
        },
        {
            label: 'Alertas de Stock',
            value: alertasStock,
            icon: AlertTriangle,
            color:      alertasStock === 0 ? 'text-green-600' : 'text-red-600',
            bg:         alertasStock === 0 ? 'bg-green-500/10' : 'bg-red-500/10',
            trend: 'Requieren reposición',
            alert:      alertasStock > 0,
            valueColor: alertasStock === 0 ? 'text-green-600' : 'text-red-600',
        },
        ...(kpis.produccionMensual !== undefined ? [{
            label: 'Producción Mensual',
            value: `${kpis.produccionMensual} pares`,
            icon: Package2, color: 'text-violet-600', bg: 'bg-violet-500/10',
            trend: 'Pares producidos este mes',
            financiero: true,
        }] : []),
    ] : [];

    const cards = isOperario ? allCards.filter(c => !c.financiero) : allCards;
    const colsClass = !isLoading && cards.length === 5 ? 'xl:grid-cols-5' : 'xl:grid-cols-4';

    const staggerClass = ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5'];

    return (
        <div className={clsx('grid grid-cols-1 sm:grid-cols-2 gap-4', colsClass)}>
            {isLoading
                ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
                : cards.map((card, i) => (
                    <KpiCard
                        key={card.label}
                        {...card}
                        className={clsx('animate-fade-in', staggerClass[i])}
                    />
                ))
            }
        </div>
    );
}

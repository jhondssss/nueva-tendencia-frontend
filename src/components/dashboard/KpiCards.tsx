import { TrendingUp, Package, Package2, AlertTriangle, Users, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useRole } from '@/hooks/useRole';
import { clsx } from 'clsx';
import type { DashboardKpis } from '@/types';

type Accent = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'destructive';

const ACCENT: Record<Accent, { text: string; bg: string; border: string }> = {
    'chart-1':     { text: 'text-chart-1',    bg: 'bg-chart-1/10',    border: 'border-t-chart-1' },
    'chart-2':     { text: 'text-chart-2',    bg: 'bg-chart-2/10',    border: 'border-t-chart-2' },
    'chart-3':     { text: 'text-chart-3',    bg: 'bg-chart-3/10',    border: 'border-t-chart-3' },
    'chart-4':     { text: 'text-chart-4',    bg: 'bg-chart-4/10',    border: 'border-t-chart-4' },
    'destructive': { text: 'text-destructive', bg: 'bg-destructive/10', border: 'border-t-destructive' },
};

interface DetailLine {
    label: string;
    value: number;
}

interface KpiCardProps {
    label:        string;
    value:        string | number;
    icon:         React.ElementType;
    accent:       Accent;
    trend:        string;
    trendInfo?:   string;
    alert?:       boolean;
    sub?:         string;
    financiero?:  boolean;
    className?:   string;
    detailLines?: DetailLine[];
}

function KpiCard({ label, value, icon: Icon, accent, trend, trendInfo, alert, sub, className, detailLines }: KpiCardProps) {
    const a = ACCENT[accent];
    return (
        <div
            className={clsx(
                'relative overflow-hidden rounded-xl border border-t-2 border-border/50 bg-card/50 p-6',
                'flex flex-col gap-3 backdrop-blur transition-all duration-200 hover:scale-[1.01]',
                a.border,
                alert && 'ring-1 ring-destructive/40',
                className,
            )}
        >
            <div className="absolute top-3 right-3">
                <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center', a.bg)}>
                    <Icon size={15} className={a.text} />
                </div>
            </div>
            <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
            </div>
            <div>
                <p className={clsx('font-display text-2xl font-bold tracking-tight',
                    alert ? 'text-destructive' : 'text-foreground')}>
                    {value}
                </p>
                {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
                {detailLines && detailLines.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                        {detailLines.map(line => (
                            <p key={line.label} className="text-[11px] text-muted-foreground leading-tight">
                                <span className="font-medium text-foreground">[{line.label}]</span>{' '}
                                {line.value} {line.label === 'Productos' ? 'requieren reposición' : 'bajo nivel mínimo'}
                            </p>
                        ))}
                    </div>
                )}
            </div>
            <Separator />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp size={11} className={a.text} />
                {trend}
                {trendInfo && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info size={11} className="text-muted-foreground/70 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-56">{trendInfo}</TooltipContent>
                    </Tooltip>
                )}
            </div>
        </div>
    );
}

function KpiCardSkeleton() {
    return (
        <div className="rounded-xl border border-border/50 bg-card/50 p-6 flex flex-col gap-3 backdrop-blur">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20" />
        </div>
    );
}

interface Props {
    kpis:      DashboardKpis | null;
    isLoading: boolean;
}

export default function KpiCards({ kpis, isLoading }: Props) {
    const { isOperario } = useRole();
    const alertasStock   = Number(kpis?.alertasStock   ?? 0);
    const alertasInsumos = Number(kpis?.alertasInsumos ?? 0);
    const alertasTotal   = alertasStock + alertasInsumos;
    const allCards: KpiCardProps[] = kpis ? [
        {
            label: 'Ventas Totales',
            value: `Bs. ${Number(kpis.totalVentas ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: TrendingUp, accent: 'chart-1',
            trend: 'Pedidos completados este mes',
            trendInfo: 'Se cuenta cuando el pedido pasa a Terminado, no cuando se crea.',
            financiero: true,
        },
        {
            label: 'Total Pedidos',
            value: kpis.totalPedidos ?? 0,
            icon: Users, accent: 'chart-2',
            trend: 'Pedidos registrados este mes',
        },
        {
            label: 'Stock Total',
            value: kpis.itemsInventario ?? 0,
            icon: Package, accent: 'chart-4',
            trend: 'Productos activos',
        },
        {
            label: 'Alertas de Stock',
            value: alertasTotal,
            icon: AlertTriangle,
            accent: alertasTotal > 0 ? 'destructive' : 'chart-4',
            trend: 'Alertas de inventario',
            alert: alertasTotal > 0,
            detailLines: [
                { label: 'Productos', value: alertasStock },
                { label: 'Insumos',   value: alertasInsumos },
            ],
        },
        ...(kpis.produccionMensual !== undefined ? [{
            label: 'Producción Mensual',
            value: `${kpis.produccionMensual} pares`,
            icon: Package2, accent: 'chart-3' as Accent,
            trend: 'Pares de pedidos completados este mes',
            trendInfo: 'Se cuenta cuando el pedido pasa a Terminado, no cuando se crea.',
            financiero: true,
        }] : []),
    ] : [];

    const cards = isOperario ? allCards.filter(c => !c.financiero) : allCards;
    const colsClass = !isLoading && cards.length === 5 ? 'xl:grid-cols-5' : 'xl:grid-cols-4';

    const staggerClass = ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5'];

    return (
        <div className={clsx('grid grid-cols-1 sm:grid-cols-2 gap-4', colsClass)}>
            {isLoading
                ? Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
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

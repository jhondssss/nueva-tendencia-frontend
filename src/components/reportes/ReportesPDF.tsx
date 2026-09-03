import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, ClipboardList, AlertTriangle, ArrowLeftRight, Loader2, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRole } from '@/hooks/useRole';
import { reportesApi } from '@/api/services';
import type { ReporteFiltrosPedidos, ReporteFiltrosKardex, CategoriaCalzado } from '@/types';
import FiltrosPedidosReporte from './FiltrosPedidosReporte';
import FiltroCategoria from './FiltroCategoria';
import FiltrosKardexReporte from './FiltrosKardexReporte';
import { limpiarFiltrosPedidos, limpiarFiltrosKardex } from './reporteFiltrosUtils';

interface PdfCard {
    key:      string;
    icon:     LucideIcon;
    title:    string;
    desc:     string;
    fetcher:  () => Promise<{ data: Blob }>;
    filename: () => string;
    extra?:   React.ReactNode;
}

interface Props {
    onDescargar:   (key: string, fetcher: () => Promise<{ data: Blob }>, filename: string) => Promise<void>;
    onVistaPrevia: (key: string, fetcher: () => Promise<{ data: Blob }>) => Promise<void>;
    loading:       Record<string, boolean>;
}

export default function ReportesPDF({ onDescargar, onVistaPrevia, loading }: Props) {
    const { isAdmin } = useRole();
    const currentYear = new Date().getFullYear();
    const [yearVentas, setYearVentas] = useState(currentYear);
    const years = [currentYear - 2, currentYear - 1, currentYear];

    const [filtrosPedidos, setFiltrosPedidos] = useState<ReporteFiltrosPedidos>({});
    const [categoriaStock, setCategoriaStock] = useState<CategoriaCalzado | undefined>(undefined);
    const [filtrosKardex, setFiltrosKardex]   = useState<ReporteFiltrosKardex>({});

    const cards: PdfCard[] = [
        ...(isAdmin ? [{
            key:      'pdf-ventas',
            icon:     TrendingUp,
            title:    'Ventas por Mes',
            desc:     'Tendencia mensual de ingresos por año',
            fetcher:  () => reportesApi.getPdfVentas(yearVentas),
            filename: () => `ventas-${yearVentas}.pdf`,
            extra: (
                <select value={yearVentas} onChange={e => setYearVentas(Number(e.target.value))} className="select text-sm">
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            ),
        }] : []),
        {
            key:      'pdf-pedidos',
            icon:     ClipboardList,
            title:    'Pedidos',
            desc:     'Estado y detalle de todos los pedidos registrados',
            fetcher:  () => reportesApi.getPdfPedidos(limpiarFiltrosPedidos(filtrosPedidos)),
            filename: () => 'pedidos.pdf',
            extra: <FiltrosPedidosReporte value={filtrosPedidos} onChange={setFiltrosPedidos} />,
        },
        {
            key:      'pdf-stock',
            icon:     AlertTriangle,
            title:    'Stock Crítico',
            desc:     'Productos con stock por debajo del nivel mínimo',
            fetcher:  () => reportesApi.getPdfStockCritico(categoriaStock),
            filename: () => 'stock-critico.pdf',
            extra: <FiltroCategoria value={categoriaStock} onChange={setCategoriaStock} />,
        },
        {
            key:      'pdf-kardex',
            icon:     ArrowLeftRight,
            title:    'Kardex',
            desc:     'Movimientos de insumos: entradas, salidas y ajustes',
            fetcher:  () => reportesApi.getPdfKardex(limpiarFiltrosKardex(filtrosKardex)),
            filename: () => 'kardex.pdf',
            extra: <FiltrosKardexReporte value={filtrosKardex} onChange={setFiltrosKardex} />,
        },
    ];

    return (
        <section className="space-y-4">
            <div className="flex items-center gap-2.5">
                <div className="w-1 h-5 rounded-full bg-destructive" />
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Reportes PDF</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cards.map(({ key, icon: Icon, title, desc, fetcher, filename, extra }) => (
                    <div key={key}
                         className="rounded-xl border border-border/50 bg-card/50 backdrop-blur p-5 flex flex-col gap-4
                                    transition-all duration-200 hover:shadow-lg hover:scale-[1.01]">
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 flex-shrink-0">
                                <Icon size={18} className="text-destructive" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground text-sm leading-tight">{title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                            </div>
                        </div>
                        {extra}
                        <div className="mt-auto grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                onClick={() => void onVistaPrevia(`preview-${key}`, fetcher)}
                                disabled={!!loading[`preview-${key}`]}
                                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                {loading[`preview-${key}`]
                                    ? <><Loader2 size={13} className="animate-spin" /> Cargando...</>
                                    : <><Eye size={13} /> Vista previa</>
                                }
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => void onDescargar(key, fetcher, filename())}
                                disabled={!!loading[key]}
                                className="hover:scale-[1.02] transition-transform">
                                {loading[key]
                                    ? <><Loader2 size={13} className="animate-spin" /> Generando...</>
                                    : <><Download size={13} /> Descargar</>
                                }
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

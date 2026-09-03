import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { FileSpreadsheet, Users, Package, ArrowLeftRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRole } from '@/hooks/useRole';
import { reportesApi } from '@/api/services';
import type { ReporteFiltrosPedidos, ReporteFiltrosKardex, CategoriaCalzado } from '@/types';
import FiltrosPedidosReporte from './FiltrosPedidosReporte';
import FiltroCategoria from './FiltroCategoria';
import FiltrosKardexReporte from './FiltrosKardexReporte';
import { limpiarFiltrosPedidos, limpiarFiltrosKardex } from './reporteFiltrosUtils';

interface ExcelCard {
    key:      string;
    icon:     LucideIcon;
    title:    string;
    desc:     string;
    fetcher:  () => Promise<{ data: Blob }>;
    filename: string;
    extra?:   React.ReactNode;
}

interface Props {
    onDescargar: (key: string, fetcher: () => Promise<{ data: Blob }>, filename: string) => Promise<void>;
    loading:     Record<string, boolean>;
}

export default function ReportesExcel({ onDescargar, loading }: Props) {
    const { isAdmin } = useRole();

    const [filtrosPedidos, setFiltrosPedidos] = useState<ReporteFiltrosPedidos>({});
    const [categoriaStock, setCategoriaStock] = useState<CategoriaCalzado | undefined>(undefined);
    const [filtrosKardex, setFiltrosKardex]   = useState<ReporteFiltrosKardex>({});

    const CARDS: ExcelCard[] = [
        {
            key:      'excel-pedidos',
            icon:     FileSpreadsheet,
            title:    'Pedidos',
            desc:     'Exportación completa de pedidos con detalle',
            fetcher:  () => reportesApi.getExcelPedidos(limpiarFiltrosPedidos(filtrosPedidos)),
            filename: 'pedidos.xlsx',
            extra: <FiltrosPedidosReporte value={filtrosPedidos} onChange={setFiltrosPedidos} />,
        },
        {
            key:      'excel-clientes',
            icon:     Users,
            title:    'Clientes',
            desc:     'Base de datos completa de clientes',
            fetcher:  () => reportesApi.getExcelClientes(),
            filename: 'clientes.xlsx',
        },
        {
            key:      'excel-stock',
            icon:     Package,
            title:    'Stock',
            desc:     'Inventario completo con niveles y alertas',
            fetcher:  () => reportesApi.getExcelStock(categoriaStock),
            filename: 'stock.xlsx',
            extra: <FiltroCategoria value={categoriaStock} onChange={setCategoriaStock} />,
        },
        {
            key:      'excel-kardex',
            icon:     ArrowLeftRight,
            title:    'Kardex',
            desc:     'Exportación de movimientos de insumos con detalle',
            fetcher:  () => reportesApi.getExcelKardex(limpiarFiltrosKardex(filtrosKardex)),
            filename: 'kardex.xlsx',
            extra: <FiltrosKardexReporte value={filtrosKardex} onChange={setFiltrosKardex} />,
        },
    ];

    const cards = isAdmin ? CARDS : CARDS.filter(c => c.key !== 'excel-clientes');

    return (
        <section className="space-y-4">
            <div className="flex items-center gap-2.5">
                <div className="w-1 h-5 rounded-full bg-secondary" />
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Exportar Excel</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cards.map(({ key, icon: Icon, title, desc, fetcher, filename, extra }) => (
                    <div key={key}
                         className="rounded-xl border border-border/50 bg-card/50 backdrop-blur p-5 flex flex-col gap-4
                                    transition-all duration-200 hover:shadow-lg hover:scale-[1.01]">
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-lg bg-secondary/10 border border-secondary/20 flex-shrink-0">
                                <Icon size={18} className="text-secondary" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground text-sm leading-tight">{title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                            </div>
                        </div>
                        {extra}
                        <Button
                            variant="secondary"
                            onClick={() => void onDescargar(key, fetcher, filename)}
                            disabled={!!loading[key]}
                            className="mt-auto hover:scale-[1.02] transition-transform">
                            {loading[key]
                                ? <><Loader2 size={13} className="animate-spin" /> Exportando...</>
                                : <><FileSpreadsheet size={13} /> Exportar Excel</>
                            }
                        </Button>
                    </div>
                ))}
            </div>
        </section>
    );
}

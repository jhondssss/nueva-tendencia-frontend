import type { LucideIcon } from 'lucide-react';
import { FileSpreadsheet, Users, Package, Loader2 } from 'lucide-react';

const BACKEND_URL = 'https://nueva-tendencia-backend-production.up.railway.app';

interface ExcelCard {
    key:      string;
    icon:     LucideIcon;
    title:    string;
    desc:     string;
    url:      string;
    filename: string;
}

const CARDS: ExcelCard[] = [
    {
        key:      'excel-pedidos',
        icon:     FileSpreadsheet,
        title:    'Pedidos',
        desc:     'Exportación completa de pedidos con detalle',
        url:      `${BACKEND_URL}/reportes/excel/pedidos`,
        filename: 'pedidos.xlsx',
    },
    {
        key:      'excel-clientes',
        icon:     Users,
        title:    'Clientes',
        desc:     'Base de datos completa de clientes',
        url:      `${BACKEND_URL}/reportes/excel/clientes`,
        filename: 'clientes.xlsx',
    },
    {
        key:      'excel-stock',
        icon:     Package,
        title:    'Stock',
        desc:     'Inventario completo con niveles y alertas',
        url:      `${BACKEND_URL}/reportes/excel/stock`,
        filename: 'stock.xlsx',
    },
];

interface Props {
    onDescargar: (key: string, url: string, filename: string) => Promise<void>;
    loading:     Record<string, boolean>;
}

export default function ReportesExcel({ onDescargar, loading }: Props) {
    return (
        <section className="space-y-4">
            <div className="flex items-center gap-2.5">
                <div className="w-1 h-5 rounded-full bg-green-600" />
                <h2 className="text-xs font-semibold text-cafe-700 uppercase tracking-widest">Exportar Excel</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CARDS.map(({ key, icon: Icon, title, desc, url, filename }) => (
                    <div key={key} className="card p-5 flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-lg bg-green-50 border border-green-100 flex-shrink-0">
                                <Icon size={18} className="text-green-700" />
                            </div>
                            <div>
                                <p className="font-semibold text-cafe-900 text-sm leading-tight">{title}</p>
                                <p className="text-xs text-cafe-500 mt-0.5 leading-relaxed">{desc}</p>
                            </div>
                        </div>
                        <button onClick={() => void onDescargar(key, url, filename)}
                                disabled={!!loading[key]}
                                className="mt-auto flex items-center justify-center gap-2 w-full px-4 py-2
                                           rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-medium
                                           disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                            {loading[key]
                                ? <><Loader2 size={13} className="animate-spin" /> Exportando...</>
                                : <><FileSpreadsheet size={13} /> Exportar Excel</>
                            }
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, ClipboardList, AlertTriangle, Loader2, Download, Eye } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_URL;

interface PdfCard {
    key:      string;
    icon:     LucideIcon;
    title:    string;
    desc:     string;
    url:      () => string;
    filename: () => string;
    extra?:   React.ReactNode;
}

interface Props {
    onDescargar:   (key: string, url: string, filename: string) => Promise<void>;
    onVistaPrevia: (key: string, url: string) => Promise<void>;
    loading:       Record<string, boolean>;
}

export default function ReportesPDF({ onDescargar, onVistaPrevia, loading }: Props) {
    const currentYear = new Date().getFullYear();
    const [yearVentas, setYearVentas] = useState(currentYear);
    const years = [currentYear - 2, currentYear - 1, currentYear];

    const cards: PdfCard[] = [
        {
            key:      'pdf-ventas',
            icon:     TrendingUp,
            title:    'Ventas por Mes',
            desc:     'Tendencia mensual de ingresos por año',
            url:      () => `${BACKEND_URL}/reportes/pdf/ventas?year=${yearVentas}`,
            filename: () => `ventas-${yearVentas}.pdf`,
            extra: (
                <select value={yearVentas} onChange={e => setYearVentas(Number(e.target.value))} className="select text-sm">
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            ),
        },
        {
            key:      'pdf-pedidos',
            icon:     ClipboardList,
            title:    'Pedidos',
            desc:     'Estado y detalle de todos los pedidos registrados',
            url:      () => `${BACKEND_URL}/reportes/pdf/pedidos`,
            filename: () => 'pedidos.pdf',
        },
        {
            key:      'pdf-stock',
            icon:     AlertTriangle,
            title:    'Stock Crítico',
            desc:     'Productos con stock por debajo del nivel mínimo',
            url:      () => `${BACKEND_URL}/reportes/pdf/stock-critico`,
            filename: () => 'stock-critico.pdf',
        },
    ];

    return (
        <section className="space-y-4">
            <div className="flex items-center gap-2.5">
                <div className="w-1 h-5 rounded-full bg-red-500" />
                <h2 className="text-xs font-semibold text-cafe-700 uppercase tracking-widest">Reportes PDF</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cards.map(({ key, icon: Icon, title, desc, url, filename, extra }) => (
                    <div key={key} className="card p-5 flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-lg bg-red-50 border border-red-100 flex-shrink-0">
                                <Icon size={18} className="text-red-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-cafe-900 text-sm leading-tight">{title}</p>
                                <p className="text-xs text-cafe-500 mt-0.5 leading-relaxed">{desc}</p>
                            </div>
                        </div>
                        {extra}
                        <div className="mt-auto grid grid-cols-2 gap-2">
                            <button
                                onClick={() => void onVistaPrevia(key, url())}
                                disabled={!!loading[`preview-${key}`]}
                                className="flex items-center justify-center gap-1.5 w-full px-3 py-2
                                           rounded-lg border border-red-200 text-red-600 hover:bg-red-50
                                           text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                                {loading[`preview-${key}`]
                                    ? <><Loader2 size={13} className="animate-spin" /> Cargando...</>
                                    : <><Eye size={13} /> Vista previa</>
                                }
                            </button>
                            <button
                                onClick={() => void onDescargar(key, url(), filename())}
                                disabled={!!loading[key]}
                                className="flex items-center justify-center gap-1.5 w-full px-3 py-2
                                           rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium
                                           disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                                {loading[key]
                                    ? <><Loader2 size={13} className="animate-spin" /> Generando...</>
                                    : <><Download size={13} /> Descargar</>
                                }
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

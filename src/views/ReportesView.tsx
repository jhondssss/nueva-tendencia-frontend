import { useState, useEffect } from 'react';
import { TrendingUp, FileText, FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { reportesApi } from '@/api/services';
import ReportesPDF from '@/components/reportes/ReportesPDF';
import ReportesExcel from '@/components/reportes/ReportesExcel';
import SelectorMesAnio, { MESES } from '@/components/reportes/SelectorMesAnio';

export default function ReportesView() {
    const currentYear  = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const [gananciasMes,  setGananciasMes]  = useState(currentMonth);
    const [gananciasYear, setGananciasYear] = useState(currentYear);
    const [loading, setLoading]             = useState<Record<string, boolean>>({});

    useEffect(() => { document.title = 'Reportes | NT'; }, []);

    const descargar = async (key: string, url: string, filename: string) => {
        setLoading(prev => ({ ...prev, [key]: true }));
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            triggerDownload(blob, filename);
            toast.success('Reporte descargado');
        } catch (err) {
            console.error('[Reportes]', err);
            toast.error('Error al descargar el reporte');
        } finally {
            setLoading(prev => ({ ...prev, [key]: false }));
        }
    };

    const descargarConApi = async (key: string, fetcher: () => Promise<{ data: Blob }>, filename: string) => {
        setLoading(prev => ({ ...prev, [key]: true }));
        try {
            const res = await fetcher();
            triggerDownload(res.data, filename);
            toast.success('Reporte descargado');
        } catch (err) {
            console.error('[Reportes]', err);
            toast.error('Error al descargar el reporte');
        } finally {
            setLoading(prev => ({ ...prev, [key]: false }));
        }
    };

    function triggerDownload(blob: Blob, filename: string) {
        const href = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = href; a.download = filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(href);
    }

    const mesLabel = MESES[gananciasMes - 1].label.toLowerCase();

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Reportes</h1>
                    <p className="page-subtitle">Descarga estadísticas y exporta datos</p>
                </div>
            </div>

            <ReportesPDF onDescargar={descargar} loading={loading} />

            <ReportesExcel onDescargar={descargar} loading={loading} />

            <section className="space-y-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-1 h-5 rounded-full bg-dorado-500" />
                    <h2 className="text-xs font-semibold text-cafe-700 uppercase tracking-widest">
                        Reportes de Entregas y Ganancias
                    </h2>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            {
                                key: 'pdf-pedidos-entregados', icon: FileText, title: 'Pedidos Entregados PDF',
                                desc: 'Listado completo de pedidos en estado Terminado',
                                btnClass: 'bg-red-600 hover:bg-red-500',
                                fetcher: () => reportesApi.getPdfPedidosEntregados(),
                                filename: 'pedidos-entregados.pdf',
                                label: 'Descargar PDF', icon2: Download,
                                iconBg: 'bg-red-50 border-red-100', iconCls: 'text-red-600',
                            },
                            {
                                key: 'excel-pedidos-entregados', icon: FileSpreadsheet, title: 'Pedidos Entregados Excel',
                                desc: 'Exportación de pedidos terminados con detalle',
                                btnClass: 'bg-green-700 hover:bg-green-600',
                                fetcher: () => reportesApi.getExcelPedidosEntregados(),
                                filename: 'pedidos-entregados.xlsx',
                                label: 'Exportar Excel', icon2: FileSpreadsheet,
                                iconBg: 'bg-green-50 border-green-100', iconCls: 'text-green-700',
                            },
                        ].map(({ key, icon: Icon, title, desc, btnClass, fetcher, filename, label, icon2: Icon2, iconBg, iconCls }) => (
                            <div key={key} className="card p-5 flex flex-col gap-4">
                                <div className="flex items-start gap-3">
                                    <div className={`p-2.5 rounded-lg border flex-shrink-0 ${iconBg}`}>
                                        <Icon size={18} className={iconCls} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-cafe-900 text-sm leading-tight">{title}</p>
                                        <p className="text-xs text-cafe-500 mt-0.5 leading-relaxed">{desc}</p>
                                    </div>
                                </div>
                                <button onClick={() => void descargarConApi(key, fetcher, filename)}
                                        disabled={!!loading[key]}
                                        className={`mt-auto flex items-center justify-center gap-2 w-full px-4 py-2
                                                    rounded-lg text-white text-sm font-medium
                                                    disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${btnClass}`}>
                                    {loading[key]
                                        ? <><Loader2 size={13} className="animate-spin" /> Generando...</>
                                        : <><Icon2 size={13} /> {label}</>
                                    }
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="card p-5 space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-lg bg-dorado-50 border border-dorado-100 flex-shrink-0">
                                <TrendingUp size={18} className="text-dorado-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-cafe-900 text-sm leading-tight">Ganancias del Mes</p>
                                <p className="text-xs text-cafe-500 mt-0.5 leading-relaxed">
                                    Reporte de ingresos y ganancias para el período seleccionado
                                </p>
                            </div>
                        </div>

                        <SelectorMesAnio mes={gananciasMes} anio={gananciasYear}
                                         onMesChange={setGananciasMes} onAnioChange={setGananciasYear} />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button onClick={() => void descargarConApi('pdf-ganancias',
                                        () => reportesApi.getPdfGanancias(gananciasMes, gananciasYear),
                                        `ganancias-${mesLabel}-${gananciasYear}.pdf`)}
                                    disabled={!!loading['pdf-ganancias']}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-2
                                               rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium
                                               disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                                {loading['pdf-ganancias']
                                    ? <><Loader2 size={13} className="animate-spin" /> Generando...</>
                                    : <><Download size={13} /> Descargar PDF</>
                                }
                            </button>
                            <button onClick={() => void descargarConApi('excel-ganancias',
                                        () => reportesApi.getExcelGanancias(gananciasMes, gananciasYear),
                                        `ganancias-${mesLabel}-${gananciasYear}.xlsx`)}
                                    disabled={!!loading['excel-ganancias']}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-2
                                               rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-medium
                                               disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                                {loading['excel-ganancias']
                                    ? <><Loader2 size={13} className="animate-spin" /> Exportando...</>
                                    : <><FileSpreadsheet size={13} /> Exportar Excel</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

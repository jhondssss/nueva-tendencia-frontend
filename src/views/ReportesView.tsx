import { useState, useEffect } from 'react';
import { TrendingUp, FileText, FileSpreadsheet, Download, Loader2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { reportesApi } from '@/api/services';
import { Button } from '@/components/ui/button';
import ReportesPDF from '@/components/reportes/ReportesPDF';
import ReportesExcel from '@/components/reportes/ReportesExcel';
import SelectorMesAnio, { MESES } from '@/components/reportes/SelectorMesAnio';
import { useRole } from '@/hooks/useRole';

const ENTREGAS_CARDS = [
    {
        key: 'pdf-pedidos-entregados', icon: FileText, title: 'Pedidos Entregados PDF',
        desc: 'Listado completo de pedidos en estado Terminado',
        fetcher: () => reportesApi.getPdfPedidosEntregados(),
        filename: 'pedidos-entregados.pdf',
        label: 'Descargar PDF', icon2: Download,
        iconBg: 'bg-destructive/10 border-destructive/20', iconCls: 'text-destructive',
        isPdf: true,
    },
    {
        key: 'excel-pedidos-entregados', icon: FileSpreadsheet, title: 'Pedidos Entregados Excel',
        desc: 'Exportación de pedidos terminados con detalle',
        fetcher: () => reportesApi.getExcelPedidosEntregados(),
        filename: 'pedidos-entregados.xlsx',
        label: 'Exportar Excel', icon2: FileSpreadsheet,
        iconBg: 'bg-secondary/10 border-secondary/20', iconCls: 'text-secondary',
        isPdf: false,
    },
];

export default function ReportesView() {
    const { isAdmin }  = useRole();
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

    const vistaPreviaUrl = async (key: string, url: string) => {
        setLoading(prev => ({ ...prev, [`preview-${key}`]: true }));
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            window.open(objectUrl, '_blank');
            setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
        } catch (err) {
            console.error('[Reportes]', err);
            toast.error('Error al previsualizar el reporte');
        } finally {
            setLoading(prev => ({ ...prev, [`preview-${key}`]: false }));
        }
    };

    const vistaPreviaConApi = async (key: string, fetcher: () => Promise<{ data: Blob }>) => {
        setLoading(prev => ({ ...prev, [key]: true }));
        try {
            const res = await fetcher();
            const objectUrl = URL.createObjectURL(res.data);
            window.open(objectUrl, '_blank');
            setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
        } catch (err) {
            console.error('[Reportes]', err);
            toast.error('Error al previsualizar el reporte');
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
                    <h1 className="page-title section-title">Reportes</h1>
                    <p className="page-subtitle">Descarga estadísticas y exporta datos</p>
                </div>
            </div>

            <ReportesPDF onDescargar={descargar} onVistaPrevia={vistaPreviaUrl} loading={loading} />

            <ReportesExcel onDescargar={descargar} loading={loading} />

            <section className="space-y-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-1 h-5 rounded-full bg-chart-3" />
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                        Reportes de Entregas y Ganancias
                    </h2>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ENTREGAS_CARDS.map(({ key, icon: Icon, title, desc, fetcher, filename, label, icon2: Icon2, iconBg, iconCls, isPdf }) => (
                            <div key={key}
                                 className="rounded-xl border border-border/50 bg-card/50 backdrop-blur p-5 flex flex-col gap-4
                                            transition-all duration-200 hover:shadow-lg hover:scale-[1.01]">
                                <div className="flex items-start gap-3">
                                    <div className={`p-2.5 rounded-lg border flex-shrink-0 ${iconBg}`}>
                                        <Icon size={18} className={iconCls} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground text-sm leading-tight">{title}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                                    </div>
                                </div>
                                {isPdf ? (
                                    <div className="mt-auto grid grid-cols-2 gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => void vistaPreviaConApi(`preview-${key}`, fetcher)}
                                            disabled={!!loading[`preview-${key}`]}
                                            className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                            {loading[`preview-${key}`]
                                                ? <><Loader2 size={13} className="animate-spin" /> Cargando...</>
                                                : <><Eye size={13} /> Vista previa</>
                                            }
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={() => void descargarConApi(key, fetcher, filename)}
                                            disabled={!!loading[key]}
                                            className="hover:scale-[1.02] transition-transform">
                                            {loading[key]
                                                ? <><Loader2 size={13} className="animate-spin" /> Generando...</>
                                                : <><Icon2 size={13} /> {label}</>
                                            }
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        variant="secondary"
                                        onClick={() => void descargarConApi(key, fetcher, filename)}
                                        disabled={!!loading[key]}
                                        className="mt-auto hover:scale-[1.02] transition-transform">
                                        {loading[key]
                                            ? <><Loader2 size={13} className="animate-spin" /> Generando...</>
                                            : <><Icon2 size={13} /> {label}</>
                                        }
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>

                    {isAdmin && (
                        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur p-5 space-y-4
                                        transition-all duration-200 hover:shadow-lg">
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 rounded-lg bg-chart-3/10 border border-chart-3/20 flex-shrink-0">
                                    <TrendingUp size={18} className="text-chart-3" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground text-sm leading-tight">Ganancias del Mes</p>
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                        Reporte de ingresos y ganancias para el período seleccionado
                                    </p>
                                </div>
                            </div>

                            <SelectorMesAnio mes={gananciasMes} anio={gananciasYear}
                                             onMesChange={setGananciasMes} onAnioChange={setGananciasYear} />

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => void vistaPreviaConApi('preview-pdf-ganancias',
                                        () => reportesApi.getPdfGanancias(gananciasMes, gananciasYear))}
                                    disabled={!!loading['preview-pdf-ganancias']}
                                    className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                    {loading['preview-pdf-ganancias']
                                        ? <><Loader2 size={13} className="animate-spin" /> Cargando...</>
                                        : <><Eye size={13} /> Vista previa</>
                                    }
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => void descargarConApi('pdf-ganancias',
                                        () => reportesApi.getPdfGanancias(gananciasMes, gananciasYear),
                                        `ganancias-${mesLabel}-${gananciasYear}.pdf`)}
                                    disabled={!!loading['pdf-ganancias']}
                                    className="hover:scale-[1.02] transition-transform">
                                    {loading['pdf-ganancias']
                                        ? <><Loader2 size={13} className="animate-spin" /> Generando...</>
                                        : <><Download size={13} /> Descargar PDF</>
                                    }
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => void descargarConApi('excel-ganancias',
                                        () => reportesApi.getExcelGanancias(gananciasMes, gananciasYear),
                                        `ganancias-${mesLabel}-${gananciasYear}.xlsx`)}
                                    disabled={!!loading['excel-ganancias']}
                                    className="hover:scale-[1.02] transition-transform">
                                    {loading['excel-ganancias']
                                        ? <><Loader2 size={13} className="animate-spin" /> Exportando...</>
                                        : <><FileSpreadsheet size={13} /> Exportar Excel</>
                                    }
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

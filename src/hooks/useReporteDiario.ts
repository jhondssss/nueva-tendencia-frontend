import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { reportesApi } from '@/api/services';
import type { ReporteDiario } from '@/types';

const REFRESH_MS = 5 * 60 * 1000; // 5 minutos

function triggerDownload(blob: Blob, filename: string) {
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(href);
}

function today(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Carga el resumen diario, lo normaliza a `ReporteDiario` y expone las descargas de PDF/Excel. */
export function useReporteDiario() {
    const [data, setData]           = useState<ReporteDiario | null>(null);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(false);
    const [loadingPdf, setLoadingPdf] = useState(false);
    const [loadingXls, setLoadingXls] = useState(false);

    const cargar = useCallback(async (silencioso = false) => {
        if (!silencioso) { setLoading(true); setError(false); }
        try {
            const res = await reportesApi.getDiario();
            const d = res.data; // backend devuelve las entidades crudas, sin objeto "resumen" anidado

            const pedidosCreados    = Array.isArray(d.pedidosCreados)    ? d.pedidosCreados    : [];
            const pedidosMovidos    = Array.isArray(d.pedidosMovidos)    ? d.pedidosMovidos    : [];
            const pedidosTerminados = Array.isArray(d.pedidosTerminados) ? d.pedidosTerminados : [];

            setData({
                resumen: {
                    pedidos_creados:    pedidosCreados.length,
                    pedidos_movidos:    pedidosMovidos.length,
                    ventas_total:       pedidosTerminados.reduce((s, v) => s + Number(v.total ?? 0), 0),
                    movimientos_kardex: Array.isArray(d.movimientosKardex) ? d.movimientosKardex.length : 0,
                    alertas_criticas:   (d.alertasStock?.length ?? 0) + (d.alertasInsumos?.length ?? 0),
                },
                pedidos_creados:    pedidosCreados,
                pedidos_movidos:    pedidosMovidos,
                ventas:             pedidosTerminados,
                movimientos_kardex: Array.isArray(d.movimientosKardex) ? d.movimientosKardex : [],
                alertas: {
                    productos: d.alertasStock   ?? [],
                    insumos:   d.alertasInsumos ?? [],
                },
                actividad: d.accionesAuditoria ?? [],
            });
        } catch {
            if (!silencioso) { toast.error('Error al cargar el reporte diario'); setError(true); }
        } finally {
            if (!silencioso) setLoading(false);
        }
    }, []);

    useEffect(() => {
        void cargar();
        const id = setInterval(() => void cargar(true), REFRESH_MS);
        return () => clearInterval(id);
    }, [cargar]);

    const descargarPdf = async () => {
        setLoadingPdf(true);
        try {
            const res = await reportesApi.getPdfDiario();
            triggerDownload(res.data, `reporte-diario-${today()}.pdf`);
            toast.success('PDF descargado');
        } catch {
            toast.error('Error al generar el PDF');
        } finally {
            setLoadingPdf(false);
        }
    };

    const descargarExcel = async () => {
        setLoadingXls(true);
        try {
            const res = await reportesApi.getExcelDiario();
            triggerDownload(res.data, `reporte-diario-${today()}.xlsx`);
            toast.success('Excel descargado');
        } catch {
            toast.error('Error al generar el Excel');
        } finally {
            setLoadingXls(false);
        }
    };

    return { data, loading, error, cargar, loadingPdf, loadingXls, descargarPdf, descargarExcel };
}

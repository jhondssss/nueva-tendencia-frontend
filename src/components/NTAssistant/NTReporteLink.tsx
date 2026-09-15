import { Download } from 'lucide-react';

interface Props {
    url: string;
}

const REPORTE_LABELS: Record<string, string> = {
    ventas: 'Reporte de ventas',
    pedidos: 'Reporte de pedidos',
    'pedidos-entregados': 'Reporte de pedidos entregados',
    stock: 'Reporte de stock crítico',
    'stock-critico': 'Reporte de stock crítico',
    kardex: 'Reporte de kardex',
    ganancias: 'Reporte de ganancias',
};

function describirReporte(url: string): string {
    const match = url.match(/\/reportes\/(?:pdf|excel)\/([a-z-]+)/i);
    return (match && REPORTE_LABELS[match[1]]) ?? 'Reporte';
}

/** Botón inline que reemplaza la URL cruda de un reporte (PDF/Excel) detectada en la
 * respuesta del asistente. A diferencia de NTPedidoLink (navegación con react-router),
 * esto es una descarga de archivo: abre la URL real del backend en una pestaña nueva. */
export default function NTReporteLink({ url }: Props) {
    return (
        <button
            type="button"
            onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-md
                       bg-primary/10 text-primary font-medium text-xs
                       hover:bg-primary/20 transition-colors"
        >
            <Download size={12} />
            Descargar: {describirReporte(url)}
        </button>
    );
}

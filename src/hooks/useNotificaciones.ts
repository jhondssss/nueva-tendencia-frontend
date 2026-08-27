import { useCallback, useEffect, useState } from 'react';
import { solicitudPedidoApi, dashboardApi } from '@/api/services';

export interface NotificacionItem {
    id:        string;
    tipo:      'solicitud' | 'stock';
    titulo:    string;
    subtitulo: string;
    ruta:      string;
}

const MAX_ITEMS_POR_GRUPO = 5;

export function useNotificaciones() {
    const [solicitudes, setSolicitudes] = useState<NotificacionItem[]>([]);
    const [stockCritico, setStockCritico] = useState<NotificacionItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotificaciones = useCallback(async () => {
        setIsLoading(true);
        try {
            const [solicitudesRes, stockRes] = await Promise.all([
                solicitudPedidoApi.getAll('Pendiente'),
                dashboardApi.prediccionStock(),
            ]);

            setSolicitudes(
                solicitudesRes.data.data.slice(0, MAX_ITEMS_POR_GRUPO).map(s => ({
                    id:        `solicitud-${s.id_solicitud}`,
                    tipo:      'solicitud' as const,
                    titulo:    s.cliente.nombre_completo ?? s.cliente.nombre,
                    subtitulo: `${s.cantidad_pares} par${s.cantidad_pares === 1 ? '' : 'es'} · ${s.producto.nombre_modelo}`,
                    ruta:      '/solicitudes',
                })),
            );

            setStockCritico(
                stockRes.data
                    .filter(p => p.semanas_restantes !== null && Number(p.semanas_restantes) <= 2)
                    .slice(0, MAX_ITEMS_POR_GRUPO)
                    .map(p => ({
                        id:        `stock-${p.id}`,
                        tipo:      'stock' as const,
                        titulo:    p.nombre,
                        subtitulo: `${p.stock} u. en stock (mín. ${p.nivel_minimo})`,
                        ruta:      '/productos',
                    })),
            );
        } catch (err) {
            console.error('[Notificaciones] Error al cargar notificaciones:', err);
            setSolicitudes([]);
            setStockCritico([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchNotificaciones(); }, [fetchNotificaciones]);

    const total = solicitudes.length + stockCritico.length;

    return { solicitudes, stockCritico, total, isLoading, refetch: fetchNotificaciones };
}

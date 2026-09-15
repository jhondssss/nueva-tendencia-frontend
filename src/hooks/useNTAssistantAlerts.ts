import { useEffect, useState } from 'react';
import { dashboardApi } from '@/api/services';
import { useRole } from './useRole';

/**
 * Indica si hay algo urgente que el usuario todavía no vio (stock crítico o
 * pedidos próximos a vencer), para el punto rojo de la burbuja del NTAssistant.
 * Es un fetch propio y liviano (no pasa por useDashboardStore) porque este hook
 * vive en toda la app, no solo en DashboardView.
 */
export function useNTAssistantAlerts(): boolean {
    const { isAdmin, isOperario } = useRole();
    const [hasUrgente, setHasUrgente] = useState(false);

    useEffect(() => {
        if (!isAdmin && !isOperario) return;

        let cancelado = false;
        const silent = { headers: { 'x-silent': 'true' } };

        Promise.all([dashboardApi.getKpis(silent), dashboardApi.proximosAEntregar(silent)])
            .then(([kpis, proximos]) => {
                if (cancelado) return;
                const urgente = kpis.data.alertasStock > 0
                    || kpis.data.alertasInsumos > 0
                    || proximos.data.length > 0;
                setHasUrgente(urgente);
            })
            .catch(() => {}); // indicador proactivo: si falla, simplemente no se muestra el punto

        return () => { cancelado = true; };
    }, [isAdmin, isOperario]);

    return hasUrgente;
}

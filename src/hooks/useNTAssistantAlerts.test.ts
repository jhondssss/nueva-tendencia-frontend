import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNTAssistantAlerts } from './useNTAssistantAlerts';
import { dashboardApi } from '@/api/services';
import { useAuthStore } from '@/stores/auth.store';

vi.mock('@/api/services', () => ({
    dashboardApi: { getKpis: vi.fn(), proximosAEntregar: vi.fn() },
}));

const getKpisMock           = vi.mocked(dashboardApi.getKpis);
const proximosAEntregarMock = vi.mocked(dashboardApi.proximosAEntregar);

function setRole(role: 'admin' | 'operario' | 'cliente') {
    useAuthStore.setState({
        user: { id: 1, email: `${role}@nuevatendencia.com`, role },
        isAuthenticated: true, isLoading: false, passwordChanged: false,
    });
}

function kpis(overrides: Partial<{ alertasStock: number; alertasInsumos: number }> = {}) {
    return {
        data: {
            totalVentas: 0, totalPedidos: 0, itemsInventario: 0,
            alertasStock: 0, alertasInsumos: 0, ...overrides,
        },
    } as never;
}

describe('useNTAssistantAlerts', () => {
    beforeEach(() => {
        getKpisMock.mockReset();
        proximosAEntregarMock.mockReset();
        setRole('admin');
    });

    it('no hace fetch si el rol es cliente', () => {
        setRole('cliente');
        renderHook(() => useNTAssistantAlerts());

        expect(getKpisMock).not.toHaveBeenCalled();
        expect(proximosAEntregarMock).not.toHaveBeenCalled();
    });

    it('devuelve true cuando hay alertas de stock', async () => {
        getKpisMock.mockResolvedValueOnce(kpis({ alertasStock: 2 }));
        proximosAEntregarMock.mockResolvedValueOnce({ data: [] } as never);

        const { result } = renderHook(() => useNTAssistantAlerts());

        await waitFor(() => expect(result.current).toBe(true));
    });

    it('devuelve true cuando hay pedidos próximos a entregar', async () => {
        getKpisMock.mockResolvedValueOnce(kpis());
        proximosAEntregarMock.mockResolvedValueOnce({ data: [{ id: 1 }] } as never);

        const { result } = renderHook(() => useNTAssistantAlerts());

        await waitFor(() => expect(result.current).toBe(true));
    });

    it('devuelve false cuando no hay nada urgente', async () => {
        getKpisMock.mockResolvedValueOnce(kpis());
        proximosAEntregarMock.mockResolvedValueOnce({ data: [] } as never);

        const { result } = renderHook(() => useNTAssistantAlerts());

        await waitFor(() => expect(getKpisMock).toHaveBeenCalled());
        expect(result.current).toBe(false);
    });

    it('pasa x-silent para no mostrar toast de error si falla', async () => {
        getKpisMock.mockResolvedValueOnce(kpis());
        proximosAEntregarMock.mockResolvedValueOnce({ data: [] } as never);

        renderHook(() => useNTAssistantAlerts());

        await waitFor(() => expect(getKpisMock).toHaveBeenCalledWith({ headers: { 'x-silent': 'true' } }));
        expect(proximosAEntregarMock).toHaveBeenCalledWith({ headers: { 'x-silent': 'true' } });
    });

    it('se queda en false silenciosamente si el fetch falla', async () => {
        getKpisMock.mockRejectedValueOnce(new Error('network error'));
        proximosAEntregarMock.mockResolvedValueOnce({ data: [] } as never);

        const { result } = renderHook(() => useNTAssistantAlerts());

        await waitFor(() => expect(getKpisMock).toHaveBeenCalled());
        expect(result.current).toBe(false);
    });
});

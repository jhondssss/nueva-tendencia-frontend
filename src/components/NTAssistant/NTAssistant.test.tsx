import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NTAssistant from './NTAssistant';
import { useNTAssistant } from '@/hooks/useNTAssistant';
import { useAuthStore } from '@/stores/auth.store';
import { dashboardApi } from '@/api/services';

vi.mock('@/hooks/useNTAssistant');
vi.mock('@/api/services', () => ({
    dashboardApi: { getKpis: vi.fn(), proximosAEntregar: vi.fn() },
}));

const getKpisMock           = vi.mocked(dashboardApi.getKpis);
const proximosAEntregarMock = vi.mocked(dashboardApi.proximosAEntregar);

function sinAlertasUrgentes() {
    getKpisMock.mockResolvedValue({
        data: { totalVentas: 0, totalPedidos: 0, itemsInventario: 0, alertasStock: 0, alertasInsumos: 0 },
    } as never);
    proximosAEntregarMock.mockResolvedValue({ data: [] } as never);
}

function setRole(role: 'admin' | 'operario' | 'cliente') {
    useAuthStore.setState({
        user: { id: 1, email: `${role}@nuevatendencia.com`, role },
        isAuthenticated: true, isLoading: false, passwordChanged: false,
    });
}

// jsdom no implementa matchMedia; NTAssistant lo usa para saber si está en desktop (drag del panel/burbuja).
beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
    getKpisMock.mockReset();
    proximosAEntregarMock.mockReset();
    sinAlertasUrgentes();
    setRole('admin');
});

const useNTAssistantMock = vi.mocked(useNTAssistant);

function baseHookValue(overrides: Partial<ReturnType<typeof useNTAssistant>> = {}) {
    return {
        messages: [],
        isLoading: false,
        input: '',
        setInput: vi.fn(),
        sendMessage: vi.fn(),
        sendQuick: vi.fn(),
        ...overrides,
    };
}

describe('NTAssistant', () => {
    it('muestra el indicador de "escribiendo" mientras isLoading es true', async () => {
        useNTAssistantMock.mockReturnValue(baseHookValue({
            messages: [{ role: 'user', content: '¿Ventas del mes?' }],
            isLoading: true,
        }));

        render(<NTAssistant />);
        await userEvent.click(screen.getByTitle('NT Assistant'));

        expect(screen.getByRole('status', { name: 'NT Assistant está escribiendo' })).toBeInTheDocument();
    });

    it('no muestra el indicador cuando no está cargando', async () => {
        useNTAssistantMock.mockReturnValue(baseHookValue());

        render(<NTAssistant />);
        await userEvent.click(screen.getByTitle('NT Assistant'));

        expect(screen.queryByRole('status', { name: 'NT Assistant está escribiendo' })).not.toBeInTheDocument();
    });

    it('muestra sugerencias de staff para admin/operario', async () => {
        setRole('operario');
        useNTAssistantMock.mockReturnValue(baseHookValue());

        render(<NTAssistant />);
        await userEvent.click(screen.getByTitle('NT Assistant'));

        expect(screen.getByText('¿Stock crítico?')).toBeInTheDocument();
        expect(screen.getByText('¿Pedidos atrasados?')).toBeInTheDocument();
        expect(screen.queryByText('¿Estado de mi pedido?')).not.toBeInTheDocument();
    });

    it('muestra sugerencias de cliente cuando el rol es cliente', async () => {
        setRole('cliente');
        useNTAssistantMock.mockReturnValue(baseHookValue());

        render(<NTAssistant />);
        await userEvent.click(screen.getByTitle('NT Assistant'));

        expect(screen.getByText('¿Estado de mi pedido?')).toBeInTheDocument();
        expect(screen.getByText('¿Qué productos hay disponibles?')).toBeInTheDocument();
        expect(screen.queryByText('¿Stock crítico?')).not.toBeInTheDocument();
    });

    it('muestra el punto rojo en la burbuja cuando hay stock crítico', async () => {
        getKpisMock.mockResolvedValue({
            data: { totalVentas: 0, totalPedidos: 0, itemsInventario: 0, alertasStock: 3, alertasInsumos: 0 },
        } as never);
        useNTAssistantMock.mockReturnValue(baseHookValue());

        render(<NTAssistant />);

        await waitFor(() => expect(screen.getByLabelText('Hay alertas urgentes sin revisar')).toBeInTheDocument());
    });

    it('no muestra el punto rojo cuando no hay nada urgente', async () => {
        useNTAssistantMock.mockReturnValue(baseHookValue());

        render(<NTAssistant />);
        await waitFor(() => expect(getKpisMock).toHaveBeenCalled());

        expect(screen.queryByLabelText('Hay alertas urgentes sin revisar')).not.toBeInTheDocument();
    });

    it('oculta el punto rojo mientras el panel está abierto', async () => {
        getKpisMock.mockResolvedValue({
            data: { totalVentas: 0, totalPedidos: 0, itemsInventario: 0, alertasStock: 1, alertasInsumos: 0 },
        } as never);
        useNTAssistantMock.mockReturnValue(baseHookValue());

        render(<NTAssistant />);
        await waitFor(() => expect(screen.getByLabelText('Hay alertas urgentes sin revisar')).toBeInTheDocument());

        await userEvent.click(screen.getByTitle('NT Assistant'));

        expect(screen.queryByLabelText('Hay alertas urgentes sin revisar')).not.toBeInTheDocument();
    });
});

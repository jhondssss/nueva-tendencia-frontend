import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardView from './DashboardView';
import { useAuthStore } from '@/stores/auth.store';
import { useDashboardStore, usePedidoStore, useInsumoStore } from '@/stores/index';
import { dashboardApi, pedidoApi, insumoApi } from '@/api/services';
import type { RecentActivity, Insumo } from '@/types';

vi.mock('@/api/services', () => ({
    dashboardApi: {
        getKpis: vi.fn(), getOrdersStatus: vi.fn(), getProductionFunnel: vi.fn(),
        getRecentActivity: vi.fn(), topProductos: vi.fn(), ventasPorMes: vi.fn(),
        prediccionStock: vi.fn(), proximosAEntregar: vi.fn(),
    },
    pedidoApi: { getAll: vi.fn() },
    insumoApi: { getAlertas: vi.fn() },
}));

const INSUMO_ALERTA: Insumo = {
    id_insumo: 1, nombre: 'Cuero negro', descripcion: '',
    categoria: { id_categoria_insumo: 1, nombre: 'cuero', activo: true },
    unidad_medida: { id_unidad_medida: 1, nombre: 'pies', activo: true },
    stock: 2, nivel_minimo: 10, precio_unitario: 5, activo: true, fecha_creacion: '2026-01-01',
};

function setRole(role: 'admin' | 'operario') {
    useAuthStore.setState({
        user: { id: 1, email: `${role}@nuevatendencia.com`, role },
        isAuthenticated: true, isLoading: false, passwordChanged: false,
    });
}

function actividad(overrides: Partial<RecentActivity> = {}): RecentActivity {
    return { id: 1, descripcion: 'Pedido creado', cliente: 'Ana Pérez', estado: 'Pendiente', fecha: new Date().toISOString(), ...overrides };
}

beforeEach(() => {
    vi.clearAllMocks();
    usePedidoStore.setState({ pedidos: [], isLoading: false, error: null });
    useInsumoStore.setState({ insumos: [], alertas: [], categorias: [], unidadesMedida: [], isLoading: false, error: null });
    useDashboardStore.setState({
        kpis: null, ordersStatus: [], productionFunnel: [], recentActivity: [],
        topProductos: [], ventasPorMes: [], prediccionStock: [], proximosAEntregar: [], isLoading: false, error: null,
    });
    vi.mocked(dashboardApi.getKpis).mockResolvedValue({ data: null } as never);
    vi.mocked(dashboardApi.getOrdersStatus).mockResolvedValue({ data: [] } as never);
    vi.mocked(dashboardApi.getProductionFunnel).mockResolvedValue({ data: [] } as never);
    vi.mocked(dashboardApi.getRecentActivity).mockResolvedValue({ data: [] } as never);
    vi.mocked(dashboardApi.topProductos).mockResolvedValue({ data: [] } as never);
    vi.mocked(dashboardApi.ventasPorMes).mockResolvedValue({ data: [] } as never);
    vi.mocked(dashboardApi.prediccionStock).mockResolvedValue({ data: [] } as never);
    vi.mocked(dashboardApi.proximosAEntregar).mockResolvedValue({ data: [] } as never);
    vi.mocked(pedidoApi.getAll).mockResolvedValue({ data: { data: [], total: 0, page: 1, limit: 30, totalPages: 1 } } as never);
    vi.mocked(insumoApi.getAlertas).mockResolvedValue({ data: [] } as never);
});

describe('DashboardView — visibilidad por rol', () => {
    it('el admin ve las métricas globales pero no los widgets de piso de operario', async () => {
        setRole('admin');
        render(<DashboardView />);

        expect(await screen.findByText('Producción por Categoría')).toBeInTheDocument();
        expect(screen.getByText('Actividad Reciente')).toBeInTheDocument();
        expect(screen.queryByText('Producción activa')).not.toBeInTheDocument();
    });

    it('el operario ve el piso de producción y alertas de insumos, no las métricas admin-only', async () => {
        setRole('operario');
        vi.mocked(insumoApi.getAlertas).mockResolvedValue({ data: [INSUMO_ALERTA] } as never);
        render(<DashboardView />);

        expect(await screen.findByText('Producción activa')).toBeInTheDocument();
        expect(screen.getByText('1 insumo bajo nivel mínimo')).toBeInTheDocument();
        expect(screen.queryByText('Producción por Categoría')).not.toBeInTheDocument();
        expect(screen.queryByText('Actividad Reciente')).not.toBeInTheDocument();
    });
});

describe('DashboardView — filtro de actividad reciente', () => {
    it('por defecto ("Todo") muestra actividad de cualquier fecha', async () => {
        setRole('admin');
        vi.mocked(dashboardApi.getRecentActivity).mockResolvedValue({
            data: [
                actividad({ id: 1, descripcion: 'Pedido de hoy', fecha: new Date().toISOString() }),
                actividad({ id: 2, descripcion: 'Hace un año', fecha: new Date(2020, 0, 1).toISOString() }),
            ],
        } as never);
        render(<DashboardView />);

        expect(await screen.findByText('Pedido de hoy')).toBeInTheDocument();
        expect(screen.getByText('Hace un año')).toBeInTheDocument();
    });

    it('el filtro "Hoy" oculta actividad de otros días', async () => {
        setRole('admin');
        vi.mocked(dashboardApi.getRecentActivity).mockResolvedValue({
            data: [
                actividad({ id: 1, descripcion: 'Pedido de hoy', fecha: new Date().toISOString() }),
                actividad({ id: 2, descripcion: 'Hace un año', fecha: new Date(2020, 0, 1).toISOString() }),
            ],
        } as never);
        const user = userEvent.setup();
        render(<DashboardView />);
        await screen.findByText('Pedido de hoy');

        await user.click(screen.getByRole('button', { name: 'Hoy' }));

        expect(screen.getByText('Pedido de hoy')).toBeInTheDocument();
        expect(screen.queryByText('Hace un año')).not.toBeInTheDocument();
    });

    it('distingue "sin actividad" de "sin actividad en el rango seleccionado"', async () => {
        setRole('admin');
        vi.mocked(dashboardApi.getRecentActivity).mockResolvedValue({
            data: [actividad({ id: 1, descripcion: 'Hace un año', fecha: new Date(2020, 0, 1).toISOString() })],
        } as never);
        const user = userEvent.setup();
        render(<DashboardView />);
        await screen.findByText('Hace un año');

        await user.click(screen.getByRole('button', { name: 'Hoy' }));

        expect(screen.getByText('No hay actividad en el rango seleccionado')).toBeInTheDocument();
        expect(screen.queryByText('No hay actividad reciente')).not.toBeInTheDocument();
    });

    it('muestra "No hay actividad reciente" cuando no llegó ninguna actividad del backend', async () => {
        setRole('admin');
        render(<DashboardView />);
        expect(await screen.findByText('No hay actividad reciente')).toBeInTheDocument();
    });
});

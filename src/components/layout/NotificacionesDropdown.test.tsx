import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NotificacionesDropdown from './NotificacionesDropdown';
import { solicitudPedidoApi, dashboardApi } from '@/api/services';

vi.mock('@/api/services', () => ({
    solicitudPedidoApi: { getAll: vi.fn() },
    dashboardApi: { prediccionStock: vi.fn() },
}));

const getAllMock = vi.mocked(solicitudPedidoApi.getAll);
const prediccionStockMock = vi.mocked(dashboardApi.prediccionStock);

function renderDropdown() {
    return render(
        <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
                <Route path="/dashboard" element={<NotificacionesDropdown />} />
                <Route path="/solicitudes" element={<div>Vista de Solicitudes</div>} />
                <Route path="/productos" element={<div>Vista de Productos</div>} />
            </Routes>
        </MemoryRouter>,
    );
}

const solicitudBase = {
    id_solicitud: 1,
    cliente: { id_cliente: 1, nombre: 'Juan', nombre_completo: 'Juan Pérez' },
    producto: { id_producto: 1, nombre_modelo: 'Bota Cuero' },
    cantidad_pares: 3,
    estado: 'Pendiente',
};

const stockItemBase = {
    id: 1, nombre: 'Bota Cuero', stock: 2, nivel_minimo: 10,
    demanda_mensual: 20, semanas_restantes: 1, alerta: true,
};

describe('NotificacionesDropdown', () => {
    beforeEach(() => {
        getAllMock.mockReset();
        prediccionStockMock.mockReset();
    });

    it('no muestra badge cuando no hay notificaciones pendientes', async () => {
        getAllMock.mockResolvedValue({ data: { data: [], total: 0, page: 1, limit: 10, totalPages: 0 } } as never);
        prediccionStockMock.mockResolvedValue({ data: [] } as never);

        renderDropdown();

        expect(await screen.findByRole('button')).toBeInTheDocument();
        expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
    });

    it('muestra el badge con la suma de solicitudes pendientes y stock crítico', async () => {
        getAllMock.mockResolvedValue({
            data: { data: [solicitudBase], total: 1, page: 1, limit: 10, totalPages: 1 },
        } as never);
        prediccionStockMock.mockResolvedValue({
            data: [stockItemBase, { ...stockItemBase, id: 2, nombre: 'Sandalia Verano', semanas_restantes: 10 }],
        } as never);

        const user = userEvent.setup();
        renderDropdown();

        expect(await screen.findByText('2')).toBeInTheDocument();

        await user.click(screen.getByRole('button'));

        expect(await screen.findByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.getByText('Solicitudes pendientes')).toBeInTheDocument();
        expect(screen.getByText('Stock crítico')).toBeInTheDocument();
        expect(screen.getAllByText('Bota Cuero')).toHaveLength(1);
    });

    it('al hacer click en una solicitud navega a /solicitudes', async () => {
        getAllMock.mockResolvedValue({
            data: { data: [solicitudBase], total: 1, page: 1, limit: 10, totalPages: 1 },
        } as never);
        prediccionStockMock.mockResolvedValue({ data: [] } as never);

        const user = userEvent.setup();
        renderDropdown();

        await screen.findByText('1');
        await user.click(screen.getByRole('button'));

        const item = await screen.findByText('Juan Pérez');
        await user.click(item);

        expect(await screen.findByText('Vista de Solicitudes')).toBeInTheDocument();
    });

    it('al hacer click en un ítem de stock crítico navega a /productos', async () => {
        getAllMock.mockResolvedValue({
            data: { data: [], total: 0, page: 1, limit: 10, totalPages: 0 },
        } as never);
        prediccionStockMock.mockResolvedValue({ data: [stockItemBase] } as never);

        const user = userEvent.setup();
        renderDropdown();

        await screen.findByText('1');
        await user.click(screen.getByRole('button'));

        const item = await screen.findByText('Bota Cuero');
        await user.click(item);

        expect(await screen.findByText('Vista de Productos')).toBeInTheDocument();
    });
});

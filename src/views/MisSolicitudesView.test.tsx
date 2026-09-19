import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MisSolicitudesView from './MisSolicitudesView';
import { useMisSolicitudesStore } from '@/stores/index';
import { solicitudPedidoApi } from '@/api/services';
import type { SolicitudPedido } from '@/types';

vi.mock('@/api/services', () => ({
    solicitudPedidoApi: { misSolicitudes: vi.fn(), create: vi.fn(), cancelar: vi.fn() },
}));

vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn(), success: vi.fn() },
}));

function makeSolicitud(overrides: Partial<SolicitudPedido> = {}): SolicitudPedido {
    return {
        id_solicitud: 1,
        cliente: {
            id_cliente: 1, tipo_cliente: { id_tipo_cliente: 1, nombre: 'Persona natural', activo: true },
            nombre: 'Carlos', apellido: 'Rojas', correo_electronico: 'carlos@correo.com',
            telefono_principal: '70000001', fecha_registro: '2026-01-01', activo: true,
        },
        producto: {
            id_producto: 1, nombre_modelo: 'Mocasín clásico', marca: 'NT', tipo_calzado: { id: 1, nombre: 'Mocasín', activo: true },
            genero: { id: 1, nombre: 'Hombre', activo: true }, material_principal: 'Cuero', color: 'Negro',
            precio_venta: '250.00' as unknown as number, costo_unidad: 120, descripcion_corta: 'desc',
            activo: true, stock: 10, unidad_medida: 'unidades', nivel_minimo: 2, categoria: null,
        },
        categoria: 'adulto',
        cantidad_pares: 12,
        tallas: [{ talla: 40, cantidad_pares: 12 }],
        comentario_cliente: null,
        fecha_entrega_deseada: null,
        estado: 'Pendiente',
        motivo_rechazo: null,
        pedido_creado: null,
        fecha_creacion: '2026-01-05T00:00:00.000Z',
        fecha_actualizacion: '2026-01-05T00:00:00.000Z',
        ...overrides,
    };
}

function mockSolicitudes(data: SolicitudPedido[]) {
    vi.mocked(solicitudPedidoApi.misSolicitudes).mockResolvedValue(
        { data: { data, total: data.length, page: 1, limit: 30, totalPages: 1 } } as never,
    );
}

function resetStore() {
    useMisSolicitudesStore.setState({ solicitudes: [], isLoading: false, error: null });
}

beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
});

function renderView() {
    return render(<MemoryRouter><MisSolicitudesView /></MemoryRouter>);
}

describe('MisSolicitudesView — cancelar solicitud', () => {
    it('muestra el botón "Cancelar solicitud" solo para solicitudes Pendiente', async () => {
        mockSolicitudes([
            makeSolicitud({ id_solicitud: 1, estado: 'Pendiente' }),
            makeSolicitud({ id_solicitud: 2, estado: 'Rechazada', motivo_rechazo: 'Sin stock' }),
        ]);
        renderView();

        await screen.findAllByText(/Mocas.n cl.sico/);
        expect(screen.getAllByRole('button', { name: /Cancelar solicitud/i })).toHaveLength(1);
    });

    it('pide confirmación antes de cancelar y llama a la API al confirmar', async () => {
        mockSolicitudes([makeSolicitud()]);
        vi.mocked(solicitudPedidoApi.cancelar).mockResolvedValueOnce({
            data: makeSolicitud({ estado: 'Rechazada', motivo_rechazo: 'Cancelada por el cliente' }),
        } as never);

        const user = userEvent.setup();
        renderView();
        await screen.findByText(/Mocas.n cl.sico/);

        await user.click(screen.getByRole('button', { name: /Cancelar solicitud/i }));
        expect(solicitudPedidoApi.cancelar).not.toHaveBeenCalled();

        // El diálogo de confirmación muestra dos botones con el mismo texto; tomamos el de confirmar (no "Cancelar")
        const dialogConfirm = screen.getAllByRole('button', { name: /Cancelar solicitud/i }).at(-1)!;
        await user.click(dialogConfirm);

        await waitFor(() => expect(solicitudPedidoApi.cancelar).toHaveBeenCalledWith(1));
    });

    it('muestra el mensaje de error específico del backend (409) en vez de uno genérico', async () => {
        mockSolicitudes([makeSolicitud()]);
        vi.mocked(solicitudPedidoApi.cancelar).mockRejectedValueOnce({
            response: { status: 409, data: { message: 'La solicitud ya no está Pendiente.' } },
        });

        const user = userEvent.setup();
        renderView();
        await screen.findByText(/Mocas.n cl.sico/);

        await user.click(screen.getByRole('button', { name: /Cancelar solicitud/i }));
        const dialogConfirm = screen.getAllByRole('button', { name: /Cancelar solicitud/i }).at(-1)!;
        await user.click(dialogConfirm);

        const toast = (await import('react-hot-toast')).default;
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('La solicitud ya no está Pendiente.'));
    });

    it('muestra el mensaje de error específico del backend (403) en vez de uno genérico', async () => {
        mockSolicitudes([makeSolicitud()]);
        vi.mocked(solicitudPedidoApi.cancelar).mockRejectedValueOnce({
            response: { status: 403, data: { message: 'No tienes permiso para cancelar esta solicitud.' } },
        });

        const user = userEvent.setup();
        renderView();
        await screen.findByText(/Mocas.n cl.sico/);

        await user.click(screen.getByRole('button', { name: /Cancelar solicitud/i }));
        const dialogConfirm = screen.getAllByRole('button', { name: /Cancelar solicitud/i }).at(-1)!;
        await user.click(dialogConfirm);

        const toast = (await import('react-hot-toast')).default;
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('No tienes permiso para cancelar esta solicitud.'));
    });
});

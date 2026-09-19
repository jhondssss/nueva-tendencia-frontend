import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SolicitudesView from './SolicitudesView';
import { useSolicitudesAdminStore, useInsumoStore } from '@/stores/index';
import { solicitudPedidoApi, insumoApi } from '@/api/services';
import type { SolicitudPedido } from '@/types';

vi.mock('@/api/services', () => ({
    solicitudPedidoApi: { getAll: vi.fn(), aprobar: vi.fn(), rechazar: vi.fn() },
    insumoApi: { getAll: vi.fn() },
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
        tallas: [
            { talla: 37, cantidad_pares: 2 }, { talla: 38, cantidad_pares: 2 },
            { talla: 39, cantidad_pares: 2 }, { talla: 40, cantidad_pares: 2 },
            { talla: 41, cantidad_pares: 2 }, { talla: 42, cantidad_pares: 2 },
        ],
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

beforeEach(() => {
    vi.clearAllMocks();
    useSolicitudesAdminStore.setState({ solicitudes: [], isLoading: false, error: null });
    useInsumoStore.setState({ insumos: [], alertas: [], categorias: [], unidadesMedida: [], isLoading: false, error: null });
    vi.mocked(insumoApi.getAll).mockResolvedValue({ data: [] } as never);
});

function mockSolicitudes(data: SolicitudPedido[]) {
    vi.mocked(solicitudPedidoApi.getAll).mockResolvedValue({ data: { data, total: data.length, page: 1, limit: 30, totalPages: 1 } } as never);
}

describe('SolicitudesView — listado', () => {
    it('muestra tallas, categoría y acciones para una solicitud pendiente', async () => {
        mockSolicitudes([makeSolicitud()]);
        render(<SolicitudesView />);

        await screen.findByText('Carlos Rojas');
        expect(screen.getByText(/Adulto — 12 pares/)).toBeInTheDocument();
        expect(screen.getByText('T37×2, T38×2, T39×2, T40×2, T41×2, T42×2')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /aprobar/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /rechazar/i })).toBeInTheDocument();
    });

    it('una solicitud Aprobada no muestra acciones y enlaza al pedido generado', async () => {
        mockSolicitudes([makeSolicitud({
            estado: 'Aprobada',
            pedido_creado: { id_pedido: 55 } as never,
        })]);
        render(<SolicitudesView />);

        await screen.findByText('Carlos Rojas');
        expect(screen.getByText('→ Pedido #55')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /aprobar/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /rechazar/i })).not.toBeInTheDocument();
    });
});

describe('SolicitudesView — aprobar (prellenado de precio)', () => {
    it('sugiere el total como precio_venta × cantidad_pares y lo envía al confirmar sin editarlo', async () => {
        mockSolicitudes([makeSolicitud({ cantidad_pares: 12 })]);
        vi.mocked(solicitudPedidoApi.aprobar).mockResolvedValue({
            data: { ...makeSolicitud(), estado: 'Aprobada', pedido_creado: { id_pedido: 90 } },
        } as never);

        const user = userEvent.setup();
        render(<SolicitudesView />);
        await screen.findByText('Carlos Rojas');

        await user.click(screen.getByRole('button', { name: /aprobar/i }));

        expect(await screen.findByText('Aprobar solicitud')).toBeInTheDocument();
        // 250.00 (precio_venta) × 12 pares = 3000
        expect(screen.getByDisplayValue('3000')).toBeInTheDocument();
        expect(screen.getByText(/Calculado con el precio actual del producto \(Bs\. 250\.00 c\/u\)/)).toBeInTheDocument();

        fireEvent.change(document.querySelector('input[type="date"]')!, { target: { value: '2026-12-01' } });
        await user.click(screen.getByRole('button', { name: /aprobar y generar pedido/i }));

        await waitFor(() => expect(solicitudPedidoApi.aprobar).toHaveBeenCalledWith(1, expect.objectContaining({
            total: 3000,
            fecha_entrega: '2026-12-01',
        })));
        expect(await screen.findByText('Se generó el pedido #90')).toBeInTheDocument();
    });

    it('refresca la lista tras aprobar para que la solicitud salga del filtro "Pendiente" sin recargar la página', async () => {
        mockSolicitudes([makeSolicitud({ cantidad_pares: 12 })]);
        vi.mocked(solicitudPedidoApi.aprobar).mockResolvedValue({
            data: { ...makeSolicitud(), estado: 'Aprobada', pedido_creado: { id_pedido: 90 } },
        } as never);

        const user = userEvent.setup();
        render(<SolicitudesView />);
        await screen.findByText('Carlos Rojas');

        // Tras aprobar, el filtro "Pendiente" sigue activo — el backend ya no
        // devolvería esta solicitud en un refetch con ese filtro.
        mockSolicitudes([]);

        await user.click(screen.getByRole('button', { name: /aprobar/i }));
        await screen.findByText('Aprobar solicitud');
        fireEvent.change(document.querySelector('input[type="date"]')!, { target: { value: '2026-12-01' } });
        await user.click(screen.getByRole('button', { name: /aprobar y generar pedido/i }));

        await waitFor(() => expect(solicitudPedidoApi.getAll).toHaveBeenCalledTimes(2));
        await user.click(screen.getByRole('button', { name: 'Cerrar' }));
        await waitFor(() => expect(screen.queryByText('Carlos Rojas')).not.toBeInTheDocument());
    });

    it('permite ajustar el total sugerido antes de confirmar', async () => {
        mockSolicitudes([makeSolicitud({ cantidad_pares: 12 })]);
        vi.mocked(solicitudPedidoApi.aprobar).mockResolvedValue({
            data: { ...makeSolicitud(), estado: 'Aprobada', pedido_creado: { id_pedido: 91 } },
        } as never);

        const user = userEvent.setup();
        render(<SolicitudesView />);
        await screen.findByText('Carlos Rojas');
        await user.click(screen.getByRole('button', { name: /aprobar/i }));
        await screen.findByText('Aprobar solicitud');

        const totalInput = screen.getByDisplayValue('3000');
        await user.clear(totalInput);
        await user.type(totalInput, '2500');
        fireEvent.change(document.querySelector('input[type="date"]')!, { target: { value: '2026-12-01' } });
        await user.click(screen.getByRole('button', { name: /aprobar y generar pedido/i }));

        await waitFor(() => expect(solicitudPedidoApi.aprobar).toHaveBeenCalledWith(1, expect.objectContaining({ total: 2500 })));
    });
});

describe('SolicitudesView — rechazar', () => {
    it('exige un motivo antes de confirmar el rechazo', async () => {
        mockSolicitudes([makeSolicitud()]);
        const user = userEvent.setup();
        render(<SolicitudesView />);
        await screen.findByText('Carlos Rojas');

        await user.click(screen.getByRole('button', { name: /rechazar/i }));
        await screen.findByRole('heading', { name: 'Rechazar solicitud' });
        await user.click(screen.getByRole('button', { name: /rechazar solicitud/i }));

        expect(solicitudPedidoApi.rechazar).not.toHaveBeenCalled();
    });

    it('envía el motivo escrito y cierra el modal', async () => {
        mockSolicitudes([makeSolicitud()]);
        vi.mocked(solicitudPedidoApi.rechazar).mockResolvedValue({
            data: { ...makeSolicitud(), estado: 'Rechazada', motivo_rechazo: 'Sin stock del talle' },
        } as never);

        const user = userEvent.setup();
        render(<SolicitudesView />);
        await screen.findByText('Carlos Rojas');

        await user.click(screen.getByRole('button', { name: /rechazar/i }));
        await screen.findByRole('heading', { name: 'Rechazar solicitud' });
        await user.type(screen.getByPlaceholderText('Explica por qué se rechaza esta solicitud...'), 'Sin stock del talle');
        await user.click(screen.getByRole('button', { name: /rechazar solicitud/i }));

        await waitFor(() => expect(solicitudPedidoApi.rechazar).toHaveBeenCalledWith(1, { motivo_rechazo: 'Sin stock del talle' }));
        await waitFor(() => expect(screen.queryByRole('heading', { name: 'Rechazar solicitud' })).not.toBeInTheDocument());
    });

    it('refresca la lista tras rechazar para que la solicitud salga del filtro "Pendiente" sin recargar la página', async () => {
        mockSolicitudes([makeSolicitud()]);
        vi.mocked(solicitudPedidoApi.rechazar).mockResolvedValue({
            data: { ...makeSolicitud(), estado: 'Rechazada', motivo_rechazo: 'Sin stock del talle' },
        } as never);

        const user = userEvent.setup();
        render(<SolicitudesView />);
        await screen.findByText('Carlos Rojas');

        mockSolicitudes([]);

        await user.click(screen.getByRole('button', { name: /rechazar/i }));
        await screen.findByRole('heading', { name: 'Rechazar solicitud' });
        await user.type(screen.getByPlaceholderText('Explica por qué se rechaza esta solicitud...'), 'Sin stock del talle');
        await user.click(screen.getByRole('button', { name: /rechazar solicitud/i }));

        await waitFor(() => expect(solicitudPedidoApi.getAll).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(screen.queryByText('Carlos Rojas')).not.toBeInTheDocument());
    });
});

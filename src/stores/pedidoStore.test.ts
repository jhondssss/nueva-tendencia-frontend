import { beforeEach, describe, expect, it, vi } from 'vitest';
import toast from 'react-hot-toast';
import { usePedidoStore } from '@/stores/index';
import { pedidoApi } from '@/api/services';
import type { Pedido } from '@/types';

vi.mock('@/api/services', () => ({
    pedidoApi: {
        getAll: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        mover:  vi.fn(),
        remove: vi.fn(),
    },
}));

vi.mock('react-hot-toast', () => ({
    default: { success: vi.fn(), error: vi.fn() },
}));

function makePedido(overrides: Partial<Pedido> = {}): Pedido {
    return {
        id_pedido: 1,
        cliente: {
            id_cliente: 1, tipo_cliente: 'natural', nombre: 'Ana', apellido: 'Pérez',
            correo_electronico: 'ana@correo.com', telefono_principal: '70000000',
            direccion_calle: 'Calle 1', direccion_colonia: 'Centro', ciudad: 'Cochabamba',
            estado_provincia: 'Cochabamba', codigo_postal: '0000', pais: 'Bolivia',
            fecha_registro: '2026-01-01', activo: true,
        },
        producto: {
            id_producto: 1, nombre_modelo: 'Bota clásica', marca: 'NT', tipo_calzado: 'bota',
            genero: 'unisex', material_principal: 'cuero', color: 'negro', precio_venta: 100,
            costo_unidad: 50, descripcion_corta: '', activo: true, stock: 10,
            unidad_medida: 'par', nivel_minimo: 2,
        },
        cantidad: 1, unidad: 'par', cantidad_pares: 1, total: 100,
        fecha_entrega: '2026-12-01', estado: 'Aparado',
        ...overrides,
    };
}

beforeEach(() => {
    usePedidoStore.setState({ pedidos: [], isLoading: false });
    vi.clearAllMocks();
});

describe('usePedidoStore.mover', () => {
    it('transición válida: actualiza el estado del pedido en el store y notifica éxito', async () => {
        const pedido = makePedido({ id_pedido: 5, estado: 'Aparado' });
        usePedidoStore.setState({ pedidos: [pedido] });

        const actualizado: Pedido = { ...pedido, estado: 'Solado' };
        vi.mocked(pedidoApi.mover).mockResolvedValueOnce({ data: actualizado } as never);

        await usePedidoStore.getState().mover(5, 'Solado');

        expect(usePedidoStore.getState().pedidos[0].estado).toBe('Solado');
        expect(toast.success).toHaveBeenCalledWith('Pedido movido a Solado');
    });

    it('transición rechazada por el backend (salto de estado / permiso): NO actualiza el estado visual', async () => {
        const pedido = makePedido({ id_pedido: 7, estado: 'Aparado' });
        usePedidoStore.setState({ pedidos: [pedido] });

        // Simula el 400/403 real que devuelve PedidoEstadoService cuando se intenta
        // saltar un estado o retroceder (o un 403 de RolesGuard).
        vi.mocked(pedidoApi.mover).mockRejectedValueOnce({
            response: { status: 400, data: { message: 'Solo se puede avanzar al siguiente estado.' } },
        });

        await expect(usePedidoStore.getState().mover(7, 'Empaque')).rejects.toBeTruthy();

        // El set() del store está después del await pedidoApi.mover(...): si la promesa
        // rechaza, ese set() nunca corre y el pedido conserva su estado previo.
        expect(usePedidoStore.getState().pedidos[0].estado).toBe('Aparado');
        expect(toast.success).not.toHaveBeenCalled();
    });
});

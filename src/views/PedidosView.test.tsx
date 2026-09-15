import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PedidosView from './PedidosView';
import { useAuthStore } from '@/stores/auth.store';
import { usePedidoStore, useClienteStore, useProductoStore, useInsumoStore } from '@/stores/index';
import { pedidoApi, kardexApi, clienteApi, productoApi, insumoApi } from '@/api/services';
import type { Pedido } from '@/types';

vi.mock('@/api/services', () => ({
    pedidoApi: { getAll: vi.fn(), getOne: vi.fn(), create: vi.fn(), update: vi.fn(), mover: vi.fn(), remove: vi.fn() },
    kardexApi: { tienePedidoMovimientos: vi.fn() },
    clienteApi: { getAll: vi.fn() },
    productoApi: { getAll: vi.fn() },
    insumoApi: { getAll: vi.fn() },
}));

vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn(), success: vi.fn() },
}));

function makePedido(overrides: Partial<Pedido> = {}): Pedido {
    return {
        id_pedido: 1,
        cliente: {
            id_cliente: 1, tipo_cliente: { id_tipo_cliente: 1, nombre: 'Persona natural', activo: true },
            nombre: 'Ana', apellido: 'Pérez', correo_electronico: 'ana@correo.com',
            telefono_principal: '70000000', fecha_registro: '2026-01-01', activo: true,
        },
        producto: {
            id_producto: 1, nombre_modelo: 'Bota clásica', marca: 'NT', tipo_calzado: 'bota',
            genero: 'unisex', material_principal: 'cuero', color: 'negro', precio_venta: 100,
            costo_unidad: 50, descripcion_corta: '', activo: true, stock: 10,
            unidad_medida: 'par', nivel_minimo: 2, categoria: null,
        },
        cantidad: 1, unidad: 'par', cantidad_pares: 1, total: 100,
        fecha_entrega: '2026-12-01', estado: 'Aparado',
        ...overrides,
    };
}

function pedidosResponse(data: Pedido[]) {
    return { data: { data, total: data.length, page: 1, limit: 30, totalPages: 1 } } as never;
}

function setAdmin() {
    useAuthStore.setState({
        user: { id: 1, email: 'admin@nuevatendencia.com', role: 'admin' },
        isAuthenticated: true, isLoading: false, passwordChanged: false,
    });
}

function resetStores() {
    usePedidoStore.setState({ pedidos: [], isLoading: false, error: null });
    useClienteStore.setState({ clientes: [], isLoading: false });
    useProductoStore.setState({ productos: [], categoriasProducto: [], alertas: [], isLoading: false, error: null });
    useInsumoStore.setState({ insumos: [], alertas: [], categorias: [], unidadesMedida: [], isLoading: false, error: null });
}

beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
    setAdmin();
    vi.mocked(clienteApi.getAll).mockResolvedValue({ data: { data: [], total: 0, page: 1, limit: 30, totalPages: 1 } } as never);
    vi.mocked(productoApi.getAll).mockResolvedValue({ data: [] } as never);
    vi.mocked(insumoApi.getAll).mockResolvedValue({ data: [] } as never);
});

function renderView(initialEntries: string[] = ['/pedidos']) {
    return render(
        <MemoryRouter initialEntries={initialEntries}>
            <PedidosView />
        </MemoryRouter>,
    );
}

describe('PedidosView — filtro de búsqueda', () => {
    it('filtra por nombre de cliente o de producto', async () => {
        vi.mocked(pedidoApi.getAll).mockResolvedValue(pedidosResponse([
            makePedido({ id_pedido: 1, cliente: { ...makePedido().cliente, nombre: 'Ana' } }),
            makePedido({ id_pedido: 2, cliente: { ...makePedido().cliente, nombre: 'Beto' } }),
        ]));
        const user = userEvent.setup();
        renderView();

        await screen.findByText('#1');
        expect(screen.getByText('#2')).toBeInTheDocument();

        await user.type(screen.getByPlaceholderText('Buscar cliente, producto o #pedido...'), 'Ana');

        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.queryByText('#2')).not.toBeInTheDocument();
    });

    it('filtra por número de pedido', async () => {
        vi.mocked(pedidoApi.getAll).mockResolvedValue(pedidosResponse([
            makePedido({ id_pedido: 1 }),
            makePedido({ id_pedido: 12 }),
        ]));
        const user = userEvent.setup();
        renderView();

        await screen.findByText('#1');
        await user.type(screen.getByPlaceholderText('Buscar cliente, producto o #pedido...'), '12');

        expect(screen.getByText('#12')).toBeInTheDocument();
        expect(screen.queryByText('#1')).not.toBeInTheDocument();
    });

    it('preselecciona el pedido llegado por deep link (?pedido=) y limpia la URL', async () => {
        vi.mocked(pedidoApi.getAll).mockResolvedValue(pedidosResponse([
            makePedido({ id_pedido: 1 }),
            makePedido({ id_pedido: 7 }),
        ]));
        renderView(['/pedidos?pedido=7']);

        await screen.findByText('#7');
        expect(screen.queryByText('#1')).not.toBeInTheDocument();
        expect(screen.getByPlaceholderText('Buscar cliente, producto o #pedido...')).toHaveValue('7');
    });
});

describe('PedidosView — filtro por estado', () => {
    it('el pill de estado alterna el filtro (click de nuevo lo desactiva)', async () => {
        vi.mocked(pedidoApi.getAll).mockResolvedValue(pedidosResponse([
            makePedido({ id_pedido: 1, estado: 'Pendiente' }),
            makePedido({ id_pedido: 2, estado: 'Terminado' }),
        ]));
        const user = userEvent.setup();
        renderView();
        await screen.findByText('#1');

        const pillPendiente = screen.getByRole('button', { name: /Pendiente/ });
        await user.click(pillPendiente);
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.queryByText('#2')).not.toBeInTheDocument();

        await user.click(pillPendiente);
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('#2')).toBeInTheDocument();
    });

    it('los filtros de fecha por "fecha de entrega" solo aparecen para el estado Terminado', async () => {
        vi.mocked(pedidoApi.getAll).mockResolvedValue(pedidosResponse([makePedido({ estado: 'Terminado' })]));
        const user = userEvent.setup();
        renderView();
        await screen.findByText('#1');

        expect(screen.queryByText('Filtrar por fecha de entrega:')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Terminado/ }));
        expect(screen.getByText('Filtrar por fecha de entrega:')).toBeInTheDocument();
    });
});

describe('PedidosView — filtro por categoría', () => {
    it('filtra por categoría "Niño" comparando contra el valor interno sin tilde', async () => {
        vi.mocked(pedidoApi.getAll).mockResolvedValue(pedidosResponse([
            makePedido({ id_pedido: 1, categoria: 'nino' }),
            makePedido({ id_pedido: 2, categoria: 'adulto' }),
        ]));
        const user = userEvent.setup();
        renderView();
        await screen.findByText('#1');

        const categoriaSelect = screen.getAllByRole('combobox').find(el => within(el).queryByText('Niño'))!;
        await user.selectOptions(categoriaSelect, 'Niño');

        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.queryByText('#2')).not.toBeInTheDocument();
    });
});

describe('PedidosView — abrir "Nuevo pedido" tras editar (remount del modal)', () => {
    it('no arrastra los datos del pedido editado previamente', async () => {
        const pedido = makePedido({ id_pedido: 7, total: 999, estado: 'Pendiente' });
        vi.mocked(pedidoApi.getAll).mockResolvedValue(pedidosResponse([pedido]));
        const user = userEvent.setup();
        renderView();
        await screen.findByText('#7');

        const row = screen.getByText('#7').closest('tr')!;
        const editButton = row.querySelector('button.hover\\:text-primary')!;
        await user.click(editButton);

        expect(await screen.findByText('Editar Pedido')).toBeInTheDocument();
        expect(screen.getByDisplayValue('999')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Cancelar' }));
        await user.click(screen.getByRole('button', { name: /nuevo pedido/i }));

        expect(await screen.findByText('Nuevo Pedido')).toBeInTheDocument();
        // A diferencia de ProductoModal (bug documentado en memoria — reset() sin
        // argumentos no restaura los defaultValues originales una vez que reset(data)
        // los reemplazó), PedidoModal se remonta por completo vía `key`, así que el
        // total del pedido anterior no debe seguir apareciendo en el formulario.
        expect(screen.queryByDisplayValue('999')).not.toBeInTheDocument();
    });
});

describe('PedidosView — eliminar pedido', () => {
    it('muestra la advertencia de kardex si el pedido tiene movimientos de stock asociados', async () => {
        vi.mocked(pedidoApi.getAll).mockResolvedValue(pedidosResponse([makePedido({ id_pedido: 3, estado: 'Pendiente' })]));
        vi.mocked(kardexApi.tienePedidoMovimientos).mockResolvedValue({ data: { tieneMovimientos: true } } as never);
        const user = userEvent.setup();
        renderView();
        await screen.findByText('#3');

        const row = screen.getByText('#3').closest('tr')!;
        const deleteButton = row.querySelector('button.text-destructive\\/60')!;
        await user.click(deleteButton);

        expect(await screen.findByText(/tiene movimientos de stock asociados/)).toBeInTheDocument();
    });

    it('no muestra la advertencia si el pedido no tiene movimientos de kardex', async () => {
        vi.mocked(pedidoApi.getAll).mockResolvedValue(pedidosResponse([makePedido({ id_pedido: 4, estado: 'Pendiente' })]));
        vi.mocked(kardexApi.tienePedidoMovimientos).mockResolvedValue({ data: { tieneMovimientos: false } } as never);
        const user = userEvent.setup();
        renderView();
        await screen.findByText('#4');

        const row = screen.getByText('#4').closest('tr')!;
        const deleteButton = row.querySelector('button.text-destructive\\/60')!;
        await user.click(deleteButton);

        await screen.findByText(/eliminar el pedido #4/);
        expect(screen.queryByText(/tiene movimientos de stock asociados/)).not.toBeInTheDocument();
    });
});

describe('PedidosView — editar pedido Terminado', () => {
    it('completa la calificación vía pedidoApi.getOne, ya que el listado no la incluye', async () => {
        const pedidoListado = makePedido({ id_pedido: 8, estado: 'Terminado' });
        const pedidoConCalificacion: Pedido = {
            ...pedidoListado,
            calificacion: { id_calificacion: 1, puntuacion: 5, comentario: 'Excelente', fecha_creacion: '2026-01-01' },
        };
        vi.mocked(pedidoApi.getAll).mockResolvedValue(pedidosResponse([pedidoListado]));
        vi.mocked(pedidoApi.getOne).mockResolvedValue({ data: pedidoConCalificacion } as never);

        const user = userEvent.setup();
        renderView();
        await screen.findByText('#8');

        const row = screen.getByText('#8').closest('tr')!;
        const editButton = row.querySelector('button.hover\\:text-primary')!;
        await user.click(editButton);

        await waitFor(() => expect(pedidoApi.getOne).toHaveBeenCalledWith(8));
        expect(await screen.findByText('Calificación del cliente')).toBeInTheDocument();
    });
});

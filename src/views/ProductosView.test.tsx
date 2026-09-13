import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProductosView from './ProductosView';
import { useAuthStore } from '@/stores/auth.store';
import { useProductoStore } from '@/stores/index';
import { productoApi, categoriaProductoApi } from '@/api/services';
import type { Producto } from '@/types';

vi.mock('@/api/services', () => ({
    productoApi: { getAll: vi.fn(), getAlertas: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
    categoriaProductoApi: { getAll: vi.fn(), create: vi.fn() },
}));

vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn(), success: vi.fn() },
}));

function makeProducto(overrides: Partial<Producto> = {}): Producto {
    return {
        id_producto: 1, nombre_modelo: 'Bota clásica', marca: 'NT', tipo_calzado: 'bota',
        genero: 'unisex', material_principal: 'cuero', color: 'negro', precio_venta: 100,
        costo_unidad: 50, descripcion_corta: '', activo: true, stock: 10,
        unidad_medida: 'par', nivel_minimo: 2, categoria: null,
        ...overrides,
    };
}

function setRole(role: 'admin' | 'operario') {
    useAuthStore.setState({
        user: { id: 1, email: `${role}@nuevatendencia.com`, role },
        isAuthenticated: true, isLoading: false, passwordChanged: false,
    });
}

function resetStores() {
    useProductoStore.setState({ productos: [], categoriasProducto: [], alertas: [], isLoading: false, error: null });
}

beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
    setRole('admin');
    vi.mocked(productoApi.getAlertas).mockResolvedValue({ data: [] } as never);
    vi.mocked(categoriaProductoApi.getAll).mockResolvedValue({ data: [] } as never);
});

function renderView() {
    return render(<ProductosView />);
}

describe('ProductosView — filtro de búsqueda', () => {
    it('filtra por nombre de modelo o marca', async () => {
        vi.mocked(productoApi.getAll).mockResolvedValue({ data: [
            makeProducto({ id_producto: 1, nombre_modelo: 'Bota clásica', marca: 'NT' }),
            makeProducto({ id_producto: 2, nombre_modelo: 'Mocasín urbano', marca: 'Otra' }),
        ] } as never);
        const user = userEvent.setup();
        renderView();

        await screen.findByText('Bota clásica');
        expect(screen.getByText('Mocasín urbano')).toBeInTheDocument();

        await user.type(screen.getByPlaceholderText('Buscar modelo o marca...'), 'Bota');

        expect(screen.getByText('Bota clásica')).toBeInTheDocument();
        expect(screen.queryByText('Mocasín urbano')).not.toBeInTheDocument();
    });
});

describe('ProductosView — pills de estado activo', () => {
    it('el pill "Inactivos" muestra solo los productos inactivos', async () => {
        vi.mocked(productoApi.getAll).mockResolvedValue({ data: [
            makeProducto({ id_producto: 1, nombre_modelo: 'Bota clásica', activo: true }),
            makeProducto({ id_producto: 2, nombre_modelo: 'Mocasín urbano', activo: false }),
        ] } as never);
        const user = userEvent.setup();
        renderView();
        await screen.findByText('Bota clásica');

        await user.click(screen.getByRole('button', { name: /Inactivos/ }));

        expect(screen.queryByText('Bota clásica')).not.toBeInTheDocument();
        expect(screen.getByText('Mocasín urbano')).toBeInTheDocument();
    });
});

describe('ProductosView — alertas de stock', () => {
    it('no muestra el botón de alertas cuando no hay productos por debajo del mínimo', async () => {
        vi.mocked(productoApi.getAll).mockResolvedValue({ data: [makeProducto()] } as never);
        renderView();
        await screen.findByText('Bota clásica');

        expect(screen.queryByRole('button', { name: /alertas/ })).not.toBeInTheDocument();
    });

    it('el toggle de alertas reemplaza el listado por solo los productos con stock bajo', async () => {
        const normal = makeProducto({ id_producto: 1, nombre_modelo: 'Bota clásica', stock: 10, nivel_minimo: 2 });
        const conAlerta = makeProducto({ id_producto: 2, nombre_modelo: 'Mocasín urbano', stock: 1, nivel_minimo: 2 });
        vi.mocked(productoApi.getAll).mockResolvedValue({ data: [normal, conAlerta] } as never);
        vi.mocked(productoApi.getAlertas).mockResolvedValue({ data: [conAlerta] } as never);
        const user = userEvent.setup();
        renderView();
        await screen.findByText('Bota clásica');

        const alertasButton = screen.getByRole('button', { name: /1 alertas/ });
        await user.click(alertasButton);

        expect(screen.queryByText('Bota clásica')).not.toBeInTheDocument();
        expect(screen.getByText('Mocasín urbano')).toBeInTheDocument();
    });
});

describe('ProductosView — eliminar producto', () => {
    it('confirma la eliminación y llama a productoApi.remove con el id correcto', async () => {
        vi.mocked(productoApi.getAll).mockResolvedValue({ data: [
            makeProducto({ id_producto: 5, nombre_modelo: 'Bota clásica' }),
        ] } as never);
        vi.mocked(productoApi.remove).mockResolvedValue({} as never);
        const user = userEvent.setup();
        renderView();
        await screen.findByText('Bota clásica');

        const row = screen.getByText('Bota clásica').closest('tr')!;
        const deleteButton = row.querySelector('button.text-destructive\\/60')!;
        await user.click(deleteButton);

        expect(await screen.findByText(/eliminar "Bota clásica"/)).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Eliminar' }));

        await waitFor(() => expect(productoApi.remove).toHaveBeenCalledWith(5, { headers: { 'x-silent': 'true' } }));
    });
});

describe('ProductosView — permisos de operario', () => {
    it('operario no ve "Nuevo producto" ni los botones de editar/eliminar', async () => {
        setRole('operario');
        vi.mocked(productoApi.getAll).mockResolvedValue({ data: [
            makeProducto({ id_producto: 1, nombre_modelo: 'Bota clásica' }),
        ] } as never);
        renderView();
        await screen.findByText('Bota clásica');

        expect(screen.queryByRole('button', { name: /nuevo producto/i })).not.toBeInTheDocument();
        const row = screen.getByText('Bota clásica').closest('tr')!;
        expect(row.querySelector('button.hover\\:text-primary')).toBeNull();
        expect(row.querySelector('button.text-destructive\\/60')).toBeNull();
    });
});

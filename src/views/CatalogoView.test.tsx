import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import toast from 'react-hot-toast';
import CatalogoView from './CatalogoView';
import { useCatalogoStore, useMisSolicitudesStore } from '@/stores/index';
import { productoApi, solicitudPedidoApi } from '@/api/services';
import type { ProductoCatalogo } from '@/types';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/api/services', () => ({
    productoApi:        { catalogo: vi.fn() },
    solicitudPedidoApi: { create: vi.fn() },
}));

vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn(), success: vi.fn() },
}));

const PRODUCTOS: ProductoCatalogo[] = [
    {
        id_producto: 1, nombre: 'Bota Clásica', descripcion: 'Cuero negro',
        precio: '250.00', imagen: '', categoria: 'adulto', disponible: true,
    },
    {
        id_producto: 2, nombre: 'Zapatilla Infantil', descripcion: 'Suave',
        precio: '120.00', imagen: '', categoria: 'nino', disponible: false,
    },
];

function resetStores() {
    useCatalogoStore.setState({ productos: [], isLoading: false });
    useMisSolicitudesStore.setState({ solicitudes: [], isLoading: false });
}

beforeEach(() => {
    resetStores();
    vi.clearAllMocks();
    vi.mocked(productoApi.catalogo).mockResolvedValue({
        data: { data: PRODUCTOS, total: PRODUCTOS.length, page: 1, limit: 10, totalPages: 1 },
    } as never);
});

function renderView() {
    return render(<MemoryRouter><CatalogoView /></MemoryRouter>);
}

async function abrirFicha(user: ReturnType<typeof userEvent.setup>, nombre = 'Bota Clásica') {
    await screen.findByText(nombre);
    await user.click(screen.getByRole('button', { name: `Ver detalle de ${nombre}` }));
}

describe('CatalogoView — selector de talla en la ficha', () => {
    it('muestra el selector de talla/cantidad, fecha de entrega y comentario, y el botón "Solicitar este pedido" al abrir la ficha', async () => {
        const user = userEvent.setup();
        renderView();
        await abrirFicha(user);

        expect(screen.getAllByRole('spinbutton').length).toBeGreaterThan(0);
        expect(screen.getByText('Fecha de entrega deseada (opcional)')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Detalles adicionales sobre tu pedido...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Solicitar este pedido/ })).toBeInTheDocument();
    });

    it('deshabilita el botón cuando el producto no tiene stock disponible', async () => {
        const user = userEvent.setup();
        renderView();
        await abrirFicha(user, 'Zapatilla Infantil');

        expect(screen.getByRole('button', { name: /Solicitar este pedido/ })).toBeDisabled();
    });

    it('no navega automáticamente al abrir la ficha de un producto', async () => {
        const user = userEvent.setup();
        renderView();
        await abrirFicha(user);

        expect(mockNavigate).not.toHaveBeenCalled();
    });
});

describe('CatalogoView — validación', () => {
    it('bloquea el envío y muestra error si ninguna talla tiene pares (todas en 0)', async () => {
        const user = userEvent.setup();
        renderView();
        await abrirFicha(user);

        for (const input of screen.getAllByRole('spinbutton')) {
            await user.clear(input);
            await user.type(input, '0');
        }

        await user.click(screen.getByRole('button', { name: /Solicitar este pedido/ }));

        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Indica al menos un par en alguna talla'));
        expect(solicitudPedidoApi.create).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('muestra error de validación cuando el comentario excede 500 caracteres', async () => {
        const user = userEvent.setup();
        renderView();
        await abrirFicha(user);

        const textarea = screen.getByPlaceholderText('Detalles adicionales sobre tu pedido...');
        fireEvent.change(textarea, { target: { value: 'a'.repeat(501) } });
        await user.click(screen.getByRole('button', { name: /Solicitar este pedido/ }));

        expect(await screen.findByText('Máximo 500 caracteres')).toBeInTheDocument();
        expect(solicitudPedidoApi.create).not.toHaveBeenCalled();
    });
});

describe('CatalogoView — envío exitoso', () => {
    it('llama a la misma API con el payload esperado y confirma al usuario', async () => {
        const solicitudCreada = { id_solicitud: 99 };
        vi.mocked(solicitudPedidoApi.create).mockResolvedValueOnce({ data: solicitudCreada } as never);

        const user = userEvent.setup();
        renderView();
        await abrirFicha(user);

        const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
        fireEvent.change(dateInput, { target: { value: '2026-12-01' } });
        fireEvent.change(screen.getByPlaceholderText('Detalles adicionales sobre tu pedido...'), {
            target: { value: 'Entregar en tienda' },
        });

        await user.click(screen.getByRole('button', { name: /Solicitar este pedido/ }));

        await waitFor(() => expect(solicitudPedidoApi.create).toHaveBeenCalledWith({
            producto_id: 1,
            categoria: 'adulto',
            tallas: [
                { talla: 37, cantidad_pares: 2 }, { talla: 38, cantidad_pares: 2 },
                { talla: 39, cantidad_pares: 2 }, { talla: 40, cantidad_pares: 2 },
                { talla: 41, cantidad_pares: 2 }, { talla: 42, cantidad_pares: 2 },
            ],
            comentario_cliente: 'Entregar en tienda',
            fecha_entrega_deseada: '2026-12-01',
        }));

        await waitFor(() => expect(toast.success).toHaveBeenCalledWith(
            'Solicitud enviada — te avisaremos cuando sea revisada',
        ));
        expect(mockNavigate).toHaveBeenCalledWith('/mis-solicitudes');
    });
});

describe('CatalogoView — error del backend', () => {
    it('muestra un error y no navega cuando la API rechaza la solicitud', async () => {
        vi.mocked(solicitudPedidoApi.create).mockRejectedValueOnce(new Error('400 Bad Request'));

        const user = userEvent.setup();
        renderView();
        await abrirFicha(user);

        await user.click(screen.getByRole('button', { name: /Solicitar este pedido/ }));

        await waitFor(() => expect(toast.error).toHaveBeenCalledWith(
            'No se pudo enviar la solicitud. Intenta nuevamente.',
        ));
        expect(toast.success).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});

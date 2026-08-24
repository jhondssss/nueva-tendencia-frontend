import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import toast from 'react-hot-toast';
import MisPedidoDetalleView from './MisPedidoDetalleView';
import { useMisPedidosStore } from '@/stores/index';
import { pedidoApi } from '@/api/services';
import type { Pedido } from '@/types';

vi.mock('@/api/services', () => ({
    pedidoApi: { misPedidoDetalle: vi.fn(), calificar: vi.fn() },
}));

vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn(), success: vi.fn() },
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
        fecha_entrega: '2026-12-01', estado: 'Terminado',
        ...overrides,
    };
}

function resetStore() {
    useMisPedidosStore.setState({ pedidos: [], isLoading: false });
}

beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
});

function renderView(pedido: Pedido) {
    vi.mocked(pedidoApi.misPedidoDetalle).mockResolvedValue({ data: pedido } as never);
    return render(
        <MemoryRouter initialEntries={[`/mis-pedidos/${pedido.id_pedido}`]}>
            <Routes>
                <Route path="/mis-pedidos/:id" element={<MisPedidoDetalleView />} />
            </Routes>
        </MemoryRouter>,
    );
}

async function seleccionarEstrellas(user: ReturnType<typeof userEvent.setup>, n: number) {
    await user.click(await screen.findByRole('button', { name: `${n} estrellas` }));
}

describe('MisPedidoDetalleView — visibilidad del formulario de calificación', () => {
    it('muestra el bloque de calificación cuando el pedido está Terminado', async () => {
        renderView(makePedido({ estado: 'Terminado' }));

        expect(await screen.findByText('Tu calificación')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Enviar calificación' })).toBeInTheDocument();
    });

    it.each(['Pendiente', 'Cortado', 'Aparado', 'Solado', 'Empaque'] as const)(
        'no muestra el bloque de calificación cuando el estado es %s',
        async (estado) => {
            renderView(makePedido({ estado }));

            expect(await screen.findByText(`#${1}`)).toBeInTheDocument();
            expect(screen.queryByText('Tu calificación')).not.toBeInTheDocument();
        },
    );
});

describe('MisPedidoDetalleView — selección de estrellas', () => {
    it('seleccionar 4 de 5 estrellas actualiza visualmente la selección antes de enviar', async () => {
        const user = userEvent.setup();
        renderView(makePedido());
        await screen.findByText('Tu calificación');

        await seleccionarEstrellas(user, 4);

        const estrellas = [1, 2, 3, 4, 5].map(n => screen.getByRole('button', { name: `${n} estrella${n > 1 ? 's' : ''}` }));
        estrellas.slice(0, 4).forEach(btn => {
            expect(btn.querySelector('svg')).toHaveClass('fill-secondary');
        });
        expect(estrellas[4].querySelector('svg')).not.toHaveClass('fill-secondary');

        // Todavía no se envió nada a la API
        expect(pedidoApi.calificar).not.toHaveBeenCalled();
    });
});

describe('MisPedidoDetalleView — validación', () => {
    it('bloquea el envío sin seleccionar estrellas (comentario es opcional)', async () => {
        const user = userEvent.setup();
        renderView(makePedido());
        await screen.findByText('Tu calificación');

        await user.click(screen.getByRole('button', { name: 'Enviar calificación' }));

        expect(toast.error).toHaveBeenCalledWith('Selecciona una calificación de 1 a 5 estrellas.');
        expect(pedidoApi.calificar).not.toHaveBeenCalled();
    });

    it('permite enviar solo con estrellas, sin comentario', async () => {
        vi.mocked(pedidoApi.calificar).mockResolvedValueOnce({
            data: { id_calificacion: 1, puntuacion: 5, comentario: null, fecha_creacion: '2026-08-24T00:00:00.000Z' },
        } as never);

        const user = userEvent.setup();
        renderView(makePedido());
        await screen.findByText('Tu calificación');

        await seleccionarEstrellas(user, 5);
        await user.click(screen.getByRole('button', { name: 'Enviar calificación' }));

        await waitFor(() => expect(pedidoApi.calificar).toHaveBeenCalledWith(1, {
            puntuacion: 5,
            comentario: undefined,
        }));
    });
});

describe('MisPedidoDetalleView — envío exitoso', () => {
    it('llama a la API con el payload esperado (estrellas + comentario) y muestra confirmación', async () => {
        vi.mocked(pedidoApi.calificar).mockResolvedValueOnce({
            data: { id_calificacion: 2, puntuacion: 4, comentario: 'Muy buen producto', fecha_creacion: '2026-08-24T00:00:00.000Z' },
        } as never);

        const user = userEvent.setup();
        renderView(makePedido());
        await screen.findByText('Tu calificación');

        await seleccionarEstrellas(user, 4);
        fireEvent.change(screen.getByPlaceholderText('Cuéntanos tu experiencia (opcional)'), {
            target: { value: 'Muy buen producto' },
        });
        await user.click(screen.getByRole('button', { name: 'Enviar calificación' }));

        await waitFor(() => expect(pedidoApi.calificar).toHaveBeenCalledWith(1, {
            puntuacion: 4,
            comentario: 'Muy buen producto',
        }));
        await waitFor(() => expect(toast.success).toHaveBeenCalledWith('¡Gracias por tu calificación!'));

        // Tras el éxito, el formulario desaparece y se muestra la calificación en modo lectura
        expect(screen.queryByRole('button', { name: 'Enviar calificación' })).not.toBeInTheDocument();
        expect(await screen.findByText('“Muy buen producto”')).toBeInTheDocument();
    });
});

describe('MisPedidoDetalleView — error del backend', () => {
    it('muestra el error y no marca el pedido como calificado si la API rechaza la calificación', async () => {
        vi.mocked(pedidoApi.calificar).mockRejectedValueOnce(new Error('500 Internal Server Error'));

        const user = userEvent.setup();
        renderView(makePedido());
        await screen.findByText('Tu calificación');

        await seleccionarEstrellas(user, 3);
        await user.click(screen.getByRole('button', { name: 'Enviar calificación' }));

        await waitFor(() => expect(toast.error).toHaveBeenCalledWith(
            'No pudimos registrar tu calificación. Intenta nuevamente.',
        ));
        expect(toast.success).not.toHaveBeenCalled();

        // El formulario sigue visible — no se marcó como ya calificado
        expect(screen.getByRole('button', { name: 'Enviar calificación' })).toBeInTheDocument();
    });
});

describe('MisPedidoDetalleView — pedido ya calificado', () => {
    it('no permite volver a calificar: muestra la calificación existente en modo lectura y oculta el formulario', async () => {
        renderView(makePedido({
            calificacion: {
                id_calificacion: 5, puntuacion: 5, comentario: 'Excelente',
                fecha_creacion: '2026-08-20T00:00:00.000Z',
            },
        }));

        await screen.findByText('Tu calificación');

        expect(screen.queryByRole('button', { name: 'Enviar calificación' })).not.toBeInTheDocument();
        expect(screen.getByText('“Excelente”')).toBeInTheDocument();
        // Las estrellas quedan en modo solo lectura (disabled)
        const estrella5 = screen.getByRole('button', { name: '5 estrellas' });
        expect(estrella5).toBeDisabled();
    });
});

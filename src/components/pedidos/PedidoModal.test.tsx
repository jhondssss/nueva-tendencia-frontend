import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import toast from 'react-hot-toast';
import PedidoModal from './PedidoModal';
import type { Cliente, Producto, Insumo, Pedido } from '@/types';

vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn(), success: vi.fn() },
}));

const CLIENTES: Cliente[] = [
    {
        id_cliente: 1, tipo_cliente: { id_tipo_cliente: 1, nombre: 'Persona natural', activo: true },
        nombre: 'Carlos', apellido: 'Rojas', correo_electronico: 'carlos@correo.com',
        telefono_principal: '70000001', fecha_registro: '2026-01-01', activo: true,
    },
];

const PRODUCTOS: Producto[] = [
    {
        id_producto: 1, nombre_modelo: 'Mocasín clásico', marca: 'Nueva Tendencia',
        tipo_calzado: { id: 1, nombre: 'Mocasín', activo: true }, genero: { id: 1, nombre: 'Hombre', activo: true }, material_principal: 'Cuero', color: 'Negro',
        precio_venta: 250, costo_unidad: 120, descripcion_corta: 'desc', activo: true,
        stock: 10, unidad_medida: 'unidades', nivel_minimo: 2, categoria: null,
    },
];

const INSUMOS: Insumo[] = [
    {
        id_insumo: 1, nombre: 'Cuero negro', descripcion: '', categoria: { id_categoria_insumo: 1, nombre: 'cuero', activo: true },
        unidad_medida: { id_unidad_medida: 1, nombre: 'pies', activo: true }, stock: 100, nivel_minimo: 10,
        precio_unitario: 5, activo: true, fecha_creacion: '2026-01-01',
    },
    {
        id_insumo: 2, nombre: 'Clefa', descripcion: '', categoria: { id_categoria_insumo: 2, nombre: 'quimico', activo: true },
        unidad_medida: { id_unidad_medida: 2, nombre: 'litros', activo: true }, stock: 50, nivel_minimo: 5,
        precio_unitario: 30, activo: true, fecha_creacion: '2026-01-01',
    },
];

const PEDIDO_EDITANDO: Pedido = {
    id_pedido: 42,
    cliente: CLIENTES[0],
    producto: PRODUCTOS[0],
    cantidad: 2,
    unidad: 'docena',
    cantidad_pares: 24,
    total: 3000,
    fecha_entrega: '2026-12-15T00:00:00.000Z',
    estado: 'Pendiente',
    categoria: 'adulto',
    talles: [
        { talla: 37, cantidad_pares: 3, categoria: 'adulto' }, { talla: 38, cantidad_pares: 3, categoria: 'adulto' },
        { talla: 39, cantidad_pares: 2, categoria: 'adulto' }, { talla: 40, cantidad_pares: 2, categoria: 'adulto' },
        { talla: 41, cantidad_pares: 1, categoria: 'adulto' }, { talla: 42, cantidad_pares: 1, categoria: 'adulto' },
    ],
    cuero_insumo_id: 1,
};

function renderModal(props: Partial<React.ComponentProps<typeof PedidoModal>> = {}) {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    const utils = render(
        <PedidoModal
            isOpen
            onClose={onClose}
            onSubmit={onSubmit}
            pedido={null}
            clientes={CLIENTES}
            productos={PRODUCTOS}
            insumos={INSUMOS}
            {...props}
        />
    );
    return { ...utils, onSubmit, onClose };
}

async function seleccionarClienteYProducto(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByPlaceholderText('Buscar cliente...'));
    await user.click(await screen.findByRole('button', { name: 'Carlos Rojas' }));
    await user.click(screen.getByPlaceholderText('Buscar producto...'));
    await user.click(await screen.findByRole('button', { name: /Mocasín clásico/ }));
}

// "= <span>N pares</span> en total" reparte el texto entre la etiqueta <p> y un
// <span> anidado; getByText por defecto solo mira los nodos de texto directos de
// cada elemento, así que se compara el textContent completo del <p> explícitamente.
function totalParesTexto(texto: string) {
    return (_: string, element: Element | null) =>
        element !== null && element.tagName === 'P' && element.textContent === texto;
}

function fechaFutura(): string {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
}

beforeEach(() => vi.clearAllMocks());

describe('PedidoModal — nuevo pedido, valores por defecto', () => {
    it('arranca en 1 par y sin categoría de tallas', () => {
        renderModal();
        expect(screen.getByText('Nuevo Pedido')).toBeInTheDocument();
        expect(screen.getByText(totalParesTexto('= 1 pares en total'))).toBeInTheDocument();
        expect(screen.queryByText(/distribución por docena/i)).not.toBeInTheDocument();
    });

    it('cambia la unidad a "docena" automáticamente al elegir una categoría de tallas', async () => {
        const user = userEvent.setup();
        renderModal();

        await user.selectOptions(screen.getByDisplayValue('Sin categoría'), 'adulto');

        expect(screen.getByDisplayValue('Docena (12 pares)')).toBeInTheDocument();
        expect(screen.getByText(/distribución por docena/i)).toBeInTheDocument();
    });
});

describe('PedidoModal — cálculo de tallas por docena', () => {
    it('con la distribución estándar de adulto, 1 docena = 12 pares y es múltiplo de docena', async () => {
        const user = userEvent.setup();
        renderModal();
        await user.selectOptions(screen.getByDisplayValue('Sin categoría'), 'adulto');

        expect(screen.getByText(/Total: 12 pares \(1 docena\)/)).toBeInTheDocument();
    });

    it('multiplica el total de pares por la cantidad de docenas pedidas', async () => {
        const user = userEvent.setup();
        renderModal();
        await user.selectOptions(screen.getByDisplayValue('Sin categoría'), 'adulto');

        const cantidadInput = screen.getByPlaceholderText('1');
        await user.clear(cantidadInput);
        await user.type(cantidadInput, '3');

        expect(screen.getByText(/Total: 36 pares \(3 docenas\)/)).toBeInTheDocument();
        expect(screen.getByText(totalParesTexto('= 36 pares en total'))).toBeInTheDocument();
    });

    it('bloquea el envío si la suma de tallas personalizadas no da 12 pares por docena', async () => {
        const user = userEvent.setup();
        const { onSubmit } = renderModal();
        await seleccionarClienteYProducto(user);
        await user.selectOptions(screen.getByDisplayValue('Sin categoría'), 'adulto');

        // Talla 37 pasa de 2 a 5 pares → total 15, ya no es múltiplo de 12
        const inputTalla37 = screen.getAllByRole('spinbutton')[0];
        await user.clear(inputTalla37);
        await user.type(inputTalla37, '5');

        await user.type(screen.getByPlaceholderText('0.00'), '3000');
        fireEvent.change(document.querySelector('input[type="date"]')!, { target: { value: fechaFutura() } });

        await user.click(screen.getByRole('button', { name: /crear pedido/i }));

        await waitFor(() => expect(toast.error).toHaveBeenCalledWith(
            expect.stringContaining('La suma de tallas debe ser 12 pares por docena'),
        ));
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('marca la distribución como inválida (no en verde) si la suma cruda de tallas es 24 en vez de 12, aunque cantidad=2 haga que el total final sea múltiplo de 12', async () => {
        const user = userEvent.setup();
        renderModal();
        await user.selectOptions(screen.getByDisplayValue('Sin categoría'), 'adulto');

        // Duplicar cada talla (2 -> 4): la suma cruda por docena pasa de 12 a 24
        const tallaInputs = screen.getAllByRole('spinbutton').slice(0, 6);
        for (const input of tallaInputs) {
            await user.clear(input);
            await user.type(input, '4');
        }

        // cantidad = 2 docenas → total final = 24 × 2 = 48, que SÍ es múltiplo de 12.
        // El check debe seguir en rojo porque la distribución de UNA docena está mal.
        const cantidadInput = screen.getByPlaceholderText('1');
        await user.clear(cantidadInput);
        await user.type(cantidadInput, '2');

        expect(screen.getByText(/La distribución debe sumar 12 pares por docena \(actual: 24\)/)).toBeInTheDocument();
        expect(screen.queryByText(/Total: 48 pares \(4 docenas\)/)).not.toBeInTheDocument();
    });

    it('no dispara toast.error repetido si se hace clic varias veces en "Crear pedido" con una distribución inválida', async () => {
        const user = userEvent.setup();
        const { onSubmit } = renderModal();
        await seleccionarClienteYProducto(user);
        await user.selectOptions(screen.getByDisplayValue('Sin categoría'), 'adulto');

        const tallaInputs = screen.getAllByRole('spinbutton').slice(0, 6);
        for (const input of tallaInputs) {
            await user.clear(input);
            await user.type(input, '4');
        }
        const cantidadInput = screen.getByPlaceholderText('1');
        await user.clear(cantidadInput);
        await user.type(cantidadInput, '2');

        await user.type(screen.getByPlaceholderText('0.00'), '3000');
        fireEvent.change(document.querySelector('input[type="date"]')!, { target: { value: fechaFutura() } });

        const submitBtn = screen.getByRole('button', { name: /crear pedido/i });
        fireEvent.click(submitBtn);
        fireEvent.click(submitBtn);
        fireEvent.click(submitBtn);

        await waitFor(() => expect(toast.error).toHaveBeenCalled());
        expect(toast.error).toHaveBeenCalledTimes(1);
        expect(onSubmit).not.toHaveBeenCalled();
    });
});

describe('PedidoModal — validación', () => {
    it('exige cliente, producto, total y fecha antes de enviar', async () => {
        const user = userEvent.setup();
        const { onSubmit } = renderModal();

        await user.click(screen.getByRole('button', { name: /crear pedido/i }));

        expect(await screen.findByText('Selecciona un cliente')).toBeInTheDocument();
        expect(screen.getByText('Selecciona un producto')).toBeInTheDocument();
        expect(screen.getByText('Selecciona una fecha')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('rechaza una fecha de entrega en el pasado', async () => {
        const user = userEvent.setup();
        const { onSubmit } = renderModal();
        await seleccionarClienteYProducto(user);
        await user.type(screen.getByPlaceholderText('0.00'), '500');

        fireEvent.change(document.querySelector('input[type="date"]')!, { target: { value: '2020-01-01' } });

        await user.click(screen.getByRole('button', { name: /crear pedido/i }));

        expect(await screen.findByText('La fecha de entrega no puede ser en el pasado')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });
});

describe('PedidoModal — envío exitoso', () => {
    it('no incluye tallas_personalizadas cuando la distribución es la estándar de la categoría', async () => {
        const user = userEvent.setup();
        const { onSubmit } = renderModal();
        await seleccionarClienteYProducto(user);
        await user.selectOptions(screen.getByDisplayValue('Sin categoría'), 'adulto');
        await user.type(screen.getByPlaceholderText('0.00'), '3000');
        fireEvent.change(document.querySelector('input[type="date"]')!, { target: { value: fechaFutura() } });

        await user.click(screen.getByRole('button', { name: /crear pedido/i }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        const [dto] = onSubmit.mock.calls[0];
        expect(dto.tallas_personalizadas).toBeUndefined();
        expect(dto.categoria).toBe('adulto');
        expect(dto.cliente_id).toBe(1);
        expect(dto.producto_id).toBe(1);
    });

    it('incluye tallas_personalizadas cuando la distribución difiere de la estándar (sumando 12)', async () => {
        const user = userEvent.setup();
        const { onSubmit } = renderModal();
        await seleccionarClienteYProducto(user);
        await user.selectOptions(screen.getByDisplayValue('Sin categoría'), 'adulto');

        // Estándar adulto: 2 pares por talla (37..42). Redistribuir: T37=0, T38=4, resto igual → sigue sumando 12.
        const inputs37 = screen.getAllByRole('spinbutton');
        await user.clear(inputs37[0]);
        await user.type(inputs37[0], '0');
        await user.clear(inputs37[1]);
        await user.type(inputs37[1], '4');

        await user.type(screen.getByPlaceholderText('0.00'), '3000');
        fireEvent.change(document.querySelector('input[type="date"]')!, { target: { value: fechaFutura() } });

        await user.click(screen.getByRole('button', { name: /crear pedido/i }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        const [dto] = onSubmit.mock.calls[0];
        expect(dto.tallas_personalizadas).toEqual([
            { talla: 37, cantidad_pares: 0 }, { talla: 38, cantidad_pares: 4 },
            { talla: 39, cantidad_pares: 2 }, { talla: 40, cantidad_pares: 2 },
            { talla: 41, cantidad_pares: 2 }, { talla: 42, cantidad_pares: 2 },
        ]);
    });

    it('envía cuero_insumo_id como null (no undefined) cuando no se selecciona tipo de cuero', async () => {
        const user = userEvent.setup();
        const { onSubmit } = renderModal();
        await seleccionarClienteYProducto(user);
        await user.type(screen.getByPlaceholderText('0.00'), '500');
        fireEvent.change(document.querySelector('input[type="date"]')!, { target: { value: fechaFutura() } });

        await user.click(screen.getByRole('button', { name: /crear pedido/i }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        const [dto] = onSubmit.mock.calls[0];
        expect(dto.cuero_insumo_id).toBeNull();
    });

    it('el selector de tipo de cuero solo lista insumos de categoría "cuero"', async () => {
        const user = userEvent.setup();
        renderModal();
        await user.click(screen.getByPlaceholderText('Sin especificar'));

        expect(await screen.findByRole('button', { name: 'Cuero negro' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Clefa' })).not.toBeInTheDocument();
    });
});

describe('PedidoModal — editar pedido', () => {
    it('precarga cliente, producto, categoría, unidad y distribución de tallas del pedido', () => {
        renderModal({ pedido: PEDIDO_EDITANDO });

        expect(screen.getByText('Editar Pedido')).toBeInTheDocument();
        expect(screen.getByText('Pedido #42')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Carlos Rojas')).toBeInTheDocument();
        expect(screen.getByDisplayValue(/Mocasín clásico/)).toBeInTheDocument();
        expect(screen.getByDisplayValue('Docena (12 pares)')).toBeInTheDocument();
        expect(screen.getByText(/Total: 24 pares \(2 docenas\)/)).toBeInTheDocument();
    });

    it('muestra la calificación del cliente en modo solo lectura si el pedido ya fue calificado', () => {
        renderModal({
            pedido: {
                ...PEDIDO_EDITANDO,
                calificacion: { id_calificacion: 1, puntuacion: 4, comentario: 'Muy bueno', fecha_creacion: '2026-01-10T00:00:00.000Z' },
            },
        });

        expect(screen.getByText('Calificación del cliente')).toBeInTheDocument();
        expect(screen.getByText(/Muy bueno/)).toBeInTheDocument();
    });
});

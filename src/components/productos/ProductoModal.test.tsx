import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProductoModal from './ProductoModal';
import { useProductoStore } from '@/stores/index';
import { useAuthStore } from '@/stores/auth.store';
import { categoriaProductoApi } from '@/api/services';
import type { Producto } from '@/types';

vi.mock('@/api/services', () => ({
    categoriaProductoApi: { getAll: vi.fn(), create: vi.fn() },
}));

vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn(), success: vi.fn() },
}));

const TIPOS = [
    { id: 1, nombre: 'Botín', activo: true },
    { id: 2, nombre: 'Mocasín', activo: true },
];
const GENEROS = [
    { id: 1, nombre: 'Hombre', activo: true },
    { id: 2, nombre: 'Mujer', activo: true },
];

const CATEGORIAS = [
    { id_categoria_producto: 1, nombre: 'Botas', activo: true },
    { id_categoria_producto: 2, nombre: 'Mocasines', activo: true },
];

// Tal como llega del backend: precio_venta/costo_unidad/stock/nivel_minimo son columnas
// `decimal`/`integer` que el driver de pg puede entregar como string (mismo patrón visto
// en ClientesView/AprobarSolicitudModal). El componente debe coercionarlas al precargar.
const PRODUCTO_EDITANDO = {
    id_producto: 5,
    nombre_modelo: 'Bota de Seguridad Industrial',
    marca: 'Nueva Tendencia',
    tipo_calzado: { id: 1, nombre: 'Botín', activo: true },
    genero: { id: 1, nombre: 'Hombre', activo: true },
    material_principal: 'Cuero genuino',
    color: 'Negro',
    precio_venta: '350.50' as unknown as number,
    costo_unidad: '180.00' as unknown as number,
    descripcion_corta: 'Bota resistente para uso industrial',
    activo: true,
    stock: '12' as unknown as number,
    unidad_medida: 'unidades',
    nivel_minimo: '3' as unknown as number,
    imagen_url: '',
    categoria: { id_categoria_producto: 1, nombre: 'Botas', activo: true },
    cuero_pies: 2.5,
    clefa_aparado_litros: null,
    pasta_solado_litros: null,
    clefa_solado_litros: null,
    pvc_solado_litros: null,
    clefa_empaque_litros: null,
    esponja_empaque_hojas: null,
} as Producto;

// Las etiquetas de esta pantalla son <label> sueltos (sin htmlFor), así que se
// ubica el input por el texto de su label hermano en vez de getByLabelText.
function fieldFor(text: string | RegExp): HTMLInputElement {
    return screen.getByText(text).parentElement!.querySelector('input') as HTMLInputElement;
}

beforeEach(() => {
    vi.clearAllMocks();
    useProductoStore.setState({ categoriasProducto: CATEGORIAS, tiposCalzado: TIPOS, generos: GENEROS, productos: [], alertas: [], isLoading: false, error: null });
    // Crear/editar productos es exclusivo de admin (ver useRole/CLAUDE.md); CreatableSelect
    // usa canCreate para decidir si ofrece "+ Nueva categoría".
    useAuthStore.setState({
        user: { id: 1, email: 'admin@nuevatendencia.com', role: 'admin' },
        isAuthenticated: true,
        isLoading: false,
        passwordChanged: false,
    });
});

async function llenarCamposGenerales(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByPlaceholderText('Mocasín clásico'), 'Zapato Test');
    await user.type(screen.getByPlaceholderText('Nueva Tendencia'), 'NT');
    await user.click(screen.getByPlaceholderText('Selecciona un tipo'));
    await user.click(screen.getByRole('button', { name: 'Mocasín' }));
    await user.click(screen.getByPlaceholderText('Selecciona un género'));
    await user.click(screen.getByRole('button', { name: 'Hombre' }));
    await user.type(screen.getByPlaceholderText('Cuero genuino'), 'Cuero');
    await user.type(screen.getByPlaceholderText('Negro / Café'), 'Negro');
}

describe('ProductoModal — nuevo producto', () => {
    it('arranca con los valores por defecto (activo=true, stock=0, sin categoría)', () => {
        render(<ProductoModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} producto={null} />);

        expect(screen.getByText('Nuevo Producto')).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: /producto activo/i })).toBeChecked();
        expect(fieldFor('Stock actual')).toHaveValue(0);
        expect(screen.getByRole('button', { name: /crear producto/i })).toBeInTheDocument();
    });

    it('bloquea el envío si el precio de venta es 0 o negativo', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(<ProductoModal isOpen onClose={vi.fn()} onSubmit={onSubmit} producto={null} />);

        await llenarCamposGenerales(user);
        await user.type(fieldFor(/precio venta/i), '0');
        await user.type(fieldFor(/costo unidad/i), '50');
        await user.type(screen.getByPlaceholderText('Descripción breve del producto...'), 'Una descripción larga de prueba');

        await user.click(screen.getByRole('button', { name: /crear producto/i }));

        expect(await screen.findByText('Debe ser mayor a 0')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('bloquea el envío si la descripción corta tiene menos de 10 caracteres', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();
        render(<ProductoModal isOpen onClose={vi.fn()} onSubmit={onSubmit} producto={null} />);

        await llenarCamposGenerales(user);
        await user.type(fieldFor(/precio venta/i), '100');
        await user.type(fieldFor(/costo unidad/i), '50');
        const descripcion = screen.getByPlaceholderText('Descripción breve del producto...');
        await user.type(descripcion, 'Corta');

        await user.click(screen.getByRole('button', { name: /crear producto/i }));

        // Nota: a diferencia de los demás campos, este textarea no renderiza el mensaje
        // de error bajo el input — solo aplica la clase `input-error`. Se deja documentado
        // acá en vez de "arreglarlo" de paso, ya que excede el alcance de esta ronda de tests.
        await waitFor(() => expect(descripcion).toHaveClass('input-error'));
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('envía los campos de fórmula de producción vacíos como undefined, no NaN', async () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        const user = userEvent.setup();
        render(<ProductoModal isOpen onClose={vi.fn()} onSubmit={onSubmit} producto={null} />);

        await llenarCamposGenerales(user);
        await user.type(fieldFor(/precio venta/i), '199.90');
        await user.type(fieldFor(/costo unidad/i), '80');
        await user.type(screen.getByPlaceholderText('Descripción breve del producto...'), 'Una descripción larga de prueba');

        await user.click(screen.getByRole('button', { name: /crear producto/i }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        const [dto] = onSubmit.mock.calls[0];
        expect(dto.cuero_pies).toBeUndefined();
        expect(dto.clefa_aparado_litros).toBeUndefined();
        expect(dto.precio_venta).toBe(199.9);
        expect(dto.costo_unidad).toBe(80);
        // El contrato de API espera IDs enteros, no el texto/objeto.
        expect(dto.tipo_calzado_id).toBe(2);
        expect(dto.genero_id).toBe(1);
        expect(dto).not.toHaveProperty('tipo_calzado');
        expect(dto).not.toHaveProperty('genero');
    });

    it('envía los campos de fórmula completados como número', async () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        const user = userEvent.setup();
        render(<ProductoModal isOpen onClose={vi.fn()} onSubmit={onSubmit} producto={null} />);

        await llenarCamposGenerales(user);
        await user.type(fieldFor(/precio venta/i), '199.90');
        await user.type(fieldFor(/costo unidad/i), '80');
        await user.type(screen.getByPlaceholderText('Descripción breve del producto...'), 'Una descripción larga de prueba');

        await user.click(screen.getByRole('tab', { name: /fórmula de producción/i }));
        await user.type(fieldFor('Cuero (pies)'), '3.5');

        await user.click(screen.getByRole('button', { name: /crear producto/i }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        const [dto] = onSubmit.mock.calls[0];
        expect(dto.cuero_pies).toBe(3.5);
    });
});

describe('ProductoModal — editar producto (coerción de tipos del backend)', () => {
    it('precarga precio_venta, costo_unidad, stock y nivel_minimo aunque lleguen como string', () => {
        render(<ProductoModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} producto={PRODUCTO_EDITANDO} />);

        expect(screen.getByText('Editar Producto')).toBeInTheDocument();
        expect(fieldFor(/precio venta/i)).toHaveValue(350.5);
        expect(fieldFor(/costo unidad/i)).toHaveValue(180);
        expect(fieldFor('Stock actual')).toHaveValue(12);
        expect(fieldFor('Nivel mínimo')).toHaveValue(3);
    });

    it('precarga la categoría actual del producto en el selector', () => {
        render(<ProductoModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} producto={PRODUCTO_EDITANDO} />);
        expect(screen.getByPlaceholderText('Selecciona una categoría')).toHaveValue('Botas');
    });

    it('precarga tipo de calzado y género actuales del producto (objetos del backend)', () => {
        render(<ProductoModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} producto={PRODUCTO_EDITANDO} />);
        expect(screen.getByPlaceholderText('Selecciona un tipo')).toHaveValue('Botín');
        expect(screen.getByPlaceholderText('Selecciona un género')).toHaveValue('Hombre');
    });

    it('precarga el campo de fórmula configurado (cuero_pies) y no confunde etapas', async () => {
        const user = userEvent.setup();
        render(<ProductoModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} producto={PRODUCTO_EDITANDO} />);

        await user.click(screen.getByRole('tab', { name: /fórmula de producción/i }));
        expect(fieldFor('Cuero (pies)')).toHaveValue(2.5);
    });

    // Regresión: cuero_pies/etc. son columnas `decimal` en Postgres y llegan como string
    // (no como number, a pesar del tipo declarado). Sin coerción, z.number() rechazaba el
    // valor y handleSubmit nunca llamaba a onSubmit — en silencio, porque el mensaje de
    // error vive en la pestaña "Fórmula de producción", que no está montada si el usuario
    // se queda en "Datos generales" y clickea "Actualizar" directo, como en el bug real.
    it('permite actualizar un producto con fórmula cargada como string (decimal de TypeORM) sin bloquear el submit', async () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        const user = userEvent.setup();
        const producto = { ...PRODUCTO_EDITANDO, cuero_pies: '3.00' as unknown as number };
        render(<ProductoModal isOpen onClose={vi.fn()} onSubmit={onSubmit} producto={producto} />);

        await user.click(screen.getByRole('button', { name: /actualizar/i }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        const [dto] = onSubmit.mock.calls[0];
        expect(dto.cuero_pies).toBe(3);
    });
});

describe('ProductoModal — transición Editar → Nuevo sin desmontar', () => {
    // Regresión: el modal no se desmonta entre "Editar" y "Nuevo producto" (ProductosView
    // reusa la misma instancia). Antes del fix, el useEffect de reset solo cubría
    // `isOpen && producto` (cargar) y `!isOpen` (limpiar al cerrar), pero no `isOpen &&
    // !producto` — el caso real de "cerrar con la X y luego abrir Nuevo producto" — así
    // que el form quedaba con los valores del producto editado previamente.
    it('limpia todos los campos al cerrar en modo Editar y reabrir en modo Nuevo', () => {
        const { rerender } = render(
            <ProductoModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} producto={PRODUCTO_EDITANDO} />,
        );
        expect(screen.getByText('Editar Producto')).toBeInTheDocument();
        expect(fieldFor(/precio venta/i)).toHaveValue(350.5);

        // Cerrar con la X (sin desmontar el componente).
        rerender(<ProductoModal isOpen={false} onClose={vi.fn()} onSubmit={vi.fn()} producto={PRODUCTO_EDITANDO} />);

        // Abrir "Nuevo producto".
        rerender(<ProductoModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} producto={null} />);

        expect(screen.getByText('Nuevo Producto')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Mocasín clásico')).toHaveValue('');
        expect(screen.getByPlaceholderText('Nueva Tendencia')).toHaveValue('');
        expect(screen.getByPlaceholderText('Selecciona un tipo')).toHaveValue('');
        expect(screen.getByPlaceholderText('Selecciona un género')).toHaveValue('');
        expect(screen.getByPlaceholderText('Cuero genuino')).toHaveValue('');
        expect(screen.getByPlaceholderText('Negro / Café')).toHaveValue('');
        expect(screen.getByPlaceholderText('Descripción breve del producto...')).toHaveValue('');
        expect(fieldFor(/precio venta/i)).toHaveValue(null);
        expect(fieldFor(/costo unidad/i)).toHaveValue(null);
        expect(fieldFor('Stock actual')).toHaveValue(0);
        expect(screen.getByPlaceholderText('Selecciona una categoría')).toHaveValue('Sin categoría / oculto del catálogo');
        expect(screen.getByRole('checkbox', { name: /producto activo/i })).toBeChecked();
    });
});

describe('ProductoModal — categoría (CreatableSelect)', () => {
    it('permite crear una categoría nueva desde el modal y la selecciona automáticamente', async () => {
        vi.mocked(categoriaProductoApi.create).mockResolvedValueOnce({
            data: { id_categoria_producto: 9, nombre: 'Sandalias', activo: true },
        } as never);

        const user = userEvent.setup();
        render(<ProductoModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} producto={null} />);

        await user.click(screen.getByPlaceholderText('Selecciona una categoría'));
        await user.type(screen.getByPlaceholderText('Selecciona una categoría'), 'Sandalias');
        await user.click(screen.getByRole('button', { name: /\+ nueva categoría "sandalias"/i }));
        await user.click(screen.getByRole('button', { name: 'Guardar' }));

        await waitFor(() => expect(categoriaProductoApi.create).toHaveBeenCalledWith('Sandalias'));
        expect(await screen.findByPlaceholderText('Selecciona una categoría')).toHaveValue('Sandalias');
    });

    it('permite dejar el producto sin categoría explícitamente', async () => {
        const user = userEvent.setup();
        render(<ProductoModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} producto={PRODUCTO_EDITANDO} />);

        await user.click(screen.getByPlaceholderText('Selecciona una categoría'));
        await user.click(screen.getByRole('button', { name: /sin categoría \/ oculto del catálogo/i }));

        expect(screen.getByPlaceholderText('Selecciona una categoría')).toHaveValue('Sin categoría / oculto del catálogo');
    });
});

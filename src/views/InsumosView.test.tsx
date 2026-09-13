import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InsumosView from './InsumosView';
import { useAuthStore } from '@/stores/auth.store';
import { useInsumoStore } from '@/stores/index';
import { insumoApi, categoriaInsumoApi, unidadMedidaApi } from '@/api/services';
import type { Insumo } from '@/types';

vi.mock('@/api/services', () => ({
    insumoApi: { getAll: vi.fn(), getAlertas: vi.fn(), getOne: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), uploadImagen: vi.fn() },
    categoriaInsumoApi: { getAll: vi.fn(), create: vi.fn() },
    unidadMedidaApi: { getAll: vi.fn(), create: vi.fn() },
}));

vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn(), success: vi.fn() },
}));

const CATEGORIA_QUIMICOS = { id_categoria_insumo: 1, nombre: 'quimicos', activo: true };
const CATEGORIA_TEXTILES = { id_categoria_insumo: 2, nombre: 'textiles', activo: true };
const UNIDAD_LITROS = { id_unidad_medida: 1, nombre: 'litros', activo: true };

function makeInsumo(overrides: Partial<Insumo> = {}): Insumo {
    return {
        id_insumo: 1, nombre: 'Cola de contacto', descripcion: '',
        categoria: CATEGORIA_QUIMICOS, unidad_medida: UNIDAD_LITROS,
        stock: 10, nivel_minimo: 2, precio_unitario: 15, activo: true,
        fecha_creacion: '2026-01-01',
        ...overrides,
    };
}

// Las etiquetas de este formulario son <label> sueltos (sin htmlFor), igual que en
// ProductoModal — se ubica el input por el texto de su label hermano.
function fieldFor(text: string | RegExp): HTMLInputElement {
    return screen.getByText(text).parentElement!.querySelector('input') as HTMLInputElement;
}

function setRole(role: 'admin' | 'operario') {
    useAuthStore.setState({
        user: { id: 1, email: `${role}@nuevatendencia.com`, role },
        isAuthenticated: true, isLoading: false, passwordChanged: false,
    });
}

function resetStores() {
    useInsumoStore.setState({ insumos: [], alertas: [], categorias: [], unidadesMedida: [], isLoading: false, error: null });
}

beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
    setRole('admin');
    vi.mocked(insumoApi.getAlertas).mockResolvedValue({ data: [] } as never);
    vi.mocked(categoriaInsumoApi.getAll).mockResolvedValue({ data: [CATEGORIA_QUIMICOS, CATEGORIA_TEXTILES] } as never);
    vi.mocked(unidadMedidaApi.getAll).mockResolvedValue({ data: [UNIDAD_LITROS] } as never);
});

function renderView() {
    return render(<InsumosView />);
}

describe('InsumosView — filtro de búsqueda', () => {
    it('filtra por nombre de insumo', async () => {
        vi.mocked(insumoApi.getAll).mockResolvedValue({ data: [
            makeInsumo({ id_insumo: 1, nombre: 'Cola de contacto' }),
            makeInsumo({ id_insumo: 2, nombre: 'Hilo encerado' }),
        ] } as never);
        const user = userEvent.setup();
        renderView();

        await screen.findByText('Cola de contacto');
        expect(screen.getByText('Hilo encerado')).toBeInTheDocument();

        await user.type(screen.getByPlaceholderText('Buscar insumo...'), 'Cola');

        expect(screen.getByText('Cola de contacto')).toBeInTheDocument();
        expect(screen.queryByText('Hilo encerado')).not.toBeInTheDocument();
    });
});

describe('InsumosView — filtro por categoría', () => {
    it('filtra por la categoría seleccionada', async () => {
        vi.mocked(insumoApi.getAll).mockResolvedValue({ data: [
            makeInsumo({ id_insumo: 1, nombre: 'Cola de contacto', categoria: CATEGORIA_QUIMICOS }),
            makeInsumo({ id_insumo: 2, nombre: 'Hilo encerado', categoria: CATEGORIA_TEXTILES }),
        ] } as never);
        const user = userEvent.setup();
        renderView();
        await screen.findByText('Cola de contacto');

        await user.selectOptions(screen.getByRole('combobox'), 'Textiles');

        expect(screen.queryByText('Cola de contacto')).not.toBeInTheDocument();
        expect(screen.getByText('Hilo encerado')).toBeInTheDocument();
    });
});

describe('InsumosView — banner de alertas de stock', () => {
    it('no muestra el banner cuando no hay insumos bajo el mínimo', async () => {
        vi.mocked(insumoApi.getAll).mockResolvedValue({ data: [makeInsumo()] } as never);
        renderView();
        await screen.findByText('Cola de contacto');

        expect(screen.queryByText(/bajo nivel mínimo/)).not.toBeInTheDocument();
    });

    it('muestra el banner con el detalle de los insumos en alerta', async () => {
        const enAlerta = makeInsumo({ id_insumo: 2, nombre: 'Hilo encerado', stock: 1, nivel_minimo: 5 });
        vi.mocked(insumoApi.getAll).mockResolvedValue({ data: [makeInsumo(), enAlerta] } as never);
        vi.mocked(insumoApi.getAlertas).mockResolvedValue({ data: [enAlerta] } as never);
        renderView();
        await screen.findByText('Cola de contacto');

        expect(await screen.findByText('1 insumo bajo nivel mínimo')).toBeInTheDocument();
        expect(screen.getByText(/Hilo encerado — 1 \/ 5 litros/)).toBeInTheDocument();
    });
});

describe('InsumosView — crear insumo', () => {
    it('envía el formulario con los datos ingresados y cierra el modal', async () => {
        vi.mocked(insumoApi.getAll).mockResolvedValue({ data: [] } as never);
        vi.mocked(insumoApi.create).mockResolvedValue({ data: makeInsumo({ id_insumo: 9, nombre: 'Pegamento X' }) } as never);
        const user = userEvent.setup();
        renderView();
        await screen.findByText('Sin insumos registrados');

        await user.click(screen.getByRole('button', { name: /nuevo insumo/i }));
        expect(await screen.findByText('Nuevo Insumo')).toBeInTheDocument();

        await user.type(screen.getByPlaceholderText('Ej. Cola de contacto'), 'Pegamento X');

        await user.click(screen.getByPlaceholderText('Selecciona una categoría'));
        await user.click(screen.getAllByText('Quimicos').find(el => el.tagName === 'BUTTON')!);

        await user.click(screen.getByPlaceholderText('Selecciona una unidad'));
        await user.click(screen.getByText('Litros'));

        await user.clear(fieldFor('Stock actual *'));
        await user.type(fieldFor('Stock actual *'), '5');
        await user.clear(fieldFor('Nivel mínimo *'));
        await user.type(fieldFor('Nivel mínimo *'), '1');
        await user.clear(fieldFor('Precio unit. (Bs.) *'));
        await user.type(fieldFor('Precio unit. (Bs.) *'), '20');

        await user.click(screen.getByRole('button', { name: 'Crear insumo' }));

        await waitFor(() => expect(insumoApi.create).toHaveBeenCalledWith(expect.objectContaining({
            nombre: 'Pegamento X', categoria_id: 1, unidad_medida_id: 1,
            stock: 5, nivel_minimo: 1, precio_unitario: 20, activo: true,
        })));
        await waitFor(() => expect(screen.queryByText('Nuevo Insumo')).not.toBeInTheDocument());
    });
});

describe('InsumosView — editar insumo', () => {
    it('precarga el formulario con los datos actuales del insumo (coercionando valores string del backend)', async () => {
        const insumo = makeInsumo({
            id_insumo: 3, nombre: 'Cola de contacto',
            stock: '10' as unknown as number,
            nivel_minimo: '2' as unknown as number,
            precio_unitario: '15.50' as unknown as number,
        });
        vi.mocked(insumoApi.getAll).mockResolvedValue({ data: [insumo] } as never);
        const user = userEvent.setup();
        renderView();
        await screen.findByText('Cola de contacto');

        const row = screen.getByText('Cola de contacto').closest('tr')!;
        const editButton = row.querySelector('button.hover\\:text-primary')!;
        await user.click(editButton);

        expect(await screen.findByText('Editar Insumo')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Cola de contacto')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Quimicos')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Litros')).toBeInTheDocument();
        expect(screen.getByDisplayValue('10')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2')).toBeInTheDocument();
        expect(screen.getByDisplayValue('15.5')).toBeInTheDocument();
    });
});

describe('InsumosView — eliminar insumo', () => {
    it('confirma la eliminación y llama a insumoApi.remove con el id correcto', async () => {
        vi.mocked(insumoApi.getAll).mockResolvedValue({ data: [makeInsumo({ id_insumo: 7 })] } as never);
        vi.mocked(insumoApi.remove).mockResolvedValue({} as never);
        const user = userEvent.setup();
        renderView();
        await screen.findByText('Cola de contacto');

        const row = screen.getByText('Cola de contacto').closest('tr')!;
        const deleteButton = row.querySelector('button.text-destructive\\/60')!;
        await user.click(deleteButton);

        expect(await screen.findByText(/eliminar "Cola de contacto"/)).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Eliminar' }));

        await waitFor(() => expect(insumoApi.remove).toHaveBeenCalledWith(7, { headers: { 'x-silent': 'true' } }));
    });
});

describe('InsumosView — permisos de operario', () => {
    it('operario no ve "Nuevo insumo" ni los botones de editar/eliminar', async () => {
        setRole('operario');
        vi.mocked(insumoApi.getAll).mockResolvedValue({ data: [makeInsumo()] } as never);
        renderView();
        await screen.findByText('Cola de contacto');

        expect(screen.queryByRole('button', { name: /nuevo insumo/i })).not.toBeInTheDocument();
        const row = screen.getByText('Cola de contacto').closest('tr')!;
        expect(row.querySelector('button.hover\\:text-primary')).toBeNull();
        expect(row.querySelector('button.text-destructive\\/60')).toBeNull();
    });
});

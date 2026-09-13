import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import KardexView from './KardexView';
import { useAuthStore } from '@/stores/auth.store';
import { kardexApi, insumoApi } from '@/api/services';
import type { KardexMovimiento, Insumo } from '@/types';

vi.mock('@/api/services', () => ({
    kardexApi: { getAll: vi.fn(), registrar: vi.fn() },
    insumoApi: { getAll: vi.fn() },
}));

vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn(), success: vi.fn() },
}));

function makeInsumo(overrides: Partial<Insumo> = {}): Insumo {
    return {
        id_insumo: 1, nombre: 'Cola de contacto', descripcion: '',
        categoria: { id_categoria_insumo: 1, nombre: 'quimicos', activo: true },
        unidad_medida: { id_unidad_medida: 1, nombre: 'litros', activo: true },
        stock: 10, nivel_minimo: 2, precio_unitario: 15, activo: true,
        fecha_creacion: '2026-01-01',
        ...overrides,
    };
}

function makeMovimiento(overrides: Partial<KardexMovimiento> = {}): KardexMovimiento {
    return {
        id_movimiento: 1, producto: null, insumo: makeInsumo(),
        tipo: 'entrada', cantidad: 5, stock_anterior: 5, stock_nuevo: 10,
        fecha: '2026-05-10',
        ...overrides,
    };
}

function paginated(data: KardexMovimiento[], overrides: Partial<{ total: number; page: number; limit: number; totalPages: number }> = {}) {
    return { data: { data, total: data.length, page: 1, limit: 30, totalPages: 1, ...overrides } } as never;
}

function setRole(role: 'admin' | 'operario') {
    useAuthStore.setState({
        user: { id: 1, email: `${role}@nuevatendencia.com`, role },
        isAuthenticated: true, isLoading: false, passwordChanged: false,
    });
}

beforeEach(() => {
    vi.clearAllMocks();
    setRole('admin');
    vi.mocked(insumoApi.getAll).mockResolvedValue({ data: [makeInsumo()] } as never);
});

function renderView() {
    return render(<KardexView />);
}

describe('KardexView — carga paginada', () => {
    it('trae y combina todas las páginas del historial, no solo la primera', async () => {
        vi.mocked(kardexApi.getAll).mockImplementation((page) => {
            if (page === 1) {
                return Promise.resolve(paginated(
                    [makeMovimiento({ id_movimiento: 1, insumo: makeInsumo({ nombre: 'Cola de contacto' }) })],
                    { total: 2, limit: 1, totalPages: 2 },
                ));
            }
            return Promise.resolve(paginated(
                [makeMovimiento({ id_movimiento: 2, insumo: makeInsumo({ nombre: 'Hilo encerado' }) })],
                { total: 2, limit: 1, totalPages: 2, page: 2 },
            ));
        });
        renderView();

        await screen.findByText('Cola de contacto');
        expect(screen.getByText('Hilo encerado')).toBeInTheDocument();
        expect(screen.getByText('(2 registros)')).toBeInTheDocument();
    });
});

describe('KardexView — filtros del historial', () => {
    it('filtra por nombre', async () => {
        vi.mocked(kardexApi.getAll).mockResolvedValue(paginated([
            makeMovimiento({ id_movimiento: 1, insumo: makeInsumo({ nombre: 'Cola de contacto' }) }),
            makeMovimiento({ id_movimiento: 2, insumo: makeInsumo({ nombre: 'Hilo encerado' }) }),
        ]));
        const user = userEvent.setup();
        renderView();
        await screen.findByText('Cola de contacto');

        await user.type(screen.getByPlaceholderText('Filtrar por nombre...'), 'Hilo');

        expect(screen.queryByText('Cola de contacto')).not.toBeInTheDocument();
        expect(screen.getByText('Hilo encerado')).toBeInTheDocument();
    });

    it('filtra por tipo de movimiento', async () => {
        vi.mocked(kardexApi.getAll).mockResolvedValue(paginated([
            makeMovimiento({ id_movimiento: 1, tipo: 'entrada', insumo: makeInsumo({ nombre: 'Cola de contacto' }) }),
            makeMovimiento({ id_movimiento: 2, tipo: 'salida', insumo: makeInsumo({ nombre: 'Hilo encerado' }) }),
        ]));
        const user = userEvent.setup();
        renderView();
        await screen.findByText('Cola de contacto');

        const tipoSelect = screen.getAllByRole('combobox').find(el => {
            const values = Array.from((el as HTMLSelectElement).options).map(o => o.value);
            return values.includes('ajuste') && values.includes('todos');
        })!;
        await user.selectOptions(tipoSelect, 'Salida');

        expect(screen.queryByText('Cola de contacto')).not.toBeInTheDocument();
        expect(screen.getByText('Hilo encerado')).toBeInTheDocument();
    });

    it('filtra por origen (manual vs automático)', async () => {
        vi.mocked(kardexApi.getAll).mockResolvedValue(paginated([
            makeMovimiento({ id_movimiento: 1, origen: 'manual', insumo: makeInsumo({ nombre: 'Cola de contacto' }) }),
            makeMovimiento({ id_movimiento: 2, origen: 'automatico', insumo: makeInsumo({ nombre: 'Hilo encerado' }) }),
        ]));
        const user = userEvent.setup();
        renderView();
        await screen.findByText('Cola de contacto');

        const select = screen.getAllByRole('combobox').find(
            el => Array.from((el as HTMLSelectElement).options).some(o => o.value === 'automatico'),
        )!;
        await user.selectOptions(select, 'Automático');

        expect(screen.queryByText('Cola de contacto')).not.toBeInTheDocument();
        expect(screen.getByText('Hilo encerado')).toBeInTheDocument();
    });
});

describe('KardexView — registrar movimiento', () => {
    it('envía el movimiento con los datos del formulario y recarga el historial', async () => {
        vi.mocked(kardexApi.getAll).mockResolvedValue(paginated([]));
        vi.mocked(kardexApi.registrar).mockResolvedValue({ data: makeMovimiento() } as never);
        vi.mocked(insumoApi.getAll).mockResolvedValue({ data: [makeInsumo({ id_insumo: 3, nombre: 'Pegamento X' })] } as never);
        const user = userEvent.setup();
        renderView();
        await screen.findByText('Registrar Movimiento');

        await user.click(screen.getByPlaceholderText('Buscar insumo...'));
        await user.click(screen.getByText(/Pegamento X/));

        const tipoSelect = screen.getAllByRole('combobox').find(el => {
            const values = Array.from((el as HTMLSelectElement).options).map(o => o.value);
            return values.includes('ajuste') && !values.includes('todos');
        })!;
        await user.selectOptions(tipoSelect, 'Salida');

        const cantidadInput = screen.getByPlaceholderText('Ej: 10');
        await user.clear(cantidadInput);
        await user.type(cantidadInput, '3');

        await user.type(screen.getByPlaceholderText('Ej: Compra proveedor'), 'Ajuste de prueba');

        await user.click(screen.getByRole('button', { name: /registrar movimiento/i }));

        await waitFor(() => expect(kardexApi.registrar).toHaveBeenCalledWith({
            insumo_id: 3, tipo: 'salida', cantidad: 3, motivo: 'Ajuste de prueba',
        }));
    });
});

describe('KardexView — permisos de operario', () => {
    it('operario no ve la sección de registrar movimiento', async () => {
        setRole('operario');
        vi.mocked(kardexApi.getAll).mockResolvedValue(paginated([makeMovimiento()]));
        renderView();
        await screen.findByText('Cola de contacto');

        expect(screen.queryByText('Registrar Movimiento')).not.toBeInTheDocument();
    });
});

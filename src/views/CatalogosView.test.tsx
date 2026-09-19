import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CatalogosView from './CatalogosView';
import { useAuthStore } from '@/stores/auth.store';

// Cada path recibe su propio set de mocks, para verificar que cada pestaña consume su endpoint.
const { apis } = vi.hoisted(() => ({
    apis: {} as Record<string, { getAll: ReturnType<typeof vi.fn> }>,
}));

vi.mock('@/api/services', () => ({
    crearCatalogoApi: (path: string) => {
        apis[path] = {
            getAll: vi.fn().mockResolvedValue({ data: path === '/tipos-calzado'
                ? [{ id: 7, nombre: 'Mocasín', activo: true }]
                : [] }),
        };
        return { ...apis[path], create: vi.fn(), update: vi.fn(), remove: vi.fn() };
    },
}));

vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn(), success: vi.fn() },
}));

function setRole(role: string) {
    useAuthStore.setState({
        user: { id: 1, email: 'x@nuevatendencia.com', role },
        isAuthenticated: true, isLoading: false, passwordChanged: false,
    });
}

beforeEach(() => vi.clearAllMocks());

describe('CatalogosView', () => {
    it('operario ve "Acceso restringido" y no dispara ningún fetch', () => {
        setRole('operario');
        render(<CatalogosView />);

        expect(screen.getByText('Acceso restringido')).toBeInTheDocument();
        Object.values(apis).forEach(a => expect(a.getAll).not.toHaveBeenCalled());
    });

    it('admin ve una pestaña por cada uno de los 6 catálogos', () => {
        setRole('admin');
        render(<CatalogosView />);

        for (const nombre of [
            'Categorías de insumo', 'Categorías de producto', 'Tipos de cliente',
            'Unidades de medida', 'Tipos de calzado', 'Géneros',
        ]) {
            expect(screen.getByRole('tab', { name: nombre })).toBeInTheDocument();
        }
    });

    it('la pestaña Tipos de calzado lista los registros de /tipos-calzado (id genérico)', async () => {
        setRole('admin');
        const user = userEvent.setup();
        render(<CatalogosView />);

        await user.click(screen.getByRole('tab', { name: 'Tipos de calzado' }));

        expect(await screen.findByText('Mocasín')).toBeInTheDocument();
        expect(apis['/tipos-calzado'].getAll).toHaveBeenCalled();
    });
});

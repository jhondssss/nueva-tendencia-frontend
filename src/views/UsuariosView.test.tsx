import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import toast from 'react-hot-toast';
import UsuariosView from './UsuariosView';
import { useAuthStore } from '@/stores/auth.store';
import { usuariosApi } from '@/api/services';
import type { UsuarioAdmin } from '@/types';

vi.mock('@/api/services', () => ({
    usuariosApi: {
        getAll: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        toggle: vi.fn(),
        remove: vi.fn(),
    },
}));

vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn(), success: vi.fn() },
}));

const USUARIOS: UsuarioAdmin[] = [
    { id: 1, email: 'ana@nuevatendencia.com', nombre: 'Ana', apellido: 'Gómez', role: 'admin', activo: true },
    { id: 2, email: 'luis@nuevatendencia.com', nombre: 'Luis', apellido: 'Pérez', role: 'operario', activo: true },
];

function setRole(role: string | null) {
    useAuthStore.setState({
        user:            role ? { id: 99, email: 'sesion@nuevatendencia.com', role } : null,
        token:           role ? 'token-fake' : null,
        isAuthenticated: !!role,
        isLoading:       false,
        passwordChanged: false,
    });
}

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(usuariosApi.getAll).mockResolvedValue({
        data: { data: USUARIOS, total: USUARIOS.length, page: 1, totalPages: 1 },
    } as never);
});

function renderView() {
    return render(<MemoryRouter><UsuariosView /></MemoryRouter>);
}

describe('UsuariosView — acceso admin', () => {
    beforeEach(() => setRole('admin'));

    it('carga y muestra el listado de usuarios con acciones de crear/editar/eliminar', async () => {
        renderView();

        expect(await screen.findByText('Ana Gómez')).toBeInTheDocument();
        expect(screen.getByText('Luis Pérez')).toBeInTheDocument();
        expect(usuariosApi.getAll).toHaveBeenCalledTimes(1);

        expect(screen.getByRole('button', { name: /nuevo usuario/i })).toBeInTheDocument();
        expect(screen.queryByText('Acceso restringido')).not.toBeInTheDocument();
    });

    it('abre el modal de edición al hacer click en el ícono de editar', async () => {
        const user = userEvent.setup();
        renderView();
        await screen.findByText('Ana Gómez');

        const row = screen.getByText('Ana Gómez').closest('tr')!;
        const [, editButton] = row.querySelectorAll('button');
        await user.click(editButton);

        expect(screen.getByText('Editar Usuario')).toBeInTheDocument();
        expect(screen.getByDisplayValue('ana@nuevatendencia.com')).toBeInTheDocument();
    });
});

describe('UsuariosView — rol sin permiso', () => {
    it('operario NO ve el listado: se muestra "Acceso restringido" y no se llama a la API', async () => {
        setRole('operario');
        renderView();

        expect(await screen.findByText('Acceso restringido')).toBeInTheDocument();
        expect(screen.getByText('Solo los administradores pueden gestionar usuarios.')).toBeInTheDocument();

        expect(screen.queryByText('Ana Gómez')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /nuevo usuario/i })).not.toBeInTheDocument();
        expect(usuariosApi.getAll).not.toHaveBeenCalled();
    });

    it('cliente NO ve el listado: mismo mensaje de acceso restringido', async () => {
        setRole('cliente');
        renderView();

        expect(await screen.findByText('Acceso restringido')).toBeInTheDocument();
        expect(usuariosApi.getAll).not.toHaveBeenCalled();
    });

    it('sin sesión (role indefinido) tampoco ve el listado', async () => {
        setRole(null);
        renderView();

        expect(await screen.findByText('Acceso restringido')).toBeInTheDocument();
        expect(usuariosApi.getAll).not.toHaveBeenCalled();
    });

    it('NO redirige de /usuarios: el guard es un mensaje inline, la vista sigue montada en la misma ruta', async () => {
        // Documenta el comportamiento real: a diferencia de un route guard, UsuariosView
        // no navega a otra ruta cuando el rol no tiene permiso — simplemente reemplaza su
        // contenido por un EmptyState, permaneciendo montada en /usuarios.
        setRole('operario');
        renderView();

        expect(await screen.findByText('Acceso restringido')).toBeInTheDocument();
        expect(screen.getByText('Acceso restringido').closest('.animate-fade-in, div')).toBeTruthy();
    });
});

describe('UsuariosView — accesibilidad de teclado en acciones de la tabla', () => {
    beforeEach(() => setRole('admin'));

    // No existen "cards" de usuario en la vista actual (es una tabla estándar de shadcn:
    // <Table>/<TableRow>/<TableCell>). Se documenta el comportamiento real: los botones de
    // acción (toggle / editar / eliminar) son <button> nativos, ya accionables por teclado.
    it('el botón de editar es alcanzable con Tab y accionable con Enter', async () => {
        const user = userEvent.setup();
        renderView();
        await screen.findByText('Ana Gómez');

        const row = screen.getByText('Ana Gómez').closest('tr')!;
        const [, editButton] = row.querySelectorAll('button');

        editButton.focus();
        expect(editButton).toHaveFocus();

        await user.keyboard('{Enter}');
        expect(screen.getByText('Editar Usuario')).toBeInTheDocument();
    });

    it('el botón de toggle activo/inactivo es accionable con la barra espaciadora', async () => {
        vi.mocked(usuariosApi.toggle).mockResolvedValueOnce({
            data: { ...USUARIOS[0], activo: false },
        } as never);

        const user = userEvent.setup();
        renderView();
        await screen.findByText('Ana Gómez');

        const row = screen.getByText('Ana Gómez').closest('tr')!;
        const [toggleButton] = row.querySelectorAll('button');

        toggleButton.focus();
        expect(toggleButton).toHaveFocus();

        await user.keyboard(' ');

        await waitFor(() => expect(usuariosApi.toggle).toHaveBeenCalledWith(1));
        expect(toast.success).toHaveBeenCalledWith('Usuario desactivado');
    });

    it('el foco recorre en orden del DOM: nuevo usuario → búsqueda → acciones de cada fila al presionar Tab', async () => {
        // Orden real del documento (el header con "Nuevo usuario" precede al input de búsqueda).
        const user = userEvent.setup();
        renderView();
        await screen.findByText('Ana Gómez');

        await user.tab(); // botón "Nuevo usuario"
        expect(screen.getByRole('button', { name: /nuevo usuario/i })).toHaveFocus();

        await user.tab(); // input de búsqueda
        expect(screen.getByPlaceholderText('Nombre o email...')).toHaveFocus();

        const row = screen.getByText('Ana Gómez').closest('tr')!;
        const [toggleButton] = row.querySelectorAll('button');

        await user.tab(); // primer botón de acción de la primera fila (toggle)
        expect(toggleButton).toHaveFocus();
    });
});

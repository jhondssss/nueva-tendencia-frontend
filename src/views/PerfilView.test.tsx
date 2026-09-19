import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PerfilView from './PerfilView';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/api/services';

vi.mock('@/api/services', () => ({
    authApi: { updatePerfil: vi.fn(), cambiarPassword: vi.fn(), me: vi.fn(), login: vi.fn(), logout: vi.fn() },
}));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

function httpError(status: number, message: string) {
    return Object.assign(new Error(message), { isAxiosError: true, response: { status, data: { message } } });
}

const guardarDatos = () =>
    within(screen.getByRole('form', { name: 'Datos personales' })).getByRole('button', { name: 'Guardar' });
const guardarPassword = () =>
    within(screen.getByRole('form', { name: 'Cambiar contraseña' })).getByRole('button', { name: 'Guardar' });

async function llenarPassword(user: ReturnType<typeof userEvent.setup>, confirmar = 'nueva123', actual = 'vieja123') {
    await user.type(screen.getByLabelText(/^Contraseña actual/), actual);
    await user.type(screen.getByLabelText(/^Nueva contraseña/), 'nueva123');
    await user.type(screen.getByLabelText(/^Confirmar nueva contraseña/), confirmar);
}

beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
        user: { id: 1, email: 'ana@correo.com', role: 'operario', nombre: 'Ana', apellido: 'Pérez' },
        isAuthenticated: true, isInitialized: true,
    });
});

describe('PerfilView', () => {
    it('precarga los datos del usuario y Guardar arranca deshabilitado', () => {
        render(<PerfilView />);
        expect(screen.getByLabelText('Nombre')).toHaveValue('Ana');
        expect(screen.getByLabelText('Email')).toHaveValue('ana@correo.com');
        expect(guardarDatos()).toBeDisabled();
    });

    it('al cambiar el email actualiza el usuario del store sin recargar', async () => {
        vi.mocked(authApi.updatePerfil).mockResolvedValue({
            data: { id: 1, email: 'nuevo@correo.com', role: 'operario', nombre: 'Ana', apellido: 'Pérez', access_token: 'jwt' },
        } as never);
        const user = userEvent.setup();
        render(<PerfilView />);

        const email = screen.getByLabelText('Email');
        await user.clear(email);
        await user.type(email, 'nuevo@correo.com');
        await user.click(guardarDatos());

        await waitFor(() => expect(useAuthStore.getState().user?.email).toBe('nuevo@correo.com'));
        expect(useAuthStore.getState().user).not.toHaveProperty('access_token');
        expect(useAuthStore.getState().isAuthenticated).toBe(true);
        expect(screen.getByLabelText('Email')).toHaveValue('nuevo@correo.com');
    });

    it('muestra el mensaje real del backend si el email ya existe (409)', async () => {
        vi.mocked(authApi.updatePerfil).mockRejectedValue(httpError(409, 'Ya existe un usuario con ese email'));
        const user = userEvent.setup();
        render(<PerfilView />);

        const email = screen.getByLabelText('Email');
        await user.clear(email);
        await user.type(email, 'otro@correo.com');
        await user.click(guardarDatos());

        expect(await screen.findByText('Ya existe un usuario con ese email')).toBeInTheDocument();
        expect(useAuthStore.getState().user?.email).toBe('ana@correo.com');
    });

    it('valida que las contraseñas nuevas coincidan sin llamar al backend', async () => {
        const user = userEvent.setup();
        render(<PerfilView />);
        await llenarPassword(user, 'distinta');
        await user.click(guardarPassword());

        expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument();
        expect(authApi.cambiarPassword).not.toHaveBeenCalled();
    });

    it('envía password_actual/password_nuevo y limpia el formulario al éxito', async () => {
        vi.mocked(authApi.cambiarPassword).mockResolvedValue({ data: { message: 'ok' } } as never);
        const user = userEvent.setup();
        render(<PerfilView />);
        await llenarPassword(user);
        await user.click(guardarPassword());

        await waitFor(() => expect(authApi.cambiarPassword).toHaveBeenCalledWith({ password_actual: 'vieja123', password_nuevo: 'nueva123' }));
        await waitFor(() => expect(screen.getByLabelText(/^Contraseña actual/)).toHaveValue(''));
    });

    it('muestra el mensaje real del backend si la contraseña actual es incorrecta (400)', async () => {
        vi.mocked(authApi.cambiarPassword).mockRejectedValue(httpError(400, 'La contraseña actual es incorrecta'));
        const user = userEvent.setup();
        render(<PerfilView />);
        await llenarPassword(user, 'nueva123', 'mala');
        await user.click(guardarPassword());

        expect(await screen.findByRole('alert')).toHaveTextContent('La contraseña actual es incorrecta');
    });
});

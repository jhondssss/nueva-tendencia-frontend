import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import toast from 'react-hot-toast';
import LoginView from './LoginView';
import CambiarPasswordView from './CambiarPasswordView';
import { useAuthStore } from '@/stores/auth.store';
import { decodeToken, isTokenValid } from '@/utils/jwt';
import { authApi } from '@/api/services';

vi.mock('@/api/services', () => ({
    authApi: {
        login: vi.fn(),
        forgotPassword: vi.fn(),
    },
}));

vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn(), success: vi.fn() },
}));

const EMAIL_PLACEHOLDER    = 'admin@nuevatendencia.com';
const PASSWORD_PLACEHOLDER = '••••••••';
const SUBMIT_NAME          = /ingresar al sistema/i;

function makeToken(payload: Record<string, unknown>) {
    const encode = (obj: Record<string, unknown>) => btoa(JSON.stringify(obj));
    return `${encode({ alg: 'none' })}.${encode(payload)}.signature`;
}

function resetAuthStore() {
    localStorage.clear();
    useAuthStore.setState({
        user:            null,
        token:           null,
        isAuthenticated: false,
        isLoading:       false,
        passwordChanged: false,
    });
}

beforeEach(() => {
    resetAuthStore();
    vi.clearAllMocks();
});

/** Reproduce en miniatura las guardas reales de src/router/index.tsx (PublicRoute + RequireCambioPassword)
 *  para verificar el redirect post-login sin arrastrar el lazy-loading de todas las vistas del router. */
function PublicRouteStub() {
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    const token           = useAuthStore(s => s.token);
    if (isAuthenticated && isTokenValid(token)) return <Navigate to="/privado" replace />;
    return <Outlet />;
}

function PrivateAreaStub() {
    const token           = useAuthStore(s => s.token);
    const passwordChanged = useAuthStore(s => s.passwordChanged);
    const payload = decodeToken(token);
    if (payload?.requiereCambioPassword && !passwordChanged) return <CambiarPasswordView />;
    return <div>Área privada: Mis pedidos</div>;
}

function renderLoginFlow() {
    return render(
        <MemoryRouter initialEntries={['/login']}>
            <Routes>
                <Route element={<PublicRouteStub />}>
                    <Route path="/login" element={<LoginView />} />
                </Route>
                <Route path="/privado" element={<PrivateAreaStub />} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('LoginView', () => {
    it('renderiza los campos de email, contraseña y el botón de ingreso', () => {
        render(<MemoryRouter><LoginView /></MemoryRouter>);

        expect(screen.getByPlaceholderText(EMAIL_PLACEHOLDER)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(PASSWORD_PLACEHOLDER)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: SUBMIT_NAME })).toBeInTheDocument();
    });

    it('muestra errores de validación cuando se envía el formulario vacío', async () => {
        const user = userEvent.setup();
        render(<MemoryRouter><LoginView /></MemoryRouter>);

        await user.click(screen.getByRole('button', { name: SUBMIT_NAME }));

        expect(await screen.findByText('Email inválido')).toBeInTheDocument();
        expect(await screen.findByText('La contraseña es requerida')).toBeInTheDocument();
        expect(authApi.login).not.toHaveBeenCalled();
    });

    it('muestra error de validación cuando el email está mal formado', async () => {
        const user = userEvent.setup();
        render(<MemoryRouter><LoginView /></MemoryRouter>);

        await user.type(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), 'no-es-un-email');
        await user.type(screen.getByPlaceholderText(PASSWORD_PLACEHOLDER), 'algunaClave');
        await user.click(screen.getByRole('button', { name: SUBMIT_NAME }));

        expect(await screen.findByText('Email inválido')).toBeInTheDocument();
        expect(authApi.login).not.toHaveBeenCalled();
    });

    it('muestra un toast de error cuando el backend rechaza las credenciales', async () => {
        vi.mocked(authApi.login).mockRejectedValueOnce(new Error('401 Unauthorized'));
        const user = userEvent.setup();
        render(<MemoryRouter><LoginView /></MemoryRouter>);

        await user.type(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), 'cliente@correo.com');
        await user.type(screen.getByPlaceholderText(PASSWORD_PLACEHOLDER), 'claveIncorrecta');
        await user.click(screen.getByRole('button', { name: SUBMIT_NAME }));

        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Credenciales inválidas'));
    });
});

describe('Login → flujo de cambio de contraseña obligatorio', () => {
    it('redirige a CambiarPasswordView cuando el JWT trae requiereCambioPassword', async () => {
        const token = makeToken({
            sub: 1, role: 'cliente', requiereCambioPassword: true,
            exp: Math.floor(Date.now() / 1000) + 3600,
        });
        vi.mocked(authApi.login).mockResolvedValueOnce({
            data: { access_token: token, user: { id: 1, email: 'cliente@correo.com', role: 'cliente' } },
        } as never);

        const user = userEvent.setup();
        renderLoginFlow();

        await user.type(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), 'cliente@correo.com');
        await user.type(screen.getByPlaceholderText(PASSWORD_PLACEHOLDER), 'temporal123');
        await user.click(screen.getByRole('button', { name: SUBMIT_NAME }));

        expect(await screen.findByText('Cambiar contraseña')).toBeInTheDocument();
        expect(screen.queryByText('Área privada: Mis pedidos')).not.toBeInTheDocument();
    });

    it('NO redirige a cambio de contraseña cuando el JWT no lo requiere', async () => {
        const token = makeToken({
            sub: 2, role: 'cliente', requiereCambioPassword: false,
            exp: Math.floor(Date.now() / 1000) + 3600,
        });
        vi.mocked(authApi.login).mockResolvedValueOnce({
            data: { access_token: token, user: { id: 2, email: 'cliente2@correo.com', role: 'cliente' } },
        } as never);

        const user = userEvent.setup();
        renderLoginFlow();

        await user.type(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), 'cliente2@correo.com');
        await user.type(screen.getByPlaceholderText(PASSWORD_PLACEHOLDER), 'clave123');
        await user.click(screen.getByRole('button', { name: SUBMIT_NAME }));

        expect(await screen.findByText('Área privada: Mis pedidos')).toBeInTheDocument();
    });
});

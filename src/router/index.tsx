import { lazy, Suspense, useEffect } from 'react';
import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { decodeToken, isTokenValid } from '@/utils/jwt';
import AppLayout from '@/components/layout/AppLayout';
import ClienteLayout from '@/components/layout/ClienteLayout';
import LeatherSeal from '@/components/shared/LeatherSeal';

const LoginView            = lazy(() => import('@/views/LoginView'));
const DashboardView        = lazy(() => import('@/views/DashboardView'));
const PedidosView          = lazy(() => import('@/views/PedidosView'));
const ProductosView        = lazy(() => import('@/views/ProductosView'));
const ClientesView         = lazy(() => import('@/views/ClientesView'));
const TimelineView         = lazy(() => import('@/views/TimelineView'));
const NotFoundView         = lazy(() => import('@/views/NotFoundView'));
const ReportesView         = lazy(() => import('@/views/ReportesView'));
const KardexView           = lazy(() => import('@/views/KardexView'));
const AuditoriaView        = lazy(() => import('@/views/AuditoriaView'));
const InsumosView          = lazy(() => import('@/views/InsumosView'));
const ReporteDiarioView    = lazy(() => import('@/views/ReporteDiarioView'));
const SeguimientoView      = lazy(() => import('@/views/SeguimientoView'));
const UsuariosView         = lazy(() => import('@/views/UsuariosView'));
const ResetPasswordView    = lazy(() => import('@/views/ResetPasswordView'));
const CambiarPasswordView  = lazy(() => import('@/views/CambiarPasswordView'));
const MisPedidosView       = lazy(() => import('@/views/MisPedidosView'));
const MisPedidoDetalleView = lazy(() => import('@/views/MisPedidoDetalleView'));
const CatalogoView         = lazy(() => import('@/views/CatalogoView'));

function PageLoader() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <LeatherSeal size="md" pulse />
        </div>
    );
}

function Lazy({ children }: { children: ReactNode }) {
    return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function PrivateRoute() {
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    const token           = useAuthStore(s => s.token);
    const clearAuth       = useAuthStore(s => s.clearAuth);

    const tokenValid = isTokenValid(token);

    useEffect(() => {
        if (isAuthenticated && !tokenValid) clearAuth();
    }, [isAuthenticated, tokenValid, clearAuth]);

    if (!isAuthenticated || !tokenValid) return <Navigate to="/login" replace />;
    return <Outlet />;
}

function PublicRoute() {
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    const token           = useAuthStore(s => s.token);
    const role            = useAuthStore(s => s.user?.role);
    const valid = isAuthenticated && isTokenValid(token);
    if (!valid) return <Outlet />;
    return <Navigate to={role === 'cliente' ? '/mis-pedidos' : '/dashboard'} replace />;
}

/** Bloquea toda la app hasta completar /auth/cambiar-password-inicial cuando el JWT trae ese flag. */
function RequireCambioPassword() {
    const token           = useAuthStore(s => s.token);
    const passwordChanged = useAuthStore(s => s.passwordChanged);

    const payload = decodeToken(token);
    if (payload?.requiereCambioPassword && !passwordChanged) {
        return <Lazy><CambiarPasswordView /></Lazy>;
    }
    return <Outlet />;
}

/** Solo cuentas con role 'cliente' — el resto es redirigido al panel administrativo. */
function ClienteRoute() {
    const role = useAuthStore(s => s.user?.role);
    if (role !== 'cliente') return <Navigate to="/dashboard" replace />;
    return <Outlet />;
}

/** Todo lo demás (admin/operario) — las cuentas cliente son redirigidas a su portal. */
function StaffRoute() {
    const role = useAuthStore(s => s.user?.role);
    if (role === 'cliente') return <Navigate to="/mis-pedidos" replace />;
    return <Outlet />;
}

export const router = createBrowserRouter([
    {
        element: <PublicRoute />,
        children: [{ path: '/login', element: <Lazy><LoginView /></Lazy> }],
    },
    {
        path: '/seguimiento/:id',
        element: <Lazy><SeguimientoView /></Lazy>,
    },
    {
        path: '/seguimiento/token/:token',
        element: <Lazy><SeguimientoView /></Lazy>,
    },
    {
        path: '/reset-password',
        element: <Lazy><ResetPasswordView /></Lazy>,
    },
    {
        element: <PrivateRoute />,
        children: [
            {
                element: <RequireCambioPassword />,
                children: [
                    {
                        element: <ClienteRoute />,
                        children: [
                            {
                                element: <ClienteLayout />,
                                children: [
                                    { path: '/mis-pedidos',     element: <Lazy><MisPedidosView /></Lazy> },
                                    { path: '/mis-pedidos/:id', element: <Lazy><MisPedidoDetalleView /></Lazy> },
                                    { path: '/catalogo',        element: <Lazy><CatalogoView /></Lazy> },
                                ],
                            },
                        ],
                    },
                    {
                        element: <StaffRoute />,
                        children: [
                            {
                                element: <AppLayout />,
                                children: [
                                    { index: true,               element: <Navigate to="/dashboard" replace /> },
                                    { path: '/dashboard',        element: <Lazy><DashboardView /></Lazy> },
                                    { path: '/pedidos',          element: <Lazy><PedidosView /></Lazy> },
                                    { path: '/productos',        element: <Lazy><ProductosView /></Lazy> },
                                    { path: '/clientes',         element: <Lazy><ClientesView /></Lazy> },
                                    { path: '/timeline',         element: <Lazy><TimelineView /></Lazy> },
                                    { path: '/reportes',         element: <Lazy><ReportesView /></Lazy> },
                                    { path: '/kardex',           element: <Lazy><KardexView /></Lazy> },
                                    { path: '/auditoria',        element: <Lazy><AuditoriaView /></Lazy> },
                                    { path: '/insumos',          element: <Lazy><InsumosView /></Lazy> },
                                    { path: '/reporte-diario',   element: <Lazy><ReporteDiarioView /></Lazy> },
                                    { path: '/usuarios',         element: <Lazy><UsuariosView /></Lazy> },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    },
    { path: '*', element: <Lazy><NotFoundView /></Lazy> },
]);

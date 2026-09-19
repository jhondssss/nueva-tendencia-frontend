import { lazy, Suspense, useEffect } from 'react';
import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
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
const CatalogosView        = lazy(() => import('@/views/CatalogosView'));
const ResetPasswordView    = lazy(() => import('@/views/ResetPasswordView'));
const CambiarPasswordView  = lazy(() => import('@/views/CambiarPasswordView'));
const MisPedidosView       = lazy(() => import('@/views/MisPedidosView'));
const MisPedidoDetalleView = lazy(() => import('@/views/MisPedidoDetalleView'));
const CatalogoView         = lazy(() => import('@/views/CatalogoView'));
const CalificacionesView   = lazy(() => import('@/views/CalificacionesView'));
const MisSolicitudesView   = lazy(() => import('@/views/MisSolicitudesView'));
const PerfilView           = lazy(() => import('@/views/PerfilView'));
const SolicitudesView      = lazy(() => import('@/views/SolicitudesView'));

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

/** Verifica la sesión (cookie httpOnly) una sola vez al cargar la app, antes de resolver cualquier ruta. */
function RootAuthGate() {
    const isInitialized = useAuthStore(s => s.isInitialized);
    const checkSession  = useAuthStore(s => s.checkSession);

    useEffect(() => { checkSession(); }, [checkSession]);

    if (!isInitialized) return <PageLoader />;
    return <Outlet />;
}

function PrivateRoute() {
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <Outlet />;
}

function PublicRoute() {
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    const role            = useAuthStore(s => s.user?.role);
    if (!isAuthenticated) return <Outlet />;
    return <Navigate to={role === 'cliente' ? '/mis-pedidos' : '/dashboard'} replace />;
}

/** Bloquea toda la app hasta completar /auth/cambiar-password-inicial cuando el perfil de sesión trae ese flag. */
function RequireCambioPassword() {
    const requiereCambioPassword = useAuthStore(s => s.user?.requiereCambioPassword);
    const passwordChanged        = useAuthStore(s => s.passwordChanged);

    if (requiereCambioPassword && !passwordChanged) {
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

/** Layout según rol: el portal cliente y el panel admin comparten rutas de cuenta (/perfil). */
function RoleLayout() {
    const role = useAuthStore(s => s.user?.role);
    return role === 'cliente' ? <ClienteLayout /> : <AppLayout />;
}

export const router = createBrowserRouter([
    {
        // Solo las rutas que dependen de saber si hay sesión esperan a checkSession().
        element: <RootAuthGate />,
        children: [
            {
                element: <PublicRoute />,
                children: [{ path: '/login', element: <Lazy><LoginView /></Lazy> }],
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
                                            { path: '/mis-pedidos',      element: <Lazy><MisPedidosView /></Lazy> },
                                            { path: '/mis-pedidos/:id',  element: <Lazy><MisPedidoDetalleView /></Lazy> },
                                            { path: '/catalogo',         element: <Lazy><CatalogoView /></Lazy> },
                                            { path: '/mis-solicitudes',  element: <Lazy><MisSolicitudesView /></Lazy> },
                                        ],
                                    },
                                ],
                            },
                            {
                                element: <RoleLayout />,
                                children: [
                                    { path: '/perfil', element: <Lazy><PerfilView /></Lazy> },
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
                                            { path: '/calificaciones',   element: <Lazy><CalificacionesView /></Lazy> },
                                            { path: '/solicitudes',      element: <Lazy><SolicitudesView /></Lazy> },
                                            { path: '/kardex',           element: <Lazy><KardexView /></Lazy> },
                                            { path: '/auditoria',        element: <Lazy><AuditoriaView /></Lazy> },
                                            { path: '/insumos',          element: <Lazy><InsumosView /></Lazy> },
                                            { path: '/reporte-diario',   element: <Lazy><ReporteDiarioView /></Lazy> },
                                            { path: '/usuarios',         element: <Lazy><UsuariosView /></Lazy> },
                                            { path: '/catalogos',        element: <Lazy><CatalogosView /></Lazy> },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
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
    { path: '*', element: <Lazy><NotFoundView /></Lazy> },
]);

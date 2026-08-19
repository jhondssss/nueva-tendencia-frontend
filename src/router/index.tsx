import { lazy, Suspense, useEffect } from 'react';
import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import AppLayout from '@/components/layout/AppLayout';
import LeatherSeal from '@/components/shared/LeatherSeal';

const LoginView         = lazy(() => import('@/views/LoginView'));
const DashboardView     = lazy(() => import('@/views/DashboardView'));
const PedidosView       = lazy(() => import('@/views/PedidosView'));
const ProductosView     = lazy(() => import('@/views/ProductosView'));
const ClientesView      = lazy(() => import('@/views/ClientesView'));
const TimelineView      = lazy(() => import('@/views/TimelineView'));
const NotFoundView      = lazy(() => import('@/views/NotFoundView'));
const ReportesView      = lazy(() => import('@/views/ReportesView'));
const KardexView        = lazy(() => import('@/views/KardexView'));
const AuditoriaView     = lazy(() => import('@/views/AuditoriaView'));
const InsumosView       = lazy(() => import('@/views/InsumosView'));
const ReporteDiarioView = lazy(() => import('@/views/ReporteDiarioView'));
const SeguimientoView   = lazy(() => import('@/views/SeguimientoView'));
const UsuariosView      = lazy(() => import('@/views/UsuariosView'));
const ResetPasswordView = lazy(() => import('@/views/ResetPasswordView'));

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

function isTokenValid(token: string | null): boolean {
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return typeof payload.exp === 'number' && payload.exp > Date.now() / 1000;
    } catch {
        return false;
    }
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
    const valid = isAuthenticated && isTokenValid(token);
    return valid ? <Navigate to="/dashboard" replace /> : <Outlet />;
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
    { path: '*', element: <Lazy><NotFoundView /></Lazy> },
]);

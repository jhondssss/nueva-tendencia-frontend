import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import AppLayout      from '@/components/layout/AppLayout';
import LoginView      from '@/views/LoginView';
import DashboardView  from '@/views/DashboardView';
import PedidosView    from '@/views/PedidosView';
import ProductosView  from '@/views/ProductosView';
import ClientesView   from '@/views/ClientesView';
import TimelineView   from '@/views/TimelineView';
import NotFoundView   from '@/views/NotFoundView';
import ReportesView   from '@/views/ReportesView';
import KardexView     from '@/views/KardexView';
import AuditoriaView  from '@/views/AuditoriaView';
import InsumosView        from '@/views/InsumosView';
import ReporteDiarioView from '@/views/ReporteDiarioView';

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
        children: [{ path: '/login', element: <LoginView /> }],
    },
    {
        element: <PrivateRoute />,
        children: [
            {
                element: <AppLayout />,
                children: [
                    { index: true,         element: <Navigate to="/dashboard" replace /> },
                    { path: '/dashboard',  element: <DashboardView /> },
                    { path: '/pedidos',    element: <PedidosView /> },
                    { path: '/productos',  element: <ProductosView /> },
                    { path: '/clientes',   element: <ClientesView /> },
                    { path: '/timeline',   element: <TimelineView /> },
                    { path: '/reportes',   element: <ReportesView /> },
                    { path: '/kardex',     element: <KardexView /> },
                    { path: '/auditoria',  element: <AuditoriaView /> },
                    { path: '/insumos',          element: <InsumosView /> },
                    { path: '/reporte-diario',   element: <ReporteDiarioView /> },
                ],
            },
        ],
    },
    { path: '*', element: <NotFoundView /> },
]);

import { useState, useEffect, useMemo } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Package, Users, GitBranch, BarChart2, ArrowLeftRight, ClipboardList, FlaskConical, CalendarCheck, LogOut, Menu, X, ChevronRight, Bell } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { usePedidoStore } from '@/stores/index';
import { useRole } from '@/hooks/useRole';
import { clsx } from 'clsx';
import NTAssistant from '@/components/NTAssistant/NTAssistant';

const NAV_GROUPS = [
    {
        label: 'GENERAL',
        items: [
            { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',  desc: 'Resumen general',       roles: ['admin', 'operario'] },
        ],
    },
    {
        label: 'PRODUCCIÓN',
        items: [
            { to: '/pedidos',  icon: ShoppingBag,  label: 'Pedidos',  desc: 'Gestión de pedidos',  roles: ['admin', 'operario'] },
            { to: '/timeline', icon: GitBranch,    label: 'Timeline', desc: 'Flujo de producción', roles: ['admin', 'operario'] },
        ],
    },
    {
        label: 'INVENTARIO',
        items: [
            { to: '/productos', icon: Package,        label: 'Productos', desc: 'Control de stock',     roles: ['admin', 'operario'] },
            { to: '/insumos',   icon: FlaskConical,   label: 'Insumos',   desc: 'Materiales',           roles: ['admin'] },
            { to: '/kardex',    icon: ArrowLeftRight, label: 'Kardex',    desc: 'Movimientos de stock', roles: ['admin'] },
        ],
    },
    {
        label: 'CLIENTES',
        items: [
            { to: '/clientes', icon: Users, label: 'Clientes', desc: 'Base de clientes', roles: ['admin'] },
        ],
    },
    {
        label: 'REPORTES',
        items: [
            { to: '/reportes',       icon: BarChart2,     label: 'Reportes',       desc: 'PDF y exportaciones', roles: ['admin'] },
            { to: '/reporte-diario', icon: CalendarCheck, label: 'Reporte Diario', desc: 'Actividad del día',   roles: ['admin'] },
        ],
    },
    {
        label: 'ADMINISTRACIÓN',
        items: [
            { to: '/auditoria', icon: ClipboardList, label: 'Auditoría', desc: 'Log de actividad', roles: ['admin'] },
        ],
    },
];

export default function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
    const { user, logout } = useAuthStore();
    const { isAdmin, isOperario } = useRole();
    const navigate = useNavigate();

    const pedidos      = usePedidoStore(s => s.pedidos);
    const fetchPedidos = usePedidoStore(s => s.fetchAll);

    useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

    const vencidosCount = useMemo(() => {
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        return pedidos.filter(p => {
            const fecha = new Date(p.fecha_entrega); fecha.setHours(0, 0, 0, 0);
            return fecha < hoy && p.estado !== 'Terminado';
        }).length;
    }, [pedidos]);

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <div className="flex h-screen bg-crema overflow-hidden">

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-20 md:hidden"
                     onClick={() => setSidebarOpen(false)} />
            )}

            {/* ── Sidebar ───────────────────────────────────────────────── */}
            <aside className={clsx(
                'flex flex-col bg-cafe-900 border-r border-cafe-800 shadow-sidebar transition-all duration-300',
                'fixed inset-y-0 left-0 z-30 w-64 md:relative md:z-auto md:translate-x-0',
                sidebarOpen ? 'translate-x-0 md:w-64' : '-translate-x-full md:w-16',
            )}>
                {/* Logo */}
                <div className={clsx(
                    'flex items-center gap-3 px-4 py-5 border-b border-cafe-800',
                    !sidebarOpen && 'justify-center px-0',
                )}>
                    <div className="w-8 h-8 rounded bg-cafe-gradient flex items-center justify-center flex-shrink-0 shadow-glow-sm">
                        <span className="font-display font-bold text-white text-sm">NT</span>
                    </div>
                    {sidebarOpen && (
                        <div className="animate-fade-in">
                            <p className="font-display font-semibold text-white text-sm leading-tight">Nueva Tendencia</p>
                            <p className="text-cafe-200 text-2xs">Sistema de Gestión</p>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 p-2 overflow-y-auto scrollbar-hide space-y-1">
                    {NAV_GROUPS.map(({ label, items }) => {
                        const userRole = isAdmin ? 'admin' : isOperario ? 'operario' : '';
                        const visible = items.filter(item => item.roles.includes(userRole));
                        if (visible.length === 0) return null;
                        return (
                            <div key={label}>
                                {sidebarOpen && (
                                    <p className="text-2xs text-cafe-400 uppercase tracking-widest px-3 pt-3 pb-1 select-none">
                                        {label}
                                    </p>
                                )}
                                {!sidebarOpen && <div className="my-1 border-t border-cafe-700/60" />}
                                <div className="space-y-0.5">
                                    {visible.map(({ to, icon: Icon, label: itemLabel, desc }) => (
                                        <NavLink key={to} to={to}
                                                 className={({ isActive }) => clsx(
                                                     'nav-item group relative',
                                                     !sidebarOpen && 'justify-center px-0 py-3',
                                                     isActive && 'nav-item-active',
                                                 )}
                                                 title={!sidebarOpen ? itemLabel : undefined}
                                        >
                                            <Icon size={17} className="flex-shrink-0" />
                                            {sidebarOpen ? (
                                                <div className="animate-fade-in min-w-0">
                                                    <p className="text-sm leading-tight">{itemLabel}</p>
                                                    <p className="text-2xs text-cafe-300">{desc}</p>
                                                </div>
                                            ) : (
                                                <div className="absolute left-full ml-3 px-2 py-1 bg-cafe-800 border border-cafe-700
                                                               rounded text-xs text-white whitespace-nowrap opacity-0 pointer-events-none
                                                               group-hover:opacity-100 transition-opacity z-50">
                                                    {itemLabel}
                                                </div>
                                            )}
                                            {sidebarOpen && (
                                                <ChevronRight size={13} className="ml-auto text-cafe-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* User */}
                <div className={clsx('p-3 border-t border-cafe-800', !sidebarOpen && 'flex justify-center')}>
                    {sidebarOpen ? (
                        <div className="animate-fade-in">
                            <div className="flex items-center gap-2 px-2 py-2 rounded bg-cafe-800 mb-2">
                                <div className="w-7 h-7 rounded bg-dorado-500/20 border border-dorado-500/30
                               flex items-center justify-center flex-shrink-0">
                  <span className="text-dorado-400 text-xs font-medium">
                    {user?.email?.charAt(0).toUpperCase() ?? 'U'}
                  </span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-white truncate">{user?.email}</p>
                                    {user?.role === 'admin' ? (
                                        <span className="inline-block text-2xs px-1.5 py-0.5 rounded
                                               bg-dorado-500/20 text-dorado-400 border border-dorado-500/30 font-medium">
                                            Admin
                                        </span>
                                    ) : (
                                        <span className="inline-block text-2xs px-1.5 py-0.5 rounded
                                               bg-amber-900/30 text-amber-300 border border-amber-700/40 font-medium">
                                            Operario
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button onClick={handleLogout}
                                    className="btn-ghost w-full justify-start text-red-300 hover:bg-red-900/40 hover:text-red-200">
                                <LogOut size={14} /> Cerrar sesión
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleLogout} title="Cerrar sesión"
                                className="p-2 rounded text-red-300 hover:bg-red-900/40 transition-colors">
                            <LogOut size={16} />
                        </button>
                    )}
                </div>
            </aside>

            {/* ── Main ──────────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-surface-border">
                    <button onClick={() => setSidebarOpen(v => !v)}
                            className="p-1.5 rounded text-cafe-500 hover:text-cafe-900 hover:bg-crema-dark transition-colors">
                        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                    <button onClick={() => navigate('/dashboard')}
                            className="relative p-1.5 rounded text-cafe-500 hover:text-cafe-900 hover:bg-crema-dark transition-colors">
                        <Bell size={17} />
                        {vencidosCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 rounded-full
                                             flex items-center justify-center text-white text-2xs font-bold px-0.5">
                                {vencidosCount > 99 ? '99+' : vencidosCount}
                            </span>
                        )}
                    </button>
                </header>
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>

            <NTAssistant />
        </div>
    );
}

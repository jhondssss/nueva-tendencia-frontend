import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Package, ShoppingBag, ClipboardList, Menu, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/stores/auth.store';
import { useMisPedidosStore } from '@/stores/index';
import { Button } from '@/components/ui/button';
import LeatherSeal from '@/components/shared/LeatherSeal';

const NAV_LINKS = [
    { to: '/mis-pedidos',      label: 'Mis pedidos',     icon: Package },
    { to: '/catalogo',         label: 'Catálogo',        icon: ShoppingBag },
    { to: '/mis-solicitudes',  label: 'Mis solicitudes', icon: ClipboardList },
];

export default function ClienteLayout() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const pedidos   = useMisPedidosStore(s => s.pedidos);
    const fetchAll  = useMisPedidosStore(s => s.fetchAll);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const cliente     = pedidos[0]?.cliente;
    const nombreCliente = cliente
        ? [cliente.nombre, cliente.apellido].filter(Boolean).join(' ')
        : user?.email;

    const handleLogout = async () => { await logout(); navigate('/login'); };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="relative bg-cafe-gradient shadow-md overflow-hidden">
                <div className="absolute inset-0 bg-texture-stitch text-dorado-100 opacity-[0.04] pointer-events-none" />
                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <LeatherSeal size="sm" />
                        <div className="min-w-0">
                            <p className="text-sidebar-foreground font-display font-semibold text-sm leading-tight tracking-wide truncate">
                                {nombreCliente || 'Mi cuenta'}
                            </p>
                            <p className="text-sidebar-foreground/60 text-xs">Portal de cliente</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDrawerOpen(true)}
                            aria-label="Abrir menú"
                            className="sm:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                        >
                            <Menu size={18} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                        >
                            <LogOut size={17} />
                        </Button>
                    </div>
                </div>

                <nav className="relative max-w-6xl mx-auto px-4 sm:px-6 hidden sm:flex items-center gap-1 border-t border-sidebar-foreground/10">
                    {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => clsx(
                                'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors',
                                isActive
                                    ? 'text-dorado-300 border-dorado-400'
                                    : 'text-sidebar-foreground/60 border-transparent hover:text-sidebar-foreground',
                            )}
                        >
                            <Icon size={14} />
                            {label}
                        </NavLink>
                    ))}
                </nav>
            </header>

            {/* ── Drawer de navegación (mobile) ────────────────────────────── */}
            {drawerOpen && (
                <div className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm sm:hidden"
                     onClick={() => setDrawerOpen(false)} />
            )}
            <aside className={clsx(
                'fixed inset-y-0 right-0 z-50 w-64 bg-sidebar border-l border-sidebar-border shadow-xl',
                'flex flex-col transition-transform duration-300 sm:hidden',
                drawerOpen ? 'translate-x-0' : 'translate-x-full',
            )}>
                <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border/60">
                    <p className="font-display font-semibold text-sidebar-foreground text-sm">Menú</p>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDrawerOpen(false)}
                        aria-label="Cerrar menú"
                        className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    >
                        <X size={18} />
                    </Button>
                </div>
                <nav className="flex-1 p-2 space-y-0.5">
                    {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            onClick={() => setDrawerOpen(false)}
                            className={({ isActive }) => clsx(
                                'flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-sidebar-accent text-dorado-300'
                                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                            )}
                        >
                            <Icon size={16} />
                            {label}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
                <Outlet />
            </main>
        </div>
    );
}

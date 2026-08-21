import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Package, ShoppingBag } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/stores/auth.store';
import { useMisPedidosStore } from '@/stores/index';
import { Button } from '@/components/ui/button';
import LeatherSeal from '@/components/shared/LeatherSeal';

const NAV_LINKS = [
    { to: '/mis-pedidos', label: 'Mis pedidos', icon: Package },
    { to: '/catalogo',    label: 'Catálogo',    icon: ShoppingBag },
];

export default function ClienteLayout() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const pedidos   = useMisPedidosStore(s => s.pedidos);
    const fetchAll  = useMisPedidosStore(s => s.fetchAll);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const cliente     = pedidos[0]?.cliente;
    const nombreCliente = cliente
        ? [cliente.nombre, cliente.apellido].filter(Boolean).join(' ')
        : user?.email;

    const handleLogout = () => { logout(); navigate('/login'); };

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
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent shrink-0"
                    >
                        <LogOut size={17} />
                    </Button>
                </div>

                <nav className="relative max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 border-t border-sidebar-foreground/10">
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

            <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
                <Outlet />
            </main>
        </div>
    );
}

import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useMisPedidosStore } from '@/stores/index';
import { Button } from '@/components/ui/button';
import LeatherSeal from '@/components/shared/LeatherSeal';

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
                <div className="relative max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
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
            </header>

            <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
                <Outlet />
            </main>
        </div>
    );
}

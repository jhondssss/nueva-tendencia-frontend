import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Package, Users, UserCog, GitBranch, BarChart2, ArrowLeftRight, ClipboardList, ClipboardCheck, FlaskConical, CalendarCheck, LogOut, Menu, X, Star, Search } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useCommandPaletteStore } from '@/stores/commandPalette.store';
import { useRole } from '@/hooks/useRole';
import { clsx } from 'clsx';
import NTAssistant from '@/components/NTAssistant/NTAssistant';
import GlobalSearch from '@/components/shared/GlobalSearch';
import LeatherSeal from '@/components/shared/LeatherSeal';
import NotificacionesDropdown from '@/components/layout/NotificacionesDropdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

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
            { to: '/solicitudes', icon: ClipboardCheck, label: 'Solicitudes', desc: 'Pedidos por aprobar', roles: ['admin', 'operario'] },
            { to: '/pedidos',      icon: ShoppingBag,  label: 'Pedidos',  desc: 'Gestión de pedidos',  roles: ['admin', 'operario'] },
            { to: '/timeline',     icon: GitBranch,    label: 'Timeline', desc: 'Flujo de producción', roles: ['admin', 'operario'] },
        ],
    },
    {
        label: 'INVENTARIO',
        items: [
            { to: '/productos', icon: Package,        label: 'Productos', desc: 'Control de stock',     roles: ['admin', 'operario'] },
            { to: '/insumos',   icon: FlaskConical,   label: 'Insumos',   desc: 'Materiales',           roles: ['admin', 'operario'] },
            { to: '/kardex',    icon: ArrowLeftRight, label: 'Kardex',    desc: 'Movimientos de stock', roles: ['admin', 'operario'] },
        ],
    },
    {
        label: 'CLIENTES',
        items: [
            { to: '/clientes', icon: Users, label: 'Clientes', desc: 'Base de clientes', roles: ['admin', 'operario'] },
        ],
    },
    {
        label: 'REPORTES',
        items: [
            { to: '/reportes',       icon: BarChart2,     label: 'Reportes',       desc: 'PDF y exportaciones', roles: ['admin', 'operario'] },
            { to: '/reporte-diario', icon: CalendarCheck, label: 'Reporte Diario', desc: 'Actividad del día',   roles: ['admin'] },
            { to: '/calificaciones', icon: Star,          label: 'Calificaciones', desc: 'Opiniones de clientes', roles: ['admin', 'operario'] },
        ],
    },
    {
        label: 'ADMINISTRACIÓN',
        items: [
            { to: '/usuarios',  icon: UserCog,       label: 'Usuarios',  desc: 'Gestión de usuarios', roles: ['admin'] },
            { to: '/auditoria', icon: ClipboardList, label: 'Auditoría', desc: 'Log de actividad',    roles: ['admin'] },
        ],
    },
];

export default function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
    const { user, logout } = useAuthStore();
    const { isAdmin, isOperario } = useRole();
    const navigate = useNavigate();
    const setSearchOpen = useCommandPaletteStore(s => s.setOpen);

    const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    const shortcutLabel = isMac ? '⌘K' : 'Ctrl K';

    const handleLogout = () => { logout(); navigate('/login'); };
    const userRole = isAdmin ? 'admin' : isOperario ? 'operario' : '';

    return (
        <TooltipProvider delayDuration={200}>
            <div className="flex h-screen bg-background overflow-hidden">

                {/* Mobile overlay */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-20 bg-foreground/40 backdrop-blur-sm md:hidden"
                         onClick={() => setSidebarOpen(false)} />
                )}

                {/* ── Sidebar ───────────────────────────────────────────────── */}
                <aside className={clsx(
                    'relative flex flex-col bg-sidebar border-r border-sidebar-border shadow-sidebar transition-all duration-300',
                    'fixed inset-y-0 left-0 z-30 w-64 md:relative md:z-auto md:translate-x-0',
                    sidebarOpen ? 'translate-x-0 md:w-64' : '-translate-x-full md:w-20',
                )}>
                    {/* Textura de cuero, casi imperceptible — mismo motivo del login */}
                    <div className="absolute inset-0 bg-texture-stitch text-dorado-400 opacity-[0.025] pointer-events-none" />

                    {/* Logo */}
                    <div className={clsx(
                        'flex items-center gap-3 px-4 py-5 border-b border-sidebar-border/60',
                        !sidebarOpen && 'justify-center px-0',
                    )}>
                        <LeatherSeal size="sm" />
                        {sidebarOpen && (
                            <div className="animate-fade-in min-w-0">
                                <p className="font-display font-semibold text-sidebar-foreground text-sm leading-tight tracking-wide truncate">Nueva Tendencia</p>
                                <p className="text-sidebar-foreground/50 text-2xs">Sistema de Gestión</p>
                            </div>
                        )}
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 p-2 overflow-y-auto scrollbar-hide space-y-1">
                        {NAV_GROUPS.map(({ label, items }) => {
                            const visible = items.filter(item => item.roles.includes(userRole));
                            if (visible.length === 0) return null;
                            return (
                                <div key={label}>
                                    {sidebarOpen && (
                                        <p className="text-2xs text-sidebar-foreground/40 uppercase tracking-widest px-3 pt-3 pb-1 select-none">
                                            {label}
                                        </p>
                                    )}
                                    {!sidebarOpen && <Separator className="my-1 bg-sidebar-border/60" />}
                                    <div className="space-y-0.5">
                                        {visible.map(({ to, icon: Icon, label: itemLabel, desc }) => {
                                            const link = (
                                                <NavLink
                                                    to={to}
                                                    className={({ isActive }) => clsx(
                                                        'group relative flex items-center gap-3 rounded-md text-sm font-medium',
                                                        'px-3 py-2.5 text-sidebar-foreground/70 transition-all duration-200',
                                                        'hover:bg-sidebar-accent hover:text-sidebar-foreground',
                                                        !sidebarOpen && 'justify-center px-0 py-3',
                                                        isActive && 'bg-sidebar-accent text-sidebar-foreground',
                                                    )}
                                                >
                                                    {({ isActive }) => (
                                                        <>
                                                            {isActive && (
                                                                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-[55%] w-[3px] rounded-r-full bg-sidebar-primary" />
                                                            )}
                                                            <Icon size={20} className="flex-shrink-0" />
                                                            {sidebarOpen && (
                                                                <div className="animate-fade-in min-w-0">
                                                                    <p className="text-sm leading-tight truncate">{itemLabel}</p>
                                                                    <p className="text-2xs text-sidebar-foreground/40 truncate">{desc}</p>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </NavLink>
                                            );
                                            return sidebarOpen ? (
                                                <div key={to}>{link}</div>
                                            ) : (
                                                <Tooltip key={to}>
                                                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                                                    <TooltipContent side="right">{itemLabel}</TooltipContent>
                                                </Tooltip>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </nav>

                    {/* User */}
                    <div className={clsx('p-3 border-t border-sidebar-border', !sidebarOpen && 'flex justify-center')}>
                        {sidebarOpen ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="w-full flex items-center gap-2 px-2 py-2 rounded-md bg-sidebar-accent/60 transition-all duration-200 hover:bg-sidebar-accent hover:scale-[1.01]">
                                        <Avatar className="h-7 w-7">
                                            <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs font-medium">
                                                {user?.email?.charAt(0).toUpperCase() ?? 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 text-left flex-1">
                                            <p className="text-xs text-sidebar-foreground truncate">{user?.email}</p>
                                            <Badge
                                                variant={user?.role === 'admin' ? 'default' : 'secondary'}
                                                className="mt-0.5 px-1.5 py-0 h-4 text-2xs font-medium uppercase tracking-wider"
                                            >
                                                {user?.role === 'admin' ? 'Admin' : 'Operario'}
                                            </Badge>
                                        </div>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-56">
                                    <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{user?.email}</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleLogout}
                                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                    >
                                        <LogOut size={14} /> Cerrar sesión
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleLogout}
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <LogOut size={16} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">Cerrar sesión</TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                </aside>

                {/* ── Main ──────────────────────────────────────────────────── */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="flex items-center justify-between px-6 py-3 bg-card/50 backdrop-blur border-b border-border/50">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(v => !v)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                        </Button>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                onClick={() => setSearchOpen(true)}
                                className="hidden sm:flex items-center gap-2 h-9 px-3 text-muted-foreground hover:text-foreground"
                            >
                                <Search size={16} />
                                <span className="text-sm">Buscar...</span>
                                <kbd className="ml-1 rounded border border-border bg-muted px-1.5 py-0.5 text-2xs font-mono text-muted-foreground">
                                    {shortcutLabel}
                                </kbd>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSearchOpen(true)}
                                className="sm:hidden text-muted-foreground hover:text-foreground"
                            >
                                <Search size={17} />
                            </Button>
                            <NotificacionesDropdown />
                        </div>
                    </header>
                    <main className="flex-1 overflow-y-auto p-6 bg-background">
                        <div className="page-transition">
                            <Outlet />
                        </div>
                    </main>
                </div>

                <NTAssistant />
                <GlobalSearch />
            </div>
        </TooltipProvider>
    );
}

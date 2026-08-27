import { useNavigate } from 'react-router-dom';
import { Bell, ClipboardCheck, Package } from 'lucide-react';
import { useNotificaciones } from '@/hooks/useNotificaciones';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export default function NotificacionesDropdown() {
    const navigate = useNavigate();
    const { solicitudes, stockCritico, total } = useNotificaciones();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-muted-foreground hover:text-foreground"
                >
                    <Bell size={17} />
                    {total > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-4 min-w-[16px] px-0.5 flex items-center justify-center rounded-full text-2xs font-bold"
                        >
                            {total > 99 ? '99+' : total}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                {total === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        No tenés notificaciones pendientes.
                    </div>
                ) : (
                    <>
                        {solicitudes.length > 0 && (
                            <>
                                <DropdownMenuLabel className="flex items-center gap-1.5 text-muted-foreground font-normal">
                                    <ClipboardCheck size={13} /> Solicitudes pendientes
                                </DropdownMenuLabel>
                                {solicitudes.map(item => (
                                    <DropdownMenuItem
                                        key={item.id}
                                        onClick={() => navigate(item.ruta)}
                                        className="flex-col items-start gap-0"
                                    >
                                        <span className="text-sm text-foreground truncate w-full">{item.titulo}</span>
                                        <span className="text-2xs text-muted-foreground truncate w-full">{item.subtitulo}</span>
                                    </DropdownMenuItem>
                                ))}
                            </>
                        )}
                        {solicitudes.length > 0 && stockCritico.length > 0 && <DropdownMenuSeparator />}
                        {stockCritico.length > 0 && (
                            <>
                                <DropdownMenuLabel className="flex items-center gap-1.5 text-muted-foreground font-normal">
                                    <Package size={13} /> Stock crítico
                                </DropdownMenuLabel>
                                {stockCritico.map(item => (
                                    <DropdownMenuItem
                                        key={item.id}
                                        onClick={() => navigate(item.ruta)}
                                        className="flex-col items-start gap-0"
                                    >
                                        <span className="text-sm text-foreground truncate w-full">{item.titulo}</span>
                                        <span className="text-2xs text-muted-foreground truncate w-full">{item.subtitulo}</span>
                                    </DropdownMenuItem>
                                ))}
                            </>
                        )}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

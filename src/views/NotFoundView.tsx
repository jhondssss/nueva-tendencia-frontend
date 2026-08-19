import { useNavigate } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LeatherSeal from '@/components/shared/LeatherSeal';

export default function NotFoundView() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-cafe-gradient flex items-center justify-center p-6 relative overflow-hidden">

            {/* Fondo decorativo — mismo motivo del login */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-dorado-400/15 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-secondary/20 blur-3xl" />
                <div className="absolute inset-0 bg-texture-dots text-dorado-100 opacity-[0.05]" />
                <div className="absolute inset-0 bg-texture-stitch text-dorado-100 opacity-[0.035]" />
            </div>

            <div className="text-center max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

                <LeatherSeal size="lg" animated className="mx-auto mb-6" />

                <p className="font-display font-bold text-dorado-400 text-8xl leading-none tracking-tight mb-4
                               [text-shadow:0_0_40px_theme(colors.dorado.500/40)]">
                    404
                </p>

                <h1 className="text-xl font-display font-semibold text-sidebar-foreground mb-2">
                    Página no encontrada
                </h1>
                <p className="text-sidebar-foreground/70 text-sm leading-relaxed mb-8">
                    La página que buscas no existe o fue movida.
                </p>

                <Button onClick={() => navigate('/dashboard')} className="hover:scale-[1.01] transition-transform">
                    <LayoutDashboard size={15} />
                    Volver al Dashboard
                </Button>
            </div>
        </div>
    );
}

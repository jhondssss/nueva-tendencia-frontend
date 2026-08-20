import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/services';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import LeatherSeal from '@/components/shared/LeatherSeal';
import toast from 'react-hot-toast';

const schema = z.object({
    password:  z.string().min(6, 'Mínimo 6 caracteres'),
    confirmar: z.string(),
}).refine(d => d.password === d.confirmar, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmar'],
});
type FormData = z.infer<typeof schema>;

export default function CambiarPasswordView() {
    const navigate = useNavigate();
    const user                = useAuthStore(s => s.user);
    const logout               = useAuthStore(s => s.logout);
    const markPasswordChanged  = useAuthStore(s => s.markPasswordChanged);

    const [showPass, setShowPass]       = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        try {
            await authApi.cambiarPasswordInicial(data.password);
            markPasswordChanged();
            toast.success('Contraseña actualizada correctamente');
            navigate(user?.role === 'cliente' ? '/mis-pedidos' : '/dashboard', { replace: true });
        } catch {
            toast.error('No se pudo actualizar la contraseña. Intenta nuevamente.');
        }
    };

    const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

    return (
        <div className="min-h-screen bg-cafe-gradient flex items-center justify-center p-4 relative overflow-hidden">

            {/* Fondo decorativo — mismo motivo del login */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-dorado-400/15 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-secondary/20 blur-3xl" />
                <div className="absolute inset-0 bg-texture-dots text-dorado-100 opacity-[0.05]" />
                <div className="absolute inset-0 bg-texture-stitch text-dorado-100 opacity-[0.035]" />
            </div>

            <div className="w-full max-w-sm relative z-10">

                {/* Sello de marca */}
                <div className="text-center mb-9">
                    <LeatherSeal size="lg" animated className="mb-6" />
                    <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-[0.12em]
                                    text-sidebar-foreground mb-3
                                    animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-backwards">
                        Nueva Tendencia
                    </h1>
                    <div className="mx-auto w-10 h-[3px] rounded-full bg-secondary mb-3
                                     animate-in fade-in zoom-in-50 duration-500 delay-300 fill-mode-backwards" />
                    <p className="text-sidebar-foreground/70 text-sm
                                   animate-in fade-in duration-500 delay-300 fill-mode-backwards">
                        Por seguridad, crea una nueva contraseña
                    </p>
                </div>

                {/* Card */}
                <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-backwards">
                    <div className="absolute -inset-2 rounded-2xl border border-dashed border-dorado-400/25 pointer-events-none" />
                    <div className="relative rounded-xl border border-border/50 bg-card/60 backdrop-blur-md p-8
                                     shadow-modal transition-all duration-300 hover:shadow-lg">
                        <div className="mb-6 flex items-start gap-3">
                            <ShieldCheck size={22} className="text-secondary mt-0.5 shrink-0" />
                            <div>
                                <h2 className="font-display text-xl font-medium text-foreground">Cambiar contraseña</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Tu cuenta tiene una contraseña temporal. Debes actualizarla antes de continuar.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                            <div>
                                <label className="label">Nueva contraseña</label>
                                <div className="relative">
                                    <input
                                        {...register('password')}
                                        type={showPass ? 'text' : 'password'}
                                        placeholder="Mínimo 6 caracteres"
                                        className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                                        autoComplete="new-password"
                                    />
                                    <button type="button" onClick={() => setShowPass(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
                            </div>

                            <div>
                                <label className="label">Confirmar contraseña</label>
                                <div className="relative">
                                    <input
                                        {...register('confirmar')}
                                        type={showConfirm ? 'text' : 'password'}
                                        placeholder="Repite la contraseña"
                                        className={`input pr-10 ${errors.confirmar ? 'input-error' : ''}`}
                                        autoComplete="new-password"
                                    />
                                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                {errors.confirmar && <p className="text-destructive text-xs mt-1">{errors.confirmar.message}</p>}
                            </div>

                            <Button type="submit" disabled={isSubmitting} className="w-full justify-center mt-2 hover:scale-[1.01] transition-transform">
                                {isSubmitting
                                    ? <><Loader2 size={15} className="animate-spin" /> Guardando...</>
                                    : 'Actualizar contraseña'}
                            </Button>

                            <div className="text-center pt-1">
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="text-sm text-muted-foreground hover:text-secondary transition-colors">
                                    Cerrar sesión
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <p className="text-center text-sidebar-foreground/40 text-xs mt-6
                               animate-in fade-in duration-500 delay-500 fill-mode-backwards">
                    Calzados Nueva Tendencia · Cochabamba, Bolivia
                </p>
            </div>
        </div>
    );
}

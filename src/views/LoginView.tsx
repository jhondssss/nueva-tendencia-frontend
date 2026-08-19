import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/api/services';
import { Button } from '@/components/ui/button';
import Modal from '@/components/shared/Modal';
import toast from 'react-hot-toast';

const schema = z.object({
    email:    z.string().email('Email inválido'),
    password: z.string().min(1, 'La contraseña es requerida'),
});

type FormData = z.infer<typeof schema>;

export default function LoginView() {
    const [showPass, setShowPass]       = useState(false);
    const [forgotOpen, setForgotOpen]   = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotSent, setForgotSent]   = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);
    const { login, isLoading } = useAuthStore();

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        try {
            await login(data);
        } catch {
            toast.error('Credenciales inválidas');
        }
    };

    const handleForgot = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotLoading(true);
        try {
            await authApi.forgotPassword(forgotEmail);
            setForgotSent(true);
        } catch {
            toast.error('No se pudo enviar el correo. Verifica el email ingresado.');
        } finally {
            setForgotLoading(false);
        }
    };

    const closeForgot = () => {
        setForgotOpen(false);
        setForgotEmail('');
        setForgotSent(false);
    };

    return (
        <div className="min-h-screen bg-cafe-gradient flex items-center justify-center p-4 relative overflow-hidden">

            {/* Fondo decorativo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-dorado-400/15 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-secondary/20 blur-3xl" />
                {/* Textura tipo cuero: puntos finos */}
                <div className="absolute inset-0 opacity-[0.05]"
                     style={{
                         backgroundImage: 'radial-gradient(#F5EECE 1px, transparent 1px)',
                         backgroundSize: '22px 22px',
                     }}
                />
                {/* Líneas diagonales sutiles tipo pespunte */}
                <div className="absolute inset-0 opacity-[0.035]"
                     style={{
                         backgroundImage: 'repeating-linear-gradient(45deg, #F5EECE 0px, #F5EECE 1px, transparent 1px, transparent 14px)',
                     }}
                />
            </div>

            <div className="w-full max-w-sm relative z-10">

                {/* Sello de marca */}
                <div className="text-center mb-9">
                    <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6
                                     animate-in fade-in zoom-in-50 duration-500">
                        <div className="absolute inset-0 rounded-full border-2 border-dorado-400/70" />
                        <div className="absolute inset-[5px] rounded-full border border-dashed border-dorado-300/40" />
                        <div className="relative w-14 h-14 rounded-full bg-cafe-gradient shadow-glow-cafe
                                         ring-4 ring-cafe-950/40 flex items-center justify-center">
                            <span className="font-display font-bold text-dorado-100 text-xl tracking-wide">NT</span>
                        </div>
                    </div>
                    <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-[0.12em]
                                    text-sidebar-foreground mb-3
                                    animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-backwards">
                        Nueva Tendencia
                    </h1>
                    <div className="mx-auto w-10 h-[3px] rounded-full bg-secondary mb-3
                                     animate-in fade-in zoom-in-50 duration-500 delay-300 fill-mode-backwards" />
                    <p className="text-sidebar-foreground/70 text-sm
                                   animate-in fade-in duration-500 delay-300 fill-mode-backwards">
                        Sistema de Gestión Integral
                    </p>
                </div>

                {/* Card */}
                <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-backwards">
                    <div className="absolute -inset-2 rounded-2xl border border-dashed border-dorado-400/25 pointer-events-none" />
                    <div className="relative rounded-xl border border-border/50 bg-card/60 backdrop-blur-md p-8
                                     shadow-modal transition-all duration-300 hover:shadow-lg">
                    <div className="mb-6">
                        <h2 className="font-display text-xl font-medium text-foreground">Iniciar sesión</h2>
                        <p className="text-sm text-muted-foreground mt-1">Ingresa tus credenciales para continuar</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                        {/* Email */}
                        <div>
                            <label className="label">Correo electrónico</label>
                            <input
                                {...register('email')}
                                type="email"
                                placeholder="admin@nuevatendencia.com"
                                className={`input ${errors.email ? 'input-error' : ''}`}
                                autoComplete="email"
                            />
                            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="label">Contraseña</label>
                            <div className="relative">
                                <input
                                    {...register('password')}
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                                    autoComplete="current-password"
                                />
                                <button type="button" onClick={() => setShowPass(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        <Button type="submit" disabled={isLoading} className="w-full justify-center mt-2 hover:scale-[1.01] transition-transform">
                            {isLoading
                                ? <><Loader2 size={15} className="animate-spin" /> Ingresando...</>
                                : 'Ingresar al sistema'
                            }
                        </Button>

                        <div className="text-center pt-1">
                            <button
                                type="button"
                                onClick={() => setForgotOpen(true)}
                                className="text-sm text-muted-foreground hover:text-secondary transition-colors">
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>
                    </form>
                    </div>
                </div>

                <p className="text-center text-sidebar-foreground/40 text-xs mt-6
                               animate-in fade-in duration-500 delay-500 fill-mode-backwards">
                    Calzados Nueva Tendencia · Cochabamba, Bolivia
                </p>
                <p className="text-center text-sidebar-foreground/25 text-2xs mt-1
                               animate-in fade-in duration-500 delay-500 fill-mode-backwards">v1.0.0</p>
            </div>

            {/* Modal: Olvidé mi contraseña */}
            <Modal
                isOpen={forgotOpen}
                onClose={closeForgot}
                title={forgotSent ? '¡Correo enviado!' : '¿Olvidaste tu contraseña?'}
                subtitle={forgotSent ? undefined : 'Ingresa tu email y te enviaremos un enlace para restablecerla.'}
                size="sm">
                {forgotSent ? (
                    <div className="flex flex-col items-center gap-3 py-2 text-center">
                        <CheckCircle size={36} className="text-secondary" />
                        <p className="text-sm text-muted-foreground">
                            Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                        </p>
                        <Button onClick={closeForgot} className="w-full justify-center mt-2">
                            Entendido
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleForgot} className="space-y-4" noValidate>
                        <div>
                            <label className="label">Correo electrónico</label>
                            <input
                                type="email"
                                value={forgotEmail}
                                onChange={e => setForgotEmail(e.target.value)}
                                placeholder="tu@correo.com"
                                className="input"
                                required
                            />
                        </div>
                        <div className="flex gap-2 pt-1">
                            <Button type="button" variant="outline" onClick={closeForgot} className="flex-1 justify-center">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={forgotLoading} className="flex-1 justify-center">
                                {forgotLoading
                                    ? <><Loader2 size={14} className="animate-spin" /> Enviando...</>
                                    : 'Enviar enlace'}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}

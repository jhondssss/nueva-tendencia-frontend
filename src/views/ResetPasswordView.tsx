import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/api/services';
import toast from 'react-hot-toast';

const schema = z.object({
    password:  z.string().min(6, 'Mínimo 6 caracteres'),
    confirmar: z.string(),
}).refine(d => d.password === d.confirmar, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmar'],
});
type FormData = z.infer<typeof schema>;

export default function ResetPasswordView() {
    const [searchParams] = useSearchParams();
    const navigate       = useNavigate();
    const [showPass, setShowPass]       = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [done, setDone]               = useState(false);

    const token = searchParams.get('token');

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        if (!token) return;
        try {
            await authApi.resetPassword(token, data.password);
            setDone(true);
            setTimeout(() => navigate('/login', { replace: true }), 2500);
        } catch {
            toast.error('El enlace es inválido o ha expirado');
        }
    };

    return (
        <div className="min-h-screen bg-cafe-900 flex items-center justify-center p-4 relative overflow-hidden">

            {/* Fondo decorativo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-dorado-500/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-dorado-500/10 blur-3xl" />
                <div className="absolute inset-0 opacity-[0.03]"
                     style={{
                         backgroundImage: 'linear-gradient(#C6A75E 1px, transparent 1px), linear-gradient(90deg, #C6A75E 1px, transparent 1px)',
                         backgroundSize: '40px 40px',
                     }}
                />
            </div>

            <div className="w-full max-w-sm relative z-10 animate-slide-up">

                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl
                         bg-cafe-gradient shadow-glow-cafe mb-5 animate-fade-in">
                        <span className="font-display font-bold text-white text-xl">NT</span>
                    </div>
                    <h1 className="font-display text-3xl font-semibold text-white mb-1">
                        Nueva Tendencia
                    </h1>
                    <p className="text-cafe-100 text-sm">Restablece tu contraseña</p>
                </div>

                <div className="bg-white border border-surface-border rounded-lg p-8">

                    {/* Token ausente */}
                    {!token && (
                        <div className="flex flex-col items-center gap-3 py-4 text-center">
                            <AlertCircle size={32} className="text-red-500" />
                            <p className="font-display text-lg font-medium text-cafe-950">Enlace inválido</p>
                            <p className="text-sm text-cafe-500">
                                El enlace de restablecimiento no contiene un token válido.
                            </p>
                            <button onClick={() => navigate('/login')} className="btn-primary mt-2 w-full justify-center">
                                Ir al inicio de sesión
                            </button>
                        </div>
                    )}

                    {/* Éxito */}
                    {token && done && (
                        <div className="flex flex-col items-center gap-3 py-4 text-center">
                            <CheckCircle size={32} className="text-green-500" />
                            <p className="font-display text-lg font-medium text-cafe-950">¡Contraseña actualizada!</p>
                            <p className="text-sm text-cafe-500">
                                Serás redirigido al inicio de sesión en unos segundos...
                            </p>
                        </div>
                    )}

                    {/* Formulario */}
                    {token && !done && (
                        <>
                            <div className="mb-6">
                                <h2 className="font-display text-xl font-medium text-cafe-950">
                                    Nueva contraseña
                                </h2>
                                <p className="text-sm text-cafe-500 mt-1">
                                    Ingresa y confirma tu nueva contraseña
                                </p>
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
                                        />
                                        <button type="button" onClick={() => setShowPass(v => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-cafe-400 hover:text-cafe-900 transition-colors">
                                            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="label">Confirmar contraseña</label>
                                    <div className="relative">
                                        <input
                                            {...register('confirmar')}
                                            type={showConfirm ? 'text' : 'password'}
                                            placeholder="Repite la contraseña"
                                            className={`input pr-10 ${errors.confirmar ? 'input-error' : ''}`}
                                        />
                                        <button type="button" onClick={() => setShowConfirm(v => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-cafe-400 hover:text-cafe-900 transition-colors">
                                            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                    {errors.confirmar && (
                                        <p className="text-red-500 text-xs mt-1">{errors.confirmar.message}</p>
                                    )}
                                </div>

                                <button type="submit" disabled={isSubmitting}
                                        className="btn-primary w-full justify-center mt-2">
                                    {isSubmitting
                                        ? <><Loader2 size={15} className="animate-spin" /> Guardando...</>
                                        : 'Restablecer contraseña'}
                                </button>

                                <button type="button" onClick={() => navigate('/login')}
                                        className="w-full text-center text-sm text-cafe-500 hover:text-cafe-700 transition-colors pt-1">
                                    Volver al inicio de sesión
                                </button>
                            </form>
                        </>
                    )}
                </div>

                <p className="text-center text-cafe-300 text-xs mt-6">
                    Calzados Nueva Tendencia · Cochabamba, Bolivia
                </p>
            </div>
        </div>
    );
}

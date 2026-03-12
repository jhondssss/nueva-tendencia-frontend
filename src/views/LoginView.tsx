import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';

const schema = z.object({
    email:    z.string().email('Email inválido'),
    password: z.string().min(1, 'La contraseña es requerida'),
});

type FormData = z.infer<typeof schema>;

export default function LoginView() {
    const [showPass, setShowPass] = useState(false);
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
                    <p className="text-cafe-100 text-sm">Sistema de Gestión Integral</p>
                </div>

                {/* Card */}
                <div className="bg-white border border-surface-border rounded-lg p-8">
                    <div className="mb-6">
                        <h2 className="font-display text-xl font-medium text-cafe-950">Iniciar sesión</h2>
                        <p className="text-sm text-cafe-500 mt-1">Ingresa tus credenciales para continuar</p>
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
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
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
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-cafe-400 hover:text-cafe-900 transition-colors">
                                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center mt-2">
                            {isLoading
                                ? <><Loader2 size={15} className="animate-spin" /> Ingresando...</>
                                : 'Ingresar al sistema'
                            }
                        </button>
                    </form>
                </div>

                <p className="text-center text-cafe-300 text-xs mt-6">
                    Calzados Nueva Tendencia · Cochabamba, Bolivia
                </p>
                <p className="text-center text-cafe-600 text-2xs mt-1">v1.0.0</p>
            </div>
        </div>
    );
}

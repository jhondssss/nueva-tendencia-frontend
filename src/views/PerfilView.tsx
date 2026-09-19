import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isAxiosError } from 'axios';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/api/services';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';

/** Mensaje real del backend (string o array de class-validator), con fallback. */
function backendMessage(err: unknown, fallback: string): string {
    const msg = isAxiosError<{ message?: string | string[] }>(err) ? err.response?.data?.message : undefined;
    return Array.isArray(msg) ? msg.join(', ') : msg || fallback;
}

const datosSchema = z.object({
    nombre:   z.string().trim().min(1, 'El nombre es obligatorio'),
    apellido: z.string().trim().min(1, 'El apellido es obligatorio'),
    email:    z.string().trim().min(1, 'El email es obligatorio').email('El email no es válido'),
});
type DatosForm = z.infer<typeof datosSchema>;

const passwordSchema = z.object({
    password_actual: z.string().min(1, 'Ingresa tu contraseña actual'),
    password_nuevo:  z.string().min(6, 'Mínimo 6 caracteres'),
    confirmar:       z.string(),
}).refine(d => d.password_nuevo === d.confirmar, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmar'],
});
type PasswordForm = z.infer<typeof passwordSchema>;

function PasswordInput({ label, error, autoComplete, registration }: {
    label: string;
    error?: string;
    autoComplete: string;
    registration: UseFormRegisterReturn;
}) {
    const [show, setShow] = useState(false);
    return (
        <div>
            <label className="label">{label}
                <div className="relative mt-1 font-normal">
                    <input
                        {...registration}
                        type={show ? 'text' : 'password'}
                        className={`input pr-10 ${error ? 'input-error' : ''}`}
                        autoComplete={autoComplete}
                    />
                    <button type="button" onClick={() => setShow(v => !v)}
                            aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                </div>
            </label>
            {error && <p className="text-destructive text-xs mt-1">{error}</p>}
        </div>
    );
}

export default function PerfilView() {
    const user         = useAuthStore(s => s.user);
    const updatePerfil = useAuthStore(s => s.updatePerfil);

    const [datosError, setDatosError]       = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const datos = useForm<DatosForm>({
        resolver: zodResolver(datosSchema),
        defaultValues: { nombre: user?.nombre ?? '', apellido: user?.apellido ?? '', email: user?.email ?? '' },
    });
    const pass = useForm<PasswordForm>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { password_actual: '', password_nuevo: '', confirmar: '' },
    });

    // Sincroniza el formulario con el store (p. ej. si `user` cambia desde afuera) sin pisar lo que se está editando.
    const { reset: resetDatos, formState: { isDirty: datosDirty } } = datos;
    useEffect(() => {
        if (user && !datosDirty) {
            resetDatos({ nombre: user.nombre ?? '', apellido: user.apellido ?? '', email: user.email });
        }
    }, [user, datosDirty, resetDatos]);

    const onSubmitDatos = async (values: DatosForm) => {
        setDatosError(null);
        try {
            await updatePerfil(values);
            resetDatos(values);
            toast.success('Datos actualizados');
        } catch (err) {
            const msg = backendMessage(err, 'No se pudieron guardar los datos. Intentá de nuevo.');
            setDatosError(msg);
            if (isAxiosError(err) && err.response?.status === 409) datos.setError('email', { message: msg });
            toast.error(msg);
        }
    };

    const onSubmitPassword = async (values: PasswordForm) => {
        setPasswordError(null);
        try {
            await authApi.cambiarPassword({ password_actual: values.password_actual, password_nuevo: values.password_nuevo });
            pass.reset();
            toast.success('Contraseña actualizada');
        } catch (err) {
            const msg = backendMessage(err, 'No se pudo cambiar la contraseña. Intentá de nuevo.');
            setPasswordError(msg);
            toast.error(msg);
        }
    };

    const { errors: de, isSubmitting: datosSaving } = datos.formState;
    const { errors: pe, isSubmitting: passSaving }  = pass.formState;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="font-display text-2xl font-semibold text-foreground">Mi perfil</h1>
                <p className="text-sm text-muted-foreground mt-1">Administra tus datos personales y tu contraseña.</p>
            </div>

            {/* ── Datos personales ─────────────────────────────────────────── */}
            <section className="card p-6">
                <h2 className="font-display text-lg font-medium text-foreground mb-4">Datos personales</h2>
                <form onSubmit={datos.handleSubmit(onSubmitDatos)} className="space-y-4" noValidate aria-label="Datos personales">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="label" htmlFor="perfil-nombre">Nombre</label>
                            <input id="perfil-nombre" {...datos.register('nombre')} autoComplete="given-name"
                                   className={`input ${de.nombre ? 'input-error' : ''}`} />
                            {de.nombre && <p className="text-destructive text-xs mt-1">{de.nombre.message}</p>}
                        </div>
                        <div>
                            <label className="label" htmlFor="perfil-apellido">Apellido</label>
                            <input id="perfil-apellido" {...datos.register('apellido')} autoComplete="family-name"
                                   className={`input ${de.apellido ? 'input-error' : ''}`} />
                            {de.apellido && <p className="text-destructive text-xs mt-1">{de.apellido.message}</p>}
                        </div>
                    </div>
                    <div>
                        <label className="label" htmlFor="perfil-email">Email</label>
                        <input id="perfil-email" type="email" {...datos.register('email')} autoComplete="email"
                               className={`input ${de.email ? 'input-error' : ''}`} />
                        {de.email && <p className="text-destructive text-xs mt-1">{de.email.message}</p>}
                    </div>
                    {datosError && !de.email && (
                        <p role="alert" className="text-destructive text-sm">{datosError}</p>
                    )}
                    <div className="flex justify-end">
                        <Button type="submit" disabled={datosSaving || !datosDirty}>
                            {datosSaving ? <><Loader2 size={15} className="animate-spin" /> Guardando...</> : 'Guardar'}
                        </Button>
                    </div>
                </form>
            </section>

            {/* ── Cambiar contraseña ───────────────────────────────────────── */}
            <section className="card p-6">
                <h2 className="font-display text-lg font-medium text-foreground mb-4">Cambiar contraseña</h2>
                <form onSubmit={pass.handleSubmit(onSubmitPassword)} className="space-y-4" noValidate aria-label="Cambiar contraseña">
                    <PasswordInput label="Contraseña actual" autoComplete="current-password"
                                   registration={pass.register('password_actual')} error={pe.password_actual?.message} />
                    <PasswordInput label="Nueva contraseña" autoComplete="new-password"
                                   registration={pass.register('password_nuevo')} error={pe.password_nuevo?.message} />
                    <PasswordInput label="Confirmar nueva contraseña" autoComplete="new-password"
                                   registration={pass.register('confirmar')} error={pe.confirmar?.message} />
                    {passwordError && <p role="alert" className="text-destructive text-sm">{passwordError}</p>}
                    <div className="flex justify-end">
                        <Button type="submit" disabled={passSaving}>
                            {passSaving ? <><Loader2 size={15} className="animate-spin" /> Guardando...</> : 'Guardar'}
                        </Button>
                    </div>
                </form>
            </section>
        </div>
    );
}

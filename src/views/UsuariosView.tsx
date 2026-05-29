import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Plus, Search, Loader2, Trash2, Edit2, Users,
    Eye, EyeOff, ShieldCheck, User as UserIcon,
    ToggleLeft, ToggleRight,
} from 'lucide-react';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import Pagination from '@/components/shared/Pagination';
import PageLoader from '@/components/shared/PageLoader';
import EmptyState from '@/components/shared/EmptyState';
import { usePagination } from '@/hooks/usePagination';
import { usuariosApi } from '@/api/services';
import type { UsuarioAdmin, CreateUsuarioDto, UpdateUsuarioDto } from '@/types';
import toast from 'react-hot-toast';

const schema = z.object({
    email:    z.string().email('Email inválido'),
    password: z.string().optional(),
    nombre:   z.string().min(1, 'Requerido'),
    apellido: z.string().min(1, 'Requerido'),
    role:     z.enum(['admin', 'operario']),
});
type FormData = z.infer<typeof schema>;

export default function UsuariosView() {
    const [usuarios, setUsuarios]         = useState<UsuarioAdmin[]>([]);
    const [isLoading, setIsLoading]       = useState(true);
    const [modalOpen, setModalOpen]       = useState(false);
    const [editTarget, setEditTarget]     = useState<UsuarioAdmin | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<UsuarioAdmin | null>(null);
    const [search, setSearch]             = useState('');
    const [showPass, setShowPass]         = useState(false);
    const [toggling, setToggling]         = useState<number | null>(null);

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const load = async () => {
        try {
            setIsLoading(true);
            const res = await usuariosApi.getAll();
            setUsuarios(res.data.data);
        } catch {
            toast.error('Error al cargar usuarios');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, []);
    useEffect(() => { document.title = 'Usuarios | NT'; }, []);

    const openCreate = () => {
        setEditTarget(null);
        reset({ email: '', password: '', nombre: '', apellido: '', role: 'operario' });
        setShowPass(false);
        setModalOpen(true);
    };

    const openEdit = (u: UsuarioAdmin) => {
        setEditTarget(u);
        reset({ email: u.email, password: '', nombre: u.nombre, apellido: u.apellido, role: u.role });
        setShowPass(false);
        setModalOpen(true);
    };

    const onSubmit = async (data: FormData) => {
        if (!editTarget && !data.password) {
            toast.error('La contraseña es obligatoria al crear un usuario');
            return;
        }
        if (data.password && data.password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        try {
            if (editTarget) {
                const dto: UpdateUsuarioDto = {
                    email:    data.email,
                    nombre:   data.nombre,
                    apellido: data.apellido,
                    role:     data.role,
                    ...(data.password ? { password: data.password } : {}),
                };
                const res = await usuariosApi.update(editTarget.id, dto);
                setUsuarios(prev => prev.map(u => u.id === editTarget.id ? res.data : u));
                toast.success('Usuario actualizado');
            } else {
                const dto: CreateUsuarioDto = {
                    email:    data.email,
                    password: data.password!,
                    nombre:   data.nombre,
                    apellido: data.apellido,
                    role:     data.role,
                };
                const res = await usuariosApi.create(dto);
                setUsuarios(prev => [...prev, res.data]);
                toast.success('Usuario creado');
            }
            setModalOpen(false);
        } catch {
            toast.error(editTarget ? 'Error al actualizar usuario' : 'Error al crear usuario');
        }
    };

    const handleToggle = async (u: UsuarioAdmin) => {
        setToggling(u.id);
        try {
            const res = await usuariosApi.toggle(u.id);
            setUsuarios(prev => prev.map(x => x.id === u.id ? res.data : x));
            toast.success(res.data.activo ? 'Usuario activado' : 'Usuario desactivado');
        } catch {
            toast.error('No se pudo cambiar el estado del usuario');
        } finally {
            setToggling(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await usuariosApi.remove(deleteTarget.id);
            setUsuarios(prev => prev.filter(u => u.id !== deleteTarget.id));
            toast.success('Usuario eliminado');
        } catch {
            toast.error('No se pudo eliminar el usuario');
        }
    };

    const filtered = usuarios.filter(u =>
        !search ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.nombre.toLowerCase().includes(search.toLowerCase()) ||
        u.apellido.toLowerCase().includes(search.toLowerCase()),
    );

    const pagination = usePagination(filtered, 10);

    return (
        <div className="space-y-5 animate-fade-in">

            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title section-title">Gestión de Usuarios</h1>
                    <p className="page-subtitle">{usuarios.length} usuarios registrados</p>
                </div>
                <button onClick={openCreate} className="btn-ripple">
                    <Plus size={15} /> Nuevo usuario
                </button>
            </div>

            {/* Búsqueda */}
            <div className="relative w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-200" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                       placeholder="Nombre o email..." className="input pl-9" />
            </div>

            {/* Tabla */}
            <div className="card overflow-hidden">
                <div className="table-container">
                    <table className="table table-highlight">
                        <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th />
                        </tr>
                        </thead>
                        <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5}><PageLoader /></td></tr>
                        ) : pagination.pageData.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    <EmptyState icon={Users} title="Sin usuarios registrados"
                                                description="Crea el primer usuario con el botón 'Nuevo usuario'." />
                                </td>
                            </tr>
                        ) : (
                            pagination.pageData.map(u => (
                                <tr key={u.id}>
                                    <td className="font-medium">{u.nombre} {u.apellido}</td>
                                    <td className="text-ink-100 text-xs">{u.email}</td>
                                    <td>
                                        <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded border ${
                                            u.role === 'admin'
                                                ? 'bg-dorado-500/10 text-dorado-400 border-dorado-600/30'
                                                : 'bg-ink-700 text-ink-100 border-ink-600'
                                        }`}>
                                            {u.role === 'admin'
                                                ? <ShieldCheck size={11} />
                                                : <UserIcon size={11} />}
                                            {u.role}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`text-xs px-2 py-0.5 rounded border ${
                                            u.activo
                                                ? 'bg-green-950/40 text-green-400 border-green-800/50'
                                                : 'bg-ink-700 text-ink-200 border-ink-600'
                                        }`}>
                                            {u.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-1 items-center">
                                            <button
                                                onClick={() => handleToggle(u)}
                                                disabled={toggling === u.id}
                                                title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                                                className={`p-1.5 rounded transition-colors ${
                                                    u.activo
                                                        ? 'text-green-400 hover:text-green-300 hover:bg-green-950/30'
                                                        : 'text-ink-300 hover:text-green-400 hover:bg-green-950/30'
                                                }`}>
                                                {toggling === u.id
                                                    ? <Loader2 size={13} className="animate-spin" />
                                                    : u.activo
                                                        ? <ToggleRight size={16} />
                                                        : <ToggleLeft size={16} />
                                                }
                                            </button>
                                            <button onClick={() => openEdit(u)}
                                                    className="p-1.5 rounded text-ink-300 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                                                <Edit2 size={13} />
                                            </button>
                                            <button onClick={() => setDeleteTarget(u)}
                                                    className="p-1.5 rounded text-ink-300 hover:text-red-400 hover:bg-red-950/40 transition-colors">
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {!isLoading && (
                    <div className="px-4 pb-4">
                        <Pagination
                            page={pagination.page}
                            totalPages={pagination.totalPages}
                            total={filtered.length}
                            goToPage={pagination.goToPage}
                            nextPage={pagination.nextPage}
                            prevPage={pagination.prevPage}
                        />
                    </div>
                )}
            </div>

            {/* Modal crear / editar */}
            <Modal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); reset(); }}
                title={editTarget ? 'Editar Usuario' : 'Nuevo Usuario'}
                subtitle={editTarget ? 'Modifica los datos del usuario' : 'Completa los datos del nuevo usuario'}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Nombre *</label>
                            <input {...register('nombre')} placeholder="Juan"
                                   className={`input ${errors.nombre ? 'input-error' : ''}`} />
                            {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre.message}</p>}
                        </div>
                        <div>
                            <label className="label">Apellido *</label>
                            <input {...register('apellido')} placeholder="Pérez"
                                   className={`input ${errors.apellido ? 'input-error' : ''}`} />
                            {errors.apellido && <p className="text-red-400 text-xs mt-1">{errors.apellido.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="label">Correo electrónico *</label>
                        <input {...register('email')} type="email" placeholder="usuario@nuevatendencia.com"
                               className={`input ${errors.email ? 'input-error' : ''}`} />
                        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="label">
                            {editTarget ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
                        </label>
                        <div className="relative">
                            <input
                                {...register('password')}
                                type={showPass ? 'text' : 'password'}
                                placeholder={editTarget ? '••••••••' : 'Mínimo 6 caracteres'}
                                className="input pr-10"
                            />
                            <button type="button" onClick={() => setShowPass(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-cream transition-colors">
                                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="label">Rol *</label>
                        <select {...register('role')} className="select">
                            <option value="operario">Operario</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-ink-600">
                        <button type="button" onClick={() => { setModalOpen(false); reset(); }}
                                className="btn-secondary">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary">
                            {isSubmitting
                                ? <><Loader2 size={14} className="animate-spin" /> Guardando...</>
                                : editTarget ? 'Actualizar' : 'Crear usuario'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Confirmar eliminación */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Eliminar usuario"
                message={deleteTarget
                    ? `¿Seguro que deseas eliminar al usuario "${deleteTarget.nombre} ${deleteTarget.apellido}"? Esta acción no se puede deshacer.`
                    : ''}
            />
        </div>
    );
}

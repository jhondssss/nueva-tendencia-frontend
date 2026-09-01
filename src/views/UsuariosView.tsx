import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isAxiosError } from 'axios';
import {
    Plus, Search, Loader2, Trash2, Edit2, Users,
    Eye, EyeOff, ShieldCheck, User as UserIcon,
    ToggleLeft, ToggleRight,
} from 'lucide-react';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import Pagination from '@/components/shared/Pagination';
import { TableSkeleton } from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { usePagination } from '@/hooks/usePagination';
import { useRole } from '@/hooks/useRole';
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
    const { isAdmin, canCreate } = useRole();

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

    useEffect(() => { if (isAdmin) load(); }, [isAdmin]);
    useEffect(() => { document.title = 'Usuarios | NT'; }, []);

    const openCreate = () => {
        setEditTarget(null);
        reset({ email: '', password: '', nombre: '', apellido: '', role: 'operario' });
        setShowPass(false);
        setModalOpen(true);
    };

    const openEdit = (u: UsuarioAdmin) => {
        if (u.role === 'cliente') {
            toast.error('Las cuentas de cliente se gestionan desde la ficha del Cliente correspondiente, no desde acá.');
            return;
        }
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
            await usuariosApi.remove(deleteTarget.id, { headers: { 'x-silent': 'true' } });
            setUsuarios(prev => prev.filter(u => u.id !== deleteTarget.id));
            toast.success('Usuario eliminado');
        } catch (err) {
            const data = isAxiosError<{ message?: string | string[] }>(err) ? err.response?.data?.message : undefined;
            toast.error(Array.isArray(data) ? data.join(', ') : data || 'No se pudo eliminar el usuario');
        }
    };

    const filtered = usuarios.filter(u =>
        !search ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.nombre.toLowerCase().includes(search.toLowerCase()) ||
        u.apellido.toLowerCase().includes(search.toLowerCase()),
    );

    const pagination = usePagination(filtered, 10);

    // ── Access guard ────────────────────────────────────────────────────────────
    // Guard inline específico de esta vista: no sigue el patrón de /insumos, /kardex,
    // /clientes, /reportes o /auditoria, que dependen solo de StaffRoute (bloquea 'cliente')
    // y de que el sidebar oculte el link — esas vistas no chequean el rol internamente.
    // Aquí, en cambio, un 'operario' sí puede navegar a /usuarios (no hay redirect) pero
    // ve este mensaje en vez del listado. Ver UsuariosView.test.tsx para el detalle.
    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-64">
                <EmptyState
                    icon={Users}
                    title="Acceso restringido"
                    description="Solo los administradores pueden gestionar usuarios."
                />
            </div>
        );
    }

    return (
        <div className="space-y-5 animate-fade-in">

            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title section-title">Gestión de Usuarios</h1>
                    <p className="page-subtitle">{usuarios.length} usuarios registrados</p>
                </div>
                {canCreate && (
                    <button onClick={openCreate} className="btn-ripple">
                        <Plus size={15} /> Nuevo usuario
                    </button>
                )}
            </div>

            {/* Búsqueda */}
            <div className="relative w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                       placeholder="Nombre o email..." className="input pl-9" />
            </div>

            {/* Tabla */}
            <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden
                             transition-all duration-300 hover:shadow-lg">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={5}><TableSkeleton rows={5} /></TableCell>
                            </TableRow>
                        ) : pagination.pageData.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={5}>
                                    <EmptyState icon={Users} title="Sin usuarios registrados"
                                                description="Crea el primer usuario con el botón 'Nuevo usuario'." />
                                </TableCell>
                            </TableRow>
                        ) : (
                            pagination.pageData.map(u => (
                                <TableRow key={u.id}>
                                    <TableCell className="font-medium text-foreground">{u.nombre} {u.apellido}</TableCell>
                                    <TableCell className="text-muted-foreground text-xs">{u.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={u.role === 'admin'
                                            ? 'font-medium gap-1 bg-chart-3/10 text-chart-3 border-chart-3/30'
                                            : 'font-medium gap-1 bg-muted text-muted-foreground border-border'}>
                                            {u.role === 'admin'
                                                ? <ShieldCheck size={11} />
                                                : <UserIcon size={11} />}
                                            {u.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={u.activo
                                            ? 'font-medium bg-secondary/10 text-secondary border-secondary/30'
                                            : 'font-medium bg-muted text-muted-foreground border-border'}>
                                            {u.activo ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2 items-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleToggle(u)}
                                                disabled={toggling === u.id}
                                                title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                                                className={`h-8 w-8 ${u.activo
                                                    ? 'text-secondary hover:text-secondary hover:bg-secondary/10'
                                                    : 'text-muted-foreground hover:text-secondary hover:bg-secondary/10'}`}>
                                                {toggling === u.id
                                                    ? <Loader2 size={14} className="animate-spin" />
                                                    : u.activo
                                                        ? <ToggleRight size={16} />
                                                        : <ToggleLeft size={16} />
                                                }
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(u)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                                                <Edit2 size={14} />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(u)}
                                                    className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

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
                            {errors.nombre && <p className="text-destructive text-xs mt-1">{errors.nombre.message}</p>}
                        </div>
                        <div>
                            <label className="label">Apellido *</label>
                            <input {...register('apellido')} placeholder="Pérez"
                                   className={`input ${errors.apellido ? 'input-error' : ''}`} />
                            {errors.apellido && <p className="text-destructive text-xs mt-1">{errors.apellido.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="label">Correo electrónico *</label>
                        <input {...register('email')} type="email" placeholder="usuario@nuevatendencia.com"
                               className={`input ${errors.email ? 'input-error' : ''}`} />
                        {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
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
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
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

                    <div className="flex justify-end gap-2 pt-2 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => { setModalOpen(false); reset(); }}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="hover:scale-[1.02] transition-transform">
                            {isSubmitting
                                ? <><Loader2 size={14} className="animate-spin" /> Guardando...</>
                                : editTarget ? 'Actualizar' : 'Crear usuario'}
                        </Button>
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

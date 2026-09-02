import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isAxiosError } from 'axios';
import toast from 'react-hot-toast';
import { Plus, Search, Loader2, Trash2, Edit2, User, Building2, Users, KeyRound, CheckCircle2 } from 'lucide-react';
import { useClienteStore } from '@/stores/index';
import { clienteApi } from '@/api/services';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import Pagination from '@/components/shared/Pagination';
import { TableSkeleton } from '@/components/shared/Skeleton';
import CreatableSelect from '@/components/shared/CreatableSelect';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { usePagination } from '@/hooks/usePagination';
import { useRole } from '@/hooks/useRole';
import EmptyState from '@/components/shared/EmptyState';
import type { Cliente, CreateClienteDto } from '@/types';

const schema = z.object({
    tipo_cliente_id:      z.number({ error: 'Selecciona un tipo de cliente' }).min(1, 'Selecciona un tipo de cliente'),
    nombre:               z.string().min(1, 'Requerido'),
    apellido:             z.string().optional(),
    nombre_completo:      z.string().optional(),
    documento_identidad:  z.string().optional(),
    correo_electronico:   z.string().email('Email inválido'),
    telefono_principal:   z.string().min(1, 'Requerido'),
    telefono_alternativo: z.string().optional(),
    direccion_calle:      z.string().min(1, 'Requerido'),
    direccion_colonia:    z.string().min(1, 'Requerido'),
    ciudad:               z.string().min(1, 'Requerido'),
    estado_provincia:     z.string().min(1, 'Requerido'),
    codigo_postal:        z.string().min(1, 'Requerido'),
    pais:                 z.string().min(1, 'Requerido'),
    activo:               z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

const DIRECCION_FIELDS = [
    { name: 'direccion_calle',   label: 'Calle / Número',   placeholder: 'Av. Blanco Galindo 123' },
    { name: 'direccion_colonia', label: 'Barrio / Colonia',  placeholder: 'Zona Norte'             },
    { name: 'ciudad',            label: 'Ciudad',            placeholder: 'Cochabamba'             },
    { name: 'estado_provincia',  label: 'Departamento',      placeholder: 'Cochabamba'             },
    { name: 'codigo_postal',     label: 'Código postal',     placeholder: '0000'                   },
    { name: 'pais',              label: 'País',              placeholder: 'Bolivia'                },
] as const;

export default function ClientesView() {
    const [modalOpen, setModalOpen]       = useState(false);
    const [editTarget, setEditTarget]     = useState<Cliente | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null);
    const [accessTarget, setAccessTarget] = useState<Cliente | null>(null);
    const [accesoOtorgado, setAccesoOtorgado] = useState<Set<number>>(new Set());
    const [search, setSearch]             = useState('');

    const {
        clientes, tiposCliente, isLoading,
        fetchAll, fetchTiposCliente, createTipoCliente, create, update, remove,
    } = useClienteStore();
    const { canCreate, canEdit, canDelete } = useRole();

    useEffect(() => { fetchAll(); fetchTiposCliente(); }, [fetchAll, fetchTiposCliente]);
    useEffect(() => { document.title = 'Clientes | NT'; }, []);

    const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as Resolver<FormData>,
        defaultValues: { pais: 'Bolivia', activo: true },
    });

    const openCreate = () => {
        setEditTarget(null);
        reset({ pais: 'Bolivia', activo: true });
        setModalOpen(true);
    };

    const openEdit = (c: Cliente) => {
        setEditTarget(c);
        reset({
            tipo_cliente_id:      c.tipo_cliente.id_tipo_cliente,
            nombre:               c.nombre                    ?? undefined,
            apellido:             c.apellido                  ?? undefined,
            nombre_completo:      c.nombre_completo           ?? undefined,
            documento_identidad:  c.documento_identidad       ?? undefined,
            correo_electronico:   c.correo_electronico        ?? undefined,
            telefono_principal:   c.telefono_principal        ?? undefined,
            telefono_alternativo: c.telefono_alternativo      ?? undefined,
            direccion_calle:      c.direccion?.calle          ?? undefined,
            direccion_colonia:    c.direccion?.colonia        ?? undefined,
            ciudad:               c.direccion?.ciudad         ?? undefined,
            estado_provincia:     c.direccion?.estado_provincia ?? undefined,
            codigo_postal:        c.direccion?.codigo_postal  ?? undefined,
            pais:                 c.direccion?.pais           ?? 'Bolivia',
            activo:               c.activo                    ?? true,
        });
        setModalOpen(true);
    };

    const onSubmit = async (data: FormData) => {
        const {
            direccion_calle, direccion_colonia, ciudad, estado_provincia, codigo_postal, pais,
            ...resto
        } = data;
        const dto: CreateClienteDto = {
            ...resto,
            direccion: { calle: direccion_calle, colonia: direccion_colonia, ciudad, estado_provincia, codigo_postal, pais },
        };
        if (editTarget) await update(editTarget.id_cliente, dto);
        else await create(dto);
        setModalOpen(false);
        reset();
    };

    const tieneAcceso = (c: Cliente) => c.tieneUsuario === true || accesoOtorgado.has(c.id_cliente);

    const handleDarAcceso = async () => {
        if (!accessTarget) return;
        const cliente = accessTarget;
        try {
            await clienteApi.darAcceso(cliente.id_cliente);
            toast.success(`Acceso enviado a ${cliente.correo_electronico}`);
            setAccesoOtorgado(prev => new Set(prev).add(cliente.id_cliente));
        } catch (err) {
            if (isAxiosError(err) && err.response?.status === 409) {
                setAccesoOtorgado(prev => new Set(prev).add(cliente.id_cliente));
            }
        }
    };

    const filtered = clientes.filter(c =>
        !search ||
        c.nombre.toLowerCase().includes(search.toLowerCase()) ||
        c.correo_electronico.toLowerCase().includes(search.toLowerCase()) ||
        c.telefono_principal.includes(search),
    );

    const pagination = usePagination(filtered, 10);

    return (
        <div className="space-y-5 animate-fade-in">

            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title section-title">Gestión de Clientes</h1>
                    <p className="page-subtitle">{clientes.length} clientes registrados</p>
                </div>
                {canCreate && (
                    <button onClick={openCreate} className="btn-ripple">
                        <Plus size={15} /> Nuevo cliente
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="relative w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                       placeholder="Nombre, email o teléfono..." className="input pl-9" />
            </div>

            {/* Tabla */}
            <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden
                             transition-all duration-300 hover:shadow-lg">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>Tipo</TableHead><TableHead>Nombre</TableHead><TableHead>Correo</TableHead>
                            <TableHead>Teléfono</TableHead><TableHead>Ciudad</TableHead><TableHead>Registro</TableHead>
                            <TableHead>Estado</TableHead><TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={8}><TableSkeleton rows={5} /></TableCell>
                            </TableRow>
                        ) : pagination.pageData.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={8}>
                                    <EmptyState icon={Users} title="Sin clientes registrados" description="Registra el primer cliente con el botón 'Nuevo cliente'." />
                                </TableCell>
                            </TableRow>
                        ) : (
                            pagination.pageData.map(c => (
                                <TableRow key={c.id_cliente}>
                                    <TableCell>
                                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            {c.tipo_cliente.nombre === 'empresa'
                                                ? <Building2 size={13} className="text-chart-3" />
                                                : <User size={13} className="text-chart-1" />}
                                            {c.tipo_cliente.nombre}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-medium text-foreground">{c.nombre_completo || `${c.nombre} ${c.apellido ?? ''}`}</TableCell>
                                    <TableCell className="text-muted-foreground text-xs">{c.correo_electronico}</TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">{c.telefono_principal}</TableCell>
                                    <TableCell className="text-muted-foreground">{c.direccion?.ciudad}</TableCell>
                                    <TableCell className="text-muted-foreground text-xs">
                                        {c.fecha_registro ? new Date(c.fecha_registro).toLocaleDateString('es-BO') : '—'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={c.activo
                                            ? 'font-medium bg-secondary/10 text-secondary border-secondary/30'
                                            : 'font-medium bg-muted text-muted-foreground border-border'}>
                                            {c.activo ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {(canEdit || canDelete) && (
                                            <div className="flex gap-2">
                                                {canEdit && (
                                                    tieneAcceso(c) ? (
                                                        <Button variant="ghost" size="icon" disabled title="Acceso ya otorgado"
                                                                className="h-8 w-8 text-secondary opacity-60 cursor-not-allowed">
                                                            <CheckCircle2 size={14} />
                                                        </Button>
                                                    ) : (
                                                        <Button variant="ghost" size="icon" onClick={() => setAccessTarget(c)}
                                                                title="Dar acceso al portal"
                                                                className="h-8 w-8 text-muted-foreground hover:text-secondary hover:bg-secondary/10">
                                                            <KeyRound size={14} />
                                                        </Button>
                                                    )
                                                )}
                                                {canEdit && (
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                                                        <Edit2 size={14} />
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(c)}
                                                            className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10">
                                                        <Trash2 size={14} />
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Paginación */}
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
            <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); reset(); }}
                   title={editTarget ? 'Editar Cliente' : 'Nuevo Cliente'}
                   subtitle="Información de contacto y dirección" size="lg">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Tipo de cliente *</label>
                            <Controller
                                name="tipo_cliente_id"
                                control={control}
                                render={({ field }) => (
                                    <CreatableSelect
                                        value={field.value}
                                        onChange={id => field.onChange(id ?? undefined)}
                                        options={tiposCliente.map(t => ({
                                            id: t.id_tipo_cliente, nombre: t.nombre, activo: t.activo,
                                        }))}
                                        onCreate={async nombre => {
                                            const t = await createTipoCliente(nombre);
                                            return { id: t.id_tipo_cliente, nombre: t.nombre, activo: t.activo };
                                        }}
                                        placeholder="Selecciona un tipo"
                                        newLabel="+ Nuevo tipo"
                                        canCreateNew={canCreate}
                                        error={errors.tipo_cliente_id?.message}
                                    />
                                )}
                            />
                        </div>
                        <div>
                            <label className="label">CI / RUC</label>
                            <input {...register('documento_identidad')} placeholder="12345678" className="input" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Nombre *</label>
                            <input {...register('nombre')} placeholder="Juan"
                                   className={`input ${errors.nombre ? 'input-error' : ''}`} />
                            {errors.nombre && <p className="text-destructive text-xs mt-1">{errors.nombre.message}</p>}
                        </div>
                        <div>
                            <label className="label">Apellido</label>
                            <input {...register('apellido')} placeholder="Pérez" className="input" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Correo electrónico *</label>
                            <input {...register('correo_electronico')} type="email" placeholder="juan@ejemplo.com"
                                   className={`input ${errors.correo_electronico ? 'input-error' : ''}`} />
                            {errors.correo_electronico && <p className="text-destructive text-xs mt-1">{errors.correo_electronico.message}</p>}
                        </div>
                        <div>
                            <label className="label">Teléfono principal *</label>
                            <input {...register('telefono_principal')} placeholder="+591 70000000"
                                   className={`input ${errors.telefono_principal ? 'input-error' : ''}`} />
                        </div>
                    </div>

                    <div>
                        <label className="label">Teléfono alternativo</label>
                        <input {...register('telefono_alternativo')} placeholder="Opcional" className="input" />
                    </div>

                    {/* Dirección */}
                    <div className="border-t border-border pt-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Dirección</p>
                        <div className="grid grid-cols-2 gap-3">
                            {DIRECCION_FIELDS.map(({ name, label, placeholder }) => (
                                <div key={name}>
                                    <label className="label">{label} *</label>
                                    <input {...register(name)} placeholder={placeholder}
                                           className={`input ${errors[name] ? 'input-error' : ''}`} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                        <input type="checkbox" id="activo_c" {...register('activo')}
                               className="w-4 h-4 rounded cursor-pointer accent-primary" />
                        <label htmlFor="activo_c" className="text-sm text-foreground cursor-pointer select-none">Cliente activo</label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => { setModalOpen(false); reset(); }}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="hover:scale-[1.02] transition-transform">
                            {isSubmitting
                                ? <><Loader2 size={14} className="animate-spin" /> Guardando...</>
                                : editTarget ? 'Actualizar' : 'Registrar cliente'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Confirm eliminar */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => deleteTarget && remove(deleteTarget.id_cliente)}
                title="Eliminar cliente"
                message={deleteTarget
                    ? `¿Seguro que deseas eliminar a "${deleteTarget.nombre_completo || deleteTarget.nombre}"? Esta acción no se puede deshacer.`
                    : ''}
                warningMessage="Este cliente puede tener pedidos asociados. Elimina sus pedidos primero."
            />

            {/* Confirm dar acceso al portal */}
            <ConfirmDialog
                isOpen={!!accessTarget}
                onClose={() => setAccessTarget(null)}
                onConfirm={handleDarAcceso}
                title="Dar acceso al portal"
                message={accessTarget ? `¿Enviar acceso a ${accessTarget.correo_electronico}?` : ''}
                confirmLabel="Enviar"
                confirmVariant="default"
                icon={KeyRound}
            />
        </div>
    );
}

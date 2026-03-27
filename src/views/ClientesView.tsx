import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Loader2, Trash2, Edit2, User, Building2, Users } from 'lucide-react';
import { useClienteStore } from '@/stores/index';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import Pagination from '@/components/shared/Pagination';
import PageLoader from '@/components/shared/PageLoader';
import { usePagination } from '@/hooks/usePagination';
import { useRole } from '@/hooks/useRole';
import EmptyState from '@/components/shared/EmptyState';
import type { Cliente, CreateClienteDto } from '@/types';

const schema = z.object({
    tipo_cliente:         z.string().min(1, 'Requerido'),
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
    const [search, setSearch]             = useState('');

    const { clientes, isLoading, fetchAll, create, update, remove } = useClienteStore();
    const { canCreate, canEdit, canDelete } = useRole();

    useEffect(() => { fetchAll(); }, [fetchAll]);
    useEffect(() => { document.title = 'Clientes | NT'; }, []);

    const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
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
        (Object.keys(c) as (keyof Cliente)[]).forEach(k => {
            if (k !== 'id_cliente' && k !== 'fecha_registro' && k !== 'pedidos') {
                setValue(k as keyof FormData, c[k] as never);
            }
        });
        setModalOpen(true);
    };

    const onSubmit = async (data: FormData) => {
        const dto = data as CreateClienteDto;
        if (editTarget) await update(editTarget.id_cliente, dto);
        else await create(dto);
        setModalOpen(false);
        reset();
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
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-200" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                       placeholder="Nombre, email o teléfono..." className="input pl-9" />
            </div>

            {/* Tabla */}
            <div className="card overflow-hidden">
                <div className="table-container">
                    <table className="table table-highlight">
                        <thead>
                        <tr>
                            <th>Tipo</th><th>Nombre</th><th>Correo</th>
                            <th>Teléfono</th><th>Ciudad</th><th>Registro</th><th>Estado</th><th />
                        </tr>
                        </thead>
                        <tbody>
                        {isLoading ? (
                            <tr><td colSpan={8}><PageLoader /></td></tr>
                        ) : pagination.pageData.length === 0 ? (
                            <tr><td colSpan={8}><EmptyState icon={Users} title="Sin clientes registrados" description="Registra el primer cliente con el botón 'Nuevo cliente'." /></td></tr>
                        ) : (
                            pagination.pageData.map(c => (
                                <tr key={c.id_cliente}>
                                    <td>
                                        <span className="flex items-center gap-1.5 text-xs text-ink-100">
                                            {c.tipo_cliente === 'empresa'
                                                ? <Building2 size={13} className="text-amber-400" />
                                                : <User size={13} className="text-blue-400" />}
                                            {c.tipo_cliente}
                                        </span>
                                    </td>
                                    <td className="font-medium">{c.nombre_completo || `${c.nombre} ${c.apellido ?? ''}`}</td>
                                    <td className="text-ink-100 text-xs">{c.correo_electronico}</td>
                                    <td className="font-mono text-xs text-ink-50">{c.telefono_principal}</td>
                                    <td className="text-ink-100">{c.ciudad}</td>
                                    <td className="text-ink-200 text-xs">
                                        {new Date(c.fecha_registro).toLocaleDateString('es-BO')}
                                    </td>
                                    <td>
                                        <span className={`text-xs px-2 py-0.5 rounded border ${
                                            c.activo
                                                ? 'bg-green-950/40 text-green-400 border-green-800/50'
                                                : 'bg-ink-700 text-ink-200 border-ink-600'}`}>
                                            {c.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        {(canEdit || canDelete) && (
                                            <div className="flex gap-1">
                                                {canEdit && (
                                                    <button onClick={() => openEdit(c)}
                                                            className="p-1.5 rounded text-ink-300 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                                                        <Edit2 size={13} />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button onClick={() => setDeleteTarget(c)}
                                                            className="p-1.5 rounded text-ink-300 hover:text-red-400 hover:bg-red-950/40 transition-colors">
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

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
                            <select {...register('tipo_cliente')} className={`select ${errors.tipo_cliente ? 'input-error' : ''}`}>
                                <option value="">Seleccionar...</option>
                                <option value="persona">Persona natural</option>
                                <option value="empresa">Empresa</option>
                            </select>
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
                            {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre.message}</p>}
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
                            {errors.correo_electronico && <p className="text-red-400 text-xs mt-1">{errors.correo_electronico.message}</p>}
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
                    <div className="border-t border-ink-600 pt-3">
                        <p className="text-xs text-ink-100 uppercase tracking-wider mb-3">Dirección</p>
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

                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="activo_c" {...register('activo')}
                               className="w-4 h-4 rounded border-ink-500 accent-amber-500" />
                        <label htmlFor="activo_c" className="text-sm text-cream cursor-pointer">Cliente activo</label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-ink-600">
                        <button type="button" onClick={() => { setModalOpen(false); reset(); }} className="btn-secondary">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary">
                            {isSubmitting
                                ? <><Loader2 size={14} className="animate-spin" /> Guardando...</>
                                : editTarget ? 'Actualizar' : 'Registrar cliente'}
                        </button>
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
        </div>
    );
}

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Loader2, Trash2, Edit2, FlaskConical, AlertTriangle, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useInsumoStore } from '@/stores/index';
import { insumoApi } from '@/api/services';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import Pagination from '@/components/shared/Pagination';
import PageLoader from '@/components/shared/PageLoader';
import EmptyState from '@/components/shared/EmptyState';
import { usePagination } from '@/hooks/usePagination';
import { useRole } from '@/hooks/useRole';
import type { CategoriaInsumo, UnidadMedida, CreateInsumoDto, Insumo } from '@/types';
import { clsx } from 'clsx';

const BACKEND_URL = 'https://nueva-tendencia-backend-production.up.railway.app';

// ─── Catálogos ────────────────────────────────────────────────────────────────

const CATEGORIAS: CategoriaInsumo[] = ['adhesivo', 'material', 'herramienta', 'quimico', 'otro'];
const UNIDADES:   UnidadMedida[]    = ['litro', 'kilo', 'metro', 'unidad', 'galon'];

const CATEGORIA_LABEL: Record<CategoriaInsumo, string> = {
    adhesivo:    'Adhesivo',
    material:    'Material',
    herramienta: 'Herramienta',
    quimico:     'Químico',
    otro:        'Otro',
};

const UNIDAD_LABEL: Record<UnidadMedida, string> = {
    litro:  'Litro (L)',
    kilo:   'Kilogramo (Kg)',
    metro:  'Metro (m)',
    unidad: 'Unidad',
    galon:  'Galón',
};

const UNIDAD_SHORT: Record<UnidadMedida, string> = {
    litro:  'L',
    kilo:   'Kg',
    metro:  'm',
    unidad: 'u.',
    galon:  'gal',
};

const CATEGORIA_BADGE: Record<CategoriaInsumo, string> = {
    adhesivo:    'bg-dorado-500/15 text-dorado-300 border-dorado-500/25',
    material:    'bg-blue-500/15 text-blue-300 border-blue-500/25',
    herramienta: 'bg-ink-600 text-ink-50 border-ink-500',
    quimico:     'bg-red-500/15 text-red-300 border-red-500/25',
    otro:        'bg-cafe-500/15 text-cafe-300 border-cafe-500/25',
};

// ─── Validación de imagen ─────────────────────────────────────────────────────

const MAX_IMG_SIZE  = 5 * 1024 * 1024;
const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

function validateImageFile(file: File): string | null {
    if (!ACCEPTED_MIME.includes(file.type)) return 'Formato no permitido. Usa JPG, PNG o WEBP.';
    if (file.size > MAX_IMG_SIZE)           return 'La imagen supera el límite de 5MB.';
    return null;
}

// ─── Schema Zod ───────────────────────────────────────────────────────────────

const schema = z.object({
    nombre:          z.string().min(1, 'El nombre es requerido'),
    descripcion:     z.string(),
    categoria:       z.enum(['adhesivo', 'material', 'herramienta', 'quimico', 'otro']),
    unidad_medida:   z.enum(['litro', 'kilo', 'metro', 'unidad', 'galon']),
    stock:           z.number({ error: 'Ingresa el stock' }).min(0, 'No puede ser negativo'),
    nivel_minimo:    z.number({ error: 'Ingresa el nivel mínimo' }).min(0, 'No puede ser negativo'),
    precio_unitario: z.number({ error: 'Ingresa el precio' }).positive('Debe ser mayor a 0'),
    activo:          z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

const DEFAULT_VALUES: Partial<FormData> = {
    descripcion:   '',
    categoria:     'material',
    unidad_medida: 'unidad',
    stock:         0,
    nivel_minimo:  0,
    activo:        true,
};

// ─── Helpers de formulario ────────────────────────────────────────────────────

function FormError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="text-red-400 text-xs mt-1">{message}</p>;
}

// ─── Subida de imagen ─────────────────────────────────────────────────────────

async function uploadInsumoImagen(id: number, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('imagen', file);
    await insumoApi.uploadImagen(id, formData);
    toast.success('Imagen subida correctamente');
}

// ─── Vista principal ──────────────────────────────────────────────────────────

export default function InsumosView() {
    const [createOpen, setCreateOpen]     = useState(false);
    const [editTarget, setEditTarget]     = useState<Insumo | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Insumo | null>(null);
    const [search, setSearch]             = useState('');
    const [filterCategoria, setFilterCategoria] = useState<CategoriaInsumo | ''>('');

    // Estado de imagen — crear
    const [createImagen, setCreateImagen]   = useState<File | null>(null);
    const [createPreview, setCreatePreview] = useState<string | null>(null);
    const createFileRef = useRef<HTMLInputElement>(null);

    // Estado de imagen — editar
    const [editImagen, setEditImagen]   = useState<File | null>(null);
    const [editPreview, setEditPreview] = useState<string | null>(null);
    const editFileRef = useRef<HTMLInputElement>(null);

    const { insumos, alertas, isLoading, fetchAll, fetchAlertas, create, update, remove } = useInsumoStore();
    const { canCreate, canEdit, canDelete } = useRole();

    useEffect(() => { fetchAll(); fetchAlertas(); }, [fetchAll, fetchAlertas]);
    useEffect(() => { document.title = 'Insumos | NT'; }, []);

    // ── Handlers de imagen ────────────────────────────────────────────────────

    const handleCreateFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const err = validateImageFile(f);
        if (err) { toast.error(err); return; }
        setCreateImagen(f);
        setCreatePreview(URL.createObjectURL(f));
    };

    const handleEditFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const err = validateImageFile(f);
        if (err) { toast.error(err); return; }
        setEditImagen(f);
        setEditPreview(URL.createObjectURL(f));
    };

    // ── Formulario crear ──────────────────────────────────────────────────────

    const createForm = useForm<FormData>({
        resolver: zodResolver(schema) as Resolver<FormData>,
        defaultValues: DEFAULT_VALUES,
    });

    const onCreateSubmit = async (data: FormData) => {
        const newInsumo = await create(data as CreateInsumoDto);
        if (createImagen) await uploadInsumoImagen(newInsumo.id_insumo, createImagen);
        setCreateOpen(false);
        createForm.reset(DEFAULT_VALUES);
        setCreateImagen(null);
        setCreatePreview(null);
        fetchAlertas();
    };

    const closeCreate = () => {
        setCreateOpen(false);
        createForm.reset(DEFAULT_VALUES);
        setCreateImagen(null);
        setCreatePreview(null);
    };

    // ── Formulario editar ─────────────────────────────────────────────────────

    const editForm = useForm<FormData>({
        resolver: zodResolver(schema) as Resolver<FormData>,
        defaultValues: DEFAULT_VALUES,
    });

    const openEdit = (insumo: Insumo) => {
        setEditTarget(insumo);
        editForm.reset({
            nombre:          insumo.nombre,
            descripcion:     insumo.descripcion,
            categoria:       insumo.categoria,
            unidad_medida:   insumo.unidad_medida,
            stock:           Number(insumo.stock),
            nivel_minimo:    Number(insumo.nivel_minimo),
            precio_unitario: Number(insumo.precio_unitario),
            activo:          insumo.activo,
        });
        setEditImagen(null);
        setEditPreview(insumo.imagen_url ? `${BACKEND_URL}${insumo.imagen_url}` : null);
    };

    const onEditSubmit = async (data: FormData) => {
        if (!editTarget) return;
        await update(editTarget.id_insumo, data);
        if (editImagen) await uploadInsumoImagen(editTarget.id_insumo, editImagen);
        setEditTarget(null);
        editForm.reset(DEFAULT_VALUES);
        setEditImagen(null);
        setEditPreview(null);
        fetchAlertas();
    };

    const closeEdit = () => {
        setEditTarget(null);
        editForm.reset(DEFAULT_VALUES);
        setEditImagen(null);
        setEditPreview(null);
    };

    // ── Filtrado + paginación ─────────────────────────────────────────────────

    const filtered = insumos.filter(i => {
        const matchSearch    = !search || i.nombre.toLowerCase().includes(search.toLowerCase());
        const matchCategoria = !filterCategoria || i.categoria === filterCategoria;
        return matchSearch && matchCategoria;
    });

    const pagination = usePagination(filtered, 10);

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-5 animate-fade-in">

            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Insumos</h1>
                    <p className="page-subtitle">
                        Control de materiales de producción · {insumos.length} registrados
                    </p>
                </div>
                {canCreate && (
                    <button onClick={() => setCreateOpen(true)} className="btn-primary">
                        <Plus size={15} /> Nuevo insumo
                    </button>
                )}
            </div>

            {/* Banner alertas */}
            {!isLoading && alertas.length > 0 && (
                <div className="card p-4 border-red-400/40">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-red-500/10 flex-shrink-0">
                            <AlertTriangle size={14} className="text-red-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-cream">
                            {alertas.length} insumo{alertas.length !== 1 ? 's' : ''} bajo nivel mínimo
                        </h3>
                        <span className="ml-auto text-xs font-mono font-semibold px-2 py-0.5 rounded
                                         bg-red-500/10 text-red-400 border border-red-500/20">
                            {alertas.length}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {alertas.map(a => (
                            <span key={a.id_insumo}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs
                                             bg-red-500/10 text-red-300 border border-red-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
                                {a.nombre} — {a.stock} / {a.nivel_minimo} {UNIDAD_SHORT[a.unidad_medida]}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div className="flex flex-wrap gap-3">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-200" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                           placeholder="Buscar insumo..." className="input pl-9 w-64" />
                </div>
                <select value={filterCategoria}
                        onChange={e => setFilterCategoria(e.target.value as CategoriaInsumo | '')}
                        className="select w-48">
                    <option value="">Todas las categorías</option>
                    {CATEGORIAS.map(c => (
                        <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>
                    ))}
                </select>
            </div>

            {/* Tabla */}
            <div className="card overflow-hidden">
                <div className="table-container">
                    <table className="table">
                        <thead>
                        <tr>
                            <th className="w-14">Imagen</th>
                            <th>#</th>
                            <th>Nombre</th>
                            <th>Categoría</th>
                            <th>Stock</th>
                            <th>Unidad</th>
                            <th>Nivel mín.</th>
                            <th>Precio unit.</th>
                            <th>Estado</th>
                            <th />
                        </tr>
                        </thead>
                        <tbody>
                        {isLoading ? (
                            <tr><td colSpan={10}><PageLoader /></td></tr>
                        ) : pagination.pageData.length === 0 ? (
                            <tr>
                                <td colSpan={10}>
                                    <EmptyState
                                        icon={FlaskConical}
                                        title="Sin insumos registrados"
                                        description="Registra el primer insumo con el botón 'Nuevo insumo'."
                                    />
                                </td>
                            </tr>
                        ) : (
                            pagination.pageData.map(insumo => {
                                const stockBajo = insumo.activo && insumo.stock <= insumo.nivel_minimo;
                                return (
                                    <tr key={insumo.id_insumo}
                                        className={clsx(stockBajo && 'bg-red-950/20')}>
                                        {/* Imagen */}
                                        <td>
                                            {insumo.imagen_url ? (
                                                <img
                                                    src={`${BACKEND_URL}${insumo.imagen_url}`}
                                                    alt={insumo.nombre}
                                                    className="w-10 h-10 rounded-lg object-cover border border-ink-600"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-ink-700 border border-ink-600
                                                                flex items-center justify-center">
                                                    <FlaskConical size={16} className="text-ink-300" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="font-mono text-ink-100">#{insumo.id_insumo}</td>
                                        <td>
                                            <p className="font-medium text-cream">{insumo.nombre}</p>
                                            {insumo.descripcion && (
                                                <p className="text-xs text-ink-200 truncate max-w-[200px]">
                                                    {insumo.descripcion}
                                                </p>
                                            )}
                                        </td>
                                        <td>
                                            <span className={clsx(
                                                'inline-flex px-2 py-0.5 rounded text-xs border',
                                                CATEGORIA_BADGE[insumo.categoria],
                                            )}>
                                                {CATEGORIA_LABEL[insumo.categoria]}
                                            </span>
                                        </td>
                                        <td className={clsx(
                                            'font-mono font-semibold',
                                            stockBajo ? 'text-red-400' : 'text-ink-50',
                                        )}>
                                            {insumo.stock}
                                        </td>
                                        <td className="text-ink-100 text-xs whitespace-nowrap">
                                            {UNIDAD_LABEL[insumo.unidad_medida]}
                                        </td>
                                        <td className="font-mono text-ink-200">{insumo.nivel_minimo}</td>
                                        <td className="font-mono text-amber-400">
                                            Bs. {Number(insumo.precio_unitario).toFixed(2)}
                                        </td>
                                        <td>
                                            {!insumo.activo ? (
                                                <span className="inline-flex px-2 py-0.5 rounded text-xs
                                                                 bg-ink-700 text-ink-300 border border-ink-600">
                                                    Inactivo
                                                </span>
                                            ) : stockBajo ? (
                                                <span className="inline-flex px-2 py-0.5 rounded text-xs
                                                                 bg-red-500/10 text-red-400 border border-red-500/20">
                                                    Stock bajo
                                                </span>
                                            ) : (
                                                <span className="inline-flex px-2 py-0.5 rounded text-xs
                                                                 bg-green-500/10 text-green-400 border border-green-500/20">
                                                    Activo
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex gap-1">
                                                {canEdit && (
                                                    <button onClick={() => openEdit(insumo)}
                                                            className="p-1.5 rounded text-ink-300 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                                                        <Edit2 size={13} />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button onClick={() => setDeleteTarget(insumo)}
                                                            className="p-1.5 rounded text-ink-300 hover:text-red-400 hover:bg-red-950/40 transition-colors">
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
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

            {/* ── Modal: Nuevo insumo ───────────────────────────────────────────── */}
            <Modal isOpen={createOpen}
                   onClose={closeCreate}
                   title="Nuevo Insumo"
                   subtitle="Registra un material de producción"
                   size="lg">
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">

                    {/* Imagen */}
                    <div>
                        <label className="label">Imagen del insumo</label>
                        <div onClick={() => createFileRef.current?.click()}
                             className="border-2 border-dashed border-ink-500 rounded-lg p-4 text-center
                                        cursor-pointer hover:border-dorado-500 transition-colors group">
                            {createPreview ? (
                                <img src={createPreview} alt="preview"
                                     className="mx-auto h-24 object-contain rounded" />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-ink-200
                                                group-hover:text-dorado-400 transition-colors">
                                    <Upload size={22} />
                                    <span className="text-xs">Haz clic para subir imagen</span>
                                    <span className="text-[11px] text-ink-300">JPG, PNG, WEBP — máx. 5MB</span>
                                </div>
                            )}
                            <input ref={createFileRef} type="file"
                                   accept="image/jpeg,image/png,image/webp"
                                   className="hidden" onChange={handleCreateFile} />
                        </div>
                        {createPreview && (
                            <button type="button"
                                    onClick={() => { setCreateImagen(null); setCreatePreview(null); }}
                                    className="mt-1 text-xs text-ink-300 hover:text-red-400 transition-colors">
                                Quitar imagen
                            </button>
                        )}
                    </div>

                    <InsumoFormFields form={createForm} idPrefix="create" />

                    <div className="flex justify-end gap-2 pt-2 border-t border-ink-600">
                        <button type="button" onClick={closeCreate} className="btn-secondary">
                            Cancelar
                        </button>
                        <button type="submit" disabled={createForm.formState.isSubmitting} className="btn-primary">
                            {createForm.formState.isSubmitting
                                ? <><Loader2 size={14} className="animate-spin" /> Creando...</>
                                : 'Crear insumo'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Modal: Editar insumo ──────────────────────────────────────────── */}
            <Modal isOpen={!!editTarget}
                   onClose={closeEdit}
                   title="Editar Insumo"
                   subtitle={editTarget ? `#${editTarget.id_insumo} — ${editTarget.nombre}` : ''}
                   size="lg">
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">

                    {/* Imagen */}
                    <div>
                        <label className="label">Imagen del insumo</label>
                        <div onClick={() => editFileRef.current?.click()}
                             className="border-2 border-dashed border-ink-500 rounded-lg p-4 text-center
                                        cursor-pointer hover:border-dorado-500 transition-colors group">
                            {editPreview ? (
                                <img src={editPreview} alt="preview"
                                     className="mx-auto h-24 object-contain rounded" />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-ink-200
                                                group-hover:text-dorado-400 transition-colors">
                                    <Upload size={22} />
                                    <span className="text-xs">Haz clic para cambiar imagen</span>
                                    <span className="text-[11px] text-ink-300">JPG, PNG, WEBP — máx. 5MB</span>
                                </div>
                            )}
                            <input ref={editFileRef} type="file"
                                   accept="image/jpeg,image/png,image/webp"
                                   className="hidden" onChange={handleEditFile} />
                        </div>
                        {editPreview && (
                            <button type="button"
                                    onClick={() => { setEditImagen(null); setEditPreview(null); }}
                                    className="mt-1 text-xs text-ink-300 hover:text-red-400 transition-colors">
                                Quitar imagen
                            </button>
                        )}
                    </div>

                    <InsumoFormFields form={editForm} idPrefix="edit" />

                    <div className="flex justify-end gap-2 pt-2 border-t border-ink-600">
                        <button type="button" onClick={closeEdit} className="btn-secondary">
                            Cancelar
                        </button>
                        <button type="submit" disabled={editForm.formState.isSubmitting} className="btn-primary">
                            {editForm.formState.isSubmitting
                                ? <><Loader2 size={14} className="animate-spin" /> Guardando...</>
                                : 'Guardar cambios'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Confirm eliminar ──────────────────────────────────────────────── */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => deleteTarget && remove(deleteTarget.id_insumo)}
                title="Eliminar insumo"
                message={deleteTarget
                    ? `¿Seguro que deseas eliminar "${deleteTarget.nombre}"? Esta acción no se puede deshacer.`
                    : ''}
            />
        </div>
    );
}

// ─── Campos del formulario (compartidos entre crear y editar) ─────────────────

type FormInstance = ReturnType<typeof useForm<FormData>>;

function InsumoFormFields({ form, idPrefix }: { form: FormInstance; idPrefix: string }) {
    const { register, formState: { errors } } = form;

    return (
        <>
            {/* Nombre */}
            <div>
                <label className="label">Nombre *</label>
                <input {...register('nombre')} placeholder="Ej. Cola de contacto"
                       className={`input ${errors.nombre ? 'input-error' : ''}`} />
                <FormError message={errors.nombre?.message} />
            </div>

            {/* Descripción */}
            <div>
                <label className="label">Descripción</label>
                <input {...register('descripcion')} placeholder="Descripción breve del insumo"
                       className="input" />
            </div>

            {/* Categoría + Unidad */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="label">Categoría *</label>
                    <select {...register('categoria')}
                            className={`select ${errors.categoria ? 'input-error' : ''}`}>
                        {CATEGORIAS.map(c => (
                            <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>
                        ))}
                    </select>
                    <FormError message={errors.categoria?.message} />
                </div>
                <div>
                    <label className="label">Unidad de medida *</label>
                    <select {...register('unidad_medida')}
                            className={`select ${errors.unidad_medida ? 'input-error' : ''}`}>
                        {UNIDADES.map(u => (
                            <option key={u} value={u}>{UNIDAD_LABEL[u]}</option>
                        ))}
                    </select>
                    <FormError message={errors.unidad_medida?.message} />
                </div>
            </div>

            {/* Stock + Nivel mínimo + Precio */}
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="label">Stock actual *</label>
                    <input type="number" min={0} step="1"
                           {...register('stock', { valueAsNumber: true })}
                           placeholder="0"
                           className={`input ${errors.stock ? 'input-error' : ''}`} />
                    <FormError message={errors.stock?.message} />
                </div>
                <div>
                    <label className="label">Nivel mínimo *</label>
                    <input type="number" min={0} step="1"
                           {...register('nivel_minimo', { valueAsNumber: true })}
                           placeholder="0"
                           className={`input ${errors.nivel_minimo ? 'input-error' : ''}`} />
                    <FormError message={errors.nivel_minimo?.message} />
                </div>
                <div>
                    <label className="label">Precio unit. (Bs.) *</label>
                    <input type="number" min={0} step="0.01"
                           {...register('precio_unitario', { valueAsNumber: true })}
                           placeholder="0.00"
                           className={`input ${errors.precio_unitario ? 'input-error' : ''}`} />
                    <FormError message={errors.precio_unitario?.message} />
                </div>
            </div>

            {/* Activo */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-ink-700/50 border border-ink-600">
                <input type="checkbox" id={`${idPrefix}-activo`}
                       {...register('activo')}
                       className="w-4 h-4 rounded cursor-pointer accent-dorado-500" />
                <label htmlFor={`${idPrefix}-activo`}
                       className="text-sm text-cream cursor-pointer select-none">
                    Insumo activo (disponible para uso en producción)
                </label>
            </div>
        </>
    );
}

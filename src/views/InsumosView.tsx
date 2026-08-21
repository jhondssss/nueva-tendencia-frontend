import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Loader2, Trash2, Edit2, FlaskConical, AlertTriangle, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useInsumoStore } from '@/stores/index';
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
import type { CategoriaInsumo, UnidadMedida, CreateInsumoDto, Insumo } from '@/types';
import { clsx } from 'clsx';

const BACKEND_URL = import.meta.env.VITE_API_URL;

function resolveImageUrl(url?: string | null): string | null {
    if (!url) return null;
    return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
}

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

/** Acento cromático por categoría — coherente con el resto del sistema (tokens shadcn) */
const CATEGORIA_BADGE: Record<CategoriaInsumo, string> = {
    adhesivo:    'bg-chart-3/10 text-chart-3 border-chart-3/30',
    material:    'bg-chart-1/10 text-chart-1 border-chart-1/30',
    herramienta: 'bg-secondary/10 text-secondary border-secondary/30',
    quimico:     'bg-destructive/10 text-destructive border-destructive/30',
    otro:        'bg-chart-4/10 text-chart-4 border-chart-4/30',
};

type EstadoInsumo = 'Inactivo' | 'Agotado' | 'Stock bajo' | 'Activo';

const ESTADO_INSUMO_BADGE: Record<EstadoInsumo, string> = {
    Inactivo:      'bg-muted text-muted-foreground border-border',
    Agotado:       'bg-destructive/10 text-destructive border-destructive/30',
    'Stock bajo':  'bg-warning/10 text-warning border-warning/30',
    Activo:        'bg-secondary/10 text-secondary border-secondary/30',
};

function getEstadoInsumo(insumo: Insumo): EstadoInsumo {
    const stock = Number(insumo.stock);
    if (!insumo.activo) return 'Inactivo';
    if (stock === 0) return 'Agotado';
    if (stock <= Number(insumo.nivel_minimo)) return 'Stock bajo';
    return 'Activo';
}

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
    return <p className="text-destructive text-xs mt-1">{message}</p>;
}


// ─── Vista principal ──────────────────────────────────────────────────────────

export default function InsumosView() {
    const [createOpen, setCreateOpen]     = useState(false);
    const [editTarget, setEditTarget]     = useState<Insumo | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Insumo | null>(null);
    const [lightboxUrl, setLightboxUrl]   = useState<string | null>(null);
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

    const { insumos, alertas, isLoading, fetchAll, fetchAlertas, create, update, uploadImagen, remove } = useInsumoStore();
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
        if (createImagen) {
            const fd = new FormData();
            fd.append('imagen', createImagen);
            await uploadImagen(newInsumo.id_insumo, fd);
        }
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
        setEditPreview(resolveImageUrl(insumo.imagen_url));
    };

    const onEditSubmit = async (data: FormData) => {
        if (!editTarget) return;
        await update(editTarget.id_insumo, data);
        if (editImagen) {
            const fd = new FormData();
            fd.append('imagen', editImagen);
            await uploadImagen(editTarget.id_insumo, fd);
        }
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
                    <h1 className="page-title section-title">Insumos</h1>
                    <p className="page-subtitle">
                        Control de materiales de producción · {insumos.length} registrados
                    </p>
                </div>
                {canCreate && (
                    <button onClick={() => setCreateOpen(true)} className="btn-ripple">
                        <Plus size={15} /> Nuevo insumo
                    </button>
                )}
            </div>

            {/* Banner alertas */}
            {!isLoading && alertas.length > 0 && (
                <div className="rounded-xl border border-destructive/30 bg-card/50 backdrop-blur p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-destructive/10 flex-shrink-0">
                            <AlertTriangle size={14} className="text-destructive" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">
                            {alertas.length} insumo{alertas.length !== 1 ? 's' : ''} bajo nivel mínimo
                        </h3>
                        <span className="ml-auto text-xs font-mono font-semibold px-2 py-0.5 rounded
                                         bg-destructive/10 text-destructive border border-destructive/20">
                            {alertas.length}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {alertas.map(a => (
                            <span key={a.id_insumo}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs
                                             bg-destructive/10 text-destructive border border-destructive/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse flex-shrink-0" />
                                {a.nombre} — {a.stock} / {a.nivel_minimo} {UNIDAD_SHORT[a.unidad_medida]}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div className="flex flex-wrap gap-3">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
            <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden
                             transition-all duration-300 hover:shadow-lg">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-14">Imagen</TableHead>
                            <TableHead>#</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Unidad</TableHead>
                            <TableHead>Nivel mín.</TableHead>
                            <TableHead>Precio unit.</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={10}><TableSkeleton rows={5} /></TableCell>
                            </TableRow>
                        ) : pagination.pageData.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={10}>
                                    <EmptyState
                                        icon={FlaskConical}
                                        title="Sin insumos registrados"
                                        description="Registra el primer insumo con el botón 'Nuevo insumo'."
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            pagination.pageData.map(insumo => {
                                const stockBajo = insumo.activo && Number(insumo.stock) <= Number(insumo.nivel_minimo);
                                const estado = getEstadoInsumo(insumo);
                                return (
                                    <TableRow key={insumo.id_insumo}
                                        className={clsx(stockBajo && 'bg-destructive/5 hover:bg-destructive/10')}>
                                        {/* Imagen */}
                                        <TableCell>
                                            {insumo.imagen_url ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setLightboxUrl(resolveImageUrl(insumo.imagen_url))}
                                                    className="block w-10 h-10 rounded-lg overflow-hidden border border-border
                                                               hover:border-primary/50 hover:scale-105 transition-all cursor-zoom-in">
                                                    <img
                                                        src={resolveImageUrl(insumo.imagen_url)!}
                                                        alt={insumo.nombre}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </button>
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-muted border border-border
                                                                flex items-center justify-center">
                                                    <FlaskConical size={16} className="text-muted-foreground" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono text-muted-foreground">#{insumo.id_insumo}</TableCell>
                                        <TableCell>
                                            <p className="font-medium text-foreground">{insumo.nombre}</p>
                                            {insumo.descripcion && (
                                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {insumo.descripcion}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={clsx('font-medium', CATEGORIA_BADGE[insumo.categoria])}>
                                                {CATEGORIA_LABEL[insumo.categoria]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={clsx(
                                            'font-mono font-semibold',
                                            stockBajo ? 'text-destructive' : 'text-foreground',
                                        )}>
                                            {insumo.stock}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                                            {UNIDAD_LABEL[insumo.unidad_medida]}
                                        </TableCell>
                                        <TableCell className="font-mono text-muted-foreground">{insumo.nivel_minimo}</TableCell>
                                        <TableCell className="font-mono text-primary">
                                            Bs. {Number(insumo.precio_unitario).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={clsx('font-medium', ESTADO_INSUMO_BADGE[estado])}>
                                                {estado}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                {canEdit && (
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(insumo)}
                                                            className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10">
                                                        <Edit2 size={13} />
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(insumo)}
                                                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                                        <Trash2 size={13} />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
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
                             className="border-2 border-dashed border-border rounded-lg p-4 text-center
                                        cursor-pointer hover:border-primary/50 transition-colors group">
                            {createPreview ? (
                                <img src={createPreview} alt="preview"
                                     className="mx-auto h-24 object-contain rounded" />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-muted-foreground
                                                group-hover:text-primary transition-colors">
                                    <Upload size={22} />
                                    <span className="text-xs">Haz clic para subir imagen</span>
                                    <span className="text-[11px] text-muted-foreground">JPG, PNG, WEBP — máx. 5MB</span>
                                </div>
                            )}
                            <input ref={createFileRef} type="file"
                                   accept="image/jpeg,image/png,image/webp"
                                   className="hidden" onChange={handleCreateFile} />
                        </div>
                        {createPreview && (
                            <button type="button"
                                    onClick={() => { setCreateImagen(null); setCreatePreview(null); }}
                                    className="mt-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                                Quitar imagen
                            </button>
                        )}
                    </div>

                    <InsumoFormFields form={createForm} idPrefix="create" />

                    <div className="flex justify-end gap-2 pt-2 border-t border-border">
                        <Button type="button" variant="outline" onClick={closeCreate}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={createForm.formState.isSubmitting} className="hover:scale-[1.02] transition-transform">
                            {createForm.formState.isSubmitting
                                ? <><Loader2 size={14} className="animate-spin" /> Creando...</>
                                : 'Crear insumo'}
                        </Button>
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
                             className="border-2 border-dashed border-border rounded-lg p-4 text-center
                                        cursor-pointer hover:border-primary/50 transition-colors group">
                            {editPreview ? (
                                <img src={editPreview} alt="preview"
                                     className="mx-auto h-24 object-contain rounded" />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-muted-foreground
                                                group-hover:text-primary transition-colors">
                                    <Upload size={22} />
                                    <span className="text-xs">Haz clic para cambiar imagen</span>
                                    <span className="text-[11px] text-muted-foreground">JPG, PNG, WEBP — máx. 5MB</span>
                                </div>
                            )}
                            <input ref={editFileRef} type="file"
                                   accept="image/jpeg,image/png,image/webp"
                                   className="hidden" onChange={handleEditFile} />
                        </div>
                        {editPreview && (
                            <button type="button"
                                    onClick={() => { setEditImagen(null); setEditPreview(null); }}
                                    className="mt-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                                Quitar imagen
                            </button>
                        )}
                    </div>

                    <InsumoFormFields form={editForm} idPrefix="edit" />

                    <div className="flex justify-end gap-2 pt-2 border-t border-border">
                        <Button type="button" variant="outline" onClick={closeEdit}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={editForm.formState.isSubmitting} className="hover:scale-[1.02] transition-transform">
                            {editForm.formState.isSubmitting
                                ? <><Loader2 size={14} className="animate-spin" /> Guardando...</>
                                : 'Guardar cambios'}
                        </Button>
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

            {/* ── Lightbox ──────────────────────────────────────────────────────── */}
            {lightboxUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={() => setLightboxUrl(null)}>
                    <img
                        src={lightboxUrl}
                        alt="Vista previa"
                        className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl object-contain"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
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
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <input type="checkbox" id={`${idPrefix}-activo`}
                       {...register('activo')}
                       className="w-4 h-4 rounded cursor-pointer accent-primary" />
                <label htmlFor={`${idPrefix}-activo`}
                       className="text-sm text-foreground cursor-pointer select-none">
                    Insumo activo (disponible para uso en producción)
                </label>
            </div>
        </>
    );
}

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useInsumoStore } from '@/stores/index';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import Pagination from '@/components/shared/Pagination';
import { Button } from '@/components/ui/button';
import { usePagination } from '@/hooks/usePagination';
import { useRole } from '@/hooks/useRole';
import type { CategoriaInsumo, CreateInsumoDto, Insumo } from '@/types';
import { CATEGORIAS, CATEGORIA_LABEL, resolveImageUrl, validateImageFile } from '@/components/insumos/insumoHelpers';
import { insumoSchema, INSUMO_DEFAULT_VALUES, type InsumoFormData } from '@/components/insumos/insumoSchema';
import { InsumoFormFields } from '@/components/insumos/InsumoForm';
import { ImageDropzone } from '@/components/insumos/ImageDropzone';
import { InsumosTable } from '@/components/insumos/InsumosTable';
import { InsumosAlertBanner } from '@/components/insumos/InsumosAlertBanner';

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

    const createForm = useForm<InsumoFormData>({
        resolver: zodResolver(insumoSchema) as Resolver<InsumoFormData>,
        defaultValues: INSUMO_DEFAULT_VALUES,
    });

    const onCreateSubmit = async (data: InsumoFormData) => {
        const newInsumo = await create(data as CreateInsumoDto);
        if (createImagen) {
            const fd = new FormData();
            fd.append('imagen', createImagen);
            await uploadImagen(newInsumo.id_insumo, fd);
        }
        setCreateOpen(false);
        createForm.reset(INSUMO_DEFAULT_VALUES);
        setCreateImagen(null);
        setCreatePreview(null);
        fetchAlertas();
    };

    const closeCreate = () => {
        setCreateOpen(false);
        createForm.reset(INSUMO_DEFAULT_VALUES);
        setCreateImagen(null);
        setCreatePreview(null);
    };

    // ── Formulario editar ─────────────────────────────────────────────────────

    const editForm = useForm<InsumoFormData>({
        resolver: zodResolver(insumoSchema) as Resolver<InsumoFormData>,
        defaultValues: INSUMO_DEFAULT_VALUES,
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

    const onEditSubmit = async (data: InsumoFormData) => {
        if (!editTarget) return;
        await update(editTarget.id_insumo, data);
        if (editImagen) {
            const fd = new FormData();
            fd.append('imagen', editImagen);
            await uploadImagen(editTarget.id_insumo, fd);
        }
        setEditTarget(null);
        editForm.reset(INSUMO_DEFAULT_VALUES);
        setEditImagen(null);
        setEditPreview(null);
        fetchAlertas();
    };

    const closeEdit = () => {
        setEditTarget(null);
        editForm.reset(INSUMO_DEFAULT_VALUES);
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

            {!isLoading && <InsumosAlertBanner alertas={alertas} />}

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
                <InsumosTable
                    insumos={pagination.pageData}
                    isLoading={isLoading}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onImageClick={setLightboxUrl}
                    onEdit={openEdit}
                    onDelete={setDeleteTarget}
                />

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
                    <ImageDropzone
                        preview={createPreview}
                        onFileChange={handleCreateFile}
                        onRemove={() => { setCreateImagen(null); setCreatePreview(null); }}
                        inputRef={createFileRef}
                        uploadHint="Haz clic para subir imagen"
                    />

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
                    <ImageDropzone
                        preview={editPreview}
                        onFileChange={handleEditFile}
                        onRemove={() => { setEditImagen(null); setEditPreview(null); }}
                        inputRef={editFileRef}
                        uploadHint="Haz clic para cambiar imagen"
                    />

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

import { useEffect, useState } from 'react';
import { Search, AlertTriangle, Plus } from 'lucide-react';
import { useProductoStore } from '@/stores/index';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { usePagination } from '@/hooks/usePagination';
import { useRole } from '@/hooks/useRole';
import ProductosTable from '@/components/productos/ProductosTable';
import ProductoModal from '@/components/productos/ProductoModal';
import { clsx } from 'clsx';
import type { Producto, CreateProductoDto } from '@/types';

export default function ProductosView() {
    const [modalOpen, setModalOpen]       = useState(false);
    const [editTarget, setEditTarget]     = useState<Producto | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Producto | null>(null);
    const [search, setSearch]             = useState('');
    const [showAlertas, setShowAlertas]   = useState(false);
    const [filterActivo, setFilterActivo] = useState<'todos' | 'activos' | 'inactivos'>('todos');

    const { productos, alertas, isLoading, fetchAll, fetchAlertas, create, update, remove } = useProductoStore();
    const { canCreate, canEdit, canDelete } = useRole();

    useEffect(() => { fetchAll(); fetchAlertas(); }, [fetchAll, fetchAlertas]);
    useEffect(() => { document.title = 'Stock | NT'; }, []);

    const displayed = showAlertas ? alertas : productos;
    const filtered  = displayed.filter(p => {
        if (filterActivo === 'activos'   && !p.activo) return false;
        if (filterActivo === 'inactivos' &&  p.activo) return false;
        return !search ||
            p.nombre_modelo.toLowerCase().includes(search.toLowerCase()) ||
            p.marca.toLowerCase().includes(search.toLowerCase());
    });
    const pagination = usePagination(filtered, 10);

    const openEdit = (p: Producto) => { setEditTarget(p); setModalOpen(true); };
    const openCreate = () => { setEditTarget(null); setModalOpen(true); };

    const handleSubmit = async (data: CreateProductoDto, imagen: File | null) => {
        if (editTarget) await update(editTarget.id_producto, data, imagen ?? undefined);
        else await create(data, imagen ?? undefined);
        setModalOpen(false);
    };

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title section-title">Inventario de Productos</h1>
                    <p className="page-subtitle">{productos.length} productos registrados</p>
                </div>
                <div className="flex gap-2">
                    {alertas.length > 0 && (
                        <button onClick={() => setShowAlertas(v => !v)}
                                className={clsx('btn-secondary', showAlertas && 'border-red-600 text-red-400')}>
                            <AlertTriangle size={14} /> {alertas.length} alertas
                        </button>
                    )}
                    {canCreate && (
                        <button onClick={openCreate} className="btn-ripple">
                            <Plus size={15} /> Nuevo producto
                        </button>
                    )}
                </div>
            </div>

            {showAlertas && alertas.length > 0 && (
                <div className="bg-red-950/40 border border-red-700/50 rounded-lg p-4 flex items-center gap-3">
                    <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-300">
                        <strong>{alertas.length} productos</strong> tienen stock por debajo del nivel mínimo.
                    </p>
                </div>
            )}

            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-200" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                           placeholder="Buscar modelo o marca..." className="input pl-9 w-72" />
                </div>
            </div>

            {/* Activo pills */}
            <div className="flex flex-wrap gap-2">
                {([
                    { label: 'Todos',     value: 'todos'     as const, count: displayed.length },
                    { label: 'Activos',   value: 'activos'   as const, count: displayed.filter(p => p.activo).length },
                    { label: 'Inactivos', value: 'inactivos' as const, count: displayed.filter(p => !p.activo).length },
                ] as const).map(({ label, value, count }) => (
                    <button key={value}
                            onClick={() => setFilterActivo(value)}
                            className={clsx(
                                'flex items-center gap-2 px-3 py-1.5 rounded border text-xs transition-all',
                                filterActivo === value
                                    ? 'bg-ink-600 border-ink-400 text-cream'
                                    : 'bg-ink-800 border-ink-600 text-ink-100 hover:border-ink-400',
                            )}>
                        {label} <span className="font-mono">{count}</span>
                    </button>
                ))}
            </div>

            <ProductosTable
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                canEdit={canEdit}
                canDelete={canDelete}
                isLoading={isLoading}
                pagination={pagination}
                total={filtered.length}
            />

            <ProductoModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
                           onSubmit={handleSubmit} producto={editTarget} />

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => deleteTarget && remove(deleteTarget.id_producto)}
                title="Eliminar producto"
                message={deleteTarget
                    ? `¿Seguro que deseas eliminar "${deleteTarget.nombre_modelo}"? Esta acción no se puede deshacer.`
                    : ''}
            />
        </div>
    );
}

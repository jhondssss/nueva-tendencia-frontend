import { useState } from 'react';
import { Edit2, Trash2, Package, AlertTriangle } from 'lucide-react';
import Pagination from '@/components/shared/Pagination';
import PageLoader from '@/components/shared/PageLoader';
import EmptyState from '@/components/shared/EmptyState';
import { clsx } from 'clsx';
import type { Producto } from '@/types';
import type { PaginationResult } from '@/hooks/usePagination';

const BACKEND_URL = 'http://localhost:3000';

interface Props {
    onEdit:     (p: Producto) => void;
    onDelete:   (p: Producto) => void;
    canEdit:    boolean;
    canDelete:  boolean;
    isLoading:  boolean;
    pagination: PaginationResult<Producto>;
    total:      number;
}

export default function ProductosTable({ onEdit, onDelete, canEdit, canDelete, isLoading, pagination, total }: Props) {
    const [hoverImg, setHoverImg] = useState<{ url: string; top: number; left: number } | null>(null);

    return (
        <>
            <div className="card overflow-hidden">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Imagen</th><th>Modelo</th><th>Marca</th><th>Tipo</th>
                                <th>Color</th><th>Precio</th><th>Stock</th><th>Mín.</th><th>Estado</th><th />
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={10}><PageLoader /></td></tr>
                            ) : pagination.pageData.length === 0 ? (
                                <tr>
                                    <td colSpan={10}>
                                        <EmptyState icon={Package}
                                                    title="Sin productos en inventario"
                                                    description="Agrega el primer producto con el botón 'Nuevo producto'." />
                                    </td>
                                </tr>
                            ) : (
                                pagination.pageData.map(p => {
                                    const lowStock = p.stock <= p.nivel_minimo;
                                    return (
                                        <tr key={p.id_producto} className={clsx(lowStock && 'bg-red-950/10')}>
                                            <td>
                                                <div
                                                    className="w-10"
                                                    onMouseEnter={e => {
                                                        if (!p.imagen_url) return;
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setHoverImg({
                                                            url:  `${BACKEND_URL}${p.imagen_url}`,
                                                            top:  Math.max(8, rect.top - 104),
                                                            left: rect.right + 10,
                                                        });
                                                    }}
                                                    onMouseLeave={() => setHoverImg(null)}
                                                >
                                                    {p.imagen_url ? (
                                                        <img src={`${BACKEND_URL}${p.imagen_url}`} alt={p.nombre_modelo}
                                                             className="w-10 h-10 object-cover rounded border border-ink-600 cursor-zoom-in" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded bg-ink-700 border border-ink-600
                                                                         flex items-center justify-center text-ink-400">
                                                            <Package size={15} />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="font-medium">{p.nombre_modelo}</td>
                                            <td className="text-ink-100">{p.marca}</td>
                                            <td className="text-ink-100">{p.tipo_calzado}</td>
                                            <td className="text-ink-100">{p.color}</td>
                                            <td className="font-mono text-amber-400">Bs. {Number(p.precio_venta).toFixed(2)}</td>
                                            <td className={clsx('font-mono font-medium', lowStock ? 'text-red-400' : 'text-cream')}>
                                                {p.stock} {lowStock && <AlertTriangle size={11} className="inline ml-1 text-red-400" />}
                                            </td>
                                            <td className="font-mono text-ink-100">{p.nivel_minimo}</td>
                                            <td>
                                                <span className={clsx('text-xs px-2 py-0.5 rounded border',
                                                    p.activo
                                                        ? 'bg-green-950/40 text-green-400 border-green-800/50'
                                                        : 'bg-ink-700 text-ink-200 border-ink-600')}>
                                                    {p.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td>
                                                {(canEdit || canDelete) && (
                                                    <div className="flex gap-1">
                                                        {canEdit && (
                                                            <button onClick={() => onEdit(p)}
                                                                    className="p-1.5 rounded text-ink-300 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                                                                <Edit2 size={13} />
                                                            </button>
                                                        )}
                                                        {canDelete && (
                                                            <button onClick={() => onDelete(p)}
                                                                    className="p-1.5 rounded text-ink-300 hover:text-red-400 hover:bg-red-950/40 transition-colors">
                                                                <Trash2 size={13} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
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
                            total={total}
                            goToPage={pagination.goToPage}
                            nextPage={pagination.nextPage}
                            prevPage={pagination.prevPage}
                        />
                    </div>
                )}
            </div>

            {hoverImg && (
                <div className="fixed z-50 pointer-events-none" style={{ top: hoverImg.top, left: hoverImg.left }}>
                    <div className="bg-ink-900 border border-ink-600 rounded-xl p-2 shadow-2xl">
                        <img src={hoverImg.url} alt="Vista previa" className="w-48 h-48 object-contain rounded-lg" />
                    </div>
                </div>
            )}
        </>
    );
}

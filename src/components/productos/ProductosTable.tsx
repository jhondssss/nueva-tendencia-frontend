import { useState } from 'react';
import { Edit2, Trash2, Package, AlertTriangle } from 'lucide-react';
import Pagination from '@/components/shared/Pagination';
import { TableSkeleton } from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { clsx } from 'clsx';
import type { Producto } from '@/types';
import type { PaginationResult } from '@/hooks/usePagination';
import { getImagenEstandarizada } from '@/utils/cloudinary';
import ProductImageZoom from '@/components/shared/ProductImageZoom';

const BACKEND_URL = import.meta.env.VITE_API_URL;

function resolveImageUrl(url?: string | null): string | null {
    if (!url) return null;
    return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
}

type EstadoProducto = 'Inactivo' | 'Agotado' | 'Stock bajo' | 'Activo';

const ESTADO_BADGE: Record<EstadoProducto, string> = {
    Inactivo:      'bg-muted text-muted-foreground border-border',
    Agotado:       'bg-destructive/10 text-destructive border-destructive/30',
    'Stock bajo':  'bg-warning/10 text-warning border-warning/30',
    Activo:        'bg-secondary/10 text-secondary border-secondary/30',
};

function getEstadoProducto(p: Producto): EstadoProducto {
    const stock = Number(p.stock);
    if (!p.activo) return 'Inactivo';
    if (stock === 0) return 'Agotado';
    if (stock <= Number(p.nivel_minimo)) return 'Stock bajo';
    return 'Activo';
}

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
    const [hoverImg, setHoverImg]     = useState<{ url: string; top: number; left: number } | null>(null);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    return (
        <>
            <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden
                             transition-all duration-300 hover:shadow-lg">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>Imagen</TableHead><TableHead>Modelo</TableHead><TableHead>Marca</TableHead><TableHead>Tipo</TableHead>
                            <TableHead>Color</TableHead><TableHead>Precio</TableHead><TableHead>Stock</TableHead><TableHead>Mín.</TableHead>
                            <TableHead>Estado</TableHead><TableHead />
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
                                    <EmptyState icon={Package}
                                                title="Sin productos en inventario"
                                                description="Agrega el primer producto con el botón 'Nuevo producto'." />
                                </TableCell>
                            </TableRow>
                        ) : (
                            pagination.pageData.map(p => {
                                const lowStock = Number(p.stock) <= Number(p.nivel_minimo);
                                const estado = getEstadoProducto(p);
                                return (
                                    <TableRow key={p.id_producto} className={clsx(lowStock && 'bg-destructive/5 hover:bg-destructive/10')}>
                                        <TableCell>
                                            <div
                                                className="w-10"
                                                onMouseEnter={e => {
                                                    const url = getImagenEstandarizada(resolveImageUrl(p.imagen_url), 400);
                                                    if (!url) return;
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setHoverImg({
                                                        url,
                                                        top:  Math.max(8, rect.top - 104),
                                                        left: rect.right + 10,
                                                    });
                                                }}
                                                onMouseLeave={() => setHoverImg(null)}
                                            >
                                                {p.imagen_url ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => { const url = getImagenEstandarizada(resolveImageUrl(p.imagen_url), 800); if (url) setLightboxUrl(url); }}
                                                        className="block w-10 h-10 rounded-lg border border-border overflow-hidden
                                                                   hover:border-primary/50 hover:scale-105 transition-all cursor-zoom-in">
                                                        <img src={getImagenEstandarizada(resolveImageUrl(p.imagen_url), 200)!} alt={p.nombre_modelo}
                                                             className="w-full h-full object-cover" />
                                                    </button>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-muted border border-border
                                                                     flex items-center justify-center text-muted-foreground">
                                                        <Package size={15} />
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-foreground">{p.nombre_modelo}</TableCell>
                                        <TableCell className="text-muted-foreground">{p.marca}</TableCell>
                                        <TableCell className="text-muted-foreground">{p.tipo_calzado}</TableCell>
                                        <TableCell className="text-muted-foreground">{p.color}</TableCell>
                                        <TableCell className="font-mono text-primary">Bs. {Number(p.precio_venta).toFixed(2)}</TableCell>
                                        <TableCell className={clsx('font-mono font-medium', lowStock ? 'text-destructive' : 'text-foreground')}>
                                            {p.stock} {lowStock && <AlertTriangle size={11} className="inline ml-1 text-destructive" />}
                                        </TableCell>
                                        <TableCell className="font-mono text-muted-foreground">{p.nivel_minimo}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={clsx('font-medium', ESTADO_BADGE[estado])}>
                                                {estado}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {(canEdit || canDelete) && (
                                                <div className="flex gap-2">
                                                    {canEdit && (
                                                        <Button variant="ghost" size="icon" onClick={() => onEdit(p)}
                                                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                                                            <Edit2 size={14} />
                                                        </Button>
                                                    )}
                                                    {canDelete && (
                                                        <Button variant="ghost" size="icon" onClick={() => onDelete(p)}
                                                                className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10">
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
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
                    <div className="bg-popover border border-border rounded-xl p-2 shadow-modal">
                        <img src={hoverImg.url} alt="Vista previa" className="w-48 h-48 object-contain rounded-lg" />
                    </div>
                </div>
            )}

            {lightboxUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={() => setLightboxUrl(null)}>
                    <ProductImageZoom
                        src={lightboxUrl}
                        alt="Vista previa"
                        fit="contain"
                        className="w-[92vw] max-w-xl h-[70vh] rounded-xl shadow-2xl bg-card"
                    />
                </div>
            )}
        </>
    );
}

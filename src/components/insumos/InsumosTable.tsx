import { FlaskConical, Trash2, Edit2, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { TableSkeleton } from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import type { Insumo } from '@/types';
import {
    resolveImageUrl, getCategoriaBadgeClass, ESTADO_INSUMO_BADGE, getEstadoInsumo, capitalize,
} from './insumoHelpers';
import { getImagenEstandarizada } from '@/utils/cloudinary';

export function InsumosTable({
    insumos, isLoading, error, onRetry, canEdit, canDelete, onImageClick, onEdit, onDelete,
}: {
    insumos: Insumo[];
    isLoading: boolean;
    error?: string | null;
    onRetry?: () => void;
    canEdit: boolean;
    canDelete: boolean;
    onImageClick: (url: string | null) => void;
    onEdit: (insumo: Insumo) => void;
    onDelete: (insumo: Insumo) => void;
}) {
    return (
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
                ) : error && insumos.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={10}>
                            <EmptyState
                                icon={AlertTriangle}
                                title="No se pudo cargar la información"
                                description="Ocurrió un error al obtener los insumos. Intentá de nuevo."
                                actionLabel={onRetry ? 'Reintentar' : undefined}
                                onAction={onRetry}
                            />
                        </TableCell>
                    </TableRow>
                ) : insumos.length === 0 ? (
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
                    insumos.map(insumo => {
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
                                            onClick={() => onImageClick(getImagenEstandarizada(resolveImageUrl(insumo.imagen_url), 800))}
                                            className="block w-10 h-10 rounded-lg overflow-hidden border border-border
                                                       hover:border-primary/50 hover:scale-105 transition-all cursor-zoom-in">
                                            <img
                                                src={getImagenEstandarizada(resolveImageUrl(insumo.imagen_url), 200)!}
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
                                    <Badge variant="outline" className={clsx('font-medium', getCategoriaBadgeClass(insumo.categoria.id_categoria_insumo))}>
                                        {capitalize(insumo.categoria.nombre)}
                                    </Badge>
                                </TableCell>
                                <TableCell className={clsx(
                                    'font-mono font-semibold',
                                    stockBajo ? 'text-destructive' : 'text-foreground',
                                )}>
                                    {insumo.stock}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                                    {capitalize(insumo.unidad_medida.nombre)}
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
                                    <div className="flex gap-2">
                                        {canEdit && (
                                            <Button variant="ghost" size="icon" onClick={() => onEdit(insumo)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                                                <Edit2 size={14} />
                                            </Button>
                                        )}
                                        {canDelete && (
                                            <Button variant="ghost" size="icon" onClick={() => onDelete(insumo)}
                                                    className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 size={14} />
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
    );
}

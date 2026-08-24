import { FlaskConical, Trash2, Edit2 } from 'lucide-react';
import { clsx } from 'clsx';
import { TableSkeleton } from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import type { Insumo } from '@/types';
import {
    resolveImageUrl, CATEGORIA_LABEL, UNIDAD_LABEL, CATEGORIA_BADGE, ESTADO_INSUMO_BADGE, getEstadoInsumo,
} from './insumoHelpers';

export function InsumosTable({
    insumos, isLoading, canEdit, canDelete, onImageClick, onEdit, onDelete,
}: {
    insumos: Insumo[];
    isLoading: boolean;
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
                                            onClick={() => onImageClick(resolveImageUrl(insumo.imagen_url))}
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
                                            <Button variant="ghost" size="icon" onClick={() => onEdit(insumo)}
                                                    className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10">
                                                <Edit2 size={13} />
                                            </Button>
                                        )}
                                        {canDelete && (
                                            <Button variant="ghost" size="icon" onClick={() => onDelete(insumo)}
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
    );
}

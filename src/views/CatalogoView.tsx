import { useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCatalogoStore } from '@/stores/index';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/shared/Skeleton';

function formatPrecio(precio: string) {
    return `Bs. ${Number(precio).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CatalogoView() {
    const productos  = useCatalogoStore(s => s.productos);
    const isLoading  = useCatalogoStore(s => s.isLoading);
    const fetchAll   = useCatalogoStore(s => s.fetchAll);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-2xl font-semibold text-foreground">Catálogo</h1>
                <p className="text-sm text-muted-foreground mt-1">Explora los modelos disponibles de Nueva Tendencia.</p>
            </div>

            {isLoading && productos.length === 0 && (
                <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="border-border/50 bg-card/50 backdrop-blur overflow-hidden">
                            <Skeleton className="h-32 w-full rounded-none" />
                            <CardContent className="p-3 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                                <Skeleton className="h-4 w-16" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {!isLoading && productos.length === 0 && (
                <EmptyState
                    icon={ShoppingBag}
                    title="Aún no hay productos en el catálogo"
                    description="Vuelve más tarde para ver los modelos disponibles de Nueva Tendencia."
                />
            )}

            {productos.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                    {productos.map((producto, i) => (
                        <Card
                            key={`${producto.nombre}-${i}`}
                            className="border-border/50 bg-card/50 backdrop-blur overflow-hidden"
                        >
                            <div className="relative h-32 w-full bg-muted flex items-center justify-center">
                                {producto.imagen ? (
                                    <img
                                        src={producto.imagen}
                                        alt={producto.nombre}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                                )}
                                <span className={
                                    `absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-medium uppercase tracking-wider ${
                                        producto.disponible
                                            ? 'bg-secondary text-secondary-foreground border border-secondary'
                                            : 'bg-destructive/10 text-destructive border border-destructive/30'
                                    }`
                                }>
                                    {producto.disponible ? 'Disponible' : 'Sin stock'}
                                </span>
                            </div>
                            <CardContent className="p-3 space-y-1">
                                <p className="text-foreground font-semibold text-sm leading-tight truncate">
                                    {producto.nombre}
                                </p>
                                <p className="text-muted-foreground text-2xs line-clamp-2 min-h-[2em]">
                                    {producto.descripcion}
                                </p>
                                <p className="text-foreground font-bold text-sm pt-1">
                                    {formatPrecio(producto.precio)}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

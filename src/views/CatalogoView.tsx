import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCatalogoStore } from '@/stores/index';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/shared/Skeleton';
import Modal from '@/components/shared/Modal';
import ZoomImage from '@/components/shared/ZoomImage';
import AdvancedPagination, { PAGE_SIZES } from '@/components/shared/AdvancedPagination';
import type { PageSize } from '@/components/shared/AdvancedPagination';
import type { ProductoCatalogo } from '@/types';

const LS_KEY = 'catalogo-page-size';

function readPageSize(): PageSize {
    const saved = localStorage.getItem(LS_KEY);
    return (PAGE_SIZES as readonly number[]).includes(Number(saved))
        ? (Number(saved) as PageSize)
        : 10;
}

function formatPrecio(precio: string) {
    return `Bs. ${Number(precio).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function disponibilidadBadgeClass(disponible: boolean) {
    return `inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-medium uppercase tracking-wider ${
        disponible
            ? 'bg-secondary text-secondary-foreground border border-secondary'
            : 'bg-destructive/10 text-destructive border border-destructive/30'
    }`;
}

export default function CatalogoView() {
    const productos  = useCatalogoStore(s => s.productos);
    const isLoading  = useCatalogoStore(s => s.isLoading);
    const fetchAll   = useCatalogoStore(s => s.fetchAll);
    const [selected, setSelected] = useState<ProductoCatalogo | null>(null);
    const [page, setPage]         = useState(1);
    const [pageSize, setPageSize] = useState<PageSize>(readPageSize);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const totalPages = Math.max(1, Math.ceil(productos.length / pageSize));
    const paginated  = productos.slice((page - 1) * pageSize, page * pageSize);

    const handlePageSizeChange = (s: PageSize) => {
        localStorage.setItem(LS_KEY, String(s));
        setPageSize(s);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-2xl font-semibold text-foreground">Catálogo</h1>
                <p className="text-sm text-muted-foreground mt-1">Explora los modelos disponibles de Nueva Tendencia.</p>
            </div>

            {isLoading && productos.length === 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {paginated.map((producto, i) => (
                        <Card
                            key={`${producto.nombre}-${i}`}
                            onClick={() => setSelected(producto)}
                            tabIndex={0}
                            role="button"
                            aria-label={`Ver detalle de ${producto.nombre}`}
                            onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setSelected(producto);
                                }
                            }}
                            className="border-border/50 bg-card/50 backdrop-blur overflow-hidden cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                                <span className={`absolute top-2 right-2 ${disponibilidadBadgeClass(producto.disponible)}`}>
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

            {!isLoading && productos.length > 0 && (
                <AdvancedPagination
                    page={page}
                    totalPages={totalPages}
                    total={productos.length}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={handlePageSizeChange}
                    noun="productos"
                />
            )}

            <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.nombre ?? ''} size="lg">
                {selected && (
                    <div className="space-y-4">
                        <ZoomImage src={selected.imagen} alt={selected.nombre} />
                        <div className="flex items-center justify-between">
                            <span className={disponibilidadBadgeClass(selected.disponible)}>
                                {selected.disponible ? 'Disponible' : 'Sin stock'}
                            </span>
                            <p className="text-foreground font-bold text-lg">{formatPrecio(selected.precio)}</p>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{selected.descripcion}</p>
                    </div>
                )}
            </Modal>
        </div>
    );
}

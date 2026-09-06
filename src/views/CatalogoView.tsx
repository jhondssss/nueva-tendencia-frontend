import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCatalogoStore, useMisSolicitudesStore } from '@/stores/index';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EmptyState from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/shared/Skeleton';
import Modal from '@/components/shared/Modal';
import ProductImageZoom from '@/components/shared/ProductImageZoom';
import AdvancedPagination, { PAGE_SIZES } from '@/components/shared/AdvancedPagination';
import type { PageSize } from '@/components/shared/AdvancedPagination';
import TallaInfoBox, { defaultTallas } from '@/components/pedidos/TallaInfoBox';
import type { TallaItem } from '@/components/pedidos/TallaInfoBox';
import type { ProductoCatalogo } from '@/types';
import { getImagenEstandarizada } from '@/utils/cloudinary';

const LS_KEY = 'catalogo-page-size';
const hoy = new Date().toISOString().split('T')[0];

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
    const navigate = useNavigate();

    const productos  = useCatalogoStore(s => s.productos);
    const isLoading  = useCatalogoStore(s => s.isLoading);
    const error      = useCatalogoStore(s => s.error);
    const fetchAll   = useCatalogoStore(s => s.fetchAll);
    const crearSolicitud = useMisSolicitudesStore(s => s.create);

    const [selected, setSelected] = useState<ProductoCatalogo | null>(null);
    const [tallas, setTallas]     = useState<TallaItem[] | null>(null);
    const [fechaEntrega, setFechaEntrega] = useState('');
    const [comentario, setComentario]     = useState('');
    const [comentarioError, setComentarioError] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [page, setPage]         = useState(1);
    const [pageSize, setPageSize] = useState<PageSize>(readPageSize);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleOpen = (producto: ProductoCatalogo) => {
        setSelected(producto);
        setTallas(defaultTallas(producto.categoria));
        setFechaEntrega('');
        setComentario('');
        setComentarioError('');
    };

    const handleClose = () => {
        setSelected(null);
        setTallas(null);
        setFechaEntrega('');
        setComentario('');
        setComentarioError('');
    };

    const handleSolicitar = async () => {
        if (!selected) return;
        const tallasValidas = (tallas ?? []).filter(t => t.cantidad_pares > 0);
        if (tallasValidas.length === 0) {
            toast.error('Indica al menos un par en alguna talla');
            return;
        }
        if (comentario.length > 500) {
            setComentarioError('Máximo 500 caracteres');
            return;
        }
        setComentarioError('');
        setEnviando(true);
        try {
            await crearSolicitud({
                producto_id: selected.id_producto,
                categoria: selected.categoria,
                tallas: tallasValidas,
                comentario_cliente: comentario || undefined,
                fecha_entrega_deseada: fechaEntrega || undefined,
            });
        } catch {
            toast.error('No se pudo enviar la solicitud. Intenta nuevamente.');
            return;
        } finally {
            setEnviando(false);
        }
        handleClose();
        navigate('/mis-solicitudes');
    };

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

            {!isLoading && productos.length === 0 && error && (
                <EmptyState
                    icon={AlertTriangle}
                    title="No se pudo cargar la información"
                    description="Ocurrió un error al obtener el catálogo. Intentá de nuevo."
                    actionLabel="Reintentar"
                    onAction={() => fetchAll()}
                />
            )}

            {!isLoading && productos.length === 0 && !error && (
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
                            onClick={() => handleOpen(producto)}
                            tabIndex={0}
                            role="button"
                            aria-label={`Ver detalle de ${producto.nombre}`}
                            onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleOpen(producto);
                                }
                            }}
                            className="border-border/50 bg-card/50 backdrop-blur overflow-hidden cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            <div className="relative h-32 w-full bg-muted flex items-center justify-center">
                                {producto.imagen ? (
                                    <img
                                        src={getImagenEstandarizada(producto.imagen, 400)!}
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

            <Modal isOpen={!!selected} onClose={handleClose} title={selected?.nombre ?? ''} size="lg">
                {selected && (
                    <div className="space-y-4">
                        {selected.imagen ? (
                            <ProductImageZoom
                                src={getImagenEstandarizada(selected.imagen, 800)!}
                                alt={selected.nombre}
                                className="h-72 w-full rounded-lg bg-muted"
                            />
                        ) : (
                            <div className="h-72 w-full rounded-lg bg-muted flex items-center justify-center">
                                <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <span className={disponibilidadBadgeClass(selected.disponible)}>
                                {selected.disponible ? 'Disponible' : 'Sin stock'}
                            </span>
                            <p className="text-foreground font-bold text-lg">{formatPrecio(selected.precio)}</p>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{selected.descripcion}</p>

                        <div className="space-y-3 pt-2 border-t border-border">
                            <p className="label mb-0 pt-2">Cantidad de pares por talla</p>
                            <TallaInfoBox
                                categoria={selected.categoria}
                                editable
                                value={tallas ?? undefined}
                                onChange={setTallas}
                            />

                            <div>
                                <label className="label">Fecha de entrega deseada (opcional)</label>
                                <Input
                                    type="date"
                                    min={hoy}
                                    value={fechaEntrega}
                                    onChange={e => setFechaEntrega(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="label">Comentario (opcional)</label>
                                <textarea
                                    value={comentario}
                                    onChange={e => { setComentario(e.target.value); setComentarioError(''); }}
                                    rows={3}
                                    placeholder="Detalles adicionales sobre tu pedido..."
                                    className={`input h-auto resize-none ${comentarioError ? 'input-error' : ''}`}
                                />
                                {comentarioError && <p className="text-destructive text-xs mt-1">{comentarioError}</p>}
                            </div>

                            <div className="flex justify-end pt-1">
                                <Button
                                    type="button"
                                    disabled={!selected.disponible || enviando}
                                    onClick={handleSolicitar}
                                    className="hover:scale-[1.02] transition-transform"
                                >
                                    {enviando
                                        ? <><Loader2 size={14} className="animate-spin" /> Enviando...</>
                                        : 'Solicitar este pedido'}
                                </Button>
                            </div>
                            {!selected.disponible && (
                                <p className="text-xs text-muted-foreground text-right">
                                    Este producto no tiene stock disponible por el momento.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

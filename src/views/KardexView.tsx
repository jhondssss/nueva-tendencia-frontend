import { useState, useEffect, useMemo } from 'react';
import { ArrowLeftRight, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal, X, ExternalLink } from 'lucide-react';
import AdvancedPagination, { PAGE_SIZES } from '@/components/shared/AdvancedPagination';
import type { PageSize } from '@/components/shared/AdvancedPagination';
import SearchableSelect from '@/components/shared/SearchableSelect';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { kardexApi, insumoApi } from '@/api/services';
import type { KardexMovimiento, Insumo, TipoMovimiento, OrigenMovimiento } from '@/types';
import { useRole } from '@/hooks/useRole';
import { TableSkeleton } from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { clsx } from 'clsx';

// ─── Constants ────────────────────────────────────────────────────────────────

const MESES = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

const schema = z.object({
    insumoId: z.coerce.number({ error: 'Selecciona un insumo' }).min(1, 'Selecciona un insumo'),
    tipo:       z.enum(['entrada', 'salida', 'ajuste'], { error: 'Selecciona un tipo' }),
    cantidad:   z.coerce.number({ error: 'Cantidad requerida' }).min(1, 'Debe ser al menos 1'),
    motivo:     z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const TIPO_BADGE: Record<TipoMovimiento, string> = {
    entrada: 'bg-secondary/10 text-secondary border-secondary/30',
    salida:  'bg-destructive/10 text-destructive border-destructive/30',
    ajuste:  'bg-chart-3/10 text-chart-3 border-chart-3/30',
};

const TIPO_ICON: Record<TipoMovimiento, typeof ArrowDownCircle> = {
    entrada: ArrowDownCircle,
    salida:  ArrowUpCircle,
    ajuste:  SlidersHorizontal,
};

const LS_KEY = 'kardex-page-size';

function readPageSize(): PageSize {
    const saved = localStorage.getItem(LS_KEY);
    return (PAGE_SIZES as readonly number[]).includes(Number(saved))
        ? (Number(saved) as PageSize)
        : 10;
}

// ─── View ─────────────────────────────────────────────────────────────────────

export default function KardexView() {
    const { isAdmin } = useRole();

    const [movimientos, setMovimientos] = useState<KardexMovimiento[]>([]);
    const [insumos,     setInsumos]     = useState<Insumo[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [submitting,  setSubmitting]  = useState(false);

    // text filter
    const [filterProd,  setFilterProd]  = useState<string>('');

    // date + type filters
    const [filterAnio,  setFilterAnio]  = useState<number>(0);
    const [filterMes,   setFilterMes]   = useState<number>(0);
    const [filterTipo,  setFilterTipo]  = useState<'todos' | TipoMovimiento>('todos');
    const [filterOrigen, setFilterOrigen] = useState<'todos' | OrigenMovimiento>('todos');

    const [page,     setPage]     = useState(1);
    const [pageSize, setPageSize] = useState<PageSize>(readPageSize);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema) as Resolver<FormValues>,
        defaultValues: { insumoId: 0, tipo: 'entrada', cantidad: 1, motivo: '' },
    });

    const loadAll = async () => {
        setLoadingData(true);
        try {
            const [movFirst, insRes] = await Promise.all([
                kardexApi.getAll(1),
                insumoApi.getAll(),
            ]);
            let movs = movFirst.data.data;
            const { totalPages, limit } = movFirst.data;
            // El backend pagina /kardex (default limit) — hay que traer el resto de páginas
            // para no truncar el historial a solo la primera.
            if (totalPages > 1) {
                const rest = await Promise.all(
                    Array.from({ length: totalPages - 1 }, (_, i) => kardexApi.getAll(i + 2, limit)),
                );
                movs = movs.concat(...rest.map(r => r.data.data));
            }
            setMovimientos(movs.filter(m => m.insumo != null));
            setInsumos(insRes.data);
        } catch {
            toast.error('Error al cargar datos');
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        document.title = 'Kardex | NT';
        void loadAll();
    }, []);

    const onSubmit = async (values: FormValues) => {
        setSubmitting(true);
        try {
            await kardexApi.registrar({
                insumo_id: values.insumoId,
                tipo:     values.tipo,
                cantidad: values.cantidad,
                motivo:   values.motivo || undefined,
            });
            toast.success('Movimiento registrado');
            reset({ insumoId: 0, tipo: 'entrada', cantidad: 1, motivo: '' });
            await loadAll();
        } catch {
            toast.error('Error al registrar movimiento');
        } finally {
            setSubmitting(false);
        }
    };

    // Build year list dynamically from data + current year
    const years = useMemo(() => {
        const set = new Set(movimientos.map(m => new Date(m.fecha).getFullYear()));
        set.add(new Date().getFullYear());
        return Array.from(set).sort((a, b) => a - b);
    }, [movimientos]);

    const filtered = useMemo(() => {
        return movimientos.filter(m => {
            const nombre = m.producto?.nombre_modelo ?? m.insumo?.nombre ?? '';
            if (filterProd && !nombre.toLowerCase().includes(filterProd.toLowerCase())) return false;
            if (filterTipo !== 'todos' && m.tipo !== filterTipo) return false;
            if (filterOrigen !== 'todos' && (m.origen ?? 'manual') !== filterOrigen) return false;
            if (filterAnio !== 0 || filterMes !== 0) {
                const d = new Date(m.fecha);
                if (filterAnio !== 0 && d.getFullYear() !== filterAnio) return false;
                if (filterMes  !== 0 && d.getMonth() + 1 !== filterMes) return false;
            }
            return true;
        });
    }, [movimientos, filterProd, filterTipo, filterOrigen, filterAnio, filterMes]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

    const handlePageSizeChange = (s: PageSize) => {
        localStorage.setItem(LS_KEY, String(s));
        setPageSize(s);
    };

    // Reset to page 1 whenever filtered set changes
    const resetFilters = () => {
        setFilterProd('');
        setFilterAnio(0);
        setFilterMes(0);
        setFilterTipo('todos');
        setFilterOrigen('todos');
        setPage(1);
    };

    const hasActiveFilters = filterProd !== '' || filterAnio !== 0 || filterMes !== 0 || filterTipo !== 'todos' || filterOrigen !== 'todos';

    const handleFilterChange = (v: string) => { setFilterProd(v); setPage(1); };

    return (
        <div className="space-y-8 animate-fade-in">

            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title section-title">Kardex</h1>
                    <p className="page-subtitle">Movimientos de insumos</p>
                </div>
            </div>

            {/* ── Registro (admin only) ────────────────────────────────────────── */}
            {isAdmin && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-1 h-5 rounded-full bg-primary" />
                        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                            Registrar Movimiento
                        </h2>
                    </div>

                    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur p-5
                                    transition-all duration-200 hover:shadow-lg">
                        <form onSubmit={handleSubmit(onSubmit)}
                              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                            {/* Insumo */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Insumo</label>
                                <SearchableSelect
                                    className={errors.insumoId ? 'input-error' : ''}
                                    value={watch('insumoId') || undefined}
                                    onChange={id => setValue('insumoId', id ?? 0, { shouldValidate: true })}
                                    options={insumos.map(i => ({ id: i.id_insumo, label: `${i.nombre} — ${i.categoria.nombre}` }))}
                                    placeholder="Buscar insumo..." />
                                {errors.insumoId && (
                                    <span className="text-destructive text-xs">{errors.insumoId.message}</span>
                                )}
                            </div>

                            {/* Tipo */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                                <select {...register('tipo')} className="select">
                                    <option value="entrada">Entrada</option>
                                    <option value="salida">Salida</option>
                                    <option value="ajuste">Ajuste</option>
                                </select>
                                {errors.tipo && (
                                    <span className="text-destructive text-xs">{errors.tipo.message}</span>
                                )}
                            </div>

                            {/* Cantidad */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Cantidad</label>
                                <input {...register('cantidad')} type="number" min={1}
                                       className="input" placeholder="Ej: 10" />
                                {errors.cantidad && (
                                    <span className="text-destructive text-xs">{errors.cantidad.message}</span>
                                )}
                            </div>

                            {/* Motivo */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">Motivo (opcional)</label>
                                <input {...register('motivo')} type="text"
                                       className="input" placeholder="Ej: Compra proveedor" />
                            </div>

                            {/* Submit */}
                            <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-1">
                                <Button type="submit" disabled={submitting} className="hover:scale-[1.02] transition-transform">
                                    {submitting ? 'Registrando...' : 'Registrar movimiento'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </section>
            )}

            {/* ── Historial ───────────────────────────────────────────────────── */}
            <section className="space-y-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-1 h-5 rounded-full bg-secondary" />
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                        Historial de Movimientos
                    </h2>
                    {!loadingData && (
                        <span className="text-xs text-muted-foreground/70">
                            ({filtered.length} {filtered.length === 1 ? 'registro' : 'registros'})
                        </span>
                    )}
                </div>

                {/* ── Barra de filtros ───────────────────────────────────────── */}
                <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur">
                    {/* Año */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Año</label>
                        <select
                            value={filterAnio}
                            onChange={e => { setFilterAnio(Number(e.target.value)); setPage(1); }}
                            className="select w-28"
                        >
                            <option value={0}>Todos</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    {/* Mes */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Mes</label>
                        <select
                            value={filterMes}
                            onChange={e => { setFilterMes(Number(e.target.value)); setPage(1); }}
                            className="select w-36"
                        >
                            <option value={0}>Todos</option>
                            {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                        </select>
                    </div>

                    {/* Tipo */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                        <select
                            value={filterTipo}
                            onChange={e => { setFilterTipo(e.target.value as typeof filterTipo); setPage(1); }}
                            className="select w-32"
                        >
                            <option value="todos">Todos</option>
                            <option value="entrada">Entrada</option>
                            <option value="salida">Salida</option>
                            <option value="ajuste">Ajuste</option>
                        </select>
                    </div>

                    {/* Origen */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Origen</label>
                        <select
                            value={filterOrigen}
                            onChange={e => { setFilterOrigen(e.target.value as typeof filterOrigen); setPage(1); }}
                            className="select w-32"
                        >
                            <option value="todos">Todos</option>
                            <option value="manual">Manual</option>
                            <option value="automatico">Automático</option>
                        </select>
                    </div>

                    {/* Nombre */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Nombre</label>
                        <input
                            type="text"
                            value={filterProd}
                            onChange={e => handleFilterChange(e.target.value)}
                            placeholder="Filtrar por nombre..."
                            className="input w-52 text-sm"
                        />
                    </div>

                    {/* Limpiar */}
                    {hasActiveFilters && (
                        <Button variant="outline" onClick={resetFilters} className="h-9 self-end text-xs">
                            <X size={12} />
                            Limpiar filtros
                        </Button>
                    )}
                </div>

                <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden
                                transition-all duration-300 hover:shadow-lg">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Fecha</TableHead>
                                <TableHead>Producto</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead className="text-right">Cantidad</TableHead>
                                <TableHead className="text-right">Stock ant.</TableHead>
                                <TableHead className="text-right">Stock nuevo</TableHead>
                                <TableHead>Motivo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingData ? (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={7}><TableSkeleton rows={6} /></TableCell>
                                </TableRow>
                            ) : paginated.length === 0 ? (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={7}>
                                        <EmptyState
                                            icon={ArrowLeftRight}
                                            title="Sin movimientos"
                                            description={hasActiveFilters ? 'Ningún movimiento coincide con los filtros aplicados.' : 'Los movimientos de inventario aparecerán aquí.'}
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginated.map(m => {
                                    const TipoIcon = TIPO_ICON[m.tipo];
                                    return (
                                        <TableRow key={m.id_movimiento}>
                                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                                {new Date(m.fecha).toLocaleDateString('es-HN', {
                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm font-medium text-foreground leading-tight">
                                                    {m.producto?.nombre_modelo ?? m.insumo?.nombre ?? 'Sin referencia'}
                                                </p>
                                                <p className="text-2xs text-muted-foreground">
                                                    {m.producto?.marca ?? (m.insumo ? 'Insumo' : '')}
                                                </p>
                                                {m.pedido && (
                                                    m.pedido.token_seguimiento ? (
                                                        <a
                                                            href={`/seguimiento/token/${m.pedido.token_seguimiento}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-0.5 text-2xs text-primary hover:underline"
                                                        >
                                                            Pedido #{m.pedido.id_pedido} <ExternalLink size={10} />
                                                        </a>
                                                    ) : (
                                                        <span className="text-2xs text-muted-foreground/70">
                                                            Pedido #{m.pedido.id_pedido}
                                                        </span>
                                                    )
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={clsx('font-medium gap-1', TIPO_BADGE[m.tipo])}>
                                                    <TipoIcon size={11} />
                                                    {m.tipo}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-foreground">
                                                {m.cantidad}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground text-sm">
                                                {m.stock_anterior}
                                            </TableCell>
                                            <TableCell className="text-right text-foreground font-medium text-sm">
                                                {m.stock_nuevo}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                                                {m.motivo ?? '—'}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {!loadingData && (
                        <AdvancedPagination
                            page={page}
                            totalPages={totalPages}
                            total={filtered.length}
                            pageSize={pageSize}
                            onPageChange={setPage}
                            onPageSizeChange={handlePageSizeChange}
                            noun="movimientos"
                        />
                    )}
                </div>
            </section>

        </div>
    );
}

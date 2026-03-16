import { useState, useEffect, useMemo } from 'react';
import { ArrowLeftRight, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal, X } from 'lucide-react';
import AdvancedPagination, { PAGE_SIZES } from '@/components/shared/AdvancedPagination';
import type { PageSize } from '@/components/shared/AdvancedPagination';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { kardexApi, productoApi } from '@/api/services';
import type { KardexMovimiento, Producto, TipoMovimiento } from '@/types';
import { useRole } from '@/hooks/useRole';
import PageLoader from '@/components/shared/PageLoader';
import EmptyState from '@/components/shared/EmptyState';
import { clsx } from 'clsx';

// ─── Constants ────────────────────────────────────────────────────────────────

const MESES = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

const schema = z.object({
    productoId: z.coerce.number({ error: 'Selecciona un producto' }).min(1, 'Selecciona un producto'),
    tipo:       z.enum(['entrada', 'salida', 'ajuste'], { error: 'Selecciona un tipo' }),
    cantidad:   z.coerce.number({ error: 'Cantidad requerida' }).min(1, 'Debe ser al menos 1'),
    motivo:     z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const TIPO_BADGE: Record<TipoMovimiento, string> = {
    entrada: 'bg-green-100 text-green-700 border border-green-200',
    salida:  'bg-red-100   text-red-700   border border-red-200',
    ajuste:  'bg-blue-100  text-blue-700  border border-blue-200',
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
    const [productos,   setProductos]   = useState<Producto[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [submitting,  setSubmitting]  = useState(false);

    // text filter
    const [filterProd,  setFilterProd]  = useState<string>('');

    // date + type filters
    const [filterAnio,  setFilterAnio]  = useState<number>(0);
    const [filterMes,   setFilterMes]   = useState<number>(0);
    const [filterTipo,  setFilterTipo]  = useState<'todos' | TipoMovimiento>('todos');

    const [page,     setPage]     = useState(1);
    const [pageSize, setPageSize] = useState<PageSize>(readPageSize);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema) as Resolver<FormValues>,
        defaultValues: { productoId: 0, tipo: 'entrada', cantidad: 1, motivo: '' },
    });

    const loadAll = async () => {
        setLoadingData(true);
        try {
            const [movRes, prodRes] = await Promise.all([
                kardexApi.getAll(),
                productoApi.getAll(),
            ]);
            setMovimientos(movRes.data);
            setProductos(prodRes.data);
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
                productoId: values.productoId,
                tipo:       values.tipo,
                cantidad:   values.cantidad,
                motivo:     values.motivo || undefined,
            });
            toast.success('Movimiento registrado');
            reset({ productoId: 0, tipo: 'entrada', cantidad: 1, motivo: '' });
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
            if (filterAnio !== 0 || filterMes !== 0) {
                const d = new Date(m.fecha);
                if (filterAnio !== 0 && d.getFullYear() !== filterAnio) return false;
                if (filterMes  !== 0 && d.getMonth() + 1 !== filterMes) return false;
            }
            return true;
        });
    }, [movimientos, filterProd, filterTipo, filterAnio, filterMes]);

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
        setPage(1);
    };

    const hasActiveFilters = filterProd !== '' || filterAnio !== 0 || filterMes !== 0 || filterTipo !== 'todos';

    const handleFilterChange = (v: string) => { setFilterProd(v); setPage(1); };

    return (
        <div className="space-y-8 animate-fade-in">

            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Kardex</h1>
                    <p className="page-subtitle">Movimientos de inventario</p>
                </div>
            </div>

            {/* ── Registro (admin only) ────────────────────────────────────────── */}
            {isAdmin && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-1 h-5 rounded-full bg-dorado-500" />
                        <h2 className="text-xs font-semibold text-cafe-700 uppercase tracking-widest">
                            Registrar Movimiento
                        </h2>
                    </div>

                    <div className="card p-5">
                        <form onSubmit={handleSubmit(onSubmit)}
                              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                            {/* Producto */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-cafe-700">Producto</label>
                                <select {...register('productoId')} className="select">
                                    <option value={0}>Selecciona un producto</option>
                                    {productos.map(p => (
                                        <option key={p.id_producto} value={p.id_producto}>
                                            {p.nombre_modelo} — {p.marca}
                                        </option>
                                    ))}
                                </select>
                                {errors.productoId && (
                                    <span className="text-red-500 text-xs">{errors.productoId.message}</span>
                                )}
                            </div>

                            {/* Tipo */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-cafe-700">Tipo</label>
                                <select {...register('tipo')} className="select">
                                    <option value="entrada">Entrada</option>
                                    <option value="salida">Salida</option>
                                    <option value="ajuste">Ajuste</option>
                                </select>
                                {errors.tipo && (
                                    <span className="text-red-500 text-xs">{errors.tipo.message}</span>
                                )}
                            </div>

                            {/* Cantidad */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-cafe-700">Cantidad</label>
                                <input {...register('cantidad')} type="number" min={1}
                                       className="input" placeholder="Ej: 10" />
                                {errors.cantidad && (
                                    <span className="text-red-500 text-xs">{errors.cantidad.message}</span>
                                )}
                            </div>

                            {/* Motivo */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-cafe-700">Motivo (opcional)</label>
                                <input {...register('motivo')} type="text"
                                       className="input" placeholder="Ej: Compra proveedor" />
                            </div>

                            {/* Submit */}
                            <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-1">
                                <button type="submit" disabled={submitting} className="btn-primary">
                                    {submitting ? 'Registrando...' : 'Registrar movimiento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            )}

            {/* ── Historial ───────────────────────────────────────────────────── */}
            <section className="space-y-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-1 h-5 rounded-full bg-cafe-500" />
                    <h2 className="text-xs font-semibold text-cafe-700 uppercase tracking-widest">
                        Historial de Movimientos
                    </h2>
                    {!loadingData && (
                        <span className="text-xs text-cafe-400">
                            ({filtered.length} {filtered.length === 1 ? 'registro' : 'registros'})
                        </span>
                    )}
                </div>

                {/* ── Barra de filtros ───────────────────────────────────────── */}
                <div className="flex flex-wrap items-end gap-3 p-4 bg-crema-50 border border-surface-border rounded-xl">
                    {/* Año */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-cafe-700">Año</label>
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
                        <label className="text-xs font-medium text-cafe-700">Mes</label>
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
                        <label className="text-xs font-medium text-cafe-700">Tipo</label>
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

                    {/* Nombre */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-cafe-700">Nombre</label>
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
                        <button
                            onClick={resetFilters}
                            className="flex items-center gap-1.5 btn-secondary text-xs h-9 self-end"
                        >
                            <X size={12} />
                            Limpiar filtros
                        </button>
                    )}
                </div>

                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Producto</th>
                                    <th>Tipo</th>
                                    <th className="text-right">Cantidad</th>
                                    <th className="text-right">Stock ant.</th>
                                    <th className="text-right">Stock nuevo</th>
                                    <th>Motivo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingData ? (
                                    <tr>
                                        <td colSpan={7}><PageLoader /></td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={7}>
                                            <EmptyState
                                                icon={ArrowLeftRight}
                                                title="Sin movimientos"
                                                description={hasActiveFilters ? 'Ningún movimiento coincide con los filtros aplicados.' : 'Los movimientos de inventario aparecerán aquí.'}
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map(m => {
                                        const TipoIcon = TIPO_ICON[m.tipo];
                                        return (
                                            <tr key={m.id_movimiento}>
                                                <td className="whitespace-nowrap text-xs text-cafe-500">
                                                    {new Date(m.fecha).toLocaleDateString('es-HN', {
                                                        day: '2-digit', month: 'short', year: 'numeric',
                                                    })}
                                                </td>
                                                <td>
                                                    <p className="text-sm font-medium text-cafe-900 leading-tight">
                                                        {m.producto?.nombre_modelo ?? m.insumo?.nombre ?? 'Sin referencia'}
                                                    </p>
                                                    <p className="text-2xs text-cafe-400">
                                                        {m.producto?.marca ?? (m.insumo ? 'Insumo' : '')}
                                                    </p>
                                                </td>
                                                <td>
                                                    <span className={clsx(
                                                        'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                                                        TIPO_BADGE[m.tipo],
                                                    )}>
                                                        <TipoIcon size={11} />
                                                        {m.tipo}
                                                    </span>
                                                </td>
                                                <td className="text-right font-semibold text-cafe-900">
                                                    {m.cantidad}
                                                </td>
                                                <td className="text-right text-cafe-500 text-sm">
                                                    {m.stock_anterior}
                                                </td>
                                                <td className="text-right text-cafe-900 font-medium text-sm">
                                                    {m.stock_nuevo}
                                                </td>
                                                <td className="text-xs text-cafe-500 max-w-[160px] truncate">
                                                    {m.motivo ?? '—'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

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

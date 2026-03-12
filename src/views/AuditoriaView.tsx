import { useState, useEffect, useMemo } from 'react';
import { ClipboardList, Search, Archive, X, AlertTriangle } from 'lucide-react';
import AdvancedPagination, { PAGE_SIZES } from '@/components/shared/AdvancedPagination';
import type { PageSize } from '@/components/shared/AdvancedPagination';
import toast from 'react-hot-toast';
import { auditoriaApi } from '@/api/services';
import type { AuditoriaLog, ModuloAuditoria, AccionAuditoria } from '@/types';
import { useRole } from '@/hooks/useRole';
import EmptyState from '@/components/shared/EmptyState';
import { clsx } from 'clsx';

// ─── Constants ────────────────────────────────────────────────────────────────

const MESES = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

function buildYears(): number[] {
    const current = new Date().getFullYear();
    const years: number[] = [];
    for (let y = 2024; y <= current; y++) years.push(y);
    return years;
}
const YEARS = buildYears();

// ─── Badge configs ─────────────────────────────────────────────────────────────

const MODULO_BADGE: Record<ModuloAuditoria, string> = {
    auth:      'bg-purple-100 text-purple-700 border border-purple-200',
    pedidos:   'bg-blue-100   text-blue-700   border border-blue-200',
    clientes:  'bg-green-100  text-green-700  border border-green-200',
    productos: 'bg-orange-100 text-orange-700 border border-orange-200',
};

const ACCION_BADGE: Record<AccionAuditoria, string> = {
    CREATE: 'bg-green-100  text-green-700  border border-green-200',
    UPDATE: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    DELETE: 'bg-red-100    text-red-700    border border-red-200',
    LOGIN:  'bg-purple-100 text-purple-700 border border-purple-200',
};

// ─── Filter types ──────────────────────────────────────────────────────────────

type ModuloFilter = 'todos' | ModuloAuditoria;
type AccionFilter = 'todos' | AccionAuditoria;

const MODULO_PILLS: { value: ModuloFilter; label: string }[] = [
    { value: 'todos',     label: 'Todos'     },
    { value: 'auth',      label: 'Auth'      },
    { value: 'pedidos',   label: 'Pedidos'   },
    { value: 'clientes',  label: 'Clientes'  },
    { value: 'productos', label: 'Productos' },
];

const ACCIONES: AccionAuditoria[] = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN'];

const LS_KEY = 'auditoria-page-size';

function readPageSize(): PageSize {
    const saved = localStorage.getItem(LS_KEY);
    return (PAGE_SIZES as readonly number[]).includes(Number(saved))
        ? (Number(saved) as PageSize)
        : 25;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatFecha(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function generateCsv(logs: AuditoriaLog[]): string {
    const header = 'Fecha,Usuario,Módulo,Acción,Descripción';
    const rows = logs.map(l => [
        formatFecha(l.fecha),
        l.usuario?.email ?? 'Sistema',
        l.modulo,
        l.accion,
        `"${l.descripcion.replace(/"/g, '""')}"`,
    ].join(','));
    return [header, ...rows].join('\n');
}

// ─── Skeleton rows ──────────────────────────────────────────────────────────────

function SkeletonRows() {
    return (
        <>
            {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                    <td><div className="h-3.5 bg-crema-dark rounded w-28" /></td>
                    <td><div className="h-3.5 bg-crema-dark rounded w-32" /></td>
                    <td><div className="h-5 bg-crema-dark rounded-full w-20" /></td>
                    <td><div className="h-5 bg-crema-dark rounded-full w-16" /></td>
                    <td><div className="h-3.5 bg-crema-dark rounded w-48" /></td>
                </tr>
            ))}
        </>
    );
}

// ─── View ──────────────────────────────────────────────────────────────────────

export default function AuditoriaView() {
    const { isAdmin } = useRole();

    const [logs,     setLogs]     = useState<AuditoriaLog[]>([]);
    const [loading,  setLoading]  = useState(true);
    const [modulo,   setModulo]   = useState<ModuloFilter>('todos');
    const [search,   setSearch]   = useState('');
    const [page,     setPage]     = useState(1);
    const [pageSize, setPageSize] = useState<PageSize>(readPageSize);

    // date + action filters
    const [filterAnio,   setFilterAnio]   = useState<number>(0);
    const [filterMes,    setFilterMes]    = useState<number>(0);
    const [filterAccion, setFilterAccion] = useState<AccionFilter>('todos');

    // archive modal
    const [archiveOpen, setArchiveOpen] = useState(false);
    const [archAnio,    setArchAnio]    = useState<number>(new Date().getFullYear());
    const [archMes,     setArchMes]     = useState<number>(new Date().getMonth() + 1);
    const [archiving,   setArchiving]   = useState(false);

    useEffect(() => {
        document.title = 'Auditoría | NT';
    }, []);

    useEffect(() => {
        if (!isAdmin) return;
        setLoading(true);
        const call = modulo === 'todos'
            ? auditoriaApi.getAll()
            : auditoriaApi.getByModulo(modulo);
        call
            .then(res => setLogs(res.data))
            .catch(() => toast.error('Error al cargar el log de auditoría'))
            .finally(() => setLoading(false));
    }, [isAdmin, modulo]);

    // Years present in data
    const years = useMemo(() => {
        const set = new Set(logs.map(l => new Date(l.fecha).getFullYear()));
        set.add(new Date().getFullYear());
        return Array.from(set).sort((a, b) => a - b);
    }, [logs]);

    const filtered = useMemo(() => {
        return logs.filter(l => {
            if (search.trim() && !l.descripcion.toLowerCase().includes(search.toLowerCase())) return false;
            if (filterAccion !== 'todos' && l.accion !== filterAccion) return false;
            if (filterAnio !== 0 || filterMes !== 0) {
                const d = new Date(l.fecha);
                if (filterAnio !== 0 && d.getFullYear() !== filterAnio) return false;
                if (filterMes  !== 0 && d.getMonth() + 1 !== filterMes) return false;
            }
            return true;
        });
    }, [logs, search, filterAccion, filterAnio, filterMes]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

    const handlePageSizeChange = (s: PageSize) => {
        localStorage.setItem(LS_KEY, String(s));
        setPageSize(s);
    };

    const hasActiveFilters = search !== '' || filterAccion !== 'todos' || filterAnio !== 0 || filterMes !== 0;

    const handleModulo  = (v: ModuloFilter) => { setModulo(v); setSearch(''); setPage(1); };
    const handleSearch  = (v: string)       => { setSearch(v); setPage(1); };

    const resetFilters = () => {
        setSearch('');
        setFilterAccion('todos');
        setFilterAnio(0);
        setFilterMes(0);
        setPage(1);
    };

    const handleArchivar = async () => {
        setArchiving(true);
        try {
            const before  = `${archAnio}-${String(archMes).padStart(2, '0')}`;
            const cutoff  = new Date(archAnio, archMes - 1, 1);
            const toArchive = logs.filter(l => new Date(l.fecha) < cutoff);

            if (toArchive.length === 0) {
                toast.error('No hay registros anteriores a esa fecha');
                setArchiving(false);
                return;
            }

            // Download CSV first
            const csv  = generateCsv(toArchive);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `auditoria-hasta-${before}.csv`;
            a.click();
            URL.revokeObjectURL(url);

            // Then delete from backend
            await auditoriaApi.limpiar(before);
            toast.success(`${toArchive.length} registros archivados y eliminados`);
            setArchiveOpen(false);

            // Reload
            const call = modulo === 'todos' ? auditoriaApi.getAll() : auditoriaApi.getByModulo(modulo);
            const res  = await call;
            setLogs(res.data);
        } catch {
            toast.error('Error al archivar registros');
        } finally {
            setArchiving(false);
        }
    };

    // ── Access guard ────────────────────────────────────────────────────────────
    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-64">
                <EmptyState
                    icon={ClipboardList}
                    title="Acceso restringido"
                    description="Solo los administradores pueden ver el log de auditoría."
                />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">

            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Log de Auditoría</h1>
                    <p className="page-subtitle">Registro de todas las acciones del sistema</p>
                </div>
                <button
                    onClick={() => setArchiveOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cafe-300 bg-cafe-50 text-cafe-700 text-sm font-medium hover:bg-cafe-100 transition-colors"
                >
                    <Archive size={15} />
                    Archivar y limpiar
                </button>
            </div>

            {/* ── SECCIÓN 1 — Filtros ─────────────────────────────────────────── */}
            <section className="space-y-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-1 h-5 rounded-full bg-dorado-500" />
                    <h2 className="text-xs font-semibold text-cafe-700 uppercase tracking-widest">
                        Filtros
                    </h2>
                </div>

                {/* Module pills */}
                <div className="flex flex-wrap gap-1.5">
                    {MODULO_PILLS.map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => handleModulo(value)}
                            className={clsx(
                                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                                modulo === value
                                    ? 'bg-cafe-800 text-white border-cafe-800'
                                    : 'bg-white text-cafe-600 border-surface-border hover:border-cafe-400 hover:text-cafe-900',
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Date + action + search row */}
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

                    {/* Acción */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-cafe-700">Acción</label>
                        <select
                            value={filterAccion}
                            onChange={e => { setFilterAccion(e.target.value as AccionFilter); setPage(1); }}
                            className="select w-32"
                        >
                            <option value="todos">Todas</option>
                            {ACCIONES.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>

                    {/* Search */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-cafe-700">Descripción</label>
                        <div className="relative">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cafe-400 pointer-events-none" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => handleSearch(e.target.value)}
                                placeholder="Buscar..."
                                className="input pl-8 w-52 text-sm"
                            />
                        </div>
                    </div>

                    {/* Clear */}
                    {hasActiveFilters && (
                        <button
                            onClick={resetFilters}
                            className="flex items-center gap-1.5 btn-secondary text-xs h-9 self-end"
                        >
                            <X size={12} />
                            Limpiar
                        </button>
                    )}
                </div>
            </section>

            {/* ── SECCIÓN 2 — Tabla ───────────────────────────────────────────── */}
            <section className="space-y-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-1 h-5 rounded-full bg-cafe-500" />
                    <h2 className="text-xs font-semibold text-cafe-700 uppercase tracking-widest">
                        Registros
                    </h2>
                    {!loading && (
                        <span className="ml-1 text-xs text-cafe-400">
                            ({filtered.length} {filtered.length === 1 ? 'entrada' : 'entradas'})
                        </span>
                    )}
                </div>

                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    <th>Fecha / Hora</th>
                                    <th>Usuario</th>
                                    <th>Módulo</th>
                                    <th>Acción</th>
                                    <th>Descripción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <SkeletonRows />
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={5}>
                                            <EmptyState
                                                icon={ClipboardList}
                                                title="Sin registros"
                                                description="No se encontraron entradas para los filtros aplicados."
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map(log => (
                                        <tr key={log.id}>
                                            <td className="whitespace-nowrap text-xs text-cafe-500 tabular-nums">
                                                {formatFecha(log.fecha)}
                                            </td>
                                            <td className="text-sm font-medium text-cafe-800">
                                                {log.usuario?.email ?? 'Sistema'}
                                            </td>
                                            <td>
                                                <span className={clsx(
                                                    'inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize',
                                                    MODULO_BADGE[log.modulo] ?? 'bg-gray-100 text-gray-600 border border-gray-200',
                                                )}>
                                                    {log.modulo}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={clsx(
                                                    'inline-block text-xs font-semibold px-2 py-0.5 rounded-full',
                                                    ACCION_BADGE[log.accion] ?? 'bg-gray-100 text-gray-600 border border-gray-200',
                                                )}>
                                                    {log.accion}
                                                </span>
                                            </td>
                                            <td className="text-sm text-cafe-700 max-w-xs truncate">
                                                {log.descripcion}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && (
                        <AdvancedPagination
                            page={page}
                            totalPages={totalPages}
                            total={filtered.length}
                            pageSize={pageSize}
                            onPageChange={setPage}
                            onPageSizeChange={handlePageSizeChange}
                            noun="registros"
                        />
                    )}
                </div>
            </section>

            {/* ── Modal: Archivar y limpiar ────────────────────────────────────── */}
            {archiveOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="card w-full max-w-md p-6 space-y-5">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-amber-100 text-amber-600 shrink-0">
                                <AlertTriangle size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-cafe-900">Archivar y limpiar</h3>
                                <p className="text-sm text-cafe-600 mt-1">
                                    Se exportará un CSV y se eliminarán todos los registros <strong>anteriores a</strong> la fecha seleccionada.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="flex flex-col gap-1 flex-1">
                                <label className="text-xs font-medium text-cafe-700">Mes</label>
                                <select
                                    value={archMes}
                                    onChange={e => setArchMes(Number(e.target.value))}
                                    className="select"
                                >
                                    {MESES.map((m, i) => (
                                        <option key={i + 1} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1 flex-1">
                                <label className="text-xs font-medium text-cafe-700">Año</label>
                                <select
                                    value={archAnio}
                                    onChange={e => setArchAnio(Number(e.target.value))}
                                    className="select"
                                >
                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <span className="shrink-0 mt-0.5">⚠️</span>
                            <span>
                                Esta acción <strong>no se puede deshacer</strong>. El archivo CSV se descargará automáticamente antes de eliminar.
                            </span>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                onClick={() => setArchiveOpen(false)}
                                disabled={archiving}
                                className="btn-secondary"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleArchivar}
                                disabled={archiving}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                <Archive size={14} />
                                {archiving ? 'Archivando...' : 'Exportar y eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

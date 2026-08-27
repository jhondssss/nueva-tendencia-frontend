import { useState, useEffect, useMemo } from 'react';
import { ClipboardList, Search, Archive, X, AlertTriangle, FileSpreadsheet, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AdvancedPagination, { PAGE_SIZES } from '@/components/shared/AdvancedPagination';
import type { PageSize } from '@/components/shared/AdvancedPagination';
import toast from 'react-hot-toast';
import { auditoriaApi } from '@/api/services';
import type { AuditoriaLog, ModuloAuditoria, AccionAuditoria } from '@/types';
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

function buildYears(): number[] {
    const current = new Date().getFullYear();
    const years: number[] = [];
    for (let y = 2024; y <= current; y++) years.push(y);
    return years;
}
const YEARS = buildYears();

// ─── Badge configs (tokens semánticos) ─────────────────────────────────────────

const MODULO_BADGE: Record<ModuloAuditoria, string> = {
    auth:      'bg-chart-4/10      text-chart-4      border-chart-4/30',
    pedidos:   'bg-primary/10      text-primary      border-primary/30',
    clientes:  'bg-secondary/10    text-secondary    border-secondary/30',
    productos: 'bg-chart-3/10      text-chart-3      border-chart-3/30',
};

const ACCION_BADGE: Record<AccionAuditoria, string> = {
    CREATE: 'bg-secondary/10    text-secondary    border-secondary/30',
    UPDATE: 'bg-chart-3/10      text-chart-3      border-chart-3/30',
    DELETE: 'bg-destructive/10  text-destructive  border-destructive/30',
    LOGIN:  'bg-chart-1/10      text-chart-1      border-chart-1/30',
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

const EXPORT_HEADERS = ['Fecha / Hora', 'Usuario', 'Módulo', 'Acción', 'Descripción'];

function exportFilename(ext: string): string {
    const now  = new Date();
    const pad  = (n: number) => String(n).padStart(2, '0');
    return `auditoria-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}.${ext}`;
}

function exportarExcel(logs: AuditoriaLog[]): void {
    const rows = logs.map(l => ({
        [EXPORT_HEADERS[0]]: formatFecha(l.fecha),
        [EXPORT_HEADERS[1]]: l.usuario?.email ?? 'Sistema',
        [EXPORT_HEADERS[2]]: l.modulo,
        [EXPORT_HEADERS[3]]: l.accion,
        [EXPORT_HEADERS[4]]: l.descripcion,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Auditoría');
    XLSX.writeFile(wb, exportFilename('xlsx'));
}

function exportarPdf(logs: AuditoriaLog[]): void {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('Log de Auditoría', 14, 15);
    autoTable(doc, {
        startY: 20,
        head: [EXPORT_HEADERS],
        body: logs.map(l => [
            formatFecha(l.fecha), l.usuario?.email ?? 'Sistema', l.modulo, l.accion, l.descripcion,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [63, 44, 33] },
    });
    doc.save(exportFilename('pdf'));
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

    const handleExportarExcel = () => {
        if (filtered.length === 0) { toast.error('No hay registros para exportar'); return; }
        try {
            exportarExcel(filtered);
            toast.success('Excel exportado');
        } catch {
            toast.error('Error al exportar el Excel');
        }
    };

    const handleExportarPdf = () => {
        if (filtered.length === 0) { toast.error('No hay registros para exportar'); return; }
        try {
            exportarPdf(filtered);
            toast.success('PDF exportado');
        } catch {
            toast.error('Error al exportar el PDF');
        }
    };

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
                    <h1 className="page-title section-title">Log de Auditoría</h1>
                    <p className="page-subtitle">Registro de todas las acciones del sistema</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleExportarExcel} disabled={filtered.length === 0}>
                        <FileSpreadsheet size={15} />
                        Exportar Excel
                    </Button>
                    <Button variant="outline" onClick={handleExportarPdf} disabled={filtered.length === 0}>
                        <FileDown size={15} />
                        Exportar PDF
                    </Button>
                    <Button variant="outline" onClick={() => setArchiveOpen(true)}>
                        <Archive size={15} />
                        Archivar y limpiar
                    </Button>
                </div>
            </div>

            {/* ── SECCIÓN 1 — Filtros ─────────────────────────────────────────── */}
            <section className="space-y-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-1 h-5 rounded-full bg-primary" />
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
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
                                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
                                modulo === value
                                    ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                                    : 'bg-card/50 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground hover:scale-[1.02]',
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Date + action + search row */}
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

                    {/* Acción */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Acción</label>
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
                        <label className="text-xs font-medium text-muted-foreground">Descripción</label>
                        <div className="relative">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
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
                        <Button variant="outline" onClick={resetFilters} className="h-9 self-end text-xs">
                            <X size={12} />
                            Limpiar
                        </Button>
                    )}
                </div>
            </section>

            {/* ── SECCIÓN 2 — Tabla ───────────────────────────────────────────── */}
            <section className="space-y-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-1 h-5 rounded-full bg-secondary" />
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                        Registros
                    </h2>
                    {!loading && (
                        <span className="ml-1 text-xs text-muted-foreground/70">
                            ({filtered.length} {filtered.length === 1 ? 'entrada' : 'entradas'})
                        </span>
                    )}
                </div>

                <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden
                                transition-all duration-300 hover:shadow-lg">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Fecha / Hora</TableHead>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Módulo</TableHead>
                                <TableHead>Acción</TableHead>
                                <TableHead>Descripción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={5}><TableSkeleton rows={8} /></TableCell>
                                </TableRow>
                            ) : paginated.length === 0 ? (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={5}>
                                        <EmptyState
                                            icon={ClipboardList}
                                            title="Sin registros"
                                            description="No se encontraron entradas para los filtros aplicados."
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginated.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                                            {formatFecha(log.fecha)}
                                        </TableCell>
                                        <TableCell className="text-sm font-medium text-foreground">
                                            {log.usuario?.email ?? 'Sistema'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={clsx('font-medium capitalize', MODULO_BADGE[log.modulo] ?? 'bg-muted text-muted-foreground border-border')}>
                                                {log.modulo}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={clsx('font-semibold', ACCION_BADGE[log.accion] ?? 'bg-muted text-muted-foreground border-border')}>
                                                {log.accion}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                            {log.descripcion}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

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
                <div className="modal-overlay">
                    <div className="modal-panel w-full max-w-md p-6 space-y-5">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-chart-3/10 text-chart-3 shrink-0">
                                <AlertTriangle size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-foreground">Archivar y limpiar</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Se exportará un CSV y se eliminarán todos los registros <strong>anteriores a</strong> la fecha seleccionada.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="flex flex-col gap-1 flex-1">
                                <label className="text-xs font-medium text-muted-foreground">Mes</label>
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
                                <label className="text-xs font-medium text-muted-foreground">Año</label>
                                <select
                                    value={archAnio}
                                    onChange={e => setArchAnio(Number(e.target.value))}
                                    className="select"
                                >
                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 text-xs text-chart-3 bg-chart-3/10 border border-chart-3/30 rounded-lg p-3">
                            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                            <span>
                                Esta acción <strong>no se puede deshacer</strong>. El archivo CSV se descargará automáticamente antes de eliminar.
                            </span>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <Button variant="outline" onClick={() => setArchiveOpen(false)} disabled={archiving}>
                                Cancelar
                            </Button>
                            <Button variant="destructive" onClick={handleArchivar} disabled={archiving}>
                                <Archive size={14} />
                                {archiving ? 'Archivando...' : 'Exportar y eliminar'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

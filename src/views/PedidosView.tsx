import { useEffect, useRef, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { usePedidoStore, useClienteStore, useProductoStore, useInsumoStore } from '@/stores/index';
import { pedidoApi, kardexApi } from '@/api/services';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import StatusBadge from '@/components/shared/StatusBadge';
import { usePagination } from '@/hooks/usePagination';
import { useRole } from '@/hooks/useRole';
import PedidosTable from '@/components/pedidos/PedidosTable';
import PedidoModal from '@/components/pedidos/PedidoModal';
import { clsx } from 'clsx';
import type { Pedido, EstadoPedido, CreatePedidoDto } from '@/types';
import { parseLocalDate } from '@/utils/dates';

const ESTADOS: EstadoPedido[] = ['Pendiente', 'Cortado', 'Aparado', 'Solado', 'Empaque', 'Terminado'];

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

export default function PedidosView() {
    const [modalOpen, setModalOpen]       = useState(false);
    const [editTarget, setEditTarget]     = useState<Pedido | null>(null);
    const [modalKey, setModalKey]         = useState(0);
    const [deleteTarget, setDeleteTarget] = useState<Pedido | null>(null);
    const [deleteTieneKardex, setDeleteTieneKardex] = useState(false);
    const deleteRequestIdRef = useRef<number | null>(null);
    const [search, setSearch]             = useState('');
    const [filterEstado, setFilterEstado] = useState<EstadoPedido | ''>('');

    // Date filters — only apply when filterEstado === 'Terminado'
    const [filterAnio, setFilterAnio] = useState<number>(0);
    const [filterMes,  setFilterMes]  = useState<number>(0);

    // Global creation date filters — apply to all pedidos
    const [filterAnioPedido, setFilterAnioPedido] = useState<number>(0);
    const [filterMesPedido,  setFilterMesPedido]  = useState<number>(0);
    const [filterCategoria,  setFilterCategoria]  = useState('');

    const { pedidos, isLoading, fetchAll, create, update, mover, remove } = usePedidoStore();
    const { canCreate, canEdit, canDelete, isOperario, isAdmin } = useRole();
    const { clientes, fetchAll: fetchClientes }   = useClienteStore();
    const { productos, fetchAll: fetchProductos } = useProductoStore();
    const { insumos, fetchAll: fetchInsumos }     = useInsumoStore();

    useEffect(() => { fetchAll(); fetchClientes(); fetchProductos(); }, [fetchAll, fetchClientes, fetchProductos]);
    // Solo admin abre el PedidoModal en esta vista (canCreate/canEdit son admin-only), por eso solo admin necesita insumos acá.
    useEffect(() => { if (isAdmin) fetchInsumos(); }, [isAdmin, fetchInsumos]);
    useEffect(() => { document.title = 'Pedidos | NT'; }, []);

    const handleEstadoChange = (estado: EstadoPedido | '') => {
        setFilterEstado(estado);
        // Reset date filters when leaving Terminado
        if (estado !== 'Terminado') {
            setFilterAnio(0);
            setFilterMes(0);
        }
    };

    const filtered = pedidos.filter(p => {
        const matchSearch = !search ||
            p.cliente.nombre.toLowerCase().includes(search.toLowerCase()) ||
            (p.producto?.nombre_modelo ?? '').toLowerCase().includes(search.toLowerCase());
        if (!matchSearch) return false;
        if (filterEstado && p.estado !== filterEstado) return false;

        // Date filter only for Terminado
        if (filterEstado === 'Terminado' && (filterAnio !== 0 || filterMes !== 0)) {
            const d = parseLocalDate(p.fecha_entrega);
            if (filterAnio !== 0 && d.getFullYear() !== filterAnio) return false;
            if (filterMes  !== 0 && d.getMonth() + 1 !== filterMes)  return false;
        }

        if (filterCategoria && p.categoria !== filterCategoria) return false;

        // Global delivery date filter
        if (filterAnioPedido !== 0) {
            const d = parseLocalDate(p.fecha_entrega);
            if (d.getFullYear() !== filterAnioPedido) return false;
        }
        if (filterMesPedido !== 0) {
            const d = parseLocalDate(p.fecha_entrega);
            if (d.getMonth() + 1 !== filterMesPedido) return false;
        }

        return true;
    });

    const pagination = usePagination(filtered, 10);

    const openCreate = () => { setEditTarget(null); setModalKey(k => k + 1); setModalOpen(true); };
    const openEdit   = (p: Pedido) => {
        setEditTarget(p);
        setModalOpen(true);
        // GET /pedidos (listado) no trae la relación de calificación — se completa al abrir el detalle.
        if (p.estado === 'Terminado') {
            pedidoApi.getOne(p.id_pedido)
                .then(res => setEditTarget(current => current?.id_pedido === p.id_pedido ? res.data : current))
                .catch(() => {});
        }
    };
    const closeModal = () => setModalOpen(false);

    const handleDeleteClick = (p: Pedido) => {
        setDeleteTarget(p);
        setDeleteTieneKardex(false);
        deleteRequestIdRef.current = p.id_pedido;
        kardexApi.tienePedidoMovimientos(p.id_pedido)
            .then(res => {
                if (deleteRequestIdRef.current === p.id_pedido) {
                    setDeleteTieneKardex(res.data.tieneMovimientos);
                }
            })
            .catch(() => {});
    };

    const handleSubmit = async (data: CreatePedidoDto) => {
        if (editTarget) await update(editTarget.id_pedido, data);
        else await create(data);
    };

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title section-title">Gestión de Pedidos</h1>
                    <p className="page-subtitle">{pedidos.length} pedidos registrados</p>
                </div>
                {canCreate && (
                    <button onClick={openCreate} className="btn-ripple">
                        <Plus size={15} /> Nuevo pedido
                    </button>
                )}
            </div>

            {/* Search + estado selector + creation date filters */}
            <div className="flex flex-wrap gap-3 items-end">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                           placeholder="Buscar cliente o producto..." className="input pl-9 w-64" />
                </div>
                <select
                    value={filterEstado}
                    onChange={e => handleEstadoChange(e.target.value as EstadoPedido | '')}
                    className="select w-44"
                >
                    <option value="">Todos los estados</option>
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-cafe-700">Categoría</label>
                    <select
                        value={filterCategoria}
                        onChange={e => setFilterCategoria(e.target.value)}
                        className="select w-36"
                    >
                        <option value="">Todas</option>
                        <option value="adulto">Adulto</option>
                        <option value="juvenil">Juvenil</option>
                        <option value="niño">Niño</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-cafe-700">Año</label>
                    <select
                        value={filterAnioPedido}
                        onChange={e => setFilterAnioPedido(Number(e.target.value))}
                        className="select w-28"
                    >
                        <option value={0}>Todos</option>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-cafe-700">Mes</label>
                    <select
                        value={filterMesPedido}
                        onChange={e => setFilterMesPedido(Number(e.target.value))}
                        className="select w-36"
                    >
                        <option value={0}>Todos</option>
                        {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                    </select>
                </div>
            </div>

            {/* Estado pills */}
            <div className="flex flex-wrap gap-2">
                {ESTADOS.map(estado => {
                    const count = pedidos.filter(p => p.estado === estado).length;
                    return (
                        <button key={estado}
                                onClick={() => handleEstadoChange(filterEstado === estado ? '' : estado)}
                                className={clsx(
                                    'flex items-center gap-2 px-3 py-1.5 rounded border text-xs transition-all',
                                    filterEstado === estado
                                        ? 'bg-primary border-primary text-primary-foreground'
                                        : 'bg-card/50 border-border text-muted-foreground hover:border-primary/40',
                                )}>
                            <StatusBadge estado={estado} size="sm" />
                            <span className="font-mono">{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* Date filters — only visible for Terminado */}
            {filterEstado === 'Terminado' && (
                <div className="flex flex-wrap items-end gap-3 px-4 py-3 bg-cafe-50 border border-cafe-200 rounded-xl">
                    <span className="text-xs font-medium text-cafe-600 self-end pb-0.5">
                        Filtrar por fecha de entrega:
                    </span>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-cafe-700">Año</label>
                        <select
                            value={filterAnio}
                            onChange={e => setFilterAnio(Number(e.target.value))}
                            className="select w-28"
                        >
                            <option value={0}>Todos</option>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-cafe-700">Mes</label>
                        <select
                            value={filterMes}
                            onChange={e => setFilterMes(Number(e.target.value))}
                            className="select w-36"
                        >
                            <option value={0}>Todos</option>
                            {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                        </select>
                    </div>

                    {(filterAnio !== 0 || filterMes !== 0) && (
                        <button
                            onClick={() => { setFilterAnio(0); setFilterMes(0); }}
                            className="btn-secondary text-xs h-9 self-end"
                        >
                            Limpiar fechas
                        </button>
                    )}
                </div>
            )}

            <PedidosTable
                onEdit={openEdit}
                onDelete={handleDeleteClick}
                onMover={mover}
                canEdit={canEdit}
                canDelete={canDelete}
                hideTotals={isOperario}
                isLoading={isLoading}
                pagination={pagination}
                total={filtered.length}
            />

            <PedidoModal
                key={editTarget ? `edit-${editTarget.id_pedido}` : `new-${modalKey}`}
                isOpen={modalOpen}
                onClose={closeModal}
                onSubmit={handleSubmit}
                pedido={editTarget}
                clientes={clientes}
                productos={productos}
                insumos={insumos}
            />

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => deleteTarget && remove(deleteTarget.id_pedido)}
                title="Eliminar pedido"
                message={deleteTarget
                    ? `¿Estás seguro de eliminar el pedido #${deleteTarget.id_pedido} de ${deleteTarget.cliente.nombre} ${deleteTarget.cliente.apellido}? Esta acción no se puede deshacer.`
                    : ''}
                warningMessage={deleteTieneKardex
                    ? 'Este pedido tiene movimientos de stock asociados. Si lo eliminás, esos registros de Kardex quedarán sin referencia al pedido.'
                    : undefined}
            />
        </div>
    );
}

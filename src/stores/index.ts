import { create } from 'zustand';
import toast from 'react-hot-toast';
import { type AxiosError } from 'axios';
import { clienteApi, productoApi, pedidoApi, insumoApi, dashboardApi } from '@/api/services';
import type {
    Cliente, CreateClienteDto, UpdateClienteDto,
    Producto, CreateProductoDto, UpdateProductoDto,
    Pedido, CreatePedidoDto, UpdatePedidoDto, EstadoPedido,
    Insumo, CreateInsumoDto, UpdateInsumoDto,
    DashboardKpis, OrdersStatus, ProductionFunnel, RecentActivity,
    TopProducto, VentaMes, PrediccionStock, ProximoPedido,
} from '@/types';

// ─── Clientes ─────────────────────────────────────────────────────────────────
interface ClienteState {
    clientes: Cliente[]; isLoading: boolean;
    fetchAll: () => Promise<void>;
    create:   (dto: CreateClienteDto) => Promise<void>;
    update:   (id: number, dto: UpdateClienteDto) => Promise<void>;
    remove:   (id: number) => Promise<void>;
}

export const useClienteStore = create<ClienteState>((set, get) => ({
    clientes: [], isLoading: false,

    fetchAll: async () => {
        set({ isLoading: true });
        try { const { data } = await clienteApi.getAll(); set({ clientes: data }); }
        finally { set({ isLoading: false }); }
    },
    create: async (dto) => {
        const { data } = await clienteApi.create(dto);
        set({ clientes: [...get().clientes, data] });
        toast.success('Cliente registrado exitosamente');
    },
    update: async (id, dto) => {
        const { data } = await clienteApi.update(id, dto);
        set({ clientes: get().clientes.map(c => c.id_cliente === id ? data : c) });
        toast.success('Cliente actualizado');
    },
    remove: async (id) => {
        try {
            await clienteApi.remove(id, { headers: { 'x-silent': 'true' } });
            set({ clientes: get().clientes.filter(c => c.id_cliente !== id) });
            toast.success('Cliente eliminado');
        } catch (err) {
            const status = (err as AxiosError)?.response?.status;
            if (status === 500) {
                toast.error('No se puede eliminar: el cliente tiene pedidos asociados.');
            }
            throw err;
        }
    },
}));

// ─── Productos ────────────────────────────────────────────────────────────────
interface ProductoState {
    productos: Producto[]; alertas: Producto[]; isLoading: boolean;
    fetchAll:     () => Promise<void>;
    fetchAlertas: () => Promise<void>;
    create:  (dto: CreateProductoDto, imagen?: File) => Promise<void>;
    update:  (id: number, dto: UpdateProductoDto, imagen?: File) => Promise<void>;
    remove:  (id: number) => Promise<void>;
}

export const useProductoStore = create<ProductoState>((set, get) => ({
    productos: [], alertas: [], isLoading: false,

    fetchAll: async () => {
        set({ isLoading: true });
        try { const { data } = await productoApi.getAll(); set({ productos: data }); }
        finally { set({ isLoading: false }); }
    },
    fetchAlertas: async () => {
        const { data } = await productoApi.getAlertas();
        set({ alertas: data });
    },
    create: async (dto, imagen) => {
        const { data } = await productoApi.create(dto, imagen);
        set({ productos: [...get().productos, data] });
        toast.success('Producto creado exitosamente');
    },
    update: async (id, dto, imagen) => {
        console.log('STORE UPDATE PRODUCTO:', JSON.stringify(dto));
        const { data } = await productoApi.update(id, dto, imagen);
        set({ productos: get().productos.map(p => p.id_producto === id ? data : p) });
        toast.success('Producto actualizado');
    },
    remove: async (id) => {
        await productoApi.remove(id);
        set({ productos: get().productos.filter(p => p.id_producto !== id) });
        toast.success('Producto eliminado');
    },
}));

// ─── Pedidos ──────────────────────────────────────────────────────────────────
interface PedidoState {
    pedidos: Pedido[]; isLoading: boolean;
    fetchAll: (cliente?: string, producto?: string) => Promise<void>;
    create:   (dto: CreatePedidoDto) => Promise<void>;
    update:   (id: number, dto: UpdatePedidoDto) => Promise<void>;
    mover:    (id: number, estado: EstadoPedido) => Promise<void>;
    remove:   (id: number) => Promise<void>;
}

export const usePedidoStore = create<PedidoState>((set, get) => ({
    pedidos: [], isLoading: false,

    fetchAll: async (cliente, producto) => {
        set({ isLoading: true });
        try { const { data } = await pedidoApi.getAll(cliente, producto); set({ pedidos: data }); }
        finally { set({ isLoading: false }); }
    },
    create: async (dto) => {
        console.log('2. STORE CREATE:', JSON.stringify(dto));
        const { data } = await pedidoApi.create(dto);
        set({ pedidos: [data, ...get().pedidos] });
        toast.success('Pedido creado exitosamente');
    },
    update: async (id, dto) => {
        const { data } = await pedidoApi.update(id, dto);
        set({ pedidos: get().pedidos.map(p => p.id_pedido === id ? data : p) });
        toast.success('Pedido actualizado');
    },
    mover: async (id, estado) => {
        const { data } = await pedidoApi.mover(id, estado);
        set({ pedidos: get().pedidos.map(p => p.id_pedido === id ? data : p) });
        toast.success(`Pedido movido a ${estado}`);
    },
    remove: async (id) => {
        await pedidoApi.remove(id);
        set({ pedidos: get().pedidos.filter(p => p.id_pedido !== id) });
        toast.success('Pedido eliminado');
    },
}));

// ─── Insumos ──────────────────────────────────────────────────────────────────
interface InsumoState {
    insumos:      Insumo[];
    alertas:      Insumo[];
    isLoading:    boolean;
    fetchAll:     () => Promise<void>;
    fetchAlertas: () => Promise<void>;
    create:       (dto: CreateInsumoDto)             => Promise<Insumo>;
    update:       (id: number, dto: UpdateInsumoDto) => Promise<Insumo>;
    remove:       (id: number)                       => Promise<void>;
}

export const useInsumoStore = create<InsumoState>((set, get) => ({
    insumos: [], alertas: [], isLoading: false,

    fetchAll: async () => {
        set({ isLoading: true });
        try { const { data } = await insumoApi.getAll(); set({ insumos: data }); }
        finally { set({ isLoading: false }); }
    },
    fetchAlertas: async () => {
        const { data } = await insumoApi.getAlertas();
        set({ alertas: data });
    },
    create: async (dto) => {
        const { data } = await insumoApi.create(dto);
        set({ insumos: [...get().insumos, data] });
        toast.success('Insumo creado exitosamente');
        return data;
    },
    update: async (id, dto) => {
        const { data } = await insumoApi.update(id, dto);
        set({ insumos: get().insumos.map(i => i.id_insumo === id ? data : i) });
        toast.success('Insumo actualizado');
        return data;
    },
    remove: async (id) => {
        await insumoApi.remove(id);
        set({ insumos: get().insumos.filter(i => i.id_insumo !== id) });
        toast.success('Insumo eliminado');
    },
}));

// ─── Dashboard ────────────────────────────────────────────────────────────────

/** Garantiza que el valor devuelto por el backend sea siempre un array. */
function toArray<T>(value: unknown): T[] {
    if (Array.isArray(value)) return value as T[];
    if (value && typeof value === 'object') {
        // Busca la primera propiedad que sea un array (e.g. { data: [], results: [], items: [] })
        const arr = Object.values(value as Record<string, unknown>).find(Array.isArray);
        if (arr) return arr as T[];
    }
    return [];
}

interface DashboardState {
    kpis: DashboardKpis | null;
    ordersStatus: OrdersStatus[];
    productionFunnel: ProductionFunnel[];
    recentActivity: RecentActivity[];
    topProductos: TopProducto[];
    ventasPorMes: VentaMes[];
    prediccionStock: PrediccionStock[];
    proximosAEntregar: ProximoPedido[];
    isLoading: boolean;
    fetchAll: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    kpis: null, ordersStatus: [], productionFunnel: [], recentActivity: [],
    topProductos: [], ventasPorMes: [], prediccionStock: [], proximosAEntregar: [], isLoading: false,

    fetchAll: async () => {
        set({ isLoading: true });
        try {
            const [kpis, orders, funnel, activity, top, ventas, stock, proximos] = await Promise.all([
                dashboardApi.getKpis(),
                dashboardApi.getOrdersStatus(),
                dashboardApi.getProductionFunnel(),
                dashboardApi.getRecentActivity(),
                dashboardApi.topProductos(),
                dashboardApi.ventasPorMes(),
                dashboardApi.prediccionStock(),
                dashboardApi.proximosAEntregar(),
            ]);
            set({
                kpis: kpis.data,
                ordersStatus:      toArray<OrdersStatus>(orders.data),
                productionFunnel:  toArray<ProductionFunnel>(funnel.data),
                recentActivity:    toArray<RecentActivity>(activity.data),
                topProductos:      toArray<TopProducto>(top.data),
                ventasPorMes:      toArray<VentaMes>(ventas.data),
                prediccionStock:   toArray<PrediccionStock>(stock.data),
                proximosAEntregar: toArray<ProximoPedido>(proximos.data),
            });
        } finally { set({ isLoading: false }); }
    },
}));

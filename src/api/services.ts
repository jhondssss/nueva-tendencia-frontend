import api from './axios';
import type { AxiosRequestConfig } from 'axios';
import type {
    LoginDto, AuthResponse,
    Cliente, CreateClienteDto, UpdateClienteDto,
    Producto, CreateProductoDto, UpdateProductoDto,
    Pedido, CreatePedidoDto, UpdatePedidoDto, EstadoPedido,
    Insumo, CreateInsumoDto, UpdateInsumoDto,
    DashboardKpis, OrdersStatus, ProductionFunnel, RecentActivity, ProximoPedido,
    KardexMovimiento, CreateKardexDto,
    AuditoriaLog,
    ReporteDiario,
} from '@/types';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
    login:    (dto: LoginDto)    => api.post<AuthResponse>('/auth/login', dto),
    register: (dto: LoginDto)    => api.post<AuthResponse>('/auth/register', dto),
};

// ─── Clientes ─────────────────────────────────────────────────────────────────
export const clienteApi = {
    getAll:  ()                              => api.get<Cliente[]>('/clientes'),
    getOne:  (id: number)                   => api.get<Cliente>(`/clientes/${id}`),
    create:  (dto: CreateClienteDto)        => api.post<Cliente>('/clientes', dto),
    update:  (id: number, dto: UpdateClienteDto) => api.patch<Cliente>(`/clientes/${id}`, dto),
    remove:  (id: number, config?: AxiosRequestConfig) => api.delete(`/clientes/${id}`, config),
};

// ─── Productos ────────────────────────────────────────────────────────────────
export const productoApi = {
    getAll:     ()           => api.get<Producto[]>('/productos'),
    getOne:     (id: number) => api.get<Producto>(`/productos/${id}`),
    getAlertas: ()           => api.get<Producto[]>('/productos/alertas-stock'),

    create: (dto: CreateProductoDto, imagen?: File) => {
        const form = new FormData();
        Object.entries(dto).forEach(([k, v]) => {
            if (v === undefined || v === null) return;
            form.append(k, typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v));
        });
        if (imagen) form.append('imagen', imagen);
        return api.post<Producto>('/productos', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    update: (id: number, dto: UpdateProductoDto, imagen?: File) => {
        const form = new FormData();
        Object.entries(dto).forEach(([k, v]) => {
            if (v === undefined || v === null) return;
            form.append(k, typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v));
        });
        if (imagen) form.append('imagen', imagen);
        console.log('FORMDATA ACTIVO:', form.get('activo'));
        return api.patch<Producto>(`/productos/${id}`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    remove: (id: number) => api.delete(`/productos/${id}`),
};

// ─── Pedidos ──────────────────────────────────────────────────────────────────
export const pedidoApi = {
    getAll:   (cliente?: string, producto?: string) =>
        api.get<Pedido[]>('/pedidos', { params: { cliente, producto } }),
    getOne:   (id: number)             => api.get<Pedido>(`/pedidos/${id}`),
    getKanban:()                       => api.get<Record<EstadoPedido, Pedido[]>>('/pedidos/kanban'),
    create:       (dto: CreatePedidoDto)   => api.post<Pedido>('/pedidos', dto),
    update:       (id: number, dto: UpdatePedidoDto) => api.patch<Pedido>(`/pedidos/${id}`, dto),
    updateTallas: (id: number, data: { tallas: { talla: number; cantidad_pares: number }[] }) =>
        api.patch<Pedido>(`/pedidos/${id}/tallas`, data),
    mover:        (id: number, nuevoEstado: EstadoPedido) =>
        api.patch<Pedido>(`/pedidos/${id}/mover`, { nuevoEstado }),
    remove:       (id: number)             => api.delete(`/pedidos/${id}`),
};

// ─── Insumos ──────────────────────────────────────────────────────────────────
export const insumoApi = {
    getAll:    ()                                 => api.get<Insumo[]>('/insumos'),
    getAlertas:()                                 => api.get<Insumo[]>('/insumos/alertas'),
    getOne:    (id: number)                       => api.get<Insumo>(`/insumos/${id}`),
    create:    (dto: CreateInsumoDto)             => api.post<Insumo>('/insumos', dto),
    update:    (id: number, dto: UpdateInsumoDto) => api.patch<Insumo>(`/insumos/${id}`, dto),
    remove:       (id: number)                       => api.delete(`/insumos/${id}`),
    uploadImagen: (id: number, formData: FormData)  => api.post<Insumo>(`/insumos/${id}/imagen`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ─── Kardex ───────────────────────────────────────────────────────────────────
export const kardexApi = {
    getAll:        ()                     => api.get<KardexMovimiento[]>('/kardex'),
    getByProducto: (id: number)           => api.get<KardexMovimiento[]>(`/kardex/producto/${id}`),
    registrar:     (dto: CreateKardexDto) => api.post<KardexMovimiento>('/kardex', dto),
};

// ─── Reportes ─────────────────────────────────────────────────────────────────
export const reportesApi = {
    getPdfPedidosEntregados:   () =>
        api.get<Blob>('/reportes/pdf/pedidos-entregados', { responseType: 'blob' }),
    getPdfGanancias:           (month: number, year: number) =>
        api.get<Blob>(`/reportes/pdf/ganancias?month=${month}&year=${year}`, { responseType: 'blob' }),
    getExcelPedidosEntregados: () =>
        api.get<Blob>('/reportes/excel/pedidos-entregados', { responseType: 'blob' }),
    getExcelGanancias:         (month: number, year: number) =>
        api.get<Blob>(`/reportes/excel/ganancias?month=${month}&year=${year}`, { responseType: 'blob' }),
    getDiario:     () => api.get<ReporteDiario>('/reportes/diario'),
    getPdfDiario:  () => api.get<Blob>('/reportes/pdf/diario',   { responseType: 'blob' }),
    getExcelDiario:() => api.get<Blob>('/reportes/excel/diario', { responseType: 'blob' }),
};

// ─── Auditoría ────────────────────────────────────────────────────────────────
export const auditoriaApi = {
    getAll:       ()                    => api.get<AuditoriaLog[]>('/auditoria'),
    getByModulo:  (modulo: string)      => api.get<AuditoriaLog[]>(`/auditoria/modulo/${modulo}`),
    limpiar:      (before: string)      => api.delete<void>(`/auditoria/limpiar?before=${before}`),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
    getKpis:             () => api.get<DashboardKpis>('/dashboard/kpis'),
    getOrdersStatus:     () => api.get<OrdersStatus[]>('/dashboard/orders-status'),
    getProductionFunnel: () => api.get<ProductionFunnel[]>('/dashboard/production-funnel'),
    getRecentActivity:   () => api.get<RecentActivity[]>('/dashboard/recent-activity'),
    topProductos:        () => api.get<{ nombre: string; mes: string; cantidad: number; total: number }[]>('/dashboard/top-productos'),
    ventasPorMes:        () => api.get<{ mes: string; total: number }[]>('/dashboard/ventas-por-mes'),
    prediccionStock:     () => api.get<{
        id: number; nombre: string; stock: number; nivel_minimo: number;
        demanda_mensual: number; semanas_restantes: number | null;
        alerta: boolean; critico: boolean;
    }[]>('/dashboard/prediccion-stock'),
    proximosAEntregar:   () => api.get<ProximoPedido[]>('/dashboard/proximos-a-entregar'),
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginDto   { email: string; password: string; }
export interface RegisterDto { email: string; password: string; role?: string; }
export interface AuthResponse { access_token: string; user: User; }

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User { id: number; email: string; role: string; }

// ─── Cliente ──────────────────────────────────────────────────────────────────
export interface Cliente {
    id_cliente: number;
    tipo_cliente: string;
    nombre: string;
    apellido?: string;
    nombre_completo?: string;
    documento_identidad?: string;
    correo_electronico: string;
    telefono_principal: string;
    telefono_alternativo?: string;
    direccion_calle: string;
    direccion_colonia: string;
    ciudad: string;
    estado_provincia: string;
    codigo_postal: string;
    pais: string;
    fecha_registro: string;
    activo: boolean;
    pedidos?: Pedido[];
}
export type CreateClienteDto = Omit<Cliente, 'id_cliente' | 'fecha_registro' | 'pedidos'>;
export type UpdateClienteDto = Partial<CreateClienteDto>;

// ─── Producto ─────────────────────────────────────────────────────────────────
export interface Producto {
    id_producto: number;
    nombre_modelo: string;
    marca: string;
    tipo_calzado: string;
    genero: string;
    material_principal: string;
    color: string;
    precio_venta: number;
    costo_unidad: number;
    descripcion_corta: string;
    activo: boolean;
    stock: number;
    unidad_medida: string;
    nivel_minimo: number;
    imagen_url?: string;
    categoria?: CategoriaCalzado;
    talles?: TallaDetalle[];
}
export type CreateProductoDto = Omit<Producto, 'id_producto'>;
export type UpdateProductoDto = Partial<CreateProductoDto>;

// ─── Tallas ───────────────────────────────────────────────────────────────────
export type CategoriaCalzado = 'nino' | 'juvenil' | 'adulto';

export interface TallaDetalle {
    id_talla?:      number;
    categoria:      CategoriaCalzado;
    talla:          number;
    cantidad_pares: number;
}

// ─── Pedido ───────────────────────────────────────────────────────────────────
export type EstadoPedido  = 'Pendiente' | 'Cortado' | 'Aparado' | 'Solado' | 'Empaque' | 'Terminado';
export type UnidadPedido  = 'docena' | 'media_docena' | 'par';

export interface Pedido {
    id_pedido:      number;
    cliente:        Cliente;
    producto:       Producto;
    cantidad:       number;
    unidad:         UnidadPedido;
    cantidad_pares: number;
    total:          number;
    fecha_entrega:  string;
    estado:         EstadoPedido;
    categoria?:     CategoriaCalzado;
    talles?:        TallaDetalle[];
}
export interface CreatePedidoDto {
    clienteId:              number;
    productoId:             number;
    cantidad:               number;
    unidad:                 UnidadPedido;
    total:                  number;
    fecha_entrega:          string;
    estado?:                EstadoPedido;
    categoria?:             CategoriaCalzado;
    tallas_personalizadas?: { talla: number; cantidad_pares: number }[];
}
export type UpdatePedidoDto = Partial<CreatePedidoDto>;

// ─── Insumos ──────────────────────────────────────────────────────────────────
export type CategoriaInsumo = 'adhesivo' | 'material' | 'herramienta' | 'quimico' | 'otro';
export type UnidadMedida    = 'litro' | 'kilo' | 'metro' | 'unidad' | 'galon';

export interface Insumo {
    id_insumo:       number;
    nombre:          string;
    descripcion:     string;
    categoria:       CategoriaInsumo;
    unidad_medida:   UnidadMedida;
    stock:           number;
    nivel_minimo:    number;
    precio_unitario: number;
    activo:          boolean;
    fecha_creacion:  string;
    imagen_url?:     string | null;
}
export type CreateInsumoDto = Omit<Insumo, 'id_insumo' | 'fecha_creacion'>;
export type UpdateInsumoDto = Partial<CreateInsumoDto>;

// ─── Kardex ───────────────────────────────────────────────────────────────────
export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste';

export interface KardexMovimiento {
    id_movimiento:  number;
    producto:       Producto | null;
    insumo?:        Insumo   | null;
    tipo:           TipoMovimiento;
    cantidad:       number;
    stock_anterior: number;
    stock_nuevo:    number;
    motivo?:        string;
    fecha:          string;
}

export interface CreateKardexDto {
    productoId: number;
    tipo:       TipoMovimiento;
    cantidad:   number;
    motivo?:    string;
}

// ─── Auditoría ────────────────────────────────────────────────────────────────
export type ModuloAuditoria = 'auth' | 'pedidos' | 'clientes' | 'productos';
export type AccionAuditoria = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';

export interface AuditoriaLog {
    id:          number;
    usuario:     { id: number; email: string; role: string } | null;
    modulo:      ModuloAuditoria;
    accion:      AccionAuditoria;
    descripcion: string;
    fecha:       string;
}

// ─── Reporte Diario ───────────────────────────────────────────────────────────
export interface ReporteDiarioResumen {
    pedidos_creados:    number;
    pedidos_movidos:    number;
    ventas_total:       number;
    movimientos_kardex: number;
    alertas_criticas:   number;
}

export interface ReporteDiarioPedido {
    id_pedido: number;
    cliente:   string;
    producto:  string;
    categoria?: CategoriaCalzado;
    estado:    EstadoPedido;
    hora:      string;
}

export interface ReporteDiarioVenta {
    id_pedido: number;
    cliente:   string;
    producto:  string;
    cantidad:  number;
    unidad:    UnidadPedido;
    total:     number;
}

export interface ReporteDiarioKardex {
    id_kardex: number;
    nombre:    string;
    tipo:      TipoMovimiento;
    cantidad:  number;
    motivo?:   string;
    hora:      string;
}

export interface ReporteDiarioAlertaItem {
    id:          number;
    nombre:      string;
    stock:       number;
    nivel_minimo: number;
    critico:     boolean;
}

export interface ReporteDiario {
    resumen:           ReporteDiarioResumen;
    pedidos_creados:   ReporteDiarioPedido[];
    pedidos_movidos:   ReporteDiarioPedido[];
    ventas:            ReporteDiarioVenta[];
    movimientos_kardex: ReporteDiarioKardex[];
    alertas: {
        productos: ReporteDiarioAlertaItem[];
        insumos:   ReporteDiarioAlertaItem[];
    };
    actividad: AuditoriaLog[];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardKpis {
    totalVentas:        number;
    totalPedidos:       number;
    itemsInventario:    number;
    alertasStock:       number;
    produccionMensual?: number;
}
export interface OrdersStatus    { estado: EstadoPedido; count: number; }
export interface ProductionFunnel { etapa: string; cantidad: number; }
export interface RecentActivity  { id: number; descripcion: string; cliente: string; estado: string; fecha: string; }
export interface TopProducto     { nombre: string; mes: string; cantidad: number; total: number; }
export interface VentaMes        { mes: string; total: number; }
export interface ProximoPedido {
    id:            number;
    cliente:       string;
    producto:      string;
    fecha_entrega: string;
    estado:        EstadoPedido;
}
export interface PrediccionStock {
    id: number;
    nombre: string;
    stock: number;
    nivel_minimo: number;
    demanda_mensual: number;
    semanas_restantes: number | null;
    alerta: boolean;
    critico: boolean;
}

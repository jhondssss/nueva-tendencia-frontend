// ─── Paginación ───────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginDto   { email: string; password: string; }
export interface RegisterDto { email: string; password: string; role?: string; }
export interface AuthResponse { access_token: string; user: User; }

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User { id: number; email: string; role: string; }

// ─── Usuario (gestión admin) ───────────────────────────────────────────────────
export type RolUsuario = 'admin' | 'operario' | 'cliente';
export interface UsuarioAdmin {
    id:       number;
    email:    string;
    nombre:   string;
    apellido: string;
    role:     RolUsuario;
    activo:   boolean;
}
export interface CreateUsuarioDto {
    email:    string;
    password: string;
    nombre:   string;
    apellido: string;
    role:     RolUsuario;
}
export type UpdateUsuarioDto = Partial<Omit<CreateUsuarioDto, 'password'> & { password?: string }>;

// ─── Cliente ──────────────────────────────────────────────────────────────────
// La dirección viene anidada desde el backend (relación 1:1 con DireccionCliente),
// no como columnas planas del cliente.
export interface DireccionCliente {
    calle: string;
    colonia: string;
    ciudad: string;
    estado_provincia: string;
    codigo_postal: string;
    pais: string;
    es_principal?: boolean;
}
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
    direccion?: DireccionCliente;
    fecha_registro: string;
    activo: boolean;
    pedidos?: Pedido[];
    tieneUsuario?: boolean;
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
    // Fórmula de producción — cantidad fija por docena de pares, consumida
    // automáticamente en cada etapa del Kanban. null = etapa no configurada.
    cuero_pies?: number | null;
    clefa_aparado_litros?: number | null;
    pasta_solado_litros?: number | null;
    clefa_solado_litros?: number | null;
    pvc_solado_litros?: number | null;
    clefa_empaque_litros?: number | null;
    esponja_empaque_hojas?: number | null;
}
export type CreateProductoDto = Omit<Producto, 'id_producto'>;
export type UpdateProductoDto = Partial<CreateProductoDto>;

// ─── Catálogo público (portal de cliente) ──────────────────────────────────────
export interface ProductoCatalogo {
    id_producto: number;
    nombre: string;
    descripcion: string;
    precio: string;
    imagen: string;
    categoria: CategoriaCalzado;
    disponible: boolean;
}

// ─── Tallas ───────────────────────────────────────────────────────────────────
export type CategoriaCalzado = 'nino' | 'juvenil' | 'adulto';

// ─── Reportes ─────────────────────────────────────────────────────────────────
export interface ReporteFiltrosPedidos {
    cliente?:   string;
    producto?:  string;
    categoria?: CategoriaCalzado;
    desde?:     string;
    hasta?:     string;
}

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
    id_pedido:          number;
    cliente:            Cliente;
    producto:           Producto;
    cantidad:           number;
    unidad:             UnidadPedido;
    cantidad_pares:     number;
    total:              number;
    fecha_entrega:      string;
    estado:             EstadoPedido;
    categoria?:         CategoriaCalzado;
    talles?:            TallaDetalle[];
    token_seguimiento?: string | null;
    calificacion?:      CalificacionPedido | null;
    cuero_insumo_id?:   number | null;
}
export interface CalificacionPedido {
    id_calificacion: number;
    puntuacion:      number;
    comentario:      string | null;
    fecha_creacion:  string;
}
export interface CalificarPedidoDto {
    puntuacion:  number;
    comentario?: string;
}
export interface MisPedidosFiltros {
    desde?:  string;
    hasta?:  string;
    estado?: EstadoPedido;
}
export interface CalificacionAdmin extends CalificacionPedido {
    pedido: {
        id_pedido: number;
        cliente:   Pick<Cliente, 'id_cliente' | 'nombre' | 'apellido'>;
        producto:  Pick<Producto, 'id_producto' | 'nombre_modelo'> | null;
    };
}
export interface CalificacionesFiltros {
    puntuacion?: number;
    desde?:      string;
    hasta?:      string;
}
export interface CreatePedidoDto {
    cliente_id:             number;
    producto_id:            number;
    cantidad:               number;
    unidad:                 UnidadPedido;
    total:                  number;
    fecha_entrega:          string;
    estado?:                EstadoPedido;
    categoria?:             CategoriaCalzado;
    tallas_personalizadas?: { talla: number; cantidad_pares: number }[];
    cuero_insumo_id?:       number | null;
}
export type UpdatePedidoDto = Partial<CreatePedidoDto>;

// ─── Solicitudes de pedido (portal cliente → aprobación admin) ─────────────────
export type EstadoSolicitud = 'Pendiente' | 'Aprobada' | 'Rechazada';

export interface TallaSolicitada { talla: number; cantidad_pares: number; }

export interface SolicitudPedido {
    id_solicitud:           number;
    cliente:                Cliente;
    producto:                Producto;
    categoria:              CategoriaCalzado;
    cantidad_pares:         number;
    tallas:                 TallaSolicitada[];
    comentario_cliente:     string | null;
    fecha_entrega_deseada:  string | null;
    estado:                 EstadoSolicitud;
    motivo_rechazo:         string | null;
    pedido_creado:          Pedido | null;
    fecha_creacion:         string;
    fecha_actualizacion:    string;
}
export interface CreateSolicitudPedidoDto {
    producto_id:            number;
    categoria:              CategoriaCalzado;
    tallas:                 TallaSolicitada[];
    comentario_cliente?:    string;
    fecha_entrega_deseada?: string;
}
export interface AprobarSolicitudDto {
    total:         number;
    fecha_entrega: string;
    unidad?:       UnidadPedido;
}
export interface RechazarSolicitudDto {
    motivo_rechazo: string;
}

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

export type OrigenMovimiento = 'manual' | 'automatico';

export interface KardexMovimiento {
    id_movimiento:  number;
    producto:       Producto | null;
    insumo?:        Insumo   | null;
    pedido?:        { id_pedido: number; token_seguimiento?: string | null } | null;
    tipo:           TipoMovimiento;
    origen?:        OrigenMovimiento;
    cantidad:       number;
    stock_anterior: number;
    stock_nuevo:    number;
    motivo?:        string;
    fecha:          string;
}

export interface CreateKardexDto {
    insumo_id: number;
    tipo:     TipoMovimiento;
    cantidad: number;
    motivo?:  string;
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
// GET /reportes/diario devuelve entidades TypeORM serializadas tal cual (no DTOs
// dedicados) — estas interfaces modelan solo los campos que el frontend consume.

export interface ReporteDiarioResumen {
    pedidos_creados:    number;
    pedidos_movidos:    number;
    ventas_total:       number;
    movimientos_kardex: number;
    alertas_criticas:   number;
}

export interface ReporteDiarioClienteRef {
    id_cliente: number;
    nombre:     string;
    apellido?:  string;
}

export interface ReporteDiarioProductoRef {
    id_producto:   number;
    nombre_modelo: string;
    stock:         number;
    nivel_minimo:  number;
}

export interface ReporteDiarioInsumoRef {
    id_insumo:    number;
    nombre:       string;
    stock:        number;
    nivel_minimo: number;
}

export interface ReporteDiarioUsuarioRef {
    id:      number;
    nombre?: string;
    email:   string;
}

export interface ReporteDiarioPedidoRaw {
    id_pedido:           number;
    cliente:             ReporteDiarioClienteRef;
    producto:            ReporteDiarioProductoRef;
    total:               number;
    cantidad:            number;
    unidad:              UnidadPedido;
    categoria:           CategoriaCalzado | null;
    estado:              EstadoPedido;
    fecha_creacion:      string;
    fecha_actualizacion: string;
}

export interface ReporteDiarioKardexRaw {
    id_movimiento: number;
    tipo:          TipoMovimiento;
    cantidad:      number;
    motivo:        string | null;
    fecha:         string;
    producto:      ReporteDiarioProductoRef | null;
    insumo:        ReporteDiarioInsumoRef   | null;
}

export interface ReporteDiarioAuditoriaRaw {
    id_auditoria: number;
    accion:       string;
    modulo:       string;
    descripcion:  string;
    fecha:        string;
    usuario:      ReporteDiarioUsuarioRef | null;
}

/** Forma cruda devuelta por GET /reportes/diario (ResumenDiario en el backend). */
export interface ReporteDiarioResponse {
    fecha:              string;
    pedidosCreados:     ReporteDiarioPedidoRaw[];
    pedidosMovidos:     ReporteDiarioPedidoRaw[];
    pedidosTerminados:  ReporteDiarioPedidoRaw[];
    ventasDia:          number;
    movimientosKardex:  ReporteDiarioKardexRaw[];
    accionesAuditoria:  ReporteDiarioAuditoriaRaw[];
    alertasStock:       ReporteDiarioProductoRef[];
    alertasInsumos:     ReporteDiarioInsumoRef[];
}

/** Forma normalizada que consume la vista, derivada de ReporteDiarioResponse. */
export interface ReporteDiario {
    resumen:            ReporteDiarioResumen;
    pedidos_creados:    ReporteDiarioPedidoRaw[];
    pedidos_movidos:    ReporteDiarioPedidoRaw[];
    ventas:             ReporteDiarioPedidoRaw[];
    movimientos_kardex: ReporteDiarioKardexRaw[];
    alertas: {
        productos: ReporteDiarioProductoRef[];
        insumos:   ReporteDiarioInsumoRef[];
    };
    actividad: ReporteDiarioAuditoriaRaw[];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardKpis {
    totalVentas:        number;
    totalPedidos:       number;
    itemsInventario:    number;
    alertasStock:       number;
    alertasInsumos:     number;
    produccionMensual?: number;
}
export interface OrdersStatus    { estado: EstadoPedido; cantidad: number; }
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

// ─── Búsqueda global ──────────────────────────────────────────────────────────
export interface SearchResultItem {
    id: number;
    titulo: string;
    subtitulo: string;
}
export interface SearchResult {
    clientes:  SearchResultItem[];
    productos: SearchResultItem[];
    pedidos:   SearchResultItem[];
}

# CLAUDE.md — Nueva Tendencia Frontend

## Contexto del proyecto

Sistema de gestión para una empresa de calzado ("Nueva Tendencia"). Cubre pedidos, producción, inventario (productos e insumos), clientes, kardex, reportes y auditoría.

- **Frontend**: este repo (React + TypeScript + Vite)
- **Backend**: proyecto NestJS separado, corre en `http://localhost:3000`
- **Backend en producción**: `https://nueva-tendencia-backend-production.up.railway.app`
- **Dev server**: `npm run dev` → `http://localhost:5173`

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | React 19 + TypeScript |
| Bundler | Vite 7 |
| Estilos | Tailwind CSS 3 con tema personalizado |
| Estado global | Zustand 5 (con `persist` para auth) |
| HTTP | Axios (instancia centralizada con interceptores) |
| Formularios | react-hook-form + zod |
| Routing | react-router-dom v7 (`createBrowserRouter`) |
| Notificaciones | react-hot-toast |
| Íconos | lucide-react |
| Gráficos | Recharts |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Fechas | date-fns |
| Exportación | jspdf + jspdf-autotable + xlsx |
| AI integrada | @anthropic-ai/sdk (NTAssistant usa el backend como proxy) |

---

## Estructura de carpetas

```
src/
├── api/
│   ├── axios.ts        # instancia axios con interceptores JWT y errores
│   └── services.ts     # funciones de API agrupadas por dominio (authApi, clienteApi, etc.)
├── components/
│   ├── layout/         # AppLayout (sidebar + header + outlet)
│   ├── shared/         # Modal, Pagination, ConfirmDialog, Skeleton, EmptyState, etc.
│   ├── dashboard/      # KpiCards, GraficoVentas, TopProductos, PrediccionStock, etc.
│   ├── pedidos/        # PedidosTable, PedidoModal, TallaInfoBox
│   ├── productos/      # ProductosTable, ProductoModal
│   ├── reportes/       # ReportesPDF, ReportesExcel, SelectorMesAnio
│   └── NTAssistant/    # Chat con IA flotante
├── hooks/
│   ├── useRole.ts      # isAdmin / isOperario / canCreate / canEdit / canDelete
│   ├── usePagination.ts
│   └── useNTAssistant.ts
├── router/
│   └── index.tsx       # rutas, PrivateRoute, PublicRoute
├── stores/
│   ├── auth.store.ts   # useAuthStore (persisted)
│   └── index.ts        # useClienteStore, useProductoStore, usePedidoStore,
│                       #   useInsumoStore, useDashboardStore
├── types/
│   └── index.ts        # todas las interfaces y DTOs del dominio
└── views/              # componentes de página (uno por ruta)
```

---

## Cómo se llama al backend

### Instancia axios (`src/api/axios.ts`)
- `baseURL` = `VITE_API_URL` (variable de entorno)
- Timeout: 15 s
- **Request interceptor**: inyecta `Authorization: Bearer <token>` desde `localStorage.access_token`
- **Response interceptor**: manejo centralizado — 401 limpia auth y redirige a `/login`; para silenciar el toast en un request específico, pasar el header `x-silent: true`

### Capa de servicios (`src/api/services.ts`)
Objetos con métodos por dominio:
```ts
authApi, clienteApi, productoApi, pedidoApi,
insumoApi, kardexApi, reportesApi, auditoriaApi, dashboardApi
```
Todos los métodos retornan la promesa de axios directamente; el store o el componente hace `.data`.

### Proxy de desarrollo (vite.config.ts)
`/api/*` → `http://localhost:3000` (remueve el prefijo `/api`). Los services NO usan este prefijo; hablan directo al `baseURL`.

---

## Estado global (Zustand)

- **Auth** (`auth.store.ts`): persistido en `localStorage` como `nt-auth`. Guarda `user`, `token`, `isAuthenticated`.
- **Dominio** (`stores/index.ts`): un store por entidad con `fetchAll`, `create`, `update`, `remove`. Los stores actualizan el array local tras cada mutación (no refetchean todo).
- Patrón de uso en componentes:
  ```ts
  const clientes  = useClienteStore(s => s.clientes);
  const fetchAll  = useClienteStore(s => s.fetchAll);
  ```

---

## Autenticación y roles

- JWT guardado en `localStorage` como `access_token`
- Validez chequeada client-side decodificando el payload (`exp`)
- Roles: `admin` | `operario`
- Hook `useRole()` expone: `isAdmin`, `isOperario`, `canCreate`, `canEdit`, `canDelete`
- Solo `admin` puede crear / editar / eliminar (operario es lectura + movimiento de pedidos)
- La ruta `/seguimiento/:id` y `/seguimiento/token/:token` son **públicas** (cliente externo ve estado del pedido)

---

## Rutas

| Path | Vista | Acceso |
|---|---|---|
| `/login` | LoginView | público |
| `/dashboard` | DashboardView | privado |
| `/pedidos` | PedidosView | privado |
| `/timeline` | TimelineView | privado |
| `/productos` | ProductosView | privado |
| `/insumos` | InsumosView | privado (admin) |
| `/kardex` | KardexView | privado (admin) |
| `/clientes` | ClientesView | privado (admin) |
| `/reportes` | ReportesView | privado (admin) |
| `/reporte-diario` | ReporteDiarioView | privado (admin) |
| `/auditoria` | AuditoriaView | privado (admin) |
| `/seguimiento/:id` | SeguimientoView | público |

---

## Convenciones de nombres

- **Vistas**: `[Dominio]View.tsx` (ej. `PedidosView.tsx`)
- **Modales/formularios**: `[Dominio]Modal.tsx` (ej. `PedidoModal.tsx`)
- **Tablas**: `[Dominio]Table.tsx` (ej. `ProductosTable.tsx`)
- **Stores**: `use[Dominio]Store` (ej. `useProductoStore`)
- **APIs**: `[dominio]Api` (ej. `productoApi`)
- **DTOs**: `Create[Dominio]Dto` / `Update[Dominio]Dto`
- **IDs de entidades**: `id_[entidad]` en snake_case (ej. `id_pedido`, `id_cliente`) — viene del backend
- **IDs en DTOs de creación**: camelCase (ej. `clienteId`, `productoId`)
- **Path alias**: `@/` = `src/`
- **Idioma**: código y entidades en español; tipos de status como string literals en español (ej. `'Pendiente' | 'Terminado'`)

---

## Tema visual (Tailwind)

Paleta personalizada tipo "tienda de calzado premium":
- `cafe-{50..950}`: marrón oscuro (color principal de UI, sidebar)
- `dorado-{100..600}`: dorado (acentos, badges admin)
- `crema` / `crema-dark`: fondos claros
- `surface-border`: bordes de cards e inputs

Fuentes: `font-display` = Playfair Display, `font-body` = DM Sans, `font-mono` = JetBrains Mono

Clases de utilidad globales definidas en `src/index.css`:
`btn-primary`, `btn-secondary`, `btn-ghost`, `card`, `card-flat`, `kpi-card`,
`input`, `input-error`, `label`, `select`, `badge`, `badge-[estado]`,
`table`, `table-container`, `modal-overlay`, `modal-panel`, `nav-item`, `nav-item-active`

---

## Estados de pedido (pipeline de producción)

```
Pendiente → Cortado → Aparado → Solado → Empaque → Terminado
```
Tipo: `EstadoPedido` en `src/types/index.ts`

---

## Variables de entorno

```env
VITE_API_URL=http://localhost:3000   # URL base del backend
```

---

## Scripts

```bash
npm run dev      # servidor de desarrollo (puerto 5173)
npm run build    # tsc + vite build
npm run lint     # eslint
npm run preview  # preview del build
```

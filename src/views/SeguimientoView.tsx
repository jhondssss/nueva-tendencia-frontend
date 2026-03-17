import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import { CheckCircle2, Clock, AlertCircle, Package, User, Calendar, Ruler } from 'lucide-react';
import type { EstadoPedido } from '@/types';

interface PedidoPublico {
    id_pedido:      number;
    cliente:        string;
    producto:       string;
    imagen?:        string;
    cantidad:       number;
    unidad:         string;
    cantidad_pares: number;
    fecha_entrega:  string;
    estado:         EstadoPedido;
    talles?:        { talla: number; cantidad_pares: number }[];
}


const ESTADOS: EstadoPedido[] = ['Pendiente', 'Cortado', 'Aparado', 'Solado', 'Empaque', 'Terminado'];

const ESTADO_LABELS: Record<EstadoPedido, string> = {
    Pendiente: 'Pendiente',
    Cortado:   'Cortado',
    Aparado:   'Aparado',
    Solado:    'Solado',
    Empaque:   'Empaque',
    Terminado: 'Terminado',
};

const UNIDAD_LABELS: Record<string, string> = {
    docena:       'Docena',
    media_docena: 'Media Docena',
    par:          'Par',
};

function formatFecha(iso: string) {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('es-HN', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function SeguimientoView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [pedido, setPedido]   = useState<PedidoPublico | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);

    useEffect(() => {
        if (!id) { setError('ID de pedido inválido.'); setLoading(false); return; }

        api
            .get<PedidoPublico>(`/publico/pedido/${id}`)
            .then(res => setPedido(res.data))
            .catch(err => {
                const status = err?.response?.status;
                if (status === 404) setError('No encontramos un pedido con ese código. Verifica el enlace.');
                else setError('No pudimos cargar el pedido. Intenta nuevamente más tarde.');
            })
            .finally(() => setLoading(false));
    }, [id]);

    const currentIndex = pedido ? ESTADOS.indexOf(pedido.estado) : -1;

    return (
        <div className="min-h-screen bg-crema flex flex-col">
            {/* Header */}
            <header className="bg-cafe-gradient shadow-md">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-dorado-400 flex items-center justify-center text-cafe-900 font-bold text-sm shrink-0">
                        NT
                    </div>
                    <div>
                        <p className="text-white font-semibold text-sm leading-tight">Calzados Nueva Tendencia</p>
                        <p className="text-cafe-200 text-xs">Seguimiento de pedido</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">

                {/* Loading */}
                {loading && (
                    <div className="card p-8 flex flex-col items-center gap-4 text-center">
                        <div className="w-10 h-10 border-4 border-cafe-200 border-t-cafe-600 rounded-full animate-spin" />
                        <p className="text-cafe-600 text-sm">Cargando información del pedido…</p>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="card p-8 flex flex-col items-center gap-4 text-center">
                        <AlertCircle className="w-12 h-12 text-red-400" />
                        <div>
                            <p className="font-semibold text-cafe-900 mb-1">Pedido no encontrado</p>
                            <p className="text-cafe-500 text-sm">{error}</p>
                        </div>
                        <button
                            onClick={() => navigate(-1)}
                            className="btn-secondary mt-2"
                        >
                            Volver
                        </button>
                    </div>
                )}

                {/* Pedido */}
                {!loading && pedido && (
                    <>
                        {/* ID + Estado */}
                        <div className="card p-5 flex items-start justify-between gap-4 flex-wrap">
                            <div>
                                <p className="text-xs text-cafe-400 uppercase tracking-widest mb-0.5">Pedido</p>
                                <p className="text-2xl font-bold text-cafe-900">#{pedido.id_pedido}</p>
                            </div>
                            <span className={`badge ${pedido.estado === 'Terminado' ? 'badge-terminado' : 'badge-' + pedido.estado.toLowerCase()}`}>
                                {pedido.estado}
                            </span>
                        </div>

                        {/* Barra de progreso */}
                        <div className="card p-5">
                            <p className="text-xs text-cafe-500 uppercase tracking-widest mb-4">Progreso del pedido</p>
                            <div className="relative">
                                {/* Línea de fondo */}
                                <div className="absolute top-4 left-4 right-4 h-0.5 bg-cafe-100" />
                                {/* Línea de progreso */}
                                {currentIndex > 0 && (
                                    <div
                                        className="absolute top-4 left-4 h-0.5 bg-green-500 transition-all duration-500"
                                        style={{ width: `calc(${(currentIndex / (ESTADOS.length - 1)) * 100}% - 8px)` }}
                                    />
                                )}
                                {/* Pasos */}
                                <div className="relative flex justify-between">
                                    {ESTADOS.map((estado, i) => {
                                        const done    = i < currentIndex;
                                        const current = i === currentIndex;
                                        const future  = i > currentIndex;
                                        return (
                                            <div key={estado} className="flex flex-col items-center gap-1.5 w-14">
                                                <div
                                                    className={[
                                                        'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                                                        done    ? 'bg-green-500 border-green-500 text-white'    : '',
                                                        current ? 'bg-blue-500  border-blue-500  text-white ring-4 ring-blue-100' : '',
                                                        future  ? 'bg-white border-cafe-200 text-cafe-300' : '',
                                                    ].join(' ')}
                                                >
                                                    {done
                                                        ? <CheckCircle2 className="w-4 h-4" />
                                                        : current
                                                            ? <Clock className="w-4 h-4" />
                                                            : <span className="text-xs font-semibold">{i + 1}</span>
                                                    }
                                                </div>
                                                <span className={[
                                                    'text-center leading-tight',
                                                    done    ? 'text-green-700 font-medium text-2xs' : '',
                                                    current ? 'text-blue-700  font-semibold text-2xs' : '',
                                                    future  ? 'text-cafe-300  text-2xs' : '',
                                                ].join(' ')}>
                                                    {ESTADO_LABELS[estado]}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Detalles */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            {/* Cliente */}
                            <div className="card p-4 flex gap-3">
                                <User className="w-5 h-5 text-cafe-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="label">Cliente</p>
                                    <p className="text-cafe-900 font-medium text-sm">
                                        {pedido.cliente || 'N/D'}
                                    </p>
                                </div>
                            </div>

                            {/* Fecha estimada */}
                            <div className="card p-4 flex gap-3">
                                <Calendar className="w-5 h-5 text-cafe-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="label">Fecha estimada de entrega</p>
                                    <p className="text-cafe-900 font-medium text-sm">
                                        {formatFecha(pedido.fecha_entrega)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Producto */}
                        <div className="card overflow-hidden">
                            {pedido.imagen ? (
                                <img
                                    src={pedido.imagen}
                                    alt={pedido.producto}
                                    className="w-full h-48 object-contain bg-gray-50"
                                />
                            ) : (
                                <div className="w-full h-48 bg-gradient-to-br from-crema-dark to-cafe-100 flex flex-col items-center justify-center gap-3">
                                    <div className="w-16 h-16 rounded-full bg-white/60 flex items-center justify-center">
                                        <Package className="w-8 h-8 text-cafe-400" />
                                    </div>
                                    <span className="text-cafe-300 text-xs tracking-wide">Sin imagen disponible</span>
                                </div>
                            )}
                            <div className="p-4 space-y-3">
                                <div>
                                    <p className="text-2xs text-cafe-400 uppercase tracking-widest">Producto</p>
                                    <p className="text-cafe-900 font-bold text-xl leading-tight mt-0.5">
                                        {pedido.producto || 'N/D'}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center bg-cafe-100 text-cafe-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                                        {pedido.cantidad} {UNIDAD_LABELS[pedido.unidad] ?? pedido.unidad}
                                    </span>
                                    <span className="inline-flex items-center bg-dorado-200 text-dorado-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                                        {pedido.cantidad_pares} pares
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Tallas */}
                        {pedido.talles && pedido.talles.length > 0 && (
                            <div className="card p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Ruler className="w-4 h-4 text-cafe-400" />
                                    <p className="label mb-0">Tallas</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {pedido.talles.map((t, i) => (
                                        <div
                                            key={i}
                                            className="flex flex-col items-center bg-crema-dark border border-surface-border rounded px-3 py-1.5 min-w-[52px]"
                                        >
                                            <span className="text-cafe-900 font-semibold text-sm">{t.talla}</span>
                                            <span className="text-cafe-400 text-2xs">{t.cantidad_pares} par{t.cantidad_pares !== 1 ? 'es' : ''}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            <footer className="text-center py-4 text-2xs text-cafe-300">
                Calzados Nueva Tendencia &copy; {new Date().getFullYear()}
            </footer>
        </div>
    );
}

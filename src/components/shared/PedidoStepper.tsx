import { CheckCircle2, Clock } from 'lucide-react';
import type { EstadoPedido } from '@/types';
import { Card, CardContent } from '@/components/ui/card';

export const ESTADOS_PEDIDO: EstadoPedido[] = ['Pendiente', 'Cortado', 'Aparado', 'Solado', 'Empaque', 'Terminado'];

const ESTADO_LABELS: Record<EstadoPedido, string> = {
    Pendiente: 'Pendiente',
    Cortado:   'Cortado',
    Aparado:   'Aparado',
    Solado:    'Solado',
    Empaque:   'Empaque',
    Terminado: 'Terminado',
};

interface Props { estado: EstadoPedido; }

/** Barra de progreso del pipeline de producción, reutilizada en SeguimientoView (público) y MisPedidoDetalleView (portal cliente). */
export default function PedidoStepper({ estado }: Props) {
    const currentIndex = ESTADOS_PEDIDO.indexOf(estado);

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Progreso del pedido</p>
                <div className="relative">
                    {/* Línea de fondo */}
                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-border" />
                    {/* Línea de progreso */}
                    {currentIndex > 0 && (
                        <div
                            className="absolute top-4 left-4 h-0.5 bg-secondary transition-all duration-500"
                            style={{ width: `calc(${(currentIndex / (ESTADOS_PEDIDO.length - 1)) * 100}% - 8px)` }}
                        />
                    )}
                    {/* Pasos */}
                    <div className="relative flex justify-between">
                        {ESTADOS_PEDIDO.map((paso, i) => {
                            const done    = i < currentIndex;
                            const current = i === currentIndex;
                            const future  = i > currentIndex;
                            return (
                                <div key={paso} className="flex flex-col items-center gap-1.5 w-14">
                                    <div
                                        className={[
                                            'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                                            done    ? 'bg-secondary border-secondary text-secondary-foreground'    : '',
                                            current ? 'bg-primary  border-primary  text-primary-foreground ring-4 ring-primary/20' : '',
                                            future  ? 'bg-card border-border text-muted-foreground' : '',
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
                                        done    ? 'text-secondary font-medium text-2xs' : '',
                                        current ? 'text-primary  font-semibold text-2xs' : '',
                                        future  ? 'text-muted-foreground text-2xs' : '',
                                    ].join(' ')}>
                                        {ESTADO_LABELS[paso]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

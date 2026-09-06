import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { CategoriaCalzado } from '@/types';

const TALLAS_POR_CATEGORIA: Record<CategoriaCalzado, { talla: number; pares: number }[]> = {
    nino:    [27,28,29,30,31,32].map(t => ({ talla: t, pares: 2 })),
    juvenil: [{ talla:33, pares:2 }, { talla:34, pares:4 }, { talla:35, pares:2 }, { talla:36, pares:4 }],
    adulto:  [37,38,39,40,41,42].map(t => ({ talla: t, pares: 2 })),
};

const CATEGORIA_INFO: Record<CategoriaCalzado, { label: string; rango: string }> = {
    nino:    { label: 'Niño',    rango: 'Tallas 27–32' },
    juvenil: { label: 'Juvenil', rango: 'Tallas 33–36' },
    adulto:  { label: 'Adulto',  rango: 'Tallas 37–42' },
};

/**
 * Acento cromático por categoría — cognac / verde / dorado, coherente con el resto del sistema.
 * Clases completas y literales (no interpoladas) para que el JIT de Tailwind las detecte en build-time.
 */
const CATEGORIA_ACCENT_TEXT: Record<CategoriaCalzado, string> = {
    nino:    'text-chart-1',
    juvenil: 'text-chart-2',
    adulto:  'text-chart-3',
};

const CATEGORIA_ACCENT_BADGE: Record<CategoriaCalzado, string> = {
    nino:    'bg-chart-1/10 text-chart-1 border-chart-1/30',
    juvenil: 'bg-chart-2/10 text-chart-2 border-chart-2/30',
    adulto:  'bg-chart-3/10 text-chart-3 border-chart-3/30',
};

export { TALLAS_POR_CATEGORIA, CATEGORIA_INFO, CATEGORIA_ACCENT_TEXT, CATEGORIA_ACCENT_BADGE };

export interface TallaItem { talla: number; cantidad_pares: number; }

export function defaultTallas(categoria: CategoriaCalzado): TallaItem[] {
    return TALLAS_POR_CATEGORIA[categoria].map(t => ({ talla: t.talla, cantidad_pares: t.pares }));
}

interface Props {
    categoria: CategoriaCalzado;
    editable?: boolean;
    value?:    TallaItem[];
    onChange?: (tallas: TallaItem[]) => void;
    cantidad?: number;
}

export default function TallaInfoBox({ categoria, editable = false, value, onChange, cantidad = 1 }: Props) {
    const info       = CATEGORIA_INFO[categoria];
    const accentText = CATEGORIA_ACCENT_TEXT[categoria];
    const tallas     = value ?? defaultTallas(categoria);
    const total      = tallas.reduce((s, t) => s + t.cantidad_pares, 0);
    const totalFinal = total * cantidad;
    const esMultiploDeDocena = totalFinal > 0 && totalFinal % 12 === 0;
    const docenas    = totalFinal / 12;

    const handleChange = (talla: number, raw: string) => {
        const v = Math.max(0, Math.min(20, parseInt(raw) || 0));
        onChange?.(tallas.map(t => t.talla === talla ? { ...t, cantidad_pares: v } : t));
    };

    if (!editable) {
        return (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                <p className="text-xs text-muted-foreground font-medium">
                    Distribución por docena — <span className={`${accentText} font-semibold`}>{info.label} ({info.rango})</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {tallas.map(({ talla, cantidad_pares }) => (
                        <span key={talla}
                              className="text-xs px-2 py-0.5 rounded-md bg-card border border-border text-foreground font-mono">
                            T{talla}×{cantidad_pares}
                        </span>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">= {total} pares por docena</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
            <p className="text-xs text-muted-foreground font-medium">
                Distribución por docena — <span className={`${accentText} font-semibold`}>{info.label} ({info.rango})</span>
            </p>
            <div className="flex flex-wrap gap-3">
                {tallas.map(({ talla, cantidad_pares }) => (
                    <div key={talla} className="flex flex-col items-center gap-1">
                        <span className="text-2xs text-muted-foreground font-mono">T{talla}</span>
                        <Input
                            type="number"
                            min={0}
                            max={20}
                            value={cantidad_pares}
                            onChange={e => handleChange(talla, e.target.value)}
                            className="w-12 h-8 text-center px-1 text-xs font-mono text-foreground"
                        />
                    </div>
                ))}
            </div>
            {esMultiploDeDocena ? (
                <p className="flex items-center gap-1.5 text-xs text-chart-2 font-medium">
                    <CheckCircle2 size={13} /> Total: {totalFinal} pares ({docenas} {docenas === 1 ? 'docena' : 'docenas'})
                </p>
            ) : (
                <p className="flex items-center gap-1.5 text-xs text-chart-3 font-medium">
                    <AlertTriangle size={13} /> Total: {totalFinal} pares (no es múltiplo de una docena)
                </p>
            )}
        </div>
    );
}

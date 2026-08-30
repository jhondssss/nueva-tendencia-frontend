import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ReporteFiltrosPedidos, CategoriaCalzado } from '@/types';
import { limpiarFiltrosPedidos } from './reporteFiltrosUtils';

const CATEGORIA_OPTIONS: { value: CategoriaCalzado; label: string }[] = [
    { value: 'nino',    label: 'Niño' },
    { value: 'juvenil', label: 'Juvenil' },
    { value: 'adulto',  label: 'Adulto' },
];

function contarFiltrosActivos(f: ReporteFiltrosPedidos): number {
    return Object.keys(limpiarFiltrosPedidos(f)).length;
}

interface Props {
    value:    ReporteFiltrosPedidos;
    onChange: (value: ReporteFiltrosPedidos) => void;
}

export default function FiltrosPedidosReporte({ value, onChange }: Props) {
    const [abierto, setAbierto] = useState(false);
    const activos = contarFiltrosActivos(value);

    const set = (patch: Partial<ReporteFiltrosPedidos>) => onChange({ ...value, ...patch });

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => setAbierto(a => !a)}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    {abierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    Filtros
                    {activos > 0 && (
                        <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-secondary/20 text-secondary text-[10px] font-semibold leading-none">
                            {activos}
                        </span>
                    )}
                </button>
                {activos > 0 && (
                    <button
                        type="button"
                        onClick={() => onChange({})}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors underline-offset-2 hover:underline">
                        Limpiar
                    </button>
                )}
            </div>

            {abierto && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                    <input
                        type="text"
                        placeholder="Cliente"
                        value={value.cliente ?? ''}
                        onChange={e => set({ cliente: e.target.value })}
                        className="input text-xs col-span-2 sm:col-span-1" />
                    <input
                        type="text"
                        placeholder="Producto"
                        value={value.producto ?? ''}
                        onChange={e => set({ producto: e.target.value })}
                        className="input text-xs col-span-2 sm:col-span-1" />
                    <select
                        value={value.categoria ?? ''}
                        onChange={e => set({ categoria: (e.target.value || undefined) as CategoriaCalzado | undefined })}
                        className="select text-xs col-span-2">
                        <option value="">Todas las categorías</option>
                        {CATEGORIA_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-medium text-muted-foreground">Desde</label>
                        <input
                            type="date"
                            value={value.desde ?? ''}
                            onChange={e => set({ desde: e.target.value || undefined })}
                            className="input text-xs" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-medium text-muted-foreground">Hasta</label>
                        <input
                            type="date"
                            value={value.hasta ?? ''}
                            onChange={e => set({ hasta: e.target.value || undefined })}
                            className="input text-xs" />
                    </div>
                </div>
            )}
        </div>
    );
}

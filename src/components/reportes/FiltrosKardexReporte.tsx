import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ReporteFiltrosKardex, TipoMovimiento, OrigenMovimiento } from '@/types';
import { useInsumoStore } from '@/stores/index';
import SearchableSelect from '@/components/shared/SearchableSelect';
import { limpiarFiltrosKardex } from './reporteFiltrosUtils';

const TIPO_OPTIONS: { value: TipoMovimiento; label: string }[] = [
    { value: 'entrada', label: 'Entrada' },
    { value: 'salida',  label: 'Salida' },
    { value: 'ajuste',  label: 'Ajuste' },
];

const ORIGEN_OPTIONS: { value: OrigenMovimiento; label: string }[] = [
    { value: 'manual',     label: 'Manual' },
    { value: 'automatico', label: 'Automático' },
];

function contarFiltrosActivos(f: ReporteFiltrosKardex): number {
    return Object.keys(limpiarFiltrosKardex(f)).length;
}

interface Props {
    value:    ReporteFiltrosKardex;
    onChange: (value: ReporteFiltrosKardex) => void;
}

export default function FiltrosKardexReporte({ value, onChange }: Props) {
    const [abierto, setAbierto] = useState(false);
    const activos = contarFiltrosActivos(value);

    const { insumos, categorias, fetchAll: fetchInsumos, fetchCategorias } = useInsumoStore();

    useEffect(() => {
        if (insumos.length === 0)   fetchInsumos();
        if (categorias.length === 0) fetchCategorias();
    }, [insumos.length, categorias.length, fetchInsumos, fetchCategorias]);

    const set = (patch: Partial<ReporteFiltrosKardex>) => onChange({ ...value, ...patch });

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

                    <div className="col-span-2">
                        <SearchableSelect
                            value={value.insumo_id}
                            onChange={id => set({ insumo_id: id })}
                            options={insumos.map(i => ({ id: i.id_insumo, label: i.nombre }))}
                            placeholder="Buscar insumo..." />
                    </div>

                    <select
                        value={value.tipo ?? ''}
                        onChange={e => set({ tipo: (e.target.value || undefined) as TipoMovimiento | undefined })}
                        className="select text-xs">
                        <option value="">Todos los tipos</option>
                        {TIPO_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>

                    <select
                        value={value.origen ?? ''}
                        onChange={e => set({ origen: (e.target.value || undefined) as OrigenMovimiento | undefined })}
                        className="select text-xs">
                        <option value="">Todos los orígenes</option>
                        {ORIGEN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>

                    <select
                        value={value.categoria_insumo_id ?? ''}
                        onChange={e => set({ categoria_insumo_id: e.target.value ? Number(e.target.value) : undefined })}
                        className="select text-xs col-span-2">
                        <option value="">Todas las categorías</option>
                        {categorias.filter(c => c.activo).map(c => (
                            <option key={c.id_categoria_insumo} value={c.id_categoria_insumo}>{c.nombre}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}

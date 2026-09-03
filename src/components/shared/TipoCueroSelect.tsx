import SearchableSelect from '@/components/shared/SearchableSelect';
import type { Insumo } from '@/types';

interface Props {
    insumos: Insumo[];
    value:   number | undefined;
    onChange: (id: number | undefined) => void;
}

/** Combobox de insumos de categoría "cuero", usado en PedidoModal y AprobarSolicitudModal. */
export default function TipoCueroSelect({ insumos, value, onChange }: Props) {
    return (
        <div>
            <label className="label">Tipo de Cuero</label>
            <SearchableSelect
                value={value}
                onChange={onChange}
                options={insumos.filter(i => i.categoria.nombre === 'cuero').map(i => ({ id: i.id_insumo, label: i.nombre }))}
                placeholder="Sin especificar" />
        </div>
    );
}

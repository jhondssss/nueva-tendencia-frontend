import type { CategoriaCalzado } from '@/types';

const CATEGORIA_OPTIONS: { value: CategoriaCalzado; label: string }[] = [
    { value: 'nino',    label: 'Niño' },
    { value: 'juvenil', label: 'Juvenil' },
    { value: 'adulto',  label: 'Adulto' },
];

interface Props {
    value:    CategoriaCalzado | undefined;
    onChange: (value: CategoriaCalzado | undefined) => void;
}

export default function FiltroCategoria({ value, onChange }: Props) {
    return (
        <select
            value={value ?? ''}
            onChange={e => onChange((e.target.value || undefined) as CategoriaCalzado | undefined)}
            className="select text-sm">
            <option value="">Todas las categorías</option>
            {CATEGORIA_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
    );
}

const MESES = [
    { value: 1,  label: 'Enero' },     { value: 2,  label: 'Febrero' },
    { value: 3,  label: 'Marzo' },     { value: 4,  label: 'Abril' },
    { value: 5,  label: 'Mayo' },      { value: 6,  label: 'Junio' },
    { value: 7,  label: 'Julio' },     { value: 8,  label: 'Agosto' },
    { value: 9,  label: 'Septiembre' },{ value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
];

export { MESES };

interface Props {
    mes:          number;
    anio:         number;
    onMesChange:  (mes: number) => void;
    onAnioChange: (anio: number) => void;
    maxAnio?:     number;
}

export default function SelectorMesAnio({ mes, anio, onMesChange, onAnioChange, maxAnio }: Props) {
    const currentYear = new Date().getFullYear();
    const max = maxAnio ?? currentYear + 1;

    return (
        <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-cafe-600">Mes</label>
                <select value={mes} onChange={e => onMesChange(Number(e.target.value))} className="select text-sm">
                    {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-cafe-600">Año</label>
                <input type="number" value={anio} min={2020} max={max}
                       onChange={e => onAnioChange(Number(e.target.value))}
                       className="input text-sm w-24" />
            </div>
        </div>
    );
}

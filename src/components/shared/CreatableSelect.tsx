import { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';

export interface CreatableOption {
    id:     number;
    nombre: string;
    activo: boolean;
}

interface NullOption {
    label: string;
}

interface CreatableSelectProps {
    value:         number | null | undefined;
    onChange:      (id: number | null) => void;
    options:       CreatableOption[];
    onCreate:      (nombre: string) => Promise<CreatableOption>;
    placeholder:   string;
    newLabel:      string;
    /** Habilita una opción seleccionable de "sin valor" (ej. "Sin categoría"). Si se omite, el campo es requerido. */
    nullOption?:   NullOption;
    /** Si es false, no se ofrece la opción de crear (ej. usuario sin rol admin). */
    canCreateNew?: boolean;
    error?:        string;
    disabled?:     boolean;
}

const NEW_VALUE = '__new__';

export default function CreatableSelect({
    value, onChange, options, onCreate,
    placeholder, newLabel,
    nullOption, canCreateNew = true, error, disabled,
}: CreatableSelectProps) {
    const [adding, setAdding] = useState(false);
    const [nombre, setNombre] = useState('');
    const [saving, setSaving] = useState(false);

    const selectValue = adding ? NEW_VALUE : (value == null ? '' : String(value));

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const v = e.target.value;
        if (v === NEW_VALUE) {
            setNombre('');
            setAdding(true);
            return;
        }
        onChange(v === '' ? null : Number(v));
    };

    const handleCreate = async () => {
        const trimmed = nombre.trim();
        if (!trimmed || saving) return;
        setSaving(true);
        try {
            const created = await onCreate(trimmed);
            onChange(created.id);
            setAdding(false);
            setNombre('');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setAdding(false);
        setNombre('');
    };

    return (
        <div>
            <select
                value={selectValue}
                onChange={handleSelectChange}
                disabled={disabled || adding}
                className={`select ${error ? 'input-error' : ''}`}
            >
                {nullOption
                    ? <option value="">{nullOption.label}</option>
                    : <option value="" disabled>{placeholder}</option>}
                {options.filter(o => o.activo).map(o => (
                    <option key={o.id} value={o.id}>{o.nombre}</option>
                ))}
                {canCreateNew && <option value={NEW_VALUE}>{newLabel}</option>}
            </select>
            {error && <p className="text-destructive text-xs mt-1">{error}</p>}

            {adding && (
                <div className="flex items-center gap-2 mt-2">
                    <input
                        autoFocus
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); handleCreate(); }
                            if (e.key === 'Escape') { e.preventDefault(); handleCancel(); }
                        }}
                        placeholder="Nombre de la nueva opción"
                        className="input flex-1"
                    />
                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={!nombre.trim() || saving}
                        aria-label="Guardar"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md
                                   text-secondary hover:bg-secondary/10 transition-colors
                                   disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    </button>
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={saving}
                        aria-label="Cancelar"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md
                                   text-muted-foreground hover:bg-muted transition-colors
                                   disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}

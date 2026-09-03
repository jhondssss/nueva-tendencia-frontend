import { useEffect, useRef, useState } from 'react';
import { Check, X, Loader2, ChevronDown } from 'lucide-react';

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

/** Combobox con búsqueda client-side + creación inline de opciones nuevas. */
export default function CreatableSelect({
    value, onChange, options, onCreate,
    placeholder, newLabel,
    nullOption, canCreateNew = true, error, disabled,
}: CreatableSelectProps) {
    const [open, setOpen]     = useState(false);
    const [query, setQuery]   = useState('');
    const [adding, setAdding] = useState(false);
    const [nombre, setNombre] = useState('');
    const [saving, setSaving] = useState(false);
    const containerRef        = useRef<HTMLDivElement>(null);

    const activeOptions = options.filter(o => o.activo);
    const selected = value == null ? null : activeOptions.find(o => o.id === value);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = query.trim()
        ? activeOptions.filter(o => o.nombre.toLowerCase().includes(query.trim().toLowerCase()))
        : activeOptions;

    const handleSelect = (id: number | null) => {
        onChange(id);
        setOpen(false);
        setQuery('');
    };

    const handleStartCreate = () => {
        setNombre(query.trim());
        setAdding(true);
        setOpen(false);
        setQuery('');
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

    const displayValue = open
        ? query
        : (selected ? selected.nombre : (value == null && nullOption ? nullOption.label : ''));

    return (
        <div ref={containerRef} className="relative">
            <input
                type="text"
                value={displayValue}
                onChange={e => { setQuery(e.target.value); if (!open) setOpen(true); }}
                onFocus={() => setOpen(true)}
                placeholder={placeholder}
                disabled={disabled || adding}
                className={`input pr-8 w-full ${error ? 'input-error' : ''}`}
            />
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            {error && <p className="text-destructive text-xs mt-1">{error}</p>}

            {open && !adding && (
                <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-surface-border bg-white shadow-md">
                    {nullOption && (
                        <button
                            type="button"
                            onClick={() => handleSelect(null)}
                            className={`w-full text-left px-3 py-1.5 text-sm hover:bg-crema transition-colors
                                        ${value == null ? 'bg-dorado-100/40 text-cafe-900 font-medium' : 'text-cafe-800'}`}>
                            {nullOption.label}
                        </button>
                    )}
                    {filtered.length === 0 && !canCreateNew && (
                        <p className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</p>
                    )}
                    {filtered.map(o => (
                        <button
                            key={o.id}
                            type="button"
                            onClick={() => handleSelect(o.id)}
                            className={`w-full text-left px-3 py-1.5 text-sm hover:bg-crema transition-colors
                                        ${o.id === value ? 'bg-dorado-100/40 text-cafe-900 font-medium' : 'text-cafe-800'}`}>
                            {o.nombre}
                        </button>
                    ))}
                    {canCreateNew && (
                        <button
                            type="button"
                            onClick={handleStartCreate}
                            className="w-full text-left px-3 py-1.5 text-sm text-secondary hover:bg-secondary/10
                                       transition-colors border-t border-surface-border">
                            {query.trim() ? `${newLabel} "${query.trim()}"` : newLabel}
                        </button>
                    )}
                </div>
            )}

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

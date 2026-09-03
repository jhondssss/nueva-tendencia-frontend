import { useEffect, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

export interface SearchableOption {
    id:    number;
    label: string;
}

interface Props {
    value:       number | undefined;
    onChange:    (id: number | undefined) => void;
    options:     SearchableOption[];
    placeholder: string;
    className?:  string;
}

/** Combobox con búsqueda client-side, para listas cargadas por completo (sin paginación en el backend). */
export default function SearchableSelect({ value, onChange, options, placeholder, className }: Props) {
    const [open, setOpen]   = useState(false);
    const [query, setQuery] = useState('');
    const containerRef      = useRef<HTMLDivElement>(null);

    const selected = options.find(o => o.id === value);

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
        ? options.filter(o => o.label.toLowerCase().includes(query.trim().toLowerCase()))
        : options;

    return (
        <div ref={containerRef} className={`relative ${className ?? ''}`}>
            <input
                type="text"
                value={open ? query : (selected?.label ?? '')}
                onChange={e => { setQuery(e.target.value); if (!open) setOpen(true); }}
                onFocus={() => setOpen(true)}
                placeholder={placeholder}
                className="input text-xs pr-14 w-full" />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                {selected && (
                    <button
                        type="button"
                        onClick={() => { onChange(undefined); setQuery(''); }}
                        aria-label="Limpiar selección"
                        className="p-0.5 rounded hover:bg-muted text-muted-foreground transition-colors">
                        <X size={12} />
                    </button>
                )}
                <ChevronDown size={12} className="text-muted-foreground" />
            </div>
            {open && (
                <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                    {filtered.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-muted-foreground">Sin resultados</p>
                    ) : filtered.map(o => (
                        <button
                            key={o.id}
                            type="button"
                            onClick={() => { onChange(o.id); setOpen(false); setQuery(''); }}
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors
                                        ${o.id === value ? 'bg-secondary/10 text-secondary font-medium' : ''}`}>
                            {o.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

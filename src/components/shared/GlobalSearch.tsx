import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Package, ShoppingBag, Loader2 } from 'lucide-react';
import {
    CommandDialog, CommandInput, CommandList,
    CommandEmpty, CommandGroup, CommandItem,
} from '@/components/ui/command';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { useCommandPaletteStore } from '@/stores/commandPalette.store';
import type { SearchResultItem } from '@/types';

export default function GlobalSearch() {
    const open = useCommandPaletteStore(s => s.open);
    const setOpen = useCommandPaletteStore(s => s.setOpen);
    const toggle = useCommandPaletteStore(s => s.toggle);
    const navigate = useNavigate();
    const { query, setQuery, results, isLoading, hasResults, reset } = useGlobalSearch();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                toggle();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [toggle]);

    const handleOpenChange = useCallback((next: boolean) => {
        setOpen(next);
        if (!next) reset();
    }, [reset]);

    const goTo = useCallback((path: string) => {
        setOpen(false);
        reset();
        navigate(path);
    }, [navigate, reset]);

    const trimmed = query.trim();
    const showEmpty = trimmed.length < 2;

    return (
        <CommandDialog open={open} onOpenChange={handleOpenChange} shouldFilter={false}>
            <CommandInput
                placeholder="Buscar clientes, productos, pedidos..."
                value={query}
                onValueChange={setQuery}
            />
            <CommandList>
                {showEmpty && (
                    <CommandEmpty>Escribí para buscar...</CommandEmpty>
                )}
                {!showEmpty && isLoading && (
                    <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
                    </div>
                )}
                {!showEmpty && !isLoading && !hasResults && (
                    <CommandEmpty>Sin resultados para "{trimmed}"</CommandEmpty>
                )}
                {!showEmpty && !isLoading && hasResults && (
                    <>
                        <ResultGroup
                            heading="Clientes"
                            icon={Users}
                            items={results.clientes}
                            onSelect={() => goTo('/clientes')}
                        />
                        <ResultGroup
                            heading="Productos"
                            icon={Package}
                            items={results.productos}
                            onSelect={() => goTo('/productos')}
                        />
                        <ResultGroup
                            heading="Pedidos"
                            icon={ShoppingBag}
                            items={results.pedidos}
                            onSelect={() => goTo('/pedidos')}
                        />
                    </>
                )}
            </CommandList>
        </CommandDialog>
    );
}

interface ResultGroupProps {
    heading: string;
    icon: typeof Users;
    items: SearchResultItem[];
    onSelect: (item: SearchResultItem) => void;
}

function ResultGroup({ heading, icon: Icon, items, onSelect }: ResultGroupProps) {
    if (items.length === 0) return null;
    return (
        <CommandGroup heading={heading}>
            {items.map(item => (
                <CommandItem
                    key={`${heading}-${item.id}`}
                    value={`${heading}-${item.id}-${item.titulo}`}
                    onSelect={() => onSelect(item)}
                >
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{item.titulo}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.subtitulo}</p>
                    </div>
                </CommandItem>
            ))}
        </CommandGroup>
    );
}

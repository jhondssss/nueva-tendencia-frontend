import { useEffect } from 'react';
import { Settings2 } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CatalogoManager from '@/components/catalogos/CatalogoManager';
import { CATALOGOS } from '@/components/catalogos/catalogosConfig';
import { useRole } from '@/hooks/useRole';

export default function CatalogosView() {
    const { isAdmin } = useRole();

    useEffect(() => { document.title = 'Catálogos | NT'; }, []);

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-64">
                <EmptyState
                    icon={Settings2}
                    title="Acceso restringido"
                    description="Solo los administradores pueden gestionar los catálogos."
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="page-title section-title">Catálogos</h1>
                <p className="text-sm text-muted-foreground">Categorías, tipos y unidades usados en productos, insumos y clientes</p>
            </div>
            <Tabs defaultValue={CATALOGOS[0].key}>
                <TabsList className="flex-wrap h-auto">
                    {CATALOGOS.map(c => <TabsTrigger key={c.key} value={c.key}>{c.titulo}</TabsTrigger>)}
                </TabsList>
                {CATALOGOS.map(c => (
                    <TabsContent key={c.key} value={c.key}><CatalogoManager config={c} /></TabsContent>
                ))}
            </Tabs>
        </div>
    );
}

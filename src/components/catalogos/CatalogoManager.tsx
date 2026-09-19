import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import type { CatalogoRegistro } from '@/api/services';
import type { CatalogoConfig } from './catalogosConfig';

interface Registro { id: number; nombre: string; activo: boolean }

function mensajeBackend(err: unknown, fallback: string): string {
    const msg = isAxiosError<{ message?: string | string[] }>(err) ? err.response?.data?.message : undefined;
    return Array.isArray(msg) ? msg.join(', ') : msg || fallback;
}

/** CRUD genérico de una entidad de catálogo (nombre + activo). Configurable vía `config`. */
export default function CatalogoManager({ config }: { config: CatalogoConfig }) {
    const { titulo, singular, idKey, api } = config;

    const [items, setItems]           = useState<Registro[]>([]);
    const [isLoading, setIsLoading]   = useState(true);
    const [loadError, setLoadError]   = useState(false);
    const [modalOpen, setModalOpen]   = useState(false);
    const [editTarget, setEditTarget] = useState<Registro | null>(null);
    const [nombre, setNombre]         = useState('');
    const [activo, setActivo]         = useState(true);
    const [formError, setFormError]   = useState<string | null>(null);
    const [saving, setSaving]         = useState(false);
    const [toggling, setToggling]     = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Registro | null>(null);

    const normalizar = useCallback((r: CatalogoRegistro): Registro =>
        ({ id: Number(r[idKey]), nombre: r.nombre, activo: r.activo }), [idKey]);

    const load = useCallback(async () => {
        setIsLoading(true);
        setLoadError(false);
        try {
            const { data } = await api.getAll();
            setItems(data.map(normalizar));
        } catch (err) {
            setLoadError(true);
            toast.error(mensajeBackend(err, `No se pudieron cargar: ${titulo.toLowerCase()}`));
        } finally {
            setIsLoading(false);
        }
    }, [api, normalizar, titulo]);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => {
        setEditTarget(null); setNombre(''); setActivo(true); setFormError(null); setModalOpen(true);
    };
    const openEdit = (r: Registro) => {
        setEditTarget(r); setNombre(r.nombre); setActivo(r.activo); setFormError(null); setModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const limpio = nombre.trim();
        if (!limpio) { setFormError('El nombre es obligatorio'); return; }
        setSaving(true);
        setFormError(null);
        try {
            if (editTarget) {
                const { data } = await api.update(editTarget.id, { nombre: limpio, activo });
                setItems(prev => prev.map(i => i.id === editTarget.id ? normalizar(data) : i));
                toast.success('Registro actualizado');
            } else {
                const { data } = await api.create(limpio);
                setItems(prev => [...prev, normalizar(data)]);
                toast.success('Registro creado');
            }
            setModalOpen(false);
        } catch (err) {
            setFormError(mensajeBackend(err, 'No se pudo guardar'));
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (r: Registro) => {
        setToggling(r.id);
        try {
            const { data } = await api.update(r.id, { activo: !r.activo });
            setItems(prev => prev.map(i => i.id === r.id ? normalizar(data) : i));
        } catch (err) {
            toast.error(mensajeBackend(err, 'No se pudo cambiar el estado'));
        } finally {
            setToggling(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.remove(deleteTarget.id);
            setItems(prev => prev.filter(i => i.id !== deleteTarget.id));
            toast.success('Registro eliminado');
        } catch (err) {
            // 409: en uso. Se muestra el mensaje real del backend (la request va con x-silent).
            toast.error(mensajeBackend(err, 'No se pudo eliminar'));
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-display text-lg text-foreground">{titulo}</h2>
                <Button onClick={openCreate}><Plus size={14} /> Nuevo</Button>
            </div>

            <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>Nombre</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">Cargando...</TableCell>
                            </TableRow>
                        ) : loadError ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                    No se pudo cargar. <button className="underline" onClick={load}>Reintentar</button>
                                </TableCell>
                            </TableRow>
                        ) : items.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">Sin registros</TableCell>
                            </TableRow>
                        ) : items.map(r => (
                            <TableRow key={r.id}>
                                <TableCell className="font-medium text-foreground">{r.nombre}</TableCell>
                                <TableCell>
                                    <Badge variant={r.activo ? 'default' : 'secondary'}>{r.activo ? 'Activo' : 'Inactivo'}</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="icon" disabled={toggling === r.id}
                                                aria-label={r.activo ? `Desactivar ${r.nombre}` : `Activar ${r.nombre}`}
                                                onClick={() => handleToggle(r)}>
                                            {r.activo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                        </Button>
                                        <Button variant="ghost" size="icon" aria-label={`Editar ${r.nombre}`} onClick={() => openEdit(r)}>
                                            <Edit2 size={14} />
                                        </Button>
                                        <Button variant="ghost" size="icon" aria-label={`Eliminar ${r.nombre}`}
                                                onClick={() => setDeleteTarget(r)}>
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
                   title={editTarget ? `Editar ${singular}` : `Nueva ${singular}`} size="sm">
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label htmlFor={`nombre-${config.key}`} className="label">Nombre *</label>
                        <input id={`nombre-${config.key}`} value={nombre} onChange={e => setNombre(e.target.value)}
                               className={`input ${formError ? 'input-error' : ''}`} autoFocus />
                        {formError && <p role="alert" className="text-destructive text-xs mt-1">{formError}</p>}
                    </div>
                    {editTarget && (
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={activo} onChange={e => setActivo(e.target.checked)} />
                            Activo
                        </label>
                    )}
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 size={14} className="animate-spin" />} {editTarget ? 'Actualizar' : 'Crear'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                message={`¿Eliminar "${deleteTarget?.nombre}"? Esta acción no se puede deshacer.`}
            />
        </div>
    );
}

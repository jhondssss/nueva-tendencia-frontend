import { Controller, type useForm } from 'react-hook-form';
import { useInsumoStore } from '@/stores/index';
import { useRole } from '@/hooks/useRole';
import CreatableSelect from '@/components/shared/CreatableSelect';
import { capitalize } from './insumoHelpers';
import type { InsumoFormData } from './insumoSchema';

function FormError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="text-destructive text-xs mt-1">{message}</p>;
}

// ─── Campos del formulario (compartidos entre crear y editar) ─────────────────

type FormInstance = ReturnType<typeof useForm<InsumoFormData>>;

export function InsumoFormFields({ form, idPrefix }: { form: FormInstance; idPrefix: string }) {
    const { register, control, formState: { errors } } = form;
    const categorias      = useInsumoStore(s => s.categorias);
    const unidadesMedida  = useInsumoStore(s => s.unidadesMedida);
    const createCategoria = useInsumoStore(s => s.createCategoria);
    const createUnidad    = useInsumoStore(s => s.createUnidadMedida);
    const { canCreate }   = useRole();

    return (
        <>
            {/* Nombre */}
            <div>
                <label className="label">Nombre *</label>
                <input {...register('nombre')} placeholder="Ej. Cola de contacto"
                       className={`input ${errors.nombre ? 'input-error' : ''}`} />
                <FormError message={errors.nombre?.message} />
            </div>

            {/* Descripción */}
            <div>
                <label className="label">Descripción</label>
                <input {...register('descripcion')} placeholder="Descripción breve del insumo"
                       className="input" />
            </div>

            {/* Categoría + Unidad */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="label">Categoría *</label>
                    <Controller
                        name="categoria_id"
                        control={control}
                        render={({ field }) => (
                            <CreatableSelect
                                value={field.value}
                                onChange={id => field.onChange(id ?? undefined)}
                                options={categorias.map(c => ({
                                    id: c.id_categoria_insumo, nombre: capitalize(c.nombre), activo: c.activo,
                                }))}
                                onCreate={async nombre => {
                                    const c = await createCategoria(nombre);
                                    return { id: c.id_categoria_insumo, nombre: capitalize(c.nombre), activo: c.activo };
                                }}
                                placeholder="Selecciona una categoría"
                                newLabel="+ Nueva categoría"
                                canCreateNew={canCreate}
                                error={errors.categoria_id?.message}
                            />
                        )}
                    />
                </div>
                <div>
                    <label className="label">Unidad de medida *</label>
                    <Controller
                        name="unidad_medida_id"
                        control={control}
                        render={({ field }) => (
                            <CreatableSelect
                                value={field.value}
                                onChange={id => field.onChange(id ?? undefined)}
                                options={unidadesMedida.map(u => ({
                                    id: u.id_unidad_medida, nombre: capitalize(u.nombre), activo: u.activo,
                                }))}
                                onCreate={async nombre => {
                                    const u = await createUnidad(nombre);
                                    return { id: u.id_unidad_medida, nombre: capitalize(u.nombre), activo: u.activo };
                                }}
                                placeholder="Selecciona una unidad"
                                newLabel="+ Nueva unidad"
                                canCreateNew={canCreate}
                                error={errors.unidad_medida_id?.message}
                            />
                        )}
                    />
                </div>
            </div>

            {/* Stock + Nivel mínimo + Precio */}
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="label">Stock actual *</label>
                    <input type="number" min={0} step="1"
                           {...register('stock', { valueAsNumber: true })}
                           placeholder="0"
                           className={`input ${errors.stock ? 'input-error' : ''}`} />
                    <FormError message={errors.stock?.message} />
                </div>
                <div>
                    <label className="label">Nivel mínimo *</label>
                    <input type="number" min={0} step="1"
                           {...register('nivel_minimo', { valueAsNumber: true })}
                           placeholder="0"
                           className={`input ${errors.nivel_minimo ? 'input-error' : ''}`} />
                    <FormError message={errors.nivel_minimo?.message} />
                </div>
                <div>
                    <label className="label">Precio unit. (Bs.) *</label>
                    <input type="number" min={0} step="0.01"
                           {...register('precio_unitario', { valueAsNumber: true })}
                           placeholder="0.00"
                           className={`input ${errors.precio_unitario ? 'input-error' : ''}`} />
                    <FormError message={errors.precio_unitario?.message} />
                </div>
            </div>

            {/* Activo */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <input type="checkbox" id={`${idPrefix}-activo`}
                       {...register('activo')}
                       className="w-4 h-4 rounded cursor-pointer accent-primary" />
                <label htmlFor={`${idPrefix}-activo`}
                       className="text-sm text-foreground cursor-pointer select-none">
                    Insumo activo (disponible para uso en producción)
                </label>
            </div>
        </>
    );
}

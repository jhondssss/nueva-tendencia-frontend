import type { useForm } from 'react-hook-form';
import { CATEGORIAS, UNIDADES, CATEGORIA_LABEL, UNIDAD_LABEL } from './insumoHelpers';
import type { InsumoFormData } from './insumoSchema';

function FormError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="text-destructive text-xs mt-1">{message}</p>;
}

// ─── Campos del formulario (compartidos entre crear y editar) ─────────────────

type FormInstance = ReturnType<typeof useForm<InsumoFormData>>;

export function InsumoFormFields({ form, idPrefix }: { form: FormInstance; idPrefix: string }) {
    const { register, formState: { errors } } = form;

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
                    <select {...register('categoria')}
                            className={`select ${errors.categoria ? 'input-error' : ''}`}>
                        {CATEGORIAS.map(c => (
                            <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>
                        ))}
                    </select>
                    <FormError message={errors.categoria?.message} />
                </div>
                <div>
                    <label className="label">Unidad de medida *</label>
                    <select {...register('unidad_medida')}
                            className={`select ${errors.unidad_medida ? 'input-error' : ''}`}>
                        {UNIDADES.map(u => (
                            <option key={u} value={u}>{UNIDAD_LABEL[u]}</option>
                        ))}
                    </select>
                    <FormError message={errors.unidad_medida?.message} />
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

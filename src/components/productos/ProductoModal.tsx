import { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, Loader2 } from 'lucide-react';
import Modal from '@/components/shared/Modal';
import type { Producto, CreateProductoDto } from '@/types';

const BACKEND_URL = 'https://nueva-tendencia-backend-production.up.railway.app';

const schema = z.object({
    nombre_modelo:      z.string().min(1, 'Requerido'),
    marca:              z.string().min(1, 'Requerido'),
    tipo_calzado:       z.string().min(1, 'Requerido'),
    genero:             z.string().min(1, 'Requerido'),
    material_principal: z.string().min(1, 'Requerido'),
    color:              z.string().min(1, 'Requerido'),
    precio_venta:       z.number().positive('Mayor a 0'),
    costo_unidad:       z.number().positive('Mayor a 0'),
    descripcion_corta:  z.string().min(1, 'Requerido'),
    stock:              z.number().min(0),
    nivel_minimo:       z.number().min(0),
    unidad_medida:      z.string().default('unidades'),
    activo:             z.boolean(),
});

export type ProductoFormData = z.infer<typeof schema>;

const FIELDS = [
    { name: 'nombre_modelo',      label: 'Nombre del modelo', placeholder: 'Mocasín clásico'   },
    { name: 'marca',              label: 'Marca',             placeholder: 'Nueva Tendencia'    },
    { name: 'tipo_calzado',       label: 'Tipo de calzado',   placeholder: 'Mocasín / Botín'    },
    { name: 'genero',             label: 'Género',            placeholder: 'Hombre / Mujer'     },
    { name: 'material_principal', label: 'Material',          placeholder: 'Cuero genuino'      },
    { name: 'color',              label: 'Color',             placeholder: 'Negro / Café'       },
] as const;

interface Props {
    isOpen:    boolean;
    onClose:   () => void;
    onSubmit:  (data: CreateProductoDto, imagen: File | null) => Promise<void>;
    producto?: Producto | null;
}

export default function ProductoModal({ isOpen, onClose, onSubmit, producto }: Props) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [imagen, setImagen]   = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<ProductoFormData>({
        resolver: zodResolver(schema) as Resolver<ProductoFormData>,
        defaultValues: { activo: true },
    });

    useEffect(() => {
        if (isOpen && producto) {
            reset({
                nombre_modelo:      producto.nombre_modelo,
                marca:              producto.marca,
                tipo_calzado:       producto.tipo_calzado,
                genero:             producto.genero,
                material_principal: producto.material_principal,
                color:              producto.color,
                precio_venta:       Number(producto.precio_venta),
                costo_unidad:       Number(producto.costo_unidad),
                descripcion_corta:  producto.descripcion_corta,
                stock:              Number(producto.stock),
                nivel_minimo:       Number(producto.nivel_minimo),
                unidad_medida:      producto.unidad_medida ?? 'unidades',
                activo:             Boolean(producto.activo),
            });
            setPreview(producto.imagen_url ? `${BACKEND_URL}${producto.imagen_url}` : null);
            setImagen(null);
        } else if (!isOpen) {
            reset();
            setPreview(null);
            setImagen(null);
        }
    }, [isOpen, producto, reset]);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setImagen(f);
        setPreview(URL.createObjectURL(f));
    };

    const handleClose = () => { onClose(); };

    const onFormSubmit = async (data: ProductoFormData) => {
        console.log('FORM SUBMIT ACTIVO:', data.activo, typeof data.activo);
        await onSubmit(data as CreateProductoDto, imagen);
        handleClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose}
               title={producto ? 'Editar Producto' : 'Nuevo Producto'}
               subtitle="Completa la información del calzado" size="lg">
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">

                <div>
                    <label className="label">Imagen del producto</label>
                    <div onClick={() => fileRef.current?.click()}
                         className="border-2 border-dashed border-ink-500 rounded-lg p-4 text-center
                                    cursor-pointer hover:border-amber-500 transition-colors group">
                        {preview ? (
                            <img src={preview} alt="preview" className="mx-auto h-28 object-contain rounded" />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-ink-200 group-hover:text-amber-400 transition-colors">
                                <Upload size={24} />
                                <span className="text-xs">Haz clic para subir imagen</span>
                                <span className="text-2xs">JPG, PNG, WEBP — máx. 5MB</span>
                            </div>
                        )}
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {FIELDS.map(({ name, label, placeholder }) => (
                        <div key={name}>
                            <label className="label">{label} *</label>
                            <input {...register(name)} placeholder={placeholder}
                                   className={`input ${errors[name] ? 'input-error' : ''}`} />
                            {errors[name] && <p className="text-red-400 text-xs mt-1">{errors[name]?.message}</p>}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="label">Precio venta (Bs.) *</label>
                        <input type="number" step="0.01" {...register('precio_venta', { valueAsNumber: true })}
                               placeholder="0.00" className={`input ${errors.precio_venta ? 'input-error' : ''}`} />
                    </div>
                    <div>
                        <label className="label">Costo unidad (Bs.) *</label>
                        <input type="number" step="0.01" {...register('costo_unidad', { valueAsNumber: true })}
                               placeholder="0.00" className={`input ${errors.costo_unidad ? 'input-error' : ''}`} />
                    </div>
                    <div>
                        <label className="label">Stock actual</label>
                        <input type="number" {...register('stock', { valueAsNumber: true })} placeholder="0" className="input" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="label">Nivel mínimo</label>
                        <input type="number" {...register('nivel_minimo', { valueAsNumber: true })} placeholder="5" className="input" />
                    </div>
                    <div>
                        <label className="label">Unidad de medida</label>
                        <input {...register('unidad_medida')} placeholder="unidades" className="input" />
                    </div>
                </div>

                <div>
                    <label className="label">Descripción corta *</label>
                    <textarea {...register('descripcion_corta')} rows={2} placeholder="Descripción breve del producto..."
                              className={`input resize-none ${errors.descripcion_corta ? 'input-error' : ''}`} />
                </div>

                <div className="flex items-center gap-2">
                    <Controller
                        name="activo"
                        control={control}
                        render={({ field }) => (
                            <input
                                type="checkbox"
                                id="activo"
                                checked={field.value ?? true}
                                onChange={e => {
                                    console.log('CHECKBOX CHANGED:', e.target.checked);
                                    field.onChange(e.target.checked);
                                }}
                                className="w-4 h-4 rounded border-ink-500 accent-amber-500"
                            />
                        )}
                    />
                    <label htmlFor="activo" className="text-sm text-cream cursor-pointer">Producto activo</label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-ink-600">
                    <button type="button" onClick={handleClose} className="btn-secondary">Cancelar</button>
                    <button type="submit" disabled={isSubmitting} className="btn-primary">
                        {isSubmitting
                            ? <><Loader2 size={14} className="animate-spin" /> Guardando...</>
                            : producto ? 'Actualizar' : 'Crear producto'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

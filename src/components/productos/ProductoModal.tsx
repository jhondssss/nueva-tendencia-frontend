import { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, Loader2 } from 'lucide-react';
import Modal from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { Producto, CreateProductoDto, CategoriaCalzado } from '@/types';
import { getImagenEstandarizada } from '@/utils/cloudinary';

const CATEGORIA_OPTIONS: { value: CategoriaCalzado; label: string }[] = [
    { value: 'nino',    label: 'Niño (tallas 27–32)' },
    { value: 'juvenil', label: 'Juvenil (tallas 33–36)' },
    { value: 'adulto',  label: 'Adulto (tallas 37–42)' },
];

const BACKEND_URL = import.meta.env.VITE_API_URL;

function resolveImageUrl(url?: string | null): string | null {
    if (!url) return null;
    return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
}

const nanToDefault = (fallback: number) => (v: unknown) =>
    typeof v === 'number' && isNaN(v) ? fallback : v;

// Vacío (input sin tocar) o NaN → undefined, para poder distinguir "no configurado" de "0".
const emptyToUndefined = (v: unknown) => {
    if (v === '' || v === null) return undefined;
    if (typeof v === 'number' && isNaN(v)) return undefined;
    return v;
};

const numeroOpcional = z.preprocess(emptyToUndefined, z.number().min(0, 'No puede ser negativo').optional());

const schema = z.object({
    nombre_modelo:      z.string().min(3, 'Mínimo 3 caracteres'),
    marca:              z.string().min(1, 'Requerido'),
    tipo_calzado:       z.string().min(1, 'Requerido'),
    genero:             z.string().min(1, 'Requerido'),
    material_principal: z.string().min(1, 'Requerido'),
    color:              z.string().min(1, 'Requerido'),
    categoria:          z.enum(['nino', 'juvenil', 'adulto'], { error: 'Selecciona una categoría' }),
    precio_venta:       z.coerce.number().positive('Debe ser mayor a 0'),
    costo_unidad:       z.coerce.number().positive('Debe ser mayor a 0'),
    descripcion_corta:  z.string().min(10, 'Mínimo 10 caracteres'),
    stock:              z.preprocess(nanToDefault(0), z.number().min(0, 'No puede ser negativo')),
    nivel_minimo:       z.preprocess(nanToDefault(0), z.number().min(0, 'No puede ser negativo')),
    unidad_medida:      z.string().default('unidades'),
    activo:             z.boolean(),
    cuero_pies:             numeroOpcional,
    clefa_aparado_litros:   numeroOpcional,
    pasta_solado_litros:    numeroOpcional,
    clefa_solado_litros:    numeroOpcional,
    pvc_solado_litros:      numeroOpcional,
    clefa_empaque_litros:   numeroOpcional,
    esponja_empaque_hojas:  numeroOpcional,
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

const FORMULA_ETAPAS = [
    {
        titulo: '1 · Cortado',
        campos: [
            { name: 'cuero_pies', label: 'Cuero', unidad: 'pies' },
        ],
    },
    {
        titulo: '2 · Aparado',
        campos: [
            { name: 'clefa_aparado_litros', label: 'Clefa', unidad: 'L' },
        ],
    },
    {
        titulo: '3 · Solado',
        campos: [
            { name: 'pasta_solado_litros', label: 'Pasta', unidad: 'L' },
            { name: 'clefa_solado_litros', label: 'Clefa', unidad: 'L' },
            { name: 'pvc_solado_litros',   label: 'PVC',   unidad: 'L' },
        ],
    },
    {
        titulo: '4 · Empaquetado',
        campos: [
            { name: 'clefa_empaque_litros',  label: 'Clefa',   unidad: 'L' },
            { name: 'esponja_empaque_hojas', label: 'Esponja', unidad: 'hojas' },
        ],
    },
] as const satisfies readonly { titulo: string; campos: readonly { name: keyof ProductoFormData; label: string; unidad: string }[] }[];

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
        mode: 'onTouched',
        defaultValues: { activo: true, stock: 0, nivel_minimo: 0 },
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
                categoria:          producto.categoria ?? undefined,
                precio_venta:       Number(producto.precio_venta),
                costo_unidad:       Number(producto.costo_unidad),
                descripcion_corta:  producto.descripcion_corta,
                stock:              Number(producto.stock),
                nivel_minimo:       Number(producto.nivel_minimo),
                unidad_medida:      producto.unidad_medida ?? 'unidades',
                activo:             Boolean(producto.activo),
                cuero_pies:             producto.cuero_pies ?? undefined,
                clefa_aparado_litros:   producto.clefa_aparado_litros ?? undefined,
                pasta_solado_litros:    producto.pasta_solado_litros ?? undefined,
                clefa_solado_litros:    producto.clefa_solado_litros ?? undefined,
                pvc_solado_litros:      producto.pvc_solado_litros ?? undefined,
                clefa_empaque_litros:   producto.clefa_empaque_litros ?? undefined,
                esponja_empaque_hojas:  producto.esponja_empaque_hojas ?? undefined,
            });
            setPreview(getImagenEstandarizada(resolveImageUrl(producto.imagen_url), 400));
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

    const onFormSubmit = async (data: ProductoFormData) => {
        await onSubmit(data as CreateProductoDto, imagen);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}
               title={producto ? 'Editar Producto' : 'Nuevo Producto'}
               subtitle="Completa la información del calzado" size="lg">
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
              <Tabs defaultValue="general">
                <TabsList>
                    <TabsTrigger value="general">Datos generales</TabsTrigger>
                    <TabsTrigger value="formula">Fórmula de producción</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">

                <div>
                    <label className="label">Imagen del producto</label>
                    <div onClick={() => fileRef.current?.click()}
                         tabIndex={0}
                         role="button"
                         aria-label="Subir imagen del producto"
                         onKeyDown={e => {
                             if (e.key === 'Enter' || e.key === ' ') {
                                 e.preventDefault();
                                 fileRef.current?.click();
                             }
                         }}
                         className="border-2 border-dashed border-border rounded-lg p-4 text-center
                                    cursor-pointer hover:border-primary/50 transition-colors group
                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        {preview ? (
                            <img src={preview} alt="preview" className="mx-auto h-28 object-contain rounded" />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
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
                            {errors[name] && <p className="text-destructive text-xs mt-1">{errors[name]?.message}</p>}
                        </div>
                    ))}
                </div>

                <div>
                    <label className="label">Categoría (tallas) *</label>
                    <select {...register('categoria')}
                            defaultValue=""
                            className={`select ${errors.categoria ? 'input-error' : ''}`}>
                        <option value="" disabled>Selecciona una categoría</option>
                        {CATEGORIA_OPTIONS.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                    {errors.categoria && <p className="text-destructive text-xs mt-1">{errors.categoria.message}</p>}
                    <p className="text-2xs text-muted-foreground mt-1">
                        Determina las tallas disponibles y si el producto aparece en el catálogo del portal de cliente.
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="label">Precio venta (Bs.) *</label>
                        <input type="number" step="0.01" min="0.01"
                               {...register('precio_venta', { valueAsNumber: true })}
                               placeholder="0.00"
                               className={`input ${errors.precio_venta ? 'input-error' : ''}`} />
                        {errors.precio_venta && <p className="text-destructive text-xs mt-1">{errors.precio_venta.message}</p>}
                    </div>
                    <div>
                        <label className="label">Costo unidad (Bs.) *</label>
                        <input type="number" step="0.01" min="0.01"
                               {...register('costo_unidad', { valueAsNumber: true })}
                               placeholder="0.00"
                               className={`input ${errors.costo_unidad ? 'input-error' : ''}`} />
                        {errors.costo_unidad && <p className="text-destructive text-xs mt-1">{errors.costo_unidad.message}</p>}
                    </div>
                    <div>
                        <label className="label">Stock actual</label>
                        <input type="number" min="0"
                               {...register('stock', { valueAsNumber: true })}
                               placeholder="0"
                               className={`input ${errors.stock ? 'input-error' : ''}`} />
                        {errors.stock && <p className="text-destructive text-xs mt-1">{errors.stock.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="label">Nivel mínimo</label>
                        <input type="number" min="0"
                               {...register('nivel_minimo', { valueAsNumber: true })}
                               placeholder="5"
                               className={`input ${errors.nivel_minimo ? 'input-error' : ''}`} />
                        {errors.nivel_minimo && <p className="text-destructive text-xs mt-1">{errors.nivel_minimo.message}</p>}
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
                                onChange={e => field.onChange(e.target.checked)}
                                className="w-4 h-4 rounded border-border accent-primary"
                            />
                        )}
                    />
                    <label htmlFor="activo" className="text-sm text-foreground cursor-pointer">Producto activo</label>
                </div>

                </TabsContent>

                <TabsContent value="formula" className="space-y-3">
                    <p className="text-2xs text-muted-foreground">
                        Opcional. Cantidad fija de insumo consumida por docena de pares al pasar el pedido por cada etapa del Kanban.
                        Dejar en blanco la etapa que no aplique a este producto.
                    </p>
                    {FORMULA_ETAPAS.map(etapa => (
                        <div key={etapa.titulo} className="rounded-lg border border-border p-3 space-y-2">
                            <label className="label">{etapa.titulo}</label>
                            <div className="grid grid-cols-3 gap-3">
                                {etapa.campos.map(({ name, label, unidad }) => (
                                    <div key={name}>
                                        <label className="label text-2xs">{label} ({unidad})</label>
                                        <input type="number" step="0.01" min="0"
                                               {...register(name, { valueAsNumber: true })}
                                               placeholder="0"
                                               className={`input ${errors[name] ? 'input-error' : ''}`} />
                                        {errors[name] && <p className="text-destructive text-xs mt-1">{errors[name]?.message}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </TabsContent>

              </Tabs>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting} className="hover:scale-[1.02] transition-transform">
                        {isSubmitting
                            ? <><Loader2 size={14} className="animate-spin" /> Guardando...</>
                            : producto ? 'Actualizar' : 'Crear producto'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

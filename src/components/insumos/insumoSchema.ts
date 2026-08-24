import { z } from 'zod';

export const insumoSchema = z.object({
    nombre:          z.string().min(1, 'El nombre es requerido'),
    descripcion:     z.string(),
    categoria:       z.enum(['adhesivo', 'material', 'herramienta', 'quimico', 'otro']),
    unidad_medida:   z.enum(['litro', 'kilo', 'metro', 'unidad', 'galon']),
    stock:           z.number({ error: 'Ingresa el stock' }).min(0, 'No puede ser negativo'),
    nivel_minimo:    z.number({ error: 'Ingresa el nivel mínimo' }).min(0, 'No puede ser negativo'),
    precio_unitario: z.number({ error: 'Ingresa el precio' }).positive('Debe ser mayor a 0'),
    activo:          z.boolean().default(true),
});

export type InsumoFormData = z.infer<typeof insumoSchema>;

export const INSUMO_DEFAULT_VALUES: Partial<InsumoFormData> = {
    descripcion:   '',
    categoria:     'material',
    unidad_medida: 'unidad',
    stock:         0,
    nivel_minimo:  0,
    activo:        true,
};

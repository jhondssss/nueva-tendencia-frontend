import type { CategoriaInsumo, UnidadMedida, Insumo } from '@/types';

const BACKEND_URL = import.meta.env.VITE_API_URL;

export function resolveImageUrl(url?: string | null): string | null {
    if (!url) return null;
    return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
}

// ─── Catálogos ────────────────────────────────────────────────────────────────

export const CATEGORIAS: CategoriaInsumo[] = ['adhesivo', 'material', 'herramienta', 'quimico', 'otro'];
export const UNIDADES:   UnidadMedida[]    = ['litro', 'kilo', 'metro', 'unidad', 'galon'];

export const CATEGORIA_LABEL: Record<CategoriaInsumo, string> = {
    adhesivo:    'Adhesivo',
    material:    'Material',
    herramienta: 'Herramienta',
    quimico:     'Químico',
    otro:        'Otro',
};

export const UNIDAD_LABEL: Record<UnidadMedida, string> = {
    litro:  'Litro (L)',
    kilo:   'Kilogramo (Kg)',
    metro:  'Metro (m)',
    unidad: 'Unidad',
    galon:  'Galón',
};

export const UNIDAD_SHORT: Record<UnidadMedida, string> = {
    litro:  'L',
    kilo:   'Kg',
    metro:  'm',
    unidad: 'u.',
    galon:  'gal',
};

/** Acento cromático por categoría — coherente con el resto del sistema (tokens shadcn) */
export const CATEGORIA_BADGE: Record<CategoriaInsumo, string> = {
    adhesivo:    'bg-chart-3/10 text-chart-3 border-chart-3/30',
    material:    'bg-chart-1/10 text-chart-1 border-chart-1/30',
    herramienta: 'bg-secondary/10 text-secondary border-secondary/30',
    quimico:     'bg-destructive/10 text-destructive border-destructive/30',
    otro:        'bg-chart-4/10 text-chart-4 border-chart-4/30',
};

export type EstadoInsumo = 'Inactivo' | 'Agotado' | 'Stock bajo' | 'Activo';

export const ESTADO_INSUMO_BADGE: Record<EstadoInsumo, string> = {
    Inactivo:      'bg-muted text-muted-foreground border-border',
    Agotado:       'bg-destructive/10 text-destructive border-destructive/30',
    'Stock bajo':  'bg-warning/10 text-warning border-warning/30',
    Activo:        'bg-secondary/10 text-secondary border-secondary/30',
};

export function getEstadoInsumo(insumo: Insumo): EstadoInsumo {
    const stock = Number(insumo.stock);
    if (!insumo.activo) return 'Inactivo';
    if (stock === 0) return 'Agotado';
    if (stock <= Number(insumo.nivel_minimo)) return 'Stock bajo';
    return 'Activo';
}

// ─── Validación de imagen ─────────────────────────────────────────────────────

export const MAX_IMG_SIZE  = 5 * 1024 * 1024;
export const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

export function validateImageFile(file: File): string | null {
    if (!ACCEPTED_MIME.includes(file.type)) return 'Formato no permitido. Usa JPG, PNG o WEBP.';
    if (file.size > MAX_IMG_SIZE)           return 'La imagen supera el límite de 5MB.';
    return null;
}

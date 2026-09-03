import type { ReporteFiltrosPedidos, ReporteFiltrosKardex } from '@/types';

export function limpiarFiltrosPedidos(f: ReporteFiltrosPedidos): ReporteFiltrosPedidos {
    const limpio: ReporteFiltrosPedidos = {};
    if (f.cliente?.trim())  limpio.cliente  = f.cliente.trim();
    if (f.producto?.trim()) limpio.producto = f.producto.trim();
    if (f.categoria)        limpio.categoria = f.categoria;
    if (f.desde)             limpio.desde    = f.desde;
    if (f.hasta)             limpio.hasta    = f.hasta;
    return limpio;
}

export function limpiarFiltrosKardex(f: ReporteFiltrosKardex): ReporteFiltrosKardex {
    const limpio: ReporteFiltrosKardex = {};
    if (f.desde)               limpio.desde               = f.desde;
    if (f.hasta)               limpio.hasta               = f.hasta;
    if (f.insumo_id)           limpio.insumo_id           = f.insumo_id;
    if (f.tipo)                limpio.tipo                = f.tipo;
    if (f.origen)              limpio.origen              = f.origen;
    if (f.categoria_insumo_id) limpio.categoria_insumo_id = f.categoria_insumo_id;
    return limpio;
}

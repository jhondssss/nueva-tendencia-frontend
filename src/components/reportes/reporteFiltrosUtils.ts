import type { ReporteFiltrosPedidos } from '@/types';

export function limpiarFiltrosPedidos(f: ReporteFiltrosPedidos): ReporteFiltrosPedidos {
    const limpio: ReporteFiltrosPedidos = {};
    if (f.cliente?.trim())  limpio.cliente  = f.cliente.trim();
    if (f.producto?.trim()) limpio.producto = f.producto.trim();
    if (f.categoria)        limpio.categoria = f.categoria;
    if (f.desde)             limpio.desde    = f.desde;
    if (f.hasta)             limpio.hasta    = f.hasta;
    return limpio;
}

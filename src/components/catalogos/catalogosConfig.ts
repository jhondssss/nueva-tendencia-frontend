import { crearCatalogoApi, type CatalogoApi } from '@/api/services';

export interface CatalogoConfig {
    key:       string;
    /** Título de la pestaña y de la tabla (plural). */
    titulo:    string;
    /** Nombre en singular, para textos de botones y mensajes. */
    singular:  string;
    /** Nombre del campo id que devuelve el backend (varía por entidad). */
    idKey:     string;
    api:       CatalogoApi;
}

// Para sumar un catálogo nuevo: agregar una entrada acá (y el endpoint en el backend).
export const CATALOGOS: CatalogoConfig[] = [
    { key: 'categorias-insumo',   titulo: 'Categorías de insumo',   singular: 'categoría de insumo',   idKey: 'id_categoria_insumo',   api: crearCatalogoApi('/categorias-insumo') },
    { key: 'categorias-producto', titulo: 'Categorías de producto', singular: 'categoría de producto', idKey: 'id_categoria_producto', api: crearCatalogoApi('/categorias-producto') },
    { key: 'tipos-cliente',       titulo: 'Tipos de cliente',       singular: 'tipo de cliente',       idKey: 'id_tipo_cliente',       api: crearCatalogoApi('/tipos-cliente') },
    { key: 'unidades-medida',     titulo: 'Unidades de medida',     singular: 'unidad de medida',      idKey: 'id_unidad_medida',      api: crearCatalogoApi('/unidades-medida') },
    { key: 'tipos-calzado',       titulo: 'Tipos de calzado',       singular: 'tipo de calzado',       idKey: 'id',                    api: crearCatalogoApi('/tipos-calzado') },
    { key: 'generos',             titulo: 'Géneros',                singular: 'género',                idKey: 'id',                    api: crearCatalogoApi('/generos') },
];

const UPLOAD_MARKER = '/upload/';

/**
 * Inserta transformaciones de Cloudinary (encuadre cuadrado que ajusta el
 * producto completo sin recortarlo, con relleno color crema de marca, más
 * formato/calidad óptimos) en una URL ya alojada en Cloudinary — sin tocar
 * el archivo original ni volver a subirlo. URLs que no son de Cloudinary
 * (blobs locales de previsualización, uploads legacy servidos por el
 * backend) se devuelven sin modificar.
 */
export function getImagenEstandarizada(url?: string | null, size = 800): string | null {
    if (!url) return null;

    const idx = url.indexOf(UPLOAD_MARKER);
    if (!url.includes('res.cloudinary.com') || idx === -1) return url;

    const transform = `c_pad,w_${size},h_${size},b_rgb:FAFAF8,f_auto,q_auto`;
    const uploadStart = idx + UPLOAD_MARKER.length;
    const rest = url.slice(uploadStart);
    if (rest.startsWith(transform)) return url;

    return `${url.slice(0, uploadStart)}${transform}/${rest}`;
}

/** Dispara la descarga de un blob en el navegador con el nombre de archivo dado. */
export function triggerDownload(blob: Blob, filename: string) {
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(href);
}

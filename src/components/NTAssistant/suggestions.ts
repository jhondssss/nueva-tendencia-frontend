const SUGERENCIAS_STAFF = [
    '¿Stock crítico?',
    '¿Top clientes del mes?',
    '¿Pedidos atrasados?',
];

const SUGERENCIAS_CLIENTE = [
    '¿Estado de mi pedido?',
    '¿Qué productos hay disponibles?',
];

/** Sugerencias de preguntas rápidas según el rol de la sesión activa. */
export function getSugerencias(isCliente: boolean): string[] {
    return isCliente ? SUGERENCIAS_CLIENTE : SUGERENCIAS_STAFF;
}

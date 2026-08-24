import { beforeEach, describe, expect, it } from 'vitest';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import api from './axios';
import { reportesApi } from './services';

/** Instala un adapter custom en la instancia real de axios: corre después de los
 *  interceptors de request (incluido el que inyecta el Bearer token), así que
 *  captura el config ya resuelto sin necesitar red ni un mock-adapter externo. */
function installAdapterSpy() {
    const calls: InternalAxiosRequestConfig[] = [];
    api.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
        calls.push(config);
        return {
            data: new Blob(['contenido']),
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
        };
    };
    return calls;
}

describe('reportesApi — Authorization header en reportes que antes fallaban con 401', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    const casos: Array<{
        nombre:       string;
        llamar:       () => Promise<unknown>;
        urlEsperada:  string;
    }> = [
        { nombre: 'getPdfVentas',       llamar: () => reportesApi.getPdfVentas(2026), urlEsperada: '/reportes/pdf/ventas?year=2026' },
        { nombre: 'getPdfPedidos',      llamar: () => reportesApi.getPdfPedidos(),    urlEsperada: '/reportes/pdf/pedidos' },
        { nombre: 'getPdfStockCritico', llamar: () => reportesApi.getPdfStockCritico(), urlEsperada: '/reportes/pdf/stock-critico' },
        { nombre: 'getExcelPedidos',    llamar: () => reportesApi.getExcelPedidos(),  urlEsperada: '/reportes/excel/pedidos' },
        { nombre: 'getExcelClientes',   llamar: () => reportesApi.getExcelClientes(), urlEsperada: '/reportes/excel/clientes' },
        { nombre: 'getExcelStock',      llamar: () => reportesApi.getExcelStock(),    urlEsperada: '/reportes/excel/stock' },
    ];

    it.each(casos)('$nombre manda Authorization Bearer y responseType blob', async ({ llamar, urlEsperada }) => {
        localStorage.setItem('access_token', 'token-test-123');
        const calls = installAdapterSpy();

        await llamar();

        expect(calls).toHaveLength(1);
        expect(calls[0].url).toBe(urlEsperada);
        expect(calls[0].headers.Authorization).toBe('Bearer token-test-123');
        expect(calls[0].responseType).toBe('blob');
    });

    it('no manda Authorization si no hay token guardado en localStorage', async () => {
        const calls = installAdapterSpy();

        await reportesApi.getPdfStockCritico();

        expect(calls[0].headers.Authorization).toBeUndefined();
    });
});

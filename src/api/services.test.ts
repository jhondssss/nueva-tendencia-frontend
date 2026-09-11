import { describe, expect, it } from 'vitest';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import api from './axios';
import { reportesApi } from './services';

/** Instala un adapter custom en la instancia real de axios: corre después de los
 *  interceptors de request (incluido el que agrega X-Requested-With en mutaciones),
 *  así que captura el config ya resuelto sin necesitar red ni un mock-adapter externo. */
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

describe('instancia axios — cookies httpOnly + CSRF', () => {
    it('manda withCredentials:true en toda request, para que el navegador adjunte la cookie httpOnly', async () => {
        const calls = installAdapterSpy();

        await api.get('/lo-que-sea');

        expect(calls[0].withCredentials).toBe(true);
    });

    it.each(['post', 'put', 'patch', 'delete'] as const)(
        'agrega X-Requested-With: XMLHttpRequest en %s (mutación)',
        async (method) => {
            const calls = installAdapterSpy();

            await api[method]('/lo-que-sea');

            expect(calls[0].headers['X-Requested-With']).toBe('XMLHttpRequest');
        },
    );

    it('NO agrega X-Requested-With en GET (no es mutación, no pasa por CsrfGuard)', async () => {
        const calls = installAdapterSpy();

        await api.get('/lo-que-sea');

        expect(calls[0].headers['X-Requested-With']).toBeUndefined();
    });
});

describe('reportesApi — responseType blob en descargas de PDF/Excel', () => {
    it('getPdfStockCritico pide blob por GET, con withCredentials y sin header de mutación', async () => {
        const calls = installAdapterSpy();

        await reportesApi.getPdfStockCritico();

        expect(calls[0].url).toBe('/reportes/pdf/stock-critico');
        expect(calls[0].responseType).toBe('blob');
        expect(calls[0].withCredentials).toBe(true);
        expect(calls[0].headers['X-Requested-With']).toBeUndefined();
    });
});

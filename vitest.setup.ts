import '@testing-library/jest-dom';

// jsdom no implementa ResizeObserver; cmdk (GlobalSearch) lo requiere para medir el viewport de resultados.
class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

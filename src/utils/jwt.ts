export interface JwtPayload {
    sub?:                     number;
    email?:                   string;
    role?:                    string;
    clienteId?:               number;
    requiereCambioPassword?:  boolean;
    exp?:                     number;
    iat?:                     number;
}

export function decodeToken(token: string | null): JwtPayload | null {
    if (!token) return null;
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch {
        return null;
    }
}

export function isTokenValid(token: string | null): boolean {
    const payload = decodeToken(token);
    return typeof payload?.exp === 'number' && payload.exp > Date.now() / 1000;
}

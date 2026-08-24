import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary capturó un error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-background px-4">
                    <div className="flex flex-col items-center text-center max-w-sm">
                        <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/30
                                        flex items-center justify-center mb-4">
                            <AlertTriangle size={28} className="text-destructive" />
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">Algo salió mal</p>
                        <p className="text-xs text-muted-foreground mb-5">
                            Ocurrió un error inesperado al mostrar esta sección. Podés intentar recargar la página.
                        </p>
                        <button onClick={() => window.location.reload()} className="btn-primary">
                            <RefreshCw size={14} /> Recargar página
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

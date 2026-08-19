export default function PageLoader() {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="relative w-12 h-12">
                {/* Track ring */}
                <div className="absolute inset-0 rounded-full border-2 border-muted" />
                {/* Spinning arc */}
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
                {/* NT logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-display font-bold text-primary text-xs select-none">NT</span>
                </div>
            </div>
            <span className="text-xs text-muted-foreground animate-pulse">Cargando...</span>
        </div>
    );
}

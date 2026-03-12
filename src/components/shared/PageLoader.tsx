export default function PageLoader() {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="relative w-12 h-12">
                {/* Track ring */}
                <div className="absolute inset-0 rounded-full border-2 border-cafe-200" />
                {/* Spinning arc */}
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-dorado-500 animate-spin" />
                {/* NT logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-display font-bold text-dorado-600 text-xs select-none">NT</span>
                </div>
            </div>
            <span className="text-xs text-cafe-400 animate-pulse">Cargando...</span>
        </div>
    );
}

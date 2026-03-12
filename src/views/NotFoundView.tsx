import { useNavigate } from 'react-router-dom';
import { Footprints, LayoutDashboard } from 'lucide-react';

export default function NotFoundView() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-cafe-900 flex items-center justify-center p-6 animate-fade-in">
            <div className="text-center max-w-md">

                {/* Decoración */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-3xl bg-cafe-800 border border-cafe-700 flex items-center justify-center shadow-lg">
                        <Footprints size={36} className="text-cafe-400" />
                    </div>
                </div>

                {/* Número 404 */}
                <p className="font-display font-bold text-dorado-400 text-8xl leading-none tracking-tight mb-4
                               [text-shadow:0_0_40px_theme(colors.dorado.500/40)]">
                    404
                </p>

                {/* Textos */}
                <h1 className="text-xl font-display font-semibold text-white mb-2">
                    Página no encontrada
                </h1>
                <p className="text-cafe-200 text-sm leading-relaxed mb-8">
                    La página que buscas no existe o fue movida.
                </p>

                {/* Botón */}
                <button
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
                               bg-dorado-500 hover:bg-dorado-400 text-white font-medium text-sm
                               transition-colors shadow-md"
                >
                    <LayoutDashboard size={15} />
                    Volver al Dashboard
                </button>
            </div>
        </div>
    );
}

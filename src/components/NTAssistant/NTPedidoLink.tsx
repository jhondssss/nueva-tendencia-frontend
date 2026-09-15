import { useNavigate } from 'react-router-dom';

interface Props {
    idPedido: string;
}

/** Botón inline que navega a /pedidos prefiltrado por el pedido detectado en la respuesta del asistente. */
export default function NTPedidoLink({ idPedido }: Props) {
    const navigate = useNavigate();

    return (
        <button
            type="button"
            onClick={() => navigate(`/pedidos?pedido=${idPedido}`)}
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md
                       bg-primary/10 text-primary font-medium text-xs
                       hover:bg-primary/20 transition-colors"
        >
            #{idPedido}
        </button>
    );
}

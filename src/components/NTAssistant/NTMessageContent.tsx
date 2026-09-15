import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import NTPedidoLink from './NTPedidoLink';

interface Props {
    content: string;
}

const PEDIDO_PREFIX = '#nt-pedido-';

// Convierte "#123" (el patrón que usa el sistema para referenciar pedidos) en un link
// markdown con un fragmento propio, para interceptarlo en el renderer de <a> y navegar
// con react-router. Un href con esquema custom (ej. "nt-pedido:123") lo sanitiza
// react-markdown a "" por seguridad; un fragmento "#..." sí pasa esa sanitización.
function linkifyPedidos(text: string): string {
    return text.replace(/#(\d+)\b/g, (match, id) => `[${match}](${PEDIDO_PREFIX}${id})`);
}

/** Renderiza el texto de una respuesta del asistente como markdown (negritas, listas, saltos de línea, #pedido). */
export default function NTMessageContent({ content }: Props) {
    return (
        <div className="max-w-none break-words
                         [&_p]:m-0 [&_p+p]:mt-2
                         [&_ul]:m-0 [&_ul]:mt-1 [&_ul]:pl-4 [&_ul]:list-disc
                         [&_ol]:m-0 [&_ol]:mt-1 [&_ol]:pl-4 [&_ol]:list-decimal
                         [&_li]:mt-0.5
                         [&_strong]:font-semibold
                         [&_a]:text-primary [&_a]:underline">
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={{
                    a: ({ href, children }) => {
                        if (href?.startsWith(PEDIDO_PREFIX)) {
                            return <NTPedidoLink idPedido={href.slice(PEDIDO_PREFIX.length)} />;
                        }
                        return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
                    },
                }}
            >
                {linkifyPedidos(content)}
            </ReactMarkdown>
        </div>
    );
}

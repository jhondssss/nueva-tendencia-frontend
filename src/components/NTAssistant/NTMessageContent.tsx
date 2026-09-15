import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface Props {
    content: string;
}

/** Renderiza el texto de una respuesta del asistente como markdown (negritas, listas, saltos de línea). */
export default function NTMessageContent({ content }: Props) {
    return (
        <div className="max-w-none break-words
                         [&_p]:m-0 [&_p+p]:mt-2
                         [&_ul]:m-0 [&_ul]:mt-1 [&_ul]:pl-4 [&_ul]:list-disc
                         [&_ol]:m-0 [&_ol]:mt-1 [&_ol]:pl-4 [&_ol]:list-decimal
                         [&_li]:mt-0.5
                         [&_strong]:font-semibold
                         [&_a]:text-primary [&_a]:underline">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                {content}
            </ReactMarkdown>
        </div>
    );
}

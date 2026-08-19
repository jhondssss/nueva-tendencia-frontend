import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface PaginationProps {
    page:       number;
    totalPages: number;
    total:      number;
    goToPage:   (n: number) => void;
    nextPage:   () => void;
    prevPage:   () => void;
}

/** Genera el rango de páginas con puntos suspensivos cuando hay muchas */
function buildPages(page: number, total: number): (number | '…')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: (number | '…')[] = [1];
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) {
        pages.push(i);
    }
    if (page < total - 2) pages.push('…');
    pages.push(total);
    return pages;
}

export default function Pagination({ page, totalPages, total, goToPage, nextPage, prevPage }: PaginationProps) {
    if (totalPages <= 1) return null;

    const pages = buildPages(page, totalPages);

    return (
        <div className="flex items-center justify-between mt-4 px-1 select-none">
            <span className="text-xs text-muted-foreground">
                {total} registros · página <span className="text-foreground font-medium">{page}</span> de {totalPages}
            </span>

            <div className="flex items-center gap-1">
                <button
                    onClick={prevPage}
                    disabled={page === 1}
                    aria-label="Página anterior"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent
                               disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={14} />
                </button>

                {pages.map((p, i) =>
                    p === '…' ? (
                        <span key={`el-${i}`} className="w-7 text-center text-muted-foreground/60 text-xs">…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => goToPage(p as number)}
                            className={clsx(
                                'min-w-[28px] h-7 px-1 rounded-md text-xs font-medium transition-colors',
                                p === page
                                    ? 'bg-primary text-primary-foreground font-semibold'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                            )}>
                            {p}
                        </button>
                    )
                )}

                <button
                    onClick={nextPage}
                    disabled={page === totalPages}
                    aria-label="Página siguiente"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent
                               disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}

import { clsx } from 'clsx';

export function Skeleton({ className }: { className?: string }) {
    return <div className={clsx('skeleton', className)} />;
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-2 p-4">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                </div>
            ))}
        </div>
    );
}

export function KpiSkeleton() {
    return (
        <div className="kpi-card">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20" />
        </div>
    );
}

export function TimelineCardSkeleton() {
    return (
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur p-4">
            <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex items-center gap-2.5">
                    <Skeleton className="h-3 w-6" />
                    <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-14" />
                </div>
            </div>
            <div className="flex justify-between px-1">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-5 w-5 rounded-full" />
                ))}
            </div>
        </div>
    );
}

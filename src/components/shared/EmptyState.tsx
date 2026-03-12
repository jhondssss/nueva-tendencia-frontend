import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-cafe-800/40 border border-cafe-700/50
                            flex items-center justify-center mb-4">
                <Icon size={28} className="text-cafe-300" />
            </div>
            <p className="text-sm font-medium text-cream mb-1">{title}</p>
            <p className="text-xs text-ink-200 max-w-xs">{description}</p>
            {actionLabel && onAction && (
                <button onClick={onAction} className="btn-primary mt-4">
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

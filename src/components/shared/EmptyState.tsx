import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
            <div className="relative w-16 h-16 rounded-2xl bg-muted border border-border
                            flex items-center justify-center mb-4 overflow-hidden">
                <div className="absolute inset-0 bg-texture-dots text-cafe-400 opacity-[0.06] pointer-events-none" />
                <div className="absolute inset-[3px] rounded-2xl border border-dashed border-dorado-500/25 pointer-events-none" />
                <Icon size={28} className="relative text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">{title}</p>
            <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
            {actionLabel && onAction && (
                <Button onClick={onAction} className="mt-4">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface ModalProps {
    isOpen:    boolean;
    onClose:   () => void;
    title:     string;
    subtitle?: string;
    children:  React.ReactNode;
    size?:     'sm' | 'md' | 'lg' | 'xl';
}

const SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export default function Modal({ isOpen, onClose, title, subtitle, children, size = 'md' }: ModalProps) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={clsx('modal-panel w-full', SIZES[size])} onClick={e => e.stopPropagation()}>
                <div className="flex items-start justify-between p-5 border-b border-ink-600">
                    <div>
                        <h2 className="font-display text-lg font-semibold text-cream">{title}</h2>
                        {subtitle && <p className="text-sm text-ink-100 mt-0.5">{subtitle}</p>}
                    </div>
                    <button onClick={onClose}
                            className="p-1.5 rounded text-ink-100 hover:text-cream hover:bg-ink-600 transition-colors ml-4">
                        <X size={16} />
                    </button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}

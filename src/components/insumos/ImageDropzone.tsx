import { Upload } from 'lucide-react';

export function ImageDropzone({
    preview, onFileChange, onRemove, inputRef, uploadHint,
}: {
    preview: string | null;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
    uploadHint: string;
}) {
    return (
        <div>
            <label className="label">Imagen del insumo</label>
            <div onClick={() => inputRef.current?.click()}
                 tabIndex={0}
                 role="button"
                 aria-label={uploadHint}
                 onKeyDown={e => {
                     if (e.key === 'Enter' || e.key === ' ') {
                         e.preventDefault();
                         inputRef.current?.click();
                     }
                 }}
                 className="border-2 border-dashed border-border rounded-lg p-4 text-center
                            cursor-pointer hover:border-primary/50 transition-colors group
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                {preview ? (
                    <img src={preview} alt="preview"
                         className="mx-auto h-24 object-contain rounded" />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground
                                    group-hover:text-primary transition-colors">
                        <Upload size={22} />
                        <span className="text-xs">{uploadHint}</span>
                        <span className="text-[11px] text-muted-foreground">JPG, PNG, WEBP — máx. 5MB</span>
                    </div>
                )}
                <input ref={inputRef} type="file"
                       accept="image/jpeg,image/png,image/webp"
                       className="hidden" onChange={onFileChange} />
            </div>
            {preview && (
                <button type="button"
                        onClick={onRemove}
                        className="mt-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                    Quitar imagen
                </button>
            )}
        </div>
    );
}

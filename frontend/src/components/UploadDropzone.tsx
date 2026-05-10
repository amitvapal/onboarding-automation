import { useRef, useState, DragEvent } from "react";
import { FileText, FileUp, X } from "lucide-react";

interface UploadDropzoneProps {
  file: File | null;
  onFile: (f: File | null) => void;
  disabled?: boolean;
}

export function UploadDropzone({ file, onFile, disabled }: UploadDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    if (f && (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))) {
      onFile(f);
    }
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={
        "relative block cursor-pointer rounded-2xl border border-dashed p-10 text-center transition-all overflow-hidden " +
        (dragOver
          ? "border-blue-400/60 bg-blue-500/[0.06] shadow-lg shadow-blue-500/10"
          : "border-white/10 bg-white/[0.015] hover:border-white/20 hover:bg-white/[0.03]") +
        (disabled ? " opacity-50 cursor-not-allowed" : "")
      }
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] via-transparent to-violet-500/[0.04]" />
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        disabled={disabled}
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      <div className="relative">
        {file ? (
          <div>
            <div className="mx-auto h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500/30 via-violet-500/25 to-cyan-400/25 border border-white/10 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20">
              <FileText className="h-6 w-6 text-blue-200" />
            </div>
            <div className="text-sm font-medium text-white truncate max-w-md mx-auto">
              {file.name}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {(file.size / 1024).toFixed(1)} KB &middot; ready to process
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onFile(null);
              }}
              disabled={disabled}
              className="mt-3 inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-300 hover:bg-white/[0.06] transition-colors"
            >
              <X className="h-3 w-3" /> Remove
            </button>
          </div>
        ) : (
          <div>
            <div className="mx-auto h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500/20 via-violet-500/20 to-cyan-400/20 border border-white/10 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/10">
              <FileUp className="h-6 w-6 text-blue-200" />
            </div>
            <div className="text-base font-medium text-white">
              Drop your vendor document here
            </div>
            <div className="mt-1 text-xs text-slate-400">
              or browse files &middot; PDF up to 25 MB
            </div>
          </div>
        )}
      </div>
    </label>
  );
}

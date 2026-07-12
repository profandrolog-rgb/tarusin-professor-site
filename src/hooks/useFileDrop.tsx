import { useCallback, useState } from "react";

interface UseFileDropOpts {
  /** Called for every accepted file (in drop order). */
  onFiles: (files: File[]) => void;
  /** MIME-prefix filter, e.g. "image/" or "application/pdf". Default: all files. */
  accept?: string | string[];
  /** Also handle Ctrl/Cmd+V paste on the container. */
  paste?: boolean;
  /** Disable all drop handling. */
  disabled?: boolean;
}

/**
 * Small drop/paste helper for any drop-target container.
 * Returns props to spread on the target + a boolean indicating an active drag.
 */
export function useFileDrop({ onFiles, accept, paste = true, disabled }: UseFileDropOpts) {
  const [dragOver, setDragOver] = useState(false);

  const matches = useCallback(
    (f: File) => {
      if (!accept) return true;
      const list = Array.isArray(accept) ? accept : [accept];
      return list.some((a) => (a.endsWith("/") ? f.type.startsWith(a) : f.type === a));
    },
    [accept],
  );

  const handlers = {
    onDragOver: (e: React.DragEvent) => {
      if (disabled) return;
      if (!e.dataTransfer?.types?.includes("Files")) return;
      e.preventDefault();
      e.stopPropagation();
      setDragOver(true);
    },
    onDragLeave: (e: React.DragEvent) => {
      if (e.currentTarget === e.target) setDragOver(false);
    },
    onDrop: (e: React.DragEvent) => {
      if (disabled) return;
      const files = e.dataTransfer?.files;
      if (!files || !files.length) return;
      const accepted = Array.from(files).filter(matches);
      if (!accepted.length) return;
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      onFiles(accepted);
    },
    onPaste: paste
      ? (e: React.ClipboardEvent) => {
          if (disabled) return;
          const items = e.clipboardData?.items;
          if (!items) return;
          const files: File[] = [];
          for (let i = 0; i < items.length; i++) {
            const it = items[i];
            if (it.kind === "file") {
              const f = it.getAsFile();
              if (f && matches(f)) files.push(f);
            }
          }
          if (!files.length) return;
          e.preventDefault();
          onFiles(files);
        }
      : undefined,
  };

  return { dragOver, handlers };
}

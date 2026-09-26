import { useEffect } from "react";
import type { ReactNode } from "react";

type NumberPickerSheetProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/** A bottom sheet for setting one number — used wherever a screen has too
 * many chip-count wheels to show inline at once (Chip Inventory, Cash Out).
 * The wheel inside commits its value live as it settles, so tapping the
 * backdrop to dismiss never loses what was already scrolled to; "Done" is
 * just how you close it. */
export function NumberPickerSheet({ title, onClose, children }: NumberPickerSheetProps) {
  // Keep the background from scrolling behind the sheet on mobile.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <p className="text-section sheet-title">{title}</p>
        <div className="sheet-body">{children}</div>
        <button type="button" className="btn btn-primary btn-large" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}

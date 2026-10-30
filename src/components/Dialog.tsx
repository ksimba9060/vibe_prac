import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { ReactNode, KeyboardEvent } from "react";
export function Dialog({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>(
      'input,button,textarea,select,[tabindex="0"]',
    );
    first?.focus();
    return () => previous?.isConnected && previous.focus();
  }, []);
  const keyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
    if (event.key === "Tab") {
      const items = Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]',
        ) || [],
      );
      const first = items[0],
        last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  };
  return createPortal(
    <div
      className="phone-modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <dialog
        open
        ref={ref}
        className="location-dialog"
        aria-modal="true"
        onKeyDown={keyDown}
      >
        {children}
      </dialog>
    </div>,
    document.getElementById("phone-overlays") || document.body,
  );
}

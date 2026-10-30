import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

export function Dialog({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      className="location-dialog"
      onCancel={onClose}
      onClose={onClose}
    >
      {children}
    </dialog>,
    document.body,
  );
}

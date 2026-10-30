// Small external store shared by React screens and async account operations.
let version = 0;
const listeners = new Set<() => void>();
export const getSnapshot = () => version;
export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function notify() {
  version++;
  for (const listener of listeners) listener();
}
let closeCurrentDialog = () => {};
export function setDialogCloser(close: () => void) {
  closeCurrentDialog = close;
}
export function closeDialog() {
  closeCurrentDialog();
}

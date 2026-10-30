import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  AppView,
  member,
  getDialogContent,
  clearDialogContent,
} from "./screens/GreenPlate";
import { Dialog } from "./components/Dialog";
import {
  getSnapshot,
  subscribe,
  notify,
  setDialogCloser,
} from "./lib/viewStore";

let started = false;
export default function App() {
  useSyncExternalStore(subscribe, getSnapshot);
  useEffect(() => {
    setDialogCloser(clearDialogContent);
    const navigate = () => {
      clearDialogContent();
      if (location.hash !== "#write" && !member.reviewPending)
        member.clearPhotos();
      notify();
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", navigate);
    if (!started) {
      started = true;
      void member.start();
    }
    return () => window.removeEventListener("hashchange", navigate);
  }, []);
  const dialog = getDialogContent();
  return (
    <>
      <AppView />
      {dialog && <Dialog onClose={clearDialogContent}>{dialog}</Dialog>}
      {createPortal(<div id="toast" role="status" />, document.body)}
    </>
  );
}

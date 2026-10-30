import { PhoneShell } from "./components/PhoneShell";
import { initializeNavigation, recordNavigation } from "./lib/navigation";
import { useEffect, useSyncExternalStore } from "react";
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
    initializeNavigation();
    const navigate = () => {
      recordNavigation();
      clearDialogContent();
      if (location.hash !== "#write" && !member.reviewPending)
        member.clearPhotos();
      notify();
      const scroll = document.getElementById("phone-scroll");
      if (scroll) scroll.scrollTop = 0;
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
    <PhoneShell>
      <AppView />
      {dialog && <Dialog onClose={clearDialogContent}>{dialog}</Dialog>}
    </PhoneShell>
  );
}

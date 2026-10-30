const marker = "healeatDepth";
let currentDepth = 0;
export function initializeNavigation() {
  currentDepth = Number(history.state?.[marker]) || 0;
  history.replaceState({ ...history.state, [marker]: currentDepth }, "");
}
export function recordNavigation() {
  if (typeof history.state?.[marker] === "number")
    currentDepth = history.state[marker];
  else {
    currentDepth++;
    history.replaceState({ ...history.state, [marker]: currentDepth }, "");
  }
}
export function navigateTo(page: string, replace = false) {
  const hash = "#" + page;
  if (history.state?.[marker] === undefined) initializeNavigation();
  if (location.hash !== hash) {
    currentDepth = replace ? currentDepth : currentDepth + 1;
    history[replace ? "replaceState" : "pushState"](
      { ...history.state, [marker]: currentDepth },
      "",
      hash,
    );
  }
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}
export function goBack() {
  if (Number(history.state?.[marker]) > 0) history.back();
  else navigateTo("home", true);
}

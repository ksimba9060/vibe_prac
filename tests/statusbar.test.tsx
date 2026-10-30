import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { StatusBar } from "../src/components/StatusBar";
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  Reflect.deleteProperty(navigator, "getBattery");
});
it("updates the Seoul clock across a minute and supports unavailable battery data", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-30T08:59:59Z"));
  render(<StatusBar />);
  expect(screen.getByText("17:59")).toBeTruthy();
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(screen.getByText("18:00")).toBeTruthy();
  expect(
    screen.getByRole("img", { name: "배터리 잔량을 제공하지 않는 브라우저" }),
  ).toBeTruthy();
});
it("tracks actual battery changes and removes listeners on unmount", async () => {
  const device = Object.assign(new EventTarget(), {
    level: 0.73,
    charging: false,
  });
  const remove = vi.spyOn(device, "removeEventListener");
  Object.defineProperty(navigator, "getBattery", {
    configurable: true,
    value: () => Promise.resolve(device),
  });
  const { unmount } = render(<StatusBar />);
  await screen.findByRole("img", { name: "배터리 73%" });
  act(() => {
    device.level = 0.15;
    device.charging = true;
    device.dispatchEvent(new Event("levelchange"));
  });
  expect(screen.getByRole("img", { name: "배터리 15%, 충전 중" })).toBeTruthy();
  unmount();
  expect(remove).toHaveBeenCalledTimes(2);
});

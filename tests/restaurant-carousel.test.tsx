import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { RestaurantCarousel } from "../src/components/RestaurantCarousel";
import { getRestaurantImage } from "../src/data/restaurantImages";
import { initialRestaurants } from "../src/data/restaurants";
import { existsSync } from "node:fs";
afterEach(cleanup);
it("moves one card in each direction and disables arrows at the boundaries", () => {
  const { container } = render(
    <RestaurantCarousel>
      <article className="card">매장 1</article>
      <article className="card">매장 2</article>
    </RestaurantCarousel>,
  );
  const track = container.querySelector(".carousel-track") as HTMLDivElement;
  Object.defineProperties(track, {
    clientWidth: { value: 350 },
    scrollWidth: { value: 1200 },
  });
  track.scrollBy = vi.fn();
  fireEvent.scroll(track);
  const previous = screen.getByRole("button", {
    name: "이전 맛집 보기",
  }) as HTMLButtonElement;
  const next = screen.getByRole("button", {
    name: "다음 맛집 보기",
  }) as HTMLButtonElement;
  expect(previous.disabled).toBe(true);
  expect(next.disabled).toBe(false);
  fireEvent.click(next);
  expect(track.scrollBy).toHaveBeenLastCalledWith(
    expect.objectContaining({ left: expect.any(Number) }),
  );
  expect((track.scrollBy as any).mock.calls[0][0].left).toBeGreaterThan(0);
  track.scrollLeft = 300;
  fireEvent.scroll(track);
  expect(previous.disabled).toBe(false);
  fireEvent.click(previous);
  expect((track.scrollBy as any).mock.lastCall[0].left).toBeLessThan(0);
  track.scrollLeft = 850;
  fireEvent.scroll(track);
  expect(next.disabled).toBe(true);
});
it("uses category food photos with separate covers and detail images for every restaurant", () => {
  for (const r of initialRestaurants) {
    const cover = getRestaurantImage(r),
      detail = getRestaurantImage(r, "detail");
    expect(cover).not.toBe(detail);
    expect(
      existsSync(
        new URL("../public/assets/" + cover + ".png", import.meta.url),
      ),
    ).toBe(true);
    expect(
      existsSync(
        new URL("../public/assets/" + detail + ".png", import.meta.url),
      ),
    ).toBe(true);
    if (r.type === "한식") expect(cover).toMatch(/^korean-/);
    if (r.type === "샐러드/포케") expect(cover).toMatch(/^salad-/);
    if (r.type === "양식") expect(cover).toMatch(/^western-/);
  }
});

import React, { useSyncExternalStore } from "react";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { webcrypto } from "node:crypto";
const mocks = vi.hoisted(() => {
  const rows = new Map<string, any>();
  return {
    rows,
    fail: false,
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(async () => ({ error: null })),
      getSession: vi.fn(async () => ({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe() {} } },
      })),
    },
    upload: vi.fn(async () => ({ error: null })),
    remove: vi.fn(async () => ({ error: null })),
  };
});
vi.mock("../src/lib/supabase", async () => {
  const { initialRestaurants } = await import("../src/data/restaurants");
  return {
    supabase: {
      auth: mocks.auth,
      from(table: string) {
        return {
          id: "",
          select() {
            return this;
          },
          eq(_key: string, id: string) {
            this.id = id;
            return this;
          },
          async maybeSingle() {
            return {
              data: mocks.rows.has(this.id)
                ? { data: mocks.rows.get(this.id) }
                : null,
            };
          },
          async order() {
            return {
              data: initialRestaurants.map((data, id) => ({ id, data })),
            };
          },
          async upsert(row: any) {
            if (mocks.fail) return { error: { code: "offline" } };
            mocks.rows.set(row.user_id, structuredClone(row.data));
            return { error: null };
          },
          async insert(row: any) {
            if (mocks.fail) return { error: { code: "42501" } };
            mocks.rows.set("input", row);
            return { error: null };
          },
        };
      },
      storage: {
        from() {
          return {
            upload: mocks.upload,
            remove: mocks.remove,
            async createSignedUrls(paths: string[]) {
              return {
                data: paths.map((path) => ({
                  path,
                  signedUrl: "https://photos.example/" + path,
                })),
              };
            },
          };
        },
      },
    },
  };
});
import {
  AppView,
  member,
  getMatchingRestaurants,
  runSearch,
  toggleFilter,
} from "../src/screens/GreenPlate";
import { subscribe, getSnapshot } from "../src/lib/viewStore";
const user = (id: string) => ({ id, user_metadata: { username: id } });
function TestApp() {
  useSyncExternalStore(subscribe, getSnapshot);
  return (
    <div>
      <AppView />
      <div id="toast" />
    </div>
  );
}
beforeEach(() => {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
  mocks.rows.clear();
  mocks.fail = false;
  vi.clearAllMocks();
  member.epoch++;
  member.reset();
  member.user = null;
  member.pending = false;
  member.reviewPending = false;
  member.phase = "auth";
  member.mode = "login";
  member.message = "";
  location.hash = "";
});
afterEach(cleanup);
describe("React migration regression coverage", () => {
  it("requires login even on a private hash route", () => {
    location.hash = "#saved";
    render(<TestApp />);
    expect(screen.getByLabelText("아이디")).toBeTruthy();
    expect(screen.queryByText("아직 저장한 식당이 없어요.")).toBeNull();
  });
  it("retains the exact existing credential mapping and accepts a one-character password", async () => {
    const a = await member.credentials(" 가나다 ", "1");
    const b = await member.credentials("가나다", "1");
    const c = await member.credentials("가나다", "2");
    expect(a).toEqual(b);
    expect(a.password).not.toEqual(c.password);
    expect(a.email).toMatch(/^gp-[a-f0-9]{64}@login.greenplate.app$/);
  });
  it("signs up from the React form and opens the authenticated app", async () => {
    mocks.auth.signUp.mockResolvedValue({
      data: { session: { user: user("A") } },
    });
    render(<TestApp />);
    fireEvent.click(screen.getByRole("button", { name: "회원가입" }));
    fireEvent.change(screen.getByLabelText("아이디"), {
      target: { value: "가나다" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "가입하고 시작하기" }));
    await waitFor(() =>
      expect(screen.getByText("텍스트 저장하기")).toBeTruthy(),
    );
    expect(mocks.auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({ options: { data: { username: "가나다" } } }),
    );
  });
  it("renders every existing route as React and retains search and AND filters", async () => {
    await member.load(user("A"));
    for (const route of [
      "home",
      "home-basic",
      "recommend",
      "search",
      "profile",
      "health",
      "store",
      "write",
      "reviews",
      "saved",
      "gallery",
      "map",
    ]) {
      location.hash = "#" + route;
      const { container, unmount } = render(<TestApp />);
      expect(container.querySelector("main"), route).toBeTruthy();
      unmount();
    }
    expect(
      getMatchingRestaurants({ term: "키토 김밥" }).some(
        (r) => r.name === "바른한끼 키토김밥",
      ),
    ).toBe(true);
    toggleFilter("lowSugar");
    toggleFilter("noNuts");
    expect(
      getMatchingRestaurants().every(
        (r) => r.dietary.includes("lowSugar") && !r.allergens.includes("nuts"),
      ),
    ).toBe(true);
  });
  it("persists favorites and health to one account and restores them without leaking to another", async () => {
    await member.load(user("A"));
    render(<TestApp />);
    fireEvent.click(screen.getAllByRole("button", { name: "식당 저장" })[0]);
    await waitFor(() => expect(mocks.rows.get("A")?.saved).toContain(0));
    cleanup();
    location.hash = "#health";
    render(<TestApp />);
    fireEvent.click(
      screen.getByRole("button", { name: "갑각류", exact: true }),
    );
    await waitFor(() =>
      expect(mocks.rows.get("A")?.health).toContain("갑각류"),
    );
    await member.logout();
    expect(member.snapshot().health).toEqual([]);
    await member.load(user("B"));
    expect(member.snapshot().saved).toEqual([]);
    expect(member.snapshot().health).toEqual([]);
    await member.logout();
    await member.load(user("A"));
    expect(member.snapshot().saved).toContain(0);
    expect(member.snapshot().health).toContain("갑각류");
  });
  it("keeps a failed save pending and retries it", async () => {
    await member.load(user("A"));
    mocks.fail = true;
    runSearch("저당 한식");
    await member.flush();
    expect(member.error).toContain("저장하지");
    expect(member.savedRevision).toBeLessThan(member.revision);
    mocks.fail = false;
    await member.flush();
    expect(mocks.rows.get("A").recentQueries).toContain("저당 한식");
  });
  it("stores input with the authenticated user id", async () => {
    await member.load(user("A"));
    render(<TestApp />);
    fireEvent.change(screen.getByLabelText("저장할 내용"), {
      target: { value: " 테스트 " },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "저장하기", exact: true }),
    );
    await screen.findByText(/저장됐어요!/);
    expect(mocks.rows.get("input")).toEqual({ input: "테스트", user_id: "A" });
  });
  it("uploads review photos and saves all review fields", async () => {
    await member.load(user("A"));
    location.hash = "#write";
    const { container } = render(<TestApp />);
    fireEvent.change(container.querySelector("textarea")!, {
      target: { value: "맛있고 건강하게 잘 먹었습니다." },
    });
    fireEvent.change(container.querySelector('input[name="glucose"]')!, {
      target: { value: "110" },
    });
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: {
        files: [new File(["photo"], "meal.png", { type: "image/png" })],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "리뷰 등록하기 →" }));
    await waitFor(() => expect(mocks.rows.get("A")?.reviews).toHaveLength(1));
    const review = mocks.rows.get("A").reviews[0];
    expect(review.glucose).toBe(110);
    expect(review.criteria).toHaveLength(2);
    expect(review.photos[0]).toMatch(/^A\/.+\.png$/);
    expect(mocks.upload).toHaveBeenCalledOnce();
  });
});

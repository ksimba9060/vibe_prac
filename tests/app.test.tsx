import { initializeNavigation, navigateTo } from "../src/lib/navigation";
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
    rpc: vi.fn(),
    auth: {
      refreshSession: vi.fn(async () => ({
        data: { session: null },
        error: null,
      })),
      getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
      updateUser: vi.fn(),
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
      rpc: mocks.rpc,
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
  getDialogContent,
  clearDialogContent,
} from "../src/screens/GreenPlate";
import { subscribe, getSnapshot, setDialogCloser } from "../src/lib/viewStore";
const user = (id: string) => ({ id, user_metadata: { username: id } });
function TestApp() {
  useSyncExternalStore(subscribe, getSnapshot);
  return (
    <div>
      <AppView />
      {getDialogContent() && <div role="dialog">{getDialogContent()}</div>}
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
  for (const id of ["A", "B"])
    mocks.rows.set(id, { prefs: { starterContentVersion: 1 } });
  clearDialogContent();
  setDialogCloser(clearDialogContent);
  mocks.fail = false;
  vi.clearAllMocks();
  mocks.rpc.mockResolvedValue({ data: null, error: null });
  member.epoch++;
  member.reset();
  member.user = null;
  member.pending = false;
  member.reviewPending = false;
  member.phase = "auth";
  member.mode = "login";
  member.message = "";
  history.replaceState({}, "", "/");
  initializeNavigation();
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
      expect(screen.getByText("근처 건강 맛집 더보기")).toBeTruthy(),
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
  it("removes the text-saving exercise and uses the Healeat brand", async () => {
    await member.load(user("A"));
    render(<TestApp />);
    expect(screen.queryByText("텍스트 저장하기")).toBeNull();
    expect(document.title).toContain("Healeat");
  });
  it("renders actual recommended restaurant cards, never object strings", async () => {
    await member.load(user("A"));
    location.hash = "#recommend";
    const { container } = render(<TestApp />);
    expect(container.querySelectorAll("article.card")).toHaveLength(16);
    expect(container.textContent).not.toContain("[object Object]");
    fireEvent.click(screen.getByRole("button", { name: "일식", exact: true }));
    expect(container.querySelectorAll("article.card")).toHaveLength(3);
  });
  it("shows only search and matching restaurants and ignores hidden recommendation filters", async () => {
    await member.load(user("A"));
    toggleFilter("noNuts");
    toggleFilter("lowSugar");
    location.hash = "#search";
    render(<TestApp />);
    expect(screen.getByText("최근 검색어")).toBeTruthy();
    expect(screen.getByRole("group", { name: "음식 카테고리" })).toBeTruthy();
    expect(screen.queryByText("내 건강 정보 수정 ›")).toBeNull();
    fireEvent.change(screen.getByLabelText("식당 검색"), {
      target: { value: "비건데이" },
    });
    fireEvent.click(screen.getByRole("button", { name: "검색 실행" }));
    expect(
      screen.getByRole("heading", { name: "비건데이 샐러드" }),
    ).toBeTruthy();
    expect(screen.getByText("맞춤 매칭 식당")).toBeTruthy();
    expect(screen.queryByText("최근 검색어")).toBeNull();
    expect(screen.queryByRole("group", { name: "음식 카테고리" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "검색 조건 변경" }));
    expect(screen.getByText("최근 검색어")).toBeTruthy();
  });
  it("adds starter reviews and saved restaurants once and displays profile previews", async () => {
    await member.load(user("new-member"));
    expect(member.snapshot().reviews).toHaveLength(2);
    expect(member.snapshot().saved).toEqual([0, 1, 2]);
    location.hash = "#profile";
    render(<TestApp />);
    expect(screen.getAllByText("예시 리뷰")).toHaveLength(2);
    expect(
      screen.getByRole("heading", { name: "최근 작성 리뷰" }),
    ).toBeTruthy();
    await member.logout();
    await member.load(user("new-member"));
    expect(member.snapshot().reviews).toHaveLength(2);
  });
  it("keeps location cancel and submit in one action row and gives the health add button a dedicated width", async () => {
    await member.load(user("A"));
    const { container } = render(<TestApp />);
    fireEvent.click(screen.getByRole("button", { name: /역삼동 GFC/ }));
    fireEvent.click(screen.getByRole("button", { name: "위치 재설정" }));
    expect(
      screen.getByRole("button", { name: "취소" }).parentElement.className,
    ).toBe("dialog-actions");
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    cleanup();
    location.hash = "#health";
    render(<TestApp />);
    expect(
      screen.getByRole("button", { name: "+ 추가" }).parentElement.className,
    ).toContain("health-goal-entry");
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

  it("separates profile editing from health settings and removes redundant account and stats buttons", async () => {
    await member.load(user("A"));
    location.hash = "#profile";
    const { container } = render(<TestApp />);
    expect(container.querySelector(".stats")).toBeNull();
    expect(screen.queryByText("회원정보 수정")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "최근 작성 리뷰" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "수정 ✎" }));
    expect(location.hash).toBe("#edit-profile");
    cleanup();
    render(<TestApp />);
    expect(screen.getByLabelText("아이디")).toBeTruthy();
    expect(screen.getByLabelText("프로필 사진 변경")).toBeTruthy();
    expect(screen.queryByText("⚕ 질환 및 건강 관리 목표")).toBeNull();
    expect(screen.queryByLabelText(/이메일/)).toBeNull();
  });
  it("returns from health settings to the actual previous route", async () => {
    await member.load(user("A"));
    navigateTo("profile");
    navigateTo("health");
    render(<TestApp />);
    fireEvent.click(screen.getByRole("button", { name: "뒤로 가기" }));
    await waitFor(() => expect(location.hash).toBe("#profile"));
  });
  it("keeps a fresh deep link back inside the app", async () => {
    await member.load(user("A"));
    history.replaceState({}, "", "#health");
    initializeNavigation();
    render(<TestApp />);
    fireEvent.click(screen.getByRole("button", { name: "뒤로 가기" }));
    expect(location.hash).toBe("#home");
  });
  it("saves a new login ID and private avatar without changing the member UUID", async () => {
    await member.load(user("A"));
    await member.updateProfile(
      "새아이디",
      new File(["avatar"], "avatar.png", { type: "image/png" }),
    );
    const credentials = await member.credentials("새아이디", "1");
    expect(mocks.rpc).toHaveBeenCalledWith("set_login_name", {
      p_username: "새아이디",
      p_username_key: await member.digest("새아이디"),
    });
    expect(member.user.id).toBe("A");
    expect(member.name()).toBe("새아이디");
    expect(mocks.rows.get("A").prefs.avatarPath).toMatch(
      /^A\/profile\/.+\.png$/,
    );
    expect(member.avatar()).toContain("https://photos.example/A/profile/");
    await member.logout();
    await member.load({
      ...user("A"),
      user_metadata: { username: "새아이디" },
    });
    expect(member.avatar()).toContain("/A/profile/");
  });
  it("retains the original profile on duplicate login ID rejection", async () => {
    await member.load(user("A"));
    mocks.rpc.mockResolvedValue({ error: { code: "23505" } });
    await expect(member.updateProfile("다른아이디", null)).rejects.toThrow(
      "이미 사용 중",
    );
    expect(member.name()).toBe("A");
    expect(member.profilePending).toBe(false);
  });
  it("applies selected search filters and keeps them when revisiting conditions", async () => {
    await member.load(user("A"));
    location.hash = "#search";
    render(<TestApp />);
    fireEvent.click(screen.getByRole("button", { name: /필터 선택/ }));
    fireEvent.click(screen.getByRole("button", { name: "비건", exact: true }));
    fireEvent.click(screen.getByRole("button", { name: "검색 실행" }));
    expect(screen.queryByRole("group", { name: "음식 카테고리" })).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "그린플레이트 역삼점" }),
    ).toBeNull();
    expect(
      screen.getByRole("heading", { name: "비건데이 샐러드" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "검색 조건 변경" }));
    expect(screen.getByRole("button", { name: "비건 필터 해제" })).toBeTruthy();
  });

  it("resolves an edited login ID to the original Auth identity", async () => {
    mocks.rpc.mockResolvedValue({
      data: "original@login.greenplate.app",
      error: null,
    });
    mocks.auth.signInWithPassword.mockResolvedValue({
      data: {
        session: {
          user: { ...user("A"), user_metadata: { username: "수정아이디" } },
        },
      },
    });
    render(<TestApp />);
    fireEvent.change(screen.getByLabelText("아이디"), {
      target: { value: "수정아이디" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "1" },
    });
    fireEvent.submit(screen.getByLabelText("아이디").closest("form"));
    await waitFor(() => expect(member.ready).toBe(true));
    expect(mocks.auth.signInWithPassword).toHaveBeenCalledWith(
      expect.objectContaining({ email: "original@login.greenplate.app" }),
    );
    expect(member.user.id).toBe("A");
  });
  it("does not change the profile if the login migration is absent", async () => {
    await member.load(user("A"));
    mocks.rpc.mockResolvedValue({ error: { code: "PGRST202" } });
    await expect(member.updateProfile("수정아이디", null)).rejects.toThrow(
      "서버 설정",
    );
    expect(member.name()).toBe("A");
  });
});

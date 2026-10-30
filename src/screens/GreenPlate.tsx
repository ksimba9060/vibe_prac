import { ProfileEdit } from "../components/ProfileEdit";
import { navigateTo, goBack } from "../lib/navigation";
import { AuthScreen } from "../components/AuthScreen";
import React from "react";
import { supabase } from "../lib/supabase";
import { initialRestaurants } from "../data/restaurants";
import type { Restaurant, Review, MemberPreferences } from "../types";
import { notify as render, closeDialog } from "../lib/viewStore";
let dialogContent: React.ReactNode = null;
export function getDialogContent() {
  return dialogContent;
}
export function clearDialogContent() {
  dialogContent = null;
  render();
}
const $ = (s) => document.querySelector<any>(s);
const read = (k, d) => member?.read(k, d) ?? d;
let saved: number[] = [],
  reviews: Review[] = [],
  health: string[] = [],
  rating = 5,
  category = "전체",
  query = "",
  sort = "적합도순",
  safe = true;
let searchSubmitted = false;
let searchFilters: string[] = [];
const restaurants = [...initialRestaurants];
let current = 0;
const persist = () => member?.queueSave();
const esc = (s) => String(s);
const toast = (s) => {
  $("#toast").textContent = s;
  $("#toast").classList.add("show");
  setTimeout(() => $("#toast").classList.remove("show"), 2500);
};
const go = (p, id = undefined) => {
  if (id !== undefined) current = +id;
  if (p === "search" && location.hash !== "#search") {
    searchSubmitted = false;
    query = "";
  }
  navigateTo(p);
};
const pill = (text, cl = "") => <span className={"pill " + cl}>{text}</span>;
const notice = (t) => (
  <div className={"notice"}>
    {"ⓘ\u3000"}
    {t}
  </div>
);
const primary = (t, action) => (
  <button className={"primary"} {...action}>
    {t}
  </button>
);
async function save(id) {
  saved = saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id];
  const selected = saved.includes(id);
  render();
  if (await persist())
    toast(selected ? "식당을 저장했어요" : "저장을 해제했어요");
}
function photo(r, id, im = r.image) {
  return (
    <div className={"photo"}>
      <img className={"heroimg"} src={"assets/" + im + ".png"} alt={r.menu} />
      <span className={"pill"}>
        {"● "}
        {r.fit}
        {"% 적합"}
      </span>
      <button
        className={"save"}
        aria-label={"식당 저장"}
        onClick={(event: any) => {
          event.stopPropagation();
          save(id);
        }}
      >
        {saved.includes(id) ? "♥" : "♡"}
      </button>
      <span className={"photocaption"}>{r.desc}</span>
    </div>
  );
}
function restaurantCard(r, id) {
  return (
    <article className={"card"}>
      <div
        onClick={(event: any) => {
          go("store", id);
        }}
        style={{
          cursor: "pointer",
        }}
      >
        {photo(r, id)}
        <div className={"pad"}>
          <div className={"row between"}>
            <h3>{r.name}</h3>
            <small className={"green"}>
              {"★"}
              {r.star}
              {" · "}
              {r.distance}
              {"m"}
            </small>
          </div>
          <div
            className={"panel"}
            style={{
              margin: "10px 0 0",
              padding: "12px",
            }}
          >
            <small>{"추천 메뉴"}</small>
            <p>{r.menu}</p>
            <span className={"tag"}>{r.tag}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
function mapView(full = false) {
  if (full)
    return (
      <div className={"map fullmap"} aria-label={"역삼동 전체 지도"}>
        <img
          className={"overview-map"}
          src={"assets/map-overview.png"}
          alt={"역삼동 주변 지도 · 기본 배율"}
        />
        <a
          className={"map-attribution"}
          href={"https://www.openstreetmap.org/copyright"}
          target={"_blank"}
          rel={"noopener noreferrer"}
        >
          {"© OpenStreetMap contributors"}
        </a>
      </div>
    );
  return (
    <div className={"map"} aria-label={"역삼동 인근 맞춤 식당 지도"}>
      <button
        className={"pin"}
        style={{
          top: "18%",
          left: "5%",
        }}
        onClick={(event: any) => {
          go("store", 1);
        }}
      >
        {"● 소담한식 95%"}
      </button>
      <button
        className={"pin"}
        style={{
          top: "30%",
          right: "5%",
        }}
        onClick={(event: any) => {
          go("store", 2);
        }}
      >
        {"● 퓨어샐러드 93%"}
      </button>
      <button
        className={"pin selected"}
        onClick={(event: any) => {
          go("store", 0);
        }}
      >
        {"◕ 그린플레이트 98%"}
      </button>
      <button
        className={"zoom"}
        onClick={(event: any) => {
          toast("현재 위치: 역삼역 · 테헤란로");
        }}
      >
        {"◎"}
      </button>
      <button
        className={"locate"}
        onClick={(event: any) => {
          go("map");
        }}
      >
        {"⛶ 지도 전체보기"}
      </button>
      <a
        className={"map-attribution"}
        href={"https://www.openstreetmap.org/copyright"}
        target={"_blank"}
        rel={"noopener noreferrer"}
      >
        {"© OpenStreetMap contributors"}
      </a>
    </div>
  );
}
function home() {
  return (
    <>
      <div className={"healthbar"}>
        <span className={"green"}>
          {"● "}
          {esc(member?.name() || "회원")}
          {"님 맞춤 · 혈당 관리 · 저염식"}
        </span>
        <button
          onClick={(event: any) => {
            go("health");
          }}
        >
          {"변경 ›"}
        </button>
        <button
          className={"muted"}
          onClick={(event: any) => {
            go("home-basic");
          }}
        >
          {"기본 지도"}
        </button>
      </div>
      {mapView()}
      <article className={"card pad"}>
        <div
          onClick={(event: any) => {
            go("store", 0);
          }}
        >
          {photo(restaurants[0], 0, "salmon")}
          <div className={"row between"}>
            <h3>{"그린플레이트 역삼점"}</h3>
            {pill("샐러드")}
          </div>
          <p>
            <span
              style={{
                color: "#eba118",
              }}
            >
              {"★"}
            </span>
            {" 4.9\u3000"}
            <span className={"muted"}>{"(128)"}</span>
            {"\u3000"}
            <span className={"green"}>{"320m (도보 5분)"}</span>
          </p>
          <div
            className={"panel"}
            style={{
              fontSize: "12px",
            }}
          >
            {"♧\u3000설정하신 "}
            <b className={"green"}>{"당뇨/저염"}</b>
            {
              " 기준에 맞춘 저당·통곡물 식단이며 교차오염이 배제된 안심 식당입니다."
            }
          </div>
          <div className={"row wrap"}>
            {React.Children.toArray(
              ["# 저당 안심", "# 혈당 스파이크 방지", "# 유기농 채소"].map(
                (x) => pill(x),
              ),
            )}
          </div>
        </div>
      </article>
      <div className={"sectionhead"}>
        <h2>{"근처 건강 맛집 더보기"}</h2>
        <button
          className={"green"}
          onClick={(event: any) => {
            go("recommend");
          }}
        >
          {"전체보기 ›"}
        </button>
      </div>
      <p className={"muted"}>
        {esc(member?.name() || "회원")}
        {"님의 식단 기준 90% 이상 적합지"}
      </p>
      <div className={"horizontal"}>
        {React.Children.toArray(
          restaurants.slice(1, 3).map((r, i) => restaurantCard(r, i + 1)),
        )}
      </div>
      <div className={"panel"}>
        <b>{"✚\u3000식단 맞춤 보증 리포트"}</b>
        <p className={"muted"}>
          {
            "역삼동 GFC 및 테헤란로 인근 매장들의 실제 영양성분표 및 조리법 검증을 바탕으로 산출된 안심 지수입니다."
          }
        </p>
      </div>
    </>
  );
}
const categories = ["전체", "한식", "양식", "샐러드/포케", "일식", "중식"];
const searchIcon = (
  <svg
    className={"search-icon"}
    width={"22"}
    height={"22"}
    viewBox={"0 0 24 24"}
    fill={"none"}
    stroke={"currentColor"}
    strokeWidth={"1.8"}
    strokeLinecap={"round"}
    strokeLinejoin={"round"}
    aria-hidden={"true"}
  >
    <circle cx={"10.5"} cy={"10.5"} r={"6.5"} />
    <path d={"m16 16 4.5 4.5"} />
  </svg>
);
const filterOptions = [
  {
    id: "lowSugar",
    label: "혈당 케어 · 저당",
    group: "식단",
  },
  {
    id: "lowSodium",
    label: "저염식",
    group: "식단",
  },
  {
    id: "highProtein",
    label: "고단백",
    group: "식단",
  },
  {
    id: "keto",
    label: "키토 · 저탄수",
    group: "식단",
  },
  {
    id: "vegan",
    label: "비건",
    group: "식단",
  },
  {
    id: "glutenFree",
    label: "글루텐프리",
    group: "식단",
  },
  {
    id: "noShellfish",
    label: "갑각류 제외",
    group: "알레르기",
  },
  {
    id: "noNuts",
    label: "견과류 제외",
    group: "알레르기",
  },
  {
    id: "nearby",
    label: "500m 이내",
    group: "이용 조건",
  },
  {
    id: "budget",
    label: "15,000원 이하",
    group: "이용 조건",
  },
  {
    id: "topRated",
    label: "별점 4.8 이상",
    group: "이용 조건",
  },
  {
    id: "openNow",
    label: "영업 중",
    group: "이용 조건",
  },
];
let selectedFilters = [],
  filtersOpen = false,
  searchCategory = "전체";
let recentQueries = [];
function normalizeSearch(s) {
  return s
    .toLocaleLowerCase("ko-KR")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}
function matchesFilter(r, id) {
  if (id === "noShellfish") return !r.allergens.includes("shellfish");
  if (id === "noNuts") return !r.allergens.includes("nuts");
  if (id === "nearby") return r.distance <= 500;
  if (id === "budget") return r.price <= 15000;
  if (id === "topRated") return Number(r.star) >= 4.8;
  if (id === "openNow") return r.openNow;
  return r.dietary.includes(id);
}
function matchesHealth(r) {
  return health.every((goal) => {
    if (goal === "혈당 케어/당뇨 관리") return matchesFilter(r, "lowSugar");
    if (goal === "저염/혈압 관리") return matchesFilter(r, "lowSodium");
    if (goal === "갑각류") return matchesFilter(r, "noShellfish");
    if (goal === "견과류") return matchesFilter(r, "noNuts");
    if (goal === "글루텐/밀가루") return matchesFilter(r, "glutenFree");
    const allergen = {
      "우유/유당불내증": "dairy",
      달걀: "egg",
      "대두/콩": "soy",
    }[goal];
    return !allergen || !r.allergens.includes(allergen);
  });
}
export function getMatchingRestaurants({
  cuisine = "전체",
  term = "",
  useHealth = false,
  filters = selectedFilters,
} = {}) {
  const words = normalizeSearch(term).split(" ").filter(Boolean);
  return restaurants
    .map((r, id) => ({
      ...r,
      id,
    }))
    .filter((r) => {
      const filterWords = r.dietary.map(
        (id) => filterOptions.find((f) => f.id === id)?.label || "",
      );
      const haystack = normalizeSearch(
        [
          r.name,
          r.menu,
          r.type,
          r.desc,
          r.tag,
          ...r.keywords,
          ...filterWords,
        ].join(" "),
      );
      return (
        (cuisine === "전체" || r.type === cuisine) &&
        words.every((w) => haystack.includes(w)) &&
        filters.every((id) => matchesFilter(r, id)) &&
        (!useHealth || matchesHealth(r))
      );
    })
    .sort((a, b) =>
      sort === "거리순"
        ? a.distance - b.distance
        : sort === "별점순"
          ? Number(b.star) - Number(a.star)
          : b.fit - a.fit,
    );
}
function chooseCategory(value, forSearch = false) {
  if (forSearch) searchCategory = value;
  else category = value;
  persist();
  render();
}
function categoryControls(value, forSearch = false) {
  return (
    <div
      className={"category-grid"}
      role={"group"}
      aria-label={"음식 카테고리"}
    >
      {React.Children.toArray(
        categories.map((x) => (
          <button
            className={"pill " + (value === x ? "active" : "")}
            aria-pressed={value === x}
            onClick={(event: any) => {
              chooseCategory(x, forSearch);
            }}
          >
            {x}
          </button>
        )),
      )}
    </div>
  );
}
export function toggleFilter(id, forSearch = false) {
  if (forSearch)
    searchFilters = searchFilters.includes(id)
      ? searchFilters.filter((x) => x !== id)
      : [...searchFilters, id];
  else
    selectedFilters = selectedFilters.includes(id)
      ? selectedFilters.filter((x) => x !== id)
      : [...selectedFilters, id];
  persist();
  render();
}
function resetDiscovery(forSearch = false) {
  if (forSearch) {
    searchCategory = "전체";
    searchFilters = [];
    searchSubmitted = false;
    query = "";
  } else {
    selectedFilters = [];
    category = "전체";
  }
  persist();
  render();
}
function filterControls(forSearch = false) {
  const activeFilters = forSearch ? searchFilters : selectedFilters;
  return (
    <>
      <div className={"row between filter-heading"}>
        <span>
          {"맞춤 필터 "}
          <small>
            {activeFilters.length
              ? activeFilters.length + "개 선택"
              : "선택 없음"}
          </small>
        </span>
        <button
          className={"muted"}
          onClick={(event: any) => {
            resetDiscovery(forSearch);
          }}
        >
          {"초기화"}
        </button>
      </div>
      <div className={"row wrap selected-filters"}>
        {React.Children.toArray(
          activeFilters.map((id) => (
            <button
              className={"pill mint"}
              aria-label={
                filterOptions.find((f) => f.id === id).label + " 필터 해제"
              }
              onClick={(event: any) => {
                toggleFilter(id, forSearch);
              }}
            >
              {filterOptions.find((f) => f.id === id).label}
              {" ×"}
            </button>
          )),
        )}
        <button
          className={"pill filter-toggle"}
          aria-expanded={filtersOpen}
          aria-controls={"filter-options"}
          onClick={(event: any) => {
            filtersOpen = !filtersOpen;
            render();
          }}
        >
          {"☷ 필터 "}
          {filtersOpen ? "접기" : "선택"}
          {activeFilters.length ? " (" + activeFilters.length + ")" : ""}
        </button>
      </div>
      {filtersOpen ? (
        <section id={"filter-options"} className={"panel filter-panel"}>
          <p className={"muted"}>
            {
              "여러 개 선택할 수 있어요. 선택한 모든 조건에 맞는 식당을 보여드려요."
            }
          </p>
          {React.Children.toArray(
            ["식단", "알레르기", "이용 조건"].map((group) => (
              <fieldset>
                <legend>{group}</legend>
                <div className={"row wrap"}>
                  {filterOptions
                    .filter((f) => f.group === group)
                    .map((f) => (
                      <button
                        className={
                          "pill " +
                          (activeFilters.includes(f.id) ? "active" : "")
                        }
                        aria-pressed={activeFilters.includes(f.id)}
                        onClick={(event: any) => {
                          toggleFilter(f.id, forSearch);
                        }}
                      >
                        {activeFilters.includes(f.id) ? "✓ " : ""}
                        {f.label}
                      </button>
                    ))}
                </div>
              </fieldset>
            )),
          )}
        </section>
      ) : (
        ""
      )}
    </>
  );
}
function resultHeading(count, title) {
  return (
    <div className={"sectionhead"}>
      <p>
        {title}{" "}
        <b className={"green"} role={"status"}>
          {count}
          {"개"}
        </b>
      </p>
      <select
        value={sort}
        className={"pill sort-select"}
        aria-label={"정렬"}
        onChange={(event: any) => {
          sort = event.currentTarget.value;
          persist();
          render();
        }}
      >
        {React.Children.toArray(
          ["적합도순", "거리순", "별점순"].map((x) => <option>{x}</option>),
        )}
      </select>
    </div>
  );
}
function noResults(forSearch = false) {
  return (
    <div className={"card pad empty"}>
      <div className={"empty-search-icon"}>{searchIcon}</div>
      <h3>{"조건에 맞는 식당이 없어요"}</h3>
      <p>{"다른 검색어를 입력하거나 필터를 줄여보세요."}</p>
      <button
        className={"pill active"}
        onClick={(event: any) => {
          resetDiscovery(forSearch);
        }}
      >
        {"검색 조건 초기화"}
      </button>
    </div>
  );
}
function recommend() {
  const list = getMatchingRestaurants({ cuisine: category });
  return (
    <section aria-label="추천 매장 목록">
      {categoryControls(category)}
      {filterControls()}
      {resultHeading(list.length, "내 건강 맞춤 매장")}
      {list.length
        ? list.map((r) => (
            <React.Fragment key={r.id}>
              {restaurantCard(r, r.id)}
            </React.Fragment>
          ))
        : noResults()}
      {notice(
        "식당과 영양 정보는 예시 데이터입니다. 실제 알레르기 안전성은 매장에 확인하세요.",
      )}
    </section>
  );
}
function submitSearch(event) {
  event.preventDefault();
  runSearch(event.target.elements.q.value);
}
export function runSearch(value) {
  query = value.trim();
  searchSubmitted = true;
  if (query) {
    recentQueries = [query, ...recentQueries.filter((x) => x !== query)].slice(
      0,
      6,
    );
    persist();
  }
  render();
}
function clearRecent() {
  recentQueries = [];
  persist();
  render();
}
function removeRecent(index) {
  recentQueries.splice(index, 1);
  persist();
  render();
}
function applyTheme(id) {
  searchCategory = "전체";
  searchFilters = [id];
  searchSubmitted = false;
  query = "";
  persist();
  render();
}
function search() {
  const list = getMatchingRestaurants({
    term: query,
    filters: searchFilters,
    cuisine: searchCategory,
    useHealth: safe,
  });
  return (
    <section className="search-page" aria-label="식당 검색 결과">
      <form className="searchbox" role="search" onSubmit={submitSearch}>
        <span className="search-leading">{searchIcon}</span>
        <input
          key={query}
          name="q"
          aria-label="식당 검색"
          type="search"
          autoComplete="off"
          placeholder="식당명, 메뉴, 카테고리를 검색해 보세요"
          defaultValue={query}
          onChange={(event) => {
            if (!event.currentTarget.value && searchSubmitted) {
              query = "";
              searchSubmitted = false;
              render();
            }
          }}
        />
        <button type="submit" aria-label="검색 실행">
          {searchIcon}
        </button>
      </form>
      {!searchSubmitted && (
        <section className="search-discovery" aria-label="검색 조건">
          <div className="panel search-health-toggle">
            <div>
              <b>내 건강 맞춤 필터</b>
              <small>설정한 건강 목표와 알레르기 조건을 적용해요.</small>
            </div>
            <button
              className={"switch " + (safe ? "on" : "")}
              aria-label="안전 필터"
              aria-pressed={safe}
              onClick={() => {
                safe = !safe;
                persist();
                render();
              }}
            />
          </div>
          {categoryControls(searchCategory, true)}
          {filterControls(true)}
          <div className="sectionhead">
            <h2>최근 검색어</h2>
            <button className="text-action" onClick={clearRecent}>
              모두 삭제
            </button>
          </div>
          <div className="row wrap recent-queries">
            {recentQueries.length ? (
              recentQueries.map((term, i) => (
                <span key={term} className="recent-chip">
                  <button onClick={() => runSearch(term)}>{term}</button>
                  <button
                    aria-label={"최근 검색어 " + (i + 1) + " 삭제"}
                    onClick={() => removeRecent(i)}
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              <small>최근 검색어가 없어요.</small>
            )}
          </div>
        </section>
      )}
      {searchSubmitted && (
        <button
          className="text-action search-edit-conditions"
          onClick={() => {
            searchSubmitted = false;
            render();
          }}
        >
          검색 조건 변경
        </button>
      )}
      {resultHeading(list.length, "맞춤 매칭 식당")}
      {query && <p className="muted search-query">“{query}” 검색 결과</p>}
      <div aria-live="polite">
        {list.length ? (
          list.map((r) => (
            <article key={r.id} className="card pad search-result">
              <button
                className="search-result-main menu"
                onClick={() => go("store", r.id)}
              >
                <img src={"/assets/" + r.image + ".png"} alt={r.menu} />
                <div>
                  <small>
                    {r.type} · {r.distance}m
                  </small>
                  <h3>{r.name}</h3>
                  <p className="muted">{r.menu}</p>
                  <p className="green">
                    ★ {r.star} · {r.price.toLocaleString()}원
                  </p>
                </div>
              </button>
              <div className="row wrap result-tags">
                {r.dietary.slice(0, 3).map((id) => (
                  <span key={id} className="tag">
                    {filterOptions.find((f) => f.id === id)?.label}
                  </span>
                ))}
              </div>
              <div className="result-note">
                ✿ {r.fit}% 적합 · {r.openNow ? "영업 중" : "영업 종료"} ·{" "}
                {r.tag}
              </div>
            </article>
          ))
        ) : (
          <div className="card pad empty">
            <h3>검색 결과가 없어요</h3>
            <p>다른 식당명이나 메뉴로 검색해 보세요.</p>
            <button className="pill active" onClick={() => runSearch("")}>
              전체 식당 보기
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
function store() {
  const r = restaurants[current];
  return (
    <>
      <div className={"row between"}>
        <span className={"tag"}>{"✿ 식약처 공공데이터 인증 매장"}</span>
        <div className={"row"}>
          <button
            className={"icon"}
            onClick={(event: any) => {
              save(current);
            }}
          >
            {saved.includes(current) ? "♥" : "♡"}
          </button>
          <button
            className={"icon"}
            onClick={(event: any) => {
              share();
            }}
          >
            {"♧"}
          </button>
        </div>
      </div>
      <div
        className={"card"}
        onClick={(event: any) => {
          go("gallery");
        }}
      >
        {photo(r, current)}
        <span
          className={"photocaption"}
          style={{
            position: "static",
            display: "block",
            textAlign: "right",
          }}
        >
          {"사진 전체 1 / 14 ›"}
        </span>
      </div>
      <div className={"row"}>
        {pill(r.type, "mint")}
        {pill("역삼역 권역")}
      </div>
      <div className={"row between"}>
        <h2
          style={{
            fontSize: "25px",
            margin: "8px 0",
          }}
        >
          {r.name}
        </h2>
        <span>
          {"★ "}
          {r.star}
        </span>
      </div>
      <div className={"card pad"}>
        <p>{"♧\u3000서울 강남구 테헤란로 152 GFC B1층"}</p>
        <p className={"muted"}>
          {"\u3000\u3000역삼역 2번 출구 지하연결통로 150m"}
        </p>
        <hr
          style={{
            border: "0",
            borderTop: "1px solid var(--line)",
            margin: "15px 0",
          }}
        />
        <p>
          {"◷\u3000"}
          <span className={"tag"}>{"영업 중"}</span>
          {"\u300010:30 - 21:00"}
        </p>
        <p className={"muted"}>
          {"\u3000\u3000브레이크타임 15:00 - 17:00 (일 휴무)"}
        </p>
        <small>{"♧ 2026.10 식약처 영양성분 공공 DB 갱신"}</small>
      </div>
      <div className={"card pad"}>
        <div className={"row between"}>
          <div>
            <small className={"green"}>{"CLINICAL NUTRITION MATCH"}</small>
            <h2
              style={{
                margin: "5px 0",
              }}
            >
              {"내 건강 적합도"}
            </h2>
          </div>
          <span className={"fit"}>
            {"♥ "}
            {r.fit}
            {"%"}
          </span>
        </div>
        <div className={"progress"}>
          <i />
        </div>
        <div className={"metrics"}>
          <div>
            <small>{"혈당 안정지수"}</small>
            <span className={"green"}>{"상위 2%"}</span>
          </div>
          <div>
            <small>{"나트륨 저감"}</small>
            <span className={"green"}>{"-40%"}</span>
          </div>
          <div>
            <small>{"알레르기 케어"}</small>
            <span className={"green"}>{"안심 확인"}</span>
          </div>
        </div>
        <p
          className={"notice"}
          style={{
            margin: "12px 0 0",
            padding: "8px",
          }}
        >
          {"ⓘ 비표준 원재료 및 조리실 교차 접촉은 주문 시 재확인 필요"}
        </p>
      </div>
      {React.Children.toArray(
        [r].map((m, i) => (
          <div className={"card pad"}>
            <div className={"menu"}>
              <img src={"assets/" + m.image + ".png"} alt={m.menu} />
              <div>
                <span className={"tag"}>
                  {i ? 97 : 99}
                  {"% 적합"}
                </span>
                <h3
                  style={{
                    fontSize: "16px",
                  }}
                >
                  {m.menu}
                </h3>
                <small>
                  {m.dietary
                    .map((id) => filterOptions.find((f) => f.id === id).label)
                    .join(" · ")}
                </small>
                <div className={"row between"}>
                  <p>
                    {m.price.toLocaleString()}
                    {"원"}
                  </p>
                  <button
                    className={"secondary"}
                    onClick={(event: any) => {
                      toast("당류 1.8g · 단백질 36g · 나트륨 280mg");
                    }}
                  >
                    {"상세 분석"}
                  </button>
                </div>
              </div>
            </div>
            <div className={"metrics"}>
              {"당류 "}
              <span className={"green"}>{"1.8g"}</span>
              {" · 단백질 36g · 나트륨 280mg"}
            </div>
          </div>
        )),
      )}
      <div className={"sectionhead"}>
        <h2>{"⚕ 건강 안심 방문 리뷰"}</h2>
        <button
          className={"pill active"}
          onClick={(event: any) => {
            go("write");
          }}
        >
          {"▧ 리뷰 작성"}
        </button>
      </div>
      <p className={"muted"}>{"질환 관리 및 알레르기 안심 방문자 실후기"}</p>
      {reviewCards(false)}
      {notice(
        "본 리뷰는 이용자의 실제 방문 경험 및 개인 주관에 기반한 후기이며, 의료적 치료 효과나 특정 체질의 절대적 안전성을 보장하지 않습니다.",
      )}
    </>
  );
}
const baseReviews: Review[] = [
  {
    name: "그린플레이트 역삼점",
    star: 5,
    text: "당뇨 관리 중이라 외식이 늘 조심스러웠는데 식후 2시간 혈당이 118mg/dL로 아주 안정적이었습니다. 드레싱이 따로 제공되어 당류 섭취 조절이 편했고, 채소 선도도 매우 뛰어납니다.",
    image: "chicken",
    tag: "식후 2시간 혈당 118mg/dL",
    date: "2026.10.28",
  },
  {
    name: "자연담은 솥밥",
    star: 4.8,
    text: "국물과 반찬 간이 삼삼하고 자극적이지 않아 식후 속 더부룩함이나 갈증이 전혀 없었습니다. 혈압 관리 중인 분들에게 강력 추천합니다.",
    image: "korean",
    tag: "혈압 관리 추천",
    date: "2026.10.24",
  },
  {
    name: "클린키친 테헤란",
    star: 5,
    text: "밀가루 알레르기가 있어 외식이 항상 부담이었는데 조리 도구 분리 세척 확인서가 부착되어 있어 안심하고 맛있게 식사했습니다.",
    image: "bowl",
    tag: "도구 분리 세척 확인",
    date: "2026.10.15",
  },
];
function reviewCards(own) {
  return (
    own
      ? reviews
      : [...reviews.filter((r) => r.restaurantId === current), ...baseReviews]
  )
    .slice(0, own ? 100 : 2)
    .map((r, i) => (
      <article key={r.id || r.name} className={"card pad"}>
        {r.sample && <span className="pill mint">예시 리뷰</span>}
        <div className={"row between"}>
          <b>
            {own
              ? esc(r.name)
              : i
                ? "박*수 · 갑각류 알레르기 케어"
                : "김*연 · 당뇨 혈당 관리인"}{" "}
            <span className={"green"}>{"◎"}</span>
          </b>
          <button
            onClick={(event: any) => {
              toast("검증된 방문 리뷰입니다");
            }}
          >
            {"⋮"}
          </button>
        </div>
        <p className={"muted"}>
          {r.date}
          {" · 방문 인증"}
        </p>
        <p className={"rating"}>
          {"★ "}
          {r.star.toFixed(1)}
          {"\u3000"}
          <span className={"tag"}>
            {"♧ "}
            {esc(r.tag)}
          </span>
        </p>
        <div className={"row wrap"}>
          <span className={"tag"}>{"혈당 케어 안심"}</span>
          <span className={"tag"}>{"저당 식단"}</span>
          <span className={"tag"}>{"✿ 식약처 영양표시 준수"}</span>
        </div>
        <p className={"reviewbody"}>{esc(r.text)}</p>
        <div className={"row between"}>
          {r.photos?.length ? (
            r.photos.map((p) =>
              member.photoUrls[p] ? (
                <img
                  className={"reviewthumb"}
                  src={esc(member.photoUrls[p])}
                  alt={"첨부한 식사 사진"}
                />
              ) : (
                ""
              ),
            )
          ) : (
            <img
              className={"reviewthumb"}
              src={"assets/" + r.image + ".png"}
              alt={"방문 식사 사진"}
            />
          )}
          <button
            className={"pill"}
            disabled={(member.prefs.helpful || []).includes(
              r.id || "example-" + i,
            )}
            onClick={(event: any) => {
              markHelpful(
                esc(r.id || "example-" + i),
                event.currentTarget,
                14 + i,
              );
            }}
          >
            {"♧ 유용해요 "}
            {14 +
              i +
              ((member.prefs.helpful || []).includes(r.id || "example-" + i)
                ? 1
                : 0)}
          </button>
        </div>
      </article>
    ));
}
function reviewList() {
  return (
    <>
      <div className={"panel"}>
        <div className={"row between"}>
          <span className={"green"}>{"● 건강 검증 리뷰어"}</span>
          <small>{"누적 보상 1,800P"}</small>
        </div>
        <h2
          style={{
            fontSize: "28px",
          }}
        >
          {reviews.length} <small>{"건 작성"}</small>
        </h2>
        <div className={"progress"}>
          <i />
        </div>
        <div className={"row between"}>
          <small>{"다음 식단 리포트 보상까지"}</small>
          <span className={"green"}>{"1회 남음"}</span>
        </div>
      </div>
      <div
        className={"panel"}
        style={{
          background: "#ddf8ef",
        }}
      >
        {"✚\u3000식후 생체반응 공유 혜택"}
        <p className={"muted"}>{"\u3000혈당·소화 지표 입력 시 건당 +300P"}</p>
      </div>
      <div className={"row between"}>
        <div className={"row"}>
          {pill("최신순", "active")}
          {pill("혈당 안정순")}
          {pill("별점순")}
        </div>
        <small>
          {"총 "}
          {reviews.length}
          {"개"}
        </small>
      </div>
      {reviewCards(true)}
      {primary("☷ 새 건강 리뷰 작성하기", {
        onClick: (event: any) => {
          go("write");
        },
      })}
    </>
  );
}
function write() {
  return (
    <>
      <div className={"row between"}>
        <p>{"♧ 건강 안심 리뷰 작성"}</p>
        {pill("포인트 +300P", "mint")}
      </div>
      <div className={"card pad menu"}>
        <img
          src={"assets/interior.png"}
          style={{
            width: "48px",
            height: "48px",
          }}
          alt={"식당"}
        />
        <div>
          <b>
            {restaurants[current].name}
            {" ◎"}
          </b>
          <p className={"muted"}>{"역삼역 3번 출구 · 샐러드 & 포케"}</p>
        </div>
        {pill("방문 인증됨", "mint")}
      </div>
      <form
        id={"reviewform"}
        onSubmit={(event: any) => {
          submitReview(event);
        }}
      >
        <div className={"card pad"}>
          <p
            style={{
              textAlign: "center",
              marginTop: "10px",
            }}
          >
            {"식사는 전반적으로 안심되셨나요?"}
          </p>
          <p
            className={"muted"}
            style={{
              textAlign: "center",
            }}
          >
            {"터치하여 건강 만족도를 남겨주세요"}
          </p>
          <div className={"stars"}>
            {React.Children.toArray(
              [1, 2, 3, 4, 5].map((x) => (
                <button
                  type={"button"}
                  aria-label={x + "점"}
                  onClick={(event: any) => {
                    rating = x;
                    document
                      .querySelectorAll<any>(".stars button")
                      .forEach(
                        (b, i) => (b.textContent = i < rating ? "★" : "☆"),
                      );
                    $("#ratingtext").textContent = rating + ".0 / 5.0";
                  }}
                >
                  {x <= rating ? "★" : "☆"}
                </button>
              )),
            )}
          </div>
          <p
            id={"ratingtext"}
            className={"green"}
            style={{
              textAlign: "center",
            }}
          >
            {rating}
            {".0 / 5.0 매우 만족해요"}
          </p>
          <div className={"panel"}>
            <p
              style={{
                fontSize: "12px",
              }}
            >
              {"♧ 어떤 건강 기준을 특히 충족했나요? (중복 선택)"}
            </p>
            <div
              className={"checkgrid"}
              style={{
                marginBottom: "0",
              }}
            >
              {React.Children.toArray(
                [
                  "혈당 안심 케어",
                  "알레르기 철저 격리",
                  "저염식 · 나트륨 조절",
                  "키토/저탄수화물",
                  "글루텐프리 조리",
                ].map((x, i) => (
                  <button
                    type={"button"}
                    className={i < 2 ? "selected" : ""}
                    onClick={(event: any) => {
                      event.currentTarget.classList.toggle("selected");
                    }}
                  >
                    {"⊕ "}
                    {x}
                  </button>
                )),
              )}
            </div>
          </div>
        </div>
        <div className={"card pad"}>
          <h3>{"◉ 식후 건강 체감 데이터"}</h3>
          <p
            style={{
              marginTop: "20px",
            }}
          >
            {"식후 2시간 혈당 수치 "}
            <small>{"(선택)"}</small>
          </p>
          <input
            className={"field"}
            name={"glucose"}
            type={"number"}
            min={"20"}
            max={"600"}
            placeholder={"예: 114 mg/dL"}
          />
          <p
            style={{
              marginTop: "20px",
            }}
          >
            {"식사 후 알레르기 또는 소화 반응"}
          </p>
          <div className={"row"}>
            {React.Children.toArray(
              ["이상 없음 👍", "경미한 증상 ⚠", "해당 없음"].map((x, i) => (
                <button
                  type={"button"}
                  className={"pill " + (!i ? "active" : "")}
                  onClick={(event: any) => {
                    event.currentTarget.parentElement
                      .querySelectorAll("button")
                      .forEach((b) => b.classList.remove("active"));
                    event.currentTarget.classList.add("active");
                  }}
                >
                  {x}
                </button>
              )),
            )}
          </div>
        </div>
        <div className={"card pad"}>
          <div className={"row between"}>
            <h3>{"▧ 상세 방문 경험"}</h3>
            <small id={"count"}>{"0 / 500자 (최소 10자)"}</small>
          </div>
          <textarea
            className={"field"}
            name={"experience"}
            minLength={10}
            maxLength={500}
            required={true}
            placeholder={
              "식단의 간(염도), 드레싱 분리 제공 여부, 식재료 신선도 및 조리도구 교차오염 관리 등에 대해 솔직한 경험을 남겨주세요."
            }
            onChange={(event: any) => {
              $("#count").textContent =
                event.currentTarget.value.length + " / 500자 (최소 10자)";
            }}
          />
          <p className={"muted"}>
            {
              "♧ 드레싱 소스 따로 요청 시 매장 응대가 친절했는지도 알려주시면 유용해요!"
            }
          </p>
        </div>
        <div className={"card pad"}>
          <h3>{"▧ 식단 및 인증 사진"}</h3>
          <div
            id={"uploads"}
            className={"row"}
            style={{
              marginTop: "15px",
            }}
          >
            <label
              className={"upload"}
              style={{
                cursor: "pointer",
              }}
            >
              {"▧ +"}
              <input
                type={"file"}
                accept={"image/*"}
                multiple={true}
                hidden={true}
                onChange={(event: any) => {
                  addPhotos(event.currentTarget);
                }}
              />
            </label>
          </div>
        </div>
        {notice(
          "본 리뷰는 다른 회원의 건강한 외식 선택을 돕는 소중한 정보가 됩니다. 특정 매장에 대한 근거 없는 비방이나 허위 사실은 검토 후 노출이 제한될 수 있습니다.",
        )}
        {primary("리뷰 등록하기 →", {
          type: "submit",
        })}
      </form>
    </>
  );
}
async function finishHealth() {
  if (await persist()) {
    go("recommend");
    toast("맞춤 건강 정보가 저장되었어요");
  }
}
async function submitReview(e) {
  e.preventDefault();
  if (member.reviewPending) return;
  const f = e.target,
    text = f.elements.namedItem("experience").value.trim();
  if (text.length < 10) {
    toast("방문 경험을 10자 이상 입력해 주세요.");
    return;
  }
  member.reviewPending = true;
  const button = f.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = "리뷰 저장 중…";
  const paths = [],
    userId = member.user.id,
    epoch = member.epoch;
  let addedReview = null;
  try {
    for (const photo of member.photos) {
      const extension = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
      }[photo.file.type];
      const path = userId + "/" + crypto.randomUUID() + "." + extension;
      const { error } = await member.client.storage
        .from("review-photos")
        .upload(path, photo.file, {
          contentType: photo.file.type,
        });
      if (error) throw error;
      paths.push(path);
    }
    if (epoch !== member.epoch) throw new Error("Session changed");
    addedReview = {
      id: crypto.randomUUID(),
      restaurantId: current,
      name: restaurants[current].name,
      star: rating,
      text,
      image: restaurants[current].image,
      glucose: f.elements.namedItem("glucose").value
        ? Number(f.elements.namedItem("glucose").value)
        : null,
      criteria: [...f.querySelectorAll(".checkgrid .selected")].map(
        (x) => x.textContent,
      ),
      reaction: f.querySelector(".row .pill.active")?.textContent || "",
      photos: paths,
      tag: f.elements.namedItem("glucose").value
        ? "식후 2시간 혈당 " + f.elements.namedItem("glucose").value + "mg/dL"
        : "건강 안심 방문",
      date: new Date().toLocaleDateString("sv-SE").replaceAll("-", "."),
    };
    reviews.unshift(addedReview);
    if (!(await persist())) throw new Error("Save failed");
    await member.refreshPhotoUrls();
    member.clearPhotos();
    go("reviews");
    render();
    toast("리뷰가 등록되었어요.");
  } catch (error) {
    if (epoch === member.epoch && addedReview) {
      reviews = reviews.filter((r) => r.id !== addedReview.id);
      persist();
    }
    if (paths.length)
      await member.client.storage.from("review-photos").remove(paths);
    toast("리뷰를 저장하지 못했어요. 입력 내용을 확인하고 다시 시도해 주세요.");
  } finally {
    member.reviewPending = false;
    button.disabled = false;
    button.textContent = "리뷰 등록하기 →";
  }
}
function addPhotos(input) {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  for (const file of input.files) {
    if (member.photos.length >= 5) {
      toast("사진은 최대 5장까지 첨부할 수 있어요.");
      break;
    }
    if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast("5MB 이하의 JPG·PNG·WebP·GIF 사진을 선택해 주세요.");
      continue;
    }
    member.photos.push({
      file,
      preview: URL.createObjectURL(file),
    });
  }
  const box = $("#uploads");
  box.querySelectorAll("img").forEach((img) => img.remove());
  for (const photo of member.photos) {
    const img = document.createElement("img");
    img.src = photo.preview;
    img.className = "reviewthumb";
    img.alt = "첨부 사진";
    box.append(img);
  }
  input.value = "";
}
function healthPage() {
  return (
    <>
      {pill("♧ 식약처 & 임상 영양 기준 데이터", "mint")}
      <h2
        style={{
          fontSize: "25px",
          margin: "4px 0",
        }}
      >
        {"나의 맞춤 건강 정보 설정"}
      </h2>
      <p
        className={"muted"}
        style={{
          fontSize: "14px",
        }}
      >
        {
          "건강 상태와 알레르기를 설정하시면 딱 맞는 맛집을 큐레이션해 드립니다."
        }
      </p>
      {notice(
        <>
          {"개인정보 보호 및 의료 자문 고지"}
          <br />
          {
            "회원의 맞춤 건강 정보는 맛집 및 식단 큐레이션 목적으로만 안전하게 활용되며, 전문적인 의료 진단이나 처방을 대신하지 않습니다."
          }
        </>,
      )}
      <h2>{"⚕ 질환 및 건강 관리 목표"}</h2>
      <p className={"muted"}>
        {
          "추천 알고리즘이 해당 목표에 부합하는 저당·저염 식단을 우선 정렬합니다."
        }
      </p>
      <form
        className={"panel"}
        onSubmit={(event: any) => {
          event.preventDefault();
          const v = event.currentTarget.elements
            .namedItem("disease")
            .value.trim();
          if (v && !health.includes(v)) health.push(v);
          persist();
          render();
        }}
      >
        <div
          className={"searchbox health-goal-entry"}
          style={{
            margin: "0",
          }}
        >
          <input
            name={"disease"}
            required={true}
            placeholder={"질병명 직접 입력 또는 검색"}
          />
          <button
            style={{
              whiteSpace: "nowrap",
            }}
          >
            {"+ 추가"}
          </button>
        </div>
        <p className={"muted"}>
          {"등록된 질환: "}
          {React.Children.toArray(
            health
              .filter((x) => !["갑각류", "견과류"].includes(x))
              .map((x) => <span className={"tag"}>{esc(x)}</span>),
          )}
        </p>
      </form>
      <div className={"checkgrid"}>
        {React.Children.toArray(
          [
            "혈당 케어/당뇨 관리",
            "저염/혈압 관리",
            "고지혈증/저지방",
            "다이어트/체중감량",
            "위염/소화기 케어",
            "통풍/저퓨린",
          ].map((x) => healthChip(x)),
        )}
      </div>
      <h2>{"⚠ 식품 알레르기 및 주의 성분"}</h2>
      <p className={"muted"}>
        {
          "선택한 유발 물질이 포함된 조리 식자재는 필터링되어 위험을 차단합니다."
        }
      </p>
      <div className={"checkgrid allergy"}>
        {React.Children.toArray(
          [
            "갑각류",
            "견과류",
            "우유/유당불내증",
            "글루텐/밀가루",
            "달걀",
            "대두/콩",
            "복숭아",
            "메밀",
          ].map((x) => healthChip(x)),
        )}
      </div>
      <div className={"panel"}>
        <p className={"green"}>{"● 현재 설정된 맞춤 필터"}</p>
        <div className={"subtle"}>
          {health.map(esc).join(", ") || "선택된 필터가 없습니다"}
        </div>
        <p className={"muted"}>
          {"ⓘ 등록 즉시 주변 42개 영양 데이터 검증 맛집과 매칭됩니다."}
        </p>
      </div>
      <div className={"spacer"} />
      {primary("✓ 설정 완료하고 맞춤 맛집 보기", {
        onClick: (event: any) => {
          finishHealth();
        },
      })}
    </>
  );
}
function healthChip(x) {
  return (
    <button
      className={health.includes(x) ? "selected" : ""}
      onClick={(event: any) => {
        toggleHealth(x);
      }}
    >
      {health.includes(x) ? "✓ " : ""}
      {x}
    </button>
  );
}
function toggleHealth(x) {
  health = health.includes(x) ? health.filter((y) => y !== x) : [...health, x];
  persist();
  render();
}
function editProfile() {
  return <ProfileEdit member={member} onDone={goBack} />;
}
function profile() {
  return (
    <section className="profile-page">
      <div className={"profilehero"}>
        <div className={"row"}>
          <img className={"avatar"} src={member.avatar()} alt={"프로필 사진"} />
          <div
            style={{
              flex: "1",
            }}
          >
            <h3>
              {esc(member?.name() || "회원")} <small>{"님"}</small>
            </h3>
            <p className={"muted"}>{"Healeat 회원"}</p>
            {pill("⚕ 혈당 케어 집중 관리 중", "mint")}
          </div>
          <button
            className={"secondary"}
            onClick={(event: any) => {
              go("edit-profile");
            }}
          >
            {"수정 ✎"}
          </button>
        </div>
        <div
          className={"row between"}
          style={{
            marginTop: "22px",
          }}
        >
          <small>{"● 식단 안심 지수: 96% 적합 매칭"}</small>
          <small className={"green"}>{"최근 7일 연속 준수"}</small>
        </div>
      </div>
      <div className={"panel"}>
        <div className={"row between"}>
          <b>{"♧ 나의 맞춤 건강 처방"}</b>
          <button
            className={"green"}
            onClick={(event: any) => {
              go("health");
            }}
          >
            {"재설정/수정 ›"}
          </button>
        </div>
        <div className={"subtle"}>
          <small>{"관리 목표 및 식단"}</small>
          <p>
            {React.Children.toArray(
              health
                .filter((x) => !["갑각류", "견과류"].includes(x))
                .map((x) => pill(esc(x))),
            )}
          </p>
        </div>
        <div className={"subtle"}>
          <small>{"엄격 차단 알레르기 성분"}</small>
          <p>
            {pill("⚠ 갑각류 배제", "red")} {pill("⚠ 땅콩·견과류 배제", "red")}
          </p>
        </div>
      </div>
      <section className="profile-activity" aria-label="최근 활동">
        <div className="sectionhead">
          <h2>최근 작성 리뷰</h2>
          <button className="text-action" onClick={() => go("reviews")}>
            전체보기 ›
          </button>
        </div>
        {reviews.length ? (
          reviews.slice(0, 2).map((r) => (
            <article key={r.id} className="card pad activity-review">
              <div className="row between">
                <h3>{r.name}</h3>
                <span className="green">★ {r.star.toFixed(1)}</span>
              </div>
              {r.sample && <span className="pill mint">예시 리뷰</span>}
              <p>{r.text}</p>
              <small>{r.date}</small>
            </article>
          ))
        ) : (
          <p className="muted">방문한 식당에 첫 리뷰를 남겨보세요.</p>
        )}
        <div className="sectionhead">
          <h2>저장한 식당</h2>
          <button className="text-action" onClick={() => go("saved")}>
            전체보기 ›
          </button>
        </div>
        <div className="profile-saved-list">
          {saved.slice(0, 3).map((id) => {
            const r = restaurants[id];
            return (
              <button
                key={id}
                className="card pad profile-saved-item"
                onClick={() => go("store", id)}
              >
                <img src={"/assets/" + r.image + ".png"} alt={r.menu} />
                <span>
                  <strong>{r.name}</strong>
                  <small>
                    {r.type} · {r.distance}m
                  </small>
                </span>
                <span className="green">›</span>
              </button>
            );
          })}
        </div>
      </section>
      <button
        className={"card pad row"}
        style={{
          width: "100%",
          textAlign: "left",
        }}
        onClick={(event: any) => {
          toast("이번 달 누적 +100P 적립 완료");
        }}
      >
        <span className={"icon"}>{"✿"}</span>
        <div>
          {"식약처 인증 방문 포인트 내역"}
          <small
            style={{
              display: "block",
            }}
          >
            {"이번 달 누적 +100P 적립 완료"}
          </small>
        </div>
        <span className={"green"}>{"›"}</span>
      </button>
      <div className={"card pad"}>
        <small>{"식단 & 케어 관리"}</small>
        {React.Children.toArray(
          ["식단 푸시 및 영양 리마인더", "식약처 데이터 자동 필터"].map(
            (x, i) => (
              <div className={"settingsrow"}>
                <span className={"icon"}>{i ? "♙" : "♧"}</span>
                <div>
                  {x}
                  <small
                    style={{
                      display: "block",
                    }}
                  >
                    {i
                      ? "유해 첨가물 및 알레르겐 성분 실시간 감지"
                      : "매 식사 30분 전 혈당 케어 가이드 발송"}
                  </small>
                </div>
                <button
                  className={"switch " + (read("switch" + i, true) ? "on" : "")}
                  aria-label={x}
                  onClick={(event: any) => {
                    event.currentTarget.classList.toggle("on");
                    member.write(
                      "switch" + i,
                      event.currentTarget.classList.contains("on"),
                    );
                  }}
                />
              </div>
            ),
          ),
        )}
      </div>
      <div className={"card pad"}>
        <small>{"계정 및 고객 지원"}</small>
        {React.Children.toArray(
          [
            "자주 묻는 질문 (FAQ)",
            "식약처 공공 데이터 출처 및 검증 정책",
            "서비스 이용약관 및 개인정보 처리방침",
          ].map((x, i) => (
            <button className={"listlink"} onClick={() => showInfo(i + 1)}>
              {x}
              <span>{"›"}</span>
            </button>
          )),
        )}
      </div>
      <button
        className={"secondary"}
        style={{
          width: "100%",
          padding: "17px",
        }}
        onClick={(event: any) => {
          member.logout();
        }}
      >
        {"⇥ 로그아웃"}
      </button>
      <p
        className={"muted"}
        style={{
          textAlign: "center",
          margin: "25px",
        }}
      >
        {"회원 탈퇴\u3000 ·\u3000 버전 2.4.0 (최신 빌드)"}
      </p>
    </section>
  );
}
function savedPage() {
  return (
    <>
      <div className={"panel row"}>
        <span
          className={"icon"}
          style={{
            background: "#6cf4bf",
          }}
        >
          {"♧"}
        </span>
        <div>
          {esc(member?.name() || "회원")}
          {" 님의 안심 식탁 "}
          <span className={"green"}>{"●"}</span>
          <small
            style={{
              display: "block",
            }}
          >
            {"혈당 및 저염 맞춤 분석 완료"}
          </small>
        </div>
        {pill(saved.length + "곳 안심 저장")}
      </div>
      <div className={"filterbar"}>
        {pill("전체 " + saved.length, "active")}
        {pill("혈당 케어")}
        {pill("저염 DASH")}
        {pill("알레르겐 차단")}
      </div>
      <p className={"muted"}>{"♧ 서울 강남구 역삼동 기준"}</p>
      {saved.length ? (
        saved.map((id) => {
          const r = restaurants[id];
          return (
            <article className={"card"}>
              {photo(r, id)}
              <div className={"pad"}>
                <div className={"row between"}>
                  <h3>{r.name}</h3>
                  <span className={"tag"}>
                    {"★ "}
                    {r.star}
                    {" (128)"}
                  </span>
                </div>
                <small>
                  {r.type}
                  {" · 건강 도시락"}
                </small>
                <div
                  className={"panel"}
                  style={{
                    padding: "12px",
                  }}
                >
                  <small className={"green"}>
                    {"● "}
                    {r.tag}
                  </small>
                  <p>
                    <span className={"tag"}>{"유기농 생채소"}</span>{" "}
                    <span className={"tag"}>
                      {"전 메뉴 영양성분 완벽 표기"}
                    </span>
                  </p>
                </div>
                <div className={"row between"}>
                  <small className={"green"}>
                    {"♧ 임상영양사 승인 레시피"}
                  </small>
                  <button
                    className={"secondary"}
                    onClick={(event: any) => {
                      go("store", id);
                    }}
                  >
                    {"매장 홈 →"}
                  </button>
                </div>
              </div>
            </article>
          );
        })
      ) : (
        <div className={"empty"}>
          {"아직 저장한 식당이 없어요."}
          <p>{"마음에 드는 식당의 ♡를 눌러 보세요."}</p>
          <button
            className={"pill active"}
            onClick={(event: any) => {
              go("recommend");
            }}
          >
            {"식당 둘러보기"}
          </button>
        </div>
      )}
      {notice(
        <>
          {"건강 프로필이 변경되셨나요?"}
          <br />
          {
            "혈당 수치나 알레르기 항목을 수정하면 식당 적합도 순위가 재계산됩니다."
          }
        </>,
      )}
    </>
  );
}
function gallery() {
  return (
    <>
      <div className={"filterbar"}>
        {React.Children.toArray(
          ["전체 14", "음식 8", "매장 내부/외관 3", "영양성분표"].map(
            (x, i) => (
              <button
                className={"pill " + (!i ? "active" : "")}
                onClick={(event: any) => {
                  document
                    .querySelectorAll<any>(".filterbar button")
                    .forEach((b) => b.classList.remove("active"));
                  event.currentTarget.classList.add("active");
                  document
                    .querySelectorAll<any>(".gallery .photo")
                    .forEach(
                      (p, j) =>
                        (p.style.display =
                          i === 0 || j % 3 === i - 1 ? "" : "none"),
                    );
                }}
              >
                {x}
              </button>
            ),
          ),
        )}
      </div>
      <p className={"muted"}>{"✿ 영양 임상 검증 식단 및 실시간 매장 사진"}</p>
      <div className={"gallery"}>
        {React.Children.toArray(
          [
            "아보카도 생연어 보울",
            "영양성분 표시 인증원본",
            "1층 메인 다이닝 홀",
            "수비드 허브치킨 퀴노아",
            "안심 스테이크 웜볼",
            "오픈 조리대 & 위생시설",
            "알레르겐 & 첨가물 태그",
            "당일 입고 스마트팜 채소",
            "구운 두부 에다마메 보울",
            "창가 바 테이블",
            "훈제오리 단호박 정식",
            "콜드체인 온도 관리",
          ].map((x, i) => (
            <div className={"photo"}>
              <img
                src={
                  "assets/" +
                  [
                    "salmon",
                    "bowl",
                    "interior",
                    "chicken",
                    "korean",
                    "interior",
                  ][i % 6] +
                  ".png"
                }
                alt={x}
              />
              <span className={"pill"}>
                {
                  [
                    "★ 대표 메뉴",
                    "♧ 식약처 인증",
                    "내부 전경",
                    "저당 식단",
                    "키토 친화",
                    "위생 1등급",
                  ][i % 6]
                }
              </span>
              <div className={"photocaption"}>
                <b>{x}</b>
                <br />
                <small
                  style={{
                    color: "#ddd",
                  }}
                >
                  {"영양 안심 검증 사진"}
                </small>
              </div>
            </div>
          )),
        )}
      </div>
      {notice(
        <>
          {"식단 안심 검증 정책"}
          <br />
          {
            "영양 전문가팀이 영양표기 및 첨가물 표기 지원 여부를 교차 검증합니다."
          }
        </>,
      )}
    </>
  );
}
function showInfo(i) {
  const titles = [
    "",
    "자주 묻는 질문",
    "데이터 출처 및 검증 정책",
    "개인정보 처리방침",
  ];
  const text = [
    "",
    "건강 정보 설정에서 목표와 알레르기를 선택하면 맞춤 식당을 확인할 수 있습니다. 식당의 하트 버튼으로 저장하고, 방문 후 건강 리뷰를 남겨 보세요.",
    "현재 화면은 첨부 디자인을 구현한 프론트엔드 데모입니다. 식당 정보, 영양 수치 및 인증 표시는 예시 데이터이며 외부 공공 DB와 연결되어 있지 않습니다.",
    "건강 설정, 저장 식당, 리뷰와 첨부 사진, 최근 검색어 및 앱 설정은 회원 계정별로 Supabase에 저장됩니다. 다른 회원은 내 데이터와 사진을 조회할 수 없습니다.",
  ];
  dialogContent = (
    <>
      <h3>{titles[i]}</h3>
      <p>{text[i]}</p>
      <button
        className={"primary"}
        onClick={(event: any) => {
          closeDialog();
        }}
      >
        {"확인"}
      </button>
    </>
  );
  render();
}
function markHelpful(key, button, count) {
  const votes = member.prefs.helpful || [];
  if (votes.includes(key)) return;
  member.prefs.helpful = [...votes, key];
  button.textContent = "👍 유용해요 " + (count + 1);
  button.disabled = true;
  persist();
}
async function share() {
  try {
    await navigator.clipboard.writeText(location.href);
    toast("매장 링크를 복사했어요");
  } catch {
    toast("주소창의 링크를 복사해 주세요");
  }
}
let locationMenuOpen = false;
const locationIcon = (
  <svg
    width={"20"}
    height={"20"}
    viewBox={"0 0 24 24"}
    fill={"none"}
    stroke={"currentColor"}
    strokeWidth={"1.8"}
    aria-hidden={"true"}
  >
    <circle cx={"12"} cy={"12"} r={"6"} />
    <circle cx={"12"} cy={"12"} r={"2"} />
    <path d={"M12 2v4m0 12v4M2 12h4m12 0h4"} />
  </svg>
);
function toggleLocationMenu() {
  locationMenuOpen = !locationMenuOpen;
  render();
}
function editLocation() {
  locationMenuOpen = false;
  render();
  dialogContent = (
    <form
      onSubmit={(event: any) => {
        applyLocation(event);
      }}
    >
      <h2>{"위치 재설정"}</h2>
      <p className={"muted"}>{"맛집을 찾을 기준 위치를 입력해 주세요."}</p>
      <label htmlFor={"location-name"}>{"장소 이름"}</label>
      <input
        className={"field"}
        id={"location-name"}
        name={"place"}
        required={true}
        maxLength={40}
        defaultValue={esc(read("locationPlace", "역삼동 GFC"))}
        placeholder={"예: 역삼동 GFC"}
      />
      <label htmlFor={"location-address"}>{"주소 또는 주변 지역"}</label>
      <input
        className={"field"}
        id={"location-address"}
        name={"address"}
        required={true}
        maxLength={80}
        defaultValue={esc(read("locationAddress", "강남구 역삼동 테헤란로"))}
        placeholder={"예: 강남구 역삼동 테헤란로"}
      />
      <p className={"muted"}>
        {"설정한 위치는 회원 계정에 저장됩니다. 지도는 예시 화면입니다."}
      </p>
      <div className={"dialog-actions"}>
        <button
          type={"button"}
          className={"secondary"}
          onClick={(event: any) => {
            closeDialog();
          }}
        >
          {"취소"}
        </button>
        <button className={"primary"} type={"submit"}>
          {"위치 설정"}
        </button>
      </div>
    </form>
  );
  render();
}
async function applyLocation(event) {
  event.preventDefault();
  const f = event.target;
  const place = f.elements.namedItem("place").value.trim(),
    address = f.elements.namedItem("address").value.trim();
  if (!place || !address) return;
  member.prefs.locationPlace = place;
  member.prefs.locationAddress = address;
  closeDialog();
  render();
  if (await persist()) toast("기준 위치를 변경했어요");
}
export function AppView() {
  if (!member.ready) return member.view();
  const page = location.hash.slice(1) || "home",
    isHome = page === "home" || page === "home-basic";
  const titles = {
    home: "역삼동 GFC",
    "home-basic": "역삼동 GFC",
    recommend: "추천 리스트",
    search: "검색",
    profile: "마이페이지",
    "edit-profile": "프로필 수정",
    health: "건강 정보 설정",
    store: "가게 홈",
    write: "리뷰 작성",
    reviews: "작성 리뷰",
    saved: "저장한 식당",
    gallery: "가게 홈",
    map: "지도",
  };
  const views = {
    home,
    "home-basic": basicHome,
    recommend,
    search,
    profile,
    "edit-profile": editProfile,
    health: healthPage,
    store,
    write,
    reviews: reviewList,
    saved: savedPage,
    gallery,
    map: () => mapView(true),
  };
  const View = views[page] || home;
  const active =
    page === "home-basic"
      ? "home"
      : ["health", "profile", "saved", "reviews", "edit-profile"].includes(page)
        ? "profile"
        : page;
  const heading = isHome ? (
    <div className={"location-heading"}>
      <h1>
        <button
          className={"location-trigger"}
          aria-expanded={locationMenuOpen}
          aria-controls={"location-menu"}
          onClick={(event: any) => {
            toggleLocationMenu();
          }}
        >
          <span className={"icon"}>{locationIcon}</span>
          <span className={"location-text"}>
            <span>
              {esc(read("locationPlace", "역삼동 GFC"))}{" "}
              <span className={"chevron"}>{"⌄"}</span>
            </span>
            <small>
              {esc(read("locationAddress", "강남구 역삼동 테헤란로"))}
            </small>
          </span>
        </button>
      </h1>
      {locationMenuOpen ? (
        <div className={"location-menu"} id={"location-menu"}>
          <button
            onClick={(event: any) => {
              editLocation();
            }}
          >
            {locationIcon}
            <span>{"위치 재설정"}</span>
          </button>
        </div>
      ) : (
        ""
      )}
    </div>
  ) : (
    <>
      <button
        className={"back"}
        aria-label={"뒤로 가기"}
        onClick={(event: any) => {
          goBack();
        }}
      >
        <svg
          width={"24"}
          height={"24"}
          viewBox={"0 0 24 24"}
          fill={"none"}
          stroke={"currentColor"}
          strokeWidth={"2"}
          strokeLinecap={"round"}
          strokeLinejoin={"round"}
          aria-hidden={"true"}
        >
          <path d={"m15 18-6-6 6-6"} />
        </svg>
      </button>
      <h1>{titles[page] || titles.home}</h1>
    </>
  );
  document.title = (titles[page] || "홈") + " · Healeat";
  return (
    <>
      <div className={"member-toolbar"}>
        <span>
          {esc(member.name())}
          {"님"}
        </span>
        <button
          onClick={(event: any) => {
            member.logout();
          }}
        >
          {"로그아웃"}
        </button>
      </div>
      <div id={"cloud-status"} className={"cloud-status"} role={"status"}>
        {member.statusView()}
      </div>
      <header>
        {heading}
        {isHome ? (
          <button
            aria-label={"알림"}
            onClick={(event: any) => {
              toast("새로운 알림이 없습니다");
            }}
          >
            {"♧"}
          </button>
        ) : (
          ""
        )}
      </header>
      <main className={"content " + (page === "map" ? "map-content" : "")}>
        <View />
      </main>
      {["store", "write", "gallery", "reviews", "saved", "map"].includes(
        page,
      ) ? (
        ""
      ) : (
        <nav aria-label={"주 메뉴"}>
          {React.Children.toArray(
            [
              ["home", "⌂", "홈"],
              ["recommend", "⚒", "추천 리스트"],
              ["search", searchIcon, "검색"],
              ["profile", "ϟ", "건강 프로필"],
            ].map(([p, icon, t]) => (
              <button
                className={active === p ? "active" : ""}
                onClick={(event: any) => {
                  go(p);
                }}
              >
                <span>{icon}</span>
                {t}
              </button>
            )),
          )}
        </nav>
      )}
    </>
  );
}
function basicHome() {
  return (
    <>
      <div className={"healthbar"}>
        <span className={"green"}>
          {"● "}
          {esc(member?.name() || "회원")}
          {"님 맞춤 · 혈당 관리 · 저염식"}
        </span>
        <button
          onClick={(event: any) => {
            go("home");
          }}
        >
          {"위치 기반 추천 ›"}
        </button>
      </div>
      {mapView()}
      <div className={"sectionhead"}>
        <h2>{"● 근처 건강 맛집 더보기"}</h2>
        <button
          onClick={(event: any) => {
            go("recommend");
          }}
        >
          {"전체보기 ›"}
        </button>
      </div>
      <div className={"horizontal"}>
        {React.Children.toArray(
          restaurants.map((r, i) => restaurantCard(r, i)),
        )}
      </div>
      <div className={"panel"}>
        <h3>{"✚ 식단 맞춤 보증 리포트"}</h3>
        <p className={"muted"}>
          {
            "역삼동 GFC 및 테헤란로 인근 매장들의 영양성분표 및 조리법 검증을 바탕으로 산출된 안심 지수입니다."
          }
        </p>
      </div>
    </>
  );
}

// Login and persistence coordinator. Passwords are never stored in application data.
export const member = {
  user: null,
  ready: false,
  phase: "loading",
  mode: "login",
  message: "",
  prefs: {} as MemberPreferences,
  pending: false,
  error: "",
  epoch: 0,
  revision: 0,
  savedRevision: 0,
  saving: null,
  photos: [],
  photoUrls: {},
  reviewPending: false,
  get client() {
    return supabase;
  },
  avatar() {
    return this.photoUrls[this.prefs.avatarPath] || "/assets/avatar.png";
  },
  profilePending: false,
  name() {
    return this.user?.user_metadata?.username || "회원";
  },
  read(key, fallback) {
    return this.prefs[key] ?? fallback;
  },
  write(key, value) {
    this.prefs[key] = value;
    this.queueSave();
  },
  snapshot() {
    return JSON.parse(
      JSON.stringify({
        saved,
        reviews,
        health,
        recentQueries,
        prefs: this.prefs,
        selectedFilters,
        searchFilters,
        category,
        searchCategory,
        sort,
        safe,
      }),
    );
  },
  reset() {
    saved = [];
    reviews = [];
    health = [];
    recentQueries = [];
    selectedFilters = [];
    searchFilters = [];
    searchSubmitted = false;
    category = searchCategory = "전체";
    query = "";
    sort = "적합도순";
    safe = true;
    rating = 5;
    current = 0;
    this.prefs = {};
    this.photoUrls = {};
    this.clearPhotos();
    this.revision = this.savedRevision = 0;
    this.error = "";
    this.ready = false;
  },
  clearPhotos() {
    for (const p of this.photos) URL.revokeObjectURL(p.preview);
    this.photos = [];
  },
  screen() {
    render();
  },
  view() {
    document.title = "로그인 · Healeat";
    return <AuthScreen member={this} />;
  },
  setMode(mode) {
    if (this.pending) return;
    this.mode = mode;
    this.message = "";
    this.screen();
  },
  async digest(value) {
    return Array.from(
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
      ),
    )
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
  },
  async credentials(username, password) {
    // Stable v1 mapping permits simple IDs and one-character passwords with Supabase email Auth.
    // This is an identifier mapping, not a replacement for Supabase's password hashing or validation.
    return {
      email: `gp-${await this.digest(username.normalize("NFKC").trim().toLowerCase())}@login.greenplate.app`,
      password: `gp-v1-${await this.digest(password)}`,
    };
  },
  async submit(event) {
    event.preventDefault();
    if (this.pending) return;
    const form = event.target,
      username = form.elements.namedItem("username").value.trim(),
      password = form.elements.namedItem("password").value;
    const status = form.querySelector('[role="status"]'),
      button = form.querySelector('[type="submit"]');
    if (!username || !password) {
      status.textContent = "아이디와 비밀번호를 입력해 주세요.";
      return;
    }
    if (!this.client) {
      status.textContent = "연결 설정을 확인해 주세요.";
      return;
    }
    this.pending = true;
    button.disabled = true;
    status.textContent = "처리 중…";
    try {
      const credentials = await this.credentials(username, password);
      const usernameKey = await this.digest(
        username.normalize("NFKC").trim().toLowerCase(),
      );
      const lookup = await this.client.rpc("resolve_login_email", {
        p_username_key: usernameKey,
      });
      if (lookup.error && !["PGRST202", "42883"].includes(lookup.error.code))
        throw lookup.error;
      if (lookup.data) {
        if (this.mode === "signup") throw { code: "user_already_exists" };
        credentials.email = lookup.data;
      }

      const result =
        this.mode === "signup"
          ? await this.client.auth.signUp({
              ...credentials,
              options: {
                data: {
                  username,
                },
              },
            })
          : await this.client.auth.signInWithPassword(credentials);
      if (result.error) throw result.error;
      if (!result.data.session) {
        this.message =
          "가입 후 바로 시작하려면 프로젝트 관리자가 Supabase 이메일 확인 설정을 꺼야 합니다. 설정 후 다른 아이디로 가입해 주세요.";
        this.phase = "auth";
        this.screen();
        return;
      }
      if (
        this.mode === "login" &&
        result.data.session.user.user_metadata?.username
          ?.normalize("NFKC")
          .trim()
          .toLowerCase() !== username.normalize("NFKC").trim().toLowerCase()
      ) {
        await this.client.auth.signOut({ scope: "local" });
        throw { code: "invalid_credentials" };
      }
      await this.load(result.data.session.user);
    } catch (error) {
      status.textContent =
        error.code === "invalid_credentials"
          ? "아이디 또는 비밀번호가 맞지 않아요. 처음이라면 회원가입을 해주세요."
          : error.code === "user_already_exists"
            ? "이미 가입한 아이디예요. 로그인해 주세요."
            : error.code === "email_not_confirmed"
              ? "이 계정은 이메일 확인을 기다리고 있어요. 프로젝트 관리자에게 알려주세요."
              : error.code === "over_email_send_rate_limit"
                ? "가입 요청이 잠시 제한됐어요. 잠시 후 다시 시도해 주세요."
                : "요청을 완료하지 못했어요. 연결 상태와 가입 설정을 확인해 주세요.";
      this.message = status.textContent;
    } finally {
      this.pending = false;
      button.disabled = false;
      if (!this.ready && this.phase === "auth") this.screen();
    }
  },
  async load(user) {
    if (this.user?.id === user.id && this.ready) return;
    const token = ++this.epoch;
    this.reset();
    this.user = user;
    this.phase = "loading";
    this.screen();
    try {
      const [stateResult, restaurantResult] = await Promise.all([
        this.client
          .from("member_data")
          .select("data")
          .eq("user_id", user.id)
          .maybeSingle(),
        this.client.from("restaurants").select("id,data").order("id"),
      ]);
      if (token !== this.epoch) return;
      if (stateResult.error) throw stateResult.error;
      if (restaurantResult.error) throw restaurantResult.error;
      if (!restaurantResult.data?.length)
        throw new Error("Restaurant data is missing");
      restaurants.splice(
        0,
        restaurants.length,
        ...restaurantResult.data.map((row) => row.data),
      );
      const data = stateResult.data?.data || {};
      saved = (data.saved || []).filter(
        (id) => Number.isInteger(id) && restaurants[id],
      );
      reviews = data.reviews || [];
      health = data.health || [];
      recentQueries = data.recentQueries || [];
      this.prefs = data.prefs || {};
      selectedFilters = (data.selectedFilters || []).filter((id) =>
        filterOptions.some((f) => f.id === id),
      );
      searchFilters = (data.searchFilters || []).filter((id) =>
        filterOptions.some((f) => f.id === id),
      );
      category = categories.includes(data.category) ? data.category : "전체";
      searchCategory = categories.includes(data.searchCategory)
        ? data.searchCategory
        : "전체";
      sort = ["적합도순", "거리순", "별점순"].includes(data.sort)
        ? data.sort
        : "적합도순";
      safe = data.safe ?? true;
      const addStarterContent = !this.prefs.starterContentVersion;
      if (addStarterContent) {
        saved = [
          ...new Set([...saved, ...[0, 1, 2].filter((id) => restaurants[id])]),
        ];
        const examples: Review[] = [0, 1]
          .filter((id) => restaurants[id])
          .map((id, i) => ({
            id: "starter-review-" + id,
            restaurantId: id,
            name: restaurants[id].name,
            star: i ? 4 : 5,
            text: i
              ? "간이 담백하고 채소가 다양해서 편하게 식사했어요. 다음에 또 방문하고 싶어요."
              : "드레싱을 따로 요청할 수 있어서 좋았어요. 신선한 재료로 든든하게 먹었습니다.",
            image: restaurants[id].image,
            tag: "Healeat 이용 예시",
            date: new Date().toLocaleDateString("sv-SE").replaceAll("-", "."),
            sample: true,
          }));
        reviews = [
          ...reviews,
          ...examples.filter(
            (r) => !reviews.some((existing) => existing.id === r.id),
          ),
        ];
        this.prefs.starterContentVersion = 1;
      }
      await this.refreshPhotoUrls();
      if (token !== this.epoch) return;
      this.phase = "ready";
      this.ready = true;
      if (addStarterContent) await this.queueSave();
      if (token !== this.epoch) return;
      render();
    } catch (error) {
      if (token !== this.epoch) return;
      this.phase = "data-error";
      this.screen();
      console.error("회원 데이터 로드 실패", error.code || error.message);
    }
  },
  queueSave() {
    if (!this.ready || !this.user) return Promise.resolve(false);
    this.revision++;
    this.updateStatus();
    return this.flush();
  },
  async flush() {
    if (this.saving) return this.saving;
    const userId = this.user?.id,
      token = this.epoch;
    if (!userId) return false;
    this.saving = (async () => {
      while (this.savedRevision < this.revision && token === this.epoch) {
        const revision = this.revision,
          data = this.snapshot();
        try {
          const { error } = await this.client.from("member_data").upsert({
            user_id: userId,
            data,
            updated_at: new Date().toISOString(),
          });
          if (error) throw error;
          if (token !== this.epoch) return false;
          this.savedRevision = revision;
          this.error = "";
        } catch (error) {
          if (token === this.epoch)
            this.error = "저장하지 못했어요. 연결 확인 후 다시 저장해 주세요.";
          return false;
        }
      }
      return true;
    })();
    try {
      return await this.saving;
    } finally {
      this.saving = null;
      this.updateStatus();
    }
  },
  updateStatus() {
    render();
  },
  statusView() {
    return this.error ? (
      <button
        className={"cloud-error"}
        onClick={(event: any) => {
          member.retrySave();
        }}
      >
        {esc(this.error)}
        {" 다시 저장"}
      </button>
    ) : this.savedRevision < this.revision ? (
      "저장 중…"
    ) : (
      "모든 변경사항이 저장됐어요"
    );
  },
  async retrySave() {
    await this.flush();
    this.updateStatus();
  },
  async updateProfile(username: string, file: File | null) {
    if (!username) throw new Error("아이디를 입력해 주세요.");
    if (this.profilePending) throw new Error("프로필을 저장하고 있어요.");
    this.profilePending = true;
    const token = this.epoch;
    let newPath = "",
      referenced = false;
    try {
      if (file) {
        const ext = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
          "image/gif": "gif",
        }[file.type];
        if (!ext || file.size > 5 * 1024 * 1024)
          throw new Error("5MB 이하의 이미지 파일을 선택해 주세요.");
        newPath = this.user.id + "/profile/" + crypto.randomUUID() + "." + ext;
        const { error } = await this.client.storage
          .from("review-photos")
          .upload(newPath, file, { contentType: file.type });
        if (error)
          throw new Error("사진을 업로드하지 못했어요. 다시 시도해 주세요.");
      }
      if (token !== this.epoch) throw new Error("다시 로그인해 주세요.");
      if (username !== this.name()) {
        const usernameKey = await this.digest(
          username.normalize("NFKC").trim().toLowerCase(),
        );
        const { error } = await this.client.rpc("set_login_name", {
          p_username: username,
          p_username_key: usernameKey,
        });
        if (error)
          throw new Error(
            ["23505", "email_exists", "user_already_exists"].includes(
              error.code,
            )
              ? "이미 사용 중인 아이디예요. 다른 아이디를 입력해 주세요."
              : ["PGRST202", "42883"].includes(error.code)
                ? "아이디 변경을 위한 서버 설정이 필요해요. 관리자에게 문의해 주세요."
                : "아이디를 변경하지 못했어요. 연결 상태를 확인하고 다시 시도해 주세요.",
          );
        if (token !== this.epoch) throw new Error("다시 로그인해 주세요.");
        this.user = {
          ...this.user,
          user_metadata: { ...this.user.user_metadata, username },
        };
        // Refresh cached session metadata after the atomic server-side rename.
        const refreshed = await this.client.auth.refreshSession();
        if (!refreshed.error && refreshed.data.session)
          this.user = refreshed.data.session.user;
      }
      if (newPath) {
        this.prefs.avatarPath = newPath;
        referenced = true;
      }
      if (!(await this.queueSave()))
        throw new Error(
          "변경사항을 아직 저장하지 못했어요. 연결 확인 후 다시 저장해 주세요.",
        );
      await this.refreshPhotoUrls();
      render();
    } finally {
      if (newPath && !referenced)
        await this.client.storage.from("review-photos").remove([newPath]);
      this.profilePending = false;
    }
  },
  async logout() {
    if (this.pending) return;
    if (this.reviewPending || this.profilePending) {
      toast("저장을 마친 뒤 로그아웃해 주세요.");
      return;
    }
    if (this.ready && this.savedRevision < this.revision) {
      if (!(await this.flush())) {
        toast(
          "아직 저장하지 못한 변경사항이 있어요. 다시 저장한 뒤 로그아웃해 주세요.",
        );
        return;
      }
    }
    const { error } = await this.client.auth.signOut({
      scope: "local",
    });
    if (error) {
      toast("로그아웃하지 못했어요. 다시 시도해 주세요.");
      return;
    }
    this.epoch++;
    this.user = null;
    this.reset();
    this.phase = "auth";
    this.message = "";
    location.hash = "";
    this.screen();
  },
  async refreshPhotoUrls() {
    const epoch = this.epoch,
      paths = [
        ...reviews.flatMap((r) => r.photos || []),
        ...(this.prefs.avatarPath ? [this.prefs.avatarPath] : []),
      ];
    if (!paths.length) return;
    const { data, error } = await this.client.storage
      .from("review-photos")
      .createSignedUrls(paths, 3600);
    if (epoch !== this.epoch) return;
    if (!error)
      for (const item of data || [])
        if (item.signedUrl) this.photoUrls[item.path] = item.signedUrl;
  },
  async start() {
    if (!this.client) {
      this.phase = "auth";
      this.message = "연결 설정을 확인해 주세요.";
      this.screen();
      return;
    }
    this.client.auth.onAuthStateChange((event: any, session) => {
      const manualAuth = this.pending;
      // Defer work so no Supabase request is awaited inside Auth's state callback.
      setTimeout(() => {
        if (!session) {
          this.epoch++;
          this.user = null;
          this.reset();
          this.phase = "auth";
          this.screen();
        } else if (
          event === "SIGNED_IN" &&
          !manualAuth &&
          this.user?.id !== session.user.id
        )
          this.load(session.user);
      }, 0);
    });
    const { data, error } = await this.client.auth.getSession();
    if (error || !data.session) {
      this.phase = "auth";
      this.screen();
      return;
    }
    const currentUser = await this.client.auth.getUser();
    await this.load(currentUser.data?.user || data.session.user);
  },
};
export type MemberController = typeof member;

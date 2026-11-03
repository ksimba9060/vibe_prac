import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export function RestaurantCarousel({ children }: { children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const updateEdges = useCallback(() => {
    const el = track.current;
    if (el)
      setEdges({
        start: el.scrollLeft <= 1,
        end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
      });
  }, []);
  useEffect(() => {
    updateEdges();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateEdges);
    if (track.current) observer?.observe(track.current);
    window.addEventListener("resize", updateEdges);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateEdges);
    };
  }, [children, updateEdges]);
  const scroll = (direction: number) => {
    const el = track.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step =
      (card?.getBoundingClientRect().width || el.clientWidth * 0.8) + 14;
    const reducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollBy({
      left: step * direction,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };
  return (
    <div
      className="restaurant-carousel"
      role="region"
      aria-label="근처 건강 맛집"
    >
      <div
        ref={track}
        className="horizontal carousel-track"
        onScroll={updateEdges}
        tabIndex={0}
        aria-label="근처 건강 맛집 목록"
      >
        {children}
      </div>
      <button
        className="carousel-arrow carousel-prev"
        aria-label="이전 맛집 보기"
        disabled={edges.start}
        onClick={() => scroll(-1)}
      >
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <button
        className="carousel-arrow carousel-next"
        aria-label="다음 맛집 보기"
        disabled={edges.end}
        onClick={() => scroll(1)}
      >
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>
    </div>
  );
}

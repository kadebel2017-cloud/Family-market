"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { pickLocalized, t, tf } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import type { HeroSlidePublic, PublicSettings } from "@/lib/public/queries";
import type { Locale } from "@/types";
import { storeName } from "../store-logo";

const AUTOPLAY_MS = 5000;
const MANUAL_PAUSE_MS = 15000;

function SlideMedia({
  slide,
  locale,
  name,
  isActive,
  isFirst,
  videoRef,
}: {
  slide: HeroSlidePublic;
  locale: Locale;
  name: string;
  isActive: boolean;
  isFirst: boolean;
  videoRef?: (el: HTMLVideoElement | null) => void;
}) {
  const alt = pickLocalized(locale, slide.altFr, slide.altAr) || slide.name || name;

  if (slide.type === "video") {
    return (
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover object-center"
        src={slide.url}
        muted
        loop
        playsInline
        preload={isActive ? "auto" : "none"}
        aria-label={alt}
        tabIndex={-1}
      />
    );
  }

  // Banner fill: the image covers the entire fixed hero box, centered.
  // Plain <img> is required — next/image needs fixed dimensions, which would
  // force a different ratio.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={slide.url}
      alt={isActive ? alt : ""}
      aria-hidden={!isActive}
      loading={isFirst ? "eager" : "lazy"}
      draggable={false}
      className="absolute inset-0 h-full w-full object-cover object-center"
    />
  );
}

export function Hero({
  settings,
  slides,
  locale,
}: {
  settings: PublicSettings | null;
  slides: HeroSlidePublic[];
  locale: Locale;
}) {
  const name = storeName(settings, locale);
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const manualUntilRef = useRef(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const isRtl = locale === "ar";

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // prefers-reduced-motion: disable automatic transitions.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(query.matches);
    update();
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }
    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

  // Clamped during render (no setState-in-effect): stays valid when the
  // admin reorders, deactivates, or removes slides.
  const current = count === 0 ? 0 : Math.min(index, count - 1);

  // Single autoplay timer: advance every 5s; after a manual action the
  // next advance waits 15s. Clearing + rescheduling keeps exactly one timer.
  useEffect(() => {
    if (count < 2 || reduceMotion || hoverPaused) {
      return;
    }
    const delay =
      Date.now() < manualUntilRef.current ? manualUntilRef.current - Date.now() : AUTOPLAY_MS;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      manualUntilRef.current = 0;
      setIndex((prev) => (prev + 1) % count);
    }, Math.max(0, delay));
    return clearTimer;
  }, [current, count, reduceMotion, hoverPaused, clearTimer]);

  // Clear timers on unmount (no leaks, no stray advances).
  useEffect(() => clearTimer, [clearTimer]);

  // Only the active video plays; others stay paused.
  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      if (i === current && !reduceMotion) {
        video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    });
  }, [current, reduceMotion, count]);

  const goTo = useCallback(
    (target: number, manual: boolean) => {
      if (count === 0) return;
      const wrapped = ((target % count) + count) % count;
      clearTimer();
      if (manual) {
        // Pause autoplay for 15s; a new manual click resets the pause.
        manualUntilRef.current = Date.now() + MANUAL_PAUSE_MS;
      }
      setIndex(wrapped);
    },
    [count, clearTimer],
  );

  const goNext = useCallback(() => goTo(current + 1, true), [goTo, current]);
  const goPrev = useCallback(() => goTo(current - 1, true), [goTo, current]);

  const handleLeave = useCallback(() => setHoverPaused(false), []);
  const handleEnter = useCallback(() => {
    // Pause rotation while hovering; resume follows the same timing logic
    // via the autoplay effect (manual pause respected).
    clearTimer();
    setHoverPaused(true);
  }, [clearTimer]);

  if (count === 0) {
    return (
      <section
        className="relative flex min-h-[352px] items-center justify-center overflow-hidden bg-ink sm:min-h-[440px]"
        aria-label={name}
      >
        <div className="absolute inset-0 bg-black/10" aria-hidden />
      </section>
    );
  }

  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <section
      // Full-viewport-width banner with fixed responsive height: the box
      // never grows/shrinks when slides change.
      // Mobile 380px, tablet 700px, desktop 950px.
      className="relative h-[380px] w-full overflow-hidden bg-ink md:h-[700px] lg:h-[950px]"
      aria-roledescription="carousel"
      aria-label={`${name} — ${t(locale, "heroSlideshow")}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocusCapture={() => setHoverPaused(true)}
      onBlurCapture={() => setHoverPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          goPrev();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          goNext();
        }
      }}
    >
      {slides.map((slide, i) => {
        const isActive = i === current;
        return (
          <div
            key={slide.id}
            // Every slide fills the same fixed box, so switching images
            // never changes the section height.
            className={cn(
              "absolute inset-0",
              !reduceMotion && "transition-opacity duration-500",
              isActive ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0",
            )}
            aria-hidden={!isActive}
          >
            <SlideMedia
              slide={slide}
              locale={locale}
              name={name}
              isActive={isActive}
              isFirst={i === 0}
              videoRef={(el) => {
                videoRefs.current[i] = el;
              }}
            />
          </div>
        );
      })}

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label={t(locale, "heroPrevious")}
            className="absolute start-3 top-1/2 z-30 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 sm:start-5"
          >
            <PrevIcon className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label={t(locale, "heroNext")}
            className="absolute end-3 top-1/2 z-30 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 sm:end-5"
          >
            <NextIcon className="h-5 w-5" aria-hidden />
          </button>

          <div
            className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rtl:translate-x-1/2"
            role="tablist"
            aria-label={t(locale, "heroSlideshow")}
          >
            {slides.map((slide, i) => {
              const isActive = i === current;
              return (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={tf(locale, "heroGoTo", String(i + 1))}
                  onClick={() => goTo(i, true)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "h-2.5 w-2.5 rounded-full transition-colors",
                      isActive ? "bg-gold-500" : "bg-white/60 hover:bg-white/90",
                    )}
                  />
                </button>
              );
            })}
          </div>

          <p className="sr-only" aria-live="polite">
            {current + 1} / {count}
          </p>
        </>
      ) : null}
    </section>
  );
}

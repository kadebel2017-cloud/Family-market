"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { pickLocalized, t, tf } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import type { PromotionSlidePublic } from "@/lib/promotion-media/constants";
import type { Locale } from "@/types";

const AUTOPLAY_MS = 5000;
const MANUAL_PAUSE_MS = 15000;

function SlideMedia({
  slide,
  locale,
  title,
  isActive,
  isFirst,
  videoRef,
}: {
  slide: PromotionSlidePublic;
  locale: Locale;
  title: string;
  isActive: boolean;
  isFirst: boolean;
  videoRef?: (el: HTMLVideoElement | null) => void;
}) {
  const alt = pickLocalized(locale, slide.altFr, slide.altAr) || slide.name || title;

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

export function PromotionMediaSlider({
  slides,
  locale,
  title,
}: {
  slides: PromotionSlidePublic[];
  locale: Locale;
  title: string;
}) {
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

  const current = count === 0 ? 0 : Math.min(index, count - 1);

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

  useEffect(() => clearTimer, [clearTimer]);

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
    clearTimer();
    setHoverPaused(true);
  }, [clearTimer]);

  // Single media: display normally (no slideshow chrome)
  if (count === 1) {
    const slide = slides[0];
    const alt = pickLocalized(locale, slide.altFr, slide.altAr) || slide.name || title;
    if (slide.type === "video") {
      return (
        <div className="overflow-hidden bg-black/5">
          <video
            src={slide.url}
            muted
            loop
            autoPlay
            playsInline
            preload="auto"
            aria-label={alt}
            className="block h-auto w-full"
          />
        </div>
      );
    }
    return (
      <div className="overflow-hidden bg-black/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slide.url} alt={alt} draggable={false} className="block h-auto w-full" />
      </div>
    );
  }

  // Multiple: slideshow — same behavior as Hero
  if (count === 0) {
    return null;
  }

  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div
      className="relative h-[260px] w-full overflow-hidden bg-black/5 sm:h-[360px] lg:h-[460px]"
      aria-roledescription="carousel"
      aria-label={`${title} — ${t(locale, "heroSlideshow")}`}
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
              title={title}
              isActive={isActive}
              isFirst={i === 0}
              videoRef={(el) => {
                videoRefs.current[i] = el;
              }}
            />
          </div>
        );
      })}

      <button
        type="button"
        onClick={goPrev}
        aria-label={t(locale, "heroPrevious")}
        className="absolute start-3 top-1/2 z-30 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 sm:start-4 sm:h-11 sm:w-11"
      >
        <PrevIcon className="h-5 w-5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={goNext}
        aria-label={t(locale, "heroNext")}
        className="absolute end-3 top-1/2 z-30 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 sm:end-4 sm:h-11 sm:w-11"
      >
        <NextIcon className="h-5 w-5" aria-hidden />
      </button>

      <div
        className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rtl:translate-x-1/2 sm:bottom-4"
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
    </div>
  );
}

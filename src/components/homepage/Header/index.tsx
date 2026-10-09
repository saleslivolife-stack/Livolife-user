"use client";

import { useState, useEffect, useCallback } from "react";

type BannerSlide = {
  _id: string;
  desktopImage: string;
  mobileImage: string;
  isActive: boolean;
  align: "left" | "center" | "right";
  tag: string;
  headline: string;
  subheadline: string;
  cta?: string;
  ctaSecondary?: string;
};

// Fallback banners in case API is not available
const fallbackSlides: BannerSlide[] = [
  {
    _id: "1",
    desktopImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=90",
    mobileImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=90",
    tag: "B2B Wholesale",
    headline: "Surgicals\nWholesale",
    subheadline: "Trusted surgical supplies for hospitals, clinics and distributors.",
    cta: "Shop Products",
    ctaSecondary: "Explore Categories",
    align: "left",
    isActive: true,
  },
  {
    _id: "2",
    desktopImage: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1600&q=90",
    mobileImage: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=90",
    tag: "Bulk Orders",
    headline: "Surgical\nEssentials",
    subheadline: "Gloves, masks, dressings and instruments — stocked in bulk.",
    cta: "View All",
    ctaSecondary: "Request a Quote",
    align: "center",
    isActive: true,
  },
  {
    _id: "3",
    desktopImage: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1600&q=90",
    mobileImage: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&q=90",
    tag: "Wholesale Pricing",
    headline: "Better Prices\nin Bulk",
    subheadline: "Competitive B2B rates for healthcare businesses.",
    cta: "View Offers",
    align: "right",
    isActive: true,
  },
];

// Module-level banner cache — fetched once per session
let bannerCache: BannerSlide[] | null = null;

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [paused, setPaused] = useState(false);
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const api = process.env.NEXT_PUBLIC_API_URL

  const goTo = useCallback(
    (index: number, dir: "next" | "prev" = "next") => {
      if (animating || index === current) return;
      setDirection(dir);
      setPrev(current);
      setAnimating(true);
      setCurrent(index);
      setTimeout(() => {
        setPrev(null);
        setAnimating(false);
      }, 700);
    },
    [animating, current]
  );
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;

  useEffect(() => {
    if (!api) {
      setSlides(fallbackSlides);
      return;
    }

    // Use cached banners if already fetched this session
    if (bannerCache) {
      setSlides(bannerCache);
      return;
    }

    const fetchBanners = async () => {
      try {
        const res = await fetch(`${api}/banner`);
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) {
          throw new Error("Invalid response");
        }
        const data = await res.json();

        if (data.banners && Array.isArray(data.banners)) {
          const activeBanners = data.banners.filter((b: BannerSlide) => b.isActive);
          if (activeBanners.length > 0) {
            bannerCache = activeBanners;
            setSlides(activeBanners);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to fetch banners, using fallback:", err);
      }
      bannerCache = fallbackSlides;
      setSlides(fallbackSlides);
    };

    fetchBanners();
  }, []);

  const next = useCallback(() => {
    if (slides.length > 0) {
      goTo((current + 1) % slides.length, "next");
    }
  }, [current, goTo, slides.length]);

  const back = useCallback(() => {
    if (slides.length > 0) {
      goTo((current - 1 + slides.length) % slides.length, "prev");
    }
  }, [current, goTo, slides.length]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next, paused]);

  // Fallback will ensure slides is never empty
  if (!slides || slides.length === 0) {
    return null;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .banner-root {
          font-family: 'DM Sans', sans-serif;
          position: relative;
          width: 100%;
          height: 92vh;
          min-height: 560px;
          max-height: 900px;
          background: #0C1626;
          overflow: hidden;
          cursor: default;
        }

        /* ── slide images ── */
        .slide-img {
          position: absolute;
          inset: 0;
          /* contain, not cover: show the whole banner art instead of cropping it */
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          transition: opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1),
                      transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .slide-img.active {
          opacity: 1;
          transform: scale(1);
          z-index: 2;
        }
        .slide-img.exiting {
          opacity: 0;
          transform: scale(1);
          z-index: 1;
        }
        .slide-img.idle {
          opacity: 0;
          z-index: 0;
        }

        /* ── overlay ── */
        .slide-overlay {
          background: linear-gradient(
            105deg,
            rgba(12,22,38,0.65) 0%,
            rgba(12,22,38,0.45) 50%,
            rgba(12,22,38,0.2) 100%
          );
        }
        .slide-overlay.center {
          background: linear-gradient(
            180deg,
            rgba(12,22,38,0.3) 0%,
            rgba(12,22,38,0.5) 38%,
            rgba(12,22,38,0.3) 100%
          );
        }
        .slide-overlay.right {
          background: linear-gradient(
            255deg,
            rgba(12,22,38,0.65) 0%,
            rgba(12,22,38,0.45) 50%,
            rgba(12,22,38,0.2) 100%
          );
        }

        /* ── content ── */
        .banner-content {
          position: absolute;
          inset: 0;
          z-index: 4;
          display: flex;
          align-items: center;
          padding: 0 7vw;
        }
        .banner-content.center { justify-content: center; text-align: center; }
        .banner-content.right  { justify-content: flex-end; }

        .text-block {
          max-width: 560px;
        }
        .banner-content.center .text-block { max-width: 620px; }

        /* tag */
        .slide-tag {
          display: inline-block;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #E8EFF8;
          border: 1px solid #E8EFF8;
          padding: 5px 14px;
          margin-bottom: 22px;
          opacity: 0;
          transform: translateY(16px);
          animation: fadeUp 0.55s 0.1s forwards;
        }

        /* headline */
        .slide-headline {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(3rem, 6.5vw, 6.2rem);
          font-weight: 300;
          line-height: 1.05;
          letter-spacing: -0.01em;
          color: #E8EFF8;
          white-space: pre-line;
          margin: 0 0 20px;
          opacity: 0;
          transform: translateY(24px);
          animation: fadeUp 0.6s 0.22s forwards;
        }

        /* sub */
        .slide-sub {
          font-size: 0.95rem;
          font-weight: 300;
          line-height: 1.65;
          color: #AFC0D8;
          max-width: 400px;
          margin-bottom: 36px;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeUp 0.6s 0.36s forwards;
        }
        .banner-content.center .slide-sub { margin-inline: auto; }

        /* buttons */
        .btn-row {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          opacity: 0;
          transform: translateY(16px);
          animation: fadeUp 0.55s 0.5s forwards;
        }
        .banner-content.center .btn-row { justify-content: center; }

        .btn-primary {
          background: #E8EFF8;
          color: #0C1626;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 14px 34px;
          border: none;
          cursor: pointer;
          transition: background 0.25s, transform 0.2s;
        }
        .btn-primary:hover { background: #FFFFFF; transform: translateY(-2px); }

        .btn-ghost {
          background: transparent;
          color: #E8EFF8;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 14px 34px;
          border: 1px solid #E8EFF8;
          cursor: pointer;
          transition: background 0.25s, color 0.25s, transform 0.2s;
        }
        .btn-ghost:hover { background: #E8EFF8; color: #0C1626; transform: translateY(-2px); }

        /* ── progress bar ── */
        .progress-bar {
          display: none;
        }
        @keyframes progress {
          from { width: 0; }
          to   { width: 100%; }
        }

        /* ── nav arrows ── */
        .arrow-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 8;
          background: rgba(20,20,20,0.8);
          border: 1px solid #2A3C5F;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
          backdrop-filter: blur(6px);
        }
        .arrow-btn:hover {
          background: #E8EFF8;
          border-color: #E8EFF8;
          transform: translateY(-50%) scale(1.08);
        }
        .arrow-btn:hover svg { stroke: #0C1626; }
        .arrow-btn svg { stroke: #E8EFF8; transition: stroke 0.2s; }
        .arrow-left  { left: 28px; }
        .arrow-right { right: 28px; }

        /* ── dot indicators ── */
        .dots {
          position: absolute;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 8;
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          border: 1px solid #E8EFF8;
          background: transparent;
          cursor: pointer;
          padding: 0;
          transition: background 0.25s, transform 0.2s;
        }
        .dot.active {
          background: #E8EFF8;
          transform: scale(1.3);
        }

        /* ── slide counter ── */
        .slide-counter {
          position: absolute;
          bottom: 32px;
          right: 40px;
          z-index: 8;
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          color: #7E93B4;
        }
        .slide-counter span { color: #E8EFF8; font-weight: 500; }

        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 640px) {
          /* 92vh/560px is desktop-sized and swallows a phone screen. The slide
             art is wider than it is tall, so a shorter box also crops less
             horizontally. Keep in sync with src/styles/banner.css. */
          .banner-root {
            height: 26vh;
            min-height: 190px;
            max-height: 240px;
          }
          /* shorter box: scale text down and drop the subtext so the slide copy isn't clipped */
          .slide-tag { margin-bottom: 6px; padding: 2px 8px; font-size: 0.55rem; }
          .slide-headline { font-size: clamp(1.35rem, 6vw, 1.75rem); margin-bottom: 10px; }
          .slide-sub { display: none; }
          .dots { bottom: 8px; }
          .arrow-btn { display: none; }
          .banner-content { padding: 0 5vw; }
          .banner-content.right { justify-content: flex-start; }
          .slide-overlay.right {
            background: linear-gradient(180deg,rgba(12,22,38,0.2) 0%,rgba(12,22,38,0.6) 55%,rgba(12,22,38,0.2) 100%);
          }
        }
      `}</style>

      <section
        className="banner-root"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        aria-label="Hero banner"
      >
        {/* slide images */}
        {slides.map((s, i) => {
          let cls = "slide-img idle";
          if (i === current) cls = "slide-img active";
          else if (i === prev) cls = "slide-img exiting";
          return (
            <div
              key={s._id}
              className={cls}
              // style={{ backgroundImage: `url(${s.image})` }}
//               style={{
//   // backgroundImage: `url(${s.desktopImage})`
  

//   backgroundImage: `url(${isMobile ? s.mobileImage : s.desktopImage})`

// }}
style={{
  backgroundImage: `url(${
    isMobile ? s.mobileImage : s.desktopImage
  })`,
}}
              aria-hidden={i !== current}
            />
          );
        })}

        {/* No dimming overlay — the slide art carries its own text, so the
           gradient only washed the image out. Re-add <div className={`slide-overlay
           ${slides[current].align}`} /> here if a slide ever needs the
           headline/subheadline below to stay legible over a busy image. */}

        {/* text content — re-mount on slide change to retrigger animations */}
        <div className={`banner-content ${slides[current].align}`} key={current}>
          <div className="text-block">
            {/* <span className="slide-tag">{slides[current].tag}</span> */}
            
            <h1 className="slide-headline">{slides[current].headline}</h1>
            <p className="slide-sub">{slides[current].subheadline}</p>
            <div className="btn-row">
              {/* <button className="btn-primary">{slide.cta}</button>
              {slide.ctaSecondary && (
                <button className="btn-ghost">{slide.ctaSecondary}</button>
              )} */}
            </div>
          </div>
        </div>

        {/* progress bar */}
        {!paused && <div className="progress-bar" key={`pb-${current}`} />}

        {/* arrows */}
        <button className="arrow-btn arrow-left" onClick={back} aria-label="Previous slide">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button className="arrow-btn arrow-right" onClick={next} aria-label="Next slide">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* dots */}
        <div className="dots" role="tablist" aria-label="Slide navigation">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`dot${i === current ? " active" : ""}`}
              onClick={() => goTo(i, i > current ? "next" : "prev")}
              role="tab"
              aria-selected={i === current}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* counter */}
        <div className="slide-counter">
          <span>{String(current + 1).padStart(2, "0")}</span> /{" "}
          {String(slides.length).padStart(2, "0")}
        </div>
      </section>
    </>
  );
}
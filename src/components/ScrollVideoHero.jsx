import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { brand } from "../data/brand";
import "./scroll-video-hero.css";

const clamp = (number, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, number));

function motionIsAllowed() {
  return (
    typeof window !== "undefined" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !navigator.connection?.saveData &&
    !["slow-2g", "2g"].includes(navigator.connection?.effectiveType)
  );
}

/** A native sticky scene: scrolling remains entirely under the browser's control. */
export default function ScrollVideoHero({ product, onOpenProduct, Icon }) {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const previousLayout = useRef(null);
  const [motionAllowed, setMotionAllowed] = useState(motionIsAllowed);
  const [staticRequested, setStaticRequested] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const enabled = motionAllowed && !staticRequested && !failed;
  const media = brand.heroVideo;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionAllowed(motionIsAllowed());
    if (preference.addEventListener)
      preference.addEventListener("change", update);
    else preference.addListener(update);
    navigator.connection?.addEventListener?.("change", update);
    return () => {
      if (preference.removeEventListener)
        preference.removeEventListener("change", update);
      else preference.removeListener(update);
      navigator.connection?.removeEventListener?.("change", update);
    };
  }, []);

  // Measure the actual header and viewport. svh keeps mobile browser bars from
  // changing the scroll range; ResizeObserver also handles rotation and zoom.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const header = document.querySelector(".site-header");
    const announcement = document.querySelector(".announcement");
    const measure = () => {
      const navigationHeight = header?.getBoundingClientRect().height || 0;
      section.style.setProperty("--hero-nav-height", `${navigationHeight}px`);
      section.style.setProperty(
        "--hero-entry-gap",
        `${announcement?.getBoundingClientRect().height || 0}px`,
      );
      previousLayout.current = {
        start:
          section.getBoundingClientRect().top +
          window.scrollY -
          navigationHeight,
        end:
          section.getBoundingClientRect().top +
          window.scrollY +
          section.offsetHeight -
          section.querySelector(".scroll-hero__scene").offsetHeight -
          navigationHeight,
      };
    };
    measure();
    const observer = window.ResizeObserver ? new ResizeObserver(measure) : null;
    if (header) observer?.observe(header);
    if (announcement) observer?.observe(announcement);
    observer?.observe(section);
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // If the visitor requests a static version while pinned, keep that scene in
  // view when its extra scroll space is removed, instead of landing mid-menu.
  useLayoutEffect(() => {
    if (!enabled && previousLayout.current) {
      const { start, end } = previousLayout.current;
      if (window.scrollY > start && window.scrollY < end) {
        window.scrollTo({ top: Math.max(0, start), behavior: "instant" });
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const section = sectionRef.current;
    const video = videoRef.current;
    if (
      !video.canPlayType("video/mp4") ||
      !CSS.supports("position", "sticky") ||
      !window.IntersectionObserver
    ) {
      setFailed(true);
      return;
    }

    let disposed = false;
    let active = false;
    let started = false;
    let duration = 0;
    let targetTime = 0;
    let frame = 0;
    let frameCallback = 0;
    let loadTimer;
    let revealTimer;
    let seekTimer;
    let seekStarted = 0;
    let slowSeeks = 0;
    const fail = () => {
      if (!disposed) {
        setReady(false);
        setFailed(true);
      }
    };
    const updateTime = () => {
      frame = 0;
      if (disposed || !active || document.hidden) return;
      const bounds = section.getBoundingClientRect();
      const scene = section.querySelector(".scroll-hero__scene");
      const top =
        Number.parseFloat(
          getComputedStyle(section).getPropertyValue("--hero-nav-height"),
        ) || 0;
      const distance = section.offsetHeight - scene.offsetHeight;
      const progress =
        distance > 0 ? clamp((top - bounds.top) / distance, 0, 1) : 0;
      section.style.setProperty("--hero-progress", progress.toFixed(4));
      targetTime = progress * duration;
      // Never queue seeks. While a frame decodes, only the latest scroll target
      // is retained. This also makes reversing direction immediate.
      if (
        duration &&
        video.readyState >= 2 &&
        !video.seeking &&
        Math.abs(video.currentTime - targetTime) >= 1 / (media.frameRate * 2)
      ) {
        try {
          seekStarted = performance.now();
          video.currentTime = targetTime;
          clearTimeout(seekTimer);
          seekTimer = setTimeout(() => {
            if (active && video.seeking) fail();
          }, 2000);
        } catch {
          fail();
        }
      }
    };
    const schedule = () => {
      if (!frame && active && !disposed)
        frame = requestAnimationFrame(updateTime);
    };
    const metadata = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        fail();
        return;
      }
      duration = Math.max(0, video.duration - 1 / media.frameRate);
      schedule();
    };
    const reveal = () => {
      if (!disposed && video.readyState >= 2 && video.videoWidth > 0) {
        clearTimeout(loadTimer);
        setReady(true);
        schedule();
      }
    };
    const loaded = () => {
      metadata();
      if (video.requestVideoFrameCallback)
        frameCallback = video.requestVideoFrameCallback(reveal);
      // Older engines may not send a new compositor callback for a paused first
      // frame. loadeddata guarantees that this frame has already been decoded.
      revealTimer = setTimeout(reveal, 150);
    };
    const seeked = () => {
      clearTimeout(seekTimer);
      slowSeeks = performance.now() - seekStarted > 700 ? slowSeeks + 1 : 0;
      if (slowSeeks >= 3) {
        fail();
        return;
      }
      schedule();
    };
    const start = () => {
      if (started) return;
      started = true;
      video.preload = "auto";
      video.src = window.matchMedia("(max-width: 600px)").matches
        ? media.mobileSrc
        : media.desktopSrc;
      video.load();
      loadTimer = setTimeout(fail, 12000);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        active = entry.isIntersecting;
        if (active) {
          start();
          schedule();
        }
      },
      { rootMargin: "100px 0px" },
    );

    video.addEventListener("loadedmetadata", metadata);
    video.addEventListener("loadeddata", loaded);
    video.addEventListener("seeked", seeked);
    video.addEventListener("error", fail);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    document.addEventListener("visibilitychange", schedule);
    observer.observe(section);

    return () => {
      disposed = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(loadTimer);
      clearTimeout(revealTimer);
      clearTimeout(seekTimer);
      if (frameCallback && video.cancelVideoFrameCallback)
        video.cancelVideoFrameCallback(frameCallback);
      video.removeEventListener("loadedmetadata", metadata);
      video.removeEventListener("loadeddata", loaded);
      video.removeEventListener("seeked", seeked);
      video.removeEventListener("error", fail);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
      video.pause();
      video.removeAttribute("src");
      video.load();
      setReady(false);
    };
  }, [enabled, media]);

  return (
    <section
      id="accueil"
      className="scroll-hero"
      ref={sectionRef}
      data-mode={enabled ? "scroll" : "static"}
      data-video-state={enabled ? (ready ? "ready" : "loading") : "fallback"}
      aria-labelledby="hero-title"
    >
      <div className="scroll-hero__scene">
        <div className="scroll-hero__copy">
          <span className="eyebrow">
            <span className="tiny-sun" aria-hidden="true">
              ✳
            </span>{" "}
            À CHAQUE ENVIE, SA PAUSE.
          </span>
          <h1 id="hero-title">
            <span>Un peu de douceur.</span>
            <em>Beaucoup de nous.</em>
          </h1>
          <p>
            Matcha, café, mojito ou frappuccino.
            <br />
            Votre prochaine envie commence ici.
          </p>
          <a className="button button-dark scroll-hero__cta" href="#carte">
            Explorer la carte <Icon name="diagonal" size={18} />
          </a>
          <div className="scroll-hero__hint" aria-hidden="true">
            <span className="scroll-hero__progress">
              <span />
            </span>
            <span>
              {enabled
                ? "DÉFILER POUR DÉCOUVRIR"
                : "QUATRE UNIVERS. VOTRE MOMENT."}
            </span>
            {enabled && <Icon name="arrow" size={14} />}
          </div>
        </div>

        <div className="scroll-hero__media">
          <img
            className="scroll-hero__poster"
            src={enabled ? media.poster : media.fallbackImage}
            alt="Mise en scène d’un Iced Matcha Latte 2FIVE3, avec des volutes de lait et de matcha."
            fetchPriority="high"
            width="768"
            height="960"
          />
          <video
            className="scroll-hero__video"
            ref={videoRef}
            poster={media.poster}
            muted
            playsInline
            preload="none"
            disablePictureInPicture
            disableRemotePlayback
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>

        <div className="scroll-hero__bottom">
          <button
            className="scroll-hero__product"
            onClick={() => onOpenProduct(product)}
          >
            <span className="scroll-hero__product-dot" />
            <span>
              <small>LE MATCHA MOOD</small>
              <strong>{product.name}</strong>
            </span>
            <span className="scroll-hero__price">
              {product.price.toLocaleString("fr-FR")} <small>FDJ</small>
            </span>
            <span className="scroll-hero__product-arrow">
              <Icon name="diagonal" size={19} />
            </span>
          </button>
          <div className="scroll-hero__meta">
            <span>2FIVE3 COFFEE & MART</span>
            {motionAllowed && !failed && (
              <button
                className="scroll-hero__motion-toggle"
                onClick={() => setStaticRequested(!staticRequested)}
              >
                {staticRequested
                  ? "Activer l’animation"
                  : "Version sans animation"}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

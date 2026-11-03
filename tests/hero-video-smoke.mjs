// Optional Chromium checks for the scroll-linked hero. Install Playwright
// separately or set PLAYWRIGHT_MODULE to an existing Playwright module path.
import assert from "node:assert/strict";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const heroSelector = "#accueil.scroll-hero";
const videoSelector = ".scroll-hero__video";

async function makePage(options = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    ...options,
  });
  const page = await context.newPage();
  const errors = [];
  const mediaRequests = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (/\.mp4(?:\?|$)/.test(request.url())) mediaRequests.push(request.url());
  });
  return { context, page, errors, mediaRequests };
}

async function openReady(page) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForFunction(
    (selector) =>
      document.querySelector(selector)?.dataset.videoState === "ready",
    heroSelector,
    { timeout: 15000 },
  );
  assert.equal(
    await page.locator(heroSelector).getAttribute("data-mode"),
    "scroll",
  );
  await page.locator(videoSelector).evaluate((video) => {
    window.__heroDecodedFrames = [];
    const receive = (_, metadata) => {
      window.__heroDecodedFrames.push(metadata.mediaTime);
      video.requestVideoFrameCallback(receive);
    };
    video.requestVideoFrameCallback(receive);
  });
}

async function scrollProgress(page, progress) {
  const target = await page
    .locator(heroSelector)
    .evaluate((section, fraction) => {
      const scene = section.querySelector(".scroll-hero__scene");
      const navigation = Number.parseFloat(
        getComputedStyle(section).getPropertyValue("--hero-nav-height"),
      );
      const start = section.getBoundingClientRect().top + scrollY - navigation;
      const distance = section.offsetHeight - scene.offsetHeight;
      const video = section.querySelector("video");
      const duration = video.duration - 1 / 24;
      window.scrollTo({
        top: start + distance * fraction,
        behavior: "instant",
      });
      return { time: fraction * duration, duration, distance };
    }, progress);
  await page.waitForFunction(
    ({ time, selector }) => {
      const video = document.querySelector(selector);
      const frames = window.__heroDecodedFrames;
      return (
        video.readyState >= 2 &&
        !video.seeking &&
        Math.abs(video.currentTime - time) < 0.12 &&
        frames?.length > 0 &&
        Math.abs(frames.at(-1) - time) < 0.15
      );
    },
    { time: target.time, selector: videoSelector },
    { timeout: 10000 },
  );
  const metrics = await page.locator(heroSelector).evaluate((section) => {
    const scene = section
      .querySelector(".scroll-hero__scene")
      .getBoundingClientRect();
    return {
      sceneTop: scene.top,
      sceneBottom: scene.bottom,
      navigation: Number.parseFloat(
        getComputedStyle(section).getPropertyValue("--hero-nav-height"),
      ),
      viewport: innerHeight,
      currentTime: section.querySelector("video").currentTime,
      decodedTime: window.__heroDecodedFrames.at(-1),
      progress: Number.parseFloat(
        getComputedStyle(section).getPropertyValue("--hero-progress"),
      ),
    };
  });
  assert.ok(
    Math.abs(metrics.sceneTop - metrics.navigation) <= 2,
    `sticky scene stays below navigation: ${JSON.stringify(metrics)}`,
  );
  assert.ok(
    metrics.sceneBottom <= metrics.viewport + 2,
    "sticky scene fits viewport",
  );
  assert.ok(
    Math.abs(metrics.progress - progress) < 0.01,
    "scroll position maps to hero progress",
  );
  return { ...target, ...metrics };
}

async function assertForeground(page) {
  const visible = await page.locator(".scroll-hero__copy").evaluate((copy) => {
    const cta = copy.querySelector(".scroll-hero__cta");
    const heading = copy.querySelector("h1");
    const ctaBounds = cta.getBoundingClientRect();
    const headingBounds = heading.getBoundingClientRect();
    const hit = document.elementFromPoint(
      ctaBounds.x + ctaBounds.width / 2,
      ctaBounds.y + ctaBounds.height / 2,
    );
    return {
      cta: ctaBounds.top >= 0 && ctaBounds.bottom <= innerHeight,
      heading: headingBounds.top >= 0 && headingBounds.bottom <= innerHeight,
      hit: hit === cta || cta.contains(hit),
      opacity: getComputedStyle(copy).opacity,
    };
  });
  assert.deepEqual(
    visible,
    { cta: true, heading: true, hit: true, opacity: "1" },
    "copy and CTA remain visible and receive pointer input",
  );
  await page.locator(".scroll-hero__cta").click({ trial: true });
}

async function assertNoOverflow(page, width) {
  const metrics = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert.ok(
    metrics.scrollWidth <= metrics.width,
    `${width}px: horizontal overflow ${JSON.stringify(metrics)}`,
  );
}

async function assertStatic(page) {
  await page.waitForFunction(
    (selector) => document.querySelector(selector)?.dataset.mode === "static",
    heroSelector,
  );
  await page.waitForFunction((selector) => {
    const section = document.querySelector(selector);
    const video = section.querySelector("video");
    const poster = section.querySelector(".scroll-hero__poster");
    return (
      !video.getAttribute("src") &&
      video.readyState === 0 &&
      video.networkState === 0 &&
      poster.complete &&
      poster.naturalWidth > 0
    );
  }, heroSelector);
  const result = await page.locator(heroSelector).evaluate((section) => {
    const video = section.querySelector("video");
    const poster = section.querySelector(".scroll-hero__poster");
    return {
      state: section.dataset.videoState,
      height: section.offsetHeight,
      sceneHeight: section.querySelector(".scroll-hero__scene").offsetHeight,
      src: video.getAttribute("src"),
      currentSrc: video.currentSrc,
      readyState: video.readyState,
      networkState: video.networkState,
      posterLoaded: poster.complete && poster.naturalWidth > 0,
      posterAlt: poster.alt,
    };
  });
  assert.equal(result.state, "fallback");
  assert.ok(
    Math.abs(result.height - result.sceneHeight) <= 1,
    "static hero has no extra scroll runway",
  );
  assert.equal(result.src, null, "disabled video has no src");
  // Chromium can retain currentSrc after removeAttribute('src') + load().
  // HAVE_NOTHING and NETWORK_EMPTY establish that media was actually reset.
  assert.equal(result.readyState, 0, "disabled video has no decoded media");
  assert.equal(
    result.networkState,
    0,
    "disabled video has no active media resource",
  );
  assert.ok(result.posterLoaded, "static fallback image loads");
  assert.ok(
    result.posterAlt.length > 20,
    "fallback image has useful accessible alt text",
  );
  await assertForeground(page);
}

try {
  const desktop = await makePage();
  try {
    await openReady(desktop.page);
    const early = await scrollProgress(desktop.page, 0.18);
    await assertForeground(desktop.page);
    const later = await scrollProgress(desktop.page, 0.69);
    assert.ok(
      later.decodedTime > early.decodedTime + 1,
      "scrolling forwards presents a later decoded frame",
    );
    const end = await scrollProgress(desktop.page, 0.98);
    assert.ok(
      end.currentTime / end.duration > 0.96,
      "near-end scroll reaches the end segment",
    );
    const back = await scrollProgress(desktop.page, 0.27);
    assert.ok(
      back.decodedTime < later.decodedTime - 1,
      "scrolling backwards presents an earlier decoded frame",
    );
    await assertForeground(desktop.page);
    await assertNoOverflow(desktop.page, 1440);
    console.log(
      `PASS desktop scrub: decoded ${early.decodedTime.toFixed(2)}s → ${later.decodedTime.toFixed(2)}s → ${end.decodedTime.toFixed(2)}s → ${back.decodedTime.toFixed(2)}s; scene pinned and CTA unobstructed`,
    );

    await desktop.page
      .getByRole("button", { name: "Version sans animation", exact: true })
      .click();
    await assertStatic(desktop.page);
    assert.ok(
      await desktop.page
        .locator(".scroll-hero__scene")
        .evaluate((scene) => scene.getBoundingClientRect().top >= 0),
      "manual opt-out retains the hero in view",
    );
    await desktop.page
      .getByRole("button", { name: "Activer l’animation", exact: true })
      .click();
    await desktop.page.waitForFunction(
      (selector) =>
        document.querySelector(selector).dataset.videoState === "ready",
      heroSelector,
    );
    console.log(
      "PASS manual motion toggle collapses and restores the animated hero",
    );

    await desktop.page.locator(".scroll-hero__cta").click();
    assert.equal(new URL(desktop.page.url()).hash, "#carte");
    await desktop.page.waitForFunction(() => {
      const section = document.querySelector("#carte").getBoundingClientRect();
      return section.top >= 0 && section.top < 160;
    });
    assert.deepEqual(desktop.errors, [], "desktop browser errors");
    console.log("PASS actual CTA click navigates to the catalogue");
  } finally {
    await desktop.context.close();
  }

  for (const width of [320, 390]) {
    const mobile = await makePage({
      viewport: { width, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    try {
      await openReady(mobile.page);
      const early = await scrollProgress(mobile.page, 0.21);
      const later = await scrollProgress(mobile.page, 0.79);
      const back = await scrollProgress(mobile.page, 0.35);
      assert.ok(
        later.decodedTime > early.decodedTime &&
          back.decodedTime < later.decodedTime,
      );
      await assertForeground(mobile.page);
      await assertNoOverflow(mobile.page, width);
      assert.ok(
        mobile.mediaRequests.every((url) => url.includes("hero-mobile.mp4")),
        "narrow viewport loads only the mobile video",
      );
      assert.deepEqual(mobile.errors, [], "mobile browser errors");
      console.log(
        `PASS ${width}px mobile: decoded forward/backward scrub, pinned scene, CTA, mobile source, no overflow`,
      );
    } finally {
      await mobile.context.close();
    }
  }

  const reduced = await makePage({ reducedMotion: "reduce" });
  try {
    await reduced.page.goto(baseUrl, { waitUntil: "networkidle" });
    await assertStatic(reduced.page);
    assert.equal(
      reduced.mediaRequests.length,
      0,
      "reduced motion performs no video requests",
    );
    assert.deepEqual(reduced.errors, [], "reduced-motion browser errors");
    console.log(
      "PASS reduced motion: accessible static image, no media source/download, no extended scroll range",
    );
  } finally {
    await reduced.context.close();
  }

  const failed = await makePage();
  try {
    await failed.page.route("**/*.mp4", (route) => route.abort("failed"));
    await failed.page.goto(baseUrl, { waitUntil: "networkidle" });
    await assertStatic(failed.page);
    assert.ok(
      failed.mediaRequests.length > 0,
      "failure test attempted the video request",
    );
    assert.deepEqual(
      failed.errors,
      [],
      "failed-media fallback has no JavaScript errors",
    );
    console.log(
      "PASS failed media: accessible static fallback, visible working CTA, no extended scroll range",
    );
  } finally {
    await failed.context.close();
  }
} finally {
  await browser.close();
}

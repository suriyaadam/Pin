// Optional browser validation. Install Playwright separately, or point
// PLAYWRIGHT_MODULE to an existing installation; no app dependency is needed.
// BASE_URL defaults to the Vite development server used during validation.
import assert from "node:assert/strict";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});

const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
const failedRequests = [];
const interactionFailures = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("requestfailed", (request) =>
  failedRequests.push(
    `${request.method()} ${request.url()} ${request.failure()?.errorText}`,
  ),
);
page.on("response", (response) => {
  if (response.status() >= 400)
    failedRequests.push(`${response.status()} ${response.url()}`);
});

const cards = page.locator(".product-card");
const countCards = async (count) => {
  await page.waitForFunction(
    (expected) =>
      document.querySelectorAll(".product-card").length === expected,
    count,
  );
  assert.equal(await cards.count(), count);
};
const categoryButton = (name) =>
  page
    .locator(".category-filters")
    .getByRole("button", { name: new RegExp(`^${name}`) });

try {
  await page.goto(process.env.BASE_URL || "http://127.0.0.1:3000", {
    waitUntil: "networkidle",
  });
  await countCards(8);
  await page.getByRole("button", { name: "Voir toute la carte" }).click();
  await countCards(27);
  console.log("PASS all: 8 initial cards expand to 27");

  for (const [category, count] of [
    ["Matcha", 6],
    ["Mojitos", 9],
    ["Coffee", 9],
    ["Frappuccino", 3],
  ]) {
    const button = categoryButton(category);
    await button.click();
    await countCards(count);
    assert.equal(await button.getAttribute("aria-pressed"), "true");
    assert.equal(
      await cards
        .locator(".product-category")
        .evaluateAll(
          (nodes) => new Set(nodes.map((node) => node.textContent)).size,
        ),
      1,
    );
    console.log(`PASS ${category}: ${count} cards`);
  }

  await categoryButton("Tout découvrir").click();
  await countCards(8);
  await page
    .getByRole("button", { name: "Rechercher dans la carte", exact: true })
    .click();
  const search = page.getByRole("searchbox", {
    name: "Rechercher une boisson",
  });
  await search.fill("cinnamon");
  await countCards(1);
  assert.equal(
    await cards.locator("h3").textContent(),
    "Cinnamon Brown Sugar Latte",
  );
  await search.fill("aucune-boisson-xyz");
  await countCards(0);
  await page.getByRole("heading", { name: "Une autre envie ?" }).waitFor();
  await page.getByRole("button", { name: "Afficher toute la carte" }).click();
  await countCards(27);
  assert.equal(await search.inputValue(), "");
  console.log("PASS search: exact result, empty state, reset");

  await page
    .getByRole("button", { name: "Affichage en liste", exact: true })
    .click();
  assert.equal(
    await page
      .locator(".product-grid")
      .evaluate((node) => node.classList.contains("list-view")),
    true,
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Affichage en liste", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  await page
    .getByRole("button", { name: "Affichage en grille", exact: true })
    .click();
  assert.equal(
    await page
      .locator(".product-grid")
      .evaluate((node) => node.classList.contains("list-view")),
    false,
  );
  console.log("PASS grid/list toggles");

  const openFirst = async () => {
    await cards.first().locator(".product-image-button").click();
    await page.getByRole("dialog").waitFor({ state: "visible" });
    assert.equal(
      await page.getByRole("dialog").getByRole("heading").textContent(),
      "Iced Matcha Latte",
    );
  };
  const assertFocusReturned = async () => {
    await page.getByRole("dialog").waitFor({ state: "detached" });
    const focusReturned = await cards
      .first()
      .locator(".product-image-button")
      .evaluate((node) => node === document.activeElement);
    if (!focusReturned)
      interactionFailures.push(
        `Modal focus not restored: ${await page.evaluate(() => document.activeElement.outerHTML.slice(0, 150))}`,
      );
  };
  await openFirst();
  await page.keyboard.press("Escape");
  await assertFocusReturned();
  await openFirst();
  await page
    .getByRole("button", { name: "Fermer la fiche", exact: true })
    .click();
  await assertFocusReturned();
  await openFirst();
  await page.mouse.click(5, 5);
  await assertFocusReturned();
  console.log(
    "PASS modal opens and closes via Escape, close button, backdrop; focus restoration checked",
  );

  // Request every lazy image now, including cards below the fold, so broken
  // catalogue assets cannot be hidden by the viewport.
  await page.locator("img").evaluateAll((images) =>
    images.forEach((image) => {
      image.loading = "eager";
    }),
  );
  await page.waitForFunction(() =>
    [...document.images].every((image) => image.complete),
  );
  assert.deepEqual(
    await page
      .locator("img")
      .evaluateAll((images) =>
        images
          .filter((image) => image.naturalWidth === 0)
          .map((image) => image.src),
      ),
    [],
  );
  console.log("PASS every rendered product and editorial image loads");

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(150);
    const widths = await page.evaluate(() => ({
      viewport: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    if (widths.scroll > widths.viewport) {
      const overflow = await page.evaluate(() =>
        [...document.querySelectorAll("body *")]
          .map((node) => ({
            tag: node.tagName,
            class: node.className,
            left: node.getBoundingClientRect().left,
            right: node.getBoundingClientRect().right,
          }))
          .filter((node) => node.right > innerWidth + 1 || node.left < -1)
          .slice(0, 14),
      );
      interactionFailures.push(
        `${width}px: page overflow ${widths.scroll - widths.viewport}px ${JSON.stringify(overflow)}`,
      );
    } else console.log(`PASS ${width}px viewport: no horizontal overflow`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  const menu = page.getByRole("button", {
    name: "Ouvrir le menu",
    exact: true,
  });
  await menu.click();
  const closeMenu = page.getByRole("button", {
    name: "Fermer le menu",
    exact: true,
  });
  assert.equal(await closeMenu.getAttribute("aria-expanded"), "true");
  await page
    .getByRole("navigation", { name: "Navigation principale" })
    .getByRole("link", { name: "L’esprit 2FIVE3", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("button", { name: "Ouvrir le menu", exact: true })
      .getAttribute("aria-expanded"),
    "false",
  );
  assert.equal(new URL(page.url()).hash, "#esprit");
  console.log("PASS mobile menu: opens, navigates, closes");

  const previousOverflow = await page
    .locator("body")
    .evaluate((node) => node.style.overflow);
  await openFirst();
  assert.equal(
    await page.locator("body").evaluate((node) => node.style.overflow),
    "hidden",
  );
  const dialogBounds = await page.getByRole("dialog").boundingBox();
  assert.ok(
    dialogBounds.x >= 0 && dialogBounds.x + dialogBounds.width <= 390,
    "mobile modal fits viewport",
  );
  await page.keyboard.press("Escape");
  await assertFocusReturned();
  assert.equal(
    await page.locator("body").evaluate((node) => node.style.overflow),
    previousOverflow,
  );
  console.log(
    "PASS mobile modal: fits viewport, locks and restores body scrolling, returns focus",
  );

  assert.deepEqual(errors, [], "browser errors");
  assert.deepEqual(failedRequests, [], "failed requests");
  assert.deepEqual(interactionFailures, [], "interaction failures");
  console.log("PASS no browser errors or failed network/image requests");
} finally {
  await browser.close();
}

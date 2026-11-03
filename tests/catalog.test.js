import test from "node:test";
import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import { categories, products } from "../src/data/catalog.js";

// Independent fixture transcribed from the supplied menu, rather than derived
// from catalog.js: names, category assignments and prices are the contract.
const expectedMenu = {
  mojitos: [
    ["Passion Fruit Mojito", 700],
    ["Blue Lagon Mojito", 700],
    ["Strawberry Mojito", 700],
    ["Blue Passion Fruit Mojito", 700],
    ["Mint Mojito", 700],
    ["Mango Mojito", 700],
    ["Blueberry Mojito", 700],
    ["Watermelon Mojito", 700],
    ["Mixed Mojito", 700],
  ],
  matcha: [
    ["Iced Matcha Latte", 800],
    ["Iced Strawberry Matcha", 900],
    ["Iced Mango Matcha", 900],
    ["Iced Matcha Oreo", 900],
    ["Matcha Caramel", 900],
    ["Cloud Matcha Milk Foam", 900],
  ],
  coffee: [
    ["Espresso", 400],
    ["Americano", 600],
    ["Cappuccino", 600],
    ["Latte", 600],
    ["Vanilla Latte", 700],
    ["Cinnamon Brown Sugar Latte", 900],
    ["Salted Spanish Latte", 900],
    ["Caramel Latte", 900],
    ["Mocha (White / Dark Chocolate)", 900],
  ],
  frappuccino: [
    ["Caramel Frappuccino", 900],
    ["Vanilla Frappuccino", 900],
    ["Strawberry Frappuccino", 900],
  ],
};

test("the catalogue includes precisely the four requested categories", () => {
  assert.deepEqual(
    categories.map(({ id }) => id).sort(),
    Object.keys(expectedMenu).sort(),
  );
  for (const category of categories) {
    assert.equal(category.label, category.id.toUpperCase());
    assert.equal(category.count, expectedMenu[category.id].length);
  }
});

for (const [category, expectedProducts] of Object.entries(expectedMenu)) {
  test(`${category}: every supplied name and FDJ price is preserved exactly`, () => {
    const actual = products
      .filter((product) => product.category === category)
      .map(({ name, price }) => [name, price]);
    assert.deepEqual(actual, expectedProducts);
  });
}

test("all 27 drinks have a unique usable identifier and a declared category", () => {
  assert.equal(products.length, 27);
  assert.equal(new Set(products.map(({ id }) => id)).size, 27);
  for (const product of products) {
    assert.match(product.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(Object.hasOwn(expectedMenu, product.category));
    assert.equal(Number.isInteger(product.price), true);
  }
});

test("every drink references a nonempty local image and labels provisional imagery", async () => {
  for (const product of products) {
    assert.match(product.image, /^\/images\/.+\.(?:webp|png|jpe?g|avif)$/i);
    const imageFile = new URL(`../public${product.image}`, import.meta.url);
    const imageStat = await stat(imageFile);
    assert.ok(imageStat.isFile(), `${product.name}: image is a file`);
    assert.ok(imageStat.size > 0, `${product.name}: image is not empty`);
    assert.equal(typeof product.imageIsIllustrative, "boolean");
    assert.ok(product.imageAlt.trim().length > 0);
    if (product.imageIsIllustrative) {
      assert.match(product.imageAlt, /illustratif/);
      assert.ok(product.imageAlt.includes(product.name));
    }
  }
});

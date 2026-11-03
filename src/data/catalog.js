/**
 * La carte de 2FIVE3 Coffee & Mart.
 * Les prix sont exprimés en francs djiboutiens (FDJ).
 * Pour remplacer un visuel, renseigner son chemin dans `image`, mettre à jour
 * `imageAlt` et passer `imageIsIllustrative` à false pour une photo officielle.
 */
export const categories = [
  { id: "matcha", label: "MATCHA", count: 6 },
  { id: "mojitos", label: "MOJITOS", count: 9 },
  { id: "coffee", label: "COFFEE", count: 9 },
  { id: "frappuccino", label: "FRAPPUCCINO", count: 3 },
];

const product = (id, category, name, price, overrides = {}) => ({
  id,
  category,
  name,
  price,
  image: `/images/${category}.webp`,
  imageAlt: `Visuel illustratif de la catégorie ${category}, non contractuel pour ${name}`,
  imageIsIllustrative: true,
  ...overrides,
});

export const products = [
  product("iced-matcha-latte", "matcha", "Iced Matcha Latte", 800),
  product("iced-strawberry-matcha", "matcha", "Iced Strawberry Matcha", 900, {
    image: "/images/iced-strawberry-matcha.webp",
    imageAlt: "Visuel illustratif non officiel pour Iced Strawberry Matcha",
  }),
  product("iced-mango-matcha", "matcha", "Iced Mango Matcha", 900),
  product("iced-matcha-oreo", "matcha", "Iced Matcha Oreo", 900),
  product("matcha-caramel", "matcha", "Matcha Caramel", 900),
  product("cloud-matcha-milk-foam", "matcha", "Cloud Matcha Milk Foam", 900),
  product("passion-fruit-mojito", "mojitos", "Passion Fruit Mojito", 700),
  product("blue-lagon-mojito", "mojitos", "Blue Lagon Mojito", 700, {
    image: "/images/blue-lagon-mojito.webp",
    imageAlt: "Visuel illustratif non officiel pour Blue Lagon Mojito",
  }),
  product("strawberry-mojito", "mojitos", "Strawberry Mojito", 700),
  product(
    "blue-passion-fruit-mojito",
    "mojitos",
    "Blue Passion Fruit Mojito",
    700,
  ),
  product("mint-mojito", "mojitos", "Mint Mojito", 700),
  product("mango-mojito", "mojitos", "Mango Mojito", 700),
  product("blueberry-mojito", "mojitos", "Blueberry Mojito", 700),
  product("watermelon-mojito", "mojitos", "Watermelon Mojito", 700),
  product("mixed-mojito", "mojitos", "Mixed Mojito", 700),
  product("espresso", "coffee", "Espresso", 400, {
    image: "/images/espresso.webp",
    imageAlt: "Visuel illustratif non officiel pour Espresso",
  }),
  product("americano", "coffee", "Americano", 600, {
    image: "/images/americano.webp",
    imageAlt: "Visuel illustratif non officiel pour Americano",
  }),
  product("cappuccino", "coffee", "Cappuccino", 600),
  product("latte", "coffee", "Latte", 600),
  product("vanilla-latte", "coffee", "Vanilla Latte", 700),
  product(
    "cinnamon-brown-sugar-latte",
    "coffee",
    "Cinnamon Brown Sugar Latte",
    900,
  ),
  product("salted-spanish-latte", "coffee", "Salted Spanish Latte", 900),
  product("caramel-latte", "coffee", "Caramel Latte", 900),
  product(
    "mocha-white-dark-chocolate",
    "coffee",
    "Mocha (White / Dark Chocolate)",
    900,
  ),
  product("caramel-frappuccino", "frappuccino", "Caramel Frappuccino", 900),
  product("vanilla-frappuccino", "frappuccino", "Vanilla Frappuccino", 900, {
    image: "/images/vanilla-frappuccino.webp",
    imageAlt: "Visuel illustratif non officiel pour Vanilla Frappuccino",
  }),
  product(
    "strawberry-frappuccino",
    "frappuccino",
    "Strawberry Frappuccino",
    900,
  ),
];

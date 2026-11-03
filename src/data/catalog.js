/**
 * La carte de 2FIVE3 Coffee & Mart.
 * Les prix sont exprimés en francs djiboutiens (FDJ).
 * Pour remplacer une photographie, renseigner son chemin dans `image` et
 * mettre à jour sa description visuelle dans `imageAlt`.
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
  image: `/images/${id}.webp`,
  imageAlt: `${name} dans un gobelet transparent 2FIVE3.`,
  ...overrides,
});

export const products = [
  product("iced-matcha-latte", "matcha", "Iced Matcha Latte", 800, {
    image: "/images/matcha.webp",
    imageAlt:
      "Iced Matcha Latte dans un gobelet transparent 2FIVE3, avec des couches de lait blanc et de matcha vert.",
  }),
  product("iced-strawberry-matcha", "matcha", "Iced Strawberry Matcha", 900, {
    image: "/images/iced-strawberry-matcha.webp",
    imageAlt:
      "Iced Strawberry Matcha dans un gobelet transparent 2FIVE3, avec une base rouge fraise, une couche de lait blanc et du matcha vert au-dessus.",
  }),
  product("iced-mango-matcha", "matcha", "Iced Mango Matcha", 900, {
    imageAlt:
      "Iced Mango Matcha dans un gobelet transparent 2FIVE3, avec une base jaune mangue, une couche de lait blanc et du matcha vert au-dessus.",
  }),
  product("iced-matcha-oreo", "matcha", "Iced Matcha Oreo", 900, {
    imageAlt:
      "Iced Matcha Oreo dans un gobelet transparent 2FIVE3, avec des couches de lait blanc, de matcha vert et des miettes sombres de biscuit.",
  }),
  product("matcha-caramel", "matcha", "Matcha Caramel", 900, {
    imageAlt:
      "Matcha Caramel dans un gobelet transparent 2FIVE3, avec une base caramel ambrée, du lait blanc et du matcha vert.",
  }),
  product("cloud-matcha-milk-foam", "matcha", "Cloud Matcha Milk Foam", 900, {
    imageAlt:
      "Cloud Matcha Milk Foam dans un gobelet transparent 2FIVE3, avec du matcha vert surmonté d’une mousse blanche.",
  }),
  product("passion-fruit-mojito", "mojitos", "Passion Fruit Mojito", 700),
  product("blue-lagon-mojito", "mojitos", "Blue Lagon Mojito", 700, {
    image: "/images/blue-lagon-mojito.webp",
    imageAlt: "Blue Lagon Mojito bleu dans un gobelet transparent 2FIVE3.",
  }),
  product("strawberry-mojito", "mojitos", "Strawberry Mojito", 700, {
    imageAlt:
      "Strawberry Mojito rouge foncé dans un gobelet transparent 2FIVE3.",
  }),
  product(
    "blue-passion-fruit-mojito",
    "mojitos",
    "Blue Passion Fruit Mojito",
    700,
  ),
  product("mint-mojito", "mojitos", "Mint Mojito", 700, {
    image: "/images/mojitos.webp",
  }),
  product("mango-mojito", "mojitos", "Mango Mojito", 700, {
    imageAlt: "Mango Mojito jaune dans un gobelet transparent 2FIVE3.",
  }),
  product("blueberry-mojito", "mojitos", "Blueberry Mojito", 700),
  product("watermelon-mojito", "mojitos", "Watermelon Mojito", 700, {
    imageAlt: "Watermelon Mojito rose pâle dans un gobelet transparent 2FIVE3.",
  }),
  product("mixed-mojito", "mojitos", "Mixed Mojito", 700, {
    imageAlt:
      "Mixed Mojito dans un gobelet transparent 2FIVE3, avec des sirops rouge et vert visibles.",
  }),
  product("espresso", "coffee", "Espresso", 400, {
    image: "/images/espresso.webp",
  }),
  product("americano", "coffee", "Americano", 600, {
    image: "/images/americano.webp",
  }),
  product("cappuccino", "coffee", "Cappuccino", 600),
  product("latte", "coffee", "Latte", 600, {
    image: "/images/coffee.webp",
  }),
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
    {
      imageAlt:
        "Mocha (White / Dark Chocolate) dans un gobelet transparent 2FIVE3, avec une boisson chocolatée et une couche de crème blanche bien visible sur le dessus.",
    },
  ),
  product("caramel-frappuccino", "frappuccino", "Caramel Frappuccino", 900, {
    image: "/images/frappuccino.webp",
  }),
  product("vanilla-frappuccino", "frappuccino", "Vanilla Frappuccino", 900, {
    image: "/images/vanilla-frappuccino.webp",
  }),
  product(
    "strawberry-frappuccino",
    "frappuccino",
    "Strawberry Frappuccino",
    900,
  ),
];

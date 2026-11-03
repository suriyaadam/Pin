import { useEffect, useRef, useState } from "react";
import { categories, products } from "./data/catalog";
import { brand } from "./data/brand";
import ScrollVideoHero from "./components/ScrollVideoHero";

function Icon({ name = "arrow", size = 20, ...props }) {
  const paths = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    diagonal: <path d="M6 18 18 6M6 6h12v12" />,
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    menu: <path d="M4 8h16M4 16h16" />,
    grid: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </>
    ),
    list: <path d="M8 6h12M8 12h12M8 18h12M3 6h1M3 12h1M3 18h1" />,
    cup: (
      <>
        <path d="M5 9h12v6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5ZM17 10h2a3 3 0 0 1 0 6h-2M9 3v3M13 2v4" />
      </>
    ),
    leaf: (
      <>
        <path d="M20 3C8 2 2 8 5 15c3 7 14 5 15-12Z" />
        <path d="M4 21 15 10" />
      </>
    ),
    glass: (
      <>
        <path d="m6 8 2 13h8l2-13ZM5 8h14M13 8l3-6h4M7 13h10" />
      </>
    ),
    frappe: (
      <>
        <path d="m6 10 2 11h8l2-11ZM5 10h14M6 10a3 3 0 0 1 1-5 3 3 0 0 1 6-1 3 3 0 0 1 5 4v2M14 4l2-3" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.arrow}
    </svg>
  );
}

const categoryIcons = {
  matcha: "leaf",
  mojitos: "glass",
  coffee: "cup",
  frappuccino: "frappe",
};
const money = (price) => `${price.toLocaleString("fr-FR")} FDJ`;
const categoryName = (id) =>
  categories.find((category) => category.id === id)?.label;
const normalize = (text) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const scrollToMenu = () => {
  document.getElementById("carte")?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
};

function Logo({ light = false }) {
  return (
    <a
      className={`logo ${light ? "logo-light" : ""}`}
      href="#accueil"
      aria-label="2FIVE3 Coffee & Mart — accueil"
    >
      {brand.logo ? (
        <img src={brand.logo} alt="2FIVE3 Coffee & Mart" />
      ) : (
        <>
          <span className="logo-name">
            2FIVE3<span className="logo-star">✳</span>
          </span>
          <span className="logo-subtitle">COFFEE & MART</span>
        </>
      )}
    </a>
  );
}

function ProductCard({ product, onOpen }) {
  return (
    <article className={`product-card product-${product.category}`}>
      <button
        className="product-image-button"
        onClick={() => onOpen(product)}
        aria-label={`Découvrir ${product.name}, ${money(product.price)}`}
      >
        <img
          src={product.image}
          alt={product.imageAlt}
          loading="lazy"
          width="600"
          height="700"
        />
        <span className="product-image-arrow">
          <Icon name="diagonal" size={20} />
        </span>
      </button>
      <div className="product-info">
        <span className="product-category">
          {categoryName(product.category)}
        </span>
        <h3>
          <button onClick={() => onOpen(product)}>{product.name}</button>
        </h3>
        <p className="product-price">
          {product.price.toLocaleString("fr-FR")} <span>FDJ</span>
        </p>
      </div>
    </article>
  );
}

function ProductModal({ product, onClose }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialogRef}
      className="product-dialog"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-labelledby="dialog-title"
    >
      <div className="dialog-content">
        <button
          className="dialog-close icon-button"
          onClick={onClose}
          aria-label="Fermer la fiche"
        >
          <Icon name="close" />
        </button>
        <div className="dialog-image">
          <img src={product.image} alt={product.imageAlt} />
        </div>
        <div className="dialog-details">
          <span className="eyebrow">
            LA CARTE · {categoryName(product.category)}
          </span>
          <h2 id="dialog-title">{product.name}</h2>
          <p className="dialog-price">{money(product.price)}</p>
          <span className="small-divider" />
          <p className="dialog-brand">
            Votre prochaine pause,
            <br />
            <em>signée 2FIVE3.</em>
          </p>
          <button className="text-button" onClick={onClose}>
            Retour à la carte <Icon name="arrow" size={17} />
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default function App() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [view, setView] = useState("grid");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef(null);

  const chooseCategory = (id) => {
    setActiveCategory(id);
    setShowAll(false);
    setSearch("");
  };
  const goToCategory = (id) => {
    chooseCategory(id);
    scrollToMenu();
    setMobileMenuOpen(false);
  };
  const openSearch = () => {
    setSearchOpen(true);
    setMobileMenuOpen(false);
    scrollToMenu();
    setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 100);
  };
  // Interleave the four categories to introduce every collection in the full menu.
  const featuredProduct =
    products.find((product) => product.id === brand.featuredProductId) ||
    products[0];
  const groups = categories.map((category) =>
    products.filter((product) => product.category === category.id),
  );
  const editorialOrder = Array.from(
    { length: Math.max(...groups.map((group) => group.length)) },
    (_, index) => groups.map((group) => group[index]).filter(Boolean),
  ).flat();
  const matchingProducts = editorialOrder.filter(
    (product) =>
      (activeCategory === "all" || product.category === activeCategory) &&
      normalize(product.name).includes(normalize(search.trim())),
  );
  const displayedProducts =
    showAll || search.trim() || activeCategory !== "all"
      ? matchingProducts
      : matchingProducts.slice(0, 8);

  return (
    <>
      <a href="#carte" className="skip-link">
        Aller à la carte
      </a>
      <div className="announcement">
        <span>UN PEU DE DOUCEUR DANS VOTRE JOURNÉE</span>
        <span className="announcement-star">✦</span>
        <span className="announcement-extra">BIENVENUE CHEZ 2FIVE3</span>
      </div>
      <header className="site-header">
        <div className="nav-wrap">
          <Logo />
          <nav
            className={`main-nav ${mobileMenuOpen ? "is-open" : ""}`}
            aria-label="Navigation principale"
          >
            <a href="#carte" onClick={() => setMobileMenuOpen(false)}>
              Notre carte
            </a>
            <a href="#esprit" onClick={() => setMobileMenuOpen(false)}>
              L’esprit 2FIVE3
            </a>
            <a href="#pause" onClick={() => setMobileMenuOpen(false)}>
              Une pause ensemble
            </a>
          </nav>
          <div className="nav-actions">
            <button
              className="icon-button search-trigger"
              onClick={openSearch}
              aria-label="Rechercher une boisson"
            >
              <Icon name="search" />
            </button>
            <a href="#carte" className="nav-cta">
              Trouver ma boisson <Icon name="diagonal" size={16} />
            </a>
            <button
              className="icon-button mobile-menu-button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileMenuOpen}
            >
              <Icon name={mobileMenuOpen ? "close" : "menu"} />
            </button>
          </div>
        </div>
      </header>
      <main>
        <ScrollVideoHero
          product={featuredProduct}
          onOpenProduct={setSelectedProduct}
          Icon={Icon}
        />
        <div className="category-ribbon" aria-label="Nos univers">
          <div>
            {[
              "MATCHA MOMENTS",
              "COFFEE LOVERS",
              "MOJITO MOOD",
              "FRAPPUCCINO DAYS",
            ].map((text) => (
              <span key={text}>
                {text}
                <span className="ribbon-star" aria-hidden="true">
                  ✳
                </span>
              </span>
            ))}
          </div>
        </div>

        <section
          id="carte"
          className="catalogue section-wrap"
          aria-labelledby="catalogue-title"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow section-eyebrow">
                FAITES PLACE À VOS ENVIES
              </span>
              <h2 id="catalogue-title">
                La carte
                <span className="heading-star" aria-hidden="true">
                  ✳
                </span>
              </h2>
            </div>
            <p>
              Des classiques que l’on aime.
              <br />
              Des envies que l’on découvre.
            </p>
          </div>
          <div className="catalogue-toolbar">
            <div
              className="category-filters"
              role="group"
              aria-label="Filtrer par catégorie"
            >
              <button
                className={activeCategory === "all" ? "active" : ""}
                aria-pressed={activeCategory === "all"}
                onClick={() => chooseCategory("all")}
              >
                Tout découvrir <span>27</span>
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={activeCategory === category.id ? "active" : ""}
                  aria-pressed={activeCategory === category.id}
                  onClick={() => chooseCategory(category.id)}
                >
                  <Icon name={categoryIcons[category.id]} size={17} />
                  {category.label.charAt(0) +
                    category.label.slice(1).toLowerCase()}
                  <span>{category.count}</span>
                </button>
              ))}
            </div>
            <button
              className={`icon-button catalogue-search ${searchOpen ? "is-active" : ""}`}
              onClick={() => {
                setSearchOpen(!searchOpen);
                if (!searchOpen)
                  setTimeout(() => searchRef.current?.focus(), 50);
                else setSearch("");
              }}
              aria-label={
                searchOpen ? "Fermer la recherche" : "Rechercher dans la carte"
              }
              aria-expanded={searchOpen}
            >
              <Icon name={searchOpen ? "close" : "search"} size={19} />
            </button>
          </div>
          {searchOpen && (
            <div className="search-field">
              <Icon name="search" size={20} />
              <label className="sr-only" htmlFor="drink-search">
                Rechercher une boisson
              </label>
              <input
                ref={searchRef}
                id="drink-search"
                type="search"
                placeholder="Une envie de matcha, de caramel…"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setShowAll(true);
                }}
              />
              {search && (
                <button className="text-button" onClick={() => setSearch("")}>
                  Effacer
                </button>
              )}
            </div>
          )}
          <div className="results-bar">
            <p role="status">
              {search.trim()
                ? `${matchingProducts.length} résultat${matchingProducts.length !== 1 ? "s" : ""}`
                : activeCategory === "all"
                  ? "À chaque humeur, sa boisson."
                  : `${matchingProducts.length} boissons à découvrir`}
              <span className="results-count">
                {activeCategory === "all" && !search.trim()
                  ? "27 boissons · 4 univers"
                  : "Tous les prix en FDJ"}
              </span>
            </p>
            <div
              className="view-toggle"
              role="group"
              aria-label="Affichage de la carte"
            >
              <button
                className={view === "grid" ? "active" : ""}
                onClick={() => setView("grid")}
                aria-label="Affichage en grille"
                aria-pressed={view === "grid"}
              >
                <Icon name="grid" size={17} />
              </button>
              <button
                className={view === "list" ? "active" : ""}
                onClick={() => setView("list")}
                aria-label="Affichage en liste"
                aria-pressed={view === "list"}
              >
                <Icon name="list" size={19} />
              </button>
            </div>
          </div>
          {displayedProducts.length ? (
            <div
              className={`product-grid ${view === "list" ? "list-view" : ""}`}
            >
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpen={setSelectedProduct}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Icon name="search" size={32} />
              <h3>Une autre envie ?</h3>
              <p>Aucune boisson ne correspond à « {search} ».</p>
              <button
                className="button button-dark"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("all");
                }}
              >
                Afficher toute la carte <Icon name="arrow" size={17} />
              </button>
            </div>
          )}
          {!showAll && !search.trim() && activeCategory === "all" && (
            <div className="load-more">
              <button
                className="button button-outline"
                onClick={() => setShowAll(true)}
              >
                Voir toute la carte <span className="button-count">27</span>
                <Icon name="arrow" size={18} />
              </button>
              <p>Encore de belles pauses à découvrir.</p>
            </div>
          )}
        </section>

        <section
          className="brand-story section-wrap"
          id="esprit"
          aria-labelledby="story-title"
        >
          <div className="story-visual">
            <img
              src={brand.storyImage}
              loading="lazy"
              alt={brand.storyImageAlt}
            />
            <div className="story-stamp">
              a little
              <br />
              <em>coffee break.</em>
              <span>THE 2FIVE3 WAY</span>
            </div>
          </div>
          <div className="story-content">
            <span className="eyebrow">L’ESPRIT 2FIVE3</span>
            <h2 id="story-title">
              Les petits moments.
              <br />
              <em>Les grandes envies.</em>
            </h2>
            <p>
              Un café pour commencer. Un matcha pour ralentir. Un mojito pour
              changer d’humeur.
            </p>
            <p>
              Chez 2FIVE3, chaque envie a sa place.
              <br />
              Prenez le temps de trouver la vôtre.
            </p>
            <a className="text-button" href="#carte">
              Et vous, quelle sera votre pause ?{" "}
              <Icon name="diagonal" size={17} />
            </a>
            <div className="story-signature">
              2FIVE3 <span>COFFEE & MART</span>
              <span className="signature-star">✳</span>
            </div>
          </div>
        </section>

        <section
          className="pause-section"
          id="pause"
          aria-labelledby="pause-title"
        >
          <span className="eyebrow">VOTRE MOMENT, VOTRE ENVIE.</span>
          <h2 id="pause-title">
            On fait une <em>pause ?</em>
            <span aria-hidden="true">✳</span>
          </h2>
          <p>Quatre univers à explorer. Une boisson à trouver.</p>
          <div className="pause-categories">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => goToCategory(category.id)}
              >
                {category.label.charAt(0) +
                  category.label.slice(1).toLowerCase()}{" "}
                <Icon name="diagonal" size={16} />
              </button>
            ))}
          </div>
        </section>
      </main>
      <footer className="site-footer section-wrap">
        <Logo />
        <p>À chaque envie, sa pause.</p>
        <a href="#accueil">
          Retour en haut <Icon name="arrow" className="up-arrow" size={16} />
        </a>
        <span className="footer-bottom">
          © {new Date().getFullYear()} 2FIVE3 Coffee & Mart
        </span>
        <span className="footer-bottom footer-prices">
          Catalogue de présentation · Prix en FDJ
        </span>
      </footer>
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}

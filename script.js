/* ==========================================================================
   JoyasMuñoz - página de inicio
   ========================================================================== */

let catalogCache = [];

function getActiveFilters() {
  return {
    query: normalizeText(document.querySelector("#searchInput")?.value || ""),
    category: document.querySelector("[data-filter].active")?.dataset.filter || "all",
  };
}

function applyCatalogFilters() {
  const grid = document.querySelector("#productGrid");
  const count = document.querySelector("#catalogCount");
  if (!grid) return;

  const { query, category } = getActiveFilters();
  const filtered = catalogCache.filter((product) => {
    const matchesCategory = category === "all" || product.categoria === category;
    const haystack = normalizeText(`${product.name} ${product.description} ${product.material} ${product.categoria}`);
    return matchesCategory && haystack.includes(query);
  });

  grid.innerHTML = filtered.length
    ? filtered.map(renderProductCard).join("")
    : `<article class="category-empty" data-reveal>
        <h2>No encontramos joyas con esos filtros</h2>
        <p>Prueba con otra categoría o busca por material, nombre o colección.</p>
      </article>`;

  if (count) count.textContent = `${filtered.length} joya${filtered.length === 1 ? "" : "s"} encontradas`;
  setupRevealAnimations();
}

function renderFeaturedProducts() {
  const grid = document.querySelector("#featuredGrid");
  if (!grid) return;
  const featured = catalogCache
    .filter((product) => product.featured)
    .sort((a, b) => Number(b.categoria === "Joyas de cobre") - Number(a.categoria === "Joyas de cobre"))
    .slice(0, 4);
  grid.innerHTML = featured
    .map(
      (product, index) => `
      <article class="featured-card" data-reveal role="group" aria-roledescription="diapositiva" aria-label="${index + 1} de ${featured.length}">
        <img src="${getPrimaryImage(product)}" alt="${product.name}" loading="lazy" decoding="async" width="680" height="760" />
        <div class="featured-content">
          <p>${product.categoria}</p>
          <h3>${product.name}</h3>
          <a class="btn btn-primary" href="${buildProductDetailsLink(product)}">Ver joya</a>
        </div>
      </article>`
    )
    .join("");

  setupFeaturedCarousel();
}

function setupFeaturedCarousel() {
  const carousel = document.querySelector("#featuredGrid");
  const previous = document.querySelector("#featuredPrev");
  const next = document.querySelector("#featuredNext");
  if (!carousel || !previous || !next) return;

  const updateControls = () => {
    previous.disabled = carousel.scrollLeft <= 1;
    next.disabled = carousel.scrollWidth - carousel.clientWidth - carousel.scrollLeft <= 1;
  };
  const scrollByCard = (direction) => {
    const card = carousel.querySelector(".featured-card");
    if (!card) return;
    const gap = Number.parseFloat(getComputedStyle(carousel).columnGap) || 0;
    const atEnd = carousel.scrollWidth - carousel.clientWidth - carousel.scrollLeft <= 1;
    if (direction > 0 && atEnd) {
      carousel.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    carousel.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: "smooth" });
  };

  previous.addEventListener("click", () => scrollByCard(-1));
  next.addEventListener("click", () => scrollByCard(1));
  carousel.addEventListener("scroll", updateControls, { passive: true });
  window.addEventListener("resize", updateControls);

  const section = carousel.closest(".featured-carousel");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  window.setInterval(() => {
    if (reducedMotion.matches || document.hidden || section?.matches(":hover") || section?.contains(document.activeElement)) return;
    scrollByCard(1);
  }, 4000);

  updateControls();
}

function renderBestSellers() {
  const grid = document.querySelector("#bestSellerGrid");
  if (!grid) return;
  const consulted = catalogCache
    .filter((product) => product.consulted)
    .sort((a, b) => Number(b.categoria === "Joyas de cobre") - Number(a.categoria === "Joyas de cobre"))
    .slice(0, 3);
  grid.innerHTML = consulted
    .map(
      (product) => `
      <article class="consulted-card" data-reveal>
        <a class="consulted-image" href="${buildProductDetailsLink(product)}">
          <img src="${getPrimaryImage(product)}" alt="${product.name}" loading="lazy" decoding="async" />
        </a>
        <div class="consulted-content">
          <p class="product-category">${product.material}</p>
          <h3>${product.name}</h3>
          <p>${formatPrice(product.price)}</p>
          <button type="button" class="btn btn-ghost" data-add-to-cart="${product.id}">Agregar a la cesta</button>
        </div>
      </article>`
    )
    .join("");
}

function setupCatalogControls() {
  document.querySelector("#searchInput")?.addEventListener("input", applyCatalogFilters);
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-filter]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      applyCatalogFilters();
    });
  });
}

function renderTestimonials() {
  const container = document.querySelector("#testimonialGrid");
  if (!container) return;

  const testimonials = [
    ["La atención fue rápida y muy cuidadosa. Me ayudaron a elegir una esclava de cobre preciosa.", "Camila R."],
    ["Compré una pieza de plata para regalo y llegó impecable. Se nota el detalle del pulido.", "Francisco M."],
    ["El collar de perlas se ve fino y delicado. La consulta por WhatsApp fue clara desde el inicio.", "Valentina S."],
  ];

  container.innerHTML = testimonials
    .map(
      ([quote, author]) => `
      <article class="testimonial-card" data-reveal>
        <p>“${quote}”</p>
        <span>${author}</span>
      </article>`
    )
    .join("");
}

function renderHomeJsonLd() {
  const script = document.querySelector("#homeStructuredData");
  if (!script) return;
  script.textContent = createJsonLd([
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE.name,
      url: SITE.domain,
      description: "Joyas de cobre como colección principal, con esclavas, pulseras y diseños con lapislázuli. También ofrece joyas de plata 925, alpaca y perlas.",
      logo: absoluteUrl("assets/diamond-favicon.svg"),
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+56 9 4954 3511",
        contactType: "customer service",
        areaServed: "CL",
        availableLanguage: "Spanish",
      },
      sameAs: [SITE.whatsappBase],
    },
    {
      "@context": "https://schema.org",
      "@type": "JewelryStore",
      name: SITE.name,
      url: SITE.domain,
      description: "Colección de joyas de cobre en Chile: esclavas, pulseras y diseños con lapislázuli. Consulta disponibilidad por WhatsApp.",
      knowsAbout: ["Joyas de cobre", "Esclavas de cobre", "Pulseras de cobre", "Joyas con lapislázuli"],
      image: absoluteUrl(SITE.defaultImage),
      telephone: "+56 9 4954 3511",
      address: { "@type": "PostalAddress", addressCountry: "CL" },
      priceRange: "$$",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.domain },
      ],
    },
  ]);
}

document.addEventListener("DOMContentLoaded", async () => {
  setupCommonUI();
  setupAddToCartButtons(() => catalogCache);
  setupCatalogControls();
  renderTestimonials();
  renderHomeJsonLd();

  try {
    catalogCache = await loadCatalog();
    renderFeaturedProducts();
    renderBestSellers();
    applyCatalogFilters();
  } catch (error) {
    console.error(error);
    const grid = document.querySelector("#productGrid");
    if (grid) {
      grid.innerHTML = `<p>No fue posible cargar los productos. Abre el sitio desde un servidor local para probar el catálogo.</p>`;
    }
  }

  setupRevealAnimations();
});

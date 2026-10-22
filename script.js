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
  const featured = catalogCache.filter((product) => product.featured).slice(0, 3);
  grid.innerHTML = featured
    .map(
      (product) => `
      <article class="featured-card" data-reveal>
        <img src="${getPrimaryImage(product)}" alt="${product.name}" loading="lazy" decoding="async" width="680" height="760" />
        <div class="featured-content">
          <p>${product.categoria}</p>
          <h3>${product.name}</h3>
          <a class="btn btn-primary" href="${buildProductDetailsLink(product)}">Ver joya</a>
        </div>
      </article>`
    )
    .join("");
}

function renderBestSellers() {
  const grid = document.querySelector("#bestSellerGrid");
  if (!grid) return;
  const consulted = catalogCache.filter((product) => product.consulted).slice(0, 3);
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

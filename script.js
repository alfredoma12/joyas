/* ==========================================================================
   JoyasMuñoz - página de inicio
   ========================================================================== */

let catalogCache = [];

function renderFeaturedProducts() {
  const grid = document.querySelector("#featuredGrid");
  if (!grid) return;
  const featured = catalogCache
    .filter((product) => product.featured && product.categoria === "Joyas de cobre")
    .slice(0, 4);
  grid.innerHTML = featured
    .map(
      (product) => `
      <a class="category-card" href="${buildProductDetailsLink(product)}" data-reveal>
        <img src="${getPrimaryImage(product)}" alt="" loading="lazy" decoding="async" width="480" height="600" />
        <span class="category-card-content"><span>Joyas de cobre</span><strong>${product.name}</strong></span>
      </a>`
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
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE.name,
      url: SITE.domain,
      inLanguage: "es-CL",
    },
  ]);
}

document.addEventListener("DOMContentLoaded", async () => {
  setupCommonUI();
  setupAddToCartButtons(() => catalogCache);
  renderHomeJsonLd();

  try {
    catalogCache = await loadCatalog();
    renderFeaturedProducts();
  } catch (error) {
    console.error(error);
  }

  setupRevealAnimations();
});

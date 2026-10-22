/* ==========================================================================
   JoyasMuñoz - ficha de producto
   ========================================================================== */

let productCatalog = [];

function updateProductSeo(product) {
  const baseUrl = `${SITE.domain}/product.html`;
  const url = new URL(baseUrl);
  if (product?.id) url.searchParams.set("id", product.id);

  if (!product) {
    document.title = "Producto no encontrado | JoyasMuñoz";
    setMeta('meta[name="robots"]', "noindex,follow");
    setMeta('meta[name="description"]', "El producto solicitado no está disponible en este momento.");
    setMeta("#canonicalLink", baseUrl, "href");
    return;
  }

  const title = `${product.name} ${product.material} | JoyasMuñoz`;
  const description = `${product.description} Consulta disponibilidad por WhatsApp en JoyasMuñoz.`.slice(0, 158);
  const image = absoluteUrl(getPrimaryImage(product));

  document.title = title;
  setMeta('meta[name="description"]', description);
  setMeta('meta[name="keywords"]', `${product.name}, ${product.material}, ${product.categoria}, joyas Chile, JoyasMuñoz`);
  setMeta('meta[name="robots"]', "index,follow");
  setMeta("#canonicalLink", url.toString(), "href");
  setMeta("#ogUrlMeta", url.toString());
  setMeta("#ogImageMeta", image);
  setMeta("#twitterImageMeta", image);
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', description);

  const structuredData = document.querySelector("#productStructuredData");
  if (structuredData) {
    structuredData.textContent = createJsonLd([
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        category: product.categoria,
        material: product.material,
        image: getProductImages(product).map(absoluteUrl),
        brand: { "@type": "Brand", name: SITE.name },
        offers: {
          "@type": "Offer",
          priceCurrency: "CLP",
          price: String(product.price || 0),
          availability: product.stock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
          url: url.toString(),
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.domain },
          {
            "@type": "ListItem",
            position: 2,
            name: product.categoria,
            item: `${SITE.domain}/category.html?categoria=${encodeURIComponent(product.categoria)}`,
          },
          { "@type": "ListItem", position: 3, name: product.name, item: url.toString() },
        ],
      },
    ]);
  }
}

function renderProduct(product) {
  const container = document.querySelector("#productDetail");
  if (!container) return;

  if (!product) {
    container.innerHTML = `
      <article class="category-empty" data-reveal>
        <h1>Producto no encontrado</h1>
        <p>El enlace puede estar incompleto o la joya ya no está disponible.</p>
        <a class="btn btn-primary" href="index.html#coleccion">Volver a la colección</a>
      </article>`;
    return;
  }

  renderBreadcrumbs([
    { name: "Inicio", url: "index.html" },
    { name: product.categoria, url: `category.html?categoria=${encodeURIComponent(product.categoria)}` },
    { name: product.name, url: window.location.href },
  ]);

  const images = getProductImages(product);
  const badges = buildProductBadges(product);

  container.innerHTML = `
    <article class="product-detail-card" data-reveal>
      <section class="detail-gallery" aria-label="Galería de ${product.name}">
        <div class="detail-carousel">
          <div class="detail-track" id="detailTrack">
            ${images
              .map(
                (image, index) => `
                <div class="detail-slide" aria-hidden="${index === 0 ? "false" : "true"}">
                  <img src="${image}" alt="${product.name}, vista ${index + 1}" loading="${index === 0 ? "eager" : "lazy"}" decoding="async" fetchpriority="${index === 0 ? "high" : "low"}" />
                </div>`
              )
              .join("")}
          </div>
          ${
            images.length > 1
              ? `<button class="carousel-control prev" id="carouselPrev" type="button" aria-label="Imagen anterior">‹</button>
                 <button class="carousel-control next" id="carouselNext" type="button" aria-label="Imagen siguiente">›</button>`
              : ""
          }
        </div>
        ${
          images.length > 1
            ? `<div class="detail-dots" id="detailDots">
                ${images
                  .map(
                    (_, index) =>
                      `<button class="detail-dot ${index === 0 ? "active" : ""}" type="button" data-index="${index}" aria-label="Ver imagen ${index + 1}"></button>`
                  )
                  .join("")}
              </div>`
            : ""
        }
      </section>
      <section class="detail-info">
        <div class="product-badges static">${badges}</div>
        <p class="product-category">${product.categoria}</p>
        <h1>${product.name}</h1>
        <p class="detail-price">${formatPrice(product.price)}</p>
        <p class="detail-description">${product.description}</p>
        <dl class="detail-specs">
          <div><dt>Material</dt><dd>${product.material}</dd></div>
          <div><dt>Stock</dt><dd>${stockLabel(product)}</dd></div>
          <div><dt>Consulta</dt><dd>Sin pago online, coordinación por WhatsApp</dd></div>
        </dl>
        <div class="detail-actions">
          <button type="button" class="btn btn-primary" data-add-to-cart="${product.id}">Agregar a la cesta</button>
          <button type="button" class="btn btn-ghost" id="quickWhatsApp">Consultar esta joya</button>
        </div>
      </section>
    </article>`;

  document.querySelector("#quickWhatsApp")?.addEventListener("click", () => {
    Cart.add(product);
    window.open(Cart.buildWhatsAppLink(), "_blank", "noopener,noreferrer");
  });

  setupCarousel(images.length);
}

function setupCarousel(totalImages) {
  if (totalImages <= 1) return;
  const track = document.querySelector("#detailTrack");
  const dots = document.querySelectorAll(".detail-dot");
  let current = 0;

  const goTo = (index) => {
    current = (index + totalImages) % totalImages;
    if (track) track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === current));
  };

  document.querySelector("#carouselPrev")?.addEventListener("click", () => goTo(current - 1));
  document.querySelector("#carouselNext")?.addEventListener("click", () => goTo(current + 1));
  dots.forEach((dot, index) => dot.addEventListener("click", () => goTo(index)));
}

document.addEventListener("DOMContentLoaded", async () => {
  setupCommonUI();
  setupAddToCartButtons(() => productCatalog);

  try {
    productCatalog = await loadCatalog();
    const product = findProductById(productCatalog, new URLSearchParams(window.location.search).get("id"));
    updateProductSeo(product);
    renderProduct(product);
  } catch (error) {
    console.error(error);
    updateProductSeo(null);
    renderProduct(null);
  }

  setupRevealAnimations();
});

/* ==========================================================================
   JoyasMuñoz - ficha de producto
   ========================================================================== */

let productCatalog = [];

function updateProductSeo(product) {
  const url = new URL(product ? buildProductDetailsLink(product) : "product.html", `${SITE.domain}/`);

  if (!product) {
    document.title = "Producto no encontrado | JoyasMuñoz";
    setMeta('meta[name="robots"]', "noindex,follow");
    setMeta('meta[name="description"]', "El producto solicitado no está disponible en este momento.");
    setMeta("#canonicalLink", url.toString(), "href");
    return;
  }

  const material = product.material;
  const titleOverrides = {
    "pulsera-cobre-lapislazuli": "Pulsera de cobre y lapislázuli en Chile | JoyasMuñoz",
    "aros-lapislazuli-natural-cobre": "Aros de lapislázuli y cobre en Chile | JoyasMuñoz",
  };
  const title = titleOverrides[product.id] || (() => {
    const normalizedName = normalizeText(product.name);
    const materialSuffix = normalizeText(material).includes("plata 925") && normalizedName.includes("plata")
      ? " 925"
      : product.categoria === "Joyas de cobre" && !normalizedName.includes("cobre")
        ? " de cobre"
        : product.categoria === "Joyas de plata" && !normalizedName.includes("plata")
          ? " de plata 925"
          : product.categoria === "Perlas" && !normalizedName.includes("perlas")
            ? " de perlas de río"
            : "";
    return `${product.name}${materialSuffix} en Chile | JoyasMuñoz`;
  })();
  const descriptions = {
    "media-cana": "Esclava media caña de cobre puro, pulida y minimalista. Consulta precio y disponibilidad por WhatsApp en JoyasMuñoz.",
    trenzado: "Esclava trenzada de cobre puro con relieve y acabado luminoso. Consulta precio y disponibilidad por WhatsApp.",
    "esclava-de-plata": "Esclava de plata 925 con pulido espejo y líneas puras. Revisa su precio y consulta disponibilidad por WhatsApp.",
    "aros-moissanita": "Aros de plata 925 con moissanita y brillo intenso. Consulta precio y disponibilidad por WhatsApp en JoyasMuñoz.",
    "esclava-lisa": "Esclava lisa de cobre puro, pulida y de diseño continuo. Consulta precio y disponibilidad por WhatsApp.",
    "esclava-alpaca": "Esclava de alpaca con brillo plateado y diseño sobrio. Consulta precio y disponibilidad por WhatsApp.",
    "collar-fabiola": "Collar de perlas de río hecho a mano. Conoce su precio y consulta disponibilidad por WhatsApp en JoyasMuñoz.",
    "pulsera-cobre-lapislazuli": "Pulsera artesanal de cobre y lapislázuli. Revisa su precio y consulta disponibilidad por WhatsApp.",
    "aros-lapislazuli-natural-cobre": "Aros artesanales de cobre con lapislázuli natural. Consulta precio y disponibilidad por WhatsApp.",
  };
  const description = descriptions[product.id] || `${product.description} Consulta disponibilidad por WhatsApp.`.slice(0, 158);
  const image = absoluteUrl(getPrimaryImage(product));

  document.title = title;
  setMeta('meta[name="description"]', description);
  setMeta('meta[name="robots"]', "index,follow");
  setMeta("#canonicalLink", url.toString(), "href");
  setMeta("#ogUrlMeta", url.toString(), "content");
  setMeta("#ogImageMeta", image);
  setMeta("#ogImageAlt", title);
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
        ...(Number.isFinite(product.price) && product.price > 0
          ? {
              offers: {
                "@type": "Offer",
                priceCurrency: "CLP",
                price: String(product.price),
                ...(typeof product.stock === "boolean"
                  ? { availability: product.stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" }
                  : {}),
                url: url.toString(),
              },
            }
          : {}),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE.domain}/` },
          {
            "@type": "ListItem",
            position: 2,
            name: product.categoria,
            item: absoluteUrl(buildCategoryLink(product.categoria)),
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
        <a class="btn btn-primary" href="index.html#categorias">Ver categorías</a>
      </article>`;
    return;
  }

  renderBreadcrumbs([
    { name: "Inicio", url: "/" },
    { name: product.categoria, url: buildCategoryLink(product.categoria) },
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
                  <img src="${image}" alt="${product.name}, vista ${index + 1}" loading="${index === 0 ? "eager" : "lazy"}" decoding="async" fetchpriority="${index === 0 ? "high" : "low"}" width="800" height="1000" />
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
    const productId = document.querySelector("#productDetail")?.dataset.productId
      || new URLSearchParams(window.location.search).get("id");
    const product = findProductById(productCatalog, productId);
    updateProductSeo(product);
    renderProduct(product);
  } catch (error) {
    console.error(error);
    updateProductSeo(null);
    renderProduct(null);
  }

  setupRevealAnimations();
});

/* ==========================================================================
   JoyasMuñoz - categoría
   ========================================================================== */

let categoryCatalog = [];

function currentCategory() {
  return document.querySelector("#categoryGrid")?.dataset.category
    || new URLSearchParams(window.location.search).get("categoria")
    || "";
}

function updateCategorySeo(category, products) {
  const isCopper = category === "Joyas de cobre";
  const isSilver = category === "Joyas de plata";
  const categorySlug = getCategorySlug(category);
  const url = new URL(categorySlug ? buildCategoryLink(category) : "category.html", `${SITE.domain}/`);
  const title = isCopper
    ? "Joyas de cobre en Chile | Pulseras y esclavas | JoyasMuñoz"
    : isSilver
      ? "Joyas de plata en Chile | Aros y esclavas | JoyasMuñoz"
      : category === "Joyas de alpaca"
        ? "Joyas de alpaca en Chile | JoyasMuñoz"
        : category === "Perlas"
          ? "Joyas de perlas en Chile | JoyasMuñoz"
          : "Categorías de joyas en Chile | JoyasMuñoz";
  const description = isCopper
    ? "Descubre pulseras, esclavas y aros de cobre con lapislázuli. Revisa precios y consulta disponibilidad por WhatsApp en JoyasMuñoz."
    : isSilver
      ? "Conoce esclavas y aros de plata 925, incluidos diseños con moissanita. Consulta disponibilidad directamente por WhatsApp."
      : category === "Joyas de alpaca"
        ? "Explora la esclava de alpaca de JoyasMuñoz y consulta su disponibilidad por WhatsApp."
        : category === "Perlas"
          ? "Descubre el collar de perlas de río de JoyasMuñoz. Revisa sus detalles y consulta disponibilidad por WhatsApp."
          : "Explora las categorías de cobre, plata, alpaca y perlas de JoyasMuñoz.";

  document.title = title;
  setMeta('meta[name="description"]', description);
  setMeta("#canonicalLink", url.toString(), "href");
  setMeta("#ogUrlMeta", url.toString(), "content");
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', description);
  const image = products[0] ? absoluteUrl(getPrimaryImage(products[0])) : absoluteUrl(SITE.defaultImage);
  setMeta("#ogImageMeta", image);
  setMeta("#ogImageAlt", title);
  setMeta("#twitterImageMeta", image);

  const jsonLd = document.querySelector("#categoryStructuredData");
  if (jsonLd) {
    jsonLd.textContent = createJsonLd([
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: title,
        description,
        url: url.toString(),
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: products.length,
          itemListElement: products.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: absoluteUrl(buildProductDetailsLink(product)),
            name: product.name,
          })),
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE.domain}/` },
          { "@type": "ListItem", position: 2, name: category || "Categorías", item: url.toString() },
        ],
      },
    ]);
  }
}

function renderCategory() {
  const category = currentCategory();
  const title = document.querySelector("#categoryTitle");
  const count = document.querySelector("#categoryCount");
  const grid = document.querySelector("#categoryGrid");
  if (!title || !count || !grid) return;

  const categoryExists = categoryCatalog.some((product) => product.categoria === category);
  const filtered = category
    ? categoryCatalog.filter((product) => product.categoria === category)
    : categoryCatalog;
  title.textContent = category || "Todas las joyas";
  count.textContent = `${filtered.length} joya${filtered.length === 1 ? "" : "s"} encontradas`;
  updateCategorySeo(category, filtered);
  if (!categoryExists) setMeta('meta[name="robots"]', "noindex,follow");
  renderBreadcrumbs([
    { name: "Inicio", url: "/" },
    { name: category || "Categorías", url: buildCategoryLink(category) },
  ]);

  grid.innerHTML = filtered.length
    ? filtered.map(renderProductCard).join("")
    : `<article class="category-empty" data-reveal>
        <h2>No encontramos productos en esta categoría</h2>
        <p>Elige otra categoría para explorar las joyas disponibles.</p>
        <a class="btn btn-primary" href="index.html#categorias">Ver categorías</a>
      </article>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  setupCommonUI();
  setupAddToCartButtons(() => categoryCatalog);

  try {
    categoryCatalog = await loadCatalog();
    renderCategory();
  } catch (error) {
    console.error(error);
  }

  setupRevealAnimations();
});

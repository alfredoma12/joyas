/* ==========================================================================
   JoyasMuñoz - categoría
   ========================================================================== */

let categoryCatalog = [];

function currentCategory() {
  return new URLSearchParams(window.location.search).get("categoria") || "";
}

function updateCategorySeo(category, count) {
  const url = new URL(`${SITE.domain}/category.html`);
  if (category) url.searchParams.set("categoria", category);

  const isCopper = category === "Joyas de cobre";
  const title = isCopper
    ? "Joyas de Cobre en Chile | Esclavas y Pulseras | JoyasMuñoz"
    : category
      ? `${category} en Chile | JoyasMuñoz`
      : "Joyas de Cobre en Chile y Otras Categorías | JoyasMuñoz";
  const description = isCopper
    ? `Explora ${count} joyas de cobre en Chile: esclavas, pulseras y diseños con lapislázuli. Consulta por WhatsApp en JoyasMuñoz.`
    : category
      ? `Explora ${count} diseños de ${category.toLowerCase()} en JoyasMuñoz. Consulta disponibilidad por WhatsApp.`
      : "Explora joyas de cobre en Chile: esclavas, pulseras y diseños con lapislázuli. También encuentra plata 925, alpaca y perlas.";

  document.title = title;
  setMeta('meta[name="description"]', description);
  setMeta(
    'meta[name="keywords"]',
    isCopper
      ? "joyas de cobre en Chile, esclavas de cobre, pulseras de cobre, joyería de cobre, JoyasMuñoz"
      : `${category || "joyas de cobre en Chile, esclavas de cobre"}, joyería en Chile, JoyasMuñoz`
  );
  setMeta("#canonicalLink", url.toString(), "href");
  setMeta("#ogUrlMeta", url.toString());
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', description);

  const jsonLd = document.querySelector("#categoryStructuredData");
  if (jsonLd) {
    jsonLd.textContent = createJsonLd({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.domain },
        { "@type": "ListItem", position: 2, name: category || "Categorías", item: url.toString() },
      ],
    });
  }
}

function renderCategory() {
  const category = currentCategory();
  const title = document.querySelector("#categoryTitle");
  const count = document.querySelector("#categoryCount");
  const grid = document.querySelector("#categoryGrid");
  if (!title || !count || !grid) return;

  const filtered = categoryCatalog.filter((product) => product.categoria === category);
  title.textContent = category || "Categorías";
  count.textContent = `${filtered.length} joya${filtered.length === 1 ? "" : "s"} encontradas`;
  updateCategorySeo(category, filtered.length);
  renderBreadcrumbs([
    { name: "Inicio", url: "index.html" },
    { name: category || "Categorías", url: window.location.href },
  ]);

  grid.innerHTML = filtered.length
    ? filtered.map(renderProductCard).join("")
    : `<article class="category-empty" data-reveal>
        <h2>No encontramos productos en esta categoría</h2>
        <p>Puedes volver al catálogo completo o elegir otra categoría del menú.</p>
        <a class="btn btn-primary" href="index.html#coleccion">Volver a la colección</a>
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

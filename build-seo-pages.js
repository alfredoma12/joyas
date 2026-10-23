const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const siteUrl = "https://xn--joyasmuoz-r6a.lat";
const catalog = JSON.parse(fs.readFileSync(path.join(root, "products.json"), "utf8"));
const categoryRoutes = new Map([
  ["Joyas de cobre", "cobre"],
  ["Joyas de plata", "plata"],
  ["Joyas de alpaca", "alpaca"],
  ["Perlas", "perlas"],
]);

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function productUrl(product) {
  return `/productos/${slugify(product.name)}/`;
}

function categoryUrl(category) {
  return `/categorias/${categoryRoutes.get(category)}/`;
}

function absoluteUrl(url) {
  return new URL(url, `${siteUrl}/`).toString();
}

function jsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function setTagAttribute(html, id, attribute, value) {
  const escapedValue = escapeHtml(value);
  const tagPattern = new RegExp(`<[^>]*\\bid="${id}"[^>]*>`);
  return html.replace(tagPattern, (tag) => {
    const attributePattern = new RegExp(`\\b${attribute}="[^"]*"`);
    const replacement = `${attribute}="${escapedValue}"`;
    return attributePattern.test(tag)
      ? tag.replace(attributePattern, replacement)
      : tag.replace(/>$/, ` ${replacement}>`);
  });
}

function setMeta(html, pattern, attribute, value) {
  const escapedValue = escapeHtml(value);
  return html.replace(pattern, (tag) => {
    const attributePattern = new RegExp(`\\b${attribute}="[^"]*"`);
    const replacement = `${attribute}="${escapedValue}"`;
    return attributePattern.test(tag)
      ? tag.replace(attributePattern, replacement)
      : tag.replace(/>$/, ` ${replacement}>`);
  });
}

function withBaseHref(html) {
  return html.replace(/<head>/i, '<head>\n    <base href="/" />');
}

function renderProductCard(product) {
  const image = escapeHtml(product.images?.[0] || product.image);
  const badges = (product.tags || [])
    .map((tag) => `<span class="badge badge-${escapeHtml(tag)}">${tag === "novedad" ? "Novedad" : "Oferta"}</span>`)
    .join("");
  const stock = product.stock === false ? "Consultar reposición" : "Disponible para consulta";

  return `
    <article class="product-card" data-reveal data-category="${escapeHtml(product.categoria)}" data-name="${escapeHtml(product.name)}">
      <a class="product-media" href="${productUrl(product)}" aria-label="Ver detalle de ${escapeHtml(product.name)}">
        ${badges ? `<div class="product-badges">${badges}</div>` : ""}
        <img src="${image}" alt="${escapeHtml(product.name)} (${escapeHtml(product.material)})" loading="lazy" decoding="async" width="480" height="600" />
      </a>
      <div class="product-content">
        <p class="product-category">${escapeHtml(product.categoria)}</p>
        <h2>${escapeHtml(product.name)}</h2>
        <p class="product-description">${escapeHtml(product.description)}</p>
        <dl class="product-meta">
          <div><dt>Material</dt><dd>${escapeHtml(product.material)}</dd></div>
          <div><dt>Stock</dt><dd>${stock}</dd></div>
        </dl>
        <p class="product-price">${new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(product.price)}</p>
        <div class="product-actions">
          <a class="btn btn-ghost" href="${productUrl(product)}">Ver detalle</a>
          <button type="button" class="btn btn-primary btn-add-cart" data-add-to-cart="${escapeHtml(product.id)}">Agregar a la cesta</button>
        </div>
      </div>
    </article>`;
}

function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

function categoryMetadata(category, products) {
  const details = {
    "Joyas de cobre": {
      title: "Joyas de cobre en Chile | Pulseras y esclavas | JoyasMuñoz",
      description: "Descubre pulseras, esclavas y aros de cobre con lapislázuli. Revisa precios y consulta disponibilidad por WhatsApp en JoyasMuñoz.",
    },
    "Joyas de plata": {
      title: "Joyas de plata en Chile | Aros y esclavas | JoyasMuñoz",
      description: "Conoce esclavas y aros de plata 925, incluidos diseños con moissanita. Consulta disponibilidad directamente por WhatsApp.",
    },
    "Joyas de alpaca": {
      title: "Joyas de alpaca en Chile | JoyasMuñoz",
      description: "Explora la esclava de alpaca de JoyasMuñoz y consulta su disponibilidad por WhatsApp.",
    },
    Perlas: {
      title: "Joyas de perlas en Chile | JoyasMuñoz",
      description: "Descubre el collar de perlas de río de JoyasMuñoz. Revisa sus detalles y consulta disponibilidad por WhatsApp.",
    },
  }[category];
  const url = categoryUrl(category);
  const image = products[0].images?.[0] || products[0].image;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: details.title,
      description: details.description,
      url: absoluteUrl(url),
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: products.length,
        itemListElement: products.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: absoluteUrl(productUrl(product)),
          name: product.name,
        })),
      },
    },
    breadcrumbSchema([{ name: "Inicio", url: "/" }, { name: category, url }]),
  ];
  return { ...details, url, image, schemas };
}

function productMetadata(product) {
  const normalizedName = product.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const materialSuffix = product.material.toLowerCase().includes("plata 925") && normalizedName.includes("plata")
    ? " 925"
    : product.categoria === "Joyas de cobre" && !normalizedName.includes("cobre")
      ? " de cobre"
      : product.categoria === "Joyas de plata" && !normalizedName.includes("plata")
        ? " de plata 925"
        : product.categoria === "Perlas" && !normalizedName.includes("perlas")
          ? " de perlas de río"
          : "";
  const titleOverrides = {
    "pulsera-cobre-lapislazuli": "Pulsera de cobre y lapislázuli en Chile | JoyasMuñoz",
    "aros-lapislazuli-natural-cobre": "Aros de lapislázuli y cobre en Chile | JoyasMuñoz",
  };
  const title = titleOverrides[product.id] || `${product.name}${materialSuffix} en Chile | JoyasMuñoz`;
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
  const url = productUrl(product);
  const image = product.images?.[0] || product.image;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    category: product.categoria,
    material: product.material,
    image: (product.images?.length ? product.images : [product.image]).map(absoluteUrl),
    brand: { "@type": "Brand", name: "JoyasMuñoz" },
    ...(Number.isFinite(product.price) && product.price > 0
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "CLP",
            price: String(product.price),
            ...(typeof product.stock === "boolean"
              ? { availability: product.stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" }
              : {}),
            url: absoluteUrl(url),
          },
        }
      : {}),
  };
  return {
    title,
    description,
    url,
    image,
    schemas: [schema, breadcrumbSchema([
      { name: "Inicio", url: "/" },
      { name: product.categoria, url: categoryUrl(product.categoria) },
      { name: product.name, url },
    ])],
  };
}

function renderProductDetail(product) {
  const images = product.images?.length ? product.images : [product.image];
  const badges = (product.tags || [])
    .map((tag) => `<span class="badge badge-${escapeHtml(tag)}">${tag === "novedad" ? "Novedad" : "Oferta"}</span>`)
    .join("");
  const slides = images.map((image, index) => `
    <div class="detail-slide" aria-hidden="${index === 0 ? "false" : "true"}">
      <img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}, vista ${index + 1}" loading="${index === 0 ? "eager" : "lazy"}" decoding="async" fetchpriority="${index === 0 ? "high" : "low"}" width="800" height="1000" />
    </div>`).join("");

  return `<article class="product-detail-card" data-reveal>
    <section class="detail-gallery" aria-label="Galería de ${escapeHtml(product.name)}">
      <div class="detail-carousel">
        <div class="detail-track" id="detailTrack">${slides}</div>
        ${images.length > 1 ? '<button class="carousel-control prev" id="carouselPrev" type="button" aria-label="Imagen anterior">‹</button><button class="carousel-control next" id="carouselNext" type="button" aria-label="Imagen siguiente">›</button>' : ""}
      </div>
      ${images.length > 1 ? `<div class="detail-dots" id="detailDots">${images.map((_, index) => `<button class="detail-dot ${index === 0 ? "active" : ""}" type="button" data-index="${index}" aria-label="Ver imagen ${index + 1}"></button>`).join("")}</div>` : ""}
    </section>
    <section class="detail-info">
      <div class="product-badges static">${badges}</div>
      <p class="product-category">${escapeHtml(product.categoria)}</p>
      <h1>${escapeHtml(product.name)}</h1>
      <p class="detail-price">${new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(product.price)}</p>
      <p class="detail-description">${escapeHtml(product.description)}</p>
      <dl class="detail-specs">
        <div><dt>Material</dt><dd>${escapeHtml(product.material)}</dd></div>
        <div><dt>Stock</dt><dd>${product.stock === false ? "Consultar reposición" : "Disponible para consulta"}</dd></div>
        <div><dt>Consulta</dt><dd>Sin pago online, coordinación por WhatsApp</dd></div>
      </dl>
      <div class="detail-actions">
        <button type="button" class="btn btn-primary" data-add-to-cart="${escapeHtml(product.id)}">Agregar a la cesta</button>
        <button type="button" class="btn btn-ghost" id="quickWhatsApp">Consultar esta joya</button>
      </div>
    </section>
  </article>`;
}

function applyPageMetadata(html, metadata) {
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(metadata.title)}</title>`);
  html = setMeta(html, /<meta name="description"[^>]*>/, "content", metadata.description);
  html = setTagAttribute(html, "canonicalLink", "href", absoluteUrl(metadata.url));
  html = setTagAttribute(html, "ogUrlMeta", "content", absoluteUrl(metadata.url));
  html = setMeta(html, /<meta property="og:title"[^>]*>/, "content", metadata.title);
  html = setMeta(html, /<meta property="og:description"[^>]*>/, "content", metadata.description);
  html = setMeta(html, /<meta name="twitter:title"[^>]*>/, "content", metadata.title);
  html = setMeta(html, /<meta name="twitter:description"[^>]*>/, "content", metadata.description);
  html = setTagAttribute(html, "ogImageMeta", "content", absoluteUrl(metadata.image));
  html = setTagAttribute(html, "ogImageAlt", "content", metadata.title);
  html = setTagAttribute(html, "twitterImageMeta", "content", absoluteUrl(metadata.image));
  return html;
}

function writePage(relativePath, contents) {
  const outputPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, contents);
}

const categoryTemplate = fs.readFileSync(path.join(root, "category.html"), "utf8");
const productTemplate = fs.readFileSync(path.join(root, "product.html"), "utf8");
const sitemapUrls = [`${siteUrl}/`];
const homePath = path.join(root, "index.html");
const featuredProducts = catalog
  .filter((product) => product.featured && product.categoria === "Joyas de cobre")
  .slice(0, 4);
const featuredCards = featuredProducts.map((product) => `
            <a class="category-card" href="${productUrl(product)}" data-reveal>
              <img src="${escapeHtml(product.images?.[0] || product.image)}" alt="" loading="lazy" decoding="async" width="480" height="600" />
              <span class="category-card-content"><span>Joyas de cobre</span><strong>${escapeHtml(product.name)}</strong></span>
            </a>`).join("");
const homeTemplate = fs.readFileSync(homePath, "utf8");
const featuredGridPattern = /<div class="category-cards" id="featuredGrid"[^>]*>[\s\S]*?<\/div>/;
if (!featuredGridPattern.test(homeTemplate)) throw new Error("No se encontró el contenedor de joyas destacadas en index.html.");
const homeHtml = homeTemplate.replace(
  featuredGridPattern,
  `<div class="category-cards" id="featuredGrid" aria-label="Joyas de cobre destacadas">${featuredCards}\n          </div>`
);
fs.writeFileSync(homePath, homeHtml);

for (const [category, slug] of categoryRoutes) {
  const products = catalog.filter((product) => product.categoria === category);
  if (!products.length) continue;
  const metadata = categoryMetadata(category, products);
  let html = applyPageMetadata(categoryTemplate, metadata);
  html = withBaseHref(html);
  html = html.replace('id="categoryTitle">Categoría<', `id="categoryTitle">${escapeHtml(category)}<`);
  html = html.replace('id="categoryCount" class="page-subtitle" aria-live="polite"></p>', `id="categoryCount" class="page-subtitle" aria-live="polite">${products.length} joyas encontradas</p>`);
  html = html.replace('id="categoryGrid"></div>', `id="categoryGrid" data-category="${escapeHtml(category)}">${products.map(renderProductCard).join("")}</div>`);
  html = html.replace('<nav class="breadcrumbs" id="breadcrumbs" aria-label="Ruta de navegación"></nav>', `<nav class="breadcrumbs" id="breadcrumbs" aria-label="Ruta de navegación"><ol><li><a href="/">Inicio</a></li><li><span>${escapeHtml(category)}</span></li></ol></nav>`);
  html = html.replace('<script id="categoryStructuredData" type="application/ld+json"></script>', `<script id="categoryStructuredData" type="application/ld+json">${jsonLd(metadata.schemas)}</script>`);
  writePage(path.join("categorias", slug, "index.html"), html);
  sitemapUrls.push(absoluteUrl(metadata.url));
}

const seenSlugs = new Set();
for (const product of catalog) {
  const slug = slugify(product.name);
  if (!slug || seenSlugs.has(slug)) throw new Error(`El slug del producto no es único: ${product.name}`);
  seenSlugs.add(slug);
  const metadata = productMetadata(product);
  let html = applyPageMetadata(productTemplate, metadata);
  html = withBaseHref(html);
  html = html.replace('<nav class="breadcrumbs" id="breadcrumbs" aria-label="Ruta de navegación"></nav>', `<nav class="breadcrumbs" id="breadcrumbs" aria-label="Ruta de navegación"><ol><li><a href="/">Inicio</a></li><li><a href="${categoryUrl(product.categoria)}">${escapeHtml(product.categoria)}</a></li><li><span>${escapeHtml(product.name)}</span></li></ol></nav>`);
  html = html.replace('<div class="container" id="productDetail"></div>', `<div class="container" id="productDetail" data-product-id="${escapeHtml(product.id)}">${renderProductDetail(product)}</div>`);
  html = html.replace('<script id="productStructuredData" type="application/ld+json"></script>', `<script id="productStructuredData" type="application/ld+json">${jsonLd(metadata.schemas)}</script>`);
  writePage(path.join("productos", slug, "index.html"), html);
  sitemapUrls.push(absoluteUrl(metadata.url));
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.map((url) => `  <url><loc>${escapeHtml(url)}</loc></url>`).join("\n")}\n</urlset>\n`;
fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap);
console.log(`Generated ${categoryRoutes.size} category routes, ${catalog.length} product routes, and sitemap.xml.`);

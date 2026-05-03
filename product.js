const whatsappBase = "https://wa.me/56949543511";

async function loadCatalog() {
  const response = await fetch(`./products.json?v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`No se pudo cargar products.json (${response.status})`);

  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("El archivo products.json debe contener un arreglo.");

  return data;
}

function formatPrice(price) {
  if (typeof price !== "number" || Number.isNaN(price)) return "Precio a consultar";

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(price);
}

function buildWhatsAppLink(product) {
  const message = [
    "Hola, quiero consultar la disponibilidad de esta joya:",
    `Titulo: ${product?.name ?? "Sin titulo"}`,
    `Descripcion: ${product?.description ?? "Sin descripcion"}`,
    `Precio: ${formatPrice(product?.price)}`,
  ].join("\n");

  return `${whatsappBase}?text=${encodeURIComponent(message)}`;
}

function findProductById(catalog, productId) {
  const normalizedId = (productId ?? "").trim().toLowerCase();
  return catalog.find((item) => String(item?.id ?? "").trim().toLowerCase() === normalizedId);
}

function getProductImages(product) {
  const imageList = Array.isArray(product?.images)
    ? product.images.map((image) => String(image ?? "").trim()).filter(Boolean)
    : [];

  if (imageList.length) return imageList;

  const fallbackImage = String(product?.image ?? "").trim();
  return fallbackImage ? [fallbackImage] : [];
}

function getPrimaryImage(product) {
  return getProductImages(product)[0] ?? "";
}

function escapeJsonString(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, " ")
    .trim();
}

function updateProductSeo(product) {
  const baseUrl = "https://joyasmunoz.lat/product.html";
  const canonicalLink = document.querySelector("#canonicalLink");
  const ogUrlMeta = document.querySelector("#ogUrlMeta");
  const ogImageMeta = document.querySelector("#ogImageMeta");
  const twitterImageMeta = document.querySelector("#twitterImageMeta");
  const descriptionMeta = document.querySelector('meta[name="description"]');
  const robotsMeta = document.querySelector('meta[name="robots"]');
  const ogTitleMeta = document.querySelector('meta[property="og:title"]');
  const ogDescriptionMeta = document.querySelector('meta[property="og:description"]');
  const twitterTitleMeta = document.querySelector('meta[name="twitter:title"]');
  const twitterDescriptionMeta = document.querySelector('meta[name="twitter:description"]');
  const structuredData = document.querySelector("#productStructuredData");

  if (!product) {
    document.title = "Producto no encontrado | JoyasMunoz";
    if (descriptionMeta) {
      descriptionMeta.setAttribute("content", "El producto solicitado no se encuentra disponible en este momento.");
    }
    if (robotsMeta) robotsMeta.setAttribute("content", "noindex,follow");
    if (canonicalLink) canonicalLink.setAttribute("href", baseUrl);
    if (ogUrlMeta) ogUrlMeta.setAttribute("content", baseUrl);
    if (ogTitleMeta) ogTitleMeta.setAttribute("content", "Producto no encontrado | JoyasMunoz");
    if (ogDescriptionMeta) {
      ogDescriptionMeta.setAttribute("content", "El producto solicitado no se encuentra disponible en este momento.");
    }
    if (twitterTitleMeta) twitterTitleMeta.setAttribute("content", "Producto no encontrado | JoyasMunoz");
    if (twitterDescriptionMeta) {
      twitterDescriptionMeta.setAttribute("content", "El producto solicitado no se encuentra disponible en este momento.");
    }
    if (structuredData) structuredData.textContent = "";
    return;
  }

  const url = new URL(baseUrl);
  url.searchParams.set("id", String(product.id ?? "").trim());

  const imagePath = getPrimaryImage(product);
  const imageAbsoluteUrl = imagePath ? `https://joyasmunoz.lat/${String(imagePath).replace(/^\//, "")}` : "";
  const title = `${product.name} | JoyasMunoz`;
  const description = (product.description || "Descubre esta joya exclusiva en JoyasMunoz.").slice(0, 155);

  document.title = title;

  if (descriptionMeta) descriptionMeta.setAttribute("content", description);
  if (robotsMeta) robotsMeta.setAttribute("content", "index,follow");
  if (canonicalLink) canonicalLink.setAttribute("href", url.toString());
  if (ogUrlMeta) ogUrlMeta.setAttribute("content", url.toString());
  if (ogTitleMeta) ogTitleMeta.setAttribute("content", title);
  if (ogDescriptionMeta) ogDescriptionMeta.setAttribute("content", description);
  if (twitterTitleMeta) twitterTitleMeta.setAttribute("content", title);
  if (twitterDescriptionMeta) twitterDescriptionMeta.setAttribute("content", description);
  if (imageAbsoluteUrl && ogImageMeta) ogImageMeta.setAttribute("content", imageAbsoluteUrl);
  if (imageAbsoluteUrl && twitterImageMeta) twitterImageMeta.setAttribute("content", imageAbsoluteUrl);

  if (structuredData) {
    const priceValue =
      typeof product.price === "number" && !Number.isNaN(product.price) ? String(product.price) : "0";

    structuredData.textContent = `
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "${escapeJsonString(product.name)}",
  "description": "${escapeJsonString(product.description)}",
  "category": "${escapeJsonString(product.categoria)}",
  "image": ["${escapeJsonString(imageAbsoluteUrl)}"],
  "brand": {
    "@type": "Brand",
    "name": "JoyasMunoz"
  },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "CLP",
    "price": "${priceValue}",
    "availability": "https://schema.org/InStock",
    "url": "${escapeJsonString(url.toString())}"
  }
}`.trim();
  }
}

function renderProduct(product) {
  const container = document.querySelector("#productDetail");
  if (!container) return;

  if (!product) {
    container.innerHTML = `
      <article class="category-empty" data-reveal>
        <h2>Producto no encontrado</h2>
        <p>El enlace puede estar incompleto o el producto ya no esta disponible.</p>
        <a class="btn btn-primary" href="index.html#coleccion">Volver a la coleccion</a>
      </article>
    `;
    return;
  }

  const images = getProductImages(product);

  const slides = images
    .map(
      (image, index) => `
      <div class="detail-slide" aria-hidden="${index === 0 ? "false" : "true"}">
        <img
          src="${image}"
          alt="Vista ${index + 1} de ${product.name}"
          loading="${index === 0 ? "eager" : "lazy"}"
          decoding="async"
          fetchpriority="${index === 0 ? "high" : "low"}"
        />
      </div>
    `
    )
    .join("");

  const dots = images
    .map(
      (_, index) => `
      <button
        class="detail-dot ${index === 0 ? "active" : ""}"
        type="button"
        data-index="${index}"
        aria-label="Ir a imagen ${index + 1}"
      ></button>
    `
    )
    .join("");

  const showControls = images.length > 1;

  container.innerHTML = `
    <article class="product-detail-card" data-reveal>
      <section class="detail-gallery">
        <div class="detail-carousel" aria-label="Galeria del producto">
          <div class="detail-track" id="detailTrack">${slides}</div>
          ${
            showControls
              ? `<button class="carousel-control prev" id="carouselPrev" type="button" aria-label="Imagen anterior">&#10094;</button>
                 <button class="carousel-control next" id="carouselNext" type="button" aria-label="Imagen siguiente">&#10095;</button>`
              : ""
          }
        </div>
        ${showControls ? `<div class="detail-dots" id="detailDots">${dots}</div>` : ""}
      </section>
      <section class="detail-info">
        <p class="product-category">${product.categoria ?? "Sin categoria"}</p>
        <h1>${product.name}</h1>
        <p class="detail-price">${formatPrice(product.price)}</p>
        <p class="detail-description">${product.description ?? ""}</p>
        <div class="detail-actions">
          <a class="btn btn-primary" href="${buildWhatsAppLink(product)}" target="_blank" rel="noopener noreferrer">
            Consultar por WhatsApp
          </a>
        </div>
      </section>
    </article>
  `;

  if (!showControls) return;

  const track = document.querySelector("#detailTrack");
  const prevButton = document.querySelector("#carouselPrev");
  const nextButton = document.querySelector("#carouselNext");
  const dotButtons = document.querySelectorAll(".detail-dot");
  const carousel = document.querySelector(".detail-carousel");
  let currentIndex = 0;

  const goToSlide = (index) => {
    if (!track) return;

    const total = images.length;
    currentIndex = (index + total) % total;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    dotButtons.forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === currentIndex);
    });
  };

  prevButton?.addEventListener("click", () => goToSlide(currentIndex - 1));
  nextButton?.addEventListener("click", () => goToSlide(currentIndex + 1));

  dotButtons.forEach((button, index) => {
    button.addEventListener("click", () => goToSlide(index));
  });

  let touchStartX = 0;
  let touchEndX = 0;

  const minSwipeDistance = 40;

  carousel?.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.changedTouches[0]?.clientX ?? 0;
    },
    { passive: true }
  );

  carousel?.addEventListener(
    "touchend",
    (event) => {
      touchEndX = event.changedTouches[0]?.clientX ?? 0;
      const distance = touchStartX - touchEndX;

      if (Math.abs(distance) < minSwipeDistance) return;

      if (distance > 0) {
        goToSlide(currentIndex + 1);
      } else {
        goToSlide(currentIndex - 1);
      }
    },
    { passive: true }
  );
}

function setupNavbar() {
  const navbar = document.querySelector("#navbar");
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle("scrolled", window.scrollY > 24);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function setupMobileMenu() {
  const menuToggle = document.querySelector("#menuToggle");
  const navMenu = document.querySelector("#navMenu");

  if (!menuToggle || !navMenu) return;

  menuToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Cerrar menu" : "Abrir menu");
    document.body.style.overflow = isOpen ? "hidden" : "";
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Abrir menu");
      document.body.style.overflow = "";
    });
  });
}

function setupCategoryDropdown() {
  const dropdown = document.querySelector("#categoryDropdown");
  const toggle = document.querySelector("#categoryToggle");

  if (!dropdown || !toggle) return;

  const closeDropdown = () => {
    dropdown.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const isOpen = dropdown.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    if (!dropdown.contains(event.target)) closeDropdown();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDropdown();
  });
}

function setupRevealAnimations() {
  const revealElements = document.querySelectorAll("[data-reveal]");
  if (!revealElements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -30px 0px",
    }
  );

  revealElements.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index * 30, 260)}ms`;
    observer.observe(element);
  });
}

function setupYear() {
  const yearElement = document.querySelector("#year");
  if (yearElement) yearElement.textContent = String(new Date().getFullYear());
}

document.addEventListener("DOMContentLoaded", async () => {
  setupNavbar();
  setupMobileMenu();
  setupCategoryDropdown();
  setupYear();

  try {
    const catalog = await loadCatalog();
    const productId = new URLSearchParams(window.location.search).get("id") ?? "";
    const product = findProductById(catalog, productId);
    updateProductSeo(product);
    renderProduct(product);
  } catch (error) {
    console.error(error);
    updateProductSeo(null);
    renderProduct(null);
  }

  setupRevealAnimations();
});

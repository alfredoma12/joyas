const whatsappBase = "https://wa.me/56949543511";
const catalogCacheKey = "joyasmunoz_catalog_v1";

async function loadCatalog() {
  const cachedCatalog = sessionStorage.getItem(catalogCacheKey);
  if (cachedCatalog) {
    try {
      const parsedCatalog = JSON.parse(cachedCatalog);
      if (Array.isArray(parsedCatalog)) return parsedCatalog;
    } catch {
      sessionStorage.removeItem(catalogCacheKey);
    }
  }

  const response = await fetch("./products.json", { cache: "force-cache" });
  if (!response.ok) throw new Error(`No se pudo cargar products.json (${response.status})`);

  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("El archivo products.json debe contener un arreglo.");

  sessionStorage.setItem(catalogCacheKey, JSON.stringify(data));

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

function buildProductDetailsLink(product) {
  return `product.html?id=${encodeURIComponent(product?.id ?? "")}`;
}

function renderCategory(catalog) {
  const category = new URLSearchParams(window.location.search).get("categoria") ?? "";
  const titleElement = document.querySelector("#categoryTitle");
  const countElement = document.querySelector("#categoryCount");
  const grid = document.querySelector("#categoryGrid");

  if (!titleElement || !countElement || !grid) return;

  const filteredCatalog = catalog.filter((item) => item.categoria === category);

  titleElement.textContent = category || "Categoria";
  countElement.textContent = `${filteredCatalog.length} producto(s) encontrados`;

  if (!filteredCatalog.length) {
    grid.innerHTML = `
      <article class="category-empty" data-reveal>
        <h2>No encontramos productos en esta categoria</h2>
        <p>Puedes explorar otras categorias desde el menu superior.</p>
        <a class="btn btn-primary" href="index.html#coleccion">Volver a la coleccion</a>
      </article>
    `;
    return;
  }

  grid.innerHTML = filteredCatalog
    .map(
      (item) => `
      <article class="product-card" data-reveal>
        <figure class="product-media">
          <img src="${item.image}" alt="${item.name}" loading="lazy" decoding="async" fetchpriority="low" />
        </figure>
        <div class="product-content">
          <p class="product-category">${item.categoria ?? "Sin categoria"}</p>
          <h3>${item.name}</h3>
          <p class="product-description">${item.description}</p>
          <p class="product-price">${formatPrice(item.price)}</p>
          <div class="product-actions">
            <a class="btn" href="${buildProductDetailsLink(item)}">Ver detalle</a>
            <a class="btn" href="${buildWhatsAppLink(item)}" target="_blank" rel="noopener noreferrer">
              Consultar disponibilidad
            </a>
          </div>
        </div>
      </article>
    `
    )
    .join("");
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
    renderCategory(catalog);
  } catch (error) {
    console.error(error);
  }

  setupRevealAnimations();
});

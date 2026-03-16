const whatsappBase = "https://wa.me/56949543511";

async function loadCatalog() {
  const response = await fetch("./products.json", { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`No se pudo cargar products.json (${response.status})`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("El archivo products.json debe contener un arreglo de productos.");
  }

  return data;
}

function buildWhatsAppLink(productName) {
  const message = `Hola, quiero consultar la disponibilidad de esta joya: ${productName}`;
  return `${whatsappBase}?text=${encodeURIComponent(message)}`;
}

function buildTagClass(tag) {
  if (tag.toLowerCase().includes("exclusiva")) return "tag exclusive";
  if (tag.toLowerCase().includes("stock")) return "tag limited";
  return "tag";
}

function renderTags(tags = []) {
  if (!tags.length) return "";

  const items = tags
    .map((tag) => `<span class="${buildTagClass(tag)}">${tag}</span>`)
    .join("");

  return `<div class="tags">${items}</div>`;
}

function renderFeatured(catalog) {
  const container = document.querySelector("#featuredGrid");
  if (!container) return;

  const featuredItems = catalog.filter((item) => item.featured).slice(0, 4);

  container.innerHTML = featuredItems
    .map(
      (item) => `
      <article class="featured-card" data-reveal>
        <img src="${item.image}" alt="${item.name}" loading="lazy" />
        <div class="featured-content">
          <h3>${item.name}</h3>
          <p>${item.description}</p>
          <a
            class="btn btn-primary"
            href="${buildWhatsAppLink(item.name)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Consultar disponibilidad
          </a>
        </div>
      </article>
    `
    )
    .join("");
}

function renderConsulted(catalog) {
  const container = document.querySelector("#consultedGrid");
  if (!container) return;

  const consultedItems = catalog.filter((item) => item.consulted).slice(0, 3);

  container.innerHTML = consultedItems
    .map(
      (item) => `
      <article class="consulted-card" data-reveal>
        <figure class="consulted-image">
          <img src="${item.image}" alt="${item.name}" loading="lazy" />
        </figure>
        <div class="consulted-content">
          <h3>${item.name}</h3>
          <p>${item.description}</p>
          ${renderTags(item.tags)}
          <a
            class="btn"
            href="${buildWhatsAppLink(item.name)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Consultar disponibilidad
          </a>
        </div>
      </article>
    `
    )
    .join("");
}

function renderCollection(catalog) {
  const container = document.querySelector("#productGrid");
  if (!container) return;

  container.innerHTML = catalog
    .map(
      (item) => `
      <article class="product-card" data-reveal>
        <figure class="product-media">
          <img src="${item.image}" alt="${item.name}" loading="lazy" />
        </figure>
        <div class="product-content">
          <h3>${item.name}</h3>
          <p>${item.description}</p>
          ${renderTags(item.tags)}
          <div class="product-actions">
            <a
              class="btn"
              href="${buildWhatsAppLink(item.name)}"
              target="_blank"
              rel="noopener noreferrer"
            >
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
  const mobileBreakpoint = 980;

  if (!menuToggle || !navMenu) return;

  menuToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > mobileBreakpoint) {
      navMenu.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
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
  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }
}

function renderCatalogError() {
  const message =
    "No fue posible cargar los productos. Verifica products.json y abre el sitio desde un servidor local.";

  ["#featuredGrid", "#consultedGrid", "#productGrid"].forEach((selector) => {
    const container = document.querySelector(selector);
    if (container) {
      container.innerHTML = `<p>${message}</p>`;
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  setupNavbar();
  setupMobileMenu();
  setupYear();

  try {
    const catalog = await loadCatalog();
    renderFeatured(catalog);
    renderConsulted(catalog);
    renderCollection(catalog);
    setupRevealAnimations();
  } catch (error) {
    console.error(error);
    renderCatalogError();
  }
});

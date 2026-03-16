const catalog = [
  {
    id: "aurora",
    name: "Anillo Aurora",
    description: "Oro blanco 18k con diamante central de talla brillante.",
    image:
      "https://images.unsplash.com/photo-1603974372039-adc49044b6bd?auto=format&fit=crop&w=1100&q=80",
    featured: true,
    consulted: true,
    tags: ["Pieza exclusiva", "Stock limitado"],
  },
  {
    id: "souverain",
    name: "Collar Souverain",
    description: "Cadena en oro amarillo con colgante de zafiro azul intenso.",
    image:
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1100&q=80",
    featured: true,
    consulted: true,
    tags: ["Pieza exclusiva"],
  },
  {
    id: "lumiere",
    name: "Pendientes Lumiere",
    description: "Diamantes en montura invisible para un brillo continuo.",
    image:
      "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1100&q=80",
    featured: false,
    consulted: true,
    tags: ["Stock limitado"],
  },
  {
    id: "imperiale",
    name: "Pulsera Imperiale",
    description: "Diseno articulado en oro rosa y pavimento de diamantes.",
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1100&q=80",
    featured: true,
    consulted: false,
    tags: ["Pieza exclusiva"],
  },
  {
    id: "eternelle",
    name: "Anillo Eternelle",
    description: "Aro de platino con halo de diamantes seleccionados a mano.",
    image:
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1100&q=80",
    featured: false,
    consulted: false,
    tags: ["Pieza exclusiva", "Stock limitado"],
  },
  {
    id: "royale",
    name: "Collar Royale",
    description: "Diamantes y esmeraldas en composicion de alta joyeria.",
    image:
      "https://images.unsplash.com/photo-1620656798579-1984d7f3b98f?auto=format&fit=crop&w=1100&q=80",
    featured: true,
    consulted: false,
    tags: ["Pieza exclusiva"],
  },
  {
    id: "celeste",
    name: "Set Celeste",
    description: "Juego de collar y pendientes con diamantes talla pera.",
    image:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1100&q=80",
    featured: false,
    consulted: false,
    tags: ["Stock limitado"],
  },
  {
    id: "valentina",
    name: "Anillo Valentina",
    description: "Montura de oro rosa con diamante oval y micro pavimento.",
    image:
      "https://images.unsplash.com/photo-1615655114868-3ad2f8f6b0f8?auto=format&fit=crop&w=1100&q=80",
    featured: false,
    consulted: false,
    tags: ["Pieza exclusiva"],
  },
];

const whatsappBase = "https://wa.me/56949543511";

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

function renderFeatured() {
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

function renderConsulted() {
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

function renderCollection() {
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

document.addEventListener("DOMContentLoaded", () => {
  renderFeatured();
  renderConsulted();
  renderCollection();
  setupNavbar();
  setupMobileMenu();
  setupRevealAnimations();
  setupYear();
});

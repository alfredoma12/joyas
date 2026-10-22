/* ==========================================================================
   JoyasMuñoz - utilidades compartidas
   Catálogo, SEO dinámico, navegación, búsqueda y cesta por WhatsApp.
   ========================================================================== */

const SITE = {
  name: "JoyasMuñoz",
  domain: "https://xn--joyasmuoz-r6a.lat",
  displayDomain: "joyasmuñoz.lat",
  whatsappNumber: "56949543511",
  whatsappBase: "https://wa.me/56949543511",
  defaultImage: "assets/optimized/esclava-media-cana-cobre.webp",
};

const CART_STORAGE_KEY = "joyasmunoz_cart";

async function loadCatalog() {
  const response = await fetch("./products.json?v=3", { cache: "no-store" });
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

function getProductImages(product) {
  const images = Array.isArray(product?.images)
    ? product.images.map((image) => String(image ?? "").trim()).filter(Boolean)
    : [];
  return images.length ? images : [String(product?.image || SITE.defaultImage)];
}

function getPrimaryImage(product) {
  return getProductImages(product)[0] || SITE.defaultImage;
}

function buildProductDetailsLink(product) {
  return `product.html?id=${encodeURIComponent(String(product?.id || ""))}`;
}

function findProductById(catalog, productId) {
  const normalizedId = String(productId || "").trim().toLowerCase();
  return catalog.find((item) => String(item.id || "").toLowerCase() === normalizedId);
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function absoluteUrl(path = "") {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE.domain}/${String(path).replace(/^\/+/, "")}`;
}

function setMeta(selector, value, attr = "content") {
  const element = document.querySelector(selector);
  if (element && value) element.setAttribute(attr, value);
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function createJsonLd(data) {
  return JSON.stringify(data, null, 2);
}

function buildProductBadges(product) {
  const labels = { novedad: "Novedad", oferta: "Oferta" };
  const tags = Array.isArray(product?.tags) ? product.tags : [];
  const tagBadges = tags
    .map((tag) => `<span class="badge badge-${tag}">${labels[tag] || tag}</span>`)
    .join("");
  const stockBadge = product?.stock === false ? '<span class="badge badge-outline">Agotado</span>' : "";
  return `${tagBadges}${stockBadge}`;
}

function stockLabel(product) {
  return product?.stock === false ? "Consultar reposición" : "Disponible para consulta";
}

function renderProductCard(product) {
  const badges = buildProductBadges(product);
  return `
    <article class="product-card" data-reveal data-category="${product.categoria}" data-name="${product.name}">
      <a class="product-media" href="${buildProductDetailsLink(product)}" aria-label="Ver detalle de ${product.name}">
        ${badges ? `<div class="product-badges">${badges}</div>` : ""}
        <img src="${getPrimaryImage(product)}" alt="${product.name} en ${product.material}" loading="lazy" decoding="async" width="480" height="600" />
      </a>
      <div class="product-content">
        <p class="product-category">${product.categoria}</p>
        <h3>${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <dl class="product-meta">
          <div><dt>Material</dt><dd>${product.material}</dd></div>
          <div><dt>Stock</dt><dd>${stockLabel(product)}</dd></div>
        </dl>
        <p class="product-price">${formatPrice(product.price)}</p>
        <div class="product-actions">
          <a class="btn btn-ghost" href="${buildProductDetailsLink(product)}">Ver detalle</a>
          <button type="button" class="btn btn-primary btn-add-cart" data-add-to-cart="${product.id}">
            Agregar a la cesta
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderBreadcrumbs(items, targetSelector = "#breadcrumbs") {
  const target = document.querySelector(targetSelector);
  if (!target) return;
  target.innerHTML = `
    <ol>
      ${items
        .map((item, index) => {
          const isLast = index === items.length - 1;
          return `<li>${isLast ? `<span>${item.name}</span>` : `<a href="${item.url}">${item.name}</a>`}</li>`;
        })
        .join("")}
    </ol>
  `;
}

const Cart = {
  read() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("No se pudo leer la cesta", error);
      return [];
    }
  },
  write(items) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent("cart:updated"));
  },
  add(product, quantity = 1) {
    const items = this.read();
    const existing = items.find((item) => item.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: getPrimaryImage(product),
        material: product.material,
        quantity,
      });
    }
    this.write(items);
  },
  setQuantity(id, quantity) {
    const items = this.read();
    if (quantity <= 0) {
      this.write(items.filter((item) => item.id !== id));
      return;
    }
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    item.quantity = quantity;
    this.write(items);
  },
  remove(id) {
    this.write(this.read().filter((item) => item.id !== id));
  },
  totalItems() {
    return this.read().reduce((sum, item) => sum + item.quantity, 0);
  },
  totalPrice() {
    return this.read().reduce((sum, item) => sum + item.quantity * (item.price || 0), 0);
  },
  buildWhatsAppMessage() {
    const lines = this.read().map((item) => `* ${item.name} (Cantidad: ${item.quantity})`);
    return [
      "Hola, me gustaría consultar la disponibilidad de las siguientes joyas:",
      "",
      ...lines,
      "",
      "¿Podrían indicarme si están disponibles?",
      "",
      "Muchas gracias.",
    ].join("\n");
  },
  buildWhatsAppLink() {
    return `${SITE.whatsappBase}?text=${encodeURIComponent(this.buildWhatsAppMessage())}`;
  },
};

function setupCartDrawer() {
  const drawer = document.querySelector("#cartDrawer");
  const openButtons = document.querySelectorAll("#cartToggle, #cartToggleMobile");
  const closeButton = document.querySelector("#cartClose");
  const overlay = document.querySelector("#cartOverlay");
  const list = document.querySelector("#cartItems");
  const checkout = document.querySelector("#cartCheckout");
  if (!drawer || !openButtons.length || !list) return;

  const render = () => {
    const items = Cart.read();
    document.querySelectorAll("#cartCount, #cartCountMobile").forEach((badge) => {
      badge.textContent = String(Cart.totalItems());
      badge.classList.toggle("is-visible", Cart.totalItems() > 0);
    });
    const empty = document.querySelector("#cartEmpty");
    if (empty) empty.hidden = items.length > 0;
    if (checkout) checkout.disabled = items.length === 0;
    setText("#cartTotal", formatPrice(Cart.totalPrice()));

    list.innerHTML = items
      .map(
        (item) => `
        <li class="cart-item" data-id="${item.id}">
          <img src="${item.image}" alt="${item.name}" loading="lazy" width="72" height="72" />
          <div class="cart-item-info">
            <p class="cart-item-name">${item.name}</p>
            <p class="cart-item-meta">${item.material || ""} · ${formatPrice(item.price)}</p>
            <div class="cart-item-qty" aria-label="Cantidad de ${item.name}">
              <button type="button" data-action="decrease" aria-label="Disminuir cantidad">−</button>
              <span>${item.quantity}</span>
              <button type="button" data-action="increase" aria-label="Aumentar cantidad">+</button>
            </div>
          </div>
          <button type="button" class="cart-item-remove" data-action="remove" aria-label="Eliminar ${item.name}">×</button>
        </li>`
      )
      .join("");
  };

  const open = () => {
    render();
    drawer.classList.add("open");
    overlay?.classList.add("open");
    openButtons.forEach((button) => button.setAttribute("aria-expanded", "true"));
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeButton?.focus();
  };

  const close = () => {
    drawer.classList.remove("open");
    overlay?.classList.remove("open");
    openButtons.forEach((button) => button.setAttribute("aria-expanded", "false"));
    drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  openButtons.forEach((button) => button.addEventListener("click", open));
  closeButton?.addEventListener("click", close);
  overlay?.addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawer.classList.contains("open")) close();
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    const itemNode = event.target.closest("[data-id]");
    if (!button || !itemNode) return;
    const item = Cart.read().find((entry) => entry.id === itemNode.dataset.id);
    if (!item) return;
    if (button.dataset.action === "increase") Cart.setQuantity(item.id, item.quantity + 1);
    if (button.dataset.action === "decrease") Cart.setQuantity(item.id, item.quantity - 1);
    if (button.dataset.action === "remove") Cart.remove(item.id);
  });

  checkout?.addEventListener("click", () => {
    if (!Cart.totalItems()) return;
    window.open(Cart.buildWhatsAppLink(), "_blank", "noopener,noreferrer");
  });

  document.addEventListener("cart:updated", render);
  render();
}

function setupAddToCartButtons(getCatalog) {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add-to-cart]");
    if (!button) return;
    const product = findProductById(getCatalog(), button.dataset.addToCart);
    if (!product) return;
    Cart.add(product);
    const originalText = button.dataset.originalText || button.textContent.trim();
    button.dataset.originalText = originalText;
    button.textContent = "Agregado ✓";
    button.classList.add("added");
    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove("added");
    }, 1300);
  });
}

function setupNavbar() {
  const navbar = document.querySelector("#navbar");
  const onScroll = () => navbar?.classList.toggle("scrolled", window.scrollY > 18);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function setupMobileMenu() {
  const button = document.querySelector("#menuToggle");
  const nav = document.querySelector("#navMenu");
  if (!button || !nav) return;

  const close = () => {
    nav.classList.remove("open");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Abrir menú");
    document.body.style.overflow = "";
  };

  button.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
    button.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    document.body.style.overflow = isOpen ? "hidden" : "";
  });
  nav.querySelectorAll("a, button:not(#categoryToggle)").forEach((item) => item.addEventListener("click", close));
  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) close();
  });
}

function setupCategoryDropdown() {
  const dropdown = document.querySelector("#categoryDropdown");
  const toggle = document.querySelector("#categoryToggle");
  if (!dropdown || !toggle) return;

  const close = () => {
    dropdown.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  };
  toggle.addEventListener("click", () => {
    const isOpen = dropdown.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
  toggle.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      dropdown.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
      dropdown.querySelector("a")?.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!dropdown.contains(event.target)) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
}

function setupRevealAnimations() {
  const elements = document.querySelectorAll("[data-reveal]");
  if (!elements.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -24px 0px" }
  );
  elements.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index * 24, 180)}ms`;
    observer.observe(element);
  });
}

function setupYear() {
  const year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());
}

function setupCommonUI() {
  setupNavbar();
  setupMobileMenu();
  setupCategoryDropdown();
  setupYear();
  setupCartDrawer();
}

/* ===== Root + Cellar — storefront prototype (vanilla JS) ===== */
(function () {
  "use strict";

  const peso = (n) => "₱" + n.toLocaleString("en-PH");

  /* ---- Inline SVG placeholders (varied, on-brand) ---- */
  const art = {
    jar: (bg, fill) => `<svg viewBox="0 0 100 120" role="img" aria-label="Product jar"><rect x="30" y="12" width="40" height="9" rx="4" fill="${fill}"/><rect x="24" y="22" width="52" height="86" rx="16" fill="#fff"/><rect x="24" y="60" width="52" height="48" rx="16" fill="${bg}"/><circle cx="50" cy="82" r="11" fill="${fill}" opacity=".8"/></svg>`,
    bag: (bg, fill) => `<svg viewBox="0 0 100 120" role="img" aria-label="Product bag"><path d="M26 30h48l-5 78H31z" fill="${bg}"/><rect x="38" y="44" width="24" height="16" rx="3" fill="#fff"/><ellipse cx="45" cy="82" rx="6" ry="9" fill="${fill}"/><ellipse cx="58" cy="88" rx="6" ry="9" fill="${fill}" opacity=".7"/></svg>`,
    leaf: (bg, fill) => `<svg viewBox="0 0 100 120" role="img" aria-label="Fresh greens"><path d="M50 104C32 86 20 66 28 40c14 6 28 22 28 46" fill="${bg}"/><path d="M50 104c18-18 30-38 22-64-14 6-28 22-28 46" fill="${fill}"/><path d="M50 58v46" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>`,
    bottle: (bg, fill) => `<svg viewBox="0 0 100 120" role="img" aria-label="Product bottle"><rect x="44" y="10" width="12" height="18" fill="${fill}"/><path d="M40 30h20c0 8 8 10 8 24v46a8 8 0 0 1-8 8H40a8 8 0 0 1-8-8V54c0-14 8-16 8-24z" fill="${bg}"/><rect x="38" y="60" width="24" height="24" rx="4" fill="#fff"/></svg>`,
    box: (bg, fill) => `<svg viewBox="0 0 100 120" role="img" aria-label="Curated box"><path d="M22 44l28-14 28 14-28 12z" fill="${fill}"/><path d="M22 44v42l28 12V56z" fill="${bg}"/><path d="M78 44v42l-28 12V56z" fill="${bg}" opacity=".82"/></svg>`,
  };

  /* ---- Real photography (Unsplash CDN) — inline SVG art remains the fallback ---- */
  const photo = (id, w = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`;

  const products = [
    { name: "Calamansi & Chili Honey", desc: "Slow-infused wild honey with a citrus kick.", size: "250 ml", price: 320, rating: "4.9", n: 214, badge: "Bestseller", art: art.jar("#F4B740", "#D6462F"), photo: photo("photo-1587049352846-4a222e784d38"), alt: "Glass jar of golden wild honey with a honey dipper" },
    { name: "Kalinga Single-Origin", desc: "Bright, cocoa-forward highland beans.", size: "340 g", price: 480, rating: "4.8", n: 168, badge: "", art: art.bag("#1E3A2B", "#F4B740"), photo: photo("photo-1447933601403-0c6688de566e"), alt: "Freshly roasted single-origin coffee beans" },
    { name: "Heirloom Tomato Sugo", desc: "Sun-ripened tomatoes, garlic & basil.", size: "500 ml", price: 285, rating: "4.7", n: 96, badge: "New", art: art.jar("#D6462F", "#F4B740"), photo: photo("photo-1506976785307-8732e854ad03"), alt: "Ripe red heirloom tomatoes on the vine" },
    { name: "First-Press Coconut Oil", desc: "Cold-pressed, unrefined, small batch.", size: "500 ml", price: 260, rating: "4.9", n: 302, badge: "", art: art.bottle("#f3e4c4", "#1E3A2B"), photo: photo("photo-1474979266404-7eaacbcd87c5"), alt: "Bottle of cold-pressed oil on a rustic table" },
    { name: "Highland Salad Greens", desc: "Cut this morning in Benguet.", size: "300 g", price: 180, rating: "4.6", n: 74, badge: "Fresh", art: art.leaf("#2f5a41", "#1E3A2B"), photo: photo("photo-1512621776951-a57141f2eefd"), alt: "Fresh green vegetables and salad leaves in a bowl" },
    { name: "Smoked Sea Salt", desc: "Kiln-smoked over mango wood.", size: "120 g", price: 150, rating: "4.8", n: 121, badge: "", art: art.jar("#6E6A5E", "#F4B740"), photo: photo("photo-1509440159596-0249088772ff"), alt: "Rustic artisan pantry loaves dusted with flour" },
    { name: "Barako Cold-Brew Blend", desc: "Bold Batangas beans for iced brews.", size: "340 g", price: 420, rating: "4.7", n: 88, badge: "", art: art.bag("#24211B", "#D6462F"), photo: photo("photo-1447933601403-0c6688de566e"), alt: "Dark roasted Barako coffee beans" },
    { name: "Sunday Harvest Box", desc: "A rotating pick of the week's best.", size: "6–8 items", price: 990, rating: "5.0", n: 340, badge: "Curated", art: art.box("#1E3A2B", "#F4B740"), photo: photo("photo-1498837167922-ddd27525d352"), alt: "Plated dish of fresh seasonal food" },
  ];

  const starsHtml = (r, n) => {
    const full = Math.round(parseFloat(r));
    return `<div class="stars" aria-label="${r} out of 5 stars">${"★".repeat(full)}${"☆".repeat(5 - full)}<span>${r} (${n})</span></div>`;
  };

  /* ---- Render products ---- */
  const grid = document.getElementById("prodGrid");
  products.forEach((p) => {
    const bgTones = ["#FBF6EC", "#f3e4c4", "#fdf1d6", "#eef3ec"];
    const card = document.createElement("article");
    card.className = "prod-card reveal";
    card.innerHTML = `
      <div class="prod-card__media" style="background:${bgTones[Math.floor(Math.random() * bgTones.length)]}">
        ${p.badge ? `<span class="prod-card__badge">${p.badge}</span>` : ""}
        ${p.art}
        <img class="prod-card__photo" src="${p.photo}" alt="${p.alt}" loading="lazy" onerror="this.style.display='none'">
      </div>
      <div class="prod-card__body">
        <h3 class="prod-card__name">${p.name}</h3>
        <p class="prod-card__desc">${p.desc}</p>
        <div class="prod-card__meta">
          <span class="prod-card__size">${p.size}</span>
          ${starsHtml(p.rating, p.n)}
        </div>
        <div class="prod-card__foot">
          <span class="prod-card__price">${peso(p.price)}</span>
          <button class="add-btn" aria-label="Add ${p.name} to cart">Add to cart</button>
        </div>
      </div>`;
    card.querySelector(".add-btn").addEventListener("click", () => addToCart(p));
    grid.appendChild(card);
  });

  /* ---- Cart state ---- */
  const cart = [
    { name: "Calamansi & Chili Honey", size: "250 ml", price: 320, qty: 1, art: art.jar("#F4B740", "#D6462F") },
    { name: "Kalinga Single-Origin", size: "340 g", price: 480, qty: 1, art: art.bag("#1E3A2B", "#F4B740") },
  ];

  const cartCountEl = document.getElementById("cartCount");
  const drawerBody = document.getElementById("drawerBody");
  const subtotalEl = document.getElementById("drawerSubtotal");

  function totalQty() { return cart.reduce((s, i) => s + i.qty, 0); }
  function subtotal() { return cart.reduce((s, i) => s + i.qty * i.price, 0); }

  function renderCount() {
    cartCountEl.textContent = totalQty();
    cartCountEl.classList.remove("bump");
    void cartCountEl.offsetWidth;
    cartCountEl.classList.add("bump");
  }

  function renderCart() {
    if (!cart.length) {
      drawerBody.innerHTML = `<p class="drawer__empty">Your basket is empty.<br>Go fill it with something good.</p>`;
    } else {
      drawerBody.innerHTML = cart.map((i, idx) => `
        <div class="line">
          <div class="line__thumb" style="background:var(--cream)">${i.art}</div>
          <div class="line__info">
            <div class="line__name">${i.name}</div>
            <div class="line__meta">${i.size}</div>
            <div class="line__row">
              <div class="stepper" role="group" aria-label="Quantity for ${i.name}">
                <button data-act="dec" data-i="${idx}" aria-label="Decrease quantity">−</button>
                <span>${i.qty}</span>
                <button data-act="inc" data-i="${idx}" aria-label="Increase quantity">+</button>
              </div>
              <span class="line__price">${peso(i.qty * i.price)}</span>
            </div>
          </div>
        </div>`).join("");
    }
    subtotalEl.textContent = peso(subtotal());
  }

  drawerBody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const i = +btn.dataset.i;
    if (btn.dataset.act === "inc") cart[i].qty++;
    else { cart[i].qty--; if (cart[i].qty <= 0) cart.splice(i, 1); }
    renderCart();
    renderCount();
  });

  function addToCart(p) {
    const existing = cart.find((i) => i.name === p.name);
    if (existing) existing.qty++;
    else cart.push({ name: p.name, size: p.size, price: p.price, qty: 1, art: p.art });
    renderCart();
    renderCount();
    showToast(`Added ${p.name}`);
  }

  /* ---- Drawer open/close ---- */
  const drawer = document.getElementById("drawer");
  const overlay = document.getElementById("overlay");
  let lastFocused = null;

  function openDrawer() {
    lastFocused = document.activeElement;
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("show"));
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    document.getElementById("drawerClose").focus();
    document.addEventListener("keydown", escClose);
  }
  function closeDrawer() {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    overlay.classList.remove("show");
    setTimeout(() => { overlay.hidden = true; }, 300);
    document.body.style.overflow = "";
    document.removeEventListener("keydown", escClose);
    if (lastFocused) lastFocused.focus();
  }
  function escClose(e) { if (e.key === "Escape") closeDrawer(); }

  document.getElementById("cartBtn").addEventListener("click", openDrawer);
  document.getElementById("drawerClose").addEventListener("click", closeDrawer);
  document.getElementById("keepShopping").addEventListener("click", closeDrawer);
  overlay.addEventListener("click", closeDrawer);

  /* ---- Toast ---- */
  const toast = document.getElementById("toast");
  let toastTimer;
  function showToast(msg) {
    toast.innerHTML = `<span class="toast__dot"></span>${msg}`;
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => { toast.hidden = true; }, 300);
    }, 2200);
  }

  /* ---- Build a box ---- */
  const boxItems = document.getElementById("boxItems");
  const boxCount = document.getElementById("boxCount");
  const boxTotal = document.getElementById("boxTotal");

  function updateBox() {
    const selected = [...boxItems.querySelectorAll('[aria-pressed="true"]')];
    const total = selected.reduce((s, b) => s + (+b.dataset.price), 0);
    boxCount.textContent = `${selected.length} item${selected.length === 1 ? "" : "s"} selected`;
    boxTotal.textContent = peso(total);
  }
  boxItems.addEventListener("click", (e) => {
    const item = e.target.closest(".box-item");
    if (!item) return;
    item.setAttribute("aria-pressed", item.getAttribute("aria-pressed") === "true" ? "false" : "true");
    updateBox();
  });
  document.getElementById("boxAdd").addEventListener("click", () => {
    const selected = [...boxItems.querySelectorAll('[aria-pressed="true"]')];
    if (!selected.length) { showToast("Pick a few items first"); return; }
    const total = selected.reduce((s, b) => s + (+b.dataset.price), 0);
    cart.push({ name: `Custom box (${selected.length} items)`, size: "Weekly", price: total, qty: 1, art: art.box("#1E3A2B", "#F4B740") });
    selected.forEach((b) => b.setAttribute("aria-pressed", "false"));
    updateBox();
    renderCart();
    renderCount();
    openDrawer();
  });

  /* ---- Mobile menu ---- */
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");
  hamburger.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("open");
    hamburger.setAttribute("aria-expanded", open ? "true" : "false");
    hamburger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  mobileMenu.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      hamburger.setAttribute("aria-expanded", "false");
    })
  );

  /* ---- Scroll reveal ---- */
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reveals = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach((el) => io.observe(el));
  }

  /* ---- Init ---- */
  renderCart();
  cartCountEl.textContent = totalQty();
  updateBox();
})();

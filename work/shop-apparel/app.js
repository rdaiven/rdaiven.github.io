/* ============================================================
   NULL/FORM — storefront interactions (vanilla)
   ============================================================ */
(function () {
  "use strict";

  /* ---------- palette for SVG placeholders ---------- */
  var C = {
    paper: "#FFFFFF", surface: "#F4F4F2", warm: "#DEDAD2",
    ink: "#0B0B0B", grey: "#6B6B6B", hair: "#E4E4E1", blue: "#1F31FF"
  };

  var COLORS = {
    ink: C.ink, blue: C.blue, warm: C.warm, surface: C.surface, grey: C.grey, paper: C.paper
  };

  /* ---------- product photography (Unsplash CDN) ---------- */
  var IMG = "https://images.unsplash.com/";
  var Q800 = "?auto=format&fit=crop&w=800&q=75";

  /* ---------- product catalogue ---------- */
  var products = [
    { id: "p1", name: "Shell Parka 01", cat: "Outerwear", price: 6800, span: 34, bg: "ink",     fg: "paper", tag: "New", garment: "coat",   colors: ["ink","blue","warm"],
      photo: IMG + "photo-1551028719-00167b16eac5" + Q800, photoAlt: "Shell Parka 01 — model wearing a black technical jacket" },
    { id: "p2", name: "Raw Selvedge Jean", cat: "Denim",  price: 3900, span: 24, bg: "surface", fg: "ink",   tag: "",    garment: "pants",  colors: ["ink","blue"],
      photo: IMG + "photo-1542272604-787c3835535d" + Q800, photoAlt: "Raw Selvedge Jean — raw denim jeans detail" },
    { id: "p3", name: "Heavyweight Hoodie", cat: "Knitwear", price: 2900, span: 30, bg: "warm", fg: "ink",   tag: "New", garment: "hoodie", colors: ["warm","ink","grey"],
      photo: IMG + "photo-1556821840-3a63f95609a7" + Q800, photoAlt: "Heavyweight Hoodie — heavyweight pullover hoodie" },
    { id: "p4", name: "Blue Marker Tee", cat: "Knitwear",  price: 1450, span: 22, bg: "blue",   fg: "paper", tag: "Drop",garment: "tee",    colors: ["blue","paper","ink"],
      photo: IMG + "photo-1521572163474-6864f9cf17ab" + Q800, photoAlt: "Blue Marker Tee — white t-shirt on hanger" },
    { id: "p5", name: "Utility Overshirt", cat: "Outerwear", price: 4200, span: 32, bg: "surface", fg: "ink", tag: "",   garment: "shirt",  colors: ["surface","ink","warm"],
      photo: IMG + "photo-1576871337622-98d48d1cf531" + Q800, photoAlt: "Utility Overshirt — model in a layered utility look" },
    { id: "p6", name: "Ribbed Beanie", cat: "Accessories", price: 950,  span: 22, bg: "ink",     fg: "paper", tag: "",    garment: "beanie", colors: ["ink","blue","warm"] },
    { id: "p7", name: "Boxed Knit Crew", cat: "Knitwear",  price: 3200, span: 28, bg: "warm",    fg: "ink",   tag: "",    garment: "hoodie", colors: ["warm","grey","ink"],
      photo: IMG + "photo-1618354691373-d851c5c3a990" + Q800, photoAlt: "Boxed Knit Crew — crew-neck top laid flat in studio" },
    { id: "p8", name: "Cargo Trouser", cat: "Denim",       price: 3600, span: 26, bg: "ink",     fg: "paper", tag: "New", garment: "pants",  colors: ["ink","grey"],
      photo: IMG + "photo-1523381210434-271e8be1f52b" + Q800, photoAlt: "Cargo Trouser — folded garments stacked in studio" }
  ];

  /* ---------- inline SVG garment placeholders ---------- */
  function garmentPath(type) {
    switch (type) {
      case "coat":   return '<path d="M100 40 L70 55 L60 165 L85 165 L90 95 L90 165 L145 165 L145 95 L150 165 L175 165 L165 55 L135 40 L118 52 L100 40Z"/>';
      case "hoodie": return '<path d="M100 42 C85 42 82 60 62 66 L52 120 L78 128 L82 165 L153 165 L158 128 L183 120 L173 66 C153 60 150 42 135 42 C130 60 105 60 100 42Z"/>';
      case "tee":    return '<path d="M100 46 L64 62 L54 104 L78 112 L82 164 L153 164 L157 112 L181 104 L171 62 L135 46 C128 62 107 62 100 46Z"/>';
      case "shirt":  return '<path d="M100 44 L66 60 L58 150 L80 156 L82 166 L153 166 L155 150 L177 150 L169 60 L135 44 L118 54 L100 44Z"/>';
      case "pants":  return '<path d="M76 44 L159 44 L156 90 L150 168 L124 168 L118 96 L112 168 L86 168 L80 90 L76 44Z"/>';
      case "beanie": return '<path d="M64 132 C64 90 96 70 118 70 C140 70 172 90 172 132 L172 150 L64 150 Z M64 150 L172 150 L172 164 L64 164 Z"/>';
      default:       return '<rect x="70" y="50" width="96" height="120"/>';
    }
  }

  function placeholderSVG(p, opts) {
    opts = opts || {};
    var bg = COLORS[p.bg] || C.surface;
    var fg = COLORS[p.fg] || C.ink;
    var stroke = (p.bg === "surface" || p.bg === "warm" || p.bg === "paper") ? C.ink : C.paper;
    var faint = (p.bg === "surface" || p.bg === "warm" || p.bg === "paper") ? "rgba(11,11,11,.10)" : "rgba(255,255,255,.14)";
    var label = opts.hideLabel ? "" :
      '<text x="20" y="30" font-family="Archivo, sans-serif" font-weight="800" font-size="13" letter-spacing="1" fill="' + fg + '">' + p.cat.toUpperCase() + '</text>';
    return '' +
      '<svg viewBox="0 0 236 300" preserveAspectRatio="xMinYMid slice" role="img" aria-label="' + p.name + ' — product placeholder" xmlns="http://www.w3.org/2000/svg">' +
        '<rect width="236" height="300" fill="' + bg + '"/>' +
        '<line x1="20" y1="44" x2="216" y2="44" stroke="' + faint + '" stroke-width="1"/>' +
        '<g transform="translate(18,58) scale(.86)" fill="none" stroke="' + stroke + '" stroke-width="4" stroke-linejoin="round" opacity=".9">' +
          garmentPath(p.garment) +
        '</g>' +
        label +
      '</svg>';
  }

  /* ---------- photo <img> with SVG fallback ---------- */
  function photoImg(p) {
    if (!p.photo) return "";
    return '<img class="pmedia__img" src="' + p.photo + '" alt="' + p.photoAlt + '"' +
      ' loading="lazy"' +
      ' onerror="this.style.display=\'none\';this.parentElement.classList.remove(\'has-photo\')">' +
      '<span class="pmedia__catlab" aria-hidden="true">' + p.cat.toUpperCase() + '</span>';
  }

  /* ---------- render product grid ---------- */
  var grid = document.getElementById("productGrid");
  function swatchDots(colors) {
    return colors.map(function (c) {
      return '<span class="swatch" style="background:' + (COLORS[c] || c) + '" title="' + c + '"></span>';
    }).join("");
  }

  products.forEach(function (p) {
    var card = document.createElement("article");
    card.className = "card reveal";
    card.style.setProperty("--span", p.span);
    var tagHtml = p.tag
      ? '<span class="card__tag ' + (p.tag === "Drop" ? "card__tag--blue" : "") + '">' + p.tag + '</span>'
      : "";
    card.innerHTML =
      '<div class="card__media' + (p.photo ? " has-photo" : "") + '">' +
        tagHtml +
        placeholderSVG(p) +
        photoImg(p) +
        '<button class="card__quick" data-id="' + p.id + '" aria-label="Quick view: ' + p.name + '">Quick view</button>' +
      '</div>' +
      '<div class="card__info">' +
        '<div class="card__row">' +
          '<span class="card__name">' + p.name + '</span>' +
          '<span class="card__price">' + peso(p.price) + '</span>' +
        '</div>' +
        '<span class="card__meta">' + p.cat + '</span>' +
        '<div class="swatches">' + swatchDots(p.colors) + '</div>' +
      '</div>';
    grid.appendChild(card);
  });

  function peso(n) { return "₱" + n.toLocaleString("en-PH"); }

  /* ============================================================
     CART
     ============================================================ */
  var cart = [
    { p: products[0], size: "M", qty: 1 },
    { p: products[3], size: "L", qty: 1 }
  ];

  var overlay   = document.getElementById("overlay");
  var drawer    = document.getElementById("drawer");
  var cartBtn   = document.getElementById("cartBtn");
  var cartCount = document.getElementById("cartCount");
  var drawerCount = document.getElementById("drawerCount");
  var drawerItems = document.getElementById("drawerItems");
  var subtotalEl  = document.getElementById("subtotal");

  function totalQty() { return cart.reduce(function (s, l) { return s + l.qty; }, 0); }
  function subtotal() { return cart.reduce(function (s, l) { return s + l.p.price * l.qty; }, 0); }

  function updateCount() {
    var q = totalQty();
    cartCount.textContent = "(" + q + ")";
    drawerCount.textContent = q;
  }

  function renderCart() {
    drawerItems.innerHTML = cart.map(function (l, i) {
      return '' +
        '<div class="litem">' +
          '<div class="litem__thumb">' + placeholderSVG(l.p, { hideLabel: true }) + '</div>' +
          '<div>' +
            '<div class="litem__name">' + l.p.name + '</div>' +
            '<div class="litem__meta">Size ' + l.size + ' · ' + l.p.cat + '</div>' +
            '<div class="stepper" data-i="' + i + '">' +
              '<button class="dec" aria-label="Decrease quantity">−</button>' +
              '<span>' + l.qty + '</span>' +
              '<button class="inc" aria-label="Increase quantity">+</button>' +
            '</div>' +
          '</div>' +
          '<div class="litem__price">' + peso(l.p.price * l.qty) + '</div>' +
        '</div>';
    }).join("");
    subtotalEl.textContent = peso(subtotal());
    updateCount();
  }

  drawerItems.addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (!btn) return;
    var stepper = e.target.closest(".stepper");
    if (!stepper) return;
    var i = +stepper.getAttribute("data-i");
    if (btn.classList.contains("inc")) cart[i].qty++;
    else if (btn.classList.contains("dec")) {
      cart[i].qty--;
      if (cart[i].qty <= 0) cart.splice(i, 1);
    }
    renderCart();
  });

  /* open / close plumbing shared by drawer + modal */
  var lastFocus = null;
  function showOverlay() { overlay.hidden = false; requestAnimationFrame(function () { overlay.classList.add("show"); }); }
  function maybeHideOverlay() {
    if (!drawer.classList.contains("open") && !modal.classList.contains("open")) {
      overlay.classList.remove("show");
      setTimeout(function () { if (!drawer.classList.contains("open") && !modal.classList.contains("open")) overlay.hidden = true; }, 300);
    }
  }

  function openDrawer() {
    lastFocus = document.activeElement;
    renderCart();
    showOverlay();
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    document.getElementById("drawerClose").focus();
  }
  function closeDrawer() {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    maybeHideOverlay();
    if (!modal.classList.contains("open")) document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  cartBtn.addEventListener("click", openDrawer);
  document.getElementById("drawerClose").addEventListener("click", closeDrawer);
  document.getElementById("drawerCont").addEventListener("click", closeDrawer);

  /* ============================================================
     QUICK VIEW MODAL
     ============================================================ */
  var modal = document.getElementById("modal");
  var modalOverlay = document.getElementById("modalOverlay");
  var currentProduct = null;

  function openModal(p) {
    currentProduct = p;
    lastFocus = document.activeElement;
    var modalMedia = document.getElementById("modalMedia");
    modalMedia.classList.toggle("has-photo", !!p.photo);
    modalMedia.innerHTML = placeholderSVG(p) + photoImg(p);
    document.getElementById("modalCat").textContent = p.cat;
    document.getElementById("modalName").textContent = p.name;
    document.getElementById("modalPrice").textContent = peso(p.price);
    document.getElementById("modalSwatches").innerHTML = p.colors.map(function (c, i) {
      return '<button class="swatch' + (i === 0 ? " on" : "") + '" style="background:' + (COLORS[c] || c) + '" aria-label="Colour ' + c + '"></button>';
    }).join("");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    document.getElementById("modalClose").focus();
  }
  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    if (!drawer.classList.contains("open")) { maybeHideOverlay(); document.body.style.overflow = ""; }
    if (lastFocus) lastFocus.focus();
  }

  grid.addEventListener("click", function (e) {
    var q = e.target.closest(".card__quick");
    if (!q) return;
    var p = products.find(function (x) { return x.id === q.getAttribute("data-id"); });
    if (p) openModal(p);
  });

  document.getElementById("modalClose").addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", closeModal);

  /* size chips (single select) */
  document.getElementById("sizeChips").addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;
    this.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("chip--on"); });
    chip.classList.add("chip--on");
  });
  /* modal swatch select */
  document.getElementById("modalSwatches").addEventListener("click", function (e) {
    var s = e.target.closest(".swatch");
    if (!s) return;
    this.querySelectorAll(".swatch").forEach(function (c) { c.classList.remove("on"); });
    s.classList.add("on");
  });

  /* add to cart from modal */
  document.getElementById("modalAdd").addEventListener("click", function () {
    if (!currentProduct) return;
    var size = document.querySelector("#sizeChips .chip--on");
    size = size ? size.textContent : "M";
    var existing = cart.find(function (l) { return l.p.id === currentProduct.id && l.size === size; });
    if (existing) existing.qty++;
    else cart.push({ p: currentProduct, size: size, qty: 1 });
    updateCount();
    // feedback: quick pulse on the button
    this.textContent = "Added ✓";
    var self = this;
    setTimeout(function () { self.textContent = "Add to cart"; }, 1200);
    closeModal();
    openDrawer();
  });

  /* overlay click closes drawer */
  overlay.addEventListener("click", function () {
    if (drawer.classList.contains("open")) closeDrawer();
  });

  /* Esc closes whatever is open */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (modal.classList.contains("open")) closeModal();
    else if (drawer.classList.contains("open")) closeDrawer();
    else if (mobileMenu.classList.contains("open")) closeMenu();
  });

  /* ============================================================
     MOBILE MENU
     ============================================================ */
  var burger = document.getElementById("burger");
  var mobileMenu = document.getElementById("mobileMenu");
  function openMenu() {
    mobileMenu.classList.add("open");
    mobileMenu.setAttribute("aria-hidden", "false");
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "Close menu");
  }
  function closeMenu() {
    mobileMenu.classList.remove("open");
    mobileMenu.setAttribute("aria-hidden", "true");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Open menu");
  }
  burger.addEventListener("click", function () {
    if (mobileMenu.classList.contains("open")) closeMenu(); else openMenu();
  });
  mobileMenu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });

  /* search is visual-only in the demo */
  document.getElementById("searchBtn").addEventListener("click", function () {
    this.setAttribute("aria-label", "Search (demo)");
  });

  /* ============================================================
     SCROLL REVEAL
     ============================================================ */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  /* init */
  updateCount();
})();

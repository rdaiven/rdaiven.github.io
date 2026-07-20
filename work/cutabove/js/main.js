/* ============================================================
   CUT ABOVE MEDIA — main.js
   Vanilla JS, zero dependencies. Handles: sticky nav, mobile menu,
   hero word reveal + particle canvas, scroll reveals, count-up,
   process-line draw, carousels, and the filterable gallery.
   Everything respects prefers-reduced-motion.
   ============================================================ */
(function () {
  "use strict";
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var media = window.CUTABOVE_MEDIA || { PORTFOLIO: [], CATEGORIES: [], POSTER_GRADS: [] };

  function $(s, r) { return (r || document).querySelector(s); }
  function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(str) { return String(str).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---------- ICONS ---------- */
  var PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var ARROW_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
  var ARROW_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';

  /* ---------- STICKY NAV ---------- */
  function initNav() {
    var nav = $(".ca-nav");
    if (nav) {
      var onScroll = function () { nav.classList.toggle("is-stuck", window.scrollY > 12); };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    var burger = $(".ca-burger");
    if (burger) {
      burger.addEventListener("click", function () {
        var open = document.body.classList.toggle("nav-open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
      });
      $all(".ca-nav__menu a").forEach(function (a) {
        a.addEventListener("click", function () { document.body.classList.remove("nav-open"); burger.setAttribute("aria-expanded", "false"); });
      });
    }
  }

  /* ---------- HERO WORD REVEAL ---------- */
  function initHero() {
    var title = $(".ca-hero__title");
    if (title && !title.dataset.split) {
      title.dataset.split = "1";
      var html = title.innerHTML;
      // wrap each whitespace-separated token, preserving existing <span class="ca-accent">
      var tmp = document.createElement("div");
      tmp.innerHTML = html;
      var out = [];
      function walk(node) {
        Array.prototype.forEach.call(node.childNodes, function (n) {
          if (n.nodeType === 3) {
            n.textContent.split(/(\s+)/).forEach(function (part) {
              if (part.trim() === "") { out.push(part); }
              else { out.push('<span class="word">' + esc(part) + "</span>"); }
            });
          } else if (n.nodeType === 1) {
            var cls = n.getAttribute("class") || "";
            out.push('<span class="word ' + cls + '">' + n.innerHTML + "</span>");
          }
        });
      }
      walk(tmp);
      title.innerHTML = out.join("");
      var words = $all(".word", title);
      words.forEach(function (w, i) { w.style.transitionDelay = (0.05 + i * 0.06) + "s"; });
      requestAnimationFrame(function () { requestAnimationFrame(function () { title.classList.add("is-in"); }); });
    }
    if (!REDUCED) initHeroCanvas();
  }

  /* ---------- HERO PARTICLE CANVAS ---------- */
  function initHeroCanvas() {
    var c = document.getElementById("ca-hero-canvas");
    if (!c) return;
    var ctx = c.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var parts = [];
    function size() {
      var r = c.parentElement.getBoundingClientRect();
      c.width = r.width * dpr; c.height = r.height * dpr;
      var n = Math.min(60, Math.round(r.width / 26));
      parts = [];
      for (var i = 0; i < n; i++) {
        parts.push({
          x: Math.random() * c.width, y: Math.random() * c.height,
          r: (Math.random() * 1.6 + 0.4) * dpr,
          vx: (Math.random() - 0.5) * 0.18 * dpr, vy: (Math.random() - 0.5) * 0.18 * dpr,
          a: Math.random() * 0.5 + 0.15
        });
      }
    }
    size();
    var ro = new ResizeObserver(size); ro.observe(c.parentElement);
    var raf;
    function tick() {
      ctx.clearRect(0, 0, c.width, c.height);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = c.width; if (p.x > c.width) p.x = 0;
        if (p.y < 0) p.y = c.height; if (p.y > c.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fillStyle = "rgba(255,140,60," + p.a + ")";
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    tick();
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) cancelAnimationFrame(raf); else tick();
    });
  }

  /* ---------- CURSOR FX (light trail + white-hot sparks + magnetic buttons) ----------
     Desktop only: bails on touch / no-hover devices and on prefers-reduced-motion.
     A fixed, full-viewport, pointer-events:none canvas augments the native cursor;
     magnetic buttons are a pure transform offset lerped in the same rAF loop. */
  function initCursor() {
    if (REDUCED || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    var canvas = document.createElement("canvas");
    canvas.className = "ca-cursor-fx";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    function size() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels
    }
    size();
    window.addEventListener("resize", size, { passive: true });

    // pointer target + smoothed trail point
    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var sx = mx, sy = my;           // smoothed (eased) position
    var history = [];               // recent smoothed points -> tapering trail
    var HISTORY = 28;               // longer streak
    var sparks = [];
    var SPARK_MAX = 90;
    var lastMove = 0;               // timestamp of last pointer movement (ms via rAF)
    var now = 0;

    window.addEventListener("pointermove", function (e) {
      mx = e.clientX; my = e.clientY;
      lastMove = now;
      start();                      // (re)start the loop if idle-stopped
    }, { passive: true });

    // ---- magnetic buttons ----
    var magnets = $all(".k-btn, .ca-arrow").map(function (el) {
      return { el: el, cx: 0, cy: 0, tx: 0, ty: 0, active: false };
    });
    function bindMagnet(m) {
      m.el.addEventListener("pointermove", function (e) {
        var r = m.el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        var f = 0.3, cap = 8;       // subtle: 30% of offset, clamped to +/-8px
        m.tx = Math.max(-cap, Math.min(cap, dx * f));
        m.ty = Math.max(-cap, Math.min(cap, dy * f));
        m.active = true;
        start();
      }, { passive: true });
      m.el.addEventListener("pointerleave", function () {
        m.tx = 0; m.ty = 0;
      });
    }
    magnets.forEach(bindMagnet);

    function orange(a) { return "rgba(255,107,0," + a + ")"; }

    var raf = 0, running = false;
    function tick() {
      running = true;
      now += 16;
      // ease the smoothed point toward the pointer
      var px = sx, py = sy;
      sx += (mx - sx) * 0.2;
      sy += (my - sy) * 0.2;
      var speed = Math.hypot(sx - px, sy - py);
      var hot = Math.min(1, speed / 26); // 0 slow -> 1 fast (white-hot)

      history.push({ x: sx, y: sy });
      if (history.length > HISTORY) history.shift();

      // spawn sparks on movement (lower threshold + more per frame)
      if (speed > 2.5 && sparks.length < SPARK_MAX) {
        var count = speed > 12 ? 4 : 2;
        for (var s = 0; s < count; s++) {
          sparks.push({
            x: sx, y: sy,
            vx: (Math.random() - 0.5) * 1.6,
            vy: (Math.random() - 0.5) * 1.6 - 0.3,
            life: 1, size: Math.random() * 1.4 + 0.6,
            hot: hot
          });
        }
      }

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = "lighter";

      // tapering light trail (thin, subtle)
      if (history.length > 1) {
        for (var i = 1; i < history.length; i++) {
          var t = i / history.length;
          ctx.beginPath();
          ctx.moveTo(history[i - 1].x, history[i - 1].y);
          ctx.lineTo(history[i].x, history[i].y);
          ctx.strokeStyle = orange(0.22 * t);
          ctx.lineWidth = 1.6 * t;
          ctx.lineCap = "round";
          ctx.stroke();
        }
        // soft head glow
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, 6.2832);
        ctx.fillStyle = orange(0.28 + hot * 0.4);
        ctx.fill();
      }

      // sparks: orange -> white-hot by their captured speed
      for (var j = sparks.length - 1; j >= 0; j--) {
        var p = sparks[j];
        p.x += p.vx; p.y += p.vy; p.vy += 0.02; // slight gravity
        p.life -= 0.03;
        if (p.life <= 0) { sparks.splice(j, 1); continue; }
        var g = Math.round(107 + (255 - 107) * p.hot);
        var b = Math.round(255 * p.hot);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, 6.2832);
        ctx.fillStyle = "rgba(255," + g + "," + b + "," + (p.life * 0.9) + ")";
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      // magnetic buttons: lerp each toward its target offset
      var magnetsMoving = false;
      for (var k = 0; k < magnets.length; k++) {
        var m = magnets[k];
        m.cx += (m.tx - m.cx) * 0.2;
        m.cy += (m.ty - m.cy) * 0.2;
        if (Math.abs(m.cx) < 0.05 && Math.abs(m.cy) < 0.05) {
          if (m.active && m.tx === 0 && m.ty === 0) { m.el.style.transform = ""; m.active = false; }
        } else {
          m.el.style.transform = "translate(" + m.cx.toFixed(2) + "px," + m.cy.toFixed(2) + "px)";
          magnetsMoving = true;
        }
      }

      // idle-stop: nothing moving, no sparks, magnets settled, pointer at rest
      var atRest = Math.abs(mx - sx) < 0.4 && Math.abs(my - sy) < 0.4;
      if (atRest && sparks.length === 0 && !magnetsMoving && (now - lastMove) > 200) {
        running = false;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        history.length = 0;
        return; // stop the loop until the next pointermove
      }
      raf = requestAnimationFrame(tick);
    }
    function start() { if (!running) { running = true; raf = requestAnimationFrame(tick); } }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { cancelAnimationFrame(raf); running = false; }
      else start();
    });
    start();
  }

  /* ---------- INFINITE MARQUEES ----------
     keel animates the track by translate:-50%, which only loops seamlessly if
     the track is two identical halves AND each half is >= the viewport width.
     Repeat the original content until one half fills the screen, then mirror it
     — so the strip fills any width with no gap. Rebuilds on resize. */
  function initMarquee() {
    if (REDUCED) return; // no scroll animation under reduced-motion; leave static
    var tracks = $all(".k-marquee__track");
    tracks.forEach(function (track) {
      var reals = Array.prototype.slice.call(track.children).filter(function (n) {
        return n.getAttribute("aria-hidden") !== "true";
      });
      if (!reals.length) reals = Array.prototype.slice.call(track.children);
      track.dataset.unit = reals.map(function (n) { n.removeAttribute("aria-hidden"); return n.outerHTML; }).join("");
    });
    function build(track) {
      if (!track.dataset.unit) return;
      var unit = track.dataset.unit;
      track.innerHTML = unit;
      var guard = 0;
      while (track.scrollWidth < window.innerWidth + 120 && guard < 60) {
        track.insertAdjacentHTML("beforeend", unit);
        guard++;
      }
      var half = track.innerHTML;
      track.insertAdjacentHTML("beforeend", half); // mirror -> two identical halves
      var kids = track.children, h = kids.length / 2;
      for (var i = h; i < kids.length; i++) kids[i].setAttribute("aria-hidden", "true");
    }
    tracks.forEach(build);
    var t;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(function () { tracks.forEach(build); }, 200);
    }, { passive: true });
  }

  /* ---------- SCROLL REVEALS ---------- */
  function initReveals() {
    var els = $all(".reveal, .reveal-stagger");
    if (REDUCED || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-inview"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-inview"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- COUNT-UP ---------- */
  function initCounters() {
    var nums = $all("[data-count]");
    if (!nums.length) return;
    if (REDUCED || !("IntersectionObserver" in window)) {
      nums.forEach(function (n) { n.textContent = (n.dataset.prefix || "") + n.dataset.count + (n.dataset.suffix || ""); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target, target = parseFloat(el.dataset.count), t0 = null, dur = 1400;
        function step(ts) {
          if (!t0) t0 = ts;
          var k = Math.min(1, (ts - t0) / dur), val = Math.round((1 - Math.pow(1 - k, 3)) * target);
          el.textContent = (el.dataset.prefix || "") + val + (el.dataset.suffix || "");
          if (k < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ---------- PROCESS (scroll-linked line fill + per-column reveal) ---------- */
  function initProcessLine() {
    var section = $(".ca-process");
    if (!section) return;
    var steps = $all(".ca-step", section);
    var wrap = $(".ca-process__line", section);
    var path = wrap ? $("path", wrap) : null;
    var len = (path && path.getTotalLength) ? path.getTotalLength() : 1000;
    if (path) path.style.strokeDasharray = len;

    if (REDUCED) {
      if (path) path.style.strokeDashoffset = 0;
      steps.forEach(function (s) { s.classList.add("is-in"); });
      return;
    }
    if (path) {
      path.style.strokeDashoffset = len;
      // tiny smoothing so coarse wheel steps don't look jumpy, still tracks the scrollbar
      path.style.transition = "stroke-dashoffset .15s linear";
    }

    var n = steps.length || 1;
    var ticking = false;
    function update() {
      ticking = false;
      var rect = section.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      // fill starts as the steps rise past 85% of the viewport and completes
      // by the time they reach ~30% — line + columns track scroll progress
      var start = vh * 0.85, end = vh * 0.30;
      var p = (start - rect.top) / (start - end);
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      if (path) path.style.strokeDashoffset = len * (1 - p);
      // reveal each column one by one as the fill reaches it (reveal & stay)
      if (p > 0) {
        for (var i = 0; i < steps.length; i++) {
          if (p >= i / n) steps[i].classList.add("is-in");
        }
      }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  /* ---------- MEDIA / SLIDE RENDERING ---------- */
  function mediaInner(item, i) {
    var grad = media.POSTER_GRADS[i % media.POSTER_GRADS.length];
    if (item.type === "mp4" && item.src) {
      return '<video src="' + esc(item.src) + '" ' + (item.poster ? 'poster="' + esc(item.poster) + '" ' : "") +
        'controls playsinline preload="none"></video>';
    }
    if (item.type === "youtube" && item.src) {
      return '<iframe loading="lazy" src="https://www.youtube-nocookie.com/embed/' + esc(item.src) +
        '" title="' + esc(item.title) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
    }
    if (item.type === "vimeo" && item.src) {
      return '<iframe loading="lazy" src="https://player.vimeo.com/video/' + esc(item.src) +
        '" title="' + esc(item.title) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
    }
    // placeholder poster
    return '<div class="ca-media__grad" style="background:' + grad + '"></div>' +
      '<div class="ca-media__play">' + PLAY + '</div>' +
      '<div class="ca-media__poster"><div class="ca-media__meta">' +
      '<div class="ca-media__cat">' + esc(item.category) + '</div>' +
      '<div class="ca-media__title">' + esc(item.title) + '</div></div></div>';
  }
  function mediaEl(item, i) {
    var wide = item.ratio === "16-9";
    var tag = (item.type === "placeholder" || !item.src) ? "div" : "div";
    return '<' + tag + ' class="ca-media' + (wide ? " ca-media--wide" : "") + '">' + mediaInner(item, i) + '</' + tag + '>';
  }

  /* ---------- CAROUSEL ---------- */
  function buildCarousel(root, items) {
    var viewport = $(".ca-carousel__viewport", root);
    var track = $(".ca-carousel__track", root);
    track.innerHTML = items.map(function (it, i) {
      return '<div class="ca-slide">' + mediaEl(it, i) + "</div>";
    }).join("");

    var prev = $(".ca-arrow--prev", root), next = $(".ca-arrow--next", root), dotsWrap = $(".ca-dots", root);
    var index = 0;

    function perView() {
      var w = window.innerWidth;
      if (w >= 1080) return 3;
      if (w >= 720) return 2;
      return 1;
    }
    function maxIndex() { return Math.max(0, items.length - perView()); }
    function render() {
      var mi = maxIndex();
      if (index > mi) index = mi;
      var slide = $(".ca-slide", track);
      var sw = slide ? slide.getBoundingClientRect().width : viewport.getBoundingClientRect().width;
      track.style.transform = "translateX(" + (-index * sw) + "px)";
      if (prev) prev.disabled = index <= 0;
      if (next) next.disabled = index >= mi;
      if (dotsWrap) {
        $all("button", dotsWrap).forEach(function (b, i) { b.classList.toggle("is-active", i === index); });
      }
    }
    function buildDots() {
      if (!dotsWrap) return;
      var pages = maxIndex() + 1;
      dotsWrap.innerHTML = "";
      for (var i = 0; i < pages; i++) {
        var b = document.createElement("button");
        b.type = "button"; b.setAttribute("aria-label", "Go to slide " + (i + 1));
        (function (i) { b.addEventListener("click", function () { index = i; render(); }); })(i);
        dotsWrap.appendChild(b);
      }
    }
    if (prev) prev.addEventListener("click", function () { index = Math.max(0, index - 1); render(); });
    if (next) next.addEventListener("click", function () { index = Math.min(maxIndex(), index + 1); render(); });

    // keyboard
    root.setAttribute("tabindex", "0");
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { index = Math.max(0, index - 1); render(); }
      if (e.key === "ArrowRight") { index = Math.min(maxIndex(), index + 1); render(); }
    });
    // swipe
    var x0 = null;
    viewport.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    viewport.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) { if (dx < 0) index = Math.min(maxIndex(), index + 1); else index = Math.max(0, index - 1); render(); }
      x0 = null;
    }, { passive: true });

    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { buildDots(); render(); }, 150); });
    buildDots(); render();
  }

  function initCarousels() {
    $all("[data-carousel]").forEach(function (root) {
      var only = root.getAttribute("data-carousel"); // "featured" or "all"
      var items = media.PORTFOLIO.filter(function (it) { return only === "featured" ? it.featured : true; });
      if (!items.length) return;
      buildCarousel(root, items);
    });
  }

  /* ---------- GALLERY + FILTERS ---------- */
  function initGallery() {
    var grid = $("[data-gallery]");
    if (!grid) return;
    grid.innerHTML = media.PORTFOLIO.map(function (it, i) {
      return '<div class="ca-gallery__item reveal" data-cat="' + esc(it.category) + '">' + mediaEl(it, i) + "</div>";
    }).join("");

    var filters = $(".ca-filters");
    if (filters) {
      filters.addEventListener("click", function (e) {
        var btn = e.target.closest(".ca-filter");
        if (!btn) return;
        $all(".ca-filter", filters).forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        var cat = btn.dataset.cat;
        $all(".ca-gallery__item", grid).forEach(function (item) {
          var show = cat === "all" || item.dataset.cat === cat;
          if (REDUCED) { item.classList.toggle("is-hidden", !show); return; }
          item.classList.add("is-fade");
          setTimeout(function () {
            item.classList.toggle("is-hidden", !show);
            requestAnimationFrame(function () { item.classList.remove("is-fade"); });
          }, 160);
        });
      });
    }
    // reveal freshly injected items
    initReveals();
  }

  /* ---------- INIT ARROWS MARKUP ---------- */
  function fillArrows() {
    $all(".ca-arrow--prev").forEach(function (a) { a.innerHTML = ARROW_L; });
    $all(".ca-arrow--next").forEach(function (a) { a.innerHTML = ARROW_R; });
  }

  /* ---------- SUCCESS MODAL ----------
     Prototype: forms confirm submission with an on-brand modal — no backend,
     no email, no network call. Built once per submit, removed on close. */
  function showModal(title, msg) {
    var overlay = document.createElement("div");
    overlay.className = "ca-modal";
    overlay.innerHTML =
      '<div class="ca-modal__card" role="dialog" aria-modal="true" aria-labelledby="ca-modal-title">' +
        '<div class="ca-modal__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l6 6L20 6"/></svg></div>' +
        '<h3 class="ca-modal__title" id="ca-modal-title"></h3>' +
        '<p class="ca-modal__msg"></p>' +
        '<button class="k-btn ca-btn-primary ca-modal__close" type="button">Close</button>' +
      '</div>';
    overlay.querySelector(".ca-modal__title").textContent = title;
    overlay.querySelector(".ca-modal__msg").textContent = msg;
    document.body.appendChild(overlay);
    void overlay.offsetWidth; // force reflow so the open transition plays (no rAF dependency)
    overlay.classList.add("is-open");
    var closeBtn = overlay.querySelector(".ca-modal__close");
    function close() {
      overlay.classList.remove("is-open");
      document.removeEventListener("keydown", onKey);
      setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 260);
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    closeBtn.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    closeBtn.focus();
  }

  /* ---------- CONTACT FORM (prototype — confirmation modal, no backend) ----------
     To wire a real endpoint later, set data-endpoint="https://…" on the <form>
     and this handler steps aside (native POST submits to it). */
  function initContactForm() {
    var form = $("#ca-contact-form");
    if (!form) return;
    if (form.getAttribute("data-endpoint")) { form.setAttribute("action", form.getAttribute("data-endpoint")); form.setAttribute("method", "POST"); return; }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      form.reset();
      showModal("Message received", "Thanks for reaching out! This is a prototype, so nothing was actually sent — in a live site your message would reach our team and we'd reply within one business day.");
    });
  }

  /* ---------- FOOTER EXTRAS (back-to-top + newsletter) ---------- */
  function initFooterExtras() {
    $all("[data-totop]").forEach(function (b) {
      b.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" });
      });
    });
    var news = $("#ca-news");
    if (news) {
      news.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!news.checkValidity()) { news.reportValidity(); return; }
        news.reset();
        showModal("You're subscribed", "Thanks for signing up! This is a prototype, so no email was stored — but the flow works.");
      });
    }
  }

  /* ---------- YEAR ---------- */
  function initYear() {
    var y = $("#ca-year");
    if (y) y.textContent = new Date().getFullYear();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initHero();
    fillArrows();
    initCarousels();
    initGallery();
    initReveals();
    initCounters();
    initProcessLine();
    initContactForm();
    initFooterExtras();
    initYear();
    initCursor();
    initMarquee();
  });
})();

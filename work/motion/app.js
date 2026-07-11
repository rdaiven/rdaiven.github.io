/* ==========================================================================
   KINESIS — a study in motion
   Vanilla JS. No libraries. Every subsystem:
   - runs on transform/opacity only,
   - is gated behind pointer/motion capability checks,
   - pauses its rAF work when its section is offscreen.
   ========================================================================== */

(() => {
  "use strict";

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");
  const reduced = () => motionQuery.matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  /* ========================================================================
     02 — HERO ENTRANCE
     Adding .loaded triggers the CSS mask/clip choreography.
     ======================================================================== */
  window.addEventListener("load", () => {
    requestAnimationFrame(() => document.body.classList.add("loaded"));
  });
  // Fallback if load stalls on a slow image/font.
  setTimeout(() => document.body.classList.add("loaded"), 2500);

  /* ========================================================================
     01 — CURSOR FOLLOWER
     Dot chases fast, ring chases slow. Loop self-cancels once both
     have converged, and restarts on the next mouse move.
     ======================================================================== */
  const cursorSystem = (() => {
    if (!finePointer.matches || reduced()) return null;

    const root = document.querySelector(".cursor");
    const dot = root.querySelector(".cursor-dot");
    const ring = root.querySelector(".cursor-ring");
    document.body.classList.add("has-cursor");

    let mx = innerWidth / 2, my = innerHeight / 2;
    let dx = mx, dy = my, rx = mx, ry = my;
    let ringScale = 1, targetScale = 1;
    let rafId = null;

    const tick = () => {
      dx = lerp(dx, mx, 0.55);
      dy = lerp(dy, my, 0.55);
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      ringScale = lerp(ringScale, targetScale, 0.18);

      dot.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) scale(${ringScale})`;

      const settled =
        Math.abs(rx - mx) < 0.1 && Math.abs(ry - my) < 0.1 &&
        Math.abs(ringScale - targetScale) < 0.002;
      rafId = settled ? null : requestAnimationFrame(tick);
    };

    const wake = () => { if (rafId === null && !reduced()) rafId = requestAnimationFrame(tick); };

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      const hit = e.target.closest("a, button, [data-magnetic]");
      const view = e.target.closest("[data-cursor='view']");
      targetScale = view ? 2.1 : hit ? 1.6 : 1;
      root.classList.toggle("is-view", Boolean(view));
      wake();
    }, { passive: true });

    return { wake };
  })();

  /* ========================================================================
     Shared scroll state — one listener feeds story, parallax, marquee, stack.
     ======================================================================== */
  let scrollY = window.scrollY;
  let lastScrollY = scrollY;
  let velocity = 0;          // px per frame, smoothed
  let scrollRaf = null;

  const scrollJobs = [];     // { el, visible, update() } — update only when visible

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const job = scrollJobs.find((j) => j.el === entry.target);
      if (job) {
        job.visible = entry.isIntersecting;
        if (entry.isIntersecting) scheduleScroll();
      }
    }
  }, { rootMargin: "80px 0px" });

  const registerJob = (el, update) => {
    const job = { el, update, visible: false };
    scrollJobs.push(job);
    io.observe(el);
  };

  const runScrollJobs = () => {
    scrollRaf = null;
    if (reduced()) return;
    scrollY = window.scrollY;
    for (const job of scrollJobs) if (job.visible) job.update();
  };

  const scheduleScroll = () => {
    if (scrollRaf === null) scrollRaf = requestAnimationFrame(runScrollJobs);
  };

  window.addEventListener("scroll", scheduleScroll, { passive: true });
  window.addEventListener("resize", scheduleScroll, { passive: true });

  /* ========================================================================
     03 — SCROLL-DRIVEN STORY
     Sticky scene: progress 0→1 across the 260vh section drives the panel
     scale (0.6 → 1) and a word-by-word text reveal.
     ======================================================================== */
  (() => {
    const section = document.querySelector(".story");
    const panel = document.querySelector("[data-story-panel]");
    const textEl = document.querySelector("[data-story-text]");
    if (!section || !panel || !textEl) return;

    // Split copy into word spans once.
    const words = textEl.textContent.trim().split(/\s+/);
    textEl.textContent = "";
    const spans = words.map((w, i) => {
      const s = document.createElement("span");
      s.className = "w";
      s.textContent = w;
      textEl.appendChild(s);
      if (i < words.length - 1) textEl.appendChild(document.createTextNode(" "));
      return s;
    });

    let lastCount = -1;
    registerJob(section, () => {
      const rect = section.getBoundingClientRect();
      const total = rect.height - innerHeight;
      const p = clamp(-rect.top / total, 0, 1);

      // Panel: scale eats the first 55% of the timeline.
      const scaleP = clamp(p / 0.55, 0, 1);
      panel.style.transform = `scale(${0.6 + 0.4 * easeOut(scaleP)})`;

      // Words: reveal across 35% → 95%.
      const wordP = clamp((p - 0.35) / 0.6, 0, 1);
      const count = Math.round(wordP * spans.length);
      if (count !== lastCount) {
        spans.forEach((s, i) => s.classList.toggle("on", i < count));
        lastCount = count;
      }
    });

    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  })();

  /* ========================================================================
     04 — PARALLAX DEPTH
     Layers translate by (distance from viewport center) x depth.
     ======================================================================== */
  (() => {
    const section = document.querySelector(".parallax");
    if (!section) return;
    const layers = [...section.querySelectorAll("[data-depth]")]
      .map((el) => ({ el, depth: parseFloat(el.dataset.depth) }));

    registerJob(section, () => {
      const rect = section.getBoundingClientRect();
      const offset = rect.top + rect.height / 2 - innerHeight / 2;
      for (const { el, depth } of layers) {
        el.style.transform = `translate3d(0, ${(offset * depth).toFixed(1)}px, 0)`;
      }
    });
  })();

  /* ========================================================================
     08 — STICKY STACKING CARDS
     position:sticky does the pinning; JS adds a subtle settle-back scale
     as each card gets covered by the next.
     ======================================================================== */
  (() => {
    const section = document.querySelector(".stack");
    const cards = [...document.querySelectorAll(".stack-card")];
    if (!section || !cards.length) return;

    registerJob(section, () => {
      for (let i = 0; i < cards.length - 1; i++) {
        const mine = cards[i].getBoundingClientRect();
        const next = cards[i + 1].getBoundingClientRect();
        // 0 when the next card is a viewport away, 1 when it overlaps my top.
        const p = clamp(1 - (next.top - mine.top) / innerHeight, 0, 1);
        cards[i].style.transform = `scale(${1 - p * 0.06})`;
      }
    });
  })();

  /* ========================================================================
     07 — MARQUEE + SCROLL VELOCITY
     Continuous rAF loop, but only while the strip is on screen.
     Speed = idle drift + smoothed |scroll velocity|.
     ======================================================================== */
  (() => {
    const wrap = document.querySelector("[data-marquee]");
    const track = document.querySelector("[data-marquee-track]");
    if (!wrap || !track || reduced()) return;

    let x = 0;
    let running = false;
    let rafId = null;
    let half = 0;

    const measure = () => { half = track.scrollWidth / 2; };
    measure();
    window.addEventListener("resize", measure, { passive: true });

    const loop = () => {
      if (!running || reduced()) { rafId = null; return; }

      const sy = window.scrollY;
      velocity = lerp(velocity, sy - lastScrollY, 0.12);
      lastScrollY = sy;

      const speed = 1.1 + Math.min(Math.abs(velocity) * 0.55, 26);
      x -= speed;
      if (half > 0 && -x >= half) x += half;
      track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;

      rafId = requestAnimationFrame(loop);
    };

    new IntersectionObserver(([entry]) => {
      running = entry.isIntersecting;
      if (running && rafId === null) {
        lastScrollY = window.scrollY;
        rafId = requestAnimationFrame(loop);
      }
    }, { rootMargin: "40px 0px" }).observe(wrap);
  })();

  /* ========================================================================
     05 — MAGNETIC BUTTONS
     Button drifts toward the pointer inside its padded radius; the inner
     label drifts a little further. Springs back on leave.
     ======================================================================== */
  (() => {
    if (!finePointer.matches || reduced()) return;

    document.querySelectorAll("[data-magnetic]").forEach((btn) => {
      const inner = btn.querySelector("[data-magnetic-inner]");
      const strength = 0.32;

      btn.addEventListener("mousemove", (e) => {
        if (reduced()) return;
        const r = btn.getBoundingClientRect();
        const relX = e.clientX - (r.left + r.width / 2);
        const relY = e.clientY - (r.top + r.height / 2);
        btn.style.transition = "transform 0.1s linear";
        btn.style.transform = `translate3d(${relX * strength}px, ${relY * strength}px, 0)`;
        if (inner) {
          inner.style.transition = "transform 0.1s linear";
          inner.style.transform = `translate3d(${relX * strength * 0.45}px, ${relY * strength * 0.45}px, 0)`;
        }
      });

      btn.addEventListener("mouseleave", () => {
        const spring = "transform 0.55s cubic-bezier(0.34, 1.56, 0.45, 1)";
        btn.style.transition = spring;
        btn.style.transform = "translate3d(0, 0, 0)";
        if (inner) {
          inner.style.transition = spring;
          inner.style.transform = "translate3d(0, 0, 0)";
        }
      });
    });
  })();

  /* ========================================================================
     06 — HOVER-REVEAL GALLERY
     A fixed preview frame lerps after the cursor while a project row is
     hovered; the row's image cross-fades in. Loop stops on leave/settle.
     ======================================================================== */
  (() => {
    if (!finePointer.matches || reduced()) return;

    const list = document.querySelector(".gallery-list");
    const preview = document.querySelector("[data-gallery-preview]");
    if (!list || !preview) return;
    const imgs = [...preview.querySelectorAll("img")];

    let mx = 0, my = 0, px = 0, py = 0;
    let active = false;
    let rafId = null;

    const tick = () => {
      px = lerp(px, mx, 0.12);
      py = lerp(py, my, 0.12);
      preview.style.transform =
        `translate3d(${px + 28}px, ${py - preview.offsetHeight / 2}px, 0) scale(${active ? 1 : 0.85})`;
      const settled = !active && Math.abs(px - mx) < 0.5 && Math.abs(py - my) < 0.5;
      rafId = settled ? null : requestAnimationFrame(tick);
    };
    const wake = () => { if (rafId === null) rafId = requestAnimationFrame(tick); };

    list.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      if (active) wake();
    }, { passive: true });

    list.addEventListener("mouseover", (e) => {
      const item = e.target.closest("[data-preview]");
      if (!item) return;
      const idx = Number(item.dataset.preview);
      imgs.forEach((img, i) => img.classList.toggle("on", i === idx));
      active = true;
      preview.classList.add("on");
      wake();
    });

    list.addEventListener("mouseleave", () => {
      active = false;
      preview.classList.remove("on");
      wake(); // let it scale down, then self-cancel
    });
  })();

  /* ========================================================================
     Live reduced-motion switch: neutralize every JS-driven transform so the
     CSS reduced-motion styles win immediately, without a reload.
     ======================================================================== */
  motionQuery.addEventListener("change", () => {
    if (!reduced()) { scheduleScroll(); return; }
    document.querySelectorAll(
      "[data-story-panel], [data-depth], .stack-card, [data-marquee-track], [data-magnetic], [data-magnetic-inner]"
    ).forEach((el) => { el.style.transform = ""; });
    document.querySelectorAll(".story-text .w").forEach((w) => w.classList.add("on"));
    document.body.classList.remove("has-cursor");
  });

  // Prime everything already in view on first paint.
  scheduleScroll();
})();

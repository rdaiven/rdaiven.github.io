/* ============================================================
   AXIS One — scroll choreography engine (vanilla JS)
   - Injects the reusable CSS phone from <template> into slots
   - Drives per-section scroll progress (--p, 0→1) via rAF
   - Live colorway swap
   Fully skipped under prefers-reduced-motion: CSS renders every
   section as a static, readable stack instead.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- 1. Build the phones from the template ---------- */
  var template = document.getElementById("phone-template");
  if (template) {
    document.querySelectorAll("[data-phone]").forEach(function (slot) {
      var phone = template.content.cloneNode(true);
      if (slot.hasAttribute("data-eager")) {
        var wall = phone.querySelector(".wallpaper");
        if (wall) wall.setAttribute("loading", "eager");
      }
      slot.appendChild(phone);
    });
  }

  /* ---------- 2. Colorway picker ---------- */
  var swatches = Array.prototype.slice.call(document.querySelectorAll(".swatch"));
  var toneName = document.querySelector(".tone-name");
  var toneLabels = {
    titanium: "Titanium — raw machined finish",
    midnight: "Midnight — vapor-black anodize",
    bone: "Bone — warm mineral matte"
  };
  swatches.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var tone = btn.getAttribute("data-tone");
      document.body.setAttribute("data-tone", tone);
      swatches.forEach(function (b) {
        var active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      if (toneName && toneLabels[tone]) toneName.textContent = toneLabels[tone];
    });
  });

  /* ---------- 3. Scroll-progress engine ---------- */
  if (reduceMotion.matches) return; // CSS static fallback takes over

  var sections = Array.prototype.slice.call(document.querySelectorAll("[data-scroll]"));
  var battPct = document.getElementById("batt-pct");
  var battSection = document.getElementById("battery");
  var state = sections.map(function (el) {
    return { el: el, p: -1 };
  });
  var ticking = false;

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function update() {
    ticking = false;
    var vh = window.innerHeight;
    for (var i = 0; i < state.length; i++) {
      var s = state[i];
      var rect = s.el.getBoundingClientRect(); // one read per section, writes batched after
      var travel = rect.height - vh;
      var p = travel > 0 ? clamp01(-rect.top / travel) : rect.top < vh ? 1 : 0;
      p = Math.round(p * 1000) / 1000;
      if (p !== s.p) {
        s.p = p;
        s.el.style.setProperty("--p", p);
        if (battPct && s.el === battSection) {
          battPct.textContent = String(Math.round(4 + p * 96));
        }
      }
    }
  }

  function requestTick() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }

  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick, { passive: true });
  update();

  /* ---------- 4. Hero entrance ---------- */
  document.body.classList.add("loaded");
})();

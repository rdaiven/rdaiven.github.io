/* LAMESA — shared behavior: spine reading progress, newsletter modal, scroll reveals. */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Spine reading progress (article pages) ---------- */
  var spine = document.querySelector(".spine");
  if (spine) {
    var update = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      spine.style.setProperty("--progress", p.toFixed(4));
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- Newsletter modal (prototype only) ---------- */
  var modal = document.getElementById("newsletter-modal");
  var openers = document.querySelectorAll("[data-open-modal]");
  if (modal && openers.length) {
    var lastFocus = null;
    var open = function () {
      lastFocus = document.activeElement;
      modal.hidden = false;
      var closeBtn = modal.querySelector("[data-close-modal]");
      if (closeBtn) closeBtn.focus();
    };
    var close = function () {
      modal.hidden = true;
      if (lastFocus) lastFocus.focus();
    };
    openers.forEach(function (btn) { btn.addEventListener("click", open); });
    modal.querySelectorAll("[data-close-modal]").forEach(function (btn) {
      btn.addEventListener("click", close);
    });
    modal.addEventListener("click", function (e) {
      if (e.target === modal) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) close();
    });
  }

  /* ---------- Scroll reveals (index cards only) ----------
     Pattern: (1) anything intersecting the initial viewport gets .in
     immediately; (2) rest observed with threshold 0, no negative
     rootMargin; (3) 700ms failsafe for hero elements. */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (reveals.length) {
    if (reducedMotion || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("in"); });
    } else {
      var toObserve = [];
      reveals.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var inView = r.top < window.innerHeight && r.bottom > 0;
        if (inView) {
          el.classList.add("in");
        } else {
          toObserve.push(el);
        }
      });
      if (toObserve.length) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("in");
              io.unobserve(entry.target);
            }
          });
        }, { threshold: 0 });
        toObserve.forEach(function (el) { io.observe(el); });
      }
      /* Failsafe: nothing near the top may ever stay hidden. */
      setTimeout(function () {
        reveals.forEach(function (el) {
          if (el.getBoundingClientRect().top < window.innerHeight) {
            el.classList.add("in");
          }
        });
      }, 700);
    }
  }
})();

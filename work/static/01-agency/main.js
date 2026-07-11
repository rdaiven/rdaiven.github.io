/* HILAGA° — shared behavior: nav toggle, ledger rows, contact modal, scroll reveal */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- mobile nav toggle ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Close" : "Menu";
    });
  }

  /* ---------- ledger rows: click/tap toggle (hover & focus handled in CSS) ---------- */
  document.querySelectorAll(".ledger-row .row-head").forEach(function (head) {
    head.addEventListener("click", function () {
      var row = head.closest(".ledger-row");
      var open = row.classList.toggle("open");
      head.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  /* ---------- contact modal (prototype placeholder) ---------- */
  var modal = document.getElementById("contact-modal");
  if (modal) {
    document.querySelectorAll("[data-open-modal]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        modal.showModal();
      });
    });
    modal.querySelector(".modal-close").addEventListener("click", function () {
      modal.close();
    });
    modal.addEventListener("click", function (e) {
      // close when the backdrop (the dialog element itself) is clicked
      if (e.target === modal) modal.close();
    });
  }

  /* ---------- scroll reveal ----------
     Pattern: (1) instantly reveal anything already in the initial viewport,
     (2) observe only the rest with threshold: 0 and no negative rootMargin,
     (3) 700ms failsafe for anything near the top of the page. */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
    return;
  }

  var vh = window.innerHeight || document.documentElement.clientHeight;
  var pending = [];

  reveals.forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (r.top < vh && r.bottom > 0) {
      el.classList.add("in"); // already in the initial viewport — reveal now
    } else {
      pending.push(el);
    }
  });

  if (pending.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0 });
    pending.forEach(function (el) { io.observe(el); });
  }

  // failsafe: after 700ms, nothing above the fold may still be hidden
  window.setTimeout(function () {
    reveals.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh && !el.classList.contains("in")) el.classList.add("in");
    });
  }, 700);
})();

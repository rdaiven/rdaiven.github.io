/* =====================================================
   marketing.js — nav, mobile menu, scroll reveals
   (no dependencies)
   ===================================================== */
(function () {
  "use strict";

  /* Nav scrolled state */
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("m-nav--scrolled", window.scrollY > 16);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Mobile menu */
  const burger = document.getElementById("burger");
  const links = document.querySelector(".m-nav__links");
  if (burger && links) {
    burger.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        links.classList.remove("is-open");
        burger.classList.remove("is-open");
      })
    );
    window.addEventListener("resize", () => {
      if (window.innerWidth > 880) {
        links.classList.remove("is-open");
        burger.classList.remove("is-open");
      }
    });
  }

  /* Reveal on scroll */
  const els = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    els.forEach((el) => io.observe(el));
  } else {
    els.forEach((el) => el.classList.add("is-visible"));
  }
  // failsafe for above-the-fold hero
  setTimeout(() => {
    document.querySelectorAll(".m-hero [data-reveal]").forEach((el) => el.classList.add("is-visible"));
  }, 500);
})();

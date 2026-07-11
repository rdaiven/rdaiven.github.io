/* =====================================================
   main.js — interactions, scroll, reveal, tilt
   (no dependencies)
   ===================================================== */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Nav scrolled state ---------- */
  const nav = document.getElementById("nav");
  const onScrollNav = () => nav.classList.toggle("nav--scrolled", window.scrollY > 24);
  onScrollNav();

  /* ---------- Mobile burger ---------- */
  const burger = document.getElementById("burger");
  const links = document.querySelector(".nav__links");
  if (burger) {
    burger.setAttribute("aria-expanded", "false");
    burger.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        if (window.innerWidth <= 1024) {
          links.classList.remove("is-open");
          burger.classList.remove("is-open");
          burger.setAttribute("aria-expanded", "false");
        }
      })
    );
    window.addEventListener("resize", () => {
      if (window.innerWidth > 1024) {
        links.classList.remove("is-open");
        burger.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Scroll progress bar ---------- */
  const progressBar = document.querySelector(".scroll-progress span");

  /* ---------- Reveal on scroll (IntersectionObserver) ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  const heroLines = document.querySelectorAll(".hero__title .line");

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
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // Hero text intro fires on load
  window.addEventListener("load", () => {
    heroLines.forEach((l) => l.classList.add("is-visible"));
  });
  // failsafe
  setTimeout(() => heroLines.forEach((l) => l.classList.add("is-visible")), 400);
  setTimeout(() => {
    document.querySelectorAll(".hero [data-reveal]").forEach((el) => el.classList.add("is-visible"));
  }, 650);

  /* ---------- Timeline progress fill ---------- */
  const track = document.getElementById("timeline-track");
  const tlProgress = document.getElementById("timeline-progress");

  /* ---------- Tilt on hover (3D card tilt) ---------- */
  if (!prefersReduced && window.matchMedia("(pointer:fine)").matches) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      let raf = null;
      const onMove = (ev) => {
        const r = card.getBoundingClientRect();
        const px = (ev.clientX - r.left) / r.width - 0.5;
        const py = (ev.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.transform =
            `perspective(900px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) translateY(-4px)`;
        });
      };
      const reset = () => { if (raf) cancelAnimationFrame(raf); card.style.transform = ""; };
      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", reset);
    });
  }

  /* ---------- Parallax glow + scroll-driven work ---------- */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      onScrollNav();

      // progress
      const h = document.documentElement;
      const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
      if (progressBar) progressBar.style.width = (scrolled * 100).toFixed(2) + "%";

      // timeline fill
      if (track && tlProgress) {
        const r = track.getBoundingClientRect();
        const vh = window.innerHeight;
        const total = r.height + vh * 0.5;
        const passed = Math.min(Math.max(vh * 0.7 - r.top, 0), total);
        tlProgress.style.height = Math.min((passed / r.height) * 100, 100).toFixed(1) + "%";
      }

      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Smooth active-link highlight ---------- */
  const sections = [...document.querySelectorAll("section[id]")];
  const navLinks = [...document.querySelectorAll(".nav__links a")];
  if ("IntersectionObserver" in window) {
    const so = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = e.target.id;
            navLinks.forEach((a) =>
              a.style.color = a.getAttribute("href") === "#" + id ? "var(--text)" : ""
            );
          }
        });
      },
      { threshold: 0.4 }
    );
    sections.forEach((s) => so.observe(s));
  }
})();

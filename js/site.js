/* Daiven Reyes — portfolio root scripts (vanilla, no dependencies) */
(function () {
  'use strict';

  /* ------------------------------------------------------------
     Scroll reveals — safe by design:
     - elements already in the viewport get .in immediately
     - IntersectionObserver threshold 0, no rootMargin
     - 700ms failsafe adds .in to everything
     - reduced-motion users get everything instantly
  ------------------------------------------------------------ */
  var els = Array.prototype.slice.call(document.querySelectorAll('.rv, .rv-stagger'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function showAll() {
    els.forEach(function (el) { el.classList.add('in'); });
  }

  if (reduce || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    // immediately show anything already on screen
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0 });
    els.forEach(function (el) {
      if (!el.classList.contains('in')) io.observe(el);
    });
    // failsafe: never leave content hidden
    window.setTimeout(showAll, 700);
  }

  /* ------------------------------------------------------------
     Count-up — animate [data-count] numbers into view once.
     HTML already holds the final value, so reduced-motion (or no
     IntersectionObserver) simply leaves it untouched.
  ------------------------------------------------------------ */
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  if (counters.length && !reduce && 'IntersectionObserver' in window && 'requestAnimationFrame' in window) {
    var runCount = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      if (isNaN(target)) return;
      var suffix = el.getAttribute('data-suffix') || '';
      var dur = 1000, start = null;
      var ease = function (t) { return 1 - Math.pow(1 - t, 3); }; // easeOutCubic
      var step = function (ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        el.textContent = Math.round(ease(p) * target) + suffix;
        if (p < 1) window.requestAnimationFrame(step);
        else el.textContent = target + suffix;
      };
      window.requestAnimationFrame(step);
    };
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCount(en.target); co.unobserve(en.target); }
      });
    }, { threshold: 0 });
    counters.forEach(function (el) { co.observe(el); });
  }

  /* ------------------------------------------------------------
     Scroll progress bar — a thin top rail tracking read position.
  ------------------------------------------------------------ */
  if ('requestAnimationFrame' in window) {
    var bar = document.createElement('div');
    bar.className = 'progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    var ticking = false, max = 0;
    var measure = function () {
      var doc = document.documentElement;
      max = doc.scrollHeight - doc.clientHeight; // scrollHeight forces layout — read only on resize
    };
    var draw = function () {
      var doc = document.documentElement;
      var pct = max > 0 ? (doc.scrollTop || window.pageYOffset) / max : 0;
      bar.style.width = (pct * 100).toFixed(2) + '%';
      ticking = false;
    };
    var onScroll = function () {
      if (!ticking) { window.requestAnimationFrame(draw); ticking = true; }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { measure(); onScroll(); }, { passive: true });
    measure();
    draw();
  }

  /* ------------------------------------------------------------
     Pointer tilt — subtle 3D response on [data-tilt] elements.
     Desktop + fine-pointer only; never on touch or reduced-motion.
  ------------------------------------------------------------ */
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var tilts = Array.prototype.slice.call(document.querySelectorAll('[data-tilt]'));
  if (fine && !reduce && tilts.length) {
    var MAX = 4; // degrees
    tilts.forEach(function (el) {
      var rect = null; // measured once per hover, not on every move
      el.addEventListener('pointerenter', function () { rect = el.getBoundingClientRect(); });
      el.addEventListener('pointermove', function (e) {
        if (!rect) rect = el.getBoundingClientRect();
        var dx = (e.clientX - rect.left) / rect.width - 0.5;
        var dy = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform =
          'perspective(760px) rotateX(' + (-dy * MAX).toFixed(2) + 'deg) rotateY(' +
          (dx * MAX).toFixed(2) + 'deg) translateY(-4px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; rect = null; });
    });
  }

  /* ------------------------------------------------------------
     Lab hover preview — hovering a batch row reveals a live,
     scaled-down demo of that build beside it. Progressive
     enhancement: desktop + fine-pointer + motion only; touch and
     no-JS visitors just get the plain linked rows.
  ------------------------------------------------------------ */
  var lab = document.querySelector('.lab');
  if (lab && fine && !reduce) {
    var preview = document.createElement('div');
    preview.className = 'lab-preview';
    preview.setAttribute('aria-hidden', 'true');
    lab.appendChild(preview);

    var demoFrames = {};
    var current = null; // frame currently shown
    var rows = Array.prototype.slice.call(lab.querySelectorAll('.labrow'));

    var showRow = function (row) {
      // CSS hides the preview card below its breakpoint — let that be the authority
      if (getComputedStyle(preview).display === 'none') return;
      var url = row.getAttribute('data-demo');
      if (!url) return;
      if (!demoFrames[url]) {                       // lazy-load once, then cache
        var f = document.createElement('iframe');
        f.src = url;
        f.setAttribute('tabindex', '-1');
        f.setAttribute('aria-hidden', 'true');
        f.setAttribute('scrolling', 'no');
        f.loading = 'lazy';
        preview.appendChild(f);
        demoFrames[url] = f;
      }
      if (current) current.classList.remove('on');
      current = demoFrames[url];
      current.classList.add('on');
      var top = Math.min(row.offsetTop, lab.clientHeight - preview.offsetHeight);
      preview.style.top = Math.max(0, top) + 'px';
      preview.classList.add('show');
    };
    var hide = function () { preview.classList.remove('show'); };

    rows.forEach(function (r) {
      r.addEventListener('mouseenter', function () { showRow(r); });
      r.addEventListener('focus', function () { showRow(r); });
    });
    lab.addEventListener('mouseleave', hide);
    lab.addEventListener('focusout', function (e) {
      if (!lab.contains(e.relatedTarget)) hide();
    });
  }

  /* ------------------------------------------------------------
     Email reveal — anti-scraper.
     The address never exists in the HTML source or as a
     contiguous string here; parts are stored reversed and only
     assembled in memory when the visitor clicks "Reveal email".
  ------------------------------------------------------------ */
  var btn = document.getElementById('reveal-email');
  var slot = document.getElementById('email-slot');

  if (btn && slot) {
    btn.addEventListener('click', function () {
      var p = ['32seyerneviad', 'moc.liamg']; // reversed parts
      var rev = function (s) { return s.split('').reverse().join(''); };
      var addr = rev(p[0]) + String.fromCharCode(64) + rev(p[1]);

      slot.textContent = '';

      var text = document.createElement('span');
      text.className = 'email-text';
      text.textContent = addr;

      var copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'btn-copy';
      copy.textContent = 'Copy';
      copy.addEventListener('click', function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(addr).then(function () {
            copy.textContent = 'Copied';
            window.setTimeout(function () { copy.textContent = 'Copy'; }, 1600);
          });
        }
      });

      slot.appendChild(text);
      slot.appendChild(copy);
      btn.remove();
      text.focus && slot.setAttribute('tabindex', '-1');
      slot.focus && slot.focus();
    });
  }
})();

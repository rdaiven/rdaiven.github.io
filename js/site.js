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
  var els = Array.prototype.slice.call(document.querySelectorAll('.rv'));
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

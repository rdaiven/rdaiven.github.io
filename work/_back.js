/* Prototype Lab — floating "back" affordance for standalone demo pages.
   Included on every demo so a visitor is never stranded. Absolute paths
   resolve the same locally (served from the Portfolio root) and on
   rdaiven.github.io (a user-pages root). aria-labelled, keyboard focusable,
   safe-area aware, and styled to read on both light and dark demos. */
(function () {
  'use strict';
  if (document.getElementById('pl-back')) return;

  // derive the hub path from the current URL's /work/ segment, so it works
  // at the domain root, in a subdirectory, or from file:// — no hard-coding.
  var path = location.pathname;
  var i = path.lastIndexOf('/work/');
  var hub = i >= 0 ? path.slice(0, i + 6) + 'index.html' : '/work/index.html';

  var a = document.createElement('a');
  a.id = 'pl-back';
  a.href = hub;
  a.setAttribute('aria-label', 'Back to the Prototype Lab');
  a.innerHTML = '<span aria-hidden="true" style="font-size:15px;line-height:1">←</span>' +
    '<span>Prototype&nbsp;Lab</span>';

  a.style.cssText = [
    'position:fixed',
    'left:max(16px, env(safe-area-inset-left, 0px))',
    'bottom:max(16px, env(safe-area-inset-bottom, 0px))',
    'z-index:2147483000',
    'display:inline-flex',
    'align-items:center',
    'gap:8px',
    'padding:10px 16px',
    'border-radius:999px',
    'font:600 13px/1 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
    'letter-spacing:.01em',
    'color:#fff',
    'background:rgba(13,14,18,.82)',
    'border:1px solid rgba(255,255,255,.2)',
    'box-shadow:0 10px 30px -10px rgba(0,0,0,.55)',
    '-webkit-backdrop-filter:blur(9px)',
    'backdrop-filter:blur(9px)',
    'text-decoration:none',
    'cursor:pointer',
    'transition:background .2s ease,transform .2s ease,box-shadow .2s ease'
  ].join(';');

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  a.addEventListener('mouseenter', function () {
    a.style.background = 'rgba(107,138,253,.95)';
    a.style.borderColor = 'rgba(107,138,253,.95)';
    if (!reduce) a.style.transform = 'translateY(-2px)';
    a.style.boxShadow = '0 14px 34px -10px rgba(107,138,253,.6)';
  });
  a.addEventListener('mouseleave', function () {
    a.style.background = 'rgba(13,14,18,.82)';
    a.style.borderColor = 'rgba(255,255,255,.2)';
    a.style.transform = 'none';
    a.style.boxShadow = '0 10px 30px -10px rgba(0,0,0,.55)';
  });

  (document.body || document.documentElement).appendChild(a);
})();

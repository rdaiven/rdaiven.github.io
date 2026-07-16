/* Prototype Lab — floating "back" affordance for standalone demo pages.
   Included on every demo so a visitor is never stranded. The portfolio
   deploys at the domain root (rdaiven.github.io), so absolute paths are
   correct both there and when served locally from the Portfolio root.
   aria-labelled, keyboard focusable, safe-area aware, reads on light + dark. */
(function () {
  'use strict';
  if (window.top !== window.self) return;   // don't render inside the lab preview iframe
  if (document.getElementById('pl-back')) return;

  // Base + hover live in one injected stylesheet so the hover state is declared
  // once (no hand-restoring props on mouseleave) and reduced-motion is a media query.
  var css = document.createElement('style');
  css.textContent =
    '#pl-back{' +
      'position:fixed;' +
      'left:max(16px, env(safe-area-inset-left, 0px));' +
      'bottom:max(16px, env(safe-area-inset-bottom, 0px));' +
      'z-index:2147483000;display:inline-flex;align-items:center;gap:8px;' +
      'padding:10px 16px;border-radius:999px;' +
      'font:600 13px/1 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;' +
      'letter-spacing:.01em;color:#fff;background:rgba(13,14,18,.82);' +
      'border:1px solid rgba(255,255,255,.2);box-shadow:0 10px 30px -10px rgba(0,0,0,.55);' +
      '-webkit-backdrop-filter:blur(9px);backdrop-filter:blur(9px);' +
      'text-decoration:none;cursor:pointer;' +
      'transition:background .2s ease,transform .2s ease,box-shadow .2s ease}' +
    '#pl-back:hover,#pl-back:focus-visible{' +
      'background:rgba(107,138,253,.95);border-color:rgba(107,138,253,.95);' +
      'transform:translateY(-2px);box-shadow:0 14px 34px -10px rgba(107,138,253,.6)}' +
    '@media (prefers-reduced-motion:reduce){#pl-back:hover,#pl-back:focus-visible{transform:none}}';
  document.head.appendChild(css);

  var a = document.createElement('a');
  a.id = 'pl-back';
  a.href = '/work/index.html';
  a.setAttribute('aria-label', 'Back to the Prototype Lab');
  a.innerHTML = '<span aria-hidden="true" style="font-size:15px;line-height:1">←</span>' +
    '<span>Prototype&nbsp;Lab</span>';

  (document.body || document.documentElement).appendChild(a);
})();

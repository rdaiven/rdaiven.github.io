/* ============================================================
   NULLPORT storefront — vanilla interactions
   ============================================================ */
(function () {
  'use strict';

  var peso = function (n) { return '₱' + n.toLocaleString('en-PH'); };

  /* ---- product data ---- */
  var PRODUCTS = [
    { pn:'NP-04', name:'NP-04 Reference', cat:'AUDIO', price:12990, shape:'bud',
      chips:['11mm PLANAR','40H','−48dB ANC'],
      specs:[['Driver','11 mm planar magnetic'],['Frequency','5 Hz – 40 kHz'],['Battery','10 h bud / 40 h case'],['ANC depth','−48 dB'],['Codec','LDAC · aptX Adaptive'],['Water','IP67'],['Weight','5.4 g / bud']] },
    { pn:'NP-02', name:'NP-02 Studio', cat:'AUDIO', price:9490, shape:'bud',
      chips:['10mm DYN','32H','−42dB ANC'],
      specs:[['Driver','10 mm dynamic'],['Frequency','10 Hz – 24 kHz'],['Battery','8 h bud / 32 h case'],['ANC depth','−42 dB'],['Codec','aptX · AAC'],['Water','IP54'],['Weight','4.9 g / bud']] },
    { pn:'NP-01', name:'NP-01 Field', cat:'AUDIO', price:6290, shape:'bud',
      chips:['8mm DYN','28H','IP68'],
      specs:[['Driver','8 mm dynamic'],['Frequency','20 Hz – 20 kHz'],['Battery','7 h bud / 28 h case'],['ANC depth','−36 dB'],['Codec','SBC · AAC'],['Water','IP68'],['Weight','5.1 g / bud']] },
    { pn:'NX-07', name:'NX-07 Monitor', cat:'AUDIO', price:18490, shape:'headphone',
      chips:['OVER-EAR','60H','HI-RES'],
      specs:[['Driver','50 mm bio-cellulose'],['Frequency','4 Hz – 45 kHz'],['Battery','60 h ANC on'],['ANC depth','−52 dB'],['Codec','LDAC · USB-C DAC'],['Weight','286 g'],['Pads','Protein leather']] },
    { pn:'PW-30', name:'PW-30 GaN Cube', cat:'POWER', price:2790, shape:'charger',
      chips:['100W','3-PORT','GaN III'],
      specs:[['Output','100 W total'],['Ports','2× USB-C · 1× USB-A'],['Protocol','USB-C PD 3.1 EPR'],['Tech','GaN III'],['Size','52 × 52 × 30 mm'],['Weight','168 g'],['Safety','12-point thermal']] },
    { pn:'PW-12', name:'PW-12 Bank', cat:'POWER', price:3490, shape:'bank',
      chips:['20000mAh','65W','DISPLAY'],
      specs:[['Capacity','20,000 mAh / 72 Wh'],['Output','65 W USB-C PD'],['Input','30 W recharge'],['Display','OLED wattage readout'],['Cells','LG 21700'],['Cycles','1,000+'],['Weight','392 g']] },
    { pn:'WR-05', name:'WR-05 Pulse', cat:'WEARABLE', price:8990, shape:'watch',
      chips:['AMOLED','14D','5ATM'],
      specs:[['Display','1.4" AMOLED 466px'],['Battery','14 days typical'],['Sensors','SpO2 · ECG · skin temp'],['GPS','Dual-band L1+L5'],['Water','5 ATM · IP68'],['Case','Grade-5 titanium'],['Weight','32 g']] },
    { pn:'WR-02', name:'WR-02 Band', cat:'WEARABLE', price:3290, shape:'band',
      chips:['SLIM','21D','HR']  ,
      specs:[['Display','1.1" AMOLED'],['Battery','21 days typical'],['Sensors','Optical HR · SpO2'],['GPS','Connected GPS'],['Water','5 ATM'],['Case','Aluminium'],['Weight','19 g']] }
  ];

  /* ---- SVG placeholder renderers ---- */
  function deviceSVG(shape) {
    var grid = '<defs><pattern id="g-'+shape+'" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="#242b34" stroke-width="0.5"/></pattern><linearGradient id="m-'+shape+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#232a34"/><stop offset="1" stop-color="#12161c"/></linearGradient></defs><rect width="200" height="150" fill="url(#g-'+shape+')"/>';
    var body = {
      bud: '<g transform="translate(100 75)"><ellipse rx="30" ry="30" fill="url(#m-bud)" stroke="#2A313C"/><circle r="16" fill="#0E1116" stroke="#2A313C"/><circle r="6" fill="#161B22" stroke="#4C8DFF"/><path d="M22 16 q22 20 12 52" fill="none" stroke="url(#m-bud)" stroke-width="15" stroke-linecap="round"/></g>',
      headphone: '<g transform="translate(100 75)" fill="none" stroke="#2A313C"><path d="M-44 6 a44 44 0 0 1 88 0" stroke-width="7" stroke-linecap="round"/><rect x="-56" y="4" width="26" height="40" rx="8" fill="url(#m-headphone)"/><rect x="30" y="4" width="26" height="40" rx="8" fill="url(#m-headphone)"/><circle cx="-43" cy="24" r="6" stroke="#4C8DFF"/></g>',
      charger: '<g transform="translate(100 75)"><rect x="-30" y="-30" width="60" height="60" rx="10" fill="url(#m-charger)" stroke="#2A313C"/><rect x="-16" y="-14" width="12" height="5" rx="2" fill="#0E1116" stroke="#4C8DFF"/><rect x="4" y="-14" width="12" height="5" rx="2" fill="#0E1116" stroke="#2A313C"/><rect x="-8" y="8" width="16" height="6" rx="2" fill="#0E1116" stroke="#2A313C"/></g>',
      bank: '<g transform="translate(100 75)"><rect x="-24" y="-38" width="48" height="76" rx="8" fill="url(#m-bank)" stroke="#2A313C"/><rect x="-16" y="-30" width="32" height="16" rx="3" fill="#0E1116" stroke="#4C8DFF"/><line x1="-12" y1="18" x2="12" y2="18" stroke="#2A313C" stroke-width="2"/></g>',
      watch: '<g transform="translate(100 75)"><rect x="-22" y="-40" width="44" height="18" rx="6" fill="#161B22" stroke="#2A313C"/><rect x="-22" y="22" width="44" height="18" rx="6" fill="#161B22" stroke="#2A313C"/><rect x="-26" y="-24" width="52" height="48" rx="12" fill="url(#m-watch)" stroke="#2A313C"/><rect x="-18" y="-16" width="36" height="32" rx="7" fill="#0E1116" stroke="#4C8DFF"/><circle r="3" fill="#4C8DFF"/></g>',
      band: '<g transform="translate(100 75)"><rect x="-14" y="-42" width="28" height="20" rx="5" fill="#161B22" stroke="#2A313C"/><rect x="-14" y="22" width="28" height="20" rx="5" fill="#161B22" stroke="#2A313C"/><rect x="-16" y="-26" width="32" height="52" rx="10" fill="url(#m-band)" stroke="#2A313C"/><rect x="-9" y="-18" width="18" height="36" rx="6" fill="#0E1116" stroke="#4C8DFF"/></g>'
    }[shape] || '';
    return '<svg class="card__svg" viewBox="0 0 200 150" aria-hidden="true">'+grid+body+'</svg>';
  }

  /* ---- render product grid ---- */
  var grid = document.getElementById('productGrid');
  PRODUCTS.forEach(function (p) {
    var chips = p.chips.map(function (c) { return '<span class="chip">'+c+'</span>'; }).join('');
    var el = document.createElement('article');
    el.className = 'card reveal';
    el.innerHTML =
      '<div class="card__media"><span class="card__pn">REF. '+p.pn+'</span><span class="card__cat">'+p.cat+'</span>'+deviceSVG(p.shape)+'</div>'+
      '<h3 class="card__name">'+p.name+'</h3>'+
      '<div class="card__chips">'+chips+'</div>'+
      '<div class="card__foot"><span class="card__price">'+peso(p.price)+'</span>'+
      '<div class="card__btns">'+
      '<button class="btn btn--ghost" data-quick="'+p.pn+'">Quick view</button>'+
      '<button class="btn btn--accent" data-add="'+p.pn+'" data-name="'+p.name+'" data-price="'+p.price+'">Add</button>'+
      '</div></div>';
    grid.appendChild(el);
  });

  /* ---- cart state ---- */
  var cartCount = 2;
  var countEls = [document.getElementById('cartCount'), document.getElementById('drawerCount')];
  function renderCount() {
    document.getElementById('cartCount').textContent = cartCount;
    document.getElementById('drawerCount').textContent = '(' + cartCount + ')';
  }

  /* seed cart items */
  var cartLines = [
    { pn:'NP-04', name:'NP-04 Reference', price:12990, qty:1, shape:'bud' },
    { pn:'PW-30', name:'PW-30 GaN Cube', price:2790, qty:1, shape:'charger' }
  ];

  var cartItemsEl = document.getElementById('cartItems');
  var subtotalEl = document.getElementById('cartSubtotal');

  function renderCart() {
    cartItemsEl.innerHTML = '';
    var subtotal = 0, count = 0;
    cartLines.forEach(function (line, i) {
      subtotal += line.price * line.qty; count += line.qty;
      var row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML =
        '<div class="cart-item__thumb"><svg viewBox="0 0 200 150" width="46" aria-hidden="true">'+deviceSVG(line.shape)+'</svg></div>'+
        '<div><p class="cart-item__pn">REF. '+line.pn+'</p><p class="cart-item__name">'+line.name+'</p>'+
        '<div class="cart-item__row"><div class="stepper" role="group" aria-label="Quantity for '+line.name+'">'+
        '<button aria-label="Decrease quantity" data-dec="'+i+'">−</button><span>'+line.qty+'</span><button aria-label="Increase quantity" data-inc="'+i+'">+</button></div>'+
        '<span class="cart-item__price">'+peso(line.price*line.qty)+'</span></div></div>';
      cartItemsEl.appendChild(row);
    });
    subtotalEl.textContent = peso(subtotal);
    cartCount = count;
    renderCount();
  }

  cartItemsEl.addEventListener('click', function (e) {
    var inc = e.target.getAttribute('data-inc'), dec = e.target.getAttribute('data-dec');
    if (inc !== null) { cartLines[+inc].qty++; renderCart(); }
    if (dec !== null) { var l = cartLines[+dec]; if (l.qty > 1) { l.qty--; } else { cartLines.splice(+dec,1); } renderCart(); }
  });

  function addToCart(pn, name, price) {
    var line = cartLines.filter(function (l) { return l.pn === pn; })[0];
    if (line) { line.qty++; }
    else {
      var prod = PRODUCTS.filter(function (p) { return p.pn === pn; })[0];
      cartLines.push({ pn:pn, name:name, price:+price, qty:1, shape: prod ? prod.shape : 'bud' });
    }
    renderCart();
    var badge = document.getElementById('cartCount');
    badge.animate([{transform:'scale(1)'},{transform:'scale(1.4)'},{transform:'scale(1)'}], {duration:280});
  }

  /* ---- overlay / drawer / modal machinery ---- */
  var overlay = document.getElementById('overlay');
  var drawer = document.getElementById('cartDrawer');
  var modal = document.getElementById('quickModal');
  var lastFocus = null;

  function showOverlay() { overlay.hidden = false; requestAnimationFrame(function(){ overlay.classList.add('is-open'); }); }
  function maybeHideOverlay() {
    if (!drawer.classList.contains('is-open') && !modal.classList.contains('is-open')) {
      overlay.classList.remove('is-open');
      setTimeout(function(){ if(!overlay.classList.contains('is-open')) overlay.hidden = true; }, 240);
    }
  }

  function openDrawer() {
    lastFocus = document.activeElement;
    showOverlay();
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden','false');
    document.getElementById('cartClose').focus();
  }
  function closeDrawer() {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden','true');
    maybeHideOverlay();
    if (lastFocus) lastFocus.focus();
  }

  function openModal(pn) {
    var p = PRODUCTS.filter(function (x) { return x.pn === pn; })[0];
    if (!p) return;
    lastFocus = document.activeElement;
    var rows = p.specs.map(function (s) { return '<tr><th>'+s[0]+'</th><td>'+s[1]+'</td></tr>'; }).join('');
    document.getElementById('modalBody').innerHTML =
      '<div class="modal__media"><span class="card__pn">REF. '+p.pn+'</span><span class="card__cat">'+p.cat+'</span>'+deviceSVG(p.shape)+'</div>'+
      '<div class="modal__info"><p class="eyebrow">REF. '+p.pn+' // '+p.cat+'</p>'+
      '<h3 id="qvTitle">'+p.name+'</h3><p class="modal__price">'+peso(p.price)+'</p>'+
      '<table class="spec-table"><tbody>'+rows+'</tbody></table>'+
      '<div class="modal__buy"><div class="stepper" role="group" aria-label="Quantity">'+
      '<button id="qvDec" aria-label="Decrease quantity">−</button><span id="qvQty">1</span><button id="qvInc" aria-label="Increase quantity">+</button></div>'+
      '<button class="btn btn--accent" id="qvAdd">Add to cart — '+peso(p.price)+'</button></div></div>';

    showOverlay();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
    document.getElementById('modalClose').focus();

    var qvQty = 1;
    var qtyEl = document.getElementById('qvQty');
    document.getElementById('qvInc').onclick = function(){ qvQty++; qtyEl.textContent = qvQty; };
    document.getElementById('qvDec').onclick = function(){ if(qvQty>1){qvQty--; qtyEl.textContent = qvQty;} };
    document.getElementById('qvAdd').onclick = function(){ for(var i=0;i<qvQty;i++) addToCart(p.pn,p.name,p.price); closeModal(); openDrawer(); };
  }
  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
    maybeHideOverlay();
    if (lastFocus) lastFocus.focus();
  }

  /* ---- global click delegation ---- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-add],[data-quick]');
    if (!t) return;
    if (t.hasAttribute('data-add')) {
      addToCart(t.getAttribute('data-add'), t.getAttribute('data-name'), t.getAttribute('data-price'));
      openDrawer();
    } else if (t.hasAttribute('data-quick')) {
      openModal(t.getAttribute('data-quick'));
    }
  });

  document.getElementById('cartBtn').addEventListener('click', openDrawer);
  document.getElementById('cartClose').addEventListener('click', closeDrawer);
  document.getElementById('modalClose').addEventListener('click', closeModal);
  overlay.addEventListener('click', function(){ closeDrawer(); closeModal(); });
  document.getElementById('searchBtn').addEventListener('click', function(){ document.getElementById('products').scrollIntoView(); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeDrawer(); closeModal(); closeMobile(); }
  });

  /* ---- mobile menu ---- */
  var hamburger = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobileMenu');
  function closeMobile() { mobileMenu.hidden = true; hamburger.setAttribute('aria-expanded','false'); }
  hamburger.addEventListener('click', function () {
    var open = mobileMenu.hidden;
    mobileMenu.hidden = !open;
    hamburger.setAttribute('aria-expanded', String(open));
  });
  mobileMenu.addEventListener('click', function (e) { if (e.target.tagName === 'A') closeMobile(); });

  /* ---- scroll reveal ---- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---- init ---- */
  renderCart();
})();

/* PERA — envelope budgeting. Vanilla JS, localStorage-persisted. */
(function () {
  'use strict';

  var STORE_KEY = 'pera.data.v1';
  var SEED_KEY = 'pera.seeded.v1';

  var PALETTE = [
    { name: 'Violet', hex: '#6B5B95' },
    { name: 'Blue', hex: '#3E6B8F' },
    { name: 'Orange', hex: '#C97B3D' },
    { name: 'Teal', hex: '#2E7D74' },
    { name: 'Plum', hex: '#8F4E6E' },
    { name: 'Olive', hex: '#7A7D3E' },
    { name: 'Rust', hex: '#A65440' },
    { name: 'Slate', hex: '#5B6770' }
  ];

  var pesoFmt = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
  function peso(n) { return pesoFmt.format(n); }

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  // ---------- month helpers ----------

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function monthKeyOf(date) {
    return date.getFullYear() + '-' + pad2(date.getMonth() + 1);
  }

  function parseMonthKey(key) {
    var parts = key.split('-');
    return { year: Number(parts[0]), month: Number(parts[1]) };
  }

  function shiftMonth(key, delta) {
    var p = parseMonthKey(key);
    var d = new Date(p.year, p.month - 1 + delta, 1);
    return monthKeyOf(d);
  }

  function monthLabel(key) {
    var p = parseMonthKey(key);
    return new Date(p.year, p.month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  function daysInMonth(key) {
    var p = parseMonthKey(key);
    return new Date(p.year, p.month, 0).getDate();
  }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function shortDate(iso) {
    var parts = iso.split('-');
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  }

  // ---------- storage ----------

  function loadData() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.months && typeof parsed.months === 'object') {
          return parsed;
        }
      }
    } catch (err) { /* corrupted store: start fresh */ }
    return { months: {} };
  }

  function saveData() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
    } catch (err) {
      toast('Could not save — storage unavailable');
    }
  }

  function getMonth(key) {
    if (!data.months[key]) data.months[key] = { envelopes: [], transactions: [] };
    return data.months[key];
  }

  function peekMonth(key) {
    return data.months[key] || { envelopes: [], transactions: [] };
  }

  // ---------- seed ----------

  function seedIfNeeded() {
    if (localStorage.getItem(SEED_KEY)) return;
    if (Object.keys(data.months).length > 0) {
      localStorage.setItem(SEED_KEY, '1');
      return;
    }
    var key = monthKeyOf(new Date());
    var dim = daysInMonth(key);
    function day(d) { return key + '-' + pad2(Math.min(d, dim)); }

    var groceries = uid(), transport = uid(), bills = uid(),
        eatingOut = uid(), savings = uid(), fun = uid();

    var envelopes = [
      { id: groceries, name: 'Groceries', budget: 8000, color: '#3E6B8F' },
      { id: transport, name: 'Transport', budget: 3000, color: '#C97B3D' },
      { id: bills, name: 'Bills', budget: 6500, color: '#5B6770' },
      { id: eatingOut, name: 'Eating out', budget: 2500, color: '#A65440' },
      { id: savings, name: 'Savings', budget: 5000, color: '#2E7D74' },
      { id: fun, name: 'Fun', budget: 1500, color: '#6B5B95' }
    ];

    var seedTx = [
      [savings, 2500, 'Transfer to savings', 1],
      [groceries, 1240, 'Palengke run', 2],
      [transport, 96, 'Jeepney fares for the week', 2],
      [bills, 2830, 'Meralco bill', 3],
      [eatingOut, 145, 'Milk tea', 4],
      [transport, 285, 'Grab to Makati', 5],
      [groceries, 2160, 'SM Hypermarket', 6],
      [eatingOut, 1450, 'Samgyupsal with friends', 7],
      [bills, 480, 'Maynilad water bill', 8],
      [bills, 299, 'Globe data promo', 9],
      [eatingOut, 185, 'Jollibee lunch', 10],
      [eatingOut, 740, 'Weekend inuman', 11],
      [eatingOut, 210, 'Coffee run', 12],
      [fun, 480, 'Movie night', 12]
    ];

    var now = Date.now();
    var transactions = seedTx.map(function (t, i) {
      return {
        id: uid(),
        envelopeId: t[0],
        amount: t[1],
        note: t[2],
        date: day(t[3]),
        createdAt: now - (seedTx.length - i) * 60000
      };
    });

    data.months[key] = { envelopes: envelopes, transactions: transactions };
    localStorage.setItem(SEED_KEY, '1');
    saveData();
  }

  // ---------- state ----------

  var data = loadData();
  var viewedMonth = monthKeyOf(new Date());
  var lastFocused = null;
  var armedButton = null;

  // ---------- dom ----------

  var el = {
    monthLabel: document.getElementById('month-label'),
    prevMonth: document.getElementById('prev-month'),
    nextMonth: document.getElementById('next-month'),
    sumBudgeted: document.getElementById('sum-budgeted'),
    sumSpent: document.getElementById('sum-spent'),
    sumLeft: document.getElementById('sum-left'),
    envGrid: document.getElementById('env-grid'),
    rolloverSlot: document.getElementById('rollover-slot'),
    txList: document.getElementById('tx-list'),
    txCount: document.getElementById('tx-count'),
    openExpense: document.getElementById('open-expense'),
    openNewEnvelope: document.getElementById('open-new-envelope'),
    exportBtn: document.getElementById('export-btn'),
    importBtn: document.getElementById('import-btn'),
    importFile: document.getElementById('import-file'),
    toasts: document.getElementById('toasts'),
    expenseModal: document.getElementById('expense-modal'),
    expenseForm: document.getElementById('expense-form'),
    expAmount: document.getElementById('exp-amount'),
    expEnvelope: document.getElementById('exp-envelope'),
    expNote: document.getElementById('exp-note'),
    expDate: document.getElementById('exp-date'),
    expenseError: document.getElementById('expense-error'),
    envelopeModal: document.getElementById('envelope-modal'),
    envelopeForm: document.getElementById('envelope-form'),
    envelopeTitle: document.getElementById('envelope-title'),
    envId: document.getElementById('env-id'),
    envName: document.getElementById('env-name'),
    envBudget: document.getElementById('env-budget'),
    envSwatches: document.getElementById('env-swatches'),
    envSubmit: document.getElementById('env-submit'),
    envDelete: document.getElementById('env-delete'),
    envelopeError: document.getElementById('envelope-error')
  };

  // ---------- derived ----------

  function spentByEnvelope(month) {
    var map = {};
    month.transactions.forEach(function (t) {
      map[t.envelopeId] = (map[t.envelopeId] || 0) + t.amount;
    });
    return map;
  }

  function remainingPct(budget, spent) {
    if (budget <= 0) return 0;
    return Math.max(0, Math.min(100, ((budget - spent) / budget) * 100));
  }

  function findEnvelope(month, id) {
    for (var i = 0; i < month.envelopes.length; i++) {
      if (month.envelopes[i].id === id) return month.envelopes[i];
    }
    return null;
  }

  // ---------- rendering ----------

  function render() {
    disarm();
    renderMonthNav();
    renderSummary();
    renderEnvelopes();
    renderRollover();
    renderTransactions();
  }

  function renderMonthNav() {
    el.monthLabel.textContent = monthLabel(viewedMonth);
  }

  function renderSummary() {
    var month = peekMonth(viewedMonth);
    var budgeted = month.envelopes.reduce(function (s, e) { return s + e.budget; }, 0);
    var spent = month.transactions.reduce(function (s, t) { return s + t.amount; }, 0);
    var left = budgeted - spent;
    el.sumBudgeted.textContent = peso(budgeted);
    el.sumSpent.textContent = peso(spent);
    el.sumLeft.textContent = peso(left);
    el.sumLeft.classList.toggle('positive', left >= 0);
    el.sumLeft.classList.toggle('negative', left < 0);
  }

  function envelopeCard(env, spent) {
    var over = spent > env.budget;
    var left = env.budget - spent;
    var pct = over ? 100 : remainingPct(env.budget, spent);

    var card = document.createElement('article');
    card.className = 'env-card' + (over ? ' over' : '');
    card.dataset.envId = env.id;
    card.style.setProperty('--env', env.color);

    var head = document.createElement('div');
    head.className = 'env-head';
    var h3 = document.createElement('h3');
    h3.textContent = env.name;
    var edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'env-edit';
    edit.dataset.action = 'edit-envelope';
    edit.dataset.id = env.id;
    edit.setAttribute('aria-label', 'Edit ' + env.name);
    edit.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11.3 2.3a1.5 1.5 0 0 1 2.4 2.4L5.5 13 2 14l1-3.5 8.3-8.2Z"/></svg>';
    head.appendChild(h3);
    head.appendChild(edit);

    var amounts = document.createElement('p');
    amounts.className = 'env-amounts';
    amounts.innerHTML = '<span class="env-spent">' + peso(spent) + '</span> of ' + peso(env.budget);

    var bar = document.createElement('div');
    bar.className = 'env-bar';
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', over
      ? env.name + ' overspent by ' + peso(spent - env.budget)
      : peso(left) + ' left of ' + peso(env.budget));
    var fill = document.createElement('div');
    fill.className = 'env-fill';
    fill.style.width = pct + '%';
    bar.appendChild(fill);

    var status = document.createElement('p');
    if (over) {
      status.className = 'env-over';
      status.textContent = 'over by ' + peso(spent - env.budget);
    } else {
      status.className = 'env-left';
      status.textContent = peso(left) + ' left';
    }

    card.appendChild(head);
    card.appendChild(amounts);
    card.appendChild(bar);
    card.appendChild(status);
    return card;
  }

  function renderEnvelopes() {
    var month = peekMonth(viewedMonth);
    var spentMap = spentByEnvelope(month);
    el.envGrid.textContent = '';

    if (month.envelopes.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'empty-state';
      var p = document.createElement('p');
      p.textContent = 'No envelopes for ' + monthLabel(viewedMonth) + ' yet.';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-ghost';
      btn.dataset.action = 'new-envelope';
      btn.textContent = '+ New envelope';
      empty.appendChild(p);
      empty.appendChild(btn);
      el.envGrid.appendChild(empty);
      return;
    }

    month.envelopes.forEach(function (env) {
      el.envGrid.appendChild(envelopeCard(env, spentMap[env.id] || 0));
    });
  }

  function nearestEarlierMonthWithEnvelopes() {
    var keys = Object.keys(data.months).filter(function (k) {
      return k < viewedMonth && data.months[k].envelopes.length > 0;
    }).sort();
    return keys.length ? keys[keys.length - 1] : null;
  }

  function renderRollover() {
    el.rolloverSlot.textContent = '';
    var month = peekMonth(viewedMonth);
    if (month.envelopes.length > 0 || month.transactions.length > 0) return;
    var source = nearestEarlierMonthWithEnvelopes();
    if (!source) return;

    var box = document.createElement('div');
    box.className = 'rollover-offer';
    var p = document.createElement('p');
    p.textContent = 'Start ' + monthLabel(viewedMonth) + ' with last month’s plan?';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-primary';
    btn.dataset.action = 'rollover';
    btn.dataset.source = source;
    btn.textContent = 'Copy envelopes from ' + monthLabel(source);
    box.appendChild(p);
    box.appendChild(btn);
    el.rolloverSlot.appendChild(box);
  }

  function renderTransactions() {
    var month = peekMonth(viewedMonth);
    var txs = month.transactions.slice().sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return b.createdAt - a.createdAt;
    });

    el.txCount.textContent = txs.length ? txs.length + (txs.length === 1 ? ' entry' : ' entries') : '';
    el.txList.textContent = '';

    if (txs.length === 0) {
      var li = document.createElement('li');
      li.className = 'tx-empty';
      li.textContent = 'No expenses logged this month.';
      el.txList.appendChild(li);
      return;
    }

    txs.forEach(function (t) {
      var env = findEnvelope(month, t.envelopeId);
      var li = document.createElement('li');
      li.className = 'tx';

      var main = document.createElement('div');
      main.className = 'tx-main';
      var note = document.createElement('span');
      note.className = 'tx-note';
      note.textContent = t.note || (env ? env.name : 'Expense');
      var chip = document.createElement('span');
      chip.className = 'tx-chip';
      chip.textContent = env ? env.name : 'Deleted envelope';
      if (env) chip.style.setProperty('--env', env.color);
      main.appendChild(note);
      main.appendChild(chip);

      var side = document.createElement('div');
      side.className = 'tx-side';
      var date = document.createElement('span');
      date.className = 'tx-date';
      date.textContent = shortDate(t.date);
      var amt = document.createElement('span');
      amt.className = 'tx-amt';
      amt.textContent = '−' + peso(t.amount);
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'tx-del';
      del.dataset.action = 'delete-tx';
      del.dataset.id = t.id;
      del.setAttribute('aria-label', 'Delete expense ' + (t.note || peso(t.amount)));
      del.innerHTML = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m4 4 8 8M12 4l-8 8"/></svg>';
      side.appendChild(date);
      side.appendChild(amt);
      side.appendChild(del);

      li.appendChild(main);
      li.appendChild(side);
      el.txList.appendChild(li);
    });
  }

  // animate an envelope's bar from a previous remaining-pct to its rendered value
  function animateEnvelopeBar(envId, fromPct) {
    if (reducedMotion.matches) return;
    var card = el.envGrid.querySelector('[data-env-id="' + envId + '"]');
    if (!card) return;
    var fill = card.querySelector('.env-fill');
    var toPct = fill.style.width;
    fill.style.transition = 'none';
    fill.style.width = fromPct + '%';
    void fill.offsetWidth; // force reflow
    fill.style.transition = '';
    fill.style.width = toPct;
    card.classList.remove('pulse');
    void card.offsetWidth;
    card.classList.add('pulse');
  }

  // ---------- toasts ----------

  function toast(message) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = message;
    el.toasts.appendChild(t);
    window.setTimeout(function () {
      if (t.parentNode) t.parentNode.removeChild(t);
    }, 3500);
  }

  // ---------- modals ----------

  var openModal = null;

  function showModal(backdrop, focusTarget) {
    lastFocused = document.activeElement;
    backdrop.hidden = false;
    openModal = backdrop;
    if (focusTarget) focusTarget.focus();
  }

  function closeModal() {
    if (!openModal) return;
    openModal.hidden = true;
    openModal = null;
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    lastFocused = null;
  }

  function trapFocus(e) {
    if (!openModal || e.key !== 'Tab') return;
    var focusables = openModal.querySelectorAll(
      'button:not([hidden]), input:not([type="hidden"]):not([hidden]), select, a[href], [tabindex]:not([tabindex="-1"])'
    );
    var list = Array.prototype.filter.call(focusables, function (n) {
      return n.offsetParent !== null || n === document.activeElement;
    });
    if (list.length === 0) return;
    var first = list[0];
    var last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // ---------- expense modal ----------

  function openExpenseModal() {
    var month = peekMonth(viewedMonth);
    if (month.envelopes.length === 0) {
      toast('Create an envelope first');
      return;
    }
    el.expEnvelope.textContent = '';
    month.envelopes.forEach(function (env) {
      var opt = document.createElement('option');
      opt.value = env.id;
      opt.textContent = env.name;
      el.expEnvelope.appendChild(opt);
    });

    var dim = daysInMonth(viewedMonth);
    var min = viewedMonth + '-01';
    var max = viewedMonth + '-' + pad2(dim);
    el.expDate.min = min;
    el.expDate.max = max;
    var today = todayISO();
    el.expDate.value = (today >= min && today <= max) ? today : (today > max ? max : min);

    el.expAmount.value = '';
    el.expNote.value = '';
    el.expenseError.hidden = true;
    showModal(el.expenseModal, el.expAmount);
  }

  function submitExpense(e) {
    e.preventDefault();
    var amount = parseFloat(el.expAmount.value);
    var envelopeId = el.expEnvelope.value;
    var date = el.expDate.value;
    var min = el.expDate.min;
    var max = el.expDate.max;

    var error = null;
    if (!isFinite(amount) || amount <= 0) error = 'Enter an amount greater than ₱0.';
    else if (!envelopeId || !findEnvelope(peekMonth(viewedMonth), envelopeId)) error = 'Pick an envelope.';
    else if (!date || date < min || date > max) error = 'Date must be within ' + monthLabel(viewedMonth) + '.';

    if (error) {
      el.expenseError.textContent = error;
      el.expenseError.hidden = false;
      return;
    }

    amount = Math.round(amount * 100) / 100;
    var month = getMonth(viewedMonth);
    var spentMap = spentByEnvelope(month);
    var env = findEnvelope(month, envelopeId);
    var oldPct = spentMap[envelopeId] > env.budget
      ? 100
      : remainingPct(env.budget, spentMap[envelopeId] || 0);

    month.transactions.push({
      id: uid(),
      envelopeId: envelopeId,
      amount: amount,
      note: el.expNote.value.trim(),
      date: date,
      createdAt: Date.now()
    });
    saveData();
    closeModal();
    render();
    animateEnvelopeBar(envelopeId, oldPct);
    toast(peso(amount) + ' from ' + env.name);
  }

  // ---------- envelope modal ----------

  function buildSwatches(selectedHex) {
    el.envSwatches.textContent = '';
    PALETTE.forEach(function (c, i) {
      var label = document.createElement('label');
      label.className = 'swatch';
      var input = document.createElement('input');
      input.type = 'radio';
      input.name = 'color';
      input.value = c.hex;
      input.checked = selectedHex ? c.hex === selectedHex : i === 0;
      var dot = document.createElement('span');
      dot.style.background = c.hex;
      dot.title = c.name;
      var sr = document.createElement('span');
      sr.className = 'visually-hidden';
      sr.textContent = c.name;
      label.appendChild(input);
      label.appendChild(dot);
      label.appendChild(sr);
      el.envSwatches.appendChild(label);
    });
  }

  function openEnvelopeModal(envId) {
    var month = peekMonth(viewedMonth);
    var env = envId ? findEnvelope(month, envId) : null;
    el.envId.value = env ? env.id : '';
    el.envName.value = env ? env.name : '';
    el.envBudget.value = env ? String(env.budget) : '';
    buildSwatches(env ? env.color : null);
    el.envelopeTitle.textContent = env ? 'Edit envelope' : 'New envelope';
    el.envSubmit.textContent = env ? 'Save changes' : 'Create envelope';
    el.envDelete.hidden = !env;
    el.envDelete.textContent = 'Delete envelope';
    el.envDelete.classList.remove('armed');
    delete el.envDelete.dataset.armed;
    el.envelopeError.hidden = true;
    showModal(el.envelopeModal, el.envName);
  }

  function submitEnvelope(e) {
    e.preventDefault();
    var name = el.envName.value.trim();
    var budget = parseFloat(el.envBudget.value);
    var colorInput = el.envSwatches.querySelector('input:checked');
    var color = colorInput ? colorInput.value : PALETTE[0].hex;

    var error = null;
    if (!name) error = 'Give the envelope a name.';
    else if (!isFinite(budget) || budget <= 0) error = 'Budget must be greater than ₱0.';

    if (error) {
      el.envelopeError.textContent = error;
      el.envelopeError.hidden = false;
      return;
    }

    budget = Math.round(budget * 100) / 100;
    var month = getMonth(viewedMonth);
    var existing = el.envId.value ? findEnvelope(month, el.envId.value) : null;

    if (existing) {
      existing.name = name;
      existing.budget = budget;
      existing.color = color;
      toast('Envelope updated');
    } else {
      month.envelopes.push({ id: uid(), name: name, budget: budget, color: color });
      toast('Envelope "' + name + '" created');
    }
    saveData();
    closeModal();
    render();
  }

  function deleteEnvelope() {
    var id = el.envId.value;
    var month = getMonth(viewedMonth);
    var env = findEnvelope(month, id);
    if (!env) { closeModal(); return; }
    month.envelopes = month.envelopes.filter(function (x) { return x.id !== id; });
    month.transactions = month.transactions.filter(function (t) { return t.envelopeId !== id; });
    saveData();
    closeModal();
    render();
    toast('Envelope "' + env.name + '" deleted');
  }

  // ---------- transaction delete (two-step confirm) ----------

  function disarm() {
    if (!armedButton) return;
    var btn = armedButton;
    armedButton = null;
    delete btn.dataset.armed;
    btn.classList.remove('armed');
    if (btn.dataset.action === 'delete-tx') {
      btn.innerHTML = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m4 4 8 8M12 4l-8 8"/></svg>';
    } else {
      btn.textContent = 'Delete envelope';
    }
  }

  function arm(btn, label) {
    disarm();
    armedButton = btn;
    btn.dataset.armed = '1';
    btn.classList.add('armed');
    btn.textContent = label;
    window.setTimeout(function () {
      if (armedButton === btn) disarm();
    }, 4000);
  }

  function deleteTransaction(id) {
    var month = getMonth(viewedMonth);
    var tx = null;
    for (var i = 0; i < month.transactions.length; i++) {
      if (month.transactions[i].id === id) { tx = month.transactions[i]; break; }
    }
    if (!tx) return;
    var env = findEnvelope(month, tx.envelopeId);
    var spentMap = spentByEnvelope(month);
    var oldPct = null;
    if (env) {
      oldPct = spentMap[env.id] > env.budget ? 100 : remainingPct(env.budget, spentMap[env.id] || 0);
    }
    month.transactions = month.transactions.filter(function (t) { return t.id !== id; });
    saveData();
    render();
    if (env && oldPct !== null) animateEnvelopeBar(env.id, oldPct);
    toast(peso(tx.amount) + ' refunded' + (env ? ' to ' + env.name : ''));
  }

  // ---------- rollover ----------

  function rolloverFrom(sourceKey) {
    var source = peekMonth(sourceKey);
    var month = getMonth(viewedMonth);
    if (month.envelopes.length > 0) return;
    month.envelopes = source.envelopes.map(function (env) {
      return { id: uid(), name: env.name, budget: env.budget, color: env.color };
    });
    saveData();
    render();
    toast(month.envelopes.length + ' envelopes copied from ' + monthLabel(sourceKey));
  }

  // ---------- export / import ----------

  function exportJSON() {
    var payload = JSON.stringify(data, null, 2);
    var blob = new Blob([payload], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'pera-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('Exported ' + Object.keys(data.months).length + ' month(s)');
  }

  function isValidEnvelope(e) {
    return e && typeof e === 'object' &&
      typeof e.id === 'string' && e.id &&
      typeof e.name === 'string' && e.name &&
      typeof e.budget === 'number' && isFinite(e.budget) && e.budget > 0 &&
      typeof e.color === 'string';
  }

  function isValidTransaction(t) {
    return t && typeof t === 'object' &&
      typeof t.id === 'string' && t.id &&
      typeof t.envelopeId === 'string' &&
      typeof t.amount === 'number' && isFinite(t.amount) && t.amount > 0 &&
      typeof t.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.date);
  }

  function validateImport(obj) {
    if (!obj || typeof obj !== 'object' || !obj.months || typeof obj.months !== 'object' || Array.isArray(obj.months)) {
      return null;
    }
    var clean = { months: {} };
    var keys = Object.keys(obj.months);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (!/^\d{4}-\d{2}$/.test(key)) return null;
      var m = obj.months[key];
      if (!m || typeof m !== 'object' || !Array.isArray(m.envelopes) || !Array.isArray(m.transactions)) return null;
      if (!m.envelopes.every(isValidEnvelope)) return null;
      if (!m.transactions.every(isValidTransaction)) return null;
      clean.months[key] = {
        envelopes: m.envelopes.map(function (e) {
          return { id: e.id, name: e.name, budget: e.budget, color: e.color };
        }),
        transactions: m.transactions.map(function (t) {
          return {
            id: t.id,
            envelopeId: t.envelopeId,
            amount: t.amount,
            note: typeof t.note === 'string' ? t.note : '',
            date: t.date,
            createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now()
          };
        })
      };
    }
    return clean;
  }

  function mergeImport(incoming) {
    var added = 0, merged = 0;
    Object.keys(incoming.months).forEach(function (key) {
      if (!data.months[key]) {
        data.months[key] = incoming.months[key];
        added++;
        return;
      }
      var mine = data.months[key];
      var theirs = incoming.months[key];
      var envIds = {}, txIds = {};
      mine.envelopes.forEach(function (e) { envIds[e.id] = true; });
      mine.transactions.forEach(function (t) { txIds[t.id] = true; });
      theirs.envelopes.forEach(function (e) { if (!envIds[e.id]) mine.envelopes.push(e); });
      theirs.transactions.forEach(function (t) { if (!txIds[t.id]) mine.transactions.push(t); });
      merged++;
    });
    return { added: added, merged: merged };
  }

  function importJSON(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var parsed;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch (err) {
        toast('Import failed: not valid JSON');
        return;
      }
      var clean = validateImport(parsed);
      if (!clean) {
        toast('Import failed: unrecognized data shape');
        return;
      }
      var result = mergeImport(clean);
      saveData();
      render();
      toast('Imported: ' + result.added + ' month(s) added, ' + result.merged + ' merged');
    };
    reader.onerror = function () { toast('Import failed: could not read file'); };
    reader.readAsText(file);
  }

  // ---------- events ----------

  el.prevMonth.addEventListener('click', function () {
    viewedMonth = shiftMonth(viewedMonth, -1);
    render();
  });

  el.nextMonth.addEventListener('click', function () {
    viewedMonth = shiftMonth(viewedMonth, 1);
    render();
  });

  el.openExpense.addEventListener('click', openExpenseModal);
  el.openNewEnvelope.addEventListener('click', function () { openEnvelopeModal(null); });
  el.expenseForm.addEventListener('submit', submitExpense);
  el.envelopeForm.addEventListener('submit', submitEnvelope);
  el.exportBtn.addEventListener('click', exportJSON);
  el.importBtn.addEventListener('click', function () { el.importFile.click(); });

  el.importFile.addEventListener('change', function () {
    if (el.importFile.files && el.importFile.files[0]) {
      importJSON(el.importFile.files[0]);
    }
    el.importFile.value = '';
  });

  // delegated clicks (envelope grid, transactions, rollover, modals)
  document.addEventListener('click', function (e) {
    var target = e.target instanceof Element ? e.target : null;
    if (!target) return;

    var closeBtn = target.closest('[data-close-modal]');
    if (closeBtn) { closeModal(); return; }

    // click on the dimmed backdrop closes the modal
    if (openModal && target === openModal) { closeModal(); return; }

    var actionEl = target.closest('[data-action]');
    if (!actionEl) {
      disarm();
      return;
    }

    var action = actionEl.dataset.action;
    if (action === 'edit-envelope') {
      openEnvelopeModal(actionEl.dataset.id);
    } else if (action === 'new-envelope') {
      openEnvelopeModal(null);
    } else if (action === 'rollover') {
      rolloverFrom(actionEl.dataset.source);
    } else if (action === 'delete-envelope') {
      if (actionEl.dataset.armed) {
        disarm();
        deleteEnvelope();
      } else {
        arm(actionEl, 'Really delete? Expenses go too');
      }
    } else if (action === 'delete-tx') {
      if (actionEl.dataset.armed) {
        disarm();
        deleteTransaction(actionEl.dataset.id);
      } else {
        arm(actionEl, 'Delete?');
      }
    } else {
      disarm();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openModal) {
      e.preventDefault();
      closeModal();
      return;
    }
    trapFocus(e);
  });

  // ---------- init ----------

  seedIfNeeded();
  render();
})();

/* LISTAHAN — drag-and-drop kanban with WIP limits.
   Vanilla JS, no dependencies. State lives in localStorage. */
(function () {
  'use strict';

  var STORE_KEY = 'listahan.board.v1';
  var SEED_KEY = 'listahan.seeded.v1';

  var LABEL_COLORS = {
    blue: '#2B5BD7',
    green: '#2E8A5C',
    orange: '#D07A2E',
    red: '#C24914',
    purple: '#7A4FBF',
    gray: '#79746A'
  };

  var state = null;
  var filters = { labels: new Set(), q: '' };

  /* ---------- utilities ---------- */

  function uid() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function todayISO(offsetDays) {
    var d = new Date();
    if (offsetDays) d.setDate(d.getDate() + offsetDays);
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function isOverdue(due) {
    return !!due && due < todayISO(0);
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (err) {
      toast('Could not save (storage unavailable)');
    }
  }

  function toast(message) {
    var region = document.getElementById('toast-region');
    var t = el('div', 'toast', message);
    region.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }

  /* ---------- state helpers ---------- */

  function defaultLabels() {
    return [
      { id: 'blue', name: 'Design', color: LABEL_COLORS.blue },
      { id: 'green', name: 'Build', color: LABEL_COLORS.green },
      { id: 'orange', name: 'Fix', color: LABEL_COLORS.orange },
      { id: 'red', name: 'Learn', color: LABEL_COLORS.red },
      { id: 'purple', name: 'Admin', color: LABEL_COLORS.purple },
      { id: 'gray', name: 'Idea', color: LABEL_COLORS.gray }
    ];
  }

  function seedBoard() {
    var now = Date.now();
    var day = 86400000;
    var gagawin = { id: uid(), name: 'Gagawin', wipLimit: null };
    var ginagawa = { id: uid(), name: 'Ginagawa', wipLimit: 3 };
    var tapos = { id: uid(), name: 'Tapos', wipLimit: null };

    function card(colId, order, title, note, labelId, due, movedToDoneAt) {
      return {
        id: uid(), columnId: colId, title: title, note: note || '',
        labelId: labelId || null, due: due || null, order: order,
        createdAt: now - order * 1000, movedToDoneAt: movedToDoneAt || null
      };
    }

    return {
      columns: [gagawin, ginagawa, tapos],
      labels: defaultLabels(),
      cards: [
        card(gagawin.id, 0, 'QA static sites in browser', 'Click every link and form on the shop pages at 360px.', 'orange', todayISO(2)),
        card(gagawin.id, 1, 'Write GAWA case study', 'Short write-up: why a shipping log, what it taught me.', 'blue'),
        card(gagawin.id, 2, 'Record demo clips of the lab', 'One short screen capture per working prototype.', 'purple', todayISO(6)),
        card(gagawin.id, 3, 'Try a print stylesheet for the resume', '', 'gray'),
        card(ginagawa.id, 0, 'Ship PERA budget app', 'Final pass on envelope math, then link it from the lab.', 'green', todayISO(1)),
        card(ginagawa.id, 1, 'Build LISTAHAN drag and drop', 'Native HTML5 drag on desktop, pointer fallback on touch.', 'green'),
        card(ginagawa.id, 2, 'Learn the Pointer Events API', 'setPointerCapture, pointercancel, and touch-action rules.', 'red'),
        card(tapos.id, 0, 'Convert lab to mobile-first CSS', 'Base styles for small screens, min-width queries only.', 'green', null, now - 2 * day),
        card(tapos.id, 1, 'Strip PII from resume page', 'No phone, no street address, contact form only.', 'orange', null, now - 4 * day),
        card(tapos.id, 2, 'Pick the Prototype Lab type pairing', '', 'blue', null, now - 12 * day)
      ]
    };
  }

  function loadState() {
    var raw = null;
    try { raw = localStorage.getItem(STORE_KEY); } catch (err) { raw = null; }
    if (raw) {
      try {
        var parsed = JSON.parse(raw);
        var cleaned = validateBoard(parsed);
        if (cleaned) { state = cleaned; return; }
      } catch (err) { /* fall through to seed */ }
    }
    state = seedBoard();
    try { localStorage.setItem(SEED_KEY, '1'); } catch (err) { /* ignore */ }
    save();
  }

  /* Validate + normalize an imported/stored board. Returns clean state or null. */
  function validateBoard(data) {
    if (!data || typeof data !== 'object') return null;
    if (!Array.isArray(data.columns) || !Array.isArray(data.cards) || !Array.isArray(data.labels)) return null;

    var columns = data.columns.filter(function (c) {
      return c && typeof c.id === 'string' && typeof c.name === 'string' && c.name.length > 0;
    }).map(function (c) {
      var limit = (typeof c.wipLimit === 'number' && c.wipLimit > 0) ? Math.floor(c.wipLimit) : null;
      return { id: c.id, name: String(c.name).slice(0, 60), wipLimit: limit };
    });
    if (columns.length === 0) return null;

    var labels = data.labels.filter(function (l) {
      return l && typeof l.id === 'string' && LABEL_COLORS[l.id];
    }).map(function (l) {
      return { id: l.id, name: String(l.name || l.id).slice(0, 30), color: LABEL_COLORS[l.id] };
    });
    // Ensure all six labels exist.
    defaultLabels().forEach(function (def) {
      if (!labels.some(function (l) { return l.id === def.id; })) labels.push(def);
    });

    var colIds = {};
    columns.forEach(function (c) { colIds[c.id] = true; });

    var cards = data.cards.filter(function (c) {
      return c && typeof c.id === 'string' && colIds[c.columnId] &&
        typeof c.title === 'string' && c.title.length > 0;
    }).map(function (c, i) {
      return {
        id: c.id,
        columnId: c.columnId,
        title: String(c.title).slice(0, 140),
        note: typeof c.note === 'string' ? c.note.slice(0, 500) : '',
        labelId: LABEL_COLORS[c.labelId] ? c.labelId : null,
        due: (typeof c.due === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(c.due)) ? c.due : null,
        order: typeof c.order === 'number' ? c.order : i,
        createdAt: typeof c.createdAt === 'number' ? c.createdAt : Date.now(),
        movedToDoneAt: typeof c.movedToDoneAt === 'number' ? c.movedToDoneAt : null
      };
    });

    return { columns: columns, labels: labels, cards: cards };
  }

  function cardsIn(columnId) {
    return state.cards
      .filter(function (c) { return c.columnId === columnId; })
      .sort(function (a, b) { return a.order - b.order; });
  }

  function getLabel(labelId) {
    for (var i = 0; i < state.labels.length; i++) {
      if (state.labels[i].id === labelId) return state.labels[i];
    }
    return null;
  }

  function getColumn(columnId) {
    for (var i = 0; i < state.columns.length; i++) {
      if (state.columns[i].id === columnId) return state.columns[i];
    }
    return null;
  }

  function getCard(cardId) {
    for (var i = 0; i < state.cards.length; i++) {
      if (state.cards[i].id === cardId) return state.cards[i];
    }
    return null;
  }

  function lastColumnId() {
    return state.columns[state.columns.length - 1].id;
  }

  /* Move a card to targetColumnId at targetIndex (index among that column's cards). */
  function moveCard(cardId, targetColumnId, targetIndex) {
    var card = getCard(cardId);
    if (!card || !getColumn(targetColumnId)) return;

    var fromColumnId = card.columnId;
    var target = cardsIn(targetColumnId).filter(function (c) { return c.id !== cardId; });
    if (targetIndex < 0) targetIndex = 0;
    if (targetIndex > target.length) targetIndex = target.length;
    target.splice(targetIndex, 0, card);

    card.columnId = targetColumnId;
    target.forEach(function (c, i) { c.order = i; });
    // Re-pack the source column's order too.
    if (fromColumnId !== targetColumnId) {
      cardsIn(fromColumnId).forEach(function (c, i) { c.order = i; });
      var doneId = lastColumnId();
      if (targetColumnId === doneId) {
        card.movedToDoneAt = Date.now();
      } else if (fromColumnId === doneId) {
        card.movedToDoneAt = null;
      }
    }
    save();
    render();
  }

  /* ---------- rendering ---------- */

  function render() {
    renderBoard();
    renderFilterChips();
    renderStats();
    applyFilters();
  }

  function renderStats() {
    var total = state.cards.length;
    var weekAgo = Date.now() - 7 * 86400000;
    var doneId = lastColumnId();
    var doneThisWeek = state.cards.filter(function (c) {
      return c.columnId === doneId && c.movedToDoneAt && c.movedToDoneAt >= weekAgo;
    }).length;
    document.getElementById('board-stats').textContent =
      total + ' card' + (total === 1 ? '' : 's') + ' · ' + doneThisWeek + ' done this week';
  }

  function renderFilterChips() {
    var wrap = document.getElementById('filter-chips');
    wrap.textContent = '';
    state.labels.forEach(function (label) {
      var chip = el('button', 'chip');
      chip.type = 'button';
      chip.dataset.labelId = label.id;
      chip.style.setProperty('--chip-color', label.color);
      chip.setAttribute('aria-pressed', filters.labels.has(label.id) ? 'true' : 'false');
      chip.appendChild(el('span', 'dot'));
      chip.appendChild(document.createTextNode(label.name));
      wrap.appendChild(chip);
    });
  }

  function renderBoard() {
    var board = document.getElementById('board');
    board.textContent = '';
    state.columns.forEach(function (column) {
      board.appendChild(buildColumn(column));
    });
  }

  function buildColumn(column) {
    var cards = cardsIn(column.id);
    var over = column.wipLimit !== null && cards.length > column.wipLimit;

    var section = el('section', 'column' + (over ? ' over-wip' : ''));
    section.dataset.columnId = column.id;
    section.setAttribute('aria-label', column.name);

    var header = el('div', 'column-header');
    var title = el('button', 'column-title', column.name);
    title.type = 'button';
    title.dataset.action = 'rename-column';
    title.title = 'Rename column';
    header.appendChild(title);

    var wip = el('button', 'wip-count');
    wip.type = 'button';
    wip.dataset.action = 'edit-wip';
    wip.textContent = cards.length + ' / ' + (column.wipLimit === null ? '—' : column.wipLimit);
    wip.setAttribute('aria-label', 'Cards: ' + cards.length +
      (column.wipLimit === null ? ', no WIP limit' : ' of ' + column.wipLimit + ' WIP limit') +
      '. Edit WIP limit');
    header.appendChild(wip);

    var del = el('button', 'column-delete');
    del.type = 'button';
    del.dataset.action = 'delete-column';
    del.setAttribute('aria-label', 'Delete column ' + column.name);
    del.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
    header.appendChild(del);

    section.appendChild(header);

    if (over) {
      section.appendChild(el('p', 'wip-note', 'over WIP limit'));
    }

    var list = el('ul', 'card-list');
    list.dataset.columnId = column.id;
    cards.forEach(function (card) {
      list.appendChild(buildCard(card));
    });
    section.appendChild(list);

    var add = el('button', 'add-card', '+ card');
    add.type = 'button';
    add.dataset.action = 'add-card';
    add.setAttribute('aria-label', 'Add card to ' + column.name);
    section.appendChild(add);

    return section;
  }

  function buildCard(card) {
    var li = el('li', 'card');
    li.dataset.cardId = card.id;
    li.draggable = true;
    li.tabIndex = 0;
    li.setAttribute('role', 'group');
    li.setAttribute('aria-label', card.title + '. Press Enter to edit.');

    var label = card.labelId ? getLabel(card.labelId) : null;
    if (label) li.style.setProperty('--label-color', label.color);

    var top = el('div', 'card-top');
    top.appendChild(el('p', 'card-title', card.title));
    var move = el('button', 'card-move');
    move.type = 'button';
    move.dataset.action = 'move-card';
    move.setAttribute('aria-label', 'Move card: ' + card.title);
    move.setAttribute('aria-haspopup', 'menu');
    move.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M8 1.5 10.5 4h-5L8 1.5zM8 14.5 5.5 12h5L8 14.5zM1.5 8 4 5.5v5L1.5 8zM14.5 8 12 10.5v-5L14.5 8z" fill="currentColor"/></svg>';
    top.appendChild(move);
    li.appendChild(top);

    if (card.note) li.appendChild(el('p', 'card-note', card.note));

    var meta = el('div', 'card-meta');
    if (label) {
      var chip = el('span', 'label-chip', label.name);
      chip.style.setProperty('--label-color', label.color);
      meta.appendChild(chip);
    }
    if (card.due) {
      var due = el('span', 'due-chip' + (isOverdue(card.due) ? ' overdue' : ''), card.due);
      if (isOverdue(card.due)) due.setAttribute('aria-label', 'Overdue: ' + card.due);
      meta.appendChild(due);
    }
    if (meta.childNodes.length) li.appendChild(meta);

    return li;
  }

  /* ---------- filters ---------- */

  function cardMatchesFilters(card) {
    if (filters.labels.size > 0 && !filters.labels.has(card.labelId)) return false;
    if (filters.q) {
      var hay = (card.title + ' ' + card.note).toLowerCase();
      if (hay.indexOf(filters.q) === -1) return false;
    }
    return true;
  }

  function applyFilters() {
    var nodes = document.querySelectorAll('#board .card');
    for (var i = 0; i < nodes.length; i++) {
      var card = getCard(nodes[i].dataset.cardId);
      nodes[i].classList.toggle('faded', !!card && !cardMatchesFilters(card));
    }
  }

  /* ---------- overlays: generic open/close with focus return ---------- */

  var openOverlay = null; // { el, lastFocus, onClose }

  function showOverlay(overlayEl, focusEl, onClose) {
    openOverlay = { el: overlayEl, lastFocus: document.activeElement, onClose: onClose || null };
    overlayEl.hidden = false;
    if (focusEl) focusEl.focus();
  }

  function closeOverlay() {
    if (!openOverlay) return;
    var o = openOverlay;
    openOverlay = null;
    o.el.hidden = true;
    if (o.onClose) o.onClose();
    if (o.lastFocus && document.contains(o.lastFocus)) o.lastFocus.focus();
  }

  /* ---------- confirm dialog ---------- */

  var confirmCallback = null;

  function showConfirm(message, onConfirm) {
    document.getElementById('confirm-message').textContent = message;
    confirmCallback = onConfirm;
    showOverlay(document.getElementById('confirm-overlay'), document.getElementById('confirm-ok'));
  }

  /* ---------- card editor ---------- */

  var editingCardId = null;

  function openCardEditor(cardId) {
    var card = getCard(cardId);
    if (!card) return;
    editingCardId = cardId;
    document.getElementById('card-panel-title').textContent = 'Edit card';
    document.getElementById('card-title').value = card.title;
    document.getElementById('card-note').value = card.note;
    document.getElementById('card-due').value = card.due || '';
    document.getElementById('card-delete').hidden = false;
    buildLabelPicker(card.labelId);
    showOverlay(document.getElementById('card-overlay'), document.getElementById('card-title'));
  }

  function buildLabelPicker(selectedId) {
    var picker = document.getElementById('card-label-picker');
    picker.textContent = '';
    var noneWrap = el('label');
    var noneInput = document.createElement('input');
    noneInput.type = 'radio';
    noneInput.name = 'card-label';
    noneInput.value = '';
    noneInput.checked = !selectedId;
    noneWrap.appendChild(noneInput);
    noneWrap.appendChild(document.createTextNode('None'));
    picker.appendChild(noneWrap);

    state.labels.forEach(function (label) {
      var wrap = el('label');
      wrap.style.setProperty('--chip-color', label.color);
      var input = document.createElement('input');
      input.type = 'radio';
      input.name = 'card-label';
      input.value = label.id;
      input.checked = selectedId === label.id;
      wrap.appendChild(input);
      wrap.appendChild(el('span', 'dot'));
      wrap.appendChild(document.createTextNode(label.name));
      picker.appendChild(wrap);
    });
  }

  function saveCardEditor() {
    var title = document.getElementById('card-title').value.trim();
    if (!title) return;
    var note = document.getElementById('card-note').value.trim();
    var due = document.getElementById('card-due').value || null;
    var checked = document.querySelector('#card-label-picker input:checked');
    var labelId = checked && checked.value ? checked.value : null;

    var card = getCard(editingCardId);
    if (card) {
      card.title = title;
      card.note = note;
      card.due = due;
      card.labelId = labelId;
      save();
      render();
      toast('Card saved');
    }
    closeOverlay();
  }

  /* ---------- labels editor ---------- */

  function openLabelsEditor() {
    var list = document.getElementById('labels-list');
    list.textContent = '';
    state.labels.forEach(function (label) {
      var row = el('div', 'label-edit-row');
      var dot = el('span', 'dot');
      dot.style.background = label.color;
      row.appendChild(dot);
      var input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 30;
      input.required = true;
      input.value = label.name;
      input.dataset.labelId = label.id;
      input.setAttribute('aria-label', 'Name for ' + label.id + ' label');
      row.appendChild(input);
      list.appendChild(row);
    });
    var first = list.querySelector('input');
    showOverlay(document.getElementById('labels-overlay'), first);
  }

  /* ---------- column rename / WIP edit (inline) ---------- */

  function startColumnRename(titleBtn, columnId) {
    var column = getColumn(columnId);
    if (!column) return;
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'column-title-input';
    input.value = column.name;
    input.maxLength = 60;
    input.setAttribute('aria-label', 'Column name');
    titleBtn.replaceWith(input);
    input.focus();
    input.select();

    var done = false;
    function commit(saveIt) {
      if (done) return;
      done = true;
      var name = input.value.trim();
      if (saveIt && name) {
        column.name = name;
        save();
      }
      render();
    }
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); commit(true); }
      else if (e.key === 'Escape') { e.stopPropagation(); commit(false); }
    });
    input.addEventListener('blur', function () { commit(true); });
  }

  function startWipEdit(wipBtn, columnId) {
    var column = getColumn(columnId);
    if (!column) return;
    var input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.step = '1';
    input.className = 'wip-input';
    input.value = column.wipLimit === null ? '' : column.wipLimit;
    input.placeholder = 'none';
    input.setAttribute('aria-label', 'WIP limit (blank for none)');
    wipBtn.replaceWith(input);
    input.focus();
    input.select();

    var done = false;
    function commit(saveIt) {
      if (done) return;
      done = true;
      if (saveIt) {
        var n = parseInt(input.value, 10);
        column.wipLimit = (isFinite(n) && n > 0) ? n : null;
        save();
      }
      render();
    }
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); commit(true); }
      else if (e.key === 'Escape') { e.stopPropagation(); commit(false); }
    });
    input.addEventListener('blur', function () { commit(true); });
  }

  /* ---------- quick-add card ---------- */

  function startQuickAdd(addBtn, columnId) {
    var wrap = el('div', 'quick-add');
    var input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 140;
    input.placeholder = 'Card title, then Enter';
    input.setAttribute('aria-label', 'New card title');
    wrap.appendChild(input);
    addBtn.replaceWith(wrap);
    input.focus();

    var done = false;
    function close() {
      if (done) return;
      done = true;
      render();
    }
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var title = input.value.trim();
        if (!title) return;
        done = true; // the input is about to be replaced; suppress the blur handler
        var order = cardsIn(columnId).length;
        state.cards.push({
          id: uid(), columnId: columnId, title: title, note: '',
          labelId: null, due: null, order: order,
          createdAt: Date.now(),
          movedToDoneAt: columnId === lastColumnId() ? Date.now() : null
        });
        save();
        render();
        // Reopen quick-add on the same column so several cards can be typed in a row.
        var section = document.querySelector('.column[data-column-id="' + columnId + '"]');
        var btn = section && section.querySelector('.add-card');
        if (btn) startQuickAdd(btn, columnId);
      } else if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    });
    input.addEventListener('blur', function () { close(); });
  }

  /* ---------- move menu (keyboard-accessible move) ---------- */

  var moveMenuFor = null; // card id

  function openMoveMenu(button, cardId) {
    var menu = document.getElementById('move-menu');
    var card = getCard(cardId);
    if (!card) return;
    moveMenuFor = cardId;
    menu.textContent = '';

    var siblings = cardsIn(card.columnId);
    var index = siblings.findIndex(function (c) { return c.id === cardId; });

    function item(text, handler, disabled) {
      var b = el('button', null, text);
      b.type = 'button';
      b.setAttribute('role', 'menuitem');
      if (disabled) b.disabled = true;
      b.addEventListener('click', function () {
        closeMoveMenu(false);
        handler();
      });
      menu.appendChild(b);
      return b;
    }

    item('Move up', function () { moveCard(cardId, card.columnId, index - 1); refocusMove(cardId); }, index === 0);
    item('Move down', function () { moveCard(cardId, card.columnId, index + 1); refocusMove(cardId); }, index === siblings.length - 1);

    var others = state.columns.filter(function (c) { return c.id !== card.columnId; });
    if (others.length) {
      menu.appendChild(el('hr', 'menu-sep'));
      others.forEach(function (col) {
        item('To: ' + col.name, function () {
          moveCard(cardId, col.id, cardsIn(col.id).length);
          refocusMove(cardId);
          toast('Moved to ' + col.name);
        });
      });
    }

    menu.hidden = false;
    var rect = button.getBoundingClientRect();
    var menuRect = menu.getBoundingClientRect();
    var left = Math.min(rect.left, window.innerWidth - menuRect.width - 8);
    var top = rect.bottom + 6;
    if (top + menuRect.height > window.innerHeight - 8) {
      top = Math.max(8, rect.top - menuRect.height - 6);
    }
    menu.style.left = Math.max(8, left) + 'px';
    menu.style.top = top + 'px';

    var firstEnabled = menu.querySelector('button:not(:disabled)');
    if (firstEnabled) firstEnabled.focus();
  }

  function refocusMove(cardId) {
    var node = document.querySelector('.card[data-card-id="' + cardId + '"] .card-move');
    if (node) node.focus();
  }

  function closeMoveMenu(refocus) {
    var menu = document.getElementById('move-menu');
    if (menu.hidden) return;
    menu.hidden = true;
    if (refocus && moveMenuFor) refocusMove(moveMenuFor);
    moveMenuFor = null;
  }

  /* ---------- drag and drop: shared placeholder logic ---------- */

  var placeholder = null;

  function ensurePlaceholder(height) {
    if (!placeholder) {
      placeholder = el('li', 'drop-placeholder');
      placeholder.setAttribute('aria-hidden', 'true');
    }
    placeholder.style.height = height + 'px';
    return placeholder;
  }

  function removePlaceholder() {
    if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
  }

  /* Position placeholder inside `list` based on pointer Y. Skips the drag source. */
  function positionPlaceholder(list, clientY, sourceId) {
    var cards = Array.prototype.filter.call(list.children, function (node) {
      return node.classList.contains('card') && node.dataset.cardId !== sourceId;
    });
    var before = null;
    for (var i = 0; i < cards.length; i++) {
      var r = cards[i].getBoundingClientRect();
      if (clientY < r.top + r.height / 2) { before = cards[i]; break; }
    }
    if (before) list.insertBefore(placeholder, before);
    else list.appendChild(placeholder);
  }

  /* Resolve the placeholder's position to (columnId, index). */
  function placeholderTarget(sourceId) {
    if (!placeholder || !placeholder.parentNode) return null;
    var list = placeholder.parentNode;
    var columnId = list.dataset.columnId;
    var index = 0;
    for (var i = 0; i < list.children.length; i++) {
      var node = list.children[i];
      if (node === placeholder) break;
      if (node.classList.contains('card') && node.dataset.cardId !== sourceId) index++;
    }
    return { columnId: columnId, index: index };
  }

  function listUnderPoint(x, y) {
    var node = document.elementFromPoint(x, y);
    if (!node) return null;
    var column = node.closest ? node.closest('.column') : null;
    return column ? column.querySelector('.card-list') : null;
  }

  /* ---------- desktop drag (native HTML5 DnD) ---------- */

  var dragCardId = null;
  var dragClone = null;
  var dragOffset = { x: 0, y: 0 };
  var transparentImg = null;

  function makeClone(cardEl) {
    var rect = cardEl.getBoundingClientRect();
    var clone = cardEl.cloneNode(true);
    clone.className = 'card drag-clone';
    clone.style.width = rect.width + 'px';
    clone.style.left = rect.left + 'px';
    clone.style.top = rect.top + 'px';
    document.body.appendChild(clone);
    return clone;
  }

  function moveClone(x, y) {
    if (!dragClone) return;
    dragClone.style.left = (x - dragOffset.x) + 'px';
    dragClone.style.top = (y - dragOffset.y) + 'px';
  }

  function endDragVisuals() {
    if (dragClone) { dragClone.remove(); dragClone = null; }
    removePlaceholder();
    var src = document.querySelector('.card.drag-source');
    if (src) src.classList.remove('drag-source');
    dragCardId = null;
    stopAutoScroll();
  }

  function onDragStart(e) {
    var cardEl = e.target.closest ? e.target.closest('.card') : null;
    if (!cardEl) return;
    dragCardId = cardEl.dataset.cardId;
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', dragCardId); } catch (err) { /* IE */ }

    // Hide the native ghost; we draw our own lifted, tilted clone.
    if (!transparentImg) {
      transparentImg = new Image();
      transparentImg.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
    }
    try { e.dataTransfer.setDragImage(transparentImg, 0, 0); } catch (err) { /* older browsers */ }

    var rect = cardEl.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    dragClone = makeClone(cardEl);
    ensurePlaceholder(rect.height);
    cardEl.classList.add('drag-source');
  }

  function onDragOver(e) {
    if (!dragCardId) return;
    var list = e.target.closest ? (e.target.closest('.card-list') || listUnderPoint(e.clientX, e.clientY)) : null;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    moveClone(e.clientX, e.clientY);
    autoScrollAt(e.clientX, e.clientY);
    if (list) positionPlaceholder(list, e.clientY, dragCardId);
  }

  function onDrop(e) {
    if (!dragCardId) return;
    e.preventDefault();
    var target = placeholderTarget(dragCardId);
    var id = dragCardId;
    endDragVisuals();
    if (target) moveCard(id, target.columnId, target.index);
  }

  function onDragEnd() {
    if (!dragCardId) return;
    endDragVisuals();
    render(); // clean up any stale state
  }

  /* ---------- touch drag (pointer events fallback) ---------- */

  var touch = {
    active: false,       // drag in progress
    pending: false,      // long-press timer running
    timer: null,
    cardId: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    justDragged: false
  };

  function preventTouchScroll(e) {
    if (touch.active) e.preventDefault();
  }

  function onPointerDown(e) {
    if (e.pointerType === 'mouse') return; // mouse uses native DnD
    var cardEl = e.target.closest ? e.target.closest('.card') : null;
    if (!cardEl || e.target.closest('.card-move')) return;

    touch.pending = true;
    touch.cardId = cardEl.dataset.cardId;
    touch.startX = touch.lastX = e.clientX;
    touch.startY = touch.lastY = e.clientY;
    touch.timer = setTimeout(function () {
      touch.pending = false;
      startTouchDrag(cardEl);
    }, 280);
  }

  function startTouchDrag(cardEl) {
    if (!document.contains(cardEl)) return;
    touch.active = true;
    var rect = cardEl.getBoundingClientRect();
    dragOffset.x = touch.lastX - rect.left;
    dragOffset.y = touch.lastY - rect.top;
    dragClone = makeClone(cardEl);
    ensurePlaceholder(rect.height);
    cardEl.classList.add('drag-source');
    var list = cardEl.parentNode;
    list.insertBefore(placeholder, cardEl.nextSibling);
    startAutoScroll();
    if (navigator.vibrate) navigator.vibrate(10);
  }

  function onPointerMove(e) {
    if (e.pointerType === 'mouse') return;
    touch.lastX = e.clientX;
    touch.lastY = e.clientY;

    if (touch.pending) {
      var dx = e.clientX - touch.startX;
      var dy = e.clientY - touch.startY;
      if (dx * dx + dy * dy > 100) cancelTouchPending(); // moved: it's a scroll
      return;
    }
    if (!touch.active) return;

    moveClone(e.clientX, e.clientY);
    var list = listUnderPoint(e.clientX, e.clientY);
    if (list) positionPlaceholder(list, e.clientY, touch.cardId);
  }

  function onPointerUp(e) {
    if (e.pointerType === 'mouse') return;
    if (touch.pending) { cancelTouchPending(); return; }
    if (!touch.active) return;

    var target = placeholderTarget(touch.cardId);
    var id = touch.cardId;
    finishTouchDrag();
    if (target) moveCard(id, target.columnId, target.index);
  }

  function onPointerCancel(e) {
    if (e.pointerType === 'mouse') return;
    if (touch.pending) { cancelTouchPending(); return; }
    if (touch.active) finishTouchDrag();
  }

  function cancelTouchPending() {
    touch.pending = false;
    touch.cardId = null;
    if (touch.timer) { clearTimeout(touch.timer); touch.timer = null; }
  }

  function finishTouchDrag() {
    touch.active = false;
    touch.cardId = null;
    if (touch.timer) { clearTimeout(touch.timer); touch.timer = null; }
    touch.justDragged = true;
    setTimeout(function () { touch.justDragged = false; }, 350);
    endDragVisuals();
  }

  /* ---------- auto-scroll near edges while dragging ---------- */

  var autoScrollRAF = null;

  function autoScrollStep() {
    autoScrollAt(touch.lastX, touch.lastY);
    if (touch.active) {
      // Keep placeholder tracking while the finger holds near an edge.
      var list = listUnderPoint(touch.lastX, touch.lastY);
      if (list && placeholder) positionPlaceholder(list, touch.lastY, touch.cardId);
      autoScrollRAF = requestAnimationFrame(autoScrollStep);
    } else {
      autoScrollRAF = null;
    }
  }

  function startAutoScroll() {
    if (!autoScrollRAF) autoScrollRAF = requestAnimationFrame(autoScrollStep);
  }

  function stopAutoScroll() {
    if (autoScrollRAF) { cancelAnimationFrame(autoScrollRAF); autoScrollRAF = null; }
  }

  function autoScrollAt(x, y) {
    var board = document.getElementById('board');
    var b = board.getBoundingClientRect();
    var EDGE = 48;
    var SPEED = 14;
    if (x < b.left + EDGE) board.scrollLeft -= SPEED;
    else if (x > b.right - EDGE) board.scrollLeft += SPEED;

    var list = listUnderPoint(x, y);
    if (list) {
      var r = list.getBoundingClientRect();
      if (y < r.top + EDGE) list.scrollTop -= SPEED;
      else if (y > r.bottom - EDGE) list.scrollTop += SPEED;
    }
  }

  /* ---------- export / import ---------- */

  function exportBoard() {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'listahan-board-' + todayISO(0).replace(/-/g, '') + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('Board exported (' + state.cards.length + ' cards)');
  }

  function importBoardFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var cleaned = null;
      try {
        cleaned = validateBoard(JSON.parse(String(reader.result)));
      } catch (err) {
        cleaned = null;
      }
      if (!cleaned) {
        toast('Import failed: not a valid LISTAHAN board file');
        return;
      }
      showConfirm(
        'Replace the current board with the imported one? (' +
        cleaned.columns.length + ' columns, ' + cleaned.cards.length + ' cards)',
        function () {
          state = cleaned;
          save();
          render();
          toast('Board imported: ' + cleaned.cards.length + ' cards');
        }
      );
    };
    reader.onerror = function () { toast('Import failed: could not read file'); };
    reader.readAsText(file);
  }

  /* ---------- event wiring ---------- */

  function wireEvents() {
    var board = document.getElementById('board');

    // Delegated clicks on the board.
    board.addEventListener('click', function (e) {
      var actionEl = e.target.closest('[data-action]');
      if (actionEl) {
        var column = actionEl.closest('.column');
        var columnId = column ? column.dataset.columnId : null;
        var action = actionEl.dataset.action;
        if (action === 'rename-column') startColumnRename(actionEl, columnId);
        else if (action === 'edit-wip') startWipEdit(actionEl, columnId);
        else if (action === 'delete-column') requestDeleteColumn(columnId);
        else if (action === 'add-card') startQuickAdd(actionEl, columnId);
        else if (action === 'move-card') {
          var cardHost = actionEl.closest('.card');
          openMoveMenu(actionEl, cardHost.dataset.cardId);
        }
        return;
      }
      var cardEl = e.target.closest('.card');
      if (cardEl && !touch.justDragged) openCardEditor(cardEl.dataset.cardId);
    });

    // Keyboard: Enter/Space on a focused card opens the editor.
    board.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var cardEl = e.target.classList && e.target.classList.contains('card') ? e.target : null;
      if (cardEl) {
        e.preventDefault();
        openCardEditor(cardEl.dataset.cardId);
      }
    });

    // Native HTML5 drag and drop (desktop).
    board.addEventListener('dragstart', onDragStart);
    board.addEventListener('dragover', onDragOver);
    board.addEventListener('drop', onDrop);
    board.addEventListener('dragend', onDragEnd);
    // Keep the lifted clone tracking the cursor even outside the board.
    document.addEventListener('dragover', function (e) {
      if (dragCardId) moveClone(e.clientX, e.clientY);
    });

    // Pointer-events fallback (touch / pen).
    board.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerCancel);
    document.addEventListener('touchmove', preventTouchScroll, { passive: false });

    // Header actions.
    document.getElementById('btn-export').addEventListener('click', exportBoard);
    document.getElementById('btn-import').addEventListener('click', function () {
      document.getElementById('import-file').click();
    });
    document.getElementById('import-file').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (file) importBoardFile(file);
      e.target.value = '';
    });
    document.getElementById('btn-labels').addEventListener('click', openLabelsEditor);
    document.getElementById('btn-add-column').addEventListener('click', function () {
      state.columns.push({ id: uid(), name: 'New column', wipLimit: null });
      save();
      render();
      var cols = document.querySelectorAll('.column');
      var newCol = cols[cols.length - 1];
      newCol.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      startColumnRename(newCol.querySelector('.column-title'), state.columns[state.columns.length - 1].id);
    });

    // Filters.
    document.getElementById('filter-chips').addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      var id = chip.dataset.labelId;
      if (filters.labels.has(id)) filters.labels.delete(id);
      else filters.labels.add(id);
      chip.setAttribute('aria-pressed', filters.labels.has(id) ? 'true' : 'false');
      applyFilters();
    });
    document.getElementById('filter-search').addEventListener('input', function (e) {
      filters.q = e.target.value.trim().toLowerCase();
      applyFilters();
    });

    // Card editor panel.
    document.getElementById('card-form').addEventListener('submit', function (e) {
      e.preventDefault();
      saveCardEditor();
    });
    document.getElementById('card-cancel').addEventListener('click', closeOverlay);
    document.getElementById('card-delete').addEventListener('click', function () {
      var id = editingCardId;
      var card = getCard(id);
      if (!card) return;
      closeOverlay();
      showConfirm('Delete card “' + card.title + '”?', function () {
        var colId = card.columnId;
        state.cards = state.cards.filter(function (c) { return c.id !== id; });
        cardsIn(colId).forEach(function (c, i) { c.order = i; });
        save();
        render();
        toast('Card deleted');
      });
    });

    // Labels panel.
    document.getElementById('labels-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var inputs = document.querySelectorAll('#labels-list input');
      for (var i = 0; i < inputs.length; i++) {
        var label = getLabel(inputs[i].dataset.labelId);
        var name = inputs[i].value.trim();
        if (label && name) label.name = name;
      }
      save();
      render();
      closeOverlay();
      toast('Labels saved');
    });
    document.getElementById('labels-cancel').addEventListener('click', closeOverlay);

    // Confirm panel.
    document.getElementById('confirm-ok').addEventListener('click', function () {
      var cb = confirmCallback;
      confirmCallback = null;
      closeOverlay();
      if (cb) cb();
    });
    document.getElementById('confirm-cancel').addEventListener('click', function () {
      confirmCallback = null;
      closeOverlay();
    });

    // Overlay backdrop click closes.
    ['card-overlay', 'labels-overlay', 'confirm-overlay'].forEach(function (id) {
      var overlay = document.getElementById(id);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
          confirmCallback = null;
          closeOverlay();
        }
      });
    });

    // Escape closes menus and panels, returning focus.
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var menu = document.getElementById('move-menu');
      if (!menu.hidden) { closeMoveMenu(true); return; }
      if (openOverlay) {
        confirmCallback = null;
        closeOverlay();
      }
    });

    // Clicking elsewhere closes the move menu.
    document.addEventListener('click', function (e) {
      var menu = document.getElementById('move-menu');
      if (menu.hidden) return;
      if (!menu.contains(e.target) && !e.target.closest('.card-move')) closeMoveMenu(false);
    });
  }

  function requestDeleteColumn(columnId) {
    var column = getColumn(columnId);
    if (!column) return;
    if (state.columns.length <= 1) {
      toast('Keep at least one column');
      return;
    }
    if (cardsIn(columnId).length > 0) {
      toast('Move or delete its cards first');
      return;
    }
    showConfirm('Delete empty column “' + column.name + '”?', function () {
      state.columns = state.columns.filter(function (c) { return c.id !== columnId; });
      save();
      render();
      toast('Column deleted');
    });
  }

  /* ---------- boot ---------- */

  loadState();
  wireEvents();
  render();
})();

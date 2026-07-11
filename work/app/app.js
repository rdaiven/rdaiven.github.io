/* ============================================================
   GAWA — a maker's shipping log
   Vanilla JS. State in localStorage → pure render functions.
   ============================================================ */
(function () {
  "use strict";

  var STORE_KEY = "gawa.entries.v1";
  var SEED_KEY = "gawa.seeded.v1";
  var TYPES = ["Website", "App", "Design", "Experiment", "Learning"];
  var EFFORTS = ["S", "M", "L"];

  /* ---------- helpers ---------- */

  function uid() {
    return "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function toISO(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function todayISO() { return toISO(new Date()); }

  function daysAgoISO(n) {
    var d = new Date();
    d.setDate(d.getDate() - n);
    return toISO(d);
  }

  function isValidDateStr(s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    var d = new Date(s + "T00:00:00");
    return !isNaN(d.getTime());
  }

  /* deterministic tilt in ±1.2deg from id hash */
  function tiltFor(id) {
    var h = 0;
    for (var i = 0; i < id.length; i++) {
      h = (h * 31 + id.charCodeAt(i)) | 0;
    }
    var t = (Math.abs(h) % 241) / 100 - 1.2; /* -1.2 .. 1.2 */
    return t.toFixed(2) + "deg";
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var GLYPHS = {
    Website: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z"/></svg>',
    App: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="6" y="3" width="12" height="18" rx="2.5"/><path d="M10 17.5h4"/></svg>',
    Design: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 3l2.2 6.6L21 12l-6.8 2.4L12 21l-2.2-6.6L3 12l6.8-2.4z"/></svg>',
    Experiment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M10 3v6l-5.5 9a2 2 0 001.7 3h11.6a2 2 0 001.7-3L14 9V3M8.5 3h7M8 15h8"/></svg>',
    Learning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 4L2 9l10 5 10-5-10-5zM6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/></svg>'
  };

  /* ---------- storage ---------- */

  function loadEntries() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter(isValidEntry) : [];
    } catch (e) {
      return [];
    }
  }

  function saveEntries() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state.entries));
  }

  function isValidEntry(e) {
    return e && typeof e === "object" &&
      typeof e.id === "string" && e.id.length > 0 &&
      typeof e.title === "string" && e.title.trim().length > 0 &&
      TYPES.indexOf(e.type) !== -1 &&
      typeof e.learned === "string" && e.learned.trim().length > 0 &&
      EFFORTS.indexOf(e.effort) !== -1 &&
      typeof e.date === "string" && isValidDateStr(e.date);
  }

  /* ---------- seed data (first run only) ---------- */

  function seedIfNeeded() {
    if (localStorage.getItem(SEED_KEY)) return;
    localStorage.setItem(SEED_KEY, "1");
    if (loadEntries().length) return;
    var rows = [
      [1,  "LAMESA magazine", "Website", "CSS multi-column collapses cleaner than grid for editorial text; column-span:all saved the layout.", "M"],
      [2,  "Baybay docs site", "Website", "A sticky sidebar TOC needs its own scroll container or it clips on short viewports.", "S"],
      [4,  "HILAGA agency site", "Website", "Oversized type only works when line-height drops below 1.1 and tracking goes negative.", "L"],
      [7,  "AXIS One phone page", "Website", "Sticky product imagery + scrolling specs reads better than any carousel.", "L"],
      [10, "KINESIS motion study", "Experiment", "IntersectionObserver threshold:0 beats negative rootMargin for above-fold reveals.", "M"],
      [14, "HARDSET landing", "Website", "One accent color used sparingly hits harder than a full palette.", "M"],
      [18, "Cohere landing", "Website", "Trust sections earn their keep: logos + one metric outperform three paragraphs of copy.", "S"],
      [22, "NULLPORT tech store", "Website", "Spec-table density is a feature for tech buyers — do not pad it with whitespace.", "L"],
      [26, "Root + Cellar storefront", "Website", "Warm palettes need cool shadows or food photos read muddy.", "M"],
      [33, "NULL/FORM storefront", "Website", "A cart drawer in vanilla JS is just an array plus a render function — no library needed.", "L"]
    ];
    var now = Date.now();
    var entries = rows.map(function (r, i) {
      return {
        id: "seed" + (i + 1),
        title: r[1],
        type: r[2],
        learned: r[3],
        effort: r[4],
        date: daysAgoISO(r[0]),
        createdAt: now - r[0] * 86400000
      };
    });
    localStorage.setItem(STORE_KEY, JSON.stringify(entries));
  }

  /* ---------- state ---------- */

  var state = {
    entries: [],
    activeTypes: {},   /* type -> true when filter chip on */
    search: "",
    editingId: null,   /* entry being edited in the panel */
    confirmId: null,   /* entry showing delete confirm */
    stampId: null      /* entry to animate on next render */
  };

  /* ---------- derived ---------- */

  function sortedEntries() {
    return state.entries.slice().sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }

  function visibleEntries() {
    var anyType = Object.keys(state.activeTypes).some(function (t) { return state.activeTypes[t]; });
    var q = state.search.trim().toLowerCase();
    return sortedEntries().filter(function (e) {
      if (anyType && !state.activeTypes[e.type]) return false;
      if (q && (e.title + " " + e.learned).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }

  function computeStreaks() {
    var days = {};
    state.entries.forEach(function (e) { days[e.date] = true; });
    var current = 0;
    var cursor = new Date();
    if (!days[toISO(cursor)]) cursor.setDate(cursor.getDate() - 1); /* streak may end yesterday */
    while (days[toISO(cursor)]) {
      current++;
      cursor.setDate(cursor.getDate() - 1);
    }
    var longest = 0;
    Object.keys(days).forEach(function (d) {
      var prev = new Date(d + "T00:00:00");
      prev.setDate(prev.getDate() - 1);
      if (days[toISO(prev)]) return; /* not a streak start */
      var len = 0;
      var c = new Date(d + "T00:00:00");
      while (days[toISO(c)]) {
        len++;
        c.setDate(c.getDate() + 1);
      }
      if (len > longest) longest = len;
    });
    return { current: current, longest: longest };
  }

  /* ---------- render: stats ---------- */

  function renderStats() {
    var s = computeStreaks();
    var monthPrefix = todayISO().slice(0, 7);
    var thisMonth = state.entries.filter(function (e) { return e.date.slice(0, 7) === monthPrefix; }).length;

    document.getElementById("stat-streak").textContent = s.current;
    document.getElementById("stat-longest").textContent = s.longest;
    document.getElementById("stat-total").textContent = state.entries.length;
    document.getElementById("stat-month").textContent = thisMonth;

    var counts = {};
    TYPES.forEach(function (t) { counts[t] = 0; });
    state.entries.forEach(function (e) { counts[e.type]++; });
    var max = Math.max.apply(null, TYPES.map(function (t) { return counts[t]; }).concat([1]));

    var html = TYPES.map(function (t) {
      var pct = Math.round((counts[t] / max) * 100);
      return '<div class="type-row">' +
        "<span>" + t + "</span>" +
        '<span class="bar-track"><span class="bar-fill" style="width:' + pct + '%"></span></span>' +
        '<span class="bar-count">' + counts[t] + "</span>" +
        "</div>";
    }).join("");
    document.getElementById("type-breakdown").innerHTML = html;
  }

  /* ---------- render: chips ---------- */

  function renderChips() {
    var html = TYPES.map(function (t) {
      var on = !!state.activeTypes[t];
      return '<button type="button" class="chip" data-type="' + t + '" aria-pressed="' + on + '">' + t + "</button>";
    }).join("");
    document.getElementById("filter-chips").innerHTML = html;
  }

  /* ---------- render: wall ---------- */

  function tileHTML(e) {
    var stamp = e.id === state.stampId ? " stamp" : "";
    var foot;
    if (e.id === state.confirmId) {
      foot = '<div class="tile-confirm"><span>Delete this build?</span>' +
        '<span class="tile-actions">' +
        '<button type="button" class="tile-btn danger" data-action="confirm-delete">Yes, delete</button>' +
        '<button type="button" class="tile-btn" data-action="cancel-delete">Keep</button>' +
        "</span></div>";
    } else {
      foot = '<span class="tile-date">' + e.date + "</span>" +
        '<span class="tile-actions">' +
        '<button type="button" class="tile-btn" data-action="edit">Edit</button>' +
        '<button type="button" class="tile-btn danger" data-action="delete">Delete</button>' +
        "</span>";
    }
    return '<article class="tile' + stamp + '" data-id="' + e.id + '" style="--tilt:' + tiltFor(e.id) + '">' +
      '<div class="tile-top">' +
      '<span class="tile-glyph">' + (GLYPHS[e.type] || "") + "</span>" +
      '<span class="tile-type">' + e.type + "</span>" +
      '<span class="tile-effort effort-' + e.effort + '">' + e.effort + "</span>" +
      "</div>" +
      '<h3 class="tile-title">' + escapeHTML(e.title) + "</h3>" +
      '<p class="tile-learned">' + escapeHTML(e.learned) + "</p>" +
      '<div class="tile-foot">' + foot + "</div>" +
      "</article>";
  }

  function renderWall() {
    var visible = visibleEntries();
    var wall = document.getElementById("wall");
    wall.innerHTML = visible.map(tileHTML).join("");
    document.getElementById("empty-state").hidden = state.entries.length !== 0;
    document.getElementById("no-results").hidden = !(state.entries.length > 0 && visible.length === 0);
    state.stampId = null; /* stamp animates once */
  }

  function renderAll() {
    renderStats();
    renderChips();
    renderWall();
  }

  /* ---------- toasts ---------- */

  function toast(msg) {
    var stack = document.getElementById("toast-stack");
    var el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    stack.appendChild(el);
    setTimeout(function () { el.remove(); }, 4000);
  }

  /* ---------- form panel ---------- */

  var panel = document.getElementById("form-panel");
  var backdrop = document.getElementById("panel-backdrop");
  var form = document.getElementById("build-form");
  var lastFocus = null;

  function openPanel(entry) {
    state.editingId = entry ? entry.id : null;
    lastFocus = document.activeElement;
    document.getElementById("panel-title").textContent = entry ? "Edit build" : "Log a build";
    document.getElementById("save-btn").textContent = entry ? "Save changes" : "Stamp it on the wall";
    form.reset();
    clearErrors();
    document.getElementById("f-title").value = entry ? entry.title : "";
    document.getElementById("f-type").value = entry ? entry.type : "Website";
    document.getElementById("f-learned").value = entry ? entry.learned : "";
    document.getElementById("f-date").value = entry ? entry.date : todayISO();
    var effort = entry ? entry.effort : "M";
    document.getElementById("effort-" + effort.toLowerCase()).checked = true;
    panel.hidden = false;
    backdrop.hidden = false;
    document.getElementById("f-title").focus();
  }

  function closePanel() {
    panel.hidden = true;
    backdrop.hidden = true;
    state.editingId = null;
    if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus();
    lastFocus = null;
  }

  function setError(field, msg) {
    var input = document.getElementById("f-" + field);
    var err = document.getElementById("err-" + field);
    if (msg) {
      input.setAttribute("aria-invalid", "true");
      err.textContent = msg;
      err.hidden = false;
    } else {
      input.removeAttribute("aria-invalid");
      err.hidden = true;
    }
  }

  function clearErrors() {
    ["title", "learned", "date"].forEach(function (f) { setError(f, null); });
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    var title = document.getElementById("f-title").value.trim();
    var type = document.getElementById("f-type").value;
    var learned = document.getElementById("f-learned").value.trim();
    var date = document.getElementById("f-date").value;
    var effortEl = form.querySelector('input[name="effort"]:checked');
    var effort = effortEl ? effortEl.value : "M";

    var ok = true;
    if (!title) { setError("title", "Give the build a name."); ok = false; } else setError("title", null);
    if (!learned) { setError("learned", "One line — what did making it teach you?"); ok = false; } else setError("learned", null);
    if (!isValidDateStr(date)) { setError("date", "Pick a valid date."); ok = false; } else setError("date", null);
    if (!ok) return;

    if (state.editingId) {
      var e = state.entries.find(function (x) { return x.id === state.editingId; });
      if (e) {
        e.title = title; e.type = type; e.learned = learned;
        e.effort = effort; e.date = date;
      }
      toast("Build updated.");
    } else {
      var entry = {
        id: uid(), title: title, type: type, learned: learned,
        effort: effort, date: date, createdAt: Date.now()
      };
      state.entries.push(entry);
      state.stampId = entry.id;
      toast("Stamped on the wall.");
    }
    saveEntries();
    closePanel();
    renderAll();
  }

  /* ---------- export / import ---------- */

  function exportJSON() {
    var blob = new Blob([JSON.stringify(state.entries, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "gawa-export-" + todayISO() + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Exported " + state.entries.length + " builds.");
  }

  function importJSON(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var added = 0, skipped = 0;
      try {
        var data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error("not an array");
        var byId = {};
        state.entries.forEach(function (e) { byId[e.id] = true; });
        data.forEach(function (e) {
          if (isValidEntry(e) && !byId[e.id]) {
            byId[e.id] = true;
            state.entries.push({
              id: e.id, title: e.title.trim(), type: e.type,
              learned: e.learned.trim(), effort: e.effort, date: e.date,
              createdAt: typeof e.createdAt === "number" ? e.createdAt : Date.now()
            });
            added++;
          } else {
            skipped++;
          }
        });
        saveEntries();
        renderAll();
        toast("Import: " + added + " added, " + skipped + " skipped.");
      } catch (err) {
        toast("Import failed — not a valid GAWA JSON file.");
      }
    };
    reader.readAsText(file);
  }

  /* ---------- events ---------- */

  function bind() {
    document.getElementById("open-form-btn").addEventListener("click", function () { openPanel(null); });
    document.getElementById("empty-log-btn").addEventListener("click", function () { openPanel(null); });
    document.getElementById("close-panel-btn").addEventListener("click", closePanel);
    document.getElementById("cancel-btn").addEventListener("click", closePanel);
    backdrop.addEventListener("click", closePanel);
    form.addEventListener("submit", handleSubmit);

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !panel.hidden) closePanel();
    });

    /* wall: event delegation */
    document.getElementById("wall").addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-action]");
      if (!btn) return;
      var tile = btn.closest(".tile");
      var id = tile && tile.getAttribute("data-id");
      if (!id) return;
      var action = btn.getAttribute("data-action");
      if (action === "edit") {
        var entry = state.entries.find(function (x) { return x.id === id; });
        if (entry) openPanel(entry);
      } else if (action === "delete") {
        state.confirmId = id;
        renderWall();
      } else if (action === "cancel-delete") {
        state.confirmId = null;
        renderWall();
      } else if (action === "confirm-delete") {
        state.entries = state.entries.filter(function (x) { return x.id !== id; });
        state.confirmId = null;
        saveEntries();
        renderAll();
        toast("Build removed from the wall.");
      }
    });

    /* filter chips: delegation */
    document.getElementById("filter-chips").addEventListener("click", function (ev) {
      var chip = ev.target.closest(".chip");
      if (!chip) return;
      var t = chip.getAttribute("data-type");
      state.activeTypes[t] = !state.activeTypes[t];
      chip.setAttribute("aria-pressed", String(!!state.activeTypes[t]));
      renderWall();
    });

    /* live search */
    document.getElementById("search-input").addEventListener("input", function (ev) {
      state.search = ev.target.value;
      renderWall();
    });

    /* export / import */
    document.getElementById("export-btn").addEventListener("click", exportJSON);
    var fileInput = document.getElementById("import-file");
    document.getElementById("import-btn").addEventListener("click", function () { fileInput.click(); });
    fileInput.addEventListener("change", function () {
      if (fileInput.files && fileInput.files[0]) importJSON(fileInput.files[0]);
      fileInput.value = "";
    });
  }

  /* ---------- init ---------- */

  seedIfNeeded();
  state.entries = loadEntries();
  bind();
  renderAll();
})();

/* Baybay docs — shared behaviour.
   No frameworks. Everything degrades gracefully without JS. */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------
     1. Mobile sidebar (off-canvas drawer)
     ---------------------------------------------------------- */
  var navToggle = document.querySelector(".nav-toggle");
  var backdrop = document.querySelector(".sidebar-backdrop");

  function setNav(open) {
    document.body.classList.toggle("nav-open", open);
    if (navToggle) navToggle.setAttribute("aria-expanded", String(open));
  }

  if (navToggle) {
    navToggle.addEventListener("click", function () {
      setNav(!document.body.classList.contains("nav-open"));
    });
  }
  if (backdrop) {
    backdrop.addEventListener("click", function () { setNav(false); });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
      setNav(false);
      if (navToggle) navToggle.focus();
    }
  });

  /* ----------------------------------------------------------
     2. Copy buttons on code blocks
     ---------------------------------------------------------- */
  document.querySelectorAll(".code-block").forEach(function (block) {
    var btn = block.querySelector(".copy-btn");
    var pre = block.querySelector("pre");
    if (!btn || !pre) return;
    btn.addEventListener("click", function () {
      var text = pre.innerText.replace(/^\$ /gm, "");
      var done = function () {
        btn.classList.add("copied");
        btn.textContent = "Copied ✓";
        window.setTimeout(function () {
          btn.classList.remove("copied");
          btn.textContent = "Copy";
        }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        done();
      }
    });
  });

  /* ----------------------------------------------------------
     3. "On this page" TOC + scroll-spy
        Only IntersectionObserver on the site. threshold: 0,
        no negative rootMargin — content is never hidden.
     ---------------------------------------------------------- */
  var tocNav = document.querySelector("[data-toc]");
  var article = document.querySelector("article");

  if (tocNav && article) {
    var headings = Array.prototype.slice.call(article.querySelectorAll("h2[id], h3[id]"));

    if (headings.length) {
      var list = document.createElement("ul");
      headings.forEach(function (h) {
        var li = document.createElement("li");
        li.className = h.tagName === "H3" ? "toc-h3" : "toc-h2";
        var a = document.createElement("a");
        a.href = "#" + h.id;
        a.textContent = h.textContent;
        li.appendChild(a);
        list.appendChild(li);
      });
      tocNav.appendChild(list);

      var links = {};
      tocNav.querySelectorAll("a").forEach(function (a) {
        links[a.getAttribute("href").slice(1)] = a;
      });

      var activeId = null;
      function setActive(id) {
        if (id === activeId) return;
        if (activeId && links[activeId]) links[activeId].classList.remove("active");
        activeId = id;
        if (links[id]) links[id].classList.add("active");
      }

      if ("IntersectionObserver" in window) {
        var visible = new Set();
        var spy = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) visible.add(entry.target.id);
            else visible.delete(entry.target.id);
          });
          // Highlight the first visible heading; if none is on screen,
          // keep the last heading we scrolled past.
          for (var i = 0; i < headings.length; i++) {
            if (visible.has(headings[i].id)) { setActive(headings[i].id); return; }
          }
          var last = null;
          var top = document.querySelector(".site-header").offsetHeight;
          headings.forEach(function (h) {
            if (h.getBoundingClientRect().top < top + 8) last = h.id;
          });
          if (last) setActive(last);
        }, { threshold: 0 });
        headings.forEach(function (h) { spy.observe(h); });
      }
      setActive(headings[0].id);
    }
  }

  /* ----------------------------------------------------------
     4. Search modal (Ctrl+K / Cmd+K)
     ---------------------------------------------------------- */
  var SEARCH_INDEX = [
    { page: "Introduction", href: "index.html", title: "What is Baybay?" },
    { page: "Introduction", href: "index.html#quick-start", title: "Quick start" },
    { page: "Introduction", href: "index.html#features", title: "Why Baybay" },
    { page: "Getting Started", href: "getting-started.html", title: "Getting started" },
    { page: "Getting Started", href: "getting-started.html#prerequisites", title: "Prerequisites" },
    { page: "Getting Started", href: "getting-started.html#install", title: "Install the CLI" },
    { page: "Getting Started", href: "getting-started.html#scaffold", title: "Scaffold a project" },
    { page: "Getting Started", href: "getting-started.html#dev-server", title: "Run the dev server" },
    { page: "Getting Started", href: "getting-started.html#first-page", title: "Write your first page" },
    { page: "Getting Started", href: "getting-started.html#build", title: "Build for production" },
    { page: "Getting Started", href: "getting-started.html#deploy", title: "Deploy" },
    { page: "Configuration", href: "configuration.html", title: "Configuration reference" },
    { page: "Configuration", href: "configuration.html#config-file", title: "baybay.config.js" },
    { page: "Configuration", href: "configuration.html#core-options", title: "Core options (srcDir, outDir, base)" },
    { page: "Configuration", href: "configuration.html#markdown-options", title: "Markdown options (smartQuotes, anchors)" },
    { page: "Configuration", href: "configuration.html#i18n-options", title: "i18n options (locales, defaultLocale)" },
    { page: "Configuration", href: "configuration.html#dev-build-options", title: "Dev & build options (port, minify)" },
    { page: "Configuration", href: "configuration.html#env-vars", title: "Environment variables" },
    { page: "CLI Reference", href: "cli.html", title: "CLI reference" },
    { page: "CLI Reference", href: "cli.html#global-flags", title: "Global flags (--config, --quiet)" },
    { page: "CLI Reference", href: "cli.html#baybay-new", title: "baybay new — scaffold a site" },
    { page: "CLI Reference", href: "cli.html#baybay-dev", title: "baybay dev — local dev server" },
    { page: "CLI Reference", href: "cli.html#baybay-build", title: "baybay build — production build" },
    { page: "CLI Reference", href: "cli.html#baybay-deploy", title: "baybay deploy — publish your site" }
  ];

  var dialog = document.getElementById("search-dialog");
  var searchBtn = document.querySelector(".search-button");

  if (dialog && searchBtn) {
    var input = dialog.querySelector("input");
    var resultsEl = dialog.querySelector(".search-results");
    var emptyEl = dialog.querySelector(".search-empty");
    var lastFocus = null;

    function escapeHtml(s) {
      return s.replace(/[&<>"]/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
      });
    }

    function highlight(text, query) {
      var safe = escapeHtml(text);
      if (!query) return safe;
      var i = text.toLowerCase().indexOf(query.toLowerCase());
      if (i === -1) return safe;
      return escapeHtml(text.slice(0, i)) +
        "<mark>" + escapeHtml(text.slice(i, i + query.length)) + "</mark>" +
        escapeHtml(text.slice(i + query.length));
    }

    function render(query) {
      var q = query.trim().toLowerCase();
      var matches = SEARCH_INDEX.filter(function (item) {
        return !q ||
          item.title.toLowerCase().indexOf(q) !== -1 ||
          item.page.toLowerCase().indexOf(q) !== -1;
      });
      resultsEl.innerHTML = "";
      matches.slice(0, 10).forEach(function (item) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = item.href;
        a.innerHTML =
          '<span class="result-title">' + highlight(item.title, q ? query.trim() : "") + "</span><br>" +
          '<span class="result-page">' + escapeHtml(item.page) + "</span>";
        a.addEventListener("click", function () { dialog.close(); });
        li.appendChild(a);
        resultsEl.appendChild(li);
      });
      emptyEl.hidden = matches.length > 0;
    }

    function openSearch() {
      lastFocus = document.activeElement;
      dialog.showModal(); // <dialog> traps focus and closes on Esc natively
      input.value = "";
      render("");
      input.focus();
    }

    searchBtn.addEventListener("click", openSearch);
    input.addEventListener("input", function () { render(input.value); });

    // Arrow-key movement between results
    dialog.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      var items = Array.prototype.slice.call(resultsEl.querySelectorAll("a"));
      if (!items.length) return;
      e.preventDefault();
      var idx = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown") {
        (items[idx + 1] || items[0]).focus();
      } else {
        (idx <= 0 ? input : items[idx - 1]).focus();
      }
    });

    dialog.addEventListener("close", function () {
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    });

    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialog.open) dialog.close();
        else openSearch();
      }
    });
  }

  /* ----------------------------------------------------------
     5. Typing terminal hero (index only)
        Reduced motion => render the finished state immediately.
     ---------------------------------------------------------- */
  var typeTarget = document.querySelector("[data-typing]");
  if (typeTarget) {
    var command = "npm i -g baybay && baybay new my-site";
    var outputLines = [
      { text: "", cls: "" },
      { text: "✔ baybay@1.4.2 installed in 3.1s", cls: "ok" },
      { text: "✔ Scaffolded my-site (7 files, 1 template)", cls: "ok" },
      { text: "", cls: "" },
      { text: "  next:  cd my-site && baybay dev", cls: "dim" }
    ];
    var caret = document.createElement("span");
    caret.className = "caret";
    caret.setAttribute("aria-hidden", "true");

    function printOutput() {
      outputLines.forEach(function (l) {
        var line = document.createElement("span");
        line.className = "line" + (l.cls ? " " + l.cls : "");
        line.textContent = l.text || " ";
        typeTarget.parentNode.appendChild(line);
      });
      var promptLine = document.createElement("span");
      promptLine.className = "line";
      promptLine.innerHTML = '<span class="prompt">$ </span>';
      promptLine.appendChild(caret);
      typeTarget.parentNode.appendChild(promptLine);
    }

    if (reducedMotion) {
      typeTarget.textContent = command;
      printOutput();
    } else {
      var i = 0;
      typeTarget.appendChild(caret);
      (function tick() {
        if (i < command.length) {
          typeTarget.insertBefore(document.createTextNode(command[i]), caret);
          i++;
          window.setTimeout(tick, 34 + Math.random() * 46);
        } else {
          window.setTimeout(function () {
            caret.remove();
            printOutput();
          }, 420);
        }
      })();
    }
  }
})();

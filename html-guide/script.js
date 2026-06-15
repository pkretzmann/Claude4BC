/* ============================================================
   html-guide — progressive enhancement layer
   The /html-guide command inlines this file verbatim into a
   <script> just before </body>. Pure vanilla JS, no dependencies,
   no build step. Every feature is guarded so the guide is fully
   usable with JavaScript disabled — this only enhances.
   ============================================================ */
(function () {
  'use strict';

  /* ── Smooth in-page scrolling for TOC / anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href').slice(1);
      var target = id && document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (history.replaceState) history.replaceState(null, '', '#' + id);
    });
  });

  /* ── Scroll-spy: highlight the current section in the TOC ── */
  var tocLinks = Array.prototype.slice.call(
    document.querySelectorAll('.toc a[href^="#"]')
  );
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    tocLinks.forEach(function (l) { byId[l.getAttribute('href').slice(1)] = l; });
    var sections = tocLinks
      .map(function (l) { return document.getElementById(l.getAttribute('href').slice(1)); })
      .filter(Boolean);
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = byId[entry.target.id];
        if (link && entry.isIntersecting) {
          tocLinks.forEach(function (l) { l.classList.remove('active'); });
          link.classList.add('active');
        }
      });
    }, { rootMargin: '0px 0px -75% 0px', threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ── Copy-to-clipboard buttons on code blocks (technical guides) ── */
  if (navigator.clipboard) {
    document.querySelectorAll('pre').forEach(function (pre) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.textContent = 'Kopiér';
      btn.addEventListener('click', function () {
        var code = pre.querySelector('code') || pre;
        navigator.clipboard.writeText(code.innerText).then(function () {
          btn.textContent = 'Kopieret ✓';
          setTimeout(function () { btn.textContent = 'Kopiér'; }, 1500);
        });
      });
      pre.appendChild(btn);
    });
  }

  /* ── Expand / collapse all for FAQ accordions ── */
  var details = Array.prototype.slice.call(document.querySelectorAll('details'));
  if (details.length > 1) {
    var first = details[0];
    var allOpen = false;
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'expand-all-btn';
    toggle.textContent = 'Fold alle ud';
    toggle.addEventListener('click', function () {
      allOpen = !allOpen;
      details.forEach(function (d) { d.open = allOpen; });
      toggle.textContent = allOpen ? 'Fold alle ind' : 'Fold alle ud';
    });
    if (first.parentNode) first.parentNode.insertBefore(toggle, first);
  }

  /* ── Back-to-top button ── */
  var toTop = document.createElement('button');
  toTop.type = 'button';
  toTop.className = 'to-top-btn';
  toTop.setAttribute('aria-label', 'Til toppen');
  toTop.textContent = '↑';
  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.body.appendChild(toTop);
  window.addEventListener('scroll', function () {
    toTop.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  /* ── Reading-progress bar: grows from 0–100% as the page scrolls ── */
  var progress = document.createElement('div');
  progress.className = 'reading-progress';
  document.body.appendChild(progress);
  function updateProgress() {
    var docEl = document.documentElement;
    var scrolled = docEl.scrollTop || document.body.scrollTop;
    var height = docEl.scrollHeight - docEl.clientHeight;
    progress.style.width = (height > 0 ? (scrolled / height) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ── FAQ search / filter — live-filters a .faq accordion, highlights
        matches, auto-opens hits and shows a result count. No-op when the
        page has no .faq, so it is safe to ship in every guide. ── */
  var faqWrap = document.querySelector('.faq');
  if (faqWrap) {
    var faqItems = Array.prototype.slice.call(faqWrap.querySelectorAll('details'));
    faqItems.forEach(function (d) {
      var s = d.querySelector('summary');
      var b = d.querySelector('.faq-body');
      if (s) s.setAttribute('data-orig', s.innerHTML);
      if (b) b.setAttribute('data-orig', b.innerHTML);
    });

    var search = document.createElement('div');
    search.className = 'doc-search';
    var input = document.createElement('input');
    input.type = 'search';
    input.placeholder = 'Søg i ofte stillede spørgsmål…';
    input.setAttribute('aria-label', 'Søg i ofte stillede spørgsmål');
    var count = document.createElement('span');
    count.className = 'doc-search-count';
    search.appendChild(input);
    search.appendChild(count);
    faqWrap.parentNode.insertBefore(search, faqWrap);

    var noResults = document.createElement('div');
    noResults.className = 'faq-no-results';
    noResults.textContent = 'Ingen spørgsmål matcher din søgning.';
    noResults.style.display = 'none';
    faqWrap.appendChild(noResults);

    function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    function highlight(el, re) {
      var orig = el.getAttribute('data-orig');
      el.innerHTML = orig;
      if (!re) return;
      walkAndHighlight(el, re);
    }
    function walkAndHighlight(node, re) {
      for (var i = node.childNodes.length - 1; i >= 0; i--) {
        var child = node.childNodes[i];
        if (child.nodeType === 3) {
          var text = child.nodeValue;
          var replaced = text.replace(re, '<mark class="search-hit">$1</mark>');
          if (replaced !== text) {
            var span = document.createElement('span');
            span.innerHTML = replaced;
            child.parentNode.replaceChild(span, child);
          }
        } else if (child.nodeType === 1 && child.nodeName !== 'MARK') {
          walkAndHighlight(child, re);
        }
      }
    }

    function runSearch() {
      var q = input.value.trim();
      var ql = q.toLowerCase();
      var re = q ? new RegExp('(' + escapeRegExp(q) + ')', 'gi') : null;
      var shown = 0;
      faqItems.forEach(function (d) {
        var s = d.querySelector('summary');
        var b = d.querySelector('.faq-body');
        var hay = ((s ? s.getAttribute('data-orig') : '') + ' ' +
                   (b ? b.getAttribute('data-orig') : ''))
                   .replace(/<[^>]+>/g, ' ').toLowerCase();
        var match = ql === '' || hay.indexOf(ql) !== -1;
        d.style.display = match ? '' : 'none';
        if (match) {
          shown++;
          if (s) highlight(s, re);
          if (b) highlight(b, re);
          d.open = ql !== '';
        } else {
          d.open = false;
        }
      });
      count.textContent = q === '' ? '' : shown + ' resultat' + (shown === 1 ? '' : 'er');
      noResults.style.display = shown === 0 ? 'block' : 'none';
    }

    input.addEventListener('input', runSearch);
  }

  /* ── Scroll-reveal + count-up (opt-in via <body class="fx">) ──
        Sections fade/slide in as they enter the viewport. Guarded so the guide
        is fully readable without JS: CSS only hides sections under .js-fx, which
        we add here — and only when motion is allowed. Honours reduced-motion. ── */
  var wantsFx = document.body.classList.contains('fx');
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-countup'));
    if (isNaN(target)) return;
    var dur = 900, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = String(Math.round(target * p));
      if (p < 1) requestAnimationFrame(step); else el.textContent = String(target);
    }
    requestAnimationFrame(step);
  }

  if (wantsFx && !reduceMotion && 'IntersectionObserver' in window) {
    document.body.classList.add('js-fx');
    var revObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
        var counters = entry.target.querySelectorAll('[data-countup]');
        for (var i = 0; i < counters.length; i++) countUp(counters[i]);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('.section').forEach(function (s) { revObserver.observe(s); });
  }
})();

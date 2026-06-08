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
})();

/* ═══════════════════════════════════════════════
   Rytha Mitra — app.js
   Splash · Stars · Theme · Scroll · Counters · Tabs
   ═══════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── STARS (disabled for cleaner splash) ───── */

  /* ── SPLASH ─────────────────────────────────── */
  var splash  = document.getElementById('splash');
  var spEnter = document.getElementById('spEnter');
  if (splash) {
    document.body.style.overflow = 'hidden';
    function closeSplash() {
      splash.classList.add('hide');
      splash.style.display = 'none';
      document.body.style.overflow = '';
    }
    if (spEnter) spEnter.addEventListener('click', closeSplash);
    setTimeout(closeSplash, 6500);
  }

  /* ── THEME TOGGLE ───────────────────────────── */
  var html = document.documentElement;
  var themeBtn = document.getElementById('themeBtn');

  function setTheme(t) {
    html.setAttribute('data-theme', t);
    if (themeBtn) themeBtn.textContent = t === 'dark' ? '☀️' : '🌙';
    try { localStorage.setItem('ryt-theme', t); } catch (e) {}
  }

  // Restore saved preference
  try {
    var saved = localStorage.getItem('ryt-theme');
    if (saved === 'light' || saved === 'dark') setTheme(saved);
    else if (themeBtn) setTheme(html.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
  } catch (e) {}

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  /* ── NAVBAR SCROLL ──────────────────────────── */
  var navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', function () {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  /* ── HAMBURGER ──────────────────────────────── */
  var ham   = document.getElementById('navHam');
  var links = document.getElementById('navLinks');
  if (ham && links) {
    function setMenuOpen(isOpen) {
      links.classList.toggle('open', isOpen);
      if (window.innerWidth <= 768) {
        document.body.style.overflow = isOpen ? 'hidden' : '';
      }
    }

    ham.addEventListener('click', function () {
      setMenuOpen(!links.classList.contains('open'));
    });

    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenuOpen(false); });
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) {
        setMenuOpen(false);
      }
    });
  }

  /* ── SMOOTH SCROLL ──────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1);
      if (!id) return;
      var el = document.getElementById(id);
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  /* ── LANDING TAB HIGHLIGHT (NAV + FOOTER) ─── */
  var sectionTabLinks = Array.prototype.slice.call(
    document.querySelectorAll('.nav-links a[href^="#"], .foot-tab[href^="#"]')
  );

  if (sectionTabLinks.length) {
    var linkBySection = {};
    var sections = [];

    sectionTabLinks.forEach(function (link) {
      var href = link.getAttribute('href') || '';
      var id = href.slice(1);
      var sectionEl = document.getElementById(id);
      if (!id || !sectionEl) return;
      if (!linkBySection[id]) linkBySection[id] = [];
      linkBySection[id].push(link);
      if (sections.indexOf(sectionEl) === -1) sections.push(sectionEl);
      link.addEventListener('click', function () {
        Object.keys(linkBySection).forEach(function (key) {
          (linkBySection[key] || []).forEach(function (l) { l.classList.remove('is-active'); });
        });
        (linkBySection[id] || []).forEach(function (l) { l.classList.add('is-active'); });
      });
    });

    if (sections.length) {
      var sectionIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          Object.keys(linkBySection).forEach(function (key) {
            (linkBySection[key] || []).forEach(function (l) {
              l.classList.toggle('is-active', key === id);
            });
          });
        });
      }, { rootMargin: '-28% 0px -58% 0px', threshold: 0.05 });

      sections.forEach(function (section) { sectionIO.observe(section); });
    }
  }

  /* ── SCROLL REVEAL ──────────────────────────── */
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('on'); revealIO.unobserve(e.target); }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.rv,.rvr').forEach(function (el) { revealIO.observe(el); });

  /* ── COUNTER ANIMATION ──────────────────────── */
  function animateCount(el) {
    var target  = parseInt(el.getAttribute('data-target'), 10);
    var suffix  = el.getAttribute('data-suffix') || '';
    if (!target) return; // skip ₹0 static
    var dur = 1800, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(ease * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(step);
  }

  var counterIO = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) {
      document.querySelectorAll('.m-num[data-target]').forEach(animateCount);
      counterIO.disconnect();
    }
  }, { threshold: 0.25 });

  var metricsEl = document.querySelector('.metrics');
  if (metricsEl) counterIO.observe(metricsEl);

  /* ── TABS (core.html) ───────────────────────── */
  var tabs   = document.querySelectorAll('.tab[data-tab]');
  var panels = document.querySelectorAll('.tab-panel');
  if (tabs.length) {
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (x) { x.classList.remove('active'); });
        panels.forEach(function (p) { p.classList.remove('active'); });
        t.classList.add('active');
        var panel = document.getElementById('tab-' + t.getAttribute('data-tab'));
        if (panel) panel.classList.add('active');
      });
    });
  }

  /* ── HOW-STEP DOT FILL ON HOVER ─────────────── */
  document.querySelectorAll('.hw').forEach(function (hw) {
    var dot = hw.querySelector('.hw-n');
    if (!dot) return;
    hw.addEventListener('mouseenter', function () {
      dot.style.background = 'var(--mint)';
      dot.style.color = '#031a0d';
    });
    hw.addEventListener('mouseleave', function () {
      dot.style.background = '';
      dot.style.color = '';
    });
  });

  /* ── PRODUCT GALLERY ROTATION ───────────────── */
  var plGrid = document.querySelector('.pl-grid');
  if (plGrid) {
    var plCards = Array.prototype.slice.call(plGrid.querySelectorAll('.pl-card'));
    var plDotsWrap = document.getElementById('plDots');
    var plDots = [];
    if (plCards.length > 1) {
      var activeIndex = 0;
      var rotateTimer = null;

      if (plDotsWrap) {
        plDots = plCards.map(function (_, i) {
          var dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'pl-dot';
          dot.setAttribute('aria-label', 'Show product card ' + (i + 1));
          dot.addEventListener('click', function () {
            activeIndex = i;
            setActiveCard(activeIndex);
          });
          plDotsWrap.appendChild(dot);
          return dot;
        });
      }

      function setActiveCard(index) {
        plCards.forEach(function (card, i) {
          card.classList.toggle('is-active', i === index);
        });
        plDots.forEach(function (dot, i) {
          dot.classList.toggle('is-active', i === index);
        });
      }

      function startRotation() {
        if (rotateTimer) return;
        rotateTimer = setInterval(function () {
          activeIndex = (activeIndex + 1) % plCards.length;
          setActiveCard(activeIndex);
        }, 2600);
      }

      function stopRotation() {
        if (!rotateTimer) return;
        clearInterval(rotateTimer);
        rotateTimer = null;
      }

      plGrid.classList.add('rotating');
      setActiveCard(activeIndex);
      startRotation();

      plGrid.addEventListener('mouseenter', stopRotation);
      plGrid.addEventListener('mouseleave', startRotation);
      plGrid.addEventListener('focusin', stopRotation);
      plGrid.addEventListener('focusout', startRotation);
    }
  }

})();

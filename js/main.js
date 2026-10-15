/* =====================================================================
   Asresh Kuricheti — portfolio interactions
   Vanilla JS, no dependencies. Progressive-enhancement friendly:
   if any of this fails, the CSS leaves all content fully visible.
   ===================================================================== */
(function () {
  'use strict';

  var header = document.getElementById('header');
  var menuBtn = document.getElementById('menu-btn');
  var mobileMenu = document.getElementById('mobile-menu');
  var scrim = document.getElementById('menu-scrim');
  var body = document.body;

  /* ---------------------------------------------------------------
     1) Scroll-aware header: shrink on scroll, hide on scroll-down,
        reveal on scroll-up.
  --------------------------------------------------------------- */
  var lastY = window.pageYOffset;
  var ticking = false;
  var HIDE_AFTER = 200; // px before hide-on-scroll kicks in

  function onScroll() {
    var y = window.pageYOffset;

    if (y > 50) header.classList.add('scrolled');
    else header.classList.remove('scrolled');

    if (!body.classList.contains('menu-open')) {
      if (y > lastY && y > HIDE_AFTER) {
        header.classList.add('nav-hidden');   // scrolling down
      } else {
        header.classList.remove('nav-hidden'); // scrolling up
      }
    }
    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll(); // set initial state

  /* ---------------------------------------------------------------
     2) Reveal-on-scroll via IntersectionObserver.
  --------------------------------------------------------------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          obs.unobserve(entry.target);
        }
      });
      // A ratio threshold is a trap here: the single-column project grids
      // are ~10000px tall on a phone, so 12% of them never fits in an
      // 800px viewport and they would stay at opacity 0 forever. Trigger
      // on first pixel instead, pulled up a little so the fade still
      // reads as "on scroll" rather than "already there".
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });

    revealEls.forEach(function (el) { io.observe(el); });

    // Belt and braces: nothing on this page may stay invisible. If the
    // observer never fires for something already on screen (layout shift
    // during font/image load, or a grid so tall its top scrolled past
    // before observation began), reveal it once the page has settled.
    window.addEventListener('load', function () {
      setTimeout(function () {
        revealEls.forEach(function (el) {
          if (el.classList.contains('revealed')) return;
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) {
            el.classList.add('revealed');
          }
        });
      }, 300);
    });
  } else {
    // No IO support — just show everything.
    revealEls.forEach(function (el) { el.classList.add('revealed'); });
  }

  /* ---------------------------------------------------------------
     2b) Give every project card its own small technical illustration.
     The image is generated from the project title and its section, so
     newly synced projects receive a matching thumbnail automatically.
  --------------------------------------------------------------- */
  function projectArtMarkup(sectionId, seed) {
    var common = '<rect width="600" height="280" fill="#f2e6d7"/>'
      + '<path d="M0 70H600M0 140H600M0 210H600M100 0V280M200 0V280M300 0V280M400 0V280M500 0V280" stroke="#b48b68" stroke-opacity=".12" stroke-width="1"/>'
      + '<circle cx="' + (470 + seed % 90) + '" cy="' + (55 + seed % 44) + '" r="' + (34 + seed % 22) + '" fill="#d57a4d" fill-opacity=".12"/>'
      + '<path d="M' + (30 + seed % 40) + ' 238 C180 ' + (205 + seed % 28) + ', 300 ' + (260 - seed % 35) + ', 550 ' + (190 + seed % 32) + '" fill="none" stroke="#c55b32" stroke-opacity=".24" stroke-width="2"/>';

    if (sectionId === 'verification') {
      var labels = ['SEQUENCE', 'DRIVER', 'DUT', 'MONITOR'];
      return common + '<path d="M125 124H235M365 124H475M520 150V204H300M80 150V204H300" fill="none" stroke="#9f795c" stroke-width="3" stroke-linecap="round"/>'
        + labels.map(function (label, i) {
          var x = 40 + i * 130;
          return '<rect x="' + x + '" y="91" width="112" height="66" rx="14" fill="' + (i === seed % 4 ? '#cc5c32' : '#fffaf2') + '" stroke="#c9ad91" stroke-width="2"/>'
            + '<text x="' + (x + 56) + '" y="130" text-anchor="middle" fill="' + (i === seed % 4 ? '#fffaf2' : '#594839') + '">' + label + '</text>';
        }).join('')
        + '<rect x="225" y="190" width="150" height="43" rx="12" fill="#fffaf2" stroke="#c9ad91" stroke-width="2"/>'
        + '<text x="300" y="217" text-anchor="middle" fill="#594839">SCOREBOARD</text>';
    }
    if (sectionId === 'codesign') {
      var cells = '';
      for (var row = 0; row < 3; row++) for (var col = 0; col < 3; col++) {
        var hot = (row * 3 + col) === seed % 9;
        cells += '<rect x="' + (235 + col * 37) + '" y="' + (84 + row * 37) + '" width="27" height="27" rx="6" fill="' + (hot ? '#cc5c32' : '#fffaf2') + '" stroke="#c9ad91" stroke-width="2"/>';
      }
      return common + '<path d="M160 126H223M378 126H440M300 70V56" fill="none" stroke="#9f795c" stroke-width="4" stroke-linecap="round"/>'
        + '<rect x="44" y="94" width="116" height="64" rx="15" fill="#fffaf2" stroke="#c9ad91" stroke-width="2"/><text x="102" y="132" text-anchor="middle" fill="#594839">CPU / C</text>'
        + '<rect x="440" y="94" width="116" height="64" rx="15" fill="#fffaf2" stroke="#c9ad91" stroke-width="2"/><text x="498" y="132" text-anchor="middle" fill="#594839">ACCELERATOR</text>'
        + '<text x="300" y="48" text-anchor="middle" fill="#9b6a47">BUS + DATAFLOW</text>' + cells;
    }
    if (sectionId === 'comparch') {
      var stages = ['FETCH', 'DECODE', 'EXECUTE', 'MEMORY', 'RETIRE'];
      return common + '<path d="' + stages.map(function (_, i) { return (i ? 'M' : 'M') + (38 + i * 107) + ' 136H' + (91 + i * 107); }).join('') + '" fill="none" stroke="#9f795c" stroke-width="3" stroke-linecap="round"/>'
        + stages.map(function (label, i) {
          var x = 26 + i * 107;
          return '<rect x="' + x + '" y="99" width="82" height="74" rx="13" fill="' + (i === seed % stages.length ? '#cc5c32' : '#fffaf2') + '" stroke="#c9ad91" stroke-width="2"/>'
            + '<text x="' + (x + 41) + '" y="141" text-anchor="middle" fill="' + (i === seed % stages.length ? '#fffaf2' : '#594839') + '">' + label + '</text>';
        }).join('')
        + '<path d="M100 197H500" stroke="#c9ad91" stroke-width="2" stroke-dasharray="5 8"/><text x="300" y="222" text-anchor="middle" fill="#9b6a47">PIPELINE / STATE FLOW</text>';
    }
    if (sectionId === 'ai') {
      var macs = '';
      for (var ar = 0; ar < 4; ar++) for (var ac = 0; ac < 4; ac++) {
        var active = (ar * 4 + ac) === seed % 16 || (ar * 4 + ac) === (seed * 7) % 16;
        macs += '<rect x="' + (220 + ac * 40) + '" y="' + (72 + ar * 40) + '" width="30" height="30" rx="7" fill="' + (active ? '#cc5c32' : '#fffaf2') + '" stroke="#c9ad91" stroke-width="2"/>';
      }
      return common + '<path d="M145 90L205 114M145 140L205 140M145 190L205 166M445 140H505" fill="none" stroke="#9f795c" stroke-width="3" stroke-linecap="round"/>'
        + '<text x="112" y="70" text-anchor="middle" fill="#9b6a47">ACTIVATIONS</text><text x="112" y="231" text-anchor="middle" fill="#9b6a47">WEIGHTS</text>'
        + macs + '<rect x="485" y="104" width="86" height="72" rx="14" fill="#fffaf2" stroke="#c9ad91" stroke-width="2"/><text x="528" y="145" text-anchor="middle" fill="#594839">Σ ACC</text>';
    }

    var rtlBlocks = ['CTRL', 'ALU', 'MEM', 'ISSUE'];
    return common + '<path d="M135 138H190M275 138H330M415 138H470" fill="none" stroke="#9f795c" stroke-width="3" stroke-linecap="round"/>'
      + rtlBlocks.map(function (label, i) {
        var x = 42 + i * 140;
        return '<rect x="' + x + '" y="99" width="94" height="78" rx="14" fill="' + (i === seed % 4 ? '#cc5c32' : '#fffaf2') + '" stroke="#c9ad91" stroke-width="2"/>'
          + '<text x="' + (x + 47) + '" y="143" text-anchor="middle" fill="' + (i === seed % 4 ? '#fffaf2' : '#594839') + '">' + label + '</text>';
      }).join('')
      + '<text x="300" y="222" text-anchor="middle" fill="#9b6a47">REGISTER TRANSFER / LOGIC PATH</text>';
  }

  function addProjectArt(card, sectionId) {
    if (card.querySelector('.project-art')) return;
    var titleLink = card.querySelector('.card-title a');
    var title = titleLink ? titleLink.textContent.trim() : '';
    var seed = 2166136261;
    (sectionId + ':' + title).split('').forEach(function (character) {
      seed ^= character.charCodeAt(0);
      seed = Math.imul(seed, 16777619);
    });
    seed = seed >>> 0;
    var figure = document.createElement('figure');
    figure.className = 'project-art';
    figure.setAttribute('aria-hidden', 'true');
    figure.innerHTML = '<svg viewBox="0 0 600 280" preserveAspectRatio="xMidYMid slice" focusable="false">' + projectArtMarkup(sectionId, seed) + '</svg>';
    card.insertBefore(figure, card.firstChild);
  }

  Array.prototype.forEach.call(document.querySelectorAll('.projects-grid .project-card'), function (card) {
    var section = card.closest('section');
    addProjectArt(card, section ? section.id : 'rtl');
  });

  /* ---------------------------------------------------------------
     2c) Collapse the long project grids.

     The domain grids run 15-38 cards each; left open, the page is
     ~45,000px on a phone and nobody reaches section 03. Show the first
     few and put the rest behind a toggle.

     This runs at load rather than being written into index.html on
     purpose: scripts/sync.py regenerates each <ul class="projects-grid">
     wholesale between its AUTO markers, so any button committed inside
     the grid would be erased on the next sync. Doing it here also means
     that with JS off every card is still in the document.
  --------------------------------------------------------------- */
  var GRID_PREVIEW = 6;

  Array.prototype.forEach.call(document.querySelectorAll('.projects-grid'), function (grid, i) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.project-card'));
    // Two or three cards behind a toggle isn't worth the extra click.
    if (cards.length <= GRID_PREVIEW + 2) return;

    var hidden = cards.slice(GRID_PREVIEW);
    var section = grid.parentNode;
    while (section && section.nodeName !== 'SECTION') section = section.parentNode;
    if (!grid.id) grid.id = 'grid-' + (section && section.id ? section.id : i);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'grid-more';
    btn.setAttribute('aria-controls', grid.id);

    function apply(open) {
      hidden.forEach(function (card) { card.hidden = !open; });
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open
        ? 'Show fewer'
        : 'Show all ' + cards.length + ' builds';
    }

    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      apply(!open);
      // Collapsing from the bottom of a 38-card grid would leave the
      // reader stranded in whitespace — put them back at the grid.
      if (open && grid.getBoundingClientRect().top < 0) {
        grid.scrollIntoView({ block: 'start' });
      }
    });

    apply(false);
    grid.parentNode.insertBefore(btn, grid.nextSibling);
  });

  /* ---------------------------------------------------------------
     2d) Keep the "builds shipped" stat honest: count what's actually
         on the page rather than trusting a hand-typed number. The AI
         section cross-links builds from the four domain sections, so
         it is deliberately excluded from the tally. Collapsed cards
         still count — they are hidden, not absent.
  --------------------------------------------------------------- */
  var counters = document.querySelectorAll('[data-count-projects]');

  if (counters.length) {
    var builds = 0;
    ['#rtl', '#verification', '#codesign', '#comparch'].forEach(function (sel) {
      var sec = document.querySelector(sel);
      if (!sec) return;
      builds += sec.querySelectorAll('.project-card').length;
      builds += sec.querySelectorAll('.featured').length; // featured build sits outside its grid
    });
    if (builds > 1) {
      Array.prototype.forEach.call(counters, function (el) { el.textContent = builds; });
    }
  }

  /* ---------------------------------------------------------------
     3) Mobile menu.
  --------------------------------------------------------------- */
  function openMenu() {
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
    body.classList.add('menu-open');
    scrim.hidden = false;
  }

  function closeMenu() {
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
    body.classList.remove('menu-open');
    scrim.hidden = true;
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      if (mobileMenu.classList.contains('open')) closeMenu();
      else openMenu();
    });
  }
  if (scrim) scrim.addEventListener('click', closeMenu);

  if (mobileMenu) {
    mobileMenu.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      closeMenu();
      menuBtn.focus();
    }
  });

  // Close the mobile menu if the viewport grows past the mobile breakpoint.
  var mq = window.matchMedia('(min-width: 769px)');
  var onMq = function (e) { if (e.matches) closeMenu(); };
  if (mq.addEventListener) mq.addEventListener('change', onMq);
  else if (mq.addListener) mq.addListener(onMq); // older Safari
})();

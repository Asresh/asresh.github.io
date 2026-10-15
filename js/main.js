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
  function escapeSvg(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  function wrapCoverTitle(title) {
    var words = title.split(/\\s+/);
    var lines = [];
    var line = '';
    words.forEach(function (word) {
      var next = line ? line + ' ' + word : word;
      if (next.length > 27 && line) {
        lines.push(line);
        line = word;
      } else line = next;
    });
    if (line) lines.push(line);
    if (lines.length > 3) {
      lines = lines.slice(0, 3);
      lines[2] = lines[2].slice(0, 24).replace(/\\s+\\S*$/, '') + '…';
    }
    return lines;
  }

  function projectArtMarkup(sectionId, seed, title, tags) {
    var sectionInfo = {
      rtl: { label: 'RTL DESIGN', accent: '#df8a62', caption: 'LOGIC / DATAPATH' },
      verification: { label: 'DESIGN VERIFICATION', accent: '#e1b969', caption: 'TEST / SIGN-OFF' },
      codesign: { label: 'HARDWARE × SOFTWARE', accent: '#a3bd88', caption: 'RTL / FIRMWARE' },
      comparch: { label: 'COMPUTER ARCHITECTURE', accent: '#a4bdc7', caption: 'MICROARCHITECTURE' },
      ai: { label: 'AI HARDWARE', accent: '#efa267', caption: 'ACCELERATION / DATAFLOW' }
    };
    var info = sectionInfo[sectionId] || sectionInfo.rtl;
    var titleLines = wrapCoverTitle(title || 'Hardware project');
    var titleMarkup = titleLines.map(function (line, i) {
      return '<tspan x="28" dy="' + (i === 0 ? 0 : 24) + '">' + escapeSvg(line) + '</tspan>';
    }).join('');
    var safeTags = escapeSvg(tags.slice(0, 3).join('  ·  ') || info.caption);
    var gradientId = 'cover-gradient-' + seed;
    var patternId = 'cover-grid-' + seed;
    var words = (title + ' ' + tags.join(' ')).toLowerCase();
    var motif = '';

    if (/gemm|systolic|tensor|matmul|dot.product|sparse/.test(words)) {
      var cells = '';
      for (var row = 0; row < 4; row++) for (var col = 0; col < 4; col++) {
        var active = ((row * 5 + col * 3 + seed) % 7) < 2;
        cells += '<rect x="' + (416 + col * 29) + '" y="' + (72 + row * 29) + '" width="20" height="20" rx="5" fill="' + (active ? info.accent : '#f5e9dc') + '" fill-opacity="' + (active ? '.96' : '.17') + '" stroke="#fff4e8" stroke-opacity=".24"/>';
      }
      motif = '<path d="M398 82H408M398 140H408M398 198H408M448 54V65M506 54V65" stroke="' + info.accent + '" stroke-width="3" stroke-linecap="round"/>' + cells
        + '<text x="474" y="226" text-anchor="middle" fill="#f7eee4" class="art-label">MAC / PE ARRAY</text>';
    } else if (/uvm|verification|scoreboard|coverage|assert|testbench|sva|monitor/.test(words)) {
      var checks = '';
      for (var i = 0; i < 4; i++) {
        var yy = 84 + i * 35;
        var hot = i === seed % 4;
        checks += '<rect x="398" y="' + yy + '" width="166" height="24" rx="8" fill="#f5e9dc" fill-opacity="' + (hot ? '.22' : '.1') + '" stroke="#f5e9dc" stroke-opacity=".22"/>'
          + '<circle cx="416" cy="' + (yy + 12) + '" r="5" fill="' + (hot ? info.accent : '#9f8c79') + '"/>'
          + '<path d="M431 ' + (yy + 12) + 'H' + (500 + ((seed + i) % 3) * 12) + '" stroke="#f5e9dc" stroke-opacity=".58" stroke-width="3" stroke-linecap="round"/>';
      }
      motif = checks + '<text x="481" y="232" text-anchor="middle" fill="#f7eee4" class="art-label">CHECKS / COVERAGE</text>';
    } else if (/crossbar|coalesc|network|fabric|arbiter|scheduler|reconverg|simt|warp/.test(words)) {
      var nodes = [[412, 92], [484, 74], [548, 108], [422, 162], [500, 158], [550, 202]];
      var edges = [[0,1],[1,2],[0,3],[1,4],[2,4],[3,4],[4,5]];
      motif = edges.map(function (edge, i) {
        var a = nodes[edge[0]], b = nodes[edge[1]];
        var emphasized = (i + seed) % 4 === 0;
        return '<path d="M' + a[0] + ' ' + a[1] + 'L' + b[0] + ' ' + b[1] + '" stroke="' + (emphasized ? info.accent : '#f5e9dc') + '" stroke-opacity="' + (emphasized ? '.95' : '.3') + '" stroke-width="' + (emphasized ? '3' : '2') + '"/>';
      }).join('') + nodes.map(function (point, i) {
        return '<circle cx="' + point[0] + '" cy="' + point[1] + '" r="' + (i === seed % nodes.length ? '11' : '7') + '" fill="' + (i === seed % nodes.length ? info.accent : '#f5e9dc') + '"/>';
      }).join('') + '<text x="482" y="238" text-anchor="middle" fill="#f7eee4" class="art-label">CONTROL / ROUTING</text>';
    } else if (/stack|queue|buffer|cache|memory|tlb|store|fifo|reorder/.test(words)) {
      var rows = '';
      for (var r = 0; r < 4; r++) {
        var top = 79 + r * 34;
        var selected = r === (seed % 4);
        rows += '<rect x="408" y="' + top + '" width="148" height="25" rx="7" fill="' + (selected ? info.accent : '#f5e9dc') + '" fill-opacity="' + (selected ? '.92' : '.16') + '" stroke="#f5e9dc" stroke-opacity=".25"/>'
          + '<path d="M424 ' + (top + 12) + 'H' + (472 + (r % 2) * 18) + '" stroke="#fff4e8" stroke-opacity=".62" stroke-width="3" stroke-linecap="round"/>';
      }
      motif = rows + '<path d="M390 ' + (91 + (seed % 4) * 34) + 'H401" stroke="' + info.accent + '" stroke-width="4" stroke-linecap="round"/><text x="482" y="232" text-anchor="middle" fill="#f7eee4" class="art-label">QUEUE / STATE FLOW</text>';
    } else {
      var stages = ['INPUT', 'MAP', 'CORE', 'OUTPUT'];
      motif = '<path d="M418 142H550" stroke="#f5e9dc" stroke-opacity=".5" stroke-width="2"/>'
        + stages.map(function (label, i) {
          var x = 400 + i * 43;
          var hot = i === seed % stages.length;
          return '<rect x="' + x + '" y="' + (116 - (i % 2) * 13) + '" width="34" height="52" rx="9" fill="' + (hot ? info.accent : '#f5e9dc') + '" fill-opacity="' + (hot ? '.96' : '.17') + '" stroke="#f5e9dc" stroke-opacity=".35"/>'
            + '<text x="' + (x + 17) + '" y="194" text-anchor="middle" fill="#f7eee4" class="art-tiny">' + label + '</text>';
        }).join('');
    }

    return '<defs><linearGradient id="' + gradientId + '" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#211d1a"/><stop offset="1" stop-color="#49372b"/></linearGradient>'
      + '<pattern id="' + patternId + '" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" fill="none" stroke="#f5e9dc" stroke-opacity=".07"/></pattern></defs>'
      + '<rect width="600" height="280" fill="url(#' + gradientId + ')"/><rect width="600" height="280" fill="url(#' + patternId + ')"/>'
      + '<path d="M360 0V280" stroke="#f5e9dc" stroke-opacity=".12"/>'
      + '<text x="28" y="37" fill="' + info.accent + '" class="art-kicker">' + info.label + '</text>'
      + '<rect x="478" y="18" width="94" height="26" rx="13" fill="' + info.accent + '" fill-opacity=".18" stroke="' + info.accent + '" stroke-opacity=".58"/>'
      + '<text x="525" y="35" text-anchor="middle" fill="' + info.accent + '" class="art-tiny">PROJECT</text>'
      + '<text x="28" y="93" fill="#fff8f0" class="art-title">' + titleMarkup + '</text>'
      + '<text x="28" y="239" fill="#d8c8b7" class="art-caption">' + safeTags + '</text>'
      + '<text x="28" y="261" fill="' + info.accent + '" class="art-tiny">' + info.caption + '</text>'
      + motif;
  }

  function addProjectArt(card, sectionId) {
    if (card.querySelector('.project-art')) return;
    var titleLink = card.querySelector('.card-title a');
    var title = titleLink ? titleLink.textContent.trim() : '';
    var tagEls = card.querySelectorAll('.card-tech li');
    var tags = Array.prototype.map.call(tagEls, function (tag) { return tag.textContent.trim(); });
    var seed = 2166136261;
    (sectionId + ':' + title).split('').forEach(function (character) {
      seed ^= character.charCodeAt(0);
      seed = Math.imul(seed, 16777619);
    });
    seed = seed >>> 0;
    var figure = document.createElement('figure');
    figure.className = 'project-art';
    figure.setAttribute('aria-hidden', 'true');
    figure.innerHTML = '<svg viewBox="0 0 600 280" preserveAspectRatio="xMidYMid slice" focusable="false">' + projectArtMarkup(sectionId, seed, title, tags) + '</svg>';
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

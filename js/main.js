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

    if (/prefix|kogge.stone|scan|reduction.tree|allreduce/.test(words)) {
      var treeNodes = [[418, 87], [464, 87], [510, 87], [556, 87], [441, 143], [533, 143], [487, 201]];
      var treeEdges = [[0,4],[1,4],[2,5],[3,5],[4,6],[5,6]];
      motif = treeEdges.map(function (edge, i) {
        var a = treeNodes[edge[0]], b = treeNodes[edge[1]];
        return '<path d="M' + a[0] + ' ' + a[1] + 'L' + b[0] + ' ' + b[1] + '" stroke="' + ((i + seed) % 3 === 0 ? info.accent : '#f5e9dc') + '" stroke-opacity=".62" stroke-width="3"/>';
      }).join('') + treeNodes.map(function (point, i) {
        return '<circle cx="' + point[0] + '" cy="' + point[1] + '" r="10" fill="' + (i === seed % treeNodes.length ? info.accent : '#49372b') + '" stroke="#f5e9dc" stroke-opacity=".8" stroke-width="2"/>';
      }).join('') + '<text x="487" y="238" text-anchor="middle" fill="#f7eee4" class="art-label">PARALLEL PREFIX TREE</text>';
    } else if (/bitonic|sorting.network|sort(ing)?/.test(words)) {
      var wireY = [83, 111, 139, 167, 195];
      var comparatorLayers = [[0,4],[1,3],[0,2],[1,4],[2,3],[0,1],[2,4],[1,2],[3,4]];
      motif = wireY.map(function (y, i) {
        return '<path d="M405 ' + y + 'H558" stroke="#f5e9dc" stroke-opacity=".38" stroke-width="2"/>'
          + '<circle cx="405" cy="' + y + '" r="4" fill="' + info.accent + '"/><circle cx="558" cy="' + y + '" r="4" fill="#f5e9dc"/>';
      }).join('') + comparatorLayers.map(function (pair, i) {
        var x = 424 + (i % 5) * 27;
        var y1 = wireY[pair[0]], y2 = wireY[pair[1]];
        return '<path d="M' + x + ' ' + y1 + 'L' + x + ' ' + y2 + '" stroke="' + (i % 3 === seed % 3 ? info.accent : '#f5e9dc') + '" stroke-opacity=".8" stroke-width="3" stroke-linecap="round"/><circle cx="' + x + '" cy="' + y1 + '" r="4" fill="#f5e9dc"/><circle cx="' + x + '" cy="' + y2 + '" r="4" fill="#f5e9dc"/>';
      }).join('') + '<text x="482" y="238" text-anchor="middle" fill="#f7eee4" class="art-label">COMPARE / EXCHANGE</text>';
    } else if (/gemm|tensor|matmul|dot.product|sparse|systolic.array|systolic.mac/.test(words)) {
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
    } else if (/cordic|sine|cosine|vector.rotat|kinematic|motor.current|goertzel|fir|fft|filter|sdr|sobel|texture/.test(words)) {
      var signal = [];
      for (var wave = 0; wave < 31; wave++) {
        var px = 400 + wave * 5.2;
        var py = 140 + Math.sin((wave + seed % 9) * .58) * (26 + ((wave + seed) % 5) * 3);
        signal.push((wave ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1));
      }
      motif = '<path d="' + signal.join(' ') + '" fill="none" stroke="' + info.accent + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
        + '<path d="M402 140H560M420 83V202M470 83V202M520 83V202" stroke="#f5e9dc" stroke-opacity=".18" stroke-width="1"/>'
        + '<circle cx="' + (438 + seed % 95) + '" cy="' + (122 + seed % 32) + '" r="6" fill="#fff4e8"/><text x="482" y="238" text-anchor="middle" fill="#f7eee4" class="art-label">SIGNAL / TRANSFORM</text>';
    } else if (/crc|ecc|hamming|reed.solomon|\baes\b|\bsha(?:-?256)?\b|crypt|viterbi|scrambl|line.code|8b\/10b/.test(words)) {
      var bits = '';
      for (var b = 0; b < 16; b++) {
        var bx = 405 + (b % 4) * 39;
        var by = 83 + Math.floor(b / 4) * 35;
        var bitOn = ((b * 7 + seed) % 5) < 2;
        bits += '<rect x="' + bx + '" y="' + by + '" width="27" height="24" rx="6" fill="' + (bitOn ? info.accent : '#f5e9dc') + '" fill-opacity="' + (bitOn ? '.88' : '.17') + '" stroke="#f5e9dc" stroke-opacity=".3"/>'
          + '<text x="' + (bx + 13.5) + '" y="' + (by + 16) + '" text-anchor="middle" fill="#fff8f0" class="art-tiny">' + (bitOn ? '1' : '0') + '</text>';
      }
      motif = bits + '<path d="M410 226H551" stroke="' + info.accent + '" stroke-width="3" stroke-linecap="round"/><text x="482" y="251" text-anchor="middle" fill="#f7eee4" class="art-label">ENCODE / CHECK / RECOVER</text>';
    } else if (/controller|protocol|axi|i²c|i2c|spi|uart|jtag|pcie|usb|ddr|serdes|state.machine|sequencer/.test(words)) {
      var states = [[420,96],[495,76],[548,126],[515,194],[428,190]];
      var stateEdges = [[0,1],[1,2],[2,3],[3,4],[4,0],[0,3]];
      motif = stateEdges.map(function (edge, i) {
        var a = states[edge[0]], b = states[edge[1]];
        return '<path d="M' + a[0] + ' ' + a[1] + 'Q' + ((a[0] + b[0]) / 2 + (i % 2 ? 12 : -12)) + ' ' + ((a[1] + b[1]) / 2 - 14) + ' ' + b[0] + ' ' + b[1] + '" fill="none" stroke="#f5e9dc" stroke-opacity=".42" stroke-width="2" marker-end="url(#arrow-' + seed + ')"/>';
      }).join('') + states.map(function (point, i) {
        return '<rect x="' + (point[0] - 23) + '" y="' + (point[1] - 14) + '" width="46" height="28" rx="9" fill="' + (i === seed % states.length ? info.accent : '#49372b') + '" stroke="#f5e9dc" stroke-opacity=".6"/>';
      }).join('') + '<text x="482" y="238" text-anchor="middle" fill="#f7eee4" class="art-label">PROTOCOL / STATE FLOW</text>';
    } else if (/crossbar|coalesc|network|fabric|arbiter|scheduler|reconverg|simt|warp|router|noc/.test(words)) {
      var nodes = [[412, 92], [484, 74], [548, 108], [422, 162], [500, 158], [550, 202]];
      var edges = [[0,1],[1,2],[0,3],[1,4],[2,4],[3,4],[4,5]];
      motif = edges.map(function (edge, i) {
        var a = nodes[edge[0]], b = nodes[edge[1]];
        var emphasized = (i + seed) % 4 === 0;
        return '<path d="M' + a[0] + ' ' + a[1] + 'L' + b[0] + ' ' + b[1] + '" stroke="' + (emphasized ? info.accent : '#f5e9dc') + '" stroke-opacity="' + (emphasized ? '.95' : '.3') + '" stroke-width="' + (emphasized ? '3' : '2') + '"/>';
      }).join('') + nodes.map(function (point, i) {
        return '<circle cx="' + point[0] + '" cy="' + point[1] + '" r="' + (i === seed % nodes.length ? '11' : '7') + '" fill="' + (i === seed % nodes.length ? info.accent : '#f5e9dc') + '"/>';
      }).join('') + '<text x="482" y="238" text-anchor="middle" fill="#f7eee4" class="art-label">CONTROL / ROUTING</text>';
    } else if (/risc.v|rv32|cpu|branch.predict|register.renam|issue.queue|instruction.fetch|processor|tomasulo/.test(words)) {
      var pipeLabels = ['FETCH', 'DECODE', 'EXEC', 'MEM', 'WRITE'];
      motif = '<path d="M402 145H565" stroke="#f5e9dc" stroke-opacity=".42" stroke-width="2"/>'
        + pipeLabels.map(function (label, i) {
          var x = 399 + i * 33;
          var lit = ((i + seed) % 5) === 1;
          return '<rect x="' + x + '" y="' + (106 + (i % 2) * 24) + '" width="28" height="38" rx="7" fill="' + (lit ? info.accent : '#f5e9dc') + '" fill-opacity="' + (lit ? '.95' : '.2') + '" stroke="#f5e9dc" stroke-opacity=".42"/>'
            + '<text x="' + (x + 14) + '" y="' + (163 + (i % 2) * 24) + '" text-anchor="middle" fill="#f7eee4" class="art-tiny">' + label + '</text>';
        }).join('') + '<text x="482" y="238" text-anchor="middle" fill="#f7eee4" class="art-label">INSTRUCTION PIPELINE</text>';
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


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
     2b) Illustrate every project with a layered preview.
     Project titles and tags choose the diagram and its motion for
     new cards added by the portfolio sync.
  --------------------------------------------------------------- */
  function projectArtMarkup(seed, title, tags) {
    var accent = 'currentColor';
    var words = (title + ' ' + tags.join(' ')).toLowerCase();
    var motif = '';
    var tempo = .88 + (seed % 13) * .025;

    function motion(kind, beat, duration) {
      var phase = (seed % 17) / 17 * duration + beat;
      return ' class="art-motion art-' + kind + '" style="--art-delay:-' + (phase * tempo).toFixed(2)
        + 's;--art-period:' + (duration * tempo).toFixed(2) + 's"';
    }

    function trace(path, beat, duration) {
      return '<path d="' + path + '" pathLength="100" fill="none" stroke="' + accent
        + '" stroke-width="4" stroke-linecap="round"' + motion('trace', beat, duration) + '/>';
    }

    function block(x, y, width, height, color, beat, duration) {
      var right = x + width;
      var bottom = y + height;
      var topFace = x + ',' + y + ' ' + (x + 5) + ',' + (y - 5) + ' ' + (right + 5) + ',' + (y - 5) + ' ' + right + ',' + y;
      var sideFace = right + ',' + y + ' ' + (right + 5) + ',' + (y - 5) + ' ' + (right + 5) + ',' + (bottom - 5) + ' ' + right + ',' + bottom;
      return '<g' + motion('tile', beat, duration) + '>'
        + '<polygon points="' + topFace + '" fill="#eadbc8"/>'
        + '<polygon points="' + sideFace + '" fill="#9c795e"/>'
        + '<rect x="' + x + '" y="' + y + '" width="' + width + '" height="' + height
        + '" rx="2" fill="' + color + '" stroke="#a88367" stroke-opacity=".44"/></g>';
    }

    if (/flow health|retransmission|observability/.test(words)) {
      var graphPath = 'M409 160H434L448 108L461 152H481L493 91L510 160H529L541 123L556 160';
      motif = '<path d="M401 185H562M401 80V185" stroke="#a9907b" fill="none"/>'
        + '<path d="' + graphPath + '" fill="none" stroke="' + accent + '" stroke-opacity=".45" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
        + trace(graphPath, 0, 3.1)
        + '<circle cx="493" cy="91" r="6" fill="' + accent + '"' + motion('beacon', .6, 3.1) + '/>'
        + '<text x="481" y="222" text-anchor="middle" fill="#5b3824" class="art-label">TCP RETRANSMITS</text>';
    } else if (/collective transport|reduce.scatter|all.gather/.test(words)) {
      var ring = 'M480 80L551 136L480 192L409 136Z';
      motif = '<path d="' + ring + '" fill="none" stroke="#a9907b" stroke-width="3"/>'
        + trace(ring, 0, 3.8)
        + [[480, 80], [551, 136], [480, 192], [409, 136]].map(function (point, i) {
          return '<circle cx="' + point[0] + '" cy="' + point[1] + '" r="11" fill="'
            + (i === seed % 4 ? accent : '#a9907b') + '"' + motion('beacon', -i * .475 + 1.425, 1.9) + '/>';
        }).join('') + '<text x="480" y="228" text-anchor="middle" fill="#5b3824" class="art-label">RING COLLECTIVE</text>';
    } else if (/moldudp|itch receiver|feed recovery/.test(words)) {
      motif = '<path d="M406 111H451L478 144H553M406 177H451L478 144" fill="none" stroke="#a9907b" stroke-width="3"/>'
        + trace('M406 111H451L478 144', 0, 3.6)
        + trace('M406 177H451L478 144', .5, 3.6)
        + trace('M478 144H553', 1, 3.6)
        + '<rect x="404" y="101" width="37" height="20" rx="5" fill="#d6b294"' + motion('tile', 1.2, 3.6) + '/>'
        + '<rect x="404" y="167" width="37" height="20" rx="5" fill="#d6b294"' + motion('tile', .7, 3.6) + '/>'
        + '<rect x="476" y="132" width="28" height="24" rx="5" fill="' + accent + '"' + motion('tile', .4, 3.6) + '/>'
        + '<rect x="531" y="134" width="25" height="20" rx="5" fill="#d6b294"' + motion('tile', 0, 3.6) + '/>'
        + '<text x="480" y="224" text-anchor="middle" fill="#5b3824" class="art-label">REDUNDANT FEED MERGE</text>';
    } else if (/matching engine|order.book|price.time/.test(words)) {
      var orderRows = [103, 128, 153, 178];
      motif = '<path d="M480 89V193" stroke="#a9907b" stroke-width="2"/>'
        + orderRows.map(function (y, i) {
          var width = 20 + ((i * 7 + seed) % 4) * 10;
          return '<rect x="' + (474 - width) + '" y="' + y + '" width="' + width + '" height="12" rx="3" fill="#c5a78d"' + motion('bid', i * .19, 2.8) + '/>'
            + '<rect x="487" y="' + y + '" width="' + (70 - width) + '" height="12" rx="3" fill="' + accent + '" fill-opacity="' + (i === 0 ? '.95' : '.6') + '"' + motion('ask', i * .32 + .25, 3.1) + '/>';
        }).join('') + '<text x="481" y="222" text-anchor="middle" fill="#5b3824" class="art-label">BIDS / ASKS</text>';
    } else if (/latency telemetry|histogram/.test(words)) {
      var bucketHeights = [16, 36, 63, 88, 53, 26, 13];
      motif = '<path d="M405 187H560" stroke="#a9907b" stroke-width="2"/>'
        + bucketHeights.map(function (height, i) {
          return '<rect x="' + (409 + i * 22) + '" y="' + (184 - height) + '" width="15" height="' + height + '" rx="3" fill="' + (i === 3 ? accent : '#b9967b') + '"' + motion('bar', i * .2, 2.7 + (i % 3) * .28) + '/>';
        }).join('') + '<text x="481" y="224" text-anchor="middle" fill="#5b3824" class="art-label">LATENCY HISTOGRAM</text>';
    } else if (/order.risk|execution.gateway|risk.limits|admission/.test(words)) {
      var riskPath = 'M402 140H555';
      motif = '<path d="' + riskPath + '" fill="none" stroke="#a9907b" stroke-width="3"/>'
        + trace(riskPath, 0, 3.6)
        + '<rect x="407" y="125" width="30" height="30" rx="6" fill="#c5a78d"' + motion('tile', .9, 3.6) + '/>'
        + '<g' + motion('tile', .45, 3.6) + '><path d="M481 105L514 119V147Q514 169 481 182Q448 169 448 147V119Z" fill="' + accent + '"/>'
        + '<path d="M467 142L478 153L497 132" fill="none" stroke="#fffaf3" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>'
        + '<rect x="528" y="125" width="30" height="30" rx="6" fill="#c5a78d"' + motion('tile', 0, 3.6) + '/>'
        + '<text x="481" y="224" text-anchor="middle" fill="#5b3824" class="art-label">ORDER ADMISSION</text>';
    } else if (/inference gateway|model serving/.test(words)) {
      var gatewayRoutes = ['M403 145H452L491 105H553', 'M452 145H553', 'M452 145L491 185H553'];
      motif = gatewayRoutes.map(function (path, i) {
        return '<path d="' + path + '" fill="none" stroke="#a9907b" stroke-width="3"/>'
          + trace(path, i * .6, 3.6);
      }).join('') + block(435, 132, 28, 26, accent, .55, 3.6)
        + [105, 145, 185].map(function (y, i) {
          return block(526, y - 11, 29, 22, '#cfaa8b', i * .6, 3.6);
        }).join('') + '<text x="481" y="222" text-anchor="middle" fill="#5b3824" class="art-label">REQUEST ROUTING</text>';
    } else if (/company analysis agent|investment thesis/.test(words)) {
      var agentInputs = [94, 134, 174];
      motif = agentInputs.map(function (y, i) {
        var path = 'M420 ' + y + 'H450L486 145H536';
        return '<path d="' + path + '" fill="none" stroke="#a9907b" stroke-width="2.5"/>'
          + trace(path, i * .52, 4.2)
          + block(405, y - 10, 25, 20, '#d2b091', i * .52 + .4, 4.2);
      }).join('') + '<g' + motion('tile', 0, 4.2) + '><rect x="518" y="122" width="37" height="47" rx="5" fill="' + accent + '"/>'
        + '<path d="M527 136h17m-17 8h13m-13 8h17" stroke="#fffaf3" stroke-width="2.5" stroke-linecap="round"/></g>'
        + '<text x="481" y="222" text-anchor="middle" fill="#5b3824" class="art-label">EVIDENCE SYNTHESIS</text>';
    } else if (/signaldesk|triage copilot|incident response/.test(words)) {
      var alertFlow = 'M404 174H430L466 145H491L519 110H556';
      motif = '<path d="' + alertFlow + '" fill="none" stroke="#a9907b" stroke-width="3"/>'
        + trace(alertFlow, 0, 3.8)
        + [[421, 174, 0], [475, 145, 1], [540, 110, 2]].map(function (tile) {
          return '<g' + motion('tile', (2 - tile[2]) * .5, 3.8) + '><rect x="' + (tile[0] - 13) + '" y="' + (tile[1] - 11)
            + '" width="26" height="22" rx="5" fill="' + (tile[2] === 2 ? accent : '#c5a78d') + '"/>'
            + '<text x="' + tile[0] + '" y="' + (tile[1] + 3) + '" text-anchor="middle" fill="#fffaf3" class="art-tiny">' + (3 - tile[2]) + '</text></g>';
        }).join('') + '<text x="481" y="222" text-anchor="middle" fill="#5b3824" class="art-label">ALERT PRIORITIZATION</text>';
    } else if (/boundarycheck|readiness|deployment|scanner|security|safety/.test(words)) {
      var checks = '';
      for (var check = 0; check < 4; check++) {
        var rowY = 84 + check * 35;
        var passed = ((check + seed) % 4) !== 1;
        checks += '<g' + motion('tray', (3 - check) * .38, 3.5) + '><rect x="398" y="' + rowY + '" width="166" height="24" rx="8" fill="#a9907b" fill-opacity=".14" stroke="#a9907b" stroke-opacity=".24"/>'
          + '<circle cx="416" cy="' + (rowY + 12) + '" r="6" fill="' + (passed ? accent : '#c77b63') + '"/>'
          + '<path d="M431 ' + (rowY + 12) + 'H' + (500 + ((seed + check) % 3) * 12) + '" stroke="#a9907b" stroke-opacity=".58" stroke-width="3" stroke-linecap="round"/></g>';
      }
      motif = checks + '<text x="481" y="232" text-anchor="middle" fill="#5b3824" class="art-label">DEPLOYMENT CHECKS</text>';
    } else if (/prefix|kogge.stone|scan|reduction.tree|allreduce/.test(words)) {
      var treeNodes = [[418, 87], [464, 87], [510, 87], [556, 87], [441, 143], [533, 143], [487, 201]];
      var treeEdges = [[0,4],[1,4],[2,5],[3,5],[4,6],[5,6]];
      motif = treeEdges.map(function (edge, i) {
        var a = treeNodes[edge[0]], b = treeNodes[edge[1]];
        var path = 'M' + a[0] + ' ' + a[1] + 'L' + b[0] + ' ' + b[1];
        return '<path d="' + path + '" stroke="#a9907b" stroke-opacity=".62" stroke-width="3"/>'
          + trace(path, i < 4 ? 1.2 : 0, 3.8);
      }).join('') + treeNodes.map(function (point, i) {
        return '<circle cx="' + point[0] + '" cy="' + point[1] + '" r="10" fill="' + (i === seed % treeNodes.length ? accent : '#efd8bc') + '" stroke="#a9907b" stroke-opacity=".8" stroke-width="2"'
          + motion('beacon', i < 4 ? 1.4 : i < 6 ? .7 : 0, 3.8) + '/>';
      }).join('') + '<text x="487" y="238" text-anchor="middle" fill="#5b3824" class="art-label">PARALLEL PREFIX TREE</text>';
    } else if (/bitonic|sorting.network|sort(ing)?/.test(words)) {
      var wireY = [83, 111, 139, 167, 195];
      var comparatorLayers = [[0,4],[1,3],[0,2],[1,4],[2,3],[0,1],[2,4],[1,2],[3,4]];
      motif = wireY.map(function (y, i) {
        var wire = 'M405 ' + y + 'H558';
        return '<path d="' + wire + '" stroke="#a9907b" stroke-opacity=".38" stroke-width="2"/>'
          + trace(wire, ((i + seed) % 5) * .26, 3.6)
          + '<circle cx="405" cy="' + y + '" r="4" fill="' + accent + '"/><circle cx="558" cy="' + y + '" r="4" fill="#a9907b"/>';
      }).join('') + comparatorLayers.map(function (pair, i) {
        var x = 424 + (i % 5) * 27;
        var y1 = wireY[pair[0]], y2 = wireY[pair[1]];
        return '<g' + motion('beacon', (5 - i % 5) * .22, 3.6) + '><path d="M' + x + ' ' + y1 + 'L' + x + ' ' + y2 + '" stroke="' + (i % 3 === seed % 3 ? accent : '#a9907b') + '" stroke-opacity=".8" stroke-width="3" stroke-linecap="round"/><circle cx="' + x + '" cy="' + y1 + '" r="4" fill="#a9907b"/><circle cx="' + x + '" cy="' + y2 + '" r="4" fill="#a9907b"/></g>';
      }).join('') + '<text x="482" y="238" text-anchor="middle" fill="#5b3824" class="art-label">COMPARE / EXCHANGE</text>';
    } else if (/gemm|tensor|matmul|dot.product|sparse|systolic.array|systolic.mac/.test(words)) {
      var cells = '';
      for (var row = 0; row < 4; row++) for (var col = 0; col < 4; col++) {
        var active = ((row * 5 + col * 3 + seed) % 7) < 2;
        cells += block(416 + col * 29, 72 + row * 29, 19, 19, active ? accent : '#e7d1b8', (6 - row - col) * .28, 3.6);
      }
      motif = '<path d="M398 82H408M398 140H408M398 198H408M448 54V65M506 54V65" stroke="' + accent + '" stroke-width="3" stroke-linecap="round"/>' + cells
        + '<text x="474" y="226" text-anchor="middle" fill="#5b3824" class="art-label">MAC / PE ARRAY</text>';
    } else if (/uvm|verification|scoreboard|coverage|assert|testbench|sva|monitor/.test(words)) {
      var checks = '';
      for (var i = 0; i < 4; i++) {
        var yy = 84 + i * 35;
        var hot = i === seed % 4;
        checks += '<g' + motion('tray', (3 - i) * .38, 3.4) + '><rect x="398" y="' + yy + '" width="166" height="24" rx="8" fill="#a9907b" fill-opacity="' + (hot ? '.22' : '.1') + '" stroke="#a9907b" stroke-opacity=".22"/>'
          + '<circle cx="416" cy="' + (yy + 12) + '" r="5" fill="' + (hot ? accent : '#806852') + '"/>'
          + '<path d="M431 ' + (yy + 12) + 'H' + (500 + ((seed + i) % 3) * 12) + '" stroke="#a9907b" stroke-opacity=".58" stroke-width="3" stroke-linecap="round"/></g>';
      }
      motif = checks + '<text x="481" y="232" text-anchor="middle" fill="#5b3824" class="art-label">CHECKS / COVERAGE</text>';
    } else if (/cordic|sine|cosine|vector.rotat|kinematic|motor.current|goertzel|fir|fft|filter|sdr|sobel|texture/.test(words)) {
      var signal = [];
      for (var wave = 0; wave < 31; wave++) {
        var px = 400 + wave * 5.2;
        var py = 140 + Math.sin((wave + seed % 9) * .58) * (26 + ((wave + seed) % 5) * 3);
        signal.push((wave ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1));
      }
      var signalPath = signal.join(' ');
      motif = '<path d="M402 140H560M420 83V202M470 83V202M520 83V202" stroke="#a9907b" stroke-opacity=".25" stroke-width="1"/>'
        + '<g' + motion('wave', 0, 3.7) + '><path d="' + signalPath + '" fill="none" stroke="#9c7659" stroke-opacity=".55" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
        + trace(signalPath, 0, 3.7) + '</g>'
        + '<text x="482" y="238" text-anchor="middle" fill="#5b3824" class="art-label">SIGNAL / TRANSFORM</text>';
    } else if (/crc|ecc|hamming|reed.solomon|\baes\b|\bsha(?:-?256)?\b|crypt|viterbi|scrambl|line.code|8b\/10b/.test(words)) {
      var bits = '';
      for (var b = 0; b < 16; b++) {
        var bx = 405 + (b % 4) * 39;
        var by = 83 + Math.floor(b / 4) * 35;
        var bitOn = ((b * 7 + seed) % 5) < 2;
        bits += '<g' + motion('bit', b * .16, 3.7) + '><rect x="' + bx + '" y="' + by + '" width="27" height="24" rx="6" fill="' + (bitOn ? accent : '#a9907b') + '" fill-opacity="' + (bitOn ? '.88' : '.24') + '" stroke="#a9907b" stroke-opacity=".3"/>'
          + '<text x="' + (bx + 13.5) + '" y="' + (by + 16) + '" text-anchor="middle" fill="' + (bitOn ? '#fffaf3' : '#5b3824') + '" class="art-tiny">' + (bitOn ? '1' : '0') + '</text></g>';
      }
      motif = bits + '<path d="M410 226H551" stroke="' + accent + '" stroke-width="3" stroke-linecap="round"/><text x="482" y="251" text-anchor="middle" fill="#5b3824" class="art-label">ENCODE / CHECK / RECOVER</text>';
    } else if (/controller|protocol|axi|i²c|i2c|spi|uart|jtag|pcie|usb|ddr|serdes|state.machine|sequencer/.test(words)) {
      var states = [[420,96],[495,76],[548,126],[515,194],[428,190]];
      var stateEdges = [[0,1],[1,2],[2,3],[3,4],[4,0],[0,3]];
      motif = stateEdges.map(function (edge, i) {
        var a = states[edge[0]], b = states[edge[1]];
        var route = 'M' + a[0] + ' ' + a[1] + 'Q' + ((a[0] + b[0]) / 2 + (i % 2 ? 12 : -12)) + ' ' + ((a[1] + b[1]) / 2 - 14) + ' ' + b[0] + ' ' + b[1];
        return '<path d="' + route + '" fill="none" stroke="#a9907b" stroke-opacity=".42" stroke-width="2"/>'
          + trace(route, (5 - i) * .3, 4);
      }).join('') + states.map(function (point, i) {
        return block(point[0] - 20, point[1] - 12, 40, 24, i === seed % states.length ? accent : '#efd8bc', (4 - i) * .55, 4);
      }).join('') + '<text x="482" y="238" text-anchor="middle" fill="#5b3824" class="art-label">PROTOCOL / STATE FLOW</text>';
    } else if (/crossbar|coalesc|network|fabric|arbiter|scheduler|reconverg|simt|warp|router|noc/.test(words)) {
      var nodes = [[412, 92], [484, 74], [548, 108], [422, 162], [500, 158], [550, 202]];
      var edges = [[0,1],[1,2],[0,3],[1,4],[2,4],[3,4],[4,5]];
      motif = edges.map(function (edge, i) {
        var a = nodes[edge[0]], b = nodes[edge[1]];
        var emphasized = (i + seed) % 4 === 0;
        var connection = 'M' + a[0] + ' ' + a[1] + 'L' + b[0] + ' ' + b[1];
        return '<path d="' + connection + '" stroke="#a9907b" stroke-opacity="' + (emphasized ? '.75' : '.35') + '" stroke-width="' + (emphasized ? '3' : '2') + '"/>'
          + trace(connection, ((i + seed) % 7) * .27, 3.7);
      }).join('') + nodes.map(function (point, i) {
        return '<circle cx="' + point[0] + '" cy="' + point[1] + '" r="' + (i === seed % nodes.length ? '11' : '7') + '" fill="' + (i === seed % nodes.length ? accent : '#a9907b') + '"' + motion('beacon', i * .38, 3.7) + '/>';
      }).join('') + '<text x="482" y="238" text-anchor="middle" fill="#5b3824" class="art-label">CONTROL / ROUTING</text>';
    } else if (/risc.v|rv32|cpu|branch.predict|register.renam|issue.queue|instruction.fetch|processor|tomasulo/.test(words)) {
      var pipeLabels = ['FETCH', 'DECODE', 'EXEC', 'MEM', 'WRITE'];
      var instructionBus = 'M402 145H565';
      motif = '<path d="' + instructionBus + '" stroke="#a9907b" stroke-opacity=".42" stroke-width="2"/>'
        + trace(instructionBus, 0, 3.6)
        + pipeLabels.map(function (label, i) {
          var x = 399 + i * 33;
          var lit = ((i + seed) % 5) === 1;
          return block(x, 106 + (i % 2) * 24, 26, 38, lit ? accent : '#d9bea3', (4 - i) * .35, 3.6)
            + '<text x="' + (x + 14) + '" y="' + (163 + (i % 2) * 24) + '" text-anchor="middle" fill="#5b3824" class="art-tiny">' + label + '</text>';
        }).join('') + '<text x="482" y="238" text-anchor="middle" fill="#5b3824" class="art-label">INSTRUCTION PIPELINE</text>';
    } else if (/stack|queue|buffer|cache|memory|tlb|store|fifo|reorder/.test(words)) {
      var rows = '';
      for (var r = 0; r < 4; r++) {
        var top = 79 + r * 34;
        var selected = r === (seed % 4);
        rows += '<g' + motion('tray', (3 - r) * .42, 3.8) + '><rect x="408" y="' + top + '" width="148" height="25" rx="7" fill="' + (selected ? accent : '#a9907b') + '" fill-opacity="' + (selected ? '.92' : '.22') + '" stroke="#a9907b" stroke-opacity=".35"/>'
          + '<path d="M424 ' + (top + 12) + 'H' + (472 + (r % 2) * 18) + '" stroke="' + (selected ? '#f4c75e' : '#a88367') + '" stroke-opacity=".75" stroke-width="3" stroke-linecap="round"/></g>';
      }
      motif = rows + '<path d="M390 ' + (91 + (seed % 4) * 34) + 'H401" stroke="' + accent + '" stroke-width="4" stroke-linecap="round"/><text x="482" y="232" text-anchor="middle" fill="#5b3824" class="art-label">QUEUE / STATE FLOW</text>';
    } else {
      var stages = ['INPUT', 'MAP', 'CORE', 'OUTPUT'];
      var datapath = 'M408 142H559';
      motif = '<path d="' + datapath + '" stroke="#a9907b" stroke-opacity=".5" stroke-width="2"/>'
        + trace(datapath, 0, 3.4)
        + stages.map(function (label, i) {
          var x = 400 + i * 43;
          var hot = i === seed % stages.length;
          var height = 32 + ((seed + i * 17) % 4) * 8;
          return block(x, 142 - height / 2, 28, height, hot ? accent : '#d9bea3', (3 - i) * .38, 3.4)
            + '<text x="' + (x + 17) + '" y="194" text-anchor="middle" fill="#5b3824" class="art-tiny">' + label + '</text>';
        }).join('');
    }

    return motif;
  }

  function addModel(stage, diagram, seed) {
    var model = document.createElement('div');
    model.className = 'project-model';
    model.dataset.modelMotion = ['orbit', 'rock', 'sweep'][seed % 3];
    model.style.setProperty('--model-cycle', (6.2 + (seed % 15) / 5) + 's');
    model.style.setProperty('--model-phase', -(seed % 32) / 5 + 's');

    var face = document.createElement('div');
    face.className = 'project-model-face';
    var detail = document.createElement('div');
    detail.className = 'project-model-detail';
    detail.appendChild(diagram);
    face.appendChild(detail);
    model.appendChild(face);
    stage.appendChild(model);
    stage.classList.add('project-preview');
  }

  var previewObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('project-preview-visible', entry.isIntersecting);
      });
    })
    : null;

  // All subject rails control the same preference. Offscreen previews pause
  // at their current pose and pick up when they come back into view.
  if (previewObserver) {
    var motionPreference = 'portfolio-project-motion';
    var motionPaused = false;
    try {
      motionPaused = window.localStorage.getItem(motionPreference) === 'paused';
    } catch (_) {
      // Keep the control usable when storage is unavailable.
    }

    var motionButtons = Array.prototype.map.call(document.querySelectorAll('.project-subject'), function (subject) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'project-motion-toggle';
      button.addEventListener('click', function () {
        motionPaused = !motionPaused;
        applyMotionPreference();
        try {
          window.localStorage.setItem(motionPreference, motionPaused ? 'paused' : 'playing');
        } catch (_) {
          // The preference still applies on this page.
        }
      });
      subject.appendChild(button);
      return button;
    });

    function applyMotionPreference() {
      document.documentElement.classList.toggle('project-motion-paused', motionPaused);
      motionButtons.forEach(function (button) {
        button.textContent = motionPaused ? 'Resume animations' : 'Pause animations';
      });
    }

    applyMotionPreference();
  }

  function addProjectArt(card, sectionId) {
    var heading = card.querySelector('.card-title');
    if (!heading) return;
    var title = heading.textContent.trim();
    var tags = Array.prototype.map.call(card.querySelectorAll('.card-tech li'), function (tag) {
      return tag.textContent.trim();
    });
    var seed = 2166136261;
    (sectionId + ':' + title).split('').forEach(function (character) {
      seed ^= character.charCodeAt(0);
      seed = Math.imul(seed, 16777619);
    });

    var figure = document.createElement('figure');
    figure.className = 'project-art';
    figure.setAttribute('aria-hidden', 'true');
    var diagram = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    diagram.setAttribute('viewBox', '388 49 188 211');
    diagram.setAttribute('focusable', 'false');
    seed = seed >>> 0;
    diagram.innerHTML = projectArtMarkup(seed, title, tags);
    addModel(figure, diagram, seed);
    card.insertBefore(figure, card.firstChild);
    if (previewObserver) previewObserver.observe(figure);
  }

  Array.prototype.forEach.call(document.querySelectorAll('.projects-grid .project-card'), function (card) {
    var section = card.closest('section');
    addProjectArt(card, section ? section.id : 'rtl');
  });

  Array.prototype.forEach.call(document.querySelectorAll('.featured-visual'), function (stage, index) {
    var diagram = stage.querySelector('.diagram');
    if (!diagram) return;
    addModel(stage, diagram, (index + 1) * 17);
    if (previewObserver) previewObserver.observe(stage);
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
    ['#rtl', '#verification', '#codesign', '#comparch', '#aisystems'].forEach(function (sel) {
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


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
    var titleWords = title.toLowerCase();
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

    function wire(path, beat, duration) {
      return '<path d="' + path + '" fill="none" stroke="#a9907b" stroke-width="2" stroke-opacity=".65"/>'
        + trace(path, beat, duration);
    }

    function caption(label, y) {
      return '<text x="481" y="' + (y || 225) + '" text-anchor="middle" fill="#5b3824" class="art-label">' + label + '</text>';
    }

    function small(x, y, label, fill) {
      return '<text x="' + x + '" y="' + y + '" text-anchor="middle" fill="' + (fill || '#5b3824') + '" class="art-tiny">' + label + '</text>';
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
    } else if (/moldudp|itch receiver|feed recovery|redundant a\/b/.test(words)) {
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
    } else if (/latency telemetry|histogram|hardware performance monitor/.test(words)) {
      var bucketHeights = [16, 36, 63, 88, 53, 26, 13];
      motif = '<path d="M405 187H560" stroke="#a9907b" stroke-width="2"/>'
        + bucketHeights.map(function (height, i) {
          return '<rect x="' + (409 + i * 22) + '" y="' + (184 - height) + '" width="15" height="' + height + '" rx="3" fill="' + (i === 3 ? accent : '#b9967b') + '"' + motion('bar', i * .2, 2.7 + (i % 3) * .28) + '/>';
        }).join('') + caption(/performance monitor/.test(titleWords) ? 'PERFORMANCE COUNTERS' : 'LATENCY HISTOGRAM');
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
    } else if (/latency monitor|nanosecond.timestamp|tick.to.trade latency/.test(titleWords)) {
      motif = wire('M406 103H539M406 171H539M438 98V177M520 98V177', 0, 3.9)
        + block(427, 92, 23, 22, '#e5cdaf', .7, 3.9)
        + block(509, 160, 23, 22, accent, 0, 3.9)
        + '<path d="M438 137H520M438 137l7-5m-7 5 7 5m75-5-7-5m7 5-7 5" stroke="' + accent + '" fill="none" stroke-width="2"/>'
        + caption('TIMESTAMP DELTA');
    } else if (/retransmission|gap detector|duplicate suppress|replay buffer|replay engine|completion reorder|read response reorder|multi.id read reorder/.test(titleWords)) {
      var replay = /gap detector|duplicate/.test(titleWords);
      motif = wire('M405 137H558M435 167V187H526V166', .2, 4)
        + [0, 1, 2, 3].map(function (i) {
          return block(403 + 39 * i, 126, 29, 24, i === 2 ? accent : '#dfc2a4', (3 - i) * .33, 4)
            + small(418 + 39 * i, 167, String((i + (replay && i > 1 ? 1 : 0)) % 8));
        }).join('') + small(483, 199, replay ? 'GAP' : 'REPLAY') + caption(replay ? 'SEQUENCE CHECK' : 'REPLAY / REORDER');
    } else if (/ethernet.*front end|streaming market.data feed parser|egress serializer|nasdaq ouch|soupbintcp|bitpack decode|firmware trace compressor/.test(titleWords)) {
      var fields = /ethernet/.test(titleWords) ? ['MAC', 'IP', 'UDP']
        : /ouch|soupbintcp/.test(titleWords) ? ['LEN', 'TYPE', 'SEQ']
        : /bitpack/.test(titleWords) ? ['PACK', 'SHIFT', 'UNPACK']
        : /compressor/.test(titleWords) ? ['TIME', 'DELTA', 'PACK']
        : /serializer/.test(titleWords) ? ['TYPE', 'ORDER', 'WIRE'] : ['TYPE', 'SEQ', 'BODY'];
      motif = wire('M405 135H560M405 184H560', 0, 3.6)
        + fields.map(function (field, i) {
          return block(404 + i * 53, 107, 43, 46, i === 0 ? accent : '#e6caae', (2 - i) * .4, 3.6)
            + small(428 + i * 53, 171, field);
        }).join('') + caption(/bitpack/.test(titleWords) ? 'BIT FIELD EXTRACT' : /compressor/.test(titleWords) ? 'TRACE COMPRESSION'
          : /serializer/.test(titleWords) ? 'MESSAGE SERIALIZER' : /ouch|soupbintcp/.test(titleWords) ? 'SESSION FRAME' : 'PACKET PARSING');
    } else if (/top.?k|mask compactor|structured.sparsity/.test(titleWords)) {
      var isMask = /mask compactor/.test(titleWords);
      var isSparse = /sparsity/.test(titleWords);
      var selectedCount = isSparse ? 2 : 3;
      motif = wire('M407 136H474L505 107H555M474 136L505 161H555', .3, 4)
        + [0, 1, 2, 3, 4].map(function (i) {
          var active = (i + seed) % 4 < selectedCount;
          return block(405 + (i % 2) * 21, 91 + i * 20, 13, 13, active ? accent : '#e7d1b8', (4 - i) * .22, 3.8);
        }).join('') + [0, 1, 2].slice(0, selectedCount).map(function (i) {
          return block(517 + (i % 2) * 21, 96 + i * 26, isSparse ? 15 : 16, isSparse ? 15 : 16, accent, (2 - i) * .3, 3.8);
        }).join('') + small(432, 200, isMask ? 'MASK' : isSparse ? '4 WEIGHTS' : 'SCORES')
        + small(537, 200, isMask ? 'PACKED' : isSparse ? '2 KEPT' : 'TOP K')
        + caption(isMask ? 'MASK COMPACTION' : isSparse ? 'STRUCTURED SPARSITY' : 'TOP-K SELECTION');
    } else if (/float|fp adder|reciprocal|multiplier|divider|\balu\b|mx cast|fixed.point reciprocal/.test(titleWords)) {
      var operation = /multiplier/.test(titleWords) ? 'MUL' : /divider|reciprocal/.test(titleWords) ? 'DIV'
        : /float|fp adder/.test(titleWords) ? 'FP ADD' : /mx cast/.test(titleWords) ? 'CAST' : 'ALU';
      var lane = /float|fp adder/.test(titleWords) ? ['SIGN', 'EXP', 'MANT'] : /multiplier/.test(titleWords) ? ['OP A', 'OP B', 'PROD']
        : /divider|reciprocal/.test(titleWords) ? ['NUM', 'DEN', 'QUOT'] : /mx cast/.test(titleWords) ? ['INT', 'SCALE', 'MX'] : ['OP A', 'OP B', 'OUT'];
      motif = wire('M412 101H447L472 133H538M412 177H447L472 133', .12, 3.7)
        + block(405, 88, 37, 23, '#dbc0a2', .8, 3.7)
        + block(405, 165, 37, 23, '#dbc0a2', .45, 3.7)
        + block(465, 112, 46, 41, accent, .25, 3.7)
        + block(527, 120, 29, 27, '#e6cfb5', 0, 3.7)
        + small(488, 137, operation, '#fffaf3') + small(424, 123, lane[0]) + small(424, 201, lane[1]) + small(543, 162, lane[2])
        + caption(/booth/.test(titleWords) ? 'BOOTH MULTIPLICATION' : /reciprocal/.test(titleWords) ? 'RECIPROCAL ITERATION'
          : /float|fp adder/.test(titleWords) ? 'FLOATING POINT ADD' : /divider/.test(titleWords) ? 'INTEGER DIVISION'
          : /mx cast/.test(titleWords) ? 'PRECISION CAST' : 'ARITHMETIC LOGIC');
    } else if (/ann search|kernel dag|fault graph/.test(titleWords)) {
      var graphLabels = /ann search/.test(titleWords) ? ['QUERY', 'NEIGHBORS', 'NEAREST']
        : /kernel dag/.test(titleWords) ? ['TASKS', 'DEPENDS', 'READY'] : ['FAULT', 'IMPACT', 'ISOLATE'];
      var graphPoints = [[410, 139], [461, 99], [462, 177], [507, 118], [510, 184], [553, 142]];
      motif = [[0,1],[0,2],[1,3],[1,4],[2,4],[3,5],[4,5]].map(function (edge, i) {
        var a = graphPoints[edge[0]];
        var b = graphPoints[edge[1]];
        return wire('M' + a.join(' ') + 'L' + b.join(' '), i * .3, 4.1);
      }).join('') + graphPoints.map(function (point, i) {
        return block(point[0] - 8, point[1] - 9, 15, 16, i === 0 || i === 5 ? accent : '#dfc1a2', (5 - i) * .25, 4.1);
      }).join('') + small(410, 198, graphLabels[0]) + small(480, 212, graphLabels[1])
        + small(552, 198, graphLabels[2]) + caption(/ann search/.test(titleWords) ? 'NEIGHBOR SEARCH'
          : /kernel dag/.test(titleWords) ? 'DEPENDENCY GRAPH' : 'FAULT PROPAGATION', 235);
    } else if (/\btcam\b|ternary cam|embedding gather|stride prefetcher|translation lookaside|\btlb\b|page.table walker/.test(titleWords)) {
      var lookup = /page.table walker/.test(titleWords) ? ['PAGE TABLE WALK', 'VA', 'PTE', 'PA']
        : /\btlb\b|ranslation/.test(titleWords) ? ['ADDRESS TRANSLATION', 'VPN', 'TLB', 'PPN']
        : /prefetch/.test(titleWords) ? ['STRIDE PREDICTION', 'ADDR', 'STRIDE', 'NEXT']
        : /embedding/.test(titleWords) ? ['EMBEDDING GATHER', 'IDS', 'TABLE', 'VEC'] : ['TERNARY LOOKUP', 'KEY', 'MASK', 'HIT'];
      motif = wire('M402 132H553M426 132V169H529V132', .2, 3.7)
        + [0, 1, 2, 3].map(function (i) {
          return block(452, 83 + i * 28, 55, 17, i === seed % 4 ? accent : '#e1c5a9', (3 - i) * .31, 3.7);
        }).join('') + block(401, 119, 30, 26, '#ddc2a6', .8, 3.7) + small(417, 156, lookup[1])
        + block(529, 119, 31, 26, accent, .1, 3.7) + small(545, 156, lookup[3])
        + small(483, 208, lookup[2]) + caption(lookup[0]);
    } else if (/\bdma\b|p2p transport/.test(titleWords)) {
      var p2p = /p2p/.test(titleWords);
      var bridge = 'M420 136H550';
      motif = wire(bridge, 0, 3.3) + wire('M421 171H550', .7, 3.3)
        + [0, 1, 2].map(function (i) {
          return block(402, 98 + i * 27, 33, 17, i ? '#ddbea0' : accent, i * .33, 3.8)
            + block(523, 98 + i * 27, 34, 17, i < 2 ? '#ddbea0' : accent, (3 - i) * .33, 3.8);
        }).join('') + block(464, 121, 38, 31, '#e8caae', .2, 3.8)
        + small(484, 139, p2p ? 'LINK' : 'DMA') + small(420, 198, p2p ? 'PEER A' : 'SRC')
        + small(542, 198, p2p ? 'PEER B' : 'DST') + caption(p2p ? 'GPU PEER TRANSPORT' : /descriptor|scatter|strided/.test(titleWords) ? 'DESCRIPTOR TRANSFER' : 'MEMORY TRANSFER');
    } else if (/read.eye|eye margin|deskew|link training|clock health|power.domain|power and reset|power telemetry|hid touch|usb audio|current loop/.test(titleWords)) {
      var isEye = /eye|deskew|link training/.test(titleWords);
      var isPower = /power|current loop/.test(titleWords);
      var isTouch = /hid touch/.test(titleWords);
      var signals = isEye ? ['M402 105H433L476 169H556', 'M402 169H437L481 105H556', 'M402 105H447L492 169H556', 'M402 169H445L490 105H556']
        : isPower ? ['M403 175H434L448 145H556', 'M403 134H466L482 106H556', 'M403 198H487L510 170H556']
          : ['M402 106H421V91H442V106H464V91H485V106H507V91H528V106H556',
            'M402 146H430V131H455V146H483V131H508V146H535V131H556', 'M402 183H455V168H510V183H556'];
      motif = signals.map(function (signal, i) { return wire(signal, i * .32, 3.65); }).join('')
        + '<path d="M483 83V197" stroke="#9c795e" stroke-opacity=".62" stroke-dasharray="3 5"/>'
        + '<circle cx="483" cy="' + (isEye ? '136' : '106') + '" r="8" fill="' + accent + '"' + motion('beacon', .3, 3.65) + '/>'
        + caption(isEye ? (/deskew/.test(titleWords) ? 'LANE ALIGNMENT' : 'SAMPLING EYE') : isPower
          ? (/telemetry/.test(titleWords) ? 'RAIL TELEMETRY' : /current loop/.test(titleWords) ? 'CURRENT FEEDBACK' : 'POWER SEQUENCING')
          : isTouch ? 'TOUCH SAMPLE FUSION' : /audio/.test(titleWords) ? 'AUDIO RATE MATCHING' : 'CLOCK FAILOVER');
    } else if (/rng|entropy|philox|nonce|genomics/.test(titleWords)) {
      var isDna = /genomics/.test(titleWords);
      var isNonce = /nonce/.test(titleWords);
      var alphabet = isDna ? ['A', 'C', 'G', 'T'] : ['0', '1', '0', '1'];
      motif = wire('M403 145H558M412 100H555', .4, 3.9)
        + [0, 1, 2, 3, 4, 5].map(function (i) {
          var y = 119 + (i % 2) * 17;
          var x = 401 + i * 26;
          var active = (i + seed) % 3 === 0;
          return block(x, y, 17, 24, active ? accent : '#dfbf9d', (5 - i) * .24, 3.9) + small(x + 9, y + 14,
            alphabet[(i * 7 + seed) % alphabet.length], active ? '#fff8ed' : '#5b3824');
        }).join('') + small(481, 200, isDna ? 'K-MER WINDOW' : isNonce ? 'NONCE HISTORY' : 'COUNTER + KEY')
        + caption(isDna ? 'DNA MINIMIZER' : isNonce ? 'REPLAY GUARD' : 'RANDOM OUTPUT');
    } else if (/coheren|snoop|home agent|home node|mshr|sram|read.write|cache|\bdram\b|\bddr\b|bank.conflict|register.file|ral register|store.buffer/.test(titleWords) && !/operand collector/.test(titleWords)) {
      var coherence = /coheren|snoop|home agent|home node/.test(titleWords);
      var banks = /\bddr\b|\bdram\b|bank.conflict/.test(titleWords);
      var selfTest = /self.test|\bbist\b|scrub/.test(titleWords);
      var gpuCache = /kv cache/.test(titleWords);
      var rowLabel = coherence ? 'SNOOP / DIRECTORY' : selfTest ? 'MEMORY SCRUB' : banks ? 'BANK COMMANDS'
        : gpuCache ? 'KV PAGE MAPPING' : /ral register/.test(titleWords) ? 'REGISTER FIELD MIRROR' : /register.file/.test(titleWords) ? 'REGISTER PORTS' : /mshr/.test(titleWords) ? 'CACHE MISS TRACKING'
        : /store.buffer/.test(titleWords) ? 'STORE FORWARDING' : 'CACHE TAGS / WAYS';
      motif = wire('M405 95H558M405 190H558M424 94V191M481 94V191M538 94V191', 0, 3.9)
        + [0, 1, 2, 3, 4, 5].map(function (i) {
          var active = i === seed % 6;
          return block(406 + (i % 3) * 56, 109 + Math.floor(i / 3) * 41, 35, 22, active ? accent : '#e1c6aa', (5 - i) * .24, 3.9);
        }).join('') + small(424, 210, coherence ? 'CORE' : 'BANK 0') + small(482, 210, coherence ? 'DIR' : 'BANK 1')
        + small(539, 210, coherence ? 'CORE' : 'BANK 2') + caption(rowLabel, 237);
    } else if (/branch.predict|branch target|reconvergence|pdom|operand collector|memory.coalesc/.test(titleWords)) {
      var isBranch = /branch|pdom|reconvergence/.test(titleWords);
      var routes = isBranch ? ['M402 141H447L489 105H555', 'M447 141L489 176H555']
        : ['M402 96H438L479 143H555', 'M402 127H444L479 143', 'M402 166H443L479 143', 'M402 193H438L479 143'];
      motif = routes.map(function (route, i) { return wire(route, i * .48, 3.7); }).join('')
        + block(433, 127, 27, 24, accent, .5, 3.7)
        + block(520, 95, 32, 21, '#e2c4a5', .3, 3.7)
        + block(520, 166, 32, 21, '#e2c4a5', 0, 3.7)
        + small(536, 128, isBranch ? 'TAKEN' : 'LINE A') + small(536, 200, isBranch ? 'FALL' : 'LINE B')
        + caption(/pdom|reconvergence/.test(titleWords) ? 'SIMT PATH MERGE' : /branch/.test(titleWords) ? 'BRANCH PATHS'
          : /coalesc/.test(titleWords) ? 'COALESCED REQUESTS' : 'OPERAND GATHER', 233);
    } else if (/token.bucket|rate.limiter|pretrade|pre.trade risk.check|marketable.order trigger|spec decode verifier/.test(titleWords)) {
      var rate = /rate|token.bucket/.test(titleWords);
      var decode = /spec decode/.test(titleWords);
      motif = wire('M406 134H558', .24, 3.9) + wire('M454 135H495V184H553', .6, 3.9)
        + (rate ? '<path d="M449 103l8 58h54l8-58" fill="none" stroke="#9c795e" stroke-width="3"/>' : '')
        + (rate ? [0, 1, 2].map(function (i) {
          return '<circle cx="' + (467 + i * 16) + '" cy="' + (124 + (i % 2) * 16) + '" r="6" fill="' + accent + '"' + motion('beacon', i * .38, 3.9) + '/>';
        }).join('') : block(469, 119, 34, 28, accent, .5, 3.9))
        + small(541, 121, decode ? 'ACCEPT' : 'PASS') + small(539, 201, decode ? 'RECHECK' : 'HOLD')
        + caption(rate ? 'TOKEN BUCKET' : decode ? 'DRAFT VERIFICATION' : 'ORDER GATE');
    } else if (/robot arm/.test(titleWords)) {
      motif = '<path d="M405 192H554M420 109V192M451 109V192M482 109V192M513 109V192M544 109V192" fill="none" stroke="#ba997d" stroke-width="1" stroke-opacity=".5"/>'
        + block(415, 172, 41, 17, '#ca9d75', .7, 3.8)
        + '<g' + motion('tile', .2, 3.8) + '><path d="M435 167L460 117L511 135L541 106" fill="none" stroke="' + accent + '" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>'
        + '<path d="M435 167L460 117L511 135L541 106" fill="none" stroke="#eac6a5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
        + [[435, 167], [460, 117], [511, 135]].map(function (a) {
          return '<circle cx="' + a[0] + '" cy="' + a[1] + '" r="7" fill="' + accent + '" stroke="#f0d2b7"/>';
        }).join('') + '</g>' + caption('JOINT KINEMATICS');
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
      }).join('') + caption(/allreduce/.test(titleWords) ? 'COLLECTIVE REDUCTION' : /prefix|scan/.test(titleWords) ? 'PARALLEL PREFIX TREE' : 'REDUCTION TREE', 238);
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
    } else if (/cordic|sine|cosine|vector.rotat|goertzel|\bfir\b|\bfft\b|filter|\bsdr\b|sobel|texture|quadrature|cic decimation|alpha.signal/.test(words)) {
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
        + caption(/cordic/.test(titleWords) ? 'CORDIC ROTATION' : /fft/.test(titleWords) ? 'FREQUENCY TRANSFORM'
          : /sobel/.test(titleWords) ? 'EDGE GRADIENT' : /texture/.test(titleWords) ? 'TEXTURE INTERPOLATION'
          : /goertzel/.test(titleWords) ? 'TONE DETECTION' : /quadrature|decimation/.test(titleWords) ? 'IQ DECIMATION'
          : /fir/.test(titleWords) ? 'FIR FILTER' : /preamble/.test(titleWords) ? 'CORRELATION PEAK' : 'SIGNAL FILTER', 238);
    } else if (/crc|ecc|hamming|reed.solomon|\baes\b|\bsha(?:-?256)?\b|crypt|viterbi|scrambl|line.code|8b\/10b/.test(words)) {
      var bits = '';
      for (var b = 0; b < 16; b++) {
        var bx = 405 + (b % 4) * 39;
        var by = 83 + Math.floor(b / 4) * 35;
        var bitOn = ((b * 7 + seed) % 5) < 2;
        bits += '<g' + motion('bit', b * .16, 3.7) + '><rect x="' + bx + '" y="' + by + '" width="27" height="24" rx="6" fill="' + (bitOn ? accent : '#a9907b') + '" fill-opacity="' + (bitOn ? '.88' : '.24') + '" stroke="#a9907b" stroke-opacity=".3"/>'
          + '<text x="' + (bx + 13.5) + '" y="' + (by + 16) + '" text-anchor="middle" fill="' + (bitOn ? '#fffaf3' : '#5b3824') + '" class="art-tiny">' + (bitOn ? '1' : '0') + '</text></g>';
      }
      motif = bits + '<path d="M410 226H551" stroke="' + accent + '" stroke-width="3" stroke-linecap="round"/>'
        + caption(/crc/.test(titleWords) ? 'CRC / FRAME CHECK' : /hamming|ecc|reed.solomon/.test(titleWords) ? 'ERROR CORRECTION'
          : /aes/.test(titleWords) ? 'CIPHER STATE' : /sha/.test(titleWords) ? 'HASH STATE' : /viterbi/.test(titleWords) ? 'VITERBI PATH METRICS'
          : /scrambl/.test(titleWords) ? 'BIT SCRAMBLING' : 'LINE CODE SYMBOLS', 251);
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
      }).join('') + caption(/i²c|i2c/.test(titleWords) ? 'I2C STATE FLOW' : /spi/.test(titleWords) ? 'SPI SHIFT ENGINE'
        : /uart/.test(titleWords) ? 'UART FRAME FLOW' : /jtag/.test(titleWords) ? 'JTAG TAP STATES'
        : /axi|apb/.test(titleWords) ? 'BUS HANDSHAKE' : /credit/.test(titleWords) ? 'LINK CREDIT FLOW'
        : /interrupt|plic/.test(titleWords) ? 'INTERRUPT ROUTING' : 'PROTOCOL STATE FLOW', 238);
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
      }).join('') + caption(/arbiter/.test(titleWords) ? 'REQUEST ARBITRATION' : /moe/.test(titleWords) ? 'EXPERT ROUTING'
        : /crossbar/.test(titleWords) ? 'CROSSBAR ROUTING' : /router|noc|fabric/.test(titleWords) ? 'PACKET ROUTING'
        : /credit/.test(titleWords) ? 'CREDIT SCHEDULING' : /simt|warp/.test(titleWords) ? 'SIMT LANE ROUTING' : 'CONTROL FLOW', 238);
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
      motif = rows + '<path d="M390 ' + (91 + (seed % 4) * 34) + 'H401" stroke="' + accent + '" stroke-width="4" stroke-linecap="round"/>'
        + caption(/fifo/.test(titleWords) ? 'FIFO READ / WRITE' : /priority|heap/.test(titleWords) ? 'PRIORITY QUEUE'
          : /packet/.test(titleWords) ? 'PACKET QUEUES' : /load.store/.test(titleWords) ? 'LOAD / STORE QUEUE'
          : /reorder/.test(titleWords) ? 'REORDER BUFFER' : /memory.dependence/.test(titleWords) ? 'DEPENDENCE TRACKING' : 'BUFFER / QUEUE', 232);
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

    if (/\buvm\b|verification|functional.coverage|scoreboard/i.test(title + ' ' + tags.join(' '))) {
      motif += '<g fill="none" stroke="#a47150" stroke-width="1.2"><rect x="526" y="52" width="39" height="14" rx="4"/>'
        + '<path d="M530 59l2 2 3-4"/></g>' + small(550, 62, 'DUT');
    }
    return motif;
  }

  var projectMotionQuery = window.matchMedia('(prefers-reduced-motion: no-preference)');

  function steerModel(stage, target, model) {
    var startX = null;
    var restingYaw = 0;
    var yaw = 0;
    var frame = 0;
    var pointerX = 0;
    var pointerY = 0;
    var steering = false;
    var touch = null;
    var suppressTouchClick = false;
    var dragThreshold = 8;

    function motionEnabled() {
      return projectMotionQuery.matches &&
        !document.documentElement.classList.contains('project-motion-paused');
    }

    function insideStage(x, y, bounds) {
      return bounds.width && bounds.height &&
        x >= bounds.left && x <= bounds.right &&
        y >= bounds.top && y <= bounds.bottom;
    }

    function turn(deltaYaw, pitch) {
      if (!steering) {
        steering = true;
        stage.classList.add('project-preview-steering');
      }
      yaw = restingYaw + deltaYaw;
      model.style.setProperty('--model-pointer-yaw', yaw + 'deg');
      model.style.setProperty('--model-pointer-pitch', pitch + 'deg');
    }

    function endSteering() {
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
      startX = null;
      if (!steering) return;

      // Keep the last heading when the automatic turn resumes.
      restingYaw = yaw;
      steering = false;
      stage.classList.remove('project-preview-steering');
      model.style.removeProperty('--model-pointer-pitch');
    }

    function turnFromDrag(drag, x, y) {
      var pitch = (drag.y - y) * 33 / drag.height;
      turn((x - drag.x) * 360 / drag.width, Math.max(-25, Math.min(25, pitch)));
    }

    function finishTouch(release) {
      var drag = touch;
      touch = null;
      if (!drag || !drag.active) return;

      if (release && motionEnabled()) turnFromDrag(drag, release.clientX, release.clientY);
      endSteering();
      stage.classList.remove('project-preview-dragging');
      if (target.hasPointerCapture && target.hasPointerCapture(drag.id)) {
        target.releasePointerCapture(drag.id);
      }
    }

    function updateSteering() {
      frame = 0;
      if (touch && touch.active) {
        if (motionEnabled()) turnFromDrag(touch, pointerX, pointerY);
        else finishTouch();
        return;
      }

      var bounds = stage.getBoundingClientRect();
      if (!motionEnabled() || !insideStage(pointerX, pointerY, bounds)) {
        endSteering();
        return;
      }

      var x = (pointerX - bounds.left) / bounds.width;
      var y = (pointerY - bounds.top) / bounds.height;
      if (startX === null) startX = x;
      turn((x - startX) * 360, (.5 - y) * 33);
    }

    function queueTurn(event) {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!frame) frame = window.requestAnimationFrame(updateSteering);
    }

    // The stretched card link is above the illustration, so the card owns
    // touch actions. A short horizontal threshold separates a drag from a tap.
    if ('PointerEvent' in window) target.classList.add('project-touch-target');
    target.addEventListener('pointerdown', function (event) {
      if (!event.isPrimary) {
        if (event.pointerType === 'touch' && touch) finishTouch();
        return;
      }

      suppressTouchClick = false;
      if (event.pointerType !== 'touch' || !motionEnabled()) return;
      var bounds = stage.getBoundingClientRect();
      if (!insideStage(event.clientX, event.clientY, bounds)) return;

      endSteering();
      touch = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        width: bounds.width,
        height: bounds.height,
        active: false
      };
    }, { passive: true });

    target.addEventListener('pointermove', function (event) {
      if (event.pointerType === 'touch') {
        if (!touch || touch.id !== event.pointerId) return;
        if (!motionEnabled()) {
          finishTouch();
          return;
        }
        if (!touch.active) {
          var dx = Math.abs(event.clientX - touch.x);
          var dy = Math.abs(event.clientY - touch.y);
          if (dy >= dragThreshold && dy >= dx) {
            touch = null;
            return;
          }
          if (dx < dragThreshold) return;
          touch.active = true;
          suppressTouchClick = true;
          stage.classList.add('project-preview-dragging');
          if (target.setPointerCapture) target.setPointerCapture(event.pointerId);
        }
        queueTurn(event);
        return;
      }

      if (touch || (event.pointerType !== 'mouse' && !(event.pointerType === 'pen' && !event.buttons))) return;
      queueTurn(event);
    }, { passive: true });

    target.addEventListener('pointerup', function (event) {
      if (touch && touch.id === event.pointerId) finishTouch(event);
    });
    target.addEventListener('pointercancel', function (event) {
      if (touch && touch.id === event.pointerId) finishTouch();
      else if (event.pointerType !== 'touch') endSteering();
    });
    target.addEventListener('lostpointercapture', function (event) {
      // A link can lose implicit touch capture when the card takes over.
      if (event.target === target && touch && touch.id === event.pointerId) finishTouch();
    });
    target.addEventListener('pointerleave', function (event) {
      if (event.pointerType !== 'touch' && !touch) endSteering();
    });
    target.addEventListener('click', function (event) {
      if (!suppressTouchClick || event.detail === 0) return;
      suppressTouchClick = false;
      event.preventDefault();
    }, true);
  }

  function addModel(stage, target, diagram, seed, title, tags) {
    var model = document.createElement('div');
    model.className = 'project-model';
    model.style.setProperty('--model-cycle', (11 + (seed % 11) * .45) + 's');
    model.style.setProperty('--model-phase', -(seed % 8) / 5 + 's');
    if (seed % 2) model.style.setProperty('--model-direction', 'reverse');

    var rotor = document.createElement('div');
    rotor.className = 'project-model-rotor';

    var front = document.createElement('div');
    front.className = 'project-model-face project-model-front';
    front.appendChild(diagram);
    rotor.appendChild(front);

    var back = document.createElement('div');
    back.className = 'project-model-face project-model-back';
    if (tags.length) {
      var tag = document.createElement('span');
      tag.className = 'project-model-back-tag';
      tag.textContent = tags.slice(0, 2).join(' / ');
      back.appendChild(tag);
    }
    var name = document.createElement('span');
    name.className = 'project-model-back-name';
    name.textContent = title;
    back.appendChild(name);
    rotor.appendChild(back);

    ['top', 'right', 'bottom', 'left'].forEach(function (side) {
      var edge = document.createElement('span');
      edge.className = 'project-model-edge project-model-edge-' + side;
      rotor.appendChild(edge);
    });

    model.appendChild(rotor);
    stage.appendChild(model);
    stage.classList.add('project-preview');
    steerModel(stage, target, model);
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
    addModel(figure, card, diagram, seed, title, tags);
    card.insertBefore(figure, card.firstChild);
    if (previewObserver) previewObserver.observe(figure);
  }

  Array.prototype.forEach.call(document.querySelectorAll('.projects-grid .project-card'), function (card) {
    var section = card.closest('section');
    addProjectArt(card, section ? section.id : 'rtl');
  });

  Array.prototype.forEach.call(document.querySelectorAll('.featured-visual'), function (stage, index) {
    var diagram = stage.querySelector('.diagram');
    var featured = stage.closest('.featured');
    var heading = featured && featured.querySelector('.featured-title');
    if (!diagram || !heading) return;
    var tags = Array.prototype.map.call(featured.querySelectorAll('.tech-list li'), function (tag) {
      return tag.textContent.trim();
    });
    addModel(stage, stage, diagram, (index + 1) * 17, heading.textContent.trim(), tags);
    if (previewObserver) previewObserver.observe(stage);
  });

  // Introduce touch steering on the first preview of each project section.
  Array.prototype.forEach.call(document.querySelectorAll('.project-layout'), function (layout) {
    var stage = layout.querySelector('.project-preview');
    if (!stage) return;

    var hint = document.createElement('span');
    hint.className = 'project-drag-hint';
    hint.textContent = 'Drag to rotate';
    stage.appendChild(hint);
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


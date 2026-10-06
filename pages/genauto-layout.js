/* genauto-layout.js
   For every .ga-fit row (a block of text next to one figure), set the figure's
   width so the figure ends up the same height as the text beside it. This
   avoids a short picture floating next to a tall column of text, or a huge
   picture next to two lines.

   Changing the figure's width changes how the text wraps, so it searches for
   the width where the two heights meet. Off on phones, where everything stacks. */

(function () {
  var MIN_SHARE = 0.3;    /* figure never narrower than this share of the row */
  var MAX_SHARE = 0.55;   /* ...or wider than this (override per row with data-min / data-max) */

  function aspectOf(media) {
    if (media.tagName === 'VIDEO') {
      if (media.videoWidth) return media.videoWidth / media.videoHeight;
      var ar = media.closest('.ga-fig').getAttribute('data-ar');
      return ar ? parseFloat(ar) : 16 / 9;
    }
    return media.naturalWidth ? media.naturalWidth / media.naturalHeight : 0;
  }

  function fitRow(row) {
    var fig = row.querySelector(':scope > .ga-fig.fit');
    if (!fig) return;
    var text = Array.prototype.find.call(row.children, function (c) { return c !== fig; });
    var media = fig.querySelector('img, video');
    if (!text || !media) return;

    if (window.innerWidth <= 1000) {
      row.classList.remove('is-fitted');
      fig.style.width = media.style.width = media.style.height = '';
      return;
    }

    var aspect = aspectOf(media);
    if (!aspect) return;

    var gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    var rowW = row.clientWidth - gap;
    var caption = fig.querySelector('figcaption');

    row.classList.add('is-fitted');
    var minW = rowW * parseFloat(row.getAttribute('data-min') || MIN_SHARE);
    var maxW = rowW * parseFloat(row.getAttribute('data-max') || MAX_SHARE);

    /* how far the figure's height is from the text's height at width w */
    function mismatch(w) {
      fig.style.width = w + 'px';
      media.style.width = w + 'px';
      media.style.height = (w / aspect) + 'px';
      var capH = caption ? caption.offsetHeight : 0;
      return text.offsetHeight - capH - w / aspect;
    }

    /* widening the figure makes it taller but also squeezes the text taller,
       so search for the width where the two heights meet */
    var lo = minW, hi = maxW, gLo = mismatch(lo), gHi = mismatch(hi), w;
    if (gLo <= 0) w = lo;            /* text is short: smallest figure */
    else if (gHi >= 0) w = hi;       /* text is tall: largest figure */
    else {
      for (var i = 0; i < 12; i++) {
        var mid = (lo + hi) / 2;
        if (mismatch(mid) > 0) lo = mid; else hi = mid;
      }
      w = (lo + hi) / 2;
    }
    mismatch(w);
  }

  var timer = null;
  function fitAll() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      document.querySelectorAll('.ga-fit').forEach(fitRow);
    }, 60);
  }

  document.querySelectorAll('.ga-fit img').forEach(function (img) {
    if (!img.complete) img.addEventListener('load', fitAll);
  });
  document.querySelectorAll('.ga-fit video').forEach(function (v) {
    v.addEventListener('loadedmetadata', fitAll);
  });
  window.addEventListener('resize', fitAll);
  window.addEventListener('load', fitAll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
  fitAll();
})();


/* Collapsible sections on phones.
   Every section heading becomes a button that shows/hides the section. On
   phones all sections start collapsed except Goals & requirements, which holds
   the final videos. On desktop nothing is collapsed and the button is inert. */
(function () {
  var mq = window.matchMedia('(max-width: 1000px)');
  var sections = Array.prototype.slice.call(document.querySelectorAll('.ga-sec, .ga-dark'));
  var OPEN_BY_DEFAULT = ['requirements'];

  sections.forEach(function (sec, n) {
    var h2 = sec.querySelector(':scope > .ga-h2');
    if (!h2) return;

    var body = document.createElement('div');
    body.className = 'ga-sec-body';
    body.id = (sec.id || 'ga-sec-' + n) + '-body';
    while (h2.nextSibling) body.appendChild(h2.nextSibling);
    sec.appendChild(body);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ga-toggle';
    btn.setAttribute('aria-controls', body.id);
    var chev = document.createElement('span');
    chev.className = 'chev';
    chev.setAttribute('aria-hidden', 'true');
    while (h2.firstChild) btn.appendChild(h2.firstChild);
    btn.appendChild(chev);
    h2.appendChild(btn);

    sec.classList.add('is-collapsible');
    if (OPEN_BY_DEFAULT.indexOf(sec.id) === -1) sec.classList.add('is-collapsed');

    btn.addEventListener('click', function () {
      if (!mq.matches) return;
      sec.classList.toggle('is-collapsed');
      sync();
      /* carousels and fitted figures need to re-measure once visible */
      window.dispatchEvent(new Event('resize'));
    });
  });

  function sync() {
    sections.forEach(function (sec) {
      var btn = sec.querySelector('.ga-toggle');
      if (!btn) return;
      if (mq.matches) {
        btn.removeAttribute('tabindex');
        btn.setAttribute('aria-expanded', sec.classList.contains('is-collapsed') ? 'false' : 'true');
      } else {
        btn.setAttribute('tabindex', '-1');
        btn.removeAttribute('aria-expanded');
      }
    });
  }

  /* opening a link to a section (e.g. #reaction) expands it */
  function openHash() {
    var t = location.hash && document.getElementById(location.hash.slice(1));
    var sec = t && t.closest('.is-collapsible');
    if (sec && sec.classList.contains('is-collapsed')) {
      sec.classList.remove('is-collapsed');
      sync();
      window.dispatchEvent(new Event('resize'));
    }
  }

  if (mq.addEventListener) mq.addEventListener('change', sync); else mq.addListener(sync);
  window.addEventListener('hashchange', openHash);
  sync();
  openHash();
})();

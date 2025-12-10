/* Modal gallery logic */
window.addEventListener('load', function() {
  var modal = document.getElementById('modal');
  var modalImg = document.getElementById('modalImage');
  var imgs = Array.from(document.querySelectorAll('.gallery-img'));
  var span = document.querySelector('.close');

  if (!modal || !modalImg || imgs.length === 0) return;

  function openModal(src) {
    modalImg.src = src;
    gsap.to(modal, {
      autoAlpha: 1,
      duration: 0.4,
      onStart: function() {
        modal.style.visibility = "visible";
      }
    });
  }

  function closeModal() {
    gsap.to(modal, {
      autoAlpha: 0,
      duration: 0.3,
      onComplete: function() {
        modal.style.visibility = "hidden";
      }
    });
  }

  imgs.forEach(img => {
    img.addEventListener('click', function() {
      openModal(this.src);
    });
  });

  if (span) {
    span.addEventListener('click', function() {
      closeModal();
    });
  }

  // clicking outside the image (on the dark overlay) closes the modal
  modal.addEventListener('click', function(event) {
    if (event.target === modal) {
      closeModal();
    }
  });
});

/* loading stuff (guarded so it doesn't break pages without a loader) */
(function() {
  var loader = document.getElementById('loader');
  var loaderText = document.getElementById('loaderText');

  if (!loader || !loaderText) {
    return;
  }

  loader.style.display = 'flex';
  scrambleText(loaderText, 'LOADING', 2000);

  if (sessionStorage.getItem("firstLoadDone") === null) {
    setTimeout(removeLoader, 1000);
    sessionStorage.setItem("firstLoadDone", 1);
  } else {
    setTimeout(removeLoader, 500);
  }

  function removeLoader() {
    loader.style.display = 'none';
    sessionStorage.removeItem("firstLoadDone");
  }
})();

function scrambleText(targetElement, finalText, time) {
  let randomChars = "!@#$%^&*()_+?><:{}[]";
  let charIndex = 0;

  let scrambleInterval = setInterval(function() {
    if (charIndex <= finalText.length) {
      let newText = finalText.substring(0, charIndex);
      for (let i = charIndex; i < finalText.length; i++) {
        newText += randomChars[Math.floor(Math.random() * randomChars.length)];
      }
      targetElement.textContent = newText;
      charIndex++;
    } else {
      clearInterval(scrambleInterval);
      targetElement.textContent = finalText;
    }
  }, time / (finalText.length * 5));
}

/* Macy.js media grid init */
window.addEventListener('load', function () {
  if (typeof Macy === 'undefined') return;
  var grid = document.querySelector('.media-grid');
  if (!grid) return;

  Macy({
    container: '.media-grid',
    trueOrder: false,
    waitForImages: true,
    margin: 10,
    columns: 4,
    breakAt: {
      900: 3,
      600: 2
    }
  });
});

/* Splide video carousel init */
window.addEventListener('load', function () {
  if (typeof Splide === 'undefined') {
    console.log('[Splide] Not loaded');
    return;
  }

  var root = document.getElementById('arm-splide');
  if (!root) {
    console.log('[Splide] #arm-splide not found');
    return;
  }

  console.log('[Splide] Initializing…');

  var defaultInterval = 7000;
  var autoplayTimer = null;

  var splide = new Splide('#arm-splide', {
    // IMPORTANT: keep this simple and disable built-in autoplay/loop
    type: 'slide',        // no loop/clones → avoids a lot of weirdness
    perPage: 1,
    focus: 'center',
    gap: '1rem',
    drag: true,
    trimSpace: false,
    autoplay: false,
    pauseOnHover: false,
    pauseOnFocus: false,
    arrows: false,
    pagination: false,
  });

  function logActiveSlide(prefix) {
    var idx = splide.index;
    var slideObj = splide.Components.Slides.getAt(idx);
    var slideEl = slideObj && slideObj.slide;
    if (!slideEl) {
      console.log(prefix, 'no active slide element');
      return null;
    }

    var rect = slideEl.getBoundingClientRect();
    console.log(prefix, 'index=', idx, 'rect=', {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left
    });

    var video = slideEl.querySelector('video');
    if (!video) {
      console.log(prefix, 'no <video> in active slide');
    } else {
      console.log(prefix, 'video src=', video.currentSrc || video.src);
    }

    return { slideEl, video };
  }

  function scheduleNext() {
    if (autoplayTimer) {
      clearTimeout(autoplayTimer);
      autoplayTimer = null;
    }

    var active = logActiveSlide('[Splide] scheduleNext');
    if (!active) return;

    var slideEl = active.slideEl;
    var video = active.video;

    // Try to play the video on the active slide
    if (video) {
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function (err) {
          console.log('[Splide] video.play() error:', err);
        });
      }
    }

    var attr =
      slideEl.getAttribute('data-splide-interval') ||
      slideEl.getAttribute('data-duration');

    var dur = parseInt(attr, 10);
    if (isNaN(dur) || dur <= 0) dur = defaultInterval;

    console.log('[Splide] scheduling next in', dur, 'ms');

    autoplayTimer = setTimeout(function () {
      console.log('[Splide] advancing from index', splide.index);
      splide.go('>');
    }, dur);
  }

  splide.on('mounted', function () {
    console.log('[Splide] mounted');
    scheduleNext();
  });

  splide.on('moved', function (newIndex) {
    console.log('[Splide] moved to index', newIndex);
    scheduleNext();
  });

  splide.mount();
});

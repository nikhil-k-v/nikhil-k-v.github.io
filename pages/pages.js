
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

  document.addEventListener( 'DOMContentLoaded', function() {
    if (document.getElementById('splide1')) {
      new Splide( '#splide1', {
        type   : 'loop',
        padding: '8rem',
      } ).mount();
    }

    if (document.getElementById('splide2')) {
      new Splide( '#splide2', {
        type   : 'loop',
        height   : '30rem',
        focus    : 'center',
        autoWidth: true,
      } ).mount();
    }

    if (document.getElementById('splide3')) {
      new Splide( '#splide3', {
      type  : 'loop',
      perPage: 2,
      focus : 'center',
      padding: '5rem',
      } ).mount();
    }

    if (document.getElementById('splide4')) {
      new Splide( '#splide4', {
        type   : 'loop',
        padding: '20rem',
      } ).mount();
    }

    

  } );


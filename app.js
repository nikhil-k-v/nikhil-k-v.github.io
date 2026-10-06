/* Shared by index / gallery / about / blog: loader + gallery modal.
   Home-page carousel logic lives in home.js. */

window.addEventListener('load', function () {
  var modal = document.getElementById('modal');
  var modalImg = document.getElementById('modalImage');
  var imgs = Array.from(document.querySelectorAll('.gallery-img'));
  var span = document.querySelector('.close');

  if (!modal || !modalImg || imgs.length === 0) return;

  function fadeTo(alpha, duration, done) {
    if (window.gsap) {
      gsap.to(modal, { autoAlpha: alpha, duration: duration, onComplete: done });
    } else {
      modal.style.opacity = alpha;
      if (done) done();
    }
  }

  imgs.forEach(function (img) {
    img.addEventListener('click', function () {
      modalImg.src = this.src;
      modal.style.visibility = 'visible';
      fadeTo(1, 1);
    });
  });

  function close() {
    fadeTo(0, 0.5, function () { modal.style.visibility = 'hidden'; });
  }

  if (span) span.addEventListener('click', close);
  window.addEventListener('click', function (event) {
    if (event.target === modal) close();
  });
});

/* loading screen */
(function () {
  var loader = document.getElementById('loader');
  var loaderText = document.getElementById('loaderText');
  if (!loader || !loaderText) return;

  loader.style.display = 'flex';
  scrambleText(loaderText, 'LOADING', 2000);

  if (sessionStorage.getItem('firstLoadDone') === null) {
    setTimeout(removeLoader, 1000);
    sessionStorage.setItem('firstLoadDone', 1);
  } else {
    setTimeout(removeLoader, 500);
  }

  function removeLoader() {
    loader.style.display = 'none';
    sessionStorage.removeItem('firstLoadDone');
  }
})();

function scrambleText(targetElement, finalText, time) {
  var randomChars = '!@#$%^&*()_+?><:{}[]';
  var charIndex = 0;

  var scrambleInterval = setInterval(function () {
    if (charIndex <= finalText.length) {
      var newText = finalText.substring(0, charIndex);
      for (var i = charIndex; i < finalText.length; i++) {
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

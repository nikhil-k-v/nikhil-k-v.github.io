/* Shared by index / gallery / about / blog: gallery modal.
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

/* the loading screen lives in loader.js */

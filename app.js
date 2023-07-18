
let active = false;
function animateMe(el) {
  const isActive = el.classList.contains("active");
  const boxes = document.querySelectorAll(".box");

  // Reset all boxes
  boxes.forEach((box) => {
    box.classList.remove("active");
    box.classList.add("skew");
  });

  // If the clicked box was active, set active to false
  if (isActive) {
    active = false;
  } else {
    // Otherwise, activate the clicked box and set active to true
    el.classList.add("active");
    el.classList.remove("skew");
    active = true;
  }

  // Animate boxes and text size
  boxes.forEach((box) => {
    const boxIsActive = box.classList.contains("active");
    const boxWidth = boxIsActive ? "60vw" : "30vw";
    const titleFontSize = boxIsActive ? "3.5vw" : "1.8vw";
    const titleBottom = boxIsActive ? "9.7vh" : "4vh";
    const durationToggle = boxIsActive ? 1 : 0.5;
    const opacityToggle = boxIsActive ? 1 : 0;
    const activeToggle = boxIsActive ? "block" : "none";
    const bgColor = boxIsActive
      ? "var(--dark-secondary)"
      : "var(--dark-accent)";
    const borderColor = boxIsActive
      ? "var(--dark-secondary)"
      : "var(--dark-accent)";

    gsap.to(box, {
      backgroundColor: bgColor,
      borderColor: borderColor,
      duration: 1.5,
      width: boxWidth,
      ease: "power1",
    });

    gsap.to(box.querySelector(".s-title"), {
      duration: 1.5,
      bottom: titleBottom,
      fontSize: titleFontSize,
      ease: "power2",
    });

    gsap.to(box.querySelector(".divider"), {
      duration: durationToggle,
      opacity: opacityToggle,
      display: activeToggle,
      ease: "power1",
    });

    gsap.to(box.querySelector(".see-more"), {
      duration: durationToggle,
      opacity: opacityToggle,
      display: activeToggle,
      ease: "power1",
    });
  });
}




//scrolling
let isDragging = false;
let initialPointerPosition = 0;
let initialHandlePosition = 0;

function initializeDraggable() {
  const handle = document.querySelector('.handle');
  const scrollbar = document.querySelector('.scrollbar');

  handle.addEventListener('pointerdown', (e) => {
    isDragging = true;
    initialPointerPosition = e.clientX;
    initialHandlePosition = handle.offsetLeft;
    handle.setPointerCapture(e.pointerId);
  });

  handle.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - initialPointerPosition;
    const newHandlePosition = initialHandlePosition + deltaX;
    const maxHandlePosition = scrollbar.clientWidth - (handle.clientWidth);
    const clampedHandlePosition = Math.min(Math.max(newHandlePosition, 0), maxHandlePosition);
    
    handle.style.left = (clampedHandlePosition * (0.115)) + 'px';
    const scrollPosition = (clampedHandlePosition / maxHandlePosition) * (document.documentElement.scrollWidth - window.innerWidth);
    window.scrollTo(scrollPosition, 0);
  });
  

  handle.addEventListener('pointerup', (e) => {
    isDragging = false;
    handle.releasePointerCapture(e.pointerId);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  initializeDraggable();
  const firstBox = document.querySelector(".box");
  if (firstBox) {
    animateMe(firstBox);
    animateMe(firstBox);
  }
});

document.addEventListener('wheel', function(e) {
    if (e.deltaY !== 0) {
        window.scrollBy((e.deltaY * 0.4), 0);
        //animate the custom scrollbar at the top of the page using the scrollbar, handle, and mousearea elements
        gsap.to(".handle", {
          duration: 0.5,
          x: window.scrollX * 0.12,
          ease: "power2",
        });
    }
    e.preventDefault();
});

window.addEventListener('scroll', function() {
  // Animate the custom scrollbar when scrolling horizontally
  gsap.to(".handle", {
    duration: 0.5,
    x: window.scrollX * 0.115,
    ease: "power2",
  });
});



window.onload = function() {
  var modal = document.getElementById('modal');
  var modalImg = document.getElementById('modalImage');
  var imgs = Array.from(document.querySelectorAll('.gallery-img'));
  var span = document.querySelector('.close');

  imgs.forEach(img => {
    img.addEventListener('click', function() {
      modalImg.src = this.src;
      gsap.to(modal, {autoAlpha: 1, duration: 1, onStart: function(){
        modal.style.visibility = "visible";
      }});
    });
  });

  span.addEventListener('click', function() {
    gsap.to(modal, {autoAlpha: 0, duration: 0.5, onComplete: function(){
      modal.style.visibility = "hidden";
    }});
  });

  window.addEventListener('click', function(event) {
    if (event.target == modal) {
      gsap.to(modal, {autoAlpha: 0, duration: 0.5, onComplete: function(){
        modal.style.visibility = "hidden";
      }});
    }
  });
}

//loading stuff

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
          targetElement.textContent = finalText; // Ensure final text is set correctly
      }
  }, time / (finalText.length * 10));  // 10 times more scrambles per character
}



// ...

document.getElementById('loader').style.display = 'none';  // Hidden by default

if (sessionStorage.getItem("firstLoadDone") === null) {
  // This code block will run only once per session
  document.getElementById('loader').style.display = 'flex';  // Show loader
  scrambleText(document.getElementById('loaderText'), 'LOADING', 1000);  // Scramble text
  setTimeout(removeLoader, 3000); // wait for 2 seconds
  sessionStorage.setItem("firstLoadDone", 1);
} else {
  // This code will run on every page load in the session
  removeLoader();
}

function removeLoader() {
  document.getElementById('loader').style.display = 'none';
}

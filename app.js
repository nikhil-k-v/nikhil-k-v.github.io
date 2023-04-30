
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
    const titleFontSize = boxIsActive ? "3em" : "1.5em";
    const titleBottom = boxIsActive ? "13%" : "6%";
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


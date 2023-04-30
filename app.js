
let active = false;
function animateMe(el) {
  const title = el.querySelector(".s-title"); // Get the s-title element inside the box
  const seeMoreButton = el.querySelector(".see-more"); // Get the see-more button inside the box
  const divider = el.querySelector(".divider"); // Get the see-more button inside the box
  
  if (active && el.classList.contains("active")) {
    active = false;

    gsap.to(seeMoreButton, {
      duration: 0.5,
      opacity: 0,
      display: "none",
      ease: "power1",
    });

    gsap.to(divider, {
      duration: 0.5,
      opacity: 0,
      display: "none",
      ease: "power1",
    });

    const activeBox = document.querySelectorAll(".active");
    activeBox.className = "box";
    gsap.to(".box", {
      backgroundColor: "var(--dark-accent)",
      borderColor: "var(--dark-accent)",
      duration: 1,
      width: "30vw",
      ease: "power1",
    });

    // Scale down the text as the box gets smaller
    gsap.to(title, {
      duration: 1,
      fontSize: "1.5em",
      ease: "power1",
      bottom: "6%",
    });

    const boxes = document.querySelectorAll(".box");
    Array.from(boxes).forEach(function (box) {
      box.classList.add("skew");
      box.classList.remove("active");
    });
  } else {
    active = true;
    const boxes = document.querySelectorAll(".box");
    Array.from(boxes).forEach(function (box) {
      box.className = "box";
      box.classList.add("skew");
    });
    el.classList.add("active");
    el.classList.remove("skew");

    // Box gets larger here
    gsap.to(el, {
      backgroundColor: "var(--dark-secondary)",
      borderColor: "var(--dark-secondary)",
      duration: 1.5,
      width: "60vw",
      transition: "background-color 1s ease",
      ease: "power1",
    });

    gsap.to(seeMoreButton, {
      duration: 1.5,
      opacity: 1,
      display: "block",
      ease: "power1",
    });

    gsap.to(divider, {
      duration: 1.5,
      opacity: 0.75,
      display: "block",
      ease: "power1",
    });
    
    // Scale up the text as the box gets larger
    gsap.to(title, {
      duration: 1.5,
      fontSize: "3em", // Adjust this value to control the scaling
      ease: "power4",
      bottom: '12%'
    });

    gsap.to(".box:not(.active)", {
      backgroundColor: "var(--dark-accent)",
      borderColor: "var(--dark-accent)",
      duration: 1.5,
      width: "30vw",
      ease: "power1",
    });
  }
}


// turn vertical scrolling into horizontal scrolling, everywhere on the page, smoothly
//slow down the scrolling in this function by adding a multiplier

// document.addEventListener('wheel', function(e) {
//     if (e.deltaY !== 0) {
//         window.scrollBy((e.deltaY * 0.4), 0);
//         //animate the custom scrollbar at the top of the page using the scrollbar, handle, and mousearea elements
//         gsap.to(".handle", {
//           duration: 0.5,
//           x: window.scrollX * 0.7575,
//           ease: "power2",
//         });
//     }
//     e.preventDefault();}
// );

// turn vertical scrolling into horizontal scrolling, everywhere on the page, smoothly
//slow down the scrolling in this function by adding a multiplier

// using draggable, make the handle draggable, and scroll the page horizontally
// when the handle is dragged

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
});

document.addEventListener('wheel', function(e) {
    if (e.deltaY !== 0) {
        window.scrollBy((e.deltaY * 0.4), 0);
        //animate the custom scrollbar at the top of the page using the scrollbar, handle, and mousearea elements
        gsap.to(".handle", {
          duration: 0.5,
          x: window.scrollX * 0.115,
          ease: "power2",
        });
    }
    e.preventDefault();}
);

window.addEventListener('scroll', function() {
  // Animate the custom scrollbar when scrolling horizontally
  gsap.to(".handle", {
    duration: 0.5,
    x: window.scrollX * 0.115,
    ease: "power2",
  });
});

// main.js

// document.addEventListener("DOMContentLoaded", () => {
//   const themeButtons = document.querySelectorAll(".themeButton");

//   themeButtons.forEach((button) => {
//       button.addEventListener("click", () => {
//           const theme = button.getAttribute("data-theme");
//           document.body.className = theme + "-theme";
//       });
//   });
// });








    
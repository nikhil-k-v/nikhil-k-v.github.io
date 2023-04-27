
let active = false;
function animateMe(el) {
    
    if ( active && el.classList.contains('active')) {
      active = false;
      const activeBox = document.querySelectorAll('.active');
       activeBox.className = "box";
        gsap.to('.box', { 
          backgroundColor: "var(--dark-accent)",
          borderColor: "var(--dark-accent)",
          duration: 1,
          width: '40vw',
          //ease: "elastic",
          //ease: "bounce",
          ease: "power1",
          //stagger: 0.1,
        });
        
       const boxes = document.querySelectorAll('.box');
       Array.from(boxes).forEach(function(box) {
          box.classList.add("skew");
          box.classList.remove("active");
        });
    } else {
        active = true;
        const boxes = document.querySelectorAll('.box');
        Array.from(boxes).forEach(function(box) {
          box.className = "box";
          box.classList.add("skew");
        });
        el.classList.add("active");
        el.classList.remove("skew")

        gsap.to(el, { 
          backgroundColor: "var(--dark-secondary)",
          borderColor: "var(--dark-secondary)",
          duration: 1.5,
          width: '70vw',
          transition: "background-color 1s ease",
          ease: "power1",
        });

        gsap.to(".box:not(.active)", { 
          backgroundColor: "var(--dark-accent)",
          borderColor: "var(--dark-accent)",
          duration: 1.5,
          width: '40vw',
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








    

let active = false;
function animateMe(el) {
    
    if ( active && el.classList.contains('active')) {
      active = false;
      const activeBox = document.querySelectorAll('.active');
       activeBox.className = "box";
        gsap.to('.box', { 
          backgroundColor: "#2e3440",
          borderColor: "#2e3440",
          duration: 1,
          width: '30vw',
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
        //el.classList.remove("skew")

        gsap.to(el, { 
          backgroundColor: "red",
          borderColor: "red",
          duration: 1.5,
          width: '70vw',
          //ease: "elastic",
          //ease: "bounce",
          ease: "power1",
          //stagger: 0.1,
        });

        gsap.to(".box:not(.active)", { 
          backgroundColor: "#2e3440",
          borderColor: "#2e3440",
          duration: 1.5,
          width: '30vw',
          ease: "power1",
          //stagger: 0.2,
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






    
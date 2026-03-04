let active = false;

function isComingSoonBox(box) {
  return box.classList.contains("coming-soon");
}

function isDisabledBox(box) {
  return isComingSoonBox(box) || box.classList.contains("spacer");
}

function isProjectsCarouselPage() {
  return !!document.getElementById("containers");
}

function getInitialActiveBox() {
  const container = document.getElementById("containers");
  if (!container) return null;

  const initialId = container.getAttribute("data-initial-active");
  if (initialId) {
    const byId = document.getElementById(initialId);
    if (byId && !isDisabledBox(byId)) return byId;
  }

  const first = Array.from(container.querySelectorAll(".box")).find((b) => !isDisabledBox(b));
  return first || null;
}

function setActiveBox(el) {
  if (!el || isDisabledBox(el)) return;

  const boxes = document.querySelectorAll(".box");
  const pageWidth = window.innerWidth;

  boxes.forEach((box) => {
    box.classList.remove("active");
    box.classList.add("skew");
  });

  el.classList.add("active");
  el.classList.remove("skew");
  active = true;

  animateBoxes(pageWidth);
}

function animateMe(el) {
  if (!el || isDisabledBox(el)) return;

  const boxes = document.querySelectorAll(".box");
  const pageWidth = window.innerWidth;

  const isActive = el.classList.contains("active");

  boxes.forEach((box) => {
    box.classList.remove("active");
    box.classList.add("skew");
  });

  if (isActive) {
    active = false;
  } else {
    el.classList.add("active");
    el.classList.remove("skew");
    active = true;
  }

  animateBoxes(pageWidth);
}

function animateBoxes(pageWidth) {
  const boxes = document.querySelectorAll(".box");

  boxes.forEach((box) => {
    const disabled = isDisabledBox(box);
    const comingSoon = isComingSoonBox(box);
    const boxIsActive = !disabled && box.classList.contains("active");

    // Widen normal boxes slightly; keep coming-soon narrow and CSS-driven
    const baseNonActiveDesktop = "19vw";
    const baseActiveDesktop = "36vw";
    const baseNonActiveMobile = "24vw";
    const baseActiveMobile = "74vw";

    const boxWidth = boxIsActive
      ? (pageWidth < 1380 ? baseActiveMobile : baseActiveDesktop)
      : (pageWidth < 1380 ? baseNonActiveMobile : baseNonActiveDesktop);

    const titleFontSize = boxIsActive
      ? (pageWidth < 1380 ? "7vw" : "2.7vw")
      : (pageWidth < 1380 ? "3vw" : "1.4vw");

    const seeMoreFontSize = boxIsActive
      ? (pageWidth < 1380 ? "3vw" : "1.6vw")
      : (pageWidth < 1380 ? "2.5vw" : "1.6vw");

    const titleBottom = boxIsActive
      ? (pageWidth < 1380 ? "7vh" : "9.2vh")
      : (pageWidth < 1380 ? "2vh" : "4.2vh");

    const divBottom = boxIsActive
      ? (pageWidth < 1380 ? "12.5vh" : "17.25vh")
      : (pageWidth < 1380 ? "17.25vh" : "17.25vh");

    const durationToggle = boxIsActive ? 1 : 0.5;

    const bgColor = boxIsActive ? "var(--dark-secondary)" : "var(--dark-accent)";
    const borderColor = boxIsActive ? "var(--dark-secondary)" : "var(--dark-accent)";

    // Coming-soon boxes: do not animate width/position like others
    if (!comingSoon) {
      gsap.to(box, {
        backgroundColor: disabled ? "var(--dark-accent)" : bgColor,
        borderColor: disabled ? "var(--dark-accent)" : borderColor,
        duration: 1.05,
        width: boxWidth,
        ease: "power1",
      });
    } else {
      gsap.to(box, {
        backgroundColor: "var(--dark-accent)",
        duration: 0.6,
        ease: "power1",
      });
    }

    const titleEl = box.querySelector(".s-title");
    if (titleEl) {
      // Coming-soon title is handled by scramble; keep sizing stable
      gsap.to(titleEl, {
        duration: 1.05,
        bottom: titleBottom,
        fontSize: titleFontSize,
        ease: "power2",
      });
    }

    const dividerEl = box.querySelector(".divider");
    if (dividerEl) {
      const showDivider = !disabled && boxIsActive && pageWidth > 1380;
      gsap.to(dividerEl, {
        duration: durationToggle,
        opacity: showDivider ? 1 : 0,
        display: showDivider ? "block" : "none",
        bottom: divBottom,
        ease: "power1",
      });
    }

    const seeMoreEl = box.querySelector(".see-more");
    if (seeMoreEl) {
      const showSeeMore = !disabled && boxIsActive;
      gsap.to(seeMoreEl, {
        duration: durationToggle,
        opacity: showSeeMore ? 1 : 0,
        display: showSeeMore ? "block" : "none",
        fontSize: seeMoreFontSize,
        ease: "power1",
        padding: ".1vh 7% .1vh 7%",
      });
    }
  });
}

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

  return scrambleInterval;
}

function wireBoxes() {
  const boxes = document.querySelectorAll(".box");

  boxes.forEach((box) => {
    if (isDisabledBox(box)) return;
    box.addEventListener("click", () => animateMe(box));
  });

  // Coming-soon hover spotlight + title scramble to "COMING SOON"
  const comingSoonBoxes = document.querySelectorAll(".box.coming-soon");
  comingSoonBoxes.forEach((box) => {
    let scrambleHandle = null;

    box.addEventListener("mousemove", (e) => {
      const r = box.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      box.style.setProperty("--mx", `${x}px`);
      box.style.setProperty("--my", `${y}px`);
    });

    box.addEventListener("mouseenter", () => {
      const t = box.querySelector(".cs-title");
      if (!t) return;

      // restore base title instantly before scrambling again
      const base = box.getAttribute("data-cs-title") || t.textContent || "";
      t.textContent = base;

      if (scrambleHandle) clearInterval(scrambleHandle);
      scrambleHandle = scrambleText(t, "COMING SOON", 1650);
    });

    box.addEventListener("mouseleave", () => {
      const t = box.querySelector(".cs-title");
      if (!t) return;
      if (scrambleHandle) clearInterval(scrambleHandle);
      scrambleHandle = null;
      t.textContent = box.getAttribute("data-cs-title") || t.textContent;
    });
  });
}

// scrollbar dragging
let isDragging = false;
let initialPointerPosition = 0;
let initialHandlePosition = 0;

function getHandlePositionBasedOnScroll() {
  const maxScrollPosition = document.documentElement.scrollWidth - window.innerWidth;
  if (maxScrollPosition <= 0) return 0;

  const scrollPercentage = window.scrollX / maxScrollPosition;

  const scrollbar = document.querySelector('.scrollbar');
  const handle = document.querySelector('.handle');
  if (!scrollbar || !handle) return 0;

  const maxHandlePosition = scrollbar.clientWidth - handle.clientWidth;
  return scrollPercentage * maxHandlePosition;
}

function initializeDraggable() {
  const handle = document.querySelector('.handle');
  const scrollbar = document.querySelector('.scrollbar');
  if (!handle || !scrollbar) return;

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
    const maxHandlePosition = scrollbar.clientWidth - handle.clientWidth;
    const clampedHandlePosition = Math.min(Math.max(newHandlePosition, 0), maxHandlePosition);

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
  wireBoxes();

  const initialBox = getInitialActiveBox();
  if (initialBox) setActiveBox(initialBox);
});

/*
  Wheel behavior on the projects carousel:
  - Vertical wheel scrolls horizontally (restores intuitive horizontal navigation)
  - Trackpad horizontal also works (deltaX contributes)
*/
document.addEventListener('wheel', function(e) {
  if (!isProjectsCarouselPage()) return;

  const dx = Math.abs(e.deltaX) > 0 ? e.deltaX : 0;
  const dy = Math.abs(e.deltaY) > 0 ? e.deltaY : 0;
  const delta = dx + dy;

  if (delta !== 0) {
    window.scrollBy(delta * 0.65, 0);

    const handlePosition = getHandlePositionBasedOnScroll();
    gsap.to(".handle", {
      duration: 0.28,
      x: handlePosition,
      ease: "power2",
    });
  }

  // prevent vertical scroll on this page
  e.preventDefault();
}, { passive: false });

window.addEventListener('scroll', function() {
  if (!isProjectsCarouselPage()) return;

  const handlePosition = getHandlePositionBasedOnScroll();
  gsap.to(".handle", {
    duration: 0.28,
    x: handlePosition,
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

  if (span) {
    span.addEventListener('click', function() {
      gsap.to(modal, {autoAlpha: 0, duration: 0.5, onComplete: function(){
        modal.style.visibility = "hidden";
      }});
    });
  }

  window.addEventListener('click', function(event) {
    if (event.target == modal) {
      gsap.to(modal, {autoAlpha: 0, duration: 0.5, onComplete: function(){
        modal.style.visibility = "hidden";
      }});
    }
  });
}

// loading screen
document.getElementById('loader').style.display = 'flex';
scrambleText(document.getElementById('loaderText'), 'LOADING', 2000);

if (sessionStorage.getItem("firstLoadDone") === null) {
  setTimeout(removeLoader, 1000);
  sessionStorage.setItem("firstLoadDone", 1);
} else {
  setTimeout(removeLoader, 500);
}

function removeLoader() {
  document.getElementById('loader').style.display = 'none';
  sessionStorage.removeItem("firstLoadDone");
}


function enableDragToScroll() {
  const container = document.getElementById("containers");
  if (!container) return;

  let pointerId = null;
  let isPointerDown = false;
  let isDragging = false;

  let startX = 0;
  let startScrollLeft = 0;

  const DRAG_THRESHOLD_PX = 14; // higher so small jitter doesn't kill clicks

  const shouldIgnoreTarget = (t) => {
    return !!t.closest("button, a, input, textarea, select, .scrollbar, .handle");
  };

  container.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    if (shouldIgnoreTarget(e.target)) return;

    isPointerDown = true;
    isDragging = false;
    pointerId = e.pointerId;

    startX = e.clientX;
    startScrollLeft = window.scrollX;

    // IMPORTANT: do NOT setPointerCapture here.
    // Capturing here breaks child clicks.
  });

  container.addEventListener("pointermove", (e) => {
    if (!isPointerDown || e.pointerId !== pointerId) return;

    const dx = e.clientX - startX;

    if (!isDragging && Math.abs(dx) > DRAG_THRESHOLD_PX) {
      isDragging = true;
      container.classList.add("dragging");

      // capture ONLY once we're truly dragging
      container.setPointerCapture(pointerId);
    }

    if (!isDragging) return;

    window.scrollTo(startScrollLeft - dx, 0);

    // keep custom scrollbar handle synced
    const handlePosition = getHandlePositionBasedOnScroll();
    gsap.to(".handle", { duration: 0.0, x: handlePosition });
  });

  const endDrag = (e) => {
    if (e.pointerId !== pointerId) return;

    // If we were dragging, prevent the post-drag click.
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }

    isPointerDown = false;
    isDragging = false;
    container.classList.remove("dragging");

    try { container.releasePointerCapture(pointerId); } catch {}
    pointerId = null;
  };

  container.addEventListener("pointerup", endDrag);
  container.addEventListener("pointercancel", endDrag);
}

// call it
document.addEventListener("DOMContentLoaded", () => {
  enableDragToScroll();
});

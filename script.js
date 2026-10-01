// Mobile menu
const menu = document.getElementById("menu");
const burger = document.getElementById("burger");
burger.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  burger.setAttribute("aria-expanded", open);
});
menu.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    menu.classList.remove("open");
    burger.setAttribute("aria-expanded", false);
  }),
);

// Navbar shadow + back-to-top button
const nav = document.querySelector("nav");
const topBtn = document.getElementById("top");
window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 10);
  topBtn.classList.toggle("show", window.scrollY > 600);
});
topBtn.addEventListener("click", () =>
  window.scrollTo({ top: 0, behavior: "smooth" }),
);

// Active section indicator
const links = document.querySelectorAll('.links a[href^="#"]:not(.nav-cta)');
const spy = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        links.forEach((l) =>
          l.classList.toggle(
            "active",
            l.getAttribute("href") === "#" + e.target.id,
          ), );
      }
    });
  },
  { rootMargin: "-40% 0px -55% 0px" },
);
document.querySelectorAll("main section[id]").forEach((s) => spy.observe(s));

// Scroll reveal
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => e.target.classList.toggle("in", e.isIntersecting));
  },
  { threshold: 0.1 },
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// Dark / light theme
const themeBtn = document.getElementById("theme");
const root = document.documentElement;
function showTheme() {
  const dark = root.getAttribute("data-theme") === "dark";
  themeBtn.innerHTML =
    '<i class="fa-solid ' +
    (dark ? "fa-sun" : "fa-moon") +
    '" aria-hidden="true"></i>';
  themeBtn.setAttribute(
    "aria-label",
    dark ? "Switch to light mode" : "Switch to dark mode",
  );
}
themeBtn.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try {
    localStorage.setItem("theme", next);
  } catch (e) {}
  showTheme();
});
showTheme();

// Full-screen image viewer (works for every image inside a .diagram figure)
const viewer = document.createElement("div");
viewer.className = "viewer";
viewer.setAttribute("role", "dialog");
viewer.setAttribute("aria-modal", "true");
viewer.setAttribute("aria-label", "Image viewer");
viewer.innerHTML =
  '<button class="viewer-close" aria-label="Close image"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button><img alt=""><p class="viewer-cap"></p>';
document.body.appendChild(viewer);
const viewerImg = viewer.querySelector("img");
const viewerCap = viewer.querySelector(".viewer-cap");
const viewerClose = viewer.querySelector(".viewer-close");
let lastFocus = null;
const mobile = window.matchMedia("(max-width: 767px)"); // viewer is for mobile screens only

function openViewer(img) {
  if (!mobile.matches) return;
  lastFocus = img;
  viewerImg.src = img.currentSrc || img.src;
  viewerImg.alt = img.alt;
  const cap =
    img.closest("figure") && img.closest("figure").querySelector("figcaption");
  viewerCap.textContent = cap ? cap.textContent : img.alt;
  resetZoom();
  viewer.classList.add("open");
  document.body.style.overflow = "hidden";
  viewerClose.focus();
}
function closeViewer() {
  resetZoom();
  viewer.classList.remove("open");
  document.body.style.overflow = "";
  if (lastFocus) lastFocus.focus();
}

document.querySelectorAll(".diagram img").forEach((img) => {
  // Wrap the image and add a small expand button in its corner (shown on mobile only via CSS)
  const wrap = document.createElement("div");
  wrap.className = "img-wrap";
  img.parentNode.insertBefore(wrap, img);
  wrap.appendChild(img);
  const btn = document.createElement("button");
  btn.className = "expand";
  btn.setAttribute("aria-label", "View image full screen");
  btn.innerHTML = '<i class="fa-solid fa-expand" aria-hidden="true"></i>';
  btn.addEventListener("click", () => openViewer(img));
  wrap.appendChild(btn);
  img.addEventListener("click", () => openViewer(img));
});
viewer.addEventListener("click", (e) => {
  if (e.target !== viewerImg) closeViewer();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && viewer.classList.contains("open")) closeViewer();
});

// Close the viewer if the screen grows past the mobile size
mobile.addEventListener("change", (e) => {
  if (!e.matches && viewer.classList.contains("open")) closeViewer();
});

// Pinch to zoom (two fingers) and drag to move around (one finger, only while zoomed)
let scale = 1,
  tx = 0,
  ty = 0;
let startDist = 0,
  startScale = 1,
  startX = 0,
  startY = 0,
  startTx = 0,
  startTy = 0;

function applyZoom() {
  viewerImg.style.transform =
    "translate(" + tx + "px," + ty + "px) scale(" + scale + ")";
}
function resetZoom() {
  scale = 1;
  tx = 0;
  ty = 0;
  applyZoom();
}
function clampPan() {
  const maxX = (viewerImg.offsetWidth * (scale - 1)) / 2;
  const maxY = (viewerImg.offsetHeight * (scale - 1)) / 2;
  tx = Math.max(-maxX, Math.min(maxX, tx));
  ty = Math.max(-maxY, Math.min(maxY, ty));
}
function distance(t) {
  return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
}

viewerImg.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length === 2) {
      startDist = distance(e.touches);
      startScale = scale;
    } else if (e.touches.length === 1) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTx = tx;
      startTy = ty;
    }
  },
  { passive: true },
);

viewerImg.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      scale = Math.max(
        1,
        Math.min(5, (startScale * distance(e.touches)) / startDist),
      );
      clampPan();
      applyZoom();
    } else if (e.touches.length === 1 && scale > 1) {
      e.preventDefault();
      tx = startTx + (e.touches[0].clientX - startX);
      ty = startTy + (e.touches[0].clientY - startY);
      clampPan();
      applyZoom();
    }
  },
  { passive: false },
);

viewerImg.addEventListener("touchend", (e) => {
  if (e.touches.length === 1) {
    // one finger lifted after a pinch: continue as a drag
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startTx = tx;
    startTy = ty;
  }
  if (scale < 1.05) resetZoom();
});

// Stacked zone cards: right/left buttons, click a side card, arrow keys, or swipe
(function () {
  const stack = document.getElementById("zstack");
  if (!stack) return;
  const cards = Array.from(stack.querySelectorAll(".zcard"));
  const prev = document.getElementById("zprev");
  const next = document.getElementById("znext");
  const count = document.getElementById("zcount");
  let active = 0;

  function render() {
    cards.forEach((card, i) => {
      const d = i - active;
      card.style.setProperty("--d", d);
      card.style.setProperty("--abs", Math.abs(d));
      card.classList.toggle("active", d === 0);
      card.classList.toggle("hide", Math.abs(d) > 2);
      card.setAttribute("aria-hidden", d !== 0);
    });
    prev.disabled = active === 0;
    next.disabled = active === cards.length - 1;
    count.textContent = active + 1 + " / " + cards.length;
  }
  function go(n) {
    active = Math.max(0, Math.min(cards.length - 1, n));
    render();
  }

  prev.addEventListener("click", () => go(active - 1));
  next.addEventListener("click", () => go(active + 1));
  cards.forEach((card, i) => card.addEventListener("click", () => go(i)));
  stack.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(active + 1);
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(active - 1);
    }
  });

  let startX = null;
  stack.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0].clientX;
    },
    { passive: true },
  );
  stack.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
    startX = null;
  });

  render();
})();

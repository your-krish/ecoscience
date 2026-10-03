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
          ),
        );
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

let forcedOpen = false; // true when opened from the Bhopal image (works on PC too)
function openViewer(img, force) {
  if (!force && !mobile.matches) return;
  forcedOpen = !!force;
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
  if (!e.matches && !forcedOpen && viewer.classList.contains("open"))
    closeViewer();
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

// Stacked cards (zones and hotspots): right/left buttons, click a side card, arrow keys, or swipe
document.querySelectorAll(".zones").forEach((root) => {
  const stack = root.querySelector(".stack");
  const cards = Array.from(stack.querySelectorAll(".zcard"));
  const prev = root.querySelector(".zprev");
  const next = root.querySelector(".znext");
  const count = root.querySelector(".zcount");
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
});

// Reading progress bar
const bar = document.getElementById("progress");
function updateBar() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
}
window.addEventListener("scroll", updateBar, { passive: true });
window.addEventListener("resize", updateBar);
updateBar();

// Staggered card reveal: number the children of card grids
document
  .querySelectorAll(".grid.reveal, .steps.reveal, .pillars.reveal")
  .forEach((grid) => {
    grid.classList.add("stag");
    Array.from(grid.children).forEach((child, i) => {
      child.classList.add("stagger");
      child.style.setProperty("--i", i);
    });
  });

// Timeline: number the steps so they appear one after another
document
  .querySelectorAll(".tl li")
  .forEach((li, i) => li.style.setProperty("--i", i));

// Soft spotlight on cards that follows the mouse
document.addEventListener("mousemove", (e) => {
  const card = e.target.closest && e.target.closest(".card");
  if (!card) return;
  const r = card.getBoundingClientRect();
  card.style.setProperty("--mx", e.clientX - r.left + "px");
  card.style.setProperty("--my", e.clientY - r.top + "px");
});

// ===== Side dot navigation =====
(function () {
  const dots = Array.from(document.querySelectorAll(".dots a"));
  if (!dots.length) return;
  function set(id) {
    dots.forEach((d) =>
      d.classList.toggle("active", d.getAttribute("href") === "#" + id),
    );
  }
  set("top-of-page");
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) set(e.target.id);
      });
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  document.querySelectorAll("main section[id]").forEach((s) => obs.observe(s));
  window.addEventListener(
    "scroll",
    () => {
      if (window.scrollY < 250) set("top-of-page");
    },
    { passive: true },
  );
})();

// ===== Counters (India at a glance) =====
document.querySelectorAll(".glance").forEach((strip) => {
  const nums = strip.querySelectorAll("b[data-count]");
  function run() {
    nums.forEach((el) => {
      const target = +el.dataset.count,
        suffix = el.dataset.suffix || "";
      const start = performance.now(),
        dur = 1200;
      (function tick(now) {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      })(start);
    });
  }
  new IntersectionObserver(
    (entries, o) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          run();
          o.unobserve(strip);
        }
      });
    },
    { threshold: 0.4 },
  ).observe(strip);
});

// ===== Mini quizzes =====
const QUIZ = {
  ecosystems: [
    {
      q: "About how much energy passes to the next trophic level?",
      o: ["About 90%", "About 50%", "About 10%", "About 1%"],
      a: 2,
      why: "Roughly 10% is transferred; the rest is lost as heat.",
    },
    {
      q: "Which group returns nutrients from dead matter to the soil?",
      o: ["Producers", "Herbivores", "Decomposers", "Tertiary consumers"],
      a: 2,
      why: "Bacteria and fungi break down dead organic matter and waste.",
    },
    {
      q: "Which type of succession starts on bare rock with no soil?",
      o: ["Secondary succession", "Primary succession", "Both start with soil"],
      a: 1,
      why: "Primary succession begins where soil is absent, such as newly exposed rock.",
    },
  ],
  resources: [
    {
      q: "Which of these is a renewable energy resource?",
      o: ["Coal", "Natural gas", "Solar energy", "Petroleum"],
      a: 2,
      why: "Solar energy is replenished naturally; the others are finite fossil fuels.",
    },
    {
      q: "Overusing groundwater leads mainly to…",
      o: ["More fertile soil", "Falling water tables", "Higher rainfall"],
      a: 1,
      why: "Groundwater depletion lowers water tables and reduces availability.",
    },
    {
      q: "Which is an individual conservation strategy?",
      o: [
        "Leaving taps running",
        "Rooftop rainwater harvesting",
        "Burning more fuelwood",
        "Using more single-use plastic",
      ],
      a: 1,
      why: "Rainwater harvesting recharges groundwater and lowers demand on shared supplies.",
    },
  ],
  biodiversity: [
    {
      q: "How many biogeographic zones is India divided into (Rodgers and Panwar)?",
      o: ["Five", "Eight", "Ten", "Twelve"],
      a: 2,
      why: "India is commonly divided into ten biogeographic zones.",
    },
    {
      q: "Which of these is NOT a biodiversity hotspot in India?",
      o: [
        "Himalaya",
        "Indo-Burma",
        "Thar Desert",
        "Western Ghats and Sri Lanka",
      ],
      a: 2,
      why: "The hotspots are Himalaya, Indo-Burma, Western Ghats and Sri Lanka, and Sundaland.",
    },
    {
      q: "What does habitat fragmentation lead to?",
      o: [
        "Larger, connected habitats",
        "Isolated populations and reduced gene flow",
        "Higher genetic diversity",
      ],
      a: 1,
      why: "Small isolated populations lose genetic and species diversity.",
    },
  ],
  pollution: [
    {
      q: "Which gas leaked in the Bhopal tragedy of 1984?",
      o: ["Chlorine", "Carbon monoxide", "Methyl isocyanate (MIC)", "Methane"],
      a: 2,
      why: "Methyl isocyanate (MIC) leaked from a storage tank after water entered it.",
    },
    {
      q: "Which step of the plan uses gas sensors and real-time alarms?",
      o: ["Prevent", "Detect", "Treat", "Monitor"],
      a: 1,
      why: "Detect covers gas sensors, IoT leak monitoring and real-time alarms.",
    },
    {
      q: "Bioremediation and phytoremediation are used to…",
      o: [
        "Store gas under pressure",
        "Generate electricity",
        "Clean contaminated soil and groundwater",
      ],
      a: 2,
      why: "They treat soil and groundwater contaminated by abandoned waste.",
    },
  ],
};

document.querySelectorAll(".quiz[data-quiz]").forEach((box) => {
  const items = QUIZ[box.dataset.quiz];
  if (!items) return;
  let score = 0,
    answered = 0;

  function build() {
    score = 0;
    answered = 0;
    box.innerHTML =
      '<div class="quiz-h"><h3><i class="fa-solid fa-circle-question" aria-hidden="true"></i> Mini quiz</h3><span class="quiz-score" aria-live="polite">Score: 0 / ' +
      items.length +
      "</span></div>";
    items.forEach((it, qi) => {
      const block = document.createElement("div");
      block.className = "qblock";
      block.innerHTML =
        '<p class="qtext">' +
        (qi + 1) +
        ". " +
        it.q +
        '</p><div class="qopts"></div><p class="qfb" hidden></p>';
      const opts = block.querySelector(".qopts");
      it.o.forEach((text, oi) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "qopt";
        b.textContent = text;
        b.addEventListener("click", () => {
          const all = opts.querySelectorAll(".qopt");
          all.forEach((x) => (x.disabled = true));
          const fb = block.querySelector(".qfb");
          if (oi === it.a) {
            b.classList.add("ok");
            score++;
            fb.innerHTML = "<b>Correct!</b> " + it.why;
          } else {
            b.classList.add("bad");
            all[it.a].classList.add("ok");
            fb.innerHTML = "<b>Not quite.</b> " + it.why;
          }
          all.forEach((x) => {
            if (!x.classList.contains("ok") && !x.classList.contains("bad"))
              x.classList.add("dim");
          });
          fb.hidden = false;
          answered++;
          box.querySelector(".quiz-score").textContent =
            "Score: " + score + " / " + items.length;
          if (answered === items.length) {
            const r = document.createElement("button");
            r.type = "button";
            r.className = "qretry";
            r.textContent = "Try again";
            r.addEventListener("click", build);
            box.appendChild(r);
          }
        });
        opts.appendChild(b);
      });
      box.appendChild(block);
    });
  }
  build();
});

// Bhopal case-study image: full screen on mobile AND PC
document.querySelectorAll(".case-fig").forEach((fig) => {
  const img = fig.querySelector("img");
  const btn = fig.querySelector(".case-expand");
  if (!img) return;
  img.addEventListener("click", () => openViewer(img, true));
  if (btn) btn.addEventListener("click", () => openViewer(img, true));
});

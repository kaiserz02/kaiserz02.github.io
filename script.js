(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Current year ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Rotating hero word ---- */
  var rotateEl = document.getElementById("rotateWord");
  if (rotateEl && !reduceMotion) {
    var words = [".NET", "React", "Angular", "Azure", "TypeScript", "AI"];
    var i = 0;
    setInterval(function () {
      rotateEl.classList.add("swap");
      setTimeout(function () {
        i = (i + 1) % words.length;
        rotateEl.textContent = words[i];
        rotateEl.classList.remove("swap");
      }, 250);
    }, 2200);
  }

  /* ---- Count-up stats ---- */
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-target"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var dur = 1100, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---- Scroll-reveal + stat trigger ---- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        entry.target.querySelectorAll("[data-target]").forEach(countUp);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
    document.querySelectorAll("[data-target]").forEach(countUp);
  }

  /* ---- Sticky nav: shadow + active-section highlight ---- */
  var nav = document.getElementById("nav");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-links a"));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  function onScroll() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 8);

    var toTop = document.getElementById("toTop");
    if (toTop) toTop.classList.toggle("show", window.scrollY > 500);

    var pos = window.scrollY + (nav ? nav.offsetHeight : 0) + 24;
    var current = sections[0];
    sections.forEach(function (sec) {
      if (sec.offsetTop <= pos) current = sec;
    });
    navLinks.forEach(function (a) {
      a.classList.toggle("active", current && a.getAttribute("href") === "#" + current.id);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Back to top ---- */
  var toTop = document.getElementById("toTop");
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---- Copy email ---- */
  var copyBtn = document.getElementById("copyEmail");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var email = copyBtn.getAttribute("data-email");
      var done = function () {
        var original = "Copy email";
        copyBtn.textContent = "Copied!";
        copyBtn.classList.add("copied");
        setTimeout(function () {
          copyBtn.textContent = original;
          copyBtn.classList.remove("copied");
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(done, function () { window.location.href = "mailto:" + email; });
      } else {
        window.location.href = "mailto:" + email;
      }
    });
  }

  /* ---- Scroll progress bar ---- */
  var progressEl = document.getElementById("scrollProgress");
  if (progressEl) {
    var updateProgress = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      progressEl.style.transform = "scaleX(" + ratio + ")";
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();
  }

  /* ---- Mobile nav toggle ---- */
  var navToggle = document.getElementById("navToggle");
  var navLinksEl = document.getElementById("navLinks");
  if (navToggle && navLinksEl) {
    var closeMenu = function () {
      navLinksEl.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    };
    navToggle.addEventListener("click", function () {
      var open = navLinksEl.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navLinksEl.addEventListener("click", function (e) {
      if (e.target.tagName === "A") closeMenu();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 640) closeMenu();
    });
  }

  /* ---- Project filter chips ---- */
  var filterBar = document.querySelector(".filter-bar");
  var cardsEl = document.getElementById("projectCards");
  if (filterBar && cardsEl) {
    var projectCards = Array.prototype.slice.call(cardsEl.querySelectorAll(".card"));
    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest(".chip");
      if (!btn) return;
      var filter = btn.getAttribute("data-filter");
      filterBar.querySelectorAll(".chip").forEach(function (c) {
        var on = c === btn;
        c.classList.toggle("active", on);
        c.setAttribute("aria-pressed", on ? "true" : "false");
      });
      projectCards.forEach(function (card) {
        var tags = (card.getAttribute("data-tags") || "").split(" ");
        var show = filter === "all" || tags.indexOf(filter) !== -1;
        card.classList.remove("filter-in");
        if (show) {
          card.classList.remove("is-hidden");
          if (!reduceMotion) {
            void card.offsetWidth; // restart entrance animation
            card.classList.add("filter-in");
          }
        } else {
          card.classList.add("is-hidden");
        }
      });
    });
  }

  /* ---- Card pointer spotlight ---- */
  if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - rect.left) + "px");
        card.style.setProperty("--my", (e.clientY - rect.top) + "px");
      });
    });
  }
})();

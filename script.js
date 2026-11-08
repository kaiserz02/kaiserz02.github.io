(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NAV_BREAKPOINT = 920;

  /* ---- Current year ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

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
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
    document.querySelectorAll("[data-target]").forEach(countUp);
  }

  /* ---- Sticky nav state + active section + progress + back-to-top ---- */
  var nav = document.getElementById("nav");
  var progressEl = document.getElementById("scrollProgress");
  var toTop = document.getElementById("toTop");
  var navLinkEls = Array.prototype.slice.call(document.querySelectorAll(".nav-links a"));
  var sections = navLinkEls
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  function onScroll() {
    var y = window.scrollY;

    if (nav) nav.classList.toggle("scrolled", y > 8);
    if (toTop) toTop.classList.toggle("show", y > 600);

    if (progressEl) {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      progressEl.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
    }

    var pos = y + (nav ? nav.offsetHeight : 0) + 32;
    var current = null;
    sections.forEach(function (sec) {
      if (sec.offsetTop <= pos) current = sec;
    });
    navLinkEls.forEach(function (a) {
      a.classList.toggle("active", !!current && a.getAttribute("href") === "#" + current.id);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---- Back to top ---- */
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
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
      if (e.target.closest("a")) closeMenu();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > NAV_BREAKPOINT) closeMenu();
    });
  }

  /* ---- Copy email (works for any button with data-email) ---- */
  document.querySelectorAll("[data-email]").forEach(function (btn) {
    var labelEl = btn.querySelector(".label") || btn;
    var original = labelEl.textContent;
    btn.addEventListener("click", function () {
      var email = btn.getAttribute("data-email");
      var done = function () {
        labelEl.textContent = "Copied!";
        btn.classList.add("copied");
        setTimeout(function () {
          labelEl.textContent = original;
          btn.classList.remove("copied");
        }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(done, function () {
          window.location.href = "mailto:" + email;
        });
      } else {
        window.location.href = "mailto:" + email;
      }
    });
  });

  /* ---- Project filter chips ---- */
  var filterBar = document.querySelector(".filter-bar");
  var cardsEl = document.getElementById("projectCards");
  if (filterBar && cardsEl) {
    var projectCards = Array.prototype.slice.call(cardsEl.querySelectorAll(".work"));
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
})();

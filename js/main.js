// Droplet Lab — shared site behaviors (no dependencies)
(function () {
  "use strict";

  /* Mobile nav toggle */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      links.classList.toggle("is-open", !open);
      document.body.style.overflow = !open ? "hidden" : "";
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        toggle.setAttribute("aria-expanded", "false");
        links.classList.remove("is-open");
        document.body.style.overflow = "";
      });
    });
  }

  /* Scroll reveal (section-level fade + rise into view, once) */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealEls.forEach(function (el) { el.classList.add("visible"); });
    } else {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
      revealEls.forEach(function (el) { revealObserver.observe(el); });
    }
  }

  /* Gallery carousel (featured image + filmstrip) */
  var carousel = document.querySelector("[data-carousel]");
  if (carousel) {
    var stageImg = carousel.querySelector(".carousel-image");
    var captionEl = carousel.querySelector("[data-carousel-caption]");
    var countEl = carousel.querySelector("[data-carousel-count]");
    var thumbs = Array.prototype.slice.call(carousel.querySelectorAll(".carousel-thumb"));
    var prevArrow = carousel.querySelector(".carousel-arrow--prev");
    var nextArrow = carousel.querySelector(".carousel-arrow--next");
    var current = 0;

    function show(index, scrollThumbIntoView) {
      current = (index + thumbs.length) % thumbs.length;
      var thumb = thumbs[current];
      stageImg.src = thumb.getAttribute("data-full");
      stageImg.alt = thumb.getAttribute("data-alt") || "";
      if (captionEl) captionEl.textContent = thumb.getAttribute("data-caption") || "";
      if (countEl) countEl.textContent = String(current + 1).padStart(2, "0") + " / " + thumbs.length;
      thumbs.forEach(function (t, i) {
        var active = i === current;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", String(active));
      });
      if (scrollThumbIntoView) {
        thumb.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }

    thumbs.forEach(function (thumb, i) {
      thumb.addEventListener("click", function () { show(i, true); });
    });
    if (prevArrow) prevArrow.addEventListener("click", function () { show(current - 1, true); });
    if (nextArrow) nextArrow.addEventListener("click", function () { show(current + 1, true); });
    carousel.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") show(current + 1, true);
      if (e.key === "ArrowLeft") show(current - 1, true);
    });

    show(0, false);

    /* Auto-play like a slideshow, pausing on hover/focus */
    var carouselTimer = null;
    var carouselReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function stopCarouselAuto() { if (carouselTimer) clearInterval(carouselTimer); carouselTimer = null; }
    function startCarouselAuto() {
      if (carouselReduceMotion) return;
      stopCarouselAuto();
      carouselTimer = setInterval(function () { show(current + 1, true); }, 5000);
    }
    carousel.addEventListener("mouseenter", stopCarouselAuto);
    carousel.addEventListener("mouseleave", startCarouselAuto);
    carousel.addEventListener("focusin", stopCarouselAuto);
    carousel.addEventListener("focusout", startCarouselAuto);
    startCarouselAuto();
  }

  /* Slideshow (home hero, and research video strip — auto-advances unless data-no-auto is set) */
  var slideshow = document.querySelector("[data-slideshow]");
  if (slideshow) {
    var slides = Array.prototype.slice.call(slideshow.querySelectorAll(".slideshow-slide"));
    var dots = Array.prototype.slice.call(slideshow.querySelectorAll(".slideshow-dots .dot"));
    var prevArrow2 = slideshow.querySelector(".slideshow-arrow--prev");
    var nextArrow2 = slideshow.querySelector(".slideshow-arrow--next");
    var slideIndex = 0;
    var timer = null;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function showSlide(i) {
      slideIndex = (i + slides.length) % slides.length;
      slides.forEach(function (s, idx) { s.classList.toggle("is-active", idx === slideIndex); });
      dots.forEach(function (d, idx) {
        var active = idx === slideIndex;
        d.classList.toggle("is-active", active);
        d.setAttribute("aria-selected", String(active));
      });
    }
    function stopAuto() { if (timer) clearInterval(timer); timer = null; }
    function startAuto() {
      if (reduceMotion || slideshow.hasAttribute("data-no-auto")) return;
      stopAuto();
      timer = setInterval(function () { showSlide(slideIndex + 1); }, 5000);
    }

    if (prevArrow2) prevArrow2.addEventListener("click", function () { showSlide(slideIndex - 1); startAuto(); });
    if (nextArrow2) nextArrow2.addEventListener("click", function () { showSlide(slideIndex + 1); startAuto(); });
    dots.forEach(function (d, i) {
      d.addEventListener("click", function () { showSlide(i); startAuto(); });
    });
    slideshow.addEventListener("mouseenter", stopAuto);
    slideshow.addEventListener("mouseleave", startAuto);
    slideshow.addEventListener("focusin", stopAuto);
    slideshow.addEventListener("focusout", startAuto);

    showSlide(0);
    startAuto();
  }

  /* YouTube facade: swap thumbnail + play button for a real embed on click
     (only for facades that opted into inline embedding via data-yt-id;
     plain video-facade links fall back to opening YouTube directly) */
  document.querySelectorAll(".video-facade[data-yt-id]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var id = btn.getAttribute("data-yt-id");
      var title = btn.getAttribute("data-yt-title") || "Video";
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
      iframe.title = title;
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      btn.replaceWith(iframe);
    });
  });

  /* Footer year */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

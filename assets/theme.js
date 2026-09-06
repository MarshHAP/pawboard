/* PawBoard theme JS: gallery, AJAX add-to-cart, video modal, header, mobile nav */
(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* Header shadow on scroll */
  function initHeader() {
    var header = $("[data-header]");
    if (!header) return;
    var update = function () { header.classList.toggle("is-scrolled", window.scrollY > 4); };
    window.addEventListener("scroll", update, { passive: true });
    update();

    var toggle = $("[data-nav-toggle]");
    var nav = $("[data-mobile-nav]");
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = nav.hidden;
        nav.hidden = !open;
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      $$("a", nav).forEach(function (a) {
        a.addEventListener("click", function () { nav.hidden = true; toggle.setAttribute("aria-expanded", "false"); });
      });
    }
  }

  /* Gallery */
  function initGallery(root) {
    var slides = $$("[data-slide]", root);
    var thumbs = $$("[data-thumb]", root);
    if (!slides.length) return;
    var current = 0;

    function show(i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, j) {
        var active = j === current;
        s.classList.toggle("is-active", active);
        var vid = s.querySelector("video");
        if (vid) { active ? vid.play().catch(function () {}) : vid.pause(); }
      });
      thumbs.forEach(function (t, j) {
        t.classList.toggle("is-active", j === current);
        if (j === current && t.scrollIntoView) {
          t.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
        }
      });
    }

    thumbs.forEach(function (t, i) { t.addEventListener("click", function () { show(i); }); });
    var prev = $("[data-gallery-prev]", root);
    var next = $("[data-gallery-next]", root);
    if (prev) prev.addEventListener("click", function () { show(current - 1); });
    if (next) next.addEventListener("click", function () { show(current + 1); });

    /* swipe */
    var stage = $(".hero-stage", root);
    var startX = null;
    if (stage) {
      stage.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
      stage.addEventListener("touchend", function (e) {
        if (startX === null) return;
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 40) show(dx < 0 ? current + 1 : current - 1);
        startX = null;
      });
    }
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    });
  }

  /* Toast */
  var toastTimer;
  function toast(text) {
    var el = $("[data-toast]");
    if (!el) return;
    var t = $("[data-toast-text]", el);
    if (t) t.textContent = text;
    el.hidden = false;
    requestAnimationFrame(function () { el.classList.add("is-visible"); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove("is-visible");
      setTimeout(function () { el.hidden = true; }, 300);
    }, 3800);
  }

  function updateCartCount() {
    return fetch("/cart.js", { headers: { Accept: "application/json" } })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        $$("[data-cart-count]").forEach(function (el) {
          el.textContent = cart.item_count;
          el.hidden = cart.item_count === 0;
        });
        return cart;
      });
  }

  /* Buy box */
  function initBuyBox(box) {
    var form = $("[data-atc-form]", box);
    if (!form) return;
    var btn = $("[data-atc]", box);
    var label = $("[data-atc-label]", box);
    var select = $("[data-variant-select]", box);
    var idInput = $("[data-variant-id]", box);
    var priceNow = $("[data-price-now]", box);
    var priceWas = $("[data-price-was]", box);

    if (select) {
      select.addEventListener("change", function () {
        var opt = select.options[select.selectedIndex];
        if (idInput) idInput.value = opt.value;
        if (priceNow) priceNow.textContent = opt.getAttribute("data-price");
        var compare = opt.getAttribute("data-compare");
        if (priceWas) {
          if (compare) { priceWas.textContent = compare; priceWas.style.display = ""; }
          else { priceWas.style.display = "none"; }
        }
        if (btn) { btn.disabled = opt.disabled; if (label) label.textContent = opt.disabled ? "Sold out" : "Add to Cart"; }
      });
    }

    form.addEventListener("submit", function (e) {
      if (!window.fetch || !window.FormData) return; /* fall back to normal post */
      e.preventDefault();
      if (btn.disabled) return;
      var original = label ? label.textContent : "";
      btn.disabled = true;
      if (label) label.textContent = "Adding…";

      fetch("/cart/add.js", {
        method: "POST",
        headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: new FormData(form)
      })
        .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.data.description || res.data.message || "Could not add to cart");
          if (label) label.textContent = "Added ✓";
          toast("PawBoard added to your cart");
          return updateCartCount();
        })
        .catch(function (err) {
          toast(err.message || "Something went wrong");
        })
        .then(function () {
          setTimeout(function () { btn.disabled = false; if (label) label.textContent = original; }, 1600);
        });
    });
  }

  /* Video modal */
  function embedUrl(src) {
    var yt = src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
    if (yt) return { type: "iframe", src: "https://www.youtube.com/embed/" + yt[1] + "?autoplay=1&rel=0&modestbranding=1" };
    var vm = src.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vm) return { type: "iframe", src: "https://player.vimeo.com/video/" + vm[1] + "?autoplay=1" };
    return { type: "video", src: src };
  }

  function initVideo() {
    var modal = $("[data-video-modal]");
    if (!modal) return;
    var frame = $("[data-video-frame]", modal);

    function close() {
      modal.hidden = true;
      frame.innerHTML = "";
      document.body.style.overflow = "";
    }
    function open(src) {
      var e = embedUrl(src);
      frame.innerHTML = e.type === "iframe"
        ? '<iframe src="' + e.src + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="How PawBoard works"></iframe>'
        : '<video src="' + e.src + '" controls autoplay playsinline></video>';
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      var closeBtn = $(".video-modal-close", modal);
      if (closeBtn) closeBtn.focus();
    }

    $$("[data-video-open]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var src = btn.getAttribute("data-video-src");
        if (src) { open(src); return; }
        var target = document.getElementById("how-it-works");
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    $$("[data-video-close]", modal).forEach(function (el) { el.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) close(); });
  }

  /* FAQ: only one open at a time */
  function initFaq() {
    var items = $$(".faq-item");
    items.forEach(function (item) {
      item.addEventListener("toggle", function () {
        if (!item.open) return;
        items.forEach(function (other) { if (other !== item) other.open = false; });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initHeader();
    initVideo();
    initFaq();
    $$("[data-gallery]").forEach(initGallery);
    $$("[data-buybox]").forEach(initBuyBox);
  });
})();

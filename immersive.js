/* ============================================================
   immersive.js — comportamiento de la capa visual "galería inmersiva"
   (solo index.html). NO toca la lógica de script.js: solo agrega
   estados visuales y se puede borrar sin romper nada (el sitio vuelve
   a verse como con theme.css pero sin menú animado ni parallax).

   1) El header cambia de transparente a sólido al bajar.
   2) El menú de celular: etiqueta "Menú"/"Cerrar", bloqueo de scroll,
      cierre con la tecla Escape. (El abrir/cerrar lo sigue haciendo
      script.js con la clase "open" en #nav.)
   3) Parallax suave en la foto del hero.
   4) Carrusel de la galería: flechas, contador, arrastre con mouse y
      visor de foto en grande. 5) Las fotos del hero se inclinan con el mouse.
   ============================================================ */
(function () {
  'use strict';

  var body = document.body;
  var header = document.querySelector('header');
  var nav = document.getElementById('nav');
  var menuBtn = document.getElementById('menuBtn');
  var heroBg = document.querySelector('.hero-bg');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1) Header + 3) Parallax (un solo listener de scroll) ---------- */
  var ticking = false;

  function update() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset || 0;

    if (header) header.classList.toggle('scrolled', y > 40);

    if (heroBg && !reduceMotion && y < window.innerHeight * 1.2) {
      heroBg.style.transform = 'translate3d(0,' + (y * 0.18).toFixed(1) + 'px,0)';
    }
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }, { passive: true });
  update();

  /* ---------- 2) Menú ---------- */
  function syncMenu() {
    if (!nav) return;
    var open = nav.classList.contains('open');
    body.classList.toggle('menu-open', open);
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      var label = menuBtn.querySelector('.menu-label');
      if (label) label.textContent = open ? 'Cerrar' : 'Menú';
    }
  }

  if (nav && 'MutationObserver' in window) {
    new MutationObserver(syncMenu).observe(nav, { attributes: true, attributeFilter: ['class'] });
    syncMenu();
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav && nav.classList.contains('open')) {
      nav.classList.remove('open');
    }
  });

  /* Si se agranda la ventana (celular girado, escritorio), cierra el menú */
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900 && nav && nav.classList.contains('open')) {
      nav.classList.remove('open');
    }
  });

  /* ---------- 4) Carrusel de la galería ----------
     Flechas, contador, barra de avance, arrastre con mouse, foto del
     centro un poco más grande y visor de foto en grande (lightbox).
     En celular se sigue deslizando con el dedo como siempre. */
  var gallery = document.querySelector('#galeria .gallery-grid');
  if (gallery) initCarousel(gallery);

  function initCarousel(gallery) {
    var tiles = Array.prototype.slice.call(gallery.querySelectorAll('img'));
    var n = tiles.length;
    if (!n) return;

    gallery.setAttribute('tabindex', '0');
    gallery.setAttribute('role', 'region');
    gallery.setAttribute('aria-label', 'Galería de trabajos. Usa las flechas para ver más fotos.');

    tiles.forEach(function (img, i) {
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute('data-alt', img.alt);
      img.setAttribute('aria-label', 'Ver en grande: ' + img.alt);
    });

    /* Controles */
    var controls = document.createElement('div');
    controls.className = 'gal-controls';
    controls.innerHTML =
      '<button type="button" class="gal-btn gal-prev" aria-label="Foto anterior"><span aria-hidden="true">←</span></button>' +
      '<span class="gal-count" aria-live="polite"><b>1</b> / ' + n + '</span>' +
      '<button type="button" class="gal-btn gal-next" aria-label="Foto siguiente"><span aria-hidden="true">→</span></button>' +
      '<span class="gal-progress" aria-hidden="true"><i></i></span>';
    gallery.parentNode.appendChild(controls);

    var prevBtn = controls.querySelector('.gal-prev');
    var nextBtn = controls.querySelector('.gal-next');
    var countEl = controls.querySelector('.gal-count b');
    var barEl = controls.querySelector('.gal-progress i');

    function padLeft() {
      return parseFloat(getComputedStyle(gallery).paddingLeft) || 0;
    }

    function tileLeft(i) {
      return tiles[i].getBoundingClientRect().left - gallery.getBoundingClientRect().left + gallery.scrollLeft;
    }

    function activeIndex() {
      var max = gallery.scrollWidth - gallery.clientWidth;
      if (gallery.scrollLeft >= max - 4) return n - 1;
      var target = gallery.scrollLeft + padLeft();
      var best = 0, bestD = Infinity;
      for (var i = 0; i < n; i++) {
        var d = Math.abs(tileLeft(i) - target);
        if (d < bestD) { bestD = d; best = i; }
      }
      return best;
    }

    function goTo(i) {
      i = Math.max(0, Math.min(n - 1, i));
      gallery.scrollTo({
        left: Math.max(0, tileLeft(i) - padLeft()),
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
    }

    prevBtn.addEventListener('click', function () { goTo(activeIndex() - 1); });
    nextBtn.addEventListener('click', function () { goTo(activeIndex() + 1); });

    var gTick = false;
    function updateGallery() {
      gTick = false;
      var max = Math.max(1, gallery.scrollWidth - gallery.clientWidth);
      var left = gallery.scrollLeft;
      var idx = activeIndex();

      countEl.textContent = idx + 1;
      barEl.style.setProperty('--p', Math.max(0.06, (idx + 1) / n).toFixed(3));
      prevBtn.setAttribute('aria-disabled', idx <= 0 ? 'true' : 'false');
      nextBtn.setAttribute('aria-disabled', idx >= n - 1 ? 'true' : 'false');

      gallery.style.setProperty('--fl', left > 8 ? '80px' : '0px');
      gallery.style.setProperty('--fr', left < max - 8 ? '96px' : '0px');

      /* La foto más cercana al centro se ve un poco más grande y brillante */
      if (!reduceMotion) {
        var rect = gallery.getBoundingClientRect();
        var mid = rect.left + rect.width / 2;
        var span = rect.width * 0.55;
        for (var i = 0; i < n; i++) {
          var r = tiles[i].getBoundingClientRect();
          var t = Math.min(1, Math.abs(r.left + r.width / 2 - mid) / span);
          tiles[i].style.scale = (1 - 0.06 * t).toFixed(3);
          tiles[i].style.filter = 'brightness(' + (1 - 0.1 * t).toFixed(3) + ')';
        }
      }
    }

    function queueGallery() {
      if (!gTick) { gTick = true; window.requestAnimationFrame(updateGallery); }
    }

    gallery.addEventListener('scroll', queueGallery, { passive: true });
    window.addEventListener('resize', queueGallery);
    tiles.forEach(function (img) { img.addEventListener('load', queueGallery); });
    updateGallery();

    /* Arrastre con mouse */
    var down = false, startX = 0, startLeft = 0, moved = false;

    gallery.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true;
      moved = false;
      startX = e.clientX;
      startLeft = gallery.scrollLeft;
    });

    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 5) {
        moved = true;
        gallery.classList.add('is-dragging');
      }
      if (moved) gallery.scrollLeft = startLeft - dx;
    });

    function endDrag() {
      if (!down) return;
      down = false;
      gallery.classList.remove('is-dragging');
    }
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    gallery.addEventListener('dragstart', function (e) { e.preventDefault(); });

    /* Teclado dentro de la galería */
    gallery.addEventListener('keydown', function (e) {
      if (e.target !== gallery) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(activeIndex() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(activeIndex() - 1); }
    });

    /* ---------- Visor de foto grande ---------- */
    var lb = null, lbImg, lbCap, lbIndex = 0, lastFocus = null;

    function buildLightbox() {
      lb = document.createElement('div');
      lb.className = 'lb';
      lb.hidden = true;
      lb.setAttribute('role', 'dialog');
      lb.setAttribute('aria-modal', 'true');
      lb.setAttribute('aria-label', 'Foto ampliada');
      lb.innerHTML =
        '<button type="button" class="lb-btn lb-close" aria-label="Cerrar"><span aria-hidden="true">✕</span></button>' +
        '<button type="button" class="lb-btn lb-prev" aria-label="Foto anterior"><span aria-hidden="true">←</span></button>' +
        '<img alt="">' +
        '<p class="lb-cap"></p>' +
        '<button type="button" class="lb-btn lb-next" aria-label="Foto siguiente"><span aria-hidden="true">→</span></button>';
      document.body.appendChild(lb);
      lbImg = lb.querySelector('img');
      lbCap = lb.querySelector('.lb-cap');

      lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
      lb.querySelector('.lb-prev').addEventListener('click', function () { showLb(lbIndex - 1); });
      lb.querySelector('.lb-next').addEventListener('click', function () { showLb(lbIndex + 1); });
      lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });

      /* deslizar con el dedo para cambiar de foto */
      var tx = 0;
      lb.addEventListener('touchstart', function (e) { tx = e.changedTouches[0].clientX; }, { passive: true });
      lb.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - tx;
        if (Math.abs(dx) > 60) showLb(lbIndex + (dx < 0 ? 1 : -1));
      }, { passive: true });
    }

    function showLb(i) {
      lbIndex = (i + n) % n;
      var img = tiles[lbIndex];
      lbImg.style.animation = 'none';
      void lbImg.offsetWidth;
      lbImg.style.animation = '';
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.getAttribute('data-alt') || '';
      lbCap.textContent = (lbIndex + 1) + ' / ' + n + ' — ' + (img.getAttribute('data-alt') || '');
      goTo(lbIndex);
    }

    function openLightbox(i) {
      if (!lb) buildLightbox();
      lastFocus = document.activeElement;
      lb.hidden = false;
      body.classList.add('lb-open');
      showLb(i);
      lb.querySelector('.lb-close').focus();
    }

    function closeLightbox() {
      if (!lb || lb.hidden) return;
      lb.hidden = true;
      body.classList.remove('lb-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    gallery.addEventListener('click', function (e) {
      if (moved) { moved = false; return; }
      var img = e.target.closest ? e.target.closest('img') : null;
      if (img) openLightbox(tiles.indexOf(img));
    });

    gallery.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.tagName === 'IMG') {
        e.preventDefault();
        openLightbox(tiles.indexOf(e.target));
      }
    });

    document.addEventListener('keydown', function (e) {
      if (!lb || lb.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowRight') showLb(lbIndex + 1);
      else if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
      else if (e.key === 'Tab') {
        /* el foco se queda dentro del visor */
        var f = lb.querySelectorAll('button');
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- 6) Modo cuarto oscuro ----------
     script.js prende/apaga la clase "darkroom" en el body al picar
     #safelightBtn. Aquí solo se recuerda la elección para la próxima
     visita y se avisa el estado del botón (aria-pressed). */
  var safelightBtn = document.getElementById('safelightBtn');
  var DARKROOM_KEY = 'fotovista-cuarto-oscuro';

  function syncDarkroom() {
    var on = body.classList.contains('darkroom');
    if (safelightBtn) safelightBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    try { localStorage.setItem(DARKROOM_KEY, on ? '1' : '0'); } catch (e) { /* sin almacenamiento: no pasa nada */ }
  }

  try {
    if (localStorage.getItem(DARKROOM_KEY) === '1') body.classList.add('darkroom');
  } catch (e) { /* sin almacenamiento: arranca claro */ }

  if ('MutationObserver' in window) {
    new MutationObserver(syncDarkroom).observe(body, { attributes: true, attributeFilter: ['class'] });
  }
  syncDarkroom();

  /* ---------- 5) Las fotos del hero se inclinan un poco con el mouse ---------- */
  var stack = document.getElementById('photoStack');
  var heroEl = document.querySelector('.hero');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (stack && heroEl && finePointer && !reduceMotion) {
    var tiltTick = false, tx = 0, ty = 0;

    heroEl.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      tx = (e.clientX / window.innerWidth - 0.5);
      ty = (e.clientY / window.innerHeight - 0.5);
      if (!tiltTick) {
        tiltTick = true;
        window.requestAnimationFrame(function () {
          tiltTick = false;
          stack.style.setProperty('--ry', (tx * 7).toFixed(2) + 'deg');
          stack.style.setProperty('--rx', (-ty * 5).toFixed(2) + 'deg');
        });
      }
    });

    heroEl.addEventListener('pointerleave', function () {
      stack.style.setProperty('--ry', '0deg');
      stack.style.setProperty('--rx', '0deg');
    });
  }
})();

/* ============================================================
   medicion.js — Google Analytics (GA4) para todo el sitio
   ------------------------------------------------------------
   Está APAGADO hasta que pongas el ID real abajo. Mientras diga
   'G-XXXXXXXXXX' no carga nada ni manda ningún dato.

   Para activarlo:
   1) Crea gratis una propiedad para fotovistajz.com en
      analytics.google.com y copia su "ID de medición" (G-...).
   2) Pégalo en GA_ID, aquí abajo. Es el único lugar: todas las
      páginas cargan este archivo.
   3) IMPORTANTE: el Aviso de Privacidad (privacidad.html) dice hoy que
      el sitio NO usa herramientas de analítica. Antes de activar esto,
      hay que actualizar ese aviso para decir que se usa Google Analytics.

   Qué se mide además de las visitas (como "eventos" en GA4):
   - generate_lead  → clic en cualquier botón o enlace que abre WhatsApp,
                      incluidos los "Pedir por WhatsApp" del catálogo
   - contacto_correo → clic en "Pedir por correo" y similares
   - ver_catalogo    → clic en los botones que abren el catálogo
   En GA4 marca "generate_lead" como evento clave (conversión).
   ============================================================ */
(function () {
  'use strict';

  var GA_ID = 'G-XXXXXXXXXX';

  if (!/^G-[A-Z0-9]+$/.test(GA_ID) || GA_ID === 'G-XXXXXXXXXX') return;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);

  function pagina() {
    return location.pathname.replace(/^\//, '') || 'index.html';
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('a, button') : null;
    if (!el) return;

    var href = el.getAttribute('href') || '';
    var onclick = el.getAttribute('onclick') || '';
    var texto = (el.textContent || '').trim().slice(0, 60);

    if (href.indexOf('wa.me') !== -1 || onclick.indexOf("'whatsapp'") !== -1) {
      window.gtag('event', 'generate_lead', { method: 'whatsapp', boton: texto, pagina: pagina() });
    } else if (href.indexOf('mailto:') === 0 || onclick.indexOf("'email'") !== -1) {
      window.gtag('event', 'contacto_correo', { boton: texto, pagina: pagina() });
    } else if (el.id === 'heroCatalogoBtn' || el.id === 'navProductos' || el.id === 'footerProductos' ||
               href.indexOf('#catalogo') !== -1) {
      window.gtag('event', 'ver_catalogo', { boton: texto, pagina: pagina() });
    }
  }, true);
})();

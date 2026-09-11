/* ============================================================
   CONTACT CHANNELS
   ============================================================ */
const WHATSAPP_NUMBER = '526565508492'; // 52 + 656 550 8492
const ORDER_EMAIL = 'jcc.fotovista@gmail.com';

/* ============================================================
   MEMBRESÍA DE FOTÓGRAFOS
   Código único compartido (no hay cuentas ni base de datos: cualquiera
   que tenga este código lo puede usar). Cámbialo aquí cuando quieran
   otro código — es lo único que hay que editar.
   ============================================================ */
const MEMBER_CODE = 'fotovista'; // ⚠️ placeholder — pídele a David el código real y ponlo aquí
let memberApplied = false; // una vez aplicado correctamente, se queda activo el resto de la visita

/* ============================================================
   SITE INTERACTIONS (darkroom toggle, mobile menu, contact form)
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;

  // Darkroom safelight toggle — signature interaction for a photo lab
  const safelightBtn = document.getElementById('safelightBtn');
  if (safelightBtn) {
    safelightBtn.addEventListener('click', () => body.classList.toggle('darkroom'));
  }

  // Mobile menu
  const menuBtn = document.getElementById('menuBtn');
  const nav = document.getElementById('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => nav.classList.toggle('open'));
  }

  // Any nav link that points to a section: if the catalog is open, close it
  // first and then scroll to that section, so the header always gets you back.
  if (nav) {
    nav.querySelectorAll('a').forEach(a => {
      if (a.id === 'navProductos') return; // handled separately below
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        nav.classList.remove('open');
        if (document.body.classList.contains('catalog-mode')) {
          e.preventDefault();
          closeCatalogOverlay();
          if (href && href.startsWith('#')) {
            const target = document.querySelector(href);
            if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 30);
          }
        }
      });
    });
  }

  // Logo = enlace a Inicio: siempre sube al principio de la página y,
  // si el catálogo está abierto, lo cierra primero.
  const siteLogo = document.getElementById('siteLogo');
  if (siteLogo) {
    siteLogo.addEventListener('click', () => {
      if (document.body.classList.contains('catalog-mode')) closeCatalogOverlay();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Contact form -> opens a prefilled email to the shop (no server on this site).
  // CONTACT FORM FALLBACK: muchos celulares no tienen una app de correo
  // configurada, así que el "mailto:" simplemente no hace nada visible y el
  // mensaje se pierde sin que ni el cliente ni nosotros nos demos cuenta.
  // Por eso, además de intentar abrir el correo, siempre mostramos un
  // respaldo con el mensaje listo para copiar o mandar por WhatsApp.
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contactName').value.trim();
      const email = document.getElementById('contactEmail').value.trim();
      const message = document.getElementById('contactMessage').value.trim();
      const plainMessage = `Nombre: ${name}\nCorreo: ${email}\n\nMensaje:\n${message}`;
      const subject = encodeURIComponent(`Mensaje desde el sitio web — ${name}`);
      const body = encodeURIComponent(plainMessage);
      const mailtoUrl = `mailto:${ORDER_EMAIL}?subject=${subject}&body=${body}`;

      window.location.href = mailtoUrl;

      const fallback = document.getElementById('contactFallback');
      const fallbackText = document.getElementById('contactFallbackText');
      const fallbackWhatsapp = document.getElementById('contactFallbackWhatsapp');
      const fallbackMailto = document.getElementById('contactFallbackMailto');
      if (fallback && fallbackText && fallbackWhatsapp && fallbackMailto) {
        fallbackText.textContent = plainMessage;
        fallbackWhatsapp.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
          `Hola, les escribo desde el sitio web:\n\n${plainMessage}`
        )}`;
        fallbackMailto.href = mailtoUrl;
        fallback.hidden = false;
        fallback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  // Botón "Copiar mensaje" del respaldo de contacto
  const contactFallbackCopy = document.getElementById('contactFallbackCopy');
  if (contactFallbackCopy) {
    contactFallbackCopy.addEventListener('click', async () => {
      const text = document.getElementById('contactFallbackText')?.textContent || '';
      const original = contactFallbackCopy.textContent;
      try {
        await navigator.clipboard.writeText(text);
        contactFallbackCopy.textContent = '✅ ¡Copiado!';
      } catch (err) {
        contactFallbackCopy.textContent = 'Selecciona y copia el texto de arriba';
      }
      setTimeout(() => { contactFallbackCopy.textContent = original; }, 2200);
    });
  }

  // "Productos" nav link -> opens the catalog overlay instead of scrolling
  const navProductos = document.getElementById('navProductos');
  if (navProductos) {
    navProductos.addEventListener('click', (e) => {
      e.preventDefault();
      if (nav) nav.classList.remove('open');
      openCatalogOverlay();
      goToCatalog();
    });
  }

  // Footer "Productos" link -> same behavior as the one in the header
  const footerProductos = document.getElementById('footerProductos');
  if (footerProductos) {
    footerProductos.addEventListener('click', (e) => {
      e.preventDefault();
      openCatalogOverlay();
      goToCatalog();
    });
  }

  // Footer copyright year — se actualiza solo cada año, no hay que tocarlo nunca
  const footerYear = document.getElementById('footerYear');
  if (footerYear) footerYear.textContent = new Date().getFullYear();

  // Botón flotante de WhatsApp (pregunta general, no un pedido armado)
  const whatsappFloat = document.getElementById('whatsappFloat');
  if (whatsappFloat) {
    const msg = encodeURIComponent('Hola, tengo una pregunta sobre sus productos.');
    whatsappFloat.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  }

  // Botón "Avísenme de promociones" (dentro de la burbujita)
  const promoOptInBtn = document.getElementById('promoOptInBtn');
  if (promoOptInBtn) {
    const msg = encodeURIComponent('Hola, quiero que me avisen cuando tengan promociones o productos nuevos.');
    promoOptInBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  }

  /* ---------- PROMO BUBBLE ----------
     La burbujita aparece sola, se esconde sola, y se repite cada cierto
     tiempo — así no estorba todo el rato. Números que puedes ajustar:
       FIRST_DELAY   = cuánto espera antes de aparecer la primera vez
       VISIBLE_TIME  = cuánto tiempo se queda abierta cada vez que aparece
       REPEAT_EVERY  = cada cuánto vuelve a aparecer
     Si el cliente le da a la X, ya no vuelve a aparecer en esa visita. */
  const promoBubble = document.getElementById('promoBubble');
  const promoBubbleClose = document.getElementById('promoBubbleClose');
  if (promoBubble) {
    const FIRST_DELAY = 8000;   // 8 segundos
    const VISIBLE_TIME = 9000;  // se queda 9 segundos abierta
    const REPEAT_EVERY = 60000; // y vuelve a aparecer cada 60 segundos
    let promoTimer = null;

    function showPromoBubble() {
      // no la muestres si el cliente está dentro del catálogo en ese momento
      if (document.body.classList.contains('catalog-mode')) return;
      promoBubble.classList.add('show');
      promoTimer = setTimeout(() => promoBubble.classList.remove('show'), VISIBLE_TIME);
    }

    const cycle = setInterval(showPromoBubble, REPEAT_EVERY);
    setTimeout(showPromoBubble, FIRST_DELAY);

    if (promoBubbleClose) {
      promoBubbleClose.addEventListener('click', () => {
        promoBubble.classList.remove('show');
        clearTimeout(promoTimer);
        clearInterval(cycle); // ya no molesta más en esta visita
      });
    }
  }

  initPhotoStackDrag();

  // Hero "Ver catálogo" button -> same behavior
  const heroCatalogoBtn = document.getElementById('heroCatalogoBtn');
  if (heroCatalogoBtn) {
    heroCatalogoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openCatalogOverlay();
      goToCatalog();
    });
  }

  // Close overlay button
  const closeOverlayBtn = document.getElementById('closeOverlayBtn');
  if (closeOverlayBtn) {
    closeOverlayBtn.addEventListener('click', closeCatalogOverlay);
  }
});

/* ============================================================
   OVERLAY OPEN / CLOSE
   ============================================================ */
function openCatalogOverlay() {
  document.body.classList.add('catalog-mode');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function closeCatalogOverlay() {
  document.body.classList.remove('catalog-mode');
  // Al cerrar, limpia el "#catalogo/..." de la URL (ver bloque CATALOG URL
  // ROUTER más abajo) sin dejar una entrada nueva en el historial.
  if (!suppressHashUpdate && window.location.hash.indexOf('catalogo') !== -1) {
    history.pushState({}, '', window.location.pathname + window.location.search);
  }
}

// Direct shortcuts from the "Productos nuevos" cards on the main page
function openProductShortcut(type) {
  openCatalogOverlay();
  if (type === 'impresiones') startImpresiones();
  else if (type === 'cuadro') startCuadro();
  else if (type === 'fotosid') startIdPhoto();
}

/* ============================================================
   VIEW ROUTER (inside the overlay)
   ============================================================ */
function showView(id) {
  document.querySelectorAll('#catalogOverlay .view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // CATALOG URL ROUTER: cada categoría del catálogo (Impresiones, Cuadro,
  // Fotos ID...) ahora tiene su propia URL con "#catalogo/..." — así se puede
  // compartir el link directo a una categoría por WhatsApp, guardarlo en
  // favoritos, y el botón "atrás" del navegador regresa un paso en vez de
  // salir de la página. Los PASOS dentro de una categoría (tamaño, cantidad,
  // confirmar) no cambian la URL, solo el cambio de categoría lo hace.
  if (id in CATALOG_VIEWS && !suppressHashUpdate) {
    const hash = hashForCatalogView(id);
    if (window.location.hash !== hash) {
      history.pushState({ catalogView: id }, '', hash);
    }
  }
}
function goToCatalog() { showView('view-catalog'); }

/* ============================================================
   CATALOG URL ROUTER — mapa de vistas <-> "#catalogo/slug"
   ============================================================ */
const CATALOG_VIEWS = {
  'view-catalog': '',
  'view-impresiones': 'impresiones',
  'view-cuadro': 'cuadro',
  'view-postumas': 'postumas',
  'view-fotosid': 'fotos-id',
  'view-preview': 'vista-pared'
};
const CATALOG_SLUGS = Object.fromEntries(
  Object.entries(CATALOG_VIEWS).map(([viewId, slug]) => [slug, viewId])
);
function hashForCatalogView(id) {
  const slug = CATALOG_VIEWS[id];
  return slug ? `#catalogo/${slug}` : '#catalogo';
}

// true mientras aplicamos una ruta desde la URL (carga inicial o botón
// atrás/adelante), para no volver a empujar esa misma ruta al historial
let suppressHashUpdate = false;

function applyCatalogHashRoute() {
  const hash = window.location.hash; // "", "#catalogo" o "#catalogo/slug"
  suppressHashUpdate = true;
  if (hash.indexOf('catalogo') !== -1) {
    const slug = hash.replace('#catalogo', '').replace(/^\//, '');
    const viewId = CATALOG_SLUGS[slug] || 'view-catalog';
    openCatalogOverlay();
    showView(viewId);
  } else if (document.body.classList.contains('catalog-mode')) {
    closeCatalogOverlay();
  }
  suppressHashUpdate = false;
}

// Botón atrás/adelante del navegador
window.addEventListener('popstate', applyCatalogHashRoute);

// Link directo compartido (alguien abre fotovistajz.com/#catalogo/cuadro)
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash.indexOf('catalogo') !== -1) applyCatalogHashRoute();
});

/* ============================================================
   CATALOG DATA (precios reales Fotovista JCCastillo, lista general)
   ============================================================ */

// Impresiones: tamaño -> precio suelta y precio montada en tablilla
// (montada = null significa que ese tamaño no se monta)
// *_pro = precio de fotógrafo (membresía), de la lista de precios para
// fotógrafos que David compartió — se usa solo si el código es válido.
const printSizes = [
  { id: '4x6', label: '4×6', suelta: 8, montada: null, suelta_pro: 6, montada_pro: null },
  { id: '5x7', label: '5×7', suelta: 9, montada: null, suelta_pro: 7, montada_pro: null },
  { id: '6x8', label: '6×8', suelta: 11, montada: null, suelta_pro: 9, montada_pro: null },
  { id: '6x10', label: '6×10', suelta: 15, montada: null, suelta_pro: 12, montada_pro: null },
  { id: '6x12', label: '6×12', suelta: 18, montada: null, suelta_pro: 15, montada_pro: null },
  { id: '8x10', label: '8×10', suelta: 40, montada: 150, suelta_pro: 30, montada_pro: 100 },
  { id: '8x12', label: '8×12', suelta: 45, montada: 180, suelta_pro: 35, montada_pro: 130 },
  { id: '11x14', label: '11×14', suelta: 100, montada: 270, suelta_pro: 70, montada_pro: 175 },
  { id: '12x18', label: '12×18', suelta: 150, montada: 350, suelta_pro: 110, montada_pro: 245 },
  { id: '16x20', label: '16×20', suelta: 310, montada: 640, suelta_pro: 270, montada_pro: 500 },
  { id: '16x24', label: '16×24', suelta: 420, montada: 800, suelta_pro: 320, montada_pro: 580 },
  { id: '20x24', label: '20×24', suelta: 500, montada: 900, suelta_pro: 400, montada_pro: 630 },
  { id: '20x30', label: '20×30', suelta: 620, montada: 1290, suelta_pro: 500, montada_pro: 915 },
  { id: '24x36', label: '24×36', suelta: 700, montada: 1350, suelta_pro: 650, montada_pro: 1000 },
  { id: '30x40', label: '30×40', suelta: 1250, montada: 1650, suelta_pro: 1100, montada_pro: 1350 },
];

// Cuadro y Bastidor van juntos en un solo producto (antes eran 2 separados).
// "grupo" es solo para diferenciarlos internamente si algún día hace falta.
const cuadroOptions = [
  { id: '6x8-delgado', size: '6×8', tipo: 'Marco delgado', price: 90, grupo: 'marco' },
  { id: '8x10-delgado', size: '8×10', tipo: 'Marco delgado', price: 180, grupo: 'marco' },
  { id: '8x10-grueso', size: '8×10', tipo: 'Marco grueso', price: 220, grupo: 'marco' },
  { id: '8x10-bastidor', size: '8×10', tipo: 'Bastidor', price: 180, grupo: 'bastidor' },
  { id: '16x20-bastidor', size: '16×20', tipo: 'Bastidor', price: 670, grupo: 'bastidor' },
];

// Fotos ID: se toman EN EL LOCAL (no aplica lo de "manda tus fotos por
// WhatsApp"), por eso su flujo es más corto — solo elegir tipo y agendar.
// "desc" es la cantidad de fotos que incluye esa sesión.
const idPhotoTypes = [
  { id: 'infantil', label: 'Infantil', desc: '9 fotos', price: 100 },
  { id: 'credencial', label: 'Credencial', desc: '4 fotos', price: 100 },
  { id: 'credencial-ovalada', label: 'Credencial ovalada', desc: '4 fotos', price: 120 },
  { id: 'pasaporte', label: 'Pasaporte mexicano', desc: '4 fotos', price: 120 },
  { id: 'visa-laser', label: 'Visa láser', desc: '2 fotos', price: 150 },
  { id: 'diploma', label: 'Diploma', desc: '2 fotos', price: 150 },
  { id: 'titulo', label: 'Título', desc: '2 fotos', price: 200 },
  { id: 'digital', label: 'Fotografía oficial', desc: 'Formato digital', price: 120 },
];

// Póstumas (Homenaje Póstumo): el paquete es la cantidad de esquelas, y cada
// paquete tiene un precio distinto según el tamaño de la foto grande que se
// elija — es una tabla de precios de dos entradas (paquete × tamaño), tal
// cual la lista de precios que dio David. El diseño de la esquela (texto,
// fotos chicas, estilo) se coordina aparte por WhatsApp/correo, no aquí.
const postumasSizes = [
  { id: '8x10', label: '8×10' },
  { id: '11x14', label: '11×14' },
  { id: '12x18', label: '12×18' },
  { id: '16x20', label: '16×20' },
];
const postumasPackages = [
  { id: '20', qty: 20, prices: { '8x10': 400, '11x14': 500, '12x18': 550, '16x20': 800 } },
  { id: '30', qty: 30, prices: { '8x10': 550, '11x14': 650, '12x18': 700, '16x20': 950 } },
  { id: '40', qty: 40, prices: { '8x10': 700, '11x14': 750, '12x18': 850, '16x20': 1100 } },
  { id: '50', qty: 50, prices: { '8x10': 850, '11x14': 950, '12x18': 1000, '16x20': 1250 } },
];

/* ============================================================
   SMALL SHARED HELPERS
   ============================================================ */
function money(n) { return '$' + n.toLocaleString('es-MX') + ' MXN'; }

function buildOrderMessage(tipo, lines, total) {
  const msg = [
    'Hola, quiero hacer un pedido en Fotovista:',
    '',
    `Producto: ${tipo}`,
    ...lines,
    `Total estimado: ${money(total)}`,
    '',
    'Adjunto mis fotos aquí mismo. Quedo al pendiente del link de pago.'
  ];
  return msg.join('\n');
}

function sendOrder(channel, tipo, lines, total) {
  const message = buildOrderMessage(tipo, lines, total);
  if (channel === 'whatsapp') {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  } else {
    const subject = encodeURIComponent(`Pedido Fotovista — ${tipo}`);
    const body = encodeURIComponent(message + '\n\n(Adjunta tus fotos a este correo antes de enviarlo)');
    window.location.href = `mailto:${ORDER_EMAIL}?subject=${subject}&body=${body}`;
  }
  document.getElementById('successChannel').textContent =
    channel === 'whatsapp' ? 'por WhatsApp' : 'por correo';
  showView('view-success');
}

/* ============================================================
   QTY STEPPER (reused by all three flows)
   ============================================================ */
function renderQtyStepper(containerId, qty, onChange) {
  const el = document.getElementById(containerId);
  el.innerHTML = `
    <button type="button" class="qty-btn" data-dir="-1">−</button>
    <span class="qty-value">${qty}</span>
    <button type="button" class="qty-btn" data-dir="1">+</button>`;
  el.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => onChange(parseInt(btn.dataset.dir, 10)));
  });
}

/* ============================================================
   IMPRESIONES FLOW (Suelta o Montada en tablilla)
   Pasos: 1 Acabado, 2 Tamaño, 3 Cantidad, 4 Confirmar
   ============================================================ */
let impresionesState = { acabado: null, size: null, qty: 1, step: 1 };

function renderImpresionesAcabadoGrid() {
  const opts = [
    { id: 'suelta', label: 'Foto suelta', desc: 'Impresión sin montar' },
    { id: 'montada', label: 'Montada en tablilla', desc: 'Foto pegada a una tablilla rígida' },
  ];
  document.getElementById('impAcabadoGrid').innerHTML = opts.map(o => `
    <div class="opt-card ${impresionesState.acabado === o.id ? 'selected' : ''}" onclick="selectImpAcabado('${o.id}')">
      <b>${o.label}</b><span>${o.desc}</span>
    </div>`).join('');
}
function selectImpAcabado(id) {
  impresionesState.acabado = id;
  impresionesState.size = null; // el tamaño puede dejar de ser válido al cambiar acabado
  renderImpresionesAcabadoGrid();
  updateImpresionesNextBtn();
}

function renderImpresionesSizeGrid() {
  const key = impresionesState.acabado === 'montada' ? 'montada' : 'suelta';
  const sizes = printSizes.filter(s => s[key] !== null);
  document.getElementById('impSizeGrid').innerHTML = sizes.map(s => `
    <div class="opt-card ${impresionesState.size === s.id ? 'selected' : ''}" onclick="selectImpSize('${s.id}')">
      <b>${s.label}</b><span>${money(s[key])} c/u</span>
    </div>`).join('');
}
function selectImpSize(id) { impresionesState.size = id; renderImpresionesSizeGrid(); updateImpresionesNextBtn(); }

function unitPriceImpresiones() {
  const size = printSizes.find(s => s.id === impresionesState.size);
  if (!size) return 0;
  if (impresionesState.acabado === 'montada') {
    return (memberApplied && size.montada_pro != null) ? size.montada_pro : size.montada;
  }
  return (memberApplied && size.suelta_pro != null) ? size.suelta_pro : size.suelta;
}

function renderImpresionesQty() {
  renderQtyStepper('impQtyStepper', impresionesState.qty, (delta) => {
    impresionesState.qty = Math.max(1, impresionesState.qty + delta);
    renderImpresionesQty();
  });
}

function renderImpresionesReview() {
  const size = printSizes.find(s => s.id === impresionesState.size);
  const unit = unitPriceImpresiones();
  const total = unit * impresionesState.qty;
  document.getElementById('impReview').innerHTML = `
    <div class="review-row"><span>Acabado</span><b>${impresionesState.acabado === 'montada' ? 'Montada en tablilla' : 'Foto suelta'}</b></div>
    <div class="review-row"><span>Tamaño</span><b>${size.label}</b></div>
    <div class="review-row"><span>Cantidad</span><b>${impresionesState.qty}</b></div>
    ${memberApplied ? '<div class="review-row"><span>Precio</span><b class="pro-tag">Fotógrafo ✓</b></div>' : ''}
    <div class="review-row"><span>Total estimado</span><b>${money(total)}</b></div>
  `;
}

function renderImpMemberStatus() {
  const feedback = document.getElementById('impMemberFeedback');
  if (!feedback) return;
  if (memberApplied) {
    feedback.textContent = '✓ Precio de fotógrafo activo';
    feedback.className = 'member-feedback ok';
  } else {
    feedback.textContent = '';
    feedback.className = 'member-feedback';
  }
}

function applyImpMemberCode() {
  const input = document.getElementById('impMemberInput');
  const feedback = document.getElementById('impMemberFeedback');
  const code = input.value.trim();
  if (!code) return;
  if (code === MEMBER_CODE) {
    memberApplied = true;
    feedback.textContent = '✓ Código aplicado — precio de fotógrafo activado';
    feedback.className = 'member-feedback ok';
  } else {
    memberApplied = false;
    feedback.textContent = 'Código no válido';
    feedback.className = 'member-feedback err';
  }
  renderImpresionesReview();
}

function updateImpresionesNextBtn() {
  const btn = document.getElementById('impNextBtn');
  if (!btn) return;
  if (impresionesState.step === 1) btn.disabled = !impresionesState.acabado;
  else if (impresionesState.step === 2) btn.disabled = !impresionesState.size;
  else btn.disabled = false;
}

function goImpStep(n) {
  impresionesState.step = n;
  document.querySelectorAll('#view-impresiones .fstep').forEach(el => el.style.display = 'none');
  document.querySelector(`#view-impresiones .fstep[data-istep="${n}"]`).style.display = 'block';
  document.querySelectorAll('#view-impresiones .step').forEach(el => {
    const s = parseInt(el.dataset.step, 10);
    el.classList.toggle('active', s === n);
    el.classList.toggle('done', s < n);
  });
  const navRow = document.getElementById('impNavRow');
  const channelRow = document.getElementById('impChannelRow');
  if (n === 4) {
    renderImpresionesReview();
    navRow.style.display = 'none';
    channelRow.style.display = 'flex';
  } else {
    navRow.style.display = 'flex';
    channelRow.style.display = 'none';
  }
  updateImpresionesNextBtn();
}
function impresionesNext() { if (impresionesState.step < 4) goImpStep(impresionesState.step + 1); }
function impresionesBack() { if (impresionesState.step > 1) goImpStep(impresionesState.step - 1); else goToCatalog(); }
function startImpresiones() {
  impresionesState = { acabado: null, size: null, qty: 1, step: 1 };
  renderImpresionesAcabadoGrid();
  renderImpresionesSizeGrid();
  renderImpresionesQty();
  renderImpMemberStatus();
  goImpStep(1);
  showView('view-impresiones');
}
function submitImpresiones(channel) {
  const size = printSizes.find(s => s.id === impresionesState.size);
  const unit = unitPriceImpresiones();
  const total = unit * impresionesState.qty;
  const lines = [
    `Acabado: ${impresionesState.acabado === 'montada' ? 'Montada en tablilla' : 'Foto suelta'}`,
    `Tamaño: ${size.label}`,
    `Cantidad: ${impresionesState.qty}`,
  ];
  if (memberApplied) lines.push('Código de fotógrafo aplicado ✅ (verificar)');
  sendOrder(channel, 'Impresión', lines, total);
}

/* ============================================================
   CUADRO FLOW (con marco)
   Pasos: 1 Opción, 2 Cantidad, 3 Confirmar
   ============================================================ */
let cuadroState = { option: null, qty: 1, step: 1 };

function renderCuadroOptionGrid() {
  document.getElementById('cuadroOptionGrid').innerHTML = cuadroOptions.map(o => `
    <div class="opt-card ${cuadroState.option === o.id ? 'selected' : ''}" onclick="selectCuadroOption('${o.id}')">
      <b>${o.size} — ${o.tipo}</b><span>${money(o.price)} c/u</span>
    </div>`).join('');
}
function selectCuadroOption(id) { cuadroState.option = id; renderCuadroOptionGrid(); updateCuadroNextBtn(); }

function renderCuadroQty() {
  renderQtyStepper('cuadroQtyStepper', cuadroState.qty, (delta) => {
    cuadroState.qty = Math.max(1, cuadroState.qty + delta);
    renderCuadroQty();
  });
}

function renderCuadroReview() {
  const opt = cuadroOptions.find(o => o.id === cuadroState.option);
  const total = opt.price * cuadroState.qty;
  document.getElementById('cuadroReview').innerHTML = `
    <div class="review-row"><span>Cuadro</span><b>${opt.size} — ${opt.tipo}</b></div>
    <div class="review-row"><span>Cantidad</span><b>${cuadroState.qty}</b></div>
    <div class="review-row"><span>Total estimado</span><b>${money(total)}</b></div>
  `;
}

function updateCuadroNextBtn() {
  const btn = document.getElementById('cuadroNextBtn');
  if (!btn) return;
  btn.disabled = cuadroState.step === 1 ? !cuadroState.option : false;
}

function goCuadroStep(n) {
  cuadroState.step = n;
  document.querySelectorAll('#view-cuadro .fstep').forEach(el => el.style.display = 'none');
  document.querySelector(`#view-cuadro .fstep[data-istep="${n}"]`).style.display = 'block';
  document.querySelectorAll('#view-cuadro .step').forEach(el => {
    const s = parseInt(el.dataset.step, 10);
    el.classList.toggle('active', s === n);
    el.classList.toggle('done', s < n);
  });
  const navRow = document.getElementById('cuadroNavRow');
  const channelRow = document.getElementById('cuadroChannelRow');
  if (n === 3) {
    renderCuadroReview();
    navRow.style.display = 'none';
    channelRow.style.display = 'flex';
  } else {
    navRow.style.display = 'flex';
    channelRow.style.display = 'none';
  }
  updateCuadroNextBtn();
}
function cuadroNext() { if (cuadroState.step < 3) goCuadroStep(cuadroState.step + 1); }
function cuadroBack() { if (cuadroState.step > 1) goCuadroStep(cuadroState.step - 1); else goToCatalog(); }
function startCuadro() {
  cuadroState = { option: null, qty: 1, step: 1 };
  renderCuadroOptionGrid();
  renderCuadroQty();
  goCuadroStep(1);
  showView('view-cuadro');
}
function submitCuadro(channel) {
  const opt = cuadroOptions.find(o => o.id === cuadroState.option);
  const total = opt.price * cuadroState.qty;
  const lines = [
    `Cuadro: ${opt.size} — ${opt.tipo}`,
    `Cantidad: ${cuadroState.qty}`,
  ];
  sendOrder(channel, 'Cuadro', lines, total);
}

/* ============================================================
   FOTOS ID FLOW
   Se toman en el local — no hay fotos que mandar, así que el flujo
   es más corto: 1 Tipo de foto, 2 Confirmar/agendar (sin cantidad).
   ============================================================ */
let idPhotoState = { tipo: null, step: 1 };

function renderIdPhotoGrid() {
  document.getElementById('idPhotoGrid').innerHTML = idPhotoTypes.map(t => `
    <div class="opt-card ${idPhotoState.tipo === t.id ? 'selected' : ''}" onclick="selectIdPhotoType('${t.id}')">
      <b>${t.label}</b><span>${t.desc} — ${money(t.price)}</span>
    </div>`).join('');
}
function selectIdPhotoType(id) { idPhotoState.tipo = id; renderIdPhotoGrid(); updateIdPhotoNextBtn(); }

function renderIdPhotoReview() {
  const tipo = idPhotoTypes.find(t => t.id === idPhotoState.tipo);
  document.getElementById('idPhotoReview').innerHTML = `
    <div class="review-row"><span>Tipo de foto</span><b>${tipo.label}</b></div>
    <div class="review-row"><span>Incluye</span><b>${tipo.desc}</b></div>
    <div class="review-row"><span>Precio</span><b>${money(tipo.price)}</b></div>
  `;
}

function updateIdPhotoNextBtn() {
  const btn = document.getElementById('idPhotoNextBtn');
  if (!btn) return;
  btn.disabled = idPhotoState.step === 1 ? !idPhotoState.tipo : false;
}

function goIdPhotoStep(n) {
  idPhotoState.step = n;
  document.querySelectorAll('#view-fotosid .fstep').forEach(el => el.style.display = 'none');
  document.querySelector(`#view-fotosid .fstep[data-istep="${n}"]`).style.display = 'block';
  document.querySelectorAll('#view-fotosid .step').forEach(el => {
    const s = parseInt(el.dataset.step, 10);
    el.classList.toggle('active', s === n);
    el.classList.toggle('done', s < n);
  });
  const navRow = document.getElementById('idPhotoNavRow');
  const channelRow = document.getElementById('idPhotoChannelRow');
  if (n === 2) {
    renderIdPhotoReview();
    navRow.style.display = 'none';
    channelRow.style.display = 'flex';
  } else {
    navRow.style.display = 'flex';
    channelRow.style.display = 'none';
  }
  updateIdPhotoNextBtn();
}
function idPhotoNext() { if (idPhotoState.step < 2) goIdPhotoStep(idPhotoState.step + 1); }
function idPhotoBack() { if (idPhotoState.step > 1) goIdPhotoStep(idPhotoState.step - 1); else goToCatalog(); }
function startIdPhoto() {
  idPhotoState = { tipo: null, step: 1 };
  renderIdPhotoGrid();
  goIdPhotoStep(1);
  showView('view-fotosid');
}
function submitIdPhoto(channel) {
  const tipo = idPhotoTypes.find(t => t.id === idPhotoState.tipo);
  const lines = [
    `Tipo de foto: ${tipo.label} (${tipo.desc})`,
    'Esta foto se toma en el local — quiero saber qué día puedo pasar.',
  ];
  sendOrder(channel, 'Foto ID', lines, tipo.price);
}

/* ============================================================
   PHOTO STACK (hero) — arrastrar las fotos con mouse o dedo
   Cada tarjeta ya tiene una posición base en el CSS (.pc-1/.pc-2/.pc-3) y
   una animación de "flotar" sola. Aquí solo agregamos: al agarrarla con
   el mouse/dedo, se pausa esa animación y la tarjeta sigue al puntero; al
   soltarla, se queda donde la dejaron y vuelve a flotar desde ahí.
   Si algún día quitan este bloque completo, el sitio sigue funcionando
   igual — las fotos solo dejan de poder arrastrarse.
   ============================================================ */
function initPhotoStackDrag() {
  const stack = document.getElementById('photoStack');
  if (!stack) return;

  stack.querySelectorAll('.photo-card').forEach(card => {
    let dragging = false;
    let startX = 0, startY = 0;      // dónde empezó el arrastre (puntero)
    let cardX = 0, cardY = 0;        // desplazamiento acumulado de la tarjeta

    card.addEventListener('pointerdown', (e) => {
      dragging = true;
      card.classList.add('dragging');
      card.style.zIndex = 10; // la que estás moviendo siempre queda arriba
      card.setPointerCapture(e.pointerId);
      startX = e.clientX;
      startY = e.clientY;
    });

    card.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      card.style.translate = `${cardX + dx}px ${cardY + dy}px`;
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      card.classList.remove('dragging');
      cardX += e.clientX - startX;
      cardY += e.clientY - startY;
    }
    card.addEventListener('pointerup', endDrag);
    card.addEventListener('pointercancel', endDrag);
  });
}

/* ============================================================
   VISTA PREVIA "CÓMO SE VERÍA EN TU PARED"
   Herramienta de solo diseño — no manda nada a ningún lado. FileReader lee
   la foto directo del disco del cliente y la muestra en su propio navegador;
   nunca toca un servidor, ni el nuestro ni de nadie más.
   ============================================================ */
function startWallPreview() {
  document.getElementById('previewSecNum').textContent = 'CUADRO';
  setWallFrameType('delgado'); // siempre arranca en "delgado"
  showView('view-preview');
}

// Cambia el acabado en la vista previa: 'delgado' y 'grueso' son los 2 tipos
// de marco (según las fotos de muestra que dio David), y 'bastidor' es el
// canto sin marco — los 3 son ahora opciones del mismo producto (Cuadro).
function setWallFrameType(type) {
  const frame = document.getElementById('wallFrame');
  frame.classList.remove('wall-frame-delgado', 'wall-frame-grueso', 'wall-frame-bastidor');
  frame.classList.add(`wall-frame-${type}`);

  const delgadoBtn = document.getElementById('frameTypeDelgadoBtn');
  const gruesoBtn = document.getElementById('frameTypeGruesoBtn');
  const bastidorBtn = document.getElementById('frameTypeBastidorBtn');
  if (delgadoBtn && gruesoBtn && bastidorBtn) {
    delgadoBtn.classList.toggle('active', type === 'delgado');
    gruesoBtn.classList.toggle('active', type === 'grueso');
    bastidorBtn.classList.toggle('active', type === 'bastidor');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const wallInput = document.getElementById('wallPreviewInput');
  if (wallInput) {
    wallInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = document.getElementById('wallFrameImg');
        const placeholder = document.getElementById('wallFramePlaceholder');
        img.src = ev.target.result; // data URL — vive solo en memoria del navegador
        img.style.display = 'block';
        placeholder.style.display = 'none';
      };
      reader.readAsDataURL(file);
    });
  }
});

/* ============================================================
   PÓSTUMAS (Homenaje Póstumo)
   Pasos: 1 Paquete (cantidad de esquelas), 2 Tamaño de foto grande, 3 Confirmar
   El precio depende de la combinación paquete × tamaño (postumasPackages).
   El diseño de la esquela en sí se coordina aparte, por WhatsApp/correo.
   ============================================================ */
let postumasState = { pack: null, size: null, step: 1 };

function renderPostumasPackGrid() {
  document.getElementById('postumasPackGrid').innerHTML = postumasPackages.map(p => {
    const minPrice = Math.min(...Object.values(p.prices));
    return `
    <div class="opt-card ${postumasState.pack === p.id ? 'selected' : ''}" onclick="selectPostumasPack('${p.id}')">
      <b>${p.qty} esquelas</b><span>Desde ${money(minPrice)}</span>
    </div>`;
  }).join('');
}
function selectPostumasPack(id) {
  postumasState.pack = id;
  renderPostumasPackGrid();
  renderPostumasSizeGrid();
  updatePostumasNextBtn();
}

function renderPostumasSizeGrid() {
  const pack = postumasPackages.find(p => p.id === postumasState.pack);
  document.getElementById('postumasSizeGrid').innerHTML = postumasSizes.map(s => `
    <div class="opt-card ${postumasState.size === s.id ? 'selected' : ''}" onclick="selectPostumasSize('${s.id}')">
      <b>${s.label}</b><span>${pack ? money(pack.prices[s.id]) : ''}</span>
    </div>`).join('');
}
function selectPostumasSize(id) { postumasState.size = id; renderPostumasSizeGrid(); updatePostumasNextBtn(); }

function postumasPrice() {
  const pack = postumasPackages.find(p => p.id === postumasState.pack);
  if (!pack || !postumasState.size) return 0;
  return pack.prices[postumasState.size];
}

function renderPostumasReview() {
  const pack = postumasPackages.find(p => p.id === postumasState.pack);
  const size = postumasSizes.find(s => s.id === postumasState.size);
  document.getElementById('postumasReview').innerHTML = `
    <div class="review-row"><span>Paquete</span><b>${pack.qty} esquelas</b></div>
    <div class="review-row"><span>Foto grande</span><b>${size.label}</b></div>
    <div class="review-row"><span>Total estimado</span><b>${money(postumasPrice())}</b></div>
  `;
}

function updatePostumasNextBtn() {
  const btn = document.getElementById('postumasNextBtn');
  if (!btn) return;
  if (postumasState.step === 1) btn.disabled = !postumasState.pack;
  else if (postumasState.step === 2) btn.disabled = !postumasState.size;
  else btn.disabled = false;
}

function goPostumasStep(n) {
  postumasState.step = n;
  document.querySelectorAll('#view-postumas .fstep').forEach(el => el.style.display = 'none');
  document.querySelector(`#view-postumas .fstep[data-istep="${n}"]`).style.display = 'block';
  document.querySelectorAll('#view-postumas .step').forEach(el => {
    const s = parseInt(el.dataset.step, 10);
    el.classList.toggle('active', s === n);
    el.classList.toggle('done', s < n);
  });
  const navRow = document.getElementById('postumasNavRow');
  const channelRow = document.getElementById('postumasChannelRow');
  if (n === 3) {
    renderPostumasReview();
    navRow.style.display = 'none';
    channelRow.style.display = 'flex';
  } else {
    navRow.style.display = 'flex';
    channelRow.style.display = 'none';
  }
  updatePostumasNextBtn();
}
function postumasNext() { if (postumasState.step < 3) goPostumasStep(postumasState.step + 1); }
function postumasBack() { if (postumasState.step > 1) goPostumasStep(postumasState.step - 1); else goToCatalog(); }
function startPostumas() {
  postumasState = { pack: null, size: null, step: 1 };
  renderPostumasPackGrid();
  renderPostumasSizeGrid();
  goPostumasStep(1);
  showView('view-postumas');
}
function submitPostumas(channel) {
  const pack = postumasPackages.find(p => p.id === postumasState.pack);
  const size = postumasSizes.find(s => s.id === postumasState.size);
  const total = postumasPrice();
  const lines = [
    `Paquete: ${pack.qty} esquelas`,
    `Foto grande: ${size.label}`,
    'Nota: quiero ver las opciones de diseño para la esquela.',
  ];
  sendOrder(channel, 'Homenaje Póstumo', lines, total);
}

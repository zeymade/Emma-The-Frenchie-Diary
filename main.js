// Bewegung für die Landingpage. Läuft nur, wenn <html> die Klasse „motion“ trägt
// (gesetzt im <head>, nur ohne „Bewegung reduzieren“). Ohne JS bleibt alles sichtbar.
(() => {
  const root = document.documentElement;
  if (!root.classList.contains('motion')) return;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // ── Überschriften in Wörter zerlegen (Masken-Reveal) ───────────────
  const split = (el, cls) => {
    let i = 0;
    const walk = node => {
      for (const n of [...node.childNodes]) {
        if (n.nodeType === 1) { walk(n); continue; }
        if (n.nodeType !== 3 || !n.textContent.trim()) continue;
        const frag = document.createDocumentFragment();
        for (const part of n.textContent.split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) { frag.append(' '); continue; }
          const w = document.createElement('span');
          w.className = cls;
          w.innerHTML = cls === 'w' ? '<span></span>' : '';
          (w.firstChild || w).textContent = part;
          w.style.setProperty('--wi', i++);
          frag.append(w);
        }
        n.replaceWith(frag);
      }
    };
    walk(el);
    return i;
  };
  document.querySelectorAll('[data-split]').forEach(el => {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    split(el, 'w');
    [...el.children].forEach(c => c.setAttribute('aria-hidden', 'true'));
  });

  // ── Einblenden beim Scrollen, gestaffelt pro Schub ─────────────────
  const io = new IntersectionObserver(entries => {
    entries.filter(e => e.isIntersecting).forEach((e, n) => {
      if (!e.target.style.getPropertyValue('--d')) e.target.style.setProperty('--d', `${n * 80}ms`);
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('[data-reveal], [data-split], .peek, .points').forEach(el => io.observe(el));

  // ── Scroll-gekoppelt: Emma taucht ab, Ziffern-Parallax, Text füllt sich ─
  const emma = document.querySelector('.emma');
  const nums = [...document.querySelectorAll('[data-parallax]')];
  const statement = document.querySelector('[data-scrub]');
  const words = statement ? (split(statement, 'sw'), [...statement.querySelectorAll('.sw')]) : [];
  let mx = 0, tilt = 0, ticking = false;

  const frame = () => {
    ticking = false;
    const vh = innerHeight;
    if (emma) {
      const r = emma.parentElement.getBoundingClientRect();
      const sink = clamp(1 - r.bottom / (vh * .9), 0, 1);           // 0 = ganz da, 1 = hinter der Linie
      tilt += (mx * 5 - tilt) * .12;                                  // weich nachziehen
      emma.style.transform = `translateY(${sink * 70}%) rotate(${tilt.toFixed(2)}deg)`;
      if (Math.abs(mx * 5 - tilt) > .02) request();
    }
    for (const el of nums) {
      const r = el.getBoundingClientRect();
      const p = (r.top + r.height / 2 - vh / 2) / vh;                 // -0.5 … 0.5 um die Mitte
      el.style.transform = `translateY(${(p * +el.dataset.parallax).toFixed(1)}px)`;
    }
    if (statement) {
      const r = statement.getBoundingClientRect();
      const p = clamp((vh * .85 - r.top) / (vh * .4 + r.height / 2), 0, 1) * words.length;  // voll, wenn die Mitte bei 45 % steht
      words.forEach((w, i) => { w.style.opacity = clamp(p - i, .14, 1); });
    }
  };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  request();

  // ── Nur mit Maus: Cursor, magnetische Buttons, Emma schaut zum Zeiger ─
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  root.classList.add('has-cursor');
  const dot = Object.assign(document.createElement('div'), { className: 'cursor', ariaHidden: 'true' });
  document.body.append(dot);
  let x = -100, y = -100, cx = x, cy = y;
  const follow = () => {
    cx += (x - cx) * .2; cy += (y - cy) * .2;
    dot.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(follow);
  };
  follow();
  addEventListener('pointermove', e => {
    x = e.clientX; y = e.clientY;
    mx = clamp(x / innerWidth * 2 - 1, -1, 1);
    dot.classList.toggle('is-link', !!e.target.closest('a, button'));
    request();
  }, { passive: true });
  document.addEventListener('pointerleave', () => { x = y = -100; });

  document.querySelectorAll('.btn').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      b.style.translate = `${(e.clientX - r.left - r.width / 2) * .18}px ${(e.clientY - r.top - r.height / 2) * .3}px`;
    });
    b.addEventListener('pointerleave', () => { b.style.translate = ''; });
  });
})();

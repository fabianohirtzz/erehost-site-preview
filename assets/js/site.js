/* EreHost: interações do site público (sem dependências) */
(() => {
  'use strict';
  const doc = document.documentElement;
  doc.classList.add('js');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- dock: encolhe ao rolar ---------- */
  const dock = $('[data-dock]');
  if (dock) {
    const aoRolar = () => dock.classList.toggle('is-rolado', scrollY > 40);
    addEventListener('scroll', aoRolar, { passive: true });
    aoRolar();
  }

  /* ---------- indicador deslizante do menu ---------- */
  const nav = $('[data-dock-menu]');
  const ind = $('[data-indicador]');
  if (nav && ind) {
    const links = $$('.dock__link', nav);
    const move = (el) => {
      if (!el) { ind.style.opacity = '0'; return; }
      const a = el.getBoundingClientRect(), b = nav.getBoundingClientRect();
      ind.style.width = a.width + 'px';
      ind.style.transform = `translateX(${a.left - b.left}px)`;
      ind.style.opacity = '1';
    };
    const ativo = () => links.find((l) => l.getAttribute('aria-expanded') === 'true') || links.find((l) => l.hasAttribute('aria-current'));
    links.forEach((l) => {
      l.addEventListener('mouseenter', () => move(l));
      l.addEventListener('focus', () => move(l));
    });
    nav.addEventListener('mouseleave', () => move(ativo()));
    nav.addEventListener('focusout', (e) => { if (!nav.contains(e.relatedTarget)) move(ativo()); });
    addEventListener('resize', () => move(ativo()));
    requestAnimationFrame(() => move(ativo()));
    nav.__move = () => move(ativo());
  }

  /* ---------- mega menu ---------- */
  const megaBtn = $('[data-mega-botao]');
  const mega = $('[data-mega]');
  if (megaBtn && mega) {
    const item = megaBtn.parentElement;
    let timer;
    const abrir = () => {
      clearTimeout(timer);
      if (megaBtn.getAttribute('aria-expanded') === 'true') return;
      mega.hidden = false;
      megaBtn.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => mega.classList.add('is-aberto'));
    };
    const fechar = (imediato) => {
      clearTimeout(timer);
      const fn = () => {
        megaBtn.setAttribute('aria-expanded', 'false');
        mega.classList.remove('is-aberto');
        setTimeout(() => { if (megaBtn.getAttribute('aria-expanded') === 'false') mega.hidden = true; }, 220);
        nav && nav.__move && nav.__move();
      };
      imediato ? fn() : (timer = setTimeout(fn, 150));
    };
    const temHover = matchMedia('(hover: hover)').matches;
    if (temHover) {
      item.addEventListener('mouseenter', abrir);
      item.addEventListener('mouseleave', () => fechar(false));
    }
    megaBtn.addEventListener('click', () => (megaBtn.getAttribute('aria-expanded') === 'true' ? fechar(true) : abrir()));
    megaBtn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); abrir(); $('a', mega).focus(); }
    });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { fechar(true); megaBtn.focus(); }
    });
    item.addEventListener('focusout', (e) => { if (!item.contains(e.relatedTarget)) fechar(true); });
    document.addEventListener('click', (e) => { if (!item.contains(e.target)) fechar(true); });
  }

  /* ---------- gaveta mobile ---------- */
  const gaveta = $('[data-gaveta]');
  const abrirG = $('[data-gaveta-abrir]');
  if (gaveta && abrirG) {
    const painel = $('.gaveta__painel', gaveta);
    let ultimoFoco;
    const focaveis = () => $$('a[href],button:not([disabled])', painel);
    const abrir = () => {
      ultimoFoco = document.activeElement;
      gaveta.hidden = false;
      abrirG.setAttribute('aria-expanded', 'true');
      doc.style.overflow = 'hidden';
      requestAnimationFrame(() => { gaveta.classList.add('is-aberta'); painel.focus(); });
    };
    const fechar = () => {
      gaveta.classList.remove('is-aberta');
      abrirG.setAttribute('aria-expanded', 'false');
      doc.style.overflow = '';
      setTimeout(() => { gaveta.hidden = true; }, reduz ? 0 : 380);
      ultimoFoco && ultimoFoco.focus();
    };
    abrirG.addEventListener('click', abrir);
    $$('[data-gaveta-fechar]', gaveta).forEach((b) => b.addEventListener('click', fechar));
    $$('.gaveta__produtos a, .gaveta__links a', gaveta).forEach((a) => a.addEventListener('click', () => { if (a.getAttribute('href').startsWith('/#')) fechar(); }));
    gaveta.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') fechar();
      if (e.key === 'Tab') {
        const f = focaveis(), p = f[0], u = f[f.length - 1];
        if (e.shiftKey && document.activeElement === p) { e.preventDefault(); u.focus(); }
        else if (!e.shiftKey && document.activeElement === u) { e.preventDefault(); p.focus(); }
      }
    });
    // arrastar para baixo fecha
    let y0 = null;
    painel.addEventListener('touchstart', (e) => { if (painel.scrollTop === 0) y0 = e.touches[0].clientY; }, { passive: true });
    painel.addEventListener('touchmove', (e) => {
      if (y0 === null) return;
      const dy = e.touches[0].clientY - y0;
      if (dy > 0) painel.style.transform = `translateY(${dy}px)`;
    }, { passive: true });
    painel.addEventListener('touchend', (e) => {
      if (y0 === null) return;
      const dy = e.changedTouches[0].clientY - y0;
      painel.style.transform = '';
      y0 = null;
      if (dy > 90) fechar();
    });
  }

  /* ---------- abas (padrão ARIA tabs) ---------- */
  $$('[data-abas]').forEach((lista) => {
    const abas = $$('[role="tab"]', lista);
    const ind = $('.abas__indicador', lista);
    const moveInd = (a) => {
      if (!ind) return;
      ind.style.width = a.offsetWidth + 'px';
      ind.style.transform = `translateX(${a.offsetLeft}px)`;
    };
    const seleciona = (aba, focar) => {
      abas.forEach((a) => {
        const sel = a === aba;
        a.setAttribute('aria-selected', String(sel));
        a.tabIndex = sel ? 0 : -1;
        const painel = document.getElementById(a.getAttribute('aria-controls'));
        if (painel) painel.hidden = !sel;
      });
      moveInd(aba);
      if (focar) aba.focus();
      const painel = document.getElementById(aba.getAttribute('aria-controls'));
      painel && $$('[data-carrossel]', painel).forEach((c) => c.__atualiza && c.__atualiza());
    };
    abas.forEach((a, i) => {
      a.addEventListener('click', () => seleciona(a));
      a.addEventListener('keydown', (e) => {
        let n = null;
        if (e.key === 'ArrowRight') n = abas[(i + 1) % abas.length];
        if (e.key === 'ArrowLeft') n = abas[(i - 1 + abas.length) % abas.length];
        if (e.key === 'Home') n = abas[0];
        if (e.key === 'End') n = abas[abas.length - 1];
        if (n) { e.preventDefault(); seleciona(n, true); }
      });
    });
    const atual = abas.find((a) => a.getAttribute('aria-selected') === 'true') || abas[0];
    requestAnimationFrame(() => moveInd(atual));
    addEventListener('resize', () => moveInd(abas.find((a) => a.getAttribute('aria-selected') === 'true')));
    document.fonts && document.fonts.ready.then(() => moveInd(abas.find((a) => a.getAttribute('aria-selected') === 'true')));
  });

  /* ---------- carrossel ---------- */
  $$('[data-carrossel]').forEach((c) => {
    const trilho = $('.carrossel__trilho', c);
    const [ant, prox] = $$('.carrossel__seta', c);
    const atualiza = () => {
      const rola = trilho.scrollWidth > trilho.clientWidth + 4;
      c.classList.toggle('tem-rolagem', rola);
      ant.disabled = trilho.scrollLeft <= 4;
      prox.disabled = trilho.scrollLeft + trilho.clientWidth >= trilho.scrollWidth - 4;
    };
    const passo = () => (trilho.firstElementChild ? trilho.firstElementChild.getBoundingClientRect().width + 20 : 300);
    [ant, prox].forEach((b) => b.addEventListener('click', () => trilho.scrollBy({ left: passo() * Number(b.dataset.dir), behavior: reduz ? 'auto' : 'smooth' })));
    trilho.addEventListener('scroll', atualiza, { passive: true });
    addEventListener('resize', atualiza);
    c.__atualiza = atualiza;
    atualiza();
  });

  /* ---------- revelar ao rolar + contadores ---------- */
  const reveals = $$('.revela');
  const grupos = new Map();
  reveals.forEach((el) => {
    const pai = el.parentElement;
    const i = grupos.get(pai) || 0;
    el.style.setProperty('--atraso', `${Math.min(i, 6) * 70}ms`);
    grupos.set(pai, i + 1);
  });
  const conta = (el) => {
    const fim = Number(el.dataset.conta), suf = el.dataset.sufixo || '';
    if (reduz) return;
    const t0 = performance.now(), dur = 1200;
    const passo = (t) => {
      const p = Math.min(1, (t - t0) / dur), v = Math.round(fim * (1 - Math.pow(1 - p, 3)));
      el.textContent = v + suf;
      if (p < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-visivel');
      $$('[data-conta]', en.target).forEach(conta);
      io.unobserve(en.target);
    }), { rootMargin: '0px 0px -8% 0px', threshold: .12 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visivel'));
  }

  /* ---------- banner promocional: fechar ---------- */
  const promo = $('[data-promo]');
  if (promo) {
    const chave = 'erehost-promo-' + promo.dataset.promo;
    try { if (localStorage.getItem(chave)) promo.remove(); } catch (e) { /* sem storage */ }
    const x = $('.promo__fechar', promo);
    x && x.addEventListener('click', () => {
      promo.remove();
      try { localStorage.setItem(chave, '1'); } catch (e) { /* sem storage */ }
    });
  }
})();

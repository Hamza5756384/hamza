(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const header = $('#siteHeader');
  const progress = $('#pageProgress');
  const menuToggle = $('#menuToggle');
  const mainNav = $('#mainNav');
  const heroStage = $('#heroStage');
  const heroLaptop = $('#heroLaptop');

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  function updateScrollUI() {
    const y = window.scrollY;
    header?.classList.toggle('scrolled', y > 24);

    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? y / max : 0;
    if (progress) progress.style.width = `${ratio * 100}%`;

    if (!reducedMotion && heroLaptop && y < window.innerHeight * 1.2) {
      const p = clamp(y / window.innerHeight, 0, 1);
      heroLaptop.style.transform = `rotateX(${9 + p * 5}deg) rotateY(${-11 + p * 10}deg) rotateZ(${1 - p}deg) scale(${1 - p * .08}) translateY(${p * 35}px)`;
    }
  }

  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        updateScrollUI();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });
  updateScrollUI();

  menuToggle?.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
    mainNav?.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
  });

  $$('#mainNav a').forEach(link => link.addEventListener('click', () => {
    menuToggle?.setAttribute('aria-expanded', 'false');
    mainNav?.classList.remove('open');
    document.body.classList.remove('menu-open');
  }));

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(el => revealObserver.observe(el));

  const counted = new WeakSet();
  function animateCounter(el) {
    if (counted.has(el)) return;
    counted.add(el);
    const target = Number(el.dataset.count);
    const decimals = String(target).includes('.') ? 2 : 0;
    const duration = reducedMotion ? 0 : 1200;
    const start = performance.now();
    const step = now => {
      const t = duration === 0 ? 1 : clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) animateCounter(entry.target);
    });
  }, { threshold: .7 });
  $$('[data-count]').forEach(el => counterObserver.observe(el));

  if (!reducedMotion && heroStage && heroLaptop) {
    heroStage.addEventListener('pointermove', event => {
      const rect = heroStage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      const scrollP = clamp(window.scrollY / window.innerHeight, 0, 1);
      heroLaptop.style.transform = `rotateX(${9 - y * 8 + scrollP * 5}deg) rotateY(${-11 + x * 12 + scrollP * 10}deg) rotateZ(${1 - x * 2}deg) scale(${1 - scrollP * .08})`;
    });
    heroStage.addEventListener('pointerleave', () => updateScrollUI());
  }

  const storyDevice = $('#storyDevice');
  const stageNumber = $('#stageNumber');
  const stageIndex = $('.stage-index');
  const steps = $$('.story-step');

  const storyObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const stage = Number(entry.target.dataset.stage);
        steps.forEach(step => step.classList.toggle('is-active', step === entry.target));
        storyDevice?.setAttribute('data-stage', String(stage));
        if (stageNumber) stageNumber.textContent = String(stage + 1).padStart(2, '0');
        stageIndex?.style.setProperty('--stage-progress', String((stage + 1) / steps.length));
        if (!reducedMotion && storyDevice) {
          const rotations = [
            'rotateX(3deg) rotateY(-7deg)',
            'rotateX(7deg) rotateY(8deg) scale(.98)',
            'rotateX(12deg) rotateY(-4deg) scale(.96)',
            'rotateX(2deg) rotateY(5deg) scale(1.02)'
          ];
          storyDevice.style.transform = rotations[stage];
        }
      }
    });
  }, { threshold: .55, rootMargin: '-10% 0px -25% 0px' });
  steps.forEach(step => storyObserver.observe(step));

  const colorLab = $('#colorLab');
  const colorName = $('#colorName');
  const colorDesc = $('#colorDesc');
  $$('.swatch').forEach(swatch => swatch.addEventListener('click', () => {
    $$('.swatch').forEach(btn => {
      btn.classList.toggle('active', btn === swatch);
      btn.setAttribute('aria-pressed', String(btn === swatch));
    });
    colorLab?.setAttribute('data-color', swatch.dataset.color || 'graphite');
    if (colorName) colorName.textContent = swatch.dataset.name || '';
    if (colorDesc) colorDesc.textContent = swatch.dataset.desc || '';
  }));

  const filterButtons = $$('.filter-tabs button');
  const productCards = $$('.product-card');
  filterButtons.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filterButtons.forEach(btn => {
      const active = btn === button;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    productCards.forEach(card => {
      const show = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('is-hidden', !show);
    });
  }));

  const form = $('#recommendForm');
  const formMessage = $('#formMessage');
  form?.addEventListener('submit', event => {
    event.preventDefault();
    const email = $('#email')?.value.trim();
    if (!email) return;
    if (formMessage) formMessage.textContent = 'تم استلام طلبك — سنرسل التوصية المناسبة قريبًا.';
    form.reset();
  });

  const filmModal = $('#filmModal');
  const openFilm = $('#openFilm');
  const closeFilm = $('#closeFilm');
  openFilm?.addEventListener('click', () => {
    if (typeof filmModal?.showModal === 'function') {
      filmModal.showModal();
      document.body.classList.add('modal-open');
    }
  });
  const closeModal = () => {
    filmModal?.close();
    document.body.classList.remove('modal-open');
  };
  closeFilm?.addEventListener('click', closeModal);
  filmModal?.addEventListener('click', event => {
    if (event.target === filmModal) closeModal();
  });
  filmModal?.addEventListener('close', () => document.body.classList.remove('modal-open'));

  function initAmbientCanvas() {
    const canvas = $('#ambientCanvas');
    if (!canvas || reducedMotion) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(70, Math.max(28, Math.floor(width / 22)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.6 + .3,
        vx: (Math.random() - .5) * .11,
        vy: (Math.random() - .5) * .08,
        a: Math.random() * .45 + .08
      }));
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;
        ctx.beginPath();
        ctx.fillStyle = `rgba(170,190,255,${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(render);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    requestAnimationFrame(render);
  }
  initAmbientCanvas();
})();

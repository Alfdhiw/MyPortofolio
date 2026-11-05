(() => {
  'use strict';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 768px)');
  const duration = name => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 320;
  const ease = 'cubic-bezier(.22,1,.36,1)';
  document.documentElement.classList.add('is-enhanced');
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    document.getAnimations?.().forEach(animation => {
      try { animation.finish(); } catch { animation.cancel(); }
    });
  });

  function entrance(element, delay = 0, distance = 20, ms = 600) {
    if (!element || reducedMotion.matches || !element.animate) return;
    return element.animate([{ opacity: 0, transform: 'translateY(' + distance + 'px)' }, { opacity: 1, transform: 'translateY(0)' }], {
      duration: ms, delay, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards'
    });
  }
  function initNavigation() {
    const menu = document.querySelector('.menu-button'), nav = document.querySelector('.primary-nav');
    if (!menu || !nav) return;
    menu.hidden = false;
    function close(restoreFocus = false) {
      menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open');
      if (restoreFocus) menu.focus();
    }
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', event => { if (event.target.closest('a')) close(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('is-open')) close(true); });
    document.addEventListener('click', event => { if (!event.target.closest('.site-header')) close(); });
    nav.addEventListener('focusout', event => { if (!nav.contains(event.relatedTarget) && event.relatedTarget !== menu) close(); });
    matchMedia('(min-width: 900px)').addEventListener('change', () => close());
    const aliases = { '#projects': '#work', '#services': '#service', '#about': '#experience' };
    if (aliases[location.hash]) {
      history.replaceState(null, '', aliases[location.hash]);
      document.querySelector(location.hash)?.scrollIntoView();
    }
  }
  function initPortraitReveal() {
    const portrait = document.querySelector('.hero-portrait');
    const original = portrait?.querySelector('.portrait-image');
    if (!original || !(CSS.supports('mask-image', 'radial-gradient(black, transparent)') || CSS.supports('-webkit-mask-image', 'radial-gradient(black, transparent)'))) return;
    let overlay = null, frame = 0, point = null;
    const allowed = () => finePointer.matches && !reducedMotion.matches;
    function reset() {
      cancelAnimationFrame(frame); frame = 0; point = null;
      portrait.classList.remove('is-color-revealed');
    }
    function update() {
      frame = 0;
      if (!point || !allowed()) { reset(); return; }
      const rect = portrait.getBoundingClientRect();
      const x = point.x - rect.left, y = point.y - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) { reset(); return; }
      if (!overlay) {
        overlay = original.cloneNode(false);
        overlay.classList.add('portrait-color-reveal');
        overlay.removeAttribute('id'); overlay.removeAttribute('fetchpriority');
        overlay.alt = ''; overlay.setAttribute('aria-hidden', 'true');
        overlay.draggable = false; overlay.loading = 'eager';
        overlay.addEventListener('error', reset);
        portrait.append(overlay);
      }
      portrait.style.setProperty('--portrait-reveal-x', x.toFixed(2) + 'px');
      portrait.style.setProperty('--portrait-reveal-y', y.toFixed(2) + 'px');
      portrait.classList.add('is-color-revealed');
    }
    function move(event) {
      if ((event.pointerType !== 'mouse' && event.pointerType !== 'pen') || !allowed()) { reset(); return; }
      point = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(update);
    }
    portrait.addEventListener('pointerenter', move, { passive: true });
    portrait.addEventListener('pointermove', move, { passive: true });
    portrait.addEventListener('pointerleave', reset);
    portrait.addEventListener('pointercancel', reset);
    finePointer.addEventListener('change', reset);
    reducedMotion.addEventListener('change', reset);
    addEventListener('scroll', reset, { passive: true });
    addEventListener('resize', reset, { passive: true });
    addEventListener('blur', reset);
    addEventListener('pagehide', reset);
    document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  }
  function initReveal() {
    document.querySelectorAll('.service-item, .experience-row').forEach((element, index) => {
      element.classList.add('reveal');
      element.dataset.revealDelay = String((index % 3) * 70);
    });
    document.querySelectorAll('.contact-heading').forEach(group => {
      group.classList.remove('reveal');
      group.querySelectorAll('.status, h2, p, .button').forEach((element, index) => {
        element.classList.add('reveal');
        element.dataset.revealDelay = String([0, 0, 100, 180][index] || 0);
        element.dataset.revealDuration = String([300, 550, 500, 350][index] || 550);
        element.dataset.revealDistance = '18';
      });
    });
    document.querySelectorAll('.contact-social-row').forEach(group => {
      group.classList.remove('reveal');
      group.querySelectorAll('a').forEach((element, index) => {
        element.classList.add('reveal');
        element.dataset.revealDelay = String(index * 50);
      });
    });
    document.querySelectorAll('.detail-header .reveal').forEach((element, index) => { element.dataset.revealDelay = String(Math.min(index * 50, 180)); });
    document.querySelectorAll('.hero-name > span').forEach((element, index) => entrance(element, 120 + index * 70, 20));
    entrance(document.querySelector('.site-header'), 70, 12, 420);
    entrance(document.querySelector('.hero-portrait'), 180, 24, 650);
    entrance(document.querySelector('.hero-bio'), 250);
    entrance(document.querySelector('.hero-socials'), 320);
    if (!('IntersectionObserver' in window) || reducedMotion.matches) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const siblings = entry.target.parentElement?.classList.contains('work-grid');
        const index = siblings ? [...entry.target.parentElement.children].indexOf(entry.target) % 2 : 0;
        const ms = Number(entry.target.dataset.revealDuration) || (entry.target.closest('.detail-header') ? duration('--motion-route') : duration('--motion-entrance'));
        const delay = Number(entry.target.dataset.revealDelay) || index * 70;
        entrance(entry.target, delay, Number(entry.target.dataset.revealDistance) || 20, ms);
        observer.unobserve(entry.target);
      }
    }, { threshold: .18 });
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
    addEventListener('pagehide', () => observer.disconnect(), { once: true });
  }
  function initFilters() {
    const grid = document.querySelector('[data-work-grid]');
    if (!grid) return;
    const cards = [...grid.querySelectorAll('.project-card')], controls = document.querySelector('.filters');
    const buttons = [...document.querySelectorAll('[data-filter]')], viewAll = document.querySelector('[data-view-all]');
    const empty = document.querySelector('[data-empty-state]'), status = document.querySelector('.work-status');
    let currentFilter = 'all', showAll = false, generation = 0, animations = [];
    const featuredCount = cards.filter(card => card.dataset.featured === 'true').length;
    controls.hidden = false; viewAll.hidden = cards.length <= featuredCount;
    async function apply(filter, all, animate = true) {
      const token = ++generation;
      currentFilter = filter; showAll = all;
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
      animations.forEach(animation => animation.cancel()); animations = [];
      const before = new Map(cards.filter(card => !card.hidden).map(card => [card, card.getBoundingClientRect()]));
      grid.setAttribute('aria-busy', 'true');
      const matches = card => (all || card.dataset.featured === 'true') && (filter === 'all' || card.dataset.projectType === filter);
      if (animate && !reducedMotion.matches && grid.animate) {
        animations = cards.filter(card => !card.hidden && !matches(card)).map(card => card.animate([
          { opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(12px)' }
        ], { duration: 180, easing: ease }));
        await Promise.allSettled(animations.map(animation => animation.finished));
      }
      if (token !== generation) return;
      let visible = 0;
      const entering = [];
      cards.forEach(card => {
        const wasHidden = card.hidden;
        card.hidden = !matches(card);
        if (!card.hidden) {
          visible++;
          if (animate && wasHidden) {
            const animation = entrance(card, 0, 16, 300);
            if (animation) entering.push(animation);
          } else if (animate && !reducedMotion.matches && before.has(card) && card.animate) {
            const previous = before.get(card), next = card.getBoundingClientRect();
            const dx = previous.left - next.left, dy = previous.top - next.top;
            if (Math.abs(dx) + Math.abs(dy) > 1) entering.push(card.animate([
              { transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'translate(0,0)' }
            ], { duration: 300, easing: ease }));
          }
        }
      });
      animations = entering; empty.hidden = visible !== 0;
      status.textContent = String(visible).padStart(2, '0') + ' of ' + String(cards.length).padStart(2, '0') + ' projects';
      viewAll.hidden = all || visible === 0 || cards.length <= featuredCount;
      grid.setAttribute('aria-busy', 'false');
    }
    buttons.forEach(button => button.addEventListener('click', () => apply(button.dataset.filter, showAll)));
    viewAll.addEventListener('click', () => apply(currentFilter, true));
    document.querySelector('[data-reset-filter]')?.addEventListener('click', () => apply('all', false));
    let restored;
    try {
      if (performance.getEntriesByType('navigation')[0]?.type === 'back_forward') {
        restored = JSON.parse(sessionStorage.getItem('portfolio-return') || 'null');
        sessionStorage.removeItem('portfolio-return');
      }
    } catch { /* Storage is optional; native navigation still works. */ }
    apply(restored?.filter || 'all', restored?.all || false, false);
    if (restored?.scrollY) requestAnimationFrame(() => scrollTo({ top: restored.scrollY, behavior: 'instant' }));
    grid.addEventListener('click', event => {
      if (!event.target.closest('a[data-work-link]')) return;
      try { sessionStorage.setItem('portfolio-return', JSON.stringify({ filter: currentFilter, all: showAll, scrollY })); } catch { /* Optional enhancement. */ }
    });
  }
  function initServices() {
    const buttons = [...document.querySelectorAll('.service-trigger')], animations = new Map();
    function setOpen(button, open) {
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      const previousHeight = panel.hidden ? 0 : panel.getBoundingClientRect().height;
      animations.get(panel)?.cancel(); animations.delete(panel);
      button.setAttribute('aria-expanded', String(open));
      button.querySelector('.service-symbol').textContent = open ? '×' : '↗';
      panel.setAttribute('aria-hidden', String(!open)); panel.inert = !open;
      if (reducedMotion.matches || !panel.animate) { panel.hidden = !open; return; }
      panel.hidden = false;
      const endHeight = open ? panel.scrollHeight : 0;
      const animation = panel.animate({ height: [previousHeight + 'px', endHeight + 'px'] }, { duration: duration('--motion-standard'), easing: ease });
      animations.set(panel, animation);
      animation.onfinish = () => { panel.hidden = !open; animations.delete(panel); };
      if (open) panel.querySelector('.service-mockup')?.animate([
        { opacity: 0, transform: 'rotate(-3deg) scale(.96)' }, { opacity: 1, transform: 'rotate(-4deg) scale(1)' }
      ], { duration: 320, easing: ease });
    }
    buttons.forEach(button => {
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      button.setAttribute('aria-expanded', 'false'); panel.hidden = true;
      panel.setAttribute('aria-hidden', 'true'); panel.inert = true;
      button.addEventListener('click', () => {
        const open = button.getAttribute('aria-expanded') !== 'true';
        buttons.forEach(other => { if (other !== button && other.getAttribute('aria-expanded') === 'true') setOpen(other, false); });
        setOpen(button, open);
      });
    });
  }
  function initExperience() {
    const preview = document.querySelector('[data-floating-preview]');
    if (!preview) return;
    const previewImage = preview.querySelector('img');
    let frame = 0, activeRow = null, x = 0, y = 0, targetX = 0, targetY = 0;
    const allowFloating = () => finePointer.matches && !reducedMotion.matches;
    function hide() {
      activeRow = null; cancelAnimationFrame(frame); frame = 0;
      preview.classList.remove('is-visible');
      setTimeout(() => { if (!activeRow) preview.hidden = true; }, 180);
    }
    function tick() {
      if (!activeRow || !allowFloating()) { hide(); return; }
      x += (targetX - x) * .15; y += (targetY - y) * .15;
      preview.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) rotate(-4deg)';
      frame = Math.abs(targetX - x) + Math.abs(targetY - y) > .3 ? requestAnimationFrame(tick) : 0;
    }
    function move(event) {
      const width = preview.offsetWidth || 290, height = preview.offsetHeight || 200;
      targetX = Math.max(16, Math.min(event.clientX + 24, innerWidth - width - 24));
      targetY = Math.max(24, Math.min(event.clientY - height / 2, innerHeight - height - 24));
      if (!frame) frame = requestAnimationFrame(tick);
    }
    document.querySelectorAll('.experience-row[data-preview]').forEach(row => {
      const button = row.querySelector('.experience-trigger');
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      if (!panel) return;
      let animation = null;
      function settle() {
        const previous = animation; animation = null; previous?.cancel();
        panel.hidden = button.getAttribute('aria-expanded') !== 'true';
        panel.classList.remove('is-experience-transitioning');
      }
      function setOpen(open) {
        const startHeight = panel.hidden ? 0 : panel.getBoundingClientRect().height;
        const style = getComputedStyle(panel);
        const startOpacity = panel.hidden ? 0 : parseFloat(style.opacity);
        const startPadding = panel.hidden ? 0 : parseFloat(style.paddingBottom);
        const previous = animation; animation = null; previous?.cancel();
        if (!open && panel.contains(document.activeElement)) button.focus({ preventScroll: true });
        button.setAttribute('aria-expanded', String(open));
        panel.setAttribute('aria-hidden', String(!open)); panel.inert = !open; hide();
        if (reducedMotion.matches || !panel.animate) { settle(); return; }
        panel.hidden = false;
        const naturalPadding = parseFloat(getComputedStyle(panel).paddingBottom);
        panel.classList.add('is-experience-transitioning');
        const endHeight = open ? panel.scrollHeight : 0;
        const config = getComputedStyle(row.closest('.experience'));
        const transition = panel.animate({
          height: [startHeight + 'px', endHeight + 'px'],
          paddingBottom: [startPadding + 'px', (open ? naturalPadding : 0) + 'px'],
          opacity: [startOpacity, open ? 1 : 0]
        }, {
          duration: parseFloat(config.getPropertyValue('--experience-toggle-duration')) || 560,
          easing: config.getPropertyValue('--experience-toggle-ease').trim() || 'cubic-bezier(.4, 0, .2, 1)'
        });
        animation = transition;
        transition.onfinish = () => { if (animation === transition) settle(); };
      }
      button.setAttribute('aria-expanded', 'false');
      panel.hidden = true; panel.inert = true; panel.setAttribute('aria-hidden', 'true');
      button.addEventListener('click', () => {
        setOpen(button.getAttribute('aria-expanded') !== 'true');
      });
      function show(event) {
        if (!allowFloating() || button.getAttribute('aria-expanded') === 'true' || panel.classList.contains('is-experience-transitioning')) return;
        activeRow = row; previewImage.src = row.dataset.preview; previewImage.alt = row.dataset.previewAlt;
        preview.hidden = false; x = event.clientX; y = event.clientY; move(event);
        requestAnimationFrame(() => { if (activeRow) preview.classList.add('is-visible'); });
      }
      row.addEventListener('pointerenter', show);
      row.addEventListener('pointermove', event => { if (activeRow === row) move(event); else show(event); });
      row.addEventListener('pointerleave', hide);
      button.addEventListener('focus', () => {
        const box = button.getBoundingClientRect();
        show({ clientX: box.left + box.width * .55, clientY: box.top + box.height / 2 });
      });
      button.addEventListener('blur', hide);
      reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) settle(); });
      addEventListener('resize', settle, { passive: true });
      addEventListener('pagehide', settle);
    });
    reducedMotion.addEventListener('change', hide); finePointer.addEventListener('change', hide);
    addEventListener('scroll', hide, { passive: true }); addEventListener('pagehide', hide, { once: true });
  }
  function initExperienceCarousels() {
    document.querySelectorAll('[data-experience-carousel]').forEach(carousel => {
      const stage = carousel.querySelector('[data-carousel-stage]');
      const slides = [...carousel.querySelectorAll('[data-carousel-slide]')];
      const controls = carousel.querySelector('[data-carousel-controls]');
      if (!stage || !controls || slides.length < 2 || carousel.classList.contains('is-ready')) return;
      const dots = [...carousel.querySelectorAll('[data-carousel-go]')];
      const status = carousel.querySelector('[data-carousel-status]');
      const hoverPointer = matchMedia('(hover: hover) and (pointer: fine)');
      const interval = 5000;
      const poses = {
        active: { transform: 'translate3d(0, 0, 55px)', opacity: 1, filter: 'brightness(1)' },
        previous: { transform: 'translate3d(-46%, 12px, -180px) rotateY(24deg) scale(.84)', opacity: .7, filter: 'brightness(.85)' },
        next: { transform: 'translate3d(46%, 12px, -180px) rotateY(-24deg) scale(.84)', opacity: .7, filter: 'brightness(.85)' },
        off: { transform: 'translate3d(0, 16px, -340px) rotateY(0deg) scale(.72)', opacity: 0, filter: 'brightness(.85)' }
      };
      let current = 0, pointer = null, timer = 0, hovered = false, windowActive = true, pageActive = true, motion = null, motionVisual = null;
      function stopMotion() { const cleanup = motion; motion = null; cleanup?.(); }
      function stopTimer() { clearTimeout(timer); timer = 0; status.setAttribute('aria-live', 'polite'); }
      function resetCursor() { delete stage.dataset.carouselCursor; }
      function edgeDirection(event) {
        if (!hoverPointer.matches || (event.pointerType !== 'mouse' && event.pointerType !== 'pen')) return 0;
        const bounds = stage.getBoundingClientRect(), x = event.clientX - bounds.left, y = event.clientY - bounds.top;
        if (!bounds.width || x < 0 || x > bounds.width || y < 0 || y > bounds.height) return 0;
        return x <= bounds.width * .2 ? -1 : x >= bounds.width * .8 ? 1 : 0;
      }
      function updateCursor(event) {
        const direction = edgeDirection(event), next = direction < 0 ? 'previous' : direction > 0 ? 'next' : '';
        if (!next) resetCursor();
        else if (stage.dataset.carouselCursor !== next) stage.dataset.carouselCursor = next;
      }
      function canRotate() {
        const focused = carousel.contains(document.activeElement) && document.activeElement.matches(':focus-visible');
        const bounds = stage.getBoundingClientRect();
        return hovered && windowActive && pageActive && !document.hidden && !reducedMotion.matches && hoverPointer.matches && !pointer && !focused && !carousel.closest('[inert]') && bounds.width > 0 && bounds.bottom > 0 && bounds.top < innerHeight;
      }
      function schedule() {
        stopTimer();
        if (!canRotate()) return;
        status.setAttribute('aria-live', 'off');
        timer = setTimeout(() => { timer = 0; if (canRotate()) select(current + 1, 1); else stopTimer(); }, interval);
      }
      function render(direction = 0) {
        slides.forEach((slide, position) => {
          let offset = (position - current + slides.length) % slides.length;
          if (offset > slides.length / 2 || (slides.length === 2 && offset && direction > 0)) offset -= slides.length;
          slide.dataset.carouselPosition = offset === 0 ? 'active' : offset === -1 ? 'previous' : offset === 1 ? 'next' : 'off';
          slide.setAttribute('aria-hidden', String(position !== current));
          slide.inert = position !== current;
        });
        dots.forEach((dot, index) => dot.setAttribute('aria-pressed', String(index === current)));
        status.textContent = `${current + 1} / ${slides.length}`;
      }
      function select(index, direction = Math.sign(index - current) || 1) {
        const interrupted = Boolean(motion);
        const previousPositions = new Map(slides.map(slide => [slide, slide.dataset.carouselPosition]));
        const before = new Map(slides.map(slide => {
          const style = getComputedStyle(motionVisual?.slide === slide ? motionVisual.element : slide);
          return [slide, { transform: style.transform, opacity: style.opacity, filter: style.filter }];
        }));
        stopTimer(); stopMotion();
        const next = (index + slides.length) % slides.length;
        if (next === current) { schedule(); return; }
        const outgoing = slides[current], incoming = slides[next];
        current = next;
        const animate = !reducedMotion.matches && stage.getClientRects().length > 0 && typeof incoming.animate === 'function';
        carousel.classList.add('is-changing'); render(direction);
        if (animate) {
          // A decorative copy enters from the right even when the real slide is
          // currently on the left, so last → first never reverses the 3D loop.
          const ghost = incoming.cloneNode(true);
          ghost.removeAttribute('data-carousel-slide'); ghost.removeAttribute('aria-label'); ghost.removeAttribute('aria-roledescription');
          ghost.classList.add('is-carousel-ghost'); ghost.setAttribute('role', 'presentation'); ghost.setAttribute('aria-hidden', 'true'); ghost.inert = true;
          ghost.querySelectorAll('img').forEach(image => { image.alt = ''; });
          stage.append(ghost); incoming.style.visibility = 'hidden'; outgoing.style.zIndex = '2';
          const style = getComputedStyle(carousel);
          const options = { duration: parseFloat(style.getPropertyValue('--carousel-motion-duration')) || 850, easing: style.getPropertyValue('--carousel-motion-ease').trim() || 'cubic-bezier(.4, 0, .2, 1)' };
          const animations = [outgoing.animate([before.get(outgoing), direction > 0 ? poses.previous : poses.next], options), ghost.animate([interrupted ? before.get(incoming) : direction > 0 ? poses.next : poses.previous, poses.active], options)];
          const background = slides.filter(slide => slide !== outgoing && slide !== incoming);
          background.forEach(slide => {
            const target = poses[slide.dataset.carouselPosition] || poses.off;
            const recycled = previousPositions.get(slide) !== slide.dataset.carouselPosition && ['previous', 'next'].includes(previousPositions.get(slide)) && ['previous', 'next'].includes(slide.dataset.carouselPosition);
            slide.style.visibility = 'visible'; slide.style.zIndex = '0';
            // Recycle side cards behind the active images instead of teleporting
            // across the stage when the sequence wraps around.
            const frames = recycled ? [before.get(slide), { ...poses.off, offset: .5 }, target] : [before.get(slide), target];
            animations.push(slide.animate(frames, options));
          });
          const cleanup = () => {
            animations.forEach(animation => animation.cancel()); ghost.remove();
            incoming.style.removeProperty('visibility'); outgoing.style.removeProperty('z-index'); carousel.classList.remove('is-changing');
            background.forEach(slide => { slide.style.removeProperty('visibility'); slide.style.removeProperty('z-index'); });
            if (motionVisual?.element === ghost) motionVisual = null;
          };
          motion = cleanup;
          motionVisual = { slide: incoming, element: ghost };
          Promise.allSettled(animations.map(animation => animation.finished)).then(() => { if (motion === cleanup) { motion = null; cleanup(); } });
        } else carousel.classList.remove('is-changing');
        schedule();
      }
      slides.forEach(slide => { slide.querySelectorAll('img').forEach(image => { image.draggable = false; }); });
      carousel.classList.add('is-ready'); controls.hidden = false; render();
      dots.forEach(dot => dot.addEventListener('click', () => select(Number(dot.dataset.carouselGo))));
      carousel.addEventListener('keydown', event => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        const index = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: slides.length - 1 }[event.key];
        if (index === undefined) return;
        event.preventDefault(); select(index);
      });
      stage.addEventListener('pointerdown', event => {
        if (!event.isPrimary || event.button !== 0) return;
        stopTimer();
        pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, edge: edgeDirection(event) };
        stage.setPointerCapture?.(event.pointerId);
      });
      stage.addEventListener('pointerup', event => {
        if (!pointer || pointer.id !== event.pointerId) return;
        const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y, edge = pointer.edge;
        pointer = null;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) select(current + (dx < 0 ? 1 : -1));
        else if (edge && edgeDirection(event) === edge && Math.abs(dx) < 8 && Math.abs(dy) < 8) select(current + edge, edge);
        else schedule();
      });
      const resetPointer = () => { pointer = null; schedule(); };
      stage.addEventListener('pointercancel', () => { resetPointer(); resetCursor(); });
      stage.addEventListener('lostpointercapture', resetPointer);
      stage.addEventListener('pointermove', updateCursor, { passive: true });
      stage.addEventListener('pointerenter', event => {
        updateCursor(event);
        if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
        hovered = true; schedule();
      });
      stage.addEventListener('pointerleave', () => { hovered = false; stopTimer(); resetCursor(); });
      carousel.addEventListener('focusin', stopTimer);
      carousel.addEventListener('focusout', () => queueMicrotask(schedule));
      const panel = carousel.closest('.experience-inline');
      panel?.previousElementSibling?.querySelector('.experience-trigger')?.addEventListener('click', () => {
        if (panel.hidden || panel.inert) { hovered = false; stopTimer(); stopMotion(); resetCursor(); }
      });
      reducedMotion.addEventListener('change', () => { stopMotion(); schedule(); });
      hoverPointer.addEventListener('change', () => { resetCursor(); schedule(); });
      document.addEventListener('visibilitychange', () => { if (document.hidden) resetCursor(); schedule(); });
      addEventListener('blur', () => { windowActive = false; stopTimer(); resetCursor(); });
      addEventListener('focus', () => { windowActive = true; schedule(); });
      addEventListener('scroll', () => { hovered = stage.matches(':hover'); resetCursor(); schedule(); }, { passive: true });
      addEventListener('resize', resetCursor, { passive: true });
      addEventListener('pagehide', () => { pageActive = false; pointer = null; stopTimer(); stopMotion(); resetCursor(); });
      addEventListener('pageshow', () => { pageActive = true; hovered = stage.matches(':hover'); schedule(); });
    });
  }
  function initFaqs() {
    document.querySelectorAll('.faq-list details').forEach(detail => {
      const summary = detail.querySelector('summary');
      let animation, targetOpen = detail.open;
      detail.addEventListener('toggle', () => { if (!animation) targetOpen = detail.open; });
      summary.addEventListener('click', event => {
        if (reducedMotion.matches || !detail.animate) return;
        event.preventDefault();
        targetOpen = animation ? !targetOpen : !detail.open;
        const open = targetOpen, start = detail.offsetHeight;
        animation?.cancel(); detail.open = true;
        const end = open ? summary.offsetHeight + detail.querySelector('p').offsetHeight : summary.offsetHeight;
        animation = detail.animate({ height: [start + 'px', end + 'px'] }, { duration: 320, easing: ease });
        animation.onfinish = () => { detail.open = open; animation = null; };
      });
    });
  }
  function initRoutes() {
    if (location.protocol !== 'file:') {
      document.querySelectorAll('a[href]').forEach(link => {
        const raw = link.getAttribute('href');
        if (!raw.startsWith('http') && raw.includes('index.html')) link.setAttribute('href', raw.replace(/index\.html(?=#|$)/, ''));
      });
    }
    document.querySelector('[data-back]')?.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0 || !document.referrer) return;
      const referrer = new URL(document.referrer);
      if (referrer.origin === location.origin && history.length > 1) { event.preventDefault(); history.back(); }
    });
    let navigating = false;
    let exitAnimation;
    addEventListener('pageshow', () => {
      navigating = false;
      exitAnimation?.cancel();
      exitAnimation = null;
    });
    document.addEventListener('click', async event => {
      const link = event.target.closest('a[data-work-link]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || reducedMotion.matches) return;
      const main = document.querySelector('main');
      if (!main?.animate) return;
      event.preventDefault();
      if (navigating) return;
      navigating = true;
      try {
        exitAnimation = main.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: 'forwards' });
        await exitAnimation.finished;
      } catch { /* Navigation can interrupt an exit animation. */ }
      location.assign(link.href);
    });
    if (document.body.dataset.page === 'project' && document.referrer) document.querySelector('h1')?.focus({ preventScroll: true });
  }
  initNavigation(); initFilters(); initServices(); initExperience(); initExperienceCarousels(); initFaqs(); initRoutes(); initPortraitReveal(); initReveal();
})();

/* ================================================================
   LAGOS IN YANKEE '26 — liy-script.js
   Modules:
     1. Nav – scroll-aware sticky + mobile hamburger
     2. Countdown – to May 30 2026
     3. Scroll Reveal – IntersectionObserver fade-ups
     4. FAQ Accordion – accessible expand/collapse
     5. Contact Form – client-side handling + success state
     6. Video Fallback – graceful no-video recovery
     7. Stagger Delays – sibling card entrance timing
   ================================================================ */

'use strict';

/* ── 1. NAV ─────────────────────────────────────────────────── */
(function initNav() {
  const nav       = document.getElementById('mainNav');
  const toggle    = document.getElementById('navToggle');
  const mobile    = document.getElementById('navMobile');
  const mobileLinks = mobile ? mobile.querySelectorAll('.nav-mobile-link') : [];

  if (!nav) return;

  // Scroll-aware background
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        nav.classList.toggle('scrolled', window.scrollY > 40);
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  // Mobile hamburger toggle
  function openMenu() {
    toggle.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    mobile.classList.add('open');
    mobile.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    mobile.classList.remove('open');
    mobile.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => {
    const isOpen = toggle.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  });

  // Close on mobile link click
  mobileLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (
      mobile.classList.contains('open') &&
      !nav.contains(e.target)
    ) { closeMenu(); }
  });
})();


/* ── 2. COUNTDOWN ───────────────────────────────────────────── */
(function initCountdown() {
  // Target: May 30 2026, 12:00 PM Eastern Time
  // Adjust timezone offset if needed (ET = UTC-5 standard, UTC-4 daylight)
  const TARGET = new Date('2026-05-30T12:00:00-04:00');

  const els = {
    days:  document.getElementById('cd-days'),
    hours: document.getElementById('cd-hours'),
    mins:  document.getElementById('cd-mins'),
    secs:  document.getElementById('cd-secs'),
  };

  // Only run if all elements exist
  if (!Object.values(els).every(Boolean)) return;

  function pad(n) { return String(Math.max(0, n)).padStart(2, '0'); }

  function tick() {
    const diff = TARGET.getTime() - Date.now();

    if (diff <= 0) {
      Object.values(els).forEach(el => { el.textContent = '00'; });
      return;
    }

    const totalSecs = Math.floor(diff / 1000);
    els.days.textContent  = pad(Math.floor(totalSecs / 86400));
    els.hours.textContent = pad(Math.floor((totalSecs % 86400) / 3600));
    els.mins.textContent  = pad(Math.floor((totalSecs % 3600) / 60));
    els.secs.textContent  = pad(totalSecs % 60);
  }

  tick();
  setInterval(tick, 1000);
})();


/* ── 3. SCROLL REVEAL ───────────────────────────────────────── */
(function initScrollReveal() {
  const targets = document.querySelectorAll('.fade-up');
  if (!targets.length) return;

  // Stagger sibling cards (grid/list children)
  const staggerParents = document.querySelectorAll(
    '.exp-grid, .vendors-grid, .details-cards, .tickets-grid, .faq-list'
  );

  staggerParents.forEach(parent => {
    const children = parent.querySelectorAll('.fade-up');
    children.forEach((el, i) => {
      el.style.transitionDelay = i * 0.08 + 's';
    });
  });

  const io = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach(el => io.observe(el));
})();


/* ── 4. FAQ ACCORDION ───────────────────────────────────────── */
(function initFAQ() {
  const questions = document.querySelectorAll('.faq-question');
  if (!questions.length) return;

  questions.forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const answerId = btn.getAttribute('aria-controls');
      const answer   = document.getElementById(answerId);

      if (!answer) return;

      // Close all others
      questions.forEach(other => {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          const otherAnswerId = other.getAttribute('aria-controls');
          const otherAnswer   = document.getElementById(otherAnswerId);
          if (otherAnswer) {
            otherAnswer.style.maxHeight = '0';
            otherAnswer.setAttribute('aria-hidden', 'true');
          }
        }
      });

      // Toggle this one
      if (expanded) {
        btn.setAttribute('aria-expanded', 'false');
        answer.style.maxHeight = '0';
        answer.setAttribute('aria-hidden', 'true');
      } else {
        btn.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        answer.setAttribute('aria-hidden', 'false');
      }
    });
  });
})();


/* ── 5. CONTACT FORM ────────────────────────────────────────── */
(function initContactForm() {
  const form    = document.querySelector('.contact-form');
  const success = document.getElementById('formSuccess');
  if (!form || !success) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const submitBtn = form.querySelector('.form-submit');
    const originalText = submitBtn.innerHTML;

    // Loading state
    submitBtn.innerHTML = 'Sending&hellip;';
    submitBtn.disabled  = true;

    try {
      const data = new FormData(form);
      const res  = await fetch('https://formspree.io/f/mdawqrka', {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error('Network error');

      // Show popup
      form.reset();
      success.removeAttribute('hidden');

      // Auto-dismiss after 5 seconds
      setTimeout(() => { success.setAttribute('hidden', ''); }, 5000);

    } catch (err) {
      console.error('Form error:', err);
      alert('Something went wrong. Please email us directly at hello@lagosinyankee.com');
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled  = false;
    }
  });
})();


/* ── 6. VIDEO FALLBACK ──────────────────────────────────────── */
(function initVideoFallback() {
  const video = document.querySelector('.hero-video');
  if (!video) return;

  video.addEventListener('error', () => {
    const wrap = video.closest('.hero-media');
    if (wrap) {
      // Warm espresso-to-brown gradient as fallback
      wrap.style.background =
        'linear-gradient(160deg, #0d0600 0%, #1e1008 30%, #3b1e0c 65%, #1e1008 100%)';
    }
    video.style.display = 'none';
  });

  // Pause/resume on tab visibility
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { video.pause(); }
    else { video.play().catch(() => {}); }
  });
})();


/* ── 7. GALLERY SLIDER ──────────────────────────────────────── */
(function initGallerySlider() {
  const stage    = document.querySelector('.gallery-stage');
  const track    = document.getElementById('galleryTrack');
  const prevBtn  = document.getElementById('galleryPrev');
  const nextBtn  = document.getElementById('galleryNext');
  const dotsWrap = document.getElementById('galleryDots');
  const currentEl = document.getElementById('galleryCurrent');
  const totalEl   = document.getElementById('galleryTotal');

  if (!stage || !track || !prevBtn || !nextBtn) return;

  const slides = Array.from(track.querySelectorAll('.gallery-slide'));
  const count  = slides.length;
  let current  = 0;
  let autoTimer;

  if (!count) return;
  if (totalEl) totalEl.textContent = String(count).padStart(2, '0');

  // Build dot buttons
  const dots = slides.map((_, i) => {
    const btn = document.createElement('button');
    btn.className = 'gallery-dot';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-label', 'Go to slide ' + (i + 1));
    btn.addEventListener('click', () => { goTo(i); resetAuto(); });
    dotsWrap.appendChild(btn);
    return btn;
  });

  function getOffset(index) {
    const slideW  = slides[0].getBoundingClientRect().width;
    const outerW  = stage.getBoundingClientRect().width;
    const gap     = parseFloat(getComputedStyle(track).gap) || 20;
    const centerX = (outerW - slideW) / 2;
    return centerX - index * (slideW + gap);
  }

  function goTo(index) {
    current = Math.max(0, Math.min(count - 1, index));
    track.style.transform = 'translateX(' + getOffset(current) + 'px)';
    slides.forEach((s, i) => s.classList.toggle('is-active', i === current));
    dots.forEach((d, i)   => d.classList.toggle('is-active', i === current));
    if (currentEl) currentEl.textContent = String(current + 1).padStart(2, '0');
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === count - 1;
  }

  function goNext() { goTo(current < count - 1 ? current + 1 : 0); }
  function goPrev() { goTo(current > 0         ? current - 1 : count - 1); }

  prevBtn.addEventListener('click', () => { goPrev(); resetAuto(); });
  nextBtn.addEventListener('click', () => { goNext(); resetAuto(); });

  // Keyboard arrows (when focused inside the gallery)
  document.querySelector('.gallery-slider-outer').addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { goPrev(); resetAuto(); }
    if (e.key === 'ArrowRight') { goNext(); resetAuto(); }
  });

  // Touch swipe
  let touchStartX = 0;
  stage.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  stage.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 48) { diff > 0 ? goNext() : goPrev(); resetAuto(); }
  }, { passive: true });

  // Mouse drag
  let dragStartX = 0;
  let dragging   = false;
  stage.addEventListener('mousedown', e => {
    dragStartX = e.clientX;
    dragging   = true;
    stage.classList.add('is-dragging');
    track.style.transition = 'none';
  });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    track.style.transform = 'translateX(' + (getOffset(current) + e.clientX - dragStartX) + 'px)';
  });
  window.addEventListener('mouseup', e => {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('is-dragging');
    track.style.transition = '';
    const diff = dragStartX - e.clientX;
    if (Math.abs(diff) > 48) { diff > 0 ? goNext() : goPrev(); resetAuto(); }
    else { goTo(current); } // snap back
  });

  // Auto-play
  function startAuto() { autoTimer = setInterval(goNext, 4500); }
  function resetAuto()  { clearInterval(autoTimer); startAuto(); }
  stage.addEventListener('mouseenter', () => clearInterval(autoTimer));
  stage.addEventListener('mouseleave', startAuto);

  // Recalculate on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const prev = track.style.transition;
      track.style.transition = 'none';
      goTo(current);
      requestAnimationFrame(() => { track.style.transition = prev; });
    }, 150);
  });

  // Initialise
  goTo(0);
  startAuto();
})();


/* ── 8. ACTIVE NAV LINKS ON SCROLL ─────────────────────────── */
(function initActiveSections() {
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-links a');
  if (!sections.length || !navLinks.length) return;

  const io = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            link.classList.toggle(
              'active',
              link.getAttribute('href') === '#' + id
            );
          });
        }
      });
    },
    { threshold: 0.35 }
  );

  sections.forEach(s => io.observe(s));
})();
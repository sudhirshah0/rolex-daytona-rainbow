// Always scroll to top (hero section) on page load/refresh
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

document.addEventListener('DOMContentLoaded', () => {
  window.scrollTo(0, 0);
  initFrameSequence();
  initAmbientParticles();
  initInteractiveDeconstruction();
  initReservationModal();
  initMobileMenu();
  initScrollReveals();
});

// Also ensure top position after window finishes loading
window.addEventListener('load', () => {
  window.scrollTo(0, 0);
});

/* ==========================================================================
   1. 300-FRAME SCROLL-DRIVEN ANIMATION ENGINE
   ========================================================================== */
const TOTAL_FRAMES = 300;
const frames = new Array(TOTAL_FRAMES + 1);
let loadedCount = 0;
let currentFrameIndex = 1;
let isAutoPlaying = false;
let autoPlayInterval = null;

function getFrameUrl(idx) {
  const pad = String(idx).padStart(3, '0');
  return `assets/hero_images/ezgif-frame-${pad}.png`;
}

function initFrameSequence() {
  const canvas = document.getElementById('watch-scroll-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const heroTrack = document.getElementById('hero-track');
  const loader = document.getElementById('page-loader');
  const progressBar = document.getElementById('loader-progress-bar');
  const percentText = document.getElementById('loader-percent');
  const statusText = document.getElementById('loader-status-text');

  const frameNumHud = document.getElementById('hud-frame-num');
  const stateTextHud = document.getElementById('hud-state-text');
  const manualScrubber = document.getElementById('manual-scrubber');
  const autoPlayBtn = document.getElementById('auto-play-btn');
  const playIcon = document.getElementById('play-icon');
  const playText = document.getElementById('play-text');
  const storyCards = document.querySelectorAll('.story-card');
  const storyReserveTrigger = document.getElementById('story-reserve-trigger');

  // Resize canvas according to display and DPR
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    renderFrame(currentFrameIndex);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Find closest loaded frame if desired frame hasn't completed downloading
  function getClosestLoadedFrame(targetIdx) {
    if (frames[targetIdx] && frames[targetIdx].complete && frames[targetIdx].naturalWidth > 0) {
      return frames[targetIdx];
    }
    // Search backward first
    for (let i = targetIdx - 1; i >= 1; i--) {
      if (frames[i] && frames[i].complete && frames[i].naturalWidth > 0) return frames[i];
    }
    // Search forward
    for (let i = targetIdx + 1; i <= TOTAL_FRAMES; i++) {
      if (frames[i] && frames[i].complete && frames[i].naturalWidth > 0) return frames[i];
    }
    return null;
  }

  // Draw frame to canvas with aspect-ratio containment and centered placement
  function renderFrame(index) {
    const img = getClosestLoadedFrame(index);
    if (!img) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';

    const canvasW = canvas.width;
    const canvasH = canvas.height;
    ctx.clearRect(0, 0, canvasW, canvasH);

    const canvasRatio = canvasW / canvasH;
    const imgRatio = (img.naturalWidth && img.naturalHeight) 
      ? (img.naturalWidth / img.naturalHeight) 
      : (16 / 9);

    let drawW, drawH, drawX, drawY;

    if (canvasRatio > imgRatio) {
      drawH = canvasH;
      drawW = drawH * imgRatio;
      drawX = (canvasW - drawW) * 0.5;
      drawY = 0;
    } else {
      drawW = canvasW;
      drawH = drawW / imgRatio;
      drawX = 0;
      drawY = (canvasH - drawH) * 0.5;
    }

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }

  // Update story cards and HUD text based on progress (0.0 to 1.0)
  function updateStoryAndHud(progress) {
    if (storyCards && storyCards.length > 0) {
      storyCards.forEach(card => {
        const range = card.dataset.range.split(',').map(Number);
        if (progress >= range[0] && progress <= range[1]) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });
    }

    // 2. Update HUD
    if (frameNumHud) {
      frameNumHud.textContent = String(currentFrameIndex).padStart(3, '0');
    }
    if (manualScrubber) {
      manualScrubber.value = currentFrameIndex;
    }

    // 3. Update descriptive stage
    if (stateTextHud) {
      if (currentFrameIndex < 50) {
        stateTextHud.textContent = 'ASSEMBLED MASTERPIECE';
      } else if (currentFrameIndex < 140) {
        stateTextHud.textContent = 'STAGE 01 &bull; KINETIC SEPARATION';
      } else if (currentFrameIndex < 230) {
        stateTextHud.textContent = 'STAGE 02 &bull; GEMOLOGICAL ATELIER';
      } else {
        stateTextHud.textContent = 'STAGE 03 &bull; TOTAL HOROLOGICAL METROLOGY';
      }
    }
  }

  // Smooth Lerp Rendering Engine for buttery-smooth scrubbing
  let targetFrame = 1;
  let currentLerpFrame = 1;
  let isLerpActive = true;

  function startSmoothRenderLoop() {
    function loop() {
      if (!isAutoPlaying && isLerpActive) {
        const diff = targetFrame - currentLerpFrame;
        if (Math.abs(diff) > 0.005) {
          currentLerpFrame += diff * 0.18; // smooth easing factor
          const frameToDraw = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(currentLerpFrame)));
          if (frameToDraw !== currentFrameIndex) {
            currentFrameIndex = frameToDraw;
            renderFrame(currentFrameIndex);
          }
        }
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
  startSmoothRenderLoop();

  // Handle Scroll Progress
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (isAutoPlaying) return; // Don't override scroll during auto-play
    if (!ticking) {
      window.requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  function onScroll() {
    if (!heroTrack) return;
    const rect = heroTrack.getBoundingClientRect();
    const trackHeight = heroTrack.offsetHeight - window.innerHeight;

    if (trackHeight <= 0) return;

    // Relative scroll inside the track: 0 to 1
    const scrolledPx = -rect.top;
    let progress = scrolledPx / trackHeight;
    progress = Math.max(0, Math.min(1, progress));

    targetFrame = Math.floor(progress * (TOTAL_FRAMES - 1)) + 1;
    updateStoryAndHud(progress);

    // Smooth Hero Section Fade Out & Fade In on Scroll
    const stickyViewport = document.getElementById('sticky-viewport');
    if (stickyViewport) {
      if (progress > 0.84) {
        const fadeOut = Math.max(0, (1 - progress) / 0.16);
        stickyViewport.style.opacity = fadeOut;
        stickyViewport.style.transform = `scale(${0.96 + fadeOut * 0.04})`;
        stickyViewport.style.pointerEvents = fadeOut < 0.1 ? 'none' : 'auto';
      } else {
        stickyViewport.style.opacity = '1';
        stickyViewport.style.transform = 'scale(1)';
        stickyViewport.style.pointerEvents = 'auto';
      }
    }
  }

  // Interactive Manual Scrubber Drag
  if (manualScrubber) {
    manualScrubber.addEventListener('input', (e) => {
      if (isAutoPlaying) stopAutoPlay();
      const val = parseInt(e.target.value, 10);
      currentFrameIndex = val;
      renderFrame(currentFrameIndex);

      const progress = (val - 1) / (TOTAL_FRAMES - 1);
      updateStoryAndHud(progress);

      // Scroll the page to match scrubber position
      if (heroTrack) {
        const trackHeight = heroTrack.offsetHeight - window.innerHeight;
        const targetScroll = heroTrack.offsetTop + progress * trackHeight;
        window.scrollTo({ top: targetScroll, behavior: 'instant' });
      }
    });
  }

  // Auto-Play Feature
  function startAutoPlay() {
    isAutoPlaying = true;
    if (playIcon) playIcon.innerHTML = '&marker;';
    if (playText) playText.textContent = 'PAUSE';
    if (autoPlayBtn) autoPlayBtn.classList.add('playing');

    autoPlayInterval = setInterval(() => {
      currentFrameIndex++;
      if (currentFrameIndex > TOTAL_FRAMES) currentFrameIndex = 1;

      renderFrame(currentFrameIndex);
      const progress = (currentFrameIndex - 1) / (TOTAL_FRAMES - 1);
      updateStoryAndHud(progress);

      // Smoothly update scroll position to reflect frame
      if (heroTrack) {
        const trackHeight = heroTrack.offsetHeight - window.innerHeight;
        const targetScroll = heroTrack.offsetTop + progress * trackHeight;
        window.scrollTo({ top: targetScroll, behavior: 'auto' });
      }
    }, 45); // ~22 fps playback
  }

  function stopAutoPlay() {
    isAutoPlaying = false;
    clearInterval(autoPlayInterval);
    if (playIcon) playIcon.innerHTML = '&rtrif;';
    if (playText) playText.textContent = 'AUTO ROTATE';
    if (autoPlayBtn) autoPlayBtn.classList.remove('playing');
  }

  if (autoPlayBtn) {
    autoPlayBtn.addEventListener('click', () => {
      if (isAutoPlaying) {
        stopAutoPlay();
      } else {
        startAutoPlay();
      }
    });
  }

  if (storyReserveTrigger) {
    storyReserveTrigger.addEventListener('click', () => {
      const modal = document.getElementById('reserve-modal');
      if (modal) modal.classList.add('open');
    });
  }

  // ========================================================================
  // Progressive High-Throughput Async Preloader for Safari & WebKit
  // 1) Frame 1 is decoded immediately to render first visual state
  // 2) Keyframes (every 3rd) stream in parallel to cover full scrub motion
  // 3) All remaining frames stream via 16 concurrent asynchronous workers
  // ========================================================================
  function decodeAndStore(idx, img) {
    if ('decode' in img) {
      return img.decode().then(() => {
        frames[idx] = img;
        loadedCount++;
      }).catch(() => {
        frames[idx] = img;
        loadedCount++;
      });
    } else {
      frames[idx] = img;
      loadedCount++;
      return Promise.resolve();
    }
  }

  const firstImg = new Image();
  firstImg.decoding = 'async';
  firstImg.src = getFrameUrl(1);
  firstImg.onload = () => {
    decodeAndStore(1, firstImg).then(() => {
      renderFrame(1);
      updateStoryAndHud(0);
      loadRestOfFrames();
    });
  };

  function loadRestOfFrames() {
    // 1. Keyframes first (every 3rd frame: 4, 7, 10, ... 298, 300)
    const keyIndices = [];
    for (let i = 4; i <= TOTAL_FRAMES; i += 3) {
      keyIndices.push(i);
    }
    if (!keyIndices.includes(TOTAL_FRAMES)) keyIndices.push(TOTAL_FRAMES);

    // 2. All remaining in-between frames
    const remainingIndices = [];
    for (let i = 2; i <= TOTAL_FRAMES; i++) {
      if (!keyIndices.includes(i)) remainingIndices.push(i);
    }

    const queue = [...keyIndices, ...remainingIndices];
    const MAX_CONCURRENT = 16;
    let activeWorkers = 0;
    let queueIdx = 0;

    function processQueue() {
      while (activeWorkers < MAX_CONCURRENT && queueIdx < queue.length) {
        const frameIdx = queue[queueIdx++];
        activeWorkers++;

        const img = new Image();
        img.decoding = 'async';
        img.src = getFrameUrl(frameIdx);

        img.onload = () => {
          decodeAndStore(frameIdx, img).finally(() => {
            activeWorkers--;
            processQueue();
          });
        };

        img.onerror = () => {
          activeWorkers--;
          processQueue();
        };
      }
    }

    processQueue();
  }
}

/* ==========================================================================
   2. AMBIENT PARTICLES (GOLD FLECK DUST)
   ========================================================================== */
function initAmbientParticles() {
  const canvas = document.getElementById('ambient-particles');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const PARTICLE_COUNT = 45;

  function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 10;
      this.size = Math.random() * 2 + 0.6;
      this.speedY = -(Math.random() * 0.45 + 0.15);
      this.speedX = (Math.random() - 0.5) * 0.25;
      this.alpha = Math.random() * 0.5 + 0.2;
      this.fadeSpeed = Math.random() * 0.005 + 0.002;
      this.fadingIn = true;
      const type = Math.random();
      if (type < 0.6) {
        this.color = '229, 168, 140'; // 18k Everose
      } else if (type < 0.85) {
        this.color = '255, 255, 255'; // Diamond
      } else {
        this.color = '0, 180, 216'; // Sapphire
      }
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      if (this.fadingIn) {
        this.alpha += this.fadeSpeed;
        if (this.alpha >= 0.75) this.fadingIn = false;
      } else {
        this.alpha -= this.fadeSpeed;
        if (this.alpha <= 0.1) this.fadingIn = true;
      }

      if (this.y < -10 || this.x < -10 || this.x > width + 10) {
        this.reset();
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    for (let p of particles) {
      p.update();
      p.draw();
    }
    requestAnimationFrame(animate);
  }

  animate();
}

/* ==========================================================================
   3. HEADER SCROLL STATE
   ========================================================================== */
function initHeaderScroll() {
  const header = document.getElementById('main-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
}

/* ==========================================================================
   4. INTERACTIVE DECONSTRUCTION CANVAS & HOTSPOTS
   ========================================================================== */
function initInteractiveDeconstruction() {
  const hotspots = document.querySelectorAll('.hotspot-pin');
  const tabs = document.querySelectorAll('.comp-tab');
  const detailCards = document.querySelectorAll('.comp-detail');
  const layerPill = document.getElementById('card-layer-pill');
  const canvasWrap = document.getElementById('interactive-canvas');
  const watchImg = document.getElementById('interactive-watch-img');
  const hudCoords = document.getElementById('hud-coordinates');

  const componentMeta = {
    bezel: { pill: 'COMPONENT 01 / 04 &bull; GEMOLOGICAL', scale: 1.15, yOffset: '-2%' },
    lugs: { pill: 'COMPONENT 02 / 04 &bull; PAVÉ ATELIER', scale: 1.25, yOffset: '-20%' },
    dial: { pill: 'COMPONENT 03 / 04 &bull; CHRONOMETRIC', scale: 1.18, yOffset: '-8%' },
    movement: { pill: 'COMPONENT 04 / 04 &bull; HOROLOGY', scale: 1.2, yOffset: '-14%' }
  };

  function activateComponent(compKey) {
    hotspots.forEach(pin => {
      if (pin.dataset.component === compKey) {
        pin.classList.add('active');
        const btn = pin.querySelector('.pin-button');
        if (btn) btn.setAttribute('aria-expanded', 'true');
      } else {
        pin.classList.remove('active');
        const btn = pin.querySelector('.pin-button');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });

    tabs.forEach(tab => {
      if (tab.dataset.target === compKey) {
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
      } else {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
      }
    });

    detailCards.forEach(card => {
      if (card.classList.contains(`comp-${compKey}`)) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    if (layerPill && componentMeta[compKey]) {
      layerPill.innerHTML = componentMeta[compKey].pill;
    }

    if (watchImg && componentMeta[compKey]) {
      const meta = componentMeta[compKey];
      watchImg.style.transform = `scale(${meta.scale}) translateY(${meta.yOffset})`;
    }
  }

  hotspots.forEach(pin => {
    const comp = pin.dataset.component;
    pin.addEventListener('click', (e) => {
      e.stopPropagation();
      activateComponent(comp);
    });
    pin.addEventListener('mouseenter', () => {
      activateComponent(comp);
    });
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const comp = tab.dataset.target;
      activateComponent(comp);
    });
  });

  if (canvasWrap && hudCoords) {
    canvasWrap.addEventListener('mousemove', (e) => {
      const rect = canvasWrap.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
      const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
      hudCoords.textContent = `X: ${x}% / Y: ${y}%`;
    });

    canvasWrap.addEventListener('mouseleave', () => {
      hudCoords.textContent = 'X: 50.0% / Y: 50.0%';
      if (watchImg) {
        watchImg.style.transform = 'scale(1) translateY(0)';
      }
    });
  }
}

/* ==========================================================================
   5. VIP RESERVATION MODAL
   ========================================================================== */
function initReservationModal() {
  const modal = document.getElementById('reserve-modal');
  const closeBtn = document.getElementById('modal-close');
  const headerBtn = document.getElementById('header-reserve-btn');
  const grandBtn = document.getElementById('grand-reserve-trigger');
  const mobileBtn = document.getElementById('mobile-reserve-trigger');
  const navLoginBtn = document.getElementById('nav-login-btn');
  const form = document.getElementById('reservation-form');
  const successState = document.getElementById('modal-success');
  const doneBtn = document.getElementById('modal-done-btn');

  function openModal() {
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (headerBtn) headerBtn.addEventListener('click', openModal);
  if (grandBtn) grandBtn.addEventListener('click', openModal);
  if (mobileBtn) mobileBtn.addEventListener('click', openModal);

  if (navLoginBtn) {
    navLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (doneBtn) {
    doneBtn.addEventListener('click', () => {
      closeModal();
      setTimeout(() => {
        if (form) form.style.display = 'block';
        if (successState) successState.style.display = 'none';
      }, 400);
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
      closeModal();
    }
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitText = form.querySelector('.btn-submit-text');
      if (submitText) submitText.textContent = 'TRANSMITTING CREDENTIALS...';

      setTimeout(() => {
        form.style.display = 'none';
        if (successState) successState.style.display = 'block';
        if (submitText) submitText.textContent = 'TRANSMIT VIP RESERVATION';
      }, 1200);
    });
  }
}

/* ==========================================================================
   6. MOBILE MENU
   ========================================================================== */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-btn');
  const drawer = document.getElementById('mobile-drawer');
  const links = document.querySelectorAll('.mobile-link');

  if (!toggleBtn || !drawer) return;

  toggleBtn.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('open');
    if (isOpen) {
      drawer.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    } else {
      drawer.classList.add('open');
      toggleBtn.setAttribute('aria-expanded', 'true');
    }
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      drawer.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ==========================================================================
   7. SCROLL-REVEAL & SMOOTH SITE ANIMATION OBSERVER
   ========================================================================== */
function initScrollReveals() {
  const revealTargets = [
    '.anim-text-reveal',
    '.anim-fade-up',
    '.scroll-reveal',
    '.section-heading-container',
    '.gallery-text-col',
    '.gallery-feature-item',
    '.gallery-image-col',
    '.assembled-hero-card',
    '.assembled-img-wrap',
    '.minimal-specs-grid .spec-tile',
    '.acquisition-card',
    '.minimal-footer'
  ];

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -10px 0px',
    threshold: 0.05
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
      } else {
        entry.target.classList.remove('is-revealed');
      }
    });
  }, observerOptions);

  revealTargets.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      revealObserver.observe(el);
    });
  });

  // Interactive 3D tilt on the assembled watch display
  const assembledWrap = document.getElementById('assembled-canvas-wrap');
  const assembledImg = document.getElementById('assembled-watch-img');
  if (assembledWrap && assembledImg) {
    assembledWrap.addEventListener('mousemove', (e) => {
      const rect = assembledWrap.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      assembledImg.style.transform = `scale(1.02) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-2px)`;
    });

    assembledWrap.addEventListener('mouseleave', () => {
      assembledImg.style.transform = '';
    });
  }
}

/* ═══════════════════════════════════════════════════════
   JILEBI'S BIRTHDAY WORLD — script.js
   "Unlocking Her World" — Interactive Engine
   ═══════════════════════════════════════════════════════ */

'use strict';

/* ─── UTILS ──────────────────────────────────────────── */
const Utils = {
  // Haptic feedback
  vibrate(pattern = [30]) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  },

  // Typewriter effect
  typewriter(el, text, speed = 45, onDone) {
    el.style.opacity = '1';
    let i = 0;
    const tick = () => {
      el.textContent = text.slice(0, i);
      i++;
      if (i <= text.length) setTimeout(tick, speed);
      else if (onDone) onDone();
    };
    tick();
  },

  // Fade in element
  fadeIn(el, duration = 600, delay = 0) {
    return new Promise(resolve => {
      el.style.transition = `opacity ${duration}ms cubic-bezier(0.4,0,0.2,1) ${delay}ms`;
      el.style.opacity = '0';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.opacity = '1';
          setTimeout(resolve, duration + delay);
        });
      });
    });
  },

  // Fade out element
  fadeOut(el, duration = 400) {
    return new Promise(resolve => {
      el.style.transition = `opacity ${duration}ms cubic-bezier(0.4,0,0.2,1)`;
      el.style.opacity = '0';
      setTimeout(resolve, duration);
    });
  },

  // Random range
  rand(min, max) { return Math.random() * (max - min) + min; },
  randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },

  // Debounce
  debounce(fn, wait) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  },

  // Wait
  wait(ms) { return new Promise(r => setTimeout(r, ms)); }
};

/* ─── AUDIO MANAGER ──────────────────────────────────── */
const AudioManager = {
  bgm: null,
  muted: false,
  started: false,
  volume: 0.32,

  init() {
    this.bgm = document.getElementById('bgm');
    this.bgm.volume = 0;
    document.getElementById('mute-btn').addEventListener('click', () => this.toggleMute());

    // Use a gentle ambient sound from a CDN-hosted source
    // Pixabay ambient / Freesound ambient — using inline oscillator as fallback
    this.createAmbientSynth();
  },

  createAmbientSynth() {
    // We'll create a gentle ambient tone using Web Audio API
    // This is silent until user gesture, fully client-side
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0;
      this.masterGain.connect(this.ctx.destination);
      this.ready = true;
    } catch(e) {
      this.ready = false;
    }
  },

  playAmbient() {
    if (!this.ready || this.started) return;
    this.started = true;

    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();

      // Create a multi-layered ambient pad
      const freqs = [110, 146.83, 164.81, 220, 261.63];
      freqs.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const panner = this.ctx.createStereoPanner();

        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;

        // Slow frequency wobble
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.value = 0.1 + i * 0.05;
        lfoGain.gain.value = freq * 0.005;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        gain.gain.value = 0.015 - i * 0.002;
        panner.pan.value = (i % 3 - 1) * 0.3;

        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.masterGain);
        osc.start();
      });

      // Fade in
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 3);

    } catch(e) {}
  },

  toggleMute() {
    this.muted = !this.muted;
    const btn = document.getElementById('mute-btn');
    btn.textContent = this.muted ? '🔇' : '🔊';
    if (this.ready && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        this.muted ? 0 : this.volume,
        this.ctx.currentTime, 0.3
      );
    }
  },

  // Play a soft chime sound effect
  playChime() {
    if (!this.ready || this.muted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.2);
    } catch(e) {}
  },

  // Play star catch sound
  playStarCatch() {
    if (!this.ready || this.muted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2640, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch(e) {}
  },

  // Play card whoosh
  playWhoosh() {
    if (!this.ready || this.muted) return;
    try {
      const noise = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      noise.type = 'sawtooth';
      noise.frequency.setValueAtTime(200, this.ctx.currentTime);
      noise.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      noise.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
      noise.stop(this.ctx.currentTime + 0.3);
    } catch(e) {}
  }
};

/* ─── PARTICLE SYSTEM ────────────────────────────────── */
const ParticleSystem = {
  canvas: null,
  ctx: null,
  stars: [],
  animFrame: null,

  init() {
    this.canvas = document.getElementById('star-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.createStars(80);
    this.animate();
  },

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  createStars(count) {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Utils.rand(0.4, 2.2),
        opacity: Utils.rand(0.1, 0.9),
        speed: Utils.rand(0.15, 0.6),
        phase: Utils.rand(0, Math.PI * 2),
        drift: Utils.rand(-0.08, 0.08)
      });
    }
  },

  animate() {
    const { ctx, canvas, stars } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const t = Date.now() * 0.001;
    stars.forEach(s => {
      s.opacity = 0.2 + 0.5 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
      s.x += s.drift;

      if (s.x > canvas.width + 10) s.x = -10;
      if (s.x < -10) s.x = canvas.width + 10;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(253,246,236,${s.opacity})`;
      ctx.fill();

      // Occasional gold stars
      if (s.r > 1.5) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,201,125,${s.opacity * 0.15})`;
        ctx.fill();
      }
    });

    this.animFrame = requestAnimationFrame(() => this.animate());
  }
};

/* ─── LEVEL MANAGER ──────────────────────────────────── */
const LevelManager = {
  current: -1,
  progress: {},

  init() {
    // Check for returning user
    try {
      const saved = localStorage.getItem('jilebi_progress');
      if (saved) {
        this.progress = JSON.parse(saved);
        if (this.progress.level > 0) {
          this.showReturnScreen();
          return;
        }
      }
    } catch(e) {}

    this.showLevel(0);
  },

  save() {
    try {
      localStorage.setItem('jilebi_progress', JSON.stringify({
        ...this.progress,
        level: this.current,
        timestamp: Date.now()
      }));
    } catch(e) {}
  },

  showReturnScreen() {
    const screen = document.getElementById('return-screen');
    screen.classList.add('visible');

    document.getElementById('continue-btn').onclick = () => {
      screen.classList.remove('visible');
      const lvl = Math.max(0, this.progress.level || 0);
      this.showLevel(lvl);
    };

    document.getElementById('restart-btn-return').onclick = () => {
      screen.classList.remove('visible');
      try { localStorage.removeItem('jilebi_progress'); } catch(e) {}
      this.progress = {};
      this.showLevel(0);
    };
  },

  showLevel(num) {
    // Hide all levels
    document.querySelectorAll('.level').forEach(el => {
      el.classList.remove('active');
      el.style.display = 'none';
    });

    this.current = num;
    this.save();

    const level = document.getElementById(`level-${num}`);
    if (!level) return;

    level.style.display = 'flex';
    requestAnimationFrame(() => level.classList.add('active'));

    // Update chapter indicator
    const indicator = document.getElementById('chapter-indicator');
    const chapterNum = document.getElementById('chapter-num');
    if (num > 0) {
      indicator.classList.add('visible');
      chapterNum.textContent = num;
    } else {
      indicator.classList.remove('visible');
    }

    // Initialize level
    const inits = {
      0: () => Level0.init(),
      1: () => Level1.init(),
      2: () => Level2.init(),
      3: () => Level3.init(),
      4: () => Level4.init(),
      5: () => Level5.init(),
      6: () => Level6.init(),
      7: () => Level7.init()
    };

    if (inits[num]) setTimeout(inits[num], 300);
  },

  async transition(toLevel) {
    AudioManager.playChime();
    Utils.vibrate([20]);

    const overlay = document.getElementById('transition-overlay');
    overlay.classList.add('active');

    await Utils.wait(500);
    this.showLevel(toLevel);
    await Utils.wait(300);
    overlay.classList.remove('active');
  },

  restart() {
    try { localStorage.removeItem('jilebi_progress'); } catch(e) {}
    this.progress = {};
    this.transition(0);
  }
};

/* ─── LEVEL 0 — THE GATE ─────────────────────────────── */
const Level0 = {
  init() {
    // Animate moon, candle already running via CSS
    this.runTextSequence();
  },

  async runTextSequence() {
    await Utils.wait(800);

    const lines = [
      { id: 'l0-line1', text: 'Some people enter quietly...', speed: 55 },
      { id: 'l0-line2', text: '...but stay forever in the heart.', speed: 55, delay: 1000 },
      { id: 'l0-line3', text: 'Happy Birthday, Jilebi 🌸', speed: 65, delay: 2200 },
      { id: 'l0-line4', text: 'This journey was made only for you.', speed: 45, delay: 3800 },
    ];

    for (const line of lines) {
      await Utils.wait(line.delay || 0);
      const el = document.getElementById(line.id);
      if (!el) continue;
      await new Promise(resolve => Utils.typewriter(el, line.text, line.speed, resolve));
    }

    await Utils.wait(600);

    // Show CTA
    const cta = document.getElementById('l0-cta');
    cta.style.opacity = '0';
    await Utils.fadeIn(cta, 800);

    cta.addEventListener('click', () => this.onBegin(), { once: true });
  },

  async onBegin() {
    Utils.vibrate([30]);
    AudioManager.playAmbient();

    const muteBtn = document.getElementById('mute-btn');
    muteBtn.classList.add('visible');

    await Utils.wait(200);
    LevelManager.transition(1);
  }
};

/* ─── LEVEL 1 — STAR GATE ────────────────────────────── */
const Level1 = {
  stars: [],
  caught: 0,
  target: 10,
  active: false,
  animFrame: null,

  init() {
    this.caught = 0;
    this.active = true;
    this.updateCounter();
    this.spawnStars();
  },

  updateCounter() {
    const el = document.getElementById('l1-counter');
    if (el) el.textContent = `✦ ${this.caught} / ${this.target}`;
  },

  spawnStars() {
    const container = document.getElementById('l1-stars-container');
    if (!container) return;
    container.innerHTML = '';
    this.stars = [];

    for (let i = 0; i < 18; i++) {
      setTimeout(() => {
        if (!this.active) return;
        this.spawnStar(container, i);
      }, i * 300);
    }
  },

  spawnStar(container, idx) {
    const star = document.createElement('div');
    star.className = 'game-star';
    star.innerHTML = '✦';
    star.style.color = `hsl(${40 + Math.random() * 20}, 80%, ${65 + Math.random() * 15}%)`;

    const startX = Utils.rand(5, 85);
    const startY = Utils.rand(15, 75);
    star.style.left = startX + 'vw';
    star.style.top = startY + 'vh';

    container.appendChild(star);

    // Organic float motion
    const speed = Utils.rand(0.4, 1.2);
    const phaseX = Utils.rand(0, Math.PI * 2);
    const phaseY = Utils.rand(0, Math.PI * 2);
    const ampX = Utils.rand(3, 8);
    const ampY = Utils.rand(2, 6);
    const baseX = startX;
    const baseY = startY;
    let startTime = Date.now();

    const animate = () => {
      if (!star.isConnected || star.classList.contains('caught')) return;
      const t = (Date.now() - startTime) * 0.001 * speed;
      const x = baseX + ampX * Math.sin(t + phaseX);
      const y = baseY + ampY * Math.cos(t * 0.7 + phaseY);
      star.style.left = x + 'vw';
      star.style.top = y + 'vh';
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    star.addEventListener('click', (e) => {
      e.stopPropagation();
      this.catchStar(star);
    });
    star.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.catchStar(star);
    }, { passive: false });

    this.stars.push(star);
  },

  catchStar(star) {
    if (!this.active || star.classList.contains('caught')) return;
    star.classList.add('caught');
    Utils.vibrate([25]);
    AudioManager.playStarCatch();

    // Sparkle effect
    this.sparkle(star);

    this.caught++;
    this.updateCounter();

    setTimeout(() => {
      if (star.isConnected) star.remove();
    }, 400);

    if (this.caught >= this.target) {
      this.active = false;
      setTimeout(() => this.unlock(), 500);
    }
  },

  sparkle(star) {
    const rect = star.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    for (let i = 0; i < 8; i++) {
      const p = document.createElement('div');
      p.style.cssText = `
        position:fixed; left:${cx}px; top:${cy}px;
        width:6px; height:6px; border-radius:50%;
        background:var(--gold); pointer-events:none;
        z-index:100; transform:translate(-50%,-50%);
      `;
      document.body.appendChild(p);

      const angle = (i / 8) * Math.PI * 2;
      const dist = Utils.rand(30, 60);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;

      p.animate([
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`, opacity: 0 }
      ], { duration: 500, easing: 'cubic-bezier(0.16,1,0.3,1)' }).onfinish = () => p.remove();
    }
  },

  async unlock() {
    // Open gate
    const gateL = document.getElementById('gate-door-left');
    const gateR = document.getElementById('gate-door-right');
    if (gateL) gateL.style.animation = 'gate-open-left 1.5s cubic-bezier(0.4,0,0.2,1) forwards';
    if (gateR) gateR.style.animation = 'gate-open-right 1.5s cubic-bezier(0.4,0,0.2,1) forwards';

    // Golden light
    const light = document.getElementById('l1-golden-light');
    if (light) light.classList.add('visible');

    await Utils.wait(1000);

    // Show unlock message
    const msg = document.getElementById('l1-unlock-msg');
    if (msg) msg.classList.add('visible');

    await Utils.wait(3200);
    LevelManager.transition(2);
  }
};

/* ─── LEVEL 2 — VIBE CONSTELLATION ──────────────────── */
const Level2 = {
  tapped: new Set(),
  total: 10,

  vibes: [
    {
      label: 'Introvert', emoji: '🌙',
      quote: 'She finds her loudest peace in the quietest rooms.',
      img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80&auto=format',
      color: 'rgba(155,109,255,0.3)'
    },
    {
      label: 'Deep Thinker', emoji: '📖',
      quote: 'She doesn\'t just look at things. She feels their weight.',
      img: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80&auto=format',
      color: 'rgba(201,123,176,0.3)'
    },
    {
      label: 'Soft Heart with Walls', emoji: '🏰',
      quote: 'Hard outside, because the inside is too precious to risk.',
      img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80&auto=format',
      color: 'rgba(232,201,125,0.25)'
    },
    {
      label: 'Late Night Energy', emoji: '✨',
      quote: '3 AM thoughts hit different. She knows.',
      img: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80&auto=format',
      color: 'rgba(155,109,255,0.25)'
    },
    {
      label: 'Emotional Chaos', emoji: '🌧️',
      quote: 'Feels everything. Hides half. Shares the rest in silences.',
      img: 'https://images.unsplash.com/photo-1439853949212-36589f9f7458?w=600&q=80&auto=format',
      color: 'rgba(100,150,255,0.25)'
    },
    {
      label: 'Comfort Person', emoji: '☕',
      quote: 'Some people are home. She\'s that for others.',
      img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80&auto=format',
      color: 'rgba(232,180,120,0.25)'
    },
    {
      label: 'Meaningful Soul', emoji: '🌸',
      quote: 'She collects feelings, not things.',
      img: 'https://images.unsplash.com/photo-1545843809-96a2a3f42cc3?w=600&q=80&auto=format',
      color: 'rgba(242,167,195,0.25)'
    },
    {
      label: 'Mountain Heart', emoji: '🏔️',
      quote: 'She was born to breathe thin air and wide skies.',
      img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80&auto=format',
      color: 'rgba(100,200,180,0.2)'
    },
    {
      label: 'Quiet but Strong', emoji: '🌊',
      quote: 'Silence is not emptiness. It\'s depth.',
      img: 'https://images.unsplash.com/photo-1439853949212-36589f9f7458?w=600&q=80&auto=format',
      color: 'rgba(155,109,255,0.2)'
    },
    {
      label: 'Peace Seeker', emoji: '🕯️',
      quote: 'She needs the kind of peace that doesn\'t need explaining.',
      img: 'https://images.unsplash.com/photo-1545843809-96a2a3f42cc3?w=600&q=80&auto=format',
      color: 'rgba(232,201,125,0.2)'
    }
  ],

  ambientQuotes: [
    'Pahadon wali peace 🏔️',
    'Some souls feel like home.',
    'Quiet hearts carry deep oceans.',
    'Late night talks hit different.',
    'Soft hearts are not weak. They\'re rare.'
  ],

  init() {
    this.tapped.clear();
    this.renderOrbs();
    this.renderAmbientQuotes();
    this.updateProgress();
  },

  renderOrbs() {
    const container = document.getElementById('l2-orb-container');
    if (!container) return;
    container.innerHTML = '';

    // Place orbs in a organic scattered layout
    const positions = [
      [15, 22], [65, 18], [38, 32], [80, 38], [10, 52],
      [55, 55], [28, 68], [72, 65], [42, 78], [85, 22]
    ];

    this.vibes.forEach((vibe, i) => {
      const orb = document.createElement('div');
      orb.className = 'vibe-orb';
      orb.dataset.idx = i;
      orb.style.setProperty('--orb-color', vibe.color);
      orb.style.setProperty('--float-dur', `${Utils.rand(5, 9)}s`);
      orb.style.setProperty('--float-delay', `-${Utils.rand(0, 5)}s`);
      orb.style.left = `${positions[i][0]}%`;
      orb.style.top = `${positions[i][1]}%`;

      orb.innerHTML = `
        <span class="vibe-orb-emoji">${vibe.emoji}</span>
        <span class="vibe-orb-label">${vibe.label}</span>
      `;

      orb.addEventListener('click', () => this.tapOrb(i, orb, vibe));
      orb.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.tapOrb(i, orb, vibe);
      }, { passive: false });

      container.appendChild(orb);
    });
  },

  renderAmbientQuotes() {
    const container = document.getElementById('l2-orb-container');
    this.ambientQuotes.forEach((q, i) => {
      const el = document.createElement('div');
      el.className = 'ambient-quote';
      el.textContent = q;
      el.style.left = `${Utils.rand(5, 80)}%`;
      el.style.top = `${Utils.rand(10, 85)}%`;
      el.style.setProperty('--float-dur', `${Utils.rand(6, 12)}s`);
      el.style.setProperty('--float-delay', `-${Utils.rand(0, 8)}s`);
      container.appendChild(el);
    });
  },

  tapOrb(i, orb, vibe) {
    if (this.tapped.has(i)) {
      this.showVibeCard(vibe);
      return;
    }

    this.tapped.add(i);
    orb.classList.add('tapped');
    Utils.vibrate([20]);
    AudioManager.playWhoosh();
    this.updateProgress();
    this.showVibeCard(vibe);

    if (this.tapped.size >= this.total) {
      setTimeout(() => this.unlock(), 1500);
    }
  },

  showVibeCard(vibe) {
    const overlay = document.getElementById('vibe-card-overlay');
    const img = document.getElementById('vibe-card-img');
    const label = document.getElementById('vibe-card-label');
    const quote = document.getElementById('vibe-card-quote');

    img.src = vibe.img;
    img.alt = vibe.label;
    label.textContent = `${vibe.emoji} ${vibe.label}`;
    quote.textContent = `"${vibe.quote}"`;

    overlay.classList.add('visible');

    const close = document.getElementById('vibe-card-close');
    close.onclick = () => overlay.classList.remove('visible');
    overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('visible'); };
  },

  updateProgress() {
    const el = document.getElementById('l2-progress');
    if (el) el.textContent = `${this.tapped.size} / ${this.total} unlocked`;
    const header = document.querySelector('#level-2 .l2-header p');
    if (header) header.textContent = `TAP EACH ORB TO UNLOCK · ${this.tapped.size} / ${this.total}`;
  },

  async unlock() {
    document.getElementById('vibe-card-overlay').classList.remove('visible');
    await Utils.wait(500);
    LevelManager.transition(3);
  }
};

/* ─── LEVEL 3 — DREAM PATH ───────────────────────────── */
const Level3 = {
  unlocked: new Set(),
  total: 5,

  destinations: [
    {
      name: 'Kedarnath',
      emoji: '⛰️',
      hint: 'The mountain that has been calling',
      img: 'https://images.unsplash.com/photo-1571400493526-8d33f0a31f3d?w=800&q=80&auto=format',
      text: 'For the mountain that has been calling your soul since before you knew why. One day you\'ll stand there. The cold will feel like coming home.',
    },
    {
      name: 'Teerth Yatra',
      emoji: '🪔',
      hint: 'The journey that feeds the soul',
      img: 'https://images.unsplash.com/photo-1545843809-96a2a3f42cc3?w=800&q=80&auto=format',
      text: 'For the journey that feeds something deeper than hunger. The ghats, the diyas, the sound of water carrying every prayer you never said aloud.',
    },
    {
      name: 'Pahad ka Ghar',
      emoji: '🏠',
      hint: 'A home where silence is the loudest sound',
      img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80&auto=format',
      text: 'A home where silence is the loudest sound. Where mornings smell like pine. Where the mountains are your walls and the sky is your ceiling.',
    },
    {
      name: 'Travelling',
      emoji: '🧭',
      hint: 'Walking toward everything',
      img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&auto=format',
      text: 'Not running away from something. Walking toward everything. Every road that turns into mist is an invitation — and she always accepts.',
    },
    {
      name: 'Peaceful Life',
      emoji: '🌅',
      hint: 'Not a place. A feeling.',
      img: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&q=80&auto=format',
      text: 'This is the destination. Not a place. A feeling she was always meant to live in. Still. Warm. Completely, finally hers.',
    }
  ],

  init() {
    this.unlocked.clear();
    this.render();
  },

  render() {
    const container = document.getElementById('l3-destinations');
    if (!container) return;
    container.innerHTML = '';

    this.destinations.forEach((dest, i) => {
      const el = document.createElement('div');
      el.className = 'destination-lantern';
      el.dataset.idx = i;

      el.innerHTML = `
        <div class="dest-lantern-icon" data-idx="${i}">${dest.emoji}</div>
        <div class="dest-info">
          <div class="dest-name">${dest.name}</div>
          <div class="dest-hint">${dest.hint}</div>
        </div>
        <div class="dest-status">🔒</div>
      `;

      el.addEventListener('click', () => this.tapDest(i, el, dest));
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.tapDest(i, el, dest);
      }, { passive: false });

      container.appendChild(el);

      // Animate in with stagger
      el.style.opacity = '0';
      el.style.transform = 'translateX(-20px)';
      setTimeout(() => {
        el.style.transition = 'all 0.5s cubic-bezier(0.16,1,0.3,1)';
        el.style.opacity = '1';
        el.style.transform = 'translateX(0)';
      }, i * 120 + 300);
    });
  },

  tapDest(i, el, dest) {
    Utils.vibrate([25]);
    AudioManager.playWhoosh();

    if (!this.unlocked.has(i)) {
      this.unlocked.add(i);
      el.classList.add('unlocked');
      const status = el.querySelector('.dest-status');
      if (status) status.textContent = '✦';
      const icon = el.querySelector('.dest-lantern-icon');
      if (icon) icon.classList.remove('locked');
    }

    this.showDestCard(dest);

    if (this.unlocked.size >= this.total) {
      setTimeout(() => this.unlock(), 1500);
    }
  },

  showDestCard(dest) {
    const overlay = document.getElementById('dest-card-overlay');
    const img = document.getElementById('dest-card-img');
    const title = document.getElementById('dest-card-title');
    const text = document.getElementById('dest-card-text');

    img.src = dest.img;
    img.alt = dest.name;
    title.textContent = `${dest.emoji} ${dest.name}`;
    text.textContent = dest.text;

    overlay.classList.add('visible');

    const close = document.getElementById('dest-card-close');
    close.onclick = () => overlay.classList.remove('visible');
    overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('visible'); };
  },

  async unlock() {
    document.getElementById('dest-card-overlay').classList.remove('visible');

    // Flash all items gold
    document.querySelectorAll('.destination-lantern').forEach(el => {
      el.style.borderColor = 'rgba(232,201,125,0.6)';
      el.style.background = 'rgba(232,201,125,0.08)';
    });

    await Utils.wait(800);

    // Transition message
    const overlay = document.getElementById('transition-overlay');
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.flexDirection = 'column';
    overlay.style.gap = '12px';
    overlay.classList.add('active');

    overlay.innerHTML = `
      <div style="font-family:var(--font-display);font-size:clamp(1.4rem,4vw,2rem);color:var(--cream);text-align:center;padding:0 24px;font-weight:300;opacity:0;transition:opacity 0.8s;">
        She carries her whole world inside her.
      </div>
    `;

    await Utils.wait(300);
    const msg = overlay.querySelector('div');
    if (msg) msg.style.opacity = '1';

    await Utils.wait(2500);
    overlay.innerHTML = '';
    overlay.style.display = '';
    overlay.style.alignItems = '';
    overlay.style.justifyContent = '';
    overlay.style.flexDirection = '';
    overlay.style.gap = '';

    LevelManager.showLevel(4);
    overlay.classList.remove('active');
  }
};

/* ─── LEVEL 4 — MEMORY CONSTELLATION ────────────────── */
const Level4 = {
  canvas: null,
  ctx: null,
  stars: [],
  tapped: new Set(),
  lines: [],
  target: 15,
  animFrame: null,
  activePopup: null,

  notes: [
    'The way you go quiet and the world somehow understands.',
    'Your random reels at midnight that somehow hit perfectly.',
    'The emoji you use when words feel too small.',
    'Teaching Hindi like it\'s the most natural thing.',
    'That 3 AM comfort energy — real and rare.',
    'The way your silences say more than most people\'s words.',
    'Your soft chaos — adorable and deep at the same time.',
    'The mountains you carry in your chest all year long.',
    'Your emotional safety — the kind people search years for.',
    'That calm you radiate when everything else is loud.',
    'The tea, the window, the rain — your whole aesthetic.',
    'How you feel things fully, even when you don\'t say them.',
    'Late night wandering thoughts you never share but treasure.',
    'The way certain songs just ARE you.',
    'Your kindness that asks for nothing in return.',
    'The version of peace you\'re still building for yourself.',
    'Small rituals that mean everything to you and nothing to others.',
    'The dreams you hold quietly — Kedarnath, the mountains, home.',
    'The part of you that knows someday, it will all make sense.',
    'The rare energy that makes people feel safe near you.'
  ],

  init() {
    this.canvas = document.getElementById('constellation-canvas');
    if (!this.canvas) return;

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx = this.canvas.getContext('2d');

    this.tapped.clear();
    this.lines = [];
    this.stars = [];
    this.activePopup = null;

    this.createStars();
    this.animate();

    this.canvas.addEventListener('click', (e) => this.onCanvasClick(e));
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.onCanvasClick(e.touches[0]);
    }, { passive: false });

    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    });
  },

  createStars() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const topPad = 100;
    const bottomPad = 80;

    for (let i = 0; i < 20; i++) {
      this.stars.push({
        x: Utils.rand(w * 0.05, w * 0.95),
        y: Utils.rand(topPad, h - bottomPad),
        r: Utils.rand(3, 7),
        brightness: Utils.rand(0.4, 1),
        phase: Utils.rand(0, Math.PI * 2),
        speed: Utils.rand(0.5, 1.5),
        note: this.notes[i % this.notes.length],
        tapped: false,
        glowColor: `hsl(${Utils.rand(35, 55)}, 80%, 70%)`
      });
    }
  },

  animate() {
    if (!this.canvas || !this.ctx) return;
    const { ctx, canvas, stars } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const t = Date.now() * 0.001;

    // Draw constellation lines
    ctx.strokeStyle = 'rgba(232,201,125,0.2)';
    ctx.lineWidth = 0.8;
    this.lines.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(stars[a].x, stars[a].y);
      ctx.lineTo(stars[b].x, stars[b].y);
      ctx.stroke();
    });

    // Draw stars
    stars.forEach((s, i) => {
      const pulse = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
      const alpha = s.tapped ? 1 : 0.3 + 0.5 * pulse;
      const radius = s.tapped ? s.r * 1.4 : s.r;

      // Outer glow
      const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, radius * 4);
      grd.addColorStop(0, `rgba(232,201,125,${alpha * 0.4})`);
      grd.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(s.x, s.y, radius * 4, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Core star
      ctx.beginPath();
      ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = s.tapped
        ? `rgba(232,201,125,${alpha})`
        : `rgba(253,246,236,${alpha})`;
      ctx.fill();

      // Draw 4-pointed star shape for untapped
      if (!s.tapped) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.fillStyle = `rgba(253,246,236,${alpha * 0.6})`;
        for (let p = 0; p < 4; p++) {
          ctx.rotate(Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(radius * 0.4, radius * 1.8);
          ctx.lineTo(0, radius * 1.4);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
    });

    this.animFrame = requestAnimationFrame(() => this.animate());
  },

  onCanvasClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX || e.pageX) - rect.left;
    const y = (e.clientY || e.pageY) - rect.top;

    // Remove existing popup
    if (this.activePopup) {
      this.activePopup.remove();
      this.activePopup = null;
    }

    // Check for star hit (using enlarged hit area)
    const hitRadius = 40;
    let hit = -1;
    let minDist = Infinity;

    this.stars.forEach((s, i) => {
      const dist = Math.hypot(x - s.x, y - s.y);
      if (dist < hitRadius && dist < minDist) {
        minDist = dist;
        hit = i;
      }
    });

    if (hit === -1) return;

    const star = this.stars[hit];

    if (!star.tapped) {
      star.tapped = true;
      this.tapped.add(hit);
      Utils.vibrate([20]);
      AudioManager.playStarCatch();

      // Draw line to last tapped star
      const prevTapped = [...this.tapped].filter(i => i !== hit);
      if (prevTapped.length > 0) {
        const prev = prevTapped[prevTapped.length - 1];
        this.lines.push([prev, hit]);
      }

      this.updateProgress();

      if (this.tapped.size >= this.target) {
        setTimeout(() => this.showFinalMessage(), 1000);
      }
    }

    // Show note popup
    this.showNote(star);
  },

  showNote(star) {
    const popup = document.createElement('div');
    popup.className = 'star-note-popup';
    popup.textContent = star.note;

    // Position popup near star but keep in bounds
    const level = document.getElementById('level-4');
    let px = star.x - 110;
    let py = star.y - 100;

    px = Math.max(10, Math.min(px, window.innerWidth - 240));
    py = Math.max(10, Math.min(py, window.innerHeight - 120));

    popup.style.left = px + 'px';
    popup.style.top = py + 'px';

    level.appendChild(popup);
    this.activePopup = popup;

    setTimeout(() => {
      if (popup.isConnected) {
        popup.style.transition = 'opacity 0.5s';
        popup.style.opacity = '0';
        setTimeout(() => popup.remove(), 500);
        if (this.activePopup === popup) this.activePopup = null;
      }
    }, 2800);
  },

  updateProgress() {
    const el = document.getElementById('l4-progress');
    if (el) el.textContent = `${this.tapped.size} / ${this.target} stars discovered`;
  },

  async showFinalMessage() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }

    const msg = document.getElementById('l4-final-msg');
    if (msg) msg.classList.add('visible');

    await Utils.wait(3500);
    LevelManager.transition(5);
  }
};

/* ─── GAME ENGINE (Level 5) ──────────────────────────── */
const GameEngine = {
  completed: new Set(),
  total: 5,
  heartsCount: 0,
  heartsTarget: 15,
  heartsAnimFrame: null,
  catCount: 0,
  houseChoices: { roof: null, view: null, mood: null },
  moodAnswers: [],
  moodQuestion: 0,

  moodQuestions: [
    {
      q: 'Right now you feel like...',
      opts: ['🌧️ Rain', '🌙 Midnight calm', '🔥 Quiet fire', '🌸 Just existing']
    },
    {
      q: 'Your perfect Saturday is...',
      opts: ['☕ Tea + window', '📱 Reels + blanket', '🏔️ Somewhere high', '😶 Alone & unbothered']
    },
    {
      q: 'When you\'re sad, you...',
      opts: ['🔇 Go quiet', '📖 Read or scroll', '🎵 Listen on repeat', '😴 Sleep it off']
    },
    {
      q: 'Your mood in one word...',
      opts: ['✨ Soft', '🌪️ Chaotic', '🌊 Deep', '🌫️ Foggy']
    },
    {
      q: 'You are most yourself when...',
      opts: ['Nobody\'s watching', 'With one close person', 'In a new place', 'In silence']
    }
  ],

  moodResults: [
    {
      title: 'Mountain Mode',
      emoji: '🏔️',
      desc: 'You\'re in your peak form — still, grounded, and unreachable by noise. Save this energy.'
    },
    {
      title: 'Tea & Feelings Mode',
      emoji: '☕',
      desc: 'Cozy chaos inside, calm outside. The perfect Jilebi blend.'
    },
    {
      title: 'Soft Chaos Mode',
      emoji: '🌸',
      desc: 'You\'re feeling everything at once and somehow making it adorable.'
    },
    {
      title: '3AM Philosopher Mode',
      emoji: '🌙',
      desc: 'Deep thoughts, deeper silences. The kind of person who texts 3 AM wisdom and means it.'
    },
    {
      title: 'Quiet Fire Mode',
      emoji: '🔥',
      desc: 'Still on the outside, absolutely burning with feeling on the inside. You contain multitudes.'
    }
  ],

  openMiniGame(type) {
    const el = document.getElementById(`game-${type}`);
    if (!el) return;
    el.classList.add('visible');

    if (type === 'hearts') this.startHearts();
    if (type === 'cat') this.startCat();
    if (type === 'mood') this.startMood();
    if (type === 'overthink') this.setupOverthink();
    if (type === 'house') this.setupHouse();
  },

  closeMiniGame(type) {
    const el = document.getElementById(`game-${type}`);
    if (el) el.classList.remove('visible');

    if (type === 'hearts' && this.heartsAnimFrame) {
      cancelAnimationFrame(this.heartsAnimFrame);
      this.heartsAnimFrame = null;
    }
  },

  markDone(type) {
    this.closeMiniGame(type);
    this.completed.add(type);
    const card = document.getElementById(`card-${type}`);
    if (card) card.classList.add('done');
    this.updateProgress();

    if (this.completed.size >= this.total) {
      setTimeout(() => this.unlockLevel5(), 800);
    }
  },

  updateProgress() {
    const el = document.getElementById('l5-progress');
    if (el) el.textContent = `${this.completed.size} / ${this.total} games played`;
  },

  // Hearts game
  startHearts() {
    this.heartsCount = 0;
    const counter = document.getElementById('hearts-counter');
    const arena = document.getElementById('hearts-arena');
    const quote = document.getElementById('hearts-quote');
    const doneBtn = document.getElementById('hearts-done-btn');
    if (counter) counter.textContent = '0';
    if (quote) quote.style.display = 'none';
    if (doneBtn) doneBtn.style.display = 'none';
    if (arena) arena.innerHTML = '';

    const spawnHeart = () => {
      if (!document.getElementById('game-hearts').classList.contains('visible')) return;
      if (this.heartsCount >= this.heartsTarget) return;

      const heart = document.createElement('div');
      heart.className = 'falling-heart';
      const emojis = ['💕', '💖', '💗', '🌸', '✨'];
      heart.textContent = emojis[Utils.randInt(0, emojis.length - 1)];
      heart.style.left = Utils.rand(5, 80) + '%';
      const dur = Utils.rand(2.5, 5);
      heart.style.setProperty('--fall-dur', `${dur}s`);
      heart.style.animationDuration = `${dur}s`;
      heart.style.color = `hsl(${Utils.rand(320, 360)}, 80%, 70%)`;

      heart.addEventListener('click', () => {
        if (heart.dataset.caught) return;
        heart.dataset.caught = '1';
        heart.style.animation = 'star-burst 0.3s forwards';
        this.heartsCount++;
        Utils.vibrate([15]);
        AudioManager.playStarCatch();
        if (counter) counter.textContent = this.heartsCount;
        setTimeout(() => heart.remove(), 300);

        if (this.heartsCount >= this.heartsTarget) {
          if (quote) quote.style.display = 'block';
          if (doneBtn) doneBtn.style.display = '';
        }
      });

      if (arena) arena.appendChild(heart);
      setTimeout(() => { if (heart.isConnected) heart.remove(); }, dur * 1000);
      setTimeout(spawnHeart, Utils.rand(400, 900));
    };

    spawnHeart();
  },

  // Overthink slider
  setupOverthink() {
    const slider = document.getElementById('overthink-slider');
    const label = document.getElementById('overthink-label');
    const char = document.getElementById('mountain-char');
    const quote = document.getElementById('overthink-quote');
    const doneBtn = document.getElementById('overthink-done-btn');

    const labels = [
      'Zero. Totally fine. Totally.',
      'A little... maybe a lot.',
      'Quite a lot, actually.',
      'It\'s a whole drama up there.',
      'Jilebi Mode: ON 🌀'
    ];
    const chars = ['🏔️', '🤔', '💭', '🌪️', '🌀'];

    if (slider) {
      slider.value = 0;
      if (label) label.textContent = 'Slide to reveal...';
      if (char) char.textContent = '🏔️';
      if (quote) quote.style.display = 'none';

      slider.oninput = () => {
        const v = parseInt(slider.value);
        if (label) label.textContent = labels[v];
        if (char) {
          char.style.transform = 'scale(1.2)';
          char.textContent = chars[v];
          setTimeout(() => { char.style.transform = 'scale(1)'; }, 200);
        }
        if (v >= 3) {
          if (quote) quote.style.display = 'block';
        }
      };
    }
  },

  // Cat game
  startCat() {
    this.catCount = 0;
    const counter = document.getElementById('cat-counter');
    const arena = document.getElementById('cat-arena');
    const cat = document.getElementById('game-cat-emoji');
    const quote = document.getElementById('cat-quote');
    const doneBtn = document.getElementById('cat-done-btn');

    if (counter) counter.textContent = '0 / 5';
    if (quote) quote.style.display = 'none';
    if (doneBtn) doneBtn.style.display = 'none';

    if (!cat || !arena) return;

    const catReactions = ['🐱', '😸', '🙀', '😻', '🐾', '💕'];
    let reactionIdx = 0;

    const movecat = () => {
      const arenaRect = arena.getBoundingClientRect();
      const maxX = arenaRect.width - 60;
      const maxY = arenaRect.height - 60;
      cat.style.transition = `all ${Utils.rand(0.3, 0.6)}s cubic-bezier(0.34,1.56,0.64,1)`;
      cat.style.left = Utils.rand(5, maxX > 10 ? maxX : 80) + 'px';
      cat.style.top = Utils.rand(5, maxY > 10 ? maxY : 80) + 'px';
    };

    movecat();
    const moveInterval = setInterval(() => {
      if (!document.getElementById('game-cat').classList.contains('visible')) {
        clearInterval(moveInterval);
        return;
      }
      movecat();
    }, 900);

    const tap = () => {
      if (this.catCount >= 5) return;
      this.catCount++;
      Utils.vibrate([20]);
      AudioManager.playStarCatch();
      cat.textContent = catReactions[reactionIdx++ % catReactions.length];
      if (counter) counter.textContent = `${this.catCount} / 5`;
      cat.style.transform = 'scale(1.4) rotate(10deg)';
      setTimeout(() => { cat.style.transform = 'scale(1) rotate(0deg)'; }, 300);

      if (this.catCount >= 5) {
        clearInterval(moveInterval);
        if (quote) quote.style.display = 'block';
        if (doneBtn) doneBtn.style.display = '';
      } else {
        movecat();
      }
    };

    cat.onclick = tap;
    cat.ontouchstart = (e) => { e.preventDefault(); tap(); };
  },

  // House builder
  setupHouse() {
    this.houseChoices = { roof: null, view: null, mood: null };
    const preview = document.getElementById('house-preview');
    const quote = document.getElementById('house-quote');
    const doneBtn = document.getElementById('house-done-btn');
    if (preview) preview.textContent = '🏠';
    if (quote) quote.style.display = 'none';
    if (doneBtn) doneBtn.style.display = 'none';

    document.querySelectorAll('.house-choice-btn').forEach(btn => {
      btn.classList.remove('selected');
      btn.onclick = () => {
        const group = btn.dataset.group;
        document.querySelectorAll(`.house-choice-btn[data-group="${group}"]`)
          .forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.houseChoices[group] = btn.dataset.val;
        this.updateHousePreview();
      };
    });
  },

  updateHousePreview() {
    const { roof, view, mood } = this.houseChoices;
    const preview = document.getElementById('house-preview');
    const quote = document.getElementById('house-quote');
    const doneBtn = document.getElementById('house-done-btn');

    const roofEmoji = roof ? roof.split(' ')[0] : '🏠';
    const viewEmoji = view ? view.split(' ')[0] : '';
    const moodEmoji = mood ? mood.split(' ')[0] : '';

    if (preview) preview.textContent = `${roofEmoji}${viewEmoji}${moodEmoji}`;

    if (roof && view && mood) {
      if (quote) quote.style.display = 'block';
      if (doneBtn) doneBtn.style.display = '';
    }
  },

  // Mood quiz
  startMood() {
    this.moodAnswers = [];
    this.moodQuestion = 0;
    const result = document.getElementById('mood-result');
    const doneBtn = document.getElementById('mood-done-btn');
    if (result) result.style.display = 'none';
    if (doneBtn) doneBtn.style.display = 'none';
    this.showMoodQuestion();
  },

  showMoodQuestion() {
    const q = this.moodQuestions[this.moodQuestion];
    const title = document.getElementById('mood-title');
    const sub = document.getElementById('mood-sub');
    const qEl = document.getElementById('mood-question');
    const opts = document.getElementById('mood-options');

    if (title) title.textContent = 'Which Jilebi Today? ✨';
    if (sub) sub.textContent = `QUESTION ${this.moodQuestion + 1} OF ${this.moodQuestions.length}`;
    if (qEl) qEl.textContent = q.q;

    if (opts) {
      opts.innerHTML = '';
      q.opts.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'mood-option-btn';
        btn.textContent = opt;
        btn.onclick = () => this.moodAnswer(i);
        opts.appendChild(btn);
      });
    }
  },

  async moodAnswer(choice) {
    this.moodAnswers.push(choice);
    this.moodQuestion++;

    if (this.moodQuestion < this.moodQuestions.length) {
      const qEl = document.getElementById('mood-question');
      const opts = document.getElementById('mood-options');
      if (qEl) { qEl.style.opacity = '0'; }
      if (opts) { opts.style.opacity = '0'; }
      await Utils.wait(200);
      this.showMoodQuestion();
      if (qEl) { qEl.style.transition = 'opacity 0.3s'; qEl.style.opacity = '1'; }
      if (opts) { opts.style.transition = 'opacity 0.3s'; opts.style.opacity = '1'; }
    } else {
      this.showMoodResult();
    }
  },

  showMoodResult() {
    const opts = document.getElementById('mood-options');
    const qEl = document.getElementById('mood-question');
    const sub = document.getElementById('mood-sub');
    const result = document.getElementById('mood-result');
    const doneBtn = document.getElementById('mood-done-btn');

    if (opts) opts.innerHTML = '';
    if (qEl) qEl.textContent = '';
    if (sub) sub.textContent = 'AND THE VERDICT IS...';

    // Pick result based on most common answer type
    const idx = this.moodAnswers.reduce((a, b) => a + b, 0) % this.moodResults.length;
    const res = this.moodResults[idx];

    const emojiEl = document.getElementById('mood-result-emoji');
    const titleEl = document.getElementById('mood-result-title');
    const descEl = document.getElementById('mood-result-desc');

    if (emojiEl) emojiEl.textContent = res.emoji;
    if (titleEl) titleEl.textContent = res.title;
    if (descEl) descEl.textContent = res.desc;

    if (result) result.style.display = 'block';
    if (doneBtn) doneBtn.style.display = '';
  },

  async unlockLevel5() {
    // Confetti burst
    this.confetti();
    await Utils.wait(1500);
    LevelManager.transition(6);
  },

  confetti() {
    const emojis = ['🌸', '✨', '💕', '🌟', '🏔️', '🌙', '⭐'];
    for (let i = 0; i < 40; i++) {
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        el.textContent = emojis[Utils.randInt(0, emojis.length - 1)];
        el.style.left = Utils.rand(5, 95) + 'vw';
        el.style.top = '-20px';
        el.style.setProperty('--fall-dur', `${Utils.rand(2.5, 5)}s`);
        el.style.animationDelay = `0s`;
        el.style.opacity = '1';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 5500);
      }, i * 80);
    }
  }
};

// Make GameEngine globally accessible (for inline onclick handlers in HTML)
window.GameEngine = GameEngine;

/* ─── LEVEL 6 — THE LETTER ───────────────────────────── */
const Level6 = {
  letterLines: [
    { text: 'Jilebi,', cls: 'greeting' },
    { text: '', cls: 'blank' },
    { text: 'You don\'t always have to be okay.', cls: '' },
    { text: 'You don\'t always have to explain yourself.', cls: '' },
    { text: 'You don\'t always have to carry everything quietly.', cls: '' },
    { text: '', cls: 'blank' },
    { text: 'But I think you do anyway.', cls: 'indent' },
    { text: 'And that\'s what makes you, you.', cls: 'indent' },
    { text: '', cls: 'blank' },
    { text: 'The world doesn\'t always understand people like you —', cls: '' },
    { text: 'the ones who feel deeply, love quietly, and dream of mountains.', cls: 'indent' },
    { text: '', cls: 'blank' },
    { text: 'Your softness is not a weakness.', cls: '' },
    { text: 'It is the rarest kind of strength.', cls: '' },
    { text: '', cls: 'blank' },
    { text: 'I hope one day — not someday, but one day soon —', cls: '' },
    { text: 'you find yourself sitting somewhere high and quiet.', cls: 'indent' },
    { text: 'No noise. No expectations.', cls: 'indent' },
    { text: 'Just you, the sky, and a cup of tea.', cls: 'indent' },
    { text: '', cls: 'blank' },
    { text: 'I hope Kedarnath happens.', cls: '' },
    { text: 'I hope the pahad ka ghar happens.', cls: '' },
    { text: 'I hope the Teerth Yatra happens.', cls: '' },
    { text: 'I hope every version of peace you have ever imagined — happens.', cls: '' },
    { text: '', cls: 'blank' },
    { text: 'Because you deserve the mornings that feel like prayers.', cls: '' },
    { text: 'You deserve the roads that feel like freedom.', cls: '' },
    { text: 'You deserve the kind of life that feels like', cls: '' },
    { text: 'a breath you\'ve been holding for too long.', cls: 'indent' },
    { text: '', cls: 'blank' },
    { text: 'Happy Birthday, Jilebi.', cls: 'sign-off' },
    { text: 'Not just for today —', cls: 'sign-off' },
    { text: 'but for every soft, deep, beautiful version of you', cls: 'sign-off' },
    { text: 'that has ever existed,', cls: 'sign-off' },
    { text: 'and every version still to come.', cls: 'sign-off' },
    { text: '', cls: 'blank' },
    { text: 'May this year be the one that begins to feel like yours.', cls: 'sign-off' },
  ],

  init() {
    this.renderLetter();
  },

  async renderLetter() {
    const paper = document.getElementById('l6-paper');
    if (!paper) return;

    // Clear existing lines (keep seal at end)
    const seal = document.getElementById('l6-seal');
    paper.innerHTML = '';
    if (seal) paper.appendChild(seal);

    // Insert lines before seal
    const fragment = document.createDocumentFragment();
    const lineEls = [];

    this.letterLines.forEach((line, i) => {
      const el = document.createElement('span');
      el.className = `letter-line ${line.cls}`;
      if (line.text) el.textContent = '\u00A0'; // Non-breaking space placeholder
      fragment.appendChild(el);
      lineEls.push({ el, line });
    });

    paper.insertBefore(fragment, seal);

    // Reveal lines one by one with ink-drop effect
    for (let i = 0; i < lineEls.length; i++) {
      const { el, line } = lineEls[i];

      await Utils.wait(line.cls === 'blank' ? 200 : 180);

      el.style.animation = 'ink-drop 0.5s cubic-bezier(0.16,1,0.3,1) forwards';
      if (line.text) el.textContent = line.text;

      // Auto-scroll to keep current line visible
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Show seal
    await Utils.wait(800);
    if (seal) seal.classList.add('visible');

    await Utils.wait(1200);

    // Show continue button
    const btn = document.getElementById('l6-continue');
    if (btn) btn.classList.add('visible');
  }
};

/* ─── LEVEL 7 — FINAL CINEMATIC ──────────────────────── */
const Level7 = {
  init() {
    this.runCinematic();
  },

  async runCinematic() {
    // Scene 1: Mountain Snowfall
    await this.showScene('scene-1', 5000, () => this.createSnow());

    // Scene 2: Lanterns Rising
    await this.showScene('scene-2', 9000, () => this.launchLanterns());

    // Scene 3: Moonlight
    await this.showScene('scene-3', 4500, () => this.sparkleStars());

    // Scene 4: Final Quote
    await this.showScene('scene-4', 0, () => this.finalQuote());
  },

  showScene(id, duration, onShow) {
    return new Promise(async resolve => {
      const scene = document.getElementById(id);
      if (!scene) { resolve(); return; }

      scene.classList.add('active');
      if (onShow) onShow();

      if (duration > 0) {
        await Utils.wait(duration);
        scene.style.transition = 'opacity 1.2s';
        scene.style.opacity = '0';
        await Utils.wait(1200);
        scene.classList.remove('active');
        scene.style.opacity = '';
        scene.style.transition = '';
      }
      resolve();
    });
  },

  createSnow() {
    const container = document.getElementById('snowfall-container');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < 60; i++) {
      const snow = document.createElement('div');
      snow.className = 'snow-particle';
      snow.textContent = '•';
      snow.style.left = Utils.rand(0, 100) + 'vw';
      snow.style.fontSize = Utils.rand(4, 12) + 'px';
      const dur = Utils.rand(4, 9);
      snow.style.setProperty('--snow-dur', `${dur}s`);
      snow.style.animationDuration = `${dur}s`;
      snow.style.animationDelay = `${Utils.rand(0, 5)}s`;
      container.appendChild(snow);
    }
  },

  launchLanterns() {
    const container = document.getElementById('lanterns-container');
    if (!container) return;
    container.innerHTML = '';

    const lanternEmojis = ['🏮', '🕯️', '✨', '⭐', '🌟'];

    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        const l = document.createElement('div');
        l.className = 'lantern';
        l.textContent = lanternEmojis[i % lanternEmojis.length];
        l.style.left = Utils.rand(5, 90) + 'vw';
        const dur = Utils.rand(8, 14);
        l.style.setProperty('--rise-dur', `${dur}s`);
        l.style.animationDuration = `${dur}s`;
        l.style.fontSize = Utils.rand(24, 44) + 'px';
        container.appendChild(l);
      }, i * 500);
    }
  },

  sparkleStars() {
    const container = document.getElementById('scene3-stars');
    if (!container) return;

    for (let i = 0; i < 40; i++) {
      setTimeout(() => {
        const s = document.createElement('div');
        s.style.cssText = `
          position:absolute;
          left:${Utils.rand(2, 98)}%;
          top:${Utils.rand(5, 90)}%;
          color:white;
          font-size:${Utils.rand(6, 16)}px;
          animation:twinkle ${Utils.rand(2, 5)}s ease-in-out infinite;
          animation-delay:${Utils.rand(0, 2)}s;
        `;
        s.textContent = '✦';
        container.appendChild(s);
      }, i * 100);
    }
  },

  async finalQuote() {
    const lines = [
      { id: 'fq-1', delay: 800 },
      { id: 'fq-2', delay: 2200 },
      { id: 'fq-3', delay: 4200 },
      { id: 'fq-4', delay: 6200 }
    ];

    for (const { id, delay } of lines) {
      await Utils.wait(delay);
      const el = document.getElementById(id);
      if (el) {
        el.style.transition = 'opacity 1.2s ease';
        el.style.opacity = '1';
      }
    }

    // Rising lantern → star transformation
    await Utils.wait(8000);
    const lantern = document.getElementById('rising-lantern');
    if (lantern) {
      lantern.style.transition = 'opacity 0.5s';
      lantern.style.opacity = '1';
      setTimeout(() => {
        lantern.textContent = '⭐';
        lantern.style.filter = 'drop-shadow(0 0 20px gold)';
      }, 4000);
    }

    // Fade to black
    await Utils.wait(10000);
    const scene4 = document.getElementById('scene-4');
    if (scene4) {
      scene4.style.transition = 'opacity 3s';
      scene4.style.opacity = '0.3';
    }

    // Show restart
    await Utils.wait(2000);
    const restartBtn = document.getElementById('final-restart-btn');
    if (restartBtn) restartBtn.classList.add('visible');
  }
};

/* ─── EASTER EGG ─────────────────────────────────────── */
const EasterEgg = {
  taps: 0,
  timer: null,

  init() {
    const moon = document.getElementById('easter-moon');
    if (!moon) return;

    moon.addEventListener('click', () => {
      this.taps++;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => { this.taps = 0; }, 2000);

      if (this.taps >= 3) {
        this.taps = 0;
        const msg = document.getElementById('easter-msg');
        if (msg) {
          msg.classList.add('visible');
          setTimeout(() => msg.classList.remove('visible'), 4000);
        }
      }
    });
  }
};

/* ─── MAIN INIT ──────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', async () => {
  // Hide loading screen after brief delay
  await Utils.wait(800);
  const loading = document.getElementById('loading-screen');
  if (loading) {
    loading.style.transition = 'opacity 0.6s';
    loading.style.opacity = '0';
    setTimeout(() => loading.remove(), 600);
  }

  // Initialize subsystems
  ParticleSystem.init();
  AudioManager.init();
  EasterEgg.init();

  // Make LevelManager globally accessible
  window.LevelManager = LevelManager;

  // Start
  LevelManager.init();
});

// Handle visibility change (pause/resume ambient)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (AudioManager.masterGain && !AudioManager.muted) {
      AudioManager.masterGain.gain.setTargetAtTime(0, AudioManager.ctx.currentTime, 0.5);
    }
  } else {
    if (AudioManager.started && !AudioManager.muted && AudioManager.masterGain) {
      AudioManager.masterGain.gain.setTargetAtTime(AudioManager.volume, AudioManager.ctx.currentTime, 0.5);
    }
  }
});

'use strict';

const IMG = {
  kedarnath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/The_kedarnath_temple_and_himalyas_.jpg/1280px-The_kedarnath_temple_and_himalyas_.jpg',
  house: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/House_in_the_Himalayas.jpg/1280px-House_in_the_Himalayas.jpg',
  flags: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Colorful_Prayer_Flags_%28Unsplash%29.jpg/1280px-Colorful_Prayer_Flags_%28Unsplash%29.jpg',
  night: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80',
  tea: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1400&q=80',
  rain: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1400&q=80',
  room: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1400&q=80',
  road: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1500&q=80',
  mountains: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1500&q=80',
  sky: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1500&q=80'
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// ─── Birthday Detection ───────────────────────────────────────────────
const Birthday = {
  isToday() {
    const now = new Date();
    return now.getMonth() === 4 && now.getDate() === 21; // May 21
  },
  age() {
    return new Date().getFullYear() - 2006;
  }
};

// ─── Utils ────────────────────────────────────────────────────────────
const Utils = {
  rand(min, max) { return Math.random() * (max - min) + min; },
  randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
  wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); },
  vibrate(pattern = [25]) { if (navigator.vibrate) navigator.vibrate(pattern); },

  typewriter(el, text, speed = 42, token) {
    return new Promise(resolve => {
      if (!el) { resolve(); return; }
      el.textContent = '';
      el.style.opacity = '1';
      let i = 0;
      const tick = () => {
        if (token && token.cancelled) { resolve(); return; }
        el.textContent = text.slice(0, i);
        i += 1;
        if (i <= text.length) setTimeout(tick, speed);
        else resolve();
      };
      tick();
    });
  },

  setImage(img, src, alt) {
    if (!img) return;
    img.classList.remove('image-failed');
    img.alt = alt || '';
    img.onerror = () => {
      img.removeAttribute('src');
      img.alt = `${alt || 'Image'} could not load`;
      img.classList.add('image-failed');
    };
    img.src = src;
  },

  saveProgressPatch(patch) {
    Object.assign(LevelManager.progress, patch);
    LevelManager.save();
  }
};

// ─── Image Preloader ──────────────────────────────────────────────────
const ImagePreloader = {
  preload() {
    Object.values(IMG).forEach(src => {
      const image = new Image();
      image.decoding = 'async';
      image.src = src;
    });
  }
};

// ─── Shooting Stars ───────────────────────────────────────────────────
const ShootingStars = {
  timer: null,
  active: false,

  start() {
    this.active = true;
    this.schedule();
  },

  stop() {
    this.active = false;
    clearTimeout(this.timer);
  },

  schedule() {
    if (!this.active) return;
    const delay = Utils.rand(4000, 9000);
    this.timer = setTimeout(() => {
      this.shoot();
      this.schedule();
    }, delay);
  },

  shoot() {
    const container = $('#shooting-stars-container');
    if (!container) return;
    const star = document.createElement('div');
    star.className = 'shooting-star';
    star.style.top = `${Utils.rand(4, 42)}vh`;
    star.style.left = `${Utils.rand(15, 75)}vw`;
    star.style.setProperty('--ss-angle', `${Utils.rand(-38, -22)}deg`);
    star.style.setProperty('--ss-len', `${Utils.rand(90, 160)}px`);
    container.appendChild(star);
    setTimeout(() => star.remove(), 900);
  }
};

// ─── Audio Manager ────────────────────────────────────────────────────
const AudioManager = {
  muted: false,
  started: false,
  ready: false,
  volume: 0.26,
  oscillators: [],

  init() {
    this.button = $('#mute-btn');
    this.button.addEventListener('click', () => this.toggleMute());
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0;
      this.masterGain.connect(this.ctx.destination);
      this.ready = true;
    } catch (err) { this.ready = false; }
  },

  async start() {
    if (!this.ready || this.started) return;
    this.started = true;
    try {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      const freqs = [98, 146.83, 196, 220, 293.66];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const pan = this.ctx.createStereoPanner();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        osc.type = idx % 2 ? 'triangle' : 'sine';
        osc.frequency.value = freq;
        lfo.frequency.value = 0.035 + idx * 0.013;
        lfoGain.gain.value = freq * 0.004;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        gain.gain.value = 0.012 - idx * 0.0012;
        pan.pan.value = (idx - 2) * 0.18;
        osc.connect(gain);
        gain.connect(pan);
        pan.connect(this.masterGain);
        osc.start(); lfo.start();
        this.oscillators.push(osc, lfo);
      });
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(this.volume * 0.4, this.ctx.currentTime + 4);
      this.masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 12);
    } catch (err) { this.ready = false; }
  },

  toggleMute() {
    this.muted = !this.muted;
    this.button.textContent = this.muted ? 'off' : '\u266b';
    if (this.ready && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.22);
    }
  },

  chime(kind = 'soft') {
    if (!this.ready || this.muted) return;
    try {
      const now = this.ctx.currentTime;
      const gain = this.ctx.createGain();
      const osc = this.ctx.createOscillator();
      const high = kind === 'unlock' ? 1174.66 : 880;
      const low = kind === 'deep' ? 246.94 : 440;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(high, now);
      osc.frequency.exponentialRampToValueAtTime(low, now + 0.75);
      gain.gain.setValueAtTime(kind === 'deep' ? 0.12 : 0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + 1.15);
    } catch (err) {}
  },

  tick() {
    if (!this.ready || this.muted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1320, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.12);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + 0.24);
    } catch (err) {}
  },

  // Birthday melody — first phrase of Happy Birthday
  playBirthdayMelody() {
    if (!this.ready || this.muted) return;
    try {
      const now = this.ctx.currentTime + 0.5;
      // G G A G C B  (Happy Birthday to you)
      const notes = [
        [392, 0, 0.28], [392, 0.32, 0.14], [440, 0.5, 0.42],
        [392, 0.96, 0.42], [523.25, 1.42, 0.42], [493.88, 1.88, 0.9]
      ];
      notes.forEach(([freq, start, dur]) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(0.11, now + start + 0.04);
        gain.gain.setValueAtTime(0.11, now + start + dur - 0.04);
        gain.gain.linearRampToValueAtTime(0, now + start + dur);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now + start); osc.stop(now + start + dur + 0.1);
      });
    } catch (err) {}
  },

  playHindiMotif() {
    if (!this.ready || this.muted || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime + 0.2;
      const notes = [
        [293.66, 0, 0.34],
        [329.63, 0.32, 0.42],
        [392, 0.78, 0.52],
        [440, 1.28, 0.38],
        [392, 1.7, 0.56],
        [329.63, 2.28, 0.72]
      ];
      notes.forEach(([freq, start, dur], index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const pan = this.ctx.createStereoPanner();
        osc.type = index % 2 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now + start);
        osc.frequency.linearRampToValueAtTime(freq * 1.004, now + start + dur * 0.5);
        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(0.055, now + start + 0.08);
        gain.gain.setValueAtTime(0.055, now + start + Math.max(0.1, dur - 0.12));
        gain.gain.linearRampToValueAtTime(0, now + start + dur);
        pan.pan.value = (index - 2.5) * 0.08;
        osc.connect(gain);
        gain.connect(pan);
        pan.connect(this.masterGain);
        osc.start(now + start);
        osc.stop(now + start + dur + 0.05);
      });
    } catch (err) {}
  }
};

// ─── Particle System (background stars) ──────────────────────────────
const ParticleSystem = {
  init() {
    this.canvas = $('#star-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this.createStars();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  },

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(window.innerWidth * dpr);
    this.canvas.height = Math.floor(window.innerHeight * dpr);
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  },

  createStars() {
    const count = window.innerWidth < 600 ? 80 : 130;
    this.stars = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Utils.rand(0.35, 1.9),
      phase: Utils.rand(0, Math.PI * 2),
      speed: Utils.rand(0.22, 0.95),
      drift: Utils.rand(-0.04, 0.04)
    }));
  },

  animate() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const t = performance.now() * 0.001;
    this.stars.forEach(star => {
      star.x += star.drift;
      if (star.x < -10) star.x = window.innerWidth + 10;
      if (star.x > window.innerWidth + 10) star.x = -10;
      const alpha = 0.16 + 0.62 * (0.5 + 0.5 * Math.sin(t * star.speed + star.phase));
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(248,239,227,${alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(() => this.animate());
  }
};

// ─── Wish Jar ─────────────────────────────────────────────────────────
const WishJar = {
  wish: '',

  show() {
    const overlay = $('#wish-overlay');
    const input = $('#wish-input');
    const releaseBtn = $('#wish-release-btn');
    const skipBtn = $('#wish-skip-btn');

    input.value = '';
    overlay.classList.add('visible');
    if (!overlay.querySelector('.wish-bg-star')) {
      for (let i = 0; i < 18; i += 1) {
        const s = document.createElement('span');
        s.className = 'wish-bg-star';
        s.textContent = '\u00b7';
        s.style.cssText = `
          position: absolute;
          left: ${Utils.rand(4, 96)}%;
          top: ${Utils.rand(4, 96)}%;
          color: rgba(248,239,227,${Utils.rand(0.08, 0.28).toFixed(2)});
          font-size: ${Utils.rand(8, 22)}px;
          pointer-events: none;
          animation: quoteDrift ${Utils.rand(4, 9)}s ease-in-out infinite;
          animation-delay: -${Utils.rand(0, 5)}s;
        `;
        overlay.appendChild(s);
      }
    }
    setTimeout(() => input.focus(), 500);
    const autoGrow = () => {
      input.style.height = 'auto';
      input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
    };
    input.addEventListener('input', autoGrow, { passive: true });

    releaseBtn.onclick = () => {
      const text = input.value.trim();
      if (text) {
        this.wish = text;
        this.release(text);
      } else {
        this.proceed();
      }
    };

    skipBtn.onclick = () => this.proceed();
  },

  async release(text) {
    const overlay = $('#wish-overlay');
    overlay.classList.remove('visible');
    await Utils.wait(400);

    const floater = $('#floating-wish');
    floater.textContent = `"${text}"`;
    floater.classList.add('rising');
    AudioManager.chime('unlock');
    Utils.vibrate([20, 60, 20]);

    // Sparkle burst from center
    for (let i = 0; i < 10; i += 1) {
      setTimeout(() => {
        const dot = document.createElement('span');
        dot.className = 'wish-sparkle';
        dot.style.left = `${Utils.rand(30, 70)}vw`;
        dot.style.top = `${Utils.rand(30, 70)}vh`;
        document.body.appendChild(dot);
        setTimeout(() => dot.remove(), 700);
      }, i * 80);
    }

    await Utils.wait(3400);
    floater.classList.remove('rising');
    this.proceed();
  },

  proceed() {
    LevelManager.transition(7);
  }
};

// ─── Level Manager ────────────────────────────────────────────────────
const LevelManager = {
  current: -1,
  progress: {},
  key: 'jilebi_progress_v2',
  labels: ['Gate', 'Star Gate', 'Her Vibe', 'Dream Path', 'Memories', 'Chaos', 'Letter', 'Final Sky'],
  titles: [
    'A world is opening ✦',
    'Star Gate · Jilebi\'s World',
    'Her Vibe · Jilebi\'s World',
    'Dream Path · Jilebi\'s World',
    'Memories · Jilebi\'s World',
    'Soft Chaos · Jilebi\'s World',
    'The Letter · Jilebi\'s World',
    '✦ Final Sky · Jilebi\'s World'
  ],
  bridges: {
    1: ['Level 1', 'The Star Gate', 'Catch enough light to open what is waiting.'],
    2: ['Level 2', 'Her Vibe Map', 'Six fragments. Each one a part she doesn\'t show everyone.'],
    3: ['Level 3', 'Dream Path', 'Now the map moves from who she is to where her heart wants to go.'],
    4: ['Level 4', 'Memory Constellation', 'The smallest moments are about to start glowing.'],
    5: ['Level 5', 'Soft Chaos Room', 'A little play before the quiet part.'],
    6: ['Level 6', 'The Letter', 'After all the gates, the words can finally arrive.'],
    7: ['Level 7', 'Final Sky', 'No task now. Just watch.']
  },

  init() {
    try { this.progress = JSON.parse(localStorage.getItem(this.key) || '{}'); }
    catch (err) { this.progress = {}; }
    if (this.progress.level > 0) this.showReturnScreen();
    else this.showLevel(0);
  },

  save() {
    try {
      localStorage.setItem(this.key, JSON.stringify({
        ...this.progress, level: this.current, timestamp: Date.now()
      }));
    } catch (err) {}
  },

  showReturnScreen() {
    const screen = $('#return-screen');
    screen.classList.add('visible');
    $('#continue-btn').onclick = () => {
      screen.classList.remove('visible');
      this.showLevel(Math.max(0, Math.min(7, this.progress.level || 0)));
      if (this.progress.level > 0) $('#mute-btn').classList.add('visible');
    };
    $('#restart-btn-return').onclick = () => {
      screen.classList.remove('visible');
      this.restart(true);
    };
  },

  showLevel(num) {
    $$('.level').forEach(level => { level.classList.remove('active'); level.style.display = 'none'; });
    this.current = num;
    document.body.dataset.level = String(num);
    this.save();
    const level = $(`#level-${num}`);
    if (!level) return;
    level.style.display = 'flex';
    requestAnimationFrame(() => level.classList.add('active'));
    this.updateChrome(num);
    const inits = [Level0, Level1, Level2, Level3, Level4, Level5, Level6, Level7];
    setTimeout(() => inits[num] && inits[num].init(), 250);
  },

  updateChrome(num) {
    const indicator = $('#chapter-indicator');
    $('#chapter-num').textContent = String(num);
    $('#chapter-label').textContent = this.labels[num] || 'World';
    indicator.classList.toggle('visible', num > 0);
    document.title = this.titles[num] || 'Jilebi\'s World ✦';
  },

  async transition(toLevel, options = {}) {
    Utils.vibrate([20]);
    AudioManager.chime(options.chime || 'soft');
    const overlay = $('#transition-overlay');
    const copy = this.bridges[toLevel] || ['Level unlocked', this.labels[toLevel] || '', ''];
    $('#bridge-kicker').textContent = copy[0];
    $('#bridge-title').textContent = options.title || copy[1];
    $('#bridge-sub').textContent = options.sub || copy[2];
    overlay.classList.add('active');
    await Utils.wait(options.long ? 1500 : 760);
    this.showLevel(toLevel);
    await Utils.wait(420);
    overlay.classList.remove('active');
  },

  restart(skipTransition = false) {
    try { localStorage.removeItem(this.key); } catch (err) {}
    this.progress = {};
    GameEngine.completed.clear();
    WishJar.wish = '';
    if (skipTransition) this.showLevel(0);
    else this.transition(0, { title: 'The Gate', sub: 'Again, from the first light.' });
  }
};

// ─── Level 0 ──────────────────────────────────────────────────────────
const Level0 = {
  token: null,
  moonTaps: 0,

  init() {
    if (this.token) this.token.cancelled = true;
    this.token = { cancelled: false };
    $$('.typewriter-line').forEach(line => { line.textContent = ''; line.style.opacity = '0'; });
    $('#l0-candle').classList.remove('name-hidden');
    $('#l0-cta').style.opacity = '0';
    $('#date-sigil').classList.remove('visible');
    $('#birthday-badge').classList.remove('visible');
    $('#l0-moon').onclick = () => this.tapMoon();

    if (Birthday.isToday()) {
      $('#loading-text').textContent = `Happy ${Birthday.age()}th Birthday, Jilebi 🎂`;
      const badge = $('#birthday-badge');
      setTimeout(() => badge.classList.add('visible'), 2000);
    }

    this.runTextSequence(this.token);
    ShootingStars.start();
  },

  async runTextSequence(token) {
    await Utils.wait(520);
    const isBday = Birthday.isToday();
    const lines = isBday ? [
      ['#l0-line1', `It is your ${Birthday.age()}th birthday.`, 52],
      ['#l0-line2', 'So someone built you a world.', 45],
      ['#l0-line3', 'Jilebi', 72],
      ['#l0-line4', 'Unlocking the quiet places you dream about.', 38]
    ] : [
      ['#l0-line1', 'This is not a birthday page.', 52],
      ['#l0-line2', 'It is a little world built for one person.', 45],
      ['#l0-line3', 'Jilebi', 72],
      ['#l0-line4', 'Unlocking the quiet places she dreams about.', 38]
    ];

    for (const [selector, text, speed] of lines) {
      if (selector === '#l0-line3') {
        $('#l0-candle').classList.add('name-hidden');
        await Utils.wait(420);
        if (token.cancelled || LevelManager.current !== 0) return;
      }
      await Utils.typewriter($(selector), text, speed, token);
      await Utils.wait(360);
      if (token.cancelled || LevelManager.current !== 0) return;
    }

    $('#l0-cta').style.opacity = '1';
    $('#l0-cta').onclick = () => this.begin();
  },

  tapMoon() {
    this.moonTaps += 1;
    Utils.vibrate([12]);
    if (this.moonTaps === 2) { $('#date-sigil').classList.add('visible'); AudioManager.chime('soft'); }
    if (this.moonTaps >= 5) { EasterEgg.showSecret(); this.moonTaps = 0; }
  },

  begin() {
    if (this.token) this.token.cancelled = true;
    $('#mute-btn').classList.add('visible');
    AudioManager.start();
    if (Birthday.isToday()) setTimeout(() => AudioManager.playBirthdayMelody(), 800);
    LevelManager.transition(1);
  }
};

// ─── Level 1 ──────────────────────────────────────────────────────────
const Level1 = {
  caught: 0,
  target: 10,
  active: false,
  timers: [],

  init() {
    this.cleanup();
    this.caught = 0;
    this.active = true;
    $('#l1-golden-light').classList.remove('visible');
    $('#l1-unlock-msg').classList.remove('visible');
    ['#gate-door-left', '#gate-door-right'].forEach(s => {
      const d = $(s); if (d) d.style.animation = '';
    });
    this.updateCounter();
    const instruction = $('#level-1 .level-instruction');
    if (instruction) {
      instruction.style.transition = 'opacity 700ms var(--ease)';
      instruction.style.opacity = '0';
    }
    const bridge = document.createElement('div');
    bridge.className = 'l1-emotional-bridge';
    bridge.textContent = 'Stay a little. The gate waits for the ones who look closely.';
    document.getElementById('level-1').appendChild(bridge);

    const fadeTimer = setTimeout(() => {
      bridge.style.opacity = '0';
      if (instruction) instruction.style.opacity = '1';
      const removeTimer = setTimeout(() => {
        if (bridge.isConnected) bridge.remove();
        if (this.active) this.spawnLoop();
      }, 700);
      this.timers.push(removeTimer);
    }, 2200);
    this.timers.push(fadeTimer);
  },

  cleanup() {
    this.active = false;
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];
    const c = $('#l1-stars-container');
    if (c) c.innerHTML = '';
    const bridge = $('#level-1 .l1-emotional-bridge');
    if (bridge) bridge.remove();
    const instruction = $('#level-1 .level-instruction');
    if (instruction) instruction.style.opacity = '';
  },

  updateCounter() { $('#l1-counter').textContent = `\u2726 ${this.caught} / ${this.target}`; },

  spawnLoop() {
    const container = $('#l1-stars-container');
    if (!container) return;
    const spawn = () => {
      if (!this.active) return;
      if (this.caught < this.target) {
        this.spawnStar(container);
        this.timers.push(setTimeout(spawn, Utils.rand(300, 660)));
      }
    };
    for (let i = 0; i < 7; i += 1) this.timers.push(setTimeout(spawn, i * 170));
  },

  spawnStar(container) {
    const star = document.createElement('button');
    star.type = 'button';
    star.className = 'game-star';
    star.textContent = '\u2726';
    const safeW = window.innerWidth < 420 ? 10 : 8;
    star.style.left = `${Utils.rand(safeW, 100 - safeW - 4)}vw`;
    star.style.top = `${Utils.rand(18, 74)}vh`;
    star.style.color = `hsl(${Utils.rand(36, 52)}, 80%, ${Utils.rand(64, 78)}%)`;
    star.setAttribute('aria-label', 'Catch star');

    const baseX = parseFloat(star.style.left);
    const baseY = parseFloat(star.style.top);
    const phase = Utils.rand(0, Math.PI * 2);
    const speed = Utils.rand(0.5, 1.1);
    const start = performance.now();

    const float = now => {
      if (!star.isConnected || star.classList.contains('caught')) return;
      const t = (now - start) * 0.001 * speed;
      star.style.left = `${baseX + Math.sin(t + phase) * 4.5}vw`;
      star.style.top = `${baseY + Math.cos(t * 0.8 + phase) * 3.2}vh`;
      requestAnimationFrame(float);
    };

    star.onclick = e => { e.stopPropagation(); this.catchStar(star); };
    container.appendChild(star);
    requestAnimationFrame(float);

    this.timers.push(setTimeout(() => {
      if (star.isConnected && !star.classList.contains('caught')) star.remove();
    }, 5200));
  },

  catchStar(star) {
    if (!this.active || star.classList.contains('caught')) return;
    star.classList.add('caught');
    Utils.vibrate([18]);
    AudioManager.tick();
    this.sparkle(star);
    this.caught += 1;
    this.updateCounter();
    setTimeout(() => star.remove(), 360);
    if (this.caught >= this.target) this.unlock();
  },

  sparkle(star) {
    const rect = star.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < 10; i += 1) {
      const dot = document.createElement('span');
      dot.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:5px;height:5px;border-radius:50%;background:var(--gold);z-index:9300;pointer-events:none;`;
      document.body.appendChild(dot);
      const angle = Math.PI * 2 * (i / 10);
      const distance = Utils.rand(28, 62);
      dot.animate([
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(angle) * distance}px),calc(-50% + ${Math.sin(angle) * distance}px)) scale(0)`, opacity: 0 }
      ], { duration: 540, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => dot.remove();
    }
  },

  async unlock() {
    if (!this.active) return;
    this.active = false;
    this.timers.forEach(t => clearTimeout(t));
    AudioManager.chime('unlock');
    $('#gate-door-left').style.animation = 'gate-open-left 1500ms var(--ease) forwards';
    $('#gate-door-right').style.animation = 'gate-open-right 1500ms var(--ease) forwards';
    $('#l1-golden-light').classList.add('visible');
    await Utils.wait(900);
    $('#l1-unlock-msg').classList.add('visible');
    await Utils.wait(2450);
    LevelManager.transition(2);
  }
};

// ─── Level 2 ──────────────────────────────────────────────────────────
const Level2 = {
  tapped: new Set(),
  unlocking: false,
  vibes: [
    { label: 'Introvert Peace', symbol: '\u263e', quote: 'She is not distant. She is careful with where her energy goes.', img: IMG.room, color: 'rgba(143,216,210,0.20)' },
    { label: 'Deep Thinker', symbol: '\u2234', quote: 'She hears meanings under the sentence, and feelings under the joke.', img: IMG.night, color: 'rgba(215,183,106,0.22)' },
    { label: 'Soft Heart', symbol: '\u25cc', quote: 'Soft does not mean easy to break. Sometimes it means still kind after everything.', img: IMG.tea, color: 'rgba(217,139,168,0.24)' },
    { label: 'Quiet Strength', symbol: '\u25b3', quote: 'She carries things quietly, then still shows up with warmth.', img: IMG.mountains, color: 'rgba(143,216,210,0.18)' },
    { label: 'Late Night Energy', symbol: '\u2726', quote: 'Reels, thoughts, songs, sudden honesty. The night knows her real language.', img: IMG.sky, color: 'rgba(215,183,106,0.18)' },
    { label: 'Soft Chaos', symbol: '\u223f', quote: 'Teasing, blushing talks, overthinking, laughing. A whole weather system, somehow beautiful.', img: IMG.rain, color: 'rgba(242,166,90,0.18)' }
  ],
  quotes: ['quiet hearts, full skies', 'pahad wali peace', 'late-night thoughts', 'soft chaos, real comfort'],

  init() {
    this.tapped.clear();
    this.unlocking = false;
    this.render();
    this.updateProgress();
  },

  render() {
    const container = $('#l2-orb-container');
    container.innerHTML = '';
    const positions = [[16,28],[62,21],[36,45],[76,52],[20,68],[56,73]];
    this.vibes.forEach((vibe, index) => {
      const orb = document.createElement('button');
      orb.type = 'button';
      orb.className = 'vibe-orb';
      orb.style.left = `${positions[index][0]}%`;
      orb.style.top = `${positions[index][1]}%`;
      orb.style.setProperty('--orb-color', vibe.color);
      orb.style.setProperty('--float-dur', `${Utils.rand(6, 9)}s`);
      orb.style.setProperty('--float-delay', `-${Utils.rand(0, 4)}s`);
      orb.innerHTML = `<span class="vibe-orb-symbol">${vibe.symbol}</span><span class="vibe-orb-label">${vibe.label}</span>`;
      orb.onclick = () => this.tap(index, orb, vibe);
      container.appendChild(orb);
    });
    this.quotes.forEach(quote => {
      const el = document.createElement('span');
      el.className = 'ambient-quote';
      el.textContent = quote;
      el.style.left = `${Utils.rand(7, 75)}%`;
      el.style.top = `${Utils.rand(18, 80)}%`;
      el.style.setProperty('--float-dur', `${Utils.rand(7, 12)}s`);
      el.style.setProperty('--float-delay', `-${Utils.rand(0, 7)}s`);
      container.appendChild(el);
    });
  },

  tap(index, orb, vibe) {
    if (!this.tapped.has(index)) {
      this.tapped.add(index);
      orb.classList.add('tapped');
      Utils.vibrate([16]);
      AudioManager.chime('soft');
      this.updateProgress();
    }
    this.showCard(vibe);
    if (this.tapped.size >= this.vibes.length && !this.unlocking) {
      this.unlocking = true;
      setTimeout(() => this.unlock(), 1450);
    }
  },

  showCard(vibe) {
    const overlay = $('#vibe-card-overlay');
    Utils.setImage($('#vibe-card-img'), vibe.img, vibe.label);
    $('#vibe-card-label').textContent = vibe.label;
    $('#vibe-card-quote').textContent = vibe.quote;
    overlay.classList.add('visible');
    $('#vibe-card-close').onclick = () => overlay.classList.remove('visible');
    overlay.onclick = e => { if (e.target === overlay) overlay.classList.remove('visible'); };
  },

  updateProgress() {
    $('#l2-progress').textContent = `${this.tapped.size} / ${this.vibes.length} fragments unlocked`;
    $('#l2-header-sub').textContent = this.tapped.size
      ? 'Each one is a small proof that she has always been more than one mood.'
      : 'Unlock the fragments people miss when they only look quickly.';
  },

  async unlock() {
    $('#vibe-card-overlay').classList.remove('visible');
    await Utils.wait(420);
    LevelManager.transition(3);
  }
};

// ─── Level 3 ──────────────────────────────────────────────────────────
const Level3 = {
  unlocked: new Set(),
  unlocking: false,
  destinations: [
    { name: 'Kedarnath', hint: 'the mountain that keeps calling', img: IMG.kedarnath, text: 'For the dream that feels older than a plan. One day, when Kedarnath happens, the cold air will not feel harsh. It will feel like an answer.' },
    { name: 'Teerth Yatra', hint: 'a road that feeds the soul', img: IMG.flags, text: 'For the prayers she may not say loudly. For the ghats, bells, flags, water, and that quiet feeling of being held by something bigger.' },
    { name: 'Pahad ka Ghar', hint: 'a home where silence is full', img: IMG.house, text: 'A window facing the hills. Tea cooling slowly. No pressure to explain anything. Just a morning that lets her breathe completely.' },
    { name: 'Travelling', hint: 'roads that become stories', img: IMG.road, text: 'Not escape. Expansion. The kind of travelling where every misty turn reminds her that life can still surprise her gently.' },
    { name: 'Peaceful Life', hint: 'not a place, a feeling', img: IMG.tea, text: 'This is the real destination: calm mornings, safe conversations, fewer heavy nights, and a life that finally stops asking her to rush.' }
  ],

  init() {
    this.unlocked.clear();
    this.unlocking = false;
    this.render();
  },

  render() {
    const container = $('#l3-destinations');
    container.innerHTML = '';
    this.destinations.forEach((dest, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'destination-lantern';
      button.innerHTML = `
        <span class="dest-index">${String(index + 1).padStart(2, '0')}</span>
        <span class="dest-info">
          <span class="dest-name">${dest.name}</span>
          <span class="dest-hint">${dest.hint}</span>
        </span>
        <span class="dest-status">locked</span>
      `;
      button.style.opacity = '0';
      button.style.transform = 'translateX(-0.75rem)';
      button.onclick = () => this.tap(index, button, dest);
      container.appendChild(button);
      setTimeout(() => {
        button.style.transition = 'opacity 420ms var(--ease), transform 420ms var(--spring)';
        button.style.opacity = '1';
        button.style.transform = 'translateX(0)';
      }, 180 + index * 110);
    });
  },

  tap(index, button, dest) {
    Utils.vibrate([18]);
    AudioManager.chime('soft');
    if (!this.unlocked.has(index)) {
      this.unlocked.add(index);
      button.classList.add('unlocked');
      $('.dest-status', button).textContent = 'open';
    }
    this.showCard(dest);
    if (this.unlocked.size >= this.destinations.length && !this.unlocking) {
      this.unlocking = true;
      setTimeout(() => this.unlock(), 1500);
    }
  },

  showCard(dest) {
    const overlay = $('#dest-card-overlay');
    Utils.setImage($('#dest-card-img'), dest.img, dest.name);
    $('#dest-card-title').textContent = dest.name;
    $('#dest-card-text').textContent = dest.text;
    overlay.classList.add('visible');
    const closeBtn = document.getElementById('dest-card-close');
    if (closeBtn) {
      closeBtn.textContent = 'close';
      closeBtn.style.cssText = `
        position: static;
        display: block;
        margin: 1.5rem auto 0;
        font-family: var(--font-mono);
        font-size: 0.68rem;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: rgba(248,239,227,0.36);
        background: none;
        border: none;
        cursor: pointer;
        width: auto;
        height: auto;
        border-radius: 0;
      `;
      const card = closeBtn.closest('.dest-card');
      if (card) card.appendChild(closeBtn);
    }
    $('#dest-card-close').onclick = () => overlay.classList.remove('visible');
    overlay.onclick = e => { if (e.target === overlay) overlay.classList.remove('visible'); };
  },

  async unlock() {
    $('#dest-card-overlay').classList.remove('visible');
    await Utils.wait(500);
    await SecretMoments.pocketSunrise();
    await LevelManager.transition(4, { title: 'It does not end at the map.', sub: 'It turns inward, into memories.', long: true });
  }
};

// ─── Level 4 ──────────────────────────────────────────────────────────
const Level4 = {
  target: 12,
  tapped: new Set(),
  lines: [],
  stars: [],
  activePopup: null,
  nameVisible: false,
  notes: [
    'Random reels that somehow became their own little language.',
    'Late-night chats when the world felt smaller and safer.',
    'Long calls where time quietly forgot to behave.',
    'Songs shared like small pieces of the heart.',
    'Teasing that made the connection feel easy and alive.',
    'Language teaching, because even words became a memory.',
    'Sharing little parts of life without forcing anything.',
    'Those blushing talks that said more than they admitted.',
    'Support that arrived softly, not loudly.',
    'Dreams spoken like they were fragile and important.',
    'Comfort that felt natural, like breathing after a long day.',
    'Understanding each other in a way that made the memories real.'
  ],
  positions: [
    [0.16,0.28],[0.28,0.43],[0.42,0.32],[0.55,0.46],
    [0.70,0.34],[0.82,0.52],[0.67,0.68],[0.51,0.60],
    [0.36,0.72],[0.24,0.62],[0.47,0.80],[0.73,0.78]
  ],

  init() {
    this.canvas = $('#constellation-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.tapped.clear();
    this.lines = [];
    this.nameVisible = false;
    this.activePopup = null;
    $('#l4-final-msg').classList.remove('visible');
    this.resize();
    this.createStars();
    this.updateProgress();
    this.canvas.onclick = e => this.onTap(e.clientX, e.clientY);
    this.canvas.ontouchstart = e => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) this.onTap(touch.clientX, touch.clientY);
    };
    window.onresize = () => {
      if (LevelManager.current === 4) { this.resize(); this.createStars(); }
    };
    cancelAnimationFrame(this.frame);
    this.animate();
  },

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(window.innerWidth * dpr);
    this.canvas.height = Math.floor(window.innerHeight * dpr);
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  },

  createStars() {
    const top = window.innerHeight < 700 ? 90 : 120;
    const bottom = 90;
    const usableH = Math.max(260, window.innerHeight - top - bottom);
    this.stars = this.positions.map(([px, py], index) => ({
      x: window.innerWidth * px,
      y: top + usableH * py,
      r: Utils.rand(4, 7),
      phase: Utils.rand(0, Math.PI * 2),
      note: this.notes[index]
    }));
  },

  animate() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const t = performance.now() * 0.001;

    ctx.lineWidth = 1;
    this.lines.forEach(([a, b]) => {
      const one = this.stars[a];
      const two = this.stars[b];
      if (!one || !two) return;
      const gradient = ctx.createLinearGradient(one.x, one.y, two.x, two.y);
      gradient.addColorStop(0, 'rgba(215,183,106,.12)');
      gradient.addColorStop(0.5, 'rgba(143,216,210,.52)');
      gradient.addColorStop(1, 'rgba(217,139,168,.18)');
      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(one.x, one.y);
      ctx.lineTo(two.x, two.y);
      ctx.stroke();
    });

    this.stars.forEach((star, index) => {
      const isTapped = this.tapped.has(index);
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.1 + star.phase);
      const alpha = isTapped ? 1 : 0.35 + 0.4 * pulse;
      const radius = isTapped ? star.r * 1.4 : star.r;

      const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, radius * 7);
      glow.addColorStop(0, `rgba(215,183,106,${alpha * 0.28})`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(star.x, star.y, radius * 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isTapped ? `rgba(215,183,106,${alpha})` : `rgba(248,239,227,${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    if (this.nameVisible) {
      ctx.save();
      ctx.globalAlpha = 0.2 + 0.1 * Math.sin(t);
      ctx.font = '28px "Courier Prime", monospace';
      ctx.fillStyle = 'rgba(215,183,106,.8)';
      ctx.textAlign = 'center';
      ctx.fillText('JILEBI', window.innerWidth / 2, window.innerHeight / 2 + 12);
      ctx.restore();
    }

    this.frame = requestAnimationFrame(() => this.animate());
  },

  onTap(clientX, clientY) {
    if (this.activePopup) { this.activePopup.remove(); this.activePopup = null; }
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let hit = -1, best = Infinity;
    this.stars.forEach((star, index) => {
      const distance = Math.hypot(x - star.x, y - star.y);
      if (distance < 42 && distance < best) { hit = index; best = distance; }
    });
    if (hit < 0) return;
    if (!this.tapped.has(hit)) {
      const previous = [...this.tapped].at(-1);
      this.tapped.add(hit);
      if (previous !== undefined) this.lines.push([previous, hit]);
      Utils.vibrate([18]);
      AudioManager.tick();
      this.updateProgress();
      if (this.tapped.size >= this.target) setTimeout(() => this.finish(), 900);
    }
    this.showNote(this.stars[hit]);
  },

  showNote(star) {
    const popup = document.createElement('div');
    popup.className = 'star-note-popup';
    popup.textContent = star.note;
    const popupW = Math.min(260, window.innerWidth - 28);
    const left = Math.max(12, Math.min(window.innerWidth - popupW - 12, star.x - popupW / 2));
    const top = Math.max(76, Math.min(window.innerHeight - 130, star.y - 96));
    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
    popup.style.maxWidth = `${popupW}px`;
    $('#level-4').appendChild(popup);
    this.activePopup = popup;
    setTimeout(() => {
      if (popup.isConnected) {
        popup.style.transition = 'opacity 360ms var(--ease)';
        popup.style.opacity = '0';
        setTimeout(() => popup.remove(), 380);
      }
      if (this.activePopup === popup) this.activePopup = null;
    }, 2600);
  },

  updateProgress() { $('#l4-progress').textContent = `${this.tapped.size} / ${this.target} memories discovered`; },

  async finish() {
    if (this.nameVisible) return;
    this.nameVisible = true;
    AudioManager.chime('unlock');
    AudioManager.playHindiMotif();
    const songGhost = document.createElement('div');
    songGhost.className = 'song-ghost';
    songGhost.innerHTML = `
      <span>\u266a Hindi songs for the quiet parts</span>
      <strong>Kun Faya Kun · Iktara · Phir Se Ud Chala · Safarnama · Ilahi</strong>
    `;
    document.getElementById('level-4').appendChild(songGhost);
    setTimeout(() => songGhost.remove(), 7200);
    $('#l4-final-msg').classList.add('visible');
    await Utils.wait(4700);
    LevelManager.transition(5);
  }
};

// ─── Level 5 ──────────────────────────────────────────────────────────
const Level5 = { init() { GameEngine.init(); } };

// ─── Game Engine ──────────────────────────────────────────────────────
const GameEngine = {
  completed: new Set(),
  total: 5,
  heartsTarget: 12,
  moodQuestion: 0,
  moodAnswers: [],
  games: ['hearts', 'overthink', 'cat', 'house', 'mood'],
  moodQuestions: [
    { q: 'Your current inner weather is...', opts: ['Rain on window', 'Mountain silence', 'Soft chaos', 'Midnight thoughts'] },
    { q: 'A perfect calm morning has...', opts: ['Tea', 'No notifications', 'A view', 'A song on low'] },
    { q: 'When feelings get heavy, you usually...', opts: ['Go quiet', 'Overthink', 'Listen to songs', 'Need one safe person'] },
    { q: 'Your travel mood is...', opts: ['Kedarnath calling', 'Any road, bas chalo', 'Mist and windows', 'Peaceful yatra'] },
    { q: 'What should this year bring first?', opts: ['Strength', 'Peace', 'Travel', 'A lighter heart'] }
  ],
  moodResults: [
    ['Mountain Silence Mode', '\u25b3', 'Grounded outside, deep inside. The kind of calm that still has a thousand thoughts behind it.'],
    ['Tea And Safe Talks Mode', '\u2615', 'Warm, honest, a little emotional. The kind of Jilebi who needs gentleness more than advice.'],
    ['Soft Chaos Mode', '\u223f', 'A whole storm, but somehow still sweet. Laughing, thinking, feeling, all at once.'],
    ['Yatra Heart Mode', '\u2726', 'Your soul wants roads, bells, mountains, and that feeling of being quietly protected.'],
    ['Quiet Fire Mode', '\u25c7', 'Not loud. Not easy to read. But strong in a way that keeps showing up.']
  ],

  init() {
    this.completed = new Set(LevelManager.progress.games || []);
    this.games.forEach(game => {
      const card = $(`#card-${game}`);
      if (card) {
        card.onclick = () => this.openMiniGame(game);
        card.classList.toggle('done', this.completed.has(game));
      }
    });
    this.updateProgress();
  },

  openMiniGame(type) {
    const overlay = $(`#game-${type}`);
    if (!overlay) return;
    overlay.classList.add('visible');
    AudioManager.chime('soft');
    if (type === 'hearts') this.startHearts();
    if (type === 'overthink') this.setupOverthink();
    if (type === 'cat') this.startCat();
    if (type === 'house') this.setupHouse();
    if (type === 'mood') this.startMood();
  },

  closeMiniGame(type) {
    const overlay = $(`#game-${type}`);
    if (overlay) overlay.classList.remove('visible');
    clearInterval(this.heartTimer);
    clearInterval(this.catTimer);
  },

  markDone(type) {
    this.closeMiniGame(type);
    this.completed.add(type);
    const card = $(`#card-${type}`);
    if (card) card.classList.add('done');
    Utils.saveProgressPatch({ games: [...this.completed] });
    this.updateProgress();
    if (this.completed.size >= this.total) setTimeout(() => this.unlock(), 850);
  },

  updateProgress() { $('#l5-progress').textContent = `${this.completed.size} / ${this.total} games played`; },

  startHearts() {
    clearInterval(this.heartTimer);
    this.heartsCount = 0;
    $('#hearts-counter').textContent = `0 / ${this.heartsTarget}`;
    $('#hearts-quote').style.display = 'none';
    $('#hearts-done-btn').style.display = 'none';
    const arena = $('#hearts-arena');
    arena.innerHTML = '';

    const spawn = () => {
      if (!$('#game-hearts').classList.contains('visible') || this.heartsCount >= this.heartsTarget) return;
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'falling-heart';
      dot.textContent = ['\u2726', '\u25cc', '\u25c7', '\u2736'][Utils.randInt(0, 3)];
      dot.style.left = `${Utils.rand(6, 82)}%`;
      dot.style.setProperty('--fall-dur', `${Utils.rand(3.2, 5.6)}s`);
      dot.onclick = () => {
        if (dot.dataset.hit) return;
        dot.dataset.hit = '1';
        dot.style.animation = 'starBurst 280ms var(--ease) forwards';
        this.heartsCount += 1;
        $('#hearts-counter').textContent = `${this.heartsCount} / ${this.heartsTarget}`;
        Utils.vibrate([12]); AudioManager.tick();
        setTimeout(() => dot.remove(), 300);
        if (this.heartsCount >= this.heartsTarget) {
          $('#hearts-quote').style.display = 'block';
          $('#hearts-done-btn').style.display = 'inline-flex';
          clearInterval(this.heartTimer);
        }
      };
      arena.appendChild(dot);
      setTimeout(() => dot.remove(), 6200);
    };
    spawn();
    this.heartTimer = setInterval(spawn, 520);
  },

  setupOverthink() {
    const slider = $('#overthink-slider');
    const label = $('#overthink-label');
    const char = $('#mountain-char');
    const quote = $('#overthink-quote');
    const done = $('#overthink-done-btn');
    const labels = ['Suspiciously calm.', 'One tab open in the mind.', 'Several tabs. Music also playing.', 'Whole courtroom inside.', 'Jilebi Mode: every thought has a sequel.'];
    const symbols = ['\u25b3', '\u00b7', '\u2234', '\u223f', '\u2736'];

    slider.value = 0;
    label.textContent = 'Slide slowly...';
    char.textContent = symbols[0];
    quote.style.display = 'none';
    done.style.display = 'none';

    slider.oninput = () => {
      const value = Number(slider.value);
      label.textContent = labels[value];
      char.textContent = symbols[value];
      char.style.transform = 'scale(1.15)';
      setTimeout(() => { char.style.transform = 'scale(1)'; }, 180);
      if (value >= 3) { quote.style.display = 'block'; done.style.display = 'inline-flex'; }
    };
  },

  startCat() {
    clearInterval(this.catTimer);
    this.catCount = 0;
    const counter = $('#cat-counter');
    const cat = $('#game-cat-emoji');
    const arena = $('#cat-arena');
    $('#cat-quote').style.display = 'none';
    $('#cat-done-btn').style.display = 'none';
    counter.textContent = '0 / 5';
    cat.textContent = '🐈';

    const move = () => {
      const rect = arena.getBoundingClientRect();
      cat.style.left = `${Utils.rand(6, Math.max(8, rect.width - 78))}px`;
      cat.style.top = `${Utils.rand(6, Math.max(8, rect.height - 58))}px`;
    };

    move();
    this.catTimer = setInterval(move, 850);
    cat.onclick = () => {
      if (this.catCount >= 5) return;
      this.catCount += 1;
      counter.textContent = `${this.catCount} / 5`;
      cat.textContent = ['😸', '😻', '🐾', '💛', '✨'][this.catCount - 1];
      cat.style.transform = 'scale(1.08)';
      setTimeout(() => { cat.style.transform = 'scale(1)'; }, 180);
      Utils.vibrate([12]); AudioManager.tick();
      if (this.catCount >= 5) {
        clearInterval(this.catTimer);
        $('#cat-quote').style.display = 'block';
        $('#cat-done-btn').style.display = 'inline-flex';
      } else { move(); }
    };
  },

  setupHouse() {
    this.houseChoices = { roof: null, view: null, mood: null };
    $('#house-preview-text').textContent = 'Choose all three pieces';
    $('#house-quote').style.display = 'none';
    $('#house-done-btn').style.display = 'none';
    $$('.house-choice-btn').forEach(button => {
      button.classList.remove('selected');
      button.onclick = () => {
        const group = button.dataset.group;
        $$(`.house-choice-btn[data-group="${group}"]`).forEach(item => item.classList.remove('selected'));
        button.classList.add('selected');
        this.houseChoices[group] = button.dataset.val;
        this.updateHousePreview();
      };
    });
  },

  updateHousePreview() {
    const values = Object.values(this.houseChoices).filter(Boolean);
    $('#house-preview-text').textContent = values.length ? values.join(' + ') : 'Choose all three pieces';
    if (values.length === 3) {
      $('#house-quote').style.display = 'block';
      $('#house-done-btn').style.display = 'inline-flex';
      AudioManager.chime('soft');
    }
  },

  startMood() {
    this.moodQuestion = 0;
    this.moodAnswers = [];
    $('#mood-result').style.display = 'none';
    $('#mood-done-btn').style.display = 'none';
    this.showMoodQuestion();
  },

  showMoodQuestion() {
    const current = this.moodQuestions[this.moodQuestion];
    $('#mood-title').textContent = 'Which Jilebi Today?';
    $('#mood-sub').textContent = `Question ${this.moodQuestion + 1} of ${this.moodQuestions.length}`;
    $('#mood-question').textContent = current.q;
    const options = $('#mood-options');
    options.innerHTML = '';
    current.opts.forEach((option, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mood-option-btn';
      button.textContent = option;
      button.onclick = () => this.answerMood(index);
      options.appendChild(button);
    });
  },

  async answerMood(index) {
    this.moodAnswers.push(index);
    this.moodQuestion += 1;
    AudioManager.tick();
    if (this.moodQuestion < this.moodQuestions.length) {
      $('#mood-question').style.opacity = '0';
      $('#mood-options').style.opacity = '0';
      await Utils.wait(180);
      this.showMoodQuestion();
      $('#mood-question').style.opacity = '1';
      $('#mood-options').style.opacity = '1';
    } else { this.showMoodResult(); }
  },

  showMoodResult() {
    $('#mood-options').innerHTML = '';
    $('#mood-question').textContent = '';
    $('#mood-sub').textContent = 'Verdict';
    const result = this.moodResults[this.moodAnswers.reduce((sum, item) => sum + item, 0) % this.moodResults.length];
    $('#mood-result-symbol').textContent = result[1];
    $('#mood-result-title').textContent = result[0];
    $('#mood-result-desc').textContent = result[2];
    $('#mood-result').style.display = 'block';
    $('#mood-done-btn').style.display = 'inline-flex';
  },

  async unlock() {
    this.confetti();
    await Utils.wait(2200);

    const breath = document.createElement('div');
    breath.className = 'chaos-breath';
    breath.textContent = 'Now the soft part.';
    document.getElementById('level-5').appendChild(breath);
    requestAnimationFrame(() => breath.classList.add('visible'));
    await Utils.wait(1800);

    LevelManager.transition(6);
  },

  confetti() {
    for (let i = 0; i < 32; i += 1) {
      setTimeout(() => {
        const piece = document.createElement('span');
        piece.className = 'confetti-piece';
        piece.textContent = ['\u2726', '\u25cc', '\u25c7', '🎂', '✨'][Utils.randInt(0, 4)];
        piece.style.left = `${Utils.rand(5, 95)}vw`;
        piece.style.setProperty('--fall-dur', `${Utils.rand(2.6, 4.8)}s`);
        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), 5200);
      }, i * 55);
    }
  }
};

// ─── Level 6 ──────────────────────────────────────────────────────────
const Level6 = {
  letterLines: [
    { text: 'Jilebi,', cls: 'greeting' },
    { text: '', cls: 'blank' },
    { text: 'It is crazy how many memories can fit into a short time.', cls: '' },
    { text: 'Random reels. Late-night chats. Long calls that did not feel long while they were happening.', cls: '' },
    { text: 'Songs, teasing, language teaching, little parts of life shared without making a big announcement out of it.', cls: '' },
    { text: '', cls: 'blank' },
    { text: 'Some connections do not arrive loudly.', cls: '' },
    { text: 'They become familiar through small things.', cls: 'indent' },
    { text: 'A joke here. A soft support there. A conversation that feels easier than expected.', cls: 'indent' },
    { text: '', cls: 'blank' },
    { text: 'What I value most is not only that we laughed.', cls: '' },
    { text: 'It is that we understood each other in quiet ways too.', cls: '' },
    { text: 'The blushing talks, the comfort, the dreams, the way songs and silences started meaning something.', cls: '' },
    { text: '', cls: 'blank' },
    { text: 'I hope this year gives you the peace you keep imagining.', cls: '' },
    { text: 'Kedarnath, Teerth Yatra, travelling, a pahad ka ghar, calm mornings, mountain silence.', cls: 'indent' },
    { text: 'Not all at once maybe. But slowly. Truly. In a way that feels yours.', cls: 'indent' },
    { text: '', cls: 'blank' },
    { text: 'I hope you never feel like you have to become louder to be understood.', cls: '' },
    { text: 'Your quiet heart is already full of meaning.', cls: '' },
    { text: 'Your soft chaos is still soft. Your strength is still real.', cls: '' },
    { text: '', cls: 'blank' },
    { text: 'Happy Birthday, jilebiii.', cls: 'sign-off' },
    { text: 'Your vibe, your presence, and the memories we created will always mean a lot to me.', cls: 'sign-off' },
    { text: 'May this year bring peace, happiness, strength, and everything your heart is quietly wishing for.', cls: 'sign-off' }
  ],

  init() { this.renderLetter(); },

  async renderLetter() {
    const paper = $('#l6-paper');
    const seal = $('#l6-seal');
    const continueBtn = $('#l6-continue');
    const pause = $('#letter-pause');

    continueBtn.classList.remove('visible');
    seal.classList.remove('visible');
    paper.style.opacity = '0';
    await Utils.wait(200);
    paper.style.transition = 'opacity 600ms var(--ease)';
    paper.style.opacity = '1';
    paper.innerHTML = '';
    paper.appendChild(seal);

    paper.style.opacity = '1';
    seal.classList.add('visible');
    AudioManager.chime('deep');
    await Utils.wait(620);

    pause.classList.add('visible');
    await Utils.wait(1600);
    pause.classList.remove('visible');
    await Utils.wait(520);

    const fragment = document.createDocumentFragment();
    const lineEls = this.letterLines.map(line => {
      const span = document.createElement('span');
      span.className = `letter-line ${line.cls}`;
      span.textContent = line.text ? '\u00a0' : '';
      fragment.appendChild(span);
      return { span, line };
    });

    paper.insertBefore(fragment, seal);

    for (const { span, line } of lineEls) {
      await Utils.wait(line.cls === 'blank' ? 190 : 165);
      if (line.text) span.textContent = line.text;
      span.classList.add('revealed');
      await Utils.wait(60);
      span.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    await Utils.wait(760);
    seal.classList.add('visible');
    AudioManager.chime('deep');
    await Utils.wait(1050);
    continueBtn.classList.add('visible');

    // Connect to wish jar
    continueBtn.onclick = () => WishJar.show();
  }
};

// ─── Level 7 ──────────────────────────────────────────────────────────
const Level7 = {
  runToken: 0,

  init() {
    this.runToken += 1;
    const token = this.runToken;
    $$('.cinematic-scene').forEach(scene => { scene.classList.remove('active'); scene.style.opacity = ''; });
    $$('.final-quote-line').forEach(line => line.classList.remove('visible'));
    $('#final-restart-btn').classList.remove('visible');
    $('#rising-lantern').classList.remove('visible');
    $('#final-wish-line').textContent = '';
    $('#final-wish-line').classList.remove('visible');
    $$('.final-rest-line').forEach(line => line.remove());
    this.run(token);
  },

  async run(token) {
    await this.showScene('scene-1', 5600, () => this.createSnow(), token);
    await this.showScene('scene-2', 6500, () => this.launchLanterns(), token);
    await this.showScene('scene-3', 5700, () => this.sparkleStars(), token);
    await this.showScene('scene-4', 0, () => this.finalQuote(token), token);
  },

  async showScene(id, duration, onShow, token) {
    if (token !== this.runToken) return;
    const scene = $(`#${id}`);
    scene.style.opacity = '';
    scene.classList.add('active');
    if (onShow) onShow();
    if (!duration) return;
    await Utils.wait(duration);
    if (token !== this.runToken) return;
    scene.style.transition = 'opacity 1400ms var(--ease)';
    scene.style.opacity = '0';
    await Utils.wait(1450);
    if (token !== this.runToken) return;
    scene.classList.remove('active');
    scene.style.opacity = '';
    scene.style.transition = '';
  },

  createSnow() {
    const container = $('#snowfall-container');
    container.innerHTML = '';
    for (let i = 0; i < 72; i += 1) {
      const snow = document.createElement('span');
      snow.className = 'snow-particle';
      snow.textContent = '\u00b7';
      snow.style.left = `${Utils.rand(0, 100)}vw`;
      snow.style.fontSize = `${Utils.rand(10, 24)}px`;
      snow.style.setProperty('--snow-dur', `${Utils.rand(5, 10)}s`);
      snow.style.animationDelay = `${Utils.rand(0, 4)}s`;
      container.appendChild(snow);
    }
  },

  launchLanterns() {
    const container = $('#lanterns-container');
    container.innerHTML = '';
    for (let i = 0; i < 22; i += 1) {
      setTimeout(() => {
        const lantern = document.createElement('span');
        lantern.className = 'lantern';
        lantern.style.left = `${Utils.rand(5, 94)}vw`;
        lantern.style.setProperty('--rise-dur', `${Utils.rand(8, 13)}s`);
        container.appendChild(lantern);
      }, i * 240);
    }
  },

  sparkleStars() {
    const container = $('#scene3-stars');
    container.innerHTML = '';
    for (let i = 0; i < 48; i += 1) {
      const star = document.createElement('span');
      star.textContent = '\u2726';
      star.style.cssText = `position:absolute;left:${Utils.rand(2, 98)}%;top:${Utils.rand(4, 92)}%;color:rgba(248,239,227,.75);font-size:${Utils.rand(8, 18)}px;animation:quoteDrift ${Utils.rand(3, 7)}s ease-in-out infinite;animation-delay:-${Utils.rand(0, 5)}s;`;
      container.appendChild(star);
    }
  },

  async finalQuote(token) {
    const sequence = ['#fq-1', '#fq-2', '#fq-3', '#fq-4'];
    for (const selector of sequence) {
      await Utils.wait(selector === '#fq-1' ? 850 : 1450);
      if (token !== this.runToken) return;
      $(selector).classList.add('visible');
      AudioManager.chime('soft');
    }

    // Show the wish if one was made
    if (WishJar.wish) {
      await Utils.wait(1200);
      const wishLine = $('#final-wish-line');
      wishLine.textContent = `✦ "${WishJar.wish}"`;
      wishLine.classList.add('visible');
      AudioManager.chime('soft');
    }

    await Utils.wait(2200);
    if (token !== this.runToken) return;
    $('#rising-lantern').classList.add('visible');

    await Utils.wait(6500);
    if (token !== this.runToken) return;
    $('#final-restart-btn').classList.add('visible');

    await Utils.wait(2600);
    if (token !== this.runToken) return;

    const rest = document.createElement('div');
    rest.className = 'final-rest-line';
    rest.textContent = '\u2726 \u2014 this world keeps the lights on for you \u2014 \u2726';
    document.getElementById('scene-4').appendChild(rest);
    requestAnimationFrame(() => rest.classList.add('visible'));
  }
};

// ─── Secret Moments ───────────────────────────────────────────────────
const SecretMoments = {
  async pocketSunrise() {
    const overlay = document.createElement('div');
    overlay.className = 'pocket-sunrise';
    overlay.innerHTML = `<h2>JILEBI</h2><p>For one second, the night becomes a morning from her dream.</p><p>21 / 05 / 2006</p>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));
    AudioManager.chime('unlock');
    await Utils.wait(2450);
    overlay.classList.remove('visible');
    await Utils.wait(850);
    overlay.remove();
  }
};

// ─── Easter Egg ───────────────────────────────────────────────────────
const EasterEgg = {
  taps: 0,
  timer: null,
  messages: [
    'Secret: calm mornings are already looking for her.',
    'Secret: the moon remembered 21/05/2006.',
    'Secret: some silences are full, not empty.',
    'Secret: she is the kind of person who makes places feel more alive without even trying.'
  ],

  init() {
    $('#easter-moon').onclick = () => this.tap();
    $('#secret-close').onclick = () => $('#secret-vault').classList.remove('visible');
  },

  tap() {
    this.taps += 1;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.taps = 0; }, 2200);
    if (this.taps === 3) {
      const msg = $('#easter-msg');
      msg.textContent = this.messages[Utils.randInt(0, this.messages.length - 1)];
      msg.classList.add('visible');
      AudioManager.chime('soft');
      setTimeout(() => msg.classList.remove('visible'), 4200);
    }
    if (this.taps >= 7) { this.showSecret(); this.taps = 0; }
  },

  showSecret() {
    $('#secret-vault').classList.add('visible');
    AudioManager.chime('unlock');
  }
};

// ─── Expose globals ───────────────────────────────────────────────────
window.GameEngine = GameEngine;
window.LevelManager = LevelManager;

// ─── Boot ─────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  ImagePreloader.preload();
  ParticleSystem.init();
  AudioManager.init();
  EasterEgg.init();

  // Soft cursor glow - desktop only
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    dot.style.opacity = '0';
    document.body.appendChild(dot);
    document.addEventListener('mousemove', e => {
      dot.style.left = `${e.clientX}px`;
      dot.style.top = `${e.clientY}px`;
      dot.style.opacity = '1';
    }, { passive: true });
    document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; });
  }

  // Birthday loading text
  if (Birthday.isToday()) {
    $('#loading-text').textContent = `Happy ${Birthday.age()}th Birthday, Jilebi 🎂`;
  }

  await Utils.wait(700);
  const loading = $('#loading-screen');
  loading.style.transition = 'opacity 560ms var(--ease)';
  loading.style.opacity = '0';
  setTimeout(() => loading.remove(), 620);

  LevelManager.init();
});

document.addEventListener('visibilitychange', () => {
  if (!AudioManager.ready || !AudioManager.masterGain || !AudioManager.started) return;
  const target = document.hidden || AudioManager.muted ? 0 : AudioManager.volume;
  AudioManager.masterGain.gain.setTargetAtTime(target, AudioManager.ctx.currentTime, 0.4);
});

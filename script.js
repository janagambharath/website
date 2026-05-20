'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const BirthdayWorld = {
  name: ['A', 'N', 'J', 'A', 'L', 'I'],
  nameIndex: 0,
  catFinds: 0,
  hiddenCat: 0,
  envelopeOpened: false,
  letterToken: 0,
  birthday: new Date(2006, 4, 21, 0, 0, 0),
  heartTimer: null,
  ageTimer: null,

  init() {
    this.hideLoaderWhenReady();
    this.setupReveals();
    this.setupMusic();
    this.setupHeroTyping();
    this.setupAgeCounter();
    this.setupHearts();
    this.setupNameGame();
    this.setupCatGame();
    this.setupMoodGame();
    this.setupEnvelope();
    this.setupReplay();
  },

  hideLoaderWhenReady() {
    const loader = $('#loader');
    if (!loader) return;

    const shownAt = Date.now();
    const hide = () => {
      const remaining = Math.max(0, 1700 - (Date.now() - shownAt));
      window.setTimeout(() => loader.classList.add('is-hidden'), remaining);
    };

    if (document.readyState === 'complete') hide();
    else window.addEventListener('load', hide, { once: true });
    window.setTimeout(hide, 3300);
  },

  setupReveals() {
    const items = $$('.reveal');
    if (!items.length) return;

    if (reducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(item => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });

    items.forEach(item => observer.observe(item));
  },

  setupMusic() {
    const toggles = [$('#musicToggle'), $('#heroMusic')].filter(Boolean);
    AudioGarden.init();
    toggles.forEach(button => {
      button.addEventListener('click', () => AudioGarden.toggle());
    });
  },

  setupHeroTyping() {
    const target = $('#heroTyped');
    if (!target) return;

    const copy = [
      'Some people become comfort unexpectedly.',
      'You are one of those rare people.',
      'Soft chaos. Safe smile. Full Jilebi energy.'
    ].join('\n');

    if (reducedMotion) {
      target.textContent = copy;
      return;
    }

    window.setTimeout(() => this.typeText(target, copy, 34), 1200);
  },

  setupAgeCounter() {
    if (!$('#ageCounter')) return;
    this.updateAgeCounter();
    this.ageTimer = window.setInterval(() => this.updateAgeCounter(), 1000);
  },

  updateAgeCounter() {
    const now = new Date();
    const diff = Math.max(0, now.getTime() - this.birthday.getTime());
    const totalSeconds = Math.floor(diff / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);
    const fullYears = this.completedYears(now);
    const format = value => new Intl.NumberFormat('en-IN').format(value);

    this.setText('#ageYears', format(fullYears));
    this.setText('#ageDays', format(totalDays));
    this.setText('#ageHours', format(totalHours));
    this.setText('#ageMinutes', format(totalMinutes));
    this.setText('#ageSeconds', format(totalSeconds));
  },

  completedYears(now) {
    let years = now.getFullYear() - this.birthday.getFullYear();
    const birthdayThisYear = new Date(now.getFullYear(), this.birthday.getMonth(), this.birthday.getDate());
    if (now < birthdayThisYear) years -= 1;
    return Math.max(0, years);
  },

  setText(selector, value) {
    const el = $(selector);
    if (el) el.textContent = value;
  },

  setupHearts() {
    if (reducedMotion) return;
    for (let i = 0; i < 10; i += 1) {
      window.setTimeout(() => this.spawnFloatingHeart(), i * 360);
    }
    this.heartTimer = window.setInterval(() => this.spawnFloatingHeart(), 1250);
  },

  spawnFloatingHeart() {
    const layer = $('#heartLayer');
    if (!layer || document.hidden) return;

    const heart = document.createElement('span');
    heart.className = 'float-heart';
    heart.textContent = Math.random() > 0.74 ? '♥' : '♡';
    heart.style.setProperty('--left', `${this.random(3, 97)}%`);
    heart.style.setProperty('--size', `${this.random(0.72, 1.3)}rem`);
    heart.style.setProperty('--duration', `${this.random(6.6, 9.4)}s`);
    heart.style.setProperty('--drift', `${this.random(-2.4, 2.4)}rem`);
    heart.style.setProperty('--spin', `${this.random(-24, 24)}deg`);
    heart.style.setProperty('--heart-color', this.pick([
      'rgba(255, 122, 164, 0.58)',
      'rgba(185, 157, 245, 0.52)',
      'rgba(255, 217, 137, 0.56)'
    ]));
    layer.appendChild(heart);
    window.setTimeout(() => heart.remove(), 9600);
  },

  burstFromElement(el, count = 9) {
    const rect = el.getBoundingClientRect();
    this.burstAt(rect.left + rect.width / 2, rect.top + rect.height / 2, count);
  },

  burstAt(x, y, count = 9) {
    if (reducedMotion) return;
    for (let i = 0; i < count; i += 1) {
      const heart = document.createElement('span');
      heart.className = 'burst-heart';
      heart.textContent = this.pick(['♡', '♥', '✦']);
      heart.style.setProperty('--x', `${x}px`);
      heart.style.setProperty('--y', `${y}px`);
      heart.style.setProperty('--dx', `${this.random(-58, 58)}px`);
      heart.style.setProperty('--dy', `${this.random(-72, -18)}px`);
      heart.style.setProperty('--burst-size', `${this.random(0.8, 1.25)}rem`);
      heart.style.setProperty('--burst-color', this.pick(['#ff7aa4', '#b99df5', '#ffd989']));
      document.body.appendChild(heart);
      window.setTimeout(() => heart.remove(), 900);
    }
  },

  setupNameGame() {
    const slots = $('#nameSlots');
    const tray = $('#letterTray');
    if (!slots || !tray) return;

    slots.innerHTML = '';
    tray.innerHTML = '';
    this.nameIndex = 0;

    this.name.forEach(() => {
      const slot = document.createElement('span');
      slot.className = 'name-slot';
      slot.textContent = '♡';
      slots.appendChild(slot);
    });

    this.shuffle(this.name.map((letter, index) => ({ letter, index }))).forEach(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'letter-tile';
      button.textContent = item.letter;
      button.setAttribute('aria-label', `Letter ${item.letter}`);
      button.addEventListener('click', () => this.chooseLetter(button, item.letter));
      tray.appendChild(button);
    });

    const note = $('#nameNote');
    if (note) note.textContent = 'The real name is hiding in the softest order.';
    $('#nameGame')?.classList.remove('is-complete');
  },

  chooseLetter(button, letter) {
    const expected = this.name[this.nameIndex];
    const note = $('#nameNote');

    if (letter !== expected) {
      button.classList.add('is-wrong');
      if (note) note.textContent = 'Almost. That letter is waiting for its own dramatic entry.';
      window.setTimeout(() => button.classList.remove('is-wrong'), 420);
      this.tapFeedback();
      return;
    }

    const slot = $$('.name-slot')[this.nameIndex];
    if (slot) {
      slot.textContent = letter;
      slot.classList.add('is-filled');
    }
    button.disabled = true;
    this.nameIndex += 1;
    this.burstFromElement(button, 7);
    AudioGarden.chime('soft');

    if (this.nameIndex >= this.name.length) {
      if (note) note.textContent = 'Anjali ✨ unlocked';
      $('#nameGame')?.classList.add('is-complete');
      this.burstAt(window.innerWidth / 2, window.innerHeight * 0.56, 18);
      AudioGarden.chime('unlock');
    } else if (note) {
      note.textContent = this.pick([
        'Yes. The name is getting warmer.',
        'One more tiny letter found.',
        'Careful. The next one is shy.'
      ]);
    }
  },

  setupCatGame() {
    this.catFinds = 0;
    this.hiddenCat = this.randomInt(0, 8);
    this.renderCatBoard();
    const note = $('#catNote');
    if (note) note.textContent = 'A suspiciously emotional cat is hiding somewhere.';
    $('#catGame')?.classList.remove('is-complete');
  },

  renderCatBoard() {
    const board = $('#catBoard');
    if (!board) return;

    const faces = ['☁', '🌸', '♡', '🎀', '🌙', '🐾', '✨', '🧶', '💗'];
    board.innerHTML = '';

    faces.forEach((face, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cat-cell';
      button.textContent = face;
      button.setAttribute('aria-label', `soft hiding spot ${index + 1}`);
      button.addEventListener('click', () => this.checkCat(button, index));
      board.appendChild(button);
    });
  },

  checkCat(button, index) {
    const note = $('#catNote');

    if (index !== this.hiddenCat) {
      button.textContent = this.pick(['♡', '😭', '🌸']);
      if (note) note.textContent = this.pick([
        'Not here. The cat is avoiding responsibilities.',
        'Tiny heartbreak. Try one more soft corner.',
        'No cat, only feelings.'
      ]);
      this.tapFeedback();
      return;
    }

    this.catFinds += 1;
    button.textContent = '🐱';
    button.classList.add('is-found');
    this.burstFromElement(button, 10);
    AudioGarden.chime(this.catFinds >= 3 ? 'unlock' : 'soft');

    const foundLines = [
      'Found her. She said meow and immediately became mysterious again.',
      'Cat located. Emotional support has been deployed.',
      'Final cat found. Hearts have entered the chat.'
    ];
    if (note) note.textContent = foundLines[this.catFinds - 1] || foundLines[2];

    if (this.catFinds >= 3) {
      $('#catGame')?.classList.add('is-complete');
      return;
    }

    window.setTimeout(() => {
      this.hiddenCat = this.nextCatIndex();
      this.renderCatBoard();
    }, 760);
  },

  nextCatIndex() {
    let next = this.randomInt(0, 8);
    while (next === this.hiddenCat) next = this.randomInt(0, 8);
    return next;
  },

  setupMoodGame() {
    const moods = {
      sleepy: {
        cat: '😴',
        text: 'Sleepy cat Anjali deserves a blanket, no questions, and the softest goodnight.'
      },
      angry: {
        cat: '😾',
        text: 'Angry cat Anjali is still cute. Slightly dangerous, but cute. Everyone should behave.'
      },
      cute: {
        cat: '🐱',
        text: 'Cute cat Anjali is not a mood. It is basically the default setting.'
      },
      emotional: {
        cat: '🥺',
        text: 'Emotional cat Anjali can feel deeply and still be safe. Soft hearts are brave too.'
      }
    };

    $$('.mood-buttons button').forEach(button => {
      const mood = button.dataset.mood;
      button.dataset.cat = moods[mood]?.cat || '🐾';
      button.addEventListener('click', () => {
        const result = $('#moodResult');
        if (result) result.textContent = moods[mood].text;
        $('#moodGame')?.classList.add('is-complete');
        this.burstFromElement(button, 11);
        AudioGarden.chime('soft');
      });
    });
  },

  setupEnvelope() {
    const envelope = $('#envelope');
    const letter = $('#secretLetter');
    const output = $('#typedMessage');
    if (!envelope || !letter || !output) return;

    const message = [
      'Dear Anjali,',
      '',
      'I hope today feels gentle with you.',
      '',
      'You have this rare way of making ordinary conversations feel safe. Even when you are tired, even when your mind is noisy, there is still a softness in you that reaches people.',
      '',
      'This little page is not trying to be perfect. It is just a small place saying: you matter, your voice matters, your silly moods matter, and the world feels warmer with you in it.',
      '',
      'Happy birthday. Stay the kind of soft that survives.'
    ].join('\n');

    envelope.addEventListener('click', async () => {
      if (this.envelopeOpened) return;
      this.envelopeOpened = true;
      envelope.classList.add('is-open');
      letter.classList.add('is-visible');
      this.burstFromElement(envelope, 16);
      AudioGarden.chime('unlock');
      const token = ++this.letterToken;
      await this.typeText(output, message, 22, token);
    });
  },

  setupReplay() {
    const replay = $('#replayButton');
    if (!replay) return;

    replay.addEventListener('click', () => {
      this.setupNameGame();
      this.setupCatGame();
      const moodResult = $('#moodResult');
      if (moodResult) moodResult.textContent = 'Pick one and let the cat committee respond.';
      $('#moodGame')?.classList.remove('is-complete');

      const envelope = $('#envelope');
      const letter = $('#secretLetter');
      const output = $('#typedMessage');
      this.envelopeOpened = false;
      this.letterToken += 1;
      envelope?.classList.remove('is-open');
      letter?.classList.remove('is-visible');
      if (output) output.textContent = '';

      $('#memories')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
      this.burstFromElement(replay, 14);
    });
  },

  typeText(el, text, speed = 24, token = null) {
    return new Promise(resolve => {
      el.textContent = '';
      let index = 0;

      const tick = () => {
        if (token !== null && token !== this.letterToken) {
          resolve();
          return;
        }
        el.textContent = text.slice(0, index);
        index += 1;
        if (index <= text.length) {
          window.setTimeout(tick, speed);
        } else {
          resolve();
        }
      };

      tick();
    });
  },

  tapFeedback() {
    if (navigator.vibrate) navigator.vibrate(18);
  },

  shuffle(items) {
    return items
      .map(item => ({ item, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ item }) => item);
  },

  pick(items) {
    return items[Math.floor(Math.random() * items.length)];
  },

  random(min, max) {
    return Math.random() * (max - min) + min;
  },

  randomInt(min, max) {
    return Math.floor(this.random(min, max + 1));
  }
};

const AudioGarden = {
  audio: null,
  ctx: null,
  master: null,
  playing: false,
  userPaused: false,
  autoplayBlocked: false,
  fadeTimer: null,
  desiredVolume: 0.42,

  init() {
    this.audio = $('#bgm');
    if (!this.audio) return;

    this.audio.volume = this.desiredVolume;
    this.audio.muted = false;
    this.audio.loop = true;

    this.audio.addEventListener('play', () => {
      this.playing = !this.audio.paused;
      this.updateButtons();
    });

    this.audio.addEventListener('pause', () => {
      this.playing = false;
      this.updateButtons();
    });

    this.tryAutoplay();
    window.addEventListener('load', () => this.tryAutoplay(), { once: true });

    this.fadeTimer = window.setTimeout(() => this.tryAutoplay(), 1850);

    const unlock = event => {
      if (event.target.closest('#musicToggle, #heroMusic')) return;
      if (!this.isAudible() && !this.userPaused) this.startAudible();
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
  },

  async toggle() {
    if (this.isAudible()) {
      this.userPaused = true;
      clearTimeout(this.fadeTimer);
      this.stop();
      return;
    }

    this.userPaused = false;
    await this.startAudible();
  },

  async tryAutoplay() {
    if (!this.audio || this.isAudible() || this.userPaused) return;
    await this.startAudible(true);
    if (!this.isAudible()) await this.startMutedFallback();
  },

  async startMutedFallback() {
    if (!this.audio || this.userPaused || !this.audio.paused) {
      this.autoplayBlocked = !this.isAudible();
      this.updateButtons();
      return;
    }

    try {
      this.audio.muted = true;
      this.audio.volume = 0;
      await this.audio.play();
      this.playing = true;
      this.autoplayBlocked = true;
    } catch (error) {
      this.playing = false;
      this.autoplayBlocked = true;
    }
    this.updateButtons();
  },

  async ensureChimeContext() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return;
    }

    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.24;
      this.master.connect(this.ctx.destination);
      if (this.ctx.state === 'suspended') await this.ctx.resume();
    } catch (error) {
      this.ctx = null;
    }
  },

  async startAudible(isAutoplayAttempt = false) {
    if (!this.audio) return;
    try {
      this.audio.muted = false;
      this.audio.volume = isAutoplayAttempt ? this.desiredVolume : Math.max(this.audio.volume, 0.08);
      await this.audio.play();
      this.playing = !this.audio.paused;
      this.autoplayBlocked = !this.isAudible();
      if (!isAutoplayAttempt) this.rampVolume(this.desiredVolume, 700);
    } catch (error) {
      this.playing = false;
      this.autoplayBlocked = isAutoplayAttempt;
    }
    this.updateButtons();
  },

  stop() {
    if (!this.audio) return;
    this.audio.muted = false;
    this.audio.pause();
    this.playing = false;
    this.autoplayBlocked = false;
    this.updateButtons();
  },

  rampVolume(target, duration) {
    if (!this.audio) return;
    const start = this.audio.volume;
    const startedAt = performance.now();
    const step = now => {
      if (!this.audio || this.userPaused) return;
      const progress = Math.min(1, (now - startedAt) / duration);
      this.audio.volume = start + (target - start) * progress;
      if (progress < 1) requestAnimationFrame(step);
      else this.updateButtons();
    };
    requestAnimationFrame(step);
  },

  isAudible() {
    return Boolean(this.audio && !this.audio.paused && !this.audio.muted && this.audio.volume > 0.02);
  },

  async chime(kind = 'soft') {
    await this.ensureChimeContext();
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const start = kind === 'unlock' ? 783.99 : 659.25;
    const end = kind === 'unlock' ? 1174.66 : 880;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(start, now);
    osc.frequency.exponentialRampToValueAtTime(end, now + 0.24);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.76);
  },

  updateButtons() {
    const musicToggle = $('#musicToggle');
    const heroMusic = $('#heroMusic');
    const audible = this.isAudible();
    [musicToggle, heroMusic].forEach(button => {
      if (!button) return;
      button.classList.toggle('is-on', audible);
      button.classList.toggle('is-blocked', this.autoplayBlocked);
      button.setAttribute('aria-pressed', String(audible));
    });
    if (musicToggle) {
      const label = $('small', musicToggle);
      if (label) label.textContent = audible ? 'on' : (this.autoplayBlocked ? 'tap' : 'music');
    }
    if (heroMusic) {
      heroMusic.textContent = audible ? 'music on' : (this.autoplayBlocked ? 'tap for music' : 'soft music');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => BirthdayWorld.init());

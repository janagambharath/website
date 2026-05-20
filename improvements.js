'use strict';

// Candle blow-out / relight (Level 0)
const CandleInteract = {
  blown: false,
  timer: null,

  attach() {
    const candle = document.querySelector('.l0-candle');
    if (!candle || candle.dataset.candleReady) return;
    candle.dataset.candleReady = '1';
    candle.addEventListener('click', () => this.toggle());
    candle.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.toggle();
      }
    });
  },

  toggle() {
    if (this.blown) return;
    const flame = document.querySelector('.l0-flame');
    if (!flame) return;

    this.blown = true;
    flame.classList.add('blown');
    AudioManager.chime('soft');
    Utils.vibrate([20, 50, 20]);

    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      flame.classList.remove('blown');
      flame.classList.add('relighting');
      AudioManager.tick();
      setTimeout(() => {
        flame.classList.remove('relighting');
        this.blown = false;
      }, 900);
    }, 2400);
  }
};

// Third aurora layer (Level 0)
function addAurora3() {
  const level0 = document.getElementById('level-0');
  if (!level0 || level0.querySelector('.l0-aurora-3')) return;
  const el = document.createElement('div');
  el.className = 'l0-aurora l0-aurora-3';
  el.setAttribute('aria-hidden', 'true');
  const mountains = level0.querySelector('.l0-mountains');
  if (mountains) level0.insertBefore(el, mountains);
  else level0.prepend(el);
}

const _l0InitBase = Level0.init.bind(Level0);
Level0.init = function () {
  _l0InitBase();
  addAurora3();
  setTimeout(() => CandleInteract.attach(), 900);
};

// Gyroscope parallax (Level 0, mobile)
const GyroParallax = {
  init() {
    if (!window.DeviceOrientationEvent) return;

    const start = () => this._listen();

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      document.addEventListener('click', () => {
        DeviceOrientationEvent.requestPermission()
          .then(state => { if (state === 'granted') start(); })
          .catch(() => {});
      }, { once: true });
    } else {
      start();
    }
  },

  _listen() {
    if (this.listening) return;
    this.listening = true;

    window.addEventListener('deviceorientation', event => {
      if (LevelManager.current !== 0) return;
      if (!this._calibrated) {
        this._baseGamma = event.gamma || 0;
        this._baseBeta = event.beta || 45;
        this._calibrated = true;
      }
      const tx = Math.max(-12, Math.min(12, (event.gamma || 0) - this._baseGamma));
      const ty = Math.max(-8, Math.min(8, (event.beta || 45) - this._baseBeta));

      const moon = document.querySelector('.l0-moon');
      const a1 = document.querySelector('.l0-aurora');
      const a2 = document.querySelector('.l0-aurora-2');

      if (moon) {
        moon.style.transform =
          `translateX(calc(-50% + ${tx * 1.1}px)) translateY(${ty * 0.5}px)`;
      }
      if (a1) a1.style.transform = `translateX(${tx * 2.2}px)`;
      if (a2) a2.style.transform = `translateX(${-tx * 1.5}px)`;
    }, { passive: true });
  }
};

// P.S. extension in Level 6 letter
Level6.letterLines = [
  ...Level6.letterLines,
  { text: '', cls: 'blank' },
  { text: '', cls: 'blank' },
  { text: 'P.S.', cls: 'greeting' },
  { text: 'This little world will keep the lights on for you.', cls: 'sign-off' },
  { text: 'Come back on the nights that feel too heavy.', cls: 'sign-off' },
  { text: 'You are known, you are seen, and you are worth every quiet celebration.', cls: 'indent' }
];

// Enhanced wish sparkles
const _wishReleaseBase = WishJar.release.bind(WishJar);
WishJar.release = async function (text) {
  const colours = ['var(--gold)', 'var(--blush)', 'var(--sky)'];
  for (let i = 0; i < 22; i += 1) {
    setTimeout(() => {
      const dot = document.createElement('span');
      dot.className = 'wish-sparkle';
      const size = `${Utils.rand(4, 11)}px`;
      dot.style.cssText = [
        `left:${Utils.rand(12, 88)}vw`,
        `top:${Utils.rand(12, 88)}vh`,
        `width:${size}`,
        `height:${size}`,
        `background:${colours[Utils.randInt(0, 2)]}`,
        `animation-duration:${Utils.rand(0.6, 1.1)}s`
      ].join(';');
      document.body.appendChild(dot);
      setTimeout(() => dot.remove(), 1200);
    }, i * 55);
  }
  return _wishReleaseBase(text);
};

// 19 Reasons - secret unlockable at the final scene
const ReasonsVault = {
  reasons: [
    'She finds meaning in things others scroll past.',
    'Her love for mountains is not just aesthetic - it is spiritual.',
    'She makes silences feel comfortable rather than awkward.',
    'Even her overthinking comes from a place of care.',
    'She can be funny and deeply soft at the same time.',
    'She remembers small things people share with her.',
    'Her taste in music says more about her than she realises.',
    'She is honest even when a prettier lie would be easier.',
    'Cats trust her, and that means something.',
    'She has been through things quietly that would have broken others loudly.',
    'She knows the difference between being alone and being lonely.',
    'Her peace is not given to just anyone - it is earned.',
    'She carries dreams the way others carry photographs.',
    'She sees beauty in ordinary things - tea, rain, mist, a quiet window.',
    'Her softness is not weakness. It is a choice she keeps making.',
    'She makes people feel seen without even trying to.',
    'She deserves the pahad ka ghar she keeps imagining.',
    'The world is a little quieter, a little warmer, with her in it.',
    'She is exactly nineteen. Not a moment wasted. Not a detail missed.'
  ],

  show() {
    if (!document.getElementById('reasons-overlay')) this._build();
    const overlay = document.getElementById('reasons-overlay');
    overlay.classList.add('visible');
    overlay.scrollTop = 0;
    AudioManager.chime('unlock');
    Utils.vibrate([20, 60, 20]);
  },

  hide() {
    const overlay = document.getElementById('reasons-overlay');
    if (overlay) overlay.classList.remove('visible');
  },

  _build() {
    const overlay = document.createElement('div');
    overlay.id = 'reasons-overlay';
    overlay.className = 'reasons-overlay';
    overlay.innerHTML = `
      <div class="reasons-card">
        <h2 class="reasons-title t-display">19 Reasons ✦</h2>
        ${this.reasons.map((reason, index) => `
          <div class="reason-item" style="animation-delay:${index * 58}ms">
            <span class="reason-num">${String(index + 1).padStart(2, '0')}</span>
            <span class="reason-text t-script">${reason}</span>
          </div>`).join('')}
        <button class="reasons-close return-btn" type="button">Close ✦</button>
      </div>`;
    const echo = document.createElement('div');
    echo.className = 'her-echo';
    echo.innerHTML = `
      <span class="her-echo-kicker">heard somewhere in all those late nights</span>
      <span class="her-echo-line">"why are you like this" \u{1F62D} (but she was smiling)</span>
    `;
    overlay.querySelector('.reasons-card').insertBefore(
      echo,
      overlay.querySelector('.reasons-close')
    );
    overlay.querySelector('.reasons-close').onclick = () => this.hide();
    overlay.onclick = event => {
      if (event.target === overlay) this.hide();
    };
    document.body.appendChild(overlay);
  }
};

window.ReasonsVault = ReasonsVault;

// Emoji polish and cat meme micro-surprises
const EmojiPolish = {
  cardBadges: [
    ['#card-hearts', '\u{1F49B}'],
    ['#card-overthink', '\u{1F62D}'],
    ['#card-cat', '\u{1F43E}'],
    ['#card-house', '\u{1F3D4}\uFE0F'],
    ['#card-mood', '\u2728']
  ],

  titleBadges: [
    ['#game-hearts .mini-game-title', '\u{1F49B}'],
    ['#game-overthink .mini-game-title', '\u{1F62D}'],
    ['#game-cat .mini-game-title', '\u{1F431}'],
    ['#game-house .mini-game-title', '\u{1F3D4}\uFE0F'],
    ['#game-mood .mini-game-title', '\u2728'],
    ['#birthday-badge', '\u{1F90D}']
  ],

  attach() {
    this.cardBadges.forEach(([selector, emoji]) => this.addSprinkle(selector, emoji));
    this.titleBadges.forEach(([selector, emoji]) => this.addInline(selector, emoji));
  },

  addSprinkle(selector, emoji) {
    const target = document.querySelector(selector);
    if (!target || target.querySelector('.emoji-sprinkle')) return;
    const span = document.createElement('span');
    span.className = 'emoji-sprinkle';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = emoji;
    target.appendChild(span);
  },

  addInline(selector, emoji) {
    const target = document.querySelector(selector);
    if (!target || target.querySelector('.inline-emoji')) return;
    const span = document.createElement('span');
    span.className = 'inline-emoji';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = emoji;
    target.append(' ', span);
  }
};

const CatMemeVault = {
  image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Surprised_Cat.jpg/450px-Surprised_Cat.jpg',
  memes: [
    ['RANDOM CAT REEL APPEARS', 'JILEBIII SENDS IT IN 0.2 SEC \u{1F62D}'],
    ['NO REPLY FOR 5 MINUTES', 'OVERTHINKING DEPARTMENT OPEN \u{1F43E}'],
    ['KEDARNATH PLAN?', 'CAT HAS ALREADY PACKED \u{1F3D4}\uFE0F'],
    ['LANGUAGE CLASS AT 2AM', 'MEOW ALSO NEEDS TRANSLATION \u2728'],
    ['SOFT CHAOS APPROVED', 'TINY CAT CERTIFIED \u{1F49B}']
  ],
  timer: null,

  attach() {
    const arena = document.getElementById('cat-arena');
    if (!arena || arena.querySelector('.cat-meme-stage')) return;

    const stage = document.createElement('div');
    stage.className = 'cat-meme-stage';
    stage.innerHTML = `
      <figure class="cat-meme-card" id="cat-meme-card" aria-hidden="true">
        <img class="cat-meme-photo" id="cat-meme-photo" alt="" loading="lazy" decoding="async">
        <span class="cat-meme-fallback" aria-hidden="true">\u{1F431}</span>
        <span class="cat-meme-scrim"></span>
        <figcaption class="cat-meme-caption top" id="cat-meme-top"></figcaption>
        <figcaption class="cat-meme-caption bottom" id="cat-meme-bottom"></figcaption>
      </figure>`;
    arena.appendChild(stage);

    const img = document.getElementById('cat-meme-photo');
    const card = document.getElementById('cat-meme-card');
    img.onerror = () => card.classList.add('image-failed');
    img.src = this.image;
  },

  show(index, isFinal = false) {
    this.attach();
    const card = document.getElementById('cat-meme-card');
    if (!card) return;
    const meme = this.memes[index % this.memes.length];
    document.getElementById('cat-meme-top').textContent = meme[0];
    document.getElementById('cat-meme-bottom').textContent = meme[1];
    card.classList.add('visible');
    AudioManager.chime(isFinal ? 'unlock' : 'soft');

    clearTimeout(this.timer);
    this.timer = setTimeout(() => card.classList.remove('visible'), isFinal ? 2200 : 1250);

    if (isFinal) this.extendQuote();
  },

  hide() {
    const card = document.getElementById('cat-meme-card');
    if (card) card.classList.remove('visible');
  },

  extendQuote() {
    const quote = document.getElementById('cat-quote');
    if (!quote || quote.querySelector('.cat-quote-tail')) return;
    const tail = document.createElement('span');
    tail.className = 'cat-quote-tail';
    tail.textContent = `Random cat reels officially approved. \u{1F62D}\u{1F43E}`;
    quote.appendChild(tail);
  }
};

window.CatMemeVault = CatMemeVault;

const _startCatBase = GameEngine.startCat.bind(GameEngine);
GameEngine.startCat = function () {
  _startCatBase();
  CatMemeVault.attach();
  CatMemeVault.hide();

  const cat = document.getElementById('game-cat-emoji');
  if (!cat || typeof cat.onclick !== 'function') return;

  const baseClick = cat.onclick;
  cat.onclick = event => {
    const before = this.catCount || 0;
    baseClick.call(cat, event);
    const after = this.catCount || 0;
    if (after > before) CatMemeVault.show(after - 1, after >= 5);
  };
};

const _startHeartsBase = GameEngine.startHearts.bind(GameEngine);
GameEngine.startHearts = function () {
  _startHeartsBase();
  const quote = document.getElementById('hearts-quote');
  if (quote && !quote.querySelector('.cat-quote-tail')) {
    const tail = document.createElement('span');
    tail.className = 'cat-quote-tail';
    tail.textContent = `A little extra softness, just because. \u{1F49B}\u{1F90D}\u2728`;
    quote.appendChild(tail);
  }
};

// Patch Level7.finalQuote - add "19 reasons" button
const _l7FinalQuoteBase = Level7.finalQuote.bind(Level7);
Level7.finalQuote = async function (token) {
  await _l7FinalQuoteBase(token);

  if (token !== this.runToken) return;

  if (document.getElementById('reasons-trigger-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'reasons-trigger-btn';
  btn.type = 'button';
  btn.className = 'return-btn';
  btn.textContent = '✦ 19 reasons she is worth celebrating';
  btn.style.cssText = `
    position: absolute;
    left: 50%;
    bottom: max(4.6rem, calc(env(safe-area-inset-bottom) + 4rem));
    z-index: 5;
    transform: translateX(-50%);
  `;
  btn.onclick = () => ReasonsVault.show();
  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'translateX(-50%) translateY(-1px)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translateX(-50%)';
  });

  document.getElementById('scene-4').appendChild(btn);

  setTimeout(() => {
    if (token !== Level7.runToken) return;
    btn.classList.add('visible');
  }, 9800);
};

window.addEventListener('DOMContentLoaded', () => {
  EmojiPolish.attach();
  GyroParallax.init();
});

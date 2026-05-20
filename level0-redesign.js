'use strict';

// Grain overlay injector
function injectGrainLayer() {
  const level0 = document.getElementById('level-0');
  if (!level0 || level0.querySelector('.l0-grain')) return;
  const grain = document.createElement('div');
  grain.className = 'l0-grain';
  grain.setAttribute('aria-hidden', 'true');
  level0.appendChild(grain);
}

// Third mist strip
function injectExtraMist() {
  const level0 = document.getElementById('level-0');
  if (!level0 || level0.querySelector('.l0-mist-extra, .mist-three')) return;

  const mist = document.createElement('div');
  mist.className = 'l0-mist l0-mist-extra';
  mist.setAttribute('aria-hidden', 'true');
  mist.style.cssText = `
    bottom: 43%;
    opacity: 0.3;
    height: 2rem;
    animation-duration: 35s;
    animation-delay: -15s;
    background: linear-gradient(90deg,
      transparent,
      rgba(217,139,168,0.06),
      rgba(143,216,210,0.07),
      transparent
    );
  `;

  const mountains = level0.querySelector('.l0-mountains');
  if (mountains) level0.insertBefore(mist, mountains);
}

// Enhanced star canvas - richer star field
const _level0OrigCreateStars = ParticleSystem.createStars.bind(ParticleSystem);
ParticleSystem.createStars = function () {
  const count = window.innerWidth < 600 ? 120 : 200;
  this.stars = Array.from({ length: count }, (_, index) => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: index < count * 0.72
      ? Utils.rand(0.2, 1.1)
      : index < count * 0.94
        ? Utils.rand(1.1, 2.2)
        : Utils.rand(2.2, 3.4),
    phase: Utils.rand(0, Math.PI * 2),
    speed: Utils.rand(0.15, 0.85),
    drift: Utils.rand(-0.025, 0.025),
    tint: Math.random() < 0.12 ? 'gold' : Math.random() < 0.08 ? 'blue' : 'white'
  }));
};

const _level0OrigAnimate = ParticleSystem.animate.bind(ParticleSystem);
ParticleSystem.animate = function () {
  const ctx = this.ctx;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  const t = performance.now() * 0.001;

  this.stars.forEach(star => {
    star.x += star.drift;
    if (star.x < -10) star.x = window.innerWidth + 10;
    if (star.x > window.innerWidth + 10) star.x = -10;

    const alpha = 0.14 + 0.70 * (0.5 + 0.5 * Math.sin(t * star.speed + star.phase));
    let color;

    if (star.tint === 'gold') {
      color = `rgba(215,183,106,${alpha * 0.9})`;
    } else if (star.tint === 'blue') {
      color = `rgba(143,216,210,${alpha * 0.75})`;
    } else {
      color = `rgba(248,239,227,${alpha})`;
    }

    if (star.r > 2.2) {
      const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.r * 4.5);
      glow.addColorStop(0, star.tint === 'gold'
        ? `rgba(215,183,106,${alpha * 0.22})`
        : `rgba(248,239,227,${alpha * 0.18})`
      );
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r * 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  });

  requestAnimationFrame(() => this.animate());
};

// Mouse parallax for moon and aurora on desktop
const MouseParallax = {
  targetX: 0,
  targetY: 0,
  currentX: 0,
  currentY: 0,
  active: false,

  init() {
    if (this.active || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    this.active = true;

    document.addEventListener('mousemove', event => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      this.targetX = ((event.clientX - cx) / cx) * 14;
      this.targetY = ((event.clientY - cy) / cy) * 8;
    }, { passive: true });

    this.tick();
  },

  tick() {
    if (LevelManager.current === 0) {
      this.currentX += (this.targetX - this.currentX) * 0.045;
      this.currentY += (this.targetY - this.currentY) * 0.045;

      const moon = document.querySelector('.l0-moon');
      const a1 = document.querySelector('.l0-aurora');
      const a2 = document.querySelector('.l0-aurora-2');
      const a3 = document.querySelector('.l0-aurora-3');

      if (moon) {
        moon.style.transform =
          `translateX(calc(-50% + ${this.currentX * 1.2}px)) translateY(${this.currentY * 0.6}px)`;
      }
      if (a1) a1.style.transform = `translateX(${this.currentX * 2.4}px) skewX(-8deg)`;
      if (a2) a2.style.transform = `translateX(${-this.currentX * 1.8}px)`;
      if (a3) a3.style.transform = `translateX(${this.currentX * 1.1}px)`;
    }

    requestAnimationFrame(() => this.tick());
  }
};

// Distant mountain shimmer particles
const PeakSparkles = {
  active: false,
  timer: null,

  start() {
    if (this.active) return;
    this.active = true;
    this.schedule();
  },

  stop() {
    this.active = false;
    clearTimeout(this.timer);
  },

  schedule() {
    if (!this.active) return;
    this.timer = setTimeout(() => {
      if (LevelManager.current === 0) this.sparkle();
      this.schedule();
    }, Utils.rand(3200, 7500));
  },

  sparkle() {
    const level0 = document.getElementById('level-0');
    if (!level0) return;

    const peaks = [
      { x: 27, y: 49 }, { x: 45, y: 42 }, { x: 62, y: 44 },
      { x: 73, y: 46 }, { x: 18, y: 52 }, { x: 85, y: 48 }
    ];
    const peak = peaks[Math.floor(Math.random() * peaks.length)];

    const dot = document.createElement('span');
    dot.setAttribute('aria-hidden', 'true');
    dot.style.cssText = `
      position: absolute;
      left: ${peak.x + Utils.rand(-2, 2)}%;
      top: ${peak.y + Utils.rand(-1, 1)}%;
      width: ${Utils.rand(2, 5)}px;
      height: ${Utils.rand(2, 5)}px;
      border-radius: 999px;
      background: rgba(215,183,106,0.9);
      z-index: 5;
      pointer-events: none;
      animation: peakSparkle ${Utils.rand(0.8, 1.6)}s ease-out forwards;
    `;
    level0.appendChild(dot);
    setTimeout(() => dot.remove(), 1700);
  }
};

const peakSparkleStyle = document.createElement('style');
peakSparkleStyle.textContent = `
@keyframes peakSparkle {
  0% { opacity: 0; transform: scale(0.4); }
  30% { opacity: 1; transform: scale(1.2); }
  60% { opacity: 0.8; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.2) translateY(-8px); }
}
`;
document.head.appendChild(peakSparkleStyle);

// Patch Level0.init
const _l0InitRedesign = Level0.init.bind(Level0);
Level0.init = function () {
  _l0InitRedesign();
  injectGrainLayer();
  injectExtraMist();
  PeakSparkles.start();
};

window.addEventListener('DOMContentLoaded', () => {
  ParticleSystem.createStars();
  MouseParallax.init();
}, { once: true });

// Stop peak sparkles when leaving Level 0
const _level0OrigShowLevel = LevelManager.showLevel.bind(LevelManager);
LevelManager.showLevel = function (num) {
  if (num !== 0) PeakSparkles.stop();
  _level0OrigShowLevel(num);
  if (num === 0) setTimeout(() => PeakSparkles.start(), 1500);
};

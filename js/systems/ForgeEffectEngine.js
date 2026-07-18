
export class ForgeEffectEngine {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "forge-effect-canvas";
    this.context = this.canvas.getContext("2d");
    this.particles = [];
    this.smoke = [];
    this.flash = 0;
    this.heat = 0;
    this.cooling = 0;
    this.running = true;

    container.style.position = "relative";
    container.appendChild(this.canvas);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.animate();
  }

  trigger(step) {
    const bounds = this.canvas.getBoundingClientRect();
    const x = bounds.width * 0.5;
    const y = bounds.height * 0.55;

    if (step === 0) {
      this.heat = 1;
      this.flash = 0.45;
      this.emitSmoke(x, y, 18);
    } else if (step === 1 || step === 2) {
      this.emitSparks(x, y, step === 1 ? 70 : 45);
      this.flash = 1;
      this.heat = Math.max(this.heat, 0.72);
    } else if (step === 3) {
      this.cooling = 1;
      this.emitSteam(x, y, 34);
      this.flash = 0.28;
    } else if (step === 4) {
      this.emitSparks(x, y, 28);
      this.flash = 0.65;
    } else {
      this.emitSparks(x, y, 110);
      this.emitSmoke(x, y, 26);
      this.flash = 1.4;
      this.heat = 0.95;
    }
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    this.canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  emitSparks(x, y, count) {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.4 + Math.random() * 7.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        life: 26 + Math.random() * 34,
        size: 1 + Math.random() * 2.4,
        hue: 24 + Math.random() * 30
      });
    }
  }

  emitSmoke(x, y, count) {
    for (let index = 0; index < count; index += 1) {
      this.smoke.push({
        x: x + (Math.random() - 0.5) * 45,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 0.45,
        vy: -0.35 - Math.random() * 0.9,
        life: 70 + Math.random() * 80,
        size: 16 + Math.random() * 38,
        alpha: 0.08 + Math.random() * 0.14,
        steam: false
      });
    }
  }

  emitSteam(x, y, count) {
    for (let index = 0; index < count; index += 1) {
      this.smoke.push({
        x: x + (Math.random() - 0.5) * 55,
        y: y + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 0.65,
        vy: -0.8 - Math.random() * 1.4,
        life: 48 + Math.random() * 65,
        size: 14 + Math.random() * 32,
        alpha: 0.12 + Math.random() * 0.2,
        steam: true
      });
    }
  }

  animate() {
    if (!this.running) return;
    requestAnimationFrame(() => this.animate());

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const context = this.context;
    context.clearRect(0, 0, width, height);

    if (this.heat > 0.005) {
      const gradient = context.createRadialGradient(
        width * 0.5, height * 0.58, 0,
        width * 0.5, height * 0.58, width * 0.36
      );
      gradient.addColorStop(0, `rgba(255,84,16,${0.23 * this.heat})`);
      gradient.addColorStop(0.42, `rgba(255,156,42,${0.11 * this.heat})`);
      gradient.addColorStop(1, "rgba(255,120,30,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
      this.heat *= 0.988;
    }

    for (const particle of this.particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.985;
      particle.vy += 0.12;
      particle.life -= 1;

      context.beginPath();
      context.fillStyle = `hsla(${particle.hue},100%,65%,${Math.min(1, particle.life / 22)})`;
      context.shadowBlur = 10;
      context.shadowColor = "#ff7b23";
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    }
    context.shadowBlur = 0;
    this.particles = this.particles.filter((particle) => particle.life > 0);

    for (const cloud of this.smoke) {
      cloud.x += cloud.vx;
      cloud.y += cloud.vy;
      cloud.size += 0.12;
      cloud.life -= 1;
      const alpha = cloud.alpha * Math.min(1, cloud.life / 28);
      context.beginPath();
      context.fillStyle = cloud.steam
        ? `rgba(220,240,255,${alpha})`
        : `rgba(92,98,108,${alpha})`;
      context.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
      context.fill();
    }
    this.smoke = this.smoke.filter((cloud) => cloud.life > 0);

    if (this.flash > 0.01) {
      context.fillStyle = `rgba(255,235,180,${Math.min(0.38, this.flash * 0.2)})`;
      context.fillRect(0, 0, width, height);
      this.flash *= 0.78;
    }
  }
}

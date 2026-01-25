/**
 * JAGHI - Rising Particles Effect
 * Inspired by Pluribus opening sequence
 */

class RisingParticles {
    constructor() {
        this.canvas = document.getElementById('particles');
        this.ctx = this.canvas.getContext('2d');

        this.particles = [];
        this.time = 0;

        this.init();
        this.animate();

        window.addEventListener('resize', () => this.handleResize());
    }

    init() {
        this.resize();
        this.createParticles();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }

    handleResize() {
        this.resize();
        // Keep existing particles but adjust spawn area
    }

    createParticle(startFromBottom = true) {
        const x = Math.random() * this.canvas.width;
        const y = startFromBottom
            ? this.canvas.height + Math.random() * 100
            : Math.random() * this.canvas.height;

        // Vary particle characteristics for depth
        const depthLayer = Math.random();
        const isClose = depthLayer > 0.85;
        const isMid = depthLayer > 0.4 && depthLayer <= 0.85;

        let size, speed, opacity;

        if (isClose) {
            // Close/large particles - rare, slow, prominent
            size = Math.random() * 2 + 1.5;
            speed = Math.random() * 0.3 + 0.15;
            opacity = Math.random() * 0.4 + 0.3;
        } else if (isMid) {
            // Medium particles
            size = Math.random() * 1.2 + 0.6;
            speed = Math.random() * 0.5 + 0.25;
            opacity = Math.random() * 0.3 + 0.15;
        } else {
            // Far/small particles - many, fast, dim
            size = Math.random() * 0.6 + 0.2;
            speed = Math.random() * 0.8 + 0.4;
            opacity = Math.random() * 0.15 + 0.05;
        }

        return {
            x,
            y,
            baseX: x,
            size,
            baseOpacity: opacity,
            opacity,
            speed,
            // Subtle horizontal drift
            drift: (Math.random() - 0.5) * 0.2,
            driftPhase: Math.random() * Math.PI * 2,
            driftSpeed: Math.random() * 0.005 + 0.002,
            // Twinkle effect
            twinkleSpeed: Math.random() * 0.02 + 0.01,
            twinklePhase: Math.random() * Math.PI * 2
        };
    }

    createParticles() {
        // Calculate particle count based on screen area
        const area = this.canvas.width * this.canvas.height;
        const count = Math.floor(area / 4000); // Adjust density

        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle(false)); // Start distributed
        }
    }

    updateParticle(p) {
        // Rising motion
        p.y -= p.speed;

        // Subtle horizontal drift (sine wave)
        p.driftPhase += p.driftSpeed;
        const driftOffset = Math.sin(p.driftPhase) * 30;
        p.x = p.baseX + driftOffset + p.drift * this.time;

        // Twinkle effect
        p.twinklePhase += p.twinkleSpeed;
        const twinkle = Math.sin(p.twinklePhase) * 0.3 + 0.7;
        p.opacity = p.baseOpacity * twinkle;

        // Respawn at bottom when off screen
        if (p.y < -50) {
            p.y = this.canvas.height + 50;
            p.x = Math.random() * this.canvas.width;
            p.baseX = p.x;
            p.driftPhase = Math.random() * Math.PI * 2;
        }

        // Wrap horizontally
        if (p.x < -50) {
            p.x = this.canvas.width + 50;
            p.baseX = p.x;
        } else if (p.x > this.canvas.width + 50) {
            p.x = -50;
            p.baseX = p.x;
        }
    }

    drawParticle(p) {
        if (p.opacity <= 0.01) return;

        this.ctx.save();

        // Soft glow effect for larger particles
        if (p.size > 1) {
            const gradient = this.ctx.createRadialGradient(
                p.x, p.y, 0,
                p.x, p.y, p.size * 4
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${p.opacity * 0.3})`);
            gradient.addColorStop(0.5, `rgba(220, 230, 255, ${p.opacity * 0.1})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Core particle
        this.ctx.globalAlpha = p.opacity;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    update() {
        // Update particles
        this.particles.forEach(p => this.updateParticle(p));

        // Occasionally spawn new particle to maintain density
        if (Math.random() < 0.02 && this.particles.length < 500) {
            this.particles.push(this.createParticle(true));
        }

        this.time++;
    }

    draw() {
        // Clear with slight trail for smoothness
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw particles sorted by size (smaller = further = drawn first)
        const sortedParticles = [...this.particles].sort((a, b) => a.size - b.size);
        sortedParticles.forEach(p => this.drawParticle(p));
    }

    animate() {
        this.update();
        this.draw();

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for font to load
    document.fonts.ready.then(() => {
        new RisingParticles();
    });
});

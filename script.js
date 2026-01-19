/**
 * Pluribus Effect - Letras formadas por partículas com ondas de rádio
 * Baseado na técnica descrita por Skewcy
 */

class PluribusEffect {
    constructor() {
        this.canvas = document.getElementById('particles');
        this.ctx = this.canvas.getContext('2d');

        // Canvas auxiliar para extrair pixels do texto
        this.textCanvas = document.createElement('canvas');
        this.textCtx = this.textCanvas.getContext('2d');

        this.particles = [];
        this.textParticles = [];
        this.backgroundParticles = [];

        this.time = 0;
        this.lastPulseTime = 0;
        this.pulseInterval = 1000; // pulsos a cada 1 segundo
        this.pulseRadius = 0;
        this.pulses = [];

        this.text = 'JAGHI';

        this.init();
        this.animate();

        window.addEventListener('resize', () => this.handleResize());
    }

    init() {
        this.resize();
        this.createTextParticles();
        this.createBackgroundParticles();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;

        // Centro das ondas fora da tela à esquerda
        this.pulseOriginX = -2000;
        this.pulseOriginY = this.centerY;

        // Raio máximo: distância até o canto mais distante (direita) + margem
        this.maxRadius = Math.sqrt(
            Math.pow(this.canvas.width - this.pulseOriginX, 2) + Math.pow(this.canvas.height / 2, 2)
        ) + 100;
    }

    handleResize() {
        this.resize();
        this.createTextParticles();
        this.createBackgroundParticles();
    }

    createTextParticles() {
        this.textParticles = [];

        // Configurar canvas auxiliar
        const fontSize = Math.min(this.canvas.width * 0.12, 120);
        this.textCanvas.width = this.canvas.width;
        this.textCanvas.height = this.canvas.height;

        // Desenhar texto no canvas auxiliar
        this.textCtx.fillStyle = '#ffffff';
        this.textCtx.font = `300 ${fontSize}px Inter, -apple-system, sans-serif`;
        this.textCtx.textAlign = 'center';
        this.textCtx.textBaseline = 'middle';
        this.textCtx.letterSpacing = `${fontSize * 0.4}px`;
        this.textCtx.fillText(this.text, this.centerX, this.centerY);

        // Extrair pixels do texto
        const imageData = this.textCtx.getImageData(
            0, 0, this.textCanvas.width, this.textCanvas.height
        );
        const data = imageData.data;

        // Densidade de amostragem (pixels entre cada partícula)
        const gap = 3;

        for (let y = 0; y < this.textCanvas.height; y += gap) {
            for (let x = 0; x < this.textCanvas.width; x += gap) {
                const index = (y * this.textCanvas.width + x) * 4;
                const alpha = data[index + 3];

                // Se o pixel tem opacidade (faz parte do texto)
                if (alpha > 128) {
                    this.textParticles.push({
                        x: x,
                        y: y,
                        baseX: x,
                        baseY: y,
                        size: Math.random() * 1.5 + 1,
                        baseOpacity: 0.8 + Math.random() * 0.2,
                        opacity: 0.9,
                        vx: 0,
                        vy: 0,
                        isText: true
                    });
                }
            }
        }
    }

    createBackgroundParticles() {
        this.backgroundParticles = [];

        // Partículas de fundo espalhadas
        const count = Math.floor((this.canvas.width * this.canvas.height) / 3000);

        for (let i = 0; i < count; i++) {
            this.backgroundParticles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                baseX: Math.random() * this.canvas.width,
                baseY: Math.random() * this.canvas.height,
                size: Math.random() * 1.2 + 0.3,
                baseOpacity: Math.random() * 0.3 + 0.1,
                opacity: 0.2,
                vx: 0,
                vy: 0,
                isText: false
            });
        }
    }

    createPulse() {
        // Raio inicial = distância do ponto de origem até a borda esquerda da tela
        const initialRadius = Math.abs(this.pulseOriginX);
        this.pulses.push({
            radius: initialRadius,
            birthTime: performance.now(),
            opacity: 1
        });
    }

    updateParticle(p, currentTime) {
        // Força de retorno à posição base (efeito mola) - mais forte para partículas do texto
        const springForce = p.isText ? 0.08 : 0.03;
        const dx = p.baseX - p.x;
        const dy = p.baseY - p.y;

        p.vx += dx * springForce;
        p.vy += dy * springForce;

        // Efeito das ondas
        this.pulses.forEach(pulse => {
            const distFromPulseOrigin = Math.sqrt(
                Math.pow(p.x - this.pulseOriginX, 2) +
                Math.pow(p.y - this.pulseOriginY, 2)
            );

            const pulseRadius = pulse.radius;
            const distFromWave = Math.abs(distFromPulseOrigin - pulseRadius);
            const waveWidth = 120; // Onda mais larga para afetar mais partículas

            if (distFromWave < waveWidth) {
                // Força da onda baseada na distância
                const waveStrength = (1 - distFromWave / waveWidth) * pulse.opacity;
                const angle = Math.atan2(p.y - this.pulseOriginY, p.x - this.pulseOriginX);

                // Deslocamento perpendicular e radial (mais forte para partículas de fundo)
                const forceMultiplier = p.isText ? 0.4 : 2.5;
                const perpForce = Math.sin(distFromPulseOrigin * 0.05 + this.time * 0.03) * 3 * forceMultiplier;
                const radialForce = waveStrength * 2.5 * forceMultiplier;

                p.vx += Math.cos(angle) * radialForce + Math.cos(angle + Math.PI / 2) * perpForce * waveStrength;
                p.vy += Math.sin(angle) * radialForce + Math.sin(angle + Math.PI / 2) * perpForce * waveStrength;

                // Aumentar opacidade quando a onda passa
                p.opacity = Math.min(1, p.baseOpacity + waveStrength * 0.5);
            }
        });


        // Damping (amortecimento)
        p.vx *= 0.92;
        p.vy *= 0.92;

        // Aplicar velocidade
        p.x += p.vx;
        p.y += p.vy;

        // Retornar opacidade gradualmente
        p.opacity += (p.baseOpacity - p.opacity) * 0.05;
    }

    updatePulses(currentTime) {
        const expansionSpeed = 120; // pixels por segundo
        const initialRadius = Math.abs(this.pulseOriginX);

        this.pulses = this.pulses.filter(pulse => {
            const age = Math.max(0, currentTime - pulse.birthTime);
            pulse.radius = Math.max(0, initialRadius + (age / 1000) * expansionSpeed);

            // Fade out gradual - começa após passar pela área visível
            const fadeStart = initialRadius + (this.maxRadius - initialRadius) * 0.3;
            if (pulse.radius > fadeStart) {
                pulse.opacity = Math.max(0, 1 - ((pulse.radius - fadeStart) / (this.maxRadius - fadeStart)));
            }

            return pulse.radius < this.maxRadius && pulse.opacity > 0.01;
        });
    }

    drawParticle(p) {
        if (p.opacity <= 0.01) return;

        this.ctx.save();
        this.ctx.globalAlpha = p.opacity;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawPulseRings() {
        this.pulses.forEach(pulse => {
            // Verificar se o raio é positivo e opacidade é visível
            if (pulse.radius > 0 && pulse.opacity > 0.02) {
                // Efeito ripple com múltiplos anéis concêntricos
                const ringCount = 5;
                const ringSpacing = 12;

                for (let i = 0; i < ringCount; i++) {
                    const ringRadius = pulse.radius - (i * ringSpacing);
                    if (ringRadius < 1) continue;

                    // Opacidade diminui para anéis internos com curva suave
                    const falloff = Math.pow(1 - (i / ringCount), 1.5);
                    const ringOpacity = pulse.opacity * falloff;

                    // Linha mais grossa no anel principal, mais fina nos internos
                    const lineWidth = 2.5 - (i * 0.4);

                    this.ctx.save();
                    this.ctx.globalAlpha = ringOpacity * 0.25;
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.lineWidth = Math.max(0.5, lineWidth);
                    this.ctx.beginPath();
                    this.ctx.arc(this.pulseOriginX, this.pulseOriginY, ringRadius, 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.restore();
                }

                // Adicionar um brilho sutil na borda principal
                if (pulse.radius > 5) {
                    this.ctx.save();
                    this.ctx.globalAlpha = pulse.opacity * 0.1;
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.lineWidth = 8;
                    this.ctx.beginPath();
                    this.ctx.arc(this.pulseOriginX, this.pulseOriginY, pulse.radius, 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.restore();
                }
            }
        });
    }

    update(currentTime) {
        // Criar novo pulso a cada intervalo
        if (currentTime - this.lastPulseTime >= this.pulseInterval) {
            this.createPulse();
            this.lastPulseTime = currentTime;
        }

        // Atualizar pulsos
        this.updatePulses(currentTime);

        // Atualizar partículas do texto
        this.textParticles.forEach(p => this.updateParticle(p, currentTime));

        // Atualizar partículas de fundo
        this.backgroundParticles.forEach(p => this.updateParticle(p, currentTime));

        this.time++;
    }

    draw() {
        // Trail effect - limpar mais rápido para manter texto nítido
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Desenhar anéis dos pulsos (sutis)
        this.drawPulseRings();

        // Desenhar partículas de fundo primeiro
        this.backgroundParticles.forEach(p => this.drawParticle(p));

        // Desenhar partículas do texto por cima
        this.textParticles.forEach(p => this.drawParticle(p));
    }

    animate() {
        const currentTime = performance.now();

        this.update(currentTime);
        this.draw();

        requestAnimationFrame(() => this.animate());
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar fonte carregar
    document.fonts.ready.then(() => {
        new PluribusEffect();
    });
});

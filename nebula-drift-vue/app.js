const { createApp, ref, onMounted, onUnmounted, watch } = Vue;

createApp({
    setup() {
        const nebulaCanvas = ref(null);
        const particleCount = ref(0);
        const status = ref('GENERATING...');
        const speed = ref(3);
        const complexity = ref(300);

        let ctx = null;
        let particles = [];
        let animationFrameId = null;
        let width = window.innerWidth;
        let height = window.innerHeight;

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * speed.value;
                this.vy = (Math.random() - 0.5) * speed.value;
                this.radius = Math.random() * 2 + 0.5;
                const colors = ['#00ffcc', '#ff00ff', '#0099ff', '#9900ff'];
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.alpha = Math.random() * 0.5 + 0.1;
                this.angle = Math.random() * Math.PI * 2;
            }

            update(currentSpeed) {
                // Procedural drift
                this.angle += (Math.random() - 0.5) * 0.1;
                this.vx += Math.cos(this.angle) * 0.05 * currentSpeed;
                this.vy += Math.sin(this.angle) * 0.05 * currentSpeed;

                // Friction/Drag
                this.vx *= 0.98;
                this.vy *= 0.98;

                this.x += this.vx;
                this.y += this.vy;

                // Screen wrap
                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = 0;
            }

            draw(ctx) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.globalAlpha = this.alpha;
                ctx.fill();

                // Glow effect
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
            }
        }

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < complexity.value; i++) {
                particles.push(new Particle());
            }
            particleCount.value = particles.length;
            status.value = 'DRIFTING';
        };

        const updateSettings = () => {
            initParticles();
        };

        const drawConnections = () => {
             ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
             ctx.lineWidth = 0.5;
             ctx.globalAlpha = 1.0;
             ctx.shadowBlur = 0;

             for(let i=0; i < particles.length; i++){
                 for(let j=i+1; j < particles.length; j++){
                     const dx = particles[i].x - particles[j].x;
                     const dy = particles[i].y - particles[j].y;
                     const dist = Math.sqrt(dx*dx + dy*dy);
                     if(dist < 80) {
                         ctx.beginPath();
                         ctx.moveTo(particles[i].x, particles[i].y);
                         ctx.lineTo(particles[j].x, particles[j].y);
                         ctx.stroke();
                     }
                 }
             }
        };

        const animate = () => {
            if (!ctx) return;

            // Trail effect
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = '#050510';
            ctx.fillRect(0, 0, width, height);

            ctx.globalAlpha = 1.0;
            particles.forEach(p => {
                p.update(speed.value);
                p.draw(ctx);
            });

            drawConnections();

            animationFrameId = requestAnimationFrame(animate);
        };

        const handleResize = () => {
            if(nebulaCanvas.value) {
                width = window.innerWidth;
                height = window.innerHeight;
                nebulaCanvas.value.width = width;
                nebulaCanvas.value.height = height;
                initParticles();
            }
        };

        onMounted(() => {
            const canvas = nebulaCanvas.value;
            ctx = canvas.getContext('2d');

            handleResize();
            window.addEventListener('resize', handleResize);

            initParticles();
            animate();
        });

        onUnmounted(() => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        });

        return {
            nebulaCanvas,
            particleCount,
            status,
            speed,
            complexity,
            updateSettings
        };
    }
}).mount('#app');

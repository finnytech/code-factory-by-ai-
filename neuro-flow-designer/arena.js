/**
 * NeuroFlow Designer - 2D Swarm Arena Physics Simulation
 */

window.NeuroArena = {
    canvas: null,
    ctx: null,
    animationId: null,
    agents: [],
    tasks: [],
    particles: [], // For sparkle/burst effects
    isRunning: false,
    
    init() {
        this.canvas = document.getElementById("swarm-canvas");
        this.ctx = this.canvas.getContext("2d");
        
        this.resizeCanvas();
        window.addEventListener("resize", () => this.resizeCanvas());

        // Click to spawn a task
        this.canvas.addEventListener("click", (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const types = ["planner", "coder", "critic"];
            const randomType = types[Math.floor(Math.random() * types.length)];
            
            this.spawnTask(x, y, randomType);
            window.App.log("system", `User spawned a ${randomType.toUpperCase()} task in the arena.`);
        });
    },

    resizeCanvas() {
        if (!this.canvas) return;
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth || 800;
        this.canvas.height = parent.clientHeight || 500;
    },

    reset() {
        this.agents = [];
        this.tasks = [];
        this.particles = [];
        this.updateActiveCount();
        this.drawEmpty();
    },

    drawEmpty() {
        if (!this.ctx) return;
        this.ctx.fillStyle = "#05070a";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw cyber grids
        this.ctx.strokeStyle = "rgba(59, 130, 246, 0.05)";
        this.ctx.lineWidth = 1;
        const grid = 40;
        for (let x = 0; x < this.canvas.width; x += grid) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += grid) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    },

    start() {
        this.isRunning = true;
        this.reset();
        
        // Spawn agents based on the current editor nodes
        window.App.nodes.forEach(node => {
            if (node.type === "agent") {
                this.spawnAgent(node.subtype);
            }
        });

        // Spawn some initial tasks
        for (let i = 0; i < 4; i++) {
            this.spawnRandomTask();
        }

        this.updateActiveCount();
        
        // Start animation loop
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.loop();
    },

    pause() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    },

    updateActiveCount() {
        const counter = document.getElementById("arena-active-count");
        if (counter) {
            counter.innerText = this.agents.length;
        }
    },

    spawnAgent(type) {
        let color = "#3b82f6"; // Planner: blue
        if (type === "coder") color = "#8b5cf6"; // Coder: purple
        if (type === "critic") color = "#f59e0b"; // Critic: orange

        this.agents.push({
            id: Math.random().toString(),
            type: type,
            color: color,
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            radius: 8,
            status: "wandering", // 'wandering', 'targeting', 'processing'
            targetTask: null,
            workProgress: 0,
            angle: Math.random() * Math.PI * 2
        });
    },

    spawnTask(x, y, type) {
        let color = "#3b82f6";
        if (type === "coder") color = "#8b5cf6";
        if (type === "critic") color = "#f59e0b";

        this.tasks.push({
            id: Math.random().toString(),
            type: type,
            color: color,
            x: x,
            y: y,
            radius: 12,
            pulse: 0
        });
    },

    spawnRandomTask() {
        const types = ["planner", "coder", "critic"];
        const type = types[Math.floor(Math.random() * types.length)];
        const pad = 40;
        const x = pad + Math.random() * (this.canvas.width - pad * 2);
        const y = pad + Math.random() * (this.canvas.height - pad * 2);
        this.spawnTask(x, y, type);
    },

    spawnParticles(x, y, color) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                radius: Math.random() * 3 + 1,
                color: color,
                alpha: 1.0,
                decay: Math.random() * 0.03 + 0.01
            });
        }
    },

    loop() {
        if (!this.isRunning) return;
        
        this.updatePhysics();
        this.draw();
        
        this.animationId = requestAnimationFrame(() => this.loop());
    },

    updatePhysics() {
        // Periodically spawn new tasks
        if (this.tasks.length < 5 && Math.random() < 0.005) {
            this.spawnRandomTask();
        }

        // Update Agents
        this.agents.forEach(agent => {
            if (agent.status === "wandering") {
                // Wandering physics - slightly adjust velocities
                agent.angle += (Math.random() - 0.5) * 0.2;
                agent.vx += Math.cos(agent.angle) * 0.08;
                agent.vy += Math.sin(agent.angle) * 0.08;
                
                // Friction
                agent.vx *= 0.98;
                agent.vy *= 0.98;

                // Speed limit
                const speed = Math.sqrt(agent.vx * agent.vx + agent.vy * agent.vy);
                if (speed > 2) {
                    agent.vx = (agent.vx / speed) * 2;
                    agent.vy = (agent.vy / speed) * 2;
                }

                // Boundary collision
                if (agent.x < 0 || agent.x > this.canvas.width) agent.vx *= -1;
                if (agent.y < 0 || agent.y > this.canvas.height) agent.vy *= -1;

                agent.x += agent.vx;
                agent.y += agent.vy;

                // Seek target tasks
                const matchingTask = this.tasks.find(t => t.type === agent.type);
                if (matchingTask) {
                    agent.status = "targeting";
                    agent.targetTask = matchingTask;
                }
            } 
            else if (agent.status === "targeting") {
                const task = agent.targetTask;
                // Check if task was already taken
                if (!this.tasks.includes(task)) {
                    agent.status = "wandering";
                    agent.targetTask = null;
                    return;
                }

                // Steer towards target
                const dx = task.x - agent.x;
                const dy = task.y - agent.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 10) {
                    // Collision with task -> Start working
                    agent.status = "processing";
                    agent.workProgress = 0;
                } else {
                    agent.vx += (dx / dist) * 0.15;
                    agent.vy += (dy / dist) * 0.15;
                    
                    // Friction
                    agent.vx *= 0.95;
                    agent.vy *= 0.95;

                    agent.x += agent.vx;
                    agent.y += agent.vy;
                }
            } 
            else if (agent.status === "processing") {
                // Orbit or stand still while processing task
                agent.workProgress += 0.015 * window.App.speed;
                
                if (agent.workProgress >= 1.0) {
                    // Completed task
                    const task = agent.targetTask;
                    if (task) {
                        this.tasks = this.tasks.filter(t => t.id !== task.id);
                        this.spawnParticles(task.x, task.y, task.color);
                    }
                    
                    agent.status = "wandering";
                    agent.targetTask = null;
                }
            }
        });

        // Update Particles
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;
        });

        this.particles = this.particles.filter(p => p.alpha > 0);
    },

    draw() {
        this.drawEmpty();

        // Draw Tasks
        this.tasks.forEach(task => {
            task.pulse += 0.08;
            const size = task.radius + Math.sin(task.pulse) * 2;

            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = task.color;

            this.ctx.fillStyle = task.color;
            this.ctx.beginPath();
            
            // Draw a diamond shape
            this.ctx.moveTo(task.x, task.y - size);
            this.ctx.lineTo(task.x + size, task.y);
            this.ctx.lineTo(task.x, task.y + size);
            this.ctx.lineTo(task.x - size, task.y);
            this.ctx.closePath();
            this.ctx.fill();
        });

        // Draw Agents
        this.agents.forEach(agent => {
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = agent.color;

            // Draw agent dot
            this.ctx.fillStyle = agent.color;
            this.ctx.beginPath();
            this.ctx.arc(agent.x, agent.y, agent.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw outer orbit ring for processing agents
            if (agent.status === "processing") {
                this.ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(agent.x, agent.y, agent.radius + 6, 0, Math.PI * 2);
                this.ctx.stroke();

                // Glowing progress arc
                this.ctx.strokeStyle = agent.color;
                this.ctx.lineWidth = 2.5;
                this.ctx.beginPath();
                this.ctx.arc(agent.x, agent.y, agent.radius + 6, -Math.PI / 2, (-Math.PI / 2) + (Math.PI * 2 * agent.workProgress));
                this.ctx.stroke();
            }
        });

        // Draw Particles
        this.particles.forEach(p => {
            this.ctx.shadowBlur = 5;
            this.ctx.shadowColor = p.color;
            this.ctx.fillStyle = `rgba(${this.hexToRgb(p.color)}, ${p.alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Reset shadow
        this.ctx.shadowBlur = 0;
    },

    hexToRgb(hex) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });

        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
            : "255, 255, 255";
    }
};

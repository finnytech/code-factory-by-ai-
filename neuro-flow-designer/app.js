/**
 * NeuroFlow Designer - Main Application Controller
 */

// Global State object
window.App = {
    nodes: [],
    connections: [],
    selectedNodeId: null,
    isRunning: false,
    speed: 1.0,
    metrics: {
        tps: 0,
        cost: 0.000,
        latency: 0,
        queue: 0
    },
    
    // Core references
    editor: null,
    simulation: null,
    arena: null,

    // Initialize application
    init() {
        console.log("NeuroFlow App Initializing...");
        
        // Initialize submodules
        this.editor = window.NeuroEditor;
        this.simulation = window.NeuroSimulation;
        this.arena = window.NeuroArena;

        this.editor.init();
        this.simulation.init();
        this.arena.init();

        // Bind DOM elements & UI events
        this.bindEvents();
        
        // Load default orchestrator template
        this.loadTemplate("orchestrator");
    },

    bindEvents() {
        // Tab switching
        const tabBtns = document.querySelectorAll(".tab-btn");
        tabBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                tabBtns.forEach(b => b.classList.remove("active"));
                document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
                
                btn.classList.add("active");
                const targetId = btn.getAttribute("data-target");
                document.getElementById(targetId).classList.add("active");
                
                // Redraw links if returning to flow editor
                if (targetId === "flow-editor-panel") {
                    this.editor.drawAllConnections();
                }
            });
        });

        // Global simulation controls
        document.getElementById("btn-run").addEventListener("click", () => this.startFlow());
        document.getElementById("btn-pause").addEventListener("click", () => this.pauseFlow());
        document.getElementById("btn-reset").addEventListener("click", () => this.resetFlow());

        // Template selector
        document.getElementById("template-select").addEventListener("change", (e) => {
            this.loadTemplate(e.target.value);
        });

        // Speed selector
        document.getElementById("speed-select").addEventListener("change", (e) => {
            this.speed = parseFloat(e.target.value);
            this.log("system", `Simulation speed adjusted to ${this.speed}x`);
        });

        // Clear console logs
        document.getElementById("btn-clear-logs").addEventListener("click", () => {
            const logs = document.getElementById("console-logs");
            logs.innerHTML = '<div class="console-line system-line">[SYSTEM] Console logs cleared.</div>';
        });

        // Window resize link redrawing
        window.addEventListener("resize", () => {
            if (this.editor) {
                this.editor.drawAllConnections();
            }
        });
    },

    // Global Console Log system
    log(type, msg) {
        const consoleLogs = document.getElementById("console-logs");
        if (!consoleLogs) return;

        const line = document.createElement("div");
        line.className = `console-line ${type}-line`;
        
        const timestamp = new Date().toLocaleTimeString();
        line.innerText = `[${timestamp}] [${type.toUpperCase()}] ${msg}`;
        
        consoleLogs.appendChild(line);
        consoleLogs.scrollTop = consoleLogs.scrollHeight;
    },

    // UI state updates
    updateMetrics(newMetrics = {}) {
        Object.assign(this.metrics, newMetrics);
        
        document.getElementById("metric-tps").innerText = this.metrics.tps.toFixed(0);
        document.getElementById("metric-cost").innerText = `$${this.metrics.cost.toFixed(3)}`;
        document.getElementById("metric-latency").innerText = `${this.metrics.latency}ms`;
        document.getElementById("metric-queue").innerText = this.metrics.queue;
        
        // Randomize chart bars slightly to show live visual metric telemetry
        for (let i = 0; i < 5; i++) {
            const bar = document.getElementById(`chart-bar-${i}`);
            if (bar) {
                const baseVal = [20, 45, 75, 30, 90][i];
                const variance = Math.floor(Math.random() * 16) - 8;
                bar.style.height = `${Math.min(Math.max(baseVal + variance, 5), 100)}%`;
            }
        }
    },

    // Load templates
    loadTemplate(templateName) {
        this.resetFlow();
        this.log("system", `Loading template: ${templateName}`);
        
        const centerWidth = document.getElementById("flow-editor-panel").clientWidth || 800;
        const centerHeight = document.getElementById("flow-editor-panel").clientHeight || 500;
        const cX = centerWidth / 2;
        const cY = centerHeight / 2;

        if (templateName === "orchestrator") {
            // Orchestrator template
            this.editor.addNode("agent", "planner", "Orchestrator", cX - 250, cY - 100);
            this.editor.addNode("agent", "coder", "Worker Agent A", cX + 50, cY - 180);
            this.editor.addNode("agent", "critic", "Worker Agent B", cX + 50, cY - 20);
            this.editor.addNode("tool", "git_push", "Git Publisher", cX + 350, cY - 100);
            
            // Connect them
            setTimeout(() => {
                this.editor.addConnection(this.nodes[0].id, this.nodes[1].id); // Orchestrator -> Worker A
                this.editor.addConnection(this.nodes[0].id, this.nodes[2].id); // Orchestrator -> Worker B
                this.editor.addConnection(this.nodes[1].id, this.nodes[3].id); // Worker A -> Git
                this.editor.addConnection(this.nodes[2].id, this.nodes[3].id); // Worker B -> Git
            }, 100);
            
        } else if (templateName === "sequential") {
            // Sequential code loop
            this.editor.addNode("agent", "planner", "Planner Agent", cX - 350, cY - 100);
            this.editor.addNode("agent", "coder", "Developer Agent", cX - 50, cY - 100);
            this.editor.addNode("agent", "critic", "Code Reviewer", cX + 250, cY - 100);
            
            setTimeout(() => {
                this.editor.addConnection(this.nodes[0].id, this.nodes[1].id); // Plan -> Code
                this.editor.addConnection(this.nodes[1].id, this.nodes[2].id); // Code -> Review
                this.editor.addConnection(this.nodes[2].id, this.nodes[1].id); // Review -> Code (Feedback loop)
            }, 100);

        } else if (templateName === "router") {
            // Dynamic router template
            this.editor.addNode("agent", "router", "Query Router", cX - 250, cY - 100);
            this.editor.addNode("tool", "web_search", "Search Tool", cX + 50, cY - 200);
            this.editor.addNode("tool", "code_executor", "Compiler Tool", cX + 50, cY);
            
            setTimeout(() => {
                this.editor.addConnection(this.nodes[0].id, this.nodes[1].id);
                this.editor.addConnection(this.nodes[0].id, this.nodes[2].id);
            }, 100);
        } else {
            // Minimal
            this.log("system", "Blank canvas ready. Drag and drop nodes to design a custom swarm.");
        }
    },

    // Flow controls
    startFlow() {
        if (this.nodes.length === 0) {
            this.log("error", "Cannot start. Drag nodes onto canvas first.");
            return;
        }

        this.isRunning = true;
        document.getElementById("btn-run").disabled = true;
        document.getElementById("btn-pause").disabled = false;
        document.getElementById("template-select").disabled = true;
        
        // System status UI
        const statusText = document.getElementById("system-status-text");
        statusText.innerText = "Simulation Executing";
        const dot = document.querySelector(".status-dot");
        dot.className = "status-dot yellow-glow";

        this.log("info", "Starting agent workflow execution...");
        
        // Run simulations
        this.simulation.start();
        this.arena.start();
    },

    pauseFlow() {
        this.isRunning = false;
        document.getElementById("btn-run").disabled = false;
        document.getElementById("btn-pause").disabled = true;
        
        const statusText = document.getElementById("system-status-text");
        statusText.innerText = "Simulation Paused";
        
        this.log("info", "Workflow simulation paused.");
        this.simulation.pause();
        this.arena.pause();
    },

    resetFlow() {
        this.isRunning = false;
        this.selectedNodeId = null;
        
        document.getElementById("btn-run").disabled = false;
        document.getElementById("btn-pause").disabled = true;
        document.getElementById("template-select").disabled = false;
        
        const statusText = document.getElementById("system-status-text");
        statusText.innerText = "Ready";
        const dot = document.querySelector(".status-dot");
        dot.className = "status-dot green-glow";

        // Reset metrics
        this.updateMetrics({ tps: 0, cost: 0.000, latency: 0, queue: 0 });
        
        // Reset submodules
        if (this.editor) this.editor.reset();
        if (this.simulation) this.simulation.reset();
        if (this.arena) this.arena.reset();
        
        this.log("system", "Workflow execution state reset.");
    }
};

// Start application when window loads
window.addEventListener("DOMContentLoaded", () => {
    window.App.init();
});

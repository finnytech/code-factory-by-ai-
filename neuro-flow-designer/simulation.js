/**
 * NeuroFlow Designer - Async Workflow Execution Simulation Engine
 */

window.NeuroSimulation = {
    timerId: null,
    queue: [],
    visitedNodes: new Set(),
    activeTimeouts: [],

    init() {
        this.reset();
    },

    reset() {
        this.stopAllTimeouts();
        this.queue = [];
        this.visitedNodes.clear();
        
        // Reset node visual status
        window.App.nodes.forEach(node => {
            const el = document.getElementById(node.id);
            if (el) {
                el.className = `canvas-node status-idle`;
                
                let preview = "Ready...";
                if (node.type === "agent" && node.config.prompt) {
                    preview = node.config.prompt.substring(0, 25) + (node.config.prompt.length > 25 ? "..." : "");
                } else if (node.type === "tool" && node.config.parameter) {
                    preview = node.config.parameter.substring(0, 25) + (node.config.parameter.length > 25 ? "..." : "");
                }
                el.querySelector(".node-instruction-preview").innerText = preview;
            }
            node.status = "idle";
        });
    },

    stopAllTimeouts() {
        this.activeTimeouts.forEach(t => clearTimeout(t));
        this.activeTimeouts = [];
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    },

    start() {
        this.reset();
        
        // Find entry nodes (nodes without incoming connections, or planners)
        const targets = new Set(window.App.connections.map(c => c.target));
        let entryNodes = window.App.nodes.filter(n => !targets.has(n.id));

        // Fallback to all Planner nodes if loop exists
        if (entryNodes.length === 0) {
            entryNodes = window.App.nodes.filter(n => n.subtype === "planner");
        }

        // Fallback to first node
        if (entryNodes.length === 0 && window.App.nodes.length > 0) {
            entryNodes = [window.App.nodes[0]];
        }

        entryNodes.forEach(node => {
            this.queue.push(node.id);
        });

        window.App.updateMetrics({ queue: this.queue.length });
        
        // Start processing queue loop
        this.processNextInQueue();
    },

    pause() {
        this.stopAllTimeouts();
    },

    processNextInQueue() {
        if (!window.App.isRunning) return;

        if (this.queue.length === 0) {
            // Check if any node is currently active
            const activeNode = window.App.nodes.some(n => n.status === "active");
            if (!activeNode) {
                window.App.log("success", "Workflow execution simulation completed successfully!");
                window.App.pauseFlow();
            }
            return;
        }

        const nodeId = this.queue.shift();
        window.App.updateMetrics({ queue: this.queue.length });

        this.executeNode(nodeId);
    },

    executeNode(nodeId) {
        const node = window.App.nodes.find(n => n.id === nodeId);
        if (!node) return;

        // Visual update
        window.NeuroEditor.setNodeStatus(nodeId, "active");
        
        // Generate simulated log details
        let logMsg = "";
        let mockLatency = Math.floor(Math.random() * 800) + 400; // ms
        let inputTokens = Math.floor(Math.random() * 4000) + 1500;
        let outputTokens = Math.floor(Math.random() * 800) + 200;

        if (node.type === "agent") {
            if (node.subtype === "planner") {
                logMsg = `[${node.name}] Structuring tasks and outlining workflow specifications...`;
            } else if (node.subtype === "coder") {
                logMsg = `[${node.name}] Engineering clean source code and integrating custom script assets...`;
            } else if (node.subtype === "critic") {
                logMsg = `[${node.name}] Conducting security scans and reviewing code quality diagnostics...`;
            } else {
                logMsg = `[${node.name}] Routing tokens and allocating swarm resources...`;
            }
        } else {
            // Integration tools
            if (node.subtype === "web_search") {
                logMsg = `[${node.name}] Indexing search results for prompt parameters...`;
            } else if (node.subtype === "code_executor") {
                logMsg = `[${node.name}] Compiling scripts in sandboxed terminal... Exit code: 0.`;
            } else if (node.subtype === "git_push") {
                logMsg = `[${node.name}] Authenticating git session... Pushing repository contents...`;
            }
        }

        window.App.log("info", logMsg);

        // Adjust latency based on speed configuration
        const duration = mockLatency / window.App.speed;

        const timeoutId = setTimeout(() => {
            // Complete current node
            window.NeuroEditor.setNodeStatus(nodeId, "success");
            
            // Calculate mock API metrics
            const currentCost = (inputTokens * 0.00000125) + (outputTokens * 0.000005);
            window.App.updateMetrics({
                tps: (inputTokens + outputTokens) / (mockLatency / 1000),
                cost: window.App.metrics.cost + currentCost,
                latency: Math.floor(mockLatency),
            });

            window.App.log("success", `[${node.name}] Task finished successfully.`);

            // Trigger downstream connections
            const downstream = window.App.connections
                .filter(c => c.source === nodeId)
                .map(c => c.target);

            downstream.forEach(targetId => {
                // Prevent duplicate queue processing of active nodes
                if (!this.queue.includes(targetId)) {
                    this.queue.push(targetId);
                }
            });

            window.App.updateMetrics({ queue: this.queue.length });

            // Process next task
            this.processNextInQueue();
        }, duration);

        this.activeTimeouts.push(timeoutId);
    }
};

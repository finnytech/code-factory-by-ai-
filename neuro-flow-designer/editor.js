/**
 * NeuroFlow Designer - Visual Node Editor Logic
 */

window.NeuroEditor = {
    canvas: null,
    svgLayer: null,
    draggedElement: null,
    dragOffset: { x: 0, y: 0 },
    connectingSourceNodeId: null, // Track click-to-connect source
    
    init() {
        this.canvas = document.getElementById("nodes-canvas");
        this.svgLayer = document.getElementById("svg-connections-layer");

        this.setupDragAndDropPalette();
        this.setupInspectorEvents();
        this.setupCanvasClicks();
    },

    reset() {
        this.canvas.innerHTML = "";
        window.App.nodes = [];
        window.App.connections = [];
        this.connectingSourceNodeId = null;
        this.drawAllConnections();
        this.deselectAll();
    },

    // Setup drag-and-drop from sidebar palette to canvas
    setupDragAndDropPalette() {
        const paletteNodes = document.querySelectorAll(".palette-node");
        paletteNodes.forEach(node => {
            node.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("type", node.getAttribute("data-type"));
                e.dataTransfer.setData("role", node.getAttribute("data-role") || "");
                e.dataTransfer.setData("tool", node.getAttribute("data-tool") || "");
                e.dataTransfer.setData("name", node.querySelector(".name").innerText);
            });
        });

        const editorPanel = document.getElementById("flow-editor-container");
        editorPanel.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        editorPanel.addEventListener("drop", (e) => {
            e.preventDefault();
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left - 120; // center offset
            const y = e.clientY - rect.top - 50;

            const type = e.dataTransfer.getData("type");
            const role = e.dataTransfer.getData("role");
            const tool = e.dataTransfer.getData("tool");
            const name = e.dataTransfer.getData("name");

            if (type) {
                this.addNode(type, role || tool, name, x, y);
            }
        });
    },

    setupCanvasClicks() {
        // Deselect when clicking on canvas background
        this.canvas.addEventListener("click", (e) => {
            if (e.target === this.canvas) {
                this.deselectAll();
            }
        });
    },

    // Create & Add a Node to state and DOM
    addNode(type, subtype, name, x, y) {
        const id = "node_" + Math.random().toString(36).substr(2, 9);
        
        const nodeObj = {
            id: id,
            type: type, // 'agent' or 'tool'
            subtype: subtype, // role or tool identifier
            name: name,
            x: Math.max(0, x),
            y: Math.max(0, y),
            status: "idle", // 'idle', 'active', 'success', 'error'
            config: {
                model: "gemini-3.5-pro",
                prompt: type === "agent" ? `You are a helpful ${subtype} agent.` : "",
                temperature: 0.7,
                parameter: ""
            }
        };

        window.App.nodes.push(nodeObj);
        this.renderNodeDOM(nodeObj);
        window.App.log("system", `Created node: "${name}"`);
        
        return nodeObj;
    },

    // Render node element
    renderNodeDOM(node) {
        const div = document.createElement("div");
        div.id = node.id;
        div.className = `canvas-node status-idle`;
        div.style.left = `${node.x}px`;
        div.style.top = `${node.y}px`;

        const headerColorClass = node.type === "agent" ? "border-secondary" : "border-success";
        
        // Node contents
        div.innerHTML = `
            <div class="node-header">
                <div class="title-group">
                    <span class="icon">${node.type === "agent" ? "🎯" : "🛠️"}</span>
                    <h4 class="node-name">${node.name}</h4>
                </div>
                <button class="btn-delete-node" title="Delete node">&times;</button>
            </div>
            <div class="node-body">
                <span class="node-role-tag">${node.subtype}</span>
                <div class="node-instruction-preview">Ready...</div>
            </div>
            <div class="node-ports">
                <div class="port port-input">
                    <span class="port-dot input-dot" title="Click to connect input"></span>
                    <span>Input</span>
                </div>
                <div class="port port-output">
                    <span class="port-dot output-dot" title="Click to start connection"></span>
                    <span>Output</span>
                </div>
            </div>
        `;

        // Make draggable
        this.setupNodeDrag(div, node);

        // Delete button listener
        div.querySelector(".btn-delete-node").addEventListener("click", (e) => {
            e.stopPropagation();
            this.deleteNode(node.id);
        });

        // Click to select / inspect
        div.addEventListener("click", (e) => {
            e.stopPropagation();
            this.selectNode(node.id);
        });

        // Setup click-to-connect sockets
        div.querySelector(".output-dot").addEventListener("click", (e) => {
            e.stopPropagation();
            this.startConnection(node.id);
        });

        div.querySelector(".input-dot").addEventListener("click", (e) => {
            e.stopPropagation();
            this.completeConnection(node.id);
        });

        this.canvas.appendChild(div);
    },

    // Handle node dragging on the grid
    setupNodeDrag(element, nodeObj) {
        const header = element.querySelector(".node-header");
        
        const onMouseDown = (e) => {
            if (e.target.closest(".btn-delete-node") || e.target.closest(".port-dot")) return;
            
            this.draggedElement = element;
            this.selectNode(nodeObj.id);

            const rect = element.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;
            
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        };

        const onMouseMove = (e) => {
            if (!this.draggedElement) return;

            const containerRect = document.getElementById("flow-editor-container").getBoundingClientRect();
            const scrollLeft = document.getElementById("flow-editor-container").scrollLeft;
            const scrollTop = document.getElementById("flow-editor-container").scrollTop;
            
            let x = e.clientX - containerRect.left - this.dragOffset.x + scrollLeft;
            let y = e.clientY - containerRect.top - this.dragOffset.y + scrollTop;
            
            // Grid snapping (10px grid)
            x = Math.round(x / 10) * 10;
            y = Math.round(y / 10) * 10;
            
            // Clamp to positive boundaries
            x = Math.max(0, x);
            y = Math.max(0, y);

            this.draggedElement.style.left = `${x}px`;
            this.draggedElement.style.top = `${y}px`;

            // Update state
            nodeObj.x = x;
            nodeObj.y = y;

            // Redraw SVG connections
            this.drawAllConnections();
        };

        const onMouseUp = () => {
            this.draggedElement = null;
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        header.addEventListener("mousedown", onMouseDown);
    },

    // Connection Building logic (Click output on A, then click input on B)
    startConnection(nodeId) {
        this.connectingSourceNodeId = nodeId;
        window.App.log("system", `Connecting output from node. Click on another node's input socket.`);
        
        // Highlight possible inputs
        const allNodes = document.querySelectorAll(".canvas-node");
        allNodes.forEach(node => {
            if (node.id !== nodeId) {
                node.querySelector(".input-dot").style.transform = "scale(1.4)";
                node.querySelector(".input-dot").style.borderColor = "var(--color-success)";
            }
        });
    },

    completeConnection(targetNodeId) {
        if (!this.connectingSourceNodeId) return;

        const sourceId = this.connectingSourceNodeId;
        this.connectingSourceNodeId = null;

        // Reset highlights
        const allDots = document.querySelectorAll(".port-dot");
        allDots.forEach(dot => {
            dot.style.transform = "";
            dot.style.borderColor = "";
        });

        if (sourceId === targetNodeId) {
            window.App.log("error", "Cannot connect a node to itself.");
            return;
        }

        this.addConnection(sourceId, targetNodeId);
    },

    addConnection(sourceId, targetId) {
        // Avoid duplicate links
        const exists = window.App.connections.some(c => c.source === sourceId && c.target === targetId);
        if (exists) {
            window.App.log("warn", "Connection already exists.");
            return;
        }

        window.App.connections.push({ source: sourceId, target: targetId });
        this.drawAllConnections();
        window.App.log("system", `Linked workflow nodes.`);
    },

    // Render connection curves on SVG Layer
    drawAllConnections() {
        // Clear old connections
        const paths = this.svgLayer.querySelectorAll(".connection-path");
        paths.forEach(p => p.remove());

        window.App.connections.forEach(conn => {
            const sourceEl = document.getElementById(conn.source);
            const targetEl = document.getElementById(conn.target);

            if (!sourceEl || !targetEl) return;

            // Get source port location (Right center of node)
            const sX = parseInt(sourceEl.style.left) + 240; // width
            const sY = parseInt(sourceEl.style.top) + 115; // approximate output dot height

            // Get target port location (Left center of node)
            const tX = parseInt(targetEl.style.left);
            const tY = parseInt(targetEl.style.top) + 115; // approximate input dot height

            // Draw cubic Bezier curve path
            const dx = Math.abs(tX - sX) * 0.5;
            const pathData = `M ${sX} ${sY} C ${sX + dx} ${sY}, ${tX - dx} ${tY}, ${tX} ${tY}`;

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", pathData);
            path.setAttribute("class", `connection-path ${window.App.isRunning ? 'active' : ''}`);
            path.setAttribute("marker-end", "url(#arrow)");
            
            // Delete link on double click
            path.addEventListener("dblclick", () => {
                window.App.connections = window.App.connections.filter(c => c !== conn);
                this.drawAllConnections();
                window.App.log("system", "Removed connection link.");
            });

            this.svgLayer.appendChild(path);
        });
    },

    // Inspector Properties configuration panel
    selectNode(nodeId) {
        this.deselectAll();
        
        const node = window.App.nodes.find(n => n.id === nodeId);
        if (!node) return;

        window.App.selectedNodeId = nodeId;
        
        const element = document.getElementById(nodeId);
        if (element) {
            element.classList.add("selected");
        }

        // Show form inspector details
        const inspector = document.getElementById("property-inspector");
        inspector.className = "inspector-active";
        
        document.querySelector(".empty-state").style.display = "none";
        
        const form = document.getElementById("property-form");
        form.style.display = "block";

        document.getElementById("prop-node-id").value = node.id;
        document.getElementById("prop-name").value = node.name;

        const agentFields = document.querySelector(".agent-only-fields");
        const toolFields = document.querySelector(".tool-only-fields");

        if (node.type === "agent") {
            agentFields.style.display = "block";
            toolFields.style.display = "none";
            document.getElementById("prop-model").value = node.config.model;
            document.getElementById("prop-prompt").value = node.config.prompt;
            document.getElementById("prop-temp").value = node.config.temperature;
            document.getElementById("temp-val").innerText = node.config.temperature;
        } else {
            agentFields.style.display = "none";
            toolFields.style.display = "block";
            document.getElementById("prop-tool-param").value = node.config.parameter;
        }
    },

    deselectAll() {
        window.App.selectedNodeId = null;
        const nodes = document.querySelectorAll(".canvas-node");
        nodes.forEach(n => n.classList.remove("selected"));

        document.querySelector(".empty-state").style.display = "block";
        document.getElementById("property-form").style.display = "none";
        document.getElementById("property-inspector").className = "inspector-empty";
    },

    setupInspectorEvents() {
        // Temperature slider output updating
        document.getElementById("prop-temp").addEventListener("input", (e) => {
            document.getElementById("temp-val").innerText = e.target.value;
        });

        // Save inspector details
        document.getElementById("btn-save-properties").addEventListener("click", () => {
            const id = document.getElementById("prop-node-id").value;
            const node = window.App.nodes.find(n => n.id === id);

            if (!node) return;

            node.name = document.getElementById("prop-name").value;
            
            // Update node visual header name
            const nodeEl = document.getElementById(id);
            if (nodeEl) {
                nodeEl.querySelector(".node-name").innerText = node.name;
            }

            if (node.type === "agent") {
                node.config.model = document.getElementById("prop-model").value;
                node.config.prompt = document.getElementById("prop-prompt").value;
                node.config.temperature = parseFloat(document.getElementById("prop-temp").value);
                
                // Show brief instructions snippet in node body
                if (nodeEl && node.config.prompt) {
                    nodeEl.querySelector(".node-instruction-preview").innerText = 
                        node.config.prompt.substring(0, 25) + (node.config.prompt.length > 25 ? "..." : "");
                }
            } else {
                node.config.parameter = document.getElementById("prop-tool-param").value;
                if (nodeEl && node.config.parameter) {
                    nodeEl.querySelector(".node-instruction-preview").innerText = 
                        node.config.parameter.substring(0, 25) + (node.config.parameter.length > 25 ? "..." : "");
                }
            }

            window.App.log("success", `Updated properties for node "${node.name}"`);
            this.deselectAll();
        });
    },

    // Delete node from memory and GUI
    deleteNode(nodeId) {
        // Filter out of nodes list
        const node = window.App.nodes.find(n => n.id === nodeId);
        const name = node ? node.name : nodeId;
        
        window.App.nodes = window.App.nodes.filter(n => n.id !== nodeId);
        
        // Remove related connections
        window.App.connections = window.App.connections.filter(c => c.source !== nodeId && c.target !== nodeId);
        
        // Remove node from DOM
        const el = document.getElementById(nodeId);
        if (el) el.remove();

        // Redraw SVG layer
        this.drawAllConnections();

        if (window.App.selectedNodeId === nodeId) {
            this.deselectAll();
        }

        window.App.log("system", `Removed node: "${name}"`);
    },

    // Helper: update node status class
    setNodeStatus(nodeId, status) {
        const el = document.getElementById(nodeId);
        if (!el) return;

        el.className = `canvas-node selected status-${status}`;
        
        const node = window.App.nodes.find(n => n.id === nodeId);
        if (node) {
            node.status = status;
            
            // Render text feedback
            let statusText = "Ready...";
            if (status === "active") statusText = "Thinking...";
            if (status === "success") statusText = "Done.";
            if (status === "error") statusText = "Failed!";
            
            el.querySelector(".node-instruction-preview").innerText = statusText;
        }
    }
};

class TaskManager {
    constructor() {
        const stored = this.readStoredTasks();
        this.tasks = stored;
        this.onTaskComplete = null;
        this.onListUpdate = null;
    }

    readStoredTasks() {
        if (typeof localStorage === 'undefined') return [];
        try {
            const value = JSON.parse(localStorage.getItem('chronosphere_tasks') || '[]');
            return Array.isArray(value) ? value.filter(task => task && task.id && typeof task.text === 'string') : [];
        } catch (error) {
            return [];
        }
    }

    save() {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('chronosphere_tasks', JSON.stringify(this.tasks));
        }
        if (this.onListUpdate) this.onListUpdate(this.getStats());
    }

    addTask(text) {
        const cleanText = typeof text === 'string' ? text.trim() : '';
        if (!cleanText) return null;
        const task = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text: cleanText,
            completed: false,
            reward: Math.floor(Math.random() * 5) + 5,
            createdAt: new Date().toISOString()
        };
        this.tasks.push(task);
        this.save();
        return task;
    }

    completeTask(id) {
        const task = this.tasks.find(item => item.id === id);
        if (!task || task.completed) return null;

        task.completed = true;
        task.completedAt = new Date().toISOString();
        this.save();
        if (this.onTaskComplete) this.onTaskComplete(task.reward, task);
        return task;
    }

    deleteTask(id) {
        const originalLength = this.tasks.length;
        this.tasks = this.tasks.filter(task => task.id !== id);
        if (this.tasks.length !== originalLength) this.save();
    }

    clearCompleted() {
        const remaining = this.tasks.filter(task => !task.completed);
        if (remaining.length !== this.tasks.length) {
            this.tasks = remaining;
            this.save();
        }
    }

    getStats() {
        const completed = this.tasks.filter(task => task.completed);
        return {
            total: this.tasks.length,
            completed: completed.length,
            pending: this.tasks.length - completed.length,
            earned: completed.reduce((sum, task) => sum + (Number(task.reward) || 0), 0)
        };
    }

    getTasks() {
        return this.tasks.slice();
    }
}

if (typeof module !== 'undefined' && module.exports) module.exports = TaskManager;

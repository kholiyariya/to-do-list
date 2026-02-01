class TodoApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.taskIdCounter = 1;
        this.init();
    }

    init() {
        this.loadTasks();
        this.bindEvents();
        this.render();
        this.updateStats();
    }

    loadTasks() {
        const savedTasks = localStorage.getItem('myDailyTasks');
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
            this.taskIdCounter = Math.max(...this.tasks.map(t => t.id), 0) + 1;
        }
    }

    saveTasks() {
        localStorage.setItem('myDailyTasks', JSON.stringify(this.tasks));
    }

    bindEvents() {
        const form = document.getElementById('taskForm');
        form.addEventListener('submit', e => {
            e.preventDefault();
            this.addTask();
        });

        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', e => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        const clearBtn = document.getElementById('clearCompleted');
        clearBtn.addEventListener('click', () => this.clearCompleted());
    }

    addTask() {
        const input = document.getElementById('taskInput');
        const text = input.value.trim();
        if (!text) return;

        const task = {
            id: this.taskIdCounter++,
            text,
            completed: false
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.render();
        this.updateStats();
        input.value = '';
        input.focus();
        this.showNotification('Task added!', 'success');
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        task.completed = !task.completed;
        this.saveTasks();
        this.render();
        this.updateStats();
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.render();
        this.updateStats();
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        const taskEl = document.querySelector(`[data-task-id="${id}"]`);
        const textEl = taskEl.querySelector('.task-text');
        const input = document.createElement('input');
        input.type = 'text';
        input.value = task.text;
        input.className = 'task-edit-input';
        textEl.replaceWith(input);
        input.focus();
        input.select();

        const save = () => {
            const newText = input.value.trim();
            if (newText) task.text = newText;
            this.saveTasks();
            this.render();
        };

        input.addEventListener('blur', save);
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') this.render();
        });
    }

    clearCompleted() {
        this.tasks = this.tasks.filter(t => !t.completed);
        this.saveTasks();
        this.render();
        this.updateStats();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        document.querySelector(`[data-filter="${filter}"]`).setAttribute('aria-pressed', 'true');
        this.render();
    }

    getFilteredTasks() {
        switch(this.currentFilter) {
            case 'active': return this.tasks.filter(t => !t.completed);
            case 'completed': return this.tasks.filter(t => t.completed);
            default: return this.tasks;
        }
    }

    render() {
        const taskList = document.getElementById('taskList');
        const emptyState = document.getElementById('emptyState');
        const filtered = this.getFilteredTasks();

        taskList.innerHTML = '';
        if (!filtered.length) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            filtered.forEach(task => {
                const taskEl = document.createElement('div');
                taskEl.className = `task-item ${task.completed ? 'completed' : ''}`;
                taskEl.dataset.taskId = task.id;

                taskEl.innerHTML = `
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" role="checkbox" tabindex="0"></div>
                    <div class="task-text">${task.text}</div>
                    <div class="task-actions">
                        <button class="task-btn edit-btn" aria-label="Edit task">✏️</button>
                        <button class="task-btn delete-btn" aria-label="Delete task">🗑️</button>
                    </div>
                `;

                
                const checkbox = taskEl.querySelector('.task-checkbox');
                checkbox.addEventListener('click', () => this.toggleTask(task.id));
                checkbox.addEventListener('keydown', e => {
                    if (e.key === 'Enter' || e.key === ' ') checkbox.click();
                });

                taskEl.querySelector('.edit-btn').addEventListener('click', () => this.editTask(task.id));
                taskEl.querySelector('.delete-btn').addEventListener('click', () => this.deleteTask(task.id));

                taskEl.querySelector('.task-text').addEventListener('dblclick', () => this.editTask(task.id));

                taskList.appendChild(taskEl);
            });
        }

        
        const clearBtn = document.getElementById('clearCompleted');
        clearBtn.disabled = !this.tasks.some(t => t.completed);

        this.updateStats();
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
    }

    showNotification(msg, type = 'info') {
        const colors = {
            success: 'var(--success-color)',
            info: 'var(--primary-color)',
            warning: 'var(--warning-color)',
            error: 'var(--danger-color)'
        };

        const notif = document.createElement('div');
        notif.textContent = msg;
        notif.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-xl);
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
        `;
        document.body.appendChild(notif);

        setTimeout(() => {
            notif.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notif.remove(), 300);
        }, 2500);
    }
}


const style = document.createElement('style');
style.textContent = `
@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    window.app = new TodoApp();
});

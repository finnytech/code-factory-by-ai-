document.addEventListener("DOMContentLoaded", () => {
  const tasks = new TaskManager();
  const engine = new CitadelEngine("citadel-canvas");
  const $ = id => document.getElementById(id);
  const input = $("task-input"), list = $("task-list"), summary = $("task-summary");
  tasks.onTaskComplete = reward => { engine.addResources(reward); updateHud(); };
  tasks.onListUpdate = render;
  $("add-task-btn").addEventListener("click", addTask);
  input.addEventListener("keypress", event => { if (event.key === "Enter") addTask(); });
  $("clear-completed-btn").addEventListener("click", () => tasks.clearCompleted());
  $("upgrade-btn").addEventListener("click", () => { if (engine.upgrade()) updateHud(); });
  function addTask() { if (tasks.addTask(input.value)) { input.value = ""; input.focus(); } }
  function updateHud() {
    $("resource-count").textContent = engine.resources;
    $("citadel-level").textContent = engine.level;
    const cost = engine.getUpgradeCost();
    $("upgrade-cost").textContent = cost;
    $("upgrade-btn").disabled = engine.resources < cost;
  }
  function render() {
    const stats = tasks.getStats();
    summary.textContent = `${stats.pending} pending · ${stats.completed} completed · ${stats.earned} earned`;
    $("clear-completed-btn").disabled = stats.completed === 0;
    list.innerHTML = "";
    tasks.getTasks().forEach(task => {
      const li = document.createElement("li");
      li.className = `task-item ${task.completed ? "completed" : ""}`;
      const text = document.createElement("span");
      text.textContent = `${task.text} [Reward: ${task.reward}]`;
      const actions = document.createElement("div"); actions.className = "task-actions";
      if (!task.completed) { const button = document.createElement("button"); button.className = "complete-btn"; button.textContent = "Complete"; button.onclick = () => tasks.completeTask(task.id); actions.appendChild(button); }
      const remove = document.createElement("button"); remove.className = "delete-btn"; remove.textContent = "Delete"; remove.onclick = () => tasks.deleteTask(task.id); actions.appendChild(remove);
      li.append(text, actions); list.appendChild(li);
    });
  }
  updateHud(); render();
});

// --- NIGHT / DARK MODE CONTROLLER ---
function initTheme() {
    const savedTheme = localStorage.getItem("splitflow_theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    const btn = document.getElementById("themeToggleBtn");
    if (btn) btn.innerHTML = savedTheme === "dark" ? "☀️ Light" : "🌙 Dark";
}

function toggleNightMode() {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("splitflow_theme", next);
    const btn = document.getElementById("themeToggleBtn");
    if (btn) btn.innerHTML = next === "dark" ? "☀️ Light" : "🌙 Dark";
}

// Auto-run on DOM ready
document.addEventListener("DOMContentLoaded", initTheme);
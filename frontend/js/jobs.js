const JOB_API_URL = "http://127.0.0.1:8000";

// Template Management using localStorage
function saveTemplate(templateName, mode, modeValue, outputFormat) {
    const templates = JSON.parse(localStorage.getItem("splitflow_templates") || "{}");
    templates[templateName] = { mode, modeValue, outputFormat };
    localStorage.setItem("splitflow_templates", JSON.stringify(templates));
    alert(`Template "${templateName}" saved successfully!`);
}

function loadTemplatesIntoSelect(selectElementId) {
    const templates = JSON.parse(localStorage.getItem("splitflow_templates") || "{}");
    const select = document.getElementById(selectElementId);
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Select Saved Template --</option>';
    for (const [name, config] of Object.entries(templates)) {
        const opt = document.createElement("option");
        opt.value = name;
        opt.innerText = name;
        select.appendChild(opt);
    }
}

function getTemplateConfig(templateName) {
    const templates = JSON.parse(localStorage.getItem("splitflow_templates") || "{}");
    return templates[templateName] || null;
}

async function fetchJobHistory() {
    try {
        const response = await fetch(`${JOB_API_URL}/jobs`);
        if (!response.ok) return [];
        return await response.json();
    } catch (err) {
        console.error("Failed to fetch history", err);
        return [];
    }
}
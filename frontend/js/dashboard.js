// --- AUTO-APPLY RE-RUN PRESET FROM WORKSPACE ---
let pendingRerunConfig = null;

(function checkRerunPreset() {
    const rerunRaw = sessionStorage.getItem("splitflow_rerun_config");
    if (rerunRaw) {
        try {
            pendingRerunConfig = JSON.parse(rerunRaw);
            sessionStorage.removeItem("splitflow_rerun_config");
            
            // Show alert pill on dropzone
            const dropzoneP = document.querySelector("#dropzone p:last-child");
            if (dropzoneP) {
                dropzoneP.innerHTML = `<span style="color: var(--primary); font-weight: bold;">⚡ Re-run active:</span> Preset will apply after file selection (${pendingRerunConfig.mode})`;
            }
        } catch (e) {
            console.warn("Failed to parse rerun config:", e);
        }
    }
})();

function applyPendingRerunIfAny() {
    if (!pendingRerunConfig) return;
    
    const modeSelect = document.getElementById("splitMode");
    const formatSelect = document.getElementById("outputFormat");

    if (modeSelect) {
        modeSelect.value = pendingRerunConfig.mode;
        toggleModeInput();
    }

    const modeVal = document.getElementById("modeValue");
    if (modeVal) {
        modeVal.value = pendingRerunConfig.modeValue;
    }

    if (formatSelect) {
        formatSelect.value = pendingRerunConfig.outputFormat;
    }

    pendingRerunConfig = null;
}

// --- DROPZONE & FILE INPUT HANDLERS ---
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");

if (dropzone && fileInput) {
    dropzone.addEventListener("click", () => fileInput.click());

    dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.style.borderColor = "var(--primary)";
    });

    dropzone.addEventListener("dragleave", () => {
        dropzone.style.borderColor = "var(--border)";
    });

    dropzone.addEventListener("drop", async (e) => {
        e.preventDefault();
        dropzone.style.borderColor = "var(--border)";
        if (e.dataTransfer.files.length > 0) {
            await handleFileSelected(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener("change", async (e) => {
        if (e.target.files.length > 0) {
            await handleFileSelected(e.target.files[0]);
        }
    });
}

async function handleFileSelected(file) {
    try {
        dropzone.innerHTML = `<p>Uploading and analyzing ${file.name}...</p>`;
        uploadedFileMeta = await uploadFile(file);
        
        document.getElementById("fileStats").innerText = `File: ${uploadedFileMeta.fileName} | Total Rows: ${uploadedFileMeta.total_rows} | Size: ${uploadedFileMeta.fileSizeMb} MB`;
        
        const headerRow = document.getElementById("tableHeaders");
        headerRow.innerHTML = "";
        uploadedFileMeta.columns.forEach(col => {
            const th = document.createElement("th");
            th.innerText = col;
            headerRow.appendChild(th);
        });

        const tbody = document.getElementById("tableBody");
        tbody.innerHTML = "";
        uploadedFileMeta.preview_rows.forEach(row => {
            const tr = document.createElement("tr");
            row.forEach(val => {
                const td = document.createElement("td");
                td.innerText = val !== null ? val : "";
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        // If re-run was clicked, immediately populate settings and proceed
        if (pendingRerunConfig) {
            goToStep(3);
            applyPendingRerunIfAny();
        } else {
            goToStep(2);
        }
    } catch (err) {
        alert("Error: " + err.message);
        location.reload();
    }
}

function goToStep(stepNum) {
    for (let i = 1; i <= 4; i++) {
        const card = document.getElementById(`step-${i}-card`);
        const ind = document.getElementById(`indicator-${i}`);
        if (card) card.classList.add("hidden");
        if (ind) ind.classList.remove("active");
    }
    const targetCard = document.getElementById(`step-${stepNum}-card`);
    if (targetCard) targetCard.classList.remove("hidden");

    for (let i = 1; i <= stepNum; i++) {
        const ind = document.getElementById(`indicator-${i}`);
        if (ind) ind.classList.add("active");
    }
    if (stepNum === 3) {
        loadTemplatesIntoSelect("savedTemplates");
    }
}

function toggleModeInput() {
    const mode = document.getElementById("splitMode").value;
    const group = document.getElementById("modeValueGroup");
    
    if (mode === "pieces") {
        group.innerHTML = `
            <label id="modeValueLabel" for="modeValue">Number of Pieces (N)</label>
            <input type="number" id="modeValue" class="form-control" value="4" min="1">
        `;
    } else if (mode === "rows") {
        group.innerHTML = `
            <label id="modeValueLabel" for="modeValue">Rows per File (e.g. 50000)</label>
            <input type="number" id="modeValue" class="form-control" value="50000" min="1">
        `;
    } else if (mode === "column") {
        let optionsHtml = '';
        if (typeof uploadedFileMeta !== 'undefined' && uploadedFileMeta.columns) {
            uploadedFileMeta.columns.forEach(col => {
                optionsHtml += `<option value="${col}">${col}</option>`;
            });
        }
        group.innerHTML = `
            <label id="modeValueLabel" for="modeValue">Select Column to Split By</label>
            <select id="modeValue" class="form-control">
                ${optionsHtml}
            </select>
        `;
    }
}

function saveCurrentTemplate() {
    const name = document.getElementById("templateNameInput").value.trim();
    if (!name) {
        alert("Please enter a template name.");
        return;
    }
    const mode = document.getElementById("splitMode").value;
    const modeValue = document.getElementById("modeValue").value;
    const outputFormat = document.getElementById("outputFormat").value;
    saveTemplate(name, mode, modeValue, outputFormat);
    loadTemplatesIntoSelect("savedTemplates");
}

function applySelectedTemplate() {
    const name = document.getElementById("savedTemplates").value;
    if (!name) return;
    const config = getTemplateConfig(name);
    if (config) {
        document.getElementById("splitMode").value = config.mode;
        toggleModeInput();
        document.getElementById("modeValue").value = config.modeValue;
        document.getElementById("outputFormat").value = config.outputFormat;
    }
}

async function toggleHistoryModal() {
    const card = document.getElementById("history-card");
    card.classList.toggle("hidden");
    if (!card.classList.contains("hidden")) {
        const history = await fetchJobHistory();
        const tbody = document.getElementById("historyBody");
        tbody.innerHTML = "";
        history.forEach(job => {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${job.jobId.slice(0,8)}...</td><td>${job.fileName}</td><td>${job.mode}</td><td>${job.status}</td>`;
            tbody.appendChild(tr);
        });
    }
}

async function startSplitJob() {
    goToStep(4);
    const payload = {
        fileId: uploadedFileMeta.fileId,
        filePath: uploadedFileMeta.filePath,
        fileName: uploadedFileMeta.fileName,
        mode: document.getElementById("splitMode").value,
        modeValue: document.getElementById("splitMode").value === "column" ? document.getElementById("modeValue").value : parseInt(document.getElementById("modeValue").value),
        outputFormat: document.getElementById("outputFormat").value
    };

    const headerBtn = document.getElementById("headerZipBtn");
    const footerBtn = document.getElementById("footerZipBtn");
    if (headerBtn) headerBtn.classList.add("hidden");
    if (footerBtn) footerBtn.classList.add("hidden");

    try {
        const res = await createJob(payload);
        document.getElementById("jobStatusText").innerText = `Job Status: PROCESSING...`;
        document.getElementById("jobResultDetails").innerHTML = `
            <p><strong>Job ID:</strong> ${res.jobId}</p>
            <p style="color: var(--primary); margin-top: 10px;">⏳ Background worker is processing your file slices...</p>
        `;

        const pollInterval = setInterval(async () => {
            try {
                const statusRes = await fetch(`${JOB_API_URL}/jobs/${res.jobId}/outputs`);
                const data = await statusRes.json();
                
                if (data.files && data.files.length > 0) {
                    clearInterval(pollInterval);
                    document.getElementById("jobStatusText").innerText = `Job Status: COMPLETED ✅`;
                    
                    const zipUrl = `${JOB_API_URL}/jobs/${res.jobId}/download-zip`;
                    
                    if (headerBtn) {
                        headerBtn.href = zipUrl;
                        headerBtn.innerText = `📦 Download All as ZIP (${data.files.length} Files)`;
                        headerBtn.classList.remove("hidden");
                    }
                    if (footerBtn) {
                        footerBtn.href = zipUrl;
                        footerBtn.innerText = `📦 Download All as ZIP (${data.files.length} Files)`;
                        footerBtn.classList.remove("hidden");
                    }

                    let filesHtml = '<div style="margin-top: 15px; border-top: 1px solid var(--border); padding-top: 15px;"><h4>Generated Split Files (Ready for Download):</h4><ul style="list-style: none; padding: 0; margin-top: 10px;">';
                    data.files.forEach(file => {
                        const downloadLink = `${JOB_API_URL}/jobs/${res.jobId}/download/${file.name}`;
                        filesHtml += `<li style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; background: var(--surface); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border);">
                            <span>📄 <strong>${file.name}</strong> (${(file.sizeBytes / 1024).toFixed(1)} KB)</span>
                            <a href="${downloadLink}" class="btn" style="padding: 5px 12px; font-size: 13px;" download>Download ⬇</a>
                        </li>`;
                    });
                    filesHtml += '</ul></div>';
                    
                    document.getElementById("jobResultDetails").innerHTML = filesHtml;
                }
            } catch (pollErr) {
                console.error("Polling error", pollErr);
            }
        }, 2000);

    } catch (err) {
        document.getElementById("jobStatusText").innerText = "Job Failed";
        document.getElementById("jobResultDetails").innerHTML = `<p style="color: red;">${err.message}</p>`;
    }
}

async function triggerManualCleanup() {
    if (!confirm("Are you sure you want to delete all temporary upload and output files?")) return;
    try {
        const response = await fetch(`${JOB_API_URL}/jobs/cleanup`, { method: "DELETE" });
        const res = await response.json();
        if (response.ok) {
            alert(`Cleanup successful!\nRemoved ${res.details.uploads_removed} upload files and ${res.details.outputs_removed} output job folders.`);
        } else {
            alert("Cleanup failed: " + res.detail);
        }
    } catch (err) {
        alert("Error connecting to server for cleanup: " + err.message);
    }
}
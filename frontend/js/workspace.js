let allVaultJobs = [];
let showFavoritesOnly = false;
let activeShareJobId = null;

if (window.firebaseReady) {
    window.firebaseReady.then(() => {
        if (!auth) return;
        auth.onAuthStateChanged(async (user) => {
            const gate = document.getElementById("unauthGate");
            const content = document.getElementById("workspaceContent");

            if (!user) {
                if (gate) gate.classList.remove("hidden");
                if (content) content.classList.add("hidden");
            } else {
                if (gate) gate.classList.add("hidden");
                if (content) content.classList.remove("hidden");
                listenToUserJobs(user.uid);
            }
        });
    });
}

function listenToUserJobs(uid) {
    db.collection("users").doc(uid).collection("jobs")
        .orderBy("createdAt", "desc")
        .onSnapshot((snapshot) => {
            allVaultJobs = [];
            snapshot.forEach(doc => {
                allVaultJobs.push({ id: doc.id, ...doc.data() });
            });
            renderVaultList();
        }, (err) => {
            console.error("Vault listener error:", err);
            const container = document.getElementById("vaultList");
            if (container) container.innerHTML = `<p style="color:red; text-align:center;">Failed to load vault: ${err.message}</p>`;
        });
}

function renderVaultList() {
    const container = document.getElementById("vaultList");
    if (!container) return;

    const searchTerm = (document.getElementById("vaultSearchInput")?.value || "").toLowerCase().trim();

    let filtered = allVaultJobs.filter(job => {
        if (showFavoritesOnly && !job.isFavorite) return false;
        if (!searchTerm) return true;
        const nameMatch = (job.customName || "").toLowerCase().includes(searchTerm);
        const fileMatch = (job.originalFileName || "").toLowerCase().includes(searchTerm);
        const modeMatch = (job.mode || "").toLowerCase().includes(searchTerm);
        return nameMatch || fileMatch || modeMatch;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 30px;">No jobs found in your vault.</p>`;
        return;
    }

    container.innerHTML = "";
    filtered.forEach(job => {
        const item = document.createElement("div");
        item.className = "vault-item";

        const isStarred = job.isFavorite === true;
        const zipUrl = `/jobs/${job.jobId}/download-zip`;

        item.innerHTML = `
            <div class="vault-item-left">
                <button class="star-btn ${isStarred ? 'starred' : ''}" onclick="toggleFavoriteJob('${job.id}', ${!isStarred})" title="Star / Favorite">
                    ${isStarred ? '★' : '☆'}
                </button>
                <div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="text" class="vault-title" value="${escapeHtml(job.customName || job.originalFileName || 'Untitled Split')}" onblur="saveJobRename('${job.id}', this.value)" title="Click to rename inline">
                        <span class="badge">${(job.outputFormat || 'csv').toUpperCase()}</span>
                    </div>
                    <div class="vault-meta">
                        Original: <strong>${escapeHtml(job.originalFileName || 'N/A')}</strong> • Mode: <strong>${job.mode}</strong> (${job.modeValue})
                        ${job.notes ? `<div style="margin-top: 4px; color: var(--primary); font-size: 11px;">📝 ${escapeHtml(job.notes)}</div>` : ''}
                    </div>
                </div>
            </div>

            <div class="vault-actions">
                <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="promptJobNote('${job.id}', '${escapeAttr(job.notes || '')}')">
                    📝 Note
                </button>
                <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="openShareModal('${job.jobId}')">
                    🔗 Share
                </button>
                <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="rerunJobPreset('${escapeAttr(job.mode)}', '${escapeAttr(job.modeValue)}', '${escapeAttr(job.outputFormat)}')">
                    ⚡ Re-run
                </button>
                <a href="${zipUrl}" class="btn-zip" style="padding: 6px 12px; font-size: 12px;" download>
                    📦 ZIP
                </a>
                <button class="btn btn-secondary" style="padding: 6px 10px; font-size: 12px; color: #dc2626;" onclick="deleteVaultJob('${job.id}', '${job.jobId}')" title="Delete job">
                    🗑️
                </button>
            </div>
        `;
        container.appendChild(item);
    });
}

async function toggleFavoriteJob(docId, nextState) {
    if (!auth.currentUser) return;
    try {
        await db.collection("users").doc(auth.currentUser.uid).collection("jobs").doc(docId).update({
            isFavorite: nextState
        });
    } catch (err) {
        alert("Could not update favorite: " + err.message);
    }
}

async function saveJobRename(docId, newName) {
    if (!auth.currentUser || !newName.trim()) return;
    try {
        await db.collection("users").doc(auth.currentUser.uid).collection("jobs").doc(docId).update({
            customName: newName.trim()
        });
    } catch (err) {
        console.error("Rename failed:", err);
    }
}

async function promptJobNote(docId, currentNote) {
    const updated = prompt("Attach a note / memo to this job:", currentNote);
    if (updated === null) return;
    try {
        await db.collection("users").doc(auth.currentUser.uid).collection("jobs").doc(docId).update({
            notes: updated.trim()
        });
    } catch (err) {
        alert("Could not save note: " + err.message);
    }
}

function rerunJobPreset(mode, modeValue, outputFormat) {
    sessionStorage.setItem("splitflow_rerun_config", JSON.stringify({
        mode: mode,
        modeValue: modeValue,
        outputFormat: outputFormat
    }));
    window.location.href = "/dashboard.html";
}

async function deleteVaultJob(docId, jobId) {
    if (!confirm("Are you sure you want to delete this job and its files?")) return;
    try {
        await fetch(`/jobs/${jobId}`, { method: "DELETE" });
        if (auth.currentUser) {
            await db.collection("users").doc(auth.currentUser.uid).collection("jobs").doc(docId).delete();
        }
    } catch (err) {
        alert("Failed to delete job: " + err.message);
    }
}

// --- SHARE MODAL HANDLERS ---
function openShareModal(jobId) {
    activeShareJobId = jobId;
    document.getElementById("shareResultBox").classList.add("hidden");
    document.getElementById("sharePin").value = "";
    document.getElementById("generateShareBtn").classList.remove("hidden");
    document.getElementById("shareModal").classList.remove("hidden");
}

function closeShareModal() {
    document.getElementById("shareModal").classList.add("hidden");
    activeShareJobId = null;
}

async function submitCreateShare() {
    if (!activeShareJobId) return;
    const expiryHours = parseInt(document.getElementById("shareExpiry").value);
    const pin = document.getElementById("sharePin").value.trim();

    try {
        const res = await fetch("/jobs/share/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jobId: activeShareJobId,
                expiryHours: expiryHours,
                pin: pin || null
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Could not generate share link.");
        }

        const data = await res.json();
        const fullUrl = `${window.location.origin}${data.shareUrl}`;
        
        document.getElementById("shareUrlDisplay").innerText = fullUrl;
        document.getElementById("shareResultBox").classList.remove("hidden");
        document.getElementById("generateShareBtn").classList.add("hidden");
    } catch (err) {
        alert("Share generation failed: " + err.message);
    }
}

function copyShareUrl() {
    const text = document.getElementById("shareUrlDisplay").innerText;
    navigator.clipboard.writeText(text).then(() => {
        alert("Share link copied to clipboard!");
    });
}

function filterVaultJobs() {
    renderVaultList();
}

function toggleFavoritesOnlyFilter() {
    showFavoritesOnly = !showFavoritesOnly;
    const btn = document.getElementById("favFilterBtn");
    if (btn) {
        btn.classList.toggle("btn-secondary", !showFavoritesOnly);
        btn.style.background = showFavoritesOnly ? "var(--primary)" : "";
        btn.style.color = showFavoritesOnly ? "#fff" : "";
    }
    renderVaultList();
}

function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeAttr(str) {
    return String(str).replace(/'/g, "\\'").replace(/"/g, "&quot;");
}
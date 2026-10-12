// Night Mode support for admin
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
initTheme();

// Auth gate
if (window.firebaseReady) {
    window.firebaseReady.then(() => {
        if (!auth) return;
        auth.onAuthStateChanged(async (user) => {
            if (!user || user.email !== ADMIN_EMAIL) {
                document.getElementById("accessDenied").classList.remove("hidden");
                document.getElementById("adminContent").classList.add("hidden");
            } else {
                document.getElementById("accessDenied").classList.add("hidden");
                document.getElementById("adminContent").classList.remove("hidden");
                initAdminDashboard();
            }
        });
    });
}

function switchAdminTab(tabName) {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll("#adminContent .card").forEach(c => {
        if (c.id && c.id.startsWith("tab-")) c.classList.add("hidden");
    });

    event.target.classList.add("active");
    const activeCard = document.getElementById(`tab-${tabName}`);
    if (activeCard) activeCard.classList.remove("hidden");
}

async function initAdminDashboard() {
    await loadMetrics();
    await loadUsersList();
    await loadAnnouncement();
}

async function loadMetrics() {
    try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch("/admin/metrics", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();

        document.getElementById("kpiTotalJobs").innerText = data.totalJobs;
        document.getElementById("kpiCompleted").innerText = data.completedJobs;
        document.getElementById("kpiFailed").innerText = data.failedJobs;
        document.getElementById("kpiDiskStorage").innerText = `${(data.uploadStorageMb + data.outputStorageMb).toFixed(1)} MB`;

        renderJobsTable(data.recentJobs || []);
    } catch (err) {
        console.error("Failed to load metrics:", err);
    }
}

async function loadUsersList() {
    const tbody = document.getElementById("usersTableBody");
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Fetching users...</td></tr>';
    try {
        const snapshot = await db.collection("users").get();
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No users registered yet.</td></tr>';
            return;
        }

        tbody.innerHTML = "";
        snapshot.forEach(doc => {
            const u = doc.data();
            const tr = document.createElement("tr");
            const isBlocked = u.isBlocked === true;
            tr.innerHTML = `
                <td><img src="${u.photoURL || 'https://via.placeholder.com/30'}" style="width:30px; height:30px; border-radius:50%;"></td>
                <td><strong>${u.email || 'N/A'}</strong></td>
                <td>${u.displayName || 'User'}</td>
                <td><span class="badge">${u.plan || 'Guest/Free'}</span></td>
                <td><span class="status-badge ${isBlocked ? 'status-failed' : 'status-completed'}">${isBlocked ? 'Blocked' : 'Active'}</span></td>
                <td>
                    <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 12px;" onclick="toggleBlockUser('${u.uid}', ${!isBlocked})">
                        ${isBlocked ? 'Unblock' : 'Block'}
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Error: ${err.message}</td></tr>`;
    }
}

async function toggleBlockUser(uid, blockState) {
    try {
        await db.collection("users").doc(uid).update({ isBlocked: blockState });
        const token = await auth.currentUser.getIdToken();
        await fetch("/admin/block-user", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ uid: uid, blocked: blockState })
        });
        alert(`User status updated to: ${blockState ? 'Blocked' : 'Active'}`);
        loadUsersList();
    } catch (err) {
        alert("Error changing user block status: " + err.message);
    }
}

function renderJobsTable(jobs) {
    const tbody = document.getElementById("jobsTableBody");
    if (!jobs || jobs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No split jobs executed yet.</td></tr>';
        return;
    }
    tbody.innerHTML = "";
    jobs.slice().reverse().forEach(j => {
        const tr = document.createElement("tr");
        const statusClass = j.status === 'completed' ? 'status-completed' : (j.status === 'failed' ? 'status-failed' : 'status-processing');
        tr.innerHTML = `
            <td><code>${(j.jobId || '').slice(0, 8)}...</code></td>
            <td>${j.fileName || 'N/A'}</td>
            <td>${j.mode || 'N/A'}</td>
            <td><strong>${(j.outputFormat || 'csv').toUpperCase()}</strong></td>
            <td><span class="status-badge ${statusClass}">${j.status}</span></td>
            <td style="color: ${j.error ? '#dc2626' : 'var(--text-muted)'}; font-size: 13px;">${j.error || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function loadJobsTable() {
    await loadMetrics();
}

async function loadAnnouncement() {
    try {
        const res = await fetch("/admin/announcement");
        const data = await res.json();
        document.getElementById("announcementActive").checked = data.active;
        document.getElementById("announcementText").value = data.message || "";
        document.getElementById("announcementType").value = data.type || "info";
    } catch (err) {
        console.error("Failed to load announcement:", err);
    }
}

async function saveAnnouncement() {
    try {
        const token = await auth.currentUser.getIdToken();
        const payload = {
            active: document.getElementById("announcementActive").checked,
            message: document.getElementById("announcementText").value,
            type: document.getElementById("announcementType").value
        };
        const res = await fetch("/admin/announcement", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            alert("Announcement settings published successfully!");
        }
    } catch (err) {
        alert("Failed to save announcement: " + err.message);
    }
}

async function triggerAdminStoragePurge() {
    if (!confirm("Are you sure you want to force purge all upload and output files from the server?")) return;
    try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch("/admin/cleanup", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        alert(`Storage purged successfully!\nRemoved ${data.deleted.uploads_removed} uploads and ${data.deleted.outputs_removed} output folders.`);
        loadMetrics();
    } catch (err) {
        alert("Failed to purge storage: " + err.message);
    }
}
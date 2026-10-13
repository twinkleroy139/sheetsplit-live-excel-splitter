let currentToken = "";

(async function initSharePortal() {
    // Extract token from URL path: /share/{token}
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    currentToken = pathParts[pathParts.length - 1];

    if (!currentToken || currentToken === "share.html") {
        showError("Invalid or missing share link token.");
        return;
    }

    await loadShareDetails(null);
})();

async function loadShareDetails(pin) {
    const loadingCard = document.getElementById("shareLoading");
    const pinCard = document.getElementById("pinChallengeCard");
    const contentCard = document.getElementById("shareContent");
    const errorCard = document.getElementById("shareError");

    loadingCard.classList.remove("hidden");
    pinCard.classList.add("hidden");
    contentCard.classList.add("hidden");
    errorCard.classList.add("hidden");

    try {
        let url = `/jobs/share/${currentToken}/info`;
        if (pin) url += `?pin=${encodeURIComponent(pin)}`;

        const res = await fetch(url);
        loadingCard.classList.add("hidden");

        if (res.status === 401) {
            pinCard.classList.remove("hidden");
            if (pin) alert("Incorrect PIN. Please try again.");
            return;
        }

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Link expired or unavailable.");
        }

        const data = await res.json();

        // Prompt for PIN if link is protected and unauthenticated
        if (data.isProtected && !data.authenticated) {
            pinCard.classList.remove("hidden");
            return;
        }

        // Render download portal
        document.getElementById("shareFileName").innerText = data.fileName;
        const expiryDate = new Date(data.expiresAt * 1000);
        document.getElementById("shareExpiryNote").innerText = `Expires: ${expiryDate.toLocaleString()}`;

        const zipBtn = document.getElementById("shareZipBtn");
        zipBtn.href = data.zipUrl;

        const list = document.getElementById("shareFilesList");
        list.innerHTML = "";
        data.files.forEach(f => {
            const li = document.createElement("li");
            li.style.cssText = "margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; background: var(--surface-alt); padding: 10px 14px; border-radius: 6px; border: 1px solid var(--border);";
            li.innerHTML = `
                <span>📄 <strong>${escapeHtml(f.name)}</strong> (${(f.sizeBytes / 1024).toFixed(1)} KB)</span>
                <a href="${f.downloadUrl}" class="btn" style="padding: 5px 12px; font-size: 13px;" download>Download ⬇</a>
            `;
            list.appendChild(li);
        });

        contentCard.classList.remove("hidden");
    } catch (err) {
        loadingCard.classList.add("hidden");
        showError(err.message);
    }
}

function submitPin() {
    const pin = document.getElementById("recipientPin").value.trim();
    if (!pin) {
        alert("Please enter the PIN.");
        return;
    }
    loadShareDetails(pin);
}

function showError(msg) {
    document.getElementById("shareErrorMessage").innerText = msg;
    document.getElementById("shareError").classList.remove("hidden");
}

function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
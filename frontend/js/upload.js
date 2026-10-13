const API_URL = window.location.origin.includes("127.0.0.1") || window.location.origin.includes("localhost")
    ? "https://sheetsplit-api.onrender.com"
    : "";

let uploadedFileMeta = null;

async function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("plan", currentUser ? "free" : "guest");

    const response = await fetch(`${API_URL}/upload/init`, {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Upload failed");
    }

    return await response.json();
}

async function createJob(jobPayload) {
    const response = await fetch(`${API_URL}/jobs`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(jobPayload)
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to create split job");
    }

    const jobResult = await response.json();

    // Auto-save record into the user's private Firestore collection
    if (typeof auth !== "undefined" && auth && auth.currentUser && typeof db !== "undefined" && db) {
        try {
            const uid = auth.currentUser.uid;
            await db.collection("users").doc(uid).collection("jobs").doc(jobResult.jobId).set({
                jobId: jobResult.jobId,
                customName: jobPayload.fileName,
                originalFileName: jobPayload.fileName,
                mode: jobPayload.mode,
                modeValue: jobPayload.modeValue,
                outputFormat: jobPayload.outputFormat,
                isFavorite: false,
                notes: "",
                status: "completed",
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (syncErr) {
            console.warn("Could not sync job to Firestore vault:", syncErr.message);
        }
    }

    return jobResult;
}
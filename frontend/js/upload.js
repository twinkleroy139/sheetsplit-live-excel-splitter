const API_URL = "http://127.0.0.1:8000";

let uploadedFileMeta = null;

async function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("plan", "guest");

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

    return await response.json();
}
let auth = null;
let db = null;

async function initFirebase() {
    try {
        const response = await fetch("/api/config");
        if (!response.ok) {
            throw new Error("Could not fetch Firebase configuration from server.");
        }
        const firebaseConfig = await response.json();

        if (!firebaseConfig.apiKey) {
            console.warn("Firebase configuration is missing in environment variables.");
            return;
        }

        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        auth = firebase.auth();
        db = firebase.firestore();
        console.log("Firebase initialized successfully from environment.");
    } catch (err) {
        console.error("Firebase init error:", err);
    }
}

// Global initialization promise so auth.js can await it
window.firebaseReady = initFirebase();
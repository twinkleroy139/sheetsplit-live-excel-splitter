let currentUser = null;
let currentIdToken = null;

const ADMIN_EMAIL = "twinkleroy139@gmail.com";

async function signInWithGoogle() {
    if (!auth) await window.firebaseReady;
    if (!auth) {
        alert("Authentication service is initializing. Please try again in a moment.");
        return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(async (result) => {
            const user = result.user;
            
            try {
                if (db) {
                    await db.collection("users").doc(user.uid).set({
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                }
            } catch (dbErr) {
                console.warn("Firestore user sync warning:", dbErr.message);
            }
        })
        .catch((error) => {
            console.error("Login failed:", error.message);
            alert("Google Sign-In failed: " + error.message);
        });
}

function signOutUser() {
    if (auth) {
        auth.signOut().then(() => window.location.reload());
    }
}

if (window.firebaseReady) {
    window.firebaseReady.then(() => {
        if (!auth) return;
        auth.onAuthStateChanged(async (user) => {
            currentUser = user;
            const authContainer = document.getElementById("authContainer");

            if (user) {
                currentIdToken = await user.getIdToken();
                const isAdmin = user.email === ADMIN_EMAIL;

                if (authContainer) {
                    authContainer.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <a href="/workspace.html" class="btn btn-secondary" style="padding: 6px 12px; font-size: 13px;">My Workspace 📊</a>
                            ${isAdmin ? '<a href="/admin.html" class="btn btn-secondary" style="background:#e0e7ff; color:#3730a3; border-color:#c7d2fe; padding: 6px 12px; font-size: 13px;">Admin ⚙️</a>' : ''}
                            <img src="${user.photoURL || 'https://via.placeholder.com/32'}" style="width:32px; height:32px; border-radius:50%; border:2px solid var(--primary);" title="${user.displayName}">
                            <button class="btn btn-secondary" style="padding: 6px 10px; font-size: 13px;" onclick="signOutUser()">Sign Out</button>
                        </div>
                    `;
                }
            } else {
                currentIdToken = null;
                if (authContainer) {
                    authContainer.innerHTML = `
                        <button class="btn btn-secondary" style="display:flex; align-items:center; gap:8px;" onclick="signInWithGoogle()">
                            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                            Sign in with Google
                        </button>
                    `;
                }
            }
        });
    });
}
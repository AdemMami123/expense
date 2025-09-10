import { getApps } from "firebase-admin/app";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const initFirebaseAdmin = () => {
    const apps = getApps();
    if (!apps.length) {
        initializeApp({
            credential: cert({
                projectId: import.meta.env.FIREBASE_PROJECT_ID,
                clientEmail: import.meta.env.FIREBASE_CLIENT_EMAIL,
                privateKey: import.meta.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    }

    return {
        auth: getAuth(),
        db: getFirestore(),
    };
};

export const { auth, db } = initFirebaseAdmin();

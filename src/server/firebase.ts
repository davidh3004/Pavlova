/**
 * Firebase Admin (Firestore) initialization.
 *
 * Credentials are read from environment variables so the project can be
 * configured at deploy time without code changes:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY   (supports literal "\n" escapes)
 *
 * If credentials are missing, getDb() returns null and the API layer
 * degrades gracefully (empty data) instead of crashing — so the site still
 * runs on any machine before Firebase is configured.
 */
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let cached: Firestore | null | undefined;

/** True when a value is missing or is one of the .env.example placeholders. */
function isPlaceholder(value?: string): boolean {
  if (!value) return true;
  return /your-firebase-project-id|your-project|firebase-adminsdk-xxxxx|MIIE\.\.\.|BEGIN PRIVATE KEY-----\\nMIIE\.\.\./i.test(value);
}

function readCredentials() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey && privateKey.includes("\\n")) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }
  return { projectId, clientEmail, privateKey };
}

export function isFirebaseConfigured(): boolean {
  const { projectId, clientEmail, privateKey } = readCredentials();
  if (!projectId || !clientEmail || !privateKey) return false;
  // Treat the .env.example placeholder values as "not configured".
  return !isPlaceholder(projectId) && !isPlaceholder(clientEmail) && !isPlaceholder(privateKey);
}

export function getDb(): Firestore | null {
  if (cached !== undefined) return cached;

  const { projectId, clientEmail, privateKey } = readCredentials();
  if (!isFirebaseConfigured()) {
    console.warn(
      "[Firebase] Credentials not set or still using placeholders. Falling back to the local JSON store (data/store.json) for development."
    );
    cached = null;
    return cached;
  }

  try {
    const app: App = getApps().length
      ? getApps()[0]!
      : initializeApp({ credential: cert({ projectId: projectId!, clientEmail: clientEmail!, privateKey: privateKey! }) });
    cached = getFirestore(app);
    return cached;
  } catch (err) {
    console.error("[Firebase] Failed to initialize:", err);
    cached = null;
    return cached;
  }
}

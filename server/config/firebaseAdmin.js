const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const normalizePrivateKey = (privateKey = "") =>
  privateKey.trim().replace(/^"(.*)"$/s, "$1").replace(/\\n/g, "\n");

const hasFirebaseAdminConfig = Boolean(
  process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
);

let firebaseAuth = null;

if (hasFirebaseAdminConfig) {
  const firebaseApp =
    getApps()[0] ||
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
      }),
    });

  firebaseAuth = getAuth(firebaseApp);
}

module.exports = {
  firebaseAuth,
  hasFirebaseAdminConfig,
};

const admin = require('firebase-admin');

if (!admin.apps.length) {
  let credential;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Vercel: store the full service-account JSON as a single env var
    try {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      credential = admin.credential.cert(sa);
    } catch (err) {
      throw new Error(
        '[firebase-admin] FIREBASE_SERVICE_ACCOUNT is not valid JSON: ' + err.message
      );
    }
  } else {
    // Individual env vars (local dev / Railway / Render)
    credential = admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    });
  }

  admin.initializeApp({ credential });
}

const db   = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };

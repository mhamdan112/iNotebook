let firebaseApp = null;

try {
  const { initializeApp, cert, getApps } = require('firebase-admin/app');
  const { getAuth } = require('firebase-admin/auth');

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

  if (!getApps().length) {
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
      });
    } else if (projectId && clientEmail && privateKey) {
      firebaseApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
  } else {
    firebaseApp = getApps()[0];
  }

  module.exports = {
    isConfigured: Boolean(firebaseApp),
    getAuth: () => (firebaseApp ? getAuth(firebaseApp) : null),
  };
} catch (error) {
  console.warn('firebase-admin is not configured:', error?.message || error);
  module.exports = {
    isConfigured: false,
    getAuth: () => null,
  };
}

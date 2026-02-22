'use strict';

// ─── Task 64: Firebase Admin SDK ──────────────────────────────────────────────

const env    = require('./env');
const logger = require('../utils/logger');

let firebaseApp;
let adminInstance;

const getFirebaseApp = () => {
  if (firebaseApp) { return firebaseApp; }

  const hasCredentials = env.FCM_PROJECT_ID && (env.FCM_SERVER_KEY || env.FCM_SERVICE_ACCOUNT_JSON);
  if (!hasCredentials) {
    logger.warn('Firebase credentials not configured — push notifications disabled');
    return null;
  }

  try {
    const admin = require('firebase-admin');
    adminInstance = admin;

    let credential;
    if (env.FCM_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(env.FCM_SERVICE_ACCOUNT_JSON);
      credential = admin.credential.cert(serviceAccount);
    } else {
      credential = admin.credential.cert({
        projectId:  env.FCM_PROJECT_ID,
        privateKey: env.FCM_SERVER_KEY.replace(/\\n/g, '\n'),
        clientEmail: `firebase-adminsdk@${env.FCM_PROJECT_ID}.iam.gserviceaccount.com`,
      });
    }

    firebaseApp = admin.initializeApp({ credential });
    return firebaseApp;
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to initialize Firebase — push notifications disabled');
    return null;
  }
};

const getAdmin = () => {
  getFirebaseApp(); // ensure init
  return adminInstance;
};

module.exports = { getFirebaseApp, getAdmin };

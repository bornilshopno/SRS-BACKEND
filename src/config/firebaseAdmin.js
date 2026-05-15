import admin from "firebase-admin";

let app;

export const initFirebase = (serviceAccount) => {
  if (!admin.apps.length) {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  return app;
};

export const firebaseAuth =()=> admin.auth();
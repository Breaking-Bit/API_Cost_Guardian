const admin = require('firebase-admin');
const logger = require('../utils/logger');

const initializeFirebase = () => {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL
            })
        });
        logger.info('Firebase Admin initialized successfully');
    } catch (error) {
        logger.error('Firebase Admin initialization error:', error);
        throw new Error('Failed to initialize Firebase Admin');
    }
};

module.exports = {
    initializeFirebase,
    admin
};
const admin = require('firebase-admin');
const Company = require('../models/Company');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No Firebase UID provided' });
        }

        const uid = authHeader.split(' ')[1];
        
        try {
            // Verify the UID exists in Firebase
            const userRecord = await admin.auth().getUser(uid);
            
            // Get company from MongoDB using firebase_uid
            const company = await Company.findOne({ firebase_uid: userRecord.uid });
            if (!company) {
                return res.status(404).json({ error: 'Company not found for the provided UID' });
            }

            // Add company info to request
            req.user = {
                company_id: company._id,
                firebase_uid: userRecord.uid,
                email: company.email
            };

            next();
        } catch (firebaseError) {
            logger.error('Firebase Auth Error:', firebaseError);
            return res.status(401).json({ error: 'Invalid Firebase UID' });
        }
    } catch (error) {
        logger.error('Authentication Error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

module.exports = authMiddleware;
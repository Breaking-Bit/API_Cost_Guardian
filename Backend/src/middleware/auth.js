const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            throw new Error('No authentication token provided');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        req.token = token;
        
        next();
    } catch (error) {
        logger.error('Authentication error:', error.message);
        res.status(401).json({ error: 'Please authenticate' });
    }
};

module.exports = auth;
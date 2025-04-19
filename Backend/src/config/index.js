const config = {
    app: {
        port: process.env.PORT || 8080,
        env: process.env.NODE_ENV || 'development',
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'  // Updated this line
    },
    alerts: {
        notificationsEnabled: process.env.ALERT_NOTIFICATION_ENABLED === 'true',
    },
    email: {
        smtp: {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        }
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    }
};

module.exports = config;
const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    service_name: {
        type: String,
        required: true,
        trim: true
    },
    alert_type: {
        type: String,
        enum: ['budget_threshold', 'cost_spike', 'system'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'resolved'],
        default: 'active'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    resolved_at: {
        type: Date
    }
});

const Alert = mongoose.model('Alert', alertSchema);
module.exports = Alert;
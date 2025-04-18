const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
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
    budget_amount: {
        type: Number,
        required: true,
        min: 0
    },
    budget_period: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'monthly'
    },
    alert_threshold: {
        type: Number,
        default: 80,  // Percentage
        min: 1,
        max: 100
    },
    budget_status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

const Budget = mongoose.model('Budget', budgetSchema);
module.exports = Budget;
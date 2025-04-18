const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'archived'],
        default: 'active'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;
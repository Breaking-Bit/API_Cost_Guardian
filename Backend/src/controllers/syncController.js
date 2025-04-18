const CostData = require('../models/CostData');
const Project = require('../models/Project');
const Company = require('../models/Company');
const logger = require('../utils/logger');

class SyncController {
    constructor() {
        // Bind the methods to preserve 'this' context
        this.syncData = this.syncData.bind(this);
        this.simulateAPIUsageData = this.simulateAPIUsageData.bind(this);
        this.calculateCost = this.calculateCost.bind(this);
        this.getLastSyncStatus = this.getLastSyncStatus.bind(this);
    }

    async syncData(req, res) {
        try {
            const { company_id } = req.user;
            const project_id = req.headers['x-project-id'];

            // Validate project access
            const project = await Project.findOne({
                _id: project_id,
                company: company_id,
                status: 'active'
            });

            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }

            // Get last sync timestamp
            const lastSync = await CostData.findOne({
                company: company_id,
                project: project_id
            }).sort({ date: -1 });

            const startDate = lastSync ? lastSync.date : new Date(new Date().setDate(new Date().getDate() - 30));
            
            // Simulate fetching new cost data
            const controller = new SyncController();
            const newData = await controller.simulateAPIUsageData(company_id, project_id, startDate);
            
            // Bulk insert new data
            if (newData.length > 0) {
                await CostData.insertMany(newData);
            }

            res.json({
                message: 'Data synced successfully',
                records_synced: newData.length,
                sync_period: {
                    from: startDate,
                    to: new Date()
                }
            });
        } catch (error) {
            logger.error('Sync Data Error:', error);
            res.status(500).json({ error: 'Failed to sync data' });
        }
    }

    async simulateAPIUsageData(company_id, project_id, startDate) {
        const services = ['GPT-4', 'DALL-E', 'Gemini', 'Claude'];
        const regions = ['us-east-1', 'eu-west-1', 'ap-south-1'];
        const newData = [];
        
        const currentDate = new Date();
        let date = new Date(startDate);

        while (date <= currentDate) {
            services.forEach(service => {
                const usageQuantity = Math.floor(Math.random() * 1000) + 1;
                const cost = this.calculateCost(service, usageQuantity);
                
                newData.push({
                    company: company_id,
                    project: project_id,
                    service_name: service,
                    cost,
                    usage_quantity: usageQuantity,
                    unit: 'API_CALLS',
                    region: regions[Math.floor(Math.random() * regions.length)],
                    date: new Date(date)
                });
            });

            date.setDate(date.getDate() + 1);
        }

        return newData;
    }

    calculateCost(service, quantity) {
        const rates = {
            'GPT-4': 0.03,
            'DALL-E': 0.02,
            'Gemini': 0.01,
            'Claude': 0.015
        };

        return quantity * (rates[service] || 0.01);
    }

    async getLastSyncStatus(req, res) {
        try {
            const { company_id } = req.user;
            const project_id = req.headers['x-project-id'];

            const lastSync = await CostData.findOne({
                company: company_id,
                project: project_id
            }).sort({ date: -1 });

            res.json({
                last_sync: lastSync ? lastSync.date : null,
                status: lastSync ? 'success' : 'never_synced'
            });
        } catch (error) {
            logger.error('Get Last Sync Status Error:', error);
            res.status(500).json({ error: 'Failed to fetch sync status' });
        }
    }
}

module.exports = new SyncController();
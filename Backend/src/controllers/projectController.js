const Project = require('../models/Project');
const Budget = require('../models/Budget');
const CostData = require('../models/CostData');
const logger = require('../utils/logger');

class ProjectController {
    async createProject(req, res) {
        try {
            const { company_id } = req.user;
            const { name, description } = req.body;

            const project = new Project({
                name,
                description,
                company: company_id
            });

            await project.save();
            res.status(201).json(project);
        } catch (error) {
            logger.error('Create Project Error:', error);
            res.status(500).json({ error: 'Failed to create project' });
        }
    }

    async getCompanyProjects(req, res) {
        try {
            const { company_id } = req.user;
            const projects = await Project.find({ company: company_id });
            res.json(projects);
        } catch (error) {
            logger.error('Get Company Projects Error:', error);
            res.status(500).json({ error: 'Failed to fetch projects' });
        }
    }

    async getProjectDetails(req, res) {
        try {
            const { company_id } = req.user;
            const { project_id } = req.params;

            const project = await Project.findOne({
                _id: project_id,
                company: company_id
            });

            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }

            const monthStart = new Date();
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);

            const [budgets, costData, apiUsage] = await Promise.all([
                Budget.find({ project: project_id, budget_status: 'active' }),
                CostData.aggregate([
                    {
                        $match: {
                            project: project._id,
                            date: { $gte: monthStart }
                        }
                    },
                    {
                        $group: {
                            _id: '$service_name',
                            total_cost: { $sum: '$cost' },
                            total_usage: { $sum: '$usage_quantity' },
                            average_daily_cost: { $avg: '$cost' }
                        }
                    }
                ]),
                CostData.aggregate([
                    {
                        $match: {
                            project: project._id,
                            date: { $gte: monthStart }
                        }
                    },
                    {
                        $group: {
                            _id: { 
                                service: '$service_name',
                                day: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
                            },
                            daily_usage: { $sum: '$usage_quantity' },
                            daily_cost: { $sum: '$cost' }
                        }
                    },
                    { $sort: { '_id.day': -1 } }
                ])
            ]);

            const budgetUtilization = costData.map(service => {
                const serviceBudget = budgets.find(b => b.service_name === service._id);
                return {
                    service_name: service._id,
                    total_cost: service.total_cost,
                    budget_amount: serviceBudget?.budget_amount || 0,
                    utilization_percentage: serviceBudget 
                        ? (service.total_cost / serviceBudget.budget_amount) * 100 
                        : 0
                };
            });

            res.json({
                project,
                current_month_stats: {
                    total_cost: costData.reduce((acc, curr) => acc + curr.total_cost, 0),
                    active_budgets: budgets.length,
                    services_count: costData.length
                },
                budget_utilization: budgetUtilization,
                usage_trends: apiUsage,
                cost_breakdown: costData
            });
        } catch (error) {
            logger.error('Get Project Details Error:', error);
            res.status(500).json({ error: 'Failed to fetch project details' });
        }
    }

    async getProjectAnalytics(req, res) {
        try {
            const { company_id } = req.user;
            const { project_id } = req.params;
            const { start_date, end_date } = req.query;

            const startDate = start_date ? new Date(start_date) : new Date(new Date().setDate(1));
            const endDate = end_date ? new Date(end_date) : new Date();

            const analytics = await CostData.aggregate([
                {
                    $match: {
                        company: company_id,
                        project: project_id,
                        date: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: {
                            service: '$service_name',
                            day: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
                        },
                        cost: { $sum: '$cost' },
                        usage: { $sum: '$usage_quantity' }
                    }
                },
                { $sort: { '_id.day': 1 } }
            ]);

            const processedData = this.processAnalyticsData(analytics);
            res.json(processedData);
        } catch (error) {
            logger.error('Get Project Analytics Error:', error);
            res.status(500).json({ error: 'Failed to fetch project analytics' });
        }
    }

    processAnalyticsData(analytics) {
        const serviceData = {};
        const dates = new Set();

        analytics.forEach(item => {
            const { service, day } = item._id;
            dates.add(day);

            if (!serviceData[service]) {
                serviceData[service] = {
                    total_cost: 0,
                    total_usage: 0,
                    daily_data: {}
                };
            }

            serviceData[service].total_cost += item.cost;
            serviceData[service].total_usage += item.usage;
            serviceData[service].daily_data[day] = {
                cost: item.cost,
                usage: item.usage
            };
        });

        return {
            services: serviceData,
            timeline: Array.from(dates).sort()
        };
    }

    async updateProject(req, res) {
        try {
            const { company_id } = req.user;
            const { project_id } = req.params;
            const updates = req.body;

            const project = await Project.findOneAndUpdate(
                { _id: project_id, company: company_id },
                updates,
                { new: true, runValidators: true }
            );

            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }

            res.json(project);
        } catch (error) {
            logger.error('Update Project Error:', error);
            res.status(500).json({ error: 'Failed to update project' });
        }
    }

    async archiveProject(req, res) {
        try {
            const { company_id } = req.user;
            const { project_id } = req.params;

            const project = await Project.findOneAndUpdate(
                { _id: project_id, company: company_id },
                { status: 'archived' },
                { new: true }
            );

            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }

            res.json({ message: 'Project archived successfully' });
        } catch (error) {
            logger.error('Archive Project Error:', error);
            res.status(500).json({ error: 'Failed to archive project' });
        }
    }
}

module.exports = new ProjectController();
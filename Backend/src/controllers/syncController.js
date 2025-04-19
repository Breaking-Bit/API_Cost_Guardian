const CostData = require("../models/CostData")
const Project = require("../models/Project")
const Company = require("../models/Company")
const logger = require("../utils/logger")

class SyncController {
  constructor() {
    // Bind the methods to preserve 'this' context
    this.syncData = this.syncData.bind(this)
    this.simulateAPIUsageData = this.simulateAPIUsageData.bind(this)
    this.calculateCost = this.calculateCost.bind(this)
    this.getLastSyncStatus = this.getLastSyncStatus.bind(this)
  }

  async syncData(req, res) {
    try {
      const { company_id } = req.user
      const project_id = req.headers["x-project-id"]

      // Validate project access
      const project = await Project.findOne({
        _id: project_id,
        company: company_id,
        status: "active",
      })

      if (!project) {
        return res.status(404).json({ error: "Project not found" })
      }

      // Get last sync timestamp
      const lastSync = await CostData.findOne({
        company: company_id,
        project: project_id,
      }).sort({ date: -1 })

      const startDate = lastSync ? lastSync.date : new Date(new Date().setDate(new Date().getDate() - 30))

      // Simulate fetching new cost data
      const controller = new SyncController()
      const newData = await controller.simulateAPIUsageData(company_id, project_id, startDate)

      // Bulk insert new data
      if (newData.length > 0) {
        await CostData.insertMany(newData)
      }

      res.json({
        message: "Data synced successfully",
        records_synced: newData.length,
        sync_period: {
          from: startDate,
          to: new Date(),
        },
      })
    } catch (error) {
      logger.error("Sync Data Error:", error)
      res.status(500).json({ error: "Failed to sync data" })
    }
  }

  calculateCost(service, usageQuantity) {
    const rates = {
      'GPT-4': 0.03,
      'DALL-E': 0.02,
      'Gemini': 0.01,
      'Claude': 0.025
    };
    
    return Number((usageQuantity * rates[service]).toFixed(2));
  }

  async simulateAPIUsageData(company_id, project_id, startDate) {
    const services = ["GPT-4", "DALL-E", "Gemini", "Claude"];
    const regions = ["us-east-1", "eu-west-1", "ap-south-1"];
    const newData = [];

    const currentDate = new Date();
    const date = new Date(startDate);

    while (date <= currentDate) {
      services.forEach((service) => {
        // Create realistic usage patterns
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isBusinessHour = date.getHours() >= 9 && date.getHours() <= 17;

        // Base usage varies by time and day
        let baseUsage = isWeekend ? 
          Math.floor(Math.random() * 300) + 1 : // Lower weekend usage
          Math.floor(Math.random() * 800) + 200; // Higher weekday usage

        if (isBusinessHour) {
          baseUsage *= 1.5; // Higher usage during business hours
        }

        const usageQuantity = Math.floor(baseUsage + (Math.random() * 200));
        const cost = this.calculateCost(service, usageQuantity);

        newData.push({
          company: company_id,
          project: project_id,
          service_name: service,
          cost,
          usage_quantity: usageQuantity,
          unit: "API_CALLS",
          region: regions[Math.floor(Math.random() * regions.length)],
          date: new Date(date)
        });
      });

      // Increment by 1 hour for more granular data
      date.setHours(date.getHours() + 1);
    }

    return newData;
  }
  async getLastSyncStatus(req, res) {
    try {
      const { company_id } = req.user
      const project_id = req.headers["x-project-id"]
  
      const lastSync = await CostData.findOne({
        company: company_id,
        project: project_id,
      }).sort({ date: -1 })
  
      res.json({
        last_sync: lastSync ? lastSync.date : null,
        status: lastSync ? "success" : "never_synced",
      })
    } catch (error) {
      logger.error("Get Last Sync Status Error:", error)
      res.status(500).json({ error: "Failed to fetch sync status" })
    }
  }
}



module.exports = new SyncController()

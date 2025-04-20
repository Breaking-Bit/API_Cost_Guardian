const express = require("express")
const router = express.Router()
const companyRoutes = require("./companyRoutes")
const projectRoutes = require("./projectRoutes")
const costDataRoutes = require("./costDataRoutes")
const budgetRoutes = require("./budgetRoutes")
const chatRoutes = require("./chatRoutes") // Add this line
const syncRoutes = require("./syncRoutes") // Add this line
const alertRoutes = require("./alertRoutes") // Add this line

router.use("/companies", companyRoutes)
router.use("/projects", projectRoutes)
router.use("/cost-data", costDataRoutes)
router.use("/budgets", budgetRoutes)
router.use("/chat", chatRoutes) // Add this line
router.use("/sync", syncRoutes) // Add this line
router.use("/alerts", alertRoutes) // Add this line

module.exports = router
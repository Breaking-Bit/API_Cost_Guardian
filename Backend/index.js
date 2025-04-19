require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const rateLimit = require("express-rate-limit")
const routes = require("./src/routes")
const { initializeFirebase } = require("./src/config/firebase")
const config = require("./src/config")
const logger = require("./src/utils/logger")

const app = express()

// Initialize Firebase Admin
initializeFirebase()

// Update CORS configuration
app.use(
  cors({
    origin: ["http://localhost:3000", "https://gemini.google.com"], // Fixed origin
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Project-ID"],
    exposedHeaders: ["Access-Control-Allow-Origin"],
  }),
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { error: "Too many requests, please try again later." },
})
app.use(limiter)

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() })
})

// API routes
app.use("/api", routes)

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Unhandled Error:", err)
  res.status(500).json({ error: "Internal server error" })
})

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info("Connected to MongoDB successfully")

    // Start the server
    const PORT = config.app.port
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`)
      logger.info(`Environment: ${config.app.env}`)
    })
  })
  .catch((error) => {
    logger.error("MongoDB connection error:", error)
    process.exit(1)
  })

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error)
  process.exit(1)
})

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  logger.error("Unhandled Rejection:", error)
  process.exit(1)
})

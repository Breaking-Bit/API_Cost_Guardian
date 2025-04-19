const express = require("express")
const router = express.Router()
const ChatController = require("../controllers/chatController")

const chatController = new ChatController()

// No authentication middleware for chat endpoint
router.post("/", (req, res) => chatController.handleChat(req, res))

module.exports = router
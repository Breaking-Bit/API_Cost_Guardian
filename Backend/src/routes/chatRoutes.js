const express = require('express');
const ChatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

const router = express.Router();
const chatController = new ChatController();

router.post('/chat/:project_id', auth, chatController.handleChat.bind(chatController));

module.exports = router;
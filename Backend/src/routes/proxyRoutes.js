const express = require('express');
const router = express.Router();
const ProxyController = require('../controllers/proxyController');
const auth = require('../middleware/auth');

// Gemini routes
router.post('/gemini', auth, ProxyController.proxyGeminiRequest.bind(ProxyController));
router.get('/gemini/usage', auth, ProxyController.getGeminiUsage.bind(ProxyController));

// OpenAI routes
router.post('/openai', auth, ProxyController.proxyOpenAIRequest.bind(ProxyController));
router.get('/openai/usage', auth, ProxyController.getOpenAIUsage.bind(ProxyController));

// Anthropic routes
router.post('/anthropic', auth, ProxyController.proxyAnthropicRequest.bind(ProxyController));
router.get('/anthropic/usage', auth, ProxyController.getAnthropicUsage.bind(ProxyController));

// Mistral routes
router.post('/mistral', auth, ProxyController.proxyMistralRequest.bind(ProxyController));
router.get('/mistral/usage', auth, ProxyController.getMistralUsage.bind(ProxyController));

// Cohere routes
router.post('/cohere', auth, ProxyController.proxyCoheretRequest.bind(ProxyController));
router.get('/cohere/usage', auth, ProxyController.getCoheretUsage.bind(ProxyController));

module.exports = router;
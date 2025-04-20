const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../utils/logger");
const CostData = require("../models/CostData");

class ChatController {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            logger.error("GEMINI_API_KEY is not set in environment variables");
            throw new Error("GEMINI_API_KEY is required");
        }
        
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ 
            model: "gemini-pro",
            config: {
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
            }
        });
    }

    async handleChat(req, res) {
        try {
            const { message } = req.body;
            const { project_id } = req.params;
            
            if (!message) {
                logger.warn("Empty message received");
                return res.status(400).json({ error: 'Message is required' });
            }

            logger.info(`Processing chat request: ${message.substring(0, 50)}...`);

            const chat = this.model.startChat({
                history: req.body.history || [],
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE",
                    },
                ],
            });

            const result = await chat.sendMessage(message);
            const response = await result.response;
            const text = response.text();

            // Record usage in CostData
            const tokens = this.estimateTokens(message + text);
            await new CostData({
                project: project_id,
                service_name: 'Gemini',
                cost: this.calculateCost(tokens),
                usage_quantity: tokens,
                unit: 'TOKENS',
                request_details: {
                    model: 'gemini-pro',
                    input_text: message.substring(0, 100),
                    status: 'success'
                }
            }).save();

            logger.info("Successfully generated AI response");
            return res.json({ 
                response: text,
                usage: {
                    tokens,
                    cost: this.calculateCost(tokens)
                }
            });
            
        } catch (error) {
            logger.error("Chat Error:", error);
            return res.status(500).json({ 
                error: 'Failed to process chat message',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    estimateTokens(text) {
        // Rough estimation: ~4 chars per token
        return Math.ceil(text.length / 4);
    }

    calculateCost(tokens) {
        // $0.01 per 1K tokens (simplified rate)
        return (tokens / 1000) * 0.01;
    }
}

module.exports = ChatController;
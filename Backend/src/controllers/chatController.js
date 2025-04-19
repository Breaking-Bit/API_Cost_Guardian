const { GoogleGenerativeAI } = require("@google/generative-ai")
const logger = require("../utils/logger")

class ChatController {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            logger.error("GEMINI_API_KEY is not set in environment variables")
            throw new Error("GEMINI_API_KEY is required")
        }
        
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" })
    }

    async handleChat(req, res) {
        try {
            const { message } = req.body
            
            if (!message) {
                logger.warn("Empty message received")
                return res.status(400).json({ error: 'Message is required' })
            }

            logger.info(`Processing chat request: ${message.substring(0, 50)}...`)

            const result = await this.model.generateContent(message)
            const response = await result.response
            const text = response.text()

            logger.info("Successfully generated AI response")
            return res.json({ response: text })
            
        } catch (error) {
            logger.error("Chat Error:", error)
            
            // Check for specific error types
            if (error.message.includes('API key')) {
                return res.status(500).json({ 
                    error: 'AI service configuration error'
                })
            }
            
            return res.status(500).json({ 
                error: 'Failed to process chat message',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        }
    }
}

module.exports = ChatController
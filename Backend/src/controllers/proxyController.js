const axios = require('axios');
const CostData = require('../models/CostData');
const logger = require('../utils/logger');

class ProxyController {
    constructor() {
        this.GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.OPENAI_BASE_URL = 'https://api.openai.com/v1';
        this.ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1';
        this.MISTRAL_BASE_URL = 'https://api.mistral.ai/v1';
        this.COHERE_BASE_URL = 'https://api.cohere.ai/v1';

        // Bind methods
        this.calculateGeminiCost = this.calculateGeminiCost.bind(this);
        this.calculateOpenAICost = this.calculateOpenAICost.bind(this);
        this.calculateAnthropicCost = this.calculateAnthropicCost.bind(this);
        this.calculateMistralCost = this.calculateMistralCost.bind(this);
        this.calculateCohereCost = this.calculateCohereCost.bind(this);
    }

    // Gemini methods remain unchanged
    async proxyGeminiRequest(req, res) {
        try {
            const { company_id } = req.user;
            const project_id = req.headers['x-project-id'];
            const apiKey = req.headers['x-gemini-key'];
            const model = req.query.model || 'gemini-pro';
            
            if (!apiKey) {
                return res.status(400).json({ error: 'Gemini API key is required' });
            }

            // Forward the request to Gemini
            const geminiResponse = await axios({
                method: req.method,
                url: `${this.GEMINI_BASE_URL}/${model}:generateContent`,
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                data: req.body
            });

            // Calculate tokens and cost
            const inputTokens = this.countTokens(req.body.contents);
            const outputTokens = this.countTokens(geminiResponse.data.candidates);
            const cost = this.calculateGeminiCost(inputTokens, outputTokens, model);

            // Record usage in CostData
            const costData = new CostData({
                company: company_id,
                project: project_id,
                service_name: 'Gemini',
                cost,
                usage_quantity: inputTokens + outputTokens,
                unit: 'TOKENS',
                request_details: {
                    input_tokens: inputTokens,
                    output_tokens: outputTokens,
                    model,
                    request_type: 'text',
                    status: 'success'
                }
            });

            await costData.save();

            // Return the Gemini response to the client
            res.json(geminiResponse.data);
        } catch (error) {
            logger.error('Gemini Proxy Error:', error);
            
            // Record failed request
            if (req.user) {
                const costData = new CostData({
                    company: req.user.company_id,
                    project: req.headers['x-project-id'],
                    service_name: 'Gemini',
                    cost: 0,
                    usage_quantity: 0,
                    unit: 'TOKENS',
                    request_details: {
                        model: req.query.model || 'gemini-pro',
                        request_type: 'text',
                        status: 'failed'
                    }
                });
                await costData.save();
            }

            res.status(500).json({ 
                error: 'Failed to process Gemini request',
                details: error.response?.data || error.message
            });
        }
    }

    calculateGeminiCost(inputTokens, outputTokens, model) {
        const rates = {
            'gemini-pro': {
                input: 0.00001,   // $0.01 per 1K input tokens
                output: 0.00002   // $0.02 per 1K output tokens
            },
            'gemini-pro-vision': {
                input: 0.00001,
                output: 0.00002
            }
        };

        const modelRates = rates[model] || rates['gemini-pro'];
        return (inputTokens * modelRates.input) + (outputTokens * modelRates.output);
    }

    // Simple token counting function (you might want to use a proper tokenizer)
    countTokens(content) {
        // This is a simplified version. In production, use a proper tokenizer
        if (!content) return 0;
        const text = JSON.stringify(content);
        return Math.ceil(text.length / 4); // Rough approximation
    }

    async proxyOpenAIRequest(req, res) {
        try {
            const { company_id } = req.user;
            const project_id = req.headers['x-project-id'];
            const apiKey = req.headers['x-openai-key'];
            const model = req.query.model || 'gpt-3.5-turbo';

            if (!apiKey) {
                return res.status(400).json({ error: 'OpenAI API key is required' });
            }

            const openaiResponse = await axios({
                method: req.method,
                url: `${this.OPENAI_BASE_URL}/chat/completions`,
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                data: req.body
            });

            const inputTokens = openaiResponse.data.usage.prompt_tokens;
            const outputTokens = openaiResponse.data.usage.completion_tokens;
            const cost = this.calculateOpenAICost(inputTokens, outputTokens, model);

            await new CostData({
                company: company_id,
                project: project_id,
                service_name: 'OpenAI',
                cost,
                usage_quantity: inputTokens + outputTokens,
                unit: 'TOKENS',
                request_details: {
                    input_tokens: inputTokens,
                    output_tokens: outputTokens,
                    model,
                    request_type: 'chat',
                    status: 'success'
                }
            }).save();

            res.json(openaiResponse.data);
        } catch (error) {
            this.handleProxyError(error, req, res, 'OpenAI');
        }
    }

    async proxyAnthropicRequest(req, res) {
        try {
            const { company_id } = req.user;
            const project_id = req.headers['x-project-id'];
            const apiKey = req.headers['x-anthropic-key'];
            const model = req.query.model || 'claude-2';

            if (!apiKey) {
                return res.status(400).json({ error: 'Anthropic API key is required' });
            }

            const anthropicResponse = await axios({
                method: req.method,
                url: `${this.ANTHROPIC_BASE_URL}/messages`,
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                },
                data: req.body
            });

            const inputTokens = this.countTokens(req.body.messages);
            const outputTokens = this.countTokens(anthropicResponse.data.content);
            const cost = this.calculateAnthropicCost(inputTokens, outputTokens, model);

            await new CostData({
                company: company_id,
                project: project_id,
                service_name: 'Anthropic',
                cost,
                usage_quantity: inputTokens + outputTokens,
                unit: 'TOKENS',
                request_details: {
                    input_tokens: inputTokens,
                    output_tokens: outputTokens,
                    model,
                    request_type: 'chat',
                    status: 'success'
                }
            }).save();

            res.json(anthropicResponse.data);
        } catch (error) {
            this.handleProxyError(error, req, res, 'Anthropic');
        }
    }

    async proxyMistralRequest(req, res) {
        try {
            const { company_id } = req.user;
            const project_id = req.headers['x-project-id'];
            const apiKey = req.headers['x-mistral-key'];
            const model = req.query.model || 'mistral-medium';

            if (!apiKey) {
                return res.status(400).json({ error: 'Mistral API key is required' });
            }

            const mistralResponse = await axios({
                method: req.method,
                url: `${this.MISTRAL_BASE_URL}/chat/completions`,
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                data: req.body
            });

            const inputTokens = mistralResponse.data.usage.prompt_tokens;
            const outputTokens = mistralResponse.data.usage.completion_tokens;
            const cost = this.calculateMistralCost(inputTokens, outputTokens, model);

            await new CostData({
                company: company_id,
                project: project_id,
                service_name: 'Mistral',
                cost,
                usage_quantity: inputTokens + outputTokens,
                unit: 'TOKENS',
                request_details: {
                    input_tokens: inputTokens,
                    output_tokens: outputTokens,
                    model,
                    request_type: 'chat',
                    status: 'success'
                }
            }).save();

            res.json(mistralResponse.data);
        } catch (error) {
            this.handleProxyError(error, req, res, 'Mistral');
        }
    }

    async proxyCoheretRequest(req, res) {
        try {
            const { company_id } = req.user;
            const project_id = req.headers['x-project-id'];
            const apiKey = req.headers['x-cohere-key'];
            const model = req.query.model || 'command';

            if (!apiKey) {
                return res.status(400).json({ error: 'Cohere API key is required' });
            }

            const cohereResponse = await axios({
                method: req.method,
                url: `${this.COHERE_BASE_URL}/generate`,
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                data: req.body
            });

            const inputTokens = cohereResponse.data.meta.billed_units.input_tokens;
            const outputTokens = cohereResponse.data.meta.billed_units.output_tokens;
            const cost = this.calculateCohereCost(inputTokens, outputTokens, model);

            await new CostData({
                company: company_id,
                project: project_id,
                service_name: 'Cohere',
                cost,
                usage_quantity: inputTokens + outputTokens,
                unit: 'TOKENS',
                request_details: {
                    input_tokens: inputTokens,
                    output_tokens: outputTokens,
                    model,
                    request_type: 'generate',
                    status: 'success'
                }
            }).save();

            res.json(cohereResponse.data);
        } catch (error) {
            this.handleProxyError(error, req, res, 'Cohere');
        }
    }

    // Cost calculation methods for each service
    calculateOpenAICost(inputTokens, outputTokens, model) {
        const rates = {
            'gpt-4': { input: 0.00003, output: 0.00006 },
            'gpt-3.5-turbo': { input: 0.000001, output: 0.000002 }
        };
        const modelRates = rates[model] || rates['gpt-3.5-turbo'];
        return (inputTokens * modelRates.input) + (outputTokens * modelRates.output);
    }

    calculateAnthropicCost(inputTokens, outputTokens, model) {
        const rates = {
            'claude-2': { input: 0.000011, output: 0.000032 },
            'claude-instant': { input: 0.000163, output: 0.000551 }
        };
        const modelRates = rates[model] || rates['claude-2'];
        return (inputTokens * modelRates.input) + (outputTokens * modelRates.output);
    }

    calculateMistralCost(inputTokens, outputTokens, model) {
        const rates = {
            'mistral-small': { input: 0.000002, output: 0.000006 },
            'mistral-medium': { input: 0.000007, output: 0.000021 },
            'mistral-large': { input: 0.000015, output: 0.000045 }
        };
        const modelRates = rates[model] || rates['mistral-medium'];
        return (inputTokens * modelRates.input) + (outputTokens * modelRates.output);
    }

    calculateCohereCost(inputTokens, outputTokens, model) {
        const rates = {
            'command': { input: 0.000015, output: 0.00002 },
            'command-light': { input: 0.000005, output: 0.000015 }
        };
        const modelRates = rates[model] || rates['command'];
        return (inputTokens * modelRates.input) + (outputTokens * modelRates.output);
    }

    // Usage methods
    async getGeminiUsage(req, res) {
        await this.getServiceUsage(req, res, 'Gemini');
    }

    async getOpenAIUsage(req, res) {
        await this.getServiceUsage(req, res, 'OpenAI');
    }

    async getAnthropicUsage(req, res) {
        await this.getServiceUsage(req, res, 'Anthropic');
    }

    async getMistralUsage(req, res) {
        await this.getServiceUsage(req, res, 'Mistral');
    }

    async getCoheretUsage(req, res) {
        await this.getServiceUsage(req, res, 'Cohere');
    }

    // Helper methods
    async getServiceUsage(req, res, serviceName) {
        try {
            const { company_id } = req.user;
            const project_id = req.headers['x-project-id'];
            
            const usage = await CostData.find({
                company: company_id,
                project: project_id,
                service_name: serviceName
            }).sort({ created_at: -1 }).limit(100);

            res.json(usage);
        } catch (error) {
            logger.error(`${serviceName} Usage Error:`, error);
            res.status(500).json({ error: `Failed to fetch ${serviceName} usage data` });
        }
    }

    async handleProxyError(error, req, res, serviceName) {
        logger.error(`${serviceName} Proxy Error:`, error);
        
        if (req.user) {
            await new CostData({
                company: req.user.company_id,
                project: req.headers['x-project-id'],
                service_name: serviceName,
                cost: 0,
                usage_quantity: 0,
                unit: 'TOKENS',
                request_details: {
                    model: req.query.model,
                    request_type: 'chat',
                    status: 'failed',
                    error: error.message
                }
            }).save();
        }

        res.status(500).json({
            error: `Failed to process ${serviceName} request`,
            details: error.response?.data || error.message
        });
    }
}

module.exports = new ProxyController();
export const API_SERVICES = {
  GEMINI: 'Gemini',
  OPENAI: 'OpenAI',
  ANTHROPIC: 'Anthropic',
  MISTRAL: 'Mistral',
  COHERE: 'Cohere'
} as const

export const SERVICE_ENDPOINTS = {
  [API_SERVICES.GEMINI]: '/api/proxy/gemini',
  [API_SERVICES.OPENAI]: '/api/proxy/openai',
  [API_SERVICES.ANTHROPIC]: '/api/proxy/anthropic',
  [API_SERVICES.MISTRAL]: '/api/proxy/mistral',
  [API_SERVICES.COHERE]: '/api/proxy/cohere'
} as const

export const SERVICE_DESCRIPTIONS = {
  [API_SERVICES.GEMINI]: 'Google\'s latest AI model with strong multimodal capabilities',
  [API_SERVICES.OPENAI]: 'Industry-leading GPT models for various AI tasks',
  [API_SERVICES.ANTHROPIC]: 'Claude models known for their reasoning capabilities',
  [API_SERVICES.MISTRAL]: 'Efficient open-source foundation models',
  [API_SERVICES.COHERE]: 'Specialized models for text generation and analysis'
} as const

export const SERVICE_PRICING = {
  [API_SERVICES.GEMINI]: {
    input: 0.00001,   // $0.01 per 1K input tokens
    output: 0.00002   // $0.02 per 1K output tokens
  },
  [API_SERVICES.OPENAI]: {
    input: 0.00001,   // $0.01 per 1K input tokens
    output: 0.00003   // $0.03 per 1K output tokens
  },
  [API_SERVICES.ANTHROPIC]: {
    input: 0.000011,  // $0.011 per 1K input tokens
    output: 0.000032  // $0.032 per 1K output tokens
  },
  [API_SERVICES.MISTRAL]: {
    input: 0.000007,  // $0.007 per 1K input tokens
    output: 0.000021  // $0.021 per 1K output tokens
  },
  [API_SERVICES.COHERE]: {
    input: 0.000015,  // $0.015 per 1K input tokens
    output: 0.00002   // $0.02 per 1K output tokens
  }
} as const

export const SERVICE_CONFIGS = {
  [API_SERVICES.GEMINI]: {
    requiresApiKey: true,
    defaultModel: 'gemini-pro',
    unit: 'TOKENS'
  },
  [API_SERVICES.GPT4]: {
    requiresApiKey: true,
    defaultModel: 'gpt-4',
    unit: 'TOKENS'
  },
  [API_SERVICES.DALLE]: {
    requiresApiKey: true,
    defaultModel: 'dall-e-3',
    unit: 'IMAGES'
  },
  [API_SERVICES.CLAUDE]: {
    requiresApiKey: true,
    defaultModel: 'claude-2',
    unit: 'TOKENS'
  }
} as const;
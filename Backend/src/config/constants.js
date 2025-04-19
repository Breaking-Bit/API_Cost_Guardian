const ALERT_TYPES = {
    BUDGET_THRESHOLD: 'budget_threshold',
    COST_SPIKE: 'cost_spike',
    SYSTEM: 'system'
};

const BUDGET_PERIODS = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly'
};

const PROJECT_STATUS = {
    ACTIVE: 'active',
    ARCHIVED: 'archived'
};


const API_SERVICES = {
    GEMINI: 'Gemini',
    // GPT4: 'GPT-4',
    // DALLE: 'DALL-E',
    // CLAUDE: 'Claude'
};

const SERVICE_UNITS = {
    GEMINI: 'TOKENS',
    // GPT4: 'TOKENS',
    // DALLE: 'IMAGES',
    // CLAUDE: 'TOKENS'
};

const DEFAULT_VALUES = {
    BUDGET_ALERT_THRESHOLD: 80, // percentage
    COST_SPIKE_MULTIPLIER: 2,
    SERVICE_RATES: {
        [API_SERVICES.GEMINI]: {
            'gemini-pro': {
                input: 0.00001,
                output: 0.00002
            },
            'gemini-pro-vision': {
                input: 0.00001,
                output: 0.00002
            }
        }
    }
};

module.exports = {
    API_SERVICES,
    SERVICE_UNITS,
    DEFAULT_VALUES
};

const ALERT_STATUS = {
    ACTIVE: 'active',
    RESOLVED: 'resolved'
};

const COMPANY_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive'
};


module.exports = {
    ALERT_TYPES,
    BUDGET_PERIODS,
    PROJECT_STATUS,
    ALERT_STATUS,
    COMPANY_STATUS,
    API_SERVICES,
    SERVICE_UNITS,
    DEFAULT_VALUES
};
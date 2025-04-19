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

const ALERT_STATUS = {
    ACTIVE: 'active',
    RESOLVED: 'resolved'
};

const COMPANY_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive'
};

const DEFAULT_VALUES = {
    COST_SPIKE_THRESHOLD: 2,
    BUDGET_ALERT_THRESHOLD: 80,
    PAGINATION_LIMIT: 50
};

module.exports = {
    ALERT_TYPES,
    BUDGET_PERIODS,
    PROJECT_STATUS,
    ALERT_STATUS,
    COMPANY_STATUS,
    DEFAULT_VALUES
};
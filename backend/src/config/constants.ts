export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  SECRET: process.env.JWT_SECRET || 'change_this_secret_in_production',
};

export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'change_this_encryption_key_32ch';

export const PASSWORD_CONFIG = {
  MIN_LENGTH: 12,
  SALT_ROUNDS: 12,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
};

export const MFA_CONFIG = {
  ISSUER: 'SATRIA Intelligence',
  WINDOW: 2, // Allow 2 time windows for TOTP verification
  BACKUP_CODES_COUNT: 10,
};

export const RATE_LIMIT_CONFIG = {
  WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW || '3600000', 10), // 1 hour
  MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
};

export const SESSION_CONFIG = {
  MAX_CONCURRENT_SESSIONS: 3,
  INACTIVITY_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours
};

export const AGGREGATION_CONFIG = {
  BASE_INTERVAL: parseInt(process.env.AGGREGATION_INTERVAL || '30', 10), // minutes
  MIN_INTERVAL: 20, // minutes
  MAX_INTERVAL: 45, // minutes
  LIGHT_LOAD_THRESHOLD: 100, // articles
  HEAVY_LOAD_THRESHOLD: 500, // articles
  PROCESSING_TIMEOUT_THRESHOLD: 10 * 60 * 1000, // 10 minutes
  BATCH_SIZE: 100,
};

export const DATA_RETENTION_DAYS = parseInt(process.env.DATA_RETENTION_DAYS || '90', 10);

export const RELEVANCE_CONFIG = {
  MIN_THRESHOLD: 30,
  CRITICAL_THRESHOLD: 90,
  HIGH_THRESHOLD: 70,
  MEDIUM_THRESHOLD: 50,
  DUPLICATE_SIMILARITY_THRESHOLD: 0.85,
};

export const DEFAULT_KEYWORDS = {
  'threat-keywords': [
    'terrorism', 'attack', 'bombing', 'hostage', 'kidnapping',
    'militant', 'extremist', 'insurgent', 'jihadist', 'threat'
  ],
  'military-keywords': [
    'military', 'defense', 'army', 'navy', 'air force',
    'weapons', 'missile', 'drone', 'submarine', 'fighter jet'
  ],
  'maritime-keywords': [
    'South China Sea', 'Spratly', 'Paracel', 'piracy',
    'illegal fishing', 'naval', 'maritime', 'fleet'
  ],
  'cyber-keywords': [
    'cyber attack', 'hack', 'breach', 'malware', 'ransomware',
    'APT', 'vulnerability', 'exploit', 'cybersecurity'
  ],
  'organization-keywords': [
    'ISIS', 'Al-Qaeda', 'Jemaah Islamiyah', 'Abu Sayyaf',
    'Taliban', 'Hezbollah', 'Hamas', 'Al-Shabaab'
  ],
  'country-keywords': [
    'Malaysia', 'Singapore', 'Indonesia', 'Thailand', 'Philippines',
    'Vietnam', 'China', 'North Korea', 'Myanmar', 'Brunei'
  ]
};

export const GEOGRAPHIC_REGIONS = [
  'Malaysia',
  'Southeast Asia',
  'South China Sea',
  'ASEAN',
  'Singapore',
  'Indonesia',
  'Thailand',
  'Philippines',
  'Vietnam',
  'Myanmar',
  'Cambodia',
  'Laos',
  'Brunei',
  'East Asia',
  'South Asia',
  'Middle East',
  'Central Asia',
  'Indo-Pacific',
  'Global'
];

export const INTELLIGENCE_CATEGORIES = [
  {
    name: 'Regional Security',
    slug: 'regional-security',
    description: 'ASEAN and regional developments',
    color: '#3b82f6'
  },
  {
    name: 'Terrorism & Extremism',
    slug: 'terrorism',
    description: 'Terrorist activities and threats',
    color: '#ef4444'
  },
  {
    name: 'Military & Defense',
    slug: 'military-defense',
    description: 'Military operations and defense news',
    color: '#059669'
  },
  {
    name: 'Cyber Security',
    slug: 'cyber-security',
    description: 'Cyber threats and attacks',
    color: '#8b5cf6'
  },
  {
    name: 'Political Instability',
    slug: 'political-instability',
    description: 'Political unrest and transitions',
    color: '#f97316'
  },
  {
    name: 'Maritime Security',
    slug: 'maritime-security',
    description: 'Piracy and maritime threats',
    color: '#0891b2'
  },
  {
    name: 'Critical Infrastructure',
    slug: 'critical-infrastructure',
    description: 'Infrastructure security',
    color: '#eab308'
  },
  {
    name: 'Weapons & Proliferation',
    slug: 'weapons-proliferation',
    description: 'WMD and arms trafficking',
    color: '#dc2626'
  }
];

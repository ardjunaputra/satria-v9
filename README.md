# SATRIA Intelligence News Aggregator

**Situational Awareness, Threats Responses, Intelligence and Analysis**

Real-time intelligence news aggregation system designed for the Malaysian Army Intelligence Service.

## 🎯 Overview

SATRIA automatically collects, filters, and classifies intelligence-relevant information from multiple sources including news APIs, social media, and OSINT platforms. The system refreshes every 30 minutes with adaptive timing and provides real-time updates via WebSocket.

### ⚠️ Critical Constraint: 24-Hour Article Limit

**All displayed articles are limited to a maximum age of 24 hours.** Articles older than 24 hours are automatically filtered out and will not appear in any view. This ensures the system only shows the most current, actionable intelligence.

## 🔐 Security Features

- **Multi-Factor Authentication (MFA)** - TOTP-based authentication required for all users
- **Role-Based Access Control (RBAC)** - 4 user tiers: Admin, Senior Analyst, Analyst, Viewer
- **Complete Audit Logging** - All actions tracked for compliance
- **Encrypted Storage** - Sensitive data encrypted at rest (AES-256)
- **JWT Authentication** - Secure session management with httpOnly cookies
- **Rate Limiting** - Protection against brute force attacks

## 📊 Intelligence Categories

The system automatically classifies content into 8 intelligence categories:

1. **Regional Security** - ASEAN and regional developments
2. **Terrorism & Extremism** - Terrorist activities and threats
3. **Military & Defense** - Military operations and defense news
4. **Cyber Security** - Cyber threats and attacks
5. **Political Instability** - Political unrest and transitions
6. **Maritime Security** - Piracy and maritime threats
7. **Critical Infrastructure** - Infrastructure security concerns
8. **Weapons & Proliferation** - WMD and arms trafficking

## 🗂️ Project Structure

```
satria-v9/
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── config/       # Database, Redis, constants
│   │   ├── models/       # Sequelize models (11 tables)
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Auth, RBAC, validation
│   │   ├── services/     # Business logic
│   │   │   ├── aggregation/  # Data fetching services
│   │   │   └── processing/   # Classification, scoring
│   │   ├── routes/       # API routes
│   │   ├── websocket/    # Real-time updates
│   │   ├── jobs/         # Background jobs
│   │   ├── utils/        # Utilities
│   │   └── server.ts     # Entry point
│   ├── seeds/            # Database seed data
│   └── Dockerfile
├── frontend/             # React/TypeScript application
├── shared/               # Shared TypeScript types
├── docker-compose.yml    # Development environment
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (recommended)
- PostgreSQL 14+ (if not using Docker)
- Redis 7+ (if not using Docker)

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone the repository
cd satria-v9

# 2. Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit backend/.env with your API keys

# 3. Start all services
docker-compose up -d

# 4. Check logs
docker-compose logs -f backend

# 5. Initialize database (first time only)
docker-compose exec postgres psql -U satria_user -d satria_db -f /docker-entrypoint-initdb.d/initial.sql
```

The system will be available at:
- Frontend UI: http://localhost:3000
- Backend API: http://localhost:5000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Option 2: Manual Setup

```bash
# 1. Install PostgreSQL and Redis
brew install postgresql@14 redis  # macOS
# or
sudo apt install postgresql-14 redis  # Ubuntu

# 2. Create database
createdb satria_db

# 3. Install backend dependencies
cd backend
npm install

# 4. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 5. Run database seeds
psql satria_db < seeds/initial.sql

# 6. Start Redis
redis-server

# 7. Start backend in development mode
npm run dev
```

## 🔑 Environment Variables

### Required API Keys

You need to obtain API keys for the following services:

1. **NewsAPI** - https://newsapi.org/register
   - Free tier: 100 requests/day
   - Required for news aggregation

2. **GNews** - https://gnews.io/register
   - Free tier: 100 requests/day
   - Backup news source

3. **Twitter/X API** (Optional)
   - Requires: Basic tier ($100/month) or Free tier
   - For social media monitoring

4. **Telegram Bot Token** (Optional)
   - Create via @BotFather on Telegram
   - For public channel monitoring

5. **Reddit API** (Optional)
   - Create app at https://www.reddit.com/prefs/apps
   - For subreddit monitoring

6. **AlienVault OTX** (Optional)
   - Free at https://otx.alienvault.com
   - For threat intelligence

7. **VirusTotal** (Optional)
   - Free tier: 500 requests/day
   - For threat analysis

Add these keys to `backend/.env`:

```env
NEWSAPI_KEY=your_key_here
GNEWS_KEY=your_key_here
TWITTER_BEARER_TOKEN=your_token_here
# ... see backend/.env.example for full list
```

## 👥 Default Admin Credentials

**⚠️ IMPORTANT: Change immediately after first login**

```
Email: admin@satria.army.mil.my
Password: Admin@123456
```

## 📡 API Endpoints

### Authentication

- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/verify-mfa` - Verify MFA code
- `POST /api/auth/setup-mfa` - Setup MFA for user
- `POST /api/auth/confirm-mfa` - Confirm MFA setup
- `POST /api/auth/logout` - Logout current session
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/register` - Create new user (Admin only)
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Articles

- `GET /api/articles` - Get paginated articles with filters
  - Query params: `page`, `limit`, `categories`, `regions`, `sources`, `min_relevance`, `priority`, `search`, `sort`, `order`
  - **Note**: All articles are automatically limited to 24 hours old
- `GET /api/articles/:id` - Get single article details
- `POST /api/articles/:id/flag` - Flag article for review
- `DELETE /api/articles/:id/flag` - Remove flag from article

## 🎨 User Interface Features

- **Card Grid Dashboard** - Responsive 3-column layout with real-time updates
- **Real-time Notifications** - WebSocket-powered toast, banner, and sound alerts
- **Advanced Filtering** - Multi-select categories, regions, sources, priority, and time range
- **Saved Searches** - Personal search configurations with quick access
- **Alert Rules** - Custom notification triggers with criteria matching
- **Article Management** - Read tracking, flagging, and detail modal views
- **Multi-Factor Authentication** - TOTP-based 2FA with QR code setup
- **Admin Panel** - System monitoring, user management, and source configuration
- **Settings** - Profile management, password change, and notification preferences

## 🔄 Data Aggregation

### Adaptive Refresh Cycle

The system runs an automatic aggregation cycle every 30 minutes (configurable). The timing adapts based on system load:

- **Light load** (< 100 articles): Next cycle in 20 minutes
- **Normal load** (100-500 articles): Next cycle in 30 minutes
- **Heavy load** (> 500 articles): Next cycle in 45 minutes

### Data Sources

1. **News APIs** - NewsAPI, GNews
2. **RSS Feeds** - Reuters, BBC, Al Jazeera, custom feeds
3. **Social Media** - Twitter/X, Telegram, Reddit
4. **OSINT Platforms** - AlienVault OTX, VirusTotal

## 🛡️ Role-Based Permissions

| Action | Admin | Senior Analyst | Analyst | Viewer |
|--------|-------|----------------|---------|--------|
| View articles | ✓ | ✓ | ✓ | ✓ |
| Create saved searches | ✓ | ✓ | ✓ (personal) | ✗ |
| Manage keywords | ✓ | ✓ | ✗ | ✗ |
| Generate reports | ✓ | ✓ | ✓ (basic) | ✗ |
| Export data | ✓ | ✓ | ✗ | ✗ |
| Flag articles | ✓ | ✓ | ✓ | ✗ |
| Share intelligence | ✓ | ✓ | ✗ | ✗ |
| User management | ✓ | ✗ | ✗ | ✗ |
| System configuration | ✓ | ✗ | ✗ | ✗ |

## 📚 Database Schema

The system uses PostgreSQL with 11 tables:

1. **users** - System users with roles and MFA
2. **articles** - Collected intelligence articles
3. **categories** - 8 intelligence categories
4. **article_categories** - Junction table
5. **keywords** - Category keywords (default + user-defined)
6. **sources** - Data source configurations
7. **saved_searches** - User search preferences
8. **alert_rules** - Notification configurations
9. **audit_logs** - Complete action history
10. **sessions** - Active user sessions
11. **system_status** - System state tracking

## 🔧 Development

### Backend

```bash
cd backend
npm install

# Run in development mode (with hot reload)
npm run dev

# Run TypeScript type checking
npm run typecheck

# Build for production
npm run build

# Lint code
npm run lint
```

### Frontend

```bash
cd frontend
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:5000/health
```

### Logs

Logs are stored in `backend/logs/`:
- `combined.log` - All logs
- `error.log` - Error logs only
- `exceptions.log` - Uncaught exceptions
- `rejections.log` - Unhandled promise rejections

### Audit Logs

All user actions are logged to the `audit_logs` table:
- Login attempts
- Article views
- Data exports
- Configuration changes
- Security events

## 🚨 Important Notes

1. **Article Age Limit**: The system ONLY displays articles up to 24 hours old. This is enforced at the database query level and cannot be bypassed.

2. **First Login**: Default admin password must be changed immediately after first login.

3. **MFA Requirement**: All users must set up multi-factor authentication for security compliance.

4. **API Rate Limits**: Be aware of free tier limitations for external APIs (NewsAPI: 100 req/day, GNews: 100 req/day, etc.).

5. **Data Retention**: Articles older than 90 days are automatically archived/deleted (configurable).

6. **Production Deployment**:
   - Use HTTPS only
   - Set strong JWT secrets
   - Configure firewall rules
   - Enable all security headers
   - Use production database credentials

## 🛠️ Troubleshooting

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker-compose ps postgres
# or
pg_isready

# Check connection string in .env
DATABASE_URL=postgresql://satria_user:satria_password@localhost:5432/satria_db
```

### Redis Connection Failed

```bash
# Check Redis is running
docker-compose ps redis
# or
redis-cli ping

# Should return: PONG
```

### No Articles Appearing

1. Check aggregation job is running
2. Verify API keys are configured correctly
3. Check source health: `GET /api/admin/system-status`
4. Remember: Only articles from last 24 hours will appear

## 📞 Support

For issues or questions:
1. Check application logs in `backend/logs/`
2. Review audit logs in database
3. Contact system administrator

## 📄 License

UNLICENSED - Malaysian Army Intelligence Service Internal Use Only

---

**Version**: 1.0.0
**Last Updated**: 2025
**Maintained By**: Malaysian Army Intelligence Service

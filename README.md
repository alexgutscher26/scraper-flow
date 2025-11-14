# Scraper Flow

Scrape Flow is a comprehensive web scraping and automation platform that allows users to create, schedule, and manage sophisticated web scraping workflows with an intuitive visual interface. This application provides a powerful yet user-friendly way to extract data from websites, process it with AI, perform complex data transformations, and deliver results through multiple channels, including webhooks and email.

## Table of Contents

- [Features](#features)
- [Task Types](#task-types)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Workflow System](#workflow-system)
- [Scheduling & Automation](#scheduling--automation)
- [Credit System & Billing](#credit-system--billing)
- [Security & Credentials](#security--credentials)
- [Analytics & Monitoring](#analytics--monitoring)
- [Environment Variables](#environment-variables)
- [Form Automation](#form-automation)
- [Screenshots](#screenshots)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Features

### Core Capabilities

- **Visual Workflow Builder**: Drag-and-drop interface for creating complex scraping workflows
- **22 Task Types**: Comprehensive set of tasks across 7 categories for all automation needs
- **AI-Powered Extraction**: Intelligent data extraction using AI models
- **Real-time Execution**: Live workflow execution with detailed logging and monitoring
- **Advanced Scheduling**: Hybrid cron system supporting both simple and complex schedules
- **Credit Management**: Transparent usage-based billing with Stripe integration
- **Secure Credential Storage**: Encrypted storage for API keys and authentication data
- **Multi-format Output**: JSON, CSV, and custom data transformation support

### Advanced Features

- **Conditional Logic**: Dynamic workflow paths based on data conditions
- **Loop Processing**: Iterate over data sets with configurable loop controls
- **Email Automation**: Send rich HTML/text emails with attachments
- **File Downloads**: Automated file downloading and processing
- **Screenshot Capture**: Full-page and viewport screenshots with quality controls
- **Table Extraction**: Structured data extraction from HTML tables
- **Data Transformation**: Built-in data processing and formatting tools

### Enterprise Features

- **Scalable Architecture**: Built for high-volume data processing
- **Analytics Dashboard**: Comprehensive execution statistics and credit usage tracking
- **User Management**: Multi-user support with Clerk authentication
- **Rate Limiting**: Built-in protection against abuse
- **Webhook Integration**: Real-time data delivery to external systems
- **Error Handling**: Robust error recovery and retry mechanisms

## Task Types

### Browser Automation (5 Tasks)

- **Launch Browser** (5 credits): Initialize browser and navigate to websites
- **Navigate URL** (2 credits): Navigate to specific URLs within workflows
- **Page to HTML** (2 credits): Extract full HTML content from web pages
- **Wait for Element** (1 credit): Wait for specific elements to appear/disappear
- **Take Screenshot** (3 credits): Capture full-page or viewport screenshots

### Element Interaction (4 Tasks)

- **Click Element** (3 credits): Interact with clickable elements on pages
- **Fill Input** (1 credit): Fill form inputs with dynamic data
- **Scroll to Element** (1 credit): Scroll to specific elements on pages
- **Wait Delay** (1 credit): Add controlled delays in workflow execution

### Data Extraction (3 Tasks)

- **Extract Text from Element** (2 credits): Extract text content using CSS selectors
- **Extract Table Data** (3 credits): Extract structured data from HTML tables
- **Extract Data with AI** (4 credits): AI-powered intelligent data extraction

### Data Processing (4 Tasks)

- **Read Property from JSON** (1 credit): Extract specific properties from JSON data
- **Add Property to JSON** (1 credit): Add new properties to JSON objects
- **Data Transform** (2 credits): Advanced data transformation and formatting
- **Conditional Logic** (1 credit): Create dynamic workflow paths

### Control Flow (1 Task)

- **Loop** (2 credits): Iterate over data collections with customizable controls

### Communication (2 Tasks)

- **Send Email** (3 credits): Send HTML/text emails with attachment support
- **Deliver via Webhook** (1 credit): Send data to external APIs and services

### Storage & File Operations (1 Task)

- **Download File** (3 credits): Download and process files from URLs

### AI & Advanced (1 Task)

- **Extract Data with AI** (4 credits): Leverage AI for complex data extraction scenarios

## Technology Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **UI Components**: Shadcn UI (built on Radix UI)
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form with Zod validation
- **Data Visualization**: Recharts
- **Flow Editor**: XYFlow (React Flow)

### Backend

- **API**: Next.js Server Actions and API Routes
- **Database ORM**: Prisma
- **Authentication**: Clerk
- **Payments**: Stripe
- **Scheduling**: Custom cron scheduler with hybrid approach
- **Web Scraping**: Puppeteer/Chromium
- **AI Integration**: OpenAI
- **Email Service**: Resend

### Infrastructure

- **Hosting**: Vercel
- **Cron Jobs**: Vercel Cron + Browser-based hybrid system
- **File Storage**: Built-in file download and processing
- **Encryption**: AES-256-CBC for credential storage

## Live Demo

Experience Scrape Flow in action at our [Live Demo](https://scrape-flow-demo.vercel.app)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (for application data storage)
- Clerk account (for authentication)
- Stripe account (for payments)
- OpenAI API key (for AI features)
- Resend API key (for email functionality)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/scrape-flow.git
cd scrape-flow
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory and add the necessary environment variables (see [Environment Variables](#environment-variables) section)

4. Run database migrations:

```bash
npx prisma migrate dev
```

5. Start the development server:

```bash
npm run dev
```

## Architecture

### Workflow Execution Engine

The application features a sophisticated workflow execution engine that handles:

- **Task Registry**: Dynamic loading and validation of all task types
- **Execution Context**: Isolated execution environments for each workflow run
- **Credit Tracking**: Real-time credit consumption monitoring
- **Error Recovery**: Automatic retry mechanisms and graceful error handling
- **Progress Tracking**: Live execution progress updates

### Data Flow

1. **Workflow Definition**: Users create workflows using the visual editor
2. **Validation**: Workflows are validated for completeness and credit requirements
3. **Execution**: Tasks are executed sequentially with data passing between them
4. **Monitoring**: Real-time execution monitoring with detailed logging
5. **Results**: Data is delivered through configured output channels

## Workflow System

### Visual Workflow Editor

- **Drag-and-Drop Interface**: Intuitive task placement and connection
- **Real-time Validation**: Immediate feedback on workflow completeness
- **Task Configuration**: Detailed parameter configuration for each task
- **Preview Mode**: Test workflows without consuming credits
- **Export/Import**: Save and share workflow definitions

### Execution Engine

- **Sequential Processing**: Tasks execute in defined order
- **Data Persistence**: Workflow state maintained throughout execution
- **Credit Management**: Pre-execution credit validation and real-time tracking
- **Error Handling**: Graceful failure recovery with detailed error messages
- **Execution History**: Complete audit trail of all workflow runs

### Execution Logs

- Fields: `id`, `timestamp`, `logLevel`, `message`, `executionPhaseId`, `phaseId`, `taskType`, `metadata`
- Metadata: JSON object including `scope` and contextual attributes
- Example:
  - `{"scope":"phase","nodeId":"abc123","phaseNumber":1}`

## Scheduling & Automation

### Hybrid Scheduling System

To overcome platform limitations, Scrape Flow implements a unique hybrid scheduling approach:

#### Vercel Cron Integration

- Daily cron job configured in `vercel.json`
- Serves as a backup execution trigger
- Ensures workflows are checked at least once daily

#### Browser-Based Local Cron

- Client-side component running in user browsers
- Polls `/api/workflows/cron` endpoint at configurable intervals
- Works in both development and production environments
- Configurable polling frequency (default: 60 seconds)

### Schedule Types

#### Simple Intervals

- **Seconds**: `30s` (every 30 seconds)
- **Minutes**: `5m` (every 5 minutes)
- **Hours**: `2h` (every 2 hours)
- **Days**: `1d` (daily)

#### Cron Expressions

- **Standard Cron**: `0 9 * * 1-5` (weekdays at 9am)
- **Complex Patterns**: `*/15 * * * *` (every 15 minutes)
- **Custom Schedules**: Full cron expression support

### Resilience Features

- **Exponential Backoff**: Automatic retry with increasing delays
- **Cache Prevention**: Timestamp-based cache busting
- **Error Recovery**: Continues operation during temporary failures
- **Resource Optimization**: Minimal API calls when browser is inactive

## Credit System & Billing

### Credit-Based Usage

- **Transparent Pricing**: Each task type has a defined credit cost
- **Pre-execution Validation**: Workflows validate credit requirements before running
- **Real-time Tracking**: Live credit consumption monitoring
- **Usage Analytics**: Detailed breakdown of credit usage by task type

### Billing Integration

- **Stripe Integration**: Secure payment processing
- **Flexible Plans**: Multiple credit packages available
- **Auto-refill**: Optional automatic credit top-up
- **Transaction History**: Complete billing history and receipts
- **Usage Forecasting**: Predict credit needs based on workflow schedules

### Credit Costs by Task Type

- **High Cost (5 credits)**: Launch Browser
- **Medium Cost (3-4 credits)**: AI Extraction, Screenshots, File Downloads, Email Sending
- **Standard Cost (2 credits)**: Data extraction, Navigation
- **Low Cost (1 credit)**: Simple operations, waits, property manipulation

## Security & Credentials

### Authentication & Authorization

- **Clerk Integration**: Secure user authentication and session management
- **Protected Routes**: Middleware-based route protection
- **API Security**: Secure API endpoints with proper authentication
- **User Isolation**: Complete data separation between users

### Credential Management

- **AES-256-CBC Encryption**: Military-grade encryption for stored credentials
- **Secure Storage**: Database-encrypted credential storage
- **Access Control**: User-specific credential access
- **Audit Trail**: Complete history of credential usage

### Security Best Practices

- **Parameterized Queries**: SQL injection prevention via Prisma
- **Environment Variables**: Secure secret management
- **HTTPS Enforcement**: Secure communication channels
- **Rate Limiting**: Built-in protection against abuse

## Analytics & Monitoring

### Execution Analytics

- **Success/Failure Rates**: Comprehensive execution statistics
- **Performance Metrics**: Execution time and resource usage tracking
- **Credit Consumption**: Detailed credit usage analytics
- **Trend Analysis**: Historical data and usage patterns

### Real-time Monitoring

- **Live Execution Tracking**: Real-time workflow execution monitoring
- **Progress Indicators**: Visual progress tracking for running workflows
- **Error Reporting**: Immediate error notifications and detailed logs
- **Performance Alerts**: Automatic alerts for unusual activity

### Dashboard Features

- **Usage Overview**: High-level statistics and trends
- **Workflow Performance**: Individual workflow success rates
- **Credit Forecasting**: Predictive analytics for credit usage
- **Export Capabilities**: Data export for external analysis

## Environment Variables

### Required Variables

```env
DATABASE_URL=postgresql://username:password@host:port/database
API_SECRET=your-secure-api-secret-for-cron-authentication
ENCRYPTION_SECRET=32-character-hex-key-for-credential-encryption
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-clerk-public-key
CLERK_SECRET_KEY=sk_test_your-clerk-secret-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret
OPENAI_API_KEY=sk-your-openai-api-key
RESEND_API_KEY=re_your-resend-api-key
PUPPETEER_EXECUTABLE_PATH=/absolute/path/to/chrome-or-chromium
```

### Validation

- Runtime validation is enforced using a centralized Zod schema in `lib/env.ts`.
- Validation runs on application startup and before handling API requests.
- Endpoints fail fast with `500` and a clear message when variables are missing/invalid.
- Validated keys: `API_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ENCRYPTION_SECRET`, `NEXT_PUBLIC_APP_URL`.

### Optional Variables

```env
NEXT_PUBLIC_ENABLE_LOCAL_CRON=true
NEXT_PUBLIC_LOCAL_CRON_FREQUENCY=60000
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Stealth Mode & Anti-bot Evasion

```env
# Core toggles
STEALTH_MODE_ENABLED=true
STEALTH_RANDOM_DELAYS_ENABLED=true
STEALTH_MOUSE_MOVEMENT_ENABLED=false
STEALTH_FINGERPRINT_SPOOFING_ENABLED=true
STEALTH_UA_ROTATION_ENABLED=true
STEALTH_COOKIE_MANAGEMENT_ENABLED=true

# Delay parameters
STEALTH_DELAY_MIN_MS=50
STEALTH_DELAY_MAX_MS=250
STEALTH_DELAY_JITTER_PCT=0.2

# Mouse movement parameters
STEALTH_MOUSE_POINTS=6
STEALTH_MOUSE_JITTER_PX=3
STEALTH_MOUSE_MIN_SPEED=300
STEALTH_MOUSE_MAX_SPEED=800

# Fingerprint spoofing pools/ranges
STEALTH_LANGUAGES_POOL=en-US,en;q=0.9,fr-FR,fr;q=0.8
STEALTH_PLATFORM_POOL=Win32,MacIntel,Linux x86_64
STEALTH_DEVICE_MEMORY_MIN=4
STEALTH_DEVICE_MEMORY_MAX=16
STEALTH_HW_CONCURRENCY_MIN=4
STEALTH_HW_CONCURRENCY_MAX=16
STEALTH_WEBGL_SPOOFING=true

# User-Agent overrides
STEALTH_UA_OVERRIDE=
STEALTH_UA_ROTATE_STRATEGY=perNavigation

# Cookie settings
STEALTH_COOKIE_CLEAR_BEFORE=false
STEALTH_COOKIE_PERSIST=true
STEALTH_COOKIE_SET_JSON=[{"name":"session","value":"abc","domain":"example.com"}]
```

#### Usage Example

- Enable stealth globally and override UA for the launch step:

```env
STEALTH_MODE_ENABLED=true
STEALTH_UA_OVERRIDE=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36
```

- Keep defaults for politeness and allow stealth to add small human-like delays and fingerprint spoofing without modifying workflow tasks.

#### Notes

- Stealth integrates with existing politeness settings (user-agent rotation, headers, accept-language). When `STEALTH_UA_OVERRIDE` is set, it supersedes the UA applied by politeness for the Launch step only.
- Metrics are logged during the Launch step indicating evasion attempts, failures, and detections.

### Configuration Notes

- **ENCRYPTION_SECRET**: Must be exactly 32 characters (64 hex digits)
- **API_SECRET**: Used for secure communication between cron endpoints
- **Local Cron**: Enable for development or enhanced scheduling reliability

### Chrome Executable Detection

- The application locates the browser executable in this order:
  - `PUPPETEER_EXECUTABLE_PATH` if set and points to a valid file
  - OS-specific auto-detection paths
    - Windows: `C:\Program Files\Google\Chrome\Application\chrome.exe`, `C:\Program Files (x86)\...`, `%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe`
    - macOS: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, `/Applications/Chromium.app/Contents/MacOS/Chromium`
    - Linux: `/usr/bin/google-chrome`, `/usr/bin/google-chrome-stable`, `/usr/bin/chromium-browser`, `/usr/bin/chromium`, `/snap/bin/chromium`
- Troubleshooting:
  - Ensure Chrome/Chromium is installed and accessible on your system
  - Set `PUPPETEER_EXECUTABLE_PATH` to the exact executable if auto-detection fails
  - Verify your CI/CD environment includes the executable or uses a headless Chromium distribution

## Screenshots

### Login & Signup page

![SignIn](https://github.com/user-attachments/assets/a9d2e420-fc16-4756-9f29-23f24a5dcce6)

### Home Page

![HomePage-1](https://github.com/user-attachments/assets/3c769bcb-d283-46a7-ba44-1b1d1b53a5c8)

### Home Page With Chart

![HomePage-2](https://github.com/user-attachments/assets/f4806685-eefe-4ab6-a67c-5a99691ca724)

### Workflow Page

![WorkFlow](https://github.com/user-attachments/assets/dbc7c21c-613e-4c16-8261-8db3c420aaea)

### Workflow Page With Action

![WorkFlowAction](https://github.com/user-attachments/assets/7ffef8ec-b8be-4869-a950-6900b809410d)

### Workflow Creation

![WorkFlowCreationForm](https://github.com/user-attachments/assets/d8606910-f684-4241-b39c-c65a0daf1780)

### Workflow Scheduler Configuration

![WorkFlowCronJob](https://github.com/user-attachments/assets/d1ed026a-6ab3-46ff-8ff9-b69c85583c0f)

### Workflow Editor

![WorkFlowCreation-1](https://github.com/user-attachments/assets/e08c0d60-aa45-4d3d-9b28-d6a629128fa2)

### Workflow Editor Validation

![WorkFlowCreation-2](https://github.com/user-attachments/assets/466dff29-5396-4161-87aa-5d613f778d82)

### Execution Monitor

![WorkFlowSucess](https://github.com/user-attachments/assets/b206a159-37c7-4b48-98d7-9e324204f1eb)

### All Workflow

![AllWorkFlow](https://github.com/user-attachments/assets/d97f75bb-d4cf-48a9-a235-ee7d706a90ba)

### Credential Page

![image](https://github.com/user-attachments/assets/31870f1d-de1b-4d99-a3cf-508574b43773)

### Credential creation form

![image](https://github.com/user-attachments/assets/51d6fb68-4ba8-48ad-b7f4-ca168b5b405e)

### Billing Page

![Billing-1](https://github.com/user-attachments/assets/91b206ec-95f2-42b7-819a-1980ad55a920)

### Billing Chart

![Billing-2](https://github.com/user-attachments/assets/4dd52d31-efd7-4228-a085-6b53827d9bdf)

### Transaction History

![Billing-3](https://github.com/user-attachments/assets/e752b5b3-84de-46c0-892c-53e1465d2d0e)

### Payment Invoice

![image](https://github.com/user-attachments/assets/d879a925-a36e-48b2-8c67-ed7e53d041d7)

## Deployment

### Vercel Deployment (Recommended)

1. **Repository Setup**: Connect your GitHub repository to Vercel
2. **Environment Configuration**: Add all required environment variables in Vercel dashboard
3. **Database Setup**: Configure PostgreSQL database for application data (Vercel Postgres recommended)
4. **Deployment**: Deploy the application through Vercel interface
5. **Cron Configuration**: Verify `vercel.json` cron configuration is active

### Manual Deployment

1. **Build**: `npm run build`
2. **Database**: Run migrations in production environment
3. **Environment**: Ensure all environment variables are properly set
4. **Start**: `npm start` or use process manager like PM2

### Post-Deployment Checklist

- [ ] Verify application database connections
- [ ] Test authentication flow
- [ ] Confirm Stripe webhook endpoints
- [ ] Validate cron job execution
- [ ] Test workflow creation and execution
- [ ] Verify email functionality

## Contributing

We welcome contributions to Scrape Flow! Please follow these guidelines:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes with appropriate tests
4. Ensure code follows existing style guidelines
5. Submit a pull request with detailed description

### Adding New Task Types

1. Create task definition in `lib/workflow/task/`
2. Add task to registry in `lib/workflow/task/registry.tsx`
3. Implement executor in `lib/workflow/executor/`
4. Add proper TypeScript types
5. Include comprehensive tests

### Coding Standards

- **TypeScript**: Strict mode enabled, proper type definitions required
- **Formatting**: Prettier and ESLint configurations must be followed
- **Testing**: Unit tests required for new features
- **Documentation**: Update README and inline documentation

### Bug Reports

Please include:

- Detailed description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node.js version, browser, etc.)
- Screenshots if applicable

---

## Development Commands

```bash
# Database management
npx prisma migrate dev    # Run database migrations
npx prisma studio        # Open Prisma Studio
npx prisma generate      # Generate Prisma client

# Development
npm run dev             # Start development server
npm run build          # Build for production
npm run start          # Start production server
```

---

**License**: MIT License  
**Maintainer**: Harmik Lathiya
**Support**: [Create an issue](https://github.com/Lathiya50/scrape-flow/issues)

## Form Automation

See docs/form-automation.md for file upload validation and progress, captcha provider verification, and 2FA credential support.

## Migration Notes

- ExecutionLog now includes `phaseId`, `taskType`, and `metadata` (`JSONB`). Existing rows are backfilled from `executionPhaseId` and default values.
- Apply database migrations with `npx prisma migrate dev`. Verify logs render in the Execution Viewer.
## Rate Limiting

- Endpoints: `/api/workflows/cron` and `/api/workflows/execute`
- Policy: Dual-level fixed-window limits
  - Per-user based on authenticated `userId`
  - Global aggregate for unauthenticated traffic
- Responses when limits exceeded:
  - Status: `429 Too Many Requests`
  - Headers:
    - `X-RateLimit-Limit`: window limit
    - `X-RateLimit-Remaining`: remaining in current window
    - `X-RateLimit-Reset`: Unix epoch seconds when window resets
- Default thresholds (configurable via env):
  - `cron`: `RATE_LIMIT_USER_CRON=10`, `RATE_LIMIT_GLOBAL_CRON=20`
  - `execute`: `RATE_LIMIT_USER_EXECUTE=60`, `RATE_LIMIT_GLOBAL_EXECUTE=120`
  - Window: `RATE_LIMIT_WINDOW_SECONDS=60`
- Monitoring:
  - Logs emit warnings on limit exceed events with scope/user context

### Error Response Example

```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1731532800

{"error":"Too Many Requests"}
```

### Configuration Options

- `RATE_LIMIT_WINDOW_SECONDS`: Fixed window size in seconds
- `RATE_LIMIT_GLOBAL_CRON` / `RATE_LIMIT_USER_CRON`: Cron endpoint limits
- `RATE_LIMIT_GLOBAL_EXECUTE` / `RATE_LIMIT_USER_EXECUTE`: Execute endpoint limits

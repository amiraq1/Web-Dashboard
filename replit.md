# نبض (Nabd) - AI-Powered Project Management Platform

## Overview

نبض (Nabd) is an intelligent project management platform designed for Arabic-speaking users. It combines natural language processing with project management capabilities, allowing users to interact with the system using Arabic commands. The platform features AI-powered task creation, file analysis, and automated workflow execution through intelligent agents.

Key capabilities:
- Natural language command interface in Arabic
- Project and task management with AI assistance
- File upload, analysis, and text extraction
- AI-powered chat interface for queries and task automation
- RTL (Right-to-Left) interface design optimized for Arabic

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Design Direction**: RTL-first layout for Arabic interface

The frontend follows a component-based architecture with:
- Page components in `client/src/pages/`
- Reusable UI components in `client/src/components/`
- shadcn/ui primitives in `client/src/components/ui/`
- Custom hooks in `client/src/hooks/`

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints under `/api/`
- **Build Tool**: Vite for development, esbuild for production

Key server modules:
- `server/routes.ts` - API endpoint definitions
- `server/storage.ts` - Data access layer interface
- `server/openai.ts` - AI/LLM integration for intent parsing
- `server/fileAgent.ts` - File processing and text extraction
- `server/objectStorage.ts` - File storage using Replit Object Storage

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Generated via `drizzle-kit push`
- **File Storage**: Replit Object Storage for uploaded files

Core entities:
- Users (Replit Auth integration)
- Projects (user-owned workspaces)
- Tasks (project items with status tracking)
- Files (uploaded documents with metadata)
- Messages (chat history)
- Sessions (authentication sessions)

### Authentication
- **Provider**: Replit Auth via OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **Implementation**: Passport.js with OIDC strategy

### AI Integration
- **Provider**: OpenAI GPT-4o
- **Purpose**: Natural language intent parsing, document analysis, response generation
- **Pattern**: Structured JSON output for intent classification

The AI layer parses Arabic commands to determine:
- Intent type (analyze_data, create_report, create_task, etc.)
- Associated project/files
- Output format preferences
- Priority levels

## External Dependencies

### Third-Party Services
- **OpenAI API**: GPT-4o for natural language understanding and generation
- **Replit Auth**: User authentication via OIDC
- **Replit Object Storage**: File upload and retrieval

### Database
- **PostgreSQL**: Primary data store (provisioned via Replit)
- **Connection**: Via `DATABASE_URL` environment variable

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Express session encryption key
- `OPENAI_API_KEY` or `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API access
- `ISSUER_URL` - OIDC issuer (defaults to Replit)
- `REPL_ID` - Replit application identifier

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `@tanstack/react-query` - Server state management
- `@radix-ui/*` - Accessible UI primitives
- `openai` - OpenAI API client
- `passport` / `openid-client` - Authentication
- `date-fns` - Date formatting with Arabic locale support
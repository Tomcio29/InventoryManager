# Inventory Manager - Asset Tracking System

## Overview

This is a full-stack inventory management application designed for tracking assets with QR code scanning, GPS positioning, and interactive mapping capabilities. The system provides a professional interface for managing warehouse inventory, asset locations, and real-time tracking.

## System Architecture

### Docker Architecture
- **Database Container**: PostgreSQL 15 with persistent volume
- **Backend Container**: Node.js/Express API server
- **Frontend Container**: React app served by Nginx
- **Network**: Docker bridge network for inter-container communication
- **Orchestration**: Docker Compose for multi-container management

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds
- **Production Server**: Nginx with API proxy configuration

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: PostgreSQL Docker container
- **API Design**: RESTful API with JSON responses
- **Production**: Compiled TypeScript with health checks

### Key Components

#### Data Layer
- **ORM**: Drizzle ORM with TypeScript for type-safe database operations
- **Schema**: Shared schema definitions between client and server
- **Migrations**: Database schema versioning with drizzle-kit
- **Connection**: Neon serverless driver with WebSocket support

#### Authentication & Authorization
- Session-based authentication (prepared for implementation)
- User management system with bcrypt password hashing
- Role-based access control structure in place

#### Asset Management
- Asset CRUD operations with validation
- QR code generation and scanning capabilities
- Location tracking with X/Y coordinate system
- Warehouse capacity management
- Asset status tracking (in_warehouse, in_field, in_transit)

#### User Interface
- Responsive design with mobile-first approach
- Dark/light theme support via CSS variables
- Interactive asset map with canvas-based rendering
- Real-time data updates with React Query
- Toast notifications for user feedback

## Data Flow

1. **Client Requests**: Frontend makes HTTP requests to `/api/*` endpoints
2. **Server Processing**: Express.js routes handle business logic and database operations
3. **Database Operations**: Drizzle ORM executes type-safe SQL queries
4. **Response Handling**: JSON responses sent back to client
5. **State Updates**: React Query manages cache invalidation and UI updates

## External Dependencies

### Production Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: Type-safe database ORM
- **express**: Web application framework
- **react**: UI library
- **wouter**: Lightweight router
- **zod**: Runtime type validation

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type safety
- **tailwindcss**: Utility-first CSS framework
- **@replit/vite-plugin-***: Replit-specific development tools

## Deployment Strategy

### Development Environment
- Vite development server with HMR
- Express server in middleware mode
- Database migrations via drizzle-kit
- Environment variables for database connection

### Production Build
- Frontend: Vite builds optimized static assets
- Backend: esbuild bundles Node.js server code
- Single artifact deployment with static file serving
- Environment-specific configuration

### Database Management
- Schema changes via Drizzle migrations
- PostgreSQL Docker container with persistent volumes
- Connection pooling and health checks
- Type-safe schema validation
- Automated database initialization on container startup

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

- June 28, 2025: Initial setup with PostgreSQL integration
- June 28, 2025: Docker containerization - separated application into three containers (PostgreSQL, backend, frontend) with docker-compose orchestration
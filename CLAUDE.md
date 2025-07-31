# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start web development server on port 8080
- `npm run tauri:dev` - Start Tauri desktop application in development mode
- `npm run build` - Build web version for production
- `npm run tauri:build` - Build desktop application for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Database
- Uses SQLite with Tauri for local desktop storage
- Database operations handled via `src/lib/database.ts`
- No authentication required - single-user local application

## Architecture

This is a desktop productivity application with a cyberpunk/terminal aesthetic built with:
- **React 18** with TypeScript
- **Vite** as build tool  
- **Tauri** for desktop application framework
- **SQLite** for local data storage
- **shadcn/ui** components with **Tailwind CSS**
- **React Router** for navigation
- **React Query** for data fetching

### Core Structure

#### Main App (`src/App.tsx`)
- Single-user desktop application (no authentication)
- Provides global handlers for CRUD operations (todos, time logs, calendar events, notes)
- Uses split layout: main content area + embedded terminal at bottom
- All routes accessible without authentication

#### Database Schema
The app uses 4 main SQLite tables:
- `todos` - Task items with priority levels and completion status
- `time_logs` - Activity tracking with duration in minutes
- `calendar_events` - Date-based events and reminders
- `notes` - Rich text notes with tags

#### Key Components
- **CyberTerminal** (`src/components/CyberTerminal.tsx`) - Interactive command-line interface for data entry
- **AppSidebar** - Navigation sidebar
- Page components in `src/pages/` correspond to main app sections

#### UI System
- Uses shadcn/ui components in `src/components/ui/`
- Custom cyberpunk styling with neon glow effects and terminal borders
- Consistent theming with `next-themes` for dark/light mode

#### Data Flow
1. All data operations go through local SQLite database via `src/lib/database.ts`
2. No authentication - single-user desktop app
3. Real-time updates using React Query
4. Global state managed through React context and props

### Navigation Structure
- `/` - Dashboard (overview)
- `/todos` - Task management
- `/timelog` - Time tracking
- `/calendar` - Calendar events
- `/notes` - Note taking

### Development Notes
- Path alias `@/` maps to `src/`
- Uses SWC for fast React compilation
- ESLint configured for React and TypeScript
- SQLite database file created automatically at runtime
- Database operations through `src/lib/database.ts` - single-user, no foreign keys needed
- Tauri backend code in `src-tauri/` directory (Rust)
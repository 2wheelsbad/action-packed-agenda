# Action Packed Agenda

A cyberpunk-themed desktop productivity application with terminal-style interface for managing todos, time tracking, calendar events, and notes.

## Features

- **Task Management** - Create, edit, and organize todos with priority levels
- **Time Tracking** - Log activities and track time spent on different tasks
- **Calendar Events** - Schedule and manage calendar events and reminders
- **Note Taking** - Rich text notes with tagging system
- **Terminal Interface** - Interactive command-line interface for data entry
- **Cyberpunk Theme** - Dark theme with neon glow effects and terminal aesthetics
- **Local Storage** - All data stored locally using SQLite (no authentication required)

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite with SWC
- **Desktop Framework**: Tauri (Rust-based)
- **Database**: SQLite for local storage
- **UI Components**: shadcn/ui with Tailwind CSS
- **Routing**: React Router
- **Data Fetching**: React Query
- **Theming**: next-themes for dark/light mode

## Prerequisites

Before running this application locally, make sure you have the following installed:

- **Node.js** (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** (comes with Node.js)
- **Rust** (for Tauri desktop app) - [Install Rust](https://rustup.rs/)

For the desktop application, you'll also need:
- **System dependencies** for Tauri - see [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <YOUR_GIT_URL>
cd action-packed-agenda
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Application

#### Web Version (Development)
```bash
npm run dev
```
This starts the web development server on `http://localhost:8080`

#### Desktop Application (Development)
```bash
npm run tauri:dev
```
This builds and runs the Tauri desktop application with hot reload

#### Preview Production Build
```bash
npm run build
npm run preview
```

## Available Scripts

### Development
- `npm run dev` - Start web development server on port 8080
- `npm run tauri:dev` - Start Tauri desktop application in development mode

### Production
- `npm run build` - Build web version for production
- `npm run tauri:build` - Build desktop application for production

### Code Quality
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   └── CyberTerminal.tsx # Interactive terminal interface
├── pages/              # Route components
├── lib/                # Utilities and database
│   └── database.ts     # SQLite database operations
├── hooks/              # Custom React hooks
└── integrations/       # External service integrations

src-tauri/              # Tauri backend (Rust)
```

## Database

The application uses SQLite for local data storage with four main tables:
- `todos` - Task items with priority levels and completion status
- `time_logs` - Activity tracking with duration in minutes
- `calendar_events` - Date-based events and reminders
- `notes` - Rich text notes with tags

The database file is created automatically when you first run the application.

## Key Features

### Terminal Interface
- Interactive command-line interface for quick data entry
- Commands for creating todos, time logs, calendar events, and notes
- System status and help commands
- Command history and autocomplete

### Navigation
- `/` - Dashboard (overview)
- `/todos` - Task management
- `/timelog` - Time tracking
- `/calendar` - Calendar events
- `/notes` - Note taking

## Development Notes

- Path alias `@/` maps to `src/`
- Uses SWC for fast React compilation
- ESLint configured for React and TypeScript
- SQLite database operations through `src/lib/database.ts`
- Single-user application (no authentication required)

## Troubleshooting

### Common Issues

1. **Tauri build fails**: Make sure you have all system dependencies installed for your platform
2. **Port already in use**: The web dev server uses port 8080 by default
3. **Database errors**: The SQLite database is created automatically on first run

### System Requirements

- **Windows**: WebView2, Visual Studio C++ Build Tools
- **macOS**: Xcode Command Line Tools
- **Linux**: webkit2gtk, build essentials

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` to check code quality
5. Submit a pull request

## License

This project is built with Lovable and uses various open-source technologies. See individual package licenses for more details.
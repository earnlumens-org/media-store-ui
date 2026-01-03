# Media Store UI - Documentation

Frontend application for EarnLumens platform built with Vue 3.

## Documentation Index

| Document | Description |
|----------|-------------|
| [AUTH.md](AUTH.md) | Token management, Web Worker, multi-tab sync |

## Quick Start

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

## Tech Stack

- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **Language**: TypeScript
- **State Management**: Pinia
- **UI Library**: Vuetify 3
- **Routing**: Vue Router (file-based)
- **i18n**: Vue I18n

## Project Structure

```
src/
├── api/              # API layer and request utilities
│   ├── modules/      # Feature-specific API functions
│   └── axios/        # HTTP client configuration
├── components/       # Reusable Vue components
├── layouts/          # Page layout templates
├── pages/            # File-based routing pages
├── plugins/          # Vue plugins (Vuetify, Router, etc.)
├── router/           # Route guards and configuration
├── services/         # Core services (token worker, broadcast)
├── stores/           # Pinia state stores
├── styles/           # Global styles
├── workers/          # Web Workers (token management)
└── locales/          # i18n translation files
```

## Key Concepts

### Token Isolation
Access tokens are stored exclusively in a Web Worker, never in browser storage or application state. See [AUTH.md](AUTH.md) for details.

### Multi-Tab Synchronization
Logout and session expiration events are broadcast across browser tabs using BroadcastChannel API.

### API Layer
All HTTP requests go through a centralized API layer that automatically handles token injection and refresh.

## Configuration

Environment variables:
- `VITE_API_URL` - Backend API base URL

Configuration is managed in `src/config/env.ts`.

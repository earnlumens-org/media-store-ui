# Authentication System - Frontend

This document describes the authentication architecture implemented in the Media Store UI.

## Overview

The frontend implements a **token isolation model** using Web Workers for maximum security against XSS attacks.

```
┌─────────────────────────────────────────────────────────────┐
│                      MAIN THREAD                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────────┐  │
│  │ Vue App │  │ Router  │  │  Store  │  │   API Layer   │  │
│  └─────────┘  └─────────┘  └─────────┘  └───────┬───────┘  │
│                                                  │          │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ │
│                                                  │          │
│  ┌──────────────────────────────────────────────▼────────┐ │
│  │                    TOKEN WORKER                        │ │
│  │  • Access Token (memory only)                         │ │
│  │  • Expiration tracking                                │ │
│  │  • Automatic refresh                                  │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Security Objectives

- **Token isolation**: Access tokens never touch browser storage or application state
- **XSS protection**: Even if attacker injects script, tokens are unreachable
- **Automatic refresh**: Transparent token renewal before expiration
- **Multi-tab sync**: Consistent auth state across browser tabs

## Token Storage Policy

### Access Token
| Storage | Allowed |
|---------|---------|
| Web Worker memory | ✅ Yes |
| localStorage | ❌ No |
| sessionStorage | ❌ No |
| Cookies | ❌ No |
| Pinia/Vuex state | ❌ No |
| Global variables | ❌ No |

### Refresh Token
- **Never accessible to frontend**
- Stored in HttpOnly cookie by backend
- Browser automatically attaches on refresh requests

## Authentication Flow

### 1. OAuth2 Callback

```
OAuth2 Provider ──▶ Backend ──▶ Frontend Callback Page
                                        │
                                        ▼
                                Extract UUID from URL
                                Call session endpoint
                                        │
                                        ▼
                                Receive access token
                                Send to Worker (SET_TOKEN)
                                Update auth store
                                Navigate to app
```

### 2. Session Rehydration (Page Reload)

```
App Start ──▶ Initialize Worker
                    │
                    ▼
            Call refresh endpoint
            (browser attaches cookie)
                    │
              ┌─────┴─────┐
              │           │
           Success     Failure
              │           │
              ▼           ▼
         Store token   Clear state
         Set ready     Set ready
              │           │
              └─────┬─────┘
                    ▼
            Router guards proceed
```

**Important**: Router guards wait for auth initialization before checking protected routes.

### 3. API Request with Token

```
Component ──▶ API Layer ──▶ Worker Client
                                  │
                            GET_TOKEN message
                                  │
                                  ▼
                            Worker checks expiry
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
               Token valid              Token expired
                    │                           │
                    │                    Auto-refresh
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                            Return token
                                  │
                                  ▼
                    API Layer attaches Bearer header
                                  │
                                  ▼
                            Backend request
```

### 4. Concurrent Request Handling

When multiple requests need tokens simultaneously:

```
Request A ──▶ GET_TOKEN ──┐
Request B ──▶ GET_TOKEN ──┼──▶ Single refresh call
Request C ──▶ GET_TOKEN ──┘           │
                                      ▼
                              All requests receive
                              same refreshed token
```

A pending refresh promise queue ensures only one refresh call is made.

### 5. Logout

```
User clicks logout
        │
        ▼
Call logout endpoint (clears cookie)
        │
        ▼
Clear Worker token (CLEAR_TOKEN)
        │
        ▼
Clear auth store state
        │
        ▼
Broadcast LOGOUT to other tabs
        │
        ▼
Navigate to home
```

## Multi-Tab Synchronization

Uses BroadcastChannel API to sync auth events across tabs.

### Events Broadcast
| Event | Trigger | Action in Other Tabs |
|-------|---------|---------------------|
| LOGOUT | User logs out | Clear session, navigate home |
| SESSION_EXPIRED | Refresh fails (401) | Clear session, navigate home |

### Safety Mechanisms
- Unique tab ID prevents self-message processing
- Debounce flags prevent duplicate broadcasts
- Only authenticated tabs process events
- Router navigation (no page reload) prevents loops

## Component Responsibilities

### Token Worker (`workers/tokenWorker.ts`)
- Store access token in isolated memory
- Track expiration time
- Handle refresh requests
- Validate messages from client

### Worker Client (`services/tokenWorkerClient.ts`)
- Bridge between main thread and worker
- Promise-based API for token operations
- Handle concurrent token requests
- Manage session expired callbacks

### Auth Broadcast (`services/authBroadcast.ts`)
- Initialize BroadcastChannel
- Emit auth events to other tabs
- Register event listeners
- Validate incoming messages

### API Layer (`api/apiRequest.ts`)
- Request tokens from worker client
- Attach Bearer header to requests
- Handle 401 responses
- Provide typed API methods

### Auth Store (`stores/auth.ts`)
- Track authentication state
- Track auth ready state (for guards)
- Store user profile data
- Provide clear/set actions

## Router Guards

Protected routes use `meta.requiresAuth`:

```
Route navigation
       │
       ▼
Check isAuthReady
       │
   ┌───┴───┐
   │       │
  Ready  Not ready
   │       │
   │    Wait (with timeout)
   │       │
   └───┬───┘
       │
       ▼
Check isAuthenticated
       │
   ┌───┴───┐
   │       │
  Yes     No
   │       │
Allow   Redirect home
```

## Implementation References

| Component | Location |
|-----------|----------|
| Token Worker | `src/workers/tokenWorker.ts` |
| Worker Client | `src/services/tokenWorkerClient.ts` |
| Auth Broadcast | `src/services/authBroadcast.ts` |
| API Layer | `src/api/apiRequest.ts` |
| Auth Store | `src/stores/auth.ts` |
| Router Guards | `src/router/index.ts` |
| OAuth Callback | `src/pages/oauth2/callback.vue` |
| Session Init | `src/main.ts` |

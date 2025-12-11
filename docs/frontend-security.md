# Frontend Security Specification (Vue 3 + Web Worker)

This document describes the authentication flow, token isolation model, and security constraints implemented in the EarnLumens frontend. The design ensures strong protection against XSS, predictable session renewal, and a clean separation of concerns between UI, API client, and token management.

---

## 1. Security Objectives

- Prevent exposure of authentication tokens to the browser environment.
- Ensure safe, automatic, and transparent renewal of access tokens.
- Enforce stateless API communication.
- Separate UI state from authentication logic.
- Reduce XSS attack surface to near-zero.
- Preserve correct session behavior under refresh, offline mode, and race conditions.

---

## 2. Token Storage Strategy

The frontend implements a **strict token isolation policy**.

### Access Token
- Stored **exclusively inside Web Worker memory**.
- Never stored in:
  - `localStorage`
  - `sessionStorage`
  - `cookies`
  - Pinia/Vuex state
  - Global variables
  - IndexedDB
- Never exposed to the DOM or console.

### Refresh Token
- **Never accessible to the frontend.**
- Stored exclusively inside a **Secure, HTTP-only, SameSite cookie** created by the backend.
- Automatically included when calling `/auth/refresh`.
- Cannot be read or modified by scripts.

---

## 3. Authentication Flow (Login)

1. User successfully authenticates with backend.
2. Backend returns:
   - JSON containing an **Access Token**
   - A **Refresh Token stored as HTTP-only cookie**
3. Frontend immediately forwards the Access Token to the Web Worker.
4. Web Worker stores:
   - `accessToken`
   - `expiresAt`
   - `isRefreshing = false`

Frontend components never see the Access Token.

---

## 4. Web Worker Responsibilities

The Web Worker acts as a **Token Manager**—isolating private auth logic from the main runtime.

### Responsibilities (MUST do)
- Store the access token in private Worker memory.
- Track expiration based on JWT or TTL provided.
- Refresh tokens when required:
  - if expired,
  - or if within the refresh threshold (e.g., <30 seconds).
- Perform:

POST /auth/refresh

using the HTTP-only refresh cookie.
- Ensure refresh calls are serialized (`isRefreshing` lock).
- Provide safe responses to token requests from `api.ts`.
- Notify UI when:
- Refresh fails
- Session expires
- Logout is required
- Validate message origin and message shape (`type` field).
- Protect token from being exposed to or extracted by scripts.

### Forbidden (MUST NOT do)
- Persist tokens in any storage.
- Access the DOM or `window`.
- Perform API calls other than `/auth/refresh`.
- Expose refresh token in any form.
- Manage UI state.
- Handle application routing.

---

## 5. API Layer (`api.ts`)

All HTTP requests **must** go through a centralized module: `api.ts`.

### Responsibilities
- Request a valid access token from the Web Worker before each protected request.
- Attach it to the backend request using:

Authorization: Bearer <token>

- Handle errors from backend and notify Web Worker when:
- access token invalid/expired (401)
- authorization failure (403)
- Provide typed API wrappers for application usage.

### Forbidden
- Components calling `fetch()` directly.
- Components interacting with tokens.
- Multiple HTTP client instances.
- Token exposure via logs or debugging tools.

---

## 6. UI Layer (Vue + Vuetify)

The UI layer is strictly presentation-level.

### Responsibilities
- Display screens and handle user interactions.
- React to high-level Worker events (e.g., `SESSION_EXPIRED`).
- Trigger login and logout actions.
- Store non-sensitive UI state (theme, preferences).

### Forbidden
- Authentication logic inside components.
- Token management inside Pinia/Vuex.
- Storing any auth token in client storage.

---

## 7. Message Channel Security

Communication between the UI thread and the Web Worker uses `postMessage` and requires precision.

### Requirements:
- Validate `event.data.type`
- Only accept strictly typed messages (`GET_TOKEN`, `LOGIN`, `LOGOUT`)
- Reject malformed or unknown message types
- (Optional for multi-origin environments) validate `event.origin`

This message protocol prevents malicious scripts from interacting with the Worker unexpectedly.

---

## 8. Failure Handling

| Event | Worker Behavior | UI Behavior |
|-------|-----------------|-------------|
| Access Token expired | Refresh and return new token | Transparent |
| Refresh Token invalid | Emit `LOGOUT_REQUIRED` | Redirect to login |
| Refresh endpoint unreachable | Enter offline mode | Retry on reconnect |
| Worker returns error | Clear session | Show error dialog |
| Race condition in refresh | Worker serializes automatically | Stable behavior |

---

## 9. Token Refresh Strategy

The frontend uses a **lazy refresh mechanism**:

### Steps
1. `api.ts` asks Worker for token.
2. Worker checks:
 - If expired → refresh.
 - If close to expiration (<30s) → early refresh.
3. Worker makes:

POST /auth/refresh

4. Backend issues new Access Token.
5. Worker updates internal state.
6. Worker returns **only valid tokens** to `api.ts`.

### No timers, no intervals
Using `setTimeout` or background timers is explicitly avoided because browsers throttle suspended tabs, leading to session desynchronization.

---

## 10. Logout Flow

1. UI triggers logout.
2. Backend clears HTTP-only refresh cookie.
3. Worker wipes internal state.
4. UI redirects to login.

Logout is complete and immediate due to the stateless nature of access tokens.

---

## 11. Summary

The EarnLumens frontend enforces robust authentication security through:

- Web Worker token isolation  
- No persistent token storage  
- Stateless JWT-based sessions  
- Centralized API gateway  
- Strict message protocol  
- Automatic token renewal  
- No XSS-accessible tokens  

This architecture aligns with industry best practices used by Auth0, Okta, Google Identity, and AWS Cognito.


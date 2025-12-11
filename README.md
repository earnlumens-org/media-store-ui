# Media Store UI

## Description
**Media Store UI** is the modern frontend interface for the **Media Store API**, designed to provide a seamless user experience for **Multimedia Content Distribution Management**. It enables users to interact with the **Stellar Network** for secure and efficient transactions.

This application is built with **Vue 3** and **Vuetify**, serving as the client-side component of the EarnLumens ecosystem. It consumes the Media Store API to handle content display, user interactions, and wallet integration.

## Architecture (Overview)
- **Frontend App** → Vue 3 + Vuetify (SPA).
- **State Management** → Pinia for handling application state.
- **Routing** → Vue Router for navigation.
- **API Integration** → Consumes the Spring Boot backend (Media Store API).
- **Stellar Interaction** → Facilitates wallet connections and transaction signing.

## Features
- **Modern UI/UX**: Responsive and aesthetic design using Material Design (Vuetify).
- **Content Browsing**: Interface to explore and view multimedia assets.
- **User Dashboard**: Manage profiles and personal content libraries.
- **Wallet Integration**: Connect Stellar wallets for payments and asset management.
- **Real-time Feedback**: Interactive components for transaction status and updates.

## Tech Stack
- **Language**: TypeScript / JavaScript
- **Framework**: Vue 3 (Composition API)
- **UI Library**: Vuetify 3
- **Build Tool**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router

## Prerequisites
- **Node.js**: Recommended (LTS version, e.g., v18 or v20).
- **npm**: Comes with Node.js.

## Getting Started

### 1. Clone the repository
```bash
git clone <repository-url>
cd media-store-ui
```

### 2. Install Dependencies
Install the required packages using npm:
```bash
npm install
```

### 3. Run the Application
Start the development server with Hot Module Replacement (HMR):
```bash
npm run dev
```

The application will act as the frontend and will look for the backend API (usually at `http://localhost:3000` by default or configured via environment variables).

### 4. Build for Production
To create a production-ready build:
```bash
npm run build
```

## Security Architecture
See full frontend security specification here:
[docs/frontend-security.md](./docs/frontend-security.md)
[docs/security-architecture.md](./docs/security-architecture.md)

## 🔐 License
MIT – use it freely and responsibly.

/**
 * Auth Store - Centralized authentication state management
 * Handles session state, user data, and auth errors
 */

import type { UserProfile } from '@/api/modules/user.api'
import { defineStore } from 'pinia'

interface AuthState {
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean
  /** Whether auth initialization (rehydration) has completed */
  isAuthReady: boolean
  /** Current authenticated user's profile */
  user: UserProfile | null
  /** Last authentication error message */
  error: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    isAuthenticated: false,
    isAuthReady: false,
    user: null,
    error: null,
  }),

  getters: {
    /** Alias for backwards compatibility */
    loggedIn: (state): boolean => state.isAuthenticated,
  },

  actions: {
    setAuthenticated (value: boolean) {
      this.isAuthenticated = value
    },

    setAuthReady (value: boolean) {
      this.isAuthReady = value
    },

    setUser (user: UserProfile | null) {
      this.user = user
      this.isAuthenticated = !!user
    },

    /**
     * Update only the verified badge on the current user, preserving all other fields.
     * Called after a successful badge claim so the U1/U2 mark appears immediately
     * across the app (author cards, public profile, etc.) without a full reload.
     */
    setBadge (badge: 'u1' | 'u2' | null) {
      if (!this.user) {
        return
      }
      this.user = { ...this.user, profileBadge: badge ?? undefined }
    },

    setError (error: string | null) {
      this.error = error
    },

    clearError () {
      this.error = null
    },

    /**
     * Clear all auth state (used on logout)
     */
    clearAuth () {
      this.isAuthenticated = false
      this.user = null
      this.error = null
    },

    /**
     * Alias for backwards compatibility with setLoggedIn
     */
    setLoggedIn (value: boolean) {
      this.isAuthenticated = value
    },
  },
})

// Utilities
import { defineStore } from 'pinia'

interface AppState {
  windowWidth: number
  mobileView: boolean
  loggedIn: boolean
  isDarkTheme: boolean
  isOffline: boolean
  color: string
  addr: string | null
  lobstrPublicKey: string | null
  freighterPublicKey: string | null
  accessToken: string | null
  loginError: string | null
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    windowWidth: window.innerWidth,
    mobileView: window.innerWidth < 960,
    loggedIn: false,
    isDarkTheme: true,
    isOffline: false,
    color: '#FFCA28',
    addr: null,
    lobstrPublicKey: null,
    freighterPublicKey: null,
    accessToken: null,
    loginError: null,
  }),

  actions: {
    updateWindowWidth (width: number) {
      this.windowWidth = width
      this.mobileView = width < 960
    },
    setLoggedIn (value: boolean) {
      this.loggedIn = value
    },
    setOffline (value: boolean) {
      this.isOffline = value
    },
    setDarkTheme (value: boolean) {
      this.isDarkTheme = value
    },
    setAddr (addr: string | null) {
      this.addr = addr
    },
    setLobstrPublicKey (publicKey: string | null) {
      this.lobstrPublicKey = publicKey
    },
    setFreighterPublicKey (publicKey: string | null) {
      this.freighterPublicKey = publicKey
      // Also update the addr to show the Freighter address
      if (publicKey) {
        this.addr = publicKey
      }
    },
    setAccessToken (token: string | null) {
      this.accessToken = token
      this.loggedIn = !!token
    },
    setLoginError (error: string | null) {
      this.loginError = error
    },

    // Convenience actions matching old mutations if needed,
    // but cleaner to use the generic setters or direct access in components.
    // Keeping some logic-heavy ones:

    clearAddr () {
      this.addr = null
    },
    clearAccessToken () {
      this.accessToken = null
      this.loggedIn = false
    },
    clearLoginError () {
      this.loginError = null
    },
  },
})

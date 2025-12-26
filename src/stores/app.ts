import { defineStore } from 'pinia'

interface AppState {
  windowWidth: number
  mobileView: boolean
  loggedIn: boolean
  isDarkTheme: boolean
  loginError: string | null
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    windowWidth: window.innerWidth,
    mobileView: window.innerWidth < 960,
    loggedIn: false,
    isDarkTheme: true,
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
    setDarkTheme (value: boolean) {
      this.isDarkTheme = value
    },
    setLoginError (error: string | null) {
      this.loginError = error
    },

    clearLoginError () {
      this.loginError = null
    },
  },
})

import { defineStore } from 'pinia'

interface AppState {
  windowWidth: number
  mobileView: boolean
  loggedIn: boolean
  themeName: string
  isAppLocked: boolean
  loginError: string | null
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    windowWidth: window.innerWidth,
    mobileView: window.innerWidth < 960,
    loggedIn: false,
    themeName: 'system',
    isAppLocked: false,
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
    setThemeName (value: string) {
      this.themeName = value
    },
    setIsAppLocked (value: boolean) {
      this.isAppLocked = value
    },
    setLoginError (error: string | null) {
      this.loginError = error
    },

    clearLoginError () {
      this.loginError = null
    },
  },
})

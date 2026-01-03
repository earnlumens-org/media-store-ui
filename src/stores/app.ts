import { defineStore } from 'pinia'

/**
 * App Store - UI and layout state management
 * For auth state, use stores/auth.ts
 */

interface AppState {
  windowWidth: number
  mobileView: boolean
  themeName: string
  isAppLocked: boolean
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    windowWidth: window.innerWidth,
    mobileView: window.innerWidth < 960,
    themeName: 'amoledGray',
    isAppLocked: false,
  }),

  actions: {
    updateWindowWidth (width: number) {
      this.windowWidth = width
      this.mobileView = width < 960
    },
    setThemeName (value: string) {
      this.themeName = value
    },
    setIsAppLocked (value: boolean) {
      this.isAppLocked = value
    },
  },
})

import { ref } from 'vue'

/** Minimal reactive bus for showing a global snackbar from non-component code (interceptors, etc.) */
export const globalSnackbar = ref(false)
export const globalSnackbarMessage = ref('')
export const globalSnackbarColor = ref('error')

export function showGlobalNotification (message: string, color = 'error') {
  globalSnackbarMessage.value = message
  globalSnackbarColor.value = color
  globalSnackbar.value = true
}

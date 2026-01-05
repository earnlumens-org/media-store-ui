<template>
  <v-container>
    <div class="ma-6 d-flex justify-center">
      <div class="pa-2 bg-white elevation-2 d-flex align-center">
        <qrcode-vue
          level="H"
          :size="size"
          :value="addr"
          @click="copyTextToClipboard(addr)"
        />
      </div>
    </div>
    <div class="px-6 mb-6 text-center p-5 break-word">
      <span v-if="addr.length >= 15" @click="copyTextToClipboard(addr)">{{ addr }}</span>
    </div>

    <div class="text-center">
      <v-btn
        class="mt-2 mx-auto mb-6"
        color="primary"
        prepend-icon="mdi-content-copy"
        rounded
        type="submit"
        variant="outlined"
        @click="copyTextToClipboard(addr)"
      >{{ $t('CxDeposit.tap') }}</v-btn>
    </div>
  </v-container>
  <v-snackbar
    v-model="snackbar"
    :color="textColor"
    location="center"
    rounded="pill"
    :timeout="timeout"
  >
    <v-icon left>mdi-check</v-icon>
    {{ snackbarText }}
    <template #actions />
  </v-snackbar>
</template>

<script setup lang="ts">
  import QrcodeVue from 'qrcode.vue'
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'

  import { useAppStore } from '@/stores/app'
  import { useWalletStore } from '@/stores/wallet'

  const { t } = useI18n()
  const appStore = useAppStore()
  const walletStore = useWalletStore()

  const size = ref(300)
  const snackbar = ref(false)
  const timeout = ref(2000)
  const snackbarText = ref('')
  const textColor = ref('success')

  const addr = computed(() => walletStore.activeAddress)
  const windowWidth = computed(() => appStore.windowWidth)

  function handleResize () {
    size.value = windowWidth.value < 320 ? windowWidth.value - 40 : 300
  }

  function copySuccess () {
    textColor.value = 'success'
    snackbarText.value = t('CxDeposit.snackbarSuccess')
    snackbar.value = true
  }

  function copyError (error?: Error) {
    textColor.value = 'error'
    snackbarText.value = t('CxDeposit.snackbarError')
    if (error) {
      snackbarText.value = t('CxDeposit.snackbarErrorDetails')
      console.error('Error copying text to clipboard:', error)
    }
    snackbar.value = true
  }

  function copyNotSupported () {
    textColor.value = 'error'
    snackbarText.value = t('CxDeposit.snackbarNotSupported')
    snackbar.value = true
  }

  function fallbackCopyTextToClipboard (text: string) {
    if (
      document.queryCommandSupported
      && document.queryCommandSupported('copy')
    ) {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.append(textarea)
      textarea.select()
      try {
        const successful = document.execCommand('copy')
        if (successful) {
          copySuccess()
        } else {
          copyError()
        }
      } catch (error) {
        copyError(error as Error)
      }
      textarea.remove()
    } else {
      copyNotSupported()
    }
  }

  function copyTextToClipboard (text: string) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          copySuccess()
        })
        .catch((error: Error) => {
          copyError(error)
        })
    } else {
      fallbackCopyTextToClipboard(text)
    }
  }

  onMounted(() => {
    window.addEventListener('resize', handleResize)
    handleResize()
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
</script>

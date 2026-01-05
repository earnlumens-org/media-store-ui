declare module 'qrcode.vue' {
  import type { Component } from 'vue'

  interface QrcodeVueProps {
    value: string
    size?: number
    level?: 'L' | 'M' | 'Q' | 'H'
    background?: string
    foreground?: string
    renderAs?: 'canvas' | 'svg'
    margin?: number
  }

  const QrcodeVue: Component<QrcodeVueProps>
  export default QrcodeVue

  export const QrcodeCanvas: Component<QrcodeVueProps>
  export const QrcodeSvg: Component<QrcodeVueProps>
}

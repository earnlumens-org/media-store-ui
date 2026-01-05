declare module 'vue-number-animation' {
  import type { Component } from 'vue'

  interface NumberAnimationProps {
    from?: number
    to: number
    duration?: number
    delay?: number
    easing?: string
    format?: (value: number) => string
  }

  const NumberAnimation: Component<NumberAnimationProps>
  export default NumberAnimation
}

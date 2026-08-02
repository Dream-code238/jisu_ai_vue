// 让 sparkline 的柱子高度持续轻微波动，营造「实时数据」效果
import { ref, watch, onBeforeUnmount } from 'vue'

export function useSparkline(source, { stepMs = 1800, amp = 4 } = {}) {
  const display = ref([...(source.value || [])])
  let timer = null

  const tick = () => {
    const base = source.value || []
    display.value = base.map((v) => {
      const delta = (Math.random() - 0.5) * amp * 2
      const next = v + delta
      return Math.max(20, Math.min(98, next))
    })
  }

  const start = () => {
    if (timer) return
    timer = setInterval(tick, stepMs)
  }

  const stop = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  watch(
    source,
    (next) => {
      display.value = [...(next || [])]
    },
    { immediate: true },
  )

  start()
  onBeforeUnmount(stop)

  return { display }
}

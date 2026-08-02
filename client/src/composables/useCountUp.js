// 数字滚动动画：从 0 缓动到目标值
// 用法：const { display } = useCountUp(target, { duration, decimals })
import { ref, watch } from 'vue'

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

export function useCountUp(source, options = {}) {
  const {
    duration = 1100,
    decimals = 0,
    format = (v) =>
      v.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
  } = options

  const display = ref(format(typeof source.value === 'number' ? 0 : 0))
  let rafId = null

  const animate = (from, to) => {
    if (rafId) cancelAnimationFrame(rafId)
    const start = performance.now()
    const tick = (now) => {
      const elapsed = now - start
      const t = Math.min(1, elapsed / duration)
      const eased = easeOutCubic(t)
      const cur = from + (to - from) * eased
      display.value = format(cur)
      if (t < 1) {
        rafId = requestAnimationFrame(tick)
      } else {
        display.value = format(to)
        rafId = null
      }
    }
    rafId = requestAnimationFrame(tick)
  }

  watch(
    source,
    (next, prev) => {
      const target = Number(next) || 0
      const prevVal = prev == null ? 0 : Number(prev) || 0
      animate(prevVal, target)
    },
    { immediate: true },
  )

  return { display }
}

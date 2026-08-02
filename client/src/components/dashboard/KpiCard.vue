<!--
  KpiCard.vue — 单个 KPI 卡片
  包含：图标、标签、动态数字（缓动滚动）、趋势、7 根 sparkline 柱（实时波动）
-->
<template>
  <div class="kpi-card">
    <div class="kpi-card-top">
      <div>
        <div class="kpi-card-label">{{ kpi.label }}</div>
        <div class="kpi-card-value">
          <span class="kpi-card-num">{{ numDisplay }}</span>
          <span class="kpi-card-unit" v-if="kpi.unit">{{ kpi.unit }}</span>
        </div>
        <div class="kpi-card-meta">
          <span :class="kpi.trendDir === 'up' ? 'kpi-up' : 'kpi-down'">
            {{ kpi.trendDir === 'up' ? '↑' : '↓' }} {{ kpi.trend }}%
          </span>
          <span class="kpi-card-hint">{{ kpi.trendHint }}</span>
        </div>
      </div>
      <div class="kpi-card-icon" :style="{ background: kpi.iconBg, color: kpi.iconColor }">
        {{ kpi.icon }}
      </div>
    </div>

    <div class="kpi-sparkline">
      <div
        v-for="(h, i) in spark"
        :key="i"
        class="kpi-sparkline-bar"
        :style="{
          height: h + '%',
          background: i === spark.length - 1 ? kpi.iconColor : kpi.iconBg,
          transitionDelay: i * 50 + 'ms',
        }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, ref, onMounted } from 'vue'
import { useCountUp } from '../../composables/useCountUp.js'

const props = defineProps({
  kpi: { type: Object, required: true },
  sparkData: { type: Array, default: () => [] },
  animationKey: { type: String, default: '' },
})

// 数字滚动
const target = computed(() => props.kpi.value)
const { display } = useCountUp(target, {
  duration: 1100,
  decimals: props.kpi.decimals ?? 0,
})
const numDisplay = display

// sparkline：优先使用父组件传入的实时数据，否则用静态值
const spark = ref([...(props.sparkData || props.kpi.spark || [])])
watch(
  () => props.sparkData,
  (v) => {
    if (v && v.length) spark.value = [...v]
  },
)
watch(
  () => props.kpi.spark,
  (v) => {
    if (v && v.length) spark.value = [...v]
  },
  { immediate: true },
)

// 入场时柱子高度从 0 弹起
onMounted(() => {
  // 初始先把柱子置 0，nextTick 后恢复目标，触发 transition
  const target = [...spark.value]
  spark.value = target.map(() => 0)
  requestAnimationFrame(() => {
    setTimeout(() => {
      spark.value = target
    }, 60)
  })
})
</script>

<style scoped>
.kpi-card {
  background: #fff;
  border: 1px solid var(--slate-200);
  border-radius: 12px;
  padding: 16px;
  box-shadow: var(--shadow-sm);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  min-height: 130px;
  position: relative;
  overflow: hidden;
}
.kpi-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    transparent 0%,
    rgba(255, 255, 255, 0) 60%,
    rgba(255, 255, 255, 0.6) 100%
  );
  pointer-events: none;
  opacity: 0.4;
}
.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.kpi-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.kpi-card-label {
  font-size: 12px;
  color: var(--slate-400);
  margin-bottom: 6px;
}
.kpi-card-value {
  display: flex;
  align-items: baseline;
  gap: 2px;
  font-size: 28px;
  font-weight: 700;
  color: var(--slate-800);
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.kpi-card-num {
  display: inline-block;
  min-width: 0;
}
.kpi-card-unit {
  font-size: 13px;
  color: var(--slate-400);
  font-weight: 400;
  margin-left: 4px;
}
.kpi-card-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: 11px;
}
.kpi-card-hint {
  color: var(--slate-400);
}
.kpi-up {
  color: var(--green);
  font-weight: 600;
}
.kpi-down {
  color: var(--red);
  font-weight: 600;
}

.kpi-card-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

/* sparkline */
.kpi-sparkline {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 36px;
  margin-top: 14px;
  padding: 0 2px;
  position: relative;
  z-index: 1;
}
.kpi-sparkline-bar {
  flex: 1;
  border-radius: 2px 2px 0 0;
  transition:
    height 0.7s cubic-bezier(0.22, 1, 0.36, 1),
    background 0.3s;
  animation: spark-pop 0.4s ease-out backwards;
}
@keyframes spark-pop {
  from {
    transform: scaleY(0);
    opacity: 0;
  }
  to {
    transform: scaleY(1);
    opacity: 1;
  }
}
</style>

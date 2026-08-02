<!--
  数据看板
  动态效果：
    - KPI 数字 0→target 滚动计数（缓动 cubic）
    - Bar 进度条宽度 0→target 动画
    - Donut 圆环 stroke-dasharray 0→target 动画
    - Sparkline 柱子持续轻微波动
    - 切换时间筛选时整体重放动画
-->
<template>
  <div class="dash-page">
    <!-- ============ 顶部 ============ -->
    <div class="dash-header">
      <h2>数据看板</h2>
      <div class="dash-time-filter">
        <button
          v-for="p in periods"
          :key="p.key"
          class="dash-time-btn"
          :class="{ active: period === p.key }"
          @click="period = p.key"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- ============ KPI 卡片 ============ -->
    <div class="kpi-grid">
      <KpiCard
        v-for="(kpi, idx) in data.kpis"
        :key="kpi.label"
        :kpi="kpi"
        :spark-data="sparkDisplays[idx]"
        :animation-key="`${period}-${kpi.label}`"
      />
    </div>

    <!-- ============ 图表区 ============ -->
    <div class="chart-grid">
      <!-- 意图分布 -->
      <div class="chart-card">
        <div class="chart-card-title">
          意图分布 <span>{{ periodTag }}</span>
        </div>
        <div class="bar-chart">
          <div class="bar-row" v-for="(bar, i) in data.intentBars" :key="bar.label">
            <div class="bar-label">{{ bar.label }}</div>
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{
                  width: intentBarWidths[i] + '%',
                  background: bar.color,
                  transitionDelay: i * 80 + 'ms',
                }"
              >
                <span class="bar-fill-text">{{ bar.count.toLocaleString('en-US') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 模型成本占比 -->
      <div class="chart-card">
        <div class="chart-card-title">
          模型成本占比 <span>{{ periodTag }}</span>
        </div>
        <div class="donut-wrap">
          <svg class="donut-svg" width="140" height="140" viewBox="0 0 140 140">
            <!-- 背景环 -->
            <circle cx="70" cy="70" r="56" fill="none" stroke="#f1f5f9" stroke-width="20" />
            <!-- 三段彩色环 -->
            <circle
              v-for="(seg, i) in data.modelCost.parts"
              :key="seg.label"
              cx="70"
              cy="70"
              r="56"
              fill="none"
              :stroke="seg.color"
              stroke-width="20"
              :stroke-dasharray="donutSegments[i].arr"
              :stroke-dashoffset="donutSegments[i].offset"
              transform="rotate(-90 70 70)"
              class="donut-seg"
              :style="{ transitionDelay: i * 280 + 'ms' }"
            />
            <text
              x="70"
              y="65"
              text-anchor="middle"
              font-size="20"
              font-weight="700"
              fill="#1e293b"
            >
              {{ data.modelCost.total }}
            </text>
            <text x="70" y="82" text-anchor="middle" font-size="11" fill="#94a3b8">总成本</text>
          </svg>
          <div class="donut-legend">
            <div
              class="donut-legend-item"
              v-for="(seg, i) in data.modelCost.parts"
              :key="seg.label"
              :style="{ transitionDelay: i * 100 + 'ms' }"
            >
              <div class="donut-legend-dot" :style="{ background: seg.color }"></div>
              <div class="donut-legend-label">{{ seg.label }}</div>
              <div class="donut-legend-val">{{ seg.percent }}%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 节点耗时 (P95) -->
      <div class="chart-card">
        <div class="chart-card-title">节点耗时 (P95) <span>毫秒</span></div>
        <div class="bar-chart">
          <div class="bar-row" v-for="(bar, i) in data.nodeLatency" :key="bar.label">
            <div class="bar-label">{{ bar.label }}</div>
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{
                  width: latencyBarWidths[i] + '%',
                  background: bar.color,
                  transitionDelay: i * 80 + 'ms',
                }"
              >
                <span class="bar-fill-text">{{ bar.ms }}ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 语义缓存命中率 -->
      <div class="chart-card">
        <div class="chart-card-title">
          语义缓存命中率 <span>{{ periodTag }}</span>
        </div>
        <div class="bar-chart">
          <div class="bar-row" v-for="(bar, i) in data.cacheHit" :key="bar.label">
            <div class="bar-label">{{ bar.label }}</div>
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{
                  width: cacheBarWidths[i] + '%',
                  background: 'var(--amber)',
                  transitionDelay: i * 60 + 'ms',
                }"
              >
                <span class="bar-fill-text">{{ bar.percent }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ 最近调用表 ============ -->
    <div class="data-table" :key="`table-${period}`">
      <div class="data-table-head">
        <div>用户问题</div>
        <div>意图</div>
        <div>模型</div>
        <div>耗时</div>
        <div>状态</div>
      </div>
      <div
        class="data-table-row"
        v-for="(row, i) in data.recent"
        :key="row.question + i"
        :style="{ transitionDelay: i * 70 + 'ms' }"
      >
        <div class="cell-question">{{ row.question }}</div>
        <div>
          <span class="model-tag" :style="intentTagStyle(row.intentStyle)">{{ row.intent }}</span>
        </div>
        <div>
          <span class="model-tag" :style="modelTagStyle(row.modelStyle)">{{ row.model }}</span>
        </div>
        <div class="cell-duration">{{ row.duration }}</div>
        <div>
          <span class="kb-status-tag" :class="row.status">● {{ statusLabel(row.status) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { getDashboardData, PERIOD_TAGS } from '../data/dashboardMock.js'
import KpiCard from '../components/dashboard/KpiCard.vue'

const periods = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '近7天' },
  { key: 'month', label: '近30天' },
  { key: 'all', label: '全部' },
]

const period = ref('week')
const data = computed(() => getDashboardData(period.value))
const periodTag = computed(() => PERIOD_TAGS[period.value])

// ============== 计算辅助（先定义，后面才能引用） ==============
const intentMax = computed(() => Math.max(...data.value.intentBars.map((b) => b.count), 1))
const latencyMax = computed(() => Math.max(...data.value.nodeLatency.map((b) => b.ms), 1))

const computeIntentWidths = () => {
  const max = intentMax.value
  return data.value.intentBars.map((b) => Math.max(8, Math.round((b.count / max) * 100)))
}
const computeLatencyWidths = () => {
  const max = latencyMax.value
  return data.value.nodeLatency.map((b) => Math.max(8, Math.round((b.ms / max) * 100)))
}
const computeCacheWidths = () => data.value.cacheHit.map((b) => Math.max(8, b.percent))

// ============== Donut 计算 ==============
const CIRC = 2 * Math.PI * 56
const computeDonutSegments = (animate = false) => {
  const parts = data.value.modelCost.parts
  const total = parts.reduce((s, p) => s + p.percent, 0) || 1
  let acc = 0
  return parts.map((p) => {
    const frac = p.percent / total
    const len = animate ? 0 : Math.round(frac * CIRC)
    const offset = -Math.round(acc * CIRC)
    acc += frac
    return { arr: `${len} ${CIRC}`, offset }
  })
}

// ============== 初始化 ref（直接计算最终值，保证首次渲染有数据） ==============
const intentBarWidths = ref(computeIntentWidths())
const latencyBarWidths = ref(computeLatencyWidths())
const cacheBarWidths = ref(computeCacheWidths())
const donutSegments = ref(computeDonutSegments(false))

// ============== Sparkline 实时波动 ==============
const sparkDisplays = ref(data.value.kpis.map((k) => [...k.spark]))
let sparkTimer = null

const startSparkline = () => {
  if (sparkTimer) return
  sparkTimer = setInterval(() => {
    sparkDisplays.value = sparkDisplays.value.map((arr) =>
      arr.map((v) => {
        const delta = (Math.random() - 0.5) * 8
        return Math.max(20, Math.min(98, v + delta))
      }),
    )
  }, 1800)
}

// ============== 动画播放 ==============
const playBarAnimations = async () => {
  intentBarWidths.value = data.value.intentBars.map(() => 0)
  latencyBarWidths.value = data.value.nodeLatency.map(() => 0)
  cacheBarWidths.value = data.value.cacheHit.map(() => 0)
  await nextTick()
  await new Promise((r) => requestAnimationFrame(r))
  intentBarWidths.value = computeIntentWidths()
  latencyBarWidths.value = computeLatencyWidths()
  cacheBarWidths.value = computeCacheWidths()
}

const playDonutAnimation = async () => {
  donutSegments.value = computeDonutSegments(true)
  await new Promise((r) => requestAnimationFrame(r))
  donutSegments.value = computeDonutSegments(false)
}

watch(
  period,
  () => {
    sparkDisplays.value = data.value.kpis.map((k) => [...k.spark])
    playBarAnimations()
    playDonutAnimation()
  },
  { immediate: false },
)

// ============== 标签样式 ==============
const STYLE_MAP = {
  blue: { background: 'var(--blue-l)', color: 'var(--blue)' },
  teal: { background: 'var(--teal-l)', color: 'var(--teal)' },
  slate: { background: 'var(--slate-100)', color: 'var(--slate-600)' },
  green: { background: 'var(--green-l)', color: 'var(--green)' },
  purple: { background: 'var(--purple-l)', color: 'var(--purple)' },
  amber: { background: 'var(--amber-l)', color: 'var(--amber)' },
}
const intentTagStyle = (k) => STYLE_MAP[k] || STYLE_MAP.slate
const modelTagStyle = (k) => STYLE_MAP[k] || STYLE_MAP.slate
const statusLabel = (s) =>
  s === 'done' ? '成功' : s === 'processing' ? '审批中' : s === 'failed' ? '失败' : s

// ============== 初始化 ==============
onMounted(() => {
  startSparkline()
  playBarAnimations()
  playDonutAnimation()
})

onBeforeUnmount(() => {
  if (sparkTimer) {
    clearInterval(sparkTimer)
    sparkTimer = null
  }
})
</script>

<style scoped>
/* ============== 页面 ============== */
.dash-page {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
}

.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.dash-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--slate-800);
}
.dash-time-filter {
  display: flex;
  gap: 4px;
  background: var(--slate-100);
  border-radius: 8px;
  padding: 3px;
}
.dash-time-btn {
  padding: 5px 14px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--slate-500);
  transition: all 0.15s;
}
.dash-time-btn:hover {
  color: var(--slate-700);
}
.dash-time-btn.active {
  background: #fff;
  color: var(--slate-800);
  font-weight: 500;
  box-shadow: var(--shadow-sm);
}

/* ============== KPI ============== */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

/* ============== 图表 ============== */
.chart-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}
.chart-card {
  background: #fff;
  border: 1px solid var(--slate-200);
  border-radius: 12px;
  padding: 16px 18px;
  box-shadow: var(--shadow-sm);
  animation: chart-fade-in 0.4s ease-out backwards;
}
@keyframes chart-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.chart-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--slate-700);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.chart-card-title span {
  font-size: 11px;
  font-weight: 400;
  color: var(--slate-400);
}

/* ============== Bar chart ============== */
.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.bar-label {
  width: 84px;
  font-size: 12px;
  color: var(--slate-600);
  flex-shrink: 0;
}
.bar-track {
  flex: 1;
  height: 24px;
  background: var(--slate-100);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}
.bar-fill {
  height: 100%;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 10px;
  min-width: 8px;
  transition: width 0.9s cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
  overflow: hidden;
}
.bar-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.25) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  background-size: 200% 100%;
  animation: bar-shimmer 2.6s linear infinite;
}
@keyframes bar-shimmer {
  from {
    background-position: -100% 0;
  }
  to {
    background-position: 200% 0;
  }
}
.bar-fill-text {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  position: relative;
  z-index: 1;
  white-space: nowrap;
}

/* ============== Donut ============== */
.donut-wrap {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 4px 0 0 0;
}
.donut-svg {
  flex-shrink: 0;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.04));
}
.donut-seg {
  transition:
    stroke-dasharray 0.9s cubic-bezier(0.22, 1, 0.36, 1),
    stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1);
}
.donut-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.donut-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  transition:
    opacity 0.4s,
    transform 0.4s;
  animation: legend-in 0.5s ease-out backwards;
}
@keyframes legend-in {
  from {
    opacity: 0;
    transform: translateX(-6px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.donut-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}
.donut-legend-label {
  color: var(--slate-600);
  flex: 1;
}
.donut-legend-val {
  font-weight: 600;
  color: var(--slate-700);
}

/* ============== 表格 ============== */
.data-table {
  background: #fff;
  border: 1px solid var(--slate-200);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.data-table-head {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 0.8fr 1fr;
  padding: 10px 18px;
  background: var(--slate-50);
  border-bottom: 1px solid var(--slate-200);
  font-size: 12px;
  font-weight: 600;
  color: var(--slate-500);
}
.data-table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 0.8fr 1fr;
  padding: 12px 18px;
  border-bottom: 1px solid var(--slate-100);
  align-items: center;
  font-size: 13px;
  color: var(--slate-700);
  transition: background 0.12s;
  animation: row-in 0.4s ease-out backwards;
}
@keyframes row-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.data-table-row:last-child {
  border-bottom: none;
}
.data-table-row:hover {
  background: var(--slate-50);
}
.cell-question {
  color: var(--slate-700);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cell-duration {
  color: var(--slate-500);
  font-variant-numeric: tabular-nums;
}

/* ============== Tag ============== */
.model-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
}
.kb-status-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
}
.kb-status-tag.done {
  background: var(--green-l);
  color: var(--green);
}
.kb-status-tag.processing {
  background: var(--amber-l);
  color: var(--amber);
}
.kb-status-tag.failed {
  background: var(--red-l);
  color: var(--red);
}

/* ============== 响应式 ============== */
@media (max-width: 1100px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .chart-grid {
    grid-template-columns: 1fr;
  }
}
</style>

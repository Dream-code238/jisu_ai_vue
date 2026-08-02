<template>
  <div class="msg-bubble ai-bubble">
    <span class="content" v-html="renderedContent"></span>
    <StreamingCursor v-if="streaming" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import StreamingCursor from './StreamingCursor.vue'

const props = defineProps({
  content: { type: String, default: '' },
  streaming: { type: Boolean, default: false },
})

const renderedContent = computed(() => {
  if (!props.content) return ''
  let html = props.content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')

  // 高亮常见政策/服务承诺（蓝底标签）
  html = highlightPolicyTerms(html)
  // 加粗数值 + 单位
  html = html.replace(
    /(\d+(?:\.\d+)?)\s*(小时|分钟|天|元|￥|¥|页|g|kg|mm|cm|m|寸|英寸|W|mAh)/g,
    '<strong>$1$2</strong>',
  )
  // 加粗"综合...可达..."结论句
  html = html.replace(/(综合[\s\S]*?可达[\s\S]*?)(?=<br|$)/g, '<strong>$1</strong>')

  return html
})

function highlightPolicyTerms(html) {
  const terms = [
    '7天无理由退换',
    '7天无理由退货',
    '15天无理由退换',
    '15天无理由退货',
    '30天无理由退换',
    '30天无理由退货',
    '三包政策',
    '全国联保',
    '运费险',
    '假一赔十',
    '正品保证',
  ]
  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    html = html.replace(new RegExp(`(${escaped})`, 'g'), '<span class="policy-highlight">$1</span>')
  }
  return html
}
</script>

<style scoped>
.ai-bubble {
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.7;
  background: #fff;
  color: var(--slate-800);
  border: 1px solid var(--slate-200);
  border-bottom-left-radius: 4px;
  box-shadow: var(--shadow-sm);
  display: inline-block;
  max-width: 100%;
  word-break: break-word;
}
.content :deep(.inline-code) {
  background: var(--slate-100);
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 13px;
  font-family: 'Fira Code', 'Consolas', monospace;
}
.content :deep(.code-block) {
  background: var(--slate-900);
  color: var(--slate-200);
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'Fira Code', 'Consolas', monospace;
  overflow-x: auto;
  margin: 8px 0;
}
.content :deep(.policy-highlight) {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 6px;
  background: var(--blue-l);
  color: var(--blue);
  font-weight: 600;
  font-size: 13px;
  margin: 0 2px;
}
</style>

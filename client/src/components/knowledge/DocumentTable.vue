<template>
  <div class="kb-table">
    <div class="kb-table-head">
      <div>文件名</div>
      <div>类型</div>
      <div>分块数</div>
      <div>状态</div>
      <div>操作</div>
    </div>
    <div v-if="documents.length === 0" class="kb-table-empty">📁 暂无文档，请上传知识库文件</div>
    <div v-for="doc in documents" :key="doc.id" class="kb-table-row">
      <div class="kb-doc-icon">
        <span class="kb-doc-type" :style="getTypeStyle(doc.file_type)">{{ doc.file_type }}</span>
        <span>{{ doc.filename }}</span>
      </div>
      <div>{{ doc.file_type }}</div>
      <div>{{ doc.chunk_count || 0 }}</div>
      <div>
        <span class="kb-status-tag" :class="doc.status">
          {{ statusMap[doc.status] || doc.status }}
        </span>
      </div>
      <div>
        <button
          class="delete-btn"
          @click="$emit('delete', doc.id)"
          :disabled="doc.status === 'processing'"
        >
          删除
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  documents: { type: Array, default: () => [] },
})
defineEmits(['delete'])

const statusMap = {
  processing: '处理中',
  ready: '已就绪',
  failed: '失败',
}

const getTypeStyle = (ext) => {
  const map = {
    md: { bg: 'var(--blue-l)', color: 'var(--blue)' },
    txt: { bg: 'var(--slate-100)', color: 'var(--slate-600)' },
    pdf: { bg: 'var(--red-l)', color: 'var(--red)' },
    docx: { bg: 'var(--indigo-l)', color: 'var(--indigo)' },
  }
  return map[ext] || map.txt
}
</script>

<style scoped>
.kb-table {
  background: #fff;
  border: 1px solid var(--slate-200);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.kb-table-head {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 0.8fr;
  padding: 10px 16px;
  background: var(--slate-50);
  border-bottom: 1px solid var(--slate-200);
  font-size: 12px;
  font-weight: 600;
  color: var(--slate-500);
}
.kb-table-empty {
  padding: 48px 24px;
  text-align: center;
  font-size: 14px;
  color: var(--slate-400);
}
.kb-table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 0.8fr;
  padding: 12px 16px;
  border-bottom: 1px solid var(--slate-100);
  align-items: center;
  font-size: 13px;
  color: var(--slate-700);
}
.kb-table-row:last-child {
  border-bottom: none;
}
.kb-table-row:hover {
  background: var(--slate-50);
}
.kb-doc-icon {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.kb-doc-type {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}
.kb-status-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}
.kb-status-tag.ready {
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
.delete-btn {
  padding: 4px 12px;
  border: 1px solid var(--slate-200);
  border-radius: 6px;
  background: #fff;
  color: var(--red);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.delete-btn:hover {
  background: var(--red-l);
  border-color: var(--red-b);
}
.delete-btn:disabled {
  color: var(--slate-300);
  cursor: not-allowed;
}
</style>

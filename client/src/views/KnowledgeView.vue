<!--知识库管理页-->
<template>
  <div class="kb-page">
    <div class="kb-header">
      <h2>知识库管理</h2>
      <button class="btn btn-ghost btn-sm" @click="refresh" :disabled="uploading">🔄 刷新</button>
    </div>

    <div class="kb-stats">
      <StatCard label="文档总数" :value="stats.total" icon="📁" color="blue" />
      <StatCard label="已就绪" :value="stats.ready" icon="✅" color="teal" />
      <StatCard label="分块数" :value="stats.chunks" icon="🧩" color="purple" />
      <StatCard label="处理中" :value="processingCount" icon="⏳" color="amber" />
    </div>

    <UploadZone :uploading="uploading" :progress="uploadProgress" @upload="handleUpload" />
    <div v-if="error" class="error-tip">⚠️ {{ error }}</div>

    <div style="margin-top: 20px">
      <DocumentTable :documents="documents" @delete="handleDelete" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useKnowledge } from '../composables/useKnowledge.js'
import StatCard from '../components/knowledge/StatCard.vue'
import UploadZone from '../components/knowledge/UploadZone.vue'
import DocumentTable from '../components/knowledge/DocumentTable.vue'

const {
  documents,
  stats,
  uploading,
  uploadProgress,
  error,
  loadDocuments,
  loadStats,
  uploadDocument,
  deleteDocument,
  refresh,
} = useKnowledge()

const processingCount = computed(() => Math.max(0, stats.value.total - stats.value.ready))

onMounted(() => {
  loadDocuments()
  loadStats()
})

const handleUpload = async (file) => {
  await uploadDocument(file)
}

const handleDelete = async (id) => {
  if (confirm('确定删除该文档吗？关联的向量数据也会被清除。')) {
    await deleteDocument(id)
  }
}
</script>

<style scoped>
.kb-page {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
}
.kb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.kb-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--slate-800);
}
.kb-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.error-tip {
  margin-top: 8px;
  padding: 8px 14px;
  border-radius: 8px;
  background: var(--red-l);
  color: var(--red);
  font-size: 13px;
}
@media (max-width: 900px) {
  .kb-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

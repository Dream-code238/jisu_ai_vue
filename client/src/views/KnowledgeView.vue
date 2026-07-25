<template>
  <div class="knowledge-page">
    <!-- KPI 卡片 -->
    <div class="kpi-grid">
      <StatCard label="文档总数" :value="stats.total" icon="📁" color="blue" />
      <StatCard label="已就绪" :value="stats.ready" icon="✅" color="teal" />
      <StatCard label="分块数" :value="stats.chunks" icon="🧩" color="purple" />
      <StatCard label="处理中" :value="stats.total - stats.ready" icon="⏳" color="amber" />
    </div>

    <!-- 上传区 -->
    <UploadZone :uploading="uploading" :progress="uploadProgress" @upload="handleUpload" />

    <!-- 文档列表 -->
    <DocumentTable :documents="documents" @delete="handleDelete" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useKnowledge } from '../composables/useKnowledge.js'
import StatCard from '../components/knowledge/StatCard.vue'
import UploadZone from '../components/knowledge/UploadZone.vue'
import DocumentTable from '../components/knowledge/DocumentTable.vue'

const {
  documents,
  stats,
  uploading,
  uploadProgress,
  loadDocuments,
  loadStats,
  uploadDocument,
  deleteDocument,
} = useKnowledge()

onMounted(() => {
  loadDocuments()
  loadStats()
})

const handleUpload = async (file) => {
  await uploadDocument(file)
}

const handleDelete = async (id) => {
  await deleteDocument(id)
}
</script>

<style scoped>
.knowledge-page {
  padding: 24px 32px;
  max-width: 1100px;
  margin: 0 auto;
}
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
</style>

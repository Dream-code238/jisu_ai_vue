<template>
  <div class="doc-table-wrapper">
    <table class="doc-table">
      <thead>
        <tr>
          <th>文件名</th>
          <th>类型</th>
          <th>分块数</th>
          <th>状态</th>
          <th>上传时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="doc in documents" :key="doc.id">
          <td>{{ doc.filename }}</td>
          <td>
            <span class="file-type">{{ doc.file_type }}</span>
          </td>
          <td>{{ doc.chunk_count }}</td>
          <td>
            <span class="status-badge" :class="doc.status">{{
              statusMap[doc.status] || doc.status
            }}</span>
          </td>
          <td>{{ formatTime(doc.uploaded_at) }}</td>
          <td><button class="delete-btn" @click="$emit('delete', doc.id)">删除</button></td>
        </tr>
        <tr v-if="documents.length === 0">
          <td colspan="6" class="empty">暂无文档，请上传</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({ documents: { type: Array, default: () => [] } })
defineEmits(['delete'])

const statusMap = { processing: '处理中', ready: '已就绪', failed: '失败' }

const formatTime = (iso) => {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style lang="less" scoped>
.doc-table-wrapper {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}
.doc-table {
  width: 100%;
  border-collapse: collapse;
}
.doc-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.doc-table td {
  padding: 12px 16px;
  font-size: 13px;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
}
.file-type {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #475569;
}
.status-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
}
.status-badge.ready {
  background: #f0fdfa;
  color: #0f766e;
}
.status-badge.processing {
  background: #fffbeb;
  color: #d97706;
}
.status-badge.failed {
  background: #fef2f2;
  color: #ef4444;
}
.delete-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 13px;
}
.delete-btn:hover {
  text-decoration: underline;
}
.empty {
  text-align: center;
  color: #94a3b8;
  padding: 32px;
}
</style>

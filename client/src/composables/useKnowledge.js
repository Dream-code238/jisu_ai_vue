import { ref } from 'vue'

const API_BASE = 'http://localhost:3000/api/knowledge'

export function useKnowledge() {
  const documents = ref([])
  const stats = ref({ total: 0, chunks: 0, ready: 0 })
  const uploading = ref(false)
  const uploadProgress = ref(0)

  const loadDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE}/documents`)
      documents.value = await res.json()
    } catch (err) {
      console.error('加载文档列表失败:', err)
    }
  }

  const loadStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`)
      stats.value = await res.json()
    } catch (err) {
      console.error('加载统计失败:', err)
    }
  }

  const uploadDocument = async (file) => {
    if (!file) return
    uploading.value = true
    uploadProgress.value = 0

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      })

      uploadProgress.value = 100
      const data = await res.json()

      // 刷新列表和统计
      await loadDocuments()
      await loadStats()

      return data
    } catch (err) {
      console.error('上传失败:', err)
      return null
    } finally {
      uploading.value = false
    }
  }

  const deleteDocument = async (id) => {
    try {
      await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' })
      documents.value = documents.value.filter((d) => d.id !== id)
      await loadStats()
    } catch (err) {
      console.error('删除失败:', err)
    }
  }

  return {
    documents,
    stats,
    uploading,
    uploadProgress,
    loadDocuments,
    loadStats,
    uploadDocument,
    deleteDocument,
  }
}

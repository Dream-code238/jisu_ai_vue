/**
 * 知识库管理 composable
 * 负责文档列表、上传、删除、统计
 * 与后端 /api/knowledge/* 交互
 */
import { ref } from 'vue'

const API_BASE = 'http://localhost:3000/api/knowledge'

export function useKnowledge() {
  const documents = ref([])
  const stats = ref({ total: 0, chunks: 0, ready: 0 })
  const uploading = ref(false)
  const uploadProgress = ref(0)
  const error = ref('')

  /**
   * 加载文档列表
   */
  const loadDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE}/documents`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      documents.value = await res.json()
    } catch (err) {
      console.error('加载文档列表失败:', err.message)
    }
  }

  /**
   * 加载统计信息
   */
  const loadStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      stats.value = {
        total: parseInt(data.total) || 0,
        chunks: parseInt(data.chunks) || 0,
        ready: parseInt(data.ready) || 0,
      }
    } catch (err) {
      console.error('加载统计失败:', err.message)
    }
  }

  /**
   * 上传文档
   * @param {File} file
   * @returns {Promise<Object|null>}
   */
  const uploadDocument = async (file) => {
    if (!file) return null
    uploading.value = true
    uploadProgress.value = 0
    error.value = ''

    try {
      const formData = new FormData()
      formData.append('file', file)

      // 模拟上传进度（fetch 不支持上传进度，用定时器模拟）
      const progressTimer = setInterval(() => {
        if (uploadProgress.value < 90) {
          uploadProgress.value += 10
        }
      }, 200)

      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressTimer)
      uploadProgress.value = 100

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `HTTP ${res.status}`)
      }

      const data = await res.json()

      // 刷新列表和统计
      await loadDocuments()
      await loadStats()

      return data
    } catch (err) {
      error.value = `上传失败: ${err.message}`
      console.error(error.value)
      return null
    } finally {
      uploading.value = false
      // 延迟重置进度条
      setTimeout(() => {
        uploadProgress.value = 0
      }, 500)
    }
  }

  /**
   * 删除文档
   * @param {number} id
   */
  const deleteDocument = async (id) => {
    try {
      await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' })
      documents.value = documents.value.filter((d) => d.id !== id)
      await loadStats()
    } catch (err) {
      console.error('删除失败:', err.message)
    }
  }

  /**
   * 刷新所有数据
   */
  const refresh = async () => {
    await Promise.all([loadDocuments(), loadStats()])
  }

  return {
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
  }
}

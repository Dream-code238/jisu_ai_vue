/**
 * 会话管理 composable
 * 负责会话列表的加载、创建、选择、删除
 * 与后端 /api/chat/session/* 和 /api/chat/history/* 交互
 */
import { ref } from 'vue'

const API_BASE = 'http://localhost:3000/api/chat'

export function useSession() {
  const sessions = ref([])
  const currentSessionId = ref('')
  const loading = ref(false)

  /**
   * 加载会话列表
   * 从后端获取所有会话，自动选中第一个
   */
  const loadSessions = async () => {
    loading.value = true
    try {
      const res = await fetch(`${API_BASE}/session/list`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      sessions.value = data.map((s) => ({
        id: s.session_id,
        title: s.title,
        color: 'blue',
        time: formatTime(s.created_at),
      }))
      // 自动选中第一个会话
      if (sessions.value.length > 0) {
        await selectSession(sessions.value[0].id)
      }
    } catch (err) {
      console.error('加载会话列表失败:', err.message)
      // 优雅降级：后端不可用时保持空列表
    } finally {
      loading.value = false
    }
  }

  /**
   * 选择会话
   * @param {string} sessionId
   * @returns {Promise<string>} 返回 sessionId 供调用方链式调用
   */
  const selectSession = async (sessionId) => {
    currentSessionId.value = sessionId
    return sessionId
  }

  /**
   * 创建新会话
   * @returns {Promise<string|null>} 新会话 ID，失败返回 null
   */
  const createSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      sessions.value.unshift({
        id: data.sessionId,
        title: data.title,
        color: 'blue',
        time: '刚刚',
      })
      currentSessionId.value = data.sessionId
      return data.sessionId
    } catch (err) {
      console.error('创建会话失败:', err.message)
      return null
    }
  }

  /**
   * 删除会话
   * @param {string} sessionId
   */
  const deleteSession = async (sessionId) => {
    try {
      const res = await fetch(`${API_BASE}/session/${sessionId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      sessions.value = sessions.value.filter((s) => s.id !== sessionId)
      if (currentSessionId.value === sessionId) {
        currentSessionId.value = sessions.value[0]?.id || ''
      }
    } catch (err) {
      console.error('删除会话失败:', err.message)
      throw err
    }
  }

  return {
    sessions,
    currentSessionId,
    loading,
    loadSessions,
    selectSession,
    createSession,
    deleteSession,
  }
}

/**
 * 格式化时间为相对时间
 * @param {string} iso - ISO 8601 时间字符串
 * @returns {string}
 */
function formatTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min}分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}小时前`
  return `${Math.floor(hr / 24)}天前`
}

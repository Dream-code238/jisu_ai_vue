/**
 * 会话管理 composable
 * @returns {{ sessions, currentSessionId, loadSessions, selectSession, createSession, deleteSession }}
 */
import { ref } from 'vue'

const API_BASE = 'http://localhost:3000/api/chat'

export function useSession() {
  const sessions = ref([])
  const currentSessionId = ref('')

  const loadSessions = async () => {
    try {
      const res = await fetch(`${API_BASE}/session/list`)
      const data = await res.json()

      if (!Array.isArray(data)) {
        throw new Error('会话列表接口返回格式不正确')
      }

      sessions.value = Array.isArray(data)
        ? data.map((s) => ({
            id: s.session_id,
            title: s.title,
            color: 'blue',
            time: formatTime(s.created_at),
          }))
        : []
      if (sessions.value.length > 0) {
        await selectSession(sessions.value[0].id)
      }
    } catch (err) {
      console.error('加载会话失败:', err)
    }
  }

  const selectSession = async (sessionId) => {
    currentSessionId.value = sessionId
    return sessionId
  }

  const createSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      sessions.value.unshift({ id: data.sessionId, title: data.title, color: 'blue', time: '刚刚' })
      currentSessionId.value = data.sessionId
      return data.sessionId
    } catch (err) {
      console.error('创建会话失败:', err)
      return null
    }
  }

  const deleteSession = async (sessionId) => {
    try {
      await fetch(`${API_BASE}/session/${sessionId}`, { method: 'DELETE' })
      sessions.value = sessions.value.filter((s) => s.id !== sessionId)
      if (currentSessionId.value === sessionId) {
        currentSessionId.value = sessions.value[0]?.id || ''
      }
    } catch (err) {
      console.error('删除会话失败:', err)
    }
  }

  return { sessions, currentSessionId, loadSessions, selectSession, createSession, deleteSession }
}

function formatTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min}分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}小时前`
  return `${Math.floor(hr / 24)}天前`
}

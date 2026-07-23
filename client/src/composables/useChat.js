import { ref, nextTick } from 'vue';

const API_BASE = 'http://localhost:3000/api';

export function useChat() {
  const messages   = ref([]);
  const streaming  = ref(false);
  const streamText = ref('');
  const error      = ref('');

  const sendMessage = async (userInput, scrollCallback) => {
    if (!userInput.trim() || streaming.value) return;

    messages.value.push({ role: 'user', content: userInput });
    scrollCallback?.();

    streaming.value  = true;
    streamText.value = '';
    error.value      = '';

    try {
      const history = messages.value
        .slice(-10)
        .map(({ role, content }) => ({ role, content }));

      const response = await fetch(`${API_BASE}/chat/stream`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: userInput, history }),
      });

      const reader  = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder
          .decode(value, { stream: true })
          .split('\n')
          .filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.error)   { error.value = parsed.error; break; }
            if (parsed.done)    break;
            if (parsed.content) {
              streamText.value += parsed.content;
              await nextTick();
              scrollCallback?.();
            }
          } catch {}
        }
      }

      messages.value.push({ role: 'assistant', content: streamText.value });
    } catch (err) {
      error.value = `请求失败：${err.message}`;
    } finally {
      streaming.value  = false;
      streamText.value = '';
    }
  };

  const clearMessages = () => {
    messages.value = [];
    error.value    = '';
  };

  return { messages, streaming, streamText, error, sendMessage, clearMessages };
}
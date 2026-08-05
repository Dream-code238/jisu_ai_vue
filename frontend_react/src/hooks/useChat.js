import { useState, useEffect, useRef } from "react";

const API_BASE = "http://localhost:3000/api";

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState("");
  const messagesRef = useRef(null);

  // 自动滚动到底部（替代 Vue 的 nextTick + scrollCallback）
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [streamText, messages]);

  const sendMessage = async (userInput) => {
    if (!userInput.trim() || streaming) return;

    setError("");
    setMessages((prev) => [...prev, { role: "user", content: userInput }]);

    setStreaming(true);
    setStreamText("");

    // ⚠️ 用局部变量累积文本，不要在 setStreamText 的 updater 里调用 setMessages
    // 否则 React 18 StrictMode 会执行 updater 两次，导致 assistant 消息重复
    let accumulatedText = "";

    try {
      const history = messages
        .slice(-10)
        .map(({ role, content }) => ({ role, content }));

      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userInput, history }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder
          .decode(value, { stream: true })
          .split("\n")
          .filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.error) {
              setError(parsed.error);
              break;
            }
            if (parsed.done) break;
            if (parsed.content) {
              // 函数式更新，避免闭包陷阱（这是纯函数，StrictMode 重复调用没问题）
              accumulatedText += parsed.content;
              setStreamText((prev) => prev + parsed.content);
            }
          } catch {}
        }
      }

      // ⚠️ 把最终消息提交到 messages 列表
      // 不要写在 setStreamText 的 updater 函数里！
      // 错误写法：setStreamText((t) => { setMessages([...prev, {content: t}]); return '' })
      // 上面这种写法在 React 18 StrictMode 下会导致消息被添加两次
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: accumulatedText },
      ]);
      setStreamText("");
    } catch (err) {
      setError(`请求失败：${err.message}`);
    } finally {
      setStreaming(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setError("");
  };

  return {
    messages,
    streaming,
    streamText,
    error,
    messagesRef,
    sendMessage,
    clearMessages,
  };
}

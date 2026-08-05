import { useState, useEffect, useRef } from "react";

const API_BASE = "http://localhost:3000/api";

export function useRag() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const ask = async (question) => {
    if (!question.trim() || loading) return;

    setError("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);

    setLoading(true);

    const assistantIndex = messages.length + 1;
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", sources: [], loading: true },
    ]);

    try {
      const response = await fetch(`${API_BASE}/rag/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let currentSources = [];

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

            if (parsed.type === "sources") {
              currentSources = parsed.sources;
              setMessages((prev) => {
                const updated = [...prev];
                updated[assistantIndex] = {
                  ...updated[assistantIndex],
                  sources: currentSources,
                };
                return updated;
              });
            }

            if (parsed.type === "answer") {
              setMessages((prev) => {
                const updated = [...prev];
                updated[assistantIndex] = {
                  role: "assistant",
                  content: parsed.content,
                  sources: currentSources,
                  loading: false,
                };
                return updated;
              });
            }

            if (parsed.type === "error") {
              setMessages((prev) => {
                const updated = [...prev];
                updated[assistantIndex] = {
                  role: "assistant",
                  content: parsed.content,
                  sources: [],
                  loading: false,
                };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (err) {
      setError(`请求失败：${err.message}`);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setError("");
  };

  return { messages, loading, error, messagesRef, ask, clearMessages };
}

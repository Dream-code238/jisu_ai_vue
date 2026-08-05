import { useState, useEffect, useRef } from "react";

const API_BASE = "http://localhost:3000/api";

export function useAgent() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState("");
  const messagesRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, steps]);

  const sendMessage = async (userInput) => {
    if (!userInput.trim() || loading) return;

    setError("");
    setSteps([]);
    setMessages((prev) => [...prev, { role: "user", content: userInput }]);

    setLoading(true);

    // 占位消息
    const assistantIndex = messages.length + 1;
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", thinking: true },
    ]);

    try {
      const history = messages
        .slice(-10)
        .filter((m) => !m.thinking)
        .map(({ role, content }) => ({ role, content }));

      const response = await fetch(`${API_BASE}/agent/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userInput, history }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      const currentSteps = [];

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

            if (parsed.type === "step") {
              currentSteps.push({
                tool: parsed.tool,
                toolInput: parsed.toolInput,
                observation: parsed.observation,
              });
              setSteps([...currentSteps]);
            }

            if (parsed.type === "answer") {
              setMessages((prev) => {
                const updated = [...prev];
                updated[assistantIndex] = {
                  role: "assistant",
                  content: parsed.content,
                  steps: [...currentSteps],
                };
                return updated;
              });
            }

            if (parsed.type === "done") {
              setSteps([]);
            }

            if (parsed.type === "error") {
              setMessages((prev) => {
                const updated = [...prev];
                updated[assistantIndex] = {
                  role: "assistant",
                  content: parsed.content,
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
    setSteps([]);
    setError("");
  };

  return {
    messages,
    loading,
    steps,
    error,
    messagesRef,
    sendMessage,
    clearMessages,
  };
}

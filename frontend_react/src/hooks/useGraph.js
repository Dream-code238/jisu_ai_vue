import { useState, useEffect, useRef } from "react";

const API_BASE = "http://localhost:3000/api";

export const NODE_LABELS = {
  intentRouter: "意图识别",
  orderAgent: "订单查询",
  ragNode: "知识库检索",
  generalChat: "通用对话",
  answerSynthesizer: "整理回答",
};

export const INTENT_LABELS = {
  order: "订单查询",
  knowledge: "知识库问答",
  general: "通用对话",
};

export function useGraph() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentNode, setCurrentNode] = useState("");
  const [error, setError] = useState("");
  const messagesRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, currentNode]);

  const sendMessage = async (userInput) => {
    if (!userInput.trim() || loading) return;

    setError("");
    setCurrentNode("");
    setMessages((prev) => [...prev, { role: "user", content: userInput }]);

    setLoading(true);

    const assistantIndex = messages.length + 1;
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "",
        nodes: [],
        intent: "",
        steps: [],
        loading: true,
      },
    ]);

    try {
      const history = messages
        .slice(-8)
        .filter((m) => !m.loading)
        .map(({ role, content }) => ({ role, content }));

      const response = await fetch(`${API_BASE}/graph/stream`, {
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

            if (parsed.type === "node") {
              setCurrentNode(NODE_LABELS[parsed.node] || parsed.node);
              setMessages((prev) => {
                const updated = [...prev];
                const msg = updated[assistantIndex];
                if (!msg.nodes.includes(parsed.node)) {
                  msg.nodes = [...msg.nodes, parsed.node];
                  if (parsed.intent) {
                    msg.intent = INTENT_LABELS[parsed.intent] || parsed.intent;
                  }
                }
                return [...updated];
              });
            }

            if (parsed.type === "steps") {
              setMessages((prev) => {
                const updated = [...prev];
                updated[assistantIndex].steps = parsed.steps;
                return [...updated];
              });
            }

            if (parsed.type === "answer") {
              setMessages((prev) => {
                const updated = [...prev];
                updated[assistantIndex].content = parsed.content;
                updated[assistantIndex].loading = false;
                return [...updated];
              });
              setCurrentNode("");
            }

            if (parsed.type === "error") {
              setMessages((prev) => {
                const updated = [...prev];
                updated[assistantIndex].content = parsed.content;
                updated[assistantIndex].loading = false;
                return [...updated];
              });
              setCurrentNode("");
            }
          } catch {}
        }
      }
    } catch (err) {
      setError(`请求失败：${err.message}`);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
      setCurrentNode("");
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setCurrentNode("");
    setError("");
  };

  return {
    messages,
    loading,
    currentNode,
    error,
    messagesRef,
    sendMessage,
    clearMessages,
  };
}

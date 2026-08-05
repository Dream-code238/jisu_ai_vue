import { useState } from "react";
import { useAgent } from "../../hooks/useAgent.js";
import "./index.less";

export default function AgentPage() {
  const {
    messages,
    loading,
    steps,
    error,
    messagesRef,
    sendMessage,
    clearMessages,
  } = useAgent();
  const [inputText, setInputText] = useState("");

  const quickQuestions = [
    "查一下订单 ORD-001 的状态",
    "订单 ORD-001 的快递到哪了？",
    "我有哪些订单？",
  ];

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || loading) return;
    setInputText("");
    await sendMessage(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuick = (q) => {
    setInputText(q);
    handleSend();
  };

  const formatInput = (input) => {
    if (!input) return "";
    return Object.values(input).join(" · ");
  };

  return (
    <div className="agent-page">
      <header className="chat-header">
        <div className="header-left">
          <div className="avatar">购</div>
          <div>
            <h1>极速购智能客服（Agent 模式）</h1>
            <span className={`status ${!loading ? "active" : ""}`}>
              {loading ? "思考中..." : "在线"}
            </span>
          </div>
        </div>
        <button className="clear-btn" onClick={clearMessages}>
          清空
        </button>
      </header>

      <main className="messages-wrap" ref={messagesRef}>
        {messages.length === 0 && (
          <div className="welcome">
            <p>您好，我是极速购智能客服小购。</p>
            <p>我可以帮您查询订单状态和物流信息，请提供您的订单号。</p>
            <div className="quick-btns">
              {quickQuestions.map((q) => (
                <button key={q} onClick={() => handleQuick(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`message-row ${msg.role}`}>
            <div className="avatar-sm">{msg.role === "user" ? "我" : "购"}</div>
            <div className="message-content">
              {msg.steps && msg.steps.length > 0 && (
                <div className="steps-wrap">
                  {msg.steps.map((step, si) => (
                    <div key={si} className="step-item">
                      <span className="step-label">调用工具</span>
                      <span className="step-tool">{step.tool}</span>
                      <span className="step-input">
                        {formatInput(step.toolInput)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {msg.thinking ? (
                <div className="thinking">
                  <span className="dot-1">.</span>
                  <span className="dot-2">.</span>
                  <span className="dot-3">.</span>
                </div>
              ) : (
                <div className="bubble">{msg.content}</div>
              )}
            </div>
          </div>
        ))}

        {loading && steps.length > 0 && (
          <div className="message-row assistant">
            <div className="avatar-sm">购</div>
            <div className="message-content">
              <div className="steps-wrap">
                {steps.map((step, si) => (
                  <div key={si} className="step-item">
                    <span className="step-label">调用工具</span>
                    <span className="step-tool">{step.tool}</span>
                    <span className="step-input">
                      {formatInput(step.toolInput)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="thinking">
                <span className="dot-1">.</span>
                <span className="dot-2">.</span>
                <span className="dot-3">.</span>
              </div>
            </div>
          </div>
        )}

        {error && <div className="error-tip">{error}</div>}
      </main>

      <footer className="input-area">
        <textarea
          value={inputText}
          placeholder="输入消息，Enter 发送，Shift+Enter 换行"
          disabled={loading}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows="1"
        />
        <button
          className="send-btn"
          disabled={loading || !inputText.trim()}
          onClick={handleSend}
        >
          {loading ? "思考中..." : "发送"}
        </button>
      </footer>
    </div>
  );
}

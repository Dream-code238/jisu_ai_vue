import { useState } from "react";
import { useGraph, NODE_LABELS } from "../../hooks/useGraph";
import "./index.less";

export default function GraphPage() {
  const {
    messages,
    loading,
    currentNode,
    error,
    messagesRef,
    sendMessage,
    clearMessages,
  } = useGraph();
  const [inputText, setInputText] = useState("");

  const quickQuestions = [
    "订单 ORD-001 发货了吗？",
    "蓝牙耳机怎么保修？",
    "退款需要多少天？",
    "你好",
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

  const formatStepInput = (input) => {
    if (!input) return "";
    return Object.values(input).join(" · ");
  };

  return (
    <div className="graph-page">
      <header className="chat-header">
        <div className="header-left">
          <div className="avatar">购</div>
          <div>
            <h1>极速购智能客服中枢</h1>
            <span className="subtitle">
              {loading ? currentNode || "处理中..." : "多 Agent 协作模式"}
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
            <p>您好，我是极速购智能客服中枢。</p>
            <p>我会自动判断您的问题类型，调用最合适的模块为您服务。</p>
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
              {msg.nodes && msg.nodes.length > 0 && (
                <div className="flow-trace">
                  {msg.nodes.map((node, ni) => (
                    <span key={ni}>
                      <span className="node-name">
                        {NODE_LABELS[node] || node}
                      </span>
                      {ni < msg.nodes.length - 1 && (
                        <span className="arrow">→</span>
                      )}
                    </span>
                  ))}
                  {msg.intent && (
                    <span className="intent-tag">{msg.intent}</span>
                  )}
                </div>
              )}

              {msg.steps && msg.steps.length > 0 && (
                <div className="steps-wrap">
                  {msg.steps.map((step, si) => (
                    <div key={si} className="step-item">
                      <span className="step-tool">{step.tool}</span>
                      <span className="step-sep">·</span>
                      <span className="step-input">
                        {formatStepInput(step.input)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {msg.loading ? (
                <div className="bubble loading-bubble">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              ) : (
                <div className="bubble">{msg.content}</div>
              )}
            </div>
          </div>
        ))}

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
          {loading ? "处理中..." : "发送"}
        </button>
      </footer>
    </div>
  );
}

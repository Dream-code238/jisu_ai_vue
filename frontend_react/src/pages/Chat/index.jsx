import { useState, useRef } from "react";
import { useChat } from "../../hooks/useChat.js";
import "./index.less";

export default function ChatPage() {
  const {
    messages,
    streaming,
    streamText,
    error,
    messagesRef,
    sendMessage,
    clearMessages,
  } = useChat();
  const [inputText, setInputText] = useState("");
  const inputRef = useRef(null);

  const quickQuestions = [
    "我的订单在哪里？",
    "如何申请退款？",
    "物流多久到？",
    "如何联系客服？",
  ];

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || streaming) return;
    setInputText("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    await sendMessage(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = (e) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const handleQuick = (q) => {
    setInputText(q);
    handleSend();
  };

  return (
    <div className="chat-page">
      <header className="chat-header">
        <div className="header-left">
          <div className="avatar">购</div>
          <div className="header-info">
            <h1>极速购智能客服</h1>
            <span className={`status ${!streaming ? "active" : ""}`}>
              {streaming ? "回复中..." : "在线"}
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
            <div className="welcome-icon">👋</div>
            <p>您好！我是极速购智能客服小购</p>
            <p className="sub">有任何购物、订单、物流问题都可以问我～</p>
            <div className="quick-questions">
              {quickQuestions.map((q) => (
                <button key={q} onClick={() => handleQuick(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`message-row ${msg.role}`}>
            <div className="bubble-wrap">
              <div className="avatar-sm">
                {msg.role === "user" ? "我" : "购"}
              </div>
              <div className="bubble">
                <p>{msg.content}</p>
              </div>
            </div>
          </div>
        ))}

        {streaming && (
          <div className="message-row assistant">
            <div className="bubble-wrap">
              <div className="avatar-sm">购</div>
              <div className="bubble streaming">
                <p>
                  {streamText || "\u00A0"}
                  <span className="cursor">▋</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {error && <div className="error-tip">⚠️ {error}</div>}
      </main>

      <footer className="input-area">
        <div className="input-wrap">
          <textarea
            value={inputText}
            ref={inputRef}
            placeholder="输入消息，Enter 发送，Shift+Enter 换行"
            disabled={streaming}
            onChange={(e) => {
              setInputText(e.target.value);
              autoResize(e);
            }}
            onKeyDown={handleKeyDown}
            rows="1"
          />
          <button
            className={`send-btn ${streaming ? "loading" : ""}`}
            disabled={streaming || !inputText.trim()}
            onClick={handleSend}
          >
            {streaming ? (
              <span className="dot-loading">
                <i />
                <i />
                <i />
              </span>
            ) : (
              "发送"
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}

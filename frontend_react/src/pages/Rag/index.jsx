import { useState } from "react";
import { useRag } from "../../hooks/useRag.js";
import "./index.less";

export default function RagPage() {
  const { messages, loading, error, messagesRef, ask, clearMessages } =
    useRag();
  const [inputText, setInputText] = useState("");

  const quickQuestions = [
    "蓝牙耳机 X1 Pro 的续航怎么样？",
    "商品可以退货吗？",
    "机械键盘保修多久？",
    "退款需要多少天？",
  ];

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || loading) return;
    setInputText("");
    await ask(text);
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

  return (
    <div className="rag-page">
      <header className="chat-header">
        <div className="header-left">
          <div className="avatar">购</div>
          <div>
            <h1>极速购知识库问答</h1>
            <span className="subtitle">基于商品手册和售后政策</span>
          </div>
        </div>
        <button className="clear-btn" onClick={clearMessages}>
          清空
        </button>
      </header>

      <main className="messages-wrap" ref={messagesRef}>
        {messages.length === 0 && (
          <div className="welcome">
            <p>您好，我可以回答关于商品规格、价格、售后政策等问题。</p>
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
              {msg.loading ? (
                <div className="bubble loading-bubble">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              ) : (
                <div className="bubble">{msg.content}</div>
              )}
              {msg.sources && msg.sources.length > 0 && (
                <div className="sources-wrap">
                  <span className="sources-label">参考来源</span>
                  {msg.sources.map((src, si) => (
                    <span key={si} className="source-tag">
                      {src.source}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {error && <div className="error-tip">{error}</div>}
      </main>

      <footer className="input-area">
        <textarea
          value={inputText}
          placeholder="输入问题，Enter 发送"
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
          {loading ? "查询中..." : "发送"}
        </button>
      </footer>
    </div>
  );
}

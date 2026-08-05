import { Routes, Route, Link, useLocation } from "react-router-dom";
import ChatPage from "./pages/Chat/index.jsx";
import AgentPage from "./pages/Agent/index.jsx";
import RagPage from "./pages/Rag/index.jsx";
import GraphPage from "./pages/Graph/index.jsx";

function App() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "基础对话" },
    { path: "/agent", label: "订单查询" },
    { path: "/rag", label: "知识库" },
    { path: "/graph", label: "智能中枢" },
  ];

  return (
    <div className="app-container">
      <nav className="global-nav">
        <span className="nav-brand">极速购 AI 客服</span>
        <div className="nav-links">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={location.pathname === item.path ? "active" : ""}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<ChatPage />} />
        <Route path="/agent" element={<AgentPage />} />
        <Route path="/rag" element={<RagPage />} />
        <Route path="/graph" element={<GraphPage />} />
      </Routes>
    </div>
  );
}

export default App;

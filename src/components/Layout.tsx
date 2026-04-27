import { NavLink, Outlet, useLocation } from "react-router-dom";
import { defaultTool, groupedTools, tools } from "../data/tools";

const railItems = [
  { label: "电商首页", path: `/tools/${defaultTool.slug}` },
  { label: "AI商品图", path: `/tools/${defaultTool.slug}` },
  { label: "详情页", path: "/my/tasks" },
  { label: "短视频", path: "/my/tasks" },
  { label: "图片日作", path: "/my/tasks" },
  { label: "POD印花", path: "/my/tasks" },
  { label: "更多工具", path: "/my/tasks" }
];

export const Layout = () => {
  const location = useLocation();
  const currentTool = tools.find((item) => location.pathname.includes(item.slug)) ?? defaultTool;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">创</div>
          <div className="brand-text">
            <strong>创客贴</strong>
            <span>AI 电商</span>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="credit-pill" type="button">
            <span className="credit-dot" />
            20
          </button>
          <button className="upgrade-pill" type="button">
            开通会员
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="rail">
          <nav className="rail-nav">
            {railItems.map((item) => (
              <NavLink
                key={item.label}
                className={({ isActive }) => `rail-link${isActive ? " active" : ""}`}
                to={item.path}
              >
                <span className="rail-icon" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <NavLink className="rail-user" to="/my/tasks">
            <span className="rail-icon" />
            我的
          </NavLink>
        </aside>

        <aside className="tool-sidebar">
          <div className="tool-sidebar-section">
            <div className="tool-sidebar-title">AI商拍图</div>
            <div className="tool-group-list">
              {groupedTools["AI商品图"]?.map((tool) => (
                <NavLink
                  key={tool.slug}
                  className={({ isActive }) => `tool-link${isActive ? " active" : ""}`}
                  to={`/tools/${tool.slug}`}
                >
                  {tool.shortName}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="tool-sidebar-section">
            <div className="tool-sidebar-title">AI快营销</div>
            <div className="tool-group-list">
              {groupedTools["AI快营销"]?.map((tool) => (
                <NavLink
                  key={tool.slug}
                  className={({ isActive }) => `tool-link${isActive ? " active" : ""}`}
                  to={`/tools/${tool.slug}`}
                >
                  {tool.shortName}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="tool-sidebar-section">
            <div className="tool-sidebar-title">更多能力</div>
            <div className="tool-group-list">
              <NavLink className="tool-link" to="/my/tasks">
                AI换背景
              </NavLink>
              <NavLink className="tool-link" to="/my/tasks">
                去水印
              </NavLink>
            </div>
          </div>

          <div className="tool-sidebar-footnote">
            <span>当前工具</span>
            <strong>{currentTool.name}</strong>
          </div>
        </aside>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

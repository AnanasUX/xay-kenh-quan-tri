import { useState } from "react";
import { NavLink, Outlet, useLocation, useOutletContext } from "react-router";
import { navItems } from "./data";
import { Icon } from "./ui";

type CmsContext = { notify: (message: string) => void };

export function useCms() {
  return useOutletContext<CmsContext>();
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState("");
  const location = useLocation();

  const currentPage =
    navItems.find((item) => item.path === location.pathname)?.label ?? "Cấu hình trang";

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}>
        <div className="brand">
          <span className="brand-symbol">A</span>
          <span>aurora</span>
          <small>STUDIO</small>
        </div>
        <button
          aria-label="Đóng menu"
          className="icon-button sidebar-close"
          onClick={() => setSidebarOpen(false)}
        >
          <Icon name="close" />
        </button>
        <nav aria-label="Điều hướng quản trị">
          <span className="nav-caption">QUẢN TRỊ WEBSITE</span>
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
              end={item.path === "/"}
              key={item.path}
              onClick={() => setSidebarOpen(false)}
              to={item.path}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.badge && <b>{item.badge}</b>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a
            className="site-preview"
            href="https://ananasux.github.io/tre-tu-ky-responsive/"
            rel="noopener noreferrer"
            target="_blank"
          >
            <span><Icon name="eye" size={17} /></span>
            <span><strong>Xem trang chính</strong><small>tre-tu-ky-responsive</small></span>
            <Icon name="chevron" size={15} />
          </a>
          <div className="profile">
            <span className="avatar avatar--admin">HL</span>
            <span><strong>Hoàng Linh</strong><small>Quản trị viên</small></span>
            <button aria-label="Tùy chọn tài khoản"><Icon name="more" size={18} /></button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <button className="backdrop" aria-label="Đóng menu" onClick={() => setSidebarOpen(false)} />}

      <main>
        <header className="topbar">
          <div className="topbar-left">
            <button aria-label="Mở menu" className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)}>
              <Icon name="menu" />
            </button>
            <span>Kênh nội dung <b>/</b> {currentPage}</span>
          </div>
          <div className="topbar-actions">
            <span className="avatar avatar--admin">HL</span>
          </div>
        </header>
        <div className="content"><Outlet context={{ notify } satisfies CmsContext} /></div>
      </main>

      {toast && <div className="toast"><span><Icon name="check" size={15} /></span>{toast}</div>}
    </div>
  );
}

import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useOutletContext, useNavigate } from "react-router";
import {
  getCurrentUser,
  setCurrentUser,
  getAccounts,
  login,
  logout,
  type AccountUser,
} from "./authService";
import { navItems } from "./data";
import { Icon } from "./ui";

export type CmsContext = {
  notify: (message: string) => void;
  currentUser: AccountUser;
  switchUser: (user: AccountUser) => void;
};

export function useCms() {
  return useOutletContext<CmsContext>();
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [currentUser, setCurrentUserState] = useState<AccountUser | null>(getCurrentUser);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Login form state
  const [loginUser, setLoginUser] = useState("admin");
  const [loginPass, setLoginPass] = useState("admin");
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginError, setLoginError] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthChange = (e: any) => {
      const user = e.detail !== undefined ? e.detail : getCurrentUser();
      setCurrentUserState(user);
    };
    window.addEventListener("aurora-auth-changed", handleAuthChange);
    return () => window.removeEventListener("aurora-auth-changed", handleAuthChange);
  }, []);

  // Tự động chuyển hướng Nhân viên về Cấu hình trang nếu truy cập đường dẫn Quản trị viên
  useEffect(() => {
    if (currentUser?.role === "staff") {
      const adminOnlyPaths = ["/tai-khoan", "/heatmap", "/dang-ky-tu-van"];
      if (adminOnlyPaths.includes(location.pathname)) {
        navigate("/cau-hinh-trang", { replace: true });
      }
    }
  }, [currentUser, location.pathname, navigate]);

  const currentPage =
    navItems.find((item) => item.path === location.pathname)?.label ?? "Cấu hình trang";

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const handleSwitchUser = (acc: AccountUser) => {
    setCurrentUser(acc);
    setCurrentUserState(acc);
    setShowProfileMenu(false);
    notify(`Đã chuyển phiên làm việc sang: ${acc.fullName} (${acc.role === "admin" ? "Quản trị viên" : "Nhân viên"})`);
    if (acc.role === "staff" && location.pathname === "/tai-khoan") {
      navigate("/cau-hinh-trang");
    }
  };

  const handlePerformLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const res = login(loginUser, loginPass);
    if (!res.success || !res.user) {
      setLoginError(res.message);
      return;
    }
    setCurrentUserState(res.user);
    notify(res.message);
  };

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    setCurrentUserState(null);
    setLoginError("");
  };

  // NẾU CHƯA CÓ SESSION ĐĂNG NHẬP: BẮT BUỘC ĐĂNG NHẬP LẦN ĐẦU
  if (!currentUser) {
    return (
      <div className="login-screen-wrapper">
        <div className="login-card">
          <div className="login-header">
            <img
              src="./logo.png"
              alt="Logo Trung tâm Cô Hương"
              className="login-logo"
            />
            <h2>Kênh Quản trị Nội dung</h2>
            <p className="login-subtitle">
              Trung tâm Can thiệp Sớm & Hỗ trợ Trẻ Tự kỷ Cô Hương
            </p>
            <div className="login-badge-pill">
              <Icon name="lock" size={14} />
              <span>Yêu cầu đăng nhập để truy cập hệ thống</span>
            </div>
          </div>

          <form onSubmit={handlePerformLogin} className="login-form">
            {loginError && (
              <div className="login-error-alert">
                <Icon name="close" size={15} />
                <span>{loginError}</span>
              </div>
            )}

            <label className="login-field-label">
              <span>Tên đăng nhập</span>
              <input
                type="text"
                placeholder="Nhập username (admin hoặc nhanvien)"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                required
                autoFocus
              />
            </label>

            <label className="login-field-label">
              <span>Mật khẩu</span>
              <div className="input-with-eye">
                <input
                  type={showLoginPass ? "text" : "password"}
                  placeholder="Nhập mật khẩu..."
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="eye-toggle-btn"
                  onClick={() => setShowLoginPass(!showLoginPass)}
                  title={showLoginPass ? "Ẩn" : "Hiện"}
                >
                  <Icon name={showLoginPass ? "eyeOff" : "eye"} size={16} />
                </button>
              </div>
            </label>

            {/* Quick account presets */}
            <div className="login-presets-box">
              <span className="login-presets-title">Điền nhanh tài khoản mẫu:</span>
              <div className="login-presets-row">
                <button
                  type="button"
                  className={`login-preset-btn preset-admin ${loginUser === "admin" ? "selected" : ""}`}
                  onClick={() => {
                    setLoginUser("admin");
                    setLoginPass("admin");
                    setLoginError("");
                  }}
                >
                  <span className="preset-role-badge">👑 Quản trị viên</span>
                  <strong>admin</strong> / admin
                </button>
                <button
                  type="button"
                  className={`login-preset-btn preset-staff ${loginUser === "nhanvien" ? "selected" : ""}`}
                  onClick={() => {
                    setLoginUser("nhanvien");
                    setLoginPass("admin");
                    setLoginError("");
                  }}
                >
                  <span className="preset-role-badge">👤 Nhân viên</span>
                  <strong>nhanvien</strong> / admin
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit-btn">
              <Icon name="check" size={18} />
              <span>Đăng nhập vào Hệ thống</span>
            </button>
          </form>

          <div className="login-footer">
            <a
              href="https://ananasux.github.io/tre-tu-ky-responsive/?zarsrc=30&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo#resources"
              target="_blank"
              rel="noopener noreferrer"
              className="login-landing-link"
            >
              <Icon name="eye" size={15} />
              <span>Xem trang chính (Landing Page)</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Filter navigation items by role
  const visibleNavItems = navItems.filter((item) => !item.adminOnly || currentUser.role === "admin");

  const avatarInitials = currentUser.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : "AD";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}>
        <div className="brand">
          <img
            src="./logo.png"
            alt="Logo"
            style={{ width: 34, height: 34, borderRadius: 8, objectFit: "contain", flexShrink: 0 }}
          />
          <span>Cô Hương</span>
          <small>{currentUser.role === "admin" ? "QUẢN TRỊ VIÊN" : "NHÂN VIÊN"}</small>
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
          {visibleNavItems.map((item) => (
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
          {/* Requirement 1: Xem trang chính with updated target href */}
          <a
            className="site-preview"
            href="https://ananasux.github.io/tre-tu-ky-responsive/?zarsrc=30&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo#resources"
            rel="noopener noreferrer"
            target="_blank"
            title="Mở landing page với thông số chiến dịch Zalo"
          >
            <span>
              <Icon name="eye" size={17} />
            </span>
            <span>
              <strong>Xem trang chính</strong>
              <small>tre-tu-ky-responsive</small>
            </span>
            <Icon name="chevron" size={15} />
          </a>

          {/* Requirement 2: Profile & Role Switcher Popup */}
          <div className="profile-container">
            <div
              className="profile"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              title="Bấm để đổi tài khoản hoặc phân quyền"
            >
              <span className={`avatar ${currentUser.role === "admin" ? "avatar--admin" : "avatar--staff"}`}>
                {avatarInitials}
              </span>
              <span className="profile-text-wrap">
                <strong>{currentUser.fullName}</strong>
                <small className={currentUser.role === "admin" ? "role-text-admin" : "role-text-staff"}>
                  {currentUser.role === "admin" ? "Quản trị viên" : "Nhân viên"}
                </small>
              </span>
              <button
                type="button"
                aria-label="Tùy chọn tài khoản"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileMenu(!showProfileMenu);
                }}
              >
                <Icon name="more" size={18} />
              </button>
            </div>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="profile-dropdown-menu">
                <div className="dropdown-user-header">
                  <strong>{currentUser.fullName}</strong>
                  <code>@{currentUser.username}</code>
                  <span className={`role-badge ${currentUser.role === "admin" ? "role-admin" : "role-staff"}`}>
                    {currentUser.role === "admin" ? "👑 Toàn quyền Quản trị" : "👤 Nhân viên Nội dung"}
                  </span>
                </div>

                <div className="dropdown-divider" />

                <div className="dropdown-section-title">Chuyển nhanh tài khoản:</div>
                <div className="dropdown-quick-switch">
                  <button
                    type="button"
                    className={`quick-switch-item ${currentUser.username === "admin" ? "active" : ""}`}
                    onClick={() => {
                      const adm = getAccounts().find((a) => a.username === "admin");
                      if (adm) handleSwitchUser(adm);
                    }}
                  >
                    <span className="avatar avatar--admin-xs">AD</span>
                    <div>
                      <strong>admin</strong>
                      <small>Quản trị viên (admin/admin)</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`quick-switch-item ${currentUser.username === "nhanvien" ? "active" : ""}`}
                    onClick={() => {
                      const st = getAccounts().find((a) => a.username === "nhanvien");
                      if (st) handleSwitchUser(st);
                    }}
                  >
                    <span className="avatar avatar--staff-xs">NV</span>
                    <div>
                      <strong>nhanvien</strong>
                      <small>Nhân viên (nhanvien/admin)</small>
                    </div>
                  </button>
                </div>

                <div className="dropdown-divider" />

                {currentUser.role === "admin" && (
                  <NavLink
                    to="/tai-khoan"
                    className="dropdown-link-item"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <Icon name="users" size={15} />
                    Quản lý danh sách tài khoản
                  </NavLink>
                )}

                <button
                  type="button"
                  className="dropdown-link-item dropdown-logout-item"
                  onClick={handleLogout}
                >
                  <Icon name="close" size={15} />
                  Đăng nhập tài khoản khác
                </button>
              </div>
            )}
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
            <span>
              Kênh nội dung <b>/</b> {currentPage}
            </span>
          </div>
          <div className="topbar-actions">
            <div
              className="topbar-user-pill"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              title="Đổi tài khoản"
            >
              <span className={`avatar ${currentUser.role === "admin" ? "avatar--admin" : "avatar--staff"}`}>
                {avatarInitials}
              </span>
              <span className="topbar-user-name">{currentUser.fullName}</span>
              <span className={`role-badge ${currentUser.role === "admin" ? "role-admin" : "role-staff"}`}>
                {currentUser.role === "admin" ? "Quản trị" : "Nhân viên"}
              </span>
            </div>
          </div>
        </header>
        <div className="content">
          <Outlet context={{ notify, currentUser, switchUser: handleSwitchUser } satisfies CmsContext} />
        </div>
      </main>

      {toast && (
        <div className="toast">
          <span>
            <Icon name="check" size={15} />
          </span>
          {toast}
        </div>
      )}
    </div>
  );
}

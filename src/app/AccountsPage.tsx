import { useState } from "react";
import { useCms } from "./Layout";
import {
  getAccounts,
  getCurrentUser,
  setCurrentUser,
  addAccount,
  updateAccount,
  deleteAccount,
  type AccountUser,
  type UserRole,
} from "./authService";
import { Icon, PageHeading } from "./ui";

const ALL_CONTENT_SECTIONS = [
  { id: "mission", label: "Sứ mệnh" },
  { id: "support", label: "Lĩnh vực can thiệp" },
  { id: "process", label: "Quy trình" },
  { id: "team", label: "Đội ngũ chuyên gia" },
  { id: "gallery", label: "Không gian & Hình ảnh" },
  { id: "resources", label: "Tài liệu & Góc phụ huynh" },
  { id: "faq", label: "Câu hỏi thường gặp (FAQ)" },
];

export function AccountsPage() {
  const { notify } = useCms();
  const [currentUser, setLocalCurrentUser] = useState<AccountUser>(getCurrentUser);
  const [accounts, setAccounts] = useState<AccountUser[]>(getAccounts);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "staff">("all");

  // Show/Hide password states for table rows
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Modal State
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [showFormPassword, setShowFormPassword] = useState(false);

  // Form Fields
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formFullName, setFormFullName] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("staff");
  const [formAllowedSections, setFormAllowedSections] = useState<string[]>([
    "mission",
    "support",
    "process",
    "team",
    "gallery",
    "resources",
    "faq",
  ]);

  const refreshAccounts = () => {
    setAccounts(getAccounts());
    setLocalCurrentUser(getCurrentUser());
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode("create");
    setEditingAccountId(null);
    setFormUsername("");
    setFormPassword("");
    setFormFullName("");
    setFormRole("staff");
    setFormAllowedSections(["mission", "support", "process", "team", "gallery", "resources", "faq"]);
    setShowFormPassword(false);
  };

  // Open Edit Modal
  const handleOpenEdit = (acc: AccountUser) => {
    setModalMode("edit");
    setEditingAccountId(acc.id);
    setFormUsername(acc.username);
    setFormPassword(acc.password);
    setFormFullName(acc.fullName);
    setFormRole(acc.role);
    setFormAllowedSections(
      acc.allowedSections || ["mission", "support", "process", "team", "gallery", "resources", "faq"]
    );
    setShowFormPassword(false);
  };

  // Handle Save (Create / Update)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formUsername.trim()) {
      alert("Vui lòng nhập tên đăng nhập.");
      return;
    }

    if (!formPassword || formPassword.length < 3) {
      alert("Mật khẩu phải từ 3 ký tự trở lên.");
      return;
    }

    if (modalMode === "create") {
      const res = addAccount({
        username: formUsername,
        password: formPassword,
        fullName: formFullName,
        role: formRole,
        allowedSections: formAllowedSections,
      });

      if (!res.success) {
        alert(res.message);
        return;
      }
      notify(res.message);
    } else if (modalMode === "edit" && editingAccountId) {
      const res = updateAccount(editingAccountId, {
        username: formUsername,
        password: formPassword,
        fullName: formFullName,
        role: formRole,
        allowedSections: formAllowedSections,
      });

      if (!res.success) {
        alert(res.message);
        return;
      }
      notify(res.message);
    }

    setModalMode(null);
    refreshAccounts();
  };

  // Handle Delete
  const handleDelete = (acc: AccountUser) => {
    if (acc.id === currentUser.id) {
      alert("Bạn không thể xóa tài khoản bạn đang đăng nhập!");
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${acc.username}" (${acc.fullName})?`)) {
      return;
    }

    const res = deleteAccount(acc.id);
    if (!res.success) {
      alert(res.message);
      return;
    }

    notify(res.message);
    refreshAccounts();
  };

  // Quick switch active user
  const handleSwitchUser = (acc: AccountUser) => {
    setCurrentUser(acc);
    setLocalCurrentUser(acc);
    notify(`Đã chuyển phiên làm việc sang tài khoản: ${acc.fullName} (${acc.role === "admin" ? "Quản trị viên" : "Nhân viên"})`);
  };

  // Check role: Staff cannot access this page!
  if (currentUser.role !== "admin") {
    return (
      <div className="account-access-denied">
        <div className="denied-box">
          <span className="denied-icon">
            <Icon name="lock" size={36} />
          </span>
          <h2>Khu vực giới hạn quyền hạn</h2>
          <p>
            Bạn đang đăng nhập bằng tài khoản <strong>{currentUser.fullName} ({currentUser.username})</strong> với vai trò{" "}
            <span className="role-badge role-staff">Nhân viên</span>.
          </p>
          <p className="denied-desc">
            Trang <strong>Quản lý tài khoản & Phân quyền</strong> chỉ dành riêng cho <strong>Quản trị viên (Admin)</strong>.
          </p>
          <div className="denied-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                const adminAcc = accounts.find((a) => a.role === "admin");
                if (adminAcc) handleSwitchUser(adminAcc);
              }}
            >
              <Icon name="shield" size={16} />
              Chuyển sang tài khoản Quản trị viên (admin)
            </button>
            <a href="#/cau-hinh-trang" className="secondary-button" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              Quay lại Cấu hình trang
            </a>
          </div>
        </div>
      </div>
    );
  }

  const filteredAccounts = accounts.filter((acc) => {
    if (roleFilter !== "all" && acc.role !== roleFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return acc.username.toLowerCase().includes(q) || acc.fullName.toLowerCase().includes(q);
    }
    return true;
  });

  const adminCount = accounts.filter((a) => a.role === "admin").length;
  const staffCount = accounts.filter((a) => a.role === "staff").length;

  return (
    <div className="accounts-page">
      <PageHeading
        eyebrow="Hệ thống & Bảo mật"
        title="Quản lý tài khoản & Phân quyền"
        description="Thêm, sửa, xóa, quản lý mật khẩu tài khoản và phân quyền chức năng cho Quản trị viên và Nhân viên."
        action={
          <button className="primary-button" type="button" onClick={handleOpenCreate}>
            <Icon name="userPlus" size={16} />
            Đăng ký tài khoản mới
          </button>
        }
      />

      {/* METRIC CARDS */}
      <div className="accounts-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon metric-icon--purple">
            <Icon name="users" size={20} />
          </div>
          <div>
            <strong>{accounts.length}</strong>
            <span>Tổng số tài khoản</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon metric-icon--admin">
            <Icon name="shield" size={20} />
          </div>
          <div>
            <strong>{adminCount}</strong>
            <span>Quản trị viên (Toàn quyền)</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon metric-icon--staff">
            <Icon name="profile" size={20} />
          </div>
          <div>
            <strong>{staffCount}</strong>
            <span>Nhân viên (Giới hạn nội dung)</span>
          </div>
        </div>

        <div className="metric-card metric-card--active">
          <div className="metric-icon metric-icon--current">
            <Icon name="check" size={20} />
          </div>
          <div>
            <strong style={{ fontSize: "14px" }}>{currentUser.fullName}</strong>
            <span style={{ color: "#065f46", fontWeight: "600" }}>Đang hoạt động ({currentUser.role.toUpperCase()})</span>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="accounts-toolbar">
        <div className="filter-group">
          <button
            type="button"
            className={`filter-pill ${roleFilter === "all" ? "active" : ""}`}
            onClick={() => setRoleFilter("all")}
          >
            Tất cả ({accounts.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${roleFilter === "admin" ? "active" : ""}`}
            onClick={() => setRoleFilter("admin")}
          >
            Quản trị viên ({adminCount})
          </button>
          <button
            type="button"
            className={`filter-pill ${roleFilter === "staff" ? "active" : ""}`}
            onClick={() => setRoleFilter("staff")}
          >
            Nhân viên ({staffCount})
          </button>
        </div>

        <div className="search-box">
          <Icon name="search" size={15} />
          <input
            type="text"
            placeholder="Tìm theo username hoặc họ tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="accounts-table-card">
        <table className="accounts-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Tài khoản & Người dùng</th>
              <th>Vai trò & Quyền hạn</th>
              <th>Mật khẩu</th>
              <th>Phạm vi được sửa</th>
              <th>Phiên đăng nhập</th>
              <th style={{ textAlign: "right" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map((acc, index) => {
              const isCurrent = acc.id === currentUser.id;
              const isPassVisible = !!visiblePasswords[acc.id];
              return (
                <tr key={acc.id} className={isCurrent ? "row-current-user" : ""}>
                  <td className="col-idx">{index + 1}</td>
                  <td className="col-user">
                    <div className="user-info-cell">
                      <span className={`user-avatar ${acc.role === "admin" ? "avatar-admin" : "avatar-staff"}`}>
                        {acc.fullName.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <strong>{acc.fullName}</strong>
                        <div className="user-username">
                          <code>@{acc.username}</code>
                          {isCurrent && <span className="current-badge">Đang dùng</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="col-role">
                    {acc.role === "admin" ? (
                      <span className="role-badge role-admin">
                        <Icon name="shield" size={13} />
                        Quản trị viên
                      </span>
                    ) : (
                      <span className="role-badge role-staff">
                        <Icon name="profile" size={13} />
                        Nhân viên
                      </span>
                    )}
                  </td>
                  <td className="col-password">
                    <div className="password-display-box">
                      <span className="pass-text">
                        {isPassVisible ? acc.password : "••••••••"}
                      </span>
                      <button
                        type="button"
                        className="btn-eye-toggle"
                        onClick={() => togglePasswordVisibility(acc.id)}
                        title={isPassVisible ? "Ẩn mật khẩu" : "Xem mật khẩu"}
                        aria-label="Ẩn hiện mật khẩu"
                      >
                        <Icon name={isPassVisible ? "eyeOff" : "eye"} size={15} />
                      </button>
                    </div>
                  </td>
                  <td className="col-scope">
                    {acc.role === "admin" ? (
                      <span className="scope-all">🌐 Toàn quyền hệ thống</span>
                    ) : (
                      <span className="scope-limited" title={(acc.allowedSections || []).join(", ")}>
                        📝 {(acc.allowedSections || []).length} mục nội dung được chỉ định
                      </span>
                    )}
                  </td>
                  <td className="col-date">
                    <small>{acc.lastLogin ? new Date(acc.lastLogin).toLocaleDateString("vi-VN") : "Chưa đăng nhập"}</small>
                  </td>
                  <td className="col-actions">
                    <div className="actions-cell">
                      {!isCurrent && (
                        <button
                          type="button"
                          className="btn-action btn-switch"
                          onClick={() => handleSwitchUser(acc)}
                          title="Đăng nhập ngay với tài khoản này để test phân quyền"
                        >
                          Đăng nhập
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-action btn-edit"
                        onClick={() => handleOpenEdit(acc)}
                        title="Chỉnh sửa tài khoản"
                      >
                        <Icon name="edit" size={14} />
                      </button>
                      {!isCurrent && (
                        <button
                          type="button"
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(acc)}
                          title="Xóa tài khoản"
                        >
                          <Icon name="close" size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredAccounts.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--color-text-muted)" }}>
                  Không tìm thấy tài khoản nào khớp với bộ lọc.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalMode && (
        <div className="account-modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="account-modal" onClick={(e) => e.stopPropagation()}>
            <header className="account-modal-header">
              <div className="modal-title-with-icon">
                <span className="modal-badge-icon">
                  <Icon name={modalMode === "create" ? "userPlus" : "edit"} size={18} />
                </span>
                <div>
                  <h3>{modalMode === "create" ? "Đăng ký tài khoản mới" : `Sửa tài khoản @${formUsername}`}</h3>
                  <p>Thiết lập thông tin đăng nhập, vai trò và phạm vi phân quyền hệ thống</p>
                </div>
              </div>
              <button className="icon-button" type="button" onClick={() => setModalMode(null)}>
                <Icon name="close" size={18} />
              </button>
            </header>

            <form onSubmit={handleSaveForm}>
              <div className="account-modal-body">
                <div className="form-group-row">
                  <label>
                    Tên đăng nhập (Username) *
                    <input
                      type="text"
                      placeholder="admin, nhanvien, linhhoang..."
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      required
                    />
                  </label>

                  <label>
                    Họ và tên hiển thị *
                    <input
                      type="text"
                      placeholder="Nguyễn Văn A, Hoàng Linh..."
                      value={formFullName}
                      onChange={(e) => setFormFullName(e.target.value)}
                      required
                    />
                  </label>
                </div>

                <div className="form-group">
                  <label>
                    Mật khẩu tài khoản *
                    <div className="input-with-eye">
                      <input
                        type={showFormPassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu (tối thiểu 3 ký tự)..."
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="eye-toggle-btn"
                        onClick={() => setShowFormPassword(!showFormPassword)}
                        title={showFormPassword ? "Ẩn mật khẩu" : "Mở mật khẩu"}
                      >
                        <Icon name={showFormPassword ? "eyeOff" : "eye"} size={16} />
                      </button>
                    </div>
                  </label>
                </div>

                <div className="form-group">
                  <label>Vai trò & Phân quyền truy cập *</label>
                  <div className="role-selection-grid">
                    <label className={`role-radio-card ${formRole === "admin" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="accountRole"
                        value="admin"
                        checked={formRole === "admin"}
                        onChange={() => setFormRole("admin")}
                      />
                      <div>
                        <div className="role-title">
                          <Icon name="shield" size={16} />
                          <strong>Quản trị viên (Admin)</strong>
                        </div>
                        <p>Toàn quyền sử dụng mọi chức năng: cấu hình website, xuất bản dữ liệu, quản lý tài khoản, báo cáo UX.</p>
                      </div>
                    </label>

                    <label className={`role-radio-card ${formRole === "staff" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="accountRole"
                        value="staff"
                        checked={formRole === "staff"}
                        onChange={() => setFormRole("staff")}
                      />
                      <div>
                        <div className="role-title">
                          <Icon name="profile" size={16} />
                          <strong>Nhân viên (Staff)</strong>
                        </div>
                        <p>Chỉ được chỉnh sửa một vài khối nội dung được chỉ định trong Cấu hình trang. Không được xuất bản toàn trang.</p>
                      </div>
                    </label>
                  </div>
                </div>

                {formRole === "staff" && (
                  <div className="form-group staff-permissions-box">
                    <label>
                      <strong>Các khối nội dung nhân viên được phép sửa:</strong>
                    </label>
                    <div className="checkbox-sections-grid">
                      {ALL_CONTENT_SECTIONS.map((sec) => {
                        const isChecked = formAllowedSections.includes(sec.id);
                        return (
                          <label key={sec.id} className="checkbox-section-item">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormAllowedSections([...formAllowedSections, sec.id]);
                                } else {
                                  setFormAllowedSections(formAllowedSections.filter((id) => id !== sec.id));
                                }
                              }}
                            />
                            <span>{sec.label}</span>
                          </label>
                        );
                      })}
                    </div>
                    <small style={{ color: "var(--color-text-muted)", display: "block", marginTop: "6px" }}>
                      * Các mục Thông tin chung (thương hiệu, dock liên hệ), Biểu mẫu và Xuất bản website chỉ dành riêng cho Quản trị viên.
                    </small>
                  </div>
                )}
              </div>

              <footer className="account-modal-footer">
                <button className="secondary-button" type="button" onClick={() => setModalMode(null)}>
                  Hủy
                </button>
                <button className="primary-button" type="submit">
                  <Icon name="check" size={16} />
                  {modalMode === "create" ? "Tạo tài khoản" : "Lưu thay đổi"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

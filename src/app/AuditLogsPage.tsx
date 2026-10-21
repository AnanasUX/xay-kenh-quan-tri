import { useState, useEffect, useMemo } from "react";
import { Navigate } from "react-router";
import { useCms } from "./Layout";
import {
  getAuditLogs,
  getAccessLogs,
  clearAuditLogs,
  exportAuditLogsToCsv,
  type AuditLogEntry,
  type AccessLogEntry,
  type AuditCategory,
} from "./auditService";
import { Icon, PageHeading } from "./ui";

const CATEGORY_MAP: Record<AuditCategory, { label: string; color: string; bg: string }> = {
  auth: { label: "Đăng nhập / Phiên", color: "#6b21a8", bg: "#f3e8ff" },
  config: { label: "Cấu hình nội dung", color: "#1d4ed8", bg: "#dbeafe" },
  draft: { label: "Lưu bản nháp", color: "#0369a1", bg: "#e0f2fe" },
  publish: { label: "Xuất bản website", color: "#15803d", bg: "#dcfce7" },
  account: { label: "Quản lý tài khoản", color: "#b45309", bg: "#fef3c7" },
  ai: { label: "Trợ lý AI", color: "#7e22ce", bg: "#fae8ff" },
  consultation: { label: "Tư vấn phụ huynh", color: "#047857", bg: "#d1fae5" },
  heatmap: { label: "Bản đồ nhiệt UX", color: "#c2410c", bg: "#ffedd5" },
};

export function AuditLogsPage() {
  const { notify, currentUser } = useCms();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(getAuditLogs);
  const [accessLogs, setAccessLogs] = useState<AccessLogEntry[]>(getAccessLogs);

  // Active Tab: "audit" (Thao tác chi tiết) | "access" (Lịch sử truy cập link)
  const [activeTab, setActiveTab] = useState<"audit" | "access">("audit");

  // Filters for Audit Logs
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Selected Log Modal for full inspection
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setAuditLogs(getAuditLogs());
      setAccessLogs(getAccessLogs());
    };
    window.addEventListener("aurora-audit-logged", handleUpdate);
    window.addEventListener("aurora-access-logged", handleUpdate);
    return () => {
      window.removeEventListener("aurora-audit-logged", handleUpdate);
      window.removeEventListener("aurora-access-logged", handleUpdate);
    };
  }, []);

  // Chỉ Quản trị viên mới được xem nhật ký kiểm toán
  if (currentUser.role !== "admin") {
    return <Navigate to="/cau-hinh-trang" replace />;
  }

  // Danh sách users duy nhất để đưa vào dropdown filter
  const uniqueUsers = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach((l) => set.add(l.username));
    return Array.from(set);
  }, [auditLogs]);

  // Lọc Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (selectedCategory !== "all" && log.category !== selectedCategory) return false;
      if (selectedUser !== "all" && log.username !== selectedUser) return false;
      if (selectedStatus !== "all" && log.status !== selectedStatus) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          log.action.toLowerCase().includes(q) ||
          log.detail.toLowerCase().includes(q) ||
          log.username.toLowerCase().includes(q) ||
          log.fullName.toLowerCase().includes(q) ||
          (log.target && log.target.toLowerCase().includes(q)) ||
          log.ip.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [auditLogs, selectedCategory, selectedUser, selectedStatus, searchTerm]);

  // Lọc Access Logs
  const filteredAccessLogs = useMemo(() => {
    if (!searchTerm.trim()) return accessLogs;
    const q = searchTerm.toLowerCase();
    return accessLogs.filter(
      (a) =>
        a.username.toLowerCase().includes(q) ||
        a.fullName.toLowerCase().includes(q) ||
        a.ip.toLowerCase().includes(q) ||
        a.device.toLowerCase().includes(q) ||
        a.accessUrl.toLowerCase().includes(q)
    );
  }, [accessLogs, searchTerm]);

  // Thống kê metrics
  const totalOperations = auditLogs.length;
  const sensitiveActions = auditLogs.filter(
    (l) => l.category === "publish" || l.category === "account" || l.status === "denied"
  ).length;
  const accessSessionsCount = accessLogs.length;

  const handleClearLogs = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử thao tác và truy cập đã ghi nhận?")) {
      clearAuditLogs();
      setAuditLogs([]);
      setAccessLogs([]);
      notify("Đã làm sạch toàn bộ nhật ký hệ thống.");
    }
  };

  const handleExport = () => {
    exportAuditLogsToCsv(filteredAuditLogs);
    notify("Đã xuất file báo cáo kiểm toán CSV thành công!");
  };

  return (
    <div className="audit-logs-page" style={{ paddingBottom: "60px" }}>
      <PageHeading
        eyebrow="Bảo mật & Giám sát Hệ thống"
        title="Nhật ký Hoạt động & Quản lý Thao tác"
        description="Theo dõi chặt chẽ mọi lượt truy cập vào https://ananasux.github.io/xay-kenh-quan-tri/ và giám sát toàn bộ thao tác của người dùng trong quá trình sử dụng."
        action={
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setAuditLogs(getAuditLogs());
                setAccessLogs(getAccessLogs());
                notify("Đã làm mới dữ liệu nhật ký mới nhất.");
              }}
              title="Cập nhật dữ liệu mới nhất"
            >
              <Icon name="refresh" size={15} />
              <span>Làm mới</span>
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={handleExport}
              title="Tải báo cáo nhật ký định dạng Excel/CSV"
            >
              <Icon name="download" size={15} />
              <span>Xuất file CSV</span>
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={handleClearLogs}
              style={{ color: "#dc2626", borderColor: "#fecaca" }}
              title="Xóa sạch nhật ký"
            >
              <Icon name="close" size={14} />
              <span>Xóa lịch sử</span>
            </button>
          </div>
        }
      />

      {/* METRIC OVERVIEW CARDS */}
      <div className="accounts-metrics-grid" style={{ marginBottom: "24px" }}>
        <div className="metric-card">
          <div className="metric-icon metric-icon--purple">
            <Icon name="history" size={22} />
          </div>
          <div>
            <strong>{totalOperations}</strong>
            <span>Tổng số thao tác đã ghi nhận</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon metric-icon--current">
            <Icon name="users" size={22} />
          </div>
          <div>
            <strong>{accessSessionsCount}</strong>
            <span>Lượt truy cập vào kênh quản trị</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: "#fef3c7", color: "#b45309" }}>
            <Icon name="shield" size={22} />
          </div>
          <div>
            <strong style={{ color: "#b45309" }}>{sensitiveActions}</strong>
            <span>Thao tác nhạy cảm (Xuất bản/Tài khoản)</span>
          </div>
        </div>

        <div className="metric-card metric-card--active">
          <div className="metric-icon metric-icon--admin">
            <Icon name="check" size={22} />
          </div>
          <div>
            <strong style={{ color: "#166534" }}>Giám sát 100%</strong>
            <span style={{ color: "#166534", fontWeight: "600" }}>Ghi nhận bảo mật thời gian thực</span>
          </div>
        </div>
      </div>

      {/* TABS CHUYỂN ĐỔI CHẾ ĐỘ XEM */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid #e2e8f0",
          marginBottom: "20px",
          paddingBottom: "4px",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          style={{
            padding: "8px 18px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "audit" ? "3px solid #50008b" : "3px solid transparent",
            color: activeTab === "audit" ? "#50008b" : "#64748b",
            fontWeight: activeTab === "audit" ? "700" : "500",
            fontSize: "14px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Icon name="history" size={17} />
          Nhật ký Thao tác Hệ thống ({filteredAuditLogs.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("access")}
          style={{
            padding: "8px 18px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "access" ? "3px solid #50008b" : "3px solid transparent",
            color: activeTab === "access" ? "#50008b" : "#64748b",
            fontWeight: activeTab === "access" ? "700" : "500",
            fontSize: "14px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Icon name="eye" size={17} />
          Lịch sử Truy cập Website ({filteredAccessLogs.length})
        </button>
      </div>

      {/* TOOLBAR BỘ LỌC */}
      <div
        className="accounts-toolbar"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {activeTab === "audit" && (
            <>
              {/* Filter theo Category */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  height: "38px",
                  padding: "0 10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  color: "#334155",
                  background: "#ffffff",
                  outline: "none",
                }}
              >
                <option value="all">Tất cả loại thao tác</option>
                <option value="publish">🚀 Xuất bản website</option>
                <option value="draft">💾 Lưu bản nháp</option>
                <option value="config">⚙️ Cấu hình nội dung</option>
                <option value="account">👤 Quản lý tài khoản</option>
                <option value="auth">🔑 Đăng nhập / Phiên</option>
                <option value="ai">🤖 Trợ lý AI</option>
                <option value="consultation">📋 Tư vấn phụ huynh</option>
                <option value="heatmap">📊 Bản đồ nhiệt UX</option>
              </select>

              {/* Filter theo User */}
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                style={{
                  height: "38px",
                  padding: "0 10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  color: "#334155",
                  background: "#ffffff",
                  outline: "none",
                }}
              >
                <option value="all">Tất cả người thực hiện</option>
                {uniqueUsers.map((u) => (
                  <option key={u} value={u}>
                    @{u}
                  </option>
                ))}
              </select>

              {/* Filter theo Status */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  height: "38px",
                  padding: "0 10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  color: "#334155",
                  background: "#ffffff",
                  outline: "none",
                }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="success">Thành công</option>
                <option value="denied">Bị từ chối quyền</option>
                <option value="warning">Cảnh báo</option>
              </select>
            </>
          )}
        </div>

        <div className="search-box" style={{ width: "280px" }}>
          <Icon name="search" size={15} />
          <input
            type="text"
            placeholder={activeTab === "audit" ? "Tìm theo hành động, nội dung, IP..." : "Tìm theo người dùng, IP, thiết bị..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TAB 1: NHẬT KÝ THAO TÁC (AUDIT TRAIL) */}
      {activeTab === "audit" && (
        <div className="accounts-table-card">
          <table className="accounts-table">
            <thead>
              <tr>
                <th style={{ width: "40px", textAlign: "center" }}>#</th>
                <th style={{ width: "155px" }}>Thời gian</th>
                <th style={{ width: "210px" }}>Người thực hiện</th>
                <th style={{ width: "165px" }}>Phân loại</th>
                <th>Chi tiết thao tác & Đối tượng</th>
                <th style={{ width: "190px" }}>Môi trường & IP</th>
                <th style={{ width: "105px", textAlign: "center" }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredAuditLogs.map((log, index) => {
                const catInfo = CATEGORY_MAP[log.category] || { label: log.category, color: "#475569", bg: "#f1f5f9" };
                const formattedTime = new Date(log.timestamp).toLocaleString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                });

                return (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    style={{ cursor: "pointer", transition: "background 0.15s ease" }}
                    title="Bấm để xem chi tiết đầy đủ của thao tác"
                  >
                    <td className="col-idx" style={{ textAlign: "center" }}>
                      {index + 1}
                    </td>

                    <td style={{ fontSize: "12px", color: "#475569", whiteSpace: "nowrap" }}>
                      <strong>{formattedTime}</strong>
                    </td>

                    <td className="col-user">
                      <div className="user-info-cell">
                        <span className={`user-avatar ${log.role === "admin" ? "avatar-admin" : "avatar-staff"}`}>
                          {log.fullName ? log.fullName.slice(0, 2).toUpperCase() : log.username.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <strong>{log.fullName}</strong>
                          <div className="user-username">
                            <code>@{log.username}</code>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: "600",
                                padding: "1px 5px",
                                borderRadius: "4px",
                                background: log.role === "admin" ? "#f3e8ff" : "#ecfdf5",
                                color: log.role === "admin" ? "#6b21a8" : "#065f46",
                              }}
                            >
                              {log.role === "admin" ? "Admin" : "Nhân viên"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: catInfo.color,
                          background: catInfo.bg,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {catInfo.label}
                      </span>
                    </td>

                    <td>
                      <div style={{ lineHeight: "1.4" }}>
                        <strong style={{ color: "#0f172a", fontSize: "13px" }}>{log.action}</strong>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                          {log.detail}
                        </div>
                        {log.target && (
                          <div style={{ marginTop: "4px" }}>
                            <span
                              style={{
                                fontSize: "11px",
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                padding: "1px 6px",
                                borderRadius: "4px",
                                color: "#334155",
                              }}
                            >
                              Mục tiêu: <code>{log.target}</code>
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td style={{ fontSize: "12px", color: "#475569" }}>
                      <div>{log.device}</div>
                      <code style={{ fontSize: "11px", color: "#64748b" }}>{log.ip}</code>
                    </td>

                    <td style={{ textAlign: "center" }}>
                      {log.status === "success" && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            color: "#166534",
                            background: "#dcfce7",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                        >
                          <Icon name="check" size={12} />
                          Thành công
                        </span>
                      )}
                      {log.status === "denied" && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            color: "#991b1b",
                            background: "#fee2e2",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                        >
                          <Icon name="close" size={12} />
                          Từ chối
                        </span>
                      )}
                      {log.status === "warning" && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            color: "#92400e",
                            background: "#fef3c7",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                        >
                          Cảnh báo
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredAuditLogs.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    Không có thao tác nào khớp với tiêu chí tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: LỊCH SỬ TRUY CẬP WEBSITE (ACCESS LOGS) */}
      {activeTab === "access" && (
        <div className="accounts-table-card">
          <div style={{ padding: "14px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "13px", color: "#334155", fontWeight: "600" }}>
              🔗 Địa chỉ theo dõi chính:{" "}
              <a
                href="https://ananasux.github.io/xay-kenh-quan-tri/"
                target="_blank"
                rel="noreferrer"
                style={{ color: "#50008b", textDecoration: "underline" }}
              >
                https://ananasux.github.io/xay-kenh-quan-tri/
              </a>
            </span>
          </div>
          <table className="accounts-table">
            <thead>
              <tr>
                <th style={{ width: "40px", textAlign: "center" }}>#</th>
                <th style={{ width: "160px" }}>Thời gian truy cập</th>
                <th style={{ width: "210px" }}>Tài khoản</th>
                <th>URL & Đường dẫn mở đầu</th>
                <th style={{ width: "180px" }}>Thiết bị & Trình duyệt</th>
                <th style={{ width: "160px" }}>Độ phân giải & IP</th>
                <th style={{ width: "120px" }}>Thời lượng</th>
                <th style={{ width: "110px", textAlign: "center" }}>Kết quả</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccessLogs.map((acc, index) => {
                const formattedTime = new Date(acc.timestamp).toLocaleString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                });

                return (
                  <tr key={acc.id}>
                    <td className="col-idx" style={{ textAlign: "center" }}>
                      {index + 1}
                    </td>

                    <td style={{ fontSize: "12px", color: "#475569" }}>
                      <strong>{formattedTime}</strong>
                    </td>

                    <td className="col-user">
                      <div className="user-info-cell">
                        <span className={`user-avatar ${acc.role === "admin" ? "avatar-admin" : "avatar-staff"}`}>
                          {acc.fullName ? acc.fullName.slice(0, 2).toUpperCase() : acc.username.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <strong>{acc.fullName}</strong>
                          <div className="user-username">
                            <code>@{acc.username}</code>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: "12px", lineHeight: "1.4" }}>
                        <code style={{ color: "#50008b", fontWeight: "600" }}>{acc.accessUrl}</code>
                        {acc.note && (
                          <div style={{ color: "#64748b", marginTop: "2px" }}>{acc.note}</div>
                        )}
                      </div>
                    </td>

                    <td style={{ fontSize: "12px", color: "#475569" }}>
                      <div>{acc.device}</div>
                      <small style={{ color: "#64748b" }}>{acc.browser}</small>
                    </td>

                    <td style={{ fontSize: "12px", color: "#475569" }}>
                      <div>{acc.screenRes}</div>
                      <code style={{ fontSize: "11px", color: "#64748b" }}>{acc.ip}</code>
                    </td>

                    <td style={{ fontSize: "12px", color: "#475569" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: acc.sessionDuration === "Đang hoạt động" ? "#dcfce7" : "#f1f5f9",
                          color: acc.sessionDuration === "Đang hoạt động" ? "#166534" : "#475569",
                          fontWeight: "600",
                        }}
                      >
                        {acc.sessionDuration}
                      </span>
                    </td>

                    <td style={{ textAlign: "center" }}>
                      {acc.result === "success" && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            color: "#166534",
                            background: "#dcfce7",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                        >
                          <Icon name="check" size={12} />
                          Hợp lệ
                        </span>
                      )}
                      {acc.result === "failed" && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            color: "#991b1b",
                            background: "#fee2e2",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                        >
                          <Icon name="close" size={12} />
                          Thất bại
                        </span>
                      )}
                      {acc.result === "pending_login" && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            color: "#92400e",
                            background: "#fef3c7",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                        >
                          Chờ đăng nhập
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredAccessLogs.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    Không có bản ghi truy cập nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAIL MODAL KHI CLICK VÀO 1 DÒNG THAO TÁC */}
      {selectedLog && (
        <div className="account-modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div className="account-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "620px" }}>
            <header className="account-modal-header">
              <div className="modal-title-with-icon">
                <span className="modal-badge-icon" style={{ background: "#f3e8ff", color: "#50008b" }}>
                  <Icon name="history" size={18} />
                </span>
                <div>
                  <h3>Chi tiết Thao tác Người dùng</h3>
                  <p>Mã định danh: <code>{selectedLog.id}</code></p>
                </div>
              </div>
              <button className="icon-button" type="button" onClick={() => setSelectedLog(null)}>
                <Icon name="close" size={18} />
              </button>
            </header>

            <div className="account-modal-body" style={{ gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px" }}>
                  <small style={{ color: "#64748b", display: "block" }}>Thời gian thực hiện:</small>
                  <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                    {new Date(selectedLog.timestamp).toLocaleString("vi-VN")}
                  </strong>
                </div>

                <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px" }}>
                  <small style={{ color: "#64748b", display: "block" }}>Tài khoản thao tác:</small>
                  <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                    {selectedLog.fullName} (@{selectedLog.username})
                  </strong>
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "8px" }}>
                <small style={{ color: "#64748b", display: "block" }}>Hành động & Phân loại:</small>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      background: CATEGORY_MAP[selectedLog.category]?.bg || "#e2e8f0",
                      color: CATEGORY_MAP[selectedLog.category]?.color || "#334155",
                    }}
                  >
                    {CATEGORY_MAP[selectedLog.category]?.label || selectedLog.category}
                  </span>
                  <strong style={{ fontSize: "14px", color: "#0f172a" }}>{selectedLog.action}</strong>
                </div>
              </div>

              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "14px", borderRadius: "8px" }}>
                <small style={{ color: "#64748b", display: "block", marginBottom: "4px" }}>Mô tả chi tiết:</small>
                <p style={{ margin: 0, fontSize: "13px", color: "#334155", lineHeight: "1.5" }}>
                  {selectedLog.detail}
                </p>
                {selectedLog.target && (
                  <div style={{ marginTop: "10px", fontSize: "12px", color: "#64748b" }}>
                    Khối/Mục tiêu bị tác động: <code>{selectedLog.target}</code>
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px" }}>
                  <small style={{ color: "#64748b", display: "block" }}>Thiết bị & Trình duyệt:</small>
                  <span style={{ fontSize: "12px", color: "#334155" }}>{selectedLog.device}</span>
                </div>

                <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px" }}>
                  <small style={{ color: "#64748b", display: "block" }}>Địa chỉ mạng (IP):</small>
                  <code style={{ fontSize: "12px", color: "#50008b" }}>{selectedLog.ip}</code>
                </div>
              </div>
            </div>

            <footer className="account-modal-footer">
              <button className="primary-button" type="button" onClick={() => setSelectedLog(null)}>
                Đóng chi tiết
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

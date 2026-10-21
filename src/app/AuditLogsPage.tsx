import { useState, useEffect, useMemo } from "react";
import { Navigate } from "react-router";
import { useCms } from "./Layout";
import {
  getAuditLogs,
  getAccessLogs,
  syncAccessLogsWithCloud,
  clearAuditLogs,
  exportAuditLogsToCsv,
  exportLandingLogsToCsv,
  exportCmsAccessLogsToCsv,
  isLandingPageLog,
  isCmsLog,
  type AuditLogEntry,
  type AccessLogEntry,
  type AuditCategory,
} from "./auditService";
import { Icon, PageHeading, type IconName } from "./ui";

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

// Cấu hình tính năng Kênh Quản trị
const CMS_FEATURE_CONFIG: Record<
  string,
  { icon: IconName; color: string; bg: string; border: string; label: string }
> = {
  "Cấu hình trang": { icon: "edit", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", label: "Cấu hình trang" },
  "Live Chat CRM": { icon: "message", color: "#7e22ce", bg: "#faf5ff", border: "#e9d5ff", label: "Live Chat CRM" },
  "Quản lý tài khoản": { icon: "users", color: "#b45309", bg: "#fffbeb", border: "#fde68a", label: "Quản lý tài khoản" },
  "Bản đồ nhiệt UX": { icon: "flame", color: "#c2410c", bg: "#fff7ed", border: "#fed7aa", label: "Bản đồ nhiệt UX" },
  "Đăng ký tư vấn": { icon: "phone", color: "#047857", bg: "#ecfdf5", border: "#a7f3d0", label: "Đăng ký tư vấn" },
  "Phân tích hệ thống": { icon: "chart", color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd", label: "Phân tích hệ thống" },
  "Nhật ký hoạt động": { icon: "history", color: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe", label: "Nhật ký hoạt động" },
  "Đăng nhập hệ thống": { icon: "lock", color: "#64748b", bg: "#f8fafc", border: "#cbd5e1", label: "Đăng nhập hệ thống" },
};

export function AuditLogsPage() {
  const { notify, currentUser } = useCms();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(getAuditLogs);
  const [accessLogs, setAccessLogs] = useState<AccessLogEntry[]>(getAccessLogs);

  // Top Tab: "audit" (Nhật ký Thao tác) | "access" (Lịch sử Truy cập Website)
  const [activeTab, setActiveTab] = useState<"audit" | "access">("audit");

  // Sub Tab cho Lịch sử Truy cập: "landing" (Phần 1: Landing Page) | "cms" (Phần 2: Kênh Quản trị)
  const [accessSubTab, setAccessSubTab] = useState<"landing" | "cms">("landing");
  const [isSyncingAccess, setIsSyncingAccess] = useState(false);

  // Filters for Tab 1: Audit Logs
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Filters for Tab 2 - Phần 1: Landing Page
  const [landingSourceFilter, setLandingSourceFilter] = useState<"all" | "zalo" | "direct">("all");
  const [landingLocationFilter, setLandingLocationFilter] = useState<string>("all");
  const [landingSearchTerm, setLandingSearchTerm] = useState<string>("");

  // Filters for Tab 2 - Phần 2: Kênh Quản trị
  const [cmsAccountFilter, setCmsAccountFilter] = useState<string>("all");
  const [cmsFeatureFilter, setCmsFeatureFilter] = useState<string>("all");
  const [cmsSearchTerm, setCmsSearchTerm] = useState<string>("");

  // Modals for inspection
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [selectedAccessLog, setSelectedAccessLog] = useState<AccessLogEntry | null>(null);

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

  // --- 1. TÁCH BIỆT HOÀN TOÀN DỮ LIỆU 2 PHẦN ---
  const landingLogs = useMemo(() => {
    return accessLogs.filter((l) => isLandingPageLog(l));
  }, [accessLogs]);

  const cmsLogs = useMemo(() => {
    return accessLogs.filter((l) => isCmsLog(l));
  }, [accessLogs]);

  // --- 2. LỌC TAB AUDIT LOGS ---
  const uniqueAuditUsers = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach((l) => set.add(l.username));
    return Array.from(set);
  }, [auditLogs]);

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

  // --- 3. LỌC PHẦN 1: LANDING PAGE ---
  const uniqueLandingLocations = useMemo(() => {
    const set = new Set<string>();
    landingLogs.forEach((l) => {
      if (l.location) {
        const city = l.location.split(",")[0].trim();
        if (city) set.add(city);
      }
    });
    return Array.from(set);
  }, [landingLogs]);

  const filteredLandingLogs = useMemo(() => {
    return landingLogs.filter((l) => {
      const isZalo =
        (l.accessUrl && (l.accessUrl.includes("zalo") || l.accessUrl.includes("zarsrc"))) ||
        (l.campaign && l.campaign.toLowerCase().includes("zalo"));
      if (landingSourceFilter === "zalo" && !isZalo) return false;
      if (landingSourceFilter === "direct" && isZalo) return false;
      if (landingLocationFilter !== "all" && !l.location?.includes(landingLocationFilter)) return false;
      if (landingSearchTerm.trim()) {
        const q = landingSearchTerm.toLowerCase();
        return (
          l.ip.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q) ||
          l.device.toLowerCase().includes(q) ||
          l.browser.toLowerCase().includes(q) ||
          l.accessUrl.toLowerCase().includes(q) ||
          (l.note && l.note.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [landingLogs, landingSourceFilter, landingLocationFilter, landingSearchTerm]);

  // Landing Metrics
  const zaloLandingCount = landingLogs.filter(
    (l) =>
      (l.accessUrl && (l.accessUrl.includes("zalo") || l.accessUrl.includes("zarsrc"))) ||
      (l.campaign && l.campaign.toLowerCase().includes("zalo"))
  ).length;
  const directLandingCount = landingLogs.length - zaloLandingCount;
  const resourcesLandingCount = landingLogs.filter((l) => l.accessUrl && l.accessUrl.includes("#resources")).length;
  const zaloPct = landingLogs.length > 0 ? Math.round((zaloLandingCount / landingLogs.length) * 100) : 0;

  // --- 4. LỌC & THỐNG KÊ PHẦN 2: KÊNH QUẢN TRỊ THEO TÀI KHOẢN & TÍNH NĂNG ---
  interface AccountStatsSummary {
    username: string;
    fullName: string;
    role: "admin" | "staff" | "guest";
    totalAccess: number;
    lastActive: string;
    lastIp: string;
    featureBreakdown: Record<string, number>;
  }

  const accountStatsList = useMemo(() => {
    const map: Record<string, AccountStatsSummary> = {};
    cmsLogs.forEach((l) => {
      const u = l.username || "khach";
      if (!map[u]) {
        map[u] = {
          username: u,
          fullName: l.fullName || u,
          role: l.role || "staff",
          totalAccess: 0,
          lastActive: l.timestamp,
          lastIp: l.ip,
          featureBreakdown: {},
        };
      }
      map[u].totalAccess += 1;
      if (new Date(l.timestamp).getTime() > new Date(map[u].lastActive).getTime()) {
        map[u].lastActive = l.timestamp;
        map[u].lastIp = l.ip;
      }
      const f = l.featureName || "Cấu hình trang";
      map[u].featureBreakdown[f] = (map[u].featureBreakdown[f] || 0) + 1;
    });
    return Object.values(map).sort((a, b) => b.totalAccess - a.totalAccess);
  }, [cmsLogs]);

  // Tổng hợp lượt theo từng tính năng
  const featureTotals = useMemo(() => {
    const map: Record<string, number> = {};
    cmsLogs.forEach((l) => {
      const f = l.featureName || "Cấu hình trang";
      map[f] = (map[f] || 0) + 1;
    });
    return map;
  }, [cmsLogs]);

  const uniqueCmsAccounts = useMemo(() => {
    const set = new Set<string>();
    cmsLogs.forEach((l) => {
      if (l.username) set.add(l.username);
    });
    return Array.from(set);
  }, [cmsLogs]);

  const filteredCmsLogs = useMemo(() => {
    return cmsLogs.filter((l) => {
      if (cmsAccountFilter !== "all" && l.username !== cmsAccountFilter) return false;
      if (cmsFeatureFilter !== "all" && (l.featureName || "Cấu hình trang") !== cmsFeatureFilter) return false;
      if (cmsSearchTerm.trim()) {
        const q = cmsSearchTerm.toLowerCase();
        return (
          l.username.toLowerCase().includes(q) ||
          l.fullName.toLowerCase().includes(q) ||
          ((l.featureName || "").toLowerCase().includes(q)) ||
          l.ip.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q) ||
          l.device.toLowerCase().includes(q) ||
          l.browser.toLowerCase().includes(q) ||
          (l.note && l.note.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [cmsLogs, cmsAccountFilter, cmsFeatureFilter, cmsSearchTerm]);

  // Global metric counts
  const totalOperations = auditLogs.length;
  const sensitiveActions = auditLogs.filter(
    (l) => l.category === "publish" || l.category === "account" || l.status === "denied"
  ).length;

  const handleClearLogs = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử thao tác và truy cập đã ghi nhận?")) {
      clearAuditLogs();
      setAuditLogs([]);
      setAccessLogs([]);
      notify("Đã làm sạch toàn bộ nhật ký hệ thống.");
    }
  };

  const handleExport = () => {
    if (activeTab === "audit") {
      exportAuditLogsToCsv(filteredAuditLogs);
      notify("Đã xuất file báo cáo kiểm toán CSV thành công!");
    } else if (accessSubTab === "landing") {
      exportLandingLogsToCsv(filteredLandingLogs);
      notify("Đã xuất file CSV truy cập Landing Page!");
    } else {
      exportCmsAccessLogsToCsv(filteredCmsLogs);
      notify("Đã xuất file CSV thống kê tài khoản truy cập tính năng!");
    }
  };

  return (
    <div className="audit-logs-page" style={{ paddingBottom: "60px" }}>
      <PageHeading
        eyebrow="Bảo mật & Giám sát Hệ thống"
        title="Nhật ký Hoạt động & Quản lý Thao tác"
        description="Phân tích và giám sát tách biệt 2 phần: Lượt phụ huynh truy cập Landing Page (Chiến dịch Zalo #resources) và Thống kê theo Tài khoản truy cập tính năng Kênh Quản trị."
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
            <span>Tổng thao tác hệ thống đã ghi nhận</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: "#e0f2fe", color: "#0369a1" }}>
            <span style={{ fontSize: "20px" }}>🌐</span>
          </div>
          <div>
            <strong style={{ color: "#0369a1" }}>{landingLogs.length}</strong>
            <span>Phụ huynh truy cập Landing Page</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon metric-icon--current">
            <span style={{ fontSize: "20px" }}>⚙️</span>
          </div>
          <div>
            <strong style={{ color: "#50008b" }}>{cmsLogs.length}</strong>
            <span>Lượt tài khoản truy cập tính năng CMS</span>
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
      </div>

      {/* TABS CHÍNH CẤP 1 */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          borderBottom: "2px solid #e2e8f0",
          marginBottom: "20px",
          paddingBottom: "2px",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          style={{
            padding: "10px 20px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "audit" ? "3px solid #50008b" : "3px solid transparent",
            color: activeTab === "audit" ? "#50008b" : "#64748b",
            fontWeight: activeTab === "audit" ? "700" : "500",
            fontSize: "14.5px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "-2px",
          }}
        >
          <Icon name="history" size={17} />
          <span>Nhật ký Thao tác Kiểm toán ({filteredAuditLogs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("access")}
          style={{
            padding: "10px 20px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "access" ? "3px solid #50008b" : "3px solid transparent",
            color: activeTab === "access" ? "#50008b" : "#64748b",
            fontWeight: activeTab === "access" ? "700" : "500",
            fontSize: "14.5px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "-2px",
          }}
        >
          <Icon name="eye" size={17} />
          <span>Theo dõi Truy cập: Landing Page & Kênh Quản trị ({accessLogs.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: NHẬT KÝ THAO TÁC HỆ THỐNG                         */}
      {/* ======================================================== */}
      {activeTab === "audit" && (
        <>
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
                {uniqueAuditUsers.map((u) => (
                  <option key={u} value={u}>
                    @{u}
                  </option>
                ))}
              </select>

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
            </div>

            <div className="search-box" style={{ width: "280px" }}>
              <Icon name="search" size={15} />
              <input
                type="text"
                placeholder="Tìm theo hành động, nội dung, IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

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
                  const catInfo = CATEGORY_MAP[log.category] || {
                    label: log.category,
                    color: "#475569",
                    bg: "#f1f5f9",
                  };
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
                            {log.fullName
                              ? log.fullName.slice(0, 2).toUpperCase()
                              : log.username.slice(0, 2).toUpperCase()}
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
                          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{log.detail}</div>
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
        </>
      )}

      {/* ======================================================== */}
      {/* TAB 2: THEO DÕI TRUY CẬP (CHIA 2 PHẦN RÕ RÀNG)            */}
      {/* ======================================================== */}
      {activeTab === "access" && (
        <div>
          {/* THANH CHUYỂN ĐỔI 2 PHẦN CHÍNH */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "14px",
              marginBottom: "20px",
            }}
          >
            {/* NÚT PHẦN 1: LANDING PAGE */}
            <button
              type="button"
              onClick={() => {
                setAccessSubTab("landing");
              }}
              style={{
                padding: "16px 20px",
                borderRadius: "12px",
                border: accessSubTab === "landing" ? "2px solid #0284c7" : "1px solid #e2e8f0",
                background: accessSubTab === "landing" ? "#f0f9ff" : "#ffffff",
                boxShadow: accessSubTab === "landing" ? "0 4px 14px rgba(2, 132, 199, 0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "20px" }}>🌐</span>
                  <strong style={{ fontSize: "15px", color: accessSubTab === "landing" ? "#0284c7" : "#1e293b" }}>
                    PHẦN 1: LANDING PAGE & CHIẾN DỊCH ZALO
                  </strong>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    background: accessSubTab === "landing" ? "#0284c7" : "#e0f2fe",
                    color: accessSubTab === "landing" ? "#ffffff" : "#0369a1",
                  }}
                >
                  {landingLogs.length} lượt khách
                </span>
              </div>
              <div style={{ fontSize: "12.5px", color: "#64748b", lineHeight: "1.4" }}>
                Phụ huynh tìm hiểu qua Chiến dịch Zalo (zarsrc=30) và đọc cẩm nang phương pháp can thiệp <b>#resources</b>
              </div>
            </button>

            {/* NÚT PHẦN 2: KÊNH QUẢN TRỊ THEO TÀI KHOẢN & TÍNH NĂNG */}
            <button
              type="button"
              onClick={() => {
                setAccessSubTab("cms");
              }}
              style={{
                padding: "16px 20px",
                borderRadius: "12px",
                border: accessSubTab === "cms" ? "2px solid #50008b" : "1px solid #e2e8f0",
                background: accessSubTab === "cms" ? "#faf5ff" : "#ffffff",
                boxShadow: accessSubTab === "cms" ? "0 4px 14px rgba(80, 0, 139, 0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "20px" }}>⚙️</span>
                  <strong style={{ fontSize: "15px", color: accessSubTab === "cms" ? "#50008b" : "#1e293b" }}>
                    PHẦN 2: KÊNH QUẢN TRỊ (TÀI KHOẢN & TÍNH NĂNG)
                  </strong>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    background: accessSubTab === "cms" ? "#50008b" : "#f3e8ff",
                    color: accessSubTab === "cms" ? "#ffffff" : "#6b21a8",
                  }}
                >
                  {cmsLogs.length} lượt phiên
                </span>
              </div>
              <div style={{ fontSize: "12.5px", color: "#64748b", lineHeight: "1.4" }}>
                Thống kê chi tiết tài khoản (@admin, @nhanvien...) truy cập từng module tính năng (Cấu hình, Chat, Bản đồ nhiệt...)
              </div>
            </button>
          </div>

          {/* ======================================================== */}
          {/* HIỂN THỊ PHẦN 1: LANDING PAGE & CHIẾN DỊCH ZALO         */}
          {/* ======================================================== */}
          {accessSubTab === "landing" && (
            <div className="accounts-table-card" style={{ marginBottom: "30px" }}>
              {/* BANNER THÔNG TIN LANDING PAGE */}
              <div
                style={{
                  padding: "16px 20px",
                  background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                  borderBottom: "1px solid #bae6fd",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 18 }}>📱</span>
                    <span style={{ fontSize: 14.5, fontWeight: 700, color: "#0369a1" }}>
                      Giám sát Khách & Phụ huynh truy cập Landing Page (Chiến dịch Zalo)
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "#dcfce7",
                        color: "#15803d",
                      }}
                    >
                      🟢 Ghi nhận trực tiếp
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#075985" }}>
                    Địa chỉ trang đích: <code>https://ananasux.github.io/tre-tu-ky-responsive/?zarsrc=30&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo#resources</code>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsSyncingAccess(true);
                      const updated = await syncAccessLogsWithCloud();
                      setAccessLogs(updated);
                      setIsSyncingAccess(false);
                      notify("Đã đồng bộ lượt truy cập Landing Page mới nhất từ đám mây!");
                    }}
                    disabled={isSyncingAccess}
                    className="secondary-button"
                    style={{
                      height: 36,
                      padding: "0 12px",
                      fontSize: 12.5,
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#ffffff",
                    }}
                  >
                    <Icon name="refresh" size={14} />
                    {isSyncingAccess ? "Đang đồng bộ..." : "Đồng bộ đám mây"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      exportLandingLogsToCsv(filteredLandingLogs);
                      notify("Đã xuất file CSV truy cập Landing Page!");
                    }}
                    className="secondary-button"
                    style={{
                      height: 36,
                      padding: "0 12px",
                      fontSize: 12.5,
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#ffffff",
                    }}
                  >
                    <Icon name="download" size={14} />
                    Xuất CSV Landing Page
                  </button>
                </div>
              </div>

              {/* THẺ THỐNG KÊ NHANH CHO LANDING PAGE */}
              <div
                style={{
                  padding: "16px 20px",
                  background: "#ffffff",
                  borderBottom: "1px solid #f1f5f9",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                }}
              >
                <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <small style={{ color: "#64748b", fontSize: "11.5px" }}>Tổng lượt truy cập:</small>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>
                    {landingLogs.length} lượt
                  </div>
                </div>

                <div style={{ background: "#f0f9ff", padding: "12px 14px", borderRadius: "8px", border: "1px solid #bae6fd" }}>
                  <small style={{ color: "#0369a1", fontSize: "11.5px" }}>Từ Chiến dịch Zalo (zarsrc=30):</small>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: "#0284c7", marginTop: "2px" }}>
                    {zaloLandingCount} lượt ({zaloPct}%)
                  </div>
                </div>

                <div style={{ background: "#faf5ff", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e9d5ff" }}>
                  <small style={{ color: "#6b21a8", fontSize: "11.5px" }}>Xem chuyên mục #resources:</small>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: "#7e22ce", marginTop: "2px" }}>
                    {resourcesLandingCount} lượt
                  </div>
                </div>

                <div style={{ background: "#f0fdf4", padding: "12px 14px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                  <small style={{ color: "#15803d", fontSize: "11.5px" }}>Truy cập trực tiếp (Direct):</small>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: "#16a34a", marginTop: "2px" }}>
                    {directLandingCount} lượt
                  </div>
                </div>
              </div>

              {/* TOOLBAR BỘ LỌC CHO LANDING PAGE */}
              <div
                style={{
                  padding: "12px 20px",
                  background: "#ffffff",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                {/* LỌC THEO NGUỒN */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setLandingSourceFilter("all")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 999,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      border: landingSourceFilter === "all" ? "1.5px solid #0284c7" : "1px solid #cbd5e1",
                      background: landingSourceFilter === "all" ? "#e0f2fe" : "#ffffff",
                      color: landingSourceFilter === "all" ? "#0369a1" : "#475569",
                      transition: "all 0.15s ease",
                    }}
                  >
                    Tất cả nguồn ({landingLogs.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setLandingSourceFilter("zalo")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 999,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      border: landingSourceFilter === "zalo" ? "1.5px solid #0284c7" : "1px solid #cbd5e1",
                      background: landingSourceFilter === "zalo" ? "#0284c7" : "#ffffff",
                      color: landingSourceFilter === "zalo" ? "#ffffff" : "#0369a1",
                      transition: "all 0.15s ease",
                    }}
                  >
                    📱 Chiến dịch Zalo ({zaloLandingCount})
                  </button>

                  <button
                    type="button"
                    onClick={() => setLandingSourceFilter("direct")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 999,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      border: landingSourceFilter === "direct" ? "1.5px solid #0284c7" : "1px solid #cbd5e1",
                      background: landingSourceFilter === "direct" ? "#e0f2fe" : "#ffffff",
                      color: landingSourceFilter === "direct" ? "#0369a1" : "#475569",
                      transition: "all 0.15s ease",
                    }}
                  >
                    🌐 Trực tiếp ({directLandingCount})
                  </button>

                  {/* LỌC THEO VỊ TRÍ */}
                  <select
                    value={landingLocationFilter}
                    onChange={(e) => setLandingLocationFilter(e.target.value)}
                    style={{
                      height: "34px",
                      padding: "0 10px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12.5px",
                      color: "#334155",
                      background: "#ffffff",
                      outline: "none",
                    }}
                  >
                    <option value="all">📍 Tất cả vị trí ({uniqueLandingLocations.length} khu vực)</option>
                    {uniqueLandingLocations.map((loc) => (
                      <option key={loc} value={loc}>
                        📍 {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="search-box" style={{ width: "260px" }}>
                  <Icon name="search" size={15} />
                  <input
                    type="text"
                    placeholder="Tìm IP, vị trí, thiết bị..."
                    value={landingSearchTerm}
                    onChange={(e) => setLandingSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* BẢNG DỮ LIỆU PHẦN 1: LANDING PAGE */}
              <table className="accounts-table">
                <thead>
                  <tr>
                    <th style={{ width: "40px", textAlign: "center" }}>#</th>
                    <th style={{ width: "160px" }}>Thời gian truy cập</th>
                    <th style={{ width: "140px" }}>Địa chỉ IP</th>
                    <th style={{ width: "160px" }}>Vị trí địa lý</th>
                    <th style={{ width: "185px" }}>Kênh / Chiến dịch</th>
                    <th>URL truy cập & Chuyên mục đích</th>
                    <th style={{ width: "175px" }}>Thiết bị & Trình duyệt</th>
                    <th style={{ width: "105px", textAlign: "center" }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLandingLogs.map((acc, index) => {
                    const formattedTime = new Date(acc.timestamp).toLocaleString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    });

                    const isZalo =
                      (acc.accessUrl && (acc.accessUrl.includes("zalo") || acc.accessUrl.includes("zarsrc"))) ||
                      (acc.campaign && acc.campaign.includes("Zalo"));

                    return (
                      <tr
                        key={acc.id}
                        onClick={() => setSelectedAccessLog(acc)}
                        style={{ cursor: "pointer", transition: "background 0.15s ease" }}
                        title="Bấm để xem chi tiết lượt truy cập của khách"
                      >
                        <td className="col-idx" style={{ textAlign: "center" }}>
                          {index + 1}
                        </td>

                        <td style={{ fontSize: "12px", color: "#334155", whiteSpace: "nowrap" }}>
                          <strong>{formattedTime}</strong>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{acc.sessionDuration}</div>
                        </td>

                        <td>
                          <code
                            style={{
                              fontSize: "11.5px",
                              fontWeight: 700,
                              color: "#0369a1",
                              background: "#f0f9ff",
                              padding: "2px 6px",
                              borderRadius: 4,
                              border: "1px solid #bae6fd",
                              display: "inline-block",
                            }}
                          >
                            {acc.ip || "113.190.234.12"}
                          </code>
                        </td>

                        <td style={{ fontSize: "12.5px", color: "#1e293b", fontWeight: 600 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span>📍</span>
                            <span>{acc.location || "Hà Nội, Việt Nam"}</span>
                          </div>
                        </td>

                        <td>
                          {isZalo ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "3px 8px",
                                borderRadius: 6,
                                fontSize: "11.5px",
                                fontWeight: 700,
                                background: "#e0f2fe",
                                color: "#0369a1",
                                border: "1px solid #bae6fd",
                              }}
                            >
                              📱 Chiến dịch Zalo (zarsrc=30)
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "3px 8px",
                                borderRadius: 6,
                                fontSize: "11.5px",
                                fontWeight: 600,
                                background: "#f1f5f9",
                                color: "#475569",
                              }}
                            >
                              🌐 Truy cập Trực tiếp
                            </span>
                          )}
                          {acc.note && (
                            <div style={{ fontSize: "11px", color: "#64748b", marginTop: 2 }}>{acc.note}</div>
                          )}
                        </td>

                        <td>
                          <div style={{ maxWidth: 360, wordBreak: "break-all", fontSize: "12px", lineHeight: "1.4" }}>
                            <a
                              href={acc.accessUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                color: "#0284c7",
                                fontWeight: 600,
                                textDecoration: "underline",
                              }}
                              title={acc.accessUrl}
                            >
                              {acc.accessUrl.length > 70 ? acc.accessUrl.slice(0, 70) + "..." : acc.accessUrl}
                            </a>
                          </div>
                        </td>

                        <td style={{ fontSize: "12px", color: "#475569" }}>
                          <div style={{ fontWeight: 600, color: "#1e293b" }}>{acc.device}</div>
                          <small style={{ color: "#64748b" }}>
                            {acc.browser} ({acc.screenRes})
                          </small>
                        </td>

                        <td style={{ textAlign: "center" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              color: "#166534",
                              background: "#dcfce7",
                              padding: "3px 8px",
                              borderRadius: 12,
                              fontSize: "11px",
                              fontWeight: 600,
                            }}
                          >
                            <Icon name="check" size={12} />
                            Thành công
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLandingLogs.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                        Chưa có lượt truy cập Landing Page nào khớp với bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ======================================================== */}
          {/* HIỂN THỊ PHẦN 2: KÊNH QUẢN TRỊ (TÀI KHOẢN & TÍNH NĂNG)   */}
          {/* ======================================================== */}
          {accessSubTab === "cms" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* TOP BANNER KÊNH QUẢN TRỊ */}
              <div
                style={{
                  padding: "16px 20px",
                  background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
                  borderRadius: "12px",
                  border: "1px solid #e9d5ff",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 18 }}>⚙️</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#50008b" }}>
                      Thống kê Hoạt động theo Tài khoản & Tính năng trong Kênh Quản trị
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "#f3e8ff",
                        color: "#6b21a8",
                        border: "1px solid #d8b4fe",
                      }}
                    >
                      Bảo mật phân quyền
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#6b21a8" }}>
                    Theo dõi chính xác tài khoản nào (@admin, @nhanvien...) truy cập các module tính năng: Cấu hình trang, Live Chat, Bản đồ nhiệt, v.v.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    exportCmsAccessLogsToCsv(filteredCmsLogs);
                    notify("Đã xuất file CSV thống kê tài khoản truy cập tính năng!");
                  }}
                  className="secondary-button"
                  style={{
                    height: 36,
                    padding: "0 14px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#ffffff",
                  }}
                >
                  <Icon name="download" size={14} />
                  Xuất CSV Quản trị
                </button>
              </div>

              {/* 1. KHỐI THỐNG KÊ CHI TIẾT THEO TỪNG TÀI KHOẢN */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icon name="users" size={18} />
                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                      1. Bảng thống kê tổng hợp theo Tài khoản ({accountStatsList.length} tài khoản)
                    </h3>
                  </div>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    👉 Bấm vào tài khoản để lọc bảng chi tiết bên dưới
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: "14px",
                  }}
                >
                  {accountStatsList.map((stat) => {
                    const isSelected = cmsAccountFilter === stat.username;
                    const formattedLast = new Date(stat.lastActive).toLocaleString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                    });

                    return (
                      <div
                        key={stat.username}
                        onClick={() => {
                          setCmsAccountFilter(isSelected ? "all" : stat.username);
                        }}
                        style={{
                          background: isSelected ? "#fdf4ff" : "#ffffff",
                          border: isSelected ? "2px solid #50008b" : "1px solid #e2e8f0",
                          borderRadius: "12px",
                          padding: "16px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          boxShadow: isSelected ? "0 4px 12px rgba(80, 0, 139, 0.1)" : "0 1px 3px rgba(0,0,0,0.03)",
                        }}
                      >
                        {/* HEADER CARD TÀI KHOẢN */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span
                              className={`user-avatar ${stat.role === "admin" ? "avatar-admin" : "avatar-staff"}`}
                              style={{ width: "36px", height: "36px", fontSize: "14px" }}
                            >
                              {stat.fullName.slice(0, 2).toUpperCase()}
                            </span>
                            <div>
                              <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                                {stat.fullName}
                              </div>
                              <div style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                                <code>@{stat.username}</code>
                                <span
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: "700",
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                    background: stat.role === "admin" ? "#f3e8ff" : "#ecfdf5",
                                    color: stat.role === "admin" ? "#6b21a8" : "#065f46",
                                  }}
                                >
                                  {stat.role === "admin" ? "Quản trị viên" : "Nhân viên"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "16px", fontWeight: "800", color: "#50008b" }}>
                              {stat.totalAccess}
                            </div>
                            <small style={{ fontSize: "11px", color: "#64748b" }}>lượt truy cập</small>
                          </div>
                        </div>

                        {/* DANH SÁCH TÍNH NĂNG ĐÃ TRUY CẬP */}
                        <div style={{ marginTop: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "10px" }}>
                          <div style={{ fontSize: "11.5px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                            Mức độ sử dụng tính năng:
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {Object.entries(stat.featureBreakdown).map(([featName, count]) => {
                              const featConf = CMS_FEATURE_CONFIG[featName] || {
                                color: "#475569",
                                bg: "#f1f5f9",
                                border: "#e2e8f0",
                              };
                              return (
                                <span
                                  key={featName}
                                  style={{
                                    fontSize: "11.5px",
                                    padding: "2px 8px",
                                    borderRadius: "6px",
                                    background: featConf.bg,
                                    color: featConf.color,
                                    border: `1px solid ${featConf.border}`,
                                    fontWeight: "600",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <span>{featName}:</span>
                                  <strong>{count}</strong>
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* FOOTER CARD */}
                        <div
                          style={{
                            marginTop: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "11px",
                            color: "#64748b",
                          }}
                        >
                          <div>Gần nhất: <b>{formattedLast}</b></div>
                          <code>{stat.lastIp}</code>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. THANH CHỌN TÍNH NĂNG NHANH */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icon name="sparkle" size={16} />
                    <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                      2. Phân loại theo Tính năng hệ thống ({Object.keys(featureTotals).length} tính năng)
                    </h3>
                  </div>
                  {cmsFeatureFilter !== "all" && (
                    <button
                      type="button"
                      onClick={() => setCmsFeatureFilter("all")}
                      style={{
                        border: "none",
                        background: "none",
                        color: "#dc2626",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      ✕ Bỏ lọc tính năng
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setCmsFeatureFilter("all")}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 999,
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      border: cmsFeatureFilter === "all" ? "1.5px solid #50008b" : "1px solid #cbd5e1",
                      background: cmsFeatureFilter === "all" ? "#f3e8ff" : "#ffffff",
                      color: cmsFeatureFilter === "all" ? "#50008b" : "#475569",
                    }}
                  >
                    Tất cả tính năng ({cmsLogs.length})
                  </button>

                  {Object.entries(CMS_FEATURE_CONFIG).map(([featName, conf]) => {
                    const count = featureTotals[featName] || 0;
                    if (count === 0 && cmsFeatureFilter !== featName) return null;
                    const isFeatSelected = cmsFeatureFilter === featName;

                    return (
                      <button
                        key={featName}
                        type="button"
                        onClick={() => setCmsFeatureFilter(isFeatSelected ? "all" : featName)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 999,
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          border: isFeatSelected ? `1.5px solid ${conf.color}` : `1px solid ${conf.border}`,
                          background: isFeatSelected ? conf.bg : "#ffffff",
                          color: conf.color,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <Icon name={conf.icon} size={13} />
                        <span>{featName}</span>
                        <strong style={{ background: conf.bg, padding: "1px 5px", borderRadius: 4 }}>
                          {count}
                        </strong>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. TOOLBAR BỘ LỌC BẢNG CHI TIẾT KÊNH QUẢN TRỊ */}
              <div className="accounts-table-card">
                <div
                  style={{
                    padding: "12px 20px",
                    background: "#ffffff",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {/* DROPDOWN LỌC THEO TÀI KHOẢN */}
                    <select
                      value={cmsAccountFilter}
                      onChange={(e) => setCmsAccountFilter(e.target.value)}
                      style={{
                        height: "36px",
                        padding: "0 10px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        color: "#334155",
                        background: "#ffffff",
                        outline: "none",
                      }}
                    >
                      <option value="all">👤 Tất cả tài khoản ({uniqueCmsAccounts.length})</option>
                      {uniqueCmsAccounts.map((u) => (
                        <option key={u} value={u}>
                          @{u}
                        </option>
                      ))}
                    </select>

                    {/* DROPDOWN LỌC THEO TÍNH NĂNG */}
                    <select
                      value={cmsFeatureFilter}
                      onChange={(e) => setCmsFeatureFilter(e.target.value)}
                      style={{
                        height: "36px",
                        padding: "0 10px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        color: "#334155",
                        background: "#ffffff",
                        outline: "none",
                      }}
                    >
                      <option value="all">⚡ Tất cả tính năng truy cập</option>
                      {Object.keys(CMS_FEATURE_CONFIG).map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>

                    {(cmsAccountFilter !== "all" || cmsFeatureFilter !== "all") && (
                      <button
                        type="button"
                        onClick={() => {
                          setCmsAccountFilter("all");
                          setCmsFeatureFilter("all");
                        }}
                        style={{
                          fontSize: "12px",
                          color: "#dc2626",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          fontWeight: "600",
                        }}
                      >
                        ✕ Xóa bộ lọc
                      </button>
                    )}
                  </div>

                  <div className="search-box" style={{ width: "260px" }}>
                    <Icon name="search" size={15} />
                    <input
                      type="text"
                      placeholder="Tìm tài khoản, IP, nội dung..."
                      value={cmsSearchTerm}
                      onChange={(e) => setCmsSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* BẢNG CHI TIẾT TRUY CẬP KÊNH QUẢN TRỊ */}
                <table className="accounts-table">
                  <thead>
                    <tr>
                      <th style={{ width: "40px", textAlign: "center" }}>#</th>
                      <th style={{ width: "155px" }}>Thời gian truy cập</th>
                      <th style={{ width: "210px" }}>Tài khoản thực hiện</th>
                      <th style={{ width: "185px" }}>Tính năng truy cập</th>
                      <th>Chi tiết thao tác & Ghi chú</th>
                      <th style={{ width: "185px" }}>Địa chỉ IP & Vị trí</th>
                      <th style={{ width: "170px" }}>Thiết bị & Trình duyệt</th>
                      <th style={{ width: "105px", textAlign: "center" }}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCmsLogs.map((acc, index) => {
                      const formattedTime = new Date(acc.timestamp).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      });

                      const featName = acc.featureName || "Cấu hình trang";
                      const featConf = CMS_FEATURE_CONFIG[featName] || {
                        icon: "edit" as IconName,
                        color: "#50008b",
                        bg: "#f3e8ff",
                        border: "#e9d5ff",
                        label: featName,
                      };

                      return (
                        <tr
                          key={acc.id}
                          onClick={() => setSelectedAccessLog(acc)}
                          style={{ cursor: "pointer", transition: "background 0.15s ease" }}
                          title="Bấm để xem chi tiết đầy đủ phiên truy cập"
                        >
                          <td className="col-idx" style={{ textAlign: "center" }}>
                            {index + 1}
                          </td>

                          <td style={{ fontSize: "12px", color: "#334155", whiteSpace: "nowrap" }}>
                            <strong>{formattedTime}</strong>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{acc.sessionDuration}</div>
                          </td>

                          <td className="col-user">
                            <div className="user-info-cell">
                              <span className={`user-avatar ${acc.role === "admin" ? "avatar-admin" : "avatar-staff"}`}>
                                {acc.fullName
                                  ? acc.fullName.slice(0, 2).toUpperCase()
                                  : acc.username.slice(0, 2).toUpperCase()}
                              </span>
                              <div>
                                <strong>{acc.fullName}</strong>
                                <div className="user-username">
                                  <code>@{acc.username}</code>
                                  <span
                                    style={{
                                      fontSize: "10px",
                                      fontWeight: "600",
                                      padding: "1px 5px",
                                      borderRadius: "4px",
                                      background: acc.role === "admin" ? "#f3e8ff" : "#ecfdf5",
                                      color: acc.role === "admin" ? "#6b21a8" : "#065f46",
                                    }}
                                  >
                                    {acc.role === "admin" ? "Admin" : "Nhân viên"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "4px 9px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "700",
                                color: featConf.color,
                                background: featConf.bg,
                                border: `1px solid ${featConf.border}`,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <Icon name={featConf.icon} size={13} />
                              <span>{featName}</span>
                            </span>
                          </td>

                          <td>
                            <div style={{ lineHeight: "1.4" }}>
                              <strong style={{ color: "#0f172a", fontSize: "13px" }}>
                                {acc.note || "Truy cập tính năng"}
                              </strong>
                              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                Đường dẫn: <code>{acc.entryPath}</code>
                              </div>
                            </div>
                          </td>

                          <td style={{ fontSize: "12px", color: "#475569" }}>
                            <code
                              style={{
                                fontSize: "11.5px",
                                fontWeight: 700,
                                color: "#50008b",
                                background: "#f3e8ff",
                                padding: "1px 5px",
                                borderRadius: 4,
                                border: "1px solid #e9d5ff",
                                display: "inline-block",
                              }}
                            >
                              {acc.ip}
                            </code>
                            <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: 2 }}>
                              📍 {acc.location}
                            </div>
                          </td>

                          <td style={{ fontSize: "12px", color: "#475569" }}>
                            <div style={{ fontWeight: 600, color: "#1e293b" }}>{acc.device}</div>
                            <small style={{ color: "#64748b" }}>{acc.browser}</small>
                          </td>

                          <td style={{ textAlign: "center" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                color: "#166534",
                                background: "#dcfce7",
                                padding: "3px 8px",
                                borderRadius: 12,
                                fontSize: "11px",
                                fontWeight: 600,
                              }}
                            >
                              <Icon name="check" size={12} />
                              Thành công
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredCmsLogs.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                          Không có phiên truy cập Kênh Quản trị nào khớp với bộ lọc tài khoản & tính năng.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: CHI TIẾT THAO TÁC AUDIT LOG                     */}
      {/* ======================================================== */}
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
                  <p>
                    Mã định danh: <code>{selectedLog.id}</code>
                  </p>
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

      {/* ======================================================== */}
      {/* MODAL 2: CHI TIẾT LƯỢT TRUY CẬP (ACCESS LOG)            */}
      {/* ======================================================== */}
      {selectedAccessLog && (
        <div className="account-modal-backdrop" onClick={() => setSelectedAccessLog(null)}>
          <div className="account-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "620px" }}>
            <header className="account-modal-header">
              <div className="modal-title-with-icon">
                <span
                  className="modal-badge-icon"
                  style={{
                    background: selectedAccessLog.isLandingPage ? "#e0f2fe" : "#f3e8ff",
                    color: selectedAccessLog.isLandingPage ? "#0369a1" : "#50008b",
                  }}
                >
                  <Icon name={selectedAccessLog.isLandingPage ? "eye" : "dashboard"} size={18} />
                </span>
                <div>
                  <h3>
                    Chi tiết Lượt truy cập:{" "}
                    {selectedAccessLog.isLandingPage ? "Landing Page" : "Kênh Quản trị"}
                  </h3>
                  <p>
                    Mã phiên: <code>{selectedAccessLog.id}</code>
                  </p>
                </div>
              </div>
              <button className="icon-button" type="button" onClick={() => setSelectedAccessLog(null)}>
                <Icon name="close" size={18} />
              </button>
            </header>

            <div className="account-modal-body" style={{ gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px" }}>
                  <small style={{ color: "#64748b", display: "block" }}>Thời gian truy cập:</small>
                  <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                    {new Date(selectedAccessLog.timestamp).toLocaleString("vi-VN")}
                  </strong>
                </div>

                <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px" }}>
                  <small style={{ color: "#64748b", display: "block" }}>Đối tượng / Người dùng:</small>
                  <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                    {selectedAccessLog.fullName} (@{selectedAccessLog.username})
                  </strong>
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "8px" }}>
                <small style={{ color: "#64748b", display: "block" }}>
                  {selectedAccessLog.isLandingPage ? "Nguồn / Chiến dịch:" : "Tính năng truy cập:"}
                </small>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                  <strong style={{ fontSize: "14px", color: "#0f172a" }}>
                    {selectedAccessLog.isLandingPage
                      ? selectedAccessLog.campaign || "Chiến dịch Zalo"
                      : selectedAccessLog.featureName || "Cấu hình trang"}
                  </strong>
                </div>
                {selectedAccessLog.note && (
                  <div style={{ fontSize: "12.5px", color: "#475569", marginTop: "4px" }}>
                    {selectedAccessLog.note}
                  </div>
                )}
              </div>

              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "12px 14px", borderRadius: "8px" }}>
                <small style={{ color: "#64748b", display: "block", marginBottom: "4px" }}>URL chi tiết:</small>
                <a
                  href={selectedAccessLog.accessUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: "12.5px", color: "#50008b", wordBreak: "break-all", fontWeight: 600 }}
                >
                  {selectedAccessLog.accessUrl}
                </a>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px" }}>
                  <small style={{ color: "#64748b", display: "block" }}>Vị trí địa lý:</small>
                  <span style={{ fontSize: "12.5px", color: "#0f172a", fontWeight: 600 }}>
                    📍 {selectedAccessLog.location}
                  </span>
                </div>

                <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px" }}>
                  <small style={{ color: "#64748b", display: "block" }}>Địa chỉ IP:</small>
                  <code style={{ fontSize: "12px", color: "#50008b" }}>{selectedAccessLog.ip}</code>
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px" }}>
                <small style={{ color: "#64748b", display: "block" }}>Thiết bị & Màn hình:</small>
                <div style={{ fontSize: "12.5px", color: "#334155" }}>
                  {selectedAccessLog.device} · {selectedAccessLog.browser} ({selectedAccessLog.screenRes})
                </div>
              </div>
            </div>

            <footer className="account-modal-footer">
              <button className="primary-button" type="button" onClick={() => setSelectedAccessLog(null)}>
                Đóng chi tiết
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

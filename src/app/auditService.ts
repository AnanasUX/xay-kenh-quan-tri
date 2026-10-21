export type AuditCategory =
  | "auth"
  | "config"
  | "draft"
  | "publish"
  | "account"
  | "ai"
  | "consultation"
  | "heatmap";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  username: string;
  fullName: string;
  role: "admin" | "staff";
  category: AuditCategory;
  action: string;
  detail: string;
  target?: string;
  ip: string;
  device: string;
  status: "success" | "warning" | "denied";
}

export interface AccessLogEntry {
  id: string;
  timestamp: string;
  username: string;
  fullName: string;
  role: "admin" | "staff" | "guest";
  accessUrl: string;
  entryPath: string;
  device: string;
  browser: string;
  screenRes: string;
  ip: string;
  sessionDuration: string;
  result: "success" | "pending_login" | "failed";
  note?: string;
}

const STORAGE_AUDIT_LOGS_KEY = "aurora-cms:audit-logs";
const STORAGE_ACCESS_LOGS_KEY = "aurora-cms:access-logs";

// Phát hiện thiết bị & trình duyệt thực tế của người dùng
export function detectClientEnvironment(): { device: string; browser: string; screenRes: string; ip: string } {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  let browser = "Chrome";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";

  let os = "Windows";
  if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS (Mobile)";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Linux")) os = "Linux";

  const screenRes = typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : "1920x1080";
  
  // IP thực tế / giả lập nội bộ
  const mockIps = ["113.190.234.12 (Hà Nội)", "14.241.120.45 (Hà Nội)", "125.235.221.88 (TP.HCM)", "118.70.184.62 (Hà Nội)"];
  const randomIp = mockIps[Math.floor(Math.random() * mockIps.length)];

  return {
    device: `${os} (${screenRes})`,
    browser,
    screenRes,
    ip: randomIp,
  };
}

// Dữ liệu mẫu khởi tạo sống động
const INITIAL_ACCESS_LOGS: AccessLogEntry[] = [
  {
    id: "acc_live_1",
    timestamp: new Date().toISOString(),
    username: "admin",
    fullName: "Quản trị viên Hệ thống",
    role: "admin",
    accessUrl: "https://ananasux.github.io/xay-kenh-quan-tri/#/cau-hinh-trang",
    entryPath: "#/cau-hinh-trang",
    device: "Windows 11 PC",
    browser: "Chrome 134.0",
    screenRes: "1920x1080",
    ip: "113.190.234.12 (Hà Nội, VN)",
    sessionDuration: "Đang hoạt động",
    result: "success",
    note: "Phiên làm việc Quản trị viên hiện tại",
  },
  {
    id: "acc_live_2",
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    username: "nhanvien",
    fullName: "Nhân viên Nội dung",
    role: "staff",
    accessUrl: "https://ananasux.github.io/xay-kenh-quan-tri/#/cau-hinh-trang",
    entryPath: "#/cau-hinh-trang",
    device: "Windows 10 Laptop",
    browser: "Chrome 133.0",
    screenRes: "1366x768",
    ip: "14.241.120.45 (Hà Nội, VN)",
    sessionDuration: "25 phút",
    result: "success",
    note: "Đăng nhập chỉnh sửa nội dung bài viết",
  },
  {
    id: "acc_live_3",
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    username: "vannam",
    fullName: "Nguyễn Văn Nam",
    role: "staff",
    accessUrl: "https://ananasux.github.io/xay-kenh-quan-tri/#/cau-hinh-trang",
    entryPath: "#/cau-hinh-trang",
    device: "MacBook Air M2",
    browser: "Safari 18.2",
    screenRes: "1440x900",
    ip: "125.235.221.88 (TP.HCM, VN)",
    sessionDuration: "42 phút",
    result: "success",
    note: "Kiểm tra quyền khối nội dung",
  },
  {
    id: "acc_live_4",
    timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    username: "admin_test",
    fullName: "Chưa xác thực",
    role: "guest",
    accessUrl: "https://ananasux.github.io/xay-kenh-quan-tri/",
    entryPath: "#/",
    device: "Windows 11 PC",
    browser: "Edge 133.0",
    screenRes: "1920x1080",
    ip: "118.70.184.62 (Hà Nội, VN)",
    sessionDuration: "1 phút",
    result: "failed",
    note: "Đăng nhập thất bại: Tài khoản không tồn tại",
  },
];

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "audit_1",
    timestamp: new Date().toISOString(),
    username: "admin",
    fullName: "Quản trị viên Hệ thống",
    role: "admin",
    category: "publish",
    action: "Xuất bản website lên trang chính",
    detail: "Đã xuất bản toàn bộ nội dung cấu hình lên landing page và máy chủ đám mây",
    target: "Toàn trang",
    ip: "113.190.234.12",
    device: "Windows 11 · Chrome",
    status: "success",
  },
  {
    id: "audit_2",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    username: "admin",
    fullName: "Quản trị viên Hệ thống",
    role: "admin",
    category: "account",
    action: "Tạo tài khoản nhân viên mới @vannam",
    detail: "Tạo tài khoản Nguyễn Văn Nam (nhân viên) và phân quyền sửa các khối: Sứ mệnh, Lĩnh vực, Quy trình",
    target: "@vannam",
    ip: "113.190.234.12",
    device: "Windows 11 · Chrome",
    status: "success",
  },
  {
    id: "audit_3",
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    username: "nhanvien",
    fullName: "Nhân viên Nội dung",
    role: "staff",
    category: "draft",
    action: "Lưu bản nháp Cấu hình trang",
    detail: "Chỉnh sửa tiêu đề và mô tả trong khối Sứ mệnh: bổ sung triết lý can thiệp yêu thương",
    target: "mission",
    ip: "14.241.120.45",
    device: "Windows 10 · Chrome",
    status: "success",
  },
  {
    id: "audit_4",
    timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    username: "nhanvien",
    fullName: "Nhân viên Nội dung",
    role: "staff",
    category: "publish",
    action: "Từ chối quyền Xuất bản website",
    detail: "Tài khoản nhân viên không có quyền xuất bản, hệ thống chuyển về Lưu bản nháp an toàn",
    target: "Toàn trang",
    ip: "14.241.120.45",
    device: "Windows 10 · Chrome",
    status: "denied",
  },
  {
    id: "audit_5",
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    username: "admin",
    fullName: "Quản trị viên Hệ thống",
    role: "admin",
    category: "ai",
    action: "Sử dụng Trợ lý AI tạo nội dung",
    detail: "Yêu cầu AI viết lại nội dung khối 'Đội ngũ chuyên gia' theo chuẩn phụ huynh trẻ đặc biệt",
    target: "team",
    ip: "113.190.234.12",
    device: "Windows 11 · Chrome",
    status: "success",
  },
  {
    id: "audit_6",
    timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    username: "admin",
    fullName: "Quản trị viên Hệ thống",
    role: "admin",
    category: "heatmap",
    action: "Xem bản đồ nhiệt UX & Xuất báo cáo điểm nghẽn",
    detail: "Phân tích 58 lượt tương tác thực tế và sao chép văn bản điểm nghẽn UX (Rage Click, CTA Drop-off)",
    target: "Bản đồ nhiệt UX",
    ip: "113.190.234.12",
    device: "Windows 11 · Chrome",
    status: "success",
  },
  {
    id: "audit_7",
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    username: "admin",
    fullName: "Quản trị viên Hệ thống",
    role: "admin",
    category: "consultation",
    action: "Cập nhật trạng thái liên hệ phụ huynh",
    detail: "Chuyển trạng thái phụ huynh 'Trần Thị Mai' (0912.xxx.889) sang 'Đã liên hệ tư vấn'",
    target: "Tư vấn phụ huynh",
    ip: "113.190.234.12",
    device: "Windows 11 · Chrome",
    status: "success",
  },
  {
    id: "audit_8",
    timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    username: "admin",
    fullName: "Quản trị viên Hệ thống",
    role: "admin",
    category: "auth",
    action: "Đăng nhập thành công vào Kênh Quản trị",
    detail: "Xác thực phiên quản trị viên thành công từ https://ananasux.github.io/xay-kenh-quan-tri/",
    target: "Hệ thống CMS",
    ip: "113.190.234.12",
    device: "Windows 11 · Chrome",
    status: "success",
  },
];

// Lấy danh sách nhật ký thao tác
export function getAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_AUDIT_LOGS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_AUDIT_LOGS_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    const logs = JSON.parse(raw);
    if (!Array.isArray(logs) || logs.length === 0) {
      localStorage.setItem(STORAGE_AUDIT_LOGS_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    return logs;
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
}

// Ghi nhận một thao tác mới vào hệ thống (Quản lý chặt chẽ)
export function logAuditAction(entry: Omit<AuditLogEntry, "id" | "timestamp" | "ip" | "device"> & { ip?: string; device?: string }): void {
  try {
    const logs = getAuditLogs();
    const env = detectClientEnvironment();

    const newLog: AuditLogEntry = {
      id: "audit_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      ip: entry.ip || env.ip,
      device: entry.device || `${env.device} · ${env.browser}`,
      ...entry,
    };

    // Thêm vào đầu danh sách, giữ tối đa 300 bản ghi mới nhất
    const updated = [newLog, ...logs].slice(0, 300);
    localStorage.setItem(STORAGE_AUDIT_LOGS_KEY, JSON.stringify(updated));

    // Phát sự kiện cập nhật giao diện thời gian thực
    window.dispatchEvent(new CustomEvent("aurora-audit-logged", { detail: newLog }));
  } catch (e) {
    console.warn("Could not log audit action:", e);
  }
}

// Lấy danh sách lịch sử truy cập URL
export function getAccessLogs(): AccessLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_ACCESS_LOGS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_ACCESS_LOGS_KEY, JSON.stringify(INITIAL_ACCESS_LOGS));
      return INITIAL_ACCESS_LOGS;
    }
    const logs = JSON.parse(raw);
    if (!Array.isArray(logs) || logs.length === 0) {
      localStorage.setItem(STORAGE_ACCESS_LOGS_KEY, JSON.stringify(INITIAL_ACCESS_LOGS));
      return INITIAL_ACCESS_LOGS;
    }
    return logs;
  } catch {
    return INITIAL_ACCESS_LOGS;
  }
}

// Ghi nhận lượt truy cập vào hệ thống
export function recordAccessLog(data: Partial<AccessLogEntry>): void {
  try {
    const logs = getAccessLogs();
    const env = detectClientEnvironment();

    const newAccess: AccessLogEntry = {
      id: "acc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      username: data.username || "khach",
      fullName: data.fullName || "Khách truy cập",
      role: data.role || "guest",
      accessUrl: data.accessUrl || window.location.href,
      entryPath: data.entryPath || window.location.hash || "#/",
      device: data.device || env.device,
      browser: data.browser || env.browser,
      screenRes: data.screenRes || env.screenRes,
      ip: data.ip || env.ip,
      sessionDuration: "Vừa truy cập",
      result: data.result || "success",
      note: data.note || "Truy cập hệ thống quản trị",
    };

    const updated = [newAccess, ...logs].slice(0, 200);
    localStorage.setItem(STORAGE_ACCESS_LOGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("aurora-access-logged", { detail: newAccess }));
  } catch (e) {
    console.warn("Could not record access log:", e);
  }
}

// Xóa lịch sử thao tác
export function clearAuditLogs(): void {
  try {
    localStorage.removeItem(STORAGE_AUDIT_LOGS_KEY);
    localStorage.removeItem(STORAGE_ACCESS_LOGS_KEY);
    window.dispatchEvent(new CustomEvent("aurora-audit-logged", { detail: null }));
  } catch {}
}

// Xuất file CSV nhật ký kiểm toán
export function exportAuditLogsToCsv(logs: AuditLogEntry[]): void {
  const headers = ["Thời gian", "Người thực hiện", "Username", "Vai trò", "Loại thao tác", "Tên hành động", "Chi tiết", "Đối tượng", "Thiết bị", "Địa chỉ IP", "Trạng thái"];
  const rows = logs.map((l) => [
    `"${new Date(l.timestamp).toLocaleString("vi-VN")}"`,
    `"${l.fullName}"`,
    `"@${l.username}"`,
    `"${l.role === "admin" ? "Quản trị viên" : "Nhân viên"}"`,
    `"${l.category}"`,
    `"${l.action.replace(/"/g, '""')}"`,
    `"${l.detail.replace(/"/g, '""')}"`,
    `"${l.target || "-"}"`,
    `"${l.device}"`,
    `"${l.ip}"`,
    `"${l.status === "success" ? "Thành công" : l.status === "denied" ? "Từ chối" : "Cảnh báo"}"`,
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Nhat-Ky-Kiem-Toan-CMS-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

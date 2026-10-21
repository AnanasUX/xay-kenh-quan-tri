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
  location: string;
  sessionDuration: string;
  result: "success" | "pending_login" | "failed";
  note?: string;
  campaign?: string;
  isLandingPage?: boolean;
  featureName?: string;
}

// Phân định rõ ràng Lượt truy cập Landing Page vs Kênh Quản trị
export function isLandingPageLog(entry: AccessLogEntry): boolean {
  if (entry.isLandingPage === true) return true;
  if (entry.isLandingPage === false) return false;
  const url = (entry.accessUrl || "").toLowerCase();
  const path = (entry.entryPath || "").toLowerCase();
  const camp = (entry.campaign || "").toLowerCase();
  const note = (entry.note || "").toLowerCase();
  if (url.includes("tre-tu-ky-responsive") || path.includes("tre-tu-ky-responsive")) return true;
  if (url.includes("zarsrc") || camp.includes("zalo") || note.includes("zalo")) return true;
  return false;
}

export function isCmsLog(entry: AccessLogEntry): boolean {
  return !isLandingPageLog(entry);
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
  const mockIps = ["113.190.234.12", "14.241.120.45", "125.235.221.88", "118.70.184.62"];
  const randomIp = mockIps[Math.floor(Math.random() * mockIps.length)];

  return {
    device: `${os} (${screenRes})`,
    browser,
    screenRes,
    ip: randomIp,
  };
}

// Dữ liệu mẫu khởi tạo sống động cho cả 2 phần: Landing Page & Kênh Quản trị
const INITIAL_ACCESS_LOGS: AccessLogEntry[] = [
  // --- PHẦN 1: LANDING PAGE & CHIẾN DỊCH ZALO ---
  {
    id: "acc_zalo_1",
    timestamp: new Date().toISOString(),
    username: "phu_huynh_zalo",
    fullName: "Phụ huynh (Chiến dịch Zalo)",
    role: "guest",
    accessUrl: "https://ananasux.github.io/tre-tu-ky-responsive/?zarsrc=30&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo#resources",
    entryPath: "/tre-tu-ky-responsive/?zarsrc=30&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo#resources",
    device: "iPhone 15 Pro (iOS 17.5)",
    browser: "Zalo In-App Browser",
    screenRes: "393x852",
    ip: "113.190.234.12",
    location: "Hà Nội, Việt Nam",
    sessionDuration: "Đang xem trang (#resources)",
    result: "success",
    note: "Truy cập từ chiến dịch Zalo vào chuyên mục Tài liệu & Cẩm nang #resources",
    campaign: "Chiến dịch Zalo (zarsrc=30, utm_source=zalo)",
    isLandingPage: true,
  },
  {
    id: "acc_zalo_2",
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    username: "phu_huynh_zalo",
    fullName: "Phụ huynh (Chiến dịch Zalo)",
    role: "guest",
    accessUrl: "https://ananasux.github.io/tre-tu-ky-responsive/?zarsrc=30&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo#resources",
    entryPath: "/tre-tu-ky-responsive/?zarsrc=30&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo#resources",
    device: "Samsung Galaxy S24 (Android 14)",
    browser: "Chrome Mobile 133.0",
    screenRes: "412x915",
    ip: "14.241.120.45",
    location: "Hưng Yên, Việt Nam",
    sessionDuration: "18 phút",
    result: "success",
    note: "Khách Zalo xem biểu phí, phòng can thiệp và tài liệu phụ huynh",
    campaign: "Chiến dịch Zalo (zarsrc=30, utm_source=zalo)",
    isLandingPage: true,
  },
  {
    id: "acc_zalo_3",
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    username: "phu_huynh_zalo",
    fullName: "Phụ huynh (Chiến dịch Zalo)",
    role: "guest",
    accessUrl: "https://ananasux.github.io/tre-tu-ky-responsive/?zarsrc=30&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo#resources",
    entryPath: "/tre-tu-ky-responsive/?zarsrc=30&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo#resources",
    device: "Xiaomi Redmi Note 13",
    browser: "Zalo In-App Browser",
    screenRes: "392x872",
    ip: "125.235.221.88",
    location: "Bắc Ninh, Việt Nam",
    sessionDuration: "8 phút",
    result: "success",
    note: "Phụ huynh tìm hiểu bài tập điều hòa cảm giác và kích thích bật âm",
    campaign: "Chiến dịch Zalo (zarsrc=30, utm_source=zalo)",
    isLandingPage: true,
  },
  {
    id: "acc_zalo_4",
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    username: "phu_huynh_direct",
    fullName: "Phụ huynh (Truy cập Trực tiếp)",
    role: "guest",
    accessUrl: "https://ananasux.github.io/tre-tu-ky-responsive/#resources",
    entryPath: "/tre-tu-ky-responsive/#resources",
    device: "iPad Air (iPadOS 17.4)",
    browser: "Safari 17.4",
    screenRes: "820x1180",
    ip: "118.70.184.62",
    location: "Hà Nam, Việt Nam",
    sessionDuration: "14 phút",
    result: "success",
    note: "Truy cập trực tiếp cẩm nang phương pháp can thiệp sớm PECS",
    campaign: "Truy cập Trực tiếp (Direct)",
    isLandingPage: true,
  },
  {
    id: "acc_zalo_5",
    timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    username: "phu_huynh_zalo",
    fullName: "Phụ huynh (Chiến dịch Zalo)",
    role: "guest",
    accessUrl: "https://ananasux.github.io/tre-tu-ky-responsive/?zarsrc=30&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo#resources",
    entryPath: "/tre-tu-ky-responsive/?zarsrc=30&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo#resources",
    device: "OPPO Reno 11 5G",
    browser: "Zalo In-App Browser",
    screenRes: "393x873",
    ip: "171.244.15.77",
    location: "Hải Dương, Việt Nam",
    sessionDuration: "22 phút",
    result: "success",
    note: "Xem danh sách chuyên gia, chứng chỉ và bấm nút kết nối Zalo",
    campaign: "Chiến dịch Zalo (zarsrc=30, utm_source=zalo)",
    isLandingPage: true,
  },

  // --- PHẦN 2: KÊNH QUẢN TRỊ THEO TÀI KHOẢN & TÍNH NĂNG ---
  {
    id: "acc_cms_1",
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    username: "admin",
    fullName: "Quản trị viên Hệ thống",
    role: "admin",
    accessUrl: "https://ananasux.github.io/xay-kenh-quan-tri/#/chat-khach-hang",
    entryPath: "#/chat-khach-hang",
    device: "Windows 11 PC",
    browser: "Chrome 134.0",
    screenRes: "1920x1080",
    ip: "113.190.234.12",
    location: "Hà Nội, Việt Nam",
    sessionDuration: "Đang hoạt động",
    result: "success",
    featureName: "Live Chat CRM",
    note: "Trực tuyến tiếp nhận và trao đổi tin nhắn trực tiếp với phụ huynh bé Minh An",
    campaign: "Kênh Quản trị CMS",
    isLandingPage: false,
  },
  {
    id: "acc_cms_2",
    timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    username: "admin",
    fullName: "Quản trị viên Hệ thống",
    role: "admin",
    accessUrl: "https://ananasux.github.io/xay-kenh-quan-tri/#/cau-hinh-trang",
    entryPath: "#/cau-hinh-trang",
    device: "Windows 11 PC",
    browser: "Chrome 134.0",
    screenRes: "1920x1080",
    ip: "113.190.234.12",
    location: "Hà Nội, Việt Nam",
    sessionDuration: "45 phút",
    result: "success",
    featureName: "Cấu hình trang",
    note: "Chỉnh sửa nội dung khối Sứ mệnh và cập nhật hồ sơ chuyên gia can thiệp",
    campaign: "Kênh Quản trị CMS",
    isLandingPage: false,
  },
  {
    id: "acc_cms_3",
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    username: "admin",
    fullName: "Quản trị viên Hệ thống",
    role: "admin",
    accessUrl: "https://ananasux.github.io/xay-kenh-quan-tri/#/heatmap",
    entryPath: "#/heatmap",
    device: "Windows 11 PC",
    browser: "Chrome 134.0",
    screenRes: "1920x1080",
    ip: "113.190.234.12",
    location: "Hà Nội, Việt Nam",
    sessionDuration: "20 phút",
    result: "success",
    featureName: "Bản đồ nhiệt UX",
    note: "Phân tích điểm chạm Rage clicks và tối ưu phễu chuyển đổi cho phụ huynh",
    campaign: "Kênh Quản trị CMS",
    isLandingPage: false,
  },
  {
    id: "acc_cms_4",
    timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    username: "nhanvien",
    fullName: "Nhân viên Nội dung",
    role: "staff",
    accessUrl: "https://ananasux.github.io/xay-kenh-quan-tri/#/cau-hinh-trang",
    entryPath: "#/cau-hinh-trang",
    device: "Windows 10 Laptop",
    browser: "Chrome 133.0",
    screenRes: "1366x768",
    ip: "14.241.120.45",
    location: "Hưng Yên, Việt Nam",
    sessionDuration: "30 phút",
    result: "success",
    featureName: "Cấu hình trang",
    note: "Lưu bản nháp nội dung bài viết cẩm nang phụ huynh",
    campaign: "Kênh Quản trị CMS",
    isLandingPage: false,
  },
  {
    id: "acc_cms_5",
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    username: "nhanvien",
    fullName: "Nhân viên Nội dung",
    role: "staff",
    accessUrl: "https://ananasux.github.io/xay-kenh-quan-tri/#/chat-khach-hang",
    entryPath: "#/chat-khach-hang",
    device: "Windows 10 Laptop",
    browser: "Chrome 133.0",
    screenRes: "1366x768",
    ip: "14.241.120.45",
    location: "Hưng Yên, Việt Nam",
    sessionDuration: "50 phút",
    result: "success",
    featureName: "Live Chat CRM",
    note: "Phản hồi câu hỏi về can thiệp sớm và lịch đánh giá sàng lọc của phụ huynh",
    campaign: "Kênh Quản trị CMS",
    isLandingPage: false,
  },
  {
    id: "acc_cms_6",
    timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    username: "admin",
    fullName: "Quản trị viên Hệ thống",
    role: "admin",
    accessUrl: "https://ananasux.github.io/xay-kenh-quan-tri/#/tai-khoan",
    entryPath: "#/tai-khoan",
    device: "Windows 11 PC",
    browser: "Chrome 134.0",
    screenRes: "1920x1080",
    ip: "113.190.234.12",
    location: "Hà Nội, Việt Nam",
    sessionDuration: "15 phút",
    result: "success",
    featureName: "Quản lý tài khoản",
    note: "Kiểm tra danh sách nhân sự và phân quyền chỉnh sửa cho nhân viên",
    campaign: "Kênh Quản trị CMS",
    isLandingPage: false,
  },
  {
    id: "acc_cms_7",
    timestamp: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
    username: "vannam",
    fullName: "Nguyễn Văn Nam",
    role: "staff",
    accessUrl: "https://ananasux.github.io/xay-kenh-quan-tri/#/cau-hinh-trang",
    entryPath: "#/cau-hinh-trang",
    device: "MacBook Air M2",
    browser: "Safari 17.5",
    screenRes: "1440x900",
    ip: "125.235.221.88",
    location: "Hà Nội, Việt Nam",
    sessionDuration: "40 phút",
    result: "success",
    featureName: "Cấu hình trang",
    note: "Cập nhật các hình ảnh hoạt động trải nghiệm thực tế của các bé",
    campaign: "Kênh Quản trị CMS",
    isLandingPage: false,
  },
  {
    id: "acc_cms_8",
    timestamp: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
    username: "admin",
    fullName: "Quản trị viên Hệ thống",
    role: "admin",
    accessUrl: "https://ananasux.github.io/xay-kenh-quan-tri/#/dang-ky-tu-van",
    entryPath: "#/dang-ky-tu-van",
    device: "Windows 11 PC",
    browser: "Chrome 134.0",
    screenRes: "1920x1080",
    ip: "113.190.234.12",
    location: "Hà Nội, Việt Nam",
    sessionDuration: "25 phút",
    result: "success",
    featureName: "Đăng ký tư vấn",
    note: "Xử lý danh sách đăng ký tư vấn và phân công giáo viên phụ trách",
    campaign: "Kênh Quản trị CMS",
    isLandingPage: false,
  },
  {
    id: "acc_cms_9",
    timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    username: "admin",
    fullName: "Quản trị viên Hệ thống",
    role: "admin",
    accessUrl: "https://ananasux.github.io/xay-kenh-quan-tri/#/nhat-ky-hoat-dong",
    entryPath: "#/nhat-ky-hoat-dong",
    device: "Windows 11 PC",
    browser: "Chrome 134.0",
    screenRes: "1920x1080",
    ip: "113.190.234.12",
    location: "Hà Nội, Việt Nam",
    sessionDuration: "12 phút",
    result: "success",
    featureName: "Nhật ký hoạt động",
    note: "Kiểm tra nhật ký kiểm toán và lịch sử truy cập hệ thống",
    campaign: "Kênh Quản trị CMS",
    isLandingPage: false,
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
    let logs: AccessLogEntry[] = INITIAL_ACCESS_LOGS;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          logs = parsed;
        }
      } catch {}
    }

    return logs.map((l: AccessLogEntry) => {
      const isLp = isLandingPageLog(l);
      let feature = l.featureName;
      if (!feature && !isLp) {
        const p = (l.entryPath || l.accessUrl || "").toLowerCase();
        if (p.includes("chat")) feature = "Live Chat CRM";
        else if (p.includes("tai-khoan")) feature = "Quản lý tài khoản";
        else if (p.includes("heatmap")) feature = "Bản đồ nhiệt UX";
        else if (p.includes("dang-ky")) feature = "Đăng ký tư vấn";
        else if (p.includes("phan-tich")) feature = "Phân tích hệ thống";
        else if (p.includes("nhat-ky")) feature = "Nhật ký hoạt động";
        else feature = "Cấu hình trang";
      }
      return {
        ...l,
        isLandingPage: isLp,
        featureName: feature,
        campaign: l.campaign || (isLp ? "Chiến dịch Zalo (zarsrc=30)" : "Kênh Quản trị CMS"),
      };
    });
  } catch {
    return INITIAL_ACCESS_LOGS;
  }
}

// Ghi nhận lượt truy cập vào hệ thống
export function recordAccessLog(data: Partial<AccessLogEntry>): void {
  try {
    const logs = getAccessLogs();
    const env = detectClientEnvironment();

    const isLanding = data.isLandingPage ?? (
      (data.accessUrl && (data.accessUrl.includes("tre-tu-ky-responsive") || data.accessUrl.includes("zarsrc"))) || false
    );

    const newAccess: AccessLogEntry = {
      id: "acc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      timestamp: data.timestamp || new Date().toISOString(),
      username: data.username || (isLanding ? "phu_huynh_zalo" : "khach"),
      fullName: data.fullName || (isLanding ? "Phụ huynh (Chiến dịch Zalo)" : "Khách truy cập"),
      role: data.role || "guest",
      accessUrl: data.accessUrl || window.location.href,
      entryPath: data.entryPath || (isLanding ? "/#resources" : window.location.hash || "#/"),
      device: data.device || env.device,
      browser: data.browser || env.browser,
      screenRes: data.screenRes || env.screenRes,
      ip: data.ip || env.ip,
      location: data.location || "Hà Nội, Việt Nam",
      sessionDuration: data.sessionDuration || "Vừa truy cập",
      result: data.result || "success",
      note: data.note || (isLanding ? "Khách xem tài liệu & tư vấn" : "Truy cập tính năng Kênh Quản trị"),
      campaign: data.campaign || (isLanding ? "Chiến dịch Zalo (zarsrc=30)" : "Kênh Quản trị CMS"),
      isLandingPage: isLanding,
      featureName: data.featureName || (!isLanding ? "Cấu hình trang" : undefined),
    };

    const updated = [newAccess, ...logs].slice(0, 300);
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

// Xuất file CSV lịch sử truy cập Landing Page
export function exportLandingLogsToCsv(logs: AccessLogEntry[]): void {
  const headers = ["Thời gian truy cập", "Địa chỉ IP", "Vị trí địa lý", "Kênh / Nguồn", "URL chi tiết", "Thiết bị", "Trình duyệt", "Trạng thái", "Ghi chú"];
  const rows = logs.map((l) => [
    `"${new Date(l.timestamp).toLocaleString("vi-VN")}"`,
    `"${l.ip}"`,
    `"${l.location}"`,
    `"${l.campaign || "Chiến dịch Zalo"}"`,
    `"${l.accessUrl}"`,
    `"${l.device}"`,
    `"${l.browser}"`,
    `"${l.result === "success" ? "Thành công" : "Đang chờ"}"`,
    `"${(l.note || "").replace(/"/g, '""')}"`,
  ]);
  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Truy-Cap-Landing-Page-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Xuất file CSV thống kê tài khoản truy cập tính năng Kênh Quản trị
export function exportCmsAccessLogsToCsv(logs: AccessLogEntry[]): void {
  const headers = ["Thời gian", "Tài khoản", "Họ tên", "Vai trò", "Tính năng truy cập", "Chi tiết thao tác", "Địa chỉ IP", "Vị trí", "Thiết bị", "Trạng thái"];
  const rows = logs.map((l) => [
    `"${new Date(l.timestamp).toLocaleString("vi-VN")}"`,
    `"@${l.username}"`,
    `"${l.fullName}"`,
    `"${l.role === "admin" ? "Quản trị viên" : "Nhân viên"}"`,
    `"${l.featureName || "Cấu hình trang"}"`,
    `"${(l.note || "").replace(/"/g, '""')}"`,
    `"${l.ip}"`,
    `"${l.location}"`,
    `"${l.device} · ${l.browser}"`,
    `"${l.result === "success" ? "Thành công" : "Cảnh báo"}"`,
  ]);
  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Thong-Ke-Tai-Khoan-Tinh-Nang-CMS-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Đồng bộ nhật ký truy cập từ máy chủ đám mây KVDB (hỗ trợ Landing Page)
export async function syncAccessLogsWithCloud(): Promise<AccessLogEntry[]> {
  try {
    const res = await fetch("https://kvdb.io/RtALwN4JAnjEQUjqKLgAuk/access_logs", { cache: "no-store" });
    if (res.ok) {
      const remoteLogs: AccessLogEntry[] = await res.json();
      if (Array.isArray(remoteLogs) && remoteLogs.length > 0) {
        const localLogs = getAccessLogs();
        const map = new Map<string, AccessLogEntry>();
        [...localLogs, ...remoteLogs].forEach((l) => map.set(l.id, l));
        const merged = Array.from(map.values())
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 300);
        localStorage.setItem(STORAGE_ACCESS_LOGS_KEY, JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent("aurora-access-logged", { detail: merged }));
        return merged;
      }
    }
  } catch (e) {
    console.warn("Could not sync access logs with cloud:", e);
  }
  return getAccessLogs();
}

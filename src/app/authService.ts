import { logAuditAction } from "./auditService";

export type UserRole = "admin" | "staff";

export interface AccountUser {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  lastLogin?: string;
  allowedSections?: string[];
}

const STORAGE_ACCOUNTS_KEY = "aurora-cms:accounts";
const STORAGE_CURRENT_USER_KEY = "aurora-cms:current-user";
const STORAGE_SESSION_ACTIVE_KEY = "aurora-cms:session-active";

export const DEFAULT_ACCOUNTS: AccountUser[] = [
  {
    id: "user-admin",
    username: "admin",
    password: "admin",
    fullName: "Quản trị viên Hệ thống",
    role: "admin",
    createdAt: "2026-10-20T00:00:00.000Z",
  },
  {
    id: "user-staff",
    username: "nhanvien",
    password: "admin",
    fullName: "Nhân viên Nội dung",
    role: "staff",
    createdAt: "2026-10-21T00:00:00.000Z",
    allowedSections: ["mission", "support", "process", "team", "gallery", "resources", "faq"],
  },
];

// Hàm chuẩn hóa username (loại bỏ ký tự @ thừa, khoảng trắng đầu đuôi)
export function normalizeUsername(user: string): string {
  return (user || "").trim().replace(/^@+/, "");
}

// Kiểm tra xem trình duyệt hiện tại đã có session đang hoạt động chưa
export function hasActiveSession(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_SESSION_ACTIVE_KEY) === "true";
  } catch {
    return false;
  }
}

// Khởi tạo và lấy danh sách tài khoản
export function getAccounts(): AccountUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    const accounts = JSON.parse(raw);
    if (!Array.isArray(accounts) || accounts.length === 0) {
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    return accounts;
  } catch {
    return DEFAULT_ACCOUNTS;
  }
}

// Lưu danh sách tài khoản và phát sự kiện đồng bộ
export function saveAccounts(accounts: AccountUser[]): void {
  try {
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent("aurora-accounts-changed", { detail: accounts }));
  } catch {}
}

// Lấy tài khoản đang đăng nhập (trả về null nếu chưa có session)
export function getCurrentUser(): AccountUser | null {
  // Nếu chưa có session nào được lưu trước đó thì yêu cầu người dùng đăng nhập lần đầu
  if (!hasActiveSession()) {
    return null;
  }

  try {
    const raw =
      sessionStorage.getItem(STORAGE_CURRENT_USER_KEY) ||
      localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (raw) {
      const user = JSON.parse(raw);
      if (user && user.id && user.role) return user;
    }
  } catch {}

  return null;
}

// Đặt tài khoản đang đăng nhập & kích hoạt session
export function setCurrentUser(user: AccountUser): void {
  try {
    sessionStorage.setItem(STORAGE_SESSION_ACTIVE_KEY, "true");
    sessionStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
  } catch {}

  // Phát sự kiện đồng bộ
  try {
    window.dispatchEvent(new CustomEvent("aurora-auth-changed", { detail: user }));
  } catch {}
}

// Đăng nhập hệ thống (chấp nhận cả có @ hoặc không @, không phân biệt hoa thường)
export function login(username: string, password: string): { success: boolean; user?: AccountUser; message: string } {
  const accounts = getAccounts();
  const cleanUser = normalizeUsername(username).toLowerCase();

  if (!cleanUser) {
    return { success: false, message: "Vui lòng nhập tên đăng nhập." };
  }

  const found = accounts.find((a) => normalizeUsername(a.username).toLowerCase() === cleanUser);

  if (!found) {
    return { success: false, message: `Tên đăng nhập "${username}" không tồn tại trong hệ thống.` };
  }

  if (found.password !== password) {
    return { success: false, message: "Mật khẩu không chính xác. Vui lòng kiểm tra lại." };
  }

  // Cập nhật lastLogin
  found.lastLogin = new Date().toISOString();
  saveAccounts(accounts);
  setCurrentUser(found);

  return { success: true, user: found, message: `Chào mừng ${found.fullName} (${found.role === "admin" ? "Quản trị viên" : "Nhân viên"})!` };
}

// Đăng xuất
export function logout(): void {
  try {
    sessionStorage.removeItem(STORAGE_SESSION_ACTIVE_KEY);
    sessionStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
  } catch {}

  try {
    window.dispatchEvent(new CustomEvent("aurora-auth-changed", { detail: null }));
  } catch {}
}

// Thêm tài khoản mới
export function addAccount(accountData: Omit<AccountUser, "id" | "createdAt">): { success: boolean; account?: AccountUser; message: string } {
  const accounts = getAccounts();
  const cleanUsername = normalizeUsername(accountData.username);

  if (!cleanUsername) {
    return { success: false, message: "Tên đăng nhập không được để trống." };
  }

  if (accounts.some((a) => normalizeUsername(a.username).toLowerCase() === cleanUsername.toLowerCase())) {
    return { success: false, message: `Tài khoản "${cleanUsername}" đã tồn tại trên hệ thống.` };
  }

  if (!accountData.password || accountData.password.length < 3) {
    return { success: false, message: "Mật khẩu phải từ 3 ký tự trở lên." };
  }

  const newAccount: AccountUser = {
    id: "user_" + Math.random().toString(36).substring(2, 9),
    username: cleanUsername,
    password: accountData.password,
    fullName: (accountData.fullName || "").trim() || cleanUsername,
    role: accountData.role || "staff",
    createdAt: new Date().toISOString(),
    allowedSections: accountData.allowedSections || ["mission", "support", "process", "team", "gallery", "resources", "faq"],
  };

  accounts.push(newAccount);
  saveAccounts(accounts);

  const currentUser = getCurrentUser();
  logAuditAction({
    username: currentUser?.username || "admin",
    fullName: currentUser?.fullName || "Quản trị viên",
    role: currentUser?.role || "admin",
    category: "account",
    action: `Tạo tài khoản mới @${newAccount.username}`,
    detail: `Tạo tài khoản ${newAccount.fullName} (@${newAccount.username}) với vai trò ${newAccount.role === "admin" ? "Quản trị viên" : "Nhân viên"}`,
    target: `@${newAccount.username}`,
    status: "success",
  });

  return { success: true, account: newAccount, message: `Đã tạo tài khoản "${newAccount.username}" thành công!` };
}

// Cập nhật tài khoản
export function updateAccount(id: string, patch: Partial<Omit<AccountUser, "id" | "createdAt">>): { success: boolean; message: string } {
  const accounts = getAccounts();
  const index = accounts.findIndex((a) => a.id === id);

  if (index === -1) {
    return { success: false, message: "Không tìm thấy tài khoản cần cập nhật." };
  }

  const current = accounts[index];
  const cleanUsername = patch.username !== undefined ? normalizeUsername(patch.username) : current.username;

  // Nếu đổi username, kiểm tra trùng lặp
  if (cleanUsername.toLowerCase() !== normalizeUsername(current.username).toLowerCase()) {
    if (accounts.some((a) => a.id !== id && normalizeUsername(a.username).toLowerCase() === cleanUsername.toLowerCase())) {
      return { success: false, message: `Tên đăng nhập "${cleanUsername}" đã được sử dụng bởi tài khoản khác.` };
    }
  }

  accounts[index] = {
    ...current,
    ...patch,
    username: cleanUsername,
    fullName: patch.fullName !== undefined ? (patch.fullName || "").trim() || cleanUsername : current.fullName,
  };

  saveAccounts(accounts);

  // Nếu cập nhật tài khoản đang đăng nhập, cập nhật luôn currentUser
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === id) {
    setCurrentUser(accounts[index]);
  }

  logAuditAction({
    username: currentUser?.username || "admin",
    fullName: currentUser?.fullName || "Quản trị viên",
    role: currentUser?.role || "admin",
    category: "account",
    action: `Cập nhật tài khoản @${accounts[index].username}`,
    detail: `Cập nhật thông tin tài khoản ${accounts[index].fullName} (@${accounts[index].username})`,
    target: `@${accounts[index].username}`,
    status: "success",
  });

  return { success: true, message: "Đã cập nhật thông tin tài khoản thành công!" };
}

// Xóa tài khoản
export function deleteAccount(id: string): { success: boolean; message: string } {
  const accounts = getAccounts();
  const currentUser = getCurrentUser();

  if (currentUser && currentUser.id === id) {
    return { success: false, message: "Bạn không thể xóa tài khoản đang đăng nhập hiện tại." };
  }

  const index = accounts.findIndex((a) => a.id === id);
  if (index === -1) {
    return { success: false, message: "Không tìm thấy tài khoản cần xóa." };
  }

  // Đảm bảo luôn còn ít nhất 1 admin
  const adminCount = accounts.filter((a) => a.role === "admin").length;
  if (accounts[index].role === "admin" && adminCount <= 1) {
    return { success: false, message: "Hệ thống phải có ít nhất 1 tài khoản Quản trị viên." };
  }

  const deletedUser = accounts[index];
  accounts.splice(index, 1);
  saveAccounts(accounts);

  logAuditAction({
    username: currentUser?.username || "admin",
    fullName: currentUser?.fullName || "Quản trị viên",
    role: currentUser?.role || "admin",
    category: "account",
    action: `Xóa tài khoản @${deletedUser.username}`,
    detail: `Đã xóa tài khoản ${deletedUser.fullName} (@${deletedUser.username}) khỏi hệ thống`,
    target: `@${deletedUser.username}`,
    status: "warning",
  });

  return { success: true, message: "Đã xóa tài khoản thành công!" };
}

// Kiểm tra quyền chỉnh sửa khối nội dung trong Cấu hình trang
export function canEditSection(user: AccountUser | null, sectionId: string): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;

  // Nhân viên: chỉ được sửa các khối nội dung được phép
  const allowed = user.allowedSections || ["mission", "support", "process", "team", "gallery", "resources", "faq"];
  return allowed.includes(sectionId);
}

// Kiểm tra quyền xuất bản
export function canPublishContent(user: AccountUser | null): boolean {
  if (!user) return false;
  return user.role === "admin";
}

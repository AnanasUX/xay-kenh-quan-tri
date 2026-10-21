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

// Lưu danh sách tài khoản
export function saveAccounts(accounts: AccountUser[]): void {
  localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
}

// Lấy tài khoản đang đăng nhập
export function getCurrentUser(): AccountUser {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (raw) {
      const user = JSON.parse(raw);
      if (user && user.id && user.role) return user;
    }
  } catch {}

  // Mặc định đăng nhập admin
  const accounts = getAccounts();
  const admin = accounts.find((a) => a.role === "admin") || DEFAULT_ACCOUNTS[0];
  setCurrentUser(admin);
  return admin;
}

// Đặt tài khoản đang đăng nhập
export function setCurrentUser(user: AccountUser): void {
  localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
  // Phát sự kiện đồng bộ
  try {
    window.dispatchEvent(new CustomEvent("aurora-auth-changed", { detail: user }));
  } catch {}
}

// Đăng nhập
export function login(username: string, password: string): { success: boolean; user?: AccountUser; message: string } {
  const accounts = getAccounts();
  const cleanUser = username.trim().toLowerCase();
  const found = accounts.find((a) => a.username.toLowerCase() === cleanUser);

  if (!found) {
    return { success: false, message: "Tên đăng nhập không tồn tại trong hệ thống." };
  }

  if (found.password !== password) {
    return { success: false, message: "Mật khẩu không chính xác." };
  }

  // Cập nhật lastLogin
  found.lastLogin = new Date().toISOString();
  saveAccounts(accounts);
  setCurrentUser(found);

  return { success: true, user: found, message: `Chào mừng ${found.fullName} (${found.role === "admin" ? "Quản trị viên" : "Nhân viên"})!` };
}

// Đăng xuất
export function logout(): void {
  localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
  try {
    window.dispatchEvent(new CustomEvent("aurora-auth-changed", { detail: null }));
  } catch {}
}

// Thêm tài khoản mới
export function addAccount(accountData: Omit<AccountUser, "id" | "createdAt">): { success: boolean; account?: AccountUser; message: string } {
  const accounts = getAccounts();
  const cleanUsername = accountData.username.trim().toLowerCase();

  if (!cleanUsername) {
    return { success: false, message: "Tên đăng nhập không được để trống." };
  }

  if (accounts.some((a) => a.username.toLowerCase() === cleanUsername)) {
    return { success: false, message: `Tài khoản "${accountData.username}" đã tồn tại.` };
  }

  if (!accountData.password || accountData.password.length < 3) {
    return { success: false, message: "Mật khẩu phải từ 3 ký tự trở lên." };
  }

  const newAccount: AccountUser = {
    id: "user_" + Math.random().toString(36).substring(2, 9),
    username: accountData.username.trim(),
    password: accountData.password,
    fullName: accountData.fullName.trim() || accountData.username.trim(),
    role: accountData.role || "staff",
    createdAt: new Date().toISOString(),
    allowedSections: accountData.allowedSections || ["mission", "support", "process", "team", "gallery", "resources", "faq"],
  };

  accounts.push(newAccount);
  saveAccounts(accounts);
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

  // Nếu đổi username, kiểm tra trùng lặp
  if (patch.username && patch.username.trim().toLowerCase() !== current.username.toLowerCase()) {
    const cleanNew = patch.username.trim().toLowerCase();
    if (accounts.some((a) => a.id !== id && a.username.toLowerCase() === cleanNew)) {
      return { success: false, message: `Tên đăng nhập "${patch.username}" đã được sử dụng.` };
    }
  }

  accounts[index] = {
    ...current,
    ...patch,
    username: patch.username ? patch.username.trim() : current.username,
    fullName: patch.fullName ? patch.fullName.trim() : current.fullName,
  };

  saveAccounts(accounts);

  // Nếu cập nhật tài khoản đang đăng nhập, cập nhật luôn currentUser
  const currentUser = getCurrentUser();
  if (currentUser.id === id) {
    setCurrentUser(accounts[index]);
  }

  return { success: true, message: "Đã cập nhật thông tin tài khoản thành công!" };
}

// Xóa tài khoản
export function deleteAccount(id: string): { success: boolean; message: string } {
  const accounts = getAccounts();
  const currentUser = getCurrentUser();

  if (currentUser.id === id) {
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

  accounts.splice(index, 1);
  saveAccounts(accounts);
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

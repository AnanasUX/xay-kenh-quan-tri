import type { IconName } from "./ui";

export const navItems: { label: string; path: string; icon: IconName; badge?: number; adminOnly?: boolean }[] = [
  { label: "Cấu hình trang", path: "/cau-hinh-trang", icon: "page" },
  { label: "Đăng ký tư vấn", path: "/dang-ky-tu-van", icon: "phone", adminOnly: true },
  { label: "Bản đồ nhiệt UX", path: "/heatmap", icon: "flame", adminOnly: true },
  { label: "Quản lý tài khoản", path: "/tai-khoan", icon: "profile", adminOnly: true },
];

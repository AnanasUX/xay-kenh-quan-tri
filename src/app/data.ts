import type { IconName } from "./ui";

export const navItems: { label: string; path: string; icon: IconName; badge?: number; adminOnly?: boolean }[] = [
  { label: "Cấu hình trang", path: "/cau-hinh-trang", icon: "page" },
  { label: "Quản lý bài viết", path: "/quan-ly-bai-viet", icon: "article" },
  { label: "Chat trực tiếp khách", path: "/chat-khach-hang", icon: "message" },
  { label: "Đăng ký tư vấn", path: "/dang-ky-tu-van", icon: "phone", adminOnly: true },
  { label: "Bản đồ nhiệt UX", path: "/heatmap", icon: "flame", adminOnly: true },
  { label: "Phân tích hệ thống", path: "/phan-tich-he-thong", icon: "sparkle", adminOnly: true },
  { label: "Quản lý tài khoản", path: "/tai-khoan", icon: "profile", adminOnly: true },
  { label: "Quản lý AI hệ thống", path: "/quan-ly-ai-he-thong", icon: "sparkle", adminOnly: true },
  { label: "Nhật ký hoạt động", path: "/nhat-ky-hoat-dong", icon: "history", adminOnly: true },
];

import { createHashRouter, Navigate, useRouteError } from "react-router";
import { AccountsPage } from "./AccountsPage";
import { AiManagementPage } from "./AiManagementPage";
import { ArticlesManagementPage } from "./ArticlesManagementPage";
import { AuditLogsPage } from "./AuditLogsPage";
import { ConsultationsPage } from "./ConsultationsPage";
import { HeatmapPage } from "./HeatmapPage";
import Layout from "./Layout";
import { LiveChatPage } from "./LiveChatPage";
import { PageConfigPage } from "./PageConfigPage";
import { SystemAnalysisPage } from "./SystemAnalysisPage";

function RootErrorBoundary() {
  const error: any = useRouteError();
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: 20 }}>
      <div style={{ maxWidth: 540, background: "#ffffff", padding: 32, borderRadius: 16, boxShadow: "0 10px 25px rgba(0,0,0,0.08)", textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🛡️</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
          Hệ thống Quản trị Đang Khôi phục Trạng thái
        </h2>
        <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.6, marginBottom: 20 }}>
          {error?.message || "Đã xảy ra sự cố hiển thị nhỏ. Phiên làm việc và dữ liệu của bạn vẫn an toàn tuyệt đối."}
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ padding: "10px 20px", borderRadius: 8, background: "#7c3aed", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
          >
            Tải lại trang
          </button>
          <a
            href="#/cau-hinh-trang"
            style={{ padding: "10px 20px", borderRadius: 8, background: "#f1f5f9", color: "#334155", textDecoration: "none", fontWeight: 600 }}
          >
            Về Cấu hình trang
          </a>
        </div>
      </div>
    </div>
  );
}

export const router = createHashRouter([
  {
    path: "/",
    Component: Layout,
    ErrorBoundary: RootErrorBoundary,
    children: [
      { index: true, element: <Navigate to="/cau-hinh-trang" replace /> },
      { path: "cau-hinh-trang", Component: PageConfigPage },
      { path: "quan-ly-bai-viet", Component: ArticlesManagementPage },
      { path: "chat-khach-hang", Component: LiveChatPage },
      { path: "dang-ky-tu-van", Component: ConsultationsPage },
      { path: "heatmap", Component: HeatmapPage },
      { path: "phan-tich-he-thong", Component: SystemAnalysisPage },
      { path: "tai-khoan", Component: AccountsPage },
      { path: "quan-ly-ai-he-thong", Component: AiManagementPage },
      { path: "nhat-ky-hoat-dong", Component: AuditLogsPage },
      { path: "*", element: <Navigate to="/cau-hinh-trang" replace /> },
    ],
  },
]);

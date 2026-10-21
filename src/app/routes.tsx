import { createHashRouter, Navigate } from "react-router";
import { AccountsPage } from "./AccountsPage";
import { AuditLogsPage } from "./AuditLogsPage";
import { ConsultationsPage } from "./ConsultationsPage";
import { HeatmapPage } from "./HeatmapPage";
import Layout from "./Layout";
import { LiveChatPage } from "./LiveChatPage";
import { PageConfigPage } from "./PageConfigPage";
import { SystemAnalysisPage } from "./SystemAnalysisPage";

export const router = createHashRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, element: <Navigate to="/cau-hinh-trang" replace /> },
      { path: "cau-hinh-trang", Component: PageConfigPage },
      { path: "chat-khach-hang", Component: LiveChatPage },
      { path: "dang-ky-tu-van", Component: ConsultationsPage },
      { path: "heatmap", Component: HeatmapPage },
      { path: "phan-tich-he-thong", Component: SystemAnalysisPage },
      { path: "tai-khoan", Component: AccountsPage },
      { path: "nhat-ky-hoat-dong", Component: AuditLogsPage },
      { path: "*", element: <Navigate to="/cau-hinh-trang" replace /> },
    ],
  },
]);

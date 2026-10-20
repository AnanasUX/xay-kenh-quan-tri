import { createHashRouter, Navigate } from "react-router";
import { ConsultationsPage } from "./ConsultationsPage";
import { HeatmapPage } from "./HeatmapPage";
import Layout from "./Layout";
import { PageConfigPage } from "./PageConfigPage";

export const router = createHashRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, element: <Navigate to="/cau-hinh-trang" replace /> },
      { path: "cau-hinh-trang", Component: PageConfigPage },
      { path: "dang-ky-tu-van", Component: ConsultationsPage },
      { path: "heatmap", Component: HeatmapPage },
      { path: "*", element: <Navigate to="/cau-hinh-trang" replace /> },
    ],
  },
]);

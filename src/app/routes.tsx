import { createHashRouter, Navigate } from "react-router";
import Layout from "./Layout";
import { PageConfigPage } from "./PageConfigPage";

export const router = createHashRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, element: <Navigate to="/cau-hinh-trang" replace /> },
      { path: "cau-hinh-trang", Component: PageConfigPage },
      { path: "*", element: <Navigate to="/cau-hinh-trang" replace /> },
    ],
  },
]);

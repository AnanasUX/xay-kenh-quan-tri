import React, { useState, useEffect, useRef } from "react";
import { useCms } from "./Layout";
import {
  type MultiAiKeyItem,
  type MultiAiAgentExchange,
  type MultiAiAgentRole,
  type ComplianceAuditReport,
  type ComplianceAuditIssue,
  DEFAULT_MULTI_AI_KEYS,
  getStoredMultiAiKeys,
  saveStoredMultiAiKeys,
  testGeminiApiKey,
  testMultipleGeminiApiKeys,
  runSystemWideMultiAgentSync,
  STORAGE_KEY_SYSTEM_AI_SYNC_LOGS,
  IMMUTABLE_SYSTEM_INFO,
  runAutomatedComplianceAudit,
  applyOneClickAutoFix,
  getStoredComplianceAuditReport,
} from "./aiService";
import { initialLandingPageConfig, type LandingPageConfig } from "./landingPage";
import { logAuditAction } from "./auditService";
import { Icon, PageHeading } from "./ui";

const CMS_MODULES = [
  { id: "page_config", name: "Cấu hình trang & 11 khối", path: "/cau-hinh-trang", icon: "page" },
  { id: "live_chat", name: "Chat trực tiếp khách & Q&A Matrix", path: "/chat-khach-hang", icon: "message" },
  { id: "consultations", name: "Đăng ký tư vấn phụ huynh", path: "/dang-ky-tu-van", icon: "phone" },
  { id: "heatmap", name: "Bản đồ nhiệt & Hành vi UX", path: "/heatmap", icon: "flame" },
  { id: "system_analysis", name: "Phân tích hệ thống & Lập kế hoạch", path: "/phan-tich-he-thong", icon: "sparkle" },
  { id: "audit_security", name: "Bảo mật & Nhật ký kiểm toán", path: "/nhat-ky-hoat-dong", icon: "history" },
] as const;

export function AiManagementPage() {
  const { notify, currentUser } = useCms();

  // Multi-AI keys state
  const [multiAiKeys, setMultiAiKeys] = useState<MultiAiKeyItem[]>(getStoredMultiAiKeys);
  const [visibleKeySecrets, setVisibleKeySecrets] = useState<Record<string, boolean>>({});
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [isPingAllRunning, setIsPingAllRunning] = useState(false);

  // Modal State
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [editingKeyItem, setEditingKeyItem] = useState<MultiAiKeyItem | null>(null);

  // Sync session state
  const [isSyncRunning, setIsSyncRunning] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatusText, setSyncStatusText] = useState("");
  const [agentLogs, setAgentLogs] = useState<MultiAiAgentExchange[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SYSTEM_AI_SYNC_LOGS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  // Filter & Search for dialogue logs
  const [logFilterRole, setLogFilterRole] = useState<"all" | MultiAiAgentRole>("all");
  const [logSearchQuery, setLogSearchQuery] = useState("");

  // Helper to load current landing config
  const loadCurrentConfig = (): LandingPageConfig => {
    try {
      const raw = localStorage.getItem("aurora_landing_config_v1");
      if (raw) return JSON.parse(raw);
    } catch {}
    return initialLandingPageConfig;
  };

  // Automated Quality & Compliance Auditor State
  const [auditReport, setAuditReport] = useState<ComplianceAuditReport | null>(getStoredComplianceAuditReport);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditStatusText, setAuditStatusText] = useState("");
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [autoFixSuccessMsg, setAutoFixSuccessMsg] = useState<string | null>(null);
  const [activeAuditTab, setActiveAuditTab] = useState<"issues" | "debate">("issues");
  const [issueSeverityFilter, setIssueSeverityFilter] = useState<"all" | "critical" | "warning" | "info">("all");

  // Initial audit run on first mount if none exists
  useEffect(() => {
    if (!auditReport) {
      const cfg = loadCurrentConfig();
      runAutomatedComplianceAudit(cfg, multiAiKeys).then(setAuditReport).catch(() => {});
    }
  }, []);

  const handleRunComplianceAudit = async () => {
    setIsAuditing(true);
    setAuditProgress(15);
    setAuditStatusText("Khởi chạy AI Auditor kiểm định toàn bộ 11 khối...");
    setAutoFixSuccessMsg(null);
    try {
      const cfg = loadCurrentConfig();
      const report = await runAutomatedComplianceAudit(cfg, multiAiKeys, (msg, pct) => {
        setAuditStatusText(msg);
        setAuditProgress(pct);
      });
      setAuditReport(report);
      logAuditAction({
        username: currentUser?.username || "admin",
        fullName: currentUser?.fullName || "Quản trị viên",
        role: currentUser?.role || "admin",
        category: "ai",
        action: "Kiểm định chất lượng toàn trang (Automated Quality Auditor)",
        detail: `Hoàn tất kiểm định: Điểm sức khỏe ${report.overallScore}/100. Ghi nhận ${report.totalIssues} vấn đề (${report.criticalCount} lỗi nghiêm trọng).`,
        target: "Quản lý AI hệ thống",
        status: "success",
      });
      notify(`Hoàn tất kiểm định! Điểm chất lượng: ${report.overallScore}/100`);
    } catch (err: any) {
      notify(`Lỗi khi kiểm định: ${err?.message || "Không xác định"}`);
    } finally {
      setIsAuditing(false);
      setAuditProgress(100);
    }
  };

  const handleApplyAutoFix = () => {
    setIsAutoFixing(true);
    try {
      const cfg = loadCurrentConfig();
      const res = applyOneClickAutoFix(cfg);
      setAutoFixSuccessMsg(`Đã tự động sửa thành công ${res.fixedCount} vấn đề! Đưa 5 hằng số và địa chỉ TDP Duyên Phúc Hưng Yên về chuẩn mực 100%, xuất bản lên Live Cloud.`);
      logAuditAction({
        username: currentUser?.username || "admin",
        fullName: currentUser?.fullName || "Quản trị viên",
        role: currentUser?.role || "admin",
        category: "ai",
        action: "Áp dụng Sửa lỗi Tự động 1-Chạm (1-Click Auto-Fix)",
        detail: `Tự động khắc phục ${res.fixedCount} vấn đề toàn trang. Chuẩn hóa địa chỉ TDP Duyên Phúc Hưng Yên và đồng bộ Live Cloud.`,
        target: "Quản lý AI hệ thống",
        status: "success",
      });
      notify(`Đã sửa tự động ${res.fixedCount} vấn đề thành công! Trang web đã đạt chuẩn mực tối đa.`);
      setTimeout(async () => {
        const fresh = await runAutomatedComplianceAudit(res.updatedConfig, multiAiKeys);
        setAuditReport(fresh);
        setIsAutoFixing(false);
      }, 500);
    } catch (err: any) {
      notify(`Lỗi khi sửa tự động: ${err?.message || "Không xác định"}`);
      setIsAutoFixing(false);
    }
  };

  // Sync changes across tabs / storage events
  useEffect(() => {
    const handleStorageChange = (e: any) => {
      if (e.detail) {
        setMultiAiKeys(e.detail);
      } else {
        setMultiAiKeys(getStoredMultiAiKeys());
      }
    };
    window.addEventListener("aurora_multi_ai_keys_updated", handleStorageChange);
    return () => {
      window.removeEventListener("aurora_multi_ai_keys_updated", handleStorageChange);
    };
  }, []);

  // Save keys & notify
  const updateKeysList = (updated: MultiAiKeyItem[], logActionText?: string) => {
    setMultiAiKeys(updated);
    saveStoredMultiAiKeys(updated);
    if (logActionText) {
      logAuditAction({
        username: currentUser?.username || "admin",
        fullName: currentUser?.fullName || "Quản trị viên",
        role: currentUser?.role || "admin",
        category: "ai",
        action: logActionText,
        detail: `Cập nhật danh mục AI: hiện có ${updated.length} key trong hệ thống.`,
        target: "Quản lý AI hệ thống",
        status: "success",
      });
    }
  };

  // Ping All
  const handlePingAllKeys = async () => {
    setIsPingAllRunning(true);
    notify("Đang kiểm tra kết nối toàn bộ Key AI tới Google AI Studio...");
    try {
      const tested = await testMultipleGeminiApiKeys(multiAiKeys);
      updateKeysList(tested, "Kiểm tra Ping All toàn bộ Key AI");
      const activeCount = tested.filter((k) => k.status === "active").length;
      notify(`Đã kiểm tra xong: ${activeCount}/${tested.length} Key hoạt động tốt!`);
    } catch (err: any) {
      notify(`Lỗi khi kiểm tra: ${err?.message || "Không xác định"}`);
    } finally {
      setIsPingAllRunning(false);
    }
  };

  // Test single key
  const handleTestSingleKey = async (keyItem: MultiAiKeyItem) => {
    if (!keyItem.apiKey || keyItem.apiKey.trim().length < 15) {
      notify(`Vui lòng nhập API Key hợp lệ cho "${keyItem.name}" trước khi kiểm tra.`);
      return;
    }
    setTestingKeyId(keyItem.id);
    const t0 = performance.now();
    try {
      const res = await testGeminiApiKey(keyItem.apiKey.trim());
      const latency = Math.round(performance.now() - t0);
      const updated = multiAiKeys.map((k) => {
        if (k.id !== keyItem.id) return k;
        if (res.ok) {
          return {
            ...k,
            status: "active" as const,
            statusMessage: `Kết nối thành công (${latency}ms) - ${res.model || k.model}`,
            testedAt: new Date().toLocaleTimeString("vi-VN"),
            latencyMs: latency,
          };
        } else {
          return {
            ...k,
            status: "error" as const,
            statusMessage: res.error || "Không thể kết nối đến Google AI Studio",
            testedAt: new Date().toLocaleTimeString("vi-VN"),
            latencyMs: latency,
          };
        }
      });
      updateKeysList(updated);
      if (res.ok) {
        notify(`✅ "${keyItem.name}" hoạt động tốt (${latency}ms)!`);
      } else {
        notify(`❌ "${keyItem.name}" lỗi: ${res.error || "Không thể kết nối"}`);
      }
    } catch (err: any) {
      notify(`❌ Lỗi kiểm tra "${keyItem.name}": ${err?.message || "Lỗi mạng"}`);
    } finally {
      setTestingKeyId(null);
    }
  };

  // Toggle active/inactive
  const handleToggleKeyActive = (id: string) => {
    const updated = multiAiKeys.map((k) => (k.id === id ? { ...k, isActive: !k.isActive } : k));
    const target = multiAiKeys.find((k) => k.id === id);
    updateKeysList(updated, `${target?.isActive ? "Tạm dừng" : "Kích hoạt"} Key AI "${target?.name}"`);
    notify(`Đã ${target?.isActive ? "tạm dừng" : "kích hoạt"} "${target?.name}"`);
  };

  // Delete key
  const handleDeleteKey = (id: string) => {
    const target = multiAiKeys.find((k) => k.id === id);
    if (!target) return;
    if (multiAiKeys.length <= 1) {
      notify("Hệ thống phải duy trì ít nhất 1 Key AI.");
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa Key "${target.name}" khỏi hệ thống?`)) {
      const updated = multiAiKeys.filter((k) => k.id !== id);
      updateKeysList(updated, `Xóa Key AI "${target.name}"`);
      notify(`Đã xóa Key "${target.name}"`);
    }
  };

  // Open Add modal
  const handleOpenAddModal = () => {
    setEditingKeyItem({
      id: "ai-key-" + Date.now(),
      name: `Key API ${multiAiKeys.length + 1} - Chuyên gia Tùy biến`,
      role: "custom",
      roleTitle: "Chuyên gia Phân tích & Vận hành CMS",
      scopeDescription: "Hỗ trợ phân tích chuyên sâu các phân hệ nghiệp vụ theo chỉ đạo của Giám đốc.",
      apiKey: "",
      model: "gemini-2.5-flash",
      isActive: true,
      status: "untested",
      icon: "🤖",
      badgeColor: "#059669",
      assignedModules: ["page_config", "system_analysis"],
    });
    setShowKeyModal(true);
  };

  // Open Edit modal
  const handleOpenEditModal = (item: MultiAiKeyItem) => {
    setEditingKeyItem({ ...item });
    setShowKeyModal(true);
  };

  // Save Modal
  const handleSaveModal = (item: MultiAiKeyItem) => {
    if (!item.name.trim()) {
      notify("Vui lòng nhập tên gợi nhớ cho Key AI.");
      return;
    }
    const idx = multiAiKeys.findIndex((k) => k.id === item.id);
    let updated: MultiAiKeyItem[];
    if (idx >= 0) {
      updated = [...multiAiKeys];
      updated[idx] = item;
      updateKeysList(updated, `Cập nhật cấu hình Key AI "${item.name}"`);
      notify(`Đã cập nhật Key "${item.name}" thành công!`);
    } else {
      updated = [...multiAiKeys, item];
      updateKeysList(updated, `Thêm Key AI mới "${item.name}"`);
      notify(`Đã thêm Key AI mới "${item.name}" thành công!`);
    }
    setShowKeyModal(false);
  };

  // Run System-Wide Multi-Agent Sync
  const handleRunSystemSync = async () => {
    setIsSyncRunning(true);
    setSyncProgress(10);
    setSyncStatusText("Khởi động Hội đồng Giao ban Multi-Agent AI...");
    notify("Bắt đầu phiên Giao ban Multi-Agent điều hành Kênh Quản trị...");

    try {
      const logs = await runSystemWideMultiAgentSync(multiAiKeys, (msg, pct) => {
        setSyncStatusText(msg);
        setSyncProgress(pct);
      });
      setAgentLogs(logs);
      try {
        localStorage.setItem(STORAGE_KEY_SYSTEM_AI_SYNC_LOGS, JSON.stringify(logs));
      } catch {}

      logAuditAction({
        username: currentUser?.username || "admin",
        fullName: currentUser?.fullName || "Quản trị viên",
        role: currentUser?.role || "admin",
        category: "ai",
        action: "Họp Giao ban Multi-Agent Toàn Hệ thống",
        detail: "Hội đồng 3 Agent AI (Nhân viên, Quản lý, Giám đốc) đã hoàn tất rà soát 6 phân hệ CMS & bảo vệ 5 hằng số.",
        target: "Kênh Quản trị CMS",
        status: "success",
      });

      notify("🎉 Giao ban hoàn tất! Hội đồng AI đã đồng thuận kế hoạch vận hành toàn diện.");
    } catch (err: any) {
      notify(`Lỗi giao ban: ${err?.message || "Không xác định"}`);
    } finally {
      setIsSyncRunning(false);
      setSyncProgress(100);
    }
  };

  // Copy Logs
  const handleCopyLogs = () => {
    if (!agentLogs || agentLogs.length === 0) {
      notify("Chưa có nhật ký trao đổi để sao chép.");
      return;
    }
    let text = "================================================================================\n";
    text += "NHẬT KÝ ĐỐI THOẠI & GIAO BAN ĐIỀU HÀNH MULTI-AGENT AI (MULTI-AGENT SWARM LOG)\n";
    text += "Hệ thống: Kênh Quản trị CMS & Landing Page Trẻ tự kỷ Cô Hương\n";
    text += `Thời gian: ${new Date().toLocaleString("vi-VN")}\n`;
    text += "================================================================================\n\n";

    agentLogs.forEach((msg, i) => {
      text += `[BƯỚC ${i + 1}] ${msg.senderName.toUpperCase()} (${msg.senderTitle})\n`;
      text += `Thời gian: ${msg.timestamp} | Trạng thái: ${msg.decisionStatus.toUpperCase()} | Mô hình: ${msg.rawModelUsed}\n\n`;
      text += `PHÁT HIỆN CHÍNH:\n`;
      msg.keyFindings.forEach((f) => (text += `  • ${f}\n`));
      text += `\nKHUYẾN NGHỊ & PHÁN QUYẾT:\n`;
      msg.actionRecommendations.forEach((r) => (text += `  • ${r}\n`));
      text += `\nNỘI DUNG PHÁT BIỂU:\n"${msg.speechContent}"\n\n`;
      text += "--------------------------------------------------------------------------------\n\n";
    });

    navigator.clipboard.writeText(text);
    notify("Đã sao chép toàn bộ nhật ký trao đổi AI vào bộ nhớ tạm!");
  };

  // Download Logs as .txt
  const handleDownloadLogsTxt = () => {
    if (!agentLogs || agentLogs.length === 0) {
      notify("Chưa có nhật ký trao đổi để tải xuống.");
      return;
    }
    let text = "================================================================================\n";
    text += "BIÊN BẢN HỘI ĐỒNG MULTI-AGENT GOOGLE GEMINI AI - ĐIỀU HÀNH TOÀN DIỆN HỆ THỐNG\n";
    text += "Trung tâm Hỗ trợ Trẻ tự kỷ Cô Hương - TDP Duyên Phúc, Hưng Hà, Hưng Yên\n";
    text += `Ngày xuất: ${new Date().toLocaleString("vi-VN")}\n`;
    text += "================================================================================\n\n";

    agentLogs.forEach((msg, i) => {
      text += `--------------------------------------------------------------------------------\n`;
      text += `CẤP BẬC ${i + 1}: ${msg.senderName} (${msg.senderTitle})\n`;
      text += `Thời gian ghi nhận: ${msg.timestamp} | Kết luận: ${msg.decisionStatus}\n`;
      text += `Mô hình sử dụng: ${msg.rawModelUsed}\n`;
      text += `--------------------------------------------------------------------------------\n`;
      text += `1. CÁC PHÁT HIỆN NỘI BỘ:\n`;
      msg.keyFindings.forEach((f, idx) => (text += `   ${idx + 1}. ${f}\n`));
      text += `\n2. KHUYẾN NGHỊ & PHÁN QUYẾT:\n`;
      msg.actionRecommendations.forEach((r, idx) => (text += `   ${idx + 1}. ${r}\n`));
      text += `\n3. LỜI PHÁT BIỂU ĐỐI THOẠI:\n`;
      text += `   "${msg.speechContent}"\n\n`;
    });

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bien-ban-giao-ban-multi-ai-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Đã tải file biên bản đối thoại Multi-AI thành công!");
  };

  // Export Keys Config JSON
  const handleExportKeysJson = () => {
    const safeKeys = multiAiKeys.map((k) => ({
      ...k,
      apiKey: k.apiKey ? k.apiKey.slice(0, 6) + "..." + k.apiKey.slice(-4) : "",
    }));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(safeKeys, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `danh-muc-key-ai-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    notify("Đã xuất file cấu hình danh mục Key AI thành công!");
  };

  // Filtered logs
  const filteredLogs = agentLogs.filter((log) => {
    if (logFilterRole !== "all" && log.role !== logFilterRole) return false;
    if (logSearchQuery.trim()) {
      const q = logSearchQuery.toLowerCase();
      const matchSpeech = log.speechContent.toLowerCase().includes(q);
      const matchName = log.senderName.toLowerCase().includes(q);
      const matchFindings = log.keyFindings.some((f) => f.toLowerCase().includes(q));
      const matchRecs = log.actionRecommendations.some((r) => r.toLowerCase().includes(q));
      return matchSpeech || matchName || matchFindings || matchRecs;
    }
    return true;
  });

  const activeKeysCount = multiAiKeys.filter((k) => k.isActive).length;

  return (
    <div className="accounts-page" style={{ paddingBottom: 60 }}>
      <PageHeading
        eyebrow="Hệ thống & Trí tuệ nhân tạo"
        title="Quản lý AI hệ thống"
        description="Cấu hình danh mục Google Gemini API Key riêng biệt, phân cấp quyền hạn Agent (Nhân viên, Quản lý, Giám đốc), kiểm tra kết nối Ping All và ma trận vận hành toàn diện Kênh Quản trị."
        action={
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              className="primary-button"
              type="button"
              onClick={handleRunSystemSync}
              disabled={isSyncRunning}
              title="Khởi động phiên họp giao ban Multi-Agent AI rà soát toàn bộ hệ thống"
            >
              <Icon name="sparkle" size={16} />
              <span>{isSyncRunning ? "Đang giao ban..." : "Giao ban Multi-Agent (Multi-AI Sync)"}</span>
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={handlePingAllKeys}
              disabled={isPingAllRunning}
              title="Kiểm tra kết nối và độ trễ toàn bộ Key AI tới Google AI Studio"
            >
              <Icon name="sparkle" size={16} />
              <span>{isPingAllRunning ? "Đang kiểm tra..." : "Kiểm tra toàn bộ AI (Ping All)"}</span>
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={handleOpenAddModal}
              title="Thêm Key AI mới vào hệ thống"
            >
              <Icon name="plus" size={16} />
              <span>Thêm Key AI Mới</span>
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={handleExportKeysJson}
              title="Xuất cấu hình danh mục Key AI ra file JSON"
            >
              <Icon name="download" size={16} />
              <span>Xuất JSON</span>
            </button>
          </div>
        }
      />

      {/* AUTOMATED QUALITY & COMPLIANCE AUDITOR CARD */}
      <div
        className="compliance-auditor-panel"
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e0e7ff",
          boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.07), 0 8px 10px -6px rgba(79, 70, 229, 0.05)",
          marginBottom: "28px",
          overflow: "hidden",
        }}
      >
        {/* Panel Header */}
        <div
          style={{
            padding: "20px 24px",
            background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
            borderBottom: "1px solid #e0e7ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
              }}
            >
              <Icon name="shield" size={24} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#1e1b4b" }}>
                  AI Kiểm Định Chất Lượng & Tuân Thủ Toàn Trang
                </h3>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "3px 9px",
                    borderRadius: "999px",
                    background: auditReport && auditReport.criticalCount === 0 ? "#dcfce7" : "#fee2e2",
                    color: auditReport && auditReport.criticalCount === 0 ? "#15803d" : "#b91c1c",
                    border: `1px solid ${auditReport && auditReport.criticalCount === 0 ? "#bbf7d0" : "#fecaca"}`,
                  }}
                >
                  {auditReport && auditReport.criticalCount === 0 ? "✓ 100% Chuẩn mực Pháp lý" : `⚠️ Có ${auditReport?.criticalCount || 0} Lỗi cần sửa`}
                </span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                Hệ thống Multi-Agent AI tự động quét 11 khối, bảo vệ 5 hằng số pháp lý (TDP Duyên Phúc, Hưng Yên) và hỗ trợ sửa lỗi tự động 1-chạm.
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="secondary-button"
              style={{ height: "38px", padding: "0 14px", fontSize: "13px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={handleRunComplianceAudit}
              disabled={isAuditing}
            >
              <Icon name="sparkle" size={15} />
              <span>{isAuditing ? "Đang quét..." : "Quét lại toàn trang"}</span>
            </button>
            <button
              type="button"
              className="primary-button"
              style={{
                height: "38px",
                padding: "0 16px",
                fontSize: "13px",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                border: "none",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
              }}
              onClick={handleApplyAutoFix}
              disabled={isAutoFixing}
              title="Tự động sửa toàn bộ địa chỉ Thái Bình thành Hưng Yên, khôi phục 5 hằng số và xuất bản lên Cloud"
            >
              <Icon name="check" size={16} />
              <span>{isAutoFixing ? "Đang tự động sửa..." : "⚡ Sửa Toàn Bộ Lỗi Tự Động (1-Click Auto-Fix)"}</span>
            </button>
          </div>
        </div>

        {/* Progress bar during audit */}
        {isAuditing && (
          <div style={{ padding: "12px 24px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#4338ca", fontWeight: "600", marginBottom: "6px" }}>
              <span>{auditStatusText}</span>
              <span>{auditProgress}%</span>
            </div>
            <div style={{ height: "6px", background: "#e0e7ff", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${auditProgress}%`, height: "100%", background: "linear-gradient(90deg, #4f46e5, #7c3aed)", transition: "width 0.3s ease" }} />
            </div>
          </div>
        )}

        {/* Auto-fix success banner */}
        {autoFixSuccessMsg && (
          <div
            style={{
              padding: "12px 24px",
              background: "#ecfdf5",
              borderBottom: "1px solid #a7f3d0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#065f46", fontWeight: "600" }}>
              <span style={{ fontSize: "16px" }}>🎉</span>
              <span>{autoFixSuccessMsg}</span>
            </div>
            <button
              type="button"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#047857", fontWeight: "700", fontSize: "12px" }}
              onClick={() => setAutoFixSuccessMsg(null)}
            >
              Đóng
            </button>
          </div>
        )}

        {/* Audit Body */}
        {auditReport && (
          <div style={{ padding: "24px" }}>
            {/* Score & Pillars Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "14px",
                marginBottom: "22px",
              }}
            >
              {/* Overall Score */}
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: "12px",
                  background: auditReport.overallScore >= 90 ? "#f0fdf4" : auditReport.overallScore >= 70 ? "#fffbeb" : "#fef2f2",
                  border: `1px solid ${auditReport.overallScore >= 90 ? "#bbf7d0" : auditReport.overallScore >= 70 ? "#fde68a" : "#fecaca"}`,
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: "900",
                    color: auditReport.overallScore >= 90 ? "#15803d" : auditReport.overallScore >= 70 ? "#b45309" : "#b91c1c",
                    lineHeight: 1,
                  }}
                >
                  {auditReport.overallScore}
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#64748b" }}>/100</span>
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "13px", color: "#1e293b" }}>Điểm Sức Khỏe Toàn Trang</strong>
                  <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                    {auditReport.criticalCount === 0 ? "Tuyệt đối an toàn" : `Còn ${auditReport.criticalCount} lỗi cần xử lý`}
                  </span>
                </div>
              </div>

              {/* Legal & Constants */}
              <div style={{ padding: "14px 18px", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>⚖️ Pháp lý & 5 Hằng số</span>
                  <strong style={{ fontSize: "13px", color: auditReport.legalScore >= 90 ? "#16a34a" : "#dc2626" }}>{auditReport.legalScore}%</strong>
                </div>
                <small style={{ display: "block", fontSize: "11px", color: "#64748b" }}>TDP Duyên Phúc, Hưng Yên & hotline</small>
              </div>

              {/* 11 Sections Integrity */}
              <div style={{ padding: "14px 18px", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>📑 Toàn vẹn 11 Khối</span>
                  <strong style={{ fontSize: "13px", color: auditReport.contentScore >= 90 ? "#16a34a" : "#d97706" }}>{auditReport.contentScore}%</strong>
                </div>
                <small style={{ display: "block", fontSize: "11px", color: "#64748b" }}>Tiêu đề, mô tả & mạch thông tin</small>
              </div>

              {/* Links & Channels */}
              <div style={{ padding: "14px 18px", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>🔗 Kênh Hotline & Zalo</span>
                  <strong style={{ fontSize: "13px", color: "#16a34a" }}>{auditReport.linksScore}%</strong>
                </div>
                <small style={{ display: "block", fontSize: "11px", color: "#64748b" }}>Kênh chuyển đổi nhanh cho ba mẹ</small>
              </div>

              {/* Mobile Thumb UX */}
              <div style={{ padding: "14px 18px", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>📱 Công thái học chạm</span>
                  <strong style={{ fontSize: "13px", color: "#16a34a" }}>{auditReport.uxScore}%</strong>
                </div>
                <small style={{ display: "block", fontSize: "11px", color: "#64748b" }}>Nút nổi 52px chuẩn ngón tay cái</small>
              </div>
            </div>

            {/* Audit Sub-Tabs */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "12.5px",
                    fontWeight: "600",
                    border: "none",
                    cursor: "pointer",
                    background: activeAuditTab === "issues" ? "#4f46e5" : "#f1f5f9",
                    color: activeAuditTab === "issues" ? "#ffffff" : "#475569",
                  }}
                  onClick={() => setActiveAuditTab("issues")}
                >
                  🔍 Danh sách Vấn đề Phát hiện ({auditReport.issues.length})
                </button>
                <button
                  type="button"
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "12.5px",
                    fontWeight: "600",
                    border: "none",
                    cursor: "pointer",
                    background: activeAuditTab === "debate" ? "#4f46e5" : "#f1f5f9",
                    color: activeAuditTab === "debate" ? "#ffffff" : "#475569",
                  }}
                  onClick={() => setActiveAuditTab("debate")}
                >
                  💬 Hội đồng Đa Agent Thẩm định & Phản biện ({auditReport.agentDebateLog.length})
                </button>
              </div>

              {activeAuditTab === "issues" && (
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <span style={{ fontSize: "11.5px", color: "#64748b" }}>Lọc:</span>
                  {(["all", "critical", "warning", "info"] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      style={{
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "600",
                        border: "1px solid",
                        cursor: "pointer",
                        background: issueSeverityFilter === sev ? "#1e293b" : "#ffffff",
                        color: issueSeverityFilter === sev ? "#ffffff" : "#64748b",
                        borderColor: issueSeverityFilter === sev ? "#1e293b" : "#cbd5e1",
                      }}
                      onClick={() => setIssueSeverityFilter(sev)}
                    >
                      {sev === "all" ? "Tất cả" : sev === "critical" ? "🔴 Nghiêm trọng" : sev === "warning" ? "🟡 Cảnh báo" : "🔵 Gợi ý"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tab 1: Issues List */}
            {activeAuditTab === "issues" && (
              <div>
                {auditReport.issues.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 16px", color: "#16a34a" }}>
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>🎉</div>
                    <strong style={{ fontSize: "15px" }}>Không phát hiện bất kỳ lỗi hay sai lệch nào!</strong>
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>Toàn bộ 11 khối, 5 hằng số pháp lý và địa chỉ Hưng Yên đều hoàn hảo.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {auditReport.issues
                      .filter((iss) => (issueSeverityFilter === "all" ? true : iss.severity === issueSeverityFilter))
                      .map((iss) => (
                        <div
                          key={iss.id}
                          style={{
                            padding: "12px 16px",
                            borderRadius: "10px",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderLeft: `4px solid ${iss.severity === "critical" ? "#dc2626" : iss.severity === "warning" ? "#d97706" : "#2563eb"}`,
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "12px",
                          }}
                        >
                          <div style={{ flex: "1 1 300px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                              <span
                                style={{
                                  fontSize: "10.5px",
                                  fontWeight: "700",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  background: iss.severity === "critical" ? "#fee2e2" : iss.severity === "warning" ? "#fef3c7" : "#dbeafe",
                                  color: iss.severity === "critical" ? "#b91c1c" : iss.severity === "warning" ? "#b45309" : "#1d4ed8",
                                }}
                              >
                                {iss.severity === "critical" ? "NGHIÊM TRỌNG" : iss.severity === "warning" ? "CẢNH BÁO" : "GỢI Ý"}
                              </span>
                              <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b" }}>{iss.categoryTitle}</span>
                              {iss.sectionTitle && (
                                <span style={{ fontSize: "10.5px", padding: "1px 6px", borderRadius: "4px", background: "#ede9fe", color: "#6d28d9" }}>
                                  Khối: {iss.sectionTitle}
                                </span>
                              )}
                            </div>
                            <strong style={{ fontSize: "13.5px", color: "#1e293b", display: "block" }}>{iss.title}</strong>
                            <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#475569" }}>{iss.description}</p>
                            {(iss.currentValue || iss.recommendedValue) && (
                              <div style={{ display: "flex", gap: "16px", marginTop: "6px", fontSize: "11.5px", flexWrap: "wrap" }}>
                                {iss.currentValue && (
                                  <span style={{ color: "#dc2626" }}>
                                    <strong>Hiện tại:</strong> {iss.currentValue}
                                  </span>
                                )}
                                {iss.recommendedValue && (
                                  <span style={{ color: "#16a34a" }}>
                                    <strong>Đề xuất:</strong> {iss.recommendedValue}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div>
                            {iss.canAutoFix ? (
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  background: "#dcfce7",
                                  color: "#166534",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                ⚡ Hỗ trợ Auto-Fix
                              </span>
                            ) : (
                              <span style={{ fontSize: "11px", color: "#64748b" }}>Cần biên tập viên sửa</span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Multi-Agent Debate Room */}
            {activeAuditTab === "debate" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
                {auditReport.agentDebateLog.map((ag) => (
                  <div
                    key={ag.id}
                    style={{
                      padding: "16px",
                      borderRadius: "12px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderTop: `4px solid ${ag.badgeColor}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                      <span style={{ fontSize: "22px" }}>{ag.senderIcon}</span>
                      <div>
                        <strong style={{ fontSize: "13.5px", color: "#1e293b", display: "block" }}>{ag.senderName}</strong>
                        <span style={{ fontSize: "11px", color: ag.badgeColor, fontWeight: "600" }}>{ag.senderTitle}</span>
                      </div>
                    </div>
                    <blockquote
                      style={{
                        margin: "0 0 10px",
                        padding: "8px 12px",
                        background: "#ffffff",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontStyle: "italic",
                        color: "#334155",
                        borderLeft: `3px solid ${ag.badgeColor}`,
                        lineHeight: 1.5,
                      }}
                    >
                      "{ag.speechContent}"
                    </blockquote>
                    <div style={{ fontSize: "11.5px", color: "#475569" }}>
                      <strong style={{ display: "block", marginBottom: "3px", color: "#1e293b" }}>Kết luận chính:</strong>
                      <ul style={{ margin: 0, paddingLeft: "16px", lineHeight: 1.4 }}>
                        {ag.keyFindings.slice(0, 2).map((kf, i) => (
                          <li key={i}>{kf}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* METRIC CARDS */}
      <div className="accounts-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon metric-icon--purple">
            <Icon name="sparkle" size={22} />
          </div>
          <div>
            <strong>{activeKeysCount} / {multiAiKeys.length}</strong>
            <span>Key AI đang kích hoạt</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon metric-icon--admin">
            <Icon name="shield" size={22} />
          </div>
          <div>
            <strong>Google AI Studio</strong>
            <span>Mô hình Gemini 2.5 sẵn sàng</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon metric-icon--staff">
            <Icon name="users" size={22} />
          </div>
          <div>
            <strong>{agentLogs.length > 0 ? "3 / 3 Agent" : "Chưa họp"}</strong>
            <span>{agentLogs.length > 0 ? "Đã đồng thuận vận hành" : "Hội đồng sẵn sàng"}</span>
          </div>
        </div>

        <div className="metric-card metric-card--active">
          <div className="metric-icon metric-icon--current">
            <Icon name="check" size={22} />
          </div>
          <div>
            <strong style={{ fontSize: "16px", color: "#176b35" }}>100% Bao phủ</strong>
            <span style={{ color: "#176b35", fontWeight: "600" }}>6/6 Phân hệ Kênh Quản trị</span>
          </div>
        </div>
      </div>

      {/* SYNC PROGRESS OVERLAY */}
      {isSyncRunning && (
        <div className="analysis-progress-overlay">
          <div className="progress-status-row">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="spinner-inline" />
              <strong>{syncStatusText}</strong>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#6d28d9" }}>{syncProgress}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${syncProgress}%` }} />
          </div>
          <div className="progress-agents-row">
            <span className={`agent-badge-pill ${syncProgress >= 30 ? "agent-badge-pill--active" : ""}`}>
              👨‍💻 Nhân viên chức năng (Audit nội dung & 5 hằng số)
            </span>
            <span className={`agent-badge-pill ${syncProgress >= 60 ? "agent-badge-pill--active" : ""}`}>
              👩‍💼 Quản lý kiểm soát (Thẩm định Live Chat & Zalo Campaign)
            </span>
            <span className={`agent-badge-pill ${syncProgress >= 90 ? "agent-badge-pill--active" : ""}`}>
              👑 Giám đốc điều hành (Phê duyệt tối cao & Kế hoạch KPI)
            </span>
          </div>
        </div>
      )}

      {/* BẢO TỒN 5 HẰNG SỐ CỐ ĐỊNH BANNER */}
      <div
        style={{
          padding: "16px 20px",
          borderRadius: 12,
          background: "#fffbeb",
          border: "1.5px solid #fde68a",
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "#fef3c7",
            color: "#d97706",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: 18,
          }}
        >
          <Icon name="shield" size={20} />
        </div>
        <div style={{ flex: 1, fontSize: 13, color: "#92400e", lineHeight: 1.6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <strong style={{ color: "#78350f", fontSize: 13.5 }}>
              NGUYÊN TẮC BẢO VỆ 5 HẰNG SỐ HỆ THỐNG (AI TUYỆT ĐỐI KHÔNG SỬA / KHÔNG BỊA ĐẶT):
            </strong>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 999,
                background: "#fef3c7",
                color: "#b45309",
                border: "1px solid #fde68a",
              }}
            >
              Bất biến định danh
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "8px 16px",
              fontSize: 12.5,
              color: "#78350f",
            }}
          >
            <div>📧 Email: <strong style={{ fontFamily: "monospace", color: "#451a03" }}>{IMMUTABLE_SYSTEM_INFO.email}</strong></div>
            <div>📍 Địa chỉ: <strong style={{ color: "#451a03" }}>{IMMUTABLE_SYSTEM_INFO.address}</strong></div>
            <div>📞 Hotline: <strong style={{ fontFamily: "monospace", color: "#451a03" }}>{IMMUTABLE_SYSTEM_INFO.phone}</strong></div>
            <div>
              🌐 Fanpage:{" "}
              <a href={IMMUTABLE_SYSTEM_INFO.facebook} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", textDecoration: "underline" }}>
                {IMMUTABLE_SYSTEM_INFO.facebook}
              </a>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>🏷️ Tên đơn vị: <strong style={{ color: "#451a03" }}>{IMMUTABLE_SYSTEM_INFO.title}</strong></div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KHỐI 1: DANH MỤC QUẢN LÝ CÁC KEY AI & PHÂN QUYỀN AGENT */}
      {/* ========================================================================= */}
      <div className="accounts-table-card" style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, paddingBottom: 16, borderBottom: "1px solid #e2e8f0" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: "#ede9fe", color: "#6d28d9", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>MỤC 1</span>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Danh mục Quản lý Key AI & Phân quyền Agent</h3>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: 12.5, color: "#64748b" }}>
              Cấu hình các Key Google Gemini API độc lập, kiểm tra trạng thái hoạt động và gán phạm vi quyền hạn chuyên trách
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              className="secondary-button"
              style={{ height: 36, minHeight: 36, fontSize: 13 }}
              onClick={handlePingAllKeys}
              disabled={isPingAllRunning}
              title="Kiểm tra trạng thái kết nối và độ trễ của tất cả API Key"
            >
              <Icon name="sparkle" size={14} />
              <span>Kiểm tra toàn bộ AI (Ping All)</span>
            </button>

            <button
              type="button"
              className="primary-button"
              style={{ height: 36, minHeight: 36, fontSize: 13 }}
              onClick={handleOpenAddModal}
              title="Thêm Key AI mới kèm phân quyền chức năng riêng"
            >
              <Icon name="plus" size={14} />
              <span>Thêm Key AI</span>
            </button>
          </div>
        </div>

        {/* Grid cards */}
        <div className="multi-ai-cards-grid" style={{ marginTop: 18 }}>
          {multiAiKeys.map((item, idx) => {
            const isSecretVisible = !!visibleKeySecrets[item.id];
            const isTestingThis = testingKeyId === item.id;

            return (
              <div
                key={item.id}
                className={`multi-ai-card ${!item.isActive ? "multi-ai-card--disabled" : ""}`}
                style={{ borderLeftColor: item.badgeColor }}
              >
                {/* Card Top: Icon, Role Badge, Status */}
                <div className="multi-ai-card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="multi-ai-card-icon">{item.icon}</span>
                    <div>
                      <h4 className="multi-ai-card-name">{item.name}</h4>
                      <span
                        className="multi-ai-role-tag"
                        style={{
                          background: `${item.badgeColor}15`,
                          color: item.badgeColor,
                          border: `1px solid ${item.badgeColor}40`,
                        }}
                      >
                        {item.roleTitle}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    {item.status === "active" && (
                      <span className="multi-ai-status-pill multi-ai-status-pill--active">
                        🟢 Hoạt động {item.latencyMs ? `(${item.latencyMs}ms)` : ""}
                      </span>
                    )}
                    {item.status === "error" && (
                      <span className="multi-ai-status-pill multi-ai-status-pill--error" title={item.statusMessage}>
                        🔴 Lỗi kết nối
                      </span>
                    )}
                    {item.status === "untested" && (
                      <span className="multi-ai-status-pill multi-ai-status-pill--untested">
                        🟡 Chưa kiểm tra
                      </span>
                    )}
                    {item.testedAt && <small style={{ fontSize: 10, color: "#94a3b8" }}>Lúc {item.testedAt}</small>}
                  </div>
                </div>

                {/* API Key Input & Model */}
                <div className="multi-ai-key-input-row" style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <small style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Mô hình:</small>
                    <code style={{ fontSize: 11, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>
                      {item.model}
                    </code>
                  </div>

                  <div className="multi-ai-key-field-wrap" style={{ marginTop: 6 }}>
                    <input
                      type={isSecretVisible ? "text" : "password"}
                      placeholder="Chưa nhập API Key riêng..."
                      value={item.apiKey}
                      readOnly
                      style={{
                        width: "100%",
                        height: 32,
                        padding: "0 34px 0 10px",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        fontSize: 12,
                        fontFamily: "monospace",
                        background: "#f8fafc",
                        color: "#334155",
                      }}
                    />
                    <button
                      type="button"
                      className="key-eye-btn"
                      onClick={() =>
                        setVisibleKeySecrets((prev) => ({
                          ...prev,
                          [item.id]: !prev[item.id],
                        }))
                      }
                      title={isSecretVisible ? "Ẩn khóa" : "Hiện khóa"}
                    >
                      <Icon name={isSecretVisible ? "eyeOff" : "eye"} size={13} />
                    </button>
                  </div>
                </div>

                {/* Scope Description Box */}
                <div className="multi-ai-scope-box" style={{ marginTop: 12 }}>
                  <div className="scope-header">
                    <Icon name="article" size={13} />
                    <span>Phạm vi quyền hạn & Nhiệm vụ chuyên biệt:</span>
                  </div>
                  <p className="scope-text">{item.scopeDescription}</p>
                </div>

                {/* Assigned CMS Modules Badges */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>
                    Phân hệ phụ trách trong CMS ({item.assignedModules?.length || 0}):
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {CMS_MODULES.map((mod) => {
                      const isAssigned = item.assignedModules?.includes(mod.id);
                      if (!isAssigned) return null;
                      return (
                        <span
                          key={mod.id}
                          style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: "#ede9fe",
                            color: "#5b21b6",
                            border: "1px solid #ddd6fe",
                          }}
                        >
                          {mod.name}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Actions Footer */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexWrap: "wrap",
                    marginTop: 14,
                    paddingTop: 10,
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <button
                    type="button"
                    className="card-action-btn card-action-btn--test"
                    onClick={() => handleTestSingleKey(item)}
                    disabled={isTestingThis}
                    title="Gửi tín hiệu kiểm tra Key này tới Google AI Studio"
                  >
                    {isTestingThis ? (
                      <>
                        <span className="spinner-inline" /> Đang ping...
                      </>
                    ) : (
                      <>
                        <Icon name="sparkle" size={12} />
                        <span>Kiểm tra</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="card-action-btn"
                    onClick={() => handleOpenEditModal(item)}
                    title="Chỉnh sửa thông tin, phân quyền hoặc khóa API"
                  >
                    <Icon name="settings" size={12} />
                    <span>Sửa</span>
                  </button>

                  <button
                    type="button"
                    className="card-action-btn"
                    onClick={() => handleToggleKeyActive(item.id)}
                    title={item.isActive ? "Tạm dừng Agent này" : "Bật Agent này"}
                  >
                    <span>{item.isActive ? "Tạm dừng" : "Kích hoạt"}</span>
                  </button>

                  <button
                    type="button"
                    className="card-action-btn card-action-btn--delete"
                    onClick={() => handleDeleteKey(item.id)}
                    title="Xóa Key này khỏi hệ thống"
                  >
                    <Icon name="trash" size={12} />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KHỐI 2: MA TRẬN PHÂN CÔNG NHIỆM VỤ & BAO PHỦ TOÀN HỆ THỐNG */}
      {/* ========================================================================= */}
      <div className="accounts-table-card" style={{ padding: 24, marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, paddingBottom: 16, borderBottom: "1px solid #e2e8f0" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: "#ecfdf5", color: "#065f46", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>MỤC 2</span>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Ma trận Phân công Nhiệm vụ & Vận hành Toàn Hệ thống</h3>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: 12.5, color: "#64748b" }}>
              Phân việc chi tiết cho các Agent AI bao phủ 6 phân hệ của Kênh Quản trị ("https://ananasux.github.io/xay-kenh-quan-tri/")
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#059669", background: "#ecfdf5", padding: "6px 14px", borderRadius: 999, border: "1px solid #a7f3d0" }}>
            <span>🟢</span>
            <span>100% Bao phủ hệ thống</span>
          </div>
        </div>

        <div style={{ marginTop: 18, overflowX: "auto" }}>
          <table className="accounts-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 12.5, fontWeight: 700, color: "#334155", width: "20%" }}>
                  Phân hệ Kênh Quản trị
                </th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 12.5, fontWeight: 700, color: "#2563eb", width: "26%" }}>
                  👨‍💻 Agent Nhân viên (Key 1)
                </th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 12.5, fontWeight: 700, color: "#7c3aed", width: "26%" }}>
                  👩‍💼 Agent Quản lý (Key 2)
                </th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 12.5, fontWeight: 700, color: "#d97706", width: "20%" }}>
                  👑 Agent Giám đốc (Key 3)
                </th>
                <th style={{ padding: "12px 14px", textAlign: "center", fontSize: 12.5, fontWeight: 700, color: "#059669", width: "8%" }}>
                  Liên kết
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1 */}
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "14px", verticalAlign: "top" }}>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13.5 }}>1. Cấu hình trang</div>
                  <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>11 khối nội dung & Floating Dock</div>
                </td>
                <td style={{ padding: "14px", verticalAlign: "top", fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
                  Rà soát văn bản 11 khối; <strong>bảo vệ nghiêm ngặt 5 hằng số</strong>; kiểm tra icon 24x24px Floating Dock.
                </td>
                <td style={{ padding: "14px", verticalAlign: "top", fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
                  Thẩm định tính thẩm mỹ, độ mạch lạc và an toàn của các điểm sao lưu dự phòng (Safe Backup Snapshot).
                </td>
                <td style={{ padding: "14px", verticalAlign: "top", fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
                  Phê chuẩn xuất bản nội dung chính thức lên Landing Page.
                </td>
                <td style={{ padding: "14px", textAlign: "center", verticalAlign: "middle" }}>
                  <Link to="/cau-hinh-trang" className="secondary-button" style={{ height: 28, minHeight: 28, padding: "0 10px", fontSize: 11.5, display: "inline-flex" }}>
                    Mở ↗
                  </Link>
                </td>
              </tr>

              {/* Row 2 */}
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "14px", verticalAlign: "top" }}>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13.5 }}>2. Live Chat CRM</div>
                  <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>Autism Q&A Matrix & Khách hàng</div>
                </td>
                <td style={{ padding: "14px", verticalAlign: "top", fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
                  Kiểm tra tin nhắn chờ; nạp JSON kịch bản mới (Smart Append); cập nhật từ vựng can thiệp tự kỷ.
                </td>
                <td style={{ padding: "14px", verticalAlign: "top", fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
                  Giám sát tốc độ phản hồi phụ huynh; rà soát tự động hóa trạng thái Chat ("Đã phản hồi" khi gửi tin).
                </td>
                <td style={{ padding: "14px", verticalAlign: "top", fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
                  Đánh giá chỉ số hài lòng của phụ huynh và chất lượng tư vấn chuyên môn.
                </td>
                <td style={{ padding: "14px", textAlign: "center", verticalAlign: "middle" }}>
                  <Link to="/chat-khach-hang" className="secondary-button" style={{ height: 28, minHeight: 28, padding: "0 10px", fontSize: 11.5, display: "inline-flex" }}>
                    Mở ↗
                  </Link>
                </td>
              </tr>

              {/* Row 3 */}
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "14px", verticalAlign: "top" }}>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13.5 }}>3. Đăng ký tư vấn</div>
                  <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>Quản lý Lead phụ huynh & Lịch hẹn</div>
                </td>
                <td style={{ padding: "14px", verticalAlign: "top", fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
                  Lọc danh sách phụ huynh đăng ký mới; xác thực định dạng số điện thoại; bảo vệ thông tin gia đình trẻ.
                </td>
                <td style={{ padding: "14px", verticalAlign: "top", fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
                  Điều phối lịch đánh giá phát triển 1:1 cho trẻ; quản lý tiến độ chuyển đổi hồ sơ ("Đã hẹn", "Hoàn thành").
                </td>
                <td style={{ padding: "14px", verticalAlign: "top", fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
                  Theo dõi tỷ lệ chuyển đổi phụ huynh đăng ký và phê duyệt kế hoạch tiếp nhận trẻ can thiệp.
                </td>
                <td style={{ padding: "14px", textAlign: "center", verticalAlign: "middle" }}>
                  <Link to="/dang-ky-tu-van" className="secondary-button" style={{ height: 28, minHeight: 28, padding: "0 10px", fontSize: 11.5, display: "inline-flex" }}>
                    Mở ↗
                  </Link>
                </td>
              </tr>

              {/* Row 4 */}
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "14px", verticalAlign: "top" }}>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13.5 }}>4. Bản đồ nhiệt UX</div>
                  <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>Dead clicks, Rage clicks & Zalo</div>
                </td>
                <td style={{ padding: "14px", verticalAlign: "top", fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
                  Trích xuất tọa độ điểm nóng, phát hiện 18 Dead clicks cơ sở vật chất và 4 Rage clicks nút tư vấn.
                </td>
                <td style={{ padding: "14px", verticalAlign: "top", fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
                  Đo lường hành vi phụ huynh từ chiến dịch Zalo Campaign (83% traffic); thẩm định cơ chế ẩn khối Đội ngũ.
                </td>
                <td style={{ padding: "14px", verticalAlign: "top", fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
                  Phê chuẩn kế hoạch tối ưu hóa giao diện dựa trên dữ liệu tương tác thực tế của phụ huynh.
                </td>
                <td style={{ padding: "14px", textAlign: "center", verticalAlign: "middle" }}>
                  <Link to="/heatmap" className="secondary-button" style={{ height: 28, minHeight: 28, padding: "0 10px", fontSize: 11.5, display: "inline-flex" }}>
                    Mở ↗
                  </Link>
                </td>
              </tr>

              {/* Row 5 */}
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "14px", verticalAlign: "top" }}>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13.5 }}>5. Phân tích hệ thống</div>
                  <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>Chẩn đoán điểm nghẽn & Lộ trình</div>
                </td>
                <td style={{ padding: "14px", verticalAlign: "top", fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
                  Nạp báo cáo điểm nghẽn; đối chiếu dữ liệu tương tác thực tế; kiểm tra an toàn hằng số nhận diện.
                </td>
                <td style={{ padding: "14px", verticalAlign: "top", fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
                  Phản biện và kiểm duyệt danh mục 6 giải pháp nâng cấp frontend; xếp thứ tự ưu tiên khẩn cấp.
                </td>
                <td style={{ padding: "14px", verticalAlign: "top", fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
                  Phê chuẩn tối cao lộ trình 3 giai đoạn và ký duyệt mục tiêu nâng điểm UX từ 88 lên 96/100.
                </td>
                <td style={{ padding: "14px", textAlign: "center", verticalAlign: "middle" }}>
                  <Link to="/phan-tich-he-thong" className="secondary-button" style={{ height: 28, minHeight: 28, padding: "0 10px", fontSize: 11.5, display: "inline-flex" }}>
                    Mở ↗
                  </Link>
                </td>
              </tr>

              {/* Row 6 */}
              <tr>
                <td style={{ padding: "14px", verticalAlign: "top" }}>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13.5 }}>6. Bảo mật & Kiểm toán</div>
                  <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>Tài khoản, Audit Logs & Quyền hạn</div>
                </td>
                <td style={{ padding: "14px", verticalAlign: "top", fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
                  Báo cáo đăng nhập, ghi nhận nhật ký thao tác cá nhân trong phiên làm việc.
                </td>
                <td style={{ padding: "14px", verticalAlign: "top", fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
                  Rà soát bảng Nhật ký hoạt động (Audit Logs); giám sát các thao tác chỉnh sửa nội dung và tài khoản.
                </td>
                <td style={{ padding: "14px", verticalAlign: "top", fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
                  Giám sát toàn diện an toàn thông tin và cấp quyền quản trị cho nhân sự trung tâm.
                </td>
                <td style={{ padding: "14px", textAlign: "center", verticalAlign: "middle" }}>
                  <Link to="/nhat-ky-hoat-dong" className="secondary-button" style={{ height: 28, minHeight: 28, padding: "0 10px", fontSize: 11.5, display: "inline-flex" }}>
                    Mở ↗
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KHỐI 3: NHẬT KÝ ĐỐI THOẠI & BÁO CÁO GIAO BAN MULTI-AGENT */}
      {/* ========================================================================= */}
      <div className="accounts-table-card" style={{ padding: 24, marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, paddingBottom: 16, borderBottom: "1px solid #e2e8f0" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>MỤC 3</span>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Nhật ký Đối thoại & Báo cáo Giao ban Multi-Agent (Multi-Agent Dialogue Log)</h3>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: 12.5, color: "#64748b" }}>
              Lưu vết toàn bộ quá trình trao đổi, phản biện và phán quyết điều hành Kênh Quản trị giữa các cấp AI
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              className="secondary-button"
              style={{ height: 36, minHeight: 36, fontSize: 13 }}
              onClick={handleCopyLogs}
              title="Sao chép toàn bộ nhật ký trao đổi giữa các AI"
            >
              <Icon name="copy" size={14} />
              <span>Sao chép Log</span>
            </button>

            <button
              type="button"
              className="secondary-button"
              style={{ height: 36, minHeight: 36, fontSize: 13 }}
              onClick={handleDownloadLogsTxt}
              title="Tải file text nhật ký đối thoại"
            >
              <Icon name="download" size={14} />
              <span>Tải file .txt</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="agent-dialogue-filter-bar" style={{ marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginRight: 4 }}>Lọc Agent:</span>
            <button
              type="button"
              className={`agent-filter-pill ${logFilterRole === "all" ? "agent-filter-pill--active" : ""}`}
              onClick={() => setLogFilterRole("all")}
            >
              Tất cả ({agentLogs.length})
            </button>
            <button
              type="button"
              className={`agent-filter-pill ${logFilterRole === "functional_staff" ? "agent-filter-pill--active" : ""}`}
              onClick={() => setLogFilterRole("functional_staff")}
            >
              👨‍💻 Nhân viên (Key 1)
            </button>
            <button
              type="button"
              className={`agent-filter-pill ${logFilterRole === "qa_manager" ? "agent-filter-pill--active" : ""}`}
              onClick={() => setLogFilterRole("qa_manager")}
            >
              👩‍💼 Quản lý (Key 2)
            </button>
            <button
              type="button"
              className={`agent-filter-pill ${logFilterRole === "director" ? "agent-filter-pill--active" : ""}`}
              onClick={() => setLogFilterRole("director")}
            >
              👑 Giám đốc (Key 3)
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="text"
              placeholder="🔍 Tìm trong nội dung trao đổi..."
              value={logSearchQuery}
              onChange={(e) => setLogSearchQuery(e.target.value)}
              style={{
                height: 32,
                padding: "0 10px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 12,
                outline: "none",
                width: 220,
              }}
            />
          </div>
        </div>

        {/* Timeline of Messages */}
        {filteredLogs.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
            <span style={{ fontSize: 32 }}>💬</span>
            <p style={{ marginTop: 8, fontSize: 14 }}>
              Chưa có phiên giao ban nào. Hãy bấm <strong>"Khởi động Giao ban Multi-Agent"</strong> ở đầu trang để các AI tự động trao đổi và báo cáo.
            </p>
          </div>
        ) : (
          <div className="agent-dialogue-timeline" style={{ marginTop: 18 }}>
            {filteredLogs.map((msg) => (
              <div key={msg.id} className="agent-timeline-entry">
                <div className="agent-timeline-node-icon" style={{ borderColor: msg.badgeColor }}>
                  {msg.senderIcon}
                </div>

                <div className="agent-timeline-bubble">
                  {/* Bubble Header */}
                  <div className="agent-bubble-header">
                    <div className="agent-bubble-identity">
                      <span className="agent-bubble-name">{msg.senderName}</span>
                      <span
                        className="multi-ai-role-tag"
                        style={{
                          background: `${msg.badgeColor}15`,
                          color: msg.badgeColor,
                          border: `1px solid ${msg.badgeColor}40`,
                        }}
                      >
                        {msg.senderTitle}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: msg.badgeColor,
                          background: `${msg.badgeColor}10`,
                          padding: "2px 8px",
                          borderRadius: 6,
                        }}
                      >
                        {msg.decisionStatus === "approved"
                          ? "👑 ĐÃ PHÊ DUYỆT TỐI CAO"
                          : msg.decisionStatus === "critiqued"
                          ? "⚖️ ĐÃ THẨM ĐỊNH & PHẢN BIỆN"
                          : "✅ ĐÃ RÀ SOÁT DỮ LIỆU & NỘI DUNG"}
                      </span>
                      <span className="agent-bubble-time">{msg.timestamp}</span>
                    </div>
                  </div>

                  {/* Speech / Dialogue Text */}
                  <div className="agent-speech-box">
                    <p>{msg.speechContent}</p>
                  </div>

                  {/* Findings Box */}
                  {msg.keyFindings && msg.keyFindings.length > 0 && (
                    <div className="agent-findings-box">
                      <div className="findings-title">
                        <span>🔍 Phát hiện chính & Điểm rà soát:</span>
                      </div>
                      <ul className="findings-list">
                        {msg.keyFindings.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations Row */}
                  {msg.actionRecommendations && msg.actionRecommendations.length > 0 && (
                    <div className="agent-recommendations-row">
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: "#475569" }}>
                        Khuyến nghị & Phán quyết:
                      </span>
                      {msg.actionRecommendations.map((r, i) => (
                        <span key={i} className="agent-recommendation-pill">
                          👉 {r}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: 8, fontSize: 11, color: "#94a3b8", textAlign: "right" }}>
                    Mô hình thực thi: <code>{msg.rawModelUsed}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: THÊM / CHỈNH SỬA KEY AI & PHÂN QUYỀN AGENT */}
      {/* ========================================================================= */}
      {showKeyModal && editingKeyItem && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setShowKeyModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 20,
              width: "100%",
              maxWidth: 620,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>{editingKeyItem.icon}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>
                    Cấu hình Key AI & Phân quyền Agent
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                    Chỉ định phạm vi quyền hạn và API Key cho Agent trong hệ thống
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  color: "#64748b",
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Tên gợi nhớ Key AI:
                </label>
                <input
                  type="text"
                  value={editingKeyItem.name}
                  onChange={(e) => setEditingKeyItem({ ...editingKeyItem, name: e.target.value })}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Vai trò cấp bậc:
                  </label>
                  <select
                    value={editingKeyItem.role}
                    onChange={(e) => {
                      const role = e.target.value as MultiAiAgentRole;
                      let roleTitle = "Chuyên gia Tùy biến";
                      let icon = "🤖";
                      let badgeColor = "#059669";
                      if (role === "functional_staff") {
                        roleTitle = "Nhân viên Rà soát Chức năng & Dữ liệu";
                        icon = "👨‍💻";
                        badgeColor = "#2563eb";
                      } else if (role === "qa_manager") {
                        roleTitle = "Quản lý Giám sát & Đảm bảo Chất lượng";
                        icon = "👩‍💼";
                        badgeColor = "#7c3aed";
                      } else if (role === "director") {
                        roleTitle = "Giám đốc Quản lý Toàn hệ thống";
                        icon = "👑";
                        badgeColor = "#d97706";
                      }
                      setEditingKeyItem({
                        ...editingKeyItem,
                        role,
                        roleTitle,
                        icon,
                        badgeColor,
                      });
                    }}
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 10px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      boxSizing: "border-box",
                      background: "#ffffff",
                    }}
                  >
                    <option value="functional_staff">👨‍💻 Cấp 1: Nhân viên chức năng (Kiểm tra nội dung & 5 hằng số)</option>
                    <option value="qa_manager">👩‍💼 Cấp 2: Quản lý kiểm soát (Thẩm định báo cáo & quy trình)</option>
                    <option value="director">👑 Cấp 3: Giám đốc điều hành (Phê chuẩn lộ trình & KPI)</option>
                    <option value="custom">🤖 Tùy biến: Chuyên gia phân tích riêng</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Mô hình Google Gemini:
                  </label>
                  <select
                    value={editingKeyItem.model}
                    onChange={(e) => setEditingKeyItem({ ...editingKeyItem, model: e.target.value })}
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 10px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      boxSizing: "border-box",
                      background: "#ffffff",
                    }}
                  >
                    <option value="gemini-2.5-flash">gemini-2.5-flash (Khuyên dùng - Nhanh & Chuẩn)</option>
                    <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite (Siêu nhẹ)</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash (Ổn định)</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro (Tư duy sâu)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Google AI Studio API Key:
                </label>
                <input
                  type="text"
                  placeholder="Dán khóa API AIzaSy..."
                  value={editingKeyItem.apiKey}
                  onChange={(e) => setEditingKeyItem({ ...editingKeyItem, apiKey: e.target.value, status: "untested" })}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    fontFamily: "monospace",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Phạm vi nhiệm vụ & thẩm quyền của Key (Mô tả chi tiết):
                </label>
                <textarea
                  rows={3}
                  value={editingKeyItem.scopeDescription}
                  onChange={(e) => setEditingKeyItem({ ...editingKeyItem, scopeDescription: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* Phân hệ CMS phụ trách */}
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Phân công phụ trách các phân hệ CMS:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
                  {CMS_MODULES.map((mod) => {
                    const isChecked = editingKeyItem.assignedModules?.includes(mod.id);
                    return (
                      <label key={mod.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const cur = editingKeyItem.assignedModules || [];
                            const updated = e.target.checked
                              ? [...cur, mod.id]
                              : cur.filter((x) => x !== mod.id);
                            setEditingKeyItem({ ...editingKeyItem, assignedModules: updated });
                          }}
                        />
                        <span>{mod.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "14px 24px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 10,
                background: "#f8fafc",
              }}
            >
              <button
                type="button"
                className="secondary-button"
                style={{ height: 38, minHeight: 38 }}
                onClick={() => setShowKeyModal(false)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="primary-button"
                style={{ height: 38, minHeight: 38 }}
                onClick={() => handleSaveModal(editingKeyItem)}
              >
                <Icon name="check" size={14} />
                <span>Lưu cấu hình Key</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AiManagementPage;

import React, { useState, useEffect } from "react";
import { Icon } from "./ui";
import {
  getGoogleSheetsUrl,
  setGoogleSheetsUrl,
  pingGoogleSheets,
  backupConfigToGoogleSheets,
} from "./googleSheetsService";

interface GoogleSheetsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentConfig?: any;
}

const APPS_SCRIPT_SOURCE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - CƠ SỞ DỮ LIỆU GOOGLE SHEETS MIỄN PHÍ TRỌN ĐỜI
 * Dành riêng cho: Trung tâm Hỗ trợ Trẻ tự kỷ Cô Hương
 * Kết nối: Landing Page (tre-tu-ky-responsive) & Quản trị CMS (xay-kenh-quan-tri)
 * =========================================================================
 */

function testRun() {
  setupSheetTabs();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Don_Tu_Van");
  const timeStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
  sheet.appendRow([
    "TEST_" + Date.now(),
    timeStr,
    "Phụ huynh mẫu (Kiểm tra)",
    "096 290 3942",
    "Tư vấn can thiệp trẻ chậm nói",
    "Bé 2.5 tuổi cần kiểm tra đánh giá phát triển",
    "Chạy thử trực tiếp từ Apps Script",
    "Mới nhận (Chưa liên hệ)",
    "Dữ liệu mẫu đã vào bảng tính thành công!"
  ]);
  Logger.log("✅ CHÚC MỪNG: Đã thêm dữ liệu mẫu vào tab Don_Tu_Van thành công!");
}

function chayThuNghiem() {
  testRun();
}

function setupSheetTabs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Tab Đơn Tư Vấn
  let leadSheet = ss.getSheetByName("Don_Tu_Van");
  if (!leadSheet) {
    leadSheet = ss.insertSheet("Don_Tu_Van");
    leadSheet.appendRow([
      "Mã đơn", "Thời gian tạo", "Họ tên phụ huynh", "Số Zalo / Hotline",
      "Nhu cầu can thiệp", "Ghi chú / Biểu hiện bé", "Chiến dịch", "Trạng thái", "Ghi chú xử lý"
    ]);
    leadSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#50008b").setFontColor("#ffffff");
    leadSheet.setFrozenRows(1);
    leadSheet.setColumnWidth(1, 130);
    leadSheet.setColumnWidth(2, 160);
    leadSheet.setColumnWidth(3, 180);
    leadSheet.setColumnWidth(4, 150);
    leadSheet.setColumnWidth(5, 180);
    leadSheet.setColumnWidth(6, 260);
    leadSheet.setColumnWidth(7, 180);
    leadSheet.setColumnWidth(8, 140);
    leadSheet.setColumnWidth(9, 200);
  }

  // 2. Tab Lịch Sử Chat Phụ Huynh
  let chatSheet = ss.getSheetByName("Lich_Su_Chat");
  if (!chatSheet) {
    chatSheet = ss.insertSheet("Lich_Su_Chat");
    chatSheet.appendRow(["Mã hội thoại", "Thời gian", "Tên phụ huynh", "Tin nhắn phụ huynh", "Trợ lý AI phản hồi", "Chủ đề tư vấn"]);
    chatSheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#059669").setFontColor("#ffffff");
    chatSheet.setFrozenRows(1);
    chatSheet.setColumnWidth(1, 140);
    chatSheet.setColumnWidth(2, 160);
    chatSheet.setColumnWidth(3, 160);
    chatSheet.setColumnWidth(4, 300);
    chatSheet.setColumnWidth(5, 300);
    chatSheet.setColumnWidth(6, 200);
  }

  // 3. Tab Nhật Ký Truy Cập
  let logSheet = ss.getSheetByName("Nhat_Ky_Truy_Cap");
  if (!logSheet) {
    logSheet = ss.insertSheet("Nhat_Ky_Truy_Cap");
    logSheet.appendRow(["Mã log", "Thời gian", "Người dùng / Nguồn", "IP", "Vị trí", "Thiết bị", "Chiến dịch Zalo", "Trang truy cập"]);
    logSheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#2563eb").setFontColor("#ffffff");
    logSheet.setFrozenRows(1);
    logSheet.setColumnWidth(1, 140);
    logSheet.setColumnWidth(2, 160);
    logSheet.setColumnWidth(3, 180);
    logSheet.setColumnWidth(4, 130);
    logSheet.setColumnWidth(5, 160);
    logSheet.setColumnWidth(6, 180);
    logSheet.setColumnWidth(7, 220);
    logSheet.setColumnWidth(8, 250);
  }

  // 4. Tab Cấu Hình Trang
  let configSheet = ss.getSheetByName("Cau_Hinh_Trang");
  if (!configSheet) {
    configSheet = ss.insertSheet("Cau_Hinh_Trang");
    configSheet.appendRow(["Thời gian cập nhật", "Nội dung JSON cấu hình"]);
    configSheet.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#334155").setFontColor("#ffffff");
    configSheet.setFrozenRows(1);
    configSheet.setColumnWidth(1, 180);
    configSheet.setColumnWidth(2, 600);
  }

  const defaultSheet = ss.getSheetByName("Sheet1") || ss.getSheetByName("Trang tính1");
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch(e) {}
  }
}

function doPost(e) {
  try {
    setupSheetTabs();
    e = e || {};
    let data = {};
    if (e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch(err) { data = {}; }
    } else if (e.parameter && Object.keys(e.parameter).length > 0) {
      data = e.parameter;
    } else {
      // Khi bấm Chạy trực tiếp trong Apps Script
      testRun();
      return responseJson({ success: true, message: "Đã chạy thử nghiệm và thêm 1 dòng mẫu vào bảng tính!" });
    }

    const action = data.action || "create_lead";
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. TẠO ĐƠN TƯ VẤN MỚI
    if (action === "create_lead") {
      const lead = data.lead || data;
      const sheet = ss.getSheetByName("Don_Tu_Van");
      const timeStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
      const row = [
        lead.id || ("lead_" + Date.now()),
        timeStr,
        lead.name || "Phụ huynh",
        lead.phone || "",
        lead.need || "Tư vấn can thiệp",
        lead.message || "",
        lead.campaign || "Chiến dịch Zalo / Trang chủ",
        "Mới nhận (Chưa liên hệ)",
        ""
      ];
      sheet.appendRow(row);

      try {
        const emailTo = Session.getActiveUser().getEmail();
        if (emailTo) {
          MailApp.sendEmail(
            emailTo,
            "🔔 Có phụ huynh đăng ký tư vấn mới: " + (lead.name || "Phụ huynh") + " (" + (lead.phone || "") + ")",
            "Thông tin đăng ký mới từ website Cô Hương:\\n\\n" +
            "• Phụ huynh: " + (lead.name || "") + "\\n" +
            "• Số Zalo / Hotline: " + (lead.phone || "") + "\\n" +
            "• Nhu cầu: " + (lead.need || "") + "\\n" +
            "• Chia sẻ: " + (lead.message || "") + "\\n" +
            "• Thời gian: " + timeStr + "\\n\\n" +
            "👉 Mở Google Trang tính trên điện thoại để tư vấn ngay."
          );
        }
      } catch (mailErr) {}

      return responseJson({ success: true, message: "Đã lưu đơn tư vấn thành công!", leadId: lead.id });
    }

    // 2. CẬP NHẬT TRẠNG THÁI ĐƠN TƯ VẤN
    if (action === "update_lead_status") {
      const sheet = ss.getSheetByName("Don_Tu_Van");
      const rows = sheet.getDataRange().getValues();
      const leadId = data.leadId;
      const newStatus = data.status;
      const note = data.notes || "";

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(leadId)) {
          if (newStatus) sheet.getRange(i + 1, 8).setValue(newStatus);
          if (note) sheet.getRange(i + 1, 9).setValue(note);
          return responseJson({ success: true, message: "Đã cập nhật trạng thái đơn thành công!" });
        }
      }
      return responseJson({ success: false, message: "Không tìm thấy mã đơn: " + leadId });
    }

    // 3. GHI NHẬT KÝ LIVE CHAT
    if (action === "log_chat") {
      const chat = data.chat || data;
      const sheet = ss.getSheetByName("Lich_Su_Chat");
      const timeStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
      sheet.appendRow([
        chat.id || ("chat_" + Date.now()),
        timeStr,
        chat.parentName || "Phụ huynh",
        chat.parentMessage || "",
        chat.aiResponse || "",
        chat.topic || "Tư vấn can thiệp sớm"
      ]);
      return responseJson({ success: true, message: "Đã lưu nhật ký chat thành công!" });
    }

    // 4. GHI NHẬT KÝ TRUY CẬP (ACCESS LOG)
    if (action === "log_access") {
      const log = data.log || data;
      const sheet = ss.getSheetByName("Nhat_Ky_Truy_Cap");
      const timeStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
      sheet.appendRow([
        log.id || ("acc_" + Date.now()),
        timeStr,
        log.fullName || log.username || "Khách truy cập",
        log.ip || "",
        log.location || "",
        log.device || "",
        log.campaign || "",
        log.entryPath || log.accessUrl || ""
      ]);
      return responseJson({ success: true, message: "Đã lưu nhật ký truy cập thành công!" });
    }

    // 5. LƯU BẢN SAO LƯU CẤU HÌNH TRANG ĐÍCH
    if (action === "save_config") {
      const config = data.config;
      const sheet = ss.getSheetByName("Cau_Hinh_Trang");
      const timeStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
      sheet.getRange(2, 1).setValue(timeStr);
      sheet.getRange(2, 2).setValue(JSON.stringify(config));
      return responseJson({ success: true, message: "Đã lưu cấu hình trang thành công!" });
    }

    return responseJson({ success: false, message: "Hành động không hợp lệ: " + action });
  } catch (err) {
    return responseJson({ success: false, error: err.toString() });
  }
}

function doGet(e) {
  try {
    setupSheetTabs();
    e = e || {};
    const parameter = e.parameter || {};
    const action = parameter.action || "get_leads";
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Hỗ trợ tạo đơn bằng GET (dự phòng)
    if (action === "create_lead") {
      const sheet = ss.getSheetByName("Don_Tu_Van");
      const timeStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
      sheet.appendRow([
        parameter.id || ("lead_" + Date.now()),
        timeStr,
        parameter.name || "Phụ huynh",
        parameter.phone || "",
        parameter.need || "Tư vấn can thiệp",
        parameter.message || "",
        parameter.campaign || "Chiến dịch Zalo / Trang chủ",
        "Mới nhận (Chưa liên hệ)",
        ""
      ]);
      return responseJson({ success: true, message: "Đã lưu đơn tư vấn thành công vào Google Trang tính!" });
    }

    // 1. LẤY DANH SÁCH ĐƠN TƯ VẤN
    if (action === "get_leads") {
      const sheet = ss.getSheetByName("Don_Tu_Van");
      const rows = sheet.getDataRange().getValues();
      const leads = [];
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i][0]) continue;
        leads.push({
          id: String(rows[i][0]),
          createdAt: String(rows[i][1]),
          name: String(rows[i][2]),
          phone: String(rows[i][3]),
          need: String(rows[i][4]),
          message: String(rows[i][5]),
          campaign: String(rows[i][6]),
          status: mapStatusFromSheet(String(rows[i][7])),
          notes: String(rows[i][8] || "")
        });
      }
      return responseJson({ success: true, leads: leads.reverse() });
    }

    // 2. LẤY CẤU HÌNH TRANG ĐÍCH
    if (action === "get_config") {
      const sheet = ss.getSheetByName("Cau_Hinh_Trang");
      const jsonStr = sheet.getRange(2, 2).getValue();
      if (jsonStr) {
        return responseJson({ success: true, config: JSON.parse(jsonStr) });
      }
      return responseJson({ success: false, message: "Chưa có cấu hình được lưu." });
    }

    // 3. KIỂM TRA KẾT NỐI (PING)
    if (action === "ping") {
      return responseJson({
        success: true,
        message: "Kết nối Google Trang tính của Cô Hương thành công 100%!",
        timestamp: new Date().toISOString(),
        sheetName: ss.getName()
      });
    }

    return responseJson({ success: false, message: "Tham số không hợp lệ." });
  } catch (err) {
    return responseJson({ success: false, error: err.toString() });
  }
}

function mapStatusFromSheet(statusStr) {
  if (statusStr.includes("Mới")) return "new";
  if (statusStr.includes("Đã liên hệ")) return "contacted";
  if (statusStr.includes("Đã đặt lịch")) return "scheduled";
  if (statusStr.includes("Hoàn tất")) return "completed";
  return "new";
}

function responseJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;

export function GoogleSheetsConfigModal({
  isOpen,
  onClose,
  onSuccess,
  currentConfig,
}: GoogleSheetsConfigModalProps) {
  const [url, setUrl] = useState(getGoogleSheetsUrl());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    sheetName?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"settings" | "guide" | "code">("settings");
  const [backingUp, setBackingUp] = useState(false);
  const [backupMsg, setBackupMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      const current = getGoogleSheetsUrl();
      setUrl(current);
      if (current) {
        handlePing(current);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePing = async (targetUrl?: string) => {
    const testTarget = targetUrl || url;
    if (!testTarget.trim()) {
      setTestResult({ success: false, message: "Vui lòng nhập URL Google Apps Script Web App" });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await pingGoogleSheets(testTarget.trim());
      setTestResult(res);
      if (res.success) {
        setGoogleSheetsUrl(testTarget.trim());
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    const trimmed = url.trim();
    setGoogleSheetsUrl(trimmed);

    if (trimmed) {
      try {
        const cloudUrl = "https://kvdb.io/RtALwN4JAnjEQUjqKLgAuk/landing_config";
        const res = await fetch(cloudUrl, { cache: "no-store" });
        if (res.ok) {
          const cfg = await res.json();
          cfg.googleSheetsUrl = trimmed;
          await fetch(cloudUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cfg),
          });
        }
      } catch (e) {
        console.warn("Could not sync googleSheetsUrl to cloud:", e);
      }
    }

    if (onSuccess) onSuccess();
    onClose();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_SOURCE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleBackupConfig = async () => {
    if (!currentConfig) return;
    setBackingUp(true);
    setBackupMsg("");
    try {
      const res = await backupConfigToGoogleSheets(currentConfig);
      if (res.success) {
        setBackupMsg("✅ Đã sao lưu toàn bộ cấu hình trang đích lên Google Sheets!");
      } else {
        setBackupMsg("❌ Lỗi: " + res.message);
      }
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "800px", width: "95%" }}
      >
        <header className="modal-header" style={{ borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "#059669",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="check" size={20} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", color: "var(--text)" }}>
                Cơ sở Dữ liệu Google Trang tính (Google Sheets)
              </h2>
              <small style={{ color: "var(--muted)" }}>
                Miễn phí 100% trọn đời · Quản lý trực tiếp trên điện thoại & Google Drive
              </small>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Đóng">
            <Icon name="close" size={20} />
          </button>
        </header>

        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            padding: "12px 20px 0",
            borderBottom: "1px solid var(--border)",
            background: "#f8fafc",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            style={{
              padding: "8px 16px",
              border: "none",
              background: activeTab === "settings" ? "#fff" : "transparent",
              borderTopLeftRadius: "6px",
              borderTopRightRadius: "6px",
              fontWeight: activeTab === "settings" ? 700 : 500,
              color: activeTab === "settings" ? "var(--primary)" : "var(--muted)",
              borderBottom: activeTab === "settings" ? "2px solid var(--primary)" : "none",
              cursor: "pointer",
            }}
          >
            ⚙️ Cấu hình kết nối
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("guide")}
            style={{
              padding: "8px 16px",
              border: "none",
              background: activeTab === "guide" ? "#fff" : "transparent",
              borderTopLeftRadius: "6px",
              borderTopRightRadius: "6px",
              fontWeight: activeTab === "guide" ? 700 : 500,
              color: activeTab === "guide" ? "var(--primary)" : "var(--muted)",
              borderBottom: activeTab === "guide" ? "2px solid var(--primary)" : "none",
              cursor: "pointer",
            }}
          >
            📖 Hướng dẫn cài đặt (1 Phút)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("code")}
            style={{
              padding: "8px 16px",
              border: "none",
              background: activeTab === "code" ? "#fff" : "transparent",
              borderTopLeftRadius: "6px",
              borderTopRightRadius: "6px",
              fontWeight: activeTab === "code" ? 700 : 500,
              color: activeTab === "code" ? "var(--primary)" : "var(--muted)",
              borderBottom: activeTab === "code" ? "2px solid var(--primary)" : "none",
              cursor: "pointer",
            }}
          >
            📋 Mã nguồn Google Apps Script
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: "65vh", overflowY: "auto", padding: "20px" }}>
          {activeTab === "settings" && (
            <div>
              {/* Status Badge */}
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: testResult?.success ? "#f0fdf4" : url ? "#fefce8" : "#f1f5f9",
                  border: `1px solid ${testResult?.success ? "#86efac" : url ? "#fef08a" : "#cbd5e1"}`,
                }}
              >
                <div>
                  <strong style={{ color: testResult?.success ? "#166534" : "#334155", fontSize: "14px" }}>
                    {testResult?.success
                      ? `🟢 Đã kết nối thành công: ${testResult.sheetName || "Google Sheets"}`
                      : url
                      ? "🟡 Đang có URL (bấm kiểm tra để xác nhận)"
                      : "⚪ Chưa cấu hình Google Sheets"}
                  </strong>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                    {testResult?.message || "Nhập link Web App để tự động đồng bộ đơn tư vấn vào Google Trang tính."}
                  </p>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={testing || !url.trim()}
                  onClick={() => handlePing()}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {testing ? "Đang kiểm tra..." : "Kiểm tra kết nối"}
                </button>
              </div>

              {/* URL Input */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                  URL Ứng dụng web Google Apps Script (Web App URL):
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    style={{ flex: 1, padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border)" }}
                  />
                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleSave}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Lưu cấu hình
                  </button>
                </div>
                <small style={{ color: "var(--muted)", display: "block", marginTop: "6px" }}>
                  💡 Link có dạng kết thúc bằng <code>/exec</code> lấy từ nút Triển khai của Google Apps Script.
                </small>
              </div>

              {/* Features summary */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ padding: "12px", borderRadius: "6px", background: "#f8fafc", border: "1px solid var(--border)" }}>
                  <strong style={{ color: "var(--primary)", fontSize: "13px" }}>📊 Tab Don_Tu_Van</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                    Lưu trữ họ tên, SĐT/Zalo, nhu cầu của bé, chiến dịch Zalo, trạng thái tư vấn.
                  </p>
                </div>
                <div style={{ padding: "12px", borderRadius: "6px", background: "#f8fafc", border: "1px solid var(--border)" }}>
                  <strong style={{ color: "#059669", fontSize: "13px" }}>💬 Tab Lich_Su_Chat</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                    Ghi lại tin nhắn giữa phụ huynh và Trợ lý AI Cô Hương trên website.
                  </p>
                </div>
                <div style={{ padding: "12px", borderRadius: "6px", background: "#f8fafc", border: "1px solid var(--border)" }}>
                  <strong style={{ color: "#2563eb", fontSize: "13px" }}>🔔 Email tự động</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                    Tự động gửi thông báo về Gmail của Cô Hương ngay khi có đăng ký mới.
                  </p>
                </div>
              </div>

              {/* Backup Config Action */}
              {currentConfig && (
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "8px",
                    background: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "13px" }}>Sao lưu toàn bộ Cấu hình trang lên Google Sheets</strong>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                      Lưu trữ bản sao JSON cấu hình trang đích vào tab Cau_Hinh_Trang để phục hồi bất kỳ lúc nào.
                    </p>
                    {backupMsg && (
                      <span style={{ fontSize: "12px", fontWeight: 600, color: backupMsg.startsWith("✅") ? "#166534" : "#991b1b" }}>
                        {backupMsg}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={backingUp || !url}
                    onClick={handleBackupConfig}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {backingUp ? "Đang sao lưu..." : "Sao lưu ngay"}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "guide" && (
            <div style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--text)" }}>
              <div style={{ marginBottom: "16px", padding: "12px", borderRadius: "6px", background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
                <strong style={{ color: "#065f46" }}>Ưu điểm vượt trội của Google Sheets làm CSDL:</strong>
                <ul style={{ margin: "6px 0 0", paddingLeft: "20px", color: "#047857", fontSize: "13px" }}>
                  <li>Miễn phí 100% trọn đời, không bao giờ bị khóa tài khoản hay yêu cầu thẻ tín dụng.</li>
                  <li>Cô Hương và giáo viên có thể cài app <strong>Google Trang tính</strong> trên điện thoại để xem ngay thông tin phụ huynh.</li>
                  <li>Nhận thông báo email tức thì mỗi khi có lượt đăng ký tư vấn mới.</li>
                </ul>
              </div>

              <h3 style={{ fontSize: "15px", margin: "16px 0 8px", color: "var(--primary)" }}>
                4 Bước cài đặt siêu tốc (1 Phút):
              </h3>
              <ol style={{ paddingLeft: "22px", margin: 0 }}>
                <li style={{ marginBottom: "10px" }}>
                  <strong>Bước 1:</strong> Truy cập <a href="https://sheets.new" target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontWeight: 600 }}>sheets.new</a> để tạo 1 file Google Trang tính mới. Đặt tên file là: <code>CSDL Trẻ Tự Kỷ Cô Hương</code>.
                </li>
                <li style={{ marginBottom: "10px" }}>
                  <strong>Bước 2:</strong> Trên menu trên cùng của Google Sheets, bấm vào: <strong>Tiện ích mở rộng (Extensions)</strong> ➔ Chọn <strong>Apps Script</strong>.
                </li>
                <li style={{ marginBottom: "10px" }}>
                  <strong>Bước 3:</strong> Xóa hết nội dung mặc định trong khung code, chuyển sang tab <strong>"📋 Mã nguồn Google Apps Script"</strong> ở trên, bấm nút <strong>"Sao chép toàn bộ mã nguồn"</strong> và DÁN vào khung soạn thảo Apps Script ➔ Bấm biểu tượng 💾 <strong>Lưu (Save)</strong>.
                </li>
                <li style={{ marginBottom: "10px" }}>
                  <strong>Bước 4:</strong> Bấm nút <strong>Triển khai (Deploy)</strong> màu xanh ở góc phải trên ➔ Chọn <strong>Tùy chọn triển khai mới (New deployment)</strong>:
                  <ul style={{ marginTop: "4px" }}>
                    <li>Chọn loại: Bấm bánh răng ⚙ ➔ Chọn <strong>Ứng dụng web (Web app)</strong>.</li>
                    <li>Thực thi dưới dạng (Execute as): Chọn <strong>Tôi (Me)</strong>.</li>
                    <li>Ai có quyền truy cập (Who has access): Chọn <strong>Bất kỳ ai (Anyone)</strong>.</li>
                    <li>Bấm <strong>Triển khai (Deploy)</strong> ➔ Bấm <strong>Ủy quyền truy cập</strong> ➔ Chọn email của bạn.</li>
                  </ul>
                </li>
                <li>
                  <strong>Bước 5:</strong> Sao chép <strong>URL ứng dụng web</strong> (có đuôi <code>/exec</code>) và dán vào ô bên tab <strong>"Cấu hình kết nối"</strong> ➔ Bấm <strong>Lưu cấu hình</strong>. Xong!
                </li>
              </ol>
            </div>
          )}

          {activeTab === "code" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "13px", color: "var(--muted)" }}>
                  Mã nguồn Google Apps Script v1.0 (Tự động tạo tab, định dạng cột và gửi email):
                </span>
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleCopyCode}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: copied ? "#059669" : "var(--primary)" }}
                >
                  <Icon name={copied ? "check" : "copy"} size={16} />
                  <span>{copied ? "Đã sao chép vào bộ nhớ tạm!" : "Sao chép toàn bộ mã nguồn"}</span>
                </button>
              </div>
              <pre
                style={{
                  background: "#1e293b",
                  color: "#f8fafc",
                  padding: "16px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  maxHeight: "360px",
                  overflowY: "auto",
                  lineHeight: "1.5",
                  whiteSpace: "pre-wrap",
                }}
              >
                {APPS_SCRIPT_SOURCE}
              </pre>
            </div>
          )}
        </div>

        <footer
          className="modal-footer"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 20px",
            borderTop: "1px solid var(--border)",
            background: "#f8fafc",
          }}
        >
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>
            Google Sheets API Database Engine · Powered by Google Apps Script
          </span>
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" className="secondary-button" onClick={onClose}>
              Đóng
            </button>
            <button type="button" className="primary-button" onClick={handleSave}>
              Hoàn tất
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

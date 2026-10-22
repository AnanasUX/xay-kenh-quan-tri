/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - CƠ SỞ DỮ LIỆU GOOGLE SHEETS MIỄN PHÍ TRỌN ĐỜI
 * Dành riêng cho: Trung tâm Hỗ trợ Trẻ tự kỷ Cô Hương
 * Kết nối: Landing Page (tre-tu-ky-responsive) & Quản trị CMS (xay-kenh-quan-tri)
 * =========================================================================
 *
 * HƯỚNG DẪN CÀI ĐẶT CHUẨN 3 BƯỚC:
 * 1. Mở trang tính Google Sheets của bạn.
 *    Vào Tiện ích mở rộng (Extensions) -> Apps Script.
 * 2. Xóa hết code cũ, dán toàn bộ file này vào và bấm LƯU (Ctrl + S).
 *    -> Bạn có thể bấm nút "Chạy" (Run) để kiểm tra: Hệ thống sẽ tự tạo 4 tab và ghi 1 dòng mẫu ngay!
 * 3. Bấm "Triển khai" (Deploy) góc trên bên phải -> "Tùy chọn triển khai mới" (New deployment):
 *    - Loại: Chọn "Ứng dụng web" (Web app)
 *    - Thực thi dưới dạng (Execute as): "Tôi" (Me)
 *    - Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone)
 *    - Bấm "Triển khai" (Deploy) -> Ủy quyền truy cập -> Sao chép URL kết thúc bằng /exec.
 * =========================================================================
 */

/**
 * Hàm chạy thử nghiệm trực tiếp trong Google Apps Script
 * Bấm nút "Chạy" (Run) trên thanh công cụ Apps Script sẽ tự động thực thi hàm này!
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
      "Mã đơn",
      "Thời gian tạo",
      "Họ tên phụ huynh",
      "Số Zalo / Hotline",
      "Nhu cầu can thiệp",
      "Ghi chú / Biểu hiện bé",
      "Chiến dịch",
      "Trạng thái",
      "Ghi chú xử lý"
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

  // Xóa Sheet1 mặc định nếu rỗng
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
      // Khi người dùng bấm nút "Chạy" trực tiếp trong Apps Script
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

      // (Tự động gửi email thông báo cho Cô Hương khi có phụ huynh mới)
      try {
        const emailTo = Session.getActiveUser().getEmail();
        if (emailTo) {
          MailApp.sendEmail(
            emailTo,
            "🔔 Có phụ huynh đăng ký tư vấn mới: " + (lead.name || "Phụ huynh") + " (" + (lead.phone || "") + ")",
            "Thông tin đăng ký mới từ website Cô Hương:\n\n" +
            "• Phụ huynh: " + (lead.name || "") + "\n" +
            "• Số Zalo / Hotline: " + (lead.phone || "") + "\n" +
            "• Nhu cầu: " + (lead.need || "") + "\n" +
            "• Chia sẻ của phụ huynh: " + (lead.message || "") + "\n" +
            "• Thời gian: " + timeStr + "\n\n" +
            "👉 Mở Google Trang tính trên điện thoại hoặc máy tính để gọi điện / tư vấn ngay cho phụ huynh."
          );
        }
      } catch (mailErr) {}

      return responseJson({ success: true, message: "Đã lưu đơn tư vấn thành công vào Google Trang tính!", leadId: lead.id });
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
      return responseJson({ success: true, message: "Đã lưu cấu hình trang thành công vào Google Trang tính!" });
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

    // Hỗ trợ tạo đơn bằng GET (dự phòng tối đa)
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
}

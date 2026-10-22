/**
 * Google Sheets Database Service for Admin CMS
 * Quản trị và đồng bộ trực tiếp Cơ sở dữ liệu qua Google Trang tính (Google Sheets API / Apps Script)
 * Hoàn toàn miễn phí, Cô Hương có thể mở app Google Sheets trên điện thoại để xem và quản lý đơn tư vấn.
 */

export const STORAGE_GOOGLE_SHEETS_URL_KEY = "aurora_google_sheets_api_url";

export interface GoogleSheetLead {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  need: string;
  message: string;
  campaign?: string;
  status: "new" | "contacted" | "scheduled" | "completed";
  notes?: string;
}

export function getGoogleSheetsUrl(): string {
  if (typeof window === "undefined") return "";
  try {
    const customUrl = localStorage.getItem(STORAGE_GOOGLE_SHEETS_URL_KEY);
    if (customUrl && customUrl.trim()) return customUrl.trim();

    const savedConfig = localStorage.getItem("aurora-cms:landing-page");
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      if (parsed.googleSheetsUrl && parsed.googleSheetsUrl.trim()) {
        return parsed.googleSheetsUrl.trim();
      }
    }
  } catch {}
  return "";
}

export function setGoogleSheetsUrl(url: string): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = url.trim();
    localStorage.setItem(STORAGE_GOOGLE_SHEETS_URL_KEY, trimmed);

    const savedConfig = localStorage.getItem("aurora-cms:landing-page");
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        parsed.googleSheetsUrl = trimmed;
        localStorage.setItem("aurora-cms:landing-page", JSON.stringify(parsed));
      } catch {}
    }
  } catch {}
}

/**
 * Kiểm tra kết nối Google Apps Script (Ping test)
 */
export async function pingGoogleSheets(url?: string): Promise<{ success: boolean; message: string; sheetName?: string }> {
  const targetUrl = url || getGoogleSheetsUrl();
  if (!targetUrl || !targetUrl.startsWith("http")) {
    return { success: false, message: "Chưa cấu hình URL Google Apps Script Web App" };
  }

  try {
    const testUrl = targetUrl.includes("?") ? `${targetUrl}&action=ping` : `${targetUrl}?action=ping`;
    const res = await fetch(testUrl, {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        return {
          success: true,
          message: data.message || "Kết nối Google Trang tính thành công 100%!",
          sheetName: data.sheetName,
        };
      }
    }
    return { success: false, message: "Google Apps Script phản hồi mã: " + res.status };
  } catch (err: any) {
    return { success: false, message: "Không thể kết nối: " + (err?.message || "Kiểm tra quyền truy cập Web App") };
  }
}

/**
 * Lấy danh sách toàn bộ đơn tư vấn từ tab Don_Tu_Van của Google Sheets
 */
export async function fetchLeadsFromGoogleSheets(): Promise<{ success: boolean; leads: GoogleSheetLead[]; message?: string }> {
  const url = getGoogleSheetsUrl();
  if (!url) {
    return { success: false, leads: [], message: "Chưa cấu hình URL Google Trang tính" };
  }

  try {
    const fetchUrl = url.includes("?") ? `${url}&action=get_leads` : `${url}?action=get_leads`;
    const res = await fetch(fetchUrl, {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.leads)) {
        return { success: true, leads: data.leads };
      }
    }
    return { success: false, leads: [], message: "Không thể đọc dữ liệu từ Google Sheets" };
  } catch (err: any) {
    return { success: false, leads: [], message: err?.message || "Lỗi kết nối Google Sheets" };
  }
}

/**
 * Cập nhật trạng thái xử lý của đơn tư vấn trên Google Sheets
 */
export async function updateLeadStatusOnGoogleSheets(
  leadId: string,
  status: "new" | "contacted" | "scheduled" | "completed",
  notes?: string
): Promise<{ success: boolean; message?: string }> {
  const url = getGoogleSheetsUrl();
  if (!url) return { success: false, message: "Chưa cấu hình URL Google Sheets" };

  const statusMap: Record<string, string> = {
    new: "Mới nhận (Chưa liên hệ)",
    contacted: "Đã liên hệ tư vấn",
    scheduled: "Đã đặt lịch đánh giá",
    completed: "Hoàn tất hỗ trợ",
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "update_lead_status",
        leadId,
        status: statusMap[status] || status,
        notes: notes || "",
      }),
      redirect: "follow",
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({ success: true }));
      return { success: true, message: data.message || "Đã cập nhật trạng thái trên Google Trang tính!" };
    }
    return { success: false, message: "Phản hồi mã: " + res.status };
  } catch (err: any) {
    return { success: false, message: err?.message || "Lỗi kết nối khi cập nhật" };
  }
}

/**
 * Sao lưu toàn bộ JSON cấu hình trang đích lên Google Sheets
 */
export async function backupConfigToGoogleSheets(config: any): Promise<{ success: boolean; message?: string }> {
  const url = getGoogleSheetsUrl();
  if (!url) return { success: false, message: "Chưa cấu hình URL Google Sheets" };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "save_config",
        config,
      }),
      redirect: "follow",
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({ success: true }));
      return { success: true, message: data.message || "Đã sao lưu cấu hình thành công lên Google Trang tính!" };
    }
    return { success: false, message: "Lỗi phản hồi: " + res.status };
  } catch (err: any) {
    return { success: false, message: err?.message || "Lỗi khi sao lưu cấu hình" };
  }
}

/**
 * Lấy cấu hình sao lưu từ Google Sheets
 */
export async function fetchConfigFromGoogleSheets(): Promise<{ success: boolean; config?: any; message?: string }> {
  const url = getGoogleSheetsUrl();
  if (!url) return { success: false, message: "Chưa cấu hình URL Google Sheets" };

  try {
    const fetchUrl = url.includes("?") ? `${url}&action=get_config` : `${url}?action=get_config`;
    const res = await fetch(fetchUrl, {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.config) {
        return { success: true, config: data.config };
      }
    }
    return { success: false, message: "Không tìm thấy cấu hình trên Google Sheets" };
  } catch (err: any) {
    return { success: false, message: err?.message || "Lỗi kết nối" };
  }
}

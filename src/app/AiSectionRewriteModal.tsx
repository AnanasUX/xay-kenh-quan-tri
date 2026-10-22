import { useState, useEffect } from "react";
import {
  rewriteSelectedFieldsWithAI,
  testGeminiApiKey,
  type AiGenerateResult,
  IMMUTABLE_SYSTEM_INFO,
} from "./aiService";
import { type LandingPageConfig, type LandingSectionId } from "./landingPage";
import { Icon } from "./ui";

const API_KEY_STORAGE = "aurora-cms:gemini-api-key";
const BACKUP_STORAGE_KEY = "aurora_rewrite_backup_snapshot";

type AiSectionRewriteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: LandingPageConfig;
  activeSectionId: LandingSectionId;
  onApply: (newConfig: LandingPageConfig, publishImmediately: boolean) => void;
};

export function AiSectionRewriteModal({
  isOpen,
  onClose,
  currentConfig,
  activeSectionId,
  onApply,
}: AiSectionRewriteModalProps) {
  const [scopeMode, setScopeMode] = useState<"all_11_sections" | "selected_fields">("selected_fields");
  const [selectedSectionId, setSelectedSectionId] = useState<LandingSectionId>(activeSectionId);
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "title",
    "description",
    "items",
  ]);
  const [prompt, setPrompt] = useState("");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE) || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiGenerateResult | null>(null);
  const [backupTime, setBackupTime] = useState<string>("");
  const [hasBackup, setHasBackup] = useState(false);

  // Tự động sao lưu cấu hình dự phòng khi mở modal
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("vi-VN");
      try {
        localStorage.setItem(
          BACKUP_STORAGE_KEY,
          JSON.stringify({
            timestamp: now.toISOString(),
            timeStr,
            config: currentConfig,
          })
        );
        setBackupTime(timeStr);
        setHasBackup(true);
      } catch {}
      setSelectedSectionId(activeSectionId);
      setResult(null);
    }
  }, [isOpen, activeSectionId]);

  if (!isOpen) return null;

  const currentSection = currentConfig.sections.find((s) => s.id === selectedSectionId);

  const toggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleRestoreBackup = () => {
    try {
      const raw = localStorage.getItem(BACKUP_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.config) {
          onApply(parsed.config, false);
          alert(`Đã hoàn tác và phục hồi bản sao lưu lúc ${parsed.timeStr || "trước đó"} thành công!`);
          onClose();
        }
      }
    } catch {
      alert("Không tìm thấy bản sao lưu để phục hồi.");
    }
  };

  const handleRewrite = async () => {
    if (!prompt.trim()) {
      alert("Vui lòng nhập nội dung bạn muốn AI viết lại hoặc nâng cấp.");
      return;
    }
    if (scopeMode === "selected_fields" && selectedFields.length === 0) {
      alert("Vui lòng chọn ít nhất một trường thông tin cần viết lại.");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await rewriteSelectedFieldsWithAI(
        {
          prompt,
          scopeMode,
          selectedSectionId,
          selectedFields,
        },
        currentConfig,
        apiKey
      );
      setResult(res);
    } catch (e: any) {
      alert("Lỗi viết lại nội dung: " + (e?.message || "Không thể xử lý"));
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (publish: boolean) => {
    if (result && result.config) {
      onApply(result.config, publish);
      onClose();
    }
  };

  return (
    <div className="ai-modal-backdrop" onClick={onClose}>
      <div className="ai-modal" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
        <header className="ai-modal-header" style={{ borderBottom: "1.5px solid #ede9fe", background: "#fcfaff" }}>
          <div className="ai-modal-title">
            <span
              className="ai-badge-icon"
              style={{ background: "linear-gradient(135deg, #7c3aed, #50008b)", color: "#ffffff" }}
            >
              <Icon name="sparkle" size={20} />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: "#2e1065" }}>Viết lại bằng AI theo phân vùng</h3>
              <p style={{ margin: 0, fontSize: 13, color: "#6d28d9" }}>
                Chỉ chỉnh sửa chính xác các trường được tích chọn, giữ nguyên 100% các nội dung còn lại
              </p>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Đóng">
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="ai-modal-body" style={{ maxHeight: "75vh", overflowY: "auto", padding: "20px 24px" }}>
          {/* BANNER TỰ ĐỘNG SAO LƯU BACKUP */}
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#065f46" }}>
              <span style={{ fontSize: 16 }}>🛡️</span>
              <span>
                <strong>Hệ thống đã tự động sao lưu cấu hình dự phòng</strong> (lúc {backupTime || "vừa xong"}). An
                toàn 100%.
              </span>
            </div>
            {hasBackup && (
              <button
                type="button"
                onClick={handleRestoreBackup}
                style={{
                  padding: "4px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: "1px solid #6ee7b7",
                  background: "#ffffff",
                  color: "#047857",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                ⏪ Hoàn tác bản sao lưu
              </button>
            )}
          </div>

          {/* CHỌN PHÂN KHU VỰC SỬA */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>
              Phân khu vực chỉnh sửa:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: `2px solid ${scopeMode === "selected_fields" ? "#7c3aed" : "#e5e7eb"}`,
                  background: scopeMode === "selected_fields" ? "#faf5ff" : "#ffffff",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <input
                  type="radio"
                  name="scopeMode"
                  checked={scopeMode === "selected_fields"}
                  onChange={() => setScopeMode("selected_fields")}
                  style={{ accentColor: "#7c3aed", width: 16, height: 16 }}
                />
                <div>
                  <strong style={{ fontSize: 13, color: "#1f2937", display: "block" }}>
                    🎯 Chỉ sửa các trường được chọn
                  </strong>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>
                    Khuyên dùng — Không ảnh hưởng khối khác
                  </span>
                </div>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: `2px solid ${scopeMode === "all_11_sections" ? "#7c3aed" : "#e5e7eb"}`,
                  background: scopeMode === "all_11_sections" ? "#faf5ff" : "#ffffff",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <input
                  type="radio"
                  name="scopeMode"
                  checked={scopeMode === "all_11_sections"}
                  onChange={() => setScopeMode("all_11_sections")}
                  style={{ accentColor: "#7c3aed", width: 16, height: 16 }}
                />
                <div>
                  <strong style={{ fontSize: 13, color: "#1f2937", display: "block" }}>
                    🌐 Toàn bộ 11 khối trang web
                  </strong>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>Viết lại và tối ưu tổng thể website</span>
                </div>
              </label>
            </div>
          </div>

          {/* DANH SÁCH CÁC TRƯỜNG DỮ LIỆU ĐƯỢC CHỌN KHI Ở CHẾ ĐỘ PHÂN VÙNG */}
          {scopeMode === "selected_fields" && (
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <label style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                  Chọn khối nội dung cần sửa:
                </label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value as LandingSectionId)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13,
                    fontWeight: 600,
                    background: "#ffffff",
                    color: "#50008b",
                  }}
                >
                  {currentConfig.sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} ({s.title})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8 }}>
                Tích chọn các trường thông tin cụ thể trong ô dữ liệu để AI chỉnh sửa:
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: selectedFields.includes("title") ? "#ede9fe" : "#ffffff",
                    border: `1px solid ${selectedFields.includes("title") ? "#c4b5fd" : "#cbd5e1"}`,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedFields.includes("title")}
                    onChange={() => toggleField("title")}
                    style={{ accentColor: "#7c3aed" }}
                  />
                  <span>Tiêu đề chính (Title)</span>
                </label>

                {currentSection?.eyebrow !== undefined && (
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: selectedFields.includes("eyebrow") ? "#ede9fe" : "#ffffff",
                      border: `1px solid ${selectedFields.includes("eyebrow") ? "#c4b5fd" : "#cbd5e1"}`,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields.includes("eyebrow")}
                      onChange={() => toggleField("eyebrow")}
                      style={{ accentColor: "#7c3aed" }}
                    />
                    <span>Tiêu đề phụ (Eyebrow)</span>
                  </label>
                )}

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: selectedFields.includes("description") ? "#ede9fe" : "#ffffff",
                    border: `1px solid ${selectedFields.includes("description") ? "#c4b5fd" : "#cbd5e1"}`,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedFields.includes("description")}
                    onChange={() => toggleField("description")}
                    style={{ accentColor: "#7c3aed" }}
                  />
                  <span>Đoạn mô tả (Description)</span>
                </label>

                {currentSection?.primaryAction !== undefined && (
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: selectedFields.includes("primaryAction") ? "#ede9fe" : "#ffffff",
                      border: `1px solid ${selectedFields.includes("primaryAction") ? "#c4b5fd" : "#cbd5e1"}`,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields.includes("primaryAction")}
                      onChange={() => toggleField("primaryAction")}
                      style={{ accentColor: "#7c3aed" }}
                    />
                    <span>Nút hành động chính</span>
                  </label>
                )}

                {currentSection?.items && currentSection.items.length > 0 && (
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: selectedFields.includes("items") ? "#ede9fe" : "#ffffff",
                      border: `1px solid ${selectedFields.includes("items") ? "#c4b5fd" : "#cbd5e1"}`,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields.includes("items")}
                      onChange={() => toggleField("items")}
                      style={{ accentColor: "#7c3aed" }}
                    />
                    <span>Các mục con ({currentSection.items.length} mục)</span>
                  </label>
                )}
              </div>

              <div style={{ marginTop: 8, fontSize: 11, color: "#64748b" }}>
                🔒 <em>Lưu ý: Chỉ các trường được đánh dấu tích ở trên sẽ được sửa. Các trường khác giữ nguyên 100%.</em>
              </div>
            </div>
          )}

          {/* Ô NHẬP NỘI DUNG YÊU CẦU SỬA */}
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="rewrite-prompt-input"
              style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "block", marginBottom: 6 }}
            >
              Nội dung bạn muốn AI viết lại hoặc nâng cấp:
            </label>
            <textarea
              id="rewrite-prompt-input"
              rows={4}
              placeholder="Ví dụ: Viết lại đoạn mô tả tạo sự thấu cảm sâu sắc với phụ huynh có con chậm nói 2-3 tuổi, nhấn mạnh phương pháp can thiệp sớm và âm ngữ trị liệu..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1.5px solid #cbd5e1",
                fontSize: 13,
                lineHeight: 1.5,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          {/* CẢNH BÁO KHÓA CHẶT 5 THÔNG TIN HỆ THỐNG */}
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              fontSize: 11,
              color: "#475569",
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <span>🔒</span>
            <span>
              <strong>Bảo vệ tuyệt đối:</strong> 5 thông tin cố định ({IMMUTABLE_SYSTEM_INFO.title}, {IMMUTABLE_SYSTEM_INFO.address}, SĐT, Email, Fanpage) luôn được khóa chặt không đổi.
            </span>
          </div>

          {/* HIỂN THỊ KẾT QUẢ AI VỪA XỬ LÝ */}
          {result && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1.5px solid #86efac",
                borderRadius: 12,
                padding: "14px 18px",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#166534" }}>
                <span style={{ fontSize: 16 }}>✅</span>
                <strong style={{ fontSize: 14 }}>AI đã viết lại thành công:</strong>
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "#bbf7d0",
                    color: "#14532d",
                    fontWeight: 700,
                  }}
                >
                  {result.engine === "gemini" ? "Google Gemini" : "Built-in AI"}
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#166534", lineHeight: 1.6 }}>
                {result.summary.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <footer
          className="ai-modal-footer"
          style={{ borderTop: "1px solid #ede9fe", padding: "14px 24px", display: "flex", justifyContent: "space-between" }}
        >
          <button className="secondary-button" type="button" onClick={onClose} disabled={loading}>
            Đóng
          </button>

          {!result ? (
            <button
              className="primary-button"
              type="button"
              onClick={handleRewrite}
              disabled={loading || !prompt.trim()}
              style={{
                background: "linear-gradient(135deg, #7c3aed, #50008b)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon name="sparkle" size={16} />
              {loading ? "Đang viết lại nội dung..." : "Thực hiện viết lại bằng AI"}
            </button>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setResult(null)}
                disabled={loading}
              >
                <Icon name="refresh" size={15} />
                Viết lại câu lệnh khác
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => handleApply(false)}
                disabled={loading}
              >
                Áp dụng vào bản nháp
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={() => handleApply(true)}
                disabled={loading}
                style={{ background: "#16a34a" }}
              >
                <Icon name="check" size={16} />
                Áp dụng & Xuất bản ngay
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}

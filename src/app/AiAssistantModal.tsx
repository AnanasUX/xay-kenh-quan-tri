import { useState } from "react";
import { generateLandingConfigWithAI, testGeminiApiKey, type AiGenerateResult } from "./aiService";
import { type LandingPageConfig, type LandingSectionId } from "./landingPage";
import { Icon } from "./ui";

const API_KEY_STORAGE = "aurora-cms:gemini-api-key";

type AiAssistantModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: LandingPageConfig;
  activeSectionId: LandingSectionId;
  onApply: (newConfig: LandingPageConfig, publishImmediately: boolean) => void;
};

const QUICK_PROMPTS = [
  {
    label: "🏫 Đổi thông tin trung tâm mới",
    prompt: "Đổi tên thành Trung tâm Can thiệp sớm Ánh Dương tại Đà Nẵng, hotline 0987 654 321, email lienhe@anhduong.vn. Chuyên can thiệp sớm cho trẻ tự kỷ, chậm nói và điều hòa cảm xúc.",
  },
  {
    label: "🎯 Nâng cấp các lĩnh vực can thiệp",
    prompt: "Viết lại mục Lĩnh vực hỗ trợ tập trung vào 6 phương pháp khoa học: Âm ngữ trị liệu, Can thiệp hành vi ABA, Điều hòa giác quan OT, Kỹ năng xã hội, Tiền tiểu học và Tự lập sinh hoạt.",
  },
  {
    label: "👩‍🏫 Tạo hồ sơ đội ngũ chuyên gia",
    prompt: "Cập nhật mục Đội ngũ gồm 4 giáo viên và chuyên gia: Giám đốc chuyên môn ThS Tâm lý lâm sàng, Chuyên viên Âm ngữ trị liệu, Chuyên viên Điều hòa Cảm giác và Giáo viên Can thiệp sớm.",
  },
  {
    label: "📋 Cập nhật quy trình 5 bước",
    prompt: "Xây dựng quy trình can thiệp 5 bước minh bạch từ tiếp nhận ban đầu, đánh giá IEP, can thiệp cá nhân hóa đến họp tổng kết tiến bộ cùng phụ huynh.",
  },
  {
    label: "❓ Soạn 4 câu hỏi thường gặp",
    prompt: "Soạn 4 câu hỏi FAQ giải đáp thắc mắc lớn nhất của phụ huynh: Thời điểm vàng can thiệp, phụ huynh có được tham gia lớp không, thời lượng buổi học và cam kết bảo mật thông tin.",
  },
];

export function AiAssistantModal({
  isOpen,
  onClose,
  currentConfig,
  activeSectionId,
  onApply,
}: AiAssistantModalProps) {
  const [prompt, setPrompt] = useState("");
  const [scope, setScope] = useState<LandingSectionId | "all">("all");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE) || "");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiGenerateResult | null>(null);
  const [testingKey, setTestingKey] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState<{ ok: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const currentSection = currentConfig.sections.find((s) => s.id === activeSectionId);

  const handleSaveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem(API_KEY_STORAGE, key.trim());
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setKeyTestStatus({ ok: false, message: "Vui lòng nhập API Key trước khi kiểm tra." });
      return;
    }
    setTestingKey(true);
    setKeyTestStatus(null);
    try {
      const res = await testGeminiApiKey(apiKey.trim());
      if (res.ok) {
        setKeyTestStatus({
          ok: true,
          message: `Kết nối thành công tới Google AI Studio! Đang hoạt động trên mô hình: ${res.model}`,
        });
      } else {
        setKeyTestStatus({
          ok: false,
          message: `Không thể kết nối tới Google Gemini: ${res.error || "Key không hợp lệ hoặc hết hạn mức."}`,
        });
      }
    } catch (err: any) {
      setKeyTestStatus({
        ok: false,
        message: `Lỗi kết nối: ${err?.message || "Kiểm tra kết nối mạng của bạn."}`,
      });
    } finally {
      setTestingKey(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("Vui lòng nhập yêu cầu của bạn để AI xử lý.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await generateLandingConfigWithAI(prompt, currentConfig, scope, apiKey);
      setResult(res);
    } catch (e: any) {
      alert("Có lỗi xảy ra: " + (e?.message || "Không thể tạo nội dung"));
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
      <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
        <header className="ai-modal-header">
          <div className="ai-modal-title">
            <span className="ai-badge-icon">
              <Icon name="sparkle" size={20} />
            </span>
            <div>
              <h3>Trợ lý AI Cấu hình Nội dung</h3>
              <p>Nhập yêu cầu bằng ngôn ngữ tự nhiên để AI tự động cập nhật website</p>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Đóng">
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="ai-modal-body">
          {/* Engine indicator & Key settings */}
          <div className="ai-engine-bar">
            <div className="ai-engine-status">
              <span className={`engine-dot ${apiKey.trim() ? "engine-gemini" : "engine-builtin"}`} />
              <span>
                {apiKey.trim()
                  ? "Động cơ: Google Gemini (Google AI Studio)"
                  : "Động cơ: AI Thông minh tích hợp (Sẵn sàng - Không cần key)"}
              </span>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={() => setShowKeyInput(!showKeyInput)}
            >
              <Icon name="key" size={14} />
              {showKeyInput ? "Ẩn cấu hình Key" : apiKey.trim() ? "Đổi / Kiểm tra Key" : "Thêm Gemini Key"}
            </button>
          </div>

          {showKeyInput && (
            <div className="ai-key-box">
              <label>
                Google Gemini API Key (Google AI Studio)
                <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                  <input
                    type="password"
                    placeholder="AQ.Ab... hoặc AIzaSy..."
                    value={apiKey}
                    onChange={(e) => {
                      handleSaveKey(e.target.value);
                      setKeyTestStatus(null);
                    }}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="secondary-button"
                    style={{ whiteSpace: "nowrap", height: "36px", padding: "0 12px", fontSize: "13px" }}
                    onClick={handleTestKey}
                    disabled={testingKey || !apiKey.trim()}
                  >
                    {testingKey ? "Đang kiểm tra..." : "Kiểm tra kết nối"}
                  </button>
                </div>
              </label>

              {keyTestStatus && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    lineHeight: "1.4",
                    fontWeight: 500,
                    backgroundColor: keyTestStatus.ok ? "#ecfdf5" : "#fef2f2",
                    color: keyTestStatus.ok ? "#065f46" : "#b91c1c",
                    border: `1px solid ${keyTestStatus.ok ? "#a7f3d0" : "#fecaca"}`,
                  }}
                >
                  {keyTestStatus.ok ? "✓ " : "✕ "}
                  {keyTestStatus.message}
                </div>
              )}

              <small>
                Khóa được lưu cục bộ trên trình duyệt (localStorage). Tương thích với các model: gemini-2.5-flash (khuyến dùng), gemini-2.5-flash-lite, gemini-1.5-flash.{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="link-highlight"
                >
                  Lấy API Key miễn phí tại Google AI Studio ↗
                </a>
              </small>
            </div>
          )}

          {/* Scope Selector */}
          <div className="ai-scope-selector">
            <label className="scope-label">Phạm vi áp dụng:</label>
            <div className="scope-options">
              <button
                type="button"
                className={`scope-pill ${scope === "all" ? "active" : ""}`}
                onClick={() => setScope("all")}
              >
                🌐 Toàn bộ trang web (Tất cả 11 khối)
              </button>
              {currentSection && (
                <button
                  type="button"
                  className={`scope-pill ${scope === currentSection.id ? "active" : ""}`}
                  onClick={() => setScope(currentSection.id)}
                >
                  🎯 Chỉ khối "{currentSection.label}"
                </button>
              )}
            </div>
          </div>

          {/* Prompt input */}
          <div className="ai-prompt-container">
            <label htmlFor="ai-prompt-input">
              <strong>Yêu cầu nội dung của bạn:</strong>
            </label>
            <textarea
              id="ai-prompt-input"
              rows={4}
              placeholder="Ví dụ: Đổi tên thành Trung tâm Can thiệp sớm Sao Mai ở Hà Đông, Hà Nội. Số hotline 0912 345 678. Tập trung vào phương pháp ABA và Âm ngữ trị liệu cho trẻ chậm nói. Bổ sung đội ngũ giáo viên giàu kinh nghiệm..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* Quick prompts */}
          <div className="ai-quick-prompts">
            <span>Gợi ý mẫu:</span>
            <div className="quick-tags">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="quick-tag"
                  onClick={() => {
                    setPrompt(qp.prompt);
                    setScope("all");
                  }}
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Result view */}
          {result && (
            <div className="ai-result-box">
              <div className="ai-result-header">
                <span className="result-check">
                  <Icon name="check" size={16} />
                </span>
                <strong>AI đã xử lý xong nội dung:</strong>
                <span className="engine-tag">
                  {result.engine === "gemini" ? "Google Gemini" : "Built-in AI"}
                </span>
              </div>
              <ul className="ai-summary-list">
                {result.summary.map((item, idx) => (
                  <li key={idx}>✓ {item}</li>
                ))}
              </ul>
              {result.error && <p className="ai-result-note">{result.error}</p>}
            </div>
          )}
        </div>

        <footer className="ai-modal-footer">
          <button className="secondary-button" type="button" onClick={onClose} disabled={loading}>
            Hủy
          </button>

          {!result ? (
            <button
              className="primary-button ai-submit-button"
              type="button"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
            >
              <Icon name="sparkle" size={16} />
              {loading ? "Đang phân tích & tạo nội dung..." : "Tạo nội dung với AI"}
            </button>
          ) : (
            <div className="ai-apply-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setResult(null)}
                disabled={loading}
              >
                <Icon name="refresh" size={15} />
                Tạo lại
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

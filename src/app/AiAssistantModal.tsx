import { useState, useRef, useEffect } from "react";
import {
  generateLandingConfigWithAI,
  testGeminiApiKey,
  type AiGenerateResult,
  IMMUTABLE_SYSTEM_INFO,
  enforceImmutableSystemInfo,
} from "./aiService";
import { type LandingPageConfig, type LandingSectionId } from "./landingPage";
import { Icon } from "./ui";

const API_KEY_STORAGE = "aurora-cms:gemini-api-key";
const AI_HISTORY_STORAGE = "aurora-cms:ai-edit-history";

type AiHistoryEntry = {
  id: string;
  timestamp: string;
  prompt: string;
  summary: string[];
  config: LandingPageConfig;
};

type AiAssistantModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: LandingPageConfig;
  activeSectionId: LandingSectionId;
  onApply: (newConfig: LandingPageConfig, publishImmediately: boolean) => void;
};

const AI_SUGGESTIONS = [
  {
    title: "🎯 Nâng cấp chuyên môn can thiệp sớm & Âm ngữ",
    prompt: "Tối ưu hóa nội dung website tập trung vào can thiệp sớm cho trẻ chậm nói 18-36 tháng tuổi, bổ sung kỹ thuật âm ngữ trị liệu, kích thích phản xạ giao tiếp tự nhiên và kế hoạch giáo dục cá nhân (IEP).",
  },
  {
    title: "🏫 Hoàn thiện hồ sơ giáo viên & kinh nghiệm can thiệp 1:1",
    prompt: "Cập nhật khối Đội ngũ chuyên môn với chi tiết bằng cấp Cử nhân/Thạc sĩ Tâm lý học, Giáo dục Đặc biệt, chứng chỉ Âm ngữ trị liệu và hơn 10 năm kinh nghiệm đồng hành cùng trẻ.",
  },
  {
    title: "📋 Chuẩn hóa quy trình 5 bước minh bạch",
    prompt: "Viết lại Quy trình can thiệp 5 bước chuẩn y khoa: Tiếp nhận ban đầu -> Đánh giá Denver II/M-CHAT -> Xây dựng IEP cá nhân -> Can thiệp 1:1 -> Họp tổng kết tiến bộ định kỳ với gia đình.",
  },
  {
    title: "❓ Bổ sung 4 câu hỏi FAQ phụ huynh quan tâm nhất",
    prompt: "Soạn các câu hỏi giải đáp chi tiết: Thời điểm vàng can thiệp, phụ huynh được tham gia lớp không, thời lượng buổi học 45-60 phút và cam kết bảo mật tuyệt đối hồ sơ của con.",
  },
  {
    title: "🧩 Điều hòa cảm giác (OT) & Quản lý cơn ăn vạ",
    prompt: "Bổ sung hướng dẫn xử lý cơn giận dữ (meltdown), kỹ thuật điều hòa cảm giác cho trẻ nhón chân/vẫy tay và tạo lịch trình sinh hoạt bằng hình ảnh (PECS) tại nhà.",
  },
];

export function AiAssistantModal({
  isOpen,
  onClose,
  currentConfig,
  activeSectionId,
  onApply,
}: AiAssistantModalProps) {
  const [activeTab, setActiveTab] = useState<"assistant" | "json_tool" | "history">("assistant");
  const [prompt, setPrompt] = useState("");
  const [scope, setScope] = useState<LandingSectionId | "all">("all");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE) || "");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiGenerateResult | null>(null);
  const [testingKey, setTestingKey] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState<{ ok: boolean; message: string } | null>(null);

  // JSON Tool states
  const [attachedJsonFile, setAttachedJsonFile] = useState<{ name: string; size: number; config: LandingPageConfig } | null>(null);
  const [jsonTextPreview, setJsonTextPreview] = useState<string>("");
  const [showJsonDiff, setShowJsonDiff] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Edit History state
  const [historyList, setHistoryList] = useState<AiHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem(AI_HISTORY_STORAGE);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (isOpen) {
      setResult(null);
      setAttachedJsonFile(null);
      setJsonTextPreview(JSON.stringify(currentConfig, null, 2));
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const currentSection = currentConfig.sections.find((s) => s.id === activeSectionId);

  const saveHistoryEntry = (newConfig: LandingPageConfig, promptText: string, summary: string[]) => {
    const entry: AiHistoryEntry = {
      id: "ai-rev-" + Date.now(),
      timestamp: new Date().toLocaleString("vi-VN"),
      prompt: promptText,
      summary,
      config: newConfig,
    };
    const updated = [entry, ...historyList.slice(0, 19)]; // giữ tối đa 20 bản ghi
    setHistoryList(updated);
    try {
      localStorage.setItem(AI_HISTORY_STORAGE, JSON.stringify(updated));
    } catch {}
  };

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
          message: `Kết nối thành công tới Google AI Studio! Đang hoạt động trên: ${res.model}`,
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

  // Tải file JSON hiện tại của hệ thống về máy
  const handleDownloadCurrentJson = () => {
    const blob = new Blob([JSON.stringify(currentConfig, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cau-hinh-trung-tam-co-huong-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Tải file JSON đã được AI sửa về máy
  const handleDownloadUpdatedJson = () => {
    if (!result?.config) return;
    const blob = new Blob([JSON.stringify(result.config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cau-hinh-da-sua-bang-ai-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Đính kèm file JSON từ máy tính
  const handleAttachJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.sections)) {
          enforceImmutableSystemInfo(parsed);
          setAttachedJsonFile({
            name: file.name,
            size: file.size,
            config: parsed,
          });
          setJsonTextPreview(JSON.stringify(parsed, null, 2));
          alert(`Đã đính kèm file "${file.name}" thành công! AI sẽ đọc và áp dụng các chỉnh sửa trên file này.`);
        } else {
          alert("File JSON không đúng cấu trúc cấu hình website.");
        }
      } catch (err: any) {
        alert("Không thể đọc file JSON này: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Xử lý tạo nội dung với AI
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("Vui lòng nhập yêu cầu của bạn để AI xử lý.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      // Nếu có file JSON đính kèm, sử dụng config từ file làm dữ liệu đầu vào
      const baseConfig = attachedJsonFile ? attachedJsonFile.config : currentConfig;
      const res = await generateLandingConfigWithAI(prompt, baseConfig, scope, apiKey);

      // Đảm bảo 5 thông tin cố định không bao giờ bị đổi
      enforceImmutableSystemInfo(res.config);

      setResult(res);
      setJsonTextPreview(JSON.stringify(res.config, null, 2));

      // Tự động ghi nhớ vào lịch sử
      saveHistoryEntry(res.config, prompt, res.summary);
    } catch (e: any) {
      alert("Có lỗi xảy ra: " + (e?.message || "Không thể tạo nội dung"));
    } finally {
      setLoading(false);
    }
  };

  // Phục hồi từ lịch sử
  const handleRestoreFromHistory = (entry: AiHistoryEntry) => {
    if (window.confirm(`Bạn có chắc chắn muốn phục hồi phiên bản đã lưu lúc ${entry.timestamp}?`)) {
      enforceImmutableSystemInfo(entry.config);
      onApply(entry.config, false);
      alert("Đã phục hồi phiên bản thành công!");
      onClose();
    }
  };

  const handleApply = (publish: boolean) => {
    if (result && result.config) {
      enforceImmutableSystemInfo(result.config);
      onApply(result.config, publish);
      onClose();
    }
  };

  return (
    <div className="ai-modal-backdrop" onClick={onClose}>
      <div className="ai-modal" style={{ maxWidth: 840 }} onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <header className="ai-modal-header" style={{ background: "#fcfaff", borderBottom: "1.5px solid #ede9fe" }}>
          <div className="ai-modal-title">
            <span
              className="ai-badge-icon"
              style={{ background: "linear-gradient(135deg, #7c3aed, #50008b)", color: "#ffffff" }}
            >
              <Icon name="sparkle" size={20} />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: "#2e1065" }}>Trợ lý AI Cấu hình Nội dung & Quản lý JSON</h3>
              <p style={{ margin: 0, fontSize: 13, color: "#6d28d9" }}>
                Gợi ý thông minh, chỉnh sửa file JSON trực quan và kiểm soát lịch sử phiên bản
              </p>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Đóng">
            <Icon name="close" size={18} />
          </button>
        </header>

        {/* NAVIGATION TABS */}
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "10px 24px 0",
            borderBottom: "1px solid #e2e8f0",
            background: "#f8fafc",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("assistant")}
            style={{
              padding: "8px 16px",
              border: "none",
              borderBottom: activeTab === "assistant" ? "2.5px solid #7c3aed" : "2.5px solid transparent",
              background: "none",
              color: activeTab === "assistant" ? "#7c3aed" : "#64748b",
              fontWeight: activeTab === "assistant" ? 700 : 500,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            ✨ Trợ lý tạo nội dung
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("json_tool")}
            style={{
              padding: "8px 16px",
              border: "none",
              borderBottom: activeTab === "json_tool" ? "2.5px solid #7c3aed" : "2.5px solid transparent",
              background: "none",
              color: activeTab === "json_tool" ? "#7c3aed" : "#64748b",
              fontWeight: activeTab === "json_tool" ? 700 : 500,
              fontSize: 13,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            📁 Đính kèm & Tải file JSON {attachedJsonFile && <span style={{ color: "#16a34a" }}>●</span>}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            style={{
              padding: "8px 16px",
              border: "none",
              borderBottom: activeTab === "history" ? "2.5px solid #7c3aed" : "2.5px solid transparent",
              background: "none",
              color: activeTab === "history" ? "#7c3aed" : "#64748b",
              fontWeight: activeTab === "history" ? 700 : 500,
              fontSize: 13,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            🕒 Lịch sử phiên bản ({historyList.length})
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="ai-modal-body" style={{ maxHeight: "70vh", overflowY: "auto", padding: "20px 24px" }}>
          {/* Engine indicator & Key settings */}
          <div className="ai-engine-bar" style={{ marginBottom: 14 }}>
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
            <div className="ai-key-box" style={{ marginBottom: 14 }}>
              <label>
                Google Gemini API Key (Google AI Studio)
                <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
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
            </div>
          )}

          {/* TAB 1: TRỢ LÝ TẠO NỘI DUNG */}
          {activeTab === "assistant" && (
            <>
              {/* Scope Selector */}
              <div className="ai-scope-selector" style={{ marginBottom: 14 }}>
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

              {/* Status if JSON attached */}
              {attachedJsonFile && (
                <div
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    fontSize: 12,
                    color: "#166534",
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    📎 Đang sử dụng file đính kèm: <strong>{attachedJsonFile.name}</strong> (
                    {Math.round(attachedJsonFile.size / 1024)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachedJsonFile(null)}
                    style={{ border: "none", background: "none", color: "#dc2626", cursor: "pointer", fontWeight: 600 }}
                  >
                    Hủy đính kèm
                  </button>
                </div>
              )}

              {/* Prompt Input */}
              <div className="ai-prompt-container" style={{ marginBottom: 14 }}>
                <label htmlFor="ai-prompt-input">
                  <strong>Nội dung bạn yêu cầu AI chỉnh sửa hoặc tối ưu:</strong>
                </label>
                <textarea
                  id="ai-prompt-input"
                  rows={4}
                  placeholder="Ví dụ: Tối ưu nội dung giới thiệu can thiệp sớm cho trẻ chậm nói tại TDP Duyên Phúc, xã Hưng Hà, Tỉnh Hưng Yên. Nhấn mạnh bằng cấp cử nhân giáo dục đặc biệt và kỹ thuật âm ngữ 1:1..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              {/* AI Suggestions */}
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>
                  💡 Gợi ý nội dung sửa thông minh từ AI (Nhấn để chọn):
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {AI_SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(item.prompt)}
                      style={{
                        textAlign: "left",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        background: "#ffffff",
                        cursor: "pointer",
                        fontSize: 12,
                        transition: "all 0.15s",
                      }}
                    >
                      <strong style={{ color: "#50008b", display: "block" }}>{item.title}</strong>
                      <span style={{ color: "#64748b", fontSize: 11 }}>{item.prompt}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Immutable info guard */}
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  fontSize: 11,
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>🛡️</span>
                <span>
                  <strong>Hệ thống khóa cố định:</strong> Email ({IMMUTABLE_SYSTEM_INFO.email}), Địa chỉ (
                  {IMMUTABLE_SYSTEM_INFO.address}), Hotline ({IMMUTABLE_SYSTEM_INFO.phone}), Fanpage và Tên trung tâm
                  luôn được bảo vệ nguyên vẹn.
                </span>
              </div>
            </>
          )}

          {/* TAB 2: QUẢN LÝ FILE JSON */}
          {activeTab === "json_tool" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    padding: "16px",
                    borderRadius: 12,
                    background: "#f8fafc",
                    border: "1.5px dashed #cbd5e1",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: 24, display: "block", marginBottom: 6 }}>⬇️</span>
                  <strong style={{ fontSize: 13, color: "#1e293b", display: "block" }}>
                    Tải file JSON hiện tại về máy
                  </strong>
                  <p style={{ margin: "4px 0 12px", fontSize: 11, color: "#64748b" }}>
                    Lưu bản sao lưu cấu hình toàn bộ trang web vào máy tính của bạn
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadCurrentJson}
                    className="secondary-button"
                    style={{ fontSize: 12, padding: "6px 14px", height: "auto" }}
                  >
                    <Icon name="download" size={14} />
                    Tải file JSON hiện tại
                  </button>
                </div>

                <div
                  style={{
                    padding: "16px",
                    borderRadius: 12,
                    background: "#faf5ff",
                    border: "1.5px dashed #d8b4fe",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: 24, display: "block", marginBottom: 6 }}>📎</span>
                  <strong style={{ fontSize: 13, color: "#50008b", display: "block" }}>
                    Đính kèm file JSON vào hệ thống
                  </strong>
                  <p style={{ margin: "4px 0 12px", fontSize: 11, color: "#64748b" }}>
                    Cho phép AI đọc trực tiếp file JSON của bạn và gợi ý nội dung sửa
                  </p>
                  <label
                    className="primary-button"
                    style={{
                      fontSize: 12,
                      padding: "6px 14px",
                      height: "auto",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Icon name="upload" size={14} />
                    {attachedJsonFile ? "Đổi file JSON khác" : "Chọn file JSON để nạp"}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleAttachJsonFile}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>

              {attachedJsonFile && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 10,
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <strong style={{ color: "#065f46", fontSize: 13 }}>
                      ✓ Đã đính kèm file: {attachedJsonFile.name}
                    </strong>
                    <div style={{ fontSize: 11, color: "#047857" }}>
                      Dung lượng: {Math.round(attachedJsonFile.size / 1024)} KB · Số khối:{" "}
                      {attachedJsonFile.config.sections.length} khối
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("assistant")}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      background: "#059669",
                      color: "#ffffff",
                      border: "none",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Bắt đầu yêu cầu AI sửa file này ↗
                  </button>
                </div>
              )}

              {/* Text view of current JSON */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                    Mã JSON cấu hình hiện tại (Text):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(jsonTextPreview);
                      alert("Đã sao chép mã JSON vào khay nhớ tạm!");
                    }}
                    style={{
                      border: "none",
                      background: "none",
                      color: "#6d28d9",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    📋 Sao chép text JSON
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={8}
                  value={jsonTextPreview}
                  style={{
                    width: "100%",
                    fontFamily: "monospace",
                    fontSize: 11,
                    padding: "10px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 3: LỊCH SỬ CHỈNH SỬA & PHỤC HỒI PHIÊN BẢN */}
          {activeTab === "history" && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <div>
                  <strong style={{ fontSize: 14, color: "#1e293b" }}>
                    Ghi nhớ chỉnh sửa & Phục hồi phiên bản trước
                  </strong>
                  <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                    Kiểm soát toàn diện mọi lần AI can thiệp nội dung, có thể phục hồi lại bất cứ lúc nào
                  </p>
                </div>
                {historyList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử?")) {
                        setHistoryList([]);
                        localStorage.removeItem(AI_HISTORY_STORAGE);
                      }
                    }}
                    style={{
                      border: "none",
                      background: "none",
                      color: "#ef4444",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Xóa lịch sử
                  </button>
                )}
              </div>

              {historyList.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 16px", color: "#94a3b8" }}>
                  <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>🕒</span>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Chưa có phiên bản chỉnh sửa nào được lưu</p>
                  <span style={{ fontSize: 12 }}>
                    Mỗi lần bạn yêu cầu AI tạo hoặc sửa nội dung thành công, hệ thống sẽ tự động ghi nhớ tại đây.
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {historyList.map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        padding: "12px 16px",
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        background: "#ffffff",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 14,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed" }}>
                            🕒 {entry.timestamp}
                          </span>
                        </div>
                        <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                          "{entry.prompt}"
                        </p>
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#059669" }}>
                          {entry.summary.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRestoreFromHistory(entry)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          border: "1.5px solid #7c3aed",
                          background: "#faf5ff",
                          color: "#7c3aed",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ⏪ Phục hồi phiên bản này
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HIỂN THỊ KẾT QUẢ AI VỪA XỬ LÝ (KHI CÓ RESULT) */}
          {result && (
            <div
              className="ai-result-box"
              style={{
                marginTop: 16,
                background: "#f0fdf4",
                border: "1.5px solid #86efac",
                borderRadius: 12,
                padding: "14px 18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#166534" }}>
                  <span style={{ fontSize: 16 }}>✅</span>
                  <strong style={{ fontSize: 14 }}>AI đã cập nhật cấu hình thành công:</strong>
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
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleDownloadUpdatedJson}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: "1px solid #16a34a",
                      background: "#ffffff",
                      color: "#15803d",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Icon name="download" size={13} />
                    Tải file JSON đã sửa về máy
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowJsonDiff(!showJsonDiff)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#475569",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {showJsonDiff ? "Ẩn text JSON" : "Xem text JSON"}
                  </button>
                </div>
              </div>

              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#166534", lineHeight: 1.6 }}>
                {result.summary.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              {showJsonDiff && (
                <div style={{ marginTop: 10 }}>
                  <textarea
                    readOnly
                    rows={6}
                    value={JSON.stringify(result.config, null, 2)}
                    style={{
                      width: "100%",
                      fontFamily: "monospace",
                      fontSize: 11,
                      padding: "8px",
                      borderRadius: 6,
                      border: "1px solid #86efac",
                      background: "#ffffff",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer
          className="ai-modal-footer"
          style={{
            borderTop: "1px solid #ede9fe",
            padding: "14px 24px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <button className="secondary-button" type="button" onClick={onClose} disabled={loading}>
            Đóng
          </button>

          {!result ? (
            <button
              className="primary-button ai-submit-button"
              type="button"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              style={{
                background: "linear-gradient(135deg, #7c3aed, #50008b)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon name="sparkle" size={16} />
              {loading ? "Đang phân tích & tạo nội dung..." : "Tạo nội dung với AI"}
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

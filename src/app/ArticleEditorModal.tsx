import React, { useState } from "react";
import { ArticleData } from "./articlesService";
import { CKEditorField } from "./CKEditorField";

interface ArticleEditorModalProps {
  article: ArticleData | null;
  onClose: () => void;
  onSave: (article: ArticleData) => void;
}

const CATEGORIES = [
  "Âm ngữ trị liệu",
  "Hành vi ABA",
  "Điều hòa giác quan",
  "Can thiệp 1:1",
  "Tiền tiểu học",
  "Kỹ năng gia đình",
];

const PRESET_IMAGES = [
  { label: "Gia đình & Chuyên gia 1", url: "./images/family-1.jpg" },
  { label: "Can thiệp cá nhân 1:1", url: "./images/family-2.jpg" },
  { label: "Tiền tiểu học & Lớp học", url: "./images/family-3.jpg" },
  { label: "Phòng học sáng thoáng", url: "./images/classroom-main.jpg" },
  { label: "Góc đồ chơi & giáo cụ", url: "./images/classroom-detail.jpg" },
];

export function ArticleEditorModal({
  article,
  onClose,
  onSave,
}: ArticleEditorModalProps) {
  const isEditing = Boolean(article);

  const [title, setTitle] = useState(article?.title || "");
  const [category, setCategory] = useState(article?.category || CATEGORIES[0]);
  const [author, setAuthor] = useState(article?.author || "ThS. Hoàng Thị Hương");
  const [readTime, setReadTime] = useState(article?.readTime || "4 phút");
  const [summary, setSummary] = useState(article?.summary || "");
  const [image, setImage] = useState(article?.image || "./images/family-1.jpg");
  const [status, setStatus] = useState<"published" | "draft">(article?.status || "published");
  const [htmlContent, setHtmlContent] = useState(
    article?.htmlContent ||
      `
      <h2>1. Mở đầu vấn đề</h2>
      <p>Nhập nội dung chia sẻ chuyên môn dành cho phụ huynh tại đây...</p>
      <div class="article-callout-box">
        <strong>💡 Lời khuyên thực hành từ Chuyên gia:</strong>
        <ul>
          <li>Hướng dẫn phụ huynh tương tác cùng con mỗi ngày 15-20 phút.</li>
          <li>Quan sát và ghi nhận tiến bộ nhỏ nhất của con.</li>
        </ul>
      </div>
    `
  );

  const handleAutoCalcReadTime = () => {
    const textOnly = htmlContent.replace(/<[^>]*>/g, " ").trim();
    const words = textOnly ? textOnly.split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.ceil(words / 220));
    setReadTime(`${minutes} phút`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Vui lòng nhập tiêu đề bài viết!");
      return;
    }
    if (!summary.trim()) {
      alert("Vui lòng nhập tóm tắt bài viết!");
      return;
    }

    const payload: ArticleData = {
      id: article?.id || `art-${Date.now().toString(36)}`,
      title: title.trim(),
      category,
      author: author.trim() || "ThS. Hoàng Thị Hương",
      readTime: readTime.trim() || "4 phút",
      summary: summary.trim(),
      image: image.trim(),
      publishedDate: article?.publishedDate || new Date().toLocaleDateString("vi-VN"),
      status,
      htmlContent,
    };

    onSave(payload);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "1040px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.35)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "18px 26px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(90deg, #f8fafc 0%, #ffffff 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              📝
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
                {isEditing ? "Chỉnh sửa Bài viết & Cẩm nang" : "Thêm Bài viết Mới vào Cẩm nang Phụ huynh"}
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                Nội dung sẽ được cập nhật đồng bộ lên Website và hỗ trợ bài viết liên quan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              cursor: "pointer",
              fontSize: "16px",
              color: "#64748b",
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Form Scrollable Body */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Row 1: Tiêu đề bài viết */}
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
                Tiêu đề bài viết <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Phân biệt trẻ chậm nói đơn thuần và trẻ có dấu hiệu tự kỷ..."
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: "15px",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  outline: "none",
                  fontWeight: "600",
                  color: "#0f172a",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Row 2: Danh mục, Tác giả, Thời gian đọc, Trạng thái */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                  Chuyên mục
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "14px",
                    background: "#ffffff",
                    boxSizing: "border-box",
                  }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                  Tác giả / Ban chuyên môn
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="ThS. Hoàng Thị Hương"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "13.5px", fontWeight: "700", color: "#1e293b" }}>
                    Thời gian đọc
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoCalcReadTime}
                    style={{ background: "none", border: "none", color: "#2563eb", fontSize: "12px", cursor: "pointer", fontWeight: "600", padding: 0 }}
                  >
                    ⚡ Tính tự động
                  </button>
                </div>
                <input
                  type="text"
                  value={readTime}
                  onChange={(e) => setReadTime(e.target.value)}
                  placeholder="4 phút"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                  Trạng thái hiển thị
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "14px",
                    background: "#ffffff",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="published">🟢 Đã xuất bản (Hiện trên web)</option>
                  <option value="draft">🟡 Bản nháp (Lưu trữ nội bộ)</option>
                </select>
              </div>
            </div>

            {/* Row 3: Tóm tắt bài viết */}
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                Đoạn tóm tắt mở đầu (Excerpt / Lead Summary) <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                placeholder="Tóm tắt ngắn gọn 2-3 câu nêu bật giá trị then chốt của bài viết để thu hút phụ huynh..."
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Row 4: Ảnh đại diện bài viết */}
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                Ảnh đại diện bài viết
              </label>
              <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
                {/* Preview Image */}
                <div
                  style={{
                    width: "160px",
                    height: "100px",
                    borderRadius: "10px",
                    overflow: "hidden",
                    border: "1.5px solid #cbd5e1",
                    background: "#f1f5f9",
                    flexShrink: 0,
                  }}
                >
                  <img src={image} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>

                <div style={{ flex: 1, minWidth: "260px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="Đường dẫn ảnh (URL hoặc ./images/...)"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13.5px",
                      boxSizing: "border-box",
                    }}
                  />

                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <label
                      style={{
                        padding: "6px 14px",
                        background: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                        color: "#334155",
                      }}
                    >
                      📁 Tải ảnh từ máy tính
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                    </label>

                    <span style={{ fontSize: "12px", color: "#64748b" }}>Hoặc chọn mẫu:</span>
                    {PRESET_IMAGES.slice(0, 3).map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImage(p.url)}
                        style={{
                          padding: "4px 10px",
                          fontSize: "11.5px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          background: image === p.url ? "#eff6ff" : "#ffffff",
                          color: image === p.url ? "#2563eb" : "#475569",
                          cursor: "pointer",
                        }}
                      >
                        Mẫu {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 5: TÍCH HỢP CKEDITOR CHO NỘI DUNG CHI TIẾT */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                  Nội dung chi tiết bài viết (Biên tập với CKEditor 5) <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  💡 Hỗ trợ in đậm, tiêu đề, bảng biểu, danh sách, hộp lời khuyên cho ba mẹ
                </span>
              </div>

              {/* Tích hợp CKEditor */}
              <CKEditorField
                value={htmlContent}
                onChange={setHtmlContent}
                placeholder="Nhập nội dung bài viết chi tiết tại đây..."
                minHeight={380}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: "16px 28px",
              borderTop: "1px solid #e2e8f0",
              background: "#f8fafc",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              Tự động lưu bản sao vào bộ nhớ & đồng bộ ngay lập tức sang trang đích
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                style={{
                  padding: "10px 24px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  color: "#ffffff",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(37, 99, 255, 0.3)",
                }}
              >
                💾 {isEditing ? "Lưu thay đổi bài viết" : "Xuất bản bài viết"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

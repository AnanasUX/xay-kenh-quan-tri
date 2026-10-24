import React, { useState, useMemo } from "react";
import {
  ArticleData,
  getArticles,
  saveSingleArticle,
  deleteArticle,
  duplicateArticle,
} from "./articlesService";
import { ArticleEditorModal } from "./ArticleEditorModal";
import { useCms } from "./Layout";

const CATEGORIES = [
  "Tất cả",
  "Âm ngữ trị liệu",
  "Hành vi ABA",
  "Điều hòa giác quan",
  "Can thiệp 1:1",
  "Tiền tiểu học",
  "Kỹ năng gia đình",
];

export function ArticlesManagementPage() {
  const { notify } = useCms();
  const [articles, setArticles] = useState<ArticleData[]>(getArticles);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleData | null>(null);
  const [previewArticle, setPreviewArticle] = useState<ArticleData | null>(null);

  // Lọc bài viết
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const matchCat = selectedCategory === "Tất cả" || art.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        art.title.toLowerCase().includes(q) ||
        art.summary.toLowerCase().includes(q) ||
        art.author.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [articles, selectedCategory, searchQuery]);

  // Handler: Mở modal thêm mới
  const handleAddNew = () => {
    setEditingArticle(null);
    setIsEditorOpen(true);
  };

  // Handler: Mở modal chỉnh sửa
  const handleEdit = (art: ArticleData) => {
    setEditingArticle(art);
    setIsEditorOpen(true);
  };

  // Handler: Lưu bài viết
  const handleSaveArticle = (savedArt: ArticleData) => {
    const updated = saveSingleArticle(savedArt);
    setArticles(updated);
    setIsEditorOpen(false);
    notify(editingArticle ? "Đã cập nhật bài viết thành công!" : "Đã xuất bản bài viết mới!");
  };

  // Handler: Xóa bài viết
  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bài viết "${title}"?`)) {
      const updated = deleteArticle(id);
      setArticles(updated);
      notify("Đã xóa bài viết!");
    }
  };

  // Handler: Nhân bản bài viết
  const handleDuplicate = (id: string) => {
    const updated = duplicateArticle(id);
    setArticles(updated);
    notify("Đã nhân bản bài viết!");
  };

  return (
    <div style={{ padding: "28px 36px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <span style={{ fontSize: "28px" }}>📰</span>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>
              Quản lý Bài viết & Cẩm nang Phụ huynh
            </h1>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "700",
                color: "#2563eb",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                padding: "2px 10px",
                borderRadius: "999px",
              }}
            >
              CKEditor 5 Integrated
            </span>
          </div>
          <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
            Biên tập nội dung chuyên sâu về tự kỷ, âm ngữ trị liệu, can thiệp sớm và điều hòa giác quan
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <a
            href="https://ananasux.github.io/tre-tu-ky-responsive/#resources"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              background: "#ffffff",
              border: "1.5px solid #cbd5e1",
              color: "#334155",
              fontWeight: "600",
              fontSize: "14px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            🌐 Xem trên Website
          </a>

          <button
            type="button"
            onClick={handleAddNew}
            style={{
              padding: "10px 22px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              border: "none",
              color: "#ffffff",
              fontWeight: "700",
              fontSize: "14px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(37, 99, 255, 0.3)",
            }}
          >
            <span>+ Viết bài mới với CKEditor</span>
          </button>
        </div>
      </div>

      {/* Overview Statistics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "18px",
          marginBottom: "28px",
        }}
      >
        <div style={{ background: "#ffffff", padding: "18px 22px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", marginBottom: "6px" }}>
            Tổng số bài viết
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a" }}>
            {articles.length} <span style={{ fontSize: "14px", color: "#16a34a", fontWeight: "600" }}>bài</span>
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
            Đã đồng bộ sang Website Landing Page
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "18px 22px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", marginBottom: "6px" }}>
            Chuyên mục chuyên môn
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#2563eb" }}>
            6 <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "600" }}>chủ đề</span>
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
            Âm ngữ, ABA, Giác quan, IEP, Tiền tiểu học
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "18px 22px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", marginBottom: "6px" }}>
            Trình soạn thảo tích hợp
          </div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "#7c3aed" }}>
            CKEditor 5 Classic
          </div>
          <div style={{ fontSize: "12px", color: "#16a34a", marginTop: "4px", fontWeight: "600" }}>
            ✓ Hỗ trợ bảng, định dạng, hộp lời khuyên
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "18px 22px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", marginBottom: "6px" }}>
            Tính năng liên kết
          </div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "#059669" }}>
            Bài viết liên quan
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
            Tự động gợi ý 3 bài cùng chủ đề
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          background: "#ffffff",
          padding: "18px 22px",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          marginBottom: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Search Box */}
          <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
            <input
              type="text"
              placeholder="🔍 Tìm kiếm bài viết theo tiêu đề, tác giả, nội dung..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 16px",
                borderRadius: "10px",
                border: "1.5px solid #cbd5e1",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            )}
          </div>

          <span style={{ fontSize: "13px", color: "#64748b" }}>
            Hiển thị <strong>{filteredArticles.length}</strong> / {articles.length} bài viết
          </span>
        </div>

        {/* Category Chips */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: "600",
                border: selectedCategory === cat ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                background: selectedCategory === cat ? "#eff6ff" : "#ffffff",
                color: selectedCategory === cat ? "#1d4ed8" : "#475569",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid List */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "22px",
        }}
      >
        {filteredArticles.map((art) => (
          <div
            key={art.id}
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            {/* Thumbnail */}
            <div style={{ height: "160px", background: "#f1f5f9", position: "relative", overflow: "hidden" }}>
              <img
                src={art.image}
                alt={art.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <span
                style={{
                  position: "absolute",
                  top: "12px",
                  left: "12px",
                  background: "rgba(15, 23, 42, 0.8)",
                  backdropFilter: "blur(4px)",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "3px 10px",
                  borderRadius: "999px",
                }}
              >
                🏷️ {art.category}
              </span>
              <span
                style={{
                  position: "absolute",
                  bottom: "10px",
                  right: "12px",
                  background: "rgba(255, 255, 255, 0.95)",
                  color: "#334155",
                  fontSize: "11.5px",
                  fontWeight: "600",
                  padding: "2px 8px",
                  borderRadius: "6px",
                }}
              >
                ⏱️ {art.readTime}
              </span>
            </div>

            {/* Content Details */}
            <div style={{ padding: "18px", flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>
                ✍️ {art.author} • 📅 {art.publishedDate}
              </div>

              <h3
                style={{
                  fontSize: "16.5px",
                  fontWeight: "700",
                  color: "#0f172a",
                  lineHeight: "1.4",
                  margin: "0 0 8px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {art.title}
              </h3>

              <p
                style={{
                  fontSize: "13.5px",
                  color: "#64748b",
                  lineHeight: "1.55",
                  margin: "0 0 16px",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {art.summary}
              </p>

              {/* Action Buttons */}
              <div
                style={{
                  marginTop: "auto",
                  paddingTop: "14px",
                  borderTop: "1px solid #f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => handleEdit(art)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      fontSize: "12.5px",
                      fontWeight: "600",
                      color: "#1e293b",
                      cursor: "pointer",
                    }}
                  >
                    ✏️ Sửa (CKEditor)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewArticle(art)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#f8fafc",
                      fontSize: "12.5px",
                      fontWeight: "600",
                      color: "#475569",
                      cursor: "pointer",
                    }}
                  >
                    👁️ Xem thử
                  </button>
                </div>

                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(art.id)}
                    title="Nhân bản bài viết"
                    style={{
                      padding: "6px 8px",
                      borderRadius: "6px",
                      border: "none",
                      background: "#f1f5f9",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    📋
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(art.id, art.title)}
                    title="Xóa bài viết"
                    style={{
                      padding: "6px 8px",
                      borderRadius: "6px",
                      border: "none",
                      background: "#fee2e2",
                      color: "#dc2626",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal với CKEditor */}
      {isEditorOpen && (
        <ArticleEditorModal
          article={editingArticle}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSaveArticle}
        />
      )}

      {/* Preview Modal (Mô phỏng 100% giao diện Trang chi tiết bài viết phía Website) */}
      {previewArticle && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() => setPreviewArticle(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "880px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
              padding: "36px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <span
                style={{
                  fontSize: "12.5px",
                  fontWeight: "700",
                  color: "#166534",
                  background: "#dcfce7",
                  padding: "3px 12px",
                  borderRadius: "999px",
                }}
              >
                🏷️ {previewArticle.category} • ⏱️ {previewArticle.readTime}
              </span>
              <button
                type="button"
                onClick={() => setPreviewArticle(null)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                ✕
              </button>
            </div>

            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", marginBottom: "14px", lineHeight: "1.3" }}>
              {previewArticle.title}
            </h2>

            <div style={{ fontSize: "13.5px", color: "#64748b", marginBottom: "20px" }}>
              ✍️ Tác giả: <strong>{previewArticle.author}</strong> • 📅 Ngày đăng: {previewArticle.publishedDate}
            </div>

            {previewArticle.image && (
              <div style={{ borderRadius: "14px", overflow: "hidden", marginBottom: "24px", maxHeight: "380px" }}>
                <img src={previewArticle.image} alt={previewArticle.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}

            <div
              style={{
                background: "#f0fdf4",
                borderLeft: "4px solid #16a34a",
                padding: "16px 20px",
                borderRadius: "0 12px 12px 0",
                marginBottom: "24px",
                fontSize: "15px",
                color: "#166534",
                fontStyle: "italic",
              }}
            >
              {previewArticle.summary}
            </div>

            {/* Nội dung chi tiết */}
            <div
              className="article-rich-content"
              dangerouslySetInnerHTML={{ __html: previewArticle.htmlContent }}
              style={{ lineHeight: "1.85", fontSize: "16px", color: "#334155" }}
            />

            {/* Mục bài viết liên quan trong bản xem trước */}
            <div style={{ marginTop: "36px", paddingTop: "24px", borderTop: "1px dashed #cbd5e1" }}>
              <h4 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", marginBottom: "12px" }}>
                📚 Minh họa mục Bài viết liên quan (Related Articles) trên Website:
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                {articles
                  .filter((a) => a.id !== previewArticle.id)
                  .slice(0, 3)
                  .map((rel) => (
                    <div key={rel.id} style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: "11px", color: "#166534", fontWeight: "700" }}>{rel.category}</div>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a", margin: "4px 0" }}>{rel.title}</div>
                      <div style={{ fontSize: "11.5px", color: "#2563eb", fontWeight: "700" }}>Đọc bài viết →</div>
                    </div>
                  ))}
              </div>
            </div>

            <div style={{ marginTop: "28px", textAlign: "right" }}>
              <button
                type="button"
                onClick={() => setPreviewArticle(null)}
                style={{
                  padding: "8px 20px",
                  borderRadius: "8px",
                  background: "#0f172a",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Đóng bản xem trước
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

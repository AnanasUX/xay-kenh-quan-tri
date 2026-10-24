import React, { useEffect, useRef, useState } from "react";

interface CKEditorFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function CKEditorField({
  value,
  onChange,
  placeholder = "Nhập nội dung chi tiết bài viết tại đây...",
  minHeight = 360,
}: CKEditorFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<any>(null);
  const [editorMode, setEditorMode] = useState<"visual" | "html" | "preview">("visual");
  const [cdnLoaded, setCdnLoaded] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  // Tính số từ
  useEffect(() => {
    const textOnly = value.replace(/<[^>]*>/g, " ").trim();
    const words = textOnly ? textOnly.split(/\s+/).length : 0;
    setWordCount(words);
  }, [value]);

  // Nạp CKEditor 5 Classic từ CDN
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ((window as any).ClassicEditor) {
      setCdnLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.ckeditor.com/ckeditor5/43.0.0/classic/ckeditor.js";
    script.async = true;
    script.onload = () => {
      setCdnLoaded(true);
    };
    script.onerror = () => {
      console.warn("CKEditor 5 CDN load failed, using integrated visual WYSIWYG editor.");
      setCdnLoaded(false);
    };
    document.head.appendChild(script);
  }, []);

  // Khởi tạo CKEditor 5 khi có script CDN và đang ở chế độ visual
  useEffect(() => {
    if (!cdnLoaded || editorMode !== "visual" || !containerRef.current) return;
    const ClassicEditor = (window as any).ClassicEditor;
    if (!ClassicEditor) return;

    let isDestroyed = false;

    // Tạo textarea element tạm thời để gắn CKEditor
    const textarea = document.createElement("div");
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(textarea);

    ClassicEditor.create(textarea, {
      placeholder,
      toolbar: [
        "heading",
        "|",
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "|",
        "link",
        "bulletedList",
        "numberedList",
        "|",
        "outdent",
        "indent",
        "|",
        "blockQuote",
        "insertTable",
        "|",
        "undo",
        "redo",
      ],
      heading: {
        options: [
          { model: "paragraph", title: "Đoạn văn", class: "ck-heading_paragraph" },
          { model: "heading2", view: "h2", title: "Tiêu đề 2 (H2)", class: "ck-heading_heading2" },
          { model: "heading3", view: "h3", title: "Tiêu đề 3 (H3)", class: "ck-heading_heading3" },
        ],
      },
    })
      .then((editor: any) => {
        if (isDestroyed) {
          editor.destroy();
          return;
        }
        editorInstanceRef.current = editor;
        editor.setData(value || "");

        editor.model.document.on("change:data", () => {
          const data = editor.getData();
          onChange(data);
        });

        // Tùy biến độ cao tối thiểu của khung soạn thảo CKEditor
        const editingView = editor.ui.view.editable.element;
        if (editingView) {
          editingView.style.minHeight = `${minHeight}px`;
          editingView.style.fontSize = "15.5px";
          editingView.style.lineHeight = "1.8";
          editingView.style.padding = "18px 22px";
        }
      })
      .catch((err: any) => {
        console.warn("CKEditor init error:", err);
      });

    return () => {
      isDestroyed = true;
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy().catch(() => {});
        editorInstanceRef.current = null;
      }
    };
  }, [cdnLoaded, editorMode]);

  // Các lệnh định dạng cho bộ soạn thảo trực quan tích hợp (khi offline hoặc fallback)
  const execFormat = (command: string, valueArg: string | undefined = undefined) => {
    document.execCommand(command, false, valueArg);
    if (containerRef.current) {
      onChange(containerRef.current.innerHTML);
    }
  };

  const insertCalloutBox = () => {
    const calloutHtml = `
      <div class="article-callout-box" style="background:#f0fdf4; border:1.5px solid #86efac; border-radius:14px; padding:16px 20px; margin:18px 0;">
        <strong style="color:#166534; font-size:15px; display:block; margin-bottom:6px;">💡 Lời khuyên thực hành cho ba mẹ:</strong>
        <p style="margin:0; color:#14532d; font-size:14.5px;">Nhập hướng dẫn cụ thể từng bước tại đây...</p>
      </div><p></p>
    `;
    document.execCommand("insertHTML", false, calloutHtml);
    if (containerRef.current) {
      onChange(containerRef.current.innerHTML);
    }
  };

  const insertTable = () => {
    const tableHtml = `
      <table style="width:100%; border-collapse:collapse; margin:16px 0; border:1px solid #cbd5e1;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="border:1px solid #cbd5e1; padding:10px 14px; text-align:left;">Dấu hiệu cảnh báo</th>
            <th style="border:1px solid #cbd5e1; padding:10px 14px; text-align:left;">Trẻ phát triển bình thường</th>
            <th style="border:1px solid #cbd5e1; padding:10px 14px; text-align:left;">Trẻ có nguy cơ tự kỷ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #cbd5e1; padding:10px 14px;">Giao tiếp mắt</td>
            <td style="border:1px solid #cbd5e1; padding:10px 14px;">Nhìn mắt linh hoạt, tự nhiên</td>
            <td style="border:1px solid #cbd5e1; padding:10px 14px;">Né tránh ánh nhìn, nhìn vô hồn</td>
          </tr>
        </tbody>
      </table><p></p>
    `;
    document.execCommand("insertHTML", false, tableHtml);
    if (containerRef.current) {
      onChange(containerRef.current.innerHTML);
    }
  };

  return (
    <div
      className="ckeditor-wrapper"
      style={{
        border: "1.5px solid #cbd5e1",
        borderRadius: "14px",
        overflow: "hidden",
        background: "#ffffff",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
      }}
    >
      {/* CKEditor Branded Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          background: "linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              background: "#2563eb",
              color: "#ffffff",
              padding: "2px 8px",
              borderRadius: "6px",
              fontWeight: "800",
              fontSize: "12px",
              letterSpacing: "0.5px",
            }}
          >
            CKEditor 5
          </div>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>
            Trình soạn thảo Nội dung Chuyên nghiệp
          </span>
          <span
            style={{
              fontSize: "11px",
              color: cdnLoaded ? "#15803d" : "#b45309",
              background: cdnLoaded ? "#dcfce7" : "#fef3c7",
              padding: "2px 8px",
              borderRadius: "999px",
              fontWeight: "600",
            }}
          >
            {cdnLoaded ? "● Classic Build Active" : "● Fallback WYSIWYG Active"}
          </span>
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{ display: "flex", gap: "4px", background: "#e2e8f0", padding: "3px", borderRadius: "8px" }}>
          <button
            type="button"
            onClick={() => setEditorMode("visual")}
            style={{
              padding: "4px 12px",
              fontSize: "12px",
              fontWeight: "600",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              background: editorMode === "visual" ? "#ffffff" : "transparent",
              color: editorMode === "visual" ? "#1e293b" : "#64748b",
              boxShadow: editorMode === "visual" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            ✏️ Trực quan
          </button>
          <button
            type="button"
            onClick={() => setEditorMode("html")}
            style={{
              padding: "4px 12px",
              fontSize: "12px",
              fontWeight: "600",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              background: editorMode === "html" ? "#ffffff" : "transparent",
              color: editorMode === "html" ? "#1e293b" : "#64748b",
              boxShadow: editorMode === "html" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            💻 Mã HTML
          </button>
          <button
            type="button"
            onClick={() => setEditorMode("preview")}
            style={{
              padding: "4px 12px",
              fontSize: "12px",
              fontWeight: "600",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              background: editorMode === "preview" ? "#ffffff" : "transparent",
              color: editorMode === "preview" ? "#1e293b" : "#64748b",
              boxShadow: editorMode === "preview" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            👁️ Xem trước
          </button>
        </div>
      </div>

      {/* Integrated WYSIWYG Toolbar (Hiển thị khi chế độ visual và không dùng CKEditor CDN hoặc bổ trợ) */}
      {!cdnLoaded && editorMode === "visual" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "8px 12px",
            background: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => execFormat("formatBlock", "<h2>")}
            className="editor-btn"
            title="Tiêu đề 2 (H2)"
            style={{ padding: "4px 8px", fontSize: "12.5px", fontWeight: "700", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f8fafc", cursor: "pointer" }}
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => execFormat("formatBlock", "<h3>")}
            className="editor-btn"
            title="Tiêu đề 3 (H3)"
            style={{ padding: "4px 8px", fontSize: "12.5px", fontWeight: "700", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f8fafc", cursor: "pointer" }}
          >
            H3
          </button>
          <span style={{ width: "1px", height: "20px", background: "#e2e8f0", margin: "0 4px" }} />
          <button
            type="button"
            onClick={() => execFormat("bold")}
            className="editor-btn"
            title="In đậm (Ctrl+B)"
            style={{ padding: "4px 8px", fontSize: "13px", fontWeight: "700", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f8fafc", cursor: "pointer" }}
          >
            B
          </button>
          <button
            type="button"
            onClick={() => execFormat("italic")}
            className="editor-btn"
            title="In nghiêng (Ctrl+I)"
            style={{ padding: "4px 8px", fontSize: "13px", fontStyle: "italic", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f8fafc", cursor: "pointer" }}
          >
            I
          </button>
          <button
            type="button"
            onClick={() => execFormat("underline")}
            className="editor-btn"
            title="Gạch chân (Ctrl+U)"
            style={{ padding: "4px 8px", fontSize: "13px", textDecoration: "underline", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f8fafc", cursor: "pointer" }}
          >
            U
          </button>
          <span style={{ width: "1px", height: "20px", background: "#e2e8f0", margin: "0 4px" }} />
          <button
            type="button"
            onClick={() => execFormat("insertUnorderedList")}
            className="editor-btn"
            title="Danh sách dấu chấm"
            style={{ padding: "4px 8px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f8fafc", cursor: "pointer" }}
          >
            • Danh sách
          </button>
          <button
            type="button"
            onClick={() => execFormat("insertOrderedList")}
            className="editor-btn"
            title="Danh sách số"
            style={{ padding: "4px 8px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f8fafc", cursor: "pointer" }}
          >
            1. Số thứ tự
          </button>
          <span style={{ width: "1px", height: "20px", background: "#e2e8f0", margin: "0 4px" }} />
          <button
            type="button"
            onClick={insertCalloutBox}
            className="editor-btn"
            title="Chèn hộp lời khuyên cho phụ huynh"
            style={{ padding: "4px 10px", fontSize: "12.5px", fontWeight: "600", border: "1px solid #86efac", borderRadius: "6px", background: "#dcfce7", color: "#166534", cursor: "pointer" }}
          >
            💡 Hộp lời khuyên
          </button>
          <button
            type="button"
            onClick={insertTable}
            className="editor-btn"
            title="Chèn bảng so sánh"
            style={{ padding: "4px 10px", fontSize: "12.5px", fontWeight: "600", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f8fafc", cursor: "pointer" }}
          >
            📊 Bảng biểu
          </button>
        </div>
      )}

      {/* Editor Content Canvas */}
      {editorMode === "visual" && (
        <div style={{ position: "relative" }}>
          {cdnLoaded ? (
            <div ref={containerRef} style={{ minHeight: `${minHeight}px` }} />
          ) : (
            <div
              ref={containerRef}
              contentEditable
              onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
              dangerouslySetInnerHTML={{ __html: value }}
              style={{
                minHeight: `${minHeight}px`,
                padding: "20px 24px",
                outline: "none",
                fontSize: "16px",
                lineHeight: "1.85",
                color: "#1e293b",
                fontFamily: "inherit",
              }}
            />
          )}
        </div>
      )}

      {/* HTML Code Editor View */}
      {editorMode === "html" && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Nhập mã HTML tùy biến tại đây..."
          style={{
            width: "100%",
            minHeight: `${minHeight}px`,
            padding: "16px",
            border: "none",
            outline: "none",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: "13.5px",
            lineHeight: "1.6",
            background: "#0f172a",
            color: "#38bdf8",
            resize: "vertical",
            display: "block",
            boxSizing: "border-box",
          }}
        />
      )}

      {/* Live Preview Mode */}
      {editorMode === "preview" && (
        <div
          style={{
            minHeight: `${minHeight}px`,
            padding: "28px 32px",
            background: "#f8fafc",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              padding: "28px 32px",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px dashed #cbd5e1", fontSize: "13px", color: "#64748b" }}>
              👁️ Bản xem trước hiển thị trực tiếp trên giao diện Cẩm nang phụ huynh:
            </div>
            <div
              className="article-rich-content"
              dangerouslySetInnerHTML={{ __html: value || "<p style='color:#94a3b8; font-style:italic;'>Chưa có nội dung bài viết...</p>" }}
              style={{ lineHeight: "1.85", fontSize: "16px", color: "#334155" }}
            />
          </div>
        </div>
      )}

      {/* CKEditor Footer Status Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          background: "#f8fafc",
          borderTop: "1px solid #e2e8f0",
          fontSize: "12.5px",
          color: "#64748b",
        }}
      >
        <span>
          Độ dài bài viết: <strong>{wordCount}</strong> từ • <strong>{value.length}</strong> ký tự
        </span>
        <span>
          Khuyến nghị: <strong>600 - 1500 từ</strong> để tối ưu trải nghiệm đọc của phụ huynh & chuẩn SEO
        </span>
      </div>
    </div>
  );
}

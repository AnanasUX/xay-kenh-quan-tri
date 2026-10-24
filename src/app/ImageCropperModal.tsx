import { useState, useRef, useEffect, useCallback } from "react";
import { Icon } from "./ui";

export interface CropTargetSpec {
  name: string;
  targetWidth: number;
  targetHeight: number;
  aspectRatio: number;
  aspectRatioLabel: string;
  tip?: string;
}

export const CROP_SPECS = {
  logo: {
    name: "Logo Website",
    targetWidth: 512,
    targetHeight: 512,
    aspectRatio: 1,
    aspectRatioLabel: "1:1 (Vuông)",
    tip: "Khuyên dùng ảnh biểu tượng vuông, căn giữa, nền trong suốt PNG hoặc nền trắng.",
  },
  team: {
    name: "Ảnh Chân dung Giáo viên / Chuyên gia",
    targetWidth: 400,
    targetHeight: 400,
    aspectRatio: 1,
    aspectRatioLabel: "1:1 (Vuông)",
    tip: "Kéo để căn chỉnh khuôn mặt vào chính giữa khung hình, ảnh rõ nét và đủ ánh sáng.",
  },
  gallery: {
    name: "Hình ảnh Không gian & Cơ sở vật chất",
    targetWidth: 800,
    targetHeight: 600,
    aspectRatio: 4 / 3,
    aspectRatioLabel: "4:3 (Ngang)",
    tip: "Căn chỉnh để bao quát góc phòng học, đồ dùng can thiệp và không gian thân thiện.",
  },
  sectionMain: {
    name: "Hình ảnh Banner / Giới thiệu chính (Hero)",
    targetWidth: 1200,
    targetHeight: 900,
    aspectRatio: 4 / 3,
    aspectRatioLabel: "4:3 (Chuẩn khung Hero)",
    tip: "Khung hiển thị thực tế trên website có cấu trúc tỉ lệ 4:3 (1200 × 900 px hoặc 800 × 600 px). Bạn cũng có thể linh hoạt chọn tỉ lệ 16:9 hoặc dùng ảnh gốc để không bị cắt thông tin.",
  },
} as const;

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  origWidth: number;
  origHeight: number;
  spec: CropTargetSpec;
  onCropComplete: (croppedDataUrl: string) => void;
  onUseOriginal: () => void;
  onCancel: () => void;
}

export function ImageCropperModal({
  isOpen,
  imageSrc,
  origWidth,
  origHeight,
  spec,
  onCropComplete,
  onUseOriginal,
  onCancel,
}: ImageCropperModalProps) {
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [currentRatio, setCurrentRatio] = useState<number>(spec.aspectRatio);
  const [currentRatioLabel, setCurrentRatioLabel] = useState<string>(spec.aspectRatioLabel);

  useEffect(() => {
    setCurrentRatio(spec.aspectRatio);
    setCurrentRatioLabel(spec.aspectRatioLabel);
  }, [spec, isOpen]);

  const dragStartRef = useRef<{ mouseX: number; mouseY: number; panX: number; panY: number }>({
    mouseX: 0,
    mouseY: 0,
    panX: 0,
    panY: 0,
  });

  const imgRef = useRef<HTMLImageElement | null>(null);

  // Kích thước hiển thị của viewport khung cắt (px)
  const containerWidth = 460;
  const containerHeight = 320;

  // Tính toán kích thước crop box theo currentRatio
  let cropBoxW = 340;
  let cropBoxH = Math.round(cropBoxW / currentRatio);
  if (cropBoxH > containerHeight - 30) {
    cropBoxH = containerHeight - 30;
    cropBoxW = Math.round(cropBoxH * currentRatio);
  }

  // Tỉ lệ scale tối thiểu để ảnh phủ kín khung cắt
  const baseScale = Math.max(cropBoxW / origWidth, cropBoxH / origHeight);
  const currentScale = baseScale * zoom;

  // Reset zoom & pan khi mở ảnh mới
  useEffect(() => {
    if (isOpen) {
      setZoom(1.0);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  // Giới hạn vùng pan để ảnh không bị lộ viền trống
  const maxPanX = Math.max(0, (origWidth * currentScale - cropBoxW) / 2);
  const maxPanY = Math.max(0, (origHeight * currentScale - cropBoxH) / 2);

  const clampPan = useCallback(
    (newX: number, newY: number) => {
      return {
        x: Math.max(-maxPanX, Math.min(maxPanX, newX)),
        y: Math.max(-maxPanY, Math.min(maxPanY, newY)),
      };
    },
    [maxPanX, maxPanY]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;
    const nextPan = clampPan(dragStartRef.current.panX + dx, dragStartRef.current.panY + dy);
    setPan(nextPan);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        mouseX: e.touches[0].clientX,
        mouseY: e.touches[0].clientY,
        panX: pan.x,
        panY: pan.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.mouseX;
    const dy = e.touches[0].clientY - dragStartRef.current.mouseY;
    const nextPan = clampPan(dragStartRef.current.panX + dx, dragStartRef.current.panY + dy);
    setPan(nextPan);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Xuất ảnh đã cắt với kích thước chuẩn
  const handleExecuteCrop = () => {
    if (!imgRef.current) return;
    try {
      const canvas = document.createElement("canvas");
      let targetW = spec.targetWidth;
      let targetH = Math.round(targetW / currentRatio);
      if (Math.abs(currentRatio - 16 / 9) < 0.05) {
        targetW = 1200;
        targetH = 675;
      } else if (Math.abs(currentRatio - 4 / 3) < 0.05) {
        targetW = 1200;
        targetH = 900;
      } else if (Math.abs(currentRatio - 1) < 0.05) {
        targetW = 512;
        targetH = 512;
      }
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        onUseOriginal();
        return;
      }

      // Kích thước vùng crop lấy từ ảnh gốc
      const cropWInImage = cropBoxW / currentScale;
      const cropHInImage = cropBoxH / currentScale;

      // Tọa độ góc trên bên trái của vùng crop trên ảnh gốc
      const centerXInImage = origWidth / 2 - pan.x / currentScale;
      const centerYInImage = origHeight / 2 - pan.y / currentScale;

      const sx = Math.max(0, Math.min(origWidth - cropWInImage, centerXInImage - cropWInImage / 2));
      const sy = Math.max(0, Math.min(origHeight - cropHInImage, centerYInImage - cropHInImage / 2));

      // Bật chế độ làm nét chất lượng cao
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(
        imgRef.current,
        sx,
        sy,
        cropWInImage,
        cropHInImage,
        0,
        0,
        targetW,
        targetH
      );

      // Giữ nguyên định dạng PNG nếu người dùng tải ảnh PNG (để giữ độ sắc nét vector và nền trong suốt)
      const mime = imageSrc.startsWith("data:image/png") ? "image/png" : "image/jpeg";
      const croppedDataUrl = canvas.toDataURL(mime, 0.92);
      onCropComplete(croppedDataUrl);
    } catch (e) {
      console.error("Error cropping image:", e);
      onUseOriginal();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="account-modal-backdrop" onClick={onCancel}>
      <div
        className="account-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "600px", borderRadius: "16px", overflow: "hidden" }}
      >
        <header className="account-modal-header" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <div className="modal-title-with-icon">
            <span className="modal-badge-icon" style={{ background: "#f3e8ff", color: "#50008b" }}>
              <Icon name="edit" size={18} />
            </span>
            <div>
              <h3>Cắt & Căn chỉnh Kích thước Ảnh</h3>
              <p>{spec.name} · Khung chuẩn {spec.targetWidth} × {spec.targetHeight} px</p>
            </div>
          </div>
          <button className="icon-button" type="button" onClick={onCancel}>
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="account-modal-body" style={{ padding: "16px 20px", gap: "12px" }}>
          {/* Dimension Specifications Banner */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "10px 14px",
              fontSize: "12px",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <span style={{ color: "#64748b" }}>Ảnh tải lên: </span>
              <strong style={{ color: "#0f172a" }}>
                {origWidth} × {origHeight} px
              </strong>
            </div>
            <div>
              <span style={{ color: "#64748b" }}>Khung cắt đang chọn: </span>
              <strong style={{ color: "#50008b" }}>
                {currentRatioLabel}
              </strong>
            </div>
          </div>

          {/* Quick Aspect Ratio Switcher */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              background: "#ffffff",
              padding: "4px 0",
            }}
          >
            <span style={{ fontSize: "12px", color: "#475569", fontWeight: "600" }}>
              📐 Chọn tỉ lệ cắt:
            </span>
            <button
              type="button"
              onClick={() => {
                setCurrentRatio(4 / 3);
                setCurrentRatioLabel("4:3 (Chuẩn khung Hero 1200×900)");
              }}
              style={{
                fontSize: "11.5px",
                padding: "4px 10px",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: Math.abs(currentRatio - 4 / 3) < 0.05 ? "#50008b" : "#cbd5e1",
                background: Math.abs(currentRatio - 4 / 3) < 0.05 ? "#f3e8ff" : "#f8fafc",
                color: Math.abs(currentRatio - 4 / 3) < 0.05 ? "#50008b" : "#334155",
                fontWeight: Math.abs(currentRatio - 4 / 3) < 0.05 ? "700" : "500",
                cursor: "pointer",
              }}
            >
              4:3 (Chuẩn khung Hero 1200×900)
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentRatio(16 / 9);
                setCurrentRatioLabel("16:9 (Toàn cảnh 1200×675)");
              }}
              style={{
                fontSize: "11.5px",
                padding: "4px 10px",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: Math.abs(currentRatio - 16 / 9) < 0.05 ? "#50008b" : "#cbd5e1",
                background: Math.abs(currentRatio - 16 / 9) < 0.05 ? "#f3e8ff" : "#f8fafc",
                color: Math.abs(currentRatio - 16 / 9) < 0.05 ? "#50008b" : "#334155",
                fontWeight: Math.abs(currentRatio - 16 / 9) < 0.05 ? "700" : "500",
                cursor: "pointer",
              }}
            >
              16:9 (Toàn cảnh 1200×675)
            </button>
            {spec.aspectRatio === 1 && (
              <button
                type="button"
                onClick={() => {
                  setCurrentRatio(1);
                  setCurrentRatioLabel("1:1 (Vuông 512×512)");
                }}
                style={{
                  fontSize: "11.5px",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  border: "1px solid",
                  borderColor: Math.abs(currentRatio - 1) < 0.05 ? "#50008b" : "#cbd5e1",
                  background: Math.abs(currentRatio - 1) < 0.05 ? "#f3e8ff" : "#f8fafc",
                  color: Math.abs(currentRatio - 1) < 0.05 ? "#50008b" : "#334155",
                  fontWeight: Math.abs(currentRatio - 1) < 0.05 ? "700" : "500",
                  cursor: "pointer",
                }}
              >
                1:1 (Vuông 512×512)
              </button>
            )}
          </div>

          {/* Interactive Crop Viewport */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: `${containerHeight}px`,
              background: "#0f172a",
              borderRadius: "12px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isDragging ? "grabbing" : "grab",
              userSelect: "none",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* The Image being panned/zoomed */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Ảnh cần cắt"
              draggable={false}
              style={{
                position: "absolute",
                width: `${origWidth * currentScale}px`,
                height: `${origHeight * currentScale}px`,
                transform: `translate(${pan.x}px, ${pan.y}px)`,
                pointerEvents: "none",
                maxWidth: "none",
                maxHeight: "none",
                transition: isDragging ? "none" : "transform 0.05s ease",
              }}
            />

            {/* Dark Mask Outside the Crop Box */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0, 0, 0, 0.55)",
                pointerEvents: "none",
              }}
            />

            {/* Clear Crop Box Window */}
            <div
              style={{
                position: "relative",
                width: `${cropBoxW}px`,
                height: `${cropBoxH}px`,
                border: "2px solid #ffffff",
                boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.65), 0 0 20px rgba(0,0,0,0.6)",
                pointerEvents: "none",
                boxSizing: "border-box",
                borderRadius: spec.aspectRatio === 1 ? "8px" : "6px",
              }}
            >
              {/* Rule of Thirds Grid Lines */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gridTemplateRows: "1fr 1fr 1fr",
                }}
              >
                <div style={{ borderRight: "1px dashed rgba(255,255,255,0.4)", borderBottom: "1px dashed rgba(255,255,255,0.4)" }} />
                <div style={{ borderRight: "1px dashed rgba(255,255,255,0.4)", borderBottom: "1px dashed rgba(255,255,255,0.4)" }} />
                <div style={{ borderBottom: "1px dashed rgba(255,255,255,0.4)" }} />
                <div style={{ borderRight: "1px dashed rgba(255,255,255,0.4)", borderBottom: "1px dashed rgba(255,255,255,0.4)" }} />
                <div style={{ borderRight: "1px dashed rgba(255,255,255,0.4)", borderBottom: "1px dashed rgba(255,255,255,0.4)" }} />
                <div style={{ borderBottom: "1px dashed rgba(255,255,255,0.4)" }} />
              </div>

              {/* Dimension Tag on Top of Crop Box */}
              <div
                style={{
                  position: "absolute",
                  bottom: "-24px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#50008b",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  whiteSpace: "nowrap",
                }}
              >
                Khung cắt chuẩn: {spec.targetWidth} × {spec.targetHeight} px
              </div>
            </div>
          </div>

          {/* Zoom Control Slider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "8px 14px",
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569", whiteSpace: "nowrap" }}>
              🔍 Thu phóng (Zoom):
            </span>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.05"
              value={zoom}
              onChange={(e) => {
                const newZoom = parseFloat(e.target.value);
                setZoom(newZoom);
              }}
              style={{ flex: 1, accentColor: "#50008b", cursor: "pointer" }}
            />
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#50008b", minWidth: "38px", textAlign: "right" }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              className="secondary-btn-sm"
              onClick={() => {
                setZoom(1.0);
                setPan({ x: 0, y: 0 });
              }}
              style={{ padding: "4px 8px", fontSize: "11px" }}
            >
              Mặc định
            </button>
          </div>

          {/* Helpful Tips */}
          {spec.tip && (
            <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
              💡 <strong>Gợi ý:</strong> {spec.tip}
            </div>
          )}
        </div>

        <footer className="account-modal-footer" style={{ borderTop: "1px solid #f1f5f9" }}>
          <button className="secondary-button" type="button" onClick={onCancel}>
            Hủy
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={onUseOriginal}
            title="Sử dụng ảnh gốc nguyên bản mà không áp dụng cắt"
          >
            Dùng ảnh gốc (Không cắt)
          </button>
          <button className="primary-button" type="button" onClick={handleExecuteCrop}>
            <Icon name="check" size={16} />
            Cắt & Sử dụng ({spec.targetWidth}×{spec.targetHeight} px)
          </button>
        </footer>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, useMemo } from "react";
import { useCms } from "./Layout";
import { Icon, PageHeading } from "./ui";

export interface HeatmapEvent {
  id: string;
  type: "click" | "tap" | "rage_click" | "dead_click" | "scroll_milestone";
  timestamp: number;
  sessionId: string;
  pageUrl: string;
  deviceType: "desktop" | "tablet" | "mobile";
  viewportWidth: number;
  viewportHeight: number;
  documentHeight: number;
  xNorm: number;
  yNorm: number;
  docX: number;
  docY: number;
  elementId?: string;
  elementType?: string;
  elementText?: string;
  scrollDepth?: number;
}

export interface HeatmapStore {
  events: HeatmapEvent[];
  summary: {
    totalClicks: number;
    totalTaps: number;
    totalRageClicks: number;
    totalDeadClicks: number;
    totalSessions: number;
    scrollStats: {
      "25": number;
      "50": number;
      "75": number;
      "100": number;
    };
    elementRanking?: Record<string, number>;
  };
}

const KVDB_HEATMAP_URL = "https://kvdb.io/RtALwN4JAnjEQUjqKLgAuk/heatmap_data";

export function HeatmapPage() {
  const { notify } = useCms();
  const [store, setStore] = useState<HeatmapStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceFilter, setDeviceFilter] = useState<"all" | "mobile" | "desktop" | "tablet">("all");
  const [viewMode, setViewMode] = useState<"density" | "scroll" | "friction">("density");
  const [previewViewport, setPreviewViewport] = useState<"mobile" | "desktop">("mobile");
  const [intensity, setIntensity] = useState<number>(0.75);
  const [spotRadius, setSpotRadius] = useState<number>(32);
  const [searchTerm, setSearchTerm] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 1. Fetch Heatmap Data from KVDB
  const fetchHeatmapData = async () => {
    setLoading(true);
    try {
      const res = await fetch(KVDB_HEATMAP_URL, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.events)) {
          setStore(data);
        }
      }
    } catch (err) {
      console.warn("Could not load heatmap data:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Real-time Listeners
  useEffect(() => {
    fetchHeatmapData();

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("heatmap-events-sync");
      channel.onmessage = (event) => {
        if (event.data?.type === "new_heatmap_events") {
          notify(`Đã nhận ${event.data.events?.length || 1} điểm chạm tương tác người dùng mới`);
          fetchHeatmapData();
        }
      };
    } catch {}

    return () => {
      channel?.close();
    };
  }, []);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (!store?.events) return [];
    return store.events.filter((ev) => {
      if (deviceFilter !== "all" && ev.deviceType !== deviceFilter) return false;
      return true;
    });
  }, [store, deviceFilter]);

  // Click & Tap Events for Canvas
  const clickTapEvents = useMemo(() => {
    return filteredEvents.filter((ev) => ev.type === "click" || ev.type === "tap" || ev.type === "rage_click" || ev.type === "dead_click");
  }, [filteredEvents]);

  // Rage & Dead Clicks
  const frictionEvents = useMemo(() => {
    return filteredEvents.filter((ev) => ev.type === "rage_click" || ev.type === "dead_click");
  }, [filteredEvents]);

  // Scroll Stats calculations
  const scrollStats = useMemo(() => {
    const stats = store?.summary?.scrollStats || { "25": 0, "50": 0, "75": 0, "100": 0 };
    const totalSessions = Math.max(store?.summary?.totalSessions || 1, 1);
    return {
      "25": { count: stats["25"] || 0, pct: Math.min(100, Math.round(((stats["25"] || 0) / totalSessions) * 100)) },
      "50": { count: stats["50"] || 0, pct: Math.min(100, Math.round(((stats["50"] || 0) / totalSessions) * 100)) },
      "75": { count: stats["75"] || 0, pct: Math.min(100, Math.round(((stats["75"] || 0) / totalSessions) * 100)) },
      "100": { count: stats["100"] || 0, pct: Math.min(100, Math.round(((stats["100"] || 0) / totalSessions) * 100)) },
    };
  }, [store]);

  // Element Ranking Table
  const elementRankingList = useMemo(() => {
    const counts: Record<string, { count: number; name: string; type: string; rage: number; dead: number }> = {};
    const friendlyNames: Record<string, string> = {
      "cta-float-phone": "Nút nổi: Hotline Gọi ngay (Góc phải dưới)",
      "cta-float-zalo": "Nút nổi: Zalo Chat tư vấn (Góc phải dưới)",
      "cta-float-facebook": "Nút nổi: Facebook Messenger (Góc phải dưới)",
      "btn-back-to-top": "Nút cuộn lên đầu trang (Back to top)",
      "cta-hero-consult": "Nút Hero: Đăng ký tư vấn miễn phí",
      "cta-hero-process": "Nút Hero: Xem lộ trình 4 bước",
      "cta-header-consult": "Nút Header: Tư vấn ngay",
      "cta-nav-consult": "Nút Mobile Nav: Tư vấn ngay",
      "form-submit-consult": "Biểu mẫu: Gửi đăng ký tư vấn",
      "field-phone": "Ô nhập số điện thoại phụ huynh",
      "field-name": "Ô nhập họ và tên phụ huynh",
      "field-message": "Ô chia sẻ biểu hiện của con",
    };

    filteredEvents.forEach((ev) => {
      const elId = ev.elementId || ev.elementType || "khác";
      if (!counts[elId]) {
        counts[elId] = {
          count: 0,
          name: friendlyNames[elId] || (ev.elementText ? `"${ev.elementText.substring(0, 30)}"` : elId),
          type: ev.elementType || "button",
          rage: 0,
          dead: 0,
        };
      }
      counts[elId].count += 1;
      if (ev.type === "rage_click") counts[elId].rage += 1;
      if (ev.type === "dead_click") counts[elId].dead += 1;
    });

    return Object.entries(counts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [filteredEvents]);

  // 3. Render Canvas Heatmap Overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (viewMode === "scroll") {
      // Draw scroll depth bands
      const bands = [
        { depth: 0.25, pct: scrollStats["25"].pct, label: "25% Trang (Khu vực Giới thiệu)" },
        { depth: 0.5, pct: scrollStats["50"].pct, label: "50% Trang (Lĩnh vực can thiệp & Quy trình)" },
        { depth: 0.75, pct: scrollStats["75"].pct, label: "75% Trang (Đội ngũ & Không gian)" },
        { depth: 1.0, pct: scrollStats["100"].pct, label: "100% Trang (Biểu mẫu & Chân trang)" },
      ];

      bands.forEach((b) => {
        const y = b.depth * height;
        // Horizontal line
        ctx.strokeStyle = b.pct > 60 ? "rgba(45, 153, 53, 0.85)" : b.pct > 40 ? "rgba(234, 153, 34, 0.85)" : "rgba(224, 49, 49, 0.85)";
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        // Label box
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(17, 24, 39, 0.85)";
        ctx.roundRect(14, y - 28, 260, 24, 6);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px system-ui, sans-serif";
        ctx.fillText(`${b.pct}% phụ huynh cuộn tới: ${b.label}`, 22, y - 12);
      });
      return;
    }

    if (viewMode === "friction") {
      // Draw rage clicks and dead clicks specifically
      frictionEvents.forEach((ev) => {
        const x = Math.min(Math.max(ev.xNorm * width, 16), width - 16);
        const y = Math.min(Math.max(ev.yNorm * height, 16), height - 16);

        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fillStyle = ev.type === "rage_click" ? "rgba(239, 68, 68, 0.5)" : "rgba(245, 158, 11, 0.5)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = ev.type === "rage_click" ? "#dc2626" : "#d97706";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      return;
    }

    // Default: Density Heatmap (Radial Blends)
    ctx.globalAlpha = intensity;
    clickTapEvents.forEach((ev) => {
      const x = Math.min(Math.max(ev.xNorm * width, 10), width - 10);
      const y = Math.min(Math.max(ev.yNorm * height, 10), height - 10);

      const radGrad = ctx.createRadialGradient(x, y, 2, x, y, spotRadius);
      radGrad.addColorStop(0, "rgba(255, 0, 50, 1)");
      radGrad.addColorStop(0.25, "rgba(255, 110, 0, 0.85)");
      radGrad.addColorStop(0.55, "rgba(255, 230, 0, 0.6)");
      radGrad.addColorStop(0.8, "rgba(0, 220, 120, 0.35)");
      radGrad.addColorStop(1, "rgba(0, 120, 255, 0)");

      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(x, y, spotRadius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  }, [clickTapEvents, frictionEvents, viewMode, intensity, spotRadius, scrollStats]);

  // Reset/Clear Data
  const handleResetData = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn đặt lại dữ liệu bản đồ nhiệt? Thao tác này sẽ làm mới toàn bộ số lượt chạm.")) return;
    try {
      const freshStore: HeatmapStore = {
        events: [],
        summary: {
          totalClicks: 0,
          totalTaps: 0,
          totalRageClicks: 0,
          totalDeadClicks: 0,
          totalSessions: 0,
          scrollStats: { "25": 0, "50": 0, "75": 0, "100": 0 },
          elementRanking: {},
        },
      };
      await fetch(KVDB_HEATMAP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(freshStore),
      });
      setStore(freshStore);
      notify("Đã đặt lại dữ liệu bản đồ nhiệt thành công!");
    } catch {
      notify("Không thể đặt lại dữ liệu, vui lòng kiểm tra kết nối mạng.");
    }
  };

  const totalInteractions = (store?.summary?.totalClicks || 0) + (store?.summary?.totalTaps || 0);

  return (
    <div className="page-content" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeading
        eyebrow="Tương tác & Trải nghiệm Phụ huynh"
        title="Bản đồ nhiệt & Hành vi điểm chạm (UX Heatmap)"
        description="Phân tích trực quan hành vi chạm ngón cái trên di động, điểm nhấp chuột, độ sâu cuộn trang và phát hiện điểm nghẽn (Rage/Dead Clicks) để tối ưu hóa tỷ lệ chuyển đổi tư vấn."
        action={
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button className="button-secondary" onClick={fetchHeatmapData} disabled={loading} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Icon name="refresh" size={16} />
              {loading ? "Đang đồng bộ..." : "Làm mới"}
            </button>
            <button className="button-secondary" onClick={handleResetData} style={{ color: "#dc2626", borderColor: "rgba(220, 38, 38, 0.3)" }}>
              Đặt lại dữ liệu
            </button>
          </div>
        }
      />

      {/* METRIC CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "16px" }}>
        <div style={{ background: "var(--card)", padding: "18px 20px", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "6px" }}>Tổng lượt tương tác (Clicks & Taps)</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "var(--primary-default)" }}>
            {totalInteractions.toLocaleString()}
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
            📱 {store?.summary?.totalTaps || 0} Chạm di động · 💻 {store?.summary?.totalClicks || 0} Nhấp chuột
          </div>
        </div>

        <div style={{ background: "var(--card)", padding: "18px 20px", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "6px" }}>Phiên phụ huynh truy cập (Sessions)</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#0068ff" }}>
            {(store?.summary?.totalSessions || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
            Theo dõi phiên ẩn danh tuân thủ bảo mật
          </div>
        </div>

        <div style={{ background: "var(--card)", padding: "18px 20px", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "6px" }}>Tỷ lệ cuộn qua 50% trang</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#10b981" }}>
            {scrollStats["50"].pct}%
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
            {scrollStats["100"].pct}% đọc trọn vẹn đến biểu mẫu cuối
          </div>
        </div>

        <div style={{ background: "var(--card)", padding: "18px 20px", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "6px" }}>Điểm nghẽn (Rage & Dead clicks)</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: (store?.summary?.totalRageClicks || 0) > 0 ? "#ef4444" : "#10b981" }}>
            {(store?.summary?.totalRageClicks || 0) + (store?.summary?.totalDeadClicks || 0)}
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
            {(store?.summary?.totalRageClicks || 0) > 0 ? `⚠️ ${store?.summary?.totalRageClicks} Nhấp dồn dập (Rage)` : "✓ Trải nghiệm mượt mà, không kẹt"}
          </div>
        </div>
      </div>

      {/* HEATMAP VISUALIZER CONTAINER */}
      <div style={{ background: "var(--card)", borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Controls Toolbar */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "14px", background: "rgba(0,0,0,0.01)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", marginRight: "4px" }}>Chế độ xem:</span>
            <button
              onClick={() => setViewMode("density")}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: viewMode === "density" ? "var(--primary-default)" : "var(--border)",
                background: viewMode === "density" ? "var(--primary-surface)" : "transparent",
                color: viewMode === "density" ? "var(--primary-default)" : "var(--foreground)",
                fontWeight: viewMode === "density" ? "600" : "400",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              🔥 Mật độ chạm (Heatmap)
            </button>
            <button
              onClick={() => setViewMode("scroll")}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: viewMode === "scroll" ? "var(--primary-default)" : "var(--border)",
                background: viewMode === "scroll" ? "var(--primary-surface)" : "transparent",
                color: viewMode === "scroll" ? "var(--primary-default)" : "var(--foreground)",
                fontWeight: viewMode === "scroll" ? "600" : "400",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              📜 Độ sâu cuộn (Scroll Depth)
            </button>
            <button
              onClick={() => setViewMode("friction")}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: viewMode === "friction" ? "#ef4444" : "var(--border)",
                background: viewMode === "friction" ? "rgba(239, 68, 68, 0.08)" : "transparent",
                color: viewMode === "friction" ? "#ef4444" : "var(--foreground)",
                fontWeight: viewMode === "friction" ? "600" : "400",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              ⚠️ Điểm nghẽn (Friction & Rage)
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
              <span>Khung hình:</span>
              <button
                onClick={() => setPreviewViewport("mobile")}
                style={{
                  padding: "5px 10px",
                  borderRadius: "6px",
                  border: "1px solid",
                  borderColor: previewViewport === "mobile" ? "var(--primary-default)" : "var(--border)",
                  background: previewViewport === "mobile" ? "var(--primary-surface)" : "transparent",
                  color: previewViewport === "mobile" ? "var(--primary-default)" : "inherit",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                📱 Mobile (Vùng ngón cái)
              </button>
              <button
                onClick={() => setPreviewViewport("desktop")}
                style={{
                  padding: "5px 10px",
                  borderRadius: "6px",
                  border: "1px solid",
                  borderColor: previewViewport === "desktop" ? "var(--primary-default)" : "var(--border)",
                  background: previewViewport === "desktop" ? "var(--primary-surface)" : "transparent",
                  color: previewViewport === "desktop" ? "var(--primary-default)" : "inherit",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                💻 Máy tính
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
              <span>Độ đậm:</span>
              <input
                type="range"
                min="0.3"
                max="1.0"
                step="0.05"
                value={intensity}
                onChange={(e) => setIntensity(parseFloat(e.target.value))}
                style={{ width: "80px", cursor: "pointer" }}
              />
            </div>
          </div>
        </div>

        {/* Canvas & Web Preview Container */}
        <div style={{ padding: "24px", background: "var(--background)", display: "flex", justifyContent: "center", minHeight: "680px", overflow: "auto" }}>
          <div
            style={{
              position: "relative",
              width: previewViewport === "mobile" ? "414px" : "100%",
              maxWidth: previewViewport === "mobile" ? "414px" : "1100px",
              height: "780px",
              border: previewViewport === "mobile" ? "12px solid #1f2937" : "1px solid var(--border)",
              borderRadius: previewViewport === "mobile" ? "36px" : "12px",
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
              background: "#ffffff",
            }}
          >
            {/* Mobile Notch / Speaker Bar */}
            {previewViewport === "mobile" && (
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "120px",
                  height: "18px",
                  background: "#1f2937",
                  borderBottomLeftRadius: "12px",
                  borderBottomRightRadius: "12px",
                  zIndex: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ width: "40px", height: "4px", background: "#374151", borderRadius: "2px" }} />
              </div>
            )}

            {/* Embedded Live Website Iframe */}
            <iframe
              src="https://ananasux.github.io/tre-tu-ky-responsive/"
              title="Landing Page Preview"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                display: "block",
                pointerEvents: "auto",
              }}
            />

            {/* Heatmap Overlay Canvas */}
            <canvas
              ref={canvasRef}
              width={previewViewport === "mobile" ? 414 : 1100}
              height={780}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 20,
              }}
            />

            {/* Ergonomic Thumb Zone Indicator Guide (Mobile Mode) */}
            {previewViewport === "mobile" && (
              <div
                style={{
                  position: "absolute",
                  bottom: "16px",
                  right: "12px",
                  width: "140px",
                  height: "220px",
                  borderRadius: "70px 20px 20px 70px",
                  border: "2px dashed rgba(80, 0, 139, 0.4)",
                  background: "rgba(80, 0, 139, 0.05)",
                  pointerEvents: "none",
                  zIndex: 25,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  padding: "8px",
                  boxSizing: "border-box",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    color: "var(--primary-default)",
                    textAlign: "center",
                    lineHeight: "1.2",
                    background: "rgba(255,255,255,0.9)",
                    padding: "3px 6px",
                    borderRadius: "4px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  👍 Vùng ngón cái tự nhiên (Thumb Zone)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DETAILED INTERACTION RANKING TABLE */}
      <div style={{ background: "var(--card)", borderRadius: "16px", border: "1px solid var(--border)", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Bảng xếp hạng điểm chạm & Tỷ lệ tương tác</h3>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--muted)" }}>
              Chi tiết các nút bấm, biểu mẫu và liên kết phụ huynh quan tâm nhất.
            </p>
          </div>
          <input
            type="text"
            placeholder="Tìm theo tên nút hoặc id..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "7px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              fontSize: "13px",
              background: "var(--background)",
              minWidth: "220px",
            }}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left", color: "var(--muted)" }}>
                <th style={{ padding: "10px 12px" }}>#</th>
                <th style={{ padding: "10px 12px" }}>Tên nút / Điểm chạm</th>
                <th style={{ padding: "10px 12px" }}>ID phần tử</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>Số lượt chạm</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>Tỷ trọng</th>
                <th style={{ padding: "10px 12px" }}>Đánh giá công thái học (Ergonomics)</th>
                <th style={{ padding: "10px 12px" }}>Tình trạng</th>
              </tr>
            </thead>
            <tbody>
              {elementRankingList
                .filter((el) => el.name.toLowerCase().includes(searchTerm.toLowerCase()) || el.id.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((el, idx) => {
                  const sharePct = totalInteractions > 0 ? Math.round((el.count / totalInteractions) * 100) : 0;
                  const isFloating = el.id.includes("cta-float");
                  return (
                    <tr key={el.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.2s" }}>
                      <td style={{ padding: "12px", fontWeight: "600", color: "var(--muted)" }}>{idx + 1}</td>
                      <td style={{ padding: "12px" }}>
                        <strong style={{ color: "var(--foreground)" }}>{el.name}</strong>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <code style={{ background: "rgba(0,0,0,0.05)", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}>
                          {el.id}
                        </code>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: "700" }}>{el.count}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                          <span>{sharePct}%</span>
                          <div style={{ width: "50px", height: "6px", background: "var(--border)", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${sharePct}%`, height: "100%", background: "var(--primary-default)" }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        {isFloating ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#10b981", fontWeight: "600" }}>
                            ✓ Vùng ngón cái tối ưu (Góc phải dưới)
                          </span>
                        ) : el.id.includes("hero") ? (
                          <span style={{ color: "#3b82f6" }}>Vị trí mắt nhìn đầu tiên (Above-the-fold)</span>
                        ) : (
                          <span style={{ color: "var(--muted)" }}>Theo dòng đọc tự nhiên</span>
                        )}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {el.rage > 0 ? (
                          <span style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "600" }}>
                            ⚠️ {el.rage} Rage click
                          </span>
                        ) : (
                          <span style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "600" }}>
                            Tốt
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              {elementRankingList.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "var(--muted)" }}>
                    Chưa có sự kiện tương tác nào được ghi nhận. Hãy mở trang Landing Page và thử nhấp vào các nút!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

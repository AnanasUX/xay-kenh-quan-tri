import { DEFAULT_AUTISM_SCENARIOS, analyzeUserQuestionAndRespond, type AutismScenario } from "./autismKnowledgeBase";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useCms } from "./Layout";
import { Icon, PageHeading } from "./ui";
import { logAuditAction } from "./auditService";

export interface ChatMessage {
  id: string;
  sender: "customer" | "admin" | "ai";
  senderName: string;
  text: string;
  timestamp: string;
}

export interface LiveChatSession {
  id: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  status: "online" | "waiting" | "replied" | "closed";
  unreadAdminCount?: number;
  unreadCustomerCount?: number;
}

export interface LiveChatSettings {
  aiEnabled: boolean;
  aiDelaySeconds: number;
  aiPersonaName: string;
  autoGreeting: string;
  updatedAt?: string;
}

const CHAT_SESSIONS_URL = "https://kvdb.io/RtALwN4JAnjEQUjqKLgAuk/live_chat_sessions";
const CHAT_SETTINGS_URL = "https://kvdb.io/RtALwN4JAnjEQUjqKLgAuk/live_chat_settings";
const ADMIN_PRESENCE_URL = "https://kvdb.io/RtALwN4JAnjEQUjqKLgAuk/live_chat_presence";
const SETTINGS_STORAGE_KEY = "aurora_live_chat_settings_admin";

const CANNED_RESPONSES = [
  "🗣️ Chậm nói: Giai đoạn 18-36 tháng là giai đoạn vàng kích hoạt ngôn ngữ 1:1, các cô dùng trò chơi tương tác để con bật âm tự nhiên ạ.",
  "👀 Tương tác mắt: Con giảm tương tác mắt cần can thiệp kỹ thuật ngang tầm mắt ABA/TEACCH để xây dựng chú ý chung.",
  "👣 Nhón chân & vẫy tay: Hành vi định hình là phản xạ tìm kiếm cảm giác, trung tâm áp dụng phòng OT/SI thảm gai xích đu để điều hòa.",
  "⚡ Cơn ăn vạ: Khi con chưa đủ lời nói sẽ bất lực la hét, các cô áp dụng ABA dạy con kỹ năng giao tiếp thay thế (PECS).",
  "🔁 Nhại lời: Nhại lời chứng minh con có âm, các cô sẽ dùng giáo cụ trực quan chuyển đổi nhại lời sang câu nói có nghĩa.",
  "📅 Lịch đánh giá: Buổi đánh giá phát triển 60 phút MIỄN PHÍ (thang Denver II, M-CHAT), ba mẹ tiện đưa bé qua thứ 7 hay CN ạ?",
  "💰 Học phí: Ca can thiệp cá nhân 1:1 (45-60 phút) dao động 250.000đ - 350.000đ/buổi tùy theo kế hoạch IEP của con ạ.",
  "🛡️ Ngoài phạm vi: Dạ Cô Hương ghi nhận thông tin, trung tâm chuyên sâu về can thiệp tự kỷ nên chuyên viên sẽ gọi riêng hỗ trợ gia đình ạ.",
];

export function LiveChatPage() {
  const { notify, currentUser } = useCms();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [sessions, setSessions] = useState<LiveChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Settings AI
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Scenarios Modal & Testing
  const [showScenariosModal, setShowScenariosModal] = useState(false);
  const [scenariosList, setScenariosList] = useState<AutismScenario[]>(DEFAULT_AUTISM_SCENARIOS);
  const [scenarioFilterCategory, setScenarioFilterCategory] = useState<string>("all");
  const [scenarioSearchTerm, setScenarioSearchTerm] = useState("");
  const [testUserQuestion, setTestUserQuestion] = useState("Bé nhà mình 2 tuổi rưỡi chưa biết nói từ nào, hay đi nhón chân");
  const [testAnalysisResult, setTestAnalysisResult] = useState<any>(null);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "waiting" | "replied" | "online">("all");


  // Phân tích thử nghiệm câu hỏi
  const handleRunScenarioTest = () => {
    if (!testUserQuestion.trim()) return;
    const res = analyzeUserQuestionAndRespond(testUserQuestion, "Mẹ Bé", "096 290 3942");
    setTestAnalysisResult(res);
  };

  // Xuất file JSON bộ kịch bản
  const handleExportScenariosJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scenariosList, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "kich-ban-tu-ky-qa.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    notify("Đã xuất bộ kịch bản ra file kich-ban-tu-ky-qa.json");
  };

  // Xuất file Text báo cáo kịch bản
  const handleExportScenariosTxt = () => {
    let txt = "================================================================================\n";
    txt += "BỘ CÂU HỎI VÀ KỊCH BẢN TÌNH HUỐNG CAN THIỆP TỰ KỶ (AI KNOWLEDGE BASE)\n";
    txt += "Dự án: Trung tâm Hỗ trợ Trẻ Tự kỷ Cô Hương\n";
    txt += "Tổng số tình huống: " + scenariosList.length + "\n";
    txt += "================================================================================\n\n";

    scenariosList.forEach((sc, idx) => {
      txt += (idx + 1) + ". " + sc.title.toUpperCase() + "\n";
      txt += "   - Phân loại: " + (sc.isOutOfScope ? "[NGOÀI PHẠM VI - CHỈ TIẾP NHẬN]" : "[CHUYÊN SÂU TỰ KỶ]") + "\n";
      txt += "   - Ý định câu hỏi: " + sc.intent + "\n";
      txt += "   - Câu hỏi mẫu: \"" + sc.sampleQuestion + "\"\n";
      txt += "   - Từ khóa nhận diện: " + sc.keywords.join(", ") + "\n";
      txt += "   - Câu trả lời đúng trọng tâm: \"" + sc.responseTemplate.replace(/{customerName}/g, "Ba/Mẹ").replace(/{customerPhone}/g, "096 290 3942") + "\"\n";
      if (sc.recommendedAction) txt += "   - Hành động đề xuất: " + sc.recommendedAction + "\n";
      txt += "\n--------------------------------------------------------------------------------\n\n";
    });

    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(txt);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "bo-tinh-huong-tu-ky.txt");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    notify("Đã xuất báo cáo kịch bản ra file bo-tinh-huong-tu-ky.txt");
  };

  // Nạp file JSON kịch bản mới
  const handleImportScenariosJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setScenariosList(parsed);
          notify("Đã nạp thành công " + parsed.length + " tình huống kịch bản mới vào hệ thống!");
        } else {
          notify("File JSON không đúng cấu trúc danh sách kịch bản.");
        }
      } catch {
        notify("Lỗi đọc file JSON. Vui lòng kiểm tra định dạng.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Sử dụng câu trả lời của kịch bản chèn vào khung chat
  const handleUseScenarioResponse = (template: string) => {
    const filled = template
      .replace(/{customerName}/g, selectedSession?.customerName || "Ba/Mẹ")
      .replace(/{customerPhone}/g, selectedSession?.customerPhone || "của gia đình");
    setReplyText(filled);
    setShowScenariosModal(false);
    notify("Đã chèn câu trả lời vào khung chat");
  };

  // Compose
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<any>(null);

  // 1. Tải cấu hình AI Chat
  const loadChatSettings = async () => {
    try {
      // Local cache
      const cached = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (typeof parsed.aiEnabled === "boolean") {
          setAiEnabled(parsed.aiEnabled);
        }
      }

      // Cloud fetch
      const res = await fetch(CHAT_SETTINGS_URL, { cache: "no-store" });
      if (res.ok) {
        const cloudData = await res.json();
        if (cloudData && typeof cloudData.aiEnabled === "boolean") {
          setAiEnabled(cloudData.aiEnabled);
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(cloudData));
        }
      }
    } catch (e) {
      console.warn("Could not load chat settings:", e);
    }
  };

  // 2. Lưu cấu hình AI Chat
  const handleToggleAi = async (checked: boolean) => {
    setAiEnabled(checked);
    setIsSavingSettings(true);
    const newSettings: LiveChatSettings = {
      aiEnabled: checked,
      aiDelaySeconds: 3.5,
      aiPersonaName: "Trợ lý AI Cô Hương",
      autoGreeting: "Dạ chào ba/mẹ! Cô Hương và ban chuyên môn rất vui được lắng nghe gia đình.",
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));

    try {
      await fetch(CHAT_SETTINGS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });

      logAuditAction({
        username: currentUser?.username || "admin",
        fullName: currentUser?.fullName || "Quản trị viên",
        role: currentUser?.role || "admin",
        category: "content",
        action: checked ? "Bật AI hỗ trợ Live Chat" : "Tắt AI hỗ trợ Live Chat",
        detail: `Quản trị viên đã ${checked ? "BẬT" : "TẮT"} tính năng AI tự động phản hồi khách khi vắng mặt.`,
        target: "Live Chat AI Settings",
        status: "success",
      });

      notify(
        checked
          ? "Đã BẬT AI tự động hỗ trợ khách khi quản trị vắng mặt"
          : "Đã TẮT AI tự động hỗ trợ khách"
      );
    } catch {
      notify("Lỗi đồng bộ cấu hình AI lên máy chủ, vui lòng thử lại.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // 3. Tải danh sách phiên trò chuyện từ KVDB
  const fetchSessions = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const res = await fetch(CHAT_SESSIONS_URL, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Sắp xếp phiên mới nhất lên đầu
          const sorted = [...data].sort(
            (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
          );
          setSessions(sorted);
        }
      }
    } catch (err) {
      console.warn("Could not fetch chat sessions:", err);
    } finally {
      setLoading(false);
      if (showSpinner) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadChatSettings();
    fetchSessions();

    // Gửi tín hiệu báo Quản trị viên đang có mặt tại /chat-khach-hang
    const sendPresence = async (isOnline = true) => {
      try {
        const payload = {
          adminOnline: isOnline,
          activePath: "/chat-khach-hang",
          lastHeartbeat: Date.now(),
          adminName: currentUser?.fullName || "Quản trị viên",
        };
        await fetch(ADMIN_PRESENCE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        // BroadcastChannel cho landing page cùng trình duyệt
        try {
          const chan = new BroadcastChannel("aurora_live_chat_channel");
          chan.postMessage({
            type: "ADMIN_PRESENCE",
            adminOnline: isOnline,
            activePath: "/chat-khach-hang",
            timestamp: Date.now(),
          });
          chan.close();
        } catch {}
      } catch {}
    };

    // Báo online ngay khi mở trang
    sendPresence(true);
    const presenceTimer = setInterval(() => sendPresence(true), 6000);

    // Polling danh sách phiên mỗi 3 giây
    pollTimerRef.current = setInterval(() => {
      fetchSessions(false);
    }, 3000);

    // Kênh BroadcastChannel đồng bộ tức thì
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("aurora_live_chat_channel");
      channel.onmessage = (event) => {
        if (event.data?.type === "NEW_SESSION" || event.data?.type === "SESSION_UPDATED") {
          fetchSessions(false);
        }
        if (event.data?.type === "CHECK_ADMIN_PRESENCE") {
          sendPresence(true);
        }
      };
    } catch {}

    const handleBeforeUnload = () => {
      sendPresence(false);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(presenceTimer);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (channel) channel.close();
      window.removeEventListener("beforeunload", handleBeforeUnload);
      sendPresence(false);
    };
  }, [currentUser]);

  // Hỗ trợ chọn nhanh phiên từ query param ?phone=...
  useEffect(() => {
    const phoneParam = searchParams.get("phone");
    if (phoneParam && sessions.length > 0 && !selectedSessionId) {
      const cleanTarget = phoneParam.replace(/[^0-9]/g, "");
      const matched = sessions.find(
        (s) => s.customerPhone.replace(/[^0-9]/g, "") === cleanTarget
      );
      if (matched) {
        setSelectedSessionId(matched.id);
      }
    }
  }, [searchParams, sessions, selectedSessionId]);

  // Cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const selectedSession = useMemo(() => {
    return sessions.find((s) => s.id === selectedSessionId) || null;
  }, [sessions, selectedSessionId]);

  useEffect(() => {
    if (selectedSessionId) {
      scrollToBottom();
      // Đánh dấu đã đọc
      markSessionAsRead(selectedSessionId);
    }
  }, [selectedSessionId, selectedSession?.messages?.length]);

  const markSessionAsRead = async (sessionId: string) => {
    const current = sessions.find((s) => s.id === sessionId);
    if (!current || !current.unreadAdminCount) return;

    const updated = sessions.map((s) =>
      s.id === sessionId ? { ...s, unreadAdminCount: 0 } : s
    );
    setSessions(updated);

    try {
      await fetch(CHAT_SESSIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch {}
  };

  // 4. Quản trị viên gửi tin nhắn phản hồi
  const handleSendReply = async (customText?: string) => {
    const text = (customText || replyText).trim();
    if (!text || !selectedSession || isSending) return;

    setIsSending(true);
    setReplyText("");

    const adminMsg: ChatMessage = {
      id: `msg-admin-${Date.now()}`,
      sender: "admin",
      senderName: currentUser?.fullName || "Cô Hương (Trưởng ban chuyên môn)",
      text,
      timestamp: new Date().toISOString(),
    };

    const updatedSession: LiveChatSession = {
      ...selectedSession,
      updatedAt: new Date().toISOString(),
      status: "replied",
      unreadAdminCount: 0,
      unreadCustomerCount: (selectedSession.unreadCustomerCount || 0) + 1,
      messages: [...selectedSession.messages, adminMsg],
    };

    const updatedList = sessions.map((s) =>
      s.id === selectedSession.id ? updatedSession : s
    );

    setSessions(updatedList);

    try {
      await fetch(CHAT_SESSIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedList),
      });

      // Bắn tín hiệu BroadcastChannel
      try {
        const channel = new BroadcastChannel("aurora_live_chat_channel");
        channel.postMessage({ type: "SESSION_UPDATED", session: updatedSession });
        channel.close();
      } catch {}

      logAuditAction({
        username: currentUser?.username || "admin",
        fullName: currentUser?.fullName || "Quản trị viên",
        role: currentUser?.role || "admin",
        category: "content",
        action: "Gửi tin nhắn Live Chat",
        detail: `Phản hồi phụ huynh ${selectedSession.customerName} (${selectedSession.customerPhone}): "${text.slice(0, 60)}..."`,
        target: `@${selectedSession.customerPhone}`,
        status: "success",
      });

      notify("Đã gửi tin nhắn cho phụ huynh");
    } catch (err) {
      notify("Lỗi kết nối khi gửi tin nhắn, vui lòng thử lại.");
    } finally {
      setIsSending(false);
    }
  };

  // 5. Xoá phiên trò chuyện
  const handleDeleteSession = async (sessionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const target = sessions.find((s) => s.id === sessionId);
    if (!target) return;

    if (!window.confirm(`Bạn có chắc muốn xoá phiên trò chuyện với phụ huynh ${target.customerName} (${target.customerPhone})?`)) {
      return;
    }

    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);
    if (selectedSessionId === sessionId) {
      setSelectedSessionId(null);
    }

    try {
      await fetch(CHAT_SESSIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      logAuditAction({
        username: currentUser?.username || "admin",
        fullName: currentUser?.fullName || "Quản trị viên",
        role: currentUser?.role || "admin",
        category: "content",
        action: "Xoá phiên Live Chat",
        detail: `Xoá toàn bộ cuộc hội thoại với phụ huynh ${target.customerName} (${target.customerPhone})`,
        target: target.customerPhone,
        status: "success",
      });

      notify("Đã xoá phiên trò chuyện thành công");
    } catch {
      notify("Lỗi xoá trên máy chủ, vui lòng thử lại.");
    }
  };

  // Lọc phiên chat
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const matchSearch =
        !searchTerm.trim() ||
        session.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.customerPhone.includes(searchTerm.trim());

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "waiting" && session.status === "waiting") ||
        (statusFilter === "replied" && session.status === "replied") ||
        (statusFilter === "online" && session.status === "online");

      return matchSearch && matchStatus;
    });
  }, [sessions, searchTerm, statusFilter]);

  const totalWaiting = useMemo(() => {
    return sessions.filter((s) => s.status === "waiting" || (s.unreadAdminCount && s.unreadAdminCount > 0)).length;
  }, [sessions]);

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <PageHeading
        eyebrow="Hỗ trợ & Chăm sóc khách hàng"
        title="Chat trực tiếp khách (Live Chat CRM)"
        description="Trò chuyện 2 chiều thời gian thực với phụ huynh trên Landing Page, tự động đồng bộ vào Đăng ký tư vấn"
        action={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchSessions(true)}
              disabled={isRefreshing}
              className="secondary-button"
              style={{
                height: 38,
                padding: "0 14px",
                fontSize: 13,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon name="refresh" size={16} />
              {isRefreshing ? "Đang đồng bộ..." : "Làm mới"}
            </button>
            <button
              type="button"
              onClick={() => setShowScenariosModal(true)}
              className="secondary-button"
              style={{
                height: 38,
                padding: "0 14px",
                fontSize: 13,
                fontWeight: 600,
                color: "#6d28d9",
                borderColor: "#c4b5fd",
                background: "#f5f3ff",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>📚</span>
              Bộ kịch bản & Tình huống AI
            </button>
            <button
              type="button"
              onClick={() => navigate("/dang-ky-tu-van")}
              style={{
                height: 38,
                padding: "0 14px",
                fontSize: 13,
                fontWeight: 600,
                color: "#50008b",
                borderColor: "#d8b4fe",
                background: "#faf5ff",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon name="phone" size={16} />
              Xem Đăng ký tư vấn
            </button>
          </div>
        }
      />

      {/* AI AUTO-SUPPORT BANNER */}
      <section
        style={{
          background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
          border: "1.5px solid #d8b4fe",
          borderRadius: 16,
          padding: "16px 20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          boxShadow: "0 4px 14px rgba(80, 0, 139, 0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#50008b",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              flexShrink: 0,
              boxShadow: "0 4px 10px rgba(80, 0, 139, 0.25)",
            }}
          >
            🤖
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <strong style={{ fontSize: 15, fontWeight: 700, color: "#3b0764" }}>
                Trợ lý AI Cô Hương (Tự động hỗ trợ khi vắng mặt)
              </strong>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "#dbeafe",
                  color: "#1e40af",
                  border: "1px solid #bfdbfe",
                }}
              >
                👤 Bạn đang trực phòng chat (AI tạm dừng để bạn trò chuyện trực tiếp)
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: aiEnabled ? "#dcfce7" : "#fee2e2",
                  color: aiEnabled ? "#15803d" : "#b91c1c",
                }}
              >
                {aiEnabled ? "🟢 Đang hoạt động" : "⚪ Đã tắt"}
              </span>
            </div>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "#6b21a8", lineHeight: 1.4 }}>
              Khi không có quản trị viên trực máy, AI sẽ thay mặt Cô Hương phản hồi phụ huynh sau 3.5 giây
              (hướng dẫn chậm nói, can thiệp ABA, trị liệu giác quan, báo giá học phí & lịch đánh giá).
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              userSelect: "none",
              background: "#ffffff",
              padding: "8px 14px",
              borderRadius: 12,
              border: "1px solid #c084fc",
              boxShadow: "0 2px 6px rgba(80, 0, 139, 0.08)",
            }}
          >
            <input
              type="checkbox"
              checked={aiEnabled}
              disabled={isSavingSettings}
              onChange={(e) => handleToggleAi(e.target.checked)}
              style={{
                width: 18,
                height: 18,
                cursor: "pointer",
                accentColor: "#50008b",
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#3b0764" }}>
              {aiEnabled ? "Bật AI tự động hỗ trợ" : "Tắt AI tự động hỗ trợ"}
            </span>
          </label>
        </div>
      </section>

      {/* MAIN CHAT WORKSPACE (2 COLUMNS) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "340px 1fr",
          gap: 20,
          minHeight: 650,
          height: "calc(100vh - 280px)",
          maxHeight: 850,
        }}
      >
        {/* LEFT COLUMN: SESSIONS LIST */}
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
          }}
        >
          {/* SEARCH & FILTERS */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
            <div style={{ position: "relative", marginBottom: 10 }}>
              <input
                type="text"
                placeholder="Tìm tên phụ huynh, SĐT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 34px",
                  borderRadius: 10,
                  border: "1.5px solid #cbd5e1",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                  fontSize: 14,
                }}
              >
                🔍
              </span>
            </div>

            {/* STATUS CHIPS */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: statusFilter === "all" ? "#50008b" : "#e2e8f0",
                  color: statusFilter === "all" ? "#ffffff" : "#475569",
                  transition: "all 0.15s",
                }}
              >
                Tất cả ({sessions.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("waiting")}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: statusFilter === "waiting" ? "#f59e0b" : "#fef3c7",
                  color: statusFilter === "waiting" ? "#ffffff" : "#b45309",
                  transition: "all 0.15s",
                }}
              >
                Chờ trả lời {totalWaiting > 0 && `(${totalWaiting})`}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("replied")}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: statusFilter === "replied" ? "#3b82f6" : "#dbeafe",
                  color: statusFilter === "replied" ? "#ffffff" : "#1d4ed8",
                  transition: "all 0.15s",
                }}
              >
                Đã trả lời
              </button>
            </div>
          </div>

          {/* SESSIONS SCROLL LIST */}
          <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px 16px", color: "#94a3b8", fontSize: 13 }}>
                Đang tải danh sách cuộc trò chuyện...
              </div>
            ) : filteredSessions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 16px", color: "#64748b" }}>
                <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>💬</span>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Chưa có cuộc trò chuyện nào</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>
                  Khi phụ huynh bấm "Chat ngay" trên landing page, thông tin sẽ xuất hiện ngay tại đây.
                </p>
              </div>
            ) : (
              filteredSessions.map((s) => {
                const isSelected = s.id === selectedSessionId;
                const lastMsg = s.messages[s.messages.length - 1];
                const hasUnread = s.unreadAdminCount && s.unreadAdminCount > 0;

                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSessionId(s.id)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 12,
                      marginBottom: 6,
                      cursor: "pointer",
                      background: isSelected ? "#f5f3ff" : hasUnread ? "#fefce8" : "#ffffff",
                      border: isSelected
                        ? "1.5px solid #8b5cf6"
                        : hasUnread
                        ? "1.5px solid #fef08a"
                        : "1px solid #f1f5f9",
                      boxShadow: isSelected ? "0 4px 12px rgba(124, 58, 237, 0.12)" : "none",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <strong style={{ fontSize: 14, color: "#1e293b", fontWeight: 700 }}>
                        {s.customerName}
                      </strong>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        {new Date(s.updatedAt || s.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "#50008b", fontWeight: 600 }}>
                        📞 {s.customerPhone}
                      </span>
                      {hasUnread && (
                        <span
                          style={{
                            background: "#ef4444",
                            color: "#ffffff",
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: 999,
                          }}
                        >
                          Mới
                        </span>
                      )}
                    </div>

                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: hasUnread ? "#1e293b" : "#64748b",
                        fontWeight: hasUnread ? 600 : 400,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {lastMsg ? `${lastMsg.sender === "admin" ? "Cô Hương: " : lastMsg.sender === "ai" ? "🤖 AI: " : ""}${lastMsg.text}` : "Bắt đầu cuộc trò chuyện..."}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: ACTIVE CONVERSATION */}
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
          }}
        >
          {selectedSession ? (
            <>
              {/* CONVERSATION TOP BAR */}
              <div
                style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid #f1f5f9",
                  background: "#fcf8ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #7c3aed, #50008b)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      fontWeight: 700,
                    }}
                  >
                    {selectedSession.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
                      {selectedSession.customerName}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                      <span style={{ fontSize: 13, color: "#6b21a8", fontWeight: 600 }}>
                        {selectedSession.customerPhone}
                      </span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>·</span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        Khởi tạo lúc: {new Date(selectedSession.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}, {new Date(selectedSession.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <a
                    href={`tel:${selectedSession.customerPhone.replace(/[^0-9]/g, "")}`}
                    className="secondary-button"
                    style={{
                      height: 34,
                      padding: "0 10px",
                      fontSize: 12,
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      color: "#16a34a",
                      borderColor: "#bbf7d0",
                      background: "#f0fdf4",
                      textDecoration: "none",
                    }}
                  >
                    📞 Gọi ngay
                  </a>

                  <a
                    href={`https://zalo.me/${selectedSession.customerPhone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="secondary-button"
                    style={{
                      height: 34,
                      padding: "0 10px",
                      fontSize: 12,
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      color: "#0284c7",
                      borderColor: "#bae6fd",
                      background: "#f0f9ff",
                      textDecoration: "none",
                    }}
                  >
                    💬 Nhắn Zalo
                  </a>

                  <button
                    type="button"
                    onClick={() => navigate(`/dang-ky-tu-van`)}
                    className="secondary-button"
                    title="Chuyển đến mục Đăng ký tư vấn để quản lý hồ sơ"
                    style={{
                      height: 34,
                      padding: "0 10px",
                      fontSize: 12,
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    📋 Hồ sơ tư vấn
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(selectedSession.id, e)}
                    className="secondary-button"
                    title="Xoá cuộc trò chuyện này"
                    style={{
                      height: 34,
                      padding: "0 8px",
                      fontSize: 12,
                      color: "#ef4444",
                      borderColor: "#fecaca",
                      background: "#fef2f2",
                    }}
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>

              {/* MESSAGES THREAD */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "20px 24px",
                  background: "#f8fafc",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <div style={{ textAlign: "center", margin: "4px 0 10px" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      background: "#e2e8f0",
                      color: "#475569",
                      padding: "4px 12px",
                      borderRadius: 999,
                    }}
                  >
                    🔒 Cuộc trò chuyện được bảo mật và tự động ghi nhận vào Đăng ký tư vấn
                  </span>
                </div>

                {selectedSession.messages.map((msg) => {
                  const isCustomer = msg.sender === "customer";
                  const isAi = msg.sender === "ai";
                  const isAdmin = msg.sender === "admin";

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isAdmin ? "flex-end" : "flex-start",
                        maxWidth: "80%",
                        alignSelf: isAdmin ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 4,
                          fontSize: 11,
                          color: "#64748b",
                        }}
                      >
                        <span style={{ fontWeight: 600, color: isAdmin ? "#50008b" : isAi ? "#7c3aed" : "#1e293b" }}>
                          {isAi ? "🤖 " : isAdmin ? "👩‍🏫 " : "👤 "}
                          {msg.senderName}
                        </span>
                        <span>·</span>
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div
                        style={{
                          padding: "12px 16px",
                          borderRadius: 16,
                          fontSize: 13.5,
                          lineHeight: 1.5,
                          wordBreak: "break-word",
                          ...(isAdmin
                            ? {
                                background: "linear-gradient(135deg, #50008b, #6b21a8)",
                                color: "#ffffff",
                                borderBottomRightRadius: 4,
                                boxShadow: "0 3px 10px rgba(80, 0, 139, 0.2)",
                              }
                            : isAi
                            ? {
                                background: "#f5f3ff",
                                color: "#3b0764",
                                border: "1.5px solid #ddd6fe",
                                borderBottomLeftRadius: 4,
                                boxShadow: "0 2px 8px rgba(124, 58, 237, 0.08)",
                              }
                            : {
                                background: "#ffffff",
                                color: "#1e293b",
                                border: "1px solid #cbd5e1",
                                borderBottomLeftRadius: 4,
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                              }),
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* QUICK CANNED RESPONSES */}
              <div
                style={{
                  padding: "8px 16px",
                  background: "#f1f5f9",
                  borderTop: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  overflowX: "auto",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", flexShrink: 0 }}>
                  ⚡ Phản hồi nhanh:
                </span>
                {CANNED_RESPONSES.map((canned, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendReply(canned)}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: 999,
                      padding: "4px 12px",
                      fontSize: 11.5,
                      fontWeight: 500,
                      color: "#334155",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      flexShrink: 0,
                    }}
                    title={canned}
                  >
                    {canned.length > 40 ? `${canned.slice(0, 40)}...` : canned}
                  </button>
                ))}
              </div>

              {/* INPUT COMPOSE BAR */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendReply();
                }}
                style={{
                  padding: "14px 20px",
                  background: "#ffffff",
                  borderTop: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexShrink: 0,
                }}
              >
                <textarea
                  rows={2}
                  placeholder="Nhập nội dung phản hồi cho phụ huynh (Bấm Enter để gửi, Shift+Enter xuống dòng)..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  style={{
                    flex: 1,
                    resize: "none",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13,
                    outline: "none",
                    fontFamily: "inherit",
                    lineHeight: 1.4,
                  }}
                />

                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending}
                  className="primary-button"
                  style={{
                    height: 48,
                    padding: "0 22px",
                    fontSize: 14,
                    fontWeight: 700,
                    background: "#50008b",
                    borderRadius: 12,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: !replyText.trim() || isSending ? "not-allowed" : "pointer",
                    opacity: !replyText.trim() || isSending ? 0.6 : 1,
                  }}
                >
                  {isSending ? "Đang gửi..." : "Gửi tin nhắn ➤"}
                </button>
              </form>
            </>
          ) : (
            /* EMPTY STATE */
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 40,
                textAlign: "center",
                color: "#64748b",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "#faf5ff",
                  border: "2px solid #e9d5ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,
                  marginBottom: 16,
                }}
              >
                💬
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "#1e293b" }}>
                Chọn một cuộc trò chuyện để bắt đầu
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b", maxWidth: 440, lineHeight: 1.5 }}>
                Chọn phụ huynh từ danh sách bên trái để phản hồi trực tiếp. Phụ huynh sẽ nhận được tin nhắn tức thì trên giao diện Landing Page của họ.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

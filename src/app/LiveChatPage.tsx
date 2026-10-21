import {
  DEFAULT_AUTISM_SCENARIOS,
  analyzeUserQuestionAndRespond,
  getStoredScenarios,
  saveStoredScenarios,
  resetStoredScenarios,
  DEFAULT_AI_SYSTEM_ROLE,
  getStoredAiRole,
  type AutismScenario,
  type AiSystemRoleConfig,
} from "./autismKnowledgeBase";
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

  // Scenarios Modal & Configuration Management
  const [showScenariosModal, setShowScenariosModal] = useState(false);
  const [scenariosList, setScenariosList] = useState<AutismScenario[]>(() => getStoredScenarios());
  const [editingScenario, setEditingScenario] = useState<AutismScenario | null>(null);
  const [isNewScenario, setIsNewScenario] = useState(false);
  const [scenarioFilterCategory, setScenarioFilterCategory] = useState<string>("all");
  const [scenarioSearchTerm, setScenarioSearchTerm] = useState("");
  const [testUserQuestion, setTestUserQuestion] = useState("Bé nhà mình 2 tuổi rưỡi chưa biết nói từ nào, hay đi nhón chân");
  const [testAnalysisResult, setTestAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "waiting" | "replied" | "online">("all");

  // Phân tích thử nghiệm câu hỏi
  const handleRunScenarioTest = () => {
    if (!testUserQuestion.trim()) return;
    const res = analyzeUserQuestionAndRespond(testUserQuestion, "Mẹ Bé", "096 290 3942", scenariosList);
    setTestAnalysisResult(res);
  };

  // Lưu cấu hình kịch bản (Thêm mới hoặc sửa)
  const handleSaveScenario = (sc: AutismScenario) => {
    if (!sc.title.trim()) {
      notify("Vui lòng nhập tên tình huống");
      return;
    }
    if (!sc.responseTemplate.trim()) {
      notify("Vui lòng nhập câu trả lời của AI");
      return;
    }
    let updatedList: AutismScenario[];
    const exists = scenariosList.some((item) => item.id === sc.id);
    if (exists) {
      updatedList = scenariosList.map((item) => (item.id === sc.id ? sc : item));
    } else {
      updatedList = [sc, ...scenariosList];
    }
    setScenariosList(updatedList);
    saveStoredScenarios(updatedList);
    setEditingScenario(null);
    notify(isNewScenario ? "Đã thêm kịch bản mới thành công!" : "Đã cập nhật kịch bản thành công!");
    logAuditAction("Cấu hình kịch bản AI", isNewScenario ? "Tạo mới" : "Chỉnh sửa", sc.title);
  };

  // Dựa vào câu hỏi mẫu tạo kịch bản tùy biến
  const handleCloneFromSample = (sample: AutismScenario) => {
    const cloned: AutismScenario = {
      ...sample,
      id: "sc-custom-" + Date.now(),
      title: `${sample.title} (Tùy biến)`,
      isCustom: true,
      isActive: true,
    };
    setIsNewScenario(true);
    setEditingScenario(cloned);
  };

  // Thêm kịch bản hoàn toàn mới
  const handleCreateNewScenario = () => {
    const newSc: AutismScenario = {
      id: "sc-custom-" + Date.now(),
      title: "",
      category: "speech",
      intent: "",
      sampleQuestion: "",
      keywords: [],
      responseTemplate: "Dạ ba/mẹ {customerName} ơi, Cô Hương đã tiếp nhận thông tin từ gia đình...",
      recommendedAction: "Tư vấn lộ trình can thiệp và xếp lịch đánh giá miễn phí",
      isOutOfScope: false,
      isActive: true,
      isCustom: true,
    };
    setIsNewScenario(true);
    setEditingScenario(newSc);
  };

  // Bật / tắt kích hoạt kịch bản
  const handleToggleScenarioActive = (id: string) => {
    const updated = scenariosList.map((s) => (s.id === id ? { ...s, isActive: s.isActive === false } : s));
    setScenariosList(updated);
    saveStoredScenarios(updated);
    notify("Đã cập nhật trạng thái kích hoạt kịch bản");
  };

  // Xóa kịch bản
  const handleDeleteScenario = (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa kịch bản "${title}" khỏi hệ thống?`)) return;
    const updated = scenariosList.filter((s) => s.id !== id);
    setScenariosList(updated);
    saveStoredScenarios(updated);
    notify(`Đã xóa kịch bản "${title}"`);
    logAuditAction("Cấu hình kịch bản AI", "Xóa", title);
  };

  // Khôi phục bộ kịch bản chuẩn gốc
  const handleResetScenarios = () => {
    if (!window.confirm("Bạn có chắc chắn muốn khôi phục về bộ 13 kịch bản chuẩn gốc của chuyên gia? Tất cả các tùy biến sẽ được làm mới.")) return;
    const defaults = resetStoredScenarios();
    setScenariosList(defaults);
    notify("Đã khôi phục về bộ 13 kịch bản chuẩn gốc của chuyên gia!");
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
      txt += "   - Trạng thái: " + (sc.isActive !== false ? "ĐANG KÍCH HOẠT" : "ĐÃ TẠM DỪNG") + "\n";
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
          saveStoredScenarios(parsed);
          notify("Đã nạp thành công " + parsed.length + " tình huống kịch bản vào hệ thống!");
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

  // Lọc kịch bản theo phân loại và từ khóa
  const filteredScenarios = useMemo(() => {
    return scenariosList.filter((sc) => {
      if (scenarioFilterCategory === "custom" && !sc.isCustom) return false;
      if (scenarioFilterCategory !== "all" && scenarioFilterCategory !== "custom" && sc.category !== scenarioFilterCategory) {
        return false;
      }
      if (scenarioSearchTerm.trim()) {
        const term = scenarioSearchTerm.toLowerCase();
        const inTitle = sc.title.toLowerCase().includes(term);
        const inIntent = sc.intent.toLowerCase().includes(term);
        const inSample = sc.sampleQuestion.toLowerCase().includes(term);
        const inKeywords = sc.keywords.some((k) => k.toLowerCase().includes(term));
        const inResponse = sc.responseTemplate.toLowerCase().includes(term);
        return inTitle || inIntent || inSample || inKeywords || inResponse;
      }
      return true;
    });
  }, [scenariosList, scenarioFilterCategory, scenarioSearchTerm]);

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
        className="live-chat-workspace-grid"
        style={{
          display: "grid",
          // Dynamic responsive workspace
          gridTemplateColumns: "minmax(280px, 340px) 1fr",
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
      
      {/* ẨN INPUT NẠP FILE JSON */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportScenariosJson}
        accept=".json"
        style={{ display: "none" }}
      />

      {/* ========================================================================= */}
      {/* MODAL 1: BỘ KỊCH BẢN & TÌNH HUỐNG AI (Q&A)                                */}
      {/* ========================================================================= */}
      {showScenariosModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 20,
              width: "100%",
              maxWidth: 1100,
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
            }}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
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
                    boxShadow: "0 4px 12px rgba(80, 0, 139, 0.25)",
                  }}
                >
                  📚
                </span>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1e293b" }}>
                    Bộ kịch bản & Cấu hình Phản hồi AI (Autism Q&A Matrix)
                  </h2>
                  <p style={{ margin: 0, fontSize: 12.5, color: "#64748b" }}>
                    Quản lý các tình huống mẫu, nhân bản câu hỏi để cấu hình câu trả lời, nạp/xuất và kiểm thử AI thời gian thực
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowScenariosModal(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontSize: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* ACTION TOOLBAR & SEARCH */}
            <div
              style={{
                padding: "14px 24px",
                borderBottom: "1px solid #e2e8f0",
                background: "#f8fafc",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 280 }}>
                <input
                  type="text"
                  placeholder="🔍 Tìm theo tiêu đề, câu hỏi mẫu, từ khóa nhận diện..."
                  value={scenarioSearchTerm}
                  onChange={(e) => setScenarioSearchTerm(e.target.value)}
                  style={{
                    flex: 1,
                    height: 38,
                    padding: "0 14px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    outline: "none",
                    background: "#ffffff",
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleCreateNewScenario}
                  style={{
                    height: 38,
                    padding: "0 14px",
                    borderRadius: 10,
                    border: "none",
                    background: "#50008b",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  ➕ Thêm kịch bản mới
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#334155",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                  title="Nạp file JSON kịch bản mới vào hệ thống"
                >
                  📥 Nạp JSON
                </button>

                <button
                  type="button"
                  onClick={handleExportScenariosJson}
                  style={{
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#334155",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  📤 Xuất JSON
                </button>

                <button
                  type="button"
                  onClick={handleExportScenariosTxt}
                  style={{
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 10,
                    border: "1px solid #fed7aa",
                    background: "#fffbeb",
                    color: "#c2410c",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  📄 Xuất TXT
                </button>

                <button
                  type="button"
                  onClick={handleResetScenarios}
                  style={{
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    color: "#64748b",
                    fontSize: 12.5,
                    cursor: "pointer",
                  }}
                  title="Khôi phục về 13 kịch bản chuẩn gốc của chuyên gia"
                >
                  🔄 Khôi phục chuẩn
                </button>
              </div>
            </div>

            {/* CATEGORY FILTER PILLS - WRAP CHỐNG ĐÈ THANH CUỘN */}
            <div
              style={{
                padding: "12px 24px",
                borderBottom: "1px solid #e2e8f0",
                background: "#ffffff",
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "center",
              }}
            >
              {[
                { id: "all", label: "Tất cả (" + scenariosList.length + ")" },
                { id: "ai_role", label: "🎯 Vai trò & Nguyên tắc AI" },
                { id: "speech", label: "🗣️ Âm ngữ / Bật âm" },
                { id: "behavior", label: "⚡ Hành vi / Cảm giác" },
                { id: "interaction", label: "👀 Giao tiếp / Chú ý" },
                { id: "evaluation", label: "📋 Đánh giá / Test Denver" },
                { id: "tuition", label: "💰 Học phí / Ca học" },
                { id: "out_of_scope", label: "🛡️ Ngoài phạm vi (Chỉ tiếp nhận)" },
                { id: "general", label: "📍 Địa chỉ & Gia đình" },
                { id: "custom", label: "⭐ Kịch bản tùy biến" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setScenarioFilterCategory(tab.id)}
                  style={{
                    height: 32,
                    padding: "0 14px",
                    borderRadius: 999,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: scenarioFilterCategory === tab.id ? "1.5px solid #50008b" : "1px solid #cbd5e1",
                    background: scenarioFilterCategory === tab.id ? "#faf5ff" : "#ffffff",
                    color: scenarioFilterCategory === tab.id ? "#50008b" : "#475569",
                    transition: "all 0.15s",
                    boxSizing: "border-box",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* SCROLLABLE CONTENT BODY */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 20,
                background: "#f8fafc",
              }}
            >
              {/* FEATURED: VAI TRÒ & NGUYÊN TẮC CỐT LÕI CỦA TRỢ LÝ AI CÔ HƯƠNG */}
              <div
                style={{
                  background: "linear-gradient(135deg, #fdf8ff 0%, #f5f3ff 100%)",
                  borderRadius: 14,
                  border: "1.5px solid #d8b4fe",
                  padding: "20px 22px",
                  boxShadow: "0 4px 16px rgba(80, 0, 139, 0.06)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>🎯</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#3b0764" }}>
                        Vai trò & Nguyên tắc Cốt lõi của Trợ lý AI Cô Hương
                      </h3>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#7e22ce" }}>
                        Khung định hướng tư vấn trực tuyến (Autism Q&A Matrix Persona)
                      </p>
                    </div>
                  </div>
                  <span
                    style={{
                      background: "#50008b",
                      color: "#ffffff",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 999,
                      letterSpacing: "0.2px",
                    }}
                  >
                    Chuẩn hóa can thiệp tại nhà · Thái Bình
                  </span>
                </div>

                {/* VAI TRÒ CỦA AI */}
                <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: 10, border: "1px solid #e9d5ff", marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#50008b", marginBottom: 4 }}>
                    ⭐ Vai trò của AI
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "#1e293b", lineHeight: 1.55 }}>
                    {DEFAULT_AI_SYSTEM_ROLE.roleDescription}
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, marginBottom: 14 }}>
                  {/* MỤC TIÊU */}
                  <div style={{ background: "#ffffff", padding: "14px 16px", borderRadius: 10, border: "1px solid #e9d5ff" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0284c7", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>🎯</span> Mục tiêu tư vấn (6 mục tiêu)
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#334155", lineHeight: 1.55 }}>
                      {DEFAULT_AI_SYSTEM_ROLE.objectives.map((obj, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>{obj.replace(/^\d+\.\s*/, "")}</li>
                      ))}
                    </ul>
                  </div>

                  {/* QUY TẮC TRẢ LỜI */}
                  <div style={{ background: "#ffffff", padding: "14px 16px", borderRadius: 10, border: "1px solid #e9d5ff" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#d97706", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>⚖️</span> Quy tắc phản hồi nghiêm ngặt
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#334155", lineHeight: 1.55 }}>
                      {DEFAULT_AI_SYSTEM_ROLE.rules.map((rule, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>{rule.replace(/^-\s*/, "")}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* VÍ DỤ TRẢ LỜI & KẾT QUẢ MONG MUỐN */}
                <div style={{ background: "#ffffff", padding: "14px 16px", borderRadius: 10, border: "1px solid #e9d5ff" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>💬</span> Ví dụ đối thoại mẫu chuẩn
                  </div>
                  <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: 8, borderLeft: "3px solid #3b82f6", marginBottom: 8 }}>
                    <strong style={{ fontSize: 12, color: "#1e293b" }}>Phụ huynh: </strong>
                    <span style={{ fontSize: 12.5, color: "#475569" }}>“{DEFAULT_AI_SYSTEM_ROLE.sampleDialog.parentQuestion}”</span>
                  </div>
                  <div style={{ background: "#faf5ff", padding: "10px 14px", borderRadius: 8, borderLeft: "3px solid #50008b", marginBottom: 10 }}>
                    <strong style={{ fontSize: 12, color: "#50008b" }}>Cô Hương (AI): </strong>
                    <span style={{ fontSize: 12.5, color: "#3b0764", lineHeight: 1.55 }}>“{DEFAULT_AI_SYSTEM_ROLE.sampleDialog.aiResponse}”</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>
                    ✨ <strong>Kết quả mong muốn:</strong> {DEFAULT_AI_SYSTEM_ROLE.expectedOutcome}
                  </div>
                </div>
              </div>

              {/* LIVE SIMULATOR / TESTER CARD */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 14,
                  border: "1.5px solid #e9d5ff",
                  padding: 18,
                  boxShadow: "0 4px 14px rgba(80, 0, 139, 0.05)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🧪</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#50008b" }}>
                      Trình kiểm thử phản hồi AI theo tình huống thực tế
                    </span>
                  </div>
                  <span style={{ fontSize: 11.5, color: "#64748b" }}>
                    Nhập câu hỏi của phụ huynh để kiểm tra cách AI nhận diện và sinh câu trả lời tức thì
                  </span>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    type="text"
                    value={testUserQuestion}
                    onChange={(e) => setTestUserQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRunScenarioTest()}
                    placeholder="Nhập câu hỏi phụ huynh thường hỏi... (ví dụ: Bé 2 tuổi rưỡi chưa biết nói, hay nhón chân)"
                    style={{
                      flex: 1,
                      height: 42,
                      padding: "0 14px",
                      borderRadius: 10,
                      border: "1.5px solid #cbd5e1",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRunScenarioTest}
                    style={{
                      height: 42,
                      padding: "0 18px",
                      borderRadius: 10,
                      border: "none",
                      background: "#50008b",
                      color: "#ffffff",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    Kiểm tra phản hồi AI ➤
                  </button>
                </div>

                {/* TEST RESULT OUTPUT */}
                {testAnalysisResult && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: 14,
                      borderRadius: 12,
                      background: testAnalysisResult.isOutOfScope ? "#fffbeb" : "#faf5ff",
                      border: testAnalysisResult.isOutOfScope ? "1px solid #fde68a" : "1px solid #e9d5ff",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                            background: testAnalysisResult.isOutOfScope ? "#fef3c7" : "#ede9fe",
                            color: testAnalysisResult.isOutOfScope ? "#92400e" : "#5b21b6",
                          }}
                        >
                          {testAnalysisResult.isOutOfScope ? "🛡️ NGOÀI PHẠM VI (CHỈ TIẾP NHẬN)" : "🎯 CHUYÊN SÂU CAN THIỆP TỰ KỶ"}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                          {testAnalysisResult.scenarioTitle || testAnalysisResult.scenarioId}
                        </span>
                      </div>
                      {testAnalysisResult.score !== undefined && (
                        <span style={{ fontSize: 11.5, color: "#64748b" }}>
                          Điểm khớp: <b>{testAnalysisResult.score}</b> {testAnalysisResult.matchedKeywords?.length ? "(" + testAnalysisResult.matchedKeywords.join(", ") + ")" : ""}
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: "#334155",
                      }}
                    >
                      {testAnalysisResult.response}
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={() => handleUseScenarioResponse(testAnalysisResult.response)}
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#50008b",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        💬 Điền nội dung này vào ô chat phụ huynh ➤
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* LIST OF SCENARIOS */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "#334155" }}>
                    Danh sách tình huống ({filteredScenarios.length} / {scenariosList.length})
                  </span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    Gợi ý: Bấm <b>"📋 Dựa vào mẫu này cấu hình"</b> để tùy biến cách trả lời của AI theo tình huống thực tế
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {filteredScenarios.map((sc) => (
                    <div
                      key={sc.id}
                      style={{
                        background: "#ffffff",
                        borderRadius: 14,
                        border: sc.isActive === false ? "1px solid #cbd5e1" : "1px solid #e2e8f0",
                        opacity: sc.isActive === false ? 0.65 : 1,
                        padding: 18,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      {/* CARD HEADER */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                background: sc.isOutOfScope ? "#fef3c7" : "#ede9fe",
                                color: sc.isOutOfScope ? "#92400e" : "#5b21b6",
                              }}
                            >
                              {sc.isOutOfScope ? "🛡️ Ngoài phạm vi - Chỉ tiếp nhận" : "🎯 Chuyên sâu Can thiệp Tự kỷ"}
                            </span>

                            {sc.isCustom && (
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: 6,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: "#dbeafe",
                                  color: "#1e40af",
                                }}
                              >
                                ⭐ Quản trị tùy biến
                              </span>
                            )}

                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: sc.isActive !== false ? "#16a34a" : "#94a3b8",
                              }}
                            >
                              {sc.isActive !== false ? "● Đang kích hoạt" : "○ Đã tạm dừng"}
                            </span>
                          </div>

                          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
                            {sc.title}
                          </h3>
                        </div>

                        {/* TOGGLE ACTIVE */}
                        <button
                          type="button"
                          onClick={() => handleToggleScenarioActive(sc.id)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 8,
                            fontSize: 11.5,
                            fontWeight: 600,
                            border: "1px solid #cbd5e1",
                            background: sc.isActive !== false ? "#f0fdf4" : "#f1f5f9",
                            color: sc.isActive !== false ? "#15803d" : "#64748b",
                            cursor: "pointer",
                          }}
                        >
                          {sc.isActive !== false ? "Bật" : "Tắt"}
                        </button>
                      </div>

                      {/* INTENT & PSYCHOLOGY */}
                      <div style={{ fontSize: 12.5, color: "#475569" }}>
                        <b>Mục đích / Tâm lý phụ huynh:</b> {sc.intent}
                      </div>

                      {/* SAMPLE QUESTION BOX */}
                      <div
                        style={{
                          padding: "10px 14px",
                          borderRadius: 10,
                          background: "#f1f5f9",
                          borderLeft: "3px solid #64748b",
                          fontSize: 12.5,
                          color: "#1e293b",
                          fontStyle: "italic",
                        }}
                      >
                        💬 <b>Câu hỏi mẫu phụ huynh:</b> "{sc.sampleQuestion}"
                      </div>

                      {/* KEYWORDS TAGS */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b" }}>Từ khóa nhận diện:</span>
                        {sc.keywords.map((kw, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: "2px 8px",
                              borderRadius: 6,
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              fontSize: 11,
                              color: "#334155",
                            }}
                          >
                            {kw}
                          </span>
                        ))}
                      </div>

                      {/* CONFIGURED RESPONSE */}
                      <div
                        style={{
                          padding: "12px 14px",
                          borderRadius: 10,
                          background: "#faf5ff",
                          border: "1.5px solid #e9d5ff",
                          fontSize: 13,
                          lineHeight: 1.5,
                          color: "#1e293b",
                        }}
                      >
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#50008b", marginBottom: 4 }}>
                          ⚡ Cấu hình cách AI trả lời phụ huynh:
                        </div>
                        {sc.responseTemplate}
                      </div>

                      {/* RECOMMENDED ACTION */}
                      {sc.recommendedAction && (
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          📌 <b>Hành động đề xuất cho trung tâm:</b> {sc.recommendedAction}
                        </div>
                      )}

                      {/* CARD FOOTER BUTTONS */}
                      <div
                        style={{
                          paddingTop: 10,
                          borderTop: "1px solid #f1f5f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {/* DỰA VÀO CÂU HỎI MẪU NÀY CẤU HÌNH */}
                          <button
                            type="button"
                            onClick={() => handleCloneFromSample(sc)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 8,
                              border: "1px solid #c4b5fd",
                              background: "#f5f3ff",
                              color: "#6d28d9",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                            title="Sao chép câu hỏi và mẫu này để tạo kịch bản mới tùy biến"
                          >
                            📋 Dựa vào mẫu này cấu hình
                          </button>

                          {/* SỬA KỊCH BẢN */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsNewScenario(false);
                              setEditingScenario({ ...sc });
                            }}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 8,
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#334155",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            ✏️ Sửa
                          </button>

                          {/* XÓA KỊCH BẢN NẾU TÙY BIẾN HOẶC DƯ THỪA */}
                          <button
                            type="button"
                            onClick={() => handleDeleteScenario(sc.id, sc.title)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 8,
                              border: "1px solid #fecaca",
                              background: "#fef2f2",
                              color: "#dc2626",
                              fontSize: 12,
                              cursor: "pointer",
                            }}
                          >
                            🗑️
                          </button>
                        </div>

                        {/* NÚT CHÈN VÀO KHUNG CHAT HIỆN TẠI */}
                        <button
                          type="button"
                          onClick={() => handleUseScenarioResponse(sc.responseTemplate)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 8,
                            border: "none",
                            background: "#50008b",
                            color: "#ffffff",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          💬 Dùng phản hồi này cho khách
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CẤU HÌNH / CHỈNH SỬA KỊCH BẢN CHI TIẾT (DRAWER/MODAL)             */}
      {/* ========================================================================= */}
      {editingScenario && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 20,
              width: "100%",
              maxWidth: 720,
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
              overflow: "hidden",
            }}
          >
            {/* HEADER */}
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
                  {isNewScenario ? "➕ Tạo mới & Cấu hình Kịch bản AI" : "✏️ Chỉnh sửa Cấu hình Kịch bản AI"}
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                  Thiết lập câu hỏi mẫu, từ khóa kích hoạt và nội dung phản hồi trực tiếp của AI
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingScenario(null)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* FORM BODY */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* TIÊU ĐỀ */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Tiêu đề tình huống <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  value={editingScenario.title}
                  onChange={(e) => setEditingScenario({ ...editingScenario, title: e.target.value })}
                  placeholder="Ví dụ: Trẻ chậm nói, chưa bật âm (Giai đoạn 18 - 36 tháng)"
                  style={{
                    width: "100%",
                    height: 40,
                    padding: "0 12px",
                    borderRadius: 10,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>

              {/* PHÂN LOẠI & PHẠM VI */}
              <div style={{ display: "grid", gridColumns: "1fr 1fr", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Phân loại chủ đề
                  </label>
                  <select
                    value={editingScenario.category}
                    onChange={(e) => setEditingScenario({ ...editingScenario, category: e.target.value as any })}
                    style={{
                      width: "100%",
                      height: 40,
                      padding: "0 10px",
                      borderRadius: 10,
                      border: "1.5px solid #cbd5e1",
                      fontSize: 13,
                      background: "#ffffff",
                      outline: "none",
                    }}
                  >
                    <option value="speech">🗣️ Âm ngữ / Bật âm / Nhại lời</option>
                    <option value="behavior">⚡ Hành vi / Cảm giác / Cơn giận</option>
                    <option value="interaction">👀 Giao tiếp / Chú ý / Chỉ ngón</option>
                    <option value="evaluation">📋 Đánh giá / Test Denver</option>
                    <option value="tuition">💰 Học phí / Ca học</option>
                    <option value="out_of_scope">🛡️ Ngoài phạm vi (Chỉ tiếp nhận)</option>
                    <option value="general">📍 Địa chỉ / Đồng hành tại nhà</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Phạm vi xử lý (Scope)
                  </label>
                  <select
                    value={editingScenario.isOutOfScope ? "out" : "autism"}
                    onChange={(e) => setEditingScenario({ ...editingScenario, isOutOfScope: e.target.value === "out" })}
                    style={{
                      width: "100%",
                      height: 40,
                      padding: "0 10px",
                      borderRadius: 10,
                      border: "1.5px solid #cbd5e1",
                      fontSize: 13,
                      background: editingScenario.isOutOfScope ? "#fffbeb" : "#faf5ff",
                      color: editingScenario.isOutOfScope ? "#92400e" : "#5b21b6",
                      fontWeight: 600,
                      outline: "none",
                    }}
                  >
                    <option value="autism">🎯 Chuyên sâu Can thiệp Tự kỷ</option>
                    <option value="out">🛡️ Ngoài phạm vi (Chỉ tiếp nhận lịch sự)</option>
                  </select>
                </div>
              </div>

              {/* TÂM LÝ & Ý ĐỊNH PHỤ HUYNH */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Ý định & Tâm lý của phụ huynh khi hỏi
                </label>
                <textarea
                  rows={2}
                  value={editingScenario.intent}
                  onChange={(e) => setEditingScenario({ ...editingScenario, intent: e.target.value })}
                  placeholder="Mô tả tâm lý hoặc thắc mắc của phụ huynh..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13,
                    outline: "none",
                    resize: "none",
                  }}
                />
              </div>

              {/* CÂU HỎI MẪU CỦA PHỤ HUYNH */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Câu hỏi mẫu của phụ huynh <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <textarea
                  rows={2}
                  value={editingScenario.sampleQuestion}
                  onChange={(e) => setEditingScenario({ ...editingScenario, sampleQuestion: e.target.value })}
                  placeholder="Ví dụ: Bé nhà mình 2 tuổi rưỡi rồi mà chưa nói được từ nào, chỉ ê a thôi thì có sao không cô?"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13,
                    outline: "none",
                    resize: "none",
                  }}
                />
              </div>

              {/* TỪ KHÓA NHẬN DIỆN */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Từ khóa nhận diện (Keywords) - Phân cách bằng dấu phẩy
                </label>
                <input
                  type="text"
                  value={Array.isArray(editingScenario.keywords) ? editingScenario.keywords.join(", ") : ""}
                  onChange={(e) =>
                    setEditingScenario({
                      ...editingScenario,
                      keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Ví dụ: chậm nói, chua noi, bật âm, bat am, chưa nói, không nói, ê a"
                  style={{
                    width: "100%",
                    height: 40,
                    padding: "0 12px",
                    borderRadius: 10,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
                <span style={{ fontSize: 11.5, color: "#64748b", display: "block", marginTop: 4 }}>
                  💡 Gợi ý: Nhập cả có dấu và không dấu để AI nhận biết chính xác khi phụ huynh gõ tắt.
                </span>
              </div>

              {/* CẤU HÌNH CÂU TRẢ LỜI CỦA AI */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>
                    Cấu hình cách AI trả lời <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingScenario({
                          ...editingScenario,
                          responseTemplate: editingScenario.responseTemplate + " {customerName} ",
                        })
                      }
                      style={{
                        padding: "2px 8px",
                        borderRadius: 6,
                        border: "1px solid #c4b5fd",
                        background: "#faf5ff",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#50008b",
                        cursor: "pointer",
                      }}
                    >
                      + Chèn {"{customerName}"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingScenario({
                          ...editingScenario,
                          responseTemplate: editingScenario.responseTemplate + " {customerPhone} ",
                        })
                      }
                      style={{
                        padding: "2px 8px",
                        borderRadius: 6,
                        border: "1px solid #c4b5fd",
                        background: "#faf5ff",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#50008b",
                        cursor: "pointer",
                      }}
                    >
                      + Chèn {"{customerPhone}"}
                    </button>
                  </div>
                </div>

                <textarea
                  rows={5}
                  value={editingScenario.responseTemplate}
                  onChange={(e) => setEditingScenario({ ...editingScenario, responseTemplate: e.target.value })}
                  placeholder="Nhập nội dung trả lời đúng trọng tâm câu hỏi của phụ huynh..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13,
                    outline: "none",
                    lineHeight: 1.5,
                  }}
                />
                <span style={{ fontSize: 11.5, color: "#64748b", display: "block", marginTop: 4 }}>
                  📌 Quy chuẩn: Trả lời đi thẳng vào vấn đề con đang gặp, đưa ra giải pháp rõ ràng, tránh giải thích dài dòng lan man.
                </span>
              </div>

              {/* HÀNH ĐỘNG ĐỀ XUẤT */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Hành động đề xuất cho trung tâm
                </label>
                <input
                  type="text"
                  value={editingScenario.recommendedAction || ""}
                  onChange={(e) => setEditingScenario({ ...editingScenario, recommendedAction: e.target.value })}
                  placeholder="Ví dụ: Xếp lịch đánh giá phát triển 60 phút miễn phí"
                  style={{
                    width: "100%",
                    height: 40,
                    padding: "0 12px",
                    borderRadius: 10,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>

              {/* KÍCH HOẠT */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  id="chk-active-scenario"
                  checked={editingScenario.isActive !== false}
                  onChange={(e) => setEditingScenario({ ...editingScenario, isActive: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: "#50008b", cursor: "pointer" }}
                />
                <label htmlFor="chk-active-scenario" style={{ fontSize: 13, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                  Kích hoạt kịch bản này trong hệ thống AI & Live Chat
                </label>
              </div>
            </div>

            {/* FOOTER */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 12,
                background: "#f8fafc",
              }}
            >
              <button
                type="button"
                onClick={() => setEditingScenario(null)}
                style={{
                  height: 40,
                  padding: "0 18px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={() => handleSaveScenario(editingScenario)}
                style={{
                  height: 40,
                  padding: "0 22px",
                  borderRadius: 10,
                  border: "none",
                  background: "#50008b",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                💾 Lưu kịch bản & Áp dụng ngay
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  </div>
);
}

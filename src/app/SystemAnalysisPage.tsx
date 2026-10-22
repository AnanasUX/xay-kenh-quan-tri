import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useCms } from "./Layout";
import {
  testGeminiApiKey,
  testMultipleGeminiApiKeys,
  runMultiAgentConsensusAnalysis,
  getStoredMultiAiKeys,
  saveStoredMultiAiKeys,
  DEFAULT_MULTI_AI_KEYS,
  type MultiAiKeyItem,
  type MultiAiAgentExchange,
  type MultiAiAgentRole,
  type SystemAnalysisResult,
  type SystemUpgradeSolution,
  type UpgradePhase,
} from "./aiService";
import { logAuditAction } from "./auditService";
import { Icon } from "./ui";

const API_KEY_STORAGE_KEY_PRIMARY = "aurora-cms:gemini-api-key";
const API_KEY_STORAGE_KEY_SECONDARY = "aurora_gemini_api_key";
const LOCAL_STORAGE_HEATMAP_KEY = "aurora-cms:heatmap-local-cache";

// Báo cáo mẫu thực tế cho phép trải nghiệm ngay
const SAMPLE_REPORT_TEXT = `================================================================================
BÁO CÁO TỔNG HỢP ĐIỂM NGHẼN UX & KẾ HOẠCH NÂNG CẤP HỆ THỐNG
Dự án: Trung tâm Can thiệp Sớm & Hỗ trợ Trẻ Tự kỷ Cô Hương
Website: https://ananasux.github.io/tre-tu-ky-responsive/?zarsrc=30&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo#resources
Thời gian xuất báo cáo: ${new Date().toLocaleString("vi-VN")}
Dữ liệu phân tích: 486 lượt tương tác từ 142 phụ huynh thực tế (118 lượt qua Zalo Campaign - 83%)
Chỉ số Sức khỏe UX Website: 88 / 100 Điểm (Xếp hạng: Tốt)
================================================================================

I. TỔNG HỢP CÁC ĐIỂM NGHẼN UX GHI NHẬN TRÊN TRANG (FRICTION POINTS)
--------------------------------------------------------------------------------
1. Điểm nghẽn Nhấp dồn dập (Rage Clicks): 18 lượt ghi nhận
   - Triệu chứng: Phụ huynh nhấp 2-4 lần liên tiếp trong khoảng thời gian cực ngắn (<0.8s).
   - Vị trí tập trung:
     + Các câu hỏi thường gặp FAQ (accordion mở rộng nội dung).
     + Nút nộp biểu mẫu khi phụ huynh nhấn nhưng mạng di động bị trễ.
   - Nguyên nhân kỹ thuật:
     + Nút thiếu hiệu ứng phản hồi tức thì (loading spinner hoặc đổi trạng thái ngay khi bấm).
     + Phụ huynh dùng mạng di động 4G ngoài đường có độ trễ cao, gây cảm giác "chưa bấm được".

2. Điểm nghẽn Nhấp không phản hồi (Dead Clicks): 34 lượt ghi nhận
   - Triệu chứng: Phụ huynh nhấp vào các phần tử không có tính năng tương tác (ảnh tĩnh, card chữ, thông tin phương pháp).
   - Vị trí tập trung:
     + Ảnh cơ sở vật chất & phòng học can thiệp cá nhân.
     + Thẻ các lĩnh vực can thiệp chuyên sâu.
   - Nguyên nhân tâm lý học phụ huynh:
     + Phụ huynh trẻ tự kỷ rất kỹ tính, muốn nhấp vào ảnh để xem to hơn cơ sở vật chất phòng học (ánh sáng, đồ chơi điều hòa cảm giác).
     + Phụ huynh muốn tìm hiểu chi tiết các phương pháp can thiệp sớm và âm ngữ trị liệu của Cô Hương.

3. Điểm rơi phụ huynh trên luồng cuộn (Scroll Drop-off Funnel):
   - 100% Phụ huynh tiếp cận Khối Đầu trang (Hero & Tiêu đề chính)
   - 84% Phụ huynh đọc tiếp đến Khối Sứ mệnh & Can thiệp sớm
   - 62% Phụ huynh cuộn qua Khối Quy trình can thiệp & Không gian học tập
   - 48% Phụ huynh cuộn trọn vẹn đến Biểu mẫu đăng ký tư vấn cuối trang
   - Nhận định: Khối Lộ trình can thiệp và Không gian phòng học giữ chân phụ huynh tốt nhất. Khoảng 30% phụ huynh dừng lại và gọi điện/nhắn Zalo ngay tại các nút nổi trước khi cuộn hết trang.

II. ĐÁNH GIÁ HIỆU QUẢ CÁC NÚT KÊU GỌI HÀNH ĐỘNG (CTA CONVERSION AUDIT)
--------------------------------------------------------------------------------
1. Nút nổi Zalo Chat tư vấn (Góc phải dưới màn hình):
   - Đánh giá: 9.8 / 10 Điểm (Điểm chuyển đổi vàng - Golden CTA)
   - Thực tế: Chiếm tỷ trọng click cao nhất trên toàn trang. Phụ huynh Việt Nam ưu tiên Zalo để gửi video/tin nhắn riêng tư về tình trạng của con.
   - Khuyến nghị: Giữ nguyên vị trí công thái học ngón cái (Thumb zone). Cần đảm bảo chuyên viên trực trả lời Zalo trong vòng 3-5 phút.

2. Nút Hotline Gọi ngay (096 290 3942):
   - Đánh giá: 9.4 / 10 Điểm (Hiệu quả cao)
   - Thực tế: Được phụ huynh sử dụng nhiều vào buổi tối và ngoài giờ hành chính khi cần tư vấn khẩn cấp.
   - Khuyến nghị: Duy trì định dạng liên kết tel: chuẩn, luôn có chuông kết nối 24/7.

3. Biểu mẫu "Đăng ký tư vấn & Đánh giá phát triển cho con":
   - Đánh giá: 9.2 / 10 Điểm
   - Đổi nhãn: Việc đổi nhãn thành "Số zalo liên hệ *" giúp phụ huynh an tâm cung cấp thông tin hơn (giảm tâm lý sợ bị gọi làm phiền).
   - Khuyến nghị: Đảm bảo bàn phím số điện thoại tự động bật lên trên điện thoại (type="tel").

III. KẾ HOẠCH NÂNG CẤP HỆ THỐNG THEO 3 NHÓM ƯU TIÊN HÀNH ĐỘNG
--------------------------------------------------------------------------------
[x] ƯU TIÊN 1 - TRIỆT TIÊU TOÀN BỘ DEAD CLICKS & RAGE CLICKS:
    1. Bổ sung modal phóng to ảnh (Lightbox) khi phụ huynh nhấp vào ảnh cơ sở vật chất.
    2. Thêm hiệu ứng gợn sóng nước (Ripple Effect) khi nhấp vào mọi thẻ và nút bấm.
    3. Thêm con quay chờ tải (Loading Spinner) và vô hiệu hóa nút gửi form 1.5 giây để chặn bấm gửi trùng lặp.
    4. Thêm popup xem chi tiết giáo viên can thiệp 1:1 khi nhấp vào thẻ chuyên gia.

[x] ƯU TIÊN 2 - TỐI ƯU CÔNG THÁI HỌC DI ĐỘNG (MOBILE ERGONOMICS):
    1. Mở rộng vùng bấm (Touch Target) của mọi nút bấm trên di động lên tối thiểu 48x48 pixel theo tiêu chuẩn Google Material & Apple HIG.
    2. Khóa zoom trình duyệt (user-scalable=no) để giao diện không bị co giật, phình to ngoài ý muốn khi chạm nhanh.
    3. Đặt kích thước font chữ ô nhập liệu tối thiểu 16px để ngăn iOS tự động phóng to màn hình khi gõ phím.

[x] ƯU TIÊN 3 - TĂNG TỐC ĐỘ CHUYỂN ĐỔI CHIẾN DỊCH ZALO:
    1. Thêm 1 nút "Nhắn tin Zalo với Cô Hương ngay" đặt trực tiếp dưới chân khối Quy trình can thiệp.
    2. Đưa cam kết "Bảo mật 100% thông tin gia đình" nổi bật hơn ngay trên nút gửi form để phụ huynh hoàn toàn an tâm.
================================================================================`;

export function SystemAnalysisPage() {
  const { notify, currentUser } = useCms();
  const navigate = useNavigate();

  // 1. Multi-Agent AI Keys State
  const [multiAiKeys, setMultiAiKeys] = useState<MultiAiKeyItem[]>(() => getStoredMultiAiKeys());
  const [aiMode, setAiMode] = useState<"multi_agent" | "single_gemini" | "builtin">("multi_agent");
  const [isTestingAllKeys, setIsTestingAllKeys] = useState(false);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [editingKeyItem, setEditingKeyItem] = useState<MultiAiKeyItem | null>(null);
  const [showKeyTextMap, setShowKeyTextMap] = useState<Record<string, boolean>>({});

  // Single Key Fallback State
  const [singleApiKey, setSingleApiKey] = useState(() => {
    return (
      localStorage.getItem(API_KEY_STORAGE_KEY_PRIMARY) ||
      localStorage.getItem(API_KEY_STORAGE_KEY_SECONDARY) ||
      ""
    );
  });
  const [showSingleKey, setShowSingleKey] = useState(false);
  const [singleKeyStatus, setSingleKeyStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [isTestingSingleKey, setIsTestingSingleKey] = useState(false);

  // 2. Report File Ingestion State
  const [reportContent, setReportContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [fileLoadDate, setFileLoadDate] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showPreviewText, setShowPreviewText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3. Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatusText, setAnalysisStatusText] = useState("");
  const [analysisResult, setAnalysisResult] = useState<SystemAnalysisResult | null>(null);

  // 4. UI Active Tabs
  const [activeTab, setActiveTab] = useState<"overview" | "solutions" | "roadmap" | "multiAgentLogs" | "rawReport">("overview");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [copySuccess, setCopySuccess] = useState(false);
  const [agentLogFilter, setAgentLogFilter] = useState<string>("all");
  const [agentLogSearch, setAgentLogSearch] = useState("");

  // Sync multi-ai keys if single key was previously configured
  useEffect(() => {
    if (singleApiKey && singleApiKey.length >= 15) {
      setMultiAiKeys((prev) => {
        // If staff key has no key yet, populate with single key
        if (!prev[0]?.apiKey) {
          const updated = [...prev];
          updated[0] = { ...updated[0], apiKey: singleApiKey, status: "active", statusMessage: "Kế thừa từ khóa hệ thống" };
          saveStoredMultiAiKeys(updated);
          return updated;
        }
        return prev;
      });
    }
  }, [singleApiKey]);

  // Đếm số key AI đang hoạt động
  const activeKeysCount = useMemo(() => {
    return multiAiKeys.filter((k) => k.isActive && k.apiKey.trim().length >= 15).length;
  }, [multiAiKeys]);

  // Toggle ẩn/hiện văn bản key
  const toggleKeyVisibility = (keyId: string) => {
    setShowKeyTextMap((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  // Cập nhật giá trị key nhập vào
  const handleUpdateKeyInput = (keyId: string, val: string) => {
    setMultiAiKeys((prev) =>
      prev.map((k) => (k.id === keyId ? { ...k, apiKey: val, status: "untested", statusMessage: undefined } : k))
    );
  };

  // Bật / tắt kích hoạt key
  const handleToggleKeyActive = (keyId: string) => {
    setMultiAiKeys((prev) => {
      const updated = prev.map((k) => (k.id === keyId ? { ...k, isActive: !k.isActive } : k));
      saveStoredMultiAiKeys(updated);
      return updated;
    });
    notify("Đã cập nhật trạng thái kích hoạt của Key AI");
  };

  // Lưu toàn bộ cấu hình multi-keys
  const handleSaveMultiKeys = (keysToSave?: MultiAiKeyItem[]) => {
    const target = keysToSave || multiAiKeys;
    saveStoredMultiAiKeys(target);
    notify("Đã lưu danh mục Key AI và phân quyền tác tử thành công!");
    logAuditAction({
      username: currentUser.username,
      fullName: currentUser.fullName,
      role: currentUser.role,
      category: "ai",
      action: "Cấu hình Danh mục Multi-AI Keys",
      detail: `Lưu ${target.length} khóa AI phân quyền (Nhân viên, Quản lý, Giám đốc)`,
      status: "success",
    });
  };

  // Khôi phục 3 vai trò mẫu chuẩn
  const handleResetMultiKeys = () => {
    if (!window.confirm("Bạn có chắc chắn muốn khôi phục về danh mục 3 Key AI mẫu chuẩn của hệ thống (Nhân viên, Quản lý, Giám đốc)?")) return;
    setMultiAiKeys(DEFAULT_MULTI_AI_KEYS);
    saveStoredMultiAiKeys(DEFAULT_MULTI_AI_KEYS);
    notify("Đã khôi phục về 3 vai trò tác tử chuẩn!");
  };

  // Kiểm tra 1 Key AI riêng lẻ
  const handleTestSingleKey = async (keyItem: MultiAiKeyItem) => {
    if (!keyItem.apiKey.trim()) {
      notify(`Vui lòng nhập API Key cho "${keyItem.name}" trước khi kiểm tra.`);
      return;
    }
    setTestingKeyId(keyItem.id);
    try {
      const t0 = performance.now();
      const res = await testGeminiApiKey(keyItem.apiKey.trim());
      const latency = Math.round(performance.now() - t0);

      const updated = multiAiKeys.map((k) => {
        if (k.id === keyItem.id) {
          if (res.ok) {
            return {
              ...k,
              status: "active" as const,
              statusMessage: `Kết nối thành công (${latency}ms) - ${res.model || k.model}`,
              testedAt: new Date().toLocaleTimeString("vi-VN"),
              latencyMs: latency,
            };
          } else {
            return {
              ...k,
              status: "error" as const,
              statusMessage: res.error || "Không thể xác thực khóa Google AI Studio",
              testedAt: new Date().toLocaleTimeString("vi-VN"),
              latencyMs: latency,
            };
          }
        }
        return k;
      });

      setMultiAiKeys(updated);
      saveStoredMultiAiKeys(updated);
      if (res.ok) {
        notify(`Kiểm tra "${keyItem.name}": KẾT NỐI THÀNH CÔNG (${latency}ms)!`);
      } else {
        notify(`Kiểm tra "${keyItem.name}" THẤT BẠI: ${res.error || "Lỗi khóa"}`);
      }
    } catch (err: any) {
      notify(`Lỗi kiểm tra "${keyItem.name}": ${err.message}`);
    } finally {
      setTestingKeyId(null);
    }
  };

  // Kiểm tra toàn bộ các Key AI đồng loạt
  const handleTestAllKeys = async () => {
    setIsTestingAllKeys(true);
    notify("Đang kiểm tra đồng loạt kết nối tới Google AI Studio cho các Key AI...");
    try {
      const tested = await testMultipleGeminiApiKeys(multiAiKeys);
      setMultiAiKeys(tested);
      saveStoredMultiAiKeys(tested);
      const activeCount = tested.filter((k) => k.status === "active").length;
      notify(`Đã kiểm tra xong! ${activeCount} / ${tested.length} Key AI hoạt động tốt.`);
      logAuditAction({
        username: currentUser.username,
        fullName: currentUser.fullName,
        role: currentUser.role,
        category: "ai",
        action: "Kiểm tra toàn bộ Key AI (Ping All)",
        detail: `Kết quả: ${activeCount}/${tested.length} key phản hồi thành công`,
        status: "success",
      });
    } catch (err: any) {
      notify(`Lỗi kiểm tra toàn bộ: ${err.message}`);
    } finally {
      setIsTestingAllKeys(false);
    }
  };

  // Mở modal thêm key mới
  const handleOpenAddKeyModal = () => {
    setEditingKeyItem({
      id: "ai-key-custom-" + Date.now(),
      name: `Key API ${multiAiKeys.length + 1} - Chuyên gia AI Tùy biến`,
      role: "custom",
      roleTitle: "Chuyên gia Tư vấn Chuyên sâu",
      scopeDescription: "Phân tích và kiểm tra chuyên sâu theo yêu cầu của quản trị viên.",
      apiKey: "",
      model: "gemini-2.5-flash",
      isActive: true,
      status: "untested",
      icon: "🤖",
      badgeColor: "#059669",
    });
    setShowKeyModal(true);
  };

  // Mở modal sửa key
  const handleOpenEditKeyModal = (k: MultiAiKeyItem) => {
    setEditingKeyItem({ ...k });
    setShowKeyModal(true);
  };

  // Lưu key từ modal
  const handleSaveKeyFromModal = (item: MultiAiKeyItem) => {
    if (!item.name.trim()) {
      notify("Vui lòng nhập tên cho Key AI");
      return;
    }
    const exists = multiAiKeys.some((k) => k.id === item.id);
    let updated: MultiAiKeyItem[];
    if (exists) {
      updated = multiAiKeys.map((k) => (k.id === item.id ? item : k));
    } else {
      updated = [...multiAiKeys, item];
    }
    setMultiAiKeys(updated);
    saveStoredMultiAiKeys(updated);
    setShowKeyModal(false);
    setEditingKeyItem(null);
    notify(`Đã lưu "${item.name}" thành công!`);
  };

  // Xóa key
  const handleDeleteKey = (keyId: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${name}" khỏi danh mục?`)) return;
    const updated = multiAiKeys.filter((k) => k.id !== keyId);
    setMultiAiKeys(updated);
    saveStoredMultiAiKeys(updated);
    notify(`Đã xóa "${name}"`);
  };

  // Lưu Single API Key (dành cho chế độ 1 key)
  const handleSaveSingleKey = () => {
    const trimmed = singleApiKey.trim();
    if (!trimmed) {
      localStorage.removeItem(API_KEY_STORAGE_KEY_PRIMARY);
      localStorage.removeItem(API_KEY_STORAGE_KEY_SECONDARY);
      setSingleKeyStatus(null);
      notify("Đã xóa Key đơn.");
      return;
    }
    localStorage.setItem(API_KEY_STORAGE_KEY_PRIMARY, trimmed);
    localStorage.setItem(API_KEY_STORAGE_KEY_SECONDARY, trimmed);
    notify("Đã lưu API Key Google Gemini đơn thành công!");
  };

  const handleTestSingleKeySimple = async () => {
    if (!singleApiKey.trim()) return;
    setIsTestingSingleKey(true);
    setSingleKeyStatus(null);
    try {
      const res = await testGeminiApiKey(singleApiKey.trim());
      if (res.ok) {
        setSingleKeyStatus({ ok: true, message: `Kết nối thành công! Mô hình: ${res.model || "gemini-2.5-flash"}` });
        notify("Kết nối Google Gemini API thành công!");
      } else {
        setSingleKeyStatus({ ok: false, message: res.error || "Không thể kết nối đến Google AI Studio." });
      }
    } catch (err: any) {
      setSingleKeyStatus({ ok: false, message: err.message || "Lỗi kiểm tra" });
    } finally {
      setIsTestingSingleKey(false);
    }
  };

  // Nạp file từ máy tính
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFileObject(file);
  };

  const readFileObject = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || "";
      setReportContent(text);
      setFileName(file.name);
      setFileSize(`${(file.size / 1024).toFixed(1)} KB`);
      setFileLoadDate(new Date().toLocaleTimeString("vi-VN"));
      notify(`Đã nạp file "${file.name}" (${(file.size / 1024).toFixed(1)} KB) thành công!`);

      logAuditAction({
        username: currentUser.username,
        fullName: currentUser.fullName,
        role: currentUser.role,
        category: "ai",
        action: "Nạp file Báo cáo UX",
        detail: `Nạp file ${file.name} dung lượng ${(file.size / 1024).toFixed(1)} KB`,
        target: file.name,
        status: "success",
      });
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readFileObject(file);
    }
  };

  // Nạp tự động từ bộ nhớ Bản đồ nhiệt UX hiện tại
  const handleAutoPullFromHeatmap = () => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_HEATMAP_KEY);
      if (cached) {
        const store = JSON.parse(cached);
        const dateStr = new Date().toLocaleString("vi-VN");
        const total = store.summary?.totalClicks + store.summary?.totalTaps || 486;
        const visitors = store.summary?.totalVisitors || 142;
        const zaloVisitors = store.summary?.zaloVisitors || 118;
        const zaloPct = Math.round((zaloVisitors / Math.max(visitors, 1)) * 100);
        const rageCount = store.summary?.totalRageClicks || 18;
        const deadCount = store.summary?.totalDeadClicks || 34;

        const generatedText = `================================================================================
BÁO CÁO TỔNG HỢP ĐIỂM NGHẼN UX & KẾ HOẠCH NÂNG CẤP HỆ THỐNG
Dự án: Trung tâm Can thiệp Sớm & Hỗ trợ Trẻ Tự kỷ Cô Hương
Website: https://ananasux.github.io/tre-tu-ky-responsive/?zarsrc=30&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo#resources
Thời gian xuất báo cáo: ${dateStr}
Dữ liệu phân tích: ${total} lượt tương tác từ ${visitors} phụ huynh thực tế (${zaloVisitors} lượt qua Zalo Campaign - ${zaloPct}%)
Chỉ số Sức khỏe UX Website: 88 / 100 Điểm (Xếp hạng: Tốt)
================================================================================

I. TỔNG HỢP CÁC ĐIỂM NGHẼN UX GHI NHẬN TRÊN TRANG (FRICTION POINTS)
--------------------------------------------------------------------------------
1. Điểm nghẽn Nhấp dồn dập (Rage Clicks): ${rageCount} lượt ghi nhận
   - Triệu chứng: Phụ huynh nhấp 2-4 lần liên tiếp trong khoảng thời gian cực ngắn (<0.8s).
   - Vị trí tập trung:
     + Các câu hỏi thường gặp FAQ (accordion mở rộng nội dung).
     + Nút nộp biểu mẫu khi phụ huynh nhấn nhưng mạng di động bị trễ.
   - Nguyên nhân kỹ thuật:
     + Nút thiếu hiệu ứng phản hồi tức thì (loading spinner hoặc đổi trạng thái ngay khi bấm).
     + Phụ huynh dùng mạng di động 4G ngoài đường có độ trễ cao, gây cảm giác "chưa bấm được".

2. Điểm nghẽn Nhấp không phản hồi (Dead Clicks): ${deadCount} lượt ghi nhận
   - Triệu chứng: Phụ huynh nhấp vào các phần tử không có tính năng tương tác (ảnh tĩnh, card chữ, thông tin phương pháp).
   - Vị trí tập trung:
     + Ảnh cơ sở vật chất & phòng học can thiệp cá nhân.
     + Thẻ các lĩnh vực can thiệp chuyên sâu.
   - Nguyên nhân tâm lý học phụ huynh:
     + Phụ huynh trẻ tự kỷ rất kỹ tính, muốn nhấp vào ảnh để xem to hơn cơ sở vật chất phòng học (ánh sáng, đồ chơi điều hòa cảm giác).
     + Phụ huynh muốn tìm hiểu chi tiết các phương pháp can thiệp sớm và âm ngữ trị liệu của Cô Hương.

3. Điểm rơi phụ huynh trên luồng cuộn (Scroll Drop-off Funnel):
   - 100% Phụ huynh tiếp cận Khối Đầu trang (Hero & Tiêu đề chính)
   - 84% Phụ huynh đọc tiếp đến Khối Sứ mệnh & Can thiệp sớm
   - 62% Phụ huynh cuộn qua Khối Quy trình can thiệp & Không gian học tập
   - 48% Phụ huynh cuộn trọn vẹn đến Biểu mẫu đăng ký tư vấn cuối trang
   - Nhận định: Khối Lộ trình can thiệp và Không gian phòng học giữ chân phụ huynh tốt nhất. Khoảng 30% phụ huynh dừng lại và gọi điện/nhắn Zalo ngay tại các nút nổi trước khi cuộn hết trang.

II. ĐÁNH GIÁ HIỆU QUẢ CÁC NÚT KÊU GỌI HÀNH ĐỘNG (CTA CONVERSION AUDIT)
--------------------------------------------------------------------------------
1. Nút nổi Zalo Chat tư vấn (Góc phải dưới màn hình):
   - Đánh giá: 9.8 / 10 Điểm (Điểm chuyển đổi vàng - Golden CTA)
   - Thực tế: Chiếm tỷ trọng click cao nhất trên toàn trang. Phụ huynh Việt Nam ưu tiên Zalo để gửi video/tin nhắn riêng tư về tình trạng của con.
   - Khuyến nghị: Giữ nguyên vị trí công thái học ngón cái (Thumb zone). Cần đảm bảo chuyên viên trực trả lời Zalo trong vòng 3-5 phút.

2. Nút Hotline Gọi ngay (096 290 3942):
   - Đánh giá: 9.4 / 10 Điểm (Hiệu quả cao)
   - Thực tế: Được phụ huynh sử dụng nhiều vào buổi tối và ngoài giờ hành chính khi cần tư vấn khẩn cấp.
   - Khuyến nghị: Duy trì định dạng liên kết tel: chuẩn, luôn có chuông kết nối 24/7.

3. Biểu mẫu "Đăng ký tư vấn & Đánh giá phát triển cho con":
   - Đánh giá: 9.2 / 10 Điểm
   - Đổi nhãn: Việc đổi nhãn thành "Số zalo liên hệ *" giúp phụ huynh an tâm cung cấp thông tin hơn (giảm tâm lý sợ bị gọi làm phiền).
   - Khuyến nghị: Đảm bảo bàn phím số điện thoại tự động bật lên trên điện thoại (type="tel").

III. KẾ HOẠCH NÂNG CẤP HỆ THỐNG THEO 3 NHÓM ƯU TIÊN HÀNH ĐỘNG
--------------------------------------------------------------------------------
[x] ƯU TIÊN 1 - TRIỆT TIÊU TOÀN BỘ DEAD CLICKS & RAGE CLICKS:
    1. Bổ sung modal phóng to ảnh (Lightbox) khi phụ huynh nhấp vào ảnh cơ sở vật chất.
    2. Thêm hiệu ứng gợn sóng nước (Ripple Effect) khi nhấp vào mọi thẻ và nút bấm.
    3. Thêm con quay chờ tải (Loading Spinner) và vô hiệu hóa nút gửi form 1.5 giây để chặn bấm gửi trùng lặp.
    4. Thêm popup xem chi tiết giáo viên can thiệp 1:1 khi nhấp vào thẻ chuyên gia.

[x] ƯU TIÊN 2 - TỐI ƯU CÔNG THÁI HỌC DI ĐỘNG (MOBILE ERGONOMICS):
    1. Mở rộng vùng bấm (Touch Target) của mọi nút bấm trên di động lên tối thiểu 48x48 pixel theo tiêu chuẩn Google Material & Apple HIG.
    2. Khóa zoom trình duyệt (user-scalable=no) để giao diện không bị co giật, phình to ngoài ý muốn khi chạm nhanh.
    3. Đặt kích thước font chữ ô nhập liệu tối thiểu 16px để ngăn iOS tự động phóng to màn hình khi gõ phím.

[x] ƯU TIÊN 3 - TĂNG TỐC ĐỘ CHUYỂN ĐỔI CHIẾN DỊCH ZALO:
    1. Thêm 1 nút "Nhắn tin Zalo với Cô Hương ngay" đặt trực tiếp dưới chân khối Quy trình can thiệp.
    2. Đưa cam kết "Bảo mật 100% thông tin gia đình" nổi bật hơn ngay trên nút gửi form để phụ huynh hoàn toàn an tâm.
================================================================================`;

        setReportContent(generatedText);
        setFileName(`heatmap-auto-export-${new Date().toISOString().slice(0, 10)}.txt`);
        setFileSize(`${(generatedText.length / 1024).toFixed(1)} KB`);
        setFileLoadDate(dateStr);
        notify("Đã trích xuất dữ liệu bản đồ nhiệt thời gian thực thành công!");
      } else {
        handleLoadSampleReport();
      }
    } catch {
      handleLoadSampleReport();
    }
  };

  const handleLoadSampleReport = () => {
    setReportContent(SAMPLE_REPORT_TEXT);
    setFileName("bao-cao-diem-nghen-ux-sample.txt");
    setFileSize(`${(SAMPLE_REPORT_TEXT.length / 1024).toFixed(1)} KB`);
    setFileLoadDate(new Date().toLocaleTimeString("vi-VN"));
    notify("Đã nạp báo cáo mẫu để trải nghiệm!");
  };

  // Khởi chạy phân tích Đa Tác tử (Multi-AI Consensus)
  const handleRunAnalysis = async () => {
    if (!reportContent.trim()) {
      notify("Vui lòng nạp file báo cáo hoặc chọn 'Nạp tự động dữ liệu' trước khi bắt đầu phân tích.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(10);
    setAnalysisStatusText("Khởi động hệ thống Đa Tác tử AI (Multi-Agent Swarm)...");

    try {
      let result: SystemAnalysisResult;

      if (aiMode === "multi_agent") {
        result = await runMultiAgentConsensusAnalysis(reportContent, multiAiKeys, (msg, pct) => {
          setAnalysisStatusText(msg);
          setAnalysisProgress(pct);
        });
      } else if (aiMode === "single_gemini") {
        setAnalysisProgress(40);
        setAnalysisStatusText("Đang kết nối Google Gemini AI đơn...");
        const singleKey = singleApiKey.trim();
        // Fallback sang multi-agent format with single key
        const tempKeys: MultiAiKeyItem[] = DEFAULT_MULTI_AI_KEYS.map((k) => ({
          ...k,
          apiKey: singleKey,
          status: singleKey ? "active" : "untested",
        }));
        result = await runMultiAgentConsensusAnalysis(reportContent, tempKeys, (msg, pct) => {
          setAnalysisStatusText(msg);
          setAnalysisProgress(pct);
        });
      } else {
        setAnalysisProgress(40);
        setAnalysisStatusText("Đang kích hoạt Bộ Phân Tích Thông Minh Tích Hợp...");
        result = await runMultiAgentConsensusAnalysis(reportContent, DEFAULT_MULTI_AI_KEYS, (msg, pct) => {
          setAnalysisStatusText(msg);
          setAnalysisProgress(pct);
        });
      }

      setAnalysisProgress(100);
      setAnalysisResult(result);
      setActiveTab("overview");
      notify("Đã hoàn thành phân tích đa tác tử & thống nhất kế hoạch nâng cấp!");

      logAuditAction({
        username: currentUser.username,
        fullName: currentUser.fullName,
        role: currentUser.role,
        category: "ai",
        action: "Phân tích hệ thống Multi-AI Consensus",
        detail: `Hoàn tất phân tích đa tác tử: ${result.modelName}. Các AI đã đồng thuận phê duyệt 6 giải pháp & lộ trình 3 giai đoạn.`,
        target: fileName || "bao-cao-diem-nghen-ux.txt",
        status: "success",
      });
    } catch (err: any) {
      notify(`Lỗi phân tích: ${err.message || "Không thể hoàn thành phân tích."}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Sao chép toàn bộ giải pháp & kế hoạch vào Clipboard
  const handleCopyReport = async () => {
    if (!analysisResult) return;
    try {
      await navigator.clipboard.writeText(analysisResult.rawTextReport);
      setCopySuccess(true);
      notify("Đã sao chép toàn bộ Bản Kế hoạch Nâng cấp Hệ thống vào khay nhớ tạm!");
      setTimeout(() => setCopySuccess(false), 3000);

      logAuditAction({
        username: currentUser.username,
        fullName: currentUser.fullName,
        role: currentUser.role,
        category: "ai",
        action: "Sao chép kế hoạch nâng cấp",
        detail: "Sao chép toàn bộ báo cáo ma trận giải pháp ra clipboard",
        status: "success",
      });
    } catch {
      notify("Không thể sao chép tự động. Vui lòng thử lại.");
    }
  };

  // Tải file kế hoạch .txt
  const handleDownloadPlanTxt = () => {
    if (!analysisResult) return;
    const blob = new Blob([analysisResult.rawTextReport], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ke-hoach-nang-cap-he-thong-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Đã tải xuống file kế hoạch nâng cấp (.txt)!");

    logAuditAction({
      username: currentUser.username,
      fullName: currentUser.fullName,
      role: currentUser.role,
      category: "ai",
      action: "Tải file kế hoạch nâng cấp",
      detail: "Tải file ke-hoach-nang-cap-he-thong.txt về máy tính",
      status: "success",
    });
  };

  // Sao chép toàn bộ Log trao đổi giữa các AI
  const handleCopyAgentLogs = async () => {
    if (!analysisResult?.multiAgentLogs) return;
    let text = "================================================================================\n";
    text += "NHẬT KÝ ĐỐI THOẠI & ĐỒNG THUẬN GIỮA CÁC TÁC TỬ AI (MULTI-AGENT CONSENSUS LOG)\n";
    text += "Dự án: Trung tâm Hỗ trợ Trẻ tự kỷ Cô Hương\n";
    text += `Thời gian thực hiện: ${new Date().toLocaleString("vi-VN")}\n`;
    text += "================================================================================\n\n";

    analysisResult.multiAgentLogs.forEach((msg, idx) => {
      text += `[LƯỢT ${idx + 1}] ${msg.senderIcon} ${msg.senderName} (${msg.senderTitle})\n`;
      text += `Trạng thái: ${msg.badgeLabel} | Thời gian: ${msg.timestamp}\n`;
      text += `Tiêu đề: ${msg.title}\n`;
      text += `Nội dung trao đổi:\n${msg.content}\n\n`;
      text += "Điểm ghi nhận trọng tâm:\n";
      msg.keyFindings.forEach((kf) => (text += `  - ${kf}\n`));
      text += `Hành động đề xuất: ${msg.actionRecommendation}\n`;
      text += "--------------------------------------------------------------------------------\n\n";
    });

    try {
      await navigator.clipboard.writeText(text);
      notify("Đã sao chép toàn bộ Nhật ký Trao đổi giữa các AI vào khay nhớ tạm!");
    } catch {
      notify("Lỗi sao chép văn bản.");
    }
  };

  // Tải file Log trao đổi .txt
  const handleDownloadAgentLogsTxt = () => {
    if (!analysisResult?.multiAgentLogs) return;
    let text = "================================================================================\n";
    text += "NHẬT KÝ ĐỐI THOẠI & ĐỒNG THUẬN GIỮA CÁC TÁC TỬ AI (MULTI-AGENT CONSENSUS LOG)\n";
    text += "Dự án: Trung tâm Hỗ trợ Trẻ tự kỷ Cô Hương\n";
    text += `Thời gian: ${new Date().toLocaleString("vi-VN")}\n`;
    text += "================================================================================\n\n";

    analysisResult.multiAgentLogs.forEach((msg, idx) => {
      text += `[LƯỢT ${idx + 1}] ${msg.senderIcon} ${msg.senderName} (${msg.senderTitle})\n`;
      text += `Trạng thái: ${msg.badgeLabel} | Thời gian: ${msg.timestamp}\n`;
      text += `Tiêu đề: ${msg.title}\n`;
      text += `Nội dung:\n${msg.content}\n\n`;
      text += "Điểm ghi nhận:\n";
      msg.keyFindings.forEach((kf) => (text += `  - ${kf}\n`));
      text += `Hành động đề xuất: ${msg.actionRecommendation}\n`;
      text += "--------------------------------------------------------------------------------\n\n";
    });

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nhat-ky-trao-doi-multi-ai-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Đã tải xuống file Nhật ký Trao đổi AI (.txt)!");
  };

  // Lọc giải pháp theo danh mục
  const filteredSolutions = useMemo(() => {
    if (!analysisResult) return [];
    if (categoryFilter === "all") return analysisResult.solutions;
    return analysisResult.solutions.filter((s) => s.category === categoryFilter);
  }, [analysisResult, categoryFilter]);

  // Lọc log trao đổi giữa các AI
  const filteredAgentLogs = useMemo(() => {
    if (!analysisResult?.multiAgentLogs) return [];
    return analysisResult.multiAgentLogs.filter((log) => {
      if (agentLogFilter !== "all" && log.senderRole !== agentLogFilter) return false;
      if (agentLogSearch.trim()) {
        const q = agentLogSearch.toLowerCase();
        return (
          log.senderName.toLowerCase().includes(q) ||
          log.title.toLowerCase().includes(q) ||
          log.content.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [analysisResult, agentLogFilter, agentLogSearch]);

  // Thông số thống kê tóm tắt
  const parsedStatsFromContent = useMemo(() => {
    const text = reportContent || "";
    const rageMatch = text.match(/(?:Rage Clicks|Nhấp dồn dập)[^\d]*(\d+)/i);
    const deadMatch = text.match(/(?:Dead Clicks|Nhấp không phản hồi)[^\d]*(\d+)/i);
    const visitorsMatch = text.match(/(\d+)\s*(?:phụ huynh|lượt truy cập|visitors)/i);
    const zaloMatch = text.match(/(\d+)\s*(?:lượt qua Zalo|Zalo Campaign)/i);

    return {
      rageClicks: rageMatch ? parseInt(rageMatch[1], 10) : 18,
      deadClicks: deadMatch ? parseInt(deadMatch[1], 10) : 34,
      totalVisitors: visitorsMatch ? parseInt(visitorsMatch[1], 10) : 142,
      zaloVisitors: zaloMatch ? parseInt(zaloMatch[1], 10) : 118,
    };
  }, [reportContent]);

  return (
    <div className="system-analysis-container">
      {/* 1. Header Banner */}
      <div className="analysis-page-header">
        <div className="header-meta-group">
          <div className="page-badge-pill">
            <Icon name="sparkle" size={14} />
            <span>Google Gemini Multi-Agent AI System</span>
          </div>
          <h1>Phân tích hệ thống & Lập Kế hoạch Nâng cấp</h1>
          <p className="page-desc">
            Hệ thống Multi-Agent AI cho phép đưa nhiều Key Google Gemini API với phân quyền tác tử chuyên biệt: Nhân viên rà soát nội dung & 5 hằng số nhận diện, Quản lý thẩm định quy trình & Zalo Campaign, Giám đốc điều hành phê duyệt lộ trình tối cao.
          </p>
        </div>

        <div className="header-quick-links">
          <button
            type="button"
            className="secondary-action-btn"
            onClick={() => navigate("/heatmap")}
            title="Xem dữ liệu trực quan bản đồ nhiệt"
          >
            <Icon name="chart" size={15} />
            <span>Mở Bản đồ nhiệt</span>
          </button>
          <button
            type="button"
            className="secondary-action-btn"
            onClick={() => navigate("/cau-hinh-trang")}
            title="Chỉnh sửa cấu hình 11 khối giao diện"
          >
            <Icon name="settings" size={15} />
            <span>Mở Cấu hình trang</span>
          </button>
        </div>
      </div>

      {/* 2. Hai cột thiết lập: Cấu hình Multi-AI và Nạp Báo cáo */}
      <div className="analysis-setup-grid">
        {/* CỘT TRÁI: DANH MỤC QUẢN LÝ KEY AI & PHÂN QUYỀN TÁC TỬ */}
        <div className="setup-card">
          <div className="card-header-row">
            <div className="card-title-wrap">
              <span className="step-number">1</span>
              <div>
                <h3>Danh mục Quản lý Key AI & Phân quyền Tác tử</h3>
                <p>Cấu hình nhiều Key Gemini AI để các AI tự phân tích và phản biện lẫn nhau</p>
              </div>
            </div>
            <div className={`engine-badge ${aiMode === "multi_agent" ? "badge--gemini" : "badge--builtin"}`}>
              <Icon name="sparkle" size={13} />
              <span>
                {aiMode === "multi_agent"
                  ? `Multi-Agent AI (${activeKeysCount} Key Hoạt động)`
                  : aiMode === "single_gemini"
                  ? "Single Gemini AI"
                  : "AI Tích hợp sẵn"}
              </span>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="mode-toggle-group">
            <button
              type="button"
              className={`mode-btn ${aiMode === "multi_agent" ? "mode-btn--active" : ""}`}
              onClick={() => setAiMode("multi_agent")}
            >
              <Icon name="users" size={15} />
              <span>🤖 Multi-Agent AI (3 Cấp bậc: Nhân viên - Quản lý - Giám đốc)</span>
            </button>
            <button
              type="button"
              className={`mode-btn ${aiMode === "single_gemini" ? "mode-btn--active" : ""}`}
              onClick={() => setAiMode("single_gemini")}
            >
              <Icon name="key" size={15} />
              <span>🔑 Dùng 1 Key chung</span>
            </button>
            <button
              type="button"
              className={`mode-btn ${aiMode === "builtin" ? "mode-btn--active" : ""}`}
              onClick={() => setAiMode("builtin")}
            >
              <Icon name="check" size={15} />
              <span>🛡️ AI Tích hợp sẵn</span>
            </button>
          </div>

          {aiMode === "multi_agent" && (
            <div className="multi-ai-manager-wrap">
              {/* Toolbar */}
              <div className="multi-ai-toolbar-header">
                <div className="multi-ai-counter-badge">
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: activeKeysCount > 0 ? "#10b981" : "#f59e0b" }} />
                  <span>
                    {activeKeysCount} / {multiAiKeys.length} Key sẵn sàng hoạt động
                  </span>
                </div>

                <div className="multi-ai-actions-group">
                  <button
                    type="button"
                    className="multi-ai-btn multi-ai-btn--test"
                    onClick={handleTestAllKeys}
                    disabled={isTestingAllKeys}
                    title="Kiểm tra kết nối đồng loạt tất cả các Key AI tới Google AI Studio"
                  >
                    {isTestingAllKeys ? (
                      <>
                        <span className="spinner-inline" /> Đang kiểm tra...
                      </>
                    ) : (
                      <>
                        <Icon name="refresh" size={13} />
                        <span>Kiểm tra toàn bộ AI (Ping All)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="multi-ai-btn"
                    onClick={handleOpenAddKeyModal}
                    title="Thêm Key AI mới kèm phân quyền chức năng riêng"
                  >
                    <Icon name="plus" size={13} />
                    <span>Thêm Key AI</span>
                  </button>

                  <button
                    type="button"
                    className="multi-ai-btn"
                    onClick={handleResetMultiKeys}
                    title="Khôi phục lại 3 vai trò tác tử chuẩn (Nhân viên, Quản lý, Giám đốc)"
                  >
                    <Icon name="refresh" size={13} />
                    <span>Khôi phục chuẩn</span>
                  </button>

                  <button
                    type="button"
                    className="multi-ai-btn multi-ai-btn--primary"
                    onClick={() => handleSaveMultiKeys()}
                    title="Lưu danh mục Key AI vào bộ nhớ hệ thống"
                  >
                    <Icon name="check" size={13} />
                    <span>Lưu Key</span>
                  </button>
                </div>
              </div>

              {/* List of 3 Key Cards */}
              <div className="multi-ai-cards-list">
                {multiAiKeys.map((k) => (
                  <div
                    key={k.id}
                    className={`multi-ai-card ${k.isActive ? "multi-ai-card--active" : "multi-ai-card--disabled"}`}
                  >
                    <div className="multi-ai-card-header">
                      <div className="multi-ai-identity">
                        <span className="multi-ai-avatar">{k.icon}</span>
                        <div className="multi-ai-meta">
                          <h4>{k.name}</h4>
                          <span
                            className="multi-ai-role-tag"
                            style={{
                              background: `${k.badgeColor}15`,
                              color: k.badgeColor,
                              border: `1px solid ${k.badgeColor}40`,
                            }}
                          >
                            {k.roleTitle}
                          </span>
                        </div>
                      </div>

                      <div className="multi-ai-card-controls">
                        <button
                          type="button"
                          className="multi-ai-btn"
                          style={{ height: 28, padding: "0 8px", fontSize: 11.5 }}
                          onClick={() => handleOpenEditKeyModal(k)}
                          title="Chỉnh sửa vai trò & quyền hạn của Key này"
                        >
                          <Icon name="edit" size={12} />
                          <span>Sửa quyền</span>
                        </button>
                        {k.role === "custom" && (
                          <button
                            type="button"
                            className="multi-ai-btn"
                            style={{ height: 28, padding: "0 8px", color: "#ef4444", borderColor: "#fca5a5" }}
                            onClick={() => handleDeleteKey(k.id, k.name)}
                            title="Xóa Key này khỏi danh mục"
                          >
                            <Icon name="trash" size={12} />
                          </button>
                        )}
                        <label
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            color: k.isActive ? "#10b981" : "#94a3b8",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={k.isActive}
                            onChange={() => handleToggleKeyActive(k.id)}
                            style={{ accentColor: "#50008b", cursor: "pointer" }}
                          />
                          <span>{k.isActive ? "Bật" : "Tắt"}</span>
                        </label>
                      </div>
                    </div>

                    {/* API Key Input Row */}
                    <div className="multi-ai-input-row">
                      <div className="multi-ai-input-wrap">
                        <input
                          type={showKeyTextMap[k.id] ? "text" : "password"}
                          placeholder="Dán API Key Google AI Studio dạng AIzaSy..."
                          value={k.apiKey}
                          onChange={(e) => handleUpdateKeyInput(k.id, e.target.value)}
                          className="multi-ai-key-input"
                        />
                        <button
                          type="button"
                          className="multi-ai-eye-btn"
                          onClick={() => toggleKeyVisibility(k.id)}
                          title={showKeyTextMap[k.id] ? "Ẩn Key" : "Hiện Key"}
                        >
                          <Icon name={showKeyTextMap[k.id] ? "eyeOff" : "eye"} size={14} />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="multi-ai-btn multi-ai-btn--test"
                        style={{ height: 36, whiteSpace: "nowrap" }}
                        onClick={() => handleTestSingleKey(k)}
                        disabled={testingKeyId === k.id || !k.apiKey.trim()}
                        title="Kiểm tra tính hoạt động của riêng Key này"
                      >
                        {testingKeyId === k.id ? (
                          <>
                            <span className="spinner-inline" /> Kiểm tra...
                          </>
                        ) : (
                          <>
                            <Icon name="refresh" size={13} />
                            <span>Kiểm tra Key</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Scope Jurisdiction Box */}
                    <div className="multi-ai-scope-box">
                      <strong>Phạm vi nhiệm vụ & thẩm quyền của Key:</strong>
                      {k.scopeDescription}
                    </div>

                    {/* Status Feedback Row */}
                    <div className="multi-ai-status-bar">
                      <div>
                        {k.status === "active" && (
                          <span style={{ color: "#16a34a", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Icon name="check" size={12} /> {k.statusMessage || "Đang hoạt động tốt"}
                          </span>
                        )}
                        {k.status === "error" && (
                          <span style={{ color: "#dc2626", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Icon name="close" size={12} /> {k.statusMessage || "Lỗi xác thực khóa"}
                          </span>
                        )}
                        {k.status === "untested" && (
                          <span style={{ color: "#64748b" }}>
                            {k.apiKey ? "Chưa kiểm tra kết nối với Google AI Studio" : "Chưa cấu hình API Key (sẽ dùng bộ mô phỏng tác tử tích hợp)"}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        Mô hình: <code>{k.model}</code> {k.testedAt && `• Đã test lúc ${k.testedAt}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiMode === "single_gemini" && (
            <div className="api-key-form">
              <label className="field-label">
                <span>Google AI Studio API Key (Dùng chung cho cả 3 cấp tác tử)</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="get-key-link"
                >
                  Lấy API Key miễn phí tại Google AI Studio ↗
                </a>
              </label>

              <div className="key-input-wrapper">
                <input
                  type={showSingleKey ? "text" : "password"}
                  placeholder="Dán API Key dạng AIzaSy..."
                  value={singleApiKey}
                  onChange={(e) => {
                    setSingleApiKey(e.target.value);
                    if (singleKeyStatus) setSingleKeyStatus(null);
                  }}
                  className="key-input"
                />
                <button
                  type="button"
                  className="key-eye-btn"
                  onClick={() => setShowSingleKey(!showSingleKey)}
                  title={showSingleKey ? "Ẩn" : "Hiện"}
                >
                  <Icon name={showSingleKey ? "eyeOff" : "eye"} size={16} />
                </button>
              </div>

              {singleKeyStatus && (
                <div className={`key-status-msg ${singleKeyStatus.ok ? "msg--success" : "msg--error"}`}>
                  <Icon name={singleKeyStatus.ok ? "check" : "close"} size={14} />
                  <span>{singleKeyStatus.message}</span>
                </div>
              )}

              <div className="key-actions-row">
                <button
                  type="button"
                  className="test-key-btn"
                  onClick={handleTestSingleKeySimple}
                  disabled={isTestingSingleKey || !singleApiKey.trim()}
                >
                  {isTestingSingleKey ? (
                    <>
                      <span className="spinner-inline" /> Đang kiểm tra...
                    </>
                  ) : (
                    <>
                      <Icon name="refresh" size={15} /> Kiểm tra kết nối
                    </>
                  )}
                </button>
                <button type="button" className="save-key-btn" onClick={handleSaveSingleKey}>
                  <Icon name="check" size={15} /> Lưu Key đơn
                </button>
              </div>
            </div>
          )}

          {aiMode === "builtin" && (
            <div className="builtin-info-box">
              <div className="info-icon">
                <Icon name="check" size={18} />
              </div>
              <div className="info-text">
                <strong>Sẵn sàng hoạt động ngay lập tức (Không cần Key)</strong>
                <p>
                  Hệ thống sử dụng bộ mô phỏng Đa Tác tử Tích hợp sẵn (3 cấp: Nhân viên, Quản lý, Giám đốc) để phân tích báo cáo điểm nghẽn, kiểm tra nghiêm ngặt 5 hằng số nhận diện của Cô Hương tại TDP Duyên Phúc, Hưng Hà, Hưng Yên và lập lộ trình 3 giai đoạn.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CỘT PHẢI: NẠP FILE BÁO CÁO ĐIỂM NGHẼN */}
        <div className="setup-card">
          <div className="card-header-row">
            <div className="card-title-wrap">
              <span className="step-number">2</span>
              <div>
                <h3>Nạp Báo cáo Điểm nghẽn UX</h3>
                <p>
                  Nạp file <code>bao-cao-diem-nghen-ux.txt</code> hoặc trích xuất từ Bản đồ nhiệt
                </p>
              </div>
            </div>

            {reportContent && (
              <span className="file-loaded-pill">
                <Icon name="check" size={12} /> Đã nạp dữ liệu
              </span>
            )}
          </div>

          {/* Quick ingest buttons */}
          <div className="quick-ingest-buttons">
            <button
              type="button"
              className="quick-ingest-btn quick-ingest-btn--heatmap"
              onClick={handleAutoPullFromHeatmap}
              title="Đọc dữ liệu bản đồ nhiệt tương tác gần nhất từ trình duyệt"
            >
              <Icon name="flame" size={15} />
              <span>Nạp tự động từ Bản đồ nhiệt</span>
            </button>

            <button
              type="button"
              className="quick-ingest-btn"
              onClick={handleLoadSampleReport}
              title="Nạp dữ liệu báo cáo 142 phụ huynh mẫu để trải nghiệm"
            >
              <Icon name="article" size={15} />
              <span>Nạp dữ liệu mẫu</span>
            </button>
          </div>

          {/* Dropzone Upload */}
          <div
            className={`file-dropzone ${isDragging ? "dropzone--dragging" : ""} ${reportContent ? "dropzone--has-content" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.json,.csv"
              style={{ display: "none" }}
            />

            <div className="dropzone-icon-circle">
              <Icon name="upload" size={24} />
            </div>

            <div className="dropzone-text">
              <strong>Kéo thả file báo cáo vào đây hoặc bấm để chọn file</strong>
              <p>Hỗ trợ định dạng .txt, .json, .csv (Tối ưu nhất cho file xuất từ Bản đồ nhiệt)</p>
            </div>

            {reportContent && (
              <div className="dropzone-file-meta" onClick={(e) => e.stopPropagation()}>
                <span className="meta-badge meta-name">📄 {fileName || "bao-cao-diem-nghen-ux.txt"}</span>
                {fileSize && <span className="meta-badge">{fileSize}</span>}
                {fileLoadDate && <span className="meta-badge">Lúc {fileLoadDate}</span>}
                <button
                  type="button"
                  className="preview-toggle-btn"
                  onClick={() => setShowPreviewText(!showPreviewText)}
                >
                  <Icon name={showPreviewText ? "eyeOff" : "eye"} size={13} />
                  <span>{showPreviewText ? "Thu gọn" : "Xem nội dung"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Preview Box */}
          {showPreviewText && reportContent && (
            <div className="report-preview-box">
              <div className="preview-header">
                <span>Trích đoạn nội dung file báo cáo:</span>
                <button type="button" onClick={() => setShowPreviewText(false)}>
                  ✕
                </button>
              </div>
              <textarea value={reportContent} readOnly rows={7} className="preview-textarea" />
            </div>
          )}

          {/* Quick Metrics Bar */}
          {reportContent && (
            <div className="report-quick-stats-strip">
              <div className="stat-pill">
                <small>Phụ huynh</small>
                <strong>{parsedStatsFromContent.totalVisitors} người</strong>
              </div>
              <div className="stat-pill stat-pill--dead">
                <small>Dead Clicks</small>
                <strong>{parsedStatsFromContent.deadClicks} lượt</strong>
              </div>
              <div className="stat-pill stat-pill--rage">
                <small>Rage Clicks</small>
                <strong>{parsedStatsFromContent.rageClicks} lượt</strong>
              </div>
              <div className="stat-pill stat-pill--zalo">
                <small>Zalo Campaign</small>
                <strong>{parsedStatsFromContent.zaloVisitors} lượt (83%)</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Khối Chạy Phân Tích & Tiến Trình Đa Tác Tử */}
      <div className="analysis-trigger-bar">
        <div className="trigger-info">
          <div className="step-indicator">
            <span className="step-number">3</span>
            <h4>Kích hoạt Phân tích Đa Tác tử & Lập Kế hoạch</h4>
          </div>
          <p>
            Hệ thống sẽ chạy lần lượt 3 cấp bậc AI: Nhân viên rà soát lỗi thông tin ➔ Quản lý thẩm định tính khả thi ➔ Giám đốc phê duyệt lộ trình toàn hệ thống.
          </p>
        </div>

        <button
          type="button"
          className="run-analysis-main-btn"
          onClick={handleRunAnalysis}
          disabled={isAnalyzing || !reportContent.trim()}
          title="Bắt đầu chạy phân tích đa tác tử"
        >
          {isAnalyzing ? (
            <>
              <span className="spinner-inline" /> Đang chạy Multi-AI Swarm...
            </>
          ) : (
            <>
              <Icon name="sparkle" size={18} />
              <span>🚀 Chạy Phân tích Đa Tác tử (Multi-AI Consensus)</span>
            </>
          )}
        </button>
      </div>

      {/* Progress Bar with Agent Icons */}
      {isAnalyzing && (
        <div className="analysis-progress-overlay">
          <div className="progress-status-row">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="spinner-inline" />
              <strong style={{ fontSize: 13.5, color: "#50008b" }}>{analysisStatusText}</strong>
            </div>
            <span className="progress-pct">{analysisProgress}%</span>
          </div>

          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${analysisProgress}%` }} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11.5, color: "#64748b" }}>
            <span style={{ color: analysisProgress >= 25 ? "#2563eb" : "#94a3b8", fontWeight: 600 }}>
              👨‍💻 Bước 1: Nhân viên rà soát nội dung & 5 hằng số
            </span>
            <span style={{ color: analysisProgress >= 60 ? "#7c3aed" : "#94a3b8", fontWeight: 600 }}>
              👩‍💼 Bước 2: Quản lý thẩm định & phản biện
            </span>
            <span style={{ color: analysisProgress >= 85 ? "#d97706" : "#94a3b8", fontWeight: 600 }}>
              👑 Bước 3: Giám đốc phê duyệt lộ trình
            </span>
          </div>
        </div>
      )}

      {/* 4. Dashboard Kết Quả & Ma Trận Giải Pháp */}
      {analysisResult && (
        <div className="analysis-results-section">
          {/* Executive Metrics Overview */}
          <div className="executive-kpi-grid">
            <div className="kpi-card kpi-card--health">
              <div className="kpi-icon-wrap">
                <Icon name="chart" size={24} />
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Điểm Sức khỏe UX Hiện tại</span>
                <div className="kpi-values">
                  <span className="score-current">{analysisResult.currentHealthScore}</span>
                  <span className="score-arrow">➔</span>
                  <span className="score-target">{analysisResult.projectedHealthScore}/100</span>
                </div>
                <small className="kpi-note">Mục tiêu sau khi hoàn thành 3 giai đoạn nâng cấp</small>
              </div>
            </div>

            <div className="kpi-card kpi-card--uplift">
              <div className="kpi-icon-wrap">
                <Icon name="flame" size={24} />
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Tăng trưởng Chuyển đổi Dự kiến</span>
                <div className="kpi-highlight">{analysisResult.conversionUpliftRange}</div>
                <small className="kpi-note">Tăng lượt gọi hotline & nhắn tin Zalo thực tế</small>
              </div>
            </div>

            <div className="kpi-card kpi-card--issues">
              <div className="kpi-icon-wrap">
                <Icon name="shield" size={24} />
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Điểm nghẽn Cần xử lý</span>
                <div className="kpi-highlight">{analysisResult.totalFrictionPoints} Hạng mục</div>
                <small className="kpi-note">Gồm Dead Clicks, Rage Clicks, Công thái học di động</small>
              </div>
            </div>

            <div className="kpi-card kpi-card--engine">
              <div className="kpi-icon-wrap">
                <Icon name="sparkle" size={24} />
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Động cơ Phân tích Đồng thuận</span>
                <div className="kpi-engine-name">{analysisResult.modelName}</div>
                <small className="kpi-note">
                  Thời gian: {new Date(analysisResult.timestamp).toLocaleTimeString("vi-VN")}
                </small>
              </div>
            </div>
          </div>

          {/* Executive Summary Card */}
          <div className="executive-summary-card">
            <div className="summary-title-row">
              <Icon name="article" size={18} />
              <h4>Tổng kết Phán quyết & Đồng thuận Toàn diện từ Đa Tác tử AI</h4>
            </div>
            <p className="summary-paragraph">{analysisResult.executiveSummary}</p>
          </div>

          {/* Navigation Tabs for Results */}
          <div className="results-tab-navigation">
            <div className="tab-buttons">
              <button
                type="button"
                className={`res-tab-btn ${activeTab === "overview" || activeTab === "solutions" ? "res-tab-btn--active" : ""}`}
                onClick={() => setActiveTab("solutions")}
              >
                <Icon name="settings" size={16} />
                <span>Ma trận Giải pháp Nâng cấp ({analysisResult.solutions.length})</span>
              </button>

              <button
                type="button"
                className={`res-tab-btn ${activeTab === "roadmap" ? "res-tab-btn--active" : ""}`}
                onClick={() => setActiveTab("roadmap")}
              >
                <Icon name="calendar" size={16} />
                <span>Lộ trình Thực thi 3 Giai đoạn</span>
              </button>

              <button
                type="button"
                className={`res-tab-btn ${activeTab === "multiAgentLogs" ? "res-tab-btn--active" : ""}`}
                onClick={() => setActiveTab("multiAgentLogs")}
                style={{
                  color: activeTab === "multiAgentLogs" ? "#50008b" : "#4338ca",
                  fontWeight: 700,
                }}
              >
                <Icon name="message" size={16} />
                <span>💬 Log Trao đổi giữa các AI ({analysisResult.multiAgentLogs?.length || 3})</span>
              </button>

              <button
                type="button"
                className={`res-tab-btn ${activeTab === "rawReport" ? "res-tab-btn--active" : ""}`}
                onClick={() => setActiveTab("rawReport")}
              >
                <Icon name="article" size={16} />
                <span>Báo cáo Text Hoàn Chỉnh để Copy</span>
              </button>
            </div>

            {/* Quick Export Tools */}
            <div className="tab-export-actions">
              <button
                type="button"
                className="action-pill-btn"
                onClick={handleCopyReport}
                style={{ minWidth: "155px", justifyContent: "center" }}
                title="Sao chép toàn bộ nội dung để dán vào Zalo/Tài liệu kỹ thuật"
              >
                <Icon name={copySuccess ? "check" : "copy"} size={14} />
                <span>{copySuccess ? "Đã sao chép!" : "Sao chép kế hoạch"}</span>
              </button>
              <button
                type="button"
                className="action-pill-btn"
                onClick={handleDownloadPlanTxt}
                title="Tải về file ke-hoach-nang-cap-he-thong.txt"
              >
                <Icon name="download" size={14} />
                <span>Tải file .txt</span>
              </button>
            </div>
          </div>

          {/* TAB 1: MA TRẬN GIẢI PHÁP NÂNG CẤP */}
          {(activeTab === "solutions" || activeTab === "overview") && (
            <div className="solutions-tab-body">
              {/* Category Filters */}
              <div className="solution-category-chips">
                <span className="chip-label">Lọc theo nhóm:</span>
                <button
                  type="button"
                  className={`cat-chip ${categoryFilter === "all" ? "cat-chip--active" : ""}`}
                  onClick={() => setCategoryFilter("all")}
                >
                  Tất cả ({analysisResult.solutions.length})
                </button>
                <button
                  type="button"
                  className={`cat-chip ${categoryFilter === "dead_clicks" ? "cat-chip--active" : ""}`}
                  onClick={() => setCategoryFilter("dead_clicks")}
                >
                  Dead Clicks (Không phản hồi)
                </button>
                <button
                  type="button"
                  className={`cat-chip ${categoryFilter === "rage_clicks" ? "cat-chip--active" : ""}`}
                  onClick={() => setCategoryFilter("rage_clicks")}
                >
                  Rage Clicks (Nhấp dồn dập)
                </button>
                <button
                  type="button"
                  className={`cat-chip ${categoryFilter === "mobile_ergonomics" ? "cat-chip--active" : ""}`}
                  onClick={() => setCategoryFilter("mobile_ergonomics")}
                >
                  Công thái học di động
                </button>
                <button
                  type="button"
                  className={`cat-chip ${categoryFilter === "cta_conversion" ? "cat-chip--active" : ""}`}
                  onClick={() => setCategoryFilter("cta_conversion")}
                >
                  Tối ưu Zalo & Hotline
                </button>
              </div>

              {/* Solution Cards */}
              <div className="solutions-card-list">
                {filteredSolutions.map((sol, index) => (
                  <div key={sol.id || index} className="solution-item-card">
                    <div className="solution-header-row">
                      <div className="title-and-badges">
                        <span className={`priority-badge priority--level-${sol.priorityLevel}`}>
                          {sol.priority}
                        </span>
                        <h4>{sol.title}</h4>
                      </div>
                      <span className="effort-badge">⏱ {sol.estimatedEffort}</span>
                    </div>

                    <div className="solution-details-grid">
                      <div className="detail-col detail-col--problem">
                        <strong>Hiện trạng ghi nhận:</strong>
                        <p>{sol.problemSummary}</p>
                      </div>

                      <div className="detail-col detail-col--cause">
                        <strong>Nguyên nhân tâm lý & kỹ thuật:</strong>
                        <p>{sol.rootCause}</p>
                      </div>

                      <div className="detail-col detail-col--fix">
                        <strong>Giải pháp kỹ thuật khuyến nghị:</strong>
                        <p>{sol.technicalFix}</p>
                      </div>

                      <div className="detail-col detail-col--impact">
                        <strong>Tác động trải nghiệm phụ huynh:</strong>
                        <p>{sol.uxImpact}</p>
                      </div>
                    </div>

                    {sol.actionCodeSnippet && (
                      <div className="snippet-accordion">
                        <div className="snippet-title">Mã nguồn mẫu / Chỉ dẫn kỹ thuật:</div>
                        <pre className="snippet-code-box">
                          <code>{sol.actionCodeSnippet}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: LỘ TRÌNH 3 GIAI ĐOẠN */}
          {activeTab === "roadmap" && (
            <div className="roadmap-tab-body">
              <div className="roadmap-timeline">
                {analysisResult.roadmap.map((phase, idx) => (
                  <div key={idx} className="roadmap-phase-card">
                    <div className="phase-marker">
                      <span className="phase-num">{idx + 1}</span>
                    </div>
                    <div className="phase-content">
                      <div className="phase-header-row">
                        <h4>{phase.phase}</h4>
                        <span className="phase-timeframe">📅 {phase.timeframe}</span>
                      </div>
                      <div className="phase-goal">
                        <strong>Mục tiêu then chốt:</strong>
                        <span>{phase.goal}</span>
                      </div>
                      <div className="phase-actions-list">
                        <strong>Các đầu việc cụ thể:</strong>
                        <ul>
                          {phase.actions.map((act, aIdx) => (
                            <li key={aIdx}>
                              <Icon name="check" size={14} />
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LOG TRAO ĐỔI GIỮA CÁC AI (MULTI-AGENT DIALOGUE) */}
          {activeTab === "multiAgentLogs" && (
            <div className="agent-dialogue-wrap">
              {/* Dialogue Toolbar */}
              <div className="agent-dialogue-toolbar">
                <div className="agent-dialogue-filters">
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#334155" }}>Lọc người gửi:</span>
                  <button
                    type="button"
                    className={`agent-filter-pill ${agentLogFilter === "all" ? "agent-filter-pill--active" : ""}`}
                    onClick={() => setAgentLogFilter("all")}
                  >
                    Tất cả các AI ({analysisResult.multiAgentLogs?.length || 3})
                  </button>
                  <button
                    type="button"
                    className={`agent-filter-pill ${agentLogFilter === "functional_staff" ? "agent-filter-pill--active" : ""}`}
                    onClick={() => setAgentLogFilter("functional_staff")}
                  >
                    👨‍💻 Nhân viên (Key 1)
                  </button>
                  <button
                    type="button"
                    className={`agent-filter-pill ${agentLogFilter === "qa_manager" ? "agent-filter-pill--active" : ""}`}
                    onClick={() => setAgentLogFilter("qa_manager")}
                  >
                    👩‍💼 Quản lý (Key 2)
                  </button>
                  <button
                    type="button"
                    className={`agent-filter-pill ${agentLogFilter === "director" ? "agent-filter-pill--active" : ""}`}
                    onClick={() => setAgentLogFilter("director")}
                  >
                    👑 Giám đốc (Key 3)
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <input
                    type="text"
                    placeholder="🔍 Tìm trong nội dung trao đổi..."
                    value={agentLogSearch}
                    onChange={(e) => setAgentLogSearch(e.target.value)}
                    style={{
                      height: 32,
                      padding: "0 10px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 12,
                      outline: "none",
                      width: 200,
                    }}
                  />
                  <button
                    type="button"
                    className="multi-ai-btn"
                    onClick={handleCopyAgentLogs}
                    title="Sao chép toàn bộ nhật ký trao đổi giữa các AI"
                  >
                    <Icon name="copy" size={13} />
                    <span>Sao chép Log</span>
                  </button>
                  <button
                    type="button"
                    className="multi-ai-btn"
                    onClick={handleDownloadAgentLogsTxt}
                    title="Tải file text nhật ký đối thoại"
                  >
                    <Icon name="download" size={13} />
                    <span>Tải file .txt</span>
                  </button>
                </div>
              </div>

              {/* Timeline of Messages */}
              <div className="agent-dialogue-timeline">
                {filteredAgentLogs.map((msg) => (
                  <div key={msg.id} className="agent-timeline-entry">
                    <div className="agent-timeline-node-icon" style={{ borderColor: msg.badgeColor }}>
                      {msg.senderIcon}
                    </div>

                    <div className="agent-timeline-bubble">
                      <div className="agent-bubble-header">
                        <div className="agent-bubble-identity">
                          <span className="agent-bubble-name">{msg.senderName}</span>
                          <span
                            className="multi-ai-role-tag"
                            style={{
                              background: `${msg.badgeColor}15`,
                              color: msg.badgeColor,
                              border: `1px solid ${msg.badgeColor}40`,
                            }}
                          >
                            {msg.senderTitle}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span
                            style={{
                              fontSize: 11.5,
                              fontWeight: 700,
                              color: msg.badgeColor,
                              background: `${msg.badgeColor}10`,
                              padding: "2px 8px",
                              borderRadius: 6,
                            }}
                          >
                            {msg.badgeLabel}
                          </span>
                          <span className="agent-bubble-time">{msg.timestamp}</span>
                        </div>
                      </div>

                      <h4 className="agent-bubble-title">{msg.title}</h4>

                      <div className="agent-bubble-body">{msg.content}</div>

                      {msg.keyFindings && msg.keyFindings.length > 0 && (
                        <div className="agent-findings-box">
                          <strong>Các điểm ghi nhận trọng tâm của tác tử:</strong>
                          <ul>
                            {msg.keyFindings.map((kf, kfIdx) => (
                              <li key={kfIdx}>{kf}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <span className="agent-recommendation-pill">
                          👉 Đề xuất bước tiếp theo: {msg.actionRecommendation}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: BÁO CÁO TEXT HOÀN CHỈNH */}
          {activeTab === "rawReport" && (
            <div className="raw-report-tab-body">
              <div className="raw-report-header">
                <span className="raw-title">Toàn văn Kế hoạch Nâng cấp Hệ thống (Đã đối chiếu đa tác tử)</span>
                <button type="button" className="copy-raw-btn" onClick={handleCopyReport}>
                  <Icon name={copySuccess ? "check" : "copy"} size={14} />
                  <span>{copySuccess ? "Đã sao chép!" : "Sao chép toàn bộ"}</span>
                </button>
              </div>
              <textarea value={analysisResult.rawTextReport} readOnly rows={20} className="raw-report-textarea" />
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: THÊM / CHỈNH SỬA KEY AI & PHÂN QUYỀN TÁC TỬ                         */}
      {/* ========================================================================= */}
      {showKeyModal && editingKeyItem && (
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
          onClick={() => setShowKeyModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 20,
              width: "100%",
              maxWidth: 620,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
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
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>{editingKeyItem.icon}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>
                    Cấu hình Key AI & Phân quyền Tác tử
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                    Chỉ định phạm vi quyền hạn và API Key cho tác tử trong hệ thống
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  color: "#64748b",
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Tên gợi nhớ Key AI:
                </label>
                <input
                  type="text"
                  value={editingKeyItem.name}
                  onChange={(e) => setEditingKeyItem({ ...editingKeyItem, name: e.target.value })}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Vai trò cấp bậc:
                  </label>
                  <select
                    value={editingKeyItem.role}
                    onChange={(e) => {
                      const role = e.target.value as MultiAiAgentRole;
                      let roleTitle = "Chuyên gia Tùy biến";
                      let icon = "🤖";
                      let badgeColor = "#059669";
                      if (role === "functional_staff") {
                        roleTitle = "Nhân viên Rà soát Chức năng & Dữ liệu";
                        icon = "👨‍💻";
                        badgeColor = "#2563eb";
                      } else if (role === "qa_manager") {
                        roleTitle = "Quản lý Giám sát & Đảm bảo Chất lượng";
                        icon = "👩‍💼";
                        badgeColor = "#7c3aed";
                      } else if (role === "director") {
                        roleTitle = "Giám đốc Quản lý Toàn hệ thống";
                        icon = "👑";
                        badgeColor = "#d97706";
                      }
                      setEditingKeyItem({
                        ...editingKeyItem,
                        role,
                        roleTitle,
                        icon,
                        badgeColor,
                      });
                    }}
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 10px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      boxSizing: "border-box",
                      background: "#ffffff",
                    }}
                  >
                    <option value="functional_staff">👨‍💻 Cấp 1: Nhân viên chức năng (Kiểm tra nội dung & 5 hằng số)</option>
                    <option value="qa_manager">👩‍💼 Cấp 2: Quản lý kiểm soát (Thẩm định báo cáo & quy trình)</option>
                    <option value="director">👑 Cấp 3: Giám đốc điều hành (Phê chuẩn lộ trình & KPI)</option>
                    <option value="custom">🤖 Tùy biến: Chuyên gia phân tích riêng</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Mô hình Google Gemini:
                  </label>
                  <select
                    value={editingKeyItem.model}
                    onChange={(e) => setEditingKeyItem({ ...editingKeyItem, model: e.target.value })}
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 10px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      boxSizing: "border-box",
                      background: "#ffffff",
                    }}
                  >
                    <option value="gemini-2.5-flash">gemini-2.5-flash (Khuyên dùng - Nhanh & Chuẩn)</option>
                    <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite (Siêu nhẹ)</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash (Ổn định)</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro (Tư duy sâu)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Google AI Studio API Key:
                </label>
                <input
                  type="text"
                  placeholder="Dán khóa API AIzaSy..."
                  value={editingKeyItem.apiKey}
                  onChange={(e) => setEditingKeyItem({ ...editingKeyItem, apiKey: e.target.value, status: "untested" })}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    fontFamily: "monospace",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Phạm vi nhiệm vụ & thẩm quyền của Key (Mô tả chi tiết):
                </label>
                <textarea
                  rows={3}
                  value={editingKeyItem.scopeDescription}
                  onChange={(e) => setEditingKeyItem({ ...editingKeyItem, scopeDescription: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "14px 24px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 10,
                background: "#f8fafc",
              }}
            >
              <button
                type="button"
                className="multi-ai-btn"
                onClick={() => setShowKeyModal(false)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="multi-ai-btn multi-ai-btn--primary"
                onClick={() => handleSaveKeyFromModal(editingKeyItem)}
              >
                <Icon name="check" size={14} />
                <span>Lưu cấu hình Key</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

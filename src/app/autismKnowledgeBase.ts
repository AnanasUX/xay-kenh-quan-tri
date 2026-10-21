export interface AutismScenario {
  id: string;
  title: string;
  category: "speech" | "behavior" | "interaction" | "evaluation" | "tuition" | "out_of_scope" | "general";
  intent: string;
  sampleQuestion: string;
  keywords: string[];
  responseTemplate: string;
  isOutOfScope?: boolean;
  recommendedAction?: string;
  isActive?: boolean;
  isCustom?: boolean;
}

export const STORAGE_KEY_AUTISM_SCENARIOS = "autism_ai_scenarios_v1";

export const DEFAULT_AUTISM_SCENARIOS: AutismScenario[] = [
  // 1. CHẬM NÓI / CHƯA BẬT ÂM
  {
    id: "sc-speech-delay",
    title: "Trẻ chậm nói, chưa bật âm (Giai đoạn vàng 18 - 36 tháng)",
    category: "speech",
    intent: "Phụ huynh lo lắng vì con 2-3 tuổi chưa nói được từ đơn, chỉ ê a hoặc phát âm vô nghĩa.",
    sampleQuestion: "Bé nhà mình 2 tuổi rưỡi rồi mà chưa nói được từ nào, chỉ ê a thôi thì có sao không cô?",
    keywords: ["chậm nói", "chua noi", "bật âm", "bat am", "chưa nói", "không nói", "khong noi", "ê a", "e a", "ngôn ngữ", "phát âm", "từ đơn", "tiếng nói"],
    responseTemplate: "Dạ ba/mẹ {customerName} ơi, giai đoạn 18 - 36 tháng là 'giai đoạn vàng' để kích hoạt ngôn ngữ cho con. Tại lớp Cô Hương, các cô sẽ sử dụng kỹ thuật trị liệu âm ngữ 1:1 kết hợp trò chơi vận động môi miệng và điều hòa cảm giác để kích thích con bật âm tự nhiên. Ba mẹ cho cô hỏi thêm là hiện tại con đã hiểu các mệnh lệnh đơn giản (như 'lấy bóng', 'lại đây') chưa ạ?",
    recommendedAction: "Kiểm tra mức độ hiểu ngôn ngữ và xếp lịch đánh giá phát triển",
    isActive: true,
  },

  // 2. GIẢM TƯƠNG TÁC MẮT / GỌI TÊN KHÔNG QUAY ĐẦU
  {
    id: "sc-eye-contact",
    title: "Giảm tương tác mắt, gọi tên không quay đầu",
    category: "interaction",
    intent: "Dấu hiệu cảnh báo tự kỷ: con thờ ơ, dường như không nghe thấy khi gọi tên, không nhìn vào mắt người đối diện.",
    sampleQuestion: "Con em gọi tên không thèm quay đầu lại, cũng ít khi nhìn thẳng vào mắt mẹ, có phải bị tự kỷ không?",
    keywords: ["giao tiếp mắt", "giao tiep mat", "nhìn mắt", "nhin mat", "gọi tên", "goi ten", "không quay đầu", "khong quay dau", "thờ ơ", "tho o", "tương tác mắt", "chú ý chung"],
    responseTemplate: "Dạ ba/mẹ {customerName}, việc con giảm tương tác mắt và gọi tên không quay đầu là dấu hiệu điển hình của việc gặp khó khăn trong định hướng chú ý chung. Cô Hương sẽ áp dụng kỹ thuật 'ngang tầm mắt' kết hợp can thiệp hành vi ABA và mô hình TEACCH để tạo sự gắn kết cảm xúc, giúp con hứng thú quay lại khi được gọi tên. Gia đình có thể đưa bé qua trung tâm để các cô quan sát trực tiếp và hướng dẫn ba mẹ bài tập tương tác tại nhà nhé ạ!",
    recommendedAction: "Hướng dẫn bài tập tương tác mắt tại nhà và quan sát trực tiếp 60 phút",
    isActive: true,
  },

  // 3. HÀNH VI ĐỊNH HÌNH / RẬP KHUÔN / CẢM GIÁC
  {
    id: "sc-stereotypic-behavior",
    title: "Hành vi định hình: Đi nhón chân, vẫy tay, xếp đồ thẳng hàng",
    category: "behavior",
    intent: "Rối loạn điều hòa cảm giác (Sensory Processing) dẫn đến các hành vi tự kích thích (stimming).",
    sampleQuestion: "Bé rất hay đi nhón chân, thích xoay bánh xe và vẫy tay trước mặt, làm sao để con bỏ được hành vi này ạ?",
    keywords: ["nhón chân", "nhon chan", "vẫy tay", "vay tay", "xếp hàng", "xep hang", "xoay bánh xe", "xoay vong", "định hình", "dinh hinh", "rập khuôn", "rap khuon", "cảm giác", "giác quan"],
    responseTemplate: "Dạ ba/mẹ {customerName}, các hành vi đi nhón chân, vẫy tay hay xoay đồ vật thực chất là phản xạ tự xoa dịu khi hệ thần kinh của con đang tìm kiếm cảm giác tiền đình hoặc xúc giác. Thay vì cấm đoán làm con căng thẳng, trung tâm Cô Hương áp dụng phòng Trị liệu Hoạt động (OT/SI) với thảm gai, xích đu cảm giác và con lăn áp lực sâu để cung cấp cảm giác lành mạnh thay thế. Ba mẹ có thể cho cô biết con có bị nhạy cảm quá mức với tiếng ồn (như tiếng máy sấy, máy xay) không ạ?",
    recommendedAction: "Đánh giá hồ sơ cảm giác giác quan (Sensory Profile)",
    isActive: true,
  },

  // 4. CƠN BÙNG NỔ / ĂN VẠ / LA HÉT / CẮN / ĐẬP ĐẦU
  {
    id: "sc-meltdown-aggression",
    title: "Cơn bùng nổ, ăn vạ gào thét, tự làm đau mình",
    category: "behavior",
    intent: "Khủng hoảng hành vi do quá tải giác quan hoặc không thể diễn đạt nhu cầu bằng lời nói.",
    sampleQuestion: "Bé nhà em rất hay ăn vạ, la hét dữ dội, không vừa ý là đập đầu xuống sàn hoặc cắn tay, em rất stress.",
    keywords: ["ăn vạ", "an va", "la hét", "la het", "gào thét", "đập đầu", "dap dau", "cắn", "can tay", "bùng nổ", "hung hăng", "khóc lóc", "tự làm đau", "hành vi xấu"],
    responseTemplate: "Dạ ba/mẹ {customerName} ơi, Cô Hương rất thấu hiểu sự vất vả và âu lo của gia đình. Khi con chưa có đủ ngôn ngữ để bày tỏ mong muốn, con buộc phải dùng tiếng khóc và hành vi tiêu cực để giải tỏa ức chế. Tại trung tâm, các cô áp dụng phương pháp Can thiệp Hành vi Ứng dụng (ABA) theo mô hình ABC để xác định chính xác nguyên nhân cơn giận, từ đó dạy con kỹ năng giao tiếp thay thế (như dùng thẻ tranh PECS hoặc cử chỉ). Khi con học được cách biểu đạt nhu cầu, các cơn bùng nổ sẽ giảm đi rõ rệt ạ.",
    recommendedAction: "Phân tích chức năng hành vi và hướng dẫn xử lý khủng hoảng tức thời",
    isActive: true,
  },

  // 5. NÓI NHẠI LỜI (ECHOLALIA)
  {
    id: "sc-echolalia",
    title: "Trẻ nói nhại lời, lặp lại lời bài hát hoặc TV nhưng không hiểu nghĩa",
    category: "speech",
    intent: "Hiện tượng Echolalia: Trẻ lặp lại nguyên văn câu nói của người khác mà không hiểu mục đích giao tiếp.",
    sampleQuestion: "Bé thuộc rất nhiều lời bài hát và quảng cáo TV nhưng ai hỏi gì bé chỉ nhắc lại câu hỏi chứ không trả lời được.",
    keywords: ["nhại lời", "nhai loi", "lặp lại lời", "lap lai", "hát theo tivi", "quảng cáo", "nói nhại", "echolalia"],
    responseTemplate: "Dạ ba/mẹ {customerName}, việc con nhớ được lời bài hát và nhắc lại câu nói chứng minh bộ máy phát âm và trí nhớ của con rất tốt, điểm nghẽn là con chưa hiểu 'chức năng giao tiếp 2 chiều'. Cô Hương sẽ sử dụng giáo cụ trực quan và kỹ thuật mô hình hóa câu ngắn để dạy con cách phản hồi (ví dụ: thay vì nhại 'Con muốn uống nước không?', con sẽ học cách trả lời 'Có' hoặc chỉ vào cốc nước). Chuyên viên sẽ gọi điện hỗ trợ thêm cho ba mẹ nhé ạ!",
    recommendedAction: "Hướng dẫn kỹ thuật chuyển đổi nhại lời sang ngôn ngữ chức năng",
    isActive: true,
  },

  // 6. KHÔNG CHỈ NGÓN TAY / KÉO TAY NGƯỜI LỚN
  {
    id: "sc-pointing-gesture",
    title: "Không biết chỉ ngón tay, muốn gì là kéo tay người lớn",
    category: "interaction",
    intent: "Thiếu kỹ năng giao tiếp cử chỉ tiền ngôn ngữ (Proto-imperative pointing).",
    sampleQuestion: "Con em muốn gì là kéo tay mẹ đặt vào đồ vật đó chứ không chịu chỉ ngón tay, như vậy có sao không cô?",
    keywords: ["chỉ ngón tay", "chi ngon", "chỉ ngón", "kéo tay", "keo tay", "cầm tay", "cử chỉ"],
    responseTemplate: "Dạ ba/mẹ {customerName}, cử chỉ 'chỉ ngón tay' là cột mốc then chốt thể hiện khả năng chia sẻ chú ý của trẻ trước khi biết nói. Việc con chỉ biết kéo tay người lớn là dấu hiệu con đang thiếu hụt kỹ năng giao tiếp tiền ngôn ngữ. Các cô sẽ dùng phương pháp 'cầm tay chỉ việc' (prompting) kết hợp tạo tình huống con phải chỉ ngón mới lấy được món đồ con thích. Kỹ năng này hoàn toàn có thể rèn luyện thành thạo trong khoảng 2 - 4 tuần can thiệp ạ.",
    recommendedAction: "Rèn kỹ năng chỉ ngón tay qua tình huống gợi mở (sabotage)",
    isActive: true,
  },

  // 7. TỰ KỶ THOÁI LUI (REGRESSIVE AUTISM)
  {
    id: "sc-regressive",
    title: "Tự kỷ thoái lùi: Trước 18 tháng biết nói và tương tác, sau đó mất dần",
    category: "behavior",
    intent: "Hiện tượng thoái lui ngôn ngữ và kỹ năng xã hội khiến phụ huynh hoảng loạn.",
    sampleQuestion: "Lúc 1 tuổi bé đã biết gọi ba mẹ và vẫy tay chào, nhưng gần đây bé không nói nữa, gọi cũng không thèm quay lại.",
    keywords: ["thoái lui", "thoai lui", "mất ngôn ngữ", "mat ngon ngu", "trước biết nói", "sau không nói", "thụt lùi", "thut lui", "tự nhiên không nói"],
    responseTemplate: "Dạ ba/mẹ {customerName}, hiện tượng 'thoái lui ngôn ngữ' (Regressive Autism) thường xuất hiện trong khoảng 15 - 24 tháng tuổi khi các liên kết thần kinh của con gặp trục trặc tạm thời. Đây là tình huống cần can thiệp CÀNG SỚM CÀNG TỐT để kích hoạt lại các vùng ngôn ngữ đang bị ngủ quên. Cô Hương khuyên gia đình nên sắp xếp cho bé qua trung tâm đánh giá phát triển ngay trong tuần này để không bỏ lỡ thời gian can thiệp quý báu ạ.",
    recommendedAction: "Xếp lịch đánh giá khẩn cấp trong vòng 24 - 48 giờ",
    isActive: true,
  },

  // 8. ĐÁNH GIÁ SÀNG LỌC PHÁT TRIỂN & TEST DENVER / M-CHAT
  {
    id: "sc-evaluation",
    title: "Quy trình đánh giá sàng lọc phát triển & Thang đo chuẩn hóa",
    category: "evaluation",
    intent: "Phụ huynh muốn biết trung tâm đánh giá bằng công cụ gì, có chuẩn không và chi phí thế nào.",
    sampleQuestion: "Em muốn đưa bé qua kiểm tra đánh giá xem có bị tự kỷ không thì quy trình thế nào, có mất phí không ạ?",
    keywords: ["đánh giá", "danh gia", "sàng lọc", "sang loc", "khám", "kham", "kiểm tra", "kiem tra", "test", "denver", "m-chat", "mchat", "hẹn lịch", "hen lich", "lịch hẹn"],
    responseTemplate: "Dạ ba/mẹ {customerName}, buổi đánh giá phát triển ban đầu của con kéo dài 60 phút và hoàn toàn MIỄN PHÍ tại trung tâm Cô Hương. Quy trình bao gồm: Quan sát con chơi tự do trong phòng giác quan, kiểm tra thang đo phát triển chuẩn quốc tế (Denver II, M-CHAT-R/F) và trao đổi trực tiếp kết quả kèm lộ trình can thiệp cùng gia đình. Ba mẹ có tiện đưa bé qua vào thứ 7 hoặc Chủ nhật tuần này không ạ?",
    recommendedAction: "Chốt lịch hẹn đánh giá phát triển 60 phút miễn phí",
    isActive: true,
  },

  // 9. HỌC PHÍ & LỊCH HỌC CAN THIỆP 1:1
  {
    id: "sc-tuition",
    title: "Học phí can thiệp 1:1 và thời gian ca học",
    category: "tuition",
    intent: "Phụ huynh cần thông tin chi phí rõ ràng, minh bạch để cân đối tài chính cho con.",
    sampleQuestion: "Học phí can thiệp 1 cô 1 trò bên mình là bao nhiêu một buổi, có những ca học nào ạ?",
    keywords: ["học phí", "hoc phi", "chi phí", "chi phi", "tiền học", "tien hoc", "giá", "gia ca", "bao nhiêu tiền", "bao nhieu", "ca học", "1:1", "1 cô 1 trò"],
    responseTemplate: "Dạ ba/mẹ {customerName}, học phí can thiệp cá nhân 1:1 tại trung tâm dao động từ 250.000đ - 350.000đ/buổi (thời lượng 45 - 60 phút) tùy theo độ tuổi và kế hoạch can thiệp cá nhân (IEP) của bé. Trung tâm có các ca học linh hoạt sáng, chiều và ngoài giờ hành chính (kèm ca thứ 7). Đặc biệt, buổi đánh giá sàng lọc đầu tiên của con hoàn toàn MIỄN PHÍ ạ.",
    recommendedAction: "Cung cấp bảng ca học và biểu phí can thiệp cá nhân hóa",
    isActive: true,
  },

  // 10. ĐỊA CHỈ & CƠ SỞ VẬT CHẤT PHÒNG CAN THIỆP
  {
    id: "sc-location",
    title: "Địa chỉ trung tâm & Cơ sở vật chất phòng học",
    category: "general",
    intent: "Phụ huynh muốn biết vị trí cơ sở phòng khám để sắp xếp việc đưa đón con.",
    sampleQuestion: "Trung tâm Cô Hương ở địa chỉ nào, cơ sở vật chất phòng học có đầy đủ dụng cụ không?",
    keywords: ["địa chỉ", "dia chi", "ở đâu", "o dau", "cơ sở", "co so", "phòng học", "phong hoc", "hà nội", "ha noi", "đường đi"],
    responseTemplate: "Dạ trung tâm Cô Hương tọa lạc tại khu vực trung tâm TP. Hà Nội, giao thông thuận tiện và có chỗ đỗ xe an toàn cho gia đình. Hệ thống phòng học được thiết kế cách âm chuyên biệt, trang bị đầy đủ dụng cụ điều hòa cảm giác (xích đu tiền đình, thang leo mầm non, bóng gai, thảm áp lực). Cô Hương xin phép gửi định vị bản đồ chỉ đường chi tiết qua số Zalo {customerPhone} của ba mẹ nhé ạ!",
    recommendedAction: "Gửi link định vị bản đồ chỉ đường qua Zalo",
    isActive: true,
  },

  // 11. HƯỚNG DẪN ĐỒNG HÀNH CAN THIỆP TẠI NHÀ
  {
    id: "sc-home-intervention",
    title: "Cách ba mẹ tương tác và can thiệp cho con tại nhà",
    category: "general",
    intent: "Phụ huynh muốn biết phương pháp đồng hành cùng con ở nhà để tăng hiệu quả can thiệp.",
    sampleQuestion: "Ở nhà bố mẹ nên làm gì để hỗ trợ con, có nên cho con xem điện thoại không ạ?",
    keywords: ["tại nhà", "tai nha", "ở nhà", "o nha", "đồng hành", "dong hanh", "tivi", "điện thoại", "ipad", "hướng dẫn bố mẹ", "trò chơi"],
    responseTemplate: "Dạ ba/mẹ {customerName}, nguyên tắc số 1 quan trọng nhất tại nhà là: CẮT HOÀN TOÀN tivi, điện thoại và ipad, vì ánh sáng xanh và hình ảnh chuyển động nhanh khiến não bộ con bị quá tải và giảm phản xạ giao tiếp thực tế. Thay vào đó, ba mẹ hãy dành ít nhất 60 - 90 phút/ngày chơi tương tác trực tiếp với con (ú òa, cù léc, thổi bóng xà phòng). Cô Hương sẽ gửi tặng gia đình cuốn cẩm nang bài tập tại nhà qua Zalo nhé ạ!",
    recommendedAction: "Gửi tặng cẩm nang bài tập tương tác gia đình",
    isActive: true,
  },

  // =========================================================================
  // CÁC TÌNH HUỐNG NGOÀI PHẠM VI (QUY TẮC: CHỈ TIẾP NHẬN THÔNG TIN LỊCH SỰ)
  // =========================================================================

  // 12. NGOÀI PHẠM VI: Y KHOA / THUỐC UỐNG / TẾ BÀO GỐC / PHẪU THUẬT
  {
    id: "sc-out-medical",
    title: "Ngoài phạm vi: Thuốc điều trị, y khoa, tế bào gốc, chữa khỏi 100%",
    category: "out_of_scope",
    isOutOfScope: true,
    intent: "Hỏi về thuốc men, dược phẩm, phẫu thuật não, cấy ghép y khoa.",
    sampleQuestion: "Uống thuốc gì để con nhanh khỏi tự kỷ ạ, trung tâm có chữa khỏi dứt điểm 100% bằng thuốc không?",
    keywords: ["thuốc", "thuoc", "uống thuốc", "uong thuoc", "kháng sinh", "chữa khỏi 100%", "chữa khỏi dứt điểm", "phẫu thuật", "tế bào gốc", "te bao goc", "tiêm", "châm cứu", "bác sĩ kê đơn", "bệnh viện"],
    responseTemplate: "Dạ Cô Hương xin phép ghi nhận câu hỏi của ba/mẹ {customerName}. Vì Trung tâm Cô Hương tập trung chuyên sâu vào phương pháp Giáo dục Hành vi và Trị liệu Tâm lý - Giác quan (không sử dụng thuốc hay can thiệp xâm lấn y khoa), đối với các chỉ định dùng thuốc ba mẹ nên tham khảo ý kiến trực tiếp từ các bác sĩ chuyên khoa Thần kinh - Nhi tại các bệnh viện uy tín (như Bệnh viện Nhi Trung Ương). Chuyên viên trung tâm sẽ liên hệ lại qua số {customerPhone} để lắng nghe thêm biểu hiện của bé và tư vấn định hướng giáo dục bổ trợ cho gia đình nhé ạ.",
    recommendedAction: "Ghi nhận thông tin, hẹn chuyên viên gọi điện và hướng dẫn thăm khám bệnh viện chuyên khoa",
    isActive: true,
  },

  // 13. NGOÀI PHẠM VI: TRÔNG GIỮ TRẺ THUẦN TÚY / MẦM NON PHỔ THÔNG / DẠY CHỮ LỚP 1
  {
    id: "sc-out-general-school",
    title: "Ngoài phạm vi: Trông giữ trẻ thuần túy, mầm non đại trà, luyện chữ toán",
    category: "out_of_scope",
    isOutOfScope: true,
    intent: "Tìm trường trông giữ trẻ bình thường hoặc dạy văn hóa toán chữ lớp 1.",
    sampleQuestion: "Bên mình có nhận trông trẻ cả ngày không, có dạy chữ với toán để con vào lớp 1 bình thường không?",
    keywords: ["trông trẻ", "trong tre", "giữ trẻ", "giu tre", "trường mầm non thường", "mầm non tư thục", "dạy toán", "dạy chữ", "luyện chữ đẹp", "lớp 1", "tiểu học bình thường"],
    responseTemplate: "Dạ Cô Hương đã tiếp nhận nhu cầu của ba/mẹ {customerName}. Trung tâm là cơ sở can thiệp chuyên biệt hỗ trợ các bé có khó khăn về phát triển, chậm ngôn ngữ và phổ tự kỷ theo lộ trình cá nhân hóa (không phải cơ sở trông giữ trẻ mầm non đại trà hay lớp dạy văn hóa phổ thông). Bộ phận ghi nhận hồ sơ sẽ lưu lại thông tin và chuyên viên sẽ liên hệ lại qua số {customerPhone} để hướng dẫn gia đình các cơ sở giáo dục phù hợp nhất với mong muốn của ba mẹ nhé ạ.",
    recommendedAction: "Ghi nhận nhu cầu, hướng dẫn các trường mầm non phổ thông phù hợp",
    isActive: true,
  },
];

/**
 * LẤY DANH SÁCH KỊCH BẢN ĐANG CẤU HÌNH (LOCALSTORAGE HOẶC MẶC ĐỊNH)
 */
export function getStoredScenarios(): AutismScenario[] {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY_AUTISM_SCENARIOS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn("Lỗi đọc scenarios từ localStorage:", err);
  }
  return DEFAULT_AUTISM_SCENARIOS;
}

/**
 * LƯU CẤU HÌNH KỊCH BẢN MỚI VÀO BỘ NHỚ DUY TRÌ
 */
export function saveStoredScenarios(scenarios: AutismScenario[]): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY_AUTISM_SCENARIOS, JSON.stringify(scenarios));
      // Bắn CustomEvent để đồng bộ giữa các component nếu cùng tab
      window.dispatchEvent(new CustomEvent("autism_scenarios_updated", { detail: scenarios }));
    }
  } catch (err) {
    console.warn("Lỗi lưu scenarios vào localStorage:", err);
  }
}

/**
 * KHÔI PHỤC BỘ KỊCH BẢN VỀ MẪU MẶC ĐỊNH CHUẨN CỦA CHUYÊN GIA
 */
export function resetStoredScenarios(): AutismScenario[] {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY_AUTISM_SCENARIOS);
      window.dispatchEvent(new CustomEvent("autism_scenarios_updated", { detail: DEFAULT_AUTISM_SCENARIOS }));
    }
  } catch (err) {
    console.warn("Lỗi reset scenarios:", err);
  }
  return DEFAULT_AUTISM_SCENARIOS;
}

/**
 * BỘ PHÂN TÍCH Ý ĐỊNH VÀ TRẢ LỜI ĐÚNG TRỌNG TÂM (AI AUTISM INTENT ANALYZER)
 * Tự động ưu tiên đọc kịch bản cấu hình từ người quản trị nếu không truyền customScenarios.
 */
export function analyzeUserQuestionAndRespond(
  userQuestion: string,
  customerName: string,
  customerPhone = "của gia đình",
  customScenarios?: AutismScenario[]
): {
  response: string;
  scenarioId: string;
  scenarioTitle?: string;
  isOutOfScope: boolean;
  score?: number;
  matchedKeywords?: string[];
} {
  const cleanQ = (userQuestion || "").toLowerCase().trim();
  const safeName = customerName || "Ba/Mẹ";
  const safePhone = customerPhone || "của gia đình";

  if (!cleanQ || cleanQ.length < 3) {
    return {
      response: `Dạ chào ba/mẹ ${safeName}, Cô Hương và ban chuyên môn đã nhận được tín hiệu kết nối. Ba mẹ vui lòng chia sẻ thêm biểu hiện cụ thể của bé nhà mình (như số tháng tuổi, khả năng bật âm, tương tác mắt hay hành vi) để các cô hỗ trợ chính xác nhất nhé ạ!`,
      scenarioId: "sc-clarify-short",
      scenarioTitle: "Yêu cầu chia sẻ thêm thông tin ngắn",
      isOutOfScope: false,
    };
  }

  // Danh sách kịch bản đang hiệu lực (bỏ qua những cái bị tắt isActive === false)
  const sourceScenarios = (customScenarios && customScenarios.length > 0 ? customScenarios : getStoredScenarios())
    .filter((s) => s.isActive !== false);

  // BƯỚC 1: KIỂM TRA DẤU HIỆU NGOÀI PHẠM VI (Y KHOA / THUỐC / TRÔNG TRẺ ĐẠI TRÀ)
  const outOfScopeScenarios = sourceScenarios.filter((s) => s.isOutOfScope);
  for (const sc of outOfScopeScenarios) {
    const matchedKws = sc.keywords.filter((kw) => cleanQ.includes(kw.toLowerCase()));
    if (matchedKws.length > 0) {
      const response = sc.responseTemplate
        .replace(/{customerName}/g, safeName)
        .replace(/{customerPhone}/g, safePhone);
      return {
        response,
        scenarioId: sc.id,
        scenarioTitle: sc.title,
        isOutOfScope: true,
        matchedKeywords: matchedKws,
        score: matchedKws.length * 3,
      };
    }
  }

  // BƯỚC 2: PHÂN TÍCH VÀ CHẤM ĐIỂM Ý ĐỊNH CHUYÊN SÂU TỰ KỶ
  const autismScenarios = sourceScenarios.filter((s) => !s.isOutOfScope);
  let bestScenario: AutismScenario | null = null;
  let highestScore = 0;
  let bestMatchedKws: string[] = [];

  for (const sc of autismScenarios) {
    let score = 0;
    const matchedKws: string[] = [];
    for (const kw of sc.keywords) {
      const lowerKw = kw.toLowerCase();
      if (cleanQ.includes(lowerKw)) {
        const point = lowerKw.length >= 6 ? 3 : 2;
        score += point;
        matchedKws.push(kw);
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestScenario = sc;
      bestMatchedKws = matchedKws;
    }
  }

  if (bestScenario && highestScore >= 2) {
    const response = bestScenario.responseTemplate
      .replace(/{customerName}/g, safeName)
      .replace(/{customerPhone}/g, safePhone);
    return {
      response,
      scenarioId: bestScenario.id,
      scenarioTitle: bestScenario.title,
      isOutOfScope: false,
      score: highestScore,
      matchedKeywords: bestMatchedKws,
    };
  }

  // BƯỚC 3: PHẢN HỒI MẶC ĐỊNH ĐÚNG TRỌNG TÂM CAN THIỆP TỰ KỶ
  return {
    response: `Dạ Cô Hương đã lắng nghe câu hỏi của ba/mẹ ${safeName}: "${userQuestion}". Trung tâm tập trung chuyên sâu vào can thiệp hành vi, kích hoạt âm ngữ và điều hòa cảm giác cho trẻ phổ tự kỷ. Để định hướng đúng nhất cho con, ba mẹ có thể gửi thêm video quay cách con chơi ở nhà hoặc để lại độ tuổi của bé, các cô sẽ phân tích và phản hồi chi tiết ngay cho gia đình nhé ạ!`,
    scenarioId: "sc-autism-general-intake",
    scenarioTitle: "Tiếp nhận câu hỏi chuyên sâu tự kỷ mặc định",
    isOutOfScope: false,
    score: 0,
    matchedKeywords: [],
  };
}

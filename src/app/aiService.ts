import { initialLandingPageConfig, type LandingPageConfig, type LandingSection, type LandingSectionId } from "./landingPage";

export type AiGenerateResult = {
  success: boolean;
  config: LandingPageConfig;
  summary: string[];
  engine: "gemini" | "builtin";
  error?: string;
};

// Hàm trích xuất JSON an toàn từ phản hồi của AI
export function extractJsonFromText(text: string): any {
  if (!text) throw new Error("AI không trả về nội dung");
  const trimmed = text.trim();

  // 1. Thử parse trực tiếp
  try {
    return JSON.parse(trimmed);
  } catch {}

  // 2. Thử bóc tách code block ```json ... ``` hoặc ``` ... ```
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
  let match;
  while ((match = codeBlockRegex.exec(trimmed)) !== null) {
    try {
      return JSON.parse(match[1].trim());
    } catch {}
  }

  // 3. Thử tìm khối {...} ngoài cùng
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
  }

  throw new Error("Không thể phân tích dữ liệu JSON từ phản hồi của AI.");
}

// Kiểm tra tính hợp lệ của API Key Google AI Studio
export async function testGeminiApiKey(
  apiKey: string
): Promise<{ ok: boolean; model?: string; error?: string }> {
  if (!apiKey || apiKey.trim().length < 15) {
    return { ok: false, error: "API Key quá ngắn hoặc không đúng định dạng." };
  }

  const cleanKey = apiKey.trim();
  let lastError = "";

  // 1. Thử gọi Interactions API chuẩn mới với gemini-3.8-flash
  try {
    const intEndpoint = "https://generativelanguage.googleapis.com/v1beta/interactions";
    const res = await fetch(intEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": cleanKey,
      },
      body: JSON.stringify({
        model: "gemini-3.8-flash",
        input: "ping",
      }),
    });

    if (res.ok) {
      return { ok: true, model: "gemini-3.8-flash (Interactions API)" };
    }

    const errJson = await res.json().catch(() => ({}));
    if (errJson?.error?.message) {
      lastError = errJson.error.message;
    }
  } catch (e: any) {
    lastError = e?.message || "Lỗi kết nối";
  }

  // 2. Fallback sang generateContent API với danh sách model cập nhật (bỏ gemini-2.0-flash đã khai tử)
  const models = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-2.5-flash", "gemini-1.5-flash"];

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cleanKey)}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": cleanKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "ping" }] }],
        }),
      });

      if (res.ok) {
        return { ok: true, model };
      }

      const errJson = await res.json().catch(() => ({}));
      if (errJson?.error?.message) {
        lastError = errJson.error.message;
      } else {
        lastError = `HTTP ${res.status}`;
      }
    } catch (e: any) {
      lastError = e?.message || "Lỗi kết nối mạng (CORS/Network)";
    }
  }

  let userFriendlyError = lastError;
  if (lastError.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") || lastError.includes("API key not valid")) {
    userFriendlyError = `Google AI Studio thông báo: Key chưa được xác thực hoặc dự án Google Cloud chưa kích hoạt Generative Language API. Vui lòng kiểm tra lại cấu hình key trên Google AI Studio. Bạn vẫn có thể dùng "AI Thông minh tích hợp" mà không cần key.`;
  }

  return { ok: false, error: userFriendlyError };
}

// 1. Phân tích ngữ nghĩa thông minh cục bộ (Built-in AI Generator - Không cần API Key)
export function smartLocalAiGenerator(
  prompt: string,
  currentConfig: LandingPageConfig,
  targetSectionId: LandingSectionId | "all" = "all"
): AiGenerateResult {
  const p = prompt.trim();
  const summary: string[] = [];

  // Tạo bản sao từ cấu hình hiện tại
  const newConfig: LandingPageConfig = JSON.parse(JSON.stringify(currentConfig));

  // 1. Trích xuất số điện thoại / hotline
  const phoneMatch = p.match(/(?:hotline|sđt|số điện thoại|điện thoại|phone|tel)?[:\s]*(0\d{2,3}[\s.-]?\d{3}[\s.-]?\d{3,4})\b/i);
  if (phoneMatch) {
    newConfig.phone = phoneMatch[1].replace(/[-.]/g, " ");
    summary.push(`Số điện thoại: ${newConfig.phone}`);
  }

  // 2. Trích xuất email
  const emailMatch = p.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
  if (emailMatch) {
    newConfig.email = emailMatch[1];
    summary.push(`Email liên hệ: ${newConfig.email}`);
  }

  // 2.1 Trích xuất Facebook
  const fbMatch = p.match(/(?:facebook|fb|fanpage)\s*[:=]?\s*(https?:\/\/[^\s]+)/i);
  if (fbMatch) {
    newConfig.facebook = fbMatch[1];
    newConfig.enableFloatingFacebook = true;
    summary.push(`Facebook Fanpage: ${newConfig.facebook}`);
  }

  // 2.2 Trích xuất Zalo
  const zaloMatch = p.match(/zalo\s*[:=]?\s*(0\d{9,10}|https?:\/\/[^\s]+)/i);
  if (zaloMatch) {
    newConfig.zalo = zaloMatch[1];
    newConfig.enableFloatingZalo = true;
    summary.push(`Zalo tư vấn: ${newConfig.zalo}`);
  }

  // 3. Trích xuất địa chỉ / khu vực
  const addressKeywords = [
    "Hà Nội", "Hồ Chí Minh", "TP.HCM", "Sài Gòn", "Đà Nẵng", "Hải Phòng",
    "Cần Thơ", "Bình Dương", "Đồng Nai", "Nha Trang", "Quảng Ninh", "Huế",
    "Cầu Giấy", "Đống Đa", "Thanh Xuân", "Hà Đông", "Bình Thạnh", "Tân Bình", "Quận 1", "Quận 7"
  ];
  const foundAddress = addressKeywords.find((kw) => new RegExp(`\\b${kw}\\b`, "i").test(p));
  if (foundAddress) {
    newConfig.address = p.includes("tại") 
      ? p.split(/tại/i)[1]?.split(/[,.]/)[0]?.trim() || `${foundAddress}, Việt Nam`
      : `${foundAddress}, Việt Nam`;
    summary.push(`Địa chỉ: ${newConfig.address}`);
  }

  // 4. Trích xuất tên trung tâm / thương hiệu
  let centerName = "";
  const nameExplicitMatch = p.match(/(?:đổi tên thành|tên là|tên trung tâm|tên lớp|thương hiệu)\s*[:=]?\s*["“']?([^"”'\n,.;]+)["”']?/i);
  const nameKeywordMatch = p.match(/(?:trung tâm|lớp|phòng khám|viện|trường)\s+([^,.;\n]+)/i);
  const matchResult = nameExplicitMatch || nameKeywordMatch;
  if (matchResult) {
    const rawName = matchResult[1].trim();
    const cleanName = rawName.split(/\s+(?:tại|ở|chuyên|với|hotline|số|địa chỉ)\b/i)[0].trim();
    if (cleanName.length > 2) {
      centerName = cleanName;
      newConfig.siteName = cleanName.toLowerCase().startsWith("trung tâm") || cleanName.toLowerCase().startsWith("lớp")
        ? cleanName
        : `Trung tâm Can thiệp ${cleanName}`;
      newConfig.shortName = cleanName.replace(/^(trung tâm|lớp|phòng khám)\s+/i, "");
      if (!emailMatch) {
        const domain = newConfig.shortName.toLowerCase().replace(/[^a-z0-9]/g, "");
        newConfig.email = `lienhe@${domain || "canthiep"}.vn`;
      }
      summary.push(`Tên nhận diện: ${newConfig.siteName}`);
    }
  }

  // 5. Trích xuất tiêu đề cụ thể nếu người dùng yêu cầu
  const titleMatch = p.match(/(?:tiêu đề|title|slogan)\s*(?:mở đầu|hero|chính|cho phần [^:]+|của [^:]+)?\s*(?:là|thành|:)?\s*["“']?([^"”'\n]+?)["”']?(?:\.|\n|$|với|và)/i);
  const customTitle = titleMatch ? titleMatch[1].trim() : "";

  // 6. Trích xuất mô tả cụ thể nếu người dùng yêu cầu
  const descMatch = p.match(/(?:mô tả|nội dung|description)\s*(?:là|thành|:)?\s*["“']?([^"”'\n]+?)["”']?(?:\.|\n|$)/i);
  const customDesc = descMatch ? descMatch[1].trim() : "";

  // Trích xuất chuyên môn
  const isAba = /aba\b/i.test(p);
  const isSpeech = /âm ngữ|ngôn ngữ|chậm nói|bật âm|phát âm/i.test(p);
  const isSensory = /cảm giác|giác quan|vận động|ot\b/i.test(p);
  const isEarly = /can thiệp sớm|tiền tiểu học|hòa nhập/i.test(p);

  const brand = centerName || newConfig.shortName || newConfig.siteName || "Ban Mai Xanh";

  // Xác định phạm vi cập nhật
  const shouldUpdate = (id: LandingSectionId) => {
    if (targetSectionId === id) return true;
    if (targetSectionId !== "all") return false;
    // Nếu chọn all: xem prompt có nhắc tới khối này hay muốn cập nhật chung
    return true;
  };

  // 1. Cập nhật khối Mở đầu (Hero)
  if (shouldUpdate("hero")) {
    const heroSec = newConfig.sections.find((s) => s.id === "hero");
    if (heroSec) {
      if (customTitle && (targetSectionId === "hero" || /mở đầu|hero/i.test(p))) {
        heroSec.title = customTitle;
      } else if (centerName) {
        heroSec.title = `Tôn trọng từng nhịp phát triển của trẻ cùng ${brand}`;
      }

      if (customDesc && (targetSectionId === "hero" || /mở đầu|hero/i.test(p))) {
        heroSec.description = customDesc;
      } else {
        const specialties: string[] = [];
        if (isSpeech) specialties.push("phát triển ngôn ngữ & âm ngữ trị liệu");
        if (isAba) specialties.push("can thiệp hành vi ứng dụng ABA");
        if (isSensory) specialties.push("điều hòa cảm giác và vận động");
        if (isEarly) specialties.push("can thiệp sớm & chuẩn bị vào lớp 1");

        const focusText = specialties.length > 0 
          ? ` Chuyên sâu về ${specialties.join(", ")}.`
          : " Không gian kết nối thấu cảm, an toàn và cá nhân hóa cho từng trẻ.";

        heroSec.description = `Mỗi bước tiến của con đều được trân trọng và ghi nhận.${focusText} Xây dựng lộ trình khoa học và gắn kết chặt chẽ cùng phụ huynh.`;
      }

      heroSec.eyebrow = `Đồng hành cùng trẻ và gia đình tại ${newConfig.address.split(",")[0]}`;
      summary.push("Cập nhật thông điệp mở đầu (Hero)");
    }
  }

  // 2. Cập nhật khối Sứ mệnh (Mission)
  if (shouldUpdate("mission")) {
    const missionSec = newConfig.sections.find((s) => s.id === "mission");
    if (missionSec) {
      if (customTitle && (targetSectionId === "mission" || /sứ mệnh/i.test(p))) {
        missionSec.title = customTitle;
      } else {
        missionSec.title = `Sứ mệnh và cam kết của ${brand}`;
      }
      if (customDesc && (targetSectionId === "mission" || /sứ mệnh/i.test(p))) {
        missionSec.description = customDesc;
      } else {
        missionSec.description = `Chúng tôi lấy sự an tâm của gia đình và hạnh phúc của trẻ làm trung tâm, tôn trọng nhịp phát triển tự nhiên thay vì tạo áp lực.`;
      }

      missionSec.items = [
        {
          id: "m-1",
          title: "Cá nhân hóa theo từng trẻ",
          description: "Mỗi trẻ có hồ sơ đánh giá và kế hoạch can thiệp cá nhân (IEP) độc lập, phù hợp với điểm mạnh riêng."
        },
        {
          id: "m-2",
          title: "Đồng hành 3 bên: Trẻ - Gia đình - Chuyên gia",
          description: "Gia đình luôn được chuyển giao kỹ năng thực hành tại nhà, cập nhật tiến trình hàng tuần minh bạch."
        },
        {
          id: "m-3",
          title: "Môi trường an toàn và nhân văn",
          description: "Không áp đặt, không phán xét. Tôn trọng cảm xúc và quyền riêng tư tuyệt đối của gia đình."
        }
      ];
      summary.push("Cập nhật mục Sứ mệnh");
    }
  }

  // 3. Cập nhật khối Lĩnh vực hỗ trợ (Support)
  if (shouldUpdate("support")) {
    const supportSec = newConfig.sections.find((s) => s.id === "support");
    if (supportSec) {
      if (customTitle && (targetSectionId === "support" || /lĩnh vực/i.test(p))) {
        supportSec.title = customTitle;
      } else {
        supportSec.title = `Các chương trình can thiệp tại ${brand}`;
      }
      supportSec.items = [
        {
          id: "sup-1",
          title: "Âm ngữ trị liệu & Bật âm",
          description: "Hỗ trợ trẻ chậm nói, khó diễn đạt, luyện phát âm, tăng vốn từ và kỹ năng tương tác hai chiều."
        },
        {
          id: "sup-2",
          title: "Can thiệp hành vi ứng dụng (ABA)",
          description: "Giảm các hành vi tiêu cực, hình thành hành vi thích nghi và khả năng làm theo hướng dẫn."
        },
        {
          id: "sup-3",
          title: "Điều hòa cảm giác & Vận động (OT)",
          description: "Giúp trẻ tự điều chỉnh phản ứng giác quan, cải thiện khả năng tập trung và phối hợp vận động thô/tinh."
        },
        {
          id: "sup-4",
          title: "Kỹ năng xã hội & Giao tiếp nhóm",
          description: "Tạo cơ hội chơi luân phiên, chia sẻ, kết nối với bạn bè và thích nghi trong môi trường tập thể."
        },
        {
          id: "sup-5",
          title: "Tiền tiểu học & Kỹ năng học đường",
          description: "Rèn luyện khả năng ngồi bàn, làm theo hiệu lệnh, tiền đọc viết và sự tự tin bước vào lớp 1."
        },
        {
          id: "sup-6",
          title: "Kỹ năng tự lập sinh hoạt",
          description: "Tập ăn uống, tự thay đồ, vệ sinh cá nhân và quản lý đồ dùng để trẻ tự tin trong cuộc sống."
        }
      ];
      summary.push("Cập nhật các lĩnh vực hỗ trợ chuyên sâu");
    }
  }

  // 4. Cập nhật khối Quy trình (Process)
  if (shouldUpdate("process")) {
    const procSec = newConfig.sections.find((s) => s.id === "process");
    if (procSec) {
      procSec.title = "Quy trình can thiệp 5 bước rõ ràng";
      procSec.description = "Minh bạch trong từng giai đoạn, từ đánh giá đầu vào đến chuyển giao kỹ năng cho gia đình.";
      procSec.items = [
        { id: "p-1", meta: "01", title: "Tiếp nhận & Lắng nghe", description: "Trò chuyện ban đầu với phụ huynh để nắm bắt băn khoăn và bối cảnh gia đình." },
        { id: "p-2", meta: "02", title: "Đánh giá phát triển toàn diện", description: "Sử dụng thang đo tiêu chuẩn để xác định độ tuổi phát triển và vùng cần hỗ trợ." },
        { id: "p-3", meta: "03", title: "Xây dựng kế hoạch IEP", description: "Thống nhất mục tiêu can thiệp ngắn hạn và dài hạn cụ thể cùng phụ huynh." },
        { id: "p-4", meta: "04", title: "Thực hiện can thiệp & Ghi nhận", description: "Học tập tương tác 1:1 hoặc nhóm nhỏ, theo dõi dữ liệu tiến bộ mỗi buổi học." },
        { id: "p-5", meta: "05", title: "Đánh giá định kỳ & Điều chỉnh", description: "Họp định kỳ 3-6 tháng để tổng kết kết quả và lập kế hoạch cho giai đoạn kế tiếp." }
      ];
      summary.push("Cập nhật quy trình can thiệp");
    }
  }

  // 5. Cập nhật khối Đội ngũ (Team)
  if (shouldUpdate("team")) {
    const teamSec = newConfig.sections.find((s) => s.id === "team");
    if (teamSec) {
      teamSec.title = `Đội ngũ chuyên gia & giáo viên ${brand}`;
      teamSec.description = "Được đào tạo bài bản về Tâm lý, Giáo dục Đặc biệt và Âm ngữ trị liệu, tận tâm và kiên nhẫn đồng hành.";
      teamSec.items = [
        {
          id: "t-1",
          title: centerName ? `Cô ${centerName}` : "ThS. Hoàng Thị Hương",
          meta: "Giám đốc chuyên môn · ThS Tâm lý học lâm sàng",
          description: "Hơn 10 năm kinh nghiệm đánh giá và thiết kế chương trình can thiệp sớm cho trẻ tự kỷ và chậm phát triển."
        },
        {
          id: "t-2",
          title: "CN. Nguyễn Thu Trang",
          meta: "Chuyên viên Âm ngữ trị liệu",
          description: "Tốt nghiệp ĐH Sư phạm Hà Nội chuyên ngành Giáo dục Đặc biệt, chứng chỉ quốc tế về trị liệu ngôn ngữ."
        },
        {
          id: "t-3",
          title: "CN. Lê Hoàng Minh",
          meta: "Chuyên viên Điều hòa Cảm giác (OT)",
          description: "Chuyên sâu về trị liệu tích hợp cảm giác, vận động chức năng và thiết kế môi trường thân thiện cho trẻ."
        },
        {
          id: "t-4",
          title: "Cô Vũ Mai Anh",
          meta: "Giáo viên Can thiệp sớm & Tiền tiểu học",
          description: "Giàu kinh nghiệm trong việc xây dựng thói quen tự lập, điều hòa cảm xúc và chuẩn bị tâm thế vào lớp 1 cho trẻ."
        }
      ];
      summary.push("Cập nhật đội ngũ giáo viên & chuyên môn");
    }
  }

  // 6. Cập nhật khối FAQ
  if (shouldUpdate("faq")) {
    const faqSec = newConfig.sections.find((s) => s.id === "faq");
    if (faqSec) {
      faqSec.title = "Những câu hỏi phụ huynh thường quan tâm";
      faqSec.description = `Những giải đáp thực tế giúp ba mẹ an tâm khi bắt đầu hành trình đồng hành cùng ${brand}.`;
      faqSec.items = [
        {
          id: "faq-1",
          title: "Thời điểm vàng để can thiệp cho trẻ là khi nào?",
          description: "Giai đoạn từ 18 tháng đến trước 6 tuổi là thời điểm não bộ của trẻ có tính dẻo cao nhất. Can thiệp càng sớm, cơ hội hòa nhập của trẻ càng thuận lợi."
        },
        {
          id: "faq-2",
          title: "Phụ huynh có được tham gia vào các buổi can thiệp không?",
          description: "Chúng tôi luôn khuyến khích và hướng dẫn phụ huynh quan sát trực tiếp hoặc qua camera để nắm vững kỹ thuật tương tác với con tại nhà."
        },
        {
          id: "faq-3",
          title: "Thời lượng một buổi can thiệp kéo dài bao lâu?",
          description: "Mỗi buổi can thiệp 1:1 thường kéo dài từ 45 đến 60 phút, kết hợp với các hoạt động nhóm nhỏ tùy theo độ tuổi và thể lực của từng trẻ."
        },
        {
          id: "faq-4",
          title: "Thông tin đánh giá của con có được bảo mật không?",
          description: "Toàn bộ hồ sơ đánh giá và dữ liệu tiến trình học tập của trẻ được lưu trữ bảo mật tuyệt đối, chỉ chia sẻ khi có sự đồng ý của cha mẹ."
        }
      ];
      summary.push("Cập nhật danh sách câu hỏi FAQ");
    }
  }

  if (summary.length === 0) {
    summary.push("Đã hoàn tất tối ưu nội dung theo yêu cầu của bạn.");
  }

  return {
    success: true,
    config: newConfig,
    summary,
    engine: "builtin",
  };
}

// 2. Gọi Google Gemini API trực tiếp (khi người dùng có API Key)
export async function callGeminiApi(
  prompt: string,
  currentConfig: LandingPageConfig,
  targetSectionId: LandingSectionId | "all",
  apiKey: string
): Promise<AiGenerateResult> {
  const cleanKey = apiKey.trim();
  const modelsToTry = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-2.5-flash", "gemini-1.5-flash"];

  const systemInstruction = `
Bạn là chuyên gia thương hiệu và biên tập nội dung y tế / giáo dục đặc biệt (can thiệp sớm, tự kỷ, chậm nói, trị liệu tâm lý cho trẻ em).
Nhiệm vụ của bạn: Dựa trên yêu cầu của người dùng, cập nhật và hoàn thiện cấu trúc JSON của website.

CÁC NGUYÊN TẮC BẮT BUỘC:
1. Trả về DUY NHẤT một chuỗi JSON hợp lệ, bắt đầu bằng '{' và kết thúc bằng '}'. Tuyệt đối không thêm lời giải thích nào khác ngoài chuỗi JSON.
2. Tiếng Việt tự nhiên, giàu tính thấu cảm, khoa học, chuyên nghiệp. Không dùng chữ in hoa toàn bộ (ALL CAPS). Dấu câu và dấu tiếng Việt đầy đủ, chuẩn mực.
3. Cập nhật đúng trọng tâm theo yêu cầu của người dùng:
   - Nếu người dùng yêu cầu sửa tiêu đề, đổi tên trung tâm, thay đổi thông tin liên hệ, viết lại sứ mệnh, cập nhật giáo viên hay bổ sung nội dung nào, hãy cập nhật CHÍNH XÁC mục đó.
   - Giữ nguyên các thông tin hiện tại không bị yêu cầu thay đổi.
4. Cấu trúc JSON trả về phải bao gồm:
   - siteName, shortName, logo, consultationLabel, phone, email, address, facebook, zalo, enableFloatingFacebook, enableFloatingZalo, enableFloatingPhone, enableBackToTop, enableFloatingPulse, floatingPosition, navigation
   - sections: mảng các section ("general", "hero", "mission", "support", "process", "team", "gallery", "resources", "faq", "contact", "footer").
   - Mỗi section gồm: id, label, title, description, enabled (boolean), eyebrow, primaryAction, secondaryAction, items: [{ id, title, description, meta, image }]
`;

  const promptContent = `Đây là cấu hình website hiện tại:\n${JSON.stringify(currentConfig, null, 2)}\n\nPhạm vi cập nhật: ${targetSectionId === "all" ? "Toàn bộ website" : `Chỉ khối ${targetSectionId}`}\n\nYêu cầu của người dùng:\n${prompt}\n\nHãy trả về JSON cấu hình đã cập nhật hoàn chỉnh:`;

  let lastError: any = null;
  let rawText = "";
  let successfulModel = "gemini-3.8-flash";

  // 1. Thử gọi Google Interactions API (chuẩn tương tác chính thức mới)
  try {
    const intEndpoint = "https://generativelanguage.googleapis.com/v1beta/interactions";
    const intRes = await fetch(intEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": cleanKey,
      },
      body: JSON.stringify({
        model: "gemini-3.8-flash",
        input: promptContent,
        system_instruction: systemInstruction,
        generation_config: {
          response_mime_type: "application/json",
        },
      }),
    });

    if (intRes.ok) {
      const intData = await intRes.json();
      rawText =
        intData?.output_text ||
        intData?.steps?.find((s: any) => s.type === "model_output")?.content ||
        intData?.outputs?.[0]?.text ||
        "";
      if (rawText) {
        successfulModel = "gemini-3.8-flash (Interactions API)";
      }
    } else {
      const errJson = await intRes.json().catch(() => ({}));
      lastError = new Error(errJson?.error?.message || `Interactions API HTTP ${intRes.status}`);
      console.warn("Interactions API call failed, falling back to generateContent:", lastError.message);
    }
  } catch (err: any) {
    lastError = err;
    console.warn("Interactions API request error, falling back to generateContent:", err.message);
  }

  // 2. Fallback sang generateContent API
  if (!rawText) {
    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          parts: [
            {
              text: promptContent,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    };

    for (const model of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cleanKey)}`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": cleanKey,
          },
          body: JSON.stringify(requestBody),
        });

        if (res.ok) {
          const data = await res.json();
          rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (rawText) {
            successfulModel = model;
            break;
          }
        }

        const errData = await res.json().catch(() => ({}));
        lastError = new Error(errData?.error?.message || `HTTP ${res.status}: Lỗi khi gọi model ${model}`);
        console.warn(`Model ${model} failed:`, lastError.message);
      } catch (err: any) {
        lastError = err;
        console.warn(`Fetch to ${model} failed:`, err.message);
      }
    }
  }

  if (!rawText) {
    throw lastError || new Error("Không thể kết nối đến máy chủ Google Gemini API.");
  }

  // Parse JSON bằng parser an toàn
  const parsedConfig = extractJsonFromText(rawText);

  if (!parsedConfig || !Array.isArray(parsedConfig.sections)) {
    throw new Error("Dữ liệu trả về từ Gemini không đúng định dạng cấu hình website.");
  }

  // Ghép an toàn với currentConfig để không làm mất bất kỳ trường nào
  const baseConfig = currentConfig || initialLandingPageConfig;
  const mergedConfig: LandingPageConfig = {
    ...baseConfig,
    ...parsedConfig,
    sections: baseConfig.sections.map((currentSec) => {
      const found = parsedConfig.sections?.find((s: LandingSection) => s.id === currentSec.id);
      if (!found) return currentSec;
      return {
        ...currentSec,
        ...found,
        items: found.items ?? currentSec.items,
      };
    }),
  };

  return {
    success: true,
    config: mergedConfig,
    summary: [
      `Đã tạo nội dung thành công bằng Google Gemini AI (${successfulModel})`,
      `Đã cập nhật dữ liệu trực tiếp theo yêu cầu của bạn`,
    ],
    engine: "gemini",
  };
}

// 3. Hàm kích hoạt chung
export async function generateLandingConfigWithAI(
  prompt: string,
  currentConfig: LandingPageConfig,
  targetSectionId: LandingSectionId | "all" = "all",
  apiKey?: string
): Promise<AiGenerateResult> {
  const cleanKey = apiKey?.trim();
  if (cleanKey && cleanKey.length >= 15) {
    try {
      return await callGeminiApi(prompt, currentConfig, targetSectionId, cleanKey);
    } catch (err: any) {
      console.warn("Gemini call failed, switching to smart local generator:", err);
      // Khi Gemini bị lỗi, gọi local generator nhưng thông báo rõ lý do
      const localRes = smartLocalAiGenerator(prompt, currentConfig, targetSectionId);
      return {
        ...localRes,
        error: `Không thể kết nối Google Gemini (${err.message}). Hệ thống đã tự động dùng AI Thông minh tích hợp để xử lý yêu cầu của bạn.`,
      };
    }
  }
  return smartLocalAiGenerator(prompt, currentConfig, targetSectionId);
}

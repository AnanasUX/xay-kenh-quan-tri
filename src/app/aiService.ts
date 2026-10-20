import { initialLandingPageConfig, type LandingPageConfig, type LandingSection, type LandingSectionId } from "./landingPage";

export type AiGenerateResult = {
  success: boolean;
  config: LandingPageConfig;
  summary: string[];
  engine: "gemini" | "builtin";
  error?: string;
};

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

  // Trích xuất số điện thoại
  const phoneMatch = p.match(/(0\d{2,3}[\s.-]?\d{3}[\s.-]?\d{3,4})/);
  if (phoneMatch) {
    newConfig.phone = phoneMatch[1].replace(/[-.]/g, " ");
    summary.push(`Số điện thoại: ${newConfig.phone}`);
  }

  // Trích xuất địa chỉ / thành phố
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
    summary.push(`Địa chỉ hoạt động: ${newConfig.address}`);
  }

  // Trích xuất tên trung tâm / lớp
  let centerName = "";
  const nameMatch = p.match(/(?:trung tâm|lớp|phòng khám|viện|trường)\s+([^,.;\n]+)/i);
  if (nameMatch) {
    const rawName = nameMatch[1].trim();
    // Lọc bỏ các từ nối
    const cleanName = rawName.split(/\s+(?:tại|ở|chuyên|với|hotline|số|địa chỉ)\b/i)[0].trim();
    if (cleanName.length > 2) {
      centerName = cleanName;
      newConfig.siteName = `Trung tâm Can thiệp ${centerName}`;
      newConfig.shortName = centerName;
      const domain = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "");
      newConfig.email = `lienhe@${domain || "canthiep"}.vn`;
      summary.push(`Tên trung tâm: ${newConfig.siteName}`);
    }
  }

  // Trích xuất phương pháp / chuyên môn
  const isAba = /aba\b/i.test(p);
  const isSpeech = /âm ngữ|ngôn ngữ|chậm nói|bật âm|phát âm/i.test(p);
  const isSensory = /cảm giác|giác quan|vận động|ot\b/i.test(p);
  const isTeacch = /teacch\b/i.test(p);
  const isPecs = /pecs\b/i.test(p);
  const isEarly = /can thiệp sớm|tiền tiểu học|hòa nhập/i.test(p);

  const brand = centerName || newConfig.shortName || "Ban Mai Xanh";

  // Cập nhật từng section tùy theo targetSectionId
  const shouldUpdate = (id: LandingSectionId) => targetSectionId === "all" || targetSectionId === id;

  // 1. Hero
  if (shouldUpdate("hero")) {
    const heroSec = newConfig.sections.find((s) => s.id === "hero");
    if (heroSec) {
      heroSec.eyebrow = `Đồng hành cùng trẻ và gia đình tại ${newConfig.address.split(",")[0]}`;
      heroSec.title = centerName 
        ? `Tôn trọng từng nhịp phát triển của trẻ cùng ${brand}`
        : "Tôn trọng từng nhịp phát triển, đồng hành cùng gia đình";
      
      const specialties: string[] = [];
      if (isSpeech) specialties.push("phát triển ngôn ngữ & âm ngữ trị liệu");
      if (isAba) specialties.push("can thiệp hành vi ứng dụng ABA");
      if (isSensory) specialties.push("điều hòa cảm giác và vận động");
      if (isEarly) specialties.push("can thiệp sớm & chuẩn bị vào lớp 1");

      const focusText = specialties.length > 0 
        ? ` Chuyên sâu về ${specialties.join(", ")}.`
        : " Không gian kết nối thấu cảm, an toàn và cá nhân hóa cho từng trẻ.";

      heroSec.description = `Mỗi bước tiến của con đều được trân trọng và ghi nhận.${focusText} Xây dựng lộ trình khoa học và gắn kết chặt chẽ cùng phụ huynh.`;
      summary.push("Cập nhật thông điệp mở đầu (Hero)");
    }
  }

  // 2. Sứ mệnh (Mission)
  if (shouldUpdate("mission")) {
    const missionSec = newConfig.sections.find((s) => s.id === "mission");
    if (missionSec) {
      missionSec.title = `Sứ mệnh và cam kết của ${brand}`;
      missionSec.description = `Chúng tôi lấy sự an tâm của gia đình và hạnh phúc của trẻ làm trung tâm, tôn trọng nhịp phát triển tự nhiên thay vì tạo áp lực.`;
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
      summary.push("Cập nhật 3 trụ cột sứ mệnh");
    }
  }

  // 3. Lĩnh vực hỗ trợ (Support)
  if (shouldUpdate("support")) {
    const supportSec = newConfig.sections.find((s) => s.id === "support");
    if (supportSec) {
      supportSec.title = `Các chương trình can thiệp tại ${brand}`;
      supportSec.description = "Thiết kế dựa trên các mô hình khoa học quốc tế, linh hoạt theo độ tuổi và khả năng của trẻ.";
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
      summary.push("Cập nhật 6 lĩnh vực can thiệp chuyên sâu");
    }
  }

  // 4. Quy trình (Process)
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
      summary.push("Cập nhật quy trình can thiệp 5 bước");
    }
  }

  // 5. Đội ngũ (Team)
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
      summary.push("Cập nhật hồ sơ 4 chuyên gia/giáo viên tiêu biểu");
    }
  }

  // 6. FAQ
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
      summary.push("Cập nhật 4 câu hỏi thường gặp (FAQ)");
    }
  }

  // 7. Tài nguyên (Resources)
  if (shouldUpdate("resources")) {
    const resSec = newConfig.sections.find((s) => s.id === "resources");
    if (resSec) {
      resSec.title = "Góc chia sẻ kiến thức cho phụ huynh";
      resSec.description = "Các bài viết hữu ích giúp ba mẹ tự tin hỗ trợ con trong từng sinh hoạt thường nhật.";
      resSec.items = [
        {
          id: "res-1",
          title: "5 cách kích thích phản xạ ngôn ngữ tự nhiên tại nhà",
          description: "Tận dụng những khoảnh khắc đời thường như giờ ăn, giờ tắm để tạo nhu cầu giao tiếp cho trẻ.",
          meta: "Âm ngữ"
        },
        {
          id: "res-2",
          title: "Xử lý cơn giận dữ (Meltdown) ở trẻ tự kỷ an toàn",
          description: "Cách nhận biết các dấu hiệu quá tải giác quan và bước hỗ trợ giúp trẻ bình tĩnh trở lại.",
          meta: "Cảm xúc"
        },
        {
          id: "res-3",
          title: "Xây dựng lịch trình trực quan bằng hình ảnh (PECS)",
          description: "Tạo cấu trúc ngày rõ ràng giúp trẻ giảm bớt lo âu và tự chủ trong các hoạt động hàng ngày.",
          meta: "Kỹ năng sống"
        }
      ];
      summary.push("Cập nhật 3 bài viết cẩm nang phụ huynh");
    }
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
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;

  const systemInstruction = `
Bạn là chuyên gia thương hiệu và biên tập nội dung y tế / giáo dục đặc biệt (can thiệp sớm, tự kỷ, chậm nói, trị liệu tâm lý cho trẻ em).
Nhiệm vụ của bạn: Dựa trên yêu cầu của người dùng, cập nhật và hoàn thiện cấu trúc JSON của trang landing page.

CÁC NGUYÊN TẮC QUAN TRỌNG:
1. Trả về DUY NHẤT một chuỗi JSON hợp lệ, không bọc markdown block (\`\`\`json ... \`\`\`), không có lời mở đầu hay kết thúc.
2. Tiếng Việt chuẩn mực, giàu tính thấu cảm, khoa học, chuyên nghiệp, không sáo rỗng.
3. Tuyệt đối không dùng chữ in hoa dài (ALL CAPS) cho các đoạn văn bản. Dấu tiếng Việt phải rõ ràng, tự nhiên.
4. Giữ nguyên cấu trúc thuộc tính của LandingPageConfig:
   - siteName, shortName, logo, consultationLabel, phone, email, address, navigation
   - sections: mảng các section với id ("general", "hero", "mission", "support", "process", "team", "gallery", "resources", "faq", "contact", "footer").
   - Mỗi section có: id, label, title, description, enabled (boolean), eyebrow (nếu có), primaryAction, secondaryAction, items (mảng các item { id, title, description, meta }).
5. Cập nhật đúng các mục mà người dùng yêu cầu: ${targetSectionId === "all" ? "toàn bộ các khối" : `chỉ tập trung vào khối "${targetSectionId}"`}.
`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `Đây là cấu hình hiện tại:\n${JSON.stringify(currentConfig, null, 2)}\n\nYêu cầu của người dùng:\n${prompt}\n\nHãy tạo lại cấu hình JSON hoàn chỉnh theo đúng yêu cầu:`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.6,
      topK: 40,
      topP: 0.95,
      responseMimeType: "application/json"
    }
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `HTTP ${res.status}: Không thể gọi Gemini API`);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("Gemini không trả về kết quả nội dung");
    }

    // Làm sạch chuỗi JSON nếu có markdown code fence
    const cleanedJson = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsedConfig = JSON.parse(cleanedJson) as LandingPageConfig;

    if (!parsedConfig || !Array.isArray(parsedConfig.sections)) {
      throw new Error("Dữ liệu JSON từ Gemini không đúng định dạng website");
    }

    // Ghép với initialLandingPageConfig để đảm bảo không bị thiếu section nào
    const mergedConfig: LandingPageConfig = {
      ...initialLandingPageConfig,
      ...parsedConfig,
      sections: initialLandingPageConfig.sections.map((defaultSec) => {
        const found = parsedConfig.sections?.find((s) => s.id === defaultSec.id);
        if (!found) return defaultSec;
        return {
          ...defaultSec,
          ...found,
          items: found.items ?? defaultSec.items,
        };
      }),
    };

    return {
      success: true,
      config: mergedConfig,
      summary: [
        "Đã sinh cấu hình thông minh thành công bằng Google Gemini AI",
        `Đã cập nhật ${mergedConfig.sections.length} khối nội dung`,
      ],
      engine: "gemini",
    };
  } catch (err: any) {
    console.warn("Gemini API call failed, falling back to smart local engine:", err);
    // Tự động chuyển tiếp sang built-in generator nếu Gemini bị lỗi
    const localResult = smartLocalAiGenerator(prompt, currentConfig, targetSectionId);
    return {
      ...localResult,
      error: `Gemini: ${err.message}. Đã chuyển sang chế độ AI Thông minh tích hợp.`,
    };
  }
}

// 3. Hàm kích hoạt chung
export async function generateLandingConfigWithAI(
  prompt: string,
  currentConfig: LandingPageConfig,
  targetSectionId: LandingSectionId | "all" = "all",
  apiKey?: string
): Promise<AiGenerateResult> {
  if (apiKey && apiKey.trim().length > 10) {
    return callGeminiApi(prompt, currentConfig, targetSectionId, apiKey.trim());
  }
  return smartLocalAiGenerator(prompt, currentConfig, targetSectionId);
}

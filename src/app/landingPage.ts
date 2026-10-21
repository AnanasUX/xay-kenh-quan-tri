export type LandingSectionId =
  | "general"
  | "hero"
  | "mission"
  | "support"
  | "process"
  | "team"
  | "gallery"
  | "resources"
  | "faq"
  | "contact"
  | "footer";

export type ConfigItem = {
  id: string;
  title: string;
  description?: string;
  meta?: string;
  image?: string;
};

export type LandingSection = {
  id: LandingSectionId;
  label: string;
  eyebrow?: string;
  title: string;
  description: string;
  enabled: boolean;
  image?: string;
  primaryAction?: string;
  secondaryAction?: string;
  items?: ConfigItem[];
};

export type LandingPageConfig = {
  siteName: string;
  shortName: string;
  logo: string;
  consultationLabel: string;
  phone: string;
  email: string;
  address: string;
  facebook?: string;
  zalo?: string;
  enableFloatingFacebook?: boolean;
  enableFloatingZalo?: boolean;
  enableFloatingPhone?: boolean;
  enableBackToTop?: boolean;
  enableFloatingPulse?: boolean;
  floatingPosition?: "right" | "left";
  navigation: { label: string; path: string }[];
  sections: LandingSection[];
};

export const initialLandingPageConfig: LandingPageConfig = {
  "siteName": "Trung tâm Hỗ trợ Trẻ tự kỷ Cô Hương",
  "shortName": "Cô Hương",
  "logo": "./images/brand-logo.png",
  "consultationLabel": "Tư vấn ngay",
  "phone": "096 290 3942",
  "email": "mamnonhpkid@gmail.com",
  "address": "TDP Duyên Phúc, xã Hưng Hà, Tỉnh Thái Bình",
  "facebook": "https://www.facebook.com",
  "zalo": "096 290 3942",
  "enableFloatingFacebook": true,
  "enableFloatingZalo": true,
  "enableFloatingPhone": true,
  "enableBackToTop": true,
  "enableFloatingPulse": true,
  "floatingPosition": "right",
  "navigation": [
    {
      "label": "Giới thiệu",
      "path": "#about"
    },
    {
      "label": "Lĩnh vực",
      "path": "#areas"
    },
    {
      "label": "Quy trình",
      "path": "#process"
    },
    {
      "label": "Không gian",
      "path": "#gallery"
    },
    {
      "label": "Góc phụ huynh",
      "path": "#resources"
    },
    {
      "label": "FAQ",
      "path": "#faq"
    },
    {
      "label": "Liên hệ",
      "path": "#contact"
    }
  ],
  "sections": [
    {
      "id": "general",
      "label": "Thông tin chung",
      "title": "Thông tin nhận diện",
      "description": "Tên trung tâm, logo, điều hướng và thông tin liên hệ dùng trên toàn website.",
      "enabled": true
    },
    {
      "id": "hero",
      "label": "Mở đầu",
      "eyebrow": "Đồng hành cùng trẻ và gia đình tại TDP Duyên Phúc, xã Hưng Hà, Tỉnh Thái Bình",
      "title": "Tôn trọng từng nhịp phát triển, đồng hành cùng gia đình",
      "description": "Mỗi bước tiến của con đều được trân trọng và ghi nhận. Trung tâm chuyên sâu về phát triển ngôn ngữ & âm ngữ trị liệu, can thiệp hành vi ứng dụng ABA, điều hòa cảm giác và vận động, can thiệp sớm & chuẩn bị vào lớp 1. Chúng tôi xây dựng lộ trình khoa học, cá nhân hóa và gắn kết chặt chẽ cùng phụ huynh trên hành trình giúp con hòa nhập.",
      "enabled": true,
      "image": "./images/classroom-main.jpg",
      "primaryAction": "Tư vấn ngay",
      "secondaryAction": "Phương pháp dạy học"
    },
    {
      "id": "mission",
      "label": "Sứ mệnh",
      "title": "Sứ mệnh và cam kết của Trung tâm hỗ trợ trẻ tự kỷ Cô Hương",
      "description": "Chúng tôi lấy sự an tâm của gia đình và hạnh phúc của trẻ làm trung tâm, tôn trọng nhịp phát triển tự nhiên thay vì tạo áp lực hay gò ép con.",
      "enabled": true,
      "items": [
        {
          "id": "mission-1",
          "title": "Cá nhân hóa theo từng trẻ",
          "description": "Mỗi trẻ có hồ sơ đánh giá và kế hoạch can thiệp cá nhân (IEP) độc lập, thiết kế riêng biệt phù hợp với thế mạnh và mức độ phát triển của con."
        },
        {
          "id": "mission-2",
          "title": "Đồng hành 3 bên: Trẻ – Gia đình – Chuyên gia",
          "description": "Gia đình luôn được chuyển giao kỹ năng thực hành tại nhà, cập nhật tiến trình và dữ liệu tiến bộ của con hàng tuần một cách minh bạch."
        },
        {
          "id": "mission-3",
          "title": "Môi trường an toàn và nhân văn",
          "description": "Không áp đặt, không phán xét. Trung tâm cam kết tôn trọng cảm xúc, tâm lý của con và bảo mật tuyệt đối thông tin của gia đình."
        }
      ]
    },
    {
      "id": "support",
      "label": "Lĩnh vực hỗ trợ",
      "eyebrow": "Chương trình can thiệp chuyên biệt chuẩn khoa học",
      "title": "Các chương trình can thiệp chuyên sâu tại trung tâm",
      "description": "Thiết kế dựa trên các mô hình khoa học quốc tế, linh hoạt theo độ tuổi, khả năng tiếp thu và nhu cầu thực tế của từng trẻ.",
      "enabled": true,
      "items": [
        {
          "id": "support-1",
          "title": "Âm ngữ trị liệu & Bật âm",
          "description": "Hỗ trợ trẻ chậm nói, khó diễn đạt, luyện phát âm chuẩn, gia tăng vốn từ vựng và phát triển kỹ năng tương tác hai chiều hiệu quả."
        },
        {
          "id": "support-2",
          "title": "Can thiệp hành vi ứng dụng (ABA)",
          "description": "Giảm thiểu các hành vi tiêu cực, hình thành thói quen hành vi thích nghi tích cực và rèn luyện khả năng làm theo hướng dẫn."
        },
        {
          "id": "support-3",
          "title": "Điều hòa cảm giác & Vận động (OT)",
          "description": "Giúp trẻ tự điều chỉnh phản ứng giác quan, cải thiện khả năng tập trung chú ý và nâng cao sự phối hợp vận động thô/tinh."
        },
        {
          "id": "support-4",
          "title": "Kỹ năng xã hội & Giao tiếp nhóm",
          "description": "Tạo cơ hội cho con chơi luân phiên, chia sẻ, kết nối với bạn bè và học cách thích nghi linh hoạt trong môi trường tập thể."
        },
        {
          "id": "support-5",
          "title": "Tiền tiểu học & Kỹ năng học đường",
          "description": "Rèn luyện tác phong ngồi bàn, khả năng tập trung nghe giảng, làm theo hiệu lệnh, tiền đọc viết và sự tự tin vững bước vào lớp 1."
        },
        {
          "id": "support-6",
          "title": "Kỹ năng tự lập sinh hoạt",
          "description": "Hướng dẫn trẻ tự ăn uống, thay đồ, vệ sinh cá nhân và quản lý đồ dùng cá nhân để tự chủ hơn trong cuộc sống hằng ngày."
        }
      ]
    },
    {
      "id": "process",
      "label": "Quy trình",
      "eyebrow": "Quy trình can thiệp 5 bước rõ ràng và khoa học",
      "title": "Quy trình can thiệp 5 bước rõ ràng và khoa học",
      "description": "Đảm bảo sự minh bạch trong từng giai đoạn, từ đánh giá đầu vào chính xác đến chuyển giao kỹ năng bền vững cho gia đình.",
      "enabled": true,
      "items": [
        {
          "id": "process-1",
          "title": "Tiếp nhận & Lắng nghe",
          "description": "Trò chuyện chuyên sâu ban đầu với phụ huynh để thấu hiểu những băn khoăn, mong đợi và bối cảnh sinh hoạt của gia đình.",
          "meta": "01"
        },
        {
          "id": "process-2",
          "title": "Đánh giá phát triển toàn diện",
          "description": "Sử dụng các bộ thang đo tiêu chuẩn uy tín để xác định chính xác độ tuổi phát triển và các vùng kỹ năng con cần hỗ trợ.",
          "meta": "02"
        },
        {
          "id": "process-3",
          "title": "Xây dựng kế hoạch IEP cá nhân",
          "description": "Thống nhất với phụ huynh về các mục tiêu can thiệp ngắn hạn và dài hạn cụ thể, phù hợp nhất với nhịp độ của con.",
          "meta": "03"
        },
        {
          "id": "process-4",
          "title": "Thực hiện can thiệp & Ghi nhận",
          "description": "Triển khai các giờ học tương tác 1:1 hoặc nhóm nhỏ, đồng thời theo dõi sát sao dữ liệu tiến bộ của con qua từng buổi.",
          "meta": "04"
        },
        {
          "id": "process-5",
          "title": "Đánh giá định kỳ & Điều chỉnh",
          "description": "Tổ chức họp đánh giá định kỳ 3–6 tháng để tổng kết kết quả đạt được, từ đó điều chỉnh lộ trình cho giai đoạn tiếp theo.",
          "meta": "05"
        }
      ]
    },
    {
      "id": "gallery",
      "label": "Không gian",
      "title": "Không gian học tập an toàn và truyền cảm hứng",
      "description": "Hệ thống phòng học cá nhân, phòng vận động giác quan và khu vực kỹ năng được thiết kế tối ưu, ấm cúng, đầy đủ giáo cụ trực quan giúp trẻ thoải mái khám phá.",
      "enabled": true,
      "image": "./images/classroom-main.jpg",
      "items": [
        {
          "id": "gallery-1",
          "title": "Toàn cảnh phòng học sáng, thoáng với nội thất gỗ tự nhiên thân thiện",
          "meta": "./images/classroom-main.jpg"
        },
        {
          "id": "gallery-2",
          "title": "Chi tiết góc học tập cá nhân với giáo cụ trực quan phong phú",
          "meta": "./images/classroom-detail.jpg"
        },
        {
          "id": "gallery-3",
          "title": "Khu vực vận động cảm giác và tương tác nhóm an toàn",
          "meta": "./images/classroom-main.jpg"
        }
      ]
    },
    {
      "id": "resources",
      "label": "Tài nguyên",
      "eyebrow": "Góc chia sẻ kiến thức hữu ích cho ba mẹ",
      "title": "Góc chia sẻ kiến thức hữu ích cho ba mẹ",
      "description": "Tổng hợp các bài viết, cẩm nang thực hành giúp ba mẹ tự tin đồng hành và hỗ trợ con trong từng sinh hoạt thường nhật.",
      "enabled": true,
      "items": [
        {
          "id": "resource-1",
          "title": "5 cách kích thích phản xạ ngôn ngữ tự nhiên tại nhà cho trẻ chậm nói",
          "description": "Tận dụng những khoảnh khắc đời thường như giờ ăn, giờ tắm, lúc đi dạo để tạo nhu cầu giao tiếp tự nhiên cho trẻ.",
          "meta": "Âm ngữ"
        },
        {
          "id": "resource-2",
          "title": "Xử lý cơn giận dữ (Meltdown) ở trẻ tự kỷ một cách an toàn và thấu cảm",
          "description": "Cách nhận biết sớm các dấu hiệu quá tải giác quan và các bước xử lý giúp con nhanh chóng lấy lại sự bình tĩnh.",
          "meta": "Cảm xúc"
        },
        {
          "id": "resource-3",
          "title": "Xây dựng lịch trình sinh hoạt trực quan bằng hình ảnh (PECS) cho trẻ",
          "description": "Tạo cấu trúc ngày rõ ràng giúp giảm bớt sự lo âu, giúp trẻ chủ động và tự lập trong các hoạt động hằng ngày.",
          "meta": "Kỹ năng sống"
        }
      ]
    },
    {
      "id": "faq",
      "label": "Câu hỏi thường gặp",
      "title": "Những câu hỏi phụ huynh thường quan tâm",
      "description": "Giải đáp thực tế giúp ba mẹ giải tỏa băn khoăn khi bắt đầu hành trình đồng hành cùng trung tâm.",
      "enabled": true,
      "items": [
        {
          "id": "faq-1",
          "title": "Thời điểm vàng để can thiệp cho trẻ là khi nào?",
          "description": "Giai đoạn từ 18 tháng đến trước 6 tuổi là \"thời điểm vàng\" khi não bộ của trẻ có tính dẻo cao nhất. Can thiệp càng sớm, cơ hội hòa nhập và bắt nhịp với bạn bè của trẻ càng thuận lợi."
        },
        {
          "id": "faq-2",
          "title": "Phụ huynh có được tham gia vào các buổi can thiệp không?",
          "description": "Có. Trung tâm luôn khuyến khích và tạo điều kiện để phụ huynh quan sát, phối hợp cùng giáo viên, từ đó nắm bắt phương pháp để tiếp tục hỗ trợ con hiệu quả khi ở nhà."
        },
        {
          "id": "faq-3",
          "title": "Thời lượng một buổi can thiệp của con kéo dài bao lâu?",
          "description": "Tùy thuộc vào chương trình và độ tuổi, mỗi buổi can thiệp thường kéo dài từ 45 đến 60 phút để đảm bảo sự tập trung cao độ và năng lượng tốt nhất cho trẻ."
        },
        {
          "id": "faq-4",
          "title": "Thông tin đánh giá và hồ sơ của con có được bảo mật không?",
          "description": "Tuyệt đối bảo mật. Mọi hồ sơ, kết quả đánh giá chuyên môn và thông tin cá nhân của trẻ chỉ được dùng cho mục đích can thiệp và có sự đồng ý của gia đình."
        }
      ]
    },
    {
      "id": "contact",
      "label": "Biểu mẫu tư vấn",
      "eyebrow": "ĐỒNG HÀNH CÙNG CON TỪ HÔM NAY",
      "title": "Đăng ký tư vấn & Đánh giá phát triển cho con",
      "description": "Để lại thông tin để chuyên gia của Trung tâm Cô Hương liên hệ và hỗ trợ ba mẹ đặt lịch đánh giá phát triển chuyên sâu hoàn toàn miễn phí.",
      "enabled": true,
      "primaryAction": "Gửi yêu cầu tư vấn miễn phí",
      "items": [
        {
          "id": "field-name",
          "title": "Họ tên phụ huynh",
          "meta": "text"
        },
        {
          "id": "field-phone",
          "title": "Số điện thoại",
          "meta": "tel"
        },
        {
          "id": "field-need",
          "title": "Nhu cầu gia đình quan tâm",
          "meta": "select"
        },
        {
          "id": "field-note",
          "title": "Điều bạn muốn chia sẻ thêm",
          "meta": "textarea"
        }
      ]
    },
    {
      "id": "footer",
      "label": "Chân trang",
      "title": "Trung tâm Hỗ trợ Trẻ tự kỷ Cô Hương",
      "description": "Đồng hành cùng trẻ tự kỷ, chậm nói và gia đình bằng sự thấu hiểu, tôn trọng nhịp phát triển và phương pháp khoa học chuẩn mực tại TDP Duyên Phúc, xã Hưng Hà, Tỉnh Thái Bình.",
      "enabled": true,
      "items": [
        {
          "id": "footer-1",
          "title": "Khám phá",
          "description": "Giới thiệu · Lĩnh vực · Quy trình · Không gian"
        },
        {
          "id": "footer-2",
          "title": "Hỗ trợ phụ huynh",
          "description": "Góc phụ huynh · Câu hỏi thường gặp · Đăng ký tư vấn · Chính sách bảo mật"
        }
      ]
    }
  ]
};

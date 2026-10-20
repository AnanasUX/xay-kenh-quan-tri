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
  navigation: { label: string; path: string }[];
  sections: LandingSection[];
};

export const initialLandingPageConfig: LandingPageConfig = {
  siteName: "Lớp Can Thiệp Chuyên Biệt Cô Hương",
  shortName: "Cô Hương",
  logo: "logo-co-huong.svg",
  consultationLabel: "Đăng ký tư vấn",
  phone: "090 123 4567",
  email: "lienhe@cothuong.vn",
  address: "Hà Nội, Việt Nam",
  navigation: [
    { label: "Trang chủ", path: "/" },
    { label: "Giới thiệu", path: "/#gioi-thieu" },
    { label: "Chương trình can thiệp", path: "/#chuong-trinh-can-thiep" },
    { label: "Đội ngũ", path: "/#doi-ngu" },
    { label: "Góc phụ huynh", path: "/#goc-phu-huynh" },
    { label: "Liên hệ", path: "/#lien-he" },
  ],
  sections: [
    {
      id: "general",
      label: "Thông tin chung",
      title: "Thông tin nhận diện",
      description: "Tên trung tâm, logo, điều hướng và thông tin liên hệ dùng trên toàn website.",
      enabled: true,
    },
    {
      id: "hero",
      label: "Mở đầu",
      eyebrow: "THIẾT KẾ MỘT HÀNH TRÌNH PHÙ HỢP VỚI TRẺ",
      title: "Tôn trọng từng nhịp phát triển, đồng hành cùng gia đình",
      description:
        "Không gian kết nối dành cho trẻ và phụ huynh, nơi mỗi khác biệt được lắng nghe, mỗi bước tiến được ghi nhận, và hành trình phát triển được xây dựng bằng sự thấu hiểu.",
      enabled: true,
      image: "khong-gian-hoc-tap-hero.jpg",
      primaryAction: "Đăng ký tư vấn",
      secondaryAction: "Tìm hiểu phương pháp",
    },
    {
      id: "mission",
      label: "Sứ mệnh",
      title: "Sứ mệnh và môi trường hỗ trợ",
      description:
        "Chúng tôi xây dựng sự an tâm trước, hiểu nhu cầu trước, rồi mới lựa chọn hướng hỗ trợ.",
      enabled: true,
      items: [
        { id: "mission-1", title: "Tôn trọng từng nhịp phát triển", description: "Không so sánh, không thúc ép. Mỗi trẻ có một cách cảm nhận và tốc độ trưởng thành riêng." },
        { id: "mission-2", title: "Phối hợp chặt chẽ với gia đình", description: "Gia đình luôn là người đồng hành quan trọng trong mọi mục tiêu và quyết định." },
        { id: "mission-3", title: "An toàn và kín đáo", description: "Thông tin được tôn trọng, trao đổi minh bạch và chỉ sử dụng cho mục đích hỗ trợ." },
      ],
    },
    {
      id: "support",
      label: "Lĩnh vực hỗ trợ",
      title: "Lĩnh vực hỗ trợ tham khảo",
      description:
        "Nội dung dưới đây chỉ mang tính tham khảo. Trong trao đổi ban đầu, chúng tôi cùng gia đình nhìn vào nhu cầu thực tế thay vì gán nhãn cho trẻ.",
      enabled: true,
      items: [
        { id: "support-1", title: "Giao tiếp / Ngôn ngữ", description: "Trẻ chậm nói, khó diễn đạt, ít tương tác hoặc cần phát triển kỹ năng giao tiếp." },
        { id: "support-2", title: "Kỹ năng xã hội", description: "Tăng khả năng kết nối, hợp tác, làm việc nhóm và thích nghi trong môi trường mới." },
        { id: "support-3", title: "Tự lập", description: "Hỗ trợ trẻ hình thành thói quen, kỹ năng tự chăm sóc và chủ động trong sinh hoạt." },
        { id: "support-4", title: "Nhận thức / Học tập", description: "Khơi gợi hứng thú học hỏi, tăng tập trung và xây dựng chiến lược học phù hợp." },
        { id: "support-5", title: "Điều hòa cảm xúc", description: "Nhận biết, gọi tên và thể hiện cảm xúc theo cách an toàn, tích cực." },
        { id: "support-6", title: "Học qua chơi", description: "Thiết kế hoạt động vui chơi có mục tiêu, phù hợp nhịp độ và sở thích của trẻ." },
      ],
    },
    {
      id: "process",
      label: "Quy trình",
      title: "Quy trình tham khảo",
      description:
        "Gia đình được trao đổi xuyên suốt. Chúng tôi bắt đầu từ nhu cầu thực tế, đồng thuận mục tiêu và theo dõi những thay đổi nhỏ nhất.",
      enabled: true,
      items: [
        { id: "process-1", title: "Tiếp nhận thông tin gia đình", description: "Lắng nghe nhu cầu, bối cảnh và những băn khoăn ban đầu của phụ huynh.", meta: "01" },
        { id: "process-2", title: "Trao đổi nhu cầu", description: "Cùng gia đình xác định điều cần ưu tiên và kết quả mong đợi.", meta: "02" },
        { id: "process-3", title: "Xây dựng mục tiêu", description: "Lựa chọn mục tiêu thực tế, có thể theo dõi và phù hợp với trẻ.", meta: "03" },
        { id: "process-4", title: "Thực hiện / Theo dõi", description: "Đồng hành qua hoạt động, ghi nhận tiến triển và trao đổi thường xuyên.", meta: "04" },
        { id: "process-5", title: "Trao đổi định kỳ", description: "Cập nhật, điều chỉnh kế hoạch và thống nhất bước tiếp theo cùng gia đình.", meta: "05" },
      ],
    },
    {
      id: "team",
      label: "Đội ngũ",
      title: "Đội ngũ giáo viên",
      description:
        "Mỗi hồ sơ có sẵn vị trí cho ảnh, tên, chuyên môn và phần giới thiệu. Thông tin chính thức sẽ được cập nhật sau khi trung tâm xác minh.",
      enabled: true,
      items: [
        { id: "teacher-1", title: "Tên giáo viên", description: "Thêm phần giới thiệu ngắn về kinh nghiệm, chuyên môn và phương pháp đồng hành cùng trẻ.", meta: "Chuyên môn / vai trò" },
        { id: "teacher-2", title: "Tên giáo viên", description: "Thêm phần giới thiệu ngắn về kinh nghiệm, chuyên môn và phương pháp đồng hành cùng trẻ.", meta: "Chuyên môn / vai trò" },
        { id: "teacher-3", title: "Tên giáo viên", description: "Thêm phần giới thiệu ngắn về kinh nghiệm, chuyên môn và phương pháp đồng hành cùng trẻ.", meta: "Chuyên môn / vai trò" },
        { id: "teacher-4", title: "Tên giáo viên", description: "Thêm phần giới thiệu ngắn về kinh nghiệm, chuyên môn và phương pháp đồng hành cùng trẻ.", meta: "Chuyên môn / vai trò" },
      ],
    },
    {
      id: "gallery",
      label: "Không gian",
      title: "Không gian học tập",
      description:
        "Các hình ảnh dưới đây chỉ minh họa định hướng không gian. Cần bổ sung ảnh thực tế được phép sử dụng trước khi triển khai.",
      enabled: true,
      image: "khong-gian-hoc-tap.jpg",
      items: [
        { id: "gallery-1", title: "Không gian học tập chính", meta: "khong-gian-01.jpg" },
        { id: "gallery-2", title: "Khu vực hoạt động nhóm", meta: "khong-gian-02.jpg" },
        { id: "gallery-3", title: "Góc học cá nhân", meta: "khong-gian-03.jpg" },
      ],
    },
    {
      id: "resources",
      label: "Tài nguyên",
      title: "Tài nguyên cho phụ huynh",
      description:
        "Các tiêu đề dưới đây là nội dung mẫu. Bài viết chỉ xuất hiện sau khi được xác minh nguồn và duyệt nội dung.",
      enabled: true,
      items: [
        { id: "resource-1", title: "5 cách bố trí góc học tập cho trẻ", description: "Gợi ý đơn giản để tạo một góc học tập yên tĩnh, thân thiện và dễ duy trì tại nhà.", meta: "Không gian" },
        { id: "resource-2", title: "Kỹ năng chuyển giao về nhà", description: "Cùng trẻ tiếp tục kỹ năng đã học qua những hoạt động gần gũi hằng ngày.", meta: "Đồng hành" },
        { id: "resource-3", title: "Những điều nên trao đổi khi đón trẻ", description: "Một vài câu hỏi mở giúp cha mẹ hiểu ngày của con mà không tạo áp lực.", meta: "Cảm xúc" },
      ],
    },
    {
      id: "faq",
      label: "Câu hỏi thường gặp",
      title: "Câu hỏi thường gặp",
      description:
        "Một vài thông tin cơ bản trước khi gia đình bắt đầu. Nếu chưa tìm thấy câu trả lời phù hợp, hãy gửi câu hỏi cho chúng tôi.",
      enabled: true,
      items: [
        { id: "faq-1", title: "Tôi có thể trao đổi với chuyên viên như thế nào?", description: "Trung tâm cần xác minh phương thức trao đổi, tần suất cập nhật và cách thức phối hợp với gia đình." },
        { id: "faq-2", title: "Phụ huynh có thể tham gia trong quá trình hỗ trợ không?", description: "Phụ huynh được khuyến khích tham gia theo kế hoạch phối hợp của từng trẻ." },
        { id: "faq-3", title: "Thời lượng và lịch hỗ trợ được sắp xếp như thế nào?", description: "Lịch hỗ trợ được thống nhất sau buổi trao đổi nhu cầu ban đầu." },
        { id: "faq-4", title: "Thông tin gia đình được sử dụng ra sao?", description: "Thông tin chỉ được sử dụng cho mục đích tư vấn và hỗ trợ đã thống nhất." },
      ],
    },
    {
      id: "contact",
      label: "Biểu mẫu tư vấn",
      eyebrow: "BẮT ĐẦU BẰNG MỘT CUỘC TRÒ CHUYỆN",
      title: "Trao đổi cùng trung tâm",
      description:
        "Đây là biểu mẫu giao diện tham khảo. Thông tin chỉ nên được gửi khi trung tâm xác nhận kênh tiếp nhận và chính sách quyền riêng tư.",
      enabled: true,
      primaryAction: "Gửi yêu cầu tư vấn",
      items: [
        { id: "field-name", title: "Họ tên phụ huynh", meta: "text" },
        { id: "field-phone", title: "Số điện thoại", meta: "tel" },
        { id: "field-need", title: "Nhu cầu gia đình quan tâm", meta: "select" },
        { id: "field-note", title: "Điều bạn muốn chia sẻ thêm", meta: "textarea" },
      ],
    },
    {
      id: "footer",
      label: "Chân trang",
      title: "Lớp Can Thiệp Chuyên Biệt Cô Hương",
      description:
        "Trang này chỉ là bản thiết kế tham khảo. Nội dung, hình ảnh, đội ngũ, bài viết và thông tin liên hệ cần được trung tâm xác minh trước khi triển khai.",
      enabled: true,
      items: [
        { id: "footer-1", title: "Khám phá", description: "Giới thiệu · Lĩnh vực hỗ trợ · Đội ngũ · Tài nguyên" },
        { id: "footer-2", title: "Hỗ trợ", description: "Góc phụ huynh · Câu hỏi thường gặp · Liên hệ · Quyền riêng tư" },
      ],
    },
  ],
};

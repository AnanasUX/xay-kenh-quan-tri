import { logAuditAction } from "./auditService";

export interface ArticleData {
  id: string;
  category: string;
  title: string;
  summary: string;
  image: string;
  readTime: string;
  author: string;
  publishedDate: string;
  htmlContent: string;
  tags?: string[];
  status?: "published" | "draft";
}

export const STORAGE_KEY_ARTICLES = "aurora-cms:articles";
export const CLOUD_ARTICLES_API_URL = "https://kvdb.io/RtALwN4JAnjEQUjqKLgAuk/articles_data";

export const DEFAULT_ARTICLES: ArticleData[] = [
  {
    id: "speech-vs-autism",
    category: "Âm ngữ trị liệu",
    title: "Phân biệt trẻ chậm nói đơn thuần và trẻ có dấu hiệu tự kỷ",
    summary: "Rất nhiều phụ huynh nhầm lẫn giữa việc trẻ chậm nói đơn thuần và trẻ có nguy cơ tự kỷ. Dưới đây là những dấu hiệu then chốt được các chuyên gia âm ngữ đúc kết.",
    image: "./images/family-1.jpg",
    readTime: "4 phút",
    author: "ThS. Hoàng Thị Hương",
    publishedDate: "20/10/2026",
    status: "published",
    htmlContent: `
      <h2>1. Sự khác biệt về giao tiếp phi ngôn ngữ</h2>
      <p>Trẻ chậm nói đơn thuần dù chưa thể phát âm thành câu hoàn chỉnh nhưng <strong>khao khát kết nối và biểu đạt cảm xúc</strong> của trẻ vô cùng mãnh liệt. Trẻ sẽ chủ động kéo tay ba mẹ, dùng ngón trỏ chỉ thẳng vào món đồ chơi trên cao, gật đầu đồng ý hoặc lắc đầu từ chối dứt khoát.</p>
      <p>Ngược lại, ở trẻ có nguy cơ tự kỷ (ASD), sự thiếu hụt rõ nét nhất nằm ở <em>sự chú ý chung (Joint Attention)</em>. Trẻ hiếm khi nhìn vào mắt người đối diện, không dùng ngón tay chỉ chia sẻ sự thích thú, và thường có thói quen dắt tay người lớn như một "công cụ vật lý" để lấy đồ mà không hề nhìn lên mặt người lớn.</p>
      
      <div class="article-callout-box">
        <strong>💡 Lời khuyên thực hành từ ThS. Hoàng Thị Hương:</strong>
        <ul>
          <li><strong>Trắc nghiệm ngón tay:</strong> Chỉ vào một con thú bông ở góc phòng và nói: <em>"Ôi nhìn kìa con!"</em>. Trẻ phát triển thông thường sẽ nhìn theo hướng tay ba mẹ; trẻ tự kỷ thường chỉ nhìn vào đầu ngón tay của ba mẹ hoặc không phản ứng.</li>
          <li><strong>Trắc nghiệm gọi tên:</strong> Khi con đang chăm chú xếp hình, gọi tên con rõ ràng 3 lần. Nếu con hoàn toàn không quay đầu phản hồi dù thính lực bình thường, đó là dấu hiệu ba mẹ cần can thiệp sớm.</li>
        </ul>
      </div>

      <h2>2. Khả năng tương tác xã hội và bắt chước hành vi</h2>
      <p>Trẻ chậm nói đơn thuần vẫn bắt chước các cử chỉ hàng ngày rất nhanh: bắt chước mẹ nghe điện thoại, bắt chước bố lái xe, cười nắc nẻ khi chơi trò ú òa. Trẻ hiểu và phản ứng với các cung bậc vui, buồn, ngạc nhiên của người thân.</p>
      <p>Trong khi đó, trẻ tự kỷ thường chìm đắm trong thế giới riêng biệt. Trẻ bị thu hút bởi các chuyển động cơ học lặp đi lặp lại như: quay bánh xe đồ chơi hàng giờ, xếp đồ chơi thành hàng dài vô tận, bật tắt công tắc đèn liên tục hoặc vẫy vẫy bàn tay trước mắt (Flapping hands).</p>

      <h2>3. Thời điểm vàng can thiệp: Đừng chờ đợi con "tự lớn sẽ biết nói"</h2>
      <p>Một sai lầm rất phổ biến là nhiều gia đình nghĩ rằng "con trai thường chậm nói, cứ đợi 3 tuổi rồi tính". Trên thực tế, <strong>từ 18 đến 36 tháng là giai đoạn vàng duy nhất</strong> của tính dẻo não bộ (Neuroplasticity). Mỗi tháng trôi qua không được kích hoạt ngôn ngữ và điều hòa hành vi là một cơ hội vàng bị bỏ lỡ.</p>
      <p>Tại Trung tâm Cô Hương (TDP Duyên Phúc, xã Hưng Hà, Tỉnh Hưng Yên), chúng tôi áp dụng bài test chuẩn hóa VB-MAPP và PEP-3 để xác định chính xác con đang chậm nói cơ học hay có khó khăn về tương tác giao tiếp, từ đó lên giáo án IEP 1:1 chuẩn xác nhất.</p>
    `,
  },
  {
    id: "aba-principles",
    category: "Hành vi ABA",
    title: "Phương pháp ABA trong can thiệp sớm: Nguyên tắc vàng cho ba mẹ",
    summary: "Phân tích hành vi ứng dụng (ABA) là phương pháp được khoa học quốc tế chứng minh mang lại hiệu quả cao nhất trong việc hình thành hành vi tích cực và giảm thiểu hành vi quấy khóc, bùng nổ.",
    image: "./images/classroom-detail.jpg",
    readTime: "5 phút",
    author: "Ban Chuyên môn HPKid",
    publishedDate: "18/10/2026",
    status: "published",
    htmlContent: `
      <h2>1. Hiểu đúng về nguyên lý ABC trong ABA</h2>
      <p>Phân tích hành vi ứng dụng (Applied Behavior Analysis - ABA) không phải là sự ép buộc kỷ luật, mà là khoa học thấu hiểu động cơ phía sau hành động của trẻ. Mọi hành vi đều vận hành theo mô hình chuỗi 3 mắt xích:</p>
      <ul>
        <li><strong>A (Antecedent - Tiền đề):</strong> Tình huống hoặc kích thích xảy ra ngay trước khi hành vi xuất hiện.</li>
        <li><strong>B (Behavior - Hành vi):</strong> Hành động cụ thể có thể quan sát và đo lường được của trẻ.</li>
        <li><strong>C (Consequence - Hệ quả):</strong> Phản ứng của môi trường và người chăm sóc ngay sau hành vi.</li>
      </ul>

      <div class="article-callout-box">
        <strong>⚠️ Ví dụ điển hình trong cuộc sống hàng ngày:</strong>
        <p>Mẹ dẫn bé vào siêu thị (A) -> Bé đòi mua kẹo và nằm lăn ra sàn gào khóc (B) -> Vì ngại mọi người nhìn, mẹ liền mở gói kẹo cho bé ăn (C).</p>
        <p><em>Hệ quả:</em> Bộ não của trẻ lập tức ghi nhận công thức: <strong>"Khóc to + ăn vạ = Được kẹo"</strong>. Lần sau vào siêu thị, hành vi này chắc chắn sẽ lặp lại với cường độ dữ dội hơn.</p>
      </div>

      <h2>2. Kỹ thuật củng cố tích cực (Positive Reinforcement)</h2>
      <p>Nguyên tắc vàng của ABA là: <em>"Hành vi nào được củng cố thì hành vi đó sẽ tăng lên; hành vi nào bị phớt lờ thì hành vi đó sẽ dần tiêu biến."</em></p>
      <p>Thay vì chỉ chú ý và quát mắng khi con làm sai, ba mẹ hãy "bắt quả tang" những khoảnh khắc con làm đúng: Con biết cất dép lên giá, con kiên nhẫn ngồi vào bàn ăn, con tự giác nhặt đồ chơi. Hãy khen ngợi bằng lời nói cụ thể kèm cử chỉ yêu thương (ôm, đập tay high-five) hoặc một phần thưởng nhỏ bé yêu thích.</p>
    `,
  },
  {
    id: "sensory-integration",
    category: "Điều hòa giác quan",
    title: "Trò chơi điều hòa cảm giác tại nhà cho trẻ sợ tiếng ồn hoặc thích xoay tròn",
    summary: "Rối loạn xử lý cảm giác (Sensory Processing Disorder) khiến trẻ có những phản ứng quá mức hoặc kém nhạy cảm với âm thanh, ánh sáng, xúc giác và tiền đình thăng bằng.",
    image: "./images/classroom-main.jpg",
    readTime: "4 phút",
    author: "ThS. Hoàng Thị Hương",
    publishedDate: "15/10/2026",
    status: "published",
    htmlContent: `
      <h2>1. Vì sao trẻ tự kỷ lại có hành vi xoay tròn hoặc bịt tai sợ tiếng ồn?</h2>
      <p>Bộ não con người nhận tín hiệu từ 7 hệ thống giác quan (thị giác, thính giác, khứu giác, vị giác, xúc giác, tiền đình và bản thể). Ở trẻ rối loạn phổ tự kỷ, bộ lọc cảm giác này thường bị mất cân bằng, chia thành hai nhóm chính:</p>
      <ul>
        <li><strong>Nhóm tìm kiếm cảm giác (Sensory Seeking):</strong> Hệ thần kinh "kém nhạy cảm", trẻ đói kích thích nên liên tục chạy nhảy, xoay tròn, đập đầu, gõ đồ vật vào tai để tìm cảm giác thỏa mãn.</li>
        <li><strong>Nhóm phòng vệ / quá nhạy cảm (Sensory Avoiding):</strong> Hệ thần kinh "quá nhạy cảm", một tiếng máy xay sinh tố, tiếng máy sấy tóc hoặc tiếng sấm cũng khiến trẻ đau đớn như tra tấn, dẫn đến phản ứng bịt tai, hoảng loạn, la hét.</li>
      </ul>

      <h2>2. Các trò chơi điều hòa cảm giác ba mẹ có thể làm ngay tại nhà</h2>
      <div class="article-callout-box">
        <strong>🌀 Trò chơi 1: Cuộn xúc xích trong chăn (Hot Dog Roll)</strong>
        <p>Đặt trẻ nằm trên tấm chăn mỏng, lăn tròn chăn quấn quanh người con vừa đủ chặt để tạo áp lực sâu (Deep Pressure). Dùng hai bàn tay xoa bóp nhẹ nhàng từ vai xuống bắp chân. Áp lực sâu này kích thích hệ thần kinh phó giao cảm, giúp con bình tĩnh và thư giãn tức thì.</p>
      </div>

      <div class="article-callout-box">
        <strong>🧘 Trò chơi 2: Nhún nhảy nhịp điệu trên bóng Gym</strong>
        <p>Cho con ngồi trên quả bóng tập thể dục cỡ lớn, ba mẹ giữ chắc hai bên hông của con và nhún nhịp nhàng theo một bài hát thiếu nhi vui nhộn. Trò chơi này kích hoạt hệ thống tiền đình thăng bằng và tăng cường trương lực cơ thân mình rất tốt.</p>
      </div>
    `,
  },
  {
    id: "iep-roadmap",
    category: "Can thiệp 1:1",
    title: "Giáo án cá nhân hóa IEP là gì? Vì sao mỗi trẻ cần một lộ trình riêng?",
    summary: "Không có hai đứa trẻ tự kỷ nào giống nhau hoàn toàn. IEP (Individualized Education Program) là bản đồ định hướng chính xác từng bước tiến cho con.",
    image: "./images/family-2.jpg",
    readTime: "3 phút",
    author: "Cô Hương HPKid",
    publishedDate: "12/10/2026",
    status: "published",
    htmlContent: `
      <h2>1. Vì sao giáo án đại trà không thể áp dụng cho trẻ tự kỷ?</h2>
      <p>Trong y văn và thực tế lâm sàng có một câu châm ngôn nổi tiếng: <em>"Nếu bạn gặp một đứa trẻ tự kỷ, bạn mới chỉ gặp duy nhất một đứa trẻ tự kỷ đó."</em> Phổ tự kỷ rộng vô cùng: có trẻ hoàn toàn không nói nhưng trí nhớ hình ảnh siêu phàm; có trẻ nói huyên thuyên nhưng không hiểu ngữ nghĩa tương tác xã hội; có trẻ tăng động giảm chú ý nhưng có trẻ lại thu mình thụ động.</p>
      <p>Chính vì vậy, phương pháp can thiệp rập khuôn theo nhóm lớn chắc chắn sẽ thất bại. Mỗi đứa trẻ bắt buộc phải có một <strong>Bản Kế hoạch Giáo dục Cá nhân (IEP - Individualized Education Program)</strong> được đo ni đóng giày riêng biệt.</p>

      <h2>2. Quy trình 4 bước thiết lập IEP tại Trung tâm Cô Hương</h2>
      <ol>
        <li><strong>Lượng giá khởi điểm (Baseline Assessment):</strong> Sử dụng bộ công cụ quốc tế đánh giá 16 lĩnh vực phát triển: ngôn ngữ tiếp nhận, ngôn ngữ diễn đạt, bắt chước âm thanh, vận động tinh, tự phục vụ...</li>
        <li><strong>Thiết lập mục tiêu SMART:</strong> Mục tiêu cụ thể, đo lường được, khả thi theo từng chu kỳ 4 tuần và 12 tuần.</li>
        <li><strong>Can thiệp cá nhân 1 cô - 1 trò:</strong> Giáo viên chuyên biệt kèm cặp trực tiếp, ghi chép nhật ký hành vi sau mỗi buổi học 60 phút.</li>
        <li><strong>Họp tổng kết và lượng giá lại cùng gia đình:</strong> Sau mỗi tháng, trung tâm gửi báo cáo video minh chứng tiến bộ và bàn giao giáo án hoạt động tại nhà cho ba mẹ.</li>
      </ol>
    `,
  },
  {
    id: "school-readiness",
    category: "Tiền tiểu học",
    title: "Chuẩn bị tâm lý và kỹ năng tiền học đường cho trẻ trước khi vào lớp 1",
    summary: "Chuyển tiếp từ mầm non lên lớp 1 là một bước ngoặt lớn, đặc biệt đối với trẻ có nhu cầu đặc biệt. Chuẩn bị từ sớm là chìa khóa để con hòa nhập thành công.",
    image: "./images/family-3.jpg",
    readTime: "4 phút",
    author: "Ban Chuyên môn HPKid",
    publishedDate: "10/10/2026",
    status: "published",
    htmlContent: `
      <h2>1. Thách thức lớn khi trẻ bước vào môi trường Tiểu học</h2>
      <p>Ở mầm non, trẻ được tự do vận động, được cô giáo chăm bẵm từng thìa cơm, giấc ngủ. Nhưng khi bước sang lớp 1, trẻ phải đối mặt với cấu trúc kỷ luật nghiêm ngặt: ngồi yên tại chỗ 35-40 phút mỗi tiết, xếp hàng ra vào lớp, lắng nghe hiệu lệnh của giáo viên chủ nhiệm và tự quản lý sách vở, hộp bút.</p>
      <p>Đối với trẻ có nét tự kỷ, chậm chú ý hoặc khó khăn điều hòa vận động, cú sốc môi trường này có thể dẫn đến tình trạng từ chối đến trường, khóc thét hoặc bộc phát hành vi tiêu cực.</p>

      <h2>2. Lớp bán trú Tiền tiểu học - Bước đệm vững chắc cho con</h2>
      <p>Tại lớp Tiền tiểu học của Cô Hương, các con được làm quen với mô hình giả lập lớp 1 thực tế:</p>
      <ul>
        <li>Tập ngồi bàn học đúng tư thế, rèn luyện sự tập trung chú ý từ 15 phút tăng dần lên 35 phút.</li>
        <li>Rèn luyện kỹ năng xã hội thiết yếu: Giơ tay phát biểu, xếp hàng chờ đến lượt, xin phép cô giáo khi cần đi vệ sinh hoặc uống nước.</li>
        <li>Phát triển vận động tinh: Cầm bút đúng cách, phối hợp tay - mắt, cắt dán thủ công, làm quen với chữ cái và con số qua trò chơi trực quan sinh động.</li>
      </ul>
    `,
  },
  {
    id: "meltdown-management",
    category: "Kỹ năng gia đình",
    title: "Cách xử lý cơn bùng nổ cảm xúc (Meltdown) của trẻ tại nơi công cộng",
    summary: "Meltdown không phải là ăn vạ hư hỏng mà là trạng thái hệ thần kinh của trẻ bị quá tải cảm giác hoặc cảm xúc. Ba mẹ cần những bước xử lý khoa học và nhân văn.",
    image: "./images/classroom-detail.jpg",
    readTime: "5 phút",
    author: "ThS. Hoàng Thị Hương",
    publishedDate: "05/10/2026",
    status: "published",
    htmlContent: `
      <h2>1. Phân biệt Ăn vạ (Tantrum) và Bùng nổ quá tải (Meltdown)</h2>
      <p>Hiểu lầm tai hại nhất của nhiều người lớn là coi cơn bùng nổ của trẻ tự kỷ là sự "hư đốn, không biết nghe lời". Sự khác biệt căn bản giữa hai trạng thái này là:</p>
      <ul>
        <li><strong>Ăn vạ (Tantrum):</strong> Có chủ đích và có mục tiêu (ví dụ đòi mua đồ chơi). Trẻ vẫn kiểm soát được hành vi, liên tục liếc nhìn phản ứng của người lớn để xem chiêu trò có hiệu quả không. Khi người lớn đồng ý, trẻ sẽ ngừng khóc ngay lập tức.</li>
        <li><strong>Bùng nổ (Meltdown):</strong> Hệ thần kinh hoàn toàn mất kiểm soát do quá tải cảm giác (âm thanh quá chát chúa, đèn quá chói, đám đông ngột ngạt) hoặc cảm xúc dồn nén. Trẻ gào thét, cắn tay, lăn lộn trong vô thức, không quan tâm xung quanh có ai nhìn hay không và không thể tự dừng lại dù được đáp ứng yêu cầu.</li>
      </ul>

      <h2>2. Chiến lược 3 bước xử lý êm dịu cơn Meltdown</h2>
      <div class="article-callout-box">
        <strong>Bước 1: Đảm bảo an toàn thể chất tuyệt đối</strong>
        <p>Bảo vệ con khỏi va đập vào các góc bàn sắc nhọn, mặt đường cứng hoặc dòng xe cộ. Nhẹ nhàng đưa con vào một góc yên tĩnh, có bóng râm hoặc trong xe ô tô.</p>
      </div>

      <div class="article-callout-box">
        <strong>Bước 2: Giảm tải ngôn ngữ và kích thích</strong>
        <p>Không quát tháo, không đặt câu hỏi dồn dập <em>"Tại sao con lại như vậy?"</em>. Khi não bộ đang bốc hỏa, mọi lời nói đều là chất xúc tác khiến cơn bão dữ dội hơn. Hãy hạ thấp giọng, dùng câu ngắn vỗ về: <em>"Mẹ ở đây rồi, mẹ đợi con."</em></p>
      </div>

      <div class="article-callout-box">
        <strong>Bước 3: Lắng nghe và phục hồi năng lượng</strong>
        <p>Sau khi cơn bão lắng xuống, trẻ thường kiệt sức và cảm thấy xấu hổ hoặc bất an. Hãy cho con uống một ngụm nước ấm, lau mồ hôi và dành cho con một cái ôm ấm áp không phán xét.</p>
      </div>
    `,
  },
];

export function getArticles(): ArticleData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ARTICLES) || localStorage.getItem("antigravity_articles_data");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not load articles from storage:", e);
  }
  return DEFAULT_ARTICLES;
}

export function saveArticles(articles: ArticleData[]): void {
  try {
    const serialized = JSON.stringify(articles);
    localStorage.setItem(STORAGE_KEY_ARTICLES, serialized);
    localStorage.setItem("antigravity_articles_data", serialized);

    // Bắn tín hiệu sang tab khác và sang Landing page
    try {
      const channel = new BroadcastChannel("aurora-cms-sync");
      channel.postMessage({ type: "articles_updated", articles });
      channel.close();
    } catch {}

    // Gửi lên cloud API nếu có
    fetch(CLOUD_ARTICLES_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: serialized,
    }).catch(() => {});
  } catch (e) {
    console.error("Failed to save articles:", e);
  }
}

export function saveSingleArticle(article: ArticleData): ArticleData[] {
  const current = getArticles();
  const index = current.findIndex((a) => a.id === article.id);
  let updated: ArticleData[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = article;
    logAuditAction({
      action: "Cập nhật bài viết",
      category: "config",
      detail: `Đã chỉnh sửa bài viết: "${article.title}" (ID: ${article.id})`,
      target: article.title,
      status: "success",
    });
  } else {
    updated = [article, ...current];
    logAuditAction({
      action: "Thêm bài viết mới",
      category: "config",
      detail: `Đã xuất bản bài viết mới: "${article.title}" thuộc chuyên mục "${article.category}"`,
      target: article.title,
      status: "success",
    });
  }
  saveArticles(updated);
  return updated;
}

export function deleteArticle(id: string): ArticleData[] {
  const current = getArticles();
  const target = current.find((a) => a.id === id);
  const updated = current.filter((a) => a.id !== id);
  saveArticles(updated);
  if (target) {
    logAuditAction({
      action: "Xóa bài viết",
      category: "config",
      detail: `Đã xóa bài viết: "${target.title}" (ID: ${id})`,
      target: target.title,
      status: "warning",
    });
  }
  return updated;
}

export function duplicateArticle(id: string): ArticleData[] {
  const current = getArticles();
  const target = current.find((a) => a.id === id);
  if (!target) return current;

  const duplicated: ArticleData = {
    ...target,
    id: `${target.id}-copy-${Date.now().toString(36)}`,
    title: `${target.title} (Bản sao)`,
    publishedDate: new Date().toLocaleDateString("vi-VN"),
    status: "draft",
  };
  const updated = [duplicated, ...current];
  saveArticles(updated);
  logAuditAction({
    action: "Nhân bản bài viết",
    category: "config",
    detail: `Nhân bản từ bài viết: "${target.title}" thành "${duplicated.title}"`,
    target: duplicated.title,
    status: "success",
  });
  return updated;
}

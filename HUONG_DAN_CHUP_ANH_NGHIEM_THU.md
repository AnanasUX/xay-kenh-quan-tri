# TÀI LIỆU TOÀN DIỆN QUẢN TRỊ NỘI DUNG VÀ BÁO CÁO NGHIỆM THU NÂNG CẤP GIAO DIỆN
**HỆ THỐNG LANDING PAGE & KÊNH QUẢN TRỊ NỘI DUNG CMS (REACT + TAILWIND + AI ENGINE)**

* **Đơn vị thụ hưởng:** Trung tâm Can thiệp Sớm & Hỗ trợ Trẻ Tự kỷ Cô Hương
* **Địa chỉ:** TDP Duyên Phúc, xã Hưng Hà, Tỉnh Hưng Yên
* **Hotline:** 096 290 3942
* **Trang Landing Page:** https://ananasux.github.io/tre-tu-ky-responsive/
* **Kênh Quản trị CMS:** https://ananasux.github.io/xay-kenh-quan-tri/#/cau-hinh-trang
* **Tài liệu Google Docs:** https://docs.google.com/document/d/1tu09JeyYkeGXWH61u-TH_75bfpjY584JTQsXyuaECNc/edit?tab=t.0

---

## PHẦN I: NGUYÊN TẮC BẢO VỆ DỮ LIỆU BẤT BIẾN (IMMUTABLE CONSTANTS GUARD)
Nhằm đảm bảo tính chính xác và toàn vẹn pháp lý, hệ thống thiết lập bộ lọc logic nghiêm ngặt ngăn chặn AI hoặc biên tập viên vô tình làm sai lệch vị trí và định danh của cơ sở:
1. `"email": "mamnonhpkid@gmail.com"`
2. `"address": "TDP Duyên Phúc, xã Hưng Hà, Tỉnh Hưng Yên"` (Đã thay thế triệt để địa chỉ Thái Bình cũ trên toàn bộ hệ sinh thái)
3. `"phone": "096 290 3942"`
4. `"facebook": "https://www.facebook.com/chanh.chua.330"`
5. `"title": "Trung tâm Hỗ trợ Trẻ tự kỷ Cô Hương"`

---

## PHẦN II: TÀI LIỆU TOÀN DIỆN CHỨC NĂNG TRANG CẤU HÌNH TRANG (`#/cau-hinh-trang`)

### 1. Phân quyền người dùng theo vai trò (Role-Based Access Control - RBAC)
* **Quản trị viên (`admin`):** Toàn quyền biên tập 11 khối nội dung, xuất bản trực tiếp lên đám mây, xuất/nhập file JSON, quản trị tài khoản và truy cập đầy đủ nhật ký hệ thống.
* **Nhân viên nội dung (`staff`):**
  * Chỉ được phép chỉnh sửa các khối được cấp quyền (*Sứ mệnh, Can thiệp, Quy trình, Đội ngũ, Cơ sở vật chất, Tài nguyên, FAQ*).
  * Các khối ngoài phạm vi cấp quyền (*Thông tin chung, Mở đầu, Đăng ký tư vấn*) được **ẩn hoàn toàn khỏi danh sách** (không hiển thị biểu tượng ổ khóa gây phân tâm).
  * Chỉ có quyền **Lưu bản nháp** (bị vô hiệu hóa và chặn nút *Xuất bản thay đổi* kèm ghi nhận Audit log cảnh báo nếu cố tình thao tác).

### 2. Bộ công cụ đầu trang (Header Actions)
* **Nút "Trợ lý AI" (AI Assistant Modal):**
  * **Tab Trợ lý AI & Đề xuất:** Nhập câu lệnh tùy chỉnh (Custom prompt) hoặc chọn gợi ý thông minh (*Viết lại theo chuẩn SEO, Ngắn gọn chuyên nghiệp, Tăng niềm tin phụ huynh*).
  * **Lớp bảo vệ dữ liệu:** Tự động khôi phục 5 hằng số bất biến của Trung tâm Cô Hương.
  * **Tab Đính kèm & Tải file JSON:**
    * Nút *Tải file JSON hiện tại về máy* để sao lưu cấu hình toàn bộ 11 khối.
    * Nút *Đính kèm / Tải lên file JSON* từ máy tính để AI đọc và đưa ra đề xuất tối ưu.
    * Trình biên tập JSON trực quan kèm nút xuất bản file JSON mới đã chỉnh sửa.
  * **Tab Lịch sử phiên bản:** Tự động lưu trữ lịch sử các lần tinh chỉnh của AI; hỗ trợ nút *Phục hồi phiên bản này* cho phép rollback 1-click an toàn tuyệt đối.
* **Nút "Nhập JSON" (Chỉ dành cho Admin):** Nạp lại bản cấu hình `.json` đã lưu từ máy tính.
* **Nút "Xuất JSON":** Tải bản sao lưu cấu hình toàn bộ trang dạng `landing-page-config-YYYY-MM-DD.json`.
* **Nút "Lưu bản nháp":** Lưu dữ liệu tạm thời vào bộ nhớ trình duyệt và đám mây KVDB mà không ghi đè lên giao diện người dùng bên ngoài.
* **Nút "Xuất bản thay đổi" (Chỉ dành cho Admin):** Đồng bộ trực tiếp lên máy chủ đám mây toàn cầu (`https://kvdb.io/...`) và kích hoạt `BroadcastChannel` đồng bộ thời gian thực cho mọi tab đang mở của khách hàng.

### 3. Cấu hình Bộ nút liên hệ nổi & Tiện ích (Floating Contact Dock)
* **Vị trí hiển thị:** Góc Trái (`left`) hoặc Góc Phải (`right`) màn hình.
* **Kích thước nút bấm công thái học (Thumb Zone):**
  * `48px`: Tiêu chuẩn tối thiểu cho thiết bị di động (Google Material & Apple HIG).
  * `52px`: Kích thước cân bằng khuyến nghị.
  * `56px`: Kích thước lớn, dễ chạm tối đa cho người lớn tuổi.
* **Thẻ nút Facebook Messenger:** Bật/tắt, URL Fanpage, Tùy chỉnh ảnh Icon (24×24px PNG/SVG) kèm nút tải file từ máy tính.
* **Thẻ nút Zalo Chat tư vấn:** Bật/tắt, Số Zalo/Link Zalo OA, Tùy chỉnh ảnh Icon (24×24px PNG/SVG) kèm nút tải file từ máy tính.
* **Thẻ nút Hotline gọi ngay:** Bật/tắt, Số Hotline gọi nhanh, Tùy chỉnh ảnh Icon (24×24px PNG/SVG) kèm nút tải file từ máy tính.
* **Thẻ nút Cuộn lên đầu trang (Back to top):** Bật/tắt, tự động kích hoạt khi cuộn trang >400px.

---

## PHẦN III: PHÂN HỆ MỞ RỘNG (LIVE CHAT CRM & AUDIT LOGS)

### 1. Phân hệ Chat trực tiếp khách hàng (Live Chat CRM)
* Thanh công cụ chuẩn 4 nút: `Làm mới`, `📚 Bộ kịch bản & Tình huống AI`, `Xem Đăng ký tư vấn`, `🧠 Phân tích trò chuyện`.
* **Quy tắc trạng thái:** Khách gửi tin -> "Chờ trả lời" (`waiting`). Nhân viên gửi tin phản hồi -> "Đã trả lời" (`replied`). Mở xem nhưng chưa gửi -> Giữ nguyên "Chờ trả lời".
* **Tự động hóa CRM Lead:** Nhận diện từ khóa vị trí/địa chỉ ("chị có thể qua", "địa chỉ nhà em") -> Tự động chuyển Lead sang "Đã hẹn lịch". Nhận diện câu kết thúc -> "Hoàn thành".

### 2. Modal Phân tích trò chuyện AI & Nạp vào Q&A Matrix
* Phân tích Topic Distribution từ hội thoại thực tế (Chi phí 38%, Độ tuổi vàng 29%, Bằng cấp 18%, Cơ sở vật chất 15%).
* Nút `⚡ Nạp vào Q&A Matrix`: 1-click tự động chuyển hóa các chủ đề quan tâm thành bộ câu hỏi - câu trả lời mới trong ma trận phản hồi AI.

---

## PHẦN IV: BÁO CÁO NGHIỆM THU CÁC LỖI UX LANDING PAGE ĐÃ XỬ LÝ
1. **Khắc phục Dead Clicks:** Bổ sung Lightbox Modal cơ sở vật chất và Teacher Detail Modal 1:1.
2. **Triệt tiêu Rage Clicks:** Hiệu ứng Ripple, Spinner xoay tải, vô hiệu hóa nút 1.5s, accordion 0.18s.
3. **Khóa Zoom không chủ ý:** Thiết lập `font-size: 16px` cho input và `type='tel'`.
4. **Ẩn khối Đội ngũ theo tham số Zalo Campaign:** Nhận diện `?zarsrc=30&utm_source=zalo...#resources` để ẩn Đội ngũ và cuộn thẳng xuống `#resources`.
5. **Cố định thanh Header trên màn hình PC và Chuyển hướng mượt mà:**
   * Thiết lập `.header` cố định hoàn toàn trên PC (`position: fixed !important; top: 0; left: 0; right: 0; z-index: 1000; width: 100%`).
   * Gán khoảng đệm bù trừ `body { padding-top: 72px; }` trên desktop và `64px` trên mobile.
   * Khi click bất kỳ mục menu nào (`#about`, `#areas`, `#process`, `#team`, `#gallery`, `#resources`, `#faq`, `#contact`):
     * Class `nav__active` được kích hoạt tức thì.
     * Cuộn mượt mà có trừ hao chiều cao header (offset -74px).
     * Bổ sung `scroll-margin-top: 80px !important` cho toàn bộ các section đích.
6. **Khắc phục triệt để lỗi điều hướng và Scrollspy khi truy cập URL với `#about` hoặc tải lại trang (Reload):**
   * **Vấn đề đã xử lý:** Khi người dùng truy cập link `https://ananasux.github.io/tre-tu-ky-responsive/?zarsrc=30&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo#about`, trang web bị cuộn lỡ dở và khi F5 tải lại trang thì menu điều hướng bị mặc định chọn sai mục "Không gian" (`#gallery`).
   * **Giải pháp kỹ thuật đã áp dụng:**
     * **Ưu tiên đầu trang tuyệt đối khi vào với `#about` / `#top`:** Hệ thống cưỡng bức đưa vị trí cuộn về `0` (`window.scrollTo(0, 0)` và `lenis.scrollTo(0, { immediate: true })`), kích hoạt `activeSection = "about"` để người dùng luôn nhìn thấy toàn cảnh Hero Banner & Tiêu đề trung tâm trước tiên.
     * **Khóa Scroll Restoration:** Thiết lập `window.history.scrollRestoration = 'manual'` tại `main.tsx` chặn trình duyệt tự động ghi nhớ và phục hồi cuộn lưng chừng trang khi F5.
     * **Tái thiết kế thuật toán Scrollspy (Active Section Engine):**
       * Sử dụng `getBoundingClientRect().top <= 140` đo đạc khoảng cách thực tế so với khung nhìn, không bị sai lệch bởi độ trễ tải ảnh của trình duyệt.
       * Thiết lập rào chắn an toàn: Khi section `#areas` chưa vượt qua ngưỡng đọc (`areasTop > 140`), menu luôn giữ trạng thái active là "Giới thiệu" (`about`), triệt tiêu 100% tình trạng nhảy nhầm sang "Không gian" (`gallery`).
     * **Sửa logic bộ lọc Zalo Campaign (`isZaloCampaignResourcesLanding`):** Chỉ ẩn khối Đội ngũ khi URL thực sự có mục tiêu `#resources`, giữ nguyên cấu trúc trang hoàn chỉnh cho các đường link `#about`.
     * **Đồng bộ nút "Giới thiệu" & Logo:** Khi click logo thương hiệu hoặc mục "Giới thiệu" trên menu, trang web cuộn mượt mà lên đầu trang `0` và kích hoạt ngay mục "Giới thiệu".

---

## PHẦN V: TÍNH NĂNG THÔNG MINH MỚI (NÂNG CẤP TOÀN DIỆN LOẠI BỎ ĐƠN ĐIỆU)

Để khắc phục triệt để tình trạng giao diện bị đơn điệu, thiếu chiều sâu tương tác và giúp nâng cao tối đa sự thông minh của hệ thống, chúng tôi đã triển khai đồng bộ 3 phân hệ đột phá trên cả Landing Page người dùng và Kênh Quản trị CMS:

### 1. Bộ công cụ Sàng lọc Phát triển & Nguy cơ Tự kỷ 60s (Developmental & Autism Screener)
* **Vị trí trên Landing Page:** Hiển thị nổi bật ngay sau khối *Lĩnh vực Can thiệp* (`#screener`), có thể truy cập nhanh qua nút `🧪 Làm trắc nghiệm sàng lọc 60s` tại khối Lĩnh vực hoặc thanh gợi ý nhanh trong Live Chat.
* **Cơ sở khoa học:** Xây dựng dựa trên thang đo quốc tế chuẩn lâm sàng **M-CHAT-R/F** và **Denver II Developmental Screening Test**.
* **4 Nhóm tuổi chuyên biệt:**
  * **12 - 18 tháng:** Giai đoạn nhận diện sớm (Giao tiếp mắt, phản ứng gọi tên, chỉ ngón tay chia sẻ chú ý).
  * **18 - 24 tháng:** GIAI ĐOẠN VÀNG CAN THIỆP (Vốn từ đơn, bắt chước hành động, hiểu mệnh lệnh đơn giản, chơi đóng vai).
  * **24 - 36 tháng:** Hoàn thiện ngôn ngữ & tương tác (Ghép cụm 2 từ, chỉ tranh theo tên, giao lưu bạn bè, điều hòa cảm xúc).
  * **Trên 36 tháng:** Hòa nhập mầm non (Kể chuyện ngắn, câu hỏi "Tại sao", tự phục vụ, tuân thủ nội quy trò chơi nhóm).
* **Trải nghiệm tương tác thông minh:**
  * Bộ 5 câu hỏi tình huống trực quan cho từng lứa tuổi (Lựa chọn: Thường xuyên / Thỉnh thoảng / Hiếm khi hoặc Chưa).
  * Thanh tiến trình (Progress bar) tự động tính toán % hoàn thành.
  * Đánh giá kết quả tức thì theo 3 mức độ cảnh báo:
    * 🟢 **Mức 1: Nguy cơ thấp / Phát triển theo độ tuổi:** Lời chúc mừng kèm phương pháp đồng hành cùng con.
    * 🟡 **Mức 2: Cần theo dõi & Kích hoạt giao tiếp tích cực:** Hướng dẫn tạo môi trường tương tác tại nhà.
    * 🔴 **Mức 3: Cần đánh giá chuyên sâu trong Giai đoạn vàng:** Khuyến nghị phụ huynh nên đưa con đến trung tâm để được chuyên gia thực hiện test Denver II chuẩn xác.
* **Gợi ý 3 Bài tập Can thiệp tại nhà được cá nhân hóa theo từng độ tuổi:**
  * Cung cấp giáo trình bài tập thực hành cụ thể (Trò chơi giấu đồ, Lần lượt luân phiên, Bài tập mở rộng vốn từ...).
* **Nút hành động chuyển đổi nhanh (Call-to-Action):**
  * `💬 Nhắn Zalo với Cô Hương ngay`: Mở Zalo kết nối trực tiếp chuyên môn.
  * `📞 Gọi tư vấn: 096 290 3942`: Gọi nhanh không cần sao chép số.
  * `💬 Chat trực tiếp với chuyên gia`: Tự động nạp kết quả trắc nghiệm vào khung Live Chat để tư vấn viên nắm bắt ngay.

### 2. Trợ lý ảo Live Chat với Smart Quick Suggestion Chips
* Bổ sung thanh nút gợi ý nhanh ngay trên thanh nhập tin nhắn chat:
  * `🧪 Làm trắc nghiệm sàng lọc 60s` -> Tự động cuộn đến bảng trắc nghiệm hoặc mở kịch bản tư vấn.
  * `🗣️ Trẻ 2 tuổi chậm nói` -> Trả lời ngay kiến thức chuẩn về mốc phát triển ngôn ngữ 24 tháng.
  * `📍 Địa chỉ & Lịch học` -> Cung cấp thông tin chuẩn: TDP Duyên Phúc, xã Hưng Hà, Tỉnh Hưng Yên; Lịch đánh giá linh hoạt từ Thứ 2 đến Thứ 7.
  * `📅 Đặt lịch đánh giá Denver II` -> Tự động hướng dẫn quy trình đặt lịch đánh giá chuyên sâu 1:1.

### 3. AI Tự động quét kiểm định chất lượng toàn trang (Automated Quality & Compliance Auditor)
* **Vị trí trên CMS:** Phân hệ *Quản lý AI hệ thống* (`#/ai-system-management`).
* **Cơ chế hoạt động:**
  * Quét tự động toàn bộ 11 khối cấu hình Landing Page đối chiếu với tiêu chuẩn chuyên gia.
  * **Bảo vệ 5 Hằng số Bất biến:** Tự động phát hiện nếu tiêu đề, email, số điện thoại, fanpage hoặc địa chỉ bị chỉnh sửa sai lệch hoặc còn sót địa chỉ "Thái Bình" cũ.
  * **Kiểm tra công thái học (Ergonomics):** Kiểm tra thanh nút nổi Floating Contact Dock (kích thước tối thiểu 48px).
  * **Chấm điểm sức khỏe trang web (Overall Health Score / 100):** Đánh giá trực quan theo biểu đồ thanh điểm.
  * **Tranh biện & Đánh giá đa tác tử (Multi-Agent Debate Log):** AI Nhân viên, AI Quản lý và AI Giám đốc tự động đối thoại, phản biện và thống nhất hướng khắc phục.
* **Tính năng "Sửa lỗi Tự động 1-Chạm" (1-Click Auto-Fix):**
  * Nút bấm màu xanh ngọc nổi bật: `✨ Tự động sửa lỗi 1-Chạm (Auto-Fix All)`.
  * Chỉ với 1 cú click:
    1. Tự động quy đổi và chuẩn hóa toàn bộ các điểm sai lệch về địa chỉ chính xác: `TDP Duyên Phúc, xã Hưng Hà, Tỉnh Hưng Yên`.
    2. Chuẩn hóa email `mamnonhpkid@gmail.com`, hotline `096 290 3942`, fanpage `https://www.facebook.com/chanh.chua.330`, tiêu đề `Trung tâm Hỗ trợ Trẻ tự kỷ Cô Hương`.
    3. Tự động kích hoạt lại các khối bị vô tình ẩn.
    4. Chuẩn hóa kích thước nút nổi về `52px` đạt chuẩn công thái học.
    5. Tự động xuất bản lên đám mây toàn cầu KVDB và phát tín hiệu `BroadcastChannel`.
    6. Tự động chạy lại kiểm định và nâng điểm số chất lượng lên **100/100**.

---

## PHẦN VI: HƯỚNG DẪN CHỤP ẢNH NGHIỆM THU CHI TIẾT (STEP-BY-STEP SCREENSHOT GUIDE)

| STT | Tên ảnh cần chụp | Trang & Đường dẫn | Vị trí / Thao tác trên màn hình | Điểm cần làm nổi bật trong ảnh |
|:---:|:---|:---|:---|:---|
| **1** | `01_screener_trac_nghiem_60s.png` | Landing Page: [tre-tu-ky-responsive](https://ananasux.github.io/tre-tu-ky-responsive/#screener) | Cuộn xuống ngay dưới mục *Lĩnh vực Can thiệp* | Hiển thị 4 tab độ tuổi (`12-18m`, `18-24m`, `24-36m`, `36m+`), thanh tiến trình, 5 câu hỏi lựa chọn sinh động. |
| **2** | `02_screener_ket_qua_bai_tap.png` | Landing Page: [tre-tu-ky-responsive](https://ananasux.github.io/tre-tu-ky-responsive/#screener) | Nhấp chọn các câu hỏi -> Hoàn tất trắc nghiệm | Khung kết quả đánh giá nguy cơ, lời khuyên của Cô Hương, 3 bài tập can thiệp tại nhà và bộ nút Zalo/Hotline/Chat. |
| **3** | `03_livechat_smart_chips.png` | Landing Page: [tre-tu-ky-responsive](https://ananasux.github.io/tre-tu-ky-responsive/) | Nhấp mở bong bóng chat ở góc dưới màn hình | Hiển thị các chip gợi ý thông minh (`🧪 Làm trắc nghiệm sàng lọc 60s`, `🗣️ Trẻ 2 tuổi chậm nói`...). |
| **4** | `04_ai_auditor_dashboard.png` | Kênh Quản trị: [#/ai-system-management](https://ananasux.github.io/xay-kenh-quan-tri/#/ai-system-management) | Chọn menu *Quản lý AI hệ thống* ở sidebar | Bảng điều khiển *AI Tự động quét kiểm định chất lượng toàn trang*, điểm số sức khỏe, danh sách vấn đề phân loại Critical/Warning/Info. |
| **5** | `05_ai_auditor_auto_fix.png` | Kênh Quản trị: [#/ai-system-management](https://ananasux.github.io/xay-kenh-quan-tri/#/ai-system-management) | Bấm nút `✨ Tự động sửa lỗi 1-Chạm (Auto-Fix All)` | Thông báo xanh thành công, điểm sức khỏe đạt 100/100, đồng bộ Live Cloud và nhật ký Audit Log ghi nhận thao tác. |
| **6** | `06_ai_multi_agent_debate.png` | Kênh Quản trị: [#/ai-system-management](https://ananasux.github.io/xay-kenh-quan-tri/#/ai-system-management) | Chuyển sang tab *Tranh biện & Đánh giá Đa Agent* | Nhật ký tranh biện chi tiết giữa 3 Agent: Nhân viên, Quản lý, Giám đốc đối chiếu 5 hằng số bất biến. |
| **7** | `07_floating_contact_dock_config.png` | Kênh Quản trị: [#/cau-hinh-trang](https://ananasux.github.io/xay-kenh-quan-tri/#/cau-hinh-trang) | Khối *Bộ nút liên hệ nổi & Tiện ích* | Cấu hình kích thước nút (48px/52px/56px), tùy chỉnh icon và URL Facebook, Zalo, Hotline. |
| **8** | `08_header_fixed_desktop.png` | Landing Page: [tre-tu-ky-responsive](https://ananasux.github.io/tre-tu-ky-responsive/) | Màn hình PC, cuộn xuống giữa trang và click menu | Thanh Header giữ cố định trên cùng (`fixed`), click menu cuộn mượt không bị che tiêu đề, mục chọn sáng rõ. |

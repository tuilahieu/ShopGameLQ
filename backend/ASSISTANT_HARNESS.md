# Chatbot hỗ trợ khách hàng

Chatbot hiện chạy được **không cần API key**. `POST /api/assistant/chat` nhận
`{ "message": "Tìm acc 200k" }` và trả văn bản cùng tối đa bốn thẻ acc đang bán.
Mỗi thẻ có `href` dạng `/account/:id`; frontend dựng thẻ và nút bằng React,
không render HTML do mô hình tạo. Giá dùng cùng hàm tính giá với trang sản phẩm,
bao gồm giá sale còn hiệu lực.

## Harness để nối LLM sau

- `src/assistant/instructions.js`: hướng dẫn vai trò, giới hạn đầu ra và ngữ cảnh.
- `src/assistant/skills.js`: các luồng hỗ trợ cố định như đơn hàng, bảo hành,
  nạp tiền và liên hệ.
- `src/assistant/tools.js`: công cụ `search_accounts` chỉ đọc tài khoản đang bán.
- `src/assistant/harness.js`: điều phối câu hỏi và hợp đồng provider.

Một adapter Gemini hoặc VILAO tương lai chỉ cần cung cấp
`generate({ instructions, messages, tools, maxOutputTokens })` và trả
`{ text, toolCalls }`. API key phải nằm ở backend hoặc kho secret, không gửi
cho trình duyệt. Các câu hỏi tìm acc đi thẳng tới công cụ và không tốn token LLM.
Các câu chào, cảm ơn và nhờ giúp ngắn cũng được trả lời tự nhiên bằng mẫu ngắn;
yêu cầu gặp admin hoặc hỗ trợ trực tiếp dẫn tới trang liên hệ có Zalo của shop.
Giao diện hiển thị chữ dần cho câu trả lời của chatbot; đây là hiệu ứng ở
trình duyệt, API vẫn trả JSON một lần.
Với câu hỏi khác, harness giữ tối đa bốn lượt ngữ cảnh, mỗi lượt 220 ký tự,
giới hạn trả lời 120 token và tối đa một lần gọi công cụ. Bộ điều phối từ chối
câu hỏi ngoài website hoặc câu có dấu hiệu yêu cầu đổi vai trò/tiết lộ prompt
trước khi gọi provider. Văn bản tự do do mô hình tạo không được hiển thị;
giao diện chỉ nhận câu trả lời cố định hoặc dữ liệu công cụ và link nội bộ do
server tạo.

Endpoint giới hạn 20 yêu cầu/phút theo IP và tối đa 500 ký tự/câu hỏi. Khi nối
provider thật, cần giữ các giới hạn này và bổ sung quota/cost cap theo ngày.

## Lưu thread chat

Migration `20260923_006_assistant_threads.js` tạo `assistant_threads` và
`assistant_messages`. Mỗi câu hỏi cùng câu trả lời được ghi trong một giao dịch
database. `src/server.js` tự chạy các migration còn thiếu trước khi mở cổng API,
vì vậy không cần tạo bảng thủ công khi khởi động bằng `npm start` hoặc PM2 trỏ
tới `src/server.js`. Nếu migration lỗi, server không nhận request.

Lần đầu `POST /api/assistant/chat` trả `thread_id` và `thread_token`; frontend
lưu chúng trong localStorage. Các lần sau gửi `thread_id` trong body và
`thread_token` ở header `X-Assistant-Thread-Token`. `GET /api/assistant/thread/:id`
trả tối đa 100 tin nhắn mới nhất để khôi phục giao diện sau khi tải lại trang.
Database chỉ lưu SHA-256 của token; API không trả lịch sử nếu thiếu hoặc sai token.
Lịch sử đưa vào harness được đọc từ database, không nhận từ client. Ứng dụng
không tự đính kèm IP hoặc thông tin đăng nhập vào bản ghi; nội dung khách tự gõ
vẫn được lưu nguyên văn. Giá và thẻ acc trong lịch sử là dữ liệu tại thời điểm
trả lời, nên khách cần xem trang acc để biết giá và tình trạng hiện tại.

## Tên và avatar chatbot

Admin đổi tên và avatar trong trang Cấu hình Hệ thống. Migration
`20260923_007_assistant_profile.js` thêm hai cột tương ứng vào `setting` và được
chạy tự động lúc backend khởi động. Cấu hình công khai chỉ chứa tên và URL ảnh;
không chứa secret. Giao diện dùng cùng tên cho tiêu đề, lời chào, ô nhập và trạng
thái đang trả lời. Backend đọc tên từ database cho câu chào và instruction LLM.
Tên admin nhập được kiểm tra, đặt trong phần dữ liệu hiển thị của instruction;
quy tắc phạm vi website và chống prompt injection luôn cố định, admin không thể
sửa chúng qua ô tên. Avatar chỉ nhận URL HTTPS hoặc đường dẫn ảnh trong `/uploads`.

## Cấu hình API key LLM

Trang Cấu hình Hệ thống cho phép chọn Gemini hoặc VILAO, lưu, thay hoặc xóa API
key. Migrations `20260923_008_assistant_llm_config.js` và
`20260923_009_assistant_llm_connection.js` thêm provider, key, model và endpoint
vào `setting`; chúng tự chạy khi backend khởi động. Key được mã hóa AES-256-GCM bằng
`ACCOUNT_CREDENTIALS_ENCRYPTION_KEY` trước khi ghi database. API admin chỉ trả
`assistant_llm_key_saved` cùng cấu hình không bí mật; API công khai không trả key hay trạng
thái cấu hình LLM. `getAssistantLlmConfig()` chỉ dùng ở backend để giải mã khi
nối provider ở server. Nút **Kiểm tra API key với model** gọi
`POST /api/admin/assistant/test-llm`; có thể dùng key đang nhập trước khi lưu và
backend chỉ giữ key tạm trong một request. Backend gửi một câu `hello`
với tối đa 32 token đầu ra, timeout 12 giây và giới hạn ba lần/phút. Gemini dùng
`generateContent`; ViLao dùng `chat/completions` tại endpoint `/v1` của key.
Chỉ trả câu trả lời ngắn, tên model và thời gian; không trả key hoặc lỗi thô từ
provider. Phép thử có thể phát sinh chi phí nhỏ.

Khi cấu hình hợp lệ đã được lưu, chat khách dùng model cho các câu hỏi liên quan
website mà bộ quy tắc chưa trả lời được. Tìm acc, chào hỏi, đơn hàng, nạp tiền,
bảo hành và liên hệ vẫn đi qua rule/tool cố định để phản hồi nhanh và tiết kiệm
token. Mỗi lần gọi model chỉ gửi bốn tin gần nhất, tối đa 220 ký tự mỗi tin và
giới hạn 120 output token. Backend loại HTML và URL ngoài trước khi trả nội dung
model cho client; key chỉ được giải mã và dùng trên server.

Tham khảo: [Gemini API](https://ai.google.dev/api),
[model Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite),
[ViLao API Reference](https://vilao.ai/docs/api-reference).

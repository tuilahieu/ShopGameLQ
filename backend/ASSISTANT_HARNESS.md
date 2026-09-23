# Chatbot hỗ trợ khách hàng

Chatbot có chế độ dự phòng chạy **không cần API key**. `POST /api/assistant/chat` nhận
`{ "message": "Tìm acc 200k" }` và trả văn bản cùng tối đa bốn thẻ acc đang bán.
Mỗi thẻ có `href` dạng `/account/:id`; frontend dựng thẻ và nút bằng React,
không render HTML do mô hình tạo. Giá dùng cùng hàm tính giá với trang sản phẩm,
bao gồm giá sale còn hiệu lực.

## Harness LLM

- `src/assistant/instructions.js`: hướng dẫn vai trò, giới hạn đầu ra và ngữ cảnh.
- `src/assistant/skills.js`: các luồng hỗ trợ cố định như đơn hàng, bảo hành,
  nạp tiền và liên hệ.
- `src/assistant/tools.js`: công cụ `search_accounts` chỉ đọc tài khoản đang bán.
- `src/assistant/harness.js`: điều phối câu hỏi và hợp đồng provider.

Adapter Gemini hoặc VILAO cung cấp
`generate({ instructions, messages, tools, maxOutputTokens })` và trả
`{ text }`. API key chỉ nằm ở backend, không gửi cho trình duyệt. Khi đã có
provider, mọi tin nhắn đều được LLM đọc cùng lịch sử và chọn một action JSON:
trả lời, tìm acc, mở luồng hỗ trợ hoặc từ chối ngoài phạm vi. Chỉ prompt
injection bị chặn cứng trước provider. Khi chưa có key, harness dùng rule cũ làm
chế độ dự phòng.
Ví dụ sau câu hỏi về ngân sách, câu trả lời `500` được model hiểu là 500.000đ và
chọn `search_accounts`; backend mới truy vấn kho rồi trả tối đa bốn card.
Với action `search_accounts`, model phải trả cả `foundReply` và `emptyReply`;
backend chọn câu tương ứng sau khi tool tìm xong rồi mới gửi response.

`GET /api/assistant/agent-query?price=500` là tool API dùng chung với action
`search_accounts`; `500` được chuẩn hóa thành 500.000đ. API nhận thêm
`under_budget=true` và `sale_only=true`, chỉ trả tối đa bốn card công khai.
Backend gọi trực tiếp cùng executor thay vì tự gửi HTTP về chính nó. Khi chờ kết
quả tìm kiếm, giao diện hiện “Mình đang tìm cho bạn đây...”.

Trước khi trả về client, `output-validator.js` loại script/HTML/URL ngoài, giới
hạn văn bản, dựng lại title và href từ ID, chỉ giữ các field card công khai và
giới hạn bốn card. Cùng validator được dùng cho tool API, nên response HTTP và
response chat có cùng schema an toàn.
Giao diện hiển thị chữ dần cho câu trả lời của chatbot; đây là hiệu ứng ở
trình duyệt, API vẫn trả JSON một lần.
Harness giữ tối đa tám tin nhắn gần nhất, mỗi tin 220 ký tự, giới hạn cứng
1024 output token và tối đa một lần gọi công cụ. Bộ điều phối từ chối
câu hỏi ngoài website hoặc câu có dấu hiệu yêu cầu đổi vai trò/tiết lộ prompt
trước khi gọi provider. Văn bản tự do được loại HTML, URL ngoài và giới hạn còn
hai câu ngắn. Card và link nội bộ luôn do server tạo.

Instruction yêu cầu Gia Linh nói như một bạn nữ 16 tuổi miền Bắc: vui vẻ, tự
nhiên, teencode vừa phải, xưng mình và gọi khách là bạn. Bot không nói mình là
người thật, không dùng từ tục hoặc thả thính. Model không được nhận, yêu cầu hay
trả tên đăng nhập game, mật khẩu, OTP, cookie, token, thông tin thẻ, API key,
secret hoặc trường database riêng tư. Tool tìm acc chỉ chọn mã, loại, giá, sale,
ảnh và backend tự tạo link chi tiết.

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
`assistant_llm_key_saved` cùng cấu hình không bí mật; API công khai không trả key.
Endpoint trạng thái chatbot chỉ trả `online`, `offline` hoặc `fallback`, không
trả provider, model hay secret. `getAssistantLlmConfig()` chỉ dùng ở backend để giải mã khi
nối provider ở server. Nút **Kiểm tra API key với model** gọi
`POST /api/admin/assistant/test-llm`; có thể dùng key đang nhập trước khi lưu và
backend chỉ giữ key tạm trong một request. Backend gửi một câu `hello`
với tối đa 32 token đầu ra, timeout 12 giây và giới hạn ba lần/phút. Gemini dùng
`generateContent`; ViLao dùng `chat/completions` tại endpoint `/v1` của key.
Chỉ trả câu trả lời ngắn, tên model và thời gian; không trả key hoặc lỗi thô từ
provider. Phép thử có thể phát sinh chi phí nhỏ.

Khi cấu hình hợp lệ đã được lưu, model phụ trách các câu liên quan shop cần suy
luận; rule xử lý câu đơn giản để tiết kiệm token. Model chỉ quyết định action;
tìm acc và link hỗ trợ vẫn do backend thực thi. Mỗi lần gọi model chỉ gửi tám tin gần nhất, tối đa 220 ký tự mỗi tin và
giới hạn 1024 output token. Backend tiếp tục rút câu trả lời tự do xuống tối đa
hai câu, loại HTML và URL ngoài; key chỉ được giải mã và dùng trên server.

Tham khảo: [Gemini API](https://ai.google.dev/api),
[model Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite),
[ViLao API Reference](https://vilao.ai/docs/api-reference).

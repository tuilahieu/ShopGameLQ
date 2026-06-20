# Shop Game Liên Quân - Web App bán Acc Game tự động

Dự án Shop Game Liên Quân là một ứng dụng web hoàn chỉnh (Full-stack) cho phép mua bán tài khoản game Liên Quân Mobile tự động. Dự án được phát triển với hiệu năng cao, giao diện hiện đại hỗ trợ chế độ Sáng/Tối (Light/Dark Mode), tối ưu hóa chuẩn SEO và tương thích hoàn toàn trên các thiết bị di động (Responsive).

---

## 🌟 Tính năng nổi bật

- **Giao diện Cao cấp (Premium Design)**: Sử dụng các gam màu hiện đại, hiệu ứng kính mờ (Glassmorphic blur), hiệu ứng phát sáng (glow animations) và chuyển cảnh mượt mà.
- **Chế độ Sáng/Tối linh hoạt**: Tự động chuyển đổi theo hệ điều hành hoặc cấu hình thủ công qua nút bấm chuyển đổi nhanh.
- **Giao dịch Nạp Tiền tự động qua VietQR**: Khách hàng tạo yêu cầu nạp tiền, hệ thống sẽ hiển thị mã QR cùng thông tin tài khoản được điền sẵn với cú pháp tự động `NAPTIEN [username]`.
- **Quản lý phân quyền 3 cấp**:
  - **Khách hàng (Client)**: Tìm kiếm acc game, lọc theo thuộc tính/giá, mua acc, xem lịch sử giao dịch và tài khoản đã mua, nạp tiền tự động.
  - **Cộng tác viên (CTV)**: Đăng bán tài khoản game cá nhân, theo dõi doanh thu và lịch sử nhận tiền chiết khấu thông qua bảng điều khiển (Ctv Dashboard) thu gọn.
  - **Quản trị viên (Admin)**: Quản lý toàn bộ cấu hình hệ thống, duyệt/xóa nhiều tài khoản cùng lúc (Batch Delete), thiết lập Flash Sale với bộ đếm ngược thời gian thực, quản lý phân trang và tìm kiếm thành viên/lịch sử giao dịch.
- **Tối ưu SEO**: Tự động thay đổi tiêu đề (Document Title) và các thẻ meta tags (description, keywords, OpenGraph) động tương thích tốt với các công cụ tìm kiếm.

---

## 📁 Cấu trúc Thư mục Dự án

```text
shoplienquan/
├── backend/                  # Mã nguồn phía Máy chủ (API)
│   ├── config/               # Cấu hình kết nối Cơ sở dữ liệu
│   ├── controllers/          # Logic xử lý các nghiệp vụ (Auth, Admin, CTV, Orders, v.v.)
│   ├── jobs/                 # Các tác vụ chạy ngầm định kỳ
│   ├── middlewares/          # Bộ lọc kiểm tra quyền hạn (Auth), upload ảnh
│   ├── models/               # Định nghĩa các bảng dữ liệu qua Sequelize ORM
│   ├── routes/               # Định nghĩa các Endpoint API của hệ thống
│   ├── services/             # Các lớp nghiệp vụ bổ trợ chuyên sâu
│   ├── utils/                # Các hàm tiện ích dùng chung
│   ├── validators/           # Kiểm tra tính hợp lệ của dữ liệu đầu vào
│   ├── .env.example          # File mẫu cấu hình biến môi trường
│   ├── package.json          # Các thư viện phụ thuộc của Backend
│   └── src/app.js            # Điểm khởi đầu chính (Entry point) của Server
│
├── frontend/                 # Mã nguồn phía Giao diện (React App)
│   ├── public/               # Tài nguyên tĩnh công khai (logo, banners, v.v.)
│   ├── src/
│   │   ├── api/              # Cấu hình gọi API (Axios Interceptor)
│   │   ├── components/       # Các component giao diện dùng chung (Modal, ThemeToggle...)
│   │   ├── context/          # Quản lý Context toàn cục (AuthContext, ThemeContext)
│   │   ├── layouts/          # Giao diện khung (ClientLayout, AdminLayout, CtvLayout)
│   │   ├── pages/            # Các trang giao diện chính
│   │   │   ├── admin/        # Quản trị hệ thống (Dashboard, Accounts, Users, Sales...)
│   │   │   ├── client/       # Giao diện khách hàng (Home, Accounts, Recharge, Profile...)
│   │   │   └── ctv/          # Giao diện Cộng tác viên (Dashboard, Post Account...)
│   │   ├── utils/            # Tiện ích phía client (seo.js điều hướng metadata...)
│   │   ├── App.jsx           # Cấu hình Router và luồng xử lý chính
│   │   ├── style.css         # File định nghĩa toàn bộ Style & Variable CSS của ứng dụng
│   │   └── main.jsx          # Entry point khởi chạy ứng dụng React
│   ├── .env                  # Biến môi trường kết nối API
│   ├── package.json          # Thư viện phụ thuộc của Frontend
│   └── vite.config.js        # Cấu hình công cụ đóng gói Vite
│
└── shop_game_final.sql       # Bản sao lưu cấu trúc & dữ liệu mẫu Cơ sở dữ liệu MySQL
```

---

## 🛠️ Hướng dẫn Cài đặt & Khởi chạy dự án

### 📋 Yêu cầu hệ thống

- **Node.js**: Phiên bản 18 trở lên.
- **npm**: Trình quản lý gói đi kèm Node.js.
- **MySQL**: Phiên bản 8.0 trở lên.

---

### Bước 1: Thiết lập Cơ sở dữ liệu (Database)

1. Mở công cụ quản trị MySQL của bạn (như phpMyAdmin, Navicat, DBeaver, hoặc Terminal).
2. Tạo một cơ sở dữ liệu mới, ví dụ:
   ```sql
   CREATE DATABASE `shop_game` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Import file `shop_game.sql` nằm ở thư mục gốc vào database vừa tạo.

---

### Bước 2: Thiết lập Backend

1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Cài đặt các gói thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Tạo file cấu hình môi trường `.env` từ file mẫu:
   ```bash
   cp .env.example .env
   ```
4. Mở file `.env` và cập nhật các thông số tương ứng:

   ```env
   PORT=3000

   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=your_mysql_username      # Tên đăng nhập MySQL của bạn
   DB_PASSWORD=your_mysql_password  # Mật khẩu MySQL của bạn
   DB_NAME=shop_game                # Tên database đã tạo ở Bước 1

   JWT_ACCESS_SECRET=your_jwt_access_secret_key
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
   ```

5. Khởi chạy Backend ở chế độ phát triển (sử dụng nodemon để tự động tải lại khi đổi mã nguồn):
   ```bash
   npm run dev
   ```
   _Lúc này, server API sẽ chạy tại địa chỉ: `http://localhost:3000`_

---

### Bước 3: Thiết lập Frontend

1. Mở một Terminal mới và di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
2. Cài đặt các gói thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Tạo hoặc cập nhật file `.env` trong thư mục `frontend/` để cấu hình đường dẫn API:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```
4. Khởi chạy Frontend trên môi trường phát triển:
   ```bash
   npm run dev
   ```
   _Mặc định, ứng dụng web sẽ khởi chạy tại địa chỉ: `http://localhost:5173` (hoặc cổng trống tiếp theo)._

---

## 🚀 Đóng gói Sản phẩm (Production Build)

Khi muốn triển khai dự án lên môi trường thực tế (Staging/Production):

1. Truy cập thư mục `frontend`:
   ```bash
   cd frontend
   ```
2. Đóng gói mã nguồn:
   ```bash
   npm run build
   ```
   Mã nguồn sau khi tối ưu và nén gọn sẽ nằm trong thư mục `frontend/dist`. Bạn có thể dùng thư mục này để đưa lên các dịch vụ hosting static (như Nginx, Vercel, Netlify, v.v.).

---

## 🛠️ Công nghệ Chính

| Frontend               | Backend                       | Database & ORM    |
| :--------------------- | :---------------------------- | :---------------- |
| **React 19**           | **Node.js**                   | **MySQL**         |
| **Vite**               | **Express**                   | **Sequelize ORM** |
| **React Router DOM 7** | **JWT (Authentication)**      | **mysql2 client** |
| **Axios**              | **Multer (File Upload)**      |                   |
| **Lucide Icons**       | **Bcryptjs (Hash Passwords)** |                   |

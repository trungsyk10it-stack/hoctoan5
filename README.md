# Hướng dẫn Cài đặt và Xuất bản Dự án "Ôn Tập Toán 5"

Chào bạn! Đây là hướng dẫn chi tiết để bạn đưa dự án này lên GitHub và xuất bản (deploy) để chạy thử trên internet.

## 1. Chuẩn bị

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:
- **Node.js**: Tải tại [nodejs.org](https://nodejs.org/) (phiên bản LTS).
- **Git**: Tải tại [git-scm.com](https://git-scm.com/).
- **Tài khoản GitHub**: Đăng ký tại [github.com](https://github.com/).
- **Tài khoản Vercel** (để xuất bản web): Đăng ký tại [vercel.com](https://vercel.com/) bằng tài khoản GitHub.

## 2. Cài đặt trên máy tính (Local)

1.  **Tải mã nguồn về**: Tải toàn bộ thư mục dự án này về máy tính của bạn.
2.  **Mở Terminal (Dòng lệnh)**:
    -   Trên Windows: Chuột phải vào thư mục dự án -> chọn "Open in Terminal" hoặc dùng Command Prompt/PowerShell.
    -   Trên Mac/Linux: Mở Terminal và `cd` vào thư mục dự án.
3.  **Cài đặt thư viện**:
    Chạy lệnh sau để cài đặt các gói cần thiết:
    ```bash
    npm install
    ```
4.  **Chạy thử**:
    Chạy lệnh sau để mở web trên máy tính:
    ```bash
    npm run dev
    ```
    Truy cập `http://localhost:3000` để xem kết quả.

    *Lưu ý: Để tính năng "Gia sư AI" hoạt động, bạn cần tạo file `.env` và thêm `GEMINI_API_KEY=...` vào đó (xem hướng dẫn lấy key ở mục 4).*

## 3. Đưa dự án lên GitHub

1.  **Tạo kho chứa (Repository) mới trên GitHub**:
    -   Truy cập [github.com/new](https://github.com/new).
    -   Đặt tên (ví dụ: `on-tap-toan-5`).
    -   Chọn "Public" (Công khai).
    -   Nhấn "Create repository".

2.  **Đẩy code lên GitHub**:
    Quay lại Terminal ở thư mục dự án, chạy lần lượt các lệnh sau:
    ```bash
    git init
    git add .
    git commit -m "Initial commit: Hoan thien du an On Tap Toan 5"
    git branch -M main
    git remote add origin https://github.com/<TÊN_CỦA_BẠN>/on-tap-toan-5.git
    git push -u origin main
    ```
    *(Thay `<TÊN_CỦA_BẠN>` bằng tên tài khoản GitHub của bạn, link này có sẵn ở trang GitHub sau khi bạn tạo repo)*.

## 4. Xuất bản lên Vercel (Khuyên dùng)

Cách dễ nhất để chạy web online là dùng Vercel.

1.  Truy cập [vercel.com/new](https://vercel.com/new).
2.  Chọn **"Import"** dự án `on-tap-toan-5` từ GitHub của bạn.
3.  Ở phần **"Environment Variables"** (Biến môi trường):
    -   Nhập tên: `GEMINI_API_KEY`
    -   Nhập giá trị: (Key API của bạn lấy từ [aistudio.google.com](https://aistudio.google.com/app/apikey))
    -   Nhấn **Add**.
4.  Nhấn **"Deploy"**.

Đợi khoảng 1 phút, Vercel sẽ cung cấp cho bạn một đường link (ví dụ: `https://on-tap-toan-5.vercel.app`). Bạn có thể gửi link này cho học sinh hoặc ban giám khảo để chạy thử!

## 5. Xuất bản lên GitHub Pages (Cách khác)

Nếu bạn muốn dùng GitHub Pages thay vì Vercel:

1.  Mở file `vite.config.ts`, thêm dòng `base: '/on-tap-toan-5/',` vào trong `defineConfig` (thay `on-tap-toan-5` bằng tên repo của bạn).
2.  Chạy lệnh `npm run build`.
3.  Đẩy thư mục `dist` lên nhánh `gh-pages` (cách này phức tạp hơn Vercel một chút).

**Khuyến nghị:** Hãy dùng **Vercel** vì nó tự động cập nhật khi bạn sửa code và hỗ trợ tốt cho các ứng dụng React.

Chúc bạn thành công với sản phẩm dự thi của mình!

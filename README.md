# Antigravity POS - Hệ thống Quản lý Bán hàng & Thu ngân Chuyên nghiệp

Hệ thống Quản lý Bán hàng & Thu ngân (Point of Sale - POS) được xây dựng theo chuẩn kiến trúc **Universal Enterprise Software Architecture Framework (UESAF)** với Clean Architecture 4 tầng, tối ưu tốc độ xử lý bán lẻ, in hóa đơn nhiệt và thống kê doanh thu thời gian thực.

---

## 🌟 Các Tính năng Cốt lõi

1. **Quầy Thu ngân POS (`/pos`)**:
   - Giao diện siêu tốc, trực quan, hỗ trợ màn hình cảm ứng lẫn bàn phím/chuột.
   - Hỗ trợ phím tắt chuyên nghiệp: `F2` (Tìm kiếm / Quét mã vạch), `F9` (Mở thanh toán), `Esc` (Đóng modal).
   - Tự động nhận diện mã vạch Barcode từ máy quét cầm tay.
   - Tính toán chiết khấu (VNĐ hoặc %), thuế VAT (mặc định 8% hoặc tùy chỉnh).
   - Đa dạng phương thức thanh toán:
     - **Tiền mặt**: Phím chọn mệnh giá nhanh, tự động tính tiền thối trả lại khách.
     - **Chuyển khoản VietQR**: Sinh mã QR động theo đúng số tiền và thông tin chuyển khoản tức thì.
     - **Thẻ POS**: Ghi nhận mã giao dịch qua quẹt/chạm thẻ.
   - Hỗ trợ in hóa đơn nhiệt tiêu chuẩn 80mm ngay sau khi hoàn tất giao dịch.

2. **Quản lý Sản phẩm & Danh mục (`/products`)**:
   - Quản lý danh mục hàng hóa, đơn vị tính, giá vốn, giá bán lẻ.
   - Quản lý mã SKU, mã vạch Barcode và định mức tồn kho tối thiểu.
   - Tìm kiếm nhanh, lọc theo danh mục và lọc các mặt hàng sắp hết hàng.

3. **Quản lý Kho & Kiểm kê Tồn kho (`/inventory`)**:
   - Cảnh báo tồn kho dưới định mức (Low-stock Alert).
   - Kiểm kho trực tiếp: Điều chỉnh số lượng thực tế kèm lý do điều chỉnh.
   - Nhật ký biến động kho (Audit Log): Tự động ghi nhận từng lần xuất bán, nhập hàng hoặc kiểm kê.

4. **Lịch sử Đơn hàng (`/orders`)**:
   - Tra cứu danh sách đơn hàng theo mã hóa đơn, trạng thái thanh toán.
   - Xem chi tiết từng món hàng, chiết khấu, thuế, tiền khách đưa, tiền thừa.
   - Hỗ trợ in lại hóa đơn nhiệt bất kỳ lúc nào.

5. **Báo cáo & Thống kê Doanh thu (`/reports`)**:
   - Thẻ chỉ số KPI: Doanh thu hôm nay, số đơn trong ngày, doanh thu tháng này, tổng mặt hàng kinh doanh.
   - Biểu đồ cột biểu diễn doanh thu 7 ngày gần nhất.
   - Bảng xếp hạng Top 5 sản phẩm bán chạy nhất kèm tỉ lệ phần trăm đóng góp doanh thu.

---

## 🏗️ Cấu trúc Kiến trúc Chuẩn UESAF (4 Tầng)

```
src/
├── core/                              # TẦNG 1 & 2: DOMAIN & APPLICATION CORE (Hoàn toàn độc lập Framework)
│   ├── entities/                      # Domain Entities thuần túy (Product, Order, Inventory, Customer)
│   ├── ports/                         # Contracts / Interfaces cho Repository (IProductRepo, IOrderRepo...)
│   ├── use-cases/                     # Nghiệp vụ cụ thể (CreateOrder, AdjustStock, ListProducts...)
│   └── errors/                        # Standardized App Errors (ValidationError, InsufficientStockError...)
│
├── adapters/                          # TẦNG 3: ADAPTERS & REPOSITORIES
│   ├── repositories/                  # Hiện thực hóa Ports bằng Prisma Client
│   └── presenters/                    # Chuẩn hóa Response JSON { success, data } / { success, error }
│
├── infrastructure/                    # TẦNG 4: INFRASTRUCTURE & DRIVERS
│   ├── db/                            # Prisma client singleton
│   └── config/                        # Cấu hình biến môi trường
│
└── app/                               # PRESENTATION / UI LAYER (Next.js 15 App Router)
    ├── api/                           # REST API Endpoints chuẩn hóa
    ├── pos/                           # Màn hình Quầy Thu ngân POS
    ├── products/                      # Màn hình Quản lý Sản phẩm
    ├── inventory/                     # Màn hình Quản lý Tồn kho
    ├── orders/                        # Màn hình Lịch sử Đơn hàng
    ├── reports/                       # Màn hình Báo cáo Doanh thu
    └── layout.tsx & globals.css       # Layout chính và CSS In Hóa đơn Nhiệt 80mm
```

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy

### 1. Khởi chạy Ứng dụng
```bash
# Khởi chạy máy chủ phát triển
npm run dev
# hoặc
pnpm dev
```
Truy cập trình duyệt tại: [http://localhost:3000](http://localhost:3000)

### 2. Dữ liệu Mẫu (Seeding)
Dữ liệu mẫu (10 sản phẩm, 4 danh mục, 3 khách hàng và lịch sử biến động kho ban đầu) đã được nạp sẵn. Nếu muốn nạp lại từ đầu:
```bash
npx tsx prisma/seed.ts
```

### 3. Chuyển đổi sang PostgreSQL (Production / Cloud)
Hệ thống sử dụng Prisma ORM trừu tượng hóa toàn bộ tầng dữ liệu. Để chuyển sang PostgreSQL:
1. Mở file `prisma/schema.prisma` và đổi `provider = "sqlite"` thành `provider = "postgresql"`.
2. Mở file `.env` và cập nhật `DATABASE_URL` sang chuỗi kết nối PostgreSQL của bạn (Supabase, Neon, AWS RDS, hoặc Local):
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/antigravity_pos?schema=public"
   ```
3. Đồng bộ schema và nạp dữ liệu:
   ```bash
   npx prisma db push
   npx tsx prisma/seed.ts
   ```
*(Toàn bộ mã nguồn nghiệp vụ Domain & Use Cases giữ nguyên 100%, không cần sửa đổi bất kỳ dòng code nào).*


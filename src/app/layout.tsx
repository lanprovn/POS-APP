import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Antigravity POS - Quản lý Bán hàng & Thu ngân Chuyên nghiệp",
  description: "Hệ thống POS bán hàng hiện đại, tối ưu tốc độ, kiểm soát tồn kho và báo cáo doanh thu theo chuẩn UESAF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}


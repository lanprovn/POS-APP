"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShoppingCart, 
  Package, 
  Boxes, 
  Receipt, 
  BarChart3, 
  Store,
  Users
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/pos", label: "Quầy POS", icon: ShoppingCart },
    { href: "/products", label: "Sản phẩm", icon: Package },
    { href: "/inventory", label: "Tồn kho", icon: Boxes },
    { href: "/orders", label: "Đơn hàng", icon: Receipt },
    { href: "/customers", label: "Khách hàng", icon: Users },
    { href: "/reports", label: "Báo cáo", icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Store Brand */}
          <div className="flex items-center gap-3">
            <Link href="/pos" className="flex items-center gap-2.5 font-bold text-lg text-emerald-600 hover:text-emerald-700 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
                <Store className="w-6 h-6" />
              </div>
              <div className="hidden sm:block">
                <span className="block leading-none font-black tracking-tight text-slate-900 text-base">ANTIGRAVITY</span>
                <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-widest">POS SYSTEM</span>
              </div>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/pos" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200/60"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-slate-500"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Status */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Đang mở ca</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}


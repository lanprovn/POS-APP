"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShoppingCart, 
  Package, 
  Boxes, 
  Receipt, 
  BarChart3, 
  Store,
  Users,
  Clock,
  Wifi,
  Wallet,
  User,
  ChevronDown,
  Terminal,
  RotateCcw
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [timeStr, setTimeStr] = useState<string>("");
  const [shiftInfo, setShiftInfo] = useState<{ code: string; cashier: string; cash: number } | null>(null);

  // Live system clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch current shift for topbar status
  useEffect(() => {
    const checkShift = async () => {
      try {
        const res = await fetch("/api/shifts/current");
        const json = await res.json();
        if (json.success && json.data) {
          setShiftInfo({
            code: json.data.shiftCode,
            cashier: json.data.cashierName,
            cash: json.data.expectedCash,
          });
        } else {
          setShiftInfo(null);
        }
      } catch {
        // silent fail
      }
    };
    checkShift();
    const interval = setInterval(checkShift, 10000);
    return () => clearInterval(interval);
  }, [pathname]);

  const navLinks = [
    { href: "/pos", label: "Quầy Thu Ngân", icon: ShoppingCart, hotkey: "F1" },
    { href: "/shifts", label: "Sổ Ca", icon: Clock },
    { href: "/orders", label: "Đơn Hàng", icon: Receipt },
    { href: "/returns", label: "Đổi Trả", icon: RotateCcw, hotkey: "F4" },
    { href: "/customers", label: "Khách Hàng", icon: Users },
    { href: "/products", label: "Sản Phẩm", icon: Package },
    { href: "/inventory", label: "Kho Hàng", icon: Boxes },
    { href: "/reports", label: "Báo Cáo", icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-slate-100 border-b border-slate-800 shadow-md select-none">
      <div className="w-full px-3 sm:px-5">
        <div className="flex items-center justify-between h-14">
          {/* Left Brand & Terminal Beacon */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/pos" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition">
                <Store className="w-4 h-4" />
              </div>
              <div className="hidden md:block">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-black text-sm tracking-tight text-white font-mono">ANTIGRAVITY</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                    POS
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                  <Terminal className="w-2.5 h-2.5 text-slate-500" />
                  <span>TRẠM #01</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Center: Module Navigation Pills */}
          <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none max-w-full">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/pos" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-sm font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                  {item.hotkey && (
                    <span className={`hidden xl:inline text-[9px] px-1 py-0.2 rounded font-mono ${
                      isActive ? "bg-emerald-700/60 text-emerald-100" : "bg-slate-800 text-slate-400"
                    }`}>
                      {item.hotkey}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Hardware Status, Shift Cash, Clock & Cashier */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Shift Badge */}
            {shiftInfo ? (
              <Link
                href="/shifts"
                className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/70 hover:border-emerald-500/50 text-xs transition"
                title="Bấm để xem sổ ca"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-mono font-bold text-slate-200 text-[11px]">{shiftInfo.code}</span>
                </div>
                <span className="text-slate-600">|</span>
                <div className="flex items-center gap-1 text-[11px]">
                  <Wallet className="w-3 h-3 text-emerald-400" />
                  <span className="font-mono font-bold text-emerald-400">{shiftInfo.cash.toLocaleString()}đ</span>
                </div>
              </Link>
            ) : (
              <Link
                href="/shifts"
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/20 transition"
              >
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Chưa mở ca</span>
              </Link>
            )}

            {/* Digital Clock with seconds */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 font-mono text-xs text-slate-300">
              <span className="font-semibold text-white tracking-wider">{timeStr || "12:00:00"}</span>
            </div>

            {/* Online Status Beacon */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] font-mono text-emerald-400" title="Kết nối máy chủ ổn định">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span className="hidden xl:inline text-[10px]">ONLINE</span>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="hidden md:inline text-xs font-medium text-slate-200">
                {shiftInfo ? shiftInfo.cashier : "Thu ngân"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

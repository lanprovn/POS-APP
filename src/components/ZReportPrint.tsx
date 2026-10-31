"use client";

import React from "react";
import { CashShiftEntity } from "@/core/entities/shift.entity";

interface ZReportPrintProps {
  shift: CashShiftEntity | null;
}

export function ZReportPrint({ shift }: ZReportPrintProps) {
  if (!shift) return null;

  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "ANTIGRAVITY POS";
  const storeAddress = process.env.NEXT_PUBLIC_STORE_ADDRESS || "123 Nguyễn Trãi, Q.1, TP. HCM";
  const storePhone = process.env.NEXT_PUBLIC_STORE_PHONE || "0901 234 567";

  return (
    <div id="printable-zreport" className="hidden font-mono text-[11px] leading-tight text-black p-2">
      {/* Header */}
      <div className="text-center pb-2 border-b border-dashed border-gray-400">
        <h2 className="text-sm font-bold uppercase tracking-wider">{storeName}</h2>
        <p className="text-[10px] mt-0.5">{storeAddress}</p>
        <p className="text-[10px]">Hotline: {storePhone}</p>
        <h3 className="text-xs font-bold uppercase mt-2">BÁO CÁO KẾT CA (Z-REPORT)</h3>
        <p className="text-[10px]">Mã ca: <strong>{shift.shiftCode}</strong></p>
        <p className="text-[10px]">Thu ngân: <strong>{shift.cashierName}</strong></p>
        <p className="text-[10px]">
          Vào ca: {new Date(shift.startTime).toLocaleString("vi-VN")}
        </p>
        <p className="text-[10px]">
          Đóng ca: {shift.endTime ? new Date(shift.endTime).toLocaleString("vi-VN") : "Đang mở"}
        </p>
      </div>

      {/* Doanh số theo phương thức thanh toán */}
      <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
        <div className="font-bold text-[11px] uppercase mb-1">1. TỔNG KẾT DOANH SỐ</div>
        <div className="flex justify-between">
          <span>Số lượng đơn hàng:</span>
          <span className="font-bold">{shift.ordersCount} đơn</span>
        </div>
        <div className="flex justify-between">
          <span>Tiền mặt (CASH):</span>
          <span>{shift.cashSales.toLocaleString()} đ</span>
        </div>
        <div className="flex justify-between">
          <span>Chuyển khoản (VietQR):</span>
          <span>{shift.bankSales.toLocaleString()} đ</span>
        </div>
        <div className="flex justify-between">
          <span>Thẻ ngân hàng (CARD):</span>
          <span>{shift.cardSales.toLocaleString()} đ</span>
        </div>
        <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-300">
          <span>TỔNG DOANH THU:</span>
          <span>{shift.totalSales.toLocaleString()} đ</span>
        </div>
      </div>

      {/* Đối soát két tiền mặt */}
      <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
        <div className="font-bold text-[11px] uppercase mb-1">2. KIỂM KÊ KÉT TIỀN MẶT</div>
        <div className="flex justify-between">
          <span>(+) Tiền lẻ đầu ca:</span>
          <span>{shift.startingCash.toLocaleString()} đ</span>
        </div>
        <div className="flex justify-between">
          <span>(+) Tiền mặt bán hàng:</span>
          <span>{shift.cashSales.toLocaleString()} đ</span>
        </div>
        {shift.cashIn > 0 && (
          <div className="flex justify-between text-emerald-800">
            <span>(+) Nạp thêm tiền lẻ:</span>
            <span>+{shift.cashIn.toLocaleString()} đ</span>
          </div>
        )}
        {shift.cashPayout > 0 && (
          <div className="flex justify-between text-rose-800">
            <span>(-) Chi tiền mặt trong ca:</span>
            <span>-{shift.cashPayout.toLocaleString()} đ</span>
          </div>
        )}
        {shift.cashDrop > 0 && (
          <div className="flex justify-between text-rose-800">
            <span>(-) Rút nộp két chính:</span>
            <span>-{shift.cashDrop.toLocaleString()} đ</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-300">
          <span>TIỀN MẶT LÝ THUYẾT:</span>
          <span>{shift.expectedCash.toLocaleString()} đ</span>
        </div>
        {shift.endingCash !== null && shift.endingCash !== undefined && (
          <div className="flex justify-between font-bold text-xs">
            <span>TIỀN THỰC TẾ ĐẾM:</span>
            <span>{shift.endingCash.toLocaleString()} đ</span>
          </div>
        )}
        {shift.difference !== null && shift.difference !== undefined && (
          <div className="flex justify-between font-bold text-xs pt-0.5">
            <span>CHÊNH LỆCH:</span>
            <span className={shift.difference === 0 ? "text-emerald-800" : shift.difference > 0 ? "text-blue-800" : "text-rose-800"}>
              {shift.difference === 0
                ? "0 đ (Khớp tiền)"
                : shift.difference > 0
                ? `+${shift.difference.toLocaleString()} đ (Thừa)`
                : `${shift.difference.toLocaleString()} đ (Thiếu)`}
            </span>
          </div>
        )}
      </div>

      {/* Nhật ký thu chi trong ca */}
      {shift.transactions && shift.transactions.length > 0 && (
        <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
          <div className="font-bold text-[10px] uppercase mb-1">3. CÁC KHOẢN THU/CHI PHÁT SINH</div>
          {shift.transactions.map((tx) => (
            <div key={tx.id} className="text-[10px] flex justify-between items-start">
              <div>
                <span className="font-semibold">
                  [{tx.type === "PAYOUT" ? "CHI" : tx.type === "DROP" ? "NỘP KÉT" : "NẠP"}]
                </span>{" "}
                <span>{tx.reason}</span>
              </div>
              <span className="font-mono font-semibold shrink-0">
                {tx.type === "PAYOUT" || tx.type === "DROP" ? "-" : "+"}
                {tx.amount.toLocaleString()} đ
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Ký tên bàn giao */}
      <div className="pt-4 pb-2 text-[10px]">
        <div className="flex justify-between text-center">
          <div className="w-1/2">
            <p className="font-bold">Thu ngân giao ca</p>
            <p className="text-[9px] text-gray-500 italic mt-6">(Ký và ghi rõ họ tên)</p>
          </div>
          <div className="w-1/2">
            <p className="font-bold">Quản lý nhận ca</p>
            <p className="text-[9px] text-gray-500 italic mt-6">(Ký và ghi rõ họ tên)</p>
          </div>
        </div>
      </div>
    </div>
  );
}


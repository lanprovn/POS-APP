"use client";

import React from "react";
import { ReturnReceiptEntity, RETURN_REASON_LABELS } from "@/core/entities/return.entity";

interface ReturnReceiptPrintProps {
  returnReceipt: ReturnReceiptEntity | null;
}

export function ReturnReceiptPrint({ returnReceipt }: ReturnReceiptPrintProps) {
  if (!returnReceipt) return null;

  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "ANTIGRAVITY POS";
  const storeAddress = process.env.NEXT_PUBLIC_STORE_ADDRESS || "123 Nguyễn Trãi, Q.1, TP. HCM";
  const storePhone = process.env.NEXT_PUBLIC_STORE_PHONE || "0901 234 567";

  const reasonLabel =
    RETURN_REASON_LABELS[returnReceipt.reason || ""] || returnReceipt.reason || "Khách đổi ý";

  return (
    <div id="printable-return" className="hidden font-mono text-[11px] leading-tight text-black p-2">
      {/* Header */}
      <div className="text-center pb-2 border-b border-dashed border-gray-400">
        <h2 className="text-sm font-bold uppercase tracking-wider">{storeName}</h2>
        <p className="text-[10px] mt-0.5">{storeAddress}</p>
        <p className="text-[10px]">Hotline: {storePhone}</p>
        <h3 className="text-xs font-bold uppercase mt-2.5 text-slate-900 border-t border-b border-gray-300 py-1">
          PHIẾU TRẢ HÀNG & HOÀN TIỀN
        </h3>
        <p className="text-[10px] font-bold mt-1">Số phiếu: {returnReceipt.returnNumber}</p>
        <p className="text-[10px]">Đơn gốc: #{returnReceipt.orderNumber || returnReceipt.orderId}</p>
        <p className="text-[10px]">
          Thời gian: {new Date(returnReceipt.createdAt).toLocaleString("vi-VN")}
        </p>
        <p className="text-[10px]">Thu ngân lập: {returnReceipt.cashierName}</p>
        {returnReceipt.customer && (
          <p className="text-[10px]">
            Khách hàng: <strong>{returnReceipt.customer.name}</strong>{" "}
            {returnReceipt.customer.phone ? `(${returnReceipt.customer.phone})` : ""}
          </p>
        )}
      </div>

      {/* Thông tin lý do */}
      <div className="py-2 border-b border-dashed border-gray-400 text-[10px]">
        <div className="flex justify-between">
          <span>Lý do trả hàng:</span>
          <span className="font-semibold text-right max-w-[160px]">{reasonLabel}</span>
        </div>
        {returnReceipt.notes && (
          <div className="flex justify-between mt-0.5 text-gray-600">
            <span>Ghi chú:</span>
            <span className="italic text-right max-w-[160px]">{returnReceipt.notes}</span>
          </div>
        )}
      </div>

      {/* Item List */}
      <div className="py-2 border-b border-dashed border-gray-400">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-300 text-[10px]">
              <th className="py-1">Sản phẩm trả</th>
              <th className="py-1 text-center">SL</th>
              <th className="py-1 text-right">Đơn giá</th>
              <th className="py-1 text-right">T.Tiền</th>
            </tr>
          </thead>
          <tbody>
            {returnReceipt.items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-1 pr-1 font-sans">
                  <div className="font-semibold text-[11px]">{item.productName}</div>
                  <div className="text-[9px] text-gray-500">
                    {item.sku} • {item.restockToInventory ? "Nhập lại kho" : "Loại bỏ/Hủy"}
                  </div>
                </td>
                <td className="py-1 text-center align-top font-bold text-red-600">
                  -{item.quantity}
                </td>
                <td className="py-1 text-right align-top">{item.unitPrice.toLocaleString()}</td>
                <td className="py-1 text-right font-bold align-top text-red-700">
                  -{item.refundAmount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tổng tiền hoàn trả */}
      <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
        <div className="flex justify-between font-bold text-xs">
          <span>TỔNG TIỀN HOÀN TRẢ:</span>
          <span className="text-sm">
            {returnReceipt.totalRefundAmount.toLocaleString()} đ
          </span>
        </div>
        <div className="flex justify-between text-[10px] text-gray-600">
          <span>Hình thức hoàn tiền:</span>
          <span className="font-semibold">
            {returnReceipt.refundMethod === "CASH" ? "Tiền mặt (Rút két ca)" : "Chuyển khoản VietQR"}
          </span>
        </div>
      </div>

      {/* Chữ ký xác nhận */}
      <div className="pt-4 pb-2 text-[10px]">
        <div className="grid grid-cols-2 text-center gap-2">
          <div>
            <p className="font-bold">Khách hàng</p>
            <p className="text-[8px] text-gray-500 italic">(Ký, ghi rõ họ tên)</p>
            <div className="h-10"></div>
          </div>
          <div>
            <p className="font-bold">Người lập phiếu</p>
            <p className="text-[8px] text-gray-500 italic">(Ký, ghi rõ họ tên)</p>
            <div className="h-10"></div>
          </div>
        </div>
        <p className="text-center text-[9px] text-gray-500 italic mt-3">
          Phiếu trả hàng có giá trị đối chiếu chứng từ và hạch toán kho.
        </p>
      </div>
    </div>
  );
}

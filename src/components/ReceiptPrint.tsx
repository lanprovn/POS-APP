"use client";

import React from "react";
import { OrderEntity } from "@/core/entities/order.entity";

interface ReceiptPrintProps {
  order: OrderEntity | null;
}

export function ReceiptPrint({ order }: ReceiptPrintProps) {
  if (!order) return null;

  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "ANTIGRAVITY POS";
  const storeAddress = process.env.NEXT_PUBLIC_STORE_ADDRESS || "123 Nguyễn Trãi, Q.1, TP. HCM";
  const storePhone = process.env.NEXT_PUBLIC_STORE_PHONE || "0901 234 567";

  return (
    <div id="printable-receipt" className="hidden font-mono text-[11px] leading-tight text-black p-2">
      {/* Header */}
      <div className="text-center pb-2 border-b border-dashed border-gray-400">
        <h2 className="text-sm font-bold uppercase tracking-wider">{storeName}</h2>
        <p className="text-[10px] mt-0.5">{storeAddress}</p>
        <p className="text-[10px]">Hotline: {storePhone}</p>
        <h3 className="text-xs font-bold uppercase mt-2">HÓA ĐƠN THANH TOÁN</h3>
        <p className="text-[10px]">Số HD: {order.orderNumber}</p>
        <p className="text-[10px]">
          Ngày: {new Date(order.createdAt).toLocaleString("vi-VN")}
        </p>
        <p className="text-[10px]">Thu ngân: {order.cashierName}</p>
      </div>

      {/* Item List */}
      <div className="py-2 border-b border-dashed border-gray-400">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-300 text-[10px]">
              <th className="py-1">Mặt hàng</th>
              <th className="py-1 text-center">SL</th>
              <th className="py-1 text-right">Đơn giá</th>
              <th className="py-1 text-right">T.Tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-1 pr-1 font-sans">
                  <div className="font-semibold text-[11px]">{item.productName}</div>
                  <div className="text-[9px] text-gray-500">{item.sku}</div>
                </td>
                <td className="py-1 text-center align-top">{item.quantity}</td>
                <td className="py-1 text-right align-top">{item.unitPrice.toLocaleString()}</td>
                <td className="py-1 text-right font-semibold align-top">{item.subtotal.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
        <div className="flex justify-between">
          <span>Tổng tiền hàng:</span>
          <span>{order.subtotalAmount.toLocaleString()} đ</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Chiết khấu:</span>
            <span>-{order.discountAmount.toLocaleString()} đ</span>
          </div>
        )}
        {order.taxAmount > 0 && (
          <div className="flex justify-between">
            <span>Thuế VAT:</span>
            <span>+{order.taxAmount.toLocaleString()} đ</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-300">
          <span>TỔNG THANH TOÁN:</span>
          <span>{order.finalAmount.toLocaleString()} đ</span>
        </div>
        <div className="flex justify-between text-[10px] pt-1">
          <span>Phương thức:</span>
          <span className="font-semibold">
            {order.paymentMethod === "CASH"
              ? "Tiền mặt"
              : order.paymentMethod === "BANK_TRANSFER"
              ? "Chuyển khoản (VietQR)"
              : "Thẻ POS"}
          </span>
        </div>
        {order.paymentMethod === "CASH" && (
          <>
            <div className="flex justify-between text-[10px]">
              <span>Tiền khách đưa:</span>
              <span>{order.customerPayment.toLocaleString()} đ</span>
            </div>
            <div className="flex justify-between text-[10px] font-semibold">
              <span>Tiền thừa trả khách:</span>
              <span>{order.changeAmount.toLocaleString()} đ</span>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pt-3 space-y-1 text-[10px]">
        <p className="font-semibold">CẢM ƠN QUÝ KHÁCH VÀ HẸN GẶP LẠI!</p>
        <p className="text-[9px] text-gray-500">Hóa đơn có giá trị đổi trả trong vòng 24 giờ</p>
      </div>
    </div>
  );
}


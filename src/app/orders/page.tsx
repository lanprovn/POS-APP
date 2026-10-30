"use client";

import React, { useState, useEffect } from "react";
import { 
  Receipt, 
  Search, 
  Printer, 
  Eye, 
  Calendar, 
  CreditCard, 
  Banknote, 
  QrCode, 
  CheckCircle2, 
  X
} from "lucide-react";
import { ReceiptPrint } from "@/components/ReceiptPrint";
import { OrderEntity } from "@/core/entities/order.entity";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderEntity[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchOrderNumber, setSearchOrderNumber] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderEntity | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchOrderNumber) params.append("orderNumber", searchOrderNumber);

      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setOrders(data.data.orders);
        setTotalCount(data.data.total);
      }
    } catch (err) {
      console.error("Lỗi tải đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [searchOrderNumber]);

  const handlePrint = (order: OrderEntity) => {
    setSelectedOrder(order);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Lịch sử Đơn hàng
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem lại danh sách hóa đơn đã bán, chi tiết thanh toán và in lại bill
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm">
          Tổng cộng: <span className="font-extrabold text-emerald-600">{totalCount}</span> đơn hàng
        </div>
      </div>

      {/* Tìm kiếm */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchOrderNumber}
            onChange={(e) => setSearchOrderNumber(e.target.value)}
            placeholder="Tìm theo mã hóa đơn (ví dụ: HD-2026...)"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
          />
        </div>
      </div>

      {/* Bảng Đơn Hàng */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Mã hóa đơn</th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4 text-center">Số món</th>
                <th className="py-3 px-4 text-center">Phương thức</th>
                <th className="py-3 px-4 text-right">Tổng tiền</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Đang tải danh sách đơn hàng...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Chưa có đơn hàng nào
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {order.orderNumber}
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-medium">
                        {new Date(order.createdAt).toLocaleString("vi-VN")}
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-slate-700">
                        {order.items.length}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          {order.paymentMethod === "CASH" ? (
                            <>
                              <Banknote className="w-3 h-3 text-emerald-600" /> Tiền mặt
                            </>
                          ) : order.paymentMethod === "BANK_TRANSFER" ? (
                            <>
                              <QrCode className="w-3 h-3 text-indigo-600" /> VietQR
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-3 h-3 text-blue-600" /> Thẻ
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-extrabold text-sm text-emerald-600">
                        {order.finalAmount.toLocaleString()} đ
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã xong
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePrint(order)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="In lại hóa đơn"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Chi Tiết Đơn Hàng */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Chi tiết Đơn hàng #{selectedOrder.orderNumber}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Ngày tạo: {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {/* Bảng sản phẩm trong đơn */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Mặt hàng</th>
                      <th className="py-2 px-3 text-center">SL</th>
                      <th className="py-2 px-3 text-right">Đơn giá</th>
                      <th className="py-2 px-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-slate-800 block">{it.productName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{it.sku}</span>
                        </td>
                        <td className="py-2 px-3 text-center font-bold">{it.quantity}</td>
                        <td className="py-2 px-3 text-right">{it.unitPrice.toLocaleString()} đ</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {it.subtotal.toLocaleString()} đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tóm tắt thanh toán */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Tạm tính tiền hàng:</span>
                  <span className="font-semibold">{selectedOrder.subtotalAmount.toLocaleString()} đ</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Chiết khấu:</span>
                    <span>-{selectedOrder.discountAmount.toLocaleString()} đ</span>
                  </div>
                )}
                {selectedOrder.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Thuế VAT:</span>
                    <span>+{selectedOrder.taxAmount.toLocaleString()} đ</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-2 border-t border-slate-200 text-slate-900">
                  <span>Tổng thanh toán:</span>
                  <span className="text-emerald-600">{selectedOrder.finalAmount.toLocaleString()} đ</span>
                </div>
                {selectedOrder.paymentMethod === "CASH" && (
                  <>
                    <div className="flex justify-between text-slate-500 pt-1 text-[11px]">
                      <span>Tiền khách đưa:</span>
                      <span>{selectedOrder.customerPayment.toLocaleString()} đ</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold text-[11px]">
                      <span>Tiền thối trả khách:</span>
                      <span>{selectedOrder.changeAmount.toLocaleString()} đ</span>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  onClick={() => handlePrint(selectedOrder)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>In hóa đơn này</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Component In nhiệt */}
      <ReceiptPrint order={selectedOrder} />
    </div>
  );
}


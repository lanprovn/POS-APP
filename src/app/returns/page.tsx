"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  RotateCcw,
  Search,
  Printer,
  Eye,
  Plus,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  QrCode,
  Package,
  Layers,
  Calendar,
  X,
  FileText,
  User,
  ShoppingBag,
  CornerDownLeft,
  Undo2,
} from "lucide-react";
import { ReturnReceiptEntity, RETURN_REASON_LABELS } from "@/core/entities/return.entity";
import { OrderReturnEligibility } from "@/core/ports/return-repository.port";
import { ReturnReceiptPrint } from "@/components/ReturnReceiptPrint";

interface ReturnItemDraft {
  orderItemId: string;
  productId?: string | null;
  productName: string;
  sku: string;
  unitPrice: number;
  originalQuantity: number;
  alreadyReturnedQuantity: number;
  remainingQuantity: number;
  returnQuantity: number;
  restockToInventory: boolean;
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnReceiptEntity[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnReceiptEntity | null>(null);

  // Create Return state
  const [lookupOrderNumber, setLookupOrderNumber] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [orderEligibility, setOrderEligibility] = useState<OrderReturnEligibility | null>(null);

  // Return draft state
  const [draftItems, setDraftItems] = useState<ReturnItemDraft[]>([]);
  const [refundMethod, setRefundMethod] = useState<"CASH" | "BANK_TRANSFER">("CASH");
  const [reason, setReason] = useState<string>("CUSTOMER_CHANGED_MIND");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Active shift for cash refund
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null);

  // Print state
  const [printReceipt, setPrintReceipt] = useState<ReturnReceiptEntity | null>(null);

  // Load return list
  const loadReturns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append("returnNumber", searchQuery.trim());
        params.append("orderNumber", searchQuery.trim());
      }

      const res = await fetch(`/api/returns?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setReturns(data.data.returns || []);
        setTotalCount(data.data.total || 0);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách phiếu trả:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load current active shift
  const loadActiveShift = async () => {
    try {
      const res = await fetch("/api/shifts/current");
      const data = await res.json();
      if (data.success && data.data) {
        setActiveShiftId(data.data.id);
      }
    } catch (e) {
      console.error("Lỗi lấy ca hiện tại:", e);
    }
  };

  useEffect(() => {
    loadReturns();
    loadActiveShift();
  }, [searchQuery]);

  // Handle Lookup Order
  const handleLookupOrder = async (orderNumToFind?: string) => {
    const code = (orderNumToFind || lookupOrderNumber).trim();
    if (!code) {
      setLookupError("Vui lòng nhập mã hóa đơn");
      return;
    }

    try {
      setLookupLoading(true);
      setLookupError(null);
      setOrderEligibility(null);
      setDraftItems([]);

      const res = await fetch(`/api/orders/${encodeURIComponent(code)}/return-eligibility`);
      const data = await res.json();

      if (!data.success) {
        setLookupError(data.error?.message || "Không tìm thấy hóa đơn này");
        return;
      }

      const eligibility: OrderReturnEligibility = data.data;
      setOrderEligibility(eligibility);

      // Initialize draft items with 0 returnQuantity
      const drafts: ReturnItemDraft[] = eligibility.items.map((item) => ({
        ...item,
        returnQuantity: 0,
        restockToInventory: true,
      }));
      setDraftItems(drafts);
    } catch (err) {
      console.error("Lỗi tra cứu đơn:", err);
      setLookupError("Lỗi kết nối máy chủ khi tra cứu");
    } finally {
      setLookupLoading(false);
    }
  };

  // Update return quantity for item
  const updateItemQuantity = (index: number, qty: number) => {
    setDraftItems((prev) => {
      const next = [...prev];
      const maxAllowed = next[index].remainingQuantity;
      const safeQty = Math.max(0, Math.min(maxAllowed, qty));
      next[index] = { ...next[index], returnQuantity: safeQty };
      return next;
    });
  };

  const toggleRestock = (index: number) => {
    setDraftItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], restockToInventory: !next[index].restockToInventory };
      return next;
    });
  };

  // Calculate total refund
  const totalRefundAmount = useMemo(() => {
    return draftItems.reduce((acc, item) => acc + item.returnQuantity * item.unitPrice, 0);
  }, [draftItems]);

  const totalReturnUnits = useMemo(() => {
    return draftItems.reduce((acc, item) => acc + item.returnQuantity, 0);
  }, [draftItems]);

  // Submit Return
  const handleSubmitReturn = async () => {
    if (!orderEligibility) return;
    const itemsToReturn = draftItems
      .filter((i) => i.returnQuantity > 0)
      .map((i) => ({
        orderItemId: i.orderItemId,
        productId: i.productId,
        productName: i.productName,
        sku: i.sku,
        quantity: i.returnQuantity,
        unitPrice: i.unitPrice,
        refundAmount: i.returnQuantity * i.unitPrice,
        restockToInventory: i.restockToInventory,
      }));

    if (itemsToReturn.length === 0) {
      setSubmitError("Vui lòng chọn ít nhất một sản phẩm và số lượng trả lại lớn hơn 0");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const payload = {
        orderId: orderEligibility.orderId,
        refundMethod,
        reason,
        notes: notes.trim() || undefined,
        cashierName: "Thu ngân 01",
        shiftId: activeShiftId,
        items: itemsToReturn,
      };

      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        setSubmitError(data.error?.message || "Không thể tạo phiếu trả hàng");
        return;
      }

      const createdReturn: ReturnReceiptEntity = data.data;

      // Close modal, refresh list, trigger print
      setShowCreateModal(false);
      setOrderEligibility(null);
      setLookupOrderNumber("");
      setDraftItems([]);
      setNotes("");

      loadReturns();

      // Trigger thermal print
      setPrintReceipt(createdReturn);
      setTimeout(() => {
        window.print();
      }, 200);
    } catch (err) {
      console.error("Lỗi xác nhận trả hàng:", err);
      setSubmitError("Đã xảy ra lỗi hệ thống khi xử lý trả hàng");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = (r: ReturnReceiptEntity) => {
    setPrintReceipt(r);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const totalRefundedSum = returns.reduce((acc, r) => acc + r.totalRefundAmount, 0);
    const totalReturnedItems = returns.reduce(
      (acc, r) => acc + r.items.reduce((sum, i) => sum + i.quantity, 0),
      0
    );
    return {
      count: totalCount,
      totalRefundedSum,
      totalReturnedItems,
    };
  }, [returns, totalCount]);

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Hidden Thermal Print Component */}
      <ReturnReceiptPrint returnReceipt={printReceipt} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/10 text-rose-600 rounded-xl">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Quản lý Đổi / Trả hàng & Hoàn tiền
              </h1>
              <p className="text-xs text-slate-500">
                Hạch toán trả hàng, đối chiếu chứng từ và tự động nhập lại kho theo đơn hàng
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setShowCreateModal(true);
            setLookupError(null);
            setSubmitError(null);
          }}
          className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm shadow-rose-600/20 active:scale-[0.98] transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo phiếu trả hàng</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-rose-800/40 rounded text-[10px] text-rose-100 font-mono">
            F4
          </kbd>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tổng số phiếu trả</p>
            <p className="text-lg font-bold font-mono text-slate-900">
              {metrics.count} <span className="text-xs font-normal text-slate-400">phiếu</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tổng tiền hoàn trả</p>
            <p className="text-lg font-bold font-mono text-rose-600">
              {metrics.totalRefundedSum.toLocaleString()}{" "}
              <span className="text-xs font-normal text-slate-400">đ</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Số lượng món thu hồi</p>
            <p className="text-lg font-bold font-mono text-slate-900">
              {metrics.totalReturnedItems}{" "}
              <span className="text-xs font-normal text-slate-400">sản phẩm</span>
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã phiếu (TH-...), mã đơn gốc (HD-...) hoặc SĐT khách..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono transition"
          />
        </div>
        <button
          onClick={() => loadReturns()}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
        >
          Làm mới
        </button>
      </div>

      {/* Table of Return Receipts */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Mã phiếu trả</th>
                <th className="py-3 px-4">Đơn hàng gốc</th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Lý do</th>
                <th className="py-3 px-4 text-center">Hình thức</th>
                <th className="py-3 px-4 text-right">Tiền hoàn</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Đang tải danh sách phiếu trả...
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RotateCcw className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                    Chưa có phiếu trả hàng nào được ghi nhận
                  </td>
                </tr>
              ) : (
                returns.map((r) => {
                  const reasonText =
                    RETURN_REASON_LABELS[r.reason || ""] || r.reason || "Lý do khác";
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-mono text-[11px]">
                          {r.returnNumber}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        #{r.orderNumber || r.orderId}
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {new Date(r.createdAt).toLocaleString("vi-VN")}
                      </td>

                      <td className="py-3 px-4 text-slate-800">
                        {r.customer ? (
                          <div>
                            <span className="font-semibold">{r.customer.name}</span>
                            {r.customer.phone && (
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {r.customer.phone}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Khách lẻ</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-[150px] truncate">
                        {reasonText}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {r.refundMethod === "CASH" ? (
                            <>
                              <Banknote className="w-3 h-3 text-emerald-600" /> Tiền mặt
                            </>
                          ) : (
                            <>
                              <QrCode className="w-3 h-3 text-indigo-600" /> VietQR
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 text-sm">
                        -{r.totalRefundAmount.toLocaleString()} đ
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedReturn(r)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                            title="Xem chi tiết phiếu trả"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePrint(r)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="In lại phiếu trả 80mm"
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

      {/* Modal: TẠO PHIẾU TRẢ HÀNG MỚI */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Tạo Phiếu Đổi / Trả Hàng & Hoàn Tiền
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Nhập mã hóa đơn để kiểm tra các sản phẩm được phép hoàn trả
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Step 1: Tra cứu hóa đơn */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Mã hóa đơn gốc (hoặc quét barcode hóa đơn):
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={lookupOrderNumber}
                      onChange={(e) => setLookupOrderNumber(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleLookupOrder();
                      }}
                      placeholder="Nhập mã đơn ví dụ: HD-20261030-0001..."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                  <button
                    onClick={() => handleLookupOrder()}
                    disabled={lookupLoading}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium text-xs rounded-lg transition"
                  >
                    {lookupLoading ? "Đang tra..." : "Tra cứu"}
                  </button>
                </div>

                {lookupError && (
                  <p className="text-xs text-rose-600 flex items-center gap-1.5 font-medium mt-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {lookupError}
                  </p>
                )}
              </div>

              {/* Step 2: Bảng chi tiết sản phẩm đơn hàng */}
              {orderEligibility && (
                <div className="space-y-4">
                  {/* Order info banner */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-100/70 rounded-xl text-xs text-slate-700">
                    <div>
                      <span className="text-slate-500">Đơn hàng:</span>{" "}
                      <span className="font-mono font-bold text-slate-900">
                        #{orderEligibility.orderNumber}
                      </span>{" "}
                      •{" "}
                      <span className="text-slate-500">
                        {new Date(orderEligibility.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Khách:</span>{" "}
                      <span className="font-semibold text-slate-900">
                        {orderEligibility.customer?.name || "Khách lẻ"}
                      </span>{" "}
                      • <span className="text-slate-500">Tổng thanh toán:</span>{" "}
                      <span className="font-mono font-bold text-emerald-600">
                        {orderEligibility.finalAmount.toLocaleString()} đ
                      </span>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Chọn sản phẩm và số lượng trả lại:
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                          <tr>
                            <th className="py-2.5 px-3">Sản phẩm</th>
                            <th className="py-2.5 px-2 text-right">Đơn giá</th>
                            <th className="py-2.5 px-2 text-center">Đã mua</th>
                            <th className="py-2.5 px-2 text-center">Còn lại</th>
                            <th className="py-2.5 px-3 text-center">SL Trả</th>
                            <th className="py-2.5 px-2 text-center">Hồi kho</th>
                            <th className="py-2.5 px-3 text-right">T.Tiền hoàn</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {draftItems.map((item, idx) => {
                            const isEligible = item.remainingQuantity > 0;
                            return (
                              <tr
                                key={item.orderItemId}
                                className={`transition ${
                                  item.returnQuantity > 0 ? "bg-rose-50/40" : "hover:bg-slate-50/50"
                                }`}
                              >
                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-slate-800">
                                    {item.productName}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {item.sku}
                                  </div>
                                </td>

                                <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                                  {item.unitPrice.toLocaleString()} đ
                                </td>

                                <td className="py-2.5 px-2 text-center font-mono text-slate-500">
                                  {item.originalQuantity}
                                </td>

                                <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700">
                                  {item.remainingQuantity}
                                </td>

                                <td className="py-2.5 px-3 text-center">
                                  {isEligible ? (
                                    <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateItemQuantity(idx, item.returnQuantity - 1)
                                        }
                                        disabled={item.returnQuantity <= 0}
                                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 text-xs font-bold"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        min={0}
                                        max={item.remainingQuantity}
                                        value={item.returnQuantity}
                                        onChange={(e) =>
                                          updateItemQuantity(idx, parseInt(e.target.value) || 0)
                                        }
                                        className="w-10 h-7 text-center font-mono font-bold text-xs border-x border-slate-200 focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateItemQuantity(idx, item.returnQuantity + 1)
                                        }
                                        disabled={item.returnQuantity >= item.remainingQuantity}
                                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 text-xs font-bold"
                                      >
                                        +
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">
                                      Đã trả hết
                                    </span>
                                  )}
                                </td>

                                <td className="py-2.5 px-2 text-center">
                                  <label className="inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={item.restockToInventory}
                                      onChange={() => toggleRestock(idx)}
                                      disabled={item.returnQuantity === 0}
                                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer disabled:opacity-40"
                                    />
                                  </label>
                                </td>

                                <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                                  {(item.returnQuantity * item.unitPrice).toLocaleString()} đ
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Form Parameters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Reason */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Lý do trả hàng:
                      </label>
                      <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
                      >
                        {Object.entries(RETURN_REASON_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Refund Method */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Hình thức hoàn tiền:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRefundMethod("CASH")}
                          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                            refundMethod === "CASH"
                              ? "bg-rose-50 border-rose-500 text-rose-700"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          Tiền mặt (Rút két)
                        </button>
                        <button
                          type="button"
                          onClick={() => setRefundMethod("BANK_TRANSFER")}
                          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                            refundMethod === "BANK_TRANSFER"
                              ? "bg-rose-50 border-rose-500 text-rose-700"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Chuyển khoản VietQR
                        </button>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Ghi chú bổ sung:
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Tình trạng bao bì, thỏa thuận hỗ trợ khách..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                      />
                    </div>
                  </div>

                  {submitError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {submitError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Tổng tiền hoàn cho khách ({totalReturnUnits} món):
                </p>
                <p className="text-xl font-bold font-mono text-rose-600">
                  {totalRefundAmount.toLocaleString()} đ
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium rounded-lg transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReturn}
                  disabled={!orderEligibility || totalRefundAmount <= 0 || isSubmitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg shadow-sm shadow-rose-600/20 active:scale-[0.98] transition flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    "Đang xử lý..."
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      Xác nhận trả hàng & Hoàn tiền
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: CHI TIẾT PHIẾU TRẢ HÀNG */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Chi tiết Phiếu trả #{selectedReturn.returnNumber}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Ngày tạo: {new Date(selectedReturn.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <button
                onClick={() => setSelectedReturn(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Đơn hàng gốc:</span>
                  <span className="font-mono font-bold text-slate-800">
                    #{selectedReturn.orderNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Khách hàng:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedReturn.customer?.name || "Khách lẻ"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thu ngân thực hiện:</span>
                  <span className="text-slate-800">{selectedReturn.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hình thức hoàn tiền:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedReturn.refundMethod === "CASH" ? "Tiền mặt" : "Chuyển khoản VietQR"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lý do:</span>
                  <span className="font-semibold text-slate-800">
                    {RETURN_REASON_LABELS[selectedReturn.reason || ""] || selectedReturn.reason}
                  </span>
                </div>
                {selectedReturn.notes && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ghi chú:</span>
                    <span className="text-slate-700 italic">{selectedReturn.notes}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                  Danh sách sản phẩm hoàn trả:
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedReturn.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{item.productName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {item.sku} • {item.restockToInventory ? "Đã nhập lại kho" : "Đã hủy"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold font-mono text-rose-600">
                          -{item.quantity} x {item.unitPrice.toLocaleString()} đ
                        </p>
                        <p className="font-bold font-mono text-xs text-rose-700">
                          -{item.refundAmount.toLocaleString()} đ
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-800">Tổng tiền hoàn trả:</span>
                <span className="font-bold font-mono text-rose-600 text-base">
                  -{selectedReturn.totalRefundAmount.toLocaleString()} đ
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setSelectedReturn(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-xs"
              >
                Đóng
              </button>
              <button
                onClick={() => handlePrint(selectedReturn)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-rose-600/20"
              >
                <Printer className="w-3.5 h-3.5" />
                In lại phiếu 80mm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

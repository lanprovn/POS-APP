"use client";

import React, { useState, useEffect } from "react";
import { 
  Boxes, 
  AlertTriangle, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Edit3, 
  Check, 
  X,
  PackageCheck
} from "lucide-react";

interface Product {
  id: string;
  sku: string;
  name: string;
  stockQuantity: number;
  minStockThreshold: number;
  unit: string;
}

interface InventoryLog {
  id: string;
  productId: string;
  productName?: string;
  sku?: string;
  type: "SALE" | "RESTOCK" | "ADJUSTMENT" | "RETURN";
  quantityChange: number;
  previousStock: number;
  newStock: number;
  note?: string;
  createdAt: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Điều chỉnh kiểm kho
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newStockInput, setNewStockInput] = useState<number>(0);
  const [adjustNote, setAdjustNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, logRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/inventory?limit=50"),
      ]);

      const prodData = await prodRes.json();
      const logData = await logRes.json();

      if (prodData.success) setProducts(prodData.data.products);
      if (logData.success) setLogs(logData.data);
    } catch (err) {
      console.error("Lỗi tải tồn kho:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdjustModal = (p: Product) => {
    setSelectedProduct(p);
    setNewStockInput(p.stockQuantity);
    setAdjustNote(`Kiểm kê kho thực tế ngày ${new Date().toLocaleDateString("vi-VN")}`);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          newStock: Number(newStockInput),
          note: adjustNote,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSelectedProduct(null);
        loadData();
      } else {
        alert(data.error?.message || "Lỗi khi cập nhật kho");
      }
    } catch (err) {
      alert("Lỗi kết nối");
    } finally {
      setIsSubmitting(false);
    }
  };

  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minStockThreshold).length;

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản lý Kho & Kiểm kê Tồn kho
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi lượng hàng thực tế, điều chỉnh số lượng và xem lịch sử xuất nhập
          </p>
        </div>

        {lowStockCount > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Có {lowStockCount} sản phẩm sắp hết hàng cần nhập thêm</span>
          </div>
        )}
      </div>

      {/* Grid: 2 cột - Bảng Kiểm Kho & Bảng Lịch sử biến động */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột Trái: Danh sách Sản phẩm & Nút Kiểm Kho (7 cột) */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-emerald-600" />
              <h2 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Tồn kho hiện tại ({products.length} sản phẩm)
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto flex-1 max-h-[600px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                  <th className="py-2.5 px-3">Sản phẩm</th>
                  <th className="py-2.5 px-3 text-center">Tồn thực tế</th>
                  <th className="py-2.5 px-3 text-center">Định mức</th>
                  <th className="py-2.5 px-3 text-right">Kiểm kho</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      Đang nạp dữ liệu kho...
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const isLow = p.stockQuantity <= p.minStockThreshold;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900 block truncate max-w-[200px]">
                            {p.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {p.sku} • {p.unit}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full font-extrabold text-[11px] ${
                              p.stockQuantity <= 0
                                ? "bg-rose-100 text-rose-700"
                                : isLow
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {p.stockQuantity}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                          {p.minStockThreshold}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => openAdjustModal(p)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 transition"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Điều chỉnh</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cột Phải: Lịch sử Biến Động Kho (5 cột) */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <h2 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Lịch sử Biến động kho
              </h2>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 max-h-[600px] p-3 space-y-2.5">
            {logs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Chưa có dữ liệu biến động kho
              </div>
            ) : (
              logs.map((log) => {
                const isPositive = log.quantityChange > 0;
                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-800">
                        {log.productName || "Sản phẩm"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {log.note || `Giao dịch ${log.type}`}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.createdAt).toLocaleString("vi-VN")}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-flex items-center gap-0.5 font-extrabold text-xs px-2 py-0.5 rounded-full ${
                          isPositive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownLeft className="w-3 h-3" />
                        )}
                        {isPositive ? `+${log.quantityChange}` : log.quantityChange}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Kho: {log.previousStock} ➔ <span className="font-bold">{log.newStock}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal Điều Chỉnh Kiểm Kho */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Kiểm kho: {selectedProduct.name}
              </h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã SKU:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedProduct.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tồn kho trên hệ thống:</span>
                  <span className="font-bold text-slate-800">{selectedProduct.stockQuantity} {selectedProduct.unit}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Số lượng tồn thực tế sau kiểm kê (*)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newStockInput}
                  onChange={(e) => setNewStockInput(Number(e.target.value))}
                  className="w-full px-3 py-2 text-base font-extrabold text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Chênh lệch:{" "}
                  <span
                    className={`font-bold ${
                      newStockInput - selectedProduct.stockQuantity >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {newStockInput - selectedProduct.stockQuantity >= 0 ? "+" : ""}
                    {newStockInput - selectedProduct.stockQuantity} {selectedProduct.unit}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Lý do điều chỉnh
                </label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="Kiểm kho định kỳ, hàng hỏng, hao hụt..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 disabled:opacity-50"
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu kiểm kho"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


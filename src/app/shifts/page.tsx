"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { ZReportPrint } from "@/components/ZReportPrint";
import { 
  Clock, 
  Search, 
  Plus, 
  DollarSign, 
  Printer, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  Coins, 
  CreditCard, 
  QrCode,
  RefreshCw,
  Calendar,
  UserCheck
} from "lucide-react";
import { CashShiftEntity } from "@/core/entities/shift.entity";

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<CashShiftEntity[]>([]);
  const [currentShift, setCurrentShift] = useState<CashShiftEntity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal xem chi tiết ca
  const [selectedShift, setSelectedShift] = useState<CashShiftEntity | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // In Z-Report
  const [printShift, setPrintShift] = useState<CashShiftEntity | null>(null);

  const fetchShifts = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listRes, curRes] = await Promise.all([
        fetch(`/api/shifts?page=${page}&limit=12`),
        fetch("/api/shifts/current"),
      ]);

      const listData = await listRes.json();
      const curData = await curRes.json();

      if (listData.success) {
        setShifts(listData.data.shifts);
        setTotalPages(listData.data.totalPages);
        setTotalCount(listData.data.total);
      }

      if (curData.success) {
        setCurrentShift(curData.data);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách ca:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const handlePrintZReport = (shift: CashShiftEntity) => {
    setPrintShift(shift);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleViewDetail = async (shift: CashShiftEntity) => {
    try {
      const res = await fetch(`/api/shifts/${shift.id}`);
      const json = await res.json();
      if (json.success) {
        setSelectedShift(json.data);
      } else {
        setSelectedShift(shift);
      }
    } catch {
      setSelectedShift(shift);
    }
    setShowDetailModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-1">
              <Clock className="w-4 h-4" />
              <span>SỔ CA BÁN HÀNG & BÀN GIAO KÉT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Quản lý Ca & Báo cáo Z-Report
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Kiểm soát dòng tiền mặt, đối soát doanh thu từng ca thu ngân và in biên bản bàn giao két.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {currentShift ? (
              <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Ca đang mở: <strong>{currentShift.shiftCode}</strong> ({currentShift.cashierName})</span>
              </div>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Chưa có ca làm việc nào mở</span>
              </div>
            )}
          </div>
        </div>

        {/* 4 Cards Tổng Quan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Trạng thái ca hiện tại */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Két tiền ca hiện tại</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {currentShift ? `${currentShift.expectedCash.toLocaleString()}đ` : "0đ"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {currentShift ? `Thu ngân: ${currentShift.cashierName}` : "Đang đóng ca"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Doanh số ca hiện tại */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Doanh số ca mở</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                {currentShift ? `${currentShift.totalSales.toLocaleString()}đ` : "0đ"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {currentShift ? `${currentShift.ordersCount} đơn đã thanh toán` : "Chưa có giao dịch"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Tiền chi trong ca */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chi phí phát sinh</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">
                {currentShift ? `${(currentShift.cashPayout + currentShift.cashDrop).toLocaleString()}đ` : "0đ"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Chi ngoài & Rút nộp két</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Tổng số ca đã lưu */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng số ca làm</p>
              <h3 className="text-2xl font-bold text-indigo-600 mt-1">{totalCount}</h3>
              <p className="text-xs text-slate-400 mt-1">Lịch sử bàn giao</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Bảng Danh Sách Ca */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <h3 className="font-bold text-sm text-slate-900">Lịch Sử Các Ca Bán Hàng</h3>
            <button
              onClick={fetchShifts}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
              title="Tải lại"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Mã Ca / Thu Ngân</th>
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Tiền đầu ca</th>
                  <th className="py-3.5 px-4 text-right">Tổng doanh thu</th>
                  <th className="py-3.5 px-4 text-right">Tiền két thực tế</th>
                  <th className="py-3.5 px-4 text-right">Chênh lệch</th>
                  <th className="py-3.5 px-4 text-right pr-6">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                      Đang tải danh sách ca...
                    </td>
                  </tr>
                ) : shifts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      Chưa có ca làm việc nào được ghi nhận.
                    </td>
                  </tr>
                ) : (
                  shifts.map((s) => {
                    const isOpen = s.status === "OPEN";
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition group">
                        {/* Mã Ca & Thu Ngân */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="font-bold text-slate-900 font-mono text-xs">{s.shiftCode}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            <span>{s.cashierName}</span>
                          </div>
                        </td>

                        {/* Thời gian */}
                        <td className="py-3.5 px-4">
                          <div className="text-xs text-slate-700">
                            Vào: {new Date(s.startTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {s.endTime
                              ? `Đóng: ${new Date(s.endTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
                              : "Đang mở"}
                          </div>
                        </td>

                        {/* Trạng thái */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isOpen
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                            <span>{isOpen ? "Đang mở" : "Đã đóng"}</span>
                          </span>
                        </td>

                        {/* Tiền đầu ca */}
                        <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-700">
                          {s.startingCash.toLocaleString()}đ
                        </td>

                        {/* Doanh thu */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-bold text-slate-900 font-mono text-xs">
                            {s.totalSales.toLocaleString()}đ
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {s.ordersCount} đơn
                          </div>
                        </td>

                        {/* Tiền két thực tế */}
                        <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-slate-900">
                          {s.endingCash !== null && s.endingCash !== undefined
                            ? `${s.endingCash.toLocaleString()}đ`
                            : "—"}
                        </td>

                        {/* Chênh lệch */}
                        <td className="py-3.5 px-4 text-right">
                          {s.difference === null || s.difference === undefined ? (
                            <span className="text-xs text-slate-400 italic">Chưa chốt</span>
                          ) : s.difference === 0 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Khớp</span>
                            </span>
                          ) : s.difference > 0 ? (
                            <span className="text-xs font-bold text-blue-600 font-mono">
                              +{s.difference.toLocaleString()}đ (Thừa)
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-rose-600 font-mono">
                              {s.difference.toLocaleString()}đ (Thiếu)
                            </span>
                          )}
                        </td>

                        {/* Thao tác */}
                        <td className="py-3.5 px-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleViewDetail(s)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                              title="Xem chi tiết ca"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePrintZReport(s)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                              title="In phiếu Z-Report 80mm"
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

          {/* Phân trang */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Hiển thị <strong>{shifts.length}</strong> trên tổng số <strong>{totalCount}</strong> ca làm</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Trang trước
              </button>
              <span className="font-semibold text-slate-700">Trang {page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Trang sau
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal: Chi Tiết Ca Làm Việc */}
      {showDetailModal && selectedShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Chi Tiết Ca: {selectedShift.shiftCode}</h3>
                <p className="text-xs text-slate-500">Thu ngân: <strong>{selectedShift.cashierName}</strong></p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Thống kê doanh thu */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-700 uppercase text-[11px]">Tổng Kết Doanh Số</div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tiền mặt:</span>
                  <span className="font-mono font-semibold">{selectedShift.cashSales.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Chuyển khoản (VietQR):</span>
                  <span className="font-mono font-semibold">{selectedShift.bankSales.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thẻ POS:</span>
                  <span className="font-mono font-semibold">{selectedShift.cardSales.toLocaleString()}đ</span>
                </div>
                <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-sm">
                  <span>TỔNG DOANH THU:</span>
                  <span className="text-emerald-600 font-mono">{selectedShift.totalSales.toLocaleString()}đ</span>
                </div>
              </div>

              {/* Đối soát két tiền */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-700 uppercase text-[11px]">Kiểm Kê Két Tiền Mặt</div>
                <div className="flex justify-between">
                  <span className="text-slate-500">(+) Tiền mặt đầu ca:</span>
                  <span className="font-mono font-semibold">{selectedShift.startingCash.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">(+) Tiền mặt bán hàng:</span>
                  <span className="font-mono font-semibold text-emerald-600">+{selectedShift.cashSales.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">(-) Chi ngoài phát sinh:</span>
                  <span className="font-mono font-semibold text-rose-600">-{selectedShift.cashPayout.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">(-) Rút nộp két chính:</span>
                  <span className="font-mono font-semibold text-rose-600">-{selectedShift.cashDrop.toLocaleString()}đ</span>
                </div>
                <div className="pt-1.5 border-t border-slate-200 flex justify-between font-semibold">
                  <span>Tiền mặt lý thuyết:</span>
                  <span className="font-mono">{selectedShift.expectedCash.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Tiền thực tế kiểm đếm:</span>
                  <span className="font-mono">
                    {selectedShift.endingCash !== null && selectedShift.endingCash !== undefined
                      ? `${selectedShift.endingCash.toLocaleString()}đ`
                      : "Chưa chốt ca"}
                  </span>
                </div>
                {selectedShift.difference !== null && selectedShift.difference !== undefined && (
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200">
                    <span>Chênh lệch két:</span>
                    <span className={selectedShift.difference === 0 ? "text-emerald-600" : selectedShift.difference > 0 ? "text-blue-600" : "text-rose-600"}>
                      {selectedShift.difference === 0
                        ? "0đ (Khớp tiền)"
                        : selectedShift.difference > 0
                        ? `+${selectedShift.difference.toLocaleString()}đ (Thừa)`
                        : `${selectedShift.difference.toLocaleString()}đ (Thiếu)`}
                    </span>
                  </div>
                )}
              </div>

              {/* Danh sách các giao dịch thu chi */}
              {selectedShift.transactions && selectedShift.transactions.length > 0 && (
                <div>
                  <div className="font-bold text-slate-700 uppercase text-[11px] mb-2">Các Khoản Thu / Chi Phát Sinh</div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {selectedShift.transactions.map((tx) => (
                      <div key={tx.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-semibold text-slate-800">
                            [{tx.type === "PAYOUT" ? "Chi ngoài" : tx.type === "DROP" ? "Rút két" : "Nạp thêm"}]
                          </span>{" "}
                          <span className="text-slate-600">{tx.reason}</span>
                        </div>
                        <span className={`font-mono font-bold ${tx.type === "IN" ? "text-emerald-600" : "text-rose-600"}`}>
                          {tx.type === "IN" ? "+" : "-"}{tx.amount.toLocaleString()}đ
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handlePrintZReport(selectedShift)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Phiếu Z-Report (80mm)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Component In Phiếu Z-Report Ẩn */}
      <ZReportPrint shift={printShift} />
    </div>
  );
}


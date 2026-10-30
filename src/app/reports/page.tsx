"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  AlertTriangle, 
  Award, 
  ArrowUpRight,
  Package
} from "lucide-react";
import { SalesSummaryDto } from "@/core/ports/report-repository.port";

export default function ReportsPage() {
  const [data, setData] = useState<SalesSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reports/summary");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Lỗi khi tải báo cáo:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Đang tổng hợp báo cáo doanh thu...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center text-slate-400">
        Không thể tải dữ liệu báo cáo
      </div>
    );
  }

  // Tìm giá trị doanh thu cao nhất trong 7 ngày để tính tỉ lệ chiều cao cột biểu đồ
  const maxDayRevenue = Math.max(...data.dailyRevenueChart.map((d) => d.revenue), 100000);

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Báo cáo & Thống kê Doanh thu
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tổng hợp doanh số bán lẻ, số lượng đơn hàng và top mặt hàng bán chạy nhất
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Doanh thu hôm nay */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Doanh thu hôm nay
            </span>
            <div className="text-xl font-black text-slate-900">
              {data.todayRevenue.toLocaleString()} đ
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{data.todayOrdersCount} đơn hàng hoàn tất</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Doanh thu tháng này */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Doanh thu tháng này
            </span>
            <div className="text-xl font-black text-slate-900">
              {data.monthRevenue.toLocaleString()} đ
            </div>
            <div className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{data.monthOrdersCount} đơn hàng trong tháng</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Tổng số sản phẩm */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Hàng đang kinh doanh
            </span>
            <div className="text-xl font-black text-slate-900">
              {data.totalProductsCount} món
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Sẵn sàng xuất bán tại quầy
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Cảnh báo tồn kho */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Cảnh báo hết hàng
            </span>
            <div className="text-xl font-black text-amber-600">
              {data.lowStockProductsCount} món
            </div>
            <div className="text-[11px] text-amber-700 font-medium">
              Tồn kho ≤ định mức tối thiểu
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Hàng 2: Biểu đồ Doanh Thu 7 Ngày & Top Mặt Hàng */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Biểu đồ doanh thu 7 ngày (7 cột) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                  Biểu đồ Doanh số 7 ngày gần nhất
                </h3>
              </div>
              <span className="text-xs text-slate-400">Đơn vị: VNĐ</span>
            </div>

            {/* Visual Bar Chart */}
            <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-100">
              {data.dailyRevenueChart.map((d, idx) => {
                const heightPercent = Math.max(6, Math.round((d.revenue / maxDayRevenue) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                      {d.revenue.toLocaleString()} đ
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[42px] bg-emerald-500 hover:bg-emerald-600 rounded-t-xl transition-all relative group-hover:shadow-md cursor-pointer"
                    ></div>
                    <span className="text-[10px] font-bold text-slate-500 font-mono mt-1">
                      {d.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Tổng cộng 7 ngày:</span>
            <span className="font-black text-slate-900 text-sm">
              {data.dailyRevenueChart.reduce((acc, cur) => acc + cur.revenue, 0).toLocaleString()} đ
            </span>
          </div>
        </div>

        {/* Top Sản phẩm bán chạy (5 cột) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                Top 5 Sản phẩm Bán chạy nhất
              </h3>
            </div>

            <div className="space-y-4">
              {data.topSellingProducts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Chưa có sản phẩm nào được bán ra
                </div>
              ) : (
                data.topSellingProducts.map((p, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 truncate max-w-[200px]">
                        {idx + 1}. {p.productName}
                      </span>
                      <span className="font-extrabold text-emerald-600">
                        {p.totalRevenue.toLocaleString()} đ
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>SKU: {p.sku}</span>
                      <span>Đã bán: {p.totalQuantitySold} đơn vị</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(10, (p.totalQuantitySold / (data.topSellingProducts[0]?.totalQuantitySold || 1)) * 100))}%`,
                        }}
                        className="h-full bg-emerald-500 rounded-full"
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            Dữ liệu được cập nhật tự động sau mỗi đơn hàng thành công
          </div>
        </div>
      </div>
    </div>
  );
}


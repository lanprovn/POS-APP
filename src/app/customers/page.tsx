"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { 
  Users, 
  Search, 
  Plus, 
  UserPlus, 
  Star, 
  Gift, 
  DollarSign, 
  Phone, 
  Mail, 
  MapPin, 
  ShoppingBag, 
  Edit2, 
  Trash2, 
  Eye, 
  X, 
  Award, 
  ChevronRight, 
  Calendar,
  AlertCircle,
  RefreshCw,
  Coins
} from "lucide-react";

interface CustomerItem {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  totalSpent: number;
  points: number;
  ordersCount: number;
  lastOrderDate: string | null;
  createdAt: string;
}

interface CustomerStats {
  totalCustomers: number;
  vipCustomers: number;
  totalPointsCirculating: number;
  totalSpentAll: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    vipCustomers: 0,
    totalPointsCirculating: 0,
    totalSpentAll: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPoints, setFormPoints] = useState(0);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load stats
  const fetchStats = async () => {
    try {
      const res = await fetch("/api/customers/stats");
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch (err) {
      console.error("Lỗi tải thống kê khách hàng:", err);
    }
  };

  // Load customers
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedTier !== "ALL") params.append("tier", selectedTier);
      params.append("page", page.toString());
      params.append("limit", "12");

      const res = await fetch(`/api/customers?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data.customers);
        setTotalPages(json.data.totalPages);
        setTotalCount(json.data.total);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách khách hàng:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedTier, page]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  // Determine Customer Tier helper
  const getTierInfo = (totalSpent: number) => {
    if (totalSpent >= 25000000) {
      return {
        label: "Kim Cương",
        icon: Award,
        badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200 ring-1 ring-cyan-400/20",
        iconClass: "text-cyan-500",
      };
    }
    if (totalSpent >= 10000000) {
      return {
        label: "Hạng Vàng",
        icon: Star,
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-400/20",
        iconClass: "text-amber-500 fill-amber-500",
      };
    }
    if (totalSpent >= 3000000) {
      return {
        label: "Hạng Bạc",
        icon: Star,
        badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
        iconClass: "text-slate-400",
      };
    }
    return {
      label: "Hạng Đồng",
      icon: Award,
      badgeClass: "bg-stone-100 text-stone-700 border-stone-200",
      iconClass: "text-stone-400",
    };
  };

  const handleOpenAdd = () => {
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormAddress("");
    setFormPoints(0);
    setFormError("");
    setShowAddModal(true);
  };

  const handleOpenEdit = (customer: CustomerItem) => {
    setSelectedCustomer(customer);
    setFormName(customer.name);
    setFormPhone(customer.phone || "");
    setFormEmail(customer.email || "");
    setFormAddress(customer.address || "");
    setFormPoints(customer.points);
    setFormError("");
    setShowEditModal(true);
  };

  const handleOpenHistory = async (customer: CustomerItem) => {
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
    setIsLoadingOrders(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`);
      const json = await res.json();
      if (json.success && json.data.orders) {
        setCustomerOrders(json.data.orders);
      } else {
        setCustomerOrders([]);
      }
    } catch (err) {
      console.error("Lỗi tải lịch sử mua:", err);
      setCustomerOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Vui lòng nhập tên khách hàng.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          phone: formPhone.trim() || null,
          email: formEmail.trim() || null,
          address: formAddress.trim() || null,
          initialPoints: formPoints,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setFormError(json.error?.message || "Không thể tạo khách hàng.");
        setIsSubmitting(false);
        return;
      }

      setShowAddModal(false);
      fetchCustomers();
      fetchStats();
    } catch (err: any) {
      setFormError("Có lỗi xảy ra khi kết nối máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!formName.trim()) {
      setFormError("Vui lòng nhập tên khách hàng.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          phone: formPhone.trim() || null,
          email: formEmail.trim() || null,
          address: formAddress.trim() || null,
          points: formPoints,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setFormError(json.error?.message || "Không thể cập nhật khách hàng.");
        setIsSubmitting(false);
        return;
      }

      setShowEditModal(false);
      fetchCustomers();
      fetchStats();
    } catch (err: any) {
      setFormError("Có lỗi xảy ra khi kết nối máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (customer: CustomerItem) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa khách hàng "${customer.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        fetchCustomers();
        fetchStats();
      } else {
        alert(json.error?.message || "Không thể xóa khách hàng");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Title & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-1">
              <Users className="w-4 h-4" />
              <span>CRM & CHĂM SÓC KHÁCH HÀNG</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Quản lý Khách hàng & Tích điểm
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Lưu trữ hồ sơ hội viên, tích lũy điểm thưởng và lịch sử mua hàng trung thành.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm khách hàng mới</span>
          </button>
        </div>

        {/* 4 KPI Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Tổng khách */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng hội viên</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalCustomers.toLocaleString()}</h3>
              <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <span>Hồ sơ khách quen</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Khách VIP */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Khách VIP (Vàng/KC)</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.vipCustomers.toLocaleString()}</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Chi tiêu trên 10 triệu</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Điểm thưởng lưu hành */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Điểm đang lưu hành</p>
              <h3 className="text-2xl font-bold text-indigo-600 mt-1">{stats.totalPointsCirculating.toLocaleString()}</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Tương đương {(stats.totalPointsCirculating * 1000).toLocaleString()}đ
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Tổng doanh thu khách quen */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Doanh thu hội viên</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalSpentAll.toLocaleString()}đ</h3>
              <p className="text-xs text-emerald-600 font-medium mt-1">Đóng góp doanh số</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên, số điện thoại, email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tier Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: "ALL", label: "Tất cả" },
              { id: "DIAMOND", label: "Kim Cương" },
              { id: "GOLD", label: "Hạng Vàng" },
              { id: "SILVER", label: "Hạng Bạc" },
              { id: "BRONZE", label: "Hạng Đồng" },
            ].map((tier) => (
              <button
                key={tier.id}
                onClick={() => {
                  setSelectedTier(tier.id);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedTier === tier.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table of Customers */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Khách hàng</th>
                  <th className="py-3.5 px-4">Số điện thoại</th>
                  <th className="py-3.5 px-4">Hạng thành viên</th>
                  <th className="py-3.5 px-4 text-right">Điểm tích lũy</th>
                  <th className="py-3.5 px-4 text-right">Tổng chi tiêu</th>
                  <th className="py-3.5 px-4 text-center">Đơn hàng</th>
                  <th className="py-3.5 px-4 text-right pr-6">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                      Đang tải danh sách khách hàng...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      Không tìm thấy khách hàng nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => {
                    const tier = getTierInfo(c.totalSpent);
                    const TierIcon = tier.icon;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition group">
                        {/* Name & Email */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="font-semibold text-slate-900">{c.name}</div>
                          {c.email ? (
                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" />
                              <span>{c.email}</span>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 italic">Chưa có email</div>
                          )}
                        </td>

                        {/* Phone */}
                        <td className="py-3.5 px-4">
                          {c.phone ? (
                            <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">
                              {c.phone}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Chưa có SĐT</span>
                          )}
                        </td>

                        {/* Tier */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${tier.badgeClass}`}>
                            <TierIcon className={`w-3.5 h-3.5 ${tier.iconClass}`} />
                            <span>{tier.label}</span>
                          </span>
                        </td>

                        {/* Points */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-bold text-indigo-600 font-mono">
                            {c.points.toLocaleString()} <span className="text-xs font-normal text-slate-500">điểm</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            ~{(c.points * 1000).toLocaleString()}đ
                          </div>
                        </td>

                        {/* Total Spent */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-semibold text-slate-900 font-mono">
                            {c.totalSpent.toLocaleString()}đ
                          </span>
                        </td>

                        {/* Orders count */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleOpenHistory(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-xs font-medium text-slate-600 transition"
                            title="Xem lịch sử đơn"
                          >
                            <ShoppingBag className="w-3 h-3 text-slate-500" />
                            <span>{c.ordersCount} đơn</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenHistory(c)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                              title="Chi tiết lịch sử"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                              title="Chỉnh sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(c)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
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

          {/* Pagination bar */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Hiển thị <strong>{customers.length}</strong> trên tổng số <strong>{totalCount}</strong> khách hàng</span>
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

      {/* Modal: Thêm khách hàng mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span>Thêm Khách Hàng Mới</span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Họ và Tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Số điện thoại (Dùng để tìm kiếm tại quầy)
                </label>
                <input
                  type="tel"
                  placeholder="Ví dụ: 0912345678"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  placeholder="khachhang@gmail.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Địa chỉ liên hệ
                </label>
                <input
                  type="text"
                  placeholder="Quận/Huyện, Tỉnh/Thành phố..."
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Điểm thưởng khởi tạo ban đầu
                </label>
                <input
                  type="number"
                  min="0"
                  value={formPoints}
                  onChange={(e) => setFormPoints(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
                <p className="text-[11px] text-slate-400 mt-1">Tặng trước điểm chào mừng hội viên mới</p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 disabled:opacity-50 transition"
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu Khách Hàng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Chỉnh sửa khách hàng */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <span>Sửa Thông Tin Khách Hàng</span>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Họ và Tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Địa chỉ liên hệ
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Điểm tích lũy hiện có
                </label>
                <input
                  type="number"
                  min="0"
                  value={formPoints}
                  onChange={(e) => setFormPoints(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
                <p className="text-[11px] text-slate-400 mt-1">Điều chỉnh điểm thưởng thủ công cho khách</p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 disabled:opacity-50 transition"
                >
                  {isSubmitting ? "Đang lưu..." : "Cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Lịch sử đơn hàng của khách */}
      {showHistoryModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Lịch Sử Mua Hàng</h3>
                <p className="text-xs text-slate-500">
                  Khách hàng: <strong>{selectedCustomer.name}</strong> ({selectedCustomer.phone || "Không có SĐT"})
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {isLoadingOrders ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                  Đang tải danh sách đơn hàng...
                </div>
              ) : customerOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  Khách hàng này chưa có đơn hàng nào.
                </div>
              ) : (
                customerOrders.map((ord: any) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between hover:bg-white hover:shadow-sm transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">#{ord.orderNumber}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                          {ord.paymentMethod === "CASH" ? "Tiền mặt" : ord.paymentMethod === "BANK_TRANSFER" ? "VietQR" : "Thẻ"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(ord.createdAt).toLocaleString("vi-VN")}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 font-mono text-base">
                        {ord.finalAmount.toLocaleString()}đ
                      </div>
                      <div className="text-[11px] text-emerald-600 font-medium">
                        +{(Math.floor(ord.finalAmount / 10000)).toLocaleString()} điểm
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>Tổng chi tiêu tích lũy: <strong className="text-slate-900 font-mono">{selectedCustomer.totalSpent.toLocaleString()}đ</strong></span>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


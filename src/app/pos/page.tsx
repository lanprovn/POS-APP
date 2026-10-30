"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Printer, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  X,
  Package,
  User,
  UserCheck,
  UserPlus,
  Coins,
  Award
} from "lucide-react";
import { ReceiptPrint } from "@/components/ReceiptPrint";
import { OrderEntity } from "@/core/entities/order.entity";
import { getCustomerTier, calculatePointValue } from "@/core/entities/customer.entity";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  totalSpent: number;
  points: number;
}

interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockThreshold: number;
  unit: string;
  imageUrl: string | null;
  isActive: boolean;
  categoryId: string | null;
  categoryName?: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Giỏ hàng
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isPercentDiscount, setIsPercentDiscount] = useState<boolean>(false);
  const [vatPercent, setVatPercent] = useState<number>(8); // Mặc định VAT 8%
  const [enableVat, setEnableVat] = useState<boolean>(true);

  // Modal Thanh toán
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER" | "CARD">("CASH");
  const [customerPayment, setCustomerPayment] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderEntity | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Khách hàng & Tích điểm Loyalty
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState<number>(0);

  // Modal tạo nhanh khách hàng
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [quickError, setQuickError] = useState("");
  const [isSavingQuick, setIsSavingQuick] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);

  // 1. Tải danh sách sản phẩm và danh mục
  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
      ]);

      const prodData = await prodRes.json();
      const catData = await catRes.json();

      if (prodData.success) {
        setProducts(prodData.data.products);
      }
      if (catData.success) {
        setCategories(catData.data);
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Tìm kiếm khách hàng khi gõ ô F3
  useEffect(() => {
    if (!customerSearchQuery.trim()) {
      setCustomerResults([]);
      setShowCustomerDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingCustomer(true);
      try {
        const res = await fetch(`/api/customers?search=${encodeURIComponent(customerSearchQuery.trim())}&limit=5`);
        const json = await res.json();
        if (json.success) {
          setCustomerResults(json.data.customers);
          setShowCustomerDropdown(true);
        }
      } catch (err) {
        console.error("Lỗi tìm khách hàng:", err);
      } finally {
        setIsSearchingCustomer(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [customerSearchQuery]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchQuery("");
    setShowCustomerDropdown(false);
    setUsePoints(false);
    setPointsToUse(0);
  };

  const handleRemoveCustomer = () => {
    setSelectedCustomer(null);
    setUsePoints(false);
    setPointsToUse(0);
    setCustomerSearchQuery("");
  };

  const handleSaveQuickCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) {
      setQuickError("Vui lòng nhập tên khách hàng.");
      return;
    }

    setIsSavingQuick(true);
    setQuickError("");
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: quickName.trim(),
          phone: quickPhone.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setQuickError(json.error?.message || "Không thể tạo khách hàng.");
        setIsSavingQuick(false);
        return;
      }

      handleSelectCustomer(json.data);
      setShowQuickAddModal(false);
      setQuickName("");
      setQuickPhone("");
    } catch (err) {
      setQuickError("Lỗi kết nối máy chủ");
    } finally {
      setIsSavingQuick(false);
    }
  };

  // Lắng nghe phím tắt toàn màn hình (F2: Tìm kiếm, F9: Thanh toán)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === "F3") {
        e.preventDefault();
        customerInputRef.current?.focus();
        customerInputRef.current?.select();
      } else if (e.key === "F9") {
        e.preventDefault();
        if (cart.length > 0 && !isCheckoutOpen) {
          openCheckout();
        }
      } else if (e.key === "Escape") {
        if (isCheckoutOpen) {
          setIsCheckoutOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, isCheckoutOpen]);

  // 2. Thêm sản phẩm vào giỏ hàng
  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      alert(`Sản phẩm "${product.name}" đã hết hàng!`);
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.stockQuantity) {
          alert(`Chỉ còn ${product.stockQuantity} sản phẩm trong kho!`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };

  // Cập nhật số lượng
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const prod = products.find((p) => p.id === productId);
    if (prod && quantity > prod.stockQuantity) {
      alert(`Kho chỉ còn ${prod.stockQuantity} sản phẩm!`);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  // Xóa khỏi giỏ
  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Xóa toàn bộ giỏ
  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?")) {
      setCart([]);
      setDiscountAmount(0);
      setDiscountPercent(0);
    }
  };

  // Xử lý quét mã vạch hoặc Enter trong ô tìm kiếm
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault();
      const code = searchQuery.trim().toLowerCase();
      // Tìm sản phẩm khớp chính xác SKU hoặc Barcode
      const matched = products.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === code) ||
          p.sku.toLowerCase() === code
      );

      if (matched) {
        addToCart(matched);
        setSearchQuery("");
      } else if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearchQuery("");
      }
    }
  };

  // Lọc sản phẩm hiển thị
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategory === "ALL" || p.categoryId === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));
      return matchCat && matchQuery && p.isActive;
    });
  }, [products, selectedCategory, searchQuery]);

  // Tính toán số tiền
  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + item.product.sellingPrice * item.quantity,
      0
    );
  }, [cart]);

  const discountVal = useMemo(() => {
    if (isPercentDiscount) {
      return Math.round((subtotal * discountPercent) / 100);
    }
    return discountAmount;
  }, [subtotal, discountAmount, discountPercent, isPercentDiscount]);

  const pointsDiscount = useMemo(() => {
    if (!usePoints || !selectedCustomer || pointsToUse <= 0) return 0;
    const maxDiscountAllowed = Math.max(0, subtotal - discountVal);
    const requestedDiscount = calculatePointValue(pointsToUse);
    return Math.min(requestedDiscount, maxDiscountAllowed);
  }, [usePoints, selectedCustomer, pointsToUse, subtotal, discountVal]);

  const taxVal = useMemo(() => {
    if (!enableVat) return 0;
    const taxableAmount = Math.max(0, subtotal - discountVal - pointsDiscount);
    return Math.round((taxableAmount * vatPercent) / 100);
  }, [subtotal, discountVal, pointsDiscount, enableVat, vatPercent]);

  const finalAmount = useMemo(() => {
    return Math.max(0, subtotal - discountVal - pointsDiscount + taxVal);
  }, [subtotal, discountVal, pointsDiscount, taxVal]);

  const changeAmount = useMemo(() => {
    if (paymentMethod !== "CASH") return 0;
    return Math.max(0, customerPayment - finalAmount);
  }, [customerPayment, finalAmount, paymentMethod]);

  const openCheckout = () => {
    setCustomerPayment(finalAmount);
    setErrorMessage(null);
    setIsCheckoutOpen(true);
  };

  // Xử lý gửi đơn hàng thanh toán
  const handleProcessCheckout = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const payload = {
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.sellingPrice,
        })),
        discountAmount: discountVal + pointsDiscount,
        taxAmount: taxVal,
        customerPayment:
          paymentMethod === "CASH" ? customerPayment : finalAmount,
        paymentMethod,
        cashierName: "Thu ngân 01",
        customerId: selectedCustomer?.id || null,
        pointsUsed: usePoints ? pointsToUse : 0,
      };

      const res = await fetch("/api/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorMessage(data.error?.message || "Lỗi khi xử lý thanh toán");
        return;
      }

      setCompletedOrder(data.data);
      setCart([]);
      loadData(); // Cập nhật lại tồn kho mới nhất
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // In hóa đơn
  const handlePrint = () => {
    window.print();
  };

  // Đóng modal thanh toán hoàn tất và tạo đơn mới
  const handleNewOrder = () => {
    setCompletedOrder(null);
    setIsCheckoutOpen(false);
    setCustomerPayment(0);
    setDiscountAmount(0);
    setDiscountPercent(0);
    setSelectedCustomer(null);
    setUsePoints(false);
    setPointsToUse(0);
    searchInputRef.current?.focus();
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-100">
      {/* Cột Trái: Danh mục & Lưới Sản Phẩm */}
      <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
        {/* Thanh tìm kiếm & Quét mã vạch */}
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Quét mã vạch hoặc gõ tên sản phẩm, SKU... (Phím tắt F2)"
              className="w-full pl-11 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 font-medium transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-1 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-600"
              >
                Xóa
              </button>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200">
            <span className="font-semibold text-emerald-600">{filteredProducts.length}</span> món
          </div>
        </div>

        {/* Danh mục (Category Tabs) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
              selectedCategory === "ALL"
                ? "bg-slate-900 text-white shadow-slate-300"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            Tất cả danh mục
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                selectedCategory === cat.id
                  ? "bg-emerald-600 text-white shadow-emerald-200"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Lưới Sản phẩm */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20 text-slate-400">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Đang tải dữ liệu sản phẩm...</span>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
            <Package className="w-12 h-12 mb-2 stroke-[1.5]" />
            <p className="font-medium text-slate-600">Không tìm thấy sản phẩm nào</p>
            <p className="text-xs text-slate-400">Thử tìm theo từ khóa hoặc mã vạch khác</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
            {filteredProducts.map((p) => {
              const isOutOfStock = p.stockQuantity <= 0;
              const isLow = p.stockQuantity <= p.minStockThreshold;

              return (
                <div
                  key={p.id}
                  onClick={() => !isOutOfStock && addToCart(p)}
                  className={`group relative bg-white rounded-2xl p-3 border transition-all flex flex-col justify-between select-none ${
                    isOutOfStock
                      ? "opacity-60 border-slate-200 cursor-not-allowed bg-slate-50"
                      : "border-slate-200 hover:border-emerald-500 hover:shadow-md cursor-pointer active:scale-[0.98]"
                  }`}
                >
                  {/* Badge Tồn kho */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-mono font-semibold text-slate-400 truncate">
                      {p.sku}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOutOfStock
                          ? "bg-rose-100 text-rose-700"
                          : isLow
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {isOutOfStock ? "Hết hàng" : `Kho: ${p.stockQuantity}`}
                    </span>
                  </div>

                  {/* Ảnh sản phẩm (hoặc fallback) */}
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2 relative">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Tên & Giá */}
                  <div>
                    <h4 className="font-semibold text-xs text-slate-800 line-clamp-2 leading-snug group-hover:text-emerald-700 transition">
                      {p.name}
                    </h4>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-sm font-extrabold text-emerald-600">
                        {p.sellingPrice.toLocaleString("vi-VN")} đ
                      </span>
                      <span className="text-[10px] text-slate-400">/{p.unit}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cột Phải: Giỏ Hàng & Tóm Tắt Thanh Toán */}
      <div className="w-full lg:w-[420px] bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col shadow-xl z-10">
        {/* Header Giỏ Hàng */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <span>Đơn hàng hiện tại</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} món
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Thu ngân: Thu ngân 01</p>
          </div>

          <button
            onClick={clearCart}
            disabled={cart.length === 0}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition disabled:opacity-30 disabled:pointer-events-none"
            title="Xóa giỏ hàng"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Thanh Chọn Khách Hàng & Tích Điểm CRM */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 relative">
          {!selectedCustomer ? (
            <div className="relative">
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    ref={customerInputRef}
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (customerResults.length > 0) setShowCustomerDropdown(true);
                    }}
                    placeholder="F3 - Tìm khách hàng (SĐT / Tên)..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                  {customerSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerSearchQuery("");
                        setShowCustomerDropdown(false);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setQuickPhone(customerSearchQuery);
                    setQuickName("");
                    setQuickError("");
                    setShowQuickAddModal(true);
                  }}
                  className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 transition"
                  title="Thêm nhanh khách hàng mới"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tạo mới</span>
                </button>
              </div>

              {/* Autocomplete Dropdown */}
              {showCustomerDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-30 overflow-hidden divide-y divide-slate-100 animate-in fade-in duration-100 max-h-56 overflow-y-auto">
                  {isSearchingCustomer ? (
                    <div className="p-3 text-center text-xs text-slate-400">Đang tìm khách hàng...</div>
                  ) : customerResults.length > 0 ? (
                    customerResults.map((c) => {
                      const tier = getCustomerTier(c.totalSpent);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectCustomer(c)}
                          className="w-full p-2.5 text-left hover:bg-emerald-50 flex items-center justify-between transition group"
                        >
                          <div>
                            <div className="font-semibold text-xs text-slate-900 group-hover:text-emerald-700">
                              {c.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {c.phone || "Chưa có SĐT"}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${tier.badgeClass}`}>
                              {tier.label}
                            </span>
                            <div className="text-[10px] text-indigo-600 font-bold mt-0.5">
                              {c.points} điểm
                            </div>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center">
                      <p className="text-xs text-slate-500">Không tìm thấy khách hàng này.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setQuickPhone(customerSearchQuery);
                          setQuickName("");
                          setQuickError("");
                          setShowQuickAddModal(true);
                          setShowCustomerDropdown(false);
                        }}
                        className="mt-1 text-xs text-emerald-600 font-bold hover:underline"
                      >
                        + Tạo nhanh khách &quot;{customerSearchQuery}&quot;
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900">{selectedCustomer.name}</span>
                      {(() => {
                        const tier = getCustomerTier(selectedCustomer.totalSpent);
                        return (
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${tier.badgeClass}`}>
                            {tier.label}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {selectedCustomer.phone || "Không có SĐT"} • Điểm: <strong className="text-indigo-600 font-mono">{selectedCustomer.points}</strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveCustomer}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition"
                  title="Bỏ chọn khách hàng (Về khách lẻ)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tích điểm & Tiêu điểm */}
              <div className="mt-2 pt-2 border-t border-emerald-200/50 flex flex-wrap items-center justify-between text-xs">
                {selectedCustomer.points > 0 ? (
                  <div className="flex items-center gap-2 w-full justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={usePoints}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setUsePoints(checked);
                          if (checked) {
                            const maxPossiblePoints = Math.min(
                              selectedCustomer.points,
                              Math.floor((subtotal - discountVal) / 1000)
                            );
                            setPointsToUse(Math.max(0, maxPossiblePoints));
                          } else {
                            setPointsToUse(0);
                          }
                        }}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                      />
                      <span>Đổi điểm trừ tiền</span>
                    </label>

                    {usePoints && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max={selectedCustomer.points}
                          value={pointsToUse}
                          onChange={(e) => {
                            const val = Math.min(
                              selectedCustomer.points,
                              Math.max(0, parseInt(e.target.value) || 0)
                            );
                            setPointsToUse(val);
                          }}
                          className="w-16 px-1.5 py-0.5 text-xs text-right border border-emerald-300 rounded font-mono font-bold text-indigo-700 bg-white"
                        />
                        <span className="text-[10px] text-slate-500">điểm (-{(pointsDiscount).toLocaleString()}đ)</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Khách chưa có điểm tích lũy</span>
                )}
                
                <div className="w-full text-right text-[10px] text-emerald-700 font-semibold mt-1">
                  +{(Math.floor(finalAmount / 10000)).toLocaleString()} điểm thưởng sau đơn
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Danh sách Item Giỏ Hàng */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 text-slate-300">
              <Package className="w-12 h-12 stroke-1 mb-2" />
              <p className="text-sm font-semibold text-slate-500">Giỏ hàng đang trống</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                Chọn sản phẩm bên trái hoặc quét mã vạch để thêm vào giỏ
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition"
              >
                {/* Thông tin sản phẩm */}
                <div className="flex-1 min-w-0 pr-3">
                  <div className="font-semibold text-xs text-slate-900 truncate">
                    {item.product.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {item.product.sellingPrice.toLocaleString()} đ × {item.quantity}
                  </div>
                  <div className="text-xs font-bold text-emerald-600 mt-0.5">
                    {(item.product.sellingPrice * item.quantity).toLocaleString()} đ
                  </div>
                </div>

                {/* Nút tăng giảm số lượng */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-slate-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Nút Xóa */}
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="ml-2 text-slate-300 hover:text-rose-500 transition p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Tổng quan tài chính & Nút Thanh Toán */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3">
          <div className="space-y-1.5 text-xs text-slate-600">
            {/* Tạm tính */}
            <div className="flex justify-between">
              <span>Tạm tính tiền hàng:</span>
              <span className="font-semibold text-slate-800">{subtotal.toLocaleString()} đ</span>
            </div>

            {/* Chiết khấu */}
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">
                Chiết khấu:
                <button
                  onClick={() => setIsPercentDiscount(!isPercentDiscount)}
                  className="text-[10px] px-1.5 py-0.5 bg-slate-200 rounded font-semibold text-slate-700"
                >
                  {isPercentDiscount ? "%" : "VNĐ"}
                </button>
              </span>
              <div className="flex items-center gap-1">
                {isPercentDiscount ? (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent || ""}
                    onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                    placeholder="0"
                    className="w-16 text-right px-2 py-0.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500"
                  />
                ) : (
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={discountAmount || ""}
                    onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                    className="w-24 text-right px-2 py-0.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500"
                  />
                )}
                <span>đ</span>
              </div>
            </div>

            {/* Trừ điểm tích lũy */}
            {pointsDiscount > 0 && (
              <div className="flex justify-between items-center text-indigo-700 font-medium">
                <span className="flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" />
                  <span>Trừ điểm ({pointsToUse} đ):</span>
                </span>
                <span className="font-bold">-{pointsDiscount.toLocaleString()} đ</span>
              </div>
            )}

            {/* Thuế VAT */}
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableVat}
                  onChange={(e) => setEnableVat(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>Thuế VAT ({vatPercent}%):</span>
              </label>
              <span className="font-semibold text-slate-800">
                {taxVal.toLocaleString()} đ
              </span>
            </div>

            {/* Tổng cộng */}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">KHÁCH PHẢI TRẢ:</span>
              <span className="text-xl font-black text-emerald-600">
                {finalAmount.toLocaleString()} đ
              </span>
            </div>
          </div>

          {/* Nút Thanh toán F9 */}
          <button
            onClick={openCheckout}
            disabled={cart.length === 0}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none"
          >
            <Banknote className="w-5 h-5" />
            <span>THANH TOÁN (F9)</span>
          </button>
        </div>
      </div>

      {/* Modal Thanh Toán */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">
                  {completedOrder ? "Thanh toán thành công" : "Xác nhận Thanh toán"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tổng thanh toán:{" "}
                  <span className="font-bold text-emerald-600 text-sm">
                    {finalAmount.toLocaleString()} đ
                  </span>
                </p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {completedOrder ? (
                /* Màn hình sau khi thanh toán thành công */
                <div className="text-center py-6 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">
                      Giao dịch hoàn tất!
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Mã hóa đơn: <span className="font-mono font-bold text-slate-700">{completedOrder.orderNumber}</span>
                    </p>
                    <p className="text-sm font-extrabold text-emerald-600 mt-1">
                      Đã thanh toán: {completedOrder.finalAmount.toLocaleString()} đ
                    </p>
                  </div>

                  {completedOrder.paymentMethod === "CASH" && completedOrder.changeAmount > 0 && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-semibold text-amber-900 inline-block">
                      Tiền thối lại cho khách: {completedOrder.changeAmount.toLocaleString()} đ
                    </div>
                  )}

                  <div className="pt-4 flex gap-3">
                    <button
                      onClick={handlePrint}
                      className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      <Printer className="w-4 h-4" />
                      <span>In hóa đơn (80mm)</span>
                    </button>
                    <button
                      onClick={handleNewOrder}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tạo đơn mới</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Form lựa chọn phương thức thanh toán */
                <div className="space-y-4">
                  {/* Tabs chọn Phương thức */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CASH")}
                      className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                        paymentMethod === "CASH"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20"
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <Banknote className="w-5 h-5 text-emerald-600" />
                      <span>Tiền mặt</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("BANK_TRANSFER")}
                      className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                        paymentMethod === "BANK_TRANSFER"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20"
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <QrCode className="w-5 h-5 text-indigo-600" />
                      <span>VietQR Chuyển khoản</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CARD")}
                      className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                        paymentMethod === "CARD"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20"
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <span>Thẻ POS</span>
                    </button>
                  </div>

                  {/* Chi tiết cho Tiền mặt */}
                  {paymentMethod === "CASH" && (
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Tiền khách đưa (VNĐ):
                        </label>
                        <input
                          type="number"
                          step="1000"
                          value={customerPayment || ""}
                          onChange={(e) => setCustomerPayment(Number(e.target.value))}
                          className="w-full px-3 py-2.5 text-base font-extrabold text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>

                      {/* Phím gợi ý mệnh giá tiền mặt */}
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCustomerPayment(finalAmount)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg"
                        >
                          Đúng số tiền
                        </button>
                        {[20000, 50000, 100000, 200000, 500000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setCustomerPayment(amt)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg"
                          >
                            {amt.toLocaleString()} đ
                          </button>
                        ))}
                      </div>

                      {/* Tiền thừa */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-600">Tiền thừa trả khách:</span>
                        <span className="font-extrabold text-sm text-emerald-600">
                          {changeAmount.toLocaleString()} đ
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Chi tiết cho Chuyển khoản VietQR */}
                  {paymentMethod === "BANK_TRANSFER" && (
                    <div className="space-y-3 pt-1 text-center">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-sm">
                        <img
                          src={`https://img.vietqr.io/image/970422-0901234567-compact2.png?amount=${finalAmount}&addInfo=HD%20THANH%20TOAN&accountName=ANTIGRAVITY%20POS`}
                          alt="VietQR Mã Thanh Toán"
                          className="w-48 h-48 mx-auto object-contain rounded-lg shadow-sm bg-white p-1"
                        />
                        <p className="text-[11px] text-slate-500 mt-2 font-medium">
                          Quét mã bằng ứng dụng ngân hàng bất kỳ
                        </p>
                      </div>
                      <div className="text-xs text-slate-600 space-y-1">
                        <p>Ngân hàng: <span className="font-bold text-slate-800">MB Bank (Quân Đội)</span></p>
                        <p>Số tài khoản: <span className="font-mono font-bold text-slate-800">0901234567</span></p>
                        <p>Số tiền: <span className="font-extrabold text-emerald-600">{finalAmount.toLocaleString()} đ</span></p>
                      </div>
                    </div>
                  )}

                  {/* Chi tiết Thẻ POS */}
                  {paymentMethod === "CARD" && (
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                      <CreditCard className="w-10 h-10 text-slate-400 mx-auto" />
                      <p className="text-xs font-semibold text-slate-700">
                        Vui lòng quẹt/chạm thẻ trên thiết bị POS ngân hàng
                      </p>
                      <p className="text-xs text-slate-400">
                        Sau khi máy POS báo giao dịch thành công, bấm Xác nhận bên dưới.
                      </p>
                    </div>
                  )}

                  {/* Nút Hoàn tất */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleProcessCheckout}
                      disabled={isSubmitting || (paymentMethod === "CASH" && customerPayment < finalAmount)}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-sm shadow-lg shadow-emerald-200 transition disabled:opacity-40 disabled:pointer-events-none"
                    >
                      {isSubmitting ? "Đang xử lý..." : "Xác nhận & Lưu đơn hàng"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tạo nhanh khách hàng */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>Tạo Nhanh Khách Hàng</span>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickCustomer} className="p-5 space-y-3.5">
              {quickError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs">
                  {quickError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Họ và Tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ví dụ: Anh Hoàng"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  placeholder="0912345678"
                  value={quickPhone}
                  onChange={(e) => setQuickPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingQuick}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {isSavingQuick ? "Đang tạo..." : "Tạo & Chọn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Component hóa đơn in nhiệt ẩn */}
      <ReceiptPrint order={completedOrder} />
    </div>
  );
}


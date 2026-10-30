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
  Package
} from "lucide-react";
import { ReceiptPrint } from "@/components/ReceiptPrint";
import { OrderEntity } from "@/core/entities/order.entity";

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

  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Lắng nghe phím tắt toàn màn hình (F2: Tìm kiếm, F9: Thanh toán)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
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

  const taxVal = useMemo(() => {
    if (!enableVat) return 0;
    const taxableAmount = Math.max(0, subtotal - discountVal);
    return Math.round((taxableAmount * vatPercent) / 100);
  }, [subtotal, discountVal, enableVat, vatPercent]);

  const finalAmount = useMemo(() => {
    return Math.max(0, subtotal - discountVal + taxVal);
  }, [subtotal, discountVal, taxVal]);

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
        discountAmount: discountVal,
        taxAmount: taxVal,
        customerPayment:
          paymentMethod === "CASH" ? customerPayment : finalAmount,
        paymentMethod,
        cashierName: "Thu ngân 01",
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

      {/* Component hóa đơn in nhiệt ẩn */}
      <ReceiptPrint order={completedOrder} />
    </div>
  );
}


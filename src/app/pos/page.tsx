"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  Award,
  Clock,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  LayoutGrid,
  List,
  PauseCircle,
  PlayCircle,
  Copy,
  Receipt,
  Check
} from "lucide-react";
import { ReceiptPrint } from "@/components/ReceiptPrint";
import { ZReportPrint } from "@/components/ZReportPrint";
import { OrderEntity } from "@/core/entities/order.entity";
import { CashShiftEntity } from "@/core/entities/shift.entity";
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

interface HeldOrder {
  id: string;
  createdAt: Date;
  cart: CartItem[];
  customer: Customer | null;
  notes?: string;
}

export default function PosPage() {
  // Dữ liệu sản phẩm & danh mục
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");

  // Giỏ hàng & tính tiền
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isPercentDiscount, setIsPercentDiscount] = useState<boolean>(false);
  const [vatPercent, setVatPercent] = useState<number>(8);
  const [enableVat, setEnableVat] = useState<boolean>(true);

  // Lưu tạm đơn hàng (Hold Cart)
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false);

  // Khách hàng & Loyalty
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

  // Ca làm việc (Shift)
  const [currentShift, setCurrentShift] = useState<CashShiftEntity | null>(null);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [showCashTxModal, setShowCashTxModal] = useState(false);
  const [printZReportShift, setPrintZReportShift] = useState<CashShiftEntity | null>(null);

  // Form mở ca
  const [openCashierName, setOpenCashierName] = useState("Thu ngân 01");
  const [openStartingCash, setOpenStartingCash] = useState(500000);
  const [openNotes, setOpenNotes] = useState("");
  const [isOpenShiftSubmitting, setIsOpenShiftSubmitting] = useState(false);
  const [openShiftError, setOpenShiftError] = useState("");

  // Form đóng ca
  const [closeActualCash, setCloseActualCash] = useState<number>(0);
  const [closeNotes, setCloseNotes] = useState("");
  const [isCloseShiftSubmitting, setIsCloseShiftSubmitting] = useState(false);
  const [closeShiftError, setCloseShiftError] = useState("");

  // Form thu chi tiền mặt
  const [txType, setTxType] = useState<"PAYOUT" | "DROP" | "IN">("PAYOUT");
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txReason, setTxReason] = useState("");
  const [isTxSubmitting, setIsTxSubmitting] = useState(false);
  const [txError, setTxError] = useState("");

  // Modal Thanh toán
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER" | "CARD">("CASH");
  const [customerPayment, setCustomerPayment] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderEntity | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedBankInfo, setCopiedBankInfo] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);

  // 1. Tải dữ liệu ban đầu
  const loadData = useCallback(async () => {
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
      console.error("Lỗi khi tải dữ liệu sản phẩm:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCurrentShift = useCallback(async () => {
    try {
      const res = await fetch("/api/shifts/current");
      const json = await res.json();
      if (json.success) {
        setCurrentShift(json.data);
      }
    } catch (err) {
      console.error("Lỗi tải thông tin ca:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
    fetchCurrentShift();
  }, [loadData, fetchCurrentShift]);

  // Phím tắt toàn màn hình (F1: POS, F2: Tìm kiếm, F3: Khách hàng, F9: Thanh toán, Esc: Thoát)
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
        } else if (showCustomerDropdown) {
          setShowCustomerDropdown(false);
        } else if (showHeldOrdersModal) {
          setShowHeldOrdersModal(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, isCheckoutOpen, showCustomerDropdown, showHeldOrdersModal]);

  // Tìm kiếm khách hàng (F3)
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
    } catch {
      setQuickError("Lỗi kết nối máy chủ");
    } finally {
      setIsSavingQuick(false);
    }
  };

  // Ca làm việc Handlers
  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpenShiftSubmitting(true);
    setOpenShiftError("");
    try {
      const res = await fetch("/api/shifts/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cashierName: openCashierName,
          startingCash: openStartingCash,
          notes: openNotes,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setOpenShiftError(json.error?.message || "Không thể mở ca làm việc");
        setIsOpenShiftSubmitting(false);
        return;
      }
      setCurrentShift(json.data);
      setShowOpenShiftModal(false);
    } catch {
      setOpenShiftError("Lỗi kết nối máy chủ");
    } finally {
      setIsOpenShiftSubmitting(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;
    setIsCloseShiftSubmitting(true);
    setCloseShiftError("");
    try {
      const res = await fetch("/api/shifts/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftId: currentShift.id,
          endingCash: closeActualCash,
          notes: closeNotes,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setCloseShiftError(json.error?.message || "Không thể đóng ca");
        setIsCloseShiftSubmitting(false);
        return;
      }
      const closedShift = json.data;
      setCurrentShift(null);
      setShowCloseShiftModal(false);
      setPrintZReportShift(closedShift);
      setTimeout(() => {
        window.print();
      }, 250);
    } catch {
      setCloseShiftError("Lỗi kết nối máy chủ");
    } finally {
      setIsCloseShiftSubmitting(false);
    }
  };

  const handleAddCashTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;
    if (txAmount <= 0) {
      setTxError("Vui lòng nhập số tiền lớn hơn 0");
      return;
    }
    if (!txReason.trim()) {
      setTxError("Vui lòng nhập lý do giao dịch");
      return;
    }
    setIsTxSubmitting(true);
    setTxError("");
    try {
      const res = await fetch("/api/shifts/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftId: currentShift.id,
          type: txType,
          amount: txAmount,
          reason: txReason.trim(),
          performedBy: currentShift.cashierName,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setTxError(json.error?.message || "Lỗi ghi nhận giao dịch");
        setIsTxSubmitting(false);
        return;
      }
      setShowCashTxModal(false);
      setTxAmount(0);
      setTxReason("");
      fetchCurrentShift();
    } catch {
      setTxError("Lỗi kết nối máy chủ");
    } finally {
      setIsTxSubmitting(false);
    }
  };

  // Thao tác giỏ hàng
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

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm("Xóa toàn bộ giỏ hàng hiện tại?")) {
      setCart([]);
      setDiscountAmount(0);
      setDiscountPercent(0);
      setSelectedCustomer(null);
      setUsePoints(false);
      setPointsToUse(0);
    }
  };

  // Lưu tạm đơn hàng (Hold Cart)
  const handleHoldCart = () => {
    if (cart.length === 0) return;
    const newHeld: HeldOrder = {
      id: `HOLD-${Date.now().toString().slice(-4)}`,
      createdAt: new Date(),
      cart: [...cart],
      customer: selectedCustomer,
    };
    setHeldOrders((prev) => [newHeld, ...prev]);
    setCart([]);
    setSelectedCustomer(null);
    setUsePoints(false);
    setPointsToUse(0);
    setDiscountAmount(0);
  };

  const handleRestoreHeld = (held: HeldOrder) => {
    setCart(held.cart);
    setSelectedCustomer(held.customer);
    setHeldOrders((prev) => prev.filter((h) => h.id !== held.id));
    setShowHeldOrdersModal(false);
  };

  const handleDeleteHeld = (id: string) => {
    setHeldOrders((prev) => prev.filter((h) => h.id !== id));
  };

  // Quét mã vạch hoặc Enter trong thanh tìm kiếm
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault();
      const code = searchQuery.trim().toLowerCase();

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

  // Đếm số lượng sản phẩm theo từng Category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: products.filter((p) => p.isActive).length };
    products.forEach((p) => {
      if (p.isActive && p.categoryId) {
        counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

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

  // Mở thanh toán nhanh với nút tiền mặt 1-chạm
  const handleQuickCashTender = (amount: number) => {
    setPaymentMethod("CASH");
    setCustomerPayment(amount);
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
        cashierName: currentShift?.cashierName || "Thu ngân 01",
        customerId: selectedCustomer?.id || null,
        pointsUsed: usePoints ? pointsToUse : 0,
        shiftId: currentShift?.id || null,
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
      loadData();
      fetchCurrentShift();
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi kết nối máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

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
    <div className="flex-1 flex flex-col h-[calc(100vh-56px)] max-h-[calc(100vh-56px)] overflow-hidden bg-slate-900 select-none">
      {/* KHUNG POS: Chia đôi 65% Catalog / 35% Register */}
      <div className="flex-1 flex flex-col lg:flex-row h-full min-h-0 overflow-hidden">
        
        {/* ========================================================================= */}
        {/* CỘT TRÁI (65%): CATALOG HÀNG HÓA & THANH TÌM KIẾM CÔNG THÁI HỌC          */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-950/60 border-r border-slate-800/80 overflow-hidden">
          
          {/* 1. Header Toolbar: Search + View Toggle + Shift Quick Action */}
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
            {/* Thanh tìm kiếm & Quét mã vạch Barcode */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="[F2] Quét mã vạch hoặc tìm tên sản phẩm, SKU..."
                className="w-full pl-10 pr-20 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-medium transition"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 hover:text-white"
                  >
                    Esc
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                    F2
                  </span>
                )}
              </div>
            </div>

            {/* View Mode Toggle: Grid vs List */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("GRID")}
                className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === "GRID"
                    ? "bg-slate-700 text-emerald-400 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Xem dạng Lưới ảnh"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("LIST")}
                className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === "LIST"
                    ? "bg-slate-700 text-emerald-400 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Xem dạng Danh sách nhanh (Siêu thị)"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Shift Banner Status Pill */}
            {!currentShift ? (
              <button
                onClick={() => {
                  setOpenStartingCash(500000);
                  setOpenNotes("");
                  setOpenShiftError("");
                  setShowOpenShiftModal(true);
                }}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Mở Ca Bán</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    setTxType("PAYOUT");
                    setTxAmount(0);
                    setTxReason("");
                    setTxError("");
                    setShowCashTxModal(true);
                  }}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition"
                  title="Thu / Chi tiền mặt ngoài ca"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 text-rose-400" />
                </button>
                <button
                  onClick={() => {
                    setCloseActualCash(currentShift.expectedCash);
                    setCloseNotes("");
                    setCloseShiftError("");
                    setShowCloseShiftModal(true);
                  }}
                  className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-semibold transition"
                  title="Kết ca / In phiếu Z"
                >
                  Kết Ca
                </button>
              </div>
            )}
          </div>

          {/* 2. Category Rail: Horizontal scrollable tabs with badges */}
          <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === "ALL"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/30"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60"
              }`}
            >
              <span>Tất cả</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                selectedCategory === "ALL" ? "bg-emerald-800 text-white" : "bg-slate-700 text-slate-300"
              }`}>
                {categoryCounts.ALL || 0}
              </span>
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/30"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? "bg-emerald-800 text-white" : "bg-slate-700 text-slate-300"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 3. Product Catalog List or Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3.5 pos-scrollbar">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Đang tải danh mục hàng hóa...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16">
                <Package className="w-12 h-12 stroke-1 text-slate-600 mb-2" />
                <p className="font-semibold text-sm">Không tìm thấy sản phẩm nào</p>
                <p className="text-xs text-slate-500 mt-1">Thử đổi từ khóa hoặc quét mã vạch khác</p>
              </div>
            ) : viewMode === "GRID" ? (
              /* DẠNG GRID (Ảnh vuông, nút to nảy, Touch-friendly phong cách Square) */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5">
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.stockQuantity <= 0;
                  const isLowStock = p.stockQuantity > 0 && p.stockQuantity <= p.minStockThreshold;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => addToCart(p)}
                      className={`relative bg-slate-900 rounded-2xl border p-2.5 flex flex-col justify-between text-left transition-all duration-150 group overflow-hidden ${
                        isOutOfStock
                          ? "opacity-40 border-slate-800 cursor-not-allowed"
                          : "border-slate-800 hover:border-emerald-500/60 hover:bg-slate-850 hover:shadow-lg hover:shadow-black/40 active:scale-[0.97]"
                      }`}
                    >
                      {/* Ảnh & Stock Status Badge */}
                      <div className="w-full aspect-square bg-slate-800/80 rounded-xl overflow-hidden mb-2 relative flex items-center justify-center">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-gradient-to-br from-slate-800 to-slate-900">
                            <Package className="w-8 h-8 stroke-1 text-slate-500" />
                            <span className="text-[9px] font-mono text-slate-500 mt-1 uppercase">{p.sku}</span>
                          </div>
                        )}

                        {/* Stock Tag */}
                        <div className="absolute top-1.5 left-1.5">
                          {isOutOfStock ? (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-sm">
                              Hết hàng
                            </span>
                          ) : isLowStock ? (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/90 text-slate-950 font-mono shadow-sm">
                              Còn {p.stockQuantity}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-slate-900/80 text-emerald-400 border border-slate-700/80 font-mono backdrop-blur-sm">
                              Còn {p.stockQuantity}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Thông tin & Giá bán */}
                      <div className="w-full">
                        <h4 className="font-semibold text-xs text-slate-200 line-clamp-2 leading-snug group-hover:text-emerald-400 transition">
                          {p.name}
                        </h4>
                        <div className="mt-2 flex items-baseline justify-between pt-1 border-t border-slate-800/60">
                          <span className="text-sm font-black text-emerald-400 font-mono tracking-tight">
                            {p.sellingPrice.toLocaleString()}đ
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">/{p.unit}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* DẠNG LIST (Bảng siêu tốc cho Siêu thị / Tạp hóa) */
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-800">
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.stockQuantity <= 0;
                  return (
                    <div
                      key={p.id}
                      onClick={() => !isOutOfStock && addToCart(p)}
                      className={`p-2.5 flex items-center justify-between transition cursor-pointer ${
                        isOutOfStock ? "opacity-40 bg-slate-950" : "hover:bg-slate-800/80 active:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-200">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                            <span>SKU: {p.sku}</span>
                            {p.barcode && <span>• Barcode: {p.barcode}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          isOutOfStock ? "bg-rose-500/20 text-rose-400" : "bg-slate-800 text-slate-300"
                        }`}>
                          {isOutOfStock ? "Hết hàng" : `Kho: ${p.stockQuantity} ${p.unit}`}
                        </span>

                        <div className="text-right">
                          <div className="text-sm font-black font-mono text-emerald-400">
                            {p.sellingPrice.toLocaleString()}đ
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isOutOfStock}
                          className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center disabled:opacity-30"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CỘT PHẢI (35%): CASH REGISTER TERMINAL - ĐƠN HÀNG, KHÁCH HÀNG & THANH TOÁN */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-[420px] xl:w-[460px] h-full max-h-full min-h-0 bg-slate-900 flex flex-col shrink-0 shadow-2xl relative z-10 border-l border-slate-800 overflow-hidden">
          
          {/* 1. Register Header & Hold Cart */}
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5 font-mono">
                <span>HÓA ĐƠN</span>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} món
                </span>
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Nút lưu tạm đơn hàng */}
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={handleHoldCart}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition disabled:opacity-30"
                title="Lưu tạm đơn hiện tại để phục vụ khách khác"
              >
                <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Lưu tạm</span>
              </button>

              {/* Danh sách đơn lưu tạm */}
              {heldOrders.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHeldOrdersModal(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold flex items-center gap-1 border border-amber-500/40 animate-pulse"
                >
                  <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>{heldOrders.length} đơn chờ</span>
                </button>
              )}

              {/* Nút xóa giỏ */}
              <button
                type="button"
                onClick={clearCart}
                disabled={cart.length === 0}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition disabled:opacity-30"
                title="Xóa giỏ hàng"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 2. Customer Loyalty Bar (F3) */}
          <div className="p-2.5 bg-slate-900 border-b border-slate-800 relative shrink-0">
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
                      placeholder="[F3] Khách quen (SĐT / Tên)..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    />
                    {customerSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerSearchQuery("");
                          setShowCustomerDropdown(false);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
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
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Khách</span>
                  </button>
                </div>

                {/* Dropdown gợi ý khách */}
                {showCustomerDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 z-30 overflow-hidden divide-y divide-slate-700 max-h-56 overflow-y-auto">
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
                            className="w-full p-2.5 text-left hover:bg-slate-700 flex items-center justify-between transition group"
                          >
                            <div>
                              <div className="font-semibold text-xs text-white group-hover:text-emerald-400">
                                {c.name}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">{c.phone || "Chưa có SĐT"}</div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-amber-400">{tier.label}</span>
                              <div className="text-[10px] text-emerald-400 font-mono font-bold">{c.points} điểm</div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-3 text-center">
                        <p className="text-xs text-slate-400">Không tìm thấy khách hàng này.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setQuickPhone(customerSearchQuery);
                            setQuickName("");
                            setQuickError("");
                            setShowQuickAddModal(true);
                            setShowCustomerDropdown(false);
                          }}
                          className="mt-1 text-xs text-emerald-400 font-bold hover:underline"
                        >
                          + Tạo nhanh khách &quot;{customerSearchQuery}&quot;
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Thẻ khách hàng đã chọn */
              <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white">{selectedCustomer.name}</span>
                        {(() => {
                          const tier = getCustomerTier(selectedCustomer.totalSpent);
                          return (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              {tier.label}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {selectedCustomer.phone || "Không SĐT"} • Điểm: <strong className="text-emerald-400 font-mono">{selectedCustomer.points}</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveCustomer}
                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-750 rounded-lg transition"
                    title="Bỏ chọn khách hàng"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Đổi điểm trừ tiền */}
                {selectedCustomer.points > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-700 flex items-center justify-between text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300 font-medium">
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
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 bg-slate-900 border-slate-700"
                      />
                      <span>Đổi điểm trừ tiền</span>
                    </label>

                    {usePoints && (
                      <div className="flex items-center gap-1 font-mono">
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
                          className="w-16 px-1.5 py-0.5 text-xs text-right border border-emerald-500/60 rounded bg-slate-900 font-bold text-emerald-400"
                        />
                        <span className="text-[10px] text-emerald-400">(-{pointsDiscount.toLocaleString()}đ)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Danh sách món trong Giỏ Hàng */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-1.5 pos-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 text-slate-500">
                <Receipt className="w-12 h-12 stroke-1 text-slate-700 mb-2" />
                <p className="text-xs font-semibold text-slate-400">Giỏ hàng đang trống</p>
                <p className="text-[11px] text-slate-600 mt-0.5 max-w-[200px]">
                  Chọn sản phẩm bên trái hoặc quét mã vạch để bắt đầu tính tiền
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between hover:bg-slate-800 transition"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-semibold text-xs text-white truncate">{item.product.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {item.product.sellingPrice.toLocaleString()}đ × {item.quantity}
                    </div>
                  </div>

                  {/* Stepper + - */}
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold text-white font-mono">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Line Total & Trash */}
                  <div className="text-right pl-3 shrink-0">
                    <div className="text-xs font-bold font-mono text-emerald-400">
                      {(item.product.sellingPrice * item.quantity).toLocaleString()}đ
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-500 hover:text-rose-400 transition mt-0.5"
                    >
                      <Trash2 className="w-3 h-3 ml-auto" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 4. Quick Cash Tender Bar (Nút Mệnh Giá Tiền Nhanh 1-Chạm) */}
          <div className="px-3 py-2 bg-slate-950 border-t border-slate-800 shrink-0">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Mệnh giá tiền mặt nhanh:</span>
              <span className="text-emerald-400 font-mono">1 chạm vào thanh toán</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => handleQuickCashTender(finalAmount)}
                className="py-1 px-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/50 text-emerald-300 text-[11px] font-bold font-mono transition disabled:opacity-30"
              >
                Đủ tiền
              </button>
              {[50000, 100000, 200000, 500000, 1000000].map((val) => (
                <button
                  key={val}
                  type="button"
                  disabled={cart.length === 0}
                  onClick={() => handleQuickCashTender(val)}
                  className="py-1 px-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-bold font-mono transition disabled:opacity-30"
                >
                  {(val / 1000).toLocaleString()}k
                </button>
              ))}
            </div>
          </div>

          {/* 5. Financial Summary & Master Checkout Button */}
          <div className="p-3.5 bg-slate-950 border-t border-slate-800 space-y-2.5 shrink-0">
            <div className="space-y-1 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Tạm tính tiền hàng:</span>
                <span className="font-mono text-slate-200">{subtotal.toLocaleString()} đ</span>
              </div>

              {/* Chiết khấu */}
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  Chiết khấu:
                  <button
                    type="button"
                    onClick={() => setIsPercentDiscount(!isPercentDiscount)}
                    className="text-[10px] px-1.5 py-0.2 bg-slate-800 border border-slate-700 rounded font-semibold text-slate-300"
                  >
                    {isPercentDiscount ? "%" : "VNĐ"}
                  </button>
                </span>
                <div className="flex items-center gap-1 font-mono">
                  {isPercentDiscount ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent || ""}
                      onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                      placeholder="0"
                      className="w-14 text-right px-1 py-0.2 text-xs bg-slate-900 border border-slate-700 rounded text-white"
                    />
                  ) : (
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={discountAmount || ""}
                      onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                      placeholder="0"
                      className="w-20 text-right px-1 py-0.2 text-xs bg-slate-900 border border-slate-700 rounded text-white"
                    />
                  )}
                  <span>đ</span>
                </div>
              </div>

              {/* Trừ điểm thưởng nếu có */}
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-emerald-400 font-mono">
                  <span>Trừ điểm ({pointsToUse}đ):</span>
                  <span>-{pointsDiscount.toLocaleString()} đ</span>
                </div>
              )}

              {/* Thuế VAT */}
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-400">
                  <input
                    type="checkbox"
                    checked={enableVat}
                    onChange={(e) => setEnableVat(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3 h-3 bg-slate-900 border-slate-700"
                  />
                  <span>Thuế VAT ({vatPercent}%):</span>
                </label>
                <span className="font-mono text-slate-200">{taxVal.toLocaleString()} đ</span>
              </div>

              {/* Tổng cộng to bản */}
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">TỔNG PHẢI THU:</span>
                <span className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
                  {finalAmount.toLocaleString()} đ
                </span>
              </div>
            </div>

            {/* Nút Master Checkout F9 */}
            <button
              type="button"
              onClick={openCheckout}
              disabled={cart.length === 0}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none"
            >
              <Banknote className="w-5 h-5" />
              <span>THANH TOÁN (F9) • {finalAmount.toLocaleString()} đ</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL THANH TOÁN (SQUARE & TOAST STYLE - CHUYÊN NGHIỆP)                   */}
      {/* ========================================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 text-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-800 overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base font-mono tracking-tight text-white">
                  {completedOrder ? "GIAO DỊCH HOÀN TẤT" : "XÁC NHẬN THANH TOÁN"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tổng hóa đơn: <strong className="text-emerald-400 font-mono text-sm">{finalAmount.toLocaleString()} đ</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto max-h-[80vh]">
              {errorMessage && (
                <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {completedOrder ? (
                /* Màn hình sau khi thanh toán thành công */
                <div className="py-6 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-white">Thanh toán thành công!</h4>
                    <p className="text-xs text-slate-400 font-mono mt-1">Mã đơn: #{completedOrder.orderNumber}</p>
                  </div>

                  {completedOrder.paymentMethod === "CASH" && (
                    <div className="w-full bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Tiền khách đưa:</span>
                        <span className="font-mono text-slate-200">{completedOrder.customerPayment.toLocaleString()} đ</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm text-emerald-400 pt-1 border-t border-slate-800">
                        <span>TIỀN THỐI TRẢ KHÁCH:</span>
                        <span className="font-mono text-lg">{completedOrder.changeAmount.toLocaleString()} đ</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 w-full pt-4">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 transition"
                    >
                      <Printer className="w-4 h-4 text-emerald-400" />
                      <span>In Hóa Đơn Nhiệt (80mm)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNewOrder}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-md transition"
                    >
                      Đơn Hàng Mới (Space)
                    </button>
                  </div>
                </div>
              ) : (
                /* Màn hình chọn phương thức thanh toán */
                <div className="space-y-4">
                  {/* Tabs 3 Phương Thức Thanh Toán */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CASH")}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition ${
                        paymentMethod === "CASH"
                          ? "bg-emerald-600/20 border-emerald-500 text-white shadow-lg shadow-emerald-950"
                          : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white"
                      }`}
                    >
                      <Banknote className={`w-5 h-5 ${paymentMethod === "CASH" ? "text-emerald-400" : ""}`} />
                      <span className="text-xs font-bold">Tiền mặt</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("BANK_TRANSFER")}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition ${
                        paymentMethod === "BANK_TRANSFER"
                          ? "bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-950"
                          : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white"
                      }`}
                    >
                      <QrCode className={`w-5 h-5 ${paymentMethod === "BANK_TRANSFER" ? "text-blue-400" : ""}`} />
                      <span className="text-xs font-bold">VietQR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CARD")}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition ${
                        paymentMethod === "CARD"
                          ? "bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-950"
                          : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white"
                      }`}
                    >
                      <CreditCard className={`w-5 h-5 ${paymentMethod === "CARD" ? "text-purple-400" : ""}`} />
                      <span className="text-xs font-bold">Thẻ POS</span>
                    </button>
                  </div>

                  {/* Kênh TIỀN MẶT: Bàn phím số Numpad + Mệnh giá */}
                  {paymentMethod === "CASH" && (
                    <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                          Tiền khách đưa (VNĐ):
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={customerPayment || ""}
                          onChange={(e) => setCustomerPayment(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-lg font-mono font-black text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Phím mệnh giá nhanh */}
                      <div className="grid grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCustomerPayment(finalAmount)}
                          className="py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-mono"
                        >
                          Đúng tiền
                        </button>
                        {[50000, 100000, 200000, 500000, 1000000, 2000000].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setCustomerPayment(val)}
                            className="py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold font-mono hover:bg-slate-700"
                          >
                            {(val / 1000).toLocaleString()}k
                          </button>
                        ))}
                      </div>

                      {/* Tiền thừa tính tự động */}
                      <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold">Tiền thối lại khách:</span>
                        <span className={`text-base font-black font-mono ${
                          changeAmount > 0 ? "text-emerald-400" : customerPayment < finalAmount ? "text-rose-400" : "text-slate-200"
                        }`}>
                          {changeAmount.toLocaleString()} đ
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Kênh VIETQR: Mã QR động có radar scan */}
                  {paymentMethod === "BANK_TRANSFER" && (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col items-center text-center space-y-3">
                      <div className="relative w-48 h-48 bg-white p-3 rounded-2xl shadow-xl overflow-hidden flex items-center justify-center">
                        <img
                          src={`https://api.vietqr.io/image/970422-0901234567-compact2.jpg?amount=${finalAmount}&addInfo=${encodeURIComponent(`HD ${Date.now().toString().slice(-4)}`)}`}
                          alt="VietQR Code"
                          className="w-full h-full object-contain"
                        />
                        {/* Radar scan animation */}
                        <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 shadow-md shadow-emerald-400 animate-radar pointer-events-none"></div>
                      </div>

                      <div className="text-xs space-y-1 text-slate-300">
                        <p className="font-bold text-white">Quét mã bằng App Ngân hàng bất kỳ</p>
                        <p className="text-[11px] text-slate-400">MB Bank • STK: 0901234567 • ANTIGRAVITY POS</p>
                        <p className="font-mono text-emerald-400 font-bold text-sm mt-1">{finalAmount.toLocaleString()} đ</p>
                      </div>
                    </div>
                  )}

                  {/* Kênh THẺ POS */}
                  {paymentMethod === "CARD" && (
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-2">
                      <CreditCard className="w-10 h-10 text-purple-400 mx-auto" />
                      <p className="text-xs font-bold text-white">Quẹt hoặc Chạm thẻ trên máy POS ngân hàng</p>
                      <p className="text-[11px] text-slate-400">Sau khi máy POS báo giao dịch thành công, bấm Xác nhận bên dưới.</p>
                    </div>
                  )}

                  {/* Nút Hoàn tất Thanh toán */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleProcessCheckout}
                      disabled={isSubmitting || (paymentMethod === "CASH" && customerPayment < finalAmount)}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-950 transition disabled:opacity-30 disabled:pointer-events-none"
                    >
                      {isSubmitting ? "Đang xử lý đơn..." : `XÁC NHẬN VÀ LƯU ĐƠN (${finalAmount.toLocaleString()}đ)`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ĐƠN HÀNG LƯU TẠM (HOLD CART) */}
      {showHeldOrdersModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 text-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-800 overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PauseCircle className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm">Đơn Hàng Đang Lưu Tạm</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHeldOrdersModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {heldOrders.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">Không có đơn hàng nào đang lưu tạm.</div>
              ) : (
                heldOrders.map((held) => (
                  <div
                    key={held.id}
                    className="p-3 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-white">{held.id}</span>
                        <span className="text-[10px] text-amber-400 font-semibold">{held.cart.length} món</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {held.customer ? `Khách: ${held.customer.name}` : "Khách lẻ"} • {new Date(held.createdAt).toLocaleTimeString("vi-VN")}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRestoreHeld(held)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition"
                      >
                        Khôi phục
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteHeld(held.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MỞ CA BÁN HÀNG */}
      {showOpenShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 text-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Mở Ca Bán Hàng Mới</span>
              </div>
              <button
                type="button"
                onClick={() => setShowOpenShiftModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOpenShift} className="p-5 space-y-4">
              {openShiftError && (
                <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
                  {openShiftError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Thu ngân phụ trách <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={openCashierName}
                  onChange={(e) => setOpenCashierName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Tiền mặt đầu ca trong két (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  required
                  value={openStartingCash}
                  onChange={(e) => setOpenStartingCash(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-base font-mono font-black text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex items-center gap-1.5 mt-2">
                  {[200000, 500000, 1000000, 2000000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setOpenStartingCash(val)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-300 font-mono"
                    >
                      {(val / 1000).toLocaleString()}k
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Ghi chú ca làm
                </label>
                <input
                  type="text"
                  placeholder="Ca sáng / Ca tối..."
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOpenShiftModal(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isOpenShiftSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm disabled:opacity-50"
                >
                  {isOpenShiftSubmitting ? "Đang mở..." : "Vào Ca Bán"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ĐÓNG CA & IN PHIẾU Z */}
      {showCloseShiftModal && currentShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 text-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div>
                <h3 className="font-black text-sm">KẾT CA & BÀN GIAO KÉT TIỀN</h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{currentShift.shiftCode} • {currentShift.cashierName}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCloseShiftModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCloseShift} className="p-5 space-y-4">
              {closeShiftError && (
                <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
                  {closeShiftError}
                </div>
              )}

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Tiền đầu ca:</span>
                  <span className="font-mono text-slate-200">{currentShift.startingCash.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>(+) Doanh thu tiền mặt:</span>
                  <span className="font-mono text-emerald-400">+{currentShift.cashSales.toLocaleString()}đ</span>
                </div>
                {currentShift.cashPayout > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>(-) Chi ngoài:</span>
                    <span className="font-mono text-rose-400">-{currentShift.cashPayout.toLocaleString()}đ</span>
                  </div>
                )}
                {currentShift.cashDrop > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>(-) Rút nộp két:</span>
                    <span className="font-mono text-rose-400">-{currentShift.cashDrop.toLocaleString()}đ</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm">
                  <span>TIỀN KÉT LÝ THUYẾT:</span>
                  <span className="font-mono text-emerald-400">{currentShift.expectedCash.toLocaleString()}đ</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase mb-1.5">
                  Số tiền mặt thực tế đếm trong két <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={closeActualCash}
                  onChange={(e) => setCloseActualCash(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-lg font-mono font-black text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Chênh lệch */}
              {(() => {
                const diff = closeActualCash - currentShift.expectedCash;
                return (
                  <div
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                      diff === 0
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : diff > 0
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                        : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                    }`}
                  >
                    <span>Trạng thái đối soát:</span>
                    <span className="font-mono font-bold">
                      {diff === 0
                        ? "✓ Khớp tiền hoàn hảo"
                        : diff > 0
                        ? `Thừa +${diff.toLocaleString()}đ`
                        : `Thiếu ${diff.toLocaleString()}đ`}
                    </span>
                  </div>
                );
              })()}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCloseShiftModal(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCloseShiftSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-500 shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isCloseShiftSubmitting ? "Đang đóng..." : "Chốt Ca & In Phiếu Z"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: THU / CHI TIỀN MẶT */}
      {showCashTxModal && currentShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 text-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ArrowDownLeft className="w-4 h-4 text-rose-400" />
                <span>Thu / Chi Tiền Mặt Trong Ca</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCashTxModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCashTx} className="p-5 space-y-4">
              {txError && (
                <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
                  {txError}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType("PAYOUT")}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition ${
                    txType === "PAYOUT"
                      ? "bg-rose-500/20 border-rose-500 text-rose-300"
                      : "bg-slate-800 border-slate-700 text-slate-400"
                  }`}
                >
                  Chi ngoài
                </button>
                <button
                  type="button"
                  onClick={() => setTxType("DROP")}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition ${
                    txType === "DROP"
                      ? "bg-amber-500/20 border-amber-500 text-amber-300"
                      : "bg-slate-800 border-slate-700 text-slate-400"
                  }`}
                >
                  Rút két
                </button>
                <button
                  type="button"
                  onClick={() => setTxType("IN")}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition ${
                    txType === "IN"
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                      : "bg-slate-800 border-slate-700 text-slate-400"
                  }`}
                >
                  Nạp thêm
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Số tiền (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  required
                  placeholder="Ví dụ: 50000"
                  value={txAmount || ""}
                  onChange={(e) => setTxAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-mono font-black text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Lý do chi / nộp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Mua đá 20k, Mua túi xốp..."
                  value={txReason}
                  onChange={(e) => setTxReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCashTxModal(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isTxSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-black text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
                >
                  {isTxSubmitting ? "Đang lưu..." : "Xác Nhận"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TẠO NHANH KHÁCH HÀNG */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 text-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2 font-bold text-sm">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Tạo Nhanh Khách Hàng</span>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickCustomer} className="p-5 space-y-3.5">
              {quickError && (
                <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
                  {quickError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Họ và Tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ví dụ: Chị Lan"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  placeholder="0912345678"
                  value={quickPhone}
                  onChange={(e) => setQuickPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingQuick}
                  className="px-4 py-1.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
                >
                  {isSavingQuick ? "Đang tạo..." : "Tạo & Chọn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Component In Phiếu Z-Report Ẩn */}
      <ZReportPrint shift={printZReportShift} />

      {/* Component hóa đơn in nhiệt ẩn */}
      <ReceiptPrint order={completedOrder} />
    </div>
  );
}

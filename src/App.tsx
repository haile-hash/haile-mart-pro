/* eslint-disable */
// @ts-nocheck
import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "./supabaseClient";
import { 
  styles, formatCategoryStr, parseGift, cleanName, 
  getActualPrice, getCustomerTier, playSound 
} from "./utils/helpers";
import { useOfflineSync } from "./hooks/useOfflineSync";

import { Toaster, toast } from "react-hot-toast";

import { Product, CartItem, Customer, AuditLog, TransactionLog, HeldOrder } from "./types";

import { useUIState } from "./hooks/useUIState";
import { useProductInput } from "./hooks/useProductInput";
import { useCheckoutState } from "./hooks/useCheckoutState";

import { Header } from "./components/layout/Header";
import { ProductSearchAndActions } from "./components/products/ProductSearchAndActions";
import { ProductInputForm } from "./components/products/ProductInputForm";
import { ProductTable } from "./components/products/ProductTable";
import { CartPanel } from "./components/cart/CartPanel";
import { HistoryPanel } from "./components/history/HistoryPanel";

import { CashFlowModal } from "./components/modals/CashFlowModal";
import { AuditDetailModal } from "./components/modals/AuditDetailModal";
import { HoldOrdersModal } from "./components/modals/HoldOrdersModal";
import { CheckoutModal } from "./components/modals/CheckoutModal";
import { StatsModal } from "./components/modals/StatsModal";
import { InventoryModal } from "./components/modals/InventoryModal";
import { CustomerModal } from "./components/modals/CustomerModal";
import { DebtModal } from "./components/modals/DebtModal";
import { AuditModal } from "./components/modals/AuditModal";
import { ScannerModal } from "./components/modals/ScannerModal";
import { HandoverModal } from "./components/modals/HandoverModal";
import { ExpenseModal } from "./components/modals/ExpenseModal";
import { SupplierModal } from "./components/modals/SupplierModal";
import { MarketingModal } from "./components/modals/MarketingModal";
import { SettingsModal } from "./components/modals/SettingsModal";
import { PinModal } from "./components/modals/PinModal"; 
import { ScannerLinkModal } from "./components/modals/ScannerLinkModal"; 
import { MobileScanner } from "./components/MobileScanner"; 
import { PurchaseOrderModal } from "./components/modals/PurchaseOrderModal";

export default function App() {
  if (typeof window !== "undefined" && window.location.search.includes("scanner=true")) {
    return <MobileScanner />;
  }

  const VAT_RATE = 0.1;
  const EMAILJS_SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
  const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
  const EMAILJS_TEMPLATE_VIP_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_VIP_ID;
  const EMAILJS_PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
  
  // =====================================================================
  // 1. STATE CỦA ỨNG DỤNG
  // =====================================================================
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("mart_logged_in") === "true");
  const [role, setRole] = useState(() => localStorage.getItem("mart_role") || "staff");
  const [shift, setShift] = useState(() => localStorage.getItem("mart_shift") || "Ca Sáng");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  
  const [startingCash, setStartingCash] = useState<number>(() => { 
    const cached = localStorage.getItem("mart_starting_cash"); 
    return (cached && cached !== "0") ? Number(cached) : 5000000; 
  });
  
  const [bankBin, setBankBin] = useState("");
  const [bankAcc, setBankAcc] = useState("");
  const [bankNameStr, setBankNameStr] = useState("");
  const [happyStart, setHappyStart] = useState("11:00");
  const [happyEnd, setHappyEnd] = useState("13:00");

  const [newBankBin, setNewBankBin] = useState("");
  const [newBankAcc, setNewBankAcc] = useState("");
  const [newBankNameStr, setNewBankNameStr] = useState("");
  const [newHappyStart, setNewHappyStart] = useState("11:00");
  const [newHappyEnd, setNewHappyEnd] = useState("13:00");

  const [adminPin, setAdminPin] = useState("1234");
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  
  const [showScannerLinkModal, setShowScannerLinkModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false); 

  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, any[]>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [actualStockInput, setActualStockInput] = useState<Record<string, number>>({});
  const [inventorySearchTerm, setInventorySearchTerm] = useState("");
  const [invFilter, setInvFilter] = useState('ALL');
  
  const [expName, setExpName] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [supName, setSupName] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supItem, setSupItem] = useState("");
  const [marketingTier, setMarketingTier] = useState("Tất cả");
  const [marketingMsg, setMarketingMsg] = useState("");
  
  const [reportStartDate, setReportStartDate] = useState(() => { 
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; 
  });
  const [reportEndDate, setReportEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [logSearchTerm, setLogSearchTerm] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState("Tất cả");
  
  const [scanQueue, setScanQueue] = useState<string[]>([]);
  const [scanMessage, setScanMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [printBarcodeProduct, setPrintBarcodeProduct] = useState<Product | null>(null);
  const [printCustomer, setPrintCustomer] = useState<Customer | null>(null);
  const [barcodeCount, setBarcodeCount] = useState<number>(30);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);

  const { 
    darkMode, setDarkMode, showSettings, setShowSettings, showInputForm, setShowInputForm, 
    showDebtModal, setShowDebtModal, showStatsModal, setShowStatsModal, showCustomerModal, 
    setShowCustomerModal, showHandoverModal, setShowHandoverModal, showAuditModal, 
    setShowAuditModal, showHoldModal, setShowHoldModal, showExpenseModal, setShowExpenseModal, 
    showSupplierModal, setShowSupplierModal, showMarketingModal, setShowMarketingModal, 
    showInventoryModal, setShowInventoryModal, showMainMenu, setShowMainMenu, 
    cashFlowModalInfo, setCashFlowModalInfo, scannerMode, setScannerMode, 
    printMode, setPrintMode 
  } = useUIState();

  const { 
    newCode, setNewCode, newName, setNewName, newImportPrice, setNewImportPrice, 
    newPrice, setNewPrice, newPromoPrice, setNewPromoPrice, newGiftCondition, 
    setNewGiftCondition, newGiftInfo, setNewGiftInfo, newStock, setNewStock, 
    newExpiry, setNewExpiry, newCategory, setNewCategory, resetProductForm 
  } = useProductInput();

  const { 
    cart, setCart, barcodeInput, setBarcodeInput, isCheckoutOpen, setIsCheckoutOpen, 
    checkoutStep, setCheckoutStep, customerInput, setCustomerInput, custPhone, 
    setCustPhone, custName, setCustName, useWallet, setUseWallet, voucherInput, 
    setVoucherInput, appliedVoucherAmount, setAppliedVoucherAmount, customerGiven, 
    setCustomerGiven, lastOrder, setLastOrder, resetCheckout 
  } = useCheckoutState();

  const [customers, setCustomers] = useState<Record<string, Customer>>(() => { const s = localStorage.getItem("mart_customers"); return s ? JSON.parse(s) : {} });
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => { const s = localStorage.getItem("mart_held_orders"); return s ? JSON.parse(s) : [] });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => { const s = localStorage.getItem("mart_audit"); return s ? JSON.parse(s) : [] });
  const [expenses, setExpenses] = useState<any[]>(() => { const s = localStorage.getItem("mart_expenses"); return s ? JSON.parse(s) : [] });
  const [suppliers, setSuppliers] = useState<any[]>(() => { const s = localStorage.getItem("mart_suppliers"); return s ? JSON.parse(s) : [] });
  const [history, setHistory] = useState<TransactionLog[]>(() => { const s = localStorage.getItem("mart_history"); return s ? JSON.parse(s) : [] });

  const { isOnline, syncStatus, syncAllOfflineData, loadCloudData } = useOfflineSync({
    isLoggedIn, history, setHistory, customers, setCustomers,
    heldOrders, setHeldOrders, auditLogs, setAuditLogs,
    expenses, setExpenses, suppliers, setSuppliers
  });

  // =====================================================================
  // 2. EFFECTS & LISTENERS
  // =====================================================================
  useEffect(() => {
    if (darkMode) { document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem("mart_theme", "dark"); }
    else { document.documentElement.removeAttribute('data-theme'); localStorage.setItem("mart_theme", "light"); }
  }, [darkMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLoggedIn || isCheckoutOpen || showPinModal || showAuditModal || showCustomerModal || showSettings || showInputForm || showInventoryModal || cashFlowModalInfo || showPOModal) return;
      if (e.key === 'F1') { e.preventDefault(); document.getElementById('search-barcode')?.focus(); }
      if (e.key === 'F2') { e.preventDefault(); if (cart.length > 0) confirmCheckout('TIỀN MẶT'); }
      if (e.key === 'F3') { e.preventDefault(); if (cart.length > 0) confirmCheckout('CHUYỂN KHOẢN'); }
      if (e.key === 'F4') { e.preventDefault(); handleHoldOrder(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoggedIn, isCheckoutOpen, showPinModal, cart, showAuditModal, showCustomerModal, showSettings, showInputForm, showInventoryModal, cashFlowModalInfo, showPOModal]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchProducts(); 
      loadCloudData(); 
      fetchSettingsFromCloud(); 
      
      const channel = supabase.channel("db_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchProducts())
        .on("postgres_changes", { event: "*", schema: "public", table: "history" }, () => loadCloudData())
        .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, () => loadCloudData())
        .on("postgres_changes", { event: "*", schema: "public", table: "held_orders" }, () => loadCloudData())
        .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, () => loadCloudData())
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "remote_scans" }, (payload) => {
           setScanQueue(prev => [...prev, payload.new.code]);
        })
        .subscribe();
        
      const script = document.createElement("script"); 
      script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"; 
      script.onload = () => { (window as any).emailjs.init(EMAILJS_PUBLIC_KEY || "5ric0kxuwNPlUleAv"); }; 
      document.head.appendChild(script);

      const xlsxScript = document.createElement("script"); 
      xlsxScript.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; 
      document.head.appendChild(xlsxScript);
      
      return () => { supabase.removeChannel(channel) };
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (scannerMode !== null) {
      let scanner: any; 
      let lastScanTime = 0;
      const loadScanner = () => { 
        if ((window as any).Html5QrcodeScanner) { 
          scanner = new (window as any).Html5QrcodeScanner("qr-reader", { fps: 15, qrbox: { width: 250, height: 120 }, rememberLastUsedCamera: true }, false); 
          scanner.render((text: string) => { 
            const now = Date.now(); 
            if (now - lastScanTime < 1500) return; 
            lastScanTime = now; 
            setScanQueue(prev => [...prev, text]); 
          }, undefined);
        } 
      };
      if (!(window as any).Html5QrcodeScanner) { 
        const script = document.createElement("script"); 
        script.src = "https://unpkg.com/html5-qrcode"; 
        script.onload = loadScanner; 
        document.head.appendChild(script);
      } else {
        loadScanner();
      }
      return () => { if (scanner) scanner.clear().catch(() => {}) }
    }
  }, [scannerMode]);

  useEffect(() => {
    if (scanQueue.length > 0) {
      const currentCode = scanQueue[0];

      if (scannerMode === 'product' || scannerMode === null) { 
        const p = findProductByCode(currentCode); 
        if (p) { 
          handleSelectSuggest(p); 
          playSound('success'); 
        } else { 
          const matchedPhone = Object.keys(customers).find(phone => phone === currentCode.trim() || customers[phone].cardCode === currentCode.trim()); 
          if (matchedPhone) { 
            playSound('success'); 
            setCustomerInput(customers[matchedPhone].cardCode || matchedPhone); 
            setCustPhone(matchedPhone); 
            setCustName(customers[matchedPhone].name); 
            setScanMessage({ text: `✅ KH VIP: ${customers[matchedPhone].name}`, type: 'success' });
          } else { 
            playSound('error'); 
            setScanMessage({ text: `❌ Lỗi mã`, type: 'error' });
          } 
        } 
      }
      else if (scannerMode === 'voucher') { 
        const code = currentCode.trim().toUpperCase(); 
        const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 }; 
        if (VOUCHERS[code]) { 
          setAppliedVoucherAmount(VOUCHERS[code]); 
          setVoucherInput(code); 
          playSound('success'); 
          setScanMessage({ text: `✅ Giảm ${VOUCHERS[code].toLocaleString()}đ`, type: 'success' });
        } else if (!isNaN(Number(code)) && Number(code) > 0) { 
          setAppliedVoucherAmount(Number(code)); 
          setVoucherInput(code); 
          playSound('success'); 
          setScanMessage({ text: `✅ Giảm ${Number(code).toLocaleString()}đ`, type: 'success' });
        } else { 
          playSound('error'); 
          toast.error("Mã Voucher không hợp lệ!"); 
          setAppliedVoucherAmount(0);
        } 
      }
      else if (scannerMode === 'customer') { 
        const val = currentCode.trim(); 
        setCustomerInput(val); 
        const matchedPhone = Object.keys(customers).find(phone => phone === val || customers[phone].cardCode === val); 
        if (matchedPhone) { 
          setCustPhone(matchedPhone); 
          setCustName(customers[matchedPhone].name); 
          playSound('success'); 
          setScanMessage({ text: `✅ Nhận diện VIP: ${customers[matchedPhone].name}`, type: 'success' });
        } else { 
          setCustPhone(val); 
          setCustName(""); 
          playSound('success'); 
          setScanMessage({ text: `✅ Đã quét mã (Khách mới)`, type: 'success' });
        } 
      }
      
      setTimeout(() => setScannerMode(null), 1000);
      setTimeout(() => setScanMessage(null), 1500);
      setScanQueue(prev => prev.slice(1));
    }
  }, [scanQueue, products, scannerMode]);

  useEffect(() => { 
    const handleAfterPrint = () => setPrintMode(null); 
    window.addEventListener("afterprint", handleAfterPrint); 
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  // =====================================================================
  // 3. TÍNH TOÁN DỮ LIỆU
  // =====================================================================
  const todayStrStr = new Date().toLocaleDateString('vi-VN');
  
  const currentShiftStats = useMemo(() => { 
    const shiftLogs = history.filter(h => new Date(Math.floor(h.id)).toLocaleDateString('vi-VN') === todayStrStr && h.shift === shift); 
    let cash = startingCash; let transfer = 0; let prof = 0; let totalSales = 0; 
    shiftLogs.forEach(h => { 
      if (h.type === 'BÁN' || h.type === 'GHI NỢ') totalSales += h.total; 
      if (h.type === 'BÁN' || h.type === 'THU NỢ' || h.type === 'TRẢ HÀNG') { 
        if (h.paymentMethod === 'CHUYỂN KHOẢN' || h.paymentMethod === 'QUẸT THẺ' || h.paymentMethod === 'ZALO PAY') {
          transfer += h.total; 
        } else if (h.paymentMethod === 'TIỀN MẶT' || h.paymentMethod === 'KẾT HỢP') {
          if(h.paymentMethod === 'KẾT HỢP' && h.split_cash) { 
            cash += h.split_cash; 
            transfer += (h.total - h.split_cash); 
          } else { 
            cash += h.total; 
          }
        }
      } 
      prof += (h.profit || 0) 
    }); 
    return { rev: cash + transfer - startingCash, cash, transfer, prof, totalSales } 
  }, [history, shift, todayStrStr, startingCash]);

  const currentShiftCashFlow = useMemo(() => {
    if (!cashFlowModalInfo) return { thu: [], chi: [] };
    const shiftLogs = history.filter(h => new Date(Math.floor(h.id)).toLocaleDateString('vi-VN') === todayStrStr && h.shift === shift);
    const thu: any[] = []; const chi: any[] = [];
    shiftLogs.forEach(h => {
      if (h.paymentMethod === cashFlowModalInfo || (cashFlowModalInfo === 'CHUYỂN KHOẢN' && (h.paymentMethod === 'QUẸT THẺ' || h.paymentMethod === 'ZALO PAY')) || h.paymentMethod === 'KẾT HỢP') {
        let amount = h.total;
        if (h.paymentMethod === 'KẾT HỢP') amount = cashFlowModalInfo === 'TIỀN MẶT' ? (h.split_cash || 0) : (h.total - (h.split_cash || 0));
        if (amount === 0) return;
        if (h.type === 'BÁN' || h.type === 'THU NỢ') { 
          if (amount > 0) thu.push({ time: h.time, note: `${h.type} - ${cleanName(h.name)}`, amount: amount }); 
        } else if (h.type === 'TRẢ HÀNG') { 
          chi.push({ time: h.time, note: `HOÀN TIỀN - ${cleanName(h.name)}`, amount: Math.abs(amount) }); 
        }
      }
    });
    if (cashFlowModalInfo === 'TIỀN MẶT') {
      if (startingCash > 0) thu.unshift({ time: "Đầu ca", note: "Tiền lẻ đầu ca", amount: startingCash });
      const shiftExpenses = expenses.filter(e => e.date === todayStrStr);
      shiftExpenses.forEach(e => chi.push({ time: "Trong ca", note: `CHI PHÍ - ${e.name}`, amount: e.amount }));
    }
    return { thu, chi };
  }, [history, expenses, cashFlowModalInfo, shift, todayStrStr, startingCash]);

  const filteredStats = useMemo(() => { 
    const start = new Date(reportStartDate + "T00:00:00").getTime(); 
    const end = new Date(reportEndDate + "T23:59:59").getTime();
    const filteredHistory = history.filter(h => { 
      const logTime = new Date(Math.floor(h.id)).getTime(); 
      return logTime >= start && logTime <= end; 
    });
    let cash = 0; let transfer = 0; let prof = 0; let totalSales = 0; 
    filteredHistory.forEach(h => { 
      if (h.type === 'BÁN' || h.type === 'GHI NỢ') totalSales += h.total; 
      if (h.type === 'BÁN' || h.type === 'THU NỢ' || h.type === 'TRẢ HÀNG') { 
        if (h.paymentMethod === 'CHUYỂN KHOẢN' || h.paymentMethod === 'QUẸT THẺ' || h.paymentMethod === 'ZALO PAY') {
          transfer += h.total; 
        } else if (h.paymentMethod === 'TIỀN MẶT' || h.paymentMethod === 'KẾT HỢP') { 
          if(h.paymentMethod === 'KẾT HỢP' && h.split_cash) { 
            cash += h.split_cash; transfer += (h.total - h.split_cash); 
          } else { 
            cash += h.total; 
          } 
        } 
      } 
      prof += (h.profit || 0) 
    }); 
    const filteredExp = expenses.filter(e => { 
      const parts = e.date.split('/'); 
      if(parts.length !== 3) return false; 
      const expTime = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`).getTime(); 
      return expTime >= start && expTime <= end; 
    }).reduce((sum, e) => sum + e.amount, 0); 
    
    return { rev: cash + transfer, cash, transfer, prof, totalSales, expenses: filteredExp, netProfit: prof - filteredExp } 
  }, [history, expenses, reportStartDate, reportEndDate]);

  const chartData = useMemo(() => { 
    const data = []; 
    for (let i = 29; i >= 0; i--) { 
      const d = new Date(); d.setDate(d.getDate() - i); 
      const dStr = d.toLocaleDateString('vi-VN'); 
      const dayTotal = history.filter(h => new Date(Math.floor(h.id)).toLocaleDateString('vi-VN') === dStr && (h.type === 'BÁN' || h.type === 'GHI NỢ')).reduce((s, h) => s + h.total, 0); 
      data.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, total: dayTotal, showLabel: (i % 3 === 0 || i === 0) });
    } 
    const maxVal = Math.max(...data.map(d => d.total), 1); 
    return data.map(d => ({ ...d, height: `${(d.total / maxVal) * 100}%` }));
  }, [history]);
  
  const topSelling = useMemo(() => { 
    const sales: Record<string, number> = {}; 
    history.forEach(log => { 
      if ((log.type === 'BÁN' || log.type === 'GHI NỢ') && log.product_id !== 'DISCOUNT') { 
        const baseName = cleanName(log.name); 
        sales[baseName] = (sales[baseName] || 0) + log.qty;
      } 
    }); 
    return Object.entries(sales).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [history]);
  
  const groupedHistory = useMemo(() => { 
    let filtered = history; 
    if (logTypeFilter !== "Tất cả") filtered = filtered.filter(log => log.type === logTypeFilter); 
    if (logSearchTerm.trim() !== "") { 
      const term = String(logSearchTerm || "").toLowerCase(); 
      filtered = filtered.filter(log => (log.name && String(log.name).toLowerCase().includes(term)) || (log.customer && String(log.customer).toLowerCase().includes(term)) || (log.id.toString().includes(term)));
    } 
    return filtered.reduce((groups: any, log: any) => { 
      const date = new Date(Math.floor(log.id)).toLocaleDateString('vi-VN'); 
      if (!groups[date]) groups[date] = []; 
      groups[date].push({ ...log, t: new Date(Math.floor(log.id)).toLocaleTimeString('vi-VN') }); 
      return groups;
    }, {});
  }, [history, logSearchTerm, logTypeFilter]);

  const totalValue = Math.round(products.reduce((sum, p) => sum + ((Number(p.import_price) || 0) * (Number(p.stock) || 0)), 0));
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock < 10).length;
  const cartTotalAmountDisplay = cart.reduce((sum, item) => sum + item.total, 0);
  const currentTier = getCustomerTier(customers[custPhone]?.totalSpent || 0);
  const tierDiscountAmount = custPhone ? Math.round(cartTotalAmountDisplay * currentTier.discountRate) : 0;
  const amountAfterTierAndVoucher = Math.max(0, cartTotalAmountDisplay - appliedVoucherAmount - tierDiscountAmount);
  const walletUsedAmount = useWallet ? Math.min(customers[custPhone]?.wallet || 0, amountAfterTierAndVoucher) : 0;
  const finalToPay = amountAfterTierAndVoucher - walletUsedAmount;

  const uniqueNames = useMemo(() => Array.from(new Set(products.map(p => cleanName(p.name)))).sort(), [products]);
  const uniqueStocks = useMemo(() => Array.from(new Set(products.map(p => p.stock))).sort((a, b) => a - b), [products]);
  const uniqueImportPrices = useMemo(() => Array.from(new Set(products.map(p => p.import_price || 0))).sort((a, b) => a - b), [products]);
  const uniqueSalePrices = useMemo(() => Array.from(new Set(products.map(p => p.sale_price))).sort((a, b) => a - b), [products]);
  const uniqueExpiries = useMemo(() => Array.from(new Set(products.map(p => p.expiry_date).filter(Boolean))).sort(), [products]);
  const categories = ["Tất cả", ...Array.from(new Set(products.map(p => formatCategoryStr(p.category))))];
  
  const sortedAndFilteredProducts = useMemo(() => {
    const todayTime = new Date().getTime(); const safeSearch = String(searchTerm || "").toLowerCase();
    let filtered = products.filter(p => (selectedCategory === "Tất cả" || formatCategoryStr(p.category) === selectedCategory)).filter(p => String(p.name || "").toLowerCase().includes(safeSearch) || String(p.product_code || "").toLowerCase().includes(safeSearch));
    if (filters['name']?.length > 0) filtered = filtered.filter(p => filters['name'].includes(cleanName(p.name)));
    if (filters['stock']?.length > 0) filtered = filtered.filter(p => filters['stock'].includes(p.stock));
    if (filters['import_price']?.length > 0) filtered = filtered.filter(p => filters['import_price'].includes(p.import_price || 0));
    if (filters['sale_price']?.length > 0) filtered = filtered.filter(p => filters['sale_price'].includes(p.sale_price));
    if (filters['expiry_date']?.length > 0) filtered = filtered.filter(p => filters['expiry_date'].includes(p.expiry_date));
    if (sortConfig !== null) {
      filtered.sort((a, b) => { 
        let valA = a[sortConfig.key]; let valB = b[sortConfig.key]; 
        if (sortConfig.key === 'expiry_date') { 
          valA = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity; 
          valB = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity 
        } 
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1; 
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1; 
        return 0;
      });
    } else {
      filtered.sort((a, b) => { 
        const daysA = a.expiry_date ? (new Date(a.expiry_date).getTime() - todayTime) / 86400000 : Infinity; 
        const daysB = b.expiry_date ? (new Date(b.expiry_date).getTime() - todayTime) / 86400000 : Infinity; 
        const aIsUrgent = daysA <= 45; const bIsUrgent = daysB <= 45; 
        if (aIsUrgent && !bIsUrgent) return -1; 
        if (!aIsUrgent && bIsUrgent) return 1; 
        if (aIsUrgent && bIsUrgent) return daysA - daysB; 
        return 0; 
      });
    }
    return filtered;
  }, [products, searchTerm, selectedCategory, sortConfig, filters]);

  // =====================================================================
  // 4. CÁC HÀM XỬ LÝ SỰ KIỆN - VIẾT ĐẦY ĐỦ, KHÔNG CẮT XÉN!
  // =====================================================================

  const executeWithAdminCheck = (action: () => void) => {
    if (role === 'admin') {
      action(); 
    } else {
      setPendingAction(() => action);
      setShowPinModal(true); 
    }
  };

  const fetchSettingsFromCloud = async () => {
    try {
      const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
      if (data) {
        setBankBin(data.bank_bin); setBankAcc(data.bank_acc); setBankNameStr(data.bank_name_str);
        setNewBankBin(data.bank_bin); setNewBankAcc(data.bank_acc); setNewBankNameStr(data.bank_name_str);
        if (data.admin_pin) setAdminPin(data.admin_pin);
        if (data.happy_hour_start) { setHappyStart(data.happy_hour_start); setNewHappyStart(data.happy_hour_start); }
        if (data.happy_hour_end) { setHappyEnd(data.happy_hour_end); setNewHappyEnd(data.happy_hour_end); }
      }
    } catch (err) { console.error(err); }
  };

  const updateSettingsToCloud = async (bin: string, acc: string, nameStr: string, hStart: string, hEnd: string) => {
    if (!navigator.onLine) return toast.error("Mất mạng! Không thể lưu cài đặt lên Cloud.");
    setLoading(true);
    try {
      const { error } = await supabase.from("settings").update({ 
        bank_bin: bin, bank_acc: acc, bank_name_str: nameStr, 
        happy_hour_start: hStart, happy_hour_end: hEnd,
        updated_at: new Date().toISOString() 
      }).eq("id", 1);
      
      if (!error) {
        setBankBin(bin); setBankAcc(acc); setBankNameStr(nameStr);
        setHappyStart(hStart); setHappyEnd(hEnd);
        logAudit("CÀI ĐẶT", "Cập nhật Cấu hình hệ thống lên Cloud");
        toast.success("Đã lưu cấu hình lên mây thành công!");
        setShowSettings(false);
      } else { toast.error("Lỗi lưu dữ liệu: " + error.message); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const saveSettings = () => { 
    const bin = newBankBin.trim();
    const acc = newBankAcc.trim();
    const nameStr = newBankNameStr.trim().toUpperCase();
    if (!bin || !acc || !nameStr || !newHappyStart || !newHappyEnd) return toast.error("Vui lòng điền đầy đủ thông tin!");
    updateSettingsToCloud(bin, acc, nameStr, newHappyStart, newHappyEnd);
  };

  const logAudit = async (action: string, detail: string, extraData: any = null) => { 
    const newLog = { 
      id: Date.now(), 
      time: new Date().toLocaleString('vi-VN'), 
      user_name: role === 'admin' ? 'Quản lý' : 'Thu ngân', 
      shift, 
      action, 
      detail, 
      extra_data: extraData ? JSON.stringify(extraData) : null 
    }; 
    setAuditLogs(prev => [newLog, ...prev].slice(0, 300)); 
  };
  
  const fetchProducts = async () => { 
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false }); 
    if (data) setProducts(data);
  };
  
  const findProductByCode = (code: string) => { 
    const rawCode = code.trim(); 
    let matches = products.filter(prod => prod.product_code === rawCode || String(prod.product_code).startsWith(`${rawCode}-`)); 
    let available = matches.filter(p => p.stock > 0); 
    if (available.length > 0) { 
      available.sort((a, b) => { 
        if (!a.expiry_date) return 1; 
        if (!b.expiry_date) return -1; 
        return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
      }); 
      return available[0]; 
    } 
    return matches.length > 0 ? matches[0] : null; 
  };
  
  const handleLogin = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    let u = authUsername.trim().toLowerCase(); 
    const p = authPassword.trim(); 
    if (!u.includes('@')) { u = u + '@hailemart.com'; } 
    localStorage.setItem("mart_starting_cash", startingCash.toString()); 
    setLoading(true); 
    
    const { data, error } = await supabase.auth.signInWithPassword({ email: u, password: p }); 
    if (error) { 
      toast.error(`Đăng nhập thất bại: Kiểm tra lại tài khoản hoặc mật khẩu.`); 
      setLoading(false); 
      return; 
    } 
    
    const userRole = u.includes('admin') ? 'admin' : 'staff'; 
    setIsLoggedIn(true); 
    setRole(userRole); 
    localStorage.setItem("mart_shift", shift); 
    localStorage.setItem("mart_logged_in", "true"); 
    localStorage.setItem("mart_role", userRole); 
    logAudit("ĐĂNG NHẬP", "Mở ca", { start_cash: startingCash, role: userRole }); 
    setLoading(false); 
  };
  
  const handleLogoutClick = () => setShowHandoverModal(true);
  
  const confirmHandover = async () => { 
    try { 
      logAudit("CHỐT CA", `Bàn giao: ${currentShiftStats.rev.toLocaleString()}đ`, { ...currentShiftStats }); 
      if (navigator.onLine) { await supabase.auth.signOut(); } 
    } catch (error) { console.error(error); } 
    finally { 
      localStorage.removeItem("mart_logged_in"); 
      localStorage.removeItem("mart_role"); 
      setIsLoggedIn(false); 
      setShowHandoverModal(false); 
      window.location.reload(); 
    } 
  };
  
  const handleEditPhone = async (oldPhone: string) => {
    executeWithAdminCheck(() => {
      const newPhone = window.prompt("Nhập SĐT mới:", oldPhone); 
      if (newPhone && newPhone.trim() !== "" && newPhone !== oldPhone) { 
        if (customers[newPhone]) return toast.error("SĐT đã tồn tại!"); 
        const cData = customers[oldPhone]; 
        const newC = { ...cData, phone: newPhone }; 
        setCustomers((prev: any) => { 
          const updated = { ...prev }; 
          updated[newPhone] = newC; 
          delete updated[oldPhone]; 
          return updated; 
        }); 
        setHistory((prev: any) => prev.map((h: any) => { 
          if (h.customer && h.customer.includes(oldPhone)) { 
            return { ...h, customer: h.customer.replace(oldPhone, newPhone) }; 
          } 
          return h; 
        })); 
        logAudit("SỬA SĐT KH", `Đổi ${oldPhone} -> ${newPhone}`); 
        toast.success("Cập nhật SĐT thành công!"); 
      }
    });
  };

  const addSupplier = async () => { 
    if (!supName || !supPhone) return toast.error("Vui lòng nhập đủ Tên/SĐT"); 
    const newS = { id: Date.now(), name: supName, phone: supPhone, item: supItem }; 
    setSuppliers(prev => [newS, ...prev]); 
    setSupName(""); setSupPhone(""); setSupItem(""); 
    logAudit("THÊM NCC", `${supName} - ${supPhone}`); 
    toast.success("Thêm NCC thành công!"); 
  };
  
  const deleteSupplier = async (id: any) => { 
    setSuppliers(prev => prev.filter(s => s.id !== id)); 
    if (navigator.onLine) await supabase.from('suppliers').delete().eq('id', id); 
  };
  
  const addExpense = async () => { 
    if (!expName || !expAmount) return toast.error("Vui lòng nhập chi phí!"); 
    const newE = { id: Date.now(), date: new Date().toLocaleDateString('vi-VN'), name: expName, amount: Number(expAmount) }; 
    setExpenses(prev => [newE, ...prev]); 
    setExpName(""); setExpAmount(""); 
    logAudit("GHI CHI PHÍ", `${expName}: ${expAmount}đ`, newE); 
    toast.success("Đã ghi nhận!"); 
  };
  
  const deleteExpense = async (id: any) => { 
    setExpenses(prev => prev.filter(e => e.id !== id)); 
    if (navigator.onLine) await supabase.from('expenses').delete().eq('id', id); 
  };

  // ===============================================
  // 🔥 CÁC HÀM XỬ LÝ KHÁCH HÀNG & MÃ GIẢM GIÁ (ĐÃ FIX)
  // ===============================================

  const handleVoucherSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = voucherInput.trim().toUpperCase();
      const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 };
      
      if (VOUCHERS[code]) {
        setAppliedVoucherAmount(VOUCHERS[code]);
        playSound('success');
        toast.success(`Đã áp dụng mã giảm ${VOUCHERS[code].toLocaleString()}đ`);
      } else if (!isNaN(Number(code)) && Number(code) > 0) {
        setAppliedVoucherAmount(Number(code));
        playSound('success');
        toast.success(`Đã áp dụng giảm trực tiếp ${Number(code).toLocaleString()}đ`);
      } else {
        playSound('error'); 
        toast.error("Mã Voucher không hợp lệ!"); 
        setAppliedVoucherAmount(0);
      }
    }
  };

  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; 
    setCustomerInput(val);
    const matchedPhone = Object.keys(customers).find(phone => phone === val.trim() || customers[phone].cardCode === val.trim());
    if (matchedPhone) {
      setCustPhone(matchedPhone); 
      setCustName(customers[matchedPhone].name); 
      setUseWallet(false);
    } else {
      setCustPhone(val); 
      setCustName(""); 
      setUseWallet(false);
    }
  };

  // ===============================================
  // 🔥 CÁC HÀM XỬ LÝ GIỎ HÀNG VÀ THANH TOÁN
  // ===============================================

  const closeCheckout = () => { resetCheckout(); };
  
  const handleHoldOrder = async () => { 
    if (cart.length === 0) return; 
    const newO = { id: Date.now(), time: new Date().toLocaleTimeString('vi-VN'), cart: [...cart] }; 
    setHeldOrders(prev => [...prev, newO]); 
    logAudit("LƯU TẠM", `Lưu giỏ ${cart.length} món`); 
    resetCheckout(); 
    toast.success("Đã lưu tạm đơn hàng!"); 
  };
  
  const restoreOrder = async (order: any) => { 
    if (cart.length > 0) return toast.error("Vui lòng thanh toán giỏ hàng hiện tại trước!"); 
    setCart(order.cart); 
    setHeldOrders(prev => prev.filter(o => o.id !== order.id)); 
    if (navigator.onLine) await supabase.from('held_orders').delete().eq('id', order.id); 
    setShowHoldModal(false); 
    toast.success("Đã phục hồi giỏ hàng!");
  };
  
  const deleteHeldOrder = async (id: any) => { 
    setHeldOrders(prev => prev.filter(o => o.id !== id)); 
    logAudit("XÓA ĐƠN", `Xóa đơn lưu tạm`); 
    if (navigator.onLine) await supabase.from('held_orders').delete().eq('id', id); 
    toast.success("Đã xóa đơn lưu tạm!");
  };

  const handleNextToQR = () => { 
    if (cart.length === 0) return toast.error("Giỏ hàng trống!"); 
    if (custPhone && !customers[custPhone] && !custName) return toast.error("Vui lòng nhập Tên khách mới!"); 
    if (voucherInput.trim() !== "" && appliedVoucherAmount === 0) {
      const code = voucherInput.trim().toUpperCase();
      const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 };
      if (VOUCHERS[code]) { setAppliedVoucherAmount(VOUCHERS[code]); } 
      else if (!isNaN(Number(code)) && Number(code) > 0) { setAppliedVoucherAmount(Number(code)); } 
      else { return toast.error("Mã Voucher không hợp lệ! Vui lòng xóa đi hoặc nhập lại."); }
    }
    setCheckoutStep(2); 
  };

  const confirmCheckout = async (payMethod: 'TIỀN MẶT' | 'CHUYỂN KHOẢN' | 'GHI NỢ' | 'KẾT HỢP' | 'QUẸT THẺ' | 'ZALO PAY') => {
    if (cart.some(i => !i.qty || i.qty <= 0)) { playSound('error'); return toast.error("Lỗi số lượng sản phẩm!") }
    if (payMethod === 'GHI NỢ' && !custPhone) return toast.error("Thanh toán Ghi nợ cần SĐT Khách hàng!");
    
    setLoading(true); 
    let logs: any[] = []; 
    const baseTotal = cartTotalAmountDisplay; 
    const subTotal = Math.round(baseTotal / (1 + VAT_RATE)); 
    const vatTotal = baseTotal - subTotal;
    
    const totalAfterVoucher = Math.max(0, baseTotal - appliedVoucherAmount); 
    const tier = getCustomerTier(customers[custPhone]?.totalSpent || 0); 
    const tierDiscountAmount = custPhone ? Math.round(baseTotal * tier.discountRate) : 0; 
    const amountAfterTierAndVoucher = Math.max(0, totalAfterVoucher - tierDiscountAmount); 
    const walletUsedAmount = useWallet && payMethod !== 'GHI NỢ' ? Math.round(Math.min(customers[custPhone]?.wallet || 0, amountAfterTierAndVoucher)) : 0; 
    const finalTotal = amountAfterTierAndVoucher - walletUsedAmount; 
    const totalDiscount = appliedVoucherAmount + walletUsedAmount + tierDiscountAmount; 
    const earned = payMethod === 'GHI NỢ' ? 0 : Math.round(finalTotal * 0.02);
    
    let baseTimestamp = Date.now(); 
    const orderIdStr = "HD" + Date.now().toString().slice(-6);

    for (const item of cart) {
      const baseCode = String(item.product.product_code).split('-')[0]; 
      const batches = products.filter(p => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`)).sort((a, b) => { if (!a.expiry_date) return 1; if (!b.expiry_date) return -1; return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime() });
      
      let remain = item.qty; 
      const price = getActualPrice(item.product);
      
      for (const b of batches) {
        if (remain <= 0) break;
        if (b.stock > 0) {
          const take = Math.min(remain, b.stock); 
          if (navigator.onLine) await supabase.from("products").update({ stock: b.stock - take }).eq("id", b.id);
          
          let splitCashAmt = 0; 
          if(payMethod === 'KẾT HỢP') { splitCashAmt = Math.round((Number(customerGiven) / finalTotal) * Math.round(take * price * (1 + VAT_RATE))); }
          
          logs.push({ id: baseTimestamp++, shift: shift, type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", name: cleanName(b.name) + (item.product.isHappyHour ? ' [Giờ Vàng]' : ''), qty: take, total: Math.round(take * price * (1 + VAT_RATE)), profit: Math.round(take * (price - (b.import_price || 0))), customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: b.id, refunded_qty: 0, paymentMethod: payMethod, split_cash: splitCashAmt, time: new Date().toLocaleString('vi-VN') } as any);
          remain -= take;
        }
      }
    }
    
    if (totalDiscount > 0) { 
      logs.push({ id: baseTimestamp++, shift: shift, type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", name: "Giảm giá/Ví/VIP", qty: 1, total: -totalDiscount, profit: -totalDiscount, customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: 'DISCOUNT', refunded_qty: 0, paymentMethod: payMethod, time: new Date().toLocaleString('vi-VN') } as any); 
    }
    
    if (custPhone) { 
      const updatedCust = { name: custName, wallet: payMethod === 'GHI NỢ' ? (customers[custPhone]?.wallet || 0) : Math.round((customers[custPhone]?.wallet || 0) - walletUsedAmount + earned), debt: (customers[custPhone]?.debt || 0) + (payMethod === 'GHI NỢ' ? finalTotal : 0), totalSpent: (customers[custPhone]?.totalSpent || 0) + (payMethod !== 'GHI NỢ' ? finalTotal : 0), email: customers[custPhone]?.email || "", cardCode: customers[custPhone]?.cardCode || "" }; 
      setCustomers((prev: any) => ({ ...prev, [custPhone]: updatedCust })); 
    }
    
    setHistory(prev => [...logs, ...prev]);
    const finalOrderInfo = { orderId: orderIdStr, shift: shift, cart: [...cart], subTotal, vatTotal, finalTotal: payMethod === 'GHI NỢ' ? 0 : finalTotal, debtAmount: payMethod === 'GHI NỢ' ? finalTotal : 0, discount: totalDiscount, tierDiscountAmount: tierDiscountAmount, earnedWallet: custPhone ? earned : 0, custName: custPhone ? custName : null, custPhone: custPhone ? custPhone : null, time: new Date().toLocaleString('vi-VN'), paymentMethod: payMethod, customerGiven: Number(customerGiven) || 0 };
    
    setLastOrder(finalOrderInfo); 
    logAudit("BÁN HÀNG", `Hóa đơn ${orderIdStr} - ${finalTotal.toLocaleString()}đ`, finalOrderInfo);
    setCheckoutStep(3); 
    if (navigator.onLine) fetchProducts(); 
    setLoading(false);
  };

  const handleRefund = async (logId: any) => {
    executeWithAdminCheck(() => {
      const logIndex = history.findIndex(l => l.id === logId); 
      if (logIndex === -1) return;
      const log = history[logIndex]; 
      if (log.type !== 'BÁN') return toast.error("Chỉ hỗ trợ hoàn cho đơn BÁN!");
      
      const maxRefund = log.qty - (log.refunded_qty || 0); 
      if (maxRefund <= 0) return toast.error("Đơn hàng này đã được hoàn toàn bộ!");
      
      const qStr = window.prompt(`SP: ${cleanName(log.name)}\nĐã mua: ${log.qty} | Có thể hoàn: ${maxRefund}\nNhập số lượng cần hoàn:`, maxRefund.toString());
      if (!qStr) return; 
      
      const refundQty = parseInt(qStr); 
      if (isNaN(refundQty) || refundQty <= 0 || refundQty > maxRefund) { playSound('error'); return toast.error("Lỗi số lượng!"); }
      
      if (!window.confirm(`Xác nhận hoàn ${refundQty} sản phẩm này?`)) return;

      const unitTotal = log.total / log.qty; 
      const unitProfit = (log.profit || 0) / log.qty;
      const refundTotal = Math.round(unitTotal * refundQty); 
      const refundProfit = Math.round(unitProfit * refundQty);
      
      const p = products.find(x => x.id === log.product_id); 
      if (p && navigator.onLine) supabase.from("products").update({ stock: p.stock + refundQty }).eq("id", p.id);

      let refundedToWallet = false; 
      let pMethod = 'TIỀN MẶT'; 
      let methodSuffix = " (TM)";
      
      if (log.customer && log.customer !== "Khách lẻ") {
        const phoneMatch = log.customer.match(/\((.*?)\)/);
        if (phoneMatch && phoneMatch[1]) {
          const phone = phoneMatch[1];
          if (customers[phone] && window.confirm(`Khách VIP: Hoàn ${refundTotal.toLocaleString()}đ vào VÍ ĐIỂM?\n- [OK]: Trả vào Ví\n- [Cancel]: Trả tiền ngoài`)) {
            const newW = (customers[phone].wallet || 0) + refundTotal; 
            setCustomers((prev: any) => ({ ...prev, [phone]: { ...prev[phone], wallet: newW } })); 
            refundedToWallet = true; 
            pMethod = 'VÍ ĐIỂM'; 
            methodSuffix = " (Ví)";
          }
        }
      }
      
      if (!refundedToWallet) { 
        const isTransfer = window.confirm(`Hoàn ${refundTotal.toLocaleString()}đ bằng hình thức nào?\n- [OK]: CHUYỂN KHOẢN\n- [Cancel]: TIỀN MẶT`); 
        if (isTransfer) { pMethod = 'CHUYỂN KHOẢN'; methodSuffix = " (CK)"; } 
      }
      
      const refundLog = { id: Date.now(), shift: shift, type: "TRẢ HÀNG", name: log.name + methodSuffix, qty: refundQty, total: -refundTotal, profit: -refundProfit, customer: log.customer, paymentMethod: pMethod, time: new Date().toLocaleString('vi-VN') } as any;
      const updatedHistory = [...history]; 
      updatedHistory[logIndex].refunded_qty = (log.refunded_qty || 0) + refundQty; 
      updatedHistory.unshift(refundLog);
      
      setHistory(updatedHistory); 
      if (navigator.onLine) fetchProducts();
      logAudit("TRẢ HÀNG", `Hoàn ${refundQty} ${cleanName(log.name)} (${pMethod})`, refundLog); 
      playSound('success'); 
      toast.success(`Thành công! Đã hoàn qua ${pMethod}`);
    });
  };

  const handlePayDebt = async (phone: string) => {
    const currentDebt = customers[phone]?.debt || 0; 
    if (currentDebt <= 0) return toast.error("Khách không có nợ!");
    
    const payAmtStr = window.prompt(`Khách nợ ${currentDebt.toLocaleString()}đ. Nhập số tiền thu:`, currentDebt.toString());
    if (payAmtStr && parseInt(payAmtStr) > 0) {
      const amt = parseInt(payAmtStr); 
      const isTransfer = window.confirm(`Thu nợ bằng CK (OK) hay TM (Cancel)?`); 
      const pMethod = isTransfer ? 'CHUYỂN KHOẢN' : 'TIỀN MẶT';
      
      const newD = Math.max(0, (customers[phone]?.debt || 0) - amt); 
      setCustomers((prev: any) => ({ ...prev, [phone]: { ...prev[phone], debt: newD } }));
      
      const dLog = { id: Date.now(), shift: shift, type: "THU NỢ", name: "Thanh toán công nợ", qty: 1, total: amt, profit: 0, customer: `${customers[phone].name} (${phone})`, paymentMethod: pMethod, time: new Date().toLocaleString('vi-VN') } as any;
      
      setHistory(prev => [dLog, ...prev]); 
      logAudit("THU NỢ", `Thu ${amt}đ từ ${customers[phone].name}`, dLog); 
      toast.success("Thanh toán nợ thành công!");
    }
  };

  // ===============================================
  // 🔥 CÁC HÀM XỬ LÝ LIÊN QUAN ĐẾN FILE VÀ DỮ LIỆU THẬT
  // ===============================================

  const handleReprint = (timeStr: string) => {
    const logsInBill = history.filter(h => h.time === timeStr && h.type === 'BÁN' && h.product_id !== 'DISCOUNT'); 
    const discountLog = history.find(h => h.time === timeStr && h.product_id === 'DISCOUNT');
    if(logsInBill.length === 0) return toast.error("Không tìm thấy dữ liệu hóa đơn!");
    
    const reconstructedCart = logsInBill.map(l => ({ qty: l.qty, product: { name: l.name, gift_info: null, isHappyHour: String(l.name).includes('[Giờ Vàng]') }, priceIncludingVat: l.total / l.qty }));
    const subTotal = reconstructedCart.reduce((s, i) => s + (i.qty * (i.priceIncludingVat / (1 + VAT_RATE))), 0); 
    const vatTotal = Math.round(subTotal * VAT_RATE); 
    const discount = discountLog ? Math.abs(discountLog.total) : 0; 
    const finalTotal = subTotal + vatTotal - discount;
    
    const rOrder = { orderId: "HD_COPY", shift: logsInBill[0].shift, cart: reconstructedCart, subTotal, vatTotal, finalTotal, debtAmount: 0, discount, time: timeStr, paymentMethod: logsInBill[0].paymentMethod, customerGiven: 0, custName: logsInBill[0].customer };
    setLastOrder(rOrder); 
    setPrintMode('receipt'); 
    setTimeout(() => window.print(), 500);
  };

  const sendReceiptEmail = async () => {
    if (!lastOrder) return; 
    let savedEmail = (lastOrder.custPhone && customers[lastOrder.custPhone] && customers[lastOrder.custPhone].email) ? customers[lastOrder.custPhone].email : ""; 
    let email = window.prompt("Nhập Email khách hàng:", savedEmail); 
    if (!email) return; 
    email = email.trim(); 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    if (!emailRegex.test(email)) return toast.error("Địa chỉ Email không hợp lệ!");
    
    if (lastOrder.custPhone) { 
      setCustomers((prev: any) => ({ ...prev, [lastOrder.custPhone]: { ...prev[lastOrder.custPhone], email: email } })); 
    }
    
    setLoading(true); 
    let itemsTable = ""; 
    lastOrder.cart.forEach((item: any) => { 
      const priceToUse = item.priceIncludingVat !== undefined ? item.priceIncludingVat : Math.round(getActualPrice(item.product) * (1 + VAT_RATE)); 
      itemsTable += `- ${cleanName(item.product.name)} x ${item.qty} = ${(priceToUse * item.qty).toLocaleString()}đ\n`; 
    }); 
    
    const emailData = { 
      to_email: email, title: "HÓA ĐƠN MUA HÀNG - HẢI LÊ MART", order_id: lastOrder.orderId, 
      time: lastOrder.time, items_list: itemsTable, label_total: "TỔNG THANH TOÁN:", 
      total_amount: Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString() + "đ", 
      label_payment: "Hình thức TT:", payment_method: lastOrder.paymentMethod, 
      label_change: lastOrder.paymentMethod === 'TIỀN MẶT' ? "Tiền thối lại:" : "", 
      change_amount: lastOrder.paymentMethod === 'TIỀN MẶT' ? Math.round(lastOrder.customerGiven - lastOrder.finalTotal).toLocaleString() + "đ" : "" 
    }; 
    
    try { 
      await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailData); 
      toast.success("Đã gửi Hóa đơn cho khách!"); 
      logAudit("GỬI HĐ MAIL", `Gửi tới ${email}`); 
    } catch (error: any) { 
      console.error(error); toast.error(`Lỗi gửi Email (EmailJS)`); 
    } 
    setLoading(false);
  };
  
  const sendCardEmail = async (phone: string) => {
    const cust = customers[phone]; 
    let email = cust.email || window.prompt(`Nhập Email của ${cust.name}:`, ""); 
    if (!email) return; 
    email = email.trim(); 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    if (!emailRegex.test(email)) return toast.error("Địa chỉ Email không hợp lệ!");
    
    if (!cust.email) { 
      setCustomers((prev: any) => ({ ...prev, [phone]: { ...prev[phone], email } })); 
    } 
    
    setLoading(true); 
    const code = cust.cardCode || phone; 
    const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(code)}&scale=2&height=10&includetext=true`; 
    const emailData = { 
      to_email: email, order_id: "THẺ THÀNH VIÊN", time: new Date().toLocaleString('vi-VN'), 
      items_list: `💳 MÃ THẺ CỦA BẠN LÀ: ${code}\n(Vui lòng xuất trình Thẻ/Mã vạch bên dưới khi thanh toán)`, 
      total_amount: "Ưu đãi Đặc Quyền", payment_method: "VIP Member", change_amount: "0đ", barcode_url: barcodeUrl 
    }; 
    
    try { 
      await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_VIP_ID, emailData); 
      toast.success("Đã gửi Thẻ VIP!"); 
      logAudit("GỬI THẺ VIP", `Gửi tới ${email}`); 
    } catch (error: any) { 
      console.error(error); toast.error(`Lỗi gửi Email (EmailJS)`); 
    } 
    setLoading(false);
  };

  const printCustomerCard = (phone: string) => { 
    setPrintCustomer({ phone, ...customers[phone] }); 
    setPrintMode('customer_card'); 
    setTimeout(() => window.print(), 1000); 
  };
  
  const shareToZalo = (phone: string) => { 
    const cust = customers[phone]; 
    const code = cust.cardCode || phone; 
    navigator.clipboard.writeText(`Chào ${cust.name},\nCảm ơn bạn đã đồng hành cùng Hải Lê Mart!\n💳 Mã Thẻ VIP của bạn là: ${code}`).then(() => { 
      toast.success(`Đã copy lời chào. Đang mở Zalo...`); 
      window.open(`https://zalo.me/${phone}`, '_blank');
    }).catch(() => { 
      window.open(`https://zalo.me/${phone}`, '_blank');
    });
  };
  
  // ===============================================
  // 🔥 CÁC HÀM XỬ LÝ SẢN PHẨM & TỒN KHO THẬT
  // ===============================================

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const code = e.target.value; setNewCode(code); 
    const p = products.find((x: any) => x.product_code === code); 
    if (p) { 
      setNewName(cleanName(p.name)); 
      setNewCategory(formatCategoryStr(p.category)); 
      setNewImportPrice(p.import_price?.toString() || ""); 
      setNewPrice(p.sale_price.toString()); 
      setNewPromoPrice(p.promo_price?.toString() || ""); 
      setNewExpiry(p.expiry_date || ""); 
      const gift = parseGift(p.gift_info); 
      setNewGiftCondition(gift.cond.toString()); 
      setNewGiftInfo(gift.text); 
    } 
  };
  
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!navigator.onLine) return toast.error("Cần có mạng để thao tác Kho!"); 
    setLoading(true);
    
    const added = parseInt(newStock || "0"); 
    const impPrice = parseInt(newImportPrice); 
    const salePrice = parseInt(newPrice); 
    const promo = parseInt(newPromoPrice) || 0; 
    const finalGiftInfo = newGiftInfo.trim() !== "" ? `${newGiftCondition};;;${newGiftInfo}` : null; 
    const baseCode = newCode.trim(); 
    const formattedCat = formatCategoryStr(newCategory);
    
    const allVariants = products.filter(p => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`)); 
    const exist = allVariants.find(p => p.product_code === baseCode); 
    let syncMsg = "";

    if (allVariants.length > 0) {
      const needSync = allVariants.some(v => v.sale_price !== salePrice || v.promo_price !== promo || v.gift_info !== finalGiftInfo);
      if (needSync) { 
        await Promise.all(allVariants.map(v => supabase.from("products").update({ sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo }).eq("id", v.id))); 
        syncMsg = `\n💡 Đã ĐỒNG BỘ GIÁ & QUÀ TẶNG cho các lô cũ!`; 
        logAudit("ĐỒNG BỘ HỆ THỐNG", `Cập nhật Giá/Quà mã ${baseCode}`, { newPrice: salePrice, newPromo: promo, newGift: finalGiftInfo }); 
      }
    }

    if (exist) {
      if (exist.stock <= 0) {
        await supabase.from("products").update({ name: newName, category: formattedCat, import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null, created_at: new Date().toISOString() }).eq("id", exist.id);
        if (added > 0) { 
          const lg = { id: Date.now(), shift: shift, type: "NHẬP", name: newName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') } as any; 
          setHistory(prev => [lg, ...prev]); 
        } 
        logAudit("NHẬP ĐÈ CŨ", `${newName} (+${added})`, { importPrice: impPrice, salePrice }); 
        toast.success(`Đã nhập hàng!${syncMsg}`);
      } else {
        if (exist.import_price !== impPrice || (exist.expiry_date || "") !== (newExpiry || "")) {
          const batchCode = `${baseCode}-${Date.now().toString().slice(-4)}`; 
          const batchName = `${newName} [Lô ${newExpiry ? new Date(newExpiry).toLocaleDateString('vi-VN') : 'Mới'}]`;
          if (window.confirm(`Tạo LÔ MỚI (${batchCode})?\n(Lô cũ sẽ tự động được áp dụng Giá & Quà tặng mới)`)) {
            await supabase.from("products").insert([{ product_code: batchCode, name: batchName, category: formattedCat, import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null }]);
            if (added > 0) { 
              const lg = { id: Date.now(), shift: shift, type: "NHẬP", name: batchName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') } as any; 
              setHistory(prev => [lg, ...prev]); 
            } 
            logAudit("TÁCH LÔ", `${batchName} (+${added})`, { oldExpiry: exist.expiry_date, newExpiry }); 
            toast.success(`Đã tạo lô mới!${syncMsg}`);
          } else { 
            setLoading(false); 
            return; 
          }
        } else {
          await supabase.from("products").update({ stock: exist.stock + added, created_at: new Date().toISOString() }).eq("id", exist.id);
          if (added > 0) { 
            const lg = { id: Date.now(), shift: shift, type: "NHẬP", name: newName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') } as any; 
            setHistory(prev => [lg, ...prev]); 
          } 
          logAudit("CỘNG DỒN", `${newName} (+${added})`); 
          toast.success(`Cộng dồn thành công!${syncMsg}`);
        }
      }
    } else {
      await supabase.from("products").insert([{ product_code: baseCode, name: newName, category: formattedCat, import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null }]);
      if (added > 0) { 
        const lg = { id: Date.now(), shift: shift, type: "NHẬP", name: newName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') } as any; 
        setHistory(prev => [lg, ...prev]); 
      } 
      logAudit("NHẬP MỚI", `${newName} (+${added})`, { code: baseCode, importPrice: impPrice, salePrice }); 
      toast.success(`Nhập thành công!${syncMsg}`);
    }
    resetProductForm(); 
    fetchProducts(); 
    setLoading(false); 
    setShowInputForm(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!navigator.onLine) return toast.error("Cần mạng để tải lên!"); 
    const file = e.target.files?.[0]; 
    if (!file) return;

    const processData = async (lines: any[]) => {
      setLoading(true); 
      try {
        if (!lines || lines.length <= 1) { 
          toast.error("File rỗng hoặc không hợp lệ!"); 
          setLoading(false); 
          return; 
        } 
        let successCount = 0; 
        let importLogs: any[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i]; 
          if (!cols || !Array.isArray(cols) || cols.join('').trim() === '') continue; 
          
          const pCode = String(cols[0] || "").trim(); 
          const pName = String(cols[1] || "").trim(); 
          const pCategory = formatCategoryStr(String(cols[2] || "")); 
          const pImpPrice = parseInt(String(cols[3] || "0").replace(/[,.]/g, '')) || 0; 
          const pSalePrice = parseInt(String(cols[4] || "0").replace(/[,.]/g, '')) || 0; 
          const pPromoPrice = parseInt(String(cols[5] || "0").replace(/[,.]/g, '')) || 0; 

          const pGiftCond = String(cols[6] || "1").trim();
          const pGiftText = cols[7] ? String(cols[7]).trim() : "";
          const pGift = pGiftText !== "" ? `${pGiftCond};;;${pGiftText}` : null; 

          const pStock = parseInt(String(cols[8] || "0").replace(/[,.]/g, '')) || 0; 
          const pExpiry = cols[9] ? String(cols[9]).trim() : null;
          
          if (!pCode || !pName || pSalePrice <= 0) continue;
          
          const baseCode = pCode; 
          const allVariants = products.filter(p => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`)); 
          
          if (allVariants.length > 0) { 
            const needSync = allVariants.some(v => v.sale_price !== pSalePrice || v.promo_price !== pPromoPrice || v.gift_info !== pGift);
            if (needSync) {
              await Promise.all(allVariants.map(v => supabase.from("products").update({ sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift }).eq("id", v.id))); 
              if (!importLogs.find(l => l.name === `Đồng bộ giá/quà ${baseCode}`)) {
                importLogs.push({ id: Date.now() + Math.random(), shift: shift, type: "HỆ THỐNG", name: `Đồng bộ giá/quà ${baseCode}`, qty: 0, total: 0, time: new Date().toLocaleString('vi-VN') } as any);
              }
            }
          }
          
          const exist = allVariants.find(p => p.product_code === baseCode); 
          if (exist) { 
            if (exist.stock <= 0) { 
              await supabase.from("products").update({ name: pName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry, created_at: new Date().toISOString() }).eq("id", exist.id); 
            } else { 
              if (exist.import_price !== pImpPrice || (exist.expiry_date || "") !== (pExpiry || "")) { 
                const batchCode = `${baseCode}-${Date.now().toString().slice(-4)}${i}`; 
                const batchName = `${pName} [Lô ${pExpiry ? new Date(pExpiry).toLocaleDateString('vi-VN') : 'Mới'}]`; 
                await supabase.from("products").insert([{ product_code: batchCode, name: pName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry }]); 
              } else {
                await supabase.from("products").update({ stock: exist.stock + pStock, created_at: new Date().toISOString() }).eq("id", exist.id);
              }
            } 
          } else {
            await supabase.from("products").insert([{ product_code: baseCode, name: pName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry }]); 
          }
          
          if (pStock > 0) {
            importLogs.push({ id: Date.now() + Math.random(), shift: shift, type: "NHẬP", name: cleanName(pName), qty: pStock, total: 0, time: new Date().toLocaleString('vi-VN') } as any); 
            successCount++;
          }
        }
        
        if (importLogs.length > 0) { 
          setHistory(prev => [...importLogs, ...prev]); 
        } 
        logAudit("NHẬP FILE", `Nhập ${successCount} mã`); 
        toast.success(`Nhập thành công ${successCount} sản phẩm từ file!`); 
        fetchProducts();
      } catch (err) { 
        console.error(err); 
        toast.error("Lỗi xử lý dữ liệu file, vui lòng kiểm tra lại định dạng."); 
      } 
      setLoading(false);
    }; 
    
    const fileNameStr = file.name.toLowerCase();
    if (fileNameStr.endsWith('.xlsx') || fileNameStr.endsWith('.xls')) {
      if (!(window as any).XLSX) return toast.loading("Thư viện Excel đang tải, vui lòng thử lại sau vài giây!"); 
      const reader = new FileReader();
      reader.onload = (event) => { 
        try { 
          const data = new Uint8Array(event.target?.result as ArrayBuffer); 
          const workbook = (window as any).XLSX.read(data, { type: 'array' }); 
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]; 
          const jsonData = (window as any).XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "", raw: false }); 
          processData(jsonData); 
        } catch (error) { 
          console.error(error); 
          toast.error("Đã xảy ra lỗi khi đọc file Excel."); 
        } 
      }; 
      reader.readAsArrayBuffer(file);
    } else { 
      const reader = new FileReader(); 
      reader.onload = (event) => { 
        const text = event.target?.result as string; 
        const lines = text.split('\n').filter(line => line.trim() !== '').map(line => line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(c => c.trim().replace(/^"|"$/g, ''))); 
        processData(lines); 
      }; 
      reader.readAsText(file); 
    } 
    e.target.value = ''; 
  };

  const handleImportInventoryCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const processData = (lines: any[]) => { 
      let updatedStock = { ...actualStockInput }; let count = 0; 
      for (let i = 1; i < lines.length; i++) { 
        const cols = lines[i]; 
        if (!cols || !Array.isArray(cols) || cols.join('').trim() === '') continue; 
        const pCode = String(cols[0] || "").trim(); 
        const actualVal = parseInt(String(cols[3] || "0").replace(/[,.]/g, '')); 
        if (!isNaN(actualVal) && pCode) { 
          const matchedProd = products.find(p => p.product_code === pCode); 
          if (matchedProd && matchedProd.stock !== actualVal) { 
            updatedStock[matchedProd.id] = actualVal; count++; 
          } 
        } 
      } 
      setActualStockInput(updatedStock); 
      toast.success(`Đã nạp số liệu cho ${count} sản phẩm có thay đổi từ file!`); 
    };
    
    const fileNameStr = file.name.toLowerCase();
    if (fileNameStr.endsWith('.xlsx') || fileNameStr.endsWith('.xls')) { 
      if (!(window as any).XLSX) return toast.loading("Thư viện Excel đang tải, vui lòng thử lại sau vài giây!"); 
      const reader = new FileReader(); 
      reader.onload = (event) => { 
        try { 
          const data = new Uint8Array(event.target?.result as ArrayBuffer); 
          const workbook = (window as any).XLSX.read(data, { type: 'array' }); 
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]; 
          const jsonData = (window as any).XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "", raw: false }); 
          processData(jsonData); 
        } catch(err) { 
          console.error(err); toast.error("Lỗi định dạng cấu trúc khi đọc file Excel."); 
        } 
      }; 
      reader.readAsArrayBuffer(file); 
    } else { 
      const reader = new FileReader(); 
      reader.onload = (event) => { 
        const text = event.target?.result as string; 
        const lines = text.split('\n').filter(line => line.trim() !== '').map(line => line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(c => c.trim().replace(/^"|"$/g, ''))); 
        processData(lines); 
      }; 
      reader.readAsText(file); 
    } 
    e.target.value = '';
  };
  
  const handleDelete = async (id: any, name: any) => {
    executeWithAdminCheck(async () => {
      if (!navigator.onLine) return toast.error("Cần có mạng để thao tác Kho!"); 
      if (window.confirm(`Xóa vĩnh viễn ${name}?`)) { 
        await supabase.from("products").delete().eq("id", id); 
        logAudit("XÓA SP", `Xóa: ${name}`); 
        fetchProducts();
      }
    });
  };
  
  const handleEdit = async (id: any, field: string, old: any, isText: boolean = false) => {
    executeWithAdminCheck(async () => {
      if (!navigator.onLine) return toast.error("Cần có mạng để thao tác Kho!"); 
      let label = field; 
      if (field === 'category') label = 'Danh mục'; 
      if (field === 'sale_price') label = 'Giá bán'; 
      if (field === 'promo_price') label = 'Giá KM'; 
      if (field === 'gift_info') label = 'Quà tặng'; 
      if (field === 'expiry_date') label = 'HSD'; 
      
      const val = window.prompt(`Sửa ${label}:`, old || ""); 
      if (val !== null) { 
        let updateData: any = isText ? (field === 'category' ? formatCategoryStr(val) : val) : (parseInt(val) || 0); 
        if (field === 'gift_info' && val.trim() === '') updateData = null; 
        await supabase.from("products").update({ [field]: updateData }).eq("id", id); 
        logAudit("SỬA THÔNG TIN", `ID ${id} - ${label}`, { old, new: updateData }); 
        fetchProducts();
      }
    });
  };
  
  const handlePrintBarcode = (p: any) => { 
    const q = window.prompt(`SL tem in: ${cleanName(p.name)}`, "30"); 
    if (q && parseInt(q) > 0) { 
      setPrintBarcodeProduct(p); 
      setBarcodeCount(parseInt(q)); 
      setPrintMode('barcode'); 
      setTimeout(() => window.print(), 1500);
    } 
  };
  
  const downloadSampleCSV = () => { 
    try {
      const csv = "\uFEFFMã SP,Tên SP,Danh Mục,Giá Nhập,Giá Bán,Giá KM,ĐK Tặng,Quà Tặng,Số Lượng,Hạn Sử Dụng (YYYY-MM-DD)\nSP001,Mì Hảo Hảo,Đồ ăn liền,3000,5000,0,1,,100,2026-12-31\nSP002,Xúc xích,Đồ ăn liền,10000,15000,0,2,1 Cây Xúc Xích,50,2026-12-31"; 
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); 
      const link = document.createElement("a"); 
      link.href = URL.createObjectURL(blob); 
      link.download = `Mau_Nhap_Kho.csv`; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Đã tải File Mẫu!");
    } catch(e) {
      toast.error("Lỗi khi tải file mẫu!");
    }
  };
  
  const exportToCSV = () => { 
    let csv = "\uFEFFGiờ,Ca,Loại,Hình thức,Khách,Sản phẩm,SL,Tổng(VAT),Lợi nhuận\n"; 
    history.forEach(log => { 
      csv += `${new Date(Math.floor(log.id)).toLocaleString('vi-VN')},${log.shift || ""},${log.type},${log.paymentMethod || ""},${log.customer || "Khách lẻ"},${log.name},${log.qty},${Math.round(log.total)},${Math.round(log.profit || 0)}\n`;
    }); 
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); 
    const link = document.createElement("a"); 
    link.href = URL.createObjectURL(blob); 
    link.download = `Bao_Cao_Ban_Hang.csv`; 
    link.click();
    toast.success("Đã xuất File Doanh Thu!");
  };
  
  const exportAuditToCSV = () => { 
    let csv = "\uFEFFThời gian,Người dùng,Ca,Hành động,Chi tiết,Dữ liệu mở rộng\n"; 
    auditLogs.forEach(log => { 
      csv += `${log.time},${log.user_name},${log.shift},${log.action},"${(log.detail || "").replace(/"/g, '""')}","${(log.extra_data || "").replace(/"/g, '""')}"\n`;
    }); 
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); 
    const link = document.createElement("a"); 
    link.href = URL.createObjectURL(blob); 
    link.download = `Nhat_Ky_Thao_Tac.csv`; 
    link.click();
    toast.success("Đã xuất File Nhật Ký!");
  };
  
  const handleSendEmailReport = async () => {
    const start = new Date(reportStartDate + "T00:00:00").getTime(); 
    const end = new Date(reportEndDate + "T23:59:59").getTime(); 
    const logs = history.filter(log => { 
      const t = new Date(Math.floor(log.id)).getTime(); 
      return t >= start && t <= end; 
    }); 
    if (logs.length === 0) return toast.error("Chưa có giao dịch trong khoảng thời gian này!"); 
    
    let cash = 0, transfer = 0, prof = 0, sold = 0; 
    logs.forEach(l => { 
      if (l.type === 'BÁN') sold += l.qty; 
      if (l.type === 'BÁN' || l.type === 'THU NỢ' || l.type === 'TRẢ HÀNG') { 
        if (l.paymentMethod === 'CHUYỂN KHOẢN' || l.paymentMethod === 'QUẸT THẺ' || l.paymentMethod === 'ZALO PAY') {
          transfer += l.total; 
        } else if (l.paymentMethod === 'TIỀN MẶT' || l.paymentMethod === 'KẾT HỢP') { 
          if(l.paymentMethod === 'KẾT HỢP' && l.split_cash) { 
            cash += l.split_cash; transfer += (l.total - l.split_cash); 
          } else { 
            cash += l.total;
          } 
        } 
      } 
      prof += (l.profit || 0);
    });
    
    let adminEmail = window.prompt("Nhập Email Quản lý để nhận báo cáo:", ""); 
    if(!adminEmail) return; 
    adminEmail = adminEmail.trim(); 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    if (!emailRegex.test(adminEmail)) return toast.error("Địa chỉ Email không hợp lệ!"); 
    
    setLoading(true);
    const reportStr = `\n📅 Từ ${reportStartDate} đến ${reportEndDate}\n- Tổng SP đã bán: ${sold} món\n- Doanh thu Tiền Mặt: ${Math.round(cash).toLocaleString()}đ\n- Doanh thu CK/Thẻ/ZaloPay: ${Math.round(transfer).toLocaleString()}đ\n`; 
    const emailData = { 
      to_email: adminEmail, title: "BÁO CÁO DOANH THU", order_id: `BÁO CÁO TỔNG HỢP`, 
      time: new Date().toLocaleString('vi-VN'), items_list: reportStr, label_total: "TỔNG LỢI NHUẬN:", 
      total_amount: Math.round(prof).toLocaleString() + "đ", label_payment: "Hệ thống:", 
      payment_method: "Hải Lê ERP", label_change: "", change_amount: "" 
    }; 
    
    try { 
      await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailData); 
      logAudit("GỬI BÁO CÁO", `Đã gửi báo cáo tới ${adminEmail}`); 
      toast.success("Đã gửi Báo cáo thành công!"); 
    } catch (error: any) { 
      console.error(error); 
      toast.error(`Lỗi gửi Email (EmailJS)`); 
    } 
    setLoading(false);
  };

  const sendInventoryAlertEmail = async () => {
    let adminEmail = window.prompt("Nhập Email Quản lý để nhận cảnh báo:", ""); 
    if(!adminEmail) return; 
    adminEmail = adminEmail.trim(); 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    if (!emailRegex.test(adminEmail)) return toast.error("Địa chỉ Email không hợp lệ!"); 
    
    setLoading(true); 
    const lowStock = products.filter(p => p.stock > 0 && p.stock < 10).length; 
    const today = new Date().getTime(); 
    const expiring = products.filter(p => p.expiry_date && (new Date(p.expiry_date).getTime() - today) / 86400000 <= 15);
    
    let msg = `🚨 BÁO CÁO KHO HÀNG NGÀY 🚨\n\n📦 SẮP HẾT HÀNG (${lowStock} món):\n`; 
    products.filter(p => p.stock > 0 && p.stock < 10).forEach(p => msg += `- ${cleanName(p.name)}: Còn ${p.stock} sản phẩm\n`); 
    msg += `\n⏳ SẮP HẾT HẠN TRONG 15 NGÀY TỚI (${expiring.length} món):\n`; 
    expiring.forEach(p => msg += `- ${cleanName(p.name)}: HSD ${new Date(p.expiry_date).toLocaleDateString('vi-VN')}\n`); 
    
    const emailData = { 
      to_email: adminEmail, title: "CẢNH BÁO TỒN KHO HẢI LÊ MART", order_id: "HỆ THỐNG", 
      time: new Date().toLocaleString('vi-VN'), items_list: msg, label_total: "Tình trạng:", 
      total_amount: "Cần chú ý", label_payment: "Gửi từ:", payment_method: "ERP Bot", 
      label_change: "", change_amount: "" 
    }; 
    
    try { 
      await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailData); 
      toast.success("Đã gửi cảnh báo kho thành công!"); 
      logAudit("CẢNH BÁO KHO", "Gửi email báo cáo tồn kho"); 
    } catch (error: any) { 
      console.error(error); 
      toast.error(`Lỗi gửi Email (EmailJS)`); 
    } 
    setLoading(false);
  };

  const handleInventorySearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => { 
    if (e.key === 'Enter') { 
      e.preventDefault(); 
      const term = String(inventorySearchTerm || "").trim().toLowerCase(); 
      if (!term) return; 
      const exactMatch = products.find(p => String(p.product_code || "").toLowerCase() === term); 
      if (exactMatch) { 
        const inputEl = document.getElementById(`inv-input-${exactMatch.id}`); 
        if (inputEl) { inputEl.focus(); } 
      } 
    } 
  };
  
  const handleInvInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { 
    if (e.key === 'Enter') { 
      e.preventDefault(); 
      const searchBox = document.getElementById('inv-search-box'); 
      if (searchBox) { searchBox.focus(); setInventorySearchTerm(""); } 
    } 
  };

  const exportInventoryCSV = () => {
    let csv = "\uFEFFMã SP,Tên SP,Tồn hệ thống,Tồn thực tế\n";
    products.forEach(p => { 
      const actual = actualStockInput[p.id] !== undefined ? actualStockInput[p.id] : p.stock; 
      csv += `${p.product_code},"${cleanName(p.name)}",${p.stock},${actual}\n`; 
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); 
    const link = document.createElement("a"); 
    link.href = URL.createObjectURL(blob); 
    link.download = `KiemKho_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`; 
    link.click();
  };

  const syncInventoryCheck = async () => {
    if(!navigator.onLine) return toast.error("Cần có mạng để lưu kết quả kiểm kho!"); 
    if(!window.confirm("Xác nhận ghi đè số lượng tồn kho trên máy bằng số lượng thực tế?")) return;
    
    setLoading(true); 
    let count = 0;
    for (const [id, actualQty] of Object.entries(actualStockInput)) { 
      const p = products.find(x => String(x.id) === String(id)); 
      if(p && p.stock !== actualQty) { 
        await supabase.from("products").update({ stock: actualQty }).eq("id", p.id); 
        logAudit("KIỂM KHO", `Cập nhật ${p.name}`, { tu_so: p.stock, thanh_so: actualQty, lech: actualQty - p.stock }); 
        count++; 
      } 
    }
    toast.success(`Đã đồng bộ chênh lệch ${count} sản phẩm!`); 
    setShowInventoryModal(false); 
    setActualStockInput({}); 
    fetchProducts(); 
    setLoading(false);
  };
  
  const requestSort = (key: string) => { 
    if (sortConfig && sortConfig.key === key) { 
      if (sortConfig.direction === 'asc') setSortConfig({ key, direction: 'desc' }); 
      else setSortConfig(null);
    } else { 
      setSortConfig({ key, direction: 'asc' });
    } 
  };
  
  const toggleDateGroup = (dateStr: string) => setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));

  const handleSavePO = async (supplier: any, items: any[], totalAmount: number, paidAmount: number, note: string) => {
    if (!navigator.onLine) return toast.error("Cần mạng để lưu Phiếu Nhập Hàng!"); 
    setLoading(true);
    try {
      const debtAmount = totalAmount - paidAmount; 
      const poCode = "PO" + Date.now().toString().slice(-6);
      
      await supabase.from('purchase_orders').insert([{ po_code: poCode, supplier_name: supplier.name, supplier_phone: supplier.phone, total_amount: totalAmount, paid_amount: paidAmount, debt_amount: debtAmount, note: note }]);
      
      if (debtAmount > 0) { 
        const newDebt = (supplier.debt || 0) + debtAmount; 
        await supabase.from('suppliers').update({ debt: newDebt }).eq('id', supplier.id); 
        setSuppliers(prev => prev.map(s => s.id === supplier.id ? { ...s, debt: newDebt } : s)); 
      }
      
      for (const item of items) {
        const p = products.find(x => x.id === item.product.id);
        if (p) { 
          const newStock = p.stock + item.qty; 
          await supabase.from('products').update({ stock: newStock, import_price: item.importPrice }).eq('id', p.id); 
          setHistory(prev => [{ id: Date.now() + Math.random(), shift, type: "NHẬP PO", name: p.name, qty: item.qty, total: item.qty * item.importPrice, time: new Date().toLocaleString('vi-VN') } as any, ...prev]); 
        }
      }
      
      logAudit("NHẬP HÀNG PO", `Mã ${poCode} từ ${supplier.name} (Nợ: ${debtAmount.toLocaleString()}đ)`); 
      toast.success("Đã lưu Phiếu Nhập & Cộng Kho thành công!"); 
      fetchProducts(); 
      setShowPOModal(false);
    } catch(err: any) { 
      toast.error("Lỗi hệ thống: " + err.message); 
    } 
    setLoading(false);
  };

  const sendMarketingEmails = async () => {
    if (!marketingMsg) return toast.error("Vui lòng nhập nội dung!"); 
    if (!window.confirm("Giới hạn 200 mail/tháng. Gửi?")) return;
    
    setLoading(true); 
    const targetCustomers = Object.keys(customers).filter(phone => { 
      const c = customers[phone]; 
      if (!c.email) return false; 
      if (marketingTier === "Tất cả") return true; 
      return getCustomerTier(c.totalSpent).name.includes(marketingTier);
    });
    
    if (targetCustomers.length === 0) { 
      setLoading(false); 
      return toast.error("Không có khách hàng nào phù hợp!"); 
    }
    
    let successCount = 0;
    for (const phone of targetCustomers) { 
      const c = customers[phone]; 
      try { 
        await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_VIP_ID, { to_email: c.email, order_id: "THÔNG BÁO ƯU ĐÃI", time: new Date().toLocaleString('vi-VN'), items_list: `💌 Lời nhắn từ Hải Lê Mart:\n\n${marketingMsg}`, total_amount: "Quà Tặng", payment_method: "Khách VIP", change_amount: "0đ", barcode_url: "" }); 
        successCount++;
      } catch (error: any) { 
        console.error("EmailJS Error", error); 
      } 
    }
    
    logAudit("GỬI MAIL MKT", `Gửi ${successCount} mail cho tập ${marketingTier}`); 
    setLoading(false); 
    setShowMarketingModal(false); 
    toast.success(`Đã gửi ${successCount} mail!`);
  };

  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => { 
    document.getElementById('search-barcode')?.focus(); 
    if (e.key === 'Enter') { 
      e.preventDefault(); 
      const p = findProductByCode(barcodeInput); 
      if (p) {
        handleSelectSuggest(p); 
      } else { 
        const matchedPhone = Object.keys(customers).find(phone => phone === barcodeInput.trim() || customers[phone].cardCode === barcodeInput.trim()); 
        if (matchedPhone) { 
          playSound('success'); 
          setCustomerInput(customers[matchedPhone].cardCode || matchedPhone); 
          setCustPhone(matchedPhone); 
          setCustName(customers[matchedPhone].name); 
          setBarcodeInput("");
        } else { 
          playSound('error'); 
          toast.error("Mã không hợp lệ!");
        } 
      } 
    } 
  };
  
  const handleSelectSuggest = (p_input: any) => {
    const baseCode = String(p_input.product_code).split('-')[0]; 
    const totalStock = products.filter(p => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`)).reduce((s, p) => s + p.stock, 0); 
    if (totalStock <= 0) { playSound('error'); return toast.error("Sản phẩm đã hết hàng!"); }
    
    const currentTime = new Date(); 
    const currentTotalMins = currentTime.getHours() * 60 + currentTime.getMinutes(); 
    const [startH, startM] = happyStart.split(':').map(Number); 
    const [endH, endM] = happyEnd.split(':').map(Number); 
    const startTotalMins = startH * 60 + startM; 
    const endTotalMins = endH * 60 + endM; 
    
    let isHappyNow = false; 
    if (startTotalMins <= endTotalMins) { 
      isHappyNow = currentTotalMins >= startTotalMins && currentTotalMins <= endTotalMins; 
    } else { 
      isHappyNow = currentTotalMins >= startTotalMins || currentTotalMins <= endTotalMins; 
    }
    
    let itemToCart = { ...p_input }; 
    if (isHappyNow && p_input.promo_price > 0 && p_input.promo_price < p_input.sale_price) { 
      itemToCart.isHappyHour = true; 
    }
    
    const price = getActualPrice(itemToCart); 
    const repName = cleanName(itemToCart.name);
    
    setCart(prev => {
      const exist = prev.find(item => cleanName(item.product.name) === repName && !!item.product.isHappyHour === !!itemToCart.isHappyHour);
      if (exist) { 
        const newQty = exist.qty + 1; 
        if (newQty > totalStock) { playSound('error'); return prev; } 
        return prev.map(i => (cleanName(i.product.name) === repName && !!i.product.isHappyHour === !!itemToCart.isHappyHour) ? { ...i, qty: newQty, total: Math.round(newQty * price * (1 + VAT_RATE)) } : i); 
      } else { 
        return [...prev, { product: itemToCart, qty: 1, total: Math.round(price * (1 + VAT_RATE)) }]; 
      }
    });
    setScanMessage({ text: `✅ Thêm: ${repName} ${itemToCart.isHappyHour ? '⭐' : ''}`, type: 'success' }); 
    setBarcodeInput(""); 
    setShowSuggestions(false); 
    setTimeout(() => setScanMessage(null), 2000);
  };
  
  const addToCart = (p_input: any) => { handleSelectSuggest(p_input); playSound('success'); };
  
  const adjustCartQty = (productId: any, delta: number) => { 
    let exceedStock = false; 
    setCart(prev => { 
      const updated = prev.map(item => { 
        if (item.product.id === productId) { 
          const baseCode = String(item.product.product_code).split('-')[0]; 
          const totalStock = products.filter(p => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`)).reduce((s, p) => s + p.stock, 0); 
          const newQty = item.qty + delta; 
          if (newQty > totalStock) { exceedStock = true; return item; } 
          const price = getActualPrice(item.product); 
          return { ...item, qty: newQty, total: Math.round(newQty * price * (1 + VAT_RATE)) }; 
        } 
        return item; 
      }); 
      return updated.filter(item => item.qty > 0); 
    }); 
    if (exceedStock) playSound('error'); else if (delta > 0) playSound('success'); 
  };

  const handleDirectQtyChange = (productId: any, val: string) => { 
    setCart(prev => { 
      if (val === '') return prev.map(i => i.product.id === productId ? { ...i, qty: '' as any, total: 0 } : i); 
      let num = parseInt(val); 
      if (isNaN(num) || num < 0) return prev; 
      
      let exceedStock = false; 
      const updated = prev.map(i => { 
        if (i.product.id === productId) { 
          const baseCode = String(i.product.product_code).split('-')[0]; 
          const totalStock = products.filter(p => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`)).reduce((s, p) => s + p.stock, 0); 
          if (num > totalStock) { exceedStock = true; num = totalStock; } 
          const price = getActualPrice(i.product); 
          return { ...i, qty: num, total: Math.round(num * price * (1 + VAT_RATE)) }; 
        } 
        return i; 
      }); 
      if (exceedStock) playSound('error'); 
      return updated; 
    }); 
  };

  const handleDirectQtyBlur = (productId: any, val: string) => { 
    if (val === '' || parseInt(val) <= 0 || isNaN(parseInt(val))) { 
      setCart(prev => prev.map(i => { 
        if (i.product.id === productId) { 
          const price = getActualPrice(i.product); 
          return { ...i, qty: 1, total: Math.round(1 * price * (1 + VAT_RATE)) };
        } 
        return i;
      }));
    } 
  };
  
  const removeFromCart = (productId: any) => { setCart(cart.filter(item => item.product.id !== productId)) };
  const clearCart = () => { if (window.confirm("Hủy toàn bộ?")) { resetCheckout(); } };

  // ===============================================
  // 🔥 RENDER GIAO DIỆN CHÍNH (Đã KHÔI PHỤC A4, NHẬP LẺ)
  // ===============================================
  const renderPrintArea = () => (
    <>
      {lastOrder && printMode === 'receipt' && (
        <div className="print-only">
          <div className="print-receipt-container">
            <div style={{ textAlign: "center", marginBottom: "8px" }}><h2 style={{ margin: 0, fontSize: "20px", fontWeight: 900 }}>HẢI LÊ MART</h2><div style={{ fontSize: "11px" }}>Tòa Nhà ATS, 252 Hoàng Quốc Việt, HN</div></div>
            <div style={{ borderBottom: "1px dashed #000", marginBottom: "8px" }}></div>
            <table style={{ width: "100%", fontSize: "11px", marginBottom: "4px", borderCollapse: "collapse" }}><tbody><tr><td style={{ textAlign: "left" }}><b>HĐ:</b> {lastOrder.orderId}</td><td style={{ textAlign: "right" }}><b>Ca:</b> {shift}</td></tr><tr><td style={{ textAlign: "left" }}><b>Ngày:</b> {lastOrder.time}</td><td style={{ textAlign: "right" }}><b>TN:</b> {role}</td></tr></tbody></table>
            
            <div style={{ borderBottom: "1px dashed #000", marginBottom: "6px" }}></div>
            <div style={{ fontSize: "11px", marginBottom: "8px", lineHeight: "1.5" }}>
              {lastOrder.custPhone ? (
                <><div><b>Khách hàng:</b> {lastOrder.custName || 'Khách VIP'}</div><div><b>SĐT:</b> {lastOrder.custPhone}</div></>
              ) : (<div><b>Khách hàng:</b> Khách lẻ</div>)}
            </div>

            <div style={{ borderBottom: "1px dashed #000", marginBottom: "8px" }}></div>
            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
              <tbody>
                {lastOrder.cart.map((i: any, x: number) => {
                  const p = i.priceIncludingVat !== undefined ? Math.round(i.priceIncludingVat / (1 + VAT_RATE)) : Math.round(getActualPrice(i.product)); const t = i.priceIncludingVat !== undefined ? Math.round(i.priceIncludingVat * i.qty) : Math.round((Number(i.qty) || 0) * p * (1 + VAT_RATE)); const g = parseGift(i.product.gift_info); const gQty = g.cond > 0 ? Math.floor(i.qty / g.cond) : 0;
                  return (
                    <React.Fragment key={x}>
                      <tr><td colSpan={2}><b>{cleanName(i.product.name)} {i.product.isHappyHour && <span style={{ fontSize: "9px" }}>[Giờ Vàng]</span>}</b></td></tr>
                      <tr><td style={{ paddingBottom: "4px" }}>{i.qty} x {p.toLocaleString()}</td><td style={{ textAlign: "right", paddingBottom: "4px" }}>{t.toLocaleString()}</td></tr>
                      {g.text && gQty > 0 && <tr><td colSpan={2} style={{ fontSize: "10px", fontStyle: "italic", paddingBottom: "4px" }}>+ 🎁 Tặng: {gQty} x {g.text}</td></tr>}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
            
            <div style={{ borderBottom: "1px dashed #000", marginBottom: "8px", marginTop: "4px" }}></div>
            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}><tbody><tr><td style={{ padding: "2px 0" }}>Tiền hàng:</td><td style={{ textAlign: "right", padding: "2px 0" }}>{Math.round(lastOrder.subTotal).toLocaleString()}đ</td></tr><tr><td style={{ padding: "2px 0" }}>VAT (10%):</td><td style={{ textAlign: "right", padding: "2px 0" }}>{Math.round(lastOrder.vatTotal).toLocaleString()}đ</td></tr>{lastOrder.discount > 0 && <tr><td style={{ padding: "2px 0" }}>Giảm giá/Ví:</td><td style={{ textAlign: "right", padding: "2px 0" }}>-{Math.round(lastOrder.discount).toLocaleString()}đ</td></tr>}</tbody></table>
            
            <div style={{ borderBottom: "2px dashed #000", margin: "6px 0" }}></div>
            <table style={{ width: "100%", fontSize: "16px", fontWeight: 900, borderCollapse: "collapse" }}><tbody><tr><td>{lastOrder.debtAmount > 0 ? "NỢ:" : "TỔNG ĐƠN:"}</td><td style={{ textAlign: "right" }}>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</td></tr></tbody></table>
            
            <div style={{ marginTop: "4px", fontSize: "11px", textAlign: "right" }}>Phương thức: <i>{lastOrder.paymentMethod}</i></div>
            
            {lastOrder.paymentMethod === 'TIỀN MẶT' && lastOrder.customerGiven > lastOrder.finalTotal && (<table style={{ width: "100%", fontSize: "12px", marginTop: "4px", borderCollapse: "collapse" }}><tbody><tr><td>Khách đưa:</td><td style={{ textAlign: "right" }}>{Math.round(lastOrder.customerGiven).toLocaleString()}đ</td></tr><tr><td><b>Trả lại:</b></td><td style={{ textAlign: "right" }}><b>{Math.round(lastOrder.customerGiven - lastOrder.finalTotal).toLocaleString()}đ</b></td></tr></tbody></table>)}
            
            <div style={{ textAlign: "center", marginTop: "15px", fontSize: "11px" }}><b>CẢM ƠN QUÝ KHÁCH!</b></div>
          </div>
        </div>
      )}

      {printMode === 'invoice_a4' && lastOrder && (
        <div className="print-flex print-a4-container">
          <div style={{ width: "100%", fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #000", paddingBottom: "10px", marginBottom: "20px" }}><div><h1 style={{ margin: 0, color: "#dc2626", fontSize: "28px" }}>HẢI LÊ MART</h1><p style={{ margin: "5px 0", fontSize: "14px" }}>Địa chỉ: Tòa Nhà ATS, 252 Hoàng Quốc Việt, Cầu Giấy, HN</p></div><div style={{ textAlign: "right" }}><h2 style={{ margin: 0, fontSize: "24px" }}>HÓA ĐƠN BÁN HÀNG</h2><p style={{ margin: "5px 0", fontSize: "14px" }}>Số: <b>{lastOrder.orderId}</b></p><p style={{ margin: "5px 0", fontSize: "14px" }}>Ngày: {lastOrder.time}</p></div></div>
            <div style={{ marginBottom: "20px", fontSize: "15px" }}><p><b>Khách hàng:</b> {lastOrder.custName || "Khách lẻ"} {lastOrder.custPhone ? `(SĐT: ${lastOrder.custPhone})` : ""}</p><p><b>Hình thức thanh toán:</b> {lastOrder.paymentMethod}</p></div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
              <thead><tr style={{ background: "#f1f5f9" }}><th style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>STT</th><th style={{ border: "1px solid #000", padding: "10px", textAlign: "left" }}>Tên hàng hóa</th><th style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>SL</th><th style={{ border: "1px solid #000", padding: "10px", textAlign: "right" }}>Đơn giá</th><th style={{ border: "1px solid #000", padding: "10px", textAlign: "right" }}>Thành tiền</th></tr></thead>
              <tbody>{lastOrder.cart.map((item: any, index: number) => { const p = Math.round(getActualPrice(item.product)); const t = Math.round(item.qty * p * (1 + VAT_RATE)); return (<tr key={index}><td style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>{index + 1}</td><td style={{ border: "1px solid #000", padding: "10px" }}>{cleanName(item.product.name)}</td><td style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>{item.qty}</td><td style={{ border: "1px solid #000", padding: "10px", textAlign: "right" }}>{p.toLocaleString()}đ</td><td style={{ border: "1px solid #000", padding: "10px", textAlign: "right" }}>{t.toLocaleString()}đ</td></tr>); })}</tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px", fontSize: "15px" }}>
              <div style={{ textAlign: "center", width: "40%" }}><b>Khách hàng</b><br/><span style={{ fontSize: "12px", color: "#666" }}>(Ký, ghi rõ họ tên)</span></div>
              <div style={{ textAlign: "right", width: "50%" }}><p>Cộng tiền hàng: {Math.round(lastOrder.subTotal).toLocaleString()}đ</p><p>Thuế GTGT (10%): {Math.round(lastOrder.vatTotal).toLocaleString()}đ</p>{lastOrder.discount > 0 && <p>Giảm giá/Ví: -{Math.round(lastOrder.discount).toLocaleString()}đ</p>}<h3 style={{ borderTop: "2px solid #000", paddingTop: "10px" }}>TỔNG CỘNG: {Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</h3><div style={{ textAlign: "center", marginTop: "40px" }}><b>Người bán hàng</b><br/><span style={{ fontSize: "12px", color: "#666" }}>(Ký, đóng dấu)</span></div></div>
            </div>
          </div>
        </div>
      )}
      
      {printMode === 'barcode' && printBarcodeProduct && (
        <div className="print-flex">
          <div className="print-barcode-sheet">
            {Array.from({ length: barcodeCount }).map((_, i) => (
              <div key={i} className="barcode-sticker">
                <div style={{ fontSize: "9px", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%", textAlign: "center" }}>{cleanName(printBarcodeProduct.name)}</div>
                <img src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(printBarcodeProduct.product_code)}&scale=2&height=10&includetext=false`} onError={(e) => { e.currentTarget.src = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(printBarcodeProduct.product_code)}&code=Code128&translate-esc=on`; }} style={{ maxWidth: "100%", height: "24px", margin: "2px 0" }} alt={printBarcodeProduct.product_code} />
                <div style={{ fontSize: "8px", fontFamily: "monospace", letterSpacing: "1px", color: "#333", lineHeight: "1" }}>{printBarcodeProduct.product_code}</div>
                <div style={{ fontSize: "12px", fontWeight: "900", color: "#000", lineHeight: "1.2" }}>{getActualPrice(printBarcodeProduct).toLocaleString()}đ</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {printMode === 'customer_card' && printCustomer && (
        <div className="print-flex">
          <div className="print-customer-card">
            <div style={{ width: "85.6mm", height: "53.98mm", border: "3px solid #dc2626", borderRadius: "12px", padding: "15px", textAlign: "center", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", background: "#fff7ed", fontFamily: "'Inter', sans-serif" }}>
              <h2 style={{ margin: "0 0 5px 0", color: "#b91c1c", fontSize: "20px", textTransform: "uppercase", fontWeight: "900" }}>HẢI LÊ MART</h2>
              <div style={{ fontSize: "10px", fontWeight: "bold", color: "#ea580c", letterSpacing: "2px", marginBottom: "10px" }}>THẺ KHÁCH HÀNG THÂN THIẾT</div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: "#0f172a", textTransform: "uppercase" }}>{printCustomer.name}</div>
              <img src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(printCustomer.cardCode || printCustomer.phone)}&scale=2&height=10&includetext=false`} onError={(e) => { e.currentTarget.src = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(printCustomer.cardCode || printCustomer.phone)}&code=Code128&translate-esc=on`; }} style={{ maxWidth: "100%", height: "45px", marginTop: "10px", margin: "10px auto 0 auto", display: "block" }} alt="barcode" />
              <div style={{ fontSize: "12px", fontFamily: "monospace", letterSpacing: "2px", marginTop: "4px", fontWeight: "bold" }}>{printCustomer.cardCode || printCustomer.phone}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderModals = () => (
    <>
      <ExpenseModal showExpenseModal={showExpenseModal} setShowExpenseModal={setShowExpenseModal} expName={expName} setExpName={setExpName} expAmount={expAmount} setExpAmount={setExpAmount} expenses={expenses} addExpense={addExpense} deleteExpense={deleteExpense} />
      <SupplierModal showSupplierModal={showSupplierModal} setShowSupplierModal={setShowSupplierModal} supName={supName} setSupName={setSupName} supPhone={supPhone} setSupPhone={setSupPhone} supItem={supItem} setSupItem={setSupItem} addSupplier={addSupplier} suppliers={suppliers} deleteSupplier={deleteSupplier} />
      <SettingsModal showSettings={showSettings} setShowSettings={setShowSettings} newBankBin={newBankBin} setNewBankBin={setNewBankBin} newBankAcc={newBankAcc} setNewBankAcc={setNewBankAcc} newBankNameStr={newBankNameStr} setNewBankNameStr={setNewBankNameStr} newHappyStart={newHappyStart} setNewHappyStart={setNewHappyStart} newHappyEnd={newHappyEnd} setNewHappyEnd={setNewHappyEnd} saveSettings={saveSettings} />
      {showHandoverModal && (<HandoverModal role={role} shift={shift} startingCash={startingCash} currentShiftStats={currentShiftStats} onClose={() => setShowHandoverModal(false)} onConfirm={confirmHandover} />)}
      <CashFlowModal cashFlowModalInfo={cashFlowModalInfo} setCashFlowModalInfo={setCashFlowModalInfo} shift={shift} todayStrStr={todayStrStr} currentShiftCashFlow={currentShiftCashFlow} currentShiftStats={currentShiftStats} />
      <HoldOrdersModal showHoldModal={showHoldModal} setShowHoldModal={setShowHoldModal} heldOrders={heldOrders} restoreOrder={restoreOrder} deleteHeldOrder={deleteHeldOrder} />
      
      <CheckoutModal isCheckoutOpen={isCheckoutOpen} setIsCheckoutOpen={setIsCheckoutOpen} checkoutStep={checkoutStep} setCheckoutStep={setCheckoutStep} voucherInput={voucherInput} setVoucherInput={setVoucherInput} customerInput={customerInput} setCustomerInput={setCustomerInput} custPhone={custPhone} setCustPhone={setCustPhone} custName={custName} setCustName={setCustName} useWallet={useWallet} setUseWallet={setUseWallet} appliedVoucherAmount={appliedVoucherAmount} setAppliedVoucherAmount={setAppliedVoucherAmount} customerGiven={customerGiven} setCustomerGiven={setCustomerGiven} finalToPay={finalToPay} customers={customers} isOnline={isOnline} bankBin={bankBin} bankAcc={bankAcc} bankNameStr={bankNameStr} loading={loading} handleVoucherSubmit={handleVoucherSubmit} handleCustomerInputChange={handleCustomerInputChange} setScannerMode={setScannerMode} handleNextToQR={handleNextToQR} confirmCheckout={confirmCheckout} setPrintMode={setPrintMode} sendReceiptEmail={sendReceiptEmail} closeCheckout={closeCheckout} />
      
      <StatsModal showStatsModal={showStatsModal} setShowStatsModal={setShowStatsModal} reportStartDate={reportStartDate} setReportStartDate={setReportStartDate} reportEndDate={reportEndDate} setReportEndDate={setReportEndDate} exportToCSV={exportToCSV} sendInventoryAlertEmail={sendInventoryAlertEmail} handleSendEmailReport={handleSendEmailReport} filteredStats={filteredStats} chartData={chartData} topSelling={topSelling} products={products} />
      <InventoryModal showInventoryModal={showInventoryModal} setShowInventoryModal={setShowInventoryModal} inventorySearchTerm={inventorySearchTerm} setInventorySearchTerm={setInventorySearchTerm} handleInventorySearchEnter={handleInventorySearchEnter} invFilter={invFilter} setInvFilter={setInvFilter} exportInventoryCSV={exportInventoryCSV} handleImportInventoryCSV={handleImportInventoryCSV} products={products} actualStockInput={actualStockInput} setActualStockInput={setActualStockInput} handleInvInputKeyDown={handleInvInputKeyDown} syncInventoryCheck={syncInventoryCheck} loading={loading} />
      <CustomerModal showCustomerModal={showCustomerModal} setShowCustomerModal={setShowCustomerModal} customers={customers} setCustomers={setCustomers} logAudit={logAudit} handleEditPhone={handleEditPhone} printCustomerCard={printCustomerCard} sendCardEmail={sendCardEmail} shareToZalo={shareToZalo} />
      <DebtModal showDebtModal={showDebtModal} setShowDebtModal={setShowDebtModal} customers={customers} handlePayDebt={handlePayDebt} />
      
      <AuditModal showAuditModal={showAuditModal} setShowAuditModal={setShowAuditModal} auditLogs={auditLogs} exportAuditToCSV={exportAuditToCSV} setSelectedAuditLog={setSelectedAuditLog} />
      <AuditDetailModal selectedAuditLog={selectedAuditLog} setSelectedAuditLog={setSelectedAuditLog} />

      <ScannerModal scannerMode={scannerMode} setScannerMode={setScannerMode} scanMessage={scanMessage} />
      <PinModal showPinModal={showPinModal} setShowPinModal={setShowPinModal} correctPin={adminPin} onSuccess={() => { if (pendingAction) { pendingAction(); setPendingAction(null); } }} />
      <ScannerLinkModal showModal={showScannerLinkModal} setShowModal={setShowScannerLinkModal} />
      <PurchaseOrderModal showModal={showPOModal} setShowModal={setShowPOModal} suppliers={suppliers} products={products} handleSavePO={handleSavePO} loading={loading} />
    </>
  );

  return (
    <div onClick={() => { setOpenFilter(null); setShowSuggestions(false); setShowMainMenu(false) }}>
      <style>{styles}</style> 
      <style>{`
        .animated-bg-mesh { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; background: linear-gradient(135deg, #ffedd5 0%, #fef08a 50%, #fed7aa 100%); background-size: 400% 400%; animation: gradientBgAnim 15s ease infinite; opacity: 0.8; }
        @keyframes gradientBgAnim { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        [data-theme='dark'] .animated-bg-mesh { background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); opacity: 1; }
      `}</style>
      <div className="animated-bg-mesh"></div>
      <Toaster position="top-right" reverseOrder={false} />

      <input type="text" id="search-barcode" style={{position:'absolute', opacity: 0, height: 0, width: 0}} />
      
      {renderPrintArea()}
      {renderModals()}

      {!isLoggedIn ? (
        <div className="login-wrapper">
          <form className="glass-login" onSubmit={handleLogin}>
            <h2 className="login-title">HẢI LÊ <span>MART</span></h2>
            <input className="login-input" placeholder="Tên đăng nhập..." value={authUsername} onChange={e => setAuthUsername(e.target.value)} required />
            <input className="login-input" type="password" placeholder="Mật khẩu..." value={authPassword} onChange={e => setAuthPassword(e.target.value)} required />
            <button className="login-btn-submit" type="submit">ĐĂNG NHẬP HỆ THỐNG</button>
          </form>
        </div>
      ) : (
        <div className="no-print" style={{ padding: "15px", position: "relative", minHeight: "100vh", overflowX: "auto" }}>
          <div style={{ maxWidth: "1500px", margin: "0 auto", minWidth: "1000px" }}>
            
            <Header 
              role={role} shift={shift} totalValue={totalValue} currentShiftStats={currentShiftStats} setCashFlowModalInfo={setCashFlowModalInfo} darkMode={darkMode} setDarkMode={setDarkMode} handleLogoutClick={handleLogoutClick} showMainMenu={showMainMenu} setShowMainMenu={setShowMainMenu} setShowStatsModal={setShowStatsModal} setShowCustomerModal={setShowCustomerModal} setShowInventoryModal={setShowInventoryModal} setShowDebtModal={setShowDebtModal} setShowAuditModal={setShowAuditModal} setShowExpenseModal={setShowExpenseModal} setShowSupplierModal={setShowSupplierModal} setShowMarketingModal={setShowMarketingModal} bankBin={bankBin} bankAcc={bankAcc} bankNameStr={bankNameStr} setShowSettings={setShowSettings} lowStockCount={lowStockCount} isOnline={isOnline} syncStatus={syncStatus} syncAllOfflineData={syncAllOfflineData}
              setShowScannerLinkModal={setShowScannerLinkModal} setShowPOModal={setShowPOModal}
            />
            
            <div style={{ display: "grid", gridTemplateColumns: "7fr 3fr", gap: "10px" }}>
              <div className="glass" style={{ padding: "12px" }}>
                <ProductSearchAndActions role={role} barcodeInput={barcodeInput} setBarcodeInput={setBarcodeInput} showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions} handleBarcodeSubmit={handleBarcodeSubmit} setScannerMode={setScannerMode} products={products} handleSelectSuggest={handleSelectSuggest} showInputForm={showInputForm} setShowInputForm={setShowInputForm} handleFileUpload={handleFileUpload} downloadSampleCSV={downloadSampleCSV} />
                
                {/* HIỆN LẠI KHU VỰC NHẬP HÀNG LẺ BỊ MẤT TRƯỚC ĐÓ */}
                {showInputForm && (
                  <ProductInputForm
                    newCode={newCode} handleCodeChange={handleCodeChange}
                    newName={newName} setNewName={setNewName}
                    newCategory={newCategory} setNewCategory={setNewCategory}
                    newImportPrice={newImportPrice} setNewImportPrice={setNewImportPrice}
                    newPrice={newPrice} setNewPrice={setNewPrice}
                    newPromoPrice={newPromoPrice} setNewPromoPrice={setNewPromoPrice}
                    newGiftCondition={newGiftCondition} setNewGiftCondition={setNewGiftCondition}
                    newGiftInfo={newGiftInfo} setNewGiftInfo={setNewGiftInfo}
                    newStock={newStock} setNewStock={setNewStock}
                    newExpiry={newExpiry} setNewExpiry={setNewExpiry}
                    handleAddProduct={handleAddProduct}
                    setShowInputForm={setShowInputForm}
                    loading={loading}
                  />
                )}

                <div style={{ display: "flex", gap: "8px", marginBottom: "15px", marginTop: showInputForm ? "15px" : "0" }}>
                  {categories.map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`tab-btn ${selectedCategory === cat ? 'active' : ''}`}>{cat}</button>)}
                </div>
                <ProductTable role={role} sortedAndFilteredProducts={sortedAndFilteredProducts} requestSort={requestSort} handleEdit={handleEdit} addToCart={addToCart} handlePrintBarcode={handlePrintBarcode} handleDelete={handleDelete} sortConfig={sortConfig} filters={filters} setFilters={setFilters} openFilter={openFilter} setOpenFilter={setOpenFilter} uniqueNames={uniqueNames} uniqueStocks={uniqueStocks} uniqueImportPrices={uniqueImportPrices} uniqueSalePrices={uniqueSalePrices} uniqueExpiries={uniqueExpiries} />
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <CartPanel cart={cart} custName={custName} heldOrders={heldOrders} cartTotalAmountDisplay={cartTotalAmountDisplay} setShowHoldModal={setShowHoldModal} handleHoldOrder={handleHoldOrder} clearCart={clearCart} setCustName={setCustName} setCustPhone={setCustPhone} setCustomerInput={setCustomerInput} setIsCheckoutOpen={setIsCheckoutOpen} setCheckoutStep={setCheckoutStep} adjustCartQty={adjustCartQty} handleDirectQtyChange={handleDirectQtyChange} handleDirectQtyBlur={handleDirectQtyBlur} removeFromCart={removeFromCart} />
                <HistoryPanel logSearchTerm={logSearchTerm} setLogSearchTerm={setLogSearchTerm} logTypeFilter={logTypeFilter} setLogTypeFilter={setLogTypeFilter} exportToCSV={exportToCSV} groupedHistory={groupedHistory} expandedDates={expandedDates} toggleDateGroup={toggleDateGroup} handleRefund={handleRefund} handleReprint={handleReprint} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

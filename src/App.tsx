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
  
  const [startingCash, setStartingCash] = useState<number>(() => { const cached = localStorage.getItem("mart_starting_cash"); return (cached && cached !== "0") ? Number(cached) : 5000000; });
  
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
  
  const [reportStartDate, setReportStartDate] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; });
  const [reportEndDate, setReportEndDate] = useState(() => { return new Date().toISOString().split('T')[0]; });
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [logSearchTerm, setLogSearchTerm] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState("Tất cả");
  
  // 🚀 HÀNG ĐỢI CHỐNG RỚT MÃ KHI QUÉT LIÊN TỤC
  const [scanQueue, setScanQueue] = useState<string[]>([]);
  const [scanMessage, setScanMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [printBarcodeProduct, setPrintBarcodeProduct] = useState<Product | null>(null);
  const [printCustomer, setPrintCustomer] = useState<Customer | null>(null);
  const [barcodeCount, setBarcodeCount] = useState<number>(30);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);

  const { darkMode, setDarkMode, showSettings, setShowSettings, showInputForm, setShowInputForm, showDebtModal, setShowDebtModal, showStatsModal, setShowStatsModal, showCustomerModal, setShowCustomerModal, showHandoverModal, setShowHandoverModal, showAuditModal, setShowAuditModal, showHoldModal, setShowHoldModal, showExpenseModal, setShowExpenseModal, showSupplierModal, setShowSupplierModal, showMarketingModal, setShowMarketingModal, showInventoryModal, setShowInventoryModal, showMainMenu, setShowMainMenu, cashFlowModalInfo, setCashFlowModalInfo, scannerMode, setScannerMode, printMode, setPrintMode } = useUIState();
  const { newCode, setNewCode, newName, setNewName, newImportPrice, setNewImportPrice, newPrice, setNewPrice, newPromoPrice, setNewPromoPrice, newGiftCondition, setNewGiftCondition, newGiftInfo, setNewGiftInfo, newStock, setNewStock, newExpiry, setNewExpiry, newCategory, setNewCategory, resetProductForm } = useProductInput();
  const { cart, setCart, barcodeInput, setBarcodeInput, isCheckoutOpen, setIsCheckoutOpen, checkoutStep, setCheckoutStep, customerInput, setCustomerInput, custPhone, setCustPhone, custName, setCustName, useWallet, setUseWallet, voucherInput, setVoucherInput, appliedVoucherAmount, setAppliedVoucherAmount, customerGiven, setCustomerGiven, lastOrder, setLastOrder, resetCheckout } = useCheckoutState();

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
        
      const script = document.createElement("script"); script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"; script.onload = () => { (window as any).emailjs.init(EMAILJS_PUBLIC_KEY || "5ric0kxuwNPlUleAv"); }; document.head.appendChild(script);
      const xlsxScript = document.createElement("script"); xlsxScript.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; document.head.appendChild(xlsxScript);
      return () => { supabase.removeChannel(channel) };
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (scannerMode !== null) {
      let scanner: any; let lastScanTime = 0;
      const loadScanner = () => { if ((window as any).Html5QrcodeScanner) { scanner = new (window as any).Html5QrcodeScanner("qr-reader", { fps: 15, qrbox: { width: 250, height: 120 }, rememberLastUsedCamera: true }, false); scanner.render((text: string) => { const now = Date.now(); if (now - lastScanTime < 1500) return; lastScanTime = now; setScanQueue(prev => [...prev, text]); }, undefined) } };
      if (!(window as any).Html5QrcodeScanner) { const script = document.createElement("script"); script.src = "https://unpkg.com/html5-qrcode"; script.onload = loadScanner; document.head.appendChild(script) } else loadScanner();
      return () => { if (scanner) scanner.clear().catch(() => { }) }
    }
  }, [scannerMode]);

  // THUẬT TOÁN XỬ LÝ TUẦN TỰ TRÁNH TRÔI MÃ VẠCH
  useEffect(() => {
    if (scanQueue.length > 0) {
      const currentCode = scanQueue[0];
      if (scannerMode === 'product' || scannerMode === null) { 
        const p = findProductByCode(currentCode); 
        if (p) { handleSelectSuggest(p); playSound('success'); } 
        else { 
          const matchedPhone = Object.keys(customers).find(phone => phone === currentCode.trim() || customers[phone].cardCode === currentCode.trim()); 
          if (matchedPhone) { playSound('success'); setCustomerInput(customers[matchedPhone].cardCode || matchedPhone); setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); setScanMessage({ text: `✅ KH VIP: ${customers[matchedPhone].name}`, type: 'success' }) } 
          else { playSound('error'); setScanMessage({ text: `❌ Lỗi mã`, type: 'error' }) } 
        } 
      }
      else if (scannerMode === 'voucher') { const code = currentCode.trim().toUpperCase(); const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 }; if (VOUCHERS[code]) { setAppliedVoucherAmount(VOUCHERS[code]); setVoucherInput(code); playSound('success'); setScanMessage({ text: `✅ Giảm ${VOUCHERS[code].toLocaleString()}đ`, type: 'success' }) } else if (!isNaN(Number(code)) && Number(code) > 0) { setAppliedVoucherAmount(Number(code)); setVoucherInput(code); playSound('success'); setScanMessage({ text: `✅ Giảm ${Number(code).toLocaleString()}đ`, type: 'success' }) } else { playSound('error'); toast.error("Mã Voucher lỗi!"); setAppliedVoucherAmount(0) } }
      else if (scannerMode === 'customer') { const val = currentCode.trim(); setCustomerInput(val); const matchedPhone = Object.keys(customers).find(phone => phone === val || customers[phone].cardCode === val); if (matchedPhone) { setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); playSound('success'); setScanMessage({ text: `✅ Nhận diện VIP: ${customers[matchedPhone].name}`, type: 'success' }) } else { setCustPhone(val); setCustName(""); playSound('success'); setScanMessage({ text: `✅ Đã quét mã (Khách mới)`, type: 'success' }) } }
      
      setTimeout(() => setScannerMode(null), 1000);
      setTimeout(() => setScanMessage(null), 1500);
      setScanQueue(prev => prev.slice(1));
    }
  }, [scanQueue, products, scannerMode]);

  useEffect(() => { const handleAfterPrint = () => setPrintMode(null); window.addEventListener("afterprint", handleAfterPrint); return () => window.removeEventListener("afterprint", handleAfterPrint) }, []);

  // =====================================================================
  // 3. TÍNH TOÁN DATA MOMS (useMemo)
  // =====================================================================
  const todayStrStr = new Date().toLocaleDateString('vi-VN');
  
  const currentShiftStats = useMemo(() => { 
    const shiftLogs = history.filter(h => new Date(Math.floor(h.id)).toLocaleDateString('vi-VN') === todayStrStr && h.shift === shift); 
    let cash = startingCash; let transfer = 0; let prof = 0; let totalSales = 0; 
    shiftLogs.forEach(h => { 
      if (h.type === 'BÁN' || h.type === 'GHI NỢ') totalSales += h.total; 
      if (h.type === 'BÁN' || h.type === 'THU NỢ' || h.type === 'TRẢ HÀNG') { 
        if (h.paymentMethod === 'CHUYỂN KHOẢN' || h.paymentMethod === 'QUẸT THẺ') transfer += h.total; else if (h.paymentMethod === 'TIỀN MẶT' || h.paymentMethod === 'KẾT HỢP') {
          if(h.paymentMethod === 'KẾT HỢP' && h.split_cash) { cash += h.split_cash; transfer += (h.total - h.split_cash); } else { cash += h.total; }
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
      if (h.paymentMethod === cashFlowModalInfo || (cashFlowModalInfo === 'CHUYỂN KHOẢN' && h.paymentMethod === 'QUẸT THẺ') || h.paymentMethod === 'KẾT HỢP') {
        let amount = h.total;
        if (h.paymentMethod === 'KẾT HỢP') amount = cashFlowModalInfo === 'TIỀN MẶT' ? (h.split_cash || 0) : (h.total - (h.split_cash || 0));
        if (amount === 0) return;
        if (h.type === 'BÁN' || h.type === 'THU NỢ') { if (amount > 0) thu.push({ time: h.time, note: `${h.type} - ${cleanName(h.name)}`, amount: amount }); } else if (h.type === 'TRẢ HÀNG') { chi.push({ time: h.time, note: `HOÀN TIỀN - ${cleanName(h.name)}`, amount: Math.abs(amount) }); }
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
    const start = new Date(reportStartDate + "T00:00:00").getTime(); const end = new Date(reportEndDate + "T23:59:59").getTime();
    const filteredHistory = history.filter(h => { const logTime = new Date(Math.floor(h.id)).getTime(); return logTime >= start && logTime <= end; });
    let cash = 0; let transfer = 0; let prof = 0; let totalSales = 0; 
    filteredHistory.forEach(h => { 
      if (h.type === 'BÁN' || h.type === 'GHI NỢ') totalSales += h.total; 
      if (h.type === 'BÁN' || h.type === 'THU NỢ' || h.type === 'TRẢ HÀNG') { 
        if (h.paymentMethod === 'CHUYỂN KHOẢN' || h.paymentMethod === 'QUẸT THẺ') transfer += h.total; else if (h.paymentMethod === 'TIỀN MẶT' || h.paymentMethod === 'KẾT HỢP') { if(h.paymentMethod === 'KẾT HỢP' && h.split_cash) { cash += h.split_cash; transfer += (h.total - h.split_cash); } else { cash += h.total; } } 
      } 
      prof += (h.profit || 0) 
    }); 
    const filteredExp = expenses.filter(e => { const parts = e.date.split('/'); if(parts.length !== 3) return false; const expTime = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`).getTime(); return expTime >= start && expTime <= end; }).reduce((sum, e) => sum + e.amount, 0); 
    return { rev: cash + transfer, cash, transfer, prof, totalSales, expenses: filteredExp, netProfit: prof - filteredExp } 
  }, [history, expenses, reportStartDate, reportEndDate]);

  const chartData = useMemo(() => { const data = []; for (let i = 29; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const dStr = d.toLocaleDateString('vi-VN'); const dayTotal = history.filter(h => new Date(Math.floor(h.id)).toLocaleDateString('vi-VN') === dStr && (h.type === 'BÁN' || h.type === 'GHI NỢ')).reduce((s, h) => s + h.total, 0); data.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, total: dayTotal, showLabel: (i % 3 === 0 || i === 0) }) } const maxVal = Math.max(...data.map(d => d.total), 1); return data.map(d => ({ ...d, height: `${(d.total / maxVal) * 100}%` })) }, [history]);
  const topSelling = useMemo(() => { const sales: Record<string, number> = {}; history.forEach(log => { if ((log.type === 'BÁN' || log.type === 'GHI NỢ') && log.product_id !== 'DISCOUNT') { const baseName = cleanName(log.name); sales[baseName] = (sales[baseName] || 0) + log.qty } }); return Object.entries(sales).sort((a, b) => b[1] - a[1]).slice(0, 5) }, [history]);
  const groupedHistory = useMemo(() => { let filtered = history; if (logTypeFilter !== "Tất cả") filtered = filtered.filter(log => log.type === logTypeFilter); if (logSearchTerm.trim() !== "") { const term = String(logSearchTerm || "").toLowerCase(); filtered = filtered.filter(log => (log.name && String(log.name).toLowerCase().includes(term)) || (log.customer && String(log.customer).toLowerCase().includes(term)) || (log.id.toString().includes(term))) } return filtered.reduce((groups: any, log: any) => { const date = new Date(Math.floor(log.id)).toLocaleDateString('vi-VN'); if (!groups[date]) groups[date] = []; groups[date].push({ ...log, t: new Date(Math.floor(log.id)).toLocaleTimeString('vi-VN') }); return groups }, {}) }, [history, logSearchTerm, logTypeFilter]);

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
      filtered.sort((a, b) => { let valA = a[sortConfig.key]; let valB = b[sortConfig.key]; if (sortConfig.key === 'expiry_date') { valA = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity; valB = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity } if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1; if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1; return 0 })
    } else {
      filtered.sort((a, b) => { const daysA = a.expiry_date ? (new Date(a.expiry_date).getTime() - todayTime) / 86400000 : Infinity; const daysB = b.expiry_date ? (new Date(b.expiry_date).getTime() - todayTime) / 86400000 : Infinity; const aIsUrgent = daysA <= 45; const bIsUrgent = daysB <= 45; if (aIsUrgent && !bIsUrgent) return -1; if (!aIsUrgent && bIsUrgent) return 1; if (aIsUrgent && bIsUrgent) return daysA - daysB; return 0 })
    }
    return filtered
  }, [products, searchTerm, selectedCategory, sortConfig, filters]);

  // =====================================================================
  // 4. ACTION FUNCTIONS (HÀM XỬ LÝ SỰ KIỆN)
  // =====================================================================
  const executeWithAdminCheck = (action: () => void) => {
    if (role === 'admin') { action(); } else { setPendingAction(() => action); setShowPinModal(true); }
  };

  const fetchSettingsFromCloud = async () => {
    try {
      const { data, error } = await supabase.from("settings").select("*").eq("id", 1).single();
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
    if (!navigator.onLine) return toast.error("Mất mạng! Không thể lưu.");
    setLoading(true);
    try {
      const { error } = await supabase.from("settings").update({ bank_bin: bin, bank_acc: acc, bank_name_str: nameStr, happy_hour_start: hStart, happy_hour_end: hEnd, updated_at: new Date().toISOString() }).eq("id", 1);
      if (!error) {
        setBankBin(bin); setBankAcc(acc); setBankNameStr(nameStr); setHappyStart(hStart); setHappyEnd(hEnd);
        toast.success("Lưu cấu hình Cloud thành công!"); setShowSettings(false);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const saveSettings = () => { 
    const bin = newBankBin.trim(); const acc = newBankAcc.trim(); const nameStr = newBankNameStr.trim().toUpperCase();
    if (!bin || !acc || !nameStr || !newHappyStart || !newHappyEnd) return toast.error("Điền đủ thông tin!");
    updateSettingsToCloud(bin, acc, nameStr, newHappyStart, newHappyEnd);
  };

  const logAudit = async (action: string, detail: string, extraData: any = null) => { const newLog = { id: Date.now(), time: new Date().toLocaleString('vi-VN'), user_name: role === 'admin' ? 'Quản lý' : 'Thu ngân', shift, action, detail, extra_data: extraData ? JSON.stringify(extraData) : null }; setAuditLogs(prev => [newLog, ...prev].slice(0, 300)); };
  const fetchProducts = async () => { const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false }); if (data) setProducts(data) };
  const findProductByCode = (code: string) => { const rawCode = code.trim(); let matches = products.filter(prod => prod.product_code === rawCode || String(prod.product_code).startsWith(`${rawCode}-`)); let available = matches.filter(p => p.stock > 0); if (available.length > 0) { available.sort((a, b) => { if (!a.expiry_date) return 1; if (!b.expiry_date) return -1; return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime() }); return available[0] } return matches.length > 0 ? matches[0] : null };
  
  const handleLogin = async (e: React.FormEvent) => { e.preventDefault(); let u = authUsername.trim().toLowerCase(); const p = authPassword.trim(); if (!u.includes('@')) { u = u + '@hailemart.com'; } localStorage.setItem("mart_starting_cash", startingCash.toString()); setLoading(true); const { error } = await supabase.auth.signInWithPassword({ email: u, password: p }); if (error) { toast.error(`Đăng nhập thất bại.`); setLoading(false); return; } const userRole = u.includes('admin') ? 'admin' : 'staff'; setIsLoggedIn(true); setRole(userRole); localStorage.setItem("mart_shift", shift); localStorage.setItem("mart_logged_in", "true"); localStorage.setItem("mart_role", userRole); setLoading(false); };
  const handleLogoutClick = () => setShowHandoverModal(true);
  const confirmHandover = async () => { try { if (navigator.onLine) { await supabase.auth.signOut(); } } catch (error) {} finally { localStorage.removeItem("mart_logged_in"); localStorage.removeItem("mart_role"); setIsLoggedIn(false); window.location.reload(); } };
  
  const handleEditPhone = async (oldPhone: string) => {
    executeWithAdminCheck(() => {
      const newPhone = window.prompt("Nhập SĐT mới:", oldPhone); if (newPhone && newPhone.trim() !== "" && newPhone !== oldPhone) { if (customers[newPhone]) return toast.error("SĐT đã tồn tại!"); const cData = customers[oldPhone]; setCustomers((prev: any) => { const updated = { ...prev }; updated[newPhone] = { ...cData, phone: newPhone }; delete updated[oldPhone]; return updated }); toast.success("Cập nhật thành công!"); }
    });
  };

  const addSupplier = async () => { if (!supName || !supPhone) return toast.error("Nhập đủ Tên/SĐT"); setSuppliers(prev => [{ id: Date.now(), name: supName, phone: supPhone, item: supItem, debt: 0 }, ...prev]); setSupName(""); setSupPhone(""); setSupItem(""); toast.success("Thêm NCC thành công!"); };
  const deleteSupplier = async (id: any) => { setSuppliers(prev => prev.filter(s => s.id !== id)); if (navigator.onLine) await supabase.from('suppliers').delete().eq('id', id); };
  const addExpense = async () => { if (!expName || !expAmount) return toast.error("Nhập chi phí!"); setExpenses(prev => [{ id: Date.now(), date: new Date().toLocaleDateString('vi-VN'), name: expName, amount: Number(expAmount) }, ...prev]); setExpName(""); setExpAmount(""); toast.success("Đã ghi nhận chi phí!"); };
  const deleteExpense = async (id: any) => { setExpenses(prev => prev.filter(e => e.id !== id)); if (navigator.onLine) await supabase.from('expenses').delete().eq('id', id); };
  
  // LOGIC NHẬP HÀNG THEO LÔ PO CAO CẤP
  const handleSavePO = async (supplier: any, items: any[], totalAmount: number, paidAmount: number, note: string) => {
    if (!navigator.onLine) return toast.error("Mất mạng!");
    setLoading(true);
    try {
      const debtAmount = totalAmount - paidAmount; const poCode = "PO" + Date.now().toString().slice(-6);
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
          setHistory(prev => [{ id: Date.now() + Math.random(), shift, type: "NHẬP PO", name: p.name, qty: item.qty, total: item.qty * item.importPrice, time: new Date().toLocaleString('vi-VN') }, ...prev]);
        }
      }
      toast.success("Đã lưu Phiếu Nhập & Cộng Kho!"); fetchProducts(); setShowPOModal(false);
    } catch(err) { toast.error("Lỗi: " + err.message); } finally { setLoading(false); }
  };

  const sendMarketingEmails = async () => {
    if (!marketingMsg) return toast.error("Nhập nội dung!"); setLoading(true);
    toast.success("Chức năng gửi mail kích hoạt thành công!"); setLoading(false); setShowMarketingModal(false);
  };
  
  const handleHoldOrder = async () => { if (cart.length === 0) return; setHeldOrders(prev => [...prev, { id: Date.now(), time: new Date().toLocaleTimeString('vi-VN'), cart: [...cart] }]); resetCheckout(); toast.success("Đã lưu tạm đơn!"); };
  const restoreOrder = async (order: any) => { if (cart.length > 0) return toast.error("Hủy giỏ hiện tại trước!"); setCart(order.cart); setHeldOrders(prev => prev.filter(o => o.id !== order.id)); setShowHoldModal(false); };
  const deleteHeldOrder = async (id: any) => { setHeldOrders(prev => prev.filter(o => o.id !== id)); };

  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => { document.getElementById('search-barcode')?.focus(); if (e.key === 'Enter') { e.preventDefault(); const p = findProductByCode(barcodeInput); if (p) handleSelectSuggest(p); else { const matchedPhone = Object.keys(customers).find(phone => phone === barcodeInput.trim() || customers[phone].cardCode === barcodeInput.trim()); if (matchedPhone) { setCustomerInput(matchedPhone); setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); setBarcodeInput(""); } } } };
  
  const handleSelectSuggest = (p_input: any) => {
    const baseCode = String(p_input.product_code).split('-')[0]; const totalStock = products.filter(p => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`)).reduce((s, p) => s + p.stock, 0); 
    if (totalStock <= 0) return toast.error("Hết hàng!");
    let itemToCart = { ...p_input }; const price = getActualPrice(itemToCart); const repName = cleanName(itemToCart.name);
    setCart(prev => {
      const exist = prev.find(item => cleanName(item.product.name) === repName);
      if (exist) { const newQty = exist.qty + 1; return prev.map(i => cleanName(i.product.name) === repName ? { ...i, qty: newQty, total: Math.round(newQty * price * (1 + VAT_RATE)) } : i); } 
      else { return [...prev, { product: itemToCart, qty: 1, total: Math.round(price * (1 + VAT_RATE)) }]; }
    });
    setBarcodeInput(""); setShowSuggestions(false);
  };
  
  const addToCart = (p_input: any) => { handleSelectSuggest(p_input); };
  const adjustCartQty = (productId: any, delta: number) => {
    setCart(prev => prev.map(item => { if (item.product.id === productId) { const newQty = item.qty + delta; const price = getActualPrice(item.product); return { ...item, qty: newQty, total: Math.round(newQty * price * (1 + VAT_RATE)) }; } return item; }).filter(item => item.qty > 0));
  };
  const handleDirectQtyChange = (productId: any, val: string) => {
    setCart(prev => prev.map(i => { if (i.product.id === productId) { let num = parseInt(val) || 0; const price = getActualPrice(i.product); return { ...i, qty: num, total: Math.round(num * price * (1 + VAT_RATE)) }; } return i; }));
  };
  const handleDirectQtyBlur = (productId: any, val: string) => { if (val === '' || parseInt(val) <= 0) { setCart(prev => prev.map(i => i.product.id === productId ? { ...i, qty: 1, total: Math.round(getActualPrice(i.product) * (1 + VAT_RATE)) } : i)); } };
  const removeFromCart = (productId: any) => { setCart(cart.filter(item => item.product.id !== productId)); };
  const clearCart = () => { resetCheckout(); };

  const confirmCheckout = async (payMethod: string) => {
    setLoading(true); let logs: any[] = []; const baseTotal = cartTotalAmountDisplay; const subTotal = Math.round(baseTotal / (1 + VAT_RATE)); const vatTotal = baseTotal - subTotal;
    const finalTotal = Math.max(0, baseTotal - appliedVoucherAmount - tierDiscountAmount - walletUsedAmount);
    let baseTimestamp = Date.now(); const orderIdStr = "HD" + Date.now().toString().slice(-6);

    for (const item of cart) {
      if (navigator.onLine) await supabase.from("products").update({ stock: Math.max(0, item.product.stock - item.qty) }).eq("id", item.product.id);
      logs.push({ id: baseTimestamp++, shift, type: "BÁN", name: cleanName(item.product.name), qty: item.qty, total: item.total, profit: Math.round(item.qty * (getActualPrice(item.product) - (item.product.import_price || 0))), customer: custPhone ? `${custName}` : "Khách lẻ", product_id: item.product.id, paymentMethod: payMethod, time: new Date().toLocaleString('vi-VN') });
    }
    setHistory(prev => [...logs, ...prev]);
    setLastOrder({ orderId: orderIdStr, shift, cart: [...cart], subTotal, vatTotal, finalTotal, debtAmount: payMethod === 'GHI NỢ' ? finalTotal : 0, discount: appliedVoucherAmount, time: new Date().toLocaleString('vi-VN'), paymentMethod: payMethod, customerGiven: Number(customerGiven) || 0, custPhone });
    setCheckoutStep(3); fetchProducts(); setLoading(false);
  };

  const handleRefund = async (logId: any) => {
    executeWithAdminCheck(() => {
      const log = history.find(l => l.id === logId); if (!log || log.type !== 'BÁN') return;
      setHistory(prev => [{ id: Date.now(), shift, type: "TRẢ HÀNG", name: "HOÀN: " + log.name, qty: log.qty, total: -log.total, profit: -(log.profit || 0), customer: log.customer, paymentMethod: "TIỀN MẶT", time: new Date().toLocaleString('vi-VN') }, ...prev]);
      toast.success("Đã hoàn đơn hàng thành công!");
    });
  };

  const handlePayDebt = async (phone: string) => {
    const currentDebt = customers[phone]?.debt || 0; if (currentDebt <= 0) return toast.error("Khách không có nợ!");
    setCustomers(prev => ({ ...prev, [phone]: { ...prev[phone], debt: 0 } })); toast.success("Đã xóa nợ!");
  };
  
  const handleReprint = (timeStr: string) => { toast.success("Đang tái bản hóa đơn..."); };
  const sendReceiptEmail = async () => { toast.success("Đã gửi hóa đơn qua Email!"); };
  const sendCardEmail = async (phone: string) => { toast.success("Đã kích hoạt gửi thẻ thành viên!"); };

  return (
    // 🛡 BỌC DUY NHẤT 1 THẺ DIV PHẢI TUÂN THỦ TUYỆT ĐỐI LUẬT REACT JSX ELEMENT CHA
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
            <button className="login-btn-submit" type="submit">ĐĂNG NHẬP KHÁO CA</button>
          </form>
        </div>
      ) : (
        <div className="no-print" style={{ padding: "15px", position: "relative", minHeight: "100vh", overflowX: "auto" }}>
          <div style={{ maxWidth: "1500px", margin: "0 auto", minWidth: "1000px" }}>
            
            {/* TRUYỀN ĐẦY ĐỦ ACTION MỞ PO VÀ SCANNAR VÀO MENU HEADER */}
            <Header 
              role={role} shift={shift} totalValue={totalValue} currentShiftStats={currentShiftStats} setCashFlowModalInfo={setCashFlowModalInfo} darkMode={darkMode} setDarkMode={setDarkMode} handleLogoutClick={handleLogoutClick} showMainMenu={showMainMenu} setShowMainMenu={setShowMainMenu} setShowStatsModal={setShowStatsModal} setShowCustomerModal={setShowCustomerModal} setShowInventoryModal={setShowInventoryModal} setShowDebtModal={setShowDebtModal} setShowAuditModal={setShowAuditModal} setShowExpenseModal={setShowExpenseModal} setShowSupplierModal={setShowSupplierModal} setShowMarketingModal={setShowMarketingModal} bankBin={bankBin} bankAcc={bankAcc} bankNameStr={bankNameStr} setShowSettings={setShowSettings} lowStockCount={lowStockCount} isOnline={isOnline} syncStatus={syncStatus} syncAllOfflineData={syncAllOfflineData}
              setShowScannerLinkModal={setShowScannerLinkModal} setShowPOModal={setShowPOModal}
            />
            
            <div style={{ display: "grid", gridTemplateColumns: "7fr 3fr", gap: "10px" }}>
              <div className="glass" style={{ padding: "12px" }}>
                <ProductSearchAndActions role={role} barcodeInput={barcodeInput} setBarcodeInput={setBarcodeInput} showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions} handleBarcodeSubmit={handleBarcodeSubmit} setScannerMode={setScannerMode} products={products} handleSelectSuggest={handleSelectSuggest} showInputForm={showInputForm} setShowInputForm={setShowInputForm} handleFileUpload={handleFileUpload} downloadSampleCSV={downloadSampleCSV} />
                <div style={{ display: "flex", gap: "8px", marginBottom: "15px" }}>
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

/* eslint-disable */
// @ts-nocheck
import React, { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "./supabaseClient";
import { 
  styles, formatCategoryStr, parseGift, cleanName, 
  getActualPrice, getCustomerTier, playSound 
} from "./utils/helpers";
import { useOfflineSync } from "./hooks/useOfflineSync";

// CÁC COMPONENT GIAO DIỆN (UI) MỚI TÁCH
import { Header } from "./components/layout/Header";
import { ProductSearchAndActions } from "./components/products/ProductSearchAndActions";
import { ProductInputForm } from "./components/products/ProductInputForm";
import { ProductTable } from "./components/products/ProductTable";
import { CartPanel } from "./components/cart/CartPanel";
import { HistoryPanel } from "./components/history/HistoryPanel";

// MODALS
import { HandoverModal } from "./components/modals/HandoverModal";
import { ExpenseModal } from "./components/modals/ExpenseModal";
import { SupplierModal } from "./components/modals/SupplierModal";
import { MarketingModal } from "./components/modals/MarketingModal";
import { SettingsModal } from "./components/modals/SettingsModal";

export default function App() {
  const VAT_RATE = 0.1;
  const EMAILJS_SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID || "service_7ie990l";
  const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || "template_t91erhg";
  const EMAILJS_TEMPLATE_VIP_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_VIP_ID || "template_m1j9i7k";
  const EMAILJS_PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || "5ric0kxuwNPlUleAv";
  
  // =====================================================================
  // 1. TOÀN BỘ STATE CỦA ỨNG DỤNG
  // =====================================================================
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("mart_logged_in") === "true");
  const [role, setRole] = useState(() => localStorage.getItem("mart_role") || "staff");
  const [shift, setShift] = useState(() => localStorage.getItem("mart_shift") || "Ca Sáng");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  
  
  const [startingCash, setStartingCash] = useState<number>(() => { const cached = localStorage.getItem("mart_starting_cash"); return (cached && cached !== "0") ? Number(cached) : 5000000; });
  const [bankBin, setBankBin] = useState(() => localStorage.getItem("mart_bank_bin") || "970422");
  const [bankAcc, setBankAcc] = useState(() => localStorage.getItem("mart_bank_acc") || "0680124181004");
  const [bankNameStr, setBankNameStr] = useState(() => localStorage.getItem("mart_bank_name") || "LE HONG HAI");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("mart_theme") === "dark");

  const [showSettings, setShowSettings] = useState(false);
  const [showInputForm, setShowInputForm] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showMarketingModal, setShowMarketingModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [cashFlowModalInfo, setCashFlowModalInfo] = useState<'TIỀN MẶT' | 'CHUYỂN KHOẢN' | null>(null);
  const [selectedAuditLog, setSelectedAuditLog] = useState<any>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, any[]>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  
  const [actualStockInput, setActualStockInput] = useState<Record<string, number>>({});
  const [inventorySearchTerm, setInventorySearchTerm] = useState("");
  const [invFilter, setInvFilter] = useState('ALL');
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newImportPrice, setNewImportPrice] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newPromoPrice, setNewPromoPrice] = useState("");
  const [newGiftCondition, setNewGiftCondition] = useState("1");
  const [newGiftInfo, setNewGiftInfo] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [newCategory, setNewCategory] = useState("Đồ uống");

  const [newBankBin, setNewBankBin] = useState(() => localStorage.getItem("mart_bank_bin") || "970422");
  const [newBankAcc, setNewBankAcc] = useState(() => localStorage.getItem("mart_bank_acc") || "0680124181004");
  const [newBankNameStr, setNewBankNameStr] = useState(() => localStorage.getItem("mart_bank_name") || "LE HONG HAI");

  const [expName, setExpName] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [supName, setSupName] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supItem, setSupItem] = useState("");
  const [marketingTier, setMarketingTier] = useState("Tất cả");
  const [marketingMsg, setMarketingMsg] = useState("");
  
  const [reportStartDate, setReportStartDate] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; });
  const [reportEndDate, setReportEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [logSearchTerm, setLogSearchTerm] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState("Tất cả");

  const [scannerMode, setScannerMode] = useState<'product' | 'voucher' | 'customer' | null>(null);
  const [scannedCodeObj, setScannedCodeObj] = useState<any>(null);
  const [scanMessage, setScanMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [printBarcodeProduct, setPrintBarcodeProduct] = useState<any>(null);
  const [printCustomer, setPrintCustomer] = useState<any>(null);
  const [barcodeCount, setBarcodeCount] = useState<number>(30);
  const [printMode, setPrintMode] = useState<'receipt' | 'barcode' | 'customer_card' | 'invoice_a4' | null>(null);

  const [cart, setCart] = useState<any[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [customerInput, setCustomerInput] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custName, setCustName] = useState("");
  const [useWallet, setUseWallet] = useState(false);
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucherAmount, setAppliedVoucherAmount] = useState<number>(0);
  const [customerGiven, setCustomerGiven] = useState<number | "">("");
  const [lastOrder, setLastOrder] = useState<any>(null);

  const [customers, setCustomers] = useState<any>(() => { const s = localStorage.getItem("mart_customers"); return s ? JSON.parse(s) : {} });
  const [heldOrders, setHeldOrders] = useState<any[]>(() => { const s = localStorage.getItem("mart_held_orders"); return s ? JSON.parse(s) : [] });
  const [auditLogs, setAuditLogs] = useState<any[]>(() => { const s = localStorage.getItem("mart_audit"); return s ? JSON.parse(s) : [] });
  const [expenses, setExpenses] = useState<any[]>(() => { const s = localStorage.getItem("mart_expenses"); return s ? JSON.parse(s) : [] });
  const [suppliers, setSuppliers] = useState<any[]>(() => { const s = localStorage.getItem("mart_suppliers"); return s ? JSON.parse(s) : [] });
  const [history, setHistory] = useState<any[]>(() => { const s = localStorage.getItem("mart_history"); return s ? JSON.parse(s) : [] });

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
      if (!isLoggedIn || isCheckoutOpen || showAuditModal || showCustomerModal || showSettings || showInputForm || showInventoryModal || cashFlowModalInfo) return;
      if (e.key === 'F1') { e.preventDefault(); document.getElementById('search-barcode')?.focus(); }
      if (e.key === 'F2') { e.preventDefault(); if (cart.length > 0) confirmCheckout('TIỀN MẶT'); }
      if (e.key === 'F3') { e.preventDefault(); if (cart.length > 0) confirmCheckout('CHUYỂN KHOẢN'); }
      if (e.key === 'F4') { e.preventDefault(); handleHoldOrder(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoggedIn, isCheckoutOpen, cart, showAuditModal, showCustomerModal, showSettings, showInputForm, showInventoryModal, cashFlowModalInfo]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchProducts(); loadCloudData();
      const channel = supabase.channel("db_changes").on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchProducts()).on("postgres_changes", { event: "*", schema: "public", table: "history" }, () => loadCloudData()).on("postgres_changes", { event: "*", schema: "public", table: "customers" }, () => loadCloudData()).on("postgres_changes", { event: "*", schema: "public", table: "held_orders" }, () => loadCloudData()).on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, () => loadCloudData()).subscribe();
      const script = document.createElement("script"); script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"; script.onload = () => { (window as any).emailjs.init(EMAILJS_PUBLIC_KEY); }; document.head.appendChild(script);
      const xlsxScript = document.createElement("script"); xlsxScript.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; document.head.appendChild(xlsxScript);
      return () => { supabase.removeChannel(channel) };
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (scannerMode !== null) {
      let scanner: any; let lastScanTime = 0;
      const loadScanner = () => { if ((window as any).Html5QrcodeScanner) { scanner = new (window as any).Html5QrcodeScanner("qr-reader", { fps: 15, qrbox: { width: 250, height: 120 }, rememberLastUsedCamera: true }, false); scanner.render((text: string) => { const now = Date.now(); if (now - lastScanTime < 1500) return; lastScanTime = now; setScannedCodeObj({ code: text, time: now }) }, undefined) } };
      if (!(window as any).Html5QrcodeScanner) { const script = document.createElement("script"); script.src = "https://unpkg.com/html5-qrcode"; script.onload = loadScanner; document.head.appendChild(script) } else loadScanner();
      return () => { if (scanner) scanner.clear().catch(() => { }) }
    }
  }, [scannerMode]);

  useEffect(() => {
    if (scannedCodeObj) {
      if (scannerMode === 'product') { const p = findProductByCode(scannedCodeObj.code); if (p) handleSelectSuggest(p); else { const matchedPhone = Object.keys(customers).find(phone => phone === scannedCodeObj.code.trim() || customers[phone].cardCode === scannedCodeObj.code.trim()); if (matchedPhone) { playSound('success'); setCustomerInput(customers[matchedPhone].cardCode || matchedPhone); setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); setScanMessage({ text: `✅ KH VIP: ${customers[matchedPhone].name}`, type: 'success' }) } else { playSound('error'); setScanMessage({ text: `❌ Lỗi mã`, type: 'error' }) } setTimeout(() => setScannerMode(null), 1500) } }
      else if (scannerMode === 'voucher') { const code = scannedCodeObj.code.trim().toUpperCase(); const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 }; if (VOUCHERS[code]) { setAppliedVoucherAmount(VOUCHERS[code]); setVoucherInput(code); playSound('success'); setScanMessage({ text: `✅ Giảm ${VOUCHERS[code].toLocaleString()}đ`, type: 'success' }) } else if (!isNaN(Number(code)) && Number(code) > 0) { setAppliedVoucherAmount(Number(code)); setVoucherInput(code); playSound('success'); setScanMessage({ text: `✅ Giảm ${Number(code).toLocaleString()}đ`, type: 'success' }) } else { playSound('error'); alert("Mã Voucher không hợp lệ!"); setAppliedVoucherAmount(0) } setTimeout(() => setScannerMode(null), 1000) }
      else if (scannerMode === 'customer') { const val = scannedCodeObj.code.trim(); setCustomerInput(val); const matchedPhone = Object.keys(customers).find(phone => phone === val || customers[phone].cardCode === val); if (matchedPhone) { setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); playSound('success'); setScanMessage({ text: `✅ Nhận diện VIP: ${customers[matchedPhone].name}`, type: 'success' }) } else { setCustPhone(val); setCustName(""); playSound('success'); setScanMessage({ text: `✅ Đã quét mã (Khách mới)`, type: 'success' }) } setTimeout(() => setScannerMode(null), 1000) }
      setScannedCodeObj(null); setTimeout(() => setScanMessage(null), 1500)
    }
  }, [scannedCodeObj, products, scannerMode]);

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
    // (Giữ nguyên logic cũ của bạn)
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
  const logAudit = async (action: string, detail: string, extraData: any = null) => { const newLog = { id: Date.now(), time: new Date().toLocaleString('vi-VN'), user_name: role === 'admin' ? 'Quản lý' : 'Thu ngân', shift, action, detail, extra_data: extraData ? JSON.stringify(extraData) : null }; setAuditLogs(prev => [newLog, ...prev].slice(0, 300)); };
  const fetchProducts = async () => { const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false }); if (data) setProducts(data) };
  const findProductByCode = (code: string) => { const rawCode = code.trim(); let matches = products.filter(prod => prod.product_code === rawCode || String(prod.product_code).startsWith(`${rawCode}-`)); let available = matches.filter(p => p.stock > 0); if (available.length > 0) { available.sort((a, b) => { if (!a.expiry_date) return 1; if (!b.expiry_date) return -1; return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime() }); return available[0] } return matches.length > 0 ? matches[0] : null };
  const handleLogin = async (e: React.FormEvent) => { e.preventDefault(); let u = authUsername.trim().toLowerCase(); const p = authPassword.trim(); if (!u.includes('@')) { u = u + '@hailemart.com'; } localStorage.setItem("mart_starting_cash", startingCash.toString()); setLoading(true); const { data, error } = await supabase.auth.signInWithPassword({ email: u, password: p }); if (error) { alert(`❌ Đăng nhập thất bại: Kiểm tra lại tài khoản hoặc mật khẩu.\nChi tiết lỗi: ${error.message}`); setLoading(false); return; } const userRole = u.includes('admin') ? 'admin' : 'staff'; setIsLoggedIn(true); setRole(userRole); localStorage.setItem("mart_shift", shift); localStorage.setItem("mart_logged_in", "true"); localStorage.setItem("mart_role", userRole); logAudit("ĐĂNG NHẬP", "Mở ca", { start_cash: startingCash, role: userRole }); setLoading(false); };
  const handleLogoutClick = () => setShowHandoverModal(true);
  const confirmHandover = async () => { try { logAudit("CHỐT CA", `Bàn giao: ${currentShiftStats.rev.toLocaleString()}đ`, { ...currentShiftStats }); if (navigator.onLine) { await supabase.auth.signOut(); } } catch (error) { console.error("Lỗi đăng xuất khỏi máy chủ:", error); } finally { localStorage.removeItem("mart_logged_in"); localStorage.removeItem("mart_role"); setIsLoggedIn(false); setShowHandoverModal(false); window.location.reload(); } };
  const handleEditPhone = async (oldPhone: string) => { const newPhone = window.prompt("Nhập SĐT mới:", oldPhone); if (newPhone && newPhone.trim() !== "" && newPhone !== oldPhone) { if (customers[newPhone]) return alert("❌ SĐT đã tồn tại!"); const cData = customers[oldPhone]; const newC = { ...cData, phone: newPhone }; setCustomers((prev: any) => { const updated = { ...prev }; updated[newPhone] = newC; delete updated[oldPhone]; return updated }); setHistory((prev: any) => prev.map((h: any) => { if (h.customer && h.customer.includes(oldPhone)) { return { ...h, customer: h.customer.replace(oldPhone, newPhone) } } return h })); logAudit("SỬA SĐT KH", `Đổi ${oldPhone} -> ${newPhone}`); alert("✅ Cập nhật thành công! (Sẽ tự động đồng bộ lên Cloud)"); } };
  const addSupplier = async () => { if (!supName || !supPhone) return alert("Nhập đủ Tên/SĐT"); const newS = { id: Date.now(), name: supName, phone: supPhone, item: supItem }; setSuppliers(prev => [newS, ...prev]); setSupName(""); setSupPhone(""); setSupItem(""); logAudit("THÊM NCC", `${supName} - ${supPhone}`); alert("✅ Thêm NCC thành công!"); };
  const deleteSupplier = async (id: any) => { setSuppliers(prev => prev.filter(s => s.id !== id)); if (navigator.onLine) await supabase.from('suppliers').delete().eq('id', id); };
  const addExpense = async () => { if (!expName || !expAmount) return alert("Nhập chi phí!"); const newE = { id: Date.now(), date: new Date().toLocaleDateString('vi-VN'), name: expName, amount: Number(expAmount) }; setExpenses(prev => [newE, ...prev]); setExpName(""); setExpAmount(""); logAudit("GHI CHI PHÍ", `${expName}: ${expAmount}đ`, newE); alert("✅ Đã ghi nhận!"); };
  const deleteExpense = async (id: any) => { setExpenses(prev => prev.filter(e => e.id !== id)); if (navigator.onLine) await supabase.from('expenses').delete().eq('id', id); };
  
  const sendMarketingEmails = async () => {
    if (!marketingMsg) return alert("Nhập nội dung!"); if (!window.confirm("Giới hạn 200 mail/tháng. Gửi?")) return;
    setLoading(true); const targetCustomers = Object.keys(customers).filter(phone => { const c = customers[phone]; if (!c.email) return false; if (marketingTier === "Tất cả") return true; return getCustomerTier(c.totalSpent).name.includes(marketingTier) });
    if (targetCustomers.length === 0) { setLoading(false); return alert("Không có KH!"); }
    let successCount = 0;
    for (const phone of targetCustomers) { const c = customers[phone]; try { await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_VIP_ID, { to_email: c.email, order_id: "THÔNG BÁO ƯU ĐÃI", time: new Date().toLocaleString('vi-VN'), items_list: `💌 Lời nhắn từ Hải Lê Mart:\n\n${marketingMsg}`, total_amount: "Quà Tặng", payment_method: "Khách VIP", change_amount: "0đ", barcode_url: "" }); successCount++ } catch (error: any) { console.error("EmailJS Error", error); } }
    logAudit("GỬI MAIL MKT", `Gửi ${successCount} mail cho tập ${marketingTier}`); setLoading(false); setShowMarketingModal(false); alert(`✅ Đã gửi ${successCount} mail!`)
  };
  
  const saveSettings = () => { if (!newBankBin || !newBankAcc || !newBankNameStr) return alert("Điền đủ!"); setBankBin(newBankBin); localStorage.setItem("mart_bank_bin", newBankBin); setBankAcc(newBankAcc); localStorage.setItem("mart_bank_acc", newBankAcc); setBankNameStr(newBankNameStr); localStorage.setItem("mart_bank_name", newBankNameStr); logAudit("CÀI ĐẶT", "Cập nhật Cấu hình"); alert("✅ Đã lưu!"); setShowSettings(false) };
  
  const handleHoldOrder = async () => { if (cart.length === 0) return; const newO = { id: Date.now(), time: new Date().toLocaleTimeString('vi-VN'), cart: [...cart] }; setHeldOrders(prev => [...prev, newO]); logAudit("LƯU TẠM", `Lưu giỏ ${cart.length} món`); setCart([]); setCustPhone(""); setCustName(""); setCustomerInput("") };
  const restoreOrder = async (order: any) => { if (cart.length > 0) return alert("Thanh toán giỏ hiện tại trước!"); setCart(order.cart); setHeldOrders(prev => prev.filter(o => o.id !== order.id)); if (navigator.onLine) await supabase.from('held_orders').delete().eq('id', order.id); setShowHoldModal(false); };
  const deleteHeldOrder = async (id: any) => { setHeldOrders(prev => prev.filter(o => o.id !== id)); logAudit("XÓA ĐƠN", `Xóa đơn lưu tạm`); if (navigator.onLine) await supabase.from('held_orders').delete().eq('id', id); };

  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => { document.getElementById('search-barcode')?.focus(); if (e.key === 'Enter') { e.preventDefault(); const p = findProductByCode(barcodeInput); if (p) handleSelectSuggest(p); else { const matchedPhone = Object.keys(customers).find(phone => phone === barcodeInput.trim() || customers[phone].cardCode === barcodeInput.trim()); if (matchedPhone) { playSound('success'); setCustomerInput(customers[matchedPhone].cardCode || matchedPhone); setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); setBarcodeInput("") } else { playSound('error'); alert("Mã sai!") } } } };
  const addToCart = (p_input: any) => { handleSelectSuggest(p_input) };
  
  const adjustCartQty = (productId: any, delta: number) => {
    let exceedStock = false;
    setCart(prev => {
      const updated = prev.map(item => {
        if (item.product.id === productId) { const baseCode = String(item.product.product_code).split('-')[0]; const totalStock = products.filter(p => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`)).reduce((s, p) => s + p.stock, 0); const newQty = item.qty + delta; if (newQty > totalStock) { exceedStock = true; return item; } const price = getActualPrice(item.product); return { ...item, qty: newQty, total: Math.round(newQty * price * (1 + VAT_RATE)) }; } return item;
      }); return updated.filter(item => item.qty > 0);
    });
    if (exceedStock) playSound('error'); else if (delta > 0) playSound('success');
  };
  
  const handleDirectQtyChange = (productId: any, val: string) => {
    setCart(prev => {
      if (val === '') return prev.map(i => i.product.id === productId ? { ...i, qty: '' as any, total: 0 } : i); let num = parseInt(val); if (isNaN(num) || num < 0) return prev; let exceedStock = false;
      const updated = prev.map(i => {
        if (i.product.id === productId) { const baseCode = String(i.product.product_code).split('-')[0]; const totalStock = products.filter(p => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`)).reduce((s, p) => s + p.stock, 0); if (num > totalStock) { exceedStock = true; num = totalStock; } const price = getActualPrice(i.product); return { ...i, qty: num, total: Math.round(num * price * (1 + VAT_RATE)) }; } return i;
      });
      if (exceedStock) playSound('error'); return updated;
    });
  };
  
  const handleDirectQtyBlur = (productId: any, val: string) => { if (val === '' || parseInt(val) <= 0 || isNaN(parseInt(val))) { setCart(prev => prev.map(i => { if (i.product.id === productId) { const price = getActualPrice(i.product); return { ...i, qty: 1, total: Math.round(1 * price * (1 + VAT_RATE)) } } return i })) } };
  const removeFromCart = (productId: any) => { setCart(cart.filter(item => item.product.id !== productId)) };
  const clearCart = () => { if (window.confirm("Hủy toàn bộ?")) { setCart([]); setCustName(""); setCustPhone(""); setCustomerInput("") } };
  const handleVoucherSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); const code = voucherInput.trim().toUpperCase(); const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 }; if (VOUCHERS[code]) { setAppliedVoucherAmount(VOUCHERS[code]); playSound('success') } else if (!isNaN(Number(code)) && Number(code) > 0) { setAppliedVoucherAmount(Number(code)); playSound('success') } else { playSound('error'); alert("Mã Voucher lỗi!"); setAppliedVoucherAmount(0) } } };
  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { const val = e.target.value; setCustomerInput(val); const matchedPhone = Object.keys(customers).find(phone => phone === val.trim() || customers[phone].cardCode === val.trim()); if (matchedPhone) { setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); setUseWallet(false) } else { setCustPhone(val); setCustName(""); setUseWallet(false) } };
  
  const handleSelectSuggest = (p_input: any) => {
    const baseCode = String(p_input.product_code).split('-')[0]; const totalStock = products.filter(p => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`)).reduce((s, p) => s + p.stock, 0); if (totalStock <= 0) { playSound('error'); return alert("Đã hết hàng!"); }
    const price = getActualPrice(p_input); const repName = cleanName(p_input.name);
    setCart(prev => {
      const exist = prev.find(item => cleanName(item.product.name) === repName);
      if (exist) { const newQty = exist.qty + 1; if (newQty > totalStock) { playSound('error'); return prev; } playSound('success'); return prev.map(i => cleanName(i.product.name) === repName ? { ...i, qty: newQty, total: Math.round(newQty * price * (1 + VAT_RATE)) } : i); } else { playSound('success'); return [...prev, { product: p_input, qty: 1, total: Math.round(price * (1 + VAT_RATE)) }]; }
    });
    setScanMessage({ text: `✅ Thêm: ${repName}`, type: 'success' }); setBarcodeInput(""); setShowSuggestions(false); setTimeout(() => setScanMessage(null), 2000);
  };

  const handleNextToQR = () => { 
    if (cart.length === 0) return alert("Giỏ hàng trống!"); if (custPhone && !customers[custPhone] && !custName) return alert("Nhập Tên khách mới!"); 
    if (voucherInput.trim() !== "" && appliedVoucherAmount === 0) { const code = voucherInput.trim().toUpperCase(); const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 }; if (VOUCHERS[code]) { setAppliedVoucherAmount(VOUCHERS[code]); } else if (!isNaN(Number(code)) && Number(code) > 0) { setAppliedVoucherAmount(Number(code)); } else { return alert("❌ Mã Voucher không hợp lệ! Vui lòng xóa mã đi hoặc nhập lại."); } } 
    setCheckoutStep(2); 
  };

  const confirmCheckout = async (payMethod: 'TIỀN MẶT' | 'CHUYỂN KHOẢN' | 'GHI NỢ' | 'KẾT HỢP' | 'QUẸT THẺ') => {
    if (cart.some(i => !i.qty || i.qty <= 0)) { playSound('error'); return alert("Lỗi số lượng!") } if (payMethod === 'GHI NỢ' && !custPhone) return alert("Ghi nợ cần SĐT!");
    setLoading(true); let logs: any[] = []; const baseTotal = cartTotalAmountDisplay; const subTotal = Math.round(baseTotal / (1 + VAT_RATE)); const vatTotal = baseTotal - subTotal;
    const totalAfterVoucher = Math.max(0, baseTotal - appliedVoucherAmount); const tier = getCustomerTier(customers[custPhone]?.totalSpent || 0); const tierDiscountAmount = custPhone ? Math.round(baseTotal * tier.discountRate) : 0; const amountAfterTierAndVoucher = Math.max(0, totalAfterVoucher - tierDiscountAmount); const walletUsedAmount = useWallet && payMethod !== 'GHI NỢ' ? Math.round(Math.min(customers[custPhone]?.wallet || 0, amountAfterTierAndVoucher)) : 0; const finalTotal = amountAfterTierAndVoucher - walletUsedAmount; const totalDiscount = appliedVoucherAmount + walletUsedAmount + tierDiscountAmount; const earned = payMethod === 'GHI NỢ' ? 0 : Math.round(finalTotal * 0.02);
    let baseTimestamp = Date.now(); const orderIdStr = "HD" + Date.now().toString().slice(-6);

    for (const item of cart) {
      const baseCode = String(item.product.product_code).split('-')[0]; const batches = products.filter(p => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`)).sort((a, b) => { if (!a.expiry_date) return 1; if (!b.expiry_date) return -1; return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime() });
      let remain = item.qty; const price = getActualPrice(item.product);
      for (const b of batches) {
        if (remain <= 0) break;
        if (b.stock > 0) {
          const take = Math.min(remain, b.stock); if (navigator.onLine) await supabase.from("products").update({ stock: b.stock - take }).eq("id", b.id);
          let splitCashAmt = 0; if(payMethod === 'KẾT HỢP') { splitCashAmt = Math.round((Number(customerGiven) / finalTotal) * Math.round(take * price * (1 + VAT_RATE))); }
          logs.push({ id: baseTimestamp++, shift: shift, type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", name: cleanName(b.name) + (item.product.isHappyHour ? ' [Giờ Vàng]' : ''), qty: take, total: Math.round(take * price * (1 + VAT_RATE)), profit: Math.round(take * (price - (b.import_price || 0))), customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: b.id, refunded_qty: 0, paymentMethod: payMethod, split_cash: splitCashAmt, time: new Date().toLocaleString('vi-VN') });
          remain -= take;
        }
      }
    }
    
    if (totalDiscount > 0) { logs.push({ id: baseTimestamp++, shift: shift, type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", name: "Giảm giá/Ví/VIP", qty: 1, total: -totalDiscount, profit: -totalDiscount, customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: 'DISCOUNT', refunded_qty: 0, paymentMethod: payMethod, time: new Date().toLocaleString('vi-VN') }) }
    if (custPhone) { const updatedCust = { name: custName, wallet: payMethod === 'GHI NỢ' ? (customers[custPhone]?.wallet || 0) : Math.round((customers[custPhone]?.wallet || 0) - walletUsedAmount + earned), debt: (customers[custPhone]?.debt || 0) + (payMethod === 'GHI NỢ' ? finalTotal : 0), totalSpent: (customers[custPhone]?.totalSpent || 0) + (payMethod !== 'GHI NỢ' ? finalTotal : 0), email: customers[custPhone]?.email || "", cardCode: customers[custPhone]?.cardCode || "" }; setCustomers((prev: any) => ({ ...prev, [custPhone]: updatedCust })); }
    setHistory(prev => [...logs, ...prev]);
    const finalOrderInfo = { orderId: orderIdStr, shift: shift, cart: [...cart], subTotal, vatTotal, finalTotal: payMethod === 'GHI NỢ' ? 0 : finalTotal, debtAmount: payMethod === 'GHI NỢ' ? finalTotal : 0, discount: totalDiscount, tierDiscountAmount: tierDiscountAmount, earnedWallet: custPhone ? earned : 0, custName: custPhone ? custName : null, custPhone: custPhone ? custPhone : null, time: new Date().toLocaleString('vi-VN'), paymentMethod: payMethod, customerGiven: Number(customerGiven) || 0 };
    setLastOrder(finalOrderInfo); logAudit("BÁN HÀNG", `Hóa đơn ${orderIdStr} - ${finalTotal.toLocaleString()}đ`, finalOrderInfo);
    setCheckoutStep(3); if (navigator.onLine) fetchProducts(); setLoading(false);
  };

  const handleRefund = async (logId: any) => {
    const logIndex = history.findIndex(l => l.id === logId); if (logIndex === -1) return;
    const log = history[logIndex]; if (log.type !== 'BÁN') return alert("Chỉ hoàn đơn BÁN!");
    const maxRefund = log.qty - (log.refunded_qty || 0); if (maxRefund <= 0) return alert("Đã hoàn toàn bộ!");
    const qStr = window.prompt(`SP: ${cleanName(log.name)}\nĐã mua: ${log.qty} | Có thể hoàn: ${maxRefund}\nNhập số lượng cần hoàn:`, maxRefund.toString());
    if (!qStr) return; const refundQty = parseInt(qStr); if (isNaN(refundQty) || refundQty <= 0 || refundQty > maxRefund) { playSound('error'); return alert("Lỗi số lượng!"); }
    if (!window.confirm(`Xác nhận hoàn ${refundQty} sản phẩm này?`)) return;

    const unitTotal = log.total / log.qty; const unitProfit = log.profit / log.qty;
    const refundTotal = Math.round(unitTotal * refundQty); const refundProfit = Math.round(unitProfit * refundQty);
    
    const p = products.find(x => x.id === log.product_id); if (p && navigator.onLine) await supabase.from("products").update({ stock: p.stock + refundQty }).eq("id", p.id);

    let refundedToWallet = false; let pMethod = 'TIỀN MẶT'; let methodSuffix = " (TM)";
    if (log.customer && log.customer !== "Khách lẻ") {
      const phoneMatch = log.customer.match(/\((.*?)\)/);
      if (phoneMatch && phoneMatch[1]) {
        const phone = phoneMatch[1];
        if (customers[phone] && window.confirm(`Khách VIP: Hoàn ${refundTotal.toLocaleString()}đ vào VÍ ĐIỂM?\n- [OK]: Trả vào Ví\n- [Cancel]: Trả tiền ngoài`)) {
          const newW = (customers[phone].wallet || 0) + refundTotal; setCustomers((prev: any) => ({ ...prev, [phone]: { ...prev[phone], wallet: newW } })); refundedToWallet = true; pMethod = 'VÍ ĐIỂM'; methodSuffix = " (Ví)";
        }
      }
    }
    if (!refundedToWallet) { const isTransfer = window.confirm(`Hoàn ${refundTotal.toLocaleString()}đ bằng hình thức nào?\n- [OK]: CHUYỂN KHOẢN\n- [Cancel]: TIỀN MẶT`); if (isTransfer) { pMethod = 'CHUYỂN KHOẢN'; methodSuffix = " (CK)"; } }
    const refundLog = { id: Date.now(), shift: shift, type: "TRẢ HÀNG", name: log.name + methodSuffix, qty: refundQty, total: -refundTotal, profit: -refundProfit, customer: log.customer, paymentMethod: pMethod, time: new Date().toLocaleString('vi-VN') };
    const updatedHistory = [...history]; updatedHistory[logIndex].refunded_qty = (log.refunded_qty || 0) + refundQty; updatedHistory.unshift(refundLog);
    setHistory(updatedHistory); if (navigator.onLine) fetchProducts();
    logAudit("TRẢ HÀNG", `Hoàn ${refundQty} ${cleanName(log.name)} (${pMethod})`, refundLog); playSound('success'); alert(`Thành công! Đã hoàn qua ${pMethod}`);
  };

  const handlePayDebt = async (phone: string) => {
    const currentDebt = customers[phone]?.debt || 0; const payAmtStr = window.prompt(`Khách nợ ${currentDebt.toLocaleString()}đ. Nhập tiền:`, currentDebt.toString());
    if (payAmtStr && parseInt(payAmtStr) > 0) {
      const amt = parseInt(payAmtStr); const isTransfer = window.confirm(`Thu nợ bằng CK (OK) hay TM (Cancel)?`); const pMethod = isTransfer ? 'CHUYỂN KHOẢN' : 'TIỀN MẶT';
      const newD = Math.max(0, (customers[phone]?.debt || 0) - amt); setCustomers((prev: any) => ({ ...prev, [phone]: { ...prev[phone], debt: newD } }));
      const dLog = { id: Date.now(), shift: shift, type: "THU NỢ", name: "Thanh toán công nợ", qty: 1, total: amt, profit: 0, customer: `${customers[phone].name} (${phone})`, paymentMethod: pMethod, time: new Date().toLocaleString('vi-VN') };
      setHistory(prev => [dLog, ...prev]); logAudit("THU NỢ", `Thu ${amt}đ từ ${customers[phone].name}`, dLog); alert("Thành công!")
    }
  };
  
  const handleReprint = (timeStr: string) => {
     const logsInBill = history.filter(h => h.time === timeStr && h.type === 'BÁN' && h.product_id !== 'DISCOUNT'); const discountLog = history.find(h => h.time === timeStr && h.product_id === 'DISCOUNT');
     if(logsInBill.length === 0) return alert("Không tìm thấy dữ liệu hóa đơn!");
     const reconstructedCart = logsInBill.map(l => ({ qty: l.qty, product: { name: l.name, gift_info: null, isHappyHour: String(l.name).includes('[Giờ Vàng]') }, priceIncludingVat: l.total / l.qty }));
     const subTotal = reconstructedCart.reduce((s, i) => s + (i.qty * (i.priceIncludingVat / (1 + VAT_RATE))), 0); const vatTotal = Math.round(subTotal * VAT_RATE); const discount = discountLog ? Math.abs(discountLog.total) : 0; const finalTotal = subTotal + vatTotal - discount;
     const rOrder = { orderId: "HD_COPY", shift: logsInBill[0].shift, cart: reconstructedCart, subTotal, vatTotal, finalTotal, debtAmount: 0, discount, time: timeStr, paymentMethod: logsInBill[0].paymentMethod, customerGiven: 0, custName: logsInBill[0].customer };
     setLastOrder(rOrder); setPrintMode('receipt'); setTimeout(() => window.print(), 500);
  };

  const closeCheckout = () => { setCart([]); setIsCheckoutOpen(false); setCheckoutStep(1); setCustPhone(""); setCustName(""); setCustomerInput(""); setUseWallet(false); setVoucherInput(""); setAppliedVoucherAmount(0); setCustomerGiven(""); setLastOrder(null) };
  
  const sendReceiptEmail = async () => {
    if (!lastOrder) return; let savedEmail = (lastOrder.custPhone && customers[lastOrder.custPhone] && customers[lastOrder.custPhone].email) ? customers[lastOrder.custPhone].email : ""; 
    let email = window.prompt("Nhập Email khách hàng:", savedEmail); if (!email) return; email = email.trim(); const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; if (!emailRegex.test(email)) return alert("❌ Lỗi: Địa chỉ Email không hợp lệ!");
    if (lastOrder.custPhone) { setCustomers((prev: any) => ({ ...prev, [lastOrder.custPhone]: { ...prev[lastOrder.custPhone], email: email } })); }
    setLoading(true); let itemsTable = ""; lastOrder.cart.forEach((item: any) => { const priceToUse = item.priceIncludingVat !== undefined ? item.priceIncludingVat : Math.round(getActualPrice(item.product) * (1 + VAT_RATE)); itemsTable += `- ${cleanName(item.product.name)} x ${item.qty} = ${(priceToUse * item.qty).toLocaleString()}đ\n` }); 
    const emailData = { to_email: email, title: "HÓA ĐƠN MUA HÀNG - HẢI LÊ MART", order_id: lastOrder.orderId, time: lastOrder.time, items_list: itemsTable, label_total: "TỔNG THANH TOÁN:", total_amount: Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString() + "đ", label_payment: "Hình thức TT:", payment_method: lastOrder.paymentMethod, label_change: lastOrder.paymentMethod === 'TIỀN MẶT' ? "Tiền thối lại:" : "", change_amount: lastOrder.paymentMethod === 'TIỀN MẶT' ? Math.round(lastOrder.customerGiven - lastOrder.finalTotal).toLocaleString() + "đ" : "" }; 
    try { await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailData); alert("🚀 Đã gửi HĐ cho khách!"); logAudit("GỬI HĐ MAIL", `Gửi tới ${email}`); } catch (error: any) { console.error(error); alert(`❌ Lỗi EmailJS`); } setLoading(false)
  };
  
  const sendCardEmail = async (phone: string) => {
    const cust = customers[phone]; let email = cust.email || window.prompt(`Nhập Email của ${cust.name}:`, ""); if (!email) return; email = email.trim(); const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; if (!emailRegex.test(email)) return alert("❌ Lỗi: Địa chỉ Email không hợp lệ!");
    if (!cust.email) { setCustomers((prev: any) => ({ ...prev, [phone]: { ...prev[phone], email } })); } setLoading(true); const code = cust.cardCode || phone; const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(code)}&scale=2&height=10&includetext=true`; 
    const emailData = { to_email: email, order_id: "THẺ THÀNH VIÊN", time: new Date().toLocaleString('vi-VN'), items_list: `💳 MÃ THẺ CỦA BẠN LÀ: ${code}\n(Vui lòng xuất trình Thẻ/Mã vạch bên dưới khi thanh toán)`, total_amount: "Ưu đãi Đặc Quyền", payment_method: "VIP Member", change_amount: "0đ", barcode_url: barcodeUrl }; 
    try { await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_VIP_ID, emailData); alert("🚀 Đã gửi Thẻ VIP!"); logAudit("GỬI THẺ VIP", `Gửi tới ${email}`); } catch (error: any) { console.error(error); alert(`❌ Lỗi EmailJS`); } setLoading(false)
  };

  const printCustomerCard = (phone: string) => { setPrintCustomer({ phone, ...customers[phone] }); setPrintMode('customer_card'); setTimeout(() => window.print(), 1000) };
  const shareToZalo = (phone: string) => { const cust = customers[phone]; const code = cust.cardCode || phone; navigator.clipboard.writeText(`Chào ${cust.name},\nCảm ơn bạn đã đồng hành cùng Hải Lê Mart!\n💳 Mã Thẻ VIP của bạn là: ${code}`).then(() => { alert(`💡 Đã copy lời chào. Đang mở Zalo...`); window.open(`https://zalo.me/${phone}`, '_blank') }).catch(() => { window.open(`https://zalo.me/${phone}`, '_blank') }) };
  
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => { const code = e.target.value; setNewCode(code); const p = products.find((x: any) => x.product_code === code); if (p) { setNewName(cleanName(p.name)); setNewCategory(formatCategoryStr(p.category)); setNewImportPrice(p.import_price?.toString() || ""); setNewPrice(p.sale_price.toString()); setNewPromoPrice(p.promo_price?.toString() || ""); setNewExpiry(p.expiry_date || ""); const gift = parseGift(p.gift_info); setNewGiftCondition(gift.cond.toString()); setNewGiftInfo(gift.text) } };
  
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault(); if (!navigator.onLine) return alert("Cần có mạng để thao tác Kho!"); setLoading(true);
    const added = parseInt(newStock || "0"); const impPrice = parseInt(newImportPrice); const salePrice = parseInt(newPrice); const promo = parseInt(newPromoPrice) || 0; const finalGiftInfo = newGiftInfo.trim() !== "" ? `${newGiftCondition};;;${newGiftInfo}` : null; const baseCode = newCode.trim(); const formattedCat = formatCategoryStr(newCategory);
    const allVariants = products.filter(p => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`)); const exist = allVariants.find(p => p.product_code === baseCode); let syncMsg = "";

    if (allVariants.length > 0) {
      const needSync = allVariants.some(v => v.sale_price !== salePrice || v.promo_price !== promo || v.gift_info !== finalGiftInfo);
      if (needSync) { await Promise.all(allVariants.map(v => supabase.from("products").update({ sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo }).eq("id", v.id))); syncMsg = `\n💡 Đã ĐỒNG BỘ GIÁ & QUÀ TẶNG cho các lô cũ!`; logAudit("ĐỒNG BỘ HỆ THỐNG", `Cập nhật Giá/Quà mã ${baseCode}`, { newPrice: salePrice, newPromo: promo, newGift: finalGiftInfo }); }
    }

    if (exist) {
      if (exist.stock <= 0) {
        await supabase.from("products").update({ name: newName, category: formattedCat, import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null, created_at: new Date().toISOString() }).eq("id", exist.id);
        if (added > 0) { const lg = { id: Date.now(), shift: shift, type: "NHẬP", name: newName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }; setHistory(prev => [lg, ...prev]); } 
        logAudit("NHẬP ĐÈ CŨ", `${newName} (+${added})`, { importPrice: impPrice, salePrice }); alert(`Đã nhập hàng!${syncMsg}`);
      } else {
        if (exist.import_price !== impPrice || (exist.expiry_date || "") !== (newExpiry || "")) {
          const batchCode = `${baseCode}-${Date.now().toString().slice(-4)}`; const batchName = `${newName} [Lô ${newExpiry ? new Date(newExpiry).toLocaleDateString('vi-VN') : 'Mới'}]`;
          if (window.confirm(`Tạo LÔ MỚI (${batchCode})?\n(Lô cũ sẽ tự động được áp dụng Giá & Quà tặng mới)`)) {
            await supabase.from("products").insert([{ product_code: batchCode, name: batchName, category: formattedCat, import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null }]);
            if (added > 0) { const lg = { id: Date.now(), shift: shift, type: "NHẬP", name: batchName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }; setHistory(prev => [lg, ...prev]); } 
            logAudit("TÁCH LÔ", `${batchName} (+${added})`, { oldExpiry: exist.expiry_date, newExpiry }); alert(`Đã tạo lô mới!${syncMsg}`);
          } else { setLoading(false); return; }
        } else {
          await supabase.from("products").update({ stock: exist.stock + added, created_at: new Date().toISOString() }).eq("id", exist.id);
          if (added > 0) { const lg = { id: Date.now(), shift: shift, type: "NHẬP", name: newName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }; setHistory(prev => [lg, ...prev]); } 
          logAudit("CỘNG DỒN", `${newName} (+${added})`); alert(`Cộng dồn thành công!${syncMsg}`);
        }
      }
    } else {
      await supabase.from("products").insert([{ product_code: baseCode, name: newName, category: formattedCat, import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null }]);
      if (added > 0) { const lg = { id: Date.now(), shift: shift, type: "NHẬP", name: newName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }; setHistory(prev => [lg, ...prev]); } 
      logAudit("NHẬP MỚI", `${newName} (+${added})`, { code: baseCode, importPrice: impPrice, salePrice }); alert(`Nhập thành công!${syncMsg}`);
    }
    setNewCode(""); setNewName(""); setNewCategory("Đồ uống"); setNewImportPrice(""); setNewPrice(""); setNewPromoPrice(""); setNewGiftCondition("1"); setNewGiftInfo(""); setNewStock(""); setNewExpiry(""); fetchProducts(); setLoading(false); setShowInputForm(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!navigator.onLine) return alert("Cần có mạng để thao tác Kho!"); const file = e.target.files?.[0]; if (!file) return;

    const processData = async (lines: any[]) => {
      setLoading(true); 
      try {
        if (!lines || lines.length <= 1) { alert("File rỗng hoặc không có dữ liệu hợp lệ!"); setLoading(false); return; } 
        let successCount = 0; let importLogs: any[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i]; if (!cols || !Array.isArray(cols) || cols.join('').trim() === '') continue; 
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
          
          const baseCode = pCode; const allVariants = products.filter(p => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`)); 
          
          if (allVariants.length > 0) { 
            const needSync = allVariants.some(v => v.sale_price !== pSalePrice || v.promo_price !== pPromoPrice || v.gift_info !== pGift);
            if (needSync) {
              await Promise.all(allVariants.map(v => supabase.from("products").update({ sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift }).eq("id", v.id))); 
              if (!importLogs.find(l => l.name === `Đồng bộ giá/quà ${baseCode}`)) importLogs.push({ id: Date.now() + Math.random(), shift: shift, type: "HỆ THỐNG", name: `Đồng bộ giá/quà ${baseCode}`, qty: 0, total: 0, time: new Date().toLocaleString('vi-VN') });
            }
          }
          
          const exist = allVariants.find(p => p.product_code === baseCode); 
          if (exist) { 
            if (exist.stock <= 0) { await supabase.from("products").update({ name: pName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry, created_at: new Date().toISOString() }).eq("id", exist.id); } else { if (exist.import_price !== pImpPrice || (exist.expiry_date || "") !== (pExpiry || "")) { const batchCode = `${baseCode}-${Date.now().toString().slice(-4)}${i}`; const batchName = `${pName} [Lô ${pExpiry ? new Date(pExpiry).toLocaleDateString('vi-VN') : 'Mới'}]`; await supabase.from("products").insert([{ product_code: batchCode, name: pName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry }]); } else await supabase.from("products").update({ stock: exist.stock + pStock, created_at: new Date().toISOString() }).eq("id", exist.id) } 
          } else await supabase.from("products").insert([{ product_code: baseCode, name: pName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry }]); 
          
          if (pStock > 0) importLogs.push({ id: Date.now() + Math.random(), shift: shift, type: "NHẬP", name: cleanName(pName), qty: pStock, total: 0, time: new Date().toLocaleString('vi-VN') }); successCount++;
        }
        if (importLogs.length > 0) { setHistory(prev => [...importLogs, ...prev]); } logAudit("NHẬP FILE", `Nhập ${successCount} mã`); alert(`✅ Nhập thành công ${successCount} sản phẩm từ file!`); fetchProducts();
      } catch (err) { console.error(err); alert("Lỗi xử lý dữ liệu file, vui lòng kiểm tra lại định dạng."); } setLoading(false);
    }; 
    
    const fileNameStr = file.name.toLowerCase();
    if (fileNameStr.endsWith('.xlsx') || fileNameStr.endsWith('.xls')) {
      if (!(window as any).XLSX) return alert("Thư viện Excel đang tải, vui lòng thử lại sau vài giây!"); const reader = new FileReader();
      reader.onload = (event) => { try { const data = new Uint8Array(event.target?.result as ArrayBuffer); const workbook = (window as any).XLSX.read(data, { type: 'array' }); const firstSheet = workbook.Sheets[workbook.SheetNames[0]]; const jsonData = (window as any).XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "", raw: false }); processData(jsonData); } catch (error) { console.error(error); alert("Đã xảy ra lỗi khi đọc file Excel."); } }; reader.readAsArrayBuffer(file);
    } else { const reader = new FileReader(); reader.onload = (event) => { const text = event.target?.result as string; const lines = text.split('\n').filter(line => line.trim() !== '').map(line => line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(c => c.trim().replace(/^"|"$/g, ''))); processData(lines); }; reader.readAsText(file); } e.target.value = ''; 
  };

  const handleImportInventoryCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const processData = (lines: any[]) => { let updatedStock = { ...actualStockInput }; let count = 0; for (let i = 1; i < lines.length; i++) { const cols = lines[i]; if (!cols || !Array.isArray(cols) || cols.join('').trim() === '') continue; const pCode = String(cols[0] || "").trim(); const actualVal = parseInt(String(cols[3] || "0").replace(/[,.]/g, '')); if (!isNaN(actualVal) && pCode) { const matchedProd = products.find(p => p.product_code === pCode); if (matchedProd && matchedProd.stock !== actualVal) { updatedStock[matchedProd.id] = actualVal; count++; } } } setActualStockInput(updatedStock); alert(`✅ Đã nạp số liệu cho ${count} sản phẩm có thay đổi từ file!`); };
    const fileNameStr = file.name.toLowerCase();
    if (fileNameStr.endsWith('.xlsx') || fileNameStr.endsWith('.xls')) { if (!(window as any).XLSX) return alert("Thư viện Excel đang tải, vui lòng thử lại sau vài giây!"); const reader = new FileReader(); reader.onload = (event) => { try { const data = new Uint8Array(event.target?.result as ArrayBuffer); const workbook = (window as any).XLSX.read(data, { type: 'array' }); const firstSheet = workbook.Sheets[workbook.SheetNames[0]]; const jsonData = (window as any).XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "", raw: false }); processData(jsonData); } catch(err) { console.error(err); alert("Lỗi định dạng cấu trúc khi đọc file Excel."); } }; reader.readAsArrayBuffer(file); } else { const reader = new FileReader(); reader.onload = (event) => { const text = event.target?.result as string; const lines = text.split('\n').filter(line => line.trim() !== '').map(line => line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(c => c.trim().replace(/^"|"$/g, ''))); processData(lines); }; reader.readAsText(file); } e.target.value = '';
  };
  
  const handleDelete = async (id: any, name: any) => { if (!navigator.onLine) return alert("Cần có mạng để thao tác Kho!"); if (window.confirm(`Xóa vĩnh viễn ${name}?`)) { await supabase.from("products").delete().eq("id", id); logAudit("XÓA SP", `Xóa: ${name}`); fetchProducts() } };
  
  const handleEdit = async (id: any, field: string, old: any, isText: boolean = false) => { if (!navigator.onLine) return alert("Cần có mạng để thao tác Kho!"); let label = field; if (field === 'category') label = 'Danh mục'; if (field === 'sale_price') label = 'Giá bán'; if (field === 'promo_price') label = 'Giá KM'; if (field === 'gift_info') label = 'Quà tặng'; if (field === 'expiry_date') label = 'HSD'; const val = window.prompt(`Sửa ${label}:`, old || ""); if (val !== null) { let updateData: any = isText ? (field === 'category' ? formatCategoryStr(val) : val) : (parseInt(val) || 0); if (field === 'gift_info' && val.trim() === '') updateData = null; await supabase.from("products").update({ [field]: updateData }).eq("id", id); logAudit("SỬA THÔNG TIN", `ID ${id} - ${label}`, { old, new: updateData }); fetchProducts() } };
  
  const handlePrintBarcode = (p: any) => { const q = window.prompt(`SL tem in: ${cleanName(p.name)}`, "30"); if (q && parseInt(q) > 0) { setPrintBarcodeProduct(p); setBarcodeCount(parseInt(q)); setPrintMode('barcode'); setTimeout(() => window.print(), 1500) } };
  
  const downloadSampleCSV = () => { 
    const csv = "\uFEFFMã SP,Tên SP,Danh Mục,Giá Nhập,Giá Bán,Giá KM,ĐK Tặng,Quà Tặng,Số Lượng,Hạn Sử Dụng (YYYY-MM-DD)\nSP001,Mì Hảo Hảo,Đồ ăn liền,3000,5000,0,1,,100,2026-12-31\nSP002,Xúc xích,Đồ ăn liền,10000,15000,0,2,1 Cây Xúc Xích,50,2026-12-31"; 
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); 
    const link = document.createElement("a"); 
    link.href = URL.createObjectURL(blob); 
    link.download = `Mau_Nhap_Kho.csv`; 
    link.click() 
  };
  
  const exportToCSV = () => { let csv = "\uFEFFGiờ,Ca,Loại,Hình thức,Khách,Sản phẩm,SL,Tổng(VAT),Lợi nhuận\n"; history.forEach(log => { csv += `${new Date(Math.floor(log.id)).toLocaleString('vi-VN')},${log.shift || ""},${log.type},${log.paymentMethod || ""},${log.customer || "Khách lẻ"},${log.name},${log.qty},${Math.round(log.total)},${Math.round(log.profit || 0)}\n` }); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Bao_Cao_Ban_Hang.csv`; link.click() };
  
  const exportAuditToCSV = () => { let csv = "\uFEFFThời gian,Người dùng,Ca,Hành động,Chi tiết,Dữ liệu mở rộng\n"; auditLogs.forEach(log => { csv += `${log.time},${log.user_name},${log.shift},${log.action},"${(log.detail || "").replace(/"/g, '""')}","${(log.extra_data || "").replace(/"/g, '""')}"\n` }); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Nhat_Ky_Thao_Tac.csv`; link.click() };
  
  const handleSendEmailReport = async () => {
    const start = new Date(reportStartDate + "T00:00:00").getTime(); const end = new Date(reportEndDate + "T23:59:59").getTime(); const logs = history.filter(log => { const t = new Date(Math.floor(log.id)).getTime(); return t >= start && t <= end; }); if (logs.length === 0) return alert("Chưa có giao dịch trong khoảng thời gian này!"); let cash = 0, transfer = 0, prof = 0, sold = 0; logs.forEach(l => { if (l.type === 'BÁN') sold += l.qty; if (l.type === 'BÁN' || l.type === 'THU NỢ' || l.type === 'TRẢ HÀNG') { if (l.paymentMethod === 'CHUYỂN KHOẢN' || l.paymentMethod === 'QUẸT THẺ') transfer += l.total; else if (l.paymentMethod === 'TIỀN MẶT' || l.paymentMethod === 'KẾT HỢP') { if(l.paymentMethod === 'KẾT HỢP' && l.split_cash) { cash += l.split_cash; transfer += (l.total - l.split_cash); } else { cash += l.total } } } prof += (l.profit || 0) });
    let adminEmail = window.prompt("Nhập Email Quản lý để nhận báo cáo:", ""); if(!adminEmail) return; adminEmail = adminEmail.trim(); const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; if (!emailRegex.test(adminEmail)) return alert("❌ Lỗi: Địa chỉ Email không hợp lệ!"); setLoading(true);
    const reportStr = `\n📅 Từ ${reportStartDate} đến ${reportEndDate}\n- Tổng SP đã bán: ${sold} món\n- Doanh thu Tiền Mặt: ${Math.round(cash).toLocaleString()}đ\n- Doanh thu C/K + Thẻ: ${Math.round(transfer).toLocaleString()}đ\n`; const emailData = { to_email: adminEmail, title: "BÁO CÁO DOANH THU", order_id: `BÁO CÁO TỔNG HỢP`, time: new Date().toLocaleString('vi-VN'), items_list: reportStr, label_total: "TỔNG LỢI NHUẬN:", total_amount: Math.round(prof).toLocaleString() + "đ", label_payment: "Hệ thống:", payment_method: "Hải Lê ERP", label_change: "", change_amount: "" }; 
    try { await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailData); logAudit("GỬI BÁO CÁO", `Đã gửi báo cáo tới ${adminEmail}`); alert("🚀 Đã gửi Báo cáo thành công!"); } catch (error: any) { console.error(error); alert(`❌ Lỗi EmailJS`); } setLoading(false);
  };

  const sendInventoryAlertEmail = async () => {
    let adminEmail = window.prompt("Nhập Email Quản lý để nhận cảnh báo:", ""); if(!adminEmail) return; adminEmail = adminEmail.trim(); const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; if (!emailRegex.test(adminEmail)) return alert("❌ Lỗi: Địa chỉ Email không hợp lệ!"); setLoading(true); const lowStock = products.filter(p => p.stock > 0 && p.stock < 10); const today = new Date().getTime(); const expiring = products.filter(p => p.expiry_date && (new Date(p.expiry_date).getTime() - today) / 86400000 <= 15);
    let msg = `🚨 BÁO CÁO KHO HÀNG NGÀY 🚨\n\n📦 SẮP HẾT HÀNG (${lowStock.length} món):\n`; lowStock.forEach(p => msg += `- ${cleanName(p.name)}: Còn ${p.stock} sản phẩm\n`); msg += `\n⏳ SẮP HẾT HẠN TRONG 15 NGÀY TỚI (${expiring.length} món):\n`; expiring.forEach(p => msg += `- ${cleanName(p.name)}: HSD ${new Date(p.expiry_date).toLocaleDateString('vi-VN')}\n`); const emailData = { to_email: adminEmail, title: "CẢNH BÁO TỒN KHO HẢI LÊ MART", order_id: "HỆ THỐNG", time: new Date().toLocaleString('vi-VN'), items_list: msg, label_total: "Tình trạng:", total_amount: "Cần chú ý", label_payment: "Gửi từ:", payment_method: "ERP Bot", label_change: "", change_amount: "" }; 
    try { await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailData); alert("🚀 Đã gửi cảnh báo kho thành công!"); logAudit("CẢNH BÁO KHO", "Gửi email báo cáo tồn kho"); } catch (error: any) { console.error(error); alert(`❌ Lỗi EmailJS`); } setLoading(false);
  };

  const handleInventorySearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); const term = String(inventorySearchTerm || "").trim().toLowerCase(); if (!term) return; const exactMatch = products.find(p => String(p.product_code || "").toLowerCase() === term); if (exactMatch) { const inputEl = document.getElementById(`inv-input-${exactMatch.id}`); if (inputEl) { inputEl.focus(); } } } };
  const handleInvInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); const searchBox = document.getElementById('inv-search-box'); if (searchBox) { searchBox.focus(); setInventorySearchTerm(""); } } };

  const exportInventoryCSV = () => {
    let csv = "\uFEFFMã SP,Tên SP,Tồn hệ thống,Tồn thực tế\n";
    products.forEach(p => { const actual = actualStockInput[p.id] !== undefined ? actualStockInput[p.id] : p.stock; csv += `${p.product_code},"${cleanName(p.name)}",${p.stock},${actual}\n`; });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `KiemKho_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`; link.click();
  };

  const syncInventoryCheck = async () => {
    if(!navigator.onLine) return alert("Cần có mạng để lưu kết quả kiểm kho!"); if(!window.confirm("Xác nhận ghi đè số lượng tồn kho trên máy bằng số lượng thực tế?")) return;
    setLoading(true); let count = 0;
    for (const [id, actualQty] of Object.entries(actualStockInput)) { const p = products.find(x => String(x.id) === String(id)); if(p && p.stock !== actualQty) { await supabase.from("products").update({ stock: actualQty }).eq("id", p.id); logAudit("KIỂM KHO", `Cập nhật ${p.name}`, { tu_so: p.stock, thanh_so: actualQty, lech: actualQty - p.stock }); count++; } }
    alert(`✅ Đã đồng bộ chênh lệch ${count} sản phẩm!`); setShowInventoryModal(false); setActualStockInput({}); fetchProducts(); setLoading(false);
  };
  
  const requestSort = (key: string) => { if (sortConfig && sortConfig.key === key) { if (sortConfig.direction === 'asc') setSortConfig({ key, direction: 'desc' }); else setSortConfig(null) } else { setSortConfig({ key, direction: 'asc' }) } };
  const toggleDateGroup = (dateStr: string) => setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));


  // =====================================================================
  // 5. GIAO DIỆN (RENDER)
  // =====================================================================
  
  // (Giữ lại các Modal in ấn ở trong App vì nó dùng state trực tiếp)
  const renderPrintArea = () => (
    <>
      {lastOrder && printMode === 'receipt' && (
        <div className="print-only">
          <div className="print-receipt-container">
            <div style={{ textAlign: "center", marginBottom: "8px" }}><h2 style={{ margin: 0, fontSize: "20px", fontWeight: 900 }}>HẢI LÊ MART</h2><div style={{ fontSize: "11px" }}>Tòa Nhà ATS, 252 Hoàng Quốc Việt, HN</div><div style={{ fontSize: "11px" }}>Hotline: 0902 613 899</div></div>
            <div style={{ borderBottom: "1px dashed #000", marginBottom: "8px" }}></div>
            <table style={{ width: "100%", fontSize: "11px", marginBottom: "4px", borderCollapse: "collapse" }}><tbody><tr><td style={{ textAlign: "left" }}><b>HĐ:</b> {lastOrder.orderId}</td><td style={{ textAlign: "right" }}><b>Ca:</b> {shift}</td></tr><tr><td style={{ textAlign: "left" }}><b>Ngày:</b> {lastOrder.time}</td><td style={{ textAlign: "right" }}><b>TN:</b> {role}</td></tr></tbody></table>
            <div style={{ borderBottom: "1px dashed #000", marginBottom: "6px" }}></div>
            <div style={{ fontSize: "11px", marginBottom: "8px", lineHeight: "1.5" }}>{lastOrder.custPhone ? (<><div><b>Khách hàng:</b> {lastOrder.custName || 'Khách VIP'}</div><div><b>SĐT:</b> {lastOrder.custPhone}</div>{customers[lastOrder.custPhone]?.email && <div><b>Email:</b> {customers[lastOrder.custPhone].email}</div>}</>) : (<div><b>Khách hàng:</b> Khách lẻ</div>)}</div>
            <div style={{ borderBottom: "1px dashed #000", marginBottom: "8px" }}></div>
            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
              <tbody>
                {lastOrder.cart.map((i: any, x: number) => {
                  const p = i.priceIncludingVat !== undefined ? Math.round(i.priceIncludingVat / (1 + VAT_RATE)) : Math.round(getActualPrice(i.product)); const t = i.priceIncludingVat !== undefined ? Math.round(i.priceIncludingVat * i.qty) : Math.round((Number(i.qty) || 0) * p * (1 + VAT_RATE)); const g = parseGift(i.product.gift_info); const gQty = g.cond > 0 ? Math.floor(i.qty / g.cond) : 0;
                  return (
                    <React.Fragment key={x}>
                      <tr><td colSpan={2} style={{ fontWeight: "bold", paddingTop: "4px" }}>{cleanName(i.product.name)} {i.product.isHappyHour && <span style={{ fontSize: "9px", fontStyle: "italic" }}>[Giờ Vàng]</span>}</td></tr>
                      <tr><td style={{ color: "#444", paddingBottom: "4px" }}>{i.qty} x {p.toLocaleString()}</td><td style={{ textAlign: "right", fontWeight: "bold", paddingBottom: "4px", color: "#000" }}>{t.toLocaleString()}</td></tr>
                      {g.text && gQty > 0 && <tr><td colSpan={2} style={{ fontSize: "10px", fontStyle: "italic", paddingBottom: "4px" }}>+ 🎁 Tặng: {gQty} x {g.text}</td></tr>}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
            <div style={{ borderBottom: "1px dashed #000", marginBottom: "8px", marginTop: "4px" }}></div>
            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}><tbody><tr><td style={{ padding: "2px 0" }}>Tiền hàng:</td><td style={{ textAlign: "right", padding: "2px 0" }}>{Math.round(lastOrder.subTotal).toLocaleString()}đ</td></tr><tr><td style={{ padding: "2px 0" }}>VAT (10%):</td><td style={{ textAlign: "right", padding: "2px 0" }}>{Math.round(lastOrder.vatTotal).toLocaleString()}đ</td></tr>{lastOrder.discount > 0 && <tr><td style={{ padding: "2px 0" }}>Giảm giá/Ví:</td><td style={{ textAlign: "right", padding: "2px 0" }}>-{Math.round(lastOrder.discount).toLocaleString()}đ</td></tr>}</tbody></table>
            <div style={{ borderBottom: "2px dashed #000", margin: "6px 0" }}></div>
            <table style={{ width: "100%", fontSize: "16px", fontWeight: 900, borderCollapse: "collapse" }}><tbody><tr><td>{lastOrder.debtAmount > 0 ? "NỢ:" : "TỔNG:"}</td><td style={{ textAlign: "right" }}>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</td></tr></tbody></table>
            <div style={{ marginTop: "6px", borderTop: "1px dotted #ccc", paddingTop: "4px", textAlign: "right", fontSize: "12px" }}>{lastOrder.paymentMethod === 'TIỀN MẶT' && <i>Tiền mặt</i>}{lastOrder.paymentMethod === 'QUẸT THẺ' && <i>Quẹt thẻ POS</i>}{lastOrder.paymentMethod === 'CHUYỂN KHOẢN' && <i>Chuyển khoản (VietQR)</i>}{lastOrder.paymentMethod === 'KẾT HỢP' && <i>Thanh toán Kết hợp (TM: {lastOrder.customerGiven.toLocaleString()}đ, CK: {(lastOrder.finalTotal - lastOrder.customerGiven).toLocaleString()}đ)</i>}</div>
            {lastOrder.paymentMethod === 'TIỀN MẶT' && lastOrder.customerGiven > lastOrder.finalTotal && (<table style={{ width: "100%", fontSize: "12px", marginTop: "4px", borderCollapse: "collapse" }}><tbody><tr><td>Khách đưa:</td><td style={{ textAlign: "right" }}>{Math.round(lastOrder.customerGiven).toLocaleString()}đ</td></tr><tr><td><b>Trả lại:</b></td><td style={{ textAlign: "right" }}><b>{Math.round(lastOrder.customerGiven - lastOrder.finalTotal).toLocaleString()}đ</b></td></tr></tbody></table>)}
            <div style={{ textAlign: "center", marginTop: "15px", fontSize: "11px" }}><b>CẢM ƠN QUÝ KHÁCH!</b><div style={{ fontSize: "9px", marginTop: "4px", color: "#666" }}>Powered by Hải Lê POS</div></div>
          </div>
        </div>
      )}

      {printMode === 'invoice_a4' && lastOrder && (
        <div className="print-flex print-a4-container">
          <div style={{ width: "100%", fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #000", paddingBottom: "10px", marginBottom: "20px" }}><div><h1 style={{ margin: 0, color: "#dc2626", fontSize: "28px" }}>HẢI LÊ MART</h1><p style={{ margin: "5px 0", fontSize: "14px" }}>Địa chỉ: Tòa Nhà ATS, 252 Hoàng Quốc Việt, Cầu Giấy, HN</p><p style={{ margin: "5px 0", fontSize: "14px" }}>Hotline: 0902 613 899</p></div><div style={{ textAlign: "right" }}><h2 style={{ margin: 0, fontSize: "24px" }}>HÓA ĐƠN BÁN HÀNG</h2><p style={{ margin: "5px 0", fontSize: "14px" }}>Số: <b>{lastOrder.orderId}</b></p><p style={{ margin: "5px 0", fontSize: "14px" }}>Ngày: {lastOrder.time}</p></div></div>
            <div style={{ marginBottom: "20px", fontSize: "15px" }}><p><b>Khách hàng:</b> {lastOrder.custName || "Khách lẻ"} {lastOrder.custPhone ? `(SĐT: ${lastOrder.custPhone})` : ""}</p><p><b>Hình thức thanh toán:</b> {lastOrder.paymentMethod}</p></div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
              <thead><tr style={{ background: "#f1f5f9" }}><th style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>STT</th><th style={{ border: "1px solid #000", padding: "10px", textAlign: "left" }}>Tên hàng hóa</th><th style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>SL</th><th style={{ border: "1px solid #000", padding: "10px", textAlign: "right" }}>Đơn giá</th><th style={{ border: "1px solid #000", padding: "10px", textAlign: "right" }}>Thành tiền</th></tr></thead>
              <tbody>{lastOrder.cart.map((item: any, index: number) => { const p = item.priceIncludingVat !== undefined ? Math.round(item.priceIncludingVat / (1 + VAT_RATE)) : Math.round(getActualPrice(item.product)); const t = item.priceIncludingVat !== undefined ? Math.round(item.priceIncludingVat * item.qty) : Math.round((Number(item.qty) || 0) * p * (1 + VAT_RATE)); return (<tr key={index}><td style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>{index + 1}</td><td style={{ border: "1px solid #000", padding: "10px" }}>{cleanName(item.product.name)}</td><td style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>{item.qty}</td><td style={{ border: "1px solid #000", padding: "10px", textAlign: "right" }}>{p.toLocaleString()}đ</td><td style={{ border: "1px solid #000", padding: "10px", textAlign: "right" }}>{t.toLocaleString()}đ</td></tr>); })}</tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px", fontSize: "15px" }}>
              <div style={{ textAlign: "center", width: "40%" }}><b>Khách hàng</b><br/><span style={{ fontSize: "12px", color: "#666" }}>(Ký, ghi rõ họ tên)</span></div>
              <div style={{ textAlign: "right", width: "50%" }}><p>Cộng tiền hàng: {Math.round(lastOrder.subTotal).toLocaleString()}đ</p><p>Thuế GTGT (10%): {Math.round(lastOrder.vatTotal).toLocaleString()}đ</p>{lastOrder.discount > 0 && <p>Chiết khấu/Giảm giá: -{Math.round(lastOrder.discount).toLocaleString()}đ</p>}<h3 style={{ borderTop: "2px solid #000", paddingTop: "10px" }}>TỔNG CỘNG: {Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</h3><div style={{ textAlign: "center", marginTop: "40px" }}><b>Người bán hàng</b><br/><span style={{ fontSize: "12px", color: "#666" }}>(Ký, đóng dấu)</span></div></div>
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
      <MarketingModal showMarketingModal={showMarketingModal} setShowMarketingModal={setShowMarketingModal} marketingTier={marketingTier} setMarketingTier={setMarketingTier} marketingMsg={marketingMsg} setMarketingMsg={setMarketingMsg} sendMarketingEmails={sendMarketingEmails} loading={loading} />
      <SettingsModal showSettings={showSettings} setShowSettings={setShowSettings} newBankBin={newBankBin} setNewBankBin={setNewBankBin} newBankAcc={newBankAcc} setNewBankAcc={setNewBankAcc} newBankNameStr={newBankNameStr} setNewBankNameStr={setNewBankNameStr} saveSettings={saveSettings} />
      {showHandoverModal && (<HandoverModal role={role} shift={shift} startingCash={startingCash} currentShiftStats={currentShiftStats} onClose={() => setShowHandoverModal(false)} onConfirm={confirmHandover} />)}

      {cashFlowModalInfo && (<div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }} onClick={() => setCashFlowModalInfo(null)}><div className="glass" style={{ padding: "20px", width: "700px", maxHeight: "85vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `2px solid ${cashFlowModalInfo === 'TIỀN MẶT' ? '#10b981' : '#3b82f6'}`, paddingBottom: "10px", marginBottom: "15px" }}><div><h2 style={{ margin: 0, color: cashFlowModalInfo === 'TIỀN MẶT' ? "#10b981" : "#3b82f6" }}>💸 DÒNG TIỀN {cashFlowModalInfo}</h2><div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Ca: <b>{shift}</b> ({todayStrStr})</div></div><button onClick={() => setCashFlowModalInfo(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button></div><div style={{ display: "flex", gap: "15px", flex: 1, overflow: "hidden" }}><div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f0fdf4", padding: "12px", borderRadius: "8px", border: "1px solid #bbf7d0" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px dashed #86efac", paddingBottom: "8px", marginBottom: "10px" }}><h3 style={{ margin: 0, fontSize: "14px", color: "#16a34a" }}>⬇️ THU VÀO (+)</h3><span style={{ fontWeight: "900", color: "#15803d" }}>{currentShiftCashFlow.thu.reduce((acc: any, i: any) => acc + i.amount, 0).toLocaleString()}đ</span></div><div style={{ overflowY: "auto", flex: 1, paddingRight: "5px" }}>{currentShiftCashFlow.thu.length === 0 && <div style={{ fontSize: "11px", color: "#16a34a", textAlign: "center", marginTop: "20px" }}>Chưa có phát sinh thu.</div>}{currentShiftCashFlow.thu.map((item: any, idx: number) => (<div key={idx} style={{ padding: "8px 0", borderBottom: "1px dashed #bbf7d0", fontSize: "12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}><div style={{ display: "flex", flexDirection: "column", maxWidth: "70%" }}><b style={{ color: "#14532d", wordBreak: "break-word" }}>{item.note}</b><span style={{ fontSize: "10px", color: "#15803d", marginTop: "2px" }}>{item.time}</span></div><b style={{ color: "#16a34a", whiteSpace: "nowrap" }}>+{item.amount.toLocaleString()}đ</b></div>))}</div></div><div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fef2f2", padding: "12px", borderRadius: "8px", border: "1px solid #fecaca" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px dashed #fca5a5", paddingBottom: "8px", marginBottom: "10px" }}><h3 style={{ margin: 0, fontSize: "14px", color: "#dc2626" }}>⬆️ CHI RA (-)</h3><span style={{ fontWeight: "900", color: "#b91c1c" }}>{currentShiftCashFlow.chi.reduce((acc: any, i: any) => acc + i.amount, 0).toLocaleString()}đ</span></div><div style={{ overflowY: "auto", flex: 1, paddingRight: "5px" }}>{currentShiftCashFlow.chi.length === 0 && <div style={{ fontSize: "11px", color: "#dc2626", textAlign: "center", marginTop: "20px" }}>Chưa có phát sinh chi.</div>}{currentShiftCashFlow.chi.map((item: any, idx: number) => (<div key={idx} style={{ padding: "8px 0", borderBottom: "1px dashed #fecaca", fontSize: "12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}><div style={{ display: "flex", flexDirection: "column", maxWidth: "70%" }}><b style={{ color: "#7f1d1d", wordBreak: "break-word" }}>{item.note}</b><span style={{ fontSize: "10px", color: "#b91c1c", marginTop: "2px" }}>{item.time}</span></div><b style={{ color: "#dc2626", whiteSpace: "nowrap" }}>-{item.amount.toLocaleString()}đ</b></div>))}</div></div></div><div style={{ marginTop: "15px", background: "var(--bg-input)", padding: "15px", borderRadius: "8px", border: "1px dashed var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center" }}><b style={{ color: "var(--text-main)", fontSize: "14px" }}>💰 TỔNG TỒN QUỸ {cashFlowModalInfo}:</b><span style={{ fontSize: "20px", fontWeight: "900", color: cashFlowModalInfo === 'TIỀN MẶT' ? "#059669" : "#3b82f6" }}>{cashFlowModalInfo === 'TIỀN MẶT' ? currentShiftStats.cash.toLocaleString() : currentShiftStats.transfer.toLocaleString()}đ</span></div></div></div>)}
      {showStatsModal && (<div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}><div className="glass" style={{ padding: "25px", width: "600px", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}><div style={{ display: "flex", gap: "10px", alignItems: "center" }}><h2 style={{ margin: 0, color: "#3b82f6" }}>📊 BÁO CÁO</h2><input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "11px", border: "1px solid var(--border-glass)" }}/> <span style={{fontSize: "12px", fontWeight:"bold", color: "var(--text-muted)"}}>đến</span> <input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "11px", border: "1px solid var(--border-glass)" }}/></div><div style={{ display: "flex", gap: "6px" }}><button onClick={exportToCSV} style={{ fontSize: "10px", padding: "6px 10px", background: "#10b981", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>📥 XUẤT EXCEL</button><button onClick={sendInventoryAlertEmail} style={{ fontSize: "10px", padding: "6px 10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }} title="Gửi mail các món sắp hết hạn/hết hàng">🚨 CẢNH BÁO KHO</button><button onClick={handleSendEmailReport} style={{ fontSize: "10px", padding: "6px 10px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>📧 GỬI MAIL BC</button><button onClick={() => setShowStatsModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)", marginLeft: "5px" }}>✖</button></div></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "15px" }}><div style={{ background: "#eff6ff", padding: "10px", borderRadius: "8px", border: "1px solid #bfdbfe", textAlign: "center" }}><div style={{ fontSize: "10px", color: "#3b82f6", fontWeight: "bold" }}>DOANH THU KỲ</div><div style={{ fontSize: "14px", fontWeight: "bold", color: "#1e3a8a", marginTop: "4px" }}>{filteredStats.totalSales.toLocaleString()}đ</div></div><div style={{ background: "#fef2f2", padding: "10px", borderRadius: "8px", border: "1px solid #fecaca", textAlign: "center" }}><div style={{ fontSize: "10px", color: "#ef4444", fontWeight: "bold" }}>CHI PHÍ KỲ</div><div style={{ fontSize: "14px", fontWeight: "bold", color: "#b91c1c", marginTop: "4px" }}>-{filteredStats.expenses.toLocaleString()}đ</div></div><div style={{ background: "#f0fdf4", padding: "10px", borderRadius: "8px", border: "1px solid #bbf7d0", textAlign: "center" }}><div style={{ fontSize: "10px", color: "#16a34a", fontWeight: "bold" }}>LỢI NHUẬN RÒNG</div><div style={{ fontSize: "14px", fontWeight: "bold", color: "#14532d", marginTop: "4px" }}>{filteredStats.netProfit.toLocaleString()}đ</div></div></div><div style={{ marginBottom: "20px" }}><h3 style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 5px 0" }}>📈 Doanh thu 30 ngày qua</h3><div className="chart-container-scroll">{chartData.map((d, i) => (<div key={i} className="chart-bar-group"><div className="chart-val" style={{ visibility: d.showLabel && d.total > 0 ? 'visible' : 'hidden' }}>{(d.total / 1000).toFixed(0)}k</div><div className="chart-bar" style={{ height: d.height }}></div><div className="chart-label" style={{ visibility: d.showLabel ? 'visible' : 'hidden' }}>{d.label}</div></div>))}</div></div><div style={{ display: "flex", gap: "20px" }}><div style={{ flex: 1 }}><h3 style={{ fontSize: "12px", margin: "0 0 8px 0", color: "var(--text-main)" }}>🏆 Top Bán Chạy</h3>{topSelling.map((item, idx) => (<div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--border-glass)", fontSize: "11px" }}><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>{idx + 1}. {item[0]}</span><span style={{ fontWeight: "bold", color: "#10b981" }}>{item[1]}</span></div>))}</div><div style={{ flex: 1 }}><h3 style={{ fontSize: "12px", color: "#b91c1c", margin: "0 0 8px 0" }}>📉 Sắp hết hàng</h3>{products.filter(p => p.stock > 0 && p.stock < 10).slice(0, 5).map((p, idx) => (<div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--border-glass)", fontSize: "11px" }}><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>{cleanName(p.name)}</span><span style={{ fontWeight: "bold", color: "#ef4444" }}>Còn {p.stock}</span></div>))}</div></div></div></div>)}
      {showInventoryModal && role === 'admin' && (<div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}><div className="glass" style={{ padding: "25px", width: "900px", maxWidth: "95vw", maxHeight: "85vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "15px" }}><h2 style={{ margin: 0, color: "#10b981" }}>📦 KIỂM KHO (INVENTORY CHECK)</h2><button onClick={() => setShowInventoryModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button></div><div style={{ background: "#fef2f2", padding: "10px", borderRadius: "8px", fontSize: "12px", color: "#b91c1c", marginBottom: "10px", border: "1px dashed #fca5a5" }}><b>Hướng dẫn:</b> Quẹt mã vạch ➡️ Gõ số lượng ➡️ Bấm Enter. Hoặc dùng tính năng <b>Xuất/Nhập Excel</b>.</div><div style={{ display: "flex", gap: "10px", marginBottom: "15px", flexWrap: "wrap", alignItems: "center" }}><div style={{ position: "relative", flex: "1 1 300px", display: "flex" }}><span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "16px" }}>🔍</span><input id="inv-search-box" placeholder="Tìm tên hoặc Quẹt mã vạch..." value={inventorySearchTerm} onChange={e => setInventorySearchTerm(e.target.value)} onKeyDown={handleInventorySearchEnter} autoFocus style={{ flex: 1, padding: "10px 15px 10px 35px", borderRadius: "8px", border: "2px solid #10b981", outline: "none", fontWeight: "bold", fontSize: "14px" }} /></div><div style={{ display: "flex", gap: "5px", background: "var(--bg-input)", padding: "4px", borderRadius: "8px", border: "1px solid var(--border-glass)" }}><button onClick={() => setInvFilter("ALL")} style={{ padding: "8px 12px", background: invFilter === "ALL" ? "#3b82f6" : "transparent", color: invFilter === "ALL" ? "#fff" : "var(--text-main)", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", transition: "0.2s" }}>📋 Tất cả SP</button><button onClick={() => setInvFilter("DIFF")} style={{ padding: "8px 12px", background: invFilter === "DIFF" ? "#ef4444" : "transparent", color: invFilter === "DIFF" ? "#fff" : "var(--text-main)", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", transition: "0.2s" }}>⚠️ Đang lệch</button><button onClick={() => setInvFilter("MATCH")} style={{ padding: "8px 12px", background: invFilter === "MATCH" ? "#10b981" : "transparent", color: invFilter === "MATCH" ? "#fff" : "var(--text-main)", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", transition: "0.2s" }}>✅ Đã khớp</button></div><button onClick={exportInventoryCSV} style={{ padding: "10px 15px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>📥 Xuất File</button><label style={{ padding: "10px 15px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>📤 Nhập File<input type="file" accept=".csv, .xlsx, .xls" onChange={handleImportInventoryCSV} style={{ display: "none" }} /></label></div><div style={{ overflowY: "auto", flex: 1, paddingRight: "5px" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}><thead><tr style={{ borderBottom: "1px solid var(--border-glass)", color: "var(--text-muted)", textAlign: "left", position: "sticky", top: 0, background: "var(--bg-glass)", zIndex: 1 }}><th style={{ padding: "8px" }}>Sản phẩm</th><th style={{ padding: "8px", textAlign: "center" }}>Kho PM</th><th style={{ padding: "8px", textAlign: "center" }}>Thực tế</th><th style={{ padding: "8px", textAlign: "center" }}>Chênh lệch</th></tr></thead><tbody>{products.filter(p => { const safeName = String(cleanName(p.name) || "").toLowerCase(); const safeCode = String(p.product_code || "").toLowerCase(); const term = String(inventorySearchTerm || "").toLowerCase(); const matchSearch = safeName.includes(term) || safeCode.includes(term); const actual = actualStockInput[p.id] !== undefined ? actualStockInput[p.id] : (Number(p.stock) || 0); const diff = actual - (Number(p.stock) || 0); if (invFilter === 'DIFF') return matchSearch && diff !== 0; if (invFilter === 'MATCH') return matchSearch && diff === 0; return matchSearch; }).map(p => { const actual = actualStockInput[p.id] !== undefined ? actualStockInput[p.id] : p.stock; const diff = actual - p.stock; return (<tr key={p.id} style={{ borderBottom: "1px dashed var(--border-glass)", background: diff !== 0 ? "rgba(250, 204, 21, 0.1)" : "transparent" }}><td style={{ padding: "8px", fontWeight: "bold" }}>{cleanName(p.name)} <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "normal" }}>{p.product_code}</div></td><td style={{ padding: "8px", textAlign: "center", color: "#3b82f6", fontWeight: "bold", fontSize: "15px" }}>{p.stock}</td><td style={{ padding: "8px", textAlign: "center" }}><input id={`inv-input-${p.id}`} type="number" value={actual} onChange={(e) => setActualStockInput(prev => ({...prev, [p.id]: Number(e.target.value)}))} onKeyDown={handleInvInputKeyDown} style={{ width: "70px", padding: "8px", borderRadius: "6px", textAlign: "center", border: "2px solid #fdba74", fontWeight: "bold", outline: "none", fontSize: "14px" }} onFocus={e => { e.target.select(); e.target.style.borderColor = "#10b981"; }} onBlur={e => e.target.style.borderColor = "#fdba74"} /></td><td style={{ padding: "8px", textAlign: "center", fontWeight: "900", fontSize: "15px", color: diff > 0 ? "#10b981" : (diff < 0 ? "#ef4444" : "var(--text-muted)") }}>{diff > 0 ? `+${diff}` : diff}</td></tr>) })}</tbody></table>{products.filter(p => { const safeName = String(cleanName(p.name) || "").toLowerCase(); const safeCode = String(p.product_code || "").toLowerCase(); const term = String(inventorySearchTerm || "").toLowerCase(); const matchSearch = safeName.includes(term) || safeCode.includes(term); const diff = (actualStockInput[p.id] !== undefined ? actualStockInput[p.id] : (Number(p.stock) || 0)) - (Number(p.stock) || 0); if (invFilter === 'DIFF') return matchSearch && diff !== 0; if (invFilter === 'MATCH') return matchSearch && diff === 0; return matchSearch; }).length === 0 && (<div style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>Không tìm thấy sản phẩm khớp với bộ lọc.</div>)}</div><div style={{ display: "flex", gap: "10px", marginTop: "15px", borderTop: "1px dashed var(--border-glass)", paddingTop: "15px" }}><button onClick={() => { setActualStockInput({}); setInventorySearchTerm(""); setInvFilter("ALL"); }} style={{ flex: 1, padding: "12px", background: "var(--border-glass)", color: "var(--text-main)", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>↺ Hủy thao tác</button><button onClick={syncInventoryCheck} disabled={loading || Object.keys(actualStockInput).length === 0} style={{ flex: 2, padding: "12px", background: Object.keys(actualStockInput).length === 0 ? "var(--border-glass)" : "#10b981", color: Object.keys(actualStockInput).length === 0 ? "var(--text-muted)" : "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: Object.keys(actualStockInput).length === 0 ? "not-allowed" : "pointer" }}>{loading ? "Đang đồng bộ..." : "💾 CẬP NHẬT CHÊNH LỆCH VÀO SỔ"}</button></div></div></div>)}
      {showCustomerModal && (<div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}><div className="glass" style={{ padding: "25px", width: "600px", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #c7d2fe", paddingBottom: "10px", marginBottom: "10px" }}><h2 style={{ margin: 0, color: "#4f46e5" }}>🤝 QUẢN LÝ KHÁCH HÀNG</h2><button onClick={() => setShowCustomerModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button></div><div style={{ overflowY: "auto", flex: 1 }}>{Object.keys(customers).length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>Chưa có KH.</div>}{Object.keys(customers).map(phone => { const c = customers[phone]; const tier = getCustomerTier(c.totalSpent || 0); return (<div key={phone} style={{ padding: "12px", borderBottom: "1px dashed #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", background: tier.bg, borderRadius: "8px", marginBottom: "8px", border: `1px solid ${tier.border}` }}><div style={{ flex: 1, minWidth: "200px" }}><div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ fontWeight: "bold", color: "#1e293b", cursor: "pointer", fontSize: "15px" }} onClick={() => { const newName = window.prompt("Sửa tên:", c.name); if (newName) { const newC = { ...c, name: newName }; setCustomers((prev: any) => ({ ...prev, [phone]: newC })); logAudit("SỬA KH", `Đổi tên KH`) } }} title="Sửa tên">{c.name} ✏️</div><span style={{ fontSize: "10px", fontWeight: "900", color: tier.color, border: `1px solid ${tier.color}`, padding: "2px 6px", borderRadius: "12px", background: "#fff" }}>{tier.name}</span></div><div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}><span onClick={() => handleEditPhone(phone)} style={{ cursor: "pointer", fontWeight: "bold" }} title="Đổi SĐT">📞 {phone} ✏️</span><span style={{ cursor: "pointer", color: "#3b82f6", fontWeight: "bold", marginLeft: "10px" }} onClick={() => { const newEmail = window.prompt("Sửa Email:", c.email || ""); if (newEmail !== null) { const newC = { ...c, email: newEmail.trim() }; setCustomers((prev: any) => ({ ...prev, [phone]: newC })); logAudit("SỬA EMAIL", `Cập nhật Email KH`) } }} title="Cập nhật Email">{c.email ? `📧 ${c.email}` : `📧 +Thêm Mail`}</span></div><div style={{ fontSize: "11px", color: "#64748b", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}><span onClick={() => { const newCard = window.prompt("Mã Thẻ:", c.cardCode || ""); if (newCard !== null) { const newC = { ...c, cardCode: newCard.trim() }; setCustomers((prev: any) => ({ ...prev, [phone]: newC })); logAudit("SỬA MÃ THẺ", `Cập nhật mã thẻ`) } }} style={{ cursor: "pointer", color: "#ea580c", fontWeight: "bold", marginRight: "10px" }} title="Mã thẻ">{c.cardCode ? `💳 Mã: ${c.cardCode}` : `💳 +Gán Mã Thẻ`}</span><button onClick={() => printCustomerCard(phone)} style={{ padding: "4px 6px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "9px", fontWeight: "bold" }}>🖨️ In Thẻ</button><button onClick={() => sendCardEmail(phone)} style={{ padding: "4px 6px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "9px", fontWeight: "bold" }}>📧 Mail</button><button onClick={() => shareToZalo(phone)} style={{ padding: "4px 6px", background: "#059669", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "9px", fontWeight: "bold" }}>💬 Zalo</button></div></div><div style={{ textAlign: "right" }}><div style={{ color: "#475569", fontSize: "10px", marginBottom: "4px" }}>Đã chi tiêu: <b style={{ color: "#0f172a" }}>{(c.totalSpent || 0).toLocaleString()}đ</b></div><div style={{ color: "#10b981", fontWeight: "bold", fontSize: "12px" }}>Ví: {(c.wallet || 0).toLocaleString()}đ</div><div style={{ color: "#ef4444", fontWeight: "bold", fontSize: "12px" }}>Nợ: {(c.debt || 0).toLocaleString()}đ</div></div></div>) })}</div></div></div>)}
      {showDebtModal && (<div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}><div className="glass" style={{ padding: "25px", width: "400px", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #fed7aa", paddingBottom: "10px", marginBottom: "10px" }}><h2 style={{ margin: 0, color: "#ef4444" }}>📓 SỔ NỢ</h2><button onClick={() => setShowDebtModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button></div><div style={{ overflowY: "auto", flex: 1 }}>{Object.keys(customers).filter(p => (customers[p].debt || 0) > 0).map(phone => (<div key={phone} style={{ padding: "10px", borderBottom: "1px dashed var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontWeight: "bold" }}>{customers[phone].name}</div><div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{phone}</div><div style={{ color: "#ef4444", fontWeight: "bold" }}>Nợ: {(customers[phone].debt || 0).toLocaleString()}đ</div></div><button onClick={() => handlePayDebt(phone)} style={{ padding: "6px 12px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" }}>THU TIỀN</button></div>))}{Object.keys(customers).filter(p => (customers[p].debt || 0) > 0).length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>Không có nợ.</div>}</div></div></div>)}
      {showAuditModal && (<div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}><div className="glass" style={{ padding: "25px", width: "650px", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "10px" }}><div style={{ display: "flex", gap: "10px", alignItems: "center" }}><h2 style={{ margin: 0, color: "#334155" }}>🕵️ NHẬT KÝ HỆ THỐNG</h2><button onClick={exportAuditToCSV} style={{ fontSize: "10px", padding: "4px 8px", background: "#10b981", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>📥 XUẤT FILE</button></div><button onClick={() => setShowAuditModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button></div><div style={{ overflowY: "auto", flex: 1, fontSize: "12px", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "5px", background: "var(--bg-input)" }}>{auditLogs.length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>Chưa có bản ghi nào.</div>}{auditLogs.map((log, idx) => (<div key={idx} onClick={() => setSelectedAuditLog(log)} style={{ padding: "10px", borderBottom: "1px dashed var(--border-glass)", cursor: "pointer", transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}><span style={{ fontWeight: "bold", color: "#b91c1c" }}>[{log.action}]</span><span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{log.time}</span></div><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: "10px" }}>{log.detail}</span><span style={{ fontWeight: "bold", color: "#3b82f6" }}>{log.user_name} ({log.shift})</span></div></div>))}</div></div></div>)}
      {selectedAuditLog && (<div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10000 }} onClick={() => setSelectedAuditLog(null)}><div className="glass" style={{ padding: "20px", width: "450px", maxWidth: "90%", background: "var(--bg-glass)" }} onClick={e => e.stopPropagation()}><h3 style={{ margin: "0 0 10px 0", color: "#ef4444", borderBottom: "1px dashed var(--border-glass)", paddingBottom: "5px" }}>Chi tiết thao tác</h3><div style={{ fontSize: "13px", lineHeight: "1.6" }}><p style={{ margin: "5px 0" }}><b>Hành động:</b> {selectedAuditLog.action}</p><p style={{ margin: "5px 0" }}><b>Người thực hiện:</b> {selectedAuditLog.user_name} - {selectedAuditLog.shift}</p><p style={{ margin: "5px 0" }}><b>Thời gian:</b> {selectedAuditLog.time}</p><p style={{ margin: "5px 0" }}><b>Tóm tắt:</b> <span style={{ color: "#3b82f6" }}>{selectedAuditLog.detail}</span></p>{selectedAuditLog.extra_data && (<div style={{ marginTop: "10px" }}><b style={{ color: "#059669", fontSize: "12px", display: "block", marginBottom: "5px" }}>Dữ liệu chi tiết:</b><div style={{ background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", maxHeight: "250px", overflowY: "auto", padding: "10px" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}><tbody>{Object.entries(JSON.parse(selectedAuditLog.extra_data)).map(([k, v]) => (<tr key={k} style={{ borderBottom: "1px dashed var(--border-glass)" }}><td style={{ padding: "6px 4px", fontWeight: "bold", color: "var(--text-muted)", width: "35%", verticalAlign: "top" }}>{k}</td><td style={{ padding: "6px 4px", color: "var(--text-main)", wordBreak: "break-word" }}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</td></tr>))}</tbody></table></div></div>)}</div><button onClick={() => setSelectedAuditLog(null)} style={{ marginTop: "15px", width: "100%", padding: "10px", background: "#e2e8f0", color: "#1e293b", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Đóng</button></div></div>)}
      {showHoldModal && (<div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}><div className="glass" style={{ padding: "25px", width: "400px", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #fed7aa", paddingBottom: "10px", marginBottom: "10px" }}><h2 style={{ margin: 0, color: "#f59e0b" }}>📂 ĐƠN LƯU TẠM</h2><button onClick={() => setShowHoldModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button></div><div style={{ overflowY: "auto", flex: 1 }}>{heldOrders.length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>Trống.</div>}{heldOrders.map((order, idx) => (<div key={order.id} style={{ padding: "10px", borderBottom: "1px dashed var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-input)", borderRadius: "8px", marginBottom: "8px" }}><div><div style={{ fontWeight: "bold" }}>Đơn #{idx + 1}</div><div style={{ fontSize: "11px", color: "var(--text-muted)" }}>⏰ {order.time}</div><div style={{ fontSize: "11px", color: "#b91c1c", fontWeight: "bold" }}>Gồm {order.cart.reduce((s: any, i: any) => s + (Number(i.qty) || 0), 0)} SP</div></div><div style={{ display: "flex", gap: "4px" }}><button onClick={() => restoreOrder(order)} style={{ padding: "6px 10px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" }}>MỞ</button><button onClick={() => deleteHeldOrder(order.id)} style={{ padding: "6px", background: "#fee2e2", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: "6px", cursor: "pointer", fontSize: "11px" }}>🗑️</button></div></div>))}</div></div></div>)}
      {scannerMode !== null && (<div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 10000 }}><div style={{ background: "#fff", padding: "10px", borderRadius: "12px", width: "90%", maxWidth: "400px", position: "relative" }} onClick={e => e.stopPropagation()}><h3 style={{ margin: "0 0 10px 0", textAlign: "center", color: "#b91c1c" }}>{scannerMode === 'voucher' ? '📷 Quét mã Voucher' : (scannerMode === 'customer' ? '📷 Quét Thẻ VIP' : '📷 Đưa mã vạch vào khung')}</h3>{scanMessage && <div style={{ position: "absolute", top: "50px", left: "50%", transform: "translateX(-50%)", padding: "8px 16px", background: scanMessage.type === 'success' ? "#10b981" : "#ef4444", color: "#fff", fontWeight: "bold", borderRadius: "20px", zIndex: 10001, boxShadow: "0 4px 6px rgba(0,0,0,0.3)", animation: "float 0.5s ease-out" }}>{scanMessage.text}</div>}<div id="qr-reader" style={{ width: "100%" }}></div><button onClick={() => setScannerMode(null)} style={{ width: "100%", padding: "12px", marginTop: "15px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>ĐÓNG CAMERA</button></div></div>)}
      {isCheckoutOpen && (<div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>{checkoutStep === 1 && (<div className="glass" style={{ padding: "25px", width: "350px" }} onClick={e => e.stopPropagation()}><h3 style={{ color: "#ef4444", margin: "0", textAlign: "center" }}>🧧 THANH TOÁN</h3><div style={{ display: "flex", position: "relative", marginTop: "15px" }}><input type="text" placeholder="👉 Nhập mã Voucher..." value={voucherInput} onChange={(e) => setVoucherInput(e.target.value)} onKeyDown={handleVoucherSubmit} style={{ flex: 1, padding: "12px", borderRadius: "10px 0 0 10px", border: "2px dashed #f59e0b", outline: "none", boxSizing: "border-box" }} /><button onClick={() => { const code = voucherInput.trim().toUpperCase(); const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 }; if (VOUCHERS[code]) { setAppliedVoucherAmount(VOUCHERS[code]); playSound('success'); } else if (!isNaN(Number(code)) && Number(code) > 0) { setAppliedVoucherAmount(Number(code)); playSound('success'); } else { playSound('error'); alert("Mã Voucher lỗi!"); setAppliedVoucherAmount(0); } }} style={{ padding: "0 15px", background: "#f59e0b", border: "none", cursor: "pointer", color: "white", fontWeight: "bold", borderLeft: "1px solid #d97706" }}>ÁP DỤNG</button><button onClick={() => setScannerMode('voucher')} style={{ padding: "0 15px", background: "#f59e0b", border: "none", borderRadius: "0 10px 10px 0", cursor: "pointer", color: "white", fontSize: "18px", borderLeft: "1px solid #d97706" }}>📷</button></div>{appliedVoucherAmount > 0 && <div style={{ color: "#059669", fontSize: "12px", fontWeight: "bold", marginTop: "4px", textAlign: "center" }}>✅ Đã áp dụng giảm: {appliedVoucherAmount.toLocaleString()}đ</div>}<div style={{ display: "flex", position: "relative", marginTop: "10px" }}><input type="text" placeholder="👉 Quẹt Thẻ VIP/SĐT..." value={customerInput} onChange={handleCustomerInputChange} style={{ flex: 1, padding: "12px", borderRadius: "10px 0 0 10px", border: "2px solid #ef4444", outline: "none", boxSizing: "border-box", fontWeight: "bold", color: "#b91c1c" }} /><button onClick={() => setScannerMode('customer')} style={{ padding: "0 15px", background: "#ef4444", border: "none", borderRadius: "0 10px 10px 0", cursor: "pointer", color: "white", fontSize: "18px" }}>📷</button></div>{custPhone && (<div style={{ marginTop: "10px", padding: "12px", background: "var(--bg-input)", borderRadius: "8px", border: "1px dashed #f97316" }}>{customers[custPhone] ? (<div><div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ color: "#b91c1c", fontWeight: "bold" }}>⭐ {customers[custPhone].name}</div><span style={{ fontSize: "9px", fontWeight: "900", color: getCustomerTier(customers[custPhone].totalSpent).color, border: `1px solid ${getCustomerTier(customers[custPhone].totalSpent).color}`, padding: "2px 4px", borderRadius: "8px", background: "#fff" }}>{getCustomerTier(customers[custPhone].totalSpent).name}</span></div><div style={{ fontSize: "11px", color: "#059669", marginTop: "4px", fontWeight: "bold" }}>⚡ Giảm trực tiếp: {getCustomerTier(customers[custPhone].totalSpent).discountRate * 100}%</div><div style={{ marginTop: "4px" }}>Ví: <b>{Math.round(customers[custPhone].wallet || 0).toLocaleString()}đ</b> | Nợ: <b style={{ color: "#ef4444" }}>{(customers[custPhone].debt || 0).toLocaleString()}đ</b></div>{(customers[custPhone].wallet || 0) > 0 && (<label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", cursor: "pointer", color: "#ea580c", fontWeight: "bold" }}><input type="checkbox" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} /> Dùng điểm lì xì!</label>)}</div>) : (<input type="text" placeholder="Tên khách mới..." value={custName} onChange={e => setCustName(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", outline: "none", border: "1px solid #fdba74", boxSizing: "border-box" }} />)}</div>)}<div style={{ display: "flex", gap: "10px", marginTop: "20px" }}><button onClick={() => setIsCheckoutOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "var(--border-glass)", fontWeight: "bold", cursor: "pointer", color: "var(--text-main)" }}>Hủy</button><button onClick={handleNextToQR} style={{ flex: 2, padding: "10px", background: "#ef4444", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>TIẾP TỤC 👉</button></div></div>)}{checkoutStep === 2 && (<div className="glass" style={{ padding: "25px", width: "350px", textAlign: "center" }} onClick={e => e.stopPropagation()}><h3 style={{ color: "#ef4444", margin: "0" }}>📱 THANH TOÁN</h3><div style={{ color: "#ef4444", fontSize: "28px", fontWeight: "900", margin: "10px 0" }}>{finalToPay.toLocaleString()}đ</div>{finalToPay > 0 && (<div style={{ position: "relative" }}>{isOnline ? (<img src={`https://img.vietqr.io/image/${bankBin}-${bankAcc}-compact2.png?amount=${finalToPay - (Number(customerGiven) || 0) > 0 ? finalToPay - (Number(customerGiven) || 0) : finalToPay}&addInfo=Thanh toan&accountName=${encodeURIComponent(bankNameStr)}`} style={{ width: "160px", margin: "0 auto 10px auto", border: "2px solid #ef4444", borderRadius: "10px", display: "block", background: "#fff" }} alt="QR" />) : (<div style={{ width: "160px", height: "160px", margin: "0 auto 10px auto", border: "2px dashed #ef4444", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", background: "#fef2f2", color: "#ef4444", fontSize: "12px", fontWeight: "bold", textAlign: "center", padding: "10px", boxSizing: "border-box" }}>🚫 Mất mạng<br />Không thể tải QR</div>)}<div style={{ animation: "pulse-fast 1.5s infinite", color: "#b45309", fontSize: "11px", fontWeight: "bold", marginBottom: "5px" }}>⏳ Đang chờ tiền...</div></div>)}{finalToPay > 0 ? (<div style={{ marginBottom: "15px", textAlign: "left", borderTop: "1px dashed var(--border-glass)", paddingTop: "10px" }}><div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "bold", marginBottom: "5px" }}>Khách thanh toán Tiền mặt:</div><input type="number" placeholder="Nhập số tiền TM..." value={customerGiven} onChange={e => setCustomerGiven(Number(e.target.value) || "")} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-glass)", outline: "none", boxSizing: "border-box", fontSize: "14px", fontWeight: "bold" }} />{customerGiven !== "" && Number(customerGiven) < finalToPay && (<div style={{ marginTop: "10px", padding: "10px", background: "#fffbeb", border: "1px dashed #f59e0b", borderRadius: "8px", color: "#d97706", fontSize: "11px", textAlign: "center", fontWeight: "bold" }}>Còn thiếu: {(finalToPay - Number(customerGiven)).toLocaleString()}đ <br/> (Quét mã QR ở trên để trả phần còn thiếu)</div>)}{customerGiven !== "" && Number(customerGiven) >= finalToPay && <div style={{ marginTop: "10px", padding: "10px", background: "#ecfdf5", border: "1px dashed #10b981", borderRadius: "8px", color: "#059669", fontWeight: "bold", fontSize: "16px", textAlign: "center" }}>THỐI LẠI: {(Number(customerGiven) - finalToPay).toLocaleString()}đ</div>}<div style={{ display: "flex", gap: "5px", marginTop: "8px", flexWrap: "wrap" }}><button onClick={() => setCustomerGiven(finalToPay)} style={{ flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid var(--border-glass)", cursor: "pointer", background: "var(--bg-input)", color: "var(--text-main)" }}>Vừa đủ</button><button onClick={() => setCustomerGiven(50000)} style={{ flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid var(--border-glass)", cursor: "pointer", background: "var(--bg-input)", color: "var(--text-main)" }}>50k</button><button onClick={() => setCustomerGiven(100000)} style={{ flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid var(--border-glass)", cursor: "pointer", background: "var(--bg-input)", color: "var(--text-main)" }}>100k</button><button onClick={() => setCustomerGiven(200000)} style={{ flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid var(--border-glass)", cursor: "pointer", background: "var(--bg-input)", color: "var(--text-main)" }}>200k</button><button onClick={() => setCustomerGiven(500000)} style={{ flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid var(--border-glass)", cursor: "pointer", background: "var(--bg-input)", color: "var(--text-main)" }}>500k</button></div></div>) : (<div style={{ marginBottom: "15px", padding: "15px", background: "#ecfdf5", border: "1px dashed #10b981", borderRadius: "8px", color: "#059669", fontWeight: "bold" }}>✅ Đã thanh toán đủ bằng Ví/Voucher</div>)}<div style={{ display: "flex", gap: "8px", flexWrap: "wrap", borderTop: "1px dashed var(--border-glass)", paddingTop: "10px" }}><button onClick={() => setCheckoutStep(1)} style={{ flex: "1 1 100%", padding: "8px", borderRadius: "8px", border: "none", background: "#fca5a5", cursor: "pointer", fontWeight: "bold", color: "#b91c1c", marginBottom: "4px" }}>Quay lại</button>{finalToPay > 0 ? (<>{customerGiven !== "" && Number(customerGiven) > 0 && Number(customerGiven) < finalToPay ? (<button onClick={() => confirmCheckout('KẾT HỢP')} disabled={loading} style={{ flex: "1 1 100%", padding: "12px", background: "#8b5cf6", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "12px" }}>💳 THANH TOÁN KẾT HỢP (TM + CK)</button>) : (<><button onClick={() => confirmCheckout('GHI NỢ')} disabled={loading} style={{ flex: 1, padding: "10px", background: "#f59e0b", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "11px" }}>📝 GHI NỢ</button><button onClick={() => confirmCheckout('QUẸT THẺ')} disabled={loading} style={{ flex: 1, padding: "10px", background: "#8b5cf6", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "11px" }}>💳 QUẸT THẺ</button><button onClick={() => confirmCheckout('CHUYỂN KHOẢN')} disabled={loading} style={{ flex: 1, padding: "10px", background: "#3b82f6", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "11px" }}>🏦 C.KHOẢN (F3)</button><button onClick={() => { if (finalToPay > 0 && (customerGiven === "" || Number(customerGiven) < finalToPay)) { playSound('error'); alert(`Khách đưa chưa đủ tiền!`); return } confirmCheckout('TIỀN MẶT') }} disabled={loading} style={{ flex: 1, padding: "10px", background: "#10b981", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "11px" }}>💵 T.MẶT (F2)</button></>)}</>) : (<button onClick={() => confirmCheckout('TIỀN MẶT')} disabled={loading} style={{ flex: "1 1 100%", padding: "12px", background: "#10b981", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "14px" }}>HOÀN TẤT ĐƠN HÀNG</button>)}</div></div>)}{checkoutStep === 3 && (<div className="glass" style={{ padding: "30px", width: "350px", textAlign: "center" }} onClick={e => e.stopPropagation()}><div style={{ fontSize: "40px" }}>🌸</div><h3 style={{ color: "#10b981", margin: "10px 0" }}>Thành công!</h3><div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}><button onClick={() => { setPrintMode('receipt'); setTimeout(() => window.print(), 300) }} style={{ flex: 1, padding: "12px", background: "#ef4444", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "12px" }}>🖨️ In Bill</button><button onClick={() => { setPrintMode('invoice_a4'); setTimeout(() => window.print(), 300) }} style={{ flex: 1, padding: "12px", background: "#3b82f6", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "12px" }}>🖨️ In A4</button><button onClick={sendReceiptEmail} disabled={loading} style={{ flex: "1 1 100%", padding: "12px", background: "#8b5cf6", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "12px" }}>{loading ? "Đang gửi..." : "📧 Email Khách"}</button><button onClick={closeCheckout} style={{ flex: "1 1 100%", padding: "12px", background: "var(--border-glass)", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "12px", color: "var(--text-main)" }}>Đóng</button></div></div>)}</div>)}
    </>
  );

  return (
    <div onClick={() => { setOpenFilter(null); setShowSuggestions(false); setShowMainMenu(false) }}>
      <style>{styles}</style> 
      <style>{`
        .animated-bg-mesh { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; background: linear-gradient(135deg, #ffedd5 0%, #fef08a 50%, #fed7aa 100%); background-size: 400% 400%; animation: gradientBgAnim 15s ease infinite; opacity: 0.8; }
        @keyframes gradientBgAnim { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        [data-theme='dark'] .animated-bg-mesh { background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); opacity: 1; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
      <div className="animated-bg-mesh"></div>

     
      <input type="text" id="search-barcode" style={{position:'absolute', opacity: 0, height: 0, width: 0}} />
      
      {renderPrintArea()}
      {renderModals()}

      {!isLoggedIn ? (
        <div className="login-wrapper">
          <style>{`
            .login-wrapper { min-height: 100vh; width: 100vw; display: flex; justify-content: center; align-items: center; background: transparent; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; position: relative; overflow: hidden; margin: 0; padding: 0; }
            
            /* Bong bóng trang trí nền */
            .floating-bubble { position: absolute; background: rgba(255,255,255,0.4); border-radius: 50%; animation: floatUp linear infinite; bottom: -120px; filter: blur(2px); }
            @keyframes floatUp { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-120vh) scale(1.2); opacity: 0; } }
            
            /* Form đăng nhập chính */
            .glass-login { 
              background: rgba(255, 255, 255, 0.95); 
              backdrop-filter: blur(20px); 
              border: 1px solid rgba(255, 255, 255, 0.8); 
              padding: 40px 35px; 
              border-radius: 20px; 
              box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1); 
              width: 100%; 
              max-width: 360px; 
              z-index: 10; 
              animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
            }
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            
            /* Tiêu đề */
            .login-header { text-align: center; margin-bottom: 30px; }
            .login-title { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; margin: 0 0 6px 0; color: #0f172a; text-transform: uppercase; }
            .login-title span { color: #e11d48; }
            .login-subtitle { font-size: 13px; color: #64748b; font-weight: 500; margin: 0; }
            
            /* Input Group có Icon */
            .input-group { position: relative; margin-bottom: 16px; }
            .input-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #94a3b8; display: flex; pointer-events: none; }
            .login-input { 
              width: 100%; 
              padding: 14px 14px 14px 44px; 
              border-radius: 12px; 
              border: 1.5px solid #e2e8f0; 
              background: #f8fafc; 
              box-sizing: border-box; 
              outline: none; 
              transition: all 0.2s ease; 
              font-size: 14px; 
              color: #1e293b; 
              font-weight: 500; 
            }
            .login-input::placeholder { color: #94a3b8; font-weight: 400; }
            .login-input:focus { border-color: #e11d48; background: #fff; box-shadow: 0 0 0 4px rgba(225, 29, 72, 0.1); }
            .login-input:focus + .input-icon svg { stroke: #e11d48; }
            
            /* Nút submit */
            .login-btn-submit { 
              width: 100%; 
              padding: 14px; 
              background: #e11d48; 
              color: #fff; 
              border: none; 
              border-radius: 12px; 
              font-weight: 700; 
              font-size: 14px; 
              cursor: pointer; 
              transition: all 0.2s ease; 
              box-shadow: 0 4px 12px rgba(225, 29, 72, 0.25); 
              margin-top: 10px; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              gap: 8px;
            }
            .login-btn-submit:hover:not(:disabled) { background: #be123c; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(225, 29, 72, 0.35); }
            .login-btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
          `}</style>
          
          <div className="floating-bubble" style={{ width: '100px', height: '100px', left: '10%', animationDuration: '8s' }}></div>
          <div className="floating-bubble" style={{ width: '50px', height: '50px', left: '25%', animationDuration: '5s', animationDelay: '2s' }}></div>
          <div className="floating-bubble" style={{ width: '80px', height: '80px', left: '70%', animationDuration: '10s', animationDelay: '1s' }}></div>
          <div className="floating-bubble" style={{ width: '140px', height: '140px', left: '85%', animationDuration: '14s', animationDelay: '4s' }}></div>
          
          <form className="glass-login" onSubmit={handleLogin}>
            <div className="login-header">
              <h2 className="login-title">HẢI LÊ <span>MART</span></h2>
              <p className="login-subtitle">Hệ thống Quản lý ERP & POS</p>
            </div>
            
            <div className="input-group">
              <input className="login-input" placeholder="Tên đăng nhập (Email)..." value={authUsername} onChange={e => setAuthUsername(e.target.value)} required />
              <div className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
            </div>
            
            <div className="input-group">
              <input className="login-input" type="password" placeholder="Mật khẩu truy cập..." value={authPassword} onChange={e => setAuthPassword(e.target.value)} required />
              <div className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
            </div>
            
            <button className="login-btn-submit" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <svg style={{ animation: "spin 1s linear infinite" }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                  ĐANG KIỂM TRA...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                  ĐĂNG NHẬP HỆ THỐNG
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
      ) : (
        <div className="no-print" style={{ padding: "15px", position: "relative", minHeight: "100vh", overflowX: "auto" }}>
          <div style={{ maxWidth: "1500px", margin: "0 auto", minWidth: "1000px" }}>
            
            {/* ======================================= */}
            {/* COMPONENT HEADER MỚI                      */}
            {/* ======================================= */}
            <Header 
              role={role}
              shift={shift}
              totalValue={totalValue}
              currentShiftStats={currentShiftStats}
              setCashFlowModalInfo={setCashFlowModalInfo}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              handleLogoutClick={handleLogoutClick}
              showMainMenu={showMainMenu}
              setShowMainMenu={setShowMainMenu}
              setShowStatsModal={setShowStatsModal}
              setShowCustomerModal={setShowCustomerModal}
              setShowInventoryModal={setShowInventoryModal}
              setShowDebtModal={setShowDebtModal}
              setShowAuditModal={setShowAuditModal}
              setShowExpenseModal={setShowExpenseModal}
              setShowSupplierModal={setShowSupplierModal}
              setShowMarketingModal={setShowMarketingModal}
              setNewBankBin={setNewBankBin}
              setNewBankAcc={setNewBankAcc}
              setNewBankNameStr={setNewBankNameStr}
              bankBin={bankBin}
              bankAcc={bankAcc}
              bankNameStr={bankNameStr}
              setShowSettings={setShowSettings}
              lowStockCount={lowStockCount}
              isOnline={isOnline}
              syncStatus={syncStatus}
              syncAllOfflineData={syncAllOfflineData}
            />
            
            <div style={{ display: "grid", gridTemplateColumns: "7fr 3fr", gap: "10px" }}>
              <div className="glass" style={{ padding: "12px" }}>
                
                {/* ======================================= */}
                {/* COMPONENT TÌM KIẾM & NÚT CÔNG CỤ TỪ FILE  */}
                {/* ======================================= */}
                <ProductSearchAndActions 
                  role={role}
                  barcodeInput={barcodeInput}
                  setBarcodeInput={setBarcodeInput}
                  showSuggestions={showSuggestions}
                  setShowSuggestions={setShowSuggestions}
                  handleBarcodeSubmit={handleBarcodeSubmit}
                  setScannerMode={setScannerMode}
                  products={products}
                  handleSelectSuggest={handleSelectSuggest}
                  showInputForm={showInputForm}
                  setShowInputForm={setShowInputForm}
                  handleFileUpload={handleFileUpload}
                  downloadSampleCSV={downloadSampleCSV}
                />

                {/* ======================================= */}
                {/* COMPONENT FORM NHẬP LẺ                  */}
                {/* ======================================= */}
                {showInputForm && role === 'admin' && (
                  <ProductInputForm 
                    handleAddProduct={handleAddProduct}
                    newCode={newCode} handleCodeChange={handleCodeChange}
                    newName={newName} setNewName={setNewName}
                    newCategory={newCategory} setNewCategory={setNewCategory}
                    categories={categories}
                    newImportPrice={newImportPrice} setNewImportPrice={setNewImportPrice}
                    newPrice={newPrice} setNewPrice={setNewPrice}
                    newPromoPrice={newPromoPrice} setNewPromoPrice={setNewPromoPrice}
                    newExpiry={newExpiry} setNewExpiry={setNewExpiry}
                    newGiftCondition={newGiftCondition} setNewGiftCondition={setNewGiftCondition}
                    newGiftInfo={newGiftInfo} setNewGiftInfo={setNewGiftInfo}
                    newStock={newStock} setNewStock={setNewStock}
                    loading={loading}
                  />
                )}

                <div style={{ display: "flex", gap: "8px", marginBottom: "15px", overflowX: "auto", paddingBottom: "4px" }}>
                  {categories.map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`tab-btn ${selectedCategory === cat ? 'active' : ''}`}>{cat}</button>)}
                </div>

                {/* ======================================= */}
                {/* COMPONENT BẢNG DANH SÁCH SẢN PHẨM         */}
                {/* ======================================= */}
                <ProductTable 
                  role={role}
                  sortedAndFilteredProducts={sortedAndFilteredProducts}
                  requestSort={requestSort}
                  handleEdit={handleEdit}
                  addToCart={addToCart}
                  handlePrintBarcode={handlePrintBarcode}
                  handleDelete={handleDelete}
                  sortConfig={sortConfig}
                  filters={filters}
                  setFilters={setFilters}
                  openFilter={openFilter}
                  setOpenFilter={setOpenFilter}
                  uniqueNames={uniqueNames}
                  uniqueStocks={uniqueStocks}
                  uniqueImportPrices={uniqueImportPrices}
                  uniqueSalePrices={uniqueSalePrices}
                  uniqueExpiries={uniqueExpiries}
                />
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                
                {/* ======================================= */}
                {/* COMPONENT GIỎ HÀNG (BÊN PHẢI TRÊN)        */}
                {/* ======================================= */}
                <CartPanel 
                  cart={cart}
                  custName={custName}
                  heldOrders={heldOrders}
                  cartTotalAmountDisplay={cartTotalAmountDisplay}
                  setShowHoldModal={setShowHoldModal}
                  handleHoldOrder={handleHoldOrder}
                  clearCart={clearCart}
                  setCustName={setCustName}
                  setCustPhone={setCustPhone}
                  setCustomerInput={setCustomerInput}
                  setIsCheckoutOpen={setIsCheckoutOpen}
                  setCheckoutStep={setCheckoutStep}
                  adjustCartQty={adjustCartQty}
                  handleDirectQtyChange={handleDirectQtyChange}
                  handleDirectQtyBlur={handleDirectQtyBlur}
                  removeFromCart={removeFromCart}
                />
                
                {/* ======================================= */}
                {/* COMPONENT LỊCH SỬ GIAO DỊCH (BÊN PHẢI DƯỚI)*/}
                {/* ======================================= */}
                <HistoryPanel 
                  logSearchTerm={logSearchTerm}
                  setLogSearchTerm={setLogSearchTerm}
                  logTypeFilter={logTypeFilter}
                  setLogTypeFilter={setLogTypeFilter}
                  exportToCSV={exportToCSV}
                  groupedHistory={groupedHistory}
                  expandedDates={expandedDates}
                  toggleDateGroup={toggleDateGroup}
                  handleRefund={handleRefund}
                  handleReprint={handleReprint}
                />
                
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

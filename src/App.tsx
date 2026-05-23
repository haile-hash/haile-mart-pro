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
import { DebtModal } from "./components/modals/DebtModal";
import { AuditModal } from "./components/modals/AuditModal";
import { ScannerModal } from "./components/modals/ScannerModal";
import { HandoverModal } from "./components/modals/HandoverModal";
import { ExpenseModal } from "./components/modals/ExpenseModal";
import { PinModal } from "./components/modals/PinModal"; 
import { ScannerLinkModal } from "./components/modals/ScannerLinkModal"; 
import { MobileScanner } from "./components/MobileScanner"; 

export default function App() {
  if (typeof window !== "undefined" && window.location.search.includes("scanner=true")) {
    return <MobileScanner />;
  }

  const VAT_RATE = 0.1;

  // 🔥 BẢO MẬT TUYỆT ĐỐI: CHỈ LẤY BIẾN TỪ VERCEL, KHÔNG CÓ FALLBACK LỘ MÃ
  const EMAILJS_SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
  const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
  const EMAILJS_TEMPLATE_VIP_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_VIP_ID;
  const EMAILJS_PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
  
  // =====================================================================
  // 1. STATES CƠ BẢN
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
  const [zaloPayId, setZaloPayId] = useState("");
  const [happyStart, setHappyStart] = useState("11:00");
  const [happyEnd, setHappyEnd] = useState("13:00");

  const [newBankBin, setNewBankBin] = useState("");
  const [newBankAcc, setNewBankAcc] = useState("");
  const [newBankNameStr, setNewBankNameStr] = useState("");
  const [newZaloPayId, setNewZaloPayId] = useState("");
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
  const [supAddress, setSupAddress] = useState("");
  const [supItem, setSupItem] = useState("");
  
  const [marketingTier, setMarketingTier] = useState("Tất cả");
  const [marketingMsg, setMarketingMsg] = useState("");
  
  const [reportStartDate, setReportStartDate] = useState(() => { 
    const d = new Date(); d.setDate(1); 
    return d.toISOString().split('T')[0]; 
  });
  const [reportEndDate, setReportEndDate] = useState(() => { 
    return new Date().toISOString().split('T')[0]; 
  });
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [logSearchTerm, setLogSearchTerm] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState("Tất cả");
  
  const [scanQueue, setScanQueue] = useState<string[]>([]);
  const [scanMessage, setScanMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [printBarcodeProduct, setPrintBarcodeProduct] = useState<Product | null>(null);
  const [printCustomer, setPrintCustomer] = useState<Customer | null>(null);
  const [barcodeCount, setBarcodeCount] = useState<number>(30);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);

  // States dành riêng cho Phiếu nhập PO
  const [localPOs, setLocalPOs] = useState<any[]>(() => { 
    const s = localStorage.getItem("mart_pos"); 
    return s ? JSON.parse(s) : []; 
  });
  const [poTab, setPoTab] = useState<'NEW' | 'RECEIVE'>('NEW');
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [poItems, setPoItems] = useState<any[]>([]);
  const [poSearch, setPoSearch] = useState("");
  const [poNote, setPoNote] = useState("");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [searchPoCode, setSearchPoCode] = useState("");
  const [foundPO, setFoundPO] = useState<any>(null);
  const [receiveItems, setReceiveItems] = useState<any[]>([]);
  const [allPOs, setAllPOs] = useState<any[]>([]);
  const [printPOData, setPrintPOData] = useState<any>(null);

  const { darkMode, setDarkMode, showSettings, setShowSettings, showInputForm, setShowInputForm, showDebtModal, setShowDebtModal, showStatsModal, setShowStatsModal, showCustomerModal, setShowCustomerModal, showHandoverModal, setShowHandoverModal, showAuditModal, setShowAuditModal, showHoldModal, setShowHoldModal, showExpenseModal, setShowExpenseModal, showSupplierModal, setShowSupplierModal, showMarketingModal, setShowMarketingModal, showInventoryModal, setShowInventoryModal, showMainMenu, setShowMainMenu, cashFlowModalInfo, setCashFlowModalInfo, scannerMode, setScannerMode, printMode, setPrintMode } = useUIState();
  const { newCode, setNewCode, newName, setNewName, newImportPrice, setNewImportPrice, newPrice, setNewPrice, newPromoPrice, setNewPromoPrice, newGiftCondition, setNewGiftCondition, newGiftInfo, setNewGiftInfo, newStock, setNewStock, newExpiry, setNewExpiry, newCategory, setNewCategory, resetProductForm } = useProductInput();
  const { cart, setCart, barcodeInput, setBarcodeInput, isCheckoutOpen, setIsCheckoutOpen, checkoutStep, setCheckoutStep, customerInput, setCustomerInput, custPhone, setCustPhone, custName, setCustName, useWallet, setUseWallet, voucherInput, setVoucherInput, appliedVoucherAmount, setAppliedVoucherAmount, customerGiven, setCustomerGiven, lastOrder, setLastOrder, resetCheckout } = useCheckoutState();

  const [customers, setCustomers] = useState<Record<string, Customer>>(() => { const s = localStorage.getItem("mart_customers"); return s ? JSON.parse(s) : {} });
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => { const s = localStorage.getItem("mart_held_orders"); return s ? JSON.parse(s) : [] });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => { const s = localStorage.getItem("mart_audit"); return s ? JSON.parse(s) : [] });
  const [expenses, setExpenses] = useState<any[]>(() => { const s = localStorage.getItem("mart_expenses"); return s ? JSON.parse(s) : [] });
  const [suppliers, setSuppliers] = useState<any[]>(() => { const s = localStorage.getItem("mart_suppliers"); return s ? JSON.parse(s) : [] });
  const [history, setHistory] = useState<TransactionLog[]>(() => { const s = localStorage.getItem("mart_history"); return s ? JSON.parse(s) : [] });

  const { isOnline, syncStatus, syncAllOfflineData, loadCloudData } = useOfflineSync({ isLoggedIn, history, setHistory, customers, setCustomers, heldOrders, setHeldOrders, auditLogs, setAuditLogs, expenses, setExpenses, suppliers, setSuppliers });

  // 🔥 TẠO BIẾN AN TOÀN (SAFEGUARDS) ĐỂ CHỐNG LỖI 400
  const safeCustomers = customers || {};
  const safeProducts = products || [];
  const safeHistory = history || [];
  const safeExpenses = expenses || [];
  const safeSuppliers = suppliers || [];
  const safeCart = cart || [];
  const safeHeldOrders = heldOrders || [];
  const safeAuditLogs = auditLogs || [];
  const safeLocalPOs = localPOs || [];
  const safePoItems = poItems || [];
  const safeReceiveItems = receiveItems || [];
  const safeAllPOs = allPOs || [];

  const addTransactionAndSync = async (logData: any) => {
    setHistory(prev => [logData, ...(prev || [])]);
    if (navigator.onLine) {
      try { await supabase.from("history").insert([logData]); } catch (err) { console.error(err); }
    }
  };

  // =====================================================================
  // 2. EFFECTS
  // =====================================================================
  useEffect(() => { 
    if (darkMode) { 
      document.documentElement.setAttribute('data-theme', 'dark'); 
      localStorage.setItem("mart_theme", "dark"); 
    } else { 
      document.documentElement.removeAttribute('data-theme'); 
      localStorage.setItem("mart_theme", "light"); 
    } 
  }, [darkMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLoggedIn || isCheckoutOpen || showPinModal || showAuditModal || showCustomerModal || showSettings || showInputForm || showInventoryModal || cashFlowModalInfo || showPOModal) return;
      if (e.key === 'F1') { e.preventDefault(); document.getElementById('search-barcode')?.focus(); }
      if (e.key === 'F2') { e.preventDefault(); if (safeCart.length > 0) confirmCheckout('TIỀN MẶT'); }
      if (e.key === 'F3') { e.preventDefault(); if (safeCart.length > 0) confirmCheckout('CHUYỂN KHOẢN'); }
      if (e.key === 'F4') { e.preventDefault(); handleHoldOrder(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoggedIn, isCheckoutOpen, showPinModal, safeCart, showAuditModal, showCustomerModal, showSettings, showInputForm, showInventoryModal, cashFlowModalInfo, showPOModal]);

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
          setScanQueue(prev => [...(prev || []), payload.new.code]); 
        }).subscribe();
        
      const script = document.createElement("script"); 
      script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"; 
      script.onload = () => { 
        if(EMAILJS_PUBLIC_KEY) { 
          (window as any).emailjs.init(EMAILJS_PUBLIC_KEY); 
        } 
      }; 
      document.head.appendChild(script);
      
      const xlsxScript = document.createElement("script"); 
      xlsxScript.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; 
      document.head.appendChild(xlsxScript);
      
      return () => { supabase.removeChannel(channel) };
    }
  }, [isLoggedIn, EMAILJS_PUBLIC_KEY]);

  useEffect(() => {
    if (scannerMode !== null) {
      let scanner: any; let lastScanTime = 0;
      const loadScanner = () => { 
        if ((window as any).Html5QrcodeScanner) { 
          scanner = new (window as any).Html5QrcodeScanner("qr-reader", { fps: 15, qrbox: { width: 250, height: 120 }, rememberLastUsedCamera: true }, false); 
          scanner.render((text: string) => { 
            const now = Date.now(); 
            if (now - lastScanTime < 1500) return; 
            lastScanTime = now; 
            setScanQueue(prev => [...(prev || []), text]); 
          }, undefined) 
        } 
      };
      if (!(window as any).Html5QrcodeScanner) { 
        const script = document.createElement("script"); 
        script.src = "https://unpkg.com/html5-qrcode"; 
        script.onload = loadScanner; 
        document.head.appendChild(script) 
      } else {
        loadScanner();
      }
      return () => { if (scanner) scanner.clear().catch(() => { }) }
    }
  }, [scannerMode]);

  useEffect(() => {
    if (scanQueue.length > 0) {
      const currentCode = scanQueue[0];
      if (scannerMode === 'product' || scannerMode === null) { 
        const p = findProductByCode(currentCode); 
        if (p) { 
          handleSelectSuggest(p); playSound('success'); 
        } else { 
          const matchedPhone = Object.keys(safeCustomers).find(phone => phone === currentCode.trim() || safeCustomers[phone]?.cardCode === currentCode.trim()); 
          if (matchedPhone) { 
            playSound('success'); setCustomerInput(safeCustomers[matchedPhone].cardCode || matchedPhone); setCustPhone(matchedPhone); setCustName(safeCustomers[matchedPhone].name); setScanMessage({ text: `✅ KH VIP: ${safeCustomers[matchedPhone].name}`, type: 'success' }) 
          } else { 
            playSound('error'); setScanMessage({ text: `❌ Lỗi mã`, type: 'error' }) 
          } 
        } 
      }
      else if (scannerMode === 'voucher') { 
        const code = currentCode.trim().toUpperCase(); 
        const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 }; 
        if (VOUCHERS[code]) { 
          setAppliedVoucherAmount(VOUCHERS[code]); setVoucherInput(code); playSound('success'); setScanMessage({ text: `✅ Giảm ${VOUCHERS[code].toLocaleString()}đ`, type: 'success' }) 
        } else if (!isNaN(Number(code)) && Number(code) > 0) { 
          setAppliedVoucherAmount(Number(code)); setVoucherInput(code); playSound('success'); setScanMessage({ text: `✅ Giảm ${Number(code).toLocaleString()}đ`, type: 'success' }) 
        } else { 
          playSound('error'); toast.error("Mã Voucher không hợp lệ!"); setAppliedVoucherAmount(0) 
        } 
      }
      else if (scannerMode === 'customer') { 
        const val = currentCode.trim(); setCustomerInput(val); 
        const matchedPhone = Object.keys(safeCustomers).find(phone => phone === val || safeCustomers[phone]?.cardCode === val); 
        if (matchedPhone) { 
          setCustPhone(matchedPhone); setCustName(safeCustomers[matchedPhone].name); playSound('success'); setScanMessage({ text: `✅ Nhận diện VIP: ${safeCustomers[matchedPhone].name}`, type: 'success' }) 
        } else { 
          setCustPhone(val); setCustName(""); playSound('success'); setScanMessage({ text: `✅ Đã quét mã (Khách mới)`, type: 'success' }) 
        } 
      }
      setTimeout(() => setScannerMode(null), 1000); 
      setTimeout(() => setScanMessage(null), 1500); 
      setScanQueue(prev => (prev || []).slice(1));
    }
  }, [scanQueue, safeProducts, scannerMode]);

  useEffect(() => { 
    const handleAfterPrint = () => setPrintMode(null); 
    window.addEventListener("afterprint", handleAfterPrint); 
    return () => window.removeEventListener("afterprint", handleAfterPrint) 
  }, []);

  // Effect load danh sách PO
  useEffect(() => {
    if (showPOModal && poTab === 'RECEIVE') {
      const fetchPOs = async () => {
        setLoading(true);
        try {
          if (navigator.onLine) {
            const { data } = await supabase.from('purchase_orders_v2').select('*').order('created_at', { ascending: false }).limit(50);
            if (data) {
               const merged = [...safeLocalPOs];
               data.forEach(d => { if (!merged.find(m => m.id === d.id)) merged.push(d); });
               merged.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
               setAllPOs(merged);
            } else { setAllPOs(safeLocalPOs); }
          } else { setAllPOs(safeLocalPOs); }
        } catch(e) { setAllPOs(safeLocalPOs); }
        setLoading(false);
      };
      fetchPOs();
    }
  }, [showPOModal, poTab, localPOs]);

  // =====================================================================
  // 3. TÍNH TOÁN (MEMOS)
  // =====================================================================
  const todayStrStr = new Date().toLocaleDateString('vi-VN');
  
  const currentShiftStats = useMemo(() => { 
    const shiftLogs = safeHistory.filter(h => new Date(Math.floor(h.id)).toLocaleDateString('vi-VN') === todayStrStr && h.shift === shift); 
    let cash = startingCash; let transfer = 0; let prof = 0; let totalSales = 0; 
    shiftLogs.forEach(h => { 
      if (h.type === 'BÁN' || h.type === 'GHI NỢ') totalSales += h.total; 
      if (h.type === 'BÁN' || h.type === 'THU NỢ' || h.type === 'TRẢ HÀNG') { 
        if (h.paymentMethod === 'CHUYỂN KHOẢN' || h.paymentMethod === 'QUẸT THẺ' || h.paymentMethod === 'ZALO PAY') { transfer += h.total; } else if (h.paymentMethod === 'TIỀN MẶT' || h.paymentMethod === 'KẾT HỢP') { if(h.paymentMethod === 'KẾT HỢP' && h.split_cash) { cash += h.split_cash; transfer += (h.total - h.split_cash); } else { cash += h.total; } }
      } 
      prof += (h.profit || 0) 
    }); 
    return { rev: cash + transfer - startingCash, cash, transfer, prof, totalSales } 
  }, [safeHistory, shift, todayStrStr, startingCash]);

  const currentShiftCashFlow = useMemo(() => {
    if (!cashFlowModalInfo) return { thu: [], chi: [] };
    const shiftLogs = safeHistory.filter(h => new Date(Math.floor(h.id)).toLocaleDateString('vi-VN') === todayStrStr && h.shift === shift);
    const thu: any[] = []; const chi: any[] = [];
    shiftLogs.forEach(h => {
      if (h.paymentMethod === cashFlowModalInfo || (cashFlowModalInfo === 'CHUYỂN KHOẢN' && (h.paymentMethod === 'QUẸT THẺ' || h.paymentMethod === 'ZALO PAY')) || h.paymentMethod === 'KẾT HỢP') {
        let amount = h.total;
        if (h.paymentMethod === 'KẾT HỢP') { amount = cashFlowModalInfo === 'TIỀN MẶT' ? (h.split_cash || 0) : (h.total - (h.split_cash || 0)); }
        if (amount === 0) return;
        if (h.type === 'BÁN' || h.type === 'THU NỢ') { if (amount > 0) thu.push({ time: h.time, note: `${h.type} - ${cleanName(h.name)}`, amount: amount }); } else if (h.type === 'TRẢ HÀNG') { chi.push({ time: h.time, note: `HOÀN TIỀN - ${cleanName(h.name)}`, amount: Math.abs(amount) }); }
      }
    });
    if (cashFlowModalInfo === 'TIỀN MẶT') { if (startingCash > 0) thu.unshift({ time: "Đầu ca", note: "Tiền lẻ đầu ca", amount: startingCash }); const shiftExpenses = safeExpenses.filter(e => e.date === todayStrStr); shiftExpenses.forEach(e => chi.push({ time: "Trong ca", note: `CHI PHÍ - ${e.name}`, amount: e.amount })); }
    return { thu, chi };
  }, [safeHistory, safeExpenses, cashFlowModalInfo, shift, todayStrStr, startingCash]);

  const filteredStats = useMemo(() => { 
    const start = new Date(reportStartDate + "T00:00:00").getTime(); const end = new Date(reportEndDate + "T23:59:59").getTime();
    const filteredHistory = safeHistory.filter(h => { const logTime = new Date(Math.floor(h.id)).getTime(); return logTime >= start && logTime <= end; });
    let cash = 0; let transfer = 0; let prof = 0; let totalSales = 0; 
    filteredHistory.forEach(h => { 
      if (h.type === 'BÁN' || h.type === 'GHI NỢ') totalSales += h.total; 
      if (h.type === 'BÁN' || h.type === 'THU NỢ' || h.type === 'TRẢ HÀNG') { 
        if (h.paymentMethod === 'CHUYỂN KHOẢN' || h.paymentMethod === 'QUẸT THẺ' || h.paymentMethod === 'ZALO PAY') { transfer += h.total; } else if (h.paymentMethod === 'TIỀN MẶT' || h.paymentMethod === 'KẾT HỢP') { if(h.paymentMethod === 'KẾT HỢP' && h.split_cash) { cash += h.split_cash; transfer += (h.total - h.split_cash); } else { cash += h.total; } } 
      } 
      prof += (h.profit || 0) 
    }); 
    const filteredExp = safeExpenses.filter(e => { const parts = (e.date || "").split('/'); if(parts.length !== 3) return false; const expTime = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`).getTime(); return expTime >= start && expTime <= end; }).reduce((sum, e) => sum + e.amount, 0); 
    return { rev: cash + transfer, cash, transfer, prof, totalSales, expenses: filteredExp, netProfit: prof - filteredExp } 
  }, [safeHistory, safeExpenses, reportStartDate, reportEndDate]);

  const chartData = useMemo(() => { const data = []; for (let i = 29; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const dStr = d.toLocaleDateString('vi-VN'); const dayTotal = safeHistory.filter(h => new Date(Math.floor(h.id)).toLocaleDateString('vi-VN') === dStr && (h.type === 'BÁN' || h.type === 'GHI NỢ')).reduce((s, h) => s + h.total, 0); data.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, total: dayTotal, showLabel: (i % 3 === 0 || i === 0) }) } const maxVal = Math.max(...data.map(d => d.total), 1); return data.map(d => ({ ...d, height: `${(d.total / maxVal) * 100}%` })) }, [safeHistory]);
  
  const topSelling = useMemo(() => { 
    const sales: Record<string, number> = {}; 
    safeHistory.forEach(log => { if ((log.type === 'BÁN' || log.type === 'GHI NỢ') && log.product_id !== 'DISCOUNT') { const baseName = cleanName(log.name); sales[baseName] = (sales[baseName] || 0) + log.qty } }); 
    return Object.entries(sales).sort((a, b) => b[1] - a[1]).slice(0, 5) 
  }, [safeHistory]);
  
  const groupedHistory = useMemo(() => { 
    let filtered = safeHistory; 
    if (logTypeFilter !== "Tất cả") filtered = filtered.filter(log => log.type === logTypeFilter); 
    if (logSearchTerm.trim() !== "") { const term = String(logSearchTerm || "").toLowerCase(); filtered = filtered.filter(log => (log.name && String(log.name).toLowerCase().includes(term)) || (log.customer && String(log.customer).toLowerCase().includes(term)) || (log.id.toString().includes(term))) } 
    return filtered.reduce((groups: any, log: any) => { const date = new Date(Math.floor(log.id)).toLocaleDateString('vi-VN'); if (!groups[date]) groups[date] = []; groups[date].push({ ...log, t: new Date(Math.floor(log.id)).toLocaleTimeString('vi-VN') }); return groups }, {}) 
  }, [safeHistory, logSearchTerm, logTypeFilter]);

  const totalValue = Math.round(safeProducts.reduce((sum, p) => sum + ((Number(p.import_price) || 0) * (Number(p.stock) || 0)), 0));
  const lowStockCount = safeProducts.filter(p => p.stock > 0 && p.stock < 10).length;
  const categories = ["Tất cả", ...Array.from(new Set(safeProducts.map(p => formatCategoryStr(p.category))))];
  const cartTotalAmountDisplay = safeCart.reduce((sum, item) => sum + item.total, 0);
  const currentTier = getCustomerTier(safeCustomers[custPhone]?.totalSpent || 0);
  const tierDiscountAmount = custPhone ? Math.round(cartTotalAmountDisplay * currentTier.discountRate) : 0;
  const amountAfterTierAndVoucher = Math.max(0, cartTotalAmountDisplay - appliedVoucherAmount - tierDiscountAmount);
  const walletUsedAmount = useWallet ? Math.min(safeCustomers[custPhone]?.wallet || 0, amountAfterTierAndVoucher) : 0;
  const finalToPay = amountAfterTierAndVoucher - walletUsedAmount;

  const uniqueNames = useMemo(() => Array.from(new Set(safeProducts.map(p => cleanName(p.name)))).sort(), [safeProducts]);
  const uniqueStocks = useMemo(() => Array.from(new Set(safeProducts.map(p => p.stock))).sort((a, b) => a - b), [safeProducts]);
  const uniqueImportPrices = useMemo(() => Array.from(new Set(safeProducts.map(p => p.import_price || 0))).sort((a, b) => a - b), [safeProducts]);
  const uniqueSalePrices = useMemo(() => Array.from(new Set(safeProducts.map(p => p.sale_price))).sort((a, b) => a - b), [safeProducts]);
  const uniqueExpiries = useMemo(() => Array.from(new Set(safeProducts.map(p => p.expiry_date).filter(Boolean))).sort(), [safeProducts]);
  
  const sortedAndFilteredProducts = useMemo(() => {
    const todayTime = new Date().getTime(); const safeSearch = String(searchTerm || "").toLowerCase();
    let filtered = safeProducts.filter(p => (selectedCategory === "Tất cả" || formatCategoryStr(p.category) === selectedCategory)).filter(p => String(p.name || "").toLowerCase().includes(safeSearch) || String(p.product_code || "").toLowerCase().includes(safeSearch));
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
        return 0 
      })
    } else {
      filtered.sort((a, b) => { 
        const daysA = a.expiry_date ? (new Date(a.expiry_date).getTime() - todayTime) / 86400000 : Infinity; 
        const daysB = b.expiry_date ? (new Date(b.expiry_date).getTime() - todayTime) / 86400000 : Infinity; 
        const aIsUrgent = daysA <= 45; const bIsUrgent = daysB <= 45; 
        if (aIsUrgent && !bIsUrgent) return -1; 
        if (!aIsUrgent && bIsUrgent) return 1; 
        if (aIsUrgent && bIsUrgent) return daysA - daysB; 
        return 0 
      })
    }
    return filtered
  }, [safeProducts, searchTerm, selectedCategory, sortConfig, filters]);


  // =====================================================================
  // 4. ACTION FUNCTIONS (HÀM XỬ LÝ)
  // =====================================================================
  const executeWithAdminCheck = (action: () => void) => { 
    if (role === 'admin') { action(); } else { setPendingAction(() => action); setShowPinModal(true); } 
  };

  const fetchSettingsFromCloud = async () => {
    try {
      const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
      if (data) { 
        setBankBin(data.bank_bin); setBankAcc(data.bank_acc); setBankNameStr(data.bank_name_str); setZaloPayId(data.zalopay_id || "");
        setNewBankBin(data.bank_bin); setNewBankAcc(data.bank_acc); setNewBankNameStr(data.bank_name_str); setNewZaloPayId(data.zalopay_id || "");
        if (data.admin_pin) setAdminPin(data.admin_pin); 
        if (data.happy_hour_start) { setHappyStart(data.happy_hour_start); setNewHappyStart(data.happy_hour_start); } 
        if (data.happy_hour_end) { setHappyEnd(data.happy_hour_end); setNewHappyEnd(data.happy_hour_end); } 
      }
    } catch (err) {}
  };

  const updateSettingsToCloud = async (bin: string, acc: string, nameStr: string, zaloId: string, hStart: string, hEnd: string) => {
    if (!navigator.onLine) return toast.error("Mất mạng! Không thể lưu cài đặt lên Cloud."); setLoading(true);
    try {
      const { error } = await supabase.from("settings").update({ bank_bin: bin, bank_acc: acc, bank_name_str: nameStr, zalopay_id: zaloId, happy_hour_start: hStart, happy_hour_end: hEnd, updated_at: new Date().toISOString() }).eq("id", 1);
      if (!error) { setBankBin(bin); setBankAcc(acc); setBankNameStr(nameStr); setZaloPayId(zaloId); setHappyStart(hStart); setHappyEnd(hEnd); toast.success("Lưu thành công!"); setShowSettings(false); }
    } catch (err) {} finally { setLoading(false); }
  };

  const saveSettings = () => { 
    const bin = newBankBin.trim(); const acc = newBankAcc.trim(); const nameStr = newBankNameStr.trim().toUpperCase(); const zaloId = newZaloPayId.trim(); 
    if (!bin || !acc || !nameStr) return toast.error("Vui lòng điền đủ thông tin Ngân hàng!"); 
    updateSettingsToCloud(bin, acc, nameStr, zaloId, newHappyStart, newHappyEnd); 
  };
  
  const logAudit = async (action: string, detail: string, extraData: any = null) => { 
    const newLog = { 
      id: Date.now(), time: new Date().toLocaleString('vi-VN'), 
      user_name: role === 'admin' ? 'Quản lý' : 'Thu ngân', 
      shift, action, detail, extra_data: extraData ? JSON.stringify(extraData) : null 
    }; 
    setAuditLogs(prev => [newLog, ...(prev || [])].slice(0, 300)); 
  };
  
  const fetchProducts = async () => { 
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false }); 
    if (data) setProducts(data); else setProducts([]); 
  };
  
  const findProductByCode = (code: string) => { 
    const rawCode = code.trim(); 
    let matches = safeProducts.filter(prod => prod.product_code === rawCode || String(prod.product_code).startsWith(`${rawCode}-`)); 
    let available = matches.filter(p => p.stock > 0); 
    if (available.length > 0) { 
      available.sort((a, b) => { 
        if (!a.expiry_date) return 1; if (!b.expiry_date) return -1; 
        return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime() 
      }); 
      return available[0] 
    } 
    return matches.length > 0 ? matches[0] : null 
  };

  const handleLogin = async (e: React.FormEvent) => { 
    e.preventDefault(); let u = authUsername.trim().toLowerCase(); const p = authPassword.trim(); if (!u.includes('@')) { u = u + '@hailemart.com'; } localStorage.setItem("mart_starting_cash", startingCash.toString()); setLoading(true); 
    const { error } = await supabase.auth.signInWithPassword({ email: u, password: p }); 
    if (error) { toast.error(`Đăng nhập thất bại.`); setLoading(false); return; } 
    const userRole = u.includes('admin') ? 'admin' : 'staff'; setIsLoggedIn(true); setRole(userRole); localStorage.setItem("mart_shift", shift); localStorage.setItem("mart_logged_in", "true"); localStorage.setItem("mart_role", userRole); setLoading(false); 
  };

  const handleLogoutClick = () => setShowHandoverModal(true);
  
  const confirmHandover = async () => { 
    try { if (navigator.onLine) { await supabase.auth.signOut(); } } catch (error) {} 
    finally { localStorage.removeItem("mart_logged_in"); localStorage.removeItem("mart_role"); setIsLoggedIn(false); window.location.reload(); } 
  };

  const handleEditPhone = async (oldPhone: string) => { 
    executeWithAdminCheck(() => { 
      const newPhone = window.prompt("Nhập SĐT mới:", oldPhone); 
      if (newPhone && newPhone.trim() !== "" && newPhone !== oldPhone) { 
        if (safeCustomers[newPhone]) return toast.error("SĐT đã tồn tại!"); 
        const cData = safeCustomers[oldPhone]; 
        setCustomers((prev: any) => { const updated = { ...(prev || {}) }; updated[newPhone] = { ...cData, phone: newPhone }; delete updated[oldPhone]; return updated }); 
        toast.success("Cập nhật thành công!"); 
      } 
    }); 
  };
  
  const addSupplier = async () => { 
    if (!supName || !supPhone) return toast.error("Nhập đủ Tên/SĐT"); const newId = Date.now();
    setSuppliers(prev => [{ id: newId, name: supName, phone: supPhone, address: supAddress, item: supItem, debt: 0 }, ...(prev || [])]); 
    if (navigator.onLine) { supabase.from('suppliers').insert([{ id: newId, name: supName, phone: supPhone, address: supAddress, item: supItem, debt: 0 }]).then(); }
    setSupName(""); setSupPhone(""); setSupAddress(""); setSupItem(""); toast.success("Thêm NCC thành công!"); 
  };

  const deleteSupplier = async (id: any) => { setSuppliers(prev => (prev || []).filter(s => s.id !== id)); if (navigator.onLine) await supabase.from('suppliers').delete().eq('id', id); };
  
  const addExpense = async () => { 
    if (!expName || !expAmount) return toast.error("Nhập chi phí!"); 
    setExpenses(prev => [{ id: Date.now(), date: new Date().toLocaleDateString('vi-VN'), name: expName, amount: Number(expAmount) }, ...(prev || [])]); 
    setExpName(""); setExpAmount(""); toast.success("Đã ghi nhận chi phí!"); 
  };
  
  const deleteExpense = async (id: any) => { setExpenses(prev => (prev || []).filter(e => e.id !== id)); if (navigator.onLine) await supabase.from('expenses').delete().eq('id', id); };

  const closeCheckout = () => { resetCheckout() };

  const handleHoldOrder = async () => { 
    if (safeCart.length === 0) return; 
    const newO = { id: Date.now(), time: new Date().toLocaleTimeString('vi-VN'), cart: [...safeCart] }; 
    setHeldOrders(prev => [...(prev || []), newO]); logAudit("LƯU TẠM", `Lưu giỏ ${safeCart.length} món`); resetCheckout(); toast.success("Đã lưu tạm đơn hàng!"); 
  };
  
  const restoreOrder = async (order: any) => { 
    if (safeCart.length > 0) return toast.error("Vui lòng thanh toán giỏ hiện tại trước!"); 
    setCart(order.cart); setHeldOrders(prev => (prev || []).filter(o => o.id !== order.id)); 
    if (navigator.onLine) await supabase.from('held_orders').delete().eq('id', order.id); 
    setShowHoldModal(false); toast.success("Đã mở lại đơn tạm!"); 
  };
  
  const deleteHeldOrder = async (id: any) => { 
    setHeldOrders(prev => (prev || []).filter(o => o.id !== id)); 
    logAudit("XÓA ĐƠN", `Xóa đơn lưu tạm`); 
    if (navigator.onLine) await supabase.from('held_orders').delete().eq('id', id); 
    toast.success("Đã xóa đơn tạm!"); 
  };

  const handleVoucherSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); const code = voucherInput.trim().toUpperCase(); const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 };
      if (VOUCHERS[code]) { setAppliedVoucherAmount(VOUCHERS[code]); playSound('success'); toast.success(`Đã áp dụng mã giảm ${VOUCHERS[code].toLocaleString()}đ`); } else if (!isNaN(Number(code)) && Number(code) > 0) { setAppliedVoucherAmount(Number(code)); playSound('success'); toast.success(`Đã giảm trực tiếp ${Number(code).toLocaleString()}đ`); } else { playSound('error'); toast.error("Mã Voucher không hợp lệ!"); setAppliedVoucherAmount(0); }
    }
  };

  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; setCustomerInput(val); const matchedPhone = Object.keys(safeCustomers).find(phone => phone === val.trim() || safeCustomers[phone]?.cardCode === val.trim());
    if (matchedPhone) { setCustPhone(matchedPhone); setCustName(safeCustomers[matchedPhone].name); setUseWallet(false); } else { setCustPhone(val); setCustName(""); setUseWallet(false); }
  };

  const handleNextToQR = () => { if (safeCart.length === 0) return toast.error("Giỏ hàng trống!"); if (custPhone && !safeCustomers[custPhone] && !custName) return toast.error("Vui lòng nhập Tên khách mới!"); setCheckoutStep(2); };

  const confirmCheckout = async (payMethod: 'TIỀN MẶT' | 'CHUYỂN KHOẢN' | 'GHI NỢ' | 'KẾT HỢP' | 'QUẸT THẺ' | 'ZALO PAY') => {
    if (safeCart.some(i => !i.qty || i.qty <= 0)) { playSound('error'); return toast.error("Lỗi số lượng sản phẩm!") }
    if (payMethod === 'GHI NỢ' && !custPhone) return toast.error("Thanh toán Ghi nợ cần SĐT Khách hàng!");
    setLoading(true); 
    try {
      let newLogs: any[] = []; const baseTotal = cartTotalAmountDisplay; const subTotal = Math.round(baseTotal / (1 + VAT_RATE)); const vatTotal = baseTotal - subTotal; const finalTotal = amountAfterTierAndVoucher - walletUsedAmount; const orderIdStr = "HD" + Date.now().toString().slice(-6);

      for (const item of safeCart) {
        if (navigator.onLine) await supabase.from("products").update({ stock: Math.max(0, item.product.stock - item.qty) }).eq("id", item.product.id);
        let splitCashAmt = 0; if(payMethod === 'KẾT HỢP') { splitCashAmt = Math.round((Number(customerGiven) / finalTotal) * Math.round(item.qty * getActualPrice(item.product) * (1 + VAT_RATE))); }
        const newLog = { id: Date.now() + Math.random(), shift, type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", name: cleanName(item.product.name), qty: item.qty, total: item.total, profit: Math.round(item.qty * (getActualPrice(item.product) - (item.product.import_price || 0))), customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: item.product.id, paymentMethod: payMethod, split_cash: splitCashAmt, time: new Date().toLocaleString('vi-VN') };
        newLogs.push(newLog);
      }
      
      if (custPhone) {
        const earned = payMethod === 'GHI NỢ' ? 0 : Math.round(finalTotal * 0.02);
        const updatedCust = { name: custName, wallet: payMethod === 'GHI NỢ' ? (safeCustomers[custPhone]?.wallet || 0) : Math.round((safeCustomers[custPhone]?.wallet || 0) - walletUsedAmount + earned), debt: (safeCustomers[custPhone]?.debt || 0) + (payMethod === 'GHI NỢ' ? finalTotal : 0), totalSpent: (safeCustomers[custPhone]?.totalSpent || 0) + (payMethod !== 'GHI NỢ' ? finalTotal : 0), email: safeCustomers[custPhone]?.email || "", address: safeCustomers[custPhone]?.address || "", cardCode: safeCustomers[custPhone]?.cardCode || "" }; 
        setCustomers(prev => ({ ...(prev || {}), [custPhone]: updatedCust })); 
        if (navigator.onLine) { await supabase.from("customers").upsert({ phone: custPhone, ...updatedCust }); }
      }

      setHistory(prev => [...newLogs, ...(prev || [])]);
      if (navigator.onLine) { try { await supabase.from("history").insert(newLogs); } catch(err) { console.log(err); } }
      setLastOrder({ orderId: orderIdStr, shift, cart: [...safeCart], subTotal, vatTotal, finalTotal, debtAmount: payMethod === 'GHI NỢ' ? finalTotal : 0, discount: appliedVoucherAmount + tierDiscountAmount, time: new Date().toLocaleString('vi-VN'), paymentMethod: payMethod, customerGiven: Number(customerGiven) || 0, custPhone, custName });
      setCheckoutStep(3); fetchProducts(); 
    } catch (err) { toast.error("Lỗi thanh toán: " + err.message); } finally { setLoading(false); }
  };

  const handleRefund = async (logId: any) => { executeWithAdminCheck(() => { const log = safeHistory.find(l => l.id === logId); if (!log || log.type !== 'BÁN') return; const lg = { id: Date.now(), shift, type: "TRẢ HÀNG", name: "HOÀN đơn: " + log.name, qty: log.qty, total: -log.total, profit: -(log.profit || 0), customer: log.customer, paymentMethod: "TIỀN MẶT", time: new Date().toLocaleString('vi-VN') }; addTransactionAndSync(lg); toast.success("Hoàn đơn thành công!"); }); };
  
  const handlePayDebt = async (phone: string) => { 
    const currentDebt = safeCustomers[phone]?.debt || 0; 
    if (currentDebt <= 0) return toast.error("Khách không có nợ!"); 
    setCustomers(prev => ({ ...(prev || {}), [phone]: { ...(prev || {})[phone], debt: 0 } })); 
    if(navigator.onLine) await supabase.from("customers").update({ debt: 0 }).eq("phone", phone); 
    const lg = { id: Date.now(), shift, type: "THU NỢ", name: "Thanh toán nợ", qty: 1, total: currentDebt, profit: 0, customer: `${safeCustomers[phone].name} (${phone})`, paymentMethod: 'TIỀN MẶT', time: new Date().toLocaleString('vi-VN') }; 
    addTransactionAndSync(lg); 
    toast.success("Đã xóa nợ!"); 
  };

  const handleReprint = (timeStr: string) => {
    const logsInBill = safeHistory.filter(h => h.time === timeStr && h.type === 'BÁN' && h.product_id !== 'DISCOUNT'); const discountLog = safeHistory.find(h => h.time === timeStr && h.product_id === 'DISCOUNT');
    if(logsInBill.length === 0) return toast.error("Không tìm thấy dữ liệu hóa đơn!");
    const reconstructedCart = logsInBill.map(l => ({ qty: l.qty, product: { name: l.name, gift_info: null, isHappyHour: String(l.name).includes('[Giờ Vàng]') }, priceIncludingVat: l.total / l.qty }));
    const subTotal = reconstructedCart.reduce((s, i) => s + (i.qty * (i.priceIncludingVat / (1 + VAT_RATE))), 0); const vatTotal = Math.round(subTotal * VAT_RATE); const discount = discountLog ? Math.abs(discountLog.total) : 0; const finalTotal = subTotal + vatTotal - discount;
    let cPhone = ""; let cName = logsInBill[0].customer;
    if (cName !== "Khách lẻ") { const match = cName.match(/\((.*?)\)/); if (match && match[1]) { cPhone = match[1]; cName = cName.replace(` (${cPhone})`, ""); } else { cPhone = cName; } }
    const rOrder = { orderId: "HD_COPY", shift: logsInBill[0].shift, cart: reconstructedCart, subTotal, vatTotal, finalTotal, debtAmount: 0, discount, time: timeStr, paymentMethod: logsInBill[0].paymentMethod, customerGiven: 0, custName: cName, custPhone: cPhone };
    setLastOrder(rOrder); setPrintMode('receipt'); setTimeout(() => window.print(), 500);
  };

  const handleBarcodeSubmitAction = (e: React.KeyboardEvent<HTMLInputElement>) => { 
    document.getElementById('search-barcode')?.focus(); 
    if (e.key === 'Enter') { 
      e.preventDefault(); 
      const p = findProductByCode(barcodeInput); 
      if (p) { 
        handleSelectSuggest(p); 
      } else { 
        const matchedPhone = Object.keys(safeCustomers).find(phone => phone === barcodeInput.trim() || safeCustomers[phone]?.cardCode === barcodeInput.trim()); 
        if (matchedPhone) { playSound('success'); setCustomerInput(safeCustomers[matchedPhone]?.cardCode || matchedPhone); setCustPhone(matchedPhone); setCustName(safeCustomers[matchedPhone]?.name); setBarcodeInput(""); } 
        else { playSound('error'); toast.error("Mã không hợp lệ!"); } 
      } 
    } 
  };

  const handleSelectSuggest = (p_input: any) => {
    const baseCode = String(p_input.product_code).split('-')[0]; const totalStock = safeProducts.filter(p => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`)).reduce((s, p) => s + p.stock, 0); 
    if (totalStock <= 0) { playSound('error'); return toast.error("Sản phẩm đã hết hàng!"); }
    const currentTime = new Date(); const currentTotalMins = currentTime.getHours() * 60 + currentTime.getMinutes(); const [startH, startM] = happyStart.split(':').map(Number); const [endH, endM] = happyEnd.split(':').map(Number); const startTotalMins = startH * 60 + startM; const endTotalMins = endH * 60 + endM; let isHappyNow = false; if (startTotalMins <= endTotalMins) { isHappyNow = currentTotalMins >= startTotalMins && currentTotalMins <= endTotalMins; } else { isHappyNow = currentTotalMins >= startTotalMins || currentTotalMins <= endTotalMins; }
    let itemToCart = { ...p_input }; if (isHappyNow && p_input.promo_price > 0 && p_input.promo_price < p_input.sale_price) { itemToCart.isHappyHour = true; }
    const price = getActualPrice(itemToCart); const repName = cleanName(itemToCart.name);
    setCart(prev => { const exist = (prev || []).find(item => cleanName(item.product.name) === repName && !!item.product.isHappyHour === !!itemToCart.isHappyHour); if (exist) { const newQty = exist.qty + 1; if (newQty > totalStock) { playSound('error'); return prev; } return prev.map(i => (cleanName(i.product.name) === repName && !!i.product.isHappyHour === !!itemToCart.isHappyHour) ? { ...i, qty: newQty, total: Math.round(newQty * price * (1 + VAT_RATE)) } : i); } else { return [...(prev || []), { product: itemToCart, qty: 1, total: Math.round(price * (1 + VAT_RATE)) }]; } });
    setScanMessage({ text: `✅ Thêm: ${repName} ${itemToCart.isHappyHour ? '⭐' : ''}`, type: 'success' }); setBarcodeInput(""); setShowSuggestions(false); setTimeout(() => setScanMessage(null), 2000);
  };
  
  const addToCart = (p_input: any) => { handleSelectSuggest(p_input); playSound('success'); };
  
  const adjustCartQty = (productId: any, delta: number) => { let exceedStock = false; setCart(prev => { const updated = (prev || []).map(item => { if (item.product.id === productId) { const baseCode = String(item.product.product_code).split('-')[0]; const totalStock = safeProducts.filter(p => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`)).reduce((s, p) => s + p.stock, 0); const newQty = item.qty + delta; if (newQty > totalStock) { exceedStock = true; return item; } const price = getActualPrice(item.product); return { ...item, qty: newQty, total: Math.round(newQty * price * (1 + VAT_RATE)) }; } return item; }); return updated.filter(item => item.qty > 0); }); if (exceedStock) playSound('error'); else if (delta > 0) playSound('success'); };
  
  const handleDirectQtyChange = (productId: any, val: string) => { setCart(prev => { if (val === '') return (prev || []).map(i => i.product.id === productId ? { ...i, qty: '' as any, total: 0 } : i); let num = parseInt(val); if (isNaN(num) || num < 0) return prev; let exceedStock = false; const updated = (prev || []).map(i => { if (i.product.id === productId) { const baseCode = String(i.product.product_code).split('-')[0]; const totalStock = safeProducts.filter(p => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`)).reduce((s, p) => s + p.stock, 0); if (num > totalStock) { exceedStock = true; num = totalStock; } const price = getActualPrice(i.product); return { ...i, qty: num, total: Math.round(num * price * (1 + VAT_RATE)) }; } return i; }); if (exceedStock) playSound('error'); return updated; }); };
  
  const handleDirectQtyBlur = (productId: any, val: string) => { if (val === '' || parseInt(val) <= 0 || isNaN(parseInt(val))) { setCart(prev => (prev || []).map(i => { if (i.product.id === productId) { const price = getActualPrice(i.product); return { ...i, qty: 1, total: Math.round(1 * price * (1 + VAT_RATE)) } } return i })) } };
  
  const removeFromCart = (productId: any) => { setCart(safeCart.filter(item => item.product.id !== productId)) };
  const clearCart = () => { if (window.confirm("Hủy toàn bộ?")) { resetCheckout(); } };

  // ===============================================
  // 🔥 RENDER GIAO DIỆN CHÍNH
  // ===============================================
  const renderPrintArea = () => (
    <>
      {/* 1. MẪU IN HÓA ĐƠN NHIỆT (RECEIPT) */}
      {lastOrder && printMode === 'receipt' && (
        <div className="print-only">
          <div className="print-receipt-container">
            <div style={{ textAlign: "center", marginBottom: "8px" }}><h2 style={{ margin: 0, fontSize: "20px", fontWeight: 900 }}>HẢI LÊ MART</h2><div style={{ fontSize: "11px" }}>Tòa Nhà ATS, 252 Hoàng Quốc Việt, HN</div></div>
            <div style={{ borderBottom: "1px dashed #000", marginBottom: "8px" }}></div>
            <table style={{ width: "100%", fontSize: "11px", marginBottom: "4px", borderCollapse: "collapse" }}><tbody><tr><td style={{ textAlign: "left" }}><b>HĐ:</b> {lastOrder.orderId}</td><td style={{ textAlign: "right" }}><b>Ca:</b> {shift}</td></tr><tr><td style={{ textAlign: "left" }}><b>Ngày:</b> {lastOrder.time}</td><td style={{ textAlign: "right" }}><b>TN:</b> {role}</td></tr></tbody></table>
            <div style={{ borderBottom: "1px dashed #000", marginBottom: "6px" }}></div>
            <div style={{ fontSize: "11px", marginBottom: "8px", lineHeight: "1.5" }}>
              {lastOrder.custPhone ? (
                <><div><b>Khách hàng:</b> {lastOrder.custName || 'Khách VIP'}</div><div><b>SĐT:</b> {lastOrder.custPhone}</div>{safeCustomers[lastOrder.custPhone]?.email && <div><b>Email:</b> {safeCustomers[lastOrder.custPhone].email}</div>}{safeCustomers[lastOrder.custPhone]?.address && <div><b>Địa chỉ:</b> {safeCustomers[lastOrder.custPhone].address}</div>}</>
              ) : (<div><b>Khách hàng:</b> Khách lẻ</div>)}
            </div>
            <div style={{ borderBottom: "1px dashed #000", marginBottom: "8px" }}></div>
            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
              <tbody>
                {(lastOrder.cart || []).map((i: any, x: number) => {
                  const p = i.priceIncludingVat !== undefined ? Math.round(i.priceIncludingVat / (1 + VAT_RATE)) : Math.round(getActualPrice(i.product)); const t = i.priceIncludingVat !== undefined ? Math.round(i.priceIncludingVat * i.qty) : Math.round((Number(i.qty) || 0) * p * (1 + VAT_RATE)); const g = parseGift(i.product.gift_info); const gQty = g.cond > 0 ? Math.floor(i.qty / g.cond) : 0;
                  return (<React.Fragment key={x}><tr><td colSpan={2}><b>{cleanName(i.product.name)} {i.product.isHappyHour && <span style={{ fontSize: "9px" }}>[Giờ Vàng]</span>}</b></td></tr><tr><td style={{ paddingBottom: "4px" }}>{i.qty} x {p.toLocaleString()}</td><td style={{ textAlign: "right", paddingBottom: "4px" }}>{t.toLocaleString()}</td></tr>{g.text && gQty > 0 && <tr><td colSpan={2} style={{ fontSize: "10px", fontStyle: "italic", paddingBottom: "4px" }}>+ 🎁 Tặng: {gQty} x {g.text}</td></tr>}</React.Fragment>)
                })}
              </tbody>
            </table>
            <div style={{ borderBottom: "1px dashed #000", marginBottom: "8px", marginTop: "4px" }}></div>
            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}><tbody><tr><td style={{ padding: "2px 0" }}>Tiền hàng:</td><td style={{ textAlign: "right", padding: "2px 0" }}>{Math.round(lastOrder.subTotal).toLocaleString()}đ</td></tr><tr><td style={{ padding: "2px 0" }}>VAT (10%):</td><td style={{ textAlign: "right", padding: "2px 0" }}>{Math.round(lastOrder.vatTotal).toLocaleString()}đ</td></tr>{lastOrder.discount > 0 && <tr><td style={{ padding: "2px 0" }}>Giảm giá/Ví:</td><td style={{ textAlign: "right", padding: "2px 0" }}>-{Math.round(lastOrder.discount).toLocaleString()}đ</td></tr>}</tbody></table>
            <div style={{ borderBottom: "2px dashed #000", margin: "6px 0" }}></div>
            <table style={{ width: "100%", fontSize: "16px", fontWeight: 900, borderCollapse: "collapse" }}><tbody><tr><td>{lastOrder.debtAmount > 0 ? "NỢ:" : "TỔNG ĐƠN:"}</td><td style={{ textAlign: "right" }}>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</td></tr></tbody></table>
            <div style={{ borderTop: "1px dotted #000", paddingTop: "6px", marginTop: "6px", fontSize: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Phương thức TT:</span><b>{lastOrder.paymentMethod}</b></div>
              {lastOrder.paymentMethod === 'TIỀN MẶT' && (<><div style={{ display: "flex", justifyContent: "space-between" }}><span>Khách đưa:</span><span>{Math.round(lastOrder.customerGiven || lastOrder.finalTotal).toLocaleString()}đ</span></div><div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}><span>Thối lại:</span><span>{Math.round(Math.max(0, (lastOrder.customerGiven || lastOrder.finalTotal) - lastOrder.finalTotal)).toLocaleString()}đ</span></div></>)}
              {lastOrder.paymentMethod === 'KẾT HỢP' && (<><div style={{ display: "flex", justifyContent: "space-between" }}><span>Tiền mặt:</span><span>{Math.round(lastOrder.customerGiven || 0).toLocaleString()}đ</span></div><div style={{ display: "flex", justifyContent: "space-between" }}><span>Chuyển khoản:</span><span>{Math.round(lastOrder.finalTotal - (lastOrder.customerGiven || 0)).toLocaleString()}đ</span></div></>)}
            </div>
            <div style={{ textAlign: "center", marginTop: "15px", fontSize: "11px" }}><b>CẢM ƠN QUÝ KHÁCH!</b></div>
          </div>
        </div>
      )}

      {/* 2. MẪU IN HÓA ĐƠN KHỔ A4 */}
      {printMode === 'invoice_a4' && lastOrder && (
        <div className="print-flex print-a4-container">
          <div style={{ width: "100%", fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #000", paddingBottom: "10px", marginBottom: "20px" }}><div><h1 style={{ margin: 0, color: "#dc2626", fontSize: "28px" }}>HẢI LÊ MART</h1><p style={{ margin: "5px 0", fontSize: "14px" }}>Địa chỉ: Tòa Nhà ATS, 252 Hoàng Quốc Việt, Cầu Giấy, HN</p></div><div style={{ textAlign: "right" }}><h2 style={{ margin: 0, fontSize: "24px" }}>HÓA ĐƠN BÁN HÀNG</h2><p style={{ margin: "5px 0", fontSize: "14px" }}>Số: <b>{lastOrder.orderId}</b></p><p style={{ margin: "5px 0", fontSize: "14px" }}>Ngày: {lastOrder.time}</p></div></div>
            <div style={{ marginBottom: "20px", fontSize: "15px", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <div><p style={{ margin: "5px 0" }}><b>Khách hàng:</b> {lastOrder.custName || "Khách lẻ"}</p>{lastOrder.custPhone && <p style={{ margin: "5px 0" }}><b>SĐT:</b> {lastOrder.custPhone}</p>}{lastOrder.custPhone && safeCustomers[lastOrder.custPhone]?.email && <p style={{ margin: "5px 0" }}><b>Email:</b> {safeCustomers[lastOrder.custPhone].email}</p>}{lastOrder.custPhone && safeCustomers[lastOrder.custPhone]?.address && <p style={{ margin: "5px 0" }}><b>Địa chỉ:</b> {safeCustomers[lastOrder.custPhone].address}</p>}</div>
              <div style={{ textAlign: "right" }}><p style={{ margin: "5px 0" }}><b>Phương thức thanh toán:</b> {lastOrder.paymentMethod}</p></div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
              <thead><tr style={{ background: "#f1f5f9" }}><th style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>STT</th><th style={{ border: "1px solid #000", padding: "10px", textAlign: "left" }}>Tên hàng hóa</th><th style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>SL</th><th style={{ border: "1px solid #000", padding: "10px", textAlign: "right" }}>Đơn giá</th><th style={{ border: "1px solid #000", padding: "10px", textAlign: "right" }}>Thành tiền</th></tr></thead>
              <tbody>{(lastOrder.cart || []).map((item: any, index: number) => { const p = Math.round(getActualPrice(item.product)); const t = Math.round(item.qty * p * (1 + VAT_RATE)); return (<tr key={index}><td style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>{index + 1}</td><td style={{ border: "1px solid #000", padding: "10px" }}>{cleanName(item.product.name)}</td><td style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>{item.qty}</td><td style={{ border: "1px solid #000", padding: "10px", textAlign: "right" }}>{p.toLocaleString()}đ</td><td style={{ border: "1px solid #000", padding: "10px", textAlign: "right" }}>{t.toLocaleString()}đ</td></tr>); })}</tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px", fontSize: "15px" }}>
              <div style={{ textAlign: "center", width: "40%" }}><b>Khách hàng</b><br/><span style={{ fontSize: "12px", color: "#666" }}>(Ký, ghi rõ họ tên)</span></div>
              <div style={{ textAlign: "right", width: "50%" }}><p style={{ margin: "5px 0" }}>Cộng tiền hàng: {Math.round(lastOrder.subTotal).toLocaleString()}đ</p><p style={{ margin: "5px 0" }}>Thuế GTGT (10%): {Math.round(lastOrder.vatTotal).toLocaleString()}đ</p>{lastOrder.discount > 0 && <p style={{ margin: "5px 0" }}>Giảm giá/Ví: -{Math.round(lastOrder.discount).toLocaleString()}đ</p>}<h3 style={{ borderTop: "2px solid #000", paddingTop: "10px", margin: "10px 0" }}>TỔNG CỘNG: {Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</h3>
                {lastOrder.paymentMethod === 'TIỀN MẶT' && (<div style={{ fontSize: "14px", marginTop: "10px" }}><div style={{ display: "flex", justifyContent: "space-between" }}><span>Khách đưa:</span> <span>{Math.round(lastOrder.customerGiven || lastOrder.finalTotal).toLocaleString()}đ</span></div><div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}><span>Thối lại:</span> <span>{Math.round(Math.max(0, (lastOrder.customerGiven || lastOrder.finalTotal) - lastOrder.finalTotal)).toLocaleString()}đ</span></div></div>)}
                {lastOrder.paymentMethod === 'KẾT HỢP' && (<div style={{ fontSize: "14px", marginTop: "10px" }}><div style={{ display: "flex", justifyContent: "space-between" }}><span>Thanh toán Tiền mặt:</span> <span>{Math.round(lastOrder.customerGiven || 0).toLocaleString()}đ</span></div><div style={{ display: "flex", justifyContent: "space-between" }}><span>Thanh toán Chuyển khoản:</span> <span>{Math.round(lastOrder.finalTotal - (lastOrder.customerGiven || 0)).toLocaleString()}đ</span></div></div>)}
                <div style={{ textAlign: "center", marginTop: "40px" }}><b>Người bán hàng</b><br/><span style={{ fontSize: "12px", color: "#666" }}>(Ký, đóng dấu)</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 3. MẪU IN TEM MÃ VẠCH */}
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
      
      {/* 4. MẪU IN THẺ KHÁCH HÀNG VIP */}
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

      {/* 5. MẪU IN PHIẾU ĐẶT HÀNG (PO) KHỔ A4 CHUẨN DOANH NGHIỆP */}
      {printMode === 'po_a4' && printPOData && (
        <div className="print-flex print-a4-container">
          <div style={{ width: "100%", fontFamily: "'Inter', Arial, sans-serif", color: "#0f172a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "3px solid #1e293b", paddingBottom: "15px", marginBottom: "25px" }}>
              <div>
                <h1 style={{ margin: "0 0 5px 0", color: "#dc2626", fontSize: "32px", textTransform: "uppercase", letterSpacing: "1px" }}>HẢI LÊ MART</h1>
                <p style={{ margin: "4px 0", fontSize: "14px" }}><b>Trụ sở:</b> Tòa Nhà ATS, 252 Hoàng Quốc Việt, Cầu Giấy, Hà Nội</p>
                <p style={{ margin: "4px 0", fontSize: "14px" }}><b>Hotline:</b> 0902 613 899</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <h2 style={{ margin: "0 0 10px 0", fontSize: "26px", color: "#0f172a", textTransform: "uppercase" }}>PHIẾU ĐẶT HÀNG (PO)</h2>
                <div style={{ display: "inline-block", background: "#f8fafc", padding: "10px 15px", borderRadius: "8px", border: "1px solid #cbd5e1", textAlign: "left" }}>
                  <p style={{ margin: "4px 0", fontSize: "14px" }}><b>Số PO:</b> <span style={{ color: "#dc2626", fontWeight: "bold" }}>{printPOData.po_code}</span></p>
                  <p style={{ margin: "4px 0", fontSize: "14px" }}><b>Ngày lập:</b> {new Date(printPOData.created_at).toLocaleString('vi-VN')}</p>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "25px", fontSize: "15px", background: "#f8fafc", padding: "15px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#3b82f6", textTransform: "uppercase" }}>Thông tin Nhà cung cấp</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div><p style={{ margin: "5px 0" }}><b>Tên NCC:</b> {printPOData.supplier?.name}</p><p style={{ margin: "5px 0" }}><b>Điện thoại:</b> {printPOData.supplier?.phone}</p></div>
                <div><p style={{ margin: "5px 0" }}><b>Địa chỉ:</b> {printPOData.supplier?.address || "---"}</p><p style={{ margin: "5px 0" }}><b>Ghi chú:</b> {printPOData.note || "---"}</p></div>
              </div>
            </div>

            <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", textTransform: "uppercase" }}>Chi tiết đơn hàng</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "25px", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#1e293b", color: "white" }}>
                  <th style={{ border: "1px solid #1e293b", padding: "12px", textAlign: "center", width: "5%" }}>STT</th>
                  <th style={{ border: "1px solid #1e293b", padding: "12px", textAlign: "left", width: "45%" }}>Tên sản phẩm / Hàng hóa</th>
                  <th style={{ border: "1px solid #1e293b", padding: "12px", textAlign: "center", width: "15%" }}>Số lượng</th>
                  <th style={{ border: "1px solid #1e293b", padding: "12px", textAlign: "right", width: "15%" }}>Đơn giá (VND)</th>
                  <th style={{ border: "1px solid #1e293b", padding: "12px", textAlign: "right", width: "20%" }}>Thành tiền (VND)</th>
                </tr>
              </thead>
              <tbody>
                {(printPOData.items || []).map((item: any, index: number) => (
                  <tr key={index}>
                    <td style={{ border: "1px solid #cbd5e1", padding: "12px", textAlign: "center" }}>{index + 1}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "12px", fontWeight: "bold" }}>{cleanName(item.product.name)}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "12px", textAlign: "center" }}>{item.qty}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "12px", textAlign: "right" }}>{(item.importPrice).toLocaleString()}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "12px", textAlign: "right", fontWeight: "bold" }}>{(item.qty * item.importPrice).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px", fontSize: "15px" }}>
              <div style={{ textAlign: "center", width: "40%" }}>
                <b>Đại diện Nhà cung cấp</b><br/>
                <span style={{ fontSize: "13px", color: "#64748b" }}>(Ký, ghi rõ họ tên và đóng dấu)</span>
                <div style={{ height: "100px" }}></div>
              </div>
              <div style={{ textAlign: "right", width: "50%" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                  <tbody>
                    <tr><td style={{ padding: "8px", borderBottom: "1px dashed #cbd5e1" }}>Tổng tiền hàng:</td><td style={{ padding: "8px", textAlign: "right", fontWeight: "bold", borderBottom: "1px dashed #cbd5e1" }}>{Math.round(printPOData.total_amount).toLocaleString()} đ</td></tr>
                    <tr><td style={{ padding: "8px", borderBottom: "1px dashed #cbd5e1" }}>Đã thanh toán trước:</td><td style={{ padding: "8px", textAlign: "right", color: "#10b981", fontWeight: "bold", borderBottom: "1px dashed #cbd5e1" }}>- {Math.round(printPOData.paid_amount).toLocaleString()} đ</td></tr>
                    <tr><td style={{ padding: "12px 8px", fontSize: "18px", fontWeight: "900", color: "#dc2626" }}>CÒN NỢ LẠI:</td><td style={{ padding: "12px 8px", textAlign: "right", fontSize: "18px", fontWeight: "900", color: "#dc2626" }}>{Math.round(printPOData.debt_amount).toLocaleString()} đ</td></tr>
                  </tbody>
                </table>
                <div style={{ textAlign: "center", marginTop: "20px" }}>
                  <b>Người lập phiếu</b><br/>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>(Ký, đóng dấu)</span>
                  <div style={{ height: "100px" }}></div>
                </div>
              </div>
            </div>
            
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "15px", marginTop: "20px", textAlign: "center", fontSize: "12px", color: "#64748b" }}>
              Chứng từ này được trích xuất tự động từ Hệ thống Quản lý Hải Lê ERP.
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderModals = () => {
    return (
      <>
        {showExpenseModal && <ExpenseModal showExpenseModal={showExpenseModal} setShowExpenseModal={setShowExpenseModal} expName={expName} setExpName={setExpName} expAmount={expAmount} setExpAmount={setExpAmount} expenses={safeExpenses} addExpense={addExpense} deleteExpense={deleteExpense} />}
        
        {/* MODAL SUPPLIER XỊN XÒ */}
        {showSupplierModal && (
          <div className="custom-modal-overlay">
            <div className="custom-modal-box" style={{ maxWidth: '900px', height: '80vh' }}>
              <div className="custom-modal-header">
                <h2 className="custom-modal-title">🏢 QUẢN LÝ NHÀ CUNG CẤP</h2>
                <button className="custom-modal-close" onClick={() => setShowSupplierModal(false)}>&times;</button>
              </div>
              <div className="custom-modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', background: '#f1f5f9', height: '100%', boxSizing: 'border-box' }}>
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>Thêm Mới NCC</h3>
                  <div className="custom-input-group"><label className="custom-label">Tên Nhà Cung Cấp</label><input className="custom-input" placeholder="VD: Công ty TNHH Vinamilk" value={supName} onChange={e => setSupName(e.target.value)} /></div>
                  <div className="custom-input-group"><label className="custom-label">Số điện thoại</label><input className="custom-input" placeholder="VD: 0901234567" value={supPhone} onChange={e => setSupPhone(e.target.value)} /></div>
                  <div className="custom-input-group"><label className="custom-label">Địa chỉ</label><input className="custom-input" placeholder="Số nhà, Đường, Quận..." value={supAddress} onChange={e => setSupAddress(e.target.value)} /></div>
                  <div className="custom-input-group"><label className="custom-label">Mặt hàng cung cấp</label><input className="custom-input" placeholder="Sữa, Nước giải khát..." value={supItem} onChange={e => setSupItem(e.target.value)} /></div>
                  <button className="gradient-btn" onClick={addSupplier} style={{ marginTop: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>+ THÊM NHÀ CUNG CẤP</button>
                </div>
                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    <table className="modern-table">
                      <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}><tr><th>Tên NCC</th><th>Liên hệ</th><th>Địa chỉ</th><th>Nợ hiện tại</th><th style={{textAlign:'center'}}>Xóa</th></tr></thead>
                      <tbody>
                        {safeSuppliers.length === 0 && <tr><td colSpan={5} style={{textAlign:'center', padding:'30px', color:'#94a3b8'}}>Chưa có dữ liệu nhà cung cấp</td></tr>}
                        {safeSuppliers.map(s => (
                          <tr key={s.id}>
                            <td style={{fontWeight:'bold', color:'#0f172a'}}>{s.name}</td>
                            <td>{s.phone}</td>
                            <td style={{maxWidth:'150px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={s.address}>{s.address || '-'}</td>
                            <td style={{ color: "#ef4444", fontWeight: "bold" }}>{(s.debt || 0).toLocaleString()}đ</td>
                            <td style={{textAlign:'center'}}><button onClick={() => deleteSupplier(s.id)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: "22px" }}>&times;</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showSettings && (
          <div className="custom-modal-overlay">
            <div className="custom-modal-box" style={{ maxWidth: '600px' }}>
              <div className="custom-modal-header">
                <h2 className="custom-modal-title">⚙️ CÀI ĐẶT HỆ THỐNG</h2>
                <button className="custom-modal-close" onClick={() => setShowSettings(false)}>&times;</button>
              </div>
              <div className="custom-modal-body" style={{ background: '#f8fafc' }}>
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <h3 style={{ marginTop: 0, color: '#3b82f6', marginBottom: '16px', fontSize: '15px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px' }}>THÔNG TIN THANH TOÁN (QR CODE)</h3>
                  <div className="custom-input-group">
                    <label className="custom-label">Ngân Hàng (BIN):</label>
                    <select className="custom-input" value={newBankBin} onChange={e => setNewBankBin(e.target.value)}>
                      <option value="">-- Chọn Ngân Hàng --</option>
                      <option value="970436">Vietcombank</option>
                      <option value="970415">VietinBank</option>
                      <option value="970418">BIDV</option>
                      <option value="970405">Agribank</option>
                      <option value="970422">MBBank (Ngân hàng Quân đội)</option>
                      <option value="970407">Techcombank</option>
                      <option value="970416">ACB</option>
                      <option value="970432">VPBank</option>
                      <option value="970423">TPBank</option>
                      <option value="970403">Sacombank</option>
                      <option value="970437">HDBank</option>
                      <option value="970441">VIB</option>
                      <option value="970443">SHB</option>
                      <option value="970440">SeABank</option>
                      <option value="970426">MSB</option>
                      <option value="970448">OCB</option>
                      <option value="970431">Eximbank</option>
                      <option value="970429">SCB</option>
                      <option value="970449">LPBank (LienVietPostBank)</option>
                      <option value="970439">PVcomBank</option>
                      <option value="970409">Bac A Bank</option>
                      <option value="970419">NCB</option>
                      <option value="970438">BaoViet Bank</option>
                      <option value="970427">Viet A Bank</option>
                      <option value="970452">Kienlongbank</option>
                      <option value="970400">Saigonbank</option>
                      <option value="970428">Nam A Bank</option>
                      <option value="970406">DongA Bank</option>
                      <option value="970433">Vietbank</option>
                      <option value="970425">ABBank</option>
                    </select>
                  </div>
                  <div className="custom-input-group"><label className="custom-label">Số Tài Khoản:</label><input className="custom-input" placeholder="Nhập số tài khoản..." value={newBankAcc} onChange={e => setNewBankAcc(e.target.value)} /></div>
                  <div className="custom-input-group"><label className="custom-label">Tên Chủ Tài Khoản:</label><input className="custom-input" placeholder="VD: NGUYEN VAN A" value={newBankNameStr} onChange={e => setNewBankNameStr(e.target.value)} /></div>
                  <div className="custom-input-group" style={{ marginBottom: 0 }}><label className="custom-label">SĐT ZaloPay (Đăng ký ví):</label><input className="custom-input" placeholder="VD: 0901234567" value={newZaloPayId} onChange={e => setNewZaloPayId(e.target.value)} /></div>
                </div>
                
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ marginTop: 0, color: '#f59e0b', marginBottom: '16px', fontSize: '15px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px' }}>CẤU HÌNH GIỜ VÀNG (HAPPY HOUR)</h3>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <div style={{ flex: 1 }} className="custom-input-group"><label className="custom-label">Giờ Bắt đầu:</label><input type="time" className="custom-input" value={newHappyStart} onChange={e => setNewHappyStart(e.target.value)} /></div>
                    <div style={{ flex: 1 }} className="custom-input-group"><label className="custom-label">Giờ Kết thúc:</label><input type="time" className="custom-input" value={newHappyEnd} onChange={e => setNewHappyEnd(e.target.value)} /></div>
                  </div>
                </div>
                <button className="gradient-btn" onClick={saveSettings} style={{ marginTop: "20px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)" }}>💾 LƯU CẤU HÌNH HỆ THỐNG</button>
              </div>
            </div>
          </div>
        )}

        {showCustomerModal && (
          <div className="custom-modal-overlay">
            <div className="custom-modal-box" style={{ maxWidth: '900px', height: '80vh' }}>
              <div className="custom-modal-header"><h2 className="custom-modal-title">💎 QUẢN LÝ KHÁCH HÀNG VIP</h2><button className="custom-modal-close" onClick={() => setShowCustomerModal(false)}>&times;</button></div>
              <div className="custom-modal-body" style={{ background: '#f8fafc', padding: 0 }}>
                <table className="modern-table">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}><tr><th>Tên KH</th><th>SĐT</th><th>Ví / Nợ</th><th style={{textAlign:"center"}}>Hành động</th></tr></thead>
                  <tbody>
                    {Object.keys(safeCustomers).length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>Chưa có Khách hàng VIP</td></tr>}
                    {Object.entries(safeCustomers).map(([phone, c]) => (
                      <tr key={phone}>
                        <td style={{fontWeight:'bold', color:'#0f172a'}}>{c?.name || 'Khách Vô Danh'} <br/><span style={{fontSize:'12px', color:'#64748b'}}>{getCustomerTier(c?.totalSpent || 0).name}</span></td>
                        <td>{phone}</td>
                        <td><span style={{color: '#10b981', fontWeight: "bold"}}>Ví: {(c?.wallet||0).toLocaleString()}đ</span><br/><span style={{color: '#ef4444', fontWeight: "bold"}}>Nợ: {(c?.debt||0).toLocaleString()}đ</span></td>
                        <td style={{display:'flex', gap:'6px', justifyContent:'center'}}>
                           <button onClick={()=>handleEditPhone(phone)} style={{padding:'8px 12px', background:'#3b82f6', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight: "bold", fontSize: "12px", boxShadow: "0 2px 4px rgba(59,130,246,0.3)"}}>Sửa SĐT</button>
                           <button onClick={()=>printCustomerCard(phone)} style={{padding:'8px 12px', background:'#10b981', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight: "bold", fontSize: "12px", boxShadow: "0 2px 4px rgba(16,185,129,0.3)"}}>In Thẻ</button>
                           <button onClick={()=>sendCardEmail(phone)} style={{padding:'8px 12px', background:'#f59e0b', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight: "bold", fontSize: "12px", boxShadow: "0 2px 4px rgba(245,158,11,0.3)"}}>Email VIP</button>
                           <button onClick={()=>shareToZalo(phone)} style={{padding:'8px 12px', background:'#06b6d4', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight: "bold", fontSize: "12px", boxShadow: "0 2px 4px rgba(6,182,212,0.3)"}}>Mở Zalo</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {showMarketingModal && (
          <div className="custom-modal-overlay">
            <div className="custom-modal-box" style={{ maxWidth: '550px' }}>
              <div className="custom-modal-header"><h2 className="custom-modal-title">💌 GỬI EMAIL MARKETING</h2><button className="custom-modal-close" onClick={() => setShowMarketingModal(false)}>&times;</button></div>
              <div className="custom-modal-body" style={{ background: '#f8fafc' }}>
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div className="custom-input-group">
                    <label className="custom-label">Gửi đến nhóm khách hạng:</label>
                    <select className="custom-input" value={marketingTier} onChange={e => setMarketingTier(e.target.value)}>
                      <option value="Tất cả">Tất cả Khách hàng VIP</option><option value="ĐỒNG">Hạng ĐỒNG</option><option value="BẠC">Hạng BẠC</option><option value="VÀNG">Hạng VÀNG</option><option value="KIM CƯƠNG">Hạng KIM CƯƠNG</option>
                    </select>
                  </div>
                  <div className="custom-input-group">
                    <label className="custom-label">Nội dung Ưu đãi / Khuyến mãi:</label>
                    <textarea className="custom-input" rows={6} placeholder="Ví dụ: Giảm giá 20% cho thành viên hạng Vàng nhân dịp Lễ..." value={marketingMsg} onChange={e => setMarketingMsg(e.target.value)} style={{ resize: "vertical" }}></textarea>
                  </div>
                  <button className="gradient-btn" onClick={async () => {
                    if (!marketingMsg) return toast.error("Vui lòng nhập nội dung!"); if (!window.confirm("Giới hạn 200 mail/tháng. Gửi?")) return;
                    setLoading(true); 
                    const targetCustomers = Object.keys(safeCustomers).filter(phone => { 
                      const c = safeCustomers[phone]; 
                      if (!c || !c.email) return false; 
                      if (marketingTier === "Tất cả") return true; 
                      return getCustomerTier(c.totalSpent || 0).name.includes(marketingTier);
                    });
                    if (targetCustomers.length === 0) { setLoading(false); return toast.error("Không có khách hàng nào phù hợp!"); }
                    
                    let successCount = 0;
                    for (const phone of targetCustomers) { 
                      const c = safeCustomers[phone]; 
                      const htmlContent = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; text-align: center;">
                            <h1 style="margin: 0; font-size: 24px;">HẢI LÊ MART</h1>
                            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">THÔNG BÁO ƯU ĐÃI ĐẶC QUYỀN</p>
                          </div>
                          <div style="padding: 30px 20px; background: #ffffff;">
                            <h2 style="margin: 0 0 15px 0; color: #0f172a; font-size: 20px;">Chào ${c.name},</h2>
                            <div style="color: #475569; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${marketingMsg}</div>
                          </div>
                          <div style="background: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; font-size: 12px; color: #94a3b8;">Hải Lê Mart © 2026 - Hotline: 0902 613 899</p>
                          </div>
                        </div>`;
                      try { 
                        await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_VIP_ID, { to_email: c.email, subject: "💌 Ưu Đãi Đặc Quyền Từ Hải Lê Mart", html_message: htmlContent, order_id: "", time: "", items_list: "", total_amount: "", payment_method: "", change_amount: "", barcode_url: "" }); 
                        successCount++; 
                      } catch (error: any) { console.error("EmailJS Error", error); } 
                    }
                    logAudit("GỬI MAIL MKT", `Gửi ${successCount} mail cho tập ${marketingTier}`); setLoading(false); setShowMarketingModal(false); toast.success(`Đã gửi ${successCount} mail!`)
                  }} disabled={loading}>{loading ? "ĐANG GỬI CHIẾN DỊCH..." : "🚀 BẮT ĐẦU GỬI EMAIL"}</button>
                  <p style={{ fontSize: "12px", color: "#64748b", textAlign: "center", marginTop: "15px" }}>* Gửi tự động đến hộp thư của Khách hàng qua EmailJS.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPOModal && (
          <div className="custom-modal-overlay">
            <div className="custom-modal-box" style={{ maxWidth: '1200px', height: '90vh' }}>
              <div className="custom-modal-header">
                <h2 className="custom-modal-title">📦 QUẢN LÝ PHIẾU NHẬP (PO)</h2>
                <button className="custom-modal-close" onClick={() => setShowPOModal(false)}>&times;</button>
              </div>
              <div style={{ display: "flex", gap: "10px", padding: "15px 24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                <button onClick={() => setPoTab('NEW')} className={`tab-btn ${poTab === 'NEW' ? 'active' : ''}`} style={{ padding: "10px 20px", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer", background: poTab === 'NEW' ? "#3b82f6" : "#e2e8f0", color: poTab === 'NEW' ? "white" : "#64748b" }}>+ TẠO PO MỚI (CHỜ NHẬN)</button>
                <button onClick={() => setPoTab('RECEIVE')} className={`tab-btn ${poTab === 'RECEIVE' ? 'active' : ''}`} style={{ padding: "10px 20px", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer", background: poTab === 'RECEIVE' ? "#3b82f6" : "#e2e8f0", color: poTab === 'RECEIVE' ? "white" : "#64748b" }}>📥 TÌM, NHẬN & IN HÀNG</button>
              </div>
              <div className="custom-modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px", background: "#f1f5f9", padding: "24px" }}>
                
                {poTab === 'NEW' && (
                  <>
                    <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", height: "fit-content" }}>
                      <h3 style={{ margin: "0 0 15px 0", fontSize: "15px", color: "#1e293b", borderBottom: "1px dashed #cbd5e1", paddingBottom: "10px" }}>1. Chọn Nhà Cung Cấp</h3>
                      <select className="custom-input" value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)} style={{ marginBottom: "24px" }}>
                        <option value="">-- Click để chọn NCC --</option>
                        {safeSuppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name} - {s.phone}</option>)}
                      </select>
                      
                      <h3 style={{ margin: "0 0 15px 0", fontSize: "15px", color: "#1e293b", borderBottom: "1px dashed #cbd5e1", paddingBottom: "10px" }}>2. Tìm Sản Phẩm</h3>
                      <input type="text" className="custom-input" placeholder="Nhập tên hoặc mã SP..." value={poSearch} onChange={e => setPoSearch(e.target.value)} />
                      <div style={{ maxHeight: "250px", overflowY: "auto", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", marginTop: "10px" }}>
                        {poSearch.trim() && safeProducts.filter(p => cleanName(p.name).toLowerCase().includes(poSearch.toLowerCase()) || String(p.product_code).toLowerCase().includes(poSearch.toLowerCase())).slice(0, 10).map(p => (
                          <div key={p.id} onClick={() => {
                            const exist = safePoItems.find(i => i.product.id === p.id);
                            if (exist) { setPoItems(safePoItems.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i)); } else { setPoItems([{ product: p, qty: 1, importPrice: p.import_price || 0 }, ...safePoItems]); }
                            setPoSearch("");
                          }} style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "0.2s" }} onMouseOver={e=>e.currentTarget.style.background="#f8fafc"} onMouseOut={e=>e.currentTarget.style.background="white"}>
                            <div style={{ fontWeight: "bold", color: "#0f172a", fontSize: "14px" }}>{cleanName(p.name)}</div>
                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Mã: {p.product_code} | Giá nhập: {(p.import_price||0).toLocaleString()}đ</div>
                          </div>
                        ))}
                      </div>
                      
                      <div style={{ marginTop: "24px" }}>
                        <label className="custom-label">Ghi chú (Tùy chọn):</label>
                        <textarea className="custom-input" placeholder="Ghi chú phiếu..." value={poNote} onChange={e => setPoNote(e.target.value)} rows={3} style={{ resize: "vertical", marginTop: "4px" }} />
                      </div>
                    </div>

                    <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", height: "fit-content", minHeight: "100%" }}>
                      <h3 style={{ margin: "0 0 15px 0", fontSize: "15px", color: "#1e293b", borderBottom: "1px dashed #cbd5e1", paddingBottom: "10px" }}>Danh sách Sản Phẩm Sẽ Đặt</h3>
                      <div style={{ flex: 1, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                        <table className="modern-table" style={{ margin: 0 }}>
                          <thead style={{position: 'sticky', top: 0, zIndex: 1}}><tr><th>Sản phẩm</th><th style={{textAlign:"center"}}>Số lượng</th><th style={{textAlign:"right"}}>Giá nhập (đ)</th><th style={{textAlign:"right"}}>Thành tiền</th><th style={{textAlign:'center'}}>Xóa</th></tr></thead>
                          <tbody>
                            {safePoItems.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>Chưa có sản phẩm nào được chọn</td></tr>}
                            {safePoItems.map((item, idx) => (
                              <tr key={idx}>
                                <td style={{fontWeight: "600", color: "#0f172a"}}>{cleanName(item.product.name)}</td>
                                <td style={{textAlign:"center"}}><input type="number" className="custom-input" style={{ padding: "6px", width: "70px", textAlign: "center" }} value={item.qty} onChange={e => { const val = parseInt(e.target.value)||1; setPoItems(safePoItems.map((i, ix) => ix === idx ? { ...i, qty: val } : i)) }} min="1" /></td>
                                <td style={{textAlign:"right"}}><input type="number" className="custom-input" style={{ padding: "6px", width: "110px", textAlign: "right" }} value={item.importPrice} onChange={e => { const val = parseInt(e.target.value)||0; setPoItems(safePoItems.map((i, ix) => ix === idx ? { ...i, importPrice: val } : i)) }} min="0" /></td>
                                <td style={{ fontWeight: "bold", textAlign: "right", color: "#3b82f6" }}>{(item.qty * item.importPrice).toLocaleString()}</td>
                                <td style={{ textAlign: "center" }}><button onClick={() => setPoItems(safePoItems.filter((_, ix) => ix !== idx))} style={{ background: "none", color: "#ef4444", border: "none", cursor: "pointer", fontSize: "20px" }}>&times;</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "10px", marginTop: "24px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                          <span style={{ fontSize: "16px", color: "#475569" }}>Tổng giá trị đơn hàng:</span>
                          <b style={{ fontSize: "22px", color: "#0f172a" }}>{safePoItems.reduce((sum, item) => sum + (item.qty * item.importPrice), 0).toLocaleString()}đ</b>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                          <span style={{ fontSize: "15px", color: "#475569" }}>Đã trả trước cho NCC:</span>
                          <input type="number" className="custom-input" style={{ width: "200px", textAlign: "right", fontWeight: "bold", color: "#10b981", fontSize: "16px" }} value={paidAmount} onChange={e => setPaidAmount(parseInt(e.target.value)||0)} min="0" />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingTop: "15px", borderTop: "1px dashed #cbd5e1" }}>
                          <span style={{ fontSize: "16px", color: "#475569", fontWeight: "bold" }}>Công nợ sẽ ghi nhận:</span>
                          <b style={{ fontSize: "20px", color: "#ef4444" }}>{(safePoItems.reduce((sum, item) => sum + (item.qty * item.importPrice), 0) - paidAmount).toLocaleString()}đ</b>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button className="gradient-btn" onClick={async () => {
                            if (!selectedSupplierId) return toast.error("Vui lòng chọn Nhà Cung Cấp!");
                            if (safePoItems.length === 0) return toast.error("Phiếu nhập trống!");
                            const supplier = safeSuppliers.find(s => s.id.toString() === selectedSupplierId);
                            if (!supplier) return;
                            setLoading(true);
                            try {
                              const totalPOAmount = safePoItems.reduce((sum, item) => sum + (item.qty * item.importPrice), 0);
                              const debtAmount = totalPOAmount - paidAmount; 
                              const poCode = "PO" + Date.now().toString().slice(-6);
                              const newPO = { id: Date.now().toString(), po_code: poCode, supplier: supplier, items: safePoItems, total_amount: totalPOAmount, paid_amount: paidAmount, debt_amount: debtAmount, status: 'PENDING', note: poNote, created_at: new Date().toISOString() };
                              
                              const updatedPOs = [newPO, ...safeLocalPOs]; 
                              setLocalPOs(updatedPOs); 
                              localStorage.setItem("mart_pos", JSON.stringify(updatedPOs));

                              if(navigator.onLine) { await supabase.from('purchase_orders_v2').insert([newPO]); }
                              toast.success(`Đã lưu Phiếu Nhập ${poCode}!`); setShowPOModal(false);
                            } catch (err: any) { toast.error("Lỗi: " + err.message); } finally { setLoading(false); }
                          }} disabled={loading} style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)", padding: "16px", fontSize: "15px", flex: 1 }}>
                            {loading ? "ĐANG LƯU..." : "💾 LƯU PHIẾU"}
                          </button>
                          
                          <button className="custom-btn-primary" onClick={async () => {
                            if (!selectedSupplierId) return toast.error("Vui lòng chọn Nhà Cung Cấp!");
                            if (safePoItems.length === 0) return toast.error("Phiếu nhập trống!");
                            const supplier = safeSuppliers.find(s => s.id.toString() === selectedSupplierId);
                            if (!supplier) return;
                            setLoading(true);
                            try {
                              const totalPOAmount = safePoItems.reduce((sum, item) => sum + (item.qty * item.importPrice), 0);
                              const debtAmount = totalPOAmount - paidAmount; 
                              const poCode = "PO" + Date.now().toString().slice(-6);
                              const newPO = { id: Date.now().toString(), po_code: poCode, supplier: supplier, items: safePoItems, total_amount: totalPOAmount, paid_amount: paidAmount, debt_amount: debtAmount, status: 'PENDING', note: poNote, created_at: new Date().toISOString() };
                              
                              const updatedPOs = [newPO, ...safeLocalPOs]; 
                              setLocalPOs(updatedPOs); 
                              localStorage.setItem("mart_pos", JSON.stringify(updatedPOs));

                              if(navigator.onLine) { await supabase.from('purchase_orders_v2').insert([newPO]); }
                              toast.success(`Đã lưu Phiếu Nhập ${poCode}!`); 
                              
                              setPrintPOData(newPO);
                              setPrintMode('po_a4');
                              setTimeout(() => window.print(), 500);
                              
                              setShowPOModal(false);
                            } catch (err: any) { toast.error("Lỗi: " + err.message); } finally { setLoading(false); }
                          }} disabled={loading} style={{ background: "#0f172a", padding: "16px", fontSize: "15px", flex: 1, boxShadow: "0 4px 15px rgba(15, 23, 42, 0.3)" }}>
                            🖨️ LƯU & IN PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {poTab === 'RECEIVE' && (
                  <>
                    <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", height: "fit-content" }}>
                      <h3 style={{ margin: "0 0 15px 0", fontSize: "16px", color: "#1e293b", borderBottom: "1px dashed #cbd5e1", paddingBottom: "10px" }}>1. Danh sách Phiếu Nhập</h3>
                      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                        <input type="text" className="custom-input" placeholder="Nhập mã PO để lọc..." value={searchPoCode} onChange={e => setSearchPoCode(e.target.value)} />
                        <button className="gradient-btn" onClick={async () => {
                          const code = (searchPoCode || "").trim().toUpperCase(); if (!code) return; setLoading(true);
                          const localMatch = safeLocalPOs.find(p => (p.po_code || "").toUpperCase() === code);
                          if (localMatch) { setFoundPO(localMatch); setReceiveItems(localMatch.items.map((i: any) => ({ ...i, damagedQty: 0 }))); setLoading(false); return; }
                          if (navigator.onLine) {
                            const { data, error } = await supabase.from('purchase_orders_v2').select('*').ilike('po_code', code).single();
                            if (error || !data) { toast.error("Không tìm thấy số PO này!"); } else { setFoundPO(data); setReceiveItems(data.items.map((i: any) => ({ ...i, damagedQty: 0 }))); }
                          } else {
                            toast.error("Mất mạng và không tìm thấy trong bộ nhớ!");
                          }
                          setLoading(false);
                        }} disabled={loading} style={{ width: "80px", background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", boxShadow: "none", padding: "10px" }}>TÌM</button>
                      </div>
                      
                      <div style={{ flex: 1, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px", minHeight: "200px" }}>
                        <table className="modern-table" style={{ margin: 0, fontSize: "13px" }}>
                          <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                            <tr><th>Mã PO</th><th>Nhà Cung Cấp</th><th>Trạng thái</th><th style={{textAlign:"center"}}>Thao tác</th></tr>
                          </thead>
                          <tbody>
                            {safeAllPOs.length === 0 && !loading && <tr><td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>Chưa có phiếu nhập nào</td></tr>}
                            {loading && safeAllPOs.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>Đang tải dữ liệu...</td></tr>}
                            {safeAllPOs.filter(p => (p.po_code || "").toLowerCase().includes((searchPoCode || "").toLowerCase())).map(po => (
                              <tr key={po.id} style={{ background: po.id === foundPO?.id ? "#eff6ff" : "transparent" }}>
                                <td style={{ fontWeight: "bold", color: "#3b82f6" }}>{po.po_code}</td>
                                <td style={{maxWidth:'100px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={po.supplier?.name}>{po.supplier?.name}</td>
                                <td>
                                  <span style={{ color: po.status === 'PENDING' ? '#d97706' : '#059669', padding: "4px 8px", background: po.status === 'PENDING' ? '#fef3c7' : '#d1fae5', borderRadius: "4px", fontWeight: "bold", fontSize: "11px" }}>
                                    {po.status === 'PENDING' ? 'Chờ nhận' : 'Hoàn tất'}
                                  </span>
                                </td>
                                <td style={{ textAlign: "center" }}>
                                  <button onClick={() => { setFoundPO(po); setSearchPoCode(po.po_code); setReceiveItems(po.items.map((i: any) => ({ ...i, damagedQty: 0 }))); }} style={{ padding: "6px 12px", background: "#0f172a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "bold", transition: "0.2s" }} onMouseOver={e=>e.currentTarget.style.background="#ef4444"} onMouseOut={e=>e.currentTarget.style.background="#0f172a"}>CHỌN</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {foundPO && (
                        <div style={{ marginTop: "15px", padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px dashed #cbd5e1" }}>
                          <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#64748b", fontSize:"13px" }}>Số PO:</span>
                            <span style={{ fontWeight: "bold", color: "#3b82f6", fontSize:"13px" }}>{foundPO.po_code}</span>
                          </div>
                          <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#64748b", fontSize:"13px" }}>Nhà Cung Cấp:</span>
                            <span style={{ fontWeight: "bold", color: "#0f172a", fontSize:"13px" }}>{foundPO.supplier?.name}</span>
                          </div>
                          <div style={{ marginBottom: "15px", display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#64748b", fontSize:"13px" }}>Ngày tạo:</span>
                            <span style={{ color: "#0f172a", fontSize:"13px" }}>{new Date(foundPO.created_at).toLocaleString('vi-VN')}</span>
                          </div>
                          <button onClick={() => {
                             setPrintPOData(foundPO);
                             setPrintMode('po_a4');
                             setTimeout(() => window.print(), 500);
                          }} style={{ width: "100%", padding: "10px", background: "#1e293b", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>
                             🖨️ IN PHIẾU ĐẶT HÀNG / LƯU PDF
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", height: "fit-content", minHeight: "100%" }}>
                      <h3 style={{ margin: "0 0 15px 0", fontSize: "15px", color: "#1e293b", borderBottom: "1px dashed #cbd5e1", paddingBottom: "10px" }}>2. Đối Soát Hàng & Nhập Kho</h3>
                      {foundPO ? (
                        foundPO.status === 'COMPLETED' ? (
                           <div style={{ textAlign: "center", padding: "40px", background: "#ecfdf5", color: "#059669", borderRadius: "12px", fontWeight: "bold", fontSize: "18px", border: "1px solid #a7f3d0", marginTop: "20px" }}>✅ PHIẾU NÀY ĐÃ ĐƯỢC NHẬP KHO XONG!</div>
                        ) : (
                          <>
                            <div style={{ flex: 1, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                              <table className="modern-table" style={{ margin: 0 }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}><tr><th style={{textAlign:"left"}}>Sản phẩm</th><th style={{textAlign:"center"}}>SL Đã Đặt</th><th style={{textAlign:"center"}}>Hàng Hỏng/Lỗi</th><th style={{textAlign:"center"}}>SL Sẽ Nhập</th></tr></thead>
                                <tbody>
                                  {safeReceiveItems.map((item, idx) => (
                                    <tr key={idx}>
                                      <td style={{fontWeight: "600", color: "#0f172a"}}>{cleanName(item.product.name)}</td>
                                      <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "16px", color: "#3b82f6" }}>{item.qty}</td>
                                      <td style={{ textAlign: "center" }}><input type="number" className="custom-input" style={{ padding: "6px", width: "90px", textAlign: "center", color: "#ef4444", fontWeight: "bold", borderColor: item.damagedQty > 0 ? "#ef4444" : "#cbd5e1" }} value={item.damagedQty} onChange={e => { const val = parseInt(e.target.value)||0; if(val <= item.qty && val >= 0) setReceiveItems(safeReceiveItems.map((i, ix) => ix === idx ? { ...i, damagedQty: val } : i)) }} min="0" max={item.qty} /></td>
                                      <td style={{ textAlign: "center", fontWeight: "bold", color: "#10b981", fontSize: "18px" }}>{item.qty - (item.damagedQty || 0)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            
                            <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "10px", marginTop: "24px", border: "1px solid #e2e8f0" }}>
                               <p style={{ fontStyle: "italic", color: "#64748b", margin: "0 0 15px 0", fontSize: "13px", lineHeight: "1.5" }}>* Hệ thống sẽ tự động đối soát, cộng kho hàng thực tế và hoàn trả tiền công nợ hàng hỏng cho Nhà Cung Cấp.</p>
                               <button className="gradient-btn" onClick={async () => {
                                  if (!foundPO || safeReceiveItems.length === 0) return; setLoading(true);
                                  try {
                                    let actualTotal = 0; let logs: any[] = [];
                                    for (const item of safeReceiveItems) {
                                        const actualQty = item.qty - (item.damagedQty || 0); actualTotal += actualQty * item.importPrice;
                                        if (actualQty > 0) {
                                            const p = safeProducts.find(x => x.id === item.product.id);
                                            if (p) {
                                                await supabase.from('products').update({ stock: p.stock + actualQty, import_price: item.importPrice }).eq('id', p.id);
                                                logs.push({ id: Date.now() + Math.random(), shift, type: "NHẬP PO", name: p.name, qty: actualQty, total: actualQty * item.importPrice, time: new Date().toLocaleString('vi-VN') });
                                            }
                                        }
                                        if (item.damagedQty > 0) { logs.push({ id: Date.now() + Math.random(), shift, type: "TRẢ HÀNG NCC", name: item.product.name + " (Lỗi/Hỏng)", qty: item.damagedQty, total: 0, time: new Date().toLocaleString('vi-VN') }); }
                                    }
                                    
                                    const finalDebt = actualTotal - foundPO.paid_amount;
                                    if (finalDebt > 0 && foundPO.supplier) {
                                        const supplierId = foundPO.supplier.id; const s = safeSuppliers.find(x => x.id === supplierId);
                                        if (s) { const newD = (s.debt || 0) + finalDebt; await supabase.from('suppliers').update({ debt: newD }).eq('id', supplierId); setSuppliers(prev => (prev || []).map(x => x.id === supplierId ? { ...x, debt: newD } : x)); }
                                    }

                                    if(navigator.onLine) await supabase.from('purchase_orders_v2').update({ status: 'COMPLETED', items: safeReceiveItems, total_amount: actualTotal }).eq('id', foundPO.id);
                                    
                                    const updatedPOs = safeLocalPOs.map(p => p.id === foundPO.id ? { ...p, status: 'COMPLETED' } : p); setLocalPOs(updatedPOs); localStorage.setItem("mart_pos", JSON.stringify(updatedPOs));

                                    logs.forEach(lg => addTransactionAndSync(lg)); logAudit("NHẬN HÀNG PO", `Nhận mã ${foundPO.po_code}`); toast.success("Nhập Kho thành công!"); fetchProducts(); setShowPOModal(false);
                                  } catch (err: any) { toast.error("Lỗi: " + err.message); } finally { setLoading(false); }
                               }} disabled={loading} style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)", padding: "16px", fontSize: "16px" }}>{loading ? "ĐANG XỬ LÝ..." : "✅ XÁC NHẬN NHẬN HÀNG"}</button>
                            </div>
                          </>
                        )
                      ) : (
                        <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8", border: "2px dashed #cbd5e1", borderRadius: "12px", background: "#f8fafc", marginTop: "20px" }}>Vui lòng chọn một Phiếu Nhập (PO) từ danh sách bên trái để tiếp tục.</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div onClick={() => { setOpenFilter(null); setShowSuggestions(false); setShowMainMenu(false) }}>
      <style>{styles}</style> 
      <style>{`
        /* KHẮC PHỤC LOGO BỊ GIÃN DÀI VÀ KÉO SAO VÀO SÁT CHỮ T */
        .logo-wrapper { display: inline-flex !important; align-items: center; padding: 10px 45px 10px 20px !important; position: relative; width: fit-content !important; min-width: 0 !important; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); border-radius: 12px; margin-right: auto; }
        .logo-star { position: absolute !important; right: 12px !important; top: 50% !important; transform: translateY(-50%) !important; font-size: 26px !important; color: #f59e0b !important; margin: 0 !important; text-shadow: 0 1px 2px rgba(0,0,0,0.2); }

        /* KHAI BÁO BỘ CSS BẢNG BIỂU & NÚT BẤM HIỆN ĐẠI BẬC NHẤT 2026 */
        .modern-table { width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; }
        .modern-table th { background: #f8fafc; padding: 14px 16px; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; font-size: 13px; letter-spacing: 0.5px; white-space: nowrap; }
        .modern-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px; vertical-align: middle; transition: background 0.2s; }
        .modern-table tbody tr:hover td { background: #f8fafc; }
        
        .gradient-btn { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px; border-radius: 8px; font-weight: 800; border: none; width: 100%; font-size: 15px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3); text-transform: uppercase; letter-spacing: 0.5px; }
        .gradient-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4); }
        .gradient-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .custom-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(5px); display: flex; justify-content: center; align-items: center; z-index: 99999; }
        .custom-modal-overlay * { font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important; box-sizing: border-box; }
        .custom-modal-box { background: white; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); width: 95%; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; animation: modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes modalPop { 0% { opacity: 0; transform: scale(0.95) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        .custom-modal-header { padding: 20px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #ffffff; }
        .custom-modal-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
        .custom-modal-close { background: none; border: none; font-size: 28px; color: #94a3b8; cursor: pointer; transition: all 0.2s; padding: 0; line-height: 1; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; }
        .custom-modal-close:hover { color: #ef4444; background: #fee2e2; transform: rotate(90deg); }
        .custom-modal-body { padding: 24px; overflow-y: auto; }
        .custom-input-group { margin-bottom: 18px; }
        .custom-label { display: block; font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .custom-input { width: 100%; padding: 12px 16px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; outline: none; transition: all 0.2s; background: #f8fafc; color: #1e293b; font-weight: 500; }
        .custom-input:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }

        .animated-bg-mesh { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; background: linear-gradient(135deg, #ffedd5 0%, #fef08a 50%, #fed7aa 100%); background-size: 400% 400%; animation: gradientBgAnim 15s ease infinite; opacity: 0.8; }
        @keyframes gradientBgAnim { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        [data-theme='dark'] .animated-bg-mesh { background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); opacity: 1; }
      `}</style>
      <div className="animated-bg-mesh"></div>
      <Toaster position="top-right" reverseOrder={false} />

      <input type="text" id="search-barcode" style={{position:'absolute', opacity: 0, height: 0, width: 0}} value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} onKeyDown={handleBarcodeSubmitAction} />
      
      {!isLoggedIn ? (
        <div className="login-wrapper">
          <style>{`
            .login-wrapper { min-height: 100vh; width: 100vw; display: flex; justify-content: center; align-items: center; position: fixed; top:0; left:0; z-index: 9999; font-family: 'Inter', sans-serif;}
            .floating-bubble { position: absolute; background: rgba(255,255,255,0.4); border-radius: 50%; animation: floatUp linear infinite; bottom: -120px; filter: blur(2px); }
            @keyframes floatUp { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-120vh) scale(1.2); opacity: 0; } }
            .glass-login { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.8); padding: 40px 35px; border-radius: 20px; box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1); width: 100%; max-width: 380px; z-index: 10; animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; display: flex; flex-direction: column; gap: 15px; box-sizing: border-box;}
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            .login-header { text-align: center; margin-bottom: 10px; }
            .login-title { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; margin: 0 0 6px 0; color: #0f172a; text-transform: uppercase; }
            .login-title span { color: #e11d48; }
            .login-subtitle { font-size: 13px; color: #64748b; font-weight: 500; margin: 0; }
            .login-input-group { position: relative; width: 100%; margin-bottom: 0; }
            .login-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; width: 18px; height: 18px; pointer-events: none;}
            .login-input { width: 100%; padding: 14px 16px 14px 42px; border-radius: 12px; border: 1.5px solid #e2e8f0; background: #f8fafc; box-sizing: border-box; outline: none; transition: all 0.2s ease; font-size: 14px; color: #1e293b; font-weight: 500; }
            .login-input:focus { border-color: #e11d48; background: #fff; box-shadow: 0 0 0 4px rgba(225, 29, 72, 0.1); }
            .login-btn-submit { width: 100%; padding: 14px; background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); color: #fff; border: none; border-radius: 12px; font-weight: 800; font-size: 15px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.25); margin-top: 10px; text-transform: uppercase; letter-spacing: 0.5px;}
            .login-btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(225, 29, 72, 0.35); }
            .login-btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
          `}</style>
          
          <div className="floating-bubble" style={{ width: '100px', height: '100px', left: '10%', animationDuration: '8s' }}></div>
          <div className="floating-bubble" style={{ width: '50px', height: '50px', left: '25%', animationDuration: '5s', animationDelay: '2s' }}></div>
          <div className="floating-bubble" style={{ width: '80px', height: '80px', left: '70%', animationDuration: '10s', animationDelay: '1s' }}></div>
          
          <form className="glass-login" onSubmit={handleLogin}>
            <div className="login-header">
              <h2 className="login-title">HẢI LÊ <span>MART</span></h2>
              <p className="login-subtitle">Hệ thống Quản lý ERP & POS</p>
            </div>
            
            <div className="login-input-group">
              <svg className="login-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <input className="login-input" placeholder="Tên đăng nhập (Email)..." value={authUsername} onChange={e => setAuthUsername(e.target.value)} required />
            </div>
            
            <div className="login-input-group">
              <svg className="login-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <input className="login-input" type="password" placeholder="Mật khẩu truy cập..." value={authPassword} onChange={e => setAuthPassword(e.target.value)} required />
            </div>
            
            <button className="login-btn-submit" type="submit" disabled={loading}>
              {loading ? "ĐANG TẢI..." : "ĐĂNG NHẬP HỆ THỐNG"}
            </button>
          </form>
        </div>
      ) : (
        <div className="no-print" style={{ padding: "15px", position: "relative", minHeight: "100vh", overflowX: "auto" }}>
          
          {/* CÁC GIAO DIỆN IN VÀ POPUP ĐƯỢC NHÚNG TRỰC TIẾP CHỐNG LỖI */}
          {renderPrintArea()}
          {renderModals()}
          
          <div style={{ maxWidth: "1500px", margin: "0 auto", minWidth: "1000px" }}>
            
            <Header 
              role={role} shift={shift} totalValue={totalValue} currentShiftStats={currentShiftStats} setCashFlowModalInfo={setCashFlowModalInfo} darkMode={darkMode} setDarkMode={setDarkMode} handleLogoutClick={handleLogoutClick} showMainMenu={showMainMenu} setShowMainMenu={setShowMainMenu} setShowStatsModal={setShowStatsModal} setShowCustomerModal={setShowCustomerModal} setShowInventoryModal={setShowInventoryModal} setShowDebtModal={setShowDebtModal} setShowAuditModal={setShowAuditModal} setShowExpenseModal={setShowExpenseModal} setShowSupplierModal={setShowSupplierModal} setShowMarketingModal={setShowMarketingModal} bankBin={bankBin} bankAcc={bankAcc} bankNameStr={bankNameStr} setShowSettings={setShowSettings} lowStockCount={lowStockCount} isOnline={isOnline} syncStatus={syncStatus} syncAllOfflineData={syncAllOfflineData}
              setShowScannerLinkModal={setShowScannerLinkModal} setShowPOModal={setShowPOModal}
            />
            
            <div style={{ display: "grid", gridTemplateColumns: "7fr 3fr", gap: "10px" }}>
              <div className="glass" style={{ padding: "12px" }}>
                
                <ProductSearchAndActions 
                  role={role} 
                  barcodeInput={barcodeInput} 
                  setBarcodeInput={setBarcodeInput} 
                  showSuggestions={showSuggestions} 
                  setShowSuggestions={setShowSuggestions} 
                  handleBarcodeSubmit={handleBarcodeSubmitAction} 
                  setScannerMode={setScannerMode} 
                  products={safeProducts} 
                  handleSelectSuggest={handleSelectSuggest} 
                  
                  showInputForm={showInputForm} 
                  setShowInputForm={setShowInputForm} 
                  onAddProduct={() => setShowInputForm(true)}
                  onAddClick={() => setShowInputForm(true)}
                  handleAddClick={() => setShowInputForm(true)}
                  
                  handleFileUpload={handleFileUpload} 
                  onFileUpload={handleFileUpload}
                  onFileChange={handleFileUpload}
                  
                  downloadSampleCSV={downloadSampleCSV} 
                  onDownloadSample={downloadSampleCSV}
                  handleDownloadSample={downloadSampleCSV}
                />
                
                {showInputForm && (
                  <ProductInputForm
                    newCode={newCode} handleCodeChange={handleCodeChange}
                    newName={newName} setNewName={setNewName}
                    newCategory={newCategory} setNewCategory={setNewCategory}
                    categories={categories}
                    newImportPrice={newImportPrice} setNewImportPrice={setNewImportPrice}
                    newPrice={newPrice} setNewPrice={setNewPrice}
                    newPromoPrice={newPromoPrice} setNewPromoPrice={setNewPromoPrice}
                    newGiftCondition={newGiftCondition} setNewGiftCondition={setNewGiftCondition}
                    newGiftInfo={newGiftInfo} setNewGiftInfo={setNewGiftInfo}
                    newStock={newStock} setNewStock={setNewStock}
                    newExpiry={newExpiry} setNewExpiry={setNewExpiry}
                    handleAddProduct={handleAddProduct}
                    onSubmit={handleAddProduct}
                    onSave={handleAddProduct}
                    setShowInputForm={setShowInputForm}
                    onClose={() => setShowInputForm(false)}
                    onCancel={() => setShowInputForm(false)}
                    loading={loading}
                  />
                )}

                <div style={{ display: "flex", gap: "8px", marginBottom: "15px", marginTop: showInputForm ? "15px" : "0" }}>
                  {categories.map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`tab-btn ${selectedCategory === cat ? 'active' : ''}`}>{cat}</button>)}
                </div>
                <ProductTable role={role} sortedAndFilteredProducts={sortedAndFilteredProducts} requestSort={requestSort} handleEdit={handleEdit} addToCart={addToCart} handlePrintBarcode={handlePrintBarcode} handleDelete={handleDelete} sortConfig={sortConfig} filters={filters} setFilters={setFilters} openFilter={openFilter} setOpenFilter={setOpenFilter} uniqueNames={uniqueNames} uniqueStocks={uniqueStocks} uniqueImportPrices={uniqueImportPrices} uniqueSalePrices={uniqueSalePrices} uniqueExpiries={uniqueExpiries} />
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <CartPanel cart={safeCart} custName={custName} heldOrders={safeHeldOrders} cartTotalAmountDisplay={cartTotalAmountDisplay} setShowHoldModal={setShowHoldModal} handleHoldOrder={handleHoldOrder} clearCart={clearCart} setCustName={setCustName} setCustPhone={setCustPhone} setCustomerInput={setCustomerInput} setIsCheckoutOpen={setIsCheckoutOpen} setCheckoutStep={setCheckoutStep} adjustCartQty={adjustCartQty} handleDirectQtyChange={handleDirectQtyChange} handleDirectQtyBlur={handleDirectQtyBlur} removeFromCart={removeFromCart} />
                <HistoryPanel logSearchTerm={logSearchTerm} setLogSearchTerm={setLogSearchTerm} logTypeFilter={logTypeFilter} setLogTypeFilter={setLogTypeFilter} exportToCSV={exportToCSV} groupedHistory={groupedHistory} expandedDates={expandedDates} toggleDateGroup={toggleDateGroup} handleRefund={handleRefund} handleReprint={handleReprint} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

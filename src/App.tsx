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
  const EMAILJS_SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID || "service_7ie990l";
  const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || "template_m1j9i7k";
  const EMAILJS_TEMPLATE_VIP_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_VIP_ID || "template_t91erhg";
  const EMAILJS_PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || "5ric0kxuwNPlUleAv";
  
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

  const { darkMode, setDarkMode, showSettings, setShowSettings, showInputForm, setShowInputForm, showDebtModal, setShowDebtModal, showStatsModal, setShowStatsModal, showCustomerModal, setShowCustomerModal, showHandoverModal, setShowHandoverModal, showAuditModal, setShowAuditModal, showHoldModal, setShowHoldModal, showExpenseModal, setShowExpenseModal, showSupplierModal, setShowSupplierModal, showMarketingModal, setShowMarketingModal, showInventoryModal, setShowInventoryModal, showMainMenu, setShowMainMenu, cashFlowModalInfo, setCashFlowModalInfo, scannerMode, setScannerMode, printMode, setPrintMode } = useUIState();
  const { newCode, setNewCode, newName, setNewName, newImportPrice, setNewImportPrice, newPrice, setNewPrice, newPromoPrice, setNewPromoPrice, newGiftCondition, setNewGiftCondition, newGiftInfo, setNewGiftInfo, newStock, setNewStock, newExpiry, setNewExpiry, newCategory, setNewCategory, resetProductForm } = useProductInput();
  const { cart, setCart, barcodeInput, setBarcodeInput, isCheckoutOpen, setIsCheckoutOpen, checkoutStep, setCheckoutStep, customerInput, setCustomerInput, custPhone, setCustPhone, custName, setCustName, useWallet, setUseWallet, voucherInput, setVoucherInput, appliedVoucherAmount, setAppliedVoucherAmount, customerGiven, setCustomerGiven, lastOrder, setLastOrder, resetCheckout } = useCheckoutState();

  const [customers, setCustomers] = useState<Record<string, Customer>>(() => { const s = localStorage.getItem("mart_customers"); return s ? JSON.parse(s) : {} });
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => { const s = localStorage.getItem("mart_held_orders"); return s ? JSON.parse(s) : [] });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => { const s = localStorage.getItem("mart_audit"); return s ? JSON.parse(s) : [] });
  const [expenses, setExpenses] = useState<any[]>(() => { const s = localStorage.getItem("mart_expenses"); return s ? JSON.parse(s) : [] });
  const [suppliers, setSuppliers] = useState<any[]>(() => { const s = localStorage.getItem("mart_suppliers"); return s ? JSON.parse(s) : [] });
  const [history, setHistory] = useState<TransactionLog[]>(() => { const s = localStorage.getItem("mart_history"); return s ? JSON.parse(s) : [] });

  // States dành riêng cho in phiếu PO chuyên sâu
  const [printPOData, setPrintPOData] = useState<any>(null);

  const handlePrintPO = (po: any, type: 'po_order' | 'po_receipt' | 'po_return') => {
    setPrintPOData(po);
    setPrintMode(type);
    setTimeout(() => window.print(), 800);
  };

  const { isOnline, syncStatus, syncAllOfflineData, loadCloudData } = useOfflineSync({ isLoggedIn, history, setHistory, customers, setCustomers, heldOrders, setHeldOrders, auditLogs, setAuditLogs, expenses, setExpenses, suppliers, setSuppliers });

  const addTransactionAndSync = async (logData: any) => {
    setHistory(prev => [logData, ...prev]);
    if (navigator.onLine) {
      try { 
        await supabase.from("history").insert([logData]); 
      } catch (err) { console.error(err); }
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
        }).subscribe();
        
      const script = document.createElement("script"); 
      script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"; 
      script.onload = () => { 
        if(EMAILJS_PUBLIC_KEY) { (window as any).emailjs.init(EMAILJS_PUBLIC_KEY); } 
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
            setScanQueue(prev => [...prev, text]); 
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
          const matchedPhone = Object.keys(customers || {}).find(phone => phone === currentCode.trim() || customers[phone]?.cardCode === currentCode.trim()); 
          if (matchedPhone) { 
            playSound('success'); setCustomerInput(customers[matchedPhone].cardCode || matchedPhone); setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); setScanMessage({ text: `✅ KH VIP: ${customers[matchedPhone].name}`, type: 'success' }) 
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
        const matchedPhone = Object.keys(customers || {}).find(phone => phone === val || customers[phone]?.cardCode === val); 
        if (matchedPhone) { 
          setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); playSound('success'); setScanMessage({ text: `✅ Nhận diện VIP: ${customers[matchedPhone].name}`, type: 'success' }) 
        } else { 
          setCustPhone(val); setCustName(""); playSound('success'); setScanMessage({ text: `✅ Đã quét mã (Khách mới)`, type: 'success' }) 
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
               const merged = [...localPOs];
               data.forEach(d => { if (!merged.find(m => m.id === d.id)) merged.push(d); });
               merged.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
               setAllPOs(merged);
            } else { setAllPOs(localPOs); }
          } else { setAllPOs(localPOs); }
        } catch(e) { setAllPOs(localPOs); }
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
    const shiftLogs = history.filter(h => new Date(Math.floor(h.id)).toLocaleDateString('vi-VN') === todayStrStr && h.shift === shift); 
    let cash = startingCash; let transfer = 0; let prof = 0; let totalSales = 0; 
    shiftLogs.forEach(h => { 
      if (h.type === 'BÁN' || h.type === 'GHI NỢ') totalSales += h.total; 
      if (h.type === 'BÁN' || h.type === 'THU NỢ' || h.type === 'TRẢ HÀNG') { 
        if (h.paymentMethod === 'CHUYỂN KHOẢN' || h.paymentMethod === 'QUẸT THẺ' || h.paymentMethod === 'ZALO PAY') {
          transfer += h.total; 
        } else if (h.paymentMethod === 'TIỀN MẶT' || h.paymentMethod === 'KẾT HỢP') {
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
      if (h.paymentMethod === cashFlowModalInfo || (cashFlowModalInfo === 'CHUYỂN KHOẢN' && (h.paymentMethod === 'QUẸT THẺ' || h.paymentMethod === 'ZALO PAY')) || h.paymentMethod === 'KẾT HỢP') {
        let amount = h.total;
        if (h.paymentMethod === 'KẾT HỢP') {
          amount = cashFlowModalInfo === 'TIỀN MẶT' ? (h.split_cash || 0) : (h.total - (h.split_cash || 0));
        }
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
          if(h.paymentMethod === 'KẾT HỢP' && h.split_cash) { cash += h.split_cash; transfer += (h.total - h.split_cash); } else { cash += h.total; } 
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
      data.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, total: dayTotal, showLabel: (i % 3 === 0 || i === 0) }) 
    } 
    const maxVal = Math.max(...data.map(d => d.total), 1); 
    return data.map(d => ({ ...d, height: `${(d.total / maxVal) * 100}%` })) 
  }, [history]);
  
  const topSelling = useMemo(() => { 
    const sales: Record<string, number> = {}; 
    history.forEach(log => { 
      if ((log.type === 'BÁN' || log.type === 'GHI NỢ') && log.product_id !== 'DISCOUNT') { 
        const baseName = cleanName(log.name); sales[baseName] = (sales[baseName] || 0) + log.qty 
      } 
    }); 
    return Object.entries(sales).sort((a, b) => b[1] - a[1]).slice(0, 5) 
  }, [history]);
  
  const groupedHistory = useMemo(() => { 
    let filtered = history; 
    if (logTypeFilter !== "Tất cả") filtered = filtered.filter(log => log.type === logTypeFilter); 
    if (logSearchTerm.trim() !== "") { 
      const term = String(logSearchTerm || "").toLowerCase(); 
      filtered = filtered.filter(log => (log.name && String(log.name).toLowerCase().includes(term)) || (log.customer && String(log.customer).toLowerCase().includes(term)) || (log.id.toString().includes(term))) 
    } 
    return filtered.reduce((groups: any, log: any) => { 
      const date = new Date(Math.floor(log.id)).toLocaleDateString('vi-VN'); 
      if (!groups[date]) groups[date] = []; 
      groups[date].push({ ...log, t: new Date(Math.floor(log.id)).toLocaleTimeString('vi-VN') }); 
      return groups 
    }, {}) 
  }, [history, logSearchTerm, logTypeFilter]);

  const totalValue = Math.round(products.reduce((sum, p) => sum + ((Number(p.import_price) || 0) * (Number(p.stock) || 0)), 0));
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock < 10).length;
  const categories = ["Tất cả", ...Array.from(new Set(products.map(p => formatCategoryStr(p.category))))];
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
  }, [products, searchTerm, selectedCategory, sortConfig, filters]);


  // =====================================================================
  // 4. ACTION FUNCTIONS (HÀM XỬ LÝ SỰ KIỆN)
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
    if (!navigator.onLine) return toast.error("Mất mạng! Không thể lưu cài đặt lên Cloud."); 
    setLoading(true);
    try {
      const { error } = await supabase.from("settings").update({ 
        bank_bin: bin, bank_acc: acc, bank_name_str: nameStr, zalopay_id: zaloId, 
        happy_hour_start: hStart, happy_hour_end: hEnd, updated_at: new Date().toISOString() 
      }).eq("id", 1);
      
      if (!error) { 
        setBankBin(bin); setBankAcc(acc); setBankNameStr(nameStr); setZaloPayId(zaloId); 
        setHappyStart(hStart); setHappyEnd(hEnd); 
        toast.success("Lưu thành công!"); setShowSettings(false); 
      }
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
    setAuditLogs(prev => [newLog, ...prev].slice(0, 300)); 
  };
  
  const fetchProducts = async () => { 
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false }); 
    if (data) setProducts(data) 
  };
  
  const findProductByCode = (code: string) => { 
    const rawCode = code.trim(); 
    let matches = products.filter(prod => prod.product_code === rawCode || String(prod.product_code).startsWith(`${rawCode}-`)); 
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
    e.preventDefault(); 
    let u = authUsername.trim().toLowerCase(); 
    const p = authPassword.trim(); 
    if (!u.includes('@')) { u = u + '@hailemart.com'; } 
    localStorage.setItem("mart_starting_cash", startingCash.toString()); 
    setLoading(true); 
    const { error } = await supabase.auth.signInWithPassword({ email: u, password: p }); 
    if (error) { toast.error(`Đăng nhập thất bại.`); setLoading(false); return; } 
    const userRole = u.includes('admin') ? 'admin' : 'staff'; 
    setIsLoggedIn(true); setRole(userRole); 
    localStorage.setItem("mart_shift", shift); 
    localStorage.setItem("mart_logged_in", "true"); 
    localStorage.setItem("mart_role", userRole); 
    setLoading(false); 
  };

  const handleLogoutClick = () => setShowHandoverModal(true);
  
  const confirmHandover = async () => { 
    try { if (navigator.onLine) { await supabase.auth.signOut(); } } catch (error) {} 
    finally { 
      localStorage.removeItem("mart_logged_in"); localStorage.removeItem("mart_role"); 
      setIsLoggedIn(false); window.location.reload(); 
    } 
  };

  const handleEditPhone = async (oldPhone: string) => { 
    executeWithAdminCheck(() => { 
      const newPhone = window.prompt("Nhập SĐT mới:", oldPhone); 
      if (newPhone && newPhone.trim() !== "" && newPhone !== oldPhone) { 
        if (customers[newPhone]) return toast.error("SĐT đã tồn tại!"); 
        const cData = customers[oldPhone]; 
        setCustomers((prev: any) => { 
          const updated = { ...prev }; 
          updated[newPhone] = { ...cData, phone: newPhone }; 
          delete updated[oldPhone]; 
          return updated 
        }); 
        toast.success("Cập nhật thành công!"); 
      } 
    }); 
  };
  
  const addSupplier = async () => { 
    if (!supName || !supPhone) return toast.error("Nhập đủ Tên/SĐT"); 
    const newId = Date.now();
    setSuppliers(prev => [{ id: newId, name: supName, phone: supPhone, address: supAddress, item: supItem, debt: 0 }, ...prev]); 
    if (navigator.onLine) { supabase.from('suppliers').insert([{ id: newId, name: supName, phone: supPhone, address: supAddress, item: supItem, debt: 0 }]).then(); }
    setSupName(""); setSupPhone(""); setSupAddress(""); setSupItem(""); 
    toast.success("Thêm NCC thành công!"); 
  };

  const deleteSupplier = async (id: any) => { 
    setSuppliers(prev => prev.filter(s => s.id !== id)); 
    if (navigator.onLine) await supabase.from('suppliers').delete().eq('id', id); 
  };
  
  const addExpense = async () => { 
    if (!expName || !expAmount) return toast.error("Nhập chi phí!"); 
    setExpenses(prev => [{ id: Date.now(), date: new Date().toLocaleDateString('vi-VN'), name: expName, amount: Number(expAmount) }, ...prev]); 
    setExpName(""); setExpAmount(""); 
    toast.success("Đã ghi nhận chi phí!"); 
  };

  const deleteExpense = async (id: any) => { 
    setExpenses(prev => prev.filter(e => e.id !== id)); 
    if (navigator.onLine) await supabase.from('expenses').delete().eq('id', id); 
  };

  const closeCheckout = () => { resetCheckout() };

  const handleHoldOrder = async () => { 
    if (cart.length === 0) return; 
    const newO = { id: Date.now(), time: new Date().toLocaleTimeString('vi-VN'), cart: [...cart] }; 
    setHeldOrders(prev => [...prev, newO]); 
    logAudit("LƯU TẠM", `Lưu giỏ ${cart.length} món`); 
    resetCheckout(); 
    toast.success("Đã lưu tạm đơn hàng!"); 
  };

  const restoreOrder = async (order: any) => { 
    if (cart.length > 0) return toast.error("Vui lòng thanh toán giỏ hiện tại trước!"); 
    setCart(order.cart); 
    setHeldOrders(prev => prev.filter(o => o.id !== order.id)); 
    if (navigator.onLine) await supabase.from('held_orders').delete().eq('id', order.id); 
    setShowHoldModal(false); toast.success("Đã mở lại đơn tạm!"); 
  };

  const deleteHeldOrder = async (id: any) => { 
    setHeldOrders(prev => prev.filter(o => o.id !== id)); 
    logAudit("XÓA ĐƠN", `Xóa đơn lưu tạm`); 
    if (navigator.onLine) await supabase.from('held_orders').delete().eq('id', id); 
    toast.success("Đã xóa đơn tạm!"); 
  };

  const handleVoucherSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = voucherInput.trim().toUpperCase();
      const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 };
      if (VOUCHERS[code]) {
        setAppliedVoucherAmount(VOUCHERS[code]); playSound('success'); toast.success(`Đã áp dụng mã giảm ${VOUCHERS[code].toLocaleString()}đ`);
      } else if (!isNaN(Number(code)) && Number(code) > 0) {
        setAppliedVoucherAmount(Number(code)); playSound('success'); toast.success(`Đã giảm trực tiếp ${Number(code).toLocaleString()}đ`);
      } else {
        playSound('error'); toast.error("Mã Voucher không hợp lệ!"); setAppliedVoucherAmount(0);
      }
    }
  };

  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; setCustomerInput(val);
    const matchedPhone = Object.keys(customers || {}).find(phone => phone === val.trim() || customers[phone]?.cardCode === val.trim());
    if (matchedPhone) { 
      setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); setUseWallet(false); 
    } else { 
      setCustPhone(val); setCustName(""); setUseWallet(false); 
    }
  };

  const handleNextToQR = () => { 
    if (cart.length === 0) return toast.error("Giỏ hàng trống!"); 
    if (custPhone && !customers[custPhone] && !custName) return toast.error("Vui lòng nhập Tên khách mới!"); 
    setCheckoutStep(2); 
  };

  const confirmCheckout = async (payMethod: 'TIỀN MẶT' | 'CHUYỂN KHOẢN' | 'GHI NỢ' | 'KẾT HỢP' | 'QUẸT THẺ' | 'ZALO PAY') => {
    if (cart.some(i => !i.qty || i.qty <= 0)) { playSound('error'); return toast.error("Lỗi số lượng sản phẩm!") }
    if (payMethod === 'GHI NỢ' && !custPhone) return toast.error("Thanh toán Ghi nợ cần SĐT Khách hàng!");
    
    setLoading(true); 
    try {
      let newLogs: any[] = []; 
      const baseTotal = cartTotalAmountDisplay; 
      const subTotal = Math.round(baseTotal / (1 + VAT_RATE)); 
      const vatTotal = baseTotal - subTotal;
      const finalTotal = amountAfterTierAndVoucher - walletUsedAmount; 
      const orderIdStr = "HD" + Date.now().toString().slice(-6);

      for (const item of cart) {
        if (navigator.onLine) await supabase.from("products").update({ stock: Math.max(0, item.product.stock - item.qty) }).eq("id", item.product.id);
        
        let splitCashAmt = 0;
        if(payMethod === 'KẾT HỢP') { 
          splitCashAmt = Math.round((Number(customerGiven) / finalTotal) * Math.round(item.qty * getActualPrice(item.product) * (1 + VAT_RATE))); 
        }

        const newLog = { 
          id: Date.now() + Math.random(), 
          shift, 
          type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", 
          name: cleanName(item.product.name), 
          qty: item.qty, 
          total: item.total, 
          profit: Math.round(item.qty * (getActualPrice(item.product) - (item.product.import_price || 0))), 
          customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", 
          product_id: item.product.id, 
          paymentMethod: payMethod, 
          split_cash: splitCashAmt, 
          time: new Date().toLocaleString('vi-VN') 
        };
        newLogs.push(newLog);
      }
      
      if (custPhone) {
        const earned = payMethod === 'GHI NỢ' ? 0 : Math.round(finalTotal * 0.02);
        const updatedCust = { 
          name: custName, 
          wallet: payMethod === 'GHI NỢ' ? (customers[custPhone]?.wallet || 0) : Math.round((customers[custPhone]?.wallet || 0) - walletUsedAmount + earned), 
          debt: (customers[custPhone]?.debt || 0) + (payMethod === 'GHI NỢ' ? finalTotal : 0), 
          totalSpent: (customers[custPhone]?.totalSpent || 0) + (payMethod !== 'GHI NỢ' ? finalTotal : 0), 
          email: customers[custPhone]?.email || "", 
          address: customers[custPhone]?.address || "", 
          cardCode: customers[custPhone]?.cardCode || "" 
        }; 
        setCustomers(prev => ({ ...prev, [custPhone]: updatedCust })); 
        if (navigator.onLine) { 
          await supabase.from("customers").upsert({ phone: custPhone, ...updatedCust }); 
        }
      }

      setHistory(prev => [...newLogs, ...prev]);
      if (navigator.onLine) { 
        try { await supabase.from("history").insert(newLogs); } catch(err) { console.log(err); } 
      }

      setLastOrder({ orderId: orderIdStr, shift, cart: [...cart], subTotal, vatTotal, finalTotal, debtAmount: payMethod === 'GHI NỢ' ? finalTotal : 0, discount: appliedVoucherAmount + tierDiscountAmount, time: new Date().toLocaleString('vi-VN'), paymentMethod: payMethod, customerGiven: Number(customerGiven) || 0, custPhone, custName });
      setCheckoutStep(3); fetchProducts(); 
    } catch (err) { toast.error("Lỗi thanh toán: " + err.message); } finally { setLoading(false); }
  };

  const handleRefund = async (logId: any) => { 
    executeWithAdminCheck(async () => { 
      const log = history.find(l => l.id === logId); 
      if (!log || (log.type !== 'BÁN' && log.type !== 'GHI NỢ')) return; 
      
      // BƯỚC 1: Hỏi số lượng muốn trả
      const qtyInput = window.prompt(`Sản phẩm: ${cleanName(log.name)}\nSố lượng đã mua: ${log.qty}\n\nNhập SỐ LƯỢNG khách muốn trả lại:`, log.qty.toString());
      if (qtyInput === null) return; 

      const refundQty = parseInt(qtyInput);
      if (isNaN(refundQty) || refundQty <= 0) {
        return toast.error("Số lượng hoàn trả không hợp lệ!");
      }
      if (refundQty > log.qty) {
        return toast.error(`Lỗi! Số lượng trả lại (${refundQty}) không được lớn hơn số lượng đã mua (${log.qty})!`);
      }

      // TỰ ĐỘNG TÍNH TOÁN SỐ TIỀN & LỢI NHUẬN THEO SL THỰC TẾ
      const singlePrice = log.total / log.qty; 
      const refundTotal = Math.round(singlePrice * refundQty);
      const singleProfit = (log.profit || 0) / log.qty; 
      const refundProfit = Math.round(singleProfit * refundQty);

      let selectedMethod = "TIỀN MẶT";

      // BƯỚC 2: XỬ LÝ THANH TOÁN (PHÂN BIỆT RÕ BÁN THƯỜNG VÀ GHI NỢ)
      if (log.type === 'GHI NỢ') {
        // NẾU MUA NỢ -> BẮT BUỘC TRỪ NỢ (KHÔNG ĐƯỢC HOÀN TIỀN MẶT)
        const confirmDebt = window.confirm(`Đơn hàng này được MUA NỢ.\nHệ thống sẽ tự động trừ ${refundTotal.toLocaleString()}đ vào dư nợ của khách hàng. Đồng ý?`);
        if (!confirmDebt) return;
        selectedMethod = "TRỪ NỢ";

        const phoneMatch = log.customer.match(/\((.*?)\)/);
        const customerPhone = phoneMatch ? phoneMatch[1] : null;
        if (customerPhone && customers[customerPhone]) {
          const custData = customers[customerPhone];
          const newDebt = Math.max(0, (custData.debt || 0) - refundTotal); // Trừ nợ, không để nợ bị âm
          const updatedCust = { ...custData, debt: newDebt };
          setCustomers(prev => ({ ...prev, [customerPhone]: updatedCust }));
          if (navigator.onLine) {
            await supabase.from("customers").update({ debt: newDebt }).eq("phone", customerPhone);
          }
        }
      } else {
        // NẾU MUA TRẢ TIỀN RỒI -> HỎI HÌNH THỨC HOÀN LẠI TIỀN CHO KHÁCH
        const choice = window.prompt(`Xác nhận trả lại ${refundQty} sản phẩm.\nNhập số để chọn hình thức hoàn tiền:\n1. TIỀN MẶT\n2. CHUYỂN KHOẢN\n3. HOÀN VÀO VÍ VIP`, "1");
        if (choice === null) return; 

        if (choice === "2") selectedMethod = "CHUYỂN KHOẢN";
        if (choice === "3") selectedMethod = "VÍ WALLET";

        // Nếu hoàn tiền vào Ví VIP
        if (choice === "3") {
          const phoneMatch = log.customer.match(/\((.*?)\)/);
          const customerPhone = phoneMatch ? phoneMatch[1] : null;
          if (!customerPhone || !customers[customerPhone]) {
            return toast.error("Đơn hàng này thuộc Khách lẻ, không có tài khoản để hoàn vào Ví VIP!");
          }
          
          const custData = customers[customerPhone];
          const updatedCust = { ...custData, wallet: Math.round((custData.wallet || 0) + refundTotal) };
          setCustomers(prev => ({ ...prev, [customerPhone]: updatedCust }));
          if (navigator.onLine) {
            await supabase.from("customers").update({ wallet: updatedCust.wallet }).eq("phone", customerPhone);
          }
        }
      }

      // BƯỚC 3: CỘNG LẠI SỐ LƯỢNG VÀO TỒN KHO TRÊN CLOUD
      if (log.product_id) {
        const currentProd = products.find(p => p.id === log.product_id);
        if (currentProd) {
          const updatedStock = (currentProd.stock || 0) + refundQty;
          if (navigator.onLine) {
            try {
              await supabase.from("products").update({ stock: updatedStock }).eq("id", log.product_id);
            } catch (e) {
              console.error("Lỗi cập nhật tồn kho Supabase:", e);
            }
          }
        }
      }

      // BƯỚC 4: Tạo Log Trả Hàng vào lịch sử
      const lg = { 
        id: Date.now(), 
        shift, 
        type: "TRẢ HÀNG", 
        name: `HOÀN: ${cleanName(log.name)}`, 
        qty: refundQty, 
        total: -refundTotal, 
        profit: -refundProfit, 
        customer: log.customer, 
        product_id: log.product_id, 
        paymentMethod: selectedMethod, 
        time: new Date().toLocaleString('vi-VN') 
      }; 
      
      await addTransactionAndSync(lg); 
      await fetchProducts(); 
      toast.success(`Đã nhận hoàn trả ${refundQty} mặt hàng (${selectedMethod})!`); 
    }); 
  };
 const handlePayDebt = async (phone: string) => { 
    const currentDebt = customers[phone]?.debt || 0; 
    if (currentDebt <= 0) return toast.error("Khách hàng hiện không có nợ!"); 
    
    // BƯỚC 1: Hiện Prompt hỏi số tiền khách muốn trả trước là bao nhiêu
    const inputAmount = window.prompt(
      `Khách hàng: ${customers[phone].name}\nDư nợ hiện tại: ${currentDebt.toLocaleString()}đ\n\nNhập số tiền khách muốn thanh toán trước:`, 
      currentDebt.toString()
    );
    if (inputAmount === null) return; // Bấm hủy bỏ đơn

    const paidAmount = parseInt(inputAmount.replace(/[,.]/g, ''));
    if (isNaN(paidAmount) || paidAmount <= 0) {
      return toast.error("Số tiền thanh toán không hợp lệ!");
    }
    if (paidAmount > currentDebt) {
      return toast.error(`Số tiền trả (${paidAmount.toLocaleString()}đ) không được lớn hơn tổng nợ hiện tại (${currentDebt.toLocaleString()}đ)!`);
    }

    // BƯỚC 2: Tính toán số dư nợ còn lại
    const remainingDebt = currentDebt - paidAmount;
    
    // Cập nhật lên State nội bộ của ứng dụng
    setCustomers(prev => ({ 
      ...prev, 
      [phone]: { ...prev[phone], debt: remainingDebt } 
    })); 
    
    // Đồng bộ trực tiếp lên Cloud cơ sở dữ liệu Supabase
    if (navigator.onLine) {
      await supabase.from("customers").update({ debt: remainingDebt }).eq("phone", phone); 
    }
    
    // BƯỚC 3: Ghi nhận giao dịch THU NỢ với số tiền thực tế khách vừa đóng vào két ca làm việc
    const lg = { 
      id: Date.now(), 
      shift, 
      type: "THU NỢ", 
      name: remainingDebt === 0 ? "Thanh toán hết nợ" : `Trả bớt nợ (Còn nợ: ${remainingDebt.toLocaleString()}đ)`, 
      qty: 1, 
      total: paidAmount, // Số tiền thực nhận trong ca
      profit: 0, 
      customer: `${customers[phone].name} (${phone})`, 
      paymentMethod: 'TIỀN MẶT', 
      time: new Date().toLocaleString('vi-VN') 
    }; 
    addTransactionAndSync(lg); 
    
    if (remainingDebt === 0) {
      toast.success("Khách hàng đã thanh toán sạch nợ hoàn toàn!");
    } else {
      toast.success(`Đã thu trước ${paidAmount.toLocaleString()}đ. Dư nợ còn lại của khách: ${remainingDebt.toLocaleString()}đ`);
    }
  };

  const handleReprint = (timeStr: string) => {
    const logsInBill = history.filter(h => h.time === timeStr && (h.type === 'BÁN' || h.type === 'GHI NỢ' || h.type === 'TRẢ HÀNG') && h.product_id !== 'DISCOUNT'); 
    const discountLog = history.find(h => h.time === timeStr && h.product_id === 'DISCOUNT');
    if(logsInBill.length === 0) return toast.error("Không tìm thấy dữ liệu hóa đơn!");
    
    const isRefundSlip = logsInBill[0].type === 'TRẢ HÀNG';
    
    const reconstructedCart = logsInBill.map(l => ({ 
      qty: l.qty, 
      product: { 
        name: l.name, 
        gift_info: null, 
        isHappyHour: String(l.name).includes('[Giờ Vàng]') 
      }, 
      priceIncludingVat: l.total / l.qty 
    }));
    
    const subTotal = reconstructedCart.reduce((s, i) => s + (i.qty * (i.priceIncludingVat / (1 + VAT_RATE))), 0); 
    const vatTotal = Math.round(subTotal * VAT_RATE); 
    const discount = discountLog ? Math.abs(discountLog.total) : 0; 
    const finalTotal = logsInBill.reduce((sum, l) => sum + l.total, 0) - discount;
    
    let cPhone = ""; let cName = logsInBill[0].customer;
    if (cName !== "Khách lẻ") { 
      const match = cName.match(/\((.*?)\)/); 
      if (match && match[1]) { cPhone = match[1]; cName = cName.replace(` (${cPhone})`, ""); } else { cPhone = cName; } 
    }
    
    const rOrder = { 
      // Nếu là đơn hoàn hàng, tiêu đề máy in POS tự đổi thành PHIẾU TRẢ HÀNG thay vì Hải Lê Mart
      orderId: isRefundSlip ? "PHIẾU TRẢ HÀNG" : "HD_COPY", 
      shift: logsInBill[0].shift, 
      cart: reconstructedCart, 
      subTotal, 
      vatTotal, 
      finalTotal, 
      debtAmount: logsInBill[0].type === 'GHI NỢ' ? finalTotal : 0, 
      discount, 
      time: timeStr, 
      paymentMethod: logsInBill[0].paymentMethod, 
      customerGiven: 0, 
      custName: cName, 
      custPhone: cPhone 
    };
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
    
    let itemsHtml = ""; 
    lastOrder.cart.forEach((item: any) => { 
      const priceToUse = item.priceIncludingVat !== undefined ? item.priceIncludingVat : Math.round(getActualPrice(item.product) * (1 + VAT_RATE)); 
      itemsHtml += `<tr><td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">${cleanName(item.product.name)}</td><td style="padding: 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">${item.qty}</td><td style="padding: 10px; text-align: right; border-bottom: 1px solid #f1f5f9;">${(priceToUse * item.qty).toLocaleString()}đ</td></tr>`; 
    }); 
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: #1e293b; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; color: #ef4444;">HẢI LÊ MART</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">HÓA ĐƠN BÁN HÀNG</p>
        </div>
        <div style="padding: 20px; background: #ffffff;">
          <p><strong>Mã HĐ:</strong> ${lastOrder.orderId}</p>
          <p><strong>Thời gian:</strong> ${lastOrder.time}</p>
          <p><strong>Khách hàng:</strong> ${lastOrder.custName || "Khách lẻ"} ${lastOrder.custPhone ? `(${lastOrder.custPhone})` : ""}</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1;">Sản phẩm</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #cbd5e1;">SL</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #cbd5e1;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="margin-top: 20px; text-align: right;">
            <p>Tiền hàng: ${Math.round(lastOrder.subTotal).toLocaleString()}đ</p>
            <p>VAT (10%): ${Math.round(lastOrder.vatTotal).toLocaleString()}đ</p>
            ${lastOrder.discount > 0 ? `<p>Giảm giá/Ví: -${Math.round(lastOrder.discount).toLocaleString()}đ</p>` : ""}
            <h2 style="color: #ef4444; border-top: 2px dashed #e2e8f0; padding-top: 10px;">TỔNG CỘNG: ${Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</h2>
            <p style="color: #64748b; font-size: 14px;">Phương thức TT: ${lastOrder.paymentMethod}</p>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">Cảm ơn quý khách! Hẹn gặp lại.</p>
        </div>
      </div>`;
      
    try { 
      await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { 
        to_email: email, subject: `🧾 Hóa đơn mua hàng #${lastOrder.orderId} - Hải Lê Mart`, html_message: htmlContent, order_id: lastOrder.orderId, time: lastOrder.time, items_list: "", total_amount: "", payment_method: "", change_amount: ""
      }); 
      toast.success("Đã gửi Hóa đơn cho khách!"); 
      logAudit("GỬI HĐ MAIL", `Gửi tới ${email}`); 
    } catch (error: any) { 
      console.error(error); toast.error(`Lỗi gửi Email (EmailJS)`); 
    } 
    setLoading(false)
  };

  const printCustomerCard = (phone: string) => { 
    const cust = customers[phone];
    if(!cust) return toast.error("Không tìm thấy dữ liệu khách!");
    
    setPrintCustomer({ phone, ...cust }); 
    setPrintMode('customer_card'); 
    
    toast.loading("Đang tạo thẻ in...", { duration: 1500 });
    setTimeout(() => {
      window.print();
    }, 1500); 
  };

  const sendCardEmail = async (phone: string) => {
    const cust = customers[phone]; 
    if(!cust) return toast.error("Không tìm thấy dữ liệu khách!");

    if (!(window as any).emailjs) {
      return toast.error("Hệ thống EmailJS chưa tải xong, vui lòng thử lại sau!");
    }

    let email = cust.email || window.prompt(`Nhập Email của ${cust.name}:`, ""); 
    if (!email) return; 
    email = email.trim(); 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    if (!emailRegex.test(email)) return toast.error("Địa chỉ Email không hợp lệ!");
    
    if (!cust.email) { 
      setCustomers((prev: any) => ({ ...prev, [phone]: { ...prev[phone], email } })); 
    } 
    setLoading(true); 
    toast.loading("Đang gửi email...", { id: "sending_email" });
    
    const code = cust.cardCode || phone; 
    const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(code)}&scale=2&height=10&includetext=false`; 
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; color: #ffff00;">HẢI LÊ MART</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">THẺ KHÁCH HÀNG THÂN THIẾT</p>
        </div>
        <div style="padding: 30px 20px; background: #fff7ed; text-align: center;">
          <h2 style="margin: 0 0 15px 0; color: #0f172a; font-size: 22px;">Xin chào, ${cust.name}!</h2>
          <p style="color: #475569; font-size: 15px; margin-bottom: 25px;">Cảm ơn bạn đã đồng hành cùng Hải Lê Mart. Đây là Thẻ VIP điện tử của bạn.</p>
          <div style="background: #ffffff; border: 2px dashed #ea580c; border-radius: 12px; padding: 20px; display: inline-block; width: 80%; max-width: 300px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #ea580c;">MÃ THẺ CỦA BẠN</p>
            <img src="${barcodeUrl}" alt="Barcode" style="max-width: 100%; height: auto;" />
            <p style="margin: 10px 0 0 0; font-family: monospace; font-size: 18px; letter-spacing: 2px; font-weight: bold; color: #0f172a;">${code}</p>
          </div>
          <p style="color: #64748b; font-size: 13px; margin-top: 25px; font-style: italic;">(Vui lòng xuất trình mã vạch này cho thu ngân khi thanh toán để nhận ưu đãi Đặc Quyền VIP)</p>
        </div>
        <div style="background: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">Hải Lê Mart © 2026 - Hotline: 0902 613 899</p>
        </div>
      </div>`;
      
    try { 
      await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_VIP_ID, { 
        to_email: email, subject: `💳 Thẻ VIP Đặc Quyền - ${cust.name}`, html_message: htmlContent, order_id: "", time: "", items_list: "", total_amount: "", payment_method: "", change_amount: "", barcode_url: ""
      }); 
      toast.success("Đã gửi Thẻ VIP thành công!", { id: "sending_email" }); 
      logAudit("GỬI THẺ VIP", `Gửi tới ${email}`); 
    } catch (error: any) { 
      console.error("Lỗi EmailJS:", error); 
      toast.error(`Gửi mail thất bại! Kiểm tra lại cấu hình EmailJS.`, { id: "sending_email" }); 
    } 
    setLoading(false);
  };
  
  const shareToZalo = (phone: string) => { 
    const cust = customers[phone]; 
    const code = cust.cardCode || phone; 
    navigator.clipboard.writeText(`Chào ${cust.name},\nCảm ơn bạn đã đồng hành cùng Hải Lê Mart!\n💳 Mã Thẻ VIP của bạn là: ${code}`).then(() => { 
      toast.success(`Đã copy lời chào. Đang mở Zalo...`); 
      window.open(`https://zalo.me/${phone}`, '_blank') 
    }).catch(() => { 
      window.open(`https://zalo.me/${phone}`, '_blank') 
    }) 
  };
  
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const code = e.target.value; setNewCode(code); 
    const p = products.find((x: any) => x.product_code === code); 
    if (p) { 
      setNewName(cleanName(p.name)); setNewCategory(formatCategoryStr(p.category)); 
      setNewImportPrice(p.import_price?.toString() || ""); setNewPrice(p.sale_price.toString()); 
      setNewPromoPrice(p.promo_price?.toString() || ""); setNewExpiry(p.expiry_date || ""); 
      const gift = parseGift(p.gift_info); 
      setNewGiftCondition(gift.cond.toString()); setNewGiftInfo(gift.text) 
    } 
  };
  
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!navigator.onLine) return toast.error("Cần mạng để thao tác Kho!"); 
    setLoading(true);
    try {
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
          syncMsg = `\n💡 Đã ĐỒNG BỘ GIÁ & QUÀ TẶNG cho lô cũ!`; 
          logAudit("ĐỒNG BỘ", `Cập nhật Giá mã ${baseCode}`); 
        }
      }

      if (exist) {
        if (exist.stock <= 0) {
          await supabase.from("products").update({ name: newName, category: formattedCat, import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null, created_at: new Date().toISOString() }).eq("id", exist.id);
          if (added > 0) addTransactionAndSync({ id: Date.now(), shift, type: "NHẬP", name: newName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }); 
          toast.success(`Đã nhập hàng!${syncMsg}`);
        } else {
          if (exist.import_price !== impPrice || (exist.expiry_date || "") !== (newExpiry || "")) {
            const batchCode = `${baseCode}-${Date.now().toString().slice(-4)}`; const batchName = `${newName} [Lô mới]`;
            if (window.confirm(`Tạo LÔ MỚI (${batchCode})?`)) {
              await supabase.from("products").insert([{ product_code: batchCode, name: batchName, category: formattedCat, import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null }]);
              if (added > 0) addTransactionAndSync({ id: Date.now(), shift, type: "NHẬP", name: batchName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }); 
              toast.success(`Đã tạo lô mới!${syncMsg}`);
            } else { setLoading(false); return; }
          } else {
            await supabase.from("products").update({ stock: exist.stock + added, created_at: new Date().toISOString() }).eq("id", exist.id);
            if (added > 0) addTransactionAndSync({ id: Date.now(), shift, type: "NHẬP", name: newName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }); 
            toast.success(`Cộng dồn thành công!${syncMsg}`);
          }
        }
      } else {
        await supabase.from("products").insert([{ product_code: baseCode, name: newName, category: formattedCat, import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null }]);
        if (added > 0) addTransactionAndSync({ id: Date.now(), shift, type: "NHẬP", name: newName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }); 
        toast.success(`Nhập thành công!${syncMsg}`);
      }
      resetProductForm(); fetchProducts(); setShowInputForm(false);
    } catch (err) { toast.error("Lỗi khi lưu sản phẩm"); } finally { setLoading(false); }
  };

  const handleFileUpload = async (e: any) => {
    const file = e?.target?.files?.[0] || e; 
    if (!file || !file.name) { 
      if (e?.target) e.target.value = ''; 
      return; 
    }
    if (!navigator.onLine) { 
      toast.error("Cần mạng để tải lên!"); 
      if (e?.target) e.target.value = ''; 
      return; 
    }

    const processData = async (lines: any[]) => {
      setLoading(true); 
      try {
        if (!lines || lines.length <= 1) { 
          toast.error("File rỗng hoặc không hợp lệ!"); setLoading(false); return; 
        } 
        
        let successCount = 0; let importLogs: any[] = [];
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
            await supabase.from("products").insert([{ product_code: baseCode, name: pName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: promo, gift_info: pGift, stock: pStock, expiry_date: pExpiry }]); 
          }
          
          if (pStock > 0) { 
            importLogs.push({ id: Date.now() + Math.random(), shift: shift, type: "NHẬP", name: cleanName(pName), qty: pStock, total: 0, time: new Date().toLocaleString('vi-VN') } as any); 
            successCount++; 
          }
        }
        
        if (importLogs.length > 0) { 
          if(navigator.onLine) await supabase.from("history").insert(importLogs); 
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
      if (!(window as any).XLSX) { 
        toast.loading("Thư viện Excel đang tải, vui lòng thử lại sau vài giây!"); 
        if (e?.target) e.target.value = ''; 
        return; 
      } 
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
    if (e?.target) e.target.value = ''; 
  };

  const handleImportInventoryCSV = (e: any) => {
    const file = e?.target?.files?.[0] || e; 
    if (!file || !file.name) { 
      if (e?.target) e.target.value = ''; 
      return; 
    }
    
    const processData = (lines: any[]) => { 
      let updatedStock = { ...actualStockInput }; 
      let count = 0; 
      for (let i = 1; i < lines.length; i++) { 
        const cols = lines[i]; 
        if (!cols || !Array.isArray(cols) || cols.join('').trim() === '') continue; 
        const pCode = String(cols[0] || "").trim(); 
        const actualVal = parseInt(String(cols[3] || "0").replace(/[,.]/g, '')); 
        if (!isNaN(actualVal) && pCode) { 
          const matchedProd = products.find(p => p.product_code === pCode); 
          if (matchedProd && matchedProd.stock !== actualVal) { 
            updatedStock[matchedProd.id] = actualVal; 
            count++; 
          } 
        } 
      } 
      setActualStockInput(updatedStock); 
      toast.success(`Đã nạp số liệu cho ${count} sản phẩm có thay đổi từ file!`); 
    };
    
    const fileNameStr = file.name.toLowerCase();
    if (fileNameStr.endsWith('.xlsx') || fileNameStr.endsWith('.xls')) { 
      if (!(window as any).XLSX) { 
        toast.loading("Thư viện Excel đang tải, vui lòng thử lại sau vài giây!"); 
        if (e?.target) e.target.value = ''; 
        return; 
      } 
      const reader = new FileReader(); 
      reader.onload = (event) => { 
        try { 
          const data = new Uint8Array(event.target?.result as ArrayBuffer); 
          const workbook = (window as any).XLSX.read(data, { type: 'array' }); 
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]; 
          const jsonData = (window as any).XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "", raw: false }); 
          processData(jsonData); 
        } catch(err) { 
          console.error(err); 
          toast.error("Lỗi định dạng cấu trúc khi đọc file Excel."); 
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
    if (e?.target) e.target.value = '';
  };
  
  const handleDelete = async (id: any, name: any) => { 
    executeWithAdminCheck(async () => { 
      if (!navigator.onLine) return toast.error("Cần có mạng để thao tác Kho!"); 
      if (window.confirm(`Xóa vĩnh viễn ${name}?`)) { 
        await supabase.from("products").delete().eq("id", id); 
        logAudit("XÓA SP", `Xóa: ${name}`); 
        fetchProducts() 
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
        fetchProducts() 
      } 
    }); 
  };

  const handlePrintBarcode = (p: any) => { 
    const q = window.prompt(`SL tem in: ${cleanName(p.name)}`, "30"); 
    if (q && parseInt(q) > 0) { 
      setPrintBarcodeProduct(p); 
      setBarcodeCount(parseInt(q)); 
      setPrintMode('barcode'); 
      setTimeout(() => window.print(), 1500) 
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
            cash += l.split_cash; 
            transfer += (l.total - l.split_cash); 
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
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: #3b82f6; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">HẢI LÊ MART</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">BÁO CÁO DOANH THU</p>
        </div>
        <div style="padding: 20px; background: #ffffff;">
          <h2 style="margin: 0 0 15px 0; color: #0f172a; text-align: center;">Kỳ: ${reportStartDate} đến ${reportEndDate}</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tbody>
              <tr><td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">Tổng SP đã bán:</td><td style="padding: 10px; text-align: right; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${sold} món</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">Doanh thu Tiền Mặt:</td><td style="padding: 10px; text-align: right; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #10b981;">${Math.round(cash).toLocaleString()}đ</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">Doanh thu CK/Thẻ/ZaloPay:</td><td style="padding: 10px; text-align: right; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #3b82f6;">${Math.round(transfer).toLocaleString()}đ</td></tr>
              <tr><td style="padding: 10px; font-size: 18px; color: #ef4444;">TỔNG LỢI NHUẬN:</td><td style="padding: 10px; text-align: right; font-size: 18px; font-weight: bold; color: #ef4444;">${Math.round(prof).toLocaleString()}đ</td></tr>
            </tbody>
          </table>
        </div>
        <div style="background: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">Được gửi tự động từ hệ thống Hải Lê ERP</p>
        </div>
      </div>`;
      
    try { 
      await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { 
        to_email: adminEmail, subject: `📊 Báo cáo doanh thu kỳ ${reportStartDate} - ${reportEndDate}`, html_message: htmlContent, order_id: "", time: "", items_list: "", total_amount: "", payment_method: "", change_amount: "" 
      }); 
      logAudit("GỬI BÁO CÁO", `Đã gửi báo cáo tới ${adminEmail}`); 
      toast.success("Đã gửi Báo cáo thành công!"); 
    } catch (error: any) { 
      console.error(error); toast.error(`Lỗi gửi Email (EmailJS)`); 
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
    
    let htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: #ef4444; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🚨 CẢNH BÁO KHO HÀNG</h1>
        </div>
        <div style="padding: 20px; background: #ffffff;">
          <h3 style="color: #b91c1c; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px;">📦 SẮP HẾT HÀNG (${lowStock} món):</h3>
          <ul style="color: #475569; font-size: 14px;">`;
          
    products.filter(p => p.stock > 0 && p.stock < 10).forEach(p => { 
      htmlContent += `<li><strong>${cleanName(p.name)}:</strong> Còn ${p.stock} sản phẩm</li>`; 
    });
    
    htmlContent += `</ul><h3 style="color: #b45309; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; margin-top: 20px;">⏳ SẮP HẾT HẠN TRONG 15 NGÀY TỚI (${expiring.length} món):</h3><ul style="color: #475569; font-size: 14px;">`;
    
    expiring.forEach(p => { 
      htmlContent += `<li><strong>${cleanName(p.name)}:</strong> HSD ${new Date(p.expiry_date).toLocaleDateString('vi-VN')}</li>`; 
    });
    
    htmlContent += `</ul></div><div style="background: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;"><p style="margin: 0; font-size: 12px; color: #94a3b8;">Hệ thống quản lý kho Hải Lê ERP</p></div></div>`;
    
    try { 
      await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { 
        to_email: adminEmail, subject: `🚨 Cảnh báo Tồn Kho & Hạn Sử Dụng - Hải Lê Mart`, html_message: htmlContent, order_id: "", time: "", items_list: "", total_amount: "", payment_method: "", change_amount: "" 
      }); 
      toast.success("Đã gửi cảnh báo kho thành công!"); 
      logAudit("CẢNH BÁO KHO", "Gửi email báo cáo tồn kho"); 
    } catch (error: any) { 
      console.error(error); toast.error(`Lỗi gửi Email (EmailJS)`); 
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
    setLoading(true); let count = 0;
    try {
      for (const [id, actualQty] of Object.entries(actualStockInput)) { 
        const p = products.find(x => String(x.id) === String(id)); 
        if(p && p.stock !== actualQty) { 
          await supabase.from("products").update({ stock: actualQty }).eq("id", p.id); 
          logAudit("KIỂM KHO", `Cập nhật ${p.name}`, { tu_so: p.stock, thanh_so: actualQty, lech: actualQty - p.stock }); 
          count++; 
        } 
      }
      toast.success(`Đã đồng bộ chênh lệch ${count} sản phẩm!`); 
      setShowInventoryModal(false); setActualStockInput({}); fetchProducts(); 
    } catch(err) { 
      toast.error("Lỗi đồng bộ kho!"); 
    } finally { 
      setLoading(false); 
    }
  };
  
  const requestSort = (key: string) => { 
    if (sortConfig && sortConfig.key === key) { 
      if (sortConfig.direction === 'asc') setSortConfig({ key, direction: 'desc' }); 
      else setSortConfig(null) 
    } else { 
      setSortConfig({ key, direction: 'asc' }) 
    } 
  };
  
  const toggleDateGroup = (dateStr: string) => setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));

  const handleBarcodeSubmitAction = (e: React.KeyboardEvent<HTMLInputElement>) => { 
    document.getElementById('search-barcode')?.focus(); 
    if (e.key === 'Enter') { 
      e.preventDefault(); 
      const p = findProductByCode(barcodeInput); 
      if (p) {
        handleSelectSuggest(p); 
      } else { 
        const matchedPhone = Object.keys(customers || {}).find(phone => phone === barcodeInput.trim() || customers[phone]?.cardCode === barcodeInput.trim()); 
        if (matchedPhone) { 
          playSound('success'); setCustomerInput(customers[matchedPhone]?.cardCode || matchedPhone); 
          setCustPhone(matchedPhone); setCustName(customers[matchedPhone]?.name); setBarcodeInput("");
        } else { 
          playSound('error'); toast.error("Mã không hợp lệ!"); 
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
    
    const price = getActualPrice(itemToCart); const repName = cleanName(itemToCart.name);
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
    setBarcodeInput(""); setShowSuggestions(false); setTimeout(() => setScanMessage(null), 2000);
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
      let num = parseInt(val); if (isNaN(num) || num < 0) return prev; 
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
          return { ...i, qty: 1, total: Math.round(1 * price * (1 + VAT_RATE)) } 
        } 
        return i 
      })) 
    } 
  };
  
  const removeFromCart = (productId: any) => { setCart(cart.filter(item => item.product.id !== productId)) };
  const clearCart = () => { if (window.confirm("Hủy toàn bộ?")) { resetCheckout(); } };

  // ===============================================
  // 🔥 RENDER GIAO DIỆN IN (ĐÃ NÂNG CẤP CHUẨN ERP)
  // ===============================================
  const renderPrintArea = () => (
    <>
      {/* --- IN HÓA ĐƠN MÁY POS (Bill 80mm) --- */}
      {lastOrder && printMode === 'receipt' && (
        <div className="print-only">
          <div className="print-receipt-container">
            <div style={{ textAlign: "center", marginBottom: "8px" }}><h2 style={{ margin: 0, fontSize: "20px", fontWeight: 900 }}>HẢI LÊ MART</h2><div style={{ fontSize: "11px" }}>Tòa Nhà ATS, 252 Hoàng Quốc Việt, HN</div></div>
            <div style={{ borderBottom: "1px dashed #000", marginBottom: "8px" }}></div>
            <table style={{ width: "100%", fontSize: "11px", marginBottom: "4px", borderCollapse: "collapse" }}><tbody><tr><td style={{ textAlign: "left" }}><b>HĐ:</b> {lastOrder.orderId}</td><td style={{ textAlign: "right" }}><b>Ca:</b> {shift}</td></tr><tr><td style={{ textAlign: "left" }}><b>Ngày:</b> {lastOrder.time}</td><td style={{ textAlign: "right" }}><b>TN:</b> {role}</td></tr></tbody></table>
            <div style={{ borderBottom: "1px dashed #000", marginBottom: "6px" }}></div>
            <div style={{ fontSize: "11px", marginBottom: "8px", lineHeight: "1.5" }}>
              {lastOrder.custPhone ? (
                <><div><b>Khách hàng:</b> {lastOrder.custName || 'Khách VIP'}</div><div><b>SĐT:</b> {lastOrder.custPhone}</div>{customers[lastOrder.custPhone]?.email && <div><b>Email:</b> {customers[lastOrder.custPhone].email}</div>}{customers[lastOrder.custPhone]?.address && <div><b>Địa chỉ:</b> {customers[lastOrder.custPhone].address}</div>}</>
              ) : (<div><b>Khách hàng:</b> Khách lẻ</div>)}
            </div>
            <div style={{ borderBottom: "1px dashed #000", marginBottom: "8px" }}></div>
            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
              <tbody>
                {lastOrder.cart.map((i: any, x: number) => {
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

      {/* --- IN HÓA ĐƠN BÁN HÀNG A4 --- */}
      {printMode === 'invoice_a4' && lastOrder && (
        <div className="print-a4-container">
          <div style={{ width: "100%", fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #000", paddingBottom: "10px", marginBottom: "20px" }}><div><h1 style={{ margin: 0, color: "#dc2626", fontSize: "28px" }}>HẢI LÊ MART</h1><p style={{ margin: "5px 0", fontSize: "14px" }}>Địa chỉ: Tòa Nhà ATS, 252 Hoàng Quốc Việt, Cầu Giấy, HN</p></div><div style={{ textAlign: "right" }}><h2 style={{ margin: 0, fontSize: "24px" }}>HÓA ĐƠN BÁN HÀNG</h2><p style={{ margin: "5px 0", fontSize: "14px" }}>Số: <b>{lastOrder.orderId}</b></p><p style={{ margin: "5px 0", fontSize: "14px" }}>Ngày: {lastOrder.time}</p></div></div>
            <div style={{ marginBottom: "20px", fontSize: "15px", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <div><p style={{ margin: "5px 0" }}><b>Khách hàng:</b> {lastOrder.custName || "Khách lẻ"}</p>{lastOrder.custPhone && <p style={{ margin: "5px 0" }}><b>SĐT:</b> {lastOrder.custPhone}</p>}{lastOrder.custPhone && customers[lastOrder.custPhone]?.email && <p style={{ margin: "5px 0" }}><b>Email:</b> {customers[lastOrder.custPhone].email}</p>}{lastOrder.custPhone && customers[lastOrder.custPhone]?.address && <p style={{ margin: "5px 0" }}><b>Địa chỉ:</b> {customers[lastOrder.custPhone].address}</p>}</div>
              <div style={{ textAlign: "right" }}><p style={{ margin: "5px 0" }}><b>Phương thức thanh toán:</b> {lastOrder.paymentMethod}</p></div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
              <thead><tr style={{ background: "#f1f5f9" }}><th style={{ borderBottom: "2px solid #cbd5e1", padding: "10px", textAlign: "center" }}>STT</th><th style={{ borderBottom: "2px solid #cbd5e1", padding: "10px", textAlign: "left" }}>Tên hàng hóa</th><th style={{ borderBottom: "2px solid #cbd5e1", padding: "10px", textAlign: "center" }}>SL</th><th style={{ borderBottom: "2px solid #cbd5e1", padding: "10px", textAlign: "right" }}>Đơn giá</th><th style={{ borderBottom: "2px solid #cbd5e1", padding: "10px", textAlign: "right" }}>Thành tiền</th></tr></thead>
              <tbody>{lastOrder.cart.map((item: any, index: number) => { const p = Math.round(getActualPrice(item.product)); const t = Math.round(item.qty * p * (1 + VAT_RATE)); return (<tr key={index}><td style={{ borderBottom: "1px solid #e2e8f0", padding: "12px 10px", textAlign: "center" }}>{index + 1}</td><td style={{ borderBottom: "1px solid #e2e8f0", padding: "12px 10px" }}>{cleanName(item.product.name)}</td><td style={{ borderBottom: "1px solid #e2e8f0", padding: "12px 10px", textAlign: "center" }}>{item.qty}</td><td style={{ borderBottom: "1px solid #e2e8f0", padding: "12px 10px", textAlign: "right" }}>{p.toLocaleString()}đ</td><td style={{ borderBottom: "1px solid #e2e8f0", padding: "12px 10px", textAlign: "right" }}>{t.toLocaleString()}đ</td></tr>); })}</tbody>
            </table>
            {/* Phần Tính Tiền (Nằm bên phải) */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px", fontSize: "15px" }}>
              <div style={{ textAlign: "right", width: "50%" }}>
                <p style={{ margin: "5px 0" }}>Cộng tiền hàng: {Math.round(lastOrder.subTotal).toLocaleString()}đ</p>
                <p style={{ margin: "5px 0" }}>Thuế GTGT (10%): {Math.round(lastOrder.vatTotal).toLocaleString()}đ</p>
                {lastOrder.discount > 0 && <p style={{ margin: "5px 0" }}>Giảm giá/Ví: -{Math.round(lastOrder.discount).toLocaleString()}đ</p>}
                <h3 style={{ borderTop: "2px solid #000", paddingTop: "10px", margin: "10px 0" }}>TỔNG CỘNG: {Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</h3>
                {lastOrder.paymentMethod === 'TIỀN MẶT' && (<div style={{ fontSize: "14px", marginTop: "10px" }}><div style={{ display: "flex", justifyContent: "space-between" }}><span>Khách đưa:</span> <span>{Math.round(lastOrder.customerGiven || lastOrder.finalTotal).toLocaleString()}đ</span></div><div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}><span>Thối lại:</span> <span>{Math.round(Math.max(0, (lastOrder.customerGiven || lastOrder.finalTotal) - lastOrder.finalTotal)).toLocaleString()}đ</span></div></div>)}
                {lastOrder.paymentMethod === 'KẾT HỢP' && (<div style={{ fontSize: "14px", marginTop: "10px" }}><div style={{ display: "flex", justifyContent: "space-between" }}><span>Thanh toán Tiền mặt:</span> <span>{Math.round(lastOrder.customerGiven || 0).toLocaleString()}đ</span></div><div style={{ display: "flex", justifyContent: "space-between" }}><span>Thanh toán Chuyển khoản:</span> <span>{Math.round(lastOrder.finalTotal - (lastOrder.customerGiven || 0)).toLocaleString()}đ</span></div></div>)}
              </div>
            </div>
            {/* Phần Chữ Ký (Nằm thẳng hàng nhau ở dưới cùng) */}
            <div style={{ display: "flex", justifyContent: "space-between", textAlign: "center", marginTop: "50px", fontSize: "15px" }}>
              <div style={{ width: "40%" }}>
                <strong style={{ display: "block", marginBottom: "4px", fontSize: "16px" }}>Khách hàng</strong>
                <span style={{ fontSize: "13px", fontStyle: "italic", color: "#64748b", display: "block" }}>(Ký, ghi rõ họ tên)</span>
                {/* Đường kẻ mờ để ký tên */}
                <div style={{ marginTop: "90px", width: "60%", marginInline: "auto", borderTop: "1px dashed #94a3b8" }}></div>
              </div>
              <div style={{ width: "40%" }}>
                <strong style={{ display: "block", marginBottom: "4px", fontSize: "16px" }}>Người bán hàng</strong>
                <span style={{ fontSize: "13px", fontStyle: "italic", color: "#64748b", display: "block" }}>(Ký, đóng dấu)</span>
                {/* Đường kẻ mờ để ký tên */}
                <div style={{ marginTop: "90px", width: "60%", marginInline: "auto", borderTop: "1px dashed #94a3b8" }}></div>
              </div>
            </div>
            
            
          </div>
        </div>
      )}
      
      {/* --- IN TEM MÃ VẠCH --- */}
      {printMode === 'barcode' && printBarcodeProduct && (
        <div className="print-a4-container" style={{ padding: "20px", background: "#fff" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)", /* Lệnh này ép tem xếp thành 3 cột */
            gap: "15px", /* Khoảng cách giữa các tem */
            alignItems: "start"
          }}>
            {Array.from({ length: barcodeCount }).map((_, i) => (
              <div key={i} style={{
                border: "1px dashed #94a3b8", /* Viền cắt tem */
                padding: "10px",
                textAlign: "center",
                borderRadius: "4px",
                pageBreakInside: "avoid" /* Ngăn tem bị cắt làm đôi khi sang trang giấy mới */
              }}>
                <div style={{ fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%", marginBottom: "5px" }}>
                  {cleanName(printBarcodeProduct.name)}
                </div>
                
                <img 
                  src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(printBarcodeProduct.product_code)}&scale=2&height=10&includetext=false`} 
                  onError={(e) => { e.currentTarget.src = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(printBarcodeProduct.product_code)}&code=Code128&translate-esc=on`; }} 
                  style={{ width: "100%", maxWidth: "160px", height: "40px", display: "block", margin: "0 auto" }} 
                  alt={printBarcodeProduct.product_code} 
                />
                
                <div style={{ fontSize: "11px", fontFamily: "monospace", letterSpacing: "1px", color: "#333", marginTop: "5px" }}>
                  {printBarcodeProduct.product_code}
                </div>
                
                <div style={{ fontSize: "16px", fontWeight: "900", color: "#000", marginTop: "2px" }}>
                  {getActualPrice(printBarcodeProduct).toLocaleString()}đ
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* --- IN THẺ KHÁCH HÀNG --- */}
      {printMode === 'customer_card' && printCustomer && (
        <div className="print-only">
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

      {/* ========================================================================= */}
      {/* 1. MẪU IN PHIẾU ĐẶT HÀNG (PO ORDER) CHUYÊN NGHIỆP                         */}
      {/* ========================================================================= */}
      {printMode === 'po_order' && printPOData && (
        <div className="print-a4-container">
          <div style={{ padding: "40px", fontFamily: "'Inter', sans-serif", color: "#0f172a", maxWidth: "850px", margin: "0 auto", background: "#fff" }}>
            
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #e2e8f0", paddingBottom: "20px", marginBottom: "30px" }}>
              <div>
                <h1 style={{ margin: "0 0 8px 0", fontSize: "26px", fontWeight: "900", color: "#2563eb", letterSpacing: "-0.5px" }}>HẢI LÊ MART</h1>
                <p style={{ margin: "4px 0", fontSize: "13px", color: "#475569" }}><strong>Địa chỉ:</strong> Tòa Nhà ATS, 252 Hoàng Quốc Việt, Cầu Giấy, HN</p>
                <p style={{ margin: "4px 0", fontSize: "13px", color: "#475569" }}><strong>Điện thoại:</strong> 0902.613.899 - <strong>Email:</strong> admin@hailemart.com</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <h2 style={{ margin: "0 0 4px 0", fontSize: "24px", color: "#0f172a", fontWeight: "800" }}>PHIẾU ĐẶT HÀNG</h2>
                <p style={{ margin: "0 0 12px 0", fontSize: "13px", fontStyle: "italic", color: "#64748b" }}>(Purchase Order)</p>
                <div style={{ display: "inline-block", background: "#f1f5f9", padding: "8px 12px", borderRadius: "6px", textAlign: "left" }}>
                  <p style={{ margin: "0 0 4px 0", fontSize: "13px" }}><strong>Số PO:</strong> <span style={{ color: "#2563eb", fontWeight: "bold" }}>{printPOData.po_code}</span></p>
                  <p style={{ margin: 0, fontSize: "13px" }}><strong>Ngày đặt:</strong> {new Date(printPOData.created_at).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
            </div>
            
            {/* Thông tin 2 bên */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px", gap: "20px" }}>
              <div style={{ flex: "1", padding: "16px", borderLeft: "4px solid #3b82f6", background: "#f8fafc", borderRadius: "0 8px 8px 0" }}>
                <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#64748b", textTransform: "uppercase", fontWeight: "bold" }}>THÔNG TIN NHÀ CUNG CẤP</p>
                <p style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: "bold" }}>{printPOData.supplier?.name}</p>
                <p style={{ margin: "0 0 4px 0", fontSize: "14px" }}><strong>SĐT:</strong> {printPOData.supplier?.phone}</p>
                <p style={{ margin: "0", fontSize: "14px" }}><strong>Địa chỉ:</strong> {printPOData.supplier?.address || "---"}</p>
              </div>
              <div style={{ flex: "1", padding: "16px", background: "#f1f5f9", borderRadius: "8px" }}>
                <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#64748b", textTransform: "uppercase", fontWeight: "bold" }}>GHI CHÚ ĐƠN HÀNG</p>
                <p style={{ margin: "0", fontSize: "14px", fontStyle: "italic" }}>{printPOData.note || "Không có ghi chú đặc biệt."}</p>
              </div>
            </div>
            
            {/* Bảng Sản phẩm */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "center", width: "5%", color: "#475569" }}>STT</th>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "left", width: "45%", color: "#475569" }}>Tên Sản Phẩm</th>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "center", width: "15%", color: "#475569" }}>SL Đặt</th>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "right", width: "15%", color: "#475569" }}>Đơn Giá</th>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "right", width: "20%", color: "#475569" }}>Thành Tiền</th>
                </tr>
              </thead>
              <tbody>
                {printPOData.items.map((item: any, index: number) => (
                  <tr key={index}>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", textAlign: "center", color: "#64748b" }}>{index + 1}</td>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", fontWeight: "500" }}>{cleanName(item.product.name)}</td>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", textAlign: "center", fontWeight: "bold" }}>{item.qty}</td>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", textAlign: "right" }}>{(item.importPrice||0).toLocaleString()}</td>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", textAlign: "right", fontWeight: "bold" }}>{(item.qty * (item.importPrice||0)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Tổng cộng */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: "350px", fontSize: "15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #e2e8f0", marginBottom: "10px" }}>
                  <span style={{ color: "#64748b" }}>Tổng giá trị PO:</span>
                  <strong style={{ fontSize: "16px" }}>{printPOData.total_amount.toLocaleString()} đ</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #e2e8f0", marginBottom: "10px" }}>
                  <span style={{ color: "#64748b" }}>Đã trả trước:</span>
                  <strong style={{ color: "#10b981" }}>{(printPOData.paid_amount || 0).toLocaleString()} đ</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px", borderRadius: "8px" }}>
                  <strong style={{ fontSize: "14px", color: "#0f172a" }}>CÔNG NỢ DỰ KIẾN:</strong>
                  <strong style={{ fontSize: "20px", color: "#ef4444" }}>{Math.max(0, printPOData.total_amount - (printPOData.paid_amount || 0)).toLocaleString()} đ</strong>
                </div>
              </div>
            </div>
            
            {/* Chữ ký */}
            <div style={{ display: "flex", justifyContent: "space-between", textAlign: "center", marginTop: "60px", fontSize: "14px" }}>
              <div style={{ width: "45%" }}>
                <strong style={{ display: "block", marginBottom: "4px" }}>Đại Diện Nhà Cung Cấp</strong>
                <span style={{ fontSize: "12px", fontStyle: "italic", color: "#64748b" }}>(Ký và ghi rõ họ tên)</span>
                <div style={{ marginTop: "90px", width: "60%", marginInline: "auto", borderTop: "1px solid #94a3b8" }}></div>
              </div>
              <div style={{ width: "45%" }}>
                <strong style={{ display: "block", marginBottom: "4px" }}>Người Lập Đơn / Cửa Hàng</strong>
                <span style={{ fontSize: "12px", fontStyle: "italic", color: "#64748b" }}>(Ký và ghi rõ họ tên)</span>
                <div style={{ marginTop: "90px", width: "60%", marginInline: "auto", borderTop: "1px solid #94a3b8" }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MẪU IN PHIẾU NHẬP KHO (RECEIPT) CHUYÊN NGHIỆP                          */}
      {/* ========================================================================= */}
      {printMode === 'po_receipt' && printPOData && (
        <div className="print-a4-container">
          <div style={{ padding: "40px", fontFamily: "'Inter', sans-serif", color: "#0f172a", maxWidth: "850px", margin: "0 auto", background: "#fff" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #e2e8f0", paddingBottom: "20px", marginBottom: "30px" }}>
              <div>
                <h1 style={{ margin: "0 0 8px 0", fontSize: "26px", fontWeight: "900", color: "#10b981", letterSpacing: "-0.5px" }}>HẢI LÊ MART</h1>
                <p style={{ margin: "4px 0", fontSize: "13px", color: "#475569", fontWeight: "bold" }}>BỘ PHẬN KHO BÃI & CUNG ỨNG</p>
                <p style={{ margin: "4px 0", fontSize: "13px", color: "#475569" }}>252 Hoàng Quốc Việt, Cầu Giấy, HN</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <h2 style={{ margin: "0 0 4px 0", fontSize: "24px", color: "#0f172a", fontWeight: "800" }}>PHIẾU NHẬP KHO</h2>
                <p style={{ margin: "0 0 12px 0", fontSize: "13px", fontStyle: "italic", color: "#64748b" }}>(Goods Receipt Note)</p>
                <div style={{ display: "inline-block", background: "#f0fdf4", padding: "8px 12px", borderRadius: "6px", textAlign: "left", border: "1px solid #bbf7d0" }}>
                  <p style={{ margin: "0 0 4px 0", fontSize: "13px" }}><strong>Tham chiếu PO:</strong> <span style={{ color: "#059669", fontWeight: "bold" }}>{printPOData.po_code}</span></p>
                  <p style={{ margin: 0, fontSize: "13px" }}><strong>Ngày nhập:</strong> {new Date().toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px", gap: "20px" }}>
              <div style={{ flex: "1", padding: "16px", borderLeft: "4px solid #10b981", background: "#f8fafc", borderRadius: "0 8px 8px 0" }}>
                <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#64748b", textTransform: "uppercase", fontWeight: "bold" }}>GIAO TỪ NHÀ CUNG CẤP</p>
                <p style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: "bold" }}>{printPOData.supplier?.name}</p>
                <p style={{ margin: "0 0 4px 0", fontSize: "14px" }}><strong>SĐT:</strong> {printPOData.supplier?.phone} | <strong>Địa chỉ:</strong> {printPOData.supplier?.address || "---"}</p>
              </div>
              <div style={{ flex: "1", padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
                <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#64748b", textTransform: "uppercase", fontWeight: "bold" }}>TRẠNG THÁI KIỂM KÊ</p>
                <p style={{ margin: "0", fontSize: "14px", color: "#059669", fontWeight: "500" }}>✓ Đã kiểm tra số lượng và chất lượng.</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#059669", fontWeight: "500" }}>✓ Đã đối soát và nhập kho hệ thống.</p>
              </div>
            </div>
            
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "center", width: "5%", color: "#475569" }}>STT</th>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "left", width: "45%", color: "#475569" }}>Tên Sản Phẩm</th>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "center", width: "15%", color: "#475569" }}>SL Nhận</th>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "right", width: "15%", color: "#475569" }}>Đơn Giá</th>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "right", width: "20%", color: "#475569" }}>Thành Tiền</th>
                </tr>
              </thead>
              <tbody>
                {printPOData.items.filter((i:any) => i.qty - (i.damagedQty || 0) > 0).map((item: any, index: number) => {
                  const actualQty = item.qty - (item.damagedQty || 0);
                  return (
                  <tr key={index}>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", textAlign: "center", color: "#64748b" }}>{index + 1}</td>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", fontWeight: "500" }}>{cleanName(item.product.name)}</td>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", textAlign: "center", fontWeight: "bold", color: "#10b981", fontSize: "15px" }}>{actualQty}</td>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", textAlign: "right" }}>{(item.importPrice||0).toLocaleString()}</td>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", textAlign: "right", fontWeight: "bold" }}>{(actualQty * (item.importPrice||0)).toLocaleString()}</td>
                  </tr>
                )})}
              </tbody>
            </table>
            
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "40px" }}>
               <div style={{ background: "#f8fafc", padding: "15px 25px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "15px", color: "#475569", marginRight: "15px" }}>TỔNG GIÁ TRỊ NHẬP KHO THỰC TẾ:</span>
                  <strong style={{ fontSize: "22px", color: "#0f172a" }}>{printPOData.items.reduce((sum:number, item:any) => sum + ((item.qty - (item.damagedQty || 0)) * (item.importPrice||0)), 0).toLocaleString()} đ</strong>
               </div>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", textAlign: "center", marginTop: "40px", fontSize: "14px" }}>
              <div style={{ width: "30%" }}>
                <strong style={{ display: "block", marginBottom: "4px" }}>Thủ Kho Nhận Hàng</strong>
                <span style={{ fontSize: "12px", fontStyle: "italic", color: "#64748b" }}>(Ký và ghi rõ họ tên)</span>
                <div style={{ marginTop: "90px", width: "70%", marginInline: "auto", borderTop: "1px solid #94a3b8" }}></div>
              </div>
              <div style={{ width: "30%" }}>
                <strong style={{ display: "block", marginBottom: "4px" }}>Người Giao Hàng</strong>
                <span style={{ fontSize: "12px", fontStyle: "italic", color: "#64748b" }}>(Ký và ghi rõ họ tên)</span>
                <div style={{ marginTop: "90px", width: "70%", marginInline: "auto", borderTop: "1px solid #94a3b8" }}></div>
              </div>
              <div style={{ width: "30%" }}>
                <strong style={{ display: "block", marginBottom: "4px" }}>Quản Lý Cửa Hàng</strong>
                <span style={{ fontSize: "12px", fontStyle: "italic", color: "#64748b" }}>(Ký và ghi rõ họ tên)</span>
                <div style={{ marginTop: "90px", width: "70%", marginInline: "auto", borderTop: "1px solid #94a3b8" }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MẪU IN PHIẾU XUẤT TRẢ HÀNG LỖI (RETURN) CHUYÊN NGHIỆP                    */}
      {/* ========================================================================= */}
      {printMode === 'po_return' && printPOData && (
        <div className="print-a4-container">
          <div style={{ padding: "40px", fontFamily: "'Inter', sans-serif", color: "#0f172a", maxWidth: "850px", margin: "0 auto", background: "#fff" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #e2e8f0", paddingBottom: "20px", marginBottom: "30px" }}>
              <div>
                <h1 style={{ margin: "0 0 8px 0", fontSize: "26px", fontWeight: "900", color: "#ef4444", letterSpacing: "-0.5px" }}>HẢI LÊ MART</h1>
                <p style={{ margin: "4px 0", fontSize: "13px", color: "#475569", fontWeight: "bold" }}>BỘ PHẬN KIỂM KÊ & ĐỐI SOÁT</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <h2 style={{ margin: "0 0 4px 0", fontSize: "24px", color: "#ef4444", fontWeight: "800" }}>PHIẾU XUẤT TRẢ HÀNG LỖI</h2>
                <p style={{ margin: "0 0 12px 0", fontSize: "13px", fontStyle: "italic", color: "#64748b" }}>(Return to Vendor)</p>
                <div style={{ display: "inline-block", background: "#fef2f2", padding: "8px 12px", borderRadius: "6px", textAlign: "left", border: "1px solid #fecaca" }}>
                  <p style={{ margin: "0 0 4px 0", fontSize: "13px" }}><strong>Tham chiếu PO:</strong> <span style={{ color: "#b91c1c", fontWeight: "bold" }}>{printPOData.po_code}</span></p>
                  <p style={{ margin: 0, fontSize: "13px" }}><strong>Ngày xuất trả:</strong> {new Date().toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
            </div>
            
            <div style={{ marginBottom: "30px", fontSize: "14px", lineHeight: "1.6", background: "#fff1f2", padding: "16px", borderLeft: "4px solid #ef4444", borderRadius: "0 8px 8px 0" }}>
              <p style={{ margin: "0 0 8px 0", color: "#991b1b", fontSize: "13px", textTransform: "uppercase", fontWeight: "bold" }}>HOÀN TRẢ LẠI CHO NHÀ CUNG CẤP</p>
              <p style={{ margin: "0 0 4px 0", color: "#7f1d1d", fontSize: "15px", fontWeight: "bold" }}>{printPOData.supplier?.name}</p>
              <p style={{ margin: "0 0 8px 0", color: "#7f1d1d" }}><strong>SĐT:</strong> {printPOData.supplier?.phone} | <strong>Địa chỉ:</strong> {printPOData.supplier?.address || "---"}</p>
              <p style={{ margin: "0", color: "#b91c1c", fontStyle: "italic" }}><strong>Lý do trả hàng:</strong> Phát hiện hàng hóa bị lỗi/hư hỏng, không đạt tiêu chuẩn chất lượng khi nhân viên kho tiến hành kiểm tra đối soát.</p>
            </div>
            
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "center", width: "5%", color: "#475569" }}>STT</th>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "left", width: "45%", color: "#475569" }}>Tên Sản Phẩm Bị Lỗi</th>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "center", width: "15%", color: "#475569" }}>SL Trả</th>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "right", width: "15%", color: "#475569" }}>Đơn Giá</th>
                  <th style={{ borderBottom: "2px solid #cbd5e1", padding: "12px 10px", textAlign: "right", width: "20%", color: "#475569" }}>Thành Tiền</th>
                </tr>
              </thead>
              <tbody>
                {printPOData.items.filter((i:any) => (i.damagedQty || 0) > 0).map((item: any, index: number) => (
                  <tr key={index}>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", textAlign: "center", color: "#64748b" }}>{index + 1}</td>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", fontWeight: "500", color: "#7f1d1d" }}>{cleanName(item.product.name)}</td>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", textAlign: "center", color: "#ef4444", fontWeight: "bold", fontSize: "15px" }}>{item.damagedQty}</td>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", textAlign: "right" }}>{(item.importPrice||0).toLocaleString()}</td>
                    <td style={{ borderBottom: "1px solid #e2e8f0", padding: "14px 10px", textAlign: "right", fontWeight: "bold" }}>{(item.damagedQty * (item.importPrice||0)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
               <div style={{ fontSize: "13px", color: "#64748b", fontStyle: "italic", width: "50%" }}>
                 * Lưu ý: Số tiền hoàn trả này sẽ được hệ thống tự động giảm trừ trực tiếp vào công nợ của hóa đơn mua hàng hiện tại.
               </div>
               <div style={{ background: "#fff1f2", padding: "15px 25px", borderRadius: "8px", border: "1px solid #fecaca" }}>
                  <span style={{ fontSize: "15px", color: "#991b1b", marginRight: "15px", fontWeight: "bold" }}>TỔNG GIÁ TRỊ HOÀN TRẢ:</span>
                  <strong style={{ fontSize: "22px", color: "#ef4444" }}>{printPOData.items.reduce((sum:number, item:any) => sum + ((item.damagedQty || 0) * (item.importPrice||0)), 0).toLocaleString()} đ</strong>
               </div>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", textAlign: "center", marginTop: "60px", fontSize: "14px" }}>
              <div style={{ width: "45%" }}>
                <strong style={{ display: "block", marginBottom: "4px" }}>Người Giao Hàng (Nhận lại hàng lỗi)</strong>
                <span style={{ fontSize: "12px", fontStyle: "italic", color: "#64748b" }}>(Ký và ghi rõ họ tên)</span>
                <div style={{ marginTop: "90px", width: "60%", marginInline: "auto", borderTop: "1px solid #94a3b8" }}></div>
              </div>
              <div style={{ width: "45%" }}>
                <strong style={{ display: "block", marginBottom: "4px" }}>Đại Diện Cửa Hàng (Xuất trả)</strong>
                <span style={{ fontSize: "12px", fontStyle: "italic", color: "#64748b" }}>(Ký và ghi rõ họ tên)</span>
                <div style={{ marginTop: "90px", width: "60%", marginInline: "auto", borderTop: "1px solid #94a3b8" }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderModals = () => {
    return (
      <>
        <ExpenseModal showExpenseModal={showExpenseModal} setShowExpenseModal={setShowExpenseModal} expName={expName} setExpName={setExpName} expAmount={expAmount} setExpAmount={setExpAmount} expenses={expenses} addExpense={addExpense} deleteExpense={deleteExpense} />
        
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
                        {suppliers.length === 0 && <tr><td colSpan={5} style={{textAlign:'center', padding:'30px', color:'#94a3b8'}}>Chưa có dữ liệu nhà cung cấp</td></tr>}
                        {suppliers.map(s => (
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

        {/* MODAL SETTINGS XỊN XÒ */}
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

        {/* MODAL KHÁCH HÀNG VIP */}
        {showCustomerModal && (
          <div className="custom-modal-overlay">
            <div className="custom-modal-box" style={{ maxWidth: '900px', height: '80vh' }}>
              <div className="custom-modal-header"><h2 className="custom-modal-title">💎 QUẢN LÝ KHÁCH HÀNG VIP</h2><button className="custom-modal-close" onClick={() => setShowCustomerModal(false)}>&times;</button></div>
              <div className="custom-modal-body" style={{ background: '#f8fafc', padding: 0 }}>
                <table className="modern-table">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}><tr><th>Tên KH</th><th>SĐT</th><th>Ví / Nợ</th><th style={{textAlign:"center", width: "35%"}}>Hành động</th></tr></thead>
                  <tbody>
                    {Object.entries(customers || {}).length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>Chưa có Khách hàng VIP</td></tr>}
                    {Object.entries(customers || {}).map(([phone, c]) => (
                      <tr key={phone}>
                        <td style={{fontWeight:'bold', color:'#0f172a'}}>{c?.name || 'Khách Vô Danh'} <br/><span style={{fontSize:'12px', color:'#64748b'}}>{getCustomerTier(c?.totalSpent || 0).name}</span></td>
                        <td>{phone}</td>
                        <td><span style={{color: '#10b981', fontWeight: "bold"}}>Ví: {(c?.wallet||0).toLocaleString()}đ</span><br/><span style={{color: '#ef4444', fontWeight: "bold"}}>Nợ: {(c?.debt||0).toLocaleString()}đ</span></td>
                        <td style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                           <button onClick={()=>handleEditPhone(phone)} style={{ flex: "1 1 45%", padding: "8px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                             ✏️ Sửa
                           </button>
                           <button onClick={()=>printCustomerCard(phone)} style={{ flex: "1 1 45%", padding: "8px", background: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", boxShadow: "0 2px 4px rgba(16,185,129,0.2)" }}>
                             🖨️ In Thẻ
                           </button>
                           <button onClick={()=>sendCardEmail(phone)} style={{ flex: "1 1 45%", padding: "8px", background: "#f59e0b", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", boxShadow: "0 2px 4px rgba(245,158,11,0.2)" }}>
                             ✉️ Email
                           </button>
                           <button onClick={()=>shareToZalo(phone)} style={{ flex: "1 1 45%", padding: "8px", background: "#06b6d4", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", boxShadow: "0 2px 4px rgba(6,182,212,0.2)" }}>
                             💬 Zalo
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL GỬI EMAIL MARKETING */}
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
                    const targetCustomers = Object.keys(customers || {}).filter(phone => { 
                      const c = customers[phone]; 
                      if (!c || !c.email) return false; 
                      if (marketingTier === "Tất cả") return true; 
                      return getCustomerTier(c.totalSpent || 0).name.includes(marketingTier);
                    });
                    if (targetCustomers.length === 0) { setLoading(false); return toast.error("Không có khách hàng nào phù hợp!"); }
                    
                    let successCount = 0;
                    for (const phone of targetCustomers) { 
                      const c = customers[phone]; 
                      const htmlContent = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; text-align: center;"><h1 style="margin: 0; font-size: 24px;">HẢI LÊ MART</h1><p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">THÔNG BÁO ƯU ĐÃI ĐẶC QUYỀN</p></div><div style="padding: 30px 20px; background: #ffffff;"><h2 style="margin: 0 0 15px 0; color: #0f172a; font-size: 20px;">Chào ${c.name},</h2><div style="color: #475569; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${marketingMsg}</div></div><div style="background: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;"><p style="margin: 0; font-size: 12px; color: #94a3b8;">Hải Lê Mart © 2026 - Hotline: 0902 613 899</p></div></div>`;
                      try { await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_VIP_ID, { to_email: c.email, subject: "💌 Ưu Đãi Đặc Quyền Từ Hải Lê Mart", html_message: htmlContent, order_id: "", time: "", items_list: "", total_amount: "", payment_method: "", change_amount: "", barcode_url: "" }); successCount++; } catch (error: any) { console.error("EmailJS Error", error); } 
                    }
                    logAudit("GỬI MAIL MKT", `Gửi ${successCount} mail cho tập ${marketingTier}`); setLoading(false); setShowMarketingModal(false); toast.success(`Đã gửi ${successCount} mail!`)
                  }} disabled={loading}>{loading ? "ĐANG GỬI CHIẾN DỊCH..." : "🚀 BẮT ĐẦU GỬI EMAIL"}</button>
                  <p style={{ fontSize: "12px", color: "#64748b", textAlign: "center", marginTop: "15px" }}>* Gửi tự động đến hộp thư của Khách hàng qua EmailJS.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL PHIẾU NHẬP PO BIÊN TẬP HOÀN CHỈNH */}
        {showPOModal && (
          <div className="custom-modal-overlay">
            <div className="custom-modal-box" style={{ maxWidth: '1000px', height: '85vh' }}>
              <div className="custom-modal-header">
                <h2 className="custom-modal-title">📦 QUẢN LÝ PHIẾU NHẬP (PO)</h2>
                <button className="custom-modal-close" onClick={() => setShowPOModal(false)}>&times;</button>
              </div>
              <div style={{ display: "flex", gap: "10px", padding: "10px 15px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                <button onClick={() => setPoTab('NEW')} className={`tab-btn ${poTab === 'NEW' ? 'active' : ''}`} style={{ padding: "10px 20px", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer", background: poTab === 'NEW' ? "#3b82f6" : "#e2e8f0", color: poTab === 'NEW' ? "white" : "#64748b" }}>+ TẠO PO MỚI (CHỜ NHẬN)</button>
                <button onClick={() => setPoTab('RECEIVE')} className={`tab-btn ${poTab === 'RECEIVE' ? 'active' : ''}`} style={{ padding: "10px 20px", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer", background: poTab === 'RECEIVE' ? "#3b82f6" : "#e2e8f0", color: poTab === 'RECEIVE' ? "white" : "#64748b" }}>📥 TÌM & NHẬN HÀNG</button>
              </div>
              <div className="custom-modal-body" style={{ display: "grid", gridTemplateColumns: "3.5fr 6.5fr", gap: "15px", background: "#f1f5f9", padding: "15px" }}>
                
                {poTab === 'NEW' && (
                  <>
                    <div style={{ background: "#fff", padding: "15px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", height: "fit-content" }}>
                      <h3 style={{ margin: "0 0 15px 0", fontSize: "15px", color: "#1e293b", borderBottom: "1px dashed #cbd5e1", paddingBottom: "10px" }}>1. Chọn Nhà Cung Cấp</h3>
                      <select className="custom-input" value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)} style={{ marginBottom: "24px" }}>
                        <option value="">-- Click để chọn NCC --</option>
                        {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name} - {s.phone}</option>)}
                      </select>
                      
                      <h3 style={{ margin: "0 0 15px 0", fontSize: "15px", color: "#1e293b", borderBottom: "1px dashed #cbd5e1", paddingBottom: "10px" }}>2. Tìm Sản Phẩm</h3>
                      <input type="text" className="custom-input" placeholder="Nhập tên hoặc mã SP..." value={poSearch} onChange={e => setPoSearch(e.target.value)} />
                      <div style={{ maxHeight: "250px", overflowY: "auto", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", marginTop: "10px" }}>
                        {poSearch.trim() && products.filter(p => cleanName(p.name).toLowerCase().includes(poSearch.toLowerCase()) || String(p.product_code).toLowerCase().includes(poSearch.toLowerCase())).slice(0, 10).map(p => (
                          <div key={p.id} onClick={() => {
                            const exist = poItems.find(i => i.product.id === p.id);
                            if (exist) { setPoItems(poItems.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i)); } else { setPoItems([{ product: p, qty: 1, importPrice: p.import_price || 0 }, ...poItems]); }
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

                    <div style={{ background: "#fff", padding: "15px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", height: "fit-content", minHeight: "100%" }}>
                      <h3 style={{ margin: "0 0 15px 0", fontSize: "15px", color: "#1e293b", borderBottom: "1px dashed #cbd5e1", paddingBottom: "10px" }}>Danh sách Sản Phẩm Sẽ Đặt</h3>
                      <div style={{ flex: 1, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                        <table className="modern-table" style={{ margin: 0 }}>
                          <thead style={{position: 'sticky', top: 0, zIndex: 1}}><tr><th>Sản phẩm</th><th style={{textAlign:"center"}}>Số lượng</th><th style={{textAlign:"right"}}>Giá nhập (đ)</th><th style={{textAlign:"right"}}>Thành tiền</th><th style={{textAlign:'center'}}>Xóa</th></tr></thead>
                          <tbody>
                            {poItems.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>Chưa có sản phẩm nào được chọn</td></tr>}
                            {poItems.map((item, idx) => (
                              <tr key={idx}>
                                <td style={{fontWeight: "600", color: "#0f172a"}}>{cleanName(item.product.name)}</td>
                                <td style={{textAlign:"center"}}><input type="number" className="custom-input" style={{ padding: "6px", width: "70px", textAlign: "center" }} value={item.qty} onChange={e => { const val = parseInt(e.target.value)||1; setPoItems(poItems.map((i, ix) => ix === idx ? { ...i, qty: val } : i)) }} min="1" /></td>
                                <td style={{textAlign:"right"}}><input type="number" className="custom-input" style={{ padding: "6px", width: "110px", textAlign: "right" }} value={item.importPrice} onChange={e => { const val = parseInt(e.target.value)||0; setPoItems(poItems.map((i, ix) => ix === idx ? { ...i, importPrice: val } : i)) }} min="0" /></td>
                                <td style={{ fontWeight: "bold", textAlign: "right", color: "#3b82f6" }}>{(item.qty * item.importPrice).toLocaleString()}</td>
                                <td style={{ textAlign: "center" }}><button onClick={() => setPoItems(poItems.filter((_, ix) => ix !== idx))} style={{ background: "none", color: "#ef4444", border: "none", cursor: "pointer", fontSize: "20px" }}>&times;</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "10px", marginTop: "24px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                          <span style={{ fontSize: "16px", color: "#475569" }}>Tổng giá trị đơn hàng:</span>
                          <b style={{ fontSize: "22px", color: "#0f172a" }}>{poItems.reduce((sum, item) => sum + (item.qty * item.importPrice), 0).toLocaleString()}đ</b>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                          <span style={{ fontSize: "15px", color: "#475569" }}>Đã trả trước cho NCC:</span>
                          <input type="number" className="custom-input" style={{ width: "200px", textAlign: "right", fontWeight: "bold", color: "#10b981", fontSize: "16px" }} value={paidAmount} onChange={e => setPaidAmount(parseInt(e.target.value)||0)} min="0" />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingTop: "15px", borderTop: "1px dashed #cbd5e1" }}>
                          <span style={{ fontSize: "16px", color: "#475569", fontWeight: "bold" }}>Công nợ sẽ ghi nhận:</span>
                          <b style={{ fontSize: "20px", color: "#ef4444" }}>{(poItems.reduce((sum, item) => sum + (item.qty * item.importPrice), 0) - paidAmount).toLocaleString()}đ</b>
                        </div>
                        <button className="gradient-btn" onClick={async () => {
                          if (!selectedSupplierId) return toast.error("Vui lòng chọn Nhà Cung Cấp!");
                          if (poItems.length === 0) return toast.error("Phiếu nhập trống!");
                          const supplier = suppliers.find(s => s.id.toString() === selectedSupplierId);
                          if (!supplier) return;
                          setLoading(true);
                          try {
                            const totalPOAmount = poItems.reduce((sum, item) => sum + (item.qty * item.importPrice), 0);
                            const debtAmount = totalPOAmount - paidAmount; 
                            const poCode = "PO" + Date.now().toString().slice(-6);
                            const newPO = { id: Date.now().toString(), po_code: poCode, supplier: supplier, items: poItems, total_amount: totalPOAmount, paid_amount: paidAmount, debt_amount: debtAmount, status: 'PENDING', note: poNote, created_at: new Date().toISOString() };
                            
                            const updatedPOs = [newPO, ...localPOs]; 
                            setLocalPOs(updatedPOs); 
                            localStorage.setItem("mart_pos", JSON.stringify(updatedPOs));

                            if(navigator.onLine) { await supabase.from('purchase_orders_v2').insert([newPO]); }
                            
                            setPoItems([]);
                            setPoNote("");
                            setSelectedSupplierId("");
                            setPaidAmount(0);
                            toast.success(`Đã lưu Phiếu Đặt Hàng ${poCode}!`);
                            setPoTab('RECEIVE');
                            setSearchPoCode(poCode);
                            setFoundPO(newPO);
                            setReceiveItems(newPO.items.map((i: any) => ({ ...i, damagedQty: 0 })));

                          } catch (err: any) { toast.error("Lỗi: " + err.message); } finally { setLoading(false); }
                        }} disabled={loading} style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)", padding: "16px", fontSize: "16px" }}>
                          {loading ? "ĐANG LƯU..." : "💾 LƯU PHIẾU ĐẶT HÀNG"}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {poTab === 'RECEIVE' && (
                  <>
                    <div style={{ background: "#fff", padding: "15px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", height: "fit-content" }}>
                      <h3 style={{ margin: "0 0 15px 0", fontSize: "15px", color: "#1e293b", borderBottom: "1px dashed #cbd5e1", paddingBottom: "10px" }}>1. Danh sách Phiếu Nhập</h3>
                      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                        <input type="text" className="custom-input" placeholder="Nhập mã PO để lọc..." value={searchPoCode} onChange={e => setSearchPoCode(e.target.value)} />
                        <button className="gradient-btn" onClick={async () => {
                          const code = (searchPoCode || "").trim().toUpperCase(); if (!code) return; setLoading(true);
                          const localMatch = localPOs.find(p => (p.po_code || "").toUpperCase() === code);
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
                        <table className="modern-table" style={{ margin: 0, fontSize: "12px" }}>
                          <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                            <tr><th>Mã PO</th><th>Nhà Cung Cấp</th><th>Trạng thái</th><th style={{textAlign:"center"}}>Thao tác</th></tr>
                          </thead>
                          <tbody>
                            {allPOs.length === 0 && !loading && <tr><td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>Chưa có phiếu nhập nào</td></tr>}
                            {loading && allPOs.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>Đang tải dữ liệu...</td></tr>}
                            {allPOs.filter(p => (p.po_code || "").toLowerCase().includes((searchPoCode || "").toLowerCase())).map(po => (
                              <tr key={po.id} style={{ background: po.id === foundPO?.id ? "#eff6ff" : "transparent" }}>
                                <td style={{ fontWeight: "bold", color: "#3b82f6" }}>{po.po_code}</td>
                                <td style={{maxWidth:'100px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={po.supplier?.name}>{po.supplier?.name}</td>
                                <td>
                                  <span style={{ color: po.status === 'PENDING' ? '#d97706' : '#059669', padding: "4px 8px", background: po.status === 'PENDING' ? '#fef3c7' : '#d1fae5', borderRadius: "4px", fontWeight: "bold", fontSize: "11px" }}>
                                    {po.status === 'PENDING' ? 'Chờ nhận' : 'Hoàn tất'}
                                  </span>
                                </td>
                                <td style={{ textAlign: "center", display: "flex", justifyContent: "center", gap: "6px" }}>
                                  <button onClick={() => { setFoundPO(po); setSearchPoCode(po.po_code); setReceiveItems(po.items.map((i: any) => ({ ...i, damagedQty: 0 }))); }} style={{ padding: "6px 12px", background: "#0f172a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "bold" }}>CHỌN</button>
                                  <button onClick={() => handlePrintPO(po, 'po_order')} style={{ padding: "6px 12px", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "11px", fontWeight: "bold" }}>🖨️ IN PO</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* BỔ SUNG NÚT IN PHIẾU ĐẶT HÀNG NGAY TẠI KHỐI CHI TIẾT PO */}
                      {foundPO && (
                        <div style={{ marginTop: "15px", padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px dashed #cbd5e1" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", gap: "10px" }}>
                                <span style={{ color: "#64748b", fontSize:"13px" }}>Số PO:</span>
                                <span style={{ fontWeight: "bold", color: "#3b82f6", fontSize:"13px" }}>{foundPO.po_code}</span>
                              </div>
                              <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", gap: "10px" }}>
                                <span style={{ color: "#64748b", fontSize:"13px" }}>Nhà Cung Cấp:</span>
                                <span style={{ fontWeight: "bold", color: "#0f172a", fontSize:"13px" }}>{foundPO.supplier?.name}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                                <span style={{ color: "#64748b", fontSize:"13px" }}>Ngày tạo:</span>
                                <span style={{ color: "#0f172a", fontSize:"13px" }}>{new Date(foundPO.created_at).toLocaleString('vi-VN')}</span>
                              </div>
                            </div>
                            <button onClick={() => handlePrintPO(foundPO, 'po_order')} style={{ padding: "10px 15px", background: "#0f172a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
                              🖨️ In Phiếu PO
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ background: "#fff", padding: "15px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", height: "fit-content", minHeight: "100%" }}>
                      <h3 style={{ margin: "0 0 15px 0", fontSize: "15px", color: "#1e293b", borderBottom: "1px dashed #cbd5e1", paddingBottom: "10px" }}>2. Đối Soát Hàng & Nhập Kho</h3>
                      {foundPO ? (
                        foundPO.status === 'COMPLETED' ? (
                           <div style={{ textAlign: "center", padding: "30px", background: "#ecfdf5", borderRadius: "12px", border: "1px solid #a7f3d0", marginTop: "15px" }}>
                             <div style={{ color: "#059669", fontWeight: "bold", fontSize: "16px", marginBottom: "15px" }}>✅ PHIẾU NÀY ĐÃ ĐƯỢC ĐỐI SOÁT & NHẬP KHO XONG!</div>
                             <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
                               <button onClick={() => handlePrintPO(foundPO, 'po_receipt')} style={{ padding: "10px 15px", background: "#10b981", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 2px 4px rgba(16,185,129,0.3)", fontSize: "13px" }}>
                                 🖨️ In Phiếu Nhập
                               </button>
                               {foundPO.items.some((i:any) => i.damagedQty > 0) && (
                                 <button onClick={() => handlePrintPO(foundPO, 'po_return')} style={{ padding: "10px 15px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 2px 4px rgba(239,68,68,0.3)", fontSize: "13px" }}>
                                   🖨️ In Phiếu Trả
                                 </button>
                               )}
                               <button onClick={() => setShowPOModal(false)} style={{ padding: "10px 15px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 2px 4px rgba(59,130,246,0.3)", fontSize: "13px" }}>
                                 📦 Về Kho (Cập nhật HSD/Giá)
                               </button>
                             </div>
                           </div>
                        ) : (
                          <>
                            <div style={{ flex: 1, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                              <table className="modern-table" style={{ margin: 0 }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}><tr><th style={{textAlign:"left"}}>Sản phẩm</th><th style={{textAlign:"center"}}>SL Đã Đặt</th><th style={{textAlign:"center"}}>Hàng Hỏng/Lỗi</th><th style={{textAlign:"center"}}>SL Sẽ Nhập</th></tr></thead>
                                <tbody>
                                  {receiveItems.map((item, idx) => (
                                    <tr key={idx}>
                                      <td style={{fontWeight: "600", color: "#0f172a"}}>{cleanName(item.product.name)}</td>
                                      <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "16px", color: "#3b82f6" }}>{item.qty}</td>
                                      <td style={{ textAlign: "center" }}><input type="number" className="custom-input" style={{ padding: "6px", width: "90px", textAlign: "center", color: "#ef4444", fontWeight: "bold", borderColor: item.damagedQty > 0 ? "#ef4444" : "#cbd5e1" }} value={item.damagedQty} onChange={e => { const val = parseInt(e.target.value)||0; if(val <= item.qty && val >= 0) setReceiveItems(receiveItems.map((i, ix) => ix === idx ? { ...i, damagedQty: val } : i)) }} min="0" max={item.qty} /></td>
                                      <td style={{ textAlign: "center", fontWeight: "bold", color: "#10b981", fontSize: "18px" }}>{item.qty - (item.damagedQty || 0)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            
                            <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "10px", marginTop: "24px", border: "1px solid #e2e8f0" }}>
                               <p style={{ fontStyle: "italic", color: "#64748b", margin: "0 0 15px 0", fontSize: "13px", lineHeight: "1.5" }}>* Hệ thống sẽ tự động đối soát, cộng kho hàng thực tế và hoàn trả tiền công nợ hàng hỏng cho Nhà Cung Cấp.</p>
                               <button className="gradient-btn" onClick={async () => {
                                  if (!foundPO || receiveItems.length === 0) return; setLoading(true);
                                  try {
                                    let actualTotal = 0; let logs: any[] = [];
                                    for (const item of receiveItems) {
                                        const actualQty = item.qty - (item.damagedQty || 0); actualTotal += actualQty * item.importPrice;
                                        if (actualQty > 0) {
                                            const p = products.find(x => x.id === item.product.id);
                                            if (p) {
                                                await supabase.from('products').update({ stock: p.stock + actualQty, import_price: item.importPrice }).eq('id', p.id);
                                                logs.push({ id: Date.now() + Math.random(), shift, type: "NHẬP PO", name: p.name, qty: actualQty, total: actualQty * item.importPrice, time: new Date().toLocaleString('vi-VN') });
                                            }
                                        }
                                        if (item.damagedQty > 0) { logs.push({ id: Date.now() + Math.random(), shift, type: "TRẢ HÀNG NCC", name: item.product.name + " (Lỗi/Hỏng)", qty: item.damagedQty, total: 0, time: new Date().toLocaleString('vi-VN') }); }
                                    }
                                    
                                    const finalDebt = actualTotal - foundPO.paid_amount;
                                    if (finalDebt > 0 && foundPO.supplier) {
                                        const supplierId = foundPO.supplier.id; const s = suppliers.find(x => x.id === supplierId);
                                        if (s) { const newD = (s.debt || 0) + finalDebt; await supabase.from('suppliers').update({ debt: newD }).eq('id', supplierId); setSuppliers(prev => prev.map(x => x.id === supplierId ? { ...x, debt: newD } : x)); }
                                    }

                                    if(navigator.onLine) await supabase.from('purchase_orders_v2').update({ status: 'COMPLETED', items: receiveItems, total_amount: actualTotal }).eq('id', foundPO.id);
                                    
                                    const updatedPOs = localPOs.map(p => p.id === foundPO.id ? { ...p, status: 'COMPLETED', items: receiveItems, total_amount: actualTotal } : p); setLocalPOs(updatedPOs); localStorage.setItem("mart_pos", JSON.stringify(updatedPOs));

                                    logs.forEach(lg => addTransactionAndSync(lg)); 
                                    logAudit("NHẬN HÀNG PO", `Nhận mã ${foundPO.po_code}`); 
                                    toast.success("Nhập Kho thành công!"); 
                                    fetchProducts(); 
                                    setFoundPO(prev => ({ ...prev, status: 'COMPLETED', items: receiveItems, total_amount: actualTotal }));
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

        {/* CÁC MODAL KHÁC CỦA HỆ THỐNG */}
        {showHandoverModal && (<HandoverModal role={role} shift={shift} startingCash={startingCash} currentShiftStats={currentShiftStats} onClose={() => setShowHandoverModal(false)} onConfirm={confirmHandover} />)}
        <CashFlowModal cashFlowModalInfo={cashFlowModalInfo} setCashFlowModalInfo={setCashFlowModalInfo} shift={shift} todayStrStr={todayStrStr} currentShiftCashFlow={currentShiftCashFlow} currentShiftStats={currentShiftStats} />
        <HoldOrdersModal showHoldModal={showHoldModal} setShowHoldModal={setShowHoldModal} heldOrders={heldOrders} restoreOrder={restoreOrder} deleteHeldOrder={deleteHeldOrder} />
        <CheckoutModal isCheckoutOpen={isCheckoutOpen} setIsCheckoutOpen={setIsCheckoutOpen} checkoutStep={checkoutStep} setCheckoutStep={setCheckoutStep} voucherInput={voucherInput} setVoucherInput={setVoucherInput} customerInput={customerInput} setCustomerInput={setCustomerInput} custPhone={custPhone} setCustPhone={setCustPhone} custName={custName} setCustName={setCustName} useWallet={useWallet} setUseWallet={setUseWallet} appliedVoucherAmount={appliedVoucherAmount} setAppliedVoucherAmount={setAppliedVoucherAmount} customerGiven={customerGiven} setCustomerGiven={setCustomerGiven} finalToPay={finalToPay} customers={customers} isOnline={isOnline} bankBin={bankBin} bankAcc={bankAcc} bankNameStr={bankNameStr} loading={loading} handleVoucherSubmit={handleVoucherSubmit} handleCustomerInputChange={handleCustomerInputChange} setScannerMode={setScannerMode} handleNextToQR={handleNextToQR} confirmCheckout={confirmCheckout} setPrintMode={setPrintMode} sendReceiptEmail={sendReceiptEmail} closeCheckout={closeCheckout} />
        <StatsModal showStatsModal={showStatsModal} setShowStatsModal={setShowStatsModal} reportStartDate={reportStartDate} setReportStartDate={setReportStartDate} reportEndDate={reportEndDate} setReportEndDate={setReportEndDate} exportToCSV={exportToCSV} onExportCSV={exportToCSV} handleExportCSV={exportToCSV} sendInventoryAlertEmail={sendInventoryAlertEmail} onSendAlert={sendInventoryAlertEmail} handleSendEmailReport={handleSendEmailReport} onSendReport={handleSendEmailReport} filteredStats={filteredStats} chartData={chartData} topSelling={topSelling} products={products} />
        <InventoryModal showInventoryModal={showInventoryModal} setShowInventoryModal={setShowInventoryModal} inventorySearchTerm={inventorySearchTerm} setInventorySearchTerm={setInventorySearchTerm} handleInventorySearchEnter={handleInventorySearchEnter} invFilter={invFilter} setInvFilter={setInvFilter} exportInventoryCSV={exportInventoryCSV} onExport={exportInventoryCSV} handleImportInventoryCSV={handleImportInventoryCSV} onImport={handleImportInventoryCSV} products={products} actualStockInput={actualStockInput} setActualStockInput={setActualStockInput} handleInvInputKeyDown={handleInvInputKeyDown} syncInventoryCheck={syncInventoryCheck} onSync={syncInventoryCheck} loading={loading} />
        <DebtModal showDebtModal={showDebtModal} setShowDebtModal={setShowDebtModal} customers={customers} handlePayDebt={handlePayDebt} />
        <AuditModal showAuditModal={showAuditModal} setShowAuditModal={setShowAuditModal} auditLogs={auditLogs} exportAuditToCSV={exportAuditToCSV} setSelectedAuditLog={setSelectedAuditLog} setSelectedLog={setSelectedAuditLog} onViewDetail={setSelectedAuditLog} onRowClick={setSelectedAuditLog} />
        <AuditDetailModal selectedAuditLog={selectedAuditLog} setSelectedAuditLog={setSelectedAuditLog} showModal={!!selectedAuditLog} setShowModal={(val: boolean) => !val && setSelectedAuditLog(null)} selectedLog={selectedAuditLog} setSelectedLog={setSelectedAuditLog} />
        <ScannerModal scannerMode={scannerMode} setScannerMode={setScannerMode} scanMessage={scanMessage} />
        <PinModal showPinModal={showPinModal} setShowPinModal={setShowPinModal} correctPin={adminPin} onSuccess={() => { if (pendingAction) { pendingAction(); setPendingAction(null); } }} />
        <ScannerLinkModal showModal={showScannerLinkModal} setShowModal={setShowScannerLinkModal} />
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
        
        /* ==================================================================== */
        /* CSS DÀNH CHO MÁY IN (XÓA TOÀN BỘ UI, CHỈ GIỮ LẠI BẢN IN)            */
        /* ==================================================================== */
        @media print {
          body, html { margin: 0; padding: 0; background: #fff; width: 100%; }
          .no-print, .custom-modal-overlay, .animated-bg-mesh, .Toaster { display: none !important; }
          .print-a4-container { 
            display: block !important; 
            position: absolute !important; 
            top: 0 !important; 
            left: 0 !important; 
            width: 100% !important; 
            background: white !important; 
            z-index: 999999 !important; 
            color: #000 !important;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
      <div className="animated-bg-mesh"></div>
      <Toaster position="top-right" reverseOrder={false} />

      <input type="text" id="search-barcode" style={{position:'absolute', opacity: 0, height: 0, width: 0}} value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} onKeyDown={handleBarcodeSubmitAction} />
      
      {renderPrintArea()}
      {renderModals()}

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
            .login-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; width: 18px; height: 18px; pointer-events: none; z-index: 2;}
            .login-input { width: 100%; padding: 14px 16px 14px 42px; border-radius: 12px; border: 1.5px solid #e2e8f0; background: #f8fafc; box-sizing: border-box; outline: none; transition: all 0.2s ease; font-size: 14px; color: #1e293b; font-weight: 500; cursor: pointer; }
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

            {/* Mục Chọn Ca Làm Việc */}
            <div className="login-input-group">
              <svg className="login-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <select className="login-input" value={shift} onChange={e => setShift(e.target.value)} required style={{ appearance: 'none', WebkitAppearance: 'none' }}>
                <option value="Ca Sáng">🌅 Ca Sáng (06:00 - 14:00)</option>
                <option value="Ca Chiều">☀️ Ca Chiều (14:00 - 22:00)</option>
                <option value="Ca Tối">🌙 Ca Tối (22:00 - 06:00)</option>
              </select>
              {/* Mũi tên trỏ xuống cho Select */}
              <div style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94a3b8" }}>▼</div>
            </div>
            
            <button className="login-btn-submit" type="submit" disabled={loading}>
              {loading ? "ĐANG TẢI..." : "ĐĂNG NHẬP HỆ THỐNG"}
            </button>
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
                
                <ProductSearchAndActions 
                  role={role} 
                  barcodeInput={barcodeInput} 
                  setBarcodeInput={setBarcodeInput} 
                  showSuggestions={showSuggestions} 
                  setShowSuggestions={setShowSuggestions} 
                  handleBarcodeSubmit={handleBarcodeSubmitAction} 
                  setScannerMode={setScannerMode} 
                  products={products} 
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

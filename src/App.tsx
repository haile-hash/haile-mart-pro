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

// IMPORT CÁC MODAL ĐÃ ĐƯỢC DỌN DẸP
import { SupplierModal } from "./components/modals/SupplierModal";
import { SettingsModal } from "./components/modals/SettingsModal";
import { CustomerModal } from "./components/modals/CustomerModal";
import { MarketingModal } from "./components/modals/MarketingModal";
import { POModal } from "./components/modals/POModal";

// IMPORT KHU VỰC IN ẤN ĐÃ TÁCH
import { PrintManager } from "./components/print/PrintManager";

// IMPORT CSS ĐÃ TÁCH RIÊNG KHỎI APP
import './styles/App.css';
import './styles/Print.css';

export default function App() {
  if (typeof window !== "undefined" && window.location.search.includes("scanner=true")) {
    return <MobileScanner />;
  }

  const VAT_RATE = 0.1;
  // BẢO MẬT: Sử dụng biến môi trường từ file .env
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
  const { cart, setCart, barcodeInput, custAddress, setCustAddress, setBarcodeInput, isCheckoutOpen, setIsCheckoutOpen, checkoutStep, setCheckoutStep, customerInput, setCustomerInput, custPhone, setCustPhone, custName, setCustName, useWallet, setUseWallet, voucherInput, setVoucherInput, appliedVoucherAmount, setAppliedVoucherAmount, customerGiven, setCustomerGiven, lastOrder, setLastOrder, resetCheckout } = useCheckoutState();

  const [customers, setCustomers] = useState<Record<string, Customer>>(() => { const s = localStorage.getItem("mart_customers"); return s ? JSON.parse(s) : {} });
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => { const s = localStorage.getItem("mart_held_orders"); return s ? JSON.parse(s) : [] });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => { const s = localStorage.getItem("mart_audit"); return s ? JSON.parse(s) : [] });
  const [expenses, setExpenses] = useState<any[]>(() => { const s = localStorage.getItem("mart_expenses"); return s ? JSON.parse(s) : [] });
  const [suppliers, setSuppliers] = useState<any[]>(() => { const s = localStorage.getItem("mart_suppliers"); return s ? JSON.parse(s) : [] });
  const [history, setHistory] = useState<TransactionLog[]>(() => { const s = localStorage.getItem("mart_history"); return s ? JSON.parse(s) : [] });

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
          setCustPhone(matchedPhone); 
          setCustName(customers[matchedPhone].name); 
          setCustAddress(customers[matchedPhone].address || ""); 
          playSound('success'); 
          setScanMessage({ text: `✅ Nhận diện VIP: ${customers[matchedPhone].name}`, type: 'success' }) 
        } else { 
          setCustPhone(val); 
          setCustName(""); 
          setCustAddress(""); 
          playSound('success'); 
          setScanMessage({ text: `✅ Đã quét mã (Khách mới)`, type: 'success' }) 
        } 
      }
      setTimeout(() => setScannerMode(null), 1000); 
      setTimeout(() => setScanMessage(null), 1500); 
      setScanQueue(prev => prev.slice(1));
    }
  }, [scanQueue, products, scannerMode]);

  // =====================================================================
 // =====================================================================
  // =====================================================================
  // FIX LỖI TRIỆT ĐỂ: BẤM CANCEL THOÁT HẲN, KHÔNG HIỆN LẠI HỘP THOẠI IN
  // =====================================================================
  const isPrintingRef = React.useRef(false); // Đặt biến cờ ở đầu hàm App() nếu chưa có

  useEffect(() => {
    if (!printMode) {
      isPrintingRef.current = false;
      return;
    }

    // Nếu đang trong quá trình mở hộp thoại in -> Chặn đứng không cho chạy tiếp
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;

    const handleAfterPrint = () => {
      setPrintMode(null);
      isPrintingRef.current = false;
    };

    // Lắng nghe sự kiện đóng hộp thoại in của trình duyệt (Bất kể chọn Print hay Cancel)
    window.addEventListener('afterprint', handleAfterPrint);

    const timer = setTimeout(() => {
      // Kiểm tra lại một lần nữa trước khi gọi lệnh in
      if (printMode) {
        window.print();
      }
    }, 1500); // Giảm xuống 1500ms để hộp thoại in xuất hiện nhanh hơn, tránh lag bám đuôi

    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [printMode, setPrintMode]);

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
      filtered = filtered.filter(log => 
        (log.name && String(log.name).toLowerCase().includes(term)) || 
        (log.customer && String(log.customer).toLowerCase().includes(term)) || 
        (log.id.toString().includes(term)) ||
        (log.order_id && String(log.order_id).toLowerCase().includes(term))
      ) 
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
  // 4. ACTION FUNCTIONS
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
      setCustPhone(matchedPhone); 
      setCustName(customers[matchedPhone].name); 
      setCustAddress(customers[matchedPhone].address || ""); 
      setUseWallet(false); 
    } else { 
      setCustPhone(val); 
      setCustName(""); 
      setCustAddress(""); 
      setUseWallet(false); 
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
          time: new Date().toLocaleString('vi-VN'),
          order_id: orderIdStr
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
          address: custAddress || customers[custPhone]?.address || "", 
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
      
      const qtyInput = window.prompt(`Sản phẩm: ${cleanName(log.name)}\nSố lượng đã mua: ${log.qty}\n\nNhập SỐ LƯỢNG khách muốn trả lại:`, log.qty.toString());
      if (qtyInput === null) return; 

      const refundQty = parseInt(qtyInput);
      if (isNaN(refundQty) || refundQty <= 0) {
        return toast.error("Số lượng hoàn trả không hợp lệ!");
      }
      if (refundQty > log.qty) {
        return toast.error(`Lỗi! Số lượng trả lại (${refundQty}) không được lớn hơn số lượng đã mua (${log.qty})!`);
      }

      const singlePrice = log.total / log.qty; 
      const refundTotal = Math.round(singlePrice * refundQty);
      const singleProfit = (log.profit || 0) / log.qty; 
      const refundProfit = Math.round(singleProfit * refundQty);

      let selectedMethod = "TIỀN MẶT";

      if (log.type === 'GHI NỢ') {
        const confirmDebt = window.confirm(`Đơn hàng này được MUA NỢ.\nHệ thống sẽ tự động trừ ${refundTotal.toLocaleString()}đ vào dư nợ của khách hàng. Đồng ý?`);
        if (!confirmDebt) return;
        selectedMethod = "TRỪ NỢ";

        const phoneMatch = log.customer.match(/\((.*?)\)/);
        const customerPhone = phoneMatch ? phoneMatch[1] : null;
        if (customerPhone && customers[customerPhone]) {
          const custData = customers[customerPhone];
          const newDebt = Math.max(0, (custData.debt || 0) - refundTotal); 
          const updatedCust = { ...custData, debt: newDebt };
          setCustomers(prev => ({ ...prev, [customerPhone]: updatedCust }));
          if (navigator.onLine) {
            await supabase.from("customers").update({ debt: newDebt }).eq("phone", customerPhone);
          }
        }
      } else {
        const choice = window.prompt(`Xác nhận trả lại ${refundQty} sản phẩm.\nNhập số để chọn hình thức hoàn tiền:\n1. TIỀN MẶT\n2. CHUYỂN KHOẢN\n3. HOÀN VÀO VÍ VIP`, "1");
        if (choice === null) return; 

        if (choice === "2") selectedMethod = "CHUYỂN KHOẢN";
        if (choice === "3") selectedMethod = "VÍ WALLET";

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
    
    const inputAmount = window.prompt(
      `Khách hàng: ${customers[phone].name}\nDư nợ hiện tại: ${currentDebt.toLocaleString()}đ\n\nNhập số tiền khách muốn thanh toán:`, 
      currentDebt.toString()
    );
    if (inputAmount === null) return; 

    const paidAmount = parseInt(inputAmount.replace(/[,.]/g, ''));
    if (isNaN(paidAmount) || paidAmount <= 0) {
      return toast.error("Số tiền thanh toán không hợp lệ!");
    }
    if (paidAmount > currentDebt) {
      return toast.error(`Số tiền trả (${paidAmount.toLocaleString()}đ) không được lớn hơn tổng nợ hiện tại (${currentDebt.toLocaleString()}đ)!`);
    }

    const methodChoice = window.prompt(
      `Khách thanh toán ${paidAmount.toLocaleString()}đ bằng hình thức nào?\nNhập số để chọn:\n1. TIỀN MẶT\n2. CHUYỂN KHOẢN`, 
      "1"
    );
    if (methodChoice === null) return; 
    
    const selectedMethod = methodChoice === "2" ? "CHUYỂN KHOẢN" : "TIỀN MẶT";

    const remainingDebt = currentDebt - paidAmount;
    
    setCustomers(prev => ({ 
      ...prev, 
      [phone]: { ...prev[phone], debt: remainingDebt } 
    })); 
    
    if (navigator.onLine) {
      await supabase.from("customers").update({ debt: remainingDebt }).eq("phone", phone); 
    }
    
    const lg = { 
      id: Date.now(), 
      shift, 
      type: "THU NỢ", 
      name: remainingDebt === 0 ? "Thanh toán hết nợ" : `Trả bớt nợ (Còn nợ: ${remainingDebt.toLocaleString()}đ)`, 
      qty: 1, 
      total: paidAmount, 
      profit: 0, 
      customer: `${customers[phone].name} (${phone})`, 
      paymentMethod: selectedMethod, 
      time: new Date().toLocaleString('vi-VN') 
    }; 
    addTransactionAndSync(lg); 
    
    if (remainingDebt === 0) {
      toast.success(`Đã thu sạch nợ qua [${selectedMethod}]!`);
    } else {
      toast.success(`Đã thu ${paidAmount.toLocaleString()}đ qua [${selectedMethod}]. Dư nợ còn lại: ${remainingDebt.toLocaleString()}đ`);
    }
  };

  const handleReprint = (timeStr: string) => {
    const logsInBill = history.filter(h => h.time === timeStr && (h.type === 'BÁN' || h.type === 'GHI NỢ' || h.type === 'TRẢ HÀNG') && h.product_id !== 'DISCOUNT'); 
    const discountLog = history.find(h => h.time === timeStr && h.product_id === 'DISCOUNT');
    if(logsInBill.length === 0) return toast.error("Không tìm thấy dữ liệu hóa đơn!");
    
    const isRefundSlip = logsInBill[0].type === 'TRẢ HÀNG';
    
    const reconstructedCart = logsInBill.map(l => ({ 
      qty: Math.abs(l.qty), 
      product: { 
        name: l.name.replace("HOÀN: ", ""), 
        gift_info: null, 
        isHappyHour: String(l.name).includes('[Giờ Vàng]') 
      }, 
      priceIncludingVat: Math.abs(l.total) / Math.abs(l.qty) 
    }));
    
    const subTotal = reconstructedCart.reduce((s, i) => s + (i.qty * (i.priceIncludingVat / (1 + VAT_RATE))), 0); 
    const vatTotal = Math.round(subTotal * VAT_RATE); 
    const discount = discountLog ? Math.abs(discountLog.total) : 0; 
    const finalTotal = logsInBill.reduce((sum, l) => sum + Math.abs(l.total), 0) - discount; 
    
    let cPhone = ""; let cName = logsInBill[0].customer;
    if (cName !== "Khách lẻ") { 
      const match = cName.match(/\((.*?)\)/); 
      if (match && match[1]) { cPhone = match[1]; cName = cName.replace(` (${cPhone})`, ""); } else { cPhone = cName; } 
    }
    
    const rOrder = { 
      orderId: isRefundSlip ? "PHIẾU_TRẢ_HÀNG" : "HD_COPY", 
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
    
    toast.loading("Đang dựng cấu trúc thẻ VIP...", { duration: 1200 });
    setPrintCustomer({ phone, ...cust }); 
    setPrintMode('customer_card'); 
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
            await supabase.from("products").insert([{ product_code: baseCode, name: pName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry }]); 
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

  // =====================================================================
  // 5. CÁC HÀM XỬ LÝ MỚI ĐƯỢC BÓC TÁCH TỪ MODAL
  // =====================================================================
  const handleSendMarketingEmail = async () => {
    if (!marketingMsg) return toast.error("Vui lòng nhập nội dung!"); 
    if (!window.confirm("Giới hạn 200 mail/tháng. Gửi?")) return;
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
    logAudit("GỬI MAIL MKT", `Gửi ${successCount} mail cho tập ${marketingTier}`); setLoading(false); setShowMarketingModal(false); toast.success(`Đã gửi ${successCount} mail!`);
  };

  const handleSaveNewPO = async () => {
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
      
      setPoItems([]); setPoNote(""); setSelectedSupplierId(""); setPaidAmount(0);
      toast.success(`Đã lưu Phiếu Đặt Hàng ${poCode}!`);
      setPoTab('RECEIVE'); setSearchPoCode(poCode); setFoundPO(newPO);
      setReceiveItems(newPO.items.map((i: any) => ({ ...i, damagedQty: 0 })));
    } catch (err: any) { toast.error("Lỗi: " + err.message); } finally { setLoading(false); }
  };

  const handlePrintPO = (po: any, type: 'po_order' | 'po_receipt' | 'po_return') => {
    setPrintPOData(po);
    setPrintMode(type);
  };

  const handleConfirmReceipt = async () => {
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
  };

  // =====================================================================
  // 6. RENDER MODALS BẰNG CÁC COMPONENT ĐÃ TÁCH
  // =====================================================================
  const renderModals = () => {
    return (
      <>
        <ExpenseModal showExpenseModal={showExpenseModal} setShowExpenseModal={setShowExpenseModal} expName={expName} setExpName={setExpName} expAmount={expAmount} setExpAmount={setExpAmount} expenses={expenses} addExpense={addExpense} deleteExpense={deleteExpense} />
        {showHandoverModal && <HandoverModal role={role} shift={shift} startingCash={startingCash} currentShiftStats={currentShiftStats} onClose={() => setShowHandoverModal(false)} onConfirm={confirmHandover} />}
        <CashFlowModal cashFlowModalInfo={cashFlowModalInfo} setCashFlowModalInfo={setCashFlowModalInfo} shift={shift} todayStrStr={todayStrStr} currentShiftCashFlow={currentShiftCashFlow} currentShiftStats={currentShiftStats} />
        <HoldOrdersModal showHoldModal={showHoldModal} setShowHoldModal={setShowHoldModal} heldOrders={heldOrders} restoreOrder={restoreOrder} deleteHeldOrder={deleteHeldOrder} />
        <CheckoutModal isCheckoutOpen={isCheckoutOpen} setIsCheckoutOpen={setIsCheckoutOpen} checkoutStep={checkoutStep} setCheckoutStep={setCheckoutStep} voucherInput={voucherInput} setVoucherInput={setVoucherInput} customerInput={customerInput} setCustomerInput={setCustomerInput} custPhone={custPhone} setCustPhone={setCustPhone} custName={custName} setCustName={setCustName} useWallet={useWallet} setUseWallet={setUseWallet} appliedVoucherAmount={appliedVoucherAmount} setAppliedVoucherAmount={setAppliedVoucherAmount} customerGiven={customerGiven} setCustomerGiven={setCustomerGiven} finalToPay={finalToPay} customers={customers} isOnline={isOnline} bankBin={bankBin} bankAcc={bankAcc} bankNameStr={bankNameStr} loading={loading} handleVoucherSubmit={handleVoucherSubmit} handleCustomerInputChange={handleCustomerInputChange} setScannerMode={setScannerMode} handleNextToQR={handleNextToQR} confirmCheckout={confirmCheckout} setPrintMode={setPrintMode} sendReceiptEmail={sendReceiptEmail} closeCheckout={closeCheckout} custAddress={custAddress} setCustAddress={setCustAddress}/>
        <StatsModal showStatsModal={showStatsModal} setShowStatsModal={setShowStatsModal} reportStartDate={reportStartDate} setReportStartDate={setReportStartDate} reportEndDate={reportEndDate} setReportEndDate={setReportEndDate} exportToCSV={exportToCSV} onExportCSV={exportToCSV} handleExportCSV={exportToCSV} sendInventoryAlertEmail={sendInventoryAlertEmail} onSendAlert={sendInventoryAlertEmail} handleSendEmailReport={handleSendEmailReport} onSendReport={handleSendEmailReport} filteredStats={filteredStats} chartData={chartData} topSelling={topSelling} products={products} />
        <InventoryModal showInventoryModal={showInventoryModal} setShowInventoryModal={setShowInventoryModal} inventorySearchTerm={inventorySearchTerm} setInventorySearchTerm={setInventorySearchTerm} handleInventorySearchEnter={handleInventorySearchEnter} invFilter={invFilter} setInvFilter={setInvFilter} exportInventoryCSV={exportInventoryCSV} onExport={exportInventoryCSV} handleImportInventoryCSV={handleImportInventoryCSV} onImport={handleImportInventoryCSV} products={products} actualStockInput={actualStockInput} setActualStockInput={setActualStockInput} handleInvInputKeyDown={handleInvInputKeyDown} syncInventoryCheck={syncInventoryCheck} onSync={syncInventoryCheck} loading={loading} />
        <DebtModal showDebtModal={showDebtModal} setShowDebtModal={setShowDebtModal} customers={customers} handlePayDebt={handlePayDebt} />
        <AuditModal showAuditModal={showAuditModal} setShowAuditModal={setShowAuditModal} auditLogs={auditLogs} exportAuditToCSV={exportAuditToCSV} setSelectedAuditLog={setSelectedAuditLog} setSelectedLog={setSelectedAuditLog} onViewDetail={setSelectedAuditLog} onRowClick={setSelectedAuditLog} />
        <AuditDetailModal selectedAuditLog={selectedAuditLog} setSelectedAuditLog={setSelectedAuditLog} showModal={!!selectedAuditLog} setShowModal={(val: boolean) => !val && setSelectedAuditLog(null)} selectedLog={selectedAuditLog} setSelectedLog={setSelectedAuditLog} />
        <ScannerModal scannerMode={scannerMode} setScannerMode={setScannerMode} scanMessage={scanMessage} />
        <PinModal showPinModal={showPinModal} setShowPinModal={setShowPinModal} correctPin={adminPin} onSuccess={() => { if (pendingAction) { pendingAction(); setPendingAction(null); } }} />
        <ScannerLinkModal showModal={showScannerLinkModal} setShowModal={setShowScannerLinkModal} />

        <SupplierModal 
          showSupplierModal={showSupplierModal} setShowSupplierModal={setShowSupplierModal}
          supName={supName} setSupName={setSupName} supPhone={supPhone} setSupPhone={setSupPhone}
          supItem={supItem} setSupItem={setSupItem}
          addSupplier={addSupplier} deleteSupplier={deleteSupplier} suppliers={suppliers}
        />

        <SettingsModal 
          showSettings={showSettings} setShowSettings={setShowSettings}
          newBankBin={newBankBin} setNewBankBin={setNewBankBin}
          newBankAcc={newBankAcc} setNewBankAcc={setNewBankAcc}
          newBankNameStr={newBankNameStr} setNewBankNameStr={setNewBankNameStr}
          newHappyStart={newHappyStart} setNewHappyStart={setNewHappyStart}
          newHappyEnd={newHappyEnd} setNewHappyEnd={setNewHappyEnd}
          saveSettings={saveSettings}
        />

        <CustomerModal 
          showCustomerModal={showCustomerModal} setShowCustomerModal={setShowCustomerModal}
          customers={customers} setCustomers={setCustomers} logAudit={logAudit}
          handleEditPhone={handleEditPhone} printCustomerCard={printCustomerCard}
          sendCardEmail={sendCardEmail} shareToZalo={shareToZalo}
        />

        <MarketingModal 
          showMarketingModal={showMarketingModal} setShowMarketingModal={setShowMarketingModal}
          marketingTier={marketingTier} setMarketingTier={setMarketingTier}
          marketingMsg={marketingMsg} setMarketingMsg={setMarketingMsg}
          sendMarketingEmails={handleSendMarketingEmail} loading={loading}
        />

        <POModal 
          showPOModal={showPOModal} setShowPOModal={setShowPOModal}
          poTab={poTab} setPoTab={setPoTab}
          suppliers={suppliers} selectedSupplierId={selectedSupplierId} setSelectedSupplierId={setSelectedSupplierId}
          poSearch={poSearch} setPoSearch={setPoSearch}
          poItems={poItems} setPoItems={setPoItems} products={products}
          poNote={poNote} setPoNote={setPoNote}
          paidAmount={paidAmount} setPaidAmount={setPaidAmount}
          searchPoCode={searchPoCode} setSearchPoCode={setSearchPoCode}
          foundPO={foundPO} setFoundPO={setFoundPO}
          receiveItems={receiveItems} setReceiveItems={setReceiveItems}
          allPOs={allPOs} localPOs={localPOs} loading={loading}
          onSaveNewPO={handleSaveNewPO} onConfirmReceipt={handleConfirmReceipt} handlePrintPO={handlePrintPO}
        />
      </>
    );
  };

  // =====================================================================
  // RENDER GIAO DIỆN CHÍNH (ĐÃ DỌN SẠCH CÁC KHỐI THẺ INTERAL <style>)
  // =====================================================================
  return (
    <div onClick={() => { setOpenFilter(null); setShowSuggestions(false); setShowMainMenu(false) }}>
      <style>{styles}</style>
      
      <div className="animated-bg-mesh"></div>
      <Toaster position="top-right" reverseOrder={false} />

      <input type="text" id="search-barcode" style={{position:'absolute', opacity: 0, height: 0, width: 0}} value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} onKeyDown={handleBarcodeSubmitAction} />
      
      {/* KHU VỰC IN ẤN ĐÃ ĐƯỢC TÁCH COMPONENT */}
      <PrintManager 
        printMode={printMode}
        lastOrder={lastOrder}
        shift={shift}
        role={role}
        customers={customers}
        VAT_RATE={VAT_RATE}
        printBarcodeProduct={printBarcodeProduct}
        barcodeCount={barcodeCount}
        printCustomer={printCustomer}
        printPOData={printPOData}
      />
      
      {renderModals()}

      {!isLoggedIn ? (
        <div className="login-wrapper">
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

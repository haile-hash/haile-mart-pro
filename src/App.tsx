/* eslint-disable */
// @ts-nocheck
import React, { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "./supabaseClient";

const styles = `
  @keyframes wave{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes float{0%{transform:translateY(0)}50%{transform:translateY(-20px)}100%{transform:translateY(0)}}
  @keyframes pulse-fast{0%{opacity:1}50%{opacity:.5}100%{opacity:1}}
  @keyframes logo-glow{0%,100%{box-shadow:0 0 10px rgba(250,204,21,0.2), 0 0 20px rgba(250,204,21,0.2) inset; transform: scale(1)}50%{box-shadow:0 0 25px rgba(250,204,21,1), 0 0 40px rgba(250,204,21,0.8), 0 0 20px rgba(250,204,21,0.5) inset; transform: scale(1.05)}}
  .logo-icon{animation:logo-glow 2s infinite ease-in-out;background-color:#dc2626;padding:8px;border-radius:10px;display:flex;align-items:center;justify-content:center}
  .spring-bg{position:fixed;width:400px;height:400px;border-radius:50%;filter:blur(100px);z-index:-1;opacity:.3;animation:float 10s infinite ease-in-out; transition: all 0.3s;}
  .glass{background:var(--bg-glass);border:1px solid var(--border-glass);border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,.08); color: var(--text-main); transition: all 0.3s;}
  body{background-color:var(--bg-main);margin:0;font-family:'Inter',sans-serif;color:var(--text-main); transition: all 0.3s;}
  .tab-btn{padding:6px 12px;border-radius:20px;border:1px solid var(--border-glass);background:var(--bg-glass);cursor:pointer;font-size:12px;font-weight:bold;color:var(--text-main);white-space:nowrap}
  .tab-btn.active{background:#ef4444;color:#fff;border-color:#ef4444}
  .chart-container-scroll{display:flex;align-items:flex-end;height:120px;margin-top:15px;padding-top:10px;border-top:1px dashed var(--border-glass);overflow-x:auto;padding-bottom:5px;gap:4px}
  .chart-bar-group{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;min-width:20px}
  .chart-bar{width:8px;background:linear-gradient(0deg,#ef4444 0%,#fca5a5 100%);border-radius:4px 4px 0 0;transition:height .5s;min-height:2px}
  .chart-label{font-size:8px;color:var(--text-muted);margin-top:4px;font-weight:bold;white-space:nowrap}
  .chart-val{font-size:8px;color:#ef4444;font-weight:bold;margin-bottom:2px}
  .noti-bell{position:relative;display:inline-block;cursor:pointer}
  .noti-badge{position:absolute;top:-5px;right:-5px;background:#ef4444;color:white;border-radius:50%;padding:2px 6px;font-size:9px;font-weight:bold;animation:pulse-fast 1s infinite}
  input, select, textarea { background: var(--bg-input); color: var(--text-main); border: 1px solid var(--border-glass); }
  .cash-box { transition: all 0.2s ease-in-out; border-radius: 8px; padding: 4px 10px; cursor: pointer; border: 1px solid transparent; }
  .cash-box:hover { background: var(--bg-glass); border: 1px dashed var(--border-glass); transform: scale(1.05); box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
  @media print{
    .no-print{display:none!important}
    .print-only{display:block!important;position:absolute!important;left:50%!important;transform:translateX(-50%)!important;width:80mm!important;padding:5mm!important;box-sizing:border-box!important; background:#fff!important; color:#000!important}
    .print-flex{display:flex!important;width:100%}
    body{background:#fff!important;margin:0;padding:0}
    @page{margin:0}
    .print-barcode-sheet{display:flex!important;flex-wrap:wrap!important;justify-content:flex-start!important;gap:2mm!important;padding:5mm!important}
    .barcode-sticker{width:35mm!important;height:22mm!important;page-break-inside:avoid!important;border:1px dashed #ccc!important;padding:1mm!important;box-sizing:border-box!important;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;background:#fff!important;color:#000!important}
    .print-a4-container { width: 100%; background: #fff !important; color: #000 !important; padding: 20mm; box-sizing: border-box; }
  }
  .print-only,.print-flex{display:none}
  .qty-input{width:28px;text-align:center;border-radius:4px;outline:none;font-size:11px;font-weight:bold;padding:3px 0;}
  .qty-input::-webkit-outer-spin-button,.qty-input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
  .qty-input[type=number]{-moz-appearance:textfield}
  .add-to-cart-btn{padding:8px 16px;background-color:#fbbf24;color:#78350f;border:none;border-radius:6px;font-weight:900;cursor:pointer;font-size:12px;transition:transform .1s,background-color .2s;box-shadow:0 2px 4px rgba(251,191,36,.3)}
  .add-to-cart-btn:hover{background-color:#f59e0b;transform:scale(1.05)}
  .add-to-cart-btn:active{transform:scale(.95)}
  :root { --bg-main: #fff7ed; --bg-glass: rgba(255,255,255,0.98); --border-glass: #fed7aa; --text-main: #431407; --text-muted: #64748b; --bg-input: #fff; }
  [data-theme='dark'] { --bg-main: #0f172a; --bg-glass: #1e293b; --border-glass: #334155; --text-main: #f8fafc; --text-muted: #94a3b8; --bg-input: #334155; }
`;

export default function App() {
  const VAT_RATE = 0.1;
  const EMAILJS_SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID || "service_7ie990l";
  const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || "template_t91erhg";
  const EMAILJS_TEMPLATE_VIP_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_VIP_ID || "template_m1j9i7k";
  const EMAILJS_PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || "5ric0kxuwNPlUleAv";
  
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("mart_logged_in") === "true");
  const [role, setRole] = useState(() => localStorage.getItem("mart_role") || "staff");
  const [shift, setShift] = useState(() => localStorage.getItem("mart_shift") || "Ca Sáng");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Ép cứng quỹ tiền lẻ mặc định 5.000.000 VNĐ
  const [startingCash, setStartingCash] = useState<number>(() => {
    const cached = localStorage.getItem("mart_starting_cash");
    return (cached && cached !== "0") ? Number(cached) : 5000000;
  });
  const [cashFlowModalInfo, setCashFlowModalInfo] = useState<'TIỀN MẶT' | 'CHUYỂN KHOẢN' | null>(null);

  const [bankBin, setBankBin] = useState(() => localStorage.getItem("mart_bank_bin") || "970422");
  const [bankAcc, setBankAcc] = useState(() => localStorage.getItem("mart_bank_acc") || "0680124181004");
  const [bankNameStr, setBankNameStr] = useState(() => localStorage.getItem("mart_bank_name") || "LE HONG HAI");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("mart_theme") === "dark");
  
  const [showSettings, setShowSettings] = useState(false);
  const [newBankBin, setNewBankBin] = useState("");
  const [newBankAcc, setNewBankAcc] = useState("");
  const [newBankNameStr, setNewBankNameStr] = useState("");
  
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [loading, setLoading] = useState(false);
  const [showInputForm, setShowInputForm] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, any[]>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState<any>(null);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showMarketingModal, setShowMarketingModal] = useState(false);
  
  // State Kiểm kho
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [actualStockInput, setActualStockInput] = useState<Record<string, number>>({});
  const [inventorySearchTerm, setInventorySearchTerm] = useState("");
  const [invFilter, setInvFilter] = useState('ALL');
  
  const [reportStartDate, setReportStartDate] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; });
  const [reportEndDate, setReportEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [scannerMode, setScannerMode] = useState<'product' | 'voucher' | 'customer' | null>(null);
  const [scannedCodeObj, setScannedCodeObj] = useState<any>(null);
  const [scanMessage, setScanMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [printBarcodeProduct, setPrintBarcodeProduct] = useState<any>(null);
  const [printCustomer, setPrintCustomer] = useState<any>(null);
  const [barcodeCount, setBarcodeCount] = useState<number>(30);
  const [printMode, setPrintMode] = useState<'receipt' | 'barcode' | 'customer_card' | 'invoice_a4' | null>(null);
  
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
  
  const [expName, setExpName] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [supName, setSupName] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supItem, setSupItem] = useState("");
  const [marketingTier, setMarketingTier] = useState("Tất cả");
  const [marketingMsg, setMarketingMsg] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  
  const [customers, setCustomers] = useState<any>(() => { const s = localStorage.getItem("mart_customers"); return s ? JSON.parse(s) : {} });
  const [heldOrders, setHeldOrders] = useState<any[]>(() => { const s = localStorage.getItem("mart_held_orders"); return s ? JSON.parse(s) : [] });
  const [auditLogs, setAuditLogs] = useState<any[]>(() => { const s = localStorage.getItem("mart_audit"); return s ? JSON.parse(s) : [] });
  const [expenses, setExpenses] = useState<any[]>(() => { const s = localStorage.getItem("mart_expenses"); return s ? JSON.parse(s) : [] });
  const [suppliers, setSuppliers] = useState<any[]>(() => { const s = localStorage.getItem("mart_suppliers"); return s ? JSON.parse(s) : [] });
  const [history, setHistory] = useState<any[]>(() => { const s = localStorage.getItem("mart_history"); return s ? JSON.parse(s) : [] });

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
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [logSearchTerm, setLogSearchTerm] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState("Tất cả");

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const isInitialMount = useRef(true);

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
    const handleOnline = () => { setIsOnline(true); syncAllOfflineData(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [history, customers, heldOrders, auditLogs, expenses, suppliers]);

  const syncToCloud = async (tableName: string, dataArray: any, isObject = false) => {
    if (!navigator.onLine) { setSyncStatus('error'); return false; }
    try {
      setSyncStatus('syncing');
      let formattedData = [];
      if (isObject) { formattedData = Object.keys(dataArray).map(key => ({ phone: key, ...dataArray[key] })); } else { formattedData = dataArray; }
      if (formattedData.length === 0) { setSyncStatus('synced'); return true; }
      const { error } = await supabase.from(tableName).upsert(formattedData, { onConflict: tableName === 'customers' ? 'phone' : 'id' });
      if (error) throw error;
      setSyncStatus('synced'); return true;
    } catch (err) { setSyncStatus('error'); return false; }
  };

  const syncAllOfflineData = async () => {
    if (!navigator.onLine) return;
    setSyncStatus('syncing');
    await Promise.all([ syncToCloud('history', history), syncToCloud('customers', customers, true), syncToCloud('held_orders', heldOrders), syncToCloud('audit_logs', auditLogs), syncToCloud('expenses', expenses), syncToCloud('suppliers', suppliers) ]);
  };

  const loadCloudData = async () => {
    try {
      setSyncStatus('syncing');
      const [rCust, rHist, rExp, rSup, rAud, rHold] = await Promise.all([
        supabase.from('customers').select('*'), supabase.from('history').select('*').order('id', { ascending: false }).limit(1500),
        supabase.from('expenses').select('*').order('id', { ascending: false }), supabase.from('suppliers').select('*').order('id', { ascending: false }),
        supabase.from('audit_logs').select('*').order('id', { ascending: false }).limit(300), supabase.from('held_orders').select('*')
      ]);
      if (rCust.data && rCust.data.length > 0) { setCustomers((prev: any) => { const updated = { ...prev }; rCust.data.forEach((c: any) => { updated[c.phone] = { ...updated[c.phone], ...c }; }); return updated; }); }
      if (rHist.data) { setHistory(prev => { const cloudIds = new Set(rHist.data.map(h => h.id)); const localOnly = prev.filter(h => !cloudIds.has(h.id)); return [...localOnly, ...rHist.data].sort((a, b) => b.id - a.id); }); }
      if (rExp.data) { setExpenses(prev => { const cloudIds = new Set(rExp.data.map(e => e.id)); const localOnly = prev.filter(e => !cloudIds.has(e.id)); return [...localOnly, ...rExp.data].sort((a, b) => b.id - a.id); }); }
      if (rSup.data) { setSuppliers(prev => { const cloudIds = new Set(rSup.data.map(s => s.id)); const localOnly = prev.filter(s => !cloudIds.has(s.id)); return [...localOnly, ...rSup.data].sort((a, b) => b.id - a.id); }); }
      if (rAud.data) { setAuditLogs(prev => { const cloudIds = new Set(rAud.data.map(a => a.id)); const localOnly = prev.filter(a => !cloudIds.has(a.id)); return [...localOnly, ...rAud.data].sort((a, b) => b.id - a.id); }); }
      if (rHold.data) { setHeldOrders(prev => { const cloudIds = new Set(rHold.data.map(o => o.id)); const localOnly = prev.filter(o => !cloudIds.has(o.id)); return [...localOnly, ...rHold.data].sort((a, b) => b.id - a.id); }); }
      setSyncStatus('synced');
    } catch (err) { setSyncStatus('error'); }
  };

  useEffect(() => {
    localStorage.setItem("mart_history", JSON.stringify(history)); localStorage.setItem("mart_customers", JSON.stringify(customers)); localStorage.setItem("mart_held_orders", JSON.stringify(heldOrders));
    localStorage.setItem("mart_audit", JSON.stringify(auditLogs)); localStorage.setItem("mart_expenses", JSON.stringify(expenses)); localStorage.setItem("mart_suppliers", JSON.stringify(suppliers));
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    const delaySync = setTimeout(() => {
      if (isLoggedIn) { syncToCloud('history', history); syncToCloud('customers', customers, true); syncToCloud('held_orders', heldOrders); syncToCloud('audit_logs', auditLogs); syncToCloud('expenses', expenses); syncToCloud('suppliers', suppliers); }
    }, 2000);
    return () => clearTimeout(delaySync);
  }, [history, customers, heldOrders, auditLogs, expenses, suppliers, isLoggedIn]);

  const formatCategoryStr = (str: string) => { if (!str) return "Khác"; const t = str.trim(); return t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : "Khác"; };
  const playSound = (type: 'success' | 'error') => { try { const ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); if (type === 'success') { osc.frequency.value = 800; gain.gain.setValueAtTime(0.1, ctx.currentTime); osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1) } else { osc.frequency.value = 250; osc.type = 'square'; gain.gain.setValueAtTime(0.1, ctx.currentTime); osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3) } } catch (e) { } };
  
  const logAudit = async (action: string, detail: string, extraData: any = null) => { 
    const newLog = { id: Date.now(), time: new Date().toLocaleString('vi-VN'), user_name: role === 'admin' ? 'Quản lý' : 'Thu ngân', shift, action, detail, extra_data: extraData ? JSON.stringify(extraData) : null }; 
    setAuditLogs(prev => [newLog, ...prev].slice(0, 300)); 
  };
  
  const parseGift = (giftStr: string | null) => { if (!giftStr) return { cond: 0, text: "" }; if (giftStr.includes(';;;')) { const parts = giftStr.split(';;;'); return { cond: parseInt(parts[0]) || 1, text: parts[1] || "" } } return { cond: 1, text: giftStr } };
  const cleanName = (name: string) => name ? name.split(' [Lô')[0] : '';
  const getActualPrice = (p: any) => { let price = (p.promo_price && p.promo_price > 0) ? p.promo_price : p.sale_price; const currentHour = new Date().getHours(); if ((currentHour >= 20 || currentHour < 6) && (p.category === 'Đồ ăn liền' || p.category === 'Bánh Kẹo')) { price = price * 0.8; p.isHappyHour = true } else { p.isHappyHour = false } return Math.round(price) };
  const getCustomerTier = (totalSpent = 0) => { if (totalSpent >= 500000000) return { name: "💎 KIM CƯƠNG", discountRate: 0.10, color: "#a855f7", bg: "#faf5ff", border: "#e9d5ff" }; if (totalSpent >= 200000000) return { name: "🥇 VÀNG", discountRate: 0.05, color: "#ca8a04", bg: "#fefce8", border: "#fef08a" }; if (totalSpent >= 50000000) return { name: "🥈 BẠC", discountRate: 0.02, color: "#475569", bg: "#f8fafc", border: "#cbd5e1" }; return { name: "🥉 ĐỒNG", discountRate: 0, color: "#b45309", bg: "#fffbeb", border: "#fde68a" } };
  
  const fetchProducts = async () => { const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false }); if (data) setProducts(data) };
  const findProductByCode = (code: string) => { const rawCode = code.trim(); let matches = products.filter(prod => prod.product_code === rawCode || prod.product_code.startsWith(`${rawCode}-`)); let available = matches.filter(p => p.stock > 0); if (available.length > 0) { available.sort((a, b) => { if (!a.expiry_date) return 1; if (!b.expiry_date) return -1; return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime() }); return available[0] } return matches.length > 0 ? matches[0] : null };
  
  useEffect(() => { const timer = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(timer) }, []);
  
  useEffect(() => {
    if (isLoggedIn) {
      fetchProducts(); loadCloudData();
      const channel = supabase.channel("db_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchProducts())
        .on("postgres_changes", { event: "*", schema: "public", table: "history" }, () => loadCloudData())
        .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, () => loadCloudData())
        .on("postgres_changes", { event: "*", schema: "public", table: "held_orders" }, () => loadCloudData())
        .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, () => loadCloudData())
        .subscribe();
      const script = document.createElement("script"); script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
      script.onload = () => { (window as any).emailjs.init(EMAILJS_PUBLIC_KEY); }; document.head.appendChild(script);
      return () => { supabase.removeChannel(channel) };
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (scannerMode !== null) {
      let scanner: any; let lastScanTime = 0;
      const loadScanner = () => {
        if ((window as any).Html5QrcodeScanner) {
          scanner = new (window as any).Html5QrcodeScanner("qr-reader", { fps: 15, qrbox: { width: 250, height: 120 }, rememberLastUsedCamera: true }, false);
          scanner.render((text: string) => { const now = Date.now(); if (now - lastScanTime < 1500) return; lastScanTime = now; setScannedCodeObj({ code: text, time: now }) }, undefined)
        }
      };
      if (!(window as any).Html5QrcodeScanner) { const script = document.createElement("script"); script.src = "https://unpkg.com/html5-qrcode"; script.onload = loadScanner; document.head.appendChild(script) } else loadScanner();
      return () => { if (scanner) scanner.clear().catch(() => { }) }
    }
  }, [scannerMode]);
  
  const handleSelectSuggest = (p_input: any) => {
    const baseCode = p_input.product_code.split('-')[0];
    const totalStock = products.filter(p => p.product_code === baseCode || p.product_code.startsWith(`${baseCode}-`)).reduce((s, p) => s + p.stock, 0);
    if (totalStock <= 0) { playSound('error'); return alert("Đã hết hàng!"); }
    const price = getActualPrice(p_input); const repName = cleanName(p_input.name);
    setCart(prev => {
      const exist = prev.find(item => cleanName(item.product.name) === repName);
      if (exist) {
        const newQty = exist.qty + 1;
        if (newQty > totalStock) { playSound('error'); return prev; }
        playSound('success'); return prev.map(i => cleanName(i.product.name) === repName ? { ...i, qty: newQty, total: Math.round(newQty * price * (1 + VAT_RATE)) } : i);
      } else { playSound('success'); return [...prev, { product: p_input, qty: 1, total: Math.round(price * (1 + VAT_RATE)) }]; }
    });
    setScanMessage({ text: `✅ Thêm: ${repName}`, type: 'success' }); setBarcodeInput(""); setShowSuggestions(false); setTimeout(() => setScanMessage(null), 2000);
  };

  useEffect(() => {
    if (scannedCodeObj) {
      if (scannerMode === 'product') { const p = findProductByCode(scannedCodeObj.code); if (p) handleSelectSuggest(p); else { const matchedPhone = Object.keys(customers).find(phone => phone === scannedCodeObj.code.trim() || customers[phone].cardCode === scannedCodeObj.code.trim()); if (matchedPhone) { playSound('success'); setCustomerInput(customers[matchedPhone].cardCode || matchedPhone); setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); setScanMessage({ text: `✅ KH VIP: ${customers[matchedPhone].name}`, type: 'success' }) } else { playSound('error'); setScanMessage({ text: `❌ Lỗi mã`, type: 'error' }) } setTimeout(() => setScannerMode(null), 1500) } }
      else if (scannerMode === 'voucher') { const code = scannedCodeObj.code.trim().toUpperCase(); const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 }; if (VOUCHERS[code]) { setAppliedVoucherAmount(VOUCHERS[code]); setVoucherInput(code); playSound('success'); setScanMessage({ text: `✅ Giảm ${VOUCHERS[code].toLocaleString()}đ`, type: 'success' }) } else if (!isNaN(Number(code)) && Number(code) > 0) { setAppliedVoucherAmount(Number(code)); setVoucherInput(code); playSound('success'); setScanMessage({ text: `✅ Giảm ${Number(code).toLocaleString()}đ`, type: 'success' }) } else { playSound('error'); alert("Mã Voucher không hợp lệ!"); setAppliedVoucherAmount(0) } setTimeout(() => setScannerMode(null), 1000) }
      else if (scannerMode === 'customer') { const val = scannedCodeObj.code.trim(); setCustomerInput(val); const matchedPhone = Object.keys(customers).find(phone => phone === val || customers[phone].cardCode === val); if (matchedPhone) { setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); playSound('success'); setScanMessage({ text: `✅ Nhận diện VIP: ${customers[matchedPhone].name}`, type: 'success' }) } else { setCustPhone(val); setCustName(""); playSound('success'); setScanMessage({ text: `✅ Đã quét mã (Khách mới)`, type: 'success' }) } setTimeout(() => setScannerMode(null), 1000) }
      setScannedCodeObj(null); setTimeout(() => setScanMessage(null), 1500)
    }
  }, [scannedCodeObj, products, scannerMode]);

  useEffect(() => { const handleAfterPrint = () => setPrintMode(null); window.addEventListener("afterprint", handleAfterPrint); return () => window.removeEventListener("afterprint", handleAfterPrint) }, []);

  const todayStrStr = new Date().toLocaleDateString('vi-VN');
  
  const currentShiftStats = useMemo(() => { 
    const shiftLogs = history.filter(h => new Date(Math.floor(h.id)).toLocaleDateString('vi-VN') === todayStrStr && h.shift === shift); 
    let cash = startingCash; let transfer = 0; let prof = 0; let totalSales = 0; 
    shiftLogs.forEach(h => { 
      if (h.type === 'BÁN' || h.type === 'GHI NỢ') totalSales += h.total; 
      if (h.type === 'BÁN' || h.type === 'THU NỢ' || h.type === 'TRẢ HÀNG') { 
        if (h.paymentMethod === 'CHUYỂN KHOẢN') transfer += h.total; else if (h.paymentMethod === 'TIỀN MẶT' || h.paymentMethod === 'KẾT HỢP') {
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
    const thu: any[] = [];
    const chi: any[] = [];

    shiftLogs.forEach(h => {
      if (h.paymentMethod === cashFlowModalInfo || h.paymentMethod === 'KẾT HỢP') {
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
      const logTime = new Date(Math.floor(h.id)).getTime(); return logTime >= start && logTime <= end;
    });
    let cash = 0; let transfer = 0; let prof = 0; let totalSales = 0; 
    filteredHistory.forEach(h => { 
      if (h.type === 'BÁN' || h.type === 'GHI NỢ') totalSales += h.total; 
      if (h.type === 'BÁN' || h.type === 'THU NỢ' || h.type === 'TRẢ HÀNG') { 
        if (h.paymentMethod === 'CHUYỂN KHOẢN') transfer += h.total; 
        else if (h.paymentMethod === 'TIỀN MẶT' || h.paymentMethod === 'KẾT HỢP') { 
          if(h.paymentMethod === 'KẾT HỢP' && h.split_cash) { cash += h.split_cash; transfer += (h.total - h.split_cash); } 
          else { cash += h.total; } 
        } 
      } 
      prof += (h.profit || 0) 
    }); 
    const filteredExp = expenses.filter(e => {
      const parts = e.date.split('/'); if(parts.length !== 3) return false;
      const expTime = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`).getTime();
      return expTime >= start && expTime <= end;
    }).reduce((sum, e) => sum + e.amount, 0); 
    return { rev: cash + transfer, cash, transfer, prof, totalSales, expenses: filteredExp, netProfit: prof - filteredExp } 
  }, [history, expenses, reportStartDate, reportEndDate]);

  const chartData = useMemo(() => { const data = []; for (let i = 29; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const dStr = d.toLocaleDateString('vi-VN'); const dayTotal = history.filter(h => new Date(Math.floor(h.id)).toLocaleDateString('vi-VN') === dStr && (h.type === 'BÁN' || h.type === 'GHI NỢ')).reduce((s, h) => s + h.total, 0); data.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, total: dayTotal, showLabel: (i % 3 === 0 || i === 0) }) } const maxVal = Math.max(...data.map(d => d.total), 1); return data.map(d => ({ ...d, height: `${(d.total / maxVal) * 100}%` })) }, [history]);
  
  const topSelling = useMemo(() => { 
    const sales: Record<string, number> = {}; 
    history.forEach(log => { 
      if ((log.type === 'BÁN' || log.type === 'GHI NỢ') && log.product_id !== 'DISCOUNT') {
        const baseName = cleanName(log.name); sales[baseName] = (sales[baseName] || 0) + log.qty 
      }
    }); 
    return Object.entries(sales).sort((a, b) => b[1] - a[1]).slice(0, 5) 
  }, [history]);
  
  const groupedHistory = useMemo(() => { let filtered = history; if (logTypeFilter !== "Tất cả") filtered = filtered.filter(log => log.type === logTypeFilter); if (logSearchTerm.trim() !== "") { const term = logSearchTerm.toLowerCase(); filtered = filtered.filter(log => (log.name && log.name.toLowerCase().includes(term)) || (log.customer && log.customer.toLowerCase().includes(term)) || (log.id.toString().includes(term))) } return filtered.reduce((groups: any, log: any) => { const date = new Date(Math.floor(log.id)).toLocaleDateString('vi-VN'); if (!groups[date]) groups[date] = []; groups[date].push({ ...log, t: new Date(Math.floor(log.id)).toLocaleTimeString('vi-VN') }); return groups }, {}) }, [history, logSearchTerm, logTypeFilter]);

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
    const todayTime = new Date().getTime();
    let filtered = products.filter(p => (selectedCategory === "Tất cả" || formatCategoryStr(p.category) === selectedCategory)).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.product_code && p.product_code.toLowerCase().includes(searchTerm.toLowerCase())));
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

  const handleLogin = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    let u = authUsername.trim().toLowerCase(); 
    const p = authPassword.trim(); 
    if (!u.includes('@')) { u = u + '@hailemart.com'; }
    localStorage.setItem("mart_starting_cash", startingCash.toString());
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: u, password: p });
    if (error) { alert(`❌ Đăng nhập thất bại: Kiểm tra lại tài khoản hoặc mật khẩu.\nChi tiết lỗi: ${error.message}`); setLoading(false); return; }
    const userRole = u.includes('admin') ? 'admin' : 'staff';
    setIsLoggedIn(true); setRole(userRole); localStorage.setItem("mart_shift", shift); localStorage.setItem("mart_logged_in", "true"); localStorage.setItem("mart_role", userRole); logAudit("ĐĂNG NHẬP", "Mở ca", { start_cash: startingCash, role: userRole }); setLoading(false);
  };
  
  const handleLogoutClick = () => setShowHandoverModal(true);
  const confirmHandover = async () => { logAudit("CHỐT CA", `Bàn giao: ${currentShiftStats.rev.toLocaleString()}đ`, { ...currentShiftStats }); await supabase.auth.signOut(); setIsLoggedIn(false); setShowHandoverModal(false); localStorage.removeItem("mart_logged_in"); localStorage.removeItem("mart_role") };
  const handleEditPhone = async (oldPhone: string) => { const newPhone = window.prompt("Nhập SĐT mới:", oldPhone); if (newPhone && newPhone.trim() !== "" && newPhone !== oldPhone) { if (customers[newPhone]) return alert("❌ SĐT đã tồn tại!"); const cData = customers[oldPhone]; const newC = { ...cData, phone: newPhone }; setCustomers((prev: any) => { const updated = { ...prev }; updated[newPhone] = newC; delete updated[oldPhone]; return updated }); setHistory((prev: any) => prev.map((h: any) => { if (h.customer && h.customer.includes(oldPhone)) { return { ...h, customer: h.customer.replace(oldPhone, newPhone) } } return h })); logAudit("SỬA SĐT KH", `Đổi ${oldPhone} -> ${newPhone}`); alert("✅ Cập nhật thành công! (Sẽ tự động đồng bộ lên Cloud)"); } };
  const addSupplier = async () => { if (!supName || !supPhone) return alert("Nhập đủ Tên/SĐT"); const newS = { id: Date.now(), name: supName, phone: supPhone, item: supItem }; setSuppliers(prev => [newS, ...prev]); setSupName(""); setSupPhone(""); setSupItem(""); logAudit("THÊM NCC", `${supName} - ${supPhone}`); alert("✅ Thêm NCC thành công!"); };
  const deleteSupplier = async (id: any) => { setSuppliers(prev => prev.filter(s => s.id !== id)); if (navigator.onLine) await supabase.from('suppliers').delete().eq('id', id); };
  const addExpense = async () => { if (!expName || !expAmount) return alert("Nhập chi phí!"); const newE = { id: Date.now(), date: new Date().toLocaleDateString('vi-VN'), name: expName, amount: Number(expAmount) }; setExpenses(prev => [newE, ...prev]); setExpName(""); setExpAmount(""); logAudit("GHI CHI PHÍ", `${expName}: ${expAmount}đ`, newE); alert("✅ Đã ghi nhận!"); };
  const deleteExpense = async (id: any) => { setExpenses(prev => prev.filter(e => e.id !== id)); if (navigator.onLine) await supabase.from('expenses').delete().eq('id', id); };
  
  const sendMarketingEmails = async () => {
    if (!marketingMsg) return alert("Nhập nội dung!");
    if (!window.confirm("Giới hạn 200 mail/tháng. Gửi?")) return;
    setLoading(true);
    const targetCustomers = Object.keys(customers).filter(phone => { const c = customers[phone]; if (!c.email) return false; if (marketingTier === "Tất cả") return true; return getCustomerTier(c.totalSpent).name.includes(marketingTier) });
    if (targetCustomers.length === 0) { setLoading(false); return alert("Không có KH!"); }
    let successCount = 0;
    for (const phone of targetCustomers) {
      const c = customers[phone];
      try { await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_VIP_ID, { to_email: c.email, order_id: "THÔNG BÁO ƯU ĐÃI", time: new Date().toLocaleString('vi-VN'), items_list: `💌 Lời nhắn từ Hải Lê Mart:\n\n${marketingMsg}`, total_amount: "Quà Tặng", payment_method: "Khách VIP", change_amount: "0đ", barcode_url: "" }); successCount++ } catch (error: any) { console.error("EmailJS Error", error); }
    }
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
        if (item.product.id === productId) {
          const baseCode = item.product.product_code.split('-')[0];
          const totalStock = products.filter(p => p.product_code === baseCode || p.product_code.startsWith(`${baseCode}-`)).reduce((s, p) => s + p.stock, 0);
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
          const baseCode = i.product.product_code.split('-')[0];
          const totalStock = products.filter(p => p.product_code === baseCode || p.product_code.startsWith(`${baseCode}-`)).reduce((s, p) => s + p.stock, 0);
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
  
  const handleDirectQtyBlur = (productId: any, val: string) => { if (val === '' || parseInt(val) <= 0 || isNaN(parseInt(val))) { setCart(prev => prev.map(i => { if (i.product.id === productId) { const price = getActualPrice(i.product); return { ...i, qty: 1, total: Math.round(1 * price * (1 + VAT_RATE)) } } return i })) } };
  const removeFromCart = (productId: any) => { setCart(cart.filter(item => item.product.id !== productId)) };
  const clearCart = () => { if (window.confirm("Hủy toàn bộ?")) { setCart([]); setCustName(""); setCustPhone(""); setCustomerInput("") } };
  const handleVoucherSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); const code = voucherInput.trim().toUpperCase(); const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 }; if (VOUCHERS[code]) { setAppliedVoucherAmount(VOUCHERS[code]); playSound('success') } else if (!isNaN(Number(code)) && Number(code) > 0) { setAppliedVoucherAmount(Number(code)); playSound('success') } else { playSound('error'); alert("Mã Voucher lỗi!"); setAppliedVoucherAmount(0) } } };
  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { const val = e.target.value; setCustomerInput(val); const matchedPhone = Object.keys(customers).find(phone => phone === val.trim() || customers[phone].cardCode === val.trim()); if (matchedPhone) { setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); setUseWallet(false) } else { setCustPhone(val); setCustName(""); setUseWallet(false) } };
  const handleNextToQR = () => { if (cart.length === 0) return alert("Giỏ hàng trống!"); if (custPhone && !customers[custPhone] && !custName) return alert("Nhập Tên khách mới!"); setCheckoutStep(2) };

  const confirmCheckout = async (payMethod: 'TIỀN MẶT' | 'CHUYỂN KHOẢN' | 'GHI NỢ' | 'KẾT HỢP') => {
    if (cart.some(i => !i.qty || i.qty <= 0)) { playSound('error'); return alert("Lỗi số lượng!") } if (payMethod === 'GHI NỢ' && !custPhone) return alert("Ghi nợ cần SĐT!");
    setLoading(true); let logs: any[] = [];
    const subTotal = Math.round(cart.reduce((s, i) => s + (i.qty * getActualPrice(i.product)), 0));
    const vatTotal = Math.round(subTotal * VAT_RATE);
    const baseTotal = subTotal + vatTotal;
    const totalAfterVoucher = Math.max(0, baseTotal - appliedVoucherAmount);
    const tier = getCustomerTier(customers[custPhone]?.totalSpent || 0);
    const tierDiscountAmount = custPhone ? Math.round(cartTotalAmountDisplay * tier.discountRate) : 0;
    const amountAfterTierAndVoucher = Math.max(0, totalAfterVoucher - tierDiscountAmount);
    const walletUsedAmount = useWallet && payMethod !== 'GHI NỢ' ? Math.round(Math.min(customers[custPhone]?.wallet || 0, amountAfterTierAndVoucher)) : 0;
    const finalTotal = amountAfterTierAndVoucher - walletUsedAmount;
    const totalDiscount = appliedVoucherAmount + walletUsedAmount + tierDiscountAmount;
    const earned = payMethod === 'GHI NỢ' ? 0 : Math.round(finalTotal * 0.02);
    
    let baseTimestamp = Date.now();
    const orderIdStr = "HD" + Date.now().toString().slice(-6);

    for (const item of cart) {
      const baseCode = item.product.product_code.split('-')[0];
      const batches = products.filter(p => p.product_code === baseCode || p.product_code.startsWith(`${baseCode}-`)).sort((a, b) => { if (!a.expiry_date) return 1; if (!b.expiry_date) return -1; return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime() });
      let remain = item.qty;
      const price = getActualPrice(item.product);
      for (const b of batches) {
        if (remain <= 0) break;
        if (b.stock > 0) {
          const take = Math.min(remain, b.stock);
          if (navigator.onLine) await supabase.from("products").update({ stock: b.stock - take }).eq("id", b.id);
          
          let splitCashAmt = 0;
          if(payMethod === 'KẾT HỢP') {
              splitCashAmt = Math.round((Number(customerGiven) / finalTotal) * Math.round(take * price * (1 + VAT_RATE)));
          }

          logs.push({ id: baseTimestamp++, shift: shift, type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", name: cleanName(b.name) + (item.product.isHappyHour ? ' [Giờ Vàng]' : ''), qty: take, total: Math.round(take * price * (1 + VAT_RATE)), profit: Math.round(take * (price - (b.import_price || 0))), customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: b.id, refunded_qty: 0, paymentMethod: payMethod, split_cash: splitCashAmt, time: new Date().toLocaleString('vi-VN') });
          remain -= take;
        }
      }
    }
    
    if (totalDiscount > 0) { logs.push({ id: baseTimestamp++, shift: shift, type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", name: "Giảm giá/Ví/VIP", qty: 1, total: -totalDiscount, profit: -totalDiscount, customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: 'DISCOUNT', refunded_qty: 0, paymentMethod: payMethod, time: new Date().toLocaleString('vi-VN') }) }
    
    if (custPhone) {
      const updatedCust = { name: custName, wallet: payMethod === 'GHI NỢ' ? (customers[custPhone]?.wallet || 0) : Math.round((customers[custPhone]?.wallet || 0) - walletUsedAmount + earned), debt: (customers[custPhone]?.debt || 0) + (payMethod === 'GHI NỢ' ? finalTotal : 0), totalSpent: (customers[custPhone]?.totalSpent || 0) + (payMethod !== 'GHI NỢ' ? finalTotal : 0), email: customers[custPhone]?.email || "", cardCode: customers[custPhone]?.cardCode || "" };
      setCustomers((prev: any) => ({ ...prev, [custPhone]: updatedCust }));
    }
    setHistory(prev => [...logs, ...prev]);
    
    const finalOrderInfo = { orderId: orderIdStr, shift: shift, cart: [...cart], subTotal, vatTotal, finalTotal: payMethod === 'GHI NỢ' ? 0 : finalTotal, debtAmount: payMethod === 'GHI NỢ' ? finalTotal : 0, discount: totalDiscount, tierDiscountAmount: tierDiscountAmount, earnedWallet: custPhone ? earned : 0, custName: custPhone ? custName : null, custPhone: custPhone ? custPhone : null, time: new Date().toLocaleString('vi-VN'), paymentMethod: payMethod, customerGiven: Number(customerGiven) || 0 };
    setLastOrder(finalOrderInfo);
    logAudit("BÁN HÀNG", `Hóa đơn ${orderIdStr} - ${finalTotal.toLocaleString()}đ`, finalOrderInfo);
    
    setCheckoutStep(3); if (navigator.onLine) fetchProducts(); setLoading(false);
  };

  const handleRefund = async (logId: any) => {
    const logIndex = history.findIndex(l => l.id === logId); if (logIndex === -1) return;
    const log = history[logIndex]; if (log.type !== 'BÁN') return alert("Chỉ hoàn đơn BÁN!");
    
    const maxRefund = log.qty - (log.refunded_qty || 0); if (maxRefund <= 0) return alert("Đã hoàn toàn bộ!");
    const qStr = window.prompt(`SP: ${cleanName(log.name)}\nĐã mua: ${log.qty} | Có thể hoàn: ${maxRefund}\nNhập số lượng cần hoàn:`, maxRefund.toString());
    if (!qStr) return;
    const refundQty = parseInt(qStr);
    if (isNaN(refundQty) || refundQty <= 0 || refundQty > maxRefund) { playSound('error'); return alert("Lỗi số lượng!"); }
    if (!window.confirm(`Xác nhận hoàn ${refundQty} sản phẩm này?`)) return;

    const unitTotal = log.total / log.qty; const unitProfit = log.profit / log.qty;
    const refundTotal = Math.round(unitTotal * refundQty); const refundProfit = Math.round(unitProfit * refundQty);
    
    const p = products.find(x => x.id === log.product_id);
    if (p && navigator.onLine) await supabase.from("products").update({ stock: p.stock + refundQty }).eq("id", p.id);

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
          refundedToWallet = true; pMethod = 'VÍ ĐIỂM'; methodSuffix = " (Ví)";
        }
      }
    }

    if (!refundedToWallet) {
        const isTransfer = window.confirm(`Hoàn ${refundTotal.toLocaleString()}đ bằng hình thức nào?\n- [OK]: CHUYỂN KHOẢN\n- [Cancel]: TIỀN MẶT`);
        if (isTransfer) { pMethod = 'CHUYỂN KHOẢN'; methodSuffix = " (CK)"; }
    }

    const refundLog = { id: Date.now(), shift: shift, type: "TRẢ HÀNG", name: log.name + methodSuffix, qty: refundQty, total: -refundTotal, profit: -refundProfit, customer: log.customer, paymentMethod: pMethod, time: new Date().toLocaleString('vi-VN') };
    
    const updatedHistory = [...history];
    updatedHistory[logIndex].refunded_qty = (log.refunded_qty || 0) + refundQty;
    updatedHistory.unshift(refundLog);
    
    setHistory(updatedHistory);
    if (navigator.onLine) fetchProducts();
    logAudit("TRẢ HÀNG", `Hoàn ${refundQty} ${cleanName(log.name)} (${pMethod})`, refundLog);
    playSound('success'); alert(`Thành công! Đã hoàn qua ${pMethod}`);
  };

  const handlePayDebt = async (phone: string) => {
    const currentDebt = customers[phone]?.debt || 0; const payAmtStr = window.prompt(`Khách nợ ${currentDebt.toLocaleString()}đ. Nhập tiền:`, currentDebt.toString());
    if (payAmtStr && parseInt(payAmtStr) > 0) {
      const amt = parseInt(payAmtStr); const isTransfer = window.confirm(`Thu nợ bằng CK (OK) hay TM (Cancel)?`); const pMethod = isTransfer ? 'CHUYỂN KHOẢN' : 'TIỀN MẶT';
      const newD = Math.max(0, (customers[phone]?.debt || 0) - amt);
      setCustomers((prev: any) => ({ ...prev, [phone]: { ...prev[phone], debt: newD } }));
      const dLog = { id: Date.now(), shift: shift, type: "THU NỢ", name: "Thanh toán công nợ", qty: 1, total: amt, profit: 0, customer: `${customers[phone].name} (${phone})`, paymentMethod: pMethod, time: new Date().toLocaleString('vi-VN') };
      setHistory(prev => [dLog, ...prev]); logAudit("THU NỢ", `Thu ${amt}đ từ ${customers[phone].name}`, dLog); alert("Thành công!")
    }
  };
  
  const handleReprint = (timeStr: string) => {
     const logsInBill = history.filter(h => h.time === timeStr && h.type === 'BÁN' && h.product_id !== 'DISCOUNT');
     const discountLog = history.find(h => h.time === timeStr && h.product_id === 'DISCOUNT');
     if(logsInBill.length === 0) return alert("Không tìm thấy dữ liệu hóa đơn!");
     
     const reconstructedCart = logsInBill.map(l => ({
        qty: l.qty,
        product: { name: l.name, gift_info: null, isHappyHour: l.name.includes('[Giờ Vàng]') },
        priceIncludingVat: l.total / l.qty
     }));
     
     const subTotal = reconstructedCart.reduce((s, i) => s + (i.qty * (i.priceIncludingVat / (1 + VAT_RATE))), 0);
     const vatTotal = Math.round(subTotal * VAT_RATE);
     const discount = discountLog ? Math.abs(discountLog.total) : 0;
     const finalTotal = subTotal + vatTotal - discount;
     
     const rOrder = {
        orderId: "HD_COPY", shift: logsInBill[0].shift, cart: reconstructedCart, subTotal, vatTotal, finalTotal, debtAmount: 0, discount, time: timeStr, paymentMethod: logsInBill[0].paymentMethod, customerGiven: 0, custName: logsInBill[0].customer
     };
     setLastOrder(rOrder);
     setPrintMode('receipt');
     setTimeout(() => window.print(), 500);
  };

  const closeCheckout = () => { setCart([]); setIsCheckoutOpen(false); setCheckoutStep(1); setCustPhone(""); setCustName(""); setCustomerInput(""); setUseWallet(false); setVoucherInput(""); setAppliedVoucherAmount(0); setCustomerGiven(""); setLastOrder(null) };
  
  const sendReceiptEmail = async () => {
    if (!lastOrder) return; 
    let savedEmail = (lastOrder.custPhone && customers[lastOrder.custPhone] && customers[lastOrder.custPhone].email) ? customers[lastOrder.custPhone].email : ""; 
    let email = window.prompt("Nhập Email khách hàng:", savedEmail);
    if (!email) return; 
    
    email = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return alert("❌ Lỗi: Địa chỉ Email không hợp lệ! Vui lòng kiểm tra lại (vd: ten@gmail.com).");
    }
    
    if (lastOrder.custPhone) { setCustomers((prev: any) => ({ ...prev, [lastOrder.custPhone]: { ...prev[lastOrder.custPhone], email: email } })); }
    setLoading(true); let itemsTable = ""; 
    lastOrder.cart.forEach((item: any) => { 
        const priceToUse = item.priceIncludingVat !== undefined ? item.priceIncludingVat : Math.round(getActualPrice(item.product) * (1 + VAT_RATE));
        itemsTable += `- ${cleanName(item.product.name)} x ${item.qty} = ${(priceToUse * item.qty).toLocaleString()}đ\n` 
    }); 
    const emailData = { 
        to_email: email, title: "HÓA ĐƠN MUA HÀNG - HẢI LÊ MART", order_id: lastOrder.orderId, time: lastOrder.time, items_list: itemsTable, 
        label_total: "TỔNG THANH TOÁN:", total_amount: Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString() + "đ", 
        label_payment: "Hình thức TT:", payment_method: lastOrder.paymentMethod, 
        label_change: lastOrder.paymentMethod === 'TIỀN MẶT' ? "Tiền thối lại:" : "", change_amount: lastOrder.paymentMethod === 'TIỀN MẶT' ? Math.round(lastOrder.customerGiven - lastOrder.finalTotal).toLocaleString() + "đ" : "" 
    }; 
    try { 
        await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailData); 
        alert("🚀 Đã gửi HĐ cho khách!"); 
        logAudit("GỬI HĐ MAIL", `Gửi tới ${email}`);
    } catch (error: any) { 
        console.error(error);
        alert(`❌ Lỗi EmailJS: ${error?.text || error?.message || 'Hãy kiểm tra lại Key EmailJS hoặc hạn mức (Quota) miễn phí 200 mail/tháng đã hết!'}`); 
    } 
    setLoading(false)
  };
  
  const sendCardEmail = async (phone: string) => {
    const cust = customers[phone]; 
    let email = cust.email || window.prompt(`Nhập Email của ${cust.name}:`, "");
    if (!email) return; 
    
    email = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return alert("❌ Lỗi: Địa chỉ Email không hợp lệ! Vui lòng kiểm tra lại (vd: ten@gmail.com).");
    }
    
    if (!cust.email) { setCustomers((prev: any) => ({ ...prev, [phone]: { ...prev[phone], email } })); }
    setLoading(true); const code = cust.cardCode || phone; const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(code)}&scale=2&height=10&includetext=true`; const emailData = { to_email: email, order_id: "THẺ THÀNH VIÊN", time: new Date().toLocaleString('vi-VN'), items_list: `💳 MÃ THẺ CỦA BẠN LÀ: ${code}\n(Vui lòng xuất trình Thẻ/Mã vạch bên dưới khi thanh toán)`, total_amount: "Ưu đãi Đặc Quyền", payment_method: "VIP Member", change_amount: "0đ", barcode_url: barcodeUrl }; 
    try { 
        await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_VIP_ID, emailData); 
        alert("🚀 Đã gửi Thẻ VIP!"); logAudit("GỬI THẺ VIP", `Gửi tới ${email}`);
    } catch (error: any) { 
        console.error(error);
        alert(`❌ Lỗi EmailJS: ${error?.text || error?.message || 'Hãy kiểm tra lại Key EmailJS hoặc hạn mức (Quota) miễn phí đã hết!'}`); 
    } 
    setLoading(false)
  };

  const printCustomerCard = (phone: string) => { setPrintCustomer({ phone, ...customers[phone] }); setPrintMode('customer_card'); setTimeout(() => window.print(), 1000) };
  
  const shareToZalo = (phone: string) => { const cust = customers[phone]; const code = cust.cardCode || phone; navigator.clipboard.writeText(`Chào ${cust.name},\nCảm ơn bạn đã đồng hành cùng Hải Lê Mart!\n💳 Mã Thẻ VIP của bạn là: ${code}`).then(() => { alert(`💡 Đã copy lời chào. Đang mở Zalo...`); window.open(`https://zalo.me/${phone}`, '_blank') }).catch(() => { window.open(`https://zalo.me/${phone}`, '_blank') }) };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => { const code = e.target.value; setNewCode(code); const p = products.find((x: any) => x.product_code === code); if (p) { setNewName(cleanName(p.name)); setNewCategory(formatCategoryStr(p.category)); setNewImportPrice(p.import_price?.toString() || ""); setNewPrice(p.sale_price.toString()); setNewPromoPrice(p.promo_price?.toString() || ""); setNewExpiry(p.expiry_date || ""); const gift = parseGift(p.gift_info); setNewGiftCondition(gift.cond.toString()); setNewGiftInfo(gift.text) } };
  
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!navigator.onLine) return alert("Cần có mạng để thao tác Kho!"); 
    setLoading(true);

    const added = parseInt(newStock || "0");
    const impPrice = parseInt(newImportPrice);
    const salePrice = parseInt(newPrice);
    const promo = parseInt(newPromoPrice) || 0;
    const finalGiftInfo = newGiftInfo.trim() !== "" ? `${newGiftCondition};;;${newGiftInfo}` : null;
    const baseCode = newCode.trim();
    const formattedCat = formatCategoryStr(newCategory);
    
    const allVariants = products.filter(p => p.product_code === baseCode || p.product_code.startsWith(`${baseCode}-`));
    const exist = allVariants.find(p => p.product_code === baseCode);
    let syncMsg = "";

    if (allVariants.length > 0) {
      const needSync = allVariants.some(v => v.sale_price !== salePrice || v.promo_price !== promo || v.gift_info !== finalGiftInfo);
      if (needSync) {
          await Promise.all(allVariants.map(v => 
              supabase.from("products").update({ sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo }).eq("id", v.id)
          ));
          syncMsg = `\n💡 Đã ĐỒNG BỘ GIÁ & QUÀ TẶNG cho các lô cũ!`;
          logAudit("ĐỒNG BỘ HỆ THỐNG", `Cập nhật Giá/Quà mã ${baseCode}`, { newPrice: salePrice, newPromo: promo, newGift: finalGiftInfo });
      }
    }

    if (exist) {
      if (exist.stock <= 0) {
        await supabase.from("products").update({ name: newName, category: formattedCat, import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null, created_at: new Date().toISOString() }).eq("id", exist.id);
        if (added > 0) { const lg = { id: Date.now(), shift: shift, type: "NHẬP", name: newName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }; setHistory(prev => [lg, ...prev]); } 
        logAudit("NHẬP ĐÈ CŨ", `${newName} (+${added})`, { importPrice: impPrice, salePrice });
        alert(`Đã nhập hàng!${syncMsg}`);
      } else {
        if (exist.import_price !== impPrice || (exist.expiry_date || "") !== (newExpiry || "")) {
          const batchCode = `${baseCode}-${Date.now().toString().slice(-4)}`;
          const batchName = `${newName} [Lô ${newExpiry ? new Date(newExpiry).toLocaleDateString('vi-VN') : 'Mới'}]`;
          if (window.confirm(`Tạo LÔ MỚI (${batchCode})?\n(Lô cũ sẽ tự động được áp dụng Giá & Quà tặng mới)`)) {
            await supabase.from("products").insert([{ product_code: batchCode, name: batchName, category: formattedCat, import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null }]);
            if (added > 0) { const lg = { id: Date.now(), shift: shift, type: "NHẬP", name: batchName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }; setHistory(prev => [lg, ...prev]); } 
            logAudit("TÁCH LÔ", `${batchName} (+${added})`, { oldExpiry: exist.expiry_date, newExpiry });
            alert(`Đã tạo lô mới!${syncMsg}`);
          } else {
            setLoading(false); return;
          }
        } else {
          await supabase.from("products").update({ stock: exist.stock + added, created_at: new Date().toISOString() }).eq("id", exist.id);
          if (added > 0) { const lg = { id: Date.now(), shift: shift, type: "NHẬP", name: newName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }; setHistory(prev => [lg, ...prev]); } 
          logAudit("CỘNG DỒN", `${newName} (+${added})`);
          alert(`Cộng dồn thành công!${syncMsg}`);
        }
      }
    } else {
      await supabase.from("products").insert([{ product_code: baseCode, name: newName, category: formattedCat, import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null }]);
      if (added > 0) { const lg = { id: Date.now(), shift: shift, type: "NHẬP", name: newName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }; setHistory(prev => [lg, ...prev]); } 
      logAudit("NHẬP MỚI", `${newName} (+${added})`, { code: baseCode, importPrice: impPrice, salePrice });
      alert(`Nhập thành công!${syncMsg}`);
    }
    
    setNewCode(""); setNewName(""); setNewCategory("Đồ uống"); setNewImportPrice(""); setNewPrice(""); setNewPromoPrice(""); setNewGiftCondition("1"); setNewGiftInfo(""); setNewStock(""); setNewExpiry("");
    fetchProducts(); setLoading(false); setShowInputForm(false);
  };

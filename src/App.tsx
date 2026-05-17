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
  
  :root {
    --bg-main: #fff7ed; --bg-glass: rgba(255,255,255,0.98); --border-glass: #fed7aa; --text-main: #431407; --text-muted: #64748b; --bg-input: #fff;
  }
  [data-theme='dark'] {
    --bg-main: #0f172a; --bg-glass: #1e293b; --border-glass: #334155; --text-main: #f8fafc; --text-muted: #94a3b8; --bg-input: #334155;
  }
`;

export default function App() {
  const VAT_RATE = 0.1;
  const EMAILJS_SERVICE_ID = "service_7ie990l", EMAILJS_TEMPLATE_ID = "template_t91erhg", EMAILJS_TEMPLATE_VIP_ID = "template_m1j9i7k", EMAILJS_PUBLIC_KEY = "5ric0kxuwNPlUleAv";
  
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("mart_logged_in") === "true");
  const [role, setRole] = useState(() => localStorage.getItem("mart_role") || "staff");
  const [shift, setShift] = useState(() => localStorage.getItem("mart_shift") || "Ca Sáng");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [startingCash, setStartingCash] = useState<number>(() => {
    const saved = localStorage.getItem("mart_starting_cash");
    return saved !== null ? Number(saved) : 5000000;
  });
  const [adminPass, setAdminPass] = useState(() => localStorage.getItem("mart_admin_pass") || "haile88");
  const [staffPass, setStaffPass] = useState(() => localStorage.getItem("mart_staff_pass") || "123");
  const [bankBin, setBankBin] = useState(() => localStorage.getItem("mart_bank_bin") || "970422");
  const [bankAcc, setBankAcc] = useState(() => localStorage.getItem("mart_bank_acc") || "0680124181004");
  const [bankNameStr, setBankNameStr] = useState(() => localStorage.getItem("mart_bank_name") || "LE HONG HAI");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("mart_theme") === "dark");
  
  const [showSettings, setShowSettings] = useState(false);
  const [newAdminPass, setNewAdminPass] = useState("");
  const [newStaffPass, setNewStaffPass] = useState("");
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
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [actualStockInput, setActualStockInput] = useState<Record<string, number>>({});
  
  // STATE MỚI: Modal chi tiết dòng tiền
  const [cashFlowModalInfo, setCashFlowModalInfo] = useState<'TIỀN MẶT' | 'CHUYỂN KHOẢN' | null>(null);

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
      setSyncStatus('synced');
      return true;
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

  // LOGIC CHI TIẾT DÒNG TIỀN (POPUP MỚI)
  const cashFlowDetails = useMemo(() => {
    if (!cashFlowModalInfo) return [];
    const details: any[] = [];
    
    // 1. Tiền đầu ca (chỉ hiển thị cho Tiền mặt)
    if (cashFlowModalInfo === 'TIỀN MẶT') {
       details.push({ time: "Mở ca", reason: "Tiền lẻ đầu ca", amount: startingCash, isPositive: true, isStarting: true });
    }

    // 2. Lọc lịch sử trong ca hiện tại
    const shiftLogs = history.filter(h => new Date(Math.floor(h.id)).toLocaleDateString('vi-VN') === todayStrStr && h.shift === shift);
    
    // Đảo ngược mảng để xem từ đầu ca đến cuối ca cho logic (hoặc giữ nguyên tùy ý)
    [...shiftLogs].reverse().forEach(h => {
       if (cashFlowModalInfo === 'TIỀN MẶT') {
          if (h.paymentMethod === 'TIỀN MẶT') {
             details.push({ time: h.time, reason: `[${h.type}] ${h.name}`, amount: h.total, isPositive: h.total > 0 });
          } else if (h.paymentMethod === 'KẾT HỢP' && h.split_cash) {
             details.push({ time: h.time, reason: `[${h.type} - Kết hợp] ${h.name}`, amount: h.split_cash, isPositive: h.split_cash > 0 });
          }
       } else if (cashFlowModalInfo === 'CHUYỂN KHOẢN') {
          if (h.paymentMethod === 'CHUYỂN KHOẢN') {
             details.push({ time: h.time, reason: `[${h.type}] ${h.name}`, amount: h.total, isPositive: h.total > 0 });
          } else if (h.paymentMethod === 'KẾT HỢP' && h.split_cash) {
             const transferAmt = h.total - h.split_cash;
             details.push({ time: h.time, reason: `[${h.type} - Kết hợp] ${h.name}`, amount: transferAmt, isPositive: transferAmt > 0 });
          }
       }
    });

    // 3. Lọc chi phí (Giả định chi phí bằng tiền mặt)
    if (cashFlowModalInfo === 'TIỀN MẶT') {
       const todayExp = expenses.filter(e => e.date === todayStrStr);
       todayExp.forEach(e => {
          details.push({ time: e.date, reason: `[CHI PHÍ] ${e.name}`, amount: -e.amount, isPositive: false });
       });
    }

    return details;
  }, [cashFlowModalInfo, history, expenses, shift, todayStrStr, startingCash]);
  
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
        if (h.paymentMethod === 'CHUYỂN KHOẢN') transfer += h.total; 
        else if (h.paymentMethod === 'TIỀN MẶT' || h.paymentMethod === 'KẾT HỢP') { 
          if(h.paymentMethod === 'KẾT HỢP' && h.split_cash) { cash += h.split_cash; transfer += (h.total - h.split_cash); } 
          else { cash += h.total; } 
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

  const handleLogin = (e: React.FormEvent) => { 
    e.preventDefault(); const u = authUsername.trim().toLowerCase(); const p = authPassword.trim(); 
    localStorage.setItem("mart_starting_cash", startingCash.toString());
    if (u === "admin" && p === "khoiphuc88") { setAdminPass("haile88"); localStorage.removeItem("mart_admin_pass"); setStaffPass("123"); localStorage.removeItem("mart_staff_pass"); setAuthPassword(""); alert("✅ MK gốc:\nAdmin: haile88\nNV: 123"); return } 
    if (u === "admin" && p === adminPass) { setIsLoggedIn(true); setRole("admin"); localStorage.setItem("mart_shift", shift); localStorage.setItem("mart_logged_in", "true"); localStorage.setItem("mart_role", "admin"); logAudit("ĐĂNG NHẬP", "Mở ca", { start_cash: startingCash, role: "admin" }) } 
    else if (u === "nhanvien" && p === staffPass) { setIsLoggedIn(true); setRole("staff"); localStorage.setItem("mart_shift", shift); localStorage.setItem("mart_logged_in", "true"); localStorage.setItem("mart_role", "staff"); logAudit("ĐĂNG NHẬP", "Mở ca", { start_cash: startingCash, role: "staff" }) } 
    else { alert("❌ Sai tài khoản!") } 
  };
  
  const handleLogoutClick = () => setShowHandoverModal(true);
  const confirmHandover = () => { logAudit("CHỐT CA", `Bàn giao: ${currentShiftStats.rev.toLocaleString()}đ`, { ...currentShiftStats }); setIsLoggedIn(false); setShowHandoverModal(false); localStorage.removeItem("mart_logged_in"); localStorage.removeItem("mart_role") };
  const handleEditPhone = async (oldPhone: string) => { const newPhone = window.prompt("Nhập SĐT mới:", oldPhone); if (newPhone && newPhone.trim() !== "" && newPhone !== oldPhone) { if (customers[newPhone]) return alert("❌ SĐT đã tồn tại!"); const cData = customers[oldPhone]; const newC = { ...cData, phone: newPhone }; setCustomers((prev: any) => { const updated = { ...prev }; updated[newPhone] = newC; delete updated[oldPhone]; return updated }); setHistory((prev: any) => prev.map((h: any) => { if (h.customer && h.customer.includes(oldPhone)) { return { ...h, customer: h.customer.replace(oldPhone, newPhone) } } return h })); logAudit("SỬA SĐT KH", `Đổi ${oldPhone} -> ${newPhone}`); alert("✅ Cập nhật thành công! (Sẽ tự động đồng bộ lên Cloud)"); } };
  const addSupplier = async () => { if (!supName || !supPhone) return alert("Nhập đủ Tên/SĐT"); const newS = { id: Date.now(), name: supName, phone: supPhone, item: supItem }; setSuppliers(prev => [newS, ...prev]); setSupName(""); setSupPhone(""); setSupItem(""); logAudit("THÊM NCC", `${supName} - ${supPhone}`); alert("✅ Thêm NCC thành công!"); };
  const deleteSupplier = async (id: any) => { setSuppliers(prev => prev.filter(s => s.id !== id)); if (navigator.onLine) await supabase.from('suppliers').delete().eq('id', id); };
  const addExpense = async () => { if (!expName || !expAmount) return alert("Nhập chi phí!"); const newE = { id: Date.now(), date: new Date().toLocaleDateString('vi-VN'), name: expName, amount: Number(expAmount) }; setExpenses(prev => [newE, ...prev]); setExpName(""); setExpAmount(""); logAudit("GHI CHI PHÍ", `${expName}: ${expAmount}đ`, newE); alert("✅ Đã ghi nhận!"); };
  const deleteExpense = async (id: any) => { setExpenses(prev => prev.filter(e => e.id !== id)); if (navigator.onLine) await supabase.from('expenses').delete().eq('id', id); };
  
  const handleSendEmailReport = async () => {
    const start = new Date(reportStartDate + "T00:00:00").getTime();
    const end = new Date(reportEndDate + "T23:59:59").getTime();
    const logs = history.filter(log => {
      const t = new Date(Math.floor(log.id)).getTime(); return t >= start && t <= end;
    });
    if (logs.length === 0) return alert("Chưa có giao dịch trong khoảng thời gian này!");
    let cash = 0, transfer = 0, prof = 0, sold = 0;
    logs.forEach(l => { 
        if (l.type === 'BÁN') sold += l.qty; 
        if (l.type === 'BÁN' || l.type === 'THU NỢ' || l.type === 'TRẢ HÀNG') { 
            if (l.paymentMethod === 'CHUYỂN KHOẢN') transfer += l.total; 
            else if (l.paymentMethod === 'TIỀN MẶT' || l.paymentMethod === 'KẾT HỢP') {
                if(l.paymentMethod === 'KẾT HỢP' && l.split_cash) { cash += l.split_cash; transfer += (l.total - l.split_cash); }
                else { cash += l.total }
            }
        } 
        prof += (l.profit || 0) 
    });
    
    let adminEmail = window.prompt("Nhập Email Quản lý để nhận báo cáo:", "");
    if(!adminEmail) return;

    adminEmail = adminEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
        return alert("❌ Lỗi: Địa chỉ Email không hợp lệ! Vui lòng kiểm tra lại (vd: ten@gmail.com).");
    }
    
    setLoading(true);
    const reportStr = `\n📅 Từ ${reportStartDate} đến ${reportEndDate}\n- Tổng SP đã bán: ${sold} món\n- Doanh thu Tiền Mặt: ${Math.round(cash).toLocaleString()}đ\n- Doanh thu C/K: ${Math.round(transfer).toLocaleString()}đ\n`;
    
    const emailData = { 
        to_email: adminEmail, title: "BÁO CÁO DOANH THU", order_id: `BÁO CÁO TỔNG HỢP`, time: new Date().toLocaleString('vi-VN'), items_list: reportStr, 
        label_total: "TỔNG LỢI NHUẬN:", total_amount: Math.round(prof).toLocaleString() + "đ", 
        label_payment: "Hệ thống:", payment_method: "Hải Lê ERP", label_change: "", change_amount: "" 
    }; 
    try {
        await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailData);
        logAudit("GỬI BÁO CÁO", `Đã gửi báo cáo tới ${adminEmail}`); alert("🚀 Đã gửi Báo cáo thành công!");
    } catch (error: any) { 
        console.error(error);
        alert(`❌ Lỗi EmailJS: ${error?.text || error?.message || 'Hãy kiểm tra lại Key EmailJS hoặc hạn mức (Quota) miễn phí 200 mail/tháng đã hết!'}`); 
    }
    setLoading(false);
  };

  const sendInventoryAlertEmail = async () => {
    let adminEmail = window.prompt("Nhập Email Quản lý để nhận cảnh báo:", "");
    if(!adminEmail) return;

    adminEmail = adminEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
        return alert("❌ Lỗi: Địa chỉ Email không hợp lệ! Vui lòng kiểm tra lại (vd: ten@gmail.com).");
    }

    setLoading(true);
    const lowStock = products.filter(p => p.stock > 0 && p.stock < 10);
    const today = new Date().getTime();
    const expiring = products.filter(p => p.expiry_date && (new Date(p.expiry_date).getTime() - today) / 86400000 <= 15);
    
    let msg = `🚨 BÁO CÁO KHO HÀNG NGÀY 🚨\n\n📦 SẮP HẾT HÀNG (${lowStock.length} món):\n`;
    lowStock.forEach(p => msg += `- ${cleanName(p.name)}: Còn ${p.stock} sản phẩm\n`);
    msg += `\n⏳ SẮP HẾT HẠN TRONG 15 NGÀY TỚI (${expiring.length} món):\n`;
    expiring.forEach(p => msg += `- ${cleanName(p.name)}: HSD ${new Date(p.expiry_date).toLocaleDateString('vi-VN')}\n`);

    const emailData = { to_email: adminEmail, title: "CẢNH BÁO TỒN KHO HẢI LÊ MART", order_id: "HỆ THỐNG", time: new Date().toLocaleString('vi-VN'), items_list: msg, label_total: "Tình trạng:", total_amount: "Cần chú ý", label_payment: "Gửi từ:", payment_method: "ERP Bot", label_change: "", change_amount: "" }; 
    try { 
      await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailData); 
      alert("🚀 Đã gửi cảnh báo kho thành công!"); logAudit("CẢNH BÁO KHO", "Gửi email báo cáo tồn kho");
    } catch (error: any) { 
        console.error(error);
        alert(`❌ Lỗi EmailJS: ${error?.text || error?.message || 'Hãy kiểm tra lại Key EmailJS hoặc hạn mức (Quota) miễn phí 200 mail/tháng đã hết!'}`); 
    }
    setLoading(false);
  };

  const syncInventoryCheck = async () => {
    if(!navigator.onLine) return alert("Cần có mạng để lưu kết quả kiểm kho!");
    if(!window.confirm("Xác nhận ghi đè số lượng tồn kho trên máy bằng số lượng thực tế?")) return;
    setLoading(true);
    let count = 0;
    for (const [id, actualQty] of Object.entries(actualStockInput)) {
      const p = products.find(x => x.id === id);
      if(p && p.stock !== actualQty) {
        await supabase.from("products").update({ stock: actualQty }).eq("id", id);
        logAudit("KIỂM KHO", `Cập nhật ${p.name}`, { tu_so: p.stock, thanh_so: actualQty, lech: actualQty - p.stock });
        count++;
      }
    }
    alert(`✅ Đã đồng bộ chênh lệch ${count} sản phẩm!`);
    setShowInventoryModal(false); setActualStockInput({}); fetchProducts(); setLoading(false);
  };
  
  const requestSort = (key: string) => { if (sortConfig && sortConfig.key === key) { if (sortConfig.direction === 'asc') setSortConfig({ key, direction: 'desc' }); else setSortConfig(null) } else { setSortConfig({ key, direction: 'asc' }) } };
  const handleFilterCheck = (col: string, val: any) => { setFilters(prev => { const cur = prev[col] || []; if (cur.includes(val)) return { ...prev, [col]: cur.filter(v => v !== val) }; return { ...prev, [col]: [...cur, val] } }) };
  const toggleDateGroup = (dateStr: string) => setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));

  const renderHeaderIcon = (colKey: string) => { const isFiltered = filters[colKey]?.length > 0; const isSortedAsc = sortConfig?.key === colKey && sortConfig.direction === 'asc'; const isSortedDesc = sortConfig?.key === colKey && sortConfig.direction === 'desc'; let icon = '🔽'; if (isSortedAsc) icon = '🔼'; if (isSortedDesc) icon = '🔽'; return (<span onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === colKey ? null : colKey) }} style={{ cursor: "pointer", color: isFiltered || sortConfig?.key === colKey ? '#ef4444' : '#94a3b8', fontSize: "10px", padding: "2px", marginLeft: "4px", border: isFiltered ? "1px dashed #ef4444" : "1px solid transparent", borderRadius: "2px" }} title="Lọc">{icon}</span>) };
  
  const renderFilterPopup = (colKey: string, title: string, uniqueValues: any[], formatVal?: (v: any) => string) => {
    if (openFilter !== colKey) return null;
    return (
      <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "100%", left: colKey === 'name' ? "0" : "50%", transform: colKey === 'name' ? "none" : "translateX(-50%)", background: "var(--bg-glass)", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "10px", zIndex: 999, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)", minWidth: "160px", textAlign: "left", color: "var(--text-main)", fontWeight: "normal", fontSize: "12px", display: "flex", flexDirection: "column" }}>
        <div style={{ marginTop: "10px", fontWeight: "bold", color: "var(--text-muted)", fontSize: "10px", marginBottom: "6px" }}>LỌC {title}:</div>
        <div style={{ overflowY: "auto", flex: 1, maxHeight: "150px", border: "1px solid var(--border-glass)", borderRadius: "4px", padding: "4px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px", cursor: "pointer", borderBottom: "1px dashed var(--border-glass)" }}>
            <input type="checkbox" checked={!filters[colKey] || filters[colKey].length === 0} onChange={() => setFilters(prev => ({ ...prev, [colKey]: [] }))} />
            <span style={{ color: "#3b82f6", fontWeight: "bold" }}>Tất cả</span>
          </label>
          {uniqueValues.map((v, i) => (
            <label key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px", cursor: "pointer", borderBottom: "1px dashed var(--border-glass)" }}>
              <input type="checkbox" checked={filters[colKey]?.includes(v) || false} onChange={() => handleFilterCheck(colKey, v)} />
              <span>{formatVal ? formatVal(v) : v}</span>
            </label>
          ))}
        </div>
        {filters[colKey]?.length > 0 && (
          <div style={{ marginTop: "8px", textAlign: "center", cursor: "pointer", color: "#ef4444", fontWeight: "bold", fontSize: "11px", padding: "4px" }} onClick={() => setFilters(prev => ({ ...prev, [colKey]: [] }))}>
            ❌ Bỏ lọc
          </div>
        )}
      </div>
    );
  };

  const HeaderLogo = () => (
    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      <div className="logo-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "900", letterSpacing: "0.5px", color: "var(--text-main)", lineHeight: "1", whiteSpace: "nowrap" }}>
          {[..."HẢI LÊ "].map((c, i) => <span key={i} style={{ display: "inline-block", animation: `wave 1.5s ease-in-out ${i * 0.06}s infinite` }}>{c === ' ' ? '\u00A0' : c}</span>)}
          <span style={{ color: "#dc2626" }}>{[..."MART"].map((c, i) => <span key={i} style={{ display: "inline-block", animation: `wave 1.5s ease-in-out ${(i + 7) * 0.06}s infinite` }}>{c === ' ' ? '\u00A0' : c}</span>)}</span>
        </h1>
        <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "800", letterSpacing: "3px", textTransform: "uppercase", marginTop: "4px", whiteSpace: "nowrap" }}>
          {[..."ERP System"].map((c, i) => <span key={i} style={{ display: "inline-block", animation: `wave 1.5s ease-in-out ${(i + 11) * 0.06}s infinite` }}>{c === ' ' ? '\u00A0' : c}</span>)}
        </div>
      </div>
    </div>
  );

  const CloudStatusBadge = () => {
    if (!isOnline) {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#fef2f2", padding: "6px 12px", borderRadius: "6px", border: "1px solid #fca5a5", color: "#ef4444" }}>
          <span style={{ height: "8px", width: "8px", background: "#ef4444", borderRadius: "50%", display: "inline-block" }}></span> 
          Mất mạng (Lưu Offline)
        </div>
      );
    }
    if (syncStatus === 'syncing') {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#eff6ff", padding: "6px 12px", borderRadius: "6px", border: "1px solid #bfdbfe", color: "#3b82f6" }}>
          <span style={{ height: "8px", width: "8px", background: "#3b82f6", borderRadius: "50%", display: "inline-block", animation: "pulse-fast 1s infinite" }}></span> 
          Đang đồng bộ mây...
        </div>
      );
    }
    if (syncStatus === 'error') {
      return (
        <div onClick={syncAllOfflineData} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#fff7ed", padding: "6px 12px", borderRadius: "6px", border: "1px solid #fed7aa", color: "#ea580c", cursor: "pointer", color: "var(--text-main)" }} title="Bấm để thử lại">
          <span style={{ height: "8px", width: "8px", background: "#ea580c", borderRadius: "50%", display: "inline-block" }}></span> 
          Lỗi Đám mây 🔄
        </div>
      );
    }
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#ecfdf5", padding: "6px 12px", borderRadius: "6px", border: "1px solid #a7f3d0", color: "#059669" }}>
        <span style={{ height: "8px", width: "8px", background: "#10b981", borderRadius: "50%", display: "inline-block" }}></span> 
        Đã lưu Đám Mây
      </div>
    );
  };

  if (!isLoggedIn) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", position: "relative", overflow: "hidden" }}>
      <style>{styles}</style>
      <div className="spring-bg" style={{ background: "#ef4444", top: "-10%", left: "-10%" }}></div>
      <div className="spring-bg" style={{ background: "#fbbf24", bottom: "-10%", right: "-10%" }}></div>
      <div className="glass" style={{ padding: "40px", width: "100%", maxWidth: "380px", textAlign: "center", border: "4px solid #ef4444" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "30px" }}><HeaderLogo /></div>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <select value={shift} onChange={e => setShift(e.target.value)} style={{ padding: "14px", borderRadius: "10px", outline: "none", fontWeight: "bold" }}>
            <option value="Ca Sáng">🌅 Ca Sáng (06:00 - 14:00)</option>
            <option value="Ca Chiều">🌇 Ca Chiều (14:00 - 22:00)</option>
            <option value="Ca Tối">🌙 Ca Tối (22:00 - 06:00)</option>
          </select>
          <input type="number" placeholder="Tiền lẻ đầu ca (mặc định: 5.000.000đ)..." value={startingCash || ""} onChange={e => setStartingCash(Number(e.target.value))} style={{ padding: "14px", borderRadius: "10px", outline: "none", fontWeight: "bold", color: "#059669" }} />
          <input placeholder="Tên đăng nhập" value={authUsername} onChange={e => setAuthUsername(e.target.value)} style={{ padding: "14px", borderRadius: "10px", outline: "none" }} />
          <input type="password" placeholder="Mật khẩu" value={authPassword} onChange={e => setAuthPassword(e.target.value)} style={{ padding: "14px", borderRadius: "10px", outline: "none" }} />
          <button type="submit" style={{ padding: "14px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 6px rgba(220,38,38,0.3)" }}>MỞ CỬA BÁN HÀNG 🚀</button>
        </form>
      </div>
    </div>
  );

  return (
    <div onClick={() => { setOpenFilter(null); setShowSuggestions(false); setShowMainMenu(false) }}>
      <style>{styles}</style>
      <input type="text" id="search-barcode" style={{position:'absolute', opacity: 0, height: 0, width: 0}} />
      
      {/* VÙNG HIỂN THỊ MODAL BIẾN ĐỘNG DÒNG TIỀN */}
      {cashFlowModalInfo && (
        <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }} onClick={() => setCashFlowModalInfo(null)}>
          <div className="glass" style={{ padding: "25px", width: "500px", maxHeight: "80vh", display: "flex", flexDirection: "column", background: "var(--bg-glass)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "15px" }}>
              <h2 style={{ margin: 0, color: cashFlowModalInfo === 'TIỀN MẶT' ? "#059669" : "#3b82f6" }}>
                🧾 BIẾN ĐỘNG {cashFlowModalInfo} ({shift})
              </h2>
              <button onClick={() => setCashFlowModalInfo(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button>
            </div>
            
            <div style={{ overflowY: "auto", flex: 1 }}>
              {cashFlowDetails.length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>Chưa có phát sinh.</div>}
              {cashFlowDetails.map((item, idx) => (
                <div key={idx} style={{ padding: "10px", borderBottom: "1px dashed var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center", background: item.isStarting ? "var(--bg-input)" : "transparent" }}>
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: "13px", color: "var(--text-main)" }}>{item.reason}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{item.time}</div>
                  </div>
                  <div style={{ fontWeight: "900", fontSize: "15px", color: item.isPositive ? "#10b981" : "#ef4444" }}>
                    {item.isPositive ? '+' : ''}{item.amount.toLocaleString()}đ
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "2px dashed var(--border-glass)", textAlign: "right", fontSize: "16px" }}>
              Tổng kết: <b style={{ color: cashFlowModalInfo === 'TIỀN MẶT' ? "#059669" : "#3b82f6" }}>
                {cashFlowModalInfo === 'TIỀN MẶT' ? currentShiftStats.cash.toLocaleString() : currentShiftStats.transfer.toLocaleString()}đ
              </b>
            </div>
          </div>
        </div>
      )}

      {showInventoryModal && role === 'admin' && (
        <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div className="glass" style={{ padding: "25px", width: "700px", maxHeight: "85vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "15px" }}>
              <h2 style={{ margin: 0, color: "#10b981" }}>📦 KIỂM KHO (INVENTORY CHECK)</h2>
              <button onClick={() => setShowInventoryModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button>
            </div>
            <div style={{ background: "#fef2f2", padding: "10px", borderRadius: "8px", fontSize: "12px", color: "#b91c1c", marginBottom: "15px", border: "1px dashed #fca5a5" }}>
              <b>Hướng dẫn:</b> Nhập số lượng đếm được thực tế trên kệ. Hệ thống tự động bôi đỏ nếu có chênh lệch so với sổ sách.
            </div>
            <div style={{ overflowY: "auto", flex: 1, paddingRight: "5px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-glass)", color: "var(--text-muted)", textAlign: "left" }}>
                    <th style={{ padding: "8px" }}>Sản phẩm</th>
                    <th style={{ padding: "8px", textAlign: "center" }}>Kho PM</th>
                    <th style={{ padding: "8px", textAlign: "center" }}>Thực tế</th>
                    <th style={{ padding: "8px", textAlign: "center" }}>Chênh lệch</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const actual = actualStockInput[p.id] !== undefined ? actualStockInput[p.id] : p.stock;
                    const diff = actual - p.stock;
                    return (
                      <tr key={p.id} style={{ borderBottom: "1px dashed var(--border-glass)", background: diff !== 0 ? "rgba(250, 204, 21, 0.1)" : "transparent" }}>
                        <td style={{ padding: "8px", fontWeight: "bold" }}>{cleanName(p.name)} <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "normal" }}>{p.product_code}</div></td>
                        <td style={{ padding: "8px", textAlign: "center", color: "#3b82f6", fontWeight: "bold" }}>{p.stock}</td>
                        <td style={{ padding: "8px", textAlign: "center" }}>
                          <input type="number" value={actual} onChange={(e) => setActualStockInput(prev => ({...prev, [p.id]: Number(e.target.value)}))} style={{ width: "60px", padding: "6px", borderRadius: "6px", textAlign: "center", border: "1px solid var(--border-glass)", fontWeight: "bold" }} onFocus={e => e.target.select()} />
                        </td>
                        <td style={{ padding: "8px", textAlign: "center", fontWeight: "900", color: diff > 0 ? "#10b981" : (diff < 0 ? "#ef4444" : "var(--text-muted)") }}>
                          {diff > 0 ? `+${diff}` : diff}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "15px", borderTop: "1px dashed var(--border-glass)", paddingTop: "15px" }}>
              <button onClick={() => setActualStockInput({})} style={{ flex: 1, padding: "12px", background: "var(--border-glass)", color: "var(--text-main)", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>↺ Hủy thao tác</button>
              <button onClick={syncInventoryCheck} disabled={loading} style={{ flex: 2, padding: "12px", background: "#10b981", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>{loading ? "Đang đồng bộ..." : "💾 CẬP NHẬT CHÊNH LỆCH VÀO SỔ"}</button>
            </div>
          </div>
        </div>
      )}

      {showExpenseModal && (
        <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div className="glass" style={{ padding: "25px", width: "450px", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "15px" }}>
              <h2 style={{ margin: 0, color: "#ea580c" }}>💸 QUẢN LÝ CHI PHÍ</h2>
              <button onClick={() => setShowExpenseModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button>
            </div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
              <input placeholder="Tên (Điện, nước...)" value={expName} onChange={e => setExpName(e.target.value)} style={{ flex: 2, padding: "8px", borderRadius: "6px" }} />
              <input placeholder="Số tiền..." type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} style={{ flex: 1, padding: "8px", borderRadius: "6px" }} />
              <button onClick={addExpense} style={{ padding: "8px 15px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>+</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {expenses.map(e => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px dashed var(--border-glass)" }}>
                  <div><b>{e.name}</b> <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>({e.date})</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <b style={{ color: "#ef4444" }}>-{e.amount.toLocaleString()}đ</b> 
                    <button onClick={() => deleteExpense(e.id)} style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer" }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {showSupplierModal && (
        <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div className="glass" style={{ padding: "25px", width: "500px", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "15px" }}>
              <h2 style={{ margin: 0, color: "#3b82f6" }}>🏭 NHÀ CUNG CẤP</h2>
              <button onClick={() => setShowSupplierModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button>
            </div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "15px", flexWrap: "wrap" }}>
              <input placeholder="Tên Cty/Sale..." value={supName} onChange={e => setSupName(e.target.value)} style={{ flex: 1, padding: "8px", borderRadius: "6px" }} />
              <input placeholder="SĐT..." value={supPhone} onChange={e => setSupPhone(e.target.value)} style={{ flex: 1, padding: "8px", borderRadius: "6px" }} />
              <input placeholder="Mặt hàng..." value={supItem} onChange={e => setSupItem(e.target.value)} style={{ flex: "1 1 100%", padding: "8px", borderRadius: "6px" }} />
              <button onClick={addSupplier} style={{ width: "100%", padding: "10px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>LƯU THÔNG TIN</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {suppliers.map(s => (
                <div key={s.id} style={{ padding: "10px", borderBottom: "1px dashed var(--border-glass)", background: "var(--bg-input)", borderRadius: "8px", marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "14px" }}>
                    <span>{s.name}</span> <span style={{ color: "#3b82f6" }}>📞 {s.phone}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>📦 {s.item}</span> 
                    <button onClick={() => deleteSupplier(s.id)} style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer" }}>🗑️ Xóa</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {showMarketingModal && (
        <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div className="glass" style={{ padding: "25px", width: "450px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "15px" }}>
              <h2 style={{ margin: 0, color: "#8b5cf6" }}>📢 GỬI EMAIL MARKETING</h2>
              <button onClick={() => setShowMarketingModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button>
            </div>
            <div style={{ background: "#fef2f2", padding: "10px", borderRadius: "8px", fontSize: "11px", color: "#b91c1c", marginBottom: "15px", border: "1px dashed #ef4444" }}>
              <b>⚠️ Cảnh báo:</b> Giới hạn 200 mail/tháng. Chỉ nên dùng cho tệp Kim Cương/Vàng.
            </div>
            <label style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-muted)" }}>Nhóm KH:</label>
            <select value={marketingTier} onChange={e => setMarketingTier(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", marginTop: "5px", marginBottom: "15px" }}>
              <option value="Tất cả">Tất cả KH</option><option value="KIM CƯƠNG">Kim Cương</option><option value="VÀNG">Vàng</option><option value="BẠC">Bạc</option>
            </select>
            <label style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-muted)" }}>Nội dung:</label>
            <textarea value={marketingMsg} onChange={e => setMarketingMsg(e.target.value)} rows={5} placeholder="Ví dụ: Giảm giá..." style={{ width: "100%", padding: "10px", borderRadius: "8px", marginTop: "5px", marginBottom: "20px", boxSizing: "border-box", fontFamily: "inherit" }}></textarea>
            <button onClick={sendMarketingEmails} disabled={loading} style={{ width: "100%", padding: "12px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              {loading ? "Đang gửi..." : "🚀 GỬI CHIẾN DỊCH"}
            </button>
          </div>
        </div>
      )}
      
      {showSettings && role === 'admin' && (
        <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div className="glass" style={{ padding: "25px", width: "450px", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "15px" }}>
              <h2 style={{ margin: 0, color: "#334155" }}>⚙️ CÀI ĐẶT</h2>
              <button onClick={() => setShowSettings(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, paddingRight: "5px" }}>
              <h3 style={{ fontSize: "14px", color: "#ef4444", borderBottom: "1px dashed #ef4444", paddingBottom: "4px" }}>1. ĐỔI MẬT KHẨU</h3>
              <div style={{ marginBottom: "10px" }}>
                <label style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-muted)" }}>Mật khẩu Quản lý:</label>
                <input value={newAdminPass} onChange={e => setNewAdminPass(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", boxSizing: "border-box", marginTop: "4px" }} />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-muted)" }}>Mật khẩu Thu ngân:</label>
                <input value={newStaffPass} onChange={e => setNewStaffPass(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", boxSizing: "border-box", marginTop: "4px" }} />
              </div>
              <h3 style={{ fontSize: "14px", color: "#10b981", borderBottom: "1px dashed #10b981", paddingBottom: "4px" }}>2. QR THANH TOÁN</h3>
              <div style={{ marginBottom: "10px" }}>
                <label style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-muted)" }}>Ngân hàng:</label>
                <select value={newBankBin} onChange={e => setNewBankBin(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", boxSizing: "border-box", marginTop: "4px" }}>
                  <option value="970422">MBBank</option><option value="970436">Vietcombank</option><option value="970407">Techcombank</option><option value="970415">VietinBank</option><option value="970418">BIDV</option><option value="970405">Agribank</option><option value="970416">ACB</option><option value="970432">VPBank</option><option value="970423">TPBank</option><option value="970403">Sacombank</option><option value="970441">VIB</option><option value="970443">SHB</option><option value="970431">Eximbank</option><option value="970426">MSB</option><option value="970437">HDBank</option><option value="970428">Nam A Bank</option><option value="970412">PVcomBank</option><option value="970414">OceanBank</option><option value="970433">Vietbank</option>
                </select>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-muted)" }}>Số tài khoản:</label>
                <input value={newBankAcc} onChange={e => setNewBankAcc(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", boxSizing: "border-box", marginTop: "4px" }} />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-muted)" }}>Tên chủ thẻ:</label>
                <input value={newBankNameStr} onChange={e => setNewBankNameStr(e.target.value.toUpperCase())} style={{ width: "100%", padding: "8px", borderRadius: "6px", boxSizing: "border-box", marginTop: "4px" }} />
              </div>
              <button onClick={saveSettings} style={{ width: "100%", padding: "12px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>💾 LƯU CÀI ĐẶT</button>
            </div>
          </div>
        </div>
      )}
      
      {showStatsModal && (
        <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div className="glass" style={{ padding: "25px", width: "600px", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <h2 style={{ margin: 0, color: "#3b82f6" }}>📊 BÁO CÁO</h2>
                <input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "11px", border: "1px solid var(--border-glass)" }}/> 
                <span style={{fontSize: "12px", fontWeight:"bold", color: "var(--text-muted)"}}>đến</span> 
                <input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "11px", border: "1px solid var(--border-glass)" }}/>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={exportToCSV} style={{ fontSize: "10px", padding: "6px 10px", background: "#10b981", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>📥 XUẤT EXCEL</button>
                <button onClick={sendInventoryAlertEmail} style={{ fontSize: "10px", padding: "6px 10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }} title="Gửi mail các món sắp hết hạn/hết hàng">🚨 CẢNH BÁO KHO</button>
                <button onClick={handleSendEmailReport} style={{ fontSize: "10px", padding: "6px 10px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>📧 GỬI MAIL BC</button>
                <button onClick={() => setShowStatsModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)", marginLeft: "5px" }}>✖</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "15px" }}>
              <div style={{ background: "#eff6ff", padding: "10px", borderRadius: "8px", border: "1px solid #bfdbfe", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#3b82f6", fontWeight: "bold" }}>DOANH THU KỲ</div>
                <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1e3a8a", marginTop: "4px" }}>{filteredStats.totalSales.toLocaleString()}đ</div>
              </div>
              <div style={{ background: "#fef2f2", padding: "10px", borderRadius: "8px", border: "1px solid #fecaca", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#ef4444", fontWeight: "bold" }}>CHI PHÍ KỲ</div>
                <div style={{ fontSize: "14px", fontWeight: "bold", color: "#b91c1c", marginTop: "4px" }}>-{filteredStats.expenses.toLocaleString()}đ</div>
              </div>
              <div style={{ background: "#f0fdf4", padding: "10px", borderRadius: "8px", border: "1px solid #bbf7d0", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#16a34a", fontWeight: "bold" }}>LỢI NHUẬN RÒNG</div>
                <div style={{ fontSize: "14px", fontWeight: "bold", color: "#14532d", marginTop: "4px" }}>{filteredStats.netProfit.toLocaleString()}đ</div>
              </div>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 5px 0" }}>📈 Doanh thu 30 ngày qua (Toàn thời gian)</h3>
              <div className="chart-container-scroll">
                {chartData.map((d, i) => (
                  <div key={i} className="chart-bar-group">
                    <div className="chart-val" style={{ visibility: d.showLabel && d.total > 0 ? 'visible' : 'hidden' }}>{(d.total / 1000).toFixed(0)}k</div>
                    <div className="chart-bar" style={{ height: d.height }}></div>
                    <div className="chart-label" style={{ visibility: d.showLabel ? 'visible' : 'hidden' }}>{d.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: "20px" }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "12px", margin: "0 0 8px 0", color: "var(--text-main)" }}>🏆 Top Bán Chạy</h3>
                {topSelling.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--border-glass)", fontSize: "11px" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>{idx + 1}. {item[0]}</span>
                    <span style={{ fontWeight: "bold", color: "#10b981" }}>{item[1]}</span>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "12px", color: "#b91c1c", margin: "0 0 8px 0" }}>📉 Sắp hết hàng</h3>
                {products.filter(p => p.stock > 0 && p.stock < 10).slice(0, 5).map((p, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--border-glass)", fontSize: "11px" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>{cleanName(p.name)}</span>
                    <span style={{ fontWeight: "bold", color: "#ef4444" }}>Còn {p.stock}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showHandoverModal && (
        <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div className="glass" style={{ padding: "30px", width: "350px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 15px 0", color: "#ef4444", fontSize: "22px" }}>📋 CHỐT CA</h2>
            <div style={{ background: "var(--bg-input)", padding: "15px", borderRadius: "10px", border: "1px dashed var(--border-glass)", textAlign: "left", fontSize: "14px", lineHeight: "1.8" }}>
              <div>👤 Người trực: <b>{role === 'admin' ? "Quản lý" : "Thu ngân"}</b></div>
              <div>⏰ Ca: <b style={{ color: "#b91c1c" }}>{shift}</b></div>
              <div>💵 Tiền đầu ca: <b style={{ color: "#059669" }}>{startingCash.toLocaleString()}đ</b></div>
              <div style={{ borderTop: "1px solid var(--border-glass)", margin: "10px 0" }}></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>💵 Tổng thu ca:</span><b style={{ color: "#059669", fontSize: "16px" }}>{currentShiftStats.rev.toLocaleString()}đ</b></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)" }}><span>- Tiền mặt:</span><b>{currentShiftStats.cash.toLocaleString()}đ</b></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}><span>- Chuyển khoản:</span><b>{currentShiftStats.transfer.toLocaleString()}đ</b></div>
              {role === 'admin' && <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed var(--border-glass)", paddingTop: "8px" }}><span>📈 Lợi nhuận:</span><b style={{ color: "#3b82f6" }}>{currentShiftStats.prof.toLocaleString()}đ</b></div>}
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={() => setShowHandoverModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "var(--border-glass)", fontWeight: "bold", cursor: "pointer", color: "var(--text-main)" }}>Hủy</button>
              <button onClick={confirmHandover} style={{ flex: 2, padding: "12px", background: "#ef4444", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>✔️ ĐĂNG XUẤT</button>
            </div>
          </div>
        </div>
      )}
      
      {showCustomerModal && (
        <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div className="glass" style={{ padding: "25px", width: "600px", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #c7d2fe", paddingBottom: "10px", marginBottom: "10px" }}>
              <h2 style={{ margin: 0, color: "#4f46e5" }}>🤝 QUẢN LÝ KHÁCH HÀNG</h2>
              <button onClick={() => setShowCustomerModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {Object.keys(customers).length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>Chưa có KH.</div>}
              {Object.keys(customers).map(phone => {
                const c = customers[phone]; const tier = getCustomerTier(c.totalSpent || 0);
                return (
                  <div key={phone} style={{ padding: "12px", borderBottom: "1px dashed #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", background: tier.bg, borderRadius: "8px", marginBottom: "8px", border: `1px solid ${tier.border}` }}>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ fontWeight: "bold", color: "#1e293b", cursor: "pointer", fontSize: "15px" }} onClick={() => { const newName = window.prompt("Sửa tên:", c.name); if (newName) { const newC = { ...c, name: newName }; setCustomers((prev: any) => ({ ...prev, [phone]: newC })); logAudit("SỬA KH", `Đổi tên KH`) } }} title="Sửa tên">{c.name} ✏️</div>
                        <span style={{ fontSize: "10px", fontWeight: "900", color: tier.color, border: `1px solid ${tier.color}`, padding: "2px 6px", borderRadius: "12px", background: "#fff" }}>{tier.name}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                        <span onClick={() => handleEditPhone(phone)} style={{ cursor: "pointer", fontWeight: "bold" }} title="Đổi SĐT">📞 {phone} ✏️</span>
                        <span style={{ cursor: "pointer", color: "#3b82f6", fontWeight: "bold", marginLeft: "10px" }} onClick={() => { const newEmail = window.prompt("Sửa Email:", c.email || ""); if (newEmail !== null) { const newC = { ...c, email: newEmail.trim() }; setCustomers((prev: any) => ({ ...prev, [phone]: newC })); logAudit("SỬA EMAIL", `Cập nhật Email KH`) } }} title="Cập nhật Email">{c.email ? `📧 ${c.email}` : `📧 +Thêm Mail`}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span onClick={() => { const newCard = window.prompt("Mã Thẻ:", c.cardCode || ""); if (newCard !== null) { const newC = { ...c, cardCode: newCard.trim() }; setCustomers((prev: any) => ({ ...prev, [phone]: newC })); logAudit("SỬA MÃ THẺ", `Cập nhật mã thẻ`) } }} style={{ cursor: "pointer", color: "#ea580c", fontWeight: "bold", marginRight: "10px" }} title="Mã thẻ">{c.cardCode ? `💳 Mã: ${c.cardCode}` : `💳 +Gán Mã Thẻ`}</span>
                        <button onClick={() => printCustomerCard(phone)} style={{ padding: "4px 6px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "9px", fontWeight: "bold" }}>🖨️ In Thẻ</button>
                        <button onClick={() => sendCardEmail(phone)} style={{ padding: "4px 6px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "9px", fontWeight: "bold" }}>📧 Mail</button>
                        <button onClick={() => shareToZalo(phone)} style={{ padding: "4px 6px", background: "#059669", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "9px", fontWeight: "bold" }}>💬 Zalo</button>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#475569", fontSize: "10px", marginBottom: "4px" }}>Đã chi tiêu: <b style={{ color: "#0f172a" }}>{(c.totalSpent || 0).toLocaleString()}đ</b></div>
                      <div style={{ color: "#10b981", fontWeight: "bold", fontSize: "12px" }}>Ví: {(c.wallet || 0).toLocaleString()}đ</div>
                      <div style={{ color: "#ef4444", fontWeight: "bold", fontSize: "12px" }}>Nợ: {(c.debt || 0).toLocaleString()}đ</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
      
      {showDebtModal && (
        <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div className="glass" style={{ padding: "25px", width: "400px", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #fed7aa", paddingBottom: "10px", marginBottom: "10px" }}>
              <h2 style={{ margin: 0, color: "#ef4444" }}>📓 SỔ NỢ</h2>
              <button onClick={() => setShowDebtModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {Object.keys(customers).filter(p => (customers[p].debt || 0) > 0).map(phone => (
                <div key={phone} style={{ padding: "10px", borderBottom: "1px dashed var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "bold" }}>{customers[phone].name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{phone}</div>
                    <div style={{ color: "#ef4444", fontWeight: "bold" }}>Nợ: {(customers[phone].debt || 0).toLocaleString()}đ</div>
                  </div>
                  <button onClick={() => handlePayDebt(phone)} style={{ padding: "6px 12px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" }}>THU TIỀN</button>
                </div>
              ))}
              {Object.keys(customers).filter(p => (customers[p].debt || 0) > 0).length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>Không có nợ.</div>}
            </div>
          </div>
        </div>
      )}
      
      {showAuditModal && (
        <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div className="glass" style={{ padding: "25px", width: "650px", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "10px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <h2 style={{ margin: 0, color: "#334155" }}>🕵️ NHẬT KÝ HỆ THỐNG</h2>
                <button onClick={exportAuditToCSV} style={{ fontSize: "10px", padding: "4px 8px", background: "#10b981", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>📥 XUẤT FILE</button>
              </div>
              <button onClick={() => setShowAuditModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button>
            </div>
            
            <div style={{ overflowY: "auto", flex: 1, fontSize: "12px", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "5px", background: "var(--bg-input)" }}>
              {auditLogs.length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>Chưa có bản ghi nào.</div>}
              {auditLogs.map((log, idx) => (
                <div key={idx} onClick={() => setSelectedAuditLog(log)} style={{ padding: "10px", borderBottom: "1px dashed var(--border-glass)", cursor: "pointer", transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontWeight: "bold", color: "#b91c1c" }}>[{log.action}]</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{log.time}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: "10px" }}>{log.detail}</span>
                    <span style={{ fontWeight: "bold", color: "#3b82f6" }}>{log.user_name} ({log.shift})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedAuditLog && (
        <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10000 }} onClick={() => setSelectedAuditLog(null)}>
           <div className="glass" style={{ padding: "20px", width: "450px", maxWidth: "90%", background: "var(--bg-glass)" }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: "0 0 10px 0", color: "#ef4444", borderBottom: "1px dashed var(--border-glass)", paddingBottom: "5px" }}>Chi tiết thao tác</h3>
              <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
                 <p style={{ margin: "5px 0" }}><b>Hành động:</b> {selectedAuditLog.action}</p>
                 <p style={{ margin: "5px 0" }}><b>Người thực hiện:</b> {selectedAuditLog.user_name} - {selectedAuditLog.shift}</p>
                 <p style={{ margin: "5px 0" }}><b>Thời gian:</b> {selectedAuditLog.time}</p>
                 <p style={{ margin: "5px 0" }}><b>Tóm tắt:</b> <span style={{ color: "#3b82f6" }}>{selectedAuditLog.detail}</span></p>
                 
                 {selectedAuditLog.extra_data && (
                    <div style={{ marginTop: "10px" }}>
                       <b style={{ color: "#059669", fontSize: "12px", display: "block", marginBottom: "5px" }}>Dữ liệu chi tiết:</b>
                       <div style={{ background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px", maxHeight: "250px", overflowY: "auto", padding: "10px" }}>
                         <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                           <tbody>
                             {Object.entries(JSON.parse(selectedAuditLog.extra_data)).map(([k, v]) => (
                               <tr key={k} style={{ borderBottom: "1px dashed var(--border-glass)" }}>
                                 <td style={{ padding: "6px 4px", fontWeight: "bold", color: "var(--text-muted)", width: "35%", verticalAlign: "top" }}>{k}</td>
                                 <td style={{ padding: "6px 4px", color: "var(--text-main)", wordBreak: "break-word" }}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       </div>
                    </div>
                 )}
              </div>
              <button onClick={() => setSelectedAuditLog(null)} style={{ marginTop: "15px", width: "100%", padding: "10px", background: "#e2e8f0", color: "#1e293b", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Đóng</button>
           </div>
        </div>
      )}
      
      {showHoldModal && (
        <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div className="glass" style={{ padding: "25px", width: "400px", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #fed7aa", paddingBottom: "10px", marginBottom: "10px" }}>
              <h2 style={{ margin: 0, color: "#f59e0b" }}>📂 ĐƠN LƯU TẠM</h2>
              <button onClick={() => setShowHoldModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {heldOrders.length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>Trống.</div>}
              {heldOrders.map((order, idx) => (
                <div key={order.id} style={{ padding: "10px", borderBottom: "1px dashed var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-input)", borderRadius: "8px", marginBottom: "8px" }}>
                  <div>
                    <div style={{ fontWeight: "bold" }}>Đơn #{idx + 1}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>⏰ {order.time}</div>
                    <div style={{ fontSize: "11px", color: "#b91c1c", fontWeight: "bold" }}>Gồm {order.cart.reduce((s: any, i: any) => s + (Number(i.qty) || 0), 0)} SP</div>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button onClick={() => restoreOrder(order)} style={{ padding: "6px 10px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" }}>MỞ</button>
                    <button onClick={() => deleteHeldOrder(order.id)} style={{ padding: "6px", background: "#fee2e2", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: "6px", cursor: "pointer", fontSize: "11px" }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {scannerMode !== null && (
        <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 10000 }}>
          <div style={{ background: "#fff", padding: "10px", borderRadius: "12px", width: "90%", maxWidth: "400px", position: "relative" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 10px 0", textAlign: "center", color: "#b91c1c" }}>{scannerMode === 'voucher' ? '📷 Quét mã Voucher' : (scannerMode === 'customer' ? '📷 Quét Thẻ VIP' : '📷 Đưa mã vạch vào khung')}</h3>
            {scanMessage && <div style={{ position: "absolute", top: "50px", left: "50%", transform: "translateX(-50%)", padding: "8px 16px", background: scanMessage.type === 'success' ? "#10b981" : "#ef4444", color: "#fff", fontWeight: "bold", borderRadius: "20px", zIndex: 10001, boxShadow: "0 4px 6px rgba(0,0,0,0.3)", animation: "float 0.5s ease-out" }}>{scanMessage.text}</div>}
            <div id="qr-reader" style={{ width: "100%" }}></div>
            <button onClick={() => setScannerMode(null)} style={{ width: "100%", padding: "12px", marginTop: "15px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>ĐÓNG CAMERA</button>
          </div>
        </div>
      )}
      
      {isCheckoutOpen && (
        <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          {checkoutStep === 1 && (
            <div className="glass" style={{ padding: "25px", width: "350px" }} onClick={e => e.stopPropagation()}>
              <h3 style={{ color: "#ef4444", margin: "0", textAlign: "center" }}>🧧 THANH TOÁN</h3>
              <div style={{ display: "flex", position: "relative", marginTop: "15px" }}>
                <input type="text" placeholder="👉 Quẹt mã Voucher..." value={voucherInput} onChange={(e) => setVoucherInput(e.target.value)} onKeyDown={handleVoucherSubmit} style={{ flex: 1, padding: "12px", borderRadius: "10px 0 0 10px", border: "2px dashed #f59e0b", outline: "none", boxSizing: "border-box" }} />
                <button onClick={() => setScannerMode('voucher')} style={{ padding: "0 15px", background: "#f59e0b", border: "none", borderRadius: "0 10px 10px 0", cursor: "pointer", color: "white", fontSize: "18px" }}>📷</button>
              </div>
              {appliedVoucherAmount > 0 && <div style={{ color: "#059669", fontSize: "12px", fontWeight: "bold", marginTop: "4px", textAlign: "center" }}>✅ Đã áp dụng giảm: {appliedVoucherAmount.toLocaleString()}đ</div>}
              <div style={{ display: "flex", position: "relative", marginTop: "10px" }}>
                <input type="text" placeholder="👉 Quẹt Thẻ VIP/SĐT..." value={customerInput} onChange={handleCustomerInputChange} style={{ flex: 1, padding: "12px", borderRadius: "10px 0 0 10px", border: "2px solid #ef4444", outline: "none", boxSizing: "border-box", fontWeight: "bold", color: "#b91c1c" }} />
                <button onClick={() => setScannerMode('customer')} style={{ padding: "0 15px", background: "#ef4444", border: "none", borderRadius: "0 10px 10px 0", cursor: "pointer", color: "white", fontSize: "18px" }}>📷</button>
              </div>
              {custPhone && (
                <div style={{ marginTop: "10px", padding: "12px", background: "var(--bg-input)", borderRadius: "8px", border: "1px dashed #f97316" }}>
                  {customers[custPhone] ? (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ color: "#b91c1c", fontWeight: "bold" }}>⭐ {customers[custPhone].name}</div>
                        <span style={{ fontSize: "9px", fontWeight: "900", color: getCustomerTier(customers[custPhone].totalSpent).color, border: `1px solid ${getCustomerTier(customers[custPhone].totalSpent).color}`, padding: "2px 4px", borderRadius: "8px", background: "#fff" }}>{getCustomerTier(customers[custPhone].totalSpent).name}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#059669", marginTop: "4px", fontWeight: "bold" }}>⚡ Giảm trực tiếp: {getCustomerTier(customers[custPhone].totalSpent).discountRate * 100}%</div>
                      <div style={{ marginTop: "4px" }}>Ví: <b>{Math.round(customers[custPhone].wallet || 0).toLocaleString()}đ</b> | Nợ: <b style={{ color: "#ef4444" }}>{(customers[custPhone].debt || 0).toLocaleString()}đ</b></div>
                      {(customers[custPhone].wallet || 0) > 0 && (
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", cursor: "pointer", color: "#ea580c", fontWeight: "bold" }}>
                          <input type="checkbox" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} /> Dùng điểm lì xì!
                        </label>
                      )}
                    </div>
                  ) : (
                    <input type="text" placeholder="Tên khách mới..." value={custName} onChange={e => setCustName(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", outline: "none", border: "1px solid #fdba74", boxSizing: "border-box" }} />
                  )}
                </div>
              )}
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button onClick={() => setIsCheckoutOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "var(--border-glass)", fontWeight: "bold", cursor: "pointer", color: "var(--text-main)" }}>Hủy</button>
                <button onClick={handleNextToQR} style={{ flex: 2, padding: "10px", background: "#ef4444", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>TIẾP TỤC 👉</button>
              </div>
            </div>
          )}
          
          {checkoutStep === 2 && (
            <div className="glass" style={{ padding: "25px", width: "350px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
              <h3 style={{ color: "#ef4444", margin: "0" }}>📱 THANH TOÁN</h3>
              <div style={{ color: "#ef4444", fontSize: "28px", fontWeight: "900", margin: "10px 0" }}>{finalToPay.toLocaleString()}đ</div>
              
              {finalToPay > 0 && (
                <div style={{ position: "relative" }}>
                  {isOnline ? (
                    <img src={`https://img.vietqr.io/image/${bankBin}-${bankAcc}-compact2.png?amount=${finalToPay - (Number(customerGiven) || 0) > 0 ? finalToPay - (Number(customerGiven) || 0) : finalToPay}&addInfo=Thanh toan&accountName=${encodeURIComponent(bankNameStr)}`} style={{ width: "160px", margin: "0 auto 10px auto", border: "2px solid #ef4444", borderRadius: "10px", display: "block", background: "#fff" }} alt="QR" />
                  ) : (
                    <div style={{ width: "160px", height: "160px", margin: "0 auto 10px auto", border: "2px dashed #ef4444", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", background: "#fef2f2", color: "#ef4444", fontSize: "12px", fontWeight: "bold", textAlign: "center", padding: "10px", boxSizing: "border-box" }}>🚫 Mất mạng<br />Không thể tải QR</div>
                  )}
                  <div style={{ animation: "pulse-fast 1.5s infinite", color: "#b45309", fontSize: "11px", fontWeight: "bold", marginBottom: "5px" }}>⏳ Đang chờ tiền...</div>
                </div>
              )}
              
              {finalToPay > 0 ? (
                <div style={{ marginBottom: "15px", textAlign: "left", borderTop: "1px dashed var(--border-glass)", paddingTop: "10px" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "bold", marginBottom: "5px" }}>Khách thanh toán Tiền mặt:</div>
                  <input type="number" placeholder="Nhập số tiền TM..." value={customerGiven} onChange={e => setCustomerGiven(Number(e.target.value) || "")} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-glass)", outline: "none", boxSizing: "border-box", fontSize: "14px", fontWeight: "bold" }} />
                  
                  {customerGiven !== "" && Number(customerGiven) < finalToPay && (
                    <div style={{ marginTop: "10px", padding: "10px", background: "#fffbeb", border: "1px dashed #f59e0b", borderRadius: "8px", color: "#d97706", fontSize: "11px", textAlign: "center", fontWeight: "bold" }}>
                      Còn thiếu: {(finalToPay - Number(customerGiven)).toLocaleString()}đ <br/> (Quét mã QR ở trên để trả phần còn thiếu)
                    </div>
                  )}

                  {customerGiven !== "" && Number(customerGiven) >= finalToPay && <div style={{ marginTop: "10px", padding: "10px", background: "#ecfdf5", border: "1px dashed #10b981", borderRadius: "8px", color: "#059669", fontWeight: "bold", fontSize: "16px", textAlign: "center" }}>THỐI LẠI: {(Number(customerGiven) - finalToPay).toLocaleString()}đ</div>}
                  
                  <div style={{ display: "flex", gap: "5px", marginTop: "8px", flexWrap: "wrap" }}>
                    <button onClick={() => setCustomerGiven(finalToPay)} style={{ flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid var(--border-glass)", cursor: "pointer", background: "var(--bg-input)", color: "var(--text-main)" }}>Vừa đủ</button>
                    <button onClick={() => setCustomerGiven(50000)} style={{ flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid var(--border-glass)", cursor: "pointer", background: "var(--bg-input)", color: "var(--text-main)" }}>50k</button>
                    <button onClick={() => setCustomerGiven(100000)} style={{ flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid var(--border-glass)", cursor: "pointer", background: "var(--bg-input)", color: "var(--text-main)" }}>100k</button>
                    <button onClick={() => setCustomerGiven(200000)} style={{ flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid var(--border-glass)", cursor: "pointer", background: "var(--bg-input)", color: "var(--text-main)" }}>200k</button>
                    <button onClick={() => setCustomerGiven(500000)} style={{ flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid var(--border-glass)", cursor: "pointer", background: "var(--bg-input)", color: "var(--text-main)" }}>500k</button>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: "15px", padding: "15px", background: "#ecfdf5", border: "1px dashed #10b981", borderRadius: "8px", color: "#059669", fontWeight: "bold" }}>✅ Đã thanh toán đủ bằng Ví/Voucher</div>
              )}
              
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", borderTop: "1px dashed var(--border-glass)", paddingTop: "10px" }}>
                <button onClick={() => setCheckoutStep(1)} style={{ flex: "1 1 100%", padding: "8px", borderRadius: "8px", border: "none", background: "#fca5a5", cursor: "pointer", fontWeight: "bold", color: "#b91c1c", marginBottom: "4px" }}>Quay lại</button>
                {finalToPay > 0 ? (
                  <>
                    {customerGiven !== "" && Number(customerGiven) > 0 && Number(customerGiven) < finalToPay ? (
                       <button onClick={() => confirmCheckout('KẾT HỢP')} disabled={loading} style={{ flex: "1 1 100%", padding: "12px", background: "#8b5cf6", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "12px" }}>💳 THANH TOÁN KẾT HỢP (TM + CK)</button>
                    ) : (
                       <>
                         <button onClick={() => confirmCheckout('GHI NỢ')} disabled={loading} style={{ flex: 1, padding: "10px", background: "#f59e0b", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "11px" }}>📝 GHI NỢ</button>
                         <button onClick={() => confirmCheckout('CHUYỂN KHOẢN')} disabled={loading} style={{ flex: 1, padding: "10px", background: "#3b82f6", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "11px" }}>💳 C.KHOẢN (F3)</button>
                         <button onClick={() => { if (finalToPay > 0 && (customerGiven === "" || Number(customerGiven) < finalToPay)) { playSound('error'); alert(`Khách đưa chưa đủ tiền!`); return } confirmCheckout('TIỀN MẶT') }} disabled={loading} style={{ flex: 1, padding: "10px", background: "#10b981", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "11px" }}>💵 T.MẶT (F2)</button>
                       </>
                    )}
                  </>
                ) : (
                  <button onClick={() => confirmCheckout('TIỀN MẶT')} disabled={loading} style={{ flex: "1 1 100%", padding: "12px", background: "#10b981", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "14px" }}>HOÀN TẤT ĐƠN HÀNG</button>
                )}
              </div>
            </div>
          )}
          
          {checkoutStep === 3 && (
            <div className="glass" style={{ padding: "30px", width: "350px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: "40px" }}>🌸</div>
              <h3 style={{ color: "#10b981", margin: "10px 0" }}>Thành công!</h3>
              <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
                <button onClick={() => { setPrintMode('receipt'); setTimeout(() => window.print(), 300) }} style={{ flex: 1, padding: "12px", background: "#ef4444", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "12px" }}>🖨️ In Bill</button>
                <button onClick={() => { setPrintMode('invoice_a4'); setTimeout(() => window.print(), 300) }} style={{ flex: 1, padding: "12px", background: "#3b82f6", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "12px" }}>🖨️ In A4</button>
                <button onClick={sendReceiptEmail} disabled={loading} style={{ flex: "1 1 100%", padding: "12px", background: "#8b5cf6", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "12px" }}>{loading ? "Đang gửi..." : "📧 Email Khách"}</button>
                <button onClick={closeCheckout} style={{ flex: "1 1 100%", padding: "12px", background: "var(--border-glass)", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "12px", color: "var(--text-main)" }}>Đóng</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🖨️ KHU VỰC IN ẨN */}
      {lastOrder && printMode === 'receipt' && (
        <div className="print-only">
          <div className="print-receipt-container">
            <div style={{ textAlign: "center", marginBottom: "8px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 900 }}>HẢI LÊ MART</h2>
              <div style={{ fontSize: "11px" }}>Tòa Nhà ATS, 252 Hoàng Quốc Việt, HN</div>
              <div style={{ fontSize: "11px" }}>Hotline: 0902 613 899</div>
            </div>
            <div style={{ borderBottom: "1px dashed #000", marginBottom: "8px" }}></div>
            <table style={{ width: "100%", fontSize: "11px", marginBottom: "4px", borderCollapse: "collapse" }}>
              <tbody>
                <tr><td style={{ textAlign: "left" }}><b>HĐ:</b> {lastOrder.orderId}</td><td style={{ textAlign: "right" }}><b>Ca:</b> {shift}</td></tr>
                <tr><td style={{ textAlign: "left" }}><b>Ngày:</b> {lastOrder.time}</td><td style={{ textAlign: "right" }}><b>TN:</b> {role}</td></tr>
              </tbody>
            </table>
            <div style={{ borderBottom: "1px dashed #000", marginBottom: "6px" }}></div>
            <div style={{ fontSize: "11px", marginBottom: "8px", lineHeight: "1.5" }}>
              {lastOrder.custPhone ? (
                <>
                  <div><b>Khách hàng:</b> {lastOrder.custName || 'Khách VIP'}</div>
                  <div><b>SĐT:</b> {lastOrder.custPhone}</div>
                  {customers[lastOrder.custPhone]?.email && <div><b>Email:</b> {customers[lastOrder.custPhone].email}</div>}
                </>
              ) : (
                <div><b>Khách hàng:</b> Khách lẻ</div>
              )}
            </div>
            <div style={{ borderBottom: "1px dashed #000", marginBottom: "8px" }}></div>
            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
              <tbody>
                {lastOrder.cart.map((i: any, x: number) => {
                  const p = i.priceIncludingVat !== undefined ? Math.round(i.priceIncludingVat / (1 + VAT_RATE)) : Math.round(getActualPrice(i.product)); 
                  const t = i.priceIncludingVat !== undefined ? Math.round(i.priceIncludingVat * i.qty) : Math.round((Number(i.qty) || 0) * p * (1 + VAT_RATE)); 
                  const g = parseGift(i.product.gift_info); const gQty = g.cond > 0 ? Math.floor(i.qty / g.cond) : 0;
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
            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
              <tbody>
                <tr><td style={{ padding: "2px 0" }}>Tiền hàng:</td><td style={{ textAlign: "right", padding: "2px 0" }}>{Math.round(lastOrder.subTotal).toLocaleString()}đ</td></tr>
                <tr><td style={{ padding: "2px 0" }}>VAT (10%):</td><td style={{ textAlign: "right", padding: "2px 0" }}>{Math.round(lastOrder.vatTotal).toLocaleString()}đ</td></tr>
                {lastOrder.discount > 0 && <tr><td style={{ padding: "2px 0" }}>Giảm giá/Ví:</td><td style={{ textAlign: "right", padding: "2px 0" }}>-{Math.round(lastOrder.discount).toLocaleString()}đ</td></tr>}
              </tbody>
            </table>
            <div style={{ borderBottom: "2px dashed #000", margin: "6px 0" }}></div>
            <table style={{ width: "100%", fontSize: "16px", fontWeight: 900, borderCollapse: "collapse" }}>
              <tbody>
                <tr><td>{lastOrder.debtAmount > 0 ? "NỢ:" : "TỔNG:"}</td><td style={{ textAlign: "right" }}>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</td></tr>
              </tbody>
            </table>
            
            <div style={{ marginTop: "6px", borderTop: "1px dotted #ccc", paddingTop: "4px", textAlign: "right", fontSize: "12px" }}>
              {lastOrder.paymentMethod === 'TIỀN MẶT' && <i>Tiền mặt</i>}
              {lastOrder.paymentMethod === 'CHUYỂN KHOẢN' && <i>Chuyển khoản (VietQR)</i>}
              {lastOrder.paymentMethod === 'KẾT HỢP' && <i>Thanh toán Kết hợp (TM: {lastOrder.customerGiven.toLocaleString()}đ, CK: {(lastOrder.finalTotal - lastOrder.customerGiven).toLocaleString()}đ)</i>}
            </div>

            {lastOrder.paymentMethod === 'TIỀN MẶT' && lastOrder.customerGiven > lastOrder.finalTotal && (
              <table style={{ width: "100%", fontSize: "12px", marginTop: "4px", borderCollapse: "collapse" }}>
                <tbody>
                  <tr><td>Khách đưa:</td><td style={{ textAlign: "right" }}>{Math.round(lastOrder.customerGiven).toLocaleString()}đ</td></tr>
                  <tr><td><b>Trả lại:</b></td><td style={{ textAlign: "right" }}><b>{Math.round(lastOrder.customerGiven - lastOrder.finalTotal).toLocaleString()}đ</b></td></tr>
                </tbody>
              </table>
            )}
            
            <div style={{ textAlign: "center", marginTop: "15px", fontSize: "11px" }}><b>CẢM ƠN QUÝ KHÁCH!</b><div style={{ fontSize: "9px", marginTop: "4px", color: "#666" }}>Powered by Hải Lê POS</div></div>
          </div>
        </div>
      )}

      {/* 🖨️ IN A4 INVOICE */}
      {printMode === 'invoice_a4' && lastOrder && (
        <div className="print-flex print-a4-container">
          <div style={{ width: "100%", fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #000", paddingBottom: "10px", marginBottom: "20px" }}>
              <div>
                <h1 style={{ margin: 0, color: "#dc2626", fontSize: "28px" }}>HẢI LÊ MART</h1>
                <p style={{ margin: "5px 0", fontSize: "14px" }}>Địa chỉ: Tòa Nhà ATS, 252 Hoàng Quốc Việt, Cầu Giấy, HN</p>
                <p style={{ margin: "5px 0", fontSize: "14px" }}>Hotline: 0902 613 899</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <h2 style={{ margin: 0, fontSize: "24px" }}>HÓA ĐƠN BÁN HÀNG</h2>
                <p style={{ margin: "5px 0", fontSize: "14px" }}>Số: <b>{lastOrder.orderId}</b></p>
                <p style={{ margin: "5px 0", fontSize: "14px" }}>Ngày: {lastOrder.time}</p>
              </div>
            </div>
            
            <div style={{ marginBottom: "20px", fontSize: "15px" }}>
              <p><b>Khách hàng:</b> {lastOrder.custName || "Khách lẻ"} {lastOrder.custPhone ? `(SĐT: ${lastOrder.custPhone})` : ""}</p>
              <p><b>Hình thức thanh toán:</b> {lastOrder.paymentMethod}</p>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  <th style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>STT</th>
                  <th style={{ border: "1px solid #000", padding: "10px", textAlign: "left" }}>Tên hàng hóa</th>
                  <th style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>SL</th>
                  <th style={{ border: "1px solid #000", padding: "10px", textAlign: "right" }}>Đơn giá</th>
                  <th style={{ border: "1px solid #000", padding: "10px", textAlign: "right" }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {lastOrder.cart.map((item: any, index: number) => {
                  const p = item.priceIncludingVat !== undefined ? Math.round(item.priceIncludingVat / (1 + VAT_RATE)) : Math.round(getActualPrice(item.product)); 
                  const t = item.priceIncludingVat !== undefined ? Math.round(item.priceIncludingVat * item.qty) : Math.round((Number(item.qty) || 0) * p * (1 + VAT_RATE)); 
                  return (
                    <tr key={index}>
                      <td style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>{index + 1}</td>
                      <td style={{ border: "1px solid #000", padding: "10px" }}>{cleanName(item.product.name)}</td>
                      <td style={{ border: "1px solid #000", padding: "10px", textAlign: "center" }}>{item.qty}</td>
                      <td style={{ border: "1px solid #000", padding: "10px", textAlign: "right" }}>{p.toLocaleString()}đ</td>
                      <td style={{ border: "1px solid #000", padding: "10px", textAlign: "right" }}>{t.toLocaleString()}đ</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px", fontSize: "15px" }}>
              <div style={{ textAlign: "center", width: "40%" }}>
                <b>Khách hàng</b><br/><span style={{ fontSize: "12px", color: "#666" }}>(Ký, ghi rõ họ tên)</span>
              </div>
              <div style={{ textAlign: "right", width: "50%" }}>
                <p>Cộng tiền hàng: {Math.round(lastOrder.subTotal).toLocaleString()}đ</p>
                <p>Thuế GTGT (10%): {Math.round(lastOrder.vatTotal).toLocaleString()}đ</p>
                {lastOrder.discount > 0 && <p>Chiết khấu/Giảm giá: -{Math.round(lastOrder.discount).toLocaleString()}đ</p>}
                <h3 style={{ borderTop: "2px solid #000", paddingTop: "10px" }}>TỔNG CỘNG: {Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</h3>
                <div style={{ textAlign: "center", marginTop: "40px" }}>
                  <b>Người bán hàng</b><br/><span style={{ fontSize: "12px", color: "#666" }}>(Ký, đóng dấu)</span>
                </div>
              </div>
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

      <div className="no-print" style={{ padding: "15px", position: "relative", minHeight: "100vh", overflowX: "auto" }}>
        <div style={{ maxWidth: "1500px", margin: "0 auto", minWidth: "1000px" }}>
          <div className="glass" style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "12px", borderBottom: "4px solid #ef4444" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <HeaderLogo />
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                {(new Date().getHours() >= 20 || new Date().getHours() < 6) && <span style={{ fontSize: "11px", background: "#fef08a", color: "#b45309", padding: "4px 8px", borderRadius: "4px", fontWeight: "bold" }}>🌙 HAPPY HOUR</span>}
                <div style={{ width: "2px", height: "30px", background: "var(--border-glass)" }}></div>
                <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                  {role === 'admin' && <div style={{ textAlign: "center", whiteSpace: "nowrap" }}><div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "bold" }}>VỐN</div><div style={{ fontSize: "15px", fontWeight: "900", color: "var(--text-main)" }}>{totalValue.toLocaleString()}đ</div></div>}
                  
                  {/* TIỀN MẶT CÓ THỂ CLICK */}
                  <div onClick={() => setCashFlowModalInfo('TIỀN MẶT')} style={{ textAlign: "center", whiteSpace: "nowrap", cursor: "pointer", padding: "4px", borderRadius: "6px" }} title="Xem biến động Tiền mặt" onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "bold" }}>TIỀN MẶT</div>
                    <div style={{ fontSize: "15px", fontWeight: "900", color: currentShiftStats.cash < 0 ? "#ef4444" : "#059669" }}>{currentShiftStats.cash.toLocaleString()}đ</div>
                  </div>
                  
                  {/* CHUYỂN KHOẢN CÓ THỂ CLICK */}
                  <div onClick={() => setCashFlowModalInfo('CHUYỂN KHOẢN')} style={{ textAlign: "center", whiteSpace: "nowrap", cursor: "pointer", padding: "4px", borderRadius: "6px" }} title="Xem biến động Chuyển khoản" onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "bold" }}>CHUYỂN KHOẢN</div>
                    <div style={{ fontSize: "15px", fontWeight: "900", color: "#3b82f6" }}>{currentShiftStats.transfer.toLocaleString()}đ</div>
                  </div>

                  {role === 'admin' && <div style={{ textAlign: "center", whiteSpace: "nowrap" }}><div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "bold" }}>LÃI</div><div style={{ fontSize: "15px", fontWeight: "900", color: currentShiftStats.prof < 0 ? "#ef4444" : "#ea580c" }}>{currentShiftStats.prof.toLocaleString()}đ</div></div>}
                </div>
                <div style={{ width: "2px", height: "30px", background: "var(--border-glass)" }}></div>
                
                <button onClick={() => setDarkMode(!darkMode)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }} title="Bật/tắt Giao diện tối">
                  {darkMode ? "☀️" : "🌙"}
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ textAlign: "right", lineHeight: "1.2", whiteSpace: "nowrap" }}>
                    <div style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text-main)" }}>{role === 'admin' ? "Quản lý" : "Thu ngân"}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{shift}</div>
                  </div>
                  <button onClick={handleLogoutClick} style={{ padding: "10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Đăng xuất">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                  </button>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", borderTop: "1px dashed var(--border-glass)", paddingTop: "12px", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ position: "relative" }}>
                <button onClick={(e) => { e.stopPropagation(); setShowMainMenu(!showMainMenu) }} style={{ padding: "8px 24px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "900", letterSpacing: "1px", cursor: "pointer", boxShadow: "0 4px 10px rgba(30,58,138,0.3)" }}>MENU</button>
                {showMainMenu && (
                  <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "110%", left: 0, background: "var(--bg-glass)", border: "1px solid var(--border-glass)", borderRadius: "10px", minWidth: "250px", boxShadow: "0 10px 25px rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", flexDirection: "column", padding: "8px" }}>
                    {role === 'admin' && <div onClick={() => { setShowMainMenu(false); setShowStatsModal(true) }} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "10px" }}><span style={{ fontSize: "16px" }}>📊</span> Báo Cáo Doanh Thu</div>}
                    {role === 'admin' && <div onClick={() => { setShowMainMenu(false); setShowCustomerModal(true) }} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "10px" }}><span style={{ fontSize: "16px" }}>🤝</span> Quản Lý Khách Hàng VIP</div>}
                    {role === 'admin' && <div onClick={() => { setShowMainMenu(false); setShowInventoryModal(true) }} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "10px", color: "#10b981" }}><span style={{ fontSize: "16px" }}>📦</span> Kiểm Kho Định Kỳ</div>}
                    <div onClick={() => { setShowMainMenu(false); setShowDebtModal(true) }} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "10px", color: "#ef4444" }}><span style={{ fontSize: "16px" }}>📓</span> Sổ Nợ Khách Hàng</div>
                    {role === 'admin' && <div onClick={() => { setShowMainMenu(false); setShowAuditModal(true) }} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", borderBottom: "1px dashed var(--border-glass)", display: "flex", alignItems: "center", gap: "10px" }}><span style={{ fontSize: "16px" }}>🕵️</span> Lịch Sử Thao Tác</div>}
                    {role === 'admin' && (
                      <>
                        <div onClick={() => { setShowMainMenu(false); setShowExpenseModal(true) }} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "10px" }}><span style={{ fontSize: "16px" }}>💸</span> Nhập Chi Phí (Điện/Nước)</div>
                        <div onClick={() => { setShowMainMenu(false); setShowSupplierModal(true) }} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "10px" }}><span style={{ fontSize: "16px" }}>🏭</span> Danh Sách Nhà Cung Cấp</div>
                        <div onClick={() => { setShowMainMenu(false); setShowMarketingModal(true) }} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", borderBottom: "1px dashed var(--border-glass)", color: "#8b5cf6", display: "flex", alignItems: "center", gap: "10px" }}><span style={{ fontSize: "16px" }}>📢</span> Gửi Email Marketing</div>
                        <div onClick={() => { setShowMainMenu(false); setNewAdminPass(adminPass); setNewStaffPass(staffPass); setNewBankBin(bankBin); setNewBankAcc(bankAcc); setNewBankNameStr(bankNameStr); setShowSettings(true) }} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "10px" }}><span style={{ fontSize: "16px" }}>⚙️</span> Cài Đặt Hệ Thống</div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "15px", alignItems: "center", fontSize: "12px", fontWeight: "bold", color: "var(--text-muted)" }}>
                {role === 'admin' && lowStockCount > 0 && <div className="noti-bell" onClick={() => setShowStatsModal(true)} title="Có mặt hàng sắp hết!"><span style={{ fontSize: "20px" }}>🔔</span><span className="noti-badge">{lowStockCount}</span></div>}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-input)", padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--border-glass)", fontFamily: "monospace" }}>
                  <span style={{ fontSize: "14px" }}>⏱️</span> {currentTime.toLocaleTimeString('vi-VN')} - {currentTime.toLocaleDateString('vi-VN')}
                </div>
                <CloudStatusBadge />
              </div>
            </div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "7fr 3fr", gap: "10px" }}>
            <div className="glass" style={{ padding: "12px" }}>
              <div style={{ display: "flex", gap: "15px", marginBottom: "15px", alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1, display: "flex" }}>
                  <input id="search-barcode" placeholder="👉 QUẸT MÃ VẠCH (F1)..." value={barcodeInput} onChange={e => { setBarcodeInput(e.target.value); setShowSuggestions(true) }} onKeyDown={handleBarcodeSubmit} onClick={() => setShowSuggestions(true)} style={{ flex: 1, padding: "10px 15px", borderRadius: "6px 0 0 6px", border: "2px solid #ef4444", fontSize: "14px", fontWeight: "bold", outline: "none", boxSizing: "border-box", color: "#ef4444" }} />
                  <button onClick={() => setScannerMode('product')} style={{ padding: "0 15px", background: "#ef4444", border: "none", borderRadius: "0 6px 6px 0", cursor: "pointer", color: "white", fontSize: "18px" }}>📷</button>
                  {showSuggestions && barcodeInput.trim() !== "" && (
                    <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg-glass)", border: "1px solid #ef4444", borderRadius: "6px", marginTop: "4px", zIndex: 100, maxHeight: "250px", overflowY: "auto", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}>
                      {products.filter(p => cleanName(p.name).toLowerCase().includes(barcodeInput.toLowerCase()) || (p.product_code && p.product_code.toLowerCase().includes(barcodeInput.toLowerCase()))).slice(0, 10).map((p, idx) => (
                        <div key={idx} onClick={() => handleSelectSuggest(p)} style={{ padding: "8px 12px", borderBottom: "1px solid var(--border-glass)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }} onMouseEnter={e => e.currentTarget.style.background = 'var(--border-glass)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div>
                            <div style={{ fontWeight: "bold", color: "var(--text-main)", fontSize: "13px" }}>{cleanName(p.name)}</div>
                            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Tồn: <b style={{ color: p.stock < 10 ? "#ef4444" : "#10b981" }}>{p.stock}</b></div>
                          </div>
                          <div style={{ fontWeight: "bold", color: "#ef4444", fontSize: "13px" }}>{getActualPrice(p).toLocaleString()}đ</div>
                        </div>
                      ))}
                      {products.filter(p => cleanName(p.name).toLowerCase().includes(barcodeInput.toLowerCase()) || (p.product_code && p.product_code.toLowerCase().includes(barcodeInput.toLowerCase()))).length === 0 && (
                        <div style={{ padding: "10px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>Không tìm thấy sản phẩm</div>
                      )}
                    </div>
                  )}
                </div>
                {role === 'admin' && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div onClick={() => setShowInputForm(!showInputForm)} style={{ padding: "10px 15px", borderRadius: "6px", fontWeight: "bold", color: "#ef4444", cursor: "pointer", border: "1px dashed #ef4444", fontSize: "12px", display: "flex", alignItems: "center" }}>{showInputForm ? "➖ ĐÓNG" : "➕ NHẬP LẺ"}</div>
                    <label style={{ cursor: "pointer", padding: "10px 15px", borderRadius: "6px", fontWeight: "bold", color: "#10b981", border: "1px dashed #10b981", fontSize: "12px", display: "flex", alignItems: "center" }}>📁 TỪ FILE<input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: "none" }} /></label>
                    <button onClick={downloadSampleCSV} style={{ padding: "10px 15px", borderRadius: "6px", fontWeight: "bold", color: "#3b82f6", cursor: "pointer", border: "1px dashed #3b82f6", fontSize: "12px", display: "flex", alignItems: "center", background: "transparent" }}>📥 FILE MẪU</button>
                  </div>
                )}
              </div>

              {showInputForm && role === 'admin' && (
                <form onSubmit={handleAddProduct} style={{ background: "var(--bg-input)", padding: "15px", borderRadius: "8px", border: "1px solid var(--border-glass)", marginBottom: "15px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">MÃ SẢN PHẨM</span><input placeholder="VD: SP001" value={newCode} onChange={handleCodeChange} style={{ padding: "8px", borderRadius: "4px" }} /></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">TÊN HÀNG HÓA</span><input placeholder="VD: Bia Tiger" value={newName} onChange={e => setNewName(e.target.value)} style={{ padding: "8px", borderRadius: "4px" }} /></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">PHÂN LOẠI</span><input list="category-list" placeholder="Chọn / Nhập..." value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ padding: "8px", borderRadius: "4px" }} /><datalist id="category-list">{categories.filter(c => c !== 'Tất cả').map(c => <option key={c} value={c} />)}</datalist></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">GIÁ VỐN (Đ)</span><input type="number" placeholder="0" value={newImportPrice} onChange={e => setNewImportPrice(e.target.value)} style={{ padding: "8px", borderRadius: "4px" }} /></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">GIÁ BÁN (Đ)</span><input type="number" placeholder="0" value={newPrice} onChange={e => setNewPrice(e.target.value)} style={{ padding: "8px", borderRadius: "4px" }} /></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 0.8fr 80px", gap: "10px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label-red">GIÁ KHUYẾN MÃI</span><input type="number" placeholder="0 (Bỏ trống)" value={newPromoPrice} onChange={e => setNewPromoPrice(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ef4444" }} /></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">HẠN SỬ DỤNG</span><input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} style={{ padding: "8px", borderRadius: "4px", fontFamily: "sans-serif" }} /></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label-green">ĐIỀU KIỆN & QUÀ TẶNG</span><div style={{ display: "flex", gap: "4px" }}><input type="number" placeholder="Từ..." value={newGiftCondition} onChange={e => setNewGiftCondition(e.target.value)} style={{ width: "45px", padding: "8px", borderRadius: "4px", border: "1px solid #10b981" }} title="Số lượng cần mua" /><input type="text" placeholder="Tên quà..." value={newGiftInfo} onChange={e => setNewGiftInfo(e.target.value)} style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #10b981" }} /></div></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">SỐ LƯỢNG NHẬP</span><input type="number" placeholder="0" value={newStock} onChange={e => setNewStock(e.target.value)} style={{ padding: "8px", borderRadius: "4px" }} /></div>
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}><button type="submit" disabled={loading} style={{ padding: "8px", height: "35px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>LƯU</button></div>
                  </div>
                </form>
              )}

              <div style={{ display: "flex", gap: "8px", marginBottom: "15px", overflowX: "auto", paddingBottom: "4px" }}>
                {categories.map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`tab-btn ${selectedCategory === cat ? 'active' : ''}`}>{cat}</button>)}
              </div>

              <div style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ color: "#10b981", fontSize: "10px", borderBottom: "2px solid var(--border-glass)", position: "sticky", top: 0, background: "var(--bg-glass)", zIndex: 1 }}>
                      <th style={{ textAlign: "left", padding: "10px 4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", width: "max-content" }}>
                          <span onClick={() => requestSort('name')} style={{ cursor: "pointer", userSelect: "none" }}>SẢN PHẨM</span>{renderHeaderIcon('name')}
                        </div>
                        {renderFilterPopup('name', 'TÊN SẢN PHẨM', uniqueNames)}
                      </th>
                      <th style={{ textAlign: "center", padding: "10px 4px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                          <span onClick={() => requestSort('stock')} style={{ cursor: "pointer", userSelect: "none" }}>TỒN</span>{renderHeaderIcon('stock')}
                        </div>
                        {renderFilterPopup('stock', 'SỐ LƯỢNG TỒN', uniqueStocks)}
                      </th>
                      {role === 'admin' && (
                        <th style={{ textAlign: "center", padding: "10px 4px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                            <span onClick={() => requestSort('import_price')} style={{ cursor: "pointer", userSelect: "none" }}>GIÁ VỐN</span>{renderHeaderIcon('import_price')}
                          </div>
                          {renderFilterPopup('import_price', 'GIÁ VỐN', uniqueImportPrices, (v) => v.toLocaleString() + 'đ')}
                        </th>
                      )}
                      <th style={{ textAlign: "center", padding: "10px 4px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                          <span onClick={() => requestSort('sale_price')} style={{ cursor: "pointer", userSelect: "none" }}>GIÁ BÁN</span>{renderHeaderIcon('sale_price')}
                        </div>
                        {renderFilterPopup('sale_price', 'GIÁ BÁN', uniqueSalePrices, (v) => v.toLocaleString() + 'đ')}
                      </th>
                      <th style={{ textAlign: "center", padding: "10px 4px", lineHeight: "1.2" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                          <span onClick={() => requestSort('expiry_date')} style={{ cursor: "pointer", userSelect: "none" }}>HẠN SỬ DỤNG</span>{renderHeaderIcon('expiry_date')}
                        </div>
                        {renderFilterPopup('expiry_date', 'HẠN SỬ DỤNG', uniqueExpiries, (v) => v ? new Date(v).toLocaleDateString('vi-VN') : '---')}
                      </th>
                      <th style={{ textAlign: "right", padding: "10px 4px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAndFilteredProducts.map(p => {
                      const isP = p.promo_price > 0; const d = Math.floor(Math.abs(new Date().getTime() - new Date(p.created_at).getTime()) / 86400000); const isOutOfStock = p.stock <= 0; const isNearExpiry = p.expiry_date && (new Date(p.expiry_date).getTime() - new Date().getTime()) / 86400000 <= 45 && !isOutOfStock; const isLowStock = p.stock > 0 && p.stock < 10; const gift = parseGift(p.gift_info); let dText = "Mới nhập hôm nay"; if (d === 1) dText = "Nhập hôm qua"; else if (d > 1) dText = `${d} ngày trước`;
                      return (
                        <tr key={p.id} style={{ borderBottom: "1px solid var(--border-glass)", background: isNearExpiry ? "rgba(239, 68, 68, 0.1)" : "transparent" }}>
                          <td style={{ padding: "12px 4px" }}>
                            <div style={{ fontSize: "14px", fontWeight: "bold" }}>
                              {role === 'admin' ? p.name : cleanName(p.name)} {isNearExpiry && <span style={{ color: "#ef4444", fontSize: "9px", border: "1px solid #ef4444", padding: "1px 2px", borderRadius: "2px" }}>⚠️</span>} {p.isHappyHour && <span style={{ color: "#ea580c", fontSize: "9px", fontStyle: "italic" }}>[Giờ Vàng]</span>}
                            </div>
                            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                              {p.product_code} • <span style={{ cursor: role === 'admin' ? 'pointer' : 'default', textDecoration: role === 'admin' ? 'underline' : 'none' }} onClick={() => role === 'admin' && handleEdit(p.id, 'category', p.category || "Khác", true)}>{p.category || "Khác"}</span>
                            </div>
                            {gift.text ? (
                              <div style={{ fontSize: "10px", color: "#10b981", fontWeight: "bold", cursor: role === 'admin' ? 'pointer' : 'default', marginTop: "2px" }} onClick={() => role === 'admin' && handleEdit(p.id, 'gift_info', p.gift_info, true)}>
                                🎁 Tặng: {gift.text} {gift.cond > 1 ? `(Mua ≥ ${gift.cond})` : ''}
                              </div>
                            ) : (
                              role === 'admin' && <div style={{ fontSize: "9px", color: "var(--border-glass)", cursor: "pointer", marginTop: "2px" }} onClick={() => handleEdit(p.id, 'gift_info', '', true)}>+ Thêm quà</div>
                            )}
                          </td>
                          <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "14px", color: isOutOfStock ? "var(--text-muted)" : (isLowStock ? "#ef4444" : "var(--text-main)") }}>
                            {p.stock} {isLowStock && <span title="Sắp hết hàng" style={{ fontSize: "10px" }}>📉</span>}
                          </td>
                          {role === 'admin' && <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>{p.import_price?.toLocaleString()}</td>}
                          <td style={{ textAlign: "center" }}>
                            <div style={{ color: isP ? "var(--text-muted)" : "#10b981", textDecoration: isP ? "line-through" : "none", fontSize: isP ? "11px" : "14px", fontWeight: "bold", cursor: role === 'admin' ? "pointer" : "default" }} onClick={() => role === 'admin' && handleEdit(p.id, 'sale_price', p.sale_price)}>{p.sale_price.toLocaleString()}</div>
                            {isP ? (
                              <div style={{ color: "#ef4444", fontWeight: "900", fontSize: "14px", cursor: role === 'admin' ? "pointer" : "default" }} onClick={() => role === 'admin' && handleEdit(p.id, 'promo_price', p.promo_price)}>🔥 {p.promo_price.toLocaleString()}</div>
                            ) : (
                              role === 'admin' && <div style={{ fontSize: "9px", color: "var(--border-glass)", cursor: "pointer", marginTop: "2px" }} onClick={() => handleEdit(p.id, 'promo_price', 0)}>🏷️ +Thêm KM</div>
                            )}
                          </td>
                          <td style={{ textAlign: "center", fontSize: "11px" }}>
                            <div style={{ color: isNearExpiry ? "#ef4444" : "#b91c1c", fontWeight: "bold", cursor: role === 'admin' ? "pointer" : "default" }} onClick={() => role === 'admin' && handleEdit(p.id, 'expiry_date', p.expiry_date, true)}>
                              {isOutOfStock ? "---" : (p.expiry_date ? new Date(p.expiry_date).toLocaleDateString('vi-VN') : "---")}
                            </div>
                            <div style={{ color: "var(--text-muted)", marginTop: "2px" }}>{isOutOfStock ? "---" : dText}</div>
                          </td>
                          <td style={{ textAlign: "right", padding: "12px 4px" }}>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                              <button className="add-to-cart-btn" onClick={() => addToCart(p)}>+ GIỎ</button>
                              {role === 'admin' && <button onClick={() => handlePrintBarcode(p)} style={{ padding: "6px 8px", background: "var(--border-glass)", color: "var(--text-main)", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "11px" }} title="In tem mã vạch">🖨️ Tem</button>}
                              {role === 'admin' && <button onClick={() => handleDelete(p.id, p.name)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "14px", padding: 0 }}>🗑️</button>}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="glass" style={{ padding: "15px", flex: 1.5, minHeight: "45vh", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "2px dashed var(--border-glass)", paddingBottom: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <h3 style={{ margin: 0, color: "#ef4444", fontSize: "15px", textTransform: "uppercase" }}>🛒 GIỎ HÀNG ({cart.reduce((s, i) => s + (Number(i.qty) || 0), 0)} món)</h3>
                    {custName && <div style={{ fontSize: "11px", color: "#10b981", fontWeight: "bold", marginTop: "2px" }}>👤 VIP: {custName} <span style={{ cursor: "pointer", color: "#ef4444", marginLeft: "4px" }} onClick={() => { setCustName(""); setCustPhone(""); setCustomerInput("") }} title="Xóa khách khỏi giỏ">✖</span></div>}
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {heldOrders.length > 0 && <button onClick={() => setShowHoldModal(true)} style={{ fontSize: "10px", padding: "6px 8px", background: "var(--bg-input)", color: "#f59e0b", border: "1px solid #fde68a", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>📂 TẠM LƯU ({heldOrders.length})</button>}
                    {cart.length > 0 && <button onClick={handleHoldOrder} style={{ fontSize: "10px", padding: "6px 8px", background: "var(--bg-input)", color: "#ea580c", border: "1px solid #fdba74", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>⏸️ LƯU TẠM (F4)</button>}
                    {cart.length > 0 && <button onClick={clearCart} style={{ fontSize: "10px", padding: "6px 8px", background: "var(--bg-input)", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>🗑️ HỦY HẾT</button>}
                  </div>
                </div>
                
                {cartTotalAmountDisplay > 0 && (
                  <div style={{ background: "rgba(239, 68, 68, 0.1)", padding: "12px 15px", borderRadius: "8px", border: "1px solid #fecaca", marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "12px", fontWeight: "bold", color: "#ef4444" }}>TỔNG CỘNG:</span>
                      <div style={{ fontSize: "24px", fontWeight: "900", color: "#ef4444" }}>{cartTotalAmountDisplay.toLocaleString()}đ</div>
                    </div>
                    <button onClick={() => { setIsCheckoutOpen(true); setCheckoutStep(1) }} style={{ padding: "12px 25px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>THANH TOÁN</button>
                  </div>
                )}
                
                <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
                  {cart.length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "12px", marginTop: "15px" }}>Giỏ hàng trống</div>}
                  {cart.map((item, idx) => {
                    const gift = parseGift(item.product.gift_info); const gQty = gift.cond > 0 ? Math.floor(item.qty / gift.cond) : 0; const hasGift = gift.text && gQty > 0;
                    return (
                      <div key={idx} style={{ padding: "8px 0", borderBottom: "1px dashed var(--border-glass)", fontSize: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: "bold", color: "var(--text-main)", flex: 1, fontSize: "13px" }}>{cleanName(item.product.name)} {item.product.isHappyHour && <span style={{ color: "#ea580c", fontSize: "10px" }}>[Giờ Vàng]</span>}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button className="qty-btn" style={{background:"var(--border-glass)", border:"none", borderRadius:"4px", cursor:"pointer", color: "var(--text-main)"}} onClick={() => adjustCartQty(item.product.id, -1)}>-</button>
                            <input className="qty-input" style={{ fontSize: "13px", padding: "4px 0", width: "32px", background:"var(--bg-input)", color:"var(--text-main)", border:"1px solid var(--border-glass)" }} type="number" value={item.qty} onChange={e => handleDirectQtyChange(item.product.id, e.target.value)} onBlur={e => handleDirectQtyBlur(item.product.id, e.target.value)} onFocus={e => e.target.select()} title="Bấm để nhập số lượng" />
                            <button className="qty-btn" style={{background:"var(--border-glass)", border:"none", borderRadius:"4px", cursor:"pointer", color: "var(--text-main)"}} onClick={() => adjustCartQty(item.product.id, 1)}>+</button>
                            <button onClick={() => removeFromCart(item.product.id)} style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", fontSize: "18px", marginLeft: "4px", fontWeight: "bold" }}>×</button>
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                          <span>{hasGift && <span style={{ color: "#10b981", fontSize: "10px", fontStyle: "italic" }}>+ 🎁 Tặng: {gQty} x {gift.text}</span>}</span>
                          <span style={{ color: "#ef4444", fontWeight: "bold", fontSize: "14px" }}>{Math.round(item.total).toLocaleString()}đ</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              <div className="glass" style={{ padding: "15px", height: "35vh", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", gap: "8px", flex: 1 }}>
                    <input placeholder="🔍 Tìm giao dịch..." value={logSearchTerm} onChange={e => setLogSearchTerm(e.target.value)} style={{ padding: "6px 10px", borderRadius: "6px", outline: "none", fontSize: "12px", flex: 1 }} />
                    <select value={logTypeFilter} onChange={e => setLogTypeFilter(e.target.value)} style={{ padding: "6px", borderRadius: "6px", outline: "none", fontSize: "12px", fontWeight: "bold" }}>
                      <option value="Tất cả">Tất cả</option><option value="BÁN">Bán hàng</option><option value="NHẬP">Nhập hàng</option><option value="TRẢ HÀNG">Trả hàng</option><option value="GHI NỢ">Ghi nợ</option><option value="THU NỢ">Thu nợ</option>
                    </select>
                    <button onClick={exportToCSV} style={{ padding: "6px 10px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" }} title="Xuất toàn bộ lịch sử">📥 EXCEL</button>
                  </div>
                </div>
                
                <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
                  {Object.keys(groupedHistory).length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "11px", marginTop: "15px" }}>Không tìm thấy dữ liệu phù hợp</div>}
                  {Object.keys(groupedHistory).map((date) => (
                    <div key={date}>
                      <div onClick={() => toggleDateGroup(date)} style={{ background: "var(--bg-input)", padding: "6px 10px", fontSize: "11px", fontWeight: "bold", border: "1px solid var(--border-glass)", borderRadius: "4px", marginTop: "6px", display: "flex", justifyContent: "space-between", cursor: "pointer", color: "#f59e0b" }}>
                        <span>📅 {date}</span><span>{expandedDates[date] ?? true ? "▼" : "▶"}</span>
                      </div>
                      {(expandedDates[date] ?? true) && (
                        <div style={{ padding: "0 4px" }}>
                          {groupedHistory[date].map((log: any) => (
                            <div key={log.id} style={{ fontSize: "11px", padding: "6px 0", borderBottom: "1px dashed var(--border-glass)", display: "flex", flexDirection: "column" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                                <span><b style={{ color: log.type === 'TRẢ HÀNG' ? '#ef4444' : 'var(--text-main)' }}>[{log.type}]</b> {cleanName(log.name)} {log.qty>0&&`x${log.qty}`} {log.refunded_qty > 0 && <span style={{ color: "#ef4444", fontSize: "9px" }}>(Đã hoàn {log.refunded_qty})</span>}</span>
                                {log.type === "BÁN" && <span style={{ color: "#10b981", fontWeight: "bold" }}>+{Math.round(log.total).toLocaleString()} <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "normal" }}>({log.paymentMethod === 'CHUYỂN KHOẢN' ? 'CK' : (log.paymentMethod === 'KẾT HỢP' ? 'KH' : 'TM')})</span></span>}
                                {log.type === "TRẢ HÀNG" && <span style={{ color: "#ef4444", fontWeight: "bold" }}>{Math.round(log.total).toLocaleString()} <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "normal" }}>({log.paymentMethod === 'VÍ ĐIỂM' ? 'VÍ' : (log.paymentMethod === 'CHUYỂN KHOẢN' ? 'CK' : 'TM')})</span></span>}
                                {log.type === "GHI NỢ" && <span style={{ color: "#ea580c", fontWeight: "bold" }}>Nợ: {Math.round(log.total).toLocaleString()}</span>}
                                {log.type === "THU NỢ" && <span style={{ color: "#10b981", fontWeight: "bold" }}>+{Math.round(log.total).toLocaleString()} <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "normal" }}>({log.paymentMethod === 'CHUYỂN KHOẢN' ? 'CK' : 'TM'})</span></span>}
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", marginTop: "4px", width: "100%" }}>
                                <span>{log.customer}</span>
                                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                  <span>{log.t}</span>
                                  {log.type === 'BÁN' && log.product_id !== 'DISCOUNT' && (
                                    <>
                                      <button onClick={() => handleRefund(log.id)} disabled={(log.refunded_qty || 0) >= log.qty} style={{ fontSize: "9px", padding: "2px 6px", border: "1px solid var(--border-glass)", background: (log.refunded_qty || 0) >= log.qty ? "var(--bg-main)" : "var(--bg-input)", color: (log.refunded_qty || 0) >= log.qty ? "var(--text-muted)" : "var(--text-main)", cursor: (log.refunded_qty || 0) >= log.qty ? "not-allowed" : "pointer", borderRadius: "4px" }}>
                                        {(log.refunded_qty || 0) >= log.qty ? "Đã hoàn" : `↩️ Hoàn ${log.qty - (log.refunded_qty || 0)}`}
                                      </button>
                                      <button onClick={() => handleReprint(log.time)} style={{ fontSize: "9px", padding: "2px 6px", border: "1px solid var(--border-glass)", background: "var(--bg-input)", color: "var(--text-main)", cursor: "pointer", borderRadius: "4px" }} title="In lại Hóa đơn thời điểm này">
                                        🖨️ In lại
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

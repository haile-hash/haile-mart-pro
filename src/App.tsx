/* eslint-disable */
// @ts-nocheck
import React, { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "./supabaseClient";

// ==========================================
// THIẾT BỊ CHỐNG SẬP (BẢO VỆ MÀN HÌNH TRẮNG)
// ==========================================
if (typeof window !== 'undefined') {
  window.onerror = function (message, source, lineno, colno, error) {
    document.body.innerHTML = `
      <div style="padding: 40px; background: #fef2f2; color: #b91c1c; font-family: sans-serif; min-height: 100vh;">
        <h2>🚨 HỆ THỐNG GẶP LỖI KHỞI ĐỘNG!</h2>
        <p>Giao diện không thể tải lên do một lỗi kỹ thuật (Không phải màn hình trắng nữa).</p>
        <div style="background: #fff; padding: 15px; border: 1px solid #fca5a5; border-radius: 8px; margin: 20px 0;">
          <b>Chi tiết lỗi:</b><br/>
          <pre style="white-space: pre-wrap;">${message}</pre>
          <p style="font-size: 12px; color: #666;">Vị trí: ${source} (Dòng ${lineno})</p>
        </div>
        <button onclick="localStorage.clear(); window.location.reload();" style="padding: 12px 24px; background: #ef4444; color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">DỌN RÁC BỘ NHỚ VÀ THỬ LẠI</button>
      </div>
    `;
    return true;
  };
}

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
    .print-barcode-sheet{display:flex!important;flex-wrap:wrap!important;justify-content:flex-start!important;gap:2mm!important;padding:2mm!important}
    .barcode-sticker{width:35mm!important;height:22mm!important;page-break-inside:avoid!important;border:1px dashed #ccc!important;padding:1mm!important;box-sizing:border-box!important;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;background:#fff!important;color:#000!important}
    .barcode-sticker img { max-width: 100%; height: 28px !important; margin-top: 2px !important; }
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

// HÀM TIỆN ÍCH HOISTING & BỌC THÉP
const safeArray = (arr: any) => Array.isArray(arr) ? arr : [];
const safeObject = (obj: any) => (obj && typeof obj === 'object' && !Array.isArray(obj)) ? obj : {};
const parseLocal = (key: string, defaultVal: any) => { try { const s = localStorage.getItem(key); return s && s !== "undefined" ? JSON.parse(s) : defaultVal; } catch(e) { return defaultVal; } };
const formatCategoryStr = (str: string) => { if (!str) return "Khác"; const t = String(str).trim(); return t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : "Khác"; };
const parseGift = (giftStr: string | null) => { if (!giftStr) return { cond: 0, text: "" }; const s = String(giftStr); if (s.includes(';;;')) { const parts = s.split(';;;'); return { cond: parseInt(parts[0]) || 1, text: parts[1] || "" } } return { cond: 1, text: s } };
const cleanName = (name: string) => name ? String(name).split(' [Lô')[0] : '';
const getActualPrice = (p: any) => { if (!p) return 0; let price = (p.promo_price && p.promo_price > 0) ? p.promo_price : p.sale_price; const currentHour = new Date().getHours(); if ((currentHour >= 20 || currentHour < 6) && (p.category === 'Đồ ăn liền' || p.category === 'Bánh Kẹo')) { price = price * 0.8; p.isHappyHour = true } else { p.isHappyHour = false } return Math.round(price) };
const getCustomerTier = (totalSpent = 0) => { if (totalSpent >= 500000000) return { name: "💎 KIM CƯƠNG", discountRate: 0.10, color: "#a855f7", bg: "#faf5ff", border: "#e9d5ff" }; if (totalSpent >= 200000000) return { name: "🥇 VÀNG", discountRate: 0.05, color: "#ca8a04", bg: "#fefce8", border: "#fef08a" }; if (totalSpent >= 50000000) return { name: "🥈 BẠC", discountRate: 0.02, color: "#475569", bg: "#f8fafc", border: "#cbd5e1" }; return { name: "🥉 ĐỒNG", discountRate: 0, color: "#b45309", bg: "#fffbeb", border: "#fde68a" } };
const playSound = (type: 'success' | 'error') => { try { const ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); if (type === 'success') { osc.frequency.value = 800; gain.gain.setValueAtTime(0.1, ctx.currentTime); osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1) } else { osc.frequency.value = 250; osc.type = 'square'; gain.gain.setValueAtTime(0.1, ctx.currentTime); osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3) } } catch (e) { } };

function MainApp() {
  const VAT_RATE = 0.1;
  const EMAILJS_SERVICE_ID = "service_7ie990l", EMAILJS_TEMPLATE_ID = "template_t91erhg", EMAILJS_TEMPLATE_VIP_ID = "template_m1j9i7k", EMAILJS_PUBLIC_KEY = "5ric0kxuwNPlUleAv";
  
  // STATE CƠ BẢN
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("mart_logged_in") === "true");
  const [role, setRole] = useState(() => localStorage.getItem("mart_role") || "staff");
  const [shift, setShift] = useState(() => localStorage.getItem("mart_shift") || "Ca Sáng");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [startingCash, setStartingCash] = useState<number>(() => Number(localStorage.getItem("mart_starting_cash")) || 0);
  const [adminPass, setAdminPass] = useState(() => localStorage.getItem("mart_admin_pass") || "haile88");
  const [staffPass, setStaffPass] = useState(() => localStorage.getItem("mart_staff_pass") || "123");
  const [bankBin, setBankBin] = useState(() => localStorage.getItem("mart_bank_bin") || "970422");
  const [bankAcc, setBankAcc] = useState(() => localStorage.getItem("mart_bank_acc") || "0680124181004");
  const [bankNameStr, setBankNameStr] = useState(() => localStorage.getItem("mart_bank_name") || "LE HONG HAI");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("mart_theme") === "dark");
  
  // STATE GIAO DIỆN
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
  
  // MODALS
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
  
  // SCANNER & CART
  const [scannerMode, setScannerMode] = useState<'product' | 'voucher' | 'customer' | null>(null);
  const [scannedCodeObj, setScannedCodeObj] = useState<any>(null);
  const [scanMessage, setScanMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [printBarcodeProduct, setPrintBarcodeProduct] = useState<any>(null);
  const [printCustomer, setPrintCustomer] = useState<any>(null);
  const [barcodeCount, setBarcodeCount] = useState<number>(30);
  const [printMode, setPrintMode] = useState<'receipt' | 'barcode' | 'customer_card' | null>(null);
  
  // FORM NHẬP HÀNG
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
  
  // CHI PHÍ & NCC
  const [expName, setExpName] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [supName, setSupName] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supItem, setSupItem] = useState("");
  const [marketingTier, setMarketingTier] = useState("Tất cả");
  const [marketingMsg, setMarketingMsg] = useState("");
  
  const [cart, setCart] = useState<any[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  
  // DỮ LIỆU LOCAL
  const [customers, setCustomers] = useState<any>(() => safeObject(parseLocal("mart_customers", {})));
  const [heldOrders, setHeldOrders] = useState<any[]>(() => safeArray(parseLocal("mart_held_orders", [])));
  const [auditLogs, setAuditLogs] = useState<any[]>(() => safeArray(parseLocal("mart_audit", [])));
  const [expenses, setExpenses] = useState<any[]>(() => safeArray(parseLocal("mart_expenses", [])));
  const [suppliers, setSuppliers] = useState<any[]>(() => safeArray(parseLocal("mart_suppliers", [])));
  const [history, setHistory] = useState<any[]>(() => safeArray(parseLocal("mart_history", [])));

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

  // KẾT THÚC KHAI BÁO STATE ==========================

  const logAudit = async (action: string, detail: string, extraData: any = null) => { 
    const newLog = { id: Date.now(), time: new Date().toLocaleString('vi-VN'), user_name: role === 'admin' ? 'Quản lý' : 'Thu ngân', shift, action, detail, extra_data: extraData ? JSON.stringify(extraData) : null }; 
    setAuditLogs(prev => [newLog, ...safeArray(prev)].slice(0, 300)); 
  };

  useEffect(() => {
    if (darkMode) { document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem("mart_theme", "dark"); }
    else { document.documentElement.removeAttribute('data-theme'); localStorage.setItem("mart_theme", "light"); }
  }, [darkMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLoggedIn || isCheckoutOpen || showAuditModal || showCustomerModal || showSettings || showInputForm) return;
      if (e.key === 'F1') { e.preventDefault(); document.getElementById('search-barcode')?.focus(); }
      if (e.key === 'F2') { e.preventDefault(); if (cart.length > 0) confirmCheckout('TIỀN MẶT'); }
      if (e.key === 'F3') { e.preventDefault(); if (cart.length > 0) confirmCheckout('CHUYỂN KHOẢN'); }
      if (e.key === 'F4') { e.preventDefault(); handleHoldOrder(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoggedIn, isCheckoutOpen, cart, showAuditModal, showCustomerModal, showSettings, showInputForm]);

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
      if (isObject) { formattedData = Object.keys(dataArray || {}).map(key => ({ phone: key, ...dataArray[key] })); } else { formattedData = safeArray(dataArray); }
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

      if (rCust.data && rCust.data.length > 0) { setCustomers((prev: any) => { const updated = { ...safeObject(prev) }; rCust.data.forEach((c: any) => { updated[c.phone] = { ...updated[c.phone], ...c }; }); return updated; }); }
      if (rHist.data) { setHistory(prev => { const cloudIds = new Set(rHist.data.map(h => h.id)); const localOnly = safeArray(prev).filter(h => !cloudIds.has(h.id)); return [...localOnly, ...rHist.data].sort((a, b) => b.id - a.id); }); }
      if (rExp.data) { setExpenses(prev => { const cloudIds = new Set(rExp.data.map(e => e.id)); const localOnly = safeArray(prev).filter(e => !cloudIds.has(e.id)); return [...localOnly, ...rExp.data].sort((a, b) => b.id - a.id); }); }
      if (rSup.data) { setSuppliers(prev => { const cloudIds = new Set(rSup.data.map(s => s.id)); const localOnly = safeArray(prev).filter(s => !cloudIds.has(s.id)); return [...localOnly, ...rSup.data].sort((a, b) => b.id - a.id); }); }
      if (rAud.data) { setAuditLogs(prev => { const cloudIds = new Set(rAud.data.map(a => a.id)); const localOnly = safeArray(prev).filter(a => !cloudIds.has(a.id)); return [...localOnly, ...rAud.data].sort((a, b) => b.id - a.id); }); }
      if (rHold.data) { setHeldOrders(prev => { const cloudIds = new Set(rHold.data.map(o => o.id)); const localOnly = safeArray(prev).filter(o => !cloudIds.has(o.id)); return [...localOnly, ...rHold.data].sort((a, b) => b.id - a.id); }); }
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

  const fetchProducts = async () => { const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false }); if (data) setProducts(data) };
  
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
          scanner.render((text: string) => { const now = Date.now(); if (now - lastScanTime < 1500) return; lastScanTime = now; setScannedCodeObj({ code: String(text || ""), time: now }) }, undefined)
        }
      };
      if (!(window as any).Html5QrcodeScanner) { const script = document.createElement("script"); script.src = "https://unpkg.com/html5-qrcode"; script.onload = loadScanner; document.head.appendChild(script) } else loadScanner();
      return () => { if (scanner) scanner.clear().catch(() => { }) }
    }
  }, [scannerMode]);
  
  const handleSelectSuggest = (p_input: any) => {
    const baseCode = String(p_input.product_code || "").split('-')[0];
    const totalStock = safeArray(products).filter(p => String(p.product_code || "") === baseCode || String(p.product_code || "").startsWith(`${baseCode}-`)).reduce((s, p) => s + p.stock, 0);
    if (totalStock <= 0) { playSound('error'); return alert("Đã hết hàng!"); }
    const price = getActualPrice(p_input); const repName = cleanName(String(p_input.name || ""));
    setCart(prev => {
      const exist = safeArray(prev).find(item => cleanName(String(item.product.name || "")) === repName);
      if (exist) {
        const newQty = exist.qty + 1;
        if (newQty > totalStock) { playSound('error'); return prev; }
        playSound('success'); 
        return safeArray(prev).map(i => cleanName(String(i.product.name || "")) === repName ? { ...i, qty: newQty, total: Math.round(newQty * price * (1 + VAT_RATE)) } : i);
      } else { 
        playSound('success'); 
        return [...safeArray(prev), { product: p_input, qty: 1, total: Math.round(price * (1 + VAT_RATE)) }]; 
      }
    });
    setScanMessage({ text: `✅ Thêm: ${repName}`, type: 'success' }); setBarcodeInput(""); setShowSuggestions(false); setTimeout(() => setScanMessage(null), 2000);
  };

  useEffect(() => {
    if (scannedCodeObj) {
      if (scannerMode === 'product') { 
        const p = findProductByCode(scannedCodeObj.code); 
        if (p) handleSelectSuggest(p); 
        else { 
          const matchedPhone = Object.keys(customers || {}).find(phone => phone === String(scannedCodeObj.code || "").trim() || (customers[phone].cardCode && String(customers[phone].cardCode) === String(scannedCodeObj.code || "").trim())); 
          if (matchedPhone) { 
            playSound('success'); setCustomerInput(customers[matchedPhone].cardCode || matchedPhone); setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); setScanMessage({ text: `✅ KH VIP: ${customers[matchedPhone].name}`, type: 'success' }) 
          } else { 
            playSound('error'); setScanMessage({ text: `❌ Lỗi mã`, type: 'error' }) 
          } 
          setTimeout(() => setScannerMode(null), 1500) 
        } 
      }
      else if (scannerMode === 'voucher') { 
        const code = String(scannedCodeObj.code || "").trim().toUpperCase(); const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 }; 
        if (VOUCHERS[code]) { 
          setAppliedVoucherAmount(VOUCHERS[code]); setVoucherInput(code); playSound('success'); setScanMessage({ text: `✅ Giảm ${VOUCHERS[code].toLocaleString()}đ`, type: 'success' }) 
        } else if (!isNaN(Number(code)) && Number(code) > 0) { 
          setAppliedVoucherAmount(Number(code)); setVoucherInput(code); playSound('success'); setScanMessage({ text: `✅ Giảm ${Number(code).toLocaleString()}đ`, type: 'success' }) 
        } else { 
          playSound('error'); alert("Mã Voucher không hợp lệ!"); setAppliedVoucherAmount(0) 
        } 
        setTimeout(() => setScannerMode(null), 1000) 
      }
      else if (scannerMode === 'customer') { 
        const val = String(scannedCodeObj.code || "").trim(); setCustomerInput(val); 
        const matchedPhone = Object.keys(customers || {}).find(phone => phone === val || (customers[phone].cardCode && String(customers[phone].cardCode) === val)); 
        if (matchedPhone) { 
          setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); playSound('success'); setScanMessage({ text: `✅ Nhận diện VIP: ${customers[matchedPhone].name}`, type: 'success' }) 
        } else { 
          setCustPhone(val); setCustName(""); playSound('success'); setScanMessage({ text: `✅ Đã quét mã (Khách mới)`, type: 'success' }) 
        } 
        setTimeout(() => setScannerMode(null), 1000) 
      }
      setScannedCodeObj(null); setTimeout(() => setScanMessage(null), 1500)
    }
  }, [scannedCodeObj, products, scannerMode]);

  useEffect(() => { const handleAfterPrint = () => setPrintMode(null); window.addEventListener("afterprint", handleAfterPrint); return () => window.removeEventListener("afterprint", handleAfterPrint) }, []);

  const todayStrStr = new Date().toLocaleDateString('vi-VN');
  
  const currentShiftStats = useMemo(() => { 
    const shiftLogs = safeArray(history).filter(h => h.time && String(h.time).includes(todayStrStr) && h.shift === shift); 
    let cashIn = 0, cashOut = 0, transferIn = 0, transferOut = 0, prof = 0, totalSales = 0; 
    
    shiftLogs.forEach(h => { 
      if (h.type === 'BÁN' || h.type === 'GHI NỢ') totalSales += h.total; 
      prof += (h.profit || 0);

      if (h.type === 'BÁN' || h.type === 'THU NỢ') { 
        if (h.paymentMethod === 'CHUYỂN KHOẢN') transferIn += h.total; 
        else if (h.paymentMethod === 'TIỀN MẶT') cashIn += h.total; 
        else if (h.paymentMethod === 'KẾT HỢP') {
           cashIn += (h.split_cash || 0);
           transferIn += (h.total - (h.split_cash || 0));
        }
      } else if (h.type === 'TRẢ HÀNG') {
         if (h.paymentMethod === 'CHUYỂN KHOẢN') transferOut += Math.abs(h.total);
         else if (h.paymentMethod === 'TIỀN MẶT') cashOut += Math.abs(h.total);
      }
    }); 
    
    const shiftExp = safeArray(expenses).filter(e => e.date === todayStrStr).reduce((s, e) => s + e.amount, 0); 
    const expectedCash = startingCash + cashIn - cashOut - shiftExp;
    const totalRev = cashIn + transferIn - cashOut - transferOut;

    return { startingCash, cashIn, cashOut, transferIn, transferOut, expectedCash, prof, totalSales, shiftExp, rev: totalRev } 
  }, [history, shift, todayStrStr, startingCash, expenses]);
  
  const todayStats = useMemo(() => { 
    const todayHistory = safeArray(history).filter(h => h.time && String(h.time).includes(todayStrStr)); 
    let cash = 0; let transfer = 0; let prof = 0; let totalSales = 0; 
    todayHistory.forEach(h => { 
      if (h.type === 'BÁN' || h.type === 'GHI NỢ') totalSales += h.total; 
      if (h.type === 'BÁN' || h.type === 'THU NỢ' || h.type === 'TRẢ HÀNG') { 
        if (h.paymentMethod === 'CHUYỂN KHOẢN') transfer += h.total; 
        else if (h.paymentMethod === 'TIỀN MẶT' || h.paymentMethod === 'KẾT HỢP') { 
          if(h.paymentMethod === 'KẾT HỢP' && h.split_cash) { 
            cash += h.split_cash; transfer += (h.total - h.split_cash); 
          } else { 
            cash += h.total; 
          } 
        } 
      } 
      prof += (h.profit || 0) 
    }); 
    const todayExp = safeArray(expenses).filter(e => e.date === todayStrStr).reduce((sum, e) => sum + e.amount, 0); 
    return { rev: cash + transfer, cash, transfer, prof, totalSales, expenses: todayExp, netProfit: prof - todayExp } 
  }, [history, expenses, todayStrStr]);
  
  const chartData = useMemo(() => { 
    const data = []; 
    for (let i = 29; i >= 0; i--) { 
      const d = new Date(); d.setDate(d.getDate() - i); const dStr = d.toLocaleDateString('vi-VN'); 
      const dayTotal = safeArray(history).filter(h => h.time && String(h.time).includes(dStr) && (h.type === 'BÁN' || h.type === 'GHI NỢ')).reduce((s, h) => s + h.total, 0); 
      data.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, total: dayTotal, showLabel: (i % 3 === 0 || i === 0) }) 
    } 
    const maxVal = Math.max(...data.map(d => d.total), 1); 
    return data.map(d => ({ ...d, height: `${(d.total / maxVal) * 100}%` })) 
  }, [history]);
  
  const topSelling = useMemo(() => { 
    const sales: Record<string, number> = {}; 
    safeArray(history).forEach(log => { 
      if ((log.type === 'BÁN' || log.type === 'GHI NỢ') && log.product_id !== 'DISCOUNT') {
        const baseName = cleanName(String(log.name || "")); sales[baseName] = (sales[baseName] || 0) + log.qty 
      }
    }); 
    return Object.entries(sales).sort((a, b) => b[1] - a[1]).slice(0, 5) 
  }, [history]);
  
  const groupedHistory = useMemo(() => { 
    let filtered = safeArray(history); 
    if (logTypeFilter !== "Tất cả") filtered = filtered.filter(log => log.type === logTypeFilter); 
    if (logSearchTerm.trim() !== "") { 
      const term = logSearchTerm.toLowerCase(); 
      filtered = filtered.filter(log => (log.name && String(log.name).toLowerCase().includes(term)) || (log.customer && String(log.customer).toLowerCase().includes(term)) || (log.id && String(log.id).includes(term))) 
    } 
    return filtered.reduce((groups: any, log: any) => { 
      const dateStr = log.time ? String(log.time).split(' ')[1] || log.time : "Không rõ";
      if (!groups[dateStr]) groups[dateStr] = []; 
      const timeOnly = log.time ? String(log.time).split(' ')[0] : "";
      groups[dateStr].push({ ...log, t: timeOnly }); 
      return groups 
    }, {}) 
  }, [history, logSearchTerm, logTypeFilter]);

  const totalValue = Math.round(safeArray(products).reduce((sum, p) => sum + ((Number(p.import_price) || 0) * (Number(p.stock) || 0)), 0));
  const lowStockCount = safeArray(products).filter(p => p.stock > 0 && p.stock < 10).length;
  const cartTotalAmountDisplay = safeArray(cart).reduce((sum, item) => sum + item.total, 0);
  const currentTier = getCustomerTier(customers[custPhone]?.totalSpent || 0);
  const tierDiscountAmount = custPhone ? Math.round(cartTotalAmountDisplay * currentTier.discountRate) : 0;
  const amountAfterTierAndVoucher = Math.max(0, cartTotalAmountDisplay - appliedVoucherAmount - tierDiscountAmount);
  const walletUsedAmount = useWallet ? Math.min(customers[custPhone]?.wallet || 0, amountAfterTierAndVoucher) : 0;
  const finalToPay = amountAfterTierAndVoucher - walletUsedAmount;

  const uniqueNames = useMemo(() => Array.from(new Set(safeArray(products).map(p => cleanName(String(p.name || ""))))).sort(), [products]);
  const uniqueStocks = useMemo(() => Array.from(new Set(safeArray(products).map(p => p.stock))).sort((a, b) => a - b), [products]);
  const uniqueImportPrices = useMemo(() => Array.from(new Set(safeArray(products).map(p => p.import_price || 0))).sort((a, b) => a - b), [products]);
  const uniqueSalePrices = useMemo(() => Array.from(new Set(safeArray(products).map(p => p.sale_price))).sort((a, b) => a - b), [products]);
  const uniqueExpiries = useMemo(() => Array.from(new Set(safeArray(products).map(p => p.expiry_date).filter(Boolean))).sort(), [products]);
  const categories = ["Tất cả", ...Array.from(new Set(safeArray(products).map(p => formatCategoryStr(p.category))))];
  
  const sortedAndFilteredProducts = useMemo(() => {
    const todayTime = new Date().getTime();
    let filtered = safeArray(products).filter(p => (selectedCategory === "Tất cả" || formatCategoryStr(p.category) === selectedCategory)).filter(p => String(p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (p.product_code && String(p.product_code || "").toLowerCase().includes(searchTerm.toLowerCase())));
    if (filters['name']?.length > 0) filtered = filtered.filter(p => filters['name'].includes(cleanName(String(p.name || ""))));
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
  
  const confirmHandover = () => { 
      logAudit("CHỐT CA", `Bàn giao két: ${currentShiftStats.expectedCash.toLocaleString()}đ`, { ...currentShiftStats }); 
      setIsLoggedIn(false); 
      setShowHandoverModal(false); 
      localStorage.removeItem("mart_logged_in"); 
      localStorage.removeItem("mart_role");
      localStorage.removeItem("mart_starting_cash");
      setStartingCash(0);
  };
  
  const handleEditPhone = async (oldPhone: string) => { const newPhone = window.prompt("Nhập SĐT mới:", oldPhone); if (newPhone && newPhone.trim() !== "" && newPhone !== oldPhone) { if (customers[newPhone]) return alert("❌ SĐT đã tồn tại!"); const cData = customers[oldPhone]; const newC = { ...cData, phone: newPhone }; setCustomers((prev: any) => { const updated = { ...safeObject(prev) }; updated[newPhone] = newC; delete updated[oldPhone]; return updated }); setHistory((prev: any) => safeArray(prev).map((h: any) => { if (h.customer && String(h.customer).includes(oldPhone)) { return { ...h, customer: String(h.customer).replace(oldPhone, newPhone) } } return h })); logAudit("SỬA SĐT KH", `Đổi ${oldPhone} -> ${newPhone}`); alert("✅ Cập nhật thành công! (Sẽ tự động đồng bộ lên Cloud)"); } };
  const addSupplier = async () => { if (!supName || !supPhone) return alert("Nhập đủ Tên/SĐT"); const newS = { id: Date.now(), name: supName, phone: supPhone, item: supItem }; setSuppliers(prev => [newS, ...safeArray(prev)]); setSupName(""); setSupPhone(""); setSupItem(""); logAudit("THÊM NCC", `${supName} - ${supPhone}`); alert("✅ Thêm NCC thành công!"); };
  const deleteSupplier = async (id: any) => { setSuppliers(prev => safeArray(prev).filter(s => s.id !== id)); if (navigator.onLine) await supabase.from('suppliers').delete().eq('id', id); };
  const addExpense = async () => { if (!expName || !expAmount) return alert("Nhập chi phí!"); const newE = { id: Date.now(), date: new Date().toLocaleDateString('vi-VN'), name: expName, amount: Number(expAmount) }; setExpenses(prev => [newE, ...safeArray(prev)]); setExpName(""); setExpAmount(""); logAudit("GHI CHI PHÍ", `${expName}: ${expAmount}đ`, newE); alert("✅ Đã ghi nhận!"); };
  const deleteExpense = async (id: any) => { setExpenses(prev => safeArray(prev).filter(e => e.id !== id)); if (navigator.onLine) await supabase.from('expenses').delete().eq('id', id); };
  
  const sendMarketingEmails = async () => {
    if (!marketingMsg) return alert("Nhập nội dung!");
    if (!window.confirm("Giới hạn 200 mail/tháng. Gửi?")) return;
    setLoading(true);
    const targetCustomers = Object.keys(customers || {}).filter(phone => {
      const c = customers[phone];
      if (!c.email) return false;
      if (marketingTier === "Tất cả") return true;
      return getCustomerTier(c.totalSpent).name.includes(marketingTier)
    });
    if (targetCustomers.length === 0) { setLoading(false); return alert("Không có KH!"); }
    let successCount = 0;
    for (const phone of targetCustomers) {
      const c = customers[phone];
      try {
        await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_VIP_ID, { to_email: c.email, order_id: "THÔNG BÁO ƯU ĐÃI", time: new Date().toLocaleString('vi-VN'), items_list: `💌 Lời nhắn từ Hải Lê Mart:\n\n${marketingMsg}`, total_amount: "Quà Tặng", payment_method: "Khách VIP", change_amount: "0đ", barcode_url: "" });
        successCount++
      } catch (e) { }
    }
    logAudit("GỬI MAIL MKT", `Gửi ${successCount} mail cho tập ${marketingTier}`);
    setLoading(false); setShowMarketingModal(false); alert(`✅ Đã gửi ${successCount} mail!`)
  };
  
  const saveSettings = () => { if (!newAdminPass || !newStaffPass || !newBankBin || !newBankAcc || !newBankNameStr) return alert("Điền đủ!"); setAdminPass(newAdminPass); localStorage.setItem("mart_admin_pass", newAdminPass); setStaffPass(newStaffPass); localStorage.setItem("mart_staff_pass", newStaffPass); setBankBin(newBankBin); localStorage.setItem("mart_bank_bin", newBankBin); setBankAcc(newBankAcc); localStorage.setItem("mart_bank_acc", newBankAcc); setBankNameStr(newBankNameStr); localStorage.setItem("mart_bank_name", newBankNameStr); logAudit("CÀI ĐẶT", "Cập nhật Cấu hình"); alert("✅ Đã lưu!"); setShowSettings(false) };
  
  const handleHoldOrder = async () => { if (cart.length === 0) return; const newO = { id: Date.now(), time: new Date().toLocaleTimeString('vi-VN'), cart: [...cart] }; setHeldOrders(prev => [...safeArray(prev), newO]); logAudit("LƯU TẠM", `Lưu giỏ ${cart.length} món`); setCart([]); setCustPhone(""); setCustName(""); setCustomerInput("") };
  const restoreOrder = async (order: any) => { if (cart.length > 0) return alert("Thanh toán giỏ hiện tại trước!"); setCart(order.cart); setHeldOrders(prev => safeArray(prev).filter(o => o.id !== order.id)); if (navigator.onLine) await supabase.from('held_orders').delete().eq('id', order.id); setShowHoldModal(false); };
  const deleteHeldOrder = async (id: any) => { setHeldOrders(prev => safeArray(prev).filter(o => o.id !== id)); logAudit("XÓA ĐƠN", `Xóa đơn lưu tạm`); if (navigator.onLine) await supabase.from('held_orders').delete().eq('id', id); };

  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => { document.getElementById('search-barcode')?.focus(); if (e.key === 'Enter') { e.preventDefault(); const p = findProductByCode(barcodeInput); if (p) handleSelectSuggest(p); else { const matchedPhone = Object.keys(customers || {}).find(phone => phone === barcodeInput.trim() || (customers[phone].cardCode && customers[phone].cardCode === barcodeInput.trim())); if (matchedPhone) { playSound('success'); setCustomerInput(customers[matchedPhone].cardCode || matchedPhone); setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); setBarcodeInput("") } else { playSound('error'); alert("Mã sai!") } } } };
  const addToCart = (p_input: any) => { handleSelectSuggest(p_input) };
  
  const adjustCartQty = (productId: any, delta: number) => {
    let exceedStock = false;
    setCart(prev => {
      const updated = safeArray(prev).map(item => {
        if (item.product.id === productId) {
          const baseCode = String(item.product.product_code || "").split('-')[0];
          const totalStock = safeArray(products).filter(p => String(p.product_code || "") === baseCode || String(p.product_code || "").startsWith(`${baseCode}-`)).reduce((s, p) => s + p.stock, 0);
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
      if (val === '') return safeArray(prev).map(i => i.product.id === productId ? { ...i, qty: '' as any, total: 0 } : i);
      let num = parseInt(val); if (isNaN(num) || num < 0) return prev;
      let exceedStock = false;
      const updated = safeArray(prev).map(i => {
        if (i.product.id === productId) {
          const baseCode = String(i.product.product_code || "").split('-')[0];
          const totalStock = safeArray(products).filter(p => String(p.product_code || "") === baseCode || String(p.product_code || "").startsWith(`${baseCode}-`)).reduce((s, p) => s + p.stock, 0);
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
  
  const handleDirectQtyBlur = (productId: any, val: string) => { if (val === '' || parseInt(val) <= 0 || isNaN(parseInt(val))) { setCart(prev => safeArray(prev).map(i => { if (i.product.id === productId) { const price = getActualPrice(i.product); return { ...i, qty: 1, total: Math.round(1 * price * (1 + VAT_RATE)) } } return i })) } };
  const removeFromCart = (productId: any) => { setCart(safeArray(cart).filter(item => item.product.id !== productId)) };
  const clearCart = () => { if (window.confirm("Hủy toàn bộ?")) { setCart([]); setCustName(""); setCustPhone(""); setCustomerInput("") } };
  const handleVoucherSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); const code = voucherInput.trim().toUpperCase(); const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 }; if (VOUCHERS[code]) { setAppliedVoucherAmount(VOUCHERS[code]); playSound('success') } else if (!isNaN(Number(code)) && Number(code) > 0) { setAppliedVoucherAmount(Number(code)); playSound('success') } else { playSound('error'); alert("Mã Voucher lỗi!"); setAppliedVoucherAmount(0) } } };
  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { const val = e.target.value; setCustomerInput(val); const matchedPhone = Object.keys(customers || {}).find(phone => phone === val.trim() || (customers[phone].cardCode && customers[phone].cardCode === val.trim())); if (matchedPhone) { setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); setUseWallet(false) } else { setCustPhone(val); setCustName(""); setUseWallet(false) } };
  const handleNextToQR = () => { if (cart.length === 0) return alert("Giỏ hàng trống!"); if (custPhone && !customers[custPhone] && !custName) return alert("Nhập Tên khách mới!"); setCheckoutStep(2) };

  const confirmCheckout = async (payMethod: 'TIỀN MẶT' | 'CHUYỂN KHOẢN' | 'GHI NỢ' | 'KẾT HỢP') => {
    if (safeArray(cart).some(i => !i.qty || i.qty <= 0)) { playSound('error'); return alert("Lỗi số lượng!") } if (payMethod === 'GHI NỢ' && !custPhone) return alert("Ghi nợ cần SĐT!");
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
      const baseCode = String(item.product.product_code || "").split('-')[0];
      const batches = safeArray(products).filter(p => String(p.product_code || "") === baseCode || String(p.product_code || "").startsWith(`${baseCode}-`)).sort((a, b) => { if (!a.expiry_date) return 1; if (!b.expiry_date) return -1; return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime() });
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

          logs.push({ id: baseTimestamp++, shift: shift, type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", name: cleanName(String(b.name || "")) + (item.product.isHappyHour ? ' [Giờ Vàng]' : ''), qty: take, total: Math.round(take * price * (1 + VAT_RATE)), profit: Math.round(take * (price - (b.import_price || 0))), customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: b.id, refunded_qty: 0, paymentMethod: payMethod, split_cash: splitCashAmt, time: new Date().toLocaleString('vi-VN') });
          remain -= take;
        }
      }
    }
    
    if (totalDiscount > 0) { logs.push({ id: baseTimestamp++, shift: shift, type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", name: "Giảm giá/Ví/VIP", qty: 1, total: -totalDiscount, profit: -totalDiscount, customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: 'DISCOUNT', refunded_qty: 0, paymentMethod: payMethod, time: new Date().toLocaleString('vi-VN') }) }
    
    if (custPhone) {
      const updatedCust = { name: custName, wallet: payMethod === 'GHI NỢ' ? (customers[custPhone]?.wallet || 0) : Math.round((customers[custPhone]?.wallet || 0) - walletUsedAmount + earned), debt: (customers[custPhone]?.debt || 0) + (payMethod === 'GHI NỢ' ? finalTotal : 0), totalSpent: (customers[custPhone]?.totalSpent || 0) + (payMethod !== 'GHI NỢ' ? finalTotal : 0), email: customers[custPhone]?.email || "", cardCode: customers[custPhone]?.cardCode || "" };
      setCustomers((prev: any) => ({ ...safeObject(prev), [custPhone]: updatedCust }));
    }
    setHistory(prev => [...logs, ...safeArray(prev)]);
    
    const finalOrderInfo = { orderId: orderIdStr, shift: shift, cart: [...cart], subTotal, vatTotal, finalTotal: payMethod === 'GHI NỢ' ? 0 : finalTotal, debtAmount: payMethod === 'GHI NỢ' ? finalTotal : 0, discount: totalDiscount, tierDiscountAmount: tierDiscountAmount, earnedWallet: custPhone ? earned : 0, custName: custPhone ? custName : null, custPhone: custPhone ? custPhone : null, time: new Date().toLocaleString('vi-VN'), paymentMethod: payMethod, customerGiven: Number(customerGiven) || 0 };
    setLastOrder(finalOrderInfo);
    logAudit("BÁN HÀNG", `Hóa đơn ${orderIdStr} - ${finalTotal.toLocaleString()}đ`, finalOrderInfo);
    
    setCheckoutStep(3); if (navigator.onLine) fetchProducts(); setLoading(false);
  };

  const handleRefund = async (logId: any) => {
    const logIndex = safeArray(history).findIndex(l => l.id === logId); if (logIndex === -1) return;
    const log = history[logIndex]; if (log.type !== 'BÁN') return alert("Chỉ hoàn đơn BÁN!");
    
    const maxRefund = log.qty - (log.refunded_qty || 0); if (maxRefund <= 0) return alert("Đã hoàn toàn bộ!");
    const qStr = window.prompt(`SP: ${cleanName(String(log.name || ""))}\nĐã mua: ${log.qty} | Có thể hoàn: ${maxRefund}\nNhập số lượng cần hoàn:`, maxRefund.toString());
    if (!qStr) return;
    const refundQty = parseInt(qStr);
    if (isNaN(refundQty) || refundQty <= 0 || refundQty > maxRefund) { playSound('error'); return alert("Lỗi số lượng!"); }
    if (!window.confirm(`Xác nhận hoàn ${refundQty} sản phẩm này?`)) return;

    const unitTotal = log.total / log.qty; const unitProfit = log.profit / log.qty;
    const refundTotal = Math.round(unitTotal * refundQty); const refundProfit = Math.round(unitProfit * refundQty);
    
    const p = safeArray(products).find(x => x.id === log.product_id);
    if (p && navigator.onLine) await supabase.from("products").update({ stock: p.stock + refundQty }).eq("id", p.id);

    let refundedToWallet = false;
    let pMethod = 'TIỀN MẶT';
    let methodSuffix = " (TM)";

    if (log.customer && log.customer !== "Khách lẻ") {
      const phoneMatch = String(log.customer).match(/\((.*?)\)/);
      if (phoneMatch && phoneMatch[1]) {
        const phone = phoneMatch[1];
        if (customers[phone] && window.confirm(`Khách VIP: Hoàn ${refundTotal.toLocaleString()}đ vào VÍ ĐIỂM?\n- [OK]: Trả vào Ví\n- [Cancel]: Trả tiền ngoài`)) {
          const newW = (customers[phone].wallet || 0) + refundTotal; 
          setCustomers((prev: any) => ({ ...safeObject(prev), [phone]: { ...prev[phone], wallet: newW } })); 
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
    logAudit("TRẢ HÀNG", `Hoàn ${refundQty} ${cleanName(String(log.name || ""))} (${pMethod})`, refundLog);
    playSound('success'); alert(`Thành công! Đã hoàn qua ${pMethod}`);
  };

  const handlePayDebt = async (phone: string) => {
    const currentDebt = customers[phone]?.debt || 0; const payAmtStr = window.prompt(`Khách nợ ${currentDebt.toLocaleString()}đ. Nhập tiền:`, currentDebt.toString());
    if (payAmtStr && parseInt(payAmtStr) > 0) {
      const amt = parseInt(payAmtStr); const isTransfer = window.confirm(`Thu nợ bằng CK (OK) hay TM (Cancel)?`); const pMethod = isTransfer ? 'CHUYỂN KHOẢN' : 'TIỀN MẶT';
      const newD = Math.max(0, (customers[phone]?.debt || 0) - amt);
      setCustomers((prev: any) => ({ ...safeObject(prev), [phone]: { ...prev[phone], debt: newD } }));
      const dLog = { id: Date.now(), shift: shift, type: "THU NỢ", name: "Thanh toán công nợ", qty: 1, total: amt, profit: 0, customer: `${customers[phone].name} (${phone})`, paymentMethod: pMethod, time: new Date().toLocaleString('vi-VN') };
      setHistory(prev => [dLog, ...safeArray(prev)]); logAudit("THU NỢ", `Thu ${amt}đ từ ${customers[phone].name}`, dLog); alert("Thành công!")
    }
  };
  
  const handleReprint = (timeStr: string) => {
     const logsInBill = safeArray(history).filter(h => h.time === timeStr && h.type === 'BÁN' && h.product_id !== 'DISCOUNT');
     const discountLog = safeArray(history).find(h => h.time === timeStr && h.product_id === 'DISCOUNT');
     if(logsInBill.length === 0) return alert("Không tìm thấy dữ liệu hóa đơn!");
     
     const reconstructedCart = logsInBill.map(l => {
        const unitPriceWithVat = l.total / l.qty;
        const baseUnitPrice = Math.round(unitPriceWithVat / (1 + VAT_RATE));
        return {
           qty: l.qty,
           product: { name: l.name, gift_info: null, isHappyHour: String(l.name || "").includes('[Giờ Vàng]') },
           unitPrice: baseUnitPrice
        }
     });
     
     const subTotal = reconstructedCart.reduce((s, i) => s + (i.qty * i.unitPrice), 0);
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
    if (!lastOrder) return; const savedEmail = (lastOrder.custPhone && customers[lastOrder.custPhone] && customers[lastOrder.custPhone].email) ? customers[lastOrder.custPhone].email : ""; const email = window.prompt("Nhập Email khách hàng:", savedEmail);
    if (!email) return; if (lastOrder.custPhone) { setCustomers((prev: any) => ({ ...safeObject(prev), [lastOrder.custPhone]: { ...prev[lastOrder.custPhone], email: email } })); }
    setLoading(true); let itemsTable = ""; lastOrder.cart.forEach((item: any) => { itemsTable += `- ${cleanName(String(item.product.name || ""))} x ${item.qty} = ${Math.round(item.qty * (item.unitPrice || Math.round(getActualPrice(item.product))) * (1 + VAT_RATE)).toLocaleString()}đ\n` }); 
    const emailData = { 
        to_email: email, title: "HÓA ĐƠN MUA HÀNG - HẢI LÊ MART", order_id: lastOrder.orderId, time: lastOrder.time, items_list: itemsTable, 
        label_total: "TỔNG THANH TOÁN:", total_amount: Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString() + "đ", 
        label_payment: "Hình thức TT:", payment_method: lastOrder.paymentMethod, 
        label_change: lastOrder.paymentMethod === 'TIỀN MẶT' ? "Tiền thối lại:" : "", change_amount: lastOrder.paymentMethod === 'TIỀN MẶT' ? Math.round(lastOrder.customerGiven - lastOrder.finalTotal).toLocaleString() + "đ" : "" 
    }; 
    try { await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailData); alert("🚀 Đã gửi HĐ cho khách!"); logAudit("GỬI HĐ MAIL", `Gửi tới ${email}`);} catch (error) { alert("❌ Lỗi gửi mail."); } setLoading(false)
  };
  
  const sendCardEmail = async (phone: string) => {
    const cust = customers[phone]; const email = cust.email || window.prompt(`Nhập Email của ${cust.name}:`, "");
    if (!email) return; if (!cust.email) { setCustomers((prev: any) => ({ ...safeObject(prev), [phone]: { ...prev[phone], email } })); }
    setLoading(true); const code = cust.cardCode || phone; const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(code)}&scale=2&height=10&includetext=true`; const emailData = { to_email: email, order_id: "THẺ THÀNH VIÊN", time: new Date().toLocaleString('vi-VN'), items_list: `💳 MÃ THẺ CỦA BẠN LÀ: ${code}\n(Vui lòng xuất trình Thẻ/Mã vạch bên dưới khi thanh toán)`, total_amount: "Ưu đãi Đặc Quyền", payment_method: "VIP Member", change_amount: "0đ", barcode_url: barcodeUrl }; try { await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_VIP_ID, emailData); alert("🚀 Đã gửi Thẻ VIP!"); logAudit("GỬI THẺ VIP", `Gửi tới ${email}`);} catch (error) { alert("❌ Lỗi gửi mail."); } setLoading(false)
  };

  const printCustomerCard = (phone: string) => { setPrintCustomer({ phone, ...customers[phone] }); setPrintMode('customer_card'); setTimeout(() => window.print(), 1000) };
  
  const shareToZalo = (phone: string) => { const cust = customers[phone]; const code = cust.cardCode || phone; navigator.clipboard.writeText(`Chào ${cust.name},\nCảm ơn bạn đã đồng hành cùng Hải Lê Mart!\n💳 Mã Thẻ VIP của bạn là: ${code}`).then(() => { alert(`💡 Đã copy lời chào. Đang mở Zalo...`); window.open(`https://zalo.me/${phone}`, '_blank') }).catch(() => { window.open(`https://zalo.me/${phone}`, '_blank') }) };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => { const code = e.target.value; setNewCode(code); const p = safeArray(products).find((x: any) => x.product_code === code); if (p) { setNewName(cleanName(String(p.name || ""))); setNewCategory(formatCategoryStr(p.category)); setNewImportPrice(p.import_price?.toString() || ""); setNewPrice(p.sale_price.toString()); setNewPromoPrice(p.promo_price?.toString() || ""); setNewExpiry(p.expiry_date || ""); const gift = parseGift(p.gift_info); setNewGiftCondition(gift.cond.toString()); setNewGiftInfo(gift.text) } };
  
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
    
    const allVariants = safeArray(products).filter(p => String(p.product_code || "") === baseCode || String(p.product_code || "").startsWith(`${baseCode}-`));
    const exist = allVariants.find(p => String(p.product_code || "") === baseCode);
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
        if (added > 0) { const lg = { id: Date.now(), shift: shift, type: "NHẬP", name: newName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }; setHistory(prev => [lg, ...safeArray(prev)]); } 
        logAudit("NHẬP ĐÈ CŨ", `${newName} (+${added})`, { importPrice: impPrice, salePrice });
        alert(`Đã nhập hàng!${syncMsg}`);
      } else {
        if (exist.import_price !== impPrice || (exist.expiry_date || "") !== (newExpiry || "")) {
          const batchCode = `${baseCode}-${Date.now().toString().slice(-4)}`;
          const batchName = `${newName} [Lô ${newExpiry ? new Date(newExpiry).toLocaleDateString('vi-VN') : 'Mới'}]`;
          if (window.confirm(`Tạo LÔ MỚI (${batchCode})?\n(Lô cũ sẽ tự động được áp dụng Giá & Quà tặng mới)`)) {
            await supabase.from("products").insert([{ product_code: batchCode, name: batchName, category: formattedCat, import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null }]);
            if (added > 0) { const lg = { id: Date.now(), shift: shift, type: "NHẬP", name: batchName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }; setHistory(prev => [lg, ...safeArray(prev)]); } 
            logAudit("TÁCH LÔ", `${batchName} (+${added})`, { oldExpiry: exist.expiry_date, newExpiry });
            alert(`Đã tạo lô mới!${syncMsg}`);
          } else {
            setLoading(false); return;
          }
        } else {
          await supabase.from("products").update({ stock: exist.stock + added, created_at: new Date().toISOString() }).eq("id", exist.id);
          if (added > 0) { const lg = { id: Date.now(), shift: shift, type: "NHẬP", name: newName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }; setHistory(prev => [lg, ...safeArray(prev)]); } 
          logAudit("CỘNG DỒN", `${newName} (+${added})`);
          alert(`Cộng dồn thành công!${syncMsg}`);
        }
      }
    } else {
      await supabase.from("products").insert([{ product_code: baseCode, name: newName, category: formattedCat, import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null }]);
      if (added > 0) { const lg = { id: Date.now(), shift: shift, type: "NHẬP", name: newName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }; setHistory(prev => [lg, ...safeArray(prev)]); } 
      logAudit("NHẬP MỚI", `${newName} (+${added})`, { code: baseCode, importPrice: impPrice, salePrice });
      alert(`Nhập thành công!${syncMsg}`);
    }
    
    setNewCode(""); setNewName(""); setNewCategory("Đồ uống"); setNewImportPrice(""); setNewPrice(""); setNewPromoPrice(""); setNewGiftCondition("1"); setNewGiftInfo(""); setNewStock(""); setNewExpiry("");
    fetchProducts(); setLoading(false); setShowInputForm(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!navigator.onLine) return alert("Cần có mạng để thao tác Kho!");
    const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader();
    reader.onload = async (event) => {
      setLoading(true); try {
        const text = event.target?.result as string; const lines = text.split('\n').filter(line => line.trim() !== ''); if (lines.length <= 1) { alert("File rỗng!"); setLoading(false); return } let successCount = 0; let importLogs: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(c => c.trim().replace(/^"|"$/g, '')); if (cols.length < 5) continue; const pCode = cols[0]; const pName = cols[1]; const pCategory = formatCategoryStr(cols[2]); const pImpPrice = parseInt(cols[3]) || 0; const pSalePrice = parseInt(cols[4]) || 0; const pPromoPrice = parseInt(cols[5]) || 0; const pGift = cols[6] || null; const pStock = parseInt(cols[7]) || 0; const pExpiry = cols[8] || null; if (!pCode || !pName || pSalePrice <= 0) continue;
          const baseCode = pCode.trim(); const allVariants = safeArray(products).filter(p => String(p.product_code || "") === baseCode || String(p.product_code || "").startsWith(`${baseCode}-`)); if (allVariants.length > 0 && allVariants[0].sale_price !== pSalePrice) { await Promise.all(allVariants.map(v => supabase.from("products").update({ sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift }).eq("id", v.id))); if (!importLogs.find(l => l.name === `Đồng bộ giá/quà ${baseCode}`)) importLogs.push({ id: Date.now() + Math.random(), shift: shift, type: "HỆ THỐNG", name: `Đồng bộ giá/quà ${baseCode}`, qty: 0, total: 0, time: new Date().toLocaleString('vi-VN') }) }
          const exist = allVariants.find(p => String(p.product_code || "") === baseCode); if (exist) { if (exist.stock <= 0) await supabase.from("products").update({ name: pName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry, created_at: new Date().toISOString() }).eq("id", exist.id); else { if (exist.import_price !== pImpPrice || (exist.expiry_date || "") !== (pExpiry || "")) { const batchCode = `${baseCode}-${Date.now().toString().slice(-4)}${i}`; const batchName = `${pName} [Lô ${pExpiry ? new Date(pExpiry).toLocaleDateString('vi-VN') : 'Mới'}]`; await supabase.from("products").insert([{ product_code: batchCode, name: batchName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry }]); } else await supabase.from("products").update({ stock: exist.stock + pStock, created_at: new Date().toISOString() }).eq("id", exist.id) } } else await supabase.from("products").insert([{ product_code: baseCode, name: pName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry }]); if (pStock > 0) importLogs.push({ id: Date.now() + Math.random(), shift: shift, type: "NHẬP", name: cleanName(pName), qty: pStock, total: 0, time: new Date().toLocaleString('vi-VN') }); successCount++
        }
        if (importLogs.length > 0) { setHistory(prev => [...importLogs, ...safeArray(prev)]); } logAudit("NHẬP FILE", `Nhập ${successCount} mã`); alert(`Nhập thành công ${successCount} SP!`); fetchProducts()
      } catch (err) { alert("Lỗi file CSV."); } setLoading(false)
    }; reader.readAsText(file); e.target.value = ''
  };

  const handleDelete = async (id: any, name: any) => { if (!navigator.onLine) return alert("Cần có mạng để thao tác Kho!"); if (window.confirm(`Xóa vĩnh viễn ${name}?`)) { await supabase.from("products").delete().eq("id", id); logAudit("XÓA SP", `Xóa: ${name}`); fetchProducts() } };
  const handleEdit = async (id: any, field: string, old: any, isText: boolean = false) => { if (!navigator.onLine) return alert("Cần có mạng để thao tác Kho!"); let label = field; if (field === 'category') label = 'Danh mục'; if (field === 'sale_price') label = 'Giá bán'; if (field === 'promo_price') label = 'Giá KM'; if (field === 'gift_info') label = 'Quà tặng'; if (field === 'expiry_date') label = 'HSD'; const val = window.prompt(`Sửa ${label}:`, old || ""); if (val !== null) { let updateData: any = isText ? (field === 'category' ? formatCategoryStr(val) : val) : (parseInt(val) || 0); if (field === 'gift_info' && val.trim() === '') updateData = null; await supabase.from("products").update({ [field]: updateData }).eq("id", id); logAudit("SỬA THÔNG TIN", `ID ${id} - ${label}`, { old, new: updateData }); fetchProducts() } };
  const handlePrintBarcode = (p: any) => { const q = window.prompt(`SL tem in: ${cleanName(String(p.name || ""))}`, "30"); if (q && parseInt(q) > 0) { setPrintBarcodeProduct(p); setBarcodeCount(parseInt(q)); setPrintMode('barcode'); setTimeout(() => window.print(), 1500) } };
  
  const downloadSampleCSV = () => { const csv = "\uFEFFMã SP,Tên SP,Danh Mục,Giá Nhập,Giá Bán,Giá KM,Quà Tặng,Số Lượng,Hạn Sử Dụng (YYYY-MM-DD)\nSP001,Mì Hảo Hảo,Đồ ăn liền,3000,5000,0,,100,2026-12-31"; const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Mau_Nhap_Kho.csv`; link.click() };
  
  const exportToCSV = () => {
    if (safeArray(history).length === 0) return alert("Chưa có lịch sử!");
    let csv = "\uFEFFGiờ,Ca,Loại,Hình thức,Khách,Sản phẩm,SL,Tổng(VAT),Lợi nhuận\n";
    safeArray(history).forEach(log => { csv += `${new Date(Math.floor(log.id)).toLocaleString('vi-VN')},${log.shift || ""},${log.type},${log.paymentMethod || ""},${log.customer || "Khách lẻ"},${log.name},${log.qty},${Math.round(log.total)},${Math.round(log.profit || 0)}\n` });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Bao_Cao_Ban_Hang.csv`; link.click()
  };
  
  const exportAuditToCSV = () => {
    if (safeArray(auditLogs).length === 0) return alert("Chưa có nhật ký!");
    let csv = "\uFEFFThời gian,Người dùng,Ca,Hành động,Chi tiết,Dữ liệu mở rộng\n";
    safeArray(auditLogs).forEach(log => { csv += `${log.time},${log.user_name},${log.shift},${log.action},"${(log.detail || "").replace(/"/g, '""')}","${(log.extra_data || "").replace(/"/g, '""')}"\n` });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Nhat_Ky_Thao_Tac.csv`; link.click()
  };
  
  const handleSendEmailReport = async () => {
    const logs = safeArray(history).filter(log => log.time && String(log.time).includes(todayStrStr));
    if (logs.length === 0) return alert("Chưa có giao dịch!");
    let cash = 0, transfer = 0, prof = 0, sold = 0;
    logs.forEach(l => { if (l.type === 'BÁN') sold += l.qty; if (l.type === 'BÁN' || l.type === 'THU NỢ' || l.type === 'TRẢ HÀNG') { if (l.paymentMethod === 'CHUYỂN KHOẢN') transfer += l.total; else if (l.paymentMethod === 'TIỀN MẶT') cash += l.total; else if (l.paymentMethod === 'KẾT HỢP') { if(l.split_cash) { cash += l.split_cash; transfer += (l.total - l.split_cash); } else { cash += l.total; } } } prof += (l.profit || 0) });
    
    const adminEmail = window.prompt("Nhập Email Quản lý để nhận báo cáo:", "");
    if(!adminEmail) return;
    
    setLoading(true);
    const reportStr = `\n- Tổng SP đã bán: ${sold} món\n- Doanh thu Tiền Mặt: ${Math.round(cash).toLocaleString()}đ\n- Doanh thu C/K: ${Math.round(transfer).toLocaleString()}đ\n`;
    
    const emailData = { 
        to_email: adminEmail, title: "BÁO CÁO DOANH THU CHỐT CA", order_id: `BÁO CÁO ${shift}`, time: new Date().toLocaleString('vi-VN'), items_list: reportStr, 
        label_total: "TỔNG LỢI NHUẬN:", total_amount: Math.round(prof).toLocaleString() + "đ", 
        label_payment: "Hệ thống:", payment_method: "Hải Lê ERP", label_change: "", change_amount: "" 
    }; 
    try {
        await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailData);
        logAudit("GỬI BÁO CÁO", `Đã gửi báo cáo ngày tới ${adminEmail}`); alert("🚀 Đã gửi Báo cáo thành công!");
    } catch (error) { alert("❌ Lỗi gửi mail. Vui lòng thử lại."); }
    setLoading(false);
  };
  
  const requestSort = (key: string) => { if (sortConfig && sortConfig.key === key) { if (sortConfig.direction === 'asc') setSortConfig({ key, direction: 'desc' }); else setSortConfig(null) } else { setSortConfig({ key, direction: 'asc' }) } };
  const handleFilterCheck = (col: string, val: any) => { setFilters(prev => { const cur = prev[col] || []; if (cur.includes(val)) return { ...prev, [col]: cur.filter(v => v !== val) }; return { ...prev, [col]: [...cur, val] } }) };
  const toggleDateGroup = (dateStr: string) => setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));

  const renderHeaderIcon = (colKey: string) => { const isFiltered = filters[colKey]?.length > 0; const isSortedAsc = sortConfig?.key === colKey && sortConfig.direction === 'asc'; const isSortedDesc = sortConfig?.key === colKey && sortConfig.direction === 'desc'; let icon = '🔽'; if (isSortedAsc) icon = '🔼'; if (isSortedDesc) icon = '🔽'; return (<span onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === colKey ? null : colKey) }} style={{ cursor: "pointer", color: isFiltered || sortConfig?.key === colKey ? '#ef4444' : 'var(--text-muted)', fontSize: "10px", padding: "2px", marginLeft: "4px", border: isFiltered ? "1px dashed #ef4444" : "1px solid transparent", borderRadius: "2px" }} title="Lọc">{icon}</span>) };
  
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
          {"HẢI LÊ ".split('').map((c, i) => <span key={i} style={{ display: "inline-block", animation: `wave 1.5s ease-in-out ${i * 0.06}s infinite` }}>{c === ' ' ? '\u00A0' : c}</span>)}
          <span style={{ color: "#dc2626" }}>{"MART".split('').map((c, i) => <span key={i} style={{ display: "inline-block", animation: `wave 1.5s ease-in-out ${(i + 7) * 0.06}s infinite` }}>{c === ' ' ? '\u00A0' : c}</span>)}</span>
        </h1>
        <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "800", letterSpacing: "3px", textTransform: "uppercase", marginTop: "4px", whiteSpace: "nowrap" }}>
          {"ERP System".split('').map((c, i) => <span key={i} style={{ display: "inline-block", animation: `wave 1.5s ease-in-out ${(i + 11) * 0.06}s infinite` }}>{c === ' ' ? '\u00A0' : c}</span>)}
        </div>
      </div>
    </div>
  );

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
          <input type="number" placeholder="Tiền lẻ đầu ca (để thối)..." value={startingCash || ""} onChange={e => setStartingCash(Number(e.target.value))} style={{ padding: "14px", borderRadius: "10px", outline: "none", fontWeight: "bold", color: "#059669" }} />
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
      <input type="text" id="focus-catcher" style={{position:'absolute', opacity: 0, height: 0, width: 0, border: 'none', padding: 0}} />
      
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
              {safeArray(expenses).map(e => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderBottom: "1px dashed var(--border-glass)" }}>
                  <div><b>{e.name}</b> <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>({e.date})</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <b style={{ color: "#ef4444" }}>-{Number(e.amount).toLocaleString()}đ</b> 
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
              {safeArray(suppliers).map(s => (
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
          <div className="glass" style={{ padding: "25px", width: "550px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "15px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <h2 style={{ margin: 0, color: "#3b82f6" }}>📊 BÁO CÁO</h2>
                <button onClick={exportToCSV} style={{ fontSize: "10px", padding: "6px 10px", background: "#10b981", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>📥 XUẤT EXCEL</button>
                <button onClick={handleSendEmailReport} style={{ fontSize: "10px", padding: "6px 10px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>📧 GỬI MAIL</button>
              </div>
              <button onClick={() => setShowStatsModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-main)" }}>✖</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "15px" }}>
              <div style={{ background: "#eff6ff", padding: "10px", borderRadius: "8px", border: "1px solid #bfdbfe", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#3b82f6", fontWeight: "bold" }}>DOANH THU</div>
                <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1e3a8a", marginTop: "4px" }}>{todayStats.totalSales.toLocaleString()}đ</div>
              </div>
              <div style={{ background: "#fef2f2", padding: "10px", borderRadius: "8px", border: "1px solid #fecaca", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#ef4444", fontWeight: "bold" }}>CHI PHÍ</div>
                <div style={{ fontSize: "14px", fontWeight: "bold", color: "#b91c1c", marginTop: "4px" }}>-{todayStats.expenses.toLocaleString()}đ</div>
              </div>
              <div style={{ background: "#f0fdf4", padding: "10px", borderRadius: "8px", border: "1px solid #bbf7d0", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#16a34a", fontWeight: "bold" }}>LỢI NHUẬN RÒNG</div>
                <div style={{ fontSize: "14px", fontWeight: "bold", color: "#14532d", marginTop: "4px" }}>{todayStats.netProfit.toLocaleString()}đ</div>
              </div>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 5px 0" }}>📈 Doanh thu 30 ngày qua</h3>
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
                <h3 style={{ fontSize: "12px", margin: "0 0 8px 0" }}>🏆 Top Bán Chạy</h3>
                {topSelling.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--border-glass)", fontSize: "11px" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>{idx + 1}. {item[0]}</span>
                    <span style={{ fontWeight: "bold", color: "#10b981" }}>{item[1]}</span>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "12px", color: "#b91c1c", margin: "0 0 8px 0" }}>📉 Sắp hết hàng</h3>
                {safeArray(products).filter(p => p.stock > 0 && p.stock < 10).slice(0, 5).map((p, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed var(--border-glass)", fontSize: "11px" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>{cleanName(String(p.name || ""))}</span>
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
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>👤 Người trực: <b>{role === 'admin' ? "Quản lý" : "Thu ngân"}</b></div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>⏰ Ca: <b style={{ color: "#b91c1c" }}>{shift}</b></div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>💵 Tiền đầu ca: <b style={{ color: "#059669" }}>{startingCash.toLocaleString()}đ</b></div>
              
              <div style={{ borderTop: "1px solid var(--border-glass)", margin: "10px 0" }}></div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>+ Tiền mặt thu: <b>{currentShiftStats.cashIn.toLocaleString()}đ</b></div>
              <div style={{ fontSize: "11px", color: "#ef4444", marginBottom: "4px" }}>- Hoàn trả khách (TM): <b>{currentShiftStats.cashOut.toLocaleString()}đ</b></div>
              <div style={{ fontSize: "11px", color: "#ea580c", marginBottom: "4px" }}>- Chi phí phát sinh: <b>{currentShiftStats.shiftExp.toLocaleString()}đ</b></div>
              
              <div style={{ borderTop: "1px dashed var(--border-glass)", margin: "10px 0" }}></div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(16, 185, 129, 0.1)", padding: "8px", borderRadius: "6px", border: "1px solid #10b981" }}>
                 <span style={{ fontSize: "12px", fontWeight: "bold" }}>BÀN GIAO KÉT:</span>
                 <b style={{ color: "#059669", fontSize: "18px" }}>{currentShiftStats.expectedCash.toLocaleString()}đ</b>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginTop: "10px" }}>
                 <span>(Doanh thu C/K:</span><b>{currentShiftStats.transferIn.toLocaleString()}đ)</b>
              </div>
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
              {Object.keys(customers || {}).length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>Chưa có KH.</div>}
              {Object.keys(customers || {}).map(phone => {
                const c = customers[phone]; const tier = getCustomerTier(c.totalSpent || 0);
                return (
                  <div key={phone} style={{ padding: "12px", borderBottom: "1px dashed #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", background: tier.bg, borderRadius: "8px", marginBottom: "8px", border: `1px solid ${tier.border}` }}>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ fontWeight: "bold", color: "#1e293b", cursor: "pointer", fontSize: "15px" }} onClick={() => { const newName = window.prompt("Sửa tên:", c.name); if (newName) { const newC = { ...c, name: newName }; setCustomers((prev: any) => ({ ...safeObject(prev), [phone]: newC })); logAudit("SỬA KH", `Đổi tên KH`) } }} title="Sửa tên">{c.name} ✏️</div>
                        <span style={{ fontSize: "10px", fontWeight: "900", color: tier.color, border: `1px solid ${tier.color}`, padding: "2px 6px", borderRadius: "12px", background: "#fff" }}>{tier.name}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                        <span onClick={() => handleEditPhone(phone)} style={{ cursor: "pointer", fontWeight: "bold" }} title="Đổi SĐT">📞 {phone} ✏️</span>
                        <span style={{ cursor: "pointer", color: "#3b82f6", fontWeight: "bold", marginLeft: "10px" }} onClick={() => { const newEmail = window.prompt("Sửa Email:", c.email || ""); if (newEmail !== null) { const newC = { ...c, email: newEmail.trim() }; setCustomers((prev: any) => ({ ...safeObject(prev), [phone]: newC })); logAudit("SỬA EMAIL", `Cập nhật Email KH`) } }} title="Cập nhật Email">{c.email ? `📧 ${c.email}` : `📧 +Thêm Mail`}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span onClick={() => { const newCard = window.prompt("Mã Thẻ:", c.cardCode || ""); if (newCard !== null) { const newC = { ...c, cardCode: newCard.trim() }; setCustomers((prev: any) => ({ ...safeObject(prev), [phone]: newC })); logAudit("SỬA MÃ THẺ", `Cập nhật mã thẻ`) } }} style={{ cursor: "pointer", color: "#ea580c", fontWeight: "bold", marginRight: "10px" }} title="Mã thẻ">{c.cardCode ? `💳 Mã: ${c.cardCode}` : `💳 +Gán Mã Thẻ`}</span>
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
              {Object.keys(customers || {}).filter(p => (customers[p].debt || 0) > 0).map(phone => (
                <div key={phone} style={{ padding: "10px", borderBottom: "1px dashed var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "bold" }}>{customers[phone].name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{phone}</div>
                    <div style={{ color: "#ef4444", fontWeight: "bold" }}>Nợ: {(customers[phone].debt || 0).toLocaleString()}đ</div>
                  </div>
                  <button onClick={() => handlePayDebt(phone)} style={{ padding: "6px 12px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" }}>THU TIỀN</button>
                </div>
              ))}
              {Object.keys(customers || {}).filter(p => (customers[p].debt || 0) > 0).length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>Không có nợ.</div>}
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
              {safeArray(auditLogs).length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>Chưa có bản ghi nào.</div>}
              {safeArray(auditLogs).map((log, idx) => (
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
           <div className="glass" style={{ padding: "20px", width: "400px", maxWidth: "90%", background: "var(--bg-glass)" }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: "0 0 10px 0", color: "#ef4444", borderBottom: "1px dashed var(--border-glass)", paddingBottom: "5px" }}>Chi tiết thao tác</h3>
              <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
                 <p style={{ margin: "5px 0" }}><b>Hành động:</b> {selectedAuditLog.action}</p>
                 <p style={{ margin: "5px 0" }}><b>Người thực hiện:</b> {selectedAuditLog.user_name} - {selectedAuditLog.shift}</p>
                 <p style={{ margin: "5px 0" }}><b>Thời gian:</b> {selectedAuditLog.time}</p>
                 <p style={{ margin: "5px 0" }}><b>Nội dung tóm tắt:</b> <span style={{ color: "#3b82f6" }}>{selectedAuditLog.detail}</span></p>
                 
                 {selectedAuditLog.extra_data && (
                    <div style={{ marginTop: "10px", padding: "10px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", borderRadius: "6px" }}>
                       <b style={{ color: "#059669", fontSize: "11px", display: "block", marginBottom: "5px" }}>Dữ liệu hệ thống (JSON):</b>
                       <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordWrap: "break-word", fontSize: "11px", color: "var(--text-main)", maxHeight: "200px", overflowY: "auto" }}>
                          {JSON.stringify(JSON.parse(selectedAuditLog.extra_data), null, 2)}
                       </pre>
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
              {safeArray(heldOrders).length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>Trống.</div>}
              {safeArray(heldOrders).map((order, idx) => (
                <div key={order.id} style={{ padding: "10px", borderBottom: "1px dashed var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-input)", borderRadius: "8px", marginBottom: "8px" }}>
                  <div>
                    <div style={{ fontWeight: "bold" }}>Đơn #{idx + 1}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>⏰ {order.time}</div>
                    <div style={{ fontSize: "11px", color: "#b91c1c", fontWeight: "bold" }}>Gồm {safeArray(order.cart).reduce((s: any, i: any) => s + (Number(i.qty) || 0), 0)} SP</div>
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
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button onClick={() => { setPrintMode('receipt'); setTimeout(() => window.print(), 300) }} style={{ flex: 1, padding: "12px", background: "#ef4444", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "12px" }}>🖨️ In HĐ</button>
                <button onClick={sendReceiptEmail} disabled={loading} style={{ flex: 1, padding: "12px", background: "#3b82f6", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "12px" }}>{loading ? "Đang gửi..." : "📧 Email"}</button>
                <button onClick={closeCheckout} style={{ flex: 1, padding: "12px", background: "var(--border-glass)", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "12px", color: "var(--text-main)" }}>Đóng</button>
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
                {safeArray(lastOrder.cart).map((i: any, x: number) => {
                  const p = i.unitPrice ? i.unitPrice : Math.round(getActualPrice(i.product)); 
                  const t = Math.round((Number(i.qty) || 0) * p * (1 + VAT_RATE)); 
                  const g = parseGift(i.product.gift_info); const gQty = g.cond > 0 ? Math.floor(i.qty / g.cond) : 0;
                  return (
                    <React.Fragment key={x}>
                      <tr><td colSpan={2} style={{ fontWeight: "bold", paddingTop: "4px" }}>{cleanName(String(i.product.name || ""))} {i.product.isHappyHour && <span style={{ fontSize: "9px", fontStyle: "italic" }}>[Giờ Vàng]</span>}</td></tr>
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
      
      {printMode === 'barcode' && printBarcodeProduct && (
        <div className="print-flex">
          <div className="print-barcode-sheet">
            {Array.from({ length: barcodeCount }).map((_, i) => (
              <div key={i} className="barcode-sticker">
                <div style={{ fontSize: "11px", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%", textAlign: "center" }}>{cleanName(String(printBarcodeProduct.name || ""))}</div>
                <img src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(printBarcodeProduct.product_code)}&scale=2&height=10&includetext=false`} onError={(e) => { e.currentTarget.src = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(printBarcodeProduct.product_code)}&code=Code128&translate-esc=on`; }} alt={printBarcodeProduct.product_code} />
                <div style={{ fontSize: "10px", fontFamily: "monospace", letterSpacing: "1px", color: "#333" }}>{printBarcodeProduct.product_code}</div>
                <div style={{ fontSize: "14px", fontWeight: "900", color: "#000", marginTop: "2px" }}>{getActualPrice(printBarcodeProduct).toLocaleString()}đ</div>
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
    </div>
  );
}

// BỌC THÉP CHỐNG CRASH CHO TOÀN BỘ ỨNG DỤNG
class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null, info: null }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  componentDidCatch(error: any, info: any) { this.setState({ info }); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", background: "#fef2f2", color: "#b91c1c", minHeight: "100vh", fontFamily: "sans-serif" }}>
          <h2>🚨 LỖI DỮ LIỆU CŨ LÀM TREO MÁY!</h2>
          <p>Hệ thống tự động chặn một lỗi nghiêm trọng do dữ liệu cũ trong máy của bạn (localStorage) không tương thích với phiên bản mới.</p>
          <pre style={{ background: "#fff", padding: "15px", border: "1px solid #fca5a5", borderRadius: "8px", overflowX: "auto", fontSize: "12px" }}>
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ padding: "12px 24px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", marginTop: "20px", fontWeight: "bold", fontSize: "16px" }}>BẤM VÀO ĐÂY ĐỂ DỌN RÁC VÀ VÀO LẠI WEB</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// XUẤT RA 2 TÊN ĐỂ CHỐNG LỖI INDEX.TSX
export function AppWrapper() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
// KẾT THÚC FILE

/* eslint-disable */
// @ts-nocheck
import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "./supabaseClient";

const styles = `
  @keyframes wave { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
  @keyframes float { 0% { transform: translateY(0) } 50% { transform: translateY(-20px) } 100% { transform: translateY(0) } }
  @keyframes pulse-fast { 0% { opacity: 1 } 50% { opacity: .5 } 100% { opacity: 1 } }
  @keyframes logo-glow { 0%, 100% { box-shadow: 0 0 10px rgba(250,204,21,0.2), 0 0 20px rgba(250,204,21,0.2) inset; transform: scale(1) } 50% { box-shadow: 0 0 25px rgba(250,204,21,1), 0 0 40px rgba(250,204,21,0.8), 0 0 20px rgba(250,204,21,0.5) inset; transform: scale(1.05) } }
  
  .logo-icon { animation: logo-glow 2s infinite ease-in-out; background-color: #dc2626; padding: 8px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
  .spring-bg { position: fixed; width: 400px; height: 400px; border-radius: 50%; filter: blur(100px); z-index: -1; opacity: .3; animation: float 10s infinite ease-in-out; }
  .glass { background: rgba(255,255,255,.98); border: 1px solid #fed7aa; border-radius: 12px; box-shadow: 0 4px 15px rgba(251,146,60,.08); }
  
  body { background-color: #fff7ed; margin: 0; font-family: 'Inter', sans-serif; color: #431407; }
  .tab-btn { padding: 6px 12px; border-radius: 20px; border: 1px solid #fed7aa; background: #fff; cursor: pointer; font-size: 12px; font-weight: bold; color: #9a3412; white-space: nowrap; }
  .tab-btn.active { background: #ef4444; color: #fff; border-color: #ef4444; }
  .chart-container-scroll { display: flex; align-items: flex-end; height: 120px; margin-top: 15px; padding-top: 10px; border-top: 1px dashed #cbd5e1; overflow-x: auto; padding-bottom: 5px; gap: 4px; }
  .chart-bar-group { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; min-width: 20px; }
  .chart-bar { width: 8px; background: linear-gradient(0deg, #ef4444 0%, #fca5a5 100%); border-radius: 4px 4px 0 0; transition: height .5s; min-height: 2px; }
  .chart-label { font-size: 8px; color: #64748b; margin-top: 4px; font-weight: bold; white-space: nowrap; }
  .chart-val { font-size: 8px; color: #b91c1c; font-weight: bold; margin-bottom: 2px; }
  .noti-bell { position: relative; display: inline-block; cursor: pointer; }
  .noti-badge { position: absolute; top: -5px; right: -5px; background: #ef4444; color: white; border-radius: 50%; padding: 2px 6px; font-size: 9px; font-weight: bold; animation: pulse-fast 1s infinite; }
  .qty-input { width: 28px; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px; outline: none; font-size: 11px; font-weight: bold; color: #1e293b; padding: 3px 0; background: #fff; }
  .qty-input::-webkit-outer-spin-button, .qty-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .qty-input[type=number] { -moz-appearance: textfield; }
  .add-to-cart-btn { padding: 8px 16px; background-color: #fbbf24; color: #78350f; border: none; border-radius: 6px; font-weight: 900; cursor: pointer; font-size: 12px; transition: transform .1s, background-color .2s; box-shadow: 0 2px 4px rgba(251,191,36,.3); }
  .add-to-cart-btn:hover { background-color: #f59e0b; transform: scale(1.05); }
  .add-to-cart-btn:active { transform: scale(.95); }
  
  .input-label { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; }
  .input-label-red { font-size: 10px; font-weight: bold; color: #ef4444; text-transform: uppercase; }
  .input-label-green { font-size: 10px; font-weight: bold; color: #10b981; text-transform: uppercase; }

  @media print {
    .no-print { display: none !important; }
    body { background: #fff !important; margin: 0; padding: 0; display: flex; justify-content: center; }
    .print-only { display: block !important; position: relative !important; width: 80mm !important; margin: 0 auto !important; padding: 5mm !important; box-sizing: border-box !important; }
    .print-flex { display: flex !important; width: 100%; justify-content: center; flex-wrap: wrap; }
    @page { margin: 0; size: 80mm auto; }
  }
  .print-only, .print-flex { display: none; }
`;

export default function App() {
  const VAT_RATE = 0.1;
  const EMAILJS_SERVICE_ID = "service_7ie990l";
  const EMAILJS_TEMPLATE_ID = "template_t91erhg";
  const EMAILJS_TEMPLATE_VIP_ID = "template_m1j9i7k";
  const EMAILJS_PUBLIC_KEY = "5ric0kxuwNPlUleAv";

  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("mart_logged_in") === "true");
  const [role, setRole] = useState(() => localStorage.getItem("mart_role") || "staff");
  const [shift, setShift] = useState(() => localStorage.getItem("mart_shift") || "Ca Sáng");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  const [adminPass, setAdminPass] = useState(() => localStorage.getItem("mart_admin_pass") || "haile88");
  const [staffPass, setStaffPass] = useState(() => localStorage.getItem("mart_staff_pass") || "123");
  const [bankBin, setBankBin] = useState(() => localStorage.getItem("mart_bank_bin") || "970422");
  const [bankAcc, setBankAcc] = useState(() => localStorage.getItem("mart_bank_acc") || "0680124181004");
  const [bankNameStr, setBankNameStr] = useState(() => localStorage.getItem("mart_bank_name") || "LE HONG HAI");

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
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showMarketingModal, setShowMarketingModal] = useState(false);

  const [scannerMode, setScannerMode] = useState<'product' | 'voucher' | 'customer' | null>(null);
  const [scannedCodeObj, setScannedCodeObj] = useState<any>(null);
  const [scanMessage, setScanMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [printBarcodeProduct, setPrintBarcodeProduct] = useState<any>(null);
  const [printCustomer, setPrintCustomer] = useState<any>(null);
  const [barcodeCount, setBarcodeCount] = useState<number>(30);
  const [printMode, setPrintMode] = useState<'receipt' | 'barcode' | 'customer_card' | null>(null);

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

  // SỬA LỖI ĐÈ DỮ LIỆU CLOUD TRỐNG
  const loadCloudData = async () => {
    try {
      const [rCust, rHist, rExp, rSup, rAud, rHold] = await Promise.all([
        supabase.from('customers').select('*'),
        supabase.from('history').select('*').order('id', { ascending: false }).limit(1500),
        supabase.from('expenses').select('*').order('id', { ascending: false }),
        supabase.from('suppliers').select('*').order('id', { ascending: false }),
        supabase.from('audit_logs').select('*').order('id', { ascending: false }).limit(300),
        supabase.from('held_orders').select('*')
      ]);
      if (rCust.data && rCust.data.length > 0) {
        const cObj: any = {};
        rCust.data.forEach((c: any) => cObj[c.phone] = c);
        setCustomers(cObj);
      }
      if (rHist.data && rHist.data.length > 0) setHistory(rHist.data);
      if (rExp.data && rExp.data.length > 0) setExpenses(rExp.data);
      if (rSup.data && rSup.data.length > 0) setSuppliers(rSup.data);
      if (rAud.data && rAud.data.length > 0) setAuditLogs(rAud.data);
      if (rHold.data && rHold.data.length > 0) setHeldOrders(rHold.data);
    } catch (err) {
      console.error("Lỗi tải Cloud:", err);
    }
  };

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

  const playSound = (type: 'success' | 'error') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      if (type === 'success') {
        osc.frequency.value = 800; gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
      } else {
        osc.frequency.value = 250; osc.type = 'square';
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) { }
  };

  const logAudit = async (action: string, detail: string) => {
    const newLog = { id: Date.now(), time: new Date().toLocaleString('vi-VN'), user_name: role === 'admin' ? 'Quản lý' : 'Thu ngân', shift, action, detail };
    setAuditLogs(prev => [newLog, ...prev].slice(0, 300));
    try { await supabase.from('audit_logs').insert([newLog]); } catch(e){}
  };

  const parseGift = (giftStr: string | null) => {
    if (!giftStr) return { cond: 0, text: "" };
    if (giftStr.includes(';;;')) {
      const parts = giftStr.split(';;;');
      return { cond: parseInt(parts[0]) || 1, text: parts[1] || "" };
    }
    return { cond: 1, text: giftStr };
  };

  const cleanName = (name: string) => name ? name.split(' [Lô')[0] : '';

  const getActualPrice = (p: any) => {
    let price = (p.promo_price && Number(p.promo_price) > 0) ? Number(p.promo_price) : Number(p.sale_price);
    const currentHour = new Date().getHours();
    if ((currentHour >= 20 || currentHour < 6) && (p.category === 'Đồ ăn liền' || p.category === 'Bánh Kẹo')) {
      price = price * 0.8; p.isHappyHour = true;
    } else {
      p.isHappyHour = false;
    }
    return Math.round(price);
  };

  const getCustomerTier = (totalSpent = 0) => {
    const ts = Number(totalSpent);
    if (ts >= 500000000) return { name: "💎 KIM CƯƠNG", discountRate: 0.10, color: "#a855f7", bg: "#faf5ff", border: "#e9d5ff" };
    if (ts >= 200000000) return { name: "🥇 VÀNG", discountRate: 0.05, color: "#ca8a04", bg: "#fefce8", border: "#fef08a" };
    if (ts >= 50000000) return { name: "🥈 BẠC", discountRate: 0.02, color: "#475569", bg: "#f8fafc", border: "#cbd5e1" };
    return { name: "🥉 ĐỒNG", discountRate: 0, color: "#b45309", bg: "#fffbeb", border: "#fde68a" };
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setProducts(data);
  };

  const findProductByCode = (code: string) => {
    const rawCode = code.trim();
    let matches = products.filter(prod => prod.product_code === rawCode || prod.product_code.startsWith(`${rawCode}-`));
    let available = matches.filter(p => Number(p.stock) > 0);
    if (available.length > 0) {
      available.sort((a, b) => {
        if (!a.expiry_date) return 1; if (!b.expiry_date) return -1;
        return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
      });
      return available[0];
    }
    return matches.length > 0 ? matches[0] : null;
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("mart_history", JSON.stringify(history));
    localStorage.setItem("mart_customers", JSON.stringify(customers));
    localStorage.setItem("mart_held_orders", JSON.stringify(heldOrders));
    localStorage.setItem("mart_audit", JSON.stringify(auditLogs));
    localStorage.setItem("mart_expenses", JSON.stringify(expenses));
    localStorage.setItem("mart_suppliers", JSON.stringify(suppliers));
  }, [history, customers, heldOrders, auditLogs, expenses, suppliers]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchProducts();
      loadCloudData();
      const channel = supabase.channel("db_changes").on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchProducts()).subscribe();
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
      script.onload = () => { (window as any).emailjs.init(EMAILJS_PUBLIC_KEY); };
      document.head.appendChild(script);
      return () => { supabase.removeChannel(channel); }
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (scannerMode !== null) {
      let scanner: any; let lastScanTime = 0;
      const loadScanner = () => {
        if ((window as any).Html5QrcodeScanner) {
          scanner = new (window as any).Html5QrcodeScanner("qr-reader", { fps: 15, qrbox: { width: 250, height: 120 }, rememberLastUsedCamera: true }, false);
          scanner.render((text: string) => {
            const now = Date.now(); if (now - lastScanTime < 1500) return; lastScanTime = now;
            setScannedCodeObj({ code: text, time: now });
          }, undefined);
        }
      };
      if (!(window as any).Html5QrcodeScanner) {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/html5-qrcode";
        script.onload = loadScanner;
        document.head.appendChild(script);
      } else loadScanner();
      return () => { if (scanner) scanner.clear().catch(() => { }) }
    }
  }, [scannerMode]);

  const handleSelectSuggest = (p_input: any) => {
    const baseCode = p_input.product_code.split('-')[0];
    const totalStock = products.filter(p => p.product_code === baseCode || p.product_code.startsWith(`${baseCode}-`)).reduce((s, p) => s + Number(p.stock || 0), 0);
    if (totalStock <= 0) { playSound('error'); return alert("Đã hết hàng!"); }
    
    const price = getActualPrice(p_input);
    const repName = cleanName(p_input.name);
    
    setCart(prev => {
      const exist = prev.find(item => cleanName(item.product.name) === repName);
      if (exist) {
        const newQty = Number(exist.qty) + 1;
        if (newQty > totalStock) { playSound('error'); return prev; }
        playSound('success');
        return prev.map(i => cleanName(i.product.name) === repName ? { ...i, qty: newQty, total: Math.round(newQty * price * (1 + VAT_RATE)) } : i);
      } else {
        playSound('success');
        return [...prev, { product: p_input, qty: 1, total: Math.round(price * (1 + VAT_RATE)) }];
      }
    });
    setScanMessage({ text: `✅ Thêm: ${repName}`, type: 'success' });
    setBarcodeInput("");
    setShowSuggestions(false);
    setTimeout(() => setScanMessage(null), 2000);
  };

  useEffect(() => {
    if (scannedCodeObj) {
      if (scannerMode === 'product') {
        const p = findProductByCode(scannedCodeObj.code);
        if (p) handleSelectSuggest(p);
        else {
          const matchedPhone = Object.keys(customers).find(phone => phone === scannedCodeObj.code.trim() || customers[phone].cardCode === scannedCodeObj.code.trim());
          if (matchedPhone) {
            playSound('success'); setCustomerInput(customers[matchedPhone].cardCode || matchedPhone); setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); setScanMessage({ text: `✅ KH VIP: ${customers[matchedPhone].name}`, type: 'success' });
          } else {
            playSound('error'); setScanMessage({ text: `❌ Lỗi mã`, type: 'error' });
          }
          setTimeout(() => setScannerMode(null), 1500);
        }
      } else if (scannerMode === 'voucher') {
        const code = scannedCodeObj.code.trim().toUpperCase();
        const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 };
        if (VOUCHERS[code]) {
          setAppliedVoucherAmount(VOUCHERS[code]); setVoucherInput(code); playSound('success'); setScanMessage({ text: `✅ Giảm ${VOUCHERS[code].toLocaleString()}đ`, type: 'success' });
        } else if (!isNaN(Number(code)) && Number(code) > 0) {
          setAppliedVoucherAmount(Number(code)); setVoucherInput(code); playSound('success'); setScanMessage({ text: `✅ Giảm ${Number(code).toLocaleString()}đ`, type: 'success' });
        } else {
          playSound('error'); alert("Mã Voucher không hợp lệ!"); setAppliedVoucherAmount(0);
        }
        setTimeout(() => setScannerMode(null), 1000);
      } else if (scannerMode === 'customer') {
        const val = scannedCodeObj.code.trim();
        setCustomerInput(val);
        const mp = Object.keys(customers).find(ph => ph === val || customers[ph].cardCode === val);
        if (mp) {
          setCustPhone(mp); setCustName(customers[mp].name); playSound('success'); setScanMessage({ text: `✅ Nhận diện VIP: ${customers[mp].name}`, type: 'success' });
        } else {
          setCustPhone(val); setCustName(""); playSound('success'); setScanMessage({ text: `✅ Đã quét mã`, type: 'success' });
        }
        setTimeout(() => setScannerMode(null), 1000);
      }
      setScannedCodeObj(null);
    }
  }, [scannedCodeObj, products, scannerMode]);

  useEffect(() => {
    const handleAfterPrint = () => setPrintMode(null);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  const todayStrStr = new Date().toLocaleDateString('vi-VN');
  
  // FIXED MATH BUGS
  const currentShiftStats = useMemo(() => {
    let cash = 0; let transfer = 0; let prof = 0; let totalSales = 0;
    const shiftLogs = history.filter(h => {
        let d = h.time ? h.time.split(' ')[1] : new Date(Number(h.id)).toLocaleDateString('vi-VN');
        return d === todayStrStr && h.shift === shift;
    });
    shiftLogs.forEach(h => {
      if (h.type === 'BÁN' || h.type === 'GHI NỢ') totalSales += Number(h.total || 0);
      if (h.type === 'BÁN' || h.type === 'THU NỢ' || h.type === 'TRẢ HÀNG') {
        if (h.paymentMethod === 'CHUYỂN KHOẢN') transfer += Number(h.total || 0);
        else if (h.paymentMethod === 'TIỀN MẶT') cash += Number(h.total || 0);
      }
      if(h.type !== 'NHẬP') prof += Number(h.profit || 0);
    });
    return { rev: cash + transfer, cash, transfer, prof, totalSales };
  }, [history, shift, todayStrStr]);

  const todayStats = useMemo(() => {
    let totalSales = 0; let prof = 0;
    history.forEach(h => {
      let d = h.time ? h.time.split(' ')[1] : new Date(Number(h.id)).toLocaleDateString('vi-VN');
      if(d === todayStrStr) {
          if (h.type === 'BÁN' || h.type === 'GHI NỢ') totalSales += Number(h.total || 0);
          if (h.type !== 'NHẬP') prof += Number(h.profit || 0);
      }
    });
    const todayExp = expenses.filter(e => e.date === todayStrStr).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    return { totalSales, netProfit: prof - todayExp, expenses: todayExp };
  }, [history, expenses, todayStrStr]);

  const chartData = useMemo(() => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); const dStr = d.toLocaleDateString('vi-VN');
      const dayTotal = history.filter(h => {
          let logD = h.time ? h.time.split(' ')[1] : new Date(Number(h.id)).toLocaleDateString('vi-VN');
          return logD === dStr && (h.type === 'BÁN' || h.type === 'GHI NỢ');
      }).reduce((s, h) => s + Number(h.total || 0), 0);
      data.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, total: dayTotal, showLabel: (i % 3 === 0 || i === 0) });
    }
    const maxVal = Math.max(...data.map(d => d.total), 1);
    return data.map(d => ({ ...d, height: `${(d.total / maxVal) * 100}%` }));
  }, [history]);

  const topSelling = useMemo(() => {
    const sales: Record<string, number> = {};
    history.forEach(log => {
      if ((log.type === 'BÁN' || log.type === 'GHI NỢ') && log.product_id !== 'DISCOUNT') {
        sales[log.name] = (sales[log.name] || 0) + Number(log.qty || 0);
      }
    });
    return Object.entries(sales).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [history]);

  const groupedHistory = useMemo(() => {
    let filtered = history;
    if (logTypeFilter !== "Tất cả") filtered = filtered.filter(log => log.type === logTypeFilter);
    if (logSearchTerm.trim() !== "") {
      const term = logSearchTerm.toLowerCase();
      filtered = filtered.filter(log => (log.name && log.name.toLowerCase().includes(term)) || (log.customer && log.customer.toLowerCase().includes(term)));
    }
    return filtered.reduce((groups: any, log: any) => {
      const date = log.time ? log.time.split(' ')[1] : new Date(Number(log.id)).toLocaleDateString('vi-VN');
      const t = log.time ? log.time.split(' ')[0] : new Date(Number(log.id)).toLocaleTimeString('vi-VN');
      if (!groups[date]) groups[date] = [];
      groups[date].push({ ...log, t });
      return groups;
    }, {});
  }, [history, logSearchTerm, logTypeFilter]);

  const totalValue = Math.round(products.reduce((sum, p) => sum + (Number(p.import_price || 0) * Number(p.stock || 0)), 0));
  const lowStockCount = products.filter(p => Number(p.stock) > 0 && Number(p.stock) < 10).length;
  const cartTotalAmountDisplay = cart.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const currentTier = getCustomerTier(customers[custPhone]?.totalSpent || 0);
  const tierDiscountAmount = custPhone ? Math.round(cartTotalAmountDisplay * currentTier.discountRate) : 0;
  const amountAfterTierAndVoucher = Math.max(0, cartTotalAmountDisplay - appliedVoucherAmount - tierDiscountAmount);
  const walletUsedAmount = useWallet ? Math.min(Number(customers[custPhone]?.wallet || 0), amountAfterTierAndVoucher) : 0;
  const finalToPay = amountAfterTierAndVoucher - walletUsedAmount;

  const uniqueNames = useMemo(() => Array.from(new Set(products.map(p => cleanName(p.name)))).sort(), [products]);
  const uniqueStocks = useMemo(() => Array.from(new Set(products.map(p => p.stock))).sort((a:any, b:any) => a - b), [products]);
  const uniqueImportPrices = useMemo(() => Array.from(new Set(products.map(p => p.import_price || 0))).sort((a:any, b:any) => a - b), [products]);
  const uniqueSalePrices = useMemo(() => Array.from(new Set(products.map(p => p.sale_price))).sort((a:any, b:any) => a - b), [products]);
  const uniqueExpiries = useMemo(() => Array.from(new Set(products.map(p => p.expiry_date).filter(Boolean))).sort(), [products]);
  const categories = ["Tất cả", ...Array.from(new Set(products.map(p => p.category || "Khác")))];

  const sortedAndFilteredProducts = useMemo(() => {
    const todayTime = new Date().getTime();
    let filtered = products.filter(p => (selectedCategory === "Tất cả" || (p.category || "Khác") === selectedCategory))
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.product_code && p.product_code.toLowerCase().includes(searchTerm.toLowerCase())));
    if (filters['name']?.length > 0) filtered = filtered.filter(p => filters['name'].includes(cleanName(p.name)));
    if (filters['stock']?.length > 0) filtered = filtered.filter(p => filters['stock'].includes(p.stock));
    if (filters['import_price']?.length > 0) filtered = filtered.filter(p => filters['import_price'].includes(p.import_price || 0));
    if (filters['sale_price']?.length > 0) filtered = filtered.filter(p => filters['sale_price'].includes(p.sale_price));
    if (filters['expiry_date']?.length > 0) filtered = filtered.filter(p => filters['expiry_date'].includes(p.expiry_date));
    
    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let valA = a[sortConfig.key]; let valB = b[sortConfig.key];
        if (sortConfig.key === 'expiry_date') { valA = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity; valB = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity; }
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      filtered.sort((a, b) => {
        const daysA = a.expiry_date ? (new Date(a.expiry_date).getTime() - todayTime) / 86400000 : Infinity;
        const daysB = b.expiry_date ? (new Date(b.expiry_date).getTime() - todayTime) / 86400000 : Infinity;
        const aIsUrgent = daysA <= 45; const bIsUrgent = daysB <= 45;
        if (aIsUrgent && !bIsUrgent) return -1; if (!aIsUrgent && bIsUrgent) return 1;
        if (aIsUrgent && bIsUrgent) return daysA - daysB; return 0;
      });
    }
    return filtered;
  }, [products, searchTerm, selectedCategory, sortConfig, filters]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault(); const u = authUsername.trim().toLowerCase(); const p = authPassword.trim();
    if (u === "admin" && p === "khoiphuc88") {
      setAdminPass("haile88"); localStorage.removeItem("mart_admin_pass");
      setStaffPass("123"); localStorage.removeItem("mart_staff_pass");
      setAuthPassword(""); alert("✅ Cài lại MK gốc:\nAdmin: haile88\nNV: 123"); return;
    }
    if (u === "admin" && p === adminPass) {
      setIsLoggedIn(true); setRole("admin"); localStorage.setItem("mart_shift", shift);
      localStorage.setItem("mart_logged_in", "true"); localStorage.setItem("mart_role", "admin");
      logAudit("ĐĂNG NHẬP", "Mở ca");
    } else if (u === "nhanvien" && p === staffPass) {
      setIsLoggedIn(true); setRole("staff"); localStorage.setItem("mart_shift", shift);
      localStorage.setItem("mart_logged_in", "true"); localStorage.setItem("mart_role", "staff");
      logAudit("ĐĂNG NHẬP", "Mở ca");
    } else { alert("❌ Sai tài khoản!"); }
  };

  const handleLogoutClick = () => setShowHandoverModal(true);
  const confirmHandover = () => { logAudit("CHỐT CA", `Bàn giao: ${currentShiftStats.rev.toLocaleString()}đ`); setIsLoggedIn(false); setShowHandoverModal(false); localStorage.removeItem("mart_logged_in"); localStorage.removeItem("mart_role"); };

  const handleEditPhone = async (oldPhone: string) => {
    const newPhone = window.prompt("Nhập SĐT mới:", oldPhone);
    if (newPhone && newPhone.trim() !== "" && newPhone !== oldPhone) {
      if (customers[newPhone]) return alert("❌ SĐT đã tồn tại!");
      const cData = customers[oldPhone]; const newC = { ...cData, phone: newPhone };
      setCustomers((prev: any) => { const updated = { ...prev }; updated[newPhone] = newC; delete updated[oldPhone]; return updated; });
      try { await supabase.from('customers').insert([{ phone: newPhone, name: cData.name, email: cData.email, cardCode: cData.cardCode, totalSpent: cData.totalSpent, wallet: cData.wallet, debt: cData.debt }]); await supabase.from('customers').delete().eq('phone', oldPhone); } catch(e){}
      setHistory((prev: any) => prev.map((h: any) => { if (h.customer && h.customer.includes(oldPhone)) { return { ...h, customer: h.customer.replace(oldPhone, newPhone) } } return h }));
      logAudit("SỬA SĐT KH", `Đổi ${oldPhone} -> ${newPhone}`); alert("✅ Cập nhật thành công!");
    }
  };

  const syncToCloud = async () => {
    if(!window.confirm("Tiến hành đồng bộ toàn bộ dữ liệu máy tính lên Cloud?")) return;
    setLoading(true);
    try {
        const custArr = Object.values(customers);
        if(custArr.length > 0) await supabase.from('customers').upsert(custArr as any);
        if(history.length > 0) {
            for(let i=0; i<history.length; i+=500) await supabase.from('history').upsert(history.slice(i, i+500) as any);
        }
        if(expenses.length > 0) await supabase.from('expenses').upsert(expenses as any);
        if(suppliers.length > 0) await supabase.from('suppliers').upsert(suppliers as any);
        alert("✅ Đồng bộ lên Cloud thành công! Dữ liệu đã được lưu trữ an toàn.");
    } catch(e) {
        alert("❌ Lỗi đồng bộ. Hãy kiểm tra kết nối mạng.");
    }
    setLoading(false);
  };

  const addSupplier = async () => { if (!supName || !supPhone) return alert("Nhập đủ Tên/SĐT"); const newS = { id: Date.now(), name: supName, phone: supPhone, item: supItem }; setSuppliers(prev => [newS, ...prev]); try{await supabase.from('suppliers').insert([newS]);}catch(e){} setSupName(""); setSupPhone(""); setSupItem(""); alert("✅ Thêm NCC thành công!"); };
  const deleteSupplier = async (id: any) => { setSuppliers(prev => prev.filter(s => s.id !== id)); try{await supabase.from('suppliers').delete().eq('id', id);}catch(e){} };
  const addExpense = async () => { if (!expName || !expAmount) return alert("Nhập chi phí!"); const newE = { id: Date.now(), date: new Date().toLocaleDateString('vi-VN'), name: expName, amount: Number(expAmount) }; setExpenses(prev => [newE, ...prev]); try{await supabase.from('expenses').insert([newE]);}catch(e){} setExpName(""); setExpAmount(""); alert("✅ Đã ghi nhận!"); };
  const deleteExpense = async (id: any) => { setExpenses(prev => prev.filter(e => e.id !== id)); try{await supabase.from('expenses').delete().eq('id', id);}catch(e){} };
  
  const sendMarketingEmails = async () => {
    if (!marketingMsg) return alert("Nhập nội dung!"); if (!window.confirm("Giới hạn 200 mail/tháng. Gửi?")) return;
    setLoading(true); const targetCustomers = Object.keys(customers).filter(phone => { const c = customers[phone]; if (!c.email) return false; if (marketingTier === "Tất cả") return true; return getCustomerTier(c.totalSpent).name.includes(marketingTier); });
    if (targetCustomers.length === 0) { setLoading(false); return alert("Không có KH!"); }
    let successCount = 0;
    for (const phone of targetCustomers) {
      const c = customers[phone];
      try { await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_VIP_ID, { to_email: c.email, order_id: "THÔNG BÁO ƯU ĐÃI", time: new Date().toLocaleString('vi-VN'), items_list: `💌 Lời nhắn từ Hải Lê Mart:\n\n${marketingMsg}`, total_amount: "Quà Tặng", payment_method: "Khách VIP", change_amount: "0đ", barcode_url: "" }); successCount++; } catch (e) { }
    }
    setLoading(false); setShowMarketingModal(false); alert(`✅ Đã gửi ${successCount} mail!`);
  };

  const saveSettings = () => {
    if (!newAdminPass || !newStaffPass || !newBankBin || !newBankAcc || !newBankNameStr) return alert("Điền đủ!");
    setAdminPass(newAdminPass); localStorage.setItem("mart_admin_pass", newAdminPass);
    setStaffPass(newStaffPass); localStorage.setItem("mart_staff_pass", newStaffPass);
    setBankBin(newBankBin); localStorage.setItem("mart_bank_bin", newBankBin);
    setBankAcc(newBankAcc); localStorage.setItem("mart_bank_acc", newBankAcc);
    setBankNameStr(newBankNameStr); localStorage.setItem("mart_bank_name", newBankNameStr);
    logAudit("CÀI ĐẶT", "Cập nhật Cấu hình"); alert("✅ Đã lưu!"); setShowSettings(false);
  };

  const handleHoldOrder = async () => {
    if (cart.length === 0) return;
    const newO = { id: Date.now(), time: new Date().toLocaleTimeString('vi-VN'), cart: [...cart] };
    setHeldOrders(prev => [...prev, newO]); try{await supabase.from('held_orders').insert([newO]);}catch(e){}
    logAudit("LƯU TẠM", `Lưu giỏ ${cart.length} món`); setCart([]); setCustPhone(""); setCustName(""); setCustomerInput("");
  };
  const restoreOrder = async (order: any) => {
    if (cart.length > 0) return alert("Thanh toán giỏ hiện tại trước!");
    setCart(order.cart); setHeldOrders(prev => prev.filter(o => o.id !== order.id)); try{await supabase.from('held_orders').delete().eq('id', order.id);}catch(e){} setShowHoldModal(false);
  };
  const deleteHeldOrder = async (id: any) => { setHeldOrders(prev => prev.filter(o => o.id !== id)); try{await supabase.from('held_orders').delete().eq('id', id);}catch(e){} logAudit("XÓA ĐƠN", `Xóa đơn lưu tạm`); };

  const addToCart = (p_input: any) => { handleSelectSuggest(p_input) };

  const adjustCartQty = (productId: any, delta: number) => {
    let exceedStock = false;
    setCart(prev => {
      const updated = prev.map(item => {
        if (item.product.id === productId) {
          const baseCode = item.product.product_code.split('-')[0];
          const totalStock = products.filter(p => p.product_code === baseCode || p.product_code.startsWith(`${baseCode}-`)).reduce((s, p) => s + Number(p.stock || 0), 0);
          const newQty = Number(item.qty) + delta;
          if (newQty > totalStock) { exceedStock = true; return item; }
          const price = getActualPrice(item.product);
          return { ...item, qty: newQty, total: Math.round(newQty * price * (1 + VAT_RATE)), profit: Math.round(newQty * (price - Number(item.product.import_price || 0))) };
        }
        return item;
      });
      return updated.filter(item => item.qty > 0);
    });
    if (exceedStock) playSound('error'); else if (delta > 0) playSound('success');
  };

  const handleDirectQtyChange = (productId: any, val: string) => {
    setCart(prev => {
      if (val === '') return prev.map(i => i.product.id === productId ? { ...i, qty: '' as any, total: 0, profit: 0 } : i);
      let num = parseInt(val); if (isNaN(num) || num < 0) return prev;
      let exceedStock = false;
      const updated = prev.map(i => {
        if (i.product.id === productId) {
          const baseCode = i.product.product_code.split('-')[0];
          const totalStock = products.filter(p => p.product_code === baseCode || p.product_code.startsWith(`${baseCode}-`)).reduce((s, p) => s + Number(p.stock || 0), 0);
          if (num > totalStock) { exceedStock = true; num = totalStock; }
          const price = getActualPrice(i.product);
          return { ...i, qty: num, total: Math.round(num * price * (1 + VAT_RATE)), profit: Math.round(num * (price - Number(i.product.import_price || 0))) };
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
        if (i.product.id === productId) { const price = getActualPrice(i.product); return { ...i, qty: 1, total: Math.round(1 * price * (1 + VAT_RATE)), profit: Math.round(1 * (price - Number(i.product.import_price || 0))) } }
        return i;
      }));
    }
  };

  const removeFromCart = (productId: any) => { setCart(cart.filter(item => item.product.id !== productId)) };
  const clearCart = () => { if (window.confirm("Hủy toàn bộ?")) { setCart([]); setCustName(""); setCustPhone(""); setCustomerInput(""); } };

  const confirmCheckout = async (payMethod: 'TIỀN MẶT' | 'CHUYỂN KHOẢN' | 'GHI NỢ') => {
    if (cart.some(i => !i.qty || i.qty <= 0)) { playSound('error'); return alert("Lỗi Số Lượng!") }
    if (payMethod === 'GHI NỢ' && !custPhone) return alert("Ghi nợ cần số điện thoại!");
    setLoading(true); let logs: any[] = [];
    const subTotal = Math.round(cart.reduce((s, i) => s + (Number(i.qty) * getActualPrice(i.product)), 0));
    const vatTotal = Math.round(subTotal * VAT_RATE);
    const baseTotal = subTotal + vatTotal;
    const totalAfterVoucher = Math.max(0, baseTotal - appliedVoucherAmount);
    const tier = getCustomerTier(customers[custPhone]?.totalSpent || 0);
    const tDiscount = custPhone ? Math.round(cartTotalAmountDisplay * tier.discountRate) : 0;
    const amountAfterTierAndVoucher = Math.max(0, totalAfterVoucher - tDiscount);
    const walletUsedAmount = useWallet && payMethod !== 'GHI NỢ' ? Math.round(Math.min(Number(customers[custPhone]?.wallet || 0), amountAfterTierAndVoucher)) : 0;
    const finalTotal = amountAfterTierAndVoucher - walletUsedAmount;
    const totalDiscount = appliedVoucherAmount + walletUsedAmount + tDiscount;
    const earned = payMethod === 'GHI NỢ' ? 0 : Math.round(finalTotal * 0.02);

    for (const item of cart) {
      const baseCode = item.product.product_code.split('-')[0];
      const batches = products.filter(p => p.product_code === baseCode || p.product_code.startsWith(`${baseCode}-`)).sort((a, b) => { if (!a.expiry_date) return 1; if (!b.expiry_date) return -1; return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime() });
      let rem = Number(item.qty); const price = getActualPrice(item.product);
      for (const b of batches) {
        if (rem <= 0) break;
        if (Number(b.stock) > 0) {
          const take = Math.min(rem, Number(b.stock));
          try{await supabase.from("products").update({ stock: Number(b.stock) - take }).eq("id", b.id);}catch(e){}
          logs.push({ id: Math.floor(Date.now() + Math.random() * 1000), shift, type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", name: cleanName(b.name) + (item.product.isHappyHour ? ' [Giờ Vàng]' : ''), qty: take, total: Math.round(take * price * (1 + VAT_RATE)), profit: Math.round(take * (price - Number(b.import_price || 0))), customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: b.id, refunded_qty: 0, paymentMethod: payMethod, time: new Date().toLocaleString('vi-VN') });
          rem -= take;
        }
      }
    }

    if (totalDiscount > 0) {
      logs.push({ id: Math.floor(Date.now() + Math.random() * 1000), shift, type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", name: "Giảm giá/Ví/VIP", qty: 1, total: -totalDiscount, profit: -totalDiscount, customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: 'DISCOUNT', refunded_qty: 0, paymentMethod: payMethod, time: new Date().toLocaleString('vi-VN') });
    }
    
    try{await supabase.from('history').insert(logs);}catch(e){}
    
    if (custPhone) {
      const updatedCust = { name: custName, wallet: payMethod === 'GHI NỢ' ? Number(customers[custPhone]?.wallet || 0) : Math.round(Number(customers[custPhone]?.wallet || 0) - walletUsedAmount + earned), debt: Number(customers[custPhone]?.debt || 0) + (payMethod === 'GHI NỢ' ? finalTotal : 0), totalSpent: Number(customers[custPhone]?.totalSpent || 0) + (payMethod !== 'GHI NỢ' ? finalTotal : 0), email: customers[custPhone]?.email || "", cardCode: customers[custPhone]?.cardCode || "" };
      setCustomers((prev: any) => ({ ...prev, [custPhone]: updatedCust }));
      try{await supabase.from('customers').upsert([{ phone: custPhone, ...updatedCust }]);}catch(e){}
    }
    setHistory(prev => [...logs, ...prev]);
    setLastOrder({ orderId: "HD" + Math.floor(Date.now() / 1000).toString().slice(-6), shift, cart: [...cart], subTotal, vatTotal, finalTotal: payMethod === 'GHI NỢ' ? 0 : finalTotal, debtAmount: payMethod === 'GHI NỢ' ? finalTotal : 0, discount: totalDiscount, time: new Date().toLocaleString('vi-VN'), paymentMethod: payMethod, customerGiven: payMethod === 'TIỀN MẶT' ? Number(customerGiven) : 0 });
    setCheckoutStep(3); fetchProducts(); setLoading(false);
  };

  const handleRefund = async (logId: any) => {
    const logIndex = history.findIndex(l => l.id === logId); if (logIndex === -1) return; const log = history[logIndex]; if (log.type !== 'BÁN') return alert("Chỉ hoàn đơn BÁN!");
    const maxRefund = log.qty - (log.refunded_qty || 0); if (maxRefund <= 0) return alert("Đã hoàn toàn bộ!"); const qStr = window.prompt(`SP: ${cleanName(log.name)}\nĐã mua: ${log.qty} | Có thể hoàn: ${maxRefund}\nNhập SL:`, maxRefund.toString());
    if (!qStr) return; const refundQty = parseInt(qStr); if (isNaN(refundQty) || refundQty <= 0 || refundQty > maxRefund) { playSound('error'); return alert("Lỗi SL!"); } if (!window.confirm(`Hoàn ${refundQty}?`)) return;
    const unitTotal = log.total / log.qty; const unitProfit = log.profit / log.qty; const refundTotal = Math.round(unitTotal * refundQty); const refundProfit = Math.round(unitProfit * refundQty); const p = products.find(x => x.id === log.product_id); if (p) await supabase.from("products").update({ stock: Number(p.stock) + refundQty }).eq("id", p.id);
    let refundedToWallet = false; if (log.customer && log.customer !== "Khách lẻ") { const phoneMatch = log.customer.match(/\((.*?)\)/); if (phoneMatch && phoneMatch[1]) { const phone = phoneMatch[1]; if (customers[phone] && window.confirm(`Hoàn ${refundTotal.toLocaleString()}đ vào VÍ ĐIỂM?\n- OK: VÍ\n- Cancel: TIỀN MẶT`)) { const newW = Number(customers[phone].wallet || 0) + refundTotal; setCustomers((prev: any) => ({ ...prev, [phone]: { ...prev[phone], wallet: newW } })); try{await supabase.from('customers').upsert([{ phone, name: customers[phone].name, wallet: newW, debt: customers[phone].debt, totalSpent: customers[phone].totalSpent, email: customers[phone].email, cardCode: customers[phone].cardCode }]);}catch(e){} logAudit("HOÀN VÍ", `Hoàn ${refundTotal.toLocaleString()}đ`); refundedToWallet = true } } }
    try{await supabase.from('history').update({ refunded_qty: (log.refunded_qty || 0) + refundQty }).eq('id', log.id);}catch(e){}
    const refundLog = { id: Math.floor(Date.now() + Math.random() * 1000), shift, type: "TRẢ HÀNG", name: log.name + (refundedToWallet ? " (Ví)" : " (TM)"), qty: refundQty, total: -refundTotal, profit: -refundProfit, customer: log.customer, paymentMethod: refundedToWallet ? 'VÍ ĐIỂM' : 'TIỀN MẶT', time: new Date().toLocaleString('vi-VN') };
    try{await supabase.from('history').insert([refundLog]);}catch(e){}
    const updatedHistory = [...history]; updatedHistory[logIndex].refunded_qty = (log.refunded_qty || 0) + refundQty; updatedHistory.unshift(refundLog); setHistory(updatedHistory); fetchProducts(); logAudit("TRẢ HÀNG", `Hoàn ${refundQty}`); playSound('success'); alert(`Thành công!`);
  };

  const handlePayDebt = async (phone: string) => {
    const currentDebt = Number(customers[phone]?.debt || 0); const payAmtStr = window.prompt(`Khách nợ ${currentDebt.toLocaleString()}đ. Nhập tiền:`, currentDebt.toString());
    if (payAmtStr && parseInt(payAmtStr) > 0) {
      const amt = parseInt(payAmtStr); const isTransfer = window.confirm(`Thu nợ bằng CK (OK) hay TM (Cancel)?`); const pMethod = isTransfer ? 'CHUYỂN KHOẢN' : 'TIỀN MẶT';
      const newD = Math.max(0, currentDebt - amt);
      setCustomers((prev: any) => ({ ...prev, [phone]: { ...prev[phone], debt: newD } }));
      try{await supabase.from('customers').upsert([{ phone, name: customers[phone].name, debt: newD, wallet: customers[phone].wallet, totalSpent: customers[phone].totalSpent, email: customers[phone].email, cardCode: customers[phone].cardCode }]);}catch(e){}
      const dLog = { id: Math.floor(Date.now() + Math.random() * 1000), shift, type: "THU NỢ", name: "Thanh toán công nợ", qty: 1, total: amt, profit: 0, customer: `${customers[phone].name} (${phone})`, paymentMethod: pMethod, time: new Date().toLocaleString('vi-VN') };
      setHistory(prev => [dLog, ...prev]); try{await supabase.from('history').insert([dLog]);}catch(e){}
      logAudit("THU NỢ", `Thu ${amt}đ`); alert("Thành công!")
    }
  };

  const sendReceiptEmail = async () => {
    if (!lastOrder) return; const savedEmail = (lastOrder.custPhone && customers[lastOrder.custPhone] && customers[lastOrder.custPhone].email) ? customers[lastOrder.custPhone].email : ""; const email = window.prompt("Nhập Email:", savedEmail);
    if (!email) return; if (lastOrder.custPhone) { setCustomers((prev: any) => ({ ...prev, [lastOrder.custPhone]: { ...prev[lastOrder.custPhone], email: email } })); try{await supabase.from('customers').upsert([{ phone: lastOrder.custPhone, email: email, name: customers[lastOrder.custPhone].name, debt: customers[lastOrder.custPhone].debt, wallet: customers[lastOrder.custPhone].wallet, totalSpent: customers[lastOrder.custPhone].totalSpent, cardCode: customers[lastOrder.custPhone].cardCode }]);}catch(e){} }
    setLoading(true); let itemsTable = ""; lastOrder.cart.forEach((item: any) => { itemsTable += `- ${cleanName(item.product.name)} x ${item.qty} = ${Math.round(item.qty * Math.round(getActualPrice(item.product)) * (1 + VAT_RATE)).toLocaleString()}đ\n` }); const emailData = { to_email: email, order_id: lastOrder.orderId, time: lastOrder.time, items_list: itemsTable, total_amount: Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString() + "đ", payment_method: lastOrder.paymentMethod, change_amount: lastOrder.paymentMethod === 'TIỀN MẶT' ? Math.round(lastOrder.customerGiven - lastOrder.finalTotal).toLocaleString() + "đ" : "0đ" }; try { await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailData); alert("🚀 Đã gửi HĐ!"); } catch (error) { alert("❌ Lỗi gửi mail."); } setLoading(false)
  };

  const sendCardEmail = async (phone: string) => {
    const cust = customers[phone]; const email = cust.email || window.prompt(`Nhập Email của ${cust.name}:`, "");
    if (!email) return; if (!cust.email) { setCustomers((prev: any) => ({ ...prev, [phone]: { ...prev[phone], email } })); try{await supabase.from('customers').upsert([{ phone, email, name: cust.name, debt: cust.debt, wallet: cust.wallet, totalSpent: cust.totalSpent, cardCode: cust.cardCode }]);}catch(e){} }
    setLoading(true); const code = cust.cardCode || phone; const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(code)}&scale=2&height=10&includetext=true`; const emailData = { to_email: email, order_id: "THẺ THÀNH VIÊN", time: new Date().toLocaleString('vi-VN'), items_list: `💳 MÃ THẺ CỦA BẠN LÀ: ${code}\n(Vui lòng xuất trình Thẻ/Mã vạch bên dưới khi thanh toán)`, total_amount: "Ưu đãi Đặc Quyền", payment_method: "VIP Member", change_amount: "0đ", barcode_url: barcodeUrl }; try { await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_VIP_ID, emailData); alert("🚀 Đã gửi Thẻ VIP!"); } catch (error) { alert("❌ Lỗi gửi mail."); } setLoading(false)
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); const added = parseInt(newStock || "0"); const impPrice = parseInt(newImportPrice); const salePrice = parseInt(newPrice); const promo = parseInt(newPromoPrice) || 0; const finalGiftInfo = newGiftInfo.trim() !== "" ? `${newGiftCondition};;;${newGiftInfo}` : null; const baseCode = newCode.trim(); const allVariants = products.filter(p => p.product_code === baseCode || p.product_code.startsWith(`${baseCode}-`)); const exist = allVariants.find(p => p.product_code === baseCode); let priceUpdatedMsg = "";
    if (allVariants.length > 0 && allVariants[0].sale_price !== salePrice) { await Promise.all(allVariants.map(v => supabase.from("products").update({ sale_price: salePrice, promo_price: promo }).eq("id", v.id))); priceUpdatedMsg = `\n💡 Đã ĐỒNG BỘ GIÁ lô cũ!`; logAudit("ĐỒNG BỘ GIÁ", `Mã ${baseCode}`); }
    if (exist) {
      if (Number(exist.stock) <= 0) {
        await supabase.from("products").update({ name: newName, category: newCategory || "Khác", import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null, created_at: new Date().toISOString() }).eq("id", exist.id);
        if (added > 0) { const lg = { id: Math.floor(Date.now() + Math.random() * 1000), shift, type: "NHẬP", name: newName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }; setHistory(prev => [lg, ...prev]); try{await supabase.from('history').insert([lg]);}catch(e){} } logAudit("NHẬP ĐÈ CŨ", `${newName}`); alert(`Đã nhập hàng!${priceUpdatedMsg}`)
      } else {
        if (exist.import_price !== impPrice || (exist.expiry_date || "") !== (newExpiry || "")) {
          const batchCode = `${baseCode}-${Date.now().toString().slice(-4)}`; const batchName = `${newName} [Lô ${newExpiry ? new Date(newExpiry).toLocaleDateString('vi-VN') : 'Mới'}]`;
          if (window.confirm(`Tạo LÔ MỚI (${batchCode})?`)) {
            await supabase.from("products").insert([{ product_code: batchCode, name: batchName, category: newCategory || "Khác", import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null }]);
            if (added > 0) { const lg = { id: Math.floor(Date.now() + Math.random() * 1000), shift, type: "NHẬP", name: batchName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }; setHistory(prev => [lg, ...prev]); try{await supabase.from('history').insert([lg]);}catch(e){} } logAudit("TÁCH LÔ", `${batchName}`); if (!priceUpdatedMsg) alert(`Đã tạo mới!`)
          } else { setLoading(false); return }
        } else {
          await supabase.from("products").update({ stock: Number(exist.stock) + added, created_at: new Date().toISOString() }).eq("id", exist.id);
          if (added > 0) { const lg = { id: Math.floor(Date.now() + Math.random() * 1000), shift, type: "NHẬP", name: newName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }; setHistory(prev => [lg, ...prev]); try{await supabase.from('history').insert([lg]);}catch(e){} } logAudit("CỘNG DỒN", `${newName}`); alert(`Cộng dồn thành công!${priceUpdatedMsg}`)
        }
      }
    } else {
      await supabase.from("products").insert([{ product_code: baseCode, name: newName, category: newCategory || "Khác", import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null }]);
      if (added > 0) { const lg = { id: Math.floor(Date.now() + Math.random() * 1000), shift, type: "NHẬP", name: newName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }; setHistory(prev => [lg, ...prev]); try{await supabase.from('history').insert([lg]);}catch(e){} } logAudit("NHẬP MỚI", `${newName}`); if (priceUpdatedMsg) alert(`Nhập thành công!${priceUpdatedMsg}`)
    }
    setNewCode(""); setNewName(""); setNewCategory("Đồ uống"); setNewImportPrice(""); setNewPrice(""); setNewPromoPrice(""); setNewGiftCondition("1"); setNewGiftInfo(""); setNewStock(""); setNewExpiry(""); fetchProducts(); setLoading(false); setShowInputForm(false)
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader();
    reader.onload = async (event) => {
      setLoading(true); try {
        const text = event.target?.result as string; const lines = text.split('\n').filter(line => line.trim() !== ''); if (lines.length <= 1) { alert("File rỗng!"); setLoading(false); return } let successCount = 0; let importLogs: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(c => c.trim().replace(/^"|"$/g, '')); if (cols.length < 5) continue; const pCode = cols[0]; const pName = cols[1]; const pCategory = cols[2] || "Khác"; const pImpPrice = parseInt(cols[3]) || 0; const pSalePrice = parseInt(cols[4]) || 0; const pPromoPrice = parseInt(cols[5]) || 0; const pGift = cols[6] || null; const pStock = parseInt(cols[7]) || 0; const pExpiry = cols[8] || null; if (!pCode || !pName || pSalePrice <= 0) continue;
          const baseCode = pCode.trim(); const allVariants = products.filter(p => p.product_code === baseCode || p.product_code.startsWith(`${baseCode}-`)); if (allVariants.length > 0 && allVariants[0].sale_price !== pSalePrice) { await Promise.all(allVariants.map(v => supabase.from("products").update({ sale_price: pSalePrice, promo_price: pPromoPrice }).eq("id", v.id))); if (!importLogs.find(l => l.name === `Đồng bộ giá ${baseCode}`)) importLogs.push({ id: Math.floor(Date.now() + Math.random() * 1000), shift, type: "HỆ THỐNG", name: `Đồng bộ giá ${baseCode}`, qty: 0, total: 0, time: new Date().toLocaleString('vi-VN') }) }
          const exist = allVariants.find(p => p.product_code === baseCode); if (exist) { if (Number(exist.stock) <= 0) await supabase.from("products").update({ name: pName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry, created_at: new Date().toISOString() }).eq("id", exist.id); else { if (exist.import_price !== pImpPrice || (exist.expiry_date || "") !== (pExpiry || "")) { const batchCode = `${baseCode}-${Date.now().toString().slice(-4)}${i}`; const batchName = `${pName} [Lô ${pExpiry ? new Date(pExpiry).toLocaleDateString('vi-VN') : 'Mới'}]`; await supabase.from("products").insert([{ product_code: batchCode, name: batchName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry }]); } else await supabase.from("products").update({ stock: Number(exist.stock) + pStock, created_at: new Date().toISOString() }).eq("id", exist.id) } } else await supabase.from("products").insert([{ product_code: baseCode, name: pName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry }]); if (pStock > 0) importLogs.push({ id: Math.floor(Date.now() + Math.random() * 1000), shift, type: "NHẬP", name: cleanName(pName), qty: pStock, total: 0, time: new Date().toLocaleString('vi-VN') }); successCount++
        }
        if (importLogs.length > 0) { setHistory(prev => [...importLogs, ...prev]); try{await supabase.from('history').insert(importLogs);}catch(e){} } logAudit("NHẬP FILE", `Nhập ${successCount} mã`); alert(`Nhập thành công ${successCount} SP!`); fetchProducts()
      } catch (err) { alert("Lỗi file CSV."); } setLoading(false)
    }; reader.readAsText(file); e.target.value = ''
  };

  const renderHeaderIcon = (colKey: string) => { const isFiltered = filters[colKey]?.length > 0; return (<span onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === colKey ? null : colKey) }} style={{ cursor: "pointer", color: isFiltered || sortConfig?.key === colKey ? '#ef4444' : '#94a3b8', fontSize: "10px", padding: "2px", marginLeft: "4px", border: isFiltered ? "1px dashed #ef4444" : "1px solid transparent", borderRadius: "2px" }} title="Lọc">🔽</span>) };
  const renderFilterPopup = (colKey: string, title: string, uniqueValues: any[], formatVal?: (v: any) => string) => { if (openFilter !== colKey) return null; return (<div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "100%", left: colKey === 'name' ? "0" : "50%", transform: colKey === 'name' ? "none" : "translateX(-50%)", background: "#fff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px", zIndex: 999, boxShadow: "0 10px 25px rgba(0,0,0,0.2)", minWidth: "160px", textAlign: "left", color: "#1e293b", fontWeight: "normal", fontSize: "12px" }}><div style={{ fontWeight: "bold", color: "#64748b", fontSize: "10px", marginBottom: "6px" }}>LỌC {title}:</div><div style={{ overflowY: "auto", maxHeight: "150px" }}>{uniqueValues.map((v, i) => (<label key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px", cursor: "pointer" }}><input type="checkbox" checked={filters[colKey]?.includes(v) || false} onChange={() => { setFilters(prev => { const cur = prev[colKey] || []; if (cur.includes(v)) return { ...prev, [colKey]: cur.filter(x => x !== v) }; return { ...prev, [colKey]: [...cur, v] } }) }} /><span>{formatVal ? formatVal(v) : v}</span></label>))}</div>{filters[colKey]?.length > 0 && <div style={{ marginTop: "8px", textAlign: "center", cursor: "pointer", color: "#ef4444", fontWeight: "bold", fontSize: "11px" }} onClick={() => setFilters(prev => ({ ...prev, [colKey]: [] }))}>❌ Bỏ lọc</div>}</div>) };

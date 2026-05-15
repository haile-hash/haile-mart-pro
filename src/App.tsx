import React, { useEffect, useState, useMemo } from "react";
// @ts-ignore
import { supabase } from "./supabaseClient";

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
  const [newAdminPass, setNewAdminPass] = useState(""); const [newStaffPass, setNewStaffPass] = useState("");
  const [newBankBin, setNewBankBin] = useState(""); const [newBankAcc, setNewBankAcc] = useState(""); const [newBankNameStr, setNewBankNameStr] = useState("");

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
  const [scanMessage, setScanMessage] = useState<{text: string, type: 'success'|'error'} | null>(null);
  
  const [printBarcodeProduct, setPrintBarcodeProduct] = useState<any>(null);
  const [printCustomer, setPrintCustomer] = useState<any>(null); 
  const [barcodeCount, setBarcodeCount] = useState<number>(30);
  const [printMode, setPrintMode] = useState<'receipt' | 'barcode' | 'customer_card' | null>(null);

  const [newCode, setNewCode] = useState(""); const [newName, setNewName] = useState(""); const [newImportPrice, setNewImportPrice] = useState(""); const [newPrice, setNewPrice] = useState(""); const [newPromoPrice, setNewPromoPrice] = useState(""); const [newGiftCondition, setNewGiftCondition] = useState("1"); const [newGiftInfo, setNewGiftInfo] = useState(""); const [newStock, setNewStock] = useState(""); const [newExpiry, setNewExpiry] = useState(""); const [newCategory, setNewCategory] = useState("Đồ uống"); 
  const [expName, setExpName] = useState(""); const [expAmount, setExpAmount] = useState("");
  const [supName, setSupName] = useState(""); const [supPhone, setSupPhone] = useState(""); const [supItem, setSupItem] = useState("");
  const [marketingTier, setMarketingTier] = useState("Tất cả"); const [marketingMsg, setMarketingMsg] = useState("");

  const [cart, setCart] = useState<any[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");

  const [customers, setCustomers] = useState<any>(() => { const saved = localStorage.getItem("mart_customers"); return saved ? JSON.parse(saved) : {}; });
  const [heldOrders, setHeldOrders] = useState<any[]>(() => { const saved = localStorage.getItem("mart_held_orders"); return saved ? JSON.parse(saved) : []; });
  const [auditLogs, setAuditLogs] = useState<any[]>(() => { const saved = localStorage.getItem("mart_audit"); return saved ? JSON.parse(saved) : []; });
  const [expenses, setExpenses] = useState<any[]>(() => { const saved = localStorage.getItem("mart_expenses"); return saved ? JSON.parse(saved) : []; });
  const [suppliers, setSuppliers] = useState<any[]>(() => { const saved = localStorage.getItem("mart_suppliers"); return saved ? JSON.parse(saved) : []; });

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); 
  const [customerInput, setCustomerInput] = useState(""); const [custPhone, setCustPhone] = useState(""); const [custName, setCustName] = useState("");
  const [useWallet, setUseWallet] = useState(false); const [voucherInput, setVoucherInput] = useState(""); const [appliedVoucherAmount, setAppliedVoucherAmount] = useState<number>(0);
  const [customerGiven, setCustomerGiven] = useState<number | "">(""); const [lastOrder, setLastOrder] = useState<any>(null);

  const [history, setHistory] = useState<any[]>(() => { const saved = localStorage.getItem("mart_history"); return saved ? JSON.parse(saved) : []; });
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [logSearchTerm, setLogSearchTerm] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState("Tất cả");

  const playSound = (type: 'success' | 'error') => { try { const ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); if (type === 'success') { osc.frequency.value = 800; gain.gain.setValueAtTime(0.1, ctx.currentTime); osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1); } else { osc.frequency.value = 250; osc.type = 'square'; gain.gain.setValueAtTime(0.1, ctx.currentTime); osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3); } } catch(e) {} };
  const logAudit = (action: string, detail: string) => { const newLog = { id: Date.now(), time: new Date().toLocaleString('vi-VN'), user: role === 'admin' ? 'Quản lý' : 'Thu ngân', shift, action, detail }; setAuditLogs(prev => [newLog, ...prev].slice(0, 200)); };
  const parseGift = (giftStr: string | null) => { if (!giftStr) return { cond: 0, text: "" }; if (giftStr.includes(';;;')) { const parts = giftStr.split(';;;'); return { cond: parseInt(parts[0]) || 1, text: parts[1] || "" }; } return { cond: 1, text: giftStr }; };
  const cleanName = (name: string) => name ? name.split(' [Lô')[0] : '';
  const getActualPrice = (p: any) => { let price = (p.promo_price && p.promo_price > 0) ? p.promo_price : p.sale_price; const currentHour = new Date().getHours(); if ((currentHour >= 20 || currentHour < 6) && (p.category === 'Đồ ăn liền' || p.category === 'Bánh Kẹo')) { price = price * 0.8; p.isHappyHour = true; } else { p.isHappyHour = false; } return Math.round(price); };
  
  const getCustomerTier = (totalSpent = 0) => {
      if (totalSpent >= 500000000) return { name: "💎 KIM CƯƠNG", discountRate: 0.10, color: "#a855f7", bg: "#faf5ff", border: "#e9d5ff" };
      if (totalSpent >= 200000000) return { name: "🥇 VÀNG", discountRate: 0.05, color: "#ca8a04", bg: "#fefce8", border: "#fef08a" };
      if (totalSpent >= 50000000)  return { name: "🥈 BẠC", discountRate: 0.02, color: "#475569", bg: "#f8fafc", border: "#cbd5e1" };
      return { name: "🥉 ĐỒNG", discountRate: 0, color: "#b45309", bg: "#fffbeb", border: "#fde68a" };
  };

  const fetchProducts = async () => { const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false }); if (data) setProducts(data); };
  const findProductByCode = (code: string) => { const rawCode = code.trim(); let matches = products.filter(prod => prod.product_code === rawCode || prod.product_code.startsWith(`${rawCode}-`)); let available = matches.filter(p => p.stock > 0); if (available.length > 0) { available.sort((a,b) => { if(!a.expiry_date) return 1; if(!b.expiry_date) return -1; return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime(); }); return available[0]; } return matches.length > 0 ? matches[0] : null; };
  const getOldestAvailableBatch = (p: any) => { const baseCode = p.product_code.split('-')[0]; let availableMatches = products.filter(prod => (prod.product_code === baseCode || prod.product_code.startsWith(`${baseCode}-`)) && prod.stock > 0); if (availableMatches.length === 0) return p; availableMatches.sort((a,b) => { if(!a.expiry_date) return 1; if(!b.expiry_date) return -1; return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime(); }); return availableMatches[0]; };

  useEffect(() => { const timer = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { localStorage.setItem("mart_history", JSON.stringify(history)); localStorage.setItem("mart_customers", JSON.stringify(customers)); localStorage.setItem("mart_held_orders", JSON.stringify(heldOrders)); localStorage.setItem("mart_audit", JSON.stringify(auditLogs)); localStorage.setItem("mart_expenses", JSON.stringify(expenses)); localStorage.setItem("mart_suppliers", JSON.stringify(suppliers)); }, [history, customers, heldOrders, auditLogs, expenses, suppliers]);
  useEffect(() => { if (isLoggedIn) { fetchProducts(); const channel = supabase.channel("db_changes").on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchProducts()).subscribe(); const script = document.createElement("script"); script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"; script.onload = () => { (window as any).emailjs.init(EMAILJS_PUBLIC_KEY); }; document.head.appendChild(script); return () => { supabase.removeChannel(channel); }; } }, [isLoggedIn]);
  useEffect(() => {
    if (scannerMode !== null) {
      let scanner: any; let lastScanTime = 0;
      const loadScanner = () => { if ((window as any).Html5QrcodeScanner) { scanner = new (window as any).Html5QrcodeScanner("qr-reader", { fps: 15, qrbox: { width: 250, height: 120 }, rememberLastUsedCamera: true }, false); scanner.render((text: string) => { const now = Date.now(); if (now - lastScanTime < 1500) return; lastScanTime = now; setScannedCodeObj({ code: text, time: now }); }, undefined); } };
      if (!(window as any).Html5QrcodeScanner) { const script = document.createElement("script"); script.src = "https://unpkg.com/html5-qrcode"; script.onload = loadScanner; document.head.appendChild(script); } else loadScanner(); return () => { if (scanner) scanner.clear().catch(()=>{}); };
    }
  }, [scannerMode]);

  useEffect(() => {
    if (scannedCodeObj) {
      if (scannerMode === 'product') {
          const p = findProductByCode(scannedCodeObj.code);
          if (p) handleSelectSuggest(p);
          else { const matchedPhone = Object.keys(customers).find(phone => phone === scannedCodeObj.code.trim() || customers[phone].cardCode === scannedCodeObj.code.trim()); if (matchedPhone) { playSound('success'); setCustomerInput(customers[matchedPhone].cardCode || matchedPhone); setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); setScanMessage({ text: `✅ Đã chọn KH VIP: ${customers[matchedPhone].name}`, type: 'success' }); } else { playSound('error'); setScanMessage({ text: `❌ Không tìm thấy mã`, type: 'error' }); } setTimeout(() => setScannerMode(null), 1500); }
      } 
      else if (scannerMode === 'voucher') {
          const code = scannedCodeObj.code.trim().toUpperCase(); const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 };
          if (VOUCHERS[code]) { setAppliedVoucherAmount(VOUCHERS[code]); setVoucherInput(code); playSound('success'); setScanMessage({ text: `✅ Đã áp dụng giảm ${VOUCHERS[code].toLocaleString()}đ`, type: 'success' }); } else if (!isNaN(Number(code)) && Number(code) > 0) { setAppliedVoucherAmount(Number(code)); setVoucherInput(code); playSound('success'); setScanMessage({ text: `✅ Đã nhận mức giảm ${Number(code).toLocaleString()}đ`, type: 'success' }); } else { playSound('error'); alert("Mã Voucher không hợp lệ!"); setAppliedVoucherAmount(0); } setTimeout(() => setScannerMode(null), 1000);
      }
      else if (scannerMode === 'customer') {
          const val = scannedCodeObj.code.trim(); setCustomerInput(val); const matchedPhone = Object.keys(customers).find(phone => phone === val || customers[phone].cardCode === val);
          if (matchedPhone) { setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); playSound('success'); setScanMessage({ text: `✅ Nhận diện VIP: ${customers[matchedPhone].name}`, type: 'success' }); } else { setCustPhone(val); setCustName(""); playSound('success'); setScanMessage({ text: `✅ Đã quét mã (Khách mới)`, type: 'success' }); } setTimeout(() => setScannerMode(null), 1000);
      }
      setScannedCodeObj(null); setTimeout(() => setScanMessage(null), 1500); 
    }
  }, [scannedCodeObj, products, scannerMode]);

  useEffect(() => { const handleAfterPrint = () => setPrintMode(null); window.addEventListener("afterprint", handleAfterPrint); return () => window.removeEventListener("afterprint", handleAfterPrint); }, []);

  const todayStrStr = new Date().toLocaleDateString('vi-VN');

  const currentShiftStats = useMemo(() => {
    const shiftLogs = history.filter(h => new Date(Math.floor(h.id)).toLocaleDateString('vi-VN') === todayStrStr && h.shift === shift); let cash = 0; let transfer = 0; let prof = 0; let totalSales = 0;
    shiftLogs.forEach(h => { if (h.type === 'BÁN' || h.type === 'GHI NỢ') totalSales += h.total; if (h.type === 'BÁN' || h.type === 'THU NỢ' || h.type === 'TRẢ HÀNG') { if (h.paymentMethod === 'CHUYỂN KHOẢN') transfer += h.total; else if (h.paymentMethod === 'TIỀN MẶT') cash += h.total; } prof += (h.profit || 0); });
    return { rev: cash + transfer, cash, transfer, prof, totalSales };
  }, [history, shift, todayStrStr]);

  const todayStats = useMemo(() => {
    const todayHistory = history.filter(h => new Date(Math.floor(h.id)).toLocaleDateString('vi-VN') === todayStrStr); let cash = 0; let transfer = 0; let prof = 0; let totalSales = 0;
    todayHistory.forEach(h => { if (h.type === 'BÁN' || h.type === 'GHI NỢ') totalSales += h.total; if (h.type === 'BÁN' || h.type === 'THU NỢ' || h.type === 'TRẢ HÀNG') { if (h.paymentMethod === 'CHUYỂN KHOẢN') transfer += h.total; else if (h.paymentMethod === 'TIỀN MẶT') cash += h.total; } prof += (h.profit || 0); });
    const todayExp = expenses.filter(e => e.date === todayStrStr).reduce((sum, e) => sum + e.amount, 0); return { rev: cash + transfer, cash, transfer, prof, totalSales, expenses: todayExp, netProfit: prof - todayExp };
  }, [history, expenses, todayStrStr]);

  const chartData = useMemo(() => {
    const data = [];
    for(let i=29; i>=0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); const dStr = d.toLocaleDateString('vi-VN');
        const dayTotal = history.filter(h => new Date(Math.floor(h.id)).toLocaleDateString('vi-VN') === dStr && (h.type === 'BÁN' || h.type === 'GHI NỢ')).reduce((s, h) => s + h.total, 0);
        data.push({ label: `${d.getDate()}/${d.getMonth()+1}`, total: dayTotal, showLabel: (i % 3 === 0 || i === 0) });
    }
    const maxVal = Math.max(...data.map(d => d.total), 1); return data.map(d => ({ ...d, height: `${(d.total / maxVal) * 100}%` }));
  }, [history]);

  const topSelling = useMemo(() => {
    const sales: Record<string, number> = {}; history.forEach(log => { if((log.type === 'BÁN' || log.type === 'GHI NỢ') && log.product_id !== 'DISCOUNT') sales[log.name] = (sales[log.name]||0) + log.qty; }); return Object.entries(sales).sort((a,b)=>b[1]-a[1]).slice(0,5);
  }, [history]);

  const groupedHistory = useMemo(() => {
    let filtered = history; if (logTypeFilter !== "Tất cả") filtered = filtered.filter(log => log.type === logTypeFilter);
    if (logSearchTerm.trim() !== "") { const term = logSearchTerm.toLowerCase(); filtered = filtered.filter(log => (log.name && log.name.toLowerCase().includes(term)) || (log.customer && log.customer.toLowerCase().includes(term)) ); }
    return filtered.reduce((groups: any, log: any) => { const date = new Date(Math.floor(log.id)).toLocaleDateString('vi-VN'); if (!groups[date]) groups[date] = []; groups[date].push({ ...log, t: new Date(Math.floor(log.id)).toLocaleTimeString('vi-VN') }); return groups; }, {});
  }, [history, logSearchTerm, logTypeFilter]);

  const totalValue = Math.round(products.reduce((sum, p) => sum + ((Number(p.import_price) || 0) * (Number(p.stock) || 0)), 0));
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock < 10).length;

  const cartTotalAmountDisplay = cart.reduce((sum, item) => sum + item.total, 0);
  const currentTier = getCustomerTier(customers[custPhone]?.totalSpent || 0);
  const tierDiscountAmount = custPhone ? Math.round(cartTotalAmountDisplay * currentTier.discountRate) : 0;
  const amountAfterTierAndVoucher = Math.max(0, cartTotalAmountDisplay - appliedVoucherAmount - tierDiscountAmount);
  const walletUsedAmount = useWallet ? Math.min(customers[custPhone]?.wallet||0, amountAfterTierAndVoucher) : 0;
  const finalToPay = amountAfterTierAndVoucher - walletUsedAmount;

  const uniqueNames = useMemo(() => Array.from(new Set(products.map(p => cleanName(p.name)))).sort(), [products]);
  const uniqueStocks = useMemo(() => Array.from(new Set(products.map(p => p.stock))).sort((a,b)=>a-b), [products]);
  const uniqueImportPrices = useMemo(() => Array.from(new Set(products.map(p => p.import_price || 0))).sort((a,b)=>a-b), [products]);
  const uniqueSalePrices = useMemo(() => Array.from(new Set(products.map(p => p.sale_price))).sort((a,b)=>a-b), [products]);
  const uniqueExpiries = useMemo(() => Array.from(new Set(products.map(p => p.expiry_date).filter(Boolean))).sort(), [products]);
  const categories = ["Tất cả", ...Array.from(new Set(products.map(p => p.category || "Khác")))];

  const sortedAndFilteredProducts = useMemo(() => {
    const todayTime = new Date().getTime();
    let filtered = products.filter(p => (selectedCategory === "Tất cả" || (p.category || "Khác") === selectedCategory)).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.product_code && p.product_code.toLowerCase().includes(searchTerm.toLowerCase())));
    if (filters['name']?.length > 0) filtered = filtered.filter(p => filters['name'].includes(cleanName(p.name)));
    if (filters['stock']?.length > 0) filtered = filtered.filter(p => filters['stock'].includes(p.stock));
    if (filters['import_price']?.length > 0) filtered = filtered.filter(p => filters['import_price'].includes(p.import_price || 0));
    if (filters['sale_price']?.length > 0) filtered = filtered.filter(p => filters['sale_price'].includes(p.sale_price));
    if (filters['expiry_date']?.length > 0) filtered = filtered.filter(p => filters['expiry_date'].includes(p.expiry_date));
    if (sortConfig !== null) { filtered.sort((a, b) => { let valA = a[sortConfig.key]; let valB = b[sortConfig.key]; if (sortConfig.key === 'expiry_date') { valA = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity; valB = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity; } if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1; if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1; return 0; }); } 
    else { filtered.sort((a, b) => { const daysA = a.expiry_date ? (new Date(a.expiry_date).getTime() - todayTime) / 86400000 : Infinity; const daysB = b.expiry_date ? (new Date(b.expiry_date).getTime() - todayTime) / 86400000 : Infinity; const aIsUrgent = daysA <= 45; const bIsUrgent = daysB <= 45; if (aIsUrgent && !bIsUrgent) return -1; if (!aIsUrgent && bIsUrgent) return 1; if (aIsUrgent && bIsUrgent) return daysA - daysB; return 0; }); }
    return filtered;
  }, [products, searchTerm, selectedCategory, sortConfig, filters]);

  const handleDirectQtyChange = (productId: any, val: string) => {
    setCart(prev => {
      if (val === '') return prev.map(i => i.product.id === productId ? { ...i, qty: '' as any, total: 0, profit: 0 } : i);
      let num = parseInt(val); if (isNaN(num) || num < 0) return prev; let exceedStock = false;
      const updated = prev.map(i => {
        if (i.product.id === productId) {
           if (num > i.product.stock) { exceedStock = true; num = i.product.stock; }
           const price = getActualPrice(i.product); return { ...i, qty: num, total: Math.round(num*price*(1+VAT_RATE)), profit: Math.round(num*(price - (i.product.import_price||0))) };
        } return i;
      });
      if (exceedStock) playSound('error'); return updated;
    });
  };

  const handleDirectQtyBlur = (productId: any, val: string) => {
    if (val === '' || parseInt(val) <= 0 || isNaN(parseInt(val))) { setCart(prev => prev.map(i => { if (i.product.id === productId) { const price = getActualPrice(i.product); return { ...i, qty: 1, total: Math.round(1*price*(1+VAT_RATE)), profit: Math.round(1*(price - (i.product.import_price||0))) }; } return i; })); }
  };
  const removeFromCart = (productId: any) => { setCart(cart.filter(item => item.product.id !== productId)); };
  const clearCart = () => { if(window.confirm("Hủy toàn bộ?")) { setCart([]); setCustName(""); setCustPhone(""); setCustomerInput(""); } };

  const handleVoucherSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); const code = voucherInput.trim().toUpperCase(); const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 };
      if (VOUCHERS[code]) { setAppliedVoucherAmount(VOUCHERS[code]); playSound('success'); } else if (!isNaN(Number(code)) && Number(code) > 0) { setAppliedVoucherAmount(Number(code)); playSound('success'); } else { playSound('error'); alert("Mã Voucher không hợp lệ!"); setAppliedVoucherAmount(0); }
    }
  };

  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; setCustomerInput(val); const matchedPhone = Object.keys(customers).find(phone => phone === val.trim() || customers[phone].cardCode === val.trim());
    if (matchedPhone) { setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); setUseWallet(false); } else { setCustPhone(val); setCustName(""); setUseWallet(false); }
  };

  const handleNextToQR = () => { if (cart.length === 0) return alert("Giỏ hàng đang trống!"); if (custPhone && !customers[custPhone] && !custName) return alert("Nhập Tên khách hàng mới!"); setCheckoutStep(2); };

  const confirmCheckout = async (payMethod: 'TIỀN MẶT' | 'CHUYỂN KHOẢN' | 'GHI NỢ') => {
    if (cart.some(i => !i.qty || i.qty <= 0)) { playSound('error'); return alert("Lỗi số lượng!"); }
    if (payMethod === 'GHI NỢ' && !custPhone) return alert("Ghi nợ bắt buộc nhập Khách!");
    setLoading(true); let logs: any[] = [];
    const subTotal = Math.round(cart.reduce((s, i) => s + (i.qty * getActualPrice(i.product)), 0)); const vatTotal = Math.round(subTotal * VAT_RATE); const baseTotal = subTotal + vatTotal;
    const totalAfterVoucher = Math.max(0, baseTotal - appliedVoucherAmount);
    
    const tier = getCustomerTier(customers[custPhone]?.totalSpent || 0); const tierDiscountAmount = custPhone ? Math.round(cartTotalAmountDisplay * tier.discountRate) : 0;
    const amountAfterTierAndVoucher = Math.max(0, totalAfterVoucher - tierDiscountAmount);
    const walletUsedAmount = useWallet && payMethod !== 'GHI NỢ' ? Math.round(Math.min(customers[custPhone]?.wallet || 0, amountAfterTierAndVoucher)) : 0; 
    
    const finalTotal = amountAfterTierAndVoucher - walletUsedAmount; const totalDiscount = appliedVoucherAmount + walletUsedAmount + tierDiscountAmount; 
    const earned = payMethod === 'GHI NỢ' ? 0 : Math.round(finalTotal * 0.02);

    for (const item of cart) {
      await supabase.from("products").update({ stock: item.product.stock - item.qty }).eq("id", item.product.id);
      logs.push({ id: Date.now() + Math.random(), shift: shift, type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", name: item.product.name + (item.product.isHappyHour ? ' [Giờ Vàng]' : ''), qty: item.qty, total: Math.round(item.total), profit: Math.round(item.profit), customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: item.product.id, refunded_qty: 0, paymentMethod: payMethod });
    }
    if (totalDiscount > 0) { logs.push({ id: Date.now() + Math.random(), shift: shift, type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", name: "Giảm giá / Ví / VIP", qty: 1, total: -totalDiscount, profit: -totalDiscount, customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: 'DISCOUNT', refunded_qty: 0, paymentMethod: payMethod }); }
    
    if (custPhone) { setCustomers((prev: any) => ({ ...prev, [custPhone]: { name: custName, wallet: payMethod === 'GHI NỢ' ? (prev[custPhone]?.wallet || 0) : Math.round((prev[custPhone]?.wallet || 0) - walletUsedAmount + earned), debt: (prev[custPhone]?.debt || 0) + (payMethod === 'GHI NỢ' ? finalTotal : 0), totalSpent: (prev[custPhone]?.totalSpent || 0) + (payMethod !== 'GHI NỢ' ? finalTotal : 0), email: prev[custPhone]?.email || "", cardCode: prev[custPhone]?.cardCode || "" } })); }

    setHistory(prev => [...logs, ...prev]); setLastOrder({ orderId: "HD" + Date.now().toString().slice(-6), shift: shift, cart: [...cart], subTotal, vatTotal, finalTotal: payMethod === 'GHI NỢ' ? 0 : finalTotal, debtAmount: payMethod === 'GHI NỢ' ? finalTotal : 0, discount: totalDiscount, tierDiscountAmount: tierDiscountAmount, earnedWallet: custPhone ? earned : 0, custName: custPhone ? custName : null, custPhone: custPhone ? custPhone : null, time: new Date().toLocaleString('vi-VN'), paymentMethod: payMethod, customerGiven: payMethod === 'TIỀN MẶT' ? Number(customerGiven) : 0 });
    setCheckoutStep(3); fetchProducts(); setLoading(false);
  };

  const handleRefund = async (logId: any) => {
    const logIndex = history.findIndex(l => l.id === logId); if(logIndex === -1) return; const log = history[logIndex];
    if(log.type !== 'BÁN') return alert("Chỉ hoàn trả đơn BÁN!");
    const maxRefund = log.qty - (log.refunded_qty || 0); if(maxRefund <= 0) return alert("Đơn này đã được hoàn trả toàn bộ!");
    const qStr = window.prompt(`Sản phẩm: ${cleanName(log.name)}\nĐã mua: ${log.qty} | Có thể hoàn: ${maxRefund}\nNhập số lượng hoàn trả:`, maxRefund.toString());
    if (!qStr) return; const refundQty = parseInt(qStr);
    if (isNaN(refundQty) || refundQty <= 0 || refundQty > maxRefund) { playSound('error'); return alert("Số lượng hoàn không hợp lệ!"); }
    if(!window.confirm(`Xác nhận hoàn trả ${refundQty} x ${cleanName(log.name)}?`)) return;

    const unitTotal = log.total / log.qty; const unitProfit = log.profit / log.qty; const refundTotal = Math.round(unitTotal * refundQty); const refundProfit = Math.round(unitProfit * refundQty);
    const p = products.find(x => x.id === log.product_id); if (p) await supabase.from("products").update({ stock: p.stock + refundQty }).eq("id", p.id);

    let refundedToWallet = false;
    if (log.customer && log.customer !== "Khách lẻ") {
       const phoneMatch = log.customer.match(/\((.*?)\)/);
       if (phoneMatch && phoneMatch[1]) {
           const phone = phoneMatch[1];
           if (customers[phone] && window.confirm(`Hoàn ${refundTotal.toLocaleString()}đ bằng TIỀN MẶT hay cộng vào VÍ ĐIỂM?\n- OK: Cộng vào VÍ\n- Cancel: TIỀN MẶT`)) {
               setCustomers((prev: any) => ({ ...prev, [phone]: { ...prev[phone], wallet: (prev[phone].wallet || 0) + refundTotal } }));
               logAudit("HOÀN TIỀN VÍ", `Hoàn ${refundTotal.toLocaleString()}đ vào ví KH ${customers[phone].name}`); refundedToWallet = true;
           }
       }
    }
    const updatedHistory = [...history]; updatedHistory[logIndex].refunded_qty = (log.refunded_qty || 0) + refundQty;
    updatedHistory.unshift({ id: Date.now(), shift: shift, type: "TRẢ HÀNG", name: log.name + (refundedToWallet ? " (Hoàn Ví)" : " (Hoàn TM)"), qty: refundQty, total: -refundTotal, profit: -refundProfit, customer: log.customer, paymentMethod: refundedToWallet ? 'VÍ ĐIỂM' : 'TIỀN MẶT' });
    setHistory(updatedHistory); fetchProducts(); logAudit("TRẢ HÀNG", `Hoàn ${refundQty} ${cleanName(log.name)}: ${refundTotal.toLocaleString()}đ`); playSound('success'); alert(`Hoàn trả thành công!`);
  };

  const handlePayDebt = (phone: string) => {
    const currentDebt = customers[phone]?.debt || 0; const payAmtStr = window.prompt(`Khách ${customers[phone].name} nợ ${currentDebt.toLocaleString()}đ. Nhập tiền trả:`, currentDebt.toString());
    if (payAmtStr && parseInt(payAmtStr) > 0) {
      const amt = parseInt(payAmtStr); const isTransfer = window.confirm(`Thu nợ bằng:\n- [OK] : CHUYỂN KHOẢN\n- [Cancel] : TIỀN MẶT`); const pMethod = isTransfer ? 'CHUYỂN KHOẢN' : 'TIỀN MẶT';
      setCustomers((prev: any) => ({ ...prev, [phone]: { ...prev[phone], debt: Math.max(0, (prev[phone]?.debt || 0) - amt) } }));
      setHistory(prev => [{ id: Date.now(), shift: shift, type: "THU NỢ", name: "Thanh toán công nợ", qty: 1, total: amt, profit: 0, customer: `${customers[phone].name} (${phone})`, paymentMethod: pMethod }, ...prev]);
      logAudit("THU NỢ", `Thu ${amt.toLocaleString()}đ từ ${customers[phone].name}`); alert("Đã thu nợ thành công!");
    }
  };

  const closeCheckout = () => { setCart([]); setIsCheckoutOpen(false); setCheckoutStep(1); setCustPhone(""); setCustName(""); setCustomerInput(""); setUseWallet(false); setVoucherInput(""); setAppliedVoucherAmount(0); setCustomerGiven(""); setLastOrder(null); };

  const sendReceiptEmail = async () => {
    if (!lastOrder) return; const savedEmail = (lastOrder.custPhone && customers[lastOrder.custPhone] && customers[lastOrder.custPhone].email) ? customers[lastOrder.custPhone].email : "";
    const email = window.prompt("Nhập Email khách hàng:", savedEmail); if (!email) return;
    if (lastOrder.custPhone) setCustomers((prev: any) => ({ ...prev, [lastOrder.custPhone]: { ...prev[lastOrder.custPhone], email: email } }));
    setLoading(true); let itemsTable = "";
    lastOrder.cart.forEach((item: any) => { itemsTable += `- ${cleanName(item.product.name)} x ${item.qty} = ${Math.round(item.qty * Math.round(getActualPrice(item.product)) * (1+VAT_RATE)).toLocaleString()}đ\n`; });
    const emailData = { to_email: email, order_id: lastOrder.orderId, time: lastOrder.time, items_list: itemsTable, total_amount: Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString() + "đ", payment_method: lastOrder.paymentMethod, change_amount: lastOrder.paymentMethod === 'TIỀN MẶT' ? Math.round(lastOrder.customerGiven - lastOrder.finalTotal).toLocaleString() + "đ" : "0đ" };
    try { await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailData); alert("🚀 Đã gửi hóa đơn điện tử!"); } catch (error) { alert("❌ Lỗi gửi mail."); } setLoading(false);
  };

  const sendCardEmail = async (phone: string) => {
      const cust = customers[phone]; const email = cust.email || window.prompt(`Nhập Email cá nhân của ${cust.name}:`, ""); if (!email) return;
      if (!cust.email) setCustomers((prev:any) => ({...prev, [phone]: {...prev[phone], email}}));
      setLoading(true); const code = cust.cardCode || phone; const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(code)}&scale=2&height=10&includetext=true`;
      const emailData = { to_email: email, order_id: "THẺ THÀNH VIÊN", time: new Date().toLocaleString('vi-VN'), items_list: `💳 MÃ THẺ CỦA BẠN LÀ: ${code}\n(Vui lòng xuất trình Thẻ/Mã vạch bên dưới khi thanh toán)`, total_amount: "Ưu đãi Đặc Quyền", payment_method: "VIP Member", change_amount: "0đ", barcode_url: barcodeUrl };
      try { await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_VIP_ID, emailData); alert("🚀 Đã gửi Thẻ VIP điện tử!"); } catch (error) { alert("❌ Lỗi gửi mail."); } setLoading(false);
  };

  const printCustomerCard = (phone: string) => { setPrintCustomer({phone, ...customers[phone]}); setPrintMode('customer_card'); setTimeout(() => window.print(), 1000); };
  const shareToZalo = (phone: string) => {
      const cust = customers[phone]; const code = cust.cardCode || phone;
      navigator.clipboard.writeText(`Chào ${cust.name},\nCảm ơn bạn đã đồng hành cùng Hải Lê Mart!\n💳 Mã Thẻ VIP của bạn là: ${code}`).then(() => {
          alert(`💡 MẸO:\n1. Bấm [🖨️ In Thẻ]\n2. Bấm (Alt + Z) cắt vùng thẻ\n3. Dán (Ctrl + V) gửi qua Zalo\n\n✅ Đang mở Zalo...`); window.open(`https://zalo.me/${phone}`, '_blank');
      }).catch(() => { window.open(`https://zalo.me/${phone}`, '_blank'); });
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value; setNewCode(code); const p = products.find((x: any) => x.product_code === code);
    if (p) { setNewName(cleanName(p.name)); setNewCategory(p.category || "Khác"); setNewImportPrice(p.import_price?.toString() || ""); setNewPrice(p.sale_price.toString()); setNewPromoPrice(p.promo_price?.toString() || ""); setNewExpiry(p.expiry_date || ""); const gift = parseGift(p.gift_info); setNewGiftCondition(gift.cond.toString()); setNewGiftInfo(gift.text); }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const added = parseInt(newStock || "0"); const impPrice = parseInt(newImportPrice); const salePrice = parseInt(newPrice); const promo = parseInt(newPromoPrice) || 0; const finalGiftInfo = newGiftInfo.trim() !== "" ? `${newGiftCondition};;;${newGiftInfo}` : null;
    const baseCode = newCode.trim(); const allVariants = products.filter(p => p.product_code === baseCode || p.product_code.startsWith(`${baseCode}-`)); const exist = allVariants.find(p => p.product_code === baseCode); 
    let priceUpdatedMsg = "";
    if (allVariants.length > 0 && allVariants[0].sale_price !== salePrice) { await Promise.all(allVariants.map(v => supabase.from("products").update({ sale_price: salePrice, promo_price: promo }).eq("id", v.id))); priceUpdatedMsg = `\n💡 Đã ĐỒNG BỘ GIÁ (${salePrice.toLocaleString()}đ) cho lô cũ!`; logAudit("ĐỒNG BỘ GIÁ", `Mã ${baseCode} -> ${salePrice.toLocaleString()}đ`); }
    if (exist) {
        if (exist.stock <= 0) {
            await supabase.from("products").update({ name: newName, category: newCategory || "Khác", import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null, created_at: new Date().toISOString() }).eq("id", exist.id);
            if (added > 0) setHistory(prev => [{ id: Date.now(), shift: shift, type: "NHẬP", name: newName, qty: added, total: 0 }, ...prev]);
            logAudit("NHẬP ĐÈ CŨ", `${newName} (Mã: ${baseCode}) - SL: ${added}`); alert(`Đã nhập hàng!${priceUpdatedMsg}`);
        } else {
            if (exist.import_price !== impPrice || (exist.expiry_date || "") !== (newExpiry || "")) {
                const batchCode = `${baseCode}-${Date.now().toString().slice(-4)}`; const batchName = `${newName} [Lô ${newExpiry ? new Date(newExpiry).toLocaleDateString('vi-VN') : 'Mới'}]`;
                if(window.confirm(`Hàng cũ còn tồn. Bạn nhập Giá/HSD khác -> Sẽ tạo LÔ MỚI (${batchCode}).${priceUpdatedMsg}\nĐồng ý?`)) {
                    await supabase.from("products").insert([{ product_code: batchCode, name: batchName, category: newCategory || "Khác", import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null }]);
                    if (added > 0) setHistory(prev => [{ id: Date.now(), shift: shift, type: "NHẬP", name: batchName, qty: added, total: 0 }, ...prev]);
                    logAudit("TÁCH LÔ", `${batchName} - SL: ${added}`); if (!priceUpdatedMsg) alert(`Đã tạo lô mới!`); 
                } else { setLoading(false); return; }
            } else {
                await supabase.from("products").update({ stock: exist.stock + added, created_at: new Date().toISOString() }).eq("id", exist.id);
                if (added > 0) setHistory(prev => [{ id: Date.now(), shift: shift, type: "NHẬP", name: newName, qty: added, total: 0 }, ...prev]);
                logAudit("CỘNG DỒN", `${newName} - +SL: ${added}`); alert(`Cộng dồn thành công!${priceUpdatedMsg}`);
            }
        }
    } else {
        await supabase.from("products").insert([{ product_code: baseCode, name: newName, category: newCategory || "Khác", import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null }]);
        if (added > 0) setHistory(prev => [{ id: Date.now(), shift: shift, type: "NHẬP", name: newName, qty: added, total: 0 }, ...prev]);
        logAudit("NHẬP MỚI", `${newName} - SL: ${added}`); if(priceUpdatedMsg) alert(`Nhập hàng thành công!${priceUpdatedMsg}`);
    }
    setNewCode(""); setNewName(""); setNewCategory("Đồ uống"); setNewImportPrice(""); setNewPrice(""); setNewPromoPrice(""); setNewGiftCondition("1"); setNewGiftInfo(""); setNewStock(""); setNewExpiry(""); fetchProducts(); setLoading(false); setShowInputForm(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader();
    reader.onload = async (event) => {
      setLoading(true);
      try {
        const text = event.target?.result as string; const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length <= 1) { alert("File rỗng!"); setLoading(false); return; }
        let successCount = 0; let importLogs: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(c => c.trim().replace(/^"|"$/g, '')); if (cols.length < 5) continue; 
          const pCode = cols[0]; const pName = cols[1]; const pCategory = cols[2] || "Khác"; const pImpPrice = parseInt(cols[3]) || 0; const pSalePrice = parseInt(cols[4]) || 0; const pPromoPrice = parseInt(cols[5]) || 0; const pGift = cols[6] || null; const pStock = parseInt(cols[7]) || 0; const pExpiry = cols[8] || null;
          if (!pCode || !pName || pSalePrice <= 0) continue;
          const baseCode = pCode.trim(); const allVariants = products.filter(p => p.product_code === baseCode || p.product_code.startsWith(`${baseCode}-`));
          if (allVariants.length > 0 && allVariants[0].sale_price !== pSalePrice) {
              await Promise.all(allVariants.map(v => supabase.from("products").update({ sale_price: pSalePrice, promo_price: pPromoPrice }).eq("id", v.id)));
              if(!importLogs.find(l => l.name === `Đồng bộ giá ${baseCode}`)) importLogs.push({ id: Date.now() + Math.random(), shift: shift, type: "HỆ THỐNG", name: `Đồng bộ giá ${baseCode}`, qty: 0, total: 0 });
          }
          const exist = allVariants.find(p => p.product_code === baseCode);
          if (exist) {
             if (exist.stock <= 0) await supabase.from("products").update({ name: pName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry, created_at: new Date().toISOString() }).eq("id", exist.id);
             else {
                 if (exist.import_price !== pImpPrice || (exist.expiry_date || "") !== (pExpiry || "")) {
                     const batchCode = `${baseCode}-${Date.now().toString().slice(-4)}${i}`; const batchName = `${pName} [Lô ${pExpiry ? new Date(pExpiry).toLocaleDateString('vi-VN') : 'Mới'}]`;
                     await supabase.from("products").insert([{ product_code: batchCode, name: batchName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry }]);
                 } else await supabase.from("products").update({ stock: exist.stock + pStock, created_at: new Date().toISOString() }).eq("id", exist.id);
             }
          } else await supabase.from("products").insert([{ product_code: baseCode, name: pName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry }]);
          if (pStock > 0) importLogs.push({ id: Date.now() + Math.random(), shift: shift, type: "NHẬP", name: cleanName(pName), qty: pStock, total: 0 }); successCount++;
        }
        if (importLogs.length > 0) setHistory(prev => [...importLogs, ...prev]); logAudit("NHẬP FILE", `Nhập ${successCount} mã`); alert(`Nhập thành công ${successCount} SP!`); fetchProducts();
      } catch (err) { alert("Lỗi xử lý file CSV."); } setLoading(false);
    }; reader.readAsText(file); e.target.value = '';
  };

  const handleDelete = async (id: any, name: any) => { if (window.confirm(`Xóa vĩnh viễn ${name}?`)) { await supabase.from("products").delete().eq("id", id); logAudit("XÓA SP", `Xóa: ${name}`); fetchProducts(); } };
  const handleEdit = async (id: any, field: string, old: any, isText: boolean = false) => {
    let label = field; if (field === 'category') label = 'Danh mục'; if (field === 'sale_price') label = 'Giá bán'; if (field === 'promo_price') label = 'Giá KM'; if (field === 'gift_info') label = 'Quà tặng'; if (field === 'expiry_date') label = 'HSD';
    const val = window.prompt(`Sửa ${label}:`, old || "");
    if (val !== null) { let updateData: any = isText ? val : (parseInt(val) || 0); if (field === 'gift_info' && val.trim() === '') updateData = null; await supabase.from("products").update({ [field]: updateData }).eq("id", id); logAudit("SỬA", `ID ${id}, ${label} -> ${val}`); fetchProducts(); }
  };
  const handlePrintBarcode = (p: any) => { const q = window.prompt(`Số lượng tem in: ${cleanName(p.name)}`, "30"); if (q && parseInt(q) > 0) { setPrintBarcodeProduct(p); setBarcodeCount(parseInt(q)); setPrintMode('barcode'); setTimeout(() => window.print(), 1500); } };
  const downloadSampleCSV = () => { const csv = "\uFEFFMã SP,Tên SP,Danh Mục,Giá Nhập,Giá Bán,Giá KM,Quà Tặng,Số Lượng,Hạn Sử Dụng (YYYY-MM-DD)\nSP001,Mì Hảo Hảo,Đồ ăn liền,3000,5000,0,,100,2026-12-31\nSP002,Nước suối TH,Đồ uống,4000,6000,0,24;;;1 Ly Thủy Tinh,50,2026-06-15"; const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Mau_Nhap_Kho.csv`; link.click(); };
  const exportToCSV = () => {
    if (history.length === 0) return alert("Chưa có lịch sử!"); let csv = "\uFEFFGiờ,Ca Làm Việc,Loại,Hình thức,Khách,Sản phẩm,SL,Tổng(VAT),Lợi nhuận\n";
    history.forEach(log => { csv += `${new Date(Math.floor(log.id)).toLocaleString('vi-VN')},${log.shift || ""},${log.type},${log.paymentMethod || ""},${log.customer || "Khách lẻ"},${log.name},${log.qty},${Math.round(log.total)},${Math.round(log.profit || 0)}\n`; });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Bao_Cao.csv`; link.click();
  };
  const exportAuditToCSV = () => {
    if (auditLogs.length === 0) return alert("Chưa có nhật ký!"); let csv = "\uFEFFThời gian,Người dùng,Ca,Hành động,Chi tiết\n";
    auditLogs.forEach(log => { csv += `${log.time},${log.user},${log.shift},${log.action},"${(log.detail || "").replace(/"/g, '""')}"\n`; });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Audit.csv`; link.click();
  };
  const handleSendEmailReport = () => {
    const logs = history.filter(log => new Date(Math.floor(log.id)).toLocaleDateString('vi-VN') === todayStrStr); if (logs.length === 0) return alert("Chưa có giao dịch!");
    let cash = 0, transfer = 0, prof = 0, sold = 0; logs.forEach(l => { if(l.type==='BÁN') sold += l.qty; if(l.type==='BÁN' || l.type==='THU NỢ' || l.type==='TRẢ HÀNG') { if (l.paymentMethod === 'CHUYỂN KHOẢN') transfer += l.total; else if (l.paymentMethod === 'TIỀN MẶT') cash += l.total; } prof += (l.profit||0); });
    const sub = encodeURIComponent(`Báo Cáo - ${todayStrStr}`); const body = encodeURIComponent(`Báo cáo TỔNG:\n- Đã bán: ${sold} món\n- TIỀN MẶT: ${Math.round(cash).toLocaleString()}đ\n- CHUYỂN KHOẢN: ${Math.round(transfer).toLocaleString()}đ\n- Lợi nhuận: ${Math.round(prof).toLocaleString()}đ`);
    window.location.href = `mailto:lehonghaikt6@gmail.com?subject=${sub}&body=${body}`;
  };

  const requestSort = (key: string) => { if (sortConfig && sortConfig.key === key) { if (sortConfig.direction === 'asc') setSortConfig({ key, direction: 'desc' }); else setSortConfig(null); } else { setSortConfig({ key, direction: 'asc' }); } };
  const handleFilterCheck = (col: string, val: any) => { setFilters(prev => { const cur = prev[col] || []; if (cur.includes(val)) return { ...prev, [col]: cur.filter(v => v !== val) }; return { ...prev, [col]: [...cur, val] }; }); };
  const toggleDateGroup = (dateStr: string) => setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));

  // ================= 7. RENDER HELPERS =================
  const renderHeaderIcon = (colKey: string) => {
    const isFiltered = filters[colKey]?.length > 0; const isSortedAsc = sortConfig?.key === colKey && sortConfig.direction === 'asc'; const isSortedDesc = sortConfig?.key === colKey && sortConfig.direction === 'desc';
    let icon = '🔽'; if (isSortedAsc) icon = '🔼'; if (isSortedDesc) icon = '🔽';
    return ( <span onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === colKey ? null : colKey); }} style={{ cursor: "pointer", color: isFiltered || sortConfig?.key === colKey ? '#ef4444' : '#94a3b8', fontSize: "10px", padding: "2px", marginLeft: "4px", border: isFiltered ? "1px dashed #ef4444" : "1px solid transparent", borderRadius: "2px" }} title="Lọc">{icon}</span> );
  };

  const renderFilterPopup = (colKey: string, title: string, uniqueValues: any[], formatVal?: (v:any)=>string) => {
    if (openFilter !== colKey) return null;
    return (
        <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "100%", left: colKey==='name' ? "0" : "50%", transform: colKey==='name' ? "none" : "translateX(-50%)", backgroundColor: "#fff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px", zIndex: 999, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)", minWidth: "160px", textAlign: "left", color: "#1e293b", fontWeight: "normal", fontSize: "12px", display: "flex", flexDirection: "column" }}>
           <div style={{ marginTop: "10px", fontWeight: "bold", color: "#64748b", fontSize: "10px", marginBottom: "6px" }}>LỌC {title}:</div>
           <div style={{ overflowY: "auto", flex: 1, maxHeight: "150px", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "4px" }}>
               <label style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px", cursor: "pointer", borderBottom: "1px dashed #f1f5f9", backgroundColor: (!filters[colKey] || filters[colKey].length === 0) ? "#eff6ff" : "transparent" }}>
                  <input type="checkbox" checked={!filters[colKey] || filters[colKey].length === 0} onChange={() => setFilters(prev => ({...prev, [colKey]: []}))} /><span style={{color: "#3b82f6", fontWeight: "bold"}}>Tất cả</span>
               </label>
               {uniqueValues.map((v, i) => (
                   <label key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px", cursor: "pointer", borderBottom: "1px dashed #f1f5f9", backgroundColor: filters[colKey]?.includes(v) ? "#f0fdf4" : "transparent" }}>
                      <input type="checkbox" checked={filters[colKey]?.includes(v) || false} onChange={() => handleFilterCheck(colKey, v)} /><span>{formatVal ? formatVal(v) : v}</span>
                   </label>
               ))}
           </div>
           {filters[colKey]?.length > 0 && <div style={{ marginTop: "8px", textAlign: "center", cursor: "pointer", color: "#ef4444", fontWeight: "bold", fontSize: "11px", padding: "4px" }} onClick={() => setFilters(prev => ({...prev, [colKey]: []}))}>❌ Bỏ lọc</div>}
        </div>
    );
  };

  return (
    <div onClick={() => { setOpenFilter(null); setShowSuggestions(false); setShowAdvancedMenu(false); }}>
      {/* 1. TOÀN BỘ PHẦN KHUNG GIAO DIỆN (HEADER, GIỎ HÀNG, SẢN PHẨM) */}
      <div className="no-print" style={{ padding: "15px", position: "relative", minHeight: "100vh", overflowX: "auto" }}>
        
        {/* HEADER 2 HÀNG CẢI TIẾN */}
        <div style={{ maxWidth: "1500px", margin: "0 auto", minWidth: "1000px" }}>
          <div className="glass" style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "12px", borderBottom: "4px solid #ef4444" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div className="logo-icon" style={{ backgroundColor: "#dc2626", padding: "8px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "900", letterSpacing: "0.5px", color: "#0f172a", lineHeight: "1" }}>HẢI LÊ <span style={{color: "#dc2626"}}>MART</span></h1>
                    <span style={{ fontSize: "9px", color: "#64748b", fontWeight: "800", letterSpacing: "3px", textTransform: "uppercase", marginTop: "4px" }}>ERP System</span>
                  </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                {(new Date().getHours() >= 20 || new Date().getHours() < 6) && <span style={{fontSize:"11px", backgroundColor:"#fef08a", color:"#b45309", padding:"4px 8px", borderRadius:"4px", fontWeight:"bold"}}>🌙 HAPPY HOUR</span>}
                <div style={{ width: "2px", height: "30px", backgroundColor: "#e2e8f0" }}></div>
                <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                  {role === 'admin' && <div style={{ textAlign: "center", whiteSpace: "nowrap" }}><div style={{ fontSize: "10px", color: "#64748b", fontWeight: "bold" }}>VỐN</div><div style={{ fontSize: "15px", fontWeight: "900", color: "#475569" }}>{totalValue.toLocaleString()}đ</div></div>}
                  <div style={{ textAlign: "center", whiteSpace: "nowrap" }}><div style={{ fontSize: "10px", color: "#64748b", fontWeight: "bold" }}>TIỀN MẶT</div><div style={{ fontSize: "15px", fontWeight: "900", color: "#059669" }}>{currentShiftStats.cash.toLocaleString()}đ</div></div>
                  <div style={{ textAlign: "center", whiteSpace: "nowrap" }}><div style={{ fontSize: "10px", color: "#64748b", fontWeight: "bold" }}>CHUYỂN KHOẢN</div><div style={{ fontSize: "15px", fontWeight: "900", color: "#2563eb" }}>{currentShiftStats.transfer.toLocaleString()}đ</div></div>
                  {role === 'admin' && <div style={{ textAlign: "center", whiteSpace: "nowrap" }}><div style={{ fontSize: "10px", color: "#64748b", fontWeight: "bold" }}>LÃI</div><div style={{ fontSize: "15px", fontWeight: "900", color: "#ea580c" }}>{currentShiftStats.prof.toLocaleString()}đ</div></div>}
                </div>
                <div style={{ width: "2px", height: "30px", backgroundColor: "#e2e8f0" }}></div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ textAlign: "right", lineHeight: "1.2", whiteSpace: "nowrap" }}><div style={{ fontSize: "13px", fontWeight: "bold", color: "#1e293b" }}>{role === 'admin' ? "Quản lý" : "Thu ngân"}</div><div style={{ fontSize: "11px", color: "#64748b" }}>{shift}</div></div>
                  <button onClick={handleLogoutClick} style={{ padding: "10px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Đăng xuất">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", borderTop: "1px dashed #cbd5e1", paddingTop: "12px", alignItems: "center", justifyContent: "space-between" }}>
               <div style={{ position: "relative" }}>
                   <button onClick={(e) => { e.stopPropagation(); setShowAdvancedMenu(!showAdvancedMenu); }} style={{ padding: "10px 20px", background: "#1e293b", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                     <span style={{fontSize: "18px"}}>🍔</span> MENU CHỨC NĂNG ▼
                   </button>

                   {showAdvancedMenu && (
                       <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: "110%", left: 0, backgroundColor: "#fff", border: "1px solid #cbd5e1", borderRadius: "10px", minWidth: "250px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", zIndex: 1000, display: "flex", flexDirection: "column", padding: "8px" }}>
                          
                          {role === 'admin' && <div onClick={() => {setShowAdvancedMenu(false); setShowStatsModal(true);}} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "10px" }}><span style={{fontSize: "16px"}}>📊</span> Thống Kê Kho & Doanh Thu</div>}
                          {role === 'admin' && <div onClick={() => {setShowAdvancedMenu(false); setShowCustomerModal(true);}} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "10px" }}><span style={{fontSize: "16px"}}>🤝</span> Quản Lý Khách Hàng Thân Thiết</div>}
                          <div onClick={() => {setShowAdvancedMenu(false); setShowDebtModal(true);}} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "10px", color: "#b91c1c" }}><span style={{fontSize: "16px"}}>📓</span> Sổ Nợ Khách Hàng</div>
                          {role === 'admin' && <div onClick={() => {setShowAdvancedMenu(false); setShowAuditModal(true);}} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", borderBottom: "1px dashed #cbd5e1", display: "flex", alignItems: "center", gap: "10px" }}><span style={{fontSize: "16px"}}>🕵️</span> Lịch Sử Thao Tác Hệ Thống</div>}
                          
                          {role === 'admin' && (
                            <>
                              <div onClick={() => { setShowAdvancedMenu(false); setShowExpenseModal(true); }} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "10px" }}><span style={{fontSize: "16px"}}>💸</span> Nhập Chi Phí Vận Hành</div>
                              <div onClick={() => { setShowAdvancedMenu(false); setShowSupplierModal(true); }} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "10px" }}><span style={{fontSize: "16px"}}>🏭</span> Quản Lý Nhà Cung Cấp</div>
                              <div onClick={() => { setShowAdvancedMenu(false); setShowMarketingModal(true); }} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", borderBottom: "1px dashed #cbd5e1", color: "#8b5cf6", display: "flex", alignItems: "center", gap: "10px" }}><span style={{fontSize: "16px"}}>📢</span> Gửi Email Marketing Khuyến Mãi</div>
                              <div onClick={() => { setShowAdvancedMenu(false); setNewAdminPass(adminPass); setNewStaffPass(staffPass); setNewBankBin(bankBin); setNewBankAcc(bankAcc); setNewBankNameStr(bankNameStr); setShowSettings(true); }} style={{ padding: "12px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", color: "#475569", display: "flex", alignItems: "center", gap: "10px" }}><span style={{fontSize: "16px"}}>⚙️</span> Cài Đặt (Mật khẩu & QR)</div>
                            </>
                          )}
                       </div>
                   )}
               </div>
                
               <div style={{ display: "flex", gap: "15px", alignItems: "center", fontSize: "12px", fontWeight: "bold", color: "#64748b" }}>
                  {role === 'admin' && lowStockCount > 0 && (
                      <div className="noti-bell" onClick={() => setShowStatsModal(true)} title="Có mặt hàng sắp hết!">
                          <span style={{ fontSize: "20px" }}>🔔</span>
                          <span className="noti-badge">{lowStockCount}</span>
                      </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f8fafc", padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", fontFamily: "monospace" }}>
                      <span style={{ fontSize: "14px" }}>⏱️</span> 
                      {currentTime.toLocaleTimeString('vi-VN')} - {currentTime.toLocaleDateString('vi-VN')}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#ecfdf5", padding: "6px 12px", borderRadius: "6px", border: "1px solid #a7f3d0", color: "#059669" }}>
                      <span style={{ height: "8px", width: "8px", backgroundColor: "#10b981", borderRadius: "50%", display: "inline-block", animation: "pulse-fast 2s infinite" }}></span>
                      Online
                  </div>
               </div>
            </div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "7fr 3fr", gap: "10px" }}>
            <div className="glass" style={{ padding: "12px" }}>
              <div style={{ display: "flex", gap: "15px", marginBottom: "15px", alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1, display: "flex" }}>
                  <input placeholder="👉 QUẸT MÃ VẠCH SP VÀ THẺ VIP..." value={barcodeInput} onChange={e => { setBarcodeInput(e.target.value); setShowSuggestions(true); }} onKeyDown={handleBarcodeSubmit} onClick={() => setShowSuggestions(true)} style={{ flex: 1, padding: "10px 15px", borderRadius: "6px 0 0 6px", border: "2px solid #ef4444", fontSize: "14px", fontWeight: "bold", outline: "none", boxSizing: "border-box", backgroundColor: "#fffbeb", color: "#b91c1c" }} />
                  <button onClick={() => setScannerMode('product')} style={{ padding: "0 15px", backgroundColor: "#ef4444", border: "none", borderRadius: "0 6px 6px 0", cursor: "pointer", color: "white", fontSize: "18px" }}>📷</button>
                  {showSuggestions && barcodeInput.trim() !== "" && (
                    <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "#fff", border: "1px solid #ef4444", borderRadius: "6px", marginTop: "4px", zIndex: 100, maxHeight: "250px", overflowY: "auto", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}>
                      {products.filter(p => cleanName(p.name).toLowerCase().includes(barcodeInput.toLowerCase()) || (p.product_code && p.product_code.toLowerCase().includes(barcodeInput.toLowerCase()))).slice(0, 10).map((p, idx) => (
                        <div key={idx} onClick={() => handleSelectSuggest(p)} style={{ padding: "8px 12px", borderBottom: "1px solid #fed7aa", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff7ed'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <div><div style={{ fontWeight: "bold", color: "#1e293b", fontSize: "13px" }}>{cleanName(p.name)}</div><div style={{ fontSize: "10px", color: "#64748b" }}>Tồn: <b style={{color: p.stock < 10 ? "#ef4444" : "#10b981"}}>{p.stock}</b></div></div>
                          <div style={{ fontWeight: "bold", color: "#ef4444", fontSize: "13px" }}>{getActualPrice(p).toLocaleString()}đ</div>
                        </div>
                      ))}
                      {products.filter(p => cleanName(p.name).toLowerCase().includes(barcodeInput.toLowerCase()) || (p.product_code && p.product_code.toLowerCase().includes(barcodeInput.toLowerCase()))).length === 0 && <div style={{ padding: "10px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>Không tìm thấy sản phẩm</div>}
                    </div>
                  )}
                </div>

                {role === 'admin' && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div onClick={() => setShowInputForm(!showInputForm)} style={{ padding: "10px 15px", borderRadius: "6px", fontWeight: "bold", color: "#b91c1c", cursor: "pointer", border: "1px dashed #ef4444", fontSize: "12px", display: "flex", alignItems: "center", backgroundColor: "#fef2f2" }}>{showInputForm ? "➖ ĐÓNG" : "➕ NHẬP LẺ"}</div>
                    <label style={{ cursor: "pointer", padding: "10px 15px", borderRadius: "6px", fontWeight: "bold", color: "#059669", border: "1px dashed #10b981", fontSize: "12px", display: "flex", alignItems: "center", backgroundColor: "#ecfdf5" }}>📁 TỪ FILE<input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: "none" }} /></label>
                    <button onClick={downloadSampleCSV} style={{ padding: "10px 15px", borderRadius: "6px", fontWeight: "bold", color: "#3b82f6", cursor: "pointer", border: "1px dashed #3b82f6", fontSize: "12px", display: "flex", alignItems: "center", backgroundColor: "#eff6ff" }}>📥 FILE MẪU</button>
                  </div>
                )}
              </div>

              {showInputForm && role === 'admin' && (
                <form onSubmit={handleAddProduct} style={{ backgroundColor: "#fff7ed", padding: "15px", borderRadius: "8px", border: "1px solid #fdba74", marginBottom: "15px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">MÃ SẢN PHẨM</span><input placeholder="VD: SP001" value={newCode} onChange={handleCodeChange} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", outline: "none", fontSize: "12px" }} /></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">TÊN HÀNG HÓA</span><input placeholder="VD: Bia Tiger" value={newName} onChange={e => setNewName(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", outline: "none", fontSize: "12px" }} /></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">PHÂN LOẠI</span><input list="category-list" placeholder="Chọn / Nhập..." value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", outline: "none", fontSize: "12px" }} /><datalist id="category-list">{categories.filter(c => c !== 'Tất cả').map(c => <option key={c} value={c} />)}</datalist></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">GIÁ VỐN (Đ)</span><input type="number" placeholder="0" value={newImportPrice} onChange={e => setNewImportPrice(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", outline: "none", fontSize: "12px" }} /></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">GIÁ BÁN (Đ)</span><input type="number" placeholder="0" value={newPrice} onChange={e => setNewPrice(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", outline: "none", fontSize: "12px" }} /></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 0.8fr 80px", gap: "10px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label-red">GIÁ KHUYẾN MÃI</span><input type="number" placeholder="0 (Bỏ trống nếu ko KM)" value={newPromoPrice} onChange={e => setNewPromoPrice(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ef4444", outline: "none", fontSize: "12px" }} /></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">HẠN SỬ DỤNG</span><input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", outline: "none", fontSize: "12px", fontFamily: "sans-serif" }} /></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label-green">ĐIỀU KIỆN & QUÀ TẶNG</span><div style={{ display: "flex", gap: "4px" }}><input type="number" placeholder="Từ..." value={newGiftCondition} onChange={e => setNewGiftCondition(e.target.value)} style={{ width: "45px", padding: "8px", borderRadius: "4px", border: "1px solid #10b981", outline: "none", fontSize: "12px" }} title="Số lượng cần mua" /><input type="text" placeholder="Tên quà..." value={newGiftInfo} onChange={e => setNewGiftInfo(e.target.value)} style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #10b981", outline: "none", fontSize: "12px" }} /></div></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">SỐ LƯỢNG NHẬP</span><input type="number" placeholder="0" value={newStock} onChange={e => setNewStock(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", outline: "none", fontSize: "12px" }} /></div>
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}><button type="submit" disabled={loading} style={{ padding: "8px", height: "35px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>LƯU</button></div>
                  </div>
                </form>
              )}

              <div style={{ display: "flex", gap: "8px", marginBottom: "15px", overflowX: "auto", paddingBottom: "4px" }}>
                {categories.map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`tab-btn ${selectedCategory === cat ? 'active' : ''}`}>{cat}</button>)}
              </div>

              <div style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ color: "#16a34a", fontSize: "10px", borderBottom: "2px solid #fed7aa", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
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
                      const isP = p.promo_price > 0; 
                      const d = Math.floor(Math.abs(new Date().getTime() - new Date(p.created_at).getTime()) / 86400000);
                      const isOutOfStock = p.stock <= 0;
                      const isNearExpiry = p.expiry_date && (new Date(p.expiry_date).getTime() - new Date().getTime()) / 86400000 <= 45 && !isOutOfStock;
                      const isLowStock = p.stock > 0 && p.stock < 10;
                      const gift = parseGift(p.gift_info);
                      let dText = "Mới nhập hôm nay"; if (d === 1) dText = "Nhập hôm qua"; else if (d > 1) dText = `${d} ngày trước`;

                      return (
                        <tr key={p.id} style={{ borderBottom: "1px solid #fed7aa", backgroundColor: isNearExpiry ? "#fef2f2" : "transparent" }}>
                          <td style={{ padding: "12px 4px" }}>
                            <div style={{fontSize: "14px", fontWeight: "bold"}}>{role === 'admin' ? p.name : cleanName(p.name)} {isNearExpiry && <span style={{color: "#ef4444", fontSize: "9px", border: "1px solid #ef4444", padding: "1px 2px", borderRadius: "2px"}}>⚠️</span>} {p.isHappyHour && <span style={{color: "#ea580c", fontSize: "9px", fontStyle:"italic"}}>[Giờ Vàng]</span>}</div>
                            <div style={{fontSize: "10px", color: "#94a3b8", marginTop: "2px"}}>{p.product_code} • <span style={{cursor: role==='admin' ? 'pointer' : 'default', textDecoration: role==='admin' ? 'underline' : 'none'}} onClick={() => role==='admin' && handleEdit(p.id, 'category', p.category || "Khác", true)}>{p.category || "Khác"}</span></div>
                            {gift.text ? <div style={{ fontSize: "10px", color: "#059669", fontWeight: "bold", cursor: role==='admin' ? 'pointer' : 'default', marginTop: "2px" }} onClick={() => role==='admin' && handleEdit(p.id, 'gift_info', p.gift_info, true)}>🎁 Tặng: {gift.text} {gift.cond > 1 ? `(Mua ≥ ${gift.cond})` : ''}</div> : (role === 'admin' && <div style={{ fontSize: "9px", color: "#cbd5e1", cursor: "pointer", marginTop: "2px" }} onClick={()=>handleEdit(p.id, 'gift_info', '', true)}>+ Thêm quà</div>)}
                          </td>
                          <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "14px", color: isOutOfStock ? "#94a3b8" : (isLowStock ? "#ef4444" : "#1e293b") }}>{p.stock} {isLowStock && <span title="Sắp hết hàng" style={{fontSize:"10px"}}>📉</span>}</td>
                          {role === 'admin' && <td style={{ textAlign: "center", color: "#64748b", fontSize: "12px" }}>{p.import_price?.toLocaleString()}</td>}
                          <td style={{ textAlign: "center" }}>
                            <div style={{ color: isP ? "#94a3b8" : "#16a34a", textDecoration: isP ? "line-through" : "none", fontSize: isP ? "11px" : "14px", fontWeight: "bold", cursor: role==='admin'?"pointer":"default" }} onClick={()=> role==='admin' && handleEdit(p.id, 'sale_price', p.sale_price)}>{p.sale_price.toLocaleString()}</div>
                            {isP ? <div style={{ color: "#ef4444", fontWeight: "900", fontSize: "14px", cursor: role==='admin'?"pointer":"default" }} onClick={()=> role==='admin' && handleEdit(p.id, 'promo_price', p.promo_price)}>🔥 {p.promo_price.toLocaleString()}</div> : (role === 'admin' && <div style={{ fontSize: "9px", color: "#cbd5e1", cursor: "pointer", marginTop: "2px" }} onClick={()=>handleEdit(p.id, 'promo_price', 0)}>🏷️ +Thêm KM</div>)}
                          </td>
                          <td style={{ textAlign: "center", fontSize: "11px" }}>
                            <div style={{color: isNearExpiry ? "#ef4444" : "#b91c1c", fontWeight: "bold", cursor: role==='admin'?"pointer":"default"}} onClick={()=> role==='admin' && handleEdit(p.id,'expiry_date',p.expiry_date,true)}>{isOutOfStock ? "---" : (p.expiry_date ? new Date(p.expiry_date).toLocaleDateString('vi-VN') : "---")}</div>
                            <div style={{color: "#64748b", marginTop: "2px"}}>{isOutOfStock ? "---" : dText}</div>
                          </td>
                          <td style={{ textAlign: "right", padding: "12px 4px" }}>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                              <button className="add-to-cart-btn" onClick={() => addToCart(p)}>+ GIỎ</button>
                              {role === 'admin' && <button onClick={() => handlePrintBarcode(p)} style={{ padding: "6px 8px", backgroundColor: "#e2e8f0", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "11px" }} title="In tem mã vạch">🖨️ Tem</button>}
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "2px dashed #fed7aa", paddingBottom: "12px" }}>
                    
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <h3 style={{ margin: 0, color: "#ef4444", fontSize: "15px", textTransform: "uppercase" }}>🛒 GIỎ HÀNG ({cart.reduce((s, i) => s + (Number(i.qty) || 0), 0)} món)</h3>
                      {custName && (
                        <div style={{fontSize: "11px", color: "#059669", fontWeight: "bold", marginTop: "2px"}}>
                          👤 VIP: {custName} <span style={{cursor:"pointer", color:"#ef4444", marginLeft: "4px"}} onClick={()=>{setCustName(""); setCustPhone(""); setCustomerInput("");}} title="Xóa khách khỏi giỏ">✖</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      {heldOrders.length > 0 && <button onClick={() => setShowHoldModal(true)} style={{ fontSize: "10px", padding: "6px 8px", background: "#fef3c7", color: "#d97706", border: "1px solid #fde68a", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>📂 TẠM LƯU ({heldOrders.length})</button>}
                      {cart.length > 0 && <button onClick={handleHoldOrder} style={{ fontSize: "10px", padding: "6px 8px", background: "#ffedd5", color: "#ea580c", border: "1px solid #fdba74", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>⏸️ LƯU TẠM</button>}
                      {cart.length > 0 && <button onClick={clearCart} style={{ fontSize: "10px", padding: "6px 8px", background: "#fee2e2", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>🗑️ HỦY HẾT</button>}
                    </div>
                </div>
                {cartTotalAmountDisplay > 0 && (
                    <div style={{ backgroundColor: "#fef2f2", padding: "12px 15px", borderRadius: "8px", border: "1px solid #fecaca", marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div><span style={{ fontSize: "12px", fontWeight: "bold", color: "#b91c1c" }}>TỔNG CỘNG:</span><div style={{ fontSize: "24px", fontWeight: "900", color: "#ef4444" }}>{cartTotalAmountDisplay.toLocaleString()}đ</div></div>
                      <button onClick={() => { setIsCheckoutOpen(true); setCheckoutStep(1); }} style={{ padding: "12px 25px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>THANH TOÁN</button>
                    </div>
                )}
                <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
                  {cart.length === 0 && <div style={{textAlign: "center", color: "#94a3b8", fontSize: "12px", marginTop: "15px"}}>Giỏ hàng trống</div>}
                  {cart.map((item, idx) => {
                    const gift = parseGift(item.product.gift_info);
                    const hasGift = gift.text && (Number(item.qty)||0) >= gift.cond;
                    return (
                    <div key={idx} style={{ padding: "8px 0", borderBottom: "1px dashed #fed7aa", fontSize: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: "bold", color: "#1e293b", flex: 1, fontSize: "13px" }}>{cleanName(item.product.name)} {item.product.isHappyHour && <span style={{color:"#ea580c", fontSize:"10px"}}>[Giờ Vàng]</span>}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button className="qty-btn" onClick={() => adjustCartQty(item.product.id, -1)}>-</button>
                          <input className="qty-input" style={{fontSize: "13px", padding: "4px 0", width: "32px"}} type="number" value={item.qty} onChange={(e) => handleDirectQtyChange(item.product.id, e.target.value)} onBlur={(e) => handleDirectQtyBlur(item.product.id, e.target.value)} onFocus={(e) => e.target.select()} title="Bấm để nhập số lượng" />
                          <button className="qty-btn" onClick={() => adjustCartQty(item.product.id, 1)}>+</button>
                          <button onClick={()=>removeFromCart(item.product.id)} style={{border:"none",background:"none",color:"#ef4444", cursor:"pointer", fontSize: "18px", marginLeft: "4px", fontWeight:"bold"}}>×</button>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>{hasGift && <span style={{ color: "#10b981", fontSize: "10px", fontStyle: "italic" }}>+ 🎁 {gift.text}</span>}</span>
                        <span style={{ color: "#ef4444", fontWeight: "bold", fontSize:"14px" }}>{Math.round(item.total).toLocaleString()}đ</span>
                      </div>
                    </div>
                  )})}
                </div>
              </div>
              <div className="glass" style={{ padding: "15px", height: "35vh", display: "flex", flexDirection: "column" }}>
                
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", gap: "8px", flex: 1 }}>
                     <input placeholder="🔍 Tìm giao dịch (Tên/SĐT)..." value={logSearchTerm} onChange={e => setLogSearchTerm(e.target.value)} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", fontSize: "12px", flex: 1 }} />
                     <select value={logTypeFilter} onChange={e => setLogTypeFilter(e.target.value)} style={{ padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", fontSize: "12px", fontWeight: "bold", color: "#1e293b", backgroundColor: "#f8fafc" }}>
                        <option value="Tất cả">Tất cả</option><option value="BÁN">Bán hàng</option><option value="NHẬP">Nhập hàng</option><option value="TRẢ HÀNG">Trả hàng</option><option value="GHI NỢ">Ghi nợ</option><option value="THU NỢ">Thu nợ</option>
                     </select>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
                    {Object.keys(groupedHistory).length === 0 && <div style={{textAlign: "center", color: "#94a3b8", fontSize: "11px", marginTop: "15px"}}>Không tìm thấy dữ liệu phù hợp</div>}
                    {Object.keys(groupedHistory).map((date) => (
                      <div key={date}>
                        <div onClick={() => toggleDateGroup(date)} style={{backgroundColor: "#ffedd5", padding: "6px 10px", fontSize: "11px", fontWeight: "bold", border: "1px solid #fed7aa", borderRadius: "4px", marginTop: "6px", display: "flex", justifyContent: "space-between", cursor: "pointer"}}>
                            <span>📅 {date}</span><span>{expandedDates[date] ?? true ? "▼" : "▶"}</span>
                        </div>
                        {(expandedDates[date] ?? true) && (
                          <div style={{ padding: "0 4px" }}>
                            {groupedHistory[date].map((log: any) => (
                              <div key={log.id} style={{fontSize: "11px", padding: "6px 0", borderBottom: "1px dashed #eee", display: "flex", flexDirection: "column"}}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span><b style={{color: log.type === 'TRẢ HÀNG' ? '#ef4444' : '#1e293b'}}>[{log.type}]</b> {cleanName(log.name)} x{log.qty} {log.refunded_qty > 0 && <span style={{color:"#ef4444", fontSize:"9px"}}>(Đã hoàn {log.refunded_qty})</span>}</span>
                                    {log.type === "BÁN" && <span style={{color:"#059669", fontWeight:"bold"}}>+{Math.round(log.total).toLocaleString()} <span style={{fontSize: "9px", color:"#94a3b8", fontWeight:"normal"}}>({log.paymentMethod === 'CHUYỂN KHOẢN' ? 'CK' : 'TM'})</span></span>}
                                    {log.type === "TRẢ HÀNG" && <span style={{color:"#ef4444", fontWeight:"bold"}}>{Math.round(log.total).toLocaleString()} <span style={{fontSize: "9px", color:"#94a3b8", fontWeight:"normal"}}>({log.paymentMethod === 'VÍ ĐIỂM' ? 'VÍ' : 'TM'})</span></span>}
                                    {log.type === "GHI NỢ" && <span style={{color:"#ea580c", fontWeight:"bold"}}>Nợ: {Math.round(log.total).toLocaleString()}</span>}
                                    {log.type === "THU NỢ" && <span style={{color:"#10b981", fontWeight:"bold"}}>+{Math.round(log.total).toLocaleString()} <span style={{fontSize: "9px", color:"#94a3b8", fontWeight:"normal"}}>({log.paymentMethod === 'CHUYỂN KHOẢN' ? 'CK' : 'TM'})</span></span>}
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8", marginTop: "4px" }}>
                                    <span>{log.customer}</span>
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                      <span>{log.t}</span>
                                      {log.type === 'BÁN' && log.product_id !== 'DISCOUNT' && (
                                        <button onClick={() => handleRefund(log.id)} disabled={(log.refunded_qty || 0) >= log.qty} style={{ fontSize: "9px", padding: "2px 6px", border: "1px solid #cbd5e1", background: (log.refunded_qty || 0) >= log.qty ? "#f1f5f9" : "#fff", color: (log.refunded_qty || 0) >= log.qty ? "#94a3b8" : "#000", cursor: (log.refunded_qty || 0) >= log.qty ? "not-allowed" : "pointer", borderRadius: "4px" }}>
                                            {(log.refunded_qty || 0) >= log.qty ? "Đã hoàn" : `↩️ Hoàn ${log.qty - (log.refunded_qty || 0)}`}
                                        </button>
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

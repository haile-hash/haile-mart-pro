/* eslint-disable */
// @ts-nocheck
import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "./supabaseClient";

const styles = `
  @keyframes wave { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
  @keyframes logo-glow { 0%, 100% { box-shadow: 0 0 10px rgba(250,204,21,0.2) } 50% { box-shadow: 0 0 20px rgba(250,204,21,0.6) } }
  @keyframes float { 0% { transform: translateY(0) } 50% { transform: translateY(-20px) } 100% { transform: translateY(0) } }
  @keyframes pulse-fast { 0% { opacity: 1 } 50% { opacity: 0.5 } 100% { opacity: 1 } }
  .logo-icon { background-color: #dc2626; padding: 8px; border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(220,38,38,0.2); border: 1px solid rgba(250,204,21,0.5); }
  .text-wave { animation: wave 2.5s ease-in-out infinite; }
  .spring-bg { position: fixed; width: 400px; height: 400px; border-radius: 50%; filter: blur(100px); z-index: -1; opacity: 0.3; animation: float 10s infinite ease-in-out; }
  .glass { background: rgba(255,255,255,0.98); border: 1px solid #fed7aa; border-radius: 12px; box-shadow: 0 4px 15px rgba(251,146,60,0.08); }
  body { background-color: #fff7ed; margin: 0; font-family: 'Inter', sans-serif; color: #431407; }
  .tab-btn { padding: 6px 12px; border-radius: 20px; border: 1px solid #fed7aa; background: #fff; cursor: pointer; font-size: 12px; font-weight: bold; color: #9a3412; white-space: nowrap; }
  .tab-btn.active { background: #ef4444; color: #fff; border-color: #ef4444; }
  .qty-input { width: 28px; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px; outline: none; font-size: 11px; font-weight: bold; color: #1e293b; padding: 3px 0; background: #fff; }
  .add-to-cart-btn { padding: 8px 16px; background-color: #fbbf24; color: #78350f; border: none; border-radius: 6px; font-weight: 900; cursor: pointer; font-size: 12px; box-shadow: 0 2px 4px rgba(251,191,36,0.3); }
  @media print {
    .no-print { display: none !important; }
    body, html { background: #fff !important; margin: 0; padding: 0; width: 100%; display: flex; justify-content: center; }
    .print-receipt-container { display: block !important; width: 80mm !important; margin: 0 auto !important; padding: 5mm !important; font-family: Arial, sans-serif; color: #000; font-size: 12px; line-height: 1.5; box-sizing: border-box; }
    .print-flex { display: flex !important; width: 100%; justify-content: center; flex-wrap: wrap; }
    @page { margin: 0; }
  }
  .print-receipt-container, .print-flex { display: none; }
`;

export default function App() {
  const VAT_RATE = 0.1;
  const EMAILJS_SERVICE_ID = "service_7ie990l";
  const EMAILJS_TEMPLATE_ID = "template_t91erhg";
  const EMAILJS_TEMPLATE_VIP_ID = "template_m1j9i7k";
  const EMAILJS_PUBLIC_KEY = "5ric0kxuwNPlUleAv";

  const safeGetLS = (k: string, d: any) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch (e) { return d } };
  
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

  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [loading, setLoading] = useState(false);
  const [showInputForm, setShowInputForm] = useState(false);
  
  // DỮ LIỆU ĐƯỢC GIỮ NGUYÊN TỪ BỘ NHỚ MÁY TÍNH
  const [customers, setCustomers] = useState<any>(() => safeGetLS("mart_customers", {}));
  const [heldOrders, setHeldOrders] = useState<any[]>(() => safeGetLS("mart_held_orders", []));
  const [auditLogs, setAuditLogs] = useState<any[]>(() => safeGetLS("mart_audit", []));
  const [expenses, setExpenses] = useState<any[]>(() => safeGetLS("mart_expenses", []));
  const [suppliers, setSuppliers] = useState<any[]>(() => safeGetLS("mart_suppliers", []));
  const [history, setHistory] = useState<any[]>(() => safeGetLS("mart_history", []));

  const [showSettings, setShowSettings] = useState(false);
  const [newAdminPass, setNewAdminPass] = useState("");
  const [newStaffPass, setNewStaffPass] = useState("");
  const [newBankBin, setNewBankBin] = useState("");
  const [newBankAcc, setNewBankAcc] = useState("");
  const [newBankNameStr, setNewBankNameStr] = useState("");

  const [sortConfig, setSortConfig] = useState<{key:string,direction:'asc'|'desc'}|null>(null);
  const [openFilter, setOpenFilter] = useState<string|null>(null);
  const [filters, setFilters] = useState<Record<string,any[]>>({});
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

  const [scannerMode, setScannerMode] = useState<'product'|'voucher'|'customer'|null>(null);
  const [scannedCodeObj, setScannedCodeObj] = useState<any>(null);
  const [scanMessage, setScanMessage] = useState<{text:string,type:'success'|'error'}|null>(null);
  const [printBarcodeProduct, setPrintBarcodeProduct] = useState<any>(null);
  const [printCustomer, setPrintCustomer] = useState<any>(null);
  const [barcodeCount, setBarcodeCount] = useState<number>(30);
  const [printMode, setPrintMode] = useState<'receipt'|'barcode'|'customer_card'|null>(null);

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
  // --- CORE LOGIC & SYNC ---
  const loadCloudData = async () => {
    try {
      const [rCust, rHist, rExp, rSup, rAud] = await Promise.all([
        supabase.from('customers').select('*'),
        supabase.from('history').select('*').order('id', { ascending: false }).limit(1500),
        supabase.from('expenses').select('*').order('id', { ascending: false }),
        supabase.from('suppliers').select('*').order('id', { ascending: false }),
        supabase.from('audit_logs').select('*').order('id', { ascending: false }).limit(300)
      ]);
      // CHỈ GỘP VÀO (MERGE), KHÔNG GHI ĐÈ NẾU CLOUD TRỐNG
      if (rCust.data && rCust.data.length > 0) {
        setCustomers(prev => { const merged = { ...prev }; rCust.data.forEach((c: any) => merged[c.phone] = c); return merged; });
      }
      if (rHist.data && rHist.data.length > 0) setHistory(prev => prev.length > 0 ? prev : rHist.data);
      if (rExp.data && rExp.data.length > 0) setExpenses(prev => prev.length > 0 ? prev : rExp.data);
      if (rSup.data && rSup.data.length > 0) setSuppliers(prev => prev.length > 0 ? prev : rSup.data);
      if (rAud.data && rAud.data.length > 0) setAuditLogs(prev => prev.length > 0 ? prev : rAud.data);
    } catch (err) { console.error("Lỗi tải Cloud:", err); }
  };

  const playSound = (type: 'success' | 'error') => { try { const ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); if (type === 'success') { osc.frequency.value = 800; gain.gain.setValueAtTime(0.1, ctx.currentTime); osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1) } else { osc.frequency.value = 250; osc.type = 'square'; gain.gain.setValueAtTime(0.1, ctx.currentTime); osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3) } } catch (e) { } };
  
  const logAudit = async (action: string, detail: string) => { const id = Math.floor(Date.now() + Math.random() * 1000); const newLog = { id, time: new Date().toLocaleString('vi-VN'), user_name: role === 'admin' ? 'Quản lý' : 'Thu ngân', shift, action, detail }; setAuditLogs(prev => [newLog, ...prev].slice(0, 300)); supabase.from('audit_logs').insert([newLog]).then(); };
  const parseGift = (giftStr: string | null) => { if (!giftStr) return { cond: 0, text: "" }; if (giftStr.includes(';;;')) { const parts = giftStr.split(';;;'); return { cond: parseInt(parts[0]) || 1, text: parts[1] || "" } } return { cond: 1, text: giftStr } };
  const cleanName = (name: string) => name ? name.split(' [Lô')[0] : '';
  const getActualPrice = (p: any) => { let price = (p.promo_price && p.promo_price > 0) ? p.promo_price : p.sale_price; const currentHour = new Date().getHours(); if ((currentHour >= 20 || currentHour < 6) && (p.category === 'Đồ ăn liền' || p.category === 'Bánh Kẹo')) { price = price * 0.8; p.isHappyHour = true } else { p.isHappyHour = false } return Math.round(Number(price)) };
  const getCustomerTier = (totalSpent = 0) => { const ts = Number(totalSpent); if (ts >= 500000000) return { name: "💎 KIM CƯƠNG", discountRate: 0.10, color: "#a855f7", bg: "#faf5ff", border: "#e9d5ff" }; if (ts >= 200000000) return { name: "🥇 VÀNG", discountRate: 0.05, color: "#ca8a04", bg: "#fefce8", border: "#fef08a" }; if (ts >= 50000000) return { name: "🥈 BẠC", discountRate: 0.02, color: "#475569", bg: "#f8fafc", border: "#cbd5e1" }; return { name: "🥉 ĐỒNG", discountRate: 0, color: "#b45309", bg: "#fffbeb", border: "#fde68a" }; };
  
  const fetchProducts = async () => { const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false }); if (data) setProducts(data) };
  const findProductByCode = (code: string) => { const rawCode = code.trim(); let matches = products.filter(prod => prod.product_code === rawCode || prod.product_code.startsWith(`${rawCode}-`)); let available = matches.filter(p => Number(p.stock) > 0); if (available.length > 0) { available.sort((a, b) => { if (!a.expiry_date) return 1; if (!b.expiry_date) return -1; return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime() }); return available[0] } return matches.length > 0 ? matches[0] : null };
  
  useEffect(() => { const timer = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(timer) }, []);
  useEffect(() => { localStorage.setItem("mart_history", JSON.stringify(history)); localStorage.setItem("mart_customers", JSON.stringify(customers)); localStorage.setItem("mart_held_orders", JSON.stringify(heldOrders)); localStorage.setItem("mart_audit", JSON.stringify(auditLogs)); localStorage.setItem("mart_expenses", JSON.stringify(expenses)); localStorage.setItem("mart_suppliers", JSON.stringify(suppliers)) }, [history, customers, heldOrders, auditLogs, expenses, suppliers]);
  useEffect(() => { if (isLoggedIn) { fetchProducts(); loadCloudData(); const channel = supabase.channel("db_changes").on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchProducts()).subscribe(); return () => supabase.removeChannel(channel) } }, [isLoggedIn]);
  
  const handleSelectSuggest = (p_input: any) => {
    const baseCode = p_input.product_code.split('-')[0];
    const totalStock = products.filter(p => p.product_code === baseCode || p.product_code.startsWith(`${baseCode}-`)).reduce((s, p) => s + Number(p.stock || 0), 0);
    if (totalStock <= 0) { playSound('error'); return alert("Đã hết hàng!"); }
    const price = getActualPrice(p_input); const repName = cleanName(p_input.name);
    setCart(prev => {
      const exist = prev.find(item => cleanName(item.product.name) === repName);
      if (exist) {
        if (exist.qty + 1 > totalStock) { playSound('error'); return prev; }
        playSound('success'); return prev.map(i => cleanName(i.product.name) === repName ? { ...i, qty: i.qty + 1, total: Math.round((i.qty + 1) * price * (1 + VAT_RATE)) } : i);
      } else {
        playSound('success'); return [...prev, { product: p_input, qty: 1, total: Math.round(price * (1 + VAT_RATE)) }];
      }
    });
    setScanMessage({ text: `✅ Thêm: ${repName}`, type: 'success' }); setBarcodeInput(""); setShowSuggestions(false); setTimeout(() => setScanMessage(null), 1500);
  };

  useEffect(() => {
    if (scannedCodeObj) {
      if (scannerMode === 'product') {
        const p = findProductByCode(scannedCodeObj.code); if (p) handleSelectSuggest(p); else {
          const matchedPhone = Object.keys(customers).find(phone => phone === scannedCodeObj.code.trim() || customers[phone].cardCode === scannedCodeObj.code.trim());
          if (matchedPhone) { playSound('success'); setCustomerInput(customers[matchedPhone].cardCode || matchedPhone); setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); setScanMessage({ text: `✅ KH VIP: ${customers[matchedPhone].name}`, type: 'success' }) } else { playSound('error'); setScanMessage({ text: `❌ Lỗi mã`, type: 'error' }) } setTimeout(() => setScannerMode(null), 1500)
        }
      } else if (scannerMode === 'voucher') {
        const code = scannedCodeObj.code.trim().toUpperCase(); const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "KM10K": 10000 };
        if (VOUCHERS[code]) { setAppliedVoucherAmount(VOUCHERS[code]); setVoucherInput(code); playSound('success'); setScanMessage({ text: `✅ Giảm ${VOUCHERS[code].toLocaleString()}đ`, type: 'success' }) } else if (!isNaN(Number(code)) && Number(code) > 0) { setAppliedVoucherAmount(Number(code)); setVoucherInput(code); playSound('success'); setScanMessage({ text: `✅ Giảm ${Number(code).toLocaleString()}đ`, type: 'success' }) } else { playSound('error'); alert("Mã Voucher không hợp lệ!"); setAppliedVoucherAmount(0) } setTimeout(() => setScannerMode(null), 1000)
      } else if (scannerMode === 'customer') {
        const val = scannedCodeObj.code.trim(); setCustomerInput(val); const mp = Object.keys(customers).find(ph => ph === val || customers[ph].cardCode === val);
        if (mp) { setCustPhone(mp); setCustName(customers[mp].name); playSound('success'); setScanMessage({ text: `✅ VIP: ${customers[mp].name}`, type: 'success' }) } else { setCustPhone(val); setCustName(""); playSound('success'); setScanMessage({ text: `✅ Khách mới`, type: 'success' }) } setTimeout(() => setScannerMode(null), 1000)
      }
      setScannedCodeObj(null);
    }
  }, [scannedCodeObj]);

  useEffect(() => { const handleAfterPrint = () => setPrintMode(null); window.addEventListener("afterprint", handleAfterPrint); return () => window.removeEventListener("afterprint", handleAfterPrint) }, []);

  const todayStrStr = new Date().toLocaleDateString('vi-VN');
  const getLogDStr = (log: any) => { if (log.time) return log.time.split(' ')[1] || log.time.split(' ').pop(); const d = new Date(Number(log.id)); return isNaN(d.getTime()) ? "" : d.toLocaleDateString('vi-VN') };
  const getLogTStr = (log: any) => { if (log.time) return log.time.split(' ')[0]; const d = new Date(Number(log.id)); return isNaN(d.getTime()) ? "" : d.toLocaleTimeString('vi-VN') };

  const currentShiftStats = useMemo(() => { let cash = 0, transfer = 0, prof = 0, totalSales = 0; history.filter(h => getLogDStr(h) === todayStrStr && h.shift === shift).forEach(h => { if (h.type === 'BÁN' || h.type === 'GHI NỢ') totalSales += Number(h.total || 0); if (h.type === 'BÁN' || h.type === 'THU NỢ' || h.type === 'TRẢ HÀNG') { if (h.paymentMethod === 'CHUYỂN KHOẢN') transfer += Number(h.total || 0); else if (h.paymentMethod === 'TIỀN MẶT') cash += Number(h.total || 0) } if (h.type !== 'NHẬP') prof += Number(h.profit || 0) }); return { rev: cash + transfer, cash, transfer, prof, totalSales } }, [history, shift, todayStrStr]);
  const todayStats = useMemo(() => { let totalSales = 0, prof = 0; history.filter(h => getLogDStr(h) === todayStrStr).forEach(h => { if (h.type === 'BÁN' || h.type === 'GHI NỢ') totalSales += Number(h.total || 0); if (h.type !== 'NHẬP') prof += Number(h.profit || 0) }); const exp = expenses.filter(e => e.date === todayStrStr).reduce((s, e) => s + Number(e.amount || 0), 0); return { totalSales, netProfit: prof - exp, expenses: exp } }, [history, expenses, todayStrStr]);
  const groupedHistory = useMemo(() => { let filtered = history; if (logTypeFilter !== "Tất cả") filtered = filtered.filter(log => log.type === logTypeFilter); if (logSearchTerm.trim() !== "") { const term = logSearchTerm.toLowerCase(); filtered = filtered.filter(log => (log.name && log.name.toLowerCase().includes(term)) || (log.customer && log.customer.toLowerCase().includes(term))) } return filtered.reduce((groups: any, log: any) => { const d = getLogDStr(log); if (!d) return groups; if (!groups[d]) groups[d] = []; groups[d].push({ ...log, t: getLogTStr(log) }); return groups }, {}) }, [history, logSearchTerm, logTypeFilter]);

  const totalValue = Math.round(products.reduce((sum, p) => sum + (Number(p.import_price || 0) * Number(p.stock || 0)), 0));
  const lowStockCount = products.filter(p => Number(p.stock) > 0 && Number(p.stock) < 10).length;
  const cartTotalAmountDisplay = cart.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const currentTier = getCustomerTier(customers[custPhone]?.totalSpent || 0);
  const tierDiscountAmount = custPhone ? Math.round(cartTotalAmountDisplay * currentTier.discountRate) : 0;
  const amountAfterTierAndVoucher = Math.max(0, cartTotalAmountDisplay - appliedVoucherAmount - tierDiscountAmount);
  const walletUsedAmount = useWallet ? Math.min(Number(customers[custPhone]?.wallet || 0), amountAfterTierAndVoucher) : 0;
  const finalToPay = amountAfterTierAndVoucher - walletUsedAmount;

  const uniqueNames = useMemo(() => Array.from(new Set(products.map(p => cleanName(p.name)))).sort(), [products]);
  const categories = ["Tất cả", ...Array.from(new Set(products.map(p => p.category || "Khác")))];
  const sortedAndFilteredProducts = useMemo(() => { let filtered = products.filter(p => (selectedCategory === "Tất cả" || (p.category || "Khác") === selectedCategory)).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.product_code && p.product_code.toLowerCase().includes(searchTerm.toLowerCase()))); if (filters['name']?.length > 0) filtered = filtered.filter(p => filters['name'].includes(cleanName(p.name))); if (sortConfig !== null) { filtered.sort((a, b) => { let valA = a[sortConfig.key]; let valB = b[sortConfig.key]; if (sortConfig.key === 'expiry_date') { valA = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity; valB = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity; } if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1; if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1; return 0 }) } return filtered }, [products, searchTerm, selectedCategory, sortConfig, filters]);

  const handleLogin = (e: React.FormEvent) => { e.preventDefault(); const u = authUsername.trim().toLowerCase(); const p = authPassword.trim(); if (u === "admin" && p === "khoiphuc88") { setAdminPass("haile88"); localStorage.removeItem("mart_admin_pass"); setStaffPass("123"); localStorage.removeItem("mart_staff_pass"); setAuthPassword(""); alert("✅ Cài lại MK gốc:\nAdmin: haile88\nNV: 123"); return } if (u === "admin" && p === adminPass) { setIsLoggedIn(true); setRole("admin"); localStorage.setItem("mart_shift", shift); localStorage.setItem("mart_logged_in", "true"); localStorage.setItem("mart_role", "admin"); logAudit("ĐĂNG NHẬP", "Mở ca") } else if (u === "nhanvien" && p === staffPass) { setIsLoggedIn(true); setRole("staff"); localStorage.setItem("mart_shift", shift); localStorage.setItem("mart_logged_in", "true"); localStorage.setItem("mart_role", "staff"); logAudit("ĐĂNG NHẬP", "Mở ca") } else { alert("❌ Sai tài khoản!") } };

  const confirmCheckout = async (payMethod: 'TIỀN MẶT' | 'CHUYỂN KHOẢN' | 'GHI NỢ') => {
    if (cart.length === 0) return; if (payMethod === 'GHI NỢ' && !custPhone) return alert("Ghi nợ cần SĐT!");
    setLoading(true); let logs: any[] = [];
    const subTotal = Math.round(cart.reduce((s, i) => s + (i.qty * getActualPrice(i.product)), 0));
    const vatTotal = Math.round(subTotal * VAT_RATE); const baseTotal = subTotal + vatTotal;
    const totalAfterVoucher = Math.max(0, baseTotal - appliedVoucherAmount);
    const tDiscount = custPhone ? Math.round(cartTotalAmountDisplay * currentTier.discountRate) : 0;
    const amountAfterTierAndVoucher = Math.max(0, totalAfterVoucher - tDiscount);
    const walletUsedAmount = useWallet && payMethod !== 'GHI NỢ' ? Math.round(Math.min(Number(customers[custPhone]?.wallet || 0), amountAfterTierAndVoucher)) : 0;
    const finalTotal = amountAfterTierAndVoucher - walletUsedAmount;
    const totalDiscount = appliedVoucherAmount + walletUsedAmount + tDiscount;
    const earned = payMethod === 'GHI NỢ' ? 0 : Math.round(finalTotal * 0.02);

    for (const item of cart) {
      const baseCode = item.product.product_code.split('-')[0];
      const batches = products.filter(p => p.product_code === baseCode || p.product_code.startsWith(`${baseCode}-`)).sort((a, b) => { if (!a.expiry_date) return 1; if (!b.expiry_date) return -1; return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime() });
      let rem = item.qty; const price = getActualPrice(item.product);
      for (const b of batches) {
        if (rem <= 0) break; if (Number(b.stock) > 0) {
          const take = Math.min(rem, Number(b.stock)); await supabase.from("products").update({ stock: Number(b.stock) - take }).eq("id", b.id);
          logs.push({ id: Math.floor(Date.now() + Math.random() * 1000), shift, type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", name: cleanName(b.name) + (item.product.isHappyHour ? ' [Giờ Vàng]' : ''), qty: take, total: Math.round(take * price * (1 + VAT_RATE)), profit: Math.round(take * (price - (b.import_price || 0))), customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: b.id, refunded_qty: 0, paymentMethod: payMethod, time: new Date().toLocaleString('vi-VN') }); rem -= take;
        }
      }
    }

    if (totalDiscount > 0) logs.push({ id: Math.floor(Date.now() + Math.random() * 1000), shift, type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", name: "Giảm giá/Ví/VIP", qty: 1, total: -totalDiscount, profit: -totalDiscount, customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: 'DISCOUNT', refunded_qty: 0, paymentMethod: payMethod, time: new Date().toLocaleString('vi-VN') });
    supabase.from('history').insert(logs).then();
    if (custPhone) {
      const updatedCust = { name: custName, wallet: payMethod === 'GHI NỢ' ? Number(customers[custPhone]?.wallet || 0) : Math.round(Number(customers[custPhone]?.wallet || 0) - walletUsedAmount + earned), debt: Number(customers[custPhone]?.debt || 0) + (payMethod === 'GHI NỢ' ? finalTotal : 0), totalSpent: Number(customers[custPhone]?.totalSpent || 0) + (payMethod !== 'GHI NỢ' ? finalTotal : 0), email: customers[custPhone]?.email || "", cardCode: customers[custPhone]?.cardCode || "" };
      setCustomers(prev => ({ ...prev, [custPhone]: updatedCust })); supabase.from('customers').upsert([{ phone: custPhone, ...updatedCust }]).then();
    }
    setHistory(prev => [...logs, ...prev]);
    setLastOrder({ orderId: "HD" + Math.floor(Date.now() / 1000).toString().slice(-6), shift, cart: [...cart], subTotal, vatTotal, finalTotal: payMethod === 'GHI NỢ' ? 0 : finalTotal, debtAmount: payMethod === 'GHI NỢ' ? finalTotal : 0, discount: totalDiscount, time: new Date().toLocaleString('vi-VN'), paymentMethod: payMethod, customerGiven: payMethod === 'TIỀN MẶT' ? Number(customerGiven) : 0 });
    setCheckoutStep(3); fetchProducts(); setLoading(false);
  };

  const adjustCartQty = (productId: any, delta: number) => {
    let exceedStock = false;
    setCart(prev => {
      const updated = prev.map(item => {
        if (item.product.id === productId) {
          const baseCode = item.product.product_code.split('-')[0];
          const totalStock = products.filter(p => p.product_code === baseCode || p.product_code.startsWith(`${baseCode}-`)).reduce((s, p) => s + Number(p.stock || 0), 0);
          const newQty = item.qty + delta;
          if (newQty > totalStock) { exceedStock = true; return item; }
          const price = getActualPrice(item.product);
          return { ...item, qty: newQty, total: Math.round(newQty * price * (1 + VAT_RATE)) };
        }
        return item;
      });
      return updated.filter(item => item.qty > 0);
    });
    if (exceedStock) playSound('error');
  };

  const handleDirectQtyChange = (productId: any, val: string) => {
    setCart(prev => {
      if (val === '') return prev.map(i => i.product.id === productId ? { ...i, qty: '' as any, total: 0 } : i);
      let num = parseInt(val); if (isNaN(num) || num < 0) return prev;
      let exceedStock = false;
      const updated = prev.map(i => {
        if (i.product.id === productId) {
          const baseCode = i.product.product_code.split('-')[0];
          const totalStock = products.filter(p => p.product_code === baseCode || p.product_code.startsWith(`${baseCode}-`)).reduce((s, p) => s + Number(p.stock || 0), 0);
          if (num > totalStock) { exceedStock = true; num = totalStock; }
          const price = getActualPrice(i.product);
          return { ...i, qty: num, total: Math.round(num * price * (1 + VAT_RATE)) };
        }
        return i;
      });
      if (exceedStock) playSound('error'); return updated;
    });
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); const added = parseInt(newStock || "0"); const impPrice = parseInt(newImportPrice); const salePrice = parseInt(newPrice); const promo = parseInt(newPromoPrice) || 0; const finalGiftInfo = newGiftInfo.trim() !== "" ? `${newGiftCondition};;;${newGiftInfo}` : null; const baseCode = newCode.trim(); const allVariants = products.filter(p => p.product_code === baseCode || p.product_code.startsWith(`${baseCode}-`)); const exist = allVariants.find(p => p.product_code === baseCode); let priceUpdatedMsg = "";
    if (allVariants.length > 0 && allVariants[0].sale_price !== salePrice) { await Promise.all(allVariants.map(v => supabase.from("products").update({ sale_price: salePrice, promo_price: promo }).eq("id", v.id))); priceUpdatedMsg = `\n💡 Đã ĐỒNG BỘ GIÁ lô cũ!`; logAudit("ĐỒNG BỘ GIÁ", `Mã ${baseCode}`); }
    if (exist) {
      if (Number(exist.stock) <= 0) {
        await supabase.from("products").update({ name: newName, category: newCategory || "Khác", import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null, created_at: new Date().toISOString() }).eq("id", exist.id);
        if (added > 0) { const lg = { id: Math.floor(Date.now() + Math.random() * 1000), shift, type: "NHẬP", name: newName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }; setHistory(prev => [lg, ...prev]); await supabase.from('history').insert([lg]); } logAudit("NHẬP ĐÈ CŨ", `${newName}`); alert(`Đã nhập hàng!${priceUpdatedMsg}`)
      } else {
        if (exist.import_price !== impPrice || (exist.expiry_date || "") !== (newExpiry || "")) {
          const batchCode = `${baseCode}-${Date.now().toString().slice(-4)}`; const batchName = `${newName} [Lô ${newExpiry ? new Date(newExpiry).toLocaleDateString('vi-VN') : 'Mới'}]`;
          if (window.confirm(`Tạo LÔ MỚI (${batchCode})?`)) {
            await supabase.from("products").insert([{ product_code: batchCode, name: batchName, category: newCategory || "Khác", import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null }]);
            if (added > 0) { const lg = { id: Math.floor(Date.now() + Math.random() * 1000), shift, type: "NHẬP", name: batchName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }; setHistory(prev => [lg, ...prev]); await supabase.from('history').insert([lg]); } logAudit("TÁCH LÔ", `${batchName}`); if (!priceUpdatedMsg) alert(`Đã tạo mới!`)
          } else { setLoading(false); return }
        } else {
          await supabase.from("products").update({ stock: Number(exist.stock) + added, created_at: new Date().toISOString() }).eq("id", exist.id);
          if (added > 0) { const lg = { id: Math.floor(Date.now() + Math.random() * 1000), shift, type: "NHẬP", name: newName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }; setHistory(prev => [lg, ...prev]); await supabase.from('history').insert([lg]); } logAudit("CỘNG DỒN", `${newName}`); alert(`Cộng dồn thành công!${priceUpdatedMsg}`)
        }
      }
    } else {
      await supabase.from("products").insert([{ product_code: baseCode, name: newName, category: newCategory || "Khác", import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null }]);
      if (added > 0) { const lg = { id: Math.floor(Date.now() + Math.random() * 1000), shift, type: "NHẬP", name: newName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }; setHistory(prev => [lg, ...prev]); await supabase.from('history').insert([lg]); } logAudit("NHẬP MỚI", `${newName}`); if (priceUpdatedMsg) alert(`Nhập thành công!${priceUpdatedMsg}`)
    }
    setNewCode(""); setNewName(""); setNewCategory("Đồ uống"); setNewImportPrice(""); setNewPrice(""); setNewPromoPrice(""); setNewGiftCondition("1"); setNewGiftInfo(""); setNewStock(""); setNewExpiry(""); fetchProducts(); setLoading(false); setShowInputForm(false)
  };

  const HeaderLogo = () => (
    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      <div className="logo-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
      </div>
      <div className="text-wave" style={{ display: "flex", flexDirection: "column" }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "900", letterSpacing: "0.5px", color: "#0f172a", lineHeight: "1", whiteSpace: "nowrap" }}>HẢI LÊ <span style={{ color: "#dc2626" }}>MART</span></h1>
        <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "800", letterSpacing: "3px", textTransform: "uppercase", marginTop: "4px", whiteSpace: "nowrap" }}>ERP System</div>
      </div>
    </div>
  );
if (!isLoggedIn) return (<div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", position: "relative", overflow: "hidden" }}><style>{styles}</style><div className="spring-bg" style={{ background: "#ef4444", top: "-10%", left: "-10%" }}></div><div className="spring-bg" style={{ background: "#fbbf24", bottom: "-10%", right: "-10%" }}></div><div className="glass" style={{ padding: "40px", width: "100%", maxWidth: "380px", textAlign: "center", border: "4px solid #ef4444" }}><div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "30px" }}><HeaderLogo /></div><form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}><select value={shift} onChange={e => setShift(e.target.value)} style={{ padding: "14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontWeight: "bold", color: "#1e293b", background: "#f8fafc" }}><option value="Ca Sáng">🌅 Ca Sáng (06:00 - 14:00)</option><option value="Ca Chiều">🌇 Ca Chiều (14:00 - 22:00)</option><option value="Ca Tối">🌙 Ca Tối (22:00 - 06:00)</option></select><input placeholder="Tên đăng nhập" value={authUsername} onChange={e => setAuthUsername(e.target.value)} style={{ padding: "14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none" }} /><input type="password" placeholder="Mật khẩu" value={authPassword} onChange={e => setAuthPassword(e.target.value)} style={{ padding: "14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none" }} /><button type="submit" style={{ padding: "14px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 6px rgba(220,38,38,0.3)" }}>MỞ CỬA BÁN HÀNG 🚀</button></form></div></div>);

  return (
    <div onClick={() => { setOpenFilter(null); setShowSuggestions(false); setShowMainMenu(false) }}>
      <style>{styles}</style>

      {/* CÁC MODAL */}
      {isCheckoutOpen && <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
        {checkoutStep === 1 && <div className="glass" style={{ padding: "25px", width: "350px" }} onClick={e => e.stopPropagation()}>
          <h3 style={{ color: "#ef4444", margin: "0", textAlign: "center" }}>🧧 THANH TOÁN</h3>
          <div style={{ display: "flex", position: "relative", marginTop: "15px" }}>
            <input type="text" placeholder="👉 Quẹt mã Voucher..." value={voucherInput} onChange={(e) => setVoucherInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const code = voucherInput.trim().toUpperCase(); const VOUCHERS: any = { "VC50K": 50000, "VC100K": 100000, "KM10K": 10000 }; if (VOUCHERS[code]) { setAppliedVoucherAmount(VOUCHERS[code]); playSound('success') } else { playSound('error'); alert("Mã Voucher lỗi!"); setAppliedVoucherAmount(0) } } }} style={{ flex: 1, padding: "12px", borderRadius: "10px 0 0 10px", border: "2px dashed #f59e0b", outline: "none", background: "#fffbeb" }} />
            <button onClick={() => setScannerMode('voucher')} style={{ padding: "0 15px", background: "#f59e0b", color: "white", borderRadius: "0 10px 10px 0" }}>📷</button>
          </div>
          {appliedVoucherAmount > 0 && <div style={{ color: "#059669", fontSize: "12px", fontWeight: "bold", marginTop: "4px", textAlign: "center" }}>✅ Đã áp dụng giảm: {appliedVoucherAmount.toLocaleString()}đ</div>}
          <div style={{ display: "flex", position: "relative", marginTop: "10px" }}>
            <input type="text" placeholder="👉 Quẹt Thẻ VIP/SĐT..." value={customerInput} onChange={(e) => { const val = e.target.value; setCustomerInput(val); const matchedPhone = Object.keys(customers).find(phone => phone === val.trim() || customers[phone].cardCode === val.trim()); if (matchedPhone) { setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); setUseWallet(false) } else { setCustPhone(val); setCustName(""); setUseWallet(false) } }} style={{ flex: 1, padding: "12px", borderRadius: "10px 0 0 10px", border: "2px solid #ef4444", outline: "none", fontWeight: "bold", color: "#b91c1c" }} />
            <button onClick={() => setScannerMode('customer')} style={{ padding: "0 15px", background: "#ef4444", color: "white", borderRadius: "0 10px 10px 0" }}>📷</button>
          </div>
          {custPhone && <div style={{ marginTop: "10px", padding: "12px", background: "#fff7ed", borderRadius: "8px", border: "1px dashed #f97316" }}>
            {customers[custPhone] ? <div>
              <div style={{ color: "#b91c1c", fontWeight: "bold" }}>⭐ {customers[custPhone].name}</div>
              <div style={{ marginTop: "4px" }}>Ví: <b>{Math.round(customers[custPhone].wallet || 0).toLocaleString()}đ</b> | Nợ: <b style={{ color: "#ef4444" }}>{(customers[custPhone].debt || 0).toLocaleString()}đ</b></div>
              {(customers[custPhone].wallet || 0) > 0 && <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", cursor: "pointer", color: "#ea580c", fontWeight: "bold" }}><input type="checkbox" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} /> Dùng điểm lì xì!</label>}
            </div> : <input type="text" placeholder="Tên khách mới..." value={custName} onChange={e => setCustName(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", outline: "none", border: "1px solid #fdba74" }} />}
          </div>}
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button onClick={() => { setCart([]); setIsCheckoutOpen(false); setCheckoutStep(1); setCustPhone(""); setCustName(""); setCustomerInput(""); setUseWallet(false); setAppliedVoucherAmount(0); setCustomerGiven(""); setLastOrder(null) }} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#e2e8f0", fontWeight: "bold", cursor: "pointer" }}>Hủy</button>
            <button onClick={() => { if (cart.length === 0) return alert("Giỏ hàng trống!"); if (custPhone && !customers[custPhone] && !custName) return alert("Nhập Tên khách mới!"); setCheckoutStep(2) }} style={{ flex: 2, padding: "10px", background: "#ef4444", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none" }}>TIẾP TỤC 👉</button>
          </div>
        </div>}
        {checkoutStep === 2 && <div className="glass" style={{ padding: "25px", width: "350px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
          <h3 style={{ color: "#ef4444", margin: "0" }}>📱 THANH TOÁN</h3>
          <div style={{ color: "#ef4444", fontSize: "28px", fontWeight: "900", margin: "10px 0" }}>{finalToPay.toLocaleString()}đ</div>
          <div style={{ position: "relative" }}>
            <img src={`https://img.vietqr.io/image/${bankBin}-${bankAcc}-compact2.png?amount=${finalToPay}&addInfo=Thanh toan&accountName=${encodeURIComponent(bankNameStr)}`} style={{ width: "160px", margin: "0 auto 10px auto", border: "2px solid #ef4444", borderRadius: "10px", display: "block" }} alt="QR" />
          </div>
          <div style={{ marginBottom: "15px", textAlign: "left", borderTop: "1px dashed #cbd5e1", paddingTop: "10px" }}>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold", marginBottom: "5px" }}>Tiền mặt khách đưa:</div>
            <input type="number" placeholder="Nhập số tiền..." value={customerGiven} onChange={e => setCustomerGiven(Number(e.target.value) || "")} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", boxSizing: "border-box", fontSize: "14px", fontWeight: "bold" }} />
            <div style={{ display: "flex", gap: "5px", marginTop: "8px", flexWrap: "wrap" }}>
              <button onClick={() => setCustomerGiven(finalToPay)} style={{ flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid #cbd5e1", cursor: "pointer" }}>Vừa đủ</button>
              <button onClick={() => setCustomerGiven(100000)} style={{ flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid #cbd5e1", cursor: "pointer" }}>100k</button>
              <button onClick={() => setCustomerGiven(500000)} style={{ flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid #cbd5e1", cursor: "pointer" }}>500k</button>
            </div>
            {customerGiven !== "" && Number(customerGiven) >= finalToPay && <div style={{ marginTop: "10px", padding: "10px", background: "#ecfdf5", border: "1px dashed #10b981", borderRadius: "8px", color: "#059669", fontWeight: "bold", fontSize: "16px", textAlign: "center" }}>THỐI LẠI: {(Number(customerGiven) - finalToPay).toLocaleString()}đ</div>}
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={() => setCheckoutStep(1)} style={{ flex: "1 1 100%", padding: "8px", borderRadius: "8px", border: "none", background: "#e2e8f0", cursor: "pointer", fontWeight: "bold" }}>Quay lại</button>
            <button onClick={() => confirmCheckout('GHI NỢ')} disabled={loading} style={{ flex: 1, padding: "10px", background: "#f59e0b", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "11px" }}>📝 GHI NỢ</button>
            <button onClick={() => confirmCheckout('CHUYỂN KHOẢN')} disabled={loading} style={{ flex: 1, padding: "10px", background: "#3b82f6", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "11px" }}>💳 CK</button>
            <button onClick={() => { if (finalToPay > 0 && (customerGiven === "" || Number(customerGiven) < finalToPay)) { playSound('error'); alert(`Khách đưa chưa đủ tiền!`); return } confirmCheckout('TIỀN MẶT') }} disabled={loading} style={{ flex: 1, padding: "10px", background: "#10b981", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "11px" }}>💵 TM</button>
          </div>
        </div>}
        {checkoutStep === 3 && <div className="glass" style={{ padding: "30px", width: "350px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
          <h3 style={{ color: "#10b981", margin: "10px 0" }}>Thành công!</h3>
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button onClick={() => { setPrintMode('receipt'); setTimeout(() => window.print(), 300) }} style={{ flex: 1, padding: "12px", background: "#ef4444", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>🖨️ In HĐ</button>
            <button onClick={() => { setCart([]); setIsCheckoutOpen(false); setCheckoutStep(1); setCustPhone(""); setCustName(""); setCustomerInput(""); setUseWallet(false); setAppliedVoucherAmount(0); setCustomerGiven(""); setLastOrder(null) }} style={{ flex: 1, padding: "12px", background: "#e2e8f0", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", color: "#1e293b" }}>Đóng</button>
          </div>
        </div>}
      </div>}

      {/* 🖨️ KHU VỰC IN ẨN */}
      {lastOrder && printMode === 'receipt' && <div className="print-receipt-container">
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <h2 style={{ margin: 0, fontSize: "20px" }}>HẢI LÊ MART</h2>
          <div>Tòa Nhà ATS, 252 Hoàng Quốc Việt, HN</div>
          <div>Hotline: 0902 613 899</div>
        </div>
        <div style={{ borderBottom: "1px dashed #000", marginBottom: "8px" }}></div>
        <table style={{ width: "100%", fontSize: "11px", marginBottom: "8px" }}>
          <tbody>
            <tr><td style={{ textAlign: "left" }}><b>HĐ:</b> {lastOrder.orderId}</td><td style={{ textAlign: "right" }}><b>Ca:</b> {shift}</td></tr>
            <tr><td style={{ textAlign: "left" }}><b>Ngày:</b> {lastOrder.time}</td><td style={{ textAlign: "right" }}><b>TN:</b> {role}</td></tr>
          </tbody>
        </table>
        <div style={{ borderBottom: "1px dashed #000", marginBottom: "8px" }}></div>
        <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
          <tbody>
            {lastOrder.cart.map((i: any, x: number) => {
              const p = Math.round(getActualPrice(i.product));
              const t = Math.round(i.qty * p);
              const g = parseGift(i.product.gift_info);
              const gQ = g.cond > 0 ? Math.floor(i.qty / g.cond) : 0;
              return (
                <React.Fragment key={x}>
                  <tr><td colSpan={2} style={{ fontWeight: "bold", paddingTop: "4px" }}>{cleanName(i.product.name)} {i.product.isHappyHour && '[Giờ Vàng]'}</td></tr>
                  <tr><td>{i.qty} x {p.toLocaleString()}</td><td style={{ textAlign: "right", fontWeight: "bold" }}>{t.toLocaleString()}</td></tr>
                  {g.text && gQ > 0 && <tr><td colSpan={2} style={{ fontSize: "10px", fontStyle: "italic" }}>+ 🎁 Tặng: {gQ} x {g.text}</td></tr>}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
        <div style={{ borderBottom: "1px dashed #000", marginBottom: "8px", marginTop: "4px" }}></div>
        <table style={{ width: "100%", fontSize: "12px" }}>
          <tbody>
            <tr><td>Tiền hàng:</td><td style={{ textAlign: "right" }}>{Math.round(lastOrder.subTotal).toLocaleString()}đ</td></tr>
            <tr><td>VAT (10%):</td><td style={{ textAlign: "right" }}>{Math.round(lastOrder.vatTotal).toLocaleString()}đ</td></tr>
            {lastOrder.discount > 0 && <tr><td>Giảm giá/Ví:</td><td style={{ textAlign: "right" }}>-{Math.round(lastOrder.discount).toLocaleString()}đ</td></tr>}
          </tbody>
        </table>
        <div style={{ borderBottom: "2px dashed #000", margin: "6px 0" }}></div>
        <table style={{ width: "100%", fontSize: "16px", fontWeight: 900 }}>
          <tbody>
            <tr><td>{lastOrder.debtAmount > 0 ? "NỢ:" : "TỔNG:"}</td><td style={{ textAlign: "right" }}>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</td></tr>
          </tbody>
        </table>
        {lastOrder.paymentMethod === 'TIỀN MẶT' && lastOrder.customerGiven > 0 && <table style={{ width: "100%", fontSize: "12px", marginTop: "6px", borderTop: "1px dotted #ccc", paddingTop: "4px", borderCollapse: "collapse" }}>
          <tbody>
            <tr><td>Khách đưa:</td><td style={{ textAlign: "right" }}>{Math.round(lastOrder.customerGiven).toLocaleString()}đ</td></tr>
            <tr><td><b>Trả lại:</b></td><td style={{ textAlign: "right" }}><b>{Math.round(lastOrder.customerGiven - lastOrder.finalTotal).toLocaleString()}đ</b></td></tr>
          </tbody>
        </table>}
        <div style={{ textAlign: "center", marginTop: "15px", fontSize: "11px" }}><b>CẢM ƠN QUÝ KHÁCH!</b></div>
      </div>}

      <div className="no-print" style={{ padding: "15px", minHeight: "100vh", overflowX: "auto" }}>
        <div style={{ maxWidth: "1500px", margin: "0 auto", minWidth: "1000px" }}>
          <div className="glass" style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "12px", borderBottom: "4px solid #ef4444" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <HeaderLogo />
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                  {role === 'admin' && <div style={{ textAlign: "center" }}><div style={{ fontSize: "10px", color: "#64748b" }}>VỐN</div><div style={{ fontSize: "15px", fontWeight: "900" }}>{totalValue.toLocaleString()}đ</div></div>}
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: "10px", color: "#64748b" }}>TIỀN MẶT</div><div style={{ fontSize: "15px", fontWeight: "900", color: "#059669" }}>{currentShiftStats.cash.toLocaleString()}đ</div></div>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: "10px", color: "#64748b" }}>CK</div><div style={{ fontSize: "15px", fontWeight: "900", color: "#2563eb" }}>{currentShiftStats.transfer.toLocaleString()}đ</div></div>
                </div>
                <button onClick={() => setShowHandoverModal(true)} style={{ padding: "10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>ĐĂNG XUẤT</button>
              </div>
            </div>
            <div style={{ display: "flex", borderTop: "1px dashed #cbd5e1", paddingTop: "12px", justifyContent: "space-between", alignItems: "center" }}>
               <div style={{ position: "relative" }}>
                   <button onClick={(e) => { e.stopPropagation(); setShowMainMenu(!showMainMenu) }} style={{ padding: "8px 24px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "900", cursor: "pointer" }}>MENU</button>
                   {showMainMenu && <div style={{ position: "absolute", top: "110%", left: 0, background: "#fff", border: "1px solid #cbd5e1", borderRadius: "10px", minWidth: "250px", zIndex: 1000, padding: "8px", display: "flex", flexDirection: "column" }}>
                      {role === 'admin' && <div onClick={() => { setShowMainMenu(false); setShowStatsModal(true) }} style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}>📊 Báo Cáo Doanh Thu</div>}
                      {role === 'admin' && <div onClick={() => { setShowMainMenu(false); setShowCustomerModal(true) }} style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}>🤝 Quản Lý Khách Hàng VIP</div>}
                      <div onClick={() => { setShowMainMenu(false); setShowDebtModal(true) }} style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", color: "#b91c1c" }}>📓 Sổ Nợ Khách Hàng</div>
                      {role === 'admin' && <div onClick={() => { setShowMainMenu(false); setShowSettings(true) }} style={{ padding: "12px", cursor: "pointer" }}>⚙️ Cài Đặt Hệ Thống</div>}
                   </div>}
               </div>
               <div style={{ display: "flex", gap: "15px", fontSize: "12px", fontWeight: "bold" }}>
                  <div style={{ background: "#f8fafc", padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>⏱️ {currentTime.toLocaleTimeString('vi-VN')}</div>
                  <div style={{ background: "#ecfdf5", padding: "6px 12px", borderRadius: "6px", border: "1px solid #a7f3d0", color: "#059669" }}>Online</div>
               </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "7fr 3fr", gap: "10px" }}>
            <div className="glass" style={{ padding: "12px" }}>
              <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
                <input placeholder="QUẸT MÃ VẠCH SP VÀ THẺ VIP..." value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} onKeyDown={handleBarcodeSubmit} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "2px solid #ef4444", background: "#fffbeb" }} />
                <button onClick={() => setScannerMode('product')} style={{ padding: "0 15px", background: "#ef4444", color: "white", borderRadius: "6px", border: "none", cursor: "pointer" }}>📷 QUÉT</button>
                {role === 'admin' && <button onClick={() => setShowInputForm(!showInputForm)} style={{ padding: "10px 15px", background: "#10b981", color: "white", borderRadius: "6px", border: "none", cursor: "pointer" }}>+ NHẬP LẺ</button>}
              </div>
              
              {showInputForm && role === 'admin' && <form onSubmit={handleAddProduct} style={{ background: "#fff7ed", padding: "15px", borderRadius: "8px", border: "1px solid #fdba74", marginBottom: "15px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">MÃ SẢN PHẨM</span><input placeholder="VD: SP001" value={newCode} onChange={e => setNewCode(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }} /></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">TÊN HÀNG HÓA</span><input placeholder="VD: Bia Tiger" value={newName} onChange={e => setNewName(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }} /></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">PHÂN LOẠI</span><input list="category-list" placeholder="Chọn..." value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }} /></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">GIÁ VỐN (Đ)</span><input type="number" value={newImportPrice} onChange={e => setNewImportPrice(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }} /></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">GIÁ BÁN (Đ)</span><input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 0.8fr 80px", gap: "10px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label-red">GIÁ KHUYẾN MÃI</span><input type="number" value={newPromoPrice} onChange={e => setNewPromoPrice(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ef4444" }} /></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">HẠN SỬ DỤNG</span><input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }} /></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label-green">ĐIỀU KIỆN & QUÀ TẶNG</span><div style={{ display: "flex", gap: "4px" }}><input type="number" placeholder="Từ..." value={newGiftCondition} onChange={e => setNewGiftCondition(e.target.value)} style={{ width: "45px", padding: "8px", borderRadius: "4px", border: "1px solid #10b981" }} /><input type="text" placeholder="Tên quà..." value={newGiftInfo} onChange={e => setNewGiftInfo(e.target.value)} style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #10b981" }} /></div></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span className="input-label">SỐ LƯỢNG NHẬP</span><input type="number" value={newStock} onChange={e => setNewStock(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }} /></div>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}><button type="submit" disabled={loading} style={{ padding: "8px", height: "35px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}>LƯU</button></div>
                </div>
              </form>}

              <div style={{ display: "flex", gap: "8px", marginBottom: "15px", overflowX: "auto" }}>
                {categories.map(c => <button key={c} onClick={() => setSelectedCategory(c)} className={`tab-btn ${selectedCategory === c ? 'active' : ''}`}>{c}</button>)}
              </div>

              <div style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ fontSize: "10px", borderBottom: "2px solid #fed7aa", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
                      <th style={{ textAlign: "left", padding: "10px 4px" }}>SẢN PHẨM</th>
                      <th style={{ textAlign: "center", padding: "10px 4px" }}>TỒN</th>
                      {role === 'admin' && <th style={{ textAlign: "center", padding: "10px 4px" }}>GIÁ VỐN</th>}
                      <th style={{ textAlign: "center", padding: "10px 4px" }}>GIÁ BÁN</th>
                      <th style={{ textAlign: "center", padding: "10px 4px" }}>HSD</th>
                      <th style={{ textAlign: "right", padding: "10px 4px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAndFilteredProducts.map(p => {
                      const isP = p.promo_price > 0; const g = parseGift(p.gift_info);
                      return (
                        <tr key={p.id} style={{ borderBottom: "1px solid #fed7aa" }}>
                          <td style={{ padding: "12px 4px" }}>
                            <b>{cleanName(p.name)}</b>
                            <div style={{ fontSize: "10px", color: "#94a3b8" }}>{p.product_code} • {p.category}</div>
                            {g.text && <div style={{ fontSize: "10px", color: "#059669" }}>🎁 Tặng: {g.text} (Mua ≥{g.cond})</div>}
                          </td>
                          <td style={{ textAlign: "center" }}><b>{p.stock}</b></td>
                          {role === 'admin' && <td style={{ textAlign: "center", color: "#64748b" }}>{p.import_price?.toLocaleString()}</td>}
                          <td style={{ textAlign: "center" }}>
                            <div style={{ textDecoration: isP ? "line-through" : "none", fontSize: isP ? "11px" : "14px" }}>{p.sale_price.toLocaleString()}</div>
                            {isP && <div style={{ color: "#ef4444", fontWeight: "900" }}>🔥 {p.promo_price.toLocaleString()}</div>}
                          </td>
                          <td style={{ textAlign: "center", fontSize: "11px" }}>{p.expiry_date ? new Date(p.expiry_date).toLocaleDateString('vi-VN') : "---"}</td>
                          <td style={{ textAlign: "right" }}><button className="add-to-cart-btn" onClick={() => handleSelectSuggest(p)}>+ GIỎ</button></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="glass" style={{ padding: "15px", flex: 1.5, display: "flex", flexDirection: "column" }}>
                <h3 style={{ color: "#ef4444", margin: 0 }}>🛒 GIỎ HÀNG ({cart.reduce((s, i) => s + i.qty, 0)})</h3>
                {custName && <div style={{ color: "#059669", fontWeight: "bold", fontSize: "11px" }}>👤 VIP: {custName} <span style={{cursor:"pointer",color:"red"}} onClick={()=>{setCustName("");setCustPhone("");}}>✖</span></div>}
                {cartTotalAmountDisplay > 0 && <div style={{ background: "#fef2f2", padding: "12px", borderRadius: "8px", marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{ fontSize: "24px", fontWeight: "900", color: "#ef4444" }}>{cartTotalAmountDisplay.toLocaleString()}đ</div></div>
                  <button onClick={() => setIsCheckoutOpen(true)} style={{ padding: "10px 20px", background: "#ef4444", color: "#fff", borderRadius: "8px", fontWeight: "bold", border:"none", cursor:"pointer" }}>THANH TOÁN</button>
                </div>}
                <div style={{ flex: 1, overflowY: "auto", marginTop: "10px" }}>
                  {cart.map((item, idx) => {
                    const g = parseGift(item.product.gift_info), gQ = g.cond > 0 ? Math.floor(item.qty / g.cond) : 0;
                    return (
                      <div key={idx} style={{ padding: "8px 0", borderBottom: "1px dashed #fed7aa", fontSize: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <b>{cleanName(item.product.name)}</b>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <button onClick={() => adjustCartQty(item.product.id, -1)} style={{ cursor: "pointer", border: "1px solid #ccc", background: "#fff" }}>-</button>
                            <input className="qty-input" value={item.qty} readOnly />
                            <button onClick={() => adjustCartQty(item.product.id, 1)} style={{ cursor: "pointer", border: "1px solid #ccc", background: "#fff" }}>+</button>
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                          <span>{g.text && gQ > 0 && <span style={{ color: "#10b981" }}>+ 🎁 {gQ} x {g.text}</span>}</span>
                          <b>{item.total.toLocaleString()}đ</b>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="glass" style={{ padding: "15px", height: "35vh", display: "flex", flexDirection: "column" }}>
                <input placeholder="Tìm giao dịch..." value={logSearchTerm} onChange={e => setLogSearchTerm(e.target.value)} style={{ padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", outline: "none" }} />
                <div style={{ flex: 1, overflowY: "auto", marginTop: "10px" }}>
                  {Object.keys(groupedHistory).map(d => (
                    <div key={d}>
                      <div style={{ background: "#ffedd5", padding: "4px 8px", fontSize: "11px", fontWeight: "bold" }}>{d}</div>
                      {groupedHistory[d].map((log: any) => (
                        <div key={log.id} style={{ fontSize: "11px", padding: "4px 0", borderBottom: "1px dashed #eee" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span><b>[{log.type}]</b> {cleanName(log.name)} x{log.qty}</span>
                            <b>{Number(log.total).toLocaleString()}</b>
                          </div>
                          <div style={{ color: "#94a3b8" }}>{log.customer} - {log.t}</div>
                        </div>
                      ))}
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

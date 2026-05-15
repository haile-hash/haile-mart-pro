import React, { useEffect, useState, useMemo } from "react";
// @ts-ignore
import { supabase } from "./supabaseClient";

export default function App() {
  const VAT_RATE = 0.1; 
  const EMAILJS_SERVICE_ID = "service_7ie990l"; const EMAILJS_TEMPLATE_ID = "template_t91erhg"; const EMAILJS_TEMPLATE_VIP_ID = "template_m1j9i7k"; const EMAILJS_PUBLIC_KEY = "5ric0kxuwNPlUleAv";

  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("mart_logged_in") === "true");
  const [role, setRole] = useState(() => localStorage.getItem("mart_role") || "staff");
  const [shift, setShift] = useState(() => localStorage.getItem("mart_shift") || "Ca Sáng");
  const [authUsername, setAuthUsername] = useState(""); const [authPassword, setAuthPassword] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  const [adminPass, setAdminPass] = useState(() => localStorage.getItem("mart_admin_pass") || "haile88");
  const [staffPass, setStaffPass] = useState(() => localStorage.getItem("mart_staff_pass") || "123");
  const [bankBin, setBankBin] = useState(() => localStorage.getItem("mart_bank_bin") || "970422");
  const [bankAcc, setBankAcc] = useState(() => localStorage.getItem("mart_bank_acc") || "0680124181004");
  const [bankNameStr, setBankNameStr] = useState(() => localStorage.getItem("mart_bank_name") || "LE HONG HAI");

  const [showSettings, setShowSettings] = useState(false);
  const [newAdminPass, setNewAdminPass] = useState(""); const [newStaffPass, setNewStaffPass] = useState("");
  const [newBankBin, setNewBankBin] = useState(""); const [newBankAcc, setNewBankAcc] = useState(""); const [newBankNameStr, setNewBankNameStr] = useState("");

  const [products, setProducts] = useState<any[]>([]); const [searchTerm, setSearchTerm] = useState(""); const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [loading, setLoading] = useState(false); const [showInputForm, setShowInputForm] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [openFilter, setOpenFilter] = useState<string | null>(null); const [filters, setFilters] = useState<Record<string, any[]>>({});
  const [showSuggestions, setShowSuggestions] = useState(false); const [showMainMenu, setShowMainMenu] = useState(false); 

  const [showDebtModal, setShowDebtModal] = useState(false); const [showStatsModal, setShowStatsModal] = useState(false); const [showCustomerModal, setShowCustomerModal] = useState(false); 
  const [showHandoverModal, setShowHandoverModal] = useState(false); const [showAuditModal, setShowAuditModal] = useState(false); const [showHoldModal, setShowHoldModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false); const [showSupplierModal, setShowSupplierModal] = useState(false); const [showMarketingModal, setShowMarketingModal] = useState(false);
  
  const [scannerMode, setScannerMode] = useState<'product' | 'voucher' | 'customer' | null>(null); const [scannedCodeObj, setScannedCodeObj] = useState<any>(null); const [scanMessage, setScanMessage] = useState<{text: string, type: 'success'|'error'} | null>(null);
  const [printBarcodeProduct, setPrintBarcodeProduct] = useState<any>(null); const [printCustomer, setPrintCustomer] = useState<any>(null); const [barcodeCount, setBarcodeCount] = useState<number>(30); const [printMode, setPrintMode] = useState<'receipt' | 'barcode' | 'customer_card' | null>(null);

  const [newCode, setNewCode] = useState(""); const [newName, setNewName] = useState(""); const [newImportPrice, setNewImportPrice] = useState(""); const [newPrice, setNewPrice] = useState(""); const [newPromoPrice, setNewPromoPrice] = useState(""); const [newGiftCondition, setNewGiftCondition] = useState("1"); const [newGiftInfo, setNewGiftInfo] = useState(""); const [newStock, setNewStock] = useState(""); const [newExpiry, setNewExpiry] = useState(""); const [newCategory, setNewCategory] = useState("Đồ uống"); 
  const [expName, setExpName] = useState(""); const [expAmount, setExpAmount] = useState(""); const [supName, setSupName] = useState(""); const [supPhone, setSupPhone] = useState(""); const [supItem, setSupItem] = useState("");
  const [marketingTier, setMarketingTier] = useState("Tất cả"); const [marketingMsg, setMarketingMsg] = useState("");
  const [cart, setCart] = useState<any[]>([]); const [barcodeInput, setBarcodeInput] = useState("");

  const [customers, setCustomers] = useState<any>(() => { const saved = localStorage.getItem("mart_customers"); return saved ? JSON.parse(saved) : {}; });
  const [heldOrders, setHeldOrders] = useState<any[]>(() => { const saved = localStorage.getItem("mart_held_orders"); return saved ? JSON.parse(saved) : []; });
  const [auditLogs, setAuditLogs] = useState<any[]>(() => { const saved = localStorage.getItem("mart_audit"); return saved ? JSON.parse(saved) : []; });
  const [expenses, setExpenses] = useState<any[]>(() => { const saved = localStorage.getItem("mart_expenses"); return saved ? JSON.parse(saved) : []; });
  const [suppliers, setSuppliers] = useState<any[]>(() => { const saved = localStorage.getItem("mart_suppliers"); return saved ? JSON.parse(saved) : []; });

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false); const [checkoutStep, setCheckoutStep] = useState(1); 
  const [customerInput, setCustomerInput] = useState(""); const [custPhone, setCustPhone] = useState(""); const [custName, setCustName] = useState("");
  const [useWallet, setUseWallet] = useState(false); const [voucherInput, setVoucherInput] = useState(""); const [appliedVoucherAmount, setAppliedVoucherAmount] = useState<number>(0);
  const [customerGiven, setCustomerGiven] = useState<number | "">(""); const [lastOrder, setLastOrder] = useState<any>(null);
  const [history, setHistory] = useState<any[]>(() => { const saved = localStorage.getItem("mart_history"); return saved ? JSON.parse(saved) : []; });
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [logSearchTerm, setLogSearchTerm] = useState(""); const [logTypeFilter, setLogTypeFilter] = useState("Tất cả");

  // ================= CÁC HÀM LÕI & HANDLERS =================
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault(); const u = authUsername.trim().toLowerCase(); const p = authPassword.trim();
    if (u === "admin" && p === "khoiphuc88") { setAdminPass("haile88"); localStorage.removeItem("mart_admin_pass"); setStaffPass("123"); localStorage.removeItem("mart_staff_pass"); setAuthPassword(""); alert("✅ Khôi phục mật khẩu mặc định!\n- Admin: haile88\n- Nhân viên: 123"); return; }
    if (u === "admin" && p === adminPass) { setIsLoggedIn(true); setRole("admin"); localStorage.setItem("mart_shift", shift); localStorage.setItem("mart_logged_in", "true"); localStorage.setItem("mart_role", "admin"); logAudit("ĐĂNG NHẬP", "Mở ca thành công"); } 
    else if (u === "nhanvien" && p === staffPass) { setIsLoggedIn(true); setRole("staff"); localStorage.setItem("mart_shift", shift); localStorage.setItem("mart_logged_in", "true"); localStorage.setItem("mart_role", "staff"); logAudit("ĐĂNG NHẬP", "Mở ca thành công"); } 
    else { alert("❌ Sai tài khoản hoặc mật khẩu!"); }
  };

  const handleLogoutClick = () => setShowHandoverModal(true);
  const confirmHandover = () => { logAudit("CHỐT CA", `Bàn giao ca thành công.`); setIsLoggedIn(false); setShowHandoverModal(false); localStorage.removeItem("mart_logged_in"); localStorage.removeItem("mart_role"); };

  const handleEditPhone = (oldPhone: string) => {
      const newPhone = window.prompt("Nhập số điện thoại mới cho khách hàng:", oldPhone);
      if (newPhone && newPhone.trim() !== "" && newPhone !== oldPhone) {
          if (customers[newPhone]) return alert("❌ SĐT này đã tồn tại trong hệ thống!");
          setCustomers((prev: any) => { const updated = { ...prev }; updated[newPhone] = { ...updated[oldPhone] }; delete updated[oldPhone]; return updated; });
          setHistory((prev: any) => prev.map((h: any) => { if (h.customer && h.customer.includes(oldPhone)) { return { ...h, customer: h.customer.replace(oldPhone, newPhone) }; } return h; }));
          logAudit("SỬA SĐT KHÁCH", `Đổi từ ${oldPhone} sang ${newPhone}`); alert("✅ Cập nhật thành công!");
      }
  };

  const addSupplier = () => { if(!supName || !supPhone) return alert("Nhập đủ Tên và SĐT"); setSuppliers(prev => [{id: Date.now(), name: supName, phone: supPhone, item: supItem}, ...prev]); setSupName(""); setSupPhone(""); setSupItem(""); alert("✅ Đã thêm NCC!"); };
  const deleteSupplier = (id: any) => { setSuppliers(prev => prev.filter(s => s.id !== id)); };
  const addExpense = () => { if(!expName || !expAmount) return alert("Nhập đủ Tên và Số tiền"); setExpenses(prev => [{id: Date.now(), date: new Date().toLocaleDateString('vi-VN'), name: expName, amount: Number(expAmount)}, ...prev]); setExpName(""); setExpAmount(""); alert("✅ Đã lưu chi phí!"); };
  const deleteExpense = (id: any) => { setExpenses(prev => prev.filter(e => e.id !== id)); };

  const sendMarketingEmails = async () => {
      if(!marketingMsg) return alert("Vui lòng nhập nội dung!"); if(!window.confirm("Gửi Email marketing hàng loạt?")) return;
      setLoading(true);
      const targetCustomers = Object.keys(customers).filter(phone => { const c = customers[phone]; if(!c.email) return false; if(marketingTier === "Tất cả") return true; return getCustomerTier(c.totalSpent).name.includes(marketingTier); });
      if(targetCustomers.length === 0) { setLoading(false); return alert("Không có khách hàng phù hợp!"); }
      let successCount = 0;
      for (const phone of targetCustomers) { const c = customers[phone]; try { await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_VIP_ID, { to_email: c.email, order_id: "THÔNG BÁO", time: new Date().toLocaleString('vi-VN'), items_list: `💌 Hải Lê Mart:\n\n${marketingMsg}`, total_amount: "Quà Tặng", payment_method: "Khách VIP", change_amount: "0đ", barcode_url: "" }); successCount++; } catch(e) {} }
      setLoading(false); setShowMarketingModal(false); alert(`✅ Đã gửi ${successCount} email!`);
  };

  const saveSettings = () => { if(!newAdminPass || !newStaffPass || !newBankBin || !newBankAcc || !newBankNameStr) return alert("Điền đủ thông tin!"); setAdminPass(newAdminPass); localStorage.setItem("mart_admin_pass", newAdminPass); setStaffPass(newStaffPass); localStorage.setItem("mart_staff_pass", newStaffPass); setBankBin(newBankBin); localStorage.setItem("mart_bank_bin", newBankBin); setBankAcc(newBankAcc); localStorage.setItem("mart_bank_acc", newBankAcc); setBankNameStr(newBankNameStr); localStorage.setItem("mart_bank_name", newBankNameStr); logAudit("CÀI ĐẶT", "Cập nhật Mật khẩu/QR"); alert("✅ Lưu thành công!"); setShowSettings(false); };
  const handleHoldOrder = () => { if (cart.length === 0) return; setHeldOrders(prev => [...prev, { id: Date.now(), time: new Date().toLocaleTimeString('vi-VN'), cart: [...cart] }]); logAudit("LƯU TẠM", `Lưu giỏ ${cart.length} món`); setCart([]); setCustPhone(""); setCustName(""); setCustomerInput(""); };
  const restoreOrder = (order: any) => { if (cart.length > 0) return alert("Thanh toán giỏ hiện tại trước!"); setCart(order.cart); setHeldOrders(prev => prev.filter(o => o.id !== order.id)); setShowHoldModal(false); };
  const deleteHeldOrder = (id: any) => { setHeldOrders(prev => prev.filter(o => o.id !== id)); logAudit("XÓA ĐƠN TẠM", `Xóa đơn lưu tạm`); };

  const handleSelectSuggest = (p_input: any) => {
    const p = getOldestAvailableBatch(p_input); if (p.stock <= 0) { playSound('error'); return alert("Đã hết hàng!"); }
    if (p.id !== p_input.id) setScanMessage({ text: `⚡ Xuất Lô cũ`, type: 'success' }); else setScanMessage({ text: `✅ Thêm: ${cleanName(p.name)}`, type: 'success' });
    const price = getActualPrice(p);
    setCart(prev => {
        const exist = prev.find(item => item.product.id === p.id);
        if (exist) { const newQty = exist.qty + 1; if (newQty > p.stock) { playSound('error'); return prev; } playSound('success'); return prev.map(i => i.product.id === p.id ? { ...i, qty: newQty, total: Math.round(newQty*price*(1+VAT_RATE)), profit: Math.round(newQty*(price - (p.import_price||0))) } : i); } 
        else { playSound('success'); return [...prev, { product: p, qty: 1, total: Math.round(price*(1+VAT_RATE)), profit: Math.round(price - (p.import_price||0)) }]; }
    });
    setBarcodeInput(""); setShowSuggestions(false); setTimeout(() => setScanMessage(null), 2000);
  };

  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); const p = findProductByCode(barcodeInput);
      if (p) handleSelectSuggest(p);
      else { 
          const matchedPhone = Object.keys(customers).find(phone => phone === barcodeInput.trim() || customers[phone].cardCode === barcodeInput.trim());
          if (matchedPhone) { playSound('success'); setCustomerInput(customers[matchedPhone].cardCode || matchedPhone); setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); setBarcodeInput(""); } 
          else { playSound('error'); alert("Mã sai / không có!"); }
      }
    }
  };

  const addToCart = (p_input: any) => { handleSelectSuggest(p_input); };
  const adjustCartQty = (productId: any, delta: number) => {
    let exceedStock = false;
    setCart(prev => {
      const updated = prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.qty + delta; if (newQty > item.product.stock) { exceedStock = true; return item; }
          const price = getActualPrice(item.product); return { ...item, qty: newQty, total: Math.round(newQty*price*(1+VAT_RATE)), profit: Math.round(newQty*(price - (item.product.import_price||0))) };
        } return item;
      });
      return updated.filter(item => item.qty > 0);
    });
    if (exceedStock) playSound('error'); else if (delta > 0) playSound('success');
  };

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
      if (VOUCHERS[code]) { setAppliedVoucherAmount(VOUCHERS[code]); playSound('success'); } else if (!isNaN(Number(code)) && Number(code) > 0) { setAppliedVoucherAmount(Number(code)); playSound('success'); } else { playSound('error'); alert("Mã Voucher lỗi!"); setAppliedVoucherAmount(0); }
    }
  };

  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; setCustomerInput(val); const matchedPhone = Object.keys(customers).find(phone => phone === val.trim() || customers[phone].cardCode === val.trim());
    if (matchedPhone) { setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); setUseWallet(false); } else { setCustPhone(val); setCustName(""); setUseWallet(false); }
  };

  const handleNextToQR = () => { if (cart.length === 0) return alert("Giỏ hàng trống!"); if (custPhone && !customers[custPhone] && !custName) return alert("Nhập Tên khách mới!"); setCheckoutStep(2); };

  const confirmCheckout = async (payMethod: 'TIỀN MẶT' | 'CHUYỂN KHOẢN' | 'GHI NỢ') => {
    if (cart.some(i => !i.qty || i.qty <= 0)) { playSound('error'); return alert("Lỗi số lượng!"); }
    if (payMethod === 'GHI NỢ' && !custPhone) return alert("Ghi nợ bắt buộc có SĐT khách!");
    setLoading(true); let logs: any[] = [];
    const subTotal = Math.round(cart.reduce((s, i) => s + (i.qty * getActualPrice(i.product)), 0)); const vatTotal = Math.round(subTotal * VAT_RATE); const baseTotal = subTotal + vatTotal;
    const totalAfterVoucher = Math.max(0, baseTotal - appliedVoucherAmount);
    
    const tier = getCustomerTier(customers[custPhone]?.totalSpent || 0); const tierDiscountAmount = custPhone ? Math.round((cartTotalAmountDisplay) * tier.discountRate) : 0;
    const amountAfterTierAndVoucher = Math.max(0, totalAfterVoucher - tierDiscountAmount);
    const walletUsedAmount = useWallet && payMethod !== 'GHI NỢ' ? Math.round(Math.min(customers[custPhone]?.wallet || 0, amountAfterTierAndVoucher)) : 0; 
    
    const finalTotal = amountAfterTierAndVoucher - walletUsedAmount; const totalDiscount = appliedVoucherAmount + walletUsedAmount + tierDiscountAmount; 
    const earned = payMethod === 'GHI NỢ' ? 0 : Math.round(finalTotal * 0.02);

    for (const item of cart) {
      await supabase.from("products").update({ stock: item.product.stock - item.qty }).eq("id", item.product.id);
      logs.push({ id: Date.now() + Math.random(), shift: shift, type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", name: item.product.name + (item.product.isHappyHour ? ' [Giờ Vàng]' : ''), qty: item.qty, total: Math.round(item.total), profit: Math.round(item.profit), customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: item.product.id, refunded_qty: 0, paymentMethod: payMethod });
    }
    if (totalDiscount > 0) { logs.push({ id: Date.now() + Math.random(), shift: shift, type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", name: "Giảm giá/Ví/VIP", qty: 1, total: -totalDiscount, profit: -totalDiscount, customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: 'DISCOUNT', refunded_qty: 0, paymentMethod: payMethod }); }
    
    if (custPhone) { setCustomers((prev: any) => ({ ...prev, [custPhone]: { name: custName, wallet: payMethod === 'GHI NỢ' ? (prev[custPhone]?.wallet || 0) : Math.round((prev[custPhone]?.wallet || 0) - walletUsedAmount + earned), debt: (prev[custPhone]?.debt || 0) + (payMethod === 'GHI NỢ' ? finalTotal : 0), totalSpent: (prev[custPhone]?.totalSpent || 0) + (payMethod !== 'GHI NỢ' ? finalTotal : 0), email: prev[custPhone]?.email || "", cardCode: prev[custPhone]?.cardCode || "" } })); }

    setHistory(prev => [...logs, ...prev]); setLastOrder({ orderId: "HD" + Date.now().toString().slice(-6), shift: shift, cart: [...cart], subTotal, vatTotal, finalTotal: payMethod === 'GHI NỢ' ? 0 : finalTotal, debtAmount: payMethod === 'GHI NỢ' ? finalTotal : 0, discount: totalDiscount, tierDiscountAmount: tierDiscountAmount, earnedWallet: custPhone ? earned : 0, custName: custPhone ? custName : null, custPhone: custPhone ? custPhone : null, time: new Date().toLocaleString('vi-VN'), paymentMethod: payMethod, customerGiven: payMethod === 'TIỀN MẶT' ? Number(customerGiven) : 0 });
    setCheckoutStep(3); fetchProducts(); setLoading(false);
  };

  const handleRefund = async (logId: any) => {
    const logIndex = history.findIndex(l => l.id === logId); if(logIndex === -1) return; const log = history[logIndex];
    if(log.type !== 'BÁN') return alert("Chỉ hoàn đơn BÁN!");
    const maxRefund = log.qty - (log.refunded_qty || 0); if(maxRefund <= 0) return alert("Đã hoàn toàn bộ!");
    const qStr = window.prompt(`Sản phẩm: ${cleanName(log.name)}\nĐã mua: ${log.qty} | Có thể hoàn: ${maxRefund}\nNhập số lượng hoàn trả:`, maxRefund.toString());
    if (!qStr) return; const refundQty = parseInt(qStr);
    if (isNaN(refundQty) || refundQty <= 0 || refundQty > maxRefund) { playSound('error'); return alert("Số lượng sai!"); }
    if(!window.confirm(`Xác nhận hoàn ${refundQty} x ${cleanName(log.name)}?`)) return;

    const unitTotal = log.total / log.qty; const unitProfit = log.profit / log.qty; const refundTotal = Math.round(unitTotal * refundQty); const refundProfit = Math.round(unitProfit * refundQty);
    const p = products.find(x => x.id === log.product_id); if (p) await supabase.from("products").update({ stock: p.stock + refundQty }).eq("id", p.id);

    let refundedToWallet = false;
    if (log.customer && log.customer !== "Khách lẻ") {
       const phoneMatch = log.customer.match(/\((.*?)\)/);
       if (phoneMatch && phoneMatch[1]) {
           const phone = phoneMatch[1];
           if (customers[phone] && window.confirm(`Hoàn ${refundTotal.toLocaleString()}đ bằng TIỀN MẶT hay VÍ ĐIỂM?\n- OK: VÍ ĐIỂM\n- Cancel: TIỀN MẶT`)) {
               setCustomers((prev: any) => ({ ...prev, [phone]: { ...prev[phone], wallet: (prev[phone].wallet || 0) + refundTotal } })); logAudit("HOÀN VÍ", `Hoàn ${refundTotal.toLocaleString()}đ cho ${customers[phone].name}`); refundedToWallet = true;
           }
       }
    }
    const updatedHistory = [...history]; updatedHistory[logIndex].refunded_qty = (log.refunded_qty || 0) + refundQty;
    updatedHistory.unshift({ id: Date.now(), shift: shift, type: "TRẢ HÀNG", name: log.name + (refundedToWallet ? " (Ví)" : " (TM)"), qty: refundQty, total: -refundTotal, profit: -refundProfit, customer: log.customer, paymentMethod: refundedToWallet ? 'VÍ ĐIỂM' : 'TIỀN MẶT' });
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
    setLoading(true); let itemsTable = ""; lastOrder.cart.forEach((item: any) => { itemsTable += `- ${cleanName(item.product.name)} x ${item.qty} = ${Math.round(item.qty * Math.round(getActualPrice(item.product)) * (1+VAT_RATE)).toLocaleString()}đ\n`; });
    const emailData = { to_email: email, order_id: lastOrder.orderId, time: lastOrder.time, items_list: itemsTable, total_amount: Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString() + "đ", payment_method: lastOrder.paymentMethod, change_amount: lastOrder.paymentMethod === 'TIỀN MẶT' ? Math.round(lastOrder.customerGiven - lastOrder.finalTotal).toLocaleString() + "đ" : "0đ" };
    try { await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailData); alert("🚀 Gửi hóa đơn thành công!"); } catch (error) { alert("❌ Lỗi gửi mail."); } setLoading(false);
  };

  const sendCardEmail = async (phone: string) => {
      const cust = customers[phone]; const email = cust.email || window.prompt(`Nhập Email cá nhân của ${cust.name}:`, ""); if (!email) return;
      if (!cust.email) setCustomers((prev:any) => ({...prev, [phone]: {...prev[phone], email}})); setLoading(true); const code = cust.cardCode || phone; const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(code)}&scale=2&height=10&includetext=true`;
      const emailData = { to_email: email, order_id: "THẺ THÀNH VIÊN", time: new Date().toLocaleString('vi-VN'), items_list: `💳 MÃ THẺ CỦA BẠN LÀ: ${code}\n(Vui lòng xuất trình Thẻ/Mã vạch bên dưới khi thanh toán)`, total_amount: "Ưu đãi Đặc Quyền", payment_method: "VIP Member", change_amount: "0đ", barcode_url: barcodeUrl };
      try { await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_VIP_ID, emailData); alert("🚀 Đã gửi Thẻ VIP điện tử!"); } catch (error) { alert("❌ Lỗi gửi mail."); } setLoading(false);
  };

  const printCustomerCard = (phone: string) => { setPrintCustomer({phone, ...customers[phone]}); setPrintMode('customer_card'); setTimeout(() => window.print(), 1000); };
  const shareToZalo = (phone: string) => {
      const cust = customers[phone]; const code = cust.cardCode || phone;
      navigator.clipboard.writeText(`Chào ${cust.name},\nCảm ơn bạn đã đồng hành cùng Hải Lê Mart!\n💳 Mã Thẻ VIP của bạn là: ${code}`).then(() => { alert(`💡 MẸO GỬI ẢNH ZALO:\n1. Bấm [🖨️ In Thẻ]\n2. Bấm (Alt + Z) cắt thẻ\n3. Dán (Ctrl + V) gửi qua Zalo\n\n✅ Mở Zalo...`); window.open(`https://zalo.me/${phone}`, '_blank'); }).catch(() => { window.open(`https://zalo.me/${phone}`, '_blank'); });
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
            if (added > 0) setHistory(prev => [{ id: Date.now(), shift: shift, type: "NHẬP", name: newName, qty: added, total: 0 }, ...prev]); logAudit("NHẬP ĐÈ CŨ", `${newName} (Mã: ${baseCode}) - SL: ${added}`); alert(`Đã nhập hàng!${priceUpdatedMsg}`);
        } else {
            if (exist.import_price !== impPrice || (exist.expiry_date || "") !== (newExpiry || "")) {
                const batchCode = `${baseCode}-${Date.now().toString().slice(-4)}`; const batchName = `${newName} [Lô ${newExpiry ? new Date(newExpiry).toLocaleDateString('vi-VN') : 'Mới'}]`;
                if(window.confirm(`Hàng cũ còn tồn. Bạn nhập Giá/HSD khác -> LÔ MỚI (${batchCode}).${priceUpdatedMsg}\nĐồng ý?`)) {
                    await supabase.from("products").insert([{ product_code: batchCode, name: batchName, category: newCategory || "Khác", import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null }]);
                    if (added > 0) setHistory(prev => [{ id: Date.now(), shift: shift, type: "NHẬP", name: batchName, qty: added, total: 0 }, ...prev]); logAudit("TÁCH LÔ", `${batchName} - SL: ${added}`); if (!priceUpdatedMsg) alert(`Đã tạo lô mới!`); 
                } else { setLoading(false); return; }
            } else {
                await supabase.from("products").update({ stock: exist.stock + added, created_at: new Date().toISOString() }).eq("id", exist.id);
                if (added > 0) setHistory(prev => [{ id: Date.now(), shift: shift, type: "NHẬP", name: newName, qty: added, total: 0 }, ...prev]); logAudit("CỘNG DỒN", `${newName} - +SL: ${added}`); alert(`Cộng dồn thành công!${priceUpdatedMsg}`);
            }
        }
    } else {
        await supabase.from("products").insert([{ product_code: baseCode, name: newName, category: newCategory || "Khác", import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null }]);
        if (added > 0) setHistory(prev => [{ id: Date.now(), shift: shift, type: "NHẬP", name: newName, qty: added, total: 0 }, ...prev]); logAudit("NHẬP MỚI", `${newName} - SL: ${added}`); if(priceUpdatedMsg) alert(`Nhập hàng thành công!${priceUpdatedMsg}`);
    }
    setNewCode(""); setNewName(""); setNewCategory("Đồ uống"); setNewImportPrice(""); setNewPrice(""); setNewPromoPrice(""); setNewGiftCondition("1"); setNewGiftInfo(""); setNewStock(""); setNewExpiry(""); fetchProducts(); setLoading(false); setShowInputForm(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader();
    reader.onload = async (event) => {
      setLoading(true);
      try {
        const text = event.target?.result as string; const lines = text.split('\n').filter(line => line.trim() !== ''); if (lines.length <= 1) { alert("File rỗng!"); setLoading(false); return; }
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
  const handleEdit = async (id: any, field: string, old: any, isText: boolean = false) => { let label = field; if (field === 'category') label = 'Danh mục'; if (field === 'sale_price') label = 'Giá bán'; if (field === 'promo_price') label = 'Giá KM'; if (field === 'gift_info') label = 'Quà tặng'; if (field === 'expiry_date') label = 'HSD'; const val = window.prompt(`Sửa ${label}:`, old || ""); if (val !== null) { let updateData: any = isText ? val : (parseInt(val) || 0); if (field === 'gift_info' && val.trim() === '') updateData = null; await supabase.from("products").update({ [field]: updateData }).eq("id", id); logAudit("SỬA", `ID ${id}, ${label} -> ${val}`); fetchProducts(); } };
  const handlePrintBarcode = (p: any) => { const q = window.prompt(`Số lượng tem in: ${cleanName(p.name)}`, "30"); if (q && parseInt(q) > 0) { setPrintBarcodeProduct(p); setBarcodeCount(parseInt(q)); setPrintMode('barcode'); setTimeout(() => window.print(), 1500); } };
  const downloadSampleCSV = () => { const csv = "\uFEFFMã SP,Tên SP,Danh Mục,Giá Nhập,Giá Bán,Giá KM,Quà Tặng,Số Lượng,Hạn Sử Dụng (YYYY-MM-DD)\nSP001,Mì Hảo Hảo,Đồ ăn liền,3000,5000,0,,100,2026-12-31\nSP002,Nước suối TH,Đồ uống,4000,6000,0,24;;;1 Ly Thủy Tinh,50,2026-06-15"; const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Mau_Nhap_Kho.csv`; link.click(); };
  const exportToCSV = () => { if (history.length === 0) return alert("Chưa có lịch sử!"); let csv = "\uFEFFGiờ,Ca Làm Việc,Loại,Hình thức,Khách,Sản phẩm,SL,Tổng(VAT),Lợi nhuận\n"; history.forEach(log => { csv += `${new Date(Math.floor(log.id)).toLocaleString('vi-VN')},${log.shift || ""},${log.type},${log.paymentMethod || ""},${log.customer || "Khách lẻ"},${log.name},${log.qty},${Math.round(log.total)},${Math.round(log.profit || 0)}\n`; }); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Bao_Cao.csv`; link.click(); };
  const exportAuditToCSV = () => { if (auditLogs.length === 0) return alert("Chưa có nhật ký!"); let csv = "\uFEFFThời gian,Người dùng,Ca,Hành động,Chi tiết\n"; auditLogs.forEach(log => { csv += `${log.time},${log.user},${log.shift},${log.action},"${(log.detail || "").replace(/"/g, '""')}"\n`; }); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Audit.csv`; link.click(); };
  const handleSendEmailReport = () => { const logs = history.filter(log => new Date(Math.floor(log.id)).toLocaleDateString('vi-VN') === todayStrStr); if (logs.length === 0) return alert("Chưa có giao dịch!"); let cash = 0, transfer = 0, prof = 0, sold = 0; logs.forEach(l => { if(l.type==='BÁN') sold += l.qty; if(l.type==='BÁN' || l.type==='THU NỢ' || l.type==='TRẢ HÀNG') { if (l.paymentMethod === 'CHUYỂN KHOẢN') transfer += l.total; else if (l.paymentMethod === 'TIỀN MẶT') cash += l.total; } prof += (l.profit||0); }); const sub = encodeURIComponent(`Báo Cáo - ${todayStrStr}`); const body = encodeURIComponent(`Báo cáo TỔNG:\n- Đã bán: ${sold} món\n- TIỀN MẶT: ${Math.round(cash).toLocaleString()}đ\n- CHUYỂN KHOẢN: ${Math.round(transfer).toLocaleString()}đ\n- Lợi nhuận: ${Math.round(prof).toLocaleString()}đ`); window.location.href = `mailto:lehonghaikt6@gmail.com?subject=${sub}&body=${body}`; };
  const requestSort = (key: string) => { if (sortConfig && sortConfig.key === key) { if (sortConfig.direction === 'asc') setSortConfig({ key, direction: 'desc' }); else setSortConfig(null); } else { setSortConfig({ key, direction: 'asc' }); } };
  const handleFilterCheck = (col: string, val: any) => { setFilters(prev => { const cur = prev[col] || []; if (cur.includes(val)) return { ...prev, [col]: cur.filter(v => v !== val) }; return { ...prev, [col]: [...cur, val] }; }); };
  const toggleDateGroup = (dateStr: string) => setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));

  // ================= 7. RENDER LÕI & EFFECTS =================
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
      const channel = supabase.channel("db_changes").on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchProducts()).subscribe();
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
      script.onload = () => { (window as any).emailjs.init(EMAILJS_PUBLIC_KEY); };
      document.head.appendChild(script);
      return () => { supabase.removeChannel(channel); };
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
         const script = document.createElement("script"); script.src = "https://unpkg.com/html5-qrcode"; script.onload = loadScanner; document.head.appendChild(script);
      } else loadScanner();
      return () => { if (scanner) scanner.clear().catch(()=>{}); };
    }
  }, [scannerMode]);

  useEffect(() => {
    if (scannedCodeObj) {
      if (scannerMode === 'product') {
          const p = findProductByCode(scannedCodeObj.code);
          if (p) handleSelectSuggest(p);
          else {
              const matchedPhone = Object.keys(customers).find(phone => phone === scannedCodeObj.code.trim() || customers[phone].cardCode === scannedCodeObj.code.trim());
              if (matchedPhone) { playSound('success'); setCustomerInput(customers[matchedPhone].cardCode || matchedPhone); setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); setScanMessage({ text: `✅ Đã chọn KH VIP: ${customers[matchedPhone].name}`, type: 'success' }); } 
              else { playSound('error'); setScanMessage({ text: `❌ Không tìm thấy mã`, type: 'error' }); }
              setTimeout(() => setScannerMode(null), 1500);
          }
      } 
      else if (scannerMode === 'voucher') {
          const code = scannedCodeObj.code.trim().toUpperCase(); const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 };
          if (VOUCHERS[code]) { setAppliedVoucherAmount(VOUCHERS[code]); setVoucherInput(code); playSound('success'); setScanMessage({ text: `✅ Đã áp dụng giảm ${VOUCHERS[code].toLocaleString()}đ`, type: 'success' }); } 
          else if (!isNaN(Number(code)) && Number(code) > 0) { setAppliedVoucherAmount(Number(code)); setVoucherInput(code); playSound('success'); setScanMessage({ text: `✅ Đã nhận mức giảm ${Number(code).toLocaleString()}đ`, type: 'success' }); } 
          else { playSound('error'); alert("Mã Voucher không hợp lệ!"); setAppliedVoucherAmount(0); }
          setTimeout(() => setScannerMode(null), 1000);
      }
      else if (scannerMode === 'customer') {
          const val = scannedCodeObj.code.trim(); setCustomerInput(val); const matchedPhone = Object.keys(customers).find(phone => phone === val || customers[phone].cardCode === val);
          if (matchedPhone) { setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); playSound('success'); setScanMessage({ text: `✅ Nhận diện VIP: ${customers[matchedPhone].name}`, type: 'success' }); } 
          else { setCustPhone(val); setCustName(""); playSound('success'); setScanMessage({ text: `✅ Đã quét mã (Khách mới)`, type: 'success' }); }
          setTimeout(() => setScannerMode(null), 1000);
      }
      setScannedCodeObj(null); setTimeout(() => setScanMessage(null), 1500); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannedCodeObj]);

  useEffect(() => { const handleAfterPrint = () => setPrintMode(null); window.addEventListener("afterprint", handleAfterPrint); return () => window.removeEventListener("afterprint", handleAfterPrint); }, []);

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

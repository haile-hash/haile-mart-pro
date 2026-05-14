import React, { useEffect, useState, useMemo } from "react";
// @ts-ignore
import { supabase } from "./supabaseClient";

export default function App() {
  const VAT_RATE = 0.1; 

  // ================= 1. CẤU HÌNH EMAIL TỰ ĐỘNG (THAY THẾ TẠI ĐÂY) =================
  const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";   // Thay mã Service ID của ông chủ
  const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID"; // Thay mã Template ID của ông chủ
  const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";   // Thay mã Public Key của ông chủ

  // ================= 2. STATES =================
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("mart_logged_in") === "true");
  const [role, setRole] = useState(() => localStorage.getItem("mart_role") || "staff");
  const [shift, setShift] = useState(() => localStorage.getItem("mart_shift") || "Ca Sáng");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [loading, setLoading] = useState(false);
  const [showInputForm, setShowInputForm] = useState(false);
  
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, any[]>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false); 
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  
  const [scannerMode, setScannerMode] = useState<'product' | 'voucher' | null>(null);
  const [scannedCodeObj, setScannedCodeObj] = useState<any>(null);
  const [scanMessage, setScanMessage] = useState<{text: string, type: 'success'|'error'} | null>(null);
  
  const [printBarcodeProduct, setPrintBarcodeProduct] = useState<any>(null);
  const [barcodeCount, setBarcodeCount] = useState<number>(30);
  const [printMode, setPrintMode] = useState<'receipt' | 'barcode' | null>(null);

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

  const [cart, setCart] = useState<any[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");

  const [customers, setCustomers] = useState<any>(() => {
    const saved = localStorage.getItem("mart_customers");
    return saved ? JSON.parse(saved) : {}; 
  });
  
  const [heldOrders, setHeldOrders] = useState<any[]>(() => {
    const saved = localStorage.getItem("mart_held_orders");
    return saved ? JSON.parse(saved) : [];
  });

  const [auditLogs, setAuditLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem("mart_audit");
    return saved ? JSON.parse(saved) : [];
  });

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); 
  const [custPhone, setCustPhone] = useState("");
  const [custName, setCustName] = useState("");
  const [useWallet, setUseWallet] = useState(false);
  const [voucherInput, setVoucherInput] = useState(""); 
  const [appliedVoucherAmount, setAppliedVoucherAmount] = useState<number>(0);
  const [customerGiven, setCustomerGiven] = useState<number | "">(""); 
  const [lastOrder, setLastOrder] = useState<any>(null);

  const [history, setHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem("mart_history");
    return saved ? JSON.parse(saved) : [];
  });

  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  // ================= 3. LOGIC HÀM LÕI (FIX LỖI THỨ TỰ) =================
  const cleanName = (name: string) => name ? name.split(' [Lô')[0] : '';

  const getActualPrice = (p: any) => {
    let price = (p.promo_price && p.promo_price > 0) ? p.promo_price : p.sale_price;
    const currentHour = new Date().getHours();
    if ((currentHour >= 20 || currentHour < 6) && (p.category === 'Đồ ăn liền' || p.category === 'Bánh Kẹo')) { price = price * 0.8; p.isHappyHour = true; } 
    else { p.isHappyHour = false; }
    return Math.round(price);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setProducts(data);
  };

  const findProductByCode = (code: string) => {
    const rawCode = code.trim();
    let matches = products.filter(prod => prod.product_code === rawCode || prod.product_code.startsWith(`${rawCode}-`));
    let available = matches.filter(p => p.stock > 0);
    if (available.length > 0) {
       available.sort((a,b) => {
           if(!a.expiry_date) return 1; if(!b.expiry_date) return -1;
           return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
       });
       return available[0];
    } 
    else if (matches.length > 0) return matches[0];
    return null;
  };

  const getOldestAvailableBatch = (p: any) => {
    const baseCode = p.product_code.split('-')[0];
    let availableMatches = products.filter(prod => (prod.product_code === baseCode || prod.product_code.startsWith(`${baseCode}-`)) && prod.stock > 0);
    if (availableMatches.length === 0) return p; 
    availableMatches.sort((a,b) => {
        if(!a.expiry_date) return 1; if(!b.expiry_date) return -1;
        return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
    });
    return availableMatches[0];
  };

  const handleSelectSuggest = (p_input: any) => {
    const p = getOldestAvailableBatch(p_input); 
    if (p.stock <= 0) { playSound('error'); return alert("Đã hết hàng trong kho!"); }
    if (p.id !== p_input.id) setScanMessage({ text: `⚡ Tự động xuất Lô cũ: ${p.expiry_date ? new Date(p.expiry_date).toLocaleDateString('vi-VN') : ''}`, type: 'success' });
    else setScanMessage({ text: `✅ Thêm: ${cleanName(p.name)}`, type: 'success' });

    const price = getActualPrice(p);
    setCart(prev => {
        const exist = prev.find(item => item.product.id === p.id);
        if (exist) {
            const newQty = exist.qty + 1;
            if (newQty > p.stock) { playSound('error'); setScanMessage({ text: `❌ Quá tồn kho lô này (${p.stock})`, type: 'error' }); return prev; }
            playSound('success'); 
            return prev.map(i => i.product.id === p.id ? { ...i, qty: newQty, total: Math.round(newQty*price*(1+VAT_RATE)), profit: Math.round(newQty*(price - (p.import_price||0))) } : i);
        } else {
            playSound('success'); 
            return [...prev, { product: p, qty: 1, total: Math.round(price*(1+VAT_RATE)), profit: Math.round(price - (p.import_price||0)) }];
        }
    });
    setBarcodeInput(""); setShowSuggestions(false); setTimeout(() => setScanMessage(null), 2000);
  };

  // ================= 4. EFFECTS =================
  useEffect(() => {
    if (isLoggedIn) fetchProducts();
    // Tự động tải thư viện EmailJS
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
    script.onload = () => { (window as any).emailjs.init(EMAILJS_PUBLIC_KEY); };
    document.head.appendChild(script);
  }, [isLoggedIn]);

  // ================= 5. COMPUTED DATA =================
  const currentShiftStats = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('vi-VN');
    const shiftLogs = history.filter(h => new Date(Math.floor(h.id)).toLocaleDateString('vi-VN') === todayStr && h.shift === shift);
    let cash = 0; let transfer = 0; let prof = 0;
    shiftLogs.forEach(h => {
        if (h.type === 'BÁN' || h.type === 'THU NỢ' || h.type === 'TRẢ HÀNG') {
            if (h.paymentMethod === 'CHUYỂN KHOẢN') transfer += h.total;
            else if (h.paymentMethod === 'TIỀN MẶT') cash += h.total;
        }
        prof += (h.profit || 0);
    });
    return { rev: cash + transfer, cash, transfer, prof };
  }, [history, shift]);

  const todayStats = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('vi-VN');
    const todayHistory = history.filter(h => new Date(Math.floor(h.id)).toLocaleDateString('vi-VN') === todayStr);
    let cash = 0; let transfer = 0; let prof = 0;
    todayHistory.forEach(h => {
        if (h.type === 'BÁN' || h.type === 'THU NỢ' || h.type === 'TRẢ HÀNG') {
            if (h.paymentMethod === 'CHUYỂN KHOẢN') transfer += h.total;
            else if (h.paymentMethod === 'TIỀN MẶT') cash += h.total;
        }
        prof += (h.profit || 0);
    });
    return { rev: cash + transfer, cash, transfer, prof };
  }, [history]);

  const topSelling = useMemo(() => {
    const sales: Record<string, number> = {};
    history.forEach(log => { if(log.type === 'BÁN' && log.product_id !== 'DISCOUNT') sales[log.name] = (sales[log.name]||0) + log.qty; });
    return Object.entries(sales).sort((a,b)=>b[1]-a[1]).slice(0,5);
  }, [history]);

  const groupedHistory = useMemo(() => {
    return history.reduce((groups: any, log: any) => {
      const date = new Date(Math.floor(log.id)).toLocaleDateString('vi-VN'); 
      if (!groups[date]) groups[date] = [];
      groups[date].push({ ...log, t: new Date(Math.floor(log.id)).toLocaleTimeString('vi-VN') });
      return groups;
    }, {});
  }, [history]);

  const totalValue = Math.round(products.reduce((sum, p) => sum + ((Number(p.import_price) || 0) * (Number(p.stock) || 0)), 0));
  const cartTotalAmount = cart.reduce((sum, item) => sum + item.total, 0);

  // ================= 6. HÀM GỬI EMAIL TỰ ĐỘNG KHÔNG CẦN MAILTO =================
  const sendReceiptEmail = async () => {
    if (!lastOrder) return;
    const email = window.prompt("Nhập Email khách hàng:");
    if (!email) return;

    setLoading(true);
    let itemsTable = "";
    lastOrder.cart.forEach((item: any) => {
      itemsTable += `${cleanName(item.product.name)} x ${item.qty} = ${Math.round(item.total).toLocaleString()}đ\n`;
    });

    const emailData = {
      to_email: email,
      order_id: lastOrder.orderId,
      time: lastOrder.time,
      items_list: itemsTable,
      total_amount: Math.round(lastOrder.finalTotal).toLocaleString() + "đ",
      payment_method: lastOrder.paymentMethod,
      change_amount: lastOrder.paymentMethod === 'TIỀN MẶT' ? Math.round(lastOrder.customerGiven - lastOrder.finalTotal).toLocaleString() + "đ" : "0đ"
    };

    try {
      await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailData);
      alert("🚀 Đã gửi hóa đơn điện tử tự động thành công!");
    } catch (error) {
      alert("❌ Lỗi gửi mail. Ông chủ kiểm tra lại Service ID & Template ID nhé.");
    }
    setLoading(false);
  };

  // ================= 7. PHẦN CÒN LẠI (GIỮ NGUYÊN LOGIC) =================
  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const p = findProductByCode(barcodeInput);
      if (p) handleSelectSuggest(p);
      else { playSound('error'); alert("Mã sai hoặc không tìm thấy!"); }
    }
  };

  const addToCart = (p_input: any) => {
    const p = getOldestAvailableBatch(p_input); 
    if (p.stock <= 0) { playSound('error'); return alert("Đã hết hàng trong kho!"); }
    if (p.id !== p_input.id) {
        setScanMessage({ text: `⚡ Tự động xuất Lô cũ: ${p.expiry_date ? new Date(p.expiry_date).toLocaleDateString('vi-VN') : ''}`, type: 'success' });
        setTimeout(() => setScanMessage(null), 2000);
    }
    const price = getActualPrice(p);
    setCart(prev => {
      const exist = prev.find(item => item.product.id === p.id);
      if (exist) {
        const newQty = exist.qty + 1;
        if (newQty > p.stock) { playSound('error'); alert(`Lô hàng này chỉ còn tối đa ${p.stock} sản phẩm.`); return prev; }
        playSound('success');
        return prev.map(i => i.product.id === p.id ? { ...i, qty: newQty, total: Math.round(newQty*price*(1+VAT_RATE)), profit: Math.round(newQty*(price - (p.import_price||0))) } : i);
      } else {
        playSound('success');
        return [...prev, { product: p, qty: 1, total: Math.round(price*(1+VAT_RATE)), profit: Math.round(price - (p.import_price||0)) }];
      }
    });
  };

  const confirmCheckout = async (payMethod: 'TIỀN MẶT' | 'CHUYỂN KHOẢN' | 'GHI NỢ') => {
    setLoading(true);
    let logs: any[] = [];
    const subTotal = Math.round(cart.reduce((s, i) => s + (i.qty * getActualPrice(i.product)), 0));
    const vatTotal = Math.round(subTotal * VAT_RATE);
    const baseTotal = subTotal + vatTotal;
    const vDiscount = appliedVoucherAmount || 0; 
    const totalAfterVoucher = Math.max(0, baseTotal - vDiscount);
    const wallet = customers[custPhone]?.wallet || 0;
    const walletDiscount = useWallet && payMethod !== 'GHI NỢ' ? Math.round(Math.min(wallet, totalAfterVoucher)) : 0; 
    const finalTotal = totalAfterVoucher - walletDiscount;
    const totalDiscount = vDiscount + walletDiscount; 
    const earned = payMethod === 'GHI NỢ' ? 0 : Math.round(finalTotal * 0.02);

    for (const item of cart) {
      await supabase.from("products").update({ stock: item.product.stock - item.qty }).eq("id", item.product.id);
      logs.push({ id: Date.now() + Math.random(), shift: shift, type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", name: item.product.name + (item.product.isHappyHour ? ' [Giờ Vàng]' : ''), qty: item.qty, total: Math.round(item.total), profit: Math.round(item.profit), customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: item.product.id, refunded_qty: 0, paymentMethod: payMethod });
    }
    if (totalDiscount > 0) logs.push({ id: Date.now() + Math.random(), shift: shift, type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", name: "Giảm giá Voucher/Ví", qty: 1, total: -totalDiscount, profit: -totalDiscount, customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: 'DISCOUNT', refunded_qty: 0, paymentMethod: payMethod });
    
    if (custPhone) {
      setCustomers((prev: any) => ({ ...prev, [custPhone]: { name: custName, wallet: payMethod === 'GHI NỢ' ? (prev[custPhone]?.wallet || 0) : Math.round((prev[custPhone]?.wallet || 0) - walletDiscount + earned), debt: (prev[custPhone]?.debt || 0) + (payMethod === 'GHI NỢ' ? finalTotal : 0) } }));
    }
    setHistory(prev => [...logs, ...prev]);
    setLastOrder({ orderId: "HD" + Date.now().toString().slice(-6), shift: shift, cart: [...cart], subTotal, vatTotal, finalTotal: payMethod === 'GHI NỢ' ? 0 : finalTotal, debtAmount: payMethod === 'GHI NỢ' ? finalTotal : 0, discount: totalDiscount, earnedWallet: custPhone ? earned : 0, custName: custPhone ? custName : null, custPhone: custPhone ? custPhone : null, time: new Date().toLocaleString('vi-VN'), paymentMethod: payMethod, customerGiven: payMethod === 'TIỀN MẶT' ? Number(customerGiven) : 0 });
    setCheckoutStep(3); fetchProducts(); setLoading(false);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const added = parseInt(newStock || "0"); const impPrice = parseInt(newImportPrice);
    const salePrice = parseInt(newPrice); const promo = parseInt(newPromoPrice) || 0;
    const finalGiftInfo = newGiftInfo.trim() !== "" ? `${newGiftCondition};;;${newGiftInfo}` : null;
    const baseCode = newCode.trim();
    const allVariants = products.filter(p => p.product_code === baseCode || p.product_code.startsWith(`${baseCode}-`));
    const exist = allVariants.find(p => p.product_code === baseCode); 

    if (allVariants.length > 0 && allVariants[0].sale_price !== salePrice) {
        await Promise.all(allVariants.map(v => supabase.from("products").update({ sale_price: salePrice, promo_price: promo }).eq("id", v.id)));
    }

    if (exist) {
        if (exist.stock <= 0) {
            await supabase.from("products").update({ name: newName, category: newCategory || "Khác", import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null, created_at: new Date().toISOString() }).eq("id", exist.id);
        } else if (exist.import_price !== impPrice || (exist.expiry_date || "") !== (newExpiry || "")) {
            await supabase.from("products").insert([{ product_code: `${baseCode}-${Date.now().toString().slice(-4)}`, name: `${newName} [Lô ${newExpiry ? new Date(newExpiry).toLocaleDateString('vi-VN') : 'Mới'}]`, category: newCategory || "Khác", import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null }]);
        } else {
            await supabase.from("products").update({ stock: exist.stock + added, created_at: new Date().toISOString() }).eq("id", exist.id);
        }
    } else {
        await supabase.from("products").insert([{ product_code: baseCode, name: newName, category: newCategory || "Khác", import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null }]);
    }
    setNewCode(""); setNewName(""); setNewStock(""); fetchProducts(); setLoading(false); setShowInputForm(false);
  };

  const handleEdit = async (id: any, field: string, old: any, isText: boolean = false) => {
    const val = window.prompt(`Sửa ${field}:`, old || "");
    if (val !== null) { await supabase.from("products").update({ [field]: isText ? val : (parseInt(val) || 0) }).eq("id", id); fetchProducts(); }
  };

  const handleDelete = async (id: any, name: any) => { if (window.confirm(`Xóa vĩnh viễn ${name}?`)) { await supabase.from("products").delete().eq("id", id); fetchProducts(); } };

  // ================= 8. RENDER LOGO ĐẲNG CẤP =================
  const HeaderLogo = () => (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{ backgroundColor: "#dc2626", padding: "8px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(220, 38, 38, 0.2)" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "900", letterSpacing: "0.5px", color: "#0f172a", lineHeight: "1" }}>HẢI LÊ <span style={{color: "#dc2626"}}>MART</span></h1>
        <span style={{ fontSize: "9px", color: "#64748b", fontWeight: "800", letterSpacing: "3px", textTransform: "uppercase", marginTop: "4px" }}>Professional POS</span>
      </div>
    </div>
  );

  // ================= 9. MAIN INTERFACE =================
  const styles_extra = `
    .loader { border: 3px solid #f3f3f3; border-radius: 50%; border-top: 3px solid #3498db; width: 20px; height: 20px; animation: spin 2s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `;

  return (
    <div onClick={() => { setOpenFilter(null); setShowSuggestions(false); }}>
      <style>{styles}{styles_extra}</style>
      
      {/* GIAO DIỆN CHÍNH */}
      <div className="no-print" style={{ padding: "15px", position: "relative", minHeight: "100vh", overflowX: "auto" }}>
        <div className="spring-bg" style={{ background: "#ef4444", top: "10%", left: "5%" }}></div>
        <div className="spring-bg" style={{ background: "#f59e0b", bottom: "10%", right: "5%" }}></div>

        {isCheckoutOpen && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
            {checkoutStep === 1 && (
              <div className="glass" style={{ padding: "25px", width: "350px" }}>
                <h3 style={{ color: "#ef4444", margin: "0", textAlign: "center" }}>🧧 THANH TOÁN</h3>
                <div style={{ display: "flex", position: "relative", marginTop: "15px" }}>
                  <input type="text" placeholder="👉 Quẹt mã Voucher hoặc nhập số tiền (đ)..." value={voucherInput} onChange={(e) => setVoucherInput(e.target.value)} onKeyDown={handleVoucherSubmit} style={{ flex: 1, padding: "12px", borderRadius: "10px 0 0 10px", border: "2px dashed #f59e0b", outline: "none", boxSizing: "border-box", backgroundColor: "#fffbeb" }} />
                  <button onClick={() => setScannerMode('voucher')} style={{ padding: "0 15px", backgroundColor: "#f59e0b", border: "none", borderRadius: "0 10px 10px 0", cursor: "pointer", color: "white", fontSize: "18px" }}>📷</button>
                </div>
                {appliedVoucherAmount > 0 && <div style={{ color: "#059669", fontSize: "12px", fontWeight: "bold", marginTop: "4px", textAlign: "center" }}>✅ Đã áp dụng giảm: {appliedVoucherAmount.toLocaleString()}đ</div>}
                <input type="text" placeholder="Số điện thoại khách..." value={custPhone} onChange={handlePhoneChange} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "2px solid #ef4444", marginTop: "10px", outline: "none", boxSizing: "border-box" }} />
                {custPhone && <div style={{ marginTop: "10px", padding: "12px", backgroundColor: "#fff7ed", borderRadius: "8px" }}>{customers[custPhone] ? <div><b>⭐ {customers[custPhone].name}</b><div>Ví: {Math.round(customers[custPhone].wallet || 0).toLocaleString()}đ</div></div> : <input type="text" placeholder="Tên khách mới..." value={custName} onChange={e => setCustName(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #fdba74" }} />}</div>}
                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}><button onClick={() => setIsCheckoutOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#e2e8f0" }}>Hủy</button><button onClick={handleNextToQR} style={{ flex: 2, padding: "10px", backgroundColor: "#ef4444", color: "#fff", borderRadius: "8px", fontWeight: "bold" }}>TIẾP TỤC 👉</button></div>
              </div>
            )}
            {checkoutStep === 2 && (
              <div className="glass" style={{ padding: "25px", width: "350px", textAlign: "center" }}>
                <h3 style={{ color: "#ef4444", margin: "0" }}>📱 THANH TOÁN QUẦY</h3>
                <div style={{ color: "#ef4444", fontSize: "28px", fontWeight: "900", margin: "10px 0" }}>{finalToPay.toLocaleString()}đ</div>
                <img src={`https://img.vietqr.io/image/970422-0680124181004-compact2.png?amount=${finalToPay}&addInfo=Thanh toan&accountName=LE%20HONG%20HAI`} style={{ width: "160px", margin: "0 auto 10px auto", border: "2px solid #ef4444", borderRadius: "10px", display: "block" }} />
                <div style={{ animation: "pulse-fast 1.5s infinite", color: "#b45309", fontSize: "11px", fontWeight: "bold" }}>⏳ Đang chờ nhận tiền...</div>
                <div style={{ backgroundColor: "#fef2f2", color: "#b91c1c", fontSize: "10px", padding: "6px", borderRadius: "4px", border: "1px dashed #ef4444", marginBottom: "15px", textAlign: "left" }}><b>⚠️ CHÚ Ý:</b> KHÔNG NHÌN MÀN HÌNH KHÁCH. CHỈ BẤM <b>XÁC NHẬN</b> KHI APP NGÂN HÀNG CỦA BẠN ĐÃ BÁO CÓ TIỀN!</div>
                <input type="number" placeholder="Tiền mặt khách đưa..." value={customerGiven} onChange={e => setCustomerGiven(Number(e.target.value) || "")} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                {customerGiven !== "" && Number(customerGiven) >= finalToPay && <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#ecfdf5", color: "#059669", fontWeight: "bold" }}>THỐI LẠI: {(Number(customerGiven) - finalToPay).toLocaleString()}đ</div>}
                <div style={{ display: "flex", gap: "8px", marginTop: "15px", flexWrap: "wrap" }}>
                    <button onClick={() => confirmCheckout('GHI NỢ')} className="add-to-cart-btn" style={{flex: 1, backgroundColor: "#f59e0b", color:"#fff"}}>GHI NỢ</button>
                    <button onClick={() => confirmCheckout('CHUYỂN KHOẢN')} className="add-to-cart-btn" style={{flex: 1, backgroundColor: "#3b82f6", color:"#fff"}}>CK (VIETQR)</button>
                    <button onClick={() => confirmCheckout('TIỀN MẶT')} className="add-to-cart-btn" style={{flex: 1, backgroundColor: "#10b981", color:"#fff"}}>TIỀN MẶT</button>
                </div>
              </div>
            )}
            {checkoutStep === 3 && (
              <div className="glass" style={{ padding: "30px", width: "380px", textAlign: "center" }}>
                <div style={{ fontSize: "40px" }}>🌸</div><h3 style={{ color: "#10b981", margin: "10px 0" }}>Thanh toán thành công!</h3>
                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                  <button onClick={() => { setPrintMode('receipt'); setTimeout(()=>window.print(), 300); }} style={{ flex: 1, padding: "12px", backgroundColor: "#ef4444", color: "#fff", borderRadius: "8px", fontWeight: "bold", fontSize: "12px" }}>🖨️ In Hóa Đơn</button>
                  <button onClick={sendReceiptEmail} style={{ flex: 1, padding: "12px", backgroundColor: "#3b82f6", color: "#fff", borderRadius: "8px", fontWeight: "bold", fontSize: "12px" }}>📧 Gửi Email</button>
                  <button onClick={closeCheckout} style={{ flex: 1, padding: "12px", backgroundColor: "#e2e8f0", borderRadius: "8px", color: "#1e293b", fontSize: "12px" }}>Đóng</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ maxWidth: "1500px", margin: "0 auto", minWidth: "1000px" }}>
          <div className="glass" style={{ padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", borderBottom: "4px solid #ef4444" }}>
            <HeaderLogo />
            <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setShowStatsModal(true)} style={{ padding: "6px 12px", background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" }}>📊 THỐNG KÊ</button>
                <button onClick={() => setShowCustomerModal(true)} style={{ padding: "6px 12px", background: "#fdf4ff", color: "#4f46e5", border: "1px solid #c7d2fe", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" }}>🤝 KHÁCH HÀNG</button>
                <button onClick={() => setShowAuditModal(true)} style={{ padding: "6px 12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" }}>🕵️ LỊCH SỬ</button>
                <button onClick={() => setShowDebtModal(true)} style={{ padding: "6px 12px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" }}>📓 SỔ NỢ</button>
            </div>
            <div style={{ display: "flex", gap: "20px" }}>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: "10px", color: "#64748b", fontWeight: "bold" }}>💵 TIỀN MẶT</div><div style={{ fontSize: "14px", fontWeight: "900", color: "#059669" }}>{currentShiftStats.cash.toLocaleString()}đ</div></div>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: "10px", color: "#64748b", fontWeight: "bold" }}>💳 CHUYỂN KHOẢN</div><div style={{ fontSize: "14px", fontWeight: "900", color: "#2563eb" }}>{currentShiftStats.transfer.toLocaleString()}đ</div></div>
                <button onClick={handleLogoutClick} style={{ padding: "8px 12px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", fontSize: "12px" }}>Đăng xuất 🔒</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "7fr 3fr", gap: "10px" }}>
            <div className="glass" style={{ padding: "12px" }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                <div style={{ position: "relative", flex: 1, display: "flex" }}>
                  <input placeholder="👉 QUẸT MÃ VẠCH..." value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} onKeyDown={handleBarcodeSubmit} style={{ flex: 1, padding: "8px 12px", borderRadius: "6px 0 0 6px", border: "2px solid #ef4444", fontWeight: "bold", backgroundColor: "#fffbeb" }} />
                  <button onClick={() => setScannerMode('product')} style={{ padding: "0 15px", backgroundColor: "#ef4444", border: "none", borderRadius: "0 6px 6px 0", color: "white" }}>📷</button>
                </div>
                {role === 'admin' && <button onClick={() => setShowInputForm(!showInputForm)} style={{ padding: "8px 12px", borderRadius: "6px", fontWeight: "bold", color: "#b91c1c", border: "1px dashed #ef4444" }}>{showInputForm ? "➖ ĐÓNG" : "➕ NHẬP LẺ"}</button>}
              </div>

              {showInputForm && (
                <form onSubmit={handleAddProduct} style={{ backgroundColor: "#fff7ed", padding: "12px", borderRadius: "8px", border: "1px solid #fdba74", marginBottom: "10px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                    <div><span className="input-label">MÃ SP</span><input value={newCode} onChange={handleCodeChange} style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1" }} /></div>
                    <div><span className="input-label">TÊN HÀNG</span><input value={newName} onChange={e => setNewName(e.target.value)} style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1" }} /></div>
                    <div><span className="input-label">GIÁ VỐN</span><input type="number" value={newImportPrice} onChange={e => setNewImportPrice(e.target.value)} style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1" }} /></div>
                    <div><span className="input-label">GIÁ BÁN</span><input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1" }} /></div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}><span className="input-label-red">GIÁ KM</span><input type="number" value={newPromoPrice} onChange={e => setNewPromoPrice(e.target.value)} style={{ width: "100%", padding: "6px", border: "1px solid #ef4444" }} /></div>
                    <div style={{ flex: 1 }}><span className="input-label">HSD</span><input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1" }} /></div>
                    <div style={{ flex: 1 }}><span className="input-label">SL NHẬP</span><input type="number" value={newStock} onChange={e => setNewStock(e.target.value)} style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1" }} /></div>
                    <button type="submit" style={{ padding: "8px 20px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold" }}>LƯU</button>
                  </div>
                </form>
              )}

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ color: "#16a34a", fontSize: "10px", borderBottom: "2px solid #fed7aa" }}>
                      <th style={{ textAlign: "left", padding: "8px" }}>SẢN PHẨM {renderHeaderIcon('name')}</th>
                      <th style={{ textAlign: "center" }}>TỒN {renderHeaderIcon('stock')}</th>
                      <th style={{ textAlign: "center" }}>GIÁ BÁN {renderHeaderIcon('sale_price')}</th>
                      <th style={{ textAlign: "center" }}>HSD {renderHeaderIcon('expiry_date')}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAndFilteredProducts.map(p => (
                        <tr key={p.id} style={{ borderBottom: "1px solid #fed7aa" }}>
                          <td style={{ padding: "8px" }}>
                            <div style={{fontWeight: "bold"}}>{role === 'admin' ? p.name : cleanName(p.name)}</div>
                            <div style={{fontSize: "9px", color: "#94a3b8"}}>{p.product_code}</div>
                          </td>
                          <td style={{ textAlign: "center", fontWeight: "bold" }}>{p.stock}</td>
                          <td style={{ textAlign: "center" }}>
                            <div style={{ textDecoration: p.promo_price > 0 ? "line-through" : "none", color: p.promo_price > 0 ? "#94a3b8" : "#16a34a" }} onClick={()=>handleEdit(p.id, 'sale_price', p.sale_price)}>{p.sale_price.toLocaleString()}</div>
                            {p.promo_price > 0 ? (
                               <div style={{ color: "#ef4444", fontWeight: "bold" }} onClick={()=>handleEdit(p.id, 'promo_price', p.promo_price)}>🔥 {p.promo_price.toLocaleString()}</div>
                            ) : (
                               role === 'admin' && <div style={{ fontSize: "9px", color: "#cbd5e1", cursor: "pointer" }} onClick={()=>handleEdit(p.id, 'promo_price', 0)}>🏷️ +Thêm KM</div>
                            )}
                          </td>
                          <td style={{ textAlign: "center", fontSize: "10px" }}>{p.expiry_date ? new Date(p.expiry_date).toLocaleDateString('vi-VN') : "---"}</td>
                          <td style={{ textAlign: "right" }}><button className="add-to-cart-btn" onClick={() => addToCart(p)}>+ GIỎ</button></td>
                        </tr>
                    ))}
                  </tbody>
                </table>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="glass" style={{ padding: "12px", flex: 1.5, minHeight: "45vh", display: "flex", flexDirection: "column" }}>
                {cartTotalAmount > 0 && (
                    <div style={{ backgroundColor: "#fef2f2", padding: "10px", borderRadius: "8px", border: "1px solid #fecaca", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div><span style={{ fontSize: "11px", fontWeight: "bold", color: "#b91c1c" }}>TỔNG CỘNG:</span><div style={{ fontSize: "22px", fontWeight: "900", color: "#ef4444" }}>{cartTotalAmount.toLocaleString()}đ</div></div>
                      <button onClick={() => { setIsCheckoutOpen(true); setCheckoutStep(1); }} style={{ padding: "12px 20px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>THANH TOÁN</button>
                    </div>
                )}
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {cart.map((item, idx) => (
                    <div key={idx} style={{ padding: "8px 0", borderBottom: "1px dashed #fed7aa", display: "flex", justifyContent: "space-between" }}>
                      <span style={{fontSize: "12px", fontWeight: "bold"}}>{cleanName(item.product.name)} x{item.qty}</span>
                      <span style={{color: "#ef4444", fontWeight: "bold"}}>{Math.round(item.total).toLocaleString()}đ</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass" style={{ padding: "12px", height: "35vh", overflowY: "auto" }}>
                <h3 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#b91c1c" }}>📋 NHẬT KÝ CA</h3>
                {Object.keys(groupedHistory).map((date) => (
                  <div key={date}>
                    <div style={{backgroundColor: "#ffedd5", padding: "4px 8px", fontSize: "10px", fontWeight: "bold"}}>{date}</div>
                    {groupedHistory[date].map((log: any) => (
                      <div key={log.id} style={{fontSize: "10px", padding: "4px 0", borderBottom: "1px dashed #eee", display: "flex", justifyContent: "space-between"}}>
                        <span>[{log.type}] {cleanName(log.name)} ({log.paymentMethod === 'CHUYỂN KHOẢN' ? 'CK' : 'TM'})</span>
                        <span style={{fontWeight: "bold"}}>{Math.round(log.total).toLocaleString()}</span>
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
  );
}

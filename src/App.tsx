import React, { useEffect, useState, useMemo } from "react";
// @ts-ignore
import { supabase } from "./supabaseClient";

export default function App() {
  const VAT_RATE = 0.1; 

  // ================= 1. CẤU HÌNH EMAIL TỰ ĐỘNG =================
  const EMAILJS_SERVICE_ID = "service_7ie990l";
  const EMAILJS_TEMPLATE_ID = "template_t91erhg";
  const EMAILJS_PUBLIC_KEY = "5ric0kxuwNPlUleAv";

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
  
  const [scannerMode, setScannerMode] = useState<'product' | 'voucher' | 'customer' | null>(null);
  const [scannedCodeObj, setScannedCodeObj] = useState<any>(null);
  const [scanMessage, setScanMessage] = useState<{text: string, type: 'success'|'error'} | null>(null);
  
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
  const [customerInput, setCustomerInput] = useState(""); 
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

  // ================= 3. HÀM LÕI (PURE HELPERS) =================
  const playSound = (type: 'success' | 'error') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      if (type === 'success') { osc.frequency.value = 800; gain.gain.setValueAtTime(0.1, ctx.currentTime); osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1); } 
      else { osc.frequency.value = 250; osc.type = 'square'; gain.gain.setValueAtTime(0.1, ctx.currentTime); osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3); }
    } catch(e) {}
  };

  const logAudit = (action: string, detail: string) => {
    const newLog = { id: Date.now(), time: new Date().toLocaleString('vi-VN'), user: role === 'admin' ? 'Quản lý' : 'Thu ngân', shift, action, detail };
    setAuditLogs(prev => [newLog, ...prev].slice(0, 200)); 
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
    return matches.length > 0 ? matches[0] : null;
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

  // ================= 4. EFFECTS =================
  useEffect(() => {
    localStorage.setItem("mart_history", JSON.stringify(history));
    localStorage.setItem("mart_customers", JSON.stringify(customers));
    localStorage.setItem("mart_held_orders", JSON.stringify(heldOrders));
    localStorage.setItem("mart_audit", JSON.stringify(auditLogs));
  }, [history, customers, heldOrders, auditLogs]);

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
      let scanner: any;
      let lastScanTime = 0;
      const loadScanner = () => {
        if ((window as any).Html5QrcodeScanner) {
           scanner = new (window as any).Html5QrcodeScanner("qr-reader", { 
               fps: 15, qrbox: { width: 250, height: 120 }, rememberLastUsedCamera: true
           }, false);
           scanner.render((text: string) => {
               const now = Date.now();
               if (now - lastScanTime < 1500) return; 
               lastScanTime = now;
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
              if (matchedPhone) {
                  playSound('success');
                  setCustomerInput(customers[matchedPhone].cardCode || matchedPhone);
                  setCustPhone(matchedPhone);
                  setCustName(customers[matchedPhone].name);
                  setScanMessage({ text: `✅ Đã chọn KH VIP: ${customers[matchedPhone].name}`, type: 'success' });
              } else {
                  playSound('error'); setScanMessage({ text: `❌ Không tìm thấy mã: ${scannedCodeObj.code}`, type: 'error' });
              }
              setTimeout(() => setScannerMode(null), 1500);
          }
      } 
      else if (scannerMode === 'voucher') {
          const code = scannedCodeObj.code.trim().toUpperCase();
          const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 };
          if (VOUCHERS[code]) {
            setAppliedVoucherAmount(VOUCHERS[code]); setVoucherInput(code); playSound('success');
            setScanMessage({ text: `✅ Đã áp dụng giảm ${VOUCHERS[code].toLocaleString()}đ`, type: 'success' });
          } else if (!isNaN(Number(code)) && Number(code) > 0) {
            setAppliedVoucherAmount(Number(code)); setVoucherInput(code); playSound('success');
            setScanMessage({ text: `✅ Đã nhận mức giảm ${Number(code).toLocaleString()}đ`, type: 'success' });
          } else {
            playSound('error'); alert("Mã Voucher không hợp lệ!"); setAppliedVoucherAmount(0);
          }
          setTimeout(() => setScannerMode(null), 1000);
      }
      else if (scannerMode === 'customer') {
          const val = scannedCodeObj.code.trim();
          setCustomerInput(val);
          const matchedPhone = Object.keys(customers).find(phone => phone === val || customers[phone].cardCode === val);
          if (matchedPhone) {
              setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); playSound('success');
              setScanMessage({ text: `✅ Nhận diện VIP: ${customers[matchedPhone].name}`, type: 'success' });
          } else {
              setCustPhone(val); setCustName(""); playSound('success');
              setScanMessage({ text: `✅ Đã quét mã thẻ (Khách mới)`, type: 'success' });
          }
          setTimeout(() => setScannerMode(null), 1000);
      }
      setScannedCodeObj(null);
      setTimeout(() => setScanMessage(null), 1500); 
    }
  }, [scannedCodeObj, products, scannerMode]);

  useEffect(() => {
    const handleAfterPrint = () => setPrintMode(null);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  // ================= 5. COMPUTED DATA =================
  const currentShiftStats = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('vi-VN');
    const shiftLogs = history.filter(h => new Date(Math.floor(h.id)).toLocaleDateString('vi-VN') === todayStr && h.shift === shift);
    let cash = 0; let transfer = 0; let prof = 0; let totalSales = 0;
    shiftLogs.forEach(h => {
        if (h.type === 'BÁN' || h.type === 'GHI NỢ') totalSales += h.total;
        if (h.type === 'BÁN' || h.type === 'THU NỢ' || h.type === 'TRẢ HÀNG') {
            if (h.paymentMethod === 'CHUYỂN KHOẢN') transfer += h.total;
            else if (h.paymentMethod === 'TIỀN MẶT') cash += h.total;
        }
        prof += (h.profit || 0);
    });
    return { rev: cash + transfer, cash, transfer, prof, totalSales };
  }, [history, shift]);

  const todayStats = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('vi-VN');
    const todayHistory = history.filter(h => new Date(Math.floor(h.id)).toLocaleDateString('vi-VN') === todayStr);
    let cash = 0; let transfer = 0; let prof = 0; let totalSales = 0;
    todayHistory.forEach(h => {
        if (h.type === 'BÁN' || h.type === 'GHI NỢ') totalSales += h.total;
        if (h.type === 'BÁN' || h.type === 'THU NỢ' || h.type === 'TRẢ HÀNG') {
            if (h.paymentMethod === 'CHUYỂN KHOẢN') transfer += h.total;
            else if (h.paymentMethod === 'TIỀN MẶT') cash += h.total;
        }
        prof += (h.profit || 0);
    });
    return { rev: cash + transfer, cash, transfer, prof, totalSales };
  }, [history]);

  const topSelling = useMemo(() => {
    const sales: Record<string, number> = {};
    history.forEach(log => { if((log.type === 'BÁN' || log.type === 'GHI NỢ') && log.product_id !== 'DISCOUNT') sales[log.name] = (sales[log.name]||0) + log.qty; });
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
  const cartTotalAmountDisplay = cart.reduce((sum, item) => sum + item.total, 0);
  const finalToPay = Math.round(Math.max(0, cartTotalAmountDisplay - appliedVoucherAmount - (useWallet ? Math.min(customers[custPhone]?.wallet||0, Math.max(0, cartTotalAmountDisplay - appliedVoucherAmount)) : 0)));

  const uniqueNames = useMemo(() => Array.from(new Set(products.map(p => cleanName(p.name)))).sort(), [products]);
  const uniqueStocks = useMemo(() => Array.from(new Set(products.map(p => p.stock))).sort((a,b)=>a-b), [products]);
  const uniqueImportPrices = useMemo(() => Array.from(new Set(products.map(p => p.import_price || 0))).sort((a,b)=>a-b), [products]);
  const uniqueSalePrices = useMemo(() => Array.from(new Set(products.map(p => p.sale_price))).sort((a,b)=>a-b), [products]);
  const uniqueExpiries = useMemo(() => Array.from(new Set(products.map(p => p.expiry_date).filter(Boolean))).sort(), [products]);
  const categories = ["Tất cả", ...Array.from(new Set(products.map(p => p.category || "Khác")))];

  const sortedAndFilteredProducts = useMemo(() => {
    const todayTime = new Date().getTime();
    let filtered = products
      .filter(p => (selectedCategory === "Tất cả" || (p.category || "Khác") === selectedCategory))
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
        if (aIsUrgent && !bIsUrgent) return -1; if (!aIsUrgent && bIsUrgent) return 1; if (aIsUrgent && bIsUrgent) return daysA - daysB; 
        return 0;
      });
    }
    return filtered;
  }, [products, searchTerm, selectedCategory, sortConfig, filters]);

  // ================= 6. EVENT HANDLERS =================
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authUsername === "admin" && authPassword === "haile88") {
      setIsLoggedIn(true); setRole("admin"); localStorage.setItem("mart_shift", shift);
      localStorage.setItem("mart_logged_in", "true"); localStorage.setItem("mart_role", "admin");
      logAudit("ĐĂNG NHẬP", "Mở ca thành công");
    } else if (authUsername === "nhanvien" && authPassword === "123") {
      setIsLoggedIn(true); setRole("staff"); localStorage.setItem("mart_shift", shift);
      localStorage.setItem("mart_logged_in", "true"); localStorage.setItem("mart_role", "staff");
      logAudit("ĐĂNG NHẬP", "Mở ca thành công");
    } else alert("Sai tài khoản hoặc mật khẩu!");
  };

  const handleLogoutClick = () => setShowHandoverModal(true);
  const confirmHandover = () => {
    logAudit("CHỐT CA", `Doanh thu bàn giao: ${currentShiftStats.rev.toLocaleString()}đ (TM: ${currentShiftStats.cash.toLocaleString()}đ, CK: ${currentShiftStats.transfer.toLocaleString()}đ)`);
    setIsLoggedIn(false); setShowHandoverModal(false);
    localStorage.removeItem("mart_logged_in"); localStorage.removeItem("mart_role");
  };

  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    const newOrder = { id: Date.now(), time: new Date().toLocaleTimeString('vi-VN'), cart: [...cart] };
    setHeldOrders(prev => [...prev, newOrder]);
    logAudit("LƯU TẠM", `Lưu giỏ hàng ${cart.length} món`);
    setCart([]); setCustPhone(""); setCustName(""); setCustomerInput("");
  };

  const restoreOrder = (order: any) => {
    if (cart.length > 0) return alert("Vui lòng thanh toán hoặc hủy giỏ hiện tại trước khi mở đơn lưu tạm!");
    setCart(order.cart);
    setHeldOrders(prev => prev.filter(o => o.id !== order.id));
    setShowHoldModal(false);
  };

  const deleteHeldOrder = (id: any) => {
    setHeldOrders(prev => prev.filter(o => o.id !== id));
    logAudit("XÓA ĐƠN TẠM", `Đã xóa 1 đơn hàng lưu tạm`);
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

  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const p = findProductByCode(barcodeInput);
      if (p) handleSelectSuggest(p);
      else { 
          const matchedPhone = Object.keys(customers).find(phone => phone === barcodeInput.trim() || customers[phone].cardCode === barcodeInput.trim());
          if (matchedPhone) {
              playSound('success');
              setCustomerInput(customers[matchedPhone].cardCode || matchedPhone);
              setCustPhone(matchedPhone);
              setCustName(customers[matchedPhone].name);
              setBarcodeInput("");
          } else {
              playSound('error'); alert("Mã sai hoặc không tìm thấy!"); 
          }
      }
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
        if (newQty > p.stock) { playSound('error'); alert(`Lô hàng này chỉ còn tối đa ${p.stock} sản phẩm. Hãy thêm tiếp lô mới vào giỏ!`); return prev; }
        playSound('success');
        return prev.map(i => i.product.id === p.id ? { ...i, qty: newQty, total: Math.round(newQty*price*(1+VAT_RATE)), profit: Math.round(newQty*(price - (p.import_price||0))) } : i);
      } else {
        playSound('success');
        return [...prev, { product: p, qty: 1, total: Math.round(price*(1+VAT_RATE)), profit: Math.round(price - (p.import_price||0)) }];
      }
    });
  };

  const adjustCartQty = (productId: any, delta: number) => {
    let exceedStock = false; let stockLimit = 0;
    setCart(prev => {
      const updated = prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.qty + delta;
          if (newQty > item.product.stock) { exceedStock = true; stockLimit = item.product.stock; return item; }
          const price = getActualPrice(item.product);
          return { ...item, qty: newQty, total: Math.round(newQty*price*(1+VAT_RATE)), profit: Math.round(newQty*(price - (item.product.import_price||0))) };
        }
        return item;
      });
      return updated.filter(item => item.qty > 0);
    });
    if (exceedStock) {
      playSound('error'); setTimeout(() => alert(`Vượt quá tồn kho lô này! Lô này chỉ còn tối đa ${stockLimit} sản phẩm.`), 10);
    } else if (delta > 0) playSound('success');
  };

  const handleDirectQtyChange = (productId: any, val: string) => {
    setCart(prev => {
      if (val === '') return prev.map(i => i.product.id === productId ? { ...i, qty: '' as any, total: 0, profit: 0 } : i);
      let num = parseInt(val);
      if (isNaN(num) || num < 0) return prev;
      let exceedStock = false; let stockLimit = 0;
      const updated = prev.map(i => {
        if (i.product.id === productId) {
           if (num > i.product.stock) { exceedStock = true; stockLimit = i.product.stock; num = i.product.stock; }
           const price = getActualPrice(i.product);
           return { ...i, qty: num, total: Math.round(num*price*(1+VAT_RATE)), profit: Math.round(num*(price - (i.product.import_price||0))) };
        }
        return i;
      });
      if (exceedStock) { playSound('error'); setTimeout(() => alert(`Vượt quá tồn kho lô này! Tối đa ${stockLimit}.`), 10); }
      return updated;
    });
  };

  const handleDirectQtyBlur = (productId: any, val: string) => {
    if (val === '' || parseInt(val) <= 0 || isNaN(parseInt(val))) {
       setCart(prev => prev.map(i => {
           if (i.product.id === productId) {
               const price = getActualPrice(i.product);
               return { ...i, qty: 1, total: Math.round(1*price*(1+VAT_RATE)), profit: Math.round(1*(price - (i.product.import_price||0))) };
           }
           return i;
       }));
    }
  };

  const removeFromCart = (productId: any) => {
    const item = cart.find(i => i.product.id === productId);
    if(item) logAudit("XÓA MÓN", `Bỏ ${cleanName(item.product.name)} khỏi giỏ`);
    setCart(cart.filter(item => item.product.id !== productId));
  };
  
  const clearCart = () => {
    if(window.confirm("Hủy toàn bộ giỏ hàng?")) { logAudit("HỦY GIỎ HÀNG", `Hủy giỏ`); setCart([]); setCustName(""); setCustPhone(""); setCustomerInput(""); }
  };

  const handleVoucherSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = voucherInput.trim().toUpperCase();
      const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 };
      if (VOUCHERS[code]) {
        setAppliedVoucherAmount(VOUCHERS[code]); playSound('success');
      } else if (!isNaN(Number(code)) && Number(code) > 0) {
        setAppliedVoucherAmount(Number(code)); playSound('success');
      } else {
        playSound('error'); alert("Mã Voucher không hợp lệ!"); setAppliedVoucherAmount(0);
      }
    }
  };

  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; 
    setCustomerInput(val);
    const matchedPhone = Object.keys(customers).find(phone => phone === val.trim() || customers[phone].cardCode === val.trim());
    if (matchedPhone) { 
        setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); setUseWallet(false); 
    } 
    else { 
        setCustPhone(val); setCustName(""); setUseWallet(false); 
    }
  };

  const handleNextToQR = () => {
    if (cart.length === 0) return alert("Giỏ hàng đang trống!");
    if (custPhone && !customers[custPhone] && !custName) return alert("Nhập Tên khách hàng mới!");
    setCheckoutStep(2);
  };

  const confirmCheckout = async (payMethod: 'TIỀN MẶT' | 'CHUYỂN KHOẢN' | 'GHI NỢ') => {
    if (cart.some(i => !i.qty || i.qty <= 0)) { playSound('error'); return alert("Có sản phẩm số lượng không hợp lệ!"); }
    if (payMethod === 'GHI NỢ' && !custPhone) return alert("Ghi nợ bắt buộc phải nhập Khách hàng!");
    
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
      logs.push({ 
          id: Date.now() + Math.random(), shift: shift, type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", 
          name: item.product.name + (item.product.isHappyHour ? ' [Giờ Vàng]' : ''), qty: item.qty, 
          total: Math.round(item.total), profit: Math.round(item.profit), 
          customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: item.product.id, refunded_qty: 0, paymentMethod: payMethod 
      });
    }

    if (totalDiscount > 0) {
       logs.push({ 
          id: Date.now() + Math.random(), shift: shift, type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", 
          name: "Giảm giá Voucher/Ví", qty: 1, total: -totalDiscount, profit: -totalDiscount, 
          customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: 'DISCOUNT', refunded_qty: 0, paymentMethod: payMethod 
      });
    }
    
    if (custPhone) {
      setCustomers((prev: any) => ({ 
        ...prev, 
        [custPhone]: { 
            name: custName, 
            wallet: payMethod === 'GHI NỢ' ? (prev[custPhone]?.wallet || 0) : Math.round((prev[custPhone]?.wallet || 0) - walletDiscount + earned), 
            debt: (prev[custPhone]?.debt || 0) + (payMethod === 'GHI NỢ' ? finalTotal : 0), 
            email: prev[custPhone]?.email || "",
            cardCode: prev[custPhone]?.cardCode || "" 
        } 
      }));
    }

    setHistory(prev => [...logs, ...prev]);

    setLastOrder({ 
      orderId: "HD" + Date.now().toString().slice(-6), shift: shift, cart: [...cart], 
      subTotal, vatTotal, finalTotal: payMethod === 'GHI NỢ' ? 0 : finalTotal, debtAmount: payMethod === 'GHI NỢ' ? finalTotal : 0, 
      discount: totalDiscount, earnedWallet: custPhone ? earned : 0, custName: custPhone ? custName : null, custPhone: custPhone ? custPhone : null, time: new Date().toLocaleString('vi-VN'), paymentMethod: payMethod,
      customerGiven: payMethod === 'TIỀN MẶT' ? Number(customerGiven) : 0
    });
    setCheckoutStep(3); fetchProducts(); setLoading(false);
  };

  const handleRefund = async (logId: any) => {
    const logIndex = history.findIndex(l => l.id === logId);
    if(logIndex === -1) return;
    const log = history[logIndex];
    if(log.type !== 'BÁN') return alert("Chỉ hoàn trả đơn BÁN!");

    const maxRefund = log.qty - (log.refunded_qty || 0);
    if(maxRefund <= 0) return alert("Đơn này đã được hoàn trả toàn bộ!");

    const qStr = window.prompt(`Sản phẩm: ${cleanName(log.name)}\nĐã mua: ${log.qty} | Có thể hoàn tối đa: ${maxRefund}\n\nNhập số lượng muốn hoàn trả:`, maxRefund.toString());
    if (!qStr) return;
    const refundQty = parseInt(qStr);

    if (isNaN(refundQty) || refundQty <= 0 || refundQty > maxRefund) { playSound('error'); return alert("Số lượng hoàn không hợp lệ!"); }
    if(!window.confirm(`Xác nhận hoàn trả ${refundQty} x ${cleanName(log.name)}?`)) return;

    const unitTotal = log.total / log.qty; const unitProfit = log.profit / log.qty;
    const refundTotal = Math.round(unitTotal * refundQty); const refundProfit = Math.round(unitProfit * refundQty);

    const p = products.find(x => x.id === log.product_id);
    if (p) await supabase.from("products").update({ stock: p.stock + refundQty }).eq("id", p.id);

    let refundedToWallet = false;
    if (log.customer && log.customer !== "Khách lẻ") {
       const phoneMatch = log.customer.match(/\((.*?)\)/);
       if (phoneMatch && phoneMatch[1]) {
           const phone = phoneMatch[1];
           if (customers[phone]) {
               if (window.confirm(`Hoàn ${refundTotal.toLocaleString()}đ bằng TIỀN MẶT hay cộng vào VÍ ĐIỂM của khách?\n\n- OK: Cộng vào VÍ ĐIỂM\n- Cancel: Hoàn bằng TIỀN MẶT`)) {
                   setCustomers((prev: any) => ({ ...prev, [phone]: { ...prev[phone], wallet: (prev[phone].wallet || 0) + refundTotal } }));
                   logAudit("HOÀN TIỀN VÍ", `Hoàn ${refundTotal.toLocaleString()}đ vào ví KH ${customers[phone].name}`);
                   refundedToWallet = true;
               }
           }
       }
    }

    const updatedHistory = [...history];
    updatedHistory[logIndex].refunded_qty = (log.refunded_qty || 0) + refundQty;
    updatedHistory.unshift({ 
      id: Date.now(), shift: shift, type: "TRẢ HÀNG", 
      name: log.name + (refundedToWallet ? " (Hoàn Ví)" : " (Hoàn Tiền Mặt)"), 
      qty: refundQty, total: -refundTotal, profit: -refundProfit, customer: log.customer, paymentMethod: refundedToWallet ? 'VÍ ĐIỂM' : 'TIỀN MẶT'
    });
    
    setHistory(updatedHistory); fetchProducts();
    logAudit("TRẢ HÀNG", `Hoàn ${refundQty} ${cleanName(log.name)} trị giá ${refundTotal.toLocaleString()}đ`);
    playSound('success'); alert(`Hoàn trả thành công ${refundQty} sản phẩm! Tiền đã được xử lý.`);
  };

  const handlePayDebt = (phone: string) => {
    const currentDebt = customers[phone]?.debt || 0;
    const payAmtStr = window.prompt(`Khách ${customers[phone].name} đang nợ ${currentDebt.toLocaleString()}đ. Nhập số tiền trả:`, currentDebt.toString());
    if (payAmtStr && parseInt(payAmtStr) > 0) {
      const amt = parseInt(payAmtStr);
      const isTransfer = window.confirm(`Thu nợ bằng hình thức nào?\n\n- [OK] : CHUYỂN KHOẢN\n- [Cancel] : TIỀN MẶT`);
      const pMethod = isTransfer ? 'CHUYỂN KHOẢN' : 'TIỀN MẶT';
      setCustomers((prev: any) => ({ ...prev, [phone]: { ...prev[phone], debt: Math.max(0, (prev[phone]?.debt || 0) - amt) } }));
      setHistory(prev => [{ id: Date.now(), shift: shift, type: "THU NỢ", name: "Thanh toán công nợ", qty: 1, total: amt, profit: 0, customer: `${customers[phone].name} (${phone})`, paymentMethod: pMethod }, ...prev]);
      logAudit("THU NỢ", `Thu ${amt.toLocaleString()}đ từ ${customers[phone].name}`);
      alert("Đã thu nợ thành công! Tiền nợ thu được đã cộng vào doanh thu ca này.");
    }
  };

  const closeCheckout = () => { setCart([]); setIsCheckoutOpen(false); setCheckoutStep(1); setCustPhone(""); setCustName(""); setCustomerInput(""); setUseWallet(false); setVoucherInput(""); setAppliedVoucherAmount(0); setCustomerGiven(""); setLastOrder(null); };

  const sendReceiptEmail = async () => {
    if (!lastOrder) return;
    
    const savedEmail = (lastOrder.custPhone && customers[lastOrder.custPhone] && customers[lastOrder.custPhone].email) ? customers[lastOrder.custPhone].email : "";
    const email = window.prompt("Nhập Email khách hàng:", savedEmail);
    if (!email) return;

    if (lastOrder.custPhone) {
        setCustomers((prev: any) => ({
            ...prev,
            [lastOrder.custPhone]: { ...prev[lastOrder.custPhone], email: email }
        }));
    }

    setLoading(true);
    let itemsTable = "";
    lastOrder.cart.forEach((item: any) => {
      const price = Math.round(getActualPrice(item.product));
      itemsTable += `- ${cleanName(item.product.name)} x ${item.qty} = ${Math.round(item.qty * price * (1+VAT_RATE)).toLocaleString()}đ\n`;
    });

    const emailData = {
      to_email: email,
      order_id: lastOrder.orderId,
      time: lastOrder.time,
      items_list: itemsTable,
      total_amount: Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString() + "đ",
      payment_method: lastOrder.paymentMethod,
      change_amount: lastOrder.paymentMethod === 'TIỀN MẶT' ? Math.round(lastOrder.customerGiven - lastOrder.finalTotal).toLocaleString() + "đ" : "0đ"
    };

    try {
      await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailData);
      alert("🚀 Đã gửi hóa đơn điện tử tự động thành công!");
    } catch (error) {
      console.error(error);
      alert("❌ Lỗi gửi mail. Ông chủ kiểm tra lại Service ID & Template ID nhé.");
    }
    setLoading(false);
  };

  // ================= TÍNH NĂNG GỬI MÃ THẺ VIP CHO KHÁCH TỰ ĐỘNG =================
  const sendCardEmail = async (phone: string) => {
      const cust = customers[phone];
      const email = cust.email || window.prompt(`Nhập Email của ${cust.name} để gửi mã thẻ:`, "");
      if (!email) return;

      if (!cust.email) {
          setCustomers((prev:any) => ({...prev, [phone]: {...prev[phone], email}}));
      }

      setLoading(true);
      const code = cust.cardCode || phone;
      const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(code)}&scale=2&height=10&includetext=true`;
      
      const emailData = {
        to_email: email,
        order_id: "THẺ THÀNH VIÊN",
        time: new Date().toLocaleString('vi-VN'),
        items_list: `💳 MÃ THẺ CỦA BẠN LÀ: ${code}\n(Vui lòng xuất trình mã vạch bên dưới khi thanh toán)`,
        total_amount: "Ưu đãi Đặc Quyền",
        payment_method: "VIP Member",
        change_amount: "0đ",
        barcode_url: barcodeUrl // Đẩy link mã vạch vào mail
      };

      try {
        await (window as any).emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailData);
        alert("🚀 Đã gửi Thẻ VIP điện tử tự động thành công!");
      } catch (error) {
        alert("❌ Lỗi gửi mail. Ông chủ kiểm tra lại thông tin cấu hình EmailJS.");
      }
      setLoading(false);
  };

  const printCustomerCard = (phone: string) => {
      setPrintCustomer({phone, ...customers[phone]});
      setPrintMode('customer_card');
      setTimeout(() => window.print(), 1000); // 1 giây sau tự bật bảng in
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value; setNewCode(code);
    const p = products.find((x: any) => x.product_code === code);
    if (p) { 
      setNewName(cleanName(p.name)); setNewCategory(p.category || "Khác"); setNewImportPrice(p.import_price?.toString() || ""); setNewPrice(p.sale_price.toString()); setNewPromoPrice(p.promo_price?.toString() || ""); setNewExpiry(p.expiry_date || ""); 
      const gift = parseGift(p.gift_info);
      setNewGiftCondition(gift.cond.toString());
      setNewGiftInfo(gift.text);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const added = parseInt(newStock || "0"); const impPrice = parseInt(newImportPrice);
    const salePrice = parseInt(newPrice); const promo = parseInt(newPromoPrice) || 0;
    const finalGiftInfo = newGiftInfo.trim() !== "" ? `${newGiftCondition};;;${newGiftInfo}` : null;

    const baseCode = newCode.trim();
    const allVariants = products.filter(p => p.product_code === baseCode || p.product_code.startsWith(`${baseCode}-`));
    const exist = allVariants.find(p => p.product_code === baseCode); 

    let priceUpdatedMsg = "";

    if (allVariants.length > 0) {
        const currentSalePrice = allVariants[0].sale_price;
        if (currentSalePrice !== salePrice) {
            await Promise.all(allVariants.map(v => supabase.from("products").update({ sale_price: salePrice, promo_price: promo }).eq("id", v.id)));
            priceUpdatedMsg = `\n\n💡 Đã tự động ĐỒNG BỘ GIÁ BÁN MỚI (${salePrice.toLocaleString()}đ) cho tất cả lô hàng cũ!`;
            logAudit("ĐỒNG BỘ GIÁ BÁN", `Cập nhật mã ${baseCode} lên giá ${salePrice.toLocaleString()}đ`);
        }
    }

    if (exist) {
        if (exist.stock <= 0) {
            await supabase.from("products").update({ name: newName, category: newCategory || "Khác", import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null, created_at: new Date().toISOString() }).eq("id", exist.id);
            if (added > 0) setHistory(prev => [{ id: Date.now(), shift: shift, type: "NHẬP", name: newName, qty: added, total: 0 }, ...prev]);
            logAudit("NHẬP MỚI (ĐÈ CŨ)", `${newName} (Mã: ${baseCode}) - SL: ${added}`);
            alert(`Đã nhập hàng thành công!${priceUpdatedMsg}`);
        } else {
            const isDiff = exist.import_price !== impPrice || (exist.expiry_date || "") !== (newExpiry || "");
            if (isDiff) {
                const batchCode = `${baseCode}-${Date.now().toString().slice(-4)}`;
                const batchName = `${newName} [Lô ${newExpiry ? new Date(newExpiry).toLocaleDateString('vi-VN') : 'Mới'}]`;
                if(window.confirm(`Hàng cũ đang tồn ${exist.stock}.\nBạn nhập lô mới có Giá Vốn hoặc HSD khác.\nHệ thống sẽ tạo LÔ MỚI (${batchCode}) để quản lý tách biệt (FIFO).${priceUpdatedMsg}\n\nĐồng ý?`)) {
                    await supabase.from("products").insert([{ product_code: batchCode, name: batchName, category: newCategory || "Khác", import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null }]);
                    if (added > 0) setHistory(prev => [{ id: Date.now(), shift: shift, type: "NHẬP", name: batchName, qty: added, total: 0 }, ...prev]);
                    logAudit("NHẬP TÁCH LÔ", `${batchName} (Mã: ${batchCode}) - SL: ${added}`);
                    if (!priceUpdatedMsg) alert(`Đã tạo lô mới thành công!`); 
                } else { setLoading(false); return; }
            } else {
                await supabase.from("products").update({ stock: exist.stock + added, created_at: new Date().toISOString() }).eq("id", exist.id);
                if (added > 0) setHistory(prev => [{ id: Date.now(), shift: shift, type: "NHẬP", name: newName, qty: added, total: 0 }, ...prev]);
                logAudit("NHẬP THÊM HÀNG", `${newName} (Mã: ${baseCode}) - +SL: ${added}`);
                alert(`Đã cộng dồn số lượng thành công!${priceUpdatedMsg}`);
            }
        }
    } else {
        await supabase.from("products").insert([{ product_code: baseCode, name: newName, category: newCategory || "Khác", import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: added, expiry_date: newExpiry || null }]);
        if (added > 0) setHistory(prev => [{ id: Date.now(), shift: shift, type: "NHẬP", name: newName, qty: added, total: 0 }, ...prev]);
        logAudit("NHẬP MỚI", `${newName} (Mã: ${baseCode}) - SL: ${added}`);
        if(priceUpdatedMsg) alert(`Đã nhập hàng thành công!${priceUpdatedMsg}`);
    }
    setNewCode(""); setNewName(""); setNewCategory("Đồ uống"); setNewImportPrice(""); setNewPrice(""); setNewPromoPrice(""); setNewGiftCondition("1"); setNewGiftInfo(""); setNewStock(""); setNewExpiry("");
    fetchProducts(); setLoading(false); setShowInputForm(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      setLoading(true);
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length <= 1) { alert("File rỗng hoặc không đúng!"); setLoading(false); return; }
        let successCount = 0; let importLogs: any[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length < 5) continue; 
          const pCode = cols[0]; const pName = cols[1]; const pCategory = cols[2] || "Khác"; const pImpPrice = parseInt(cols[3]) || 0; const pSalePrice = parseInt(cols[4]) || 0; const pPromoPrice = parseInt(cols[5]) || 0; const pGift = cols[6] || null; const pStock = parseInt(cols[7]) || 0; const pExpiry = cols[8] || null;
          if (!pCode || !pName || pSalePrice <= 0) continue;
          
          const baseCode = pCode.trim();
          const allVariants = products.filter(p => p.product_code === baseCode || p.product_code.startsWith(`${baseCode}-`));
          
          if (allVariants.length > 0) {
              const currentSalePrice = allVariants[0].sale_price;
              if (currentSalePrice !== pSalePrice) {
                  await Promise.all(allVariants.map(v => supabase.from("products").update({ sale_price: pSalePrice, promo_price: pPromoPrice }).eq("id", v.id)));
                  if(!importLogs.find(l => l.name === `Đồng bộ giá ${baseCode}`)) {
                       importLogs.push({ id: Date.now() + Math.random(), shift: shift, type: "HỆ THỐNG", name: `Đồng bộ giá ${baseCode}`, qty: 0, total: 0 });
                  }
              }
          }
          const exist = allVariants.find(p => p.product_code === baseCode);
          if (exist) {
             if (exist.stock <= 0) {
                 await supabase.from("products").update({ name: pName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry, created_at: new Date().toISOString() }).eq("id", exist.id);
             } else {
                 const isDiff = exist.import_price !== pImpPrice || (exist.expiry_date || "") !== (pExpiry || "");
                 if (isDiff) {
                     const batchCode = `${baseCode}-${Date.now().toString().slice(-4)}${i}`; 
                     const batchName = `${pName} [Lô ${pExpiry ? new Date(pExpiry).toLocaleDateString('vi-VN') : 'Mới'}]`;
                     await supabase.from("products").insert([{ product_code: batchCode, name: batchName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry }]);
                 } else {
                     await supabase.from("products").update({ stock: exist.stock + pStock, created_at: new Date().toISOString() }).eq("id", exist.id);
                 }
             }
          } else {
              await supabase.from("products").insert([{ product_code: baseCode, name: pName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry }]);
          }
          if (pStock > 0) importLogs.push({ id: Date.now() + Math.random(), shift: shift, type: "NHẬP", name: cleanName(pName), qty: pStock, total: 0 });
          successCount++;
        }
        if (importLogs.length > 0) setHistory(prev => [...importLogs, ...prev]);
        logAudit("NHẬP FILE", `Đã nhập hàng loạt ${successCount} mã`);
        alert(`Đã nhập thành công ${successCount} sản phẩm từ file!`); fetchProducts();
      } catch (err) { alert("Lỗi xử lý file CSV."); }
      setLoading(false);
    };
    reader.readAsText(file); e.target.value = '';
  };

  const handleDelete = async (id: any, name: any) => { 
      if (window.confirm(`Xóa vĩnh viễn ${name}?`)) { 
          await supabase.from("products").delete().eq("id", id); 
          logAudit("XÓA SẢN PHẨM", `Xóa vĩnh viễn: ${name}`);
          fetchProducts(); 
      } 
  };
  
  const handleEdit = async (id: any, field: string, old: any, isText: boolean = false) => {
    let label = field;
    if (field === 'category') label = 'Danh mục'; if (field === 'sale_price') label = 'Giá bán';
    if (field === 'promo_price') label = 'Giá KM (Nhập 0 để hủy)'; 
    if (field === 'gift_info') label = 'Quà tặng (Cấu trúc: SL_cần_mua;;;Tên_quà. VD: 24;;;1 Ly. Xóa trắng để hủy)';
    if (field === 'expiry_date') label = 'HSD (YYYY-MM-DD)';
    const val = window.prompt(`Sửa ${label}:`, old || "");
    if (val !== null) { 
      let updateData: any = isText ? val : (parseInt(val) || 0);
      if (field === 'gift_info' && val.trim() === '') updateData = null; 
      await supabase.from("products").update({ [field]: updateData }).eq("id", id); 
      logAudit("SỬA THÔNG TIN", `ID: ${id}, Sửa ${label} thành ${val}`);
      fetchProducts(); 
    }
  };

  const handlePrintBarcode = (p: any) => {
    const q = window.prompt(`Nhập số lượng tem cần in cho: ${cleanName(p.name)}`, "30");
    if (q && parseInt(q) > 0) {
      setPrintBarcodeProduct(p); setBarcodeCount(parseInt(q)); setPrintMode('barcode');
      setTimeout(() => window.print(), 1500);
    }
  };

  const downloadSampleCSV = () => {
    const csv = "\uFEFFMã SP,Tên SP,Danh Mục,Giá Nhập,Giá Bán,Giá KM,Quà Tặng,Số Lượng,Hạn Sử Dụng (YYYY-MM-DD)\nSP001,Mì Hảo Hảo,Đồ ăn liền,3000,5000,0,,100,2026-12-31\nSP002,Nước suối TH,Đồ uống,4000,6000,0,24;;;1 Ly Thủy Tinh,50,2026-06-15";
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Mau_Nhap_Kho_Hai_Le_Mart.csv`; link.click();
  };

  const exportToCSV = () => {
    if (history.length === 0) return alert("Chưa có lịch sử!");
    let csv = "\uFEFFGiờ,Ca Làm Việc,Loại,Hình thức,Khách,Sản phẩm,SL,Tổng(VAT),Lợi nhuận\n";
    history.forEach(log => {
      const time = new Date(Math.floor(log.id)).toLocaleString('vi-VN');
      csv += `${time},${log.shift || "Không rõ"},${log.type},${log.paymentMethod || ""},${log.customer || "Khách lẻ"},${log.name},${log.qty},${Math.round(log.total)},${Math.round(log.profit || 0)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Bao_Cao_Hai_Le_Mart.csv`; link.click();
  };

  const exportAuditToCSV = () => {
    if (auditLogs.length === 0) return alert("Chưa có dữ liệu thao tác!");
    let csv = "\uFEFFThời gian,Người dùng,Ca,Hành động,Chi tiết\n";
    auditLogs.forEach(log => {
      const safeDetail = `"${(log.detail || "").replace(/"/g, '""')}"`;
      csv += `${log.time},${log.user},${log.shift},${log.action},${safeDetail}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Nhat_Ky_Kiem_Toan_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`; link.click();
  };

  const handleSendEmailReport = () => {
    const todayStr = new Date().toLocaleDateString('vi-VN');
    const logs = history.filter(log => new Date(Math.floor(log.id)).toLocaleDateString('vi-VN') === todayStr);
    if (logs.length === 0) return alert("Chưa có giao dịch!");
    let cash = 0, transfer = 0, prof = 0, sold = 0;
    logs.forEach(l => { 
        if(l.type==='BÁN') sold += l.qty; 
        if(l.type==='BÁN' || l.type==='THU NỢ' || l.type==='TRẢ HÀNG') {
            if (l.paymentMethod === 'CHUYỂN KHOẢN') transfer += l.total;
            else if (l.paymentMethod === 'TIỀN MẶT') cash += l.total;
        }
        prof += (l.profit||0); 
    });
    const sub = encodeURIComponent(`Báo Cáo Hải Lê Mart - Ngày ${todayStr}`);
    const body = encodeURIComponent(`Báo cáo TỔNG NGÀY ${todayStr}:\n- Đã bán: ${sold} món\n- TIỀN MẶT: ${Math.round(cash).toLocaleString()}đ\n- CHUYỂN KHOẢN: ${Math.round(transfer).toLocaleString()}đ\n- Lợi nhuận: ${Math.round(prof).toLocaleString()}đ`);
    window.location.href = `mailto:lehonghaikt6@gmail.com?subject=${sub}&body=${body}`;
  };

  const requestSort = (key: string) => {
    if (sortConfig && sortConfig.key === key) {
      if (sortConfig.direction === 'asc') setSortConfig({ key, direction: 'desc' });
      else setSortConfig(null);
    } else { setSortConfig({ key, direction: 'asc' }); }
  };

  const handleFilterCheck = (col: string, val: any) => {
    setFilters(prev => {
        const cur = prev[col] || [];
        if (cur.includes(val)) return { ...prev, [col]: cur.filter(v => v !== val) };
        return { ...prev, [col]: [...cur, val] };
    });
  };

  const toggleDateGroup = (dateStr: string) => setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));

  const handleLoginSubmit = (e: React.FormEvent) => { handleLogin(e); };

  // ================= 7. RENDER HELPERS =================
  const renderHeaderIcon = (colKey: string) => {
    const isFiltered = filters[colKey]?.length > 0;
    const isSortedAsc = sortConfig?.key === colKey && sortConfig.direction === 'asc';
    const isSortedDesc = sortConfig?.key === colKey && sortConfig.direction === 'desc';
    let icon = '🔽'; 
    if (isSortedAsc) icon = '🔼';
    if (isSortedDesc) icon = '🔽';
    return (
        <span 
          onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === colKey ? null : colKey); }} 
          style={{ cursor: "pointer", color: isFiltered || sortConfig?.key === colKey ? '#ef4444' : '#94a3b8', fontSize: "10px", padding: "2px", marginLeft: "4px", border: isFiltered ? "1px dashed #ef4444" : "1px solid transparent", borderRadius: "2px" }}
          title="Bấm để lọc"
        >
          {icon}
        </span>
    );
  };

  const renderFilterPopup = (colKey: string, title: string, uniqueValues: any[], formatVal?: (v:any)=>string) => {
    if (openFilter !== colKey) return null;
    return (
        <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "100%", left: colKey==='name' ? "0" : "50%", transform: colKey==='name' ? "none" : "translateX(-50%)", backgroundColor: "#fff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px", zIndex: 999, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)", minWidth: "160px", textAlign: "left", color: "#1e293b", fontWeight: "normal", fontSize: "12px", display: "flex", flexDirection: "column" }}>
           <div style={{ marginTop: "10px", fontWeight: "bold", color: "#64748b", fontSize: "10px", marginBottom: "6px", textTransform: "uppercase" }}>LỌC {title}:</div>
           <div style={{ overflowY: "auto", flex: 1, maxHeight: "150px", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "4px" }}>
               <label style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px", cursor: "pointer", borderBottom: "1px dashed #f1f5f9", backgroundColor: (!filters[colKey] || filters[colKey].length === 0) ? "#eff6ff" : "transparent" }}>
                  <input type="checkbox" checked={!filters[colKey] || filters[colKey].length === 0} onChange={() => setFilters(prev => ({...prev, [colKey]: []}))} />
                  <span style={{color: "#3b82f6", fontWeight: "bold"}}>Tất cả</span>
               </label>
               {uniqueValues.map((v, i) => (
                   <label key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px", cursor: "pointer", borderBottom: "1px dashed #f1f5f9", backgroundColor: filters[colKey]?.includes(v) ? "#f0fdf4" : "transparent" }}>
                      <input type="checkbox" checked={filters[colKey]?.includes(v) || false} onChange={() => handleFilterCheck(colKey, v)} />
                      <span>{formatVal ? formatVal(v) : v}</span>
                   </label>
               ))}
           </div>
           {filters[colKey]?.length > 0 && (
               <div style={{ marginTop: "8px", textAlign: "center", cursor: "pointer", color: "#ef4444", fontWeight: "bold", fontSize: "11px", padding: "4px" }} onClick={() => setFilters(prev => ({...prev, [colKey]: []}))}>❌ Bỏ lọc</div>
           )}
        </div>
    );
  };

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

  // ================= 8. STYLES CSS =================
  const styles = `
    @keyframes float { 0% { transform: translateY(0); } 50% { transform: translateY(-20px); } 100% { transform: translateY(0); } }
    @keyframes pulse-fast { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
    .spring-bg { position: fixed; width: 400px; height: 400px; border-radius: 50%; filter: blur(100px); z-index: -1; opacity: 0.3; animation: float 10s infinite ease-in-out; }
    .glass { background: rgba(255, 255, 255, 0.98); border: 1px solid #fed7aa; border-radius: 12px; box-shadow: 0 4px 15px rgba(251, 146, 60, 0.08); }
    body { background-color: #fff7ed; margin: 0; font-family: 'Inter', sans-serif; color: #431407; }
    .qty-btn { padding: 2px 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: #f8fafc; cursor: pointer; font-weight: bold; }
    .tab-btn { padding: 6px 12px; border-radius: 20px; border: 1px solid #fed7aa; background: #fff; cursor: pointer; font-size: 12px; font-weight: bold; color: #9a3412; white-space: nowrap; }
    .tab-btn.active { background: #ef4444; color: #fff; border-color: #ef4444; }
    .print-only { display: none; }
    
    /* FIX LỖI ẨN THẺ KHI IN: Bắt buộc hiển thị khối in thẻ bằng flex */
    .print-only.print-customer-card { display: flex !important; justify-content: center; align-items: center; }

    .qty-input { width: 28px; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px; outline: none; font-size: 11px; font-weight: bold; color: #1e293b; padding: 3px 0; background: #fff; }
    .qty-input::-webkit-outer-spin-button, .qty-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .qty-input[type=number] { -moz-appearance: textfield; }
    .add-to-cart-btn { padding: 8px 16px; background-color: #fbbf24; color: #78350f; border: none; border-radius: 6px; font-weight: 900; cursor: pointer; font-size: 12px; transition: transform 0.1s, background-color 0.2s; box-shadow: 0 2px 4px rgba(251, 191, 36, 0.3); }
    .add-to-cart-btn:hover { background-color: #f59e0b; transform: scale(1.05); }
    .add-to-cart-btn:active { transform: scale(0.95); }
    .input-label { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; }
    .input-label-red { font-size: 10px; font-weight: bold; color: #ef4444; text-transform: uppercase; }
    .input-label-green { font-size: 10px; font-weight: bold; color: #10b981; text-transform: uppercase; }

    @media print { 
      body, html { background: white !important; margin: 0 !important; padding: 0 !important; color: #000; } 
      .no-print { display: none !important; } 
      .print-only.print-receipt { display: block !important; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; width: 80mm; margin: 0 auto; padding: 5mm; box-sizing: border-box; font-size: 12px; line-height: 1.4; }
      .print-header { text-align: center; margin-bottom: 10px; }
      .print-header h2 { margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }
      .print-header p { margin: 2px 0; font-size: 11px; color: #333; }
      .print-divider { border-top: 1px dashed #000; margin: 8px 0; }
      .print-info { font-size: 11px; display: flex; justify-content: space-between; margin-bottom: 5px; }
      .print-item-name { font-weight: bold; text-align: left; padding-top: 5px; padding-bottom: 2px; }
      .print-item-details { display: flex; justify-content: space-between; font-size: 11px; color: #444; padding-bottom: 5px; }
      .print-gift { font-size: 10px; font-style: italic; color: #555; padding-left: 10px; padding-bottom: 3px; }
      .print-totals { margin-top: 10px; font-size: 12px; }
      .print-totals-row { display: flex; justify-content: space-between; padding: 3px 0; }
      .print-grand-total { display: flex; justify-content: space-between; font-size: 18px; font-weight: 900; border-top: 2px dashed #000; padding-top: 8px; margin-top: 5px; }
      .print-footer { text-align: center; font-size: 11px; margin-top: 15px; }
      
      .print-only.print-barcode-sheet { display: flex !important; flex-wrap: wrap; gap: 15px; justify-content: center; padding: 10mm; }
      .barcode-sticker { width: 30%; text-align: center; margin-bottom: 15px; border: 1px dashed #ccc; padding: 8px; page-break-inside: avoid; }
      
      /* QUAN TRỌNG: CSS ĐỂ IN THẺ KHÁCH HÀNG */
      .print-only.print-customer-card { display: flex !important; justify-content: center; align-items: center; height: 100vh; padding: 0; }

      @page { margin: 0; } 
    }
  `;

  // ================= 9. GIAO DIỆN ĐĂNG NHẬP =================
  if (!isLoggedIn) {
     return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", position: "relative", overflow: "hidden" }}>
        <style>{styles}</style>
        <div className="spring-bg" style={{ background: "#ef4444", top: "-10%", left: "-10%" }}></div>
        <div className="spring-bg" style={{ background: "#fbbf24", bottom: "-10%", right: "-10%" }}></div>
        <div className="glass" style={{ padding: "40px", width: "100%", maxWidth: "380px", textAlign: "center", border: "4px solid #ef4444" }}>
          
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "30px" }}>
            <div style={{ backgroundColor: "#dc2626", padding: "16px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 25px rgba(220, 38, 38, 0.3)", marginBottom: "15px" }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            </div>
            <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "900", letterSpacing: "1px", color: "#0f172a", textTransform: "uppercase" }}>HẢI LÊ <span style={{color: "#dc2626"}}>MART</span></h1>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "800", letterSpacing: "4px", textTransform: "uppercase", marginTop: "5px" }}>Professional POS</span>
          </div>

          <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <select value={shift} onChange={e => setShift(e.target.value)} style={{ padding: "14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontWeight: "bold", color: "#1e293b", backgroundColor: "#f8fafc" }}>
              <option value="Ca Sáng">🌅 Ca Sáng (06:00 - 14:00)</option>
              <option value="Ca Chiều">🌇 Ca Chiều (14:00 - 22:00)</option>
              <option value="Ca Tối">🌙 Ca Tối (22:00 - 06:00)</option>
            </select>
            <input placeholder="Tên đăng nhập (admin / nhanvien)" value={authUsername} onChange={e => setAuthUsername(e.target.value)} style={{ padding: "14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none" }} />
            <input type="password" placeholder="Mật khẩu" value={authPassword} onChange={e => setAuthPassword(e.target.value)} style={{ padding: "14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none" }} />
            <button type="submit" style={{ padding: "14px", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 6px rgba(220, 38, 38, 0.3)" }}>MỞ CỬA BÁN HÀNG 🚀</button>
          </form>
        </div>
      </div>
    );
  }

  // ================= 10. GIAO DIỆN CHÍNH APP =================
  return (
    <div onClick={() => { setOpenFilter(null); setShowSuggestions(false); }}>
      <style>{styles}</style>
      
      {/* 🖨️ BIÊN LAI BÁN HÀNG (SẼ CHẠY KHI IN) */}
      {lastOrder && printMode === 'receipt' && (
        <div className="print-only print-receipt">
          <div className="print-header">
            <h2>HẢI LÊ MART</h2>
            <p>Tòa Nhà ATS, 252 Hoàng Quốc Việt, HN</p>
            <p>Hotline: 0902 613 899</p>
          </div>
          <div className="print-divider"></div>
          <div className="print-info">
            <div><div><b>HĐ:</b> {lastOrder.orderId}</div><div><b>Ngày:</b> {lastOrder.time.split(' ')[1]} {lastOrder.time.split(' ')[0]}</div></div>
            <div style={{ textAlign: "right" }}><div><b>Ca:</b> {shift}</div><div><b>TN:</b> {role}</div></div>
          </div>
          <div className="print-divider"></div>
          <div style={{ width: "100%" }}>
            {lastOrder.cart.map((item: any, idx: number) => {
              const price = Math.round(getActualPrice(item.product));
              const itemTotal = Math.round((Number(item.qty)||0) * price);
              const gift = parseGift(item.product.gift_info);
              const hasGift = gift.text && (Number(item.qty)||0) >= gift.cond;

              return (
                <div key={idx} style={{ borderBottom: "1px dotted #ccc" }}>
                  <div className="print-item-name">{cleanName(item.product.name)} {item.product.isHappyHour && <span style={{fontSize:"9px", fontStyle:"italic"}}>[Giờ Vàng]</span>}</div>
                  <div className="print-item-details">
                    <span>{item.qty} x {price.toLocaleString()}</span>
                    <span style={{ fontWeight: "bold" }}>{itemTotal.toLocaleString()}</span>
                  </div>
                  {hasGift && <div className="print-gift">+ 🎁 Tặng: {gift.text}</div>}
                </div>
              );
            })}
          </div>
          <div className="print-divider"></div>
          <div className="print-totals">
            <div className="print-totals-row"><span>Cộng tiền hàng:</span><span>{Math.round(lastOrder.subTotal).toLocaleString()}đ</span></div>
            <div className="print-totals-row"><span>Thuế GTGT ({VAT_RATE * 100}%):</span><span>{Math.round(lastOrder.vatTotal).toLocaleString()}đ</span></div>
            {lastOrder.discount > 0 && <div className="print-totals-row"><span>Giảm giá/Ví:</span><span>-{Math.round(lastOrder.discount).toLocaleString()}đ</span></div>}
            <div className="print-grand-total">
              <span>{lastOrder.debtAmount > 0 ? "KHÁCH NỢ:" : "TỔNG CỘNG:"}</span>
              <span>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</span>
            </div>
            
            {lastOrder.paymentMethod === 'TIỀN MẶT' && lastOrder.customerGiven > 0 && (
              <div style={{ marginTop: '8px', borderTop: '1px dotted #ccc', paddingTop: '5px' }}>
                <div className="print-totals-row"><span>Tiền khách đưa:</span><span>{Math.round(lastOrder.customerGiven).toLocaleString()}đ</span></div>
                <div className="print-totals-row"><span><b>Tiền trả lại:</b></span><span><b>{Math.round(lastOrder.customerGiven - lastOrder.finalTotal).toLocaleString()}đ</b></span></div>
              </div>
            )}
            {lastOrder.paymentMethod === 'CHUYỂN KHOẢN' && (
              <div style={{ marginTop: '8px', borderTop: '1px dotted #ccc', paddingTop: '5px' }}>
                <div className="print-totals-row"><span>Hình thức TT:</span><span>Chuyển khoản (VietQR)</span></div>
              </div>
            )}
          </div>
          <div className="print-footer">
            <div><b>CẢM ƠN QUÝ KHÁCH & HẸN GẶP LẠI!</b></div>
            <div style={{ marginTop: "5px", fontSize: "10px", color: "#666" }}><i>Powered by Hải Lê POS</i></div>
          </div>
        </div>
      )}

      {/* 🖨️ TRANG IN THẺ KHÁCH HÀNG VIP */}
      {printMode === 'customer_card' && printCustomer && (
        <div className="print-only print-customer-card">
          <div style={{ width: "85.6mm", height: "53.98mm", border: "3px solid #dc2626", borderRadius: "12px", padding: "15px", textAlign: "center", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", backgroundColor: "#fff7ed" }}>
            <h2 style={{margin: "0 0 5px 0", color: "#b91c1c", fontSize: "20px", textTransform: "uppercase", fontWeight: "900"}}>HẢI LÊ MART</h2>
            <div style={{fontSize: "10px", fontWeight: "bold", color: "#ea580c", letterSpacing: "2px", marginBottom: "10px"}}>THẺ KHÁCH HÀNG THÂN THIẾT</div>
            <div style={{fontSize: "18px", fontWeight: "bold", color: "#0f172a", textTransform: "uppercase"}}>{printCustomer.name}</div>
            <img 
                 src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(printCustomer.cardCode || printCustomer.phone)}&scale=2&height=10&includetext=false`} 
                 onError={(e) => { e.currentTarget.src = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(printCustomer.cardCode || printCustomer.phone)}&code=Code128&translate-esc=on`; }}
                 style={{maxWidth: "100%", height: "45px", marginTop: "10px", margin: "10px auto 0 auto", display: "block"}} 
                 alt="barcode" 
              />
            <div style={{fontSize: "12px", fontFamily: "monospace", letterSpacing: "2px", marginTop: "4px", fontWeight: "bold"}}>{printCustomer.cardCode || printCustomer.phone}</div>
          </div>
        </div>
      )}

      {/* 🖨️ TRANG IN TEM MÃ VẠCH SẢN PHẨM */}
      {printMode === 'barcode' && printBarcodeProduct && (
        <div className="print-only print-barcode-sheet">
          {Array.from({length: barcodeCount}).map((_, i) => (
            <div key={i} className="barcode-sticker">
              <div style={{fontSize: "11px", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{cleanName(printBarcodeProduct.name)}</div>
              <img 
                 src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(printBarcodeProduct.product_code)}&scale=2&height=10&includetext=false`} 
                 onError={(e) => { e.currentTarget.src = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(printBarcodeProduct.product_code)}&code=Code128&translate-esc=on`; }}
                 style={{maxWidth: "100%", height: "40px", marginTop: "4px"}} 
                 alt={printBarcodeProduct.product_code} 
              />
              <div style={{fontSize: "10px", fontFamily: "monospace", letterSpacing: "1px", color: "#333"}}>{printBarcodeProduct.product_code}</div>
              <div style={{fontSize: "14px", fontWeight: "900", color: "#000", marginTop: "2px"}}>{getActualPrice(printBarcodeProduct).toLocaleString()}đ</div>
            </div>
          ))}
        </div>
      )}

      {/* CÁC MODAL HIỂN THỊ */}
      {showHoldModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div className="glass" style={{ padding: "25px", width: "400px", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #fed7aa", paddingBottom: "10px", marginBottom: "10px" }}>
              <h2 style={{ margin: 0, color: "#f59e0b" }}>📂 ĐƠN CHỜ THANH TOÁN</h2>
              <button onClick={() => setShowHoldModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✖</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {heldOrders.length === 0 && <div style={{textAlign: "center", color: "#94a3b8", marginTop: "20px"}}>Không có đơn hàng nào lưu tạm.</div>}
              {heldOrders.map((order, idx) => (
                <div key={order.id} style={{ padding: "10px", borderBottom: "1px dashed #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fffbeb", borderRadius: "8px", marginBottom: "8px" }}>
                  <div>
                    <div style={{ fontWeight: "bold", color: "#1e293b" }}>Đơn #{idx + 1}</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>⏰ Lưu lúc: {order.time}</div>
                    <div style={{ fontSize: "11px", color: "#b91c1c", fontWeight: "bold" }}>Gồm {order.cart.reduce((s:any,i:any)=>s+(Number(i.qty)||0),0)} sản phẩm</div>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button onClick={() => restoreOrder(order)} style={{ padding: "6px 10px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" }}>MỞ LẠI</button>
                    <button onClick={() => deleteHeldOrder(order.id)} style={{ padding: "6px", background: "#fee2e2", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: "6px", cursor: "pointer", fontSize: "11px" }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAuditModal && role === 'admin' && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div className="glass" style={{ padding: "25px", width: "600px", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #cbd5e1", paddingBottom: "10px", marginBottom: "10px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <h2 style={{ margin: 0, color: "#334155" }}>🕵️ NHẬT KÝ THAO TÁC HỆ THỐNG</h2>
                <button onClick={exportAuditToCSV} style={{ fontSize: "10px", padding: "4px 8px", background: "#10b981", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>📥 XUẤT FILE</button>
              </div>
              <button onClick={() => setShowAuditModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✖</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, fontSize: "12px" }}>
              {auditLogs.length === 0 && <div style={{textAlign: "center", color: "#94a3b8", marginTop: "20px"}}>Chưa có bản ghi nào.</div>}
              {auditLogs.map((log, idx) => (
                <div key={idx} style={{ padding: "8px", borderBottom: "1px dashed #e2e8f0", backgroundColor: idx % 2 === 0 ? "#f8fafc" : "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontWeight: "bold", color: "#b91c1c" }}>[{log.action}]</span>
                    <span style={{ color: "#64748b" }}>{log.time}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{log.detail}</span>
                    <span style={{ fontWeight: "bold", color: "#3b82f6" }}>{log.user} ({log.shift})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showHandoverModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div className="glass" style={{ padding: "30px", width: "350px", textAlign: "center" }}>
            <h2 style={{ margin: "0 0 15px 0", color: "#ef4444", fontSize: "22px" }}>📋 BIÊN BẢN CHỐT CA</h2>
            <div style={{ backgroundColor: "#fff7ed", padding: "15px", borderRadius: "10px", border: "1px dashed #fdba74", textAlign: "left", fontSize: "14px", lineHeight: "1.8" }}>
              <div>👤 Người trực: <b>{role === 'admin' ? "Quản lý" : "Thu ngân"}</b></div>
              <div>⏰ Ca làm việc: <b style={{color: "#b91c1c"}}>{shift}</b></div>
              <div style={{ borderTop: "1px solid #fed7aa", margin: "10px 0" }}></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>💵 Tổng thu ca này:</span><b style={{color: "#059669", fontSize: "16px"}}>{currentShiftStats.rev.toLocaleString()}đ</b></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color:"#64748b" }}><span>- Tiền mặt:</span><b>{currentShiftStats.cash.toLocaleString()}đ</b></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color:"#64748b", marginBottom: "8px" }}><span>- Chuyển khoản:</span><b>{currentShiftStats.transfer.toLocaleString()}đ</b></div>
              {role === 'admin' && <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed #fed7aa", paddingTop: "8px" }}><span>📈 Lợi nhuận ca này:</span><b style={{color: "#3b82f6"}}>{currentShiftStats.prof.toLocaleString()}đ</b></div>}
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "10px", fontStyle: "italic", textAlign: "center" }}>*Doanh thu đã được tự động lưu vào Lịch sử tổng.</div>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={() => setShowHandoverModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#e2e8f0", fontWeight: "bold", cursor: "pointer" }}>Hủy</button>
              <button onClick={confirmHandover} style={{ flex: 2, padding: "12px", backgroundColor: "#ef4444", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>✔️ ĐĂNG XUẤT</button>
            </div>
          </div>
        </div>
      )}

      {/* TÍNH NĂNG IN THẺ VÀ GỬI THẺ VIP */}
      {showCustomerModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div className="glass" style={{ padding: "25px", width: "550px", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #c7d2fe", paddingBottom: "10px", marginBottom: "10px" }}>
              <h2 style={{ margin: 0, color: "#4f46e5" }}>🤝 QUẢN LÝ KHÁCH HÀNG</h2>
              <button onClick={() => setShowCustomerModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✖</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {Object.keys(customers).length === 0 && <div style={{textAlign: "center", color: "#94a3b8", marginTop: "20px"}}>Chưa có dữ liệu khách hàng.</div>}
              {Object.keys(customers).map(phone => (
                <div key={phone} style={{ padding: "10px", borderBottom: "1px dashed #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{flex: 1, minWidth: "200px"}}>
                    <div style={{ fontWeight: "bold", color: "#1e293b", cursor: "pointer" }} onClick={() => {
                      const newName = window.prompt("Sửa tên khách hàng:", customers[phone].name);
                      if(newName) { setCustomers((prev:any) => ({...prev, [phone]: {...prev[phone], name: newName}})); logAudit("SỬA KHÁCH HÀNG", `Đổi tên KH ${phone} thành ${newName}`); }
                    }} title="Bấm để sửa tên">{customers[phone].name} ✏️</div>
                    
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                      {phone} 
                      <span style={{cursor: "pointer", color: "#3b82f6", fontWeight: "bold", marginLeft: "6px"}} onClick={() => {
                          const newEmail = window.prompt("Sửa Email khách hàng:", customers[phone].email || "");
                          if(newEmail !== null) { setCustomers((prev:any) => ({...prev, [phone]: {...prev[phone], email: newEmail.trim()}})); logAudit("SỬA EMAIL KH", `Cập nhật Email KH ${phone}`); }
                      }} title="Bấm để cập nhật Email">
                        {customers[phone].email ? `📧 ${customers[phone].email}` : `📧 +Thêm Mail`}
                      </span>
                    </div>

                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span onClick={() => {
                          const newCard = window.prompt("Nhập/Sửa mã Thẻ cứng của khách:", customers[phone].cardCode || "");
                          if(newCard !== null) { setCustomers((prev:any) => ({...prev, [phone]: {...prev[phone], cardCode: newCard.trim()}})); logAudit("SỬA MÃ THẺ", `Cập nhật mã thẻ KH ${phone}`); }
                      }} style={{cursor: "pointer", color: "#ea580c", fontWeight: "bold", marginRight: "10px"}} title="Cài đặt mã Thẻ thành viên (Barcode)">
                          {customers[phone].cardCode ? `💳 Mã: ${customers[phone].cardCode}` : `💳 +Gán Mã Thẻ`}
                      </span>
                      <button onClick={() => printCustomerCard(phone)} style={{ padding: "4px 6px", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "9px", fontWeight: "bold" }} title="In thẻ cứng (Cỡ thẻ ATM)">🖨️ In Thẻ</button>
                      <button onClick={() => sendCardEmail(phone)} style={{ padding: "4px 6px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "9px", fontWeight: "bold" }} title="Gửi mã thẻ qua Email tự động">📧 Mail</button>
                      <button onClick={() => shareToZalo(phone)} style={{ padding: "4px 6px", backgroundColor: "#059669", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "9px", fontWeight: "bold" }} title="Copy ảnh và mở Zalo">💬 Zalo</button>
                    </div>

                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#10b981", fontWeight: "bold", fontSize: "12px" }}>Ví: {(customers[phone].wallet || 0).toLocaleString()}đ</div>
                    <div style={{ color: "#ef4444", fontWeight: "bold", fontSize: "12px" }}>Nợ: {(customers[phone].debt || 0).toLocaleString()}đ</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showDebtModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div className="glass" style={{ padding: "25px", width: "400px", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #fed7aa", paddingBottom: "10px", marginBottom: "10px" }}>
              <h2 style={{ margin: 0, color: "#ef4444" }}>📓 SỔ GHI NỢ</h2>
              <button onClick={() => setShowDebtModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✖</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {Object.keys(customers).filter(p => (customers[p].debt || 0) > 0).map(phone => (
                <div key={phone} style={{ padding: "10px", borderBottom: "1px dashed #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "bold", color: "#1e293b" }}>{customers[phone].name}</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>{phone}</div>
                    <div style={{ color: "#ef4444", fontWeight: "bold" }}>Nợ: {(customers[phone].debt || 0).toLocaleString()}đ</div>
                  </div>
                  <button onClick={() => handlePayDebt(phone)} style={{ padding: "6px 12px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" }}>THU TIỀN</button>
                </div>
              ))}
              {Object.keys(customers).filter(p => (customers[p].debt || 0) > 0).length === 0 && <div style={{textAlign: "center", color: "#94a3b8", marginTop: "20px"}}>Không có khoản nợ nào.</div>}
            </div>
          </div>
        </div>
      )}

      {showStatsModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div className="glass" style={{ padding: "25px", width: "450px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #fed7aa", paddingBottom: "10px", marginBottom: "15px" }}>
              <h2 style={{ margin: 0, color: "#3b82f6" }}>📊 BÁO CÁO NHANH</h2>
              <button onClick={() => setShowStatsModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✖</button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              <div style={{ backgroundColor: "#fef2f2", padding: "10px", borderRadius: "8px", border: "1px solid #fecaca", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#ef4444", fontWeight: "bold" }}>TỔNG BÁN RA (Cả Nợ)</div>
                <div style={{ fontSize: "14px", fontWeight: "bold", color: "#b91c1c", marginTop: "4px" }}>{todayStats.totalSales.toLocaleString()}đ</div>
              </div>
              <div style={{ backgroundColor: "#eff6ff", padding: "10px", borderRadius: "8px", border: "1px solid #bfdbfe", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#3b82f6", fontWeight: "bold" }}>THỰC THU (Mặt+CK)</div>
                <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1e3a8a", marginTop: "4px" }}>{todayStats.rev.toLocaleString()}đ</div>
              </div>
              <div style={{ backgroundColor: "#f0fdf4", padding: "10px", borderRadius: "8px", border: "1px solid #bbf7d0", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "#16a34a", fontWeight: "bold" }}>TỔNG LÃI GỘP</div>
                <div style={{ fontSize: "14px", fontWeight: "bold", color: "#14532d", marginTop: "4px" }}>{todayStats.prof.toLocaleString()}đ</div>
              </div>
            </div>

            <h3 style={{ fontSize: "14px", color: "#1e293b", marginTop: 0 }}>🏆 Top 5 Bán Chạy Nhất</h3>
            {topSelling.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed #e2e8f0", fontSize: "13px" }}>
                <span>{idx + 1}. {cleanName(item[0])}</span><span style={{fontWeight: "bold", color: "#10b981"}}>{item[1]} món</span>
              </div>
            ))}
            <h3 style={{ fontSize: "14px", color: "#b91c1c", marginTop: "20px" }}>📉 Sắp hết hàng (Dưới 10)</h3>
            {products.filter(p=>p.stock < 10).slice(0,5).map((p, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed #e2e8f0", fontSize: "13px" }}>
                <span>{cleanName(p.name)}</span><span style={{fontWeight: "bold", color: "#ef4444"}}>Còn {p.stock}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {scannerMode !== null && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.9)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 10000 }}>
          <div style={{ background: "#fff", padding: "10px", borderRadius: "12px", width: "90%", maxWidth: "400px", position: "relative" }}>
            <h3 style={{ margin: "0 0 10px 0", textAlign: "center", color: "#b91c1c" }}>
              {scannerMode === 'voucher' ? '📷 Quét mã Voucher' : (scannerMode === 'customer' ? '📷 Quét Thẻ VIP' : '📷 Đưa mã vạch vào khung')}
            </h3>
            {scanMessage && (
              <div style={{ position: "absolute", top: "50px", left: "50%", transform: "translateX(-50%)", padding: "8px 16px", backgroundColor: scanMessage.type === 'success' ? "#10b981" : "#ef4444", color: "#fff", fontWeight: "bold", borderRadius: "20px", zIndex: 10001, boxShadow: "0 4px 6px rgba(0,0,0,0.3)", animation: "float 0.5s ease-out" }}>
                {scanMessage.text}
              </div>
            )}
            <div id="qr-reader" style={{ width: "100%" }}></div>
            <button onClick={() => setScannerMode(null)} style={{ width: "100%", padding: "12px", marginTop: "15px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>ĐÓNG CAMERA</button>
          </div>
        </div>
      )}

      {/* --- GIAO DIỆN CHÍNH --- */}
      <div className="no-print" style={{ padding: "15px", position: "relative", minHeight: "100vh", overflowX: "auto" }}>
        <div className="spring-bg" style={{ background: "#ef4444", top: "10%", left: "5%" }}></div>
        <div className="spring-bg" style={{ background: "#f59e0b", bottom: "10%", right: "5%" }}></div>

        {/* 💳 POPUP THANH TOÁN */}
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

                {/* Ô NHẬP KHÁCH HÀNG MỚI - QUẸT THẺ VIP */}
                <div style={{ display: "flex", position: "relative", marginTop: "10px" }}>
                  <input type="text" placeholder="👉 Quẹt Thẻ VIP / SĐT khách..." value={customerInput} onChange={handleCustomerInputChange} style={{ flex: 1, padding: "12px", borderRadius: "10px 0 0 10px", border: "2px solid #ef4444", outline: "none", boxSizing: "border-box", fontWeight: "bold", color: "#b91c1c" }} />
                  <button onClick={() => setScannerMode('customer')} style={{ padding: "0 15px", backgroundColor: "#ef4444", border: "none", borderRadius: "0 10px 10px 0", cursor: "pointer", color: "white", fontSize: "18px" }} title="Quét thẻ VIP bằng Camera">📷</button>
                </div>
                
                {custPhone && (
                  <div style={{ marginTop: "10px", padding: "12px", backgroundColor: "#fff7ed", borderRadius: "8px", border: "1px dashed #f97316" }}>
                    {customers[custPhone] ? (
                      <div><div style={{ color: "#b91c1c", fontWeight: "bold" }}>⭐ {customers[custPhone].name}</div>
                        <div>Ví điểm: <b>{Math.round(customers[custPhone].wallet || 0).toLocaleString()}đ</b> | Nợ: <b style={{color:"#ef4444"}}>{(customers[custPhone].debt || 0).toLocaleString()}đ</b></div>
                        {(customers[custPhone].wallet || 0) > 0 && <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", cursor: "pointer", color: "#ea580c", fontWeight: "bold" }}><input type="checkbox" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} /> Dùng điểm lì xì!</label>}
                      </div>
                    ) : <input type="text" placeholder="Tên khách mới..." value={custName} onChange={e => setCustName(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", outline: "none", border: "1px solid #fdba74", boxSizing: "border-box" }} />}
                  </div>
                )}
                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                  <button onClick={() => setIsCheckoutOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#e2e8f0", fontWeight: "bold", cursor: "pointer" }}>Hủy</button>
                  <button onClick={handleNextToQR} style={{ flex: 2, padding: "10px", backgroundColor: "#ef4444", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>TIẾP TỤC 👉</button>
                </div>
              </div>
            )}
            
            {checkoutStep === 2 && (
              <div className="glass" style={{ padding: "25px", width: "350px", textAlign: "center" }}>
                <h3 style={{ color: "#ef4444", margin: "0" }}>📱 THANH TOÁN QUẦY</h3>
                <div style={{ color: "#ef4444", fontSize: "28px", fontWeight: "900", margin: "10px 0" }}>{finalToPay.toLocaleString()}đ</div>
                
                <div style={{ position: "relative" }}>
                   <img src={`https://img.vietqr.io/image/970422-0680124181004-compact2.png?amount=${finalToPay}&addInfo=Thanh toan&accountName=LE%20HONG%20HAI`} style={{ width: "160px", margin: "0 auto 10px auto", border: "2px solid #ef4444", borderRadius: "10px", display: "block" }} />
                   <div style={{ animation: "pulse-fast 1.5s infinite", color: "#b45309", fontSize: "11px", fontWeight: "bold", marginBottom: "5px" }}>⏳ Đang chờ nhận tiền...</div>
                   <div style={{ backgroundColor: "#fef2f2", color: "#b91c1c", fontSize: "10px", padding: "6px", borderRadius: "4px", border: "1px dashed #ef4444", marginBottom: "15px", textAlign: "left", lineHeight: "1.4" }}><b>⚠️ CHÚ Ý:</b> KHÔNG NHÌN MÀN HÌNH KHÁCH. CHỈ BẤM <b>[CHUYỂN KHOẢN]</b> KHI APP NGÂN HÀNG BÁO CÓ TIỀN!</div>
                </div>
                
                <div style={{ marginBottom: "15px", textAlign: "left", borderTop: "1px dashed #cbd5e1", paddingTop: "10px" }}>
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold", marginBottom: "5px" }}>Tiền mặt khách đưa (Chỉ dùng nếu trả Tiền mặt):</div>
                  <input type="number" placeholder="Nhập số tiền..." value={customerGiven} onChange={e => setCustomerGiven(Number(e.target.value) || "")} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", boxSizing: "border-box", fontSize: "14px", fontWeight: "bold" }} />
                  <div style={{ display: "flex", gap: "5px", marginTop: "8px", flexWrap: "wrap" }}>
                    <button onClick={()=>setCustomerGiven(finalToPay)} style={{flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid #cbd5e1", cursor: "pointer"}}>Vừa đủ</button>
                    <button onClick={()=>setCustomerGiven(50000)} style={{flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid #cbd5e1", cursor: "pointer"}}>50k</button>
                    <button onClick={()=>setCustomerGiven(100000)} style={{flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid #cbd5e1", cursor: "pointer"}}>100k</button>
                    <button onClick={()=>setCustomerGiven(200000)} style={{flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid #cbd5e1", cursor: "pointer"}}>200k</button>
                    <button onClick={()=>setCustomerGiven(500000)} style={{flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid #cbd5e1", cursor: "pointer"}}>500k</button>
                  </div>
                  {customerGiven !== "" && Number(customerGiven) >= finalToPay && <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#ecfdf5", border: "1px dashed #10b981", borderRadius: "8px", color: "#059669", fontWeight: "bold", fontSize: "16px", textAlign: "center" }}>THỐI LẠI: {(Number(customerGiven) - finalToPay).toLocaleString()}đ</div>}
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button onClick={() => setCheckoutStep(1)} style={{ flex: "1 1 100%", padding: "8px", borderRadius: "8px", border: "none", background: "#e2e8f0", cursor: "pointer", fontWeight: "bold" }}>Quay lại</button>
                  <button onClick={() => confirmCheckout('GHI NỢ')} disabled={loading} style={{ flex: 1, padding: "10px", backgroundColor: "#f59e0b", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "11px" }}>📝 GHI NỢ</button>
                  <button onClick={() => confirmCheckout('CHUYỂN KHOẢN')} disabled={loading} style={{ flex: 1, padding: "10px", backgroundColor: "#3b82f6", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "11px" }}>💳 CHUYỂN KHOẢN</button>
                  <button onClick={() => {
                      if (finalToPay > 0 && (customerGiven === "" || Number(customerGiven) < finalToPay)) { playSound('error'); alert(`Khách đưa chưa đủ tiền mặt! Cần thanh toán: ${finalToPay.toLocaleString()}đ`); return; }
                      confirmCheckout('TIỀN MẶT');
                  }} disabled={loading} style={{ flex: 1, padding: "10px", backgroundColor: "#10b981", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "11px" }}>💵 TIỀN MẶT</button>
                </div>
              </div>
            )}
            {checkoutStep === 3 && (
              <div className="glass" style={{ padding: "30px", width: "350px", textAlign: "center" }}>
                <div style={{ fontSize: "40px" }}>🌸</div><h3 style={{ color: "#10b981", margin: "10px 0" }}>Thành công!</h3>
                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                  <button onClick={() => { setPrintMode('receipt'); setTimeout(()=>window.print(), 300); }} style={{ flex: 1, padding: "12px", backgroundColor: "#ef4444", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "12px" }}>🖨️ In Hóa Đơn</button>
                  <button onClick={sendReceiptEmail} disabled={loading} style={{ flex: 1, padding: "12px", backgroundColor: "#3b82f6", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "12px" }}>{loading ? "Đang gửi..." : "📧 Gửi Email"}</button>
                  <button onClick={closeCheckout} style={{ flex: 1, padding: "12px", backgroundColor: "#e2e8f0", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "12px", color: "#1e293b" }}>Đóng</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ maxWidth: "1500px", margin: "0 auto", minWidth: "1000px" }}>
          <div className="glass" style={{ padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "4px solid #ef4444" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <HeaderLogo />
              <div style={{ display: "flex", gap: "6px" }}>
                {role === 'admin' && (
                  <>
                    <button onClick={() => setShowStatsModal(true)} style={{ padding: "6px 12px", background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap" }}>📊 THỐNG KÊ</button>
                    <button onClick={() => setShowCustomerModal(true)} style={{ padding: "6px 12px", background: "#fdf4ff", color: "#4f46e5", border: "1px solid #c7d2fe", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap" }}>🤝 KHÁCH HÀNG</button>
                    <button onClick={() => setShowAuditModal(true)} style={{ padding: "6px 12px", background: "#f8fafc", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap" }}>🕵️ LỊCH SỬ</button>
                  </>
                )}
                <button onClick={() => setShowDebtModal(true)} style={{ padding: "6px 12px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap" }}>📓 SỔ NỢ</button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {(new Date().getHours() >= 20 || new Date().getHours() < 6) && <span style={{fontSize:"11px", backgroundColor:"#fef08a", color:"#b45309", padding:"4px 8px", borderRadius:"4px", fontWeight:"bold", border: "1px solid #fde047", whiteSpace: "nowrap"}}>🌙 HAPPY HOUR</span>}
              <div style={{ width: "2px", height: "30px", backgroundColor: "#e2e8f0" }}></div>
              <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                {role === 'admin' && <div style={{ textAlign: "center", whiteSpace: "nowrap" }}><div style={{ fontSize: "10px", color: "#64748b", fontWeight: "bold" }}>VỐN</div><div style={{ fontSize: "14px", fontWeight: "900", color: "#475569" }}>{totalValue.toLocaleString()}đ</div></div>}
                <div style={{ textAlign: "center", whiteSpace: "nowrap" }}><div style={{ fontSize: "10px", color: "#64748b", fontWeight: "bold" }}>💵 THU TIỀN MẶT</div><div style={{ fontSize: "14px", fontWeight: "900", color: "#059669" }}>{currentShiftStats.cash.toLocaleString()}đ</div></div>
                <div style={{ textAlign: "center", whiteSpace: "nowrap" }}><div style={{ fontSize: "10px", color: "#64748b", fontWeight: "bold" }}>💳 CHUYỂN KHOẢN</div><div style={{ fontSize: "14px", fontWeight: "900", color: "#2563eb" }}>{currentShiftStats.transfer.toLocaleString()}đ</div></div>
                {role === 'admin' && <div style={{ textAlign: "center", whiteSpace: "nowrap" }}><div style={{ fontSize: "10px", color: "#64748b", fontWeight: "bold" }}>LÃI CA NÀY</div><div style={{ fontSize: "14px", fontWeight: "900", color: "#ea580c" }}>{currentShiftStats.prof.toLocaleString()}đ</div></div>}
              </div>
              <div style={{ width: "2px", height: "30px", backgroundColor: "#e2e8f0" }}></div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ textAlign: "right", lineHeight: "1.2", whiteSpace: "nowrap" }}><div style={{ fontSize: "12px", fontWeight: "bold", color: "#1e293b" }}>{role === 'admin' ? "Quản lý" : "Thu ngân"}</div><div style={{ fontSize: "10px", color: "#64748b" }}>{shift}</div></div>
                <button onClick={handleLogoutClick} style={{ padding: "8px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Đăng xuất">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line>
                  </svg>
                </button>
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
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "14px", color: "#b91c1c" }}>📋 NHẬT KÝ CA NÀY</h3>
                  {role === 'admin' && (
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button onClick={exportToCSV} style={{ fontSize: "9px", padding: "4px 6px", background: "#10b981", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>EXCEL TỔNG</button>
                      <button onClick={handleSendEmailReport} style={{ fontSize: "9px", padding: "4px 6px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>✉ CHỐT TỔNG</button>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
                    {Object.keys(groupedHistory).length === 0 && <div style={{textAlign: "center", color: "#94a3b8", fontSize: "11px", marginTop: "15px"}}>Chưa có dữ liệu giao dịch</div>}
                    {Object.keys(groupedHistory).map((date) => (
                      <div key={date}>
                        <div style={{backgroundColor: "#ffedd5", padding: "6px 10px", fontSize: "11px", fontWeight: "bold", border: "1px solid #fed7aa", borderRadius: "4px", marginTop: "6px"}}>{date}</div>
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
                        ))}</div>
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

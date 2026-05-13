import React, { useEffect, useState, useMemo } from "react";
// @ts-ignore
import { supabase } from "./supabaseClient";

export default function App() {
  const VAT_RATE = 0.1; 

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
  
  // THÊM STATE ĐỂ QUẢN LÝ SẮP XẾP SẢN PHẨM
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false); 
  const [showHandoverModal, setShowHandoverModal] = useState(false);

  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newImportPrice, setNewImportPrice] = useState(""); 
  const [newPrice, setNewPrice] = useState(""); 
  const [newPromoPrice, setNewPromoPrice] = useState(""); 
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

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); 
  const [custPhone, setCustPhone] = useState("");
  const [custName, setCustName] = useState("");
  const [useWallet, setUseWallet] = useState(false);
  const [voucherAmount, setVoucherAmount] = useState<number | "">(""); 
  const [customerGiven, setCustomerGiven] = useState<number | "">(""); 
  const [lastOrder, setLastOrder] = useState<any>(null);

  const [history, setHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem("mart_history");
    return saved ? JSON.parse(saved) : [];
  });

  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    localStorage.setItem("mart_history", JSON.stringify(history));
    localStorage.setItem("mart_customers", JSON.stringify(customers));
  }, [history, customers]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchProducts();
      const channel = supabase
        .channel("db_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchProducts())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isLoggedIn]);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setProducts(data);
  };

  const currentShiftStats = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('vi-VN');
    const shiftLogs = history.filter(h => {
       const hDate = new Date(Math.floor(h.id)).toLocaleDateString('vi-VN');
       return hDate === todayStr && h.shift === shift;
    });
    const rev = shiftLogs.reduce((s, h) => s + ((h.type === 'BÁN' || h.type === 'THU NỢ' || h.type === 'TRẢ HÀNG') ? h.total : 0), 0);
    const prof = shiftLogs.reduce((s, h) => s + (h.profit || 0), 0);
    return { rev, prof };
  }, [history, shift]);

  const exportToCSV = () => {
    if (history.length === 0) return alert("Chưa có lịch sử!");
    let csv = "\uFEFFGiờ,Ca Làm Việc,Loại,Khách,Sản phẩm,SL,Tổng(VAT),Lợi nhuận\n";
    history.forEach(log => {
      const time = new Date(Math.floor(log.id)).toLocaleString('vi-VN');
      csv += `${time},${log.shift || "Không rõ"},${log.type},${log.customer || "Khách lẻ"},${log.name},${log.qty},${Math.round(log.total)},${Math.round(log.profit || 0)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Bao_Cao_Hai_Le_Mart.csv`;
    link.click();
  };

  const handleSendEmailReport = () => {
    const todayStr = new Date().toLocaleDateString('vi-VN');
    const logs = history.filter(log => new Date(Math.floor(log.id)).toLocaleDateString('vi-VN') === todayStr);
    if (logs.length === 0) return alert("Chưa có giao dịch!");
    let rev = 0, prof = 0, sold = 0;
    logs.forEach(l => { if(l.type==='BÁN'){ rev += l.total; prof += (l.profit||0); sold += l.qty; } });
    const sub = encodeURIComponent(`Báo Cáo Hải Lê Mart - Ngày ${todayStr}`);
    const body = encodeURIComponent(`Báo cáo TỔNG NGÀY ${todayStr}:\n- Đã bán: ${sold} món\n- Doanh thu (có VAT): ${Math.round(rev).toLocaleString()}đ\n- Lợi nhuận: ${Math.round(prof).toLocaleString()}đ`);
    window.location.href = `mailto:lehonghaikt6@gmail.com?subject=${sub}&body=${body}`;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authUsername === "admin" && authPassword === "haile88") {
      setIsLoggedIn(true); setRole("admin"); localStorage.setItem("mart_shift", shift);
      localStorage.setItem("mart_logged_in", "true"); localStorage.setItem("mart_role", "admin");
    } else if (authUsername === "nhanvien" && authPassword === "123") {
      setIsLoggedIn(true); setRole("staff"); localStorage.setItem("mart_shift", shift);
      localStorage.setItem("mart_logged_in", "true"); localStorage.setItem("mart_role", "staff");
    } else alert("Sai tài khoản hoặc mật khẩu!");
  };

  const handleLogoutClick = () => setShowHandoverModal(true);

  const confirmHandover = () => {
    setIsLoggedIn(false); setShowHandoverModal(false);
    localStorage.removeItem("mart_logged_in"); localStorage.removeItem("mart_role");
  };

  const getActualPrice = (p: any) => (p.promo_price && p.promo_price > 0) ? p.promo_price : p.sale_price;

  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const p = products.find(prod => prod.product_code === barcodeInput.trim());
      if (p) {
        if (p.stock <= 0) return alert("Đã hết hàng trong kho!");
        const price = getActualPrice(p);
        const exist = cart.find(item => item.product.id === p.id);
        if (exist) {
          const newQty = exist.qty + 1;
          if (newQty > p.stock) return alert(`Không đủ hàng! Trong kho chỉ còn ${p.stock}.`);
          setCart(cart.map(i => i.product.id === p.id ? { ...i, qty: newQty, total: Math.round(newQty*price*(1+VAT_RATE)), profit: Math.round(newQty*(price - (p.import_price||0))) } : i));
        } else {
          setCart([...cart, { product: p, qty: 1, total: Math.round(price*(1+VAT_RATE)), profit: Math.round(price - (p.import_price||0)) }]);
        }
      } else alert("Mã sai!");
      setBarcodeInput(""); 
    }
  };

  const addToCart = (p: any) => {
    if (p.stock <= 0) return alert("Đã hết hàng trong kho!");
    const q = window.prompt(`Số lượng ${p.name} (Tồn: ${p.stock}):`, "1");
    if (q && parseInt(q) > 0) {
      const qty = parseInt(q); const pr = getActualPrice(p);
      const exist = cart.find(item => item.product.id === p.id);
      if (exist) {
        const newQty = exist.qty + qty;
        if (newQty > p.stock) return alert(`Không đủ hàng! Trong kho chỉ còn ${p.stock}.`);
        setCart(cart.map(i => i.product.id === p.id ? { ...i, qty: newQty, total: Math.round(newQty*pr*(1+VAT_RATE)), profit: Math.round(newQty*(pr - (p.import_price||0))) } : i));
      } else {
        if (qty > p.stock) return alert(`Không đủ hàng! Trong kho chỉ còn ${p.stock}.`);
        setCart([...cart, { product: p, qty, total: Math.round(qty*pr*(1+VAT_RATE)), profit: Math.round(qty*(pr - (p.import_price||0))) }]);
      }
    }
  };

  const adjustCartQty = (productId: any, delta: number) => {
    let exceedStock = false;
    let stockLimit = 0;
    
    setCart(prev => {
      const updated = prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.qty + delta;
          if (newQty > item.product.stock) {
            exceedStock = true;
            stockLimit = item.product.stock;
            return item; 
          }
          const price = getActualPrice(item.product);
          return { ...item, qty: newQty, total: Math.round(newQty*price*(1+VAT_RATE)), profit: Math.round(newQty*(price - (item.product.import_price||0))) };
        }
        return item;
      });
      return updated.filter(item => item.qty > 0);
    });
    
    if (exceedStock) {
        setTimeout(() => alert(`Vượt quá tồn kho! Món này chỉ còn tối đa ${stockLimit} sản phẩm.`), 10);
    }
  };

  const removeFromCart = (productId: any) => setCart(cart.filter(item => item.product.id !== productId));
  const cartTotalAmount = cart.reduce((sum, item) => sum + item.total, 0);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value; setCustPhone(phone);
    if (customers[phone]) setCustName(customers[phone].name);
    else { setCustName(""); setUseWallet(false); }
  };

  const handleNextToQR = () => {
    if (custPhone && !customers[custPhone] && !custName) return alert("Nhập Tên khách hàng!");
    setCheckoutStep(2);
  };

  const confirmCheckout = async (isDebt: boolean = false) => {
    if (isDebt && !custPhone) return alert("Ghi nợ bắt buộc phải nhập SĐT khách hàng!");
    setLoading(true);
    let logs: any[] = [];
    const subTotal = Math.round(cart.reduce((s, i) => s + (i.qty * getActualPrice(i.product)), 0));
    const vatTotal = Math.round(subTotal * VAT_RATE);
    const baseTotal = subTotal + vatTotal;
    
    const vDiscount = Number(voucherAmount) || 0;
    const totalAfterVoucher = Math.max(0, baseTotal - vDiscount);

    const wallet = customers[custPhone]?.wallet || 0;
    const walletDiscount = useWallet && !isDebt ? Math.round(Math.min(wallet, totalAfterVoucher)) : 0; 
    
    const finalTotal = totalAfterVoucher - walletDiscount;
    const totalDiscount = vDiscount + walletDiscount; 
    const earned = isDebt ? 0 : Math.round(finalTotal * 0.02);

    for (const item of cart) {
      await supabase.from("products").update({ stock: item.product.stock - item.qty }).eq("id", item.product.id);
      logs.push({ id: Date.now() + Math.random(), shift: shift, type: isDebt ? "GHI NỢ" : "BÁN", name: item.product.name, qty: item.qty, total: Math.round(item.total), profit: Math.round(item.profit), customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: item.product.id });
    }
    
    if (custPhone) {
      setCustomers((prev: any) => ({ 
        ...prev, 
        [custPhone]: { 
          name: custName, 
          wallet: isDebt ? (prev[custPhone]?.wallet || 0) : Math.round((prev[custPhone]?.wallet || 0) - walletDiscount + earned),
          debt: (prev[custPhone]?.debt || 0) + (isDebt ? finalTotal : 0)
        } 
      }));
    }

    setHistory(prev => [...logs, ...prev]);

    setLastOrder({ 
      orderId: "HD" + Date.now().toString().slice(-6), shift: shift, cart: [...cart], 
      subTotal, vatTotal, finalTotal: isDebt ? 0 : finalTotal, debtAmount: isDebt ? finalTotal : 0, 
      discount: totalDiscount, earnedWallet: custPhone ? earned : 0, custName: custPhone ? custName : null, 
      custPhone: custPhone ? custPhone : null, time: new Date().toLocaleString('vi-VN') 
    });
    setCheckoutStep(3); fetchProducts(); setLoading(false);
  };

  const handleRefund = async (logId: any) => {
    if(role !== 'admin') return alert("Chỉ quản lý mới được hoàn trả!");
    if(!window.confirm("Xác nhận khách trả lại món này?")) return;
    
    const logIndex = history.findIndex(l => l.id === logId);
    if(logIndex === -1) return;
    const log = history[logIndex];
    if(log.type !== 'BÁN') return alert("Chỉ hoàn trả đơn BÁN!");

    const p = products.find(x => x.id === log.product_id);
    if (p) await supabase.from("products").update({ stock: p.stock + log.qty }).eq("id", p.id);
    
    const updatedHistory = [...history];
    updatedHistory[logIndex].type = 'ĐÃ HOÀN TRẢ';
    updatedHistory.unshift({ id: Date.now(), shift: shift, type: "TRẢ HÀNG", name: log.name, qty: log.qty, total: -log.total, profit: -log.profit, customer: log.customer });
    
    setHistory(updatedHistory);
    fetchProducts();
    alert("Hoàn trả thành công! Hàng đã nhập lại kho, tiền sẽ tự động trừ khỏi doanh thu ca.");
  };

  const handlePayDebt = (phone: string) => {
    const currentDebt = customers[phone]?.debt || 0;
    const payAmt = window.prompt(`Khách ${customers[phone].name} đang nợ ${currentDebt.toLocaleString()}đ. Nhập số tiền khách trả:`, currentDebt.toString());
    if (payAmt && parseInt(payAmt) > 0) {
      const amt = parseInt(payAmt);
      setCustomers((prev: any) => ({ ...prev, [phone]: { ...prev[phone], debt: Math.max(0, (prev[phone]?.debt || 0) - amt) } }));
      setHistory(prev => [{ id: Date.now(), shift: shift, type: "THU NỢ", name: "Thanh toán công nợ", qty: 1, total: amt, profit: 0, customer: `${customers[phone].name} (${phone})` }, ...prev]);
      alert("Đã thu nợ thành công! Tiền nợ thu được đã cộng vào doanh thu ca này.");
    }
  };

  const closeCheckout = () => { setCart([]); setIsCheckoutOpen(false); setCheckoutStep(1); setCustPhone(""); setCustName(""); setUseWallet(false); setVoucherAmount(""); setCustomerGiven(""); setLastOrder(null); };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value; setNewCode(code);
    const p = products.find((x: any) => x.product_code === code);
    if (p) { setNewName(p.name); setNewCategory(p.category || "Khác"); setNewImportPrice(p.import_price?.toString() || ""); setNewPrice(p.sale_price.toString()); setNewPromoPrice(p.promo_price?.toString() || ""); setNewGiftInfo(p.gift_info || ""); setNewExpiry(p.expiry_date || ""); }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const exist = products.find(p => p.product_code === newCode);
    const added = parseInt(newStock || "0"); const impPrice = parseInt(newImportPrice);
    let fImp = impPrice;
    if (exist && exist.stock > 0) fImp = Math.round((exist.stock * (exist.import_price || 0) + added * impPrice) / (exist.stock + added));
    
    const data = { product_code: newCode, name: newName, category: newCategory || "Khác", import_price: fImp, sale_price: parseInt(newPrice), promo_price: parseInt(newPromoPrice) || 0, gift_info: newGiftInfo || null, stock: exist ? exist.stock + added : added, expiry_date: newExpiry || null };
    if (exist) await supabase.from("products").update(data).eq("id", exist.id); else await supabase.from("products").insert([data]);
    if (added > 0) setHistory(prev => [{ id: Date.now(), shift: shift, type: "NHẬP", name: newName, qty: added, total: 0 }, ...prev]);
    
    setNewCode(""); setNewName(""); setNewCategory("Đồ uống"); setNewImportPrice(""); setNewPrice(""); setNewPromoPrice(""); setNewGiftInfo(""); setNewStock(""); setNewExpiry("");
    fetchProducts(); setLoading(false); setShowInputForm(false);
  };

  const downloadSampleCSV = () => {
    const csv = "\uFEFFMã SP,Tên SP,Danh Mục,Giá Nhập,Giá Bán,Giá KM,Quà Tặng,Số Lượng,Hạn Sử Dụng (YYYY-MM-DD)\nSP001,Mì Hảo Hảo,Đồ ăn liền,3000,5000,0,,100,2026-12-31\nSP002,Nước suối TH,Đồ uống,4000,6000,0,,50,2026-06-15";
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Mau_Nhap_Kho_Hai_Le_Mart.csv`;
    link.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      setLoading(true);
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length <= 1) {
           alert("File rỗng hoặc không đúng định dạng!");
           setLoading(false); return;
        }

        let successCount = 0;
        let importLogs: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length < 5) continue; 

          const pCode = cols[0];
          const pName = cols[1];
          const pCategory = cols[2] || "Khác";
          const pImpPrice = parseInt(cols[3]) || 0;
          const pSalePrice = parseInt(cols[4]) || 0;
          const pPromoPrice = parseInt(cols[5]) || 0;
          const pGift = cols[6] || null;
          const pStock = parseInt(cols[7]) || 0;
          const pExpiry = cols[8] || null;

          if (!pCode || !pName || pSalePrice <= 0) continue;

          const { data: existingData } = await supabase.from("products").select("*").eq("product_code", pCode);
          const exist = existingData && existingData.length > 0 ? existingData[0] : null;

          let fImp = pImpPrice;
          if (exist && exist.stock > 0) {
            fImp = Math.round((exist.stock * (exist.import_price || 0) + pStock * pImpPrice) / (exist.stock + pStock));
          }

          const data = {
            product_code: pCode, name: pName, category: pCategory, import_price: fImp,
            sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift,
            stock: exist ? exist.stock + pStock : pStock, expiry_date: pExpiry
          };

          if (exist) await supabase.from("products").update(data).eq("id", exist.id);
          else await supabase.from("products").insert([data]);

          if (pStock > 0) importLogs.push({ id: Date.now() + Math.random(), shift: shift, type: "NHẬP", name: pName, qty: pStock, total: 0 });
          successCount++;
        }

        if (importLogs.length > 0) setHistory(prev => [...importLogs, ...prev]);
        alert(`Đã nhập thành công ${successCount} sản phẩm từ file!`);
        fetchProducts();
      } catch (err) {
        alert("Có lỗi xảy ra khi xử lý file CSV. Xin kiểm tra lại định dạng.");
      }
      setLoading(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDelete = async (id: any, name: any) => { if (window.confirm(`Xóa vĩnh viễn ${name}?`)) { await supabase.from("products").delete().eq("id", id); fetchProducts(); } };
  
  const handleEdit = async (id: any, field: string, old: any, isText: boolean = false) => {
    let label = field;
    if (field === 'category') label = 'Danh mục';
    if (field === 'sale_price') label = 'Giá bán';
    if (field === 'promo_price') label = 'Giá KM (Nhập 0 để hủy)';
    if (field === 'gift_info') label = 'Quà tặng (Xóa trắng và ấn OK để hủy)';
    if (field === 'expiry_date') label = 'HSD (YYYY-MM-DD)';

    const val = window.prompt(`Sửa ${label}:`, old || "");
    if (val !== null) { 
      let updateData: any = isText ? val : (parseInt(val) || 0);
      if (field === 'gift_info' && val.trim() === '') updateData = null; 
      await supabase.from("products").update({ [field]: updateData }).eq("id", id); 
      fetchProducts(); 
    }
  };

  // --- HÀM XỬ LÝ CLICK SẮP XẾP SẢN PHẨM Ở TIÊU ĐỀ CỘT ---
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <span style={{opacity: 0.3, fontSize: "9px", marginLeft:"2px"}}>↕️</span>;
    return sortConfig.direction === 'asc' ? <span style={{fontSize: "11px", marginLeft:"2px"}}>🔼</span> : <span style={{fontSize: "11px", marginLeft:"2px"}}>🔽</span>;
  };
  // -----------------------------------------------------

  const totalValue = Math.round(products.reduce((sum, p) => sum + ((Number(p.import_price) || 0) * (Number(p.stock) || 0)), 0));

  const groupedHistory = useMemo(() => {
    return history.reduce((groups: any, log: any) => {
      const date = new Date(Math.floor(log.id)).toLocaleDateString('vi-VN'); 
      if (!groups[date]) groups[date] = [];
      groups[date].push({ ...log, t: new Date(Math.floor(log.id)).toLocaleTimeString('vi-VN') });
      return groups;
    }, {});
  }, [history]);

  const categories = ["Tất cả", ...Array.from(new Set(products.map(p => p.category || "Khác")))];

  // --- CẬP NHẬT THUẬT TOÁN SẮP XẾP SẢN PHẨM ---
  const sortedAndFilteredProducts = useMemo(() => {
    const todayTime = new Date().getTime();
    let filtered = products
      .filter(p => (selectedCategory === "Tất cả" || (p.category || "Khác") === selectedCategory))
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.product_code && p.product_code.toLowerCase().includes(searchTerm.toLowerCase())));

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // Xử lý riêng cho cột Hạn sử dụng (so sánh Date)
        if (sortConfig.key === 'expiry_date') {
            valA = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity;
            valB = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity;
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Nếu không bấm bộ lọc, dùng sắp xếp Thông minh mặc định (Hết hạn lên đầu)
      filtered.sort((a, b) => {
        const daysA = a.expiry_date ? (new Date(a.expiry_date).getTime() - todayTime) / 86400000 : Infinity;
        const daysB = b.expiry_date ? (new Date(b.expiry_date).getTime() - todayTime) / 86400000 : Infinity;
        const aIsUrgent = daysA <= 45; const bIsUrgent = daysB <= 45;
        if (aIsUrgent && !bIsUrgent) return -1;
        if (!aIsUrgent && bIsUrgent) return 1;
        if (aIsUrgent && bIsUrgent) return daysA - daysB; 
        return 0;
      });
    }
    return filtered;
  }, [products, searchTerm, selectedCategory, sortConfig]);

  const toggleDateGroup = (dateStr: string) => setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));

  const todayStats = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('vi-VN');
    const todayHistory = history.filter(h => new Date(Math.floor(h.id)).toLocaleDateString('vi-VN') === todayStr);
    const totalRev = todayHistory.reduce((s, h) => s + ((h.type === 'BÁN' || h.type === 'THU NỢ' || h.type === 'TRẢ HÀNG') ? h.total : 0), 0);
    const totalProf = todayHistory.reduce((s, h) => s + (h.profit || 0), 0);
    return { rev: totalRev, prof: totalProf };
  }, [history]);

  const topSelling = useMemo(() => {
    const sales: Record<string, number> = {};
    history.forEach(log => { if(log.type === 'BÁN') sales[log.name] = (sales[log.name]||0) + log.qty; });
    return Object.entries(sales).sort((a,b)=>b[1]-a[1]).slice(0,5);
  }, [history]);

  const styles = `
    @keyframes float { 0% { transform: translateY(0); } 50% { transform: translateY(-20px); } 100% { transform: translateY(0); } }
    .spring-bg { position: fixed; width: 400px; height: 400px; border-radius: 50%; filter: blur(100px); z-index: -1; opacity: 0.3; animation: float 10s infinite ease-in-out; }
    .glass { background: rgba(255, 255, 255, 0.98); border: 1px solid #fed7aa; border-radius: 12px; box-shadow: 0 4px 15px rgba(251, 146, 60, 0.08); }
    body { background-color: #fff7ed; margin: 0; font-family: 'Inter', sans-serif; color: #431407; }
    .stat-box { background: #fff; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; border: 1px solid #fdba74; display: flex; align-items: center; gap: 6px; color: #9a3412; }
    .qty-btn { padding: 2px 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: #f8fafc; cursor: pointer; font-weight: bold; }
    .tab-btn { padding: 6px 12px; border-radius: 20px; border: 1px solid #fed7aa; background: #fff; cursor: pointer; font-size: 12px; font-weight: bold; color: #9a3412; white-space: nowrap; }
    .tab-btn.active { background: #ef4444; color: #fff; border-color: #ef4444; }
    .print-only { display: none; }
    
    @media print { 
      body, html { background: white !important; margin: 0 !important; padding: 0 !important; color: #000; } 
      .no-print { display: none !important; } 
      .print-only { display: block !important; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; width: 80mm; margin: 0 auto; padding: 5mm; box-sizing: border-box; font-size: 12px; line-height: 1.4; } 
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
      @page { margin: 0; } 
    }
  `;

  if (!isLoggedIn) {
     return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", position: "relative", overflow: "hidden" }}>
        <style>{styles}</style>
        <div className="spring-bg" style={{ background: "#ef4444", top: "-10%", left: "-10%" }}></div>
        <div className="spring-bg" style={{ background: "#fbbf24", bottom: "-10%", right: "-10%" }}></div>
        <div className="glass" style={{ padding: "40px", width: "100%", maxWidth: "380px", textAlign: "center", border: "4px solid #ef4444" }}>
          <h1 style={{ color: "#ef4444", fontSize: "28px", margin: 0 }}>🧨 HẢI LÊ MART 🌸</h1>
          <p style={{ color: "#b91c1c", marginBottom: "30px", fontWeight: "bold" }}>Chúc Mừng Năm Mới - Phát Tài Phát Lộc</p>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <select value={shift} onChange={e => setShift(e.target.value)} style={{ padding: "14px", borderRadius: "10px", border: "1px solid #f97316", outline: "none", fontWeight: "bold", color: "#9a3412", backgroundColor: "#fffbeb" }}>
              <option value="Ca Sáng">🌅 Ca Sáng (06:00 - 14:00)</option>
              <option value="Ca Chiều">🌇 Ca Chiều (14:00 - 22:00)</option>
              <option value="Ca Tối">🌙 Ca Tối (22:00 - 06:00)</option>
            </select>
            <input placeholder="Tên đăng nhập (admin / nhanvien)" value={authUsername} onChange={e => setAuthUsername(e.target.value)} style={{ padding: "14px", borderRadius: "10px", border: "1px solid #f97316", outline: "none" }} />
            <input type="password" placeholder="Mật khẩu" value={authPassword} onChange={e => setAuthPassword(e.target.value)} style={{ padding: "14px", borderRadius: "10px", border: "1px solid #f97316", outline: "none" }} />
            <button type="submit" style={{ padding: "14px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>MỞ CỬA BÁN HÀNG 🧧</button>
          </form>
        </div>
      </div>
    );
  }

  const finalToPay = Math.round(Math.max(0, cartTotalAmount - (Number(voucherAmount) || 0) - (useWallet ? Math.min(customers[custPhone]?.wallet||0, Math.max(0, cartTotalAmount - (Number(voucherAmount) || 0))) : 0)));

  return (
    <div>
      <style>{styles}</style>
      
      {/* 🖨️ BIÊN LAI BÁN HÀNG GIAO DIỆN MỚI */}
      {lastOrder && (
        <div className="print-only">
          <div className="print-header">
            <h2>HẢI LÊ MART</h2>
            <p>Tòa Nhà ATS, 252 Hoàng Quốc Việt, HN</p>
            <p>Hotline: 0902 613 899</p>
          </div>

          <div className="print-divider"></div>

          <div className="print-info">
            <div>
              <div><b>HĐ:</b> {lastOrder.orderId}</div>
              <div><b>Ngày:</b> {lastOrder.time.split(' ')[1]} {lastOrder.time.split(' ')[0]}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div><b>Ca:</b> {shift}</div>
              <div><b>TN:</b> {role}</div>
            </div>
          </div>

          <div className="print-divider"></div>

          <div style={{ width: "100%" }}>
            {lastOrder.cart.map((item: any, idx: number) => {
              const price = Math.round(getActualPrice(item.product));
              const itemTotal = Math.round(item.qty * price);
              return (
                <div key={idx} style={{ borderBottom: "1px dotted #ccc" }}>
                  <div className="print-item-name">{item.product.name}</div>
                  <div className="print-item-details">
                    <span>{item.qty} x {price.toLocaleString()}</span>
                    <span style={{ fontWeight: "bold" }}>{itemTotal.toLocaleString()}</span>
                  </div>
                  {item.product.gift_info && (
                    <div className="print-gift">+ 🎁 Tặng: {item.product.gift_info}</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="print-divider"></div>

          <div className="print-totals">
            <div className="print-totals-row">
              <span>Cộng tiền hàng:</span>
              <span>{Math.round(lastOrder.subTotal).toLocaleString()}đ</span>
            </div>
            <div className="print-totals-row">
              <span>Thuế GTGT ({VAT_RATE * 100}%):</span>
              <span>{Math.round(lastOrder.vatTotal).toLocaleString()}đ</span>
            </div>
            {lastOrder.discount > 0 && (
              <div className="print-totals-row">
                <span>Giảm giá/Ví:</span>
                <span>-{Math.round(lastOrder.discount).toLocaleString()}đ</span>
              </div>
            )}
            <div className="print-grand-total">
              <span>{lastOrder.debtAmount > 0 ? "KHÁCH NỢ:" : "TỔNG CỘNG:"}</span>
              <span>{Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</span>
            </div>
          </div>

          <div className="print-footer">
            <div><b>CẢM ƠN QUÝ KHÁCH & HẸN GẶP LẠI!</b></div>
            <div style={{ marginTop: "5px", fontSize: "10px", color: "#666" }}><i>Powered by Hải Lê POS</i></div>
          </div>
        </div>
      )}

      {/* MODAL BÀN GIAO CA (CHỐT CA) */}
      {showHandoverModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div className="glass" style={{ padding: "30px", width: "350px", textAlign: "center" }}>
            <h2 style={{ margin: "0 0 15px 0", color: "#ef4444", fontSize: "22px" }}>📋 BIÊN BẢN CHỐT CA</h2>
            <div style={{ backgroundColor: "#fff7ed", padding: "15px", borderRadius: "10px", border: "1px dashed #fdba74", textAlign: "left", fontSize: "14px", lineHeight: "1.8" }}>
              <div>👤 Người trực: <b>{role === 'admin' ? "Quản lý" : "Thu ngân"}</b></div>
              <div>⏰ Ca làm việc: <b style={{color: "#b91c1c"}}>{shift}</b></div>
              <div style={{ borderTop: "1px solid #fed7aa", margin: "10px 0" }}></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>💵 Tổng thu ca này:</span><b style={{color: "#059669", fontSize: "16px"}}>{currentShiftStats.rev.toLocaleString()}đ</b></div>
              {role === 'admin' && <div style={{ display: "flex", justifyContent: "space-between" }}><span>📈 Lợi nhuận ca này:</span><b style={{color: "#3b82f6"}}>{currentShiftStats.prof.toLocaleString()}đ</b></div>}
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "10px", fontStyle: "italic", textAlign: "center" }}>*Doanh thu đã được tự động lưu vào Lịch sử tổng.</div>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={() => setShowHandoverModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#e2e8f0", fontWeight: "bold", cursor: "pointer" }}>Hủy</button>
              <button onClick={confirmHandover} style={{ flex: 2, padding: "12px", backgroundColor: "#ef4444", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>✔️ ĐĂNG XUẤT</button>
            </div>
          </div>
        </div>
      )}

      {/* 🤝 MODAL QUẢN LÝ KHÁCH HÀNG CRM MỚI */}
      {showCustomerModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div className="glass" style={{ padding: "25px", width: "500px", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #c7d2fe", paddingBottom: "10px", marginBottom: "10px" }}>
              <h2 style={{ margin: 0, color: "#4f46e5" }}>🤝 QUẢN LÝ KHÁCH HÀNG</h2>
              <button onClick={() => setShowCustomerModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✖</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {Object.keys(customers).length === 0 && <div style={{textAlign: "center", color: "#94a3b8", marginTop: "20px"}}>Chưa có dữ liệu khách hàng.</div>}
              {Object.keys(customers).map(phone => (
                <div key={phone} style={{ padding: "10px", borderBottom: "1px dashed #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "bold", color: "#1e293b", cursor: "pointer" }} onClick={() => {
                      const newName = window.prompt("Sửa tên khách hàng:", customers[phone].name);
                      if(newName) setCustomers((prev:any) => ({...prev, [phone]: {...prev[phone], name: newName}}));
                    }} title="Bấm để sửa tên">{customers[phone].name} ✏️</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>{phone}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#10b981", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }} onClick={() => {
                      const newWallet = window.prompt("Sửa điểm ví:", customers[phone].wallet || 0);
                      if(newWallet !== null) setCustomers((prev:any) => ({...prev, [phone]: {...prev[phone], wallet: parseInt(newWallet) || 0}}));
                    }} title="Bấm để sửa ví">Ví: {(customers[phone].wallet || 0).toLocaleString()}đ ✏️</div>
                    <div style={{ color: "#ef4444", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }} onClick={() => {
                      const newDebt = window.prompt("Sửa tiền nợ:", customers[phone].debt || 0);
                      if(newDebt !== null) setCustomers((prev:any) => ({...prev, [phone]: {...prev[phone], debt: parseInt(newDebt) || 0}}));
                    }} title="Bấm để sửa nợ">Nợ: {(customers[phone].debt || 0).toLocaleString()}đ ✏️</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL SỔ NỢ */}
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

      {/* MODAL THỐNG KÊ (CHỈ DÀNH CHO ADMIN) */}
      {showStatsModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div className="glass" style={{ padding: "25px", width: "400px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #fed7aa", paddingBottom: "10px", marginBottom: "15px" }}>
              <h2 style={{ margin: 0, color: "#3b82f6" }}>📊 BÁO CÁO NHANH</h2>
              <button onClick={() => setShowStatsModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✖</button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              <div style={{ backgroundColor: "#eff6ff", padding: "10px", borderRadius: "8px", border: "1px solid #bfdbfe", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#3b82f6", fontWeight: "bold" }}>TỔNG THU HÔM NAY</div>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1e3a8a" }}>{todayStats.rev.toLocaleString()}đ</div>
              </div>
              <div style={{ backgroundColor: "#f0fdf4", padding: "10px", borderRadius: "8px", border: "1px solid #bbf7d0", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: "bold" }}>TỔNG LÃI HÔM NAY</div>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "#14532d" }}>{todayStats.prof.toLocaleString()}đ</div>
              </div>
            </div>

            <h3 style={{ fontSize: "14px", color: "#1e293b", marginTop: 0 }}>🏆 Top 5 Bán Chạy Nhất</h3>
            {topSelling.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed #e2e8f0", fontSize: "13px" }}>
                <span>{idx + 1}. {item[0]}</span><span style={{fontWeight: "bold", color: "#10b981"}}>{item[1]} món</span>
              </div>
            ))}
            <h3 style={{ fontSize: "14px", color: "#b91c1c", marginTop: "20px" }}>📉 Sắp hết hàng (Dưới 10)</h3>
            {products.filter(p=>p.stock < 10).slice(0,5).map((p, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed #e2e8f0", fontSize: "13px" }}>
                <span>{p.name}</span><span style={{fontWeight: "bold", color: "#ef4444"}}>Còn {p.stock}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="no-print" style={{ padding: "10px", position: "relative", minHeight: "100vh" }}>
        <div className="spring-bg" style={{ background: "#ef4444", top: "10%", left: "5%" }}></div>
        <div className="spring-bg" style={{ background: "#f59e0b", bottom: "10%", right: "5%" }}></div>

        {/* POPUP THANH TOÁN QUÉT MÃ QR */}
        {isCheckoutOpen && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
            {checkoutStep === 1 && (
              <div className="glass" style={{ padding: "25px", width: "350px" }}>
                <h3 style={{ color: "#ef4444", margin: "0", textAlign: "center" }}>🧧 THANH TOÁN</h3>
                
                {/* NHẬP VOUCHER GIẢM GIÁ */}
                <input 
                  type="number" 
                  placeholder="Nhập số tiền Voucher giảm (đ)..." 
                  value={voucherAmount} 
                  onChange={(e) => setVoucherAmount(parseInt(e.target.value) || "")} 
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "2px dashed #f59e0b", marginTop: "15px", outline: "none", boxSizing: "border-box", backgroundColor: "#fffbeb" }} 
                />

                <input type="text" placeholder="Số điện thoại khách (nếu có)..." value={custPhone} onChange={handlePhoneChange} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "2px solid #ef4444", marginTop: "10px", outline: "none", boxSizing: "border-box" }} />
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
                
                {/* 🧮 SIÊU MÁY TÍNH TIỀN THỐI */}
                <div style={{ marginBottom: "15px", textAlign: "left" }}>
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold", marginBottom: "5px" }}>Tiền khách đưa:</div>
                  <input type="number" placeholder="Nhập số tiền..." value={customerGiven} onChange={e => setCustomerGiven(Number(e.target.value) || "")} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", boxSizing: "border-box", fontSize: "14px", fontWeight: "bold" }} />
                  <div style={{ display: "flex", gap: "5px", marginTop: "8px", flexWrap: "wrap" }}>
                    <button onClick={()=>setCustomerGiven(finalToPay)} style={{flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid #cbd5e1", cursor: "pointer"}}>Vừa đủ</button>
                    <button onClick={()=>setCustomerGiven(50000)} style={{flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid #cbd5e1", cursor: "pointer"}}>50k</button>
                    <button onClick={()=>setCustomerGiven(100000)} style={{flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid #cbd5e1", cursor: "pointer"}}>100k</button>
                    <button onClick={()=>setCustomerGiven(200000)} style={{flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid #cbd5e1", cursor: "pointer"}}>200k</button>
                    <button onClick={()=>setCustomerGiven(500000)} style={{flex: 1, padding: "5px", fontSize: "11px", borderRadius: "4px", border: "1px solid #cbd5e1", cursor: "pointer"}}>500k</button>
                  </div>
                  {customerGiven !== "" && Number(customerGiven) >= finalToPay && (
                    <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#ecfdf5", border: "1px dashed #10b981", borderRadius: "8px", color: "#059669", fontWeight: "bold", fontSize: "16px", textAlign: "center" }}>
                      THỐI LẠI: {(Number(customerGiven) - finalToPay).toLocaleString()}đ
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button onClick={() => setCheckoutStep(1)} style={{ flex: "1 1 100%", padding: "8px", borderRadius: "8px", border: "none", background: "#e2e8f0", cursor: "pointer", fontWeight: "bold" }}>Quay lại</button>
                  <button onClick={() => confirmCheckout(true)} disabled={loading} style={{ flex: 1, padding: "10px", backgroundColor: "#f59e0b", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>📝 GHI NỢ</button>
                  <button onClick={() => confirmCheckout(false)} disabled={loading} style={{ flex: 1, padding: "10px", backgroundColor: "#10b981", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>✔️ ĐÃ NHẬN</button>
                </div>
              </div>
            )}
            {checkoutStep === 3 && (
              <div className="glass" style={{ padding: "30px", width: "350px", textAlign: "center" }}>
                <div style={{ fontSize: "40px" }}>🌸</div><h3 style={{ color: "#10b981", margin: "10px 0" }}>Thành công!</h3>
                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                  <button onClick={() => window.print()} style={{ flex: 1, padding: "12px", backgroundColor: "#ef4444", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>🖨️ In Hóa Đơn</button>
                  <button onClick={closeCheckout} style={{ flex: 1, padding: "12px", backgroundColor: "#e2e8f0", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>Đóng</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* HEADER CHÍNH */}
          <div className="glass" style={{ padding: "8px 15px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", borderBottom: "4px solid #ef4444" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <h2 style={{ color: "#ef4444", margin: 0, fontSize: "18px" }}>🏪 HẢI LÊ MART</h2>
              <div style={{ display: "flex", gap: "5px" }}>
                {role === 'admin' && (
                  <>
                    <button onClick={() => setShowStatsModal(true)} style={{ padding: "4px 8px", background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>📊 THỐNG KÊ</button>
                    <button onClick={() => setShowCustomerModal(true)} style={{ padding: "4px 8px", background: "#fdf4ff", color: "#4f46e5", border: "1px solid #c7d2fe", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>🤝 KHÁCH HÀNG</button>
                  </>
                )}
                <button onClick={() => setShowDebtModal(true)} style={{ padding: "4px 8px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>📓 SỔ NỢ</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b" }} title="Ca làm việc hiện tại">{shift} • {role === 'admin' ? "Quản lý" : "Thu ngân"}</span>
              
              {/* DOANH THU & LỢI NHUẬN CỦA CA NÀY (Real-time Sync) */}
              {role === 'admin' && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <div className="stat-box">🧧 Vốn: {totalValue.toLocaleString()}đ</div>
                  <div className="stat-box" style={{background: "#fee2e2"}}>💰 Thu ca: {currentShiftStats.rev.toLocaleString()}đ</div>
                  <div className="stat-box" style={{background: "#f0fdf4"}}>📈 Lãi ca: {currentShiftStats.prof.toLocaleString()}đ</div>
                </div>
              )}
              {role === 'staff' && (
                <div className="stat-box" style={{background: "#fee2e2"}}>💰 Thu ca: {currentShiftStats.rev.toLocaleString()}đ</div>
              )}
              
              <button onClick={handleLogoutClick} style={{ padding: "6px 10px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", fontSize: "11px" }}>Đăng xuất / Bàn giao 🔒</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "10px" }}>
            
            {/* CỘT TRÁI: SẢN PHẨM */}
            <div className="glass" style={{ padding: "12px" }}>
              
              <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                <input 
                  placeholder="👉 QUẸT MÃ VẠCH (Hoặc gõ tìm kiếm)..." 
                  value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} onKeyDown={handleBarcodeSubmit} 
                  style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "2px solid #ef4444", fontSize: "14px", fontWeight: "bold", outline: "none", boxSizing: "border-box", backgroundColor: "#fffbeb", color: "#b91c1c" }} 
                />
                
                {/* 3 NÚT NHẬP HÀNG SIÊU ĐẲNG */}
                {role === 'admin' && (
                  <div style={{ display: "flex", gap: "6px" }}>
                    <div onClick={() => setShowInputForm(!showInputForm)} style={{ padding: "8px 12px", borderRadius: "6px", fontWeight: "bold", color: "#b91c1c", cursor: "pointer", border: "1px dashed #ef4444", fontSize: "12px", display: "flex", alignItems: "center", backgroundColor: "#fef2f2" }}>
                      {showInputForm ? "➖ ĐÓNG" : "➕ NHẬP LẺ"}
                    </div>
                    
                    <label style={{ cursor: "pointer", padding: "8px 12px", borderRadius: "6px", fontWeight: "bold", color: "#059669", border: "1px dashed #10b981", fontSize: "12px", display: "flex", alignItems: "center", backgroundColor: "#ecfdf5" }} title="Nhập hàng loạt từ file CSV">
                      📁 NHẬP TỪ FILE
                      <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: "none" }} />
                    </label>

                    <button onClick={downloadSampleCSV} style={{ padding: "8px 12px", borderRadius: "6px", fontWeight: "bold", color: "#3b82f6", cursor: "pointer", border: "1px dashed #3b82f6", fontSize: "12px", display: "flex", alignItems: "center", backgroundColor: "#eff6ff" }} title="Tải file Excel mẫu">
                      📥 TẢI FILE MẪU
                    </button>
                  </div>
                )}
              </div>

              {showInputForm && role === 'admin' && (
                <form onSubmit={handleAddProduct} style={{ backgroundColor: "#fff7ed", padding: "10px", borderRadius: "8px", border: "1px solid #fdba74", marginBottom: "10px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr", gap: "6px", marginBottom: "6px" }}>
                    <input placeholder="Mã..." value={newCode} onChange={handleCodeChange} style={{ padding: "6px", borderRadius: "4px", border: "1px solid #cbd5e1", outline: "none", fontSize: "12px" }} />
                    <input placeholder="Tên hàng..." value={newName} onChange={e => setNewName(e.target.value)} style={{ padding: "6px", borderRadius: "4px", border: "1px solid #cbd5e1", outline: "none", fontSize: "12px" }} />
                    <input placeholder="Phân loại..." value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ padding: "6px", borderRadius: "4px", border: "1px solid #cbd5e1", outline: "none", fontSize: "12px" }} title="Nhập danh mục (VD: Đồ uống, Bánh kẹo)" />
                    <input type="number" placeholder="Giá nhập" value={newImportPrice} onChange={e => setNewImportPrice(e.target.value)} style={{ padding: "6px", borderRadius: "4px", border: "1px solid #cbd5e1", outline: "none", fontSize: "12px" }} />
                    <input type="number" placeholder="Giá bán" value={newPrice} onChange={e => setNewPrice(e.target.value)} style={{ padding: "6px", borderRadius: "4px", border: "1px solid #cbd5e1", outline: "none", fontSize: "12px" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 0.8fr 60px", gap: "6px" }}>
                    <input type="number" placeholder="Giá KM" value={newPromoPrice} onChange={e => setNewPromoPrice(e.target.value)} style={{ padding: "6px", borderRadius: "4px", border: "1px solid #ef4444", outline: "none", fontSize: "12px" }} />
                    <input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} style={{ padding: "6px", borderRadius: "4px", border: "1px solid #cbd5e1", outline: "none", fontSize: "12px" }} />
                    <input type="text" placeholder="Quà tặng" value={newGiftInfo} onChange={e => setNewGiftInfo(e.target.value)} style={{ padding: "6px", borderRadius: "4px", border: "1px solid #10b981", outline: "none", fontSize: "12px" }} />
                    <input type="number" placeholder="SL..." value={newStock} onChange={e => setNewStock(e.target.value)} style={{ padding: "6px", borderRadius: "4px", border: "1px solid #cbd5e1", outline: "none", fontSize: "12px" }} />
                    <button type="submit" disabled={loading} style={{ padding: "6px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", fontSize: "12px" }}>LƯU</button>
                  </div>
                </form>
              )}

              {/* TABS PHÂN LOẠI DANH MỤC */}
              <div style={{ display: "flex", gap: "6px", marginBottom: "10px", overflowX: "auto", paddingBottom: "4px" }}>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`tab-btn ${selectedCategory === cat ? 'active' : ''}`}>{cat}</button>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", paddingBottom: "4px", borderBottom: "1px solid #fed7aa" }}>
                <div style={{ fontSize: "12px", fontWeight: "bold", color: "#16a34a" }}>📋 SẢN PHẨM</div>
                <input placeholder="🔍 Lọc Tên/Mã..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: "4px 10px", borderRadius: "15px", border: "1px solid #fdba74", outline: "none", width: "150px", fontSize: "11px" }} />
              </div>

              <div style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    {/* HỆ THỐNG CLICK SẮP XẾP SẢN PHẨM Ở TIÊU ĐỀ */}
                    <tr style={{ color: "#16a34a", fontSize: "10px", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
                      <th style={{ textAlign: "left", padding: "6px 4px", borderBottom: "2px solid #fed7aa", cursor: "pointer" }} onClick={() => requestSort('name')}>
                        SẢN PHẨM {getSortIcon('name')}
                      </th>
                      <th style={{ textAlign: "center", padding: "6px 4px", borderBottom: "2px solid #fed7aa", cursor: "pointer" }} onClick={() => requestSort('stock')}>
                        TỒN {getSortIcon('stock')}
                      </th>
                      {role === 'admin' && (
                        <th style={{ textAlign: "center", padding: "6px 4px", borderBottom: "2px solid #fed7aa", cursor: "pointer" }} onClick={() => requestSort('import_price')}>
                          GIÁ VỐN {getSortIcon('import_price')}
                        </th>
                      )}
                      <th style={{ textAlign: "center", padding: "6px 4px", borderBottom: "2px solid #fed7aa", cursor: "pointer" }} onClick={() => requestSort('sale_price')}>
                        GIÁ BÁN {getSortIcon('sale_price')}
                      </th>
                      <th style={{ textAlign: "center", padding: "6px 4px", borderBottom: "2px solid #fed7aa", lineHeight: "1.2", cursor: "pointer" }} onClick={() => requestSort('expiry_date')}>
                        HẠN SỬ DỤNG / LƯU KHO {getSortIcon('expiry_date')}
                      </th>
                      <th style={{ textAlign: "right", padding: "6px 4px", borderBottom: "2px solid #fed7aa" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAndFilteredProducts.map(p => {
                      const isP = p.promo_price > 0; 
                      const d = Math.floor(Math.abs(new Date().getTime() - new Date(p.created_at).getTime()) / 86400000);
                      const isNearExpiry = p.expiry_date && (new Date(p.expiry_date).getTime() - new Date().getTime()) / 86400000 <= 45;
                      const isLowStock = p.stock < 10;

                      return (
                        <tr key={p.id} style={{ borderBottom: "1px solid #fed7aa", backgroundColor: isNearExpiry ? "#fef2f2" : "transparent" }}>
                          <td style={{ padding: "8px 4px" }}>
                            <div style={{fontSize: "13px", fontWeight: "bold"}}>{p.name} {isNearExpiry && <span style={{color: "#ef4444", fontSize: "9px", border: "1px solid #ef4444", padding: "1px 2px", borderRadius: "2px"}}>⚠️</span>}</div>
                            <div style={{fontSize: "9px", color: "#94a3b8"}}>
                              {p.product_code} • <span style={{cursor: role==='admin' ? 'pointer' : 'default', textDecoration: role==='admin' ? 'underline' : 'none'}} onClick={() => role==='admin' && handleEdit(p.id, 'category', p.category || "Khác", true)} title="Bấm vào để sửa Phân Loại">{p.category || "Khác"}</span>
                            </div>
                            {p.gift_info ? (
                              <div style={{ fontSize: "9px", color: "#059669", fontWeight: "bold", cursor: role==='admin' ? 'pointer' : 'default' }} onClick={() => role==='admin' && handleEdit(p.id, 'gift_info', p.gift_info, true)} title={role === 'admin' ? "Bấm để sửa hoặc xóa quà" : ""}>
                                🎁 Tặng: {p.gift_info}
                              </div>
                            ) : (
                              role === 'admin' && <div style={{ fontSize: "9px", color: "#cbd5e1", cursor: "pointer" }} onClick={()=>handleEdit(p.id, 'gift_info', '', true)}>+ Thêm quà</div>
                            )}
                          </td>
                          <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "13px", color: isLowStock ? "#ef4444" : "#1e293b" }}>
                            {p.stock} {isLowStock && <span title="Sắp hết hàng" style={{fontSize:"10px"}}>📉</span>}
                          </td>
                          {role === 'admin' && <td style={{ textAlign: "center", color: "#64748b", fontSize: "11px" }}>{p.import_price?.toLocaleString()}</td>}
                          <td style={{ textAlign: "center" }}>
                            <div style={{ color: isP ? "#94a3b8" : "#16a34a", textDecoration: isP ? "line-through" : "none", fontSize: isP ? "10px" : "13px", fontWeight: "bold", cursor: role==='admin'?"pointer":"default" }} onClick={()=> role==='admin' && handleEdit(p.id, 'sale_price', p.sale_price)}>{p.sale_price.toLocaleString()}</div>
                            {isP && <div style={{ color: "#ef4444", fontWeight: "900", fontSize: "13px", cursor: role==='admin'?"pointer":"default" }} onClick={()=> role==='admin' && handleEdit(p.id, 'promo_price', p.promo_price)}>🔥 {p.promo_price.toLocaleString()}</div>}
                          </td>
                          <td style={{ textAlign: "center", fontSize: "10px" }}>
                            <div style={{color: isNearExpiry ? "#ef4444" : "#b91c1c", fontWeight: "bold", cursor: role==='admin'?"pointer":"default"}} onClick={()=> role==='admin' && handleEdit(p.id,'expiry_date',p.expiry_date,true)}>{p.expiry_date ? new Date(p.expiry_date).toLocaleDateString('vi-VN') : "---"}</div>
                            <div style={{color: "#64748b"}}>{d} ngày lưu kho</div>
                          </td>
                          <td style={{ textAlign: "right", padding: "8px 4px" }}><div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}><button onClick={() => addToCart(p)} style={{ padding: "4px 8px", backgroundColor: "#fbbf24", color: "#78350f", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer", fontSize: "10px" }}>+ GIỎ</button>{role === 'admin' && <button onClick={() => handleDelete(p.id, p.name)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "12px" }}>🗑️</button>}</div></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CỘT PHẢI: GIỎ HÀNG & LỊCH SỬ */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="glass" style={{ padding: "12px", maxHeight: "40vh", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h3 style={{ margin: 0, color: "#ef4444", fontSize: "13px" }}>🛒 GIỎ HÀNG ({cart.length})</h3>
                  {cart.length > 0 && <button onClick={() => { if(window.confirm("Hủy toàn bộ giỏ?")) setCart([]) }} style={{ fontSize: "9px", padding: "2px 6px", background: "#fee2e2", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>🗑️ HỦY HẾT</button>}
                </div>
                
                <div style={{ flex: 1, overflowY: "auto", marginBottom: "8px", paddingRight: "4px" }}>
                  {cart.length === 0 && <div style={{textAlign: "center", color: "#94a3b8", fontSize: "11px", marginTop: "10px"}}>Trống</div>}
                  {cart.map((item, idx) => (
                    <div key={idx} style={{ padding: "6px 0", borderBottom: "1px dashed #fed7aa", fontSize: "11px", display: "flex", flexDirection: "column", gap: "2px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: "bold", color: "#1e293b", flex: 1 }}>{item.product.name}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                          <button className="qty-btn" onClick={() => adjustCartQty(item.product.id, -1)}>-</button>
                          <span style={{ fontWeight: "bold", width: "14px", textAlign: "center", color: "#64748b" }}>{item.qty}</span>
                          <button className="qty-btn" onClick={() => adjustCartQty(item.product.id, 1)}>+</button>
                          <button onClick={()=>removeFromCart(item.product.id)} style={{border:"none",background:"none",color:"#ef4444", cursor:"pointer", fontSize: "14px", marginLeft: "2px"}}>×</button>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>{item.product.gift_info && <span style={{ color: "#10b981", fontSize: "9px", fontStyle: "italic" }}>+ 🎁 {item.product.gift_info}</span>}</span>
                        <span style={{ color: "#ef4444", fontWeight: "bold" }}>{Math.round(item.total).toLocaleString()}đ</span>
                      </div>
                    </div>
                  ))}
                </div>
                {cart.length > 0 && <button onClick={() => { setIsCheckoutOpen(true); setCheckoutStep(1); }} style={{ width: "100%", padding: "10px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" }}>THANH TOÁN</button>}
              </div>

              <div className="glass" style={{ padding: "12px", flex: 1, display: "flex", flexDirection: "column", maxHeight: "calc(60vh - 50px)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "13px", color: "#b91c1c" }}>📋 NHẬT KÝ CA NÀY</h3>
                  {role === 'admin' && (
                    <div style={{ display: "flex", gap: "2px" }}>
                      <button onClick={exportToCSV} style={{ fontSize: "8px", padding: "2px 4px", background: "#10b981", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>EXCEL TỔNG</button>
                      <button onClick={handleSendEmailReport} style={{ fontSize: "8px", padding: "2px 4px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>✉ CHỐT TỔNG</button>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, overflowY: "auto", paddingRight: "2px" }}>
                  {Object.keys(groupedHistory).length === 0 && <div style={{textAlign: "center", color: "#94a3b8", fontSize: "10px", marginTop: "10px"}}>Chưa có dữ liệu</div>}
                  {Object.keys(groupedHistory).map((dateStr) => {
                    const group = groupedHistory[dateStr];
                    const isEx = expandedDates[dateStr] ?? true;
                    return (
                      <div key={dateStr} style={{ marginBottom: "6px", backgroundColor: "#fff7ed", borderRadius: "4px", overflow: "hidden", border: "1px solid #fed7aa" }}>
                        <div onClick={() => toggleDateGroup(dateStr)} style={{ backgroundColor: "#ffedd5", padding: "6px 8px", fontSize: "10px", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "space-between" }}><span>📅 {dateStr}</span><span>{isEx ? "▼" : "▶"}</span></div>
                        {isEx && <div style={{ padding: "0 8px" }}>{group.map((log: any) => (<div key={log.id} style={{ padding: "4px 0", borderBottom: "1px dashed #fed7aa", fontSize: "9px", display: "flex", flexDirection: "column" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span><b style={{color: log.type === 'TRẢ HÀNG' ? '#ef4444' : '#1e293b'}}>[{log.type}]</b> {log.name} x{log.qty}</span>
                            {log.type === "BÁN" && <span style={{color:"#059669", fontWeight:"bold"}}>+{Math.round(log.total).toLocaleString()}</span>}
                            {log.type === "TRẢ HÀNG" && <span style={{color:"#ef4444", fontWeight:"bold"}}>{Math.round(log.total).toLocaleString()}</span>}
                            {log.type === "GHI NỢ" && <span style={{color:"#ea580c", fontWeight:"bold"}}>Nợ: {Math.round(log.total).toLocaleString()}</span>}
                            {log.type === "THU NỢ" && <span style={{color:"#10b981", fontWeight:"bold"}}>+{Math.round(log.total).toLocaleString()}</span>}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8", marginTop: "2px" }}>
                            <span>{log.customer}</span>
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              <span>{log.t}</span>
                              {role === 'admin' && log.type === 'BÁN' && <button onClick={() => handleRefund(log.id)} style={{ fontSize: "8px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", borderRadius: "2px" }}>↩️ Hoàn</button>}
                            </div>
                          </div>
                        </div>))}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

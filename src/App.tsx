import React, { useEffect, useState } from "react";
// @ts-ignore
import { supabase } from "./supabaseClient";

export default function App() {
  const SYS_USER = "admin";
  const SYS_PASS = "haile88";

  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("mart_logged_in") === "true");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // STATE ẨN/HIỆN FORM NHẬP KHO ĐỂ CHO GỌN
  const [showInputForm, setShowInputForm] = useState(false);

  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newImportPrice, setNewImportPrice] = useState(""); 
  const [newPrice, setNewPrice] = useState(""); 
  const [newPromoPrice, setNewPromoPrice] = useState(""); 
  const [newGiftInfo, setNewGiftInfo] = useState(""); 
  const [newStock, setNewStock] = useState("");
  const [newExpiry, setNewExpiry] = useState(""); 

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
  
  const [lastOrder, setLastOrder] = useState<any>(null);

  const [history, setHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem("mart_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [revenue, setRevenue] = useState<number>(() => {
    const saved = localStorage.getItem("mart_revenue");
    return saved ? Number(saved) : 0;
  });
  const [profit, setProfit] = useState<number>(() => {
    const saved = localStorage.getItem("mart_profit");
    return saved ? Number(saved) : 0;
  });

  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    localStorage.setItem("mart_history", JSON.stringify(history));
    localStorage.setItem("mart_revenue", revenue.toString());
    localStorage.setItem("mart_profit", profit.toString());
    localStorage.setItem("mart_customers", JSON.stringify(customers));
  }, [history, revenue, profit, customers]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchProducts();
      const channel = supabase
        .channel("db_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
          fetchProducts();
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isLoggedIn]);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setProducts(data);
  };

  const exportToCSV = () => {
    if (history.length === 0) return alert("Chưa có lịch sử để xuất!");
    let csvContent = "\uFEFFThời gian,Loại,Khách hàng,Sản phẩm,Số lượng,Thành tiền (VNĐ),Lợi nhuận (VNĐ)\n";
    history.forEach(log => {
      const exactTime = new Date(Math.floor(log.id)).toLocaleString('vi-VN');
      csvContent += `${exactTime},${log.type},${log.customer || "Khách lẻ"},${log.name},${log.qty},${log.total},${log.profit || 0}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_Cao_Hai_Le_Mart.csv`);
    link.click();
  };

  const handleSendEmailReport = () => {
    const todayStr = new Date().toLocaleDateString('vi-VN');
    const todaysLogs = history.filter(log => new Date(Math.floor(log.id)).toLocaleDateString('vi-VN') === todayStr);
    
    if (todaysLogs.length === 0) return alert("Hôm nay chưa có giao dịch nào!");

    let todayRev = 0, todayProf = 0, soldCount = 0, importCount = 0;
    todaysLogs.forEach(log => {
      if (log.type === 'BÁN') { todayRev += log.total; todayProf += log.profit || 0; soldCount += log.qty; } 
      else if (log.type === 'NHẬP') { importCount += log.qty; }
    });

    const subject = encodeURIComponent(`Báo Cáo Chốt Ca - Ngày ${todayStr}`);
    const body = encodeURIComponent(
      `Xin chào,\nBáo cáo ngày ${todayStr}:\n- Đã bán: ${soldCount} món\n- Nhập kho: ${importCount} món\n- DOANH THU: ${todayRev.toLocaleString()} đ\n- LỢI NHUẬN: ${todayProf.toLocaleString()} đ\n`
    );
    window.location.href = `mailto:lehonghaikt6@gmail.com?subject=${subject}&body=${body}`;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authUsername === SYS_USER && authPassword === SYS_PASS) {
      setIsLoggedIn(true); localStorage.setItem("mart_logged_in", "true");
    } else alert("Sai tài khoản/mật khẩu!");
  };

  const handleLogout = () => {
    if (window.confirm("Khóa máy?")) {
      setIsLoggedIn(false); localStorage.removeItem("mart_logged_in");
      setAuthUsername(""); setAuthPassword("");
    }
  };

  const getActualPrice = (p: any) => (p.promo_price && p.promo_price > 0) ? p.promo_price : p.sale_price;

  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!barcodeInput.trim()) return;
      const p = products.find(prod => prod.product_code === barcodeInput.trim());
      if (p) {
        if (p.stock <= 0) alert("Hết hàng!");
        else {
          const actualPrice = getActualPrice(p);
          const existingItem = cart.find(item => item.product.id === p.id);
          if (existingItem) setCart(cart.map(item => item.product.id === p.id ? { ...item, qty: item.qty + 1, total: (item.qty + 1) * actualPrice, profit: (item.qty + 1) * (actualPrice - (p.import_price || 0)) } : item));
          else setCart([...cart, { product: p, qty: 1, total: actualPrice, profit: actualPrice - (p.import_price || 0) }]);
        }
      } else alert("Mã sai!");
      setBarcodeInput(""); 
    }
  };

  const addToCart = (p: any) => {
    const qty = window.prompt(`Số lượng ${p.name}:`, "1");
    if (qty && parseInt(qty) > 0) {
      const addQty = parseInt(qty);
      const actualPrice = getActualPrice(p);
      const profitVal = (actualPrice - (p.import_price || 0)) * addQty;
      const existingItem = cart.find(item => item.product.id === p.id);
      if (existingItem) setCart(cart.map(item => item.product.id === p.id ? { ...item, qty: item.qty + addQty, total: (item.qty + addQty) * actualPrice, profit: item.profit + profitVal } : item));
      else setCart([...cart, { product: p, qty: addQty, total: addQty * actualPrice, profit: profitVal }]);
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

  const confirmCheckout = async () => {
    setLoading(true);
    let rev = revenue, prof = profit, logs: any[] = [];
    const currentWallet = customers[custPhone]?.wallet || 0;
    const discount = useWallet ? Math.min(currentWallet, cartTotalAmount) : 0;
    const finalAmount = Math.max(0, cartTotalAmount - discount);
    const earnedWallet = Math.floor(finalAmount * 0.02);
    const now = new Date();

    for (const item of cart) {
      await supabase.from("products").update({ stock: item.product.stock - item.qty }).eq("id", item.product.id);
      rev += item.total; prof += item.profit;
      logs.push({ 
        id: Date.now() + Math.random(), type: "BÁN", name: item.product.name, qty: item.qty, total: item.total, profit: item.profit, 
        customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ"
      });
    }
    rev -= discount; prof -= discount;

    if (custPhone) setCustomers((prev: any) => ({ ...prev, [custPhone]: { name: custName, wallet: (prev[custPhone]?.wallet || 0) - discount + earnedWallet } }));
    setRevenue(rev); setProfit(prof); setHistory(prev => [...logs, ...prev]);

    setLastOrder({
      orderId: "HD" + Date.now().toString().slice(-6), cart: [...cart], totalAmount: cartTotalAmount, discount,
      finalAmount, earnedWallet: custPhone ? earnedWallet : 0, custName: custPhone ? custName : null, custPhone: custPhone ? custPhone : null, time: now.toLocaleString('vi-VN')
    });
    
    setCheckoutStep(3); fetchProducts(); setLoading(false);
  };

  const closeCheckout = () => {
    setCart([]); setIsCheckoutOpen(false); setCheckoutStep(1); setCustPhone(""); setCustName(""); setUseWallet(false); setLastOrder(null);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value; setNewCode(code);
    const p = products.find((x: any) => x.product_code === code);
    if (p) {
      setNewName(p.name); setNewImportPrice(p.import_price?.toString() || ""); setNewPrice(p.sale_price.toString());
      setNewPromoPrice(p.promo_price?.toString() || ""); setNewGiftInfo(p.gift_info || ""); setNewExpiry(p.expiry_date || "");
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const existing = products.find(p => p.product_code === newCode);
    const addedStock = parseInt(newStock || "0");
    const inputImp = parseInt(newImportPrice);
    let finalImp = inputImp;
    if (existing && existing.stock > 0) finalImp = Math.round((existing.stock * (existing.import_price || 0) + addedStock * inputImp) / (existing.stock + addedStock));
    
    const data = { name: newName, import_price: finalImp, sale_price: parseInt(newPrice), promo_price: parseInt(newPromoPrice) || 0, gift_info: newGiftInfo || null, stock: existing ? existing.stock + addedStock : addedStock, expiry_date: newExpiry || null };
    if (existing) await supabase.from("products").update(data).eq("id", existing.id);
    else await supabase.from("products").insert([data]);
    
    if (addedStock > 0) setHistory(prev => [{ id: Date.now(), type: "NHẬP", name: newName, qty: addedStock, total: 0 }, ...prev]);
    setNewCode(""); setNewName(""); setNewImportPrice(""); setNewPrice(""); setNewPromoPrice(""); setNewGiftInfo(""); setNewStock(""); setNewExpiry("");
    fetchProducts(); setLoading(false);
    
    // Đóng form cho gọn sau khi nhập xong
    setShowInputForm(false);
  };

  const handleDelete = async (id: any, name: any) => { if (window.confirm(`Xóa vĩnh viễn ${name}?`)) { await supabase.from("products").delete().eq("id", id); fetchProducts(); } };
  const handleEdit = async (id: any, field: string, old: any, isText: boolean = false) => {
    const val = window.prompt(`Sửa ${field === 'promo_price' ? 'Giá KM (Nhập 0 để hủy)' : field === 'gift_info' ? 'Quà Tặng (Bỏ trống để hủy)' : field}:`, old || "");
    if (val !== null) { await supabase.from("products").update({ [field]: isText ? val : (parseInt(val) || 0) }).eq("id", id); fetchProducts(); }
  };

  const totalValue = products.reduce((sum, p) => sum + ((Number(p.import_price) || 0) * (Number(p.stock) || 0)), 0);

  // CSS GIAO DIỆN HIỆN ĐẠI, COMPACT
  const styles = `
    @keyframes float { 0% { transform: translate(0, 0); } 50% { transform: translate(30px, 50px); } 100% { transform: translate(0, 0); } }
    .bg-blob { position: fixed; width: 500px; height: 500px; border-radius: 50%; filter: blur(80px); z-index: -1; opacity: 0.4; animation: float 15s infinite ease-in-out; }
    .glass-card { background: rgba(255, 255, 255, 0.98); border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    body { background-color: #f1f5f9; margin: 0; font-family: 'Inter', 'Segoe UI', Tahoma, sans-serif; color: #334155; }
    .print-only { display: none; }
    .stat-pill { background: #f8fafc; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 6px; }
    
    @media print {
      body { background-color: white !important; margin: 0; padding: 0; }
      .no-print { display: none !important; }
      .print-only { display: block !important; color: #000; font-family: monospace; width: 80mm; margin: 0 auto; padding: 5mm; }
      @page { margin: 0; }
    }
  `;

  if (!isLoggedIn) {
     return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", position: "relative", overflow: "hidden" }}>
        <style>{styles}</style>
        <div className="bg-blob" style={{ background: "#3b82f6", top: "-10%", left: "-10%" }}></div>
        <div className="glass-card" style={{ padding: "40px", width: "100%", maxWidth: "380px", textAlign: "center" }}>
          <h1 style={{ color: "#1e293b", fontSize: "24px", marginBottom: "20px" }}>🏪 HẢI LÊ MART</h1>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <input placeholder="Tài khoản" value={authUsername} onChange={e => setAuthUsername(e.target.value)} style={{ padding: "12px", borderRadius: "10px", outline: "none", border: "1px solid #cbd5e1" }} />
            <input type="password" placeholder="Mật khẩu" value={authPassword} onChange={e => setAuthPassword(e.target.value)} style={{ padding: "12px", borderRadius: "10px", outline: "none", border: "1px solid #cbd5e1" }} />
            <button type="submit" style={{ padding: "12px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>ĐĂNG NHẬP</button>
          </form>
        </div>
      </div>
    );
  }

  const groupedHistory = history.reduce((groups: any, log: any) => {
    const exactDateObj = new Date(Math.floor(log.id));
    const dateStr = exactDateObj.toLocaleDateString('vi-VN'); 
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push({ ...log, displayTime: exactDateObj.toLocaleTimeString('vi-VN') });
    return groups;
  }, {});

  const toggleDateGroup = (dateStr: string) => setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));

  return (
    <div>
      <style>{styles + " button[title*='Sandbox'], .sp-preview-actions { display: none !important; } "}</style>
      
      {/* 🖨️ KHU VỰC IN HÓA ĐƠN CHUYÊN NGHIỆP */}
      {lastOrder && (
        <div className="print-only">
          <div style={{ textAlign: "center", marginBottom: "10px" }}>
            <h2 style={{ margin: "0 0 5px 0", fontSize: "22px", fontWeight: "900" }}>HẢI LÊ MART PRO</h2>
            <div style={{ fontSize: "12px", lineHeight: "1.4" }}>Tòa Nhà ATS, 252 Hoàng Quốc Việt, HN<br/> Hotline: 0902613899</div>
          </div>
          <div style={{ borderTop: "1px dashed #000", margin: "5px 0" }}></div>
          <div style={{ fontSize: "12px", display: "flex", justifyContent: "space-between" }}>
            <div>HĐ: {lastOrder.orderId}<br/>Ngày: {lastOrder.time.split(' ')[1]}</div>
            <div style={{ textAlign: "right" }}>Ca: Admin<br/>Giờ: {lastOrder.time.split(' ')[0]}</div>
          </div>
          <div style={{ borderTop: "1px dashed #000", margin: "5px 0" }}></div>

          <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "1px solid #000" }}><th style={{ textAlign: "left", paddingBottom: "5px" }}>TÊN SP</th><th style={{ textAlign: "center", paddingBottom: "5px" }}>SL</th><th style={{ textAlign: "right", paddingBottom: "5px" }}>TIỀN</th></tr></thead>
            <tbody>
              {lastOrder.cart.map((item: any, idx: number) => {
                const isPromo = item.product.promo_price > 0;
                return (
                  <React.Fragment key={idx}>
                    <tr><td colSpan={3} style={{ paddingTop: "5px", fontWeight: "bold" }}>{item.product.name}</td></tr>
                    {item.product.gift_info && <tr><td colSpan={3} style={{ fontSize: "10px", fontStyle: "italic", color: "#555" }}>+ 🎁 Tặng: {item.product.gift_info} (x{item.qty})</td></tr>}
                    <tr><td style={{ color: "#555" }}>{isPromo ? <React.Fragment><del style={{fontSize:"10px"}}>{item.product.sale_price.toLocaleString()}</del> {(item.product.promo_price).toLocaleString()}</React.Fragment> : item.product.sale_price.toLocaleString()}</td><td style={{ textAlign: "center" }}>{item.qty}</td><td style={{ textAlign: "right" }}>{item.total.toLocaleString()}đ</td></tr>
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>

          <div style={{ borderTop: "1px solid #000", margin: "10px 0" }}></div>
          <div style={{ fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Tổng tiền hàng:</span><span>{lastOrder.totalAmount.toLocaleString()}đ</span></div>
            {lastOrder.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Giảm giá (Ví):</span><span>-{lastOrder.discount.toLocaleString()}đ</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "bold", marginTop: "5px", borderTop: "1px dashed #000" }}><span>THANH TOÁN:</span><span>{lastOrder.finalAmount.toLocaleString()}đ</span></div>
          </div>
          {lastOrder.custName && (
            <div style={{ fontSize: "12px", borderTop: "1px dashed #000", marginTop: "10px", paddingTop: "5px" }}>
              <div><b>Khách:</b> {lastOrder.custName}</div><div>Tích thêm: <b>+{lastOrder.earnedWallet.toLocaleString()}đ</b></div>
            </div>
          )}
          <div style={{ borderTop: "1px dashed #000", margin: "10px 0" }}></div>
          <div style={{ textAlign: "center", fontSize: "12px" }}>
            <b>CẢM ƠN QUÝ KHÁCH!</b><br/><div style={{ margin: "10px 0", fontSize: "20px" }}>|||| || ||| | || ||</div><div style={{ fontSize: "10px" }}>{lastOrder.orderId}</div>
          </div>
        </div>
      )}

      {/* KHU VỰC GIAO DIỆN CHÍNH COMPACT */}
      <div className="no-print" style={{ padding: "15px", position: "relative", minHeight: "100vh" }}>
        
        {/* POPUP THANH TOÁN (Giữ nguyên) */}
        {isCheckoutOpen && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
            {checkoutStep === 1 && (
              <div className="glass-card" style={{ padding: "25px", width: "350px" }}>
                <h3 style={{ color: "#1e3a8a", margin: "0 0 5px 0", textAlign: "center" }}>🎁 KHÁCH HÀNG</h3>
                <input type="text" placeholder="Nhập SĐT..." value={custPhone} onChange={handlePhoneChange} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "2px solid #3b82f6", marginTop: "15px", outline: "none", boxSizing: "border-box" }} />
                {custPhone && (
                  <div style={{ marginTop: "10px", padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                    {customers[custPhone] ? (
                      <div><div style={{ color: "#16a34a", fontWeight: "bold" }}>⭐ {customers[custPhone].name}</div><div>Ví điểm: <b>{customers[custPhone].wallet.toLocaleString()}đ</b></div>
                        {customers[custPhone].wallet > 0 && <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", cursor: "pointer", color: "#ea580c", fontWeight: "bold" }}><input type="checkbox" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} style={{accentColor: "#ea580c"}}/> Dùng điểm giảm giá!</label>}
                      </div>
                    ) : <input type="text" placeholder="Tên khách mới" value={custName} onChange={e => setCustName(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", outline: "none", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />}
                  </div>
                )}
                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                  <button onClick={() => setIsCheckoutOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer", background: "#e2e8f0", fontWeight: "bold" }}>Hủy</button>
                  <button onClick={handleNextToQR} style={{ flex: 2, padding: "10px", backgroundColor: "#3b82f6", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>TIẾP TỤC 👉</button>
                </div>
              </div>
            )}
            {checkoutStep === 2 && (
              <div className="glass-card" style={{ padding: "25px", width: "350px", textAlign: "center" }}>
                <h3 style={{ color: "#1e3a8a", margin: "0 0 10px 0" }}>📱 QUÉT MÃ QR</h3>
                <div style={{ color: "#ef4444", fontSize: "28px", fontWeight: "900", marginBottom: "15px" }}>{Math.max(0, cartTotalAmount - (useWallet ? customers[custPhone]?.wallet || 0 : 0)).toLocaleString()}đ</div>
                <img src={`https://img.vietqr.io/image/970422-0680124181004-compact2.png?amount=${Math.max(0, cartTotalAmount - (useWallet ? customers[custPhone]?.wallet || 0 : 0))}&addInfo=Thanh toan&accountName=LE%20HONG%20HAI`} style={{ width: "200px", display: "block", margin: "0 auto 15px auto" }} />
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => setCheckoutStep(1)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer", background: "#e2e8f0", fontWeight: "bold" }}>Quay lại</button>
                  <button onClick={confirmCheckout} disabled={loading} style={{ flex: 2, padding: "10px", backgroundColor: "#10b981", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>✔️ ĐÃ NHẬN TIỀN</button>
                </div>
              </div>
            )}
            {checkoutStep === 3 && lastOrder && (
              <div className="glass-card" style={{ padding: "30px", width: "350px", textAlign: "center" }}>
                <div style={{ fontSize: "40px" }}>🎉</div><h3 style={{ color: "#16a34a", margin: "10px 0" }}>Thành công!</h3>
                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                  <button onClick={() => window.print()} style={{ flex: 1, padding: "12px", backgroundColor: "#3b82f6", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>🖨️ In Hóa Đơn</button>
                  <button onClick={closeCheckout} style={{ flex: 1, padding: "12px", backgroundColor: "#e2e8f0", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" }}>Đóng</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          
          {/* HEADER GOM GỌN THỐNG KÊ LÊN TRÊN CÙNG ĐỂ TIẾT KIỆM KHÔNG GIAN */}
          <div className="glass-card" style={{ padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ color: "#1e3a8a", margin: 0, fontSize: "18px" }}>🏪 HẢI LÊ MART</h2>
            </div>
            
            <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
              <div className="stat-pill"><span style={{color: "#8b5cf6"}}>📦 Vốn:</span> {totalValue.toLocaleString()}đ</div>
              <div className="stat-pill"><span style={{color: "#3b82f6"}}>💰 Doanh thu:</span> {revenue.toLocaleString()}đ</div>
              <div className="stat-pill"><span style={{color: "#10b981"}}>📈 Lợi nhuận:</span> {profit.toLocaleString()}đ</div>
              <button onClick={handleLogout} style={{ padding: "6px 12px", backgroundColor: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" }}>Đăng xuất 🔒</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "15px" }}>
            {/* CỘT TRÁI - QUẢN LÝ SẢN PHẨM */}
            <div className="glass-card" style={{ padding: "15px" }}>
              
              {/* Ô TÍT MÃ */}
              <input placeholder="🔍 BẮN MÃ VẠCH ĐỂ BÁN HÀNG HOẶC TÌM KIẾM..." value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} onKeyDown={handleBarcodeSubmit} style={{ width: "100%", padding: "12px 15px", borderRadius: "10px", border: "2px solid #3b82f6", marginBottom: "10px", fontSize: "15px", fontWeight: "bold", outline: "none", background: "#eff6ff", boxSizing: "border-box" }} />

              {/* NÚT BẤM ĐỂ MỞ/ĐÓNG FORM NHẬP KHO */}
              <div 
                onClick={() => setShowInputForm(!showInputForm)} 
                style={{ backgroundColor: "#f1f5f9", padding: "10px", borderRadius: "8px", fontWeight: "bold", color: "#475569", cursor: "pointer", textAlign: "center", marginBottom: "15px", border: "1px dashed #cbd5e1", fontSize: "13px" }}
              >
                {showInputForm ? "➖ THU GỌN FORM NHẬP KHO" : "➕ NHẬP KHO HOẶC CÀI ĐẶT KHUYẾN MÃI"}
              </div>

              {/* FORM NHẬP KHO (CHỈ HIỆN KHI BẤM NÚT) */}
              {showInputForm && (
                <form onSubmit={handleAddProduct} style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "15px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                    <input placeholder="Mã hàng..." value={newCode} onChange={handleCodeChange} style={{ padding: "6px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", outline: "none", fontSize: "12px" }} />
                    <input placeholder="Tên sản phẩm..." value={newName} onChange={e => setNewName(e.target.value)} style={{ padding: "6px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", outline: "none", fontSize: "12px" }} />
                    <input type="number" placeholder="Giá nhập..." value={newImportPrice} onChange={e => setNewImportPrice(e.target.value)} style={{ padding: "6px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", outline: "none", fontSize: "12px" }} />
                    <input type="number" placeholder="Giá bán..." value={newPrice} onChange={e => setNewPrice(e.target.value)} style={{ padding: "6px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", outline: "none", fontSize: "12px" }} />
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 0.8fr 80px", gap: "8px" }}>
                    <input type="number" placeholder="Giá KM (nếu có)" value={newPromoPrice} onChange={e => setNewPromoPrice(e.target.value)} style={{ padding: "6px 8px", borderRadius: "4px", border: "1px solid #f59e0b", background: "#fffbeb", outline: "none", fontSize: "12px" }} />
                    <input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} style={{ padding: "6px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", color: "#475569", outline: "none", fontSize: "12px" }} />
                    <input type="text" placeholder="Quà tặng (VD: 1 cốc)" value={newGiftInfo} onChange={e => setNewGiftInfo(e.target.value)} style={{ padding: "6px 8px", borderRadius: "4px", border: "1px solid #10b981", background: "#f0fdf4", outline: "none", fontSize: "12px" }} />
                    <input type="number" placeholder="SL..." value={newStock} onChange={e => setNewStock(e.target.value)} style={{ padding: "6px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", outline: "none", fontSize: "12px" }} />
                    <button type="submit" disabled={loading} style={{ padding: "6px", backgroundColor: "#1e3a8a", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" }}>LƯU</button>
                  </div>
                </form>
              )}

              {/* THANH TÌM KIẾM CẦM TAY */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "13px", fontWeight: "bold", color: "#1e3a8a" }}>📋 DANH SÁCH SẢN PHẨM</div>
                <input placeholder="🔍 Lọc tìm kiếm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: "6px 12px", borderRadius: "15px", border: "1px solid #cbd5e1", outline: "none", width: "200px", fontSize: "12px" }} />
              </div>

              {/* BẢNG SẢN PHẨM TINH GỌN */}
              <div style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ color: "#64748b", fontSize: "10px", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
                      <th style={{ textAlign: "left", padding: "6px 4px", borderBottom: "2px solid #e2e8f0" }}>SẢN PHẨM</th>
                      <th style={{ textAlign: "center", padding: "6px 4px", borderBottom: "2px solid #e2e8f0" }}>TỒN</th>
                      <th style={{ textAlign: "center", padding: "6px 4px", borderBottom: "2px solid #e2e8f0" }}>GIÁ VỐN</th>
                      <th style={{ textAlign: "center", padding: "6px 4px", borderBottom: "2px solid #e2e8f0" }}>GIÁ BÁN</th>
                      <th style={{ textAlign: "center", padding: "6px 4px", borderBottom: "2px solid #e2e8f0" }}>HSD / LƯU KHO</th>
                      <th style={{ textAlign: "right", padding: "6px 4px", borderBottom: "2px solid #e2e8f0" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => {
                      const isPromo = p.promo_price > 0;
                      const days = Math.floor(Math.abs(new Date().getTime() - new Date(p.created_at).getTime()) / 86400000);
                      return (
                        <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 4px" }}>
                            <div style={{fontSize: "13px", fontWeight: "bold", color: "#1e293b"}}>{p.name}</div>
                            <div style={{fontSize: "10px", color: "#94a3b8"}}>{p.product_code}</div>
                            {p.gift_info ? <div style={{ fontSize: "10px", color: "#10b981", fontWeight: "bold", cursor: "pointer" }} onClick={()=>handleEdit(p.id, 'gift_info', p.gift_info, true)}>🎁 Tặng: {p.gift_info}</div> : <div style={{ fontSize: "9px", color: "#cbd5e1", cursor: "pointer" }} onClick={()=>handleEdit(p.id, 'gift_info', '', true)}>+ Thêm quà</div>}
                          </td>
                          <td style={{ textAlign: "center", fontSize: "13px", fontWeight: "bold" }}>{p.stock}</td>
                          <td style={{ textAlign: "center", color: "#64748b", cursor: "pointer", fontSize: "12px" }} onClick={()=>handleEdit(p.id, 'import_price', p.import_price)}>{p.import_price?.toLocaleString()}</td>
                          <td style={{ textAlign: "center" }}>
                            <div style={{ color: isPromo ? "#94a3b8" : "#059669", textDecoration: isPromo ? "line-through" : "none", fontWeight: isPromo ? "normal" : "bold", fontSize: isPromo ? "11px" : "13px", cursor: "pointer" }} onClick={()=>handleEdit(p.id, 'sale_price', p.sale_price)}>
                              {p.sale_price.toLocaleString()}
                            </div>
                            {isPromo && <div style={{ color: "#ef4444", fontWeight: "900", fontSize: "13px", cursor: "pointer" }} onClick={()=>handleEdit(p.id, 'promo_price', p.promo_price)}>🔥 {p.promo_price.toLocaleString()}</div>}
                            {!isPromo && <div style={{ fontSize: "9px", color: "#cbd5e1", cursor: "pointer" }} onClick={()=>handleEdit(p.id, 'promo_price', 0)}>+ Giá KM</div>}
                          </td>
                          <td style={{ textAlign: "center", fontSize: "10px" }}>
                            <div style={{color: "#b91c1c", cursor: "pointer", fontWeight: "bold"}} onClick={()=>handleEdit(p.id,'expiry_date',p.expiry_date,true)}>{p.expiry_date ? new Date(p.expiry_date).toLocaleDateString('vi-VN') : "---"}</div>
                            <div style={{color: days > 30 ? "#ea580c" : "#16a34a"}}>{days} ngày</div>
                          </td>
                          <td style={{ textAlign: "right", padding: "8px 4px" }}>
                            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "6px" }}>
                              <button onClick={() => addToCart(p)} style={{ padding: "6px 8px", backgroundColor: "#f59e0b", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "11px" }}>+ GIỎ</button>
                              <button onClick={() => handleDelete(p.id, p.name)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "13px", padding: 0 }} title="Xóa">🗑️</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CỘT PHẢI - GIỎ HÀNG & LỊCH SỬ NHỎ GỌN */}
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              
              <div className="glass-card" style={{ padding: "15px", display: "flex", flexDirection: "column", maxHeight: "35vh" }}>
                <h3 style={{ margin: "0 0 10px 0", color: "#d97706", fontSize: "14px" }}>🛒 GIỎ HÀNG ({cart.length})</h3>
                <div style={{ flex: 1, overflowY: "auto", marginBottom: "10px" }}>
                  {cart.length === 0 && <div style={{textAlign: "center", color: "#94a3b8", fontSize: "11px"}}>Giỏ hàng trống</div>}
                  {cart.map((item, idx) => (
                    <div key={idx} style={{ padding: "6px 0", borderBottom: "1px dashed #e2e8f0", fontSize: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: "bold", color: "#1e293b" }}>{item.product.name} <span style={{color: "#64748b"}}>x{item.qty}</span></span>
                        <button onClick={()=>removeFromCart(item.product.id)} style={{border:"none",background:"none",color:"#ef4444", cursor: "pointer", fontSize: "14px"}}>×</button>
                      </div>
                      {item.product.gift_info && <div style={{ color: "#10b981", fontSize: "10px", fontStyle: "italic", marginTop: "2px" }}>+ 🎁 Tặng {item.qty} {item.product.gift_info.replace('Tặng ', '')}</div>}
                      <div style={{ color: "#ef4444", fontWeight: "bold", textAlign: "right", marginTop: "2px" }}>{item.total.toLocaleString()}đ</div>
                    </div>
                  ))}
                </div>
                {cart.length > 0 && (
                  <button onClick={() => { setIsCheckoutOpen(true); setCheckoutStep(1); }} style={{ width: "100%", padding: "10px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", fontSize: "14px", cursor: "pointer" }}>
                    THANH TOÁN: {cart.reduce((s,i)=>s+i.total,0).toLocaleString()}đ
                  </button>
                )}
              </div>

              <div className="glass-card" style={{ padding: "15px", flex: 1, display: "flex", flexDirection: "column", maxHeight: "calc(65vh - 85px)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "14px" }}>📋 NHẬT KÝ</h3>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button onClick={exportToCSV} style={{ fontSize: "9px", padding: "4px 6px", background: "#10b981", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>EXCEL</button>
                    <button onClick={handleSendEmailReport} style={{ fontSize: "9px", padding: "4px 6px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>✉ CHỐT</button>
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: "auto", paddingRight: "2px" }}>
                  {Object.keys(history.reduce((g:any, l:any)=>{const d=new Date(Math.floor(l.id)).toLocaleDateString('vi-VN');if(!g[d])g[d]=[];g[d].push({...l,t:new Date(Math.floor(l.id)).toLocaleTimeString('vi-VN')});return g;},{})).length === 0 && <div style={{textAlign: "center", color: "#94a3b8", fontSize: "11px", marginTop: "10px"}}>Chưa có dữ liệu</div>}
                  {Object.keys(history.reduce((g:any, l:any)=>{const d=new Date(Math.floor(l.id)).toLocaleDateString('vi-VN');if(!g[d])g[d]=[];g[d].push({...l,t:new Date(Math.floor(l.id)).toLocaleTimeString('vi-VN')});return g;},{})).map((dateStr) => {
                    const group = history.reduce((g:any, l:any)=>{const d=new Date(Math.floor(l.id)).toLocaleDateString('vi-VN');if(!g[d])g[d]=[];g[d].push({...l,t:new Date(Math.floor(l.id)).toLocaleTimeString('vi-VN')});return g;},{})[dateStr];
                    const isExpanded = expandedDates[dateStr] ?? true;
                    return (
                      <div key={dateStr} style={{ marginBottom: "8px", backgroundColor: "#f8fafc", borderRadius: "6px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                        <div onClick={() => toggleDateGroup(dateStr)} style={{ backgroundColor: "#f1f5f9", padding: "6px 10px", fontSize: "11px", fontWeight: "bold", color: "#334155", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>📅 {dateStr}</span>
                          <span style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", fontSize: "9px" }}>▶</span>
                        </div>
                        {isExpanded && (
                          <div style={{ padding: "0 10px" }}>
                            {group.map((log: any) => (
                              <div key={log.id} style={{ padding: "6px 0", borderBottom: "1px dashed #e2e8f0", fontSize: "10px", display: "flex", flexDirection: "column", gap: "2px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span><b>[{log.type}]</b> {log.name} <span style={{color:"#64748b"}}>x{log.qty}</span></span>
                                  {log.type === "BÁN" && <span style={{color:"#059669", fontWeight: "bold"}}>+{log.total?.toLocaleString()}đ</span>}
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
                                  <span>{log.customer && `👤 ${log.customer}`}</span>
                                  <span>{log.t}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
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

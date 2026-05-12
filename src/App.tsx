import React, { useEffect, useState } from "react";
// @ts-ignore
import { supabase } from "./supabaseClient";

export default function App() {
  const SYS_USER = "admin";
  const SYS_PASS = "haile88";
  const VAT_RATE = 0.1; // Mặc định 10% VAT. Đổi thành 0.08 nếu muốn 8%.

  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("mart_logged_in") === "true");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
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
        .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchProducts())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isLoggedIn]);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setProducts(data);
  };

  const exportToCSV = () => {
    if (history.length === 0) return alert("Chưa có lịch sử!");
    let csv = "\uFEFFGiờ,Loại,Khách,Sản phẩm,SL,Tổng(VAT),Lợi nhuận\n";
    history.forEach(log => {
      const time = new Date(Math.floor(log.id)).toLocaleString('vi-VN');
      csv += `${time},${log.type},${log.customer || "Khách lẻ"},${log.name},${log.qty},${log.total},${log.profit || 0}\n`;
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
    const body = encodeURIComponent(`Báo cáo ngày ${todayStr}:\n- Đã bán: ${sold} món\n- Doanh thu (có VAT): ${rev.toLocaleString()}đ\n- Lợi nhuận: ${prof.toLocaleString()}đ`);
    window.location.href = `mailto:lehonghaikt6@gmail.com?subject=${sub}&body=${body}`;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authUsername === SYS_USER && authPassword === SYS_PASS) {
      setIsLoggedIn(true); localStorage.setItem("mart_logged_in", "true");
    } else alert("Sai tài khoản!");
  };

  const handleLogout = () => { if (window.confirm("Khóa máy?")) { setIsLoggedIn(false); localStorage.removeItem("mart_logged_in"); } };

  const getActualPrice = (p: any) => (p.promo_price && p.promo_price > 0) ? p.promo_price : p.sale_price;

  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const p = products.find(prod => prod.product_code === barcodeInput.trim());
      if (p) {
        if (p.stock <= 0) alert("Hết hàng!");
        else {
          const price = getActualPrice(p);
          const exist = cart.find(item => item.product.id === p.id);
          if (exist) setCart(cart.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1, total: (i.qty+1)*price*(1+VAT_RATE), profit: (i.qty+1)*(price - (p.import_price||0)) } : i));
          else setCart([...cart, { product: p, qty: 1, total: price*(1+VAT_RATE), profit: price - (p.import_price||0) }]);
        }
      } else alert("Mã sai!");
      setBarcodeInput(""); 
    }
  };

  const addToCart = (p: any) => {
    const q = window.prompt(`Số lượng ${p.name}:`, "1");
    if (q && parseInt(q) > 0) {
      const qty = parseInt(q); const pr = getActualPrice(p);
      const exist = cart.find(item => item.product.id === p.id);
      if (exist) setCart(cart.map(i => i.product.id === p.id ? { ...i, qty: i.qty + qty, total: (i.qty+qty)*pr*(1+VAT_RATE), profit: (i.qty+qty)*(pr - (p.import_price||0)) } : i));
      else setCart([...cart, { product: p, qty, total: qty*pr*(1+VAT_RATE), profit: qty*(pr - (p.import_price||0)) }]);
    }
  };

  const handleNextToQR = () => {
    if (custPhone && !customers[custPhone] && !custName) return alert("Nhập Tên khách hàng!");
    setCheckoutStep(2);
  };

  const confirmCheckout = async () => {
    setLoading(true);
    let rev = revenue, prof = profit, logs: any[] = [];
    const subTotal = cart.reduce((s, i) => s + (i.qty * getActualPrice(i.product)), 0);
    const vatTotal = subTotal * VAT_RATE;
    const finalTotal = subTotal + vatTotal;
    
    const wallet = customers[custPhone]?.wallet || 0;
    const discount = useWallet ? Math.min(wallet, finalTotal) : 0;
    const finalPaid = Math.max(0, finalTotal - discount);
    const earned = Math.floor(finalPaid * 0.02);

    for (const item of cart) {
      await supabase.from("products").update({ stock: item.product.stock - item.qty }).eq("id", item.product.id);
      logs.push({ id: Date.now() + Math.random(), type: "BÁN", name: item.product.name, qty: item.qty, total: item.total, profit: item.profit, customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ" });
    }
    
    if (custPhone) setCustomers((prev: any) => ({ ...prev, [custPhone]: { name: custName, wallet: (prev[custPhone]?.wallet || 0) - discount + earned } }));
    setRevenue(rev + finalPaid); setProfit(prof + (subTotal - cart.reduce((s,i)=>s+(i.qty*(i.product.import_price||0)),0)) - discount); 
    setHistory(prev => [...logs, ...prev]);

    setLastOrder({ orderId: "HD" + Date.now().toString().slice(-6), cart: [...cart], subTotal, vatTotal, finalTotal: finalPaid, discount, earnedWallet: custPhone ? earned : 0, custName: custPhone ? custName : null, custPhone: custPhone ? custPhone : null, time: new Date().toLocaleString('vi-VN') });
    setCheckoutStep(3); fetchProducts(); setLoading(false);
  };

  const closeCheckout = () => { setCart([]); setIsCheckoutOpen(false); setCheckoutStep(1); setCustPhone(""); setCustName(""); setUseWallet(false); setLastOrder(null); };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value; setNewCode(code);
    const p = products.find((x: any) => x.product_code === code);
    if (p) { setNewName(p.name); setNewImportPrice(p.import_price?.toString() || ""); setNewPrice(p.sale_price.toString()); setNewPromoPrice(p.promo_price?.toString() || ""); setNewGiftInfo(p.gift_info || ""); setNewExpiry(p.expiry_date || ""); }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const exist = products.find(p => p.product_code === newCode);
    const added = parseInt(newStock || "0"); const impPrice = parseInt(newImportPrice);
    let fImp = impPrice;
    if (exist && exist.stock > 0) fImp = Math.round((exist.stock * (exist.import_price || 0) + added * impPrice) / (exist.stock + added));
    const data = { name: newName, import_price: fImp, sale_price: parseInt(newPrice), promo_price: parseInt(newPromoPrice) || 0, gift_info: newGiftInfo || null, stock: exist ? exist.stock + added : added, expiry_date: newExpiry || null };
    if (exist) await supabase.from("products").update(data).eq("id", exist.id); else await supabase.from("products").insert([data]);
    if (added > 0) setHistory(prev => [{ id: Date.now(), type: "NHẬP", name: newName, qty: added, total: 0 }, ...prev]);
    setNewCode(""); setNewName(""); setNewImportPrice(""); setNewPrice(""); setNewPromoPrice(""); setNewGiftInfo(""); setNewStock(""); setNewExpiry("");
    fetchProducts(); setLoading(false); setShowInputForm(false);
  };

  const styles = `
    @keyframes float { 0% { transform: translateY(0); } 50% { transform: translateY(-20px); } 100% { transform: translateY(0); } }
    .spring-bg { position: fixed; width: 400px; height: 400px; border-radius: 50%; filter: blur(100px); z-index: -1; opacity: 0.3; animation: float 10s infinite ease-in-out; }
    .glass { background: rgba(255, 255, 255, 0.95); border: 1px solid #fed7aa; border-radius: 16px; box-shadow: 0 10px 25px rgba(251, 146, 60, 0.1); }
    body { background-color: #fff7ed; margin: 0; font-family: 'Inter', sans-serif; color: #431407; }
    .stat-box { background: #fff; padding: 8px 15px; border-radius: 20px; font-size: 13px; font-weight: 700; border: 1px solid #fdba74; display: flex; align-items: center; gap: 8px; color: #9a3412; }
    .print-only { display: none; }
    @media print {
      body { background: white !important; } .no-print { display: none !important; }
      .print-only { display: block !important; color: #000; font-family: monospace; width: 80mm; margin: 0 auto; padding: 5mm; }
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
            <input placeholder="Tên đăng nhập" value={authUsername} onChange={e => setAuthUsername(e.target.value)} style={{ padding: "14px", borderRadius: "10px", border: "1px solid #f97316", outline: "none" }} />
            <input type="password" placeholder="Mật khẩu" value={authPassword} onChange={e => setAuthPassword(e.target.value)} style={{ padding: "14px", borderRadius: "10px", border: "1px solid #f97316", outline: "none" }} />
            <button type="submit" style={{ padding: "14px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>MỞ CỬA BÁN HÀNG 🧧</button>
          </form>
        </div>
      </div>
    );
  }

  const groupedHistory = history.reduce((groups: any, log: any) => {
    const date = new Date(Math.floor(log.id)).toLocaleDateString('vi-VN'); 
    if (!groups[date]) groups[date] = [];
    groups[date].push({ ...log, t: new Date(Math.floor(log.id)).toLocaleTimeString('vi-VN') });
    return groups;
  }, {});

  return (
    <div>
      <style>{styles + " button[title*='Sandbox'], .sp-preview-actions { display: none !important; } "}</style>
      
      {/* 🖨️ BIÊN LAI VAT CHUYÊN NGHIỆP */}
      {lastOrder && (
        <div className="print-only">
          <div style={{ textAlign: "center", marginBottom: "10px" }}>
            <h2 style={{ margin: "0", fontSize: "20px" }}>HẢI LÊ MART</h2>
            <div style={{ fontSize: "11px" }}>Tòa Nhà ATS, 252 Hoàng Quốc Việt, HN<br/>Hotline: 0902613899</div>
          </div>
          <div style={{ borderTop: "1px dashed #000", margin: "5px 0" }}></div>
          <div style={{ fontSize: "11px", display: "flex", justifyContent: "space-between" }}>
            <div>HĐ: {lastOrder.orderId}<br/>Ngày: {lastOrder.time.split(' ')[1]}</div>
            <div style={{ textAlign: "right" }}>TN: Admin<br/>Giờ: {lastOrder.time.split(' ')[0]}</div>
          </div>
          <div style={{ borderTop: "1px dashed #000", margin: "5px 0" }}></div>
          <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "1px solid #000" }}><th style={{ textAlign: "left" }}>TÊN</th><th style={{ textAlign: "center" }}>SL</th><th style={{ textAlign: "right" }}>TIỀN</th></tr></thead>
            <tbody>
              {lastOrder.cart.map((item: any, idx: number) => (
                <React.Fragment key={idx}>
                  <tr><td colSpan={3} style={{ paddingTop: "4px", fontWeight: "bold" }}>{item.product.name}</td></tr>
                  {item.product.gift_info && <tr><td colSpan={3} style={{ fontSize: "9px", fontStyle: "italic" }}>+ 🎁 Tặng: {item.product.gift_info}</td></tr>}
                  <tr><td style={{ color: "#444" }}>{getActualPrice(item.product).toLocaleString()}</td><td style={{ textAlign: "center" }}>{item.qty}</td><td style={{ textAlign: "right" }}>{(item.qty * getActualPrice(item.product)).toLocaleString()}</td></tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
          <div style={{ borderTop: "1px solid #000", margin: "8px 0" }}></div>
          <div style={{ fontSize: "12px", lineHeight: "1.5" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Cộng tiền hàng:</span><span>{lastOrder.subTotal.toLocaleString()}đ</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Thuế GTGT ({VAT_RATE*100}%):</span><span>{lastOrder.vatTotal.toLocaleString()}đ</span></div>
            {lastOrder.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Giảm giá/Ví:</span><span>-{lastOrder.discount.toLocaleString()}đ</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "bold", borderTop: "1px dashed #000", marginTop: "5px" }}><span>THANH TOÁN:</span><span>{lastOrder.finalTotal.toLocaleString()}đ</span></div>
          </div>
          <div style={{ borderTop: "1px dashed #000", margin: "10px 0", textAlign: "center", fontSize: "11px" }}><b>CẢM ƠN QUÝ KHÁCH!</b><br/>{lastOrder.orderId}</div>
        </div>
      )}

      <div className="no-print" style={{ padding: "15px", position: "relative", minHeight: "100vh" }}>
        <div className="spring-bg" style={{ background: "#ef4444", top: "10%", left: "5%" }}></div>
        <div className="spring-bg" style={{ background: "#f59e0b", bottom: "10%", right: "5%" }}></div>

        {/* POPUP THANH TOÁN */}
        {isCheckoutOpen && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
            {checkoutStep === 1 && (
              <div className="glass" style={{ padding: "25px", width: "350px" }}>
                <h3 style={{ color: "#ef4444", margin: "0", textAlign: "center" }}>🧧 THÀNH VIÊN</h3>
                <input type="text" placeholder="Số điện thoại khách..." value={custPhone} onChange={handlePhoneChange} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "2px solid #ef4444", marginTop: "15px", outline: "none", boxSizing: "border-box" }} />
                {custPhone && (
                  <div style={{ marginTop: "10px", padding: "12px", backgroundColor: "#fff7ed", borderRadius: "8px", border: "1px dashed #f97316" }}>
                    {customers[custPhone] ? (
                      <div><div style={{ color: "#b91c1c", fontWeight: "bold" }}>⭐ {customers[custPhone].name}</div><div>Ví điểm: <b>{customers[custPhone].wallet.toLocaleString()}đ</b></div>
                        {customers[custPhone].wallet > 0 && <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", cursor: "pointer", color: "#ea580c", fontWeight: "bold" }}><input type="checkbox" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} /> Dùng điểm lì xì!</label>}
                      </div>
                    ) : <input type="text" placeholder="Tên khách mới..." value={custName} onChange={e => setCustName(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", outline: "none", border: "1px solid #fdba74", boxSizing: "border-box" }} />}
                  </div>
                )}
                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                  <button onClick={() => setIsCheckoutOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#e2e8f0", fontWeight: "bold" }}>Hủy</button>
                  <button onClick={handleNextToQR} style={{ flex: 2, padding: "10px", backgroundColor: "#ef4444", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none" }}>TIẾP TỤC 👉</button>
                </div>
              </div>
            )}
            {checkoutStep === 2 && (
              <div className="glass" style={{ padding: "25px", width: "350px", textAlign: "center" }}>
                <h3 style={{ color: "#ef4444", margin: "0" }}>📱 QUÉT MÃ QR</h3>
                <div style={{ color: "#ef4444", fontSize: "28px", fontWeight: "900", margin: "10px 0" }}>{(cart.reduce((s,i)=>s+i.total,0) - (useWallet ? Math.min(customers[custPhone]?.wallet||0, cart.reduce((s,i)=>s+i.total,0)) : 0)).toLocaleString()}đ</div>
                <img src={`https://img.vietqr.io/image/970422-0680124181004-compact2.png?amount=${(cart.reduce((s,i)=>s+i.total,0) - (useWallet ? Math.min(customers[custPhone]?.wallet||0, cart.reduce((s,i)=>s+i.total,0)) : 0))}&addInfo=Thanh toan&accountName=LE%20HONG%20HAI`} style={{ width: "200px", margin: "0 auto 15px auto", border: "2px solid #ef4444", borderRadius: "10px" }} />
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => setCheckoutStep(1)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#e2e8f0" }}>Quay lại</button>
                  <button onClick={confirmCheckout} disabled={loading} style={{ flex: 2, padding: "10px", backgroundColor: "#10b981", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none" }}>✔️ NHẬN TIỀN</button>
                </div>
              </div>
            )}
            {checkoutStep === 3 && (
              <div className="glass" style={{ padding: "30px", width: "350px", textAlign: "center" }}>
                <div style={{ fontSize: "40px" }}>🌸</div><h3 style={{ color: "#10b981", margin: "10px 0" }}>Thanh toán thành công!</h3>
                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                  <button onClick={() => window.print()} style={{ flex: 1, padding: "12px", backgroundColor: "#ef4444", color: "#fff", borderRadius: "8px", fontWeight: "bold", border: "none" }}>🖨️ In Hóa Đơn</button>
                  <button onClick={closeCheckout} style={{ flex: 1, padding: "12px", backgroundColor: "#e2e8f0", borderRadius: "8px", fontWeight: "bold", border: "none" }}>Đóng</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <div className="glass" style={{ padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", borderBottom: "4px solid #ef4444" }}>
            <h2 style={{ color: "#ef4444", margin: 0, fontSize: "20px" }}>🏪 HẢI LÊ MART 🌸</h2>
            <div style={{ display: "flex", gap: "10px" }}>
              <div className="stat-box">🧧 Vốn: {totalValue.toLocaleString()}đ</div>
              <div className="stat-box" style={{background: "#fee2e2"}}>💰 Doanh thu: {revenue.toLocaleString()}đ</div>
              <div className="stat-box" style={{background: "#f0fdf4"}}>📈 Lợi nhuận: {profit.toLocaleString()}đ</div>
              <button onClick={handleLogout} style={{ padding: "6px 12px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" }}>Khóa 🔒</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "15px" }}>
            <div className="glass" style={{ padding: "15px" }}>
              <input placeholder="🔍 BẮN MÃ VẠCH / TÌM KIẾM..." value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} onKeyDown={handleBarcodeSubmit} style={{ width: "100%", padding: "12px 15px", borderRadius: "10px", border: "3px solid #ef4444", marginBottom: "10px", fontSize: "16px", fontWeight: "bold", outline: "none", background: "#fff", boxSizing: "border-box" }} />

              <div onClick={() => setShowInputForm(!showInputForm)} style={{ backgroundColor: "#fef2f2", padding: "10px", borderRadius: "8px", fontWeight: "bold", color: "#b91c1c", cursor: "pointer", textAlign: "center", marginBottom: "15px", border: "1px dashed #ef4444", fontSize: "13px" }}>
                {showInputForm ? "➖ THU GỌN NHẬP KHO" : "➕ NHẬP KHO & CÀI KHUYẾN MÃI"}
              </div>

              {showInputForm && (
                <form onSubmit={handleAddProduct} style={{ backgroundColor: "#fff7ed", padding: "12px", borderRadius: "8px", border: "1px solid #fdba74", marginBottom: "15px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                    <input placeholder="Mã..." value={newCode} onChange={handleCodeChange} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none" }} />
                    <input placeholder="Tên hàng..." value={newName} onChange={e => setNewName(e.target.value)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none" }} />
                    <input type="number" placeholder="Giá nhập..." value={newImportPrice} onChange={e => setNewImportPrice(e.target.value)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none" }} />
                    <input type="number" placeholder="Giá bán..." value={newPrice} onChange={e => setNewPrice(e.target.value)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 0.8fr 80px", gap: "8px" }}>
                    <input type="number" placeholder="Giá KM" value={newPromoPrice} onChange={e => setNewPromoPrice(e.target.value)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ef4444", background: "#fff", outline: "none" }} />
                    <input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none" }} />
                    <input type="text" placeholder="Quà tặng" value={newGiftInfo} onChange={e => setNewGiftInfo(e.target.value)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #10b981", outline: "none" }} />
                    <input type="number" placeholder="SL..." value={newStock} onChange={e => setNewStock(e.target.value)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none" }} />
                    <button type="submit" disabled={loading} style={{ padding: "8px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold" }}>LƯU</button>
                  </div>
                </form>
              )}

              <div style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr style={{ color: "#9a3412", fontSize: "11px", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}><th style={{ textAlign: "left", padding: "10px" }}>SẢN PHẨM</th><th style={{ textAlign: "center" }}>TỒN</th><th style={{ textAlign: "center" }}>GIÁ VỐN</th><th style={{ textAlign: "center" }}>GIÁ BÁN (CHƯA VAT)</th><th style={{ textAlign: "center" }}>HSD/KHO</th><th style={{ textAlign: "right" }}></th></tr></thead>
                  <tbody>
                    {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => {
                      const isP = p.promo_price > 0; const d = Math.floor(Math.abs(new Date().getTime() - new Date(p.created_at).getTime()) / 86400000);
                      return (
                        <tr key={p.id} style={{ borderBottom: "1px solid #fed7aa" }}>
                          <td style={{ padding: "10px 5px" }}><div style={{fontSize: "14px", fontWeight: "bold"}}>{p.name}</div><div style={{fontSize: "10px", color: "#94a3b8"}}>{p.product_code}</div>{p.gift_info ? <div style={{ fontSize: "10px", color: "#059669", fontWeight: "bold" }}>🎁 Tặng: {p.gift_info}</div> : <div style={{ fontSize: "9px", color: "#cbd5e1" }} onClick={()=>handleEdit(p.id, 'gift_info', '', true)}>+ Thêm quà</div>}</td>
                          <td style={{ textAlign: "center", fontWeight: "bold" }}>{p.stock}</td>
                          <td style={{ textAlign: "center", color: "#64748b", fontSize: "12px" }}>{p.import_price?.toLocaleString()}đ</td>
                          <td style={{ textAlign: "center" }}>
                            <div style={{ color: isP ? "#94a3b8" : "#b91c1c", textDecoration: isP ? "line-through" : "none", fontSize: isP ? "11px" : "14px", fontWeight: "bold" }} onClick={()=>handleEdit(p.id, 'sale_price', p.sale_price)}>{p.sale_price.toLocaleString()}đ</div>
                            {isP && <div style={{ color: "#ef4444", fontWeight: "900", fontSize: "14px" }} onClick={()=>handleEdit(p.id, 'promo_price', p.promo_price)}>🔥 {p.promo_price.toLocaleString()}đ</div>}
                          </td>
                          <td style={{ textAlign: "center", fontSize: "10px" }}><div style={{color: "#b91c1c", fontWeight: "bold"}} onClick={()=>handleEdit(p.id,'expiry_date',p.expiry_date,true)}>{p.expiry_date ? new Date(p.expiry_date).toLocaleDateString('vi-VN') : "---"}</div><div>{d} ngày</div></td>
                          <td style={{ textAlign: "right" }}><div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}><button onClick={() => addToCart(p)} style={{ padding: "6px 10px", backgroundColor: "#fbbf24", color: "#78350f", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>+ GIỎ</button><button onClick={() => handleDelete(p.id, p.name)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "14px" }}>🗑️</button></div></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div className="glass" style={{ padding: "15px", maxHeight: "40vh", display: "flex", flexDirection: "column" }}>
                <h3 style={{ margin: "0 0 10px 0", color: "#ef4444", fontSize: "15px" }}>🛒 GIỎ HÀNG ({cart.length})</h3>
                <div style={{ flex: 1, overflowY: "auto", marginBottom: "10px" }}>
                  {cart.map((item, idx) => (
                    <div key={idx} style={{ padding: "6px 0", borderBottom: "1px dashed #fed7aa", fontSize: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><b>{item.product.name} x{item.qty}</b><button onClick={()=>removeFromCart(item.product.id)} style={{border:"none",background:"none",color:"#ef4444", cursor:"pointer"}}>×</button></div>
                      <div style={{ color: "#ef4444", fontWeight: "bold", textAlign: "right" }}>{item.total.toLocaleString()}đ <small>(VAT)</small></div>
                    </div>
                  ))}
                </div>
                {cart.length > 0 && <button onClick={() => { setIsCheckoutOpen(true); setCheckoutStep(1); }} style={{ width: "100%", padding: "12px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>THANH TOÁN 🧧</button>}
              </div>

              <div className="glass" style={{ padding: "15px", flex: 1, display: "flex", flexDirection: "column", maxHeight: "calc(60vh - 80px)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <h3 style={{ margin: 0, fontSize: "14px" }}>📋 NHẬT KÝ</h3>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button onClick={exportToCSV} style={{ fontSize: "9px", padding: "4px 6px", background: "#10b981", color: "#fff", border: "none", borderRadius: "4px" }}>EXCEL</button>
                    <button onClick={handleSendEmailReport} style={{ fontSize: "9px", padding: "4px 6px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px" }}>✉ CHỐT</button>
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {Object.keys(groupedHistory).map((dateStr) => {
                    const group = groupedHistory[dateStr]; const isEx = expandedDates[dateStr] ?? true;
                    return (
                      <div key={dateStr} style={{ marginBottom: "8px", backgroundColor: "#fff7ed", borderRadius: "6px", overflow: "hidden", border: "1px solid #fed7aa" }}>
                        <div onClick={() => setExpandedDates({...expandedDates, [dateStr]: !isEx})} style={{ backgroundColor: "#ffedd5", padding: "8px 10px", fontSize: "11px", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "space-between" }}><span>📅 {dateStr}</span><span>{isEx ? "▼" : "▶"}</span></div>
                        {isEx && <div style={{ padding: "0 10px" }}>{group.map((log: any) => (<div key={log.id} style={{ padding: "6px 0", borderBottom: "1px dashed #fed7aa", fontSize: "10px" }}><div style={{ display: "flex", justifyContent: "space-between" }}><span><b>[{log.type}]</b> {log.name} x{log.qty}</span>{log.type === "BÁN" && <span style={{color:"#b91c1c", fontWeight:"bold"}}>+{log.total?.toLocaleString()}</span>}</div><div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}><span>{log.customer}</span><span>{log.t}</span></div></div>))}</div>}
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

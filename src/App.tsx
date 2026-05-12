import React, { useEffect, useState } from "react";
// @ts-ignore
import { supabase } from "./supabaseClient";

export default function App() {
  const SYS_USER = "admin";
  const SYS_PASS = "haile88";

  // --- HỆ THỐNG BẢO MẬT ---
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("mart_logged_in") === "true");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  // --- STATES CỦA CỬA HÀNG ---
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Form nhập hàng có thêm Giá KM và Quà tặng
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newImportPrice, setNewImportPrice] = useState(""); 
  const [newPrice, setNewPrice] = useState(""); 
  const [newPromoPrice, setNewPromoPrice] = useState(""); 
  const [newGiftInfo, setNewGiftInfo] = useState(""); 
  const [newStock, setNewStock] = useState("");
  const [newExpiry, setNewExpiry] = useState(""); 

  // --- STATES GIỎ HÀNG & CRM ---
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
    const todaysLogs = history.filter(log => {
      const logDate = new Date(Math.floor(log.id)).toLocaleDateString('vi-VN');
      return logDate === todayStr;
    });
    
    if (todaysLogs.length === 0) return alert("Hôm nay chưa có giao dịch nào để chốt ca!");

    let todayRev = 0, todayProf = 0, soldCount = 0, importCount = 0;
    todaysLogs.forEach(log => {
      if (log.type === 'BÁN') { todayRev += log.total; todayProf += log.profit || 0; soldCount += log.qty; } 
      else if (log.type === 'NHẬP') { importCount += log.qty; }
    });

    const subject = encodeURIComponent(`Báo Cáo Chốt Ca - Ngày ${todayStr}`);
    const body = encodeURIComponent(
      `Xin chào Quản lý,\n\nĐây là báo cáo hoạt động kinh doanh ngày ${todayStr}:\n` +
      `--------------------------------------\n` +
      `- Số món đã bán: ${soldCount} món\n` +
      `- Số món nhập kho: ${importCount} món\n` +
      `- DOANH THU: ${todayRev.toLocaleString()} VNĐ\n` +
      `- LỢI NHUẬN: ${todayProf.toLocaleString()} VNĐ\n` +
      `--------------------------------------\n` +
      `Trân trọng,\nHệ thống Hải Lê Mart Pro.`
    );
    window.location.href = `mailto:lehonghaikt6@gmail.com?subject=${subject}&body=${body}`;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authUsername === SYS_USER && authPassword === SYS_PASS) {
      setIsLoggedIn(true); localStorage.setItem("mart_logged_in", "true");
    } else alert("Sai tài khoản hoặc mật khẩu!");
  };

  const handleLogout = () => {
    if (window.confirm("Khóa máy tính tiền?")) {
      setIsLoggedIn(false); localStorage.removeItem("mart_logged_in");
      setAuthUsername(""); setAuthPassword("");
    }
  };

  // Hàm tính giá trị thực tế (Lấy giá KM nếu có, không thì lấy Giá bán)
  const getActualPrice = (p: any) => {
    return (p.promo_price && p.promo_price > 0) ? p.promo_price : p.sale_price;
  };

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
          if (existingItem) {
            setCart(cart.map(item => item.product.id === p.id ? { ...item, qty: item.qty + 1, total: (item.qty + 1) * actualPrice, profit: (item.qty + 1) * (actualPrice - (p.import_price || 0)) } : item));
          } else {
            setCart([...cart, { product: p, qty: 1, total: actualPrice, profit: actualPrice - (p.import_price || 0) }]);
          }
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
      if (existingItem) {
        setCart(cart.map(item => item.product.id === p.id ? { ...item, qty: item.qty + addQty, total: (item.qty + addQty) * actualPrice, profit: item.profit + profitVal } : item));
      } else {
        setCart([...cart, { product: p, qty: addQty, total: addQty * actualPrice, profit: profitVal }]);
      }
    }
  };

  const removeFromCart = (productId: any) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const cartTotalAmount = cart.reduce((sum, item) => sum + item.total, 0);
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    setCustPhone(phone);
    if (customers[phone]) setCustName(customers[phone].name);
    else { setCustName(""); setUseWallet(false); }
  };

  const confirmCheckout = async () => {
    setLoading(true);
    let rev = revenue; let prof = profit; let logs: any[] = [];
    
    const currentWallet = customers[custPhone]?.wallet || 0;
    const discount = useWallet ? Math.min(currentWallet, cartTotalAmount) : 0;
    const finalAmount = Math.max(0, cartTotalAmount - discount);
    const earnedWallet = Math.floor(finalAmount * 0.02);

    const now = new Date();
    const dateStr = now.toLocaleDateString('vi-VN');
    const timeStr = now.toLocaleTimeString('vi-VN');

    for (const item of cart) {
      await supabase.from("products").update({ stock: item.product.stock - item.qty }).eq("id", item.product.id);
      rev += item.total; prof += item.profit;
      logs.push({ 
        id: Date.now() + Math.random(), type: "BÁN", 
        name: item.product.name, qty: item.qty, total: item.total, profit: item.profit, 
        customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ",
        date: dateStr, time: `${timeStr} ${dateStr}` 
      });
    }

    rev -= discount; prof -= discount;

    if (custPhone) {
      setCustomers((prev: any) => ({
        ...prev,
        [custPhone]: { name: custName, wallet: (prev[custPhone]?.wallet || 0) - discount + earnedWallet }
      }));
    }

    setRevenue(rev); setProfit(prof); setHistory(prev => [...logs, ...prev]);

    const orderId = "HD" + Date.now().toString().slice(-6); 
    setLastOrder({
      orderId: orderId, cart: [...cart], totalAmount: cartTotalAmount, discount: discount,
      finalAmount: finalAmount, earnedWallet: custPhone ? earnedWallet : 0,
      custName: custPhone ? custName : null, custPhone: custPhone ? custPhone : null, time: `${timeStr} ${dateStr}`
    });
    
    setCheckoutStep(3); fetchProducts(); setLoading(false);
  };

  const closeCheckout = () => {
    setCart([]); setIsCheckoutOpen(false); setCheckoutStep(1);
    setCustPhone(""); setCustName(""); setUseWallet(false); setLastOrder(null);
  };

  // KHI TÍT MÃ ĐỂ NHẬP KHO, LẤY CẢ GIÁ KM VÀ QUÀ TẶNG CŨ NẾU CÓ
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setNewCode(code);
    const p = products.find((x: any) => x.product_code === code);
    if (p) {
      setNewName(p.name); setNewImportPrice(p.import_price?.toString() || "");
      setNewPrice(p.sale_price.toString()); setNewPromoPrice(p.promo_price?.toString() || "");
      setNewGiftInfo(p.gift_info || ""); setNewExpiry(p.expiry_date || "");
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const existing = products.find(p => p.product_code === newCode);
    const addedStock = parseInt(newStock || "0");
    const inputImp = parseInt(newImportPrice);
    let finalImp = inputImp;
    if (existing && existing.stock > 0) {
        finalImp = Math.round((existing.stock * (existing.import_price || 0) + addedStock * inputImp) / (existing.stock + addedStock));
    }
    const data = { 
      name: newName, 
      import_price: finalImp, 
      sale_price: parseInt(newPrice), 
      promo_price: parseInt(newPromoPrice) || 0, // Lưu Giá KM
      gift_info: newGiftInfo || null,            // Lưu Quà tặng
      stock: existing ? existing.stock + addedStock : addedStock, 
      expiry_date: newExpiry || null 
    };
    
    if (existing) await supabase.from("products").update(data).eq("id", existing.id);
    else await supabase.from("products").insert([data]);
    
    if (addedStock > 0) {
      const now = new Date();
      setHistory(prev => [{ 
        id: Date.now(), type: "NHẬP", name: newName, qty: addedStock, total: 0, 
        date: now.toLocaleDateString('vi-VN'), time: `${now.toLocaleTimeString('vi-VN')} ${now.toLocaleDateString('vi-VN')}`
      }, ...prev]);
    }
    
    setNewCode(""); setNewName(""); setNewImportPrice(""); setNewPrice(""); 
    setNewPromoPrice(""); setNewGiftInfo(""); setNewStock(""); setNewExpiry("");
    fetchProducts(); setLoading(false);
  };

  const handleDelete = async (id: any, name: any) => {
    if (window.confirm(`Xóa ${name}?`)) { await supabase.from("products").delete().eq("id", id); fetchProducts(); }
  };

  const handleEdit = async (id: any, field: string, old: any, isText: boolean = false) => {
    const val = window.prompt(`Sửa ${field === 'promo_price' ? 'Giá KM (Nhập 0 để hủy KM)' : field === 'gift_info' ? 'Quà Tặng (Bỏ trống để hủy)' : field}:`, old || "");
    if (val !== null) { 
      const finalVal = isText ? val : (parseInt(val) || 0);
      await supabase.from("products").update({ [field]: finalVal }).eq("id", id); fetchProducts(); 
    }
  };

  const totalValue = products.reduce((sum, p) => sum + ((Number(p.import_price) || 0) * (Number(p.stock) || 0)), 0);

  // CSS GIAO DIỆN & IN ẤN
  const styles = `
    @keyframes float { 0% { transform: translate(0, 0); } 50% { transform: translate(30px, 50px); } 100% { transform: translate(0, 0); } }
    .bg-blob { position: fixed; width: 500px; height: 500px; border-radius: 50%; filter: blur(80px); z-index: -1; opacity: 0.4; animation: float 15s infinite ease-in-out; }
    .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 20px; }
    body { background-color: #0f172a; margin: 0; }
    .print-only { display: none; }
    
    @media print {
      body { background-color: white !important; margin: 0; padding: 0; }
      .no-print { display: none !important; }
      .print-only { 
        display: block !important; color: #000; 
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        width: 80mm; margin: 0 auto; padding: 5mm;
      }
      @page { margin: 0; }
    }
  `;

  if (!isLoggedIn) {
     return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", position: "relative", overflow: "hidden", fontFamily: "sans-serif" }}>
        <style>{styles}</style>
        <div className="bg-blob" style={{ background: "#3b82f6", top: "-10%", left: "-10%" }}></div>
        <div className="glass-card" style={{ padding: "40px", width: "100%", maxWidth: "400px", textAlign: "center" }}>
          <h1 style={{ color: "#1e293b", fontSize: "28px" }}>🏪 HẢI LÊ MART PRO</h1>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
            <input placeholder="Tài khoản" value={authUsername} onChange={e => setAuthUsername(e.target.value)} style={{ padding: "12px", borderRadius: "10px" }} />
            <input type="password" placeholder="Mật khẩu" value={authPassword} onChange={e => setAuthPassword(e.target.value)} style={{ padding: "12px", borderRadius: "10px" }} />
            <button type="submit" style={{ padding: "14px", backgroundColor: "#3b82f6", color: "#fff", borderRadius: "10px", fontWeight: "bold" }}>VÀO HỆ THỐNG</button>
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

  const toggleDateGroup = (dateStr: string) => {
    setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
  };

  return (
    <>
      <style>{styles + " button[title*='Sandbox'], .sp-preview-actions { display: none !important; } "}</style>
      
      {/* 🖨️ KHU VỰC IN HÓA ĐƠN CHUYÊN NGHIỆP */}
      {lastOrder && (
        <div className="print-only">
          <div style={{ textAlign: "center", marginBottom: "10px" }}>
            <h2 style={{ margin: "0 0 5px 0", fontSize: "22px", textTransform: "uppercase", fontWeight: "900" }}>HẢI LÊ MART PRO</h2>
            <div style={{ fontSize: "12px", lineHeight: "1.4" }}>
              Tòa Nhà ATS, 252 Hoàng Quốc Việt, HN<br/> Hotline: 0902613899
            </div>
          </div>
          <div style={{ borderTop: "1px dashed #000", margin: "10px 0" }}></div>
          <div style={{ fontSize: "12px", display: "flex", justifyContent: "space-between" }}>
            <div><b>Số HĐ:</b> {lastOrder.orderId}<br/><b>Ngày:</b> {lastOrder.time.split(' ')[1]}</div>
            <div style={{ textAlign: "right" }}><b>Thu ngân:</b> Admin<br/><b>Giờ:</b> {lastOrder.time.split(' ')[0]}</div>
          </div>
          <div style={{ borderTop: "1px dashed #000", margin: "10px 0" }}></div>

          <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #000" }}>
                <th style={{ textAlign: "left", paddingBottom: "5px", width: "50%" }}>SẢN PHẨM</th>
                <th style={{ textAlign: "center", paddingBottom: "5px", width: "15%" }}>SL</th>
                <th style={{ textAlign: "right", paddingBottom: "5px", width: "35%" }}>T.TIỀN</th>
              </tr>
            </thead>
            <tbody>
              {lastOrder.cart.map((item: any, idx: number) => {
                const isPromo = item.product.promo_price > 0;
                return (
                  <React.Fragment key={idx}>
                    <tr><td colSpan={3} style={{ paddingTop: "5px", fontWeight: "bold" }}>{item.product.name}</td></tr>
                    {/* NẾU CÓ QUÀ TẶNG, IN QUÀ TẶNG LÊN HÓA ĐƠN */}
                    {item.product.gift_info && <tr><td colSpan={3} style={{ fontSize: "10px", fontStyle: "italic", color: "#555" }}>+ 🎁 Tặng: {item.product.gift_info} (x{item.qty})</td></tr>}
                    <tr>
                      <td style={{ color: "#555" }}>
                        {isPromo ? <><del style={{fontSize:"10px", opacity:0.6}}>{item.product.sale_price.toLocaleString()}</del> {(item.product.promo_price).toLocaleString()}</> : item.product.sale_price.toLocaleString()}
                      </td>
                      <td style={{ textAlign: "center" }}>{item.qty}</td>
                      <td style={{ textAlign: "right" }}>{item.total.toLocaleString()}đ</td>
                    </tr>
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>

          <div style={{ borderTop: "1px solid #000", margin: "10px 0" }}></div>
          <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Tổng tiền hàng:</span><span>{lastOrder.totalAmount.toLocaleString()}đ</span></div>
            {lastOrder.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Chiết khấu (Ví):</span><span>-{lastOrder.discount.toLocaleString()}đ</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "900", borderTop: "1px dashed #000" }}>
              <span>THANH TOÁN:</span><span>{lastOrder.finalAmount.toLocaleString()}đ</span>
            </div>
          </div>
          {lastOrder.custName && (
            <div style={{ fontSize: "12px", borderTop: "1px dashed #000", marginTop: "10px", paddingTop: "5px" }}>
              <div><b>Khách hàng:</b> {lastOrder.custName}</div>
              <div>Điểm tích lũy thêm: <b>+{lastOrder.earnedWallet.toLocaleString()}đ</b></div>
            </div>
          )}
          <div style={{ borderTop: "1px dashed #000", margin: "10px 0" }}></div>
          <div style={{ textAlign: "center", fontSize: "12px" }}>
            <b>CẢM ƠN QUÝ KHÁCH!</b><br/>
            <div style={{ margin: "10px 0", fontSize: "20px", fontFamily: "monospace" }}>|||| || ||| | || ||</div>
            <div style={{ fontSize: "10px" }}>{lastOrder.orderId}</div>
          </div>
        </div>
      )}

      {/* KHU VỰC ỨNG DỤNG CHÍNH */}
      <div className="no-print" style={{ padding: "20px", position: "relative", minHeight: "100vh", fontFamily: "sans-serif", overflowX: "hidden" }}>
        <div className="bg-blob" style={{ background: "#1e40af", top: "10%", left: "5%" }}></div>
        <div className="bg-blob" style={{ background: "#065f46", bottom: "10%", right: "5%", animationDelay: "-7s" }}></div>

        {isCheckoutOpen && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
            {checkoutStep === 1 && (
              <div className="glass-card" style={{ padding: "30px", width: "400px" }}>
                <h3 style={{ color: "#1e3a8a", margin: "0 0 5px 0", textAlign: "center" }}>🎁 KHÁCH HÀNG</h3>
                <input type="text" placeholder="Nhập SĐT..." value={custPhone} onChange={handlePhoneChange} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "2px solid #3b82f6", marginTop: "15px", boxSizing: "border-box" }} />
                {custPhone && (
                  <div style={{ marginTop: "15px", padding: "15px", backgroundColor: "#f8fafc", borderRadius: "10px" }}>
                    {customers[custPhone] ? (
                      <>
                        <div style={{ color: "#16a34a", fontWeight: "bold" }}>⭐ {customers[custPhone].name}</div>
                        <div>Ví: <b>{customers[custPhone].wallet.toLocaleString()}đ</b></div>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", cursor: "pointer", color: "#ea580c", fontWeight: "bold" }}>
                          <input type="checkbox" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} /> Dùng ví giảm giá!
                        </label>
                      </>
                    ) : (
                      <input type="text" placeholder="Tên khách mới" value={custName} onChange={e => setCustName(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                    )}
                  </div>
                )}
                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                  <button onClick={() => setIsCheckoutOpen(false)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none" }}>Hủy</button>
                  <button onClick={handleNextToQR} style={{ flex: 2, padding: "12px", backgroundColor: "#3b82f6", color: "#fff", borderRadius: "10px", fontWeight: "bold", border: "none" }}>TIẾP TỤC 👉</button>
                </div>
              </div>
            )}
            {checkoutStep === 2 && (
              <div className="glass-card" style={{ padding: "30px", width: "400px", textAlign: "center" }}>
                <h3 style={{ color: "#1e3a8a", margin: "0 0 15px 0" }}>📱 QUÉT MÃ QR</h3>
                <div style={{ color: "#ef4444", fontSize: "32px", fontWeight: "900", marginBottom: "15px" }}>
                  {Math.max(0, cartTotalAmount - (useWallet ? customers[custPhone]?.wallet || 0 : 0)).toLocaleString()}đ
                </div>
                <img src={`https://img.vietqr.io/image/970422-0680124181004-compact2.png?amount=${Math.max(0, cartTotalAmount - (useWallet ? customers[custPhone]?.wallet || 0 : 0))}&addInfo=Thanh toan&accountName=LE%20HONG%20HAI`} style={{ width: "220px", display: "block", margin: "0 auto 20px auto" }} />
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => setCheckoutStep(1)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none" }}>Quay lại</button>
                  <button onClick={confirmCheckout} style={{ flex: 2, padding: "12px", backgroundColor: "#10b981", color: "#fff", borderRadius: "10px", fontWeight: "bold", border: "none" }}>✔️ ĐÃ NHẬN TIỀN</button>
                </div>
              </div>
            )}
            {checkoutStep === 3 && lastOrder && (
              <div className="glass-card" style={{ padding: "30px", width: "400px", textAlign: "center" }}>
                <div style={{ fontSize: "50px" }}>🎉</div>
                <h3 style={{ color: "#16a34a", margin: "10px 0" }}>Thành công!</h3>
                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                  <button onClick={() => window.print()} style={{ flex: 1, padding: "14px", backgroundColor: "#3b82f6", color: "#fff", borderRadius: "10px", fontWeight: "bold", border: "none" }}>🖨️ In Hóa Đơn</button>
                  <button onClick={closeCheckout} style={{ flex: 1, padding: "14px", backgroundColor: "#e2e8f0", borderRadius: "10px", fontWeight: "bold", border: "none" }}>Đóng</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* STATS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "15px", marginBottom: "20px" }}>
            {[ { label: "GIÁ TRỊ KHO", val: totalValue, c: "#8b5cf6" }, { label: "DOANH THU", val: revenue, c: "#3b82f6" }, { label: "LỢI NHUẬN", val: profit, c: "#10b981" } ].map((s, i) => (
              <div key={i} className="glass-card" style={{ padding: "20px", borderLeft: `8px solid ${s.c}` }}>
                <div style={{ color: "#64748b", fontSize: "12px", fontWeight: "bold" }}>{s.label}</div>
                <div style={{ fontSize: "22px", fontWeight: "bold" }}>{s.val.toLocaleString()}đ</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "20px" }}>
            {/* MAIN KHO */}
            <div className="glass-card" style={{ padding: "25px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                <h2 style={{ color: "#1e3a8a", margin: 0 }}>🏪 HẢI LÊ MART</h2>
                <button onClick={handleLogout} style={{ padding: "8px 15px", backgroundColor: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "8px", fontWeight: "bold" }}>Khóa 🔒</button>
              </div>

              <input placeholder="🔍 TÍT MÃ BÁN HÀNG..." value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} onKeyDown={handleBarcodeSubmit} style={{ width: "100%", padding: "15px", borderRadius: "12px", border: "2px solid #3b82f6", marginBottom: "15px", fontWeight: "bold", outline: "none", background: "#eff6ff" }} />

              {/* Ô NHẬP LIỆU CÓ KHUYẾN MÃI VÀ QUÀ TẶNG */}
              <div style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b", marginBottom: "5px" }}>📦 NHẬP KHO & CÀI ĐẶT KHUYẾN MÃI</div>
              <form onSubmit={handleAddProduct} style={{ display: "flex", gap: "8px", marginBottom: "20px", padding: "15px", background: "rgba(0,0,0,0.03)", borderRadius: "12px", flexWrap: "wrap" }}>
                <input placeholder="Mã hàng" value={newCode} onChange={handleCodeChange} style={{ flex: "1 1 100px", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                <input placeholder="Tên SP" value={newName} onChange={e => setNewName(e.target.value)} style={{ flex: "2 1 150px", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                <input type="number" placeholder="G.Nhập" value={newImportPrice} onChange={e => setNewImportPrice(e.target.value)} style={{ flex: "1 1 80px", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                <input type="number" placeholder="G.Bán" value={newPrice} onChange={e => setNewPrice(e.target.value)} style={{ flex: "1 1 80px", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                
                <input type="number" placeholder="Giá KM (Bỏ trống nếu ko KM)" value={newPromoPrice} onChange={e => setNewPromoPrice(e.target.value)} style={{ flex: "1 1 120px", padding: "8px", borderRadius: "6px", border: "1px solid #f59e0b", background: "#fffbeb" }} title="Giá Khuyến Mãi" />
                <input type="text" placeholder="Quà tặng kèm (VD: Tặng 1 cốc)" value={newGiftInfo} onChange={e => setNewGiftInfo(e.target.value)} style={{ flex: "1.5 1 150px", padding: "8px", borderRadius: "6px", border: "1px solid #10b981", background: "#f0fdf4" }} title="Quà Tặng" />
                
                <input type="number" placeholder="SL" value={newStock} onChange={e => setNewStock(e.target.value)} style={{ flex: "0.5 1 60px", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                <button type="submit" disabled={loading} style={{ padding: "8px 15px", backgroundColor: "#1e3a8a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold" }}>LƯU</button>
              </form>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b", fontSize: "11px" }}>
                    <th style={{ textAlign: "left", padding: "10px" }}>SẢN PHẨM</th>
                    <th style={{ textAlign: "center" }}>TỒN</th>
                    <th style={{ textAlign: "center" }}>GIÁ BÁN & KHUYẾN MÃI</th>
                    <th style={{ textAlign: "right" }}>QUẢN LÝ</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const isPromo = p.promo_price > 0;
                    return (
                      <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px" }}>
                          <b style={{fontSize: "14px"}}>{p.name}</b><br/>
                          <small style={{color: "#94a3b8"}}>{p.product_code}</small>
                          {p.gift_info && <div style={{ fontSize: "11px", color: "#10b981", fontWeight: "bold", marginTop: "3px", cursor: "pointer" }} onClick={()=>handleEdit(p.id, 'gift_info', p.gift_info, true)}>🎁 Tặng: {p.gift_info}</div>}
                          {!p.gift_info && <div style={{ fontSize: "10px", color: "#cbd5e1", cursor: "pointer" }} onClick={()=>handleEdit(p.id, 'gift_info', '', true)}>+ Thêm quà tặng</div>}
                        </td>
                        <td style={{ textAlign: "center", fontSize: "14px" }}><b>{p.stock}</b></td>
                        <td style={{ textAlign: "center" }}>
                          <div style={{ color: isPromo ? "#94a3b8" : "#059669", textDecoration: isPromo ? "line-through" : "none", fontWeight: isPromo ? "normal" : "bold", fontSize: isPromo ? "12px" : "14px", cursor: "pointer" }} onClick={()=>handleEdit(p.id, 'sale_price', p.sale_price)}>
                            {p.sale_price.toLocaleString()}đ
                          </div>
                          {isPromo && (
                            <div style={{ color: "#ef4444", fontWeight: "900", fontSize: "15px", cursor: "pointer" }} onClick={()=>handleEdit(p.id, 'promo_price', p.promo_price)}>
                              🔥 {p.promo_price.toLocaleString()}đ
                            </div>
                          )}
                          {!isPromo && <div style={{ fontSize: "10px", color: "#cbd5e1", cursor: "pointer" }} onClick={()=>handleEdit(p.id, 'promo_price', 0)}>+ Setup Giá KM</div>}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button onClick={() => addToCart(p)} style={{ padding: "8px 12px", backgroundColor: "#f59e0b", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>+ GIỎ HÀNG</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* SIDEBAR BÊN PHẢI */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="glass-card" style={{ padding: "20px" }}>
                <h3 style={{ margin: "0 0 15px 0", color: "#d97706" }}>🛒 GIỎ HÀNG</h3>
                <div style={{ maxHeight: "300px", overflowY: "auto", marginBottom: "15px" }}>
                  {cart.map((item, idx) => (
                    <div key={idx} style={{ padding: "8px 0", borderBottom: "1px dashed #e2e8f0", fontSize: "13px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: "bold" }}>{item.product.name} x{item.qty}</span>
                        <button onClick={()=>removeFromCart(item.product.id)} style={{border:"none",background:"none",color:"#ef4444", cursor: "pointer"}}>x</button>
                      </div>
                      {item.product.gift_info && <div style={{ color: "#10b981", fontSize: "11px", fontStyle: "italic" }}>+ 🎁 Tặng {item.qty} {item.product.gift_info.replace('Tặng ', '')}</div>}
                      <div style={{ color: "#ef4444", fontWeight: "bold", textAlign: "right" }}>{item.total.toLocaleString()}đ</div>
                    </div>
                  ))}
                </div>
                {cart.length > 0 && (
                  <button onClick={() => { setIsCheckoutOpen(true); setCheckoutStep(1); }} style={{ width: "100%", padding: "15px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
                    {cart.reduce((s,i)=>s+i.total,0).toLocaleString()}đ - THANH TOÁN
                  </button>
                )}
              </div>

              <div className="glass-card" style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "14px" }}>📋 NHẬT KÝ</h3>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button onClick={exportToCSV} style={{ fontSize: "10px", padding: "5px", background: "#10b981", color: "#fff", border: "none", borderRadius: "4px" }}>EXCEL</button>
                    <button onClick={handleSendEmailReport} style={{ fontSize: "10px", padding: "5px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px" }}>✉️ CHỐT CA</button>
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {Object.keys(history.reduce((g:any, l:any)=>{const d=new Date(Math.floor(l.id)).toLocaleDateString('vi-VN');if(!g[d])g[d]=[];g[d].push({...l,t:new Date(Math.floor(l.id)).toLocaleTimeString('vi-VN')});return g;},{})).map((dateStr) => {
                    const group = history.reduce((g:any, l:any)=>{const d=new Date(Math.floor(l.id)).toLocaleDateString('vi-VN');if(!g[d])g[d]=[];g[d].push({...l,t:new Date(Math.floor(l.id)).toLocaleTimeString('vi-VN')});return g;},{})[dateStr];
                    const isExpanded = expandedDates[dateStr] ?? true; 
                    return (
                      <div key={dateStr} style={{ marginBottom: "10px", backgroundColor: "#f8fafc", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                        <div 
                          onClick={() => toggleDateGroup(dateStr)}
                          style={{ backgroundColor: "#f1f5f9", padding: "10px 15px", fontSize: "12px", fontWeight: "bold", color: "#334155", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                        >
                          <span>📅 Ngày {dateStr}</span>
                          <span style={{ fontSize: "10px", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▶</span>
                        </div>
                        {isExpanded && (
                          <div style={{ padding: "0 15px" }}>
                            {group.map((log: any) => (
                              <div key={log.id} style={{ padding: "10px 0", borderBottom: "1px dashed #e2e8f0", fontSize: "11px", display: "flex", flexDirection: "column", gap: "3px" }}>
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
    </>
  );
}

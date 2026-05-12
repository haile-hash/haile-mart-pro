import React, { useEffect, useState } from "react";
// @ts-ignore
import { supabase } from "./supabaseClient";

export default function App() {
  // --- HỆ THỐNG BẢO MẬT ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [savedUser, setSavedUser] = useState(() => localStorage.getItem("mart_admin_user"));
  const [savedPass, setSavedPass] = useState(() => localStorage.getItem("mart_admin_pass"));
  
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  // --- STATES CỦA CỬA HÀNG ---
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newImportPrice, setNewImportPrice] = useState(""); 
  const [newPrice, setNewPrice] = useState(""); 
  const [newStock, setNewStock] = useState("");
  const [newExpiry, setNewExpiry] = useState(""); 

  // --- STATES GIỎ HÀNG & CRM KHÁCH QUEN ---
  const [cart, setCart] = useState<any[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");

  const [customers, setCustomers] = useState<any>(() => {
    const saved = localStorage.getItem("mart_customers");
    return saved ? JSON.parse(saved) : {}; 
  });

  // STATES CHO POPUP THANH TOÁN & IN BILL
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); 
  const [custPhone, setCustPhone] = useState("");
  const [custName, setCustName] = useState("");
  const [useWallet, setUseWallet] = useState(false);
  
  // STATE LƯU THÔNG TIN HÓA ĐƠN ĐỂ IN
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
      csvContent += `${log.time},${log.type},${log.customer || "Khách lẻ"},${log.name},${log.qty},${log.total},${log.profit || 0}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_Cao_Hai_Le_Mart.csv`);
    link.click();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUsername || !authPassword) return alert("Vui lòng nhập đủ!");
    localStorage.setItem("mart_admin_user", authUsername);
    localStorage.setItem("mart_admin_pass", authPassword);
    setSavedUser(authUsername);
    setSavedPass(authPassword);
    setIsLoggedIn(true);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authUsername === savedUser && authPassword === savedPass) setIsLoggedIn(true);
    else alert("Sai mật khẩu!");
  };

  const handleLogout = () => {
    if (window.confirm("Khóa máy tính tiền?")) setIsLoggedIn(false);
  };

  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!barcodeInput.trim()) return;
      const foundProduct = products.find(p => p.product_code === barcodeInput.trim());
      if (foundProduct) {
        if (foundProduct.stock <= 0) alert("Hết hàng!");
        else {
          const existingItem = cart.find(item => item.product.id === foundProduct.id);
          if (existingItem) {
            setCart(cart.map(item => item.product.id === foundProduct.id ? { ...item, qty: item.qty + 1, total: (item.qty + 1) * foundProduct.sale_price, profit: (item.qty + 1) * (foundProduct.sale_price - foundProduct.import_price) } : item));
          } else {
            setCart([...cart, { product: foundProduct, qty: 1, total: foundProduct.sale_price, profit: foundProduct.sale_price - foundProduct.import_price }]);
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
      const profitVal = (p.sale_price - (p.import_price || 0)) * addQty;
      const existingItem = cart.find(item => item.product.id === p.id);
      if (existingItem) {
        setCart(cart.map(item => item.product.id === p.id ? { ...item, qty: item.qty + addQty, total: (item.qty + addQty) * p.sale_price, profit: item.profit + profitVal } : item));
      } else {
        setCart([...cart, { product: p, qty: addQty, total: addQty * p.sale_price, profit: profitVal }]);
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
    if (customers[phone]) {
      setCustName(customers[phone].name);
    } else {
      setCustName("");
      setUseWallet(false);
    }
  };

  const handleNextToQR = () => {
    if (custPhone && !customers[custPhone] && !custName) {
      alert("Khách hàng mới! Vui lòng nhập Tên khách hàng.");
      return;
    }
    setCheckoutStep(2);
  };

  const confirmCheckout = async () => {
    setLoading(true);
    let rev = revenue;
    let prof = profit;
    let logs: any[] = [];
    
    const currentWallet = customers[custPhone]?.wallet || 0;
    const discount = useWallet ? Math.min(currentWallet, cartTotalAmount) : 0;
    const finalAmount = Math.max(0, cartTotalAmount - discount);
    const earnedWallet = Math.floor(finalAmount * 0.02);

    for (const item of cart) {
      await supabase.from("products").update({ stock: item.product.stock - item.qty }).eq("id", item.product.id);
      rev += item.total; 
      prof += item.profit;
      logs.push({ 
        id: Date.now() + Math.random(), 
        type: "BÁN", 
        name: item.product.name, 
        qty: item.qty, 
        total: item.total, 
        profit: item.profit, 
        customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ",
        time: new Date().toLocaleString('vi-VN') 
      });
    }

    rev -= discount;
    prof -= discount;

    if (custPhone) {
      setCustomers((prev: any) => ({
        ...prev,
        [custPhone]: {
          name: custName,
          wallet: (prev[custPhone]?.wallet || 0) - discount + earnedWallet
        }
      }));
    }

    setRevenue(rev); 
    setProfit(prof); 
    setHistory(prev => [...logs, ...prev]);

    // LƯU LẠI DỮ LIỆU ĐỂ IN BILL CHUYÊN NGHIỆP
    const orderId = "HD" + Date.now().toString().slice(-6); 
    setLastOrder({
      orderId: orderId,
      cart: [...cart],
      totalAmount: cartTotalAmount,
      discount: discount,
      finalAmount: finalAmount,
      earnedWallet: custPhone ? earnedWallet : 0,
      custName: custPhone ? custName : null,
      custPhone: custPhone ? custPhone : null,
      time: new Date().toLocaleString('vi-VN')
    });
    
    setCheckoutStep(3);
    fetchProducts(); 
    setLoading(false);
  };

  const closeCheckout = () => {
    setCart([]); 
    setIsCheckoutOpen(false); 
    setCheckoutStep(1);
    setCustPhone("");
    setCustName("");
    setUseWallet(false);
    setLastOrder(null);
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
    const data = { name: newName, import_price: finalImp, sale_price: parseInt(newPrice), stock: existing ? existing.stock + addedStock : addedStock, expiry_date: newExpiry || null };
    if (existing) await supabase.from("products").update(data).eq("id", existing.id);
    else await supabase.from("products").insert([data]);
    if (addedStock > 0) setHistory(prev => [{ id: Date.now(), type: "NHẬP", name: newName, qty: addedStock, total: 0, time: new Date().toLocaleString('vi-VN') }, ...prev]);
    setNewCode(""); setNewName(""); setNewImportPrice(""); setNewPrice(""); setNewStock(""); setNewExpiry("");
    fetchProducts(); setLoading(false);
  };

  const handleDelete = async (id: any, name: any) => {
    if (window.confirm(`Xóa ${name}?`)) { await supabase.from("products").delete().eq("id", id); fetchProducts(); }
  };

  const handleEdit = async (id: any, field: string, old: any, isD: boolean = false) => {
    const val = window.prompt(`Sửa ${field}:`, old || "");
    if (val) { await supabase.from("products").update({ [field]: isD ? val : parseInt(val) }).eq("id", id); fetchProducts(); }
  };

  const totalValue = products.reduce((sum, p) => sum + ((Number(p.import_price) || 0) * (Number(p.stock) || 0)), 0);

  // CSS GIAO DIỆN & IN ẤN (PRINT)
  const styles = `
    @keyframes float { 0% { transform: translate(0, 0); } 50% { transform: translate(30px, 50px); } 100% { transform: translate(0, 0); } }
    .bg-blob { position: fixed; width: 500px; height: 500px; border-radius: 50%; filter: blur(80px); z-index: -1; opacity: 0.4; animation: float 15s infinite ease-in-out; }
    .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 20px; }
    body { background-color: #0f172a; margin: 0; }
    .print-only { display: none; }
    
    /* CẤU HÌNH IN HÓA ĐƠN CHUYÊN NGHIỆP */
    @media print {
      body { background-color: white !important; margin: 0; padding: 0; }
      .no-print { display: none !important; }
      .print-only { 
        display: block !important; 
        color: #000; 
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        width: 80mm; 
        margin: 0 auto;
        padding: 5mm;
      }
      @page { margin: 0; }
    }
  `;

  if (!isLoggedIn) {
     return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", position: "relative", overflow: "hidden", fontFamily: "sans-serif" }}>
        <style>{styles}</style>
        <div className="bg-blob" style={{ background: "#3b82f6", top: "-10%", left: "-10%" }}></div>
        <div className="bg-blob" style={{ background: "#10b981", bottom: "-10%", right: "-10%", animationDelay: "-5s" }}></div>
        <div className="glass-card" style={{ padding: "40px", width: "100%", maxWidth: "400px", textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
          <h1 style={{ color: "#1e293b", fontSize: "28px", marginBottom: "10px" }}>🏪 HẢI LÊ MART PRO</h1>
          <p style={{ color: "#64748b", marginBottom: "30px" }}>Quản lý cửa hàng thông minh</p>
          <form onSubmit={!savedUser ? handleRegister : handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <input placeholder="Tài khoản" value={authUsername} onChange={e => setAuthUsername(e.target.value)} style={{ padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none" }} />
            <input type="password" placeholder="Mật khẩu" value={authPassword} onChange={e => setAuthPassword(e.target.value)} style={{ padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none" }} />
            <button type="submit" style={{ padding: "14px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>{!savedUser ? "BẮT ĐẦU NGAY" : "VÀO HỆ THỐNG"}</button>
          </form>
        </div>
      </div>
    );
  }

  const activeWallet = customers[custPhone]?.wallet || 0;
  const activeDiscount = useWallet ? Math.min(activeWallet, cartTotalAmount) : 0;
  const activeFinalAmount = Math.max(0, cartTotalAmount - activeDiscount);
  const activeEarned = Math.floor(activeFinalAmount * 0.02);

  return (
    <>
      <style>{styles + " button[title*='Sandbox'], .sp-preview-actions { display: none !important; } "}</style>
      
      {/* 🖨️ KHU VỰC IN HÓA ĐƠN CHUYÊN NGHIỆP (CHỈ HIỆN KHI BẤM CTRL+P HOẶC IN BILL) */}
      {lastOrder && (
        <div className="print-only">
          <div style={{ textAlign: "center", marginBottom: "10px" }}>
            <h2 style={{ margin: "0 0 5px 0", fontSize: "22px", textTransform: "uppercase", fontWeight: "900", letterSpacing: "1px" }}>HẢI LÊ MART PRO</h2>
            <div style={{ fontSize: "12px", lineHeight: "1.4" }}>
              Đ/c: Tòa Nhà ATS, 252 Hoàng Quốc Việt,<br/>
              P. Nghĩa Đô. Tp. Hà Nội<br/>
              Hotline: 098x.xxx.xxx<br/>
              Wifi: HaiLeMart - Pass: 88888888
            </div>
          </div>
          
          <div style={{ borderTop: "1px dashed #000", margin: "10px 0" }}></div>
          
          <div style={{ fontSize: "12px", lineHeight: "1.5", display: "flex", justifyContent: "space-between" }}>
            <div>
              <div><b>Số HĐ:</b> {lastOrder.orderId}</div>
              <div><b>Ngày:</b> {lastOrder.time.split(' ')[1]}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div><b>Thu ngân:</b> Admin</div>
              <div><b>Giờ:</b> {lastOrder.time.split(' ')[0]}</div>
            </div>
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
              {lastOrder.cart.map((item: any, idx: number) => (
                <React.Fragment key={idx}>
                  <tr>
                    <td colSpan={3} style={{ paddingTop: "5px", fontWeight: "bold" }}>{item.product.name}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#555" }}>{item.product.sale_price.toLocaleString()}</td>
                    <td style={{ textAlign: "center" }}>{item.qty}</td>
                    <td style={{ textAlign: "right" }}>{item.total.toLocaleString()}đ</td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: "1px solid #000", margin: "10px 0" }}></div>

          <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Tổng tiền hàng:</span>
              <span>{lastOrder.totalAmount.toLocaleString()}đ</span>
            </div>
            {lastOrder.discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Chiết khấu (Ví điểm):</span>
                <span>-{lastOrder.discount.toLocaleString()}đ</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "900", marginTop: "5px", paddingTop: "5px", borderTop: "1px dashed #000" }}>
              <span>THANH TOÁN:</span>
              <span>{lastOrder.finalAmount.toLocaleString()}đ</span>
            </div>
          </div>

          {lastOrder.custName && (
            <>
              <div style={{ borderTop: "1px dashed #000", margin: "10px 0" }}></div>
              <div style={{ fontSize: "12px", lineHeight: "1.5" }}>
                <div><b>Khách hàng:</b> {lastOrder.custName} ({lastOrder.custPhone?.slice(0, -3) + "***"})</div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Điểm tích lũy đơn này:</span>
                  <b>+{lastOrder.earnedWallet.toLocaleString()}đ</b>
                </div>
              </div>
            </>
          )}

          <div style={{ borderTop: "1px dashed #000", margin: "10px 0" }}></div>

          <div style={{ textAlign: "center", fontSize: "12px", marginTop: "15px" }}>
            <div style={{ fontWeight: "bold" }}>CẢM ƠN QUÝ KHÁCH & HẸN GẶP LẠI!</div>
            <div style={{ fontSize: "10px", marginTop: "5px" }}>(Vui lòng kiểm tra lại tiền và hàng hóa)</div>
            
            <div style={{ margin: "15px 0 5px 0", fontSize: "20px", letterSpacing: "2px", fontWeight: "bold", fontFamily: "monospace" }}>
              |||| || ||| | || |||| | |
            </div>
            <div style={{ fontSize: "10px" }}>{lastOrder.orderId}</div>
          </div>
        </div>
      )}

      {/* KHU VỰC ỨNG DỤNG CHÍNH (SẼ ẨN ĐI KHI BẤM IN) */}
      <div className="no-print" style={{ padding: "30px", position: "relative", minHeight: "100vh", fontFamily: "sans-serif", overflowX: "hidden" }}>
        
        {/* CÁC KHỐI MÀU NỀN */}
        <div className="bg-blob" style={{ background: "#1e40af", top: "10%", left: "5%" }}></div>
        <div className="bg-blob" style={{ background: "#065f46", bottom: "10%", right: "5%", animationDelay: "-7s" }}></div>
        <div className="bg-blob" style={{ background: "#581c87", top: "50%", left: "40%", width: "300px", height: "300px", animationDelay: "-3s" }}></div>

        {/* POPUP THANH TOÁN */}
        {isCheckoutOpen && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
            
            {checkoutStep === 1 && (
              <div className="glass-card" style={{ padding: "30px", width: "400px", boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}>
                <h3 style={{ color: "#1e3a8a", margin: "0 0 5px 0", fontSize: "22px", textAlign: "center" }}>🎁 CHĂM SÓC KHÁCH HÀNG</h3>
                <p style={{ color: "#64748b", textAlign: "center", marginBottom: "25px", fontSize: "14px" }}>Tích lũy 2% cho mọi đơn hàng</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "bold", color: "#475569" }}>Số điện thoại khách (Bỏ trống nếu khách lẻ):</label>
                    <input type="text" placeholder="098..." value={custPhone} onChange={handlePhoneChange} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "2px solid #3b82f6", marginTop: "5px", outline: "none", boxSizing: "border-box", fontSize: "16px" }} />
                  </div>
                  {custPhone && (
                    <div style={{ padding: "15px", backgroundColor: customers[custPhone] ? "#f0fdf4" : "#f8fafc", borderRadius: "10px", border: customers[custPhone] ? "1px solid #10b981" : "1px dashed #cbd5e1" }}>
                      {customers[custPhone] ? (
                        <>
                          <div style={{ color: "#16a34a", fontWeight: "bold", marginBottom: "10px" }}>⭐ Khách quen: {customers[custPhone].name}</div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <span style={{ fontSize: "13px", color: "#64748b" }}>Ví hoàn tiền:</span>
                            <span style={{ fontWeight: "bold", color: "#ea580c", fontSize: "16px" }}>{customers[custPhone].wallet.toLocaleString()}đ</span>
                          </div>
                          {customers[custPhone].wallet > 0 && (
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "15px", cursor: "pointer" }}>
                              <input type="checkbox" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} style={{ width: "18px", height: "18px", accentColor: "#f59e0b" }} />
                              <span style={{ fontWeight: "bold", color: "#d97706", fontSize: "14px" }}>Dùng ví giảm ngay giá đơn này!</span>
                            </label>
                          )}
                        </>
                      ) : (
                        <>
                          <div style={{ color: "#3b82f6", fontWeight: "bold", marginBottom: "5px" }}>✨ Đăng ký Khách Hàng Mới</div>
                          <input type="text" placeholder="Nhập tên khách hàng" value={custName} onChange={e => setCustName(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", boxSizing: "border-box" }} />
                        </>
                      )}
                    </div>
                  )}
                  <div style={{ backgroundColor: "#1e293b", color: "#fff", padding: "15px", borderRadius: "10px", marginTop: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                      <span>Tổng hóa đơn:</span>
                      <span style={{ fontWeight: "bold" }}>{cartTotalAmount.toLocaleString()}đ</span>
                    </div>
                    {useWallet && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#fca5a5", marginBottom: "5px" }}>
                        <span>Trừ ví:</span>
                        <span style={{ fontWeight: "bold" }}>-{activeDiscount.toLocaleString()}đ</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", borderTop: "1px solid #334155", paddingTop: "10px", marginTop: "5px" }}>
                      <span>Khách cần trả:</span>
                      <span style={{ fontWeight: "bold", color: "#34d399" }}>{activeFinalAmount.toLocaleString()}đ</span>
                    </div>
                    {custPhone && (
                       <div style={{ textAlign: "right", color: "#fcd34d", fontSize: "12px", marginTop: "5px" }}>
                         + Sẽ được hoàn {activeEarned.toLocaleString()}đ vào ví
                       </div>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                  <button onClick={() => setIsCheckoutOpen(false)} style={{ flex: 1, padding: "12px", border: "none", borderRadius: "10px", cursor: "pointer", background: "#e2e8f0", fontWeight: "bold" }}>Hủy</button>
                  <button onClick={handleNextToQR} style={{ flex: 2, padding: "12px", backgroundColor: "#3b82f6", color: "#fff", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>TIẾP TỤC QUÉT MÃ 👉</button>
                </div>
              </div>
            )}

            {checkoutStep === 2 && (
              <div className="glass-card" style={{ padding: "30px", width: "400px", textAlign: "center" }}>
                <h3 style={{ color: "#1e3a8a", margin: "0 0 5px 0" }}>📱 Mã Thanh Toán Tự Động</h3>
                <p style={{ margin: "0 0 15px 0", color: "#64748b", fontSize: "14px" }}>LE HONG HAI - MB BANK</p>
                <div style={{ backgroundColor: "#f8fafc", padding: "15px", borderRadius: "15px", marginBottom: "20px", border: "2px solid #10b981" }}>
                  {custName && <div style={{ fontSize: "12px", fontWeight: "bold", color: "#10b981", marginBottom: "5px" }}>Khách hàng: {custName}</div>}
                  <div style={{ color: "#ef4444", fontSize: "32px", fontWeight: "900" }}>{activeFinalAmount.toLocaleString()}đ</div>
                </div>
                <div style={{ background: "#fff", padding: "10px", borderRadius: "16px", border: "2px dashed #cbd5e1", display: "inline-block", marginBottom: "20px" }}>
                  <img src={`https://img.vietqr.io/image/970422-0680124181004-compact2.png?amount=${activeFinalAmount}&addInfo=Thanh toan&accountName=LE%20HONG%20HAI`} style={{ width: "220px", height: "220px", display: "block" }} />
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => setCheckoutStep(1)} disabled={loading} style={{ flex: 1, padding: "12px", border: "none", borderRadius: "10px", cursor: "pointer", background: "#e2e8f0", fontWeight: "bold" }}>👈 Quay lại</button>
                  <button onClick={confirmCheckout} disabled={loading} style={{ flex: 2, padding: "12px", backgroundColor: "#10b981", color: "#fff", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>{loading ? "Đang xử lý..." : "✔️ ĐÃ NHẬN TIỀN"}</button>
                </div>
              </div>
            )}

            {/* BƯỚC 3: IN HÓA ĐƠN THÀNH CÔNG */}
            {checkoutStep === 3 && lastOrder && (
              <div className="glass-card" style={{ padding: "30px", width: "400px", textAlign: "center" }}>
                <div style={{ fontSize: "50px", marginBottom: "10px" }}>🎉</div>
                <h3 style={{ color: "#16a34a", margin: "0 0 10px 0", fontSize: "24px" }}>Thanh toán thành công!</h3>
                <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "14px" }}>Đơn hàng đã được lưu vào hệ thống.</p>
                <div style={{ backgroundColor: "#f8fafc", padding: "15px", borderRadius: "10px", marginBottom: "20px" }}>
                  <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b" }}>Tổng thu: <span style={{ color: "#ef4444" }}>{lastOrder.finalAmount.toLocaleString()}đ</span></div>
                  {lastOrder.custName && <div style={{ fontSize: "13px", color: "#10b981", marginTop: "5px" }}>+ Đã hoàn {lastOrder.earnedWallet.toLocaleString()}đ vào ví khách</div>}
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => window.print()} style={{ flex: 1, padding: "14px", backgroundColor: "#3b82f6", color: "#fff", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", fontSize: "16px" }}>🖨️ In Hóa Đơn</button>
                  <button onClick={closeCheckout} style={{ flex: 1, padding: "14px", backgroundColor: "#e2e8f0", color: "#475569", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", fontSize: "16px" }}>Đóng</button>
                </div>
              </div>
            )}

          </div>
        )}

        <div style={{ maxWidth: "1350px", margin: "0 auto" }}>
          {/* STATS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "30px" }}>
            {[
              { label: "GIÁ TRỊ KHO (VỐN)", val: totalValue, color: "#8b5cf6" },
              { label: "DOANH THU HÔM NAY", val: revenue, color: "#3b82f6" },
              { label: "LỢI NHUẬN ƯỚC TÍNH", val: profit, color: "#10b981" }
            ].map((s, i) => (
              <div key={i} className="glass-card" style={{ padding: "20px", borderLeft: `8px solid ${s.color}`, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}>
                <div style={{ color: "#64748b", fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>{s.label}</div>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1e293b" }}>{s.val.toLocaleString()}đ</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2.8fr 1fr", gap: "25px" }}>
            {/* MAIN */}
            <div className="glass-card" style={{ padding: "25px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                <h2 style={{ color: "#1e3a8a", margin: 0 }}>🏪 HẢI LÊ MART PRO</h2>
                <button onClick={handleLogout} style={{ padding: "8px 15px", backgroundColor: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Đăng xuất 🔒</button>
              </div>

              <input placeholder="🔍 BẮN MÃ VẠCH ĐỂ BÁN HÀNG NHANH..." value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} onKeyDown={handleBarcodeSubmit} style={{ width: "100%", padding: "15px", borderRadius: "15px", border: "2px solid #3b82f6", marginBottom: "20px", fontSize: "18px", fontWeight: "bold", background: "#eff6ff", outline: "none" }} />

              <form onSubmit={handleAddProduct} style={{ display: "flex", gap: "10px", marginBottom: "25px", padding: "15px", background: "rgba(0,0,0,0.03)", borderRadius: "15px", flexWrap: "wrap" }}>
                <input placeholder="Mã" value={newCode} onChange={e => {setNewCode(e.target.value); const p=products.find(x=>x.product_code===e.target.value); if(p){setNewName(p.name); setNewPrice(p.sale_price.toString()); setNewImportPrice(p.import_price?.toString()||""); setNewExpiry(p.expiry_date||"");}}} style={{ flex: "1", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                <input placeholder="Tên hàng" value={newName} onChange={e => setNewName(e.target.value)} style={{ flex: "2", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                <input placeholder="G.Nhập" type="number" value={newImportPrice} onChange={e => setNewImportPrice(e.target.value)} style={{ flex: "1", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                <input placeholder="G.Bán" type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} style={{ flex: "1", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                <input type="date" title="Hạn sử dụng" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} style={{ flex: "1.5", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", color: "#475569" }} />
                <input placeholder="SL" type="number" value={newStock} onChange={e => setNewStock(e.target.value)} style={{ flex: "0.8", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                <button type="submit" disabled={loading} style={{ padding: "10px 20px", backgroundColor: "#1e3a8a", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>NHẬP KHO</button>
              </form>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b", fontSize: "12px" }}>
                    <th style={{ textAlign: "left", padding: "12px" }}>SẢN PHẨM</th>
                    <th style={{ textAlign: "center" }}>TỒN</th>
                    <th style={{ textAlign: "center" }}>GIÁ VỐN</th>
                    <th style={{ textAlign: "center" }}>GIÁ BÁN</th>
                    <th style={{ textAlign: "center" }}>HSD & LƯU KHO</th>
                    <th style={{ textAlign: "right" }}>QUẢN LÝ</th>
                  </tr>
                </thead>
                <tbody>
                  {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => {
                    const days = Math.floor(Math.abs(new Date().getTime() - new Date(p.created_at).getTime()) / 86400000);
                    return (
                      <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px" }}><b>{p.name}</b><br/><small style={{color: "#94a3b8"}}>{p.product_code}</small></td>
                        <td style={{ textAlign: "center" }}><b>{p.stock}</b></td>
                        <td style={{ textAlign: "center", color: "#64748b", cursor:"pointer" }} onClick={()=>handleEdit(p.id,'import_price',p.import_price)}>{p.import_price?.toLocaleString()}đ</td>
                        <td style={{ textAlign: "center", color: "#059669", fontWeight: "bold", cursor:"pointer" }} onClick={()=>handleEdit(p.id,'sale_price',p.sale_price)}>{p.sale_price.toLocaleString()}đ</td>
                        <td style={{ textAlign: "center", fontSize: "11px" }}>
                          <div style={{color: "#b91c1c", cursor:"pointer"}} onClick={()=>handleEdit(p.id,'expiry_date',p.expiry_date,true)}>{p.expiry_date || "Chưa có HSD"}</div>
                          <div style={{color: days > 30 ? "#ea580c" : "#16a34a"}}>{days} ngày trong kho</div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button onClick={() => addToCart(p)} style={{ padding: "6px 12px", backgroundColor: "#f59e0b", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", marginRight: "10px", cursor: "pointer" }}>+ GIỎ HÀNG</button>
                          <button onClick={() => handleDelete(p.id, p.name)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>🗑️</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* SIDEBAR */}
            <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
              <div className="glass-card" style={{ padding: "20px", boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}>
                <h3 style={{ margin: "0 0 15px 0", color: "#d97706" }}>🛒 GIỎ HÀNG ({cart.length})</h3>
                <div style={{ maxHeight: "250px", overflowY: "auto", marginBottom: "15px" }}>
                  {cart.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed #e2e8f0", fontSize: "13px" }}>
                      <span>{item.product.name} x{item.qty}</span>
                      <button onClick={()=>removeFromCart(item.product.id)} style={{border:"none",background:"none",color:"#ef4444", cursor: "pointer"}}>x</button>
                    </div>
                  ))}
                </div>
                {cart.length > 0 && (
                  <button onClick={() => { setIsCheckoutOpen(true); setCheckoutStep(1); }} style={{ width: "100%", padding: "15px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "12px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
                    {cart.reduce((s,i)=>s+i.total,0).toLocaleString()}đ - THANH TOÁN
                  </button>
                )}
              </div>

              <div className="glass-card" style={{ padding: "20px", flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                  <h3 style={{ margin: 0, fontSize: "16px" }}>📋 NHẬT KÝ</h3>
                  <button onClick={exportToCSV} style={{ fontSize: "10px", padding: "5px 10px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}>EXCEL</button>
                </div>
                <div style={{ maxHeight: "400px", overflowY: "auto", fontSize: "11px" }}>
                  {history.map(log => (
                    <div key={log.id} style={{ padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <b>[{log.type}]</b> {log.name} x{log.qty} 
                      {log.type === "BÁN" && <span style={{float:"right", color:"#059669", fontWeight: "bold"}}>+{log.total?.toLocaleString()}đ</span>}
                      <div style={{color:"#64748b", marginTop: "2px"}}>{log.customer && `👤 ${log.customer}`}</div>
                      <div style={{color:"#94a3b8", marginTop: "2px"}}>{log.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

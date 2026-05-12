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

  // --- STATES GIỎ HÀNG & MÃ VẠCH ---
  const [cart, setCart] = useState<any[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");

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
  }, [history, revenue, profit]);

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
    let csvContent = "\uFEFFThời gian,Loại,Sản phẩm,Số lượng,Thành tiền (VNĐ),Lợi nhuận (VNĐ)\n";
    history.forEach(log => {
      csvContent += `${log.time},${log.type},${log.name},${log.qty},${log.total},${log.profit || 0}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_Cao_Hai_Le_Mart.csv`);
    link.click();
  };

  // --- CÁC HÀM XỬ LÝ ---
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
      setCart([...cart, { product: p, qty: addQty, total: addQty * p.sale_price, profit: profitVal }]);
    }
  };

  const confirmCheckout = async () => {
    setLoading(true);
    let rev = revenue, prof = profit;
    let logs: any[] = [];
    for (const item of cart) {
      await supabase.from("products").update({ stock: item.product.stock - item.qty }).eq("id", item.product.id);
      rev += item.total; prof += item.profit;
      logs.push({ id: Date.now() + Math.random(), type: "BÁN", name: item.product.name, qty: item.qty, total: item.total, profit: item.profit, time: new Date().toLocaleString() });
    }
    setRevenue(rev); setProfit(prof); setHistory(prev => [...logs, ...prev]);
    setCart([]); setShowCheckout(false); fetchProducts(); setLoading(false);
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
    if (addedStock > 0) setHistory(prev => [{ id: Date.now(), type: "NHẬP", name: newName, qty: addedStock, total: 0, time: new Date().toLocaleString() }, ...prev]);
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

  // CSS INJECTION CHO PHÔNG NỀN ĐẸP
  const styles = `
    @keyframes float { 0% { transform: translate(0, 0); } 50% { transform: translate(30px, 50px); } 100% { transform: translate(0, 0); } }
    .bg-blob { position: fixed; width: 500px; height: 500px; border-radius: 50%; filter: blur(80px); z-index: -1; opacity: 0.4; animation: float 15s infinite ease-in-out; }
    .glass-card { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 20px; }
    body { background-color: #0f172a; margin: 0; }
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
            <input placeholder="Tài khoản" value={authUsername} onChange={e => setAuthUsername(e.target.value)} style={{ padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
            <input type="password" placeholder="Mật khẩu" value={authPassword} onChange={e => setAuthPassword(e.target.value)} style={{ padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
            <button type="submit" style={{ padding: "14px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>{!savedUser ? "BẮT ĐẦU NGAY" : "VÀO HỆ THỐNG"}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px", position: "relative", minHeight: "100vh", fontFamily: "sans-serif", overflowX: "hidden" }}>
      <style>{styles + " button[title*='Sandbox'], .sp-preview-actions { display: none !important; } "}</style>
      
      {/* CÁC KHỐI MÀU NỀN */}
      <div className="bg-blob" style={{ background: "#1e40af", top: "10%", left: "5%" }}></div>
      <div className="bg-blob" style={{ background: "#065f46", bottom: "10%", right: "5%", animationDelay: "-7s" }}></div>
      <div className="bg-blob" style={{ background: "#581c87", top: "50%", left: "40%", width: "300px", height: "300px", animationDelay: "-3s" }}></div>

      {showCheckout && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div className="glass-card" style={{ padding: "30px", width: "400px", textAlign: "center" }}>
            <h3 style={{ color: "#1e3a8a" }}>Thanh Toán VietQR</h3>
            <div style={{ backgroundColor: "#f8fafc", padding: "15px", borderRadius: "15px", marginBottom: "20px" }}>
              <div style={{ color: "#ef4444", fontSize: "32px", fontWeight: "900" }}>{cart.reduce((s,i)=>s+i.total,0).toLocaleString()}đ</div>
            </div>
            <img src={`https://img.vietqr.io/image/970422-0680124181004-compact2.png?amount=${cart.reduce((s,i)=>s+i.total,0)}&addInfo=Thanh toan&accountName=LE%20HONG%20HAI`} style={{ width: "250px", borderRadius: "10px", marginBottom: "20px" }} />
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowCheckout(false)} style={{ flex: 1, padding: "12px", border: "none", borderRadius: "10px" }}>Hủy</button>
              <button onClick={confirmCheckout} style={{ flex: 2, padding: "12px", backgroundColor: "#10b981", color: "#fff", borderRadius: "10px", fontWeight: "bold" }}>Xác nhận Ting Ting</button>
            </div>
          </div>
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

            <input placeholder="🔍 BẮN MÃ VẠCH ĐỂ BÁN HÀNG NHANH..." value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} onKeyDown={handleBarcodeSubmit} style={{ width: "100%", padding: "15px", borderRadius: "15px", border: "2px solid #3b82f6", marginBottom: "20px", fontSize: "18px", fontWeight: "bold", background: "#eff6ff" }} />

            <form onSubmit={handleAddProduct} style={{ display: "flex", gap: "10px", marginBottom: "25px", padding: "15px", background: "rgba(0,0,0,0.03)", borderRadius: "15px", flexWrap: "wrap" }}>
              <input placeholder="Mã" value={newCode} onChange={e => {setNewCode(e.target.value); const p=products.find(x=>x.product_code===e.target.value); if(p){setNewName(p.name); setNewPrice(p.sale_price); setNewImportPrice(p.import_price);}}} style={{ flex: "1", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
              <input placeholder="Tên hàng" value={newName} onChange={e => setNewName(e.target.value)} style={{ flex: "2", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
              <input placeholder="G.Nhập" type="number" value={newImportPrice} onChange={e => setNewImportPrice(e.target.value)} style={{ flex: "1", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
              <input placeholder="G.Bán" type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} style={{ flex: "1", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
              <input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} style={{ flex: "1.5", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
              <input placeholder="SL" type="number" value={newStock} onChange={e => setNewStock(e.target.value)} style={{ flex: "0.8", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
              <button type="submit" style={{ padding: "10px 20px", backgroundColor: "#1e3a8a", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold" }}>NHẬP KHO</button>
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
                      <td style={{ textAlign: "center", color: "#64748b" }} onClick={()=>handleEdit(p.id,'import_price',p.import_price)}>{p.import_price?.toLocaleString()}đ</td>
                      <td style={{ textAlign: "center", color: "#059669", fontWeight: "bold" }} onClick={()=>handleEdit(p.id,'sale_price',p.sale_price)}>{p.sale_price.toLocaleString()}đ</td>
                      <td style={{ textAlign: "center", fontSize: "11px" }}>
                        <div style={{color: "#b91c1c"}} onClick={()=>handleEdit(p.id,'expiry_date',p.expiry_date,true)}>{p.expiry_date || "Chưa có HSD"}</div>
                        <div style={{color: days > 30 ? "#ea580c" : "#16a34a"}}>{days} ngày trong kho</div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button onClick={() => addToCart(p)} style={{ padding: "6px 12px", backgroundColor: "#f59e0b", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", marginRight: "10px" }}>+ GIỎ HÀNG</button>
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
                    <button onClick={()=>setCart(cart.filter((_,i)=>i!==idx))} style={{border:"none",background:"none",color:"#ef4444"}}>x</button>
                  </div>
                ))}
              </div>
              {cart.length > 0 && (
                <button onClick={() => setShowCheckout(true)} style={{ width: "100%", padding: "15px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "12px", fontWeight: "bold", fontSize: "16px" }}>
                  {cart.reduce((s,i)=>s+i.total,0).toLocaleString()}đ - THANH TOÁN
                </button>
              )}
            </div>

            <div className="glass-card" style={{ padding: "20px", flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                <h3 style={{ margin: 0, fontSize: "16px" }}>📋 NHẬT KÝ</h3>
                <button onClick={exportToCSV} style={{ fontSize: "10px", padding: "5px 10px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "5px" }}>EXCEL</button>
              </div>
              <div style={{ maxHeight: "400px", overflowY: "auto", fontSize: "11px" }}>
                {history.map(log => (
                  <div key={log.id} style={{ padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <b>[{log.type}]</b> {log.name} x{log.qty} <span style={{float:"right", color:"#059669"}}>+{log.total?.toLocaleString()}đ</span>
                    <div style={{color:"#94a3b8"}}>{log.time}</div>
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

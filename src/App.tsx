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
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");

  // STATE THANH TOÁN QR
  const [checkoutOrder, setCheckoutOrder] = useState<any>(null);

  const [history, setHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem("mart_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [revenue, setRevenue] = useState<number>(() => {
    const saved = localStorage.getItem("mart_revenue");
    return saved ? Number(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem("mart_history", JSON.stringify(history));
    localStorage.setItem("mart_revenue", revenue.toString());
  }, [history, revenue]);

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
    let csvContent = "\uFEFFThời gian,Loại,Sản phẩm,Số lượng,Thành tiền (VNĐ)\n";
    history.forEach(log => {
      csvContent += `${log.time},${log.type},${log.name},${log.qty},${log.total}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Lich_Su_Hai_Le_Mart_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- CÁC HÀM XỬ LÝ AUTH ---
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUsername || !authPassword) return alert("Vui lòng nhập đủ thông tin!");
    localStorage.setItem("mart_admin_user", authUsername);
    localStorage.setItem("mart_admin_pass", authPassword);
    setSavedUser(authUsername);
    setSavedPass(authPassword);
    setIsLoggedIn(true);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authUsername === savedUser && authPassword === savedPass) {
      setIsLoggedIn(true);
    } else {
      alert("Sai tài khoản hoặc mật khẩu!");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Khóa máy tính tiền?")) {
      setIsLoggedIn(false);
      setAuthUsername("");
      setAuthPassword("");
    }
  };

  // --- QUY TRÌNH THANH TOÁN MỚI ---
  const handleSellClick = (p: any) => {
    if (p.stock <= 0) return alert("Hết hàng!");
    const qty = window.prompt(`Bán ${p.name}. Nhập số lượng:`, "1");
    if (qty && parseInt(qty) > 0 && parseInt(qty) <= p.stock) {
      const sellQty = parseInt(qty);
      const total = p.sale_price * sellQty;
      // Kích hoạt Popup Thanh Toán QR thay vì trừ kho luôn
      setCheckoutOrder({ product: p, qty: sellQty, total: total });
    } else if (qty) {
      alert("Số lượng không hợp lệ hoặc vượt quá kho!");
    }
  };

  const confirmCheckout = async () => {
    if (!checkoutOrder) return;
    setLoading(true);
    const { product: p, qty: sellQty, total } = checkoutOrder;
    
    const { error } = await supabase.from("products").update({ stock: p.stock - sellQty }).eq("id", p.id);
    if (!error) {
      setRevenue(prev => prev + total);
      setHistory(prev => [{ id: Date.now(), type: "BÁN", name: p.name, qty: sellQty, total: total, time: new Date().toLocaleString() }, ...prev]);
      fetchProducts();
    }
    setCheckoutOrder(null);
    setLoading(false);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setNewCode(code);
    const existingProduct = products.find((p: any) => p.product_code === code);
    if (existingProduct) {
      setNewName(existingProduct.name);
      setNewPrice(existingProduct.sale_price.toString());
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName || !newPrice) return alert("Điền đủ thông tin!");
    setLoading(true);

    const existingProduct = products.find((p: any) => p.product_code === newCode);
    const addedStock = parseInt(newStock || "0");

    if (existingProduct) {
      await supabase.from("products").update({ name: newName, sale_price: parseInt(newPrice), stock: existingProduct.stock + addedStock }).eq("id", existingProduct.id);
    } else {
      await supabase.from("products").insert([{ product_code: newCode, name: newName, sale_price: parseInt(newPrice), stock: addedStock }]);
    }
    
    if (addedStock > 0) {
      setHistory(prev => [{ id: Date.now(), type: "NHẬP", name: newName, qty: addedStock, total: 0, time: new Date().toLocaleString() }, ...prev]);
    }

    setNewCode(""); setNewName(""); setNewPrice(""); setNewStock("");
    fetchProducts();
    setLoading(false);
  };

  const handleDelete = async (id: any, name: any) => {
    if (window.confirm(`Xóa vĩnh viễn ${name}?`)) {
      await supabase.from("products").delete().eq("id", id);
      fetchProducts();
    }
  };

  const handleEdit = async (id: any, field: any, oldVal: any) => {
    const newVal = window.prompt(`Nhập giá trị mới cho ${field}:`, oldVal);
    if (newVal !== null) {
      await supabase.from("products").update({ [field]: parseInt(newVal) }).eq("id", id);
      fetchProducts();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Xóa sạch lịch sử và doanh thu?")) {
      setHistory([]);
      setRevenue(0);
    }
  };

  const totalItems = products.reduce((sum, p: any) => sum + (Number(p.stock) || 0), 0);
  const totalValue = products.reduce((sum, p: any) => sum + ((Number(p.sale_price) || 0) * (Number(p.stock) || 0)), 0);

  // MÀN HÌNH AUTH
  if (!savedUser || !savedPass) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f0f4f8", fontFamily: "'Segoe UI', sans-serif" }}>
        <style>{` button[title*="Sandbox"] { display: none !important; } `}</style>
        <div style={{ backgroundColor: "#fff", padding: "40px", borderRadius: "16px", width: "100%", maxWidth: "400px", textAlign: "center" }}>
          <h1 style={{ color: "#1e3a8a", fontSize: "24px" }}>🏪 HẢI LÊ MART PRO</h1>
          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
            <input placeholder="Tên đăng nhập" value={authUsername} onChange={e => setAuthUsername(e.target.value)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
            <input type="password" placeholder="Mật khẩu" value={authPassword} onChange={e => setAuthPassword(e.target.value)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
            <button type="submit" style={{ padding: "14px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>KHỞI TẠO HỆ THỐNG</button>
          </form>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f0f4f8", fontFamily: "'Segoe UI', sans-serif" }}>
        <style>{` button[title*="Sandbox"] { display: none !important; } `}</style>
        <div style={{ backgroundColor: "#fff", padding: "40px", borderRadius: "16px", width: "100%", maxWidth: "400px", textAlign: "center" }}>
          <h1 style={{ color: "#1e3a8a", fontSize: "24px" }}>HẢI LÊ MART PRO</h1>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
            <input placeholder="Tên đăng nhập" value={authUsername} onChange={e => setAuthUsername(e.target.value)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
            <input type="password" placeholder="Mật khẩu" value={authPassword} onChange={e => setAuthPassword(e.target.value)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
            <button type="submit" style={{ padding: "14px", backgroundColor: "#1e3a8a", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>ĐĂNG NHẬP</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "'Segoe UI', sans-serif", backgroundColor: "#f0f4f8", minHeight: "100vh" }}>
      <style>{` button[title*="Sandbox"], .sp-preview-actions, #csb-embed-actions, [class*="SandboxBadge"] { display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; } `}</style>

      {/* POPUP THANH TOÁN QR */}
      {checkoutOrder && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "20px", width: "350px", textAlign: "center", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>📱</div>
            <h3 style={{ margin: "0 0 5px 0", color: "#1e3a8a", fontSize: "20px" }}>Quét Mã Thanh Toán</h3>
            <p style={{ margin: "0 0 15px 0", color: "#64748b", fontSize: "14px" }}>LE HONG HAI - MB BANK</p>
            
            <div style={{ padding: "15px", backgroundColor: "#f8fafc", borderRadius: "12px", marginBottom: "20px" }}>
              <div style={{ fontWeight: "bold", color: "#334155", fontSize: "16px", marginBottom: "5px" }}>{checkoutOrder.product.name} <span style={{color: "#94a3b8"}}>x{checkoutOrder.qty}</span></div>
              <div style={{ color: "#ef4444", fontSize: "26px", fontWeight: "900" }}>{checkoutOrder.total.toLocaleString()}đ</div>
            </div>
            
            {/* API TẠO MÃ QR ĐỘNG CỦA VIETQR (MB BANK: 970422) */}
            <div style={{ background: "#fff", padding: "10px", borderRadius: "16px", border: "2px dashed #cbd5e1", display: "inline-block", marginBottom: "20px" }}>
              <img 
                src={`https://img.vietqr.io/image/970422-0680124181004-compact2.png?amount=${checkoutOrder.total}&addInfo=Thanh toan don hang&accountName=LE%20HONG%20HAI`} 
                alt="QR Thanh toán" 
                style={{ width: "220px", height: "220px", display: "block" }} 
              />
            </div>
            
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setCheckoutOrder(null)} disabled={loading} style={{ flex: 1, padding: "14px", backgroundColor: "#f1f5f9", border: "none", borderRadius: "10px", fontWeight: "bold", color: "#64748b", cursor: "pointer" }}>Hủy</button>
              <button onClick={confirmCheckout} disabled={loading} style={{ flex: 2, padding: "14px", backgroundColor: "#10b981", border: "none", borderRadius: "10px", fontWeight: "bold", color: "#fff", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "5px" }}>
                {loading ? "Đang xử lý..." : "✔️ Đã nhận tiền"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "20px" }}>
          <div style={{ padding: "20px", backgroundColor: "#fff", borderRadius: "12px", borderLeft: "6px solid #3b82f6" }}>
            <div style={{ color: "#64748b", fontSize: "12px", fontWeight: "bold" }}>TỔNG TỒN KHO</div>
            <div style={{ fontSize: "22px", fontWeight: "bold" }}>{totalItems} món</div>
          </div>
          <div style={{ padding: "20px", backgroundColor: "#fff", borderRadius: "12px", borderLeft: "6px solid #10b981" }}>
            <div style={{ color: "#64748b", fontSize: "12px", fontWeight: "bold" }}>GIÁ TRỊ KHO</div>
            <div style={{ fontSize: "22px", fontWeight: "bold", color: "#10b981" }}>{totalValue.toLocaleString()}đ</div>
          </div>
          <div style={{ padding: "20px", backgroundColor: "#1e3a8a", borderRadius: "12px", color: "#fff" }}>
            <div style={{ color: "#bfdbfe", fontSize: "12px", fontWeight: "bold" }}>DOANH THU</div>
            <div style={{ fontSize: "22px", fontWeight: "bold" }}>+{revenue.toLocaleString()}đ</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr", gap: "20px" }}>
          <div style={{ backgroundColor: "#fff", padding: "25px", borderRadius: "16px", boxShadow: "0 10px 15px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ color: "#1e3a8a", margin: 0 }}>🏪 HẢI LÊ MART PRO</h2>
              <button onClick={handleLogout} style={{ padding: "8px 12px", backgroundColor: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>Đăng xuất 🔒</button>
            </div>
            
            <form onSubmit={handleAddProduct} style={{ display: "flex", gap: "5px", marginBottom: "20px", padding: "15px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <input placeholder="Mã" value={newCode} onChange={handleCodeChange} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
              <input placeholder="Tên SP" value={newName} onChange={e => setNewName(e.target.value)} style={{ flex: 2, padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
              <input type="number" placeholder="Giá" value={newPrice} onChange={e => setNewPrice(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
              <input type="number" placeholder="SL Nhập" value={newStock} onChange={e => setNewStock(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
              <button type="submit" disabled={loading} style={{ padding: "10px 15px", backgroundColor: "#1e3a8a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>NHẬP</button>
            </form>

            <input placeholder="🔍 Tìm tên hoặc mã..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "15px" }} />

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b", fontSize: "12px" }}>
                  <th style={{ textAlign: "left", padding: "10px" }}>SẢN PHẨM</th>
                  <th style={{ textAlign: "center", padding: "10px" }}>KHO</th>
                  <th style={{ textAlign: "right", padding: "10px" }}>GIÁ BÁN</th>
                  <th style={{ textAlign: "center", padding: "10px" }}>QUẢN LÝ</th>
                </tr>
              </thead>
              <tbody>
                {products.filter((p: any) => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((p: any) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px" }}>
                      <div style={{ fontWeight: "bold" }}>{p.name}</div>
                      <small style={{ color: "#94a3b8" }}>{p.product_code}</small>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button onClick={() => handleEdit(p.id, 'stock', p.stock)} style={{ border: "none", background: p.stock < 5 ? "#fee2e2" : "#f1f5f9", color: p.stock < 5 ? "#ef4444" : "#475569", padding: "3px 8px", borderRadius: "5px", fontWeight: "bold" }}>{p.stock}</button>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#059669" }}>
                      <span onClick={() => handleEdit(p.id, 'sale_price', p.sale_price)} style={{ cursor: "pointer" }}>{p.sale_price.toLocaleString()}đ</span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button onClick={() => handleSellClick(p)} style={{ padding: "5px 15px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>BÁN & QUÉT MÃ</button>
                      <button onClick={() => handleDelete(p.id, p.name)} style={{ background: "none", border: "none", color: "#cbd5e1", cursor: "pointer", marginLeft: "10px" }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", height: "fit-content" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #f1f5f9", paddingBottom: "10px", marginBottom: "10px" }}>
              <h3 style={{ margin: 0, fontSize: "15px", color: "#1e3a8a" }}>📋 LỊCH SỬ</h3>
              <button onClick={exportToCSV} style={{ padding: "4px 8px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>XUẤT EXCEL</button>
            </div>
            
            <div style={{ maxHeight: "450px", overflowY: "auto" }}>
              {history.length === 0 ? <p style={{ color: "#94a3b8", textAlign: "center", fontSize: "13px" }}>Chưa có biến động</p> : 
                history.map((log: any) => (
                  <div key={log.id} style={{ padding: "10px 0", borderBottom: "1px dashed #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ fontWeight: "bold", color: log.type === "NHẬP" ? "#2563eb" : "#334155" }}>
                        [{log.type}] {log.name} x{log.qty}
                      </span>
                      {log.type === "BÁN" && <span style={{ color: "#10b981", fontWeight: "bold" }}>+{log.total.toLocaleString()}đ</span>}
                    </div>
                    <small style={{ color: "#94a3b8", fontSize: "11px" }}>{log.time}</small>
                  </div>
                ))
              }
            </div>
            {history.length > 0 && (
              <button onClick={handleClearHistory} style={{ width: "100%", marginTop: "15px", padding: "8px", background: "#fee2e2", border: "none", borderRadius: "6px", color: "#ef4444", fontWeight: "bold", cursor: "pointer", fontSize: "11px" }}>XÓA LỊCH SỬ</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

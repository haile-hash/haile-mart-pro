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
    link.setAttribute("download", `Bao_Cao_Hai_Le_Mart_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
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

  // --- QUÉT MÃ VẠCH BÁN HÀNG ---
  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!barcodeInput.trim()) return;
      const foundProduct = products.find(p => p.product_code === barcodeInput.trim());
      if (foundProduct) {
        if (foundProduct.stock <= 0) {
          alert(`Sản phẩm ${foundProduct.name} đã hết hàng!`);
        } else {
          const existingItem = cart.find(item => item.product.id === foundProduct.id);
          const currentCartQty = existingItem ? existingItem.qty : 0;
          if (currentCartQty + 1 > foundProduct.stock) {
            alert(`Kho chỉ còn ${foundProduct.stock} ${foundProduct.name}!`);
          } else {
            if (existingItem) {
              setCart(cart.map(item => item.product.id === foundProduct.id ? { ...item, qty: item.qty + 1, total: (item.qty + 1) * foundProduct.sale_price, profit: (item.qty + 1) * (foundProduct.sale_price - (foundProduct.import_price || 0)) } : item));
            } else {
              setCart([...cart, { product: foundProduct, qty: 1, total: foundProduct.sale_price, profit: foundProduct.sale_price - (foundProduct.import_price || 0) }]);
            }
          }
        }
      } else { alert("❌ Mã không tồn tại!"); }
      setBarcodeInput(""); 
    }
  };

  // --- THÊM VÀO GIỎ ---
  const addToCart = (p: any) => {
    if (p.stock <= 0) return alert("Hết hàng!");
    const qty = window.prompt(`Thêm ${p.name} vào giỏ. Nhập số lượng:`, "1");
    if (qty && parseInt(qty) > 0) {
      const addQty = parseInt(qty);
      const existingItem = cart.find(item => item.product.id === p.id);
      const currentCartQty = existingItem ? existingItem.qty : 0;
      if (currentCartQty + addQty > p.stock) return alert(`Kho chỉ còn ${p.stock} sản phẩm!`);
      const itemProfit = (p.sale_price - (p.import_price || 0)) * addQty;
      if (existingItem) {
        setCart(cart.map(item => item.product.id === p.id ? { ...item, qty: item.qty + addQty, total: (item.qty + addQty) * p.sale_price, profit: item.profit + itemProfit } : item));
      } else {
        setCart([...cart, { product: p, qty: addQty, total: addQty * p.sale_price, profit: itemProfit }]);
      }
    }
  };

  const removeFromCart = (productId: any) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const cartTotalAmount = cart.reduce((sum, item) => sum + item.total, 0);

  const confirmCheckout = async () => {
    setLoading(true);
    let currentRevenue = revenue;
    let currentProfit = profit;
    let newHistoryLogs: any[] = [];

    for (const item of cart) {
      const { product: p, qty, total, profit: itemProfit } = item;
      await supabase.from("products").update({ stock: p.stock - qty }).eq("id", p.id);
      currentRevenue += total;
      currentProfit += itemProfit;
      newHistoryLogs.push({ id: Date.now() + Math.random(), type: "BÁN", name: p.name, qty: qty, total: total, profit: itemProfit, time: new Date().toLocaleString() });
    }

    setRevenue(currentRevenue);
    setProfit(currentProfit);
    setHistory(prev => [...newHistoryLogs, ...prev]);
    setCart([]); 
    setShowCheckout(false); 
    fetchProducts();
    setLoading(false);
  };

  // --- NHẬP KHO THÔNG MINH (THUẬT TOÁN GIÁ BÌNH QUÂN GIA QUYỀN) ---
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setNewCode(code);
    const existingProduct = products.find((p: any) => p.product_code === code);
    if (existingProduct) {
      setNewName(existingProduct.name);
      setNewImportPrice(existingProduct.import_price?.toString() || "");
      setNewPrice(existingProduct.sale_price.toString());
      setNewExpiry(existingProduct.expiry_date || "");
    }
  };

  const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const existingProduct = products.find((p: any) => p.product_code === e.currentTarget.value.trim());
      if (existingProduct) { document.getElementById("importPriceInput")?.focus(); }
      else { document.getElementById("nameInput")?.focus(); }
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName || !newPrice || !newImportPrice) return alert("Điền đủ Mã, Tên, Giá Nhập và Giá Bán!");
    setLoading(true);
    
    const existingProduct = products.find((p: any) => p.product_code === newCode);
    const addedStock = parseInt(newStock || "0");
    const inputImportPrice = parseInt(newImportPrice);
    
    let finalImportPrice = inputImportPrice; // Mặc định là giá mới nhập

    // THUẬT TOÁN TÍNH GIÁ BÌNH QUÂN KHI NHẬP THÊM HÀNG CÙNG MÃ NHƯNG KHÁC GIÁ
    if (existingProduct && existingProduct.stock > 0 && addedStock > 0) {
        const oldTotalValue = existingProduct.stock * (existingProduct.import_price || 0); // Vốn cũ
        const newTotalValue = addedStock * inputImportPrice; // Vốn mới
        const totalStock = existingProduct.stock + addedStock; // Tổng số lượng
        finalImportPrice = Math.round((oldTotalValue + newTotalValue) / totalStock); // Trung bình cộng giá nhập
    }

    const dataSave = { 
        name: newName, 
        import_price: finalImportPrice, // Lưu giá vốn bình quân
        sale_price: parseInt(newPrice), 
        stock: existingProduct ? existingProduct.stock + addedStock : addedStock,
        // Nếu lúc nhập điền HSD mới thì lấy HSD mới, không điền thì giữ lại HSD cũ
        expiry_date: newExpiry || (existingProduct ? existingProduct.expiry_date : null) 
    };

    if (existingProduct) {
      await supabase.from("products").update(dataSave).eq("id", existingProduct.id);
    } else {
      await supabase.from("products").insert([dataSave]);
    }
    
    if (addedStock > 0) {
      setHistory(prev => [{ id: Date.now(), type: "NHẬP", name: newName, qty: addedStock, total: 0, time: new Date().toLocaleString() }, ...prev]);
    }
    setNewCode(""); setNewName(""); setNewImportPrice(""); setNewPrice(""); setNewStock(""); setNewExpiry("");
    fetchProducts();
    setLoading(false);
    setTimeout(() => { document.getElementById("codeInput")?.focus(); }, 100);
  };

  const handleDelete = async (id: any, name: any) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm [${name}] khỏi hệ thống không?`)) {
      await supabase.from("products").delete().eq("id", id);
      fetchProducts();
    }
  };

  const handleEdit = async (id: any, field: string, oldVal: any, isDate: boolean = false) => {
    const promptText = isDate 
      ? `Nhập Hạn Sử Dụng mới (Định dạng: Năm-Tháng-Ngày, ví dụ: 2026-12-31):` 
      : `Nhập giá trị mới cho ${field}:`;
    const newVal = window.prompt(promptText, oldVal || "");
    if (newVal !== null && newVal.trim() !== "") {
      const updateVal = isDate ? newVal : parseInt(newVal);
      await supabase.from("products").update({ [field]: updateVal }).eq("id", id);
      fetchProducts();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Xóa sạch lịch sử, doanh thu và lợi nhuận?")) {
      setHistory([]);
      setRevenue(0);
      setProfit(0);
    }
  };

  const totalItems = products.reduce((sum, p: any) => sum + (Number(p.stock) || 0), 0);
  const totalValue = products.reduce((sum, p: any) => sum + ((Number(p.import_price) || 0) * (Number(p.stock) || 0)), 0);

  if (!isLoggedIn) {
     return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f0f4f8", fontFamily: "'Segoe UI', sans-serif" }}>
        <style>{` button[title*="Sandbox"] { display: none !important; } `}</style>
        <div style={{ backgroundColor: "#fff", padding: "40px", borderRadius: "16px", width: "100%", maxWidth: "400px", textAlign: "center" }}>
          <h1 style={{ color: "#1e3a8a", fontSize: "24px" }}>HẢI LÊ MART PRO</h1>
          <form onSubmit={!savedUser ? handleRegister : handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
            <input placeholder="Tên đăng nhập" value={authUsername} onChange={e => setAuthUsername(e.target.value)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
            <input type="password" placeholder="Mật khẩu" value={authPassword} onChange={e => setAuthPassword(e.target.value)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
            <button type="submit" style={{ padding: "14px", backgroundColor: "#1e3a8a", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>{!savedUser ? "KHỞI TẠO" : "ĐĂNG NHẬP"}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "'Segoe UI', sans-serif", backgroundColor: "#f0f4f8", minHeight: "100vh" }}>
      <style>{` button[title*="Sandbox"], .sp-preview-actions, #csb-embed-actions, [class*="SandboxBadge"] { display: none !important; } `}</style>

      {showCheckout && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "20px", width: "380px", textAlign: "center" }}>
            <h3 style={{ color: "#1e3a8a" }}>Thanh Toán QR</h3>
            <div style={{ padding: "15px", backgroundColor: "#f8fafc", borderRadius: "12px", marginBottom: "20px" }}>
              <div style={{ color: "#ef4444", fontSize: "28px", fontWeight: "900" }}>{cartTotalAmount.toLocaleString()}đ</div>
            </div>
            <img src={`https://img.vietqr.io/image/970422-0680124181004-compact2.png?amount=${cartTotalAmount}&addInfo=Thanh toan&accountName=LE%20HONG%20HAI`} style={{ width: "220px", marginBottom: "20px" }} />
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowCheckout(false)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none" }}>Hủy</button>
              <button onClick={confirmCheckout} style={{ flex: 2, padding: "12px", backgroundColor: "#10b981", color: "#fff", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer" }}>Đã nhận tiền</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: "1250px", margin: "0 auto" }}>
        {/* THANH THỐNG KÊ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "20px" }}>
          <div style={{ padding: "15px", backgroundColor: "#fff", borderRadius: "12px", borderLeft: "6px solid #3b82f6" }}>
            <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "bold" }}>TỔNG MÓN</div>
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>{totalItems}</div>
          </div>
          <div style={{ padding: "15px", backgroundColor: "#fff", borderRadius: "12px", borderLeft: "6px solid #8b5cf6" }}>
            <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "bold" }}>GIÁ TRỊ KHO (VỐN)</div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#8b5cf6" }}>{totalValue.toLocaleString()}đ</div>
          </div>
          <div style={{ padding: "15px", backgroundColor: "#1e3a8a", borderRadius: "12px", color: "#fff" }}>
            <div style={{ color: "#bfdbfe", fontSize: "11px", fontWeight: "bold" }}>DOANH THU</div>
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>{revenue.toLocaleString()}đ</div>
          </div>
          <div style={{ padding: "15px", backgroundColor: "#059669", borderRadius: "12px", color: "#fff" }}>
            <div style={{ color: "#a7f3d0", fontSize: "11px", fontWeight: "bold" }}>LỢI NHUẬN ƯỚC TÍNH</div>
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>{profit.toLocaleString()}đ</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr", gap: "20px" }}>
          <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "16px", boxShadow: "0 10px 15px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
              <h2 style={{ color: "#1e3a8a", margin: 0 }}>🏪 HẢI LÊ MART PRO</h2>
              <button onClick={handleLogout} style={{ padding: "5px 10px", backgroundColor: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "6px", cursor: "pointer" }}>Khóa 🔒</button>
            </div>
            
            <input placeholder="🛒 QUÉT MÃ BÁN HÀNG..." value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} onKeyDown={handleBarcodeSubmit} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "2px solid #3b82f6", marginBottom: "15px", fontWeight: "bold" }} />

            <div style={{ fontSize: "11px", fontWeight: "bold", color: "#64748b", marginBottom: "5px" }}>📦 NHẬP KHO THÔNG MINH</div>
            <form onSubmit={handleAddProduct} style={{ display: "flex", gap: "5px", marginBottom: "15px", padding: "10px", backgroundColor: "#f8fafc", borderRadius: "10px", flexWrap: "wrap" }}>
              <input id="codeInput" placeholder="Mã" value={newCode} onChange={handleCodeChange} onKeyDown={handleCodeKeyDown} style={{ flex: "1", padding: "8px", borderRadius: "5px", border: "1px solid #cbd5e1" }} />
              <input id="nameInput" placeholder="Tên SP" value={newName} onChange={e => setNewName(e.target.value)} style={{ flex: "2", padding: "8px", borderRadius: "5px", border: "1px solid #cbd5e1" }} />
              <input id="importPriceInput" type="number" placeholder="G.Nhập" value={newImportPrice} onChange={e => setNewImportPrice(e.target.value)} style={{ flex: "1", padding: "8px", borderRadius: "5px", border: "1px solid #cbd5e1" }} />
              <input type="number" placeholder="G.Bán" value={newPrice} onChange={e => setNewPrice(e.target.value)} style={{ flex: "1", padding: "8px", borderRadius: "5px", border: "1px solid #cbd5e1" }} />
              <input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} style={{ flex: "1.2", padding: "8px", borderRadius: "5px", border: "1px solid #cbd5e1" }} />
              <input id="stockInput" type="number" placeholder="SL" value={newStock} onChange={e => setNewStock(e.target.value)} style={{ flex: "0.8", padding: "8px", borderRadius: "5px", border: "1px solid #cbd5e1" }} />
              <button type="submit" style={{ padding: "8px 15px", backgroundColor: "#1e3a8a", color: "#fff", borderRadius: "5px", border: "none", fontWeight: "bold", cursor: "pointer" }}>NHẬP</button>
            </form>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b", fontSize: "11px" }}>
                  <th style={{ textAlign: "left", padding: "8px" }}>SẢN PHẨM</th>
                  <th style={{ textAlign: "center" }}>TỒN</th>
                  <th style={{ textAlign: "center" }}>GIÁ NHẬP</th>
                  <th style={{ textAlign: "center" }}>GIÁ BÁN</th>
                  <th style={{ textAlign: "center" }}>HSD & KHO</th>
                  <th style={{ textAlign: "center" }}>QUẢN LÝ</th>
                </tr>
              </thead>
              <tbody>
                {products.filter((p: any) => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((p: any) => {
                  const diffDays = Math.floor(Math.abs(new Date().getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "13px" }}>
                      <td style={{ padding: "8px" }}><b>{p.name}</b><br/><small>{p.product_code}</small></td>
                      <td style={{ textAlign: "center" }}>{p.stock}</td>
                      <td style={{ textAlign: "center", color: "#64748b", cursor: "pointer" }} onClick={() => handleEdit(p.id, 'import_price', p.import_price)}>{p.import_price?.toLocaleString()}đ</td>
                      <td style={{ textAlign: "center", fontWeight: "bold", color: "#059669", cursor: "pointer" }} onClick={() => handleEdit(p.id, 'sale_price', p.sale_price)}>{p.sale_price.toLocaleString()}đ</td>
                      <td style={{ textAlign: "center", fontSize: "10px" }}>
                        <span onClick={() => handleEdit(p.id, 'expiry_date', p.expiry_date, true)} style={{color: "#b91c1c", cursor: "pointer"}} title="Bấm để sửa HSD">{p.expiry_date || "Chưa có HSD"}</span><br/>
                        <span style={{color: "#ea580c"}}>{diffDays} ngày trong kho</span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                          <button onClick={() => addToCart(p)} style={{ padding: "5px 8px", backgroundColor: "#f59e0b", color: "#fff", border: "none", borderRadius: "4px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}>+ GIỎ HÀNG</button>
                          <button onClick={() => handleDelete(p.id, p.name)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "14px" }} title="Xóa sản phẩm">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{ backgroundColor: "#fff", padding: "15px", borderRadius: "16px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#d97706" }}>🛒 GIỎ HÀNG ({cart.length})</h4>
              <div style={{ maxHeight: "150px", overflowY: "auto", fontSize: "12px" }}>
                {cart.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                    <span>{item.product.name} x{item.qty}</span>
                    <button onClick={() => removeFromCart(item.product.id)} style={{border: "none", background: "none", color: "#ef4444", cursor: "pointer"}}>x</button>
                  </div>
                ))}
              </div>
              {cart.length > 0 && <button onClick={() => setShowCheckout(true)} style={{ width: "100%", padding: "10px", backgroundColor: "#10b981", color: "#fff", borderRadius: "8px", border: "none", marginTop: "10px", fontWeight: "bold", cursor: "pointer" }}>{cartTotalAmount.toLocaleString()}đ - THANH TOÁN</button>}
            </div>

            <div style={{ backgroundColor: "#fff", padding: "15px", borderRadius: "16px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <h4 style={{ margin: 0 }}>📋 LỊCH SỬ</h4>
                <button onClick={exportToCSV} style={{ fontSize: "10px", cursor: "pointer", padding: "2px 5px" }}>XUẤT EXCEL</button>
              </div>
              <div style={{ maxHeight: "300px", overflowY: "auto", fontSize: "11px" }}>
                {history.map((log: any) => (
                  <div key={log.id} style={{ marginBottom: "8px", borderBottom: "1px dashed #eee", paddingBottom: "4px" }}>
                    <b>[{log.type}]</b> {log.name} x{log.qty} <span style={{float: "right", color: "#059669"}}>+{log.total?.toLocaleString()}đ</span>
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

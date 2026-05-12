import React, { useEffect, useState } from "react";
// @ts-ignore
import { supabase } from "./supabaseClient";

export default function App() {
  const [products, setProducts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form states
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");

  // 1. TẢI DỮ LIỆU & THEO DÕI BIẾN ĐỘNG THỜI GIAN THỰC
  useEffect(() => {
    fetchProducts();
    const channel = supabase
      .channel("db_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        fetchProducts();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setProducts(data);
  };

  // 2. XỬ LÝ BÁN HÀNG
  const handleSell = async (p: any) => {
    if (p.stock <= 0) return alert("Hết hàng!");
    const qty = window.prompt(`Bán ${p.name}. Nhập số lượng:`, "1");
    if (qty && parseInt(qty) <= p.stock) {
      const sellQty = parseInt(qty);
      const { error } = await supabase.from("products").update({ stock: p.stock - sellQty }).eq("id", p.id);
      if (!error) {
        setRevenue(prev => prev + (p.sale_price * sellQty));
        setHistory(prev => [{ id: Date.now(), name: p.name, qty: sellQty, total: p.sale_price * sellQty, time: new Date().toLocaleTimeString() }, ...prev]);
      }
    } else if (qty) alert("Không đủ hàng trong kho!");
  };

  // 3. THÊM HÀNG MỚI
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName || !newPrice) return alert("Vui lòng điền đủ thông tin!");
    setLoading(true);
    await supabase.from("products").insert([{ product_code: newCode, name: newName, sale_price: parseInt(newPrice), stock: parseInt(newStock || "0") }]);
    setNewCode(""); setNewName(""); setNewPrice(""); setNewStock("");
    setLoading(false);
  };

  // 4. XÓA & SỬA
  const handleDelete = async (id: any, name: any) => {
    if (window.confirm(`Xóa vĩnh viễn ${name}?`)) {
      await supabase.from("products").delete().eq("id", id);
    }
  };

  const handleEdit = async (id: any, field: any, oldVal: any) => {
    const newVal = window.prompt(`Nhập giá trị mới cho ${field}:`, oldVal);
    if (newVal !== null) {
      await supabase.from("products").update({ [field]: parseInt(newVal) }).eq("id", id);
    }
  };

  const totalItems = products.reduce((sum, p: any) => sum + (Number(p.stock) || 0), 0);
  const totalValue = products.reduce((sum, p: any) => sum + ((Number(p.sale_price) || 0) * (Number(p.stock) || 0)), 0);

  return (
    <div style={{ padding: "20px", fontFamily: "'Segoe UI', sans-serif", backgroundColor: "#f0f4f8", minHeight: "100vh" }}>
      {/* ĐOẠN MÃ TÀNG HÌNH: ẨN NÚT OPEN SANDBOX */}
      <style>{`
        button[title*="Sandbox"], .sp-preview-actions, #csb-embed-actions, [class*="SandboxBadge"] { 
          display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important;
        }
      `}</style>

      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* DASHBOARD THỐNG KÊ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "20px" }}>
          <div style={{ padding: "20px", backgroundColor: "#fff", borderRadius: "12px", borderLeft: "6px solid #3b82f6", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
            <div style={{ color: "#64748b", fontSize: "13px", fontWeight: "bold" }}>TỔNG TỒN KHO</div>
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{totalItems} <small style={{fontWeight: "normal", fontSize: "14px"}}>món</small></div>
          </div>
          <div style={{ padding: "20px", backgroundColor: "#fff", borderRadius: "12px", borderLeft: "6px solid #10b981", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
            <div style={{ color: "#64748b", fontSize: "13px", fontWeight: "bold" }}>GIÁ TRỊ KHO</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#10b981" }}>{totalValue.toLocaleString()}đ</div>
          </div>
          <div style={{ padding: "20px", backgroundColor: "#1e3a8a", borderRadius: "12px", color: "#fff", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
            <div style={{ color: "#bfdbfe", fontSize: "13px", fontWeight: "bold" }}>DOANH THU PHIÊN NÀY</div>
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>+{revenue.toLocaleString()}đ</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
          {/* CỘT TRÁI: BẢNG ĐIỀU KHIỂN CHÍNH */}
          <div style={{ backgroundColor: "#fff", padding: "25px", borderRadius: "16px", boxShadow: "0 10px 15px rgba(0,0,0,0.05)" }}>
            <h2 style={{ color: "#1e3a8a", marginTop: 0, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>🏪 HẢI LÊ MART PRO</h2>
            
            {/* FORM NHẬP HÀNG NHANH */}
            <form onSubmit={handleAddProduct} style={{ display: "flex", gap: "5px", marginBottom: "25px", padding: "15px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <input placeholder="Mã" value={newCode} onChange={e => setNewCode(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
              <input placeholder="Tên SP" value={newName} onChange={e => setNewName(e.target.value)} style={{ flex: 2, padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
              <input type="number" placeholder="Giá" value={newPrice} onChange={e => setNewPrice(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
              <input type="number" placeholder="SL" value={newStock} onChange={e => setNewStock(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
              <button type="submit" disabled={loading} style={{ padding: "10px 15px", backgroundColor: "#1e3a8a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>NHẬP</button>
            </form>

            <input type="text" placeholder="🔍 Tìm kiếm tên sản phẩm hoặc mã hàng..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "20px", outline: "none" }} />

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b", fontSize: "13px" }}>
                  <th style={{ textAlign: "left", padding: "12px" }}>SẢN PHẨM</th>
                  <th style={{ textAlign: "center", padding: "12px" }}>KHO</th>
                  <th style={{ textAlign: "right", padding: "12px" }}>GIÁ BÁN</th>
                  <th style={{ textAlign: "center", padding: "12px" }}>QUẢN LÝ</th>
                </tr>
              </thead>
              <tbody>
                {products.filter((p: any) => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((p: any) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px" }}>
                      <div style={{ fontWeight: "bold", color: "#334155" }}>{p.name}</div>
                      <small style={{ color: "#94a3b8" }}>{p.product_code}</small>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button onClick={() => handleEdit(p.id, 'stock', p.stock)} style={{ border: "none", background: p.stock < 5 ? "#fee2e2" : "#f1f5f9", color: p.stock < 5 ? "#ef4444" : "#475569", padding: "4px 10px", borderRadius: "5px", fontWeight: "bold", cursor: "pointer" }}>
                        {p.stock}
                      </button>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#059669" }}>
                      <span onClick={() => handleEdit(p.id, 'sale_price', p.sale_price)} style={{ cursor: "pointer" }}>{p.sale_price.toLocaleString()}đ</span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button onClick={() => handleSell(p)} style={{ padding: "6px 12px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", marginRight: "8px", fontWeight: "bold" }}>BÁN</button>
                      <button onClick={() => handleDelete(p.id, p.name)} style={{ background: "none", border: "none", color: "#cbd5e1", cursor: "pointer" }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CỘT PHẢI: NHẬT KÝ BÁN HÀNG */}
          <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", height: "fit-content" }}>
            <h3 style={{ marginTop: 0, fontSize: "16px", color: "#1e3a8a", borderBottom: "2px solid #f1f5f9", paddingBottom: "10px" }}>📋 NHẬT KÝ GIAO DỊCH</h3>
            <div style={{ maxHeight: "450px", overflowY: "auto" }}>
              {history.length === 0 ? <p style={{ color: "#94a3b8", textAlign: "center", marginTop: "20px" }}>Chưa có đơn hàng mới</p> : 
                history.map((log: any) => (
                  <div key={log.id} style={{ padding: "12px 0", borderBottom: "1px dashed #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <span style={{ fontWeight: "bold", fontSize: "14px" }}>{log.name} <small style={{color: "#64748b"}}>x{log.qty}</small></span>
                      <span style={{ color: "#10b981", fontWeight: "bold" }}>+{log.total.toLocaleString()}đ</span>
                    </div>
                    <small style={{ color: "#94a3b8" }}>Thời gian: {log.time}</small>
                  </div>
                ))
              }
            </div>
            {history.length > 0 && (
              <button onClick={() => setHistory([])} style={{ width: "100%", marginTop: "15px", padding: "8px", background: "none", border: "1px solid #e2e8f0", borderRadius: "6px", color: "#64748b", cursor: "pointer", fontSize: "12px" }}>Xóa lịch sử phiên</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
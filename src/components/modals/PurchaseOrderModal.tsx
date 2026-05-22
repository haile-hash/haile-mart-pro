/* eslint-disable */
// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Product } from '../../types';

interface POItem {
  product: Product;
  qty: number;
  importPrice: number;
}

interface PurchaseOrderModalProps {
  showModal: boolean;
  setShowModal: (val: boolean) => void;
  suppliers: any[];
  products: Product[];
  handleSavePO: (supplier: any, items: POItem[], totalAmount: number, paidAmount: number, note: string) => Promise<void>;
  loading: boolean;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({ showModal, setShowModal, suppliers, products, handleSavePO, loading }) => {
  const [selectedSupId, setSelectedSupId] = useState("");
  const [poItems, setPoItems] = useState<POItem[]>([]);
  const [searchProd, setSearchProd] = useState("");
  const [paidAmountStr, setPaidAmountStr] = useState("");
  const [note, setNote] = useState("");

  const totalAmount = poItems.reduce((sum, item) => sum + (item.qty * item.importPrice), 0);
  const paidAmount = parseInt(paidAmountStr.replace(/[,.]/g, '')) || 0;
  const debtAmount = totalAmount - paidAmount;

  const filteredProducts = useMemo(() => {
    if (!searchProd.trim()) return [];
    const term = searchProd.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(term) || p.product_code.toLowerCase().includes(term)).slice(0, 10);
  }, [searchProd, products]);

  const addProductToPO = (p: Product) => {
    if (poItems.find(item => item.product.id === p.id)) {
      toast.error("Sản phẩm đã có trong phiếu!"); return;
    }
    setPoItems([...poItems, { product: p, qty: 1, importPrice: p.import_price || 0 }]);
    setSearchProd("");
  };

  const updateItem = (id: any, field: 'qty' | 'importPrice', val: string) => {
    const num = parseInt(val.replace(/[,.]/g, '')) || 0;
    setPoItems(poItems.map(item => item.product.id === id ? { ...item, [field]: num } : item));
  };

  const removeItem = (id: any) => setPoItems(poItems.filter(i => i.product.id !== id));

  const onSubmit = () => {
    if (!selectedSupId) return toast.error("Vui lòng chọn Nhà cung cấp!");
    if (poItems.length === 0) return toast.error("Phiếu nhập chưa có sản phẩm nào!");
    const supplier = suppliers.find(s => String(s.id) === selectedSupId);
    if (!supplier) return;
    handleSavePO(supplier, poItems, totalAmount, paidAmount, note).then(() => {
      setSelectedSupId(""); setPoItems([]); setPaidAmountStr(""); setNote("");
    });
  };

  if (!showModal) return null;

  return (
    <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, fontFamily: "'Inter', sans-serif" }} onClick={() => setShowModal(false)}>
      <div className="glass" style={{ padding: "0", width: "950px", maxHeight: "90vh", borderRadius: "16px", display: "flex", flexDirection: "column", background: "#ffffff", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }} onClick={e => e.stopPropagation()}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #f1f5f9", background: "#ffffff", borderRadius: "16px 16px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ background: "#eff6ff", color: "#2563eb", padding: "8px", borderRadius: "10px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
            </div>
            <h2 style={{ margin: 0, color: "#0f172a", fontSize: "20px", fontWeight: "800" }}>TẠO PHIẾU NHẬP HÀNG (PO)</h2>
          </div>
          <button onClick={() => setShowModal(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", color: "#64748b" }}>✖</button>
        </div>

        <div style={{ padding: "24px", overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column", gap: "20px", background: "#fafafa" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", width: "100%" }}>
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ background: "#1e293b", color: "#fff", width: "22px", height: "22px", display: "flex", justifyContent: "center", alignItems: "center", borderRadius: "50%", fontSize: "12px", fontWeight: "bold" }}>1</span>
                <h3 style={{ margin: 0, fontSize: "14px", color: "#0f172a", fontWeight: "700" }}>Thông tin Nhà cung cấp</h3>
              </div>
              <select value={selectedSupId} onChange={e => setSelectedSupId(e.target.value)} style={{ boxSizing: "border-box", width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", marginBottom: "12px", fontWeight: "600", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
                <option value="">-- Chọn Nhà Cung Cấp --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} - {s.phone} (Nợ: {(s.debt || 0).toLocaleString()}đ)</option>)}
              </select>
              <textarea placeholder="Ghi chú phiếu nhập..." value={note} onChange={e => setNote(e.target.value)} style={{ boxSizing: "border-box", width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", height: "70px", resize: "none", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }} />
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ background: "#1e293b", color: "#fff", width: "22px", height: "22px", display: "flex", justifyContent: "center", alignItems: "center", borderRadius: "50%", fontSize: "12px", fontWeight: "bold" }}>2</span>
                <h3 style={{ margin: 0, fontSize: "14px", color: "#0f172a", fontWeight: "700" }}>Tìm & Thêm sản phẩm</h3>
              </div>
              <div style={{ position: "relative", flex: 1 }}>
                <input type="text" placeholder="Nhập Tên hoặc Mã sản phẩm..." value={searchProd} onChange={e => setSearchProd(e.target.value)} style={{ boxSizing: "border-box", width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "'Inter', sans-serif" }} />
                {filteredProducts.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "8px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", maxHeight: "150px", overflowY: "auto", zIndex: 10 }}>
                    {filteredProducts.map(p => (
                      <div key={p.id} onClick={() => addProductToPO(p)} style={{ padding: "10px 15px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", fontSize: "13px", display: "flex", justifyContent: "space-between" }}>
                        <div><b>{p.product_code}</b> - {p.name}</div>
                        <span style={{ color: "#64748b" }}>Tồn: {p.stock}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <tr>
                  <th style={{ padding: "14px", textAlign: "left", color: "#475569" }}>Sản phẩm</th>
                  <th style={{ padding: "14px", textAlign: "center", width: "120px" }}>SL Nhập</th>
                  <th style={{ padding: "14px", textAlign: "right", width: "150px" }}>Giá Nhập</th>
                  <th style={{ padding: "14px", textAlign: "right", width: "150px" }}>Thành Tiền</th>
                  <th style={{ padding: "14px", width: "50px" }}></th>
                </tr>
              </thead>
              <tbody>
                {poItems.length === 0 ? <tr><td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>Chưa có sản phẩm nào.</td></tr> : poItems.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 14px", fontWeight: "600" }}>{item.product.name}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center" }}>
                      <input type="number" min="1" value={item.qty || ""} onChange={e => updateItem(item.product.id, 'qty', e.target.value)} style={{ boxSizing: "border-box", width: "80px", padding: "8px", textAlign: "center", border: "1px solid #cbd5e1", borderRadius: "6px", fontFamily: "'Inter', sans-serif" }} />
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <input type="text" value={item.importPrice === 0 ? "" : item.importPrice.toLocaleString()} onChange={e => updateItem(item.product.id, 'importPrice', e.target.value)} style={{ boxSizing: "border-box", width: "120px", padding: "8px", textAlign: "right", border: "1px solid #cbd5e1", borderRadius: "6px", fontFamily: "'Inter', sans-serif" }} />
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: "800" }}>{(item.qty * item.importPrice).toLocaleString()}đ</td>
                    <td style={{ padding: "12px 14px", textAlign: "center" }}><button onClick={() => removeItem(item.product.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "20px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", borderRadius: "0 0 16px 16px" }}>
          <div style={{ width: "400px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span>Tổng Tiền Hàng:</span><span style={{ fontWeight: "800" }}>{totalAmount.toLocaleString()}đ</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span>Đã Trả Cung Cấp:</span>
              <input type="text" placeholder="0" value={paidAmountStr} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); setPaidAmountStr(val ? parseInt(val).toLocaleString() : "") }} style={{ boxSizing: "border-box", width: "150px", padding: "8px 12px", textAlign: "right", border: "2px solid #e2e8f0", borderRadius: "8px", fontWeight: "800", color: "#10b981", fontFamily: "'Inter', sans-serif" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", borderTop: "2px dashed #cbd5e1", paddingTop: "12px" }}>
              <b>CÒN NỢ LẠI:</b><b style={{ color: debtAmount > 0 ? "#ef4444" : "#0f172a" }}>{debtAmount.toLocaleString()}đ</b>
            </div>
            <button disabled={loading} onClick={onSubmit} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "800", cursor: loading ? "not-allowed" : "pointer", marginTop: "20px" }}>
              {loading ? "ĐANG XỬ LÝ..." : "HOÀN TẤT NHẬP HÀNG"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

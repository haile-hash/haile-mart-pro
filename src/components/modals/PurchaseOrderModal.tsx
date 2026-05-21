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
    <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }} onClick={() => setShowModal(false)}>
      <div className="glass" style={{ padding: "20px", width: "900px", maxHeight: "90vh", overflowY: "auto", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "15px", background: "#fff" }} onClick={e => e.stopPropagation()}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" }}>
          <h2 style={{ margin: 0, color: "#1e40af", fontSize: "22px", fontWeight: "900" }}>📦 TẠO PHIẾU NHẬP HÀNG (PO)</h2>
          <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#64748b" }}>✖</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
          <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#334155" }}>1. THÔNG TIN NHÀ CUNG CẤP</h3>
            <select value={selectedSupId} onChange={e => setSelectedSupId(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", marginBottom: "10px", fontWeight: "bold", cursor: "pointer" }}>
              <option value="">-- Chọn Nhà Cung Cấp --</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} - {s.phone} (Đang nợ: {(s.debt || 0).toLocaleString()}đ)</option>)}
            </select>
            <textarea placeholder="Ghi chú phiếu nhập (Không bắt buộc)..." value={note} onChange={e => setNote(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", height: "60px", resize: "none" }} />
          </div>

          <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#334155" }}>2. TÌM & THÊM SẢN PHẨM</h3>
            <input type="text" placeholder="🔍 Nhập Tên hoặc Mã sản phẩm..." value={searchProd} onChange={e => setSearchProd(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", marginBottom: "5px" }} />
            {filteredProducts.length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: "6px", maxHeight: "100px", overflowY: "auto" }}>
                {filteredProducts.map(p => (
                  <div key={p.id} onClick={() => addProductToPO(p)} style={{ padding: "8px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", fontSize: "13px" }} onMouseOver={e => e.currentTarget.style.background = '#e0f2fe'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
                    <b>{p.product_code}</b> - {p.name} (Tồn: {p.stock})
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", minHeight: "200px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead style={{ background: "#1e293b", color: "#fff" }}>
              <tr>
                <th style={{ padding: "10px", textAlign: "left" }}>Sản phẩm</th>
                <th style={{ padding: "10px", textAlign: "center", width: "120px" }}>SL Nhập</th>
                <th style={{ padding: "10px", textAlign: "right", width: "150px" }}>Giá Vốn (Nhập)</th>
                <th style={{ padding: "10px", textAlign: "right", width: "150px" }}>Thành Tiền</th>
                <th style={{ padding: "10px", textAlign: "center", width: "50px" }}>✖</th>
              </tr>
            </thead>
            <tbody>
              {poItems.length === 0 ? <tr><td colSpan={5} style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>Chưa có sản phẩm nào trong phiếu.</td></tr> : poItems.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "10px", fontWeight: "bold" }}>{item.product.name}</td>
                  <td style={{ padding: "10px", textAlign: "center" }}>
                    <input type="number" min="1" value={item.qty || ""} onChange={e => updateItem(item.product.id, 'qty', e.target.value)} style={{ width: "70px", padding: "6px", textAlign: "center", border: "1px solid #cbd5e1", borderRadius: "4px" }} />
                  </td>
                  <td style={{ padding: "10px", textAlign: "right" }}>
                    <input type="text" value={item.importPrice === 0 ? "" : item.importPrice.toLocaleString()} onChange={e => updateItem(item.product.id, 'importPrice', e.target.value)} style={{ width: "100px", padding: "6px", textAlign: "right", border: "1px solid #cbd5e1", borderRadius: "4px" }} />
                  </td>
                  <td style={{ padding: "10px", textAlign: "right", fontWeight: "bold", color: "#b91c1c" }}>{(item.qty * item.importPrice).toLocaleString()}đ</td>
                  <td style={{ padding: "10px", textAlign: "center" }}><button onClick={() => removeItem(item.product.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: "bold" }}>X</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "2px solid #e2e8f0", paddingTop: "15px" }}>
          <div style={{ width: "350px", background: "#f8fafc", padding: "15px", borderRadius: "12px", border: "2px solid #cbd5e1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "15px" }}>
              <b>Tổng Tiền Hàng:</b> <b style={{ color: "#1d4ed8" }}>{totalAmount.toLocaleString()}đ</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", fontSize: "15px" }}>
              <b>Đã Trả NCC:</b>
              <input type="text" placeholder="0" value={paidAmountStr} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); setPaidAmountStr(val ? parseInt(val).toLocaleString() : "") }} style={{ width: "120px", padding: "6px", textAlign: "right", border: "1px solid #cbd5e1", borderRadius: "4px", fontWeight: "bold", color: "#047857" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", borderTop: "1px dashed #cbd5e1", paddingTop: "10px" }}>
              <b>CÒN NỢ LẠI:</b> <b style={{ color: debtAmount > 0 ? "#e11d48" : "#0f172a" }}>{debtAmount.toLocaleString()}đ</b>
            </div>
            
            <button disabled={loading} onClick={onSubmit} style={{ width: "100%", padding: "12px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer", fontSize: "15px", marginTop: "15px", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#1e40af"} onMouseOut={e => e.currentTarget.style.background = "#1d4ed8"}>
              {loading ? "ĐANG XỬ LÝ..." : "💾 HOÀN TẤT NHẬP HÀNG"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

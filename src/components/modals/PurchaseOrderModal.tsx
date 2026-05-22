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
    <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }} onClick={() => setShowModal(false)}>
      <div className="glass" style={{ padding: "0", width: "950px", maxHeight: "90vh", overflow: "hidden", borderRadius: "16px", display: "flex", flexDirection: "column", background: "#ffffff", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }} onClick={e => e.stopPropagation()}>
        
        {/* HEADER MODAL */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #f1f5f9", background: "#ffffff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ background: "#eff6ff", color: "#2563eb", padding: "8px", borderRadius: "10px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
            </div>
            <h2 style={{ margin: 0, color: "#0f172a", fontSize: "20px", fontWeight: "800", letterSpacing: "-0.5px" }}>TẠO PHIẾU NHẬP HÀNG (PO)</h2>
          </div>
          <button onClick={() => setShowModal(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", color: "#64748b", transition: "all 0.2s" }} onMouseOver={e => {e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a"}} onMouseOut={e => {e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b"}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* BODY MODAL */}
        <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px", background: "#fafafa" }}>
          
          {/* Section 1: NCC & Tìm kiếm */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ background: "#1e293b", color: "#fff", width: "20px", height: "20px", display: "flex", justifyContent: "center", alignItems: "center", borderRadius: "50%", fontSize: "11px", fontWeight: "bold" }}>1</span>
                <h3 style={{ margin: 0, fontSize: "14px", color: "#0f172a", fontWeight: "700" }}>Thông tin Nhà cung cấp</h3>
              </div>
              <select value={selectedSupId} onChange={e => setSelectedSupId(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", marginBottom: "12px", fontWeight: "600", color: "#334155", background: "#f8fafc", cursor: "pointer", transition: "border 0.2s" }} onFocus={e => e.currentTarget.style.borderColor = "#3b82f6"} onBlur={e => e.currentTarget.style.borderColor = "#cbd5e1"}>
                <option value="">-- Chọn Nhà Cung Cấp --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} - {s.phone} (Đang nợ: {(s.debt || 0).toLocaleString()}đ)</option>)}
              </select>
              <textarea placeholder="Ghi chú phiếu nhập (Không bắt buộc)..." value={note} onChange={e => setNote(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", height: "70px", resize: "none", color: "#334155", background: "#f8fafc", transition: "border 0.2s" }} onFocus={e => e.currentTarget.style.borderColor = "#3b82f6"} onBlur={e => e.currentTarget.style.borderColor = "#cbd5e1"} />
            </div>

            <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ background: "#1e293b", color: "#fff", width: "20px", height: "20px", display: "flex", justifyContent: "center", alignItems: "center", borderRadius: "50%", fontSize: "11px", fontWeight: "bold" }}>2</span>
                <h3 style={{ margin: 0, fontSize: "14px", color: "#0f172a", fontWeight: "700" }}>Tìm & Thêm sản phẩm</h3>
              </div>
              <div style={{ position: "relative", flex: 1 }}>
                <div style={{ position: "absolute", left: "12px", top: "12px", color: "#94a3b8" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                <input type="text" placeholder="Nhập Tên hoặc Mã sản phẩm..." value={searchProd} onChange={e => setSearchProd(e.target.value)} style={{ width: "100%", padding: "12px 12px 12px 38px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", color: "#334155", fontWeight: "500", transition: "all 0.2s", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)" }} onFocus={e => {e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"}} onBlur={e => {e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.02)"}} />
                
                {filteredProducts.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "8px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", maxHeight: "150px", overflowY: "auto", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 10 }}>
                    {filteredProducts.map(p => (
                      <div key={p.id} onClick={() => addProductToPO(p)} style={{ padding: "10px 15px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
                        <div><span style={{ fontWeight: "700", color: "#0f172a" }}>{p.product_code}</span> <span style={{ color: "#475569" }}>- {p.name}</span></div>
                        <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: "20px", fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Tồn: {p.stock}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Table */}
          <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <tr>
                  <th style={{ padding: "14px", textAlign: "left", color: "#475569", fontWeight: "700", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.5px" }}>Sản phẩm</th>
                  <th style={{ padding: "14px", textAlign: "center", color: "#475569", fontWeight: "700", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.5px", width: "120px" }}>SL Nhập</th>
                  <th style={{ padding: "14px", textAlign: "right", color: "#475569", fontWeight: "700", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.5px", width: "150px" }}>Giá Vốn (Nhập)</th>
                  <th style={{ padding: "14px", textAlign: "right", color: "#475569", fontWeight: "700", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.5px", width: "150px" }}>Thành Tiền</th>
                  <th style={{ padding: "14px", textAlign: "center", color: "#475569", width: "50px" }}></th>
                </tr>
              </thead>
              <tbody>
                {poItems.length === 0 ? <tr><td colSpan={5} style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8", fontStyle: "italic" }}>Chưa có sản phẩm nào trong phiếu nhập. Hãy tìm kiếm ở trên.</td></tr> : poItems.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "12px 14px", fontWeight: "600", color: "#1e293b" }}>{item.product.name}</td>
                    <td style={{ padding: "12px 14px", textAlign: "center" }}>
                      <input type="number" min="1" value={item.qty || ""} onChange={e => updateItem(item.product.id, 'qty', e.target.value)} style={{ width: "70px", padding: "8px", textAlign: "center", border: "1px solid #cbd5e1", borderRadius: "6px", fontWeight: "600", color: "#0f172a", outline: "none", transition: "border 0.2s" }} onFocus={e => e.currentTarget.style.borderColor = "#3b82f6"} onBlur={e => e.currentTarget.style.borderColor = "#cbd5e1"} />
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <input type="text" value={item.importPrice === 0 ? "" : item.importPrice.toLocaleString()} onChange={e => updateItem(item.product.id, 'importPrice', e.target.value)} style={{ width: "110px", padding: "8px", textAlign: "right", border: "1px solid #cbd5e1", borderRadius: "6px", fontWeight: "600", color: "#0f172a", outline: "none", transition: "border 0.2s" }} onFocus={e => e.currentTarget.style.borderColor = "#3b82f6"} onBlur={e => e.currentTarget.style.borderColor = "#cbd5e1"} />
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: "800", color: "#0f172a" }}>{(item.qty * item.importPrice).toLocaleString()}đ</td>
                    <td style={{ padding: "12px 14px", textAlign: "center" }}>
                      <button onClick={() => removeItem(item.product.id)} style={{ background: "#fee2e2", border: "none", width: "28px", height: "28px", borderRadius: "6px", color: "#ef4444", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", transition: "all 0.2s" }} onMouseOver={e => {e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "#fff"}} onMouseOut={e => {e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#ef4444"}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* FOOTER MODAL (Thanh toán) */}
        <div style={{ background: "#ffffff", padding: "20px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: "400px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px", color: "#475569" }}>
              <span style={{ fontWeight: "600" }}>Tổng Tiền Hàng:</span> 
              <span style={{ fontWeight: "800", color: "#0f172a", fontSize: "16px" }}>{totalAmount.toLocaleString()}đ</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", fontSize: "14px", color: "#475569" }}>
              <span style={{ fontWeight: "600" }}>Đã Trả Cung Cấp:</span>
              <input type="text" placeholder="0" value={paidAmountStr} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); setPaidAmountStr(val ? parseInt(val).toLocaleString() : "") }} style={{ width: "140px", padding: "8px 12px", textAlign: "right", border: "2px solid #e2e8f0", borderRadius: "8px", fontWeight: "800", color: "#10b981", fontSize: "15px", outline: "none", transition: "border 0.2s" }} onFocus={e => e.currentTarget.style.borderColor = "#10b981"} onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", borderTop: "2px dashed #cbd5e1", paddingTop: "12px" }}>
              <span style={{ fontWeight: "800", color: "#0f172a" }}>CÒN NỢ LẠI:</span> 
              <span style={{ fontWeight: "900", color: debtAmount > 0 ? "#ef4444" : "#0f172a", fontSize: "18px" }}>{debtAmount.toLocaleString()}đ</span>
            </div>
            
            <button disabled={loading} onClick={onSubmit} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "800", cursor: loading ? "not-allowed" : "pointer", fontSize: "15px", marginTop: "20px", transition: "all 0.2s", boxShadow: "0 4px 12px rgba(37,99,235,0.3)", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
              {loading ? "ĐANG XỬ LÝ..." : <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> HOÀN TẤT NHẬP HÀNG</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

/* eslint-disable */
// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Product } from '../../types';
import { exportPOToExcel } from '../../utils/exportExcel';

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

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({ 
  showModal, 
  setShowModal, 
  suppliers = [], 
  products = [], 
  handleSavePO, 
  loading 
}) => {
  const [selectedSupId, setSelectedSupId] = useState("");
  const [poItems, setPoItems] = useState<POItem[]>([]);
  const [searchProd, setSearchProd] = useState("");
  const [paidAmountStr, setPaidAmountStr] = useState("");
  const [note, setNote] = useState("");

  const totalAmount = useMemo(() => {
    return (poItems || []).reduce((sum, item) => sum + ((item?.qty || 0) * (item?.importPrice || 0)), 0);
  }, [poItems]);

  const paidAmount = useMemo(() => {
    const cleanStr = String(paidAmountStr || "").replace(/[,.]/g, '');
    return parseInt(cleanStr) || 0;
  }, [paidAmountStr]);

  const debtAmount = totalAmount - paidAmount;

  const filteredProducts = useMemo(() => {
    if (!searchProd || !searchProd.trim()) return [];
    const term = searchProd.toLowerCase().trim();
    return (products || [])
      .filter(p => 
        String(p?.name || "").toLowerCase().includes(term) || 
        String(p?.product_code || "").toLowerCase().includes(term)
      )
      .slice(0, 10);
  }, [searchProd, products]);

  const addProductToPO = (p: Product) => {
    if (!p) return;
    if ((poItems || []).find(item => item?.product?.id === p.id)) {
      toast.error("Sản phẩm đã có trong phiếu!"); 
      return;
    }
    setPoItems([...poItems, { product: p, qty: 1, importPrice: p.import_price || 0 }]);
    setSearchProd("");
  };

  const updateItem = (id: any, field: 'qty' | 'importPrice', val: string) => {
    const cleanStr = String(val || "").replace(/[,.]/g, '');
    const num = parseInt(cleanStr) || 0;
    setPoItems((poItems || []).map(item => item?.product?.id === id ? { ...item, [field]: num } : item));
  };

  const removeItem = (id: any) => setPoItems((poItems || []).filter(i => i?.product?.id !== id));

  const onSubmit = () => {
    if (!selectedSupId) return toast.error("Vui lòng chọn Nhà cung cấp!");
    if (!poItems || poItems.length === 0) return toast.error("Phiếu nhập chưa có sản phẩm nào!");
    const supplier = (suppliers || []).find(s => String(s?.id) === selectedSupId);
    if (!supplier) return;
    handleSavePO(supplier, poItems, totalAmount, paidAmount, note).then(() => {
      setSelectedSupId(""); setPoItems([]); setPaidAmountStr(""); setNote("");
    });
  };

  const handleExportDraft = async () => {
    if (!poItems || poItems.length === 0) return toast.error("Vui lòng thêm ít nhất 1 sản phẩm để xuất Excel!");
    const supplier = (suppliers || []).find(s => String(s?.id) === selectedSupId) || null;
    const storeInfo = typeof window !== 'undefined' ? JSON.parse(window.localStorage.getItem("mart_current_store") || "{}") : {};

    const draftPO = {
      id: `PO_DRAFT_${Math.floor(Date.now() / 1000)}`,
      orderDate: new Date().toISOString(),
      note: note,
      items: poItems,
      paidAmount: paidAmount // Bắt buộc truyền vào để Excel in ra
    };

    try {
      await exportPOToExcel(draftPO, supplier, storeInfo);
      toast.success("Đã xuất file Excel thành công!");
    } catch (error) {
      toast.error("Lỗi khi xuất file Excel!");
      console.error(error);
    }
  };

  if (!showModal) return null;

  return (
    <div 
      className="no-print" 
      style={{ 
        position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", 
        backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", 
        alignItems: "center", zIndex: 9999, fontFamily: "'Inter', sans-serif" 
      }} 
      onClick={() => setShowModal(false)}
    >
      <div 
        className="glass" 
        style={{ 
          padding: "0", width: "1000px", maxWidth: "95vw", maxHeight: "90vh", 
          borderRadius: "16px", display: "flex", flexDirection: "column", 
          background: "#ffffff", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" 
        }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #f1f5f9", background: "#ffffff", borderRadius: "16px 16px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ background: "#eff6ff", color: "#2563eb", padding: "8px", borderRadius: "10px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="21 8 21 21 3 21 3 8"></polyline>
                <rect x="1" y="3" width="22" height="5"></rect>
                <line x1="10" y1="12" x2="14" y2="12"></line>
              </svg>
            </div>
            <h2 style={{ margin: 0, color: "#0f172a", fontSize: "20px", fontWeight: "800" }}>TẠO PHIẾU NHẬP HÀNG (PO)</h2>
          </div>
          <button onClick={() => setShowModal(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", color: "#64748b" }}>&times;</button>
        </div>

        <div style={{ padding: "24px", overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column", gap: "20px", background: "#fafafa" }}>
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "20px", width: "100%" }}>
            
            {/* Cột trái: Thông tin Nhà Cung Cấp & Tìm kiếm */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <span style={{ background: "#1e293b", color: "#fff", width: "22px", height: "22px", display: "flex", justifyContent: "center", alignItems: "center", borderRadius: "50%", fontSize: "12px", fontWeight: "bold" }}>1</span>
                  <h3 style={{ margin: 0, fontSize: "14px", color: "#0f172a", fontWeight: "700" }}>Nhà cung cấp</h3>
                </div>
                <select value={selectedSupId} onChange={e => setSelectedSupId(e.target.value)} style={{ boxSizing: "border-box", width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontWeight: "600", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
                  <option value="">-- Chọn Nhà Cung Cấp --</option>
                  {(suppliers || []).map(s => <option key={s.id} value={s.id}>{s.name} - {s.phone}</option>)}
                </select>
              </div>

              <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <span style={{ background: "#1e293b", color: "#fff", width: "22px", height: "22px", display: "flex", justifyContent: "center", alignItems: "center", borderRadius: "50%", fontSize: "12px", fontWeight: "bold" }}>2</span>
                  <h3 style={{ margin: 0, fontSize: "14px", color: "#0f172a", fontWeight: "700" }}>Tìm Sản phẩm</h3>
                </div>
                <div style={{ position: "relative" }}>
                  <input type="text" placeholder="Nhập tên hoặc mã..." value={searchProd} onChange={e => setSearchProd(e.target.value)} style={{ boxSizing: "border-box", width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "'Inter', sans-serif" }} />
                  {filteredProducts.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "8px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", maxHeight: "200px", overflowY: "auto", zIndex: 10, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
                      {filteredProducts.map(p => (
                        <div key={p.id} onClick={() => addProductToPO(p)} style={{ padding: "12px 15px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div><b style={{ color: "#2563eb" }}>{p.product_code}</b><br/>{p.name}</div>
                          <span style={{ color: "#64748b", fontSize: "11px", fontWeight: "bold", background: "#f1f5f9", padding: "4px 8px", borderRadius: "6px" }}>Tồn: {p.stock}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#0f172a", fontWeight: "700" }}>Ghi chú (Tùy chọn)</h3>
                <textarea placeholder="Ghi chú nội bộ..." value={note} onChange={e => setNote(e.target.value)} style={{ boxSizing: "border-box", width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", height: "80px", resize: "none", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }} />
              </div>
            </div>

            {/* Cột phải: Bảng sản phẩm */}
            <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflowX: "auto", height: "fit-content" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "600px" }}>
                <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <tr>
                    <th style={{ padding: "14px", textAlign: "left", color: "#475569", fontWeight: "700", fontSize: "12px", textTransform: "uppercase" }}>Sản phẩm</th>
                    <th style={{ padding: "14px", textAlign: "center", width: "100px", color: "#475569", fontWeight: "700", fontSize: "12px", textTransform: "uppercase" }}>Số Lượng</th>
                    <th style={{ padding: "14px", textAlign: "right", width: "140px", color: "#475569", fontWeight: "700", fontSize: "12px", textTransform: "uppercase" }}>Giá Nhập (đ)</th>
                    <th style={{ padding: "14px", textAlign: "right", width: "140px", color: "#475569", fontWeight: "700", fontSize: "12px", textTransform: "uppercase" }}>Thành Tiền</th>
                    <th style={{ padding: "14px", width: "40px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {poItems.length === 0 ? <tr><td colSpan={5} style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8", fontStyle: "italic" }}>Chưa có sản phẩm nào. Vui lòng tìm và thêm sản phẩm.</td></tr> : poItems.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>{item?.product?.name || "Sản phẩm không rõ"}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>Mã: {item?.product?.product_code}</div>
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        <input type="number" min="1" value={item.qty || ""} onChange={e => updateItem(item.product.id, 'qty', e.target.value)} style={{ boxSizing: "border-box", width: "70px", padding: "8px", textAlign: "center", border: "1px solid #cbd5e1", borderRadius: "6px", fontFamily: "'Inter', sans-serif" }} />
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        <input type="text" value={item.importPrice === 0 ? "" : item.importPrice.toLocaleString()} onChange={e => updateItem(item.product.id, 'importPrice', e.target.value)} style={{ boxSizing: "border-box", width: "110px", padding: "8px", textAlign: "right", border: "1px solid #cbd5e1", borderRadius: "6px", fontFamily: "'Inter', sans-serif", fontWeight: "600" }} />
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: "800", color: "#2563eb" }}>{((item?.qty || 0) * (item?.importPrice || 0)).toLocaleString()}đ</td>
                      <td style={{ padding: "12px 14px", textAlign: "center" }}><button onClick={() => removeItem(item.product.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "16px" }}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CỤM THANH TOÁN (UI MỚI ĐÃ SỬA CHUẨN) */}
        <div style={{ background: "#ffffff", padding: "20px 24px", borderTop: "1px solid #e2e8f0", borderRadius: "0 0 16px 16px" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            
            {/* CỤM BÊN TRÁI: TỰ ĐỘNG TÍNH TOÁN */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>TỔNG ĐƠN HÀNG</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>{totalAmount.toLocaleString()}đ</div>
              </div>

              <div style={{ fontSize: '20px', color: '#cbd5e1', fontWeight: '900', marginTop: '12px' }}>-</div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>ĐÃ TRẢ TRƯỚC</div>
                <input 
                  type="text" 
                  value={paidAmountStr} 
                  onChange={e => { 
                    const val = e.target.value.replace(/[^0-9]/g, ''); 
                    setPaidAmountStr(val ? parseInt(val).toLocaleString() : "") 
                  }} 
                  placeholder="0"
                  style={{ width: '120px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #3b82f6', fontWeight: '800', fontSize: '16px', color: '#2563eb', outline: 'none', fontFamily: "'Inter', sans-serif" }}
                />
              </div>

              <div style={{ fontSize: '20px', color: '#cbd5e1', fontWeight: '900', marginTop: '12px' }}>=</div>

              <div style={{ background: '#fef2f2', padding: '8px 16px', borderRadius: '8px', border: '1px dashed #fca5a5' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#ef4444', textTransform: 'uppercase', marginBottom: '2px' }}>CẦN THANH TOÁN</div>
                <div style={{ fontSize: '22px', fontWeight: '900', color: debtAmount > 0 ? '#ef4444' : '#10b981' }}>
                  {debtAmount.toLocaleString()}đ
                </div>
              </div>
            </div>

            {/* CỤM BÊN PHẢI: NÚT BẤM */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button type="button" onClick={() => window.print()} style={{ padding: "12px 16px", background: "#fff", color: "#ef4444", border: "1px solid #fecaca", borderRadius: "10px", fontWeight: "700", cursor: "pointer", display: 'flex', alignItems: 'center', gap: '6px', transition: "0.2s" }} onMouseOver={e=>e.currentTarget.style.background='#fef2f2'} onMouseOut={e=>e.currentTarget.style.background='#fff'}>🖨️ PDF</button>
              
              <button type="button" onClick={handleExportDraft} style={{ padding: "12px 16px", background: "#fff", color: "#10b981", border: "1px solid #a7f3d0", borderRadius: "10px", fontWeight: "700", cursor: "pointer", display: 'flex', alignItems: 'center', gap: '6px', transition: "0.2s" }} onMouseOver={e=>e.currentTarget.style.background='#ecfdf5'} onMouseOut={e=>e.currentTarget.style.background='#fff'}>📥 Excel</button>
              
              <button disabled={loading} onClick={onSubmit} style={{ padding: "12px 32px", background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "800", cursor: loading ? "not-allowed" : "pointer", display: 'flex', alignItems: 'center', gap: '6px', boxShadow: "0 4px 6px -1px rgba(37,99,235,0.3)" }}>
                {loading ? "ĐANG LƯU..." : "💾 LƯU PHIẾU"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

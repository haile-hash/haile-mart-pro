/* eslint-disable */
import React from 'react';
import { Product } from '../../types';
import { cleanName } from '../../utils/helpers';
import { toast } from 'react-hot-toast';

interface POModalProps {
  showPOModal: boolean;
  setShowPOModal: (v: boolean) => void;
  poTab: 'NEW' | 'RECEIVE';
  setPoTab: (v: 'NEW' | 'RECEIVE') => void;
  suppliers: any[];
  selectedSupplierId: string;
  setSelectedSupplierId: (id: string) => void;
  products: Product[];
  poSearch: string;
  setPoSearch: (v: string) => void;
  poItems: any[];
  setPoItems: (items: any[]) => void;
  poNote: string;
  setPoNote: (v: string) => void;
  paidAmount: number;
  setPaidAmount: (v: number) => void;
  searchPoCode: string;
  setSearchPoCode: (v: string) => void;
  foundPO: any;
  setFoundPO: (po: any) => void;
  receiveItems: any[];
  setReceiveItems: (items: any[]) => void;
  allPOs: any[];
  loading: boolean;
  onSaveNewPO: () => void;
  onConfirmReceipt: (po: any, items: any[]) => void;
  onPrintPO?: (po: any) => void; // Prop để gọi lệnh in phiếu Nhập/Lỗi từ App.tsx
}

export const POModal: React.FC<POModalProps> = ({
  showPOModal, setShowPOModal, poTab, setPoTab, suppliers, selectedSupplierId, setSelectedSupplierId, products, poSearch, setPoSearch, poItems, setPoItems, poNote, setPoNote, paidAmount, setPaidAmount, searchPoCode, setSearchPoCode, foundPO, setFoundPO, receiveItems, setReceiveItems, allPOs, loading, onSaveNewPO, onConfirmReceipt, onPrintPO
}) => {
  if (!showPOModal) return null;

  // Xử lý tìm kiếm sản phẩm đưa vào PO
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(poSearch.toLowerCase()) || (p.product_code && p.product_code.toLowerCase().includes(poSearch.toLowerCase()))).slice(0, 10);
  
  const handleAddProductToPO = (p: Product) => {
    if (poItems.find(i => i.product_code === p.product_code || i.id === p.id)) return toast.error("Sản phẩm đã có trong phiếu!");
    setPoItems([...poItems, { ...p, qty: 1, importPrice: p.import_price || 0 }]);
    setPoSearch("");
  };

  // Cập nhật số lượng Thực Nhận
  const handleReceiveQtyChange = (idx: number, val: string) => {
    const newVal = val === "" ? 0 : Number(val);
    const newItems = [...receiveItems];
    newItems[idx].receiveQty = newVal;
    // Tự động điều chỉnh hàng lỗi nếu nhập số Lỗi lớn hơn số Thực nhận
    if ((newItems[idx].faultyQty || 0) > newVal) newItems[idx].faultyQty = newVal;
    setReceiveItems(newItems);
  };

  // Cập nhật số lượng Hàng Lỗi/Trả lại
  const handleFaultyQtyChange = (idx: number, val: string) => {
    const newVal = val === "" ? 0 : Number(val);
    const newItems = [...receiveItems];
    const currentReceive = newItems[idx].receiveQty !== undefined ? newItems[idx].receiveQty : Number(newItems[idx].qty);
    // Không cho phép số lượng Lỗi vượt quá số lượng Thực nhận
    newItems[idx].faultyQty = Math.min(newVal, currentReceive);
    setReceiveItems(newItems);
  };

  // TÌM PO ĐỂ NHẬP KHO
  const handleSearchPO = () => {
    if (!searchPoCode.trim()) return toast.error("Nhập mã PO cần tìm!");
    const po = allPOs.find(p => p.po_code?.toLowerCase() === searchPoCode.trim().toLowerCase() || String(p.id) === searchPoCode.trim());
    if (po) {
      setFoundPO(po);
      // Áp dụng dữ liệu mặc định: Thực nhận = Số lượng đặt
      setReceiveItems(po.items.map((i: any) => ({ ...i, receiveQty: i.qty, faultyQty: 0 })));
    } else {
      toast.error("Không tìm thấy Phiếu Đặt Hàng!");
      setFoundPO(null);
    }
  };

  // --- TÍNH TOÁN CÁC CON SỐ (THỰC NHẬN - LỖI) ---
  const totalOriginal = receiveItems.reduce((sum, item) => sum + (Number(item.qty) * Number(item.importPrice)), 0);
  const totalFaultyDeduction = receiveItems.reduce((sum, item) => sum + (Number(item.faultyQty || 0) * Number(item.importPrice)), 0);
  const totalToPay = receiveItems.reduce((sum, item) => {
    const r = item.receiveQty !== undefined ? Number(item.receiveQty) : Number(item.qty);
    const f = Number(item.faultyQty) || 0;
    return sum + (Math.max(0, r - f) * Number(item.importPrice));
  }, 0);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: 'white', width: '900px', maxWidth: '95%', maxHeight: '90vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>Quản Lý Phiếu Đặt Hàng (PO) & Nhập Kho</h2>
          <button onClick={() => setShowPOModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
          <button onClick={() => setPoTab('NEW')} style={{ flex: 1, padding: '15px', border: 'none', background: poTab === 'NEW' ? 'white' : '#f1f5f9', fontWeight: 'bold', color: poTab === 'NEW' ? '#2563eb' : '#64748b', borderBottom: poTab === 'NEW' ? '3px solid #2563eb' : '3px solid transparent', cursor: 'pointer' }}>TẠO PHIẾU ĐẶT HÀNG (PO)</button>
          <button onClick={() => setPoTab('RECEIVE')} style={{ flex: 1, padding: '15px', border: 'none', background: poTab === 'RECEIVE' ? 'white' : '#f1f5f9', fontWeight: 'bold', color: poTab === 'RECEIVE' ? '#10b981' : '#64748b', borderBottom: poTab === 'RECEIVE' ? '3px solid #10b981' : '3px solid transparent', cursor: 'pointer' }}>NHẬP KHO & KIỂM HÀNG LỖI</button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {poTab === 'NEW' && (
            <div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <select value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="">-- Chọn Nhà Cung Cấp --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>)}
                </select>
              </div>
              <div style={{ position: 'relative', marginBottom: '15px' }}>
                <input type="text" placeholder="Tìm kiếm sản phẩm để thêm vào PO..." value={poSearch} onChange={e => setPoSearch(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                {poSearch && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    {filteredProducts.map(p => (
                      <div key={p.id} onClick={() => handleAddProductToPO(p)} style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                        <strong>{cleanName(p.name)}</strong> - Tồn: {p.stock}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {poItems.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr><th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Sản phẩm</th><th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #cbd5e1' }}>SL Đặt</th><th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #cbd5e1' }}>Giá Nhập (Dự kiến)</th><th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #cbd5e1' }}>Thành Tiền</th><th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #cbd5e1' }}></th></tr>
                  </thead>
                  <tbody>
                    {poItems.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{cleanName(item.name)}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                          <input type="number" min="1" value={item.qty} onChange={e => { const newItems = [...poItems]; newItems[idx].qty = Number(e.target.value); setPoItems(newItems); }} style={{ width: '60px', padding: '4px', textAlign: 'center' }} />
                        </td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>
                          <input type="number" min="0" value={item.importPrice} onChange={e => { const newItems = [...poItems]; newItems[idx].importPrice = Number(e.target.value); setPoItems(newItems); }} style={{ width: '100px', padding: '4px', textAlign: 'right' }} />
                        </td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 'bold' }}>{(item.qty * item.importPrice).toLocaleString()}đ</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                          <button onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Xóa</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <textarea placeholder="Ghi chú đơn đặt hàng..." value={poNote} onChange={e => setPoNote(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', height: '60px', marginBottom: '15px', boxSizing: 'border-box' }}></textarea>
              <button onClick={onSaveNewPO} disabled={loading} style={{ width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>{loading ? "ĐANG LƯU..." : "TẠO PHIẾU ĐẶT HÀNG (PO)"}</button>
            </div>
          )}

          {poTab === 'RECEIVE' && (
            <div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input type="text" placeholder="Nhập mã PO (VD: PO123456)..." value={searchPoCode} onChange={e => setSearchPoCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchPO()} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                <button onClick={handleSearchPO} style={{ padding: '10px 20px', background: '#64748b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Tìm Phiếu</button>
              </div>

              {foundPO && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                    <div>
                      <p style={{ margin: '0 0 5px 0' }}>Mã PO: <strong>{foundPO.po_code}</strong></p>
                      <p style={{ margin: 0 }}>Nhà Cung Cấp: <strong>{foundPO.supplier?.name}</strong></p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 5px 0' }}>Trạng thái: <strong style={{ color: foundPO.status === 'COMPLETED' ? '#10b981' : '#f59e0b' }}>{foundPO.status}</strong></p>
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                        <tr>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Sản phẩm</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>SL Đặt</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Thực Nhận</th>
                          <th style={{ padding: '10px', textAlign: 'center', color: '#ef4444' }}>Lỗi/Trả Lại</th>
                          <th style={{ padding: '10px', textAlign: 'center', color: '#1e3a8a' }}>Vào Kho</th>
                          <th style={{ padding: '10px', textAlign: 'right' }}>Đơn giá</th>
                          <th style={{ padding: '10px', textAlign: 'right' }}>Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receiveItems.map((item, idx) => {
                          const orderQty = Number(item.qty) || 0;
                          const rQty = item.receiveQty !== undefined ? Number(item.receiveQty) : orderQty;
                          const fQty = Number(item.faultyQty) || 0;
                          const actual = Math.max(0, rQty - fQty);
                          const lineTotal = actual * (Number(item.importPrice) || 0);

                          return (
                            <tr key={idx} style={{ backgroundColor: fQty > 0 ? '#fef2f2' : 'transparent', borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px' }}>{cleanName(item.name)}</td>
                              <td style={{ padding: '10px', textAlign: 'center' }}>{orderQty}</td>
                              <td style={{ padding: '10px', textAlign: 'center' }}>
                                <input type="number" min="0" value={rQty} onChange={(e) => handleReceiveQtyChange(idx, e.target.value)} disabled={foundPO.status === 'COMPLETED'} style={{ width: '60px', padding: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                              </td>
                              <td style={{ padding: '10px', textAlign: 'center' }}>
                                <input type="number" min="0" max={rQty} value={fQty === 0 ? '' : fQty} placeholder="0" onChange={(e) => handleFaultyQtyChange(idx, e.target.value)} disabled={foundPO.status === 'COMPLETED'} style={{ width: '60px', padding: '4px', textAlign: 'center', borderRadius: '4px', border: fQty > 0 ? '1px solid #ef4444' : '1px solid #cbd5e1', color: '#ef4444', fontWeight: fQty > 0 ? 'bold' : 'normal', outline: 'none' }} />
                              </td>
                              <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#1e3a8a' }}>{actual}</td>
                              <td style={{ padding: '10px', textAlign: 'right' }}>{(Number(item.importPrice) || 0).toLocaleString()}đ</td>
                              <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>{lineTotal.toLocaleString()}đ</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#64748b' }}>
                      <span>Tổng tiền hàng (Theo SL Đặt):</span>
                      <span>{totalOriginal.toLocaleString()}đ</span>
                    </div>
                    {totalFaultyDeduction > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#ef4444', fontWeight: 'bold' }}>
                        <span>[-] Khấu trừ tiền Hàng Lỗi/Trả lại NCC:</span>
                        <span>-{totalFaultyDeduction.toLocaleString()}đ</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '2px solid #1e3a8a', fontSize: '18px', fontWeight: 'bold', color: '#1e3a8a' }}>
                      <span>TỔNG CẦN THANH TOÁN CHO NCC:</span>
                      <span>{totalToPay.toLocaleString()}đ</span>
                    </div>
                  </div>

                  {foundPO.status === 'PENDING' ? (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                      <button 
                        onClick={() => {
                          onConfirmReceipt(foundPO, receiveItems);
                          if (onPrintPO) {
                            // Gọi lệnh in ngay sau khi xác nhận nhập kho
                            const finalPO = { ...foundPO, items: receiveItems };
                            setTimeout(() => onPrintPO(finalPO), 1000); 
                          }
                        }} 
                        disabled={loading} 
                        style={{ flex: 1, background: '#10b981', color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
                      >
                        {loading ? "ĐANG XỬ LÝ..." : "✅ XÁC NHẬN NHẬP KHO, XUẤT EXCEL & IN PHIẾU"}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                      <button 
                        onClick={() => onPrintPO && onPrintPO(foundPO)} 
                        style={{ flex: 1, background: '#3b82f6', color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
                      >
                        🖨️ IN LẠI PHIẾU NHẬP KHO (KÈM DS HÀNG LỖI)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* eslint-disable */
import React, { useState } from 'react';
import { Product } from '../../types';
import { cleanName } from '../../utils/helpers';
import { toast } from 'react-hot-toast';

interface POModalProps {
  showPOModal: boolean;
  setShowPOModal: (v: boolean) => void;
  poTab?: any; 
  setPoTab?: any;
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
  paidAmount?: number;
  setPaidAmount?: (v: number) => void;
  allPOs: any[];
  loading: boolean;
  onSaveNewPO: () => void;
  onConfirmReceipt: (po: any, items: any[]) => void;
  onPrintPO?: (po: any) => void;
}

export const POModal: React.FC<POModalProps> = ({
  showPOModal, setShowPOModal, suppliers, selectedSupplierId, setSelectedSupplierId, products, poSearch, setPoSearch, poItems, setPoItems, poNote, setPoNote, paidAmount, setPaidAmount, allPOs, loading, onSaveNewPO, onConfirmReceipt, onPrintPO
}) => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'LIST' | 'HISTORY'>('NEW');
  const [receivingPO, setReceivingPO] = useState<any | null>(null);
  const [receiveItems, setReceiveItems] = useState<any[]>([]);

  if (!showPOModal) return null;

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(poSearch.toLowerCase()) || (p.product_code && p.product_code.toLowerCase().includes(poSearch.toLowerCase()))).slice(0, 10);
  
  const handleAddProductToPO = (p: Product) => {
    if (poItems.find(i => i.product_code === p.product_code || i.id === p.id)) return toast.error("Sản phẩm đã có trong phiếu!");
    setPoItems([...poItems, { ...p, qty: 1, importPrice: p.import_price || 0 }]);
    setPoSearch("");
  };

  const handleCreatePOClick = () => {
    if (!selectedSupplierId) return toast.error("Vui lòng chọn Nhà Cung Cấp!");
    if (poItems.length === 0) return toast.error("Phiếu đặt hàng trống!");
    onSaveNewPO();
    setActiveTab('LIST');
  };

  // --- HÀM TẠO FILE PDF ĐƠN ĐẶT HÀNG (PO) ---
  const handlePrintOrder = (po: any) => {
    const storeInfo = JSON.parse(window.localStorage.getItem("mart_current_store") || "{}");
    const dateStr = new Date(po.created_at || Date.now()).toLocaleDateString('vi-VN');
    let itemsHtml = ""; 
    
    (po.items || []).forEach((item: any, index: number) => {
      const qty = Number(item.qty) || 0; 
      const price = Number(item.importPrice) || 0; 
      const rowTotal = qty * price;
      // Đã sửa lại để kéo đúng mã sản phẩm ra PDF
      const pCode = item.product_code || item.product?.product_code || "";
      const pName = cleanName(item.name || item.product?.name || "SP");

      itemsHtml += `<tr><td style="padding: 10px 8px; border: 1px solid #cbd5e1; text-align: center;">${index + 1}</td><td style="padding: 10px 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${pCode}</td><td style="padding: 10px 8px; border: 1px solid #cbd5e1;">${pName}</td><td style="padding: 10px 8px; border: 1px solid #cbd5e1; text-align: center;">${qty}</td><td style="padding: 10px 8px; border: 1px solid #cbd5e1; text-align: right;">${price.toLocaleString('vi-VN')} đ</td><td style="padding: 10px 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold;">${rowTotal.toLocaleString('vi-VN')} đ</td></tr>`;
    });

    const printTotal = po.total_amount || 0;
    const printPaid = po.paid_amount || 0;
    const printDebt = printTotal - printPaid;

    const htmlContent = `<html><head><title>ĐƠN ĐẶT HÀNG_${po.po_code}</title><style>@page { size: A4; margin: 15mm; } body { font-family: 'Times New Roman', Times, serif; font-size: 14px; line-height: 1.5; color: #000; margin: 0; } .header { text-align: center; margin-bottom: 30px; } .title { font-size: 24px; font-weight: bold; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px; } .flex-container { display: flex; justify-content: space-between; margin-bottom: 25px; } .box { width: 48%; padding: 15px; border: 1px solid #000; border-radius: 8px; } .box-title { font-weight: bold; text-decoration: underline; margin-bottom: 8px; font-size: 15px; text-transform: uppercase; } table { width: 100%; border-collapse: collapse; margin-bottom: 25px; } th { padding: 12px 8px; border: 1px solid #cbd5e1; background-color: #f1f5f9; font-weight: bold; text-transform: uppercase; font-size: 13px; } .total-section { width: 300px; margin-left: auto; text-align: right; font-size: 15px; margin-bottom: 40px; } .total-line { display: flex; justify-content: space-between; margin-bottom: 6px; } .signature-section { display: flex; justify-content: space-between; padding: 0 40px; text-align: center; } .sig-title { font-weight: bold; font-size: 15px; margin-bottom: 5px; } .sig-sub { font-style: italic; font-size: 13px; color: #475569; }</style></head><body><div class="header"><h1 class="title">ĐƠN ĐẶT HÀNG (PURCHASE ORDER)</h1><div>Tham chiếu gốc (Mã PO): <strong>${po.po_code}</strong> &nbsp;|&nbsp; Ngày lập: ${dateStr}</div></div><div class="flex-container"><div class="box"><div class="box-title">Thông tin Bên Mua (Cửa Hàng)</div><table style="width: 100%; border: none; margin: 0; font-size: 14px;"><tr><td style="width: 90px; border: none; padding: 3px 0;"><strong>Tên ĐV:</strong></td><td style="border: none; padding: 3px 0;">${storeInfo.store_name || "HỆ THỐNG POS PRO"}</td></tr><tr><td style="border: none; padding: 3px 0;"><strong>Địa chỉ:</strong></td><td style="border: none; padding: 3px 0;">${storeInfo.address || "Chưa cập nhật"}</td></tr><tr><td style="border: none; padding: 3px 0;"><strong>Điện thoại:</strong></td><td style="border: none; padding: 3px 0;">${storeInfo.phone || "Chưa cập nhật"}</td></tr><tr><td style="border: none; padding: 3px 0;"><strong>MST:</strong></td><td style="border: none; padding: 3px 0;">${storeInfo.tax_code || "Chưa cập nhật"}</td></tr></table></div><div class="box"><div class="box-title">Thông tin Bên Bán (Nhà CC)</div><table style="width: 100%; border: none; margin: 0; font-size: 14px;"><tr><td style="width: 90px; border: none; padding: 3px 0;"><strong>Nhà CC:</strong></td><td style="border: none; padding: 3px 0;">${po.supplier?.name || "Chưa rõ"}</td></tr><tr><td style="border: none; padding: 3px 0;"><strong>Địa chỉ:</strong></td><td style="border: none; padding: 3px 0;">${po.supplier?.address || "Chưa cập nhật"}</td></tr><tr><td style="border: none; padding: 3px 0;"><strong>Điện thoại:</strong></td><td style="border: none; padding: 3px 0;">${po.supplier?.phone || "Chưa cập nhật"}</td></tr><tr><td style="border: none; padding: 3px 0;"><strong>STK/MST:</strong></td><td style="border: none; padding: 3px 0;">${po.supplier?.taxCode || po.supplier?.bankAccount || "Chưa cập nhật"}</td></tr></table></div></div><div style="margin-bottom: 15px; padding-left: 5px;"><strong>Ghi chú:</strong> ${po.note || "Không có"}</div><table><thead><tr><th style="width: 5%;">STT</th><th style="width: 15%;">Mã SP</th><th style="width: 35%; text-align: left;">Tên Sản Phẩm</th><th style="width: 10%;">SL</th><th style="width: 15%; text-align: right;">Đơn Giá</th><th style="width: 20%; text-align: right;">Thành Tiền</th></tr></thead><tbody>${itemsHtml}</tbody></table><div class="total-section"><div class="total-line"><strong>TỔNG ĐƠN HÀNG:</strong> <span><strong>${printTotal.toLocaleString('vi-VN')} đ</strong></span></div><div class="total-line" style="font-style: italic; color: #059669;"><span>Đã trả trước:</span> <span>${printPaid.toLocaleString('vi-VN')} đ</span></div><div class="total-line" style="border-top: 1px solid #000; padding-top: 5px; color: #dc2626;"><strong>CÒN NỢ LẠI:</strong> <span><strong>${printDebt.toLocaleString('vi-VN')} đ</strong></span></div></div><div class="signature-section"><div><div class="sig-title">ĐẠI DIỆN CỬA HÀNG</div><div class="sig-sub">(Ký, ghi rõ họ tên)</div></div><div><div class="sig-title">ĐẠI DIỆN NHÀ CUNG CẤP</div><div class="sig-sub">(Ký, ghi rõ họ tên)</div></div></div><script>window.onload = function() { setTimeout(function() { window.print(); window.onafterprint = function() { window.close(); } }, 500); }</script></body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) { printWindow.document.open(); printWindow.document.write(htmlContent); printWindow.document.close(); } 
    else { alert("Trình duyệt đã chặn popup. Vui lòng cho phép popup để xuất PDF."); }
  };

  const handlePrintDraft = () => {
    if (poItems.length === 0) return toast.error("Phiếu đặt hàng trống!");
    const supplier = suppliers.find(s => String(s.id) === String(selectedSupplierId)) || {};
    const totalAmtTab1 = poItems.reduce((sum, item) => sum + (item.qty || 0) * (item.importPrice || 0), 0);
    const draftPO = {
      po_code: `DRAFT_${Date.now().toString().slice(-6)}`,
      created_at: new Date().toISOString(),
      supplier: supplier,
      items: poItems,
      note: poNote,
      total_amount: totalAmtTab1,
      paid_amount: paidAmount || 0
    };
    handlePrintOrder(draftPO);
  };

  const openReceiveScreen = (po: any) => {
    setReceivingPO(po);
    setReceiveItems(po.items.map((i: any) => ({ ...i, receiveQty: i.qty, faultyQty: 0 })));
  };

  const handleFaultyQtyChange = (idx: number, val: string) => {
    const newVal = val === "" ? 0 : Number(val);
    const newItems = [...receiveItems];
    const orderQty = Number(newItems[idx].qty) || 0;
    
    const validFaulty = Math.min(newVal, orderQty);
    newItems[idx].faultyQty = validFaulty;
    newItems[idx].receiveQty = Math.max(0, orderQty - validFaulty);
    setReceiveItems(newItems);
  };

  const handleReceiveQtyChange = (idx: number, val: string) => {
    const newVal = val === "" ? 0 : Number(val);
    const newItems = [...receiveItems];
    const orderQty = Number(newItems[idx].qty) || 0;
    
    const validReceive = Math.max(0, newVal);
    newItems[idx].receiveQty = validReceive;
    
    if (validReceive <= orderQty) {
      newItems[idx].faultyQty = orderQty - validReceive;
    } else {
      newItems[idx].faultyQty = 0;
    }
    setReceiveItems(newItems);
  };

  const submitReceipt = () => {
    const completedPO = { ...receivingPO, status: 'COMPLETED' };
    onConfirmReceipt(completedPO, receiveItems);
    if (onPrintPO) {
        const finalPO = { ...completedPO, items: receiveItems };
        setTimeout(() => onPrintPO(finalPO), 1000);
    }
    setReceivingPO(null);
    setActiveTab('HISTORY');
  };

  const pendingPOs = allPOs.filter(p => p.status === 'PENDING').sort((a,b) => b.id - a.id);
  const completedPOs = allPOs.filter(p => p.status === 'COMPLETED').sort((a,b) => b.id - a.id);

  const totalAmtTab1 = poItems.reduce((sum, item) => sum + (item.qty || 0) * (item.importPrice || 0), 0);
  const remainAmtTab1 = totalAmtTab1 - (paidAmount || 0);

  const totalActualAmt = receiveItems.reduce((sum, item) => sum + ((item.receiveQty !== undefined ? item.receiveQty : item.qty) * (item.importPrice || 0)), 0);
  const previouslyPaid = receivingPO?.paid_amount || 0;
  const remainingToPay = totalActualAmt - previouslyPaid;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: 'white', width: '1000px', maxWidth: '95%', height: '85vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>Quản Lý Đơn Đặt Hàng (PO)</h2>
          <button onClick={() => setShowPOModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
        </div>

        {/* MÀN HÌNH NHẬP KHO */}
        {receivingPO ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '15px 20px', background: '#eff6ff', borderBottom: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', color: '#1e3a8a' }}>XÁC NHẬN NHẬP KHO - MÃ: {receivingPO.po_code}</h3>
                <span style={{ fontSize: '14px', color: '#475569' }}>NCC: <strong>{receivingPO.supplier?.name}</strong> | Đặt ngày: {new Date(receivingPO.created_at).toLocaleDateString('vi-VN')}</span>
              </div>
              <button onClick={() => setReceivingPO(null)} style={{ padding: '8px 15px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}> Quay lại</button>
            </div>
            
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Mã SP</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Sản phẩm</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>SL Đặt</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#1e3a8a' }}>Thực Nhận (Vào Kho)</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#ef4444' }}>SL Lỗi/Trả Lại</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Đơn giá</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {receiveItems.map((item, idx) => {
                    const orderQty = Number(item.qty) || 0;
                    const rQty = item.receiveQty !== undefined ? Number(item.receiveQty) : orderQty;
                    const fQty = Number(item.faultyQty) || 0;
                    const lineTotal = rQty * (Number(item.importPrice) || 0);

                    return (
                      <tr key={idx} style={{ backgroundColor: fQty > 0 ? '#fef2f2' : 'transparent', borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.product_code || item.product?.product_code || "N/A"}</td>
                        <td style={{ padding: '12px' }}>{cleanName(item.name)}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{orderQty}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <input type="number" min="0" value={rQty} onChange={(e) => handleReceiveQtyChange(idx, e.target.value)} style={{ width: '70px', padding: '6px', textAlign: 'center', borderRadius: '4px', border: '2px solid #1e3a8a', fontWeight: 'bold', color: '#1e3a8a' }} />
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <input type="number" min="0" max={orderQty} value={fQty === 0 ? '' : fQty} placeholder="0" onChange={(e) => handleFaultyQtyChange(idx, e.target.value)} style={{ width: '70px', padding: '6px', textAlign: 'center', borderRadius: '4px', border: fQty > 0 ? '2px solid #ef4444' : '1px solid #cbd5e1', color: '#ef4444', fontWeight: fQty > 0 ? 'bold' : 'normal', outline: 'none' }} />
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>{(Number(item.importPrice) || 0).toLocaleString()}đ</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>{lineTotal.toLocaleString()}đ</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: '15px', color: '#64748b', marginBottom: '5px' }}>Tổng tiền thực nhận: {totalActualAmt.toLocaleString()}đ</div>
                    <div style={{ fontSize: '15px', color: '#10b981', marginBottom: '5px' }}>Đã ứng trước: {previouslyPaid.toLocaleString()}đ</div>
                    <div style={{ fontSize: '18px' }}>
                        CÒN PHẢI TRẢ NCC: <strong style={{ color: '#dc2626', fontSize: '22px' }}>
                            {remainingToPay.toLocaleString()}đ
                        </strong>
                    </div>
                </div>
                <button onClick={submitReceipt} disabled={loading} style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
                    {loading ? "ĐANG XỬ LÝ..." : "✅ XÁC NHẬN NHẬP KHO & IN PHIẾU"}
                </button>
            </div>
          </div>
        ) : (
          // BA TAB GIAO DIỆN CHÍNH
          <>
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9' }}>
              <button onClick={() => setActiveTab('NEW')} style={{ flex: 1, padding: '14px', border: 'none', background: activeTab === 'NEW' ? 'white' : 'transparent', fontWeight: 'bold', color: activeTab === 'NEW' ? '#2563eb' : '#64748b', borderBottom: activeTab === 'NEW' ? '3px solid #2563eb' : '3px solid transparent', cursor: 'pointer', fontSize: '14px' }}>TẠO ĐƠN MỚI (PO)</button>
              <button onClick={() => setActiveTab('LIST')} style={{ flex: 1, padding: '14px', border: 'none', background: activeTab === 'LIST' ? 'white' : 'transparent', fontWeight: 'bold', color: activeTab === 'LIST' ? '#f59e0b' : '#64748b', borderBottom: activeTab === 'LIST' ? '3px solid #f59e0b' : '3px solid transparent', cursor: 'pointer', fontSize: '14px' }}>DS ĐƠN CHỜ NHẬP ({pendingPOs.length})</button>
              <button onClick={() => setActiveTab('HISTORY')} style={{ flex: 1, padding: '14px', border: 'none', background: activeTab === 'HISTORY' ? 'white' : 'transparent', fontWeight: 'bold', color: activeTab === 'HISTORY' ? '#10b981' : '#64748b', borderBottom: activeTab === 'HISTORY' ? '3px solid #10b981' : '3px solid transparent', cursor: 'pointer', fontSize: '14px' }}>LỊCH SỬ NHẬP KHO</button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              
              {/* TAB 1: TẠO ĐƠN */}
              {activeTab === 'NEW' && (
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
                        <tr>
                          <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Mã SP</th>
                          <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>Sản phẩm</th>
                          <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #cbd5e1' }}>SL Đặt</th>
                          <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #cbd5e1' }}>Giá Nhập (Dự kiến)</th>
                          <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #cbd5e1' }}>Thành Tiền</th>
                          <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #cbd5e1' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {poItems.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', fontWeight: 'bold' }}>{item.product_code || item.product?.product_code || "N/A"}</td>
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
                  
                  <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '15px', display: 'flex', justifyContent: 'flex-end' }}>
                     <div style={{ width: '350px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ fontWeight: 'bold' }}>Tổng tiền đơn hàng:</span>
                            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{totalAmtTab1.toLocaleString()}đ</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                            <span>Tiền ứng trước NCC:</span>
                            <input 
                              type="number" 
                              value={paidAmount === 0 ? '' : paidAmount} 
                              placeholder="0"
                              onChange={e => setPaidAmount && setPaidAmount(Number(e.target.value))} 
                              style={{ width: '120px', padding: '6px', textAlign: 'right', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #cbd5e1', paddingTop: '10px' }}>
                            <span style={{ fontWeight: 'bold', color: '#dc2626' }}>Còn phải trả:</span>
                            <span style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '18px' }}>{remainAmtTab1.toLocaleString()}đ</span>
                        </div>
                     </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handlePrintDraft} style={{ padding: '12px 20px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>🖨️ IN NHÁP</button>
                    <button onClick={handleCreatePOClick} disabled={loading} style={{ flex: 1, padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>
                      {loading ? "ĐANG LƯU..." : "TẠO ĐƠN (PO)"}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: DANH SÁCH CHỜ NHẬP */}
              {activeTab === 'LIST' && (
                <div>
                  {pendingPOs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Không có đơn đặt hàng nào đang chờ.</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                        <tr>
                          <th style={{ padding: '12px', textAlign: 'left' }}>Mã PO</th>
                          <th style={{ padding: '12px', textAlign: 'left' }}>Nhà Cung Cấp</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>Ngày tạo</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Tổng / Đã ứng</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingPOs.map((po, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e3a8a' }}>{po.po_code}</td>
                            <td style={{ padding: '12px' }}>{po.supplier?.name}</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>{new Date(po.created_at).toLocaleDateString('vi-VN')}</td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                                <div style={{ fontWeight: 'bold' }}>{(po.total_amount || 0).toLocaleString()}đ</div>
                                <div style={{ fontSize: '12px', color: '#10b981' }}>Đã ứng: {(po.paid_amount || 0).toLocaleString()}đ</div>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                              <button onClick={() => handlePrintOrder(po)} style={{ padding: '6px 12px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>🖨️ In PO</button>
                              <button onClick={() => openReceiveScreen(po)} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>📥 Nhập kho</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* TAB 3: LỊCH SỬ NHẬP KHO */}
              {activeTab === 'HISTORY' && (
                <div>
                   {completedPOs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Chưa có lịch sử nhập kho nào.</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                        <tr>
                          <th style={{ padding: '12px', textAlign: 'left' }}>Mã PO</th>
                          <th style={{ padding: '12px', textAlign: 'left' }}>Nhà Cung Cấp</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>Ngày nhập</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Đã Thanh Toán</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedPOs.map((po, idx) => {
                           const actualTotal = (po.items || []).reduce((sum: number, item: any) => {
                             const rQty = item.receiveQty !== undefined ? item.receiveQty : item.qty;
                             const fQty = item.faultyQty || 0;
                             const finalQty = (item.receiveQty !== undefined) ? item.receiveQty : Math.max(0, rQty - fQty);
                             return sum + (finalQty * (item.importPrice || 0));
                           }, 0);

                           return (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px', fontWeight: 'bold' }}>{po.po_code}</td>
                              <td style={{ padding: '12px' }}>{po.supplier?.name}</td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>{new Date(po.created_at).toLocaleDateString('vi-VN')}</td>
                              <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>{actualTotal.toLocaleString()}đ</td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <button onClick={() => onPrintPO && onPrintPO(po)} style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🖨️ In lại phiếu</button>
                              </td>
                            </tr>
                           )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

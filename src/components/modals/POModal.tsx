// @ts-nocheck
import React, { useEffect } from "react";
import { cleanName } from "../../utils/helpers";

export const POModal = ({
  showPOModal, setShowPOModal, poTab, setPoTab, suppliers, selectedSupplierId, setSelectedSupplierId,
  poSearch, setPoSearch, poItems, setPoItems, products, poNote, setPoNote, paidAmount, setPaidAmount,
  searchPoCode, setSearchPoCode, foundPO, setFoundPO, receiveItems, setReceiveItems, allPOs, loading,
  onSaveNewPO, onConfirmReceipt, handlePrintPO
}) => {
  if (!showPOModal) return null;

  // Xóa filter tạm thời khi chuyển đổi PO
  useEffect(() => {
    if (poTab === "RECEIVE" && !foundPO && allPOs && allPOs.length > 0) {
      handleSelectPOToReceive(allPOs[0]);
    }
  }, [poTab, allPOs]);

  const handleSelectPOToReceive = (po: any) => {
    setFoundPO(po);
    // Tự động fill số lượng thực nhập = số lượng đặt ban đầu để nv đỡ phải gõ lại từ đầu
    setReceiveItems((po.items || []).map(i => ({ ...i, actualQty: i.qty })));
  };

  const handleExportDraft = () => {
    if (!poItems || poItems.length === 0) return alert("Chưa có sản phẩm nào trong phiếu!");
    try {
      const supplierName = (suppliers || []).find((s: any) => s.id == selectedSupplierId)?.name || "Chưa chọn NCC";
      const wb = (window as any).XLSX.utils.book_new();
      const wsData = [ ["PHIẾU ĐẶT HÀNG (PO) - BẢN NHÁP"], ["Nhà cung cấp:", supplierName], ["Ghi chú:", poNote || ""], [], ["STT", "Tên Sản Phẩm", "Số Lượng", "Giá Nhập (đ)", "Thành Tiền (đ)"] ];
      poItems.forEach((item: any, index: number) => { wsData.push([ index + 1, cleanName(item?.product?.name || "SP"), item?.qty || 0, item?.importPrice || 0, (item?.qty || 0) * (item?.importPrice || 0) ]); });
      const total = poItems.reduce((sum: number, item: any) => sum + ((item?.qty || 0) * (item?.importPrice || 0)), 0);
      wsData.push([]); wsData.push(["", "", "", "TỔNG CỘNG:", total]);
      const ws = (window as any).XLSX.utils.aoa_to_sheet(wsData); (window as any).XLSX.utils.book_append_sheet(wb, ws, "PO_Draft"); (window as any).XLSX.writeFile(wb, `PO_Draft_${Date.now()}.xlsx`);
    } catch (e) { alert("Lỗi xuất Excel!"); }
  };

  return (
    <div className="custom-modal-overlay no-print" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99999, backdropFilter: "blur(4px)" }}>
      
      <style>{`
        .po-input { width: 100%; padding: 12px 16px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; color: #0f172a; background: #ffffff; transition: all 0.2s ease; box-sizing: border-box; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
        .po-input:hover { border-color: #94a3b8; }
        .po-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); outline: none; }
        .po-input-with-icon { padding-left: 42px; }
        .po-table-input { width: 100%; padding: 10px; border: 1px solid transparent; border-radius: 6px; font-size: 14px; font-weight: 700; color: #0f172a; background: #f1f5f9; transition: all 0.2s ease; box-sizing: border-box; text-align: center; }
        .po-table-input:hover { background: #e2e8f0; border-color: #cbd5e1; }
        .po-table-input:focus { background: #ffffff; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); outline: none; }
        .po-list-item { padding: 16px; border-bottom: 1px solid #e2e8f0; cursor: pointer; transition: 0.2s; border-left: 4px solid transparent; }
        .po-list-item:hover { background: #f8fafc; }
        .po-list-item.active { background: #eff6ff; border-left-color: #3b82f6; }
      `}</style>

      <div className="custom-modal-box" style={{ background: "#fff", width: "1250px", maxWidth: "95vw", height: "90vh", borderRadius: "20px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #e2e8f0", background: "#ffffff", flex: "none" }}>
          <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a", display: "flex", alignItems: "center", gap: "12px", fontWeight: "800" }}>
            <span style={{ padding: "8px", background: "#eff6ff", borderRadius: "10px", color: "#3b82f6", display: "flex" }}>📦</span> QUẢN LÝ PHIẾU NHẬP (PO)
          </h2>
          <button onClick={() => setShowPOModal(false)} style={{ background: "#f1f5f9", border: "none", width: "36px", height: "36px", borderRadius: "50%", fontSize: "20px", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }} onMouseOver={e=>e.currentTarget.style.background='#e2e8f0'} onMouseOut={e=>e.currentTarget.style.background='#f1f5f9'}>&times;</button>
        </div>

        <div style={{ display: "flex", gap: "12px", padding: "16px 24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", flex: "none" }}>
          <button onClick={() => setPoTab("NEW")} style={{ padding: "10px 24px", fontSize: "14px", fontWeight: "700", border: "none", borderRadius: "8px", cursor: "pointer", background: poTab === "NEW" ? "#3b82f6" : "#e2e8f0", color: poTab === "NEW" ? "white" : "#475569", transition: "0.2s", display: "flex", alignItems: "center", gap: "8px", boxShadow: poTab === "NEW" ? "0 4px 6px rgba(59,130,246,0.2)" : "none" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            TẠO PO MỚI (CHỜ NHẬN)
          </button>
          <button onClick={() => setPoTab("RECEIVE")} style={{ padding: "10px 24px", fontSize: "14px", fontWeight: "700", border: "none", borderRadius: "8px", cursor: "pointer", background: poTab === "RECEIVE" ? "#10b981" : "#e2e8f0", color: poTab === "RECEIVE" ? "white" : "#475569", transition: "0.2s", display: "flex", alignItems: "center", gap: "8px", boxShadow: poTab === "RECEIVE" ? "0 4px 6px rgba(16,185,129,0.2)" : "none" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            TÌM & NHẬN HÀNG
          </button>
        </div>

        <div style={{ display: "flex", gap: "24px", background: "#f1f5f9", padding: "24px", flex: 1, minHeight: 0, overflow: "hidden" }}>
          
          {/* ==================== TAB 1: TẠO PO MỚI ==================== */}
          {poTab === "NEW" && (
            <>
              {/* CỘT TRÁI (35%) */}
              <div style={{ width: "35%", minWidth: "350px", background: "#fff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "24px", overflowY: "auto" }}>
                <div style={{ flex: "none" }}>
                  <label style={{ fontSize: "13px", color: "#475569", fontWeight: "700", display: "block", marginBottom: "8px", textTransform: "uppercase" }}>1. Chọn Nhà Cung Cấp</label>
                  <select className="po-input" value={selectedSupplierId || ""} onChange={(e) => setSelectedSupplierId(e.target.value)} style={{ fontWeight: selectedSupplierId ? "700" : "500", cursor: "pointer" }}>
                    <option value="">-- Click để chọn NCC --</option>
                    {(suppliers || []).map((s: any) => (<option key={s.id} value={s.id}>{s.name} - {s.phone}</option>))}
                  </select>
                </div>

                <div style={{ flex: "none", position: "relative" }}>
                  <label style={{ fontSize: "13px", color: "#475569", fontWeight: "700", display: "block", marginBottom: "8px", textTransform: "uppercase" }}>2. Tìm Sản Phẩm</label>
                  <input type="text" className="po-input" placeholder="Nhập tên hoặc mã vạch..." value={poSearch || ""} onChange={(e) => setPoSearch(e.target.value)} />
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, maxHeight: "250px", overflowY: "auto", background: "#fff", border: (poSearch || "").trim() ? "1px solid #cbd5e1" : "none", borderRadius: "12px", marginTop: "8px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)", zIndex: 10 }}>
                    {(poSearch || "").trim() && (products || []).filter((p) => cleanName(p?.name || "").toLowerCase().includes(poSearch.toLowerCase()) || String(p?.product_code || "").toLowerCase().includes(poSearch.toLowerCase())).slice(0, 10).map((p) => (
                        <div key={p.id} className="po-search-item" onClick={() => {
                            const currentItems = poItems || []; const exist = currentItems.find((i) => i?.product?.id === p.id);
                            if (exist) { setPoItems(currentItems.map((i) => i?.product?.id === p.id ? { ...i, qty: (i.qty || 0) + 1 } : i)); } 
                            else { setPoItems([{ product: p, qty: 1, importPrice: p.import_price || 0 }, ...currentItems]); }
                            setPoSearch("");
                          }} style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div><div style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>{cleanName(p?.name || "SP")}</div><div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Mã: {p?.product_code || "---"}</div></div>
                          <div style={{ textAlign: "right" }}><div style={{ fontWeight: "700", color: "#10b981", fontSize: "13px" }}>{(p?.import_price || 0).toLocaleString()}đ</div><div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>Tồn: {p?.stock || 0}</div></div>
                        </div>
                      ))}
                  </div>
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "150px" }}>
                  <label style={{ fontSize: "13px", color: "#475569", fontWeight: "700", display: "block", marginBottom: "8px", textTransform: "uppercase" }}>3. Ghi chú (Tùy chọn)</label>
                  <textarea className="po-input" placeholder="Ghi chú thêm cho phiếu nhập này..." value={poNote || ""} onChange={(e) => setPoNote(e.target.value)} style={{ flex: 1, resize: "none" }} />
                </div>
              </div>

              {/* CỘT PHẢI */}
              <div style={{ flex: 1, background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
                <div style={{ flex: "none", padding: "16px 24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "15px", color: "#0f172a", fontWeight: "800" }}>Danh sách Sản Phẩm Sẽ Đặt</h3>
                  <span style={{ background: "#e2e8f0", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", color: "#475569" }}>{poItems?.length || 0} Sản phẩm</span>
                </div>
                
                <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 1 }}>
                      <tr style={{ color: "#64748b", textAlign: "left", fontSize: "12px", textTransform: "uppercase" }}>
                        <th style={{ padding: "14px 24px", fontWeight: "700", borderBottom: "2px solid #e2e8f0" }}>Sản phẩm</th>
                        <th style={{ padding: "14px 16px", textAlign: "center", width: "120px", fontWeight: "700", borderBottom: "2px solid #e2e8f0" }}>Số lượng</th>
                        <th style={{ padding: "14px 16px", textAlign: "right", width: "140px", fontWeight: "700", borderBottom: "2px solid #e2e8f0" }}>Giá nhập (đ)</th>
                        <th style={{ padding: "14px 24px", textAlign: "right", width: "150px", fontWeight: "700", borderBottom: "2px solid #e2e8f0" }}>Thành tiền</th>
                        <th style={{ padding: "14px 16px", textAlign: "center", width: "60px", fontWeight: "700", borderBottom: "2px solid #e2e8f0" }}>Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!poItems || poItems.length === 0) ? (
                        <tr><td colSpan={5} style={{ textAlign: "center", padding: "80px 20px", color: "#94a3b8" }}><div style={{ fontSize: "40px", marginBottom: "12px", opacity: 0.5 }}>🛒</div><div style={{ fontSize: "15px", fontWeight: "500" }}>Chưa có sản phẩm nào được chọn</div></td></tr>
                      ) : (
                        poItems.map((item: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "16px 24px" }}>
                              <div style={{ fontWeight: "700", color: "#1e293b", marginBottom: "4px" }}>{cleanName(item?.product?.name || "SP")}</div>
                              <div style={{ fontSize: "12px", color: "#94a3b8", fontFamily: "monospace" }}>{item?.product?.product_code}</div>
                            </td>
                            <td style={{ padding: "16px 16px", textAlign: "center" }}><input type="number" className="po-table-input" value={item?.qty || 1} onChange={(e) => { const val = parseInt(e.target.value) || 1; setPoItems((poItems || []).map((i, ix) => (ix === idx ? { ...i, qty: val } : i))); }} min="1" /></td>
                            <td style={{ padding: "16px 16px", textAlign: "right" }}><input type="number" className="po-table-input" style={{ textAlign: "right", color: "#10b981" }} value={item?.importPrice || 0} onChange={(e) => { const val = parseInt(e.target.value) || 0; setPoItems((poItems || []).map((i, ix) => (ix === idx ? { ...i, importPrice: val } : i))); }} min="0" /></td>
                            <td style={{ padding: "16px 24px", fontWeight: "800", textAlign: "right", color: "#0f172a", fontSize: "15px" }}>{((item?.qty || 0) * (item?.importPrice || 0)).toLocaleString()}</td>
                            <td style={{ padding: "16px 16px", textAlign: "center" }}><button onClick={() => setPoItems((poItems || []).filter((_, ix) => ix !== idx))} style={{ background: "#fff", color: "#ef4444", border: "1px solid #fecaca", borderRadius: "8px", padding: "8px 10px", cursor: "pointer" }}>🗑️</button></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ flex: "none", background: "#f8fafc", padding: "24px", borderTop: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "700" }}>Tổng giá trị đơn hàng:</span><b style={{ fontSize: "26px", color: "#0f172a" }}>{(poItems || []).reduce((sum, item) => sum + (item?.qty || 0) * (item?.importPrice || 0), 0).toLocaleString()}đ</b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "700" }}>Đã trả trước cho NCC:</span>
                    <input type="number" className="po-input" style={{ width: "200px", textAlign: "right", fontWeight: "800", color: "#10b981", fontSize: "18px" }} value={paidAmount || 0} onChange={(e) => setPaidAmount(parseInt(e.target.value) || 0)} min="0" />
                  </div>
                  
                  <div style={{ display: "flex", gap: "12px", marginTop: "24px", paddingTop: "24px", borderTop: "1px dashed #cbd5e1" }}>
                    <button onClick={handleExportDraft} style={{ flex: 1, padding: "16px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569", borderRadius: "10px", fontWeight: "800", cursor: "pointer" }}>📥 XUẤT NHÁP (EXCEL)</button>
                    <button onClick={onSaveNewPO} disabled={loading || !poItems || poItems.length === 0} style={{ flex: 2, background: "#3b82f6", padding: "16px", opacity: !poItems || poItems.length === 0 ? 0.5 : 1, border: "none", borderRadius: "10px", color: "white", fontWeight: "800", cursor: !poItems || poItems.length === 0 ? 'not-allowed' : 'pointer' }}>{loading ? "ĐANG XỬ LÝ..." : "💾 LƯU PHIẾU ĐẶT HÀNG"}</button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ==================== TAB 2: TÌM & NHẬN HÀNG ==================== */}
          {poTab === "RECEIVE" && (
            <>
              {/* CỘT TRÁI: DANH SÁCH PO ĐÃ TẠO */}
              <div style={{ width: "35%", minWidth: "350px", background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
                <div style={{ padding: "16px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                  <input type="text" className="po-input" placeholder="Tìm theo mã PO..." value={searchPoCode || ""} onChange={(e) => setSearchPoCode(e.target.value)} />
                </div>
                
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {allPOs.length === 0 ? (
                    <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>Chưa có phiếu đặt hàng nào.</div>
                  ) : (
                    allPOs.filter((po: any) => po.po_code.toLowerCase().includes((searchPoCode || "").toLowerCase())).map((po: any) => (
                      <div key={po.id} className={`po-list-item ${foundPO?.id === po.id ? 'active' : ''}`} onClick={() => handleSelectPOToReceive(po)}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <b style={{ color: "#0f172a", fontSize: "14px" }}>{po.po_code}</b>
                          <span style={{ fontSize: "11px", fontWeight: "bold", padding: "2px 8px", borderRadius: "12px", background: po.status === 'COMPLETED' ? '#dcfce7' : '#fef9c3', color: po.status === 'COMPLETED' ? '#166534' : '#854d0e' }}>
                            {po.status === 'COMPLETED' ? 'Đã Nhập' : 'Chờ Hàng'}
                          </span>
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>NCC: {po.supplier?.name || 'Không rõ'}</div>
                        <div style={{ fontSize: "12px", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
                          <span>{new Date(po.created_at).toLocaleDateString('vi-VN')}</span>
                          <span style={{ fontWeight: "bold", color: "#3b82f6" }}>{(po.total_amount || 0).toLocaleString()}đ</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* CỘT PHẢI: CHI TIẾT & NHẬN HÀNG */}
              <div style={{ flex: 1, background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
                {!foundPO ? (
                  <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", color: "#94a3b8", flexDirection: "column" }}>
                    <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.5 }}>👈</div>
                    <div style={{ fontSize: "16px", fontWeight: "500" }}>Chọn một phiếu PO ở cột bên trái để xem chi tiết.</div>
                  </div>
                ) : (
                  <>
                    {/* Header Chi tiết PO */}
                    <div style={{ flex: "none", padding: "20px 24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                          <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#0f172a", fontWeight: "800" }}>Mã Phiếu: {foundPO.po_code}</h3>
                          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>NCC: <b>{foundPO.supplier?.name}</b></p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ display: "inline-block", fontSize: "12px", fontWeight: "bold", padding: "4px 12px", borderRadius: "16px", background: foundPO.status === 'COMPLETED' ? '#dcfce7' : '#fef9c3', color: foundPO.status === 'COMPLETED' ? '#166534' : '#854d0e', marginBottom: "4px" }}>
                            Trạng thái: {foundPO.status === 'COMPLETED' ? 'Đã Nhận Hàng' : 'Chờ Nhận Hàng'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bảng nhập số lượng thực tế */}
                    <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                        <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 1 }}>
                          <tr style={{ color: "#64748b", textAlign: "left", fontSize: "12px", textTransform: "uppercase" }}>
                            <th style={{ padding: "14px 24px", fontWeight: "700", borderBottom: "2px solid #e2e8f0" }}>Sản phẩm</th>
                            <th style={{ padding: "14px 16px", textAlign: "center", width: "100px", fontWeight: "700", borderBottom: "2px solid #e2e8f0" }}>SL Đặt</th>
                            <th style={{ padding: "14px 16px", textAlign: "right", width: "120px", fontWeight: "700", borderBottom: "2px solid #e2e8f0" }}>Giá nhập (đ)</th>
                            <th style={{ padding: "14px 16px", textAlign: "center", width: "140px", fontWeight: "800", color: "#2563eb", borderBottom: "2px solid #e2e8f0", background: "#eff6ff" }}>THỰC NHẬP</th>
                            <th style={{ padding: "14px 24px", textAlign: "right", width: "140px", fontWeight: "700", borderBottom: "2px solid #e2e8f0" }}>Tổng Thực Tế</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(receiveItems || []).map((item: any, idx: number) => {
                            const isCompleted = foundPO.status === 'COMPLETED';
                            return (
                              <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "16px 24px" }}>
                                  <div style={{ fontWeight: "700", color: "#1e293b", marginBottom: "4px" }}>{cleanName(item?.product?.name || "SP")}</div>
                                  <div style={{ fontSize: "12px", color: "#94a3b8", fontFamily: "monospace" }}>{item?.product?.product_code}</div>
                                </td>
                                <td style={{ padding: "16px", textAlign: "center", fontWeight: "bold", color: "#64748b", background: "#f8fafc" }}>{item.qty}</td>
                                <td style={{ padding: "16px", textAlign: "right", fontWeight: "600", color: "#475569" }}>{(item.importPrice || 0).toLocaleString()}</td>
                                
                                {/* Ô NHẬP SỐ LƯỢNG THỰC TẾ */}
                                <td style={{ padding: "16px", textAlign: "center", background: "#eff6ff" }}>
                                  <input 
                                    type="number" className="po-table-input" 
                                    style={{ textAlign: "center", border: "2px solid #bfdbfe", background: "#ffffff", color: "#2563eb", fontSize: "16px" }} 
                                    value={item.actualQty === undefined ? item.qty : item.actualQty} 
                                    disabled={isCompleted}
                                    onChange={(e) => { 
                                      const val = parseInt(e.target.value) || 0; 
                                      setReceiveItems(receiveItems.map((i, ix) => ix === idx ? { ...i, actualQty: val } : i)); 
                                    }} 
                                    min="0" 
                                  />
                                </td>
                                
                                <td style={{ padding: "16px 24px", fontWeight: "800", textAlign: "right", color: "#0f172a", fontSize: "15px" }}>
                                  {((item.actualQty === undefined ? item.qty : item.actualQty) * (item.importPrice || 0)).toLocaleString()}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Khối Hành động bên dưới */}
                    <div style={{ flex: "none", background: "#f8fafc", padding: "24px", borderTop: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "700" }}>Tổng tiền (Theo thực nhận):</span>
                        <b style={{ fontSize: "26px", color: "#10b981" }}>
                          {(receiveItems || []).reduce((sum, item) => sum + (item.actualQty === undefined ? item.qty : item.actualQty) * (item.importPrice || 0), 0).toLocaleString()}đ
                        </b>
                      </div>

                      <div style={{ display: "flex", gap: "12px", marginTop: "24px", paddingTop: "24px", borderTop: "1px dashed #cbd5e1" }}>
                        <button onClick={() => handlePrintPO(foundPO, 'ORDER')} style={{ flex: 1, padding: "16px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569", borderRadius: "10px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                          🖨️ IN PHIẾU ĐẶT HÀNG
                        </button>
                        
                        {foundPO.status === 'COMPLETED' ? (
                          <button onClick={() => handlePrintPO(foundPO, 'RECEIPT')} style={{ flex: 1, padding: "16px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "10px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                            🖨️ IN PHIẾU NHẬP (THỰC TẾ)
                          </button>
                        ) : (
                          <button onClick={onConfirmReceipt} disabled={loading} style={{ flex: 1, background: "#10b981", padding: "16px", border: "none", borderRadius: "10px", color: "white", fontWeight: "800", cursor: "pointer", boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.3)" }}>
                            {loading ? "ĐANG XỬ LÝ..." : "✅ XÁC NHẬN NHẬN HÀNG & LƯU KHO"}
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

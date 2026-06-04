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

  useEffect(() => {
    if (poTab === "RECEIVE" && !foundPO && allPOs && allPOs.length > 0) {
      handleSelectPOToReceive(allPOs[0]);
    }
  }, [poTab, allPOs]);

  const handleSelectPOToReceive = (po: any) => {
    setFoundPO(po);
    setReceiveItems((po.items || []).map(i => ({ ...i, actualQty: i.qty })));
  };

  const handleExportDraft = () => {
    if (!poItems || poItems.length === 0) return alert("Chưa có sản phẩm nào trong phiếu!");
    try {
      const supplierName = (suppliers || []).find((s: any) => s.id == selectedSupplierId)?.name || "Chưa chọn NCC";
      const wb = (window as any).XLSX.utils.book_new();
      const wsData = [ ["PHIẾU ĐẶT HÀNG (PO) - BẢN NHÁP"], ["Nhà cung cấp:", supplierName], ["Ghi chú:", poNote || ""], [], ["STT", "Tên Sản Phẩm", "Số Lượng", "Giá Nhập (đ)", "Thành Tiền (đ)"] ];
      poItems.forEach((item: any, index: number) => { wsData.push([ index + 1, cleanName(item?.product?.name || "SP"), item?.qty || 0, item?.importPrice || 0, (Number(item?.qty) || 0) * (Number(item?.importPrice) || 0) ]); });
      const total = poItems.reduce((sum: number, item: any) => sum + ((Number(item?.qty) || 0) * (Number(item?.importPrice) || 0)), 0);
      wsData.push([]); wsData.push(["", "", "", "TỔNG CỘNG:", total]);
      const ws = (window as any).XLSX.utils.aoa_to_sheet(wsData); (window as any).XLSX.utils.book_append_sheet(wb, ws, "PO_Draft"); (window as any).XLSX.writeFile(wb, `PO_Draft_${Date.now()}.xlsx`);
    } catch (e) { alert("Lỗi xuất Excel!"); }
  };

  return (
    <div className="custom-modal-overlay no-print" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99999, backdropFilter: "blur(4px)" }}>
      
      <style>{`
        /* Ẩn mũi tên lên/xuống của thẻ input type="number" giúp text không bị cắt */
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }

        .po-input { width: 100%; padding: 12px 16px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; color: #0f172a; background: #ffffff; transition: all 0.2s ease; box-sizing: border-box; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
        .po-input:hover { border-color: #94a3b8; }
        .po-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); outline: none; }
        
        .po-table-input { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 15px; font-weight: 700; color: #0f172a; background: #ffffff; transition: all 0.2s ease; box-sizing: border-box; text-align: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05); }
        .po-table-input:hover { border-color: #94a3b8; }
        .po-table-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); outline: none; background: #fff; }
        
        .po-list-item { padding: 16px; border-bottom: 1px solid #e2e8f0; cursor: pointer; transition: 0.2s; border-left: 4px solid transparent; }
        .po-list-item:hover { background: #f8fafc; }
        .po-list-item.active { background: #eff6ff; border-left-color: #3b82f6; }
      `}</style>

      {/* TỔNG THỂ MODAL BẰNG GRID */}
      <div className="custom-modal-box" style={{ 
        background: "#fff", width: "1350px", maxWidth: "95vw", height: "90vh", borderRadius: "20px", 
        display: "grid", gridTemplateRows: "auto auto minmax(0, 1fr)", overflow: "hidden", 
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)" 
      }}>
        
        {/* ROW 1: HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #e2e8f0", background: "#ffffff" }}>
          <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a", display: "flex", alignItems: "center", gap: "12px", fontWeight: "800" }}>
            <span style={{ padding: "8px", background: "#eff6ff", borderRadius: "10px", color: "#3b82f6", display: "flex" }}>📦</span> QUẢN LÝ PHIẾU NHẬP (PO)
          </h2>
          <button onClick={() => setShowPOModal(false)} style={{ background: "#f1f5f9", border: "none", width: "36px", height: "36px", borderRadius: "50%", fontSize: "20px", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }} onMouseOver={e=>e.currentTarget.style.background='#e2e8f0'} onMouseOut={e=>e.currentTarget.style.background='#f1f5f9'}>&times;</button>
        </div>

        {/* ROW 2: TABS */}
        <div style={{ display: "flex", gap: "12px", padding: "16px 24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
          <button onClick={() => setPoTab("NEW")} style={{ padding: "10px 24px", fontSize: "14px", fontWeight: "700", border: "none", borderRadius: "8px", cursor: "pointer", background: poTab === "NEW" ? "#3b82f6" : "#e2e8f0", color: poTab === "NEW" ? "white" : "#475569", transition: "0.2s", boxShadow: poTab === "NEW" ? "0 4px 6px rgba(59,130,246,0.2)" : "none" }}>
            TẠO PO MỚI (CHỜ NHẬN)
          </button>
          <button onClick={() => setPoTab("RECEIVE")} style={{ padding: "10px 24px", fontSize: "14px", fontWeight: "700", border: "none", borderRadius: "8px", cursor: "pointer", background: poTab === "RECEIVE" ? "#10b981" : "#e2e8f0", color: poTab === "RECEIVE" ? "white" : "#475569", transition: "0.2s", boxShadow: poTab === "RECEIVE" ? "0 4px 6px rgba(16,185,129,0.2)" : "none" }}>
            TÌM & NHẬN HÀNG
          </button>
        </div>

        {/* ROW 3: BODY - NỘI DUNG CHÍNH CHIA 2 CỘT */}
        <div style={{ display: "grid", gridTemplateColumns: "35% 1fr", gap: "24px", background: "#f1f5f9", padding: "24px", overflow: "hidden" }}>
          
          {/* ==================== TAB 1: TẠO PO MỚI ==================== */}
          {poTab === "NEW" && (
            <>
              {/* CỘT TRÁI */}
              <div style={{ background: "#fff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "24px", overflowY: "auto" }}>
                <div style={{ flex: "none" }}>
                  <label style={{ fontSize: "13px", color: "#475569", fontWeight: "700", display: "block", marginBottom: "8px", textTransform: "uppercase" }}>1. Chọn Nhà Cung Cấp</label>
                  <select className="po-input" value={selectedSupplierId || ""} onChange={(e) => setSelectedSupplierId(e.target.value)} style={{ fontWeight: selectedSupplierId ? "700" : "500", cursor: "pointer" }}>
                    <option value="">-- Click để chọn NCC --</option>
                    {(suppliers || []).map((s: any) => (<option key={s.id} value={s.id}>{s.name} - {s.phone}</option>))}
                  </select>
                </div>

                <div style={{ flex: "none", position: "relative" }}>
                  <label style={{ fontSize: "13px", color: "#475569", fontWeight: "700", display: "block", marginBottom: "8px", textTransform: "uppercase" }}>2. Tìm Sản Phẩm</label>
                  <input type="text" className="po-input" placeholder="Nhập tên hoặc mã vạch để thêm..." value={poSearch || ""} onChange={(e) => setPoSearch(e.target.value)} />
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, maxHeight: "250px", overflowY: "auto", background: "#fff", border: (poSearch || "").trim() ? "1px solid #cbd5e1" : "none", borderRadius: "12px", marginTop: "8px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)", zIndex: 10 }}>
                    {(poSearch || "").trim() && (products || []).filter((p) => cleanName(p?.name || "").toLowerCase().includes(poSearch.toLowerCase()) || String(p?.product_code || "").toLowerCase().includes(poSearch.toLowerCase())).slice(0, 10).map((p) => (
                        <div key={p.id} className="po-search-item" onClick={() => {
                            const currentItems = poItems || []; const exist = currentItems.find((i) => i?.product?.id === p.id);
                            if (exist) { setPoItems(currentItems.map((i) => i?.product?.id === p.id ? { ...i, qty: (Number(i.qty) || 0) + 1 } : i)); } 
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

              {/* CỘT PHẢI (Áp dụng CSS Grid để khóa Header và Footer) */}
              <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", display: "grid", gridTemplateRows: "auto minmax(0, 1fr) auto", overflow: "hidden" }}>
                
                {/* Header Bảng */}
                <div style={{ padding: "16px 24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "15px", color: "#0f172a", fontWeight: "800" }}>Danh sách Sản Phẩm Sẽ Đặt</h3>
                  <span style={{ background: "#e2e8f0", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", color: "#475569" }}>{poItems?.length || 0} Sản phẩm</span>
                </div>
                
                {/* Vùng hiển thị Bảng (Scrollable) */}
                <div style={{ overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 1 }}>
                      <tr style={{ color: "#64748b", textAlign: "left", fontSize: "12px", textTransform: "uppercase" }}>
                        <th style={{ padding: "14px 24px", fontWeight: "700", borderBottom: "1px solid #cbd5e1" }}>Sản phẩm</th>
                        <th style={{ padding: "14px 16px", textAlign: "center", width: "130px", fontWeight: "700", borderBottom: "1px solid #cbd5e1" }}>Số lượng</th>
                        <th style={{ padding: "14px 16px", textAlign: "center", width: "160px", fontWeight: "700", borderBottom: "1px solid #cbd5e1" }}>Giá nhập (đ)</th>
                        <th style={{ padding: "14px 24px", textAlign: "right", width: "160px", fontWeight: "700", borderBottom: "1px solid #cbd5e1" }}>Thành tiền</th>
                        <th style={{ padding: "14px 16px", textAlign: "center", width: "70px", fontWeight: "700", borderBottom: "1px solid #cbd5e1" }}>Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!poItems || poItems.length === 0) ? (
                        <tr><td colSpan={5} style={{ textAlign: "center", padding: "80px 20px", color: "#94a3b8" }}>
                          <div style={{ fontSize: "50px", marginBottom: "16px", opacity: 0.5 }}>🛒</div>
                          <div style={{ fontSize: "18px", fontWeight: "700", color: "#475569", marginBottom: "8px" }}>Chưa có sản phẩm nào</div>
                          <div style={{ fontSize: "15px" }}>Vui lòng tìm và thêm sản phẩm ở cột bên trái.</div>
                        </td></tr>
                      ) : (
                        poItems.map((item: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "16px 24px" }}>
                              <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px", marginBottom: "4px" }}>{cleanName(item?.product?.name || "SP")}</div>
                              <div style={{ fontSize: "13px", color: "#94a3b8", fontFamily: "monospace" }}>{item?.product?.product_code}</div>
                            </td>
                            <td style={{ padding: "16px", textAlign: "center" }}>
                              <input 
                                type="number" 
                                className="po-table-input" 
                                value={item.qty === "" ? "" : item.qty} 
                                onFocus={(e)=>e.target.select()} 
                                onChange={(e) => { 
                                  const val = e.target.value; 
                                  setPoItems((poItems || []).map((i, ix) => ix === idx ? { ...i, qty: val === "" ? "" : Number(val) } : i)); 
                                }} 
                              />
                            </td>
                            <td style={{ padding: "16px", textAlign: "center" }}>
                              <input 
                                type="number" 
                                className="po-table-input" 
                                style={{ textAlign: "right", color: "#10b981" }} 
                                value={item.importPrice === "" ? "" : item.importPrice} 
                                onFocus={(e)=>e.target.select()} 
                                onChange={(e) => { 
                                  const val = e.target.value; 
                                  setPoItems((poItems || []).map((i, ix) => ix === idx ? { ...i, importPrice: val === "" ? "" : Number(val) } : i)); 
                                }} 
                              />
                            </td>
                            <td style={{ padding: "16px 24px", fontWeight: "800", textAlign: "right", color: "#3b82f6", fontSize: "16px" }}>
                              {((Number(item.qty) || 0) * (Number(item.importPrice) || 0)).toLocaleString()}
                            </td>
                            <td style={{ padding: "16px", textAlign: "center" }}>
                              <button onClick={() => setPoItems((poItems || []).filter((_, ix) => ix !== idx))} style={{ background: "#fff", color: "#ef4444", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px", cursor: "pointer" }}>🗑️</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Tổng Tiền (Bị khóa chết bởi Grid, không bao giờ mất) */}
                <div style={{ padding: "24px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", boxShadow: "0 -4px 6px -1px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <span style={{ fontSize: "15px", color: "#475569", fontWeight: "700" }}>Tổng giá trị đơn hàng:</span>
                    <b style={{ fontSize: "28px", color: "#0f172a" }}>{(poItems || []).reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.importPrice) || 0), 0).toLocaleString()}đ</b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <span style={{ fontSize: "15px", color: "#475569", fontWeight: "700" }}>Đã trả trước cho NCC:</span>
                    <input type="number" className="po-input" style={{ width: "200px", padding: "12px", textAlign: "right", fontWeight: "800", color: "#10b981", fontSize: "18px", outline: "none" }} value={paidAmount === "" ? "" : paidAmount} onFocus={(e)=>e.target.select()} onChange={(e) => setPaidAmount(e.target.value === "" ? "" : Number(e.target.value))} />
                  </div>
                  
                  <div style={{ display: "flex", gap: "16px", marginTop: "24px", paddingTop: "24px", borderTop: "2px dashed #cbd5e1" }}>
                    <button onClick={handleExportDraft} style={{ flex: 1, padding: "16px", background: "#ffffff", border: "2px solid #cbd5e1", color: "#475569", borderRadius: "10px", fontWeight: "800", fontSize: "15px", cursor: "pointer" }}>📥 XUẤT NHÁP (EXCEL)</button>
                    <button onClick={onSaveNewPO} disabled={loading || !poItems || poItems.length === 0} style={{ flex: 2, background: "#3b82f6", padding: "16px", opacity: !poItems || poItems.length === 0 ? 0.5 : 1, border: "none", borderRadius: "10px", color: "white", fontWeight: "800", fontSize: "15px", cursor: !poItems || poItems.length === 0 ? 'not-allowed' : 'pointer' }}>{loading ? "ĐANG XỬ LÝ..." : "💾 LƯU PHIẾU ĐẶT HÀNG"}</button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ==================== TAB 2: TÌM & NHẬN HÀNG ==================== */}
          {poTab === "RECEIVE" && (
            <>
              {/* CỘT TRÁI */}
              <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ padding: "20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", flex: "none" }}>
                  <input type="text" className="po-input" placeholder="Tìm theo mã PO..." value={searchPoCode || ""} onChange={(e) => setSearchPoCode(e.target.value)} />
                </div>
                
                <div style={{ overflowY: "auto" }}>
                  {allPOs.length === 0 ? (
                    <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>Chưa có phiếu đặt hàng nào.</div>
                  ) : (
                    allPOs.filter((po: any) => po.po_code.toLowerCase().includes((searchPoCode || "").toLowerCase())).map((po: any) => (
                      <div key={po.id} className={`po-list-item ${foundPO?.id === po.id ? 'active' : ''}`} onClick={() => handleSelectPOToReceive(po)}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                          <b style={{ color: "#0f172a", fontSize: "15px" }}>{po.po_code}</b>
                          <span style={{ fontSize: "11px", fontWeight: "bold", padding: "4px 10px", borderRadius: "12px", background: po.status === 'COMPLETED' ? '#dcfce7' : '#fef9c3', color: po.status === 'COMPLETED' ? '#166534' : '#854d0e' }}>
                            {po.status === 'COMPLETED' ? 'Đã Nhập' : 'Chờ Hàng'}
                          </span>
                        </div>
                        <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "6px" }}>NCC: {po.supplier?.name || 'Không rõ'}</div>
                        <div style={{ fontSize: "13px", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
                          <span>{new Date(po.created_at).toLocaleDateString('vi-VN')}</span>
                          <span style={{ fontWeight: "800", color: "#3b82f6" }}>{(po.total_amount || 0).toLocaleString()}đ</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* CỘT PHẢI */}
              <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", display: "grid", gridTemplateRows: "auto minmax(0, 1fr) auto", overflow: "hidden" }}>
                {!foundPO ? (
                  <div style={{ gridRow: "1 / -1", display: "flex", justifyContent: "center", alignItems: "center", color: "#94a3b8", flexDirection: "column" }}>
                    <div style={{ fontSize: "50px", marginBottom: "16px", opacity: 0.5 }}>👈</div>
                    <div style={{ fontSize: "18px", fontWeight: "600", color: "#475569" }}>Vui lòng chọn một phiếu PO bên trái</div>
                  </div>
                ) : (
                  <>
                    <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <h3 style={{ margin: "0 0 6px 0", fontSize: "20px", color: "#0f172a", fontWeight: "800" }}>Mã Phiếu: {foundPO.po_code}</h3>
                          <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>NCC: <b>{foundPO.supplier?.name}</b></p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ display: "inline-block", fontSize: "13px", fontWeight: "bold", padding: "6px 14px", borderRadius: "16px", background: foundPO.status === 'COMPLETED' ? '#dcfce7' : '#fef9c3', color: foundPO.status === 'COMPLETED' ? '#166534' : '#854d0e' }}>
                            Trạng thái: {foundPO.status === 'COMPLETED' ? 'Đã Nhận Hàng' : 'Chờ Nhận Hàng'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ overflowY: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                        <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 1 }}>
                          <tr style={{ color: "#64748b", textAlign: "left", fontSize: "12px", textTransform: "uppercase" }}>
                            <th style={{ padding: "16px 24px", fontWeight: "800", borderBottom: "1px solid #cbd5e1" }}>Sản phẩm</th>
                            <th style={{ padding: "16px", textAlign: "center", width: "100px", fontWeight: "800", borderBottom: "1px solid #cbd5e1" }}>SL Đặt</th>
                            <th style={{ padding: "16px", textAlign: "right", width: "120px", fontWeight: "800", borderBottom: "1px solid #cbd5e1" }}>Giá nhập (đ)</th>
                            <th style={{ padding: "16px", textAlign: "center", width: "160px", fontWeight: "800", color: "#2563eb", borderBottom: "1px solid #cbd5e1", background: "#eff6ff" }}>THỰC NHẬP</th>
                            <th style={{ padding: "16px 24px", textAlign: "right", width: "150px", fontWeight: "800", borderBottom: "1px solid #cbd5e1" }}>Tổng Thực Tế</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(receiveItems || []).map((item: any, idx: number) => {
                            const isCompleted = foundPO.status === 'COMPLETED';
                            return (
                              <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "16px 24px" }}>
                                  <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px", marginBottom: "4px" }}>{cleanName(item?.product?.name || "SP")}</div>
                                  <div style={{ fontSize: "13px", color: "#94a3b8", fontFamily: "monospace" }}>{item?.product?.product_code}</div>
                                </td>
                                <td style={{ padding: "16px", textAlign: "center", fontWeight: "800", color: "#64748b", background: "#f8fafc", fontSize: "16px" }}>{item.qty}</td>
                                <td style={{ padding: "16px", textAlign: "right", fontWeight: "700", color: "#475569", fontSize: "15px" }}>{(item.importPrice || 0).toLocaleString()}</td>
                                
                                <td style={{ padding: "16px", textAlign: "center", background: "#eff6ff" }}>
                                  <input 
                                    type="number" className="po-table-input" 
                                    style={{ border: "2px solid #bfdbfe", color: "#2563eb", fontSize: "16px" }} 
                                    value={item.actualQty === undefined ? item.qty : (item.actualQty === "" ? "" : item.actualQty)} 
                                    disabled={isCompleted}
                                    onFocus={(e)=>e.target.select()}
                                    onChange={(e) => { 
                                      const val = e.target.value; 
                                      setReceiveItems(receiveItems.map((i, ix) => ix === idx ? { ...i, actualQty: val === "" ? "" : Number(val) } : i)); 
                                    }} 
                                    min="0" 
                                  />
                                </td>
                                
                                <td style={{ padding: "16px 24px", fontWeight: "800", textAlign: "right", color: "#0f172a", fontSize: "16px" }}>
                                  {((Number(item.actualQty === undefined ? item.qty : item.actualQty) || 0) * (Number(item.importPrice) || 0)).toLocaleString()}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ padding: "24px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <span style={{ fontSize: "15px", color: "#475569", fontWeight: "700" }}>Tổng tiền (Theo thực nhận):</span>
                        <b style={{ fontSize: "28px", color: "#10b981" }}>
                          {(receiveItems || []).reduce((sum, item) => sum + (Number(item.actualQty === undefined ? item.qty : item.actualQty) || 0) * (Number(item.importPrice) || 0), 0).toLocaleString()}đ
                        </b>
                      </div>

                      <div style={{ display: "flex", gap: "16px", marginTop: "24px", paddingTop: "24px", borderTop: "2px dashed #cbd5e1" }}>
                        <button onClick={() => handlePrintPO(foundPO, 'ORDER')} style={{ flex: 1, padding: "16px", background: "#ffffff", border: "2px solid #cbd5e1", color: "#475569", borderRadius: "10px", fontWeight: "800", fontSize: "14px", cursor: "pointer" }}>
                          🖨️ IN PHIẾU ĐẶT HÀNG
                        </button>
                        
                        {foundPO.status === 'COMPLETED' ? (
                          <button onClick={() => handlePrintPO(foundPO, 'RECEIPT')} style={{ flex: 1, padding: "16px", background: "#f0fdf4", border: "2px solid #bbf7d0", color: "#166534", borderRadius: "10px", fontWeight: "800", fontSize: "14px", cursor: "pointer" }}>
                            🖨️ IN PHIẾU NHẬP (THỰC TẾ)
                          </button>
                        ) : (
                          <button onClick={onConfirmReceipt} disabled={loading} style={{ flex: 1, background: "#10b981", padding: "16px", border: "none", borderRadius: "10px", color: "white", fontWeight: "800", fontSize: "14px", cursor: "pointer", boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.3)" }}>
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

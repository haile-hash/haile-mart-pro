// @ts-nocheck
import React from "react";
import { cleanName } from "../../utils/helpers";

export const POModal = ({
  showPOModal, setShowPOModal, poTab, setPoTab, suppliers, selectedSupplierId, setSelectedSupplierId,
  poSearch, setPoSearch, poItems, setPoItems, products, poNote, setPoNote, paidAmount, setPaidAmount,
  searchPoCode, setSearchPoCode, foundPO, setFoundPO, receiveItems, setReceiveItems, allPOs, loading,
  onSaveNewPO, onConfirmReceipt, handlePrintPO
}) => {
  if (!showPOModal) return null;

  const handleExportDraft = () => {
    if (!poItems || poItems.length === 0) {
      alert("Chưa có sản phẩm nào trong phiếu!");
      return;
    }
    try {
      const supplierName = (suppliers || []).find((s: any) => s.id == selectedSupplierId)?.name || "Chưa chọn NCC";
      const wb = (window as any).XLSX.utils.book_new();
      const wsData = [
        ["PHIẾU ĐẶT HÀNG (PO) - BẢN NHÁP"],
        ["Nhà cung cấp:", supplierName],
        ["Ghi chú:", poNote || ""],
        [],
        ["STT", "Tên Sản Phẩm", "Số Lượng", "Giá Nhập (đ)", "Thành Tiền (đ)"]
      ];
      poItems.forEach((item: any, index: number) => {
        wsData.push([
          index + 1,
          cleanName(item?.product?.name || "SP Không rõ"),
          item?.qty || 0,
          item?.importPrice || 0,
          (item?.qty || 0) * (item?.importPrice || 0)
        ]);
      });
      const total = poItems.reduce((sum: number, item: any) => sum + ((item?.qty || 0) * (item?.importPrice || 0)), 0);
      wsData.push([]);
      wsData.push(["", "", "", "TỔNG CỘNG:", total]);
      
      const ws = (window as any).XLSX.utils.aoa_to_sheet(wsData);
      (window as any).XLSX.utils.book_append_sheet(wb, ws, "PO_Draft");
      (window as any).XLSX.writeFile(wb, `PO_Draft_${Date.now()}.xlsx`);
    } catch (e) {
      alert("Thư viện Excel đang tải hoặc có lỗi. Vui lòng thử lại sau vài giây!");
    }
  };

  return (
    <div className="custom-modal-overlay no-print" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99999, backdropFilter: "blur(4px)" }}>
      
      {/* KHAI BÁO CSS DÀNH RIÊNG CHO CÁC Ô NHẬP LIỆU */}
      <style>{`
        .po-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 14px;
          color: #0f172a;
          background: #ffffff;
          transition: all 0.2s ease;
          box-sizing: border-box;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .po-input:hover { border-color: #94a3b8; }
        .po-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
          outline: none;
        }
        .po-input-with-icon { padding-left: 42px; }
        
        .po-table-input {
          width: 100%;
          padding: 10px;
          border: 1px solid transparent;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          background: #f1f5f9;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .po-table-input:hover { background: #e2e8f0; border-color: #cbd5e1; }
        .po-table-input:focus {
          background: #ffffff;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
          outline: none;
        }

        .po-search-item:hover { background: #f8fafc; }
        .po-search-item { transition: all 0.2s ease; border-left: 3px solid transparent; }
        .po-search-item:hover { border-left-color: #3b82f6; background: #eff6ff; }
      `}</style>

      <div className="custom-modal-box" style={{ background: "#fff", width: "1250px", maxWidth: "95vw", height: "90vh", borderRadius: "20px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #e2e8f0", background: "#ffffff", flex: "none" }}>
          <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a", display: "flex", alignItems: "center", gap: "12px", fontWeight: "800" }}>
            <span style={{ padding: "8px", background: "#eff6ff", borderRadius: "10px", color: "#3b82f6", display: "flex" }}>📦</span> 
            QUẢN LÝ PHIẾU NHẬP (PO)
          </h2>
          <button onClick={() => setShowPOModal(false)} style={{ background: "#f1f5f9", border: "none", width: "36px", height: "36px", borderRadius: "50%", fontSize: "20px", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }} onMouseOver={e=>e.currentTarget.style.background='#e2e8f0'} onMouseOut={e=>e.currentTarget.style.background='#f1f5f9'}>&times;</button>
        </div>

        {/* TABS */}
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

        {/* BODY */}
        <div style={{ display: "flex", gap: "24px", background: "#f1f5f9", padding: "24px", flex: 1, minHeight: 0, overflow: "hidden" }}>
          
          {/* ==================== TAB 1: TẠO PO MỚI ==================== */}
          {poTab === "NEW" && (
            <>
              {/* CỘT TRÁI: FORM NHẬP LIỆU */}
              <div style={{ width: "35%", minWidth: "350px", background: "#fff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "24px", overflowY: "auto", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
                
                {/* 1. CHỌN NHÀ CUNG CẤP */}
                <div style={{ flex: "none" }}>
                  <label style={{ fontSize: "13px", color: "#475569", fontWeight: "700", display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>1. Chọn Nhà Cung Cấp</label>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    </div>
                    <select className="po-input po-input-with-icon" value={selectedSupplierId || ""} onChange={(e) => setSelectedSupplierId(e.target.value)} style={{ fontWeight: selectedSupplierId ? "700" : "500", cursor: "pointer", appearance: "none" }}>
                      <option value="">-- Click để chọn NCC --</option>
                      {(suppliers || []).map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name} - {s.phone}</option>
                      ))}
                    </select>
                    <div style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}>▼</div>
                  </div>
                </div>

                {/* 2. TÌM SẢN PHẨM */}
                <div style={{ flex: "none", position: "relative" }}>
                  <label style={{ fontSize: "13px", color: "#475569", fontWeight: "700", display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>2. Tìm Sản Phẩm</label>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    <input type="text" className="po-input po-input-with-icon" placeholder="Nhập tên hoặc mã vạch..." value={poSearch || ""} onChange={(e) => setPoSearch(e.target.value)} />
                  </div>
                  
                  {/* Dropdown Gợi ý */}
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, maxHeight: "250px", overflowY: "auto", background: "#fff", border: (poSearch || "").trim() ? "1px solid #cbd5e1" : "none", borderRadius: "12px", marginTop: "8px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)", zIndex: 10 }}>
                    {(poSearch || "").trim() && (products || [])
                      .filter((p) => cleanName(p?.name || "").toLowerCase().includes(poSearch.toLowerCase()) || String(p?.product_code || "").toLowerCase().includes(poSearch.toLowerCase()))
                      .slice(0, 10)
                      .map((p) => (
                        <div key={p.id} className="po-search-item" onClick={() => {
                            const currentItems = poItems || [];
                            const exist = currentItems.find((i) => i?.product?.id === p.id);
                            if (exist) { setPoItems(currentItems.map((i) => i?.product?.id === p.id ? { ...i, qty: (i.qty || 0) + 1 } : i)); } 
                            else { setPoItems([{ product: p, qty: 1, importPrice: p.import_price || 0 }, ...currentItems]); }
                            setPoSearch("");
                          }}
                          style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                        >
                          <div>
                            <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>{cleanName(p?.name || "SP Không Rõ")}</div>
                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Mã: {p?.product_code || "---"}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: "700", color: "#10b981", fontSize: "13px" }}>{(p?.import_price || 0).toLocaleString()}đ</div>
                            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>Tồn: {p?.stock || 0}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 3. GHI CHÚ */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "150px" }}>
                  <label style={{ fontSize: "13px", color: "#475569", fontWeight: "700", display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>3. Ghi chú (Tùy chọn)</label>
                  <textarea className="po-input" placeholder="Ghi chú thêm cho phiếu nhập này..." value={poNote || ""} onChange={(e) => setPoNote(e.target.value)} style={{ flex: 1, resize: "none" }} />
                </div>
              </div>

              {/* CỘT PHẢI: BẢNG SẢN PHẨM & TỔNG TIỀN */}
              <div style={{ flex: 1, background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
                
                {/* Header Bảng */}
                <div style={{ flex: "none", padding: "16px 24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "15px", color: "#0f172a", fontWeight: "800" }}>Danh sách Sản Phẩm Sẽ Đặt</h3>
                  <span style={{ background: "#e2e8f0", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", color: "#475569" }}>{poItems?.length || 0} Sản phẩm</span>
                </div>
                
                {/* Table Scrollable Area */}
                <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 1 }}>
                      <tr style={{ color: "#64748b", textAlign: "left", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        <th style={{ padding: "14px 24px", fontWeight: "700", borderBottom: "2px solid #e2e8f0" }}>Sản phẩm</th>
                        <th style={{ padding: "14px 16px", textAlign: "center", width: "120px", fontWeight: "700", borderBottom: "2px solid #e2e8f0" }}>Số lượng</th>
                        <th style={{ padding: "14px 16px", textAlign: "right", width: "140px", fontWeight: "700", borderBottom: "2px solid #e2e8f0" }}>Giá nhập (đ)</th>
                        <th style={{ padding: "14px 24px", textAlign: "right", width: "150px", fontWeight: "700", borderBottom: "2px solid #e2e8f0" }}>Thành tiền</th>
                        <th style={{ padding: "14px 16px", textAlign: "center", width: "60px", fontWeight: "700", borderBottom: "2px solid #e2e8f0" }}>Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!poItems || poItems.length === 0) ? (
                        <tr><td colSpan={5} style={{ textAlign: "center", padding: "80px 20px", color: "#94a3b8" }}>
                          <div style={{ fontSize: "40px", marginBottom: "12px", opacity: 0.5 }}>🛒</div>
                          <div style={{ fontSize: "15px", fontWeight: "500" }}>Chưa có sản phẩm nào được chọn</div>
                          <div style={{ fontSize: "13px", marginTop: "4px" }}>Vui lòng tìm và chọn sản phẩm ở cột bên trái</div>
                        </td></tr>
                      ) : (
                        poItems.map((item: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "16px 24px" }}>
                              <div style={{ fontWeight: "700", color: "#1e293b", marginBottom: "4px" }}>{cleanName(item?.product?.name || "SP Không rõ")}</div>
                              <div style={{ fontSize: "12px", color: "#94a3b8", fontFamily: "monospace" }}>{item?.product?.product_code}</div>
                            </td>
                            <td style={{ padding: "16px 16px", textAlign: "center" }}>
                              <input type="number" className="po-table-input" style={{ textAlign: "center" }} value={item?.qty || 1} onChange={(e) => { const val = parseInt(e.target.value) || 1; setPoItems((poItems || []).map((i, ix) => (ix === idx ? { ...i, qty: val } : i))); }} min="1" />
                            </td>
                            <td style={{ padding: "16px 16px", textAlign: "right" }}>
                              <input type="number" className="po-table-input" style={{ textAlign: "right", color: "#10b981" }} value={item?.importPrice || 0} onChange={(e) => { const val = parseInt(e.target.value) || 0; setPoItems((poItems || []).map((i, ix) => (ix === idx ? { ...i, importPrice: val } : i))); }} min="0" />
                            </td>
                            <td style={{ padding: "16px 24px", fontWeight: "800", textAlign: "right", color: "#0f172a", fontSize: "15px" }}>{((item?.qty || 0) * (item?.importPrice || 0)).toLocaleString()}</td>
                            <td style={{ padding: "16px 16px", textAlign: "center" }}>
                              <button onClick={() => setPoItems((poItems || []).filter((_, ix) => ix !== idx))} style={{ background: "#fff", color: "#ef4444", border: "1px solid #fecaca", borderRadius: "8px", padding: "8px 10px", cursor: "pointer", transition: "0.2s", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }} onMouseOver={e=>e.currentTarget.style.background='#fef2f2'} onMouseOut={e=>e.currentTarget.style.background='#fff'}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Tổng kết - Ghim đáy */}
                <div style={{ flex: "none", background: "#f8fafc", padding: "24px", borderTop: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "700" }}>Tổng giá trị đơn hàng:</span>
                    <b style={{ fontSize: "26px", color: "#0f172a" }}>{(poItems || []).reduce((sum, item) => sum + (item?.qty || 0) * (item?.importPrice || 0), 0).toLocaleString()}đ</b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "700" }}>Đã trả trước cho NCC:</span>
                    <div style={{ position: "relative", width: "200px" }}>
                      <input type="number" className="po-input" style={{ paddingRight: "40px", textAlign: "right", fontWeight: "800", color: "#10b981", fontSize: "18px" }} value={paidAmount || 0} onChange={(e) => setPaidAmount(parseInt(e.target.value) || 0)} min="0" />
                      <span style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontWeight: "bold" }}>đ</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px dashed #cbd5e1" }}>
                    <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "700" }}>Công nợ sẽ ghi nhận:</span>
                    <b style={{ fontSize: "22px", color: "#ef4444" }}>{((poItems || []).reduce((sum, item) => sum + (item?.qty || 0) * (item?.importPrice || 0), 0) - (paidAmount || 0)).toLocaleString()}đ</b>
                  </div>
                  
                  {/* Nút hành động */}
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button onClick={handleExportDraft} style={{ flex: 1, padding: "16px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569", borderRadius: "10px", fontWeight: "800", fontSize: "14px", cursor: "pointer", transition: "0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }} onMouseOver={e=>e.currentTarget.style.background='#f1f5f9'} onMouseOut={e=>e.currentTarget.style.background='#ffffff'}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                      XUẤT NHÁP (EXCEL)
                    </button>
                    <button onClick={onSaveNewPO} disabled={loading || !poItems || poItems.length === 0} style={{ flex: 2, background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)", padding: "16px", opacity: !poItems || poItems.length === 0 ? 0.5 : 1, border: "none", borderRadius: "10px", color: "white", fontWeight: "800", fontSize: "14px", cursor: !poItems || poItems.length === 0 ? 'not-allowed' : 'pointer', display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "0.2s" }} onMouseOver={e=>{if(poItems?.length>0) e.currentTarget.style.transform='translateY(-2px)'}} onMouseOut={e=>{if(poItems?.length>0) e.currentTarget.style.transform='none'}}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                      {loading ? "ĐANG XỬ LÝ..." : "LƯU PHIẾU ĐẶT HÀNG"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ==================== TAB 2: TÌM & NHẬN HÀNG ==================== */}
          {poTab === "RECEIVE" && (
            <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <div style={{ textAlign: "center", color: "#94a3b8", padding: "40px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>⏳</div>
                <h3 style={{ fontSize: "20px", color: "#475569", marginBottom: "8px" }}>Tính năng đang được phát triển</h3>
                <p style={{ fontSize: "14px", lineHeight: "1.6" }}>Phần Đối soát & Nhận hàng sẽ sớm ra mắt trong bản cập nhật tới.<br/>Vui lòng sử dụng tab "Tạo PO Mới" để đặt hàng.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

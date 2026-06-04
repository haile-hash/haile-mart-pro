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

  // HÀM XUẤT EXCEL BẢN NHÁP NGAY TẠI TRẬN
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
    <div className="custom-modal-overlay no-print" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99999 }}>
      <div className="custom-modal-box" style={{ background: "#fff", width: "1100px", maxWidth: "95vw", height: "85vh", borderRadius: "16px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", flex: "0 0 auto" }}>
          <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a", display: "flex", alignItems: "center", gap: "10px" }}>
            📦 <span>QUẢN LÝ PHIẾU NHẬP (PO)</span>
          </h2>
          <button onClick={() => setShowPOModal(false)} style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#64748b", lineHeight: 1 }}>&times;</button>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: "10px", padding: "12px 24px", borderBottom: "1px solid #e2e8f0", background: "#ffffff", flex: "0 0 auto" }}>
          <button onClick={() => setPoTab("NEW")} style={{ padding: "10px 20px", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer", background: poTab === "NEW" ? "#3b82f6" : "#f1f5f9", color: poTab === "NEW" ? "white" : "#64748b", transition: "0.2s" }}>
            + TẠO PO MỚI (CHỜ NHẬN)
          </button>
          <button onClick={() => setPoTab("RECEIVE")} style={{ padding: "10px 20px", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer", background: poTab === "RECEIVE" ? "#10b981" : "#f1f5f9", color: poTab === "RECEIVE" ? "white" : "#64748b", transition: "0.2s" }}>
            📥 TÌM & NHẬN HÀNG
          </button>
        </div>

        {/* BODY */}
        <div style={{ display: "grid", gridTemplateColumns: "3.5fr 6.5fr", gap: "20px", background: "#f1f5f9", padding: "20px", flex: "1 1 auto", minHeight: 0 }}>
          
          {/* ==================== TAB 1: TẠO PO MỚI ==================== */}
          {poTab === "NEW" && (
            <>
              {/* CỘT TRÁI: NHẬP LIỆU */}
              <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto", height: "100%" }}>
                <div style={{ flex: "0 0 auto" }}>
                  <h3 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#475569", textTransform: "uppercase" }}>1. Chọn Nhà Cung Cấp</h3>
                  <select value={selectedSupplierId || ""} onChange={(e) => setSelectedSupplierId(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", fontWeight: "bold", color: "#1e293b", background: "#f8fafc" }}>
                    <option value="">-- Click để chọn NCC --</option>
                    {(suppliers || []).map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name} - {s.phone}</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: "0 0 auto" }}>
                  <h3 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#475569", textTransform: "uppercase" }}>2. Tìm Sản Phẩm</h3>
                  <input type="text" placeholder="Nhập tên hoặc mã SP..." value={poSearch || ""} onChange={(e) => setPoSearch(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", boxSizing: "border-box" }} />
                  <div style={{ maxHeight: "250px", overflowY: "auto", background: "#fff", border: (poSearch || "").trim() ? "1px solid #e2e8f0" : "none", borderRadius: "8px", marginTop: "8px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                    {(poSearch || "").trim() && (products || [])
                      .filter((p) => cleanName(p?.name || "").toLowerCase().includes(poSearch.toLowerCase()) || String(p?.product_code || "").toLowerCase().includes(poSearch.toLowerCase()))
                      .slice(0, 10)
                      .map((p) => (
                        <div key={p.id} onClick={() => {
                            const currentItems = poItems || [];
                            const exist = currentItems.find((i) => i?.product?.id === p.id);
                            if (exist) {
                              setPoItems(currentItems.map((i) => i?.product?.id === p.id ? { ...i, qty: (i.qty || 0) + 1 } : i));
                            } else {
                              setPoItems([{ product: p, qty: 1, importPrice: p.import_price || 0 }, ...currentItems]);
                            }
                            setPoSearch("");
                          }}
                          style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "0.2s" }}
                          onMouseOver={(e) => (e.currentTarget.style.background = "#eff6ff")} onMouseOut={(e) => (e.currentTarget.style.background = "white")}
                        >
                          <div style={{ fontWeight: "bold", color: "#0f172a", fontSize: "14px" }}>{cleanName(p?.name || "SP Không Rõ")}</div>
                          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Mã: {p?.product_code || "---"} | Giá nhập: {(p?.import_price || 0).toLocaleString()}đ</div>
                        </div>
                      ))}
                  </div>
                </div>

                <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "14px", color: "#475569", fontWeight: "bold", display: "block", marginBottom: "8px" }}>Ghi chú (Tùy chọn):</label>
                  <textarea placeholder="Ghi chú phiếu nhập..." value={poNote || ""} onChange={(e) => setPoNote(e.target.value)} style={{ width: "100%", flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", resize: "none", boxSizing: "border-box" }} />
                </div>
              </div>

              {/* CỘT PHẢI: BẢNG SẢN PHẨM */}
              <div style={{ background: "#fff", padding: "0", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
                <h3 style={{ margin: 0, padding: "16px 20px", fontSize: "15px", color: "#0f172a", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", flex: "0 0 auto" }}>Danh sách Sản Phẩm Sẽ Đặt</h3>
                
                {/* ĐÂY LÀ CHỖ ĐÃ ĐƯỢC FIX LẠI CSS ĐỂ KHÔNG BỊ XẸP */}
                <div style={{ flex: "1 1 auto", overflowY: "auto", minHeight: "150px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead style={{ position: "sticky", top: 0, background: "#f1f5f9", zIndex: 1 }}>
                      <tr style={{ color: "#475569", textAlign: "left" }}>
                        <th style={{ padding: "12px 16px" }}>Sản phẩm</th>
                        <th style={{ padding: "12px 16px", textAlign: "center", width: "100px" }}>Số lượng</th>
                        <th style={{ padding: "12px 16px", textAlign: "right", width: "120px" }}>Giá nhập (đ)</th>
                        <th style={{ padding: "12px 16px", textAlign: "right", width: "130px" }}>Thành tiền</th>
                        <th style={{ padding: "12px 16px", textAlign: "center", width: "60px" }}>Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!poItems || poItems.length === 0) ? (
                        <tr><td colSpan={5} style={{ textAlign: "center", padding: "60px", color: "#94a3b8", fontSize: "15px" }}>Chưa có sản phẩm nào được chọn</td></tr>
                      ) : (
                        poItems.map((item: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "12px 16px", fontWeight: "700", color: "#1e293b" }}>{cleanName(item?.product?.name || "SP Không rõ")}</td>
                            <td style={{ padding: "12px 16px", textAlign: "center" }}>
                              <input type="number" style={{ padding: "8px", width: "100%", textAlign: "center", border: "1px solid #cbd5e1", borderRadius: "6px", outline: "none", boxSizing: "border-box" }} value={item?.qty || 1} onChange={(e) => { const val = parseInt(e.target.value) || 1; setPoItems((poItems || []).map((i, ix) => (ix === idx ? { ...i, qty: val } : i))); }} min="1" />
                            </td>
                            <td style={{ padding: "12px 16px", textAlign: "right" }}>
                              <input type="number" style={{ padding: "8px", width: "100%", textAlign: "right", border: "1px solid #cbd5e1", borderRadius: "6px", outline: "none", boxSizing: "border-box" }} value={item?.importPrice || 0} onChange={(e) => { const val = parseInt(e.target.value) || 0; setPoItems((poItems || []).map((i, ix) => (ix === idx ? { ...i, importPrice: val } : i))); }} min="0" />
                            </td>
                            <td style={{ padding: "12px 16px", fontWeight: "bold", textAlign: "right", color: "#3b82f6", fontSize: "14px" }}>{((item?.qty || 0) * (item?.importPrice || 0)).toLocaleString()}</td>
                            <td style={{ padding: "12px 16px", textAlign: "center" }}>
                              <button onClick={() => setPoItems((poItems || []).filter((_, ix) => ix !== idx))} style={{ background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: "6px", padding: "6px 10px", cursor: "pointer", transition: "0.2s" }}>🗑️</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ flex: "0 0 auto", background: "#f8fafc", padding: "20px", borderTop: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "bold" }}>Tổng giá trị đơn hàng:</span>
                    <b style={{ fontSize: "24px", color: "#0f172a" }}>{(poItems || []).reduce((sum, item) => sum + (item?.qty || 0) * (item?.importPrice || 0), 0).toLocaleString()}đ</b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "bold" }}>Đã trả trước cho NCC:</span>
                    <input type="number" style={{ width: "180px", padding: "10px", textAlign: "right", fontWeight: "bold", color: "#10b981", fontSize: "16px", border: "2px solid #cbd5e1", borderRadius: "8px", outline: "none" }} value={paidAmount || 0} onChange={(e) => setPaidAmount(parseInt(e.target.value) || 0)} min="0" />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingTop: "12px", borderTop: "1px dashed #cbd5e1" }}>
                    <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "bold" }}>Công nợ sẽ ghi nhận:</span>
                    <b style={{ fontSize: "20px", color: "#ef4444" }}>{((poItems || []).reduce((sum, item) => sum + (item?.qty || 0) * (item?.importPrice || 0), 0) - (paidAmount || 0)).toLocaleString()}đ</b>
                  </div>
                  
                  {/* CỤM NÚT LƯU VÀ XUẤT */}
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={handleExportDraft} style={{ flex: 1, padding: "14px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569", borderRadius: "8px", fontWeight: "800", cursor: "pointer", transition: "0.2s" }} onMouseOver={e=>e.currentTarget.style.background='#f1f5f9'} onMouseOut={e=>e.currentTarget.style.background='#ffffff'}>
                      📥 XUẤT EXCEL (NHÁP)
                    </button>
                    <button onClick={onSaveNewPO} disabled={loading || !poItems || poItems.length === 0} style={{ flex: 2, background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)", padding: "14px", opacity: !poItems || poItems.length === 0 ? 0.6 : 1, border: "none", borderRadius: "8px", color: "white", fontWeight: "800", cursor: !poItems || poItems.length === 0 ? 'not-allowed' : 'pointer' }}>
                      {loading ? "ĐANG XỬ LÝ..." : "💾 LƯU PHIẾU ĐẶT HÀNG"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ==================== TAB 2: TÌM & NHẬN HÀNG ==================== */}
          {poTab === "RECEIVE" && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "100px", color: "#94a3b8", fontSize: "18px", fontStyle: "italic", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", height: "100%" }}>
              Tính năng Đối soát & Nhận hàng sẽ sớm được hoàn thiện. Vui lòng sử dụng tính năng "Tạo PO Mới".
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

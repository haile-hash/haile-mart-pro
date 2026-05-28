// @ts-nocheck
import React from "react";
import { cleanName } from "../../utils/helpers";

export const POModal = ({
  showPOModal,
  setShowPOModal,
  poTab,
  setPoTab,
  suppliers,
  selectedSupplierId,
  setSelectedSupplierId,
  poSearch,
  setPoSearch,
  poItems,
  setPoItems,
  products,
  poNote,
  setPoNote,
  paidAmount,
  setPaidAmount,
  searchPoCode,
  setSearchPoCode,
  foundPO,
  setFoundPO,
  receiveItems,
  setReceiveItems,
  allPOs,
  loading,
  onSaveNewPO,
  onConfirmReceipt,
  handlePrintPO
}) => {
  if (!showPOModal) return null;

  return (
    <div className="custom-modal-overlay">
      <div className="custom-modal-box" style={{ maxWidth: "1000px", height: "85vh" }}>
        <div className="custom-modal-header">
          <h2 className="custom-modal-title">📦 QUẢN LÝ PHIẾU NHẬP (PO)</h2>
          <button className="custom-modal-close" onClick={() => setShowPOModal(false)}>
            &times;
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            padding: "10px 15px",
            borderBottom: "1px solid #e2e8f0",
            background: "#f8fafc"
          }}
        >
          <button
            onClick={() => setPoTab("NEW")}
            className={`tab-btn ${poTab === "NEW" ? "active" : ""}`}
            style={{
              padding: "10px 20px",
              fontWeight: "bold",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              background: poTab === "NEW" ? "#3b82f6" : "#e2e8f0",
              color: poTab === "NEW" ? "white" : "#64748b"
            }}
          >
            + TẠO PO MỚI (CHỜ NHẬN)
          </button>
          <button
            onClick={() => setPoTab("RECEIVE")}
            className={`tab-btn ${poTab === "RECEIVE" ? "active" : ""}`}
            style={{
              padding: "10px 20px",
              fontWeight: "bold",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              background: poTab === "RECEIVE" ? "#3b82f6" : "#e2e8f0",
              color: poTab === "RECEIVE" ? "white" : "#64748b"
            }}
          >
            📥 TÌM & NHẬN HÀNG
          </button>
        </div>

        <div
          className="custom-modal-body"
          style={{
            display: "grid",
            gridTemplateColumns: "3.5fr 6.5fr",
            gap: "15px",
            background: "#f1f5f9",
            padding: "15px"
          }}
        >
          {/* ========================================== */}
          {/* TAB 1: TẠO PO MỚI */}
          {/* ========================================== */}
          {poTab === "NEW" && (
            <>
              {/* CỘT TRÁI: NHẬP LIỆU */}
              <div
                style={{
                  background: "#fff",
                  padding: "15px",
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  height: "fit-content"
                }}
              >
                <h3
                  style={{
                    margin: "0 0 15px 0",
                    fontSize: "15px",
                    color: "#1e293b",
                    borderBottom: "1px dashed #cbd5e1",
                    paddingBottom: "10px"
                  }}
                >
                  1. Chọn Nhà Cung Cấp
                </h3>
                <select
                  className="custom-input"
                  value={selectedSupplierId || ""}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  style={{ marginBottom: "24px" }}
                >
                  <option value="">-- Click để chọn NCC --</option>
                  {(suppliers || []).map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.phone}
                    </option>
                  ))}
                </select>

                <h3
                  style={{
                    margin: "0 0 15px 0",
                    fontSize: "15px",
                    color: "#1e293b",
                    borderBottom: "1px dashed #cbd5e1",
                    paddingBottom: "10px"
                  }}
                >
                  2. Tìm Sản Phẩm
                </h3>
                <input
                  type="text"
                  className="custom-input"
                  placeholder="Nhập tên hoặc mã SP..."
                  value={poSearch || ""}
                  onChange={(e) => setPoSearch(e.target.value)}
                />
                <div
                  style={{
                    maxHeight: "250px",
                    overflowY: "auto",
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    marginTop: "10px"
                  }}
                >
                  {(poSearch || "").trim() &&
                    (products || [])
                      .filter(
                        (p) =>
                          cleanName(p?.name || "").toLowerCase().includes(poSearch.toLowerCase()) ||
                          String(p?.product_code || "").toLowerCase().includes(poSearch.toLowerCase())
                      )
                      .slice(0, 10)
                      .map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            const currentItems = poItems || [];
                            const exist = currentItems.find((i) => i?.product?.id === p.id);
                            if (exist) {
                              setPoItems(
                                currentItems.map((i) =>
                                  i?.product?.id === p.id ? { ...i, qty: (i.qty || 0) + 1 } : i
                                )
                              );
                            } else {
                              setPoItems([{ product: p, qty: 1, importPrice: p.import_price || 0 }, ...currentItems]);
                            }
                            setPoSearch("");
                          }}
                          style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid #f1f5f9",
                            cursor: "pointer",
                            transition: "0.2s"
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.background = "#f8fafc")}
                          onMouseOut={(e) => (e.currentTarget.style.background = "white")}
                        >
                          <div style={{ fontWeight: "bold", color: "#0f172a", fontSize: "14px" }}>
                            {cleanName(p?.name || "SP Không Rõ")}
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                            Mã: {p?.product_code || "---"} | Giá nhập: {(p?.import_price || 0).toLocaleString()}đ
                          </div>
                        </div>
                      ))}
                </div>

                <div style={{ marginTop: "24px" }}>
                  <label className="custom-label">Ghi chú (Tùy chọn):</label>
                  <textarea
                    className="custom-input"
                    placeholder="Ghi chú phiếu..."
                    value={poNote || ""}
                    onChange={(e) => setPoNote(e.target.value)}
                    rows={3}
                    style={{ resize: "vertical", marginTop: "4px" }}
                  />
                </div>
              </div>

              {/* CỘT PHẢI: BẢNG SẢN PHẨM */}
              <div
                style={{
                  background: "#fff",
                  padding: "15px",
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  display: "flex",
                  flexDirection: "column",
                  height: "fit-content",
                  minHeight: "100%"
                }}
              >
                <h3
                  style={{
                    margin: "0 0 15px 0",
                    fontSize: "15px",
                    color: "#1e293b",
                    borderBottom: "1px dashed #cbd5e1",
                    paddingBottom: "10px"
                  }}
                >
                  Danh sách Sản Phẩm Sẽ Đặt
                </h3>
                <div style={{ flex: 1, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                  <table className="modern-table" style={{ margin: 0 }}>
                    <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                      <tr>
                        <th>Sản phẩm</th>
                        <th style={{ textAlign: "center" }}>Số lượng</th>
                        <th style={{ textAlign: "right" }}>Giá nhập (đ)</th>
                        <th style={{ textAlign: "right" }}>Thành tiền</th>
                        <th style={{ textAlign: "center" }}>Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!poItems || poItems.length === 0) && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                            Chưa có sản phẩm nào được chọn
                          </td>
                        </tr>
                      )}
                      {(poItems || []).map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: "600", color: "#0f172a" }}>
                            {cleanName(item?.product?.name || "SP Không rõ")}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="number"
                              className="custom-input"
                              style={{ padding: "6px", width: "70px", textAlign: "center" }}
                              value={item?.qty || 1}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                setPoItems((poItems || []).map((i, ix) => (ix === idx ? { ...i, qty: val } : i)));
                              }}
                              min="1"
                            />
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <input
                              type="number"
                              className="custom-input"
                              style={{ padding: "6px", width: "110px", textAlign: "right" }}
                              value={item?.importPrice || 0}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setPoItems((poItems || []).map((i, ix) => (ix === idx ? { ...i, importPrice: val } : i)));
                              }}
                              min="0"
                            />
                          </td>
                          <td style={{ fontWeight: "bold", textAlign: "right", color: "#3b82f6" }}>
                            {((item?.qty || 0) * (item?.importPrice || 0)).toLocaleString()}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              onClick={() => setPoItems((poItems || []).filter((_, ix) => ix !== idx))}
                              style={{
                                background: "none",
                                color: "#ef4444",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "20px"
                              }}
                            >
                              &times;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    padding: "20px",
                    borderRadius: "10px",
                    marginTop: "24px",
                    border: "1px solid #e2e8f0"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                    <span style={{ fontSize: "16px", color: "#475569" }}>Tổng giá trị đơn hàng:</span>
                    <b style={{ fontSize: "22px", color: "#0f172a" }}>
                      {(poItems || [])
                        .reduce((sum, item) => sum + (item?.qty || 0) * (item?.importPrice || 0), 0)
                        .toLocaleString()}
                      đ
                    </b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                    <span style={{ fontSize: "15px", color: "#475569" }}>Đã trả trước cho NCC:</span>
                    <input
                      type="number"
                      className="custom-input"
                      style={{ width: "200px", textAlign: "right", fontWeight: "bold", color: "#10b981", fontSize: "16px" }}
                      value={paidAmount || 0}
                      onChange={(e) => setPaidAmount(parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "20px",
                      paddingTop: "15px",
                      borderTop: "1px dashed #cbd5e1"
                    }}
                  >
                    <span style={{ fontSize: "16px", color: "#475569", fontWeight: "bold" }}>Công nợ sẽ ghi nhận:</span>
                    <b style={{ fontSize: "20px", color: "#ef4444" }}>
                      {(
                        (poItems || []).reduce((sum, item) => sum + (item?.qty || 0) * (item?.importPrice || 0), 0) -
                        (paidAmount || 0)
                      ).toLocaleString()}
                      đ
                    </b>
                  </div>
                  <button
                    className="gradient-btn"
                    onClick={onSaveNewPO}
                    disabled={loading || !poItems || poItems.length === 0}
                    style={{
                      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                      boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
                      padding: "16px",
                      fontSize: "16px",
                      opacity: !poItems || poItems.length === 0 ? 0.6 : 1,
                      width: "100%",
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    {loading ? "ĐANG LƯU..." : "💾 LƯU PHIẾU ĐẶT HÀNG"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ========================================== */}
          {/* TAB 2: TÌM & NHẬN HÀNG */}
          {/* ========================================== */}
          {poTab === "RECEIVE" && (
            <>
              {/* CỘT TRÁI: DANH SÁCH PO */}
              <div
                style={{
                  background: "#fff",
                  padding: "15px",
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  display: "flex",
                  flexDirection: "column",
                  height: "fit-content"
                }}
              >
                <h3
                  style={{
                    margin: "0 0 15px 0",
                    fontSize: "15px",
                    color: "#1e293b",
                    borderBottom: "1px dashed #cbd5e1",
                    paddingBottom: "10px"
                  }}
                >
                  1. Danh sách Phiếu Nhập
                </h3>
                <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                  <input
                    type="text"
                    className="custom-input"
                    placeholder="Nhập mã PO để lọc..."
                    value={searchPoCode || ""}
                    onChange={(e) => setSearchPoCode(e.target.value)}
                  />
                </div>

                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    minHeight: "200px"
                  }}
                >
                  <table className="modern-table" style={{ margin: 0, fontSize: "12px" }}>
                    <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                      <tr>
                        <th>Mã PO</th>
                        <th>Nhà Cung Cấp</th>
                        <th>Trạng thái</th>
                        <th style={{ textAlign: "center" }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!allPOs || allPOs.length === 0) && !loading && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>
                            Chưa có phiếu nhập nào
                          </td>
                        </tr>
                      )}
                      {(allPOs || [])
                        .filter((p) => (p?.po_code || "").toLowerCase().includes((searchPoCode || "").toLowerCase()))
                        .map((po) => (
                          <tr key={po.id} style={{ background: po.id === foundPO?.id ? "#eff6ff" : "transparent" }}>
                            <td style={{ fontWeight: "bold", color: "#3b82f6" }}>{po?.po_code || "---"}</td>
                            <td
                              style={{
                                maxWidth: "100px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                              }}
                              title={po?.supplier?.name || "Không rõ"}
                            >
                              {po?.supplier?.name || "Không rõ"}
                            </td>
                            <td>
                              <span
                                style={{
                                  color: po?.status === "PENDING" ? "#d97706" : "#059669",
                                  padding: "4px 8px",
                                  background: po?.status === "PENDING" ? "#fef3c7" : "#d1fae5",
                                  borderRadius: "4px",
                                  fontWeight: "bold",
                                  fontSize: "11px"
                                }}
                              >
                                {po?.status === "PENDING" ? "Chờ nhận" : "Hoàn tất"}
                              </span>
                            </td>
                            <td style={{ textAlign: "center", display: "flex", justifyContent: "center", gap: "6px" }}>
                              <button
                                onClick={() => {
                                  setFoundPO(po);
                                  setSearchPoCode(po?.po_code || "");
                                  setReceiveItems((po?.items || []).map((i: any) => ({ ...i, damagedQty: 0 })));
                                }}
                                style={{
                                  padding: "6px 12px",
                                  background: "#0f172a",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "11px",
                                  fontWeight: "bold"
                                }}
                              >
                                CHỌN
                              </button>
                              <button
                                onClick={() => handlePrintPO(po, "po_order")}
                                style={{
                                  padding: "6px 12px",
                                  background: "#3b82f6",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "11px",
                                  fontWeight: "bold"
                                }}
                              >
                                🖨️ IN PO
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {foundPO && (
                  <div
                    style={{
                      marginTop: "15px",
                      padding: "16px",
                      background: "#f8fafc",
                      borderRadius: "10px",
                      border: "1px dashed #cbd5e1"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", gap: "10px" }}>
                          <span style={{ color: "#64748b", fontSize: "13px" }}>Số PO:</span>
                          <span style={{ fontWeight: "bold", color: "#3b82f6", fontSize: "13px" }}>
                            {foundPO?.po_code || "---"}
                          </span>
                        </div>
                        <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", gap: "10px" }}>
                          <span style={{ color: "#64748b", fontSize: "13px" }}>Nhà Cung Cấp:</span>
                          <span style={{ fontWeight: "bold", color: "#0f172a", fontSize: "13px" }}>
                            {foundPO?.supplier?.name || "Không rõ"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePrintPO(foundPO, "po_order")}
                        style={{
                          padding: "10px 15px",
                          background: "#0f172a",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        🖨️ In Phiếu PO
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* CỘT PHẢI: NHẬP KHO */}
              <div
                style={{
                  background: "#fff",
                  padding: "15px",
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  display: "flex",
                  flexDirection: "column",
                  height: "fit-content",
                  minHeight: "100%"
                }}
              >
                <h3
                  style={{
                    margin: "0 0 15px 0",
                    fontSize: "15px",
                    color: "#1e293b",
                    borderBottom: "1px dashed #cbd5e1",
                    paddingBottom: "10px"
                  }}
                >
                  2. Đối Soát Hàng & Nhập Kho
                </h3>
                {foundPO ? (
                  foundPO.status === "COMPLETED" ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "30px",
                        background: "#ecfdf5",
                        borderRadius: "12px",
                        border: "1px solid #a7f3d0",
                        marginTop: "15px"
                      }}
                    >
                      <div style={{ color: "#059669", fontWeight: "bold", fontSize: "16px", marginBottom: "15px" }}>
                        ✅ PHIẾU NÀY ĐÃ ĐƯỢC ĐỐI SOÁT & NHẬP KHO XONG!
                      </div>
                      <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => handlePrintPO(foundPO, "po_receipt")}
                          style={{
                            padding: "10px 15px",
                            background: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            boxShadow: "0 2px 4px rgba(16,185,129,0.3)",
                            fontSize: "13px"
                          }}
                        >
                          🖨️ In Phiếu Nhập
                        </button>
                        {(foundPO?.items || []).some((i: any) => (i?.damagedQty || 0) > 0) && (
                          <button
                            onClick={() => handlePrintPO(foundPO, "po_return")}
                            style={{
                              padding: "10px 15px",
                              background: "#ef4444",
                              color: "white",
                              border: "none",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontWeight: "bold",
                              boxShadow: "0 2px 4px rgba(239,68,68,0.3)",
                              fontSize: "13px"
                            }}
                          >
                            🖨️ In Phiếu Trả
                          </button>
                        )}
                        <button
                          onClick={() => setShowPOModal(false)}
                          style={{
                            padding: "10px 15px",
                            background: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            boxShadow: "0 2px 4px rgba(59,130,246,0.3)",
                            fontSize: "13px"
                          }}
                        >
                          📦 Về Kho
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ flex: 1, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                        <table className="modern-table" style={{ margin: 0 }}>
                          <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                            <tr>
                              <th style={{ textAlign: "left" }}>Sản phẩm</th>
                              <th style={{ textAlign: "center" }}>SL Đã Đặt</th>
                              <th style={{ textAlign: "center" }}>Hàng Hỏng/Lỗi</th>
                              <th style={{ textAlign: "center" }}>SL Sẽ Nhập</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(!receiveItems || receiveItems.length === 0) && (
                              <tr>
                                <td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>
                                  Chưa có chi tiết sản phẩm
                                </td>
                              </tr>
                            )}
                            {(receiveItems || []).map((item, idx) => (
                              <tr key={idx}>
                                <td style={{ fontWeight: "600", color: "#0f172a" }}>
                                  {cleanName(item?.product?.name || "SP Không rõ")}
                                </td>
                                <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "16px", color: "#3b82f6" }}>
                                  {item?.qty || 0}
                                </td>
                                <td style={{ textAlign: "center" }}>
                                  <input
                                    type="number"
                                    className="custom-input"
                                    style={{
                                      padding: "6px",
                                      width: "90px",
                                      textAlign: "center",
                                      color: "#ef4444",
                                      fontWeight: "bold",
                                      borderColor: (item?.damagedQty || 0) > 0 ? "#ef4444" : "#cbd5e1"
                                    }}
                                    value={item?.damagedQty || 0}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      if (val <= (item?.qty || 0) && val >= 0)
                                        setReceiveItems(
                                          (receiveItems || []).map((i, ix) =>
                                            ix === idx ? { ...i, damagedQty: val } : i
                                          )
                                        );
                                    }}
                                    min="0"
                                    max={item?.qty || 0}
                                  />
                                </td>
                                <td style={{ textAlign: "center", fontWeight: "bold", color: "#10b981", fontSize: "18px" }}>
                                  {(item?.qty || 0) - (item?.damagedQty || 0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div
                        style={{
                          background: "#f8fafc",
                          padding: "20px",
                          borderRadius: "10px",
                          marginTop: "24px",
                          border: "1px solid #e2e8f0"
                        }}
                      >
                        <p style={{ fontStyle: "italic", color: "#64748b", margin: "0 0 15px 0", fontSize: "13px", lineHeight: "1.5" }}>
                          * Hệ thống sẽ tự động đối soát, cộng kho hàng thực tế và hoàn trả tiền công nợ hàng hỏng cho Nhà Cung Cấp.
                        </p>
                        <button
                          className="gradient-btn"
                          onClick={onConfirmReceipt}
                          disabled={loading || !receiveItems || receiveItems.length === 0}
                          style={{
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                            padding: "16px",
                            fontSize: "16px",
                            opacity: (!receiveItems || receiveItems.length === 0) ? 0.6 : 1,
                            width: "100%",
                            border: "none",
                            borderRadius: "8px",
                            color: "white",
                            fontWeight: "bold",
                            cursor: "pointer"
                          }}
                        >
                          {loading ? "ĐANG XỬ LÝ..." : "✅ XÁC NHẬN NHẬN HÀNG"}
                        </button>
                      </div>
                    </>
                  )
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "60px 20px",
                      color: "#94a3b8",
                      border: "2px dashed #cbd5e1",
                      borderRadius: "12px",
                      background: "#f8fafc",
                      marginTop: "20px"
                    }}
                  >
                    Vui lòng chọn một Phiếu Nhập (PO) từ danh sách bên trái để tiếp tục.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

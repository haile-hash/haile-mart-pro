import React from "react";

interface HistoryPanelProps {
  logSearchTerm: string;
  setLogSearchTerm: (val: string) => void;
  logTypeFilter: string;
  setLogTypeFilter: (val: string) => void;
  exportToCSV: () => void;
  groupedHistory: Record<string, any[]>;
  expandedDates: Record<string, boolean>;
  toggleDateGroup: (dateStr: string) => void;
  handleRefund: (logId: any) => void;
  handleReprint: (timeStr: string) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  logSearchTerm,
  setLogSearchTerm,
  logTypeFilter,
  setLogTypeFilter,
  exportToCSV,
  groupedHistory,
  expandedDates,
  toggleDateGroup,
  handleRefund,
  handleReprint,
}) => {
  return (
    <div className="glass" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px", background: "rgba(255, 255, 255, 0.85)" }}>
      
      {/* --- THANH BỘ LỌC CHUẨN ĐẸP, THOÁNG ĐÃNG --- */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input
            type="text"
            className="custom-input"
            style={{ padding: "10px 12px 10px 36px", margin: 0, fontSize: "14px", width: "100%" }}
            placeholder="Tìm giao dịch..."
            value={logSearchTerm}
            onChange={(e) => setLogSearchTerm(e.target.value)}
          />
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "14px" }}>🔍</span>
        </div>

        <select
          className="custom-input"
          style={{ width: "120px", padding: "10px", margin: 0, fontSize: "14px", cursor: "pointer", height: "42px" }}
          value={logTypeFilter}
          onChange={(e) => setLogTypeFilter(e.target.value)}
        >
          <option value="Tất cả">Tất cả</option>
          <option value="BÁN">BÁN</option>
          <option value="NHẬP">NHẬP</option>
          <option value="NHẬP PO">NHẬP PO</option>
          <option value="TRẢ HÀNG">TRẢ HÀNG</option>
          <option value="THU NỢ">THU NỢ</option>
          <option value="GHI NỢ">GHI NỢ</option>
        </select>

        <button
          onClick={exportToCSV}
          style={{
            padding: "0 16px",
            height: "42px",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 2px 6px rgba(16,185,129,0.2)",
            whiteSpace: "nowrap"
          }}
        >
          📊 EXCEL
        </button>
      </div>

      {/* --- DANH SÁCH LỊCH SỬ SỬA LỖI CO RÚT KHUNG --- */}
      <div style={{ maxHeight: "420px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", paddingRight: "4px" }}>
        {Object.keys(groupedHistory).length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 10px", color: "#94a3b8", fontSize: "14px", fontStyle: "italic" }}>
            Không tìm thấy lịch sử giao dịch phù hợp
          </div>
        ) : (
          Object.entries(groupedHistory).map(([dateStr, logs]) => {
            const isExpanded = expandedDates[dateStr] !== false;
            
            return (
              <div key={dateStr} style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", background: "#ffffff", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                
                {/* Tiêu đề Ngày (Thoáng, to, rõ ràng) */}
                <div
                  onClick={() => toggleDateGroup(dateStr)}
                  style={{
                    padding: "12px 16px",
                    background: "#f8fafc",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    borderBottom: isExpanded ? "1px solid #e2e8f0" : "none",
                    userSelect: "none",
                    transition: "background 0.2s"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "#f1f5f9"}
                  onMouseOut={(e) => e.currentTarget.style.background = "#f8fafc"}
                >
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#334155", display: "flex", alignItems: "center", gap: "6px" }}>
                    📅 Ngày {dateStr}
                  </span>
                  <span style={{ fontSize: "12px", color: "#64748b", background: "#edf2f7", padding: "3px 8px", borderRadius: "12px", fontWeight: "600" }}>
                    {logs.length} giao dịch {isExpanded ? "▲" : "▼"}
                  </span>
                </div>

                {/* Danh sách các đơn hàng con bên trong */}
                {isExpanded && (
                  <div style={{ display: "flex", flexDirection: "column", background: "#ffffff" }}>
                    {logs.map((log: any) => {
                      const isRefund = log.type === "TRẢ HÀNG";
                      
                      return (
                        <div
                          key={log.id}
                          style={{
                            padding: "14px 16px",
                            borderBottom: "1px solid #f1f5f9",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            minHeight: "85px", /* Ép cố định chiều cao tối thiểu chống sập khung */
                            boxSizing: "border-box"
                          }}
                        >
                          {/* Dòng 1: Khách hàng & Thời gian */}
                          <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: "12px" }}>
                            <span style={{ fontWeight: "500" }}>👤 {log.customer || "Khách lẻ"}</span>
                            <span style={{ fontFamily: "monospace" }}>🕒 {log.t || log.time?.split(" ")[1] || log.time}</span>
                          </div>

                          {/* Dòng 2: Nội dung sản phẩm & Số tiền phân biệt màu sắc công khai */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                            <span style={{ fontSize: "14px", fontWeight: "600", color: isRefund ? "#ef4444" : "#1e293b", flex: 1, lineHeight: "1.4" }}>
                              {isRefund ? (
                                <span>[TRẢ HÀNG] {log.name}</span>
                              ) : (
                                <span>[{log.type}] {log.name} <span style={{ color: "#2563eb", fontWeight: "bold" }}>x{log.qty}</span></span>
                              )}
                            </span>
                            <span style={{ fontSize: "14px", fontWeight: "700", color: isRefund ? "#ef4444" : "#10b981", whiteSpace: "nowrap" }}>
                              {isRefund ? "-" : "+"}{Math.abs(log.total).toLocaleString()}đ
                              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "500" }}>
                                {" "}({log.paymentMethod || "TM"})
                              </span>
                            </span>
                          </div>

                          {/* Dòng 3: Cụm nút tác vụ Hoàn đơn / In sao lưu */}
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
                            {log.type === "BÁN" && (
                              <button
                                onClick={() => handleRefund(log.id)}
                                style={{
                                  padding: "5px 10px",
                                  background: "#fee2e2",
                                  color: "#ef4444",
                                  border: "1px solid #fca5a5",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                  cursor: "pointer",
                                  transition: "all 0.2s"
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = "#fecaca"}
                                onMouseOut={(e) => e.currentTarget.style.background = "#fee2e2"}
                              >
                                ↩️ Hoàn đơn ({log.qty})
                              </button>
                            )}
                            {(log.type === "BÁN" || log.type === "GHI NỢ") && (
                              <button
                                onClick={() => handleReprint(log.time)}
                                style={{
                                  padding: "5px 10px",
                                  background: "#f1f5f9",
                                  color: "#475569",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                  cursor: "pointer",
                                  transition: "all 0.2s"
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = "#e2e8f0"}
                                onMouseOut={(e) => e.currentTarget.style.background = "#f1f5f9"}
                              >
                                🖨️ In lại
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

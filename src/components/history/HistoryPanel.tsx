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
    <div className="glass" style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
      
      {/* Thanh bộ lọc và tìm kiếm giao dịch */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input
            type="text"
            className="custom-input"
            style={{ padding: "10px 12px 10px 32px", margin: 0, fontSize: "14px" }}
            placeholder="Tìm giao dịch..."
            value={logSearchTerm}
            onChange={(e) => setLogSearchTerm(e.target.value)}
          />
          <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
        </div>

        <select
          className="custom-input"
          style={{ width: "110px", padding: "10px", margin: 0, fontSize: "14px", cursor: "pointer" }}
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
            padding: "10px 15px",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            boxShadow: "0 2px 6px rgba(16,185,129,0.2)"
          }}
        >
          📊 EXCEL
        </button>
      </div>

      {/* Danh sách lịch sử giao dịch cuộn mượt */}
      <div style={{ maxHeight: "380px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
        {Object.keys(groupedHistory).length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8", fontSize: "14px" }}>
            Không tìm thấy lịch sử giao dịch phù hợp
          </div>
        ) : (
          Object.entries(groupedHistory).map(([dateStr, logs]) => {
            const isExpanded = expandedDates[dateStr] !== false; // Mặc định mở ra công khai
            
            return (
              <div key={dateStr} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", background: "#ffffff" }}>
                {/* Header ngày tháng tiêu đề hàng */}
                <div
                  onClick={() => toggleDateGroup(dateStr)}
                  style={{
                    padding: "10px 12px",
                    background: "#f8fafc",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    borderBottom: isExpanded ? "1px solid #e2e8f0" : "none",
                    userSelect: "none"
                  }}
                >
                  <strong style={{ fontSize: "13px", color: "#334155" }}>📅 Ngày {dateStr}</strong>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    {logs.length} giao dịch {isExpanded ? "▲" : "▼"}
                  </span>
                </div>

                {/* Nội dung chi tiết các dòng giao dịch nội bộ */}
                {isExpanded && (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {logs.map((log: any) => {
                      const isRefund = log.type === "TRẢ HÀNG";
                      
                      return (
                        <div
                          key={log.id}
                          style={{
                            padding: "10px 12px",
                            borderBottom: "1px solid #f1f5f9",
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            fontSize: "13px"
                          }}
                        >
                          {/* Dòng 1: Tên khách hàng & Thời gian lưu hành */}
                          <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: "12px" }}>
                            <span>👤 {log.customer || "Khách lẻ"}</span>
                            <span>🕒 {log.t || log.time?.split(" ")[1] || log.time}</span>
                          </div>

                          {/* Dòng 2: Nội dung giao dịch & Số tiền đối soát màu sắc biệt lập */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                            <span style={{ fontWeight: "600", color: isRefund ? "#ef4444" : "#1e293b", flex: 1 }}>
                              {isRefund ? (
                                <span style={{ color: "#ef4444" }}>[TRẢ HÀNG] {log.name}</span>
                              ) : (
                                <span>[{log.type}] {log.name} x{log.qty}</span>
                              )}
                            </span>
                            <span style={{ fontWeight: "bold", color: isRefund ? "#ef4444" : "#10b981", whiteSpace: "nowrap" }}>
                              {log.total.toLocaleString()}đ
                              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "normal" }}>
                                {" "}({log.paymentMethod || "TM"})
                              </span>
                            </span>
                          </div>

                          {/* Dòng 3: Cụm nút tác vụ Hoàn đơn / In lại biên lai */}
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
                            {log.type === "BÁN" && (
                              <button
                                onClick={() => handleRefund(log.id)}
                                style={{
                                  padding: "4px 8px",
                                  background: "#fee2e2",
                                  color: "#ef4444",
                                  border: "1px solid #fca5a5",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                  cursor: "pointer"
                                }}
                              >
                                ↩️ Hoàn đơn ({log.qty})
                              </button>
                            )}
                            {(log.type === "BÁN" || log.type === "GHI NỢ") && (
                              <button
                                onClick={() => handleReprint(log.time)}
                                style={{
                                  padding: "4px 8px",
                                  background: "#f1f5f9",
                                  color: "#475569",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                  cursor: "pointer"
                                }}
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

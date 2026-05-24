import React, { useState } from "react";
import { cleanName } from "../../utils/helpers";

// ==========================================
// 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (TYPES)
// ==========================================
export type TransactionType = "BÁN" | "NHẬP" | "NHẬP PO" | "TRẢ HÀNG" | "THU NỢ" | "GHI NỢ";

export interface TransactionLog {
  id: string | number;
  type: TransactionType;
  customer?: string;
  order_id?: string;
  t?: string;
  time?: string;
  name: string;
  total: number;
  paymentMethod?: string;
  qty?: number;
}

interface HistoryPanelProps {
  logSearchTerm: string;
  setLogSearchTerm: (val: string) => void;
  logTypeFilter: string;
  setLogTypeFilter: (val: string) => void;
  exportToCSV: () => void;
  groupedHistory: Record<string, TransactionLog[]>;
  handleRefund: (logId: string | number) => void;
  handleReprint: (timeStr: string) => void;
}

// ==========================================
// 2. HẰNG SỐ (CONSTANTS)
// ==========================================
const LOG_TYPES: TransactionType[] = ["BÁN", "NHẬP", "NHẬP PO", "TRẢ HÀNG", "THU NỢ", "GHI NỢ"];

// ==========================================
// 3. COMPONENT CHÍNH
// ==========================================
export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  logSearchTerm,
  setLogSearchTerm,
  logTypeFilter,
  setLogTypeFilter,
  exportToCSV,
  groupedHistory,
  handleRefund,
  handleReprint,
}) => {
  const [localExpanded, setLocalExpanded] = useState<Record<string, boolean>>({});

  const toggleGroup = (dateStr: string) => {
    setLocalExpanded(prev => ({
      ...prev,
      [dateStr]: !(prev[dateStr] ?? true)
    }));
  };

  // --- Hàm Render từng giao dịch (Tách ra cho gọn code) ---
  const renderTransactionItem = (log: TransactionLog) => {
    const isRefund = log.type === "TRẢ HÀNG";
    const logTime = log.t || log.time?.split(" ")[1] || log.time;
    
    // Logic lấy màu sắc
    let typeColor = "#2563eb"; // Mặc định cho "BÁN"
    if (isRefund) typeColor = "#dc2626"; 
    if (log.type.includes("NHẬP")) typeColor = "#7c3aed"; 
    if (log.type === "GHI NỢ" || log.type === "THU NỢ") typeColor = "#d97706";

    return (
      <div 
        key={log.id} 
        style={{ 
          flexShrink: 0, 
          padding: "12px", 
          borderBottom: "1px solid #f1f5f9", 
          display: "flex", 
          flexDirection: "column", 
          gap: "6px", 
          background: isRefund ? "#fff5f5" : "transparent" 
        }}
      >
        {/* Dòng 1: Khách hàng & Thời gian */}
        <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: "12px" }}>
          <span>
            <span role="img" aria-label="user">👤</span> {log.customer || "Khách lẻ"} 
            {log.order_id && <b style={{ color: '#3b82f6', marginLeft: '6px' }}>({log.order_id})</b>}
          </span>
          <span style={{ fontFamily: "monospace" }}>
            <span role="img" aria-label="time">🕒</span> {logTime}
          </span>
        </div>

        {/* Dòng 2: Tên mặt hàng & Số tiền */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b", lineHeight: "1.4" }}>
            <span style={{ color: typeColor, marginRight: "6px", fontWeight: "bold" }}>[{log.type}]</span>
            {cleanName(log.name)}
          </span>
          <span style={{ fontSize: "13px", fontWeight: "700", color: isRefund ? "#dc2626" : "#10b981", whiteSpace: "nowrap" }}>
            {isRefund ? "" : "+"}{log.total.toLocaleString('vi-VN')}đ
            <span style={{ fontSize: "11px", color: "#475569", fontWeight: "normal" }}> ({log.paymentMethod || "TM"})</span>
          </span>
        </div>

        {/* Dòng 3: Các nút thao tác */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", marginTop: "2px" }}>
          {(log.type === "BÁN" || log.type === "GHI NỢ") && (
            <button 
              onClick={(e) => { e.stopPropagation(); handleRefund(log.id); }} 
              style={{ padding: "4px 8px", background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
            >
              <span role="img" aria-label="refund">↩️</span> Hoàn đơn ({log.qty || 0})
            </button>
          )}
          {(log.type === "BÁN" || log.type === "GHI NỢ" || log.type === "TRẢ HÀNG") && log.time && (
            <button 
              onClick={(e) => { e.stopPropagation(); handleReprint(log.time!); }} 
              style={{ padding: "4px 8px", background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
            >
              <span role="img" aria-label="print">🖨️</span> In lại bill
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="glass" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px", background: "#ffffff", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
      
      {/* KHU VỰC BỘ LỌC & TÌM KIẾM */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input
            type="text"
            className="custom-input"
            style={{ padding: "10px 12px 10px 34px", margin: 0, fontSize: "14px", width: "100%", boxSizing: "border-box" }}
            placeholder="Tìm giao dịch..."
            value={logSearchTerm}
            onChange={(e) => setLogSearchTerm(e.target.value)}
          />
          <span role="img" aria-label="search" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
            🔍
          </span>
        </div>

        <select
          className="custom-input"
          style={{ width: "110px", padding: "10px", margin: 0, fontSize: "14px", height: "40px", cursor: "pointer" }}
          value={logTypeFilter}
          onChange={(e) => setLogTypeFilter(e.target.value)}
        >
          <option value="Tất cả">Tất cả</option>
          {LOG_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <button
          onClick={exportToCSV}
          style={{
            padding: "0 12px",
            height: "40px",
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
            boxShadow: "0 2px 6px rgba(16,185,129,0.2)",
            whiteSpace: "nowrap"
          }}
        >
          <span role="img" aria-label="excel">📊</span> EXCEL
        </button>
      </div>

      {/* KHU VỰC DANH SÁCH GIAO DỊCH */}
      <div style={{ maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "2px" }}>
        {Object.keys(groupedHistory).length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8", fontSize: "14px", fontStyle: "italic" }}>
            Không tìm thấy lịch sử giao dịch phù hợp
          </div>
        ) : (
          Object.entries(groupedHistory).map(([dateStr, logs]) => {
            const isExpanded = localExpanded[dateStr] ?? true; 
            
            return (
              <div key={dateStr} style={{ flexShrink: 0, display: "flex", flexDirection: "column", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#ffffff", overflow: "hidden" }}>
                
                {/* Header Nhóm Ngày */}
                <div
                  onClick={() => toggleGroup(dateStr)}
                  style={{
                    padding: "12px",
                    background: "#f8fafc",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    borderBottom: isExpanded ? "1px solid #e2e8f0" : "none",
                    userSelect: "none"
                  }}
                >
                  <strong style={{ fontSize: "13px", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span role="img" aria-label="calendar">📅</span> Ngày {dateStr}
                  </strong>
                  <span style={{ fontSize: "12px", color: "#4b5563", background: "#e5e7eb", padding: "2px 8px", borderRadius: "10px", fontWeight: "600" }}>
                    {logs.length} đơn {isExpanded ? "▲" : "▼"}
                  </span>
                </div>

                {/* Danh sách các item bên trong */}
                {isExpanded && (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {logs.map(log => renderTransactionItem(log))}
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

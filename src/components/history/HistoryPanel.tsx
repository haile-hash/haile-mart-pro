import React, { useState, useMemo, useEffect } from "react";
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
  onPrintK80?: (log: any) => void;
  onPrintA4?: (log: any) => void;
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
  onPrintK80,
  onPrintA4,
  logSearchTerm,
  setLogSearchTerm,
  logTypeFilter,
  setLogTypeFilter,
  exportToCSV,
  groupedHistory,
  handleRefund,
}) => {
  const [localExpanded, setLocalExpanded] = useState<Record<string, boolean>>({});
  
  // STATE KIỂM SOÁT SỐ LƯỢNG HIỂN THỊ (PHÂN TRANG RAM)
  const [visibleCount, setVisibleCount] = useState(50);

  // Reset về 50 mỗi khi người dùng gõ tìm kiếm hoặc đổi bộ lọc
  useEffect(() => {
    setVisibleCount(50);
  }, [groupedHistory]);

  // Gom toàn bộ lịch sử thành 1 mảng phẳng để dễ truy vấn số lượng hoàn
  const allLogs = useMemo(() => {
    const flat: TransactionLog[] = [];
    Object.values(groupedHistory).forEach(logs => flat.push(...logs));
    return flat;
  }, [groupedHistory]);

  // THUẬT TOÁN ÉP PHẲNG & CẮT TỈA 50 DÒNG (BẢO VỆ RAM)
  const { visibleGrouped, totalLogs } = useMemo(() => {
    const flatLogs: { dateStr: string; log: TransactionLog }[] = [];
    Object.entries(groupedHistory).forEach(([dateStr, logs]) => {
      logs.forEach(log => flatLogs.push({ dateStr, log }));
    });

    const total = flatLogs.length;
    const slicedLogs = flatLogs.slice(0, visibleCount);

    const regrouped: Record<string, TransactionLog[]> = {};
    slicedLogs.forEach(({ dateStr, log }) => {
      if (!regrouped[dateStr]) regrouped[dateStr] = [];
      regrouped[dateStr].push(log);
    });

    return { visibleGrouped: regrouped, totalLogs: total };
  }, [groupedHistory, visibleCount]);


  const toggleGroup = (dateStr: string) => {
    setLocalExpanded(prev => ({
      ...prev,
      [dateStr]: !(prev[dateStr] ?? true)
    }));
  };

  // --- Hàm Render từng giao dịch ---
  const renderTransactionItem = (log: TransactionLog) => {
    const isRefund = log.type === "TRẢ HÀNG";
    const logTime = log.t || log.time?.split(" ")[1] || log.time;
    
    // Logic lấy màu sắc
    let typeColor = "#2563eb"; 
    if (isRefund) typeColor = "#dc2626"; 
    if (log.type.includes("NHẬP")) typeColor = "#7c3aed"; 
    if (log.type === "GHI NỢ" || log.type === "THU NỢ") typeColor = "#d97706";

    // ============================================================
    // THUẬT TOÁN TÍNH SỐ LƯỢNG CÒN LẠI ĐỂ ẨN/HIỆN NÚT HOÀN ĐƠN
    // ============================================================
    let remainingQtyToRefund = log.qty || 0;
    if (log.type === "BÁN" || log.type === "GHI NỢ") {
      // Tìm các bill TRẢ HÀNG diễn ra SAU bill bán này và có cùng TÊN sản phẩm
      const existingRefunds = allLogs.filter(h => 
        h.type === 'TRẢ HÀNG' && 
        Number(h.id) > Number(log.id) && 
        h.name.includes(cleanName(log.name))
      );
      // Cộng dồn số lượng đã hoàn
      const alreadyRefundedQty = existingRefunds.reduce((sum, h) => sum + Math.abs(h.qty || 0), 0);
      remainingQtyToRefund = (log.qty || 0) - alreadyRefundedQty;
    }
    // ============================================================

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
          background: isRefund ? "#fff5f5" : "transparent",
          opacity: (log.type === "BÁN" || log.type === "GHI NỢ") && remainingQtyToRefund <= 0 ? 0.6 : 1 // Đơn hoàn hết sẽ mờ đi xíu
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
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b", lineHeight: "1.4", textDecoration: remainingQtyToRefund <= 0 && !isRefund ? "line-through" : "none" }}>
            <span style={{ color: typeColor, marginRight: "6px", fontWeight: "bold", textDecoration: "none" }}>[{log.type}]</span>
            {cleanName(log.name)}
          </span>
          <span style={{ fontSize: "13px", fontWeight: "700", color: isRefund ? "#dc2626" : "#10b981", whiteSpace: "nowrap" }}>
            {isRefund ? "" : "+"}{log.total.toLocaleString('vi-VN')}đ
            <span style={{ fontSize: "11px", color: "#475569", fontWeight: "normal" }}> ({log.paymentMethod || "TM"})</span>
          </span>
        </div>

        {/* Dòng 3: Các nút thao tác */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
          
          {/* NÚT HOÀN ĐƠN (SẼ BIẾN MẤT NẾU REMAINING = 0) */}
          {(log.type === "BÁN" || log.type === "GHI NỢ") && remainingQtyToRefund > 0 && (
            <button 
              onClick={(e) => { e.stopPropagation(); handleRefund(log.id); }} 
              style={{ padding: "4px 10px", background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
            >
              <span role="img" aria-label="refund">↩️</span> Hoàn đơn ({remainingQtyToRefund})
            </button>
          )}

          {/* NÚT IN HÓA ĐƠN */}
          {(log.type === "BÁN" || log.type === "GHI NỢ" || log.type === "TRẢ HÀNG") && log.time && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); if (onPrintK80) onPrintK80(log); }} 
                style={{ padding: "4px 10px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
                title="In lại Bill Nhiệt K80"
              >
                🖨️ K80
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); if (onPrintA4) onPrintA4(log); }} 
                style={{ padding: "4px 10px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 2px 4px rgba(37,99,235,0.2)" }}
                title="In lại Hóa Đơn A4"
              >
                🖨️ A4
              </button>
            </>
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

      {/* KHU VỰC DANH SÁCH GIAO DỊCH TỐI ƯU HÓA */}
      <div style={{ maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "2px" }}>
        {Object.keys(visibleGrouped).length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8", fontSize: "14px", fontStyle: "italic" }}>
            Không tìm thấy lịch sử giao dịch phù hợp
          </div>
        ) : (
          Object.entries(visibleGrouped).map(([dateStr, logs]) => {
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

        {/* NÚT XEM THÊM (LOAD MORE) BẢO VỆ RAM */}
        {totalLogs > visibleCount && (
          <button
            onClick={() => setVisibleCount(prev => prev + 50)}
            style={{
              marginTop: "10px",
              padding: "12px",
              background: "#f1f5f9",
              border: "1px dashed #cbd5e1",
              borderRadius: "8px",
              color: "#3b82f6",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#e2e8f0")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#f1f5f9")}
          >
            ⏬ Xem thêm 50 giao dịch (Còn {totalLogs - visibleCount})
          </button>
        )}
      </div>
    </div>
  );
};

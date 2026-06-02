import React, { useState, useMemo, useEffect } from "react";
import { TransactionLog } from "../../types"; // Lấy Type chuẩn từ bộ não chung
import { cleanName } from "../../utils/helpers";

// Định nghĩa Props chuẩn xác để khớp nối với App.tsx
interface HistoryPanelProps {
  history: TransactionLog[];
  shift: string;
  handleRefund: (logId: string | number) => void;
  // Sửa lại hàm Reprint để nhận mode in
  handleReprint: (timeStr: string, mode: 'receipt_thermal' | 'receipt_a4') => void; 
}

const LOG_TYPES = ["Tất cả", "BÁN", "NHẬP", "NHẬP PO", "TRẢ HÀNG", "THU NỢ", "GHI NỢ", "TRẢ HÀNG NCC"];

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history, shift, handleRefund, handleReprint
}) => {
  // --- STATE TÌM KIẾM VÀ LỌC ---
  const [logSearchTerm, setLogSearchTerm] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState("Tất cả");
  const [localExpanded, setLocalExpanded] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(50);

  // --- LOGIC GOM NHÓM (CHUYỂN TỪ APP.TSX XUỐNG ĐÂY ĐỂ TĂNG TỐC UI) ---
  const groupedHistory = useMemo(() => {
    const groups: Record<string, TransactionLog[]> = {};
    let filteredLog = [...history];
    
    if (logSearchTerm) {
      const lower = logSearchTerm.toLowerCase();
      filteredLog = filteredLog.filter(l => 
        (l.name && l.name.toLowerCase().includes(lower)) || 
        (l.order_id && l.order_id.toLowerCase().includes(lower)) ||
        (l.customer && l.customer.toLowerCase().includes(lower))
      );
    }
    
    if (logTypeFilter !== "Tất cả") {
      filteredLog = filteredLog.filter(l => l.type === logTypeFilter);
    }
    
    filteredLog.forEach(log => {
      let dateKey = "Khác";
      if (log.time) {
        const parts = log.time.split(' ');
        const datePart = parts.find(p => p.includes('/'));
        if (datePart) dateKey = datePart.replace(',', '').trim();
      } else {
        dateKey = new Date(Math.floor(Number(log.id))).toLocaleDateString('vi-VN');
      }
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(log);
    });
    return groups;
  }, [history, logSearchTerm, logTypeFilter]);

  useEffect(() => { setVisibleCount(50); }, [groupedHistory]);

  // Logic hiển thị giới hạn (Load more)
  const { visibleGrouped } = useMemo(() => {
    const flatLogs: { dateStr: string; log: TransactionLog }[] = [];
    Object.entries(groupedHistory || {}).forEach(([dateStr, logs]) => {
      (logs || []).forEach(log => flatLogs.push({ dateStr, log }));
    });
    
    const slicedLogs = flatLogs.slice(0, visibleCount);
    const regrouped: Record<string, TransactionLog[]> = {};
    
    slicedLogs.forEach(({ dateStr, log }) => {
      if (!regrouped[dateStr]) regrouped[dateStr] = [];
      regrouped[dateStr].push(log);
    });
    return { visibleGrouped: regrouped };
  }, [groupedHistory, visibleCount]);

  const toggleGroup = (dateStr: string) => {
    setLocalExpanded(prev => ({ ...prev, [dateStr]: !(prev[dateStr] ?? true) }));
  };

  const exportToCSV = () => {
     alert("Tính năng xuất Excel sẽ được khôi phục khi tổng hợp file App.tsx");
  };

  // --- RENDER TỪNG DÒNG LỊCH SỬ ---
  const renderTransactionItem = (log: TransactionLog) => {
    if (!log) return null; 
    
    const safeType = log.type || "";
    const isRefund = safeType === "TRẢ HÀNG";
    const isImport = safeType.includes("NHẬP");
    const logTime = log.t || log.time?.split(" ")[1] || log.time || "---";
    
    let typeColor = "#2563eb"; 
    if (isRefund) typeColor = "#dc2626"; 
    if (isImport) typeColor = "#7c3aed"; 
    if (safeType === "GHI NỢ" || safeType === "THU NỢ") typeColor = "#d97706"; 

    let remainingQtyToRefund = log.qty || 0;
    if (safeType === "BÁN" || safeType === "GHI NỢ") {
      const safeLogName = log.name ? cleanName(log.name) : "";
      const existingRefunds = history.filter(h => h.type === 'TRẢ HÀNG' && h.order_id === log.order_id && (h.name || "").includes(safeLogName));
      const alreadyRefundedQty = existingRefunds.reduce((sum, h) => sum + Math.abs(h.qty || 0), 0);
      remainingQtyToRefund = (log.qty || 0) - alreadyRefundedQty;
    }

    return (
      <div key={log.id} style={{ flexShrink: 0, padding: "12px", borderBottom: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "8px", background: isRefund ? "#fff5f5" : (isImport ? "#faf5ff" : "transparent"), opacity: (safeType === "BÁN" || safeType === "GHI NỢ") && remainingQtyToRefund <= 0 ? 0.6 : 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: "12px" }}>
          <span><span role="img" aria-label="user">👤</span> {log.customer || (isImport ? "Nhà cung cấp" : "Khách lẻ")} {log.order_id && <b style={{ color: '#3b82f6', marginLeft: '6px' }}>({log.order_id})</b>}</span>
          <span style={{ fontFamily: "monospace" }}><span role="img" aria-label="time">🕒</span> {logTime}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b", lineHeight: "1.4", textDecoration: remainingQtyToRefund <= 0 && (!isRefund && !isImport) ? "line-through" : "none" }}>
              <span style={{ color: typeColor, marginRight: "6px", fontWeight: "bold" }}>[{safeType || "KHÁC"}]</span>
              {log.name ? cleanName(log.name) : "Giao dịch không tên"}
            </span>
            {log.qty && (
              <span style={{ fontSize: "12px", color: "#64748b" }}>SL: {Math.abs(log.qty)}</span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: "14px", fontWeight: "800", color: isRefund ? "#dc2626" : (safeType.includes("NHẬP") ? "#7c3aed" : "#10b981"), whiteSpace: "nowrap" }}>
              {isRefund ? "-" : "+"}{(log.total || 0).toLocaleString('vi-VN')}đ
            </span>
            <span style={{ fontSize: "11px", color: "#475569", fontWeight: "600", marginTop: "2px", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
               {log.paymentMethod || "Tiền Mặt"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
          {/* NÚT HOÀN ĐƠN */}
          {(safeType === "BÁN" || safeType === "GHI NỢ") && remainingQtyToRefund > 0 && (
            <button 
              onClick={(e) => { e.stopPropagation(); handleRefund(log.id); }} 
              style={{ padding: "4px 10px", background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
            >
              ↩️ Hoàn đơn ({remainingQtyToRefund})
            </button>
          )}

          {/* NÚT IN K80 & IN A4 */}
          {(safeType === "BÁN" || safeType === "GHI NỢ" || safeType === "TRẢ HÀNG") && log.time && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); handleReprint(log.time, 'receipt_thermal'); }} 
                style={{ padding: "4px 10px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
              >
                🖨️ K80
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleReprint(log.time, 'receipt_a4'); }} 
                style={{ padding: "4px 10px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
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
      {/* THANH TÌM KIẾM & LỌC */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input type="text" className="custom-input" style={{ padding: "10px 12px 10px 34px", margin: 0, fontSize: "14px", width: "100%", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: "8px" }} placeholder="Tìm Hóa đơn, Tên SP..." value={logSearchTerm || ""} onChange={(e) => setLogSearchTerm(e.target.value)} />
          <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}>🔍</span>
        </div>
        <select className="custom-input" style={{ width: "110px", padding: "10px", margin: 0, fontSize: "14px", height: "40px", cursor: "pointer", border: "1px solid #cbd5e1", borderRadius: "8px" }} value={logTypeFilter || "Tất cả"} onChange={(e) => setLogTypeFilter(e.target.value)}>
          {LOG_TYPES.map(type => (<option key={type} value={type}>{type}</option>))}
        </select>
        <button onClick={exportToCSV} style={{ padding: "0 12px", height: "40px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}>📊</button>
      </div>

      {/* DANH SÁCH LỊCH SỬ */}
      <div style={{ maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "2px" }}>
        {Object.keys(visibleGrouped || {}).length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8", fontSize: "14px", fontStyle: "italic" }}>Không tìm thấy lịch sử</div>
        ) : (
          Object.entries(visibleGrouped).map(([dateStr, logs]) => {
            const isExpanded = localExpanded[dateStr] ?? true; 
            return (
              <div key={dateStr} style={{ flexShrink: 0, display: "flex", flexDirection: "column", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#ffffff", overflow: "hidden" }}>
                <div onClick={() => toggleGroup(dateStr)} style={{ padding: "12px", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", borderBottom: isExpanded ? "1px solid #e2e8f0" : "none" }}>
                  <strong style={{ fontSize: "13px", color: "#1e293b" }}>📅 Ngày {dateStr}</strong>
                  <span style={{ fontSize: "12px", color: "#4b5563", background: "#e5e7eb", padding: "2px 8px", borderRadius: "10px", fontWeight: "600" }}>{(logs || []).length} đơn {isExpanded ? "▲" : "▼"}</span>
                </div>
                {isExpanded && (<div style={{ display: "flex", flexDirection: "column" }}>{(logs || []).map(log => renderTransactionItem(log))}</div>)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
